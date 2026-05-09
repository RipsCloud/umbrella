import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { fileURLToPath } from "url";

// See root README › Local dev.
//   8830 — apps/ripscloud-api worker http
//   8833 — apps/ripscloud-api inspector
//   8836 — apps/ripscloud-web vite dev server (this file)
export default defineConfig({
  plugins: [TanStackRouterVite(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 8836,
    strictPort: true,
  },
  preview: {
    port: 8836,
    strictPort: true,
  },
});
