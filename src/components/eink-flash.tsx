"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Au changement de page : flash noir puis blanc, comme le rafraîchissement d'un écran à encre.
export function EinkFlash() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = document.createElement("div");
    el.className = "eink-flash";
    document.body.appendChild(el);
    const t = setTimeout(() => el.remove(), 360);
    return () => {
      clearTimeout(t);
      el.remove();
    };
  }, [pathname]);
  return null;
}
