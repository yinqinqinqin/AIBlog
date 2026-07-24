import { ArrowUpRight, FilePlus2, PencilLine } from "lucide-react";
import { Link } from "react-router-dom";

export default function CustomInterviewToolCard() {
  return (
    <Link className="tool-card tool-card--custom" to="/tools/custom-interview-wiki">
      <div className="tool-card__visual" aria-hidden="true">
        <span className="tool-card__visual-label">PERSONAL / WIKI</span>
        <div className="tool-card__visual-grid">
          <span>CREATE</span>
          <span>EDIT</span>
          <span>REVIEW</span>
        </div>
        <FilePlus2 className="tool-card__visual-icon" strokeWidth={1.25} />
      </div>

      <div className="tool-card__body">
        <div className="tool-card__meta">
          <span><PencilLine size={14} /> 完全自定义</span>
          <span>本地自动保存</span>
        </div>
        <h2>我的面试题库</h2>
        <p>自己创建题目、答案、模块和标签。支持搜索、编辑、折叠复习以及 JSON 导入导出。</p>
        <span className="tool-card__action">
          创建题库
          <ArrowUpRight size={17} />
        </span>
      </div>
    </Link>
  );
}
