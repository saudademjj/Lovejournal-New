/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular"],
        display: ["Space Grotesk", "Inter", "sans-serif"],
      },
      colors: {
        bg: "#030303",
        surface: "#0f0f0f",
        neon: "#ff003c",
        "neon-blue": "#2b00ff",
      },
    },
  },
  plugins: [],
};
