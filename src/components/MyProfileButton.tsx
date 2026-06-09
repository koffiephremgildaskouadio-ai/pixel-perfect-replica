import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserCog, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const MyProfileButton = ({ variant = "ghost", showLabel = true }: { variant?: any; showLabel?: boolean }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [member, setMember] = useState<any>(null);
  const [form, setForm] = useState({
    bio: "", email: "", phone: "", facebook: "", linkedin: "", whatsapp: "", skills: "",
  });

  const normalize = (s: string) =>
    (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

  const load = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    let { data } = await supabase
      .from("members")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    // Fallback: match by profile name (accent-insensitive) and auto-link
    if (!data) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("nom, prenoms")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile?.nom) {
        const { data: candidates } = await supabase
          .from("members")
          .select("*")
          .is("user_id", null);
        const target = `${normalize(profile.nom)} ${normalize(profile.prenoms || "")}`.trim();
        const match = (candidates || []).find((m: any) => {
          const full = `${normalize(m.nom)} ${normalize(m.prenoms || "")}`.trim();
          return full === target || full.startsWith(target) || target.startsWith(full);
        });
        if (match) {
          const { data: linked } = await supabase
            .from("members")
            .update({ user_id: session.user.id })
            .eq("id", match.id)
            .select("*")
            .maybeSingle();
          data = linked || match;
        }
      }
    }

    if (data) {
      setMember(data);
      setForm({
        bio: data.bio || "",
        email: data.email || session.user.email || "",
        phone: data.phone || "",
        facebook: data.facebook || "",
        linkedin: data.linkedin || "",
        whatsapp: data.whatsapp || "",
        skills: (data.skills || []).join(", "),
      });
    } else {
      setMember(null);
      setForm((f) => ({ ...f, email: session.user.email || "" }));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const save = async () => {
    if (!member) {
      toast.error("Votre compte n'est pas encore relié à une fiche membre. Demandez au Super-Admin.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("members")
      .update({
        bio: form.bio || null,
        email: form.email || null,
        phone: form.phone || null,
        facebook: form.facebook || null,
        linkedin: form.linkedin || null,
        whatsapp: form.whatsapp || null,
        skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : null,
      })
      .eq("id", member.id);
    setSaving(false);
    if (error) { toast.error("Erreur : " + error.message); return; }
    toast.success("Profil mis à jour ✅");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm" className="gap-2">
          <UserCog className="w-4 h-4" />
          {showLabel && <span className="hidden sm:inline">Mon profil</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mon profil</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : !member ? (
          <div className="text-sm text-muted-foreground p-4 rounded-lg bg-muted">
            Votre compte n'est pas encore relié à une fiche membre du district.
            Veuillez contacter le Super-Administrateur (Président) pour qu'il vous ajoute au répertoire.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Fiche : <span className="font-semibold text-foreground">{member.nom} {member.prenoms}</span> — {member.member_number}
            </div>
            <div>
              <Label>Présentation (bio)</Label>
              <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Parlez de vous en quelques mots..." />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Téléphone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+225..." /></div>
              <div><Label>Facebook</Label><Input value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} placeholder="https://..." /></div>
              <div className="col-span-2"><Label>LinkedIn</Label><Input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} placeholder="https://..." /></div>
              <div className="col-span-2"><Label>Compétences (séparées par virgules)</Label><Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Communication, Gestion de projet..." /></div>
            </div>
            <Button onClick={save} disabled={saving} className="w-full">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Enregistrer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
