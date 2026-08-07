import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, UserPlus, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import logo from "@/assets/logo_novalim.png";

const Connexion = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const navigate = useNavigate();

  // Si une session existe déjà, on entre directement.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate("/membres", { replace: true });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/membres", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handleGoogle = async () => {
    setIsLoading(true);
    try {
      const result: any = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result?.error) throw result.error;
    } catch (err: any) {
      toast.error(err?.message || "Connexion Google indisponible");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          // Compte inexistant → on crée le compte automatiquement
          if (/invalid login credentials/i.test(error.message)) {
            const { error: upErr } = await supabase.auth.signUp({
              email: email.trim(),
              password,
              options: { emailRedirectTo: window.location.origin },
            });
            if (upErr) throw upErr;
            toast.success("Compte créé et connexion réussie !");
            navigate("/membres");
            return;
          }
          throw error;
        }
        toast.success("Connexion réussie !");
        navigate("/membres");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          await supabase.auth.signInWithPassword({ email: email.trim(), password });
        }
        toast.success("Bienvenue ! Votre compte est actif.");
        navigate("/membres");
      }
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) return toast.error("Entrez votre adresse email d'abord.");
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Email de réinitialisation envoyé !");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'envoi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-16 min-h-screen flex items-center justify-center bg-hero-gradient">
      <div className="container max-w-md py-14">
        <ScrollReveal>
          <div className="bg-card/90 backdrop-blur rounded-3xl border border-border/50 shadow-xl p-7 sm:p-9 space-y-6">
            <div className="text-center space-y-2">
              <img src={logo} alt="Logo District Cité Novalim-CIE" className="mx-auto w-16 h-16 object-contain" />
              <h1 className="text-2xl font-display font-bold text-foreground">
                {mode === "login" ? "Espace Membre" : "Créer un compte"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Accès immédiat — email et mot de passe suffisent.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full rounded-full"
              onClick={handleGoogle}
              disabled={isLoading}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
                <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.3 7.4 24 12 24z" />
                <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.6.4-2.4V6.6H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.4l4-3z" />
                <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.6l4 3.1c.9-2.8 3.5-4.9 6.6-4.9z" />
              </svg>
              Continuer avec Google
            </Button>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">ou</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" /> Adresse email
                </label>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" /> Mot de passe
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder="6 caractères minimum"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Afficher le mot de passe"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === "login" && (
                  <button type="button" onClick={handleResetPassword} className="text-xs text-primary hover:underline">
                    Mot de passe oublié ?
                  </button>
                )}
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full rounded-full" disabled={isLoading}>
                {isLoading ? "Un instant…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
                {!isLoading && (mode === "login" ? <ArrowRight className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />)}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  Pas encore de compte ?{" "}
                  <button type="button" onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">
                    S'inscrire en 10 secondes
                  </button>
                </>
              ) : (
                <>
                  Déjà inscrit ?{" "}
                  <button type="button" onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                    Se connecter
                  </button>
                </>
              )}
            </p>

            <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Accès sécurisé, sans confirmation par email.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default Connexion;
