import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MapPin, Phone } from "lucide-react";
import { formatFcfa } from "@/lib/marketplace-data";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/vendor-shared";
import { getCourierBoard, courierAccept, courierStart, courierComplete } from "@/lib/delivery.functions";

type Board = Awaited<ReturnType<typeof getCourierBoard>>;
type Row = Board["available"][number];

export function CourierBoard() {
  const qc = useQueryClient();
  const fetchBoard = useServerFn(getCourierBoard);
  const accept = useServerFn(courierAccept);
  const start = useServerFn(courierStart);
  const complete = useServerFn(courierComplete);
  const [busy, setBusy] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["courier-board"],
    queryFn: () => fetchBoard(),
    refetchInterval: 20000,
  });

  const act = useMutation({
    mutationFn: async (a: { id: string; kind: "accept" | "start" | "done" }) => {
      setBusy(a.id);
      const fn = a.kind === "accept" ? accept : a.kind === "start" ? start : complete;
      return fn({ data: { id: a.id } });
    },
    onSuccess: (_r, a) => {
      toast.success(a.kind === "accept" ? "Course acceptée" : a.kind === "start" ? "Livraison en cours" : "Livraison terminée");
      qc.invalidateQueries({ queryKey: ["courier-board"] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: ["courier-board"] });
    },
    onSettled: () => setBusy(null),
  });

  const card = (o: Row, action?: { label: string; kind: "accept" | "start" | "done" }) => {
    const shop = o.shops as { name?: string; city?: string | null; phone?: string | null } | null;
    return (
      <li key={o.id} className="rounded-lg border border-border bg-surface/60 p-3 text-xs">
        <div className="flex flex-wrap justify-between gap-2">
          <span className="font-semibold">#{o.id.slice(0, 8)} · {shop?.name ?? "Boutique"}</span>
          <span className="font-display font-bold text-primary">{formatFcfa(o.total)}</span>
        </div>
        <p className="mt-1 text-muted-foreground">
          {ORDER_STATUS_LABELS[o.status as OrderStatus]} ·{" "}
          {o.payment_method === "cash" ? "À encaisser à la livraison" : "Payée"}
        </p>
        <p className="mt-1 flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" aria-hidden />
          {o.city}{o.address ? ` · ${o.address}` : ""}
        </p>
        <p className="mt-1 flex items-center gap-1"><Phone className="h-3 w-3 text-primary" aria-hidden />
          {o.customer_name} · {o.phone}
        </p>
        <ul className="mt-1 text-muted-foreground">
          {(o.order_items ?? []).map((it) => <li key={it.id}>{it.quantity} × {it.name}</li>)}
        </ul>
        {action && (
          <button
            disabled={busy === o.id}
            onClick={() => act.mutate({ id: o.id, kind: action.kind })}
            className="mint-surface mt-2 rounded-lg px-3 py-2 font-semibold disabled:opacity-50"
          >
            {busy === o.id ? "…" : action.label}
          </button>
        )}
      </li>
    );
  };

  if (isLoading) return <p className="panel mt-5 p-5 text-xs text-muted-foreground">Chargement des courses…</p>;
  if (error || !data) return <p className="panel mt-5 p-5 text-xs text-destructive">Impossible de charger les courses.</p>;

  return (
    <>
      <section className="panel mt-5 p-5">
        <h2 className="text-base font-bold">Mes courses en cours ({data.mine.length})</h2>
        {data.mine.length === 0 && <p className="mt-2 text-xs text-muted-foreground">Aucune course en cours.</p>}
        <ul className="mt-3 grid gap-3">
          {data.mine.map((o) =>
            card(o, o.status === "preparee" ? { label: "Démarrer la livraison", kind: "start" } : { label: "Marquer livrée", kind: "done" }),
          )}
        </ul>
      </section>
      <section className="panel mt-5 p-5">
        <h2 className="text-base font-bold">Courses disponibles ({data.available.length})</h2>
        {data.available.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">Aucune commande payée en attente de livreur pour le moment.</p>
        )}
        <ul className="mt-3 grid gap-3">{data.available.map((o) => card(o, { label: "Accepter la course", kind: "accept" }))}</ul>
      </section>
      <section className="panel mt-5 p-5">
        <h2 className="text-base font-bold">Livrées ({data.done.length})</h2>
        <ul className="mt-3 grid gap-3">{data.done.slice(-10).map((o) => card(o))}</ul>
      </section>
    </>
  );
}
