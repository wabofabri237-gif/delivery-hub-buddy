import { Link } from "@tanstack/react-router";
import logoIcon from "@/assets/shop-crew-hub-icon.png";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2">
      <img src={logoIcon} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-sm bg-foreground object-contain" />
      <span
        className={
          compact
            ? "truncate font-display text-sm font-bold"
            : "hidden truncate font-display text-base font-bold sm:inline"
        }
      >
        Shop <span className="text-destructive">Crew</span> <span className="text-warning">Hub</span>
      </span>
    </Link>
  );
}
