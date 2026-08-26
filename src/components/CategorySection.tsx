import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Article, Category } from "@/data/blog";
import ArticleCard from "@/components/ArticleCard";
import SectionBadge from "@/components/SectionBadge";

type CategorySectionProps = {
  category: Category;
  articles: Article[];
  customContent?: ReactNode;
};

export default function CategorySection({ category, articles, customContent }: CategorySectionProps) {
  const reduceMotion = useReducedMotion();
  const canObserveViewport = typeof IntersectionObserver !== "undefined";
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } },
  };
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
        viewport={canObserveViewport ? { amount: 0.35, once: true } : undefined}
        whileInView={canObserveViewport ? "visible" : undefined}
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
          viewport={canObserveViewport ? { amount: 0.12, once: true } : undefined}
          whileInView={canObserveViewport ? "visible" : undefined}
        >
          {customContent}
        </motion.div>
      ) : (
        <motion.div
          animate={!canObserveViewport ? "visible" : undefined}
          className="article-grid"
          initial={reduceMotion ? false : "hidden"}
          variants={containerVariants}
          viewport={canObserveViewport ? { amount: 0.08, once: true } : undefined}
          whileInView={canObserveViewport ? "visible" : undefined}
        >
          {articles.map((article) => (
            <motion.div key={article.slug} variants={itemVariants}>
              <ArticleCard article={article} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
