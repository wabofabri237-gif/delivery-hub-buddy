import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PackageCheck, Clock, Bike, CheckCircle2, XCircle } from "lucide-react";
import { SpaceNav } from "@/components/space-nav";
import { SiteFooter } from "@/components/site-footer";
import { formatFcfa } from "@/lib/marketplace-data";
import { getMyOrders } from "@/lib/catalog.functions";
import { OrderActions } from "@/components/order-actions";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/vendor-shared";

export const Route = createFileRoute("/_authenticated/mes-commandes")({
  head: () => ({
    meta: [
      { title: "Mes commandes — Shop Crew Hub" },
      {
        name: "description",
        content: "Suivez l'état de vos commandes Shop Crew Hub, de la préparation à la livraison.",
      },
      { property: "og:title", content: "Mes commandes — Shop Crew Hub" },
      { property: "og:description", content: "Suivi de commandes et livraisons Shop Crew Hub." },
    ],
  }),
  component: MyOrdersPage,
});

const STEPS: OrderStatus[] = ["en_attente", "preparee", "en_route", "livree"];
const ICONS: Record<string, typeof Clock> = {
  en_attente: Clock,
  preparee: PackageCheck,
  en_route: Bike,
  livree: CheckCircle2,
};

function MyOrdersPage() {
  const fetchOrders = useServerFn(getMyOrders);
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => fetchOrders(),
  });

  return (
    <div className="min-h-screen">
      <SpaceNav />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Mes commandes</h1>

        {isLoading && <p className="panel mt-5 p-5 text-xs text-muted-foreground">Chargement…</p>}
        {error && (
          <p className="panel mt-5 p-5 text-xs text-destructive">
            Impossible de charger vos commandes.
          </p>
        )}

        {data && data.length === 0 && (
          <div className="panel mt-5 p-6 text-center">
            <p className="text-sm font-semibold">Aucune commande pour l'instant</p>
            <Link to="/" className="mint-surface mt-4 inline-block rounded-lg px-4 py-2.5 text-sm font-semibold">
              Découvrir le catalogue
            </Link>
          </div>
        )}

        <ul className="mt-5 grid gap-4">
          {(data ?? []).map((order) => {
            const status = order.status as OrderStatus;
            const stepIndex = STEPS.indexOf(status);
            return (
              <li key={order.id} className="panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {order.shop?.name ?? "Boutique"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      #{order.id.slice(0, 8)} ·{" "}
                      {new Date(order.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      status === "annulee"
                        ? "border border-border text-destructive"
                        : "mint-surface"
                    }`}
                  >
                    {status === "annulee" ? (
                      <XCircle className="h-3.5 w-3.5" aria-hidden />
                    ) : null}
                    {ORDER_STATUS_LABELS[status]}
                  </span>
                </div>

                {status !== "annulee" && (
                  <ol className="mt-4 grid grid-cols-4 gap-1">
                    {STEPS.map((s, i) => {
                      const Icon = ICONS[s] ?? Clock;
                      const done = i <= stepIndex;
                      return (
                        <li key={s} className="text-center">
                          <span
                            className={`mx-auto grid h-8 w-8 place-items-center rounded-full ${
                              done ? "mint-surface" : "border border-border text-muted-foreground"
                            }`}
                          >
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <span className="mt-1 block text-[10px] text-muted-foreground">
                            {ORDER_STATUS_LABELS[s]}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}

                <ul className="mt-4 grid gap-1 border-t border-border pt-3 text-xs text-muted-foreground">
                  {(order.order_items ?? []).map((it) => (
                    <li key={it.id} className="flex justify-between gap-3">
                      <span className="truncate">
                        {it.quantity} × {it.name}
                      </span>
                      <span>{formatFcfa(it.unit_price * it.quantity)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-xs text-muted-foreground">
                    Livraison à {order.city}
                    {order.address ? ` · ${order.address}` : ""}
                  </span>
                  <span className="font-display font-bold text-primary">
                    {formatFcfa(order.total)}
                  </span>
                </div>
                <OrderActions order={order} />
              </li>
            );
          })}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
