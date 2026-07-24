import { getUrlParameter } from "./params";
import { twoStepFormData } from "./twoStepForm";

export const defaulPromocode = "";

// Промокоды под тип бонуса. Дефолты переопределяются параметрами ссылки
// ?fsPromocode=... и ?cashPromocode=...
const BONUS_PROMOCODE_DEFAULTS = {
  fs: "SWEET98",
  cash: "Q8DK6M",
};

export const bonusPromocodes = {
  fs: (
    getUrlParameter("fsPromocode") || BONUS_PROMOCODE_DEFAULTS.fs
  ).toLocaleUpperCase(),
  cash: (
    getUrlParameter("cashPromocode") || BONUS_PROMOCODE_DEFAULTS.cash
  ).toLocaleUpperCase(),
};

// Прямой ?promocode= имеет приоритет над промокодами бонусов
export const receivedPromocode = (
  getUrlParameter("promocode") || ""
).toLocaleUpperCase();

// Промокод выбранного чекбокса бонуса.
// У «Without Bonus» нет data-promocode-type — промокод не передаём.
const getPromocodeForCheckedBonus = () => {
  if (receivedPromocode) return receivedPromocode;

  const checkedBonus = document.querySelector('input[name="bonus"]:checked');
  const bonusType = checkedBonus?.dataset.promocodeType;

  return bonusPromocodes[bonusType] || "";
};

const applyPromocodeFromBonus = () => {
  twoStepFormData.promocode = getPromocodeForCheckedBonus();
};

document.querySelectorAll('input[name="bonus"]').forEach((input) => {
  input.addEventListener("change", applyPromocodeFromBonus);
});

applyPromocodeFromBonus();

// Блок ручного ввода промокода присутствует в разметке не всегда
const promocodeAppliedWrapper = document.querySelector(
  ".promocode-applied-wrapper",
);
const promocodeInput = document.querySelector(".two-step-promocode-input");

if (receivedPromocode) {
  promocodeAppliedWrapper?.classList.add("is-applied-from-url");
  if (promocodeInput) promocodeInput.value = receivedPromocode;
} else {
  promocodeAppliedWrapper?.classList.remove("is-applied-from-url");
}
