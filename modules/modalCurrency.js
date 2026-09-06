import { geoData, geoConfirmed, isGeoFallback } from "./geoLocation";
import { countryCurrencyData } from "../public/data";
import {
  getCountryCurrencyABBR,
  getCountryCurrencyFullName,
  getCountryCurrencyIcon,
  getCountryCurrencySymbol,
  getCurrencyCountry,
} from "./currency";
import {
  checkTir1CurrencyMatch,
  twoStepFormData,
  settingInitialBonusValue,
} from "./twoStepForm";

// маппинг живёт в currency.js — реэкспорт, чтобы не править импорты по модулям
export {
  getCountryCurrencyABBR,
  getCountryCurrencyIcon,
  getCurrencyCountry,
} from "./currency";

function setCurrency(abbr, name, icon) {
  const formCurrency = document.querySelectorAll(".form-currency");
  formCurrency.forEach((cur) => {
    let input = cur.querySelector("input");
    let currencyName = cur.querySelector(".main-currency-name");
    let currencyIcon = cur.querySelector(".main-currency-icon");
    input.value = abbr;
    currencyName.textContent = name;
    currencyIcon.src = icon;
    currencyIcon.alt = abbr;

    const currencyListItem = cur.querySelectorAll(
      ".form-currency-dropdown ul li",
    );

    currencyListItem.forEach((item) => {
      const itemAbbr = item.querySelector(".currency-item-abbr").textContent;
      if (itemAbbr.includes(abbr)) {
        item.classList.add("active");
      }
    });
  });
}

async function settingModalCurrency() {
  try {
    // гео не определилось — дефолт в geoData польский, но навязывать игроку
    // злотый нельзя: берём нейтральный доллар
    const detectedCountry = isGeoFallback ? "US" : geoData.countryCode;
    const countryInput = getCurrencyCountry(detectedCountry);

    const currencyAbbr = getCountryCurrencyABBR(countryInput);
    const currencyFullName = getCountryCurrencyFullName(countryInput);
    const currencyIcon = getCountryCurrencyIcon(countryInput);
    const currencySymbol = getCountryCurrencySymbol(countryInput);

    const currencyData = {
      abbr: currencyAbbr,
      name: currencyFullName,
      icon: currencyIcon,
      symbol: currencySymbol,
    };

    // Save to local storage
    localStorage.setItem("currencyData", JSON.stringify(currencyData));

    setCurrency(currencyAbbr, currencyFullName, currencyIcon);

    twoStepFormData.currency = currencyData.abbr;
    twoStepFormData.bonus = checkTir1CurrencyMatch(twoStepFormData.currency);
    setTimeout(() => {
      settingInitialBonusValue(twoStepFormData.currency);
    }, 300);
  } catch (error) {
    console.error("Error fetching location data:", error);
  }
}

// Валюту игрок мог выбрать сам — тогда поздний ответ гео её не трогает.
let isCurrencyPickedByUser = false;

// По geoConfirmed, а не по geoReady: пока страна не подтверждена, в форме
// лучше пусто, чем дефолтный злотый. Форма всё равно открывается позже.
geoConfirmed.then(() => {
  if (isCurrencyPickedByUser) return;
  settingModalCurrency();
});

/**
 *  Currency dropdownxw
 */
export const settingBonusOnCurrencyChange = (
  currencyDataArray,
  targetCurrency,
) => {
  const matchedObject = currencyDataArray.find(
    (item) => item.countryCurrency === targetCurrency.abbr,
  );
  const amount = matchedObject ? matchedObject.amount : null;
  const symbol = matchedObject ? matchedObject.countryCurrencySymbol : null;
  const spins = matchedObject ? matchedObject.spins : null;

  document.querySelectorAll(".bonus-value").forEach((el) => {
    el.innerHTML = amount;
  });
  document.querySelectorAll(".bonus-currency").forEach((el) => {
    el.innerHTML = symbol;
  });
  document.querySelectorAll(".bonus-spins").forEach((el) => {
    el.innerHTML = spins;
  });
};

const formCurrency = document.querySelectorAll(".form-currency");

formCurrency.forEach((cur) => {
  if (cur) {
    const currencyDropdownBtn = cur.querySelector(".form-currency-btn");
    const currencyDropdownList = cur.querySelector(".form-currency-dropdown");

    function hideDropdown() {
      currencyDropdownBtn.classList.remove("active");
      currencyDropdownList.classList.remove("active");
    }

    currencyDropdownBtn.addEventListener("click", () => {
      currencyDropdownBtn.classList.toggle("active");
      currencyDropdownList.classList.toggle("active");
    });

    const currencyListItems = currencyDropdownList.querySelectorAll("li");

    currencyListItems.forEach((item) => {
      item.addEventListener("click", () => {
        isCurrencyPickedByUser = true;

        currencyListItems.forEach((el) => {
          el.classList.remove("active");
        });
        item.classList.add("active");
        hideDropdown();

        // Taking currency value from item
        let curIcon = item.querySelector(".currency-item-icon").src;
        let curName = item.querySelector(".currency-item-name").textContent;
        let curAbbr = item
          .querySelector(".currency-item-abbr")
          .textContent.toUpperCase();
        let curAlt = item.querySelector(".currency-item-icon").alt;

        // Update all currency inputs on the page
        setCurrency(curAbbr, curName, curIcon);

        // Update local storage
        const currencyData = {
          abbr: curAbbr,
          name: curName,
          icon: curIcon,
          alt: curAlt,
        };
        localStorage.setItem("currencyData", JSON.stringify(currencyData));

        const currencyEntry = countryCurrencyData.find(
          (entry) => entry.countryCurrency === currencyData.abbr,
        );

        if (currencyEntry) {
          document
            .querySelectorAll(".bonus-highroller-amount")
            .forEach((el) => {
              el.innerHTML = currencyEntry.highrollerAmount;
            });
          document.querySelectorAll(".bonus-currency-symbol").forEach((el) => {
            el.innerHTML = currencyEntry.countryCurrencySymbol;
          });
        } else {
          document
            .querySelectorAll(".bonus-highroller-amount")
            .forEach((el) => {
              el.innerHTML = "200";
            });
          document.querySelectorAll(".bonus-currency-symbol").forEach((el) => {
            el.innerHTML = "€";
          });
        }

        // Two step currency update
        settingBonusOnCurrencyChange(countryCurrencyData, currencyData);
        twoStepFormData.currency = currencyData.abbr;
        settingInitialBonusValue(twoStepFormData.currency);

        twoStepFormData.bonus = checkTir1CurrencyMatch(
          twoStepFormData.currency,
          twoStepFormData.bonus,
        );
      });
    });

    document.addEventListener("click", (event) => {
      if (!cur.contains(event.target)) {
        hideDropdown();
      }
    });
  }
});
