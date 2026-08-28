import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Article, Category } from "@/data/blog";
import ArticleCard from "@/components/ArticleCard";
import SectionBadge from "@/components/SectionBadge";
import useEntryReady from "@/hooks/useEntryReady";

type CategorySectionProps = {
  category: Category;
  articles: Article[];
  customContent?: ReactNode;
};

export default function CategorySection({ category, articles, customContent }: CategorySectionProps) {
  const reduceMotion = useReducedMotion();
  const entryReady = useEntryReady();
  const canObserveViewport = typeof IntersectionObserver !== "undefined";
  const shouldRevealOnView = entryReady && canObserveViewport;
  const itemVariants = {
    hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 26, filter: "blur(10px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.56, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <section className="content-shell category-section" id={category.anchor}>
      <motion.div
        animate={!canObserveViewport ? "visible" : undefined}
        className="section-heading"
        initial={reduceMotion ? false : "hidden"}
        variants={itemVariants}
        viewport={shouldRevealOnView ? { amount: 0.35, once: true } : undefined}
        whileInView={shouldRevealOnView ? "visible" : undefined}
      >
        <div>
          <SectionBadge text={category.label} />
        </div>
      </motion.div>

      {customContent ? (
        <motion.div
          animate={!canObserveViewport ? "visible" : undefined}
          initial={reduceMotion ? false : "hidden"}
          variants={itemVariants}
          viewport={shouldRevealOnView ? { amount: 0.12, once: true } : undefined}
          whileInView={shouldRevealOnView ? "visible" : undefined}
        >
          {customContent}
        </motion.div>
      ) : (
        <motion.div
          animate={!canObserveViewport ? "visible" : undefined}
          className="article-grid"
        >
          {articles.map((article, index) => (
            <motion.div
              animate={!canObserveViewport ? "visible" : undefined}
              className="article-card-motion"
              initial={reduceMotion ? false : "hidden"}
              key={article.slug}
              variants={{
                hidden: itemVariants.hidden,
                visible: {
                  ...itemVariants.visible,
                  transition: {
                    duration: 0.56,
                    delay: reduceMotion ? 0 : Math.min(index % 2, 1) * 0.06,
                    ease: [0.22, 1, 0.36, 1] as const,
                  },
                },
              }}
              viewport={shouldRevealOnView ? { amount: 0.18, margin: "0px 0px -10% 0px", once: true } : undefined}
              whileInView={shouldRevealOnView ? "visible" : undefined}
            >
              <ArticleCard article={article} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
