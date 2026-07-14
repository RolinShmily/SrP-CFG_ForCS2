export class IncompleteAiStreamError extends Error {
  constructor(message = "AI 回复连接提前结束，未收到完成标记。") {
    super(message);
    this.name = "IncompleteAiStreamError";
  }
}

export class TruncatedAiResponseError extends Error {
  constructor(message = "AI 回复达到生成长度上限，内容未完整结束。") {
    super(message);
    this.name = "TruncatedAiResponseError";
  }
}

interface WorkersAiStreamPayload {
  response?: unknown;
  delta?: unknown;
  error?: unknown;
  finish_reason?: unknown;
  choices?: Array<{
    delta?: { content?: unknown };
    finish_reason?: unknown;
  }>;
}

function extractText(payload: WorkersAiStreamPayload): string {
  if (typeof payload.response === "string") return payload.response;
  if (typeof payload.delta === "string") return payload.delta;
  const choiceContent = payload.choices?.[0]?.delta?.content;
  return typeof choiceContent === "string" ? choiceContent : "";
}

function extractFinishReason(payload: WorkersAiStreamPayload): string {
  if (typeof payload.finish_reason === "string") return payload.finish_reason;
  const choiceReason = payload.choices?.[0]?.finish_reason;
  return typeof choiceReason === "string" ? choiceReason : "";
}

export async function readAiEventStream(
  body: ReadableStream<Uint8Array>,
  onUpdate: (text: string) => void = () => {},
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let completed = false;
  let finishReason = "";

  const consumeData = (rawData: string): void => {
    const data = rawData.trim();
    if (!data) return;
    if (data === "[DONE]") {
      completed = true;
      return;
    }

    let payload: WorkersAiStreamPayload;
    try {
      payload = JSON.parse(data) as WorkersAiStreamPayload;
    } catch {
      throw new Error("AI 返回了无法解析的流式数据。请重试。");
    }

    if (payload.error) throw new Error(String(payload.error));
    finishReason = extractFinishReason(payload) || finishReason;

    const chunk = extractText(payload);
    if (!chunk) return;
    fullText += chunk;
    onUpdate(fullText);
  };

  const consumeEvent = (eventBlock: string): void => {
    for (const line of eventBlock.split(/\r?\n/)) {
      const normalized = line.trimStart();
      if (!normalized.startsWith("data:")) continue;
      consumeData(normalized.slice(5));
    }
  };

  try {
    while (true) {
      let readResult: ReadableStreamReadResult<Uint8Array>;
      try {
        readResult = await reader.read();
      } catch {
        throw new IncompleteAiStreamError();
      }
      const { done, value } = readResult;
      if (value) buffer += decoder.decode(value, { stream: true });
      if (done) buffer += decoder.decode();

      const events = buffer.split(/\r?\n\r?\n/);
      if (done) {
        buffer = "";
      } else {
        buffer = events.pop() ?? "";
      }
      for (const event of events) consumeEvent(event);
      if (done) break;
    }

    if (buffer.trim()) consumeEvent(buffer);
  } finally {
    reader.releaseLock();
  }

  if (finishReason === "length") throw new TruncatedAiResponseError();
  if (!completed) throw new IncompleteAiStreamError();
  if (!fullText.trim()) throw new Error("AI 未生成可显示的回复，请重试。");
  return fullText;
}
