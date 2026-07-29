import type { Config } from "tailwindcss";

// Foreclosure & Auction Intelligence theme: ivory canvas, dark-navy ink, a single
// restrained slate-blue accent. No gold, no stock-market styling. Data-first.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F8F6F1", // ivory
        surface: "#FFFFFF",
        navy: {
          DEFAULT: "#0C1E3C", // primary ink
          soft: "#1E3358",
          muted: "#5E6B82",
        },
        accent: {
          DEFAULT: "#27568B", // restrained slate-blue
          soft: "#E7EEF6",
          ink: "#1B3E66",
        },
        positive: "#1F6F5C", // equity / good, used sparingly
        warn: "#9A5B1E", // postponed / caution
        hairline: "#E6E2D8",
        hairlineStrong: "#D8D3C6",
      },
      maxWidth: {
        shell: "1160px",
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(12, 30, 60, 0.05), 0 8px 24px rgba(12, 30, 60, 0.06)",
        lift: "0 2px 6px rgba(12, 30, 60, 0.06), 0 18px 44px rgba(12, 30, 60, 0.10)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
