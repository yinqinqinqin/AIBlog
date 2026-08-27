import {
  ArrowUpRight,
  BookMarked,
  FileQuestion,
  Gauge,
  LibraryBig,
  ListChecks,
  Smartphone,
  Workflow,
} from "lucide-react";
import { Link } from "react-router-dom";

export type InterviewResourceToolKind = "mihoyo" | "ta100" | "gpu" | "mobile" | "pipeline";

type InterviewResourceToolCardProps = {
  kind: InterviewResourceToolKind;
};

const cardContent = {
  mihoyo: {
    to: "/knowledge-base/mihoyo-ta-interview",
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
    to: "/knowledge-base/game-ta-interview-100",
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
  gpu: {
    to: "/knowledge-base/ue5-gpu-renderdoc",
    className: "tool-card--gpu",
    label: "UE5 / GPU PROFILING",
    visualItems: ["CAPTURE", "TRACE", "OPTIMIZE"],
    icon: Gauge,
    metaIcon: BookMarked,
    meta: "30 个章节",
    count: "GPU Profiler · RenderDoc · 实战",
    title: "UE5 GPU 性能分析与抓帧",
    description: "保持原课程目录与章节排版，系统覆盖 UE5 GPU 指标、瓶颈定位、RenderDoc 抓帧和数据驱动优化。",
    action: "进入性能实验室",
  },
  mobile: {
    to: "/knowledge-base/ue5-mobile-optimization",
    className: "tool-card--mobile",
    label: "UE5 / MOBILE PERFORMANCE",
    visualItems: ["DEVICE", "PROFILE", "SHIP"],
    icon: Smartphone,
    metaIcon: BookMarked,
    meta: "30 个章节",
    count: "150+ 优化技巧 · 全流程",
    title: "UE5 移动端性能优化指南",
    description: "从项目设置、资源与渲染优化延伸到线程、内存、发热和平台适配，完整保留原资料的图表与章节结构。",
    action: "打开优化指南",
  },
  pipeline: {
    to: "/knowledge-base/ue5-asset-pipeline",
    className: "tool-card--pipeline",
    label: "UE5 / ASSET PIPELINE",
    visualItems: ["IMPORT", "VALIDATE", "AUTOMATE"],
    icon: Workflow,
    metaIcon: BookMarked,
    meta: "24 个章节",
    count: "资源规范 · 工具链 · 自动化",
    title: "UE5 资源管线与美术自动化",
    description: "围绕资源命名、导入验证、Editor 工具、Python 脚本和团队管线搭建，按原版课程结构迁移到博客阅读器。",
    action: "进入管线手册",
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
