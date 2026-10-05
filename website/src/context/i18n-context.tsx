"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { zh } from "@/locales/zh";
import { en } from "@/locales/en";
import { I18nDictionary } from "@/locales/types";

export type Locale = "zh" | "en";

interface I18nContextType {
  locale: Locale;
  t: I18nDictionary;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextType>({
  locale: "zh",
  t: zh,
  setLocale: () => {},
  toggleLocale: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("srp_locale") as Locale | null;
      if (saved === "zh" || saved === "en") {
        setLocaleState(saved);
      }
    } catch (error) {
      if (!(error instanceof DOMException)) console.warn("Language preference unavailable", error);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("srp_locale", newLocale);
    } catch (error) {
      if (!(error instanceof DOMException)) console.warn("Language preference unavailable", error);
    }
  };

  const toggleLocale = () => {
    const next = locale === "zh" ? "en" : "zh";
    setLocale(next);
  };

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title = locale === "zh" ? "SrP-CFG — 你的 CS2 配置工作台" : "SrP-CFG — Your CS2 config workspace";
  }, [locale]);

  const t = locale === "zh" ? zh : en;

  return (
    <I18nContext.Provider value={{ locale, t, setLocale, toggleLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
