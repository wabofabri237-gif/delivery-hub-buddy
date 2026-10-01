import { createFileRoute } from "@tanstack/react-router";
import { SpaceNav } from "@/components/space-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/securite")({
  head: () => ({
    meta: [
      { title: "Sécurité de la plateforme — Shop Crew Hub" },
      { name: "description", content: "Comment Shop Crew Hub protège les comptes, les paiements et les données de commande." },
      { property: "og:title", content: "Sécurité de la plateforme — Shop Crew Hub" },
      { property: "og:description", content: "Comment Shop Crew Hub protège les comptes, les paiements et les données de commande." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const SECTIONS: { h: string; p: string }[] = [
  { h: "Authentification", p: "Les comptes sont protégés par une authentification gérée côté serveur avec sessions signées. Les mots de passe ne sont jamais stockés en clair." },
  { h: "Cloisonnement des données", p: "Chaque lecture et écriture passe par des règles d'accès au niveau des lignes : un vendeur ne voit que sa boutique et ses commandes, un client que les siennes, un livreur uniquement les courses disponibles ou celles qui lui sont assignées." },
  { h: "Paiements", p: "Shop Crew Hub n'entrepose aucun code PIN ni identifiant mobile money. Les transactions se font directement entre le client et le vendeur via Orange Money, MTN MoMo, ou en espèces à la livraison." },
  { h: "Vérification des comptes professionnels", p: "Les demandes vendeur et livreur sont examinées manuellement avec pièce d'identité avant activation." },
  { h: "Signaler une faille", p: "Vous pensez avoir trouvé une vulnérabilité ? Écrivez à support@sokomarket.app avec les détails techniques ; nous répondons sous 72 heures." },
];

function Page() {
  return (
    <div className="min-h-screen">
      <SpaceNav />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Sécurité</h1>
        <p className="mt-3 text-sm text-muted-foreground">Nos engagements techniques pour protéger vos comptes, vos commandes et vos paiements.</p>
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
