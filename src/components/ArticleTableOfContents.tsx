import { ListTree } from "lucide-react";
import { useEffect, useState } from "react";

type ArticleTableOfContentsProps = {
  source: string;
};

type TocItem = {
  id: string;
  label: string;
  level: number;
};

export default function ArticleTableOfContents({ source }: ArticleTableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    if (!source) {
      setItems([]);
      setActiveId("");
      return undefined;
    }

    let headings: HTMLElement[] = [];
    const frame = window.requestAnimationFrame(() => {
      headings = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".article-content__markdown h2[id], .article-content__markdown h3[id], .article-content__markdown h4[id]",
        ),
      );

      const nextItems = headings.map((heading) => ({
        id: heading.id,
        label: heading.textContent?.trim() || "未命名章节",
        level: Number(heading.tagName.slice(1)),
      }));

      setItems(nextItems);
      setActiveId(nextItems[0]?.id ?? "");
    });

    const updateActiveHeading = () => {
      if (headings.length === 0) return;

      const current =
        [...headings].reverse().find((heading) => heading.getBoundingClientRect().top <= 176) ?? headings[0];
      setActiveId(current.id);
    };

    window.addEventListener("scroll", updateActiveHeading, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveHeading);
      headings = [];
    };
  }, [source]);

  const scrollToHeading = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <aside aria-label="文章章节目录" className="article-toc">
      <div className="article-toc__heading">
        <ListTree aria-hidden="true" size={15} strokeWidth={1.8} />
        <strong>目录</strong>
      </div>

      <nav aria-label="文章章节">
        {items.length > 0 ? (
          items.map((item) => (
            <button
              aria-current={item.id === activeId ? "location" : undefined}
              className={`article-toc__item article-toc__item--level-${item.level}${item.id === activeId ? " is-active" : ""}`}
              key={item.id}
              onClick={() => scrollToHeading(item.id)}
              title={item.label}
              type="button"
            >
              {item.label}
            </button>
          ))
        ) : (
          <span className="article-toc__empty">正文</span>
        )}
      </nav>
    </aside>
  );
}
