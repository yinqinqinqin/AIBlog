import { ArrowLeft, Clock3 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import ArticleTextCover from "@/components/ArticleTextCover";
import MarkdownContent from "@/components/MarkdownContent";
import SectionBadge from "@/components/SectionBadge";
import { getArticleBySlug, getCategoryByKey } from "@/data/blog";

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

  const category = getCategoryByKey(article.category);
  const backHref = category?.href ?? "/";

  return (
    <main className="article-page">
      <div className="content-shell article-page__top">
        <Link className="article-page__back" to={backHref}>
          <ArrowLeft size={16} />
          <span>返回</span>
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
            {article.cover ? (
              <img alt={article.title} src={article.cover} />
            ) : (
              <ArticleTextCover article={article} className="article-layout__text-cover" />
            )}
          </div>

          <div className="article-layout__content article-content">
            {article.markdown ? <MarkdownContent source={article.markdown} /> : article.content?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </article>
      </div>
    </main>
  );
}
