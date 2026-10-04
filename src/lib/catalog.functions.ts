import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { publicSupabase } from "@/lib/supabase-public.server";
import { clean } from "@/lib/vendor-shared";

export type CheckoutItem = {
  product_id: string;
  variant_id?: string | null;
  quantity: number;
};

export type CheckoutInput = {
  items: CheckoutItem[];
  customer_name: string;
  phone: string;
  city: string;
  address?: string;
  payment_method: "orange_money" | "mtn_momo" | "cash";
};

/** Détail public d'un produit : galerie, variantes, boutique et suggestions. */
export const getProductDetail = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => {
    if (!input.id) throw new Error("Produit introuvable");
    return input;
  })
  .handler(async ({ data }) => {
    const supabase = publicSupabase();

    const { data: product } = await supabase
      .from("products")
      .select(
        "id, name, description, price, category, stock, image_url, created_at, shop_id, shops!inner(id, name, slug, city, description, logo_url, is_active)",
      )
      .eq("id", data.id)
      .eq("is_published", true)
      .eq("shops.is_active", true)
      .maybeSingle();

    if (!product) return { product: null, images: [], variants: [], related: [] };

    const shop = product.shops as unknown as {
      id: string;
      name: string;
      slug: string;
      city: string | null;
      description: string | null;
      logo_url: string | null;
    };

    const [images, variants, related] = await Promise.all([
      supabase
        .from("product_images")
        .select("id, url, alt, position")
        .eq("product_id", product.id)
        .order("position", { ascending: true }),
      supabase
        .from("product_variants")
        .select("id, group_name, value, price_delta, stock, position")
        .eq("product_id", product.id)
        .order("position", { ascending: true }),
      supabase
        .from("products")
        .select("id, name, price, image_url, category")
        .eq("shop_id", product.shop_id)
        .eq("is_published", true)
        .neq("id", product.id)
        .limit(6),
    ]);

    return {
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        stock: product.stock,
        image_url: product.image_url,
      },
      shop,
      images: images.data ?? [],
      variants: variants.data ?? [],
      related: related.data ?? [],
    };
  });

/** Passe commande : les prix sont toujours recalculés côté serveur. */
export const createOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CheckoutInput) => {
    if (!Array.isArray(input.items) || input.items.length === 0)
      throw new Error("Votre panier est vide");
    if (input.items.length > 50) throw new Error("Trop d'articles dans le panier");
    for (const item of input.items) {
      if (!item.product_id) throw new Error("Article invalide");
      if (!Number.isFinite(item.quantity) || item.quantity < 1 || item.quantity > 99)
        throw new Error("Quantité invalide");
    }
    if (clean(input.customer_name, 120).length < 3) throw new Error("Nom complet requis");
    if (clean(input.phone, 20).length < 8) throw new Error("Numéro de téléphone invalide");
    if (clean(input.city, 80).length < 2) throw new Error("Ville de livraison requise");
    if (!["orange_money", "mtn_momo", "cash"].includes(input.payment_method))
      throw new Error("Moyen de paiement invalide");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const ids = Array.from(new Set(data.items.map((i) => i.product_id)));
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, stock, shop_id, is_published, shops!inner(id, is_active)")
      .in("id", ids)
      .eq("is_published", true)
      .eq("shops.is_active", true);
    if (productsError) throw new Error(productsError.message);
    if (!products || products.length === 0) throw new Error("Aucun produit disponible");

    const variantIds = data.items
      .map((i) => i.variant_id)
      .filter((v): v is string => typeof v === "string" && v.length > 0);
    const variants = variantIds.length
      ? (
          await supabase
            .from("product_variants")
            .select("id, product_id, group_name, value, price_delta, stock")
            .in("id", variantIds)
        ).data ?? []
      : [];

    type Line = { shop_id: string; product_id: string; name: string; unit_price: number; quantity: number };
    const byShop = new Map<string, Line[]>();

    for (const item of data.items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) throw new Error("Un produit n'est plus disponible");
      const variant = item.variant_id
        ? variants.find((v) => v.id === item.variant_id && v.product_id === product.id)
        : undefined;
      if (item.variant_id && !variant) throw new Error("Variante indisponible");

      const available = variant ? variant.stock : product.stock;
      if (available < item.quantity)
        throw new Error(`Stock insuffisant pour ${product.name} (${available} restant)`);

      const line: Line = {
        shop_id: product.shop_id,
        product_id: product.id,
        name: variant ? `${product.name} — ${variant.group_name}: ${variant.value}` : product.name,
        unit_price: product.price + (variant?.price_delta ?? 0),
        quantity: Math.round(item.quantity),
      };
      byShop.set(product.shop_id, [...(byShop.get(product.shop_id) ?? []), line]);
    }

    const created: { id: string; shop_id: string; total: number }[] = [];

    for (const [shopId, lines] of byShop) {
      const total = lines.reduce((sum, l) => sum + l.unit_price * l.quantity, 0);
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          shop_id: shopId,
          buyer_id: userId,
          status: "en_attente",
          total,
          customer_name: clean(data.customer_name, 120),
          phone: clean(data.phone, 20),
          city: clean(data.city, 80),
          address: clean(data.address, 200) || null,
          payment_method: data.payment_method,
        })
        .select("id")
        .single();
      if (error || !order) throw new Error(error?.message ?? "Commande impossible");

      const { error: itemsError } = await supabase.from("order_items").insert(
        lines.map((l) => ({
          order_id: order.id,
          product_id: l.product_id,
          name: l.name,
          unit_price: l.unit_price,
          quantity: l.quantity,
        })),
      );
      if (itemsError) throw new Error(itemsError.message);

      // Décrémente le stock des variantes commandées (le stock produit est géré par trigger).
      for (const item of data.items) {
        const variant = item.variant_id ? variants.find((v) => v.id === item.variant_id) : undefined;
        if (variant) {
          await supabase
            .from("product_variants")
            .update({ stock: Math.max(0, variant.stock - item.quantity) })
            .eq("id", variant.id);
        }
      }

      created.push({ id: order.id, shop_id: shopId, total });
    }

    return { orders: created };
  });

/** Commandes du client connecté avec leur suivi. */
export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, status, total, city, address, phone, customer_name, payment_method, payment_status, payment_reference, received_at, created_at, updated_at, shop_id, order_items(id, name, unit_price, quantity)",
      )
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    const shopIds = Array.from(new Set((data ?? []).map((o) => o.shop_id)));
    const shops = shopIds.length
      ? (await supabase.from("shops").select("id, name, slug, phone").in("id", shopIds)).data ?? []
      : [];

    return (data ?? []).map((order) => ({
      ...order,
      shop: shops.find((s) => s.id === order.shop_id) ?? null,
    }));
  });
