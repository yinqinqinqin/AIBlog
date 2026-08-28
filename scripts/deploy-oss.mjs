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
  distDir: path.resolve(process.env.ALI_OSS_DIST || "dist"),
  prefix: normalizePrefix(process.env.ALI_OSS_PREFIX || ""),
  refreshCdn: process.env.ALI_CDN_REFRESH !== "false",
  uploadSourceMaps: process.env.ALI_OSS_UPLOAD_SOURCEMAP === "true",
};

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".ico", "image/x-icon"],
  [".mp4", "video/mp4"],
  [".wav", "audio/wav"],
  [".flac", "audio/flac"],
  [".ttf", "font/ttf"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".cur", "image/x-icon"],
  [".glb", "model/gltf-binary"],
]);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("OSS deploy failed:", error?.data?.Message || error?.message || error);
    process.exit(1);
  });
}

async function main() {
  validateConfig();

  const files = walk(config.distDir).filter((file) => {
    return config.uploadSourceMaps || !file.endsWith(".map");
  });

  const client = new OSS({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    bucket: config.bucket,
    endpoint: config.endpoint,
    region: config.region,
    secure: true,
    timeout: 120000,
  });

  console.log(`Uploading ${files.length} files to oss://${config.bucket}/${config.prefix}`);

  let uploaded = 0;
  for (const file of files) {
    const relativePath = path.relative(config.distDir, file).split(path.sep).join("/");
    const objectKey = `${config.prefix}${relativePath}`;
    const ext = path.extname(file).toLowerCase();
    const cacheControl = getCacheControl(relativePath, ext);

    await client.put(objectKey, file, {
      headers: {
        "Cache-Control": cacheControl,
        "Content-Type": contentTypes.get(ext) || "application/octet-stream",
      },
    });

    uploaded += 1;
    if (uploaded % 10 === 0 || uploaded === files.length) {
      console.log(`Uploaded ${uploaded}/${files.length}`);
    }
  }

  if (config.refreshCdn && config.cdnDomain) {
    await refreshCdn();
  }

  console.log(`Deployed: https://${config.cdnDomain}/${config.prefix}`);
}

function validateConfig() {
  if (!config.accessKeyId || !config.accessKeySecret) {
    throw new Error(
      "Missing ALI_OSS_ACCESS_KEY_ID or ALI_OSS_ACCESS_KEY_SECRET environment variable.",
    );
  }

  if (!fs.existsSync(config.distDir)) {
    throw new Error(`Build output not found: ${config.distDir}. Run npm run build first.`);
  }
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function normalizePrefix(prefix) {
  if (!prefix) return "";
  return prefix.replace(/^\/+/, "").replace(/\/?$/, "/");
}

function getCacheControl(relativePath, ext) {
  if (ext === ".html") {
    return "no-cache, no-store, must-revalidate";
  }

  if (relativePath.startsWith("assets/")) {
    return "public, max-age=31536000, immutable";
  }

  return "public, max-age=86400";
}

async function refreshCdn() {
  try {
    const cdn = new Core({
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      endpoint: "https://cdn.aliyuncs.com",
      apiVersion: "2018-05-10",
    });

    const refreshUrl = `https://${config.cdnDomain}/${config.prefix}`;
    const result = await cdn.request(
      "RefreshObjectCaches",
      {
        ObjectPath: refreshUrl,
        ObjectType: "Directory",
      },
      { method: "POST" },
    );

    console.log(`CDN refresh submitted: ${result.RefreshTaskId || "ok"}`);
  } catch (error) {
    console.log(`CDN refresh failed: ${error?.data?.Message || error?.message || error}`);
  }
}
