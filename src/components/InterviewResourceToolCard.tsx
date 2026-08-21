import {
  ArrowUpRight,
  BookMarked,
  FileQuestion,
  LibraryBig,
  ListChecks,
} from "lucide-react";
import { Link } from "react-router-dom";

type InterviewResourceToolCardProps = {
  kind: "mihoyo" | "ta100";
};

const cardContent = {
  mihoyo: {
    to: "/tools/mihoyo-ta-interview",
    className: "tool-card--mihoyo",
    label: "MIHOYO / INTERVIEW",
    visualItems: ["CASE", "QUIZ", "WRITE"],
    icon: FileQuestion,
    metaIcon: ListChecks,
    meta: "7 种题型",
    count: "410 道题 · 答案配对",
    title: "米哈游技术美术真题集",
    description: "把 Word 中分开的题目与答案逐题配对，覆盖案例、判断、简答、选择、写作与填空。",
    action: "开始刷题",
  },
  ta100: {
    to: "/tools/game-ta-interview-100",
    className: "tool-card--ta100",
    label: "GAME TA / 20 CHAPTERS",
    visualItems: ["LEARN", "ANSWER", "REVIEW"],
    icon: LibraryBig,
    metaIcon: BookMarked,
    meta: "20 个章节",
    count: "80 道主面试题 · 章节自测",
    title: "游戏 TA 面试 100 问",
    description: "完整保留原资料的目录、章节讲解、知识块、表格、问答、练习与自测结构，并迁移到当前博客技术栈。",
    action: "打开知识库",
  },
} as const;

export default function InterviewResourceToolCard({ kind }: InterviewResourceToolCardProps) {
  const content = cardContent[kind];
  const VisualIcon = content.icon;
  const MetaIcon = content.metaIcon;

  return (
    <Link className={`tool-card ${content.className}`} to={content.to}>
      <div className="tool-card__visual" aria-hidden="true">
        <span className="tool-card__visual-label">{content.label}</span>
        <div className="tool-card__visual-grid">
          {content.visualItems.map((item) => <span key={item}>{item}</span>)}
        </div>
        <VisualIcon className="tool-card__visual-icon" strokeWidth={1.15} />
      </div>

      <div className="tool-card__body">
        <div className="tool-card__meta">
          <span><MetaIcon size={14} /> {content.meta}</span>
          <span>{content.count}</span>
        </div>
        <h2>{content.title}</h2>
        <p>{content.description}</p>
        <span className="tool-card__action">
          {content.action}
          <ArrowUpRight size={17} />
        </span>
      </div>
    </Link>
  );
}
