import { countryCurrencyData, countryFlags } from "../public/data";
import { geoData, settingZipCodePlaceholder } from "./geoLocation";
import { twoStepiti } from "./itiTelInput";
import { newDomain } from "./fetchingDomain";
import { getUrlParameter } from "./params";
import gsap from "gsap";
import { canadaProvincesCities, australiaStatesCities } from "../public/data";
import flatpickr from "flatpickr";
// import { cioanalytics } from "./cio-analytics";

document.querySelectorAll("input").forEach((input) => {
  input.setAttribute("autocomplete", "off");
});

// ? SOCIALS TWO STEP FORM

export let twoStepFormData = {
  bonus: "welcome-bonus-1",
  promocode: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  birthday: "",
  gender: "",
  country: "",
  currency: geoData.currency.code === "RUB" ? "USD" : geoData.currency.code,
  phone: "",
  state: "",
  city: "",
  address: "",
  zipCode: "",
  lang: "",
};

export const exceptCurrencies = [
  "RON",
  "DKK",
  "HUF",
  "CZK",
  "CHF",
  "PLN",
  "CAD",
  "USD",
  "EUR",
];

export const checkTir1CurrencyMatch = (currency, bonus) => {
  const initialBonus = "welcome-bonus-1";
  const updatedBonus = "welcome-bonus-1-alt";

  if (
    twoStepFormData.bonus !== "crypto" &&
    twoStepFormData.bonus !== "highroller" &&
    twoStepFormData.bonus !== "0"
  ) {
    if (exceptCurrencies.includes(currency)) {
      return updatedBonus;
    }
    return initialBonus;
  }

  return bonus;
};

twoStepFormData.bonus = document.querySelector(
  'input[name="bonus"]:checked',
).value;

twoStepFormData.bonus = checkTir1CurrencyMatch(
  twoStepFormData.currency,
  twoStepFormData.bonus,
);

// | CHOOSING BONUSES

const twoStepBonusCheckbox = document.querySelectorAll(
  ".two-step-bonus-checkbox",
);
const appliedBonusWrapper = document.querySelectorAll(".applied-bonus-wrapper");

twoStepBonusCheckbox.forEach((checkbox) => {
  const input = checkbox.querySelector("input");
  input.addEventListener("change", () => {
    const bonusValue = input.value;
    const bonusImg = input.getAttribute("data-img");
    const bonusName = checkbox.querySelector(
      ".two-step-bonus-checkbox-name",
    ).innerHTML;
    const bonusText = checkbox.querySelector(
      ".two-step-bonus-checkbox-text",
    ).innerHTML;

    twoStepFormData.bonus = bonusValue;

    twoStepFormData.bonus = checkTir1CurrencyMatch(
      twoStepFormData.currency,
      twoStepFormData.bonus,
    );

    appliedBonusWrapper.forEach((appliedBonus) => {
      const img = appliedBonus.querySelector(".applied-bonus-img");
      const name = appliedBonus.querySelector(".applied-bonus-name");
      const text = appliedBonus.querySelector(".applied-bonus-text");

      img.setAttribute("src", bonusImg);
      name.innerHTML = bonusName;
      text.innerHTML = bonusText;
    });
  });
});

export const settingInitialBonusValue = (currency) => {
  const currencyEntry = countryCurrencyData.find(
    (entry) => entry.countryCurrency === currency,
  );

  if (currencyEntry) {
    document.querySelectorAll(".two-step-welcome-amount").forEach((el) => {
      el.innerHTML = currencyEntry.amount;
    });
    document.querySelectorAll(".two-step-welcome-symbol").forEach((el) => {
      el.innerHTML = currencyEntry.countryCurrencySymbol;
    });
    document.querySelectorAll(".two-step-bonus-spins").forEach((el) => {
      el.innerHTML = currencyEntry.spins;
    });
    document.querySelectorAll(".bonus-highroller-amount").forEach((el) => {
      el.innerHTML = currencyEntry.highrollerAmount;
    });
    document.querySelectorAll(".bonus-currency-symbol").forEach((el) => {
      el.innerHTML = currencyEntry.countryCurrency;
    });
  } else {
    document.querySelectorAll(".two-step-welcome-amount").forEach((el) => {
      el.innerHTML = "4500";
    });
    document.querySelectorAll(".two-step-welcome-symbol").forEach((el) => {
      el.innerHTML = "€";
    });
    document.querySelectorAll(".two-step-bonus-spins").forEach((el) => {
      el.innerHTML = "200FS";
    });
    document.querySelectorAll(".bonus-highroller-amount").forEach((el) => {
      el.innerHTML = "180";
    });
    document.querySelectorAll(".bonus-currency-symbol").forEach((el) => {
      el.innerHTML = "EUR";
    });
  }
};

// | INPUTS
const twoStepGeneralInput = document.querySelectorAll(
  ".two-step-general-input",
);

twoStepGeneralInput.forEach((input) => {
  if (input) {
    input.addEventListener("input", () => {
      const label = input.nextElementSibling;
      label.classList.toggle("active", input.value.trim() !== "");
    });
  }
});

// | PROMOCODE
const twoStepPromocodeBtn = document.querySelector(".two-step-promocode-btn");
const twoStepPromocodeWrapper = document.querySelector(
  ".two-step-promocode-wrapper",
);
if (twoStepPromocodeBtn) {
  twoStepPromocodeBtn.addEventListener("click", () => {
    twoStepPromocodeBtn.classList.add("hidden");
    twoStepPromocodeWrapper.classList.add("is-visible");
  });
}

const promocodeWrapperTl = gsap.timeline({ paused: true });

promocodeWrapperTl
  .to(twoStepPromocodeWrapper, { x: -14, duration: 0.03 })
  .to(twoStepPromocodeWrapper, { x: 14, duration: 0.03 })
  .to(twoStepPromocodeWrapper, { x: 0, duration: 0.03 });

if (twoStepPromocodeWrapper) {
  const input = twoStepPromocodeWrapper.querySelector(
    ".two-step-promocode-input",
  );
  const promocodeApplyBtn = twoStepPromocodeWrapper.querySelector(
    ".two-step-promocode-apply-btn",
  );

  input.addEventListener("input", async () => {
    if (twoStepPromocodeWrapper.classList.contains("is-valid")) {
      twoStepFormData.promocode = "";
      console.log("Промокод неверный");
      twoStepPromocodeWrapper.classList.remove("is-valid");
      twoStepPromocodeWrapper.classList.add("is-not-valid");
    }
  });

  promocodeApplyBtn.addEventListener("click", async () => {
    let promoCode = input.value;

    const fetchPromocodes = async () => {
      const res = await fetch(
        `https://${newDomain}/api/v2/promocode/check-available?code=${promoCode.toUpperCase()}`,
      );
      const data = await res.json();
      return data.available;
    };
    const promoIsValid = await fetchPromocodes();
    if (promoIsValid) {
      twoStepFormData.promocode = validateStringInput(
        input.value,
      ).toUpperCase();
      console.log("Промокод верный");
      twoStepPromocodeWrapper.classList.add("is-valid");
      twoStepPromocodeWrapper.classList.remove("is-not-valid");
    } else {
      twoStepFormData.promocode = "";
      console.log("Промокод неверный");
      twoStepPromocodeWrapper.classList.remove("is-valid");
      twoStepPromocodeWrapper.classList.add("is-not-valid");
      promocodeWrapperTl.restart();
    }
  });
}

// | STEP 2 -- EMAIL AND PASSWORD

const twoStepFormSecondStep = document.querySelector(".two-step-form-step-2");
if (twoStepFormSecondStep) {
  const twoStepFormSecondStepBtn =
    twoStepFormSecondStep.querySelector(".next-step-btn");

  const twoStepFormEmailInput = twoStepFormSecondStep.querySelector(
    ".two-step-email-input",
  );
  const twoStepFormPasswordInput = twoStepFormSecondStep.querySelector(
    ".two-step-password-input",
  );
  const btnOverlap = twoStepFormSecondStepBtn.querySelector(".disable-overlap");

  const regex =
    /^(?!.*\.\.)[a-zA-Z0-9][a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]{0,62}[a-zA-Z0-9]@(?:\[(?:\d{1,3}\.){3}\d{1,3}\]|[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+)$/;

  const validateInputs = (validColor, invalidColor) => {
    const emailValue = twoStepFormEmailInput.value.trim();
    const passwordValue = twoStepFormPasswordInput.value.trim();

    const isEmailValid = regex.test(emailValue);
    const isPasswordValid = passwordValue.length >= 6;

    twoStepFormEmailInput.style.color = isEmailValid
      ? validColor
      : invalidColor;
    twoStepFormPasswordInput.style.color = isPasswordValid
      ? validColor
      : invalidColor;

    if (isEmailValid && isPasswordValid) {
      btnOverlap.style.left = "100%";
      twoStepFormData.email = twoStepFormEmailInput.value;
      twoStepFormData.password = twoStepFormPasswordInput.value;
      twoStepFormSecondStepBtn.disabled = false;
    } else if (isEmailValid || isPasswordValid) {
      btnOverlap.style.left = "50%";
      twoStepFormSecondStepBtn.disabled = true;
    } else {
      btnOverlap.style.left = "";
      twoStepFormSecondStepBtn.disabled = true;
    }
  };

  twoStepFormEmailInput.addEventListener("focusout", () =>
    validateInputs("#4ED937", "#ff5530"),
  );
  twoStepFormPasswordInput.addEventListener("focusout", () =>
    validateInputs("#4ED937", "#ff5530"),
  );

  if (
    twoStepFormEmailInput.value === "" ||
    twoStepFormPasswordInput.value === ""
  ) {
    twoStepFormSecondStepBtn.disabled = true;
  }

  twoStepFormEmailInput.addEventListener("input", () => {
    twoStepFormEmailInput.style.color = "#8726FF";
    validateInputs("#4ED937", "#8726FF");
  });
  twoStepFormPasswordInput.addEventListener("input", () => {
    twoStepFormPasswordInput.style.color = "#8726FF";
    validateInputs("#4ED937", "#8726FF");
  });

  // Show password
  const passwordShowBtn = twoStepFormSecondStep.querySelector(
    ".two-step-password-show-btn",
  );
  passwordShowBtn.addEventListener("click", () => {
    let img = passwordShowBtn.querySelector("img");
    if (twoStepFormPasswordInput.type === "password") {
      twoStepFormPasswordInput.type = "text";
      img.setAttribute("src", "./img/twoStepFormImg/password-hide-icon.svg");
    } else {
      twoStepFormPasswordInput.type = "password";
      img.setAttribute("src", "./img/twoStepFormImg/password-show-icon.svg");
    }
  });
}

const validateStringInput = (input) => {
  return input.trim().replace(/\s+/g, " ");
};

// | STEP 3 -- FIRST NAME, LAST NAME, DATE, GENDER
const twoStepFormThirdStep = document.querySelector(".two-step-form-step-3");
if (twoStepFormThirdStep) {
  const firstName = twoStepFormThirdStep.querySelector(
    ".two-step-first-name-input",
  );
  const lastName = twoStepFormThirdStep.querySelector(
    ".two-step-last-name-input",
  );
  const twoStepBirthdayInput = twoStepFormThirdStep.querySelector(
    ".two-step-birthday-input",
  );

  const twoStepBirthdayAlert = document.querySelector(
    ".two-step-birthday-alert",
  );
  const twoStepBirthdayAlertInvalid = document.querySelector(
    ".two-step-birthday-alert-invalid",
  );

  const nextBtn = twoStepFormThirdStep.querySelector(".next-step-btn");
  const btnOverlap = twoStepFormThirdStep.querySelector(".disable-overlap");

  let isValidDate;
  let isValidAge;

  const calendar = flatpickr(twoStepBirthdayInput, {
    allowInput: true,
    dateFormat: "d.m.Y",
    maxDate: "today",
    disableMobile: true,
  });

  document
    .querySelector(".two-step-birthday-btn")
    .addEventListener("click", () => {
      calendar.open();
    });

  twoStepBirthdayInput.addEventListener("focus", () => {
    calendar.close();
  });

  twoStepBirthdayInput.addEventListener("input", function (e) {
    let value = twoStepBirthdayInput.value.replace(/\D/g, ""); // Remove non-numeric characters

    if (value.length > 8) value = value.slice(0, 8); // Limit input to 8 digits

    let formattedValue = "";

    if (value.length > 0) formattedValue += value.slice(0, 2);
    if (value.length > 2) formattedValue += "." + value.slice(2, 4);
    if (value.length > 4) formattedValue += "." + value.slice(4, 8);

    twoStepBirthdayInput.value = formattedValue;

    if (value.length >= 8) {
      calendar.setDate(formattedValue);
      calendar.close();
    }

    if (formattedValue.length === 10) {
      // Validate when input is fully entered
      const dateParts = formattedValue.split(".");
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10);
      const year = parseInt(dateParts[2], 10);

      // Convert to ISO format (YYYY-MM-DD)
      const isoDate = convertToISODate(year, month, day);
      twoStepFormData.birthday = isoDate;

      function convertToISODate(year, month, day) {
        const date = new Date(Date.UTC(year, month - 1, day));
        return date.toISOString().split("T")[0];
      }

      const currentYear = new Date().getFullYear(); // ✅ Added to get the current year for validation
      isValidDate = validateDate(day, month, year);

      // ✅ If the year is in the future, mark as an invalid date but prevent age validation
      if (year > currentYear) {
        isValidDate = false;
        isValidAge = true; // ✅ Prevents the "must be 18+" error when year > current year
      } else {
        isValidAge = validateAge(year, month, day); // ✅ Only validate age if date is valid and in the past
      }

      // ✅ Adjusted error display logic
      if (!isValidDate) {
        twoStepBirthdayAlertInvalid.classList.remove("hidden");
        twoStepBirthdayAlert.classList.add("hidden");
      } else if (!isValidAge) {
        twoStepBirthdayAlertInvalid.classList.add("hidden");
        twoStepBirthdayAlert.classList.remove("hidden");
      } else {
        twoStepBirthdayAlertInvalid.classList.add("hidden");
        twoStepBirthdayAlert.classList.add("hidden");
      }
    }
  });

  function validateDate(day, month, year) {
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }

  function validateAge(year, month, day) {
    const currentDate = new Date();
    const birthDate = new Date(year, month - 1, day);

    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const m = currentDate.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && currentDate.getDate() < birthDate.getDate())) {
      age--; // Если еще не был день рождения в текущем году
    }

    return age >= 18; // Проверяем, что возраст 18 или больше
  }

  // Validation
  nextBtn.disabled = true;

  const inputValidations = [
    {
      input: firstName,
      condition: (value) => value !== "", // First name must not be empty
    },
    {
      input: lastName,
      condition: (value) => value !== "", // Last name must not be empty
    },
    {
      input: twoStepBirthdayInput,
      condition: (value) => value.length === 10 && isValidDate && isValidAge, // Valid date (YYYY-MM-DD)
    },
  ];

  const validateInputs = () => {
    let validCount = 0; // Counter for valid inputs
    const totalInputs = inputValidations.length;

    // Validate each input
    inputValidations.forEach(({ input, condition }) => {
      const isValid = condition(input.value.trim()); // Check validity
      input.style.color = isValid ? "#41D937" : "#ff0000"; // Apply text color
      if (isValid) validCount++;
    });

    // Calculate and update button overlap position
    const percentage = (validCount / totalInputs) * 100;
    btnOverlap.style.left = `${percentage}%`;

    if (percentage === 100) {
      nextBtn.disabled = false;
      twoStepFormData.firstName = validateStringInput(firstName.value);
      twoStepFormData.lastName = validateStringInput(lastName.value);

      twoStepFormData.gender = document.querySelector(
        'input[name="gender"]:checked',
      ).value;
    } else {
      nextBtn.disabled = true;
    }
  };

  // Attach focusout event listener to each input
  inputValidations.forEach(({ input }) => {
    input.addEventListener("focusout", validateInputs);
  });
  inputValidations.forEach(({ input }) => {
    input.addEventListener("input", () => {
      validateInputs();
    });
  });

  // GENDER CHECKBOXES
  const genderCheckboxInputs = document.querySelectorAll(
    ".gender-checkbox-input",
  );

  genderCheckboxInputs.forEach((input) => {
    if (input) {
      input.addEventListener("change", () => {
        twoStepFormData.gender = input.value;
      });
    }
  });
}

// | STEP 4 -- FIRST NAME, LAST NAME, DATE, GENDER
const twoStepFormFourthStep = document.querySelector(".two-step-form-step-4");
if (twoStepFormFourthStep) {
  // ? Country
  const twoStepAppliedCountryInput = twoStepFormFourthStep.querySelector(
    ".two-step-country-input",
  );
  const twoStepAppliedCountryImage = twoStepFormFourthStep.querySelector(
    ".two-step-country-image",
  );
  const twoStepCountryWrapper = twoStepFormFourthStep.querySelector(
    ".two-step-country-wrapper",
  );
  const twoStepCountryButton = twoStepFormFourthStep.querySelector(
    ".two-step-country-button",
  );
  const twoStepCountryDropdown = twoStepFormFourthStep.querySelector(
    ".two-step-country-drowpdown",
  );
  const twoStepCountryList = twoStepCountryDropdown.querySelector(
    ".two-step-country-list",
  );
  const twoStepCountryListItems = twoStepCountryDropdown.querySelectorAll(
    ".two-step-country-list-item",
  );
  const twoStepCountrySearchInput = twoStepCountryDropdown.querySelector(
    ".two-step-country-search-input",
  );

  const headerlogoFlag = document.querySelector(".header-logo-flag");

  let isCanada = geoData.countryCode === "CA";
  let isAustralia = geoData.countryCode === "AU";

  // Dropdown visibility toggle
  twoStepCountryButton.addEventListener("click", () => {
    twoStepCountryDropdown.classList.toggle("hidden");
  });
  document.addEventListener("click", (event) => {
    if (!twoStepCountryWrapper.contains(event.target)) {
      // If the click is outside the dropdown and wrapper, hide the dropdown
      twoStepCountryDropdown.classList.add("hidden");
    }
  });

  if (isCanada || isAustralia) {
    renderStates(canadaProvincesCities);
    document
      .querySelector(".two-step-state-wrapper")
      .classList.remove("hidden");
  } else if (isAustralia) {
    renderStates(australiaStatesCities);
    document
      .querySelector(".two-step-state-wrapper")
      .classList.remove("hidden");
  } else {
    document.querySelector(".two-step-state-wrapper").classList.add("hidden");
  }

  // Render states
  function renderStates(data) {
    const ul = document.querySelector(".two-step-state-list");
    ul.innerHTML = "";

    Object.keys(data).forEach((state) => {
      const li = document.createElement("li");
      li.textContent = state;

      li.addEventListener("click", () => {
        twoStepStateInput.value = li.textContent.trim();
        twoStepStateInputLabel.classList.add("hidden");
        twoStepFormData.state = twoStepStateInput.value;
      });

      li.classList.add("two-step-state-list-item");
      ul.appendChild(li);
    });
  }

  // Choosing country from dropdown
  twoStepCountryList.addEventListener("click", (event) => {
    const item = event.target.closest(".two-step-country-list-item"); // Replace with your item class or selector
    if (item) {
      const countryCode = item.getAttribute("countryCode");
      const name = item.querySelector("span")?.textContent || "No name found";
      const imageUrl = item.querySelector("img")?.src || "No image found";
      twoStepAppliedCountryInput.value = name;
      twoStepAppliedCountryImage.src = imageUrl;
      twoStepAppliedCountryImage.alt = name;
      twoStepCountryDropdown.classList.add("hidden");
      twoStepFormData.country = countryCode;
      settingZipCodePlaceholder(countryCode);

      if (countryCode === "CA") {
        renderStates(canadaProvincesCities);
        document
          .querySelector(".two-step-state-wrapper")
          .classList.remove("hidden");
      } else if (countryCode === "AU") {
        renderStates(australiaStatesCities);
        document
          .querySelector(".two-step-state-wrapper")
          .classList.remove("hidden");
      } else {
        document
          .querySelector(".two-step-state-wrapper")
          .classList.add("hidden");
        twoStepFormData.state = "";
      }
    }
  });

  // Apply detected country
  const applyDetectedCountry = async () => {
    const locationData = geoData;
    settingZipCodePlaceholder(locationData.countryCode);

    const mathedCountry = countryFlags.find((country) => {
      return (
        country.slug.toLowerCase() === locationData.countryCode.toLowerCase()
      );
    });
    if (mathedCountry) {
      twoStepAppliedCountryInput.value = mathedCountry.name;
      twoStepAppliedCountryImage.src = `./img/flags/${mathedCountry.slug}.svg`;
      twoStepAppliedCountryImage.alt = mathedCountry.name;
      headerlogoFlag.src = `./img/flags/${mathedCountry.slug}.svg`;
      headerlogoFlag.alt = mathedCountry.name;
      headerlogoFlag.classList.remove("hidden");
      twoStepFormData.country = mathedCountry.slug.toUpperCase();
    }
  };

  applyDetectedCountry();
  // Adding countries to dropdown

  const renderCountries = (filter = "") => {
    twoStepCountryList.innerHTML = ""; // Clear existing list

    // Filter countries based on the search input
    const filteredCountries = countryFlags.filter((country) =>
      country.name.toLowerCase().includes(filter.toLowerCase()),
    );

    // Render each country in the filtered list
    filteredCountries.forEach((country) => {
      const listItem = document.createElement("li");
      listItem.setAttribute("countryCode", country.slug.toLocaleUpperCase());
      listItem.className =
        "two-step-country-list-item cursor-pointer flex items-center gap-[5px] border-b border-[#755EEB]/30 py-[10px]";

      const img = document.createElement("img");
      img.className =
        "pointer-events-none h-6 w-6 rounded-full overflow-hidden object-contain";
      img.width = 24;
      img.height = 24;
      img.src = `./img/flags/${country.slug}.svg`;
      img.alt = country.name;

      const span = document.createElement("span");
      span.className =
        "pointer-events-none text-base font-bold tracking-[-0.02em] text-[#1c1c1c]";
      span.textContent = country.name;

      listItem.appendChild(img);
      listItem.appendChild(span);
      twoStepCountryList.appendChild(listItem);
    });

    // If no countries match the search, show a message
    if (filteredCountries.length === 0) {
      const noResult = document.createElement("li");
      noResult.className = "text-gray-500 py-2";
      noResult.textContent = "No countries found.";
      twoStepCountryList.appendChild(noResult);
    }
  };

  // Event listener for the search input
  twoStepCountrySearchInput.addEventListener("input", (e) => {
    renderCountries(e.target.value);
  });

  // Initial render
  renderCountries();

  // ? VALIDATION
  const submitBtn = twoStepFormFourthStep.querySelector(".submit-btn");
  const btnOverlap = twoStepFormFourthStep.querySelector(".disable-overlap");
  const twoStepPhoneInput = twoStepFormFourthStep.querySelector(
    ".two-step-phone-input",
  );
  const twoStepCityInput = twoStepFormFourthStep.querySelector(
    ".two-step-city-input",
  );
  const twoStepAddressInput = twoStepFormFourthStep.querySelector(
    ".two-step-address-input",
  );
  const twoStepZipcodeInput = twoStepFormFourthStep.querySelector(
    ".two-step-zipcode-input",
  );

  const twoStepStateBtn = twoStepFormFourthStep.querySelector(
    ".two-step-state-wrapper",
  );
  const twoStepStateInput = twoStepStateBtn.querySelector(
    ".two-step-state-input",
  );
  const twoStepStateInputLabel = twoStepStateBtn.querySelector(
    ".two-step-state-label",
  );
  const twoStepStateList = twoStepFormFourthStep.querySelector(
    ".two-step-state-list",
  );
  const twoStepStateListItem = twoStepStateList.querySelectorAll(
    ".two-step-state-list-item",
  );

  if (!isCanada || !isAustralia) {
    twoStepStateBtn.classList.add("hidden");
    twoStepStateInput.value = "";
  } else {
    twoStepStateBtn.classList.remove("hidden");
  }

  twoStepCityInput.addEventListener("input", () => {
    const cityInput = twoStepCityInput.value.trim().toLowerCase();
    let foundProvince = "";

    if (cityInput.length > 0 && twoStepFormData.country === "CA") {
      // Only search if there's input
      for (const [province, cities] of Object.entries(canadaProvincesCities)) {
        if (
          cities.some((city) => city.toLowerCase().trim().includes(cityInput))
        ) {
          // Check partial match
          foundProvince = province;
          break;
        }
      }
    } else if (cityInput.length > 0 && twoStepFormData.country === "AU") {
      for (const [province, cities] of Object.entries(australiaStatesCities)) {
        if (
          cities.some((city) => city.toLowerCase().trim().includes(cityInput))
        ) {
          // Check partial match
          foundProvince = province;
          break;
        }
      }
    }

    if (foundProvince) {
      twoStepStateInput.value = foundProvince;
      twoStepStateInputLabel.classList.add("hidden");
      twoStepFormData.state = twoStepStateInput.value;
    } else {
      twoStepStateInput.value = "";
      twoStepStateInputLabel.classList.remove("hidden");
      twoStepFormData.state = "";
    }
  });

  twoStepStateInput.addEventListener("change", () => {
    if (twoStepStateInput.value !== "") {
      twoStepStateInputLabel.classList.add("hidden");
    }
  });

  twoStepStateBtn.addEventListener("click", () => {
    twoStepStateList.classList.toggle("hidden");
  });

  // Phone input only numbers
  twoStepPhoneInput.addEventListener("input", function (e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
  });

  submitBtn.disabled = true;

  const inputValidations1 = [
    {
      input: twoStepPhoneInput,
      condition: () => twoStepiti.isValidNumber(),
    },
    {
      input: twoStepCityInput,
      condition: (value) => value !== "", // Last name must not be empty
    },
    {
      input: twoStepAddressInput,
      condition: (value) => value !== "", // Valid date (YYYY-MM-DD)
    },
    {
      input: twoStepZipcodeInput,
      condition: (value) => value.length >= 2, // Valid date (YYYY-MM-DD)
    },
  ];

  const validateInputs1 = (validColor, invalidColor) => {
    let validCount = 0;
    const totalInputs = inputValidations1.length;

    let twoStepCode = twoStepiti.getSelectedCountryData().dialCode;
    let twoStepPhoneNumber = twoStepPhoneInput.value.trim();

    let sanitizedPhoneNumber = twoStepPhoneNumber.replace(/\D/g, "");
    let fullPhoneNumber = `${twoStepCode}${sanitizedPhoneNumber}`;

    // Validate each input
    inputValidations1.forEach(({ input, condition }) => {
      const isValid = condition(input.value.trim()); // Check validity
      input.style.color = isValid ? validColor : invalidColor; // Apply text color
      if (isValid) validCount++;
    });

    // Calculate and update button overlap position
    const percentage = (validCount / totalInputs) * 100;
    btnOverlap.style.left = `${percentage}%`;

    // If phone number is valid, log the full phone number

    if (percentage === 100) {
      submitBtn.disabled = false;
      twoStepFormData.city = validateStringInput(twoStepCityInput.value);
      twoStepFormData.address = validateStringInput(twoStepAddressInput.value);
      twoStepFormData.zipCode = validateStringInput(twoStepZipcodeInput.value);
      if (twoStepPhoneInput.value.trim() !== "" && twoStepiti.isValidNumber()) {
        twoStepFormData.phone = fullPhoneNumber;
      }
    } else {
      submitBtn.disabled = true;
    }
  };

  inputValidations1.forEach(({ input }) => {
    input.addEventListener("focusout", validateInputs1("#4ED937", "#ff5530"));
  });

  inputValidations1.forEach(({ input }) => {
    input.addEventListener("input", () => {
      validateInputs1("#4ED937", "#8726FF");
      input.style.color = "#8726FF";
    });
  });

  twoStepPhoneInput.addEventListener("countrychange", () => {
    twoStepPhoneInput.value = "";
    validateInputs1("#4ED937", "#8726FF");
  });
}

// | CHANGING STEPS
const nextStepBtn = document.querySelectorAll(".next-step-btn");
const headerbackBtn = document.querySelector(".two-step-header-back-btn");
const twoStepFormSteps = document.querySelectorAll(".two-step-form-step");

let initialStep = 1;

const showStep = (step) => {
  twoStepFormSteps.forEach((stepWrapper) => {
    stepWrapper.classList.remove("is-active");
    document
      .querySelector(`.two-step-form-step-${step}`)
      .classList.add("is-active");
  });
  const circles = document.querySelectorAll(".two-step-progress-circle");
  circles.forEach((circle, index) => {
    if (index < step) {
      circle.classList.add("active"); // Mark current and previous steps as active
    } else {
      circle.classList.remove("active"); // Remove active class from subsequent steps
    }
  });
  if (step > 1) {
    headerbackBtn.classList.add("is-visible");
  } else {
    headerbackBtn.classList.remove("is-visible");
  }
};
// showStep(4);

nextStepBtn.forEach((btn) => {
  if (btn) {
    btn.addEventListener("click", () => {
      initialStep++;
      showStep(initialStep);
    });
  }
});

if (headerbackBtn) {
  headerbackBtn.addEventListener("click", () => {
    initialStep--;
    showStep(initialStep);
  });
}

// | SUBMITTING FORM
const twoStepFormMain = document.querySelector(".two-step-form");

twoStepFormData.lang = localStorage.getItem("preferredLanguage");
let cid = getUrlParameter("cid");
let partner = getUrlParameter("partner");
let offer = getUrlParameter("offer");

twoStepFormMain.addEventListener("submit", (e) => {
  e.preventDefault();

  const twoStepSubmitBtn = twoStepFormMain.querySelector(".submit-btn");
  const btnLoader = twoStepSubmitBtn.querySelector(
    ".two-step-submit-btn-loader",
  );
  const btnIcon = twoStepSubmitBtn.querySelector(".two-step-submit-btn-icon");
  const btnText = twoStepSubmitBtn.querySelector(".two-step-submit-btn-text");
  btnIcon.classList.add("hidden");
  btnText.classList.add("hidden");
  btnLoader.classList.remove("hidden");
  twoStepSubmitBtn.disabled = true;

  let {
    address,
    birthday,
    bonus,
    city,
    state,
    country,
    currency,
    email,
    firstName,
    gender,
    lastName,
    password,
    phone,
    promocode,
    zipCode,
    lang,
  } = twoStepFormData;

  if (window.cioanalytics) {
    window.cioanalytics.ready(function () {
      window.cioanalytics.identify(email, {
        email,
        url: window.location.href,
      });
    });
  } else {
    console.error("Customer.io analytics not loaded yet.");
  }

  setTimeout(() => {
    window.location.href = `https://${newDomain}/api/register?env=prod&type=email&currency=${currency}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&phone=${phone}&bonus=${bonus}${promocode ? "&promocode=" + encodeURIComponent(promocode) : ""}&lang=${lang}${firstName ? "&f_name=" + encodeURIComponent(firstName) : ""}${lastName ? "&l_name=" + encodeURIComponent(lastName) : ""}${birthday ? "&birth=" + birthday : ""}${gender ? "&gender=" + gender : ""}${country ? "&country=" + country : ""}${state ? "&state=" + encodeURIComponent(state) : ""}${city ? "&city=" + encodeURIComponent(city) : ""}${zipCode ? "&postal=" + encodeURIComponent(zipCode) : ""}${address ? "&address=" + encodeURIComponent(address) : ""}${cid ? "&cid=" + cid : ""}${partner ? "&partner=" + partner : ""}${offer ? "&offer=" + offer : ""}`;
    console.log(
      `https://${newDomain}/api/register?env=prod&type=email&currency=${currency}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&phone=${phone}&bonus=${bonus}${promocode ? "&promocode=" + encodeURIComponent(promocode) : ""}&lang=${lang}${firstName ? "&f_name=" + encodeURIComponent(firstName) : ""}${lastName ? "&l_name=" + encodeURIComponent(lastName) : ""}${birthday ? "&birth=" + birthday : ""}${gender ? "&gender=" + gender : ""}${country ? "&country=" + country : ""}${state ? "&state=" + encodeURIComponent(state) : ""}${city ? "&city=" + encodeURIComponent(city) : ""}${zipCode ? "&postal=" + encodeURIComponent(zipCode) : ""}${address ? "&address=" + encodeURIComponent(address) : ""}${cid ? "&cid=" + cid : ""}${partner ? "&partner=" + partner : ""}${offer ? "&offer=" + offer : ""}`,
    );
  }, 300);
});

gsap.to(".preloader", { opacity: 0, duration: 0.25, delay: 0.5 });
