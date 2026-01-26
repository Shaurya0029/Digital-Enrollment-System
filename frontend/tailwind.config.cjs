/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primaryFrom: '#7c3aed',
        primaryTo: '#06b6d4'
      }
    }
  }
}
