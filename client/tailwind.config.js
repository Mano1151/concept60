export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Point all theme colors at CSS custom properties so they
        // change dynamically when html[data-theme='...'] switches.
        bg:    'rgb(var(--color-bg) / <alpha-value>)',
        panel: 'rgb(var(--color-panel) / <alpha-value>)',
        accent:'rgb(var(--accent) / <alpha-value>)',
        'accent-cyan': 'rgb(var(--accent-cyan) / <alpha-value>)',
      },
      fontFamily: {
        inter:   ['Inter', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft:       '0 20px 60px rgba(2,6,23,0.45)',
        'soft-light':'0 8px 30px rgba(2,6,23,0.18)',
      },
      backgroundImage: {
        'accent-gradient':
          'linear-gradient(90deg,rgb(var(--accent)) 0%,rgb(var(--accent-cyan)) 100%)',
      },
    },
  },
  plugins: [],
};
