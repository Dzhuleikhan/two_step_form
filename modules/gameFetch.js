/* API реальной игры C2Gaming (см. landing-c2gaming.md).
   ШАГ 1: только POST /session. WS и /register добавим, когда этот шаг
   подтвердится живым ответом сервера.

   Автозапуска нет — дёргаем руками из консоли через window.__gameApi,
   чтобы не трогать текущую логику лендинга. */

import { getUrlParameter } from "./params";
import { geoData, geoReady } from "./geoLocation";
import { showFreespinsToast } from "./toast";

// Относительный путь: запросы уходят на тот же домен, что и лендинг, а
// проксирует их nginx на VPS (fastpanel2-includes/c2gaming.conf) — он же
// подставляет auth-токен бэка. Прямого обращения к API из браузера нет.
const API_BASE = "/api/landing/c2gaming";

// identifier игры в каталоге (aggregator ggate). Переопределяется через ?gameId=
const DEFAULT_GAME_ID = "vs20olympgate_prg";
const DEFAULT_FREESPINS = 100;

const CLICK_ID_KEY = "c2ClickId";

// | DEBUG LOG
// Ловим редкий баг «модалка не открылась, игра дала открутить все 100 спинов».
// Пишем сразу в три места, чтобы причину было видно в любой момент:
//   1. console — открыл DevTools и смотришь события живьём;
//   2. window.__gameLog — весь буфер разом, если консоль открыл уже после;
//   3. localStorage — лог переживает перезагрузку страницы (__gameApi.prevLog()).
const LOG_LIMIT = 500;
const LOG_STORAGE_KEY = "c2GameLog";

export const gameLog = [];

// проблемные события красим, чтобы не выискивать их глазами в потоке пушей
const LOG_COLORS = {
  "ws:close": "#ff9800",
  "ws:error": "#f44336",
  "ws:silent": "#f44336",
  "ws:give-up": "#f44336",
  "ws:reconnect": "#ff9800",
  "ws:open": "#4caf50",
  "gate:open": "#4caf50",
  "gate:reveal": "#4caf50",
  "gate:threshold-moved": "#ff9800",
  "session:failed": "#f44336",
  "restart:failed": "#f44336",
  "game:unavailable": "#f44336",
};

const saveLog = () => {
  try {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(gameLog));
  } catch {
    // приватный режим или переполнение — лог просто не переживёт рефреш
  }
};

const logEvent = (type, data) => {
  const entry = {
    at: new Date().toTimeString().slice(0, 8),
    type,
    ...data,
  };

  gameLog.push(entry);
  if (gameLog.length > LOG_LIMIT) gameLog.shift();

  saveLog();

  console.log(
    `%c[c2] ${entry.at} ${type}`,
    `color:${LOG_COLORS[type] || "#9e9e9e"};font-weight:bold`,
    data || "",
  );
};

// Лог прошлой загрузки страницы забираем до того, как затрём его своим:
// после рефреша именно он объясняет, что случилось перед перезагрузкой.
let prevGameLog = [];

try {
  prevGameLog = JSON.parse(localStorage.getItem(LOG_STORAGE_KEY)) || [];
  localStorage.removeItem(LOG_STORAGE_KEY);
} catch {
  prevGameLog = [];
}

// | CLICK ID
// clickId должен пережить рефреш: /register потом потребует тот же id,
// что ушёл в /session.
export const getClickId = () => {
  const fromUrl = getUrlParameter("cid");
  if (fromUrl) {
    try {
      localStorage.setItem(CLICK_ID_KEY, fromUrl);
    } catch {}
    return fromUrl;
  }

  let stored = null;
  try {
    stored = localStorage.getItem(CLICK_ID_KEY);
  } catch {}
  if (stored) return stored;

  // локальная отладка без cid в ссылке
  const generated = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    localStorage.setItem(CLICK_ID_KEY, generated);
  } catch {}
  return generated;
};

export const getGameId = () => getUrlParameter("gameId") || DEFAULT_GAME_ID;

// сервер принимает integer 1–100; мусор и выход за диапазон заменяем дефолтом
export const getFreespinsCount = () => {
  const fromUrl = Number.parseInt(getUrlParameter("freespinsCount"), 10);

  if (!Number.isInteger(fromUrl) || fromUrl < 1 || fromUrl > 100) {
    return DEFAULT_FREESPINS;
  }

  return fromUrl;
};

// | STATE
// Ответ /session: url для iframe, токен для будущего WS и первый snapshot.
export let gameSession = {
  url: null,
  subscribeToken: null,
  snapshot: null,
};

// | POST /session
export const startSession = async ({
  clickId = getClickId(),
  gameId = getGameId(),
  freespinsCount = getFreespinsCount(),
} = {}) => {
  // валюта нужна в теле запроса, поэтому ждём гео здесь — но ждёт только сессия,
  // а не инициализация всего ленда
  await geoReady;

  const body = {
    clickId,
    gameId,
    // язык и валюта из гео-детекта лендинга
    lang: localStorage.getItem("preferredLanguage") || "en",
    currency: geoData?.currency?.code,
  };
  // сервер валидирует integer 1–100, мусор лучше не слать вовсе
  if (Number.isInteger(freespinsCount)) body.freespinsCount = freespinsCount;

  const response = await fetch(`${API_BASE}/session`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // 400 — нет clickId/gameId или кривой freespinsCount, 404 — игры нет
    // в каталоге, 429 — rate limit
    logEvent("session:failed", { status: response.status });

    throw Object.assign(new Error("session failed"), {
      status: response.status,
      data,
    });
  }

  logEvent("session:ok", {
    spins: data.snapshot?.spinCount,
    left: data.snapshot?.freespinsRemaining,
    win: data.snapshot?.totalWin,
    hasSocketToken: Boolean(data.subscribeToken),
  });

  gameSession = {
    url: data.url,
    subscribeToken: data.subscribeToken,
    snapshot: data.snapshot,
  };

  // Таймер формы живёт ровно одну игровую сессию. Без этого дедлайн из
  // localStorage переживал бы и рестарт, и новый заход — модалка открывалась
  // с уже истёкшим 0:00.
  window.dispatchEvent(new CustomEvent("c2:session-started"));

  return gameSession;
};

// | IFRAME
// Ответ /session отдаёт готовый url игры — им заменяем src статичного iframe.
export const applyGameUrl = (url) => {
  const gameFrame = document.querySelector(".game-frame");

  if (!gameFrame) {
    return false;
  }
  if (!url) {
    return false;
  }

  gameFrame.src = url;
  return true;
};

// | HEADER
// Денежные поля snapshot приходят строками — приводим к числу перед форматом.
const CURRENCY_CDN = "https://3344112-img.b-cdn.net/currency_icons";

const parseMoney = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const applySnapshotToHeader = (snapshot) => {
  if (!snapshot) return;

  const balanceEl = document.querySelector(".game-header-balance");
  const currencyImg = document.querySelector(".game-header-currency");

  // в хедере показываем накопленный выигрыш, не баланс
  if (balanceEl) {
    balanceEl.textContent = parseMoney(snapshot.totalWin).toFixed(2);
    balanceEl.classList.remove("skeleton-text");
  }

  // иконку по гео ставит gameHeader.js — перебиваем валютой из сессии
  if (currencyImg && snapshot.currency) {
    const code = snapshot.currency.toUpperCase();
    currencyImg.src = `${CURRENCY_CDN}/${code}.svg`;
    currencyImg.alt = code;
    currencyImg.classList.remove("hidden", "skeleton");
  }
};

// | POST /register
// Тело — те же поля, что раньше уходили query-строкой в редиректе, плюс clickId
// сессии. В ответе { token, redirectUrl, alreadyConverted }.
export const registerPlayer = async (payload) => {
  const response = await fetch(`${API_BASE}/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cid: getClickId(), ...payload }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // 409 — телефон занят, 404 — сессия/игра не найдены, 429 — rate limit
    throw Object.assign(new Error(data?.message || "register failed"), {
      status: response.status,
      data,
    });
  }

  return data;
};

// | REGISTER GATE
// Ловим момент, когда игрок накрутил лимит спинов И у него есть выигрыш:
// блокируем фрейм и показываем форму. Если на пороге выигрыша нет, показывать
// нечего — выдаём ещё пачку спинов и ждём следующего порога.
// Пороги проверки: первый на 20, дальше ровным шагом по 10 до 100.
const SPIN_THRESHOLDS = [20, 30, 40, 50, 60, 70, 80, 90, 100];

// null = пороги исчерпаны, ждём конца спинов и рестарта
let spinThreshold = SPIN_THRESHOLDS[0];

// Сервер шлёт один пуш на спин (reason: GAME_PLAY_FINAL) сразу, как посчитал
// раунд — клиент в это время ещё крутит барабаны. Ждать нечего: фрейм блокируем
// сразу, а форму показываем, когда анимация доиграет.
const SPIN_ANIMATION_MS = 4000;

// в турбо-режиме барабаны останавливаются заметно быстрее
const FAST_SPIN_ANIMATION_MS = 1200;

// порог взят, но результат спина ещё не пришёл
let pendingCheck = false;

// spinCount, на котором взвели pendingCheck. Сервер шлёт несколько пушей на один
// спин (доезд баланса, betType), и раньше порог сгорал на таком служебном пуше:
// выигрыш приезжал третьим сообщением, а гейт уже ждал следующей сотни. Порог
// признаём пустым, только когда пошёл следующий спин.
let pendingSpins = null;

// | AUTOPLAY DETECTION
// По темпу спинов автоспин от турбо-режима не отличить. Но после lockFrame()
// клики во фрейм не проходят, значит любой новый спин с этого момента запущен
// самой игрой — это и есть автоспин, без догадок.
let spinsAtLock = null;
let autoplayDetected = false;

// Ждать первого спина после блокировки — значит подарить автоспину минимум один
// лишний прокрут, а на макс скорости и все три (пока тикает SPIN_ANIMATION_MS).
// Поэтому смотрим на темп пушей ещё до порога: три спина подряд быстрее полутора
// секунд человек накликать не может. Признак не строгий — турбо-режим выглядит
// так же, — но решает он ровно один вопрос: насколько сокращать паузу на анимацию.
//
// Флаг держим только пока темп реально быстрый: раньше он выставлялся навсегда,
// и одна быстрая серия в начале сессии приводила к тому, что на пороге форма
// выскакивала мгновенно — поверх ещё крутящихся барабанов.
const FAST_SPIN_MS = 1500;
const FAST_SPIN_STREAK = 3;

let lastSpinAt = null;
let lastSpinCount = null;
let fastSpinStreak = 0;
let likelyAutoplay = false;

const watchSpinPace = (snapshot) => {
  const spins = Number(snapshot.spinCount) || 0;

  // сервер шлёт пуши и без нового спина (доезжает выигрыш) — такие не считаем
  if (lastSpinCount !== null && spins <= lastSpinCount) return;

  const now = Date.now();

  fastSpinStreak =
    lastSpinAt !== null && now - lastSpinAt < FAST_SPIN_MS
      ? fastSpinStreak + 1
      : 0;

  likelyAutoplay = fastSpinStreak >= FAST_SPIN_STREAK;

  lastSpinAt = now;
  lastSpinCount = spins;
};

const watchSpinsAfterLock = (snapshot) => {
  if (spinsAtLock === null || autoplayDetected) return;

  if ((Number(snapshot.spinCount) || 0) > spinsAtLock) {
    // клики уже не проходят — значит спин запустила сама игра
    autoplayDetected = true;
    revealForm();
  }
};

// берём первый порог выше текущего spinCount: сервер может прислать скачок
const nextThreshold = (spins) =>
  SPIN_THRESHOLDS.find((threshold) => threshold > spins) ?? null;
let gateOpened = false;

const lockFrame = () => {
  document.querySelector(".game-frame")?.classList.add("is-locked");
};

// Autoplay крутится внутри игры без кликов, поэтому is-locked его не берёт:
// cross-origin iframe командам снаружи не подчиняется. Перезагружаем фрейм тем же
// url — автоспин сбрасывается, а за формой остаётся картинка игры, а не чернота.
// Заодно закрываем WS, чтобы суммы в форме остались теми, что игрок видел.
let gameStopped = false;

const stopGame = () => {
  if (gameStopped) return;
  gameStopped = true;

  const gameFrame = document.querySelector(".game-frame");

  // при ручной игре хватает is-locked: без кликов новый спин не начнётся,
  // и подменять игроку экран незачем
  if ((autoplayDetected || likelyAutoplay) && gameFrame && gameSession.url) {
    // Перезагрузка тем же url не останавливает игру сразу: старый документ живёт,
    // пока грузится новый, и автоспин успевает домотать ещё пару прокрутов — отсюда
    // разброс «остановился на 31/32». about:blank сносит браузерный контекст игры
    // мгновенно, а следом возвращаем url, чтобы за формой осталась картинка игры.
    gameFrame.src = "about:blank";
    window.setTimeout(() => {
      gameFrame.src = gameSession.url;
    }, 0);
  }

  closeSocket();
};

let formShown = false;
let gateTimeoutId = null;

function revealForm() {
  if (formShown) return;

  const overlay = document.querySelector(".two-step-overlay");

  if (!overlay) return;

  formShown = true;

  if (gateTimeoutId) {
    window.clearTimeout(gateTimeoutId);
    gateTimeoutId = null;
  }

  logEvent("gate:reveal", { autoplayDetected, likelyAutoplay });

  // закрыть её нельзя — крутить дальше уже не дадим
  overlay.classList.add("is-open");
  // выгружаем под блюром — смена картинки за формой не бросается в глаза
  stopGame();
  // форма рисует заголовок по актуальному снапшоту
  window.dispatchEvent(new CustomEvent("c2:gate-opened"));
}

const openRegisterModal = () => {
  if (!document.querySelector(".two-step-overlay")) return;

  // Барабанам даём доиграть в любом случае — иначе форма накрывает спин, за
  // который игрок только что заплатил кликом. При быстром темпе пауза короче:
  // настоящий автоспин всё равно перехватит watchSpinsAfterLock — он ловит
  // любой новый спин после блокировки и показывает форму немедленно.
  const delay = likelyAutoplay ? FAST_SPIN_ANIMATION_MS : SPIN_ANIMATION_MS;

  gateTimeoutId = window.setTimeout(revealForm, delay);
};

export const checkRegisterGate = (snapshot) => {
  if (gateOpened || !snapshot) return;

  const spins = Number(snapshot.spinCount) || 0;
  const hasWin = parseMoney(snapshot.totalWin) > 0;
  const gateAt = spinThreshold;

  // поля может не прийти — тогда не считаем, что спины кончились
  const rawLeft = Number(snapshot.freespinsRemaining);
  const noSpinsLeft = Number.isFinite(rawLeft) && rawLeft <= 0;

  // выигрыш есть: порог набран или крутить больше нечем — тянуть незачем
  if (hasWin && (gateAt === null || spins >= gateAt || noSpinsLeft)) {
    gateOpened = true;
    // всё, что накрутится после этой отметки, — работа автоспина
    spinsAtLock = spins;

    logEvent("gate:open", {
      spins,
      gateAt,
      win: snapshot.totalWin,
      likelyAutoplay,
    });

    // блокируем сразу, чтобы не начал новый спин, но анимации это не мешает
    lockFrame();
    openRegisterModal();

    return;
  }

  // спины кончились, а выигрыша так и нет — выдаём новую пачку
  if (noSpinsLeft) {
    restartSession();
    return;
  }

  if (gateAt === null || spins < gateAt) return;

  // totalWin в пуше отстаёт: сообщение о спине приходит до зачисления выигрыша,
  // результат приезжает следующим. Поэтому порог не двигаем сразу — ждём пуш.
  if (!pendingCheck) {
    pendingCheck = true;
    pendingSpins = spins;
    logEvent("gate:pending", { spins, gateAt });
    return;
  }

  // это всё ещё тот же спин: выигрыш по нему может приехать следующим пушем,
  // порог трогать рано
  if (spins <= pendingSpins) return;

  // пошёл следующий спин, а выигрыша так и нет — порог правда пустой
  pendingCheck = false;
  pendingSpins = null;
  spinThreshold = nextThreshold(spins);

  logEvent("gate:threshold-moved", { spins, from: gateAt, to: spinThreshold });
};

// | RESTART
// Спины закончились без единого выигрыша: поднимаем новую сессию с тем же
// clickId и начинаем отсчёт порога заново.
const MAX_RESTARTS = 5;

let restartCount = 0;
let isRestarting = false;

const restartSession = async () => {
  if (isRestarting) return;

  if (restartCount >= MAX_RESTARTS) {
    logEvent("restart:limit", { restartCount });
    return;
  }

  isRestarting = true;
  restartCount += 1;

  logEvent("restart", { attempt: restartCount });

  try {
    closeSocket();

    const session = await startSession();

    // spinCount в новой сессии считается с нуля
    spinThreshold = SPIN_THRESHOLDS[0];
    pendingCheck = false;
    pendingSpins = null;
    spinsAtLock = null;
    autoplayDetected = false;
    lastSpinAt = null;
    lastSpinCount = null;
    fastSpinStreak = 0;
    likelyAutoplay = false;
    applySession(session);
  } catch (error) {
    // сюда попадаем в том числе на 429 — rate limit 10 на clickId за 60с.
    // Новой сессии нет и пушей больше не будет — гейт до перезагрузки мёртв.
    logEvent("restart:failed", { status: error?.status ?? null });
  } finally {
    isRestarting = false;
  }
};

// | WS /ws?token=
// Сервер только пушит: после connect прилетает текущий snapshot, дальше —
// при каждом обновлении. Токен — subscribeToken из /session, не JWT.
export let gameSocket = null;

const toWsUrl = (base) =>
  base.startsWith("http")
    ? base.replace(/^http/, "ws")
    : `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}${base}`;

// | RECONNECT
// Гейт регистрации живёт только на этих пушах: пропал сокет — игрок докрутит
// все спины, и модалка не откроется. Поэтому разрыв не игнорируем, а
// переподключаемся с нарастающей паузой.
const WS_RECONNECT_MIN_MS = 1000;
const WS_RECONNECT_MAX_MS = 15000;
const WS_MAX_ATTEMPTS = 12;

// сокет молчит, хотя числится открытым (half-open после смены сети или сна
// телефона) — поднимаем заново
const WS_SILENCE_MS = 60000;
const WS_WATCHDOG_MS = 15000;

// параметры последнего подключения: нужны, чтобы поднять сокет заново
let wsHandler = null;
let wsLastToken = null;

let wsAttempts = 0;
let wsReconnectId = null;
let wsWatchdogId = null;
let wsLastMessageAt = 0;

// закрыли сами (гейт открылся, рестарт сессии) — переподключаться не нужно
let wsIntentionalClose = false;

// закрытие сокета своей волей: снимаем и запланированный реконнект
export const closeSocket = () => {
  wsIntentionalClose = true;

  if (wsReconnectId) {
    window.clearTimeout(wsReconnectId);
    wsReconnectId = null;
  }

  gameSocket?.close();
  gameSocket = null;
};

const scheduleReconnect = () => {
  if (wsIntentionalClose || gateOpened || !wsLastToken || wsReconnectId) return;

  // сокет уже живёт или как раз поднимается — второй только задвоил бы пуши
  const state = gameSocket?.readyState;
  if (state === WebSocket.CONNECTING || state === WebSocket.OPEN) return;

  if (wsAttempts >= WS_MAX_ATTEMPTS) {
    logEvent("ws:give-up", { attempts: wsAttempts });
    return;
  }

  const delay = Math.min(
    WS_RECONNECT_MIN_MS * 2 ** wsAttempts,
    WS_RECONNECT_MAX_MS,
  );

  wsAttempts += 1;
  logEvent("ws:reconnect", { attempt: wsAttempts, delay });

  wsReconnectId = window.setTimeout(() => {
    wsReconnectId = null;
    connectStateSocket(wsHandler, wsLastToken);
  }, delay);
};

// Сокет может «умереть молча»: TCP оборвался, а readyState всё ещё OPEN.
// Раз в WS_WATCHDOG_MS проверяем, что пуши идут и сокет жив.
const startWatchdog = () => {
  if (wsWatchdogId) return;

  wsWatchdogId = window.setInterval(() => {
    // гейт уже открыт — следить больше не за чем
    if (wsIntentionalClose || gateOpened) {
      window.clearInterval(wsWatchdogId);
      wsWatchdogId = null;
      return;
    }

    // сокета нет, а реконнект почему-то не встал — поднимаем
    if (!gameSocket) {
      scheduleReconnect();
      return;
    }

    // CONNECTING / CLOSING — состояние переходное, ждём следующего тика
    if (gameSocket.readyState !== WebSocket.OPEN) return;

    const silentFor = Date.now() - wsLastMessageAt;

    if (silentFor > WS_SILENCE_MS) {
      logEvent("ws:silent", { silentFor });
      // close-обработчик сам поставит переподключение
      gameSocket.close();
    }
  }, WS_WATCHDOG_MS);
};

// Возврат на вкладку — самый частый момент, когда сокет оказывается мёртвым:
// в фоне его рвут прокси и энергосбережение мобильных.
document.addEventListener("visibilitychange", () => {
  if (document.hidden || wsIntentionalClose || gateOpened || !wsLastToken)
    return;

  if (gameSocket?.readyState === WebSocket.OPEN) return;

  logEvent("ws:wake", { readyState: gameSocket?.readyState ?? null });
  // ручной возврат в игру — ждать нарастающую паузу незачем
  wsAttempts = 0;
  scheduleReconnect();
});

export const connectStateSocket = (onState, token) => {
  const wsToken = token || gameSession.subscribeToken;

  if (!wsToken) {
    logEvent("ws:no-token");
    return null;
  }

  // запоминаем, чем подключались: реконнект поднимет сокет теми же параметрами
  wsHandler = onState;
  wsLastToken = wsToken;
  wsIntentionalClose = false;
  wsLastMessageAt = Date.now();

  const wsUrl = `${toWsUrl(API_BASE)}/ws?token=${encodeURIComponent(wsToken)}`;

  const socket = new WebSocket(wsUrl);

  socket.addEventListener("open", () => {
    // соединение поднялось — отсчёт попыток начинаем заново
    wsAttempts = 0;
    wsLastMessageAt = Date.now();
    logEvent("ws:open");
    startWatchdog();
  });

  socket.addEventListener("message", (event) => {
    wsLastMessageAt = Date.now();

    let message = null;

    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }

    if (message.type !== "state") {
      logEvent("ws:unknown-type", { type: message.type });
      return;
    }

    gameSession.snapshot = message.payload;

    logEvent("state", {
      spins: message.payload.spinCount,
      win: message.payload.totalWin,
      left: message.payload.freespinsRemaining,
      reason: message.payload.reason,
      threshold: spinThreshold,
      pending: pendingCheck,
    });

    watchSpinPace(message.payload);
    watchSpinsAfterLock(message.payload);

    onState?.(message.payload);
  });

  socket.addEventListener("error", () => {
    logEvent("ws:error", { readyState: socket.readyState });
  });

  socket.addEventListener("close", (event) => {
    logEvent("ws:close", { code: event.code, intentional: wsIntentionalClose });

    // закрылся не тот сокет, что сейчас в работе — реконнект уже не про него
    if (gameSocket === socket) gameSocket = null;

    // 4401 — нет token, 4404 — сессия не найдена: переподключаться бессмысленно
    if (event.code === 4401 || event.code === 4404) return;

    scheduleReconnect();
  });

  gameSocket = socket;
  return socket;
};

// | BOOTSTRAP
// Раскладываем сессию по странице: iframe, хедер, гейт и подписка на state.
// Используется и первым запуском, и рестартом.
function applySession(session) {
  applyGameUrl(session.url);
  applySnapshotToHeader(session.snapshot);
  checkRegisterGate(session.snapshot);

  // каждый пуш state перерисовывает хедер и двигает гейт регистрации
  connectStateSocket((snapshot) => {
    applySnapshotToHeader(snapshot);
    checkRegisterGate(snapshot);
  });
}

// | AUTOSTART
// Сессию поднимаем, только если в ссылке есть и cid, и gameId.
const urlClickId = getUrlParameter("cid");
const urlGameId = getUrlParameter("gameId");

// игры нет ни при пустых параметрах, ни при упавшем /session — заглушка одна
const showGameUnavailable = (error) => {
  logEvent("game:unavailable", { status: error?.status ?? null });

  document.querySelector(".game-frame")?.remove();
  document.querySelector(".game-empty")?.classList.add("is-visible");

  // прелоадер ждёт load фрейма, которого уже не будет — снимаем его руками
  window.dispatchEvent(new Event("game:settled"));
};

// Слот на медленном интернете грузится долго, и всё это время игрок смотрит в
// пустоту. Тост сразу говорит, что фриспины уже выданы и надо просто подождать.
const TOAST_DELAY_MS = 500;

if (urlClickId && urlGameId) {
  setTimeout(() => showFreespinsToast(getFreespinsCount()), TOAST_DELAY_MS);

  startSession({ clickId: urlClickId, gameId: urlGameId })
    .then(applySession)
    .catch(showGameUnavailable);
} else {
  showGameUnavailable();
}

// для ручной проверки: await __gameApi.startSession() в консоли
window.__gameApi = {
  get session() {
    return gameSession;
  },
  getClickId,
  getGameId,
  getFreespinsCount,
  startSession,
  applyGameUrl,
  applySnapshotToHeader,
  connectStateSocket,
  checkRegisterGate,
  registerPlayer,
  get socket() {
    return gameSocket;
  },
  get log() {
    return gameLog;
  },
  // лог до последней перезагрузки страницы
  prevLog: () => {
    console.table(prevGameLog);
    return prevGameLog;
  },
  // копия лога одной строкой — удобно приложить к баг-репорту
  dumpLog: () => JSON.stringify(gameLog, null, 2),
  reset: () => localStorage.removeItem(CLICK_ID_KEY),
};

// живая ссылка на буфер: в консоли достаточно набрать __gameLog
window.__gameLog = gameLog;

console.log(
  "%c[c2] лог игры включён: __gameLog — текущий, __gameApi.prevLog() — до рефреша",
  "color:#755eeb;font-weight:bold",
);
