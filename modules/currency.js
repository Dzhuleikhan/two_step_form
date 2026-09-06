// Маппинг «страна → валюта» отдельным модулем: им пользуются и форма
// (modalCurrency), и хедер игры, и запрос сессии. Раньше он жил в
// modalCurrency, но gameFetch импортировать его оттуда не может — получился бы
// цикл gameFetch → modalCurrency → twoStepForm → gameFetch.

import { countryCurrencyData } from "../public/data";

const CDN = "https://3344112-img.b-cdn.net";

// Страны, чью валюту не предлагаем автоматически: подставляем нейтральную.
// RU здесь потому, что рубль на ленде не автоопределяется вообще.
const CURRENCY_COUNTRY_OVERRIDES = {
  RU: "US",
  MX: "US",
  CL: "US",
  CO: "US",
  TH: "US",
  ID: "US",
  GB: "FR",
};

// Одна точка подмены на весь ленд: и модалка, и хедер игры, и тело /session
// считают валюту от одной и той же страны.
export const getCurrencyCountry = (countryCode) =>
  CURRENCY_COUNTRY_OVERRIDES[countryCode] || countryCode;

const findByCountry = (inputCountry) =>
  countryCurrencyData.find((data) => data.countries.includes(inputCountry));

export function getCountryCurrencyABBR(inputCountry) {
  return findByCountry(inputCountry)?.countryCurrency || "USD";
}

export function getCountryCurrencyFullName(inputCountry) {
  return findByCountry(inputCountry)?.countryCurrencyFullName || "US Dollar";
}

export function getCountryCurrencyIcon(inputCountry) {
  return (
    findByCountry(inputCountry)?.countryCurrencyIcon ||
    `${CDN}/currency_icons/USD.svg`
  );
}

export function getCountryCurrencySymbol(inputCountry) {
  return findByCountry(inputCountry)?.countryCurrencySymbol || "$";
}

// Валюта, которую ленд считает правильной для страны игрока: сначала подмена
// исключённых стран, потом таблица. Сырой currency.code из гео-API не годится —
// он вернёт LKR для Шри-Ланки и PLN для дефолта, которых у нас в списке нет.
export const getCurrencyForCountry = (countryCode) =>
  getCountryCurrencyABBR(getCurrencyCountry(countryCode));
