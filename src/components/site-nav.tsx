import Link from "next/link";
import { MEET } from "@/lib/socials";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "index" },
  { href: "/cv", label: "cv" },
  { href: "/contact", label: "contact" },
] as const;

export type NavHref = (typeof LINKS)[number]["href"] | null;

// Navigation en minuscules, l'onglet actif en noir, les autres en gris.
export function SiteNav({ active }: { active: NavHref }) {
  return (
    <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-lg font-semibold tracking-tight">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={l.href === active ? "page" : undefined}
          className={cn(
            "transition-colors",
            l.href === active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l.label}
        </Link>
      ))}
      {/* Petit bouton d'appel : ouvre la salle Google Meet */}
      <a
        href={MEET}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-foreground px-2.5 py-0.5 text-sm transition-colors hover:bg-foreground hover:text-background"
      >
        <span className="size-1.5 rounded-full bg-green-500" aria-hidden />
        appel
      </a>
    </nav>
  );
}
