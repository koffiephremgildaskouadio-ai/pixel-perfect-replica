import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserCog, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const MyProfileEditor = ({ member, onSaved }: { member: any; onSaved?: () => void }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bio: "",
    email: "",
    phone: "",
    facebook: "",
    linkedin: "",
    whatsapp: "",
    skills: "",
  });

  useEffect(() => {
    if (member) {
      setForm({
        bio: member.bio || "",
        email: member.email || "",
        phone: member.phone || "",
        facebook: member.facebook || "",
        linkedin: member.linkedin || "",
        whatsapp: member.whatsapp || "",
        skills: (member.skills || []).join(", "),
      });
    }
  }, [member]);

  const save = async () => {
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
    if (error) {
      toast.error("Erreur : " + error.message);
      return;
    }
    toast.success("Profil mis à jour ✅");
    setOpen(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserCog className="w-4 h-4" /> Compléter mon profil
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mon profil enrichi</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Présentation (bio)</Label>
            <Textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Parlez de vous en quelques mots..."
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+225..." />
            </div>
            <div>
              <Label>Facebook</Label>
              <Input value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} placeholder="https://..." />
            </div>
            <div className="col-span-2">
              <Label>LinkedIn</Label>
              <Input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} placeholder="https://..." />
            </div>
            <div className="col-span-2">
              <Label>Compétences (séparées par virgules)</Label>
              <Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Communication, Gestion de projet..." />
            </div>
          </div>
          <Button onClick={save} disabled={saving} className="w-full">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
