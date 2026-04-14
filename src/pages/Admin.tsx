import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ArrowLeft, Plus, Newspaper, Image, Loader2, Trash2, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Admin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("event");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/connexion"); return; }
      
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      
      const hasAccess = roles?.some(r => ["admin", "moderator"].includes(r.role));
      if (!hasAccess) { toast.error("Accès refusé"); navigate("/"); return; }
      setIsAdmin(true);
    };
    checkAccess();
  }, [navigate]);

  const { data: articles } = useQuery({
    queryKey: ["admin-actualites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("actualites").select("*").order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { toast.error("Titre et contenu requis"); return; }
    setIsPublishing(true);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `actualites/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("member-photos").upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("member-photos").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("actualites").insert({
        title: title.trim(),
        content: content.trim(),
        type,
        source: "Administration",
        image_url: imageUrl,
      });
      if (error) throw error;

      toast.success("Actualité publiée !");
      setTitle(""); setContent(""); setImageFile(null); setImagePreview(null);
      queryClient.invalidateQueries({ queryKey: ["admin-actualites"] });
      queryClient.invalidateQueries({ queryKey: ["actualites"] });
    } catch (err: any) {
      toast.error(err.message || "Erreur de publication");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette actualité ?")) return;
    const { error } = await supabase.from("actualites").delete().eq("id", id);
    if (error) { toast.error("Erreur de suppression"); return; }
    toast.success("Supprimé");
    queryClient.invalidateQueries({ queryKey: ["admin-actualites"] });
  };

  if (isAdmin === null) return <div className="pt-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="pt-16">
      <section className="py-8 lg:py-12 bg-secondary/50">
        <div className="container">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <ScrollReveal className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">Administration</span>
            <h1 className="mt-2 text-2xl lg:text-4xl font-display font-bold text-foreground">
              Espace Administrateur
            </h1>
            <p className="mt-2 text-muted-foreground text-sm">Publiez des actualités avec images directement sur la plateforme.</p>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-8 lg:py-12">
        <div className="container max-w-3xl">
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 mb-8">
            <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Nouvelle publication
            </h2>
            <form onSubmit={handlePublish} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Type</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="event">Événement</option>
                  <option value="ccjy">CCJY</option>
                  <option value="mairie">Mairie</option>
                  <option value="ministry">Min. Jeunesse</option>
                  <option value="ai_daily">Info du jour</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Titre</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre de l'actualité" required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Contenu</label>
                <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Contenu détaillé..." rows={6} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block flex items-center gap-2">
                  <Image className="w-4 h-4" /> Image (optionnel)
                </label>
                <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm" />
                {imagePreview && (
                  <img src={imagePreview} alt="Aperçu" className="mt-2 w-40 h-28 object-cover rounded-lg border" />
                )}
              </div>
              <Button type="submit" disabled={isPublishing} className="w-full gap-2">
                {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Newspaper className="w-4 h-4" />}
                {isPublishing ? "Publication..." : "Publier"}
              </Button>
            </form>
          </div>

          <h2 className="text-lg font-display font-bold text-foreground mb-4">Publications récentes</h2>
          <div className="space-y-3">
            {articles?.map(a => (
              <div key={a.id} className="p-4 rounded-xl bg-card border border-border/50 flex items-start gap-4">
                {a.image_url && (
                  <img src={a.image_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{a.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(a.created_at), "d MMM yyyy HH:mm", { locale: fr })}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Admin;
