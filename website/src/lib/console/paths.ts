import type { ConsoleRecordType } from "./types";

export function detailPath(type: ConsoleRecordType, name: string): string {
  return `/console/${type === "convar" ? "convars" : "commands"}/${encodeURIComponent(name)}/`;
}

export function categoryPath(slug: string): string {
  return `/console/categories/${encodeURIComponent(slug)}/`;
}

export function flagPath(flag: string): string {
  return `/console/flags/${encodeURIComponent(flag)}/`;
}
