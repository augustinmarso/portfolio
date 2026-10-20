"use client";

import { Printer } from "lucide-react";

// Ouvre la fenêtre d'impression : « Enregistrer au format PDF » donne le CV en PDF.
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 border-y border-foreground py-1.5 text-lg font-semibold hover:bg-muted print:hidden"
    >
      <Printer className="size-4" />
      imprimer le cv (pdf)
    </button>
  );
}
