import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base path is deploy-target-specific. Set VITE_BASE_PATH at build time:
//   GitHub Pages (repo subpath):  VITE_BASE_PATH=/runner/  npm run build
//   Vercel / Netlify (root):      (unset)                  npm run build
//   Dev:                          (unset, defaults to "/")
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [react()],
});
