import { createFileRoute } from "@tanstack/react-router";
import { SpaceNav } from "@/components/space-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — Shop Crew Hub" },
      { name: "description", content: "Quelles données Shop Crew Hub collecte, pourquoi, avec qui elles sont partagées et vos droits." },
      { property: "og:title", content: "Politique de confidentialité — Shop Crew Hub" },
      { property: "og:description", content: "Quelles données Shop Crew Hub collecte, pourquoi, avec qui elles sont partagées et vos droits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const SECTIONS: { h: string; p: string }[] = [
  { h: "Données collectées", p: "Nom, téléphone, ville et adresse de livraison, historique de commandes, et pour les professionnels : informations de boutique, numéro mobile money et pièce d'identité fournie lors de la demande." },
  { h: "Utilisation", p: "Ces données servent uniquement à traiter les commandes, permettre la livraison, valider les comptes professionnels et assurer le support." },
  { h: "Partage", p: "Vos coordonnées de livraison ne sont visibles que par le vendeur concerné, le livreur assigné et l'administration. Aucune donnée n'est vendue à des tiers." },
  { h: "Conservation", p: "Les commandes sont conservées pour l'historique et la comptabilité des vendeurs. Vous pouvez demander la suppression de votre compte à tout moment." },
  { h: "Vos droits", p: "Accès, rectification et suppression de vos données sur simple demande à support@sokomarket.app." },
];

function Page() {
  return (
    <div className="min-h-screen">
      <SpaceNav />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Politique de confidentialité</h1>
        <p className="mt-3 text-sm text-muted-foreground">Nous collectons le strict nécessaire au bon déroulement des commandes et des livraisons.</p>
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
