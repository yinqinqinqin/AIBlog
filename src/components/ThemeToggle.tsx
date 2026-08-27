import { motion, useReducedMotion } from "motion/react";
import { ChevronUp, MoonStar, SlidersHorizontal, SunMedium } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useThemeStore } from "@/store/themeStore";
import MusicPlayer from "@/components/MusicPlayer";
import ScrollToTopButton from "@/components/ScrollToTopButton";

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

export default function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const reduceMotion = useReducedMotion();
  const [isDockOpen, setIsDockOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const hoverCloseTimerRef = useRef<number | null>(null);
  const isDark = theme === "dark";

  const cancelHoverClose = () => {
    if (hoverCloseTimerRef.current !== null) {
      window.clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  };

  const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    cancelHoverClose();
    setIsDockOpen(true);
  };

  const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    cancelHoverClose();
    hoverCloseTimerRef.current = window.setTimeout(() => {
      setIsDockOpen(false);
      hoverCloseTimerRef.current = null;
    }, 340);
  };

  useEffect(() => () => cancelHoverClose(), []);

  useEffect(() => {
    if (!isDockOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsDockOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDockOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDockOpen]);

  const switchTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    const transitionDocument = document as TransitionDocument;
    const updateTheme = () => setTheme(nextTheme);

    if (!reduceMotion && transitionDocument.startViewTransition) {
      transitionDocument.startViewTransition(updateTheme);
    } else {
      updateTheme();
    }
  };

  const toggleDock = () => setIsDockOpen((current) => !current);
  const getMenuItemTransition = (openDelay: number, closeDelay: number) => ({
    duration: reduceMotion ? 0 : 0.2,
    delay: reduceMotion ? 0 : isDockOpen ? openDelay : closeDelay,
    ease: [0.22, 1, 0.36, 1] as const,
  });

  return (
    <div
      className="theme-menu"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      ref={menuRef}
    >
      <div aria-hidden="true" className={`theme-menu__hover-zone${isDockOpen ? " is-open" : ""}`} />

      <motion.div
        animate={isDockOpen ? "open" : "closed"}
        aria-hidden={!isDockOpen}
        aria-label="页面控制"
        className={`theme-menu__controls${isDockOpen ? " is-open" : ""}`}
        id="control-dock-tray"
        initial={false}
        role="toolbar"
      >
        <motion.button
          animate={isDockOpen ? "open" : "closed"}
          aria-checked={!isDark}
          aria-label={`切换到${isDark ? "浅色" : "深色"}主题`}
          className={`theme-menu__theme-switch ${isDark ? "is-dark" : "is-light"}`}
          onClick={switchTheme}
          role="switch"
          tabIndex={isDockOpen ? 0 : -1}
          title={isDark ? "切换到浅色主题" : "切换到深色主题"}
          transition={getMenuItemTransition(0.045, 0.035)}
          type="button"
          variants={{
            closed: { opacity: 0, scale: 0.58, x: 58, y: 58 },
            open: { opacity: 1, scale: 1, x: 0, y: 0 },
          }}
          whileTap={reduceMotion ? undefined : { scale: 0.92 }}
        >
          <span className="theme-menu__theme-icon" aria-hidden="true">
            {isDark ? <MoonStar size={16} /> : <SunMedium size={16} />}
          </span>
        </motion.button>

        <MusicPlayer
          isFocusable={isDockOpen}
          transition={getMenuItemTransition(0, 0.07)}
          variants={{
            closed: { opacity: 0, scale: 0.58, x: 78, y: 0 },
            open: { opacity: 1, scale: 1, x: 0, y: 0 },
          }}
        />

        <ScrollToTopButton
          isFocusable={isDockOpen}
          transition={getMenuItemTransition(0.09, 0)}
          variants={{
            closed: { opacity: 0, scale: 0.58, x: 0, y: 78 },
            open: { opacity: 1, scale: 1, x: 0, y: 0 },
          }}
        />
      </motion.div>

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
