import Link from "next/link";
import { cn } from "@/lib/utils";
import { SiteNav, type NavHref } from "@/components/site-nav";

function Bar({ active }: { active: NavHref }) {
  return (
    <>
      <Link href="/" className="text-lg font-bold tracking-tight">
        augustin marsollier
      </Link>
      <SiteNav active={active} />
    </>
  );
}

const BAR = "flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3";

// Barre blanche fixée en haut : nom à gauche, menu à droite. La copie invisible garde sa place dans la page.
export function SiteHeader({ active, className }: { active: NavHref; className?: string }) {
  return (
    <header className={className}>
      <div aria-hidden className={cn(BAR, "invisible")}>
        <Bar active={active} />
      </div>
      <div className={cn(BAR, "fixed inset-x-0 top-0 z-50 bg-background px-4 sm:px-6")}>
        <Bar active={active} />
      </div>
    </header>
  );
}
