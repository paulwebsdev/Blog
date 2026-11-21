"use client";

import { useState } from "react";

type Props = { title: string; excerpt: string; slug: string; imageUrl?: string | null };

export default function FacebookShareCard({ title, excerpt, slug, imageUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const articleUrl = "https://paulnova.name.ng/articles/" + encodeURIComponent(slug);
  const caption = `🚀 ${title}

${excerpt}

Read the full article on PaulNova 👇
${articleUrl}

#PaulNova #Technology #AI #Opportunities`;

  async function copyPost() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy your Facebook post:", caption);
    }
  }

  function shareOnFacebook() {
    const shareUrl = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(articleUrl);
    window.open(shareUrl, "paulnova-facebook-share", "noopener,noreferrer,width=720,height=650");
  }

  return <section className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-extrabold uppercase tracking-wider text-blue-700">Facebook sharing</p><h2 className="mt-1 text-lg font-black text-slate-900">Your post is ready</h2></div>
      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-blue-700">Personal profile · Manual share</span>
    </div>
    <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4">
      {imageUrl && <img src={imageUrl} alt="" className="mb-3 max-h-48 w-full rounded-lg object-cover" />}
      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{caption}</p>
    </div>
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" onClick={copyPost} className="rounded-full bg-[#635bff] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#5148e5]">{copied ? "✓ Copied!" : "Copy Facebook post"}</button>
      <button type="button" onClick={shareOnFacebook} className="rounded-full bg-[#1877f2] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1668d8]">Share on Facebook ↗</button>
      <button type="button" onClick={() => navigator.clipboard?.writeText(articleUrl)} className="rounded-full border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600">Copy article link</button>
    </div>
    <p className="mt-3 text-xs leading-5 text-slate-500">Copy the caption, then open Facebook and paste it into your post. Facebook should fetch the article link preview and featured image; check the preview before you publish.</p>
  </section>;
}
