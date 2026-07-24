import { Link, useParams } from "react-router-dom";
import ArticleCard from "@/components/ArticleCard";
import CustomInterviewToolCard from "@/components/CustomInterviewToolCard";
import FooterSection from "@/components/FooterSection";
import SectionBadge from "@/components/SectionBadge";
import SiteHeader from "@/components/SiteHeader";
import StudyPlanSystem from "@/components/StudyPlanSystem";
import ToolCard from "@/components/ToolCard";
import {
  getArticlesByCategory,
  getCategoryByKey,
  isCategoryKey,
  navItems,
  siteMeta,
  studyPlanSystem,
} from "@/data/blog";

export default function CategoryPage() {
  const { categoryKey } = useParams();

  if (!isCategoryKey(categoryKey)) {
    return (
      <main className="article-page article-page--missing">
        <div className="content-shell article-page__top">
          <div className="article-page__missing">
            <SectionBadge text="未找到分类" />
            <h1>当前分类不存在。</h1>
            <Link className="button button--primary" to="/">
              返回首页
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const category = getCategoryByKey(categoryKey);
  const categoryArticles = getArticlesByCategory(categoryKey);
  const isStudyPlanPage = categoryKey === "study-plan";
  const isToolsPage = categoryKey === "tools";

  return (
    <div className="blog-page">
      <SiteHeader brand={siteMeta.brand} navItems={navItems} />

      <main className="category-page">
        <div className="content-shell category-page__top">
          <section className="category-page__hero">
            <SectionBadge text={category?.label ?? ""} />
          </section>

          {isStudyPlanPage ? (
            <StudyPlanSystem plan={studyPlanSystem} />
          ) : isToolsPage ? (
            <section className="tool-grid" aria-label="工具列表">
              <ToolCard />
              <CustomInterviewToolCard />
            </section>
          ) : (
            <section className="article-grid">
              {categoryArticles.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </section>
          )}
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
