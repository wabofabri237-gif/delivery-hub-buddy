export const ORDER_STATUSES = ["en_attente", "preparee", "en_route", "livree", "annulee"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Statuses a vendor may set; "en_route" and "livree" are reserved for couriers. */
export const VENDOR_SETTABLE_STATUSES: readonly OrderStatus[] = ["en_attente", "preparee", "annulee"];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  en_attente: "En attente",
  preparee: "Préparée",
  en_route: "En route",
  livree: "Livrée",
  annulee: "Annulée",
};

export const PRODUCT_CATEGORIES = [
  "Électronique",
  "Mode",
  "Maison",
  "Beauté",
  "Sport",
  "Alimentation",
  "Autre",
] as const;

export const clean = (v: string | undefined, max: number) => (v ?? "").trim().slice(0, max);
