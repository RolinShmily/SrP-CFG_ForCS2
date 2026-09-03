/**
 * Steps —— 确定性四步落地流程 (Meta Design Language 风格)。
 * - 28px 大圆角步骤卡片 (Rounded Cards)
 * - 严密的三层信息排版结构
 * - 清晰的物理文件与权限交付物
 */
import React, { useState } from "react";
import {
  Download,
  PackageCheck,
  UserRoundCog,
  Gamepad2,
  ArrowRight,
  CheckCircle2,
  Workflow,
  Sparkles,
} from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Download,
    title: "获取与导入",
    tag: "STAGE 01 · INGEST",
    command: "SrP-CFG_Runtime_Core.zip",
    desc: "在 Desktop 应用内通过双通道高速获取解耦组件，或直接拖入任意自定义 ZIP / CFG 配置包。",
    details: [
      "官方直连 / 国内高速镜像极速下载",
      "智能沙盒分类解压至 staging 暂存区",
      "自动规整地图标点单层目录结构",
    ],
  },
  {
    num: "02",
    icon: PackageCheck,
    title: "差异审计与部署",
    tag: "STAGE 02 · DIFF & DEPLOY",
    command: "game/csgo/cfg/",
    desc: "自动识别游戏与账号路径，先审阅文件新增/覆盖差异，独立勾选组件并享受全量快照保护。",
    details: [
      "智能侦测 cs2.exe 运行状态防冲突",
      "三态文件差异清单 (新增/覆盖/保护)",
      "秒级创建全量 ZIP 灾备快照归档",
    ],
  },
  {
    num: "03",
    icon: UserRoundCog,
    title: "配置注入与覆盖",
    tag: "STAGE 03 · INJECT & CUSTOMIZE",
    command: "user/custom.cfg",
    desc: "一键切换模版起点，智能提取当前 Steam 账号 VCFG 偏好，在专业 CS2 编辑器中定制最终覆盖。",
    details: [
      "主流职业/社区 Preset 模版自由切换",
      "只读提取 Valve VCFG 键位与灵敏度",
      "Maple Mono + CS2 语法高亮实时编辑",
    ],
  },
  {
    num: "04",
    icon: Gamepad2,
    title: "物理审计与回滚",
    tag: "STAGE 04 · AUDIT & ROLLBACK",
    command: "Multi-root & Rollback",
    desc: "多根目录物理文件树实时扫描查看，随心就地保存；历史版本支持带时间戳一键无损回流。",
    details: [
      "游戏 CFG、标点集、画质模版聚合展示",
      "单滚动条平滑阅读多根目录结构",
      "一键安全回退到任意历史部署节点",
    ],
  },
];

export function Steps() {
  const [activeStep, setActiveStep] = useState<number>(0);

  return (
    <section className="relative overflow-hidden py-20 md:py-28 lg:py-32 border-b border-slate-800/80">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* 区域标题 */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-1.5 text-xs font-semibold text-amber-400 mb-4">
            <Workflow className="h-3.5 w-3.5" />
            <span>DETERMINISTIC WORKFLOW</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            四步流程，确定性落地。
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            自动化不等于黑盒隐藏。让下载、审计、覆盖与恢复都有可检查的物理文件与清晰日志。
          </p>
        </div>

        {/* 4 步网格卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;
            return (
              <div
                key={step.num}
                onClick={() => setActiveStep(idx)}
                className={`cursor-pointer rounded-[28px] border p-7 transition-all duration-300 flex flex-col justify-between ${
                  isSelected
                    ? "border-amber-500/60 bg-gradient-to-b from-amber-500/10 to-slate-900/90 shadow-xl ring-1 ring-amber-500/20"
                    : "border-slate-800 bg-gradient-to-b from-slate-900/70 to-slate-950 hover:border-slate-700 hover:bg-slate-900/80"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-amber-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-2xl font-bold text-slate-600">
                      {step.num}
                    </span>
                  </div>

                  <div className="text-xs font-mono font-bold text-amber-400 mb-1">
                    {step.tag}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-6">
                    {step.desc}
                  </p>
                </div>

                <div className="space-y-2 border-t border-slate-800/80 pt-4">
                  {step.details.map((detail) => (
                    <div key={detail} className="flex items-start gap-2 text-xs text-slate-400">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
