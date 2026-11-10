/**
 * Build-time access to the console dataset.
 *
 * This module is intentionally `.server`: React Router strips it from the
 * browser bundle. Detail routes use it in loaders during prerendering, so the
 * generated HTML and `.data` files contain the full record without shipping
 * the 5,585-record canonical files to the client.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type {
  ConsoleCategorySummary,
  ConsoleDetail,
  ConsoleFlagSummary,
  ConsoleIndex,
  ConsoleIndexRecord,
  ConsoleMetadata,
  ConsoleOverride,
  ConsoleRecord,
  ConsoleRecordType,
  ConsoleTranslation,
  ConsoleTranslationStatus,
} from "./types";

// Use cwd rather than import.meta.url: the module is bundled into
// build/server/index.js, so its URL no longer points at src/lib/console.
// The build/dev commands run from website/, while a repo-root invocation is
// supported as a fallback.
const websiteRoot =
  [process.cwd(), path.resolve(process.cwd(), "website")].find((candidate) =>
    fs.existsSync(path.join(candidate, "data", "console", "metadata.json")),
  ) ?? process.cwd();
const dataDirectory = path.join(websiteRoot, "data", "console");
const indexFile = path.join(websiteRoot, "public", "data", "console-index.json");

function readJson<T>(file: string): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to read console data at ${file}. Run \`pnpm console:prepare\` first. (${reason})`,
    );
  }
}

const index = readJson<ConsoleIndex>(indexFile);
const metadata = readJson<ConsoleMetadata>(path.join(dataDirectory, "metadata.json"));
const convars = readJson<{ records: ConsoleRecord[] }>(
  path.join(dataDirectory, "convars.json"),
).records;
const commands = readJson<{ records: ConsoleRecord[] }>(
  path.join(dataDirectory, "commands.json"),
).records;
const translations = readJson<{ records: Record<string, ConsoleTranslation> }>(
  path.join(dataDirectory, "translations.json"),
).records;
const overrides = readJson<{ records: Record<string, ConsoleOverride> }>(
  path.join(dataDirectory, "overrides.json"),
).records;

const recordsByKey = new Map<string, ConsoleRecord>();
for (const record of [...convars, ...commands]) {
  recordsByKey.set(`${record.type}:${record.name}`, record);
}

const indexByKey = new Map<string, ConsoleIndexRecord>();
for (const record of index.records) {
  indexByKey.set(record.key, record);
}

function sourceHash(description: string): string | null {
  const normalized = description.trim().split(/\s+/).join(" ");
  if (!normalized) return null;
  return "sha256:" + createHash("sha256").update(normalized, "utf8").digest("hex");
}

function recordKey(type: ConsoleRecordType, name: string): string {
  return `${type}:${name}`;
}

function formatConvarValue(value: string): string {
  if (value === "") return '""';
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)) return value;
  if (value === "true" || value === "false") return value;
  return JSON.stringify(value);
}

function sourceFile(type: ConsoleRecordType) {
  return type === "convar"
    ? metadata.upstream.files.convars
    : metadata.upstream.files.commands;
}

export function getIndex(): ConsoleIndex {
  return index;
}

export function getMetadata(): ConsoleMetadata {
  return metadata;
}

export function getCategories(): ConsoleCategorySummary[] {
  const counts = new Map<string, number>();
  for (const record of index.records) {
    counts.set(record.category, (counts.get(record.category) ?? 0) + 1);
  }
  return index.categories.map((category) => ({
    ...category,
    count: counts.get(category.slug) ?? 0,
  }));
}

export function getPublicCounts() {
  let convars = 0;
  let commands = 0;
  for (const record of index.records) {
    if (record.flags.includes("developmentonly") || record.flags.includes("defensive")) {
      continue;
    }
    if (record.type === "convar") convars += 1;
    else commands += 1;
  }
  return { convars, commands };
}

export function getFlags(): ConsoleFlagSummary[] {
  const counts = new Map<string, number>();
  for (const record of index.records) {
    for (const flag of record.flags) {
      counts.set(flag, (counts.get(flag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([flag, count]) => ({ flag, count }))
    .sort((left, right) => right.count - left.count || left.flag.localeCompare(right.flag));
}

function isInternalRecord(record: ConsoleIndexRecord): boolean {
  return record.flags.includes("developmentonly") || record.flags.includes("defensive");
}

export function getCategory(slug: string): {
  category: ConsoleCategorySummary;
  records: ConsoleIndexRecord[];
} | null {
  const category = getCategories().find((item) => item.slug === slug);
  if (!category) return null;
  return {
    category,
    records: index.records
      .filter((record) => record.category === slug && !isInternalRecord(record))
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
}

export function getFlag(flag: string): {
  flag: string;
  count: number;
  records: ConsoleIndexRecord[];
} | null {
  const summary = getFlags().find((item) => item.flag === flag);
  if (!summary) return null;
  return {
    ...summary,
    records: index.records
      .filter((record) => record.flags.includes(flag) && !isInternalRecord(record))
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
}

function resolveTranslation(
  record: ConsoleRecord,
  translation: ConsoleTranslation | undefined,
  override: ConsoleOverride | undefined,
): {
  zh: string;
  status: ConsoleTranslationStatus;
  basis: string;
  inferred: boolean;
} {
  const overrideZh = override?.zh?.trim();
  if (overrideZh) {
    return { zh: overrideZh, status: "human-edited", basis: "human", inferred: false };
  }
  if (!translation) {
    return { zh: "", status: "missing", basis: "", inferred: false };
  }

  const description = record.description.trim();
  const zh = translation.zh.trim();
  if (translation.basis === "name-flags") {
    return description
      ? { zh, status: "stale", basis: translation.basis, inferred: false }
      : { zh, status: "inferred", basis: translation.basis, inferred: true };
  }
  if (translation.basis !== "english" || !description) {
    return { zh, status: "stale", basis: translation.basis, inferred: false };
  }
  if (translation.sourceHash !== sourceHash(record.description)) {
    return { zh, status: "stale", basis: translation.basis, inferred: false };
  }
  return { zh, status: "translated", basis: translation.basis, inferred: false };
}

export function getDetail(
  type: ConsoleRecordType,
  rawName: string,
): ConsoleDetail | null {
  const name = decodeURIComponent(rawName);
  const key = recordKey(type, name);
  const record = recordsByKey.get(key);
  if (!record) return null;

  const summary = indexByKey.get(key);
  const override = overrides[key];
  const translation = translations[key];
  const resolved = resolveTranslation(record, translation, override);
  const file = sourceFile(type);
  const defaultValue = type === "convar" ? record.default ?? "" : null;
  const category = override?.category || summary?.category || "system";
  const categoryEntry = index.categories.find((item) => item.slug === category);

  return {
    key,
    type,
    name,
    category,
    categoryZh: categoryEntry?.zh ?? category,
    categoryEn: categoryEntry?.en ?? category,
    flags: record.flags,
    defaultValue,
    min: record.min ?? null,
    max: record.max ?? null,
    description: record.description,
    zh: resolved.zh,
    translationStatus: resolved.status,
    basis: resolved.basis,
    inferred: resolved.inferred,
    indexable: summary?.indexable ?? false,
    source: {
      repository: metadata.upstream.repository,
      commit: metadata.upstream.commit,
      fetchedAt: metadata.upstream.fetchedAt,
      file: file.path,
      sha256: file.sha256,
    },
    configSnippet:
      type === "convar"
        ? `${record.name} ${formatConvarValue(defaultValue ?? "")}`
        : record.name,
    note: override?.note,
  };
}

export function getRecord(
  type: ConsoleRecordType,
  rawName: string,
): ConsoleRecord | null {
  return recordsByKey.get(recordKey(type, decodeURIComponent(rawName))) ?? null;
}

export function getPrerenderPaths(): string[] {
  const paths = new Set<string>();
  for (const record of index.records) {
    const segment = record.type === "convar" ? "convars" : "commands";
    const encoded = encodeURIComponent(record.name);
    paths.add(`/console/${segment}/${encoded}/`);
    // `+lookatweapon` is encoded as `%2B...` in canonical links, but users
    // often type the literal plus. Generate both paths; each page has the same
    // canonical URL, so search engines still consolidate them.
    if (encoded !== record.name) {
      paths.add(`/console/${segment}/${record.name}/`);
    }
  }
  for (const category of index.categories) {
    paths.add(`/console/categories/${category.slug}/`);
  }
  for (const flag of getFlags()) {
    paths.add(`/console/flags/${encodeURIComponent(flag.flag)}/`);
  }
  return [...paths];
}

export function getOverrideEntries(): Array<{
  key: string;
  zh?: string;
  category?: string;
  note?: string;
}> {
  return Object.entries(overrides)
    .map(([key, entry]) => ({ key, ...entry }))
    .sort((left, right) => left.key.localeCompare(right.key));
}
