import { translations } from "/public/translations";
import { language } from "./geoLocation";
import { settingInitialBonusValue, twoStepFormData } from "./twoStepForm";
import { countryCurrencyData } from "../public/data";
import { updateTelInputLanguage } from "./itiTelInput";

const CDN = "https://3344112-img.b-cdn.net";

export const languageOptions = {
  en: { name: "EN", flag: "gb" },
  fr: { name: "FR", flag: "fr" },
  ro: { name: "RO", flag: "ro" },
  hu: { name: "HU", flag: "hu" },
  pl: { name: "PL", flag: "pl" },
  cs: { name: "CS", flag: "cz" },
  sl: { name: "SL", flag: "si" },
  el: { name: "EL", flag: "gr" },
  nb: { name: "NB", flag: "no" },
  sv: { name: "SV", flag: "se" },
  sk: { name: "SK", flag: "sk" },
  ru: { name: "RU", flag: "ru" },
  es: { name: "ES", flag: "es" },
  pt: { name: "PT", flag: "pt" },
  de: { name: "DE", flag: "de" },
  it: { name: "IT", flag: "it" },
  et: { name: "ET", flag: "ee" },
  lv: { name: "LV", flag: "lv" },
  lt: { name: "LT", flag: "lt" },
  hr: { name: "HR", flag: "hr" },
  fi: { name: "FI", flag: "fi" },
  da: { name: "DA", flag: "dk" },
  bg: { name: "BG", flag: "bg" },
  nl: { name: "NL", flag: "nl" },
  ga: { name: "GA", flag: "ie" },
  lb: { name: "LB", flag: "lu" },
  mt: { name: "MT", flag: "mt" },
  uk: { name: "UK", flag: "ua" },
  sw: { name: "SW", flag: "ke" },
  rw: { name: "RW", flag: "rw" },
  ar: { name: "AR", flag: "sa" },
  am: { name: "AM", flag: "et" },
  lm: { name: "LM", flag: "ug" },
  ha: { name: "HA", flag: "ng" },
  yo: { name: "YO", flag: "ng" },
  ig: { name: "IG", flag: "ng" },
  tw: { name: "TW", flag: "gh" },
};

const headerLangBtn = document.querySelector(".header-lang-btn");
const headerLangList = document.querySelector(".header-lang-list");

let lang;

function renderLanguageList() {
  if (!headerLangList) return;
  headerLangList.innerHTML = Object.entries(languageOptions)
    .map(
      ([code, { name, flag }]) => `
      <li>
        <a data-lang="${code}" class="language-link flex items-center gap-2 bg-[#525A89] px-3 py-[9px] transition-all" href="#">
          <img class="pointer-events-none shrink-0 overflow-hidden rounded-full" width="20" height="20" src="${CDN}/graphic/flags/flag-${flag}.svg" alt="${name} flag" />
          <span class="pointer-events-none">${name}</span>
        </a>
      </li>`,
    )
    .join("");
}

renderLanguageList();

if (headerLangBtn) {
  headerLangBtn.addEventListener("click", () => {
    headerLangList.classList.toggle("is-open");
  });
}


function updateContent(lang) {
  const t = translations[lang] || translations["en"];
  const elements = document.querySelectorAll("[data-translate]");
  elements.forEach((element) => {
    const key = element.getAttribute("data-translate");
    element.innerHTML = t[key];
  });
}

const RTL_LANGUAGES = ["ar"];

function changeLanguage(lang) {
  updateContent(lang);
  updateButtonText(lang);
  setActiveLanguageBtn(lang);

  // Язык страницы в <html lang> — по нему алерты «занято» (телефон/почта) берут
  // свой перевод и перерисовываются при смене языка.
  document.documentElement.setAttribute("lang", lang);

  if (RTL_LANGUAGES.includes(lang)) {
    document.documentElement.setAttribute("dir", "rtl");
    document.body.classList.add("is-rtl");
  } else {
    document.documentElement.setAttribute("dir", "ltr");
    document.body.classList.remove("is-rtl");
  }

  updateTelInputLanguage();

  // Заглушки, которые рисуются из JS, а не через data-translate:
  // «страна не найдена» у телефона и у селекта страны, позиция календаря в RTL.
  window.dispatchEvent(new CustomEvent("lang:changed", { detail: lang }));
}

function setActiveLanguageBtn(currentLang) {
  document.querySelectorAll(".language-link").forEach((el) => {
    if (el.getAttribute("data-lang") === currentLang) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
  });
}

function updateButtonText(lang) {
  const headerLangBtnImg = document.querySelector(".header-lang-btn img");
  const headerLangName = document.querySelector(".header-lang-btn span");

  const option = languageOptions[lang];
  const flag = option ? option.flag : "gb";
  const name = option ? option.name : "EN";

  headerLangBtnImg.setAttribute(
    "src",
    CDN + `/graphic/flags/flag-${flag}.svg`,
  );
  headerLangName.innerHTML = name;
  document.querySelector("html").setAttribute("lang", lang);
}

async function mainFunction() {
  try {
    // язык уже выбран в geoLocation.js по браузеру (раньше — по гео)
    lang = language;
    changeLanguage(lang);
    setTimeout(() => {
      const currencyData = JSON.parse(localStorage.getItem("currencyData"));
      settingInitialBonusValue(currencyData.abbr);
    }, 200);
  } catch (error) {
    console.error("Error determining language:", error);
  }
}
mainFunction();

if (headerLangList) {
  headerLangList.addEventListener("click", (e) => {
    const link = e.target.closest(".language-link");
    if (!link) return;
    e.preventDefault();
    headerLangList.classList.remove("is-open");
    const targetLang = link.getAttribute("data-lang");
    changeLanguage(targetLang);
    const currencyData = JSON.parse(localStorage.getItem("currencyData"));
    settingInitialBonusValue(currencyData.abbr);
    // targetLang — уже код языка, а не страны: getSupportedLanguage() ждёт
    // countryCode ("SV" — Сальвадор → es, "DA" → en), затирая выбор игрока
    localStorage.setItem("preferredLanguage", targetLang);
    twoStepFormData.lang = localStorage.getItem("preferredLanguage");
  });
}

// const detectedLanguage = localStorage.getItem("preferredLanguage");

// function applyTranslations(lang) {
//   const language = translations[lang] ? lang : "en"; // Use 'en' if language not in translations
//   const elements = document.querySelectorAll("[data-translate]");

//   elements.forEach((element) => {
//     const key = element.getAttribute("data-translate");
//     if (translations[language] && translations[language][key]) {
//       element.innerHTML = translations[language][key];
//     }
//   });
// }

// applyTranslations(detectedLanguage);
