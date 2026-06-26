import CategorySection from "@/components/CategorySection";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import FooterSection from "@/components/FooterSection";
import HeroSection from "@/components/HeroSection";
import SiteHeader from "@/components/SiteHeader";
import {
  categories,
  getArticlesByCategory,
  getFeaturedArticles,
  navItems,
  siteMeta,
} from "@/data/blog";

export default function HomePage() {
  const featuredArticles = getFeaturedArticles();

  return (
    <div className="blog-page" id="top">
      <SiteHeader brand={siteMeta.brand} navItems={navItems} />

      <main>
        <HeroSection
          poster={siteMeta.heroPoster}
          titleHref={siteMeta.heroTitleHref}
          title={siteMeta.title}
        />

        <FeaturedCarousel articles={featuredArticles} />

        {categories.map((category) => (
          <CategorySection
            key={category.key}
            articles={getArticlesByCategory(category.key)}
            category={category}
          />
        ))}
      </main>

      <FooterSection />
    </div>
  );
}
