import Link from "next/link";
import { cn } from "@/lib/utils";
import { SiteNav, type NavHref } from "@/components/site-nav";

// En-tête commun, façon map project office : grand mot-symbole à gauche, menu à droite.
export function SiteHeader({
  active,
  size = "lg",
  className,
}: {
  active: NavHref;
  size?: "lg" | "md";
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap-reverse items-end justify-between gap-x-6 gap-y-3", className)}>
      <Link
        href="/"
        className={cn(
          "font-bold leading-[0.8] tracking-[-0.06em]",
          size === "lg" ? "text-[clamp(3.25rem,9vw,7.5rem)]" : "text-[clamp(2.5rem,5vw,4rem)]"
        )}
      >
        marsollier
      </Link>
      <div className="ml-auto">
        <SiteNav active={active} />
      </div>
    </header>
  );
}
