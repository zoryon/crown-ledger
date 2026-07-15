"use client";

import { Languages, Moon, Sun } from "lucide-react";
import { usePreferences } from "@/app/components/Preferences";

export function PreferenceControls({ compact }: { compact?: boolean }) {
  const { theme, language, setTheme, setLanguage } = usePreferences();
  const isItalian = language === "it";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="grid size-10 place-items-center rounded-md border border-black/10 bg-white text-black/70 shadow-sm transition hover:text-black"
        title={theme === "dark" ? "Tema chiaro" : "Tema scuro"}
        aria-label={theme === "dark" ? "Tema chiaro" : "Tema scuro"}
      >
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
      <button
        type="button"
        onClick={() => setLanguage(isItalian ? "en" : "it")}
        className="flex h-10 items-center gap-2 rounded-md border border-black/10 bg-white px-3 text-sm font-semibold text-black/70 shadow-sm transition hover:text-black"
        title={isItalian ? "English" : "Italiano"}
        aria-label={isItalian ? "English" : "Italiano"}
      >
        <Languages className="size-4" />
        {!compact && <span>{isItalian ? "IT" : "EN"}</span>}
      </button>
    </div>
  );
}

export function LocalizedText({
  en,
  it,
  as: Element = "span",
  className,
}: {
  en: string;
  it: string;
  as?: "h1" | "h2" | "p" | "span";
  className?: string;
}) {
  const { language } = usePreferences();

  return <Element className={className}>{language === "it" ? it : en}</Element>;
}
