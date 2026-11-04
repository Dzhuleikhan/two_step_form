// Раньше грузился с jsdelivr и блокировал отрисовку; до style.css, чтобы наши переопределения оставались в силе
import "flatpickr/dist/flatpickr.min.css";
import "./style.css";
import "intl-tel-input/build/css/intlTelInput.css";

import "./modules/geoLocation";
import "./modules/geoRestrict";
import "./modules/modalCurrency";
import "./modules/itiTelInput";
import "./modules/twoStepForm";
import "./modules/fetchingDomain";
import "./modules/params";
import "./modules/language";
import "./modules/promocodeCheck";
import "./modules/fb_pixel";
import "./modules/google-auth";
