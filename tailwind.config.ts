import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-body)', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eef4ff',
          100: '#d9e7ff',
          200: '#b7d0ff',
          300: '#89b1ff',
          400: '#5f90f6',
          500: '#3f73e6',
          600: '#2f5cc5',
          700: '#294c9f',
          800: '#284281',
          900: '#26396b',
        },
        ink: {
          50: '#f5f7fb',
          100: '#eaedf5',
          200: '#d7ddec',
          300: '#b5bfd6',
          400: '#8e9ab7',
          500: '#6f7b99',
          600: '#5b6681',
          700: '#4a536a',
          800: '#30384d',
          900: '#1b2233',
        },
      },
      boxShadow: {
        soft: '0 12px 32px rgba(17, 24, 39, 0.08)',
        panel: '0 16px 40px rgba(15, 23, 42, 0.08)',
      },
      backgroundImage: {
        'grid-fade': 'linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.08) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}
export default config
