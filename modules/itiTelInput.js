import intlTelInput from "intl-tel-input/intlTelInputWithUtils";
import { geoData } from "./geoLocation";

const twoStepPhoneInput = document.querySelector(".two-step-phone-input");

const geoIpLookup = (success, failure) => {
  if (geoData && geoData.countryCode) {
    success(geoData.countryCode);
  } else {
    success("PL");
  }
};

const baseOptions = {
  initialCountry: "auto",
  separateDialCode: true,
  useFullscreenPopup: false,
  autoPlaceholder: "aggressive",
  geoIpLookup,
  customPlaceholder: function (selectedCountryPlaceholder) {
    return selectedCountryPlaceholder.replace(/[0-9]/g, "X");
  },
};

const fixItiLTR = () => {
  const container = twoStepPhoneInput
    .closest(".iti")
    ?.querySelector(".iti__country-container");
  if (container) {
    container.style.left = "0px";
    container.style.right = "auto";
  }
};

export let twoStepiti = intlTelInput(twoStepPhoneInput, baseOptions);
fixItiLTR();

let currentFormat = null;

const updatePhoneFormat = () => {
  const placeholder = twoStepPhoneInput.getAttribute("placeholder");
  if (!placeholder) return;
  currentFormat = placeholder;
};

const formatPhoneValue = () => {
  if (!currentFormat) return;

  const maxDigits = (currentFormat.match(/X/g) || []).length;
  const digits = twoStepPhoneInput.value.replace(/\D/g, "").slice(0, maxDigits);

  if (digits.length === 0) {
    twoStepPhoneInput.value = "";
    return;
  }

  let formatted = "";
  let digitIndex = 0;
  let cursorPos = 0;

  for (let i = 0; i < currentFormat.length; i++) {
    if (currentFormat[i] === "X") {
      if (digitIndex < digits.length) {
        formatted += digits[digitIndex++];
        cursorPos = formatted.length;
      } else {
        formatted += "X";
      }
    } else {
      formatted += currentFormat[i];
    }
  }

  twoStepPhoneInput.value = formatted;
  twoStepPhoneInput.setSelectionRange(cursorPos, cursorPos);
};

twoStepPhoneInput.addEventListener("focus", updatePhoneFormat);
twoStepPhoneInput.addEventListener("input", formatPhoneValue);
twoStepPhoneInput.addEventListener("countrychange", () => {
  currentFormat = null;
  twoStepPhoneInput.value = "";
  updatePhoneFormat();
});

export function updateTelInputLanguage() {
  const currentCountry = twoStepiti.getSelectedCountryData().iso2;
  twoStepiti.destroy();

  const options = { ...baseOptions, initialCountry: currentCountry || "auto" };

  twoStepiti = intlTelInput(twoStepPhoneInput, options);
  fixItiLTR();
  currentFormat = null;
}
