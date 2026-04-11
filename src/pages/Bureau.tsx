import { ScrollReveal } from "@/components/ScrollReveal";
import { User as UserIcon, MapPin } from "lucide-react";
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
}

const MemberCard = ({ member, index }: { member: Member; index: number }) => {
  const initials = `${member.nom[0]}${member.prenoms?.[0] || ""}`;
  const isPresident = member.member_number === "NCV-2025-001";

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
          <div className="p-6 text-center space-y-3">
            <div
              className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-display font-bold ${
                isPresident
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {initials}
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-base leading-tight">
                {member.nom} {member.prenoms}
              </h3>
              {member.poste && (
                <p className="text-primary font-medium text-xs mt-1.5 leading-snug line-clamp-2">{member.poste}</p>
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
    queryKey: ["bureau-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("id, nom, prenoms, poste, member_number, category")
        .in("category", ["bureau", "cabinet", "coordonnateur", "commission"])
        .eq("is_active", true)
        .order("member_number");
      if (error) throw error;
      return data;
    },
  });

  const bureauMembers = members?.filter((m) => m.category === "bureau") ?? [];
  const cabinetMembers = members?.filter((m) => m.category === "cabinet") ?? [];
  const coordMembers = members?.filter((m) => m.category === "coordonnateur") ?? [];
  const commissionMembers = members?.filter((m) => m.category === "commission") ?? [];

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
    <div className="pt-16">
      <section className="py-16 lg:py-24 bg-secondary/50">
        <div className="container">
          <ScrollReveal className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">
              Organisation
            </span>
            <h1 className="mt-3 text-3xl lg:text-5xl font-display font-bold text-foreground leading-tight">
              Bureau Exécutif & Cabinet
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
            title="Bureau Exécutif"
            description="Les membres dirigeants du district — président, vice-présidents et secrétaires."
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

      <section className="py-16 lg:py-20 bg-secondary/30">
        <div className="container">
          <SectionHeader
            title="Cabinet"
            description="Les Dicap et Chefs de Cabinet du district."
          />
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {cabinetMembers.map((m, i) => (
                <MemberCard key={m.id} member={m} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container">
          <SectionHeader
            title="Coordonnateurs de Zones"
            description="Les responsables de la coordination des zones du district."
          />
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {coordMembers.map((m, i) => (
                <MemberCard key={m.id} member={m} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-secondary/30">
        <div className="container">
          <SectionHeader
            title="Commissions"
            description="Les présidents et membres des commissions d'assainissement, de sécurité et culturelle."
          />
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {commissionMembers.map((m, i) => (
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
