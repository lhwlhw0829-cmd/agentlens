import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d12",
        panel: "#12151c",
        border: "#212530",
        accent: "#6ee7b7",
        warn: "#fbbf24",
        danger: "#f87171",
        muted: "#8b93a7",
      },
    },
  },
  plugins: [],
};

export default config;
