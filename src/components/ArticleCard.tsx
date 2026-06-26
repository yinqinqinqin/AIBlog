import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { categoryLabelMap, type Article } from "@/data/blog";

type ArticleCardProps = {
  article: Article;
};

export default function ArticleCard({ article }: ArticleCardProps) {
  const year = article.date.slice(0, 4);
  const badges = [categoryLabelMap[article.category], article.readTime].filter(Boolean);
  const chipGradientId = `article-card-chip-${article.slug}`;
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
        <div className="article-card__face">
          <div aria-hidden="true" className="article-card__face-frame" />
          <img aria-hidden="true" className="article-card__face-image" src={article.cover} />
          <div aria-hidden="true" className="article-card__face-glow" />

          <div className="article-card__face-chip" aria-hidden="true">
            <svg fill="none" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
              <path
                clipRule="evenodd"
                d="M20 8H40V14C40.0016 14.5299 40.2128 15.0377 40.5875 15.4125C40.9623 15.7872 41.4701 15.9984 42 16H59V24H42C41.4701 24.0016 40.9623 24.2128 40.5875 24.5875C40.2128 24.9623 40.0016 25.4701 40 26V52H20V8ZM18 8H8.00039C4.47435 8 1.56576 10.6083 1.08 14H18V8ZM1 16V24V26V34V36V44H18V36H1V34H18V26H1V24H18V16H1ZM1.08 46C1.56576 49.3917 4.47435 52 8.00039 52H18V46H1.08ZM42 14V8H52.0004C55.5264 8 58.4342 10.6084 58.92 14H42ZM59 26H42V34H59V26ZM59 36H42V44H59V36ZM52.0004 52H42V46H58.92C58.4342 49.3916 55.5264 52 52.0004 52Z"
                fill={`url(#${chipGradientId})`}
                fillRule="evenodd"
              />
              <path
                clipRule="evenodd"
                d="M1.02453 14.4146C1.00608 14.609 0.998061 14.8045 1.00039 15C1.00039 14.8028 1.00854 14.6076 1.02453 14.4146ZM1.00039 45C0.998061 45.1955 1.00608 45.391 1.02453 45.5854C1.00854 45.3924 1.00039 45.1972 1.00039 45ZM59.0004 15C59.0026 14.8176 58.9955 14.6353 58.9794 14.4538C58.9933 14.634 59.0004 14.8162 59.0004 15ZM59.0004 45C59.0004 45.1838 58.9933 45.366 58.9794 45.5462C58.9955 45.3647 59.0026 45.1824 59.0004 45Z"
                fill="#B7B7B7"
                fillRule="evenodd"
              />
              <defs>
                <linearGradient id={chipGradientId} x1="30" x2="30" y1="8" y2="52" gradientUnits="userSpaceOnUse">
                  <stop stopColor="white" />
                  <stop offset="1" stopColor="#999999" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="article-card__face-brand" aria-hidden="true">
            <strong>TA JOURNAL</strong>
            <span>{categoryLabelMap[article.category]}</span>
          </div>

          <div className="article-card__face-copy">
            <p className="article-card__eyebrow">{article.date}</p>
            <h3 className="article-card__title">{article.title}</h3>

            <div className="article-card__tags">
              <div className="article-card__tag-list">
                {badges.map((badge) => (
                  <span key={badge}>{badge}</span>
                ))}
              </div>

              <p className="article-card__meta">{year}</p>
            </div>
          </div>

          <div className="article-card__face-mark" aria-hidden="true">
            <span />
            <span />
          </div>
        </div>
      </div>
    </Link>
  );
}
