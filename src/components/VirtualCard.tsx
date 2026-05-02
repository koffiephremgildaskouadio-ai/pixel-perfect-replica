import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { RotateCw, Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import logoNova from "@/assets/nova_logo_official.jpg";
import logoCcjy from "@/assets/logo_ccjy.jpg";
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
const FACEBOOK_URL = "https://web.facebook.com/DistrictCiteNovalimCIE";

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
  const [downloading, setDownloading] = useState(false);
  const rectoRef = useRef<HTMLDivElement>(null);
  const versoRef = useRef<HTMLDivElement>(null);

  const initials = `${nom?.[0] ?? ""}${prenoms?.[0] ?? ""}`;
  const validite = "2025 - 2026";
  const numericPart = (memberNumber.match(/(\d+)/g)?.pop() ?? "0001").padStart(4, "0");
  const displayNumber = `JY-NC/${numericPart}`;

  const downloadCard = async () => {
    setDownloading(true);
    try {
      const safeName = `${nom}_${prenoms}`.replace(/[^a-zA-Z0-9_-]/g, "_");
      for (const [side, ref] of [["recto", rectoRef], ["verso", versoRef]] as const) {
        if (!ref.current) continue;
        const dataUrl = await toPng(ref.current, { cacheBust: true, pixelRatio: 3, backgroundColor: "#fdf6e3" });
        const link = document.createElement("a");
        link.download = `carte_${safeName}_${side}.png`;
        link.href = dataUrl;
        link.click();
      }
      toast.success("Carte téléchargée (recto + verso)");
    } catch (e: any) {
      toast.error("Téléchargement impossible : " + (e.message || "erreur"));
    } finally {
      setDownloading(false);
    }
  };

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
            ref={rectoRef}
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl"
            style={{ backfaceVisibility: "hidden", backgroundColor: "#fdf6e3" }}
          >
            {/* District logo watermark in background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <img src={logoNova} alt="" crossOrigin="anonymous"
                className="w-[75%] opacity-[0.12] object-contain" />
            </div>

            <div className="relative h-full flex flex-col p-3">
              {/* Header: District logo (left) + Title + CCJY logo (right) */}
              <div className="flex items-start gap-2">
                <img src={logoNova} alt="Logo District" crossOrigin="anonymous"
                  className="w-12 h-12 object-contain shrink-0" />
                <div className="flex-1 text-center px-1">
                  <p className="font-bold text-[9px] leading-tight" style={{ color: "#d97706" }}>
                    CONSEIL COMMUNAL DES JEUNES DE YOPOUGON
                  </p>
                  <p className="font-bold text-[11px] leading-tight mt-0.5" style={{ color: "#15803d" }}>
                    DISTRICT CITÉ NOVALIM - CIE
                  </p>
                  <p className="font-semibold text-[8px] mt-0.5" style={{ color: "#dc2626" }}>
                    CARTE DE MEMBRE N° {displayNumber}
                  </p>
                </div>
                <img src={logoCcjy} alt="Logo CCJY" crossOrigin="anonymous"
                  className="w-12 h-12 object-contain shrink-0 rounded" />
              </div>

              {/* Body */}
              <div className="flex-1 flex gap-3 mt-2">
                {/* Photo */}
                <div className="shrink-0">
                  {photoUrl ? (
                    <img src={photoUrl} alt={`${nom} ${prenoms}`} crossOrigin="anonymous"
                      className="w-[88px] h-[110px] object-cover rounded border border-foreground/20" />
                  ) : (
                    <div className="w-[88px] h-[110px] rounded bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary border border-foreground/20">
                      {initials}
                    </div>
                  )}
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
              <div className="flex justify-between items-end text-[8px] text-foreground/80 mt-1 gap-2 relative z-10">
                <span className="truncate">Email: {email || "contact@novalim-cie.ci"}</span>
                <span className="shrink-0">Tel: {phone || "—"}</span>
              </div>

              {/* Signature ON the stamp (bottom right) */}
              <div className="absolute bottom-3 right-3 w-20 h-20 pointer-events-none">
                <img src={tampon} alt="" crossOrigin="anonymous"
                  className="absolute inset-0 w-full h-full object-contain opacity-90" />
                <img src={signature} alt="" crossOrigin="anonymous"
                  className="absolute inset-0 w-full h-full object-contain opacity-95" />
              </div>
            </div>

            <div className="absolute top-2 right-14 p-1 rounded-full bg-white/70 text-muted-foreground">
              <RotateCw className="w-3 h-3" />
            </div>
          </div>

          {/* ===== VERSO ===== */}
          <div
            ref={versoRef}
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              backgroundColor: "#fdf6e3",
            }}
          >
            {/* District logo watermark in background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <img src={logoNova} alt="" crossOrigin="anonymous"
                className="w-[80%] opacity-[0.15] object-contain" />
            </div>

            <div className="relative h-full flex flex-col items-center justify-between p-3">
              {/* Top: Facebook QR */}
              <div className="flex flex-col items-center gap-0.5">
                <div className="bg-white p-1 rounded">
                  <QRCodeSVG value={FACEBOOK_URL} size={56} level="M" includeMargin={false} />
                </div>
                <p className="text-[7px] text-foreground/70 font-medium">Page Facebook officielle</p>
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

              {/* Bottom: Site QR */}
              <div className="flex flex-col items-center gap-0.5">
                <div className="bg-white p-1 rounded">
                  <QRCodeSVG value={SITE_URL} size={48} level="M" includeMargin={false} />
                </div>
                <p className="text-[7px] text-foreground/70 font-medium">Site officiel</p>
              </div>
            </div>

            <div className="absolute top-2 right-2 p-1 rounded-full bg-white/70 text-muted-foreground">
              <RotateCw className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <p className="text-[10px] text-muted-foreground">Cliquez pour retourner</p>
        <button
          onClick={downloadCard}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-60"
        >
          {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          {downloading ? "Téléchargement…" : "Télécharger"}
        </button>
      </div>
    </div>
  );
};
