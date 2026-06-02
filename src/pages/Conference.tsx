import { useState, useEffect, useRef } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Video, Phone, Users, Copy, Check,
  Sparkles, ShieldCheck, Infinity as InfinityIcon, MessageCircle, Share2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Conference = () => {
  const [roomName, setRoomName] = useState("");
  const [userName, setUserName] = useState("");
  const [inCall, setInCall] = useState(false);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const jitsiContainer = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata;
        setUserName(`${meta?.nom || ""} ${meta?.prenoms || ""}`.trim() || data.user.email || "Membre");
      }
    });
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    if (room) {
      setRoomName(room);
      // auto-join when invited via link
      setTimeout(() => startCall(false, room), 200);
    }
    return () => { apiRef.current?.dispose(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCall = (audioOnly = false, override?: string) => {
    const room = (override ?? roomName).trim() || `novalim-${Date.now().toString(36)}`;
    setRoomName(room);
    setActiveRoom(room);
    setInCall(true);

    // Serveur Jitsi libre SANS limite de temps (meet.jit.si impose 5 min aux invités non-auth)
    const JITSI_DOMAIN = "meet.ffmuc.net";

    const launch = () => {
      if (!jitsiContainer.current) return;
      // @ts-ignore
      apiRef.current = new JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName: `NovalimCIE_${room}`,
        parentNode: jitsiContainer.current,
        width: "100%",
        height: "100%",
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: audioOnly,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
          enableClosePage: false,
          subject: "District Cité Novalim - CIE",
          disableReactions: false,
          disablePolls: false,
          enableEmojiReactions: true,
          requireDisplayName: false,
          disableProfile: true,
          hideConferenceTimer: false,
          conferenceInfo: { autoHide: ["conference-timer"] },
          toolbarButtons: [
            "microphone", "camera", "desktop", "chat", "raisehand",
            "participants-pane", "tileview", "hangup", "recording",
            "settings", "fullscreen", "select-background", "videoquality",
            "reactions", "emoji", "invite", "shareaudio", "sharedvideo",
            "livestreaming", "stats", "security", "mute-everyone", "etherpad",
            "filmstrip", "closedcaptions", "whiteboard", "noisesuppression",
          ],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          DEFAULT_BACKGROUND: "#0f3a26",
          TOOLBAR_ALWAYS_VISIBLE: true,
          MOBILE_APP_PROMO: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
        },
        userInfo: { displayName: userName || "Membre Novalim" },
      });

      apiRef.current.addListener("readyToClose", () => {
        setInCall(false);
        setActiveRoom(null);
        apiRef.current?.dispose();
        apiRef.current = null;
      });
    };

    if ((window as any).JitsiMeetExternalAPI) {
      launch();
    } else {
      const script = document.createElement("script");
      script.src = `https://${JITSI_DOMAIN}/external_api.js`;
      script.onload = launch;
      script.onerror = () => {
        // Fallback : repli sur meet.jit.si si ffmuc indisponible
        const s2 = document.createElement("script");
        s2.src = "https://meet.jit.si/external_api.js";
        s2.onload = launch;
        document.head.appendChild(s2);
      };
      document.head.appendChild(script);
    }
  };

  const buildLink = (room: string) =>
    `${window.location.origin}/conference?room=${room}`;

  const copyLink = async (room: string) => {
    const link = buildLink(room);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Lien copié — partagez-le aux participants");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible");
    }
  };

  const shareLink = async (room: string) => {
    const link = buildLink(room);
    const text = `Rejoignez la conférence du District Cité Novalim - CIE : ${link}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Conférence Novalim", text, url: link }); } catch {}
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  if (inCall) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {/* Bandeau lien — visible APRÈS lancement */}
        {activeRoom && (
          <div className="bg-primary text-primary-foreground px-3 py-2 flex items-center gap-2 flex-wrap text-xs sm:text-sm shadow-md">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="font-semibold shrink-0">Lien d'invitation :</span>
            <code className="bg-black/20 px-2 py-0.5 rounded truncate flex-1 min-w-0">
              {buildLink(activeRoom)}
            </code>
            <Button size="sm" variant="secondary" className="h-7 gap-1" onClick={() => copyLink(activeRoom)}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              Copier
            </Button>
            <Button size="sm" variant="secondary" className="h-7 gap-1" onClick={() => shareLink(activeRoom)}>
              <Share2 className="w-3.5 h-3.5" /> Partager
            </Button>
          </div>
        )}
        <div ref={jitsiContainer} className="flex-1 w-full" />
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-secondary/30 to-background">
      <div className="container max-w-3xl py-10 lg:py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>

        <ScrollReveal className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
            <InfinityIcon className="w-3.5 h-3.5" /> Sans limite de temps · Gratuit
          </span>
          <h1 className="mt-4 text-3xl lg:text-4xl font-display font-bold text-foreground">
            Salle de Conférence Novalim
          </h1>
          <p className="mt-3 text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Lancez une visioconférence professionnelle en un clic. Le lien d'invitation sera généré
            <strong> automatiquement après le démarrage</strong>.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="bg-card rounded-3xl border border-border/50 shadow-xl p-6 lg:p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nom de la salle (optionnel)</label>
              <Input
                placeholder="Ex: bureau-mai, ag-extraordinaire…"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value.replace(/\s+/g, "-").toLowerCase())}
              />
              <p className="text-xs text-muted-foreground">
                Laissez vide pour générer une salle automatique. Le lien apparaîtra dès le démarrage.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Button
                variant="hero" size="lg" className="gap-2 w-full text-base h-14"
                onClick={() => startCall(false)}
              >
                <Video className="w-5 h-5" />
                Démarrer Vidéo
              </Button>
              <Button
                variant="outline" size="lg" className="gap-2 w-full text-base h-14"
                onClick={() => startCall(true)}
              >
                <Phone className="w-5 h-5" />
                Démarrer Audio
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/30">
              {[
                { icon: InfinityIcon, label: "Durée illimitée" },
                { icon: ShieldCheck, label: "Chiffré & sécurisé" },
                { icon: MessageCircle, label: "Chat & emojis" },
                { icon: Users, label: "Jusqu'à 100 pers." },
              ].map((f) => (
                <div key={f.label} className="text-center p-3 rounded-xl bg-secondary/60 border border-border/30">
                  <f.icon className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="mt-6 bg-card rounded-2xl border border-border/50 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold text-foreground">Comment ça marche ?</h2>
            </div>
            <ol className="space-y-3 text-sm text-muted-foreground">
              {[
                "Cliquez sur Démarrer Vidéo ou Démarrer Audio. La conférence s'ouvre instantanément.",
                "Une fois en salle, le lien d'invitation s'affiche en haut de l'écran.",
                "Cliquez sur Copier ou Partager pour inviter d'autres membres (WhatsApp, e-mail…).",
                "Tous ceux qui ouvrent le lien rejoignent automatiquement la même salle.",
              ].map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0">{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default Conference;
