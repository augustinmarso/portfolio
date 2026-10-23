import type { MetadataRoute } from "next";
import { projects } from "@/lib/projects";
import { absolute, ogImage } from "@/lib/site";

// Généré au build (fichier statique /sitemap.xml), à déclarer dans Google Search Console.
// Export statique (GitHub Pages) : fichier généré une fois au build.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: absolute("/"), lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: absolute("/processus/"), lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: absolute("/pourquoi/"), lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: absolute("/cv/"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absolute("/contact/"), lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    ...projects.map((p) => ({
      url: absolute(`/projets/${p.slug}/`),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.8,
      images: [ogImage(p.slug)],
    })),
    ...projects
      .filter((p) => p.text?.processus?.length)
      .map((p) => ({
        url: absolute(`/projets/${p.slug}/processus/`),
        lastModified: now,
        changeFrequency: "yearly" as const,
        priority: 0.6,
      })),
  ];
}
