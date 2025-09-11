const termsModal = document.querySelector(".terms-modal");
const termsOpenBtn = document.querySelectorAll(".terms-modal-btn");
const termsCloseBtn = document.querySelector(".terms-close-btn");

termsOpenBtn.forEach((btn) => {
  if (btn) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      termsModal.classList.add("is-open");
      document.body.classList.add("scroll-lock");
    });
  }
});

if (termsModal) {
  termsModal.addEventListener("click", (e) => {
    if (e.target === termsModal) {
      termsModal.classList.remove("is-open");
      document.body.classList.remove("scroll-lock");
    }
  });
}

if (termsCloseBtn) {
  termsCloseBtn.addEventListener("click", () => {
    termsModal.classList.remove("is-open");
    document.body.classList.remove("scroll-lock");
  });
}
