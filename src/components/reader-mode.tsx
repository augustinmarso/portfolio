"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

const KEY = "portfolio:mode";

// Lu avant le premier rendu (script dans <head>) pour éviter un flash du mauvais thème.
export const READER_MODE_SCRIPT = `try{if(localStorage.getItem("${KEY}")==="liseuse")document.documentElement.dataset.mode="liseuse"}catch(e){}`;

export const isReaderMode = () =>
  typeof document !== "undefined" && document.documentElement.dataset.mode === "liseuse";

const subscribe = (cb: () => void) => {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
  return () => obs.disconnect();
};

export function ReaderModeToggle() {
  const on = useSyncExternalStore(subscribe, isReaderMode, () => false);
  const toggle = () => {
    const next = !on;
    if (next) document.documentElement.dataset.mode = "liseuse";
    else delete document.documentElement.dataset.mode;
    try {
      localStorage.setItem(KEY, next ? "liseuse" : "ecran");
    } catch {}
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      className={on ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
    >
      liseuse
    </button>
  );
}

// Au changement de page en mode liseuse : flash noir/blanc comme un écran à encre.
export function EinkFlash() {
  const pathname = usePathname();
  useEffect(() => {
    if (!isReaderMode()) return;
    const el = document.createElement("div");
    el.className = "eink-flash";
    document.body.appendChild(el);
    const t = setTimeout(() => el.remove(), 300);
    return () => {
      clearTimeout(t);
      el.remove();
    };
  }, [pathname]);
  return null;
}
