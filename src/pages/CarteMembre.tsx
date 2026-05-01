import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VirtualCard } from "@/components/VirtualCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Phone, MapPin, Briefcase, FileText, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const CarteMembre = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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

  const categoryLabel =
    member?.category === "bureau"
      ? "Bureau Exécutif"
      : member?.category === "cabinet"
        ? "Cabinet"
        : member?.category === "coordonnateur"
          ? "Coordonnateur"
          : member?.category === "commission"
            ? "Commission"
            : "Membre";

  const cahierItems = member?.cahier_charges
    ? member.cahier_charges.split(".").map((s: string) => s.trim()).filter((s: string) => s.length > 3)
    : [];

  return (
    <div className="pt-16 min-h-screen bg-secondary/30">
      <div className="container max-w-2xl py-10 lg:py-16 space-y-8">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Button>

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
              <p className="text-sm text-muted-foreground">Cette carte n'existe pas ou a été désactivée.</p>
            </div>
          </ScrollReveal>
        )}

        {member && (
          <>
            <ScrollReveal>
              <VirtualCard
                memberId={member.id}
                memberNumber={member.member_number}
                nom={member.nom}
                prenoms={member.prenoms}
                poste={member.poste}
                quartier={member.quartier}
                phone={member.phone}
                category={member.category}
                photoUrl={member.photo_url}
                email={null}
              />
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden">
                <div className="bg-primary/5 border-b border-border/30 px-6 py-5">
                  <div className="flex items-center gap-4">
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={`${member.nom} ${member.prenoms}`} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-display font-bold text-primary shrink-0">
                        {member.nom?.[0]}{member.prenoms?.[0]}
                      </div>
                    )}
                    <div>
                      <h1 className="text-xl font-display font-bold text-foreground">
                        {member.nom} {member.prenoms}
                      </h1>
                      {member.poste && (
                        <p className="text-primary font-semibold text-sm mt-0.5">{member.poste}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-5 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <InfoItem icon={<User className="w-4 h-4" />} label="N° Membre" value={member.member_number} />
                    <InfoItem icon={<Briefcase className="w-4 h-4" />} label="Catégorie" value={categoryLabel} />
                    {member.phone && <InfoItem icon={<Phone className="w-4 h-4" />} label="Téléphone" value={member.phone} />}
                    {member.quartier && <InfoItem icon={<MapPin className="w-4 h-4" />} label="Quartier" value={member.quartier} />}
                  </div>
                </div>

                {cahierItems.length > 0 && (
                  <div className="border-t border-border/30 px-6 py-5">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-primary" />
                      <h2 className="text-sm font-display font-bold text-foreground uppercase tracking-wide">Cahier de Charges</h2>
                    </div>
                    <ul className="space-y-2">
                      {cahierItems.map((item: string, i: number) => (
                        <li key={i} className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <span>{item}.</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </ScrollReveal>

            <p className="text-center text-xs text-muted-foreground">
              Fiche d'identification officielle · District Cité Novalim-CIE · CCJY Yopougon
            </p>
          </>
        )}
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-secondary/50">
    <div className="text-primary mt-0.5">{icon}</div>
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
    </div>
  </div>
);

export default CarteMembre;
