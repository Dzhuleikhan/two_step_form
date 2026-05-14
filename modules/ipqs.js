const IPQS_ENABLED = false;

const API_KEY = "BqDPd513I3PfHiB5gXgnYeTNKgCNRBlM";
const BASE = "https://www.ipqualityscore.com/api/json";
const TIMEOUT_MS = 2500;

const emailCache = new Map();
const phoneCache = new Map();

const fetchWithTimeout = async (url) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
};

export const validateEmailIPQS = async (email) => {
  if (!IPQS_ENABLED) return { ok: false };
  const key = String(email).trim().toLowerCase();
  if (!key) return { ok: false };
  if (emailCache.has(key)) return emailCache.get(key);

  try {
    const data = await fetchWithTimeout(
      `${BASE}/email/${API_KEY}/${encodeURIComponent(key)}?fast=true&timeout=3&abuse_strictness=0`,
    );
    if (!data || typeof data.valid !== "boolean") {
      throw new Error(data?.message || "IPQS unexpected response");
    }
    const result = {
      ok: true,
      valid: data.valid,
      disposable: Boolean(data.disposable),
    };
    emailCache.set(key, result);
    return result;
  } catch (err) {
    console.warn("IPQS email check failed, applying fallback:", err);
    return { ok: false };
  }
};

export const validatePhoneIPQS = async (phone) => {
  if (!IPQS_ENABLED) return { ok: false };
  const key = String(phone).replace(/\D/g, "");
  if (!key) return { ok: false };
  if (phoneCache.has(key)) return phoneCache.get(key);

  try {
    const data = await fetchWithTimeout(
      `${BASE}/phone/${API_KEY}/${encodeURIComponent(key)}`,
    );
    if (!data || typeof data.valid !== "boolean") {
      throw new Error(data?.message || "IPQS unexpected response");
    }
    const result = {
      ok: true,
      valid: data.valid,
    };
    phoneCache.set(key, result);
    return result;
  } catch (err) {
    console.warn("IPQS phone check failed, applying fallback:", err);
    return { ok: false };
  }
};
