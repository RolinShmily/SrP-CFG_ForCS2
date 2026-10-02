export interface I18nDictionary {
  nav: {
    features: string;
    walkthrough: string;
    workflow: string;
    keybinds: string;
    github: string;
    downloadDesktop: string;
    themeToggle: string;
    languageToggle: string;
  };
  hero: {
    badge: string;
    titleLine1: string;
    titleHighlight: string;
    subtitle: string;
    downloadBtn: string;
    keybindsBtn: string;
    versionNotice: string;
    pill1: string;
    pill2: string;
    pill3: string;
    consoleTitle: string;
    tabAutoexec: string;
    tabJumpthrow: string;
    tabPractice: string;
    copied: string;
    copyCode: string;
  };
  pillars: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    card1: {
      badge: string;
      title: string;
      desc: string;
      tag: string;
    };
    card2: {
      badge: string;
      title: string;
      desc: string;
      tag: string;
    };
    card3: {
      badge: string;
      title: string;
      desc: string;
      tag: string;
    };
    card4: {
      badge: string;
      title: string;
      desc: string;
      tag: string;
    };
  };
  walkthrough: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    autoPlay: string;
    pauseAutoPlay: string;
    fullscreen: string;
    stageLabel: string;
    downloadDesktop: string;
    viewBindings: string;
    steps: Array<{
      id: string;
      num: string;
      tabTitle: string;
      title: string;
      subtitle: string;
      desc: string;
      bullet1: string;
      bullet2: string;
      bullet3: string;
      image: string;
    }>;
  };
  workflow: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    stages: Array<{
      stage: string;
      badge: string;
      title: string;
      desc: string;
      features: string[];
    }>;
  };
  keybinds: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    filterAll: string;
    filterMovement: string;
    filterPractice: string;
    filterCrosshair: string;
    items: Array<{
      key: string;
      category: 'movement' | 'practice' | 'crosshair';
      name: string;
      desc: string;
      command: string;
    }>;
  };
  cta: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    downloadBtn: string;
    viewDocsBtn: string;
    githubBtn: string;
    trust1: string;
    trust2: string;
    trust3: string;
  };
  footer: {
    tagline: string;
    description: string;
    navigation: string;
    resources: string;
    community: string;
    features: string;
    download: string;
    documentation: string;
    changelog: string;
    bilibili: string;
    steam: string;
    github: string;
    license: string;
    allRightsReserved: string;
    icp1: string;
    icp2: string;
  };
}
