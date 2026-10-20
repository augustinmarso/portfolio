import Link from "next/link";
import { cn } from "@/lib/utils";
import { SiteNav, type NavHref } from "@/components/site-nav";

// En-tête commun, façon map project office : grand mot-symbole à gauche, menu à droite.
export function SiteHeader({
  active,
  size = "lg",
  wordmark = true,
  className,
}: {
  active: NavHref;
  size?: "lg" | "md";
  wordmark?: boolean;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap-reverse items-end justify-between gap-x-6 gap-y-3", className)}>
      {wordmark && (
        <Link
          href="/"
          className={cn(
            "font-bold leading-[0.8] tracking-[-0.06em]",
            size === "lg" ? "text-[clamp(3.25rem,9vw,7.5rem)]" : "text-[clamp(2.5rem,5vw,4rem)]"
          )}
        >
          marsollier
        </Link>
      )}
      {/* Le menu reste fixé en haut à droite au défilement ; la copie invisible garde sa place dans l'en-tête. */}
      <div className="ml-auto">
        <div aria-hidden className="invisible">
          <SiteNav active={active} />
        </div>
        <div className="fixed right-2 top-3 z-50 bg-background/85 px-2 py-1 backdrop-blur-sm sm:right-4">
          <SiteNav active={active} />
        </div>
      </div>
    </header>
  );
}
