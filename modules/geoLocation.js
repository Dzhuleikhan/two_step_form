import {
  countryLanguagesMap,
  SupportedLanguages,
  countryZipCodeTranslates,
  getPostalCodeFormat,
} from "../public/data";

const requestLocation = () => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);

  const url = `https://${window.location.host}/geo-api/api/check?accessKey=0439ba6e-6092-46c2-9aeb-8662065bc43c`;

  return fetch(url, { signal: controller.signal })
    .finally(() => clearTimeout(timer))
    .catch(() => null);
};

export async function getLocation() {
  const fallback = { countryCode: "PL", currency: { code: "PLN" } };

  try {
    // запрос уже стартовал инлайном в <head> — забираем его результат,
    // а свой шлём только если тот тег почему-то не отработал
    const response = await (window.__geoRequest ?? requestLocation());

    if (!response || !response.ok) throw new Error("Bad API response");

    const data = await response.json();
    return data;
  } catch (err) {
    console.log("API failed, applying fallback GEO");
    return fallback;
  }
}

// Гео не имеет права блокировать ленд. Раньше здесь стоял top-level await:
// любой затуп /api/check замораживал выполнение всех модулей разом, вплоть до
// вечного прелоадера. Теперь отдаём дефолт сразу, а ответ доливаем в тот же
// объект — импортёры держат ссылку и видят обновление.
export const geoData = { countryCode: "PL", currency: { code: "PLN" } };

// getLocation() не реджектится никогда (внутри try/catch + abort по таймауту),
// поэтому geoReady гарантированно резолвится и ничего не подвешивает
export const geoReady = getLocation().then((data) => {
  Object.assign(geoData, data);
  // это событие уже слушает itiTelInput — пересоздаёт телефонный инпут
  // с определившейся страной
  window.dispatchEvent(new CustomEvent("geoReady", { detail: geoData }));

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
  zipCodeLabel.textContent = format?.example
    ? `${base} (${format.example})`
    : base;
};
