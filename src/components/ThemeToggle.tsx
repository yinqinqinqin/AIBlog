import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronUp, MoonStar, SlidersHorizontal, SunMedium } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type ThemeMode, useThemeStore } from "@/store/themeStore";

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

const themeOptions: Array<{
  value: ThemeMode;
  label: string;
  description: string;
  icon: typeof MoonStar;
}> = [
  { value: "dark", label: "深色", description: "暗色视觉环境", icon: MoonStar },
  { value: "light", label: "浅色", description: "明亮阅读环境", icon: SunMedium },
];

export default function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const reduceMotion = useReducedMotion();
  const [isDockOpen, setIsDockOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isDark = theme === "dark";

  useEffect(() => {
    if (!isDockOpen && !isThemeMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
        setIsDockOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isThemeMenuOpen) {
          setIsThemeMenuOpen(false);
        } else {
          setIsDockOpen(false);
        }
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDockOpen, isThemeMenuOpen]);

  const selectTheme = (nextTheme: ThemeMode) => {
    if (nextTheme !== theme) {
      const transitionDocument = document as TransitionDocument;
      const updateTheme = () => setTheme(nextTheme);

      if (!reduceMotion && transitionDocument.startViewTransition) {
        transitionDocument.startViewTransition(updateTheme);
      } else {
        updateTheme();
      }
    }

    setIsThemeMenuOpen(false);
  };

  const toggleDock = () => {
    setIsDockOpen((current) => {
      if (current) {
        setIsThemeMenuOpen(false);
      }

      return !current;
    });
  };

  return (
    <div className="theme-menu" ref={menuRef}>
      <AnimatePresence>
        {isDockOpen && isThemeMenuOpen ? (
          <motion.div
            animate={{ filter: "blur(0px)", opacity: 1, scale: 1, y: 0 }}
            aria-label="主题选择"
            className="theme-menu__panel"
            exit={{ filter: "blur(5px)", opacity: 0, scale: 0.96, y: 8 }}
            id="theme-menu-panel"
            initial={reduceMotion ? false : { filter: "blur(5px)", opacity: 0, scale: 0.96, y: 8 }}
            role="menu"
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="theme-menu__heading">
              <span>外观模式</span>
              <small>APPEARANCE</small>
            </div>

            <div className="theme-menu__options">
              {themeOptions.map(({ value, label, description, icon: Icon }) => {
                const isActive = value === theme;

                return (
                  <button
                    aria-checked={isActive}
                    className={isActive ? "is-active" : ""}
                    key={value}
                    onClick={() => selectTheme(value)}
                    role="menuitemradio"
                    type="button"
                  >
                    <span className="theme-menu__option-icon"><Icon size={15} /></span>
                    <span className="theme-menu__option-copy">
                      <strong>{label}</strong>
                      <small>{description}</small>
                    </span>
                    <span className="theme-menu__check">{isActive ? <Check size={13} /> : null}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isDockOpen ? (
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            aria-label="页面控制"
            className="theme-menu__controls"
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            id="control-dock-tray"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 8 }}
            role="toolbar"
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.button
              aria-controls="theme-menu-panel"
              aria-expanded={isThemeMenuOpen}
              aria-haspopup="menu"
              aria-label={isThemeMenuOpen ? "收起主题选择" : "打开主题选择"}
              className={isThemeMenuOpen ? "theme-menu__control-button is-active" : "theme-menu__control-button"}
              onClick={() => setIsThemeMenuOpen((current) => !current)}
              title="主题"
              type="button"
              whileTap={reduceMotion ? undefined : { scale: 0.92 }}
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.span
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  className="theme-menu__control-icon"
                  exit={{ opacity: 0, rotate: isDark ? -35 : 35, scale: 0.75 }}
                  initial={{ opacity: 0, rotate: isDark ? 35 : -35, scale: 0.75 }}
                  key={theme}
                  transition={{ duration: reduceMotion ? 0 : 0.18 }}
                >
                  {isDark ? <MoonStar size={17} /> : <SunMedium size={17} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        aria-controls="control-dock-tray"
        aria-expanded={isDockOpen}
        aria-label={isDockOpen ? "收起控制面板" : "展开控制面板"}
        className="theme-menu__trigger"
        onClick={toggleDock}
        title="页面控制"
        type="button"
        whileTap={reduceMotion ? undefined : { scale: 0.92 }}
      >
        <span className="theme-menu__trigger-icon"><SlidersHorizontal size={18} /></span>
        <ChevronUp className={isDockOpen ? "theme-menu__chevron is-open" : "theme-menu__chevron"} size={12} />
      </motion.button>
    </div>
  );
}
