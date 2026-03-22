import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VirtualCard } from "@/components/VirtualCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

const CarteMembre = () => {
  const { id } = useParams<{ id: string }>();

  const { data: member, isLoading, error } = useQuery({
    queryKey: ["member", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  return (
    <div className="pt-16 min-h-screen bg-secondary/30">
      <div className="container max-w-lg py-12 lg:py-20">
        {isLoading && (
          <div className="space-y-4 max-w-sm mx-auto">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        )}

        {error && (
          <ScrollReveal>
            <div className="text-center py-16 px-8 rounded-2xl bg-card border border-border/50 space-y-3">
              <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
              <h2 className="text-lg font-semibold text-foreground">Membre introuvable</h2>
              <p className="text-sm text-muted-foreground">
                Cette carte n'existe pas ou a été désactivée.
              </p>
            </div>
          </ScrollReveal>
        )}

        {member && (
          <ScrollReveal>
            <VirtualCard
              memberId={member.id}
              memberNumber={member.member_number}
              nom={member.nom}
              prenoms={member.prenoms}
              poste={member.poste}
              quartier={member.quartier}
              category={member.category}
            />
            <p className="text-center text-xs text-muted-foreground mt-6">
              Carte d'identification officielle · District Cité Novalim-CIE
            </p>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
};

export default CarteMembre;
