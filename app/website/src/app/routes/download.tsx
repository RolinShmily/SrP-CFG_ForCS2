/**
 * 下载页 /download（对应原 src/pages/download.astro，React 化）。
 * - 区块标题 / 卡片 / 徽章复用 @srp-cfg/ui（SectionHeader / Card / Badge）
 * - 原 Card.astro 的 href 链接形态 → <a> 包装共享 Card（group-hover 等价 hover 效果）
 * - LATEST_VERSION 构建期注入见 data/version.ts（此页不展示版本号，保留给首页）
 */
import type { MetaFunction } from "react-router";
import { Download, Info, Package } from "lucide-react";
import { Badge, Card, SectionHeader } from "@srp-cfg/ui";
import { installers, packages } from "../../data/downloads";
import { RELEASES_URL } from "../../data/navigation";

export const meta: MetaFunction = () => [
  { title: "下载 — SrP-CFG" },
  { name: "description", content: "下载 SrP-CFG 安装器和 v3 配置包" },
];

const cardLinkHover =
  "transition-[background-color,border-color,box-shadow,transform] duration-200 group-hover:-translate-y-0.5 group-hover:border-border-highlight group-hover:bg-bg-hover group-hover:shadow-[0_10px_32px_rgba(0,0,0,0.28)]";

// featured 卡需 border-accent/20，但 Tailwind 排序中 border-accent/* 恒在 border-border 之前，
// 无法经 Card className 覆盖（Card 基础类带 border-border），故 featured 卡用原生 div 精确还原。
const featuredCard =
  "rounded-[var(--radius)] border border-accent/20 bg-bg-card p-6 " + cardLinkHover;
const plainCard = "p-6 " + cardLinkHover;

export default function DownloadPage() {
  return (
    <section className="pb-16 pt-28 sm:pb-20 sm:pt-32">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-7">
        <SectionHeader
          level="h1"
          label="Download"
          title="下载中心"
          description="获取 Desktop 安装器与唯一 Runtime Core。所有 v3 功能、Preset 案例和用户入口都在同一个配置包中。"
        />

        <div className="mb-20">
          <h2 className="mb-8 flex items-center gap-3 font-display text-2xl font-semibold">
            <Download className="h-6 w-6 text-accent" />
            安装器
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {installers.map((item) => (
              <a
                key={item.file}
                href={item.url}
                target="_blank"
                rel="noopener"
                className="group block no-underline"
              >
                <Card padding="none" className={`p-8 ${cardLinkHover}`}>
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="mb-1 font-display text-xl font-semibold transition-colors group-hover:text-accent">
                        {item.name}
                      </h3>
                      <span className="font-mono text-sm text-text-faint">{item.file}</span>
                    </div>
                    <Badge
                      variant="accent"
                      className="rounded-[4px] border border-[rgba(232,121,12,0.12)] px-3 py-1 text-xs tracking-wider"
                    >
                      {item.badge}
                    </Badge>
                  </div>
                  <p className="mb-6 text-sm leading-7 text-text-secondary">{item.desc}</p>
                  <div className="flex items-center gap-2 font-display text-sm font-semibold text-accent">
                    <Download className="h-4 w-4" />
                    点击下载
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-8 flex items-center gap-3 font-display text-2xl font-semibold">
            <Package className="h-6 w-6 text-teal" />
            v3 配置包
          </h2>
          <div className="mb-6 rounded-[8px] border border-[rgba(232,121,12,0.18)] bg-accent-bg p-4 text-sm leading-[1.75] text-text-secondary">
            现在只发行 Runtime Core。安装后在{" "}
            <code className="font-mono text-[0.9em] text-accent-light">user/custom.cfg</code>{" "}
            中启用一个
            <code className="font-mono text-[0.9em] text-accent-light">srp_apply_*</code>{" "}
            作为起点，再把个人差异写在下面；也可以完全交给 VCFG。
          </div>
          <div className="grid grid-cols-1 gap-5">
            {packages.map((pkg) => (
              <a
                key={pkg.file}
                href={pkg.url}
                target="_blank"
                rel="noopener"
                className="group block no-underline"
              >
                <div className={pkg.featured ? featuredCard : undefined}>
                  <Card padding="none" className={pkg.featured ? undefined : plainCard}>
                    <div className="mb-3 flex items-center gap-3">
                    <div
                      className={
                        pkg.featured
                          ? "flex h-10 w-10 items-center justify-center rounded-[6px] border border-[rgba(232,121,12,0.12)] bg-accent-bg"
                          : "flex h-10 w-10 items-center justify-center rounded-[6px] border border-border bg-bg-raised"
                      }
                    >
                      <Download
                        className={pkg.featured ? "h-[18px] w-[18px] text-accent" : "h-[18px] w-[18px] text-text-muted"}
                        strokeWidth={1.8}
                      />
                    </div>
                    {pkg.featured ? (
                      <span className="rounded bg-accent px-2 py-1 font-mono text-xs font-bold tracking-wide text-bg">
                        {pkg.badge}
                      </span>
                    ) : (
                      <Badge
                        variant="default"
                        outline
                        className="bg-bg-raised px-2 py-1 text-xs font-bold tracking-wide"
                      >
                        {pkg.badge}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mb-1.5 font-display text-lg font-semibold transition-colors group-hover:text-accent">
                    {pkg.name}
                  </h3>
                  <p className="mb-4 text-sm leading-7 text-text-secondary">{pkg.desc}</p>
                  <span className="font-mono text-xs text-text-faint">{pkg.file}</span>
                  </Card>
                </div>
              </a>
            ))}
          </div>
        </div>

        <Card padding="none" className="mt-12 flex gap-4 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-[rgba(232,121,12,0.12)] bg-accent-bg">
            <Info className="h-[18px] w-[18px] text-accent" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="mb-1 font-display text-base font-semibold">使用说明</h2>
            <p className="text-sm leading-7 text-text-secondary">
              下载安装器后双击运行，将配置包（ZIP）直接拖入窗口即可自动完成安装。所有文件也可在{" "}
              <a
                href={RELEASES_URL}
                target="_blank"
                rel="noopener"
                className="text-accent hover:underline"
              >
                GitHub Releases
              </a>{" "}
              找到。
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
