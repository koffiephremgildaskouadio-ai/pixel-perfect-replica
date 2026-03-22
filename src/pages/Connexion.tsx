import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import logo from "@/assets/logo_novalim.png";

const Connexion = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Supabase auth
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className="pt-16 min-h-screen flex items-center justify-center bg-secondary/30">
      <div className="container max-w-md py-16">
        <ScrollReveal>
          <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4">
                <span className="text-primary-foreground font-display font-bold text-lg">NC</span>
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground">Espace Membre</h1>
              <p className="text-sm text-muted-foreground">Connectez-vous pour accéder à votre espace personnel.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Adresse email
                </label>
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Mot de passe
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? "Connexion..." : "Se connecter"}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Pas encore membre ?{" "}
              <Link to="/" className="text-primary font-medium hover:underline">
                Contactez l'administration
              </Link>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default Connexion;
