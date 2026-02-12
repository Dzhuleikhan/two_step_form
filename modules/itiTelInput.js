import intlTelInput from "intl-tel-input/intlTelInputWithUtils";
import { geoData } from "./geoLocation";
import Inputmask from "inputmask";

const twoStepPhoneInput = document.querySelector(".two-step-phone-input");

const geoIpLookup = (success, failure) => {
  if (geoData && geoData.countryCode) {
    success(geoData.countryCode);
  } else {
    success("PL");
  }
};

export const twoStepiti = intlTelInput(twoStepPhoneInput, {
  initialCountry: "auto",
  separateDialCode: true,
  useFullscreenPopup: false,
  autoPlaceholder: "polite",
  geoIpLookup,
  utilsScript:
    "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/16.0.0/js/utils.js",
  customPlaceholder: function (selectedCountryPlaceholder) {
    return selectedCountryPlaceholder.replace(/[0-9]/g, "X");
  },
});

const applyMask = () => {
  const placeholder = twoStepPhoneInput.getAttribute("placeholder");

  if (!placeholder) return;

  const maskPattern = placeholder.replace(/X/g, "9");

  Inputmask({
    mask: maskPattern,
    placeholder: "X",
    clearMaskOnLostFocus: true,
  }).mask(twoStepPhoneInput);
};

twoStepPhoneInput.addEventListener("focus", applyMask);
twoStepPhoneInput.addEventListener("click", applyMask);
twoStepPhoneInput.addEventListener("countrychange", applyMask);
