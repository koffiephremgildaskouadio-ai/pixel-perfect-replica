import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Récupère les vraies actualités publiées sur le site officiel du CCJY
const fetchCcjyHeadlines = async (): Promise<string> => {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch("https://ccj-yop.org", {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 DistrictNovalimBot" },
    });
    clearTimeout(t);
    if (!r.ok) return "";
    const html = await r.text();
    const titles = [...html.matchAll(/<h5[^>]*class="fw-bold text-dark"[^>]*>([\s\S]*?)<\/h5>/g)]
      .map((m) =>
        m[1]
          .replace(/<[^>]+>/g, "")
          .replace(/&#0?39;/g, "'")
          .replace(/&rsquo;/g, "’")
          .replace(/&amp;/g, "&")
          .replace(/\s+/g, " ")
          .trim(),
      )
      .filter(Boolean)
      .slice(0, 8);
    return titles.length ? titles.map((t) => `• ${t}`).join("\n") : "";
  } catch {
    return "";
  }
};

const buildSystemPrompt = (liveNews = "") => {
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Abidjan",
  });

  return `Tu es NovalimIA, assistant du District Cité Novalim-CIE (CCJY Zone 7, Yopougon, Côte d'Ivoire).
Nous sommes le ${dateStr} (heure d'Abidjan).

RÈGLES DE RÉPONSE (STRICTES) :
1. Réponds DIRECTEMENT à la question, sans préambule.
2. NE te présente PAS. Ne dis JAMAIS "Je suis NovalimIA", "Bonjour", "En tant qu'assistant…".
3. Sois PRÉCIS et CONCIS : 1 à 4 phrases pour une question simple.
4. Pas de signature, pas d'emojis décoratifs sauf si utiles.
5. Français par défaut, sauf si l'utilisateur écrit dans une autre langue.
6. Si tu ne sais pas, dis-le en une phrase et oriente vers la source officielle.

ACTUALITÉ LOCALE À SUIVRE (Yopougon) :
- Période des festivités de l'indépendance de la Côte d'Ivoire (7 août) : animations, cérémonies et mobilisation de la jeunesse à Yopougon.
- Sources officielles à citer quand on demande l'actualité :
  • Mairie de Yopougon : page Facebook officielle et site de la commune.
  • Conseil Communal des Jeunes de Yopougon (CCJY) : page Facebook officielle du CCJY.
  • Page Facebook du District Cité Novalim-CIE.
- Tu n'as pas d'accès direct à internet : donne le contexte connu, puis invite à consulter ces pages pour l'info la plus fraîche. N'invente jamais une date, un communiqué ou un nom.

CONTEXTE DISTRICT (à utiliser uniquement quand la question porte dessus) :
- Président : Kouadio Koffi Ephrem Gildas (0789536318). Bureau : 27 membres élus, 6 cabinet, 4 coordonnateurs de zone.
- Zone 7 CCJY, coordonnée par Koné Yacouba (président district Banco 2).
- Parrain : M. Abiola Waidi, PDG Jumbo Store CI.
- District France-Ville : président Bamba Adama.
- Investiture conjointe Novalim-CIE / Franceville : Dimanche 3 Mai 2026 — Ruelle Carrefour Maquis / La Table des Chefs. Patronage : Adama Bictogo (Maire). Présidence : Assim Saba (CCJY).
- Districts voisins : Port-Bouet 2 Plateau, Franceville, Terminus 47-Aimé Césaire, Base CIE.
- Partenaires santé : Le Grand Centre, Clinique Vie, Clinique Ste Jeanne de Garcia, Pharmacie Nouvelle Raphaël, Pharmacie Roxane.
- Partenaires : CIE, Jumbo Store CI, La Table des Chefs.

Pour toute autre question, réponds normalement avec ton expertise, de manière brève et directe.`;
};


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { messages, generateImage, imagePrompt, stream = true } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Garde un historique large pour des réponses contextuelles riches (≈ Claude/ChatGPT)
    const safeMessages = Array.isArray(messages) ? messages.slice(-40) : [];

    // Image generation mode
    if (generateImage && imagePrompt) {
      const imgResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!imgResponse.ok) {
        const errText = await imgResponse.text();
        console.error("Image gen error:", imgResponse.status, errText);
        // Fallback Nano Banana
        const fb = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: imagePrompt }],
            modalities: ["image", "text"],
          }),
        });
        if (!fb.ok) return json({ error: "Erreur image", text: "Je ne peux pas générer cette image pour le moment.", fallback: true });
        const d = await fb.json();
        return json({
          imageUrl: d.choices?.[0]?.message?.images?.[0]?.image_url?.url,
          text: d.choices?.[0]?.message?.content || "Voici l'image générée :",
        });
      }

      const imgData = await imgResponse.json();
      const imageUrl = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      const text = imgData.choices?.[0]?.message?.content || "Voici l'image générée :";

      return json({ imageUrl, text });
    }

    // Modèles ultra-performants avec fallback intelligent (catalogue Lovable AI Gateway validé)
    const MODELS = [
      "google/gemini-3.6-flash",
      "google/gemini-3-flash-preview",
      "google/gemini-3.5-flash",
      "openai/gpt-5.4",
      "google/gemini-2.5-flash",
      "openai/gpt-5-mini",
      "google/gemini-2.5-flash-lite",
    ];

    const SYSTEM_PROMPT = buildSystemPrompt();
    let response: Response | null = null;
    let lastErr = "";
    for (const model of MODELS) {
      try {
        const payload: any = {
          model,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...safeMessages],
          stream,
        };
        // Les modèles OpenAI GPT-5 refusent temperature/max_tokens personnalisés
        if (!model.startsWith("openai/")) payload.temperature = 0.7;
        if (model.startsWith("openai/gpt-5.6")) payload.reasoning_effort = "none";


        const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (r.ok) { response = r; break; }
        const errBody = await r.text().catch(() => "");
        lastErr = `${model}: ${r.status} ${errBody.slice(0, 200)}`;
        console.warn("model failed:", lastErr);
      } catch (fetchErr) {
        lastErr = `${model}: ${fetchErr instanceof Error ? fetchErr.message : "fetch error"}`;
        console.warn("fetch failed:", lastErr);
      }
    }

    if (!response) {
      console.error("All models failed:", lastErr);
      return json({
        error: "Service IA momentanément surchargé. Réessayez dans quelques secondes.",
        text: "Désolé, je rencontre une difficulté technique passagère. Veuillez réessayer dans quelques instants. 🙏",
        fallback: true,
      }, 200);
    }

    if (!stream) {
      const data = await response.json();
      return json({ text: data.choices?.[0]?.message?.content || "" });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-ai error:", e);
    return json({ error: e instanceof Error ? e.message : "Erreur inconnue", fallback: true }, 200);
  }
});
