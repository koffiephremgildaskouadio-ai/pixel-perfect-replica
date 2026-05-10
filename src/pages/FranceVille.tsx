import { ScrollReveal } from "@/components/ScrollReveal";
import { ArrowLeft, User as UserIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import francevilleLogo from "@/assets/franceville_logo.jpg";

const FranceVille = () => {
  const { data: members, isLoading } = useQuery({
    queryKey: ["franceville-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("id, nom, prenoms, poste, member_number, photo_url, category")
        .eq("district", "France-ville")
        .eq("is_active", true)
        .order("member_number");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="pt-16">
      <section className="py-16 lg:py-24 bg-secondary/50">
        <div className="container">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </Link>
          <ScrollReveal className="text-center max-w-3xl mx-auto">
            <img src={francevilleLogo} alt="Logo France-ville" className="w-24 h-24 object-contain mx-auto mb-5 rounded-full" />
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">District partenaire</span>
            <h1 className="mt-3 text-3xl lg:text-5xl font-display font-bold text-foreground leading-tight">
              District France-ville
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Bureau, responsables et cartes de membre du district France-ville, sous la présidence de Bamba Adama.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container">
          <ScrollReveal className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Bureau de France-ville</h2>
            <p className="mt-2 text-muted-foreground">{members?.length ?? 0} membre(s) actif(s) enregistrés.</p>
          </ScrollReveal>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {(members ?? []).map((member, index) => (
                <ScrollReveal key={member.id} delay={index * 60}>
                  <Link to={`/carte/${member.id}`}>
                    <div className="group relative rounded-2xl bg-card border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer shadow-sm">
                      <div className="p-6 text-center space-y-3">
                        {member.photo_url ? (
                          <img src={member.photo_url} alt={`${member.nom} ${member.prenoms}`} className="mx-auto w-16 h-16 rounded-2xl object-cover" />
                        ) : (
                          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-display font-bold bg-secondary text-secondary-foreground">
                            {member.nom[0]}{member.prenoms?.[0] || ""}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-foreground text-base leading-tight">{member.nom} {member.prenoms}</h3>
                          {member.poste && <p className="text-primary font-medium text-xs mt-1.5 leading-snug line-clamp-2">{member.poste}</p>}
                        </div>
                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                          <UserIcon className="w-3.5 h-3.5" />
                          <span>{member.member_number}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default FranceVille;