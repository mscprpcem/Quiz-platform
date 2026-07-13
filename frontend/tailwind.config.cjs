/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        microsoft: {
          blue: "#0078d4",
          lightBlue: "#e6f2fc",
          darkBlue: "#005a9e",
          gray: "#f3f2f1",
          darkGray: "#323130",
          border: "#edebe9",
          success: "#107c41",
          error: "#a80000",
          warning: "#d83b01"
        }
      },
      fontFamily: {
        segoe: ["'Segoe UI'", "Tahoma", "Geneva", "Verdana", "sans-serif"]
      }
    },
  },
  plugins: [],
}
