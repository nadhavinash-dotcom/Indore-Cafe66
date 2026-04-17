/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'ci-black': '#0D0D0D',
        'ci-black-soft': '#1A1A1A',
        'ci-black-border': '#2A2A2A',
        'ci-gold': '#C9922A',
        'ci-gold-light': '#E8B86D',
        'ci-gold-muted': '#7A5520',
        'ci-white': '#F5F0E8',
        'ci-white-muted': '#A89880',
        'ci-success': '#4CAF50',
        'ci-error': '#E53935',
        'ci-warning': '#FF9800',
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      animation: {
        'pulse-red': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'checkmark': 'checkmark 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        checkmark: { '0%': { transform: 'scale(0)', opacity: 0 }, '60%': { transform: 'scale(1.2)' }, '100%': { transform: 'scale(1)', opacity: 1 } },
      },
    },
  },
  plugins: [],
};
