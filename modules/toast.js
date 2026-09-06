// Тост в стиле продукта (apps/ui/widgets/toast): тёмная карточка в правом
// верхнем углу, цветная иконка в квадрате, заголовок + описание, крестик и
// полоса автозакрытия. Там это react-toastify, здесь хватает своей разметки —
// на ленде всплывающее сообщение одно.
//
// Цвета и типографика взяты из темы продукта (apps/ui/styles/global.css,
// libs/uikit/src/theme/typographyMui.ts), чтобы визуал совпадал один в один.

import { translate } from "./i18n";

const AUTO_CLOSE_MS = 5000;

// tabler-icons, те же, что в notify.tsx
const ICONS = {
  success: `<path d="M5 12l5 5l10 -10" />`,
  info: `<path d="M12 9h.01" /><path d="M11 12h1v4h1" /><circle cx="12" cy="12" r="9" />`,
};

const CLOSE_ICON = `<path d="M18 6l-12 12" /><path d="M6 6l12 12" />`;

const svg = (paths) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

let container = null;

const getContainer = () => {
  if (container) return container;

  container = document.createElement("div");
  container.className = "gb-toast-container";
  document.body.append(container);

  return container;
};

/**
 * @param {object} options
 * @param {string} options.title      — заголовок
 * @param {string} [options.text]     — описание под заголовком
 * @param {"success"|"info"} [options.type]
 * @param {() => {title: string, text?: string}} [options.retranslate]
 *        язык на ленде применяется асинхронно: если словарь доедет, пока тост
 *        ещё висит, перерисуем его текст этим колбэком
 */
export const showToast = ({ title, text, type = "success", retranslate }) => {
  const toast = document.createElement("div");
  toast.className = `gb-toast gb-toast--${type}`;

  toast.innerHTML = `
    <span class="gb-toast-icon">${svg(ICONS[type] || ICONS.success)}</span>
    <div class="gb-toast-body">
      <p class="gb-toast-title"></p>
      <p class="gb-toast-text"></p>
    </div>
    <button type="button" class="gb-toast-close" aria-label="Close">${svg(CLOSE_ICON)}</button>
    <span class="gb-toast-progress"></span>
  `;

  const titleEl = toast.querySelector(".gb-toast-title");
  const textEl = toast.querySelector(".gb-toast-text");

  const render = (content) => {
    titleEl.textContent = content.title;
    textEl.textContent = content.text || "";
    textEl.classList.toggle("hidden", !content.text);
  };

  render({ title, text });

  const onLangChanged = () => retranslate && render(retranslate());
  if (retranslate) window.addEventListener("lang:changed", onLangChanged);

  let closeTimer = null;

  const close = () => {
    if (!toast.isConnected) return;

    clearTimeout(closeTimer);
    window.removeEventListener("lang:changed", onLangChanged);

    toast.classList.add("is-leaving");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  };

  toast.querySelector(".gb-toast-close").addEventListener("click", close);
  toast.addEventListener("click", close);

  // полоса отмеряет ровно столько, сколько тост живёт
  toast.style.setProperty("--gb-toast-life", `${AUTO_CLOSE_MS}ms`);

  getContainer().append(toast);
  closeTimer = setTimeout(close, AUTO_CLOSE_MS);

  return close;
};

// Показывается на старте сессии: слот на медленном интернете грузится долго, и
// без сообщения игрок не понимает, выданы ли фриспины и чего он ждёт.
export const showFreespinsToast = (spins) => {
  const content = () => {
    const lang = document.documentElement.lang || "en";
    const fill = (key) =>
      translate(lang, key).replace(/\{(\w+)\}/g, (_, name) =>
        name === "spins" ? spins : "",
      );

    return { title: fill("toastSpinsTitle"), text: fill("toastSpinsText") };
  };

  return showToast({ ...content(), type: "success", retranslate: content });
};
