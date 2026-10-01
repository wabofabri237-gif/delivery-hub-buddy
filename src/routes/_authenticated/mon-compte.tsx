import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Store, Bike, ShieldCheck, Clock, XCircle, CheckCircle2 } from "lucide-react";
import { SpaceNav } from "@/components/space-nav";
import { getMyAccess, submitApplication } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/mon-compte")({
  head: () => ({
    meta: [
      { title: "Mon compte — Shop Crew Hub" },
      {
        name: "description",
        content:
          "Gérez votre compte Shop Crew Hub : rôles, demande de boutique vendeur et certification livreur.",
      },
      { property: "og:title", content: "Mon compte — Shop Crew Hub" },
      {
        property: "og:description",
        content: "Rôles, boutique vendeur et certification livreur sur Shop Crew Hub.",
      },
    ],
  }),
  component: AccountPage,
});

const statusMeta = {
  en_attente: { label: "En attente de validation", Icon: Clock, tone: "text-warning" },
  approuvee: { label: "Approuvée", Icon: CheckCircle2, tone: "text-primary" },
  rejetee: { label: "Rejetée", Icon: XCircle, tone: "text-destructive" },
} as const;

function AccountPage() {
  const fetchAccess = useServerFn(getMyAccess);
  const { data, isLoading } = useQuery({ queryKey: ["my-access"], queryFn: () => fetchAccess() });
  const [openForm, setOpenForm] = useState<"vendeur" | "livreur" | null>(null);

  const roles = data?.roles ?? [];

  return (
    <div className="min-h-screen">
      <SpaceNav />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Mon compte</h1>
        <p className="mt-1 truncate text-xs text-muted-foreground">{data?.email}</p>

        <section className="panel mt-6 p-5">
          <h2 className="text-base font-bold">Mes accès</h2>
          {isLoading ? (
            <p className="mt-3 text-xs text-muted-foreground">Chargement…</p>
          ) : (
            <ul className="mt-4 flex flex-wrap gap-2">
              {roles.map((r) => (
                <li
                  key={r}
                  className="mint-surface rounded-full px-3 py-1 text-xs font-semibold capitalize"
                >
                  {r}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {roles.includes("admin") && (
              <Link to="/admin" className="rounded-lg border border-border bg-surface px-3 py-2 text-xs">
                Console administrateur
              </Link>
            )}
            {roles.includes("vendeur") && (
              <Link to="/vendeur" className="rounded-lg border border-border bg-surface px-3 py-2 text-xs">
                Espace vendeur
              </Link>
            )}
            {roles.includes("livreur") && (
              <Link to="/livreur" className="rounded-lg border border-border bg-surface px-3 py-2 text-xs">
                Espace livreur
              </Link>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <RoleCard
            icon={Store}
            title="Ouvrir ma boutique"
            text="Vendez vos produits sous votre propre boutique, après validation de l'administrateur."
            active={roles.includes("vendeur")}
            activeLabel="Boutique validée"
            onClick={() => setOpenForm(openForm === "vendeur" ? null : "vendeur")}
          />
          <RoleCard
            icon={Bike}
            title="Devenir livreur"
            text="Inscrivez-vous puis attendez la certification de l'administrateur pour accéder aux courses."
            active={roles.includes("livreur")}
            activeLabel="Livreur certifié"
            onClick={() => setOpenForm(openForm === "livreur" ? null : "livreur")}
          />
        </section>

        {openForm && <ApplicationForm type={openForm} onDone={() => setOpenForm(null)} />}

        <section className="panel mt-6 p-5">
          <h2 className="text-base font-bold">Mes demandes</h2>
          {(data?.applications ?? []).length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">Aucune demande pour l'instant.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {(data?.applications ?? []).map((a) => {
                const meta = statusMeta[a.status as keyof typeof statusMeta] ?? statusMeta.en_attente;
                return (
                  <li
                    key={a.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-surface/50 p-3"
                  >
                    <meta.Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.tone}`} aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold capitalize">
                        Demande {a.type}
                      </span>
                      <span className={`block text-xs ${meta.tone}`}>{meta.label}</span>
                      {a.reason && (
                        <span className="mt-1 block text-xs text-muted-foreground">{a.reason}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function RoleCard({
  icon: Icon,
  title,
  text,
  active,
  activeLabel,
  onClick,
}: {
  icon: typeof Store;
  title: string;
  text: string;
  active: boolean;
  activeLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="panel p-5">
      <Icon className="h-5 w-5 text-primary" aria-hidden />
      <h3 className="mt-3 text-sm font-bold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
      {active ? (
        <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary">
          <ShieldCheck className="h-4 w-4" aria-hidden /> {activeLabel}
        </p>
      ) : (
        <button
          onClick={onClick}
          className="mint-surface mt-4 rounded-lg px-3 py-2 text-xs font-semibold"
        >
          Faire une demande
        </button>
      )}
    </div>
  );
}

function ApplicationForm({ type, onDone }: { type: "vendeur" | "livreur"; onDone: () => void }) {
  const send = useServerFn(submitApplication);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (form: HTMLFormElement) => {
      const fd = new FormData(form);
      return send({
        data: {
          type,
          full_name: String(fd.get("full_name") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          city: String(fd.get("city") ?? ""),
          shop_name: String(fd.get("shop_name") ?? ""),
          shop_description: String(fd.get("shop_description") ?? ""),
          vehicle: String(fd.get("vehicle") ?? ""),
          id_document: String(fd.get("id_document") ?? ""),
          momo_number: String(fd.get("momo_number") ?? ""),
        },
      });
    },
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["my-access"] });
      onDone();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Envoi impossible."),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate(e.currentTarget);
      }}
      className="panel hero-surface mt-6 space-y-3 p-5"
    >
      <h2 className="text-base font-bold">
        {type === "vendeur" ? "Demande de boutique vendeur" : "Inscription livreur"}
      </h2>
      <Input name="full_name" label="Nom complet" required />
      <Input name="phone" label="Téléphone" required />
      <Input name="city" label="Ville" required />
      {type === "vendeur" ? (
        <>
          <Input name="shop_name" label="Nom de la boutique" required />
          <Input name="shop_description" label="Description de la boutique" />
        </>
      ) : (
        <>
          <Input name="vehicle" label="Véhicule (moto, voiture, vélo…)" required />
          <Input name="id_document" label="Numéro de pièce d'identité" />
        </>
      )}
      <Input name="momo_number" label="Numéro Mobile Money (Orange / MTN)" />

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="mint-surface glow rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          Envoyer la demande
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

function Input({ name, label, required }: { name: string; label: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        name={name}
        required={required}
        maxLength={200}
        className="mt-1 w-full rounded-lg border border-border bg-input/60 px-3 py-2.5 text-sm outline-none"
      />
    </label>
  );
}
