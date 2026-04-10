import { ScrollReveal } from "@/components/ScrollReveal";
import { MapPin, Building2, Heart, Users, Shield, Handshake } from "lucide-react";
import logoNovalim from "@/assets/logo_novalim.png";
import logoCcjy from "@/assets/logo_ccjy.jpg";

const districts = [
  { nom: "Port-Bouët 2 Plateau", president: "Cissé Madémorie" },
  { nom: "Franceville", president: "Bamba Adama" },
  { nom: "Terminus 47 – Aimé Césaire", president: "Tanoh Ischam Ezéchiel" },
  { nom: "Base CIE", president: "—" },
];

const partenaires = {
  sante: [
    "Le Grand Centre de Santé",
    "Clinique Vie",
    "Clinique Sainte Jeanne de Garcia",
  ],
  pharmacies: [
    "Nouvelle Pharmacie Raphaël",
    "Pharmacie Roxane",
  ],
  autres: [
    "La Table des Chefs",
    "Espaces événementiels locaux",
    "Grand CIE et ses cités",
  ],
};

const APropos = () => {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-secondary/50">
        <div className="container">
          <ScrollReveal className="text-center max-w-3xl mx-auto">
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">
              À propos
            </span>
            <h1 className="mt-3 text-3xl lg:text-5xl font-display font-bold text-foreground leading-tight">
              District Cité Novalim-CIE
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed text-lg">
              Un district modèle au cœur de la commune de Yopougon, composé à 95 % de cités
              résidentielles organisées et dynamiques.
            </p>
            <div className="flex items-center justify-center gap-6 mt-8">
              <img src={logoNovalim} alt="Logo District Novalim-CIE" className="w-20 h-20 object-contain" />
              <img src={logoCcjy} alt="Logo CCJY" className="w-20 h-20 object-contain rounded-lg" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Président & CCJY */}
      <section className="py-16 lg:py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <ScrollReveal direction="left">
              <div className="flex flex-col items-center gap-6">
                <div className="rounded-2xl overflow-hidden shadow-xl border-4 border-primary/20 w-64 h-80">
                  <img
                    src="/images/president.png"
                    alt="Président Kouadio Koffi Ephrem Gildas"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-display font-bold text-foreground">
                    Kouadio Koffi Ephrem Gildas
                  </h3>
                  <p className="text-primary font-medium text-sm">Président du District</p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="space-y-5">
                <span className="text-sm font-semibold text-accent tracking-wide uppercase">
                  Le Conseil Communal des Jeunes de Yopougon
                </span>
                <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground leading-tight">
                  Une faîtière au service de la jeunesse
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Le <strong>Conseil Communal des Jeunes de Yopougon (CCJY)</strong> est la faîtière
                  de toutes les associations de jeunesse de la commune. Inscrit depuis 2017 auprès du
                  Ministère de la Jeunesse, il œuvre pour la <strong>cohésion sociale</strong>,
                  l'entrepreneuriat jeune et le développement communautaire.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  La commune de Yopougon, plus grande commune d'Afrique de l'Ouest, regroupe
                  <strong> 87 districts</strong> et <strong>11 villages</strong>. Le District Cité
                  Novalim-CIE est l'un de ces 87 districts, rattaché à la <strong>Zone 7</strong>,
                  coordonnée par le Président <strong>Koné Yacouba</strong>, lui-même Vice-Président
                  communal et Président du district Banco 2.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Identité du district */}
      <section className="py-16 lg:py-20 bg-secondary/30">
        <div className="container">
          <ScrollReveal className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              Un district de cités organisées
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Le District Cité Novalim-CIE se distingue par sa composition à 95 % de cités
              résidentielles, chacune structurée avec son propre bureau et dirigée par un président de cité.
              Cette organisation exemplaire favorise la cohésion, la transparence et l'entraide entre
              résidents.
            </p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Building2, title: "95 % de cités", desc: "Un district essentiellement résidentiel, avec des cités modernes et bien structurées." },
              { icon: Users, title: "87 districts à Yopougon", desc: "Le District Novalim-CIE est l'un des 87 districts de la plus grande commune d'Afrique de l'Ouest." },
              { icon: Shield, title: "Zone 7", desc: "Rattaché à la Zone 7, coordonnée par Koné Yacouba, Vice-Président communal." },
              { icon: MapPin, title: "Emplacement stratégique", desc: "Bordé par les districts Port-Bouët 2, Franceville, Terminus 47 et Base CIE." },
              { icon: Heart, title: "Partenaires santé", desc: "Le Grand Centre, Clinique Vie, Clinique Ste Jeanne de Garcia et plusieurs pharmacies." },
              { icon: Handshake, title: "Partenaires locaux", desc: "La Table des Chefs, le Grand CIE, espaces événementiels et autres acteurs économiques." },
            ].map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 80}>
                <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm h-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Districts limitrophes */}
      <section className="py-16 lg:py-20">
        <div className="container max-w-3xl">
          <ScrollReveal className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              Districts limitrophes
            </h2>
            <p className="mt-2 text-muted-foreground">Nos voisins et partenaires territoriaux.</p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 gap-4">
            {districts.map((d, i) => (
              <ScrollReveal key={d.nom} delay={i * 60}>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{d.nom}</h4>
                    <p className="text-xs text-muted-foreground">Président : {d.president}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Partenaires */}
      <section className="py-16 lg:py-20 bg-secondary/30">
        <div className="container max-w-4xl">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              Nos partenaires
            </h2>
            <p className="mt-2 text-muted-foreground">
              Un réseau de partenaires de confiance au service des habitants du district.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Santé", items: partenaires.sante, icon: Heart },
              { title: "Pharmacies", items: partenaires.pharmacies, icon: Shield },
              { title: "Autres partenaires", items: partenaires.autres, icon: Handshake },
            ].map((cat, i) => (
              <ScrollReveal key={cat.title} delay={i * 100}>
                <div className="p-6 rounded-2xl bg-card border border-border/50 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <cat.icon className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">{cat.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {cat.items.map((item) => (
                      <li key={item} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-1.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default APropos;
