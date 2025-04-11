import { translations } from "/public/translations";
import { getLocation } from "./geoLocation";
import { getSupportedLanguage } from "./geoLocation";
import { settingInitialBonusValue, twoStepFormData } from "./twoStepForm";

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
    en: "English",
    fr: "French",
    ro: "Romainan",
    hu: "Hungarian",
    pl: "Polish",
    cz: "Czech",
    si: "Slovenian",
    gr: "Greek",
    no: "Norwegian",
    se: "Swedish",
    sk: "Slovak",
    ru: "Russian",
    es: "Spanish",
    pt: "Portuguese",
    de: "German",
    ua: "Ukrainian",
    tr: "Turkish",
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
    EN: "en",
    FR: "fr",
    RO: "ro",
    HU: "hu",
    PL: "pl",
    CZ: "cz",
    SI: "si",
    GR: "gr",
    NO: "no",
    SE: "se",
    SK: "sk",
    RU: "ru",
    ES: "es",
    PT: "pt",
    DE: "de",
    UA: "ua",
    TR: "tr",
    // Add more country codes and their corresponding languages as needed
  };
  lang = countryLangMap[location.countryCode] || "en";

  return lang;
}

async function mainFunction() {
  try {
    lang = await determineLanguage();
    changeLanguage(lang);
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
    localStorage.setItem(
      "preferredLanguage",
      getSupportedLanguage(targetLang.toUpperCase()),
    );
    twoStepFormData.lang = localStorage.getItem("preferredLanguage");
  });
});

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
