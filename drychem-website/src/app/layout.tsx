import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "lenis/dist/lenis.css";
import "./globals.css";
import { archivo, jetbrains } from "./fonts";
import { brand } from "@/config/brand";
import { site } from "@/config/site";
import { company, contact } from "@/content/company";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { TransitionProvider } from "@/components/motion/TransitionProvider";
import { Preloader } from "@/components/motion/Preloader";
import { Cursor } from "@/components/motion/Cursor";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: "%s — DRYCHEM" },
  description: site.description,
  applicationName: company.name,
  openGraph: {
    type: "website",
    siteName: company.name,
    title: site.title,
    description: site.description,
    url: "/",
    images: [
      {
        url: "/media/og.jpg",
        width: 1200,
        height: 630,
        alt: `${brand.name} logo and the headline “Engineering excellence. Built to last.”`,
      },
    ],
  },
  twitter: { card: "summary_large_image", title: site.title, description: site.description, images: ["/media/og.jpg"] },
  icons: { icon: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }] },
  // Preview deployments set SITE_NOINDEX=1 at build time to stay out of search results.
  robots: process.env.SITE_NOINDEX === "1" ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#111313",
  colorScheme: "dark",
};

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: company.legalName,
  alternateName: company.name,
  url: company.officialSite,
  email: contact.salesEmail.display,
  telephone: "+91-22-46134613",
  founder: { "@type": "Person", name: company.founder },
  address: {
    "@type": "PostalAddress",
    streetAddress: "Plot No. A-246, TTC Industrial Area, M.I.D.C., Mahape",
    addressLocality: "Navi Mumbai",
    postalCode: "400701",
    addressRegion: "Maharashtra",
    addressCountry: "IN",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks JS availability before first paint so motion-only styles never hide content without JS. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <noscript>
          <style>{".preloader{display:none!important}"}</style>
        </noscript>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SmoothScroll />
        <TransitionProvider>
          <Preloader />
          <SiteHeader />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <SiteFooter />
        </TransitionProvider>
        <Cursor />
      </body>
    </html>
  );
}
