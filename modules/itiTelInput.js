import intlTelInput from "intl-tel-input";
import { Metadata } from "libphonenumber-js/core";
import minMetadata from "libphonenumber-js/metadata.min.json";
import { isValidPhoneNumber } from "libphonenumber-js";
import { geoData } from "./geoLocation";

const getPossibleLengths = (countryCode) => {
  try {
    const meta = new Metadata(minMetadata);
    meta.selectNumberingPlan(countryCode);
    return meta.numberingPlan.possibleLengths();
  } catch {
    return null;
  }
};

const getMaxDigitsForCountry = (countryCode) => {
  const lengths = getPossibleLengths(countryCode);
  return lengths ? Math.max(...lengths) : 15;
};

const stripDuplicatedDialCode = (digits, countryCode, dialCode) => {
  if (!dialCode || !digits.startsWith(dialCode)) return digits;
  const rest = digits.slice(dialCode.length);
  const lengths = getPossibleLengths(countryCode);
  if (!rest || !lengths) return digits;
  const maxLen = Math.max(...lengths);
  if (digits.length > maxLen && rest.length <= maxLen) return rest;
  if (isValidPhoneNumber("+" + dialCode + digits)) return digits;
  if (isValidPhoneNumber("+" + digits)) return rest;
  if (lengths.includes(rest.length) && !lengths.includes(digits.length)) {
    return rest;
  }
  return digits;
};

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
  loadUtils: () => import("intl-tel-input/utils"),
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
  const countryData = twoStepiti.getSelectedCountryData();
  const countryCode = countryData.iso2?.toUpperCase();
  const dialCode = countryData.dialCode;
  const maxDigits = getMaxDigitsForCountry(countryCode);
  const raw = stripDuplicatedDialCode(
    twoStepPhoneInput.value.replace(/\D/g, ""),
    countryCode,
    dialCode,
  );
  const digits = raw.slice(0, maxDigits);

  if (digits.length === 0) {
    twoStepPhoneInput.value = "";
    return;
  }

  if (!currentFormat) {
    twoStepPhoneInput.value = digits;
    twoStepPhoneInput.setSelectionRange(digits.length, digits.length);
    return;
  }

  const templateDigits = (currentFormat.match(/X/g) || []).length;

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

  if (digits.length > templateDigits) {
    formatted += digits.slice(templateDigits);
    cursorPos = formatted.length;
  }

  twoStepPhoneInput.value = formatted;
  twoStepPhoneInput.setSelectionRange(cursorPos, cursorPos);
};

window.addEventListener("geoReady", (e) => {
  const countryCode = e.detail?.countryCode?.toLowerCase() || "pl";
  twoStepiti.destroy();
  twoStepiti = intlTelInput(twoStepPhoneInput, { ...baseOptions, initialCountry: countryCode });
  fixItiLTR();
  currentFormat = null;
});

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
