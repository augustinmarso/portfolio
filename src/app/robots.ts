import type { MetadataRoute } from "next";
import { absolute } from "@/lib/site";

// Export statique (GitHub Pages) : fichier généré une fois au build.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absolute("/sitemap.xml"),
  };
}
