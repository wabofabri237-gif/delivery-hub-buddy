import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Truck,
  ShieldCheck,
  BadgeCheck,
  Headphones,
  Store,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import brandArtwork from "@/assets/shop-crew-hub-logo.png";
import marketplaceCover from "@/assets/marketplace-cover.jpg";
import { CategoryGrid } from "@/components/category-grid";
import { ProductCard, type CatalogProduct } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { SpaceNav } from "@/components/space-nav";
import { SiteFooter } from "@/components/site-footer";
import { listPublicCatalog, listPublicShops } from "@/lib/vendor.functions";
import { useWebMCP } from "use-webmcp-tool";
import { runWebMCPTool } from "@/lib/webmcp-telemetry";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) =>
    typeof search["q"] === "string" && search["q"] ? { q: search["q"] } : {},
  loader: async () => {
    const [catalog, shops] = await Promise.all([listPublicCatalog(), listPublicShops()]);
    return { ...catalog, shops };
  },
  head: () => ({
    meta: [
      { title: "Shop Crew Hub — Le marché près de chez vous" },
      {
        name: "description",
        content: "Achetez sur Shop Crew Hub et faites-vous livrer à domicile au Cameroun.",
      },
      { property: "og:title", content: "Shop Crew Hub — Le marché près de chez vous" },
      {
        property: "og:description",
        content: "Achetez sur Shop Crew Hub et faites-vous livrer à domicile au Cameroun.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://delivery-hub-buddy.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://delivery-hub-buddy.lovable.app/" }],
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

type PublicShop = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  logo_url: string | null;
};

function SectionTitle({
  title,
  hint,
  id,
}: {
  title: string;
  hint?: string;
  id?: string;
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <h2 className="text-xl font-bold">{title}</h2>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ClientSpace() {
  const data = Route.useLoaderData() as {
    products: CatalogProduct[];
    categories: string[];
    shops: PublicShop[];
  };
  const { products, categories, shops } = data;
  const searchParams = Route.useSearch();
  const [category, setCategory] = useState("Tout");
  const [query, setQuery] = useState(searchParams.q ?? "");

  useEffect(() => {
    setQuery(searchParams.q ?? "");
  }, [searchParams.q]);

  const tabs = useMemo(() => ["Tout", ...categories], [categories]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === "Tout" || p.category === category) &&
        (q === "" || p.name.toLowerCase().includes(q) || p.shop_name.toLowerCase().includes(q)),
    );
  }, [products, category, query]);

  useWebMCP({
    name: "read_visible_catalog",
    description: "Lire les produits du catalogue actuellement affiché, en respectant la recherche et le filtre actifs.",
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: () => runWebMCPTool("read_visible_catalog", () => visible.length ? visible.map((p) => `${p.id}: ${p.name} — ${p.price} FCFA — ${p.shop_name} — ${p.stock} en stock`).join("\n") : "Aucun produit dans le catalogue affiché."),
  });

  const nouveautes = useMemo(() => products.slice(0, 8), [products]);


  return (
    <div className="min-h-screen">
      <SpaceNav />

      <main className="mx-auto max-w-6xl px-4 pb-24">
        <section className="relative -mx-4 overflow-hidden bg-market-cover text-market-ink sm:mx-0 sm:mt-6" aria-label="Shop Crew Hub">
          <img src={marketplaceCover} alt="Sélection illustrée d’articles : téléphone, chaussures, beauté, mode et alimentation" width={1536} height={1024} className="absolute inset-0 h-full w-full object-cover object-left sm:object-center" fetchPriority="high" />
          <div className="relative max-w-xl px-5 py-10 sm:px-9 sm:py-14 lg:py-16">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-market-subtle"><Truck className="h-4 w-4" aria-hidden /> Votre marketplace au Cameroun</span>
            <h1 className="mt-5 text-3xl font-bold sm:text-5xl">Shop Crew Hub</h1>
            <p className="mt-4 max-w-80 font-display text-xl font-semibold leading-snug sm:max-w-sm sm:text-2xl">Tout ce dont vous avez besoin, au même endroit.</p>
            <p className="mt-4 max-w-72 text-sm leading-relaxed text-market-subtle sm:max-w-80">Les boutiques de votre ville, réunies pour vos achats du quotidien.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild className="h-11"><a href="#catalogue">Commencer mes achats <ArrowRight aria-hidden /></a></Button>
              <Button asChild variant="outline" className="h-11 border-market-subtle/25 bg-market-cover/80 text-market-ink hover:bg-market-cover hover:text-market-ink"><Link to="/vendeur"><Store aria-hidden />Devenir vendeur</Link></Button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-x-4 gap-y-4 border-b border-border py-6 sm:grid-cols-4">
          {[[BadgeCheck, "Vendeurs vérifiés"], [ShieldCheck, "Paiement à la livraison"], [Truck, "Livraison suivie"], [Headphones, "Service client"]].map(([Icon, label]) => {
            const I = Icon as typeof BadgeCheck;
            return <div key={label as string} className="flex items-center gap-2 text-xs font-medium sm:text-sm"><I className="h-5 w-5 shrink-0 text-primary" aria-hidden /><span>{label as string}</span></div>;
          })}
        </div>

        <section className="mt-9">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><SectionTitle title="Catégories populaires" /><Button asChild variant="link" className="px-0"><Link to="/categories">Toutes les catégories <ArrowRight aria-hidden /></Link></Button></div>
          <CategoryGrid products={products} />
        </section>

        {/* Nouveautés */}
        <section className="mt-10">
          <SectionTitle title="Nouveautés" hint="Les derniers produits publiés par nos vendeurs." />
          {nouveautes.length === 0 ? (
            <p className="mt-4 border-y border-border py-8 text-sm text-muted-foreground">
              Aucun produit publié pour le moment.
            </p>
          ) : (
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {nouveautes.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10 border-y border-border py-8">
          <SectionTitle title="Produits populaires" />
          <p className="mt-3 text-sm text-muted-foreground">Le classement des produits populaires n’est pas encore disponible.</p>
        </section>
        <section className="mt-10">
          <SectionTitle title="Promotions" />
          <p className="mt-4 border-y border-border py-8 text-sm text-muted-foreground">Aucune promotion en cours pour le moment.</p>
        </section>
        <section className="mt-10">
          <SectionTitle title="Meilleures ventes" />
          <p className="mt-3 text-sm text-muted-foreground">Le classement des meilleures ventes n’est pas encore disponible.</p>
        </section>

        {/* Boutiques */}
        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3"><SectionTitle title="Boutiques populaires" hint="Découvrez les boutiques actives. Le classement par popularité n’est pas encore disponible." /><Button asChild variant="link" className="px-0"><Link to="/boutiques">Toutes les boutiques <ArrowRight aria-hidden /></Link></Button></div>
          {shops.length === 0 ? (
            <p className="mt-4 border-y border-border py-8 text-sm text-muted-foreground">
              Aucune boutique active pour l'instant.
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shops.slice(0, 6).map((s) => (
                <li key={s.id}>
                  <Link
                    to="/boutique/$slug"
                    params={{ slug: s.slug }}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary"
                  >
                    <span className="mint-surface grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg font-display text-sm font-bold">
                      {s.logo_url ? (
                        <img
                          src={s.logo_url}
                          alt={s.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        s.name.charAt(0)
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{s.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {s.city ?? "Cameroun"}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Catalogue complet */}
        <section className="mt-12 scroll-mt-24" id="catalogue">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
            <h2 className="truncate text-xl font-bold">Catalogue</h2>
            <span className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-surface/60 px-3 py-2 text-xs text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden /> {visible.length} produits
            </span>
          </div>

          <label className="mt-4 flex items-center gap-2 rounded-full border border-border bg-input/60 px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit, une boutique…"
              aria-label="Rechercher dans le catalogue"
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filtrer le catalogue">
            {tabs.map((c) => (
              <Button
                key={c}
                variant={c === category ? "default" : "outline"}
                aria-pressed={c === category}
                onClick={() => setCategory(c)}
                className={
                  c === category
                    ? "h-11 shrink-0 text-xs font-semibold"
                    : "h-11 shrink-0 text-xs text-muted-foreground"
                }
              >
                {c}
              </Button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="panel mt-5 p-5 text-xs text-muted-foreground">
              Aucun produit ne correspond à votre recherche.
            </p>
          ) : (
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {visible.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </ul>
          )}
        </section>

        {/* Comment ça marche */}
        <section className="mt-12">
          <SectionTitle title="Comment ça marche" />
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["1. Choisissez", "Parcourez les boutiques et ajoutez vos articles au panier."],
              ["2. Commandez", "Renseignez votre adresse et validez votre commande."],
              ["3. Recevez", "Suivez le statut jusqu'à la livraison à domicile."],
            ].map(([t, d]) => (
              <li key={t} className="panel p-5">
                <p className="font-display text-sm font-bold text-primary">{t}</p>
                <p className="mt-2 text-xs text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Confiance */}
        <section className="mt-10">
          <SectionTitle title="Pourquoi nous faire confiance" />
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [BadgeCheck, "Vendeurs vérifiés", "Chaque boutique est validée avant publication."],
              [
                ShieldCheck,
                "Paiements sécurisés",
                "Paiement à la livraison ; Mobile Money en cours d'intégration.",
              ],
              [Truck, "Livraison suivie", "Le statut de votre commande est visible à tout moment."],
              [Headphones, "Service client", "Aide en ligne et assistant disponible 24h/24."],
            ].map(([Icon, title, desc]) => {
              const I = Icon as typeof BadgeCheck;
              return (
                <li key={title as string} className="panel p-5">
                  <I className="h-5 w-5 text-primary" aria-hidden />
                  <p className="mt-3 text-sm font-semibold">{title as string}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{desc as string}</p>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <Link to="/aide" className="text-primary underline-offset-4 hover:underline">
              Centre d'aide
            </Link>
            <Link to="/assistant" className="inline-flex items-center gap-1 text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Assistant
            </Link>
          </div>
        </section>
        <div className="mt-12 border-t border-border pt-8"><img src={brandArtwork} alt="Shop Crew Hub — Le marketplace du Cameroun" width={2400} height={2400} loading="lazy" className="mx-auto w-64 max-w-full rounded-lg" /></div>
      </main>

      <SiteFooter />
    </div>
  );
}
