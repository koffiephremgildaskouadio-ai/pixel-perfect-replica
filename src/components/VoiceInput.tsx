import { useEffect, useRef, useState } from "react";
import { Mic, Loader2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const URL_T = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`;
const MAX_MS = 60_000;

/** Bouton micro : enregistre, puis transcrit la voix en texte. */
export const VoiceInput = ({ onText, disabled }: { onText: (t: string) => void; disabled?: boolean }) => {
  const [state, setState] = useState<"idle" | "rec" | "busy">("idle");
  const recRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => { recRef.current?.state === "recording" && recRef.current.stop(); }, []);

  const send = async (blob: Blob, type: string) => {
    setState("busy");
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { toast.error("Connectez-vous pour utiliser la dictée."); return; }
      const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
      const fd = new FormData();
      fd.append("file", new File([blob], `dictee.${ext}`, { type }));
      const resp = await fetch(URL_T, { method: "POST", headers: { Authorization: `Bearer ${data.session.access_token}` }, body: fd });
      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err?.error?.message || err?.error || (resp.status === 402 ? "Crédits IA épuisés." : "Dictée impossible pour le moment."));
        return;
      }
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "", text = "", final = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const ev = JSON.parse(payload);
            if (ev.type === "transcript.text.delta") text += ev.delta ?? "";
            if (ev.type === "transcript.text.done") final = ev.text ?? "";
            if (ev.type === "error") throw new Error(ev.error?.message || "error");
          } catch (e) { if (e instanceof Error && e.message !== "error" && !(e instanceof SyntaxError)) throw e; }
        }
      }
      const out = (final || text).trim();
      if (out) onText(out); else toast.error("Je n'ai rien entendu. Réessayez plus près du micro.");
    } catch {
      toast.error("Dictée interrompue. Réessayez.");
    } finally {
      setState("idle");
    }
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported?.(m)) ?? "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) window.clearTimeout(timerRef.current);
        const type = rec.mimeType || "audio/webm";
        void send(new Blob(chunks, { type }), type);
      };
      rec.start();
      recRef.current = rec;
      setState("rec");
      timerRef.current = window.setTimeout(() => rec.state === "recording" && rec.stop(), MAX_MS);
    } catch {
      toast.error("Autorisez le micro pour dicter votre message.");
    }
  };

  if (state === "busy") return <Button type="button" variant="ghost" size="icon" disabled><Loader2 className="w-4 h-4 animate-spin" /></Button>;
  if (state === "rec")
    return (
      <Button type="button" variant="destructive" size="icon" onClick={() => recRef.current?.stop()} title="Arrêter la dictée" aria-label="Arrêter la dictée">
        <Square className="w-4 h-4" />
      </Button>
    );
  return (
    <Button type="button" variant="ghost" size="icon" onClick={start} disabled={disabled} title="Dicter un message" aria-label="Dicter un message">
      <Mic className="w-4 h-4" />
    </Button>
  );
};
