import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Store, MapPin, ShoppingBag } from "lucide-react";
import { SpaceNav } from "@/components/space-nav";
import { formatFcfa } from "@/lib/marketplace-data";
import { getPublicShop } from "@/lib/vendor.functions";

export const Route = createFileRoute("/boutique/$slug")({
  loader: async ({ params }) => {
    const result = await getPublicShop({ data: { slug: params.slug } });
    if (!result.shop) throw notFound();
    return result;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.shop?.name ?? "Boutique";
    const description =
      loaderData?.shop?.description ??
      `Découvrez les produits de la boutique ${name} sur Shop Crew Hub, livrés près de vous.`;
    return {
      meta: [
        { title: `${name} — Boutique Shop Crew Hub` },
        { name: "description", content: description.slice(0, 155) },
        { property: "og:title", content: `${name} — Boutique Shop Crew Hub` },
        { property: "og:description", content: description.slice(0, 155) },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => <ShopFallback title="Boutique indisponible" />,
  notFoundComponent: () => <ShopFallback title="Boutique introuvable" />,
  component: PublicShopPage,
});

function ShopFallback({ title }: { title: string }) {
  return (
    <div className="min-h-screen">
      <SpaceNav />
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette boutique n'existe pas ou n'est pas encore activée par l'administrateur.
        </p>
        <Link to="/boutiques" className="mint-surface mt-5 inline-block rounded-lg px-4 py-2.5 text-sm font-semibold">
          Voir les boutiques
        </Link>
      </main>
    </div>
  );
}

type PublicProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  stock: number;
  image_url: string | null;
};

function PublicShopPage() {
  const data = Route.useLoaderData();
  const shop = data.shop;
  const products = (data.products ?? []) as PublicProduct[];
  if (!shop) return <ShopFallback title="Boutique introuvable" />;

  return (
    <div className="min-h-screen">
      <SpaceNav />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">
        <header className="panel hero-surface p-6">
          <span className="mint-surface grid h-12 w-12 place-items-center rounded-xl">
            <Store className="h-5 w-5" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-bold sm:text-3xl">{shop.name}</h1>
          {shop.city && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" aria-hidden /> {shop.city}
            </p>
          )}
          {shop.description && (
            <p className="mt-3 max-w-lg text-sm text-muted-foreground">{shop.description}</p>
          )}
        </header>

        <h2 className="mt-8 text-base font-bold">Produits ({products.length})</h2>
        {products.length === 0 ? (
          <p className="panel mt-3 p-5 text-xs text-muted-foreground">
            Cette boutique n'a pas encore publié de produit.
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <li key={p.id} className="panel overflow-hidden">
                <div className="aspect-square bg-surface/60">
                  {p.image_url && (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{p.category}</p>
                  <p className="mt-1 text-sm font-bold text-primary">{formatFcfa(p.price)}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <ShoppingBag className="h-3 w-3" aria-hidden />
                    {p.stock > 0 ? `${p.stock} en stock` : "Rupture de stock"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
