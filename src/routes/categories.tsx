import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ArrowLeft, PackageSearch } from "lucide-react";
import { SpaceNav } from "@/components/space-nav";
import { SiteFooter } from "@/components/site-footer";
import { CategoryGrid } from "@/components/category-grid";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { MARKETPLACE_CATEGORIES, filterCategoryProducts } from "@/lib/categories";
import { listPublicCatalog } from "@/lib/vendor.functions";
import { useWebMCP } from "use-webmcp-tool";
import { runWebMCPTool } from "@/lib/webmcp-telemetry";

export const Route = createFileRoute("/categories")({
  validateSearch: (search: Record<string, unknown>): { categorie?: string } => typeof search["categorie"] === "string" ? { categorie: search["categorie"] } : {},
  loader: () => listPublicCatalog(),
  head: ({ match }) => {
    const category = MARKETPLACE_CATEGORIES.find((c) => c.slug === match.search.categorie);
    const title = `${category?.name ?? "Catégories"} — Shop Crew Hub`;
    const description = category ? `Découvrez les produits ${category.name} des boutiques Shop Crew Hub au Cameroun.` : "Téléphones, mode, beauté, alimentation, maison et plus : explorez les catégories de Shop Crew Hub.";
    return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
  },
  errorComponent: () => <><SpaceNav /><main className="mx-auto max-w-6xl px-4 py-12"><h1 className="text-2xl font-bold">Catégories</h1><p className="mt-4 text-muted-foreground">Impossible de charger les produits pour le moment.</p></main></>,
  component: CategoriesPage,
});

function CategoriesPage() {
  const { products } = Route.useLoaderData();
  const { categorie } = Route.useSearch();
  const [query, setQuery] = useState("");
  const selected = MARKETPLACE_CATEGORIES.find((c) => c.slug === categorie);
  const categoryProducts = categorie ? filterCategoryProducts(products, categorie) : [];
  const visible = categoryProducts.filter((p) => `${p.name} ${p.shop_name}`.toLocaleLowerCase("fr").includes(query.trim().toLocaleLowerCase("fr")));
  useWebMCP({
    name: "read_category_view",
    description: "Lire les catégories et les produits visibles de la catégorie sélectionnée, sans changer de page ni de filtre.",
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: () => runWebMCPTool("read_category_view", () => !categorie ? MARKETPLACE_CATEGORIES.map((c) => `${c.slug}: ${c.name}`).join("\n") : visible.length ? visible.map((p) => `${p.id}: ${p.name} — ${p.price} FCFA — ${p.shop_name}`).join("\n") : "Aucun produit dans la catégorie affichée."),
  });
  return (
    <><SpaceNav /><main className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pt-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-2 text-xs font-semibold uppercase text-primary">Le marché près de chez vous</p><h1 className="text-3xl font-bold">Catégories</h1></div>
        <Button asChild variant="outline"><Link to="/boutiques">Voir les boutiques</Link></Button>
      </div>
      <CategoryGrid products={products} selected={categorie} />
      {categorie && <section className="mt-10 border-t border-border pt-8" aria-label="Produits de la catégorie">
        <Button asChild variant="ghost" className="mb-4 px-0 text-muted-foreground"><Link to="/categories" search={{}}><ArrowLeft aria-hidden /> Toutes les catégories</Link></Button>
        <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-2xl font-bold">{selected?.name ?? "Catégorie introuvable"}</h2><span className="text-sm text-muted-foreground">{visible.length} produit{visible.length !== 1 ? "s" : ""}</span></div>
        <label className="mt-5 flex max-w-xl items-center gap-3 rounded-lg border border-border bg-input/50 px-4 py-3"><Search className="h-4 w-4 text-muted-foreground" aria-hidden /><input aria-label="Rechercher dans cette catégorie" placeholder="Rechercher dans cette catégorie…" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full min-w-0 bg-transparent text-sm outline-none" /></label>
        {visible.length ? <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">{visible.map((p) => <ProductCard key={p.id} p={p} />)}</ul> : <div className="py-14 text-center"><PackageSearch className="mx-auto mb-4 h-9 w-9 text-muted-foreground" aria-hidden /><p className="text-sm text-muted-foreground">{query ? "Aucun produit ne correspond à votre recherche dans cette catégorie." : "Aucun produit publié dans cette catégorie pour le moment."}</p></div>}
      </section>}
    </main><SiteFooter /></>
  );
}