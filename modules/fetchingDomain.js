import { geoData } from "./geoLocation";

// Fetching domain from API
export const fetchDomain = async (countryCode) => {
  const res = await fetch(
    `https://gbetauth.com/api/v2/rotator/available-domain?country=${countryCode}`,
  );
  const data = await res.json();
  return data.domain || "g01d63t1.win";
};

export let newDomain = "g01d63t1.win";

await fetchDomain(geoData.countryCode)
  .then((domain) => {
    newDomain = domain;
    console.log("Domain fetched:", newDomain);
  })
  .catch(() => {
    console.log("Applied fallback domain: g01d63t1.win");
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
