import { defineConfig } from "vite";

export default defineConfig({
  base: "https://landing-res.b-cdn.net/two-step-form/zeruh/",
  esbuild: {
    supported: {
      "top-level-await": true,
    },
    target: "esnext",
  },
  server: {
    host: true,
    open: true,
    // proxy: {
    //   "/email-guard.js": {
    //     target: "https://goldbet.fun",
    //     changeOrigin: true,
    //     secure: false,
    //   },
    //   "/api/email/verify": {
    //     target: "https://goldbet.fun",
    //     changeOrigin: true,
    //     secure: false,
    //   },
    // },
  },
});
