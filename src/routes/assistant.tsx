import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { SpaceNav } from "@/components/space-nav";
import { SiteFooter } from "@/components/site-footer";
import { askAssistant, type ChatMessage } from "@/lib/assistant.functions";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "Assistant Soko — aide en direct" },
      {
        name: "description",
        content:
          "Posez vos questions à Soko : trouver un produit, commander, payer, suivre une livraison ou vendre sur Shop Crew Hub.",
      },
      { property: "og:title", content: "Assistant Soko — aide en direct" },
      { property: "og:description", content: "L'assistant IA de Shop Crew Hub répond à vos questions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssistantPage,
});

const SUGGESTIONS = [
  "Quels produits sont disponibles ?",
  "Comment payer avec Orange Money ?",
  "Comment devenir vendeur ?",
];

function AssistantPage() {
  const ask = useServerFn(askAssistant);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setError("");
    setBusy(true);
    try {
      const res = await ask({ data: { messages: next.slice(-12) } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(
        /unauthori|401/i.test(msg)
          ? "Connectez-vous pour discuter avec l'assistant."
          : msg || "L'assistant ne répond pas.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SpaceNav />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <Sparkles className="h-6 w-6 text-primary" aria-hidden /> Assistant Soko
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Il connaît le catalogue en ligne et le fonctionnement de la plateforme.
        </p>

        <div className="panel mt-5 grid gap-3 p-4">
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <p
              key={i}
              className={`max-w-[88%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                m.role === "user"
                  ? "mint-surface ml-auto"
                  : "border border-border bg-surface/60 text-muted-foreground"
              }`}
            >
              {m.content}
            </p>
          ))}
          {busy && <p className="text-xs text-muted-foreground">Soko réfléchit…</p>}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="mt-4 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écrivez votre question…"
            aria-label="Votre question"
            className="h-11 flex-1 rounded-lg border border-border bg-input/60 px-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy}
            aria-label="Envoyer"
            className="mint-surface grid h-11 w-11 place-items-center rounded-lg disabled:opacity-50"
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
