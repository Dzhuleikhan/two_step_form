import { geoData } from "./geoLocation";
import { countryCurrencyData, nodepBonuses } from "../public/data";
import {
  twoStepFormData,
  settingInitialBonusValue,
  checkTir1CurrencyMatch,
} from "./twoStepForm";

export function getCountryCurrencyABBR(inputCountry) {
  for (const data of countryCurrencyData) {
    if (data.countries.includes(inputCountry)) {
      return data.countryCurrency;
    }
  }
  return "USD"; // or some default value if country is not found
}

function getCountryCurrencyFullName(inputCountry) {
  for (const data of countryCurrencyData) {
    if (data.countries.includes(inputCountry)) {
      return data.countryCurrencyFullName;
    }
  }
  return "US Dollar"; // or some default value if country is not found
}

function getCountryCurrencyIcon(inputCountry) {
  for (const data of countryCurrencyData) {
    if (data.countries.includes(inputCountry)) {
      return data.countryCurrencyIcon;
    }
  }
  return "./img/currencies/usd.svg"; // or some default value if country is not found
}

function getCountryCurrencySymbol(inputCountry) {
  for (const data of countryCurrencyData) {
    if (data.countries.includes(inputCountry)) {
      return data.countryCurrencySymbol;
    }
  }
  return "$"; // or some default value if country is not found
}

function setCurrency(abbr, name, icon) {
  const formCurrency = document.querySelectorAll(".form-currency");
  formCurrency.forEach((cur) => {
    let input = cur.querySelector("input");
    let currencyName = cur.querySelector(".main-currency-name");
    let currencyIcon = cur.querySelector(".main-currency-icon");
    input.value = abbr;
    currencyName.textContent = name;
    currencyIcon.src = icon;

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
    let locationData = geoData;

    if (locationData.currency.code === "CHE") {
      locationData.currency.code = "CHF";
    }

    const currencyCode =
      nodepBonuses.find(
        (item) => item.currency === locationData.currency.code,
      ) || nodepBonuses.find((item) => item.currency === "EUR");

    const currencyData = {
      abbr: currencyCode.currency,
      name: currencyCode.currencyName,
      icon: currencyCode.countryCurrencyIcon,
      symbol: currencyCode.symbol,
    };

    // Save to local storage
    localStorage.setItem("currencyData", JSON.stringify(currencyData));

    setCurrency(currencyData.abbr, currencyData.name, currencyData.icon);

    twoStepFormData.currency = currencyData.abbr;
    settingInitialBonusValue(twoStepFormData.currency);
    twoStepFormData.bonus = checkTir1CurrencyMatch(twoStepFormData.currency);
    setTimeout(() => {
      settingInitialBonusValue(currencyData.abbr);
    }, 300);
  } catch (error) {
    console.error("Error fetching location data:", error);
  }
}
settingModalCurrency();

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
        currencyListItems.forEach((el) => {
          el.classList.remove("active");
        });
        item.classList.add("active");
        hideDropdown();

        // Taking currency value from item
        let curIcon = item.querySelector(".currency-item-icon").src;
        let curName = item.querySelector(".currency-item-name").textContent;
        let curAbbr = item.querySelector(".currency-item-abbr").textContent;

        // Update all currency inputs on the page
        setCurrency(curAbbr, curName, curIcon);

        // Update local storage
        const currencyData = {
          abbr: curAbbr,
          name: curName,
          icon: curIcon,
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
