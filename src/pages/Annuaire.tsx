import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, Plus, Building2, Cross, Moon, UtensilsCrossed, Car, GraduationCap, Briefcase, Heart, Store, Loader2, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";

const CATEGORIES = [
  { value: "sanitaire", label: "Sanitaire (Cliniques & Pharmacies)", icon: Heart },
  { value: "eglise", label: "Églises", icon: Cross },
  { value: "mosquee", label: "Mosquées", icon: Moon },
  { value: "restaurant", label: "Restaurants", icon: UtensilsCrossed },
  { value: "maquis", label: "Maquis, Bars & Buvettes", icon: Store },
  { value: "lavage", label: "Lavages Autos", icon: Car },
  { value: "entreprise", label: "Entreprises", icon: Building2 },
  { value: "ecole", label: "Établissements Scolaires", icon: GraduationCap },
  { value: "pme", label: "PME", icon: Briefcase },
  { value: "autre", label: "Autres", icon: Store },
];

const Annuaire = () => {
  const queryClient = useQueryClient();
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState({ name: "", category: "sanitaire", address: "", phone: "", description: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      setIsAdmin(!!data?.some(r => ["admin", "moderator"].includes(r.role)));
    };
    check();
  }, []);

  const { data: entries, isLoading } = useQuery({
    queryKey: ["directory", selectedCat],
    queryFn: async () => {
      let q = supabase.from("directory_entries").select("*").order("name");
      if (selectedCat) q = q.eq("category", selectedCat);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const filtered = entries?.filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.address?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Nom requis"); return; }
    setIsSaving(true);
    try {
      const { error } = await supabase.from("directory_entries").insert({
        name: form.name.trim(),
        category: form.category,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        description: form.description.trim() || null,
      });
      if (error) throw error;
      toast.success("Ajouté !");
      setForm({ name: "", category: "sanitaire", address: "", phone: "", description: "" });
      setShowAdd(false);
      queryClient.invalidateQueries({ queryKey: ["directory"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getCatIcon = (cat: string) => {
    const c = CATEGORIES.find(c => c.value === cat);
    return c ? c.icon : Store;
  };

  const getCatCount = (cat: string) => entries?.filter(e => e.category === cat).length || 0;

  return (
    <div className="pt-16">
      <section className="py-12 lg:py-16 bg-secondary/50">
        <div className="container">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <ScrollReveal className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">Portail Interne</span>
            <h1 className="mt-2 text-2xl lg:text-4xl font-display font-bold text-foreground">
              Annuaire du District
            </h1>
            <p className="mt-2 text-muted-foreground text-sm">
              Base de données classifiée des établissements et services du district Cité Novalim-CIE.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-8 lg:py-12">
        <div className="container max-w-5xl">
          {/* Categories grid */}
          {!selectedCat && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCat(cat.value)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground text-center leading-tight">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {selectedCat && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <Button variant="outline" size="sm" onClick={() => { setSelectedCat(null); setSearch(""); }}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Catégories
                </Button>
                <h2 className="text-lg font-semibold text-foreground">
                  {CATEGORIES.find(c => c.value === selectedCat)?.label}
                </h2>
                {isAdmin && (
                  <Button size="sm" variant="outline" className="ml-auto" onClick={() => setShowAdd(!showAdd)}>
                    <Plus className="w-4 h-4 mr-1" /> Ajouter
                  </Button>
                )}
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-10" />
              </div>

              {showAdd && isAdmin && (
                <form onSubmit={handleAdd} className="bg-card rounded-xl border border-border/50 p-4 mb-6 space-y-3">
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nom de l'établissement" required />
                  <Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Adresse" />
                  <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Téléphone" />
                  <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" rows={2} />
                  <Button type="submit" size="sm" disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}
                  </Button>
                </form>
              )}

              {isLoading && [1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl mb-3" />)}

              {filtered?.length === 0 && !isLoading && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Aucun établissement trouvé dans cette catégorie.</p>
                  {isAdmin && <p className="text-sm mt-1">Utilisez le bouton "Ajouter" pour en créer.</p>}
                </div>
              )}

              <div className="space-y-3">
                {filtered?.map(entry => {
                  const Icon = getCatIcon(entry.category);
                  return (
                    <div key={entry.id} className="p-4 rounded-xl bg-card border border-border/50 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm">{entry.name}</h3>
                        {entry.address && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {entry.address}
                          </p>
                        )}
                        {entry.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" /> {entry.phone}
                          </p>
                        )}
                        {entry.description && (
                          <p className="text-xs text-muted-foreground mt-1">{entry.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Annuaire;
