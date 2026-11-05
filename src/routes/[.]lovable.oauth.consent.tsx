import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "" }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Demande d’autorisation manquante.");
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error("La connexion n’a pas pu être vérifiée.");
    if (!data.session) throw redirect({ to: "/auth", search: { next: location.pathname + location.searchStr + location.hash } });
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.searchStr).get("authorization_id");
    if (!id) throw new Error("Demande d’autorisation manquante.");
    const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(id);
    if (error || !data) throw new Error("Cette demande est invalide, expirée ou indisponible. Relancez la connexion depuis votre agent.");
    if ("redirect_url" in data) throw redirect({ href: data.redirect_url });
    return data;
  },
  head: () => ({ meta: [{ title: "Autoriser un agent — Shop Crew Hub" }, { name: "description", content: "Autorisez ou refusez l’accès sécurisé d’un agent à votre compte Shop Crew Hub." }, { property: "og:title", content: "Autoriser un agent — Shop Crew Hub" }, { property: "og:description", content: "Contrôlez l’accès des agents à votre compte." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  pendingComponent: () => <main className="grid min-h-screen place-items-center"><p role="status">Vérification de l’autorisation…</p></main>,
  errorComponent: ({ error }) => <main className="mx-auto max-w-lg px-5 py-16"><BrandLogo /><h1 className="mt-8 text-2xl font-bold">Autorisation indisponible</h1><p role="alert" className="mt-4 text-muted-foreground">{error instanceof Error ? error.message : "Cette demande n’a pas pu être vérifiée."}</p><Button asChild variant="outline" className="mt-6"><Link to="/">Retour à Shop Crew Hub</Link></Button></main>,
  component: ConsentPage,
});

function ConsentPage() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function decide(approve: boolean) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const result = approve ? await supabase.auth.oauth.approveAuthorization(authorization_id, { skipBrowserRedirect: true }) : await supabase.auth.oauth.denyAuthorization(authorization_id, { skipBrowserRedirect: true });
      if (result.error || !result.data?.redirect_url) throw new Error("L’autorisation n’a pas abouti. Réessayez ou relancez la connexion depuis l’agent.");
      window.location.assign(result.data.redirect_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion indisponible."); setBusy(false);
    }
  }
  return <main className="mx-auto max-w-lg px-5 py-12"><BrandLogo /><ShieldCheck className="mt-10 h-9 w-9 text-primary" aria-hidden /><h1 className="mt-4 text-2xl font-bold">Autoriser {details.client.name || "cet agent"} ?</h1><p className="mt-4 text-muted-foreground">Cet agent pourra consulter le catalogue et les statuts de vos propres commandes. Il ne pourra ni payer, ni passer commande, ni modifier une livraison.</p><dl className="my-6 space-y-3 border-y border-border py-5 text-sm"><div><dt className="text-muted-foreground">Application</dt><dd className="break-all">{details.client.name}</dd></div><div><dt className="text-muted-foreground">Autorisations demandées</dt><dd className="break-all">{details.scope}</dd></div></dl>{error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}<div className="flex gap-3"><Button disabled={busy} onClick={() => void decide(true)}><Check aria-hidden />Autoriser</Button><Button disabled={busy} variant="outline" onClick={() => void decide(false)}><X aria-hidden />Refuser</Button></div></main>;
}