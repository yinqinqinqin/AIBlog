import { BookOpenText, ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { Article } from "@/data/blog";

type CategoryArticleDirectoryProps = {
  articles: Article[];
};

const groupLabels: Record<string, string> = {
  ErrorNote: "错误记录",
  Interview: "面试",
  KeyWordAndNode: "关键字与节点",
  RenderTheory: "渲染理论",
  "UE编辑器插件C++": "UE 编辑器插件",
  性能优化: "性能优化",
  "Technical Documentation for Portfolio": "技术美术作品集",
};

function getArticleGroup(article: Article) {
  if (!article.markdownUrl) return "其他";

  try {
    const segments = decodeURIComponent(new URL(article.markdownUrl).pathname).split("/").filter(Boolean);
    const articlesIndex = segments.indexOf("articles");
    const folder = segments[articlesIndex + 2];
    return groupLabels[folder] ?? folder ?? "其他";
  } catch {
    return "其他";
  }
}

export default function CategoryArticleDirectory({ articles }: CategoryArticleDirectoryProps) {
  const groups = useMemo(() => {
    const grouped = new Map<string, Article[]>();

    articles.forEach((article) => {
      const group = getArticleGroup(article);
      grouped.set(group, [...(grouped.get(group) ?? []), article]);
    });

    return Array.from(grouped, ([label, groupArticles]) => ({
      articles: groupArticles,
      label,
    }));
  }, [articles]);

  return (
    <aside aria-label="文章目录" className="category-article-directory">
      <div className="category-article-directory__heading">
        <BookOpenText aria-hidden="true" size={15} strokeWidth={1.8} />
        <strong>目录</strong>
        <span>{articles.length}</span>
      </div>

      <nav aria-label="分类文章目录">
        {groups.map((group, groupIndex) => (
          <details className="category-article-directory__group" key={group.label} open={groupIndex === 0}>
            <summary>
              <strong>{group.label}</strong>
              <span>{group.articles.length}</span>
              <ChevronDown aria-hidden="true" size={14} />
            </summary>

            <div className="category-article-directory__items">
              {group.articles.map((article, index) => (
                <Link className="category-article-directory__item" key={article.slug} to={`/article/${article.slug}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{article.title}</strong>
                </Link>
              ))}
            </div>
          </details>
        ))}
      </nav>
    </aside>
  );
}
