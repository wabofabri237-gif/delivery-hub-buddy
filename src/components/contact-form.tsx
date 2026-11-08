import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { contactSchema } from "@/lib/contact-schema";
import { submitContact } from "@/lib/contact.functions";

export function ContactForm() {
  const submit = useServerFn(submitContact);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user))); }, []);
  return <section className="mt-10 border-t border-border pt-8" aria-labelledby="contact-heading">
    <h2 id="contact-heading" className="text-xl font-bold">Contacter l’assistance</h2>
    {signedIn === null ? <p role="status" className="mt-4">Chargement…</p> : !signedIn ?
      <Button asChild className="mt-4"><Link to="/auth" search={{ next: "/aide" }}>Se connecter pour envoyer une demande</Link></Button> :
      <form className="mt-5 space-y-4" onSubmit={async (event) => {
        event.preventDefault();
        if (pending) return;
        const form = event.currentTarget;
        const fields = Object.fromEntries(new FormData(form));
        const parsed = contactSchema.safeParse(fields);
        setSent(false); setError("");
        if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Vérifiez les champs"); return; }
        setPending(true);
        try { await submit({ data: parsed.data }); form.reset(); setSent(true); }
        catch (err) { setError(err instanceof Error ? err.message : "Impossible d’envoyer la demande"); }
        finally { setPending(false); }
      }}>
        {[{ name: "full_name", label: "Nom complet", type: "text", max: 120, min: 2 }, { name: "email", label: "E-mail de contact", type: "email", max: 254, min: 3 }, { name: "subject", label: "Objet", type: "text", max: 160, min: 3 }].map(field =>
          <div key={field.name}><label htmlFor={`contact-${field.name}`} className="block text-sm font-medium">{field.label}</label><input id={`contact-${field.name}`} name={field.name} type={field.type} required maxLength={field.max} minLength={field.min} disabled={pending} className="mt-2 w-full rounded-md border border-input bg-background px-3 py-3 text-foreground focus-visible:outline-2 focus-visible:outline-ring" /></div>)}
        <div><label htmlFor="contact-message" className="block text-sm font-medium">Message</label><textarea id="contact-message" name="message" required minLength={10} maxLength={4000} rows={5} disabled={pending} className="mt-2 w-full rounded-md border border-input bg-background px-3 py-3 text-foreground focus-visible:outline-2 focus-visible:outline-ring" /></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {sent && <p role="status" className="text-sm text-primary">Votre demande est enregistrée.</p>}
        <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Envoyer la demande"}</Button>
      </form>}
  </section>;
}