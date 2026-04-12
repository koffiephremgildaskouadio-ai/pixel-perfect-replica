import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Newspaper, Sparkles, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect } from "react";

const Actualites = () => {
  // Trigger AI news generation on page load (idempotent - backend handles dedup)
  useEffect(() => {
    supabase.functions.invoke("generate-news").catch(() => {});
  }, []);

  const { data: articles, isLoading } = useQuery({
    queryKey: ["actualites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actualites")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const typeIcon = (type: string) => {
    switch (type) {
      case "ai_daily": return <Sparkles className="w-3.5 h-3.5" />;
      case "ministry": return <Newspaper className="w-3.5 h-3.5" />;
      default: return <Calendar className="w-3.5 h-3.5" />;
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "ai_daily": return "IA du Jour";
      case "ministry": return "Min. Jeunesse";
      case "ccjy": return "CCJY";
      case "mairie": return "Mairie";
      default: return "Actualité";
    }
  };

  return (
    <div className="pt-16">
      <section className="py-16 lg:py-24 bg-secondary/50">
        <div className="container">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </Link>
          <ScrollReveal className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">Informations</span>
            <h1 className="mt-3 text-3xl lg:text-5xl font-display font-bold text-foreground leading-tight">
              Fil d'Actualités
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Messages quotidiens, informations du ministère de la Promotion de la Jeunesse, du CCJY et de la Mairie de Yopougon.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-12 lg:py-20">
        <div className="container max-w-3xl space-y-6">
          {isLoading && (
            <>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </>
          )}

          {!isLoading && (!articles || articles.length === 0) && (
            <ScrollReveal>
              <div className="text-center py-16 px-8 rounded-2xl bg-secondary/50 border border-border/50">
                <span className="text-4xl mb-4 block">📰</span>
                <h3 className="text-lg font-semibold text-foreground mb-2">Chargement des actualités...</h3>
                <p className="text-sm text-muted-foreground">Les publications IA arrivent sous peu. Rafraîchissez la page dans quelques instants.</p>
              </div>
            </ScrollReveal>
          )}

          {articles?.map((article, i) => (
            <ScrollReveal key={article.id} delay={i * 60}>
              <article className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      {typeIcon(article.type)}
                      {typeLabel(article.type)}
                    </span>
                    <span>{format(new Date(article.created_at), "d MMMM yyyy · HH:mm", { locale: fr })}</span>
                  </div>
                  <h2 className="text-lg font-display font-bold text-foreground leading-snug">
                    {article.title}
                  </h2>
                  <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {article.content}
                  </div>
                  {article.source && (
                    <p className="text-[10px] text-muted-foreground/60 pt-2">
                      Source : {article.source}
                    </p>
                  )}
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Actualites;
