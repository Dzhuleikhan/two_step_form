// Source: https://github.com/disposable-email-domains/disposable-email-domains
const DISPOSABLE_LIST_URL =
  "https://cdn.jsdelivr.net/gh/disposable-email-domains/disposable-email-domains@main/disposable_email_blocklist.conf";

let disposableSet = null;

fetch(DISPOSABLE_LIST_URL)
  .then((res) => (res.ok ? res.text() : Promise.reject(res.status)))
  .then((text) => {
    disposableSet = new Set(
      text
        .split("\n")
        .map((line) => line.trim().toLowerCase())
        .filter(Boolean),
    );
  })
  .catch((err) => {
    console.warn("Disposable email list failed to load:", err);
  });

export const isDisposableEmail = (email) => {
  if (!disposableSet) return false;
  const at = email.lastIndexOf("@");
  if (at === -1) return false;
  return disposableSet.has(email.slice(at + 1).toLowerCase());
};
