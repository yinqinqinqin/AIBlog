import type { Article, Category } from "@/data/blog";
import ArticleCard from "@/components/ArticleCard";
import SectionBadge from "@/components/SectionBadge";

type CategorySectionProps = {
  category: Category;
  articles: Article[];
};

export default function CategorySection({ category, articles }: CategorySectionProps) {
  return (
    <section className="content-shell category-section" id={category.anchor}>
      <div className="section-heading">
        <div>
          <SectionBadge text={category.label} />
        </div>
      </div>

      <div className="article-grid">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
}
