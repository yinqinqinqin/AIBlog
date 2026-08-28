import CategorySection from "@/components/CategorySection";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import HeroSection from "@/components/HeroSection";
import RevealOnView from "@/components/RevealOnView";
import { lazy, Suspense } from "react";
import {
  categories,
  getArticlesByCategory,
  getFeaturedArticles,
  siteMeta,
} from "@/data/blog";
import useEntryReady from "@/hooks/useEntryReady";
import { useStudyPlanStore } from "@/store/studyPlanStore";
import { Link } from "react-router-dom";

const FooterSection = lazy(() => import("@/components/FooterSection"));

export default function HomePage() {
  const featuredArticles = getFeaturedArticles();
  const entryReady = useEntryReady();
  const tasks = useStudyPlanStore((state) => state.tasks);
  const inProgressTasks = tasks.filter((task) => task.status === "doing").slice(0, 3);
  const todoTasks = tasks.filter((task) => task.status === "todo").slice(0, 3);
  const getHomeCategoryArticles = (categoryKey: (typeof categories)[number]["key"]) => {
    const categoryArticles = getArticlesByCategory(categoryKey);

    if (categoryKey === "learning-notes" || categoryKey === "portfolio") {
      return categoryArticles.slice(0, 6);
    }

    return categoryArticles;
  };

  return (
    <div className="blog-page" id="top">
      <main>
        <HeroSection
          summary={siteMeta.summary}
          title={siteMeta.title}
        />

        <FeaturedCarousel articles={featuredArticles} />

        {categories.map((category) => (
          <CategorySection
            key={category.key}
            articles={getHomeCategoryArticles(category.key)}
            category={category}
            customContent={
              category.key === "study-plan" ? (
                <div className="study-plan-preview-wrap">
                  <div className="study-plan-preview-group">
                    <div className="study-plan-preview-group__header">
                      <span>进行中</span>
                    </div>
                    <div className="study-plan-preview">
                      {inProgressTasks.length > 0 ? (
                        inProgressTasks.map((task, index) => (
                          <RevealOnView
                            className="article-card-motion"
                            delay={Math.min(index % 2, 1) * 0.06}
                            enabled={entryReady}
                            key={task.id}
                          >
                            <Link className="study-plan-preview__card" to="/category/study-plan">
                              <span className="study-plan-preview__status">进行中</span>
                              <strong>{task.title}</strong>
                            </Link>
                          </RevealOnView>
                        ))
                      ) : (
                        <RevealOnView className="article-card-motion" enabled={entryReady}>
                          <Link className="study-plan-preview__empty" to="/category/study-plan">
                            当前还没有进行中的计划任务，打开学习计划页添加任务。
                          </Link>
                        </RevealOnView>
                      )}
                    </div>
                  </div>

                  <div className="study-plan-preview-group">
                    <div className="study-plan-preview-group__header">
                      <span>未完成</span>
                    </div>
                    <div className="study-plan-preview">
                      {todoTasks.length > 0 ? (
                        todoTasks.map((task, index) => (
                          <RevealOnView
                            className="article-card-motion"
                            delay={Math.min(index % 2, 1) * 0.06}
                            enabled={entryReady}
                            key={task.id}
                          >
                            <Link className="study-plan-preview__card" to="/category/study-plan">
                              <span className="study-plan-preview__status study-plan-preview__status--todo">未完成</span>
                              <strong>{task.title}</strong>
                            </Link>
                          </RevealOnView>
                        ))
                      ) : (
                        <RevealOnView className="article-card-motion" enabled={entryReady}>
                          <Link className="study-plan-preview__empty" to="/category/study-plan">
                            当前没有未完成任务，打开学习计划页继续补充待办。
                          </Link>
                        </RevealOnView>
                      )}
                    </div>
                  </div>
                </div>
              ) : undefined
            }
          />
        ))}
      </main>

      <Suspense fallback={null}>
        <FooterSection />
      </Suspense>
    </div>
  );
}
