import type { Config } from "tailwindcss";

/**
 * Colour key naming rule (learned the hard way):
 * a custom colour whose key matches a built-in utility namespace silently
 * hijacks that utility. `base` in particular collided with Tailwind's
 * `text-base` font-size utility, so `sm:text-base` compiled to
 * `color: var(--bg-base)` and rendered body copy invisible against the band.
 * Never name a colour key after a font-size, text-align, or text-overflow step.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--bg-base)",
        surface: "var(--bg-surface)",
        subtle: "var(--bg-subtle)",
        card: "var(--bg-card)",
        ink: "var(--text-primary)",
        dim: "var(--text-dim)",
        muted: "var(--text-muted)",
        line: "var(--border-line)",
        "line-strong": "var(--border-strong)",
        "cs-orange": "var(--cs-orange)",
        "cs-blue": "var(--cs-blue)",
        "cs-emerald": "var(--cs-emerald)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        pill: "9999px",
        "3xl": "28px",
        "4xl": "36px",
      },
    },
  },
  plugins: [],
};

export default config;
