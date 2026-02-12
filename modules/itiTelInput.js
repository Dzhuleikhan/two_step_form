import intlTelInput from "intl-tel-input/intlTelInputWithUtils";
import { geoData } from "./geoLocation";
import Inputmask from "inputmask";

const twoStepPhoneInput = document.querySelector(".two-step-phone-input");
const socialsPhoneInput = document.querySelector(".socials-phone-input");

const geoIpLookup = (success, failure) => {
  if (geoData && geoData.countryCode) {
    success(geoData.countryCode);
  } else {
    success("PL");
  }
};

const itiOptions = {
  initialCountry: "auto",
  separateDialCode: true,
  useFullscreenPopup: false,
  autoPlaceholder: "polite",
  geoIpLookup,
  customPlaceholder: function (selectedCountryPlaceholder) {
    return selectedCountryPlaceholder.replace(/[0-9]/g, "X");
  },
};

export const twoStepiti = intlTelInput(twoStepPhoneInput, itiOptions);
export const socialsIti = intlTelInput(socialsPhoneInput, itiOptions);

/* ---------- MASK LOGIC ---------- */

const applyMask = (input) => {
  const placeholder = input.getAttribute("placeholder");
  if (!placeholder) return;

  const maskPattern = placeholder.replace(/X/g, "9");

  Inputmask({
    mask: maskPattern,
    placeholder: "X",
    clearMaskOnLostFocus: true,
  }).mask(input);
};

const attachMaskEvents = (input) => {
  input.addEventListener("focus", () => applyMask(input));
  input.addEventListener("click", () => applyMask(input));
  input.addEventListener("countrychange", () => applyMask(input));
};

attachMaskEvents(twoStepPhoneInput);
attachMaskEvents(socialsPhoneInput);
