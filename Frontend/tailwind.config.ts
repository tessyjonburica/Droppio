import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F9E99',
          foreground: '#FFFFFF',
        },
        white: '#FFFFFF',
        'soft-mint': '#EFFBFB',
        background: '#FFFFFF',
        foreground: '#000000',
        muted: {
          DEFAULT: '#F5F5F5',
          foreground: '#737373',
        },
        accent: {
          DEFAULT: '#EFFBFB',
          foreground: '#0F9E99',
        },
        border: '#E5E5E5',
        input: '#E5E5E5',
        ring: '#0F9E99',
      },
      fontFamily: {
        logo: ['var(--font-pacifico)', 'cursive'],
        header: ['var(--font-pacifico)', 'cursive'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
};

export default config;

