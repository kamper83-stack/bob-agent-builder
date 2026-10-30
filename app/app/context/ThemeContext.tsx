"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  /** null before first client render — use to suppress hydration-sensitive UI */
  resolvedTheme: "light" | "dark" | null;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: null,
  setTheme: () => {},
});

const STORAGE_KEY = "agent-studio:theme";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  // null until after first client paint — prevents server/client mismatch
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
    const resolved = stored === "system" ? getSystemTheme() : stored;
    setThemeState(stored);
    setResolvedTheme(resolved);

    const html = document.documentElement;
    html.classList.remove("light", "dark");
    html.classList.add(resolved);
  }, []);

  function setTheme(t: Theme) {
    const resolved = t === "system" ? getSystemTheme() : t;
    setThemeState(t);
    setResolvedTheme(resolved);
    localStorage.setItem(STORAGE_KEY, t);

    const html = document.documentElement;
    html.classList.remove("light", "dark");
    html.classList.add(resolved);
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
