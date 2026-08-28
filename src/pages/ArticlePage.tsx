import { ArrowLeft, Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ArticleTextCover from "@/components/ArticleTextCover";
import MarkdownContent from "@/components/MarkdownContent";
import SectionBadge from "@/components/SectionBadge";
import { getArticleBySlug, getCategoryByKey } from "@/data/blog";

export default function ArticlePage() {
  const { slug } = useParams();
  const article = getArticleBySlug(slug);
  const [remoteMarkdown, setRemoteMarkdown] = useState("");
  const [markdownStatus, setMarkdownStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const articleMarkdownUrl = article?.markdownUrl;
  const articleMarkdownBaseUrl = useMemo(() => {
    if (!articleMarkdownUrl) return "";

    try {
      return new URL(".", articleMarkdownUrl).toString();
    } catch {
      return "";
    }
  }, [articleMarkdownUrl]);

  useEffect(() => {
    if (!article || article.markdown || !article.markdownUrl) {
      setRemoteMarkdown("");
      setMarkdownStatus("idle");
      return;
    }

    const controller = new AbortController();
    setRemoteMarkdown("");
    setMarkdownStatus("loading");

    fetch(article.markdownUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load article: ${response.status}`);
        }

        return response.text();
      })
      .then((markdown) => {
        setRemoteMarkdown(markdown);
        setMarkdownStatus("ready");
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }

        setMarkdownStatus("error");
      });

    return () => {
      controller.abort();
    };
  }, [article]);

  if (!article) {
    return (
      <main className="article-page article-page--missing">
        <div className="content-shell article-page__missing">
          <SectionBadge text="未找到文章" />
          <h1>当前链接没有对应内容。</h1>
          <Link className="button button--primary" to="/">
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  const category = getCategoryByKey(article.category);
  const backHref = category?.href ?? "/";

  return (
    <main className="article-page">
      <div className="content-shell article-page__top">
        <article className="article-layout">
          <Link className="article-page__back" to={backHref}>
            <ArrowLeft size={16} />
            <span>返回</span>
          </Link>

          <div className="article-hero">
            <SectionBadge text={category?.label ?? article.category} />
            <h1>{article.title}</h1>

            <div className="article-hero__meta">
              <span>{article.date}</span>
              <span>
                <Clock3 size={14} />
                {article.readTime}
              </span>
            </div>

            <p>{article.excerpt}</p>
          </div>

          <div className="article-layout__cover">
            {article.cover ? (
              <img alt={article.title} src={article.cover} />
            ) : (
              <ArticleTextCover article={article} className="article-layout__text-cover" />
            )}
          </div>

          <div className="article-layout__content article-content">
            {article.markdown ? (
              <MarkdownContent baseUrl={articleMarkdownBaseUrl} source={article.markdown} />
            ) : remoteMarkdown ? (
              <MarkdownContent baseUrl={articleMarkdownBaseUrl} source={remoteMarkdown} />
            ) : markdownStatus === "loading" ? (
              <p>文章加载中...</p>
            ) : markdownStatus === "error" ? (
              <p>文章加载失败，请稍后刷新重试。</p>
            ) : (
              article.content?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
