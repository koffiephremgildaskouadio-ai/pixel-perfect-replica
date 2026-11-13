import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PenLine, Loader2 } from "lucide-react";

/** Formulaire de publication réservé aux membres du bureau et aux administrateurs. */
export const BureauPublish = () => {
  const [allowed, setAllowed] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id;
      if (!uid) return;
      const [{ data: editor }, { data: roles }] = await Promise.all([
        supabase.rpc("is_bureau_editor", { _user_id: uid }),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);
      setAllowed(!!editor || !!roles?.some((r) => ["super_admin", "moderator"].includes(r.role)));
    });
  }, []);

  if (!allowed) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3 || content.trim().length < 10) { toast.error("Ajoutez un titre et un texte."); return; }
    setSaving(true);
    const { error } = await supabase.from("actualites").insert({ title: title.trim().slice(0, 200), content: content.trim().slice(0, 10000), source: "bureau", type: "event" });
    setSaving(false);
    if (error) { toast.error("Publication impossible."); return; }
    toast.success("Publication en ligne.");
    setTitle(""); setContent(""); setOpen(false);
    qc.invalidateQueries({ queryKey: ["actualites"] });
  };

  if (!open) return <Button onClick={() => setOpen(true)} className="rounded-full"><PenLine className="w-4 h-4 mr-2" />Publier une actualité</Button>;
  return (
    <form onSubmit={submit} className="rounded-3xl border bg-card p-5 space-y-3">
      <Input placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
      <Textarea placeholder="Votre message…" rows={6} value={content} onChange={(e) => setContent(e.target.value)} maxLength={10000} />
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
        <Button type="submit" disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Publier</Button>
      </div>
    </form>
  );
};
