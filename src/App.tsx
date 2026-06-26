import { BrowserRouter, Route, Routes } from "react-router-dom";
import SplashCursor from "@/components/SplashCursor";
import AboutPage from "@/pages/AboutPage";
import ArticlePage from "@/pages/ArticlePage";
import CategoryPage from "@/pages/CategoryPage";
import HomePage from "@/pages/HomePage";

export default function App() {
  return (
    <BrowserRouter>
      <SplashCursor
        CURL={36}
        DENSITY_DISSIPATION={1.5}
        PRESSURE={0.35}
        VELOCITY_DISSIPATION={1.5}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/category/:categoryKey" element={<CategoryPage />} />
        <Route path="/article/:slug" element={<ArticlePage />} />
      </Routes>
    </BrowserRouter>
  );
}
