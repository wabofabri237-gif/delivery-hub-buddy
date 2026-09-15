import { Link } from "@tanstack/react-router";

/**
 * Marque Shop Crew Hub — monogramme typographique.
 * Aucun logo image n'est inventé : le fichier officiel remplacera ce bloc une fois fourni.
 */
export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2">
      <span className="mint-surface grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display text-sm font-bold">
        SC
      </span>
      <span
        className={
          compact
            ? "truncate font-display text-sm font-bold tracking-tight"
            : "hidden truncate font-display text-base font-bold tracking-tight sm:inline"
        }
      >
        Shop Crew <span className="text-primary">Hub</span>
      </span>
    </Link>
  );
}
