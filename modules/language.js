import { translations } from "/public/translations";
import { geoData } from "./geoLocation";
import { getSupportedLanguage } from "./geoLocation";
import {
  initBonus,
  settingInitialBonusValue,
  syncAppliedBonus,
  twoStepFormData,
} from "./twoStepForm";
import { countryCurrencyData } from "../public/data";
import { setSpinAmount } from "./promocodeCheck";
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
  dk: { name: "DK", flag: "dk" },
  bg: { name: "BG", flag: "bg" },
  nl: { name: "NL", flag: "nl" },
  ga: { name: "GA", flag: "ie" },
  lb: { name: "LB", flag: "lu" },
  mt: { name: "MT", flag: "mt" },
  zh: { name: "ZH", flag: "cn" },
  uk: { name: "UK", flag: "ua" },
  sw: { name: "SW", flag: "ke" },
  am: { name: "AM", flag: "et" },
  lm: { name: "LM", flag: "ug" },
  rw: { name: "RW", flag: "rw" },
  ar: { name: "AR", flag: "sa" },
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
  const elements = document.querySelectorAll(
    "[data-translate], [data-modal-translate]",
  );

  elements.forEach((element) => {
    const key =
      element.getAttribute("data-translate") ||
      element.getAttribute("data-modal-translate");
    element.innerHTML = translations[lang]?.[key] ?? translations.en?.[key] ?? "";
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

async function determineLanguage() {
  const location = geoData;

  const countryLangMap = {
    GB: "en",
    US: "en",
    CA: "en",
    AU: "en",
    NZ: "en",
    IE: "en",
    ZA: "en",
    IN: "en",
    UA: "uk",
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
    KZ: "ru",
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
    AZ: "ru",
    UZ: "ru",
    TR: "ru",
    BD: "en",
    ID: "en",
    CN: "en",
    DK: "dk",
    NO: "nb",
    RO: "ro",
    MD: "ro",
    HU: "hu",
    PL: "pl",
    CZ: "cs",
    SI: "sl",
    GR: "el",
    SE: "sv",
    SK: "sk",
    IT: "it",
    EE: "et",
    LV: "lv",
    LT: "lt",
    HR: "hr",
    FI: "fi",
    BG: "bg",
    KE: "sw",
    TZ: "sw",
    ET: "am",
    UG: "lm",
    RW: "rw",
    SA: "ar",
    EG: "ar",
    AE: "ar",
    IQ: "ar",
    MA: "ar",
    DZ: "ar",
    JO: "ar",
    LB: "ar",
    KW: "ar",
    QA: "ar",
    BH: "ar",
    OM: "ar",
    LY: "ar",
    TN: "ar",
    GH: "tw",
  };

  if (location.countryCode === "NG") {
    const browserLang = navigator.language?.split("-")[0]?.toLowerCase();
    const ngLangs = ["ha", "yo", "ig"];
    lang = ngLangs.includes(browserLang) ? browserLang : "ha";
  } else {
    lang = countryLangMap[location.countryCode] || "en";
  }

  return lang;
}

async function mainFunction() {
  try {
    lang = await determineLanguage();
    changeLanguage(lang);
    setTimeout(() => {
      const currencyData = JSON.parse(localStorage.getItem("currencyData"));
      settingInitialBonusValue(currencyData.abbr);
      setSpinAmount();
      initBonus(currencyData.abbr);
      syncAppliedBonus();
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
    initBonus(currencyData.abbr);
    syncAppliedBonus();
    localStorage.setItem(
      "preferredLanguage",
      getSupportedLanguage(targetLang.toUpperCase()),
    );
    twoStepFormData.lang = localStorage.getItem("preferredLanguage");
    setSpinAmount();
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
