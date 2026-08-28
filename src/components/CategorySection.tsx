import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Article, Category } from "@/data/blog";
import ArticleCard from "@/components/ArticleCard";
import RevealOnView from "@/components/RevealOnView";
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
  const itemVariants = {
    hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 26, filter: "blur(10px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.56, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <section className="content-shell category-section" id={category.anchor}>
      <motion.div
        animate={entryReady ? "visible" : "hidden"}
        className="section-heading"
        initial={reduceMotion ? false : "hidden"}
        variants={itemVariants}
      >
        <div>
          <SectionBadge text={category.label} />
        </div>
      </motion.div>

      {customContent ? (
        <motion.div
          animate={entryReady ? "visible" : "hidden"}
          initial={reduceMotion ? false : "hidden"}
          variants={itemVariants}
        >
          {customContent}
        </motion.div>
      ) : (
        <div className="article-grid">
          {articles.map((article, index) => (
            <RevealOnView
              className="article-card-motion"
              delay={Math.min(index % 2, 1) * 0.06}
              enabled={entryReady}
              key={article.slug}
            >
              <ArticleCard article={article} />
            </RevealOnView>
          ))}
        </div>
      )}
    </section>
  );
}
