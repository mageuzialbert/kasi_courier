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
        // Kasi Courier Brand Colors
        primary: {
          DEFAULT: "#22c55e", // Vibrant green
          dark: "#16a34a",
          light: "#4ade80",
        },
        secondary: {
          DEFAULT: "#eab308", // Golden yellow
          dark: "#ca8a04",
          light: "#fde047",
        },
        accent: {
          DEFAULT: "#3b82f6", // Solid blue
          dark: "#2563eb",
          light: "#60a5fa",
        },
      },
    },
  },
  plugins: [],
};
export default config;
