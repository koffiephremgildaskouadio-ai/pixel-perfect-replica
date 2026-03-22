import { ScrollReveal } from "@/components/ScrollReveal";
import { User as UserIcon } from "lucide-react";
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
  const initials = `${member.nom[0]}${member.prenoms[0]}`;
  const isPresident = member.member_number === "NCV-2024-001";

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
          <div className="p-6 text-center space-y-4">
            <div
              className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-display font-bold ${
                isPresident
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {initials}
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">
                {member.nom} {member.prenoms}
              </h3>
              {member.poste && (
                <p className="text-primary font-medium text-sm mt-1">{member.poste}</p>
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
        .in("category", ["bureau", "cabinet"])
        .eq("is_active", true)
        .order("member_number");
      if (error) throw error;
      return data;
    },
  });

  const bureauMembers = members?.filter((m) => m.category === "bureau") ?? [];
  const cabinetMembers = members?.filter((m) => m.category === "cabinet") ?? [];

  const LoadingSkeleton = () => (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-52 rounded-2xl" />
      ))}
    </div>
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
              Les membres élus et nommés qui dirigent et administrent le District Cité Novalim-CIE.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container">
          <ScrollReveal className="mb-12">
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              Bureau Exécutif
            </h2>
            <p className="mt-2 text-muted-foreground">Les membres dirigeants du district.</p>
          </ScrollReveal>
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bureauMembers.map((m, i) => (
                <MemberCard key={m.id} member={m} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-secondary/30">
        <div className="container">
          <ScrollReveal className="mb-12">
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              Cabinet
            </h2>
            <p className="mt-2 text-muted-foreground">
              Les conseillers et responsables spécialisés.
            </p>
          </ScrollReveal>
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cabinetMembers.map((m, i) => (
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
