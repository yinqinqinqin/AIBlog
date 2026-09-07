import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, ListTree, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { articles, categoryLabelMap, type CategoryKey } from "@/data/blog";

const directoryCategories: CategoryKey[] = ["portfolio", "learning-notes"];

export default function ArticleDirectory() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const groupedArticles = useMemo(
    () =>
      directoryCategories.map((category) => ({
        articles: articles.filter((article) => article.category === category),
        category,
      })),
    [],
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const openArticle = (slug: string) => {
    setIsOpen(false);
    navigate(`/article/${slug}`);
  };

  return (
    <>
      <button
        aria-label="文章目录"
        className="site-header__directory-button"
        onClick={() => setIsOpen(true)}
        title="文章目录"
        type="button"
      >
        <ListTree size={15} strokeWidth={1.8} />
        <span>目录</span>
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="article-directory"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
          >
            <button
              aria-label="关闭文章目录"
              className="article-directory__backdrop"
              onClick={() => setIsOpen(false)}
              type="button"
            />

            <motion.aside
              animate={{ opacity: 1, x: 0 }}
              aria-label="文章目录"
              aria-modal="true"
              className="article-directory__panel"
              exit={reduceMotion ? undefined : { opacity: 0, x: -24 }}
              initial={reduceMotion ? false : { opacity: 0, x: -24 }}
              role="dialog"
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="article-directory__header">
                <div>
                  <span>CONTENTS</span>
                  <strong>文章目录</strong>
                </div>
                <button aria-label="关闭文章目录" onClick={() => setIsOpen(false)} title="关闭" type="button">
                  <X size={17} />
                </button>
              </div>

              <div className="article-directory__groups">
                {groupedArticles.map((group) => (
                  <section className="article-directory__group" key={group.category}>
                    <div className="article-directory__group-title">
                      <strong>{categoryLabelMap[group.category]}</strong>
                      <span>{group.articles.length}</span>
                    </div>

                    <div className="article-directory__items">
                      {group.articles.map((article, index) => (
                        <button
                          className="article-directory__item"
                          key={article.slug}
                          onClick={() => openArticle(article.slug)}
                          type="button"
                        >
                          <span className="article-directory__index">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="article-directory__title">{article.title}</span>
                          <ArrowUpRight aria-hidden="true" size={14} />
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
