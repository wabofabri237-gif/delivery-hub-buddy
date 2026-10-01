import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ShoppingBag,
  Store,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  ChevronLeft,
} from "lucide-react";
import { SpaceNav } from "@/components/space-nav";
import { SiteFooter } from "@/components/site-footer";
import { formatFcfa } from "@/lib/marketplace-data";
import { getProductDetail } from "@/lib/catalog.functions";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/produit/$id")({
  loader: async ({ params }) => {
    const result = await getProductDetail({ data: { id: params.id } });
    if (!result.product) throw notFound();
    return result;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.product?.name ?? "Produit";
    const description =
      loaderData?.product?.description?.slice(0, 155) ??
      `Achetez ${name} sur Shop Crew Hub et faites-vous livrer près de chez vous.`;
    const image = loaderData?.product?.image_url;
    const meta = [
      { title: `${name} — Shop Crew Hub` },
      { name: "description", content: description },
      { property: "og:title", content: `${name} — Shop Crew Hub` },
      { property: "og:description", content: description },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (image && image.startsWith("https://")) {
      meta.push(
        { property: "og:image", content: image },
        { name: "twitter:image", content: image },
      );
    }
    return { meta };
  },
  errorComponent: () => <ProductFallback title="Produit indisponible" />,
  notFoundComponent: () => <ProductFallback title="Produit introuvable" />,
  component: ProductPage,
});

function ProductFallback({ title }: { title: string }) {
  return (
    <div className="min-h-screen">
      <SpaceNav />
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ce produit n'existe plus ou n'est pas publié.
        </p>
        <Link to="/" className="mint-surface mt-5 inline-block rounded-lg px-4 py-2.5 text-sm font-semibold">
          Retour au catalogue
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}

function ProductPage() {
  const data = Route.useLoaderData();
  const navigate = useNavigate();
  const cart = useCart();

  const product = data.product!;
  const shop = data.shop!;
  const images = data.images ?? [];
  const variants = data.variants ?? [];
  const related = data.related ?? [];

  const gallery = useMemo(() => {
    const urls = images.map((i) => ({ url: i.url, alt: i.alt ?? product.name }));
    if (product.image_url) urls.unshift({ url: product.image_url, alt: product.name });
    return urls;
  }, [images, product]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof variants>();
    for (const v of variants) map.set(v.group_name, [...(map.get(v.group_name) ?? []), v]);
    return Array.from(map.entries());
  }, [variants]);

  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  const chosenVariant = useMemo(() => {
    const ids = Object.values(selected);
    return variants.find((v) => ids.includes(v.id)) ?? null;
  }, [selected, variants]);

  const unitPrice = product.price + (chosenVariant?.price_delta ?? 0);
  const stock = chosenVariant ? chosenVariant.stock : product.stock;
  const allGroupsChosen = groups.every(([g]) => selected[g]);

  function addToCart(goToCart: boolean) {
    if (!allGroupsChosen) {
      toast.error("Choisissez d'abord toutes les options du produit.");
      return;
    }
    if (stock < 1) {
      toast.error("Ce produit est en rupture de stock.");
      return;
    }
    cart.add({
      product_id: product.id,
      variant_id: chosenVariant?.id ?? null,
      name: product.name,
      variant_label: chosenVariant ? `${chosenVariant.group_name}: ${chosenVariant.value}` : null,
      unit_price: unitPrice,
      quantity: Math.min(quantity, stock),
      image_url: gallery[0]?.url ?? null,
      shop_name: shop.name,
      shop_slug: shop.slug,
      max_stock: stock,
    });
    toast.success(`${product.name} ajouté au panier`);
    if (goToCart) navigate({ to: "/panier" });
  }

  return (
    <div className="min-h-screen">
      <SpaceNav />
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-5">
        <button
          onClick={() => navigate({ to: "/" })}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> Retour au catalogue
        </button>

        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <section>
            <div className="panel grid aspect-square place-items-center overflow-hidden">
              {gallery[active] ? (
                <img
                  src={gallery[active].url}
                  alt={gallery[active].alt}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-display text-6xl font-bold text-primary/30">
                  {product.name.charAt(0)}
                </span>
              )}
            </div>
            {gallery.length > 1 && (
              <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {gallery.map((img, i) => (
                  <li key={`${img.url}-${i}`}>
                    <button
                      onClick={() => setActive(i)}
                      aria-label={`Voir la photo ${i + 1}`}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border ${
                        i === active ? "border-primary" : "border-border"
                      }`}
                    >
                      <img src={img.url} alt={img.alt} loading="lazy" className="h-full w-full object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <span className="rounded-full border border-border bg-surface/70 px-3 py-1 text-xs text-primary">
              {product.category}
            </span>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{product.name}</h1>

            <Link
              to="/boutique/$slug"
              params={{ slug: shop.slug }}
              className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
            >
              <Store className="h-3.5 w-3.5" aria-hidden /> {shop.name}
              {shop.city && (
                <>
                  <MapPin className="ml-1 h-3.5 w-3.5" aria-hidden /> {shop.city}
                </>
              )}
            </Link>

            <p className="mt-4 font-display text-3xl font-bold text-primary">
              {formatFcfa(unitPrice)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stock > 0 ? `${stock} en stock` : "Rupture de stock"}
            </p>

            {product.description && (
              <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">
                {product.description}
              </p>
            )}

            {groups.map(([group, options]) => (
              <div key={group} className="mt-5">
                <p className="text-xs font-semibold">{group}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {options.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => {
                        setSelected((prev) => ({ ...prev, [group]: o.id }));
                        setQuantity(1);
                      }}
                      disabled={o.stock < 1}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-40 ${
                        selected[group] === o.id
                          ? "mint-surface"
                          : "border border-border bg-surface/60 text-muted-foreground"
                      }`}
                    >
                      {o.value}
                      {o.price_delta !== 0 && ` (${o.price_delta > 0 ? "+" : ""}${o.price_delta})`}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-surface/60 p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Diminuer la quantité"
                  className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground"
                >
                  <Minus className="h-4 w-4" aria-hidden />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(Math.max(stock, 1), q + 1))}
                  aria-label="Augmenter la quantité"
                  className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <button
                onClick={() => addToCart(false)}
                disabled={stock < 1}
                className="mint-surface glow flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden /> Ajouter au panier
              </button>
            </div>

            <button
              onClick={() => addToCart(true)}
              disabled={stock < 1}
              className="mt-3 h-11 w-full rounded-lg border border-border bg-surface/60 text-sm font-semibold disabled:opacity-50"
            >
              Acheter maintenant
            </button>

            <ul className="mt-6 grid gap-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" aria-hidden /> Livraison suivie à Douala,
                Yaoundé et alentours
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden /> Paiement protégé
                jusqu'à la réception —{" "}
                <Link to="/securite" className="text-primary underline-offset-4 hover:underline">
                  politique de sécurité
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-base font-bold">Autres produits de {shop.name}</h2>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((r) => (
                <li key={r.id} className="panel overflow-hidden">
                  <Link to="/produit/$id" params={{ id: r.id }}>
                    <div className="aspect-square bg-surface/60">
                      {r.image_url && (
                        <img src={r.image_url} alt={r.name} loading="lazy" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-semibold">{r.name}</p>
                      <p className="mt-1 text-sm font-bold text-primary">{formatFcfa(r.price)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
