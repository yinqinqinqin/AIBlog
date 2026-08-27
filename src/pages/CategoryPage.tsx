import { Link, Navigate, useParams } from "react-router-dom";
import ArticleCard from "@/components/ArticleCard";
import FooterSection from "@/components/FooterSection";
import InterviewResourceToolCard, {
  type InterviewResourceToolKind,
} from "@/components/InterviewResourceToolCard";
import SectionBadge from "@/components/SectionBadge";
import StudyPlanSystem from "@/components/StudyPlanSystem";
import {
  getArticlesByCategory,
  getCategoryByKey,
  isCategoryKey,
  studyPlanSystem,
} from "@/data/blog";

const knowledgeGroups: Array<{
  id: string;
  index: string;
  title: string;
  description: string;
  kinds: InterviewResourceToolKind[];
}> = [
  {
    id: "interview",
    index: "01",
    title: "面试",
    description: "技术美术真题、系统知识与答题训练",
    kinds: ["mihoyo", "ta100"],
  },
  {
    id: "performance",
    index: "02",
    title: "性能优化",
    description: "GPU 抓帧、瓶颈定位与移动端调优",
    kinds: ["gpu", "mobile"],
  },
  {
    id: "pipeline",
    index: "03",
    title: "资源管线",
    description: "资产规范、工具链与生产自动化",
    kinds: ["pipeline"],
  },
];

export default function CategoryPage() {
  const { categoryKey } = useParams();

  if (!isCategoryKey(categoryKey)) {
    return (
      <main className="article-page article-page--missing">
        <div className="content-shell article-page__top">
          <div className="article-page__missing">
            <SectionBadge text="未找到分类" />
            <h1>当前分类不存在。</h1>
            <Link className="button button--primary" to="/">
              返回首页
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const category = getCategoryByKey(categoryKey);
  const categoryArticles = getArticlesByCategory(categoryKey);
  const isStudyPlanPage = categoryKey === "study-plan";

  if (categoryKey === "tools") {
    return <Navigate replace to="/category/knowledge-base" />;
  }

  const isKnowledgeBasePage = categoryKey === "knowledge-base";

  return (
    <div className="blog-page">
      <main className="category-page">
        <div className="content-shell category-page__top">
          <section className="category-page__hero">
            <SectionBadge text={category?.label ?? ""} />
          </section>

          {isStudyPlanPage ? (
            <StudyPlanSystem plan={studyPlanSystem} />
          ) : isKnowledgeBasePage ? (
            <section className="tool-catalog" aria-label="知识库分类">
              {knowledgeGroups.map((group) => (
                <section className="tool-category" aria-labelledby={`tool-category-${group.id}`} key={group.id}>
                  <header className="tool-category__header">
                    <div className="tool-category__title">
                      <span aria-hidden="true">{group.index}</span>
                      <div>
                        <h2 id={`tool-category-${group.id}`}>{group.title}</h2>
                        <p>{group.description}</p>
                      </div>
                    </div>
                    <span className="tool-category__count">{group.kinds.length} 个条目</span>
                  </header>

                  <div className="tool-grid">
                    {group.kinds.map((kind) => (
                      <InterviewResourceToolCard kind={kind} key={kind} />
                    ))}
                  </div>
                </section>
              ))}
            </section>
          ) : (
            <section className="article-grid">
              {categoryArticles.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </section>
          )}
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
