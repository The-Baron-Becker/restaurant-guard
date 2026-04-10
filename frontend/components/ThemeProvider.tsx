"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  resolved: "light",
  setTheme: () => {},
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  const applyTheme = useCallback((t: Theme) => {
    let effectiveTheme: "light" | "dark";
    if (t === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      effectiveTheme = t;
    }
    setResolved(effectiveTheme);
    document.documentElement.classList.toggle("dark", effectiveTheme === "dark");
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try { window.localStorage.setItem("rg-theme", t); } catch {}
    applyTheme(t);
  }, [applyTheme]);

  const toggle = useCallback(() => {
    setTheme(resolved === "dark" ? "light" : "dark");
  }, [resolved, setTheme]);

  useEffect(() => {
    let saved: Theme = "system";
    try {
      const s = window.localStorage.getItem("rg-theme");
      if (s === "light" || s === "dark" || s === "system") saved = s;
    } catch {}
    setThemeState(saved);
    applyTheme(saved);

    // Listen for system theme changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const current = window.localStorage.getItem("rg-theme") || "system";
      if (current === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
