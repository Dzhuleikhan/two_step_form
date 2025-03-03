import { defineConfig } from "vite";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  base: "",
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
  define: {
    __SECRET_KEY__: JSON.stringify(process.env.VITE_SECRET_KEY_GEO),
  },
});
