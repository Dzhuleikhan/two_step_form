import { twoStepFormData } from "./twoStepForm";

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
  window.location.href = `https://${newDomain}/api/register?env=prod&type=google&currency=${twoStepFormData.currency}${twoStepFormData.promocode ? "&promocode=" + twoStepFormData.promocode : ""}&lang=${twoStepFormData.lang}${cid ? "&cid=" + cid : ""}${partner ? "&partner=" + partner : ""}${offer ? "&offer=" + offer : ""}`;
}
