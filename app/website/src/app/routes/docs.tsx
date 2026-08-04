/**
 * 迁移骨架占位页（WIP）—— 文档中心 /docs。
 * 后续迁移 DocLayout / DocsIndexLayout 与 18 篇文档（Velite 内容管线，TASK.md 3.2/3.3）。
 */
export default function DocsPage() {
  return (
    <main className="mx-auto w-full max-w-[var(--site-width)] px-[var(--content-gutter)] py-10">
      <h1 className="font-display text-2xl font-bold text-text">文档中心（迁移骨架占位）</h1>
      <p className="mt-2 text-sm text-text-muted">
        占位内容：后续迁移自 src/pages/docs/* 与 DocLayout / DocsIndexLayout。
      </p>
    </main>
  );
}
