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
export function BookmarkButton({ slug }: { slug: string }) {
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
  const [open, setOpen] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  useEffect(() => {
    setPageUrl(window.location.origin + window.location.pathname);
  }, []);
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(title);
  const shareText = encodeURIComponent(title + " — " + pageUrl);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this article link:", pageUrl);
    }
  }
  async function nativeShare() {
    if (!pageUrl) return;
    if (navigator.share) {
      try { await navigator.share({ title, text: title, url: pageUrl }); } catch { /* User cancelled the share sheet. */ }
    } else {
      setOpen(true);
    }
  }
  const linkClass = "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-violet-300 hover:text-[#635bff]";
  return <div className="relative">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Share this article" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:border-violet-200 hover:text-[#635bff]"><Share2 size={15}/>Share article</button>
    {open && <div className="absolute right-0 top-full z-30 mt-3 w-[min(19rem,calc(100vw-2.5rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between"><p className="text-sm font-extrabold text-slate-900">Share this article</p><button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-slate-400 hover:text-slate-700">Close</button></div>
      <p className="mb-3 text-xs leading-5 text-slate-500">The article link includes its featured image preview when the platform supports link previews.</p>
      <div className="grid grid-cols-2 gap-2">
        <a className={linkClass} href={"https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl} target="_blank" rel="noopener noreferrer">Facebook</a>
        <a className={linkClass} href={"https://api.whatsapp.com/send?text=" + shareText} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a className={linkClass} href={"https://twitter.com/intent/tweet?text=" + encodedTitle + "&url=" + encodedUrl} target="_blank" rel="noopener noreferrer">X / Twitter</a>
        <a className={linkClass} href={"https://www.linkedin.com/sharing/share-offsite/?url=" + encodedUrl} target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a className={linkClass} href={"https://t.me/share/url?url=" + encodedUrl + "&text=" + encodedTitle} target="_blank" rel="noopener noreferrer">Telegram</a>
        <a className={linkClass} href={"mailto:?subject=" + encodedTitle + "&body=" + shareText}>Email</a>
      </div>
      <div className="mt-3 flex gap-2"><button type="button" onClick={copyLink} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#635bff] px-3 py-2.5 text-xs font-bold text-white hover:bg-violet-700">{copied ? <Check size={14}/> : <Copy size={14}/ >}{copied ? "Copied!" : "Copy link"}</button><button type="button" onClick={nativeShare} className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:text-[#635bff]">More…</button></div>
    </div>}
  </div>;
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
