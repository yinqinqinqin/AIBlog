# Articles

这个目录是博客文章的唯一源目录。以后新增或修改文章，只改这里的 Markdown 文件。

目录规则：

```text
articles/
├── learning-notes/
│   ├── ErrorNote/
│   ├── Interview/
│   ├── KeyWordAndNode/
│   ├── RenderTheory/
│   │   └── RenderPipe/
│   ├── UE编辑器插件C++/
│   └── 性能优化/
└── portfolio/
    └── Technical Documentation for Portfolio/
```

文章文件需要保留 frontmatter：

```md
---
title: 文章标题
category: learning-notes
date: 2026-08-27
readTime: 5 min read
excerpt: 卡片摘要
tags: [标签1, 标签2]
cover: ""
pinned: true
pinnedOrder: 1
---
```

字段说明：

- `category`: 只能是 `learning-notes` 或 `portfolio`。
- `slug`: 由文件名决定，例如 `sky-system.md` 的 slug 是 `sky-system`。
- `cover`: 留空时会自动使用文字封面。
- `pinned` / `pinnedOrder`: 控制首页置顶轮播。

部署流程：

```bash
npm run deploy:oss
```

`deploy:oss` 会自动执行：

1. 从 `articles/` 生成 `src/data/generated/articles.ts`
2. 构建 `dist/`
3. 上传 `dist/` 到 OSS 网站根目录
4. 上传 `articles/learning-notes` 和 `articles/portfolio` 到 `blog-content/articles/`
5. 刷新 CDN

`articles/` 会提交到 Git，不会进入 `dist/` 打包产物。线上文章详情页会通过 `markdownUrl` 从 OSS 读取 Markdown 正文。
