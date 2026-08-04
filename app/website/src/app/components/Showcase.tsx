/**
 * Showcase —— Desktop 演示截图区（对应原 Showcase.astro，React 化）。
 * 截图卡用共享 Card（@srp-cfg/ui）；astro:assets 的 Image → 直接 import PNG + <img>（Vite 原生处理）。
 * data-astro-prefetch 已删除；"获取 Desktop" 内链 → react-router <Link>。
 */
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import { Card, SectionHeader } from "@srp-cfg/ui";
import quickStartImg from "../../assets/desktop-quick-start.png";
import downloadImg from "../../assets/desktop-download.png";
import installImg from "../../assets/desktop-install.png";
import userConfigImg from "../../assets/desktop-user-config.png";
import recoveryCenterImg from "../../assets/desktop-recovery-center.png";
import currentInstallationImg from "../../assets/desktop-current-installation.png";
import aboutImg from "../../assets/desktop-about.png";

// Vite 原生 import PNG：运行时为 URL 字符串（build/client/assets/*.png），直接作 <img src>。
const quickStartUrl = quickStartImg;
const downloadUrl = downloadImg;
const installUrl = installImg;
const userConfigUrl = userConfigImg;
const recoveryCenterUrl = recoveryCenterImg;
const currentInstallationUrl = currentInstallationImg;
const aboutUrl = aboutImg;

const screenshots = [
  {
    src: quickStartUrl,
    index: "02",
    eyebrow: "Quick start",
    title: "先看懂流程，再开始部署",
    desc: "下载、检测、选择来源、确认目标与建立 custom.cfg，被拆成五个可以逐项核对的步骤。",
  },
  {
    src: downloadUrl,
    index: "03",
    eyebrow: "Download",
    title: "只需要一个 Runtime Core",
    desc: "功能、用户入口、Preset 案例与 Valve 重置基线进入同一个 v3 配置包。",
  },
  {
    src: installUrl,
    index: "04",
    eyebrow: "Install",
    title: "路径、账号与 VCFG 状态同屏确认",
    desc: "安装前先明确游戏 CFG、Annotations、Video 与账号本地配置的真实位置。",
  },
  {
    src: recoveryCenterUrl,
    index: "05",
    eyebrow: "Recovery",
    title: "恢复对象各归其位",
    desc: "上一个 Runtime、安装前原文件与只读 VCFG 快照分开呈现，用户配置始终受保护。",
  },
  {
    src: currentInstallationUrl,
    index: "06",
    eyebrow: "Managed files",
    title: "安装器只管理自己部署的文件",
    desc: "当前安装清单可审计、可分类移除，不把 custom.cfg 或游戏持有的 VCFG 混入其中。",
  },
  {
    src: aboutUrl,
    index: "07",
    eyebrow: "About",
    title: "项目边界与来源保持可追溯",
    desc: "官网、仓库、技术栈、维护者与许可证都能从应用内直接找到。",
  },
];

export function Showcase() {
  return (
    <section className="home-section border-b border-border py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-7">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeader
            index="02"
            label="Desktop"
            title="把复杂的配置边界，做成看得懂的界面"
            description="Desktop 覆盖从下载、安装到个性化与恢复的完整路径。最重要的 Runtime、User 与 VCFG 三层关系，不再藏在目录和术语里。"
            align="left"
          />
          <Link
            to="/download"
            className="mb-10 inline-flex min-h-11 shrink-0 items-center gap-2 font-display text-sm font-semibold text-text-muted no-underline transition-colors hover:text-accent sm:mb-14"
          >
            获取 Desktop
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <Card
          padding="none"
          className="overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_21rem]"
        >
          <div className="overflow-hidden border-b border-border bg-bg-raised lg:border-b-0 lg:border-r">
            <img
              src={userConfigUrl}
              alt="SrP-CFG Desktop 我的配置页面，展示 Runtime、custom.cfg 与 CS2 VCFG 的分层关系"
              loading="lazy"
              decoding="async"
              className="block aspect-[16/9] h-full w-full object-cover object-top"
            />
          </div>
          <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-9">
            <div>
              <div className="flex items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.14em]">
                <span className="text-accent">01 / User configuration</span>
                <span className="text-text-faint">Core view</span>
              </div>
              <h3 className="mt-8 font-display text-2xl font-bold leading-tight text-text sm:text-3xl">
                偏好只有一个入口
              </h3>
              <p className="mt-4 text-sm leading-7 text-text-secondary">
                在“我的配置”里选择 Preset 起点，随后直接维护唯一的{" "}
                <code className="font-mono text-[0.9em] text-accent-light">user/custom.cfg</code>
                。Runtime 注册功能，用户写最终覆盖，CS2 继续持有自己的状态。
              </p>
            </div>
            <dl className="mt-8 grid grid-cols-3 gap-px border border-border bg-border font-mono text-[10px] uppercase tracking-[0.1em]">
              <div className="bg-bg-raised px-3 py-3">
                <dt className="text-teal">Runtime</dt>
                <dd className="mt-1 text-text-faint">功能</dd>
              </div>
              <div className="bg-bg-raised px-3 py-3">
                <dt className="text-accent">User</dt>
                <dd className="mt-1 text-text-faint">偏好</dd>
              </div>
              <div className="bg-bg-raised px-3 py-3">
                <dt className="text-blue-400">VCFG</dt>
                <dd className="mt-1 text-text-faint">状态</dd>
              </div>
            </dl>
          </div>
        </Card>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {screenshots.map((item) => (
            <Card key={item.index} padding="none" className="overflow-hidden">
              <div className="overflow-hidden border-b border-border bg-bg-raised">
                <img
                  src={item.src}
                  alt={`SrP-CFG Desktop ${item.title}`}
                  loading="lazy"
                  decoding="async"
                  className="block aspect-[16/9] w-full object-cover object-top"
                />
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.14em]">
                  <span className="text-accent">{item.index}</span>
                  <span className="text-text-faint">{item.eyebrow}</span>
                </div>
                <strong className="mt-5 block font-display text-lg font-bold leading-snug text-text">
                  {item.title}
                </strong>
                <span className="mt-3 block text-sm leading-7 text-text-secondary">
                  {item.desc}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
