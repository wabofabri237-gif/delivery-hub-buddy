import { createFileRoute } from "@tanstack/react-router";
import { Users, Store, Bike, Flag, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SpaceNav } from "@/components/space-nav";
import {
  requireAdmin,
  listApplications,
  decideApplication,
  getAdminStats,
} from "@/lib/account.functions";
import { PaymentsPanel } from "@/components/payments-panel";
import { ContactRequests } from "@/components/contact-requests";

export const Route = createFileRoute("/_authenticated/admin")({
  loader: () => requireAdmin(),
  head: () => ({
    meta: [
      { title: "Espace administrateur — Shop Crew Hub" },
      {
        name: "description",
        content:
          "Pilotage de la marketplace Shop Crew Hub : comptes, vendeurs, livreurs et certifications.",
      },
      { property: "og:title", content: "Espace administrateur — Shop Crew Hub" },
      {
        property: "og:description",
        content: "Tableau de bord admin : comptes, rôles, demandes et modération.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminSpace,
});

function AdminSpace() {
  const fetchStats = useServerFn(getAdminStats);
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchStats(),
  });

  const cards = [
    { label: "Comptes", value: stats?.totals.accounts ?? 0, Icon: Users },
    { label: "Vendeurs certifiés", value: stats?.totals.vendeurs ?? 0, Icon: Store },
    { label: "Livreurs certifiés", value: stats?.totals.livreurs ?? 0, Icon: Bike },
    { label: "Demandes en attente", value: stats?.totals.pending ?? 0, Icon: Flag },
  ];

  return (
    <div className="min-h-screen">
      <SpaceNav />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold sm:text-3xl">Console administrateur</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Données réelles de la base · accès restreint au compte administrateur
          </p>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map(({ label, value, Icon }) => (
            <li key={label} className="panel p-4">
              <Icon className="h-4 w-4 text-primary" aria-hidden />
              <p className="mt-3 font-display text-xl font-bold">
                {isLoading ? "—" : value.toLocaleString("fr-FR")}
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="panel p-5">
            <h2 className="text-base font-bold">Demandes d'accès</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Répartition réelle des candidatures vendeur et livreur.
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              {[
                ["Total", stats?.applications.total ?? 0],
                ["Approuvées", stats?.applications.approuvee ?? 0],
                ["Rejetées", stats?.applications.rejetee ?? 0],
                ["En attente", stats?.totals.pending ?? 0],
                ["Type vendeur", stats?.applications.vendeur ?? 0],
                ["Type livreur", stats?.applications.livreur ?? 0],
              ].map(([label, value]) => (
                <div
                  key={label as string}
                  className="rounded-lg border border-border bg-surface/50 p-3"
                >
                  <dt className="text-xs text-muted-foreground">{label as string}</dt>
                  <dd className="font-display text-lg font-bold">
                    {isLoading ? "—" : (value as number)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="panel p-5">
            <h2 className="text-base font-bold">Derniers comptes créés</h2>
            {isLoading ? (
              <p className="mt-4 text-xs text-muted-foreground">Chargement…</p>
            ) : (stats?.recentAccounts.length ?? 0) === 0 ? (
              <p className="mt-4 text-xs text-muted-foreground">Aucun compte pour le moment.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {stats?.recentAccounts.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface/50 p-3"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted font-display text-xs font-bold text-primary">
                      {(p.full_name ?? "?").charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">
                        {p.full_name ?? "Compte sans nom"}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {p.city ?? "Ville non renseignée"} ·{" "}
                        {new Date(p.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <ApplicationsPanel />
        <ContactRequests />

        <PaymentsPanel />
      </main>
    </div>
  );
}

function ApplicationsPanel() {
  const fetchApps = useServerFn(listApplications);
  const decide = useServerFn(decideApplication);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: () => fetchApps(),
  });

  const mutation = useMutation({
    mutationFn: (vars: { id: string; approve: boolean }) => decide({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  const pending = (data ?? []).filter((a) => a.status === "en_attente");

  return (
    <section className="panel mt-6 p-5">
      <h2 className="text-base font-bold">Certifications &amp; boutiques à valider</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Aucun livreur ni vendeur n'accède à son espace sans votre validation.
      </p>

      {isLoading ? (
        <p className="mt-4 text-xs text-muted-foreground">Chargement des demandes…</p>
      ) : pending.length === 0 ? (
        <p className="mt-4 text-xs text-muted-foreground">Aucune demande en attente.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {pending.map((a) => (
            <li key={a.id} className="rounded-lg border border-border bg-surface/50 p-4">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {a.full_name} · <span className="capitalize text-primary">{a.type}</span>
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {a.city} · {a.phone}
                  </p>
                  {a.shop_name && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      Boutique : {a.shop_name}
                    </p>
                  )}
                  {a.vehicle && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      Véhicule : {a.vehicle}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    aria-label="Approuver la demande"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ id: a.id, approve: true })}
                    className="mint-surface grid h-11 w-11 place-items-center rounded-lg disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    aria-label="Rejeter la demande"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ id: a.id, approve: false })}
                    className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-surface text-destructive disabled:opacity-60"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
