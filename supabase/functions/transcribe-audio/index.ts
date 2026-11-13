// Dictée vocale : transcrit un enregistrement court en texte (Lovable AI).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const MAX_BYTES = 20 * 1024 * 1024;
const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  const auth = req.headers.get("Authorization") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data, error } = await supabase.auth.getClaims(auth.replace(/^Bearer\s+/i, ""));
  if (error || !data?.claims?.sub) return json({ error: "Connectez-vous pour utiliser la dictée." }, 401);

  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > MAX_BYTES) return json({ error: "Enregistrement trop long." }, 413);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) return json({ error: "Aucun son reçu." }, 400);
  if (file.size > MAX_BYTES) return json({ error: "Enregistrement trop long." }, 413);

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return json({ error: "Service vocal non configuré." }, 500);

  const up = new FormData();
  up.append("file", file, file.name || "dictee.webm");
  up.append("model", "openai/gpt-transcribe");
  up.append("languages", "fr");
  up.append("stream", "true");
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: up,
  });
  return new Response(resp.body, {
    status: resp.status,
    headers: { ...corsHeaders, "Content-Type": resp.headers.get("Content-Type") ?? "text/event-stream" },
  });
});
