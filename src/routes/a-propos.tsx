import { createFileRoute, Link } from "@tanstack/react-router";
import { Store, Bike, ShieldCheck, Users } from "lucide-react";
import { SpaceNav } from "@/components/space-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos de Shop Crew Hub — notre mission" },
      {
        name: "description",
        content:
          "Shop Crew Hub connecte les vendeurs vérifiés, les clients et les livreurs certifiés du Cameroun sur une seule plateforme.",
      },
      { property: "og:title", content: "À propos de Shop Crew Hub" },
      {
        property: "og:description",
        content: "La marketplace multi-vendeurs qui relie boutiques, clients et livreurs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen">
      <SpaceNav />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6">
        <h1 className="text-2xl font-bold sm:text-3xl">À propos de Shop Crew Hub</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Shop Crew Hub est une marketplace multi-vendeurs : chaque boutique gère son catalogue, ses
          prix et ses stocks, tandis que les clients commandent en quelques clics et suivent leur
          livraison en temps réel. Les livreurs certifiés prennent en charge les commandes prêtes
          et les mènent jusqu'à la porte du client.
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            {
              Icon: Store,
              title: "Vendeurs vérifiés",
              text: "Chaque boutique est validée par notre équipe avant publication de ses produits.",
            },
            {
              Icon: Bike,
              title: "Livreurs certifiés",
              text: "Les livraisons sont assurées par des livreurs identifiés et suivis dans l'application.",
            },
            {
              Icon: ShieldCheck,
              title: "Paiement protégé",
              text: "Orange Money, MTN MoMo ou paiement à la livraison, au choix du client.",
            },
            {
              Icon: Users,
              title: "Un compte, trois espaces",
              text: "Client, vendeur, livreur : les accès se demandent depuis la page Mon compte.",
            },
          ].map(({ Icon, title, text }) => (
            <li key={title} className="panel p-5">
              <Icon className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="mt-3 text-sm font-bold">{title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>

        <section className="panel mt-8 p-5">
          <h2 className="text-base font-bold">Nous contacter</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Une question, un litige ou un partenariat ? Écrivez à{" "}
            <a href="mailto:support@sokomarket.app" className="text-primary hover:underline">
              support@sokomarket.app
            </a>{" "}
            ou passez par la{" "}
            <Link to="/aide" className="text-primary hover:underline">
              page d'aide
            </Link>
            .
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
