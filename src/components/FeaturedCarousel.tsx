import { useEffect } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import BorderGlow from "@/components/BorderGlow";
import SectionBadge from "@/components/SectionBadge";
import type { Article } from "@/data/blog";
import { useFeaturedStore } from "@/store/featuredStore";

type FeaturedCarouselProps = {
  articles: Article[];
};

export default function FeaturedCarousel({ articles }: FeaturedCarouselProps) {
  const { currentIndex, next, setCurrentIndex } = useFeaturedStore();
  const activeArticle = articles[currentIndex] ?? articles[0];

  useEffect(() => {
    if (articles.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      next(articles.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [articles.length, next]);

  if (!activeArticle) {
    return null;
  }

  return (
    <section className="content-shell featured-carousel" id="featured">
      <BorderGlow
        animated
        backgroundColor="#0f0b17"
        borderRadius={36}
        className="featured-carousel__shell featured-carousel__shell--glow"
        colors={["#c084fc", "#f472b6", "#38bdf8"]}
        coneSpread={20}
        edgeSensitivity={22}
        fillOpacity={0.28}
        glowColor="200 90 82"
        glowIntensity={0.78}
        glowRadius={34}
      >
        <div className="featured-carousel__shell-inner">
          <div className="featured-carousel__content">
            <SectionBadge text="置顶轮播" />
            <h2>{activeArticle.title}</h2>
            <p>{activeArticle.excerpt}</p>

            <div className="featured-carousel__meta">
              <span>{activeArticle.date}</span>
              <span>{activeArticle.readTime}</span>
              <span>{activeArticle.tags.join(" / ")}</span>
            </div>

            <div className="featured-carousel__actions">
              <Link className="featured-carousel__cta" to={`/article/${activeArticle.slug}`}>
                <span>阅读文章</span>
                <span className="featured-carousel__cta-icon" aria-hidden="true">
                  <ArrowRight size={14} />
                </span>
              </Link>
            </div>

            <div className="featured-carousel__dots" role="tablist" aria-label="置顶文章切换">
              {articles.map((article, index) => (
                <button
                  key={article.slug}
                  aria-label={`查看 ${article.title}`}
                  aria-pressed={index === currentIndex}
                  className={index === currentIndex ? "is-active" : ""}
                  onClick={() => setCurrentIndex(index)}
                  type="button"
                />
              ))}
            </div>
          </div>

          <div className="featured-carousel__image">
            <img alt={activeArticle.title} src={activeArticle.cover} />
          </div>
        </div>

        <div className="featured-carousel__nav featured-carousel__nav--sides">
          <button aria-label="上一张" onClick={() => setCurrentIndex((currentIndex - 1 + articles.length) % articles.length)} type="button">
            <ChevronLeft size={18} />
          </button>
          <button aria-label="下一张" onClick={() => next(articles.length)} type="button">
            <ChevronRight size={18} />
          </button>
        </div>
      </BorderGlow>
    </section>
  );
}
