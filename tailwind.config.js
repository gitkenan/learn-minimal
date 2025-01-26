/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        spacing: {
          'gutter-sm': '1rem',    // 16px
          'gutter-md': '1.5rem',  // 24px
          'gutter-lg': '2rem',    // 32px
          'gutter-xl': '3rem'     // 48px
        },
        lineHeight: {
          'paragraph': '1.7',  // Optimal reading line-height
        },
        fontSize: {
          // Heading scale with associated line-heights
          'h1': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
          'h2': ['1.875rem', { lineHeight: '1.3', fontWeight: '600' }],
          'h3': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
          'h4': ['1.25rem', { lineHeight: '1.5', fontWeight: '500' }],
          'h5': ['1.125rem', { lineHeight: '1.5', fontWeight: '500' }],
          'h6': ['1rem', { lineHeight: '1.5', fontWeight: '500' }],
        },
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
          shimmer: {
            '0%': {
              backgroundPosition: '-1000px 0',
            },
            '100%': {
              backgroundPosition: '1000px 0',
            },
          },
          shimmer: {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' }
          },
          spin: {
            'from': { transform: 'rotate(0deg)' },
            'to': { transform: 'rotate(360deg)' }
          },
          buttonPress: {
            '0%, 100%': { transform: 'scale(1)' },
            '100%': { transform: 'scale(0.95)' },
          },
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
          'shimmer': 'shimmer 2s infinite linear',
          'button-press': 'buttonPress 0.1s ease-in-out forwards',
          'fade-in': 'fadeIn 0.3s ease-in-out',
          'fade-out': 'fadeOut 0.3s ease-in-out',
          'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'shimmer': 'shimmer 2s linear infinite',
          'spin': 'spin 1.5s linear infinite',
          'fade-in': 'fadeIn 0.3s ease-in-out',
        },
        gridTemplateColumns: {
          'responsive': 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          'auto-fill-sm': 'repeat(auto-fill, minmax(240px, 1fr))',
          'auto-fill-md': 'repeat(auto-fill, minmax(320px, 1fr))',
        },
      },
    },
    plugins: [
      function({ addComponents, theme }) {
        addComponents({
          '.shimmer': {
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: theme('colors.gray.200'),
            '&::after': {
              position: 'absolute',
              top: '0',
              right: '0',
              bottom: '0',
              left: '0',
              transform: 'translateX(-100%)',
              backgroundImage: `linear-gradient(
                90deg,
                rgba(255, 255, 255, 0) 0,
                rgba(255, 255, 255, 0.2) 20%,
                rgba(255, 255, 255, 0.5) 60%,
                rgba(255, 255, 255, 0)
              )`,
              animation: theme('animation.shimmer'),
              content: '""',
            }
          }
        })
      }
    ],
  }
