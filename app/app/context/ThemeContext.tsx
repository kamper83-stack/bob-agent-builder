"use client";

import React, { createContext, useContext, useState } from "react";

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

function readStoredTheme(): { theme: Theme; resolvedTheme: "light" | "dark" | null } {
  // Called only on the client (inside a useState lazy initializer).
  // Returns null-resolved on the server to match SSR output.
  if (typeof window === "undefined") return { theme: "system", resolvedTheme: null };
  const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
  const resolved = stored === "system" ? getSystemTheme() : stored;
  return { theme: stored, resolvedTheme: resolved };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazy initialisers run only on the client — SSR path returns "system"/null,
  // which matches the server render, eliminating the hydration warning.
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme().theme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark" | null>(
    () => readStoredTheme().resolvedTheme
  );

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
