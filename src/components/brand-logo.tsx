import { Link } from "@tanstack/react-router";
import logoIcon from "@/assets/shop-crew-hub-icon.png";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2">
      <img
        src={logoIcon}
        alt=""
        width={52}
        height={52}
        className="h-12 w-12 shrink-0 object-contain drop-shadow-sm"
      />
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
