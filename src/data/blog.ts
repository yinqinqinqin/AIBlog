export type CategoryKey = "learning-notes" | "portfolio" | "study-plan" | "tools";

export type NavItem = {
  label: string;
  href: string;
};

export type AboutProfile = {
  title: string;
  intro: string[];
  stats: Array<{
    value: string;
    label: string;
  }>;
  focuses: Array<{
    title: string;
    description: string;
  }>;
  contacts: Array<{
    label: string;
    value: string;
  }>;
};

export type Category = {
  key: CategoryKey;
  label: string;
  description: string;
  anchor: string;
  href: string;
};

export type Article = {
  slug: string;
  title: string;
  category: CategoryKey;
  date: string;
  readTime: string;
  excerpt: string;
  tags: string[];
  cover: string;
  content: string[];
};

export type StudyPlanTrack = {
  id: string;
  title: string;
  summary: string;
  focus: string[];
  target: string;
};

export type StudyPlanTask = {
  id: string;
  label: string;
};

export type StudyPlanPhase = {
  id: string;
  phase: string;
  duration: string;
  goal: string;
  milestones: StudyPlanTask[];
};

export type StudyPlanRoutine = {
  id: string;
  label: string;
  detail: string;
};

export type StudyPlanSystem = {
  title: string;
  summary: string;
  principles: string[];
  tracks: StudyPlanTrack[];
  phases: StudyPlanPhase[];
  routines: StudyPlanRoutine[];
};

export const siteMeta = {
  brand: "TA JOURNAL",
  title: "Technical\nArtist",
  heroTitleHref: "/about",
  summary:
    "Take a vacation on the wild side with Foundry Adventure Tours and never look at life the same.",
  heroVideo: "/media/hero-grid.mp4",
  heroPoster:
    "https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=cinematic%20futuristic%20editorial%20technology%20grid%2C%20dark%20luxury%20atmosphere%2C%20cyan%20glow%2C%20high-end%20minimal%20digital%20background&image_size=landscape_16_9",
};

export const navItems: NavItem[] = [
  { label: "首页", href: "/" },
  { label: "学习记录", href: "/category/learning-notes" },
  { label: "作品集", href: "/category/portfolio" },
  { label: "学习计划", href: "/category/study-plan" },
  { label: "工具", href: "/category/tools" },
  { label: "关于", href: "/about" },
];

export const aboutProfile: AboutProfile = {
  title: "技术美术是我连接视觉表达与实时实现的工作方式。",
  intro: [
    "我目前以技术美术为核心身份，关注实时渲染、材质表现、视觉叙事和内容实现之间的关系。相比只强调工具熟练度，我更在意一套视觉目标如何被稳定地拆解、验证并最终落地。",
    "这个“关于”页面主要承载我对自己的介绍：我在做什么、我擅长什么、我为什么会持续写这些学习记录与作品整理。它不是简历替代品，而是让人快速理解我工作方法的一页。",
    "我希望长期把这里建设成一个兼顾博客、作品沉淀和方法论记录的个人站点。"
  ],
  stats: [
    { value: "7 年", label: "视觉与实时内容相关经验" },
    { value: "3 条", label: "长期能力建设主线" },
    { value: "30+", label: "持续积累的实验与项目条目" },
  ],
  focuses: [
    {
      title: "实时视觉表达",
      description: "关注材质、灯光、特效和场景氛围在实时环境中的可读性与表现稳定性。",
    },
    {
      title: "技术与审美对齐",
      description: "在实现约束内保持画面质感，不把技术方案和视觉判断割裂开来。",
    },
    {
      title: "知识沉淀",
      description: "通过博客把学习过程、试错路径和方法论整理成可复用内容，而不是只保留结果。",
    },
  ],
  contacts: [
    { label: "身份", value: "技术美术 / 视觉表达 / 实时内容方向" },
    { label: "邮箱", value: "hello@tajournal.design" },
    { label: "地点", value: "可远程协作，也可进入项目制合作" },
  ],
};

export const categories: Category[] = [
  {
    key: "learning-notes",
    label: "学习记录",
    description: "记录工具链、材质、渲染、管线和实时内容制作过程中的方法与问题。",
    anchor: "learning-notes",
    href: "/category/learning-notes",
  },
  {
    key: "portfolio",
    label: "作品集",
    description: "整理偏结果导向的视觉实验、关卡场景、交互展示和技术验证项目。",
    anchor: "portfolio",
    href: "/category/portfolio",
  },
  {
    key: "study-plan",
    label: "学习计划",
    description: "把长期能力建设拆成阶段计划、里程碑与可执行清单。",
    anchor: "study-plan",
    href: "/category/study-plan",
  },
];

export const categoryPages: Category[] = [
  ...categories,
  {
    key: "tools",
    label: "工具",
    description: "整理常用工具、插件、工作流脚本与效率向资产，作为独立分类页持续归档。",
    anchor: "tools",
    href: "/category/tools",
  },
];

export const categoryLabelMap: Record<CategoryKey, string> = {
  "learning-notes": "学习记录",
  portfolio: "作品集",
  "study-plan": "学习计划",
  tools: "工具",
};

export const studyPlanSystem: StudyPlanSystem = {
  title: "把学习计划做成一套持续运转的能力系统，而不是只写方向。",
  summary:
    "学习计划页不再只是记录两篇计划文章，而是把长期目标拆成主线、阶段、里程碑和固定执行节奏，让内容沉淀、能力补齐和可展示成果同步推进。",
  principles: [
    "计划必须对应可验证输出，而不是停留在兴趣方向。",
    "每条主线都要同时覆盖输入、实验、复盘和归档。",
    "阶段目标服务长期能力，不被短期热点牵着走。",
  ],
  tracks: [
    {
      id: "rendering",
      title: "实时材质与渲染",
      summary: "补足材质观察、Shader 拆解和实时表现控制能力。",
      focus: ["每月完成 1 个可复现材质实验", "输出结构化拆解笔记", "沉淀可复用节点与参数模板"],
      target: "把“会做效果”升级成“能解释、能复现、能迁移”。",
    },
    {
      id: "pipeline",
      title: "工具链与流程化",
      summary: "把重复操作沉淀成工具、模板和工作流脚本。",
      focus: ["梳理高频操作链路", "建立命名/归档规范", "逐步补足脚本化和半自动化能力"],
      target: "减少重复劳动，把精力留给判断与质量控制。",
    },
    {
      id: "presentation",
      title: "视觉表达与展示",
      summary: "把实验结果转成能被理解、能被评估的展示内容。",
      focus: ["为实验补完整过程说明", "统一作品展示结构", "持续优化个人站点的信息组织"],
      target: "让输出同时具备审美、逻辑和说服力。",
    },
  ],
  phases: [
    {
      id: "foundation",
      phase: "Phase 01 / 建结构",
      duration: "4 周",
      goal: "完成能力地图、归档规范和每周执行模版。",
      milestones: [
        { id: "define-tracks", label: "确定三条长期主线" },
        { id: "archive-rules", label: "补齐目录和命名规范" },
        { id: "weekly-template", label: "建立每周复盘模版" },
      ],
    },
    {
      id: "validation",
      phase: "Phase 02 / 做验证",
      duration: "8 周",
      goal: "围绕主线持续产出实验、工具和展示页面。",
      milestones: [
        { id: "material-experiments", label: "完成 3 个材质/特效实验" },
        { id: "workflow-script", label: "完成 1 组流程化脚本" },
        { id: "site-refresh", label: "完成 1 次作品展示重构" },
      ],
    },
    {
      id: "closure",
      phase: "Phase 03 / 做收束",
      duration: "4 周",
      goal: "把阶段结果沉淀成可复用方法论与归档资产。",
      milestones: [
        { id: "phase-summary", label: "形成阶段总结文档" },
        { id: "portfolio-update", label: "更新个人站点展示" },
        { id: "next-backlog", label: "保留下一阶段问题清单" },
      ],
    },
  ],
  routines: [
    { id: "weekly-input", label: "每周输入", detail: "集中补一个关键知识点，并记录可迁移的变量和结论。" },
    { id: "weekly-experiment", label: "每周实验", detail: "至少完成一个最小验证，不做只停留在阅读阶段的计划。" },
    { id: "weekly-archive", label: "每周归档", detail: "把实验、截图、参数、结论归档到统一结构，避免知识再次散落。" },
    { id: "monthly-review", label: "每月复盘", detail: "检查主线是否偏科，决定下个月是补基础、做输出还是修流程。" },
  ],
};

export const articles: Article[] = [
  {
    slug: "shader-observation-log",
    title: "从材质观察到 Shader 拆解：一套可复用的学习笔记方法",
    category: "learning-notes",
    date: "2026.06.25",
    readTime: "8 分钟",
    excerpt:
      "把零散的 Shader 学习从“看懂节点”改成“观察现象、拆变量、复写效果”的记录流程，提升知识沉淀质量。",
    tags: ["Shader", "学习方法", "实时渲染"],
    cover:
      "https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=technical%20artist%20shader%20study%20notes%2C%20dark%20interface%2C%20cyan%20diagrams%2C%20premium%20editorial%20layout%2C%20realistic%20digital%20design&image_size=landscape_16_9",
    content: [
      "很多 Shader 学习停留在抄案例或记节点，这样很难迁移到真实项目里。我更偏向把每次学习拆成三层：现象观察、变量拆解、最小复现。",
      "现象观察阶段，只记录我肉眼看到的结果，例如高光边缘、流动速度、噪声频率和混合方式。变量拆解阶段，再去判断这些结果分别可能对应哪些数学关系和贴图输入。",
      "当我用一套最小工程把效果复现出来后，才会把它归档成真正有价值的学习记录，因为它已经从“看懂”变成“可解释、可重建、可调整”的知识。"
    ],
  },
  {
    slug: "vfx-breakdown-for-portfolio",
    title: "一个实时 VFX 作品集页应该展示什么，不应该展示什么",
    category: "portfolio",
    date: "2026.06.18",
    readTime: "6 分钟",
    excerpt:
      "作品集不是把截图堆满页面，而是要让人快速看懂你的判断、目标、取舍和落地能力。",
    tags: ["作品集", "VFX", "展示逻辑"],
    cover:
      "https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=real-time%20VFX%20portfolio%20presentation%2C%20dark%20luxury%20editorial%20design%2C%20technical%20artist%20showcase%2C%20sleek%20cyan%20lighting&image_size=landscape_16_9",
    content: [
      "很多作品集只展示最终画面，但招聘方和合作方更关心的是你如何把目标拆解成可执行方案。过程说明不是配角，而是判断你是否具备稳定交付能力的关键。",
      "我会优先展示项目目标、技术限制、材质策略、性能约束和最终结果之间的关系，而不是只堆更多渲染图。这样页面信息密度更高，也更像真实工作场景。",
      "如果一页作品集能让人看到你的审美、分析和执行链条，它才真正发挥了价值。"
    ],
  },
  {
    slug: "quarter-study-roadmap",
    title: "下一阶段技术美术学习计划：材质、工具链与实时内容表达",
    category: "study-plan",
    date: "2026.06.12",
    readTime: "5 分钟",
    excerpt:
      "把接下来三个月要推进的能力拆成三条线：实时材质、内容工具化和视觉表达稳定性。",
    tags: ["学习计划", "路线图", "TA"],
    cover:
      "https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=real-time%20VFX%20portfolio%20presentation%2C%20dark%20luxury%20editorial%20design%2C%20technical%20artist%20showcase%2C%20sleek%20cyan%20lighting&image_size=landscape_16_9",
    content: [
      "学习计划如果只写方向，很容易失效。我现在会把计划拆成每周可验证的目标，比如一个材质实验、一个工具练习、一次展示页整理。",
      "材质能力决定我对画面细节的掌控，工具链能力决定效率，视觉表达则决定成果是否真的能被理解。三条线必须同时推进。",
      "基础版本里先把这类计划作为博客分类内容展示，后续可以扩展成更完整的归档系统。"
    ],
  },
  {
    slug: "niagara-lightning-test",
    title: "Niagara 电弧效果测试：从参考拆解到性能控制",
    category: "learning-notes",
    date: "2026.06.07",
    readTime: "7 分钟",
    excerpt:
      "一次关于电弧特效的拆解实验，重点记录参考归纳、层次拆分和实时性能限制下的取舍。",
    tags: ["Niagara", "VFX", "性能"],
    cover:
      "https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=unreal%20engine%20niagara%20lightning%20effect%20study%2C%20dark%20technology%20scene%2C%20blue%20electric%20arcs%2C%20premium%20editorial%20look&image_size=landscape_16_9",
    content: [
      "做电弧类效果时，最容易失控的是细节层太多导致画面吵闹。我把电弧拆成主体形态、噪声扰动和瞬时闪烁三层，先让主体可读，再加细节。",
      "另一部分是性能控制。很多好看的电弧效果一旦进入真实场景就会成本过高，所以我更关注粒子数量、贴图复用和发光范围。",
      "这类文章更像学习记录和项目备忘的结合体。"
    ],
  },
  {
    slug: "scene-breakdown-terminal-bay",
    title: "作品集整理：终端机库场景的灯光、材质与叙事关系",
    category: "portfolio",
    date: "2026.05.30",
    readTime: "9 分钟",
    excerpt:
      "记录一个科幻终端机库场景在材质统一、光色节奏和信息焦点上的设计思路。",
    tags: ["场景", "灯光", "作品集"],
    cover:
      "https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=futuristic%20hangar%20environment%20breakdown%2C%20dark%20luxury%20lighting%2C%20technical%20artist%20portfolio%20scene%2C%20cyan%20accents&image_size=landscape_16_9",
    content: [
      "这个场景的关键不是资产数量，而是如何让信息焦点落在观众最先看到的位置。灯光和材质必须服务叙事，而不是各自炫技。",
      "我用较克制的色彩关系去控制整体稳定性，把高亮只留给少数节点，这样更容易形成高级感。",
      "整理成博客文章后，它比单独一张图更能说明这个项目的价值。"
    ],
  },
  {
    slug: "yearly-learning-structure",
    title: "年度学习结构草案：避免只学热点，不补基础",
    category: "study-plan",
    date: "2026.05.22",
    readTime: "4 分钟",
    excerpt:
      "给自己制定一套技术美术年度学习结构，让短期热点工具和长期基础能力保持平衡。",
    tags: ["年度规划", "基础能力", "学习系统"],
    cover:
      "https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=futuristic%20hangar%20environment%20breakdown%2C%20dark%20luxury%20lighting%2C%20technical%20artist%20portfolio%20scene%2C%20cyan%20accents&image_size=landscape_16_9",
    content: [
      "学太多热点工具容易失去结构感，学太多基础又容易短期看不到成果，所以年度计划里必须同时安排输出和补课。",
      "我会把目标拆成基础原理、工具实践和可展示成果三个层级，用月度回顾去判断偏科问题。",
      "这类计划文会帮助我把博客从展示页慢慢变成真正持续积累的系统。"
    ],
  },
];

export const featuredSlugs = [
  "shader-observation-log",
  "scene-breakdown-terminal-bay",
  "quarter-study-roadmap",
];

export function getFeaturedArticles() {
  return featuredSlugs
    .map((slug) => articles.find((article) => article.slug === slug))
    .filter(Boolean) as Article[];
}

export function getArticlesByCategory(category: CategoryKey) {
  return articles.filter((article) => article.category === category);
}

export function getArticleBySlug(slug?: string) {
  return articles.find((article) => article.slug === slug);
}

export function getCategoryByKey(key: CategoryKey) {
  return categoryPages.find((category) => category.key === key);
}

export function isCategoryKey(value?: string): value is CategoryKey {
  return value === "learning-notes" || value === "portfolio" || value === "study-plan" || value === "tools";
}
