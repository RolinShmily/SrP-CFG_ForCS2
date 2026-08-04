/**
 * 指令检索中心 /commands（对应旧 src/pages/commands.astro，React 化）。
 *
 * L3.4 SEO：commands.json（2785 条）随路由模块打包（gzip ~169KB），
 * 首屏 50 张卡片由 SSG 构建期直接渲染进 HTML（指令名/中文释义/分类/默认值对爬虫可见）；
 * 检索/筛选/无限滚动为客户端交互（数据已在 bundle 内，无需运行时 fetch）。
 *
 * 共享组件消费：SectionHeader / Card（CommandCard 内）/ Badge（flags）/ CopyButton（复制）。
 */
import type { MetaFunction } from "react-router";
import {
  BookOpen,
  Gamepad2,
  Layers,
  MousePointer,
  Network,
  Search,
  ShieldAlert,
  Sliders,
  Terminal,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SectionHeader } from "@srp-cfg/ui";
import { AiPanel } from "../components/commands/AiPanel";
import { CommandCard } from "../components/commands/CommandCard";
import {
  categories,
  commands,
  filterCommands,
  INITIAL_PAGE_SIZE,
  type CommandCategory,
} from "../components/commands/commands-data";

export const meta: MetaFunction = () => [
  { title: "指令中心 — SrP-CFG" },
  {
    name: "description",
    content:
      "CS2 官方控制台指令与变量中文翻译数据库，支持检索和分类筛选，内置 AI 助理。",
  },
];

const categoryIcons: Record<string, typeof Search> = {
  all: Layers,
  network: Network,
  graphics: Sliders,
  audio: Volume2,
  mouse: MousePointer,
  gameplay: Gamepad2,
  cheats: ShieldAlert,
  practice: BookOpen,
  system: Terminal,
};

type TypeFilter = "all" | "cmd" | "var";

const PAGE_STEP = 50;

export default function CommandsPage() {
  const [category, setCategory] = useState("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [excludeCheats, setExcludeCheats] = useState(false);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);
  const [aiOpen, setAiOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => filterCommands(commands, { category, type, excludeCheats, query }),
    [category, type, excludeCheats, query],
  );
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // 无限滚动：sentinel 进入视口即追加一页
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore) {
            setVisibleCount((count) => count + PAGE_STEP);
          }
        });
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore]);

  const resetPage = () => setVisibleCount(INITIAL_PAGE_SIZE);

  return (
    <section className="pb-16 pt-28 sm:pb-20 sm:pt-32">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-7">
        <SectionHeader
          level="h1"
          label="Commands"
          title="指令中心"
          description="收录 CS2 官方控制台指令与变量，支持中文/英文/拼音检索，并展示中文释义、默认值、引擎 Min/Max 约束与明确的离散取值。"
        />

        <div className="mt-12 flex flex-col items-start gap-6 xl:flex-row">
          {/* 左侧：指令检索区 */}
          <div className="min-w-0 w-full flex-1">
            <div className="flex flex-col items-start gap-8 lg:flex-row">
              {/* 侧边栏类别选择 */}
              <aside className="z-10 w-full flex-shrink-0 lg:sticky lg:top-24 lg:w-56">
                <h2 className="mb-4 hidden font-display text-sm font-semibold uppercase tracking-wider text-text-muted lg:block">
                  指令分类
                </h2>
                <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-border pb-3 lg:max-w-none lg:flex-col lg:overflow-x-visible lg:border-b-0 lg:pb-0">
                  {categories.map((cat: CommandCategory) => {
                    const Icon = categoryIcons[cat.id] ?? Layers;
                    const active = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setCategory(cat.id);
                          resetPage();
                        }}
                        className={[
                          "flex cursor-pointer items-center gap-3 rounded-[8px] border border-border bg-bg-card px-4 py-2.5 font-display text-sm font-medium whitespace-nowrap text-text-secondary transition-all hover:bg-bg-hover hover:text-text active:scale-[0.98]",
                          active
                            ? "border-accent/40 bg-accent-bg text-accent"
                            : "",
                        ].join(" ")}
                      >
                        <Icon className="h-4 w-4" />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </aside>

              {/* 主内容：检索器与列表 */}
              <div className="min-w-0 w-full flex-1">
                {/* 顶部搜索工具栏 */}
                <div className="mb-6 flex flex-col justify-between gap-4 rounded-[12px] border border-border bg-bg-card p-4 md:flex-row md:items-center md:items-stretch">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        resetPage();
                      }}
                      placeholder="搜索指令名称、描述或中文翻译... (支持拼音)"
                      className="w-full rounded-[8px] border border-border bg-bg py-2.5 pl-10 pr-4 font-body text-sm text-text outline-none transition-colors placeholder:text-text-faint focus:border-accent"
                    />
                  </div>

                  <div className="flex flex-shrink-0 gap-1 rounded-[8px] border border-border bg-bg p-1">
                    {(
                      [
                        { id: "all", label: "全部" },
                        { id: "cmd", label: "命令 (Cmd)" },
                        { id: "var", label: "变量 (Var)" },
                      ] as { id: TypeFilter; label: string }[]
                    ).map((item) => {
                      const active = type === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setType(item.id);
                            resetPage();
                          }}
                          className={[
                            "cursor-pointer rounded-[6px] px-3.5 py-1.5 font-display text-xs font-semibold transition-all",
                            active
                              ? "bg-bg-raised text-accent"
                              : "text-text-muted hover:text-text",
                          ].join(" ")}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      checked={excludeCheats}
                      onChange={(e) => {
                        setExcludeCheats(e.target.checked);
                        resetPage();
                      }}
                      className="h-4 w-4 rounded border-border bg-bg text-accent focus:ring-accent"
                    />
                    <span>排除作弊指令</span>
                  </label>
                </div>

                <div className="mb-6 flex flex-col gap-1.5 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
                  <span>共筛选出 {filtered.length} 条指令</span>
                  <span className="text-xs text-text-faint sm:text-right">
                    变量卡片可展开“数值说明”；引擎约束与描述中的有效范围会分别标注。
                  </span>
                </div>

                {visible.length === 0 ? (
                  <div className="py-16 text-center text-text-muted">
                    <p className="mb-2">未找到匹配的指令</p>
                    <p className="text-xs text-text-faint">请尝试更换检索关键词或更改筛选类别</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {visible.map((cmd) => (
                      <CommandCard key={cmd.n} cmd={cmd} />
                    ))}
                  </div>
                )}

                <div ref={sentinelRef} className="mt-8 h-10" />
                <div className="mt-4 flex justify-center">
                  {hasMore && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount((count) => count + PAGE_STEP)}
                      className="rounded-[8px] border border-border bg-bg-card px-6 py-2.5 font-display text-sm font-medium text-text-secondary transition-all hover:border-border-highlight hover:bg-bg-hover"
                    >
                      加载更多指令
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：AI 助理面板（xl 常驻，小屏为抽屉 + 悬浮按钮） */}
          <AiPanel open={aiOpen} onToggle={setAiOpen} />
        </div>
      </div>
    </section>
  );
}
