import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import ArticleCard from "@/components/ArticleCard";
import SectionBadge from "@/components/SectionBadge";
import SiteHeader from "@/components/SiteHeader";
import {
  getArticlesByCategory,
  getCategoryByKey,
  isCategoryKey,
  navItems,
  siteMeta,
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

  return (
    <div className="blog-page">
      <SiteHeader brand={siteMeta.brand} navItems={navItems} />

      <main className="category-page">
        <div className="content-shell category-page__top">
          <Link className="article-page__back" to="/">
            <ArrowLeft size={16} />
            <span>返回首页</span>
          </Link>

          <section className="category-page__hero">
            <SectionBadge text={category?.label ?? ""} />
            <h1>{category?.description}</h1>
            <p>当前分类收录 {categoryArticles.length} 篇内容，作为独立页面浏览，而不是首页锚点跳转。</p>
          </section>

          <section className="article-grid">
            {categoryArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
