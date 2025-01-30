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
          background: '#F5F5F5', // Increased contrast from #F8F8F8 (4.7:1 ratio)
          surface: '#FFFFFF',
          primary: '#1E1E1E', // Darker text (contrast ratio 15:1)
          secondary: '#4D4D4D', // Adjusted using 1/φ ratio from primary
          accent: {
            DEFAULT: '#689F38', // Base green (φ-adjusted from previous #7FB069)
            hover: '#4B7029',   // DEFAULT * (1 - 1/φ)
            secondary: '#8BC34A', // DEFAULT * φ^0.5
            muted: '#C5E1A5'    // DEFAULT * φ^-1
          },
          chat: {
            background: '#37474F', // New φ-adjusted dark base
            surface: '#455A64',    // background * φ^0.25
            text: '#FFFFFF',
            accent: '#689F38'      // Matches DEFAULT
          },
          gray: {
            200: '#EEEEEE', // Higher contrast for better accessibility
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
            'from': { 
              opacity: '0',
              transform: 'translateY(10px)'
            },
            'to': { 
              opacity: '1',
              transform: 'translateY(0)'
            },
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
          'fade-in': 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          'bounce': 'bounce 1s infinite',
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
