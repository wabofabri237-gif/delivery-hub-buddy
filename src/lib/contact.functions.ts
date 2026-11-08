import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { contactSchema } from "./contact-schema";

export const submitContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => contactSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("contact_submissions")
      .insert({ ...data, user_id: context.userId }).select("id").single();
    if (error) throw new Error("La demande n’a pas pu être enregistrée. Réessayez.");
    return { id: row.id };
  });

export const listContacts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !admin) throw new Error("Accès refusé");
    const { data, error } = await context.supabase.from("contact_submissions")
      .select("id, full_name, email, subject, message, created_at").order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error("Impossible de charger les demandes");
    return data ?? [];
  });