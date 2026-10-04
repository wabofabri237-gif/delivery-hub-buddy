import { createServerFn } from "@tanstack/react-start";
import { publicSupabase } from "@/lib/supabase-public.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `Tu es Soko, l'assistant officiel de Shop Crew Hub, une marketplace multi-vendeurs au Cameroun.
Tu réponds en français, de façon courte, concrète et chaleureuse (3 phrases maximum sauf demande de détail).
Tu aides à : trouver un produit dans le catalogue fourni, expliquer le panier et la commande,
le paiement (Orange Money, MTN MoMo, paiement à la livraison), le suivi de livraison,
devenir vendeur ou livreur (page Mon compte), et la sécurité/confidentialité.
N'invente jamais un produit, un prix ou une boutique qui n'est pas dans le catalogue fourni.
Si l'information manque, dis-le et oriente vers la page d'aide.`;

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { messages: ChatMessage[] }) => {
    if (!Array.isArray(input.messages) || input.messages.length === 0)
      throw new Error("Message vide");
    if (input.messages.length > 20) throw new Error("Conversation trop longue");
    for (const m of input.messages) {
      if (m.role !== "user" && m.role !== "assistant") throw new Error("Message invalide");
      if (typeof m.content !== "string" || m.content.trim().length === 0)
        throw new Error("Message vide");
      if (m.content.length > 2000) throw new Error("Message trop long");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Assistant indisponible pour le moment");

    const supabase = publicSupabase();
    const { data: catalog } = await supabase
      .from("products")
      .select("name, price, category, stock, shops!inner(name, slug, city, is_active)")
      .eq("is_published", true)
      .eq("shops.is_active", true)
      .limit(40);

    const catalogText =
      (catalog ?? [])
        .map((p) => {
          const shop = p.shops as unknown as { name: string; city: string | null };
          return `- ${p.name} · ${p.category} · ${p.price} FCFA · stock ${p.stock} · boutique ${shop.name}${shop.city ? ` (${shop.city})` : ""}`;
        })
        .join("\n") || "Catalogue vide pour le moment.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `${SYSTEM_PROMPT}\n\nCatalogue actuel :\n${catalogText}` },
          // Only the shopper's own messages are trusted; client-supplied "assistant" turns are ignored.
          ...data.messages.filter((m) => m.role === "user").slice(-6).map((m) => ({ role: "user", content: m.content })),
        ],
      }),
    });

    if (response.status === 429)
      throw new Error("Trop de demandes en même temps, réessayez dans un instant.");
    if (response.status === 402)
      throw new Error("Le crédit de l'assistant est épuisé, réessayez plus tard.");
    if (!response.ok) {
      console.error("AI gateway error", response.status, await response.text());
      throw new Error("L'assistant ne répond pas pour le moment.");
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = payload.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("Réponse vide de l'assistant");
    return { reply };
  });
