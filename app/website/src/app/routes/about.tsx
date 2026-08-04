/**
 * 迁移骨架占位页（WIP）—— 关于页 /about。
 * 后续迁移自 src/pages/about.astro（TASK.md 3.2）。
 */
export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-[var(--site-width)] px-[var(--content-gutter)] py-10">
      <h1 className="font-display text-2xl font-bold text-text">关于页（迁移骨架占位）</h1>
      <p className="mt-2 text-sm text-text-muted">
        占位内容：后续迁移自 src/pages/about.astro。
      </p>
    </main>
  );
}
