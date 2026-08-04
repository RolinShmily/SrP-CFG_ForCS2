/**
 * 迁移骨架占位页（WIP）—— 首页 /。
 * 使用 @srp-cfg/ui 的 PageHeader 验证共享组件（Layer 1）在 Web 侧可用；
 * 后续替换为 Hero / Features / Showcase / CTA / Steps / TerminalDemo（TASK.md 3.2）。
 */
import { PageHeader } from "@srp-cfg/ui";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[var(--site-width)] px-[var(--content-gutter)] py-10">
      <PageHeader
        eyebrow="SrP-CFG · Home"
        title="首页（迁移骨架占位）"
        description="这里是 Astro → Vite + React 迁移的首页占位内容。PageHeader 来自 @srp-cfg/ui 共享组件包，后续将替换为完整首页。"
      />
    </main>
  );
}
