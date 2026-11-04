import { Link } from "@tanstack/react-router";
import { Smartphone, Shirt, FlaskConical, Apple, House, Car, Laptop, Footprints, Watch, HeartPulse, ArrowUpRight } from "lucide-react";
import { MARKETPLACE_CATEGORIES, matchesCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";

const icons = [Smartphone, Shirt, FlaskConical, Apple, House, Car, Laptop, Footprints, Watch, HeartPulse];
const tones = ["text-primary bg-primary/10", "text-destructive bg-destructive/10", "text-warning bg-warning/10", "text-primary bg-primary/10", "text-warning bg-warning/10"];

export function CategoryGrid({ products, selected }: { products: { category: string }[]; selected?: string | undefined }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {MARKETPLACE_CATEGORIES.map((category, i) => {
        const Icon = icons[i] ?? Smartphone;
        const count = products.filter((p) => matchesCategory(p.category, category.slug)).length;
        return (
          <li key={category.slug}>
            <Link to="/categories" search={{ categorie: category.slug }} aria-current={selected === category.slug ? "page" : undefined}
              className={cn("group relative flex h-full min-h-36 flex-col items-start rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", selected === category.slug && "border-primary bg-primary/5")}>
              <span className={cn("mb-3 grid h-11 w-11 place-items-center rounded-lg", tones[i % tones.length])}><Icon className="h-6 w-6" aria-hidden /></span>
              <span className="text-sm font-semibold leading-snug">{category.name}</span>
              <span className="mt-1 text-xs text-muted-foreground">{count} produit{count !== 1 ? "s" : ""}</span>
              <ArrowUpRight className="absolute right-3 top-3 h-4 w-4 text-muted-foreground group-hover:text-primary" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}