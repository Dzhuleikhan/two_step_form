/* Клик по любой ссылке или кнопке в хедере, сайдбаре и футере открывает форму
   регистрации.

   Закрыть её можно только пока выигрыша нет: при totalWin > 0 крестик не
   показываем — уходить с деньгами на балансе игрок не должен.

   Работают кнопки только после успешного /session. Пока ответа нет, открывать
   форму рано: снапшота ещё не существует, и заголовок собрался бы из нулей.
   Если сессия не поднялась — игры нет вовсе или она истекла (403) — кнопки не
   делают ничего: в первом случае открывать нечего, во втором форма приезжает
   сама, поверх записи игры. */

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

// | СОСТОЯНИЕ СЕССИИ
// Ровно два исхода: c2:session-started — /session ответил успешно;
// game:settled — не ответил или игры нет, форму по кнопкам не открываем.
let canOpenForm = false;

window.addEventListener("c2:session-started", () => {
  canOpenForm = true;
});

window.addEventListener("game:settled", () => {
  canOpenForm = false;
});

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

    // сессии ещё нет, она не поднялась или истекла — открывать нечего
    if (!canOpenForm) return;

    openForm();
  });
});

closeBtn?.addEventListener("click", () => {
  overlay?.classList.remove("is-open");
});
