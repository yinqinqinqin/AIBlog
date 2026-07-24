import { useEffect } from "react";
import { BookOpen, Calendar, ChevronLeft, ChevronRight, Clock, Pin, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import BorderGlow from "@/components/BorderGlow";
import { categoryLabelMap, type Article } from "@/data/blog";
import { useFeaturedStore } from "@/store/featuredStore";
import { useThemeStore } from "@/store/themeStore";

type FeaturedCarouselProps = {
  articles: Article[];
};

export default function FeaturedCarousel({ articles }: FeaturedCarouselProps) {
  const theme = useThemeStore((state) => state.theme);
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
        backgroundColor="var(--featured-border-glow-bg)"
        borderRadius={36}
        className="featured-carousel__shell featured-carousel__shell--glow"
        colors={["var(--theme-glow-1)", "var(--theme-glow-2)", "var(--theme-glow-3)"]}
        coneSpread={20}
        edgeSensitivity={22}
        fillOpacity={0.28}
        glowColor={theme === "light" ? "258 56 72" : "200 90 82"}
        glowIntensity={0.78}
        glowRadius={34}
      >
        <div className="featured-carousel__shell-inner">
          <Link className="featured-carousel__card-link" to={`/article/${activeArticle.slug}`}>
            <div className="featured-carousel__image">
              {activeArticle.cover ? (
                <>
                  <img alt={activeArticle.title} src={activeArticle.cover} />
                  <div className="featured-carousel__image-overlay" />
                </>
              ) : (
                <div className="featured-carousel__image-placeholder" aria-hidden="true">
                  <BookOpen size={40} />
                </div>
              )}

              <div className="featured-carousel__pin">
                <Pin size={12} />
                <span>置顶</span>
              </div>
            </div>

            <div className="featured-carousel__content">
              <div className="featured-carousel__meta-row">
                <span className="featured-carousel__category">{categoryLabelMap[activeArticle.category]}</span>
                <span>
                  <Calendar size={13} />
                  {activeArticle.date}
                </span>
                <span>
                  <Clock size={13} />
                  {activeArticle.readTime}
                </span>
              </div>

              <h2>{activeArticle.title}</h2>
              <p>{activeArticle.excerpt}</p>

              {activeArticle.tags.length > 0 ? (
                <div className="featured-carousel__tag-list">
                  {activeArticle.tags.slice(0, 3).map((tag) => (
                    <span className="featured-carousel__tag" key={tag}>
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </Link>
        </div>

        <div className="featured-carousel__nav featured-carousel__nav--sides">
          <button aria-label="上一张" onClick={() => setCurrentIndex((currentIndex - 1 + articles.length) % articles.length)} type="button">
            <ChevronLeft size={18} />
          </button>
          <button aria-label="下一张" onClick={() => next(articles.length)} type="button">
            <ChevronRight size={18} />
          </button>
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
      </BorderGlow>
    </section>
  );
}
