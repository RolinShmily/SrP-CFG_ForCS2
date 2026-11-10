import type { MetaDescriptor } from "react-router";

import type { ConsoleDetail, ConsoleRecordType } from "./types";

export const SITE_URL = "https://cfg.srprolin.com";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/app/overview-zh.webp`;

export function consoleSection(type: ConsoleRecordType): "convars" | "commands" {
  return type === "convar" ? "convars" : "commands";
}

export function listUrl(type: ConsoleRecordType): string {
  return `${SITE_URL}/console/${consoleSection(type)}/`;
}

export function detailUrl(type: ConsoleRecordType, name: string): string {
  return `${SITE_URL}/console/${consoleSection(type)}/${encodeURIComponent(name)}/`;
}

export function categoryUrl(slug: string): string {
  return `${SITE_URL}/console/categories/${encodeURIComponent(slug)}/`;
}

export function flagUrl(flag: string): string {
  return `${SITE_URL}/console/flags/${encodeURIComponent(flag)}/`;
}

interface PageMetaOptions {
  title: string;
  description: string;
  path: string;
  robots?: string;
  ogType?: string;
  image?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function pageMeta({
  title,
  description,
  path,
  robots = "index,follow",
  ogType = "website",
  image = DEFAULT_OG_IMAGE,
  jsonLd,
}: PageMetaOptions): MetaDescriptor[] {
  const url = `${SITE_URL}${path}`;
  const meta: MetaDescriptor[] = [
    { title },
    { name: "description", content: description },
    { name: "robots", content: robots },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:site_name", content: "SrP-CFG" },
    { property: "og:locale", content: "zh_CN" },
    { property: "og:type", content: ogType },
    { property: "og:image", content: image },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
  if (jsonLd) meta.push({ "script:ld+json": jsonLd });
  return meta;
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function collectionPageJsonLd({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: `${SITE_URL}${path}`,
    isPartOf: {
      "@type": "WebSite",
      name: "SrP-CFG",
      url: `${SITE_URL}/`,
    },
  };
}

export function definedTermJsonLd(detail: ConsoleDetail, description: string) {
  const section = detail.type === "convar" ? "ConVars" : "Console Commands";
  const url = detailUrl(detail.type, detail.name);
  const list = listUrl(detail.type);
  return [
    {
      "@context": "https://schema.org",
      "@type": "DefinedTerm",
      name: detail.name,
      description,
      url,
      inDefinedTermSet: {
        "@type": "DefinedTermSet",
        name: `Counter-Strike 2 ${section}`,
        url: list,
      },
    },
    breadcrumbJsonLd([
      { name: "Console", url: `${SITE_URL}/console/` },
      { name: section, url: list },
      { name: detail.name, url },
    ]),
  ];
}

export function websiteJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "SrP-CFG",
      url: `${SITE_URL}/`,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/console/convars?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "SrP-CFG",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Windows 10, Windows 11",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      url: `${SITE_URL}/`,
    },
  ];
}
