"use client";

import { useMemo, useState } from "react";
import { saveArticle } from "@/app/admin/actions";

type Category = { id: string; name: string };
type Values = { id?: string; title?: string; slug?: string; excerpt?: string; tags?: string; category_id?: string; image_url?: string; image_alt?: string; seo_title?: string; seo_description?: string; status?: string; scheduled_at?: string; content?: unknown; sources?: {title:string;url:string}[]; correction_note?: string };
const starterContent = [{ heading: "Start here", paragraphs: ["Write your article paragraph here."] }];
const fieldClass = "mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal";
function makeSlug(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
}
function inspectContent(value: string) {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return { headings: 0, words: 0, valid: false };
    const headings = parsed.filter((section) => typeof section?.heading === "string" && section.heading.trim()).length;
    const text = parsed.flatMap((section) => [section?.heading, ...(Array.isArray(section?.paragraphs) ? section.paragraphs : [])]).filter((part) => typeof part === "string").join(" ");
    return { headings, words: text.trim() ? text.trim().split(/\s+/).length : 0, valid: true };
  } catch {
    return { headings: 0, words: 0, valid: false };
  }
}
export default function ArticleEditorForm({ categories, values = {} }: { categories: Category[]; values?: Values }) {
  const [title, setTitle] = useState(values.title ?? "");
  const [slug, setSlug] = useState(values.slug ?? "");
  const [excerpt, setExcerpt] = useState(values.excerpt ?? "");
  const [tags, setTags] = useState(values.tags ?? "");
  const [imageUrl, setImageUrl] = useState(values.image_url ?? "");
  const [imageAlt, setImageAlt] = useState(values.image_alt ?? "");
  const [seoTitle, setSeoTitle] = useState(values.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(values.seo_description ?? "");
  const [contentText, setContentText] = useState(JSON.stringify(values.content ?? starterContent, null, 2));

  const finalSlug = slug.trim() || makeSlug(title);
  const finalSeoTitle = seoTitle.trim() || title;
  const finalSeoDescription = seoDescription.trim() || excerpt;
  const contentStats = useMemo(() => inspectContent(contentText), [contentText]);
  const checks = [
    { label: "Clear article title (30–70 characters)", ok: title.trim().length >= 30 && title.trim().length <= 70 },
    { label: "Readable, descriptive URL slug", ok: finalSlug.split("-").filter(Boolean).length >= 3 && finalSlug.length <= 80 },
    { label: "Useful summary / excerpt (50+ characters)", ok: excerpt.trim().length >= 50 },
    { label: "SEO title (25–60 characters)", ok: finalSeoTitle.trim().length >= 25 && finalSeoTitle.trim().length <= 60 },
    { label: "Unique search description (70–160 characters)", ok: finalSeoDescription.trim().length >= 70 && finalSeoDescription.trim().length <= 160 },
    { label: "Substantial article text (300+ words)", ok: contentStats.valid && contentStats.words >= 300 },
    { label: "Two or more useful section headings", ok: contentStats.valid && contentStats.headings >= 2 },
    { label: "Featured image has descriptive alt text", ok: Boolean(imageUrl.trim() && imageAlt.trim()) },
    { label: "At least one relevant topic tag", ok: tags.split(",").some((tag) => tag.trim().length > 1) }
  ];
  const score = checks.filter((check) => check.ok).length;
  const articleUrl = "https://paulnova.name.ng/articles/" + (finalSlug || "your-article-slug");

  return <form action={saveArticle} className="space-y-5">
    {values.id && <input type="hidden" name="id" value={values.id}/>}
    <div className="grid gap-5 md:grid-cols-2">
      <label className="block text-sm font-semibold text-slate-700 md:col-span-2">Article title
        <input required minLength={5} name="title" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Write a clear, useful headline" className={fieldClass}/>
      </label>
      <label className="block text-sm font-semibold text-slate-700">URL slug
        <input name="slug" value={slug} onChange={(e)=>setSlug(e.target.value)} placeholder="Auto-generated from the title" className={fieldClass}/>
        <span className="mt-1 block text-xs font-normal text-slate-400">Leave blank to generate a readable URL from your headline.</span>
      </label>
      <label className="block text-sm font-semibold text-slate-700">Category
        <select required name="category_id" defaultValue={values.category_id ?? ""} className={fieldClass + " bg-white"}><option value="">Choose a category</option>{categories.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
      </label>
    </div>

    <label className="block text-sm font-semibold text-slate-700">SEO topic tags (comma-separated)
      <input name="tags" value={tags} onChange={(e)=>setTags(e.target.value)} placeholder="AI tools, ChatGPT, productivity, remote work" className={fieldClass}/>
      <span className="mt-1 block text-xs font-normal text-slate-400">Add up to 8 accurate topics readers may use to find this article.</span>
    </label>
    <label className="block text-sm font-semibold text-slate-700">Short excerpt
      <textarea required minLength={15} name="excerpt" rows={3} value={excerpt} onChange={(e)=>setExcerpt(e.target.value)} placeholder="Summarise what readers will learn..." className={fieldClass}/>
    </label>

    <section className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
      <h2 className="font-extrabold text-slate-900">Featured image</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">Paste a direct public image URL, such as a Blogger-hosted image. PaulNova does not upload it to Supabase Storage.</p>
      <label className="mt-4 block text-sm font-semibold text-slate-700">Image URL
        <input type="url" name="image_url" value={imageUrl} onChange={(e)=>setImageUrl(e.target.value)} placeholder="https://blogger.googleusercontent.com/..." className={fieldClass + " bg-white"}/>
      </label>
      {imageUrl && <div className="mt-4 overflow-hidden rounded-xl bg-white p-3"><p className="mb-2 text-xs font-semibold text-slate-500">Image preview</p><img src={imageUrl} alt="Preview of selected article image" className="max-h-64 w-full rounded-lg object-contain" onError={(e)=>{e.currentTarget.style.display="none"}}/></div>}
      <label className="mt-4 block text-sm font-semibold text-slate-700">Image alt text
        <input name="image_alt" value={imageAlt} onChange={(e)=>setImageAlt(e.target.value)} required={Boolean(imageUrl.trim())} placeholder="Describe the meaningful content of the image" className={fieldClass + " bg-white"}/>
      </label>
      {imageUrl.trim()&&!imageAlt.trim()&&<p className="mt-2 text-xs font-semibold text-amber-700">Please describe the image before saving. For example: “A laptop displaying an AI assistant interface.”</p>}
    </section>

    <label className="block text-sm font-semibold text-slate-700">Article content (JSON)
      <textarea required name="content" rows={16} value={contentText} onChange={(e)=>setContentText(e.target.value)} spellCheck={false} className={fieldClass + " font-mono text-xs leading-6"}/>
      <span className="mt-1 block text-xs font-normal text-slate-400">{contentStats.valid ? contentStats.words + " words · " + contentStats.headings + " section headings" : "The content JSON is not valid yet."}</span>
    </label>

    <section className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
      <h2 className="font-extrabold text-slate-900">Sources &amp; editorial corrections</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">Add sources actually used to prepare this article, one per line: Source title | https://example.com</p>
      <label className="mt-4 block text-sm font-semibold text-slate-700">Sources
        <textarea name="sources" rows={5} defaultValue={(values.sources??[]).map((source)=>source.title+" | "+source.url).join("\n")} placeholder="Official report | https://example.com/report" className={fieldClass + " bg-white font-mono text-xs"}/>
      </label>
      <label className="mt-4 block text-sm font-semibold text-slate-700">Correction / update notice (optional)
        <textarea name="correction_note" rows={3} maxLength={1200} defaultValue={values.correction_note??""} placeholder="Explain a material correction or important update. Leave blank if none." className={fieldClass}/>
      </label>
    </section>

    <section className="rounded-2xl border border-slate-100 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-extrabold text-slate-900">Search engine settings</h2><p className="mt-1 text-xs text-slate-500">Leave these blank to use your article title and excerpt automatically.</p></div>
        <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-extrabold text-violet-700">{score}/9 SEO checks</span>
      </div>
      <label className="mt-4 block text-sm font-semibold text-slate-700">SEO title
        <input name="seo_title" value={seoTitle} onChange={(e)=>setSeoTitle(e.target.value)} maxLength={70} placeholder={title || "Automatically uses article title"} className={fieldClass}/>
        <span className="mt-1 block text-xs font-normal text-slate-400">{(finalSeoTitle || "").length}/60 recommended characters</span>
      </label>
      <label className="mt-4 block text-sm font-semibold text-slate-700">SEO description
        <textarea name="seo_description" value={seoDescription} onChange={(e)=>setSeoDescription(e.target.value)} maxLength={170} rows={2} placeholder={excerpt || "Automatically uses article excerpt"} className={fieldClass}/>
        <span className="mt-1 block text-xs font-normal text-slate-400">{(finalSeoDescription || "").length}/160 recommended characters</span>
      </label>
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Live Google-style preview</p>
        <p className="mt-2 break-all text-sm font-semibold text-[#1a0dab]">{finalSeoTitle || "Your article title will appear here"}</p>
        <p className="mt-1 break-all text-xs text-emerald-800">paulnova.name.ng › articles › {finalSlug || "your-article-slug"}</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">{finalSeoDescription || "Your search description will appear here."}</p>
      </div>
      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-extrabold text-slate-800">Article SEO readiness</h3><span className="text-xs font-bold text-slate-500">{Math.round(score / checks.length * 100)}%</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#635bff] transition-all" style={{width: (score / checks.length * 100) + "%"}}/></div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">{checks.map((check)=><li key={check.label} className={"flex items-start gap-2 text-xs " + (check.ok ? "text-emerald-700" : "text-slate-500")}><span aria-hidden="true" className="font-black">{check.ok ? "✓" : "○"}</span><span>{check.label}</span></li>)}</ul>
        <p className="mt-3 text-[11px] leading-5 text-slate-400">This is an editorial checklist, not a Google ranking score or a guarantee of indexing. Prioritise accurate, original, helpful content over hitting a number.</p>
      </div>
    </section>

    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-extrabold text-slate-700">Your article URL</p>
      <p className="mt-1 break-all text-xs text-slate-500">{articleUrl}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">Published articles are added to PaulNova's XML sitemap automatically. For ordinary articles, use Google Search Console's URL Inspection tool to request indexing; Google's Indexing API is restricted to job postings and livestream pages.</p>
      <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#5148e5]">Open Google Search Console ↗</a>
    </div>

    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-semibold text-slate-700">Publishing status
        <select name="status" defaultValue={values.status ?? "draft"} className={fieldClass + " bg-white"}><option value="draft">Save as draft</option><option value="published">Publish now</option><option value="scheduled">Schedule</option></select>
      </label>
      <label className="block text-sm font-semibold text-slate-700">Schedule date/time (if scheduled)
        <input type="datetime-local" name="scheduled_at" defaultValue={values.scheduled_at} className={fieldClass}/>
      </label>
    </div>
    <div className="flex flex-wrap gap-3"><button className="rounded-full bg-[#635bff] px-6 py-3 text-sm font-bold text-white hover:bg-[#5148e5]">Save article</button><a href="/admin" className="rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600">Cancel</a></div>
  </form>;
}
