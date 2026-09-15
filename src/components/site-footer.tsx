import { Link } from "@tanstack/react-router";
import { ShieldCheck, LifeBuoy, Sparkles, FileText, Info } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

const links = [
  { to: "/a-propos", label: "À propos", Icon: Info },
  { to: "/confidentialite", label: "Confidentialité", Icon: FileText },
  { to: "/securite", label: "Sécurité", Icon: ShieldCheck },
  { to: "/aide", label: "Aide", Icon: LifeBuoy },
  { to: "/assistant", label: "Assistant IA", Icon: Sparkles },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <BrandLogo compact />
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {links.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-6 text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Shop Crew Hub — Marketplace multi-vendeurs au Cameroun.
        </p>
      </div>
    </footer>
  );
}
