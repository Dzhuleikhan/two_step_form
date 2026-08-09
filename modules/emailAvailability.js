// Проверка занятости почты через same-origin прокси на nginx ленда.
// Эндпоинт: POST /api/email/check-available  →  { available: true|false }.
// Бэк (прод) отдаёт 201, поэтому ориентируемся на ТЕЛО ответа, а не на статус.
// NB: это НЕ Zeruh /api/email/verify (доставляемость) — другая проверка (занятость в БД).
//
// Принцип fail-open: блокируем форму ТОЛЬКО при однозначном available:false (занята).
// Любая ошибка (сеть, таймаут, 4xx/5xx, кривое тело) → не блокируем — лид не теряем.

const ENDPOINT = "/api/email/check-available";
// Таймаут на проверку: медленный API не должен держать кнопку —
// по истечении считаем «не знаем» (fail-open), а добьём на сабмите/переходе.
const TIMEOUT_MS = 1500;
// Анти-перебор через форму: максимум разных адресов на проверку за сессию страницы.
// Превышение → перестаём слать запросы (fail-open). Реальная граница — nginx email_rl.
const MAX_CHECKS = 20;

// email(lowercased) -> { pending: bool, errored: bool, available: bool|null }
const cache = new Map();
let checksUsed = 0;

// Нормализация под совпадение с серверной (trim + toLowerCase).
export function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

// Текущий вердикт по адресу (или null, если ещё не проверяли).
export function getEmailStatus(email) {
  return cache.get(normalizeEmail(email)) || null;
}

// Запускает (или переиспользует) проверку адреса. Возвращает Promise с записью.
export function checkEmailAvailability(email) {
  const key = normalizeEmail(email);
  if (!key) return Promise.resolve(null);

  const cached = cache.get(key);
  // Уже знаем результат или проверка в процессе — не дёргаем повторно
  // (кроме случая, когда прошлая попытка упала — тогда пробуем снова).
  if (cached && (cached.pending || !cached.errored)) {
    return cached.promise || Promise.resolve(cached);
  }

  // Кап на перебор: исчерпали лимит разных адресов → fail-open без запроса.
  if (checksUsed >= MAX_CHECKS) {
    const capped = { pending: false, errored: true, available: null };
    cache.set(key, capped);
    return Promise.resolve(capped);
  }
  checksUsed++;

  const entry = { pending: true, errored: false, available: null };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  entry.promise = fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: key }),
    signal: controller.signal,
  })
    .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
    .then((data) => {
      entry.available =
        data && typeof data.available === "boolean" ? data.available : null;
      if (entry.available === null) entry.errored = true; // неожиданное тело → fail-open
    })
    .catch(() => {
      entry.errored = true;
      entry.available = null;
    })
    .finally(() => {
      clearTimeout(timer);
      entry.pending = false;
      delete entry.promise;
    });

  cache.set(key, entry);
  return entry.promise.then(() => entry);
}

// Локализованный текст для занятой почты (как у phoneAvailability — вшито сюда).
// Языки без своего перевода → en-фолбэк.
// NB: переводы am/ha/yo/ig/tw/rw/sw/mt/ga/lb — best-effort, нужна вычитка носителями.
const TAKEN_MESSAGES = {
  en: "This email can't be used, please enter another",
  ru: "Этот e-mail нельзя использовать, укажите другой",
  uk: "Цю пошту не можна використати, вкажіть іншу",
  pl: "Tego adresu e-mail nie można użyć, podaj inny",
  de: "Diese E-Mail kann nicht verwendet werden, bitte eine andere angeben",
  fr: "Cet e-mail ne peut pas être utilisé, veuillez en indiquer un autre",
  es: "Este correo no se puede usar, indica otro",
  pt: "Este e-mail não pode ser usado, informe outro",
  it: "Questa email non può essere usata, inseriscine un'altra",
  nl: "Dit e-mailadres kan niet worden gebruikt, voer een ander in",
  cs: "Tento e-mail nelze použít, zadejte jiný",
  sk: "Tento e-mail nie je možné použiť, zadajte iný",
  sl: "Tega e-naslova ni mogoče uporabiti, vnesite drugega",
  hr: "Ovaj e-mail se ne može koristiti, unesite drugi",
  hu: "Ez az e-mail nem használható, adjon meg másikat",
  ro: "Acest e-mail nu poate fi folosit, introduceți altul",
  bg: "Този имейл не може да се използва, посочете друг",
  el: "Αυτό το email δεν μπορεί να χρησιμοποιηθεί, καταχωρίστε άλλο",
  sv: "Den här e-postadressen kan inte användas, ange en annan",
  nb: "Denne e-posten kan ikke brukes, oppgi en annen",
  da: "Denne e-mail kan ikke bruges, angiv en anden",
  fi: "Tätä sähköpostia ei voi käyttää, anna toinen",
  et: "Seda e-posti ei saa kasutada, sisestage teine",
  lv: "Šo e-pastu nevar izmantot, norādiet citu",
  lt: "Šio el. pašto naudoti negalima, nurodykite kitą",
  ga: "Ní féidir an ríomhphost seo a úsáid, cuir ceann eile isteach",
  mt: "Dan l-email ma jistax jintuża, daħħal ieħor",
  lb: "Dës E-Mail kann net benotzt ginn, gitt eng aner un",
  ar: "لا يمكن استخدام هذا البريد الإلكتروني، يرجى إدخال آخر",
  zh: "此邮箱无法使用，请输入其他邮箱",
  sw: "Barua pepe hii haiwezi kutumika, tafadhali weka nyingine",
  rw: "Iyi imeyili ntishobora gukoreshwa, andika indi",
  am: "ይህ ኢሜይል መጠቀም አይቻልም፣ ሌላ ያስገቡ",
  ha: "Ba za a iya amfani da wannan imel ba, shigar da wata",
  yo: "A kò lè lo imeèlì yìí, jọ̀wọ́ tẹ òmíràn sí i",
  ig: "Enweghị ike iji email a, biko tinye nke ọzọ",
  tw: "Wontumi mfa saa email yi nni dwuma, fa foforɔ",
};

export function emailTakenMessage(lang) {
  return TAKEN_MESSAGES[lang] || TAKEN_MESSAGES.en;
}
