"use client";
import { useEffect, useState } from "react";
const KEY = "paulnova:analytics-consent";
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(localStorage.getItem(KEY) === null); }, []);
  function choose(value: "accepted" | "rejected") {
    localStorage.setItem(KEY, value);
    setVisible(false);
    window.dispatchEvent(new Event("paulnova-consent-updated"));
  }
  if (!visible) return null;
  return <aside aria-label="Cookie preferences" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="max-w-xl"><h2 className="text-sm font-extrabold text-slate-900">Your privacy choices</h2><p className="mt-1 text-xs leading-5 text-slate-500">PaulNova uses essential technologies to run this site. If you accept optional analytics, we record first-party page views and engagement to improve our content. If advertising is enabled in future, Google and other advertising partners may use cookies or similar technologies to deliver, measure and personalise ads according to your choices and applicable consent rules. You can change your analytics choice by clearing this site's local storage. See our Privacy Policy for details.</p><a href="/privacy" className="mt-2 inline-block text-xs font-bold text-[#635bff]">Read our privacy policy</a></div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => choose("rejected")} className="rounded-full border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">Reject optional</button><button type="button" onClick={() => choose("accepted")} className="rounded-full bg-[#635bff] px-4 py-2.5 text-xs font-bold text-white">Accept analytics</button></div></div></aside>;
}
