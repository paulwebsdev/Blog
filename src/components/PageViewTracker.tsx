"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const CONSENT_KEY = "paulnova:analytics-consent";
const SESSION_KEY = "paulnova:analytics-session";
const SESSION_TIME_KEY = "paulnova:analytics-last-seen";
const ATTRIBUTION_KEY = "paulnova:analytics-attribution";
const SESSION_TIMEOUT = 30 * 60 * 1000;

function getSessionContext() {
  const now = Date.now();
  const lastSeen = Number(localStorage.getItem(SESSION_TIME_KEY) || 0);
  let id = localStorage.getItem(SESSION_KEY);
  if (!id || !lastSeen || now - lastSeen > SESSION_TIMEOUT) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
    localStorage.removeItem(ATTRIBUTION_KEY);
  }
  localStorage.setItem(SESSION_TIME_KEY, String(now));
  let attribution: ReturnType<typeof getTrafficDetails>;
  try {
    const saved = localStorage.getItem(ATTRIBUTION_KEY);
    attribution = saved ? JSON.parse(saved) as ReturnType<typeof getTrafficDetails> : getTrafficDetails();
  } catch {
    attribution = getTrafficDetails();
  }
  localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  return { sessionId: id, ...attribution };
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

    const consented = () => localStorage.getItem(CONSENT_KEY) === "accepted";
    const articleMatch = pathname.match(/^\/articles\/([^/]+)$/);
    const articleSlug = articleMatch ? decodeURIComponent(articleMatch[1]).slice(0, 200) : null;
    let supabasePromise: Promise<ReturnType<typeof import("@/lib/supabase/client").createClient>> | null = null;
    const getSupabase = () => {
      if (!supabasePromise) {
        supabasePromise = import("@/lib/supabase/client").then(({ createClient }) => createClient());
      }
      return supabasePromise;
    };
    const record = async (eventType: string, eventValue: string | null = null, durationSeconds: number | null = null) => {
      if (!consented()) return;
      const { sessionId, referrerHost, trafficSource, utmMedium, utmCampaign } = getSessionContext();
      const supabase = await getSupabase();
      await supabase.from("page_views").insert({
        page_path: pathname.slice(0, 500),
        page_title: document.title.slice(0, 300),
        article_slug: articleSlug,
        referrer_host: referrerHost,
        traffic_source: trafficSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        session_id: sessionId,
        event_type: eventType,
        event_value: eventValue?.slice(0, 100) || null,
        duration_seconds: durationSeconds
      });
    };

    const onConsent = () => { activeSince = Date.now(); void record("page_view"); };
    const onCustomEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ eventType?: string; eventValue?: string }>).detail;
      if (!detail?.eventType || !["bookmark_add", "bookmark_remove", "share_click", "outbound_click"].includes(detail.eventType)) return;
      void record(detail.eventType, detail.eventValue || null);
    };
    if (consented()) void record("page_view");
    window.addEventListener("paulnova-consent-updated", onConsent);
    window.addEventListener("paulnova-analytics-event", onCustomEvent);

    let activeSince = Date.now();
    let accumulatedSeconds = 0;
    let flushedSeconds = 0;
    let sent50Percent = false;
    let sent90Percent = false;
    const flushReadingTime = () => {
      if (!articleSlug || !consented()) return;
      if (document.visibilityState === "visible") accumulatedSeconds += Math.max(0, Math.round((Date.now() - activeSince) / 1000));
      activeSince = Date.now();
      const unreported = accumulatedSeconds - flushedSeconds;
      if (unreported >= 5) {
        flushedSeconds = accumulatedSeconds;
        void record("reading_time", null, unreported);
      }
    };
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin === window.location.origin) return;
        if (/facebook\.com|whatsapp|twitter\.com|x\.com|linkedin\.com|t\.me/.test(url.hostname)) return;
        void record("outbound_click", url.hostname);
      } catch { /* Ignore invalid link targets. */ }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushReadingTime();
      else activeSince = Date.now();
    };
    const onScroll = () => {
      if (!articleSlug || !consented()) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const depth = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
      if (depth >= 50 && !sent50Percent) {
        sent50Percent = true;
        void record("scroll_depth", "50");
      }
      if (depth >= 90 && !sent90Percent) {
        sent90Percent = true;
        void record("scroll_depth", "90");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      flushReadingTime();
      window.removeEventListener("paulnova-consent-updated", onConsent);
      window.removeEventListener("paulnova-analytics-event", onCustomEvent);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);
  return null;
}
