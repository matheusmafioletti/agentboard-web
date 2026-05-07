import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3010,
    strictPort: true,
  },
  define: {
    global: "globalThis",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.ts"],
    include: ["src/test/**/*.test.{ts,tsx}", "src/**/__tests__/**/*.test.{ts,tsx}"],
    passWithNoTests: true,
  },
});
