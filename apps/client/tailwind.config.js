/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Inter"',
          '"SF Pro Display"',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        brand: {
          50: '#f2f1fd',
          100: '#e5e2fb',
          200: '#cac5f7',
          300: '#a9a0f0',
          400: '#8a7ef0',
          500: '#6c5ce7',
          600: '#5b4bd6',
          700: '#4a3bb0',
          800: '#3a2e8a',
          900: '#2c2368',
        },
        success: {
          50: '#e9fbf3',
          100: '#cdf5e3',
          500: '#17c078',
          600: '#12a866',
          700: '#0e8a52',
        },
        warning: {
          50: '#fff6e9',
          100: '#ffe8c4',
          500: '#f5a623',
          600: '#dc8f10',
        },
        ink: {
          900: '#0b0d12',
          700: '#1c2130',
          500: '#4a5268',
          300: '#8a92a6',
        },
      },
      boxShadow: {
        glass: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)',
        'glass-lg': '0 12px 40px rgba(15, 23, 42, 0.14)',
        soft: '0 1px 2px rgba(15, 23, 42, 0.05), 0 1px 6px rgba(15, 23, 42, 0.04)',
      },
      backdropBlur: {
        glass: '20px',
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.75rem',
      },
    },
  },
  plugins: [],
};
