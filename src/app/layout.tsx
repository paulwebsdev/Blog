import type { Metadata } from "next";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://paulnova.name.ng"),
  title: { default: "PaulNova — Technology. Intelligence. Opportunities.", template: "%s | PaulNova" },
  description: "Discover technology, understand artificial intelligence, explore digital business and money, and find education and career opportunities with PaulNova.",
  applicationName: "PaulNova",
  category: "technology",
  openGraph: {
    type: "website",
    siteName: "PaulNova",
    title: "PaulNova — Technology. Intelligence. Opportunities.",
    description: "Technology, AI, digital business, education and opportunities for a changing world.",
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: "PaulNova — Technology. Intelligence. Opportunities.",
    description: "Technology, AI, digital business, education and opportunities for a changing world."
  },
  robots: { index: true, follow: true },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } } : {})
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<GoogleAnalytics /></body></html>;
}
