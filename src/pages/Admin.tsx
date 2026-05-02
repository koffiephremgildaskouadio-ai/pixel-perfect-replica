import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  ArrowLeft, Plus, Newspaper, Loader2, Trash2,
  Users, Edit, X, Image as ImageIcon, Video as VideoIcon,
  FileText, Save,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

type MediaItem = { type: "image" | "video"; url: string };

const Admin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/connexion"); return; }
      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", session.user.id);
      const ok = roles?.some(r => ["admin", "moderator"].includes(r.role));
      if (!ok) { toast.error("Accès refusé"); navigate("/"); return; }
      setIsAdmin(true);
    })();
  }, [navigate]);

  if (isAdmin === null) {
    return <div className="pt-20 text-center">
      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
    </div>;
  }

  return (
    <div className="pt-16">
      <section className="py-8 lg:py-12 bg-secondary/50">
        <div className="container">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <ScrollReveal className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">Administration</span>
            <h1 className="mt-2 text-2xl lg:text-4xl font-display font-bold text-foreground">
              Espace Super-Administrateur
            </h1>
            <p className="mt-2 text-muted-foreground text-sm">
              Gérez les membres, publiez actualités avec images & vidéos.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-8 lg:py-12">
        <div className="container max-w-4xl">
          <Tabs defaultValue="news">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="news"><Newspaper className="w-4 h-4 mr-2" /> Actualités</TabsTrigger>
              <TabsTrigger value="members"><Users className="w-4 h-4 mr-2" /> Membres</TabsTrigger>
              <TabsTrigger value="about"><FileText className="w-4 h-4 mr-2" /> À Propos</TabsTrigger>
            </TabsList>
            <TabsContent value="news"><NewsManager queryClient={queryClient} /></TabsContent>
            <TabsContent value="members"><MembersManager queryClient={queryClient} /></TabsContent>
            <TabsContent value="about"><AboutManager /></TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

/* ============================================================ */
/* NEWS MANAGER with multi-media                                 */
/* ============================================================ */
const NewsManager = ({ queryClient }: { queryClient: any }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("event");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const { data: articles } = useQuery({
    queryKey: ["admin-actualites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("actualites").select("*")
        .order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data;
    },
  });

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const newItems: MediaItem[] = [];
      for (const file of files) {
        const isVideo = file.type.startsWith("video/");
        const ext = file.name.split(".").pop();
        const path = `actualites/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from("member-photos").upload(path, file);
        if (error) { toast.error(`Échec upload ${file.name}`); continue; }
        const { data: u } = supabase.storage.from("member-photos").getPublicUrl(path);
        newItems.push({ type: isVideo ? "video" : "image", url: u.publicUrl });
      }
      setMedia(prev => [...prev, ...newItems]);
      toast.success(`${newItems.length} fichier(s) ajouté(s)`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeMedia = (i: number) => setMedia(prev => prev.filter((_, idx) => idx !== i));

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { toast.error("Titre et contenu requis"); return; }
    setPublishing(true);
    try {
      const firstImage = media.find(m => m.type === "image")?.url ?? null;
      const { error } = await supabase.from("actualites").insert({
        title: title.trim(), content: content.trim(), type,
        source: "Administration", image_url: firstImage, media: media as any,
      });
      if (error) throw error;
      toast.success("Actualité publiée !");
      setTitle(""); setContent(""); setMedia([]);
      queryClient.invalidateQueries({ queryKey: ["admin-actualites"] });
      queryClient.invalidateQueries({ queryKey: ["actualites"] });
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette actualité ?")) return;
    const { error } = await supabase.from("actualites").delete().eq("id", id);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Supprimé");
    queryClient.invalidateQueries({ queryKey: ["admin-actualites"] });
    queryClient.invalidateQueries({ queryKey: ["actualites"] });
  };

  return (
    <>
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" /> Nouvelle publication
        </h2>
        <form onSubmit={handlePublish} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="event">Événement</option>
              <option value="ccjy">CCJY</option>
              <option value="mairie">Mairie</option>
              <option value="ministry">Min. Jeunesse</option>
              <option value="ai_daily">Info du jour</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Titre</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Contenu</label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} rows={6} required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Images & vidéos (plusieurs possibles)
            </label>
            <input type="file" accept="image/*,video/*" multiple onChange={handleFiles}
              disabled={uploading} className="text-sm" />
            {uploading && <p className="text-xs text-muted-foreground mt-1">Téléversement…</p>}
            {media.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {media.map((m, i) => (
                  <div key={i} className="relative rounded-lg border overflow-hidden bg-secondary">
                    {m.type === "image"
                      ? <img src={m.url} className="w-full h-24 object-cover" alt="" />
                      : <video src={m.url} className="w-full h-24 object-cover" />
                    }
                    <button type="button" onClick={() => removeMedia(i)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1">
                      <X className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded uppercase">
                      {m.type === "video" ? <VideoIcon className="w-2.5 h-2.5 inline" /> : "img"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button type="submit" disabled={publishing} className="w-full gap-2">
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Newspaper className="w-4 h-4" />}
            {publishing ? "Publication…" : "Publier"}
          </Button>
        </form>
      </div>

      <h2 className="text-lg font-display font-bold mb-4">Publications récentes</h2>
      <div className="space-y-3">
        {articles?.map((a: any) => (
          <div key={a.id} className="p-4 rounded-xl bg-card border border-border/50 flex items-start gap-4">
            {a.image_url && <img src={a.image_url} className="w-16 h-16 rounded-lg object-cover shrink-0" alt="" />}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold truncate">{a.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(a.created_at), "d MMM yyyy HH:mm", { locale: fr })}
                {Array.isArray(a.media) && a.media.length > 0 && ` · ${a.media.length} média`}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} className="text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </>
  );
};

/* ============================================================ */
/* MEMBERS MANAGER (CRUD)                                        */
/* ============================================================ */
const MembersManager = ({ queryClient }: { queryClient: any }) => {
  const { data: members } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("members").select("*").order("member_number");
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer définitivement ${name} ?`)) return;
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Membre supprimé");
    queryClient.invalidateQueries({ queryKey: ["admin-members"] });
    queryClient.invalidateQueries({ queryKey: ["bureau-members"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-display font-bold">Liste des membres ({members?.length ?? 0})</h2>
        <MemberFormDialog mode="create" queryClient={queryClient} />
      </div>
      <div className="space-y-2">
        {members?.map((m: any) => (
          <div key={m.id} className="p-3 rounded-xl bg-card border border-border/50 flex items-center gap-3">
            {m.photo_url
              ? <img src={m.photo_url} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />
              : <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  {m.nom?.[0]}{m.prenoms?.[0]}
                </div>}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{m.nom} {m.prenoms}</p>
              <p className="text-xs text-muted-foreground truncate">
                {m.member_number} · {m.category} {m.poste && `· ${m.poste}`}
              </p>
            </div>
            <MemberFormDialog mode="edit" member={m} queryClient={queryClient} />
            <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id, `${m.nom} ${m.prenoms}`)}
              className="text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

const MemberFormDialog = ({
  mode, member, queryClient,
}: { mode: "create" | "edit"; member?: any; queryClient: any }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    member_number: member?.member_number ?? "",
    nom: member?.nom ?? "",
    prenoms: member?.prenoms ?? "",
    poste: member?.poste ?? "",
    category: member?.category ?? "membre",
    phone: member?.phone ?? "",
    quartier: member?.quartier ?? "",
    cahier_charges: member?.cahier_charges ?? "",
    photo_url: member?.photo_url ?? "",
    is_active: member?.is_active ?? true,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const upload = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `members/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("member-photos").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("member-photos").getPublicUrl(path).data.publicUrl;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let photo_url = form.photo_url;
      if (photoFile) photo_url = await upload(photoFile);

      // Auto-generate member_number on create if missing
      let member_number = form.member_number.trim();
      if (mode === "create" && !member_number) {
        const { data: existing } = await supabase.from("members").select("member_number");
        const max = (existing ?? []).reduce((acc: number, r: any) => {
          const m = r.member_number?.match(/(\d+)$/);
          return Math.max(acc, m ? parseInt(m[1]) : 0);
        }, 100);
        member_number = `NCV-2025-${String(max + 1).padStart(3, "0")}`;
      }

      const payload = { ...form, photo_url, member_number };

      if (mode === "create") {
        const { error } = await supabase.from("members").insert(payload);
        if (error) throw error;
        toast.success("Membre créé");
      } else {
        const { error } = await supabase.from("members").update(payload).eq("id", member.id);
        if (error) throw error;
        toast.success("Membre mis à jour");
      }
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      queryClient.invalidateQueries({ queryKey: ["bureau-members"] });
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create"
          ? <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Ajouter</Button>
          : <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nouveau membre" : "Modifier le membre"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium block mb-1">Nom *</label>
              <Input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Prénom(s) *</label>
              <Input value={form.prenoms} onChange={e => setForm({ ...form, prenoms: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Fonction / Poste</label>
            <Textarea value={form.poste} onChange={e => setForm({ ...form, poste: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium block mb-1">Catégorie</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="bureau">Bureau Exécutif</option>
                <option value="cabinet">Cabinet</option>
                <option value="coordonnateur">Coordonnateur</option>
                <option value="commission">Commission</option>
                <option value="membre">Membre</option>
                <option value="partenaire">Partenaire</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">N° membre</label>
              <Input value={form.member_number} onChange={e => setForm({ ...form, member_number: e.target.value })}
                placeholder="auto" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium block mb-1">Téléphone</label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Quartier / Cité</label>
              <Input value={form.quartier} onChange={e => setForm({ ...form, quartier: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Cahier de charges</label>
            <Textarea value={form.cahier_charges} onChange={e => setForm({ ...form, cahier_charges: e.target.value })} rows={3} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Photo</label>
            <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] ?? null)} className="text-xs" />
            {form.photo_url && !photoFile && (
              <img src={form.photo_url} className="mt-2 w-16 h-16 rounded object-cover" alt="" />
            )}
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={form.is_active}
              onChange={e => setForm({ ...form, is_active: e.target.checked })} />
            Actif
          </label>
          <Button type="submit" disabled={saving} className="w-full gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "create" ? "Créer" : "Mettre à jour"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================ */
/* ABOUT MANAGER — editable site_content blocks                  */
/* ============================================================ */
const DEFAULT_BLOCKS = [
  { key: "apropos.hero", label: "Hero — Titre principal" },
  { key: "apropos.president_intro", label: "Présentation du Président / CCJY" },
  { key: "apropos.assim_saba", label: "Bloc M. Assim Saba (Président CCJY)" },
  { key: "apropos.ben_mamadie", label: "Bloc Hon. Ben Mamadie" },
  { key: "apropos.sanusi", label: "Bloc M. Sanusi Ibrahim" },
  { key: "apropos.parrain", label: "Bloc Parrain — Abiola Waidi / Jumbo Store" },
  { key: "apropos.identity", label: "Identité du district" },
];

const AboutManager = () => {
  const queryClient = useQueryClient();
  const { data: blocks } = useQuery({
    queryKey: ["site-content"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("site_content").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const get = (key: string) => (blocks ?? []).find((b: any) => b.key === key);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm">
        <p className="font-semibold text-primary mb-1">Édition libre de la page À Propos</p>
        <p className="text-muted-foreground text-xs">
          Modifiez le titre, le texte ou l'image de chaque bloc. Les changements sont visibles immédiatement sur la page publique.
        </p>
      </div>
      {DEFAULT_BLOCKS.map(b => (
        <BlockEditor key={b.key} blockKey={b.key} label={b.label} existing={get(b.key)} queryClient={queryClient} />
      ))}
    </div>
  );
};

const BlockEditor = ({
  blockKey, label, existing, queryClient,
}: { blockKey: string; label: string; existing?: any; queryClient: any }) => {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [content, setContent] = useState(existing?.content ?? "");
  const [imageUrl, setImageUrl] = useState(existing?.image_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(existing?.title ?? "");
    setContent(existing?.content ?? "");
    setImageUrl(existing?.image_url ?? "");
  }, [existing?.id]);

  const save = async () => {
    setSaving(true);
    try {
      let img = imageUrl;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `site/${blockKey}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("member-photos").upload(path, file);
        if (upErr) throw upErr;
        img = supabase.storage.from("member-photos").getPublicUrl(path).data.publicUrl;
      }
      const payload = { key: blockKey, title, content, image_url: img };
      const { error } = await (supabase as any).from("site_content").upsert(payload, { onConflict: "key" });
      if (error) throw error;
      toast.success("Bloc enregistré");
      queryClient.invalidateQueries({ queryKey: ["site-content"] });
      setFile(null);
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl bg-card border border-border/50 p-4 space-y-3">
      <h3 className="text-sm font-display font-bold text-foreground">{label}</h3>
      <div>
        <label className="text-xs font-medium block mb-1">Titre</label>
        <Input value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="text-xs font-medium block mb-1">Contenu</label>
        <Textarea value={content} onChange={e => setContent(e.target.value)} rows={5} />
      </div>
      <div>
        <label className="text-xs font-medium block mb-1">Image (optionnelle)</label>
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} className="text-xs" />
        {imageUrl && !file && (
          <img src={imageUrl} className="mt-2 w-24 h-24 rounded object-cover" alt="" />
        )}
      </div>
      <Button onClick={save} disabled={saving} size="sm" className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Enregistrer
      </Button>
    </div>
  );
};

export default Admin;
