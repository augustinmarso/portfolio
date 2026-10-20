import Link from "next/link";
import { ReaderModeToggle } from "@/components/reader-mode";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "index" },
  { href: "/arborescence", label: "arborescence" },
  { href: "/cv", label: "cv" },
  { href: "/contact", label: "contact" },
] as const;

export type NavHref = (typeof LINKS)[number]["href"] | null;

// Navigation en minuscules, l'onglet actif en noir, les autres en gris.
export function SiteNav({ active }: { active: NavHref }) {
  return (
    <nav className="flex flex-wrap gap-x-5 gap-y-1 text-lg font-semibold tracking-tight">
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
      <ReaderModeToggle />
    </nav>
  );
}
