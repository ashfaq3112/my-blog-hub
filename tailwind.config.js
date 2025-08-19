/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",    // watch all ejs files
    "./public/**/*.js",    // if you add custom JS with classes
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
