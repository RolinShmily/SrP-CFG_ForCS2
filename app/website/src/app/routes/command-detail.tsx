/**
 * 指令详情静态页 /commands/:name（L3.4 可选增量）。
 *
 * 全部 2785 条指令由构建期 SSG 预渲染为独立 HTML（见 react-router.config.ts prerender），
 * 每条页面含指令名/类型/分类/默认值/数值说明，并输出 DefinedTerm JSON-LD
 * （指令数据集语义，供搜索引擎把每条指令识别为独立定义项）。
 * 未命中（手工访问错误 URL）时回退到提示页 + 返回链接。
 */
import type { MetaFunction } from "react-router";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  Command as CommandIcon,
  FileText,
  Hash,
} from "lucide-react";
import { Badge, Card, CopyButton } from "@srp-cfg/ui";
import {
  categories,
  commands,
  type CommandRecord,
} from "../components/commands/commands-data";
import { ValueDetails } from "../components/commands/CommandCard";

function categoryLabel(categoryId: string): string | undefined {
  return categories.find((cat) => cat.id === categoryId)?.label;
}

export const meta: MetaFunction = ({ params }) => {
  const cmd = commands.find((c) => c.n === params.name);
  if (!cmd) return [{ title: "指令不存在 — SrP-CFG" }];
  const summary = cmd.cn || cmd.en || "";
  const suffix =
    cmd.t === "var" && cmd.d !== undefined && cmd.d !== ""
      ? `，默认值 ${cmd.d}`
      : "";
  return [
    { title: `${cmd.n} — CS2 控制台指令 | SrP-CFG` },
    {
      name: "description",
      content: `${summary}${suffix}。CS2 官方指令中英释义、分类与数值说明。`,
    },
    { name: "robots", content: "index,follow" },
  ];
};

function TypeBadge({ cmd }: { cmd: CommandRecord }) {
  if (cmd.t === "var") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-accent/25 bg-accent-bg px-2.5 py-1 font-mono text-xs text-accent">
        <Hash className="h-3.5 w-3.5" />
        变量 Variable
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-teal/25 bg-teal/5 px-2.5 py-1 font-mono text-xs text-teal">
      <CommandIcon className="h-3.5 w-3.5" />
      命令 Command
    </span>
  );
}

export default function CommandDetailPage() {
  const params = useParams();
  const cmd = commands.find((c) => c.n === params.name);

  if (!cmd) {
    return (
      <section className="pb-16 pt-28 sm:pb-20 sm:pt-32">
        <div className="mx-auto max-w-3xl px-5 sm:px-7">
          <Card className="py-10 text-center">
            <p className="font-display text-lg font-semibold text-text">
              未找到指令 “{params.name}”
            </p>
            <p className="mt-2 text-sm text-text-muted">
              该指令可能不在当前数据库中，返回指令中心继续检索。
            </p>
            <Link
              to="/commands"
              className="mt-6 inline-flex items-center gap-2 rounded-[8px] border border-border bg-bg-card px-4 py-2 font-display text-sm font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
            >
              <ArrowLeft className="h-4 w-4" />
              返回指令中心
            </Link>
          </Card>
        </div>
      </section>
    );
  }

  const flags = (cmd.f || []).filter(
    (flag) => !["clientdll", "gamedll", "release"].includes(flag),
  );
  const catLabel = categoryLabel(cmd.c);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: cmd.n,
    termCode: cmd.n,
    description: cmd.cn || cmd.en || `${cmd.n} CS2 控制台指令`,
    ...(cmd.en ? { alternateName: cmd.en } : {}),
    ...(catLabel ? { category: catLabel } : {}),
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "CS2 控制台指令数据库",
      url: "https://srprolin.top/commands",
    },
  };

  return (
    <section className="pb-16 pt-28 sm:pb-20 sm:pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-5 sm:px-7">
        {/* 面包屑 */}
        <nav
          aria-label="面包屑"
          className="mb-6 flex items-center gap-1.5 font-mono text-xs text-text-faint"
        >
          <Link
            to="/commands"
            className="transition-colors hover:text-accent"
          >
            指令中心
          </Link>
          <span className="text-text-faint">/</span>
          <span className="break-all text-text-secondary">{cmd.n}</span>
        </nav>

        {/* 标题区 */}
        <Card className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2.5">
                <TypeBadge cmd={cmd} />
                {catLabel && (
                  <Badge variant="accent" size="md">
                    {catLabel}
                  </Badge>
                )}
                {flags.map((flag) => (
                  <Badge
                    key={flag}
                    variant={flag === "cheat" ? "red" : flag === "archive" ? "teal" : "default"}
                    outline
                  >
                    {flag}
                  </Badge>
                ))}
              </div>
              <h1 className="break-all font-mono text-3xl font-bold leading-10 text-text">
                {cmd.n}
              </h1>
              {cmd.t === "var" && (
                <p className="mt-2 font-mono text-sm text-text-muted">
                  默认值：
                  <span className="font-bold text-accent-light">
                    {cmd.d !== undefined && cmd.d !== "" ? cmd.d : "无"}
                  </span>
                </p>
              )}
            </div>
            <CopyButton text={cmd.n} defaultLabel="复制指令" className="shrink-0" />
          </div>

          <div className="mt-5 space-y-4 border-t border-border/50 pt-5">
            <p className="break-words font-body text-base leading-7 text-text">
              {cmd.cn || "暂无详细中文释义"}
            </p>
            {cmd.en ? (
              <p className="break-words font-body text-sm italic leading-6 text-text-muted">
                {cmd.en}
              </p>
            ) : null}
          </div>
        </Card>

        {/* 数值说明 */}
        {cmd.value ? (
          <Card className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-text-secondary">
              <FileText className="h-4 w-4 text-accent" />
              数值说明
            </h2>
            <ValueDetails value={cmd.value} />
          </Card>
        ) : null}

        {/* 使用提示 */}
        <Card className="flex items-start gap-3">
          <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-text-faint" />
          <div className="space-y-2 text-sm leading-6 text-text-muted">
            <p>
              在游戏内打开控制台（默认 <code className="rounded bg-bg-raised px-1.5 py-0.5 font-mono text-xs text-text-secondary">~</code>），
              输入以上指令后回车即可生效；变量值可在游戏中实时修改。
            </p>
            <p>
              更多指令请访问{" "}
              <Link to="/commands" className="text-accent hover:underline">
                指令检索中心
              </Link>
              ，支持中/英文与拼音检索。
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
