import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#002451',
          'bg-2': '#001a3b',
          surface: '#08316a',
          'surface-2': '#0d3d7d',
        },
        text: {
          main: '#eef3ff',
          muted: '#8b9fcc',
          'muted-2': '#62769f',
        },
        accent: {
          DEFAULT: '#8bb6ff',
          2: '#79e0cf',
        },
        gold: {
          DEFAULT: '#ffd98a',
          2: '#ffe9a8',
        },
        red: '#ff9da4',
      },
      fontFamily: {
        // next/font (layout.tsx) expose les vraies familles via ces variables
        display: ['var(--font-sora)', 'Sora', 'system-ui', 'sans-serif'],
        body: ['var(--font-jost)', 'Jost', 'Montserrat', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '14px',
        lg: '10px',
        sm: '6px',
      },
      maxWidth: {
        site: '1140px',
      },
    },
  },
  plugins: [],
}

export default config
