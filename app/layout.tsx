import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SITE } from "@/lib/site";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Analytics } from "@/components/site/Analytics";

// Self-hosted (latin, variable weight) so the build never depends on Google Fonts.
const display = localFont({
  src: "./fonts/schibsted-grotesk-latin.woff2",
  weight: "700 900",
  variable: "--font-display",
  display: "swap",
});

const body = localFont({
  src: "./fonts/public-sans-latin.woff2",
  weight: "400 700",
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.tagline} | ${SITE.name}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  metadataBase: new URL(SITE.url),
  openGraph: {
    title: `${SITE.tagline} | ${SITE.name}`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
  },
  icons: { icon: "/favicon.svg" },
  verification: { other: { "msvalidate.01": "040AC4CD5424E6882D57BD37C15AE402" } },
};

export const viewport: Viewport = {
  themeColor: "#0E3527",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-navy antialiased">
        <SiteHeader />
        <main className="min-h-[60vh]">{children}</main>
        <SiteFooter />
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: SITE.name,
              url: SITE.url,
              logo: `${SITE.url}/favicon.svg`,
            }),
          }}
        />
      </body>
    </html>
  );
}
