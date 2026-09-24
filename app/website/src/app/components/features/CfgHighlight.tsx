/**
 * CfgHighlight —— 导出片段的只读高亮块。
 *
 * 着色用的是 desktop 编辑器那一套：同一份词法规则（@srp-cfg/ui 的 cfg-lang）
 * 加同一份 oneDark 色板。区别只是这里不可编辑，省掉 CodeMirror 的体积。
 *
 * 按行渲染并带行号，是为了观感上与 desktop 的编辑器一致；行内 token 用 white-space: pre
 * 保留原样空格，所以复制出去的内容与展示的完全一致。
 */
import { CFG_BG, CFG_FG, CFG_GUTTER_FG, CFG_TOKEN_COLOR, tokenizeCfgLine } from "@srp-cfg/ui";

interface CfgHighlightProps {
  code: string;
  maxHeight?: number;
}

export function CfgHighlight({ code, maxHeight = 320 }: CfgHighlightProps) {
  const lines = code.split("\n");

  return (
    <div
      className="overflow-auto rounded-[6px] border border-border"
      style={{ background: CFG_BG, maxHeight }}
    >
      <div className="w-max min-w-full py-2 font-mono text-[11px] leading-5">
        {lines.map((line, i) => (
          <div key={i} className="flex">
            <span
              className="shrink-0 select-none pr-3 text-right tabular-nums"
              style={{ color: CFG_GUTTER_FG, minWidth: 46 }}
            >
              {i + 1}
            </span>
            <span className="whitespace-pre pr-4" style={{ color: CFG_FG }}>
              {tokenizeCfgLine(line).map((tok, j) => (
                <span key={j} style={tok.type ? { color: CFG_TOKEN_COLOR[tok.type] } : undefined}>
                  {tok.text}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
