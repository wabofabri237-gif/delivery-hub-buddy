import { createFileRoute, Link } from "@tanstack/react-router";
import { Store, MapPin } from "lucide-react";
import { SpaceNav } from "@/components/space-nav";
import { listPublicShops } from "@/lib/vendor.functions";

type ShopCard = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
};

export const Route = createFileRoute("/boutiques")({
  loader: () => listPublicShops(),
  head: () => ({
    meta: [
      { title: "Boutiques vendeurs — Shop Crew Hub" },
      {
        name: "description",
        content:
          "Découvrez toutes les boutiques vendeurs certifiées de Shop Crew Hub et commandez avec livraison suivie.",
      },
      { property: "og:title", content: "Boutiques vendeurs — Shop Crew Hub" },
      {
        property: "og:description",
        content: "Toutes les boutiques certifiées de la marketplace Shop Crew Hub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => (
    <Shell>
      <p className="panel p-5 text-xs text-muted-foreground">
        Impossible de charger les boutiques pour le moment.
      </p>
    </Shell>
  ),
  notFoundComponent: () => (
    <Shell>
      <p className="panel p-5 text-xs text-muted-foreground">Aucune boutique trouvée.</p>
    </Shell>
  ),
  component: ShopsPage,
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SpaceNav />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Boutiques</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vendeurs certifiés par l'administrateur Shop Crew Hub.
        </p>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}

function ShopsPage() {
  const shops = (Route.useLoaderData() ?? []) as ShopCard[];

  return (
    <Shell>
      {shops.length === 0 ? (
        <p className="panel p-5 text-xs text-muted-foreground">
          Aucune boutique activée pour l'instant.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((s) => (
            <li key={s.id} className="panel p-5">
              <span className="mint-surface grid h-10 w-10 place-items-center rounded-lg">
                <Store className="h-4 w-4" aria-hidden />
              </span>
              <h2 className="mt-3 truncate text-sm font-bold">{s.name}</h2>
              {s.city && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3" aria-hidden /> {s.city}
                </p>
              )}
              {s.description && (
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
              )}
              <Link
                to="/boutique/$slug"
                params={{ slug: s.slug }}
                className="mint-surface mt-4 inline-block rounded-lg px-3 py-2 text-xs font-semibold"
              >
                Visiter
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
