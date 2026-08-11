export type Product = {
  id: string;
  name: string;
  vendor: string;
  price: number;
  category: string;
  rating: number;
  stock: number;
};

export const categories = [
  "Tout",
  "Électronique",
  "Mode",
  "Maison",
  "Beauté",
  "Sport",
] as const;

export const products: Product[] = [
  { id: "p1", name: "Casque ANC Studio", vendor: "AudioLab", price: 84500, category: "Électronique", rating: 4.8, stock: 24 },
  { id: "p2", name: "Sneakers Runner V2", vendor: "Kicks CM", price: 39900, category: "Mode", rating: 4.6, stock: 12 },
  { id: "p3", name: "Lampe Arc Minimal", vendor: "Maison Nord", price: 27000, category: "Maison", rating: 4.4, stock: 7 },
  { id: "p4", name: "Montre Solaire", vendor: "Chrono225", price: 129000, category: "Électronique", rating: 4.9, stock: 3 },
  { id: "p5", name: "Sérum Éclat", vendor: "Baobab Skin", price: 18500, category: "Beauté", rating: 4.7, stock: 41 },
  { id: "p6", name: "Tapis Yoga Pro", vendor: "FlexFit", price: 22000, category: "Sport", rating: 4.3, stock: 18 },
  { id: "p7", name: "Sac Tote Toile", vendor: "Atelier Wouri", price: 15000, category: "Mode", rating: 4.5, stock: 33 },
  { id: "p8", name: "Enceinte Nomade", vendor: "AudioLab", price: 46000, category: "Électronique", rating: 4.2, stock: 9 },
];

export type OrderStatus = "En attente" | "Préparée" | "En route" | "Livrée";

export type Order = {
  id: string;
  customer: string;
  city: string;
  items: number;
  total: number;
  status: OrderStatus;
  vendor: string;
};

export const orders: Order[] = [
  { id: "CMD-4821", customer: "A. Nkeng", city: "Douala, Bonapriso", items: 2, total: 103500, status: "En route", vendor: "AudioLab" },
  { id: "CMD-4820", customer: "M. Foka", city: "Yaoundé, Bastos", items: 1, total: 39900, status: "Préparée", vendor: "Kicks CM" },
  { id: "CMD-4819", customer: "S. Ateba", city: "Douala, Akwa", items: 4, total: 187000, status: "En attente", vendor: "Maison Nord" },
  { id: "CMD-4818", customer: "L. Mbarga", city: "Kribi Centre", items: 1, total: 22000, status: "Livrée", vendor: "FlexFit" },
  { id: "CMD-4817", customer: "J. Tchoua", city: "Douala, Bonaberi", items: 3, total: 74500, status: "En route", vendor: "Baobab Skin" },
];

export const adminStats = [
  { label: "Chiffre d'affaires", value: "12,4 M FCFA", delta: "+18,2%" },
  { label: "Commandes", value: "1 284", delta: "+6,4%" },
  { label: "Vendeurs actifs", value: "96", delta: "+3" },
  { label: "Litiges ouverts", value: "7", delta: "-2" },
];

export const deliveries = [
  { id: "LIV-231", pickup: "AudioLab, Akwa", dropoff: "Bonapriso, Rue 12", distance: "4,2 km", payout: 1500, window: "18:20 - 18:50" },
  { id: "LIV-232", pickup: "Kicks CM, Ndokotti", dropoff: "Bonamoussadi", distance: "7,8 km", payout: 2200, window: "19:00 - 19:40" },
  { id: "LIV-233", pickup: "Maison Nord, Bali", dropoff: "Deido, Av. Sawa", distance: "3,1 km", payout: 1200, window: "19:30 - 20:00" },
];

export const formatFcfa = (n: number) =>
  `${n.toLocaleString("fr-FR").replace(/\u202f/g, " ")} FCFA`;
