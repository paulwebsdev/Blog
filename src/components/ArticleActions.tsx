"use client";
import { useEffect, useState } from "react";
import { Bookmark, Check, Copy, Share2 } from "lucide-react";

const KEY = "paulnova:bookmarks";
function readBookmarks(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch { return []; }
}
export function BookmarkButton({ slug, title }: { slug: string; title: string }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const sync = () => setSaved(readBookmarks().includes(slug));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("paulnova-bookmarks-updated", sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("paulnova-bookmarks-updated", sync); };
  }, [slug]);
  function toggle() {
    const current = readBookmarks();
    const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
    localStorage.setItem(KEY, JSON.stringify(next));
    setSaved(next.includes(slug));
    window.dispatchEvent(new Event("paulnova-bookmarks-updated"));
  }
  return <button type="button" onClick={toggle} aria-pressed={saved} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:border-violet-200 hover:text-[#635bff]"><Bookmark size={15} fill={saved ? "currentColor" : "none"}/>{saved ? "Saved" : "Save article"}</button>;
}
export function ShareArticle({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch { /* User cancelled or share unavailable. */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url), "_blank", "noopener,noreferrer"); }
  }
  return <button type="button" onClick={share} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:border-violet-200 hover:text-[#635bff]">{copied ? <Check size={15}/> : <Share2 size={15}/>}{copied ? "Link copied" : "Share article"}</button>;
}
export function BookmarksList({ articles }: { articles: { slug: string; title: string; excerpt: string; category: string }[] }) {
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setSaved(readBookmarks());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("paulnova-bookmarks-updated", sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("paulnova-bookmarks-updated", sync); };
  }, []);
  const items = articles.filter((article) => saved.includes(article.slug));
  return <div className="mt-8 grid gap-4 md:grid-cols-2">{items.length ? items.map((article) => <article key={article.slug} className="rounded-2xl border border-slate-100 bg-white p-6"><p className="text-[10px] font-bold uppercase tracking-widest text-[#635bff]">{article.category}</p><h2 className="mt-2 text-lg font-extrabold text-slate-900"><a href={"/articles/" + article.slug}>{article.title}</a></h2><p className="mt-2 text-sm leading-6 text-slate-500">{article.excerpt}</p><button type="button" onClick={() => { const next = saved.filter((slug) => slug !== article.slug); localStorage.setItem(KEY, JSON.stringify(next)); setSaved(next); window.dispatchEvent(new Event("paulnova-bookmarks-updated")); }} className="mt-4 text-xs font-bold text-rose-600">Remove bookmark</button></article>) : <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500 md:col-span-2">You haven't saved any articles yet. Open an article and choose “Save article” to keep it here on this device.</p>}</div>;
}
