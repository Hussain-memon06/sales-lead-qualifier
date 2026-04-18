import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // Fluid editorial sizes
        hero: [
          "clamp(2.25rem, 2vw + 1.8rem, 3.25rem)",
          { lineHeight: "1.05", letterSpacing: "-0.02em" },
        ],
        "hero-lg": [
          "clamp(2.75rem, 3vw + 2rem, 4rem)",
          { lineHeight: "1", letterSpacing: "-0.025em" },
        ],
        kpi: [
          "clamp(2.25rem, 1.2vw + 1.9rem, 3rem)",
          { lineHeight: "1", letterSpacing: "-0.02em" },
        ],
      },
      colors: {
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
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
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        ink: "hsl(var(--ink))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          raised: "hsl(var(--surface-raised))",
          sunken: "hsl(var(--surface-sunken))",
        },
        hot: "hsl(var(--hot))",
        warm: "hsl(var(--warm))",
        cold: "hsl(var(--cold))",
      },
      borderRadius: {
        "2xl": "1.25rem",
        xl: "1rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft:
          "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)",
        elevated:
          "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 8px 24px -8px rgb(15 23 42 / 0.12)",
        floating:
          "0 1px 2px 0 rgb(15 23 42 / 0.05), 0 24px 48px -16px rgb(15 23 42 / 0.18)",
        glow:
          "0 0 0 1px hsl(var(--primary) / 0.12), 0 20px 40px -16px hsl(var(--primary) / 0.25)",
        inner:
          "inset 0 1px 0 0 rgb(255 255 255 / 0.6), inset 0 0 0 1px rgb(15 23 42 / 0.03)",
        ring: "0 0 0 4px hsl(var(--ring) / 0.15)",
      },
      backgroundImage: {
        "gradient-primary":
          "linear-gradient(135deg, hsl(162 63% 38%) 0%, hsl(172 66% 42%) 100%)",
        "gradient-ink":
          "linear-gradient(135deg, hsl(222 47% 11%) 0%, hsl(217 33% 17%) 100%)",
        "gradient-aurora":
          "radial-gradient(60% 80% at 10% 0%, hsl(162 63% 45% / 0.18) 0%, transparent 60%), radial-gradient(50% 70% at 100% 10%, hsl(217 91% 60% / 0.12) 0%, transparent 65%), radial-gradient(40% 60% at 80% 100%, hsl(32 95% 55% / 0.10) 0%, transparent 65%)",
        "gradient-subtle":
          "linear-gradient(180deg, hsl(210 40% 99%) 0%, hsl(210 40% 97%) 100%)",
        "mesh-dots":
          "radial-gradient(circle at 1px 1px, hsl(215 16% 60% / 0.18) 1px, transparent 0)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 0 0 hsl(var(--primary) / 0.3)",
          },
          "50%": { boxShadow: "0 0 0 8px hsl(var(--primary) / 0)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 500ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slide-up 600ms cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scale-in 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        "glow-pulse": "glow-pulse 2s ease-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
