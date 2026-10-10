/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Syne', 'system-ui', 'sans-serif'],
      },
      colors: {
        aeromate: {
          bg: '#F5F5F0',         // warm porcelain
          surface: '#FFFFFF',
          text: '#0D0D0D',       // near-black ink
          muted: '#6B6B6B',      // warm gray
          blue: '#246BFD',
          blueHover: '#1D58D8',
          paleBlue: '#EAF2FF',
          coral: '#FF795B',
          border: '#E5E5E0',     // warm border
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          ink: '#1A1A1A',        // hero text
          cream: '#FAFAF7',      // off-white
        }
      },
      boxShadow: {
        'subtle': '0 1px 4px rgba(0,0,0,0.04)',
        'card': '0 4px 24px rgba(0,0,0,0.06)',
        'floating': '0 12px 48px rgba(0,0,0,0.10)',
        'pill': '0 2px 8px rgba(0,0,0,0.12)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'drift': 'drift 20s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        drift: { '0%': { transform: 'translateX(-10%)' }, '100%': { transform: 'translateX(10%)' } },
      },
    },
  },
  plugins: [],
}
