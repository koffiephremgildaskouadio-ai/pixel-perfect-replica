import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INVESTITURE_IMAGE = "https://districtcitenovalim-cie.lovable.app/images/investiture_event.jpg";
const EVENT_DATE = new Date("2026-05-03T14:00:00+00:00");

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
    const daysUntilEvent = Math.ceil((EVENT_DATE.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // === PRIORITY: Investiture event communication (today and tomorrow only) ===
    // Saturday May 2 2026 = J-1, Sunday May 3 2026 = J0
    const isPriorityWindow = daysUntilEvent >= 0 && daysUntilEvent <= 1;

    if (isPriorityWindow) {
      // Check if we already pushed an investiture post today
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const { data: existing } = await supabase
        .from("actualites")
        .select("id")
        .eq("type", "event")
        .gte("created_at", startOfDay.toISOString())
        .ilike("title", "%investiture%");

      if (!existing || existing.length < 2) {
        const investiturePosts = daysUntilEvent === 1 ? [
          {
            title: "🔥 J-1 — Demain, Cérémonie Historique d'Investiture des Présidents !",
            content: `Chers membres, chers partenaires, chères populations du District Cité Novalim-CIE,

C'est avec une immense fierté et une joie profonde que nous vous annonçons que demain, **Dimanche 03 Mai 2026 à partir de 14H00**, se tiendra la **Cérémonie d'Investiture Conjointe** des Présidents des Districts CITÉ NOVALIM-CIE et FRANCE-VILLE.

📍 **Lieu : Terrain sable, ruelle du carrefour maquis (Yopougon)**

🎩 Sous le **Haut Patronage** de l'Honorable **Adama BICTOGO**, Député-Maire de Yopougon
🌟 Sous la **Présidence** de M. **Assim SABA**, Président du CCJY
💎 Sous le **Parrainage** de M. **KARIMU Waidi Abiola**, PDG de **JUMBO STORE CI**

Seront officiellement investis :
• **M. Kouadio Koffi Éphrem Gildas** — Président du District Cité Novalim-CIE
• **M. Bamba Adama** — Président du District Franceville

📞 Infoline : 07 07 11 73 20 / 07 99 04 38 56

Mobilisons-nous massivement ! Votre présence est notre force. À demain pour écrire ensemble une nouvelle page de l'histoire de la jeunesse yopougonnaise. 🇨🇮`,
            type: "event",
            image_url: INVESTITURE_IMAGE,
          },
          {
            title: "📣 Invitation Officielle — Investiture des Présidents (Demain 14H)",
            content: `À tous les habitants du District Cité Novalim-CIE, aux jeunes de Yopougon, aux partenaires institutionnels et aux amis du district :

**Vous êtes cordialement invités** à la cérémonie d'investiture conjointe de nos Présidents, demain **Dimanche 03 Mai 2026 dès 14H00**, au Terrain sable (ruelle du carrefour maquis).

🎉 Au programme :
• Discours officiels des autorités
• Investiture solennelle des Présidents
• Présentation des bureaux exécutifs
• Animations culturelles et prestations d'artistes
• Cocktail et moments d'échange

Tenue recommandée : élégante. Venez nombreux, venez en famille !

Avec nos remerciements anticipés.
La Commission d'Organisation.`,
            type: "event",
            image_url: INVESTITURE_IMAGE,
          },
        ] : [
          {
            title: "🎊 C'EST AUJOURD'HUI ! Investiture des Présidents — Rendez-vous à 14H !",
            content: `Le grand jour est arrivé ! 🇨🇮

**AUJOURD'HUI Dimanche 03 Mai 2026, dès 14H00**, le District Cité Novalim-CIE et le District Franceville célèbrent l'investiture officielle de leurs Présidents.

📍 **Terrain sable, ruelle du carrefour maquis (Yopougon)**

Une journée historique pour la jeunesse yopougonnaise, sous le Haut Patronage du Député-Maire **Adama BICTOGO**, présidée par M. **Assim SABA** (Président du CCJY) et parrainée par M. **KARIMU Waidi Abiola** (PDG de JUMBO STORE CI).

🎤 Investiture de :
• **M. Kouadio Koffi Éphrem Gildas** — Président du District Cité Novalim-CIE
• **M. Bamba Adama** — Président du District Franceville

Soyons tous présents pour soutenir nos leaders ! 💪

📞 Infoline : 07 07 11 73 20 / 07 99 04 38 56`,
            type: "event",
            image_url: INVESTITURE_IMAGE,
          },
          {
            title: "📸 Investiture en Direct — Suivez l'événement aujourd'hui !",
            content: `Chers membres et sympathisants,

La cérémonie d'investiture commence dans quelques heures. Si vous ne pouvez pas être physiquement présents, **suivez l'événement en direct** sur notre page Facebook officielle : **District Cité Novalim-CIE**.

Photos, vidéos et live seront publiés tout au long de la journée. Partagez massivement, taguez vos amis, montrons la force et l'unité du District Cité Novalim-CIE !

#InvestitureNovalim2026 #JeunesseYopougon #CCJY #DistrictCiteNovalimCIE`,
            type: "event",
            image_url: INVESTITURE_IMAGE,
          },
        ];

        for (const post of investiturePosts) {
          await supabase.from("actualites").insert({
            ...post,
            source: "Commission d'Organisation — Investiture 2026",
            media: [{ type: "image", url: INVESTITURE_IMAGE }],
          });
        }
      }
    }

    // === Daily AI generic posts (1 only to keep feed fresh, not noisy) ===
    const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const dateStr = `${dayNames[today.getDay()]} ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;

    // Skip generic AI posts during priority window to keep focus on event
    if (isPriorityWindow) {
      return new Response(JSON.stringify({ success: true, mode: "investiture_priority", days: daysUntilEvent }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Tu es le community manager du District Cité Novalim-CIE (CCJY, Yopougon, Côte d'Ivoire).
Aujourd'hui c'est ${dateStr}. Génère exactement 1 publication motivante et inspirante pour la jeunesse.
Format JSON: [{"title":"...","content":"2-3 paragraphes","type":"ai_daily","image_prompt":"description en anglais d'une image illustrant"}]
Réponds UNIQUEMENT avec le JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error("AI gateway error: " + response.status);
    }

    const data = await response.json();
    let raw = data.choices?.[0]?.message?.content || "[]";
    raw = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const articles = JSON.parse(raw);

    for (const article of articles) {
      let imageUrl: string | null = null;
      if (article.image_prompt) {
        try {
          const imgResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
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
        } catch (imgErr) { console.error("img fail", imgErr); }
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
