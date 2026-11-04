import { defineTool } from "@lovable.dev/mcp-js";
import { MARKETPLACE_CATEGORIES } from "@/lib/categories";

export default defineTool({
  name: "list_categories", title: "Consulter les catégories",
  description: "Lister les catégories du marketplace et leurs identifiants pour rechercher des produits.",
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const categories = MARKETPLACE_CATEGORIES.map((c) => ({ id: c.slug, name: c.name }));
    return { content: [{ type: "text", text: JSON.stringify(categories) }], structuredContent: { categories } };
  },
});