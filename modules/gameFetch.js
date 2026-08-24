/* API реальной игры C2Gaming (см. landing-c2gaming.md).
   ШАГ 1: только POST /session. WS и /register добавим, когда этот шаг
   подтвердится живым ответом сервера.

   Автозапуска нет — дёргаем руками из консоли через window.__gameApi,
   чтобы не трогать текущую логику лендинга. */

import { getUrlParameter } from "./params";
import { geoData } from "./geoLocation";

// Относительный путь: запросы уходят на тот же домен, что и лендинг, а
// проксирует их nginx на VPS (fastpanel2-includes/c2gaming.conf) — он же
// подставляет auth-токен бэка. Прямого обращения к API из браузера нет.
const API_BASE = "/api/landing/c2gaming";

// identifier игры в каталоге (aggregator ggate). Переопределяется через ?gameId=
const DEFAULT_GAME_ID = "vs20olympgate_prg";
const DEFAULT_FREESPINS = 100;

const CLICK_ID_KEY = "c2ClickId";

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
    throw Object.assign(new Error("session failed"), {
      status: response.status,
      data,
    });
  }

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
  }

  // иконку по гео ставит gameHeader.js — перебиваем валютой из сессии
  if (currencyImg && snapshot.currency) {
    const code = snapshot.currency.toUpperCase();
    currencyImg.src = `${CURRENCY_CDN}/${code}.svg`;
    currencyImg.alt = code;
    currencyImg.classList.remove("hidden");
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

// порог взят, но результат спина ещё не пришёл
let pendingCheck = false;

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
// так же, — но решает он ровно один вопрос: ждать анимацию или глушить сразу.
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
    lastSpinAt !== null && now - lastSpinAt < FAST_SPIN_MS ? fastSpinStreak + 1 : 0;

  if (fastSpinStreak >= FAST_SPIN_STREAK) likelyAutoplay = true;

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

  gameSocket?.close();
  gameSocket = null;
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

  // закрыть её нельзя — крутить дальше уже не дадим
  overlay.classList.add("is-open");
  // выгружаем под блюром — смена картинки за формой не бросается в глаза
  stopGame();
  // форма рисует заголовок по актуальному снапшоту
  window.dispatchEvent(new CustomEvent("c2:gate-opened"));
}

const openRegisterModal = () => {
  if (!document.querySelector(".two-step-overlay")) return;

  // Игра крутит сама — ждать нечего: пауза на анимацию обернулась бы лишними
  // спинами. При ручной игре даём барабанам доиграть, чтобы игрок увидел выигрыш.
  if (likelyAutoplay) {
    revealForm();
    return;
  }

  gateTimeoutId = window.setTimeout(revealForm, SPIN_ANIMATION_MS);
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
    return;
  }

  // выигрыша нет и на следующем пуше — порог правда пустой
  pendingCheck = false;
  spinThreshold = nextThreshold(spins);
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
    return;
  }

  isRestarting = true;
  restartCount += 1;

  try {
    gameSocket?.close();

    const session = await startSession();

    // spinCount в новой сессии считается с нуля
    spinThreshold = SPIN_THRESHOLDS[0];
    pendingCheck = false;
    spinsAtLock = null;
    autoplayDetected = false;
    lastSpinAt = null;
    lastSpinCount = null;
    fastSpinStreak = 0;
    likelyAutoplay = false;
    applySession(session);
  } catch {
    // сюда попадаем в том числе на 429 — rate limit 10 на clickId за 60с
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

export const connectStateSocket = (onState, token) => {
  const wsToken = token || gameSession.subscribeToken;

  if (!wsToken) {
    return null;
  }

  const wsUrl = `${toWsUrl(API_BASE)}/ws?token=${encodeURIComponent(wsToken)}`;

  const socket = new WebSocket(wsUrl);

  socket.addEventListener("message", (event) => {
    let message = null;

    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }

    if (message.type !== "state") {
      return;
    }

    gameSession.snapshot = message.payload;
    watchSpinPace(message.payload);
    watchSpinsAfterLock(message.payload);

    onState?.(message.payload);
  });

  socket.addEventListener("close", (event) => {
    // 4401 — нет token, 4404 — сессия не найдена: переподключаться бессмысленно
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
const showGameUnavailable = () => {
  document.querySelector(".game-frame")?.remove();
  document.querySelector(".game-empty")?.classList.add("is-visible");
};

if (urlClickId && urlGameId) {
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
  reset: () => localStorage.removeItem(CLICK_ID_KEY),
};
