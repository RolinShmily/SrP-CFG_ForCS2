export type Locale = "zh" | "en";

export interface ShowcaseSlide {
  id: string;
  label: string;
  summary: string;
  image: string;
}

export interface SiteCopy {
  nav: {
    home: string;
    console: string;
    download: string;
    product: string;
    language: string;
    menu: string;
    close: string;
    skip: string;
  };
  search: {
    title: string;
    trigger: string;
    placeholder: string;
    clear: string;
    filterLabel: string;
    filterAll: string;
    popular: string;
    quickNav: string;
    searching: string;
    empty: string;
    searchInTable: string;
    hintNavigate: string;
    hintOpen: string;
    hintClose: string;
    openFullList: string;
  };
  home: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    searchCta: string;
    showcaseCaption: string;
    slides: ShowcaseSlide[];
    servicesTitle: string;
    servicesSubtitle: string;
    services: Array<{
      id: string;
      badge: string;
      title: string;
      description: string;
      action: string;
      to: string;
    }>;
    consoleTitle: string;
    consoleSubtitle: string;
    consoleAction: string;
    consoleConvars: string;
    consoleCommands: string;
    consoleCategories: string;
    consoleUpstream: string;
    bannerTitle: string;
    bannerDesc: string;
  };
  download: {
    eyebrow: string;
    title: string;
    subtitle: string;
    appTitle: string;
    appDesc: string;
    sourceLabel: string;
    sourceMirror: string;
    sourceGithub: string;
    sourceNote: string;
    loading: string;
    latest: string;
    unavailable: string;
    noRelease: string;
    retry: string;
    releases: string;
    setupTitle: string;
    setupDesc: string;
    portableTitle: string;
    portableDesc: string;
    downloadBtn: string;
    hashCopy: string;
    hashCopied: string;
    hashFailed: string;
    packagesTitle: string;
    packagesDesc: string;
    packagesNote: string;
    updatedAt: string;
    targetPath: string;
    packages: Record<"srp-cfg" | "video" | "annotations" | "srp-cfg-csgo", { title: string; target: string; desc: string }>;
    usageTitle: string;
    usageSteps: string[];
  };
  footer: {
    description: string;
    siteHeading: string;
    projectHeading: string;
    changes: string;
    project: string;
    releases: string;
    docs: string;
    blog: string;
    license: string;
    thirdParty: string;
    disclaimer: string;
  };
  notFound: {
    eyebrow: string;
    title: string;
    desc: string;
    home: string;
    console: string;
  };
}
