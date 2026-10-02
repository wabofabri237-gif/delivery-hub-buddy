import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Rpc =
  | "confirm_order_payment"
  | "reject_order_payment"
  | "submit_payment_reference"
  | "buyer_cancel_order"
  | "buyer_confirm_receipt"
  | "courier_accept_order"
  | "courier_start_delivery"
  | "courier_complete_delivery";

const ORDER_FIELDS =
  "id, status, payment_status, payment_method, payment_reference, total, customer_name, phone, city, address, created_at, paid_at, accepted_at, delivered_at, received_at, courier_id, shop_id, order_items(id, name, quantity, unit_price)";

const idOnly = (input: { id: string }) => {
  if (!input?.id || typeof input.id !== "string") throw new Error("Commande invalide");
  return input;
};

async function call(
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ error: { message: string } | null }> },
  fn: Rpc,
  args: Record<string, unknown>,
) {
  const { error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return { ok: true };
}

/* ---------- Livreur ---------- */

export const getCourierBoard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("orders")
      .select(`${ORDER_FIELDS}, shops(name, city, phone)`)
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    return {
      available: rows.filter((o) => o.courier_id === null && o.status === "preparee"),
      mine: rows.filter((o) => o.courier_id === userId && o.status !== "livree" && o.status !== "annulee"),
      done: rows.filter((o) => o.courier_id === userId && o.status === "livree"),
    };
  });

export const courierAccept = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idOnly)
  .handler(({ data, context }) => call(context.supabase as never, "courier_accept_order", { _order_id: data.id }));

export const courierStart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idOnly)
  .handler(({ data, context }) => call(context.supabase as never, "courier_start_delivery", { _order_id: data.id }));

export const courierComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idOnly)
  .handler(({ data, context }) => call(context.supabase as never, "courier_complete_delivery", { _order_id: data.id }));

/* ---------- Client ---------- */

export const submitPaymentReference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; reference: string }) => {
    idOnly(input);
    if ((input.reference ?? "").trim().length < 4) throw new Error("Référence de transaction invalide");
    return input;
  })
  .handler(({ data, context }) =>
    call(context.supabase as never, "submit_payment_reference", { _order_id: data.id, _reference: data.reference }),
  );

export const cancelMyOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idOnly)
  .handler(({ data, context }) => call(context.supabase as never, "buyer_cancel_order", { _order_id: data.id }));

export const confirmReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idOnly)
  .handler(({ data, context }) => call(context.supabase as never, "buyer_confirm_receipt", { _order_id: data.id }));

/* ---------- Administrateur ---------- */

export const listPaymentsToVerify = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select(`${ORDER_FIELDS}, shops(name)`)
      .neq("payment_method", "cash")
      .eq("payment_status", "en_attente")
      .neq("status", "annulee")
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const confirmPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; reference?: string }) => idOnly(input) && input)
  .handler(({ data, context }) =>
    call(context.supabase as never, "confirm_order_payment", { _order_id: data.id, _reference: data.reference ?? "" }),
  );

export const rejectPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; cancel: boolean }) => idOnly(input) && input)
  .handler(({ data, context }) =>
    call(context.supabase as never, "reject_order_payment", { _order_id: data.id, _cancel: Boolean(data.cancel) }),
  );
