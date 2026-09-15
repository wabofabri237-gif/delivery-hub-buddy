import { Link } from "@tanstack/react-router";
import { Home, LayoutGrid, ShoppingCart, PackageSearch, UserRound } from "lucide-react";
import { useCart } from "@/lib/cart";

const tabs = [
  { to: "/", label: "Accueil", icon: Home, exact: true },
  { to: "/boutiques", label: "Catégories", icon: LayoutGrid, exact: false },
  { to: "/panier", label: "Panier", icon: ShoppingCart, exact: false },
  { to: "/mes-commandes", label: "Commandes", icon: PackageSearch, exact: false },
  { to: "/mon-compte", label: "Profil", icon: UserRound, exact: false },
] as const;

export function MobileTabBar() {
  const { count } = useCart();

  return (
    <nav
      aria-label="Navigation principale mobile"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {tabs.map(({ to, label, icon: Icon, exact }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact }}
              className="relative flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground"
              activeProps={{ className: "!text-primary" }}
            >
              <span className="relative">
                <Icon className="h-5 w-5" aria-hidden />
                {to === "/panier" && count > 0 ? (
                  <span className="mint-surface absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold">
                    {count}
                  </span>
                ) : null}
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
