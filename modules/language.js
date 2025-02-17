import { translations } from "../public/translations";

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
