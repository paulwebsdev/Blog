"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AnalyticsRefresh() {
  const router = useRouter();
  const [refreshedAt, setRefreshedAt] = useState("");
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      router.refresh();
      setRefreshedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    const timer = window.setInterval(refresh, 30000);
    setRefreshedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    return () => window.clearInterval(timer);
  }, [router]);
  return <div className="flex items-center gap-3 text-xs text-slate-400"><span>Auto-refreshes every 30 seconds{refreshedAt ? " · Updated " + refreshedAt : ""}</span><button type="button" onClick={() => router.refresh()} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-600 hover:border-[#635bff] hover:text-[#635bff]">Refresh now</button></div>;
}
