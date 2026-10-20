"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Envoi direct par Formspree quand l'identifiant du formulaire est renseigné ;
// sinon, repli sur la messagerie du visiteur (mailto pré-rempli).
export function ContactForm({ email, formspreeId }: { email: string; formspreeId?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (!formspreeId) {
      const subject = `Contact portfolio — ${data.get("name")}`;
      const body = `${data.get("message")}\n\n${data.get("name")} — ${data.get("email")}`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return;
    }
    setState("sending");
    try {
      const res = await fetch(`https://formspree.io/f/${formspreeId}`, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      setState("sent");
    } catch {
      setState("error");
    }
  }

  const field = "w-full border-b border-foreground/25 bg-transparent py-2 font-normal outline-none placeholder:text-muted-foreground focus:border-foreground";

  return (
    <form onSubmit={onSubmit} className="mt-6 grid max-w-xl gap-4 text-base sm:text-lg">
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" required placeholder="nom" autoComplete="name" className={field} />
        <input name="email" type="email" required placeholder="votre e-mail" autoComplete="email" className={field} />
      </div>
      <textarea name="message" required rows={4} placeholder="votre message" className={cn(field, "resize-none")} />
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={state === "sending"}
          className="rounded-sm bg-foreground px-4 py-1.5 text-background transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {state === "sending" ? "envoi…" : "envoyer"}
        </button>
        <p className="text-sm font-medium text-muted-foreground" aria-live="polite">
          {state === "sent" && "message envoyé, merci !"}
          {state === "error" && (
            <>
              l&apos;envoi a échoué — écrivez directement à{" "}
              <a href={`mailto:${email}`} className="underline">
                {email}
              </a>
            </>
          )}
        </p>
      </div>
    </form>
  );
}
