import { geoData } from "./geoLocation";

export const fetchDomain = async (countryCode) => {
  const fallback = "g01d63t1.win";

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    const url = `https://${window.location.host}/domain-api/api/v2/rotator/available-domain?country=${countryCode}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) throw new Error("Bad API response");

    const data = await response.json();
    return data.domain;
  } catch (err) {
    console.log("API failed, applying fallback Domain");
    return fallback;
  }
};

export let newDomain = "g01d63t1.win"; // fallback сразу
fetchDomain(geoData.countryCode).then((domain) => {
  newDomain = domain;
});

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
