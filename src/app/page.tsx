import Link from "next/link";
import { firstVisible } from "@/lib/canvas-layout";
import { HomeViews } from "@/components/home-views";
import { SiteHeader } from "@/components/site-header";
import { projects } from "@/lib/projects";
import { jsonLd, PERSON, SITE_DESCRIPTION } from "@/lib/site";

export default function Home() {
  // Les vignettes de l'index sont dessinées en JavaScript : on précharge dès le HTML celles
  // visibles à l'arrivée, sur ordinateur et sur téléphone. Balises <link> plutôt que preload() :
  // les indices de preload() repartent à chaque préchargement de l'accueil depuis une autre page.
  const preloads = (
    [
      [1440, 900, "(min-width: 640px)"],
      [390, 844, "(max-width: 639px)"],
    ] as const
  ).flatMap(([vw, vh, media]) => firstVisible(projects, vw, vh).map((p) => ({ href: p.cover.src, media })));

  return (
    <main className="relative h-dvh overflow-hidden" data-lenis-prevent>
      {preloads.map((l) => (
        <link key={l.href + l.media} rel="preload" as="image" href={l.href} media={l.media} fetchPriority="high" />
      ))}
      {/* Pour les moteurs de recherche et les lecteurs d'écran : l'index est sinon dessiné en JavaScript. */}
      <div className="sr-only">
        <h1>Augustin Marsollier — designer objet et service, portfolio</h1>
        <p>{SITE_DESCRIPTION}</p>
        <nav aria-label="Projets">
          <ul>
            {projects.map((p) => (
              <li key={p.slug}>
                <Link href={`/projets/${p.slug}`} prefetch={false}>
                  {p.title}
                </Link>
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
