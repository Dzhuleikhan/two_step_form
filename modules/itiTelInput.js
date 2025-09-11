import intlTelInput from "intl-tel-input/intlTelInputWithUtils";

const twoStepPhoneInput = document.querySelector(".two-step-phone-input");
const socialsPhoneInput = document.querySelector(".socials-phone-input");

const geoIpLookup = (success, failure) => {
  const cachedData = localStorage.getItem("geoIpData");
  if (cachedData) {
    success(JSON.parse(cachedData).countryCode);
  } else {
    fetch(
      `https://apiip.net/api/check?accessKey=0439ba6e-6092-46c2-9aeb-8662065bc43c`,
    )
      .then((res) => res.json())
      .then((data) => {
        localStorage.setItem("geoIpData", JSON.stringify(data));
        success(data.countryCode);
      })
      .catch(() => {
        failure();
      });
  }
};

export const twoStepiti = intlTelInput(twoStepPhoneInput, {
  initialCountry: "auto",
  separateDialCode: true,
  useFullscreenPopup: false,
  autoPlaceholder: "polite",
  geoIpLookup: geoIpLookup,
});

export const socialsIti = intlTelInput(socialsPhoneInput, {
  initialCountry: "auto",
  separateDialCode: true,
  useFullscreenPopup: false,
  autoPlaceholder: "polite",
  geoIpLookup: geoIpLookup,
});
