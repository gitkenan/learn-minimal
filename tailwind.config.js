/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Claude-like colors
        background: '#F8F8F8', // Light gray background
        surface: '#FFFFFF',    // White surface
        primary: '#1A1A1A',    // Almost black
        secondary: '#666666',  // Medium gray
        'claude-border': '#E5E5E5', // Light border color
        accent: '#4F46E5',     // Indigo (our version of Claude's orange)
        'accent-hover': '#4338CA',
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'sans-serif'
        ],
      },
      boxShadow: {
        'claude': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
}