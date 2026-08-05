import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import { VisitorModal } from "@/components/VisitorModal";
import { SEO } from "@/components/SEO";
import { SiteFooter } from "@/components/SiteFooter";
import {
  ArrowRight, ChevronLeft, ChevronRight, GraduationCap, Briefcase,
  CalendarDays, MapPin, Quote, Handshake,
} from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-district.jpg";
import aboutImage from "@/assets/about-community.jpg";
import action1 from "@/assets/nova_action1.jpg";
import action2 from "@/assets/nova_action2.jpg";
import investiture from "@/assets/investiture_event.jpg";
import logo from "@/assets/logo_novalim.png";
import logoCcjy from "@/assets/logo_ccjy.jpg";
import logoFranceVille from "@/assets/franceville_logo.jpg";
import logoNova from "@/assets/nova_logo_official.jpg";

const slides = [
  {
    image: heroImage,
    title: "District Cité Novalim-CIE",
    subtitle: "La plateforme officielle de notre communauté, Zone 7 du CCJY Yopougon.",
    cta: { label: "Découvrir le District", to: "/a-propos" },
  },
  {
    image: action1,
    title: "Une jeunesse engagée",
    subtitle: "Actions sociales, salubrité, solidarité : nos membres au service des résidents.",
    cta: { label: "Nos activités", to: "/actualites" },
  },
  {
    image: action2,
    title: "Un bureau au service de tous",
    subtitle: "Bureau, cabinet, coordinations et commissions pour piloter le district.",
    cta: { label: "Voir le Bureau", to: "/bureau" },
  },
  {
    image: aboutImage,
    title: "Rejoignez le mouvement",
    subtitle: "Carte de membre digitale, réunions virtuelles et informations en temps réel.",
    cta: { label: "Espace Membre", to: "/connexion" },
  },
];

const partners = [
  { name: "CCJY Yopougon", logo: logoCcjy },
  { name: "District Cité Novalim-CIE", logo: logo },
  { name: "District France-Ville", logo: logoFranceVille },
  { name: "Novalim-City", logo: logoNova },
];

const agenda = [
  { date: "03 Mai 2026", title: "Cérémonie d'investiture des présidents de district", place: "Espace communautaire, Yopougon" },
  { date: "17 Mai 2026", title: "Assemblée générale ordinaire du district", place: "Salle de réunion, Cité Novalim" },
  { date: "07 Juin 2026", title: "Journée de salubrité et de sensibilisation", place: "Cité CIE Novalim-City" },
  { date: "28 Juin 2026", title: "Rencontre partenaires & opérateurs économiques", place: "En ligne (réunion virtuelle)" },
];

const Index = () => {
  const [showModal, setShowModal] = useState(false);
  const [slide, setSlide] = useState(0);

  const next = useCallback(() => setSlide((s) => (s + 1) % slides.length), []);
  const prev = useCallback(() => setSlide((s) => (s - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    const t = setInterval(next, 7000);
    return () => clearInterval(t);
  }, [next]);

  const { data: stats } = useQuery({
    queryKey: ["public-stats"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("public_stats");
      if (error || !data?.[0]) return { members: 0, news: 0, directory: 0 };
      const row = data[0];
      return {
        members: Number(row.members_count ?? 0),
        news: Number(row.news_count ?? 0),
        directory: Number(row.directory_count ?? 0),
      };
    },
  });

  const { data: news } = useQuery({
    queryKey: ["home-news"],
    queryFn: async () => {
      const { data } = await supabase
        .from("actualites")
        .select("id, title, content, image_url, created_at")
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  const { data: president } = useQuery({
    queryKey: ["home-president"],
    queryFn: async () => {
      const { data } = await supabase
        .from("members")
        .select("nom, prenoms, poste, photo_url, bio")
        .ilike("poste", "%président%")
        .limit(5);
      return data?.find((m) => /^pr[ée]sident/i.test(m.poste ?? "")) ?? data?.[0] ?? null;
    },
  });

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
      <SEO
        title="District Cité Novalim-CIE — Plateforme Officielle CCJY Yopougon"
        description="Plateforme officielle du District Cité Novalim-CIE (Zone 7, CCJY Yopougon). Carte de membre digitale, actualités, annuaire, conférences et assistant IA."
        path="/"
      />
      <VisitorModal open={showModal} onSubmit={handleVisitorSubmit} />

      {/* 2. HERO / CARROUSEL */}
      <section className="pt-[84px] pb-6 bg-[hsl(var(--surface-warm))]">
        <div className="container px-3 sm:px-4">
          <div className="relative overflow-hidden rounded-[28px] bg-card ring-1 ring-border shadow-[0_24px_60px_-30px_hsl(var(--foreground)/0.45)] h-[52vh] min-h-[320px] md:h-[62vh]">
            {slides.map((s, i) => (
              <div
                key={s.title}
                className={`absolute inset-0 transition-opacity duration-[900ms] ${i === slide ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              >
                <img src={s.image} alt={s.title} className="w-full h-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[hsl(var(--navy))]/70 to-transparent" />
                <div className="absolute inset-x-4 md:inset-x-16 bottom-16 md:bottom-20">
                  <div className="rounded-2xl bg-[hsl(var(--navy))]/70 backdrop-blur-sm px-5 py-4 md:px-8 md:py-6 text-center">
                    <h1 className="text-lg md:text-3xl font-display font-bold text-navy-foreground leading-snug">
                      {s.title}
                    </h1>
                    <p className="hidden md:block mt-2 text-sm text-navy-foreground/80">{s.subtitle}</p>
                    <Link to={s.cta.to} className="inline-block mt-3">
                      <Button size="sm" className="rounded-full px-5 bg-accent text-accent-foreground hover:bg-accent/90">
                        {s.cta.label}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={prev}
              aria-label="Slide précédent"
              className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-muted/80 backdrop-blur flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              aria-label="Slide suivant"
              className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-muted/80 backdrop-blur flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.title}
                  onClick={() => setSlide(i)}
                  aria-label={`Aller au slide ${i + 1}`}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${i === slide ? "bg-accent scale-110" : "bg-card/70"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* 3. PARTENAIRES */}
      <section className="pb-14 bg-[hsl(var(--surface-warm))]">
        <div className="container px-3 sm:px-4">
          <div className="rounded-[28px] bg-navy text-navy-foreground px-5 py-10 md:px-12 md:py-12">
            <div className="text-center mb-8">
              <p className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.25em] text-navy-foreground/70">
                Partenaires &amp; soutiens institutionnels
              </p>
              <div className="mx-auto mt-4 h-px w-24 bg-navy-foreground/20" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              {partners.map((p) => (
                <div
                  key={p.name}
                  className="flex flex-col items-center justify-center gap-2 w-32 md:w-40 rounded-2xl bg-card p-4 shadow-sm"
                  title={p.name}
                >
                  <img src={p.logo} alt={`Logo ${p.name}`} className="h-14 max-w-full object-contain" loading="lazy" />
                  <span className="text-[11px] text-center text-muted-foreground leading-tight">{p.name}</span>
                </div>
              ))}
              <Link
                to="/annuaire"
                className="flex flex-col items-center justify-center gap-2 w-32 md:w-40 min-h-[112px] rounded-2xl border-2 border-dashed border-navy-foreground/40 text-navy-foreground/90 hover:bg-navy-foreground/10 transition-colors p-4"
              >
                <Handshake className="w-5 h-5" />
                <span className="text-xs font-medium text-center underline underline-offset-4">Devenir partenaire</span>
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* 4. MOT DU PRÉSIDENT */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-[380px_1fr] gap-10 items-center">
            <ScrollReveal direction="left">
              <div className="rounded-3xl overflow-hidden border border-border shadow-lg bg-card">
                <img
                  src={president?.photo_url || aboutImage}
                  alt={president ? `${president.prenoms} ${president.nom}` : "Président du district"}
                  className="w-full h-[380px] object-cover"
                  loading="lazy"
                />
                <div className="p-5 text-center">
                  <p className="font-display font-bold text-lg text-foreground">
                    {president ? `${president.prenoms} ${president.nom}` : "Le Président du District"}
                  </p>
                  <p className="text-sm text-accent font-medium mt-1">
                    {president?.poste || "Président du District Cité Novalim-CIE"}
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <div className="space-y-5">
                <span className="text-sm font-semibold text-accent tracking-wide uppercase">Mot du Président</span>
                <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground leading-tight">
                  Bienvenue sur la plateforme de notre district
                </h2>
                <div className="relative pl-8">
                  <Quote className="absolute left-0 top-1 w-5 h-5 text-accent" />
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                      {president?.bio ||
                        "Chers membres, chers partenaires, chers résidents, cette plateforme est le reflet de notre ambition commune : un district organisé, solidaire et tourné vers l'avenir. Elle rassemble en un seul lieu l'identification de nos membres, l'information officielle et les outils de travail de notre bureau."}
                    </p>
                    <p>
                      Ensemble, faisons du District Cité Novalim-CIE une référence au sein du Conseil
                      Communal des Jeunes de Yopougon et de la commune tout entière.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2 max-w-lg">
                  {[
                    { value: stats ? `${stats.members}+` : "…", label: "Membres" },
                    { value: stats ? `${stats.news}` : "…", label: "Publications" },
                    { value: stats ? `${stats.directory}` : "…", label: "Partenaires" },
                  ].map((s) => (
                    <div key={s.label} className="text-center p-4 rounded-2xl bg-card border border-border shadow-sm">
                      <div className="text-2xl font-display font-bold text-primary">{s.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
                <Link to="/bureau">
                  <Button size="lg" className="mt-2 gap-2">
                    Découvrir le Bureau &amp; le Cabinet
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 5. OPPORTUNITÉS */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <ScrollReveal className="text-center max-w-xl mx-auto mb-12">
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">Opportunités</span>
            <h2 className="mt-3 text-3xl lg:text-4xl font-display font-bold text-foreground leading-tight">
              Formations &amp; emplois pour nos membres
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: GraduationCap,
                title: "Offres de formations",
                empty: "Aucune offre de formation disponible pour le moment. Les prochaines sessions seront publiées ici.",
              },
              {
                icon: Briefcase,
                title: "Offres d'emplois & opportunités",
                empty: "Aucune offre d'emploi disponible pour le moment. Restez connectés au fil d'actualités.",
              },
            ].map((b, i) => (
              <ScrollReveal key={b.title} delay={i * 100}>
                <div className="h-full p-8 rounded-3xl bg-card border border-border shadow-sm hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <b.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-foreground mb-3">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.empty}</p>
                  <Link to="/actualites">
                    <Button variant="outline" size="sm" className="mt-6 gap-2">
                      Voir les publications
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. ACTUALITÉS */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-sm font-semibold text-primary tracking-wide uppercase">Actualités</span>
              <h2 className="mt-2 text-3xl lg:text-4xl font-display font-bold text-foreground">
                Les dernières informations du district
              </h2>
            </div>
            <Link to="/actualites">
              <Button variant="outline" className="gap-2">
                Toutes les actualités
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {(news?.length ? news : []).map((n, i) => (
              <ScrollReveal key={n.id} delay={i * 90}>
                <article className="h-full rounded-3xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
                  <img
                    src={n.image_url || investiture}
                    alt={n.title}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                  <div className="p-6 flex flex-col flex-1">
                    <time className="text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </time>
                    <h3 className="mt-2 text-lg font-semibold text-foreground line-clamp-2">{n.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3 flex-1">{n.content}</p>
                    <Link to="/actualites" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-accent transition-colors">
                      Lire l'actualité <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              </ScrollReveal>
            ))}
            {!news?.length && (
              <p className="text-muted-foreground">Aucune actualité publiée pour le moment.</p>
            )}
          </div>
        </div>
      </section>

      {/* 7. ÉVÉNEMENT PHARE */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <ScrollReveal>
            <div className="grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-border shadow-lg bg-card">
              <img src={investiture} alt="Cérémonie d'investiture" className="w-full h-full min-h-[280px] object-cover" loading="lazy" />
              <div className="p-8 lg:p-12 space-y-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wide">
                  Événement phare
                </span>
                <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground leading-tight">
                  Cérémonie d'investiture des Présidents de District
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Investiture officielle des présidents du District Cité Novalim-CIE et du District
                  France-Ville, en présence des autorités du Conseil Communal des Jeunes de Yopougon.
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2"><CalendarDays className="w-4 h-4 text-accent" /> 03 Mai 2026</span>
                  <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" /> Yopougon, Abidjan</span>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link to="/connexion">
                    <Button size="lg" className="gap-2">
                      S'inscrire à l'événement
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/actualites">
                    <Button variant="outline" size="lg">En savoir plus</Button>
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 8. AGENDA */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-sm font-semibold text-primary tracking-wide uppercase">Agenda</span>
              <h2 className="mt-2 text-3xl lg:text-4xl font-display font-bold text-foreground">
                Prochaines activités
              </h2>
            </div>
            <Link to="/actualites">
              <Button variant="outline" className="gap-2">
                Voir tout l'agenda
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {agenda.map((a, i) => (
              <ScrollReveal key={a.title} delay={i * 70}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                  <div className="shrink-0 w-full sm:w-40 px-4 py-3 rounded-xl bg-primary/10 text-primary text-sm font-semibold text-center">
                    {a.date}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{a.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground inline-flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-accent" /> {a.place}
                    </p>
                  </div>
                  <Link to="/conference">
                    <Button variant="ghost" size="sm" className="gap-1 text-primary">
                      Participer <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
};

export default Index;
