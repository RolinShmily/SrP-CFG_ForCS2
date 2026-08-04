/**
 * 迁移骨架占位页（WIP）—— 下载页 /download。
 * 后续迁移 src/pages/download.astro 的版本获取逻辑
 * （原 Astro 顶层 await 需改为 SSG loader 或构建期注入，见 TASK.md 3.2）。
 */
export default function DownloadPage() {
  return (
    <main className="mx-auto w-full max-w-[var(--site-width)] px-[var(--content-gutter)] py-10">
      <h1 className="font-display text-2xl font-bold text-text">下载页（迁移骨架占位）</h1>
      <p className="mt-2 text-sm text-text-muted">
        占位内容：后续迁移自 src/pages/download.astro（版本获取 + 下载入口）。
      </p>
    </main>
  );
}
