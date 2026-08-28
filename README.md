# TA Journal Blog

这是一个技术美术个人博客项目。项目用 React + TypeScript + Vite 构建，文章内容用 Markdown 管理，线上部署到阿里云 OSS，并通过 `https://oss.an-hao.top/` 访问。

以后日常写文章时，主要只需要修改 `articles/` 目录下的 `.md` 文件。

## 项目结构

```text
Blog/
├── articles/                         # 文章源文件，只在这里写 Markdown
│   ├── learning-notes/               # 学习记录分类
│   └── portfolio/                    # 作品集分类
├── public/                           # 静态资源：图片、字体、模型、视频等
│   └── assets/article-images/        # 文章图片建议放这里
├── scripts/
│   ├── generate-articles.mjs         # 从 articles/ 生成文章索引
│   ├── deploy-oss.mjs                # 构建并部署整个网站到 OSS
│   └── sync-articles-oss.mjs         # 只同步文章 Markdown 到 OSS
├── src/
│   ├── components/                   # 页面组件
│   ├── pages/                        # 路由页面
│   ├── data/blog.ts                  # 站点导航、分类、关于页等配置
│   └── data/generated/articles.ts    # 自动生成，不要手动修改
├── .env.oss.example                  # OSS 环境变量示例
├── package.json                      # 命令和依赖
└── README.md                         # 当前维护说明
```

## 技术栈和依赖

主要运行依赖：

- `react` / `react-dom`: 页面框架
- `react-router-dom`: 路由
- `motion`: 动画
- `three` / `ogl` / `postprocessing`: 3D、粒子和视觉效果
- `markdown-it` 及插件：Markdown 文章渲染
- `highlight.js`: 代码高亮
- `lucide-react`: 图标
- `zustand`: 局部状态管理

部署相关依赖：

- `ali-oss`: 上传文件到 OSS
- `@alicloud/pop-core`: 刷新 CDN

安装依赖：

```bash
npm install
```

## 常用命令

```bash
npm run dev
```

本地开发预览。启动前会自动执行 `generate:articles`。

```bash
npm run build
```

生产构建。会先从 `articles/` 生成 `src/data/generated/articles.ts`，再输出到 `dist/`。

```bash
npm run generate:articles
```

只重新生成文章索引。新增、删除、重命名文章或修改 frontmatter 后可单独运行。

```bash
npm run deploy:oss
```

完整部署：构建网站、上传 `dist/`、上传 Markdown 文章、刷新 CDN。

```bash
npm run sync:articles
```

只同步文章 Markdown。适合只改正文、不改标题/摘要/标签/日期/文件名时使用。

## 文章发布流程

### 1. 新建文章

只在这两个目录下新建 Markdown：

```text
articles/learning-notes/
articles/portfolio/
```

文件名就是文章 slug，例如：

```text
articles/learning-notes/RenderTheory/render-theory-pbr.md
```

对应文章地址会使用：

```text
/article/render-theory-pbr
```

注意：不同目录下也不要使用重复文件名，因为 slug 只取文件名。

### 2. 写 frontmatter

每篇文章顶部保留这段元信息：

```md
---
title: 文章标题
category: learning-notes
date: 2026-08-28
readTime: 5 min read
excerpt: 这里写文章卡片摘要。
tags: [标签1, 标签2]
cover: ""
pinned: false
pinnedOrder: 0
---
```

字段说明：

- `title`: 文章标题，会显示在卡片和文章页。
- `category`: 只能是 `learning-notes` 或 `portfolio`。
- `date`: 文章日期，建议 `YYYY-MM-DD`。
- `readTime`: 阅读时间文案。
- `excerpt`: 卡片摘要和文章头部摘要。
- `tags`: 标签数组，用英文逗号分隔。
- `cover`: 封面图片地址；留空会自动生成文字封面。
- `pinned`: 是否显示到首页置顶轮播。
- `pinnedOrder`: 置顶排序，数字越小越靠前。

### 3. 写正文

正文直接写 Markdown：

```md
# 3. 基础材质制作步骤

## 3.1 获取贴图通道和材质ID

**BaseColor**

- RGB: BaseColor
- A: Shadow / Emissive
```

文章页外层已经有页面标题，所以 Markdown 渲染时会自动把正文标题降一级：

- Markdown `#` 会显示成正文一级标题
- Markdown `##` 会显示成正文二级标题
- Markdown `###` 会显示成正文三级标题

不要为了适配页面手动把所有标题降级，正常按文章结构写即可。

### 4. 插入图片

文章图片建议放到：

```text
public/assets/article-images/
```

Markdown 中使用站点绝对路径：

```md
![图片说明](/assets/article-images/example.png)
```

也可以使用相对路径，但更推荐用 `/assets/...`，迁移和部署更稳定。

## 本地预览

修改文章后运行：

```bash
npm run dev
```

浏览器打开终端显示的本地地址，一般是：

```text
http://localhost:5173/
```

如果新增文章、改文件名或改 frontmatter，开发服务启动前会自动生成索引；也可以手动运行：

```bash
npm run generate:articles
```

## Git 上传流程

常规提交流程：

```bash
git status
npm run build
git add -A
git commit -m "Update articles"
git push origin main
```

建议：

- 只改文章正文时，commit message 可以写 `Update article content`。
- 改 UI、组件或部署脚本时，先确认 `npm run build` 通过再提交。
- 不要提交 `.env.oss`、AccessKey、临时文件、`dist/`。

## OSS 部署配置

线上目标：

```text
Bucket: yin-qin
Endpoint: oss-cn-shanghai.aliyuncs.com
CDN: https://oss.an-hao.top/
Article prefix: https://oss.an-hao.top/blog-content/articles/
```

本地需要创建 `.env.oss`：

```bash
cp .env.oss.example .env.oss
```

然后填写：

```bash
ALI_OSS_ACCESS_KEY_ID=your_access_key_id
ALI_OSS_ACCESS_KEY_SECRET=your_access_key_secret

ALI_OSS_BUCKET=yin-qin
ALI_OSS_REGION=oss-cn-shanghai
ALI_OSS_ENDPOINT=oss-cn-shanghai.aliyuncs.com
ALI_CDN_DOMAIN=oss.an-hao.top
ALI_OSS_PREFIX=

BLOG_ARTICLES_DIR=articles
BLOG_ARTICLES_PREFIX=blog-content/articles
BLOG_ARTICLE_BASE_URL=https://oss.an-hao.top/blog-content/articles/
BLOG_UPLOAD_ARTICLES=true
ALI_CDN_REFRESH=true
```

`.env.oss` 已被 `.gitignore` 忽略，不要把真实 AccessKey 写进 README、代码或提交记录。

## 部署到 OSS

完整部署，用于以下情况：

- 修改了前端 UI、组件、CSS、路由、站点配置。
- 新增、删除、重命名文章。
- 修改文章 frontmatter，例如 `title`、`date`、`excerpt`、`tags`、`cover`、`pinned`。

命令：

```bash
set -a
source .env.oss
set +a
npm run deploy:oss
```

这个命令会自动执行：

1. `npm run build`
2. 上传 `dist/` 到 OSS 根目录
3. 上传 `articles/learning-notes` 和 `articles/portfolio` 到 `blog-content/articles/`
4. 刷新 CDN 目录缓存

部署完成后访问：

```text
https://oss.an-hao.top/
```

## 只更新文章正文

如果只修改已有 Markdown 的正文，不改以下内容：

- 文件名
- 所在分类目录
- `title`
- `date`
- `readTime`
- `excerpt`
- `tags`
- `cover`
- `pinned`
- `pinnedOrder`

可以不重新构建前端，只同步文章：

```bash
set -a
source .env.oss
set +a
npm run sync:articles
```

文章详情页会在运行时从 OSS 读取 Markdown，所以正文更新后，等 OSS/CDN 生效并刷新页面即可看到新内容。

## 哪些地方可以手动改

日常写文章：

- `articles/learning-notes/**/*.md`
- `articles/portfolio/**/*.md`
- `public/assets/article-images/*`

站点文字和分类：

- `src/data/blog.ts`

页面和组件：

- `src/pages/*`
- `src/components/*`
- `src/index.css`

部署脚本：

- `scripts/deploy-oss.mjs`
- `scripts/sync-articles-oss.mjs`
- `scripts/generate-articles.mjs`

## 哪些地方不要手动改

不要手动修改：

- `src/data/generated/articles.ts`
- `dist/`
- `node_modules/`
- `package-lock.json`，除非你确实改了依赖
- `.env.oss`

`src/data/generated/articles.ts` 是自动生成文件。每次运行 `npm run generate:articles`、`npm run build` 或 `npm run deploy:oss` 都会覆盖它。

## 改文章后的推荐操作

只改正文：

```bash
npm run sync:articles
```

新增文章或改卡片信息：

```bash
npm run build
npm run deploy:oss
```

需要同步 Git：

```bash
git status
git add -A
git commit -m "Update blog articles"
git push origin main
```

## 常见问题

### 文章没有出现在列表里

检查：

- 文件是否放在 `articles/learning-notes` 或 `articles/portfolio` 下。
- 文件扩展名是否是 `.md`。
- 是否运行了 `npm run generate:articles` 或 `npm run build`。
- `category` 是否是 `learning-notes` 或 `portfolio`。

### 文章正文更新了但线上没变

如果只改正文，运行：

```bash
npm run sync:articles
```

如果仍没变，可能是 CDN 缓存还没刷新完成，稍等后强制刷新页面。

### 新文章线上打不开

新文章需要完整部署：

```bash
npm run deploy:oss
```

只同步文章不会更新前端文章索引。

### OSS 部署提示缺少 AccessKey

说明当前终端没有加载 `.env.oss`：

```bash
set -a
source .env.oss
set +a
```

然后重新执行部署命令。

### OSS 提示 UserDisable

通常是阿里云 AccessKey 被禁用。需要去阿里云控制台重新启用或更换 AccessKey。

## 最简日常流程

以后写文章可以按这个流程：

```bash
# 1. 修改或新增 articles/ 下的 Markdown

# 2. 本地预览
npm run dev

# 3. 新文章或改了 frontmatter 时
npm run build

# 4. 提交 Git
git add -A
git commit -m "Update blog articles"
git push origin main

# 5. 部署
set -a
source .env.oss
set +a
npm run deploy:oss
```

如果只是改已有文章正文，第 3 步和完整部署可以换成：

```bash
set -a
source .env.oss
set +a
npm run sync:articles
```
