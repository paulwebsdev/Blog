"use client";
import { useEffect, useState } from "react";
const KEY = "paulnova:analytics-consent";
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => { setVisible(localStorage.getItem(KEY) === null); setReady(true); }, []);
  function choose(value: "accepted" | "rejected") {
    localStorage.setItem(KEY, value);
    setVisible(false);
    window.dispatchEvent(new Event("paulnova-consent-updated"));
  }
  if (!ready) return null;
  if (!visible) return <button type="button" onClick={() => setVisible(true)} className="fixed bottom-4 right-4 z-40 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-lg hover:border-violet-200 hover:text-[#5148e5]">Privacy settings</button>;
  return <aside aria-label="Cookie preferences" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="max-w-xl"><h2 className="text-sm font-extrabold text-slate-900">Your privacy choices</h2><p className="mt-1 text-xs leading-5 text-slate-500">PaulNova uses essential technologies to run this site. If you accept optional analytics, we record first-party page views and engagement to improve our content. This choice controls analytics only; it does not enable advertising cookies. If advertising is introduced, we will provide separate advertising consent choices where required. You can change your analytics choice at any time using Privacy settings. See our Privacy Policy for details.</p><a href="/privacy" className="mt-2 inline-block text-xs font-bold text-[#635bff]">Read our privacy policy</a></div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => choose("rejected")} className="rounded-full border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">Reject optional</button><button type="button" onClick={() => choose("accepted")} className="rounded-full bg-[#635bff] px-4 py-2.5 text-xs font-bold text-white">Accept analytics</button></div></div></aside>;
}
