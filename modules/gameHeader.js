// Хедер игры: флаг страны и иконка валюты по гео-детекту.

import { geoData } from "./geoLocation";
import { getCountryCurrencyIcon } from "./modalCurrency";

const CDN = "https://3344112-img.b-cdn.net";

const flagImgs = document.querySelectorAll(".game-header-flag, .footer-flag");
const currencyImg = document.querySelector(".game-header-currency");
const wrapper = document.querySelector(".wrapper");
const headerToggleBtn = document.querySelector(".header-toggle");

if (flagImgs.length) {
  const countryCode = (geoData?.countryCode || "PL").toUpperCase();

  flagImgs.forEach((flagImg) => {
    // на CDN нет флагов части стран — прячем картинку вместо битой иконки
    flagImg.addEventListener("error", () => flagImg.classList.add("hidden"));

    flagImg.src = `${CDN}/graphic/flags/flag-${countryCode.toLowerCase()}.svg`;
    flagImg.alt = `${countryCode} flag`;
  });
}

if (currencyImg) {
  const countryCode = geoData?.countryCode || "PL";

  currencyImg.src = getCountryCurrencyIcon(countryCode);
  currencyImg.alt = "Currency";
}

if (wrapper && headerToggleBtn) {
  headerToggleBtn.addEventListener("click", () => {
    const isHidden = wrapper.classList.toggle("header-hidden");

    headerToggleBtn.setAttribute("aria-expanded", String(!isHidden));
  });
}
