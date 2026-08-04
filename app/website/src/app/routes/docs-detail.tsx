/**
 * 文档详情页 /docs/:slug（对应原 pages/docs/[...slug].astro + DocLayout.astro，React 化）。
 * - loader 从 Velite 数据（.velite，构建期生成）按 slug 取文档，meta 随之动态生成
 * - DocsShell 提供三栏布局/移动端面板；内容为构建期渲染好的 HTML（dangerouslySetInnerHTML）
 * - 前后篇导航顺序 = 侧边栏分组顺序
 */
import { useLoaderData, Link, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@srp-cfg/ui";
import { DocsShell } from "../components/docs/DocsShell";
import { docs, orderedDocs } from "../components/docs/docs-data";

export async function loader({ params }: LoaderFunctionArgs) {
  const doc = docs.find((d) => d.slug === params.slug);
  if (!doc) throw new Response("Not Found", { status: 404 });
  return doc;
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: `${data!.title} — SrP-CFG 文档` },
  { name: "description", content: data!.description ?? `SrP-CFG 文档：${data!.title}` },
];

export default function DocsDetailPage() {
  const doc = useLoaderData<typeof loader>();
  const currentIndex = orderedDocs.findIndex((d) => d.slug === doc.slug);
  const previousDoc = currentIndex > 0 ? orderedDocs[currentIndex - 1] : null;
  const nextDoc =
    currentIndex >= 0 && currentIndex < orderedDocs.length - 1
      ? orderedDocs[currentIndex + 1]
      : null;

  return (
    <DocsShell currentSlug={doc.slug} toc={doc.toc}>
      <nav
        aria-label="面包屑"
        className="mb-7 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-text-faint"
      >
        <Link to="/docs" className="text-text-muted no-underline hover:text-accent">
          Docs
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{doc.title}</span>
      </nav>

      <header className="mb-10 border-b border-border pb-8">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
          SrP-CFG Documentation
        </p>
        <h1 className="mt-3 font-display text-[clamp(2.25rem,6vw,4rem)] font-bold leading-[1.04] tracking-[-0.025em] text-text">
          {doc.title}
        </h1>
        {doc.description && (
          <p className="mt-4 max-w-[680px] text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
            {doc.description}
          </p>
        )}
      </header>

      <div className="prose-doc" dangerouslySetInnerHTML={{ __html: doc.content }} />

      <nav
        aria-label="前后篇文档"
        className="mt-14 grid grid-cols-1 gap-3 border-t border-border pt-6 sm:grid-cols-2"
      >
        {previousDoc ? (
          <Link
            to={`/docs/${previousDoc.slug}`}
            className="group block no-underline"
          >
            <Card
              padding="none"
              className="p-4 transition-colors duration-200 group-hover:border-border-highlight group-hover:bg-bg-hover"
            >
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
                <ChevronLeft className="h-3.5 w-3.5" />
                上一篇
              </span>
              <strong className="mt-2 block font-display text-sm text-text-secondary group-hover:text-accent">
                {previousDoc.title}
              </strong>
            </Card>
          </Link>
        ) : (
          <span />
        )}
        {nextDoc && (
          <Link to={`/docs/${nextDoc.slug}`} className="group block no-underline">
            <Card
              padding="none"
              className="p-4 text-right transition-colors duration-200 group-hover:border-border-highlight group-hover:bg-bg-hover"
            >
              <span className="flex items-center justify-end gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
                下一篇
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
              <strong className="mt-2 block font-display text-sm text-text-secondary group-hover:text-accent">
                {nextDoc.title}
              </strong>
            </Card>
          </Link>
        )}
      </nav>
    </DocsShell>
  );
}
