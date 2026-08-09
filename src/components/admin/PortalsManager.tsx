import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, Plus, Trash2, Edit, Save, X, ExternalLink, EyeOff, Eye,
  ArrowUp, ArrowDown, Upload, Link2, Menu as MenuIcon,
} from "lucide-react";
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
  external_url: string | null;
  show_in_menu: boolean;
  member_ids: string[];
  custom_links: { label: string; url: string }[];
  is_published: boolean;
  display_order: number;
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
  external_url: "",
  show_in_menu: true,
  member_ids: [],
  custom_links: [],
  is_published: true,
  display_order: 0,
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const PortalsManager = () => {
  const [portals, setPortals] = useState<Portal[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(Omit<Portal, "id"> & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: m }] = await Promise.all([
      supabase.from("portals" as any).select("*").order("display_order"),
      supabase.from("members_public").select("id,nom,prenoms").order("nom"),
    ]);
    setPortals(((p as any[]) ?? []).map((x) => ({ ...x, show_in_menu: x.show_in_menu ?? true })));
    setMembers((m as Member[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const uploadImage = async (file: File, kind: "logo" | "cover") => {
    if (!editing) return;
    setUploading(kind);
    const path = `portals/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from("member-photos").upload(path, file, { upsert: true });
    setUploading(null);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("member-photos").getPublicUrl(path);
    setEditing((prev) => prev && ({ ...prev, [kind === "logo" ? "logo_url" : "cover_url"]: data.publicUrl }));
    toast.success("Image téléversée");
  };

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
      external_url: editing.external_url || null,
      show_in_menu: editing.show_in_menu,
      member_ids: editing.member_ids,
      custom_links: editing.custom_links,
      is_published: editing.is_published,
      display_order: editing.display_order ?? portals.length,
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

  const togglePublished = async (p: Portal) => {
    const { error } = await supabase.from("portals" as any)
      .update({ is_published: !p.is_published }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(p.is_published ? "Portail désactivé" : "Portail activé");
    load();
  };

  const toggleMenu = async (p: Portal) => {
    const { error } = await supabase.from("portals" as any)
      .update({ show_in_menu: !p.show_in_menu }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(p.show_in_menu ? "Retiré du menu" : "Ajouté au menu");
    load();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= portals.length) return;
    const a = portals[index], b = portals[target];
    await Promise.all([
      supabase.from("portals" as any).update({ display_order: target }).eq("id", a.id),
      supabase.from("portals" as any).update({ display_order: index }).eq("id", b.id),
    ]);
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
        <Button onClick={() => setEditing({ ...blank, display_order: portals.length })} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Nouveau portail
        </Button>
      </div>

      <div className="space-y-2">
        {portals.map((p, i) => (
          <div key={p.id} className={`bg-card border border-border rounded-lg p-3 flex items-center gap-3 ${!p.is_published ? "opacity-60" : ""}`}>
            {p.logo_url ? (
              <img src={p.logo_url} alt="" className="w-10 h-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 rounded" style={{ backgroundColor: p.color || "#15803d" }} />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate flex items-center gap-2">
                {p.title}
                {!p.is_published && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">désactivé</span>}
                {p.external_url && <Link2 className="w-3 h-3 text-accent" />}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {p.external_url || `/portail/${p.slug}`} · {p.member_ids?.length || 0} membres · {p.show_in_menu ? "dans le menu" : "hors menu"}
              </p>
            </div>
            <div className="flex flex-col">
              <button onClick={() => move(i, -1)} className="p-0.5 text-muted-foreground hover:text-foreground" aria-label="Monter"><ArrowUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => move(i, 1)} className="p-0.5 text-muted-foreground hover:text-foreground" aria-label="Descendre"><ArrowDown className="w-3.5 h-3.5" /></button>
            </div>
            <Button variant="ghost" size="icon" onClick={() => toggleMenu(p)} title="Afficher dans le menu">
              <MenuIcon className={`w-4 h-4 ${p.show_in_menu ? "text-primary" : "text-muted-foreground"}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => togglePublished(p)} title={p.is_published ? "Désactiver" : "Activer"}>
              {p.is_published ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
            </Button>
            <Link to={p.external_url || `/portail/${p.slug}`} target="_blank">
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
                <label className="text-xs font-medium">Lien externe (optionnel)</label>
                <Input value={editing.external_url ?? ""} onChange={(e) => setEditing({ ...editing, external_url: e.target.value })} placeholder="https://..." />
                <p className="text-[10px] text-muted-foreground mt-0.5">Si renseigné, le portail ouvre ce lien au lieu de sa page interne.</p>
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
                  <label className="text-xs font-medium">Ordre d'affichage</label>
                  <Input type="number" value={editing.display_order ?? 0} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Logo</label>
                  <Input value={editing.logo_url ?? ""} onChange={(e) => setEditing({ ...editing, logo_url: e.target.value })} placeholder="https://..." />
                  <input ref={logoInput} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "logo")} />
                  <Button variant="outline" size="sm" className="mt-1" onClick={() => logoInput.current?.click()} disabled={uploading === "logo"}>
                    {uploading === "logo" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />} Téléverser
                  </Button>
                  {editing.logo_url && <img src={editing.logo_url} alt="" className="mt-2 w-16 h-16 rounded object-cover border border-border" />}
                </div>
                <div>
                  <label className="text-xs font-medium">Image de couverture</label>
                  <Input value={editing.cover_url ?? ""} onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })} placeholder="https://..." />
                  <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "cover")} />
                  <Button variant="outline" size="sm" className="mt-1" onClick={() => coverInput.current?.click()} disabled={uploading === "cover"}>
                    {uploading === "cover" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />} Téléverser
                  </Button>
                  {editing.cover_url && <img src={editing.cover_url} alt="" className="mt-2 w-full h-16 rounded object-cover border border-border" />}
                </div>
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
                <label className="text-xs font-medium">Liens personnalisés (menus du portail)</label>
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
                Activé (visible par tous)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.show_in_menu} onChange={(e) => setEditing({ ...editing, show_in_menu: e.target.checked })} />
                Afficher dans le menu des portails
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
