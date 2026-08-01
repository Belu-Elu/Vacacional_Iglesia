/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2f7d32",
          dark: "#1b5e20",
          light: "#66bb6a",
        },
        accent: {
          DEFAULT: "#8bc34a",
        },
      },
    },
  },
  plugins: [],
};
