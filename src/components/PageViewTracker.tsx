"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const CONSENT_KEY = "paulnova:analytics-consent";
const SESSION_KEY = "paulnova:analytics-session";
const SESSION_TIME_KEY = "paulnova:analytics-last-seen";
const SESSION_TIMEOUT = 30 * 60 * 1000;

function getSessionId() {
  const now = Date.now();
  const lastSeen = Number(localStorage.getItem(SESSION_TIME_KEY) || 0);
  let id = localStorage.getItem(SESSION_KEY);
  if (!id || !lastSeen || now - lastSeen > SESSION_TIMEOUT) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  localStorage.setItem(SESSION_TIME_KEY, String(now));
  return id;
}

function getTrafficDetails() {
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source")?.slice(0, 100).toLowerCase();
  const utmMedium = params.get("utm_medium")?.slice(0, 100) || null;
  const utmCampaign = params.get("utm_campaign")?.slice(0, 200) || null;
  let referrerHost: string | null = null;
  try {
    const referrer = document.referrer ? new URL(document.referrer) : null;
    if (referrer && referrer.hostname !== window.location.hostname) referrerHost = referrer.hostname;
  } catch { /* Ignore malformed referrers. */ }

  const rawSource = utmSource || referrerHost?.replace(/^www\./, "") || "";
  let source = "Direct";
  if (rawSource) {
    if (/google|bing|yahoo|duckduckgo|yandex|baidu/.test(rawSource)) source = "Organic search";
    else if (/facebook|fb\./.test(rawSource)) source = "Facebook";
    else if (/whatsapp|wa\.me/.test(rawSource)) source = "WhatsApp";
    else if (/instagram/.test(rawSource)) source = "Instagram";
    else if (/t\.co|twitter|x\.com/.test(rawSource)) source = "X";
    else if (/linkedin/.test(rawSource)) source = "LinkedIn";
    else if (/youtube|youtu\.be/.test(rawSource)) source = "YouTube";
    else if (utmSource) source = utmSource.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    else source = "Referral";
  }
  return { referrerHost, trafficSource: source, utmMedium, utmCampaign };
}

export default function PageViewTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef("");
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api") || pathname === lastTrackedPath.current) return;
    lastTrackedPath.current = pathname;

    const record = async () => {
      if (localStorage.getItem(CONSENT_KEY) !== "accepted") return;
      const sessionId = getSessionId();
      const { referrerHost, trafficSource, utmMedium, utmCampaign } = getTrafficDetails();
      const articleMatch = pathname.match(/^\/articles\/([^/]+)$/);
      const supabase = createClient();
      await supabase.from("page_views").insert({
        page_path: pathname.slice(0, 500),
        page_title: document.title.slice(0, 300),
        article_slug: articleMatch ? decodeURIComponent(articleMatch[1]).slice(0, 200) : null,
        referrer_host: referrerHost,
        traffic_source: trafficSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        session_id: sessionId
      });
    };

    const onConsent = () => { void record(); };
    if (localStorage.getItem(CONSENT_KEY) === "accepted") void record();
    window.addEventListener("paulnova-consent-updated", onConsent);
    return () => window.removeEventListener("paulnova-consent-updated", onConsent);
  }, [pathname]);
  return null;
}
