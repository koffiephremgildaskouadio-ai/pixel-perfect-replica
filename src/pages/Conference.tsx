import { useState, useEffect } from "react";
import { PortalNav } from "@/components/PortalNav";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Video, Phone, Users, Copy, Check,
  Sparkles, ShieldCheck, ExternalLink, MessageCircle, Share2, X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { conferenceInvitationUrl, conferenceMeetingUrl } from "@/lib/conference";
import { supabase } from "@/integrations/supabase/client";

const Conference = () => {
  const [roomName, setRoomName] = useState("");
  const [userName, setUserName] = useState("");
  const [inCall, setInCall] = useState(false);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [audioOnly, setAudioOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return;
      const meta = data.user.user_metadata;
      setUserName(`${meta?.nom || ""} ${meta?.prenoms || ""}`.trim() || "Membre Novalim");
    });
    const room = new URLSearchParams(window.location.search).get("room");
    if (room) setRoomName(room);
    return () => { cancelled = true; };
  }, []);

  const openMeeting = (room: string, audio: boolean) => {
    const popup = window.open(conferenceMeetingUrl(room, audio, userName), "novalim-conference");
    if (!popup) { toast.error("Autorisez l’ouverture d’un nouvel onglet pour rejoindre la conférence."); return false; }
    popup.opener = null;
    return true;
  };

  const startCall = (audio = false) => {
    const room = roomName.trim() || `novalim-${crypto.randomUUID()}`;
    if (!openMeeting(room, audio)) return;
    setRoomName(room);
    setAudioOnly(audio);
    setActiveRoom(room);
    setInCall(true);
  };

  const buildLink = (room: string) => conferenceInvitationUrl(window.location.origin, room);

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
            <code className="bg-primary-foreground/10 px-2 py-0.5 rounded truncate flex-1 min-w-0">
              {buildLink(activeRoom)}
            </code>
            <Button size="sm" variant="secondary" className="h-7 gap-1" onClick={() => copyLink(activeRoom)}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              Copier
            </Button>
            <Button size="sm" variant="secondary" className="h-7 gap-1" onClick={() => shareLink(activeRoom)}>
              <Share2 className="w-3.5 h-3.5" /> Partager
            </Button>
            <Button size="icon" variant="secondary" aria-label="Retour à la préparation" title="Retour à la préparation" className="h-7 w-7" onClick={() => { setInCall(false); setActiveRoom(null); }}><X /></Button>
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-5">
          <Video className="h-14 w-14 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Votre salle de conférence</h1>
          <p className="text-muted-foreground max-w-lg">La salle s’ouvre dans un autre onglet. Rejoignez-la pour activer votre micro et votre caméra.</p>
          <p className="text-sm font-medium break-all">{activeRoom}</p>
          {activeRoom && <Button size="lg" onClick={() => openMeeting(activeRoom, audioOnly)}><ExternalLink /> Ouvrir la salle</Button>}
          <Button variant="outline" onClick={() => { setInCall(false); setActiveRoom(null); }}>Retour</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-secondary/30 to-background">
      <PortalNav activeSlug="conference" />
      <div className="container max-w-3xl py-10 lg:py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>

        <ScrollReveal className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
            <Video className="w-3.5 h-3.5" /> Réunions audio & vidéo · Gratuit
          </span>
          <h1 className="mt-4 text-3xl lg:text-4xl font-display font-bold text-foreground">
            Salle de Conférence Novalim
          </h1>
          <p className="mt-3 text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Ouvrez votre visioconférence dans un nouvel onglet. Le lien d'invitation sera généré
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

            <p className="text-xs text-muted-foreground">La durée et la disponibilité dépendent du service de conférence externe.</p>
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
                { icon: ExternalLink, label: "Salle dédiée" },
                { icon: ShieldCheck, label: "Chiffré & sécurisé" },
                { icon: MessageCircle, label: "Chat & emojis" },
                { icon: Users, label: "Réunion de groupe" },
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
                "Cliquez sur Démarrer Vidéo ou Démarrer Audio pour ouvrir la salle dans un nouvel onglet.",
                "Une fois en salle, le lien d'invitation s'affiche en haut de l'écran.",
                "Cliquez sur Copier ou Partager pour inviter d'autres membres (WhatsApp, e-mail…).",
                "Les invités ouvrent le lien puis cliquent sur Démarrer pour rejoindre la même salle.",
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
