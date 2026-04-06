/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        dmsans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        background: {
          DEFAULT: '#F8FAFC',
          surface: '#FFFFFF',
          elevated: '#F1F5F9',
        },
        text: {
          primary: '#0A192F',
          secondary: '#475569',
          muted: '#94A3B8',
        },
        primary: {
          DEFAULT: '#0A192F',
          hover: '#172A46',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#E25822',
          hover: '#C94B1B',
          light: '#FFF3ED',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#10B981',
          bg: '#ECFDF5',
        },
        warning: {
          DEFAULT: '#F59E0B',
        },
        border: '#E2E8F0',
        input: '#F1F5F9',
        ring: '#E25822',
      },
      borderRadius: {
        card: '16px',
        badge: '8px',
      },
      boxShadow: {
        'card': '0 8px 30px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 20px 40px rgba(0, 0, 0, 0.08)',
        'button': '0 4px 14px rgba(226, 88, 34, 0.3)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
