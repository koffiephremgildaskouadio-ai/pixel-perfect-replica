import { QRCodeSVG } from "qrcode.react";
import logo from "@/assets/logo_novalim.png";

interface VirtualCardProps {
  memberNumber: string;
  nom: string;
  prenoms: string;
  poste: string | null;
  quartier: string | null;
  category: string;
  memberId: string;
}

export const VirtualCard = ({
  memberNumber,
  nom,
  prenoms,
  poste,
  quartier,
  category,
  memberId,
}: VirtualCardProps) => {
  const cardUrl = `${window.location.origin}/carte/${memberId}`;
  const initials = `${nom[0]}${prenoms[0]}`;
  const categoryLabel =
    category === "bureau"
      ? "Bureau Exécutif"
      : category === "cabinet"
        ? "Cabinet"
        : "Membre";

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="relative rounded-2xl overflow-hidden bg-card border border-border/50 shadow-xl">
        {/* Top accent bar */}
        <div className="h-2 bg-gradient-to-r from-primary via-primary to-accent" />

        {/* Header with logo & org name */}
        <div className="bg-primary px-5 py-4 flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-11 h-11 object-contain rounded-lg bg-white/90 p-0.5" />
          <div>
            <p className="text-primary-foreground font-display font-bold text-sm leading-tight">
              Conseil Communal des Jeunes
            </p>
            <p className="text-primary-foreground/70 text-xs">
              District Cité Novalim-CIE · Yopougon
            </p>
          </div>
        </div>

        {/* Member info */}
        <div className="px-5 pt-5 pb-4 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-display font-bold text-primary shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-foreground text-lg leading-tight">
                {nom} {prenoms}
              </h3>
              {poste && (
                <p className="text-accent font-semibold text-sm mt-0.5">{poste}</p>
              )}
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                {categoryLabel}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-secondary">
              <span className="text-muted-foreground block">N° Membre</span>
              <span className="font-mono font-semibold text-foreground">{memberNumber}</span>
            </div>
            {quartier && (
              <div className="p-2.5 rounded-lg bg-secondary">
                <span className="text-muted-foreground block">Quartier</span>
                <span className="font-semibold text-foreground">{quartier}</span>
              </div>
            )}
          </div>
        </div>

        {/* QR Code */}
        <div className="px-5 pb-5">
          <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/70 border border-border/30">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <QRCodeSVG
                value={cardUrl}
                size={72}
                level="M"
                fgColor="hsl(140, 55%, 22%)"
                includeMargin={false}
              />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Scannez pour vérifier</p>
              <p>Ce QR code renvoie vers la fiche publique de ce membre.</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="h-1.5 bg-gradient-to-r from-accent via-accent to-primary" />
      </div>
    </div>
  );
};
