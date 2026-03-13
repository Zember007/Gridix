import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        xs: "360px",
      },
      colors: {
        border: "hsl(var(--border))",
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
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeSlideIn: {
          from: {
            opacity: "0",
            filter: "blur(8px)",
            transform: "translateY(12px)",
          },
          to: {
            opacity: "1",
            filter: "blur(0px)",
            transform: "translateY(0px)",
          },
        },
        slideRightIn: {
          from: {
            opacity: "0",
            filter: "blur(8px)",
            transform: "translateX(20px)",
          },
          to: {
            opacity: "1",
            filter: "blur(0px)",
            transform: "translateX(0px)",
          },
        },
        testimonialIn: {
          from: {
            opacity: "0",
            filter: "blur(8px)",
            transform: "translateY(16px) scale(0.98)",
          },
          to: {
            opacity: "1",
            filter: "blur(0px)",
            transform: "translateY(0px) scale(1)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        element: "fadeSlideIn 0.6s ease-out forwards",
        "slide-right": "slideRightIn 0.8s ease-out forwards",
        testimonial: "testimonialIn 0.6s ease-out forwards",
      },
      animationFillMode: {
        forwards: "forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
