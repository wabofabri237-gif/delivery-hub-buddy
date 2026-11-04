export const MARKETPLACE_CATEGORIES = [
  { slug: "telephones-electronique", name: "Téléphones & Électronique", aliases: ["Électronique", "Téléphones", "Téléphonie"] },
  { slug: "mode-vetements", name: "Mode & Vêtements", aliases: ["Mode", "Vêtements"] },
  { slug: "beaute-cosmetiques", name: "Beauté & Cosmétiques", aliases: ["Beauté", "Cosmétiques"] },
  { slug: "alimentation", name: "Alimentation", aliases: ["Épicerie"] },
  { slug: "maison", name: "Maison", aliases: [] },
  { slug: "automobile", name: "Automobile", aliases: ["Auto"] },
  { slug: "informatique", name: "Informatique", aliases: [] },
  { slug: "chaussures", name: "Chaussures", aliases: [] },
  { slug: "accessoires", name: "Accessoires", aliases: [] },
  { slug: "sante-bien-etre", name: "Santé & Bien-être", aliases: ["Santé", "Bien-être"] },
] as const;

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
}

export function matchesCategory(productCategory: string, slug: string): boolean {
  const category = MARKETPLACE_CATEGORIES.find((c) => c.slug === slug);
  if (!category) return false;
  return [category.name, ...category.aliases].some((name) => normalize(name) === normalize(productCategory));
}

export function filterCategoryProducts<T extends { category: string }>(products: T[], slug: string): T[] {
  return products.filter((p) => matchesCategory(p.category, slug));
}