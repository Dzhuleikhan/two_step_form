import { geoData } from "./geoLocation";

export const fetchDomain = async (countryCode) => {
  const res = await fetch(
    `https://gbetauth.com/api/v2/rotator/available-domain?country=${countryCode}`,
  );
  const data = await res.json();
  return data.domain || "goldbet3.com";
};

export const newDomain = await fetchDomain(geoData.countryCode);

console.log("Secret key:", __SECRET_KEY__);

function updatingBonusValueNumbers() {
  const dropd = document.querySelectorAll(".form-bonus-dropdown");
  dropd.forEach((drop) => {
    if (drop) {
      const links = drop.querySelectorAll("li");
      links[0].setAttribute("data-bonus-id", "welcome-bonus-1");
      links[1].setAttribute("data-bonus-id", "highroller");
      links[2].setAttribute("data-bonus-id", "crypto");
    }
  });
  const initialBonusValueInput = document.querySelectorAll(
    ".auth-form-bonus input",
  );
  initialBonusValueInput.forEach((input) => {
    input.value = "welcome-bonus-1";
  });

  const formSocials = document.querySelectorAll(".form-modal-socials");
  formSocials.forEach((form) => {
    let input = form.querySelector(".bonus-input");
    input.setAttribute("data-bonus", "welcome-bonus-1");
  });
}
updatingBonusValueNumbers();
