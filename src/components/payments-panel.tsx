import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { formatFcfa } from "@/lib/marketplace-data";
import { listPaymentsToVerify, confirmPayment, rejectPayment } from "@/lib/delivery.functions";

const METHOD: Record<string, string> = { orange_money: "Orange Money", mtn_momo: "MTN MoMo" };

/** Vérification manuelle des paiements Mobile Money (source de vérité : relevé opérateur). */
export function PaymentsPanel() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listPaymentsToVerify);
  const confirm = useServerFn(confirmPayment);
  const reject = useServerFn(rejectPayment);
  const [busy, setBusy] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({ queryKey: ["payments-to-verify"], queryFn: () => fetchList() });

  const run = useMutation({
    mutationFn: async (a: { id: string; kind: "ok" | "ko" }) => {
      setBusy(a.id);
      return a.kind === "ok" ? confirm({ data: { id: a.id } }) : reject({ data: { id: a.id, cancel: false } });
    },
    onSuccess: (_r, a) => {
      toast.success(a.kind === "ok" ? "Paiement confirmé : course disponible pour les livreurs" : "Paiement refusé, commande annulée");
      qc.invalidateQueries({ queryKey: ["payments-to-verify"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setBusy(null),
  });

  return (
    <section className="panel mt-6 p-5">
      <h2 className="text-base font-bold">Paiements à vérifier</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Confirmez un paiement seulement après l'avoir vu sur votre relevé Orange Money / MTN MoMo.
        La commande devient alors disponible pour les livreurs certifiés.
      </p>
      {isLoading && <p className="mt-3 text-xs text-muted-foreground">Chargement…</p>}
      {error && <p className="mt-3 text-xs text-destructive">Impossible de charger les paiements.</p>}
      {data && data.length === 0 && <p className="mt-3 text-xs text-muted-foreground">Aucun paiement en attente.</p>}
      <ul className="mt-3 grid gap-3">
        {(data ?? []).map((o) => (
          <li key={o.id} className="rounded-lg border border-border bg-surface/60 p-3 text-xs">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-semibold">#{o.id.slice(0, 8)} · {(o.shops as { name?: string } | null)?.name ?? "Boutique"}</span>
              <span className="font-display font-bold text-primary">{formatFcfa(o.total)}</span>
            </div>
            <p className="mt-1 text-muted-foreground">
              {o.customer_name} · {o.phone} · {METHOD[o.payment_method] ?? o.payment_method}
            </p>
            <p className="mt-1">
              Référence client : <strong>{o.payment_reference ?? "non fournie"}</strong>
            </p>
            <div className="mt-2 flex gap-2">
              <button
                disabled={busy === o.id}
                onClick={() => run.mutate({ id: o.id, kind: "ok" })}
                className="mint-surface rounded-lg px-3 py-2 font-semibold disabled:opacity-50"
              >
                Confirmer le paiement
              </button>
              <button
                disabled={busy === o.id}
                onClick={() => run.mutate({ id: o.id, kind: "ko" })}
                className="rounded-lg border border-border px-3 py-2 text-destructive disabled:opacity-50"
              >
                Refuser
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
