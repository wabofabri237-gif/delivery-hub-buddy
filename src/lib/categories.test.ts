import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { MARKETPLACE_CATEGORIES, filterCategoryProducts, matchesCategory } from "./categories";

describe("Catégories du marketplace", () => {
  test("les dix catégories demandées sont disponibles", () => {
    assert.deepEqual(MARKETPLACE_CATEGORIES.map((c) => c.name), ["Téléphones & Électronique", "Mode & Vêtements", "Beauté & Cosmétiques", "Alimentation", "Maison", "Automobile", "Informatique", "Chaussures", "Accessoires", "Santé & Bien-être"]);
  });
  test("chaque catégorie ne retourne que ses produits", () => {
    const products = MARKETPLACE_CATEGORIES.map((c, id) => ({ id, category: c.name }));
    for (const [id, category] of MARKETPLACE_CATEGORIES.entries()) assert.deepEqual(filterCategoryProducts(products, category.slug), [{ id, category: category.name }]);
  });
  test("les anciennes catégories restent accessibles sans mélange", () => {
    assert.deepEqual(filterCategoryProducts([{ category: "Électronique" }, { category: "Mode" }, { category: "Informatique" }], "telephones-electronique"), [{ category: "Électronique" }]);
    assert.equal(matchesCategory("Beauté", "beaute-cosmetiques"), true);
    assert.equal(matchesCategory("Mode", "chaussures"), false);
  });
  test("une catégorie inconnue ne montre aucun produit", () => {
    assert.deepEqual(filterCategoryProducts([{ category: "Maison" }], "inconnue"), []);
  });
});