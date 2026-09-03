/**
 * 下载页 /download（对应原 src/pages/download.astro，React 化）。
 * - 区块标题 / 卡片 / 徽章复用 @srp-cfg/ui（SectionHeader / Card / Badge）
 * - 原 Card.astro 的 href 链接形态 → <a> 包装共享 Card（group-hover 等价 hover 效果）
 * - LATEST_VERSION 构建期注入见 data/version.ts（此页不展示版本号，保留给首页）
 */
import type { MetaFunction } from "react-router";
import { Download, Github, Info, Package } from "lucide-react";
import { Badge, Card, SectionHeader } from "@srp-cfg/ui";
import { installers, packages } from "../../data/downloads";
import { RELEASES_URL } from "../../data/navigation";

export const meta: MetaFunction = () => [
  { title: "下载 — SrP-CFG" },
  { name: "description", content: "下载 SrP-CFG 安装器和 v3 配置包" },
];

// 卡片不再是整卡链接（改为卡片内两个下载按钮），悬停只做轻微高亮
const cardHover =
  "transition-colors duration-200 hover:border-border-highlight hover:bg-bg-hover";

// 两个下载按钮：国内加速（accent，推荐） / GitHub 源（中性描边）
const downloadPrimary =
  "inline-flex min-h-10 items-center gap-2 rounded-[6px] bg-accent px-4 font-display text-sm font-semibold text-bg transition-all hover:-translate-y-0.5 hover:bg-accent-light hover:shadow-accent-glow";
const downloadSecondary =
  "inline-flex min-h-10 items-center gap-2 rounded-[6px] border border-border bg-transparent px-4 font-display text-sm font-semibold text-text-secondary transition-colors hover:border-text-muted hover:text-text";

// featured 卡需 border-accent/20，但 Tailwind 排序中 border-accent/* 恒在 border-border 之前，
// 无法经 Card className 覆盖（Card 基础类带 border-border），故两种形态都用原生 div 精确还原：
// - featured：accent 边框 + 悬停特效
// - 普通：等同 Card 基础类（border-border + bg-bg-card）
const featuredCard =
  "rounded-[var(--radius)] border border-accent/20 bg-bg-card p-6 " + cardHover;
const plainCard =
  "rounded-[var(--radius)] border border-border bg-bg-card p-6 " + cardHover;

export default function DownloadPage() {
  return (
    <section className="pb-16 pt-28 sm:pb-20 sm:pt-32">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-7">
        <SectionHeader
          level="h1"
          label="Download"
          title="下载中心"
          description="获取 Desktop 桌面安装器与解耦配置组件。所有功能、Preset 模版案例与用户入口清晰独立，按需安装。"
        />

        <div className="mb-20">
          <h2 className="mb-8 flex items-center gap-3 font-display text-2xl font-semibold">
            <Download className="h-6 w-6 text-accent" />
            安装器
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {installers.map((item) => (
              <Card
                key={item.file}
                padding="none"
                className="group p-8 transition-colors duration-200 hover:border-border-highlight hover:bg-bg-hover"
              >
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
                <div className="flex flex-wrap items-center gap-3">
                  <a href={item.mirrorUrl} target="_blank" rel="noopener" className={downloadPrimary}>
                    <Download className="h-4 w-4" />
                    国内加速下载
                  </a>
                  <a href={item.githubUrl} target="_blank" rel="noopener" className={downloadSecondary}>
                    <Github className="h-4 w-4" />
                    GitHub 源下载
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-8 flex items-center gap-3 font-display text-2xl font-semibold">
            <Package className="h-6 w-6 text-teal" />
            模块化配置包
          </h2>
          <div className="mb-6 rounded-[8px] border border-[rgba(232,121,12,0.18)] bg-accent-bg p-4 text-sm leading-[1.75] text-text-secondary">
            采用解耦组件架构：核心只需安装 <strong className="text-accent">Runtime Core</strong>；地图道具标点集与画质模版作为可选扩展包按需获取。在 Desktop 中亦可直接一键在线下载与分流安装。
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {packages.map((pkg) => (
              <div key={pkg.file} className="group block">
                <div className={`${pkg.featured ? featuredCard : plainCard} flex h-full flex-col justify-between`}>
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <div
                        className={
                          pkg.featured
                            ? "flex h-10 w-10 items-center justify-center rounded-[6px] border border-[rgba(232,121,12,0.12)] bg-accent-bg"
                            : "flex h-10 w-10 items-center justify-center rounded-[6px] border border-border bg-bg-raised"
                        }
                      >
                        <Download
                          className={
                            pkg.featured
                              ? "h-[18px] w-[18px] text-accent"
                              : "h-[18px] w-[18px] text-text-muted"
                          }
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
                  </div>
                  <div>
                    <div className="mb-4 border-t border-border pt-3">
                      <span className="font-mono text-xs text-text-faint">{pkg.file}</span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <a href={pkg.mirrorUrl} target="_blank" rel="noopener" className={`${downloadPrimary} justify-center`}>
                        <Download className="h-4 w-4" />
                        国内加速下载
                      </a>
                      <a href={pkg.githubUrl} target="_blank" rel="noopener" className={`${downloadSecondary} justify-center`}>
                        <Github className="h-4 w-4" />
                        GitHub 源下载
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card padding="none" className="mt-12 flex gap-4 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-[rgba(232,121,12,0.12)] bg-accent-bg">
            <Info className="h-[18px] w-[18px] text-accent" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="mb-1 font-display text-base font-semibold">安装与使用说明</h2>
            <p className="text-sm leading-7 text-text-secondary">
              下载桌面安装器（推荐 MSI 安装向导）运行后，可直接在应用内通过国内加速通道下载组件，或手动拖入本地 ZIP/CFG 配置包。安装器内置自动路径探测、冲突检视、VCFG 偏好一键提取以及灾备全量快照自动归档机制；每个下载项均直连 GitHub Release 官方发布源，亦可在{" "}
              <a
                href={RELEASES_URL}
                target="_blank"
                rel="noopener"
                className="text-accent hover:underline"
              >
                GitHub Releases
              </a>{" "}
              查阅历史发布。
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
