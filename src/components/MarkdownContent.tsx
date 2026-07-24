import type { ReactNode } from "react";

type MarkdownContentProps = {
  source: string;
};

function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>;
    }

    return part;
  });
}

type Block =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] };

function parseMarkdown(source: string): Block[] {
  const lines = source.split(/\r?\n/);
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({ type: "heading", level: 2, text: line.slice(3).trim() });
      index += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ type: "heading", level: 3, text: line.slice(4).trim() });
      index += 1;
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2).trim());
        index += 1;
      }
      blocks.push({ type: "unordered-list", items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ordered-list", items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const current = lines[index].trim();
      if (!current || current.startsWith("## ") || current.startsWith("### ") || current.startsWith("- ") || /^\d+\.\s+/.test(current)) {
        break;
      }
      paragraphLines.push(current);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}

export default function MarkdownContent({ source }: MarkdownContentProps) {
  const blocks = parseMarkdown(source);

  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          if (block.level === 2) {
            return <h2 key={`${block.type}-${index}`}>{block.text}</h2>;
          }

          return <h3 key={`${block.type}-${index}`}>{block.text}</h3>;
        }

        if (block.type === "unordered-list") {
          return (
            <ul key={`${block.type}-${index}`}>
              {block.items.map((item) => (
                <li key={item}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "ordered-list") {
          return (
            <ol key={`${block.type}-${index}`}>
              {block.items.map((item) => (
                <li key={item}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }

        return <p key={`${block.type}-${index}`}>{renderInline(block.text) as ReactNode}</p>;
      })}
    </>
  );
}
