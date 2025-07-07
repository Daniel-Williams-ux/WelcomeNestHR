
/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#00ACC1",
          dark: "#26C6DA",
        },
        accent: {
          light: "#FB8C00",
          dark: "#1C1C1E",
        },
        background: {
          light: "#F9FAFB",
          dark: "#121212",
        },
        surface: {
          light: "#F5F5F5",
          dark: "#1E1E1E",
        },
        text: {
          light: "#1A202C",
          dark: "#E0E0E0",
        },
        logo: {
          roofStart: "#D81B60",
          roofEnd: "#FB8C00",
          birdhouse: "#FDD835",
          nestStart: "#FFEB3B",
          nestEnd: "#FFB300",
          birdStart: "#2196F3",
          birdEnd: "#1976D2",
          welcomeStart: "#FFC107",
          welcomeEnd: "#FBC02D",
          nestText: "#1565C0",
          hrStart: "#26C6DA",
          hrEnd: "#00897B",
        },
      },
    },
  },
  plugins: [],
};

export default config;