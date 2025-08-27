import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#5AD8CC",
        white: "#FFFFFF",
        gray: {
          100: "#F2F4F8",
          800: "#343A3F",
          900: "#21272A",
          1000: "#121619",
        },
        red: {
          400: "#F4776A",
          500: "#EC221F",
          900: "#4D0B0A",
        },
        green: {
          700: "#008043",
          900: "#024023",
        },
        white400: "rgba(255, 255, 255, 0.4)",
      },
      animation: {
        "fade-out": "1s fadeOut 3s ease-out forwards",
      },
      keyframes: {
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
