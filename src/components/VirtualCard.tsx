import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import logo from "@/assets/logo_novalim.png";
import { RotateCw } from "lucide-react";

interface VirtualCardProps {
  memberNumber: string;
  nom: string;
  prenoms: string;
  poste: string | null;
  quartier: string | null;
  phone: string | null;
  category: string;
  memberId: string;
}

export const VirtualCard = ({
  memberNumber,
  nom,
  prenoms,
  poste,
  quartier,
  phone,
  category,
  memberId,
}: VirtualCardProps) => {
  const [flipped, setFlipped] = useState(false);
  const cardUrl = `${window.location.origin}/carte/${memberId}`;
  const initials = `${nom?.[0] ?? ""}${prenoms?.[0] ?? ""}`;
  const categoryLabel =
    category === "bureau"
      ? "Bureau Exécutif"
      : category === "cabinet"
        ? "Cabinet"
        : category === "coordonnateur"
          ? "Coordonnateur"
          : "Membre";

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Flip container */}
      <div
        className="relative cursor-pointer"
        style={{ perspective: "1200px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="relative w-full transition-transform duration-700"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            aspectRatio: "85.6 / 54",
          }}
        >
          {/* ===== RECTO (Front) ===== */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl border border-border/40"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="h-full flex flex-col bg-card">
              {/* Top accent */}
              <div className="h-1.5 bg-gradient-to-r from-primary via-primary to-accent" />

              {/* Header band */}
              <div className="bg-primary px-4 py-2.5 flex items-center gap-2.5">
                <img
                  src={logo}
                  alt="Logo"
                  className="w-9 h-9 object-contain rounded-lg bg-white/90 p-0.5"
                />
                <div className="min-w-0">
                  <p className="text-primary-foreground font-display font-bold text-[11px] leading-tight truncate">
                    Conseil Communal des Jeunes de Yopougon
                  </p>
                  <p className="text-primary-foreground/60 text-[9px] truncate">
                    District Cité Novalim-CIE
                  </p>
                </div>
              </div>

              {/* Member info body */}
              <div className="flex-1 px-4 py-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-base font-display font-bold text-primary shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-bold text-foreground text-sm leading-tight truncate">
                    {nom} {prenoms}
                  </h3>
                  {poste && (
                    <p className="text-primary font-semibold text-[10px] mt-0.5 leading-snug line-clamp-2">
                      {poste}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-medium">
                      {categoryLabel}
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {memberNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="px-4 pb-2.5 flex items-center justify-between text-[9px] text-muted-foreground">
                {phone && <span>📞 {phone}</span>}
                {quartier && <span>📍 {quartier}</span>}
              </div>

              {/* Bottom accent */}
              <div className="h-1 bg-gradient-to-r from-accent via-accent to-primary" />
            </div>

            {/* Flip hint */}
            <div className="absolute bottom-2 right-2 p-1 rounded-full bg-secondary/80 text-muted-foreground">
              <RotateCw className="w-3 h-3" />
            </div>
          </div>

          {/* ===== VERSO (Back) ===== */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl border border-border/40"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="h-full flex flex-col bg-card">
              <div className="h-1.5 bg-gradient-to-r from-accent via-primary to-accent" />

              {/* Centered QR code */}
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-border/30">
                  <QRCodeSVG
                    value={cardUrl}
                    size={110}
                    level="M"
                    fgColor="hsl(140, 55%, 22%)"
                    includeMargin={false}
                  />
                </div>
                <div className="text-center space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">
                    Scannez pour vérifier
                  </p>
                  <p className="text-[9px] text-muted-foreground leading-snug">
                    Ce QR code renvoie vers la fiche officielle de ce membre
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 pb-2.5 text-center">
                <p className="text-[8px] text-muted-foreground">
                  Carte officielle · CCJY District Cité Novalim-CIE · Yopougon
                </p>
              </div>
              <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
            </div>

            {/* Flip hint */}
            <div className="absolute bottom-2 right-2 p-1 rounded-full bg-secondary/80 text-muted-foreground">
              <RotateCw className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-muted-foreground mt-3">
        Cliquez sur la carte pour la retourner
      </p>
    </div>
  );
};
