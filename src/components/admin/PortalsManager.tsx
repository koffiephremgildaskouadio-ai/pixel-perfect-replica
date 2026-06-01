import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Edit, Save, X, ExternalLink, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type Portal = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  color: string | null;
  logo_url: string | null;
  cover_url: string | null;
  member_ids: string[];
  custom_links: { label: string; url: string }[];
  is_published: boolean;
};

type Member = { id: string; nom: string; prenoms: string };

const blank: Omit<Portal, "id"> = {
  slug: "",
  title: "",
  subtitle: "",
  description: "",
  color: "#15803d",
  logo_url: "",
  cover_url: "",
  member_ids: [],
  custom_links: [],
  is_published: true,
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const PortalsManager = () => {
  const [portals, setPortals] = useState<Portal[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Portal | (Omit<Portal, "id"> & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: m }] = await Promise.all([
      supabase.from("portals" as any).select("*").order("display_order"),
      supabase.from("members").select("id,nom,prenoms").order("nom"),
    ]);
    setPortals((p as any[]) ?? []);
    setMembers((m as Member[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.title || !editing.slug) {
      toast.error("Titre et slug obligatoires");
      return;
    }
    setSaving(true);
    const payload = {
      slug: editing.slug,
      title: editing.title,
      subtitle: editing.subtitle,
      description: editing.description,
      color: editing.color,
      logo_url: editing.logo_url,
      cover_url: editing.cover_url,
      member_ids: editing.member_ids,
      custom_links: editing.custom_links,
      is_published: editing.is_published,
    };
    const { error } = editing.id
      ? await supabase.from("portals" as any).update(payload).eq("id", editing.id)
      : await supabase.from("portals" as any).insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing.id ? "Portail mis à jour" : "Portail créé");
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce portail ?")) return;
    const { error } = await supabase.from("portals" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Supprimé");
    load();
  };

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Portails ({portals.length})</h3>
        <Button onClick={() => setEditing({ ...blank })} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Nouveau portail
        </Button>
      </div>

      <div className="space-y-2">
        {portals.map((p) => (
          <div key={p.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
            {p.logo_url ? (
              <img src={p.logo_url} alt="" className="w-10 h-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 rounded" style={{ backgroundColor: p.color || "#15803d" }} />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate flex items-center gap-2">
                {p.title}
                {!p.is_published && <EyeOff className="w-3 h-3 text-muted-foreground" />}
              </p>
              <p className="text-xs text-muted-foreground truncate">/portail/{p.slug} · {p.member_ids?.length || 0} membres</p>
            </div>
            <Link to={`/portail/${p.slug}`} target="_blank">
              <Button variant="ghost" size="icon"><ExternalLink className="w-4 h-4" /></Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setEditing(p)}><Edit className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
          </div>
        ))}
        {portals.length === 0 && (
          <p className="text-center text-muted-foreground py-6 text-sm">Aucun portail. Créez-en un pour commencer.</p>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-auto" onClick={() => setEditing(null)}>
          <div className="bg-card rounded-xl p-5 max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">{editing.id ? "Modifier" : "Créer"} le portail</h3>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Titre *</label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs font-medium">Slug (URL) *</label>
                <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} />
                <p className="text-[10px] text-muted-foreground mt-0.5">/portail/{editing.slug || "..."}</p>
              </div>
              <div>
                <label className="text-xs font-medium">Sous-titre</label>
                <Input value={editing.subtitle ?? ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium">Description</label>
                <Textarea rows={4} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Couleur</label>
                  <Input type="color" value={editing.color ?? "#15803d"} onChange={(e) => setEditing({ ...editing, color: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium">Logo URL</label>
                  <Input value={editing.logo_url ?? ""} onChange={(e) => setEditing({ ...editing, logo_url: e.target.value })} placeholder="https://..." />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Image de couverture (URL)</label>
                <Input value={editing.cover_url ?? ""} onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs font-medium">Membres associés ({editing.member_ids.length})</label>
                <div className="max-h-40 overflow-auto border rounded p-2 space-y-1">
                  {members.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={editing.member_ids.includes(m.id)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...editing.member_ids, m.id]
                            : editing.member_ids.filter((x) => x !== m.id);
                          setEditing({ ...editing, member_ids: next });
                        }}
                      />
                      {m.nom} {m.prenoms}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Liens personnalisés</label>
                {editing.custom_links.map((l, i) => (
                  <div key={i} className="flex gap-2 mt-1">
                    <Input placeholder="Libellé" value={l.label} onChange={(e) => {
                      const next = [...editing.custom_links];
                      next[i] = { ...next[i], label: e.target.value };
                      setEditing({ ...editing, custom_links: next });
                    }} />
                    <Input placeholder="https://..." value={l.url} onChange={(e) => {
                      const next = [...editing.custom_links];
                      next[i] = { ...next[i], url: e.target.value };
                      setEditing({ ...editing, custom_links: next });
                    }} />
                    <Button variant="ghost" size="icon" onClick={() => setEditing({ ...editing, custom_links: editing.custom_links.filter((_, j) => j !== i) })}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setEditing({ ...editing, custom_links: [...editing.custom_links, { label: "", url: "" }] })}>
                  <Plus className="w-3 h-3 mr-1" /> Ajouter un lien
                </Button>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_published} onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} />
                Publié (visible par tous)
              </label>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  Enregistrer
                </Button>
                <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
