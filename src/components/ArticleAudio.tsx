import { useEffect, useRef, useState } from "react";
import { Volume2, Pause, Square } from "lucide-react";

interface Props {
  title: string;
  content: string;
}

/**
 * Lecture audio d'une publication via l'API SpeechSynthesis du navigateur.
 * Aucun coût serveur, fonctionne hors-ligne, voix française si disponible.
 */
export const ArticleAudio = ({ title, content }: Props) => {
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  if (!supported) return null;

  const play = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const text = `${title}. ${content}`.replace(/[*_#>`]/g, "");
    const u = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const fr = voices.find((v) => v.lang?.toLowerCase().startsWith("fr"));
    if (fr) u.voice = fr;
    u.lang = fr?.lang || "fr-FR";
    u.rate = 1;
    u.pitch = 1;
    u.onend = () => setState("idle");
    u.onerror = () => setState("idle");
    utterRef.current = u;
    synth.speak(u);
    setState("playing");
  };

  const pause = () => {
    window.speechSynthesis.pause();
    setState("paused");
  };

  const resume = () => {
    window.speechSynthesis.resume();
    setState("playing");
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setState("idle");
  };

  return (
    <div className="inline-flex items-center gap-1">
      {state === "idle" && (
        <button
          onClick={play}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-accent/10 text-accent-foreground hover:bg-accent/20 transition"
          aria-label="Écouter la publication"
        >
          <Volume2 className="w-3.5 h-3.5" /> Écouter
        </button>
      )}
      {state === "playing" && (
        <>
          <button
            onClick={pause}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
          >
            <Pause className="w-3.5 h-3.5" /> Pause
          </button>
          <button
            onClick={stop}
            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted hover:bg-muted/70"
            aria-label="Arrêter la lecture"
          >
            <Square className="w-3 h-3" />
          </button>
        </>
      )}
      {state === "paused" && (
        <>
          <button
            onClick={resume}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
          >
            <Volume2 className="w-3.5 h-3.5" /> Reprendre
          </button>
          <button
            onClick={stop}
            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted hover:bg-muted/70"
            aria-label="Arrêter la lecture"
          >
            <Square className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
};
