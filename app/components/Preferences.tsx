"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

export type ThemeMode = "light" | "dark";
export type Language = "en" | "it";

type Preferences = {
  theme: ThemeMode;
  language: Language;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: Language) => void;
};

const themeKey = "crown.theme";
const languageKey = "crown.language";
const preferencesChangedEvent = "crown-preferences-changed";
const PreferencesContext = createContext<Preferences | null>(null);

function readStoredPreference<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const stored = window.localStorage.getItem(key);
  return allowed.includes(stored as T) ? (stored as T) : fallback;
}

function systemTheme(): ThemeMode {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener("storage", onStoreChange);
    window.addEventListener(preferencesChangedEvent, onStoreChange);

    return () => {
      window.removeEventListener("storage", onStoreChange);
      window.removeEventListener(preferencesChangedEvent, onStoreChange);
    };
  }, []);

  const theme = useSyncExternalStore<ThemeMode>(
    subscribe,
    () => readStoredPreference(themeKey, ["light", "dark"], systemTheme()),
    () => "light",
  );
  const language = useSyncExternalStore<Language>(
    subscribe,
    () => readStoredPreference(languageKey, ["en", "it"], "en"),
    () => "en",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    window.localStorage.setItem(themeKey, nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.dispatchEvent(new Event(preferencesChangedEvent));
  }, []);

  const setLanguage = useCallback((nextLanguage: Language) => {
    window.localStorage.setItem(languageKey, nextLanguage);
    document.documentElement.lang = nextLanguage;
    window.dispatchEvent(new Event(preferencesChangedEvent));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      language,
      setTheme,
      setLanguage,
    }),
    [language, setLanguage, setTheme, theme],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const preferences = useContext(PreferencesContext);

  if (!preferences) {
    throw new Error("usePreferences must be used inside PreferencesProvider.");
  }

  return preferences;
}
