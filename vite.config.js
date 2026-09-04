import { defineConfig } from "vite";

const DEV_PROXY_TARGET = "https://goldbet.fun";

const proxyTo = (options = {}) => ({
  target: DEV_PROXY_TARGET,
  changeOrigin: true,
  secure: false,
  ...options,
});

// один набор правил на dev-сервер и на preview: без него превью прод-сборки
// остаётся без API и падает в гео-фолбэк
const proxy = {
  "/email-guard.js": proxyTo(),
  "/identity-guard.js": proxyTo(),
  "/phone-guard.js": proxyTo(),
  "/geo-api": proxyTo(),
  "/api/phone/verify": proxyTo(),
  "/api/email/verify": proxyTo(),
  "/api/phone/check-available": proxyTo(),
  "/api/email/check-available": proxyTo(),
  "/api/domain/available": proxyTo(),
  // C2Gaming: /session, /register и WS /ws
  "/api/landing/c2gaming": proxyTo({ ws: true }),
};

export default defineConfig({
  base: "https://landing-res.b-cdn.net/playable/gatesofolympus/",
  esbuild: {
    supported: {
      "top-level-await": true,
    },
    target: "esnext",
  },
  build: {
    // без этого сборка держит дефолтный target и транспилирует классы
    // под браузеры, которых у аудитории ленда нет
    target: "esnext",
  },
  server: {
    host: true,
    open: true,
    proxy,
  },
  preview: {
    open: true,
    proxy,
  },
});
