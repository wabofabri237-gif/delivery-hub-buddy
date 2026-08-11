import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Store, LayoutDashboard, Bike, UserRound, LogOut, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const spaces = [
  { to: "/", label: "Client", icon: Store },
  { to: "/boutiques", label: "Boutiques", icon: ShoppingBag },
  { to: "/vendeur", label: "Vendeur", icon: Store },
  { to: "/admin", label: "Admin", icon: LayoutDashboard },
  { to: "/livreur", label: "Livreur", icon: Bike },
] as const;

export function SpaceNav() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);

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
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:flex sm:justify-between">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="mint-surface grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display text-sm font-bold">
            SK
          </span>
          <span className="hidden truncate font-display text-base font-bold tracking-tight sm:inline">
            Soko<span className="text-primary">Market</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1 rounded-full border border-border bg-surface/70 p-1">
            {spaces.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "mint-surface !text-primary-foreground" }}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>

          {email ? (
            <div className="flex items-center gap-1">
              <Link
                to="/mon-compte"
                aria-label="Mon compte"
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/70 text-primary"
              >
                <UserRound className="h-4 w-4" aria-hidden />
              </Link>
              <button
                onClick={signOut}
                aria-label="Se déconnecter"
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/70 text-muted-foreground"
              >
                <LogOut className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="mint-surface shrink-0 rounded-full px-3 py-2 text-xs font-semibold"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
