export interface ScreenCopy { id: string; title: string; short: string; description: string; points: string[]; }
export interface I18nDictionary {
  nav: { product: string; showcase: string; assembly: string; download: string; skill: string; language: string; menu: string; close: string; skip: string };
  hero: { eyebrow: string; title: string; highlight: string; description: string; download: string; explore: string; platform: string; floatingLabel: string; scroll: string };
  showcase: { eyebrow: string; title: string; description: string; previous: string; next: string; actual: string; screens: ScreenCopy[] };
  features: { eyebrow: string; title: string; description: string; items: { title: string; description: string; tag: string }[] };
  assembly: { eyebrow: string; title: string; highlight: string; description: string; layers: { title: string; description: string }[]; expand: string; collapse: string; note: string; codeLabel: string; diagram: string; modeHint: string };
  workflow: { title: string; steps: { title: string; description: string }[] };
  downloads: {
    eyebrow: string; title: string; description: string; app: string; appNote: string; setup: string; setupNote: string; portable: string; portableNote: string;
    packages: string; packageNote: string; source: string; mirror: string; direct: string; sourceNote: string;
    loading: string; unavailable: string; noRelease: string; retry: string; releases: string; download: string; latest: string; size: string; hash: string; copied: string; copyFailed: string;
    packageSource: string; srp: string; video: string; annotations: string; skill: string; skillInstall: string; skillGuide: string;
    cliTitle: string; cliDescription: string; cliNote: string; instructions: string; readme: string; fallback: string;
  };
  footer: { description: string; blog: string; project: string; docs: string; releases: string; stack: string; license: string; top: string };
}
