import { getUrlParameter } from "./params";

// Режим проверки регистрации: открыть ленд с ?regTest=yes.
// Вместо перехода на /api/register показываем панель с URL и параметрами,
// которые ушли бы в реальную регистрацию. Сама регистрация не выполняется.
const isRegTest = getUrlParameter("regTest") === "yes";

const extraActions = [];

// Единая точка перехода на регистрацию
export function goToRegister(url) {
  if (isRegTest) {
    showRegTestPanel(url);
    return;
  }
  window.location.href = url;
}

// Дополнительная кнопка в тестовом режиме (например, регистрация через Google)
export function addRegTestAction(label, handler) {
  extraActions.push({ label, handler });
  if (isRegTest) renderButtons();
}

const STYLES = `
.rt-bar{position:fixed;left:12px;bottom:12px;z-index:2147483646;display:flex;flex-direction:column;gap:6px;font:600 13px/1.2 system-ui,sans-serif}
.rt-btn{cursor:pointer;border:0;border-radius:10px;padding:10px 14px;background:#e11d48;color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.35);font:inherit}
.rt-btn:hover{background:#be123c}
.rt-btn--ghost{background:#334155}
.rt-btn--ghost:hover{background:#1e293b}
.rt-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px}
.rt-panel{background:#0f172a;color:#e2e8f0;width:min(760px,100%);max-height:90vh;overflow:auto;border-radius:14px;padding:18px;font:13px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;box-shadow:0 10px 40px rgba(0,0,0,.5)}
.rt-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;font:700 15px system-ui,sans-serif}
.rt-url{word-break:break-all;background:#1e293b;padding:10px;border-radius:8px;margin-bottom:12px}
.rt-table{width:100%;border-collapse:collapse}
.rt-table td{border-top:1px solid #1e293b;padding:6px 8px;vertical-align:top;word-break:break-all}
.rt-table td:first-child{color:#94a3b8;white-space:nowrap;width:1%}
.rt-empty{color:#64748b;font-style:italic}
.rt-actions{display:flex;gap:8px}
`;

function injectStyles() {
  if (document.getElementById("rt-styles")) return;
  const style = document.createElement("style");
  style.id = "rt-styles";
  style.textContent = STYLES;
  document.head.appendChild(style);
}

function createButton(label, onClick, modifier = "") {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `rt-btn ${modifier}`.trim();
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

// Формы регистрации, которые встречаются на лендах, и сброс их кнопки
// (submit включает лоадер и блокирует кнопку — после закрытия панели возвращаем)
const REG_FORMS = [
  {
    selector: ".two-step-form",
    reset: (form) => {
      const btn = form.querySelector(".submit-btn");
      if (!btn) return;
      btn.disabled = false;
      btn.querySelector(".two-step-submit-btn-icon")?.classList.remove("hidden");
      btn.querySelector(".two-step-submit-btn-text")?.classList.remove("hidden");
      btn.querySelector(".two-step-submit-btn-loader")?.classList.add("hidden");
    },
  },
  {
    selector: ".socials-form",
    reset: (form) => {
      form.classList.remove("loading");
      const btn = form.querySelector(".main-form-submit-btn");
      if (btn) btn.disabled = false;
    },
  },
  {
    selector: ".email-form",
    reset: () => {
      document.querySelector(".form-submit-btn-spinner")?.classList.add("hidden");
      document.querySelector(".form-submit-btn-text")?.classList.remove("hidden");
      const btn = document.querySelector(".form-submit-btn");
      if (btn) btn.disabled = false;
    },
  },
];

const findRegForm = () =>
  REG_FORMS.map((config) => ({
    ...config,
    form: document.querySelector(config.selector),
  })).find(({ form }) => form);

// Запускаем тот же submit, что и при реальной регистрации:
// URL собирает рабочий код формы, goToRegister перехватывает его и показывает панель
function runFormTest() {
  findRegForm()?.form.dispatchEvent(new Event("submit", { cancelable: true }));
}

function renderButtons() {
  injectStyles();
  let bar = document.querySelector(".rt-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.className = "rt-bar";
    document.body.appendChild(bar);
  }
  bar.replaceChildren(
    ...(findRegForm() ? [createButton("Rega test", runFormTest)] : []),
    ...extraActions.map(({ label, handler }) =>
      createButton(`Rega test (${label})`, handler),
    ),
  );
}

function resetSubmitButton() {
  const regForm = findRegForm();
  regForm?.reset(regForm.form);
}

function showRegTestPanel(url) {
  injectStyles();
  document.querySelector(".rt-overlay")?.remove();

  const parsed = new URL(url, window.location.href);
  const entries = [...parsed.searchParams.entries()];

  const overlay = document.createElement("div");
  overlay.className = "rt-overlay";

  const panel = document.createElement("div");
  panel.className = "rt-panel";

  const close = () => {
    overlay.remove();
    resetSubmitButton();
  };

  const head = document.createElement("div");
  head.className = "rt-head";
  const title = document.createElement("span");
  title.textContent = `Rega test — ${parsed.origin}${parsed.pathname}`;
  const actions = document.createElement("div");
  actions.className = "rt-actions";
  actions.append(
    createButton(
      "Copy URL",
      (e) => {
        navigator.clipboard?.writeText(parsed.href);
        e.currentTarget.textContent = "Copied";
      },
      "rt-btn--ghost",
    ),
    createButton("Close", close, "rt-btn--ghost"),
  );
  head.append(title, actions);

  const urlBox = document.createElement("div");
  urlBox.className = "rt-url";
  urlBox.textContent = parsed.href;

  const table = document.createElement("table");
  table.className = "rt-table";
  entries.forEach(([key, value]) => {
    const row = table.insertRow();
    row.insertCell().textContent = key;
    const valueCell = row.insertCell();
    if (value === "") {
      valueCell.className = "rt-empty";
      valueCell.textContent = "(пусто)";
    } else {
      valueCell.textContent = value;
    }
  });

  panel.append(head, urlBox, table);
  overlay.append(panel);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.body.appendChild(overlay);
}

if (isRegTest) renderButtons();
