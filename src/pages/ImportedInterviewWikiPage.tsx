import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  BadgeCheck,
  BookOpenCheck,
  BookOpenText,
  ChevronDown,
  CircleHelp,
  Layers3,
  Lightbulb,
  Search,
  Sparkles,
  Tags,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import FooterSection from "@/components/FooterSection";
import type {
  InterviewResourceBank,
  InterviewResourceQuestion,
} from "@/data/interviewResourceTypes";

type ImportedInterviewWikiPageProps = {
  bank: InterviewResourceBank;
};

const moduleAccents = [
  "#70d5ad",
  "#e5bd6c",
  "#bd91f5",
  "#72bde8",
  "#e28f9f",
  "#9fcf79",
];

function normalizeSearch(value: string) {
  return value.trim().normalize("NFKC").toLocaleLowerCase();
}

function questionMatches(question: InterviewResourceQuestion, query: string) {
  if (!query) return true;
  const text = normalizeSearch([
    question.question,
    question.answer,
    question.quickAnswer,
    question.source,
    ...question.options,
    ...question.tags,
    ...question.followUps,
  ].join(" "));
  return query.split(/\s+/).filter(Boolean).every((token) => text.includes(token));
}

export default function ImportedInterviewWikiPage({ bank }: ImportedInterviewWikiPageProps) {
  const [openQuestionIds, setOpenQuestionIds] = useState<Set<string>>(() => new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const reduceMotion = useReducedMotion();
  const normalizedSearch = normalizeSearch(searchQuery);
  const allQuestions = useMemo(
    () => bank.modules.flatMap((module) => module.questions),
    [bank.modules],
  );
  const questionNumbers = useMemo(
    () => new Map(allQuestions.map((question, index) => [question.id, index + 1])),
    [allQuestions],
  );
  const filteredQuestionCount = allQuestions.filter((question) => questionMatches(question, normalizedSearch)).length;
  const reviewQuestionCount = bank.modules.reduce((total, module) => total + module.reviewQuestions.length, 0);
  const isChapterGuide = bank.key === "game-ta-interview-100";

  useEffect(() => {
    globalThis.scrollTo(0, 0);
  }, [bank.key]);

  const toggleQuestion = (questionId: string) => {
    setOpenQuestionIds((current) => {
      const next = new Set(current);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const toggleModule = (questionIds: string[]) => {
    const allOpen = questionIds.every((questionId) => openQuestionIds.has(questionId));
    setOpenQuestionIds((current) => {
      const next = new Set(current);
      questionIds.forEach((questionId) => {
        if (allOpen) next.delete(questionId);
        else next.add(questionId);
      });
      return next;
    });
  };

  return (
    <div className="blog-page interview-wiki-page resource-wiki-page">
      <main>
        <section className="interview-wiki-hero resource-wiki-hero">
          <div className="content-shell interview-wiki-hero__inner">
            <Link className="interview-wiki-hero__back" to="/category/knowledge-base">
              KNOWLEDGE BASE / 导入题库
            </Link>
            <div className="interview-wiki-hero__copy">
              <p className="interview-wiki-hero__eyebrow">
                <Sparkles size={14} /> {bank.eyebrow}
              </p>
              <h1>
                {bank.title.map((line, index) => (
                  <span key={line}>{line}{index < bank.title.length - 1 && <br />}</span>
                ))}
              </h1>
              <p>{bank.description}</p>
            </div>
            <div className="interview-wiki-hero__stats" aria-label="题库统计">
              <div><strong>{allQuestions.length}</strong><span>主问题</span></div>
              <div><strong>{bank.modules.length}</strong><span>{isChapterGuide ? "章节" : "题型"}</span></div>
              <div><strong>{reviewQuestionCount || "已"}</strong><span>{reviewQuestionCount ? "自测问题" : "答案配对"}</span></div>
            </div>
          </div>
        </section>

        <div className="content-shell interview-wiki-layout">
          <aside className="interview-wiki-toc resource-wiki-toc">
            <div className="interview-wiki-toc__head">
              <BookOpenText size={17} />
              <span>{isChapterGuide ? "章节目录" : "题型目录"}</span>
            </div>
            <nav aria-label={isChapterGuide ? "章节目录" : "题型目录"}>
              {bank.modules.map((module, index) => (
                <a className="interview-wiki-toc__primary" href={`#resource-${module.id}`} key={module.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <strong>{module.title}</strong>
                    <small>{module.questions.length} 道主问题</small>
                  </span>
                </a>
              ))}
            </nav>
            <div className="resource-wiki-toc__source">
              <Layers3 size={14} />
              <span>{bank.sourceLabel}</span>
            </div>
          </aside>

          <div className="interview-wiki-content resource-wiki-content">
            <section className="interview-wiki-search resource-wiki-search" aria-label="搜索题库">
              <Search size={19} aria-hidden="true" />
              <label htmlFor={`${bank.key}-search-input`}>
                <span>搜索 {allQuestions.length} 道题目与答案</span>
                <input
                  autoComplete="off"
                  id={`${bank.key}-search-input`}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="输入题目、答案、关键词或章节……"
                  type="search"
                  value={searchQuery}
                />
              </label>
              <span className="interview-wiki-search__count" aria-live="polite">
                {normalizedSearch ? `${filteredQuestionCount} / ${allQuestions.length}` : `${allQuestions.length} 道题`}
              </span>
              {searchQuery && (
                <button aria-label="清空搜索" onClick={() => setSearchQuery("")} type="button">
                  <X size={15} />
                </button>
              )}
            </section>

            {normalizedSearch && filteredQuestionCount === 0 && (
              <div className="interview-wiki-search-empty">
                <Search size={24} aria-hidden="true" />
                <strong>没有找到匹配内容</strong>
                <p>试试更短的关键词，例如“PBR”“Shader”“性能”或“管线”。</p>
              </div>
            )}

            {bank.modules.map((module, moduleIndex) => {
              const visibleQuestions = module.questions.filter((question) => questionMatches(question, normalizedSearch));
              if (!visibleQuestions.length) return null;
              const visibleQuestionIds = visibleQuestions.map((question) => question.id);
              const allOpen = visibleQuestionIds.every((questionId) => openQuestionIds.has(questionId));
              const moduleStyle = {
                "--wiki-level-color": moduleAccents[moduleIndex % moduleAccents.length],
              } as CSSProperties;

              return (
                <section
                  className="interview-wiki-level resource-wiki-module"
                  id={`resource-${module.id}`}
                  key={module.id}
                  style={moduleStyle}
                >
                  <header className="interview-wiki-level__header">
                    <div className="interview-wiki-level__number">{String(moduleIndex + 1).padStart(2, "0")}</div>
                    <div className="interview-wiki-level__copy">
                      <span>{isChapterGuide ? `CHAPTER ${String(moduleIndex + 1).padStart(2, "0")}` : `QUESTION TYPE ${String(moduleIndex + 1).padStart(2, "0")}`}</span>
                      <h2>{module.title}</h2>
                      <p>{module.description}</p>
                    </div>
                    <button onClick={() => toggleModule(visibleQuestionIds)} type="button">
                      {allOpen ? "收起本组答案" : "展开本组答案"}
                    </button>
                  </header>

                  {(module.learnPoints.length > 0 || module.concepts.length > 0) && (
                    <div className="resource-wiki-module__brief">
                      {module.learnPoints.length > 0 && (
                        <div>
                          <span><Lightbulb size={15} /> 本章重点</span>
                          <ul>
                            {module.learnPoints.map((point) => <li key={point}>{point}</li>)}
                          </ul>
                        </div>
                      )}
                      {module.concepts.length > 0 && (
                        <div className="resource-wiki-module__concepts">
                          <span><Tags size={15} /> 核心概念</span>
                          <p>{module.concepts.map((concept) => <em key={concept}>{concept}</em>)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="interview-wiki-questions resource-wiki-questions">
                    {visibleQuestions.map((question) => {
                      const isOpen = openQuestionIds.has(question.id);
                      const answerId = `${question.id}-answer`;
                      const questionNumber = questionNumbers.get(question.id) ?? 0;

                      return (
                        <article className={`interview-question resource-question${isOpen ? " is-open" : ""}`} key={question.id}>
                          <div className="interview-question__header">
                            <button
                              aria-controls={answerId}
                              aria-expanded={isOpen}
                              className="interview-question__toggle"
                              onClick={() => toggleQuestion(question.id)}
                              type="button"
                            >
                              <span className="interview-question__index">Q{String(questionNumber).padStart(3, "0")}</span>
                              <span className="interview-question__copy">
                                <span className="interview-question__category">{module.title}</span>
                                <strong>{question.question}</strong>
                                <small>{question.source || (question.options.length ? `${question.options.length} 个选项` : "题目与答案已配对")}</small>
                              </span>
                              <span className="interview-question__action">
                                <span>{isOpen ? "收起答案" : "查看答案"}</span>
                                <ChevronDown size={18} />
                              </span>
                            </button>
                          </div>

                          {question.options.length > 0 && (
                            <div className="resource-question__options" aria-label="选项">
                              {question.options.map((option) => <span key={option}>{option}</span>)}
                            </div>
                          )}

                          {isOpen && (
                            <motion.div
                              animate={{ opacity: 1, scaleY: 1 }}
                              className="interview-question__collapsible"
                              initial={{ opacity: 0, scaleY: 0.985 }}
                              key={`${question.id}-answer-panel`}
                              style={{ transformOrigin: "top" }}
                              transition={reduceMotion ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }}
                            >
                              <div className="interview-question__answer resource-question__answer" id={answerId}>
                                {question.quickAnswer && (
                                  <section className="interview-question__correct-answer">
                                    <header>
                                      <span><BadgeCheck size={16} /> {isChapterGuide ? "30 秒速答" : "答案速览"}</span>
                                      <small>先独立作答，再核对参考</small>
                                    </header>
                                    <p>{question.quickAnswer}</p>
                                  </section>
                                )}

                                <section className="resource-question__detail">
                                  <header>
                                    <span><BookOpenCheck size={16} /> {bank.answerLabel}</span>
                                    <small>题目与答案保持同卡片对应</small>
                                  </header>
                                  <p>{question.answer}</p>
                                </section>

                                {question.followUps.length > 0 && (
                                  <section className="resource-question__followups">
                                    <span><CircleHelp size={15} /> 面试追问</span>
                                    <ul>
                                      {question.followUps.map((followUp) => <li key={followUp}>{followUp}</li>)}
                                    </ul>
                                  </section>
                                )}

                                {question.tags.length > 0 && (
                                  <footer className="resource-question__tags">
                                    <Tags size={14} />
                                    {question.tags.map((tag) => <span key={tag}>{tag}</span>)}
                                  </footer>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </article>
                      );
                    })}
                  </div>

                  {(module.reviewQuestions.length > 0 || module.practice.length > 0) && (
                    <div className="resource-wiki-review-grid">
                      {module.reviewQuestions.length > 0 && (
                        <details className="resource-wiki-review">
                          <summary><CircleHelp size={15} /> 章节自测 · {module.reviewQuestions.length} 题</summary>
                          <ol>{module.reviewQuestions.map((item) => <li key={item}>{item}</li>)}</ol>
                        </details>
                      )}
                      {module.practice.length > 0 && (
                        <details className="resource-wiki-review">
                          <summary><Lightbulb size={15} /> 动手思考 · {module.practice.length} 项</summary>
                          <ol>{module.practice.map((item) => <li key={item}>{item}</li>)}</ol>
                        </details>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
