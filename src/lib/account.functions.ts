import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AppRole = "admin" | "client" | "vendeur" | "livreur";

export type ApplicationInput = {
  type: "vendeur" | "livreur";
  full_name: string;
  phone: string;
  city: string;
  shop_name?: string;
  shop_description?: string;
  vehicle?: string;
  id_document?: string;
  momo_number?: string;
};

const clean = (v: string | undefined, max: number) => (v ?? "").trim().slice(0, max);

export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [roles, apps, profile] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase
        .from("applications")
        .select("id, type, status, reason, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("full_name, phone, city").eq("id", userId).maybeSingle(),
    ]);

    return {
      userId,
      email: (context.claims as { email?: string } | undefined)?.email ?? null,
      roles: (roles.data ?? []).map((r) => r.role as AppRole),
      applications: apps.data ?? [],
      profile: profile.data ?? null,
    };
  });

export const requireAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!data) throw redirect({ to: "/" });
    return { ok: true as const };
  });

export const submitApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ApplicationInput) => {
    if (input.type !== "vendeur" && input.type !== "livreur") throw new Error("Type invalide");
    if (clean(input.full_name, 120).length < 3) throw new Error("Nom complet requis");
    if (clean(input.phone, 20).length < 8) throw new Error("Numéro de téléphone invalide");
    if (clean(input.city, 80).length < 2) throw new Error("Ville requise");
    if (input.type === "vendeur" && clean(input.shop_name, 80).length < 2)
      throw new Error("Nom de boutique requis");
    if (input.type === "livreur" && clean(input.vehicle, 60).length < 2)
      throw new Error("Type de véhicule requis");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", data.type)
      .eq("status", "en_attente")
      .maybeSingle();
    if (existing) throw new Error("Une demande est déjà en cours d'examen.");

    const { error } = await supabase.from("applications").insert({
      user_id: userId,
      type: data.type,
      status: "en_attente",
      full_name: clean(data.full_name, 120),
      phone: clean(data.phone, 20),
      city: clean(data.city, 80),
      shop_name: data.type === "vendeur" ? clean(data.shop_name, 80) : null,
      shop_description: data.type === "vendeur" ? clean(data.shop_description, 500) : null,
      vehicle: data.type === "livreur" ? clean(data.vehicle, 60) : null,
      id_document: clean(data.id_document, 60) || null,
      momo_number: clean(data.momo_number, 20) || null,
    });
    if (error) throw new Error(error.message);

    await supabase
      .from("profiles")
      .update({
        full_name: clean(data.full_name, 120),
        phone: clean(data.phone, 20),
        city: clean(data.city, 80),
      })
      .eq("id", userId);

    return { ok: true as const };
  });

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Accès refusé");

    const { data, error } = await context.supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const decideApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; approve: boolean; reason?: string }) => {
    if (!input.id) throw new Error("Demande introuvable");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Accès refusé");

    const { error } = await context.supabase
      .from("applications")
      .update({
        status: data.approve ? "approuvee" : "rejetee",
        reason: clean(data.reason, 300) || null,
        decided_at: new Date().toISOString(),
        decided_by: context.userId,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Accès refusé");

    const [profiles, roles, apps] = await Promise.all([
      supabase.from("profiles").select("id, full_name, city, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("user_roles").select("role"),
      supabase.from("applications").select("id, type, status, created_at"),
    ]);

    const roleRows = roles.data ?? [];
    const appRows = apps.data ?? [];
    const count = (arr: { role?: string }[], role: AppRole) =>
      arr.filter((r) => r.role === role).length;

    return {
      totals: {
        accounts: profiles.count ?? 0,
        vendeurs: count(roleRows, "vendeur"),
        livreurs: count(roleRows, "livreur"),
        pending: appRows.filter((a) => a.status === "en_attente").length,
      },
      applications: {
        total: appRows.length,
        approuvee: appRows.filter((a) => a.status === "approuvee").length,
        rejetee: appRows.filter((a) => a.status === "rejetee").length,
        vendeur: appRows.filter((a) => a.type === "vendeur").length,
        livreur: appRows.filter((a) => a.type === "livreur").length,
      },
      recentAccounts: profiles.data ?? [],
    };
  });
