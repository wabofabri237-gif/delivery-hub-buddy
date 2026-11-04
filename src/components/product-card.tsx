import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingCart, Check, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatFcfa } from "@/lib/marketplace-data";

export type CatalogProduct = {
  id: string; name: string; price: number; category: string; stock: number;
  image_url: string | null; shop_name: string; shop_slug: string;
};

export function ProductCard({ p }: { p: CatalogProduct }) {
  const cart = useCart();
  const [added, setAdded] = useState(false);
  function addToCart() {
    if (p.stock <= 0) return;
    cart.add({ product_id: p.id, variant_id: null, name: p.name, variant_label: null, unit_price: p.price,
      quantity: 1, image_url: p.image_url, shop_name: p.shop_name, shop_slug: p.shop_slug, max_stock: p.stock });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }
  return (
    <li className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/60">
      <Link to="/produit/$id" params={{ id: p.id }} className="relative grid aspect-square place-items-center overflow-hidden bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {p.image_url ? <img src={p.image_url} alt={p.name} width={480} height={480} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" /> : <Package className="h-12 w-12 text-muted-foreground" aria-hidden />}
        {p.stock <= 0 && <span className="absolute left-2 top-2 rounded bg-background/90 px-2 py-1 text-xs text-muted-foreground">Rupture de stock</span>}
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <span className="mb-2 text-[11px] text-primary">{p.category}</span>
        <Link to="/produit/$id" params={{ id: p.id }} className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 hover:text-primary">{p.name}</Link>
        <Link to="/boutique/$slug" params={{ slug: p.shop_slug }} className="mt-1 truncate text-xs text-muted-foreground hover:text-primary">{p.shop_name}</Link>
        <p className="mt-3 break-words font-display text-base font-bold sm:text-lg">{formatFcfa(p.price)}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="text-[11px] text-muted-foreground">{p.stock > 0 ? `${p.stock} en stock` : "Indisponible"}</span>
          <Button type="button" size="icon" onClick={addToCart} disabled={p.stock <= 0} aria-label={`Ajouter ${p.name} au panier`} title={`Ajouter ${p.name} au panier`} className="h-11 w-11 shrink-0">
            {added ? <Check aria-hidden /> : <ShoppingCart aria-hidden />}
          </Button>
        </div>
        <span aria-live="polite" className="sr-only">{added ? `${p.name} ajouté au panier` : ""}</span>
      </div>
    </li>
  );
}