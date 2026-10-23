"use client";

import { cn } from "@/lib/utils";

// Image qui apparaît en fondu dès qu'elle est chargée : la page s'affiche tout de suite
// (cadres et textes), les images arrivent ensuite une à une.
// `sm` : variante légère (1000 px) proposée au navigateur pour les petits écrans.
export function FadeImg({
  src,
  sm,
  alt,
  width,
  height,
  sizes,
  fill,
  priority,
  className,
  frameClassName,
}: {
  src: string;
  sm?: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  frameClassName?: string;
}) {
  // Chargement marqué directement sur l'élément (data-loaded) plutôt que dans un état React :
  // des centaines d'images à l'index, chacune aurait déclenché un nouveau rendu.
  const markLoaded = (img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) img.dataset.loaded = "";
  };

  return (
    <span
      className={cn(
        "block border border-foreground/10 transition-[border-color] duration-500",
        fill && "absolute inset-0",
        // cadre très léger tant que l'image n'est pas arrivée
        "has-[img[data-loaded]]:border-transparent",
        frameClassName
      )}
      style={!fill && width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- export statique, variantes fournies à la main */}
      <img
        ref={markLoaded} // image déjà en cache : l'événement load a pu partir avant l'hydratation
        src={src}
        srcSet={sm ? `${sm} 1000w, ${src} ${Math.max(width ?? 2000, 1001)}w` : undefined}
        sizes={sm ? sizes : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        draggable={false}
        onLoad={(e) => (e.currentTarget.dataset.loaded = "")}
        className={cn(
          "opacity-0 transition-opacity duration-700 ease-out data-loaded:opacity-100",
          fill ? "size-full" : "h-auto w-full",
          className
        )}
      />
    </span>
  );
}
