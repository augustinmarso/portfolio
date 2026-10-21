import type { Metadata } from "next";
import { LoadingScreen } from "@/components/loading-screen";
import { SmoothScroll } from "@/components/smooth-scroll";
import { UiSounds } from "@/components/ui-sounds";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, ogImage } from "@/lib/site";
import "./globals.css";

// Scoutie Sans est hébergée sur le site (globals.css, fichiers dans src/app/fonts).

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
      <body className="min-h-full flex flex-col">
        <LoadingScreen />
        {children}
        <SmoothScroll />
        <UiSounds />
      </body>
    </html>
  );
}
