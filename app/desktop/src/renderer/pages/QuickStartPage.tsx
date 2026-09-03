import React, { useState, useEffect } from "react";
import {
  ArrowDownToLine,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  Cpu,
  ExternalLink,
  FolderCheck,
  Github,
  Globe,
  History,
  Layers,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  User,
  UserRoundCog,
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
      subtitle: "按需获取与导入",
      desc: "一键获取 Runtime Core、地图跑图指南或视频设置预设；支持自定义 ZIP 导入与预安装清单编排。",
      icon: ArrowDownToLine,
      badge: "模块化",
      highlight: "border-orange-500/30 hover:border-orange-500",
    },
    {
      num: "02",
      page: "install" as Page,
      title: "组件安装",
      subtitle: "严格队列与安全部署",
      desc: "精准匹配待安装组件，自动规整单级父目录结构；部署前自动创建灾备快照并保护用户 custom.cfg。",
      icon: PackageCheck,
      badge: "一键部署",
      highlight: "border-blue-500/30 hover:border-blue-500",
    },
    {
      num: "03",
      page: "personalize" as Page,
      title: "配置注入",
      subtitle: "预设方案与 VCFG 提取",
      desc: "选择内置竞技模版（Default / Echo / YSZH / VisionL 等），一键提取 Steam 键位视角并支持无损撤销。",
      icon: UserRoundCog,
      badge: "个性化",
      highlight: "border-emerald-500/30 hover:border-emerald-500",
    },
    {
      num: "04",
      page: "applied" as Page,
      title: "当前安装",
      subtitle: "物理文件树与即时编辑",
      desc: "物理扫描本地 CS2 目录，可视化展开多组件文件树，内嵌 CS2 专属语法高亮编辑器与 Ctrl+S 保存。",
      icon: Layers,
      badge: "实时监控",
      highlight: "border-purple-500/30 hover:border-purple-500",
    },
    {
      num: "05",
      page: "backup" as Page,
      title: "恢复中心",
      subtitle: "灾备快照与秒级回滚",
      desc: "全量记录所有部署历史，支持自定义快照保留上限（默认 10 份），一键秒级还原历史配置状态。",
      icon: History,
      badge: "安全兜底",
      highlight: "border-amber-500/30 hover:border-amber-500",
    },
  ];

  const features = [
    {
      icon: Cpu,
      title: "架构完全解耦与特征解析",
      desc: "CFG 核心、投掷物指南与用户视频配置三权分立，智能解析 MapAnnotationNode 与 video.cfg 特征签名。",
    },
    {
      icon: ShieldCheck,
      title: "全量快照与无损回滚",
      desc: "所有关键部署均自动创建全量时间戳 ZIP 快照，支持随时秒级安全回滚与自定义快照保留策略。",
    },
    {
      icon: Code2,
      title: "CS2 专属语法高亮引擎",
      desc: "内嵌深度定制的 CodeMirror 6 高亮引擎，智能着色 ConVar、Alias、按键绑定与高频指令参数。",
    },
    {
      icon: Sparkles,
      title: "纯净规范与 VAC 安全",
      desc: "纯客户端原生指令逻辑，不修改任何游戏二进制文件，安全合规，适配天梯与各大竞技平台比赛。",
    },
  ];

  const [version, setVersion] = useState<string>("3.2.4");

  useEffect(() => {
    window.api
      ?.getVersion?.()
      .then((v) => {
        if (v) setVersion(v);
      })
      .catch(() => {});
  }, []);

  const hasSteam = Boolean(detection?.steamPath);
  const hasCs2 = Boolean(detection?.cs2CfgPath);
  const currentUser = detection?.currentUser;

  return (
    <div className="space-y-7 max-w-6xl mx-auto pb-6">
      {/* 顶部 Hero 欢迎标头 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[11px] font-semibold tracking-wide flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3" /> SrP-CFG Desktop v{version}
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition shadow-md shadow-orange-950/30 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>访问官网</span>
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => window.api.openExternal(DOCS_URL)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-card hover:bg-bg-hover text-text border border-border text-xs font-medium transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-orange-400" />
            <span>查阅文档</span>
          </button>
          <button
            type="button"
            onClick={() => window.api.openExternal(REPO_URL)}
            className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-hover border border-border bg-bg-card transition cursor-pointer"
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
              {hasSteam ? <CheckCircle2 className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
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
              {hasCs2 ? <CheckCircle2 className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
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
                {currentUser?.personaName
                  ? `${currentUser.personaName} (${currentUser.accountId})`
                  : currentUser?.accountId || "未检测到登录用户"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5 步核心工作流导览 */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span>部署工作流导览</span>
          </h2>
          <span className="text-xs text-text-muted">点击任意卡片即可快速跳转至对应功能页</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {workflowSteps.map((step) => (
            <div
              key={step.num}
              onClick={() => onNavigate?.(step.page)}
              className={`group bg-bg-card border rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 ${step.highlight}`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-bg-raised flex items-center justify-center text-orange-400 group-hover:bg-orange-500/10 transition-colors">
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-bold text-neutral-500 group-hover:text-orange-400 transition-colors">
                    {step.num}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-text group-hover:text-orange-400 transition-colors">
                      {step.title}
                    </h3>
                    <span className="px-1.5 py-0.2 text-[9px] rounded bg-neutral-800 text-neutral-400">
                      {step.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-0.5 font-medium">
                    {step.subtitle}
                  </p>
                  <p className="text-xs text-text-muted mt-1.5 leading-relaxed line-clamp-3">
                    {step.desc}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-text-muted group-hover:text-orange-400 font-medium transition-colors">
                <span>立即前往</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
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
            提示：首次使用推荐先前往「组件下载」添加所需的配置包，再进入「组件安装」一键部署到 CS2 目录。
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onNavigate?.("download")}
            className="px-3 py-1.5 rounded-lg bg-bg-card hover:bg-bg-hover text-text border border-border transition text-xs font-medium cursor-pointer"
          >
            组件下载
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.("install")}
            className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition text-xs font-semibold cursor-pointer shadow-md shadow-orange-950/40"
          >
            开始安装 →
          </button>
        </div>
      </div>
    </div>
  );
}
