export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Stitch design system — "The Architectural Editor"
        surface: {
          DEFAULT: '#f9f9f9',      // base canvas
          low:     '#f2f4f4',      // recessed (sidebars, utility panels)
          lowest:  '#ffffff',      // elevated (cards, active regions)
          high:    '#e4e9ea',      // hover / inactive tabs
          highest: '#dde4e5',      // input backgrounds
          dim:     '#d4dbdd',      // pressed / deep hover
        },
        ink: {
          DEFAULT: '#2d3435',      // on-surface (body text)
          muted:   '#5a6061',      // on-surface-variant (labels, meta)
          subtle:  '#757c7d',      // outline
          ghost:   '#adb3b4',      // outline-variant
        },
        // Primary — charcoal
        charcoal: {
          DEFAULT: '#5f5e5e',
          dim:     '#535252',
          light:   '#e5e2e1',
        },
        // Secondary — steel blue (the accent)
        steel: {
          DEFAULT: '#516076',
          dim:     '#45546a',
          light:   '#d4e3fe',
          'light-dim': '#c6d5f0',
        },
        // Tertiary
        slate: {
          DEFAULT: '#4d6080',
          light:   '#bccff6',
        },
        zinc: {
          750: '#3f3f46',
        }
      },
      boxShadow: {
        // Stitch "Double Diffusion" ambient shadow
        float: '0 4px 12px rgba(45,52,53,0.04), 0 2px 4px rgba(45,52,53,0.02)',
        'float-md': '0 8px 24px rgba(45,52,53,0.06), 0 4px 8px rgba(45,52,53,0.04)',
      },
    },
  },
  plugins: [],
}
