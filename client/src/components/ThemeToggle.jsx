import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext.jsx";
import { IconMoon, IconSun } from "./icons.jsx";

/** Quiet icon toggle. The page reveal is the show. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -70, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 70, scale: 0.6 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: "grid", placeItems: "center" }}
        >
          {dark ? <IconSun /> : <IconMoon />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
