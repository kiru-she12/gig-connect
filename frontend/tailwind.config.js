export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A312C',
          light: '#FFFFFF',
          dark: '#4E8C7E',
        },
        accent: {
          DEFAULT: '#89D7B7',
          light: '#FFFFFF',
        },
        warning: '#D97706',
        danger: '#DC2626',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        border: 'rgba(78, 140, 126, 0.2)',
        text: {
          primary: '#1A312C',
          secondary: '#4E8C7E',
          muted: '#89D7B7',
        },
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
