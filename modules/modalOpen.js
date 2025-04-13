const modalOpenBtn = document.querySelector(".form-modal-open-btn");
const formOverlay = document.querySelector(".two-step-overlay");

if (modalOpenBtn) {
  modalOpenBtn.addEventListener("click", () => {
    formOverlay.classList.add("is-open");
    document.body.classList.add("scroll-lock");
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
    if (clickCount === 3) {
      formOverlay.classList.add("is-open");
      document.body.classList.add("scroll-lock");
      clickCount = 0;
    }
  }
});
