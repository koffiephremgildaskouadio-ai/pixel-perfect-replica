import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import { VisitorModal } from "@/components/VisitorModal";
import { Users, Newspaper, MessageCircle, Shield, ArrowRight, Info } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-district.jpg";
import aboutImage from "@/assets/about-community.jpg";
import logo from "@/assets/logo_novalim.png";
import logoCcjy from "@/assets/logo_ccjy.jpg";

const features = [
  {
    icon: Users,
    title: "Identification Digitale",
    description: "Cartes virtuelles avec QR code pour chaque membre du district.",
    link: "/membres",
  },
  {
    icon: Newspaper,
    title: "Actualités Officielles",
    description: "Restez informé des dernières nouvelles et activités du district.",
    link: "/actualites",
  },
  {
    icon: MessageCircle,
    title: "Chat Communautaire",
    description: "Posez vos questions et échangez avec l'assistant IA du district.",
    link: "/chat",
  },
  {
    icon: Shield,
    title: "Espace Sécurisé",
    description: "Base de données protégée et accès contrôlé par rôle.",
    link: "/connexion",
  },
];

const Index = () => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const visited = sessionStorage.getItem("novalim_visitor");
    if (!visited) setShowModal(true);
  }, []);

  const handleVisitorSubmit = (nom: string, prenoms: string) => {
    sessionStorage.setItem("novalim_visitor", JSON.stringify({ nom, prenoms }));
    setShowModal(false);
  };

  return (
    <>
      <VisitorModal open={showModal} onSubmit={handleVisitorSubmit} />

      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Vue aérienne du district Novalim-City" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[hsl(var(--hero-overlay))]/70" />
        </div>
        <div className="container relative z-10 py-32 lg:py-40">
          <div className="max-w-2xl space-y-6">
            <div
              className="opacity-0 animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary-foreground/90 text-sm font-medium backdrop-blur-sm border border-primary/20">
                District Cité Novalim-CIE
              </span>
            </div>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground leading-[1.1] opacity-0 animate-fade-up"
              style={{ animationDelay: "250ms" }}
            >
              Votre communauté,
              <br />connectée.
            </h1>
            <p
              className="text-lg text-primary-foreground/75 max-w-lg leading-relaxed opacity-0 animate-fade-up"
              style={{ animationDelay: "400ms" }}
            >
              Plateforme officielle du District Cité Novalim-CIE. Identification, communication
              et engagement de tous les membres.
            </p>
            <div
              className="flex flex-wrap gap-3 pt-2 opacity-0 animate-fade-up"
              style={{ animationDelay: "550ms" }}
            >
              <Link to="/bureau">
                <Button variant="hero" size="xl">
                  Découvrir le Bureau
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/connexion">
                <Button variant="hero-outline" size="xl" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  Espace Membre
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container">
          <ScrollReveal className="text-center max-w-xl mx-auto mb-16">
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">Nos services</span>
            <h2 className="mt-3 text-3xl lg:text-4xl font-display font-bold text-foreground leading-tight">
              Tout ce dont vous avez besoin
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Une plateforme complète pour la gestion et l'engagement communautaire du district.
            </p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <ScrollReveal key={feature.title} delay={i * 80}>
                <Link to={feature.link}>
                  <div className="group p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-24 lg:py-32 bg-secondary/50">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <ScrollReveal direction="left">
              <div className="space-y-6">
                <div className="rounded-2xl overflow-hidden shadow-xl">
                  <img src={aboutImage} alt="Communauté Novalim-City" className="w-full h-80 lg:h-96 object-cover" />
                </div>
                <div className="flex items-center justify-center gap-6">
                  <img src={logo} alt="Logo District" className="w-16 h-16 object-contain" />
                  <img src={logoCcjy} alt="Logo CCJY" className="w-16 h-16 object-contain rounded-lg" />
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <div className="space-y-5">
                <span className="text-sm font-semibold text-accent tracking-wide uppercase">Notre mission</span>
                <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground leading-tight">
                  Unir et servir notre communauté
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Le District Cité Novalim-CIE est l'un des <strong>87 districts</strong> et 11 villages
                  de la commune de Yopougon, rattaché au <strong>Conseil Communal des Jeunes de Yopougon (CCJY)</strong>.
                  Composé à 95 % de cités résidentielles, notre district se distingue par une organisation
                  exemplaire, chaque cité étant dirigée par un président élu.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Membre de la <strong>Zone 7</strong>, nous bénéficions d'un réseau de partenaires
                  sanitaires de qualité et d'acteurs économiques engagés pour le bien-être de nos résidents.
                </p>
                <div className="grid grid-cols-3 gap-4 pt-4">
                  {[
                    { value: "1000+", label: "Membres" },
                    { value: "Zone 7", label: "CCJY" },
                    { value: "95%", label: "Cités" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-3 rounded-xl bg-card border border-border/50">
                      <div className="text-2xl font-display font-bold text-primary">{stat.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <Link to="/a-propos">
                  <Button variant="outline" size="lg" className="mt-4 gap-2">
                    <Info className="w-4 h-4" />
                    En savoir plus
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32">
        <div className="container">
          <ScrollReveal>
            <div className="relative rounded-3xl bg-primary overflow-hidden px-8 py-16 lg:py-20 text-center">
              <div className="relative z-10 max-w-lg mx-auto space-y-5">
                <h2 className="text-3xl lg:text-4xl font-display font-bold text-primary-foreground leading-tight">
                  Rejoignez le mouvement
                </h2>
                <p className="text-primary-foreground/75 leading-relaxed">
                  Contactez l'administration pour devenir membre officiel et recevoir votre carte d'identification digitale.
                </p>
                <Link to="/connexion">
                  <Button
                    size="xl"
                    className="bg-card text-primary hover:bg-card/90 shadow-lg mt-2"
                  >
                    Devenir Membre
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="Logo Novalim-City" className="w-9 h-9 object-contain" />
              <span className="font-display font-semibold text-foreground">CIE Novalim-City</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} District Cité Novalim-CIE. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Index;
