import { loadDictionary, translate } from "./i18n";
import { language } from "./geoLocation";
import { settingInitialBonusValue } from "./twoStepForm";
import { languageOptions } from "../public/data";
import { updateTelInputLanguage } from "./itiTelInput";

const CDN = "https://3344112-img.b-cdn.net";

const headerLangBtn = document.querySelector(".header-lang-btn");
const headerLangList = document.querySelector(".header-lang-list");
const html = document.querySelector("html");

// список скрыт через opacity, а не display:none, поэтому loading="lazy" его не спасёт —
// рендерим языки только при первом открытии, иначе 45 флагов летят в старт загрузки
let isHeaderLangListRendered = false;

function renderHeaderLangList() {
  if (isHeaderLangListRendered || !headerLangList) return;
  isHeaderLangListRendered = true;

  headerLangList.innerHTML = Object.entries(languageOptions)
    .map(([langCode, { name, flag }]) => {
      return `
        <li>
          <a
            href="#"
            data-lang="${langCode}"
            class="language-link flex items-center gap-2 bg-[#ffffff] px-3 py-[9px] transition-all"
          >
            <img
              class="pointer-events-none shrink-0 overflow-hidden rounded-full"
              width="20"
              height="20"
              loading="lazy"
              decoding="async"
              src="https://3344112-img.b-cdn.net/graphic/flags/flag-${flag}.svg"
              alt="${name} flag"
            />
            <span class="pointer-events-none">${name}</span>
          </a>
        </li>
      `;
    })
    .join("");

  // активный пункт проставляем уже после рендера: на старте списка ещё нет
  setActiveLanguageBtn(html.getAttribute("lang") || "en");
}

if (headerLangBtn) {
  headerLangBtn.addEventListener("click", () => {
    renderHeaderLangList();
    headerLangList.classList.toggle("is-open");
  });
}

function updateButtonText(lang) {
  const langBtnImg = headerLangBtn.querySelector("img");
  const headerLangName = document.querySelector(".header-lang-btn span");

  const { name, flag } = languageOptions[lang] || languageOptions.en;

  langBtnImg.setAttribute(
    "src",
    CDN + `/graphic/flags/flag-${flag}.svg` ||
      CDN + `/graphic/flags/flag-en.svg`,
  );
  headerLangName.innerHTML = name;
  html.setAttribute("lang", lang);
}

function updateContent(lang) {
  const elements = document.querySelectorAll("[data-translate]");
  elements.forEach((element) => {
    const key = element.getAttribute("data-translate");
    element.innerHTML = translate(lang, key);
  });
}

const RTL_LANGUAGES = ["ar"];

async function changeLanguage(lang) {
  await loadDictionary(lang);

  updateContent(lang);
  updateButtonText(lang);
  setActiveLanguageBtn(lang);

  if (RTL_LANGUAGES.includes(lang)) {
    html.setAttribute("dir", "rtl");
    document.body.classList.add("is-rtl");
  } else {
    html.setAttribute("dir", "ltr");
    document.body.classList.remove("is-rtl");
  }

  updateTelInputLanguage();

  // заголовок и кнопки формы собираются в JS — перерисовываем их вручную
  window.dispatchEvent(new CustomEvent("lang:changed"));
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

async function initLanguage() {
  // язык уже выбран в geoLocation.js: браузер в приоритете, гео — фолбэк
  await changeLanguage(language);
}
initLanguage();

// общая точка входа для всех переключателей языка на странице
export async function selectLanguage(targetLang) {
  await changeLanguage(targetLang);
  // targetLang — уже код языка, а не страны: getSupportedLanguage() ждёт
  // countryCode и на "de"/"pl" всегда возвращал "en", затирая выбор игрока.
  localStorage.setItem("preferredLanguage", targetLang);

  const currencyData = JSON.parse(localStorage.getItem("currencyData"));
  if (currencyData) settingInitialBonusValue(currencyData.abbr);
}

headerLangList.addEventListener("click", (e) => {
  e.preventDefault();
  const link = e.target.closest("a[data-lang]");
  selectLanguage(link.getAttribute("data-lang"));
  headerLangList.classList.remove("is-open");
});
