import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          main: "#FAF9F6",
          card: "#FFFFFF",
          secondary: "#F4F2EC",
          subtle: "#EFECE4",
        },
        ink: {
          primary: "#292B27",
          secondary: "#77786F",
          muted: "#9C9D94",
        },
        border: {
          warm: "#E8E6DF",
          strong: "#D7D4CA",
        },
        accent: {
          olive: "#68765B",
          "olive-hover": "#58654C",
          sage: "#A5AF94",
          "sage-soft": "#EDF0E8",
        },
        status: {
          success: "#648365",
          "success-bg": "#EEF3EE",
          warning: "#B58B4C",
          "warning-bg": "#F8F2E7",
          danger: "#B96C5C",
          "danger-bg": "#F9EDEA",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
