"use client";
import Script from "next/script";
export default function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id || !/^G-[A-Z0-9]+$/i.test(id)) return null;
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
