import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { messages, generateImage, imagePrompt } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Image generation mode
    if (generateImage && imagePrompt) {
      const imgResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!imgResponse.ok) {
        const errText = await imgResponse.text();
        console.error("Image gen error:", imgResponse.status, errText);
        return new Response(JSON.stringify({ error: "Erreur de génération d'image", text: "Je ne peux pas générer cette image pour le moment." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const imgData = await imgResponse.json();
      const imageUrl = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      const text = imgData.choices?.[0]?.message?.content || "Voici l'image générée :";

      return new Response(JSON.stringify({ imageUrl, text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Standard chat streaming
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, veuillez réessayer dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporairement indisponible." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
