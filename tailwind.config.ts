import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F3F8FF",
        navy: {
          DEFAULT: "#071A3D",
          soft: "#1B2E52",
          muted: "#5A6B8C",
        },
        gold: {
          DEFAULT: "#C89A3C",
          soft: "#E2C988",
        },
        hairline: "#E5ECF5",
      },
      maxWidth: {
        engine: "1120px",
      },
      borderRadius: {
        card: "24px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(7, 26, 61, 0.04), 0 12px 32px rgba(7, 26, 61, 0.06)",
        lift: "0 2px 6px rgba(7, 26, 61, 0.05), 0 24px 60px rgba(7, 26, 61, 0.10)",
        inset: "inset 0 1px 0 rgba(255, 255, 255, 0.6)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Segoe UI",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
