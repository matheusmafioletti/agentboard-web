/*
 * AgentBoard Design Tokens
 * ========================
 *
 * Accent:          #5856D6  — indigo-violet (product identity, not generic blue)
 * Base bg light:   #F5F5F7  — off-white, slightly warm
 * Base bg dark:    #0A0A0F  — near-black (never pure #000000)
 * Surface light:   #FFFFFF  — cards, sidebar
 * Surface dark:    #141418  — cards, sidebar in dark mode
 * Surface-2 dark:  #1C1C1E  — kanban columns, secondary surfaces
 * Surface-3 dark:  #2C2C2E  — kanban cards on dark board
 * Text primary:    #1D1D1F (light) / #F5F5F7 (dark)
 * Text secondary:  #6E6E73 (light) / #8E8E93 (dark)
 * Border light:    rgba(0,0,0,0.08)   → use border-black/[0.08]
 * Border dark:     rgba(255,255,255,0.08) → use dark:border-white/[0.08]
 * Shadow:          0 1px 3px rgba(0,0,0,0.06)  → shadow-card
 */
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#5856D6",
          50:  "#EFEFF9",
          100: "#E0E0F4",
          200: "#C1C0E9",
          300: "#A2A1DD",
          400: "#8381D2",
          500: "#5856D6",
          600: "#4745C0",
          700: "#3634AA",
          800: "#252394",
          900: "#14127E",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card:  "14px",
        chip:  "10px",
        modal: "20px",
      },
      boxShadow: {
        card:       "0 1px 3px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.10)",
        modal:      "0 20px 60px rgba(0,0,0,0.18)",
      },
      letterSpacing: {
        heading: "-0.5px",
        caps:    "0.08em",
      },
      animation: {
        "page-enter":       "page-enter 200ms ease-out forwards",
        "skeleton-shimmer": "skeleton-shimmer 1.5s ease-in-out infinite",
      },
      keyframes: {
        "page-enter": {
          "0%":   { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "skeleton-shimmer": {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      transitionTimingFunction: {
        sidebar: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        sidebar: "220ms",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            "--tw-prose-links": "#5856D6",
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
