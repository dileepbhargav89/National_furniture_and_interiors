/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './providers/**/*.{js,ts,jsx,tsx,mdx}',
    // Scan shared UI package so its Tailwind classes aren't purged
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui token aliases (keeps @nfi/ui working)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // NFI brand utilities — full unified palette
        nfi: {
          orange:          'var(--nfi-orange)',
          'orange-dark':   'var(--nfi-orange-dark)',
          'orange-light':  'var(--nfi-orange-light)',
          'orange-tint':   'var(--nfi-orange-tint)',
          brown:           'var(--nfi-brown)',
          'brown-dark':    'var(--nfi-brown-dark)',
          'brown-mid':     'var(--nfi-brown-mid)',
          cream:           'var(--nfi-cream)',
          sand:            'var(--nfi-sand)',
          surface:         'var(--nfi-surface)',
          'surface-muted': 'var(--nfi-surface-muted)',
          border:          'var(--nfi-border)',
          text:            'var(--nfi-text)',
          'text-secondary':'var(--nfi-text-secondary)',
          success:         'var(--nfi-success)',
          warning:         'var(--nfi-warning)',
          danger:          'var(--nfi-danger)',
          // Sidebar tokens
          'sidebar-bg':    'var(--nfi-sidebar-bg)',
          'sidebar-text':  'var(--nfi-sidebar-text)',
          'sidebar-muted': 'var(--nfi-sidebar-muted)',
          'sidebar-active':'var(--nfi-sidebar-active)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
