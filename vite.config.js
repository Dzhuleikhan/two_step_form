import { defineConfig } from "vite";

export default defineConfig({
  base: "https://landing-res.b-cdn.net/two-step-form/",
  esbuild: {
    supported: {
      "top-level-await": true,
    },
    target: "esnext",
  },
  server: {
    host: true,
    open: true,
  },
});
