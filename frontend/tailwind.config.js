export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',500:'#22c55e',600:'#2d6a4f',700:'#1a5c3a',800:'#166534',900:'#14532d' },
        agri: { green:'#2d6a4f', lightgreen:'#40916c', darkgreen:'#1b4332', cream:'#f8f9f3', gold:'#e9c46a', orange:'#f4a261' }
      },
      fontFamily: { sans:['Inter','system-ui','sans-serif'] },
    },
  },
  plugins: [],
}
