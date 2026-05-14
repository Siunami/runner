import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Deploys to https://siunami.github.io/runner/ — base path matches repo name.
export default defineConfig({
  base: "/runner/",
  plugins: [react()],
});
