import Link from "next/link";
import { ArrowRight, ArrowUpRight, BrainCircuit, BriefcaseBusiness, Cpu, GraduationCap, Menu, Search, Sparkles, Zap } from "lucide-react";
import { articles } from "@/lib/articles";
import { getPublicArticles } from "@/lib/content";

const categories = [
  { name: "Technology", slug: "technology", icon: Cpu, detail: "Apps, gadgets, software and useful guides", color: "bg-blue-50 text-blue-700" },
  { name: "Artificial Intelligence", slug: "artificial-intelligence", icon: BrainCircuit, detail: "AI tools, explainers and practical ideas", color: "bg-violet-50 text-violet-700" },
  { name: "Business & Money", slug: "business-money", icon: BriefcaseBusiness, detail: "Digital business, money and growth", color: "bg-emerald-50 text-emerald-700" },
  { name: "Education & Careers", slug: "education-careers", icon: GraduationCap, detail: "Skills, learning and career opportunities", color: "bg-amber-50 text-amber-700" }
];

const categoryFor = (category: string) => category === "Artificial Intelligence" ? "AI & TOOLS" : category.toUpperCase();

function Header() {
  return <header className="sticky top-0 z-30 border-b border-slate-100/90 bg-white/95 backdrop-blur">
    <div className="container flex h-[76px] items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5" aria-label="PaulNova home">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#635bff] text-lg font-black text-white">P<span className="text-[#c9c5ff]">.</span></span>
        <span className="text-[23px] font-black tracking-tight text-[#101828]">Paul<span className="text-[#635bff]">Nova</span></span>
      </Link>
      <nav aria-label="Main navigation" className="hidden items-center gap-7 text-[13px] font-semibold text-slate-600 lg:flex">
        {categories.map((item) => <Link key={item.slug} className="hover:text-[#635bff]" href={`/category/${item.slug}`}>{item.name}</Link>)}
      </nav>
      <div className="flex items-center gap-2">
        <Link aria-label="Search PaulNova" href="/search" className="rounded-full p-2.5 text-slate-500 hover:bg-slate-100"><Search size={19}/></Link>
        <Link href="#newsletter" className="rounded-full bg-[#635bff] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-violet-200 transition hover:bg-[#5148e5] sm:px-5">Stay informed <ArrowUpRight className="ml-1 inline" size={14}/></Link>
        <details className="relative lg:hidden">
          <summary aria-label="Open navigation menu" className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-xl text-slate-700 hover:bg-slate-100"><Menu size={21}/></summary>
          <nav aria-label="Mobile navigation" className="absolute right-0 top-12 z-40 flex w-64 flex-col gap-1 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl">
            {categories.map((item) => <Link key={item.slug} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-violet-50 hover:text-[#635bff]" href={`/category/${item.slug}`}>{item.name}</Link>)}
            <Link className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-violet-50 hover:text-[#635bff]" href="/search">Search articles</Link>
          </nav>
        </details>
      </div>
    </div>
  </header>;
}

function StoryCard({ article, featured = false }: { article: typeof articles[number], featured?: boolean }) {
  const palette = article.category === "Artificial Intelligence" ? "from-[#27215f] via-[#5146bd] to-[#9b8cff]" : article.category === "Technology" ? "from-[#063b58] via-[#087e9b] to-[#7bd5d0]" : "from-[#174a37] via-[#25856a] to-[#9ad9a9]";
  return <Link href={`/articles/${article.slug}`} className="group block overflow-hidden rounded-2xl border border-slate-100 bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60">
    <div className={`article-art bg-gradient-to-br ${palette} ${featured ? "min-h-[300px] md:min-h-[390px]" : "min-h-[205px]"}`}>
      <span className="absolute left-5 top-5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[10px] font-bold tracking-widest text-white backdrop-blur">{categoryFor(article.category)}</span>
      <span className="ml-auto text-6xl font-black tracking-tighter text-white/30 md:text-7xl">P<span className="text-white/50">N</span></span>
    </div>
    <div className={featured ? "p-7 md:p-9" : "p-6"}>
      <div className="mb-3 flex items-center gap-2 text-[11px] font-medium text-slate-400"><span>{article.author}</span><span>·</span><span>{article.readTime}</span></div>
      <h3 className={`font-extrabold leading-tight tracking-tight text-[#101828] group-hover:text-[#635bff] ${featured ? "max-w-2xl text-2xl md:text-3xl" : "text-xl"}`}>{article.title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-500">{article.excerpt}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#635bff]">Read article <ArrowRight size={15}/></span>
    </div>
  </Link>;
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const articles = await getPublicArticles();
  const [featured, ...latest] = articles;
  return <main>
    <Header/>
    <section className="relative overflow-hidden bg-[#f7f8fc]">
      <div className="pointer-events-none absolute -right-40 -top-48 h-[550px] w-[550px] rounded-full border border-violet-100"/><div className="pointer-events-none absolute -right-16 -top-24 h-[350px] w-[350px] rounded-full border border-violet-100"/>
      <div className="container grid min-h-[520px] items-center gap-12 py-16 md:grid-cols-[1.1fr_.9fr] md:py-24">
        <div className="relative z-10">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white px-4 py-2 text-[11px] font-bold text-[#635bff] shadow-sm"><Sparkles size={14}/> IDEAS FOR WHAT'S NEXT</div>
          <h1 className="max-w-[680px] text-5xl font-black leading-[1.04] tracking-[-.055em] text-[#101828] md:text-7xl">Make sense of <span className="text-[#635bff]">what's next.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-slate-500 md:text-lg">Technology is changing everything. We help you understand it, use it and find your next opportunity — wherever you are in the world.</p>
          <div className="mt-9 flex flex-wrap gap-3"><Link href="#latest" className="rounded-full bg-[#635bff] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-[#5148e5]">Explore the latest <ArrowRight className="ml-2 inline" size={16}/></Link><Link href="#topics" className="rounded-full border border-slate-200 bg-white px-7 py-4 text-sm font-bold text-slate-700 hover:border-violet-200 hover:text-[#635bff]">Browse topics</Link></div>
          <div className="mt-12 flex items-center gap-3 text-xs text-slate-400"><span className="h-px w-9 bg-violet-300"/><span>TECHNOLOGY. INTELLIGENCE. OPPORTUNITIES.</span></div>
        </div>
        <div className="relative mx-auto w-full max-w-[470px]">
          <div className="absolute -left-8 top-10 h-24 w-24 rounded-3xl bg-[#dcd9ff] blur-2xl"/><div className="relative rounded-[32px] bg-gradient-to-br from-[#211b56] via-[#5146bd] to-[#a59bff] p-8 shadow-2xl shadow-violet-200 md:p-10">
            <div className="flex items-center justify-between text-white/70"><span className="text-[10px] font-bold tracking-[.2em]">THE NEXT FRONTIER</span><Zap size={18}/></div>
            <div className="my-12"><div className="mb-3 text-sm font-semibold text-violet-200">Ideas meet possibility</div><div className="text-6xl font-black leading-none tracking-tighter text-white md:text-7xl">Think<br/>forward<span className="text-violet-300">.</span></div></div>
            <div className="flex items-end justify-between border-t border-white/20 pt-5"><span className="text-xs leading-5 text-white/65">A clearer view of<br/>our digital future.</span><span className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#5146bd]"><ArrowUpRight size={21}/></span></div>
          </div>
          <div className="absolute -bottom-5 -left-5 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-lg"><div className="text-[10px] font-bold tracking-widest text-slate-400">PAULNOVA</div><div className="mt-1 text-sm font-extrabold text-slate-800">Ideas for a better digital life.</div></div>
        </div>
      </div>
    </section>
    <section id="topics" className="container py-20">
      <div className="mb-9 flex items-end justify-between gap-4"><div><div className="eyebrow">Explore PaulNova</div><h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Curiosity starts here.</h2></div><span className="hidden text-sm text-slate-400 sm:block">Four areas. One bigger picture.</span></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{categories.map((item) => { const Icon = item.icon; return <Link key={item.slug} href={`/category/${item.slug}`} className="group rounded-2xl border border-slate-100 p-6 transition hover:-translate-y-1 hover:border-violet-100 hover:shadow-lg hover:shadow-slate-100"><span className={`grid h-12 w-12 place-items-center rounded-xl ${item.color}`}><Icon size={22}/></span><h3 className="mt-5 font-extrabold text-slate-900 group-hover:text-[#635bff]">{item.name}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{item.detail}</p><ArrowUpRight className="mt-5 text-slate-300 group-hover:text-[#635bff]" size={17}/></Link>})}</div>
    </section>
    <section id="latest" className="bg-[#f7f8fc] py-20"><div className="container">
      <div className="mb-10 flex items-end justify-between"><div><div className="eyebrow">Fresh perspectives</div><h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Ideas worth exploring.</h2><p className="mt-3 text-sm text-slate-500">Useful knowledge for the world taking shape around us.</p></div><Link href="/search" className="hidden items-center gap-2 text-xs font-bold text-[#635bff] sm:flex">Find an article <Search size={15}/></Link></div>
      <div className="grid gap-6 lg:grid-cols-2">{featured && <StoryCard article={featured} featured/>}<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">{latest.map((article) => <StoryCard key={article.slug} article={article}/>)}</div></div>
    </div></section>
    <section className="container py-20"><div className="overflow-hidden rounded-[28px] bg-[#17143d] px-8 py-12 text-white md:px-14 md:py-16"><div className="grid items-center gap-8 md:grid-cols-[1fr_auto]"><div><div className="text-[11px] font-bold tracking-[.18em] text-violet-300">THE PAULNOVA POINT OF VIEW</div><h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight tracking-tight md:text-4xl">The future moves fast. Understanding it puts you ahead.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">Practical insights on technology, AI and the opportunities they create.</p></div><Link href="#topics" className="inline-flex w-fit items-center gap-3 rounded-full bg-white px-6 py-4 text-sm font-bold text-[#17143d] hover:bg-violet-100">Find your next idea <ArrowUpRight size={17}/></Link></div></div></section>
    <section id="newsletter" className="border-t border-slate-100 bg-white py-16"><div className="container text-center"><div className="eyebrow">Stay curious</div><h2 className="mt-3 text-3xl font-black tracking-tight">A little more insight. A lot more possibility.</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">PaulNova is preparing practical ideas for the digital world. Newsletter subscriptions will open soon.</p><div className="mx-auto mt-7 inline-flex items-center gap-2 rounded-full bg-violet-50 px-5 py-3 text-xs font-bold text-[#635bff]"><Sparkles size={15}/> Newsletter coming soon</div></div></section>
    <footer className="border-t border-slate-100 py-8"><div className="container flex flex-col items-center justify-between gap-4 text-xs text-slate-400 sm:flex-row"><Link href="/" className="text-lg font-black tracking-tight text-slate-800">Paul<span className="text-[#635bff]">Nova</span></Link><div className="flex flex-wrap items-center justify-center gap-5"><span>Technology. Intelligence. Opportunities.</span><Link href="/contact" className="font-semibold text-slate-500 hover:text-[#635bff]">Contact</Link></div><span>© {new Date().getFullYear()} PaulNova. All rights reserved.</span></div></footer>
  </main>;
}
