/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.{html,js}"],
  theme: {
    screens: {
      large: { max: "1650px" },
      xl: { max: "1200px" },
      tbl: { max: "767px" },
      medium: { max: "650px" },
      small: { max: "480px" },
      xs: { max: "360px" },
    },
    container: {
      padding: 10,
      center: true,
    },
    extend: {
      fontFamily: {
        montserrat: "Montserrat",
        raleway: "Raleway",
        kadwa: "Kadwa",
        gilroy: "Gilroy",
      },
      colors: {
        white: "#f0f0f0",
      },
    },
  },
  plugins: [],
};
