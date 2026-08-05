/**
 * AiPanel —— AI 配置助理（对应旧 commands.astro 的 AI 面板 + script，React 化）。
 * - Turnstile：显式渲染（execution:execute / interaction-only / theme:dark / zh-CN），
 *   发消息前 execute 取 token；错误码映射与旧实现一致
 * - /api/chat SSE：readAiEventStream（src/lib/ai-stream.ts 保留不动），
 *   IncompleteAiStreamError 自动重试一次，TruncatedAiResponseError 给出引导
 * - 欢迎语/快捷提问按数据库（srpcfg/commands）切换；流式回复用轻量 markdown 渲染
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Bot, Send, X } from "lucide-react";
import {
  IncompleteAiStreamError,
  TruncatedAiResponseError,
  readAiEventStream,
} from "../../../lib/ai-stream";

// Turnstile Site Key 是公开标识，由构建环境变量注入（Vite envPrefix 兼容 PUBLIC_ 前缀，见 vite.config.ts）；
// Secret Key 仅存在于 Worker。
const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || "";

type Db = "srpcfg" | "commands";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
  guidance?: string;
  pending?: boolean;
}

interface TurnstileApi {
  render(
    container: string | HTMLElement,
    options: {
      sitekey: string;
      action: "chat";
      execution: "execute";
      appearance: "interaction-only";
      theme: "dark";
      language: "zh-CN";
      size: "flexible";
      responseField: false;
      retry: "never";
      callback: (token: string) => void;
      "error-callback": (errorCode: string) => void;
      "expired-callback": () => void;
      "timeout-callback": () => void;
    },
  ): string;
  execute(widgetId: string): void;
  reset(widgetId: string): void;
}

function describeTurnstileError(errorCode: string): string {
  if (errorCode === "110200") {
    return `当前域名 ${window.location.hostname} 未加入 Turnstile 允许列表（错误码 110200）。`;
  }
  if (["110100", "110110", "400020", "400070"].includes(errorCode)) {
    return `Turnstile Site Key 配置无效或已停用（错误码 ${errorCode}）。`;
  }
  if (errorCode === "200500") {
    return "Turnstile 验证组件加载失败，请检查广告拦截器或网络设置（错误码 200500）。";
  }
  if (errorCode.startsWith("300") || errorCode.startsWith("600")) {
    return `Turnstile 未能通过安全检查，请关闭代理后重试（错误码 ${errorCode}）。`;
  }
  return `Turnstile 验证失败，请重试（错误码 ${errorCode || "unknown"}）。`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 与旧实现一致的轻量 markdown：`inline code`（可点击复制）/ **bold** / 列表 / 换行 */
function renderMarkdown(text: string): string {
  if (!text) return "";
  let html = escapeHtml(text);
  html = html.replace(/`([^`\n]+)`/g, (_, command: string) => {
    return `<code class="inline-code" data-copy-code title="点击复制" style="cursor:pointer">${command}</code>`;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\n/g, "<br>");
  html = html.replace(/(?:^|<br>)((?:[-•]\s[^\n<]+(?:<br>|$))+)/g, (_, listBlock: string) => {
    const items = listBlock
      .split(/<br>|$/)
      .filter((s: string) => s.trim())
      .map((s: string) => `<li>${s.replace(/^[-•]\s/, "").trim()}</li>`)
      .join("");
    return `<ul class="list-disc list-inside space-y-0.5 my-1">${items}</ul>`;
  });
  return html;
}

const quickQuestions: Record<Db, string[]> = {
  srpcfg: [
    "Default Preset 里的 J 键执行什么？它从哪里加载？",
    "srp_practice 和 srp_practice_keys 有什么区别？",
    "sv_cheats 在配置包哪些位置使用，生效范围是什么？",
  ],
  commands: [
    "cl_crosshairsize 的作用和默认值是什么？",
    "bind 指令的基本语法是什么？",
    "sv_cheats 会影响哪些类型的指令？",
  ],
};

export function AiPanel({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: (open: boolean) => void;
}) {
  const [currentDb, setCurrentDb] = useState<Db>("srpcfg");
  const [history, setHistory] = useState<Record<Db, ChatMsg[]>>({ srpcfg: [], commands: [] });
  const [pending, setPending] = useState<ChatMsg | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState("");

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const pendingTokenRef = useRef<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
    timeoutId: number;
  } | null>(null);
  const historyRef = useRef<Record<Db, { role: "user" | "assistant"; content: string }[]>>({
    srpcfg: [],
    commands: [],
  });

  const scrollToBottom = useCallback(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [history, pending, scrollToBottom]);

  // 加载 Turnstile 外部脚本（render=explicit，与旧实现一致）
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    if (document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')) return;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const rejectTurnstile = useCallback((error: Error) => {
    const pending = pendingTokenRef.current;
    if (!pending) return;
    window.clearTimeout(pending.timeoutId);
    pendingTokenRef.current = null;
    pending.reject(error);
  }, []);

  const getTurnstileToken = useCallback(async (): Promise<string> => {
    if (!TURNSTILE_SITE_KEY) {
      throw new Error(
        "AI 助手安全验证未配置（Turnstile Site Key 缺失）。请站点管理员在部署环境配置后重新构建上线。",
      );
    }
    const container = turnstileContainerRef.current;
    if (!container) throw new Error("Turnstile 容器不存在，请刷新页面重试。");
    const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
    if (!api) throw new Error("Turnstile 尚未加载完成，请稍后重试。");

    if (!widgetIdRef.current) {
      widgetIdRef.current = api.render(container, {
        sitekey: TURNSTILE_SITE_KEY,
        action: "chat",
        execution: "execute",
        appearance: "interaction-only",
        theme: "dark",
        language: "zh-CN",
        size: "flexible",
        responseField: false,
        retry: "never",
        callback: (token) => {
          const pending = pendingTokenRef.current;
          if (pending) {
            window.clearTimeout(pending.timeoutId);
            pendingTokenRef.current = null;
            pending.resolve(token);
          }
        },
        "error-callback": (errorCode) => {
          rejectTurnstile(new Error(describeTurnstileError(errorCode)));
        },
        "expired-callback": () => {
          rejectTurnstile(new Error("Turnstile 验证已过期，请重试。"));
        },
        "timeout-callback": () => {
          rejectTurnstile(new Error("Turnstile 交互验证超时，请重试。"));
        },
      });
    } else {
      api.reset(widgetIdRef.current);
    }

    return new Promise<string>((resolve, reject) => {
      pendingTokenRef.current = {
        resolve,
        reject,
        timeoutId: window.setTimeout(() => {
          rejectTurnstile(new Error("Turnstile 验证超时，请刷新页面后重试。"));
        }, 120_000),
      };
      api.execute(widgetIdRef.current!);
    });
  }, [rejectTurnstile]);

  const requestAiResponse = useCallback(
    async (
      message: string,
      requestDb: Db,
      requestHistory: { role: "user" | "assistant"; content: string }[],
      onDelta: (text: string) => void,
    ): Promise<string> => {
      const turnstileToken = await getTurnstileToken();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          db: requestDb,
          history: requestHistory.slice(-6).map((item) => ({
            role: item.role,
            content: item.content.slice(0, 4_000),
          })),
          turnstileToken,
        }),
      });

      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}`;
        try {
          const errorPayload = await res.json();
          errorMessage = errorPayload.error || errorMessage;
        } catch {
          // 保留 HTTP 状态兜底
        }
        throw new Error(errorMessage);
      }
      if (!res.body) throw new Error("服务未返回响应内容。");

      return readAiEventStream(res.body, onDelta);
    },
    [getTurnstileToken],
  );

  const sendMessage = useCallback(
    async (rawMessage?: string) => {
      if (isStreaming) return;
      const message = (rawMessage ?? input).trim();
      if (!message) return;

      const requestDb = currentDb;
      const requestHistory = historyRef.current[requestDb];
      setInput("");
      setHistory((prev) => ({
        ...prev,
        [requestDb]: [...prev[requestDb], { role: "user", content: message }],
      }));
      setPending({ role: "assistant", content: "", pending: true });
      setIsStreaming(true);

      try {
        let fullText = "";
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            fullText = await requestAiResponse(message, requestDb, requestHistory, (text) => {
              setPending({ role: "assistant", content: text });
            });
            break;
          } catch (error: unknown) {
            if (attempt === 0 && error instanceof IncompleteAiStreamError) continue;
            throw error;
          }
        }

        requestHistory.push({ role: "user", content: message });
        requestHistory.push({ role: "assistant", content: fullText });
        setHistory((prev) => ({
          ...prev,
          [requestDb]: [
            ...prev[requestDb],
            { role: "assistant", content: fullText },
          ],
        }));
        setPending(null);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const guidance =
          error instanceof TruncatedAiResponseError
            ? "回答达到长度上限。请缩小问题范围，或要求分批列出字段。"
            : "请重试，或切换到左侧精确检索。";
        setHistory((prev) => ({
          ...prev,
          [requestDb]: [
            ...prev[requestDb],
            { role: "assistant", content: errorMessage, error: true, guidance },
          ],
        }));
        setPending(null);
      } finally {
        setIsStreaming(false);
      }
    },
    [input, isStreaming, currentDb, requestAiResponse],
  );

  const selectDb = (db: Db) => {
    if (db === currentDb || isStreaming) return;
    setCurrentDb(db);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const handleCopyCode = (e: React.MouseEvent<HTMLDivElement>) => {
    const codeEl = (e.target as HTMLElement).closest("[data-copy-code]");
    if (codeEl) {
      navigator.clipboard.writeText(codeEl.textContent || "").catch(() => {});
    }
  };

  const messages = history[currentDb];
  const dbLabel = currentDb === "srpcfg" ? "检索 SrP-CFG 配置源码" : "检索 CS2 官方指令数据";

  return (
    <>
      {/* 移动端/小屏 AI 悬浮按钮 */}
      <button
        type="button"
        aria-label="打开 AI 助理"
        onClick={() => onToggle(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-bg shadow-lg shadow-accent/30 transition-all hover:bg-accent-light active:scale-95 xl:hidden"
      >
        <Bot className="h-6 w-6" />
      </button>

      <div
        id="ai-panel"
        className={[
          "fixed inset-0 z-40 flex items-end self-start transition-all duration-300 xl:sticky xl:top-24 xl:z-auto xl:block xl:w-[360px] xl:flex-shrink-0 xl:items-start",
          open
            ? "translate-y-0 bg-bg/80 opacity-100 backdrop-blur-sm xl:bg-transparent xl:opacity-100 xl:backdrop-blur-none"
            : "pointer-events-none translate-y-full bg-bg/80 opacity-0 backdrop-blur-sm xl:pointer-events-auto xl:translate-y-0 xl:opacity-100 xl:bg-transparent xl:backdrop-blur-none",
        ].join(" ")}
      >
        {/* 遮罩点击关闭（小屏） */}
        <div
          onClick={() => onToggle(false)}
          className="absolute inset-0 cursor-pointer bg-bg/80 backdrop-blur-sm xl:hidden"
        />

        {/* 面板内容 */}
        <div
          className="relative flex h-[60vh] w-full flex-col overflow-hidden rounded-t-[16px] border border-border bg-bg-card shadow-2xl xl:h-[420px] xl:w-[360px] xl:rounded-[12px]"
          style={{
            resize: "both",
            overflow: "hidden",
            minWidth: 300,
            maxWidth: 500,
            minHeight: 300,
            maxHeight: "calc(100vh - 8rem)",
          }}
        >
          {/* 顶栏 */}
          <div className="flex items-center justify-between border-b border-border bg-bg-hover/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/20 bg-accent-bg">
                <Bot className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h2 className="font-display text-sm font-semibold text-text">AI 配置助理</h2>
                <p className="text-[10px] text-text-faint">{dbLabel}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggle(false)}
              aria-label="关闭"
              className="rounded p-1 text-text-muted transition-colors hover:text-text xl:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 数据库选择 */}
          <div
            className="relative z-10 flex select-none border-b border-border bg-bg/30 text-xs"
            role="radiogroup"
            aria-label="AI 知识库"
          >
            {(
              [
                { id: "srpcfg", label: "SrP-CFG 源码" },
                { id: "commands", label: <>CS2 指令库 <span className="opacity-70 text-[9px]">高阶</span></> },
              ] as { id: Db; label: ReactNode }[]
            ).map((db) => {
              const active = currentDb === db.id;
              return (
                <button
                  key={db.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={isStreaming}
                  onClick={() => selectDb(db.id)}
                  className={[
                    "min-h-11 flex-1 border-b-2 px-2 py-2 text-center font-medium transition-colors disabled:cursor-wait disabled:opacity-60",
                    active ? "border-accent text-accent" : "border-transparent text-text-muted hover:text-text",
                  ].join(" ")}
                >
                  {db.label}
                </button>
              );
            })}
          </div>

          {/* 消息区 */}
          <div
            ref={messagesRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4"
            onClick={handleCopyCode}
          >
            <WelcomeMessage db={currentDb} onAsk={(q) => void sendMessage(q)} />
            {messages.map((msg, index) => (
              <Bubble key={index} msg={msg} />
            ))}
            {pending && <Bubble msg={pending} />}
          </div>

          {/* 输入区 */}
          <div className="border-t border-border p-3">
            <div className="relative">
              <textarea
                ref={inputRef}
                rows={1}
                maxLength={500}
                value={input}
                placeholder={
                  currentDb === "srpcfg"
                    ? "询问配置位置、按键、alias 或生效范围..."
                    : "查询 CS2 官方控制台指令..."
                }
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="max-h-24 w-full resize-none rounded-[10px] border border-border bg-bg py-2.5 pl-3.5 pr-12 font-body text-sm text-text outline-none transition-colors placeholder:text-text-faint focus:border-accent"
                style={{ minHeight: 42 }}
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={isStreaming || !input.trim()}
                aria-label="发送"
                className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-[8px] bg-accent text-bg transition-all hover:bg-accent-light active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div ref={turnstileContainerRef} className="mt-2 flex min-h-0 justify-center" />
            <p className="mt-1.5 text-center text-[10px] text-text-faint">
              AI 回复仅供参考，请以游戏内实际效果为准
            </p>
          </div>

          {/* 右下角可调节窗口大小标记 */}
          <div
            className="pointer-events-none absolute bottom-1 right-1 z-30 flex h-4 w-4 select-none items-center justify-center text-text-muted opacity-60"
            aria-hidden="true"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M14 6L6 14" />
              <path d="M14 10L10 14" />
              <path d="M14 14L14 14.01" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}

function WelcomeMessage({ db, onAsk }: { db: Db; onAsk: (question: string) => void }) {
  return (
    <div className="flex gap-2.5">
      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent-bg">
        <svg className="h-3.5 w-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <div className="flex-1">
        <div className="rounded-[10px] rounded-tl-[3px] bg-bg-hover px-3.5 py-2.5 text-sm leading-6 text-text">
          <p className="mb-2">
            {db === "srpcfg" ? (
              <>
                默认检索 <span className="font-semibold text-accent">SrP-CFG 配置源码</span>
                ，可回答文件位置、加载入口、按键绑定、alias、作用范围与源码中明确写出的条件。
              </>
            ) : (
              <>
                <span className="font-semibold text-accent">CS2 指令库</span>
                是面向高阶用户的附加检索源，适合查询官方控制台指令与变量；结果可能包含开发者或引擎内部条目。
              </>
            )}
          </p>
          <p className="mb-2 text-xs text-text-muted">
            {db === "srpcfg" ? "试着询问配置包的具体功能：" : "试着询问官方指令："}
          </p>
          <div className="flex flex-col gap-1.5">
            {quickQuestions[db].map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => onAsk(question)}
                className="cursor-pointer rounded-lg border border-accent/15 bg-accent-bg/50 px-3 py-2 text-left text-xs text-accent/90 transition-all hover:border-accent/30 hover:bg-accent-bg"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.role === "user";
  if (msg.pending) {
    return (
      <div className="flex gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent-bg">
          <svg className="h-3.5 w-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="rounded-[10px] rounded-tl-[3px] bg-bg-hover px-3.5 py-2.5 text-sm leading-6 text-text">
            {msg.content ? (
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: "300ms" }} />
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
  if (msg.error) {
    return (
      <div className="flex gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent-bg">
          <svg className="h-3.5 w-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="rounded-[10px] rounded-tl-[3px] bg-bg-hover px-3.5 py-2.5 text-sm leading-6 text-text">
            <p className="text-sm text-red-400">回复未完整生成：{msg.content}</p>
            <p className="mt-1 text-xs text-text-faint">{msg.guidance ?? "请重试，或切换到左侧精确检索。"}</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
          isUser ? "border border-border bg-bg-raised" : "border border-accent/20 bg-accent-bg"
        }`}
      >
        {isUser ? (
          <svg className="h-3.5 w-3.5 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        )}
      </div>
      <div className="max-w-[85%] flex-1">
        <div
          className={`rounded-[10px] px-3.5 py-2.5 text-sm leading-6 ${
            isUser
              ? "rounded-tr-[3px] bg-accent text-bg"
              : "rounded-tl-[3px] bg-bg-hover text-text"
          }`}
        >
          {isUser ? (
            <span>{msg.content}</span>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
          )}
        </div>
      </div>
    </div>
  );
}
