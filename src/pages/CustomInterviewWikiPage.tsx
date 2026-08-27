import { useMemo, useRef, useState } from "react";
import {
  BookOpenText,
  Check,
  ChevronDown,
  Download,
  FileJson,
  Layers3,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import FooterSection from "@/components/FooterSection";
import {
  useCustomInterviewStore,
  type CustomInterviewQuestion,
} from "@/store/customInterviewStore";

const emptyDraft = {
  question: "",
  answer: "",
  module: "",
  tags: "",
};

function normalizeQuestion(question: CustomInterviewQuestion) {
  return {
    id: String(question.id ?? ""),
    question: String(question.question ?? "").trim(),
    answer: String(question.answer ?? "").trim(),
    module: String(question.module ?? "").trim(),
    tags: Array.isArray(question.tags)
      ? question.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [],
    createdAt: Number(question.createdAt) || Date.now(),
    updatedAt: Number(question.updatedAt) || Date.now(),
  } satisfies CustomInterviewQuestion;
}

function isImportableQuestion(value: unknown): value is CustomInterviewQuestion {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CustomInterviewQuestion>;
  return (
    typeof item.id === "string" &&
    typeof item.question === "string" &&
    typeof item.answer === "string" &&
    typeof item.module === "string"
  );
}

export default function CustomInterviewWikiPage() {
  const questions = useCustomInterviewStore((state) => state.questions);
  const addQuestion = useCustomInterviewStore((state) => state.addQuestion);
  const updateQuestion = useCustomInterviewStore((state) => state.updateQuestion);
  const removeQuestion = useCustomInterviewStore((state) => state.removeQuestion);
  const restoreQuestion = useCustomInterviewStore((state) => state.restoreQuestion);
  const importQuestions = useCustomInterviewStore((state) => state.importQuestions);
  const [draft, setDraft] = useState(emptyDraft);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openQuestionIds, setOpenQuestionIds] = useState<Set<string>>(() => new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [recentlyDeleted, setRecentlyDeleted] = useState<CustomInterviewQuestion | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();

  const modules = useMemo(
    () => Array.from(new Set(questions.map((question) => question.module))).sort((a, b) => a.localeCompare(b, "zh-CN")),
    [questions],
  );
  const normalizedSearch = searchQuery.trim().normalize("NFKC").toLocaleLowerCase();
  const filteredQuestions = useMemo(
    () =>
      questions.filter((question) => {
        if (!normalizedSearch) return true;
        const text = [
          question.question,
          question.answer,
          question.module,
          question.tags.join(" "),
        ]
          .join(" ")
          .normalize("NFKC")
          .toLocaleLowerCase();
        return normalizedSearch.split(/\s+/).filter(Boolean).every((token) => text.includes(token));
      }),
    [normalizedSearch, questions],
  );

  const resetEditor = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setFormMessage("");
  };

  const openCreateEditor = () => {
    resetEditor();
    setEditorOpen(true);
    requestAnimationFrame(() => document.querySelector("#custom-question-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const openEditEditor = (question: CustomInterviewQuestion) => {
    setDraft({
      question: question.question,
      answer: question.answer,
      module: question.module,
      tags: question.tags.join("，"),
    });
    setEditingId(question.id);
    setFormMessage("");
    setEditorOpen(true);
    requestAnimationFrame(() => document.querySelector("#custom-question-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const closeEditor = () => {
    setEditorOpen(false);
    resetEditor();
  };

  const submitQuestion = () => {
    const question = draft.question.trim();
    const answer = draft.answer.trim();
    const module = draft.module.trim();

    if (!question || !answer || !module) {
      setFormMessage("请填写题目、正确答案和所属模块。");
      return;
    }

    const payload = {
      question,
      answer,
      module,
      tags: draft.tags
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    if (editingId) {
      updateQuestion(editingId, payload);
    } else {
      addQuestion(payload);
    }

    closeEditor();
  };

  const deleteQuestion = (question: CustomInterviewQuestion) => {
    if (!globalThis.confirm(`确定删除“${question.question}”吗？`)) return;
    removeQuestion(question.id);
    setRecentlyDeleted(question);
    setOpenQuestionIds((current) => {
      const next = new Set(current);
      next.delete(question.id);
      return next;
    });
  };

  const undoDelete = () => {
    if (!recentlyDeleted) return;
    restoreQuestion(recentlyDeleted);
    setRecentlyDeleted(null);
  };

  const exportQuestionBank = () => {
    const payload = JSON.stringify(
      {
        version: 2,
        exportedAt: new Date().toISOString(),
        questions: questions.map(normalizeQuestion),
      },
      null,
      2,
    );
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `我的面试题库-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const candidateQuestions = Array.isArray(parsed)
        ? parsed
        : typeof parsed === "object" && parsed && Array.isArray((parsed as { questions?: unknown }).questions)
          ? (parsed as { questions: unknown[] }).questions
          : [];
      const validQuestions = candidateQuestions
        .filter(isImportableQuestion)
        .map(normalizeQuestion)
        .filter((question) => question.question && question.answer && question.module);

      if (!validQuestions.length) throw new Error("没有有效题目");
      importQuestions(validQuestions);
      setImportMessage(`已导入 ${validQuestions.length} 道题；相同 ID 的内容已更新。`);
    } catch {
      setImportMessage("导入失败：请选择由本工具导出的 JSON 文件。");
    }
  };

  const toggleAnswer = (questionId: string) => {
    setOpenQuestionIds((current) => {
      const next = new Set(current);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  return (
    <div className="blog-page interview-wiki-page custom-interview-page">
      <main>
        <section className="interview-wiki-hero custom-interview-hero">
          <div className="content-shell interview-wiki-hero__inner">
            <Link className="interview-wiki-hero__back" to="/category/knowledge-base">
              KNOWLEDGE BASE / 自定义题库
            </Link>
            <div className="interview-wiki-hero__copy">
              <p className="interview-wiki-hero__eyebrow">
                <Sparkles size={14} /> Personal Interview Knowledge Base
              </p>
              <h1>自定义<br />面试题库</h1>
              <p>只保留系统框架，题目、答案、模块和标签都由你自己维护。</p>
            </div>
            <div className="interview-wiki-hero__stats" aria-label="自定义题库统计">
              <div><strong>{questions.length}</strong><span>我的题目</span></div>
              <div><strong>{modules.length}</strong><span>自定义模块</span></div>
              <div><strong>自动</strong><span>保存方式</span></div>
            </div>
          </div>
        </section>

        <div className="content-shell interview-wiki-layout">
          <aside className="interview-wiki-toc custom-interview-toc">
            <div className="interview-wiki-toc__head">
              <BookOpenText size={17} />
              <span>我的目录</span>
            </div>
            <nav aria-label="自定义题库目录">
              <a className="interview-wiki-toc__primary" href="#custom-overview"><span>00</span>题库管理</a>
              {modules.map((module, index) => {
                const moduleQuestionCount = questions.filter((question) => question.module === module).length;
                return (
                  <a
                    className="interview-wiki-toc__primary custom-interview-toc__primary"
                    href={`#custom-module-${encodeURIComponent(module)}`}
                    key={module}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{module}</strong>
                    <small>{moduleQuestionCount} 题</small>
                  </a>
                );
              })}
            </nav>
            <div className="custom-interview-toc__storage">
              <FileJson size={15} />
              <span>自动保存在当前浏览器</span>
            </div>
          </aside>

          <div className="interview-wiki-content custom-interview-content">
            <section className="custom-interview-overview" id="custom-overview">
              <div>
                <span>PERSONAL WIKI</span>
                <h2>建立你自己的题目与答案。</h2>
                <p>新建后会自动归入对应模块；答案默认隐藏，方便先独立作答。</p>
              </div>
              <div className="custom-interview-toolbar">
                <button className="custom-interview-button is-primary" onClick={openCreateEditor} type="button">
                  <Plus size={16} /> 新建题目
                </button>
                <button className="custom-interview-button" disabled={!questions.length} onClick={exportQuestionBank} type="button">
                  <Download size={15} /> 导出题库
                </button>
                <button className="custom-interview-button" onClick={() => importInputRef.current?.click()} type="button">
                  <Upload size={15} /> 导入题库
                </button>
                <input
                  accept="application/json,.json"
                  className="custom-interview-import-input"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleImport(file);
                    event.target.value = "";
                  }}
                  ref={importInputRef}
                  type="file"
                />
              </div>
              {importMessage && <p className="custom-interview-message">{importMessage}</p>}
            </section>

            {editorOpen && (
              <motion.section
                animate={{ opacity: 1, y: 0 }}
                className="custom-question-editor"
                id="custom-question-editor"
                initial={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
                transition={{ duration: reduceMotion ? 0 : 0.22 }}
              >
                <header>
                  <div>
                    <span>{editingId ? "EDIT QUESTION" : "NEW QUESTION"}</span>
                    <h2>{editingId ? "修改题目与答案" : "添加一道新题"}</h2>
                  </div>
                  <button aria-label="关闭题目编辑器" onClick={closeEditor} type="button"><X size={18} /></button>
                </header>
                <div className="custom-question-editor__grid">
                  <label className="custom-question-editor__wide">
                    <span>题目 *</span>
                    <textarea
                      onChange={(event) => setDraft((current) => ({ ...current, question: event.target.value }))}
                      placeholder="输入你想复习的面试问题……"
                      rows={3}
                      value={draft.question}
                    />
                  </label>
                  <label className="custom-question-editor__wide">
                    <span>正确答案 *</span>
                    <textarea
                      onChange={(event) => setDraft((current) => ({ ...current, answer: event.target.value }))}
                      placeholder="写下完整答案、原理、边界和项目案例……"
                      rows={8}
                      value={draft.answer}
                    />
                  </label>
                  <label>
                    <span>所属模块 *</span>
                    <input
                      list="custom-module-options"
                      onChange={(event) => setDraft((current) => ({ ...current, module: event.target.value }))}
                      placeholder="例如：UE 材质"
                      value={draft.module}
                    />
                    <datalist id="custom-module-options">
                      {modules.map((module) => <option key={module} value={module} />)}
                    </datalist>
                  </label>
                  <label>
                    <span>标签</span>
                    <input
                      onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
                      placeholder="用逗号分隔，例如：Lumen，GI，排错"
                      value={draft.tags}
                    />
                  </label>
                </div>
                {formMessage && <p className="custom-question-editor__error">{formMessage}</p>}
                <footer>
                  <button className="custom-interview-button" onClick={closeEditor} type="button">取消</button>
                  <button className="custom-interview-button is-primary" onClick={submitQuestion} type="button">
                    <Save size={15} /> {editingId ? "保存修改" : "保存题目"}
                  </button>
                </footer>
              </motion.section>
            )}

            <section className="interview-wiki-search custom-interview-search" aria-label="搜索我的题库">
              <Search size={19} aria-hidden="true" />
              <label htmlFor="custom-interview-search-input">
                <span>搜索我的题目与答案</span>
                <input
                  autoComplete="off"
                  id="custom-interview-search-input"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="输入题目、答案、模块或标签……"
                  type="search"
                  value={searchQuery}
                />
              </label>
              <span className="interview-wiki-search__count" aria-live="polite">
                {normalizedSearch ? `${filteredQuestions.length} / ${questions.length}` : `${questions.length} 道题`}
              </span>
              {searchQuery && (
                <button aria-label="清空搜索" onClick={() => setSearchQuery("")} type="button"><X size={15} /></button>
              )}
            </section>

            {!questions.length && !editorOpen && (
              <section className="custom-interview-empty">
                <div><Plus size={25} /></div>
                <span>EMPTY KNOWLEDGE BASE</span>
                <h2>这里还没有题目。</h2>
                <p>从第一道真正想复习的问题开始，逐步建立属于你的面试 Wiki。</p>
                <button className="custom-interview-button is-primary" onClick={openCreateEditor} type="button">
                  <Plus size={16} /> 添加第一道题
                </button>
              </section>
            )}

            {questions.length > 0 && filteredQuestions.length === 0 && (
              <section className="custom-interview-empty is-compact">
                <Search size={24} />
                <h2>没有找到匹配的内容。</h2>
                <button className="custom-interview-button" onClick={() => setSearchQuery("")} type="button">清空搜索</button>
              </section>
            )}

            {modules.map((module, moduleIndex) => {
              const moduleQuestions = filteredQuestions.filter((question) => question.module === module);
              if (!moduleQuestions.length) return null;
              const moduleNumber = String(moduleIndex + 1).padStart(2, "0");

              return (
                <section
                  className="interview-wiki-level interview-wiki-level--low custom-interview-module"
                  id={`custom-module-${encodeURIComponent(module)}`}
                  key={module}
                >
                  <header className="interview-wiki-level__header">
                    <div className="interview-wiki-level__number">{moduleNumber}</div>
                    <div className="interview-wiki-level__copy">
                      <span>MY MODULE</span>
                      <h2>{module}</h2>
                      <p>由你维护的个人知识模块。</p>
                    </div>
                    <strong className="custom-interview-module__count">{moduleQuestions.length} 道题</strong>
                  </header>

                  <div className="interview-wiki-level__groups">
                    <div className="interview-wiki-questions">
                      {moduleQuestions.map((question, index) => {
                        const isOpen = openQuestionIds.has(question.id);
                        return (
                          <article className={`interview-question custom-question${isOpen ? " is-open" : ""}`} key={question.id}>
                            <div className="custom-question__header">
                              <button
                                aria-controls={`${question.id}-custom-answer`}
                                aria-expanded={isOpen}
                                className="custom-question__toggle"
                                onClick={() => toggleAnswer(question.id)}
                                type="button"
                              >
                                <span className="interview-question__index">
                                  {moduleNumber}.{String(index + 1).padStart(2, "0")}
                                </span>
                                <span className="custom-question__copy">
                                  <span>{module}</span>
                                  <strong>{question.question}</strong>
                                  {question.tags.length > 0 && (
                                    <small>{question.tags.map((tag) => `#${tag}`).join("  ")}</small>
                                  )}
                                </span>
                                <span className="interview-question__action">
                                  <span>{isOpen ? "收起答案" : "查看答案"}</span>
                                  <ChevronDown size={18} />
                                </span>
                              </button>
                              <div className="custom-question__actions">
                                <button aria-label={`编辑题目：${question.question}`} onClick={() => openEditEditor(question)} type="button">
                                  <Pencil size={14} />
                                </button>
                                <button aria-label={`删除题目：${question.question}`} onClick={() => deleteQuestion(question)} type="button">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            {isOpen && (
                              <motion.div
                                animate={{ opacity: 1, scaleY: 1 }}
                                className="interview-question__collapsible"
                                initial={{ opacity: 0, scaleY: reduceMotion ? 1 : 0.985 }}
                                style={{ transformOrigin: "top" }}
                                transition={{ duration: reduceMotion ? 0 : 0.24 }}
                              >
                                <div className="custom-question__answer" id={`${question.id}-custom-answer`}>
                                  <header><Check size={16} /><span>我的正确答案</span></header>
                                  <p>{question.answer}</p>
                                  <footer>
                                    <Layers3 size={14} />
                                    <span>{module}</span>
                                    <time>{new Date(question.updatedAt).toLocaleDateString("zh-CN")}</time>
                                  </footer>
                                </div>
                              </motion.div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </main>

      {recentlyDeleted && (
        <div className="custom-interview-undo" role="status">
          <span>已删除“{recentlyDeleted.question}”</span>
          <button onClick={undoDelete} type="button"><RotateCcw size={14} />撤销</button>
          <button aria-label="关闭删除提示" onClick={() => setRecentlyDeleted(null)} type="button"><X size={14} /></button>
        </div>
      )}

      <FooterSection />
    </div>
  );
}
