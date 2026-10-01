import { createFileRoute } from "@tanstack/react-router";
import { SpaceNav } from "@/components/space-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/aide")({
  head: () => ({
    meta: [
      { title: "Aide et FAQ — Shop Crew Hub" },
      { name: "description", content: "Réponses aux questions fréquentes : commander, payer, suivre une livraison, ouvrir une boutique." },
      { property: "og:title", content: "Aide et FAQ — Shop Crew Hub" },
      { property: "og:description", content: "Réponses aux questions fréquentes : commander, payer, suivre une livraison, ouvrir une boutique." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const SECTIONS: { h: string; p: string }[] = [
  { h: "Comment passer une commande ?", p: "Ajoutez les articles au panier depuis une fiche produit, ouvrez le panier, renseignez votre nom, téléphone, ville et adresse, puis choisissez votre moyen de paiement et confirmez. Si votre panier contient des articles de plusieurs boutiques, une commande est créée par boutique." },
  { h: "Comment suivre ma livraison ?", p: "Rendez-vous dans Mes commandes : chaque commande affiche son état (en attente, préparée, en route, livrée) mis à jour par le vendeur puis par le livreur assigné." },
  { h: "Quels moyens de paiement ?", p: "Orange Money, MTN MoMo ou paiement à la réception. Le numéro mobile money du vendeur est indiqué sur sa boutique." },
  { h: "Comment ouvrir une boutique ?", p: "Depuis Mon compte, envoyez une demande vendeur avec vos informations. Après validation par l'administration, votre boutique est activée et vous pouvez publier vos produits." },
  { h: "Comment devenir livreur ?", p: "Depuis Mon compte, envoyez une demande livreur. Une fois certifié, l'espace Livreur vous montre les commandes préparées à prendre en charge." },
  { h: "Annulation et litige", p: "Contactez d'abord le vendeur via le numéro de la boutique. En cas de blocage, écrivez à support@sokomarket.app avec le numéro de commande." },
];

function Page() {
  return (
    <div className="min-h-screen">
      <SpaceNav />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Centre d'aide</h1>
        <p className="mt-3 text-sm text-muted-foreground">Tout ce qu'il faut savoir pour commander, vendre ou livrer sur Shop Crew Hub.</p>
        <div className="mt-6 grid gap-4">
          {SECTIONS.map((s) => (
            <section key={s.h} className="panel p-5">
              <h2 className="text-sm font-bold">{s.h}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.p}</p>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
