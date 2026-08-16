import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = {
  key: string;
  product_id: string;
  variant_id: string | null;
  name: string;
  variant_label: string | null;
  unit_price: number;
  quantity: number;
  image_url: string | null;
  shop_name: string;
  shop_slug: string;
  max_stock: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  total: number;
  ready: boolean;
  add: (line: Omit<CartLine, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "sokomarket.cart.v1";
const CartContext = createContext<CartContextValue | null>(null);

function lineKey(productId: string, variantId: string | null) {
  return `${productId}::${variantId ?? "default"}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) setLines(parsed.filter((l) => l && l.product_id));
      }
    } catch {
      /* panier illisible : on repart d'un panier vide */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* quota dépassé : ignoré */
    }
  }, [lines, ready]);

  const add = useCallback((line: Omit<CartLine, "key">) => {
    const key = lineKey(line.product_id, line.variant_id);
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) =>
          l.key === key
            ? { ...l, quantity: Math.min(l.max_stock || 99, l.quantity + line.quantity) }
            : l,
        );
      }
      return [...prev, { ...line, key }];
    });
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((prev) =>
      prev
        .map((l) =>
          l.key === key
            ? { ...l, quantity: Math.max(0, Math.min(l.max_stock || 99, Math.round(quantity))) }
            : l,
        )
        .filter((l) => l.quantity > 0),
    );
  }, []);

  const remove = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    return {
      lines,
      ready,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      total: lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0),
      add,
      setQuantity,
      remove,
      clear,
    };
  }, [lines, ready, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans un CartProvider");
  return ctx;
}
