import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { clean } from "@/lib/vendor-shared";

async function assertOwnsProduct(
  supabase: { from: (t: string) => any },
  userId: string,
  productId: string,
) {
  const { data } = await supabase
    .from("products")
    .select("id, name, shops!inner(owner_id)")
    .eq("id", productId)
    .maybeSingle();
  const owner = (data?.shops as unknown as { owner_id: string } | undefined)?.owner_id;
  if (!data || owner !== userId) throw new Error("Produit introuvable");
  return data as { id: string; name: string };
}

/** Galerie + variantes d'un produit du vendeur connecté. */
export const getProductMedia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { product_id: string }) => {
    if (!input.product_id) throw new Error("Produit introuvable");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const product = await assertOwnsProduct(supabase as never, userId, data.product_id);
    const [images, variants] = await Promise.all([
      supabase
        .from("product_images")
        .select("id, url, alt, position")
        .eq("product_id", data.product_id)
        .order("position", { ascending: true }),
      supabase
        .from("product_variants")
        .select("id, group_name, value, price_delta, stock, position")
        .eq("product_id", data.product_id)
        .order("position", { ascending: true }),
    ]);
    return { product, images: images.data ?? [], variants: variants.data ?? [] };
  });

export const addProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { product_id: string; url: string; alt?: string }) => {
    if (!input.product_id) throw new Error("Produit introuvable");
    if (!/^https?:\/\/\S+$/i.test(clean(input.url, 500)))
      throw new Error("Adresse d'image invalide (https://…)");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertOwnsProduct(supabase as never, userId, data.product_id);
    const { count } = await supabase
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("product_id", data.product_id);
    if ((count ?? 0) >= 8) throw new Error("8 images maximum par produit");

    const { error } = await supabase.from("product_images").insert({
      product_id: data.product_id,
      url: clean(data.url, 500),
      alt: clean(data.alt, 160) || null,
      position: count ?? 0,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input.id) throw new Error("Image introuvable");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("product_images").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const saveProductVariant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id?: string;
      product_id: string;
      group_name: string;
      value: string;
      price_delta: number;
      stock: number;
    }) => {
      if (!input.product_id) throw new Error("Produit introuvable");
      if (clean(input.group_name, 40).length < 2) throw new Error("Nom d'option requis");
      if (clean(input.value, 40).length < 1) throw new Error("Valeur requise");
      if (!Number.isFinite(input.price_delta)) throw new Error("Supplément invalide");
      if (!Number.isFinite(input.stock) || input.stock < 0) throw new Error("Stock invalide");
      return input;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertOwnsProduct(supabase as never, userId, data.product_id);
    const payload = {
      product_id: data.product_id,
      group_name: clean(data.group_name, 40),
      value: clean(data.value, 40),
      price_delta: Math.round(data.price_delta),
      stock: Math.round(data.stock),
    };
    const { error } = data.id
      ? await supabase.from("product_variants").update(payload).eq("id", data.id)
      : await supabase.from("product_variants").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteProductVariant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input.id) throw new Error("Variante introuvable");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("product_variants").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
