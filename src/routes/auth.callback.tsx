import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { supabase } from "@/integrations/supabase/client";
import { oauthReturnPath } from "@/lib/oauth-return-path";
import { Button } from "@/components/ui/button";

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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let verifying = false;
    let completed = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const callbackError = new URLSearchParams(window.location.hash.slice(1)).get("error")
      ?? new URLSearchParams(window.location.search).get("error");

    const finish = async () => {
      if (!active || verifying || completed || callbackError) return;
      verifying = true;
      try {
        // Wait for the client's URL processing, then validate with the auth service.
        const { data, error } = await supabase.auth.getSession();
        if (!active || !data.session || error) return;
        const { data: identity, error: identityError } = await supabase.auth.getUser();
        if (!active) return;
        if (identityError || !identity.user) {
          setMessage("Votre session n’a pas pu être vérifiée. Veuillez vous reconnecter.");
          setFailed(true);
          return;
        }
        completed = true;
        await navigate({ to: next, replace: true });
      } catch {
        if (active) {
          setMessage("Le service de connexion ne répond pas. Veuillez réessayer.");
          setFailed(true);
        }
      } finally {
        verifying = false;
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Never call auth methods inside the synchronous auth-state callback.
      if (active && session) {
        clearTimeout(retryTimer);
        retryTimer = setTimeout(() => void finish(), 0);
      }
    });
    if (callbackError) {
      setMessage("Ce lien de connexion est expiré, invalide ou a été refusé. Reconnectez-vous ou renvoyez l’e-mail de confirmation.");
      setFailed(true);
    } else {
      void finish();
    }
    const timeout = setTimeout(() => {
      if (active && !completed) {
        setMessage("La connexion n’a pas été finalisée. Réessayez depuis la page de connexion.");
        setFailed(true);
      }
    }, 10000);

    return () => {
      active = false;
      clearTimeout(timeout);
      clearTimeout(retryTimer);
      listener.subscription.unsubscribe();
    };
  }, [navigate, next]);

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="panel w-full max-w-sm p-6 text-center">
        <div className="flex justify-center">
          <BrandLogo compact />
        </div>
        {!failed && <div className="mx-auto mt-6 h-7 w-7 animate-spin rounded-full border-2 border-border border-t-primary" />}
        <p className="mt-4 text-sm text-muted-foreground" role="status">
          {message}
        </p>
        {failed && (
          <Button className="mt-4" onClick={() => void navigate({ to: "/auth", search: { next }, replace: true })}>
            Retour à la connexion
          </Button>
        )}
      </div>
    </main>
  );
}