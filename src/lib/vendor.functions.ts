import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  clean,
  ORDER_STATUSES,
  VENDOR_SETTABLE_STATUSES,
  type OrderStatus,
} from "@/lib/vendor-shared";
import { publicSupabase } from "@/lib/supabase-public.server";

export type ProductInput = {
  id?: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  image_url?: string;
  is_published: boolean;
};

export type ShopInput = {
  name: string;
  description?: string;
  city?: string;
  phone?: string;
  momo_number?: string;
  logo_url?: string;
};

export const getMyShop = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: shop } = await supabase
      .from("shops")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();

    if (!shop) return { shop: null, products: [], orders: [] };

    const [products, orders] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("shop_id", shop.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("*, order_items(id, name, unit_price, quantity)")
        .eq("shop_id", shop.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    return { shop, products: products.data ?? [], orders: orders.data ?? [] };
  });

export const updateMyShop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ShopInput) => {
    if (clean(input.name, 80).length < 2) throw new Error("Nom de boutique requis");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("shops")
      .update({
        name: clean(data.name, 80),
        description: clean(data.description, 600) || null,
        city: clean(data.city, 80) || null,
        phone: clean(data.phone, 20) || null,
        momo_number: clean(data.momo_number, 20) || null,
        logo_url: clean(data.logo_url, 300) || null,
      })
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ProductInput) => {
    if (clean(input.name, 120).length < 2) throw new Error("Nom du produit requis");
    if (!Number.isFinite(input.price) || input.price < 0) throw new Error("Prix invalide");
    if (!Number.isFinite(input.stock) || input.stock < 0) throw new Error("Stock invalide");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: shop } = await supabase
      .from("shops")
      .select("id, is_active")
      .eq("owner_id", userId)
      .maybeSingle();
    if (!shop) throw new Error("Aucune boutique validée");
    if (!shop.is_active) throw new Error("Boutique non activée par l'administrateur");

    const payload = {
      shop_id: shop.id,
      name: clean(data.name, 120),
      description: clean(data.description, 800) || null,
      price: Math.round(data.price),
      category: clean(data.category, 40) || "Autre",
      stock: Math.round(data.stock),
      image_url: clean(data.image_url, 400) || null,
      is_published: data.is_published,
    };

    const { error } = data.id
      ? await supabase.from("products").update(payload).eq("id", data.id).eq("shop_id", shop.id)
      : await supabase.from("products").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input.id) throw new Error("Produit introuvable");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: OrderStatus }) => {
    if (!input.id) throw new Error("Commande introuvable");
    if (!ORDER_STATUSES.includes(input.status)) throw new Error("Statut invalide");
    return input;
  })
  .handler(async ({ data, context }) => {
    // Vendors may only prepare or cancel; "en_route"/"livree" belong to the courier workflow.
    if (!VENDOR_SETTABLE_STATUSES.includes(data.status)) {
      throw new Error("Ce statut est géré par le livreur.");
    }
    const { data: current, error: readErr } = await context.supabase
      .from("orders")
      .select("status")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!current) throw new Error("Commande introuvable");
    if (!VENDOR_SETTABLE_STATUSES.includes(current.status as OrderStatus)) {
      throw new Error("Cette commande est déjà prise en charge par la livraison.");
    }
    const { error } = await context.supabase
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const getPublicShop = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => {
    if (!input.slug) throw new Error("Boutique introuvable");
    return input;
  })
  .handler(async ({ data }) => {
    const supabase = publicSupabase();
    const { data: shop } = await supabase
      .from("shops")
      .select("id, name, slug, description, city, logo_url")
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!shop) return { shop: null, products: [] };

    const { data: products } = await supabase
      .from("products")
      .select("id, name, description, price, category, stock, image_url")
      .eq("shop_id", shop.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    return { shop, products: products ?? [] };
  });

export const listPublicShops = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicSupabase();
  const { data } = await supabase
    .from("shops")
    .select("id, name, slug, description, city, logo_url")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(24);
  return data ?? [];
});

export const listPublicCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicSupabase();
  const { data } = await supabase
    .from("products")
    .select("id, name, price, category, stock, image_url, shops!inner(name, slug, is_active)")
    .eq("is_published", true)
    .eq("shops.is_active", true)
    .order("created_at", { ascending: false })
    .limit(60);

  const products = (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category,
    stock: p.stock,
    image_url: p.image_url,
    shop_name: (p.shops as unknown as { name: string; slug: string }).name,
    shop_slug: (p.shops as unknown as { name: string; slug: string }).slug,
  }));

  const categories = Array.from(new Set(products.map((p) => p.category))).sort();
  return { products, categories };
});
