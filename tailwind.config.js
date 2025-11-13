/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        ts: {
          bg: "var(--ts-bg)",
          'bg-soft': "var(--ts-bg-soft)",
          ink: "var(--ts-ink)",
          'ink-soft': "var(--ts-ink-soft)",
          accent: "var(--ts-accent)",
          primary: "var(--ts-primary)",
          line: "var(--ts-line)",
          paper: "var(--ts-paper)"
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'ui-serif', 'serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(0,0,0,.35)'
      }
    },
  },
  plugins: [],
}