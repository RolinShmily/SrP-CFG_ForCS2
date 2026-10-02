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
      } else {
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith("zh")) {
          setLocaleState("zh");
        } else {
          setLocaleState("en");
        }
      }
    } catch {
      // ignore local storage errors
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("srp_locale", newLocale);
      document.documentElement.lang = newLocale === "zh" ? "zh-CN" : "en-US";
    } catch {
      // ignore
    }
  };

  const toggleLocale = () => {
    const next = locale === "zh" ? "en" : "zh";
    setLocale(next);
  };

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
