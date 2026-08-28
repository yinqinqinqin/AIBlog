import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import ArticleTextCover from "@/components/ArticleTextCover";
import BorderGlow from "@/components/BorderGlow";
import RevealOnView from "@/components/RevealOnView";
import { categoryLabelMap, type Article } from "@/data/blog";
import useEntryReady from "@/hooks/useEntryReady";
import { useFeaturedStore } from "@/store/featuredStore";
import { useThemeStore } from "@/store/themeStore";

type FeaturedCarouselProps = {
  articles: Article[];
};

export default function FeaturedCarousel({ articles }: FeaturedCarouselProps) {
  const theme = useThemeStore((state) => state.theme);
  const { currentIndex, next, setCurrentIndex } = useFeaturedStore();
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const entryReady = useEntryReady();
  const activeArticle = articles[currentIndex] ?? articles[0];

  useEffect(() => {
    if (articles.length <= 1 || isPaused || reduceMotion) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      next(articles.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [articles.length, isPaused, next, reduceMotion]);

  if (!activeArticle) {
    return null;
  }

  return (
    <RevealOnView amount={0.1} className="content-shell featured-carousel" enabled={entryReady} margin="0px 0px -6% 0px">
      <section id="featured">
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
          <div
            className="featured-carousel__shell-inner"
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
            }}
            onFocusCapture={() => setIsPaused(true)}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="featured-carousel__slide"
                exit={reduceMotion ? undefined : { opacity: 0, x: -16 }}
                initial={reduceMotion ? false : { opacity: 0, x: 16 }}
                key={activeArticle.slug}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link className="featured-carousel__card-link" to={`/article/${activeArticle.slug}`}>
                  <div className="featured-carousel__image">
                    {activeArticle.cover ? (
                      <>
                        <img alt={activeArticle.title} src={activeArticle.cover} />
                        <div className="featured-carousel__image-overlay" />
                      </>
                    ) : (
                      <ArticleTextCover article={activeArticle} className="featured-carousel__image-placeholder" />
                    )}

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
              </motion.div>
            </AnimatePresence>
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
    </RevealOnView>
  );
}
