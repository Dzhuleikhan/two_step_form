import datepicker from "js-datepicker";
import "js-datepicker/dist/datepicker.min.css";
import { countryFlags } from "../public/data";
import { getLocation } from "./geoLocation";
import { twoStepiti } from "./itiTelInput";
import { newDomain } from "./fetchingDomain";
import { getUrlParameter } from "./params";
// ? SOCIALS TWO STEP FORM

let twoStepFormData = {
  bonus: "",
  promocode: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  birthday: "",
  gender: "",
  country: "",
  currency: "",
  phone: "",
  state: "",
  city: "",
  address: "",
  zipCode: "",
};

twoStepFormData.bonus = document.querySelector(
  'input[name="bonus"]:checked',
).value;

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
    const bonusName = input.getAttribute("data-name");
    const bonusText = input.getAttribute("data-text");

    twoStepFormData.bonus = bonusValue;

    appliedBonusWrapper.forEach((appliedBonus) => {
      const img = appliedBonus.querySelector(".applied-bonus-img");
      const name = appliedBonus.querySelector(".applied-bonus-name");
      const text = appliedBonus.querySelector(".applied-bonus-text");

      img.setAttribute("src", bonusImg);
      name.textContent = bonusName;
      text.textContent = bonusText;
    });
  });
});

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
const twoStepPromocodeInput = document.querySelector(
  ".two-step-promocode-input",
);

if (twoStepPromocodeInput) {
  twoStepPromocodeInput.addEventListener("input", async () => {
    twoStepFormData.promocode = twoStepPromocodeInput.value;

    const promoCode = twoStepPromocodeInput.value;

    try {
      const response = await fetch("http://localhost:3000/check-promo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: promoCode }),
      });

      const result = await response.json();

      if (result.valid) {
        twoStepFormData.promocode = twoStepPromocodeInput.value.toUpperCase();
        console.log("Промокод верный");
      } else {
        twoStepFormData.promocode = "";
        console.log("Промокод неверный");
      }
    } catch (error) {
      console.error("Ошибка при проверке промокода:", error);
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
    /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

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
  const twoStepBirthdayBtn = twoStepFormThirdStep.querySelector(
    "#two-step-birthday-btn",
  );
  const nextBtn = twoStepFormThirdStep.querySelector(".next-step-btn");
  const btnOverlap = twoStepFormThirdStep.querySelector(".disable-overlap");

  // Calendar
  const calendar = datepicker(twoStepBirthdayInput, {
    formatter: (input, date) => {
      const value = date.toLocaleDateString();
      input.value = value;
    },
    onSelect: (date) => {
      validateInputs();
    },
  });
  twoStepBirthdayBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    calendar.show();
  });

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
      condition: (value) => value !== "", // Valid date (YYYY-MM-DD)
    },
  ];

  const validateInputs = () => {
    let validCount = 0; // Counter for valid inputs
    const totalInputs = inputValidations.length;

    // Validate each input
    inputValidations.forEach(({ input, condition }) => {
      const isValid = condition(input.value.trim()); // Check validity
      input.style.color = isValid ? "#4ED937" : "#ff5530"; // Apply text color
      if (isValid) validCount++;
    });

    // Calculate and update button overlap position
    const percentage = (validCount / totalInputs) * 100;
    btnOverlap.style.left = `${percentage}%`;

    if (percentage === 100) {
      nextBtn.disabled = false;
      twoStepFormData.firstName = firstName.value;
      twoStepFormData.lastName = lastName.value;
      twoStepFormData.birthday = twoStepBirthdayInput.value;
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
      input.style.color = "#755EEB";
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
  const currenctCurrency = JSON.parse(localStorage.getItem("currencyData"));

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

  // Choosing country from dropdown
  twoStepCountryList.addEventListener("click", (event) => {
    const item = event.target.closest(".two-step-country-list-item"); // Replace with your item class or selector
    if (item) {
      const name = item.querySelector("span")?.textContent || "No name found";
      const imageUrl = item.querySelector("img")?.src || "No image found";
      twoStepAppliedCountryInput.value = name;
      twoStepAppliedCountryImage.src = imageUrl;
      twoStepAppliedCountryImage.alt = name;
      twoStepCountryDropdown.classList.add("hidden");
    }
  });

  // Apply detected country
  const applyDetectedCountry = async () => {
    const locationData = await getLocation();

    const mathedCountry = countryFlags.find((country) => {
      return (
        country.slug.toLowerCase() === locationData.countryCode.toLowerCase()
      );
    });
    if (mathedCountry) {
      twoStepAppliedCountryInput.value = mathedCountry.name;
      twoStepAppliedCountryImage.src = `./img/flags/${mathedCountry.slug}.svg`;
      twoStepAppliedCountryImage.alt = mathedCountry.name;
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
    renderCountries(e.target.value); // Pass the search input value to the render function
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
      condition: (value) => value !== "", // Valid date (YYYY-MM-DD)
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
      twoStepFormData.country = twoStepAppliedCountryInput.value;
      twoStepFormData.currency = currenctCurrency.abbr;
      twoStepFormData.city = twoStepCityInput.value;
      twoStepFormData.address = twoStepAddressInput.value;
      twoStepFormData.zipCode = twoStepZipcodeInput.value;
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
showStep(initialStep);

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

twoStepFormMain.addEventListener("submit", (e) => {
  e.preventDefault();
  const {
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
  console.log(twoStepFormData);

  window.location.href = `https://${newDomain}/api/register?env=prod&type=phone&currency=${currency}&email=${email}&password=${password}&phone=+${phone}$&bonus=${bonus}${promocode ? "&promocode=" + promocode : ""}&lang=${lang}${firstName ? "&f_name=" + firstName : ""}${lastName ? "&l_name=" + lastName : ""}${birthday ? "&birth=" + birthday : ""}${gender ? "&gender=" + gender : ""}${country ? "&country=" + country : ""}${state ? "&state=" + state : ""}${city ? "&city=" + city : ""}${zipCode ? "&postal=" + zipCode : ""}${address ? "&address=" + encodeURIComponent(address) : ""}${cid ? "&cid=" + cid : ""}`;
  console.log(
    `https://${newDomain}/api/register?env=prod&type=email&currency=${currency}&email=${email}&password=${password}&phone=+${phone}$&bonus=${bonus}${promocode ? "&promocode=" + promocode : ""}&lang=${lang}${firstName ? "&f_name=" + firstName : ""}${lastName ? "&l_name=" + lastName : ""}${birthday ? "&birth=" + birthday : ""}${gender ? "&gender=" + gender : ""}${country ? "&country=" + country : ""}${state ? "&state=" + state : ""}${city ? "&city=" + city : ""}${zipCode ? "&postal=" + zipCode : ""}${address ? "&address=" + encodeURIComponent(address) : ""}${cid ? "&cid=" + cid : ""}`,
  );
});
