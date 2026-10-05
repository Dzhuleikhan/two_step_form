import { newDomain } from "./fetchingDomain";
import { getUrlParameter, getTestUserParams } from "./params";
import { goToRegister, addRegTestAction } from "./regTest";
import { twoStepFormData } from "./twoStepForm";

const cid = getUrlParameter("cid");
const partner = getUrlParameter("partner");
const offer = getUrlParameter("offer");

// One-tap google auth
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
  goToRegister(`https://${newDomain}/api/register?env=prod&type=google&currency=${twoStepFormData.currency}${twoStepFormData.promocode ? "&promocode=" + twoStepFormData.promocode : ""}&lang=${twoStepFormData.lang}${cid ? "&cid=" + cid : ""}${partner ? "&partner=" + partner : ""}${offer ? "&offer=" + offer : ""}${getTestUserParams()}`);
}

addRegTestAction("Google", handleCredentialResponse);
