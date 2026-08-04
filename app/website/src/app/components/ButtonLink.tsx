/**
 * ButtonLink —— 共享 Button（@srp-cfg/ui）的 Link 包装（对应原 ButtonLink.astro）。
 *
 * 共享 Button 渲染 <button>，这里用 react-router <Link> 承载同一套视觉 tokens，
 * 保证 Web 站按钮与 Desktop 一致（D7）。props 类型直接取自共享 Button（variant/size）。
 */
import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router";
import { Button } from "@srp-cfg/ui";
import { clsx } from "clsx";

type SharedButtonProps = ComponentProps<typeof Button>;
/** Website 只用 accent / ghost 两种变体 */
type Variant = Exclude<NonNullable<SharedButtonProps["variant"]>, "outline">;
type Size = NonNullable<SharedButtonProps["size"]>;

interface ButtonLinkProps {
  to: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

// 与共享 Button 相同的变体/尺寸 tokens（Button 是 <button>，Link 需要 <a> 语义，故在此镜像）
const variants: Record<Variant, string> = {
  accent:
    "bg-accent text-bg hover:bg-accent-light hover:-translate-y-0.5 hover:shadow-accent-glow",
  ghost:
    "bg-transparent text-text-secondary border border-border-highlight hover:border-text-muted hover:text-text",
};

const sizes: Record<Size, string> = {
  sm: "text-sm px-3.5 py-2",
  md: "text-base px-5 py-3",
  lg: "text-lg px-8 py-4",
};

export function ButtonLink({
  to,
  variant = "accent",
  size = "md",
  className,
  children,
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className={clsx(
        "inline-flex items-center justify-center gap-2.5 font-display font-semibold tracking-wide rounded-[6px] transition-all duration-200 cursor-pointer no-underline",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}
