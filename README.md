# TA Journal Blog

Personal technical art blog built with React, TypeScript, and Vite.

## OSS deployment

Production site and remote article content are deployed to Alibaba Cloud OSS.

```text
Bucket: yin-qin
Endpoint: yin-qin.oss-cn-shanghai.aliyuncs.com
CDN domain: https://oss.an-hao.top/
Article prefix: https://oss.an-hao.top/blog-content/articles/
```

Sensitive AccessKey values must stay in local `.env.oss`; do not commit them or write them into README.
For this machine, the private reference file is `DEPLOY_SECRETS.local.md`, which is also ignored by Git.

## Local OSS env

Create `.env.oss` from the example and fill in the real AccessKey values:

```bash
cp .env.oss.example .env.oss
```

`.env.oss` is ignored by Git.

## Full deploy

Use this when frontend code changes, when article frontmatter changes, or when adding/removing/renaming articles.

```bash
set -a
source .env.oss
set +a
npm run deploy:oss
```

This builds the site, uploads `dist/`, uploads Markdown articles under `blog-content/articles/`, and submits a CDN refresh.

## Update existing article body only

Use this when only the Markdown body changes and the article filename/frontmatter stays the same.

```bash
set -a
source .env.oss
set +a
npm run sync:articles
```

Article pages fetch Markdown from OSS at runtime, so existing article body edits take effect after OSS/CDN propagation and a page refresh.

## Article workflow

- Edit article source files in `articles/`.
- Do not edit `src/data/generated/articles.ts` by hand.
- Existing article body update: run `npm run sync:articles`.
- New article or card metadata update: run `npm run deploy:oss`.
