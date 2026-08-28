import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import OSS from "ali-oss";
import Core from "@alicloud/pop-core";

const config = {
  accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET,
  bucket: process.env.ALI_OSS_BUCKET || "yin-qin",
  region: process.env.ALI_OSS_REGION || "oss-cn-shanghai",
  endpoint: process.env.ALI_OSS_ENDPOINT || "oss-cn-shanghai.aliyuncs.com",
  cdnDomain: process.env.ALI_CDN_DOMAIN || "oss.an-hao.top",
  articlesDir: path.resolve(process.env.BLOG_ARTICLES_DIR || "articles"),
  articlesPrefix: normalizePrefix(process.env.BLOG_ARTICLES_PREFIX || "blog-content/articles"),
  refreshCdn: process.env.ALI_CDN_REFRESH !== "false",
};

const contentTypes = new Map([
  [".md", "text/markdown; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
]);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("Article sync failed:", error?.data?.Message || error?.message || error);
    process.exit(1);
  });
}

async function main() {
  validateConfig();

  const articleFiles = ["learning-notes", "portfolio"]
    .flatMap((category) => walk(path.join(config.articlesDir, category)))
    .filter((file) => !file.endsWith(".map"));

  const client = new OSS({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    bucket: config.bucket,
    endpoint: config.endpoint,
    region: config.region,
    secure: true,
    timeout: 120000,
  });

  console.log(`Uploading ${articleFiles.length} article files to oss://${config.bucket}/${config.articlesPrefix}`);

  let uploaded = 0;
  for (const file of articleFiles) {
    const relativePath = path.relative(config.articlesDir, file).split(path.sep).join("/");
    const objectKey = `${config.articlesPrefix}${relativePath}`;
    const ext = path.extname(file).toLowerCase();

    await client.put(objectKey, file, {
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": contentTypes.get(ext) || "application/octet-stream",
      },
    });

    uploaded += 1;
    if (uploaded % 10 === 0 || uploaded === articleFiles.length) {
      console.log(`Uploaded article files ${uploaded}/${articleFiles.length}`);
    }
  }

  if (config.refreshCdn && config.cdnDomain) {
    await refreshArticleCdn();
  }

  console.log(`Articles synced: https://${config.cdnDomain}/${config.articlesPrefix}`);
}

function validateConfig() {
  if (!config.accessKeyId || !config.accessKeySecret) {
    throw new Error(
      "Missing ALI_OSS_ACCESS_KEY_ID or ALI_OSS_ACCESS_KEY_SECRET environment variable.",
    );
  }

  if (!fs.existsSync(config.articlesDir)) {
    throw new Error(`Article directory not found: ${config.articlesDir}`);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function normalizePrefix(prefix) {
  if (!prefix) return "";
  return prefix.replace(/^\/+/, "").replace(/\/?$/, "/");
}

async function refreshArticleCdn() {
  try {
    const cdn = new Core({
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      endpoint: "https://cdn.aliyuncs.com",
      apiVersion: "2018-05-10",
    });

    const refreshUrl = `https://${config.cdnDomain}/${config.articlesPrefix}`;
    const result = await cdn.request(
      "RefreshObjectCaches",
      {
        ObjectPath: refreshUrl,
        ObjectType: "Directory",
      },
      { method: "POST" },
    );

    console.log(`Article CDN refresh submitted: ${result.RefreshTaskId || "ok"}`);
  } catch (error) {
    console.log(`Article CDN refresh failed: ${error?.data?.Message || error?.message || error}`);
  }
}
