import {
  countryLanguagesMap,
  SupportedLanguages,
  countryZipCodeTranslates,
} from "../public/data";

export async function getLocation() {
  const fallback = { countryCode: "PL", currency: { code: "PLN" } };

  try {
    const url = `https://${window.location.host}/geo-api/api/check?accessKey=0439ba6e-6092-46c2-9aeb-8662065bc43c`;
    const response = await fetch(url);

    if (!response.ok) throw new Error("Bad API response");

    const data = await response.json();
    return data;
  } catch (err) {
    console.log("API failed, applying fallback GEO");
    return fallback;
  }
}

export let geoData = await getLocation();

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
export const language = localStorage.getItem("preferredLanguage");

export const settingZipCodePlaceholder = (countryCode) => {
  const zipCodeLabel = document.querySelector(".two-step-zipcode-label");
  const placeholder = countryZipCodeTranslates[countryCode] || "ZIP Code";
  zipCodeLabel.textContent = placeholder;
};
