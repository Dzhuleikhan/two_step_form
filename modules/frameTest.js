/* ВРЕМЕННАЯ ЛОГИКА
   Считаем клики по iframe с игрой. На 5-м клике открываем two-step-overlay
   с задержкой 1с. Счётчик живёт в localStorage: после рефреша можно докликать
   остаток, а если 5 уже набрано — модалка показывается сразу.

   Клики внутри cross-origin iframe напрямую не слышны, поэтому ловим их
   косвенно: браузер уводит фокус в iframe -> у window срабатывает blur.
   После засчитанного клика возвращаем фокус документу, чтобы поймать следующий. */

const CLICKS_TO_OPEN = 15;
const OPEN_DELAY = 1000;
const STORAGE_KEY = "frameTestClicks";

const gameFrame = document.querySelector(".game-frame");
const overlay = document.querySelector(".two-step-overlay");

const readClicks = () => {
  const stored = Number.parseInt(localStorage.getItem(STORAGE_KEY), 10);

  if (!Number.isFinite(stored) || stored < 0) return 0;

  return Math.min(stored, CLICKS_TO_OPEN);
};

const saveClicks = (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // приватный режим / переполненное хранилище — счётчик просто не переживёт рефреш
  }
};

const lockFrame = () => {
  gameFrame.classList.add("is-locked");
};

const openOverlay = (delay) => {
  window.setTimeout(() => overlay.classList.add("is-open"), delay);
};

if (gameFrame && overlay) {
  let clicks = readClicks();

  if (clicks >= CLICKS_TO_OPEN) {
    lockFrame();
    openOverlay(OPEN_DELAY);
  } else {
    const handleBlur = () => {
      // activeElement обновляется после blur, поэтому проверяем в следующем тике
      window.setTimeout(() => {
        if (document.activeElement !== gameFrame) return;

        window.focus();

        clicks += 1;
        saveClicks(clicks);

        if (clicks < CLICKS_TO_OPEN) return;

        window.removeEventListener("blur", handleBlur);
        lockFrame();
        openOverlay(OPEN_DELAY);
      }, 0);
    };

    window.addEventListener("blur", handleBlur);
  }
}

// для ручной отладки: __resetFrameTest() в консоли
window.__resetFrameTest = () => {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
};
