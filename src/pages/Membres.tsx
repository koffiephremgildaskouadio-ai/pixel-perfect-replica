import { useEffect, useState } from "react";
import { SEO } from "@/components/SEO";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, Search, CreditCard, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VirtualCard } from "@/components/VirtualCard";
import { MyProfileEditor } from "@/components/MyProfileEditor";
import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

const Membres = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [canDownload, setCanDownload] = useState(false);
  const [canAddMember, setCanAddMember] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ nom: "", prenoms: "", phone: "", quartier: "", category: "membre" as "membre" | "partenaire" });
  const [addSaving, setAddSaving] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const checkPermissions = async (userId: string) => {
    const [{ data: roles }, { data: me }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("members").select("poste").eq("user_id", userId).maybeSingle(),
    ]);
    setCanDownload(!!roles?.some((r) => r.role === "super_admin"));
    const isAdmin = !!roles?.some((r) => ["admin", "super_admin", "moderator"].includes(r.role));
    const poste = (me?.poste ?? "").toLowerCase();
    const isVP = poste.startsWith("vice-président") || poste.startsWith("vice-president") || poste.startsWith("vice président") || poste.startsWith("vice president");
    const isSG = poste.startsWith("secrétaire général") || poste.startsWith("secretaire general") || poste.startsWith("secrétaire generale") || poste.startsWith("secretaire générale");
    setCanAddMember(isAdmin || isVP || isSG);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkPermissions(session.user.id);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkPermissions(session.user.id);
      else { setCanDownload(false); setCanAddMember(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.nom.trim() || !addForm.prenoms.trim()) { toast.error("Nom et prénoms requis"); return; }
    setAddSaving(true);
    try {
      // Generate a member number
      const { data: last } = await supabase
        .from("members")
        .select("member_number")
        .like("member_number", "NCV-2025-%")
        .order("member_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      const lastNum = last?.member_number ? parseInt(last.member_number.split("-")[2], 10) : 100;
      const memberNumber = `NCV-2025-${String(lastNum + 1).padStart(3, "0")}`;

      const { error } = await supabase.from("members").insert({
        member_number: memberNumber,
        nom: addForm.nom.trim(),
        prenoms: addForm.prenoms.trim(),
        phone: addForm.phone.trim() || null,
        quartier: addForm.quartier.trim() || null,
        category: addForm.category,
        is_active: true,
      });
      if (error) throw error;
      toast.success(`${addForm.category === "partenaire" ? "Partenaire" : "Membre"} ajouté (${memberNumber})`);
      setAddForm({ nom: "", prenoms: "", phone: "", quartier: "", category: "membre" });
      setShowAdd(false);
      queryClient.invalidateQueries({ queryKey: ["all-members"] });
    } catch (err: any) {
      toast.error(err.message ?? "Erreur");
    } finally {
      setAddSaving(false);
    }
  };


  const { data: members } = useQuery({
    queryKey: ["all-members", search],
    queryFn: async () => {
      let query = supabase
        .from("members")
        .select("*")
        .eq("is_active", true)
        .order("member_number");
      if (search.trim()) {
        query = query.or(`nom.ilike.%${search}%,prenoms.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!session,
  });

  // Find the current user's member card
  const myCard = members?.find((m) => m.user_id === session?.user?.id);

  if (loading) return null;

  if (!session) {
    return (
      <div className="pt-16"><SEO title="Base des membres — District Novalim-CIE" description="Espace membres du District Cité Novalim-CIE : recherche, cartes digitales et annuaire interne." path="/membres" />
        <section className="py-16 lg:py-24 bg-secondary/50">
          <div className="container">
            <ScrollReveal className="text-center max-w-2xl mx-auto">
              <span className="text-sm font-semibold text-primary tracking-wide uppercase">
                Communauté
              </span>
              <h1 className="mt-3 text-3xl lg:text-5xl font-display font-bold text-foreground leading-tight">
                Base de Données des Membres
              </h1>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Consultez le répertoire des membres du district.
              </p>
            </ScrollReveal>
          </div>
        </section>
        <section className="py-16 lg:py-24">
          <div className="container max-w-md">
            <ScrollReveal>
              <div className="text-center py-16 px-8 rounded-2xl bg-card border border-border/50 shadow-sm space-y-4">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                  <Lock className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Accès réservé</h3>
                <p className="text-sm text-muted-foreground">
                  Connectez-vous en tant que membre pour accéder au répertoire complet.
                </p>
                <Link to="/connexion">
                  <Button variant="default" size="lg" className="mt-2">
                    Se connecter
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-16">
      <section className="py-16 lg:py-24 bg-secondary/50">
        <div className="container">
          <ScrollReveal className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">
              Communauté
            </span>
            <h1 className="mt-3 text-3xl lg:text-5xl font-display font-bold text-foreground leading-tight">
              Répertoire des Membres
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {members?.length ?? 0} membres actifs du district.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* My card */}
      {myCard && (
        <section className="py-12 lg:py-16">
          <div className="container max-w-lg">
            <ScrollReveal>
              <div className="flex items-center justify-between gap-2 mb-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-display font-bold text-foreground">Ma Carte Virtuelle</h2>
                </div>
                <MyProfileEditor
                  member={myCard}
                  onSaved={() => queryClient.invalidateQueries({ queryKey: ["all-members"] })}
                />
              </div>
              <VirtualCard
                memberId={myCard.id}
                memberNumber={myCard.member_number}
                nom={myCard.nom}
                prenoms={myCard.prenoms}
                poste={myCard.poste}
                quartier={myCard.quartier}
                phone={myCard.phone}
                category={myCard.category}
                photoUrl={myCard.photo_url}
                canDownload={canDownload}
              />
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Search + list */}
      <section className="py-12 lg:py-16 bg-secondary/30">
        <div className="container">
          <ScrollReveal className="mb-6 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un membre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {canAddMember && (
              <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
                <UserPlus className="w-4 h-4 mr-1" /> Ajouter
              </Button>
            )}
          </ScrollReveal>

          {showAdd && canAddMember && (
            <form onSubmit={handleAddMember} className="bg-card rounded-xl border border-border/50 p-4 mb-6 grid sm:grid-cols-2 gap-3 max-w-2xl">
              <Input value={addForm.nom} onChange={(e) => setAddForm({ ...addForm, nom: e.target.value })} placeholder="Nom *" required />
              <Input value={addForm.prenoms} onChange={(e) => setAddForm({ ...addForm, prenoms: e.target.value })} placeholder="Prénoms *" required />
              <Input value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} placeholder="Téléphone" />
              <Input value={addForm.quartier} onChange={(e) => setAddForm({ ...addForm, quartier: e.target.value })} placeholder="Quartier" />
              <select
                value={addForm.category}
                onChange={(e) => setAddForm({ ...addForm, category: e.target.value as "membre" | "partenaire" })}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="membre">Membre</option>
                <option value="partenaire">Partenaire</option>
              </select>
              <Button type="submit" size="sm" disabled={addSaving} className="sm:col-span-2">
                {addSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}
              </Button>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Vous ne pouvez pas ajouter de membre du bureau, ni supprimer un membre.
              </p>
            </form>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members?.map((m, i) => (
              <ScrollReveal key={m.id} delay={i * 50}>
                <Link to={`/carte/${m.id}`}>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 cursor-pointer group">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-display font-bold text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {m.nom[0]}{m.prenoms[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">
                        {m.nom} {m.prenoms}
                      </p>
                      {m.poste && (
                        <p className="text-xs text-muted-foreground truncate">{m.poste}</p>
                      )}
                    </div>
                    <span className="ml-auto text-xs text-muted-foreground font-mono shrink-0">
                      {m.member_number}
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>

          {members?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Aucun membre trouvé pour « {search} ».
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Membres;
