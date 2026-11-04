import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Store,
  LayoutDashboard,
  Bike,
  UserRound,
  LogOut,
  ShoppingCart,
  Search,
  MapPin,
  LayoutGrid,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";

const spaces = [
  { to: "/vendeur", label: "Vendeur", icon: Store },
  { to: "/admin", label: "Admin", icon: LayoutDashboard },
  { to: "/livreur", label: "Livreur", icon: Bike },
] as const;

export function SpaceNav() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const { count } = useCart();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setEmail(data.session?.user.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { next: "/mon-compte" }, replace: true });
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = term.trim();
    navigate({ to: "/", search: q ? { q } : {} });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <BrandLogo />

          <div className="flex shrink-0 items-center gap-1.5">
            <form onSubmit={submitSearch} className="hidden lg:block">
              <label className="flex w-72 items-center gap-2 rounded-full border border-border bg-input/60 px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Rechercher un produit, une boutique…"
                  aria-label="Rechercher"
                  className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </label>
            </form>

            <Link
              to="/categories"
              className="hidden items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-2 text-xs text-muted-foreground hover:text-foreground sm:flex"
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden /> Catégories
            </Link>

            <span className="hidden items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-2 text-xs text-muted-foreground xl:flex">
              <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden /> Cameroun
            </span>

            <Link
              to="/panier"
              aria-label={`Panier, ${count} article(s)`}
              className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/70 text-foreground"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden />
              {count > 0 ? (
                <span className="mint-surface absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold">
                  {count}
                </span>
              ) : null}
            </Link>

            {email ? (
              <>
                <Link
                  to="/mon-compte"
                  aria-label="Mon compte"
                  className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/70 text-primary"
                >
                  <UserRound className="h-4 w-4" aria-hidden />
                </Link>
                <Button variant="ghost" size="icon"
                  onClick={signOut}
                  aria-label="Se déconnecter"
                  className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/70 text-muted-foreground"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                </Button>
              </>
            ) : (
              <Link
                to="/auth"
                search={{ next: "/mon-compte" }}
                className="mint-surface shrink-0 rounded-full px-3 py-2 text-xs font-semibold"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>

        <form onSubmit={submitSearch} className="mt-3 lg:hidden">
          <label className="flex items-center gap-2 rounded-full border border-border bg-input/60 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Rechercher un produit, une boutique…"
              aria-label="Rechercher"
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
        </form>

        <nav aria-label="Explorer Shop Crew Hub" className="mt-3 flex items-center gap-1 overflow-x-auto border-t border-border pt-3 pb-0.5">
          <Button asChild variant="ghost" size="sm" className="shrink-0"><Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-primary bg-primary/10" }}>Accueil</Link></Button>
          <Button asChild variant="ghost" size="sm" className="shrink-0"><Link to="/categories" activeProps={{ className: "text-primary bg-primary/10" }}><LayoutGrid aria-hidden />Catégories</Link></Button>
          <Button asChild variant="ghost" size="sm" className="shrink-0"><Link to="/boutiques" activeProps={{ className: "text-primary bg-primary/10" }}><Store aria-hidden />Boutiques</Link></Button>
          <span className="mx-2 h-5 shrink-0 border-l border-border" aria-hidden />
          {spaces.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface/50 px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "mint-surface !text-primary-foreground" }}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
