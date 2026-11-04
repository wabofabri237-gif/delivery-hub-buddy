import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { supabase } from "@/integrations/supabase/client";
import { oauthReturnPath } from "@/lib/oauth-return-path";

function safeNext(value: unknown): string {
  return value === undefined ? "/mon-compte" : oauthReturnPath(value);
}

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>) => ({ next: safeNext(search["next"]) }),
  head: () => ({
    meta: [
      { title: "Connexion en cours — Shop Crew Hub" },
      {
        name: "description",
        content: "Finalisation sécurisée de votre connexion à Shop Crew Hub.",
      },
      { property: "og:title", content: "Connexion — Shop Crew Hub" },
      {
        property: "og:description",
        content: "Finalisation sécurisée de votre connexion à Shop Crew Hub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [message, setMessage] = useState("Connexion en cours…");

  useEffect(() => {
    let active = true;

    const finish = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) {
        setMessage("La connexion n’a pas pu être finalisée. Veuillez réessayer.");
        return;
      }
      if (data.session) {
        await navigate({ to: next, replace: true });
        return;
      }
      setMessage("Session introuvable. Retour à la page de connexion…");
      window.setTimeout(() => {
        if (active) void navigate({ to: "/auth", search: { next }, replace: true });
      }, 1200);
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) void navigate({ to: next, replace: true });
    });
    void finish();

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [navigate, next]);

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="panel w-full max-w-sm p-6 text-center">
        <div className="flex justify-center">
          <BrandLogo compact />
        </div>
        <div className="mx-auto mt-6 h-7 w-7 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="mt-4 text-sm text-muted-foreground" role="status">
          {message}
        </p>
      </div>
    </main>
  );
}