"use client";
import Script from "next/script";

/**
 * AdSense stays disabled until the publisher has completed account setup,
 * configured Google's certified consent messaging where required, and
 * deliberately enabled the integration in Render.
 */
export default function AdSenseScript() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const enabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLE === "true";
  if (!enabled || !client || !/^ca-pub-\d{16}$/.test(client)) return null;
  return <Script
    id="paulnova-adsense"
    async
    strategy="afterInteractive"
    crossOrigin="anonymous"
    src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
  />;
}
