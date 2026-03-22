import { ScrollReveal } from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

const Chat = () => (
  <div className="pt-16">
    <section className="py-16 lg:py-24 bg-secondary/50">
      <div className="container">
        <ScrollReveal className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-primary tracking-wide uppercase">Communication</span>
          <h1 className="mt-3 text-3xl lg:text-5xl font-display font-bold text-foreground leading-tight">
            Chat Communautaire
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Posez vos questions et échangez avec l'administration du district.
          </p>
        </ScrollReveal>
      </div>
    </section>
    <section className="py-16 lg:py-24">
      <div className="container max-w-md">
        <ScrollReveal>
          <div className="text-center py-16 px-8 rounded-2xl bg-card border border-border/50 shadow-sm space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Connectez-vous pour discuter</h3>
            <p className="text-sm text-muted-foreground">
              Le chat est accessible uniquement aux membres enregistrés du district.
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

export default Chat;
