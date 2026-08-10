import { geoData, getSupportedLanguage } from "./geoLocation";
import { countryFlags } from "../public/data";
import { translations } from "../public/translations";

const CDN = "https://3344112-img.b-cdn.net";

const restrictedCountries = ["US"];

// Названия, которые в заголовке читаются лучше, чем значение из countryFlags
const countryNameOverrides = { US: "the United States" };

const geoRestrictModal = document.querySelector(".geo-restrict-modal");

export const isGeoRestricted = restrictedCountries.includes(
  geoData.countryCode,
);

function getCountryName(countryCode) {
  if (countryNameOverrides[countryCode])
    return countryNameOverrides[countryCode];

  const country = countryFlags.find(
    (item) => item.slug === countryCode.toLowerCase(),
  );
  return country?.name || "your country";
}

function getTitle(lang, host, country) {
  const template =
    translations[lang]?.geoRestrictTitle || translations.en.geoRestrictTitle;

  return template.replace("{host}", host).replace("{country}", country);
}

if (geoRestrictModal && isGeoRestricted) {
  const titleEl = geoRestrictModal.querySelector(".geo-restrict-title");
  const flagEl = geoRestrictModal.querySelector(".geo-restrict-flag");

  const lang = getSupportedLanguage(geoData.countryCode);
  const countryName = getCountryName(geoData.countryCode);

  if (titleEl)
    titleEl.textContent = getTitle(lang, window.location.hostname, countryName);

  if (flagEl) {
    flagEl.src = `${CDN}/graphic/flags/flag-${geoData.countryCode.toLowerCase()}.svg`;
    flagEl.alt = countryName;
  }

  geoRestrictModal.classList.add("is-open");
  document.body.classList.add("scroll-lock");
}
