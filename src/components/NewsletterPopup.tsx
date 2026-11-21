"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function NewsletterPopup() {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/newsletter" || pathname.startsWith("/admin")) {
      setOpen(false);
      if (timer.current) clearTimeout(timer.current);
      return;
    }

    const show = () => setOpen(true);
    timer.current = setTimeout(show, 8000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [pathname]);

  const dismiss = () => {
    setOpen(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), 60_000);
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open || pathname === "/newsletter" || pathname.startsWith("/admin")) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-3 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) dismiss(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="pn-newsletter-title" className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white p-7 shadow-2xl sm:p-9">
        <button type="button" onClick={dismiss} aria-label="Close subscription popup" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200">×</button>
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#635bff]/10 text-2xl">✉</div>
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#635bff]">PaulNova Newsletter</p>
        <h2 id="pn-newsletter-title" className="mt-3 text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl">Stay ahead of what’s next.</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">Get practical technology and AI insights, digital business ideas, career guides and selected opportunities delivered to your inbox.</p>
        <Link href="/newsletter" onClick={() => setOpen(false)} className="mt-6 flex w-full items-center justify-center rounded-xl bg-[#635bff] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-[#5148e5]">Subscribe for free</Link>
        <button type="button" onClick={dismiss} className="mt-3 w-full py-2 text-sm font-semibold text-slate-500 hover:text-slate-800">Maybe later</button>
        <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">Free updates. Unsubscribe whenever you want.</p>
      </section>
    </div>
  );
}
