import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, User, Phone, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { BrandLogo } from "@/components/brand-logo";
import { oauthReturnPath } from "@/lib/oauth-return-path";

function friendlyAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (/failed to fetch|network|load failed|503|502|unavailable/i.test(msg)) {
    return "Le service de connexion est momentanément indisponible. Réessayez dans quelques instants.";
  }
  if (/invalid login credentials/i.test(msg)) return "E-mail ou mot de passe incorrect.";
  if (/email not confirmed/i.test(msg)) return "Confirmez d'abord votre e-mail (vérifiez votre boîte de réception).";
  if (/already registered|already exists/i.test(msg)) return "Un compte existe déjà avec cet e-mail. Connectez-vous.";
  if (/provider is not enabled|unsupported provider/i.test(msg)) {
    return "Ce mode de connexion n'est pas encore activé.";
  }
  return msg || "Une erreur est survenue.";
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: search["next"] === undefined ? "/mon-compte" : oauthReturnPath(search["next"]),
  }),
  head: () => ({
    meta: [
      { title: "Connexion & inscription — Shop Crew Hub" },
      {
        name: "description",
        content:
          "Créez votre compte Shop Crew Hub pour acheter, ouvrir une boutique ou devenir livreur certifié.",
      },
      { property: "og:title", content: "Connexion & inscription — Shop Crew Hub" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        property: "og:description",
        content: "Comptes client, vendeur et livreur sur la marketplace Shop Crew Hub.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
            data: { full_name: fullName.trim(), phone: phone.trim() },
          },
        });
        if (err) throw err;
        if (!data.session) {
          setInfo("Compte créé. Vérifiez votre e-mail pour confirmer votre inscription.");
          return;
        }
        await navigate({ to: next });
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        await navigate({ to: next });
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) {
        setError(friendlyAuthError(result.error));
        return;
      }
      if (result.redirected) return;
      await navigate({ to: next });
    } catch (err) {
      setError(friendlyAuthError(err));
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <BrandLogo compact />
        </div>

        <div className="panel hero-surface mt-6 p-6">
          <h1 className="text-2xl font-bold">
            {mode === "login" ? "Connexion" : "Créer un compte"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Un seul compte pour acheter, vendre ou livrer.
          </p>

          <button
            type="button"
            onClick={onGoogle}
            className="mt-6 w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium"
          >
            Continuer avec Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <>
                <Field icon={User} label="Nom complet">
                  <input
                    required
                    maxLength={120}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full min-w-0 bg-transparent text-sm outline-none"
                  />
                </Field>
                <Field icon={Phone} label="Téléphone">
                  <input
                    required
                    maxLength={20}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="6XX XXX XXX"
                    className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </Field>
              </>
            )}
            <Field icon={Mail} label="E-mail">
              <input
                required
                type="email"
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-w-0 bg-transparent text-sm outline-none"
              />
            </Field>
            <Field icon={Lock} label="Mot de passe">
              <input
                required
                type="password"
                minLength={8}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full min-w-0 bg-transparent text-sm outline-none"
              />
            </Field>

            {error && <p className="text-xs text-destructive">{error}</p>}
            {info && <p className="text-xs text-primary">{info}</p>}

            <button
              type="submit"
              disabled={busy}
              className="mint-surface glow flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {mode === "login" ? "Se connecter" : "Créer mon compte"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            {mode === "login" ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
                setInfo(null);
              }}
              className="text-primary underline-offset-4 hover:underline"
            >
              {mode === "login" ? "Créer un compte" : "Se connecter"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-input/60 px-3 py-2.5">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        {children}
      </span>
    </label>
  );
}
