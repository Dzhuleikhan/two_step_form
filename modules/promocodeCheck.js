import { getUrlParameter } from "./params";
import { twoStepFormData } from "./twoStepForm";

export const defaulPromocode = "";

export const receivedPromocode = (
  getUrlParameter("promocode") || ""
).toLocaleUpperCase();

// Промокод из ссылки: показываем применённым и запрещаем править.
// .is-applied-from-url даёт pointer-events: none — это закрывает мышь и тап,
// но не клавиатуру: табом можно было встать в поле и переписать код. Поэтому
// ещё readOnly + tabindex="-1" на поле и кнопке Apply. Без кода в ссылке поле
// обычное — игрок вводит свой промокод руками.
// Значение пишем и свойством, и атрибутом: при возврате «Назад» с прода
// (bfcache / восстановление формы в мобильном Safari) поле откатывается к
// атрибуту value — с ним откатываться некуда.
const applyPromocodeFromUrl = () => {
  const wrapper = document.querySelector(".promocode-applied-wrapper");
  const promoInput = document.querySelector(".two-step-promocode-input");
  const applyBtn = document.querySelector(".two-step-promocode-apply-btn");
  if (!wrapper || !promoInput) return;

  if (receivedPromocode) {
    twoStepFormData.promocode = receivedPromocode;
    wrapper.classList.add("is-applied-from-url");
    promoInput.setAttribute("value", receivedPromocode);
    promoInput.value = receivedPromocode;
    promoInput.readOnly = true;
    promoInput.setAttribute("tabindex", "-1");
    applyBtn?.setAttribute("tabindex", "-1");
  } else {
    twoStepFormData.promocode = "";
    wrapper.classList.remove("is-applied-from-url");
  }
};

applyPromocodeFromUrl();

// Второй проход на следующем кадре — мобильный Safari восстанавливает форму
// асинхронно, уже после pageshow. Вызов идемпотентный.
window.addEventListener("pageshow", () => {
  applyPromocodeFromUrl();
  requestAnimationFrame(applyPromocodeFromUrl);
});
