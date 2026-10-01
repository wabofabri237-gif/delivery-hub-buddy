import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, PackageCheck, MapPin, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SpaceNav } from "@/components/space-nav";
import { getMyAccess } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/livreur")({
  head: () => ({
    meta: [
      { title: "Espace livreur — Shop Crew Hub" },
      {
        name: "description",
        content:
          "Espace livreur certifié Shop Crew Hub : courses assignées, itinéraires et gains.",
      },
      { property: "og:title", content: "Espace livreur — Shop Crew Hub" },
      {
        property: "og:description",
        content: "Accédez à vos courses après certification par l'administrateur.",
      },
    ],
  }),
  component: DriverSpace,
});

function DriverSpace() {
  const fetchAccess = useServerFn(getMyAccess);
  const { data, isLoading } = useQuery({ queryKey: ["my-access"], queryFn: () => fetchAccess() });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <SpaceNav />
        <p className="mx-auto max-w-3xl px-4 pt-10 text-xs text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  if (!data?.roles.includes("livreur")) {
    const pending = (data?.applications ?? []).some(
      (a) => a.type === "livreur" && a.status === "en_attente",
    );
    return (
      <div className="min-h-screen">
        <SpaceNav />
        <main className="mx-auto max-w-lg px-4 pb-20 pt-10">
          <section className="panel hero-surface p-6 text-center">
            <span className="mint-surface mx-auto grid h-12 w-12 place-items-center rounded-xl">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
            <h1 className="mt-4 text-xl font-bold">Espace réservé aux livreurs certifiés</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {pending
                ? "Votre inscription est en cours d'examen par l'administrateur. Vous recevrez l'accès dès la certification."
                : "Inscrivez-vous comme livreur depuis votre compte : l'administrateur certifie chaque profil avant l'accès aux courses."}
            </p>
            <Link
              to="/mon-compte"
              className="mint-surface glow mt-6 inline-block rounded-lg px-4 py-3 text-sm font-semibold"
            >
              {pending ? "Voir ma demande" : "M'inscrire comme livreur"}
            </Link>
          </section>
        </main>
      </div>
    );
  }

  const firstName = (data.profile?.full_name ?? "").split(" ")[0];

  return (
    <div className="min-h-screen">
      <SpaceNav />

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6">
        <section className="hero-surface panel p-5">
          <h1 className="truncate text-2xl font-bold">
            Bonjour{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-primary">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Livreur certifié
            {data.profile?.city ? ` · ${data.profile.city}` : ""}
          </p>
        </section>

        <section className="panel mt-5 p-5">
          <h2 className="text-base font-bold">Mes courses</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Aucune course ne vous est assignée pour l'instant. Les courses apparaîtront ici dès la
            mise en service du module commandes &amp; livraison temps réel.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["Courses du jour", PackageCheck],
              ["Gains du jour", Wallet],
              ["Zone active", MapPin],
            ].map(([label, Icon]) => {
              const I = Icon as typeof Wallet;
              return (
                <li
                  key={label as string}
                  className="rounded-lg border border-border bg-surface/60 p-3"
                >
                  <I className="h-4 w-4 text-primary" aria-hidden />
                  <p className="mt-2 text-xs text-muted-foreground">{label as string}</p>
                  <p className="font-display text-sm font-bold">
                    {label === "Zone active" ? (data.profile?.city ?? "—") : "—"}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel mt-5 p-5">
          <h2 className="text-base font-bold">Prochainement</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Acceptation de course, itinéraire GPS et preuve de livraison seront activés avec le
            module de commandes. Aucune donnée fictive n'est affichée dans cet espace.
          </p>
        </section>
      </main>
    </div>
  );
}
