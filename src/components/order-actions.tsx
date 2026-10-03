import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { submitPaymentReference, cancelMyOrder, confirmReceipt } from "@/lib/delivery.functions";

const PAY_LABEL: Record<string, string> = {
  en_attente: "Paiement en attente de vérification",
  confirme: "Paiement confirmé",
  echoue: "Paiement refusé",
  annule: "Paiement annulé",
};

type Props = {
  order: {
    id: string;
    status: string;
    payment_method: string;
    payment_status: string;
    payment_reference: string | null;
    received_at: string | null;
  };
};

export function OrderActions({ order }: Props) {
  const qc = useQueryClient();
  const sendRef = useServerFn(submitPaymentReference);
  const cancel = useServerFn(cancelMyOrder);
  const receive = useServerFn(confirmReceipt);
  const [ref, setRef] = useState(order.payment_reference ?? "");

  const m = useMutation({
    mutationFn: (kind: "ref" | "cancel" | "receive") =>
      kind === "ref"
        ? sendRef({ data: { id: order.id, reference: ref } })
        : kind === "cancel"
          ? cancel({ data: { id: order.id } })
          : receive({ data: { id: order.id } }),
    onSuccess: (_r, kind) => {
      toast.success(kind === "ref" ? "Référence envoyée pour vérification" : kind === "cancel" ? "Commande annulée" : "Réception confirmée, merci !");
      qc.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mobile = order.payment_method !== "cash";
  const awaitingPayment = mobile && order.status === "en_attente" && order.payment_status === "en_attente";

  return (
    <div className="mt-3 grid gap-2 border-t border-border pt-3 text-xs">
      <p className="text-muted-foreground">
        {mobile ? PAY_LABEL[order.payment_status] : order.payment_status === "confirme" ? "Payé à la livraison" : "Paiement à la livraison"}
      </p>
      {awaitingPayment && (
        <div className="flex flex-wrap gap-2">
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="ID de transaction Mobile Money"
            className="h-9 flex-1 rounded-lg border border-border bg-input/60 px-3 outline-none focus:border-primary"
          />
          <button disabled={m.isPending} onClick={() => m.mutate("ref")} className="mint-surface rounded-lg px-3 font-semibold disabled:opacity-50">
            Envoyer
          </button>
        </div>
      )}
      {order.status === "en_attente" && order.payment_status !== "confirme" && (
        <button disabled={m.isPending} onClick={() => m.mutate("cancel")} className="justify-self-start text-destructive underline disabled:opacity-50">
          Annuler la commande
        </button>
      )}
      {order.status === "livree" && !order.received_at && (
        <button disabled={m.isPending} onClick={() => m.mutate("receive")} className="mint-surface justify-self-start rounded-lg px-3 py-2 font-semibold disabled:opacity-50">
          J'ai bien reçu ma commande
        </button>
      )}
      {order.received_at && <p className="font-semibold text-primary">Commande terminée</p>}
    </div>
  );
}
