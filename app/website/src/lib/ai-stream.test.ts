import assert from "node:assert/strict";
import test from "node:test";
import {
  IncompleteAiStreamError,
  TruncatedAiResponseError,
  readAiEventStream,
} from "./ai-stream.ts";

function streamFromChunks(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

function splitBytes(bytes: Uint8Array, offsets: number[]): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  let start = 0;
  for (const offset of offsets) {
    chunks.push(bytes.slice(start, offset));
    start = offset;
  }
  chunks.push(bytes.slice(start));
  return chunks;
}

test("reassembles Workers AI SSE across arbitrary UTF-8 chunk boundaries", async () => {
  const source = [
    'data: {"response":"第一段：准星"}\n\n',
    'data: {"response":"；第二段：视角"}\n\n',
    "data: [DONE]\n\n",
  ].join("");
  const bytes = new TextEncoder().encode(source);
  const chunks = splitBytes(bytes, [1, 9, 27, 43, 58, bytes.length - 3]);
  const updates: string[] = [];

  const result = await readAiEventStream(streamFromChunks(chunks), (text) => updates.push(text));

  assert.equal(result, "第一段：准星；第二段：视角");
  assert.equal(updates.at(-1), result);
});

test("supports CRLF events and OpenAI-compatible delta chunks", async () => {
  const source = [
    'data: {"choices":[{"delta":{"content":"字段 A"},"finish_reason":null}]}\r\n\r\n',
    'data: {"choices":[{"delta":{"content":"，字段 B"},"finish_reason":"stop"}]}\r\n\r\n',
    "data: [DONE]\r\n\r\n",
  ].join("");

  const result = await readAiEventStream(streamFromChunks([new TextEncoder().encode(source)]));

  assert.equal(result, "字段 A，字段 B");
});

test("preserves every field in a long structured response", async () => {
  const fields = Array.from({ length: 160 }, (_, index) => `字段${index + 1}=值${index + 1}`);
  const source = fields
    .map((field, index) => `data: ${JSON.stringify({ response: `${index ? "；" : ""}${field}` })}\n\n`)
    .join("") + "data: [DONE]\n\n";
  const bytes = new TextEncoder().encode(source);
  const offsets: number[] = [];
  for (let offset = 7; offset < bytes.length; offset += 7 + (offset % 13)) offsets.push(offset);

  const result = await readAiEventStream(streamFromChunks(splitBytes(bytes, offsets)));

  assert.equal(result, fields.join("；"));
  for (const field of fields) assert.ok(result.includes(field), `missing ${field}`);
});

test("rejects streams that end without the DONE marker", async () => {
  const source = 'data: {"response":"不完整字段"}\n\n';

  await assert.rejects(
    readAiEventStream(streamFromChunks([new TextEncoder().encode(source)])),
    IncompleteAiStreamError,
  );
});

test("rejects explicit length-limited completions", async () => {
  const source = [
    'data: {"response":"被截断","finish_reason":"length"}\n\n',
    "data: [DONE]\n\n",
  ].join("");

  await assert.rejects(
    readAiEventStream(streamFromChunks([new TextEncoder().encode(source)])),
    TruncatedAiResponseError,
  );
});

test("surfaces malformed stream payloads instead of silently dropping fields", async () => {
  const source = "data: {not-json}\n\ndata: [DONE]\n\n";

  await assert.rejects(
    readAiEventStream(streamFromChunks([new TextEncoder().encode(source)])),
    /无法解析的流式数据/,
  );
});
