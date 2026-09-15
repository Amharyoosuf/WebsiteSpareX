import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Subtle, professional light-blue palette for a spare-parts shop.
        brand: {
          DEFAULT: "#2f6fed", // readable blue for buttons/links
          dark: "#215ad0",
          light: "#eef4ff", // very light blue tint (hover/active/wash)
        },
        sky: {
          soft: "#f2f7ff", // faint blue-tinted surface
          mid: "#e3edff",
        },
        offer: "#f59e0b", // warm amber, used only for sale/deal accents
        navy: "#0f1b38", // deep footer / contrast anchor
        ink: "#0f172a",
        muted: "#475569", // darker secondary text for better contrast
        line: "#d8e2f1",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.06), 0 8px 20px -12px rgba(15,23,42,0.18)",
        pop: "0 12px 34px -8px rgba(15,23,42,0.22)",
      },
      borderRadius: {
        xl: "0.9rem",
      },
    },
  },
  plugins: [],
};

export default config;
