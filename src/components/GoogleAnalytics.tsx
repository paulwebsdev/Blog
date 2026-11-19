"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
export default function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  const [consented, setConsented] = useState(false);
  useEffect(() => {
    const sync = () => setConsented(localStorage.getItem("paulnova:analytics-consent") === "accepted");
    sync();
    window.addEventListener("paulnova-consent-updated", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("paulnova-consent-updated", sync); window.removeEventListener("storage", sync); };
  }, []);
  if (!id || !/^G-[A-Z0-9]+$/i.test(id) || !consented) return null;
  return <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive"/>
    <Script id="paulnova-google-analytics" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){window.dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', '${id}', { anonymize_ip: true });
    `}</Script>
  </>;
}
