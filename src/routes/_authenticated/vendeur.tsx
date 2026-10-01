import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Store, Package, ClipboardList, Plus, Trash2, Pencil, ExternalLink, Clock } from "lucide-react";
import { SpaceNav } from "@/components/space-nav";
import { formatFcfa } from "@/lib/marketplace-data";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PRODUCT_CATEGORIES,
  VENDOR_SETTABLE_STATUSES,
  type OrderStatus,
} from "@/lib/vendor-shared";
import {
  getMyShop,
  updateMyShop,
  saveProduct,
  deleteProduct,
  updateOrderStatus,
} from "@/lib/vendor.functions";

export const Route = createFileRoute("/_authenticated/vendeur")({
  head: () => ({
    meta: [
      { title: "Espace vendeur — Shop Crew Hub" },
      {
        name: "description",
        content:
          "Gérez votre boutique Shop Crew Hub : catalogue produits, stocks, prix et suivi des commandes.",
      },
      { property: "og:title", content: "Espace vendeur — Shop Crew Hub" },
      {
        property: "og:description",
        content: "Boutique, produits et commandes des vendeurs Shop Crew Hub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VendorSpace,
});

type Tab = "boutique" | "produits" | "commandes";

function VendorSpace() {
  const fetchShop = useServerFn(getMyShop);
  const { data, isLoading } = useQuery({ queryKey: ["my-shop"], queryFn: () => fetchShop() });
  const [tab, setTab] = useState<Tab>("produits");

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <SpaceNav />
        <main className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground">
          Chargement de votre boutique…
        </main>
      </div>
    );
  }

  const shop = data?.shop ?? null;

  if (!shop) return <PendingState />;
  if (!shop.is_active) return <PendingState suspended shopName={shop.name} />;

  const products = data?.products ?? [];
  const orders = data?.orders ?? [];
  const revenue = orders
    .filter((o) => o.status === "livree")
    .reduce((sum, o) => sum + (o.total ?? 0), 0);

  return (
    <div className="min-h-screen">
      <SpaceNav />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">
        <header className="panel hero-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs text-primary">
                <Store className="h-3.5 w-3.5" aria-hidden /> Boutique validée
              </span>
              <h1 className="mt-3 truncate text-2xl font-bold sm:text-3xl">{shop.name}</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {shop.city ?? "Ville non renseignée"} · /boutique/{shop.slug}
              </p>
            </div>
            <Link
              to="/boutique/$slug"
              params={{ slug: shop.slug }}
              className="mint-surface flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Voir ma page
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Produits" value={String(products.length)} />
            <Stat label="Commandes" value={String(orders.length)} />
            <Stat
              label="À traiter"
              value={String(orders.filter((o) => o.status === "en_attente").length)}
            />
            <Stat label="Revenus livrés" value={formatFcfa(revenue)} />
          </div>
        </header>

        <nav className="mt-5 flex gap-1 overflow-x-auto rounded-full border border-border bg-surface/70 p-1">
          {(
            [
              ["produits", "Produits", Package],
              ["commandes", "Commandes", ClipboardList],
              ["boutique", "Ma boutique", Store],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold ${
                tab === key ? "mint-surface" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
            </button>
          ))}
        </nav>

        {tab === "produits" && <ProductsPanel products={products} />}
        {tab === "commandes" && <OrdersPanel orders={orders} />}
        {tab === "boutique" && <ShopPanel shop={shop} />}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface/60 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-bold">{value}</p>
    </div>
  );
}

function PendingState({ suspended, shopName }: { suspended?: boolean; shopName?: string }) {
  return (
    <div className="min-h-screen">
      <SpaceNav />
      <main className="mx-auto max-w-xl px-4 pb-20 pt-10">
        <div className="panel p-6 text-center">
          <Clock className="mx-auto h-6 w-6 text-warning" aria-hidden />
          <h1 className="mt-3 text-xl font-bold">
            {suspended ? "Boutique désactivée" : "Boutique en attente de validation"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {suspended
              ? `La boutique ${shopName ?? ""} a été désactivée par l'administrateur. Contactez le support pour la réactiver.`
              : "Votre boutique sera créée et activée dès que l'administrateur approuve votre demande de vendeur."}
          </p>
          <Link
            to="/mon-compte"
            className="mint-surface mt-5 inline-block rounded-lg px-4 py-2.5 text-sm font-semibold"
          >
            Suivre ma demande
          </Link>
        </div>
      </main>
    </div>
  );
}

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  stock: number;
  image_url: string | null;
  is_published: boolean;
};

function ProductsPanel({ products }: { products: ProductRow[] }) {
  const [editing, setEditing] = useState<ProductRow | "new" | null>(null);
  const queryClient = useQueryClient();
  const remove = useServerFn(deleteProduct);
  const removal = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-shop"] }),
  });

  return (
    <section className="mt-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Catalogue</h2>
        <button
          onClick={() => setEditing("new")}
          className="mint-surface flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold"
        >
          <Plus className="h-4 w-4" aria-hidden /> Ajouter
        </button>
      </div>

      {editing && (
        <ProductForm
          product={editing === "new" ? null : editing}
          onDone={() => setEditing(null)}
        />
      )}

      {products.length === 0 ? (
        <p className="panel p-5 text-xs text-muted-foreground">
          Aucun produit. Ajoutez votre premier article pour qu'il apparaisse sur votre page
          boutique.
        </p>
      ) : (
        <ul className="space-y-3">
          {products.map((p) => (
            <li key={p.id} className="panel flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {p.category} · Stock {p.stock} ·{" "}
                  <span className={p.is_published ? "text-primary" : "text-warning"}>
                    {p.is_published ? "Publié" : "Brouillon"}
                  </span>
                </p>
                <p className="mt-1 text-sm font-bold text-primary">{formatFcfa(p.price)}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => setEditing(p)}
                  aria-label={`Modifier ${p.name}`}
                  className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-surface/70"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </button>
                <button
                  onClick={() => removal.mutate(p.id)}
                  aria-label={`Supprimer ${p.name}`}
                  className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-surface/70 text-destructive"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ProductForm({
  product,
  onDone,
}: {
  product: ProductRow | null;
  onDone: () => void;
}) {
  const save = useServerFn(saveProduct);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (form: HTMLFormElement) => {
      const fd = new FormData(form);
      return save({
        data: {
          ...(product ? { id: product.id } : {}),
          name: String(fd.get("name") ?? ""),
          description: String(fd.get("description") ?? ""),
          price: Number(fd.get("price") ?? 0),
          category: String(fd.get("category") ?? "Autre"),
          stock: Number(fd.get("stock") ?? 0),
          image_url: String(fd.get("image_url") ?? ""),
          is_published: fd.get("is_published") === "on",
        },
      });
    },
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["my-shop"] });
      onDone();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Enregistrement impossible."),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate(e.currentTarget);
      }}
      className="panel hero-surface space-y-3 p-5"
    >
      <h3 className="text-sm font-bold">{product ? "Modifier le produit" : "Nouveau produit"}</h3>
      <Field name="name" label="Nom du produit" defaultValue={product?.name} required />
      <Field
        name="description"
        label="Description"
        defaultValue={product?.description ?? ""}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          name="price"
          label="Prix (FCFA)"
          type="number"
          defaultValue={String(product?.price ?? 0)}
          required
        />
        <Field
          name="stock"
          label="Stock"
          type="number"
          defaultValue={String(product?.stock ?? 0)}
          required
        />
      </div>
      <label className="block">
        <span className="text-xs text-muted-foreground">Catégorie</span>
        <select
          name="category"
          defaultValue={product?.category ?? "Autre"}
          className="mt-1 min-h-11 w-full rounded-lg border border-border bg-input/60 px-3 text-sm outline-none"
        >
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <Field
        name="image_url"
        label="Lien de l'image (optionnel)"
        defaultValue={product?.image_url ?? ""}
      />
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={product?.is_published ?? true}
          className="h-4 w-4"
        />
        Publier sur ma page boutique
      </label>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="mint-surface glow min-h-11 rounded-lg px-4 text-sm font-semibold disabled:opacity-60"
        >
          Enregistrer
        </button>
        <button
          type="button"
          onClick={onDone}
          className="min-h-11 rounded-lg border border-border bg-surface px-4 text-sm"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

type OrderRow = {
  id: string;
  status: string;
  total: number;
  customer_name: string;
  phone: string;
  city: string;
  address: string | null;
  payment_method: string;
  created_at: string;
  order_items: { id: string; name: string; unit_price: number; quantity: number }[];
};

function OrdersPanel({ orders }: { orders: OrderRow[] }) {
  const setStatus = useServerFn(updateOrderStatus);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (v: { id: string; status: OrderStatus }) => setStatus({ data: v }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-shop"] }),
  });

  if (orders.length === 0) {
    return (
      <p className="panel mt-5 p-5 text-xs text-muted-foreground">
        Aucune commande pour l'instant. Elles apparaîtront ici dès qu'un client achètera dans votre
        boutique.
      </p>
    );
  }

  return (
    <section className="mt-5 space-y-3">
      <h2 className="text-base font-bold">Commandes</h2>
      <ul className="space-y-3">
        {orders.map((o) => (
          <li key={o.id} className="panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{o.customer_name}</p>
                <p className="text-xs text-muted-foreground">
                  {o.city} · {o.phone} ·{" "}
                  {new Date(o.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <p className="text-sm font-bold text-primary">{formatFcfa(o.total)}</p>
            </div>
            {o.order_items?.length > 0 && (
              <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                {o.order_items.map((it) => (
                  <li key={it.id}>
                    {it.quantity} × {it.name} — {formatFcfa(it.unit_price * it.quantity)}
                  </li>
                ))}
              </ul>
            )}
            <label className="mt-3 block">
              <span className="text-[11px] text-muted-foreground">Statut</span>
              <select
                value={o.status}
                disabled={!VENDOR_SETTABLE_STATUSES.includes(o.status as OrderStatus)}
                onChange={(e) =>
                  mutation.mutate({ id: o.id, status: e.target.value as OrderStatus })
                }
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-input/60 px-3 text-sm outline-none disabled:opacity-70"
              >
                {ORDER_STATUSES.filter(
                  (s) => VENDOR_SETTABLE_STATUSES.includes(s) || s === o.status,
                ).map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ShopPanel({
  shop,
}: {
  shop: {
    name: string;
    description: string | null;
    city: string | null;
    phone: string | null;
    momo_number: string | null;
    logo_url: string | null;
  };
}) {
  const save = useServerFn(updateMyShop);
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (form: HTMLFormElement) => {
      const fd = new FormData(form);
      return save({
        data: {
          name: String(fd.get("name") ?? ""),
          description: String(fd.get("description") ?? ""),
          city: String(fd.get("city") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          momo_number: String(fd.get("momo_number") ?? ""),
          logo_url: String(fd.get("logo_url") ?? ""),
        },
      });
    },
    onSuccess: async () => {
      setMessage("Boutique mise à jour.");
      await queryClient.invalidateQueries({ queryKey: ["my-shop"] });
    },
    onError: (e) => setMessage(e instanceof Error ? e.message : "Mise à jour impossible."),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate(e.currentTarget);
      }}
      className="panel mt-5 space-y-3 p-5"
    >
      <h2 className="text-base font-bold">Informations de la boutique</h2>
      <Field name="name" label="Nom de la boutique" defaultValue={shop.name} required />
      <Field name="description" label="Description" defaultValue={shop.description ?? ""} />
      <Field name="city" label="Ville" defaultValue={shop.city ?? ""} />
      <Field name="phone" label="Téléphone" defaultValue={shop.phone ?? ""} />
      <Field
        name="momo_number"
        label="Numéro Mobile Money (Orange / MTN)"
        defaultValue={shop.momo_number ?? ""}
      />
      <Field name="logo_url" label="Lien du logo" defaultValue={shop.logo_url ?? ""} />
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
      <button
        type="submit"
        disabled={mutation.isPending}
        className="mint-surface glow min-h-11 rounded-lg px-4 text-sm font-semibold disabled:opacity-60"
      >
        Enregistrer
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  required,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string | undefined;
  required?: boolean | undefined;
  type?: string | undefined;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        maxLength={400}
        className="mt-1 min-h-11 w-full rounded-lg border border-border bg-input/60 px-3 text-sm outline-none"
      />
    </label>
  );
}
