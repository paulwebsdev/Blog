import type { Metadata } from "next";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import AdSenseScript from "@/components/AdSenseScript";
import CookieConsent from "@/components/CookieConsent";
import NewsletterPopup from "@/components/NewsletterPopup";
import PageViewTracker from "@/components/PageViewTracker";
import SocialLinks from "@/components/SocialLinks";
import SiteStructuredData from "@/components/SiteStructuredData";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  let verification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  let logoUrl: string | undefined;
  let faviconUrl: string | undefined;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("site_settings").select("google_site_verification,logo_url,favicon_url").eq("id", 1).maybeSingle();
    verification = data?.google_site_verification || verification;
    logoUrl = data?.logo_url || undefined;
    faviconUrl = data?.favicon_url || undefined;
  } catch { /* The site remains renderable if settings are temporarily unavailable. */ }
  return {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://paulnova.name.ng"),
  title: { default: "PaulNova — Technology. Intelligence. Opportunities.", template: "%s | PaulNova" },
  description: "Discover technology, understand artificial intelligence, explore digital business and money, and find education and career opportunities with PaulNova.",
  applicationName: "PaulNova",
  other: { "google-adsense-account": "ca-pub-6344993046281105" },
  category: "technology",
  openGraph: {
    type: "website",
    siteName: "PaulNova",
    title: "PaulNova — Technology. Intelligence. Opportunities.",
    description: "Technology, AI, digital business, education and opportunities for a changing world.",
    locale: "en_US",
    ...(logoUrl ? { images: [{ url: logoUrl, alt: "PaulNova — Technology. Intelligence. Opportunities." }] } : {})
  },
  ...(faviconUrl ? { icons: { icon: [{ url: faviconUrl }], shortcut: [{ url: faviconUrl }], apple: [{ url: faviconUrl }] } } : {}),
  twitter: {
    card: "summary_large_image",
    title: "PaulNova — Technology. Intelligence. Opportunities.",
    description: "Technology, AI, digital business, education and opportunities for a changing world.",
    ...(logoUrl ? { images: [logoUrl] } : {})
  },
  robots: { index: true, follow: true },
  ...(verification ? { verification: { google: verification } } : {})
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<SiteStructuredData /><SocialLinks /><GoogleAnalytics /><AdSenseScript /><PageViewTracker /><CookieConsent /><NewsletterPopup /></body></html>;
}
