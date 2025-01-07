/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8F8F8',
        surface: '#FFFFFF',    
        primary: '#1A1A1A',   
        secondary: '#4A4A4A',  
        accent: {
          DEFAULT: '#7FB069', // Soft sage green
          hover: '#6A9557',
          secondary: '#94B49F', // Lighter sage
          muted: '#ABC4A1'     // Most muted sage
        },
        chat: {
          background: '#2F3B2F',
          surface: '#3A463A',
          text: '#FFFFFF',
          accent: '#7FB069'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'strong': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'lg-up': '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}