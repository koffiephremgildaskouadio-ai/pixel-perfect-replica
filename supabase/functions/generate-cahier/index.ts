import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { nom, prenoms, poste, category } = await req.json();
    if (!poste || typeof poste !== "string") {
      return new Response(JSON.stringify({ error: "poste requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY manquant");

    const prompt = `Tu es secrétaire général du District Cité Novalim-CIE (CCJY, Yopougon).
Génère le **cahier de charges officiel** pour ce membre :
- Nom : ${nom ?? ""} ${prenoms ?? ""}
- Poste / Fonction : ${poste}
- Catégorie : ${category ?? "membre"}

Rédige 5 à 7 missions concrètes, sous forme de liste à puces (utilise "•"), en français formel et concis.
Chaque puce commence par un verbe d'action. Réponds UNIQUEMENT avec la liste, sans introduction ni conclusion.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      throw new Error(`AI gateway ${r.status}: ${errText}`);
    }
    const data = await r.json();
    const cahier = data.choices?.[0]?.message?.content?.trim() ?? "";

    return new Response(JSON.stringify({ cahier_charges: cahier }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-cahier error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
