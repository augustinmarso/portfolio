import Link from "next/link";
import { SoundToggle } from "@/components/ui-sounds";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "index" },
  { href: "/pourquoi", label: "pourquoi" },
  { href: "/cv", label: "cv" },
  { href: "/contact", label: "contact" },
] as const;

export type NavHref = (typeof LINKS)[number]["href"] | null;

// Navigation en minuscules, l'onglet actif en noir, les autres en gris.
export function SiteNav({ active }: { active: NavHref }) {
  return (
    <nav data-sound="barre" className="flex flex-wrap gap-x-5 gap-y-1 text-lg font-semibold tracking-tight">
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
      <SoundToggle className="-mx-1 self-center" />
    </nav>
  );
}
