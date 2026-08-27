import { categoryLabelMap, type Article } from "@/data/blog";

type ArticleTextCoverProps = {
  article: Article;
  className?: string;
};

export default function ArticleTextCover({ article, className = "" }: ArticleTextCoverProps) {
  const classNames = ["article-text-cover", className].filter(Boolean).join(" ");

  return (
    <div className={classNames} aria-label={article.title}>
      <div className="article-text-cover__brand">
        <span>TA JOURNAL</span>
        <span>{categoryLabelMap[article.category]}</span>
      </div>
      <div className="article-text-cover__copy">
        <h3>{article.title}</h3>
        <p>{article.excerpt}</p>
      </div>
    </div>
  );
}
