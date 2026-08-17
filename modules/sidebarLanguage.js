// Переключатель языка внизу сайдбара. Смену языка отдаём в общую selectLanguage,
// поэтому свитчер в форме и этот всегда показывают одно и то же.

import { languageOptions } from "../public/data";
import { selectLanguage } from "./language";

const CDN = "https://3344112-img.b-cdn.net";

const langBox = document.querySelector(".sidebar-lang");

if (langBox) {
  const langBtn = langBox.querySelector(".sidebar-lang-btn");
  const langList = langBox.querySelector(".sidebar-lang-list");
  const currentFlag = langBtn.querySelector("img");
  const currentName = langBtn.querySelector("span");

  const flagUrl = (flag) => `${CDN}/graphic/flags/flag-${flag}.svg`;

  langList.innerHTML = Object.entries(languageOptions)
    .map(
      ([langCode, { name, flag }]) => `
        <li>
          <button type="button" data-lang="${langCode}">
            <img width="20" height="20" src="${flagUrl(flag)}" alt="" />
            <span>${name}</span>
          </button>
        </li>
      `,
    )
    .join("");

  const syncCurrent = (lang) => {
    const { name, flag } = languageOptions[lang] || languageOptions.en;

    currentFlag.src = flagUrl(flag);
    currentName.textContent = name;
  };

  const closeList = () => {
    langBox.classList.remove("is-open");
    langBtn.setAttribute("aria-expanded", "false");
  };

  langBtn.addEventListener("click", () => {
    const isOpen = langBox.classList.toggle("is-open");

    langBtn.setAttribute("aria-expanded", String(isOpen));
  });

  langList.addEventListener("click", (event) => {
    const item = event.target.closest("button[data-lang]");

    if (!item) return;

    const { lang } = item.dataset;

    selectLanguage(lang);
    syncCurrent(lang);
    closeList();
  });

  document.addEventListener("click", (event) => {
    if (!langBox.contains(event.target)) closeList();
  });

  // язык уже выставлен в language.js — забираем его из html[lang]
  syncCurrent(document.documentElement.lang || "en");
}
