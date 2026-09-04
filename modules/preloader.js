// Прелоадер живёт отдельным модулем и подключается первым.
// Раньше этот код стоял в конце twoStepForm.js: любая ошибка в форме означала,
// что до него не дойдут, и игрок оставался перед вечным чёрным экраном.
// Здесь зависимостей нет вообще, поэтому уронить его нечем.
//
// Загрузка распадается на два независимых трека:
//   1. страница (гео, переводы) — хедер, сайдбар и футер видны сразу, но
//      размыты, пока не приедут переводы: подмена строк не мозолит глаза;
//   2. игра — крутилка накрывает только колонку с фреймом и уходит, когда
//      фрейм загрузился либо стало ясно, что игры не будет.
// У каждого трека свой таймаут: что бы ни упало, страница не залипнет.

// Блюр держится до реального lang:changed: раньше он слетал по таймауту 2.5 с,
// и на медленной сети игрок успевал увидеть непереведённую страницу. Теперь
// таймаут только аварийный — на случай, если переводы не приедут вообще.
const CHROME_TIMEOUT_MS = 6000;
const GAME_TIMEOUT_MS = 12000;
// скелетоны не имеют права пульсировать вечно, даже если данные не пришли
const SKELETON_TIMEOUT_MS = 8000;
const FADE_MS = 400;

// | СТРАНИЦА
const wrapper = document.querySelector(".wrapper");

if (wrapper) {
  const revealChrome = () => {
    clearTimeout(chromeTimer);
    wrapper.classList.remove("is-loading");
  };

  // основной путь: контент переведён и отрисован
  window.addEventListener("lang:changed", revealChrome, { once: true });

  // страховка: что бы ни случилось с гео, переводами или формой — блюр снимется
  const chromeTimer = setTimeout(revealChrome, CHROME_TIMEOUT_MS);
}

// | СКЕЛЕТОНЫ
// Плашки снимают те модули, что подставляют данные (gameHeader, gameFetch).
// Здесь только предохранитель: если гео или сессия молчат, показываем что есть,
// иначе игрок останется перед вечно мигающими прямоугольниками.
setTimeout(() => {
  document.querySelectorAll(".skeleton, .skeleton-text").forEach((el) => {
    el.classList.remove("skeleton", "skeleton-text");
  });
}, SKELETON_TIMEOUT_MS);

// | ИГРА
const preloader = document.querySelector(".preloader");

if (preloader) {
  let isHidden = false;

  const hide = () => {
    if (isHidden) return;
    isHidden = true;

    clearTimeout(gameTimer);

    preloader.style.transition = `opacity ${FADE_MS}ms ease`;
    preloader.style.opacity = "0";
    setTimeout(() => preloader.remove(), FADE_MS);
  };

  // фрейм отдал load. Стартовый about:blank тоже его отдаёт — его пропускаем,
  // ждём загрузку настоящего url игры из /session
  const frame = document.querySelector(".game-frame");

  frame?.addEventListener("load", () => {
    if (frame.src && !frame.src.startsWith("about:")) hide();
  });

  // игры не будет (нет cid/gameId или упал /session) — под крутилкой заглушка
  window.addEventListener("game:settled", hide, { once: true });

  // страховка: сессия зависла или фрейм не отдал load — открываем как есть
  const gameTimer = setTimeout(hide, GAME_TIMEOUT_MS);
}
