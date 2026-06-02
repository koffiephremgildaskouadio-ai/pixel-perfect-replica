import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { RotateCw, Download, Loader2, FileText } from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
  canDownload?: boolean;
}

const FALLBACK_FACEBOOK_URL = "https://web.facebook.com/DistrictCiteNovalimCIE";
const FALLBACK_SITE_URL = typeof window !== "undefined" ? window.location.origin : "https://districtcitenovalim-cie.lovable.app";

type CardSettings = {
  header_top?: string;
  header_main?: string;
  validity?: string;
  emergency_phone?: string;
  verso_text?: string;
  facebook_url?: string;
  site_url?: string;
};

export const VirtualCard = ({
  memberNumber,
  nom,
  prenoms,
  poste,
  phone,
  photoUrl,
  email,
  canDownload = true,
}: VirtualCardProps) => {
  const [flipped, setFlipped] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [settings, setSettings] = useState<CardSettings>({});
  const rectoRef = useRef<HTMLDivElement>(null);
  const versoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("site_content").select("metadata").eq("key", "card_settings").maybeSingle()
      .then(({ data }) => setSettings(((data?.metadata as any) ?? {}) as CardSettings));
  }, []);

  const HEADER_TOP = settings.header_top || "CONSEIL COMMUNAL DES JEUNES DE YOPOUGON";
  const HEADER_MAIN = settings.header_main || "DISTRICT CITÉ NOVALIM - CIE";
  const VALIDITE = settings.validity || "2025 - 2026";
  const EMERGENCY = settings.emergency_phone || "07 89 53 63 18";
  const VERSO_TEXT = settings.verso_text || "Cette carte est la propriété\ndu District Cité Novalim - CIE.\nEn cas de perte, merci de nous contacter";
  const FACEBOOK_URL = settings.facebook_url || FALLBACK_FACEBOOK_URL;
  const SITE_URL = settings.site_url || FALLBACK_SITE_URL;

  const initials = `${nom?.[0] ?? ""}${prenoms?.[0] ?? ""}`;
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

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      if (!rectoRef.current || !versoRef.current) throw new Error("Carte non prête");
      const safeName = `${nom}_${prenoms}`.replace(/[^a-zA-Z0-9_-]/g, "_");
      const opts = { cacheBust: true, pixelRatio: 3, backgroundColor: "#fdf6e3" };
      // Briefly un-flip for capture
      const wasFlipped = flipped;
      setFlipped(false);
      await new Promise((r) => setTimeout(r, 50));
      const rectoUrl = await toPng(rectoRef.current, opts);
      const versoUrl = await toPng(versoRef.current, opts);
      setFlipped(wasFlipped);

      // Carte grand format — A4 paysage, recto et verso XXL pour une lecture facile
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = 297, pageH = 210;
      const cardW = 240, cardH = 150;
      const x = (pageW - cardW) / 2;
      const y = (pageH - cardH) / 2;

      // Page 1 — RECTO
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(21, 128, 61);
      pdf.text("Carte de Membre — RECTO", pageW / 2, 16, { align: "center" });
      pdf.addImage(rectoUrl, "PNG", x, y, cardW, cardH);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(100);
      pdf.text("District Cité Novalim - CIE · CCJY Yopougon", pageW / 2, pageH - 8, { align: "center" });

      // Page 2 — VERSO
      pdf.addPage("a4", "landscape");
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(21, 128, 61);
      pdf.text("Carte de Membre — VERSO", pageW / 2, 16, { align: "center" });
      pdf.addImage(versoUrl, "PNG", x, y, cardW, cardH);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(100);
      pdf.text("District Cité Novalim - CIE · CCJY Yopougon", pageW / 2, pageH - 8, { align: "center" });

      pdf.save(`carte_${safeName}.pdf`);
      toast.success("PDF téléchargé (recto + verso)");
    } catch (e: any) {
      toast.error("PDF impossible : " + (e.message || "erreur"));
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
            aspectRatio: "85.6 / 60",
          }}
        >
          {/* ===== RECTO ===== */}
          <div
            ref={rectoRef}
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl"
            style={{ backfaceVisibility: "hidden", backgroundColor: "#fdf6e3" }}
          >
            {/* District logo watermark — léger pour ne pas gêner */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <img src={logoNova} alt="" crossOrigin="anonymous"
                className="w-[70%] opacity-[0.07] object-contain" />
            </div>

            {/* Bandeau vert haut */}
            <div className="absolute top-0 left-0 right-0 h-[18%]"
                 style={{ background: "linear-gradient(90deg,#15803d 0%,#166534 100%)" }} />

            <div className="relative h-full flex flex-col px-3 pt-2 pb-2">
              {/* Header avec logos + titres */}
              <div className="flex items-center gap-2 relative z-10">
                <div className="bg-white rounded-md p-0.5 shrink-0">
                  <img src={logoNova} alt="Logo District" crossOrigin="anonymous"
                    className="w-10 h-10 object-contain" />
                </div>
                <div className="flex-1 text-center px-1 text-white">
                  <p className="font-bold text-[8px] leading-tight tracking-wide">
                    {HEADER_TOP}
                  </p>
                  <p className="font-bold text-[10px] leading-tight">
                    {HEADER_MAIN}
                  </p>
                </div>
                <div className="bg-white rounded-md p-0.5 shrink-0">
                  <img src={logoCcjy} alt="Logo CCJY" crossOrigin="anonymous"
                    className="w-10 h-10 object-contain" />
                </div>
              </div>

              {/* Numéro */}
              <div className="mt-1.5 mx-auto px-3 py-0.5 rounded-full bg-orange-600 text-white text-[9px] font-bold tracking-wider relative z-10">
                CARTE N° {displayNumber}
              </div>

              {/* Body : photo+tampon à gauche, infos à droite */}
              <div className="flex-1 flex gap-2.5 mt-2 relative z-10 min-h-0">
                {/* Photo + tampon/signature DESSOUS */}
                <div className="shrink-0 flex flex-col items-center w-[78px]">
                  {photoUrl ? (
                    <img src={photoUrl} alt={`${nom} ${prenoms}`} crossOrigin="anonymous"
                      className="w-[78px] h-[96px] object-cover rounded border-2 border-green-700/60 shadow" />
                  ) : (
                    <div className="w-[78px] h-[96px] rounded bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary border-2 border-green-700/60">
                      {initials}
                    </div>
                  )}
                  {/* Tampon + signature superposés JUSTE en dessous */}
                  <div className="relative w-[78px] h-[36px] mt-0.5">
                    <img src={tampon} alt="" crossOrigin="anonymous"
                      className="absolute inset-0 w-full h-full object-contain opacity-90" />
                    <img src={signature} alt="" crossOrigin="anonymous"
                      className="absolute inset-0 w-full h-full object-contain" />
                  </div>
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0 text-[10px] leading-snug space-y-1">
                  <div>
                    <p className="font-bold text-green-800 text-[8px] uppercase tracking-wide">Nom</p>
                    <p className="font-bold text-foreground text-[12px] uppercase truncate leading-tight">{nom}</p>
                  </div>
                  <div>
                    <p className="font-bold text-green-800 text-[8px] uppercase tracking-wide">Prénom(s)</p>
                    <p className="font-bold text-foreground text-[11px] uppercase truncate leading-tight">{prenoms}</p>
                  </div>
                  {poste && (
                    <div>
                      <p className="font-bold text-green-800 text-[8px] uppercase tracking-wide">Fonction</p>
                      <p className="text-foreground text-[9px] line-clamp-2 leading-tight">{poste}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-1 pt-0.5">
                    <span className="font-bold text-green-800 text-[8px] uppercase">Validité :</span>
                    <span className="font-bold text-[10px] text-orange-600">{VALIDITE}</span>
                  </div>
                </div>
              </div>

              {/* Footer email + tel */}
              <div className="flex justify-between items-end text-[8px] text-foreground/80 mt-1 gap-2 relative z-10 border-t border-green-700/20 pt-1">
                <span className="truncate"><b>Email:</b> {email || "contact@novalim-cie.ci"}</span>
                <span className="shrink-0"><b>Tel:</b> {phone || "—"}</span>
              </div>
            </div>

            <div className="absolute top-1 right-1 p-1 rounded-full bg-white/80 text-muted-foreground">
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
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <img src={logoNova} alt="" crossOrigin="anonymous"
                className="w-[75%] opacity-[0.10] object-contain" />
            </div>

            <div className="relative h-full flex items-center gap-3 p-3">
              {/* QR Facebook */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="bg-white p-1 rounded">
                  <QRCodeSVG value={FACEBOOK_URL} size={70} level="M" includeMargin={false} />
                </div>
                <p className="text-[7px] text-foreground/80 font-semibold text-center leading-tight">
                  Page Facebook<br/>officielle
                </p>
              </div>

              {/* Texte central */}
              <div className="flex-1 text-center px-1">
                <p className="font-bold text-foreground text-[10px] leading-snug whitespace-pre-line">
                  {VERSO_TEXT}
                </p>
                <p className="font-bold text-[12px] mt-1.5 text-red-600">
                  {EMERGENCY}
                </p>
                <p className="text-[7px] text-foreground/60 mt-0.5 truncate">
                  {(SITE_URL || "").replace(/^https?:\/\//, "")}
                </p>
              </div>

              {/* QR Site */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="bg-white p-1 rounded">
                  <QRCodeSVG value={SITE_URL} size={60} level="M" includeMargin={false} />
                </div>
                <p className="text-[7px] text-foreground/80 font-semibold text-center leading-tight">
                  Site<br/>officiel
                </p>
              </div>
            </div>

            <div className="absolute top-1 right-1 p-1 rounded-full bg-white/80 text-muted-foreground">
              <RotateCw className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
        <p className="text-[10px] text-muted-foreground w-full text-center">Cliquez pour retourner</p>
        {canDownload ? (
          <>
            <button
              onClick={downloadCard}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-60"
            >
              {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              PNG (R+V)
            </button>
            <button
              onClick={downloadPDF}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-600 text-white text-xs font-medium hover:bg-orange-700 disabled:opacity-60"
            >
              {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
              PDF (R+V)
            </button>
          </>
        ) : (
          <p className="text-[10px] text-muted-foreground">Téléchargement réservé au super administrateur.</p>
        )}
      </div>
    </div>
  );
};
