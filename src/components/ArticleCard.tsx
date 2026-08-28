import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import ArticleTextCover from "@/components/ArticleTextCover";
import { categoryLabelMap, type Article } from "@/data/blog";

type ArticleCardProps = {
  article: Article;
};

export default function ArticleCard({ article }: ArticleCardProps) {
  const year = article.date.slice(0, 4);
  const badges = [categoryLabelMap[article.category]].filter(Boolean);
  const previewTags = article.tags.slice(0, 2);
  const hasCover = Boolean(article.cover);
  const tintPalette = [
    "#fbcfe8",
    "#c7d2fe",
    "#fef3c7",
    "#93c5fd",
    "#bbf7d0",
    "#fdba74",
  ];
  const tintIndex =
    article.slug.split("").reduce((total, char) => total + char.charCodeAt(0), 0) %
    tintPalette.length;

  return (
    <Link
      className="article-card"
      style={{ "--article-card-tint": tintPalette[tintIndex] } as CSSProperties}
      to={`/article/${article.slug}`}
    >
      <div className="article-card__cover">
        <div className={`article-card__face${hasCover ? "" : " article-card__face--text-cover"}`}>
          <div aria-hidden="true" className="article-card__face-frame" />
          {hasCover ? (
            <img
              aria-hidden="true"
              className="article-card__face-image"
              decoding="async"
              loading="lazy"
              src={article.cover}
            />
          ) : (
            <ArticleTextCover article={article} className="article-card__text-cover" />
          )}
          <div aria-hidden="true" className="article-card__face-glow" />

          {hasCover ? (
            <div className="article-card__face-brand" aria-hidden="true">
              <strong>AnHao</strong>
              <span>{categoryLabelMap[article.category]}</span>
            </div>
          ) : null}

        </div>
      </div>

      <div className="article-card__body">
        <div className="article-card__kicker">
          <span>{badges[0]}</span>
          <span>{article.readTime}</span>
        </div>

        <h3 className="article-card__title">{article.title}</h3>
        <p className="article-card__summary">{article.excerpt}</p>

        <div className="article-card__tags">
          <div className="article-card__tag-list">
            {previewTags.length > 0
              ? previewTags.map((tag) => <span key={tag}>{tag}</span>)
              : badges.map((badge) => <span key={badge}>{badge}</span>)}
          </div>

          <p className="article-card__meta">{year}</p>
        </div>
      </div>
    </Link>
  );
}
