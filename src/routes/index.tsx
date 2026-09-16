import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Truck,
  ShieldCheck,
  BadgeCheck,
  Headphones,
  Store,
  LayoutGrid,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import heroImg from "@/assets/hero-market.jpg";
import { SpaceNav } from "@/components/space-nav";
import { SiteFooter } from "@/components/site-footer";
import { formatFcfa } from "@/lib/marketplace-data";
import { listPublicCatalog, listPublicShops } from "@/lib/vendor.functions";
import { useCart } from "@/lib/cart";

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

type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  image_url: string | null;
  shop_name: string;
  shop_slug: string;
};

type PublicShop = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  logo_url: string | null;
};

function ProductCard({ p }: { p: CatalogProduct }) {
  const cart = useCart();
  const [added, setAdded] = useState(false);

  function addToCart() {
    if (p.stock <= 0) return;
    cart.add({
      product_id: p.id,
      variant_id: null,
      name: p.name,
      variant_label: null,
      unit_price: p.price,
      quantity: 1,
      image_url: p.image_url,
      shop_name: p.shop_name,
      shop_slug: p.shop_slug,
      max_stock: p.stock,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <li className="panel group flex flex-col overflow-hidden p-3">
      <Link
        to="/produit/$id"
        params={{ id: p.id }}
        className="relative grid aspect-square place-items-center overflow-hidden rounded-lg bg-muted/60"
      >
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="font-display text-3xl font-bold text-primary/40">
            {p.name.charAt(0)}
          </span>
        )}
      </Link>
      <Link
        to="/produit/$id"
        params={{ id: p.id }}
        className="mt-3 line-clamp-2 text-sm font-semibold hover:text-primary"
      >
        {p.name}
      </Link>
      <Link
        to="/boutique/$slug"
        params={{ slug: p.shop_slug }}
        className="block truncate text-xs text-muted-foreground hover:text-primary"
      >
        {p.shop_name}
      </Link>
      <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
        <span className="rounded-full border border-border px-2 py-0.5">{p.category}</span>
        {p.stock > 0 ? (
          <span>{p.stock} en stock</span>
        ) : (
          <span className="text-destructive">Rupture</span>
        )}
      </div>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <span className="truncate font-display text-sm font-bold">{formatFcfa(p.price)}</span>
        <button
          type="button"
          onClick={addToCart}
          disabled={p.stock <= 0}
          aria-label={`Ajouter ${p.name} au panier`}
          className="mint-surface grid h-9 w-9 shrink-0 place-items-center rounded-lg disabled:opacity-40"
        >
          {added ? (
            <BadgeCheck className="h-4 w-4" aria-hidden />
          ) : (
            <ShoppingBag className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    </li>
  );
}

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

  const nouveautes = useMemo(() => products.slice(0, 8), [products]);
  const vendorCount = useMemo(() => new Set(products.map((p) => p.shop_slug)).size, [products]);

  return (
    <div className="min-h-screen">
      <SpaceNav />

      <main className="mx-auto max-w-6xl px-4 pb-24">
        <section className="hero-surface panel relative mt-6 overflow-hidden">
          <div className="grid gap-6 p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs text-primary">
                <Truck className="h-3.5 w-3.5" aria-hidden /> Livraison suivie au Cameroun
              </span>
              <h1 className="mt-5 text-3xl font-bold leading-[1.08] sm:text-5xl">
                Tout ce dont vous avez besoin,
                <br />
                <span className="text-primary">au même endroit.</span>
              </h1>
              <p className="mt-4 max-w-md text-sm text-muted-foreground">
                Shop Crew Hub réunit les boutiques de votre ville : commandez, payez à la
                livraison et suivez votre commande.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <a
                  href="#catalogue"
                  className="mint-surface glow inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Commencer mes achats <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
                <Link
                  to="/vendeur"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-5 py-3 text-sm font-semibold hover:text-primary"
                >
                  <Store className="h-4 w-4" aria-hidden /> Devenir vendeur
                </Link>
              </div>

              <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
                {[
                  [String(products.length), "Produits"],
                  [String(vendorCount), "Vendeurs"],
                  [String(categories.length), "Catégories"],
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
              alt="Produits et colis prêts pour la livraison"
              width={1280}
              height={960}
              className="w-full rounded-xl border border-border object-cover"
            />
          </div>
        </section>

        {/* Catégories */}
        <section className="mt-10">
          <SectionTitle title="Catégories" id="categories" />
          {categories.length === 0 ? (
            <p className="panel mt-4 p-5 text-xs text-muted-foreground">
              Les catégories apparaîtront dès que les vendeurs publieront leurs produits.
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((c) => (
                <li key={c}>
                  <a
                    href="#catalogue"
                    onClick={() => setCategory(c)}
                    className="panel flex items-center gap-2 p-3 text-xs font-medium hover:border-primary"
                  >
                    <LayoutGrid className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span className="truncate">{c}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Nouveautés */}
        <section className="mt-10">
          <SectionTitle title="Nouveautés" hint="Les derniers produits publiés par nos vendeurs." />
          {nouveautes.length === 0 ? (
            <p className="panel mt-4 p-5 text-xs text-muted-foreground">
              Aucun produit publié pour le moment.
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {nouveautes.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </ul>
          )}
        </section>

        {/* Meilleures ventes & promotions : honnêteté des données */}
        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="panel p-5">
            <h2 className="text-base font-bold">Meilleures ventes</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Ce classement s'affichera dès que des commandes auront été livrées. Nous ne
              publions aucun chiffre de vente inventé.
            </p>
          </div>
          <div className="panel p-5">
            <h2 className="text-base font-bold">Promotions</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Aucune promotion en cours. Les remises proposées par les vendeurs apparaîtront ici.
            </p>
          </div>
        </section>

        {/* Boutiques */}
        <section className="mt-10">
          <SectionTitle title="Boutiques" hint="Les boutiques actives sur Shop Crew Hub." />
          {shops.length === 0 ? (
            <p className="panel mt-4 p-5 text-xs text-muted-foreground">
              Aucune boutique active pour l'instant.
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shops.slice(0, 6).map((s) => (
                <li key={s.id}>
                  <Link
                    to="/boutique/$slug"
                    params={{ slug: s.slug }}
                    className="panel flex items-center gap-3 p-4 hover:border-primary"
                  >
                    <span className="mint-surface grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl font-display text-sm font-bold">
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

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {tabs.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={
                  c === category
                    ? "mint-surface shrink-0 rounded-full px-4 py-2 text-xs font-semibold"
                    : "shrink-0 rounded-full border border-border bg-surface/60 px-4 py-2 text-xs text-muted-foreground"
                }
              >
                {c}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="panel mt-5 p-5 text-xs text-muted-foreground">
              Aucun produit ne correspond à votre recherche.
            </p>
          ) : (
            <ul className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
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
      </main>

      <SiteFooter />
    </div>
  );
}
