import type { Metadata } from "next";
import { SmoothScroll } from "@/components/smooth-scroll";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, ogImage } from "@/lib/site";
import "./globals.css";

// Scoutie Sans (Google Fonts, août 2026) n'est pas encore dans la liste de next/font :
// chargée par la feuille de style Google, variable 200–800.
const FONT_CSS =
  "https://fonts.googleapis.com/css2?family=Scoutie+Sans:ital,wght@0,200..800;1,200..800&display=swap";

export const metadata: Metadata = {
  metadataBase: new URL(`${SITE_URL}/`),
  title: { default: "Augustin Marsollier — designer objet et service, portfolio", template: "%s — Augustin Marsollier" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  keywords: [
    "Augustin Marsollier",
    "designer objet",
    "design de service",
    "design produit",
    "DSAA",
    "DN MADE",
    "ENSAAMA",
    "portfolio design",
    "Paris",
  ],
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE_NAME,
    url: `${SITE_URL}/`,
    title: "Augustin Marsollier — designer objet et service",
    description: SITE_DESCRIPTION,
    images: [{ url: ogImage(), width: 1200, height: 630, alt: "Portfolio d'Augustin Marsollier" }],
  },
  twitter: { card: "summary_large_image", title: "Augustin Marsollier — designer objet et service", description: SITE_DESCRIPTION, images: [ogImage()] },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONT_CSS} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <SmoothScroll />
      </body>
    </html>
  );
}
