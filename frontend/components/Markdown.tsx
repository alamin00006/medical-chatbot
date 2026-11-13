import { Fragment, type ReactNode } from "react";

/**
 * Small, dependency-free markdown renderer for assistant answers.
 * Builds React elements directly (no innerHTML), so model output can never inject markup.
 * Supports: paragraphs, headings, bullet / numbered lists, fenced code, **bold**, *italic*, `code`.
 */

type ListBlock = { type: "ul" | "ol"; items: string[] };
type Block = { type: "p"; text: string } | { type: "h"; level: number; text: string } | { type: "code"; text: string } | ListBlock;

const parseBlocks = (source: string): Block[] => {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list = null as ListBlock | null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "p", text: paragraph.join("\n") });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      flushParagraph();
      flushList();
      const code: string[] = [];
      for (i += 1; i < lines.length && !lines[i].trim().startsWith("```"); i += 1) code.push(lines[i]);
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h", level: heading[1].length, text: heading[2] });
      continue;
    }

    const bullet = /^[-*•]\s+(.+)$/.exec(trimmed);
    const ordered = /^\d+[.)]\s+(.+)$/.exec(trimmed);
    const item = bullet ?? ordered;
    if (item) {
      flushParagraph();
      const type = bullet ? "ul" : "ol";
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push(item[1]);
      continue;
    }

    // Indented continuation of the previous list item.
    if (list && /^\s{2,}/.test(line)) {
      list.items[list.items.length - 1] += ` ${trimmed}`;
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return blocks;
};

const INLINE = /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\*[^*\s][^*\n]*\*)/g;

const renderInline = (text: string): ReactNode[] =>
  text.split(INLINE).map((part, index) => {
    if (!part) return null;
    if (part.length > 4 && ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__")))) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    return <Fragment key={index}>{part}</Fragment>;
  });

const renderLines = (text: string) =>
  text.split("\n").map((line, index) => (
    <Fragment key={index}>
      {index > 0 && <br />}
      {renderInline(line)}
    </Fragment>
  ));

export const Markdown = ({ content }: { content: string }) => (
  <div className="prose">
    {parseBlocks(content).map((block, index) => {
      switch (block.type) {
        case "h":
          return block.level <= 2 ? <h3 key={index}>{renderInline(block.text)}</h3> : <h4 key={index}>{renderInline(block.text)}</h4>;
        case "ul":
        case "ol": {
          const List = block.type;
          return <List key={index}>{block.items.map((item, i) => <li key={i}>{renderInline(item)}</li>)}</List>;
        }
        case "code":
          return <pre key={index}><code>{block.text}</code></pre>;
        default:
          return <p key={index}>{renderLines(block.text)}</p>;
      }
    })}
  </div>
);
