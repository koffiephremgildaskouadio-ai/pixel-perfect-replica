import { ScrollReveal } from "@/components/ScrollReveal";
import { MapPin, Building2, Heart, Users, Shield, Handshake, Star, Crown, ArrowLeft, Award, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logoNovalim from "@/assets/logo_novalim.png";
import logoCcjy from "@/assets/logo_ccjy.jpg";
import novaOfficial from "@/assets/nova_logo_official.jpg";
import novaAction1 from "@/assets/nova_action1.jpg";
import novaAction2 from "@/assets/nova_action2.jpg";
import novaAction3 from "@/assets/nova_action3.jpg";

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
    "Jumbo Store CI (BTP & Fournitures d'entreprise)",
    "La Table des Chefs",
    "Espaces événementiels locaux",
    "Grand CIE et ses cités",
  ],
};

const PersonnaliteCard = ({
  name, title, subtitle, imageUrl, description, delay = 0
}: {
  name: string; title: string; subtitle?: string; imageUrl: string; description: string; delay?: number;
}) => (
  <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
    <ScrollReveal direction="left" delay={delay}>
      <div className="flex flex-col items-center gap-6">
        <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-primary/30 w-72 h-80">
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-display font-bold text-foreground">{name}</h3>
          <p className="text-primary font-semibold text-sm">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
    </ScrollReveal>
    <ScrollReveal delay={delay + 150}>
      <div className="space-y-4">
        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{description}</p>
      </div>
    </ScrollReveal>
  </div>
);

const APropos = () => {
  const { data: blocks } = useQuery({
    queryKey: ["site-content-public"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("site_content").select("*");
      return data ?? [];
    },
  });
  const block = (key: string) => (blocks ?? []).find((b: any) => b.key === key);
  const heroBlock = block("apropos.hero");
  const presBlock = block("apropos.president_intro");

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-secondary/50">
        <div className="container">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </Link>
          <ScrollReveal className="text-center max-w-3xl mx-auto">
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">À propos</span>
            <h1 className="mt-3 text-3xl lg:text-5xl font-display font-bold text-foreground leading-tight">
              District Cité Novalim-CIE
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed text-lg">
              Un district modèle au cœur de la commune de Yopougon, composé à 95 % de cités résidentielles organisées et dynamiques.
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
                  <img src="/images/president.png" alt="Président Kouadio Koffi Ephrem Gildas" className="w-full h-full object-cover" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-display font-bold text-foreground">Kouadio Koffi Ephrem Gildas</h3>
                  <p className="text-primary font-medium text-sm">Président du District</p>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <div className="space-y-5">
                <span className="text-sm font-semibold text-accent tracking-wide uppercase">Le Conseil Communal des Jeunes de Yopougon</span>
                <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground leading-tight">Une faîtière au service de la jeunesse</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Le <strong>Conseil Communal des Jeunes de Yopougon (CCJY)</strong> est la faîtière de toutes les associations de jeunesse de la commune. Inscrit depuis 2017 auprès du Ministère de la Jeunesse, il œuvre pour la <strong>cohésion sociale</strong>, l'entrepreneuriat jeune et le développement communautaire.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  La commune de Yopougon, plus grande commune d'Afrique de l'Ouest, regroupe <strong>87 districts</strong> et <strong>11 villages</strong>. Le District Cité Novalim-CIE est l'un de ces 87 districts, rattaché à la <strong>Zone 7</strong>, coordonnée par le Président <strong>Koné Yacouba</strong>, lui-même Vice-Président communal et Président du district Banco 2.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Président du CCJY - Assim Saba */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-accent/5 to-primary/5">
        <div className="container">
          <ScrollReveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
              <Award className="w-4 h-4" />
              Président du CCJY
            </div>
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              M. Assim Saba — Leader de la Jeunesse Yopougonnaise
            </h2>
          </ScrollReveal>
          <PersonnaliteCard
            name="Assim Saba"
            title="Président du Conseil Communal des Jeunes de Yopougon"
            imageUrl="/images/assim.jpg"
            description={`M. Assim Saba est une figure emblématique de la jeunesse de Yopougon. En tant que Président du Conseil Communal des Jeunes de Yopougon (CCJY), il porte la voix de plus de 87 districts et 11 villages, faisant du CCJY une force incontournable dans le paysage socio-politique de la commune.

Visionnaire et rassembleur, M. Assim Saba a su fédérer les énergies de la jeunesse autour de projets structurants : insertion professionnelle, entrepreneuriat jeune, cohésion sociale et développement communautaire. Son leadership se caractérise par une écoute active des préoccupations des jeunes et une capacité remarquable à transformer les défis en opportunités.

Sous sa présidence, le CCJY a renforcé ses partenariats avec le Ministère de la Promotion de la Jeunesse, la Mairie de Yopougon et de nombreux acteurs du secteur privé. M. Assim Saba incarne l'excellence, le dévouement et l'engagement au service de la jeunesse ivoirienne.`}
          />
        </div>
      </section>

      {/* Honorable Ben Mamadie */}
      <section className="py-16 lg:py-20">
        <div className="container">
          <ScrollReveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Award className="w-4 h-4" />
              Personnalité Politique
            </div>
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              L'Honorable El Hadj Soumahoro Ben Mamadie
            </h2>
          </ScrollReveal>
          <PersonnaliteCard
            name="El Hadj Soumahoro Ben Mamadie"
            title="Député de la Commune de Yopougon"
            subtitle="Chef de Cabinet de la Mairie de Yopougon en charge de la Jeunesse"
            imageUrl="/images/ben_mamadie.jpg"
            description={`L'Honorable El Hadj Soumahoro Ben Mamadie est un homme d'État d'envergure, élu du peuple et fervent défenseur des intérêts de la jeunesse yopougonnaise. En sa qualité de Député de la commune de Yopougon à l'Assemblée Nationale, il porte les aspirations de ses concitoyens au plus haut niveau de la représentation nationale.

Parallèlement à son mandat parlementaire, l'Honorable Soumahoro occupe les fonctions stratégiques de Chef de Cabinet de la Mairie de Yopougon en charge de la Jeunesse, témoignant de son engagement indéfectible envers le développement et l'épanouissement des jeunes de la commune.

Son parcours exemplaire, jalonné de réalisations concrètes en faveur de l'emploi des jeunes, de l'éducation et du développement communautaire, fait de lui un pilier essentiel de la gouvernance locale. L'Honorable Ben Mamadie est un modèle d'intégrité, de persévérance et de service public pour toute la jeunesse ivoirienne.`}
          />
        </div>
      </section>

      {/* Sanusi Ibrahim - Commissaire aux comptes */}
      <section className="py-16 lg:py-20 bg-secondary/30">
        <div className="container">
          <ScrollReveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Award className="w-4 h-4" />
              Leader de la Jeunesse
            </div>
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              M. Sanusi Ibrahim — Commissaire aux Comptes
            </h2>
          </ScrollReveal>
          <PersonnaliteCard
            name="Sanusi Ibrahim"
            title="Commissaire aux Comptes du District Cité Novalim-CIE"
            subtitle="Commissaire aux Comptes du CCJY"
            imageUrl="/images/sanusi.jpg"
            description={`M. Sanusi Ibrahim est un acteur clé de la gouvernance financière du district Cité Novalim-CIE et du Conseil Communal des Jeunes de Yopougon (CCJY). En tant que Commissaire aux Comptes, il assure avec rigueur et professionnalisme le contrôle de la gestion financière, garantissant transparence et intégrité dans l'utilisation des ressources.

Au-delà de ses fonctions de contrôle, M. Sanusi Ibrahim est un leader de la jeunesse reconnu pour son engagement communautaire, sa probité et sa capacité à mobiliser les jeunes autour de projets à fort impact social. Sa double casquette au sein du district et du CCJY témoigne de la confiance que lui accordent ses pairs et de son dévouement au service de la communauté.

Son expertise en gestion financière et sa vision stratégique contribuent significativement au développement et à la crédibilité des institutions de la jeunesse yopougonnaise.`}
          />
        </div>
      </section>

      {/* Parrain officiel - Abiola Waidi */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container">
          <ScrollReveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Crown className="w-4 h-4" />
              Parrain Officiel du District
            </div>
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              M. Abiola Waidi — PDG de Jumbo Store CI
            </h2>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <ScrollReveal direction="left">
              <div className="flex flex-col items-center gap-6">
                <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-primary/30 w-72 h-80">
                  <img src="/images/abiola_waidi.jpg" alt="M. Abiola Waidi, PDG de Jumbo Store CI" className="w-full h-full object-cover" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-display font-bold text-foreground">Abiola Waidi</h3>
                  <p className="text-primary font-semibold text-sm">PDG — Jumbo Store CI</p>
                  <p className="text-xs text-muted-foreground mt-1">Parrain de la Cérémonie d'Investiture</p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="space-y-5">
                <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Un leader visionnaire au service de la communauté
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>M. Abiola Waidi</strong> est le Président-Directeur Général de <strong>Jumbo Store CI</strong>, une entreprise de premier plan spécialisée dans le <strong>BTP (Bâtiment et Travaux Publics)</strong> et la <strong>commercialisation d'articles d'entreprise</strong> : groupes électrogènes, véhicules, matériel informatique, équipements de forage et bien d'autres solutions professionnelles.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Entrepreneur accompli et homme de cœur, M. Waidi incarne les valeurs d'excellence, de persévérance et d'engagement communautaire. Son parcours exceptionnel, marqué par une ascension fulgurante dans le monde des affaires, fait de lui un modèle inspirant pour la jeunesse ivoirienne.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  En acceptant le <strong>parrainage officiel</strong> de la Cérémonie d'Investiture Conjointe des Districts Cité Novalim-CIE et Franceville, M. Waidi témoigne de sa profonde conviction en la force de la jeunesse organisée et du développement communautaire. <strong>Jumbo Store CI</strong>, sous sa direction éclairée, est un acteur majeur du tissu économique local, pourvoyeur d'emplois et partenaire engagé dans le développement social.
                </p>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-sm text-primary font-medium italic">
                    « Le développement d'une communauté commence par l'engagement de ses leaders envers sa jeunesse. » — Esprit de M. Abiola Waidi
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Identité du district */}
      <section className="py-16 lg:py-20">
        <div className="container">
          <ScrollReveal className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Un district de cités organisées</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Le District Cité Novalim-CIE se distingue par sa composition à 95 % de cités résidentielles, chacune structurée avec son propre bureau et dirigée par un président de cité.
            </p>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Building2, title: "95 % de cités", desc: "Un district essentiellement résidentiel, avec des cités modernes et bien structurées." },
              { icon: Users, title: "87 districts à Yopougon", desc: "Le District Novalim-CIE est l'un des 87 districts de la plus grande commune d'Afrique de l'Ouest." },
              { icon: Shield, title: "Zone 7", desc: "Rattaché à la Zone 7, coordonnée par Koné Yacouba, Vice-Président communal." },
              { icon: MapPin, title: "Emplacement stratégique", desc: "Bordé par les districts Port-Bouët 2, Franceville, Terminus 47 et Base CIE." },
              { icon: Heart, title: "Partenaires santé", desc: "Le Grand Centre, Clinique Vie, Clinique Ste Jeanne de Garcia et plusieurs pharmacies." },
              { icon: Handshake, title: "Partenaires locaux", desc: "Jumbo Store CI (BTP), La Table des Chefs, le Grand CIE, espaces événementiels et autres acteurs." },
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
      <section className="py-16 lg:py-20 bg-secondary/30">
        <div className="container max-w-3xl">
          <ScrollReveal className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Districts limitrophes</h2>
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

      {/* Galerie du District */}
      <section className="py-16 lg:py-20">
        <div className="container max-w-5xl">
          <ScrollReveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Camera className="w-4 h-4" />
              Le District en images
            </div>
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              Notre identité visuelle & nos actions
            </h2>
            <p className="mt-2 text-muted-foreground">Découvrez le visage du District Cité Novalim-CIE et son équipe sur le terrain.</p>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { src: novaOfficial, alt: "Logo officiel District Cité Novalim-CIE", label: "Identité officielle du district" },
              { src: novaAction1, alt: "L'équipe en action", label: "Mobilisation citoyenne" },
              { src: novaAction2, alt: "Coordination terrain", label: "Coordination terrain" },
              { src: novaAction3, alt: "Membres du district", label: "Membres et bureau réunis" },
            ].map((img, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <div className="group rounded-2xl overflow-hidden bg-card border border-border/50 shadow-sm">
                  <div className="relative aspect-[4/3] bg-secondary/50 flex items-center justify-center overflow-hidden">
                    <img src={img.src} alt={img.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-sm text-muted-foreground">{img.label}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Partenaires */}
      <section className="py-16 lg:py-20">
        <div className="container max-w-4xl">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Nos partenaires</h2>
            <p className="mt-2 text-muted-foreground">Un réseau de partenaires de confiance au service des habitants du district.</p>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Santé", items: partenaires.sante, icon: Heart },
              { title: "Pharmacies", items: partenaires.pharmacies, icon: Shield },
              { title: "Partenaires stratégiques", items: partenaires.autres, icon: Handshake },
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
