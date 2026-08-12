import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ShoppingBag, Star, SlidersHorizontal, Truck, ShieldCheck, Heart } from "lucide-react";
import heroImg from "@/assets/hero-market.jpg";
import { SpaceNav } from "@/components/space-nav";
import { formatFcfa } from "@/lib/marketplace-data";
import { listPublicCatalog } from "@/lib/vendor.functions";

export const Route = createFileRoute("/")({
  loader: () => listPublicCatalog(),
  head: () => ({
    meta: [
      { title: "SokoMarket — Marketplace multi-vendeurs" },
      {
        name: "description",
        content:
          "Achetez chez des centaines de vendeurs vérifiés et suivez vos livraisons en temps réel sur SokoMarket.",
      },
      { property: "og:title", content: "SokoMarket — Marketplace multi-vendeurs" },
      {
        property: "og:description",
        content: "Espace client : catalogue, panier et suivi de livraison en temps réel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => (
    <div className="min-h-screen">
      <SpaceNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="panel p-5 text-xs text-muted-foreground">
          Impossible de charger le catalogue pour le moment.
        </p>
      </main>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen">
      <SpaceNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="panel p-5 text-xs text-muted-foreground">Aucun produit trouvé.</p>
      </main>
    </div>
  ),
  component: ClientSpace,
});

function ClientSpace() {
  const { products, categories } = Route.useLoaderData();
  const [category, setCategory] = useState("Tout");
  const [query, setQuery] = useState("");

  const tabs = useMemo(() => ["Tout", ...categories], [categories]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === "Tout" || p.category === category) &&
        (q === "" || p.name.toLowerCase().includes(q) || p.shop_name.toLowerCase().includes(q)),
    );
  }, [products, category, query]);
  const vendorCount = useMemo(
    () => new Set(products.map((p) => p.shop_slug)).size,
    [products],
  );

  return (
    <div className="min-h-screen">
      <SpaceNav />

      <main className="mx-auto max-w-6xl px-4 pb-20">
        <section className="hero-surface panel relative mt-6 overflow-hidden">
          <div className="grid gap-6 p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs text-primary">
                <Truck className="h-3.5 w-3.5" aria-hidden /> Livraison 48h à Douala &amp; Yaoundé
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-[1.05] sm:text-5xl">
                Le marché de tout,
                <br />
                <span className="text-primary">livré près de vous.</span>
              </h1>
              <p className="mt-4 max-w-md text-sm text-muted-foreground">
                Des milliers de produits, des vendeurs vérifiés et un suivi de livraison minute
                par minute.
              </p>

              <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <label className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-input/60 px-3 py-2.5">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <input
                    placeholder="Rechercher un produit, une boutique…"
                    className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </label>
                <button className="mint-surface glow shrink-0 rounded-lg px-4 text-sm font-semibold">
                  Chercher
                </button>
              </div>

              <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
                {[
                  ["12k+", "Produits"],
                  ["96", "Vendeurs"],
                  ["4,8/5", "Satisfaction"],
                ].map(([v, l]) => (
                  <div key={l}>
                    <dt className="font-display text-xl font-bold text-primary">{v}</dt>
                    <dd className="text-xs text-muted-foreground">{l}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <img
              src={heroImg}
              alt="Produits électroniques et colis en lévitation sur fond sombre"
              width={1280}
              height={960}
              className="w-full rounded-xl border border-border object-cover"
            />
          </div>
        </section>

        <section className="mt-10">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
            <h2 className="truncate text-xl font-bold">Catalogue (démo)</h2>
            <button className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-surface/60 px-3 py-2 text-xs text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden /> Filtres
            </button>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {categories.map((c, i) => (
              <button
                key={c}
                className={
                  i === 0
                    ? "mint-surface shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold"
                    : "shrink-0 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs text-muted-foreground"
                }
              >
                {c}
              </button>
            ))}
          </div>

          <ul className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {products.map((p) => (
              <li key={p.id} className="panel group overflow-hidden p-3">
                <div className="relative grid aspect-square place-items-center rounded-lg bg-muted/60">
                  <span className="font-display text-3xl font-bold text-primary/40">
                    {p.name.charAt(0)}
                  </span>
                  <button
                    aria-label="Ajouter aux favoris"
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/70 text-muted-foreground"
                  >
                    <Heart className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
                <p className="mt-3 truncate text-sm font-semibold">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">{p.vendor}</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-warning">
                  <Star className="h-3 w-3 fill-current" aria-hidden /> {p.rating}
                  <span className="text-muted-foreground">· {p.stock} en stock</span>
                </div>
                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <span className="truncate font-display text-sm font-bold">
                    {formatFcfa(p.price)}
                  </span>
                  <button
                    aria-label={`Ajouter ${p.name} au panier`}
                    className="mint-surface grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                  >
                    <ShoppingBag className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel mt-10 p-6">
          <h2 className="text-lg font-bold">Paiement &amp; suivi de livraison</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Le paiement Orange Money et MTN MoMo ainsi que le suivi de livraison temps réel sont
            en cours d'intégration. Vos commandes et leur statut apparaîtront ici dès l'activation
            du module.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden /> Paiement protégé jusqu'à
            la réception
            <Link to="/mon-compte" className="text-primary underline-offset-4 hover:underline">
              Mon compte
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
