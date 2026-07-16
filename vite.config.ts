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
    coverage: {
      provider: "v8",
      all: false,
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "src/test/**",
        "src/**/__tests__/**",
        "src/**/*.test.{ts,tsx}",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/App.tsx",
        "src/router/**",
        "src/pages/**",
        "src/services/**",
        "src/components/layout/AppShell.tsx",
        "src/components/layout/CreateProjectModal.tsx",
        "src/components/dashboard/**",
        "src/components/board/ParentFilterSelector.tsx",
        "src/components/shared/AssigneeAvatar.tsx",
        "src/components/auth/InviteModal.tsx",
        "src/components/auth/SessionIndicator.tsx",
        "src/hooks/useBoardWebSocket.ts",
        "src/hooks/useSessionGuard.ts",
      ],
      thresholds: {
        lines: 70,
        statements: 70,
        functions: 50,
        branches: 64,
      },
    },
  },
});
