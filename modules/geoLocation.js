import {
  countryLanguagesMap,
  SupportedLanguages,
  countryZipCodeTranslates,
  getPostalCodeFormat,
} from "../public/data";

// На мобильной сети /geo-api не всегда укладывался в 2.5 с: запрос
// абортился, включался фолбэк PL/PLN — и игрок из Швейцарии или Шри-Ланки
// видел польскую валюту. Таймаут поднят, а на случай, если и его не хватит,
// ниже есть фоновая доливка.
const GEO_TIMEOUT_MS = 6000;
const GEO_RETRY_TIMEOUT_MS = 10000;

const requestLocation = (timeout = GEO_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const url = `https://${window.location.host}/geo-api/api/check?accessKey=0439ba6e-6092-46c2-9aeb-8662065bc43c`;

  return fetch(url, { signal: controller.signal })
    .finally(() => clearTimeout(timer))
    .catch(() => null);
};

const FALLBACK_GEO = { countryCode: "PL", currency: { code: "PLN" } };

export async function getLocation() {
  try {
    // запрос уже стартовал инлайном в <head> — забираем его результат,
    // а свой шлём только если тот тег почему-то не отработал
    const response = await (window.__geoRequest ?? requestLocation());

    if (!response || !response.ok) throw new Error("Bad API response");

    const data = await response.json();

    // пустой countryCode бесполезен так же, как отсутствие ответа
    if (!data?.countryCode) throw new Error("No countryCode in response");

    return data;
  } catch (err) {
    console.log("API failed, applying fallback GEO");
    // помечаем, чтобы знать: это дефолт, а не реальная страна игрока
    return { ...FALLBACK_GEO, isFallback: true };
  }
}

// Фолбэк — не ответ, а заглушка. Пробуем ещё раз своим запросом (инлайновый
// уже мёртв) и, если страна оказалась другой, чиним geoData на месте и зовём
// подписчиков событием geo:refined. Ничего не блокирует: ленд к этому моменту
// давно отрисован.
const refineGeo = async () => {
  const response = await requestLocation(GEO_RETRY_TIMEOUT_MS);

  if (!response || !response.ok) return;

  try {
    const data = await response.json();

    if (!data?.countryCode || data.countryCode === geoData.countryCode) return;

    Object.assign(geoData, data);
    window.dispatchEvent(new CustomEvent("geo:refined", { detail: geoData }));
  } catch {
    // битый JSON — остаёмся на дефолте
  }
};

// Гео не имеет права блокировать ленд. Раньше здесь стоял top-level await:
// любой затуп /api/check замораживал выполнение всех модулей разом, вплоть до
// вечного прелоадера. Теперь отдаём дефолт сразу, а ответ доливаем в тот же
// объект — импортёры держат ссылку и видят обновление.
export const geoData = { countryCode: "PL", currency: { code: "PLN" } };

// getLocation() не реджектится никогда (внутри try/catch + abort по таймауту),
// поэтому geoReady гарантированно резолвится и ничего не подвешивает
export const geoReady = getLocation().then(({ isFallback, ...data }) => {
  Object.assign(geoData, data);
  // это событие уже слушает itiTelInput — пересоздаёт телефонный инпут
  // с определившейся страной
  window.dispatchEvent(new CustomEvent("geoReady", { detail: geoData }));

  if (isFallback) refineGeo();

  return geoData;
});

export const getSupportedLanguage = (countryCode) => {
  if (countryCode in countryLanguagesMap) {
    const languages = countryLanguagesMap[countryCode];
    for (let language of languages) {
      if (SupportedLanguages.includes(language)) {
        return language;
      }
    }
  }
  return "en";
};

// Ленд открывается на языке браузера; не поддерживаем его — показываем en.
// Считаем здесь, а не в language.js: значение уходит в /session и /register,
// а gameFetch читает localStorage раньше language.js.
export const getInitialLanguage = () => {
  const browserLang = navigator.language.split("-")[0];

  return SupportedLanguages.includes(browserLang) ? browserLang : "en";
};

localStorage.setItem("preferredLanguage", getInitialLanguage());
export const language = localStorage.getItem("preferredLanguage");

export const settingZipCodePlaceholder = (countryCode) => {
  const zipCodeLabel = document.querySelector(".two-step-zipcode-label");
  const base = countryZipCodeTranslates[countryCode] || "ZIP Code";
  const format = getPostalCodeFormat(countryCode);
  // Подсказываем юзеру ожидаемый формат прямо в лейбле, напр. "Kod pocztowy (00-001)"
  const text = format?.example ? `${base} (${format.example})` : base;

  // Текст держим в отдельном span: в части стран подпись идёт сразу на трёх
  // языках и вылезает за поле, а обрезать нужно именно её — звёздочка
  // обязательности рисуется на самом лейбле и обрезаться не должна.
  let textEl = zipCodeLabel.querySelector(".two-step-zipcode-label-text");

  if (!textEl) {
    textEl = document.createElement("span");
    textEl.className = "two-step-zipcode-label-text";
    zipCodeLabel.textContent = "";
    zipCodeLabel.append(textEl);
  }

  textEl.textContent = text;
};
