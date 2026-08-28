import { lazy, Suspense, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import ThemeToggle from "@/components/ThemeToggle";
import { navItems, siteMeta } from "@/data/blog";
import type { InterviewResourceBank } from "@/data/interviewResourceTypes";
import { applyTheme, useThemeStore } from "@/store/themeStore";

declare global {
  interface Window {
    __ENTRY_LOADER_STARTED_AT?: number;
  }
}

const SplashCursor = lazy(() => import("@/components/SplashCursor"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const ArticlePage = lazy(() => import("@/pages/ArticlePage"));
const CategoryPage = lazy(() => import("@/pages/CategoryPage"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const CustomInterviewWikiPage = lazy(() => import("@/pages/CustomInterviewWikiPage"));
const GameTaOriginalFormatPage = lazy(() => import("@/pages/GameTaOriginalFormatPage"));
const TechnicalArtInterviewWikiPage = lazy(() => import("@/pages/TechnicalArtInterviewWikiPage"));
const Ue5GpuRenderdocPage = lazy(() => import("@/pages/Ue5GpuRenderdocPage"));
const Ue5MobileOptimizationPage = lazy(() => import("@/pages/Ue5MobileOptimizationPage"));
const Ue5AssetPipelinePage = lazy(() => import("@/pages/Ue5AssetPipelinePage"));
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

function EntryLoaderController() {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const loader = document.getElementById("entry-loader");
    if (!loader) return undefined;

    const startedAt = Number(window.__ENTRY_LOADER_STARTED_AT || performance.now());
    const minimumVisibleMs = reduceMotion ? 120 : 1200;
    const elapsed = performance.now() - startedAt;
    const delay = Math.max(160, minimumVisibleMs - elapsed);

    const dismissTimer = window.setTimeout(() => {
      loader.classList.add("entry-loader--dismissed");
    }, delay);

    const removeTimer = window.setTimeout(() => {
      loader.remove();
      window.dispatchEvent(new CustomEvent("entry-loader:ready"));
    }, delay + (reduceMotion ? 40 : 620));

    return () => {
      window.clearTimeout(dismissTimer);
      window.clearTimeout(removeTimer);
    };
  }, [reduceMotion]);

  return null;
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
            <Route path="/tools/ue5-gpu-renderdoc" element={<Ue5GpuRenderdocPage />} />
            <Route path="/tools/ue5-gpu-renderdoc/:pageId" element={<Ue5GpuRenderdocPage />} />
            <Route path="/tools/ue5-mobile-optimization" element={<Ue5MobileOptimizationPage />} />
            <Route path="/tools/ue5-mobile-optimization/:pageId" element={<Ue5MobileOptimizationPage />} />
            <Route path="/tools/ue5-asset-pipeline" element={<Ue5AssetPipelinePage />} />
            <Route path="/tools/ue5-asset-pipeline/:pageId" element={<Ue5AssetPipelinePage />} />
            <Route path="/tools" element={<Navigate replace to="/category/knowledge-base" />} />
            <Route path="/knowledge-base/ta-interview-wiki" element={<TechnicalArtInterviewWikiPage />} />
            <Route path="/knowledge-base/custom-interview-wiki" element={<CustomInterviewWikiPage />} />
            <Route path="/knowledge-base/mihoyo-ta-interview" element={<MihoyoInterviewPage />} />
            <Route path="/knowledge-base/game-ta-interview-100" element={<GameTaOriginalFormatPage />} />
            <Route path="/knowledge-base/game-ta-interview-100/:pageId" element={<GameTaOriginalFormatPage />} />
            <Route path="/knowledge-base/ue5-gpu-renderdoc" element={<Ue5GpuRenderdocPage />} />
            <Route path="/knowledge-base/ue5-gpu-renderdoc/:pageId" element={<Ue5GpuRenderdocPage />} />
            <Route path="/knowledge-base/ue5-mobile-optimization" element={<Ue5MobileOptimizationPage />} />
            <Route path="/knowledge-base/ue5-mobile-optimization/:pageId" element={<Ue5MobileOptimizationPage />} />
            <Route path="/knowledge-base/ue5-asset-pipeline" element={<Ue5AssetPipelinePage />} />
            <Route path="/knowledge-base/ue5-asset-pipeline/:pageId" element={<Ue5AssetPipelinePage />} />
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
      <EntryLoaderController />
      <Suspense fallback={null}>
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
      </Suspense>
      <SiteHeader brand={siteMeta.brand} navItems={navItems} />
      <ThemeToggle />
      <AppRoutes />
    </BrowserRouter>
  );
}
