import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Wood theme colors
        wood: {
          50: "var(--wood-50)",
          100: "var(--wood-100)",
          200: "var(--wood-200)",
          300: "var(--wood-300)",
          400: "var(--wood-400)",
          500: "var(--wood-500)",
          600: "var(--wood-600)",
          700: "var(--wood-700)",
          800: "var(--wood-800)",
          900: "var(--wood-900)",
        },
        walnut: {
          50: "var(--walnut-50)",
          100: "var(--walnut-100)",
          200: "var(--walnut-200)",
          300: "var(--walnut-300)",
          400: "var(--walnut-400)",
          500: "var(--walnut-500)",
          600: "var(--walnut-600)",
          700: "var(--walnut-700)",
          800: "var(--walnut-800)",
          900: "var(--walnut-900)",
        },
        sage: "var(--sage)",
        terracotta: "var(--terracotta)",
        cream: "var(--cream)",
        charcoal: "var(--charcoal)",
        // Semantic colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        serif: ["Playfair Display", "ui-serif", "Georgia"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular"],
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-top": "slide-in-from-top 0.3s ease-out",
        "slide-in-bottom": "slide-in-from-bottom 0.3s ease-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      boxShadow: {
        'wood': '0 4px 6px -1px rgba(212, 132, 79, 0.1), 0 2px 4px -1px rgba(212, 132, 79, 0.06)',
        'wood-lg': '0 10px 15px -3px rgba(212, 132, 79, 0.1), 0 4px 6px -2px rgba(212, 132, 79, 0.05)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config 