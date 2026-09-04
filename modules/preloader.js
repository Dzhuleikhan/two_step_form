// Снятие прелоадера живёт отдельным модулем и подключается первым.
// Раньше этот код стоял в конце twoStepForm.js: любая ошибка в форме означала,
// что до него не дойдут, и игрок оставался перед вечным чёрным экраном.
// Здесь зависимостей нет вообще, поэтому уронить его нечем.

const HARD_TIMEOUT_MS = 2500;
const FADE_MS = 400;

const preloader = document.querySelector(".preloader");

if (preloader) {
  let isHidden = false;

  const hide = () => {
    if (isHidden) return;
    isHidden = true;

    clearTimeout(fallbackTimer);

    preloader.style.transition = `opacity ${FADE_MS}ms ease`;
    preloader.style.opacity = "0";
    setTimeout(() => preloader.remove(), FADE_MS);
  };

  // основной путь: контент переведён и отрисован
  window.addEventListener("lang:changed", hide, { once: true });

  // страховка: что бы ни случилось с гео, переводами или формой — экран откроется
  const fallbackTimer = setTimeout(hide, HARD_TIMEOUT_MS);
}
