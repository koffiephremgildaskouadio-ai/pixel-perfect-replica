import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { PortalNav } from "@/components/PortalNav";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SiteFooter } from "@/components/SiteFooter";
import { STATIC_PORTALS, mapDynamicPortal, type PortalEntry } from "@/lib/portals";
import { ArrowRight, LayoutGrid } from "lucide-react";

const Portails = () => {
  const { data: dynamic } = useQuery({
    queryKey: ["all-portals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("portals")
        .select("slug,title,subtitle,description,logo_url,cover_url,external_url,show_in_menu")
        .eq("is_published", true)
        .order("display_order", { ascending: true });
      return (data ?? []) as any[];
    },
  });

  const portals: PortalEntry[] = [...STATIC_PORTALS, ...((dynamic ?? []).map(mapDynamicPortal))];


  return (
    <div className="pt-16">
      <SEO
        title="Nos portails — District Cité Novalim-CIE"
        description="Accédez à tous les portails du District Cité Novalim-CIE : bureau, membres, annuaire, conférences, actualités et District France-Ville."
        path="/portails"
      />
      <PortalNav />

      <section className="py-14 lg:py-20 bg-secondary/40">
        <div className="container text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent uppercase tracking-wide">
            <LayoutGrid className="w-4 h-4" /> Nos portails
          </span>
          <h1 className="mt-3 text-3xl lg:text-5xl font-display font-bold text-foreground leading-tight">
            Tous les espaces du district
          </h1>
          <p className="mt-4 text-muted-foreground">
            Chaque portail dispose de sa page dédiée avec ses informations, ses membres et ses services.
          </p>
          <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-gradient-to-r from-primary to-accent" />
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {portals.map((p, i) => (
            <ScrollReveal key={p.slug} delay={i * 60}>
              <Link
                to={p.path}
                className="group relative block h-full rounded-3xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-[0_24px_50px_-24px_hsl(var(--primary)/0.55)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
                <div className="relative p-6 flex flex-col gap-4 h-full">
                  <div className="w-16 h-16 rounded-2xl bg-secondary ring-1 ring-border overflow-hidden flex items-center justify-center">
                    <img src={p.logo_url} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-lg font-bold text-foreground leading-tight">{p.title}</h2>
                    <p className="text-xs text-accent font-medium mt-1">{p.subtitle}</p>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">{p.description}</p>
                  </div>
                  {p.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.highlights.map((h) => (
                        <span key={h} className="text-[11px] px-2 py-1 rounded-full bg-secondary text-muted-foreground border border-border">
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    Ouvrir le portail <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
                <span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary via-accent to-primary scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Portails;
