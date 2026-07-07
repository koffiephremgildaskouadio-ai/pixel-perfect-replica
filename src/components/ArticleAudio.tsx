import { useEffect, useRef, useState } from "react";
import { Volume2, Pause, Square, Share2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  title: string;
  content: string;
}

/**
 * Lecture audio d'une publication.
 * - Voix humanisée générée côté serveur (Lovable AI TTS, voix chaleureuse).
 * - Musique/pad d'ambiance mixée en fond via Web Audio pour un rendu "radio".
 * - Bouton "Partager" qui envoie l'audio en pièce jointe si le navigateur le permet.
 */
export const ArticleAudio = ({ title, content }: Props) => {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  const [sharing, setSharing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const ambientRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      ambientRef.current?.stop();
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

  const startAmbientPad = () => {
    // Pad harmonique doux (Do mineur), très bas en volume — pour humaniser sans couvrir la voix.
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    const ctx = ctxRef.current ?? new AudioCtx();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const master = ctx.createGain();
    master.gain.value = 0.0;
    master.connect(ctx.destination);

    // Fondu d'entrée
    master.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.2);

    // Réverbération simple : convolver avec un impulse de bruit décroissant
    const convolver = ctx.createConvolver();
    const sampleRate = ctx.sampleRate;
    const impulseLen = sampleRate * 2.5;
    const impulse = ctx.createBuffer(2, impulseLen, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < impulseLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLen, 2.5);
      }
    }
    convolver.buffer = impulse;

    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    convolver.connect(wet).connect(master);

    // Filtre passe-bas pour un rendu chaud
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    lp.Q.value = 0.6;
    lp.connect(master);
    lp.connect(convolver);

    // Accord Fa majeur 7 (F, A, C, E) — doux et lumineux
    const freqs = [174.61, 220.0, 261.63, 329.63];
    const oscs: OscillatorNode[] = [];
    freqs.forEach((f, i) => {
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      o1.type = "sine";
      o2.type = "triangle";
      o1.frequency.value = f;
      o2.frequency.value = f * 1.005; // léger désaccord = chaleur
      const g = ctx.createGain();
      g.gain.value = 0.25 - i * 0.03;

      // LFO amplitude très lent (mouvement naturel)
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.08 + i * 0.03;
      lfoGain.gain.value = 0.08;
      lfo.connect(lfoGain).connect(g.gain);
      lfo.start();

      o1.connect(g);
      o2.connect(g);
      g.connect(lp);
      o1.start();
      o2.start();
      oscs.push(o1, o2, lfo);
    });

    return {
      stop: () => {
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.linearRampToValueAtTime(0.0, t + 0.8);
        setTimeout(() => {
          oscs.forEach((o) => { try { o.stop(); } catch {} });
        }, 900);
      },
    };
  };

  const ensureAudio = async (): Promise<HTMLAudioElement> => {
    if (audioRef.current && blobRef.current) return audioRef.current;
    const { data: { session } } = await supabase.auth.getSession();
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts-article`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ title, content }),
    });
    if (!resp.ok) throw new Error(`TTS ${resp.status}`);
    const blob = await resp.blob();
    blobRef.current = blob;
    const url = URL.createObjectURL(blob);
    audioUrlRef.current = url;
    const el = new Audio(url);
    el.preload = "auto";
    el.onended = () => { ambientRef.current?.stop(); ambientRef.current = null; setState("idle"); };
    el.onerror = () => { ambientRef.current?.stop(); ambientRef.current = null; setState("idle"); toast.error("Lecture audio impossible"); };
    audioRef.current = el;
    return el;
  };

  const play = async () => {
    try {
      setState("loading");
      const el = await ensureAudio();
      if (!ambientRef.current) ambientRef.current = startAmbientPad();
      await el.play();
      setState("playing");
    } catch (e: any) {
      console.error(e);
      toast.error("Impossible de générer l'audio pour le moment.");
      setState("idle");
    }
  };

  const pause = () => {
    audioRef.current?.pause();
    setState("paused");
  };

  const resume = async () => {
    try {
      await audioRef.current?.play();
      setState("playing");
    } catch {}
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    ambientRef.current?.stop();
    ambientRef.current = null;
    setState("idle");
  };

  const shareWithAudio = async () => {
    try {
      setSharing(true);
      if (!blobRef.current) {
        await ensureAudio();
      }
      const blob = blobRef.current!;
      const file = new File([blob], `${slug(title)}.mp3`, { type: "audio/mpeg" });
      const shareText = `*${title}*\n\n${content}\n\n— District Cité Novalim-CIE\nhttps://districtcitenovalim-cie.lovable.app`;
      const nav: any = navigator;
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title, text: shareText });
      } else {
        // Fallback : télécharge l'audio + ouvre WhatsApp avec le texte.
        const a = document.createElement("a");
        a.href = audioUrlRef.current!;
        a.download = file.name;
        document.body.appendChild(a); a.click(); a.remove();
        window.open(
          `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + "\n\n🔊 Audio téléchargé, joignez-le à votre message.")}`,
          "_blank", "noopener,noreferrer"
        );
        toast.success("Audio téléchargé — joignez-le à votre partage WhatsApp.");
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        console.error(e);
        toast.error("Partage impossible.");
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-1 flex-wrap">
      {state === "idle" && (
        <button
          onClick={play}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-accent/10 text-accent-foreground hover:bg-accent/20 transition"
        >
          <Volume2 className="w-3.5 h-3.5" /> Écouter
        </button>
      )}
      {state === "loading" && (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Préparation…
        </span>
      )}
      {state === "playing" && (
        <>
          <button onClick={pause} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20">
            <Pause className="w-3.5 h-3.5" /> Pause
          </button>
          <button onClick={stop} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted hover:bg-muted/70" aria-label="Arrêter">
            <Square className="w-3 h-3" />
          </button>
        </>
      )}
      {state === "paused" && (
        <>
          <button onClick={resume} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20">
            <Volume2 className="w-3.5 h-3.5" /> Reprendre
          </button>
          <button onClick={stop} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted hover:bg-muted/70" aria-label="Arrêter">
            <Square className="w-3 h-3" />
          </button>
        </>
      )}
      <button
        onClick={shareWithAudio}
        disabled={sharing}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        {sharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
        Partager avec l'audio
      </button>
    </div>
  );
};

function slug(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40) || "audio";
}
