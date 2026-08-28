import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const articlesRoot = path.join(projectRoot, "articles");
const outputFile = path.join(projectRoot, "src/data/generated/articles.ts");
const supportedCategories = new Set(["learning-notes", "portfolio"]);

main();

function main() {
  const markdownFiles = Array.from(supportedCategories)
    .flatMap((category) => walk(path.join(articlesRoot, category)))
    .filter((file) => file.endsWith(".md"))
    .sort((left, right) => left.localeCompare(right));

  const articles = markdownFiles.map(parseArticleFile).sort((left, right) => {
    const dateDiff = right.date.localeCompare(left.date);
    return dateDiff || left.slug.localeCompare(right.slug);
  });

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(
    outputFile,
    [
      'import type { Article } from "../blog";',
      "",
      `export const generatedArticles = ${JSON.stringify(articles, null, 2)} satisfies Article[];`,
      "",
    ].join("\n"),
  );

  console.log(`Generated ${articles.length} articles -> ${path.relative(projectRoot, outputFile)}`);
}

function parseArticleFile(filePath) {
  const relativePath = path.relative(articlesRoot, filePath).split(path.sep).join("/");
  const [category] = relativePath.split("/");

  if (!supportedCategories.has(category)) {
    throw new Error(`Unsupported article category for ${relativePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const { metadata, body } = parseFrontmatter(raw);
  const slug = path.basename(filePath, ".md");

  return {
    slug,
    title: parseTextField(metadata.title) || slug,
    category,
    date: parseTextField(metadata.date),
    readTime: parseTextField(metadata.readTime),
    excerpt: parseTextField(metadata.excerpt),
    tags: parseTagsField(metadata.tags),
    cover: parseTextField(metadata.cover),
    pinned: parseBooleanField(metadata.pinned),
    pinnedOrder: parseNumberField(metadata.pinnedOrder),
    markdown: body,
  };
}

function parseFrontmatter(raw) {
  if (!raw.startsWith("---\n")) {
    return { metadata: {}, body: raw.trim() };
  }

  const endIndex = raw.indexOf("\n---\n", 4);
  if (endIndex === -1) {
    return { metadata: {}, body: raw.trim() };
  }

  const metadataBlock = raw.slice(4, endIndex).trim();
  const body = raw.slice(endIndex + 5).trim();
  const metadata = {};

  metadataBlock.split("\n").forEach((line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) return;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    metadata[key] = value;
  });

  return { metadata, body };
}

function parseTextField(value) {
  if (!value) return "";
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function parseTagsField(value) {
  const trimmed = parseTextField(value);
  if (!trimmed) return [];
  const normalized = trimmed.startsWith("[") && trimmed.endsWith("]") ? trimmed.slice(1, -1) : trimmed;
  return normalized
    .split(",")
    .map((tag) => parseTextField(tag))
    .filter(Boolean);
}

function parseBooleanField(value) {
  const normalized = parseTextField(value).toLowerCase();
  return normalized === "true" || normalized === "yes" || normalized === "1";
}

function parseNumberField(value) {
  const normalized = parseTextField(value);
  if (!normalized) return undefined;
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}
