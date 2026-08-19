/* Клик по любой ссылке или кнопке в хедере, сайдбаре и футере открывает форму
   регистрации.

   Закрыть её можно только пока выигрыша нет: при totalWin > 0 крестик не
   показываем — уходить с деньгами на балансе игрок не должен. Если игра не
   поднялась (в ссылке нет cid/gameId и висит «Game is unavailable»),
   кнопки не делают ничего. */

import { gameSession } from "./gameFetch";

const NAV_CONTAINERS = [".header", ".sidebar", ".footer"];

const overlay = document.querySelector(".two-step-overlay");
const closeBtn = document.querySelector(".two-step-close-btn");

// служебные контролы самого лендинга: сворачивание панелей и выбор языка
const SERVICE_CONTROLS = [
  ".sidebar-toggle",
  ".header-toggle",
  ".header-lang-box",
  ".sidebar-lang",
  ".sidebar-group-btn",
];

const isServiceControl = (target) =>
  SERVICE_CONTROLS.some((selector) => target.closest(selector));

const isGameAvailable = () => !document.querySelector(".game-empty.is-visible");

const hasWin = () => Number.parseFloat(gameSession.snapshot?.totalWin) > 0;

const openForm = () => {
  if (!overlay) return;

  // с выигрышем модалка неснимаемая
  closeBtn?.classList.toggle("is-visible", !hasWin());

  overlay.classList.add("is-open");
  // форма рисует заголовок по снапшоту и запускает таймер
  window.dispatchEvent(new CustomEvent("c2:gate-opened"));
};

NAV_CONTAINERS.forEach((selector) => {
  const container = document.querySelector(selector);

  container?.addEventListener("click", (event) => {
    const control = event.target.closest("a, button");

    if (!control || isServiceControl(event.target)) return;

    event.preventDefault();

    // игры нет — открывать нечего
    if (!isGameAvailable()) return;

    openForm();
  });
});

closeBtn?.addEventListener("click", () => {
  overlay?.classList.remove("is-open");
});
