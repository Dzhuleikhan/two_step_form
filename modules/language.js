import { translations } from "/public/translations";
import { getLocation } from "./geoLocation";
import { getSupportedLanguage } from "./geoLocation";
import { settingInitialBonusValue, twoStepFormData } from "./twoStepForm";
import { countryCurrencyData } from "../public/data";

const headerLangBtn = document.querySelector(".header-lang-btn");
const headerLangList = document.querySelector(".header-lang-list");
const languageLinks = document.querySelectorAll(".language-link");

let lang;

if (headerLangBtn) {
  headerLangBtn.addEventListener("click", () => {
    headerLangList.classList.toggle("is-open");
  });
}

languageLinks.forEach((link) => {
  if (link) {
    link.addEventListener("click", () => {
      headerLangList.classList.remove("is-open");
    });
  }
});

function updateContent(lang) {
  const elements = document.querySelectorAll("[data-translate]");
  elements.forEach((element) => {
    const key = element.getAttribute("data-translate");
    element.innerHTML = translations[lang][key];
  });
}

function changeLanguage(lang) {
  updateContent(lang);
  updateButtonText(lang);
  setActiveLanguageBtn(lang);
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
  const headerLangBtn = document.querySelector(".header-lang-btn img");
  const headerLangName = document.querySelector(".header-lang-btn span");

  const languageNames = {
    en: "EN",
    fr: "FR",
    ro: "RO",
    hu: "HU",
    pl: "PL",
    cz: "CZ",
    si: "SI",
    gr: "EL",
    no: "NO",
    se: "SE",
    sk: "SK",
    ru: "RU",
    es: "ES",
    pt: "PT",
    de: "DE",
  };
  headerLangBtn.setAttribute(
    "src",
    `./img/flags/${lang}.svg` || `./img/flags/en.svg`,
  );
  headerLangName.innerHTML = languageNames[lang];
  document.querySelector("html").setAttribute("lang", lang);
}

async function determineLanguage() {
  const location = await getLocation();

  const countryLangMap = {
    GB: "en",
    US: "en",
    CA: "en",
    AU: "en",
    NZ: "en",
    IE: "en",
    ZA: "en",
    IN: "en",
    UA: "ua",
    FR: "fr",
    BE: "fr",
    CH: "fr",
    LU: "fr",
    DE: "de",
    AT: "de",
    LI: "de",
    ES: "es",
    MX: "es",
    AR: "es",
    CO: "es",
    PE: "es",
    VE: "es",
    CL: "es",
    EC: "es",
    GT: "es",
    CU: "es",
    BO: "es",
    DO: "es",
    HN: "es",
    PY: "es",
    NI: "es",
    SV: "es",
    CR: "es",
    PA: "es",
    UY: "es",
    RU: "ru",
    KZ: "kz",
    BY: "ru",
    KG: "ru",
    TJ: "ru",
    TM: "ru",
    "GE-AB": "ru",
    "GE-SO": "ru",
    PT: "pt",
    BR: "pt",
    AO: "pt",
    MZ: "pt",
    GW: "pt",
    TL: "pt",
    MO: "pt",
    EH: "pt",
    AZ: "az",
    UZ: "ru",
    TR: "tr",
    BD: "en",
    ID: "en",
    CN: "en",
    DK: "de",
    NO: "no",
    RO: "ro",
    MD: "ro",
    HU: "hu",
    PL: "pl",
    CZ: "cz",
    SI: "si",
    GR: "gr",
    SE: "se",
    SK: "sk",
    // Add more country codes and their corresponding languages as needed
  };
  lang = countryLangMap[location.countryCode] || "en";

  return lang;
}

async function mainFunction() {
  try {
    lang = await determineLanguage();
    changeLanguage(lang);
    setTimeout(() => {
      const currencyData = JSON.parse(localStorage.getItem("currencyData"));
      settingInitialBonusValue(currencyData.abbr);
    }, 200);
    localStorage.setItem(
      "preferredLanguage",
      getSupportedLanguage(lang.toUpperCase()),
    );
  } catch (error) {
    console.error("Error determining language:", error);
  }
}
mainFunction();

document.querySelectorAll(".language-link").forEach((langBtn) => {
  langBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const targetLang = e.target.getAttribute("data-lang");
    changeLanguage(targetLang);
    const currencyData = JSON.parse(localStorage.getItem("currencyData"));
    settingInitialBonusValue(currencyData.abbr);
    localStorage.setItem(
      "preferredLanguage",
      getSupportedLanguage(targetLang.toUpperCase()),
    );
    twoStepFormData.lang = localStorage.getItem("preferredLanguage");
  });
});

const detectedLanguage = localStorage.getItem("preferredLanguage");

function applyTranslations(lang) {
  const language = translations[lang] ? lang : "en"; // Use 'en' if language not in translations
  const elements = document.querySelectorAll("[data-translate]");

  elements.forEach((element) => {
    const key = element.getAttribute("data-translate");
    if (translations[language] && translations[language][key]) {
      element.innerHTML = translations[language][key];
    }
  });
}

applyTranslations(detectedLanguage);
