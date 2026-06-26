import { ArrowLeft, Clock3 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import ArticleCard from "@/components/ArticleCard";
import SectionBadge from "@/components/SectionBadge";
import { articles, getArticleBySlug, getCategoryByKey } from "@/data/blog";

export default function ArticlePage() {
  const { slug } = useParams();
  const article = getArticleBySlug(slug);

  if (!article) {
    return (
      <main className="article-page article-page--missing">
        <div className="content-shell article-page__missing">
          <SectionBadge text="未找到文章" />
          <h1>当前链接没有对应内容。</h1>
          <Link className="button button--primary" to="/">
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  const relatedArticles = articles
    .filter((item) => item.slug !== article.slug && item.category === article.category)
    .slice(0, 2);
  const category = getCategoryByKey(article.category);

  return (
    <main className="article-page">
      <div className="content-shell article-page__top">
        <Link className="article-page__back" to="/">
          <ArrowLeft size={16} />
          <span>返回首页</span>
        </Link>

        <article className="article-layout">
          <div className="article-hero">
            <SectionBadge text={category?.label ?? article.category} />
            <h1>{article.title}</h1>

            <div className="article-hero__meta">
              <span>{article.date}</span>
              <span>
                <Clock3 size={14} />
                {article.readTime}
              </span>
            </div>

            <p>{article.excerpt}</p>
          </div>

          <div className="article-layout__cover">
            <img alt={article.title} src={article.cover} />
          </div>

          <div className="article-layout__content">
            {article.content.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>

        {relatedArticles.length > 0 ? (
          <section className="article-related">
            <div className="section-heading">
              <div>
                <SectionBadge text="相关文章" />
                <h2>同分类下的更多内容</h2>
              </div>
            </div>

            <div className="article-grid">
              {relatedArticles.map((item) => (
                <ArticleCard key={item.slug} article={item} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
