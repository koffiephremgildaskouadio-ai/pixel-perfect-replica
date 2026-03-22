import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface VisitorModalProps {
  open: boolean;
  onSubmit: (nom: string, prenoms: string) => void;
}

export const VisitorModal = ({ open, onSubmit }: VisitorModalProps) => {
  const [nom, setNom] = useState("");
  const [prenoms, setPrenoms] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nom.trim() && prenoms.trim()) {
      onSubmit(nom.trim(), prenoms.trim());
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md border-none shadow-2xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="text-3xl">🏘️</span>
          </div>
          <DialogTitle className="text-2xl font-display">
            Bienvenue à CIE Novalim-City
          </DialogTitle>
          <p className="text-muted-foreground text-sm">
            Pour accéder au portail, veuillez vous identifier.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
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
          <Button type="submit" variant="hero" size="lg" className="w-full">
            Entrer sur le portail
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
