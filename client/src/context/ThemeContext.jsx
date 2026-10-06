import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

const ThemeContext = createContext(null);
const KEY = "taskflow.theme";

function initialTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* ignore */ }
  return "dark";
}

/**
 * Telegram-style theme switch: a circular reveal grows from the toggle
 * click point, powered by the View Transitions API (with instant fallback).
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const applyTheme = useCallback((next) => {
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      next === "dark" ? "#0e0e10" : "#f7f5f1"
    );
    try {
      localStorage.setItem(KEY, next);
    } catch { /* ignore */ }
    setTheme(next);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = themeRef.current;
  }, []);

  const toggleTheme = useCallback(
    (event) => {
      const next = themeRef.current === "dark" ? "light" : "dark";
      const x = event?.clientX ?? window.innerWidth / 2;
      const y = event?.clientY ?? 40;
      const root = document.documentElement;
      root.style.setProperty("--tx", `${x}px`);
      root.style.setProperty("--ty", `${y}px`);

      if (!document.startViewTransition) {
        applyTheme(next);
        return;
      }
      // flushSync guarantees React commits the theme change inside the
      // transition callback, so the browser captures a correct after-shot.
      document.startViewTransition(() => {
        flushSync(() => applyTheme(next));
      });
    },
    [applyTheme]
  );

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
