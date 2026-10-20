"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// L'arborescence est devenue un mode de l'index : l'ancienne adresse y renvoie.
export default function ArborescencePage() {
  const router = useRouter();
  useEffect(() => router.replace("/?vue=arborescence"), [router]);
  return null;
}
