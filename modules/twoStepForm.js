import { countryCurrencyData, countryFlags } from "../public/data";
import { geoData, settingZipCodePlaceholder } from "./geoLocation";
import { twoStepiti } from "./itiTelInput";
import { newDomain } from "./fetchingDomain";
import { getUrlParameter } from "./params";
import gsap from "gsap";
import { canadaProvincesCities, australiaStatesCities } from "../public/data";
import { isValidPhoneNumber } from "libphonenumber-js";
import flatpickr from "flatpickr";
import { isDisposableEmail } from "./disposableEmail";
import {
  checkPhoneAvailability,
  getPhoneStatus,
  phoneTakenMessage,
} from "./phoneAvailability";
import {
  checkEmailAvailability,
  getEmailStatus,
  normalizeEmail,
  emailTakenMessage,
} from "./emailAvailability";

const CDN = "https://3344112-img.b-cdn.net";

document.querySelectorAll("input").forEach((input) => {
  input.setAttribute("autocomplete", "off");
});

const bonusSumAndWager = [
  { currency: "EUR", amount: 20 },
  { currency: "USD", amount: 20 },
  { currency: "CAD", amount: 30 },
  { currency: "NZD", amount: 35 },
  { currency: "AUD", amount: 30 },
  { currency: "ARS", amount: 30000 },
  { currency: "COP", amount: 75000 },
  { currency: "CLP", amount: 25000 },
  { currency: "MXN", amount: 365 },
  { currency: "BRL", amount: 100 },
  { currency: "TRY", amount: 850 },
  { currency: "INR", amount: 1800 },
  { currency: "AZN", amount: 35 },
  { currency: "UZS", amount: 200000 },
  { currency: "IDR", amount: 300000 },
  { currency: "UAH", amount: 850 },
  { currency: "BDT", amount: 2500 },
  { currency: "KGS", amount: 1750 },
  { currency: "KZT", amount: 10000 },
  { currency: "XOF", amount: 3800 },
  { currency: "HUF", amount: 6500 },
  { currency: "XAF", amount: 3800 },
  { currency: "GHS", amount: 110 },
  { currency: "DKK", amount: 150 },
  { currency: "EGP", amount: 480 },
  { currency: "ZMW", amount: 90 },
  { currency: "KES", amount: 860 },
  { currency: "CHF", amount: 20 },
  { currency: "MAD", amount: 94 },
  { currency: "NGN", amount: 24500 },
  { currency: "NOK", amount: 200 },
  { currency: "PLN", amount: 100 },
  { currency: "RWF", amount: 6000 },
  { currency: "RON", amount: 100 },
  { currency: "TZS", amount: 10000 },
  { currency: "UGX", amount: 14800 },
  { currency: "CZK", amount: 500 },
  { currency: "ZAR", amount: 350 },
  { currency: "SLL", amount: 90 },
];

function getBonusConfig(currencyCode) {
  const item = bonusSumAndWager.find((p) => p.currency === currencyCode);
  return item || { currency: "USD", amount: 20 };
}

export function initBonus(currencyCode) {
  const bonusConfig = getBonusConfig(currencyCode);
  const currency = getUrlParameter("currency") || bonusConfig.currency;
  const sumAmount = getUrlParameter("sumAmount") || bonusConfig.amount;

  document.querySelectorAll(".bonus-sum-amount").forEach((element) => {
    element.innerHTML = sumAmount;
  });

  document.querySelectorAll(".bonus-sum-currency").forEach((element) => {
    element.innerHTML = currency;
  });
}

// ? SOCIALS TWO STEP FORM

export let twoStepFormData = {
  bonus: "",
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

function getSelectedBonusCheckbox() {
  const checkedInput = document.querySelector('input[name="bonus"]:checked');
  return checkedInput ? checkedInput.closest(".two-step-bonus-checkbox") : null;
}

export function syncAppliedBonus() {
  const selectedBonusCheckbox = getSelectedBonusCheckbox();

  if (!selectedBonusCheckbox) {
    return;
  }

  const input = selectedBonusCheckbox.querySelector('input[name="bonus"]');
  const bonusImg = input?.getAttribute("data-img") || "";
  const bonusName =
    selectedBonusCheckbox.querySelector(".two-step-bonus-checkbox-name")
      ?.innerHTML || "";
  const bonusText =
    selectedBonusCheckbox.querySelector(".two-step-bonus-checkbox-text")
      ?.innerHTML || "";

  appliedBonusWrapper.forEach((appliedBonus) => {
    const img = appliedBonus.querySelector(".applied-bonus-img");
    const name = appliedBonus.querySelector(".applied-bonus-name");
    const text = appliedBonus.querySelector(".applied-bonus-text");

    if (img) {
      img.setAttribute("src", bonusImg);
    }

    if (name) {
      name.innerHTML = bonusName;
    }

    if (text) {
      text.innerHTML = bonusText;
    }
  });
}

twoStepBonusCheckbox.forEach((checkbox) => {
  const input = checkbox.querySelector("input");
  input.addEventListener("change", () => {
    const bonusValue = input.value;

    twoStepFormData.bonus = bonusValue;

    twoStepFormData.bonus = checkTir1CurrencyMatch(
      twoStepFormData.currency,
      twoStepFormData.bonus,
    );

    syncAppliedBonus();
  });
});

syncAppliedBonus();

export const settingInitialBonusValue = (currency) => {
  const currencyEntry = countryCurrencyData.find(
    (entry) => entry.countryCurrency === currency,
  );

  if (currencyEntry) {
    document.querySelectorAll(".two-step-welcome-amount").forEach((el) => {
      el.innerHTML = currencyEntry.amount;
      el.classList.remove("blurred");
    });
    document.querySelectorAll(".two-step-welcome-symbol").forEach((el) => {
      el.innerHTML = currencyEntry.countryCurrencySymbol;
      el.classList.remove("blurred");
    });
    document.querySelectorAll(".two-step-bonus-spins").forEach((el) => {
      el.innerHTML = currencyEntry.spins;
      el.classList.remove("blurred");
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

  const currentEmail = () => normalizeEmail(twoStepFormEmailInput.value);

  // Zeruh (email-guard) подтвердил доставляемость? Если сниппета нет — fail-open (true).
  const emailDeliverableOk = () =>
    !(window.EmailGuard && window.EmailGuard.isValid) ||
    window.EmailGuard.isValid(twoStepFormEmailInput);

  const isEmailFieldValid = () => {
    const v = twoStepFormEmailInput.value.trim();
    if (!regex.test(v) || isDisposableEmail(v)) return false;
    // 1) Zeruh: пока не подтвердил доставляемость — false (кнопка выключена).
    if (!emailDeliverableOk()) return false;
    // 2) Занятость (наш API): пока вердикта нет — false; ошибка → fail-open; занята → false.
    const st = getEmailStatus(currentEmail());
    if (!st || st.pending) return false;
    if (st.errored) return true;
    return st.available === true;
  };

  // Формат ок и локальные проверки пройдены — можно дёргать внешние проверки.
  const emailPassesLocalChecks = () => {
    const v = twoStepFormEmailInput.value.trim();
    return regex.test(v) && !isDisposableEmail(v);
  };

  // Проверка занятости почты ещё идёт (формат ок + Zeruh ок, но вердикта занятости нет).
  const isEmailAvailPending = () => {
    if (!emailPassesLocalChecks() || !emailDeliverableOk()) return false;
    const st = getEmailStatus(currentEmail());
    return !st || st.pending;
  };

  // Запустить проверку занятости почты — только если формат ок и Zeruh не против.
  const maybeCheckEmailAvailability = () => {
    if (!emailPassesLocalChecks() || !emailDeliverableOk()) return;
    checkEmailAvailability(currentEmail()).then(() =>
      validateInputs("#4ED937", "#ff5530"),
    );
  };

  // Сообщение «этот e-mail нельзя использовать» — только при однозначном «занята».
  const emailAlertEl = document.querySelector(".two-step-email-alert");
  const updateEmailAlert = () => {
    if (!emailAlertEl) return;
    const st = getEmailStatus(currentEmail());
    const taken =
      emailPassesLocalChecks() &&
      emailDeliverableOk() &&
      st &&
      !st.pending &&
      !st.errored &&
      st.available === false;
    if (taken) {
      const lang =
        document.documentElement.getAttribute("lang") ||
        localStorage.getItem("preferredLanguage") ||
        "en";
      emailAlertEl.textContent = emailTakenMessage(lang);
      emailAlertEl.classList.remove("hidden");
    } else {
      emailAlertEl.classList.add("hidden");
    }
  };

  const isPasswordFieldValid = () =>
    twoStepFormPasswordInput.value.trim().length >= 6;

  const validateInputs = (validColor, invalidColor) => {
    const fields = [
      { input: twoStepFormEmailInput, isValid: isEmailFieldValid() },
      { input: twoStepFormPasswordInput, isValid: isPasswordFieldValid() },
    ];

    let validCount = 0;
    fields.forEach(({ input, isValid }) => {
      // Во время проверки занятости — нейтральный цвет, не красный.
      if (input === twoStepFormEmailInput && isEmailAvailPending()) {
        input.style.color = "#8726FF";
      } else {
        input.style.color = isValid ? validColor : invalidColor;
      }
      if (isValid) validCount++;
    });

    updateEmailAlert();

    const percentage = (validCount / fields.length) * 100;
    btnOverlap.style.left = `${percentage}%`;

    if (percentage === 100) {
      twoStepFormData.email = twoStepFormEmailInput.value;
      twoStepFormData.password = twoStepFormPasswordInput.value;
      twoStepFormSecondStepBtn.disabled = false;
    } else {
      twoStepFormSecondStepBtn.disabled = true;
    }
  };

  twoStepFormSecondStepBtn.disabled = true;

  const attachListeners = (input) => {
    input.addEventListener("focusout", () =>
      validateInputs("#4ED937", "#ff5530"),
    );
    input.addEventListener("input", () => {
      input.style.color = "#8726FF";
      validateInputs("#4ED937", "#8726FF");
    });
  };

  attachListeners(twoStepFormEmailInput);
  attachListeners(twoStepFormPasswordInput);

  // Проверка занятости почты (наш API) — запускаем ПОСЛЕ Zeruh.
  twoStepFormEmailInput.addEventListener("emailguard:result", () => {
    maybeCheckEmailAvailability(); // Zeruh подтвердил → запускаем проверку занятости
    validateInputs("#4ED937", "#ff5530");
  });
  // Фолбэк, если email-guard не загрузился: запустить занятость на blur.
  twoStepFormEmailInput.addEventListener(
    "focusout",
    maybeCheckEmailAvailability,
  );

  // ? EMAIL-GUARD (Zeruh): пересчёт кнопки по async-вердикту + спиннер проверки
  const emailSpinner = twoStepFormSecondStep.querySelector(
    ".two-step-email-spinner",
  );
  const hideSpinner = () => emailSpinner?.classList.add("hidden");

  // вердикт Zeruh прилетел асинхронно → пересчитать кнопку и убрать спиннер
  twoStepFormEmailInput.addEventListener("emailguard:result", () => {
    validateInputs("#4ED937", "#8726FF");
    if (!window.EmailGuard?.isPending?.(twoStepFormEmailInput)) hideSpinner();
  });
  // почта ушла в Zeruh (синтаксис ок, вердикта ещё нет) → показать спиннер
  twoStepFormEmailInput.addEventListener("focusout", () => {
    if (window.EmailGuard?.isPending?.(twoStepFormEmailInput)) {
      emailSpinner?.classList.remove("hidden");
    }
  });
  // правка поля → активной проверки нет, перезапустится на blur
  twoStepFormEmailInput.addEventListener("input", hideSpinner);

  // Перевести уже показанное сообщение «занято» при смене языка сайта
  // (язык меняется через атрибут <html lang>, у алерта нет data-translate).
  new MutationObserver(updateEmailAlert).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });

  // Фейловер: если на blur API не ответил за таймаут (fail-open включил кнопку),
  // добиваем проверку занятости почты на клике «Далее».
  // Регистрируется раньше глобального advance-хендлера → при блоке его перебивает.
  const isDefinitiveEmail = (st) =>
    !!st && !st.pending && !st.errored && typeof st.available === "boolean";

  twoStepFormSecondStepBtn.addEventListener("click", async (e) => {
    const needEmail =
      emailPassesLocalChecks() &&
      emailDeliverableOk() &&
      !isDefinitiveEmail(getEmailStatus(currentEmail()));

    if (!needEmail) return; // вердикт есть → глобальный хендлер пускает

    // Однозначного ответа нет → придержать переход и перечекнуть.
    e.preventDefault();
    e.stopImmediatePropagation();
    validateInputs("#4ED937", "#ff5530"); // показать pending
    await checkEmailAvailability(currentEmail());
    validateInputs("#4ED937", "#ff5530"); // обновить алерт/кнопку по вердикту

    if (getEmailStatus(currentEmail())?.available !== false) {
      // свободна (или снова не дозвонились → fail-open) → переходим
      initialStep++;
      showStep(initialStep);
    }
    // занята → остаёмся на шаге: алерт показан, кнопка станет disabled
  });

  // Show password
  const passwordShowBtn = twoStepFormSecondStep.querySelector(
    ".two-step-password-show-btn",
  );
  passwordShowBtn.addEventListener("click", () => {
    let img = passwordShowBtn.querySelector("img");
    if (twoStepFormPasswordInput.type === "password") {
      twoStepFormPasswordInput.type = "text";
      img.setAttribute(
        "src",
        CDN + "/graphic/landings/twoStepFormImages/password-hide-icon.svg",
      );
    } else {
      twoStepFormPasswordInput.type = "password";
      img.setAttribute(
        "src",
        CDN + "/graphic/landings/twoStepFormImages/password-show-icon.svg",
      );
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

  const minBirthDate = new Date();
  minBirthDate.setFullYear(minBirthDate.getFullYear() - 100);

  const calendar = flatpickr(twoStepBirthdayInput, {
    allowInput: true,
    dateFormat: "d.m.Y",
    maxDate: "today",
    minDate: minBirthDate,
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
      } else if (currentYear - year > 100) {
        isValidDate = false;
        isValidAge = true;
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

  const headerlogoFlag = document.querySelectorAll(".header-logo-flag");

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
      twoStepAppliedCountryImage.src =
        CDN + `/graphic/flags/flag-${mathedCountry.slug}.svg`;
      twoStepAppliedCountryImage.alt = mathedCountry.name;

      headerlogoFlag.forEach((flag) => {
        flag.src = CDN + `/graphic/flags/flag-${mathedCountry.slug}.svg`;
        flag.alt = mathedCountry.name;
        flag.classList.remove("hidden");
      });
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
      img.src = CDN + `/graphic/flags/flag-${country.slug}.svg`;

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

  submitBtn.disabled = true;

  const currentPhoneE164 = () => {
    const dialCode = twoStepiti.getSelectedCountryData().dialCode;
    const digits = twoStepPhoneInput.value.trim().replace(/\D/g, "");
    return `+${dialCode}${digits}`;
  };

  const isPhoneFormatValid = () => {
    const countryCode = twoStepiti.getSelectedCountryData().iso2?.toUpperCase();
    const dialCode = twoStepiti.getSelectedCountryData().dialCode;
    const digits = twoStepPhoneInput.value.trim().replace(/\D/g, "");
    if (!digits || !countryCode) return false;
    return isValidPhoneNumber(`+${dialCode}${digits}`, countryCode);
  };

  // ? IPQS (phone-guard): кормим сниппет номером (E.164 + страна) из data-атрибутов.
  // Пишем ТОЛЬКО при валидном формате, чтобы не бить IPQS по неполному вводу.
  const syncPhoneGuardData = () => {
    if (isPhoneFormatValid()) {
      const { dialCode, iso2 } = twoStepiti.getSelectedCountryData();
      const digits = twoStepPhoneInput.value.trim().replace(/\D/g, "");
      twoStepPhoneInput.dataset.pgE164 = `${dialCode}${digits}`; // только цифры, без "+"
      twoStepPhoneInput.dataset.pgCountry = (iso2 || "").toUpperCase();
    } else {
      delete twoStepPhoneInput.dataset.pgE164;
      delete twoStepPhoneInput.dataset.pgCountry;
    }
  };

  // IPQS подтвердил реальность номера? Если сниппета нет — fail-open (true).
  const isPhoneGuardValid = () =>
    !window.PhoneGuard || window.PhoneGuard.isValid(twoStepPhoneInput);
  // Вердикта IPQS ещё нет (формат ок, но проверка не завершена) → ждём.
  const isPhoneGuardPending = () =>
    !!window.PhoneGuard && window.PhoneGuard.isPending(twoStepPhoneInput);

  // Проверка занятости ещё идёт (формат ок, но вердикта нет).
  const isPhonePending = () => {
    if (!isPhoneFormatValid()) return false;
    const st = getPhoneStatus(currentPhoneE164());
    return !st || st.pending;
  };

  // Спиннер IPQS: флаг ставится на blur (когда реально запускаем) и снимается на
  // phoneguard:result. НЕ вешать спиннер на isPending — он true уже во время ввода.
  let isIpqsChecking = false;

  // Реально летит запрос (IPQS на blur или занятость pending) — для спиннера.
  const isPhoneChecking = () => {
    if (!isPhoneFormatValid()) return false;
    if (isIpqsChecking) return true;
    const st = getPhoneStatus(currentPhoneE164());
    return !!st && st.pending;
  };

  const phoneSpinnerEl = document.querySelector(".two-step-phone-spinner");
  const updatePhoneSpinner = () => {
    if (!phoneSpinnerEl) return;
    phoneSpinnerEl.classList.toggle("hidden", !isPhoneChecking());
  };

  // Полная валидность для гейтинга кнопки: формат ок И номер НЕ занят.
  // Пока проверка идёт / нет данных → false (кнопка выключена, проскочить нельзя).
  // Ошибка проверки (сеть/таймаут/4xx/5xx) → fail-open (не блокируем лид).
  const isPhoneFieldValid = () => {
    if (!isPhoneFormatValid()) return false;
    if (isPhoneGuardPending()) return false; // ждём вердикт IPQS
    if (!isPhoneGuardValid()) return false; // valid:false/active:false → блок
    const st = getPhoneStatus(currentPhoneE164());
    if (!st || st.pending) return false;
    if (st.errored) return true;
    return st.available === true;
  };

  // Сообщение «номер нельзя использовать» — показываем только при однозначном «занят».
  const phoneAlertEl = document.querySelector(".two-step-phone-alert");
  const updatePhoneAlert = () => {
    if (!phoneAlertEl) return;
    const st = getPhoneStatus(currentPhoneE164());
    const taken =
      isPhoneFormatValid() &&
      st &&
      !st.pending &&
      !st.errored &&
      st.available === false;
    if (taken) {
      const lang =
        document.documentElement.getAttribute("lang") ||
        localStorage.getItem("preferredLanguage") ||
        "en";
      phoneAlertEl.textContent = phoneTakenMessage(lang);
      phoneAlertEl.classList.remove("hidden");
    } else {
      phoneAlertEl.classList.add("hidden");
    }
  };

  const inputValidations1 = [
    {
      input: twoStepPhoneInput,
      condition: () => isPhoneFieldValid(),
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
      // Во время проверки (занятость или IPQS) — нейтральный цвет, не красный.
      if (
        input === twoStepPhoneInput &&
        (isPhonePending() || isPhoneChecking())
      ) {
        input.style.color = "#8726FF";
      } else {
        input.style.color = isValid ? validColor : invalidColor; // Apply text color
      }
      if (isValid) validCount++;
    });

    updatePhoneAlert();
    updatePhoneSpinner();

    // Calculate and update button overlap position
    const percentage = (validCount / totalInputs) * 100;
    btnOverlap.style.left = `${percentage}%`;

    if (percentage === 100) {
      submitBtn.disabled = false;
      twoStepFormData.city = validateStringInput(twoStepCityInput.value);
      twoStepFormData.address = validateStringInput(twoStepAddressInput.value);
      twoStepFormData.zipCode = validateStringInput(twoStepZipcodeInput.value);
      twoStepFormData.phone = fullPhoneNumber;
    } else {
      submitBtn.disabled = true;
    }
  };

  inputValidations1.forEach(({ input }) => {
    input.addEventListener("focusout", () =>
      validateInputs1("#4ED937", "#ff5530"),
    );
  });

  inputValidations1.forEach(({ input }) => {
    input.addEventListener("input", () => {
      validateInputs1("#4ED937", "#8726FF");
      input.style.color = "#8726FF";
    });
  });

  // Телефон: на blur запускаем IPQS (сниппет сам, по data-атрибутам) + проверку
  // занятости, на вердикт — пересчёт кнопки.
  const triggerPhoneCheck = () => {
    syncPhoneGuardData(); // отдать сниппету номер до того, как он прочтёт на blur
    if (isPhoneGuardPending()) isIpqsChecking = true; // запустился IPQS → крутим спиннер
    if (isPhoneFormatValid()) {
      checkPhoneAvailability(currentPhoneE164()).then(() =>
        validateInputs1("#4ED937", "#ff5530"),
      );
    }
    validateInputs1("#4ED937", "#ff5530"); // мгновенно отразить pending/формат
  };
  twoStepPhoneInput.addEventListener("focusout", triggerPhoneCheck);
  twoStepPhoneInput.addEventListener("input", syncPhoneGuardData);

  // Вердикт IPQS прилетел асинхронно → снять спиннер и пересчитать кнопку/рамку.
  twoStepPhoneInput.addEventListener("phoneguard:result", () => {
    isIpqsChecking = false;
    validateInputs1("#4ED937", "#ff5530");
  });

  twoStepPhoneInput.addEventListener("countrychange", () => {
    twoStepPhoneInput.value = "";
    syncPhoneGuardData();
    validateInputs1("#4ED937", "#8726FF");
  });

  // Перевести уже показанное сообщение «занято» при смене языка сайта
  // (язык меняется через атрибут <html lang>, у алерта нет data-translate).
  new MutationObserver(() => {
    updatePhoneAlert();
    // Перерисовать хинт IPQS на новом языке, если номер сейчас заблокирован.
    if (
      window.PhoneGuard &&
      twoStepPhoneInput.getAttribute("data-pg-state") === "blocked"
    ) {
      window.PhoneGuard.verify(twoStepPhoneInput);
    }
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });

  // Фейловер: если на blur API не ответил за таймаут (fail-open включил кнопку),
  // добиваем проверку занятости телефона на клике «Отправить». Клик по submit-кнопке
  // перехватывается раньше сабмита формы → при блоке отправка не уходит.
  const isDefinitivePhone = (st) =>
    !!st && !st.pending && !st.errored && typeof st.available === "boolean";

  submitBtn.addEventListener("click", async (e) => {
    if (!isPhoneFormatValid()) return;
    if (isDefinitivePhone(getPhoneStatus(currentPhoneE164()))) return;

    // Однозначного ответа нет → придержать сабмит и перечекнуть.
    e.preventDefault();
    validateInputs1("#4ED937", "#ff5530"); // показать pending (спиннер телефона)
    await checkPhoneAvailability(currentPhoneE164());
    validateInputs1("#4ED937", "#ff5530"); // обновить алерт/кнопку по вердикту

    if (getPhoneStatus(currentPhoneE164())?.available !== false) {
      // не занят (или снова не дозвонились → fail-open) → отправляем форму
      document.querySelector(".two-step-form").requestSubmit();
    }
    // занят → остаёмся на шаге: алерт показан, кнопка станет disabled
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
// showStep(2);

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

  console.log(twoStepFormData);

  window.location.href = `https://${newDomain}/api/register?env=prod&type=email&currency=${currency}&email=${encodeURIComponent(email)}&password=${password}&phone=${phone}&bonus=${bonus}${promocode ? "&promocode=" + promocode : ""}&lang=${lang}${firstName ? "&f_name=" + encodeURIComponent(firstName) : ""}${lastName ? "&l_name=" + encodeURIComponent(lastName) : ""}${birthday ? "&birth=" + birthday : ""}${gender ? "&gender=" + gender : ""}${country ? "&country=" + country : ""}${state ? "&state=" + encodeURIComponent(state) : ""}${city ? "&city=" + encodeURIComponent(city) : ""}${zipCode ? "&postal=" + encodeURIComponent(zipCode) : ""}${address ? "&address=" + encodeURIComponent(address) : ""}${cid ? "&cid=" + cid : ""}${partner ? "&partner=" + partner : ""}${offer ? "&offer=" + offer : ""}`;
  console.log(
    `https://${newDomain}/api/register?env=prod&type=email&currency=${currency}&email=${encodeURIComponent(email)}&password=${password}&phone=${phone}&bonus=${bonus}${promocode ? "&promocode=" + promocode : ""}&lang=${lang}${firstName ? "&f_name=" + encodeURIComponent(firstName) : ""}${lastName ? "&l_name=" + encodeURIComponent(lastName) : ""}${birthday ? "&birth=" + birthday : ""}${gender ? "&gender=" + gender : ""}${country ? "&country=" + country : ""}${state ? "&state=" + encodeURIComponent(state) : ""}${city ? "&city=" + encodeURIComponent(city) : ""}${zipCode ? "&postal=" + encodeURIComponent(zipCode) : ""}${address ? "&address=" + encodeURIComponent(address) : ""}${cid ? "&cid=" + cid : ""}${partner ? "&partner=" + partner : ""}${offer ? "&offer=" + offer : ""}`,
  );
});
