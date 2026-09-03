/**
 * Features —— 三大解耦套件、四层架构透明边界与为什么选择 SrP-CFG。
 * 遵循 Meta Design System：
 * - 32px 大圆角解耦套件展示卡片 (Decoupled Packages Showcase)
 * - 4 层架构透明分层蓝图 (Four-Layer Architectural Blueprint)
 * - 4 项硬件级安全与体验保障 (Why SrP-CFG Reassurance Grid)
 */
import React, { useState } from "react";
import {
  Blocks,
  SlidersHorizontal,
  UserRoundCog,
  CloudCog,
  Check,
  Copy,
  FileCode,
  ShieldCheck,
  Zap,
  MapPin,
  Monitor,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  Terminal,
  RefreshCcw,
} from "lucide-react";
import { Link } from "react-router";

// 三大独立解耦套件
const decoupledPackages = [
  {
    id: "runtime_core",
    name: "Runtime Core 核心运行时",
    tag: "核心底座 · 必选",
    badgeColor: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    targetDir: "game/csgo/cfg/",
    desc: "纯正 alias 指令引擎、Features 增强与会话模式底层。永久只读注册，提供零污染的游戏机制底座。",
    specs: [
      "autoexec.cfg 极简引导入口",
      "准星/视角/练枪/回放等全套 alias",
      "分层覆盖机制，不影响原生按键",
      "包含 RoL1n / Echo / CS2 默认等模版",
    ],
    actionText: "查阅运行时文档",
    actionLink: "/docs/srpcfg-1",
  },
  {
    id: "map_guides",
    name: "Map Guides 道具标点套件",
    tag: "官方原生 · 按需安装",
    badgeColor: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    targetDir: "game/csgo/annotations/",
    desc: "全地图烟闪火跑图标点，基于 CS2 原生 MapAnnotationNode KV3 结构标准，无需任何第三方插件或脚本。",
    specs: [
      "Mirage / Inferno / Dust2 / Ancient 等主流图",
      "游戏内雷达定位与准星对齐标点",
      "独立单级文件夹，随官方更新无缝解耦",
      "可与社区自制标点无缝并存",
    ],
    actionText: "查看标点生态",
    actionLink: "/docs/srpcfg-3",
  },
  {
    id: "video_settings",
    name: "Video Settings 竞技画质套件",
    tag: "性能调优 · 即装即用",
    badgeColor: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    targetDir: "game/csgo/cfg/",
    desc: "针对高刷新率与竞技场景深度调校的 cs2_video 视频参数预设，压榨极限高帧率与低输入延迟。",
    specs: [
      "职业级阴影、光照与模型渲染平衡",
      "针对 144Hz / 240Hz+ 竞技高刷调校",
      "部署时自动备份旧 cs2_video.txt",
      "完全独立按需分发",
    ],
    actionText: "了解画质优化",
    actionLink: "/docs/srpcfg-3",
  },
];

// 四层架构模型
const layers = [
  {
    index: "A",
    icon: Blocks,
    title: "Runtime Core 运行时",
    owner: "SrP 项目所有",
    authority: "永久只读 (只注册 alias)",
    file: "game/csgo/cfg/runtime/init.cfg",
    desc: "永久注册 alias、Feature、Mode 与帮助入口，纯正运行时机制，轻量零污染。",
    snippet: `// Layer A: Runtime Core\nalias +crosshair_max "cl_crosshairsize 1000"\nalias -crosshair_max "cl_crosshairsize 2"\nalias practice "exec srp-cfg/modes/practice.cfg"`,
  },
  {
    index: "B",
    icon: SlidersHorizontal,
    title: "Preset 模版案例",
    owner: "社区与项目精选",
    authority: "可选起点 (建议作为参考)",
    file: "game/csgo/cfg/srp-cfg/presets/*.cfg",
    desc: "RoL1n 自用、Echo、YSZH、VisionL 是可审查的模版起点，亦可一键回退 CS2 默认基线。",
    snippet: `// Layer B: Preset Example (RoL1n)\nbind "MOUSE4" "+voicerecord"\nbind "MWHEELDOWN" "+jump"\nsensitivity "1.15"`,
  },
  {
    index: "C",
    icon: UserRoundCog,
    title: "User 个人层",
    owner: "当前玩家独占",
    authority: "终极唯一覆盖 (更新时绝对保护)",
    file: "game/csgo/cfg/user/custom.cfg",
    desc: "custom.cfg 是唯一个人窗口；支持 VCFG 偏好智能提取，终极覆盖并在更新时绝对受保护。",
    snippet: `// Layer C: User Override\n// [VCFG Injected] sensitivity 1.25\nbind "SPACE" "+jump"\nexec srp-cfg/presets/preset_rol1n.cfg`,
  },
  {
    index: "D",
    icon: CloudCog,
    title: "VCFG / Cloud 云端",
    owner: "CS2 引擎原生",
    authority: "Steam 云端序列化",
    file: "userdata/<id>/730/local/cfg/*.vcfg",
    desc: "游戏继续序列化最终绑定与 ConVar；桌面端只读解析 Valve 差异，不暗中破坏云存档。",
    snippet: `"config"\n{\n  "bindings"\n  {\n    "w" "+forward"\n    "space" "+jump"\n  }\n}`,
  },
];

// Why SrP-CFG (Meta Reassurance Grid)
const whySrPCfg = [
  {
    icon: ShieldCheck,
    title: "零注入 · 100% VAC 安全",
    desc: "纯原生机制。所有指令完全基于 CS2 原生 +exec 与 VCFG 标准加载，绝无任何 DLL 注入或内存篡改，完美通过官方 VAC 检验。",
  },
  {
    icon: CloudCog,
    title: "Steam 云同步双轨共存",
    desc: "尊重原生。绝不暗中修改或破坏 Steam 云端 cs2_user_keys.vcfg，桌面端只读提取偏好，彻底告别按键冲突与云端覆盖烦恼。",
  },
  {
    icon: RefreshCcw,
    title: "全物理路径审计与秒级快照",
    desc: "安全托底。部署前全量对比扫描真实游戏目录 Diff 差异；每次安装自动创建时间戳完整快照，支持 10 级历史一键安全回滚。",
  },
  {
    icon: Terminal,
    title: "一体化 CodeMirror 6 编辑器",
    desc: "专为 CS2 定制。内置 ConVar 与 Action 语法智能高亮，开箱即用编辑 custom.cfg，让个性化参数定制得心应手。",
  },
];

export function Features() {
  const [activeLayer, setActiveLayer] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative overflow-hidden py-20 md:py-28 lg:py-32 border-b border-slate-800/80">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* ================= SECTION 1: 三大独立解耦套件 (3-Up Cards) ================= */}
        <div>
          <div className="mx-auto max-w-3xl text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-1.5 text-xs font-semibold text-amber-400 mb-4">
              <Layers className="h-3.5 w-3.5" />
              <span>DECOUPLED MODULAR PACKAGES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              三大解耦套件，随需取用。
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
              彻底告别臃肿捆绑包。Runtime 运行时、Map Guides 道具标点与 Video Settings 画质组件独立打包分发。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {decoupledPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="group relative flex flex-col justify-between rounded-[32px] border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-slate-950 p-8 shadow-xl transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/80"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${pkg.badgeColor}`}>
                      {pkg.tag}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-full">
                      {pkg.targetDir}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-400 transition-colors">
                    {pkg.name}
                  </h3>

                  <p className="text-sm text-slate-300 leading-relaxed mb-6">
                    {pkg.desc}
                  </p>

                  <div className="space-y-2 border-t border-slate-800/80 pt-5 mb-8">
                    {pkg.specs.map((spec) => (
                      <div key={spec} className="flex items-start gap-2 text-xs text-slate-300">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  to={pkg.actionLink}
                  className="inline-flex items-center justify-between rounded-full border border-slate-700 bg-slate-800/50 px-5 py-3 text-xs font-bold text-white transition-all hover:border-slate-500 hover:bg-slate-800 active:scale-98"
                >
                  <span>{pkg.actionText}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* ================= SECTION 2: 四层架构透明分层蓝图 ================= */}
        <div className="mt-28 lg:mt-36">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-1.5 text-xs font-semibold text-sky-400 mb-4">
              <Blocks className="h-3.5 w-3.5" />
              <span>LAYERED ARCHITECTURE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              分层架构设计，职责严格隔离。
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
              把“运行时机制”、“模版预设”、“个人配置”与“云端持久状态”彻底解耦。每一层边界清晰、各司其职，保证配置稳定且易于维护。
            </p>
          </div>

          {/* 4 层卡片选择器 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {layers.map((l, idx) => {
              const Icon = l.icon;
              const isActive = activeLayer === idx;
              return (
                <button
                  key={l.index}
                  type="button"
                  onClick={() => setActiveLayer(idx)}
                  className={`text-left rounded-[24px] p-6 transition-all duration-200 border ${
                    isActive
                      ? "border-amber-500/60 bg-gradient-to-b from-amber-500/15 to-slate-900/80 ring-1 ring-amber-500/30 shadow-lg"
                      : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-amber-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-sm font-bold text-slate-500">
                      LAYER {l.index}
                    </span>
                  </div>

                  <div className="text-base font-bold text-white mb-1">{l.title}</div>
                  <div className="text-xs font-medium text-amber-400/90 mb-2">{l.owner}</div>
                  <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{l.desc}</div>
                </button>
              );
            })}
          </div>

          {/* 选中图层的详细交互抽屉 */}
          <div className="rounded-[28px] border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-slate-950">
                    {layers[activeLayer].index}
                  </span>
                  <span className="text-lg font-bold text-white">{layers[activeLayer].title}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                  <span>路径: <code className="text-slate-200">{layers[activeLayer].file}</code></span>
                  <span>·</span>
                  <span className="text-amber-400/90">{layers[activeLayer].authority}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(layers[activeLayer].snippet)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "已复制" : "复制代码片段"}</span>
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-black/60 p-4 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre><code>{layers[activeLayer].snippet}</code></pre>
            </div>
          </div>
        </div>

        {/* ================= SECTION 3: 为什么选择 SrP-CFG (Reassurance Grid) ================= */}
        <div className="mt-28 lg:mt-36">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-1.5 text-xs font-semibold text-emerald-400 mb-4">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>CONFIDENCE & SECURITY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              为什么选择 SrP-CFG？
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
              为竞技竞技玩家与重度定制者量身打造的硬核底层保障。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {whySrPCfg.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[28px] border border-slate-800 bg-gradient-to-b from-slate-900/70 to-slate-950 p-8 shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-6">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
