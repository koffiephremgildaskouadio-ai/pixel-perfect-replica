import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo_novalim.png";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setIsReady(true);
    }
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsReady(true);
      }
    });
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Mot de passe mis à jour avec succès !");
      navigate("/membres");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la réinitialisation");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isReady) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="container max-w-md py-16 text-center">
          <p className="text-muted-foreground">Lien de réinitialisation invalide ou expiré.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen flex items-center justify-center bg-secondary/30">
      <div className="container max-w-md py-16">
        <ScrollReveal>
          <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-8 space-y-6">
            <div className="text-center space-y-2">
              <img src={logo} alt="Logo" className="mx-auto w-16 h-16 object-contain mb-4" />
              <h1 className="text-2xl font-display font-bold text-foreground">
                Nouveau mot de passe
              </h1>
              <p className="text-sm text-muted-foreground">
                Entrez votre nouveau mot de passe.
              </p>
            </div>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Nouveau mot de passe
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? "Mise à jour..." : "Mettre à jour"}
              </Button>
            </form>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default ResetPassword;
