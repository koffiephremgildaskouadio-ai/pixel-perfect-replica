import { ScrollReveal } from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const Membres = () => (
  <div className="pt-16">
    <section className="py-16 lg:py-24 bg-secondary/50">
      <div className="container">
        <ScrollReveal className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-primary tracking-wide uppercase">Communauté</span>
          <h1 className="mt-3 text-3xl lg:text-5xl font-display font-bold text-foreground leading-tight">
            Base de Données des Membres
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Consultez le répertoire des membres du district.
          </p>
        </ScrollReveal>
      </div>
    </section>
    <section className="py-16 lg:py-24">
      <div className="container max-w-md">
        <ScrollReveal>
          <div className="text-center py-16 px-8 rounded-2xl bg-card border border-border/50 shadow-sm space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Lock className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Accès réservé</h3>
            <p className="text-sm text-muted-foreground">
              Connectez-vous en tant que membre pour accéder au répertoire complet.
            </p>
            <Link to="/connexion">
              <Button variant="default" size="lg" className="mt-2">
                Se connecter
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  </div>
);

export default Membres;
