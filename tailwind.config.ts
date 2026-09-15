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
        ink: "#0f172a",
        muted: "#64748b",
        line: "#e6edf8",
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
        card: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
        pop: "0 10px 30px rgba(16,24,40,0.12)",
      },
      borderRadius: {
        xl: "0.9rem",
      },
    },
  },
  plugins: [],
};

export default config;
