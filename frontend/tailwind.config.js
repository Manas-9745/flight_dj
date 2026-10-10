/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        // Light theme palette
        brand: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2563EB', // Primary accent
          600: '#1D4ED8',
          700: '#1E40AF',
          800: '#1E3A8A',
          900: '#172B4D', // Primary text
        },
        teal: {
          400: '#14B8A6',
          500: '#0F9D9A', // Secondary accent
          600: '#0D9488',
        },
        surface: {
          50:  '#F7F9FC', // App background
          100: '#F1F5F9',
          200: '#E2E8F0', // Borders
          300: '#CBD5E1',
        },
        navy: {
          700: '#172B4D',
          800: '#0F1E3C',
          900: '#060D1A',
        },
      },
      borderColor: {
        'surface-50':  '#F7F9FC',
        'surface-100': '#F1F5F9',
        'surface-200': '#E2E8F0',
        'surface-300': '#CBD5E1',
      },
      backgroundColor: {
        'surface-50':  '#F7F9FC',
        'surface-100': '#F1F5F9',
        'surface-200': '#E2E8F0',
        'surface-300': '#CBD5E1',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.35s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-subtle': 'bounceSub 1.5s infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn:   { from: { opacity: 0, transform: 'translateX(-12px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        bounceSub: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-3px)' } },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.10), 0 2px 4px -1px rgba(0,0,0,0.06)',
        'brand': '0 4px 14px 0 rgba(37,99,235,0.25)',
      },
    },
  },
  plugins: [],
}
