import React from "react";
import {
  ArrowDownToLine,
  PackageCheck,
  UserRoundCog,
  Layers,
  BookOpen,
  ExternalLink,
  Globe,
  Sparkles,
  ShieldCheck,
  Code2,
  Cpu,
  ChevronRight,
  FolderCheck,
  User,
  CheckCircle2,
  AlertTriangle,
  Github,
} from "lucide-react";
import { WEBSITE_URL, REPO_URL, DOCS_URL } from "../lib/downloads";
import { PageHeader } from "@srp-cfg/ui";
import type { DetectionResult } from "../types";
import type { Page } from "../App";

interface Props {
  detection?: DetectionResult | null;
  onNavigate?: (page: Page) => void;
}

export default function QuickStartPage({ detection, onNavigate }: Props) {
  const workflowSteps = [
    {
      num: "01",
      page: "download" as Page,
      title: "组件下载",
      subtitle: "按需获取配置包",
      desc: "一键获取 Runtime Core (核心运行时)、地图跑图指南 (Annotations) 或推荐视频画质预设。",
      icon: ArrowDownToLine,
      badge: "模块化",
      highlight: "border-orange-500/30 hover:border-orange-500",
    },
    {
      num: "02",
      page: "install" as Page,
      title: "组件安装",
      subtitle: "智能路径与安全部署",
      desc: "自动识别 Steam 与 CS2 路径，自定义组件勾选，安装前自动生成快照备份。",
      icon: PackageCheck,
      badge: "一键部署",
      highlight: "border-blue-500/30 hover:border-blue-500",
    },
    {
      num: "03",
      page: "personalize" as Page,
      title: "配置注入",
      subtitle: "预设方案与自定义 custom.cfg",
      desc: "选择内置竞技方案 (Default / Echo / YSZH / VisionL / Valve)，使用专属语法高亮编辑器自由定制。",
      icon: UserRoundCog,
      badge: "个性化",
      highlight: "border-emerald-500/30 hover:border-emerald-500",
    },
    {
      num: "04",
      page: "applied" as Page,
      title: "当前安装",
      subtitle: "物理文件树与即时编辑",
      desc: "实时扫描磁盘物理目录，可视化多组件文件树，支持就地在线修改与即时保存 (Ctrl+S)。",
      icon: Layers,
      badge: "实时监控",
      highlight: "border-purple-500/30 hover:border-purple-500",
    },
  ];

  const features = [
    {
      icon: Cpu,
      title: "架构完全解耦",
      desc: "CFG 核心、投掷物指南与用户视频配置三权分立，告别过去粗暴的全量覆盖。",
    },
    {
      icon: ShieldCheck,
      title: "全量快照与无损回滚",
      desc: "所有关键安装均自动创建全量时间戳 ZIP 快照，支持随时秒级安全回滚。",
    },
    {
      icon: Code2,
      title: "CS2 专属语法高亮",
      desc: "内嵌定制 CodeMirror 6 高亮引擎，智能高亮 ConVar、Alias 与高频指令参数。",
    },
    {
      icon: Sparkles,
      title: "纯净规范与 VAC 安全",
      desc: "纯客户端原生指令逻辑，不修改任何游戏二进制文件，安全合规，比赛适用。",
    },
  ];

  const hasSteam = Boolean(detection?.steamPath);
  const hasCs2 = Boolean(detection?.cs2CfgPath);
  const currentUser = detection?.currentUser;

  return (
    <div className="space-y-7 max-w-6xl mx-auto pb-6">
      {/* 顶部 Hero 欢迎标头 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[11px] font-semibold tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> SrP-CFG Desktop v3
            </span>
          </div>
          <PageHeader
            title="欢迎使用 SrP-CFG 智能桌面中心"
            description="模块化 CS2 配置运行时、全量快照备份管理与可视化物理文件编辑平台。"
          />
        </div>

        {/* 快捷跳转官方站点 */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => window.api.openExternal(WEBSITE_URL)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition shadow-md shadow-orange-950/30"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>访问官网</span>
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => window.api.openExternal(DOCS_URL)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-card hover:bg-bg-hover text-text border border-border text-xs font-medium transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-orange-400" />
            <span>查阅文档</span>
          </button>
          <button
            type="button"
            onClick={() => window.api.openExternal(REPO_URL)}
            className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-hover border border-border bg-bg-card transition"
            title="GitHub 仓库"
          >
            <Github className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 状态看板卡片 (Environment Status) */}
      <div className="bg-bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2 text-xs font-semibold text-text">
            <FolderCheck className="w-4 h-4 text-orange-400" />
            <span>本地环境检测概况</span>
          </div>
          <span className="text-[11px] text-text-faint">
            {detection ? "检测已就绪" : "正在扫描环境..."}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Steam 根目录 */}
          <div className="p-3 bg-bg-raised/60 rounded-lg border border-border/80 flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                hasSteam
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}
            >
              {hasSteam ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="text-text-muted text-[11px]">Steam 安装目录</div>
              <div className="text-text font-medium font-mono truncate" title={detection?.steamPath || ""}>
                {detection?.steamPath ? "已检测到安装" : "未检测到 Steam"}
              </div>
            </div>
          </div>

          {/* CS2 游戏目录 */}
          <div className="p-3 bg-bg-raised/60 rounded-lg border border-border/80 flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                hasCs2
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}
            >
              {hasCs2 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="text-text-muted text-[11px]">CS2 CFG 运行时</div>
              <div className="text-text font-medium font-mono truncate" title={detection?.cs2CfgPath || ""}>
                {detection?.cs2CfgPath ? "已就绪" : "未检测到 CS2"}
              </div>
            </div>
          </div>

          {/* Steam 当前账号 */}
          <div className="p-3 bg-bg-raised/60 rounded-lg border border-border/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-text-muted text-[11px]">当前登录账号</div>
              <div className="text-text font-medium font-mono truncate">
                {currentUser?.personaName || currentUser?.accountId || "未检测到登录用户"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 步核心工作流导览 */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span>部署工作流导览</span>
          </h2>
          <span className="text-xs text-text-muted">点击任意卡片即可快速跳转至对应功能页</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowSteps.map((step) => (
            <div
              key={step.num}
              onClick={() => onNavigate?.(step.page)}
              className={`group bg-bg-card border rounded-xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 ${step.highlight}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-bg-raised flex items-center justify-center text-orange-400 group-hover:bg-orange-500/10 transition-colors">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-neutral-500 group-hover:text-orange-400 transition-colors">
                    {step.num}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-text group-hover:text-orange-400 transition-colors">
                      {step.title}
                    </h3>
                    <span className="px-1.5 py-0.2 text-[10px] rounded bg-neutral-800 text-neutral-400">
                      {step.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-0.5 font-medium">
                    {step.subtitle}
                  </p>
                  <p className="text-xs text-text-muted mt-2 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-border/50 flex items-center justify-between text-xs text-text-muted group-hover:text-orange-400 font-medium transition-colors">
                <span>立即前往</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 核心特性与架构亮点 */}
      <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-text flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span>SrP-CFG v3 核心架构亮点</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-bg-raised/40 rounded-lg border border-border/60">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                <f.icon className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-text">{f.title}</h4>
                <p className="text-xs text-text-muted leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部使用提示与安全说明 */}
      <div className="p-4 bg-bg-raised/30 border border-border/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            提示：在个人配置注入或物理文件浏览中，可随时使用快捷键 <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-200 border border-neutral-700 rounded font-mono text-[10px]">Ctrl + S</kbd> 快速保存。
          </span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate?.("install")}
          className="text-orange-400 hover:text-orange-300 font-medium whitespace-nowrap"
        >
          开始快速部署 →
        </button>
      </div>
    </div>
  );
}
