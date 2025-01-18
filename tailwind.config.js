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
            DEFAULT: '#7FB069',    // Sage green
            hover: '#6A9557',
            secondary: '#94B49F',  // Lighter sage
            muted: '#ABC4A1'       // Most muted sage
          },
          chat: {
            background: '#2F3B2F',
            surface: '#3A463A',
            text: '#FFFFFF',
            accent: '#7FB069'
          },
          gray: {
            200: '#E5E7EB',
          }
        },
        fontFamily: {
          sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
          mono: ['ui-monospace', 'monospace'],
        },
        boxShadow: {
          'soft': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          'strong': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          'lg-up': '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        keyframes: {
          fadeIn: {
            'from': { opacity: '0' },
            'to': { opacity: '1' },
          },
          fadeOut: {
            'from': { opacity: '1' },
            'to': { opacity: '0' },
          },
          pulse: {
            '0%, 100%': { opacity: '1' },
            '50%': { opacity: '0.5' },
          },
        },
        animation: {
          'fade-in': 'fadeIn 0.3s ease-in-out',
          'fade-out': 'fadeOut 0.3s ease-in-out',
          'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
      },
    },
    plugins: [],
  }