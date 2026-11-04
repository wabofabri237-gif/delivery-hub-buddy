import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_orders", title: "Consulter mes commandes",
  description: "Lire uniquement les commandes achetées par le compte connecté et leurs statuts, sans les modifier.",
  inputSchema: { limit: z.number().int().min(1).max(30).default(10).describe("Nombre maximal de commandes récentes." ) },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    const db = supabaseForUser(ctx);
    const { data, error } = await db.from("orders").select("id,status,payment_status,total,created_at,received_at").eq("buyer_id", ctx.getUserId() ?? "").order("created_at", { ascending: false }).limit(limit);
    if (error) throw new ToolError("Impossible de consulter vos commandes.");
    const orders = (data ?? []).map((o) => ({ id: o.id, status: o.status, payment_status: o.payment_status, total_fcfa: o.total, created_at: o.created_at, received_at: o.received_at }));
    return { content: [{ type: "text", text: orders.length ? JSON.stringify(orders) : "Vous n’avez aucune commande." }], structuredContent: { orders } };
  },
});