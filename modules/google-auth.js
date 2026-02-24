import { newDomain } from "./fetchingDomain";
import { getUrlParameter } from "./params";

// One-tap google auth
let currencyStoredData = localStorage.getItem("currencyData");
let currencyData = JSON.parse(currencyStoredData);
let currency = currencyData.abbr;
const promocode = getUrlParameter("promocode");
const lang = localStorage.getItem("preferredLanguage");
const cid = getUrlParameter("cid");
const partner = getUrlParameter("partner");
const offer = getUrlParameter("offer");

window.onload = function () {
  google.accounts.id.initialize({
    client_id:
      "757023558262-l0ffftmca719f5a4ksq4r5l2rugankkn.apps.googleusercontent.com",
    callback: handleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true,
  });
  google.accounts.id.prompt();
};

function handleCredentialResponse() {
  window.location.href = `https://${newDomain}/api/register?env=prod&type=google&currency=${currency}${promocode ? "&promocode=" + promocode : ""}&lang=${lang}${cid ? "&cid=" + cid : ""}${partner ? "&partner=" + partner : ""}${offer ? "&offer=" + offer : ""}`;
}
