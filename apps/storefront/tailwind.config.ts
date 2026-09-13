import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
    './layouts/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
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
          orange:           'var(--nfi-orange)',
          'orange-dark':    'var(--nfi-orange-dark)',
          'orange-light':   'var(--nfi-orange-light)',
          'orange-tint':    'var(--nfi-orange-tint)',
          brown:            'var(--nfi-brown)',
          'brown-dark':     'var(--nfi-brown-dark)',
          'brown-mid':      'var(--nfi-brown-mid)',
          cream:            'var(--nfi-cream)',
          sand:             'var(--nfi-sand)',
          surface:          'var(--nfi-surface)',
          'surface-dark':   'var(--nfi-surface-dark)',
          border:           'var(--nfi-border)',
          'border-light':   'var(--nfi-border-light)',
          text:             'var(--nfi-text)',
          'text-secondary': 'var(--nfi-text-secondary)',
          'text-inverse':   'var(--nfi-text-inverse)',
          success:          'var(--nfi-success)',
          warning:          'var(--nfi-warning)',
          danger:           'var(--nfi-danger)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-in-left': 'slide-in-left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
      },
    },
  },
  plugins: [],
};
export default config;

