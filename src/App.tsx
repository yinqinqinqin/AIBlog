import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import SplashCursor from "@/components/SplashCursor";
import ThemeToggle from "@/components/ThemeToggle";
import AboutPage from "@/pages/AboutPage";
import ArticlePage from "@/pages/ArticlePage";
import CategoryPage from "@/pages/CategoryPage";
import CustomInterviewWikiPage from "@/pages/CustomInterviewWikiPage";
import HomePage from "@/pages/HomePage";
import TechnicalArtInterviewWikiPage from "@/pages/TechnicalArtInterviewWikiPage";
import { applyTheme, useThemeStore } from "@/store/themeStore";

export default function App() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <SplashCursor
        CURL={36}
        DENSITY_DISSIPATION={1.5}
        PRESSURE={0.35}
        RAINBOW_MODE
        VELOCITY_DISSIPATION={1.5}
        key={`splash-${theme}`}
      />
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/category/:categoryKey" element={<CategoryPage />} />
        <Route path="/article/:slug" element={<ArticlePage />} />
        <Route path="/tools/ta-interview-wiki" element={<TechnicalArtInterviewWikiPage />} />
        <Route path="/tools/custom-interview-wiki" element={<CustomInterviewWikiPage />} />
      </Routes>
    </BrowserRouter>
  );
}
