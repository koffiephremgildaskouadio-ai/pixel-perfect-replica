import { useState, useEffect, useRef } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Video, Phone, Users, Copy, Check, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Conference = () => {
  const [roomName, setRoomName] = useState("");
  const [userName, setUserName] = useState("");
  const [inCall, setInCall] = useState(false);
  const [copied, setCopied] = useState(false);
  const jitsiContainer = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const navigate = useNavigate();

  // Get user info
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata;
        setUserName(`${meta?.nom || ""} ${meta?.prenoms || ""}`.trim() || data.user.email || "Membre");
      }
    });
  }, []);

  const generateRoom = () => {
    const id = `novalim-${Date.now().toString(36)}`;
    setRoomName(id);
    return id;
  };

  const startCall = (audioOnly = false) => {
    const room = roomName.trim() || generateRoom();
    setRoomName(room);
    setInCall(true);

    // Load Jitsi API
    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.onload = () => {
      if (!jitsiContainer.current) return;
      // @ts-ignore
      apiRef.current = new JitsiMeetExternalAPI("meet.jit.si", {
        roomName: `NovalimCIE_${room}`,
        parentNode: jitsiContainer.current,
        width: "100%",
        height: "100%",
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: audioOnly,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          toolbarButtons: [
            "microphone", "camera", "desktop", "chat", "raisehand",
            "participants-pane", "tileview", "hangup", "recording",
            "settings", "fullscreen", "select-background",
          ],
          subject: "Conférence District Novalim-CIE",
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          DEFAULT_BACKGROUND: "#1a3a2a",
          TOOLBAR_ALWAYS_VISIBLE: true,
          MOBILE_APP_PROMO: false,
        },
        userInfo: { displayName: userName },
      });

      apiRef.current.addListener("readyToClose", () => {
        setInCall(false);
        apiRef.current?.dispose();
        apiRef.current = null;
      });
    };
    document.head.appendChild(script);
  };

  const copyLink = () => {
    const room = roomName.trim() || generateRoom();
    setRoomName(room);
    const link = `${window.location.origin}/conference?room=${room}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Lien de la conférence copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto-join if room in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    if (room) {
      setRoomName(room);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      apiRef.current?.dispose();
    };
  }, []);

  if (inCall) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div ref={jitsiContainer} className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-secondary/30">
      <div className="container max-w-2xl py-10 lg:py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>

        <ScrollReveal className="text-center mb-10">
          <span className="text-sm font-semibold text-primary tracking-wide uppercase">Communication</span>
          <h1 className="mt-3 text-3xl lg:text-4xl font-display font-bold text-foreground">
            Salle de Conférence
          </h1>
          <p className="mt-3 text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Lancez ou rejoignez une conférence audio/vidéo en direct avec les membres du district.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 lg:p-8 space-y-6">
            {/* Room name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nom de la salle (optionnel)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: reunion-bureau-avril"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value.replace(/\s+/g, "-").toLowerCase())}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={copyLink} title="Copier le lien">
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Laissez vide pour créer une salle automatique. Partagez le lien pour inviter des participants.</p>
            </div>

            {/* Action buttons */}
            <div className="grid sm:grid-cols-2 gap-3">
              <Button
                variant="hero"
                size="lg"
                className="gap-2 w-full"
                onClick={() => startCall(false)}
              >
                <Video className="w-5 h-5" />
                Appel Vidéo
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 w-full"
                onClick={() => startCall(true)}
              >
                <Phone className="w-5 h-5" />
                Appel Audio
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/30">
              {[
                { icon: "🎥", label: "Vidéo HD" },
                { icon: "🎤", label: "Audio clair" },
                { icon: "💬", label: "Chat intégré" },
                { icon: "🖥️", label: "Partage d'écran" },
              ].map((f) => (
                <div key={f.label} className="text-center p-3 rounded-xl bg-secondary/50">
                  <span className="text-2xl block mb-1">{f.icon}</span>
                  <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="mt-6 bg-card rounded-2xl border border-border/50 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold text-foreground">Comment ça marche ?</h2>
            </div>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">1</span>
                <span>Cliquez sur <strong>Appel Vidéo</strong> ou <strong>Appel Audio</strong> pour démarrer la conférence.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">2</span>
                <span>Copiez le lien de la salle et partagez-le avec les participants.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">3</span>
                <span>Les participants cliquent sur le lien et rejoignent la conférence directement.</span>
              </li>
            </ol>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default Conference;
