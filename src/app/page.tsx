import Link from "next/link";
import { HomeViews } from "@/components/home-views";
import { SiteHeader } from "@/components/site-header";
import { projects } from "@/lib/projects";
import { jsonLd, PERSON, SITE_DESCRIPTION } from "@/lib/site";

export default function Home() {
  return (
    <main className="relative h-dvh overflow-hidden" data-lenis-prevent>
      {/* Pour les moteurs de recherche et les lecteurs d'écran : l'index est sinon dessiné en JavaScript. */}
      <div className="sr-only">
        <h1>Augustin Marsollier — designer objet et service, portfolio</h1>
        <p>{SITE_DESCRIPTION}</p>
        <nav aria-label="Projets">
          <ul>
            {projects.map((p) => (
              <li key={p.slug}>
                <Link href={`/projets/${p.slug}`}>{p.title}</Link>
                {p.text?.year && ` (${p.text.year})`}
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(PERSON) }} />

      <HomeViews projects={projects} />

      <SiteHeader active="/" />
    </main>
  );
}
