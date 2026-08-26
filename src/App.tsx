import { lazy, Suspense, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SplashCursor from "@/components/SplashCursor";
import ThemeToggle from "@/components/ThemeToggle";
import AboutPage from "@/pages/AboutPage";
import ArticlePage from "@/pages/ArticlePage";
import CategoryPage from "@/pages/CategoryPage";
import HomePage from "@/pages/HomePage";
import { navItems, siteMeta } from "@/data/blog";
import type { InterviewResourceBank } from "@/data/interviewResourceTypes";
import { applyTheme, useThemeStore } from "@/store/themeStore";

const CustomInterviewWikiPage = lazy(() => import("@/pages/CustomInterviewWikiPage"));
const GameTaOriginalFormatPage = lazy(() => import("@/pages/GameTaOriginalFormatPage"));
const TechnicalArtInterviewWikiPage = lazy(() => import("@/pages/TechnicalArtInterviewWikiPage"));
const MihoyoInterviewPage = lazy(async () => {
  const [{ default: ImportedInterviewWikiPage }, { default: bank }] = await Promise.all([
    import("@/pages/ImportedInterviewWikiPage"),
    import("@/data/generated/mihoyoInterviewBank.json"),
  ]);

  return {
    default: () => <ImportedInterviewWikiPage bank={bank as InterviewResourceBank} />,
  };
});

function RouteLoader() {
  return (
    <div aria-live="polite" className="route-loader" role="status">
      <span aria-hidden="true" />
      <p>正在载入视觉模块</p>
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="route-frame"
        exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -12 }}
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        key={location.pathname}
        transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <Suspense fallback={<RouteLoader />}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/category/:categoryKey" element={<CategoryPage />} />
            <Route path="/article/:slug" element={<ArticlePage />} />
            <Route path="/tools/ta-interview-wiki" element={<TechnicalArtInterviewWikiPage />} />
            <Route path="/tools/custom-interview-wiki" element={<CustomInterviewWikiPage />} />
            <Route path="/tools/mihoyo-ta-interview" element={<MihoyoInterviewPage />} />
            <Route path="/tools/game-ta-interview-100" element={<GameTaOriginalFormatPage />} />
            <Route path="/tools/game-ta-interview-100/:pageId" element={<GameTaOriginalFormatPage />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <SplashCursor
        CURL={36}
        DYE_RESOLUTION={768}
        DENSITY_DISSIPATION={1.5}
        PRESSURE={0.35}
        PRESSURE_ITERATIONS={12}
        RAINBOW_MODE
        SIM_RESOLUTION={96}
        VELOCITY_DISSIPATION={1.5}
      />
      <SiteHeader brand={siteMeta.brand} navItems={navItems} />
      <ThemeToggle />
      <AppRoutes />
    </BrowserRouter>
  );
}
