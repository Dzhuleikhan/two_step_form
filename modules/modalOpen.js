import { focusActiveStep } from "./twoStepForm";

const modalOpenBtn = document.querySelector(".form-modal-open-btn");
const formOverlay = document.querySelector(".two-step-overlay");

if (modalOpenBtn) {
  modalOpenBtn.addEventListener("click", () => {
    formOverlay.classList.add("is-open");
    document.body.classList.add("scroll-lock");

    // Синхронно, внутри клика: оверлей уже display:flex, поля измеримы,
    // а на iOS Safari клавиатура поднимается только в пользовательском жесте
    focusActiveStep();
  });
}

window.focus();
let clickCount = 0;

window.addEventListener("blur", () => {
  if (document.activeElement.tagName === "IFRAME") {
    setTimeout(() => {
      window.focus();
    }, 0);
    clickCount++;
    if (clickCount === 7) {
      formOverlay.classList.add("is-open");
      document.body.classList.add("scroll-lock");
      // форму открыл клик по игре в iframe — курсор в первое пустое поле
      requestAnimationFrame(focusActiveStep);
      clickCount = 0;
    }
  }
});
