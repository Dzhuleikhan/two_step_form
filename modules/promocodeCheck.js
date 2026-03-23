import { getUrlParameter } from "./params";
import { twoStepFormData } from "./twoStepForm";

export const defaulPromocode = "F3N7N6";

export const receivedPromocode = (
  getUrlParameter("promocode") || ""
).toLocaleUpperCase();

if (receivedPromocode) {
  twoStepFormData.promocode = receivedPromocode;
  document
    .querySelector(".promocode-applied-wrapper")
    .classList.add("is-applied-from-url");
  document.querySelector(".two-step-promocode-input").value = receivedPromocode;
} else {
  twoStepFormData.promocode = "";
  document
    .querySelector(".promocode-applied-wrapper")
    .classList.remove("is-applied-from-url");
}

export const defaulSpinAmount = "100";

export const receivedSpinAmount =
  getUrlParameter("spinAmount") || defaulSpinAmount;

export function setSpinAmount() {
  document.querySelectorAll(".actual-spin-amount").forEach((el) => {
    el.innerHTML = receivedSpinAmount;
  });
}
