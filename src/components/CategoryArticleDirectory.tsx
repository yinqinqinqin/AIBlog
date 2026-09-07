import { BookOpenText } from "lucide-react";
import { Link } from "react-router-dom";
import type { Article } from "@/data/blog";

type CategoryArticleDirectoryProps = {
  articles: Article[];
};

export default function CategoryArticleDirectory({ articles }: CategoryArticleDirectoryProps) {
  return (
    <aside aria-label="文章目录" className="category-article-directory">
      <div className="category-article-directory__heading">
        <BookOpenText aria-hidden="true" size={15} strokeWidth={1.8} />
        <strong>目录</strong>
        <span>{articles.length}</span>
      </div>

      <nav aria-label="分类文章目录">
        {articles.map((article, index) => (
          <Link className="category-article-directory__item" key={article.slug} to={`/article/${article.slug}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{article.title}</strong>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
