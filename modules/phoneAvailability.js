// Проверка занятости телефона через same-origin прокси на nginx ленда.
// Эндпоинт: POST /api/phone/check-available  →  { available: true|false }.
// Бэк (прод) отдаёт 201, поэтому ориентируемся на ТЕЛО ответа, а не на статус.
//
// Принцип fail-open: блокируем форму ТОЛЬКО при однозначном available:false (занят).
// Любая ошибка (сеть, таймаут, 4xx/5xx, кривое тело) → не блокируем — лид не теряем.

const ENDPOINT = "/api/phone/check-available";
// Таймаут на проверку: медленный API не должен держать кнопку/спиннер —
// по истечении считаем «не знаем» (fail-open), а добьём на сабмите.
const TIMEOUT_MS = 1500;
// Анти-перебор через форму: максимум разных номеров на проверку за сессию страницы.
// Превышение → перестаём слать запросы (fail-open). Реальная граница — nginx phone_rl.
const MAX_CHECKS = 20;

// e164 -> { pending: bool, errored: bool, available: bool|null }
const cache = new Map();
let checksUsed = 0;

// Текущий вердикт по номеру (или null, если ещё не проверяли).
export function getPhoneStatus(e164) {
  return cache.get(e164) || null;
}

// Запускает (или переиспользует) проверку номера. Возвращает Promise с записью.
export function checkPhoneAvailability(e164) {
  if (!e164) return Promise.resolve(null);

  const cached = cache.get(e164);
  // Уже знаем результат или проверка в процессе — не дёргаем повторно
  // (кроме случая, когда прошлая попытка упала — тогда пробуем снова).
  if (cached && (cached.pending || !cached.errored)) {
    return cached.promise || Promise.resolve(cached);
  }

  // Кап на перебор: исчерпали лимит разных номеров → fail-open без запроса.
  if (checksUsed >= MAX_CHECKS) {
    const capped = { pending: false, errored: true, available: null };
    cache.set(e164, capped);
    return Promise.resolve(capped);
  }
  checksUsed++;

  const entry = { pending: true, errored: false, available: null };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  entry.promise = fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: e164 }),
    signal: controller.signal,
  })
    .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
    .then((data) => {
      entry.available =
        data && typeof data.available === "boolean" ? data.available : null;
      if (entry.available === null) entry.errored = true; // неожиданное тело → fail-open
    })
    .catch(() => {
      // сеть / таймаут / 4xx / 5xx → fail-open
      entry.errored = true;
      entry.available = null;
    })
    .finally(() => {
      clearTimeout(timer);
      entry.pending = false;
      delete entry.promise;
    });

  cache.set(e164, entry);
  return entry.promise.then(() => entry);
}

// Локализованный текст для занятого номера. Текст вшит сюда (как у email-guard),
// чтобы не размазывать по translations.js. Языки без своего перевода → en-фолбэк.
// NB: переводы am/ha/yo/ig/tw/rw/sw/mt/ga/lb/lm — best-effort, нужна вычитка носителями.
const TAKEN_MESSAGES = {
  en: "This number can't be used, please enter another",
  ru: "Номер нельзя использовать, укажите другой",
  uk: "Цей номер не можна використати, вкажіть інший",
  pl: "Tego numeru nie można użyć, podaj inny",
  de: "Diese Nummer kann nicht verwendet werden, bitte eine andere angeben",
  fr: "Ce numéro ne peut pas être utilisé, veuillez en indiquer un autre",
  es: "Este número no se puede usar, indica otro",
  pt: "Este número não pode ser usado, informe outro",
  it: "Questo numero non può essere usato, inseriscine un altro",
  nl: "Dit nummer kan niet worden gebruikt, voer een ander in",
  cs: "Toto číslo nelze použít, zadejte jiné",
  sk: "Toto číslo nie je možné použiť, zadajte iné",
  sl: "Te številke ni mogoče uporabiti, vnesite drugo",
  hr: "Ovaj broj se ne može koristiti, unesite drugi",
  hu: "Ez a szám nem használható, adjon meg másikat",
  ro: "Acest număr nu poate fi folosit, introduceți altul",
  bg: "Този номер не може да се използва, посочете друг",
  el: "Αυτός ο αριθμός δεν μπορεί να χρησιμοποιηθεί, καταχωρίστε άλλον",
  sv: "Det här numret kan inte användas, ange ett annat",
  nb: "Dette nummeret kan ikke brukes, oppgi et annet",
  da: "Dette nummer kan ikke bruges, angiv et andet",
  fi: "Tätä numeroa ei voi käyttää, anna toinen",
  et: "Seda numbrit ei saa kasutada, sisestage teine",
  lv: "Šo numuru nevar izmantot, norādiet citu",
  lt: "Šio numerio naudoti negalima, nurodykite kitą",
  ga: "Ní féidir an uimhir seo a úsáid, cuir ceann eile isteach",
  mt: "Dan in-numru ma jistax jintuża, daħħal ieħor",
  lb: "Dës Nummer kann net benotzt ginn, gitt eng aner un",
  ar: "لا يمكن استخدام هذا الرقم، يرجى إدخال رقم آخر",
  zh: "此号码无法使用，请输入其他号码",
  sw: "Nambari hii haiwezi kutumika, tafadhali weka nyingine",
  rw: "Iyi nimero ntishobora gukoreshwa, andika indi",
  am: "ይህ ቁጥር መጠቀም አይቻልም፣ ሌላ ያስገቡ",
  ha: "Ba za a iya amfani da wannan lambar ba, shigar da wata",
  yo: "A kò lè lo nọ́mbà yìí, jọ̀wọ́ tẹ òmíràn sí i",
  ig: "Enweghị ike iji nọmba a, biko tinye nke ọzọ",
  tw: "Wontumi mfa saa nɔma yi nni dwuma, fa foforɔ",
};

export function phoneTakenMessage(lang) {
  return TAKEN_MESSAGES[lang] || TAKEN_MESSAGES.en;
}
