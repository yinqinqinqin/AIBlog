export type InterviewLevelKey = "low" | "mid" | "high";

import { additionalQuestionSeeds } from "./taInterviewAdditionalQuestions";
import { expansionQuestionSeeds } from "./taInterviewExpansionQuestions";

export type InterviewSourceCategoryKey =
  | "rendering"
  | "shader"
  | "engine"
  | "performance"
  | "pipeline"
  | "production";

export type InterviewCategoryKey =
  | "lighting"
  | "shadows"
  | "ue_pipeline"
  | "ue_material"
  | "graphics"
  | "performance"
  | "asset_pipeline"
  | "tools_debug"
  | "communication";

export type InterviewCategory = {
  key: InterviewCategoryKey;
  label: string;
  shortLabel: string;
  description: string;
};

export type InterviewLevel = {
  key: InterviewLevelKey;
  index: string;
  label: string;
  subtitle: string;
  description: string;
};

export type InterviewReference = {
  correctAnswer: string;
  paragraphs: string[];
  application: string;
  pitfalls: string[];
};

export type InterviewQuestion = {
  id: string;
  level: InterviewLevelKey;
  category: InterviewCategoryKey;
  question: string;
  intent: string;
  method: {
    framework: string;
    steps: Array<{
      title: string;
      detail: string;
    }>;
    reference: InterviewReference;
    checklist: string[];
  };
};

type InterviewQuestionSource = Omit<InterviewQuestion, "category" | "method"> & {
  category: InterviewSourceCategoryKey;
  method: Omit<InterviewQuestion["method"], "reference">;
};

export const interviewCategories: InterviewCategory[] = [
  {
    key: "lighting",
    label: "光照系统",
    shortLabel: "光照系统",
    description: "直接光、间接光、PBR、GI、探针、曝光与复杂光照方案。",
  },
  {
    key: "shadows",
    label: "阴影系统",
    shortLabel: "阴影系统",
    description: "Shadow Map、级联阴影、软阴影、烘焙阴影与稳定性。",
  },
  {
    key: "ue_pipeline",
    label: "UE 渲染管线",
    shortLabel: "UE 管线",
    description: "UE 的 Pass、Deferred/Forward、RDG、Nanite、Lumen 与帧结构。",
  },
  {
    key: "ue_material",
    label: "Unreal Engine 渲染与材质",
    shortLabel: "UE 材质",
    description: "Material Editor、材质模型、特效实现、变体和工程化维护。",
  },
  {
    key: "graphics",
    label: "Shader 数学与图形学基础",
    shortLabel: "图形基础",
    description: "向量矩阵、坐标空间、采样、光栅化与 Shader 数学。",
  },
  {
    key: "performance",
    label: "性能分析与优化",
    shortLabel: "性能优化",
    description: "CPU、GPU、内存、带宽、卡顿定位与持续性能治理。",
  },
  {
    key: "asset_pipeline",
    label: "美术资源管线",
    shortLabel: "资源管线",
    description: "DCC、导入规范、纹理模型、依赖、构建与资产版本。",
  },
  {
    key: "tools_debug",
    label: "工具开发与项目排错",
    shortLabel: "工具排错",
    description: "工具架构、自动验证、调试视图、问题复现与故障定位。",
  },
  {
    key: "communication",
    label: "项目设计与沟通能力",
    shortLabel: "设计沟通",
    description: "需求拆解、方案设计、质量取舍、协作推进与技术决策。",
  },
];

export const interviewLevels: InterviewLevel[] = [
  {
    key: "low",
    index: "01",
    label: "低阶 · 基础认知",
    subtitle: "Know the terms",
    description: "能准确解释核心概念，说明它为什么存在，并给出一个真实使用场景。",
  },
  {
    key: "mid",
    index: "02",
    label: "中阶 · 项目应用",
    subtitle: "Make the trade-off",
    description: "能从现象定位原因，在质量、性能和制作成本之间做有依据的取舍。",
  },
  {
    key: "high",
    index: "03",
    label: "高阶 · 系统设计",
    subtitle: "Build the system",
    description: "能建立跨平台、跨团队的方案，用指标、边界和反馈机制控制复杂度。",
  },
];

const coreInterviewQuestions: InterviewQuestionSource[] = [
  {
    id: "low-pbr",
    level: "low",
    category: "rendering",
    question: "如何解释 PBR 中的金属度、粗糙度与能量守恒？",
    intent: "考察你是否理解参数背后的光照行为，而不只是会连接材质节点。",
    method: {
      framework: "先定义参数，再说明它们如何改变入射光的分配，最后用金属与非金属各举一个例子。",
      steps: [
        { title: "定义", detail: "金属度区分导体与非导体；粗糙度控制微表面法线分布，从而改变高光的宽度与强度。" },
        { title: "原理", detail: "非金属保留漫反射并有较弱的无色镜面反射；金属几乎没有漫反射，反射颜色来自 Base Color。" },
        { title: "约束", detail: "能量守恒意味着反射与漫反射不会凭空超过入射能量，材质模型会在两者之间分配能量。" },
      ],
      checklist: ["避免把粗糙度说成单纯的模糊", "说明贴图通常在线性色彩空间参与计算", "举塑料与铜的对比例子"],
    },
  },
  {
    id: "low-normal-map",
    level: "low",
    category: "shader",
    question: "法线贴图为什么通常偏蓝？切线空间法线是怎样工作的？",
    intent: "考察空间变换、贴图数据含义，以及常见导入错误的定位能力。",
    method: {
      framework: "从向量编码开始，说明 TBN 变换，再补充 DirectX / OpenGL 绿色通道差异。",
      steps: [
        { title: "编码", detail: "切线空间默认朝外方向是 (0, 0, 1)，映射到 0—1 纹理范围后蓝色通道接近 1，因此整体偏蓝。" },
        { title: "变换", detail: "Shader 用顶点的切线、双切线、法线构成 TBN 基，把贴图中的局部法线转换到世界或视图空间。" },
        { title: "排错", detail: "凹凸方向反转时先检查 Y 通道约定，再检查切线生成方式、模型法线和非均匀缩放。" },
      ],
      checklist: ["强调法线贴图是数据而非颜色", "提到关闭 sRGB", "不要把高度贴图与法线贴图混为一谈"],
    },
  },
  {
    id: "low-render-order",
    level: "low",
    category: "engine",
    question: "不透明、透明物体为什么通常采用不同的渲染顺序？",
    intent: "考察深度测试、深度写入和透明混合的基本关系。",
    method: {
      framework: "从深度缓冲的作用回答，再解释不透明的前到后与透明的后到前。",
      steps: [
        { title: "不透明", detail: "通常开启深度测试与写入，前到后渲染有利于 Early-Z 尽早丢弃被遮挡片元。" },
        { title: "透明", detail: "常规 Alpha Blend 依赖已存在的背景颜色，通常关闭深度写入并按相机距离后到前排序。" },
        { title: "边界", detail: "相交透明物体无法仅靠物体级排序完全正确，需要拆分网格、Alpha Test、加权 OIT 等替代方案。" },
      ],
      checklist: ["区分深度测试和深度写入", "说明排序不是万能解", "可补充透明带来的 Overdraw"],
    },
  },
  {
    id: "low-draw-call",
    level: "low",
    category: "performance",
    question: "什么是 Draw Call？减少 Draw Call 为什么不一定总能提升帧率？",
    intent: "考察你是否能区分提交开销与 GPU 实际工作量。",
    method: {
      framework: "先给出提交定义，再拆成 CPU 与 GPU 两侧，最后强调必须先确认瓶颈。",
      steps: [
        { title: "定义", detail: "Draw Call 是 CPU 向图形 API 提交一组状态与绘制命令，不等于多边形数量。" },
        { title: "收益", detail: "合批、实例化可降低 CPU 提交与状态切换成本，适合大量共享网格或材质的对象。" },
        { title: "代价", detail: "过度合批可能增加不可见几何、内存占用和更新成本；若瓶颈在像素着色或带宽，减少 Draw Call 收益有限。" },
      ],
      checklist: ["先看 CPU/GPU Frame Time", "区分 Batch、Instance 与 SetPass", "用 Profiler 数据验证"],
    },
  },
  {
    id: "low-asset-import",
    level: "low",
    category: "pipeline",
    question: "模型从 DCC 导入引擎后比例或朝向错误，你会按什么顺序检查？",
    intent: "考察是否具备稳定、可复现的基础资产排错习惯。",
    method: {
      framework: "按单位、坐标系、变换、导出器、导入设置的链路逐层排查，不直接在引擎里手改结果。",
      steps: [
        { title: "源数据", detail: "确认 DCC 的系统单位、Up Axis、Forward Axis，以及模型尺寸是否符合项目基准物。" },
        { title: "变换", detail: "检查 Scale / Rotation 是否应用或冻结，骨骼与蒙皮资产要避免破坏绑定关系。" },
        { title: "转换", detail: "对照 FBX / glTF 导出预设与引擎导入倍率，用最小测试资产定位是哪一段发生转换。" },
      ],
      checklist: ["保留可重复的导出预设", "不要用场景节点缩放掩盖源数据错误", "记录项目统一约定"],
    },
  },
  {
    id: "low-debug-visual",
    level: "low",
    category: "production",
    question: "美术反馈“效果不对”，你会怎样把模糊描述变成可排查问题？",
    intent: "考察沟通、观察和拆解问题的基本方法。",
    method: {
      framework: "先对齐参照与预期，再把画面拆成光、材质、几何、相机和后处理，最后形成可验证假设。",
      steps: [
        { title: "对齐", detail: "询问具体差异发生在哪里，用截图标注目标、当前结果、平台和复现步骤。" },
        { title: "隔离", detail: "逐项关闭后处理、替换材质、固定灯光与相机，判断问题属于资源、渲染还是配置。" },
        { title: "验证", detail: "每次只改变一个变量，对比修复前后结果，并把结论转成规范或检查项。" },
      ],
      checklist: ["不要只说“凭经验调”", "给出可复现条件", "明确视觉目标与性能边界"],
    },
  },
  {
    id: "mid-shader-effect",
    level: "mid",
    category: "shader",
    question: "设计一个可投产的溶解 Shader，你会如何拆解功能与风险？",
    intent: "考察从视觉需求到 Shader 结构、参数和工程边界的完整实现思路。",
    method: {
      framework: "用“遮罩生成 → 阈值裁剪 → 边缘带 → 光照整合 → 变体控制”拆功能。",
      steps: [
        { title: "核心", detail: "噪声与阈值比较产生裁剪区域，利用阈值附近的窄带生成边缘色、发光或扭曲。" },
        { title: "投产", detail: "统一局部/世界空间坐标，暴露最少且语义清楚的参数，并兼容阴影、深度与运动矢量 Pass。" },
        { title: "风险", detail: "关注 Alpha Test 的锯齿、噪声采样成本、Shader Variant 数量，以及透明方案的排序与 Overdraw。" },
      ],
      checklist: ["说明材质面板如何约束参数", "考虑阴影与 TAA", "给出移动端降级路径"],
    },
  },
  {
    id: "mid-color-pipeline",
    level: "mid",
    category: "rendering",
    question: "贴图在 DCC 与引擎里颜色不一致，如何系统排查色彩管理链路？",
    intent: "考察 sRGB、线性空间、显示变换与制作工具之间的连接。",
    method: {
      framework: "沿“文件编码 → 导入解释 → 线性计算 → Tone Mapping → 显示输出”逐段确认。",
      steps: [
        { title: "输入", detail: "颜色贴图通常按 sRGB 解码，法线、粗糙度、Mask 等数据贴图必须保持线性。" },
        { title: "计算", detail: "光照与混合应在线性空间进行，同时确认 HDR 数值、曝光和预乘 Alpha 是否一致。" },
        { title: "输出", detail: "对齐 ACES 或项目 Tone Mapper、LUT、显示器色域与 DCC 的 OCIO View Transform。" },
      ],
      checklist: ["用标准色卡而非肉眼猜测", "关闭后处理做基线对比", "保存一张参考帧和配置快照"],
    },
  },
  {
    id: "mid-render-feature",
    level: "mid",
    category: "engine",
    question: "如果要给角色增加屏幕后描边，你会选择哪种实现，如何接入管线？",
    intent: "考察多种技术路线、Render Pass 位置与效果边界的判断。",
    method: {
      framework: "先明确对象范围与质量目标，再比较几何外扩和屏幕空间两条路线，最后说明 Pass 依赖。",
      steps: [
        { title: "选型", detail: "几何外扩轮廓稳定且可控，但对硬边、缩放和额外绘制敏感；屏幕空间可统一处理但依赖深度/法线。" },
        { title: "接入", detail: "为目标对象设置 Layer/Stencil/ID，在不透明之后、透明或后处理之前插入 Pass，采样深度法线做边缘检测。" },
        { title: "质量", detail: "处理分辨率相关线宽、遮挡关系、TAA 抖动与动态分辨率，并准备低端平台简化版本。" },
      ],
      checklist: ["说明为何选择当前方案", "指出需要的 Buffer", "考虑 XR 或移动端限制"],
    },
  },
  {
    id: "mid-profile-frame",
    level: "mid",
    category: "performance",
    question: "一个场景从 60 FPS 降到 35 FPS，你如何判断是 CPU 还是 GPU 瓶颈？",
    intent: "考察性能分析顺序，而不是零散的优化技巧。",
    method: {
      framework: "固定复现场景，读取 Frame Time，二分定位模块，修改变量后用同一指标复测。",
      steps: [
        { title: "建立基线", detail: "在目标设备关闭垂直同步与帧率上限，记录 CPU Main/Render Thread 与 GPU Frame Time。" },
        { title: "定位", detail: "CPU 侧看脚本、动画、物理和提交；GPU 侧用 RenderDoc/Profiler 看 Pass、像素成本、带宽与同步。" },
        { title: "验证", detail: "降低分辨率测试像素瓶颈，隐藏对象测试几何/提交，关闭特效测试 Pass；一次只改变一个变量。" },
      ],
      checklist: ["用毫秒而不是只报 FPS", "关注峰值与 P95", "在真机和 Release 配置复测"],
    },
  },
  {
    id: "mid-validation-tool",
    level: "mid",
    category: "pipeline",
    question: "如何设计一个批量资产检查工具，使它真正能进入制作流程？",
    intent: "考察工具不仅能运行，还能被采用、维护和扩展。",
    method: {
      framework: "把工具拆成规则、扫描、报告、修复与接入五层，并明确哪些问题只能提示、不能自动改。",
      steps: [
        { title: "规则", detail: "将命名、尺寸、材质槽、贴图设置等规则数据化，支持项目级覆盖和版本记录。" },
        { title: "体验", detail: "报告要能定位资产与字段，区分 Error/Warning，并提供安全、可撤销的批量修复。" },
        { title: "接入", detail: "同时支持 DCC/编辑器手动运行与 CI 门禁，输出机器可读结果并统计高频问题。" },
      ],
      checklist: ["避免把规则硬编码在 UI", "修复前做备份或 Undo", "用真实项目样本写回归测试"],
    },
  },
  {
    id: "mid-art-tech-tradeoff",
    level: "mid",
    category: "production",
    question: "主美要提升画面质量，但当前版本已接近性能上限，你如何推进？",
    intent: "考察能否用共同目标组织讨论，而不是在美术与性能之间二选一。",
    method: {
      framework: "先量化目标和预算，再找感知收益最高的变量，做 A/B 样片后共同决策。",
      steps: [
        { title: "量化", detail: "明确目标平台、目标帧时、镜头优先级和需要提升的视觉指标，而不是笼统讨论“更好看”。" },
        { title: "分层", detail: "把成本分为常驻、峰值与可伸缩项，优先保护轮廓、材质层次、关键灯光等高感知收益。" },
        { title: "决策", detail: "提供高/中/低三档样片及对应成本，通过 Profile 数据和盲测反馈确定版本。" },
      ],
      checklist: ["不把性能当否决理由", "给出可视化对比", "记录最终预算与降级规则"],
    },
  },
  {
    id: "high-render-architecture",
    level: "high",
    category: "engine",
    question: "为 PC、主机和移动端设计同一项目的分级渲染方案，你如何搭建框架？",
    intent: "考察跨平台架构、可伸缩特性与长期维护成本。",
    method: {
      framework: "从共同视觉基线出发，建立 Feature Tier、资源 Tier 和设备评估三层，而不是复制多套内容。",
      steps: [
        { title: "预算", detail: "为每类设备定义分辨率、帧时、显存、带宽和关键 Pass 预算，并以典型战斗/场景作为压力样本。" },
        { title: "分级", detail: "将阴影、后处理、透明、粒子、贴图与 LOD 做成正交的质量档位，避免大量平台宏相互组合。" },
        { title: "治理", detail: "用设备画像自动选档，运行时只允许少量安全伸缩项；CI 持续采集画质截图、帧时和内存回归。" },
      ],
      checklist: ["说明共享与分叉的边界", "准备内容侧预算可视化", "把降级当设计而非事后删减"],
    },
  },
  {
    id: "high-shader-variants",
    level: "high",
    category: "shader",
    question: "项目出现 Shader Variant 爆炸与构建时间失控，你会怎样治理？",
    intent: "考察宏组合、材质需求和构建系统之间的系统性治理。",
    method: {
      framework: "先建立 Variant 数据画像，再减少组合维度，最后用白名单和回归机制守住上限。",
      steps: [
        { title: "测量", detail: "统计 Shader、Keyword、材质引用、编译耗时与包体占用，找出组合增长最快的家族。" },
        { title: "收敛", detail: "把低频功能拆成独立 Shader/Pass，把连续差异改为运行时参数，合并互斥 Keyword 并删除无引用组合。" },
        { title: "守门", detail: "从场景与材质生成 Variant Collection/白名单，在 CI 设数量、耗时和包体阈值，变更时输出差异。" },
      ],
      checklist: ["讨论静态分支与动态分支的权衡", "避免无依据地全部预热", "保留线上缺失 Variant 的监控"],
    },
  },
  {
    id: "high-temporal-quality",
    level: "high",
    category: "rendering",
    question: "TAA 下半透明特效出现拖影和闪烁，如何建立系统解决方案？",
    intent: "考察时域采样、运动矢量、历史置信度与内容策略的综合理解。",
    method: {
      framework: "先区分信息缺失与历史错误，再从输入、重投影、历史融合和内容表现四层处理。",
      steps: [
        { title: "诊断", detail: "分别查看当前帧、Velocity、Depth、History 与 Rejection Mask，确认是错误运动矢量、遮挡揭露还是高频闪烁。" },
        { title: "算法", detail: "为透明对象提供可靠 Velocity/Reactive Mask，使用邻域裁剪、深度/法线拒绝与自适应历史权重。" },
        { title: "内容", detail: "限制亚像素高频噪声和过快 UV 动画，为细线与粒子提供响应式 AA、独立通道或后合成策略。" },
      ],
      checklist: ["展示 Debug View", "说明透明无深度信息的困难", "比较画质、稳定性与成本"],
    },
  },
  {
    id: "high-gpu-budget",
    level: "high",
    category: "performance",
    question: "如何为开放场景建立可持续的 GPU 性能预算和回归体系？",
    intent: "考察从单次优化升级到长期性能治理的能力。",
    method: {
      framework: "把总帧时拆到系统和内容，再通过代表性样本、自动采集与责任归属形成闭环。",
      steps: [
        { title: "预算树", detail: "按阴影、Base Pass、透明、后处理、Compute 等拆 GPU 毫秒，同时建立三角形、像素覆盖、带宽和显存辅助指标。" },
        { title: "采样", detail: "选择城镇、战斗、天气、昼夜等代表性路线，在目标硬件自动回放并采集 P50/P95/峰值。" },
        { title: "闭环", detail: "CI 对比基线并定位到场景、Pass 与提交变更；预算超标有负责人、豁免期限和可验证修复。" },
      ],
      checklist: ["区分帧时预算与代理指标", "覆盖热机与内存压力", "报告要能行动而非只展示曲线"],
    },
  },
  {
    id: "high-pipeline-versioning",
    level: "high",
    category: "pipeline",
    question: "大型项目升级 DCC 或引擎版本时，如何降低资产管线迁移风险？",
    intent: "考察版本化、兼容策略、数据验证与团队迁移设计。",
    method: {
      framework: "把迁移当作数据协议升级：先清点依赖，再双轨验证，最后分批切换并保留回滚窗口。",
      steps: [
        { title: "清点", detail: "建立插件、脚本、文件格式、导出器和关键资产的兼容矩阵，标出不可逆转换与高风险环节。" },
        { title: "验证", detail: "用黄金资产集做自动导入、渲染对比和数值检查；旧版与新版在隔离分支/环境中并行一段时间。" },
        { title: "迁移", detail: "按团队或资产域灰度切换，迁移工具必须幂等、可记录、可重跑；在完成验收前保留源文件与回滚方案。" },
      ],
      checklist: ["禁止静默覆盖源资产", "记录版本与转换日志", "定义完成标准和旧链路下线日期"],
    },
  },
  {
    id: "high-ta-strategy",
    level: "high",
    category: "production",
    question: "作为高级 TA，如何决定未来一个季度最值得建设的技术能力？",
    intent: "考察是否能把技术判断连接到项目目标、团队瓶颈与可衡量结果。",
    method: {
      framework: "用项目风险、重复成本、质量上限和组织可采用性四个维度排序，而不是追逐最新技术。",
      steps: [
        { title: "发现", detail: "访谈美术、程序和制作，结合返工数据、性能报告与里程碑风险，形成问题池。" },
        { title: "排序", detail: "评估影响人数、节省时间、质量收益、技术风险和维护成本，选择少量能形成复利的方向。" },
        { title: "交付", detail: "为每项建设定义 Owner、试点场景、采用率、性能/质量指标和退出条件，每两周用真实制作反馈调整。" },
      ],
      checklist: ["同时说明不做什么", "优先试点再平台化", "把培训、文档和支持计入交付成本"],
    },
  },
  {
    id: "low-dot-product",
    level: "low",
    category: "rendering",
    question: "光照计算中的 N·L 表示什么？为什么参与点积的向量通常要归一化？",
    intent: "考察向量、点积与最基础漫反射模型的理解。",
    method: {
      framework: "从点积的几何意义回答，再连接 Lambert 光照，最后说明未归一化会引入什么错误。",
      steps: [
        { title: "几何", detail: "两个单位向量的点积等于夹角余弦，N·L 越接近 1，表面越正对光源。" },
        { title: "着色", detail: "Lambert 漫反射通常使用 max(0, N·L)，负值代表光在表面背面，不应贡献正面照明。" },
        { title: "归一", detail: "若向量长度不为 1，点积会同时混入长度，结果不再只表示方向关系，亮度也会失真。" },
      ],
      checklist: ["指出 clamp / saturate 的作用", "区分方向向量与位置", "可补充半 Lambert 是风格化改造"],
    },
  },
  {
    id: "low-vertex-fragment",
    level: "low",
    category: "shader",
    question: "顶点着色器和片元着色器分别负责什么？数据怎样从一个阶段传到另一个阶段？",
    intent: "考察对可编程渲染管线阶段和插值行为的基础认识。",
    method: {
      framework: "按输入、职责、输出解释两个阶段，再补充 varying 数据会经过光栅化插值。",
      steps: [
        { title: "顶点", detail: "逐顶点执行，完成模型到裁剪空间变换，也可处理顶点动画并输出 UV、法线等数据。" },
        { title: "光栅", detail: "三角形覆盖屏幕后，顶点输出会按重心坐标插值，形成每个候选片元的输入。" },
        { title: "片元", detail: "逐片元计算材质、光照和最终颜色，也可能执行裁剪、深度或多渲染目标输出。" },
      ],
      checklist: ["说明执行频率不同", "提到 flat / nointerpolation 场景", "不要把片元与最终屏幕像素完全等同"],
    },
  },
  {
    id: "low-mipmap-lod",
    level: "low",
    category: "engine",
    question: "什么是 Mipmap 与 LOD？它们分别解决什么问题？",
    intent: "考察纹理采样与几何复杂度管理的基础概念。",
    method: {
      framework: "先区分纹理层级和几何层级，再分别说明画质、性能与内存代价。",
      steps: [
        { title: "Mipmap", detail: "预生成逐级缩小的纹理，在远距离采样合适层级，减少闪烁和缓存压力，但会增加约三分之一纹理内存。" },
        { title: "LOD", detail: "按屏幕占比切换简化网格、材质或效果，降低顶点、骨骼、Shader 与绘制成本。" },
        { title: "切换", detail: "需要设置合理阈值、迟滞或渐变，避免镜头运动时频繁跳变和明显 Pop。" },
      ],
      checklist: ["区分纹理与模型 LOD", "提到三线性过滤", "说明应按屏幕尺寸而非只按世界距离"],
    },
  },
  {
    id: "low-overdraw",
    level: "low",
    category: "performance",
    question: "什么是 Overdraw？为什么粒子、植被和 UI 容易出现填充率问题？",
    intent: "考察像素重复着色、透明混合与屏幕覆盖面积的关系。",
    method: {
      framework: "从同一像素被重复处理解释 Overdraw，再说明透明对象为何难以被深度提前剔除。",
      steps: [
        { title: "现象", detail: "多个图元覆盖同一屏幕像素时，片元着色与混合会重复执行，最终只有最后的组合结果可见。" },
        { title: "高发", detail: "大面积透明四边形、层叠 UI 和植被卡片常关闭深度写入或包含大量空白区域，导致重复采样和混合。" },
        { title: "检查", detail: "使用 Overdraw / Quad Overdraw 视图，结合分辨率缩放测试确认是否受像素成本限制。" },
      ],
      checklist: ["裁紧粒子 Mesh", "减少层叠和全屏透明", "Alpha Test 与透明混合需按平台权衡"],
    },
  },
  {
    id: "low-pivot-naming",
    level: "low",
    category: "pipeline",
    question: "一项模型资产进入引擎前，Pivot、命名和材质槽为什么需要统一规范？",
    intent: "考察是否理解规范如何影响复用、自动化与多人协作。",
    method: {
      framework: "分别说明三类信息的下游消费者，再给出可自动检查的规则。",
      steps: [
        { title: "Pivot", detail: "影响摆放、旋转、吸附、动画与程序化生成；门、车轮和模块化建筑需要明确语义位置。" },
        { title: "命名", detail: "稳定命名让搜索、批处理、依赖分析和构建规则可以可靠识别资产类型与用途。" },
        { title: "材质槽", detail: "固定槽位数量和顺序可避免导入后材质错配，也能限制不必要的子网格与 Draw Call。" },
      ],
      checklist: ["规则要机器可读", "提供正确与错误示例", "特殊资产允许有记录的例外"],
    },
  },
  {
    id: "low-bug-report",
    level: "low",
    category: "production",
    question: "提交一个渲染 Bug 时，至少应该包含哪些信息？",
    intent: "考察问题复现、信息完整性和跨岗位沟通习惯。",
    method: {
      framework: "用预期、实际、环境、步骤和证据五项组织，保证接手者无需猜测。",
      steps: [
        { title: "描述", detail: "给出预期结果与实际结果，标出画面差异出现的位置和影响范围。" },
        { title: "环境", detail: "记录提交版本、场景、平台、显卡、画质档位和是否稳定复现。" },
        { title: "证据", detail: "附最短复现步骤、截图或视频；必要时补 Frame Debugger、日志和最小测试资产。" },
      ],
      checklist: ["一条问题只描述一个故障", "不要只发截图不写步骤", "验证旧版本或其他平台是否同样出现"],
    },
  },
  {
    id: "mid-shadow-artifacts",
    level: "mid",
    category: "rendering",
    question: "阴影出现 Shadow Acne、漏光或 Peter Panning，你如何定位和调参？",
    intent: "考察阴影贴图精度、Bias 与投射接收关系的综合判断。",
    method: {
      framework: "先识别伪影类型，再检查投影精度与 Bias，最后从资产和管线层验证。",
      steps: [
        { title: "识别", detail: "自阴影条纹通常是深度精度与 Bias 不足；阴影悬浮多为 Bias 过大；薄墙漏光还可能来自几何厚度与级联分辨率。" },
        { title: "调参", detail: "结合 Depth Bias、Normal Bias、Slope Bias 调整，并检查阴影分辨率、Cascade 分布和 Near/Far 范围。" },
        { title: "验证", detail: "用固定光源和标准测试物比较不同距离，避免只在单个镜头把参数调到“看起来没问题”。" },
      ],
      checklist: ["解释 Bias 的质量代价", "检查双面阴影与法线", "按平台建立默认档位"],
    },
  },
  {
    id: "mid-vertex-animation",
    level: "mid",
    category: "shader",
    question: "用顶点动画制作植被风动时，怎样兼顾自然感、包围盒和运动矢量？",
    intent: "考察视觉分层与引擎系统兼容，而不只是会做正弦位移。",
    method: {
      framework: "把风动拆成整体摆动、枝叶细节和交互扰动，并同步处理裁剪与时域信息。",
      steps: [
        { title: "分层", detail: "用顶点色或高度 Mask 控制根部固定，低频主风控制整体，高频噪声负责叶片细节，避免所有顶点同相运动。" },
        { title: "稳定", detail: "统一世界空间风场与实例随机相位，限制位移幅度，扩大 Bounds 防止视锥和阴影错误剔除。" },
        { title: "时域", detail: "为前一帧位置提供一致计算或自定义 Motion Vector，避免 TAA 拖影；远景降低频率或停止细节动画。" },
      ],
      checklist: ["考虑阴影 Pass", "说明实例化参数来源", "准备移动端简化版本"],
    },
  },
  {
    id: "mid-decals",
    level: "mid",
    category: "engine",
    question: "血迹、弹孔和道路标记的 Decal，你会怎样选择实现方案？",
    intent: "考察投射空间、渲染顺序、材质通道与平台限制。",
    method: {
      framework: "先按是否静态、是否大量、需要修改哪些材质通道分类，再比较 Mesh、屏幕空间和烘焙方案。",
      steps: [
        { title: "选型", detail: "少量可控标记可用贴合 Mesh；延迟管线可用 DBuffer / GBuffer Decal；超大量静态道路标记更适合烘焙或虚拟纹理。" },
        { title: "接入", detail: "明确投射体积、Layer、深度/法线重建、混合通道和执行 Pass，避免作用到不应接收的对象。" },
        { title: "风险", detail: "处理视角拉伸、Z-fighting、透明排序、Overdraw 和动态对象运动，并设置生命周期与数量上限。" },
      ],
      checklist: ["说明 Forward 与 Deferred 差异", "限制影响通道", "提供对象过滤机制"],
    },
  },
  {
    id: "mid-particle-budget",
    level: "mid",
    category: "performance",
    question: "GPU 时间显示粒子特效过重，你会如何建立优化顺序？",
    intent: "考察从测量到视觉取舍的粒子优化方法。",
    method: {
      framework: "先按像素、模拟、绘制和资源四类拆成本，再优先处理贡献最高且视觉损失最低的项。",
      steps: [
        { title: "测量", detail: "分离透明 Pass、Compute 模拟、Draw Call、纹理带宽与峰值粒子数，记录目标镜头的 GPU 毫秒。" },
        { title: "优化", detail: "先裁紧 Mesh、降低覆盖与层叠，再减少高成本 Shader、灯光和扭曲；之后才调整发射数、更新频率与碰撞。" },
        { title: "分级", detail: "按距离和画质档位缩放数量、材质特性与模拟频率，保证关键读形元素优先保留。" },
      ],
      checklist: ["同时看峰值与平均值", "在目标分辨率测试", "避免只靠减少粒子数量"],
    },
  },
  {
    id: "mid-procedural-tool",
    level: "mid",
    category: "pipeline",
    question: "一个程序化生成工具怎样做到可重复执行、可撤销并且不会污染资产？",
    intent: "考察幂等性、数据所有权和安全修改能力。",
    method: {
      framework: "先明确输入输出契约，再设计稳定标识、事务和日志，最后覆盖重复运行与中断恢复。",
      steps: [
        { title: "契约", detail: "分离用户源数据、生成参数与派生结果，生成物放入明确命名空间，并记录工具版本。" },
        { title: "安全", detail: "使用稳定 ID 更新已有结果，修改放入 Undo/事务；写盘前校验并在失败时回滚，绝不静默覆盖源资产。" },
        { title: "验证", detail: "测试首次生成、重复运行、参数变化、部分缺失和工具崩溃后的恢复，输出结构化日志。" },
      ],
      checklist: ["生成结果可删除重建", "结果确定性可测试", "用户手改区域要有明确边界"],
    },
  },
  {
    id: "mid-acceptance-criteria",
    level: "mid",
    category: "production",
    question: "如何把一张视觉参考图转成可执行、可验收的技术方案？",
    intent: "考察视觉拆解、约束识别和交付定义。",
    method: {
      framework: "把参考拆成感知目标、实现变量、限制条件和验收证据四层。",
      steps: [
        { title: "拆解", detail: "标出轮廓、明暗层级、材质特征、运动节奏与镜头关系，区分必须保留与可妥协部分。" },
        { title: "方案", detail: "将每个视觉特征映射到资产、Shader、灯光、VFX 或后处理，并列出平台预算和依赖。" },
        { title: "验收", detail: "确定对比镜头、设备、曝光、性能指标和 A/B 图，避免用“更有质感”作为唯一完成标准。" },
      ],
      checklist: ["先做最小样片", "记录无法从参考判断的假设", "把性能验收写进 Definition of Done"],
    },
  },
  {
    id: "high-large-world-precision",
    level: "high",
    category: "rendering",
    question: "超大世界中出现顶点抖动、阴影不稳和深度冲突，你会怎样设计精度方案？",
    intent: "考察浮点精度、坐标空间与多系统协同。",
    method: {
      framework: "分别处理世界位置、相机相对渲染和深度分布，并明确每个系统使用的坐标精度。",
      steps: [
        { title: "坐标", detail: "逻辑层可使用双精度或分区坐标，渲染层采用 Floating Origin / Camera Relative 让参与矩阵计算的数值保持较小。" },
        { title: "深度", detail: "收紧 Near/Far，考虑 Reversed-Z 与浮点深度缓冲；阴影使用稳定级联、局部空间或虚拟阴影方案。" },
        { title: "协同", detail: "物理、粒子、导航、音频和网络复制必须共享重定位事件与分区规则，避免只修复相机画面。" },
      ],
      checklist: ["量化误差随距离的增长", "测试世界原点切换瞬间", "处理历史缓冲与 Motion Vector"],
    },
  },
  {
    id: "high-material-architecture",
    level: "high",
    category: "shader",
    question: "如何设计一套可扩展的主材质系统，避免万能 Shader 和重复材质同时失控？",
    intent: "考察 Shader 架构、内容体验、变体和长期治理。",
    method: {
      framework: "以材质家族划分稳定边界，用共享函数复用原理，用数据与预算限制功能组合。",
      steps: [
        { title: "分层", detail: "按表面模型与使用场景拆为角色、环境、植被等家族，共享 BRDF、采样和调试函数，而非一个 Shader 覆盖所有需求。" },
        { title: "接口", detail: "提供语义明确的参数组、Material Function 与预设；高成本功能显示预算标识，并对互斥选项做约束。" },
        { title: "治理", detail: "统计功能使用率、Variant、指令数和材质实例数量，通过版本迁移、弃用流程与回归场景持续收敛。" },
      ],
      checklist: ["区分编译期开关与运行时参数", "设计 Debug View", "让美术默认路径就是安全路径"],
    },
  },
  {
    id: "high-render-graph",
    level: "high",
    category: "engine",
    question: "引入 Render Graph 或 Async Compute 时，你会如何判断收益和同步风险？",
    intent: "考察资源生命周期、Pass 依赖、并行执行与硬件差异。",
    method: {
      framework: "先画出资源与 Pass 依赖，再寻找可重叠区间，最后用 GPU 时间线证明真实并行。",
      steps: [
        { title: "图结构", detail: "声明每个 Pass 的读写资源、格式和生命周期，让系统做别名复用、Barrier 与无用 Pass 剔除。" },
        { title: "并行", detail: "选择与图形队列依赖少、占用不同硬件单元的 Compute 工作；避免共享资源频繁切换和队列互相等待。" },
        { title: "验证", detail: "用 GPU Timeline 比较重叠前后总帧时，而非只看单个 Pass；覆盖不同架构、负载和带宽压力。" },
      ],
      checklist: ["说明异步不等于免费", "保留串行回退路径", "关注显存峰值与 Barrier 数量"],
    },
  },
  {
    id: "high-memory-bandwidth",
    level: "high",
    category: "performance",
    question: "项目 GPU 算力尚有余量但带宽与显存吃紧，你会怎样建立优化策略？",
    intent: "考察是否能区分算术瓶颈、带宽瓶颈与容量问题。",
    method: {
      framework: "从资源驻留、每帧传输和采样效率三条线建数据画像，再按画质收益分配预算。",
      steps: [
        { title: "画像", detail: "统计 Render Target、纹理、几何、Buffer 的驻留与峰值，结合 Cache Miss、带宽计数器和分辨率缩放定位热点。" },
        { title: "收敛", detail: "压缩格式、通道打包、降低中间 Buffer 精度与分辨率，减少重复采样和 GBuffer 写入，改进纹理局部性。" },
        { title: "流送", detail: "为纹理与几何设置优先级、预取和淘汰规则，监控抖动；容量超限与瞬时上传峰值要分别治理。" },
      ],
      checklist: ["避免只看资源文件大小", "计算 Render Target 每帧读写量", "用目标硬件计数器验证"],
    },
  },
  {
    id: "high-asset-schema",
    level: "high",
    category: "pipeline",
    question: "跨 DCC、引擎和外包团队共享资产时，如何设计可演进的数据协议？",
    intent: "考察 Schema、版本兼容、所有权与验证体系。",
    method: {
      framework: "先定义语义与所有权，再设计版本和兼容策略，最后用验证器与黄金样本保证实现一致。",
      steps: [
        { title: "语义", detail: "明确单位、轴向、命名、材质绑定、变体、依赖和元数据字段，指定每类数据的权威来源。" },
        { title: "演进", detail: "Schema 带显式版本；新增字段提供默认值，破坏性变更配迁移器与弃用期，避免用文件名隐式传递关键语义。" },
        { title: "落地", detail: "各端适配器共享验证用例，CI 对黄金资产做往返测试、渲染对比与依赖完整性检查。" },
      ],
      checklist: ["协议与工具版本解耦", "错误信息能定位到字段", "外包交付使用同一预检器"],
    },
  },
  {
    id: "high-adoption",
    level: "high",
    category: "production",
    question: "团队不愿使用你开发的新工具，你如何判断原因并推动采用？",
    intent: "考察技术推广、行为观察和产品化意识。",
    method: {
      framework: "不把问题归因为“用户不配合”，而是从价值、摩擦、信任和流程位置四个维度验证。",
      steps: [
        { title: "诊断", detail: "观察真实工作流，访谈未采用者，记录时间成本、缺失功能、学习负担和失败案例，而不是只看下载量。" },
        { title: "试点", detail: "选择高频痛点与愿意反馈的小团队，嵌入现有入口，提供可撤销结果、迁移帮助与明确支持渠道。" },
        { title: "度量", detail: "跟踪周活、任务完成时间、错误率、回退率与满意度；若收益不足，缩小范围或停止维护。" },
      ],
      checklist: ["把文档培训计入产品", "默认设置安全可用", "建立弃用旧流程的明确条件"],
    },
  },
];

type ExpandedQuestionSeed = {
  id: string;
  level: InterviewLevelKey;
  category: InterviewSourceCategoryKey;
  question: string;
  intent: string;
  approach: string;
  points: [string, string, string];
};

function seed(
  id: string,
  level: InterviewLevelKey,
  category: InterviewSourceCategoryKey,
  question: string,
  intent: string,
  approach: string,
  points: [string, string, string],
): ExpandedQuestionSeed {
  return { id, level, category, question, intent, approach, points };
}

const expandedQuestionSeeds: ExpandedQuestionSeed[] = [
  // Low / Rendering
  seed("low-coordinate-spaces", "low", "rendering", "模型空间、世界空间、观察空间和裁剪空间有什么区别？", "考察空间变换链路与矩阵使用基础。", "沿一个顶点从模型文件到屏幕的路径依次解释，每一步说明相对哪个坐标系。", [
    "模型空间描述资产自身坐标，乘模型矩阵后进入统一世界空间。",
    "世界位置经观察矩阵进入相机空间，再经投影矩阵得到裁剪空间位置。",
    "透视除法得到 NDC，视口变换才映射到最终屏幕像素。",
  ]),
  seed("low-alpha-blend", "low", "rendering", "普通 Alpha Blend 与预乘 Alpha 有什么区别？", "考察颜色与透明度混合的基本规则。", "先写出源色与背景色的组合关系，再说明边缘、贴图过滤和合成场景。", [
    "普通混合通常使用 SrcAlpha 与 OneMinusSrcAlpha，源 RGB 尚未乘 Alpha。",
    "预乘方案在纹理或 Shader 中预先让 RGB 乘 Alpha，混合时源因子使用 One。",
    "预乘 Alpha 对过滤边缘和加法到透明的过渡更稳定，但资产与 Blend State 必须一致。",
  ]),
  seed("low-aliasing", "low", "rendering", "画面为什么会出现锯齿？MSAA、FXAA 和 TAA 分别在处理什么？", "考察采样不足与常见抗锯齿方法。", "从一个像素无法完整描述高频信号解释混叠，再比较三类方法的输入和代价。", [
    "几何边缘、细纹理和高光变化超过像素采样频率时会产生锯齿与闪烁。",
    "MSAA 增加覆盖采样，擅长几何边缘；FXAA 是低成本屏幕后边缘平滑。",
    "TAA 累积抖动后的历史样本，时域稳定更好，但可能引入拖影和软化。",
  ]),
  seed("low-shadow-map", "low", "rendering", "Shadow Map 的基本工作流程是什么？", "考察最常见实时阴影技术。", "用光源视角深度图与相机视角深度比较两步回答。", [
    "先从光源视角渲染场景深度，得到光能看到的最近表面。",
    "相机着色时把世界位置变换到光源投影空间，并与阴影图深度比较。",
    "分辨率、投影范围与 Bias 会共同影响锯齿、漏光和自阴影伪影。",
  ]),

  // Low / Shader
  seed("low-uv", "low", "shader", "UV 是什么？平铺、偏移与旋转在 Shader 中如何实现？", "考察纹理坐标与基础数学操作。", "把 UV 解释为纹理采样地址，再给出缩放、平移和绕中心旋转的顺序。", [
    "UV 通常是网格顶点携带的二维坐标，经光栅化插值后用于采样纹理。",
    "平铺是乘 Scale，偏移是加 Offset；运算顺序改变最终结果。",
    "绕中心旋转需先减去 0.5，乘二维旋转矩阵后再加回 0.5。",
  ]),
  seed("low-texture-filter", "low", "shader", "Point、Bilinear、Trilinear 和各向异性过滤有什么区别？", "考察纹理采样质量与成本。", "从同一 Mip 内、跨 Mip 和斜视角三个维度比较。", [
    "Point 取最近纹素；Bilinear 在一个 Mip 内插值四个纹素。",
    "Trilinear 再在相邻两个 Mip 结果间插值，减少层级切换边界。",
    "各向异性过滤改善斜视表面的细节，但采样成本更高，应按材质重要度配置。",
  ]),
  seed("low-alpha-clip", "low", "shader", "Alpha Clip 与透明混合该如何选择？", "考察两种透明表现的差异。", "按边缘类型、排序、深度写入和性能四项比较。", [
    "Alpha Clip 按阈值保留或丢弃片元，边缘硬，但通常能写深度并正确遮挡。",
    "透明混合支持半透明渐变，却带来排序、Overdraw 和深度写入难题。",
    "树叶、铁网常优先 Clip；玻璃、烟雾才需要 Blend，并准备相应排序策略。",
  ]),
  seed("low-shader-pass", "low", "shader", "Shader 中的 Pass、Keyword 和材质参数分别解决什么问题？", "考察 Shader 组织方式。", "把它们分别对应渲染阶段、编译分支和运行时数据。", [
    "Pass 描述一次绘制的状态与程序，例如前向光照、阴影和深度写入。",
    "Keyword 常生成不同编译变体，适合结构性差异，但组合过多会膨胀。",
    "材质参数在同一程序内改变数值或纹理，灵活但仍有分支和数据上传成本。",
  ]),

  // Low / Engine
  seed("low-culling", "low", "engine", "视锥剔除与遮挡剔除有什么区别？", "考察引擎如何减少不可见对象。", "先说明相机范围，再说明被其他物体挡住的可见性判断。", [
    "视锥剔除依据对象 Bounds 是否落在相机六个平面内，成本低且每帧常用。",
    "遮挡剔除进一步判断对象是否被前景遮挡，可依赖烘焙数据或 GPU 查询。",
    "Bounds 错误会导致过早消失；剔除本身也有成本，不适合无限细分对象。",
  ]),
  seed("low-light-probe", "low", "engine", "Lightmap、Light Probe 与 Reflection Probe 各自存储什么？", "考察烘焙光照数据的职责。", "按静态表面、动态对象间接光与镜面环境反射区分。", [
    "Lightmap 把静态表面的间接光与部分直接光烘焙到纹理。",
    "Light Probe 在空间采样光照系数，让动态对象插值得到低频间接光。",
    "Reflection Probe 捕获环境镜面反射，通常用 Cubemap 与粗糙度 Mip 采样。",
  ]),
  seed("low-baked-light", "low", "engine", "实时灯光、混合灯光与烘焙灯光的主要差别是什么？", "考察灯光质量与运行成本。", "从可变性、阴影、间接光和资产限制比较。", [
    "实时灯可动态变化并影响动态对象，但每帧产生光照与阴影成本。",
    "烘焙灯把结果写入 Lightmap，运行成本低，却不适合运行时大幅变化。",
    "混合模式在静态间接光与动态直接光之间取舍，具体行为取决于引擎模式。",
  ]),
  seed("low-post-process", "low", "engine", "Bloom、Tone Mapping、Color Grading 的作用和顺序是什么？", "考察基础后处理链路。", "先说明 HDR 画面中的职责，再给出常见处理顺序。", [
    "Bloom 提取并扩散高亮区域，模拟镜头或眼睛对强光的溢出感。",
    "Tone Mapping 把 HDR 亮度压缩到显示范围，同时影响对比和高光滚降。",
    "Color Grading 用 LUT 或曲线统一风格，通常在曝光与 Tone Mapping 链路中按项目约定执行。",
  ]),

  // Low / Performance
  seed("low-frame-time", "low", "performance", "为什么性能分析更应该看毫秒而不是只看 FPS？", "考察帧率与帧时的非线性关系。", "用 30、60、120 FPS 对应帧时解释，再说明预算拆分。", [
    "60 FPS 约等于每帧 16.67 ms，30 FPS 约 33.33 ms，两者不是只差 30 个单位。",
    "毫秒可以直接分配给 CPU、GPU 与具体系统，也能量化优化收益。",
    "评估时还要看 P95、峰值和帧时间线，平均 FPS 会掩盖卡顿。",
  ]),
  seed("low-memory-types", "low", "performance", "系统内存、显存和磁盘空间在游戏中分别承担什么？", "考察资源生命周期的基础概念。", "按持久存储、CPU 可访问工作集与 GPU 驻留资源区分。", [
    "磁盘保存压缩后的包体与源资源，读取速度远低于内存。",
    "系统内存承载运行时对象、解压数据和 CPU 工作集，也可能作为上传中转。",
    "显存存储 GPU 使用的纹理、Buffer 与 Render Target；超限可能触发换页和严重抖动。",
  ]),
  seed("low-vertex-cost", "low", "performance", "多边形数量相同的两个模型，渲染成本为什么仍可能不同？", "考察顶点、片元和材质成本并非只由面数决定。", "从顶点重复、屏幕覆盖、材质与绘制状态四方面解释。", [
    "硬边、UV 缝和多材质会拆分顶点，GPU 实际处理的顶点数可能高于 DCC 显示。",
    "占屏面积决定片元量，高 Overdraw 或复杂 Shader 可能远超几何成本。",
    "材质槽、蒙皮、Blend Shape 与 Draw Call 数也会改变 CPU 和 GPU 开销。",
  ]),
  seed("low-texture-compression", "low", "performance", "为什么纹理需要压缩？颜色、法线和 Mask 能使用同一种格式吗？", "考察纹理格式与数据类型。", "从显存、带宽和通道特征解释格式选择。", [
    "块压缩可显著降低显存与采样带宽，并让 GPU 直接读取压缩纹理。",
    "颜色、法线与单通道 Mask 对误差和通道精度的需求不同，应选择相应 BC、ASTC 或平台格式。",
    "压缩伪影要在目标设备检查；数据贴图还必须关闭 sRGB 解码。",
  ]),

  // Low / Pipeline
  seed("low-fbx-content", "low", "pipeline", "一个 FBX 文件里通常包含哪些信息？哪些内容不应盲目依赖格式自动转换？", "考察交换格式与数据边界。", "列出几何、层级、动画和材质引用，并指出不同软件解释差异。", [
    "FBX 可携带网格、法线、切线、UV、层级、骨骼、蒙皮和动画曲线。",
    "复杂材质网络、约束、修改器与程序化历史通常无法完整跨软件复现。",
    "项目应规定可交换子集、导出预设与验证器，而不是把 FBX 当作无损工程文件。",
  ]),
  seed("low-import-color", "low", "pipeline", "导入 Base Color、Normal、Roughness 和 HDR 贴图时，关键设置有哪些？", "考察常见纹理导入规则。", "按颜色数据、向量数据、标量数据与 HDR 数据分别回答。", [
    "Base Color 通常启用 sRGB；Normal 选择法线类型并确认切线空间约定。",
    "Roughness、Metallic、AO 与 Mask 是线性数据，应关闭 sRGB 并检查通道。",
    "HDR 环境贴图需保留高动态范围，设置合适压缩、Cubemap 与 Mip 生成方式。",
  ]),
  seed("low-collision-lod-naming", "low", "pipeline", "碰撞体和 LOD 的命名约定为什么会影响自动导入？", "考察约定优于手工配置的管线思想。", "说明导入器如何用名称识别特殊网格，以及错误的下游影响。", [
    "前缀或后缀可让导入器把网格识别为简单碰撞、复杂碰撞或指定 LOD。",
    "一致约定减少每个资产的手工配置，也能在 CI 中自动验证层级完整性。",
    "命名错误可能把辅助网格渲染出来、丢失碰撞，或造成 LOD 顺序错误。",
  ]),
  seed("low-version-control", "low", "pipeline", "美术资产进入版本控制时，为什么要关注二进制锁定与提交粒度？", "考察多人协作中的资产冲突。", "从是否可合并、依赖关系和回滚成本解释。", [
    "PSD、场景文件等二进制资产通常无法可靠文本合并，需要锁定或明确所有权。",
    "一次提交应包含可工作的相关依赖并写清意图，避免混入大量无关自动保存变化。",
    "源文件与导出文件的版本策略要明确，否则回滚时可能出现数据不一致。",
  ]),

  // Low / Production
  seed("low-ta-role", "low", "production", "技术美术在项目中通常解决哪些类型的问题？", "考察对 TA 职责边界的认识。", "从视觉实现、工具管线、性能质量和跨岗位沟通四类概括。", [
    "帮助把美术目标转译为实时渲染、Shader、VFX 与内容实现方案。",
    "建设 DCC、导入、验证和自动化工具，减少重复劳动与错误。",
    "连接美术和程序共同管理性能预算、质量标准与制作风险。",
  ]),
  seed("low-estimation", "low", "production", "你会如何估算一个不熟悉的 TA 任务？", "考察拆解、假设与风险意识。", "先拆交付物与依赖，再给范围估算、验证点和风险缓冲。", [
    "明确目标、完成标准、目标平台和已有资源，把任务拆成研究、原型、投产与支持。",
    "对未知项安排短时技术验证，并说明估算基于哪些假设。",
    "给出乐观、正常和风险范围，在验证节点后更新估算而非坚持最初数字。",
  ]),
  seed("low-minimal-repro", "low", "production", "为什么排查问题时要制作最小复现？", "考察控制变量与沟通效率。", "说明最小复现如何隔离变量、加速共享与形成回归测试。", [
    "删除与问题无关的资产和系统，可以更快确认触发问题的必要条件。",
    "小场景便于跨团队传递，也更容易被 RenderDoc、Profiler 或调试器捕获。",
    "修复后保留最小样本可转为回归测试，防止同类问题再次出现。",
  ]),
  seed("low-documentation", "low", "production", "一份好用的工具文档至少应包含什么？", "考察知识交付而非只交付代码。", "按使用目标、快速开始、边界与排错组织。", [
    "开头说明工具解决什么问题、适用对象和最短成功路径。",
    "用真实示例解释输入、输出、关键参数与推荐默认值。",
    "列出限制、常见错误、版本兼容、反馈渠道和维护负责人。",
  ]),

  // Mid / Rendering
  seed("mid-brdf", "mid", "rendering", "如何解释 BRDF 中 D、F、G 三项各自控制的现象？", "考察微表面模型的结构理解。", "用微表面法线分布、菲涅耳与可见性遮蔽三部分回答，并连接材质参数。", [
    "D 描述微表面法线朝向分布，粗糙度会改变高光形状和峰值。",
    "F 描述反射率随视角变化，掠射角通常反射更强。",
    "G 处理微表面之间的遮蔽与阴影，防止高光能量不合理累积。",
  ]),
  seed("mid-csm", "mid", "rendering", "级联阴影 CSM 为什么需要分段？怎样设置分段距离？", "考察大范围方向光阴影质量。", "从有限分辨率分配开始，说明近密远疏和稳定性策略。", [
    "单张阴影图覆盖巨大相机范围时，近处单位世界面积得到的纹素太少。",
    "CSM 按视锥深度切分，近景使用更密分辨率，远景降低精度。",
    "分段应结合镜头、场景尺度和移动速度，并处理级联过渡与相机抖动。",
  ]),
  seed("mid-hdr-tone", "mid", "rendering", "HDR、曝光和 Tone Mapping 如何共同影响最终画面？", "考察从物理亮度到显示输出的链路。", "沿场景线性亮度、曝光缩放、色调映射和显示编码解释。", [
    "光照先在线性 HDR 空间产生可超过 1 的亮度，保留真实强弱关系。",
    "曝光决定整体亮度基准，可手动或自动适应，但必须有稳定的测光规则。",
    "Tone Mapper 压缩动态范围并决定高光滚降，再输出到目标色域与传递函数。",
  ]),
  seed("mid-screen-effects", "mid", "rendering", "SSAO、SSR 等屏幕空间效果有哪些共同局限？", "考察对屏幕数据边界的认识。", "从输入只能来自当前视图解释缺失、遮挡和边缘问题。", [
    "屏幕外、被完全遮挡或深度缓冲无法表达的信息不可用，因此会出现缺失与错误匹配。",
    "低分辨率采样和射线步进会带来噪声、漏光、边缘断裂和时域不稳定。",
    "应提供 Probe、烘焙、光追或艺术回退，并用 Mask 限制不适合的表面。",
  ]),

  // Mid / Shader
  seed("mid-triplanar", "mid", "shader", "Triplanar Mapping 如何工作？它适合和不适合哪些资产？", "考察无 UV 投影与采样成本。", "按三轴投影、法线权重混合和边界处理说明。", [
    "使用世界或对象位置从 X、Y、Z 三个方向采样纹理。",
    "以表面法线绝对值作为权重混合三次采样，Sharpness 控制过渡宽度。",
    "适合岩石、地形和程序化物体，但采样多、方向性纹理接缝和法线混合需额外处理。",
  ]),
  seed("mid-fresnel-rim", "mid", "shader", "菲涅耳边缘光与真实 Fresnel 有什么关系？如何避免效果过度？", "考察美术效果与物理项的区别。", "先解释视角相关项，再区分 BRDF Fresnel 与额外风格化边缘光。", [
    "常见边缘 Mask 来自 1 - saturate(N·V)，再用 Power 控制宽度。",
    "真实 Fresnel 已参与镜面反射，额外 Rim Light 属于艺术增强，不应假装能量守恒。",
    "使用颜色、光向、遮挡和材质 Mask 限制，避免所有边缘无条件发亮。",
  ]),
  seed("mid-soft-particle", "mid", "shader", "软粒子如何利用深度图消除与场景相交的硬边？", "考察深度重建和透明效果。", "比较粒子深度与场景深度，根据差值淡出透明度。", [
    "采样屏幕深度并线性化，取得当前像素处不透明场景表面的距离。",
    "计算场景深度与粒子片元深度差，在接近交界处平滑降低 Alpha。",
    "要处理反向 Z、深度纹理可用性、半分辨率粒子和透明排序限制。",
  ]),
  seed("mid-shader-debug", "mid", "shader", "一个复杂 Shader 输出全黑或出现 NaN，你会怎样调试？", "考察着色器问题的隔离方法。", "从输入、空间、阶段、数值范围和平台编译逐层二分。", [
    "先输出常量色确认 Pass 执行，再逐项可视化 UV、法线、深度和 Mask。",
    "检查除零、负数开方、未归一向量、超范围采样与未初始化数据。",
    "缩小到最小 Shader，比较平台编译结果，并使用帧调试器检查资源与常量。",
  ]),

  // Mid / Engine
  seed("mid-forward-deferred", "mid", "engine", "Forward 与 Deferred 渲染路径如何选择？", "考察灯光、材质与平台的整体权衡。", "从光照复杂度、GBuffer、透明、多采样和平台带宽比较。", [
    "Forward 直接在物体 Pass 计算光照，透明和 MSAA 友好，但多灯可能重复着色。",
    "Deferred 先写 GBuffer 再统一光照，适合大量动态灯，却占带宽与显存，材质模型也受通道限制。",
    "选择要基于目标平台、灯光密度、透明比例和材质需求，而不是绝对优劣。",
  ]),
  seed("mid-stencil", "mid", "engine", "Stencil Buffer 或 Custom Depth 常用于哪些效果？有哪些风险？", "考察屏幕标记与遮挡控制。", "说明写入标记、后续比较和典型效果，再补充位宽与兼容性。", [
    "对象先写入模板值或自定义深度，后续 Pass 可按值选择区域或判断遮挡。",
    "常用于描边、传送门、局部后处理、角色遮挡显形与 Mask。",
    "模板位数有限且被多个系统共享，需要统一分配；额外 Pass 与透明对象兼容也要评估。",
  ]),
  seed("mid-reflection-probe", "mid", "engine", "室内外混合场景中如何布置 Reflection Probe 并处理过渡？", "考察反射捕获与空间混合。", "按影响范围、优先级、盒投影和动态更新说明。", [
    "按房间与材质变化划分 Probe 体积，避免一个 Cubemap 覆盖完全不同的光照环境。",
    "使用 Box Projection、Blend Distance 与 Priority 缓和边界，检查反射视差。",
    "动态更新频率与分辨率需预算；关键镜面可用平面反射或 SSR 补充。",
  ]),
  seed("mid-render-texture", "mid", "engine", "制作监控屏、镜子或传送门时，Render Texture 方案的主要成本是什么？", "考察二次相机渲染与资源管理。", "把成本拆为额外场景渲染、目标纹理与递归控制。", [
    "每个额外相机都可能再次执行剔除、阴影、绘制与后处理，成本接近一份子视图。",
    "Render Texture 分辨率、格式、MSAA 与更新频率决定显存和带宽。",
    "通过 Layer、简化 Shader、降分辨率、按需更新与递归上限控制成本。",
  ]),

  // Mid / Performance
  seed("mid-batching", "mid", "performance", "Static Batching、Dynamic Batching、GPU Instancing 各适合什么场景？", "考察批处理机制与限制。", "按数据是否合并、对象是否变化和材质一致性比较。", [
    "Static Batching 预合并静态几何以减少提交，但增加内存并可能扩大剔除粒度。",
    "Dynamic Batching 有 CPU 合并成本和顶点限制，现代平台未必总有收益。",
    "GPU Instancing 复用同一网格材质并上传实例数据，适合大量重复对象。",
  ]),
  seed("mid-shader-complexity", "mid", "performance", "如何判断一个 Shader 的复杂度来自哪里？", "考察指令、采样、带宽与分支的区分。", "结合编译统计和 GPU 捕获，把成本拆到真实硬件行为。", [
    "查看纹理采样、ALU、寄存器、分支、精度和 Render Target 写入，不只看节点数量。",
    "在目标材质和屏幕覆盖下用 Shader Complexity、GPU Capture 与替换 Shader 对比。",
    "瓶颈可能是采样带宽、占用率或像素数量，减少一类指令不一定降低总帧时。",
  ]),
  seed("mid-shadow-cost", "mid", "performance", "多盏动态灯和实时阴影同时开启时，如何快速降低成本？", "考察光照与阴影预算。", "先统计额外 Pass，再按影响范围、分辨率、更新与对象过滤收敛。", [
    "阴影投射会从灯光视角额外渲染对象，点光源可能需要多个面。",
    "限制投射灯数量、距离、分辨率、更新频率与 Caster Layer，优先保留叙事关键灯。",
    "使用烘焙、Cookie、Blob Shadow 或无阴影补光替代低价值实时阴影。",
  ]),
  seed("mid-memory-spike", "mid", "performance", "切换场景时内存瞬间翻倍并崩溃，你会如何排查？", "考察资源加载、峰值与释放时机。", "画出旧场景、加载缓冲和新场景的生命周期，找出重叠驻留。", [
    "记录加载前、加载中、加载后的内存快照，区分纹理、网格、音频和脚本对象。",
    "检查异步加载缓存、重复依赖、未释放引用和解压中间数据是否同时存在。",
    "采用分阶段卸载与加载、共享依赖常驻、预算门禁，并在低内存设备复测峰值。",
  ]),

  // Mid / Pipeline
  seed("mid-channel-pack", "mid", "pipeline", "如何设计自动化的纹理通道打包流程？", "考察规则化转换与可追溯性。", "定义输入语义、目标格式、缺省值和重建信息，再接入验证。", [
    "用元数据而非文件名猜测 AO、Roughness、Metallic 等输入语义。",
    "统一分辨率、色彩空间与位深，将通道写入项目约定格式，并为缺失输入提供安全默认值。",
    "生成结果记录来源与版本，支持批量重建、预览和压缩伪影检查。",
  ]),
  seed("mid-exporter", "mid", "pipeline", "一个可靠的 DCC 导出器应该在导出前后做哪些事？", "考察从内容准备到结果验证的完整流程。", "按预检、隔离导出、验证和报告四段组织。", [
    "预检单位、变换、命名、材质槽、骨骼与非法节点，阻止高风险错误。",
    "在临时副本中三角化、烘焙约束和清理历史，避免破坏艺术家的工作文件。",
    "导出后重新读取或让引擎验证结果，生成包含版本、依赖与警告的报告。",
  ]),
  seed("mid-dependency", "mid", "pipeline", "删除或移动资产前，工具如何可靠分析依赖关系？", "考察引用图与间接依赖。", "结合引擎资产数据库、文件级引用和运行时软引用建立图。", [
    "区分硬引用、软引用、字符串路径、场景引用和构建脚本生成的隐式依赖。",
    "建立反向引用图并显示引用来源，移动时使用引擎重定向或事务更新。",
    "对动态加载路径设置清单或扫描规则，删除操作提供预览、备份和恢复。",
  ]),
  seed("mid-art-ci", "mid", "pipeline", "美术资产如何接入 CI，而不让提交检查慢到无法使用？", "考察分层验证与反馈体验。", "把快速本地规则、增量提交检查和夜间全量检查分层。", [
    "提交前运行秒级命名、导入设置和元数据检查，错误直接定位到资产与规则。",
    "CI 只分析变更资产及受影响依赖，缓存稳定的导入和渲染结果。",
    "耗时渲染对比、全库依赖与平台构建放到夜间，并对回归提供可视化差异。",
  ]),

  // Mid / Production
  seed("mid-quality-ladder", "mid", "production", "如何为一个视觉功能设计高、中、低三档质量方案？", "考察可伸缩设计和视觉优先级。", "先确定不可丢失的感知特征，再逐项分级采样、分辨率和功能。", [
    "定义核心读形、颜色、节奏等最低视觉基线，不让低档变成完全不同的效果。",
    "把阴影、采样、粒子、分辨率和更新频率做成可独立伸缩的成本旋钮。",
    "在各档目标设备记录画质截图与毫秒，防止档位只改参数不产生收益。",
  ]),
  seed("mid-feature-spec", "mid", "production", "一份可执行的渲染功能技术方案应包含哪些章节？", "考察方案沟通与风险前置。", "从目标、非目标、方案、预算、依赖、验证和回退组织。", [
    "明确用户/画面目标、范围和不解决的问题，列出参考与验收镜头。",
    "描述数据流、Pass、资源、工具接口、平台差异与性能预算。",
    "记录替代方案、风险、里程碑、测试计划、Owner 和失败时的回退路径。",
  ]),
  seed("mid-risk-communication", "mid", "production", "发现某个视觉需求可能无法按期交付时，你会怎样沟通？", "考察透明沟通与解决问题能力。", "尽早用证据说明风险、影响和选项，而不是只报坏消息。", [
    "说明当前已验证事实、未知项、最晚决策时间和对里程碑的影响。",
    "提供缩范围、分阶段、替代效果或增加资源等选项及各自代价。",
    "与负责人确认选择、记录决定和后续检查点，持续更新而不是一次性上报。",
  ]),
  seed("mid-review-feedback", "mid", "production", "技术评审中收到“方案太复杂”的反馈，你如何处理？", "考察从反馈中提取约束并迭代方案。", "先确认复杂指的是实现、使用还是维护，再用目标和数据重构。", [
    "询问具体风险发生在哪个接口、依赖、维护成本或用户流程。",
    "回到必须满足的目标，删除低价值能力，比较最小方案与完整方案。",
    "用原型、流程图和成本数据再次评审，并记录暂不解决的边界。",
  ]),

  // High / Rendering
  seed("high-clustered", "high", "rendering", "大量动态灯光场景为什么会使用 Clustered 或 Forward+？", "考察屏幕/空间分块光源管理。", "从传统逐物体灯列表的扩展性问题出发，解释分块、剔除和着色。", [
    "将视锥划分为二维 Tile 或三维 Cluster，先计算每个区域可能影响的灯光列表。",
    "像素着色只遍历所在区域的灯，提升大量小灯场景的可扩展性。",
    "需要治理灯列表上限、深度分布、透明兼容、Buffer 带宽和最坏负载。",
  ]),
  seed("high-gi-strategy", "high", "rendering", "如何为动态时间与大世界选择 GI 方案？", "考察烘焙、探针、屏幕空间与光追的系统取舍。", "按动态性、尺度、平台、泄漏容忍和更新预算建立决策矩阵。", [
    "静态室内可依赖 Lightmap；动态对象通过 Probe；大世界需要分区流送与局部更新。",
    "屏幕空间 GI 成本可控但信息缺失，硬件光追质量高但设备与降噪成本显著。",
    "常用混合方案，并建立失效场景、回退层和艺术校正工具。",
  ]),
  seed("high-virtual-shadow", "high", "rendering", "虚拟阴影贴图相比传统级联阴影解决了什么，又引入什么？", "考察虚拟化阴影资源管理。", "从按需页分配、高分辨率细节与缓存失效解释。", [
    "虚拟化让阴影只为可见区域分配物理页，在大范围内提供更一致的细节密度。",
    "静态页可缓存，动态对象、光源移动和 WPO 会造成页失效与更新压力。",
    "需要监控页池、缺页、粗糙几何与局部高频更新，并提供传统阴影回退。",
  ]),
  seed("high-upscaling", "high", "rendering", "接入时域超分辨率时，内容与管线需要提供哪些可靠信号？", "考察抖动、运动矢量、Reactive Mask 与动态分辨率。", "把当前低分辨率输入、历史重投影和遮挡重建三部分说明。", [
    "提供正确抖动投影、深度、曝光与每像素 Motion Vector，包含骨骼、WPO 和相机运动。",
    "透明、粒子和发光变化需要 Reactive/Transparency Mask，帮助降低错误历史权重。",
    "验证动态分辨率、镜头切换、细线、遮挡揭露与 UI 合成顺序，并准备画质调试视图。",
  ]),

  // High / Shader
  seed("high-compute", "high", "shader", "哪些任务适合 Compute Shader，哪些不适合？", "考察并行工作负载与数据搬运。", "从任务独立性、数据规模、同步和结果消费者判断。", [
    "规则网格、粒子模拟、前缀求和和图像处理等大规模并行任务通常适合 Compute。",
    "少量数据、强串行依赖或频繁 CPU 读回会让调度和同步成本超过收益。",
    "设计线程组、内存访问与 Barrier，并用 GPU Capture 验证占用率和队列重叠。",
  ]),
  seed("high-divergence", "high", "shader", "GPU Shader 中的动态分支何时会造成线程束发散？", "考察 SIMT 执行模型与分支权衡。", "解释同一 Warp/Wave 内不同路径串行化，再比较分支与无分支计算。", [
    "同一线程束内像素选择不同分支时，硬件可能分别执行两条路径并屏蔽无关线程。",
    "空间一致分支、早期退出或避免昂贵采样仍可能有收益，不能一概删除分支。",
    "结合目标 GPU 编译结果、分支一致性和寄存器压力测量，而不是只看源码。",
  ]),
  seed("high-bindless", "high", "shader", "Bindless 或材质表方案如何帮助大量不同材质的场景？", "考察资源绑定、索引与 GPU 驱动渲染。", "从传统状态切换限制解释统一资源表与实例索引。", [
    "把大量纹理和 Buffer 放入可索引描述符表，实例数据存储材质索引，减少 CPU 绑定切换。",
    "Shader 动态索引资源可支持更大的批次与 GPU Driven 提交。",
    "需要处理平台能力、描述符上限、纹理驻留、非一致索引成本和错误资源保护。",
  ]),
  seed("high-procedural-render", "high", "shader", "如何构建可调试的程序化纹理或距离场材质系统？", "考察复杂数学效果的工程化。", "将生成过程拆成可视化阶段、稳定参数域和缓存策略。", [
    "把坐标、基础形状、组合、域扭曲和最终着色拆成独立函数与 Debug 输出。",
    "对尺度、频率、迭代次数和距离范围设置安全边界，避免 NaN、闪烁与不可控成本。",
    "高频或重复结果考虑烘焙、缓存或低分辨率计算，并为美术提供语义化预设。",
  ]),

  // High / Engine
  seed("high-renderer-extension", "high", "engine", "如何设计一套不会被引擎升级轻易破坏的渲染扩展接口？", "考察模块边界与版本适配。", "把需求限制在公开数据契约和稳定插入点，隔离版本相关实现。", [
    "定义扩展所需的 Buffer、Pass 时机、资源格式和生命周期，避免直接依赖私有内部状态。",
    "使用 Adapter 封装引擎版本差异，核心算法与业务配置保持独立。",
    "建立多版本编译、黄金场景渲染对比和弃用策略，升级前先跑兼容矩阵。",
  ]),
  seed("high-frame-pacing", "high", "engine", "平均帧率达标但操作仍感觉卡顿，如何分析 Frame Pacing？", "考察帧时波动、同步与输入到显示延迟。", "查看连续帧时间线与 Present 链路，而不是只看平均值。", [
    "记录 CPU、GPU、Render Thread、Present 与输入时间戳，寻找周期性峰值和队列积压。",
    "检查 VSync、帧率限制、双/三缓冲、CPU-GPU 同步和后台流送是否造成不均匀帧。",
    "使用 P95/P99、连续坏帧与端到端延迟作为指标，并在真实显示刷新率下测试。",
  ]),
  seed("high-gpu-driven", "high", "engine", "GPU Driven Rendering 的核心数据流是什么？", "考察实例数据、GPU 剔除与间接绘制。", "沿实例上传、GPU 可见性、命令生成和 Indirect Draw 回答。", [
    "CPU 上传紧凑实例与 Bounds，Compute 在 GPU 上完成视锥、遮挡和 LOD 选择。",
    "可见实例被压缩到列表并生成间接绘制参数，减少 CPU 逐对象提交。",
    "需要处理材质分组、Buffer 容量、上一帧深度、调试可见性和不支持平台回退。",
  ]),
  seed("high-pipeline-debug", "high", "engine", "自定义渲染管线出现偶发闪帧，你会怎样定位资源生命周期问题？", "考察 Pass 依赖、同步与瞬态资源调试。", "冻结随机性并捕获坏帧，核对每个资源的创建、写入、Barrier 和释放。", [
    "用帧标记、GPU Capture 与资源命名比较正常帧和异常帧的 Pass 顺序。",
    "检查未初始化资源、读写竞争、格式不匹配、错误别名复用和跨队列同步。",
    "将瞬态资源替换为持久资源或禁用异步做二分，修复后增加验证层与压力回归。",
  ]),

  // High / Performance
  seed("high-regression", "high", "performance", "如何让性能回归定位到具体提交而不是只看到一条下降曲线？", "考察自动化采样、归因与可行动报告。", "用稳定场景、提交元数据和分层指标建立二分与责任闭环。", [
    "锁定设备、构建配置、路线和热机条件，采集 CPU/GPU Pass、内存与内容代理指标。",
    "每次结果关联提交、场景资产和构建差异，阈值触发后自动二分或生成候选变更列表。",
    "报告包含截图、时间线和负责人，支持有期限豁免，修复后自动验证恢复。",
  ]),
  seed("high-thermal", "high", "performance", "移动设备运行十分钟后降频，你如何建立热稳定性能方案？", "考察峰值性能与持续性能的区别。", "同时采集温度、频率、功耗和帧时，设计可持续画质档位。", [
    "在不同环境温度和电量下长时间运行，记录 CPU/GPU 频率、温度、功耗与帧时变化。",
    "降低持续高带宽、全屏像素和常驻高负载，避免只优化短时 Benchmark。",
    "用动态分辨率、帧率档、阴影与特效伸缩逐步降载，并设置恢复迟滞防止档位震荡。",
  ]),
  seed("high-world-streaming", "high", "performance", "开放世界流送如何同时控制内存、IO 和画面 Pop？", "考察预测、优先级与多级表示。", "从玩家轨迹预测开始，说明资源优先级、代理层级和淘汰策略。", [
    "按速度、视线和任务路径预测未来工作集，提前请求关键几何、纹理、碰撞与音频。",
    "先加载低成本代理与低 Mip，再渐进提升；关键任务资产拥有更高优先级和保底驻留。",
    "监控 IO 队列、解压、上传、显存与淘汰抖动，用压力路线验证最坏情况。",
  ]),
  seed("high-async-hitch", "high", "performance", "资源已经异步加载，为什么仍会在主线程产生卡顿？", "考察异步流程中隐藏的同步阶段。", "把读取、解压、反序列化、对象创建、GPU 上传和首次使用逐段计时。", [
    "后台 IO 不代表所有步骤都异步，反序列化、引擎对象注册和依赖解析可能回到主线程。",
    "纹理/Buffer 上传、Shader 首次编译、PSO 创建和同步等待也会形成尖峰。",
    "采用分帧预算、预热、批量上限与可取消任务，并记录每段耗时和队列背压。",
  ]),

  // High / Pipeline
  seed("high-content-cache", "high", "pipeline", "如何设计内容寻址缓存，避免团队重复导入和烘焙同一资产？", "考察确定性构建与缓存键。", "用输入内容、工具版本、配置和依赖共同生成缓存键。", [
    "缓存键必须覆盖源文件哈希、导入器版本、平台配置和所有传递依赖。",
    "构建输出应确定且不可变，命中时直接复用；未命中只重建受影响节点。",
    "建立缓存完整性校验、容量淘汰、命中率监控和故障时安全回退。",
  ]),
  seed("high-distributed-build", "high", "pipeline", "材质、Shader 或资产烘焙如何安全地分布式执行？", "考察任务切分、环境一致性与结果合并。", "把任务变成无共享状态的确定性单元，并固定执行环境。", [
    "按资产或 Variant 切分任务，声明完整输入依赖，避免 Worker 隐式读取本地环境。",
    "容器或版本清单固定工具、插件和驱动；输出带哈希、日志与可重试状态。",
    "调度器处理优先级、重复任务和失败恢复，合并前验证完整性与确定性。",
  ]),
  seed("high-dependency-graph", "high", "pipeline", "大型项目的资产依赖图如何支持影响分析和增量构建？", "考察图模型、变更传播和可视化。", "定义节点与多种边，再从变更节点向下游传播无效状态。", [
    "节点可代表源资产、派生资产、场景与构建产物；边区分硬引用、软引用和生成依赖。",
    "变更时只使受影响子图失效，并根据哈希与配置判断是否真的需要重建。",
    "提供反向引用、关键路径、循环依赖和孤立资产视图，帮助内容团队自助排查。",
  ]),
  seed("high-outsourcing-security", "high", "pipeline", "接收外部或外包资产时，如何建立安全、可审计的导入隔离区？", "考察供应链、验证和发布边界。", "让未知文件先进入隔离环境，完成扫描、转换和审核后才能进入主库。", [
    "限制可接受格式、大小、脚本与嵌入内容，在沙箱中进行恶意文件扫描和解析。",
    "运行项目规范、许可证、命名、依赖与渲染验证，并保留来源、版本和审核日志。",
    "转换生成内部标准资产，原始交付只读保存；失败资产不得绕过门禁直接进入构建。",
  ]),

  // High / Production
  seed("high-ta-ownership", "high", "production", "大型团队中如何划分 TA、图形程序和内容团队的系统所有权？", "考察组织接口与责任边界。", "按决策权、实现责任、使用责任和支持责任建立清晰契约。", [
    "图形底层、艺术工作流和内容质量各有主要 Owner，但共享目标需要联合评审。",
    "为 Shader、工具、预算和故障定义 RACI、升级路径、服务级别与版本策略。",
    "用跨团队路线图和定期指标评审处理交叉领域，避免问题长期落在无人区。",
  ]),
  seed("high-tech-debt", "high", "production", "如何量化并安排技术美术领域的技术债？", "考察长期维护与业务优先级。", "把技术债转成返工、故障、构建时间和机会成本，再与项目风险排序。", [
    "记录重复错误、人工步骤、崩溃、性能超标和版本锁定造成的实际时间损失。",
    "评估影响范围、发生频率、修复成本与里程碑风险，区分立即治理和观察项。",
    "为债务设置 Owner、退出指标和固定偿还容量，修复后验证错误率或耗时下降。",
  ]),
  seed("high-rfc", "high", "production", "跨团队渲染改造为什么需要 RFC？一份有效 RFC 如何推进决策？", "考察复杂变更的共识机制。", "用书面目标、选项和影响让异步评审先收敛，再在会议中只解决分歧。", [
    "RFC 说明背景、目标、非目标、方案、替代项、迁移、预算、风险和未决问题。",
    "提前邀请受影响团队按截止时间留下可追踪意见，作者逐条响应并更新决定。",
    "批准后记录 Decision、Owner 与回滚条件；重大新信息触发修订而非私下改变范围。",
  ]),
  seed("high-hiring-rubric", "high", "production", "如何设计技术美术岗位的面试评价标准，减少只凭感觉打分？", "考察能力模型与结构化评估。", "从岗位实际工作提炼能力维度，为不同职级定义可观察行为。", [
    "区分图形基础、工具管线、调试优化、视觉判断和协作影响力，并设置岗位权重。",
    "每道题关联能力与评分锚点，记录候选人的证据、假设、取舍和验证方法。",
    "面试官独立评分后再校准，持续用入职表现与通过率检查题目有效性和偏差。",
  ]),
];

const stepTitlesByLevel: Record<InterviewLevelKey, [string, string, string]> = {
  low: ["概念", "原理", "检查"],
  mid: ["拆解", "方案", "验证"],
  high: ["目标", "架构", "治理"],
};

const checklistByCategory: Record<InterviewSourceCategoryKey, [string, string, string]> = {
  rendering: ["说明适用的渲染路径", "给出可视化或对比方式", "补充画质与成本边界"],
  shader: ["明确输入输出与坐标空间", "讨论平台或变体限制", "提供调试视图"],
  engine: ["说明接入的 Pass 或系统", "列出依赖资源", "准备回退方案"],
  performance: ["使用毫秒与目标设备数据", "一次只改变一个变量", "复测峰值与回归"],
  pipeline: ["输入输出可追溯", "操作可重跑或回滚", "用自动验证守住规则"],
  production: ["对齐目标与完成标准", "明确 Owner 和风险", "用真实项目结果复盘"],
};

const allExpandedQuestionSeeds: ExpandedQuestionSeed[] = [
  ...expandedQuestionSeeds,
  ...additionalQuestionSeeds,
  ...expansionQuestionSeeds,
];

const expandedInterviewQuestions: InterviewQuestionSource[] = allExpandedQuestionSeeds.map((item) => {
  const titles = stepTitlesByLevel[item.level];
  return {
    id: item.id,
    level: item.level,
    category: item.category,
    question: item.question,
    intent: item.intent,
    method: {
      framework: item.approach,
      steps: item.points.map((detail, index) => ({
        title: titles[index],
        detail,
      })),
      checklist: [...checklistByCategory[item.category]],
    },
  };
});

const applicationByLevelAndCategory: Record<
  InterviewLevelKey,
  Record<InterviewSourceCategoryKey, string>
> = {
  low: {
    rendering: "落到实际项目时，可以选一个最小测试场景，只改变当前讨论的变量，再通过引擎调试视图或帧捕获对照最终画面与中间数据。",
    shader: "落到实际项目时，可以准备一个最小材质球或测试网格，把关键输入逐项可视化，并分别验证默认值、极端值和错误输入。",
    engine: "落到实际项目时，可以沿着资源进入引擎到最终提交的顺序逐段检查，同时记录每一步使用的设置、Pass 与缓冲区状态。",
    performance: "落到实际项目时，应先在目标设备记录 CPU 与 GPU 帧时，再只修改一个变量复测，避免用帧率或主观流畅度代替证据。",
    pipeline: "落到实际项目时，应保留一个符合规范的基准资产，让源文件、导出设置和导入结果都可对照、可复现。",
    production: "落到实际项目时，可以用一次真实协作说明目标如何确认、问题如何记录、方案如何验证，以及最终由谁验收。",
  },
  mid: {
    rendering: "项目化回答时，先用 Debug View、RenderDoc 或对比截图确认问题位于几何、光照、采样还是后处理，再说明质量、显存和 GPU 时间之间的取舍。",
    shader: "项目化回答时，应把效果拆成输入、核心计算、输出与降级路径，在目标平台上检查指令、采样、变体和视觉一致性。",
    engine: "项目化回答时，应指出方案接入哪一个 Pass、依赖哪些资源、怎样与现有系统同步，并准备功能关闭或低规格回退。",
    performance: "项目化回答时，应给出基线、目标设备、瓶颈证据、改动前后毫秒数和副作用；只有复测稳定，优化才算完成。",
    pipeline: "项目化回答时，应把输入、处理、输出、错误提示和回滚方式串成闭环，并用批量资产验证工具不是只对单个样例有效。",
    production: "项目化回答时，应明确视觉目标、技术预算、制作成本和里程碑，再用可比较的方案帮助相关角色做取舍。",
  },
  high: {
    rendering: "系统设计中还要补充跨场景稳定性、平台能力矩阵、资源预算和自动画质验证，让方案不依赖少数专家手工盯图。",
    shader: "系统设计中还要定义材质数据契约、变体与版本策略、调试入口、平台降级和性能门禁，保证复杂效果可长期维护。",
    engine: "系统设计中还要明确 Pass 依赖、资源生命周期、同步边界、扩展接口和兼容策略，并用黄金场景与多版本测试守住升级风险。",
    performance: "系统设计中还要建立自动采样、分位数阈值、提交归因、负责人和回归验证，使性能问题能够被持续发现和关闭。",
    pipeline: "系统设计中还要保证构建确定性、依赖可追溯、失败可恢复、结果可审计，并用命中率、耗时和错误率衡量系统价值。",
    production: "系统设计中还要把决策权、Owner、完成标准、升级路径和复盘指标写入团队机制，避免方案只靠口头共识运行。",
  },
};

const pitfallsByCategory: Record<InterviewSourceCategoryKey, string[]> = {
  rendering: ["只描述最终画面，不解释中间数据如何形成", "忽略色彩空间、采样条件或坐标空间", "只谈画质，不说明 GPU 与显存成本"],
  shader: ["只会复述节点连接，无法说明输入输出", "忽略极端参数、精度与平台差异", "没有调试视图，也没有失效时的回退方式"],
  engine: ["混淆渲染顺序、资源状态与同步关系", "把引擎默认行为当作所有平台的固定规律", "只描述理想流程，不处理生命周期和异常路径"],
  performance: ["用 FPS 代替 CPU/GPU 毫秒数据", "没有确认瓶颈就直接套用优化技巧", "只看平均值，不复测峰值、热稳定与回归"],
  pipeline: ["只修最终结果，不修产生问题的上游规则", "脚本无法重跑、回滚或输出可定位错误", "没有版本、依赖和处理记录，结果不可追溯"],
  production: ["只陈述个人偏好，没有对齐共同目标", "没有明确成本、风险、Owner 与完成标准", "方案交付后不验证采用率和真实项目结果"],
};

const answerTransitions: Record<InterviewLevelKey, [string, string, string]> = {
  low: ["", "进一步说，", "实际判断时，"],
  mid: ["", "具体处理上，", "最后，"],
  high: ["", "系统层面，", "为了让方案长期成立，"],
};

function composeCorrectAnswer(question: InterviewQuestionSource) {
  const transitions = answerTransitions[question.level];

  return question.method.steps
    .map((step, index) => `${transitions[index]}${step.detail}`)
    .join("");
}

const shadowTopicPattern = /shadow|阴影|csm|级联|bias|vsm|lightmap-seams|virtual-shadow/i;
const lightingTopicPattern = /pbr|brdf|fresnel|lighting|light-|lightmap|light probe|reflection probe|gi\b|lumen|atmosphere|曝光|光照|灯光|探针|大气散射|皮肤|头发|water|ocean/i;
const graphicsTopicPattern = /normal-map|\buv\b|texture-filter|derivative|cubemap|coordinate|perspective|depth-buffer|linear-workflow|hdr-ldr|vertex-color|channel-mask|time-animation|compute|wave-|numerical|branch|数学|向量|矩阵|坐标|采样|插值|深度缓冲/i;
const toolTopicPattern = /tool|validator|plugin|dependency|cache|build|schema|farm|provenance|repro|thumbnail|batch|automation|自动|工具|检查器|依赖图|缓存|构建|迁移|缩略图|排错|调试/i;

function classifyQuestion(question: InterviewQuestionSource): InterviewCategoryKey {
  const topic = `${question.id} ${question.question}`;

  if (shadowTopicPattern.test(topic)) return "shadows";
  if (question.category === "performance") return "performance";
  if (question.category === "production") return "communication";

  if (question.category === "pipeline") {
    if (question.id.includes("-asset-")) return "asset_pipeline";
    return toolTopicPattern.test(topic) ? "tools_debug" : "asset_pipeline";
  }

  if (question.category === "engine") {
    if (lightingTopicPattern.test(topic)) return "lighting";
    return "ue_pipeline";
  }

  if (question.category === "shader") {
    return graphicsTopicPattern.test(topic) ? "graphics" : "ue_material";
  }

  if (lightingTopicPattern.test(topic)) return "lighting";
  return "graphics";
}

function completeReference(question: InterviewQuestionSource): InterviewQuestion {
  return {
    ...question,
    category: classifyQuestion(question),
    method: {
      ...question.method,
      reference: {
        correctAnswer: composeCorrectAnswer(question),
        paragraphs: question.method.steps.map((step) => step.detail),
        application: applicationByLevelAndCategory[question.level][question.category],
        pitfalls: pitfallsByCategory[question.category],
      },
    },
  };
}

const ueTaExcludedQuestionIds = new Set([
  // Low: duplicated or unusually niche for a general UE TA interview.
  "low-perspective-interpolation",
  "low-skybox",
  "low-profiler-warmup",
  "low-file-version",
  "low-shadow-translucency",
  "low-asset-udim",
  "low-tool-assert",
  "low-actionable-bug-report",

  // Mid: specialist rendering/programming topics or duplicated pipeline coverage.
  "mid-reversed-z",
  "mid-volumetric-fog",
  "mid-skin-hair",
  "mid-portal-camera",
  "mid-streaming-priority",
  "mid-thumbnail",
  "mid-shadow-vsm",
  "mid-shadow-pcss",
  "mid-asset-animation-compress",
  "mid-quaternion",
  "mid-barycentric",
  "mid-asset-dependency",

  // High: graphics-programmer, platform-infrastructure, or organization-leadership depth.
  "high-atmosphere",
  "high-ocean",
  "high-shader-compiler",
  "high-compute-scheduling",
  "high-wave-ops",
  "high-render-graph-schedule",
  "high-xr-multiview",
  "high-residency",
  "high-frame-debugger",
  "high-deterministic-replay",
  "high-player-telemetry",
  "high-performance-lab",
  "high-bottleneck-model",
  "high-render-farm",
  "high-provenance",
  "high-repro-build",
  "high-mentoring",
  "high-render-incident",
  "high-deprecation",
  "high-ta-roadmap",
  "high-light-clustering",
  "high-light-gi-denoise",
  "high-light-hdr-calibration",
  "high-light-volumetric",
  "high-light-validation",
  "high-shadow-denoise",
  "high-shadow-hair",
  "high-shadow-temporal",
  "high-ue-custom-shading",
  "high-sampling-distribution",
  "high-asset-usd-layer",
  "high-asset-outsourcing",
  "high-asset-build-graph",
  "high-tool-telemetry",
  "high-tool-debug-platform",
  "high-bindless",
  "high-renderer-extension",
  "high-gpu-driven",
  "high-pipeline-debug",
  "high-content-cache",
  "high-distributed-build",
  "high-outsourcing-security",
  "high-ta-ownership",
  "high-tech-debt",
  "high-rfc",
  "high-hiring-rubric",
  "high-hybrid-rt",
  "high-thermal",
]);

export const interviewQuestions: InterviewQuestion[] = [
  ...coreInterviewQuestions,
  ...expandedInterviewQuestions,
]
  .filter((question) => !ueTaExcludedQuestionIds.has(question.id))
  .map(completeReference);

export function getQuestionsByLevel(level: InterviewLevelKey) {
  return interviewQuestions.filter((question) => question.level === level);
}

export function getInterviewCategory(key: InterviewCategoryKey) {
  return interviewCategories.find((category) => category.key === key);
}
