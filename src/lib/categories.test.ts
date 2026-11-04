import { describe, expect, test } from "bun:test";
import { MARKETPLACE_CATEGORIES, filterCategoryProducts, matchesCategory } from "./categories";

describe("Catégories du marketplace", () => {
  test("les dix catégories demandées sont disponibles", () => {
    expect(MARKETPLACE_CATEGORIES.map((c) => c.name)).toEqual(["Téléphones & Électronique", "Mode & Vêtements", "Beauté & Cosmétiques", "Alimentation", "Maison", "Automobile", "Informatique", "Chaussures", "Accessoires", "Santé & Bien-être"]);
  });
  test("chaque catégorie ne retourne que ses produits", () => {
    const products = MARKETPLACE_CATEGORIES.map((c, id) => ({ id, category: c.name }));
    for (const [id, category] of MARKETPLACE_CATEGORIES.entries()) expect(filterCategoryProducts(products, category.slug)).toEqual([{ id, category: category.name }]);
  });
  test("les anciennes catégories restent accessibles sans mélange", () => {
    expect(filterCategoryProducts([{ category: "Électronique" }, { category: "Mode" }, { category: "Informatique" }], "telephones-electronique")).toEqual([{ category: "Électronique" }]);
    expect(matchesCategory("Beauté", "beaute-cosmetiques")).toBe(true);
    expect(matchesCategory("Mode", "chaussures")).toBe(false);
  });
  test("une catégorie inconnue ne montre aucun produit", () => {
    expect(filterCategoryProducts([{ category: "Maison" }], "inconnue")).toEqual([]);
  });
});