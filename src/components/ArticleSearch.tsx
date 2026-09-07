import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { articles, categoryLabelMap } from "@/data/blog";

const maxResults = 10;

export default function ArticleSearch() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().normalize("NFKC").toLocaleLowerCase();

  const matchingArticles = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

    return articles
      .filter((article) => {
        const searchableText = [
          article.title,
          article.excerpt,
          categoryLabelMap[article.category] ?? article.category,
          ...article.tags,
        ]
          .join(" ")
          .normalize("NFKC")
          .toLocaleLowerCase();

        return tokens.every((token) => searchableText.includes(token));
      })
      .sort((left, right) => {
        const leftTitle = left.title.normalize("NFKC").toLocaleLowerCase();
        const rightTitle = right.title.normalize("NFKC").toLocaleLowerCase();
        const leftScore = leftTitle.startsWith(normalizedQuery) ? 0 : leftTitle.includes(normalizedQuery) ? 1 : 2;
        const rightScore = rightTitle.startsWith(normalizedQuery) ? 0 : rightTitle.includes(normalizedQuery) ? 1 : 2;

        return leftScore - rightScore || right.date.localeCompare(left.date);
      });
  }, [normalizedQuery]);
  const results = matchingArticles.slice(0, maxResults);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => inputRef.current?.focus());

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

  const closeSearch = () => {
    setIsOpen(false);
    setQuery("");
  };

  const openArticle = (slug: string) => {
    closeSearch();
    navigate(`/article/${slug}`);
  };

  return (
    <>
      <button
        aria-label="搜索文章"
        className="site-header__search-button"
        onClick={() => setIsOpen(true)}
        title="搜索文章"
        type="button"
      >
        <Search size={15} strokeWidth={1.8} />
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="article-search"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            role="presentation"
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
          >
            <button
              aria-label="关闭搜索"
              className="article-search__backdrop"
              onClick={closeSearch}
              type="button"
            />

            <motion.section
              aria-label="文章搜索"
              aria-modal="true"
              className="article-search__panel"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
              role="dialog"
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="article-search__field">
                <Search aria-hidden="true" size={18} strokeWidth={1.8} />
                <input
                  aria-label="查询文章"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索标题、摘要或标签"
                  ref={inputRef}
                  type="search"
                  value={query}
                />
                <button aria-label="关闭搜索" onClick={closeSearch} title="关闭" type="button">
                  <X size={17} />
                </button>
              </div>

              {normalizedQuery ? (
                <>
                  <div className="article-search__summary" aria-live="polite">
                    <span>搜索结果</span>
                    <span>{matchingArticles.length} 篇</span>
                  </div>

                  <div className="article-search__results">
                    {results.length > 0 ? (
                      results.map((article) => (
                        <button
                          className="article-search__result"
                          key={article.slug}
                          onClick={() => openArticle(article.slug)}
                          type="button"
                        >
                          <span className="article-search__result-copy">
                            <strong>{article.title}</strong>
                            <small>
                              {categoryLabelMap[article.category]} · {article.date}
                            </small>
                          </span>
                          <ArrowUpRight aria-hidden="true" size={16} />
                        </button>
                      ))
                    ) : (
                      <div className="article-search__empty">没有匹配的文章</div>
                    )}
                  </div>
                </>
              ) : (
                <div className="article-search__idle">
                  <Search aria-hidden="true" size={22} strokeWidth={1.5} />
                  <span>输入关键词开始搜索</span>
                </div>
              )}
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
