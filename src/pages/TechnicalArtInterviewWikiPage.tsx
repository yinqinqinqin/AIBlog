import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  BookOpenCheck,
  BookOpenText,
  Check,
  ChevronDown,
  ImagePlus,
  Layers3,
  Lightbulb,
  Route,
  Search,
  Sparkles,
  StickyNote,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import FooterSection from "@/components/FooterSection";
import SiteHeader from "@/components/SiteHeader";
import {
  getInterviewCategory,
  getQuestionsByLevel,
  interviewCategories,
  interviewLevels,
  interviewQuestions,
  type InterviewQuestion,
  type InterviewLevelKey,
} from "@/data/taInterviewWiki";
import { navItems, siteMeta } from "@/data/blog";
import {
  deleteInterviewNoteImage,
  listInterviewNoteImages,
  saveInterviewNoteImage,
  type InterviewNoteImage,
} from "@/store/interviewNoteImages";
import { useInterviewNotesStore } from "@/store/interviewNotesStore";

type NoteImagePreview = InterviewNoteImage & {
  previewUrl: string;
};

const answerPrinciples = [
  {
    index: "01",
    title: "先给结论",
    description: "用一句话直接回答问题本身，让面试官先知道你的判断。",
  },
  {
    index: "02",
    title: "再讲原理与取舍",
    description: "解释为什么有效、什么时候失效，以及质量与成本的边界。",
  },
  {
    index: "03",
    title: "最后说明验证",
    description: "落到项目场景、数据指标、调试视图或可复现的实验。",
  },
];

function matchesInterviewSearch(question: InterviewQuestion, query: string) {
  if (!query) return true;

  const category = getInterviewCategory(question.category);
  const level = interviewLevels.find((item) => item.key === question.level);
  const searchableText = [
    question.question,
    question.intent,
    category?.label,
    category?.shortLabel,
    category?.description,
    level?.label,
    level?.subtitle,
    level?.description,
    question.method.framework,
    ...question.method.steps.flatMap((step) => [step.title, step.detail]),
    question.method.reference.correctAnswer,
    ...question.method.reference.paragraphs,
    question.method.reference.application,
    ...question.method.reference.pitfalls,
    ...question.method.checklist,
  ]
    .filter(Boolean)
    .join(" ")
    .normalize("NFKC")
    .toLocaleLowerCase();

  return query
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => fuzzyIncludes(searchableText, token));
}

function isEditDistanceWithin(source: string, target: string, maximumDistance: number) {
  if (Math.abs(source.length - target.length) > maximumDistance) return false;

  let previousRow = Array.from({ length: target.length + 1 }, (_, index) => index);

  for (let sourceIndex = 1; sourceIndex <= source.length; sourceIndex += 1) {
    const currentRow = [sourceIndex];
    let rowMinimum = sourceIndex;

    for (let targetIndex = 1; targetIndex <= target.length; targetIndex += 1) {
      const substitutionCost = source[sourceIndex - 1] === target[targetIndex - 1] ? 0 : 1;
      const value = Math.min(
        currentRow[targetIndex - 1] + 1,
        previousRow[targetIndex] + 1,
        previousRow[targetIndex - 1] + substitutionCost,
      );
      currentRow.push(value);
      rowMinimum = Math.min(rowMinimum, value);
    }

    if (rowMinimum > maximumDistance) return false;
    previousRow = currentRow;
  }

  return previousRow[target.length] <= maximumDistance;
}

function fuzzyIncludes(searchableText: string, rawToken: string) {
  const token = rawToken.normalize("NFKC").toLocaleLowerCase();
  if (!token) return true;
  if (searchableText.includes(token)) return true;

  const compactText = searchableText.replace(/[\s\p{P}\p{S}]+/gu, "");
  const compactToken = token.replace(/[\s\p{P}\p{S}]+/gu, "");
  if (!compactToken) return true;
  if (compactText.includes(compactToken)) return true;

  if (compactToken.length < 3) return false;

  const maximumDistance = compactToken.length >= 7 ? 2 : 1;
  const minimumWindowLength = Math.max(2, compactToken.length - maximumDistance);
  const maximumWindowLength = compactToken.length + maximumDistance;

  for (let windowLength = minimumWindowLength; windowLength <= maximumWindowLength; windowLength += 1) {
    for (let start = 0; start + windowLength <= compactText.length; start += 1) {
      if (
        isEditDistanceWithin(
          compactText.slice(start, start + windowLength),
          compactToken,
          maximumDistance,
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

export default function TechnicalArtInterviewWikiPage() {
  const [openQuestionIds, setOpenQuestionIds] = useState<Set<string>>(() => new Set());
  const [openNoteIds, setOpenNoteIds] = useState<Set<string>>(() => new Set());
  const [openTocLevels, setOpenTocLevels] = useState<Set<InterviewLevelKey>>(() => {
    const currentHash = globalThis.location?.hash ?? "";
    const currentLevel = interviewLevels.find((level) => currentHash.startsWith(`#wiki-${level.key}`));
    return new Set([currentLevel?.key ?? "low"]);
  });
  const [searchQuery, setSearchQuery] = useState("");
  const reduceMotion = useReducedMotion();
  const notes = useInterviewNotesStore((state) => state.notes);
  const attachmentCounts = useInterviewNotesStore((state) => state.attachmentCounts);
  const setNote = useInterviewNotesStore((state) => state.setNote);
  const setAttachmentCount = useInterviewNotesStore((state) => state.setAttachmentCount);
  const [noteImages, setNoteImages] = useState<Record<string, NoteImagePreview[]>>({});
  const [noteImageMessages, setNoteImageMessages] = useState<Record<string, string>>({});
  const noteImageUrls = useRef<Set<string>>(new Set());
  const normalizedSearchQuery = searchQuery.trim().normalize("NFKC").toLocaleLowerCase();
  const searchResultCount = interviewQuestions.filter((question) =>
    matchesInterviewSearch(question, normalizedSearchQuery),
  ).length;

  useEffect(
    () => () => {
      noteImageUrls.current.forEach((url) => URL.revokeObjectURL(url));
      noteImageUrls.current.clear();
    },
    [],
  );

  const createNoteImagePreview = (image: InterviewNoteImage): NoteImagePreview => {
    const previewUrl = URL.createObjectURL(image.blob);
    noteImageUrls.current.add(previewUrl);
    return { ...image, previewUrl };
  };

  const loadNoteImages = async (questionId: string) => {
    if (Object.prototype.hasOwnProperty.call(noteImages, questionId)) return;

    try {
      const images = await listInterviewNoteImages(questionId);
      setNoteImages((current) => ({
        ...current,
        [questionId]: images.map(createNoteImagePreview),
      }));
      setAttachmentCount(questionId, images.length);
    } catch {
      setNoteImages((current) => ({ ...current, [questionId]: [] }));
      setNoteImageMessages((current) => ({
        ...current,
        [questionId]: "当前浏览器无法读取截图存储",
      }));
    }
  };

  const addNoteImages = async (questionId: string, incomingFiles: File[]) => {
    const imageFiles = incomingFiles.filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) return;

    const currentCount = noteImages[questionId]?.length ?? attachmentCounts[questionId] ?? 0;
    const availableSlots = Math.max(0, 8 - currentCount);
    const acceptedFiles = imageFiles
      .filter((file) => file.size <= 10 * 1024 * 1024)
      .slice(0, availableSlots);

    if (!acceptedFiles.length) {
      setNoteImageMessages((current) => ({
        ...current,
        [questionId]: availableSlots ? "单张截图不能超过 10 MB" : "每道题最多保存 8 张截图",
      }));
      return;
    }

    try {
      const savedImages = await Promise.all(
        acceptedFiles.map((file) => saveInterviewNoteImage(questionId, file)),
      );
      const previews = savedImages.map(createNoteImagePreview);
      setNoteImages((current) => ({
        ...current,
        [questionId]: [...(current[questionId] ?? []), ...previews],
      }));
      setAttachmentCount(questionId, currentCount + previews.length);
      setNoteImageMessages((current) => ({
        ...current,
        [questionId]: imageFiles.length > acceptedFiles.length
          ? "部分截图因大小或数量限制未保存"
          : "截图已保存",
      }));
    } catch {
      setNoteImageMessages((current) => ({
        ...current,
        [questionId]: "截图保存失败，请检查浏览器存储权限",
      }));
    }
  };

  const removeNoteImage = async (questionId: string, imageId: string) => {
    try {
      await deleteInterviewNoteImage(imageId);
      const nextCount = Math.max(0, (noteImages[questionId]?.length ?? 1) - 1);
      setNoteImages((current) => {
        const removedImage = current[questionId]?.find((image) => image.id === imageId);
        if (removedImage) {
          URL.revokeObjectURL(removedImage.previewUrl);
          noteImageUrls.current.delete(removedImage.previewUrl);
        }
        const nextImages = (current[questionId] ?? []).filter((image) => image.id !== imageId);
        return { ...current, [questionId]: nextImages };
      });
      setAttachmentCount(questionId, nextCount);
      setNoteImageMessages((current) => ({ ...current, [questionId]: "截图已删除" }));
    } catch {
      setNoteImageMessages((current) => ({ ...current, [questionId]: "截图删除失败" }));
    }
  };

  const toggleQuestion = (questionId: string) => {
    const isClosing = openQuestionIds.has(questionId);

    setOpenQuestionIds((current) => {
      const next = new Set(current);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });

    if (isClosing) {
      setOpenNoteIds((current) => {
        const next = new Set(current);
        next.delete(questionId);
        return next;
      });
    }
  };

  const toggleLevel = (level: InterviewLevelKey, visibleQuestionIds?: string[]) => {
    const questions = getQuestionsByLevel(level).filter(
      (question) => !visibleQuestionIds || visibleQuestionIds.includes(question.id),
    );
    const allOpen = questions.every((question) => openQuestionIds.has(question.id));

    setOpenQuestionIds((current) => {
      const next = new Set(current);
      questions.forEach((question) => {
        if (allOpen) {
          next.delete(question.id);
        } else {
          next.add(question.id);
        }
      });
      return next;
    });

    if (allOpen) {
      setOpenNoteIds((current) => {
        const next = new Set(current);
        questions.forEach((question) => next.delete(question.id));
        return next;
      });
    }
  };

  const toggleNote = (questionId: string) => {
    if (!openNoteIds.has(questionId)) {
      void loadNoteImages(questionId);
    }

    setOpenNoteIds((current) => {
      const next = new Set(current);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const toggleTocLevel = (level: InterviewLevelKey) => {
    setOpenTocLevels((current) => {
      const next = new Set(current);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  return (
    <div className="blog-page interview-wiki-page">
      <SiteHeader brand={siteMeta.brand} navItems={navItems} />

      <main>
        <section className="interview-wiki-hero">
          <div className="content-shell interview-wiki-hero__inner">
            <Link className="interview-wiki-hero__back" to="/category/tools">
              TOOLS / 面试知识库
            </Link>
            <div className="interview-wiki-hero__copy">
              <p className="interview-wiki-hero__eyebrow">
                <Sparkles size={14} /> Technical Art Field Guide
              </p>
              <h1>技术美术<br />面试 Wiki</h1>
              <p>
                从概念理解，到项目取舍，再到系统设计。先独立组织答案，
                再用正确参考答案校准原理、边界与项目表达。
              </p>
            </div>

            <div className="interview-wiki-hero__stats" aria-label="Wiki 内容统计">
              <div><strong>{interviewQuestions.length}</strong><span>核心问题</span></div>
              <div><strong>{interviewCategories.length}</strong><span>能力模块</span></div>
              <div><strong>{interviewLevels.length}</strong><span>难度等级</span></div>
            </div>
          </div>
        </section>

        <div className="content-shell interview-wiki-layout">
          <aside className="interview-wiki-toc">
            <div className="interview-wiki-toc__head">
              <BookOpenText size={17} />
              <span>目录</span>
            </div>
            <nav aria-label="面试 Wiki 目录">
              <a className="interview-wiki-toc__primary" href="#wiki-overview"><span>00</span>回答框架</a>
              {interviewLevels.map((level) => {
                const isTocLevelOpen = openTocLevels.has(level.key);

                return (
                  <div className={`interview-wiki-toc__level${isTocLevelOpen ? " is-open" : ""}`} key={level.key}>
                    <div className="interview-wiki-toc__level-head">
                      <a className="interview-wiki-toc__primary" href={`#wiki-${level.key}`}>
                        <span>{level.index}</span>
                        <span>
                          <strong>{level.label}</strong>
                          <small>{getQuestionsByLevel(level.key).length} 题 · {interviewCategories.length} 模块</small>
                        </span>
                      </a>
                      <button
                        aria-expanded={isTocLevelOpen}
                        aria-label={`${isTocLevelOpen ? "收起" : "展开"}${level.label}二级目录`}
                        onClick={() => toggleTocLevel(level.key)}
                        type="button"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    {isTocLevelOpen && (
                      <motion.div
                        animate={{ opacity: 1, scaleY: 1 }}
                        className="interview-wiki-toc__secondary"
                        initial={{ opacity: 0, scaleY: 0.96 }}
                        style={{ transformOrigin: "top" }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: "easeOut" }}
                      >
                        {interviewCategories.map((category, categoryIndex) => (
                          <a href={`#wiki-${level.key}-${category.key}`} key={category.key}>
                            <span>{level.index}.{String(categoryIndex + 1).padStart(2, "0")}</span>
                            <span>{category.shortLabel}</span>
                          </a>
                        ))}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </nav>
            <div className="interview-wiki-toc__legend">
              <span>能力地图</span>
              <div>
                {interviewCategories.map((category) => (
                  <span key={category.key}>{category.shortLabel}</span>
                ))}
              </div>
            </div>
          </aside>

          <div className="interview-wiki-content">
            <section className="interview-wiki-overview" id="wiki-overview">
              <div className="interview-wiki-section-kicker"><span>00</span>HOW TO USE</div>
              <div className="interview-wiki-overview__heading">
                <div>
                  <h2>用同一套结构，回答不同类型的问题。</h2>
                  <p>建议先用 90 秒口述，再展开正确参考答案核对。不要只背句子，也要理解“结论—原理—验证”的组织能力。</p>
                </div>
                <Route size={30} strokeWidth={1.4} aria-hidden="true" />
              </div>
              <div className="interview-wiki-principles">
                {answerPrinciples.map((principle) => (
                  <article key={principle.index}>
                    <span>{principle.index}</span>
                    <h3>{principle.title}</h3>
                    <p>{principle.description}</p>
                  </article>
                ))}
              </div>
              <div className="interview-wiki-category-map">
                <div className="interview-wiki-category-map__heading">
                  <span>ABILITY MAP / {String(interviewCategories.length).padStart(2, "0")}</span>
                  <h3>九个专业模块，贯穿三个难度。</h3>
                </div>
                <div className="interview-wiki-category-map__grid">
                  {interviewCategories.map((category, index) => (
                    <article key={category.key}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <strong>{category.label}</strong>
                        <p>{category.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="interview-wiki-search" aria-label="搜索面试题">
              <Search size={19} aria-hidden="true" />
              <label htmlFor="interview-wiki-search-input">
                <span>模糊搜索 {interviewQuestions.length} 道面试题</span>
                <input
                  autoComplete="off"
                  id="interview-wiki-search-input"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="输入题目、技术关键词、分类或参考答案……"
                  type="search"
                  value={searchQuery}
                />
              </label>
              <span className="interview-wiki-search__count" aria-live="polite">
                {normalizedSearchQuery ? `${searchResultCount} / ${interviewQuestions.length}` : `${interviewQuestions.length} 道题`}
              </span>
              {searchQuery && (
                <button aria-label="清空搜索" onClick={() => setSearchQuery("")} type="button">
                  <X size={15} />
                </button>
              )}
            </section>

            {normalizedSearchQuery && searchResultCount === 0 && (
              <div className="interview-wiki-search-empty">
                <Search size={24} aria-hidden="true" />
                <strong>没有找到匹配的题目</strong>
                <p>试试更短的关键词，例如“PBR”“性能”“蓝图”或“管线”。</p>
              </div>
            )}

            {interviewLevels.map((level) => {
              const allLevelQuestions = getQuestionsByLevel(level.key);
              const questions = allLevelQuestions.filter((question) =>
                matchesInterviewSearch(question, normalizedSearchQuery),
              );
              const orderedQuestions = interviewCategories.flatMap((category) =>
                allLevelQuestions.filter((question) => question.category === category.key),
              );
              const allOpen = questions.every((question) => openQuestionIds.has(question.id));

              if (!questions.length) return null;

              return (
                <section className={`interview-wiki-level interview-wiki-level--${level.key}`} id={`wiki-${level.key}`} key={level.key}>
                  <header className="interview-wiki-level__header">
                    <div className="interview-wiki-level__number">{level.index}</div>
                    <div className="interview-wiki-level__copy">
                      <span>{level.subtitle}</span>
                      <h2>{level.label}</h2>
                      <p>{level.description}</p>
                    </div>
                    <button type="button" onClick={() => toggleLevel(level.key, questions.map((question) => question.id))}>
                      {allOpen ? "收起本级答案" : "展开本级答案"}
                    </button>
                  </header>

                  <div className="interview-wiki-level__groups">
                    {interviewCategories.map((category, categoryIndex) => {
                      const categoryQuestions = questions.filter((question) => question.category === category.key);
                      if (!categoryQuestions.length) return null;

                      return (
                        <section
                          className="interview-wiki-group"
                          id={`wiki-${level.key}-${category.key}`}
                          key={`${level.key}-${category.key}`}
                        >
                          <div className="interview-wiki-group__heading">
                            <div className="interview-wiki-group__number" aria-hidden="true">
                              <small>模块</small>
                              <span>{String(categoryIndex + 1).padStart(2, "0")}</span>
                            </div>
                            <div className="interview-wiki-group__copy">
                              <span>{category.shortLabel}</span>
                              <h3>{category.label}</h3>
                              <p>{category.description}</p>
                            </div>
                            <strong className="interview-wiki-group__count">
                              <span>{categoryQuestions.length}</span>
                              道题目
                            </strong>
                          </div>

                          <div className="interview-wiki-questions">
                            {categoryQuestions.map((question) => {
                              const isOpen = openQuestionIds.has(question.id);
                              const isNoteOpen = openNoteIds.has(question.id);
                              const answerId = `${question.id}-answer`;
                              const noteId = `${question.id}-note`;
                              const categoryInfo = getInterviewCategory(question.category);
                              const questionIndex = orderedQuestions.findIndex((item) => item.id === question.id) + 1;
                              const noteValue = notes[question.id] ?? "";
                              const questionImages = noteImages[question.id] ?? [];
                              const attachmentCount = attachmentCounts[question.id] ?? questionImages.length;
                              const hasNoteContent = Boolean(noteValue || attachmentCount);

                              return (
                                <article
                                  className={`interview-question${isOpen ? " is-open" : ""}${isNoteOpen ? " has-note-open" : ""}`}
                                  key={question.id}
                                >
                                  <div className="interview-question__header">
                                    <button
                                      aria-controls={answerId}
                                      aria-expanded={isOpen}
                                      className="interview-question__toggle"
                                      onClick={() => toggleQuestion(question.id)}
                                      type="button"
                                    >
                                      <span className="interview-question__index">{level.index}.{String(questionIndex).padStart(2, "0")}</span>
                                      <span className="interview-question__copy">
                                        <span className="interview-question__category">{categoryInfo?.shortLabel}</span>
                                        <strong>{question.question}</strong>
                                        <small>{question.intent}</small>
                                      </span>
                                      <span className="interview-question__action">
                                        <span>{isOpen ? "收起答案" : "查看答案"}</span>
                                        <ChevronDown size={18} />
                                      </span>
                                    </button>
                                    <button
                                      aria-controls={noteId}
                                      aria-expanded={isNoteOpen}
                                      aria-label={`${isNoteOpen ? "关闭" : "打开"}笔记：${question.question}`}
                                      className={`interview-question__note-toggle${isNoteOpen ? " is-active" : ""}${hasNoteContent ? " has-note" : ""}`}
                                      onClick={() => toggleNote(question.id)}
                                      type="button"
                                    >
                                      <StickyNote size={16} />
                                      <span>笔记</span>
                                      {hasNoteContent && <i aria-hidden="true" />}
                                    </button>
                                  </div>

                                  {isNoteOpen && (
                                    <motion.div
                                      animate={{ opacity: 1, scaleY: 1 }}
                                      className="interview-question__collapsible"
                                      initial={{ opacity: 0, scaleY: 0.985 }}
                                      key={`${question.id}-note-panel`}
                                      style={{ transformOrigin: "top" }}
                                      transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: "easeOut" }}
                                    >
                                        <div className="interview-question__note" id={noteId}>
                                          <div className="interview-question__note-head">
                                            <label htmlFor={`${noteId}-input`}>
                                              <span className="interview-question__note-icon"><StickyNote size={17} /></span>
                                              <span>
                                                <strong>我的笔记</strong>
                                                <small>记录自己的表达，不必照抄参考答案</small>
                                              </span>
                                            </label>
                                            <span className={`interview-question__note-status${hasNoteContent ? " is-saved" : ""}`}>
                                              <Check size={12} />
                                              {hasNoteContent ? "已自动保存" : "自动保存"}
                                            </span>
                                          </div>
                                          <div className="interview-question__note-editor">
                                            <textarea
                                              id={`${noteId}-input`}
                                              onChange={(event) => setNote(question.id, event.target.value)}
                                              onPaste={(event) => {
                                                const pastedImages = Array.from(event.clipboardData.items)
                                                  .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
                                                  .map((item) => item.getAsFile())
                                                  .filter((file): file is File => Boolean(file));
                                                if (pastedImages.length) {
                                                  event.preventDefault();
                                                  void addNoteImages(question.id, pastedImages);
                                                }
                                              }}
                                              placeholder={"写下你的回答结构、实际项目案例，或下一次需要重点复习的内容……"}
                                              value={noteValue}
                                            />
                                            <footer>
                                              <span>可直接在这里粘贴截图</span>
                                              <strong>{noteValue.length} 字 · {attachmentCount} 张图</strong>
                                            </footer>
                                          </div>
                                          <div className="interview-question__attachments">
                                            <div className="interview-question__attachments-head">
                                              <div>
                                                <strong>截图附件</strong>
                                                <small>支持 PNG、JPEG、WebP；单张不超过 10 MB</small>
                                              </div>
                                              <label htmlFor={`${noteId}-images`}>
                                                <ImagePlus size={15} />
                                                添加截图
                                              </label>
                                              <input
                                                accept="image/*"
                                                id={`${noteId}-images`}
                                                multiple
                                                onChange={(event) => {
                                                  void addNoteImages(question.id, Array.from(event.target.files ?? []));
                                                  event.target.value = "";
                                                }}
                                                type="file"
                                              />
                                            </div>
                                            {noteImageMessages[question.id] && (
                                              <p className="interview-question__attachment-message">
                                                {noteImageMessages[question.id]}
                                              </p>
                                            )}
                                            {questionImages.length > 0 ? (
                                              <div className="interview-question__attachment-grid">
                                                {questionImages.map((image) => (
                                                  <figure key={image.id}>
                                                    <img alt={image.name} src={image.previewUrl} />
                                                    <figcaption>
                                                      <span title={image.name}>{image.name}</span>
                                                      <button
                                                        aria-label={`删除截图：${image.name}`}
                                                        onClick={() => void removeNoteImage(question.id, image.id)}
                                                        type="button"
                                                      >
                                                        <Trash2 size={13} />
                                                      </button>
                                                    </figcaption>
                                                  </figure>
                                                ))}
                                              </div>
                                            ) : (
                                              <div className="interview-question__attachment-empty">
                                                <ImagePlus size={18} />
                                                <span>上传图片，或复制截图后在笔记框中按 ⌘V / Ctrl+V</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                    </motion.div>
                                  )}

                                  {isOpen && (
                                    <motion.div
                                      animate={{ opacity: 1, scaleY: 1 }}
                                      className="interview-question__collapsible"
                                      initial={{ opacity: 0, scaleY: 0.985 }}
                                      key={`${question.id}-answer-panel`}
                                      style={{ transformOrigin: "top" }}
                                      transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: "easeOut" }}
                                    >
                                        <div className="interview-question__answer" id={answerId}>
                                          <section className="interview-question__correct-answer">
                                            <header>
                                              <span><BadgeCheck size={16} /> 正确参考答案</span>
                                              <small>可直接口述，再结合自己的项目案例调整</small>
                                            </header>
                                            <p>{question.method.reference.correctAnswer}</p>
                                          </section>
                                          <div className="interview-question__framework">
                                            <span><Layers3 size={15} /> 解题思路</span>
                                            <p>{question.method.framework}</p>
                                          </div>
                                          <section className="interview-question__reference">
                                            <header className="interview-question__reference-head">
                                              <span><BookOpenCheck size={16} /> 答案拆解</span>
                                              <small>结论、原理与边界逐项说明</small>
                                            </header>
                                            <div className="interview-question__reference-body">
                                              {question.method.reference.paragraphs.map((paragraph, index) => (
                                                <div className="interview-question__reference-paragraph" key={question.method.steps[index]?.title ?? index}>
                                                  <span>
                                                    {String(index + 1).padStart(2, "0")}
                                                    <strong>{question.method.steps[index]?.title}</strong>
                                                  </span>
                                                  <p>{paragraph}</p>
                                                </div>
                                              ))}
                                            </div>
                                            <div className="interview-question__application">
                                              <span><Lightbulb size={15} /> 项目落地参考</span>
                                              <p>{question.method.reference.application}</p>
                                            </div>
                                            <div className="interview-question__pitfalls">
                                              <span><TriangleAlert size={15} /> 常见误区</span>
                                              <ul>
                                                {question.method.reference.pitfalls.map((pitfall) => (
                                                  <li key={pitfall}>{pitfall}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          </section>
                                          <div className="interview-question__checklist">
                                            <strong>回答加分项</strong>
                                            <ul>
                                              {question.method.checklist.map((item) => (
                                                <li key={item}><Check size={14} />{item}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        </div>
                                    </motion.div>
                                  )}
                                </article>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
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
