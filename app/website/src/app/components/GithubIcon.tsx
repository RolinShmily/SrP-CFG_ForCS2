import githubSvg from "../../assets/svg/github-brands-solid-full.svg?raw";

interface GithubIconProps {
  /** Tailwind 尺寸/颜色类，例如 `h-4 w-4 text-text-muted` */
  className?: string;
  /** 兼容 lucide 的 size 约定（像素）；仅在未传 className 时生效 */
  size?: number;
}

/**
 * GitHub 品牌图标。
 *
 * lucide-react 1.0 移除了全部品牌图标（0.511 起已带
 * `@deprecated … will be removed in v1.0` 提示，并建议改用 simpleicons.org），
 * 因此改用仓库自带的品牌字形资源，并保持与 lucide 一致的调用方式：
 * 同时接受 `className` 与 `size`，颜色随 `currentColor` 继承。
 */
export function GithubIcon({ className, size }: GithubIconProps) {
  const usePixelSize = !className && size !== undefined;
  const sizing = className ?? (usePixelSize ? "" : "h-4 w-4");

  return (
    <span
      className={`inline-flex items-center justify-center [&>svg]:h-full [&>svg]:w-full ${sizing}`}
      style={usePixelSize ? { width: size, height: size } : undefined}
      dangerouslySetInnerHTML={{ __html: githubSvg }}
    />
  );
}
