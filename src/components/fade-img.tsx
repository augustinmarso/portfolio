"use client";

import { useEffect, useRef, useState } from "react";
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
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Image déjà en cache : l'événement load a pu partir avant l'hydratation.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <span
      className={cn(
        "block transition-[border-color] duration-500",
        fill && "absolute inset-0",
        // cadre très léger tant que l'image n'est pas arrivée
        loaded ? "border-transparent" : "border border-foreground/10",
        frameClassName
      )}
      style={!fill && width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- export statique, variantes fournies à la main */}
      <img
        ref={ref}
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
        onLoad={() => setLoaded(true)}
        className={cn(
          "transition-opacity duration-700 ease-out",
          loaded ? "opacity-100" : "opacity-0",
          fill ? "size-full" : "h-auto w-full",
          className
        )}
      />
    </span>
  );
}
