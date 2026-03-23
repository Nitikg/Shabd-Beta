import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        kiki: {
          orange: '#FF6B35',
          yellow: '#FFD166',
          teal: '#06D6A0',
          indigo: '#1B1F3B',
          offwhite: '#FFF8F0',
          purple: '#C77DFF'
        }
      },
      borderRadius: {
        xl: '1.5rem',
        '3xl': '2rem'
      },
      boxShadow: {
        soft: '0 18px 45px rgba(255, 107, 53, 0.25)'
      }
    }
  },
  plugins: []
};

export default config;
