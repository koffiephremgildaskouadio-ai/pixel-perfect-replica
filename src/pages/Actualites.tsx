import { ScrollReveal } from "@/components/ScrollReveal";

const Actualites = () => (
  <div className="pt-16">
    <section className="py-16 lg:py-24 bg-secondary/50">
      <div className="container">
        <ScrollReveal className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-primary tracking-wide uppercase">Informations</span>
          <h1 className="mt-3 text-3xl lg:text-5xl font-display font-bold text-foreground leading-tight">
            Actualités
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Les dernières nouvelles et activités du District Cité Novalim-CIE.
          </p>
        </ScrollReveal>
      </div>
    </section>
    <section className="py-16 lg:py-24">
      <div className="container max-w-2xl">
        <ScrollReveal>
          <div className="text-center py-16 px-8 rounded-2xl bg-secondary/50 border border-border/50">
            <span className="text-4xl mb-4 block">📰</span>
            <h3 className="text-lg font-semibold text-foreground mb-2">Aucune actualité pour le moment</h3>
            <p className="text-sm text-muted-foreground">Les publications apparaîtront ici une fois publiées par l'administration.</p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  </div>
);

export default Actualites;
