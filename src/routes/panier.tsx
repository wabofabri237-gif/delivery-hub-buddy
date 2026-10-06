import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, Trash2, ShoppingBag, ShieldCheck } from "lucide-react";
import { SpaceNav } from "@/components/space-nav";
import { SiteFooter } from "@/components/site-footer";
import { formatFcfa } from "@/lib/marketplace-data";
import { useCart } from "@/lib/cart";
import { createOrders } from "@/lib/catalog.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/panier")({
  head: () => ({
    meta: [
      { title: "Mon panier & commande — Shop Crew Hub" },
      {
        name: "description",
        content:
          "Vérifiez vos articles, renseignez la livraison et payez par Orange Money, MTN MoMo ou à la réception.",
      },
      { property: "og:title", content: "Mon panier & commande — Shop Crew Hub" },
      {
        property: "og:description",
        content: "Panier, adresse de livraison et paiement mobile money sur Shop Crew Hub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

const PAYMENTS = [
  { value: "orange_money", label: "Orange Money" },
  { value: "mtn_momo", label: "MTN MoMo" },
  { value: "cash", label: "À la livraison" },
] as const;

function CartPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const submit = useServerFn(createOrders);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    city: "",
    address: "",
    payment_method: "orange_money" as (typeof PAYMENTS)[number]["value"],
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
  }, []);

  const mutation = useMutation({
    mutationFn: () =>
      submit({
        data: {
          items: cart.lines.map((l) => ({
            product_id: l.product_id,
            variant_id: l.variant_id,
            quantity: l.quantity,
          })),
          ...form,
        },
      }),
    onSuccess: (res) => {
      cart.clear();
      toast.success(
        res.orders.length > 1
          ? `${res.orders.length} commandes créées (une par boutique)`
          : "Commande envoyée au vendeur",
      );
      navigate({ to: "/mes-commandes" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen">
      <SpaceNav />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Mon panier</h1>

        {!cart.ready ? (
          <p className="panel mt-5 p-5 text-xs text-muted-foreground">Chargement du panier…</p>
        ) : cart.lines.length === 0 ? (
          <div className="panel mt-5 p-6 text-center">
            <ShoppingBag className="mx-auto h-8 w-8 text-primary" aria-hidden />
            <p className="mt-3 text-sm font-semibold">Votre panier est vide</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Parcourez le catalogue et ajoutez vos premiers articles.
            </p>
            <Link to="/" className="mint-surface mt-5 inline-block rounded-lg px-4 py-2.5 text-sm font-semibold">
              Voir le catalogue
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
            <ul className="grid gap-3">
              {cart.lines.map((l) => (
                <li key={l.key} className="panel flex gap-3 p-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface/60">
                    {l.image_url && (
                      <img src={l.image_url} alt={l.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/produit/$id"
                      params={{ id: l.product_id }}
                      className="block truncate text-sm font-semibold hover:text-primary"
                    >
                      {l.name}
                    </Link>
                    {l.variant_label && (
                      <p className="text-[11px] text-muted-foreground">{l.variant_label}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground">{l.shop_name}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 rounded-lg border border-border bg-surface/60">
                        <button
                          onClick={() => cart.setQuantity(l.key, l.quantity - 1)}
                          aria-label="Diminuer"
                          className="grid h-8 w-8 place-items-center text-muted-foreground"
                        >
                          <Minus className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <span className="w-6 text-center text-xs font-semibold">{l.quantity}</span>
                        <button
                          onClick={() => cart.setQuantity(l.key, l.quantity + 1)}
                          aria-label="Augmenter"
                          className="grid h-8 w-8 place-items-center text-muted-foreground"
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                      <span className="font-display text-sm font-bold">
                        {formatFcfa(l.unit_price * l.quantity)}
                      </span>
                      <button
                        onClick={() => cart.remove(l.key)}
                        aria-label={`Retirer ${l.name}`}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <section className="panel p-5">
              <h2 className="text-base font-bold">Livraison &amp; paiement</h2>
              <div className="mt-4 grid gap-3">
                <Field label="Nom complet" value={form.customer_name} onChange={set("customer_name")} />
                <Field label="Téléphone" value={form.phone} onChange={set("phone")} type="tel" />
                <Field label="Ville" value={form.city} onChange={set("city")} />
                <Field label="Adresse / quartier" value={form.address} onChange={set("address")} />

                <div>
                  <p className="text-xs font-semibold">Paiement</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {PAYMENTS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setForm((f) => ({ ...f, payment_method: p.value }))}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                          form.payment_method === p.value
                            ? "mint-surface"
                            : "border border-border bg-surface/60 text-muted-foreground"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <dl className="mt-5 grid gap-1 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Articles</dt>
                  <dd>{cart.count}</dd>
                </div>
                <div className="flex justify-between font-display text-lg font-bold">
                  <dt>Total</dt>
                  <dd className="text-primary">{formatFcfa(cart.total)}</dd>
                </div>
              </dl>

              {signedIn === false ? (
                <Link
                  to="/auth"
                  search={{ next: "/panier" }}
                  className="mint-surface mt-4 block rounded-lg py-3 text-center text-sm font-semibold"
                >
                  Se connecter pour commander
                </Link>
              ) : (
                <button
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                  className="mint-surface glow mt-4 h-11 w-full rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {mutation.isPending ? "Envoi…" : "Confirmer la commande"}
                </button>
              )}

              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden /> Vos coordonnées ne
                sont visibles que par le vendeur et le livreur assigné.
              </p>
            </section>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-lg border border-border bg-input/60 px-3 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
