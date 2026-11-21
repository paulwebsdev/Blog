"use client";

import { useState } from "react";

export default function ImageLibraryRunner() {
  const [running, setRunning] = useState(false);
  const [assigned, setAssigned] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  async function start() {
    setRunning(true);
    setMessage("Finding suitable public-domain images...");
    let rounds = 0;
    try {
      while (rounds < 20) {
        const response = await fetch("/api/admin/images/assign", { method: "POST" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Image assignment failed.");
        setAssigned((n) => n + (data.assigned || 0));
        setSkipped((n) => n + (data.skipped || 0));
        setRemaining(data.remaining ?? 0);
        rounds++;
        if (data.done || data.remaining === 0) {
          setMessage("Finished. Images were added where a suitable public-domain match was found.");
          break;
        }
        setMessage("Working through your drafts... " + data.remaining + " still need an image.");
      }
      if (rounds >= 20) setMessage("Batch limit reached. Press the button again to continue with the remaining drafts.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setRunning(false);
    }
  }

  return <section className="rounded-2xl border border-slate-100 bg-white p-6">
    <p className="eyebrow">Editorial automation</p>
    <h1 className="mt-2 text-2xl font-black text-slate-900">Automatic featured images</h1>
    <p className="mt-2 text-sm leading-6 text-slate-500">PaulNova searches Wikimedia Commons for relevant public-domain or CC0 images, saves the direct image URL and alt text, and records the source page. Existing images are never replaced. Articles remain drafts.</p>
    <div className="mt-5 grid grid-cols-3 gap-3">
      <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Assigned this run</p><p className="mt-1 text-2xl font-black">{assigned}</p></div>
      <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">No match / skipped</p><p className="mt-1 text-2xl font-black">{skipped}</p></div>
      <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Still missing</p><p className="mt-1 text-2xl font-black">{remaining ?? "—"}</p></div>
    </div>
    <button type="button" disabled={running} onClick={start} className="mt-5 rounded-full bg-[#635bff] px-6 py-3 text-sm font-bold text-white disabled:opacity-60">{running ? "Finding images..." : "Find images for my drafts"}</button>
    {message && <p role="status" className="mt-4 text-sm leading-6 text-slate-600">{message}</p>}
    <p className="mt-3 text-xs leading-5 text-slate-400">Only Public Domain and CC0 matches are automatically used, so no paid image account or file uploads are required. A few articles may remain without an image if no suitable match is found.</p>
  </section>;
}
