/**
 * Showcase —— Desktop 动态交互式演示截图区 (Meta Design Language + 黄橙黑配色取向)。
 * - Meta 标志性圆角胶囊药丸 Tab 选择器 (Pill Tabs)
 * - 32px 大圆角旗舰展示卡片 (Showcase Card)
 * - 黄橙黑（Amber/Orange/Obsidian）配色体系
 * - 高清全屏灯箱放大与清晰的步骤高亮
 */
import React, { useState, useEffect } from "react";
import {
  Maximize2,
  X,
  Play,
  Pause,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router";
import quickStartImg from "../../../../shared/images/desktop-1.png";
import downloadImg from "../../../../shared/images/desktop-2.png";
import installImg from "../../../../shared/images/desktop-3.png";
import userConfigImg from "../../../../shared/images/desktop-4.png";
import currentInstallationImg from "../../../../shared/images/desktop-5.png";
import recoveryCenterImg from "../../../../shared/images/desktop-6.png";
import aboutImg from "../../../../shared/images/desktop-7.png";

const stages = [
  {
    id: "quickstart",
    src: quickStartImg,
    index: "01",
    tabLabel: "快速开始",
    eyebrow: "Pipeline Overview",
    title: "五阶段流水线，环境与账号状态一目了然",
    desc: "下载、安装、注入、浏览与恢复五个阶段逐项核对。启动即刻检测 CS2 游戏物理安装路径与 Steam 当前自动登录账号，零繁琐手动配置。",
    highlights: ["CS2 游戏路径自动探测", "Steam 当前账号直连感知", "五阶段一站式导航引导"],
  },
  {
    id: "downloads",
    src: downloadImg,
    index: "02",
    tabLabel: "组件下载",
    eyebrow: "Decoupled Artifacts",
    title: "三大组件解耦，双通道高速获取与自定义导入",
    desc: "Runtime Core、Map Guides、Video Settings 独立打包分发。支持一键切换国内镜像源与 GitHub 官方源，并支持拖拽第三方 ZIP 与 loose CFG 文件。",
    highlights: ["三大独立分发包自由选择", "国内加速镜像 / 官方直连", "第三方 ZIP / CFG 拖拽导入"],
  },
  {
    id: "install",
    src: installImg,
    index: "03",
    tabLabel: "组件安装",
    eyebrow: "Diff & Snapshot",
    title: "队列精准驱动，差异审计后安全部署",
    desc: "预安装队列智能匹配目标物理路径；展开式文件树清晰标明每个文件的新增、覆盖与受保护状态；部署前秒级生成全量 ZIP 灾备快照。",
    highlights: ["预安装清单智能分类", "文件状态差异先审后装", "部署前自动归档受影响目录"],
  },
  {
    id: "personalize",
    src: userConfigImg,
    index: "04",
    tabLabel: "配置注入",
    eyebrow: "Preset & VCFG",
    title: "模版起点 + VCFG 偏好智能提取 + 语法高亮",
    desc: "内置 RoL1n 自用、Echo、YSZH、VisionL 等热门模版；一键只读解析 Valve VCFG 偏好并无损注入；在专业的 CS2 语法高亮编辑器中自由修改。",
    highlights: ["热门 Preset 模版自由切换", "VCFG 偏好一键提取与撤销", "CodeMirror 6 语法高亮编辑器"],
  },
  {
    id: "tree",
    src: currentInstallationImg,
    index: "05",
    tabLabel: "当前安装",
    eyebrow: "Multi-root Tree",
    title: "物理文件树实时扫描与就地查阅编辑",
    desc: "合并呈现游戏 CFG、标点集与画质模版三大物理根目录。支持多根单滚动条流畅浏览，点击文件即可实时加载至代码编辑器中就地保存。",
    highlights: ["三大物理根目录实时聚合", "文件树单滚动条平滑浏览", "代码就地查看与即时保存"],
  },
  {
    id: "recovery",
    src: recoveryCenterImg,
    index: "06",
    tabLabel: "恢复中心",
    eyebrow: "Disaster Recovery",
    title: "全量 ZIP 历史快照与一键无损回滚",
    desc: "每次安装前自动归档备份受影响目录。支持一键无损还原到任意历史时间点，支持一键清空旧自动快照，并可自定义快照保留上限。",
    highlights: ["时间戳命名的全量 ZIP 归档", "一键安全无损还原历史快照", "快照保留上限与一键清理"],
  },
  {
    id: "about",
    src: aboutImg,
    index: "07",
    tabLabel: "关于软件",
    eyebrow: "Architecture & Stack",
    title: "现代前沿技术栈，MIT 自由开源协议",
    desc: "基于 Tauri v2 + Rust 核心构建，前端采用 React 19 + TypeScript + CodeMirror 6，小巧轻盈（≤20MB），代码完全透明可审计。",
    highlights: ["Tauri v2 + Rust 安全轻量", "极小体积与零资源占用", "MIT 开源协议与社区共建"],
  },
];

export function Showcase() {
  const [activeIdx, setActiveIdx] = useState<number>(3); // 默认高亮配置注入 (04)
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);

  const currentStage = stages[activeIdx];

  useEffect(() => {
    if (!isAutoPlay) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % stages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlay]);

  return (
    <section className="relative overflow-hidden py-20 md:py-28 lg:py-32 border-b border-slate-800/80">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* 区域标题 */}
        <div className="mx-auto max-w-3xl text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>DESKTOP SUITE WALKTHROUGH</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            专为现代 CS2 玩家打造的桌面套件。
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            告别繁琐的手动复制与控制台冲突。可视化管理组件下载、差异审计、参数定制与快照备份。
          </p>
        </div>

        {/* 阶段切换药丸 Tab 行 (Pill Tabs) */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {stages.map((stg, idx) => (
              <button
                key={stg.id}
                type="button"
                onClick={() => {
                  setActiveIdx(idx);
                  setIsAutoPlay(false);
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  activeIdx === idx
                    ? "bg-white text-slate-950 shadow-md"
                    : "border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="font-mono text-[11px] opacity-80">{stg.index}</span>
                <span>{stg.tabLabel}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsAutoPlay((v) => !v)}
            className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            {isAutoPlay ? <Pause className="h-3.5 w-3.5 text-amber-400" /> : <Play className="h-3.5 w-3.5 text-amber-400" />}
            <span>{isAutoPlay ? "暂停轮播" : "自动演示"}</span>
          </button>
        </div>

        {/* 32px 大圆角旗舰展示卡片 (Showcase Card) */}
        <div className="rounded-[32px] border border-slate-800/80 bg-gradient-to-b from-[#10141d] via-[#0c1017] to-black p-6 sm:p-8 lg:p-10 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-center">
            {/* 左侧：大图与全屏放大按钮 */}
            <div className="relative group overflow-hidden rounded-[24px] border border-slate-800 bg-slate-950 shadow-2xl">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
                <img
                  src={currentStage.src}
                  alt={currentStage.title}
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.01]"
                />
              </div>

              {/* 放大镜悬浮遮罩 */}
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-white shadow-lg backdrop-blur-md transition hover:bg-slate-800 hover:scale-105 active:scale-95"
                title="点击全屏检视"
              >
                <Maximize2 className="h-4 w-4 text-amber-400" />
              </button>

              <div className="flex items-center justify-between border-t border-slate-800 bg-[#0d1118] px-4 py-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-400">{currentStage.index}</span>
                  <span className="font-semibold text-white">{currentStage.tabLabel}</span>
                </div>
                <span className="font-mono text-slate-500">1920 × 1080 Native GUI</span>
              </div>
            </div>

            {/* 右侧：详细说明与特性列表 */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-800/60 px-3 py-1 text-xs font-mono text-slate-300 mb-4">
                  <span>STAGE {currentStage.index}</span>
                  <span>·</span>
                  <span className="text-amber-400 font-semibold">{currentStage.eyebrow}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-snug">
                  {currentStage.title}
                </h3>

                <p className="text-base text-slate-300 leading-relaxed mb-6">
                  {currentStage.desc}
                </p>

                <div className="space-y-3 mb-8">
                  {currentStage.highlights.map((hl) => (
                    <div key={hl} className="flex items-start gap-2.5 text-sm text-slate-200">
                      <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 border-t border-slate-800/80 pt-6">
                <Link
                  to="/download"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-bold text-slate-950 shadow-md transition hover:bg-slate-100 active:scale-98"
                >
                  <span>立即获取 Desktop 套件</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <Link
                  to="/docs/srpcfg-3"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-6 py-3 text-xs font-bold text-slate-300 transition hover:border-amber-400/50 hover:text-white"
                >
                  <span>阅读《Desktop 使用指南》</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 缩略图横排栏 */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {stages.map((stg, idx) => (
            <button
              key={stg.id}
              type="button"
              onClick={() => {
                setActiveIdx(idx);
                setIsAutoPlay(false);
              }}
              className={`group flex flex-col gap-1.5 rounded-[18px] border p-2.5 text-left transition-all duration-200 ${
                activeIdx === idx
                  ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30"
                  : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/80"
              }`}
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[10px] bg-slate-950">
                <img
                  src={stg.src}
                  alt=""
                  className="h-full w-full object-cover object-top opacity-70 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className={activeIdx === idx ? "font-bold text-amber-400" : "text-slate-500"}>
                  {stg.index}
                </span>
                <span className={activeIdx === idx ? "font-bold text-white" : "text-slate-400"}>
                  {stg.tabLabel}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 灯箱全屏模态框 (Lightbox Modal) */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 p-4 sm:p-8 backdrop-blur-md"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-6xl w-full rounded-[28px] border border-slate-700 bg-slate-950 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 px-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-400">{currentStage.index}</span>
                <span className="text-sm font-bold text-white">{currentStage.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="rounded-full bg-slate-800 p-2 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-hidden rounded-[20px] bg-slate-950">
              <img
                src={currentStage.src}
                alt={currentStage.title}
                className="max-h-[75vh] w-full object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
