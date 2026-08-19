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

// Фейд снизу, пока под краем колонки есть ещё пункты. Класс снимаем, когда
// докрутили до конца, — иначе последний пункт выглядел бы обрезанным всегда.
const sidebarScroll = document.querySelector(".sidebar-scroll");

const updateScrollFade = () => {
  if (!sidebarScroll) return;

  const { scrollTop, scrollHeight, clientHeight } = sidebarScroll;
  const hasMore = scrollTop + clientHeight < scrollHeight - 1;

  sidebarScroll.classList.toggle("has-more", hasMore);
};

sidebarScroll?.addEventListener("scroll", updateScrollFade);
window.addEventListener("resize", updateScrollFade);
updateScrollFade();

// раскрывающиеся разделы меню
document.querySelectorAll(".sidebar-group-btn").forEach((groupBtn) => {
  groupBtn.addEventListener("click", () => {
    const isOpen = groupBtn.parentElement.classList.toggle("is-open");

    groupBtn.setAttribute("aria-expanded", String(isOpen));

    // высота списка меняется по transition — пересчитываем после него
    window.setTimeout(updateScrollFade, 350);
  });
});
