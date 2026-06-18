/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAFAF9',
        ink: '#111111',
        muted: '#5A5A55',
        line: '#E2E0DA',
        accent: '#1D4ED8',   // ink blue
        accent2: '#7A2E2E',  // oxblood (secondary)
      },
      fontFamily: {
        disp: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: { content: '980px' },
    },
  },
  plugins: [],
}
