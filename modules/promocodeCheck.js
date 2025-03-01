import { getUrlParameter } from "./params";
import { twoStepFormData } from "./twoStepForm";

export const defaulPromocode = "";

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
