// Génère un MP3 chaleureux pour une publication du fil d'actualité.
// Utilise Lovable AI Gateway (openai/gpt-4o-mini-tts), voix humanisée.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Découpe le texte en morceaux < ~1200 caractères en respectant les phrases.
function chunk(text: string, max = 1200): string[] {
  const clean = text.replace(/[*_#>`]/g, "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return [clean];
  const sentences = clean.match(/[^.!?]+[.!?]+\s*|[^.!?]+$/g) ?? [clean];
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > max) {
      if (cur) out.push(cur.trim());
      cur = s;
    } else {
      cur += s;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY manquant");

    const { title, content, voice } = await req.json();
    const rawText = `${title ? title + ". " : ""}${content ?? ""}`.trim();
    if (!rawText) {
      return new Response(JSON.stringify({ error: "Texte vide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chunks = chunk(rawText, 1200);
    const pieces: Uint8Array[] = [];

    const instructions =
      "Voix chaleureuse, naturelle et engageante d'un présentateur de radio ivoirien. " +
      "Ton posé, expressif et humain, avec de courtes pauses aux virgules. " +
      "Prononciation claire du français, accentuation naturelle des mots importants. " +
      "Évite le ton robotique.";

    const chosenVoice = typeof voice === "string" && voice.trim() ? voice : "shimmer";

    for (const piece of chunks) {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini-tts",
          input: piece,
          voice: chosenVoice,
          instructions,
          response_format: "mp3",
          speed: 1.0,
        }),
      });
      if (!resp.ok) {
        const detail = await resp.text().catch(() => "");
        console.error("TTS failed", resp.status, detail);
        return new Response(JSON.stringify({ error: "TTS échoué", status: resp.status, detail }), {
          status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      pieces.push(new Uint8Array(await resp.arrayBuffer()));
    }

    // Concatène les MP3 (les fichiers MP3 peuvent être concaténés brut pour une lecture séquentielle).
    const total = pieces.reduce((s, p) => s + p.length, 0);
    const out = new Uint8Array(total);
    let off = 0;
    for (const p of pieces) { out.set(p, off); off += p.length; }

    return new Response(out, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    console.error("tts-article error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
