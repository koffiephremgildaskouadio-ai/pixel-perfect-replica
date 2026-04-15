import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing env vars");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const today = new Date();
    const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const dateStr = `${dayNames[today.getDay()]} ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;

    const prompt = `Tu es le community manager du District Cité Novalim-CIE (Conseil Communal des Jeunes de Yopougon, Côte d'Ivoire). 
    
Aujourd'hui c'est ${dateStr}. Génère exactement 3 publications pour le fil d'actualités du jour, au format JSON array.

Règles:
- Commence TOUJOURS par un message de salutation et motivation pour la jeunesse
- Inclus des informations pertinentes au calendrier ivoirien (fêtes, événements nationaux, saisons)
- Mentionne si possible des initiatives liées à la jeunesse, à la mairie de Yopougon, au ministère de la Promotion de la Jeunesse
- Écris comme un professionnel cultivé, inspirant et bienveillant
- Chaque publication doit avoir: title (court), content (2-4 paragraphes), type (ai_daily), image_prompt (description en anglais d'une image africaine/ivoirienne illustrant le sujet, style photographique professionnel)

Réponds UNIQUEMENT avec le JSON array, sans markdown ni explication.
Exemple: [{"title":"...","content":"...","type":"ai_daily","image_prompt":"Professional photo of young African people in Abidjan..."}]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let raw = data.choices?.[0]?.message?.content || "[]";
    raw = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const articles = JSON.parse(raw);

    for (const article of articles) {
      let imageUrl: string | null = null;

      // Generate an image for the article
      if (article.image_prompt) {
        try {
          const imgResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [{ role: "user", content: article.image_prompt }],
              modalities: ["image", "text"],
            }),
          });

          if (imgResponse.ok) {
            const imgData = await imgResponse.json();
            const base64Url = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            if (base64Url) {
              // Upload to storage
              const base64Data = base64Url.split(",")[1];
              const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
              const filename = `news/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
              
              const { error: uploadError } = await supabase.storage
                .from("member-photos")
                .upload(filename, binaryData, { contentType: "image/png" });
              
              if (!uploadError) {
                const { data: urlData } = supabase.storage.from("member-photos").getPublicUrl(filename);
                imageUrl = urlData.publicUrl;
              }
            }
          }
        } catch (imgErr) {
          console.error("Image generation failed:", imgErr);
        }
      }

      await supabase.from("actualites").insert({
        title: article.title,
        content: article.content,
        source: "IA District Novalim-CIE",
        type: article.type || "ai_daily",
        image_url: imageUrl,
      });
    }

    return new Response(JSON.stringify({ success: true, count: articles.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-news error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
