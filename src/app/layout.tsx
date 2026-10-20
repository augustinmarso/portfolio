import type { Metadata } from "next";
import { EinkFlash } from "@/components/eink-flash";
import "./globals.css";

// Scoutie Sans (Google Fonts, août 2026) n'est pas encore dans la liste de next/font :
// chargée par la feuille de style Google, variable 200–800.
const FONT_CSS =
  "https://fonts.googleapis.com/css2?family=Scoutie+Sans:ital,wght@0,200..800;1,200..800&display=swap";

export const metadata: Metadata = {
  title: "Augustin Marsollier — Portfolio",
  description: "Design d'objet et de service — projets.",
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
        <EinkFlash />
      </body>
    </html>
  );
}
