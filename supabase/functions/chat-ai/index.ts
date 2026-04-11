import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es l'assistant IA officiel du District Cité Novalim-CIE, rattaché au Conseil Communal des Jeunes de Yopougon (CCJY) en Côte d'Ivoire.

## Informations clés sur le district :

**Identité :**
- District Cité Novalim-CIE, Zone 7 du CCJY
- Composé à 95% de cités résidentielles bien organisées, chaque cité ayant un président élu
- Fait partie des 87 districts et 11 villages de la commune de Yopougon

**Direction :**
- Président : Kouadio Koffi Ephrem Gildas (0789536318)
- Le bureau exécutif compte 27 membres (président, vice-présidents, secrétaire général, secrétaires spécialisés)
- 6 membres du cabinet (Dicap, Chefs de cabinet)
- 4 coordonnateurs de zones (Zone 1 Carrefour Maquis, Zone 2 Obama, Zone 3 Carrefour Niangon)
- Des commissions : assainissement, sécurité, culturelle et loisir

**Zone 7 :**
- Coordonnée par le président Koné Yacouba, vice-président communal et président du district Banco 2

**Districts voisins :**
- Port-Bouet 2 Plateau (Président Cissé Madémorie)
- Franceville (Président Bamba Adama)  
- Terminus 47-Aimé Césaire (Président Tanoh Ischam Ezéchiel)
- Base CIE

**Partenaires sanitaires :**
- Le Grand Centre, Clinique Vie, Clinique Ste Jeane de Garcia
- Pharmacie Nouvelle Raphaël, Pharmacie Roxane

**Partenaires :**
- CIE (Compagnie Ivoirienne d'Électricité), Jumbo Store, La Table des Chefs, et autres espaces événementiels

**CCJY :**
- Le Conseil Communal des Jeunes de Yopougon est l'organe faîtier de la jeunesse communale
- Il coordonne 87 districts et 11 villages
- Le CCJY est affilié à la FENUJECI (Fédération Nationale des Unions de Jeunesse Communale de Côte d'Ivoire)

## Règles :
- Réponds toujours en français
- Sois professionnel, courtois et concis
- Si tu ne connais pas une information, dis-le honnêtement
- Oriente les visiteurs vers les services du district
- Encourage la participation citoyenne et communautaire`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
