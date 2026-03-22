import { useEffect, useState } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, Search, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { VirtualCard } from "@/components/VirtualCard";
import type { Session } from "@supabase/supabase-js";

const Membres = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

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
      <div className="pt-16">
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
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-display font-bold text-foreground">Ma Carte Virtuelle</h2>
              </div>
              <VirtualCard
                memberId={myCard.id}
                memberNumber={myCard.member_number}
                nom={myCard.nom}
                prenoms={myCard.prenoms}
                poste={myCard.poste}
                quartier={myCard.quartier}
                category={myCard.category}
              />
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Search + list */}
      <section className="py-12 lg:py-16 bg-secondary/30">
        <div className="container">
          <ScrollReveal className="mb-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un membre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </ScrollReveal>

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
