/**
 * 迁移骨架占位页（WIP）—— 指令检索中心 /commands。
 * 后续迁移自 src/pages/commands.astro：SSG 构建期预渲染 commands.json + AI 面板（TASK.md 3.4）。
 */
export default function CommandsPage() {
  return (
    <main className="mx-auto w-full max-w-[var(--site-width)] px-[var(--content-gutter)] py-10">
      <h1 className="font-display text-2xl font-bold text-text">指令检索中心（迁移骨架占位）</h1>
      <p className="mt-2 text-sm text-text-muted">
        占位内容：后续迁移自 src/pages/commands.astro（SSG 预渲染 + AI 检索面板）。
      </p>
    </main>
  );
}
