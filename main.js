// flatpickr выше style.css намеренно: наши правила стрелки календаря
// (.flatpickr-calendar.arrowRight:before) той же специфичности, что и вендорные,
// и при прежнем порядке в бандле выигрывал flatpickr со своим right: 22px.
import "flatpickr/dist/flatpickr.min.css";
import "./style.css";
import "intl-tel-input/build/css/intlTelInput.css";

// первым: снимает прелоадер независимо от того, что случится дальше
import "./modules/preloader";

import "./modules/geoLocation";
import "./modules/modalCurrency";
import "./modules/itiTelInput";
import "./modules/twoStepForm";
import "./modules/fetchingDomain";
import "./modules/params";
import "./modules/language";
import "./modules/promocodeCheck";
import "./modules/fb_pixel";
import "./modules/sidebar";
import "./modules/gameHeader";
import "./modules/sidebarLanguage";
import "./modules/gameFetch.js";
import "./modules/navModal.js";
