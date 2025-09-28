import {
  countryLanguagesMap,
  SupportedLanguages,
  countryZipCodeTranslates,
} from "../public/data";

export async function getLocation() {
  let url =
    "https://apiip.net/api/check?accessKey=0439ba6e-6092-46c2-9aeb-8662065bc43c";
  let response = await fetch(url);
  let data = await response.json();

  return data;
}

export const geoData = await getLocation();

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

localStorage.setItem(
  "preferredLanguage",
  getSupportedLanguage(geoData.countryCode),
);

export const settingZipCodePlaceholder = (countryCode) => {
  const zipCodeLabel = document.querySelector(".two-step-zipcode-label");
  const placeholder = countryZipCodeTranslates[countryCode] || "ZIP Code";
  zipCodeLabel.textContent = placeholder;
};
