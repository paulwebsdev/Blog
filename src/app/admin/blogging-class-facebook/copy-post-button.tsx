"use client";

import { useState } from "react";

export default function CopyBloggingClassPost({ text, articleUrl }: { text: string; articleUrl?: string | null }) {
  const [copied, setCopied] = useState(false);
  const caption = [text.trim(), articleUrl?.trim()].filter(Boolean).join("\n\n");
  async function copy() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy your Facebook post:", caption);
    }
  }
  return <button type="button" onClick={copy} className="rounded-full bg-[#1877f2] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1668d8]">{copied ? "✓ Copied" : "Copy Facebook post"}</button>;
}
