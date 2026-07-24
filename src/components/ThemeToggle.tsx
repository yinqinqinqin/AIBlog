import { MoonStar, SunMedium } from "lucide-react";
import { useThemeStore } from "@/store/themeStore";

export default function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isDark = theme === "dark";

  return (
    <button
      aria-label={isDark ? "切换到浅色主题" : "切换到深色主题"}
      className="theme-toggle"
      onClick={toggleTheme}
      type="button"
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        {isDark ? <SunMedium size={16} /> : <MoonStar size={16} />}
      </span>
      <span className="theme-toggle__copy">
        <strong>{isDark ? "浅色" : "深色"}</strong>
        <span>主题</span>
      </span>
    </button>
  );
}
