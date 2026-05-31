export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0F0F0F',
        panel: '#1A1A1A',
        accent: '#6C63FF',
        'accent-cyan': '#00E6FF',
        'glass-hex': 'rgba(255,255,255,0.06)'
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 20px 60px rgba(2,6,23,0.45)',
        'soft-light': '0 8px 30px rgba(2,6,23,0.18)'
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(90deg, rgba(108,99,255,1) 0%, rgba(34,211,238,1) 100%)'
      },
    },
  },
  plugins: [],
};
