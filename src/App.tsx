import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import SplashCursor from "@/components/SplashCursor";
import ThemeToggle from "@/components/ThemeToggle";
import AboutPage from "@/pages/AboutPage";
import ArticlePage from "@/pages/ArticlePage";
import CategoryPage from "@/pages/CategoryPage";
import CustomInterviewWikiPage from "@/pages/CustomInterviewWikiPage";
import GameTaOriginalFormatPage from "@/pages/GameTaOriginalFormatPage";
import HomePage from "@/pages/HomePage";
import ImportedInterviewWikiPage from "@/pages/ImportedInterviewWikiPage";
import TechnicalArtInterviewWikiPage from "@/pages/TechnicalArtInterviewWikiPage";
import mihoyoInterviewBank from "@/data/generated/mihoyoInterviewBank.json";
import type { InterviewResourceBank } from "@/data/interviewResourceTypes";
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
        <Route
          path="/tools/mihoyo-ta-interview"
          element={<ImportedInterviewWikiPage bank={mihoyoInterviewBank as InterviewResourceBank} />}
        />
        <Route
          path="/tools/game-ta-interview-100"
          element={<GameTaOriginalFormatPage />}
        />
        <Route path="/tools/game-ta-interview-100/:pageId" element={<GameTaOriginalFormatPage />} />
      </Routes>
    </BrowserRouter>
  );
}
