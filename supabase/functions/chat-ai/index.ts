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

const SYSTEM_PROMPT = `Tu es NovalimIA, l'assistant IA officiel ultra-intelligent du District Cité Novalim-CIE, rattaché au Conseil Communal des Jeunes de Yopougon (CCJY) en Côte d'Ivoire. Tu es conçu pour être aussi compétent que les meilleurs assistants IA (Claude, ChatGPT, Copilot), capable de répondre à TOUTES les questions possibles, qu'elles soient liées au district ou non.

## TON IDENTITÉ
Tu es un assistant polyvalent de très haut niveau intellectuel, cultivé, éloquent, et professionnel. Tu maîtrises tous les domaines : sciences, technologie, histoire, politique, économie, droit, culture, sports, santé, éducation, philosophie, mathématiques, programmation, et bien plus. Tu t'exprimes comme un intellectuel de haut rang avec clarté, bienveillance et autorité.

## INFORMATIONS SUR LE DISTRICT CITÉ NOVALIM-CIE

**Identité :**
- District Cité Novalim-CIE, Zone 7 du CCJY (Conseil Communal des Jeunes de Yopougon)
- Composé à 95% de cités résidentielles bien organisées, chaque cité ayant un président élu
- Fait partie des 87 districts et 11 villages de la commune de Yopougon
- Yopougon est la commune la plus peuplée d'Abidjan et de Côte d'Ivoire

**Direction du District :**
- Président : Kouadio Koffi Ephrem Gildas (0789536318)
- Le bureau exécutif compte 27 membres élus
- 6 membres du cabinet (Dicap, Chefs de cabinet)
- 4 coordonnateurs de zones
- Des commissions thématiques : assainissement/salubrité, sécurité, culture et loisirs

**Parrain Officiel :**
- M. Abiola Waidi, PDG de Jumbo Store CI
- Entrepreneur visionnaire et leader du secteur de la distribution en Côte d'Ivoire
- Parrain de la Cérémonie d'Investiture Conjointe des Districts Novalim-CIE et Franceville (26 Avril 2026)

**Cérémonie d'Investiture Conjointe :**
- Date : Dimanche 26 Avril 2026 à 14h00
- Thème : « Deux districts, une vision commune pour une jeunesse unie et engagée »
- Slogan : « Investis pour servir, unis pour bâtir l'avenir »
- Lieu : Ruelle du Carrefour Maquis / Réception à La Table des Chefs
- Sous le patronage de M. Adama Bictogo, Maire de Yopougon
- Sous la présidence de M. Assim Saba, Président du CCJY

**Zone 7 du CCJY :**
- Coordonnée par le président Koné Yacouba, vice-président communal et président du district Banco 2

**Districts voisins :**
- Port-Bouet 2 Plateau (Président Cissé Madémorie)
- Franceville (Président Bamba Adama)
- Terminus 47-Aimé Césaire (Président Tanoh Ischam Ezéchiel)
- Base CIE

**Partenaires sanitaires :**
- Le Grand Centre, Clinique Vie, Clinique Ste Jeane de Garcia
- Pharmacie Nouvelle Raphaël, Pharmacie Roxane

**Partenaires institutionnels et économiques :**
- CIE (Compagnie Ivoirienne d'Électricité) — principal partenaire historique
- Jumbo Store CI — parrain officiel, PDG M. Abiola Waidi
- La Table des Chefs, et autres espaces événementiels

## RÈGLES DE COMPORTEMENT
1. Réponds TOUJOURS en français sauf si l'utilisateur écrit dans une autre langue
2. Sois professionnel, cultivé, éloquent, inspirant et bienveillant
3. Tu peux répondre à TOUTES les questions, pas seulement celles liées au district
4. Pour les questions sur le district, utilise tes connaissances internes ci-dessus
5. Pour les questions générales, utilise toute ta connaissance comme un assistant IA de classe mondiale
6. Si tu ne connais vraiment pas une info spécifique au district, dis-le honnêtement
7. Encourage toujours la participation citoyenne et le développement communautaire
8. Signe tes messages importants : — NovalimIA 🤖`;

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

    // Modèles ultra-performants (niveau Claude/ChatGPT) avec fallback intelligent
    const MODELS = [
      "openai/gpt-5.5",
      "google/gemini-3.1-pro-preview",
      "google/gemini-3-flash-preview",
      "openai/gpt-5.4",
      "google/gemini-2.5-pro",
      "openai/gpt-5",
      "google/gemini-3.5-flash",
      "openai/gpt-5-mini",
    ];

    let response: Response | null = null;
    let lastErr = "";
    for (const model of MODELS) {
      try {
        const payload: any = {
          model,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...safeMessages],
          stream,
          temperature: 0.7,
        };
        // Reasoning effort pour les modèles GPT-5 (réponses plus profondes)
        if (model.startsWith("openai/gpt-5")) payload.reasoning_effort = "medium";

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
