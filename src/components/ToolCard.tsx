import { ArrowUpRight, BookOpenText, Layers3 } from "lucide-react";
import { Link } from "react-router-dom";
import { interviewCategories, interviewQuestions } from "@/data/taInterviewWiki";

export default function ToolCard() {
  return (
    <Link className="tool-card" to="/knowledge-base/ta-interview-wiki">
      <div className="tool-card__visual" aria-hidden="true">
        <span className="tool-card__visual-label">TA / INTERVIEW</span>
        <div className="tool-card__visual-grid">
          <span>LOW</span>
          <span>MID</span>
          <span>HIGH</span>
        </div>
        <BookOpenText className="tool-card__visual-icon" strokeWidth={1.25} />
      </div>

      <div className="tool-card__body">
        <div className="tool-card__meta">
          <span><Layers3 size={14} /> 3 个难度</span>
          <span>{interviewQuestions.length} 道题 · {interviewCategories.length} 模块</span>
        </div>
        <h2>技术美术面试 Wiki</h2>
        <p>覆盖 UE 渲染、光照阴影、Shader、性能、资源管线与项目能力。先独立作答，再核对正确参考答案。</p>
        <span className="tool-card__action">
          打开知识库
          <ArrowUpRight size={17} />
        </span>
      </div>
    </Link>
  );
}
