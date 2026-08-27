import { useEffect, useMemo, useRef } from "react";
import { ArrowLeft, BookOpenText } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FooterSection from "@/components/FooterSection";
import archiveData from "@/data/generated/gameTaHtmlArchive.json";
import { useThemeStore } from "@/store/themeStore";

type HtmlArchivePage = {
  id: string;
  title: string;
  sourceFile: string;
  css: string;
  bodyHtml: string;
};

type HtmlArchive = {
  key: string;
  title: string;
  pages: HtmlArchivePage[];
};

const archive = archiveData as HtmlArchive;
const baseRoute = "/knowledge-base/game-ta-interview-100";

const blogThemeOverrides = `
  :host {
    color-scheme: light dark;
    --theme-transition: 220ms ease;
  }

  :host([data-blog-theme="light"]) {
    color-scheme: light;
    --primary: #8f76da;
    --primary-dark: #6f55b4;
    --primary-light: #baa8ea;
    --accent: #a172b1;
    --accent-light: #dbcaf0;
    --gradient-main: linear-gradient(135deg, #8067ca, #a487d3);
    --gradient-soft: linear-gradient(135deg, #8067ca 0%, #a487d3 52%, #c4a8df 100%);
    --gradient-header: linear-gradient(135deg, #7258b8, #9677ca, #b695d6);
    --gradient-header-dark: linear-gradient(135deg, #59407a, #75559a, #9874b4);
    --bg-page: #f6f1fb;
    --bg-white: #ffffff;
    --bg-gray-50: #ffffff;
    --bg-gray-100: #ffffff;
    --bg-green-50: #ffffff;
    --bg-teal-50: #ffffff;
    --text-primary: #2a2038;
    --text-secondary: #655a74;
    --text-muted: #8d819a;
    --border-light: rgba(111, 85, 180, 0.14);
    --border-default: rgba(111, 85, 180, 0.25);
    --shadow-sm: 0 1px 2px rgba(55, 34, 82, 0.05);
    --shadow-card: 0 2px 8px rgba(55, 34, 82, 0.06);
    --shadow-card-hover: 0 12px 28px rgba(111, 85, 180, 0.14), 0 2px 6px rgba(55, 34, 82, 0.05);
  }

  :host([data-blog-theme="dark"]) {
    color-scheme: dark;
    --primary: #b497cf;
    --primary-dark: #c9afe0;
    --primary-light: #d8c3eb;
    --accent: #c48bd1;
    --accent-light: #d9b9e4;
    --gradient-main: linear-gradient(135deg, #785a99, #9a74ba);
    --gradient-soft: linear-gradient(135deg, #735493 0%, #9770b5 52%, #b489cb 100%);
    --gradient-header: linear-gradient(135deg, #684887, #8861a7, #aa7fc0);
    --gradient-header-dark: linear-gradient(135deg, #49325f, #65467e, #815b99);
    --bg-page: #090611;
    --bg-white: #15101e;
    --bg-gray-50: #1a1425;
    --bg-gray-100: #21192d;
    --bg-green-50: #20172b;
    --bg-teal-50: #1d1628;
    --text-primary: #f4efff;
    --text-secondary: #c8bdd5;
    --text-muted: #978aa7;
    --border-light: rgba(196, 171, 219, 0.14);
    --border-default: rgba(196, 171, 219, 0.28);
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.26);
    --shadow-card: 0 8px 24px rgba(0, 0, 0, 0.2);
    --shadow-card-hover: 0 16px 38px rgba(0, 0, 0, 0.34), 0 0 0 1px rgba(180, 151, 207, 0.08);
  }

  .html-archive-page,
  .catalog-card,
  .stats-bar,
  .course-info,
  .chapter-container,
  .chapter-guide,
  .question-card,
  .question-section,
  .summary-box,
  .tip-box,
  .practice-box,
  .self-check,
  .editor-note,
  .scenario-card,
  .score-level,
  .flowchart,
  .timeline-item,
  .compare-item,
  .arch-diagram,
  table,
  tbody tr {
    transition: background-color var(--theme-transition), border-color var(--theme-transition), color var(--theme-transition), box-shadow var(--theme-transition);
  }

  :host([data-blog-theme="light"]) .card-number {
    background: #ffffff;
    color: #7255b5;
  }

  :host([data-blog-theme="light"]) .question-section.quick-answer {
    background: #ffffff;
    border-bottom-color: rgba(143, 118, 218, 0.2);
  }

  :host([data-blog-theme="light"]) .question-section.quick-answer h4,
  :host([data-blog-theme="light"]) .question-section.quick-answer p {
    color: #60469a;
  }

  :host([data-blog-theme="light"]) .editor-note {
    background: #ffffff;
    border-color: rgba(143, 118, 218, 0.2);
    border-left-color: #8f76da;
    color: #60469a;
  }

  :host([data-blog-theme="light"]) .editor-note::before {
    background: #ffffff;
    color: #7255b5;
  }

  :host([data-blog-theme="light"]) .catalog-card,
  :host([data-blog-theme="light"]) .stats-bar,
  :host([data-blog-theme="light"]) .course-info,
  :host([data-blog-theme="light"]) .chapter-container,
  :host([data-blog-theme="light"]) .chapter-guide,
  :host([data-blog-theme="light"]) .question-card,
  :host([data-blog-theme="light"]) .question-section,
  :host([data-blog-theme="light"]) .summary-box,
  :host([data-blog-theme="light"]) .tip-box,
  :host([data-blog-theme="light"]) .practice-box,
  :host([data-blog-theme="light"]) .self-check,
  :host([data-blog-theme="light"]) .scenario-card,
  :host([data-blog-theme="light"]) .score-level,
  :host([data-blog-theme="light"]) .flowchart,
  :host([data-blog-theme="light"]) .timeline-item,
  :host([data-blog-theme="light"]) .compare-item,
  :host([data-blog-theme="light"]) .arch-diagram,
  :host([data-blog-theme="light"]) table,
  :host([data-blog-theme="light"]) tbody tr {
    background: #ffffff;
    background-image: none;
  }

  .catalog-card,
  .catalog-card-link {
    cursor: pointer;
  }

  .catalog-card:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 4px;
  }

  :host([data-blog-theme="dark"]) .catalog-card:hover {
    border-color: rgba(180, 151, 207, 0.42);
  }

  :host([data-blog-theme="dark"]) .card-number {
    background: rgba(196, 139, 209, 0.14);
    color: #dba7e4;
  }

  :host([data-blog-theme="dark"]) .tip-box.warning,
  :host([data-blog-theme="dark"]) .scenario-card.orange,
  :host([data-blog-theme="dark"]) .self-check,
  :host([data-blog-theme="dark"]) .score-pass {
    background: #251d14;
  }

  :host([data-blog-theme="dark"]) .tip-box.warning::before,
  :host([data-blog-theme="dark"]) .score-pass .score-badge,
  :host([data-blog-theme="dark"]) .diff-intermediate {
    background: rgba(245, 158, 11, 0.15);
    color: #f2c574;
  }

  :host([data-blog-theme="dark"]) .self-check::before,
  :host([data-blog-theme="dark"]) .self-check ol li::before,
  :host([data-blog-theme="dark"]) .scenario-card.orange h4 {
    color: #f2c574;
  }

  :host([data-blog-theme="dark"]) .tip-box.important,
  :host([data-blog-theme="dark"]) .score-fail {
    background: #28171f;
  }

  :host([data-blog-theme="dark"]) .tip-box.important::before,
  :host([data-blog-theme="dark"]) .score-fail .score-badge,
  :host([data-blog-theme="dark"]) .diff-advanced {
    background: rgba(244, 114, 182, 0.14);
    color: #f3a1c2;
  }

  :host([data-blog-theme="dark"]) .score-excellent,
  :host([data-blog-theme="dark"]) .scenario-card.green {
    background: #1d1a26;
  }

  :host([data-blog-theme="dark"]) .score-excellent .score-badge,
  :host([data-blog-theme="dark"]) .diff-beginner {
    background: rgba(180, 151, 207, 0.15);
    color: #d8c3eb;
  }

  :host([data-blog-theme="dark"]) .question-section.quick-answer {
    background: linear-gradient(135deg, #20172b, #1b1425);
    border-bottom-color: rgba(180, 151, 207, 0.2);
  }

  :host([data-blog-theme="dark"]) .question-section.quick-answer h4,
  :host([data-blog-theme="dark"]) .question-section.quick-answer p {
    color: #d8c3eb;
  }

  :host([data-blog-theme="dark"]) .editor-note {
    background: linear-gradient(135deg, #1d1729, #191421);
    border-color: rgba(180, 151, 207, 0.18);
    border-left-color: #9a74ba;
    color: #cdb9df;
  }

  :host([data-blog-theme="dark"]) .editor-note::before {
    background: rgba(180, 151, 207, 0.12);
    color: #d8c3eb;
  }

  :host([data-blog-theme="dark"]) .arch-node.secondary {
    background: #251d14;
    color: #f2c574;
  }

  :host([data-blog-theme="dark"]) .arch-node.accent,
  :host([data-blog-theme="dark"]) .scenario-card.blue {
    background: #171b2a;
    color: #b8c8f5;
  }

  :host([data-blog-theme="dark"]) .scenario-card.blue h4 {
    color: #b8c8f5;
  }

  :host([data-blog-theme="dark"]) .scenario-card.purple {
    background: #21172d;
  }

  :host([data-blog-theme="dark"]) .scenario-card.purple h4 {
    color: #d9b9e4;
  }

  :host([data-blog-theme="dark"]) pre {
    background: #0b0811;
    border-color: #2c2238;
  }

  :host([data-blog-theme="dark"]) pre .code-header {
    background: #181121;
    border-bottom-color: #2c2238;
    color: #aa9dbc;
  }
`;

function adaptOriginalCss(css: string) {
  return css
    .replace(/:root/g, ":host")
    .replace(/\bbody\b/g, ".html-archive-page");
}

function routeFromOriginalHref(href: string) {
  if (href === "index.html") return baseRoute;
  const chapterMatch = href.match(/^(\d{2})\.html$/);
  return chapterMatch ? `${baseRoute}/${chapterMatch[1]}` : null;
}

function findArchiveAnchorFromEvent(event: Event) {
  return event.composedPath().find(
    (node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement,
  );
}

function findArchiveCardFromEvent(event: Event) {
  return event.composedPath().find(
    (node): node is HTMLElement =>
      node instanceof HTMLElement && node.matches(".chapter-card, .catalog-card, .catalog-card-link"),
  );
}

export default function GameTaOriginalFormatPage() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme);
  const hostRef = useRef<HTMLDivElement>(null);
  const page = useMemo(
    () => archive.pages.find((item) => item.id === (pageId ?? "index")) ?? archive.pages[0],
    [pageId],
  );

  useEffect(() => {
    globalThis.scrollTo(0, 0);
  }, [page.id]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .html-archive-page { min-height: 640px; }
        ${adaptOriginalCss(page.css)}
        ${blogThemeOverrides}
      </style>
      <div class="html-archive-page">${page.bodyHtml}</div>
    `;

    shadowRoot.querySelectorAll<HTMLElement>(".chapter-card, .catalog-card").forEach((card) => {
      const anchor = card.querySelector<HTMLAnchorElement>("a[href]");
      if (!anchor || !routeFromOriginalHref(anchor.getAttribute("href") ?? "")) return;
      card.setAttribute("role", "link");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", anchor.textContent?.trim() || "进入章节");
    });

    const handleArchiveClick = (event: Event) => {
      const anchor = findArchiveAnchorFromEvent(event);
      const card = anchor ? null : findArchiveCardFromEvent(event);
      const href = anchor?.getAttribute("href") ?? card?.querySelector<HTMLAnchorElement>("a[href]")?.getAttribute("href") ?? "";
      const targetRoute = routeFromOriginalHref(href);
      if (!targetRoute) return;
      event.preventDefault();
      navigate(targetRoute);
    };

    const handleArchiveKeyDown = (event: Event) => {
      if (!(event instanceof KeyboardEvent) || (event.key !== "Enter" && event.key !== " ")) return;
      const card = findArchiveCardFromEvent(event);
      const href = card?.querySelector<HTMLAnchorElement>("a[href]")?.getAttribute("href") ?? "";
      const targetRoute = routeFromOriginalHref(href);
      if (!targetRoute) return;
      event.preventDefault();
      navigate(targetRoute);
    };

    shadowRoot.addEventListener("click", handleArchiveClick);
    shadowRoot.addEventListener("keydown", handleArchiveKeyDown);
    return () => {
      shadowRoot.removeEventListener("click", handleArchiveClick);
      shadowRoot.removeEventListener("keydown", handleArchiveKeyDown);
    };
  }, [navigate, page]);

  return (
    <div className="blog-page game-ta-original-page">
      <main className="game-ta-original-page__main">
        <div className="content-shell game-ta-original-page__toolbar">
          <Link to="/category/knowledge-base"><ArrowLeft size={14} /> 返回知识库</Link>
          <span><BookOpenText size={15} /> 原版结构 · React 页面</span>
          <strong>{page.id === "index" ? "总目录" : `第 ${page.id} 章`}</strong>
        </div>

        <div
          className="content-shell game-ta-original-page__archive"
          data-blog-theme={theme}
          data-testid="game-ta-html-archive"
          ref={hostRef}
        />
      </main>

      <FooterSection />
    </div>
  );
}
