import { type ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

type Variant = "accent" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  "inline-flex items-center justify-center gap-2.5 font-display font-semibold tracking-wide rounded-[6px] transition-all duration-200 cursor-pointer border-none";

const variants: Record<Variant, string> = {
  accent:
    "bg-accent text-bg hover:bg-accent-light hover:-translate-y-0.5 hover:shadow-accent-glow",
  ghost:
    "bg-transparent text-text-secondary border border-border-highlight hover:border-text-muted hover:text-text",
  outline:
    "bg-transparent text-text-secondary border border-border hover:border-accent hover:text-accent",
};

const sizes: Record<Size, string> = {
  sm: "text-sm px-3.5 py-2",
  md: "text-base px-5 py-3",
  lg: "text-lg px-8 py-4",
};

export function Button({
  variant = "accent",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
