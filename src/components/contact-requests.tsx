import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listContacts } from "@/lib/contact.functions";

export function ContactRequests() {
  const fetch = useServerFn(listContacts);
  const { data, isPending, error } = useQuery({ queryKey: ["admin-contact-requests"], queryFn: () => fetch(), refetchInterval: 30000 });
  return <section className="mt-8 border-t border-border pt-6">
    <h2 className="text-lg font-bold">Demandes clients — Contact et assistance</h2>
    {isPending ? <p role="status" className="mt-4">Chargement…</p> : error ? <p role="alert" className="mt-4 text-destructive">Impossible de charger les demandes.</p> : !data?.length ? <p className="mt-4 text-muted-foreground">Aucune demande pour le moment.</p> :
      <ul className="mt-4 space-y-4">{data.map(row => <li key={row.id} className="rounded-lg border border-border p-4">
        <h3 className="break-words font-semibold">{row.subject}</h3>
        <p className="mt-2 break-words text-sm">{row.full_name} · {row.email}</p>
        <time className="text-xs text-muted-foreground" dateTime={row.created_at}>{new Date(row.created_at).toLocaleString("fr-FR")}</time>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm">{row.message}</p>
      </li>)}</ul>}
  </section>;
}