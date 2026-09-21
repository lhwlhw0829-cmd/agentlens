import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#050505",
        panel: "#0e0e10",
        panel2: "#141416",
        border: "#232326",
        accent: "#ff2d78",
        accent2: "#ff6fa5",
        ok: "#32d583",
        warn: "#ffb020",
        danger: "#ff4d6d",
        muted: "#8c8c93",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,45,120,0.15), 0 8px 30px -8px rgba(255,45,120,0.35)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 40px -20px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        mesh:
          "radial-gradient(60% 50% at 15% 0%, rgba(255,45,120,0.16) 0%, rgba(255,45,120,0) 60%), radial-gradient(45% 40% at 85% 15%, rgba(255,111,165,0.12) 0%, rgba(255,111,165,0) 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
