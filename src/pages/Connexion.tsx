import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo_novalim.png";

const Connexion = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [nom, setNom] = useState("");
  const [prenoms, setPrenoms] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Connexion réussie !");
      navigate("/membres");
    } catch (err: any) {
      toast.error(err.message || "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      toast.error("Veuillez entrer votre adresse email d'abord.");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Un email de réinitialisation a été envoyé !");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'envoi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !prenoms.trim()) {
      toast.error("Veuillez remplir votre nom et prénoms.");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nom: nom.trim(), prenoms: prenoms.trim() } },
      });
      if (error) throw error;
      toast.success("Inscription réussie ! Vérifiez votre email pour confirmer votre compte.");
      setMode("login");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-16 min-h-screen flex items-center justify-center bg-secondary/30">
      <div className="container max-w-md py-16">
        <ScrollReveal>
          <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-8 space-y-6">
            <div className="text-center space-y-2">
              <img src={logo} alt="Logo Novalim-City" className="mx-auto w-16 h-16 object-contain mb-4" />
              <h1 className="text-2xl font-display font-bold text-foreground">
                {mode === "login" ? "Espace Membre" : "Créer un compte"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {mode === "login"
                  ? "Connectez-vous pour accéder à votre espace personnel."
                  : "Inscrivez-vous pour rejoindre la communauté."}
              </p>
            </div>

            <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nom</label>
                    <Input
                      placeholder="Votre nom de famille"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Prénoms</label>
                    <Input
                      placeholder="Vos prénoms"
                      value={prenoms}
                      onChange={(e) => setPrenoms(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}
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
                  minLength={6}
                />
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-xs text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                {isLoading
                  ? mode === "login"
                    ? "Connexion..."
                    : "Inscription..."
                  : mode === "login"
                    ? "Se connecter"
                    : "S'inscrire"}
                {!isLoading &&
                  (mode === "login" ? (
                    <ArrowRight className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  ))}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  Pas encore membre ?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="text-primary font-medium hover:underline"
                  >
                    Créer un compte
                  </button>
                </>
              ) : (
                <>
                  Déjà un compte ?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-primary font-medium hover:underline"
                  >
                    Se connecter
                  </button>
                </>
              )}
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default Connexion;
