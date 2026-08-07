import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

const KEY = "unify:theme";

/** Reads the user's explicit theme choice, if any. */
export function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return v === "light" || v === "dark" ? v : null;
}

export function applyTheme(dark: boolean) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

/**
 * Explicit light/dark preference chosen by the user.
 * `null` means "follow the plan default".
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode | null>(null);

  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  const setTheme = useCallback((next: ThemeMode | null) => {
    if (typeof window === "undefined") return;
    if (next === null) window.localStorage.removeItem(KEY);
    else {
      window.localStorage.setItem(KEY, next);
      applyTheme(next === "dark");
    }
    setThemeState(next);
    window.dispatchEvent(new Event("unify:theme-change"));
  }, []);

  const toggle = useCallback(() => {
    const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  }, [setTheme]);

  return { theme, setTheme, toggle };
}
