import { useEffect, useMemo, useRef } from "react";
import { ArrowLeft, BookOpenText } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FooterSection from "@/components/FooterSection";
import type { HtmlArchive } from "@/data/htmlArchiveTypes";
import { useThemeStore } from "@/store/themeStore";

type HtmlArchiveReaderPageProps = {
  archive: HtmlArchive;
  baseRoute: string;
  testId: string;
};

const blogThemeOverrides = `
  :host {
    color-scheme: light dark;
    --theme-transition: 220ms ease;
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 12px;
    --radius-xl: 16px;
  }

  :host([data-blog-theme="light"]) {
    color-scheme: light;
    --primary: #8f76da;
    --primary-dark: #6f55b4;
    --primary-light: #baa8ea;
    --primary-color: #8f76da;
    --secondary-color: #6d8ecb;
    --accent: #a172b1;
    --accent-color: #a172b1;
    --accent-light: #dbcaf0;
    --gradient-main: linear-gradient(135deg, #8067ca, #a487d3);
    --gradient-soft: linear-gradient(135deg, #8067ca 0%, #a487d3 52%, #c4a8df 100%);
    --gradient-header: linear-gradient(135deg, #7258b8, #9677ca, #b695d6);
    --gradient-header-dark: linear-gradient(135deg, #59407a, #75559a, #9874b4);
    --bg-page: #f6f1fb;
    --bg-color: #f6f1fb;
    --light-bg: #f6f1fb;
    --bg-white: #ffffff;
    --card-bg: #ffffff;
    --bg-gray-50: #ffffff;
    --bg-gray-100: #ffffff;
    --bg-green-50: #ffffff;
    --bg-teal-50: #ffffff;
    --light-color: #ffffff;
    --text-primary: #2a2038;
    --text-dark: #2a2038;
    --text-color: #2a2038;
    --dark-color: #2a2038;
    --text-secondary: #655a74;
    --text-light: #655a74;
    --text-muted: #8d819a;
    --border-light: rgba(111, 85, 180, 0.14);
    --border-default: rgba(111, 85, 180, 0.25);
    --border-color: rgba(111, 85, 180, 0.25);
    --shadow: 0 8px 18px rgba(55, 34, 82, 0.08);
    --shadow-sm: 0 1px 2px rgba(55, 34, 82, 0.05);
    --shadow-card: 0 2px 8px rgba(55, 34, 82, 0.06);
    --shadow-card-hover: 0 12px 28px rgba(111, 85, 180, 0.14), 0 2px 6px rgba(55, 34, 82, 0.05);
    --archive-page-bg: #ffffff;
    --archive-surface: #ffffff;
    --archive-surface-soft: #ffffff;
    --archive-card-bg: #ffffff;
  }

  :host([data-blog-theme="dark"]) {
    color-scheme: dark;
    --primary: #b497cf;
    --primary-dark: #c9afe0;
    --primary-light: #d8c3eb;
    --primary-color: #b497cf;
    --secondary-color: #8da3d5;
    --accent: #c48bd1;
    --accent-color: #c48bd1;
    --accent-light: #d9b9e4;
    --gradient-main: linear-gradient(135deg, #785a99, #9a74ba);
    --gradient-soft: linear-gradient(135deg, #735493 0%, #9770b5 52%, #b489cb 100%);
    --gradient-header: linear-gradient(135deg, #684887, #8861a7, #aa7fc0);
    --gradient-header-dark: linear-gradient(135deg, #49325f, #65467e, #815b99);
    --bg-page: #090611;
    --bg-color: #090611;
    --light-bg: #090611;
    --bg-white: #15101e;
    --card-bg: #15101e;
    --bg-gray-50: #1a1425;
    --bg-gray-100: #21192d;
    --bg-green-50: #20172b;
    --bg-teal-50: #1d1628;
    --light-color: #20172b;
    --text-primary: #f4efff;
    --text-dark: #f4efff;
    --text-color: #f4efff;
    --dark-color: #f4efff;
    --text-secondary: #c8bdd5;
    --text-light: #c8bdd5;
    --text-muted: #978aa7;
    --border-light: rgba(196, 171, 219, 0.14);
    --border-default: rgba(196, 171, 219, 0.28);
    --border-color: rgba(196, 171, 219, 0.22);
    --shadow: 0 10px 26px rgba(0, 0, 0, 0.28);
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.26);
    --shadow-card: 0 8px 24px rgba(0, 0, 0, 0.2);
    --shadow-card-hover: 0 16px 38px rgba(0, 0, 0, 0.34), 0 0 0 1px rgba(180, 151, 207, 0.08);
    --archive-page-bg: transparent;
    --archive-surface: rgba(36, 24, 58, 0.58);
    --archive-surface-soft: rgba(30, 22, 44, 0.48);
    --archive-card-bg: rgba(42, 31, 62, 0.62);
  }

  .html-archive-page,
  .container,
  .catalog-container,
  .directory-container,
  .chapter-container,
  .chapter-card,
  .card,
  .content-card,
  .step-card,
  .tool-card,
  .method-card,
  .strategy-card,
  .checklist-card,
  .comparison-card,
  .tip-box,
  .highlight-box,
  .svg-container,
  table,
  tbody tr {
    transition: background-color var(--theme-transition), border-color var(--theme-transition), color var(--theme-transition), box-shadow var(--theme-transition);
  }

  .html-archive-page {
    background: var(--archive-page-bg) !important;
    color: var(--text-secondary);
  }

  .html-archive-page > .container,
  .html-archive-page .double-border-container,
  .html-archive-page .chapter-container,
  .html-archive-page .catalog-container {
    background: var(--archive-surface) !important;
    color: var(--text-secondary);
  }

  .html-archive-page header,
  .html-archive-page .catalog-hero,
  .html-archive-page .chapter-header {
    background: var(--gradient-header) !important;
  }

  .html-archive-page header h1,
  .html-archive-page header p,
  .html-archive-page header strong,
  .html-archive-page .catalog-hero h1,
  .html-archive-page .catalog-hero p,
  .html-archive-page .catalog-hero .subtitle,
  .html-archive-page .chapter-header h1,
  .html-archive-page .chapter-header h2,
  .html-archive-page .chapter-header p {
    color: #fff !important;
  }

  :host([data-blog-theme="light"]) .html-archive-page .chapter-card,
  :host([data-blog-theme="light"]) .html-archive-page .card,
  :host([data-blog-theme="light"]) .html-archive-page .content-card,
  :host([data-blog-theme="light"]) .html-archive-page .step-card,
  :host([data-blog-theme="light"]) .html-archive-page .tool-card,
  :host([data-blog-theme="light"]) .html-archive-page .method-card,
  :host([data-blog-theme="light"]) .html-archive-page .strategy-card,
  :host([data-blog-theme="light"]) .html-archive-page .checklist-card,
  :host([data-blog-theme="light"]) .html-archive-page .comparison-card,
  :host([data-blog-theme="light"]) .html-archive-page .tip-box,
  :host([data-blog-theme="light"]) .html-archive-page .highlight-box,
  :host([data-blog-theme="light"]) .html-archive-page .highlight,
  :host([data-blog-theme="light"]) .html-archive-page .key-point,
  :host([data-blog-theme="light"]) .html-archive-page .tip,
  :host([data-blog-theme="light"]) .html-archive-page .note,
  :host([data-blog-theme="light"]) .html-archive-page .architecture,
  :host([data-blog-theme="light"]) .html-archive-page .arch-diagram,
  :host([data-blog-theme="light"]) .html-archive-page .section,
  :host([data-blog-theme="light"]) .html-archive-page .course-info,
  :host([data-blog-theme="light"]) .html-archive-page .stats-bar,
  :host([data-blog-theme="light"]) .html-archive-page .course-info-item,
  :host([data-blog-theme="light"]) .html-archive-page .stats-item,
  :host([data-blog-theme="light"]) .html-archive-page table,
  :host([data-blog-theme="light"]) .html-archive-page tbody tr {
    background: #ffffff !important;
    background-image: none !important;
  }

  .html-archive-page svg {
    max-width: 100%;
  }

  .html-archive-page pre,
  .html-archive-page .code-block {
    overflow-x: auto;
  }

  .html-archive-page .fas {
    display: none !important;
  }

  .html-archive-page .chapter-card,
  .html-archive-page .catalog-card,
  .html-archive-page .catalog-card-link {
    cursor: pointer;
  }

  .html-archive-page .chapter-card:focus-visible,
  .html-archive-page .catalog-card:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 4px;
  }

  .html-archive-page .chapter-nav {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 12px !important;
    margin-top: 40px !important;
    padding: 0 20px !important;
  }

  .html-archive-page .chapter-nav a {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px !important;
    min-width: 120px !important;
    min-height: 42px !important;
    padding: 10px 24px !important;
    border-radius: var(--radius-md) !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    line-height: 1 !important;
    text-decoration: none !important;
    transition: all 0.2s ease !important;
    cursor: pointer !important;
  }

  .html-archive-page .chapter-nav .nav-prev,
  .html-archive-page .chapter-nav .nav-next {
    border: 1px solid var(--border-default) !important;
    background: var(--bg-white) !important;
    color: var(--primary) !important;
  }

  .html-archive-page .chapter-nav .nav-prev:hover,
  .html-archive-page .chapter-nav .nav-next:hover {
    border-color: var(--primary) !important;
    background: var(--bg-gray-50) !important;
    box-shadow: 0 2px 8px rgba(143, 118, 218, 0.12) !important;
  }

  .html-archive-page .chapter-nav .nav-catalog {
    border: 0 !important;
    background: var(--gradient-main) !important;
    color: #fff !important;
  }

  .html-archive-page .chapter-nav .nav-catalog:hover {
    opacity: 0.9;
    box-shadow: 0 2px 8px rgba(143, 118, 218, 0.25) !important;
  }

  .html-archive-page .chapter-nav .nav-placeholder {
    width: 120px !important;
    flex: 0 0 120px !important;
  }

  :host([data-archive-layout="legacy-course"]) .html-archive-page {
    padding: 20px !important;
    border: 0 !important;
    background-image: none !important;
    font-size: 15px;
  }

  :host([data-archive-layout="legacy-course"]) .html-archive-page > .container,
  :host([data-archive-layout="legacy-course"]) .html-archive-page > .double-border-container {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: var(--archive-surface) !important;
    box-shadow: none !important;
  }

  :host([data-archive-layout="legacy-course"]) .html-archive-page > .container,
  :host([data-archive-layout="legacy-course"]) .html-archive-page > .double-border-container {
    padding: 0 !important;
  }

  :host([data-archive-layout="legacy-course"]) .double-border-container::before {
    display: none !important;
  }

  :host([data-archive-layout="legacy-course"]) .double-border-container > .container {
    padding: 26px !important;
    border: 0 !important;
    background: var(--archive-surface-soft) !important;
  }

  :host([data-archive-layout="legacy-course"]) header {
    margin-bottom: 28px !important;
    padding: 32px 28px !important;
    border: 0 !important;
    border-radius: 18px !important;
    background: var(--gradient-header) !important;
    box-shadow: none !important;
  }

  :host([data-archive-layout="legacy-course"]) header::before {
    opacity: 0.42 !important;
  }

  :host([data-archive-layout="legacy-course"]) header h1 {
    margin-bottom: 10px !important;
    color: #fff !important;
    font-size: clamp(30px, 4.2vw, 48px) !important;
    line-height: 1.16 !important;
    text-shadow: none !important;
  }

  :host([data-archive-layout="legacy-course"]) header .subtitle,
  :host([data-archive-layout="legacy-course"]) header > p {
    color: rgba(255, 255, 255, 0.82) !important;
    font-size: clamp(14px, 1.8vw, 18px) !important;
    line-height: 1.65 !important;
  }

  :host([data-archive-layout="legacy-course"]) .course-stats {
    gap: 10px !important;
    margin-top: 22px !important;
  }

  :host([data-archive-layout="legacy-course"]) .course-stats .stat {
    min-width: 0 !important;
    padding: 9px 14px !important;
    border: 1px solid rgba(255, 255, 255, 0.18) !important;
    border-radius: 999px !important;
    background: rgba(255, 255, 255, 0.1) !important;
    color: #fff !important;
    box-shadow: none !important;
  }

  :host([data-archive-layout="legacy-course"]) .course-stats .stat-number,
  :host([data-archive-layout="legacy-course"]) .course-stats .stat-label {
    color: #fff !important;
  }

  :host([data-archive-layout="legacy-course"]) .course-stats .stat-number {
    font-size: 20px !important;
  }

  :host([data-archive-layout="legacy-course"]) .directory-container {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 16px !important;
    margin-bottom: 0 !important;
  }

  :host([data-archive-layout="legacy-course"]) .chapter-card {
    padding: 20px !important;
    border: 1px solid var(--border-light) !important;
    border-left: 3px solid var(--primary) !important;
    border-radius: 14px !important;
    background: var(--archive-card-bg) !important;
    color: var(--text-secondary) !important;
    box-shadow: var(--shadow-card) !important;
  }

  :host([data-archive-layout="legacy-course"]) .chapter-card:hover {
    border-color: var(--border-default) !important;
    border-left-color: var(--primary-dark) !important;
    box-shadow: var(--shadow-card-hover) !important;
    transform: translateY(-3px) !important;
  }

  :host([data-archive-layout="legacy-course"]) .chapter-card::before,
  :host([data-archive-layout="legacy-course"]) .chapter-card::after {
    display: none !important;
  }

  :host([data-archive-layout="legacy-course"]) .chapter-number {
    width: 44px !important;
    height: 44px !important;
    margin-right: 16px !important;
    margin-bottom: 12px !important;
    border-radius: 50% !important;
    background: var(--gradient-main) !important;
    color: #fff !important;
    font-size: 16px !important;
    line-height: 44px !important;
    box-shadow: none !important;
  }

  :host([data-archive-layout="legacy-course"]) .chapter-title,
  :host([data-archive-layout="legacy-course"]) .chapter-title a {
    min-height: 0 !important;
    color: var(--text-primary) !important;
  }

  :host([data-archive-layout="legacy-course"]) .chapter-content,
  :host([data-archive-layout="legacy-course"]) .chapter-desc {
    border-color: var(--border-light) !important;
    color: var(--text-secondary) !important;
  }

  :host([data-archive-layout="legacy-course"]) .chapter-link,
  :host([data-archive-layout="legacy-course"]) .file-link {
    border: 1px solid var(--border-light) !important;
    background: transparent !important;
    color: var(--primary-dark) !important;
    box-shadow: none !important;
  }

  :host([data-archive-layout="legacy-course"]) .chapter-link:hover,
  :host([data-archive-layout="legacy-course"]) .file-link:hover {
    background: var(--bg-gray-50) !important;
    box-shadow: none !important;
    transform: translateY(-1px) !important;
  }

  :host([data-archive-layout="legacy-course"]) .html-archive-page main:not(.directory-container) {
    padding: 28px !important;
  }

  :host([data-archive-layout="legacy-course"]) .html-archive-page section {
    border-color: var(--border-light) !important;
  }

  :host([data-archive-layout="legacy-course"]) .html-archive-page h2 {
    border-left: 4px solid var(--primary) !important;
    color: var(--primary-dark) !important;
    font-size: clamp(23px, 3vw, 30px) !important;
  }

  :host([data-archive-layout="legacy-course"]) .html-archive-page h3,
  :host([data-archive-layout="legacy-course"]) .html-archive-page .card h3,
  :host([data-archive-layout="legacy-course"]) .html-archive-page .tool-item h4 {
    color: var(--primary-dark) !important;
  }

  :host([data-archive-layout="legacy-course"]) .html-archive-page p {
    text-align: left !important;
  }

  :host([data-archive-layout="legacy-course"]) .card,
  :host([data-archive-layout="legacy-course"]) .tool-item,
  :host([data-archive-layout="legacy-course"]) .svg-container {
    border: 1px solid var(--border-light) !important;
    background: var(--archive-card-bg) !important;
    color: var(--text-secondary) !important;
    box-shadow: var(--shadow-card) !important;
  }

  :host([data-archive-layout="legacy-course"]) .card:hover {
    transform: translateY(-2px) !important;
  }

  :host([data-archive-layout="legacy-course"]) .highlight {
    border-color: var(--primary) !important;
    background: var(--bg-green-50) !important;
    color: var(--text-primary) !important;
  }

  :host([data-archive-layout="legacy-course"]) th {
    border-color: var(--border-default) !important;
    background: var(--gradient-header-dark) !important;
    color: #fff !important;
  }

  :host([data-archive-layout="legacy-course"]) td {
    border-color: var(--border-light) !important;
  }

  :host([data-archive-layout="legacy-course"]) tbody tr:nth-child(even),
  :host([data-archive-layout="legacy-course"]) tbody tr:hover {
    background: var(--bg-gray-50) !important;
  }

  :host([data-blog-theme="dark"]) .chapter-card,
  :host([data-blog-theme="dark"]) .card,
  :host([data-blog-theme="dark"]) .content-card,
  :host([data-blog-theme="dark"]) .step-card,
  :host([data-blog-theme="dark"]) .tool-card,
  :host([data-blog-theme="dark"]) .method-card,
  :host([data-blog-theme="dark"]) .strategy-card,
  :host([data-blog-theme="dark"]) .checklist-card,
  :host([data-blog-theme="dark"]) .comparison-card,
  :host([data-blog-theme="dark"]) .svg-container,
  :host([data-blog-theme="dark"]) .architecture,
  :host([data-blog-theme="dark"]) .arch-diagram,
  :host([data-blog-theme="dark"]) .section,
  :host([data-blog-theme="dark"]) .course-info,
  :host([data-blog-theme="dark"]) .stats-bar,
  :host([data-blog-theme="dark"]) table,
  :host([data-blog-theme="dark"]) tbody tr {
    border-color: var(--border-light) !important;
    background: var(--bg-gray-50) !important;
    color: var(--text-secondary) !important;
    box-shadow: var(--shadow-card) !important;
  }

  :host([data-blog-theme="dark"]) .highlight,
  :host([data-blog-theme="dark"]) .highlight-box,
  :host([data-blog-theme="dark"]) .key-point,
  :host([data-blog-theme="dark"]) .tip,
  :host([data-blog-theme="dark"]) .note {
    border-color: var(--border-default) !important;
    background: var(--bg-green-50) !important;
    color: var(--text-secondary) !important;
  }

  :host([data-blog-theme="dark"]) h2,
  :host([data-blog-theme="dark"]) h3,
  :host([data-blog-theme="dark"]) h4,
  :host([data-blog-theme="dark"]) strong,
  :host([data-blog-theme="dark"]) .chapter-title,
  :host([data-blog-theme="dark"]) .card-title {
    color: var(--text-primary) !important;
  }

  :host([data-blog-theme="dark"]) p,
  :host([data-blog-theme="dark"]) li,
  :host([data-blog-theme="dark"]) td,
  :host([data-blog-theme="dark"]) .chapter-desc {
    color: var(--text-secondary);
  }

  :host([data-blog-theme="dark"]) th {
    border-color: var(--border-default) !important;
    background: var(--gradient-header-dark) !important;
    color: #fff !important;
  }

  :host([data-blog-theme="dark"]) td {
    border-color: var(--border-light) !important;
  }

  :host([data-blog-theme="dark"]) pre,
  :host([data-blog-theme="dark"]) .code-block {
    border-color: #2c2238 !important;
    background: #0b0811 !important;
    color: #d8cde4 !important;
  }

  :host([data-blog-theme="dark"]) svg text {
    fill: #d6cadd !important;
  }

  :host([data-blog-theme="dark"]) svg [stroke="#333"],
  :host([data-blog-theme="dark"]) svg [stroke="#666"] {
    stroke: #a99bb6 !important;
  }

  :host([data-blog-theme="dark"]) .tip-box.warning,
  :host([data-blog-theme="dark"]) .scenario-card.orange,
  :host([data-blog-theme="dark"]) .self-check {
    background: #251d14 !important;
  }

  :host([data-blog-theme="dark"]) .tip-box.important {
    background: #28171f !important;
  }

  :host([data-blog-theme="dark"]) .scenario-card.blue {
    background: #171b2a !important;
    color: #b8c8f5 !important;
  }

  :host([data-blog-theme="dark"]) .scenario-card.green {
    background: #18241f !important;
  }

  :host([data-blog-theme="dark"]) .scenario-card.purple {
    background: #21172d !important;
  }

  @media (max-width: 760px) {
    :host([data-archive-layout="legacy-course"]) .html-archive-page {
      padding: 10px !important;
    }

    :host([data-archive-layout="legacy-course"]) .directory-container {
      grid-template-columns: minmax(0, 1fr) !important;
    }

    :host([data-archive-layout="legacy-course"]) .double-border-container > .container,
    :host([data-archive-layout="legacy-course"]) .html-archive-page main:not(.directory-container) {
      padding: 18px !important;
    }

    :host([data-archive-layout="legacy-course"]) header {
      padding: 26px 18px !important;
    }

    .html-archive-page .container,
    .html-archive-page .chapter-container,
    .html-archive-page .catalog-container {
      padding-right: 18px !important;
      padding-left: 18px !important;
    }
  }

  @media (max-width: 560px) {
    .html-archive-page .catalog-grid,
    .html-archive-page .directory-container,
    .html-archive-page .grid,
    .html-archive-page .content-grid,
    .html-archive-page .two-column,
    .html-archive-page .scenario-grid,
    .html-archive-page .compare-block,
    .html-archive-page .checklist-grid,
    .html-archive-page .section-grid {
      grid-template-columns: minmax(0, 1fr) !important;
    }

    .html-archive-page .stats-bar,
    .html-archive-page .course-stats {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    }

    .html-archive-page .course-info {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }

    .html-archive-page .chapter-card,
    .html-archive-page .course-info-item,
    .html-archive-page .stats-item,
    .html-archive-page .stat {
      min-width: 0 !important;
      overflow-wrap: anywhere;
    }

    .html-archive-page table {
      display: block;
      max-width: 100%;
      overflow-x: auto;
    }

    .html-archive-page .chapter-nav {
      flex-wrap: wrap !important;
      gap: 8px !important;
      padding: 0 !important;
    }

    .html-archive-page .chapter-nav .nav-placeholder {
      display: none !important;
    }

    .html-archive-page .chapter-nav a {
      min-width: 104px !important;
      min-height: 40px !important;
      padding: 10px 16px !important;
      font-size: 13px !important;
    }
  }
`;

function adaptOriginalCss(css: string) {
  return css
    .replace(/@import\s+url\([^;]+;/gi, "")
    .replace(/:root/g, ":host")
    .replace(/\bbody\b/g, ".html-archive-page");
}

function routeFromOriginalHref(baseRoute: string, href: string) {
  const normalizedHref = href.split(/[?#]/, 1)[0].replace(/^\.\//, "");
  if (normalizedHref === "index.html") return baseRoute;
  const chapterMatch = normalizedHref.match(/^(\d{2})\.html$/);
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

function getOriginalPageHref(page: HtmlArchive["pages"][number]) {
  return page.id === "index" ? "index.html" : `${page.id}.html`;
}

function buildChapterNavHtml(page: HtmlArchive["pages"][number], previousPage: HtmlArchive["pages"][number] | null, nextPage: HtmlArchive["pages"][number] | null) {
  if (page.id === "index") return "";

  const previousLink =
    previousPage && previousPage.id !== "index"
      ? `<a href="${getOriginalPageHref(previousPage)}" class="nav-prev">← 上一章</a>`
      : `<span class="nav-placeholder"></span>`;
  const nextLink = nextPage
    ? `<a href="${getOriginalPageHref(nextPage)}" class="nav-next">下一章 →</a>`
    : `<span class="nav-placeholder"></span>`;

  return `
    <div class="chapter-nav">
      ${previousLink}
      <a href="index.html" class="nav-catalog">返回目录</a>
      ${nextLink}
    </div>
  `;
}

export default function HtmlArchiveReaderPage({ archive, baseRoute, testId }: HtmlArchiveReaderPageProps) {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme);
  const hostRef = useRef<HTMLDivElement>(null);
  const page = useMemo(
    () => archive.pages.find((item) => item.id === (pageId ?? "index")) ?? archive.pages[0],
    [archive, pageId],
  );
  const chapters = useMemo(() => archive.pages.filter((item) => item.id !== "index"), [archive.pages]);
  const currentChapterIndex = chapters.findIndex((item) => item.id === page.id);
  const previousPage =
    page.id === "index"
      ? null
      : currentChapterIndex > 0
        ? chapters[currentChapterIndex - 1]
        : archive.pages[0];
  const nextPage =
    page.id === "index"
      ? chapters[0]
      : currentChapterIndex >= 0
        ? chapters[currentChapterIndex + 1] ?? null
        : null;

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

    const archivePage = shadowRoot.querySelector(".html-archive-page");
    if (archivePage && page.id !== "index" && !archivePage.querySelector(".chapter-nav")) {
      archivePage.insertAdjacentHTML("beforeend", buildChapterNavHtml(page, previousPage, nextPage));
    }

    shadowRoot.querySelectorAll<HTMLElement>(".chapter-card, .catalog-card").forEach((card) => {
      const anchor = card.querySelector<HTMLAnchorElement>("a[href]");
      if (!anchor || !routeFromOriginalHref(baseRoute, anchor.getAttribute("href") ?? "")) return;
      card.setAttribute("role", "link");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", anchor.textContent?.trim() || "进入章节");
    });

    const handleArchiveClick = (event: Event) => {
      const anchor = findArchiveAnchorFromEvent(event);
      const card = anchor ? null : findArchiveCardFromEvent(event);
      const href = anchor?.getAttribute("href") ?? card?.querySelector<HTMLAnchorElement>("a[href]")?.getAttribute("href") ?? "";
      const targetRoute = routeFromOriginalHref(baseRoute, href);
      if (!targetRoute) return;
      event.preventDefault();
      navigate(targetRoute);
    };

    const handleArchiveKeyDown = (event: Event) => {
      if (!(event instanceof KeyboardEvent) || (event.key !== "Enter" && event.key !== " ")) return;
      const card = findArchiveCardFromEvent(event);
      const href = card?.querySelector<HTMLAnchorElement>("a[href]")?.getAttribute("href") ?? "";
      const targetRoute = routeFromOriginalHref(baseRoute, href);
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
  }, [baseRoute, navigate, nextPage, page, previousPage]);

  return (
    <div className="blog-page game-ta-original-page">
      <main className="game-ta-original-page__main">
        <div className="content-shell game-ta-original-page__toolbar">
          <Link to="/category/knowledge-base"><ArrowLeft size={14} /> 返回知识库</Link>
          <span><BookOpenText size={15} /> 原版结构 · {archive.pages.length - 1} 章</span>
          <strong>{page.id === "index" ? "总目录" : `第 ${page.id} 章`}</strong>
        </div>

        <div
          className="content-shell game-ta-original-page__archive"
          data-archive-layout={
            archive.key === "ue5-gpu-renderdoc" || archive.key === "ue5-mobile-optimization"
              ? "legacy-course"
              : "structured"
          }
          data-blog-theme={theme}
          data-testid={testId}
          ref={hostRef}
        />

      </main>

      <FooterSection />
    </div>
  );
}
