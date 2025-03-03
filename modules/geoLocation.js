import { countryLanguagesMap, SupportedLanguages } from "../public/data";

export async function getLocation() {
  let url = `https://apiip.net/api/check?accessKey=${__SECRET_KEY__}`;
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
