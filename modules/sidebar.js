// Кнопка в хедере сворачивает/разворачивает сайдбар.
// Ширину анимирует CSS-переход grid-template-columns у .wrapper.

const wrapper = document.querySelector(".wrapper");
const toggleBtn = document.querySelector(".sidebar-toggle");

if (wrapper && toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const isCollapsed = wrapper.classList.toggle("sidebar-collapsed");

    toggleBtn.setAttribute("aria-expanded", String(!isCollapsed));
  });
}

// раскрывающиеся разделы меню
document.querySelectorAll(".sidebar-group-btn").forEach((groupBtn) => {
  groupBtn.addEventListener("click", () => {
    const isOpen = groupBtn.parentElement.classList.toggle("is-open");

    groupBtn.setAttribute("aria-expanded", String(isOpen));
  });
});
