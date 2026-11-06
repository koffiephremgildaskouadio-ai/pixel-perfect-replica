import { ScrollReveal } from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import { PortalNav } from "@/components/PortalNav";
import { User as UserIcon, ArrowLeft } from "lucide-react";
import { orderedBureau } from "@/lib/bureau";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface Member {
  id: string;
  nom: string;
  prenoms: string;
  poste: string | null;
  member_number: string;
  category: string;
  photo_url: string | null;
  bureau_rank: number | null;
}

const MemberCard = ({ member, index }: { member: Member; index: number }) => {
  const initials = `${member.nom[0]}${member.prenoms?.[0] || ""}`;
  const isPresident = member.bureau_rank === 1;

  return (
    <ScrollReveal delay={index * 80}>
      <Link to={`/carte/${member.id}`}>
        <div
          className={`group relative rounded-2xl bg-card border overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer ${
            isPresident
              ? "border-primary/30 shadow-md shadow-primary/10"
              : "border-border/50 shadow-sm"
          }`}
        >
          {isPresident && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
          )}
          <span className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold" aria-label={`Rang ${member.bureau_rank}`}>
            {member.bureau_rank}
          </span>
          <div className="p-6 text-center space-y-3">
            {member.photo_url ? (
              <img src={member.photo_url} alt={`${member.nom} ${member.prenoms}`} className="mx-auto w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div
                className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-display font-bold ${
                  isPresident
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {initials}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-foreground text-base leading-tight">
                {member.nom} {member.prenoms}
              </h3>
              {member.poste && (
                <p className="text-primary font-medium text-xs mt-1.5 leading-snug">{member.poste}</p>
              )}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <UserIcon className="w-3.5 h-3.5" />
              <span>{member.member_number}</span>
            </div>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  );
};

const Bureau = () => {
  const { data: members, isLoading } = useQuery({
    queryKey: ["bureau-members", "official-order"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members_public")
        .select("id, nom, prenoms, poste, member_number, category, photo_url, bureau_rank, district")
        .gte("bureau_rank", 1)
        .lte("bureau_rank", 18)
        .ilike("district", "%novalim%")
        .eq("is_active", true)
        .order("bureau_rank");
      if (error) throw error;
      return orderedBureau(data ?? []);
    },
  });

  const bureauMembers = members ?? [];

  const LoadingSkeleton = () => (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-48 rounded-2xl" />
      ))}
    </div>
  );

  const SectionHeader = ({ title, description }: { title: string; description: string }) => (
    <ScrollReveal className="mb-10">
      <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
        {title}
      </h2>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </ScrollReveal>
  );

  return (
    <div className="pt-16"><SEO title="Bureau exécutif — District Cité Novalim-CIE" description="Découvrez les membres du bureau exécutif du District Cité Novalim-CIE : président, vice-présidents, secrétaires et responsables." path="/bureau" />
      <PortalNav activeSlug="bureau" />
      <section className="py-16 lg:py-24 bg-secondary/50">
        <div className="container">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </Link>
          <ScrollReveal className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">
              Organisation
            </span>
            <h1 className="mt-3 text-3xl lg:text-5xl font-display font-bold text-foreground leading-tight">
              Bureau exécutif et de coordination
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Les {(members?.length ?? 0)} membres élus et nommés qui dirigent et administrent le District Cité Novalim-CIE.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container">
          <SectionHeader
            title="Bureau du District"
            description="Président, Haut Représentant et responsables du district."
          />
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {bureauMembers.map((m, i) => (
                <MemberCard key={m.id} member={m} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default Bureau;
