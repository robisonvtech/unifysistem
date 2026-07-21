/**
 * Lightweight markdown renderer for chat responses.
 * Supports: **bold**, *italic*, `code`, headings (#..###), lists (-, *, 1.), paragraphs, line breaks.
 * Zero dependencies — keeps the bundle small.
 */
import type React from "react";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
  className?: string;
}

function inline(text: string): (string | React.ReactNode)[] {
  const out: (string | React.ReactNode)[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<strong key={key++}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) out.push(<code key={key++} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.85em]">{t.slice(1, -1)}</code>);
    else out.push(<em key={key++}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function MarkdownLite({ content, className }: Props) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let paragraph: string[] = [];
  let k = 0;

  function flushParagraph() {
    if (paragraph.length) {
      blocks.push(<p key={k++} className="whitespace-pre-wrap">{inline(paragraph.join(" "))}</p>);
      paragraph = [];
    }
  }
  function flushList() {
    if (list) {
      const L = list;
      const Tag = L.ordered ? "ol" : "ul";
      blocks.push(
        <Tag key={k++} className={cn(L.ordered ? "list-decimal" : "list-disc", "ml-5 space-y-0.5")}>
          {L.items.map((it, i) => <li key={i}>{inline(it)}</li>)}
        </Tag>,
      );
      list = null;
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushParagraph(); flushList(); continue; }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      flushParagraph(); flushList();
      const level = h[1].length;
      const cls = level === 1 ? "text-lg font-bold mt-1" : level === 2 ? "text-base font-semibold mt-1" : "text-sm font-semibold mt-1";
      blocks.push(<div key={k++} className={cls}>{inline(h[2])}</div>);
      continue;
    }
    const ol = /^(\d+)\.\s+(.*)$/.exec(line);
    const ul = /^[-*]\s+(.*)$/.exec(line);
    if (ol) {
      flushParagraph();
      if (!list || !list.ordered) { flushList(); list = { ordered: true, items: [] }; }
      list.items.push(ol[2]);
      continue;
    }
    if (ul) {
      flushParagraph();
      if (!list || list.ordered) { flushList(); list = { ordered: false, items: [] }; }
      list.items.push(ul[1]);
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();

  return <div className={cn("space-y-2 text-sm leading-relaxed", className)}>{blocks}</div>;
}
