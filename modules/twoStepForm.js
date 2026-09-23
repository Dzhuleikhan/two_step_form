import {
  countryCurrencyData,
  countryFlags,
  getPostalCodeMode,
  getPostalCodeFormat,
  getAddressFieldOrder,
  getRegionMode,
  getRegionOptions,
  getRegionByPostalCode,
  getFieldLabelKey,
  getLocalFieldLabel,
  isHouseNumberRequired,
  hasApartmentField,
  formatPostalCode,
  validatePostalCodeFormat,
} from "../public/data";
import { geoData, settingZipCodePlaceholder } from "./geoLocation";
import { translations } from "/public/translations";
import { twoStepiti } from "./itiTelInput";
import { newDomain } from "./fetchingDomain";
import { getUrlParameter } from "./params";
import gsap from "gsap";
import { enableKeyboardSelect } from "./keyboardSelect";
import { isValidPhoneNumber } from "libphonenumber-js";
import flatpickr from "flatpickr";
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

const translate = (lang, key) =>
  translations[lang]?.[key] ?? translations.en[key];

// Страховка к атрибутам в разметке: добиваем поля, которым autocomplete не
// проставлен (в том числе созданные скриптом — поиск стран у телефона).
// Уже заданное значение не трогаем: у пароля стоит new-password, и только этот
// токен отучает Chrome подставлять сохранённую пару логин+пароль — "off" он на
// паролях игнорирует.
document.querySelectorAll("input").forEach((input) => {
  if (!input.hasAttribute("autocomplete")) {
    input.setAttribute("autocomplete", "off");
  }
});

// | ЧИСТКА ПОЛЕЙ
// Браузер восстанавливает введённые значения при перезагрузке, а менеджер
// паролей сам подставляет сохранённую пару почта+пароль. В компьютерном клубе
// это значит, что следующий игрок докручивает до модалки и видит чужие данные.
// Атрибуты autocomplete в разметке закрывают подстановку, а здесь снимаем то,
// что браузер успел восстановить сам.
// :not([readonly]) выводит из-под чистки поля, которые заполняет не игрок:
// страну (её ставит гео или выбор из списка) и промокод из ссылки — ему
// readOnly проставляет promocodeCheck. Без этого, если гео отвечало быстрее
// события load, имя страны стирало вторым проходом: флаг оставался на месте
// (это <img>), а строка рядом пустела. Браузеру там восстанавливать нечего,
// значение всегда ставит скрипт.
const RESTORABLE_FIELDS = [
  ".two-step-form input[type='text']:not([readonly])",
  ".two-step-form input[type='email']:not([readonly])",
  ".two-step-form input[type='password']:not([readonly])",
  ".two-step-form input[type='tel']:not([readonly])",
].join(", ");

// Без промокода в ссылке поле остаётся редактируемым, под чистку попадает
// и оно. На load код из ссылки уже подставлен (promocodeCheck отработал на
// импорте), поэтому второй проход его пропускает — иначе стёрли бы своё же.
const clearFormFields = (keepPromocode = false) => {
  document.querySelectorAll(RESTORABLE_FIELDS).forEach((input) => {
    if (keepPromocode && input.classList.contains("two-step-promocode-input")) {
      return;
    }

    input.value = "";
  });
};

clearFormFields();

// Восстановление может случиться и после разбора модулей, поэтому повторяем на
// load.
window.addEventListener("load", () => clearFormFields(true), { once: true });

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
  street: "",
  houseNumber: "",
  apartment: "",
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
    if (!regex.test(v)) return false;
    // 1) Zeruh: пока не подтвердил доставляемость — false (кнопка выключена).
    if (!emailDeliverableOk()) return false;
    // 2) Занятость (наш API): пока вердикта нет — false; ошибка → fail-open; занята → false.
    const st = getEmailStatus(currentEmail());
    if (!st || st.pending) return false;
    if (st.errored) return true;
    return st.available === true;
  };

  // Проверка занятости почты ещё идёт (формат ок + Zeruh ок, но вердикта занятости нет).
  const isEmailAvailPending = () => {
    const v = twoStepFormEmailInput.value.trim();
    if (!regex.test(v) || !emailDeliverableOk()) return false;
    const st = getEmailStatus(currentEmail());
    return !st || st.pending;
  };

  // Запустить проверку занятости почты — только если формат ок и Zeruh не против.
  const maybeCheckEmailAvailability = () => {
    const v = twoStepFormEmailInput.value.trim();
    if (!regex.test(v) || !emailDeliverableOk()) return;
    checkEmailAvailability(currentEmail()).then(() =>
      validateInputs("#4ED937", "#ff5530"),
    );
  };

  // Сообщение «этот e-mail нельзя использовать» — только при однозначном «занята».
  const emailAlertEl = document.querySelector(".two-step-email-alert");
  const updateEmailAlert = () => {
    if (!emailAlertEl) return;
    const v = twoStepFormEmailInput.value.trim();
    const st = getEmailStatus(currentEmail());
    const taken =
      regex.test(v) &&
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

  // Поля, из которых игрок уже уходил (blur). Пересчёт на вводе идёт с
  // нейтральным цветом и раньше красил им ВСЕ невалидные поля шага: печатаешь в
  // почте — уже покрасневший короткий пароль снова фиолетовый (и наоборот).
  // Теперь нейтральный цвет — только у поля, в котором сейчас печатают, и у
  // ещё не тронутых; тронутое невалидное поле остаётся красным.
  const touchedFields = new WeakSet();
  [twoStepFormEmailInput, twoStepFormPasswordInput].forEach((input) =>
    input?.addEventListener("focusout", () => touchedFields.add(input)),
  );
  const errorColorFor = (input, invalidColor) =>
    invalidColor === "#8726FF" &&
    touchedFields.has(input) &&
    input !== document.activeElement
      ? "#ff5530"
      : invalidColor;

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
      } else if (isValid) {
        input.style.color = validColor;
      } else {
        input.style.color = errorColorFor(input, invalidColor);
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

  // вердикт Zeruh прилетел асинхронно → убрать спиннер. Пересчёт делает
  // обработчик того же события выше, и делает его красным цветом ошибки.
  // Второго пересчёта тут быть не должно: он шёл нейтральным #8726FF и, как
  // более поздний слушатель, перекрашивал обратно уже покрасневшее поле —
  // некорректная почта после blur оставалась фиолетовой.
  twoStepFormEmailInput.addEventListener("emailguard:result", () => {
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
      regex.test(twoStepFormEmailInput.value.trim()) &&
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
    // flatpickr цеплялся к самому инпуту (средняя колонка грида) — всплывашка
    // со стрелкой уезжала от иконки. Якорим на всю строку поля.
    positionElement: twoStepBirthdayInput.closest(".two-step-birthday-wrapper"),
  });

  // В RTL иконка переезжает в левый край поля — вместе с ней и точка привязки.
  const syncCalendarPosition = () => {
    calendar.set(
      "position",
      document.documentElement.dir === "rtl" ? "auto left" : "auto right",
    );
  };
  syncCalendarPosition();
  window.addEventListener("lang:changed", syncCalendarPosition);

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

// | POSTAL CODE — режим поля индекса по стране.
// Текущий режим: "hidden" | "optional" | "required".
export let postalCodeMode = "required";

// Применяет режим поля Postal Code к DOM в зависимости от страны.
// Через querySelector — чтобы безопасно вызываться до const-объявлений элементов.
export const applyPostalCodeMode = (countryCode) => {
  postalCodeMode = getPostalCodeMode(countryCode);

  const wrapper = document.querySelector(".two-step-zipcode-wrapper");
  const input = document.querySelector(".two-step-zipcode-input");
  const label = document.querySelector(".two-step-zipcode-label");
  const info = document.querySelector(".two-step-zipcode-info");
  const tooltip = document.querySelector(".two-step-zipcode-tooltip");
  if (!wrapper || !input || !label) return;

  tooltip?.classList.remove("is-visible");
  info?.setAttribute("aria-expanded", "false");

  if (postalCodeMode === "hidden") {
    wrapper.classList.add("hidden");
    wrapper.classList.remove("has-info");
    info?.classList.add("hidden");
    label.classList.remove("two-step-required-label");
    input.value = "";
    twoStepFormData.zipCode = "";
  } else if (postalCodeMode === "optional") {
    wrapper.classList.remove("hidden");
    wrapper.classList.add("has-info");
    info?.classList.remove("hidden");
    label.classList.remove("two-step-required-label");
  } else {
    wrapper.classList.remove("hidden");
    wrapper.classList.remove("has-info");
    info?.classList.add("hidden");
    label.classList.add("two-step-required-label");
  }
};

// | РЕГИОН — вид поля зависит от страны (см. getRegionMode в data.js):
// список (AU, IT, IE), скрытое вычисление по индексу (ES), свободный ввод
// (US, CA и прочие вне ТЗ) или полное отсутствие поля.
export let regionMode = "none";

// Игрок выбрал регион руками — подстановка по индексу больше его не перебивает.
let regionChosenManually = false;

const renderRegionOptions = (countryCode) => {
  const list = document.querySelector(".two-step-region-list");
  if (!list) return;

  list.innerHTML = "";
  getRegionOptions(countryCode).forEach((name) => {
    const item = document.createElement("li");
    item.className =
      "two-step-state-list-item cursor-pointer text-base font-bold tracking-[-0.02em] text-[#1c1c1c]";
    item.textContent = name;
    list.appendChild(item);
  });
};

export const applyRegionField = (countryCode) => {
  regionMode = getRegionMode(countryCode);
  regionChosenManually = false;

  const textWrapper = document.querySelector(".two-step-state-wrapper");
  const textInput = document.querySelector(".two-step-state-input");
  const textLabel = document.querySelector(".two-step-state-label");
  const selectWrapper = document.querySelector(".two-step-region-wrapper");
  const selectInput = document.querySelector(".two-step-region-input");
  const dropdown = document.querySelector(".two-step-region-drowpdown");

  // Прежнее значение всегда сбрасываем: у новой страны свой список регионов, а
  // свободный ввод относился к предыдущей стране.
  twoStepFormData.state = "";
  if (textInput) textInput.value = "";
  if (selectInput) selectInput.value = "";
  textLabel?.classList.remove("active");
  dropdown?.classList.add("hidden");

  textWrapper?.classList.toggle("hidden", regionMode !== "text");
  selectWrapper?.classList.toggle("hidden", regionMode !== "select");

  if (regionMode === "select") renderRegionOptions(countryCode);
};

// Подстановка региона по индексу: AU — штат по диапазону, ES — провинция по
// первым двум цифрам (поля нет, значение только уходит на бэк), IT — провинция
// по справочнику CAP, IE — графство по routing key Eircode.
const applyRegionFromPostalCode = (postal) => {
  if (regionMode !== "select" && regionMode !== "auto") return;
  const region = getRegionByPostalCode(twoStepFormData.country, postal) || "";

  // Ручной выбор в селекте раньше блокировал подстановку насовсем: игрок
  // выбрал Clare, потом ввёл дублинский Eircode — County так и оставался Clare.
  // Теперь побеждает последнее действие: индекс, который даёт регион, его и
  // ставит (и снимает флаг ручного выбора). Индекс, который региона не даёт
  // (недописан / чужой формат), ручной выбор не трогает.
  if (regionChosenManually) {
    if (!region) return;
    regionChosenManually = false;
  }

  // Если новый индекс провинцию не даёт, подставленное по прежнему индексу
  // значение уже неверно — сбрасываем, а не оставляем чужой регион.

  twoStepFormData.state = region;
  if (regionMode === "select") {
    const input = document.querySelector(".two-step-region-input");
    if (input) input.value = region;
  }
};

// | НОМЕР ДОМА — в IE и IS дома бывают без номера, там поле необязательное.
export let houseNumberRequired = true;

export const applyHouseNumberMode = (countryCode) => {
  houseNumberRequired = isHouseNumberRequired(countryCode);
  document
    .querySelector(".two-step-house-label")
    ?.classList.toggle("two-step-required-label", houseNumberRequired);
};

// | КВАРТИРА — поле необязательное везде, а в DE его просто нет.
export const applyApartmentField = (countryCode) => {
  const wrapper = document.querySelector(".two-step-apartment-wrapper");
  const input = document.querySelector(".two-step-apartment-input");
  const label = document.querySelector(".two-step-apartment-label");
  if (!wrapper || !input) return;

  const isVisible = hasApartmentField(countryCode);
  wrapper.classList.toggle("hidden", !isVisible);

  if (!isVisible) {
    input.value = "";
    label?.classList.remove("active");
    twoStepFormData.apartment = "";
  }
};

// | ПОДПИСИ ПОЛЕЙ — в части стран поле называется иначе: в AU квартира это
// Unit, город — Suburb, регион — State / Territory. Подменяем и текст, и ключ
// data-translate, чтобы смена языка сайта подставила уже страновой вариант.
// Местный термин (DK «Etage / side») не переводится: data-translate снимаем,
// иначе смена языка затрёт подпись.
const FIELD_LABEL_SELECTORS = {
  apartment: [".two-step-apartment-label"],
  city: [".two-step-city-label"],
  state: [".two-step-state-label", ".two-step-region-label"],
};

export const applyFieldLabels = (countryCode) => {
  const lang =
    document.documentElement.getAttribute("lang") ||
    localStorage.getItem("preferredLanguage") ||
    "en";

  Object.entries(FIELD_LABEL_SELECTORS).forEach(([field, selectors]) => {
    const localLabel = getLocalFieldLabel(countryCode, field);
    const key = getFieldLabelKey(countryCode, field);
    selectors.forEach((selector) => {
      const label = document.querySelector(selector);
      if (!label) return;
      if (localLabel) {
        label.removeAttribute("data-translate");
        label.textContent = localLabel;
        return;
      }
      label.setAttribute("data-translate", key);
      label.innerHTML = translate(lang, key);
    });
  });
};

// Единая точка: всё, что зависит от страны, пересобирается одним вызовом.
export const applyCountryAddressRules = (countryCode) => {
  settingZipCodePlaceholder(countryCode);
  applyPostalCodeMode(countryCode);
  applyRegionField(countryCode);
  applyHouseNumberMode(countryCode);
  applyApartmentField(countryCode);
  applyFieldLabels(countryCode);
  applyAddressFieldOrder(countryCode);
};

// | ПОРЯДОК АДРЕСНЫХ ПОЛЕЙ — страна решает, в каком порядке игрок вводит адрес.
// Переставляем сами узлы внутри .two-step-address-fields, а не CSS order: Tab
// ходит по порядку DOM, и с order фокус прыгал между полями не так, как они
// стоят на экране. Порядок для страны даёт data.js.
// state — сразу два блока: свободный ввод и выпадающий список региона.
const ADDRESS_FIELD_SELECTORS = {
  street: ".two-step-street-wrapper",
  house: ".two-step-house-wrapper",
  apartment: ".two-step-apartment-wrapper",
  city: ".two-step-city-wrapper",
  state: ".two-step-state-wrapper, .two-step-region-wrapper",
  zip: ".two-step-zipcode-wrapper",
};

export const applyAddressFieldOrder = (countryCode) => {
  const container = document.querySelector(".two-step-address-fields");
  if (!container) return;

  // appendChild переносит узел в конец вместе с обработчиками: проходим поля по
  // порядку страны, и каждое встаёт за предыдущим.
  getAddressFieldOrder(countryCode).forEach((field) => {
    container
      .querySelectorAll(ADDRESS_FIELD_SELECTORS[field])
      .forEach((wrapper) => container.appendChild(wrapper));
  });
};

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

  // Клавиатура: список открывается, и фокус сразу уходит в поиск — можно
  // печатать название страны, стрелками выбрать, Enter применить.
  const countryKeyboard = enableKeyboardSelect({
    root: twoStepCountryWrapper,
    trigger: twoStepAppliedCountryInput,
    getItems: () => [
      ...twoStepCountryList.querySelectorAll(".two-step-country-list-item"),
    ],
    getSelected: (items) =>
      items.find(
        (item) => item.getAttribute("countryCode") === twoStepFormData.country,
      ),
    isOpen: () => !twoStepCountryDropdown.classList.contains("hidden"),
    open: () => twoStepCountryDropdown.classList.remove("hidden"),
    close: () => twoStepCountryDropdown.classList.add("hidden"),
    onOpen: () => twoStepCountrySearchInput.focus({ preventScroll: true }),
  });

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
      applyCountryAddressRules(countryCode);
      validateInputs1("#4ED937", "#8726FF");
    }
  });

  // Apply detected country
  const applyDetectedCountry = async () => {
    const locationData = geoData;
    applyCountryAddressRules(locationData.countryCode);

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

  // последний поисковый запрос: нужен, чтобы перерисовать список после смены
  // языка — заглушка «страна не найдена» переводится вместе со страницей
  let countryFilter = "";

  const renderCountries = (filter = "") => {
    countryFilter = filter;
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
      noResult.className = "two-step-country-empty";
      const lang = document.documentElement.getAttribute("lang") || "en";
      noResult.textContent = translate(lang, "countryNotFound");
      twoStepCountryList.appendChild(noResult);
    }
  };
  // список рисуется из JS, updateContent() его не трогает — перерисовываем сами
  window.addEventListener("lang:changed", () => renderCountries(countryFilter));


  // Event listener for the search input
  twoStepCountrySearchInput.addEventListener("input", (e) => {
    renderCountries(e.target.value);
    // Список перерисован: подсветка встаёт на первую найденную страну, и Enter
    // сразу её выбирает.
    countryKeyboard.highlightFirst();
  });

  // Initial render
  renderCountries();

  // ? REGION DROPDOWN — список регионов для AU, IT и IE. Поиска нет: списки
  // короткие, а самый длинный (107 итальянских провинций) листается.
  const twoStepRegionWrapper = twoStepFormFourthStep.querySelector(
    ".two-step-region-wrapper",
  );
  const twoStepRegionButton = twoStepFormFourthStep.querySelector(
    ".two-step-region-button",
  );
  const twoStepRegionDropdown = twoStepFormFourthStep.querySelector(
    ".two-step-region-drowpdown",
  );
  const twoStepRegionList = twoStepFormFourthStep.querySelector(
    ".two-step-region-list",
  );

  if (twoStepRegionButton && twoStepRegionDropdown && twoStepRegionList) {
    // Регион часто стоит внизу формы (AU, IE). Открытый вниз список вылезал за
    // видимую часть оверлея: появлялся лишний скролл, а низ списка обрезался.
    // Поэтому при открытии меряем место под полем и над ним и выбираем сторону,
    // а высоту списка ужимаем под доступное место.
    const REGION_LIST_MAX_HEIGHT = 236;
    const REGION_LIST_MIN_HEIGHT = 150;
    const REGION_DROPDOWN_EDGE_GAP = 12;
    // top-[120%] у выпадающего блока: отступ от поля — 20% его высоты.
    const REGION_DROPDOWN_OFFSET = 0.2;

    const positionRegionDropdown = () => {
      const overlay = twoStepRegionWrapper.closest(".two-step-overlay");
      const bounds = overlay?.getBoundingClientRect();
      const visibleTop = Math.max(bounds?.top ?? 0, 0);
      const visibleBottom = Math.min(
        bounds?.bottom ?? window.innerHeight,
        window.innerHeight,
      );

      const field = twoStepRegionWrapper.getBoundingClientRect();
      const offset = field.height * REGION_DROPDOWN_OFFSET;
      const spaceBelow =
        visibleBottom - field.bottom - offset - REGION_DROPDOWN_EDGE_GAP;
      const spaceAbove =
        field.top - visibleTop - offset - REGION_DROPDOWN_EDGE_GAP;

      twoStepRegionList.style.maxHeight = "";
      const padding =
        twoStepRegionDropdown.offsetHeight - twoStepRegionList.offsetHeight;
      const needed =
        Math.min(twoStepRegionList.scrollHeight, REGION_LIST_MAX_HEIGHT) +
        padding;

      const openUp = spaceBelow < needed && spaceAbove > spaceBelow;
      const space = openUp ? spaceAbove : spaceBelow;

      twoStepRegionDropdown.style.top = openUp ? "auto" : "";
      twoStepRegionDropdown.style.bottom = openUp ? "120%" : "";
      twoStepRegionList.style.maxHeight = `${Math.max(
        Math.min(REGION_LIST_MAX_HEIGHT, space - padding),
        REGION_LIST_MIN_HEIGHT,
      )}px`;
    };

    const isRegionDropdownOpen = () =>
      !twoStepRegionDropdown.classList.contains("hidden");

    twoStepRegionButton.addEventListener("click", () => {
      twoStepRegionDropdown.classList.toggle("hidden");
      if (isRegionDropdownOpen()) positionRegionDropdown();
    });

    window.addEventListener("resize", () => {
      if (isRegionDropdownOpen()) positionRegionDropdown();
    });

    document.addEventListener("click", (event) => {
      if (!twoStepRegionWrapper.contains(event.target)) {
        twoStepRegionDropdown.classList.add("hidden");
      }
    });

    twoStepRegionList.addEventListener("click", (event) => {
      const item = event.target.closest(".two-step-state-list-item");
      if (!item) return;

      const name = item.textContent;
      twoStepRegionInput.value = name;
      twoStepFormData.state = name;
      // Дальше подстановка по индексу не трогает выбор игрока.
      regionChosenManually = true;
      twoStepRegionDropdown.classList.add("hidden");
      validateInputs1("#4ED937", "#8726FF");
    });

    enableKeyboardSelect({
      root: twoStepRegionWrapper,
      trigger: twoStepRegionWrapper.querySelector(".two-step-region-input"),
      getItems: () => [
        ...twoStepRegionList.querySelectorAll(".two-step-state-list-item"),
      ],
      getSelected: (items) =>
        items.find((item) => item.textContent === twoStepFormData.state),
      isOpen: isRegionDropdownOpen,
      open: () => {
        twoStepRegionDropdown.classList.remove("hidden");
        positionRegionDropdown();
      },
      close: () => twoStepRegionDropdown.classList.add("hidden"),
    });
  }

  // ? VALIDATION
  const submitBtn = twoStepFormFourthStep.querySelector(".submit-btn");
  const btnOverlap = twoStepFormFourthStep.querySelector(".disable-overlap");
  const twoStepPhoneInput = twoStepFormFourthStep.querySelector(
    ".two-step-phone-input",
  );
  const twoStepCityInput = twoStepFormFourthStep.querySelector(
    ".two-step-city-input",
  );
  const twoStepStreetInput = twoStepFormFourthStep.querySelector(
    ".two-step-street-input",
  );
  const twoStepHouseInput = twoStepFormFourthStep.querySelector(
    ".two-step-house-input",
  );
  const twoStepApartmentInput = twoStepFormFourthStep.querySelector(
    ".two-step-apartment-input",
  );
  const twoStepZipcodeInput = twoStepFormFourthStep.querySelector(
    ".two-step-zipcode-input",
  );
  const twoStepStateInput = twoStepFormFourthStep.querySelector(
    ".two-step-state-input",
  );
  const twoStepRegionInput = twoStepFormFourthStep.querySelector(
    ".two-step-region-input",
  );

  // Авто-форматирование индекса по стране (разделители, верхний регистр).
  twoStepZipcodeInput.addEventListener("input", () => {
    const formatted = formatPostalCode(
      twoStepFormData.country,
      twoStepZipcodeInput.value,
    );
    if (formatted !== twoStepZipcodeInput.value) {
      twoStepZipcodeInput.value = formatted;
      twoStepZipcodeInput.setSelectionRange(formatted.length, formatted.length);
    }

    applyRegionFromPostalCode(twoStepZipcodeInput.value);
  });

  // State/Province — обычный необязательный текстовый инпут.
  twoStepStateInput.addEventListener("input", () => {
    twoStepFormData.state = validateStringInput(twoStepStateInput.value);
  });

  // Apartment / Suite — тоже необязательный и в inputValidations1 не входит, а
  // в twoStepFormData он попадал только из validateInputs1, которую дёргают
  // события ОБЯЗАТЕЛЬНЫХ полей. Стёр квартиру последним действием перед
  // сабмитом — пересчёта не было, и в /register уходило старое значение.
  // Пишем на каждый ввод, как у State.
  twoStepApartmentInput.addEventListener("input", () => {
    twoStepFormData.apartment = validateStringInput(twoStepApartmentInput.value);
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

  // Индекс считаем дописанным, когда его длина не меньше примера для страны —
  // до этого не красим ошибку, чтобы не краснеть на каждом введённом символе.
  const isZipcodeComplete = (value) => {
    const spec = getPostalCodeFormat(twoStepFormData.country);
    return value.length >= (spec?.example ? spec.example.length : 2);
  };

  const inputValidations1 = [
    {
      input: twoStepPhoneInput,
      condition: () => isPhoneFieldValid(),
    },
    { input: twoStepCityInput, condition: (value) => value !== "" },
    { input: twoStepStreetInput, condition: (value) => value !== "" },
    {
      // В IE и IS номер дома необязателен — там дома бывают без номера.
      input: twoStepHouseInput,
      condition: (value) => !houseNumberRequired || value !== "",
    },
    {
      // Регион из списка (AU, IT, IE) обязателен: без него адрес неполный и
      // его не примут PSP и KYC. В остальных режимах поля либо нет, либо оно
      // необязательное — сабмит не блокируем.
      input: twoStepRegionInput,
      condition: (value) => regionMode !== "select" || value !== "",
      // Это селект, а не текстовое поле: выбранное значение держит свой цвет
      // из разметки (#755EEB — как у выбранных страны и валюты), зелёным/
      // красным от валидации его не красим. Валидность по-прежнему считаем.
      keepColor: true,
    },
    {
      // REQUIRED — индекс обязателен и должен совпадать с форматом страны;
      // OPTIONAL — можно оставить пустым, но заполненный проверяем по формату;
      // HIDDEN — поля нет, сабмит не блокируем.
      input: twoStepZipcodeInput,
      condition: (value) =>
        postalCodeMode === "hidden" ||
        (postalCodeMode === "optional" && value === "") ||
        validatePostalCodeFormat(twoStepFormData.country, value),
      // Ошибку подсвечиваем красным сразу при вводе, а не только по focusout.
      liveInvalid: (value) => value !== "" && isZipcodeComplete(value),
    },
  ];

  // Как на шаге 2: тронутое (blur) невалидное поле не гаснет в фиолетовый,
  // пока игрок печатает в соседнем.
  const touchedAddressFields = new WeakSet();
  inputValidations1.forEach(({ input }) =>
    input.addEventListener("focusout", () => touchedAddressFields.add(input)),
  );

  const validateInputs1 = (validColor, invalidColor) => {
    let validCount = 0;
    const totalInputs = inputValidations1.length;

    let twoStepCode = twoStepiti.getSelectedCountryData().dialCode;
    let twoStepPhoneNumber = twoStepPhoneInput.value.trim();

    let sanitizedPhoneNumber = twoStepPhoneNumber.replace(/\D/g, "");
    let fullPhoneNumber = `${twoStepCode}${sanitizedPhoneNumber}`;

    // Validate each input
    inputValidations1.forEach(({ input, condition, liveInvalid, keepColor }) => {
      const value = input.value.trim();
      const isValid = condition(value); // Check validity
      if (keepColor) {
        input.style.color = ""; // цвет из класса разметки
        if (isValid) validCount++;
        return;
      }
      // Во время проверки (занятость или IPQS) — нейтральный цвет, не красный.
      if (
        input === twoStepPhoneInput &&
        (isPhonePending() || isPhoneChecking())
      ) {
        input.style.color = "#8726FF";
      } else {
        // liveInvalid — поля, где ошибка красная даже во время ввода.
        const keepError =
          invalidColor === "#8726FF" &&
          touchedAddressFields.has(input) &&
          input !== document.activeElement;
        const errorColor =
          !isValid && (liveInvalid?.(value) || keepError)
            ? "#ff5530"
            : invalidColor;
        input.style.color = isValid ? validColor : errorColor; // Apply text color
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
      twoStepFormData.street = validateStringInput(twoStepStreetInput.value);
      twoStepFormData.houseNumber = validateStringInput(twoStepHouseInput.value);
      twoStepFormData.apartment = validateStringInput(
        twoStepApartmentInput.value,
      );
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

  inputValidations1.forEach(({ input, liveInvalid, keepColor }) => {
    input.addEventListener("input", () => {
      validateInputs1("#4ED937", "#8726FF");
      // Поля с liveInvalid оставляем с цветом от валидации — не гасим красный.
      if (!liveInvalid && !keepColor) input.style.color = "#8726FF";
    });
  });

  // Тултип-hint индекса: тап на мобилке (на десктопе — hover через CSS).
  const zipcodeInfoBtn = twoStepFormFourthStep.querySelector(
    ".two-step-zipcode-info",
  );
  const zipcodeTooltip = twoStepFormFourthStep.querySelector(
    ".two-step-zipcode-tooltip",
  );
  if (zipcodeInfoBtn && zipcodeTooltip) {
    zipcodeInfoBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = zipcodeTooltip.classList.toggle("is-visible");
      zipcodeInfoBtn.setAttribute("aria-expanded", String(isOpen));
    });
    document.addEventListener("click", (e) => {
      if (!zipcodeInfoBtn.contains(e.target)) {
        zipcodeTooltip.classList.remove("is-visible");
        zipcodeInfoBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

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

// Курсор ставим в первое НЕзаполненное поле открытого шага, иначе игрок
// сначала целится в инпут и только потом печатает.
// Что пропускаем:
//   readonly — так помечены поля-селекты (страна), у них своё выпадающее меню,
//   фокус уходит на следующее текстовое;
//   radio/checkbox — выбор бонуса и пола, печатать там нечего;
//   .iti__search-input — поиск стран у телефона, в DOM он идёт раньше самого
//   телефона, но полем формы не является;
//   .two-step-promocode-input — промокод на первом шаге пустой чаще всего
//   (его вводят вручную), и одной проверки на пустоту мало: фокус вставал бы
//   в него, хотя шаг про выбор бонуса;
//   невидимые (offsetParent === null) — скрытый промокод, «State» для стран
//   без штатов, свёрнутые выпадающие списки;
//   заполненные — по «Назад» и повторным переходам фокус вставал в уже
//   введённые данные и без нужды поднимал клавиатуру. Телефон читается как
//   пустой корректно: при separateDialCode код страны живёт вне value.
// Все поля шага заполнены — не фокусируем ничего.
const focusFirstFieldIn = (stepEl) => {
  const field = [
    ...(stepEl?.querySelectorAll(
      "input:not([type='hidden']):not([type='radio']):not([type='checkbox']):not([disabled]):not([readonly]):not(.iti__search-input):not(.two-step-promocode-input)",
    ) || []),
  ].find((el) => el.offsetParent !== null && el.value.trim() === "");

  // без rAF намеренно: showStep зовётся из обработчика клика, а на iOS Safari
  // клавиатура поднимается только внутри пользовательского жеста
  field?.focus({ preventScroll: true });
};

const focusFirstField = (step) =>
  focusFirstFieldIn(document.querySelector(`.two-step-form-step-${step}`));

// Для открытия модалки: шаг не обязательно первый — игрок мог закрыть форму
// на третьем и вернуться, is-active к этому моменту уже проставлен.
export const focusActiveStep = () =>
  focusFirstFieldIn(document.querySelector(".two-step-form-step.is-active"));

// focus: false — для «Назад»: игрок возвращается на уже пройденный шаг, поля
// там заполнены, и автофокус на мобилке зря поднимал клавиатуру
const showStep = (step, { focus = true } = {}) => {
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

  if (focus) focusFirstField(step);
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
    showStep(initialStep, { focus: false });
  });
}

// | SUBMITTING FORM //
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
    street,
    houseNumber,
    apartment,
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

  window.location.href = `https://${newDomain}/api/register?env=prod&type=email&currency=${currency}&email=${encodeURIComponent(email)}&password=${password}&phone=${phone}&bonus=${bonus}${promocode ? "&promocode=" + promocode : ""}&lang=${lang}${firstName ? "&f_name=" + encodeURIComponent(firstName) : ""}${lastName ? "&l_name=" + encodeURIComponent(lastName) : ""}${birthday ? "&birth=" + birthday : ""}${gender ? "&gender=" + gender : ""}${country ? "&country=" + country : ""}${state ? "&state=" + encodeURIComponent(state) : ""}${city ? "&city=" + encodeURIComponent(city) : ""}${zipCode ? "&postal=" + encodeURIComponent(zipCode) : ""}${street ? "&street=" + encodeURIComponent(street) : ""}${houseNumber ? "&house_number=" + encodeURIComponent(houseNumber) : ""}${apartment ? "&apartment=" + encodeURIComponent(apartment) : ""}${cid ? "&cid=" + cid : ""}${partner ? "&partner=" + partner : ""}${offer ? "&offer=" + offer : ""}`;
  console.log(
    `https://${newDomain}/api/register?env=prod&type=email&currency=${currency}&email=${encodeURIComponent(email)}&password=${password}&phone=${phone}&bonus=${bonus}${promocode ? "&promocode=" + promocode : ""}&lang=${lang}${firstName ? "&f_name=" + encodeURIComponent(firstName) : ""}${lastName ? "&l_name=" + encodeURIComponent(lastName) : ""}${birthday ? "&birth=" + birthday : ""}${gender ? "&gender=" + gender : ""}${country ? "&country=" + country : ""}${state ? "&state=" + encodeURIComponent(state) : ""}${city ? "&city=" + encodeURIComponent(city) : ""}${zipCode ? "&postal=" + encodeURIComponent(zipCode) : ""}${street ? "&street=" + encodeURIComponent(street) : ""}${houseNumber ? "&house_number=" + encodeURIComponent(houseNumber) : ""}${apartment ? "&apartment=" + encodeURIComponent(apartment) : ""}${cid ? "&cid=" + cid : ""}${partner ? "&partner=" + partner : ""}${offer ? "&offer=" + offer : ""}`,
  );
});
