import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://paulnova.name.ng"),
  title: {
    default: "PaulNova — Technology. Intelligence. Opportunities.",
    template: "%s | PaulNova"
  },
  description: "Discover technology, understand AI, explore digital business and find opportunities with PaulNova.",
  applicationName: "PaulNova",
  openGraph: {
    type: "website",
    siteName: "PaulNova",
    title: "PaulNova — Technology. Intelligence. Opportunities.",
    description: "Technology, AI, digital business and opportunities for a changing world."
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
