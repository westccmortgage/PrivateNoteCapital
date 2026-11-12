import type { Config } from "tailwindcss";

// Money green, paper white and one signal yellow. Token names are kept from the
// previous theme so every page picks up the new look without per-page rewrites:
// "navy" is now the ink scale, "accent" the green, "canvas" the light ground.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F3F5F2",
        surface: "#FFFFFF",
        navy: {
          DEFAULT: "#0D211A",
          soft: "#28433A",
          muted: "#56695F",
        },
        accent: {
          DEFAULT: "#0F5C3F",
          soft: "#E2EEE7",
          ink: "#0A4530",
        },
        field: {
          DEFAULT: "#0E3527",
          deep: "#0A281D",
          line: "#24493B",
          text: "#C9D8CF",
        },
        signal: {
          DEFAULT: "#FFC629",
          hover: "#F2B70F",
          ink: "#2B2100",
        },
        positive: "#1F6F5C",
        warn: "#8A4F14",
        hairline: "#DFE5E1",
        hairlineStrong: "#C8D2CC",
      },
      maxWidth: {
        shell: "1200px",
      },
      borderRadius: {
        card: "8px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(13, 33, 26, 0.06), 0 6px 18px rgba(13, 33, 26, 0.06)",
        lift: "0 4px 10px rgba(13, 33, 26, 0.10), 0 24px 48px rgba(13, 33, 26, 0.18)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        serif: ["var(--font-display)", "var(--font-body)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        display: "-0.03em",
      },
    },
  },
  plugins: [],
};

export default config;
