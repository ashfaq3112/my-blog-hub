/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",    // watch all ejs files
    "./public/**/*.js",    // if you add custom JS with classes
  ],
    theme: {
        extend: {
          animation: {
            'float': 'float 6s ease-in-out infinite',
            'glow': 'glow 2s ease-in-out infinite alternate',
            'gradient': 'gradient 3s ease infinite',
          }
        }
      },
  plugins: [],
}
 