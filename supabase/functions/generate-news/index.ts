import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CCJY_BASE = "https://ccj-yop.org";
const SRC_CCJY = "CCJY — ccj-yop.org";
const SRC_AI = "IA District Novalim-CIE";

const decode = (s: string) =>
  s
    .replace(/&#0?39;/g, "'")
    .replace(/&rsquo;/g, "’")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

type Scraped = { title: string; content: string; image: string | null; link: string | null };

async function scrapeCcjy(): Promise<Scraped[]> {
  const res = await fetch(CCJY_BASE, { headers: { "User-Agent": "Mozilla/5.0 DistrictNovalimBot" } });
  if (!res.ok) return [];
  const html = await res.text();
  const section = html.split("<!-- ACTUALITÉS -->")[1] ?? html;
  const cards = section.split('class="col-md-6 col-xl-3"').slice(1);
  const out: Scraped[] = [];
  for (const card of cards.slice(0, 8)) {
    const img = card.match(/src="(uploads\/actualites\/[^"]+)"/)?.[1] ?? null;
    const title = decode(card.match(/<h5[^>]*>([\s\S]*?)<\/h5>/)?.[1] ?? "");
    const excerpt = decode(card.match(/<p class="text-muted[^"]*">([\s\S]*?)<\/p>/)?.[1] ?? "");
    const href = card.match(/href="(actualite\/[^"]+)"/)?.[1] ?? null;
    if (!title) continue;
    out.push({
      title,
      content: excerpt,
      image: img ? `${CCJY_BASE}/${img}` : null,
      link: href ? `${CCJY_BASE}/${href}` : null,
    });
  }
  return out;
}

async function fetchDetail(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 DistrictNovalimBot" } });
    if (!r.ok) return null;
    const h = await r.text();
    const body = h.match(/<article[\s\S]*?<\/article>/)?.[0] ?? h.match(/<div class="card-body[\s\S]*?<\/div>/)?.[0];
    if (!body) return null;
    const txt = decode(body);
    return txt.length > 120 ? txt.slice(0, 1800) : null;
  } catch {
    return null;
  }
}

const NEWS_MODELS = [
  "google/gemini-3.6-flash",
  "google/gemini-3-flash-preview",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "openai/gpt-5-mini",
];

async function askAI(key: string, prompt: string): Promise<string | null> {
  for (const model of NEWS_MODELS) {
    try {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] }),
      });
      if (r.ok) {
        const d = await r.json();
        return d.choices?.[0]?.message?.content ?? null;
      }
      console.warn("news model failed", model, r.status);
    } catch (e) {
      console.warn("news model error", model, e instanceof Error ? e.message : e);
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing env vars");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1) Sources officielles : actualités réelles du CCJY (avec vraies images)
    const scraped = await scrapeCcjy();
    const enriched: Scraped[] = [];
    for (const item of scraped.slice(0, 6)) {
      let content = item.content;
      if (item.link) {
        const full = await fetchDetail(item.link);
        if (full) content = full;
      }
      enriched.push({ ...item, content });
    }

    // 2) Publication IA du jour (contexte local : Mairie de Yopougon, ministères)
    const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const today = new Date();
    const dateStr = `${dayNames[today.getDay()]} ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;

    const prompt = `Tu es le community manager du District Cité Novalim-CIE (CCJY, Yopougon, Côte d'Ivoire).
Aujourd'hui : ${dateStr}.
Contexte des actualités réelles du CCJY à ta disposition :
${enriched.map((e, i) => `${i + 1}. ${e.title}`).join("\n") || "(aucune)"}

Génère EXACTEMENT 1 publication COURTE et percutante pour la jeunesse du district, ancrée dans la vie locale de Yopougon : Mairie de Yopougon, CCJY, Ministère de la Promotion de la Jeunesse et de l'Emploi, Ministère de l'Hydraulique/Assainissement/Salubrité, Ministère de l'Intérieur (civisme, sécurité, état civil).
N'invente JAMAIS de date précise, de communiqué officiel ni de nom de personne.
Contraintes STRICTES :
- title : max 10 mots, accrocheur (1 emoji max).
- content : 2 à 3 phrases MAXIMUM, directes, motivantes, sans salutations.
Format JSON: [{"title":"...","content":"...","type":"ai_daily"}]
Réponds UNIQUEMENT avec le JSON.`;

    let aiPosts: any[] = [];
    const raw = await askAI(LOVABLE_API_KEY, prompt);
    if (raw) {
      try {
        aiPosts = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      } catch {
        aiPosts = [];
      }
    }

    const rows = [
      ...enriched.map((e) => ({
        title: e.title.slice(0, 200),
        content: `${e.content}${e.link ? `\n\n🔗 Lire l'article officiel : ${e.link}` : ""}`,
        source: SRC_CCJY,
        type: "ccjy",
        image_url: e.image,
        media: e.image ? [{ type: "image", url: e.image }] : [],
      })),
      ...aiPosts.slice(0, 1).map((a: any) => ({
        title: String(a.title || "").slice(0, 200),
        content: String(a.content || ""),
        source: SRC_AI,
        type: "ai_daily",
        image_url: null,
        media: [],
      })),
    ].filter((r) => r.title && r.content);

    if (rows.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Aucune source disponible" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Purge des anciennes publications automatiques AVANT insertion (évite doublons / surcharge serveur)
    await supabase.from("actualites").delete().in("source", [SRC_CCJY, SRC_AI]);

    await supabase.from("actualites").insert(rows);

    return new Response(JSON.stringify({ success: true, count: rows.length, ccjy: enriched.length }), {
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
