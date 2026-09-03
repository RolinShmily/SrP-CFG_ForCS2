/**
 * Hero —— 首页首屏 (Meta Design Language + 黄橙黑配色取向)。
 * - Meta 标志性硬件级产品展台与自信的大号字阶律动 (Optimistic VF Style)
 * - 黄橙黑（Amber/Orange/Obsidian Black）品牌视觉体系
 * - Meta Dual-CTA 胶囊药丸按钮 (Primary Yellow-Orange Pill + Outlined Secondary Pill)
 * - 32px 大圆角产品展台 (Hero Product Canvas)
 */
import { useState } from "react";
import {
  Download,
  Terminal,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Code2,
  HardDrive,
  RefreshCw,
  Search,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { LATEST_VERSION } from "../../data/version";
import desktopQuickStart from "../../../../shared/images/desktop-1.png";
import desktopInstall from "../../../../shared/images/desktop-3.png";
import desktopPersonalize from "../../../../shared/images/desktop-4.png";

const heroFeatures = [
  { icon: Zap, label: "Tauri v2 + Rust 极速底座", desc: "内存占用 < 40MB，原生流畅" },
  { icon: ShieldCheck, label: "100% Valve Safe · 零注入", desc: "纯原生 +exec 引导，无任何 DLL 注入" },
  { icon: Code2, label: "CodeMirror 6 智能高亮", desc: "CS2 ConVar 与 Alias 语法感知" },
  { icon: RefreshCw, label: "10 级自动快照回滚", desc: "部署前差异审计，秒级一键还原" },
];

export function Hero() {
  const versionDisplay = LATEST_VERSION !== "0.0.0" ? `v${LATEST_VERSION}` : "v3.2.4";
  const [activeHeroTab, setActiveHeroTab] = useState<"desktop" | "trace">("desktop");
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      img: desktopQuickStart,
      title: "快速开始与环境自检",
      tag: "01 快速开始",
      desc: "自动探测 Steam、CS2 与用户 VCFG 物理路径",
    },
    {
      img: desktopInstall,
      title: "解耦套件与预审部署",
      tag: "03 组件安装",
      desc: "全量文件差异对比，新建 / 覆盖 / 保护一目了然",
    },
    {
      img: desktopPersonalize,
      title: "配置注入与偏好提取",
      tag: "04 配置注入",
      desc: "VCFG 偏好一键提取，内置 CodeMirror 6 编辑 custom.cfg",
    },
  ];

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28 lg:pt-20 lg:pb-32">
      {/* 黄橙黑环境柔和光晕 (Yellow-Orange Ambient Glows) */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[550px] w-[850px] rounded-full bg-gradient-to-b from-amber-500/15 via-orange-500/10 to-transparent blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/4 -right-40 h-[450px] w-[450px] rounded-full bg-amber-500/8 blur-[130px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* ================= 上半部分：Meta 风格产品叙事与 Dual-CTA ================= */}
        <div className="mx-auto max-w-4xl text-center">
          {/* 状态徽章药丸 (Status Pill) */}
          <div className="mb-6 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300 shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400"></span>
              </span>
              VCFG 架构就绪
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-medium text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              SrP-CFG {versionDisplay}
            </span>

            <span className="hidden items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-3.5 py-1.5 text-xs text-slate-400 sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              100% Valve Safe · 零注入
            </span>
          </div>

          {/* Display 标题 (Meta Optimistic VF Style: 500/600 Weight, Tight Leading) */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08]">
            功能留给运行时，
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
              偏好留给你。
            </span>
          </h1>

          {/* Editorial Subhead */}
          <p className="mx-auto mt-6 max-w-3xl text-lg sm:text-xl text-slate-300 font-normal leading-relaxed tracking-tight">
            专为 Counter-Strike 2 设计的模块化配置运行时与高性能桌面套件。
            <br className="hidden sm:inline" />
            核心 Runtime Core 注册 alias 指令引擎与会话模式，解耦道具标点与竞技画质；
            桌面端全流程提供路径探测、差异审计、VCFG 偏好提取与历史快照回滚。
          </p>

          {/* Meta 标志性 Dual-CTA 胶囊药丸 (黄橙黑配色取向) */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {/* Primary Pill Button (Meta 经典高对比纯白药丸) */}
            <Link
              to="/download"
              className="inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-8 py-4 text-base font-bold text-slate-950 shadow-lg shadow-white/5 transition-all duration-200 hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="h-5 w-5 text-slate-950" />
              <span>下载 Desktop 客户端 ({versionDisplay})</span>
            </Link>

            {/* Secondary Outlined Pill Button (深色描边药丸) */}
            <Link
              to="/commands"
              className="inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-slate-700 bg-slate-900/60 px-8 py-3.5 text-base font-bold text-white backdrop-blur-sm transition-all duration-200 hover:border-amber-400 hover:bg-slate-800 active:scale-[0.98]"
            >
              <Search className="h-5 w-5 text-amber-400" />
              <span>CS2 指令中心 (2785+)</span>
            </Link>
          </div>
        </div>

        {/* ================= 下半部分：Meta 风格 32px 大圆角产品展台 ================= */}
        <div className="mt-16 sm:mt-20">
          <div className="relative rounded-[32px] border border-slate-800/80 bg-gradient-to-b from-[#10141d] via-[#0c1017] to-black p-4 sm:p-6 lg:p-8 shadow-2xl backdrop-blur-xl">
            {/* 展台顶部切换药丸 (Product View Toggle Pills) */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveHeroTab("desktop")}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-all ${
                    activeHeroTab === "desktop"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <HardDrive className="h-3.5 w-3.5" />
                  <span>Desktop 桌面套件 (GUI)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveHeroTab("trace")}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-all ${
                    activeHeroTab === "trace"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Runtime Trace 架构时序</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400"></span>
                <span>TAURI V2 · RUST CORE · 64-BIT</span>
              </div>
            </div>

            {/* 展台主体内容 */}
            {activeHeroTab === "desktop" ? (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-center">
                {/* 左侧：高清截图展示 */}
                <div className="relative overflow-hidden rounded-[24px] border border-slate-800 bg-slate-950 shadow-inner group">
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
                    <img
                      src={slides[activeSlide].img}
                      alt={slides[activeSlide].title}
                      className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.01]"
                    />
                  </div>

                  {/* 截图下方小注 */}
                  <div className="flex items-center justify-between border-t border-slate-800 bg-[#0d1118] px-4 py-3 text-xs">
                    <span className="font-semibold text-white">{slides[activeSlide].title}</span>
                    <span className="font-mono text-slate-400">{slides[activeSlide].desc}</span>
                  </div>
                </div>

                {/* 右侧：3 步交互胶囊选择卡 */}
                <div className="flex flex-col gap-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-400/90 mb-1 font-mono">
                    工作流直观预览
                  </div>
                  {slides.map((s, idx) => (
                    <button
                      key={s.tag}
                      type="button"
                      onClick={() => setActiveSlide(idx)}
                      className={`flex flex-col gap-1 text-left rounded-[20px] p-4 transition-all duration-200 border ${
                        activeSlide === idx
                          ? "border-amber-500/60 bg-amber-500/10 text-white shadow-sm ring-1 ring-amber-500/30"
                          : "border-slate-800/80 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:bg-slate-900/80 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className={activeSlide === idx ? "font-bold text-amber-400" : "text-slate-500"}>
                          {s.tag}
                        </span>
                        {activeSlide === idx && (
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-slate-100">{s.title}</div>
                      <div className="text-xs text-slate-400 leading-snug">{s.desc}</div>
                    </button>
                  ))}

                  <Link
                    to="/docs/srpcfg-3"
                    className="mt-2 inline-flex items-center justify-between rounded-[20px] border border-slate-800 bg-slate-900/60 p-4 text-xs font-semibold text-slate-300 transition hover:border-amber-500/40 hover:bg-slate-800 hover:text-white"
                  >
                    <span>查阅桌面套件完整指南</span>
                    <ArrowRight className="h-4 w-4 text-amber-400" />
                  </Link>
                </div>
              </div>
            ) : (
              /* 右侧模式：Runtime Trace 仿真时序 */
              <div className="rounded-[24px] border border-slate-800 bg-slate-950 p-6 sm:p-8 font-mono text-xs text-slate-300">
                <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Terminal className="h-4 w-4" />
                    <span>DETERMINISTIC CS2 INITIALIZATION PIPELINE</span>
                  </div>
                  <span className="text-slate-500">3-STAGE STRICT ORDER</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-[20px] border border-slate-800 bg-slate-900/60 p-5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">STAGE 01 · VALVE OWNED</div>
                    <div className="mt-2 text-base font-bold text-white">CS2 载入 VCFG</div>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                      游戏引擎启动时首先反序列化 Steam 云端 cs2_user_keys.vcfg，还原玩家按键与 ConVar。
                    </p>
                    <div className="mt-4 rounded-lg bg-black/50 p-2.5 text-[11px] text-emerald-400 border border-emerald-500/20">
                      // Valve Managed (只读提取)
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-amber-500/40 bg-amber-500/5 p-5 ring-1 ring-amber-500/20">
                    <div className="text-[10px] font-bold text-amber-400 uppercase">STAGE 02 · SRP RUNTIME</div>
                    <div className="mt-2 text-base font-bold text-white">runtime/init.cfg</div>
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                      通过 +exec 引导加载 SrP 运行时：只读注册 alias 别名、会话 Feature 与 Mode 状态机。
                    </p>
                    <div className="mt-4 rounded-lg bg-black/50 p-2.5 text-[11px] text-amber-300 border border-amber-500/30">
                      +exec srp-cfg // 零污染注册
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-slate-800 bg-slate-900/60 p-5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">STAGE 03 · USER OWNED</div>
                    <div className="mt-2 text-base font-bold text-white">user/custom.cfg</div>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                      用户的专属个人定制层。覆盖 Preset 预设、注入个人按键与准星，在软件更新时绝对受保护。
                    </p>
                    <div className="mt-4 rounded-lg bg-black/50 p-2.5 text-[11px] text-orange-300 border border-orange-500/20">
                      exec user/custom.cfg // 终极唯一覆盖
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 展台底部 4 项硬件级设计特性 (4-Up Specs Bar) */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-800/80 pt-6">
              {heroFeatures.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.label} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <Icon className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>{feat.label}</span>
                    </div>
                    <div className="text-xs text-slate-400">{feat.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
