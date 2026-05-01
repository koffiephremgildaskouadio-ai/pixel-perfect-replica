import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { RotateCw } from "lucide-react";
import logoNova from "@/assets/nova_logo_official.jpg";
import tampon from "@/assets/tampon.png";
import signature from "@/assets/signature.png";

interface VirtualCardProps {
  memberNumber: string;
  nom: string;
  prenoms: string;
  poste: string | null;
  quartier: string | null;
  phone: string | null;
  category: string;
  memberId: string;
  photoUrl?: string | null;
  email?: string | null;
}

const SITE_URL = typeof window !== "undefined" ? window.location.origin : "https://districtcitenovalim-cie.lovable.app";
const FACEBOOK_URL = "https://web.facebook.com/DistrictCiteNovalimCIE/";

export const VirtualCard = ({
  memberNumber,
  nom,
  prenoms,
  poste,
  phone,
  memberId,
  photoUrl,
  email,
}: VirtualCardProps) => {
  const [flipped, setFlipped] = useState(false);
  const cardUrl = `${SITE_URL}/carte/${memberId}`;
  const initials = `${nom?.[0] ?? ""}${prenoms?.[0] ?? ""}`;
  const validite = "2025 - 2026";
  // Card number format: JY-NC/XXXX (4 digits) extracted from member_number
  const numericPart = (memberNumber.match(/(\d+)/g)?.pop() ?? "0001").padStart(4, "0");
  const displayNumber = `JY-NC/${numericPart}`;

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className="relative cursor-pointer"
        style={{ perspective: "1400px" }}
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
          {/* ===== RECTO ===== */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl"
            style={{
              backfaceVisibility: "hidden",
              backgroundColor: "#fdf6e3",
            }}
          >
            {/* Watermark logo background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <img
                src={logoNova}
                alt=""
                className="w-[70%] opacity-10 object-contain"
              />
            </div>

            <div className="relative h-full flex flex-col p-3">
              {/* Header */}
              <div className="flex items-start gap-2">
                <img
                  src={logoNova}
                  alt="Logo District"
                  className="w-12 h-12 object-contain shrink-0"
                />
                <div className="flex-1 text-center">
                  <p
                    className="font-bold text-[10px] leading-tight"
                    style={{ color: "#d97706" }}
                  >
                    CONSEIL COMMUNAL DE LA JEUNESSE DE YOPOUGON
                  </p>
                  <p
                    className="font-bold text-[12px] leading-tight mt-0.5"
                    style={{ color: "#15803d" }}
                  >
                    DISTRICT CITÉ NOVALIM - CIE
                  </p>
                  <p
                    className="font-semibold text-[9px] mt-0.5"
                    style={{ color: "#dc2626" }}
                  >
                    CARTE DE MEMBRE N° {displayNumber}
                  </p>
                </div>
                <div className="w-12 h-12 shrink-0 flex items-center justify-center text-[7px] text-center font-bold text-green-800 border border-green-700/30 rounded">
                  RCI
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 flex gap-3 mt-2">
                {/* Photo */}
                <div className="relative shrink-0">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={`${nom} ${prenoms}`}
                      className="w-[88px] h-[110px] object-cover rounded border border-foreground/20"
                    />
                  ) : (
                    <div className="w-[88px] h-[110px] rounded bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary border border-foreground/20">
                      {initials}
                    </div>
                  )}
                  {/* Stamp overlay on photo bottom-left */}
                  <img
                    src={tampon}
                    alt=""
                    className="absolute -bottom-2 -left-2 w-14 h-14 object-contain opacity-90"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-[11px] leading-tight space-y-1">
                  <div>
                    <p className="font-bold text-foreground/70 text-[10px]">Nom</p>
                    <p className="font-bold text-foreground text-[13px] uppercase truncate">{nom}</p>
                  </div>
                  <div>
                    <p className="font-bold text-green-800 text-[10px]">Prénom(s)</p>
                    <p className="font-bold text-foreground text-[12px] uppercase truncate">{prenoms}</p>
                  </div>
                  {poste && (
                    <div>
                      <p className="font-bold text-green-800 text-[10px]">Fonction</p>
                      <p className="text-foreground text-[10px] line-clamp-2 leading-tight">{poste}</p>
                    </div>
                  )}
                  <div className="pt-1">
                    <span className="font-bold text-green-800 text-[10px]">VALIDITÉ : </span>
                    <span className="font-bold text-[10px]" style={{ color: "#d97706" }}>{validite}</span>
                  </div>
                </div>
              </div>

              {/* Footer email + tel */}
              <div className="flex justify-between items-end text-[8px] text-foreground/80 mt-1 gap-2">
                <span className="truncate">Email: {email || "contact@novalim-cie.ci"}</span>
                <span className="shrink-0">Tel: {phone || "—"}</span>
              </div>

              {/* Signature small overlay bottom right */}
              <img
                src={signature}
                alt=""
                className="absolute bottom-4 right-3 w-16 opacity-80 pointer-events-none"
              />
            </div>

            <div className="absolute top-2 right-2 p-1 rounded-full bg-white/70 text-muted-foreground">
              <RotateCw className="w-3 h-3" />
            </div>
          </div>

          {/* ===== VERSO ===== */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              backgroundColor: "#fdf6e3",
            }}
          >
            {/* Watermark logo background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <img src={logoNova} alt="" className="w-[80%] opacity-15 object-contain" />
            </div>

            <div className="relative h-full flex flex-col items-center justify-between p-3">
              {/* Top: site URL QR */}
              <div className="flex flex-col items-center gap-0.5">
                <div className="bg-white p-1 rounded">
                  <QRCodeSVG value={SITE_URL} size={48} level="M" includeMargin={false} />
                </div>
                <p className="text-[7px] text-foreground/70 font-medium">Site officiel</p>
              </div>

              {/* Center text */}
              <div className="text-center px-2">
                <p className="font-bold text-foreground text-[11px] leading-snug">
                  Cette carte est la propriété<br />
                  du District Cité Novalim - CIE.<br />
                  Veuillez nous contacter en cas de perte
                </p>
                <p className="font-bold text-[12px] mt-1" style={{ color: "#dc2626" }}>
                  07 89 53 63 18
                </p>
              </div>

              {/* Bottom: Facebook QR */}
              <div className="flex flex-col items-center gap-0.5">
                <div className="bg-white p-1 rounded">
                  <QRCodeSVG value={FACEBOOK_URL} size={48} level="M" includeMargin={false} />
                </div>
                <p className="text-[7px] text-foreground/70 font-medium">Page Facebook</p>
              </div>
            </div>

            <div className="absolute top-2 right-2 p-1 rounded-full bg-white/70 text-muted-foreground">
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
