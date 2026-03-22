import { ScrollReveal } from "@/components/ScrollReveal";
import { User as UserIcon } from "lucide-react";

interface Member {
  id: number;
  nom: string;
  prenoms: string;
  poste: string;
  role: "bureau" | "cabinet";
  memberNumber: number;
}

const bureauMembers: Member[] = [
  { id: 1, nom: "KOUADIO", prenoms: "Koffi Ephrem Gildas", poste: "Président des Jeunes", role: "bureau", memberNumber: 1 },
  { id: 2, nom: "DIALLO", prenoms: "Aminata Marie", poste: "Vice-Présidente", role: "bureau", memberNumber: 2 },
  { id: 3, nom: "KONÉ", prenoms: "Ibrahim Seydou", poste: "Secrétaire Général", role: "bureau", memberNumber: 3 },
  { id: 4, nom: "BAMBA", prenoms: "Fatou Adèle", poste: "Trésorière Générale", role: "bureau", memberNumber: 4 },
  { id: 5, nom: "YAO", prenoms: "Jean-Marc Thierry", poste: "Chargé de Communication", role: "bureau", memberNumber: 5 },
];

const cabinetMembers: Member[] = [
  { id: 6, nom: "TOURÉ", prenoms: "Moussa Abidjan", poste: "Conseiller Juridique", role: "cabinet", memberNumber: 6 },
  { id: 7, nom: "AKÉ", prenoms: "Christelle Bénédicte", poste: "Chargée des Affaires Sociales", role: "cabinet", memberNumber: 7 },
  { id: 8, nom: "N'GUESSAN", prenoms: "Arsène Olivier", poste: "Responsable Technique", role: "cabinet", memberNumber: 8 },
  { id: 9, nom: "OUATTARA", prenoms: "Salimata Rose", poste: "Chargée de l'Événementiel", role: "cabinet", memberNumber: 9 },
];

const MemberCard = ({ member, index }: { member: Member; index: number }) => {
  const initials = `${member.nom[0]}${member.prenoms[0]}`;
  const isPresident = member.memberNumber === 1;

  return (
    <ScrollReveal delay={index * 80}>
      <div className={`group relative rounded-2xl bg-card border overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 ${
        isPresident ? "border-primary/30 shadow-md shadow-primary/10" : "border-border/50 shadow-sm"
      }`}>
        {isPresident && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
        )}
        <div className="p-6 text-center space-y-4">
          <div className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-display font-bold ${
            isPresident
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}>
            {initials}
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-lg">
              {member.nom} {member.prenoms}
            </h3>
            <p className="text-primary font-medium text-sm mt-1">{member.poste}</p>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <UserIcon className="w-3.5 h-3.5" />
            <span>Membre N° {member.memberNumber}</span>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
};

const Bureau = () => {
  return (
    <div className="pt-16">
      {/* Header */}
      <section className="py-16 lg:py-24 bg-secondary/50">
        <div className="container">
          <ScrollReveal className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">Organisation</span>
            <h1 className="mt-3 text-3xl lg:text-5xl font-display font-bold text-foreground leading-tight">
              Bureau Exécutif & Cabinet
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Les membres élus et nommés qui dirigent et administrent le District Cité Novalim-CIE.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Bureau Exécutif */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <ScrollReveal className="mb-12">
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              Bureau Exécutif
            </h2>
            <p className="mt-2 text-muted-foreground">Les membres dirigeants du district.</p>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bureauMembers.map((m, i) => (
              <MemberCard key={m.id} member={m} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Cabinet */}
      <section className="py-16 lg:py-24 bg-secondary/30">
        <div className="container">
          <ScrollReveal className="mb-12">
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              Cabinet
            </h2>
            <p className="mt-2 text-muted-foreground">Les conseillers et responsables spécialisés.</p>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cabinetMembers.map((m, i) => (
              <MemberCard key={m.id} member={m} index={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Bureau;
