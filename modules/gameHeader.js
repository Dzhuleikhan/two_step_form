// Хедер игры: флаг страны и иконка валюты по гео-детекту.

import { geoReady } from "./geoLocation";
import { getCountryCurrencyIcon } from "./modalCurrency";

const CDN = "https://3344112-img.b-cdn.net";

const flagImgs = document.querySelectorAll(".game-header-flag, .footer-flag");
const currencyImg = document.querySelector(".game-header-currency");
const wrapper = document.querySelector(".wrapper");
const headerToggleBtn = document.querySelector(".header-toggle");

// хедер рисуется сразу, флаг и валюта появляются, когда доедет гео
geoReady.then((geo) => {
  const countryCode = geo?.countryCode || "PL";

  flagImgs.forEach((flagImg) => {
    // на CDN нет флагов части стран — прячем картинку вместо битой иконки
    flagImg.addEventListener("error", () => flagImg.classList.add("hidden"));

    flagImg.src = `${CDN}/graphic/flags/flag-${countryCode.toLowerCase()}.svg`;
    flagImg.alt = `${countryCode.toUpperCase()} flag`;
  });

  if (currencyImg) {
    currencyImg.src = getCountryCurrencyIcon(countryCode);
    currencyImg.alt = "Currency";
  }
});

if (wrapper && headerToggleBtn) {
  headerToggleBtn.addEventListener("click", () => {
    const isHidden = wrapper.classList.toggle("header-hidden");

    headerToggleBtn.setAttribute("aria-expanded", String(!isHidden));
  });
}
