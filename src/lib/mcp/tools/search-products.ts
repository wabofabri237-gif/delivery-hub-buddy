import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { filterCategoryProducts, MARKETPLACE_CATEGORIES } from "@/lib/categories";

export default defineTool({
  name: "search_products", title: "Rechercher des produits",
  description: "Consulter les produits publiés des boutiques actives, avec recherche et catégorie facultatives.",
  inputSchema: {
    query: z.string().max(120).optional().describe("Texte recherché dans le nom du produit."),
    category: z.string().refine((value) => MARKETPLACE_CATEGORIES.some((c) => c.slug === value), "Catégorie inconnue").optional().describe("Identifiant de catégorie retourné par list_categories."),
    limit: z.number().int().min(1).max(30).default(15).describe("Nombre maximal de résultats, de 1 à 30."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, limit }, ctx) => {
    const db = supabaseForUser(ctx);
    const { data, error } = await db.from("products").select("id,name,price,category,stock,shops!inner(name,slug,is_active)").eq("is_published", true).eq("shops.is_active", true).order("created_at", { ascending: false }).limit(60);
    if (error) throw new ToolError("Impossible de charger le catalogue.");
    const candidates = category ? filterCategoryProducts(data ?? [], category) : data ?? [];
    const products = candidates.filter((p) => !query || p.name.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr"))).slice(0, limit).map((p) => ({ id: p.id, name: p.name, price_fcfa: p.price, category: p.category, stock: p.stock, shop: p.shops.name, shop_slug: p.shops.slug }));
    return { content: [{ type: "text", text: products.length ? JSON.stringify(products) : "Aucun produit correspondant." }], structuredContent: { products } };
  },
});