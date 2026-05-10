import jsPDF from "jspdf";
import logoNova from "@/assets/nova_logo_official.jpg";
import logoCcjy from "@/assets/logo_ccjy.jpg";
import tampon from "@/assets/tampon.png";
import signature from "@/assets/signature.png";

export interface CertMember {
  member_number: string;
  nom: string;
  prenoms: string;
  poste?: string | null;
  category: string;
  district?: string | null;
  phone?: string | null;
  quartier?: string | null;
  cahier_charges?: string | null;
  photo_url?: string | null;
  email?: string | null;
}

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const toDataURL = async (src: string): Promise<string> => {
  try {
    const img = await loadImage(src);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
};

const categoryLabel = (c: string) => ({
  bureau: "Bureau Exécutif",
  cabinet: "Cabinet",
  coordonnateur: "Coordination",
  commission: "Commission",
  membre: "Membre",
  partenaire: "Partenaire",
}[c] ?? c);

export const generateCertificate = async (m: CertMember) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297;

  // Background tint
  doc.setFillColor(253, 246, 227);
  doc.rect(0, 0, W, H, "F");

  // Outer frame
  doc.setDrawColor(21, 128, 61); // green
  doc.setLineWidth(2);
  doc.rect(8, 8, W - 16, H - 16);
  doc.setDrawColor(217, 119, 6); // orange
  doc.setLineWidth(0.5);
  doc.rect(11, 11, W - 22, H - 22);

  // Logos
  const [novaImg, ccjyImg, tamponImg, signImg] = await Promise.all([
    toDataURL(logoNova), toDataURL(logoCcjy), toDataURL(tampon), toDataURL(signature),
  ]);

  if (novaImg) doc.addImage(novaImg, "PNG", 18, 18, 28, 28);
  if (ccjyImg) doc.addImage(ccjyImg, "PNG", W - 46, 18, 28, 28);

  // Watermark — district logo big & transparent in center
  if (novaImg) {
    // jsPDF GState for opacity
    // @ts-ignore
    const gState = new (doc as any).GState({ opacity: 0.07 });
    // @ts-ignore
    doc.setGState(gState);
    doc.addImage(novaImg, "PNG", 40, 90, 130, 130);
    // @ts-ignore
    doc.setGState(new (doc as any).GState({ opacity: 1 }));
  }

  // Headers
  doc.setFont("helvetica", "bold");
  doc.setTextColor(217, 119, 6);
  doc.setFontSize(11);
  doc.text("CONSEIL COMMUNAL DES JEUNES DE YOPOUGON", W / 2, 24, { align: "center" });
  doc.setTextColor(21, 128, 61);
  doc.setFontSize(15);
  doc.text(`DISTRICT ${String(m.district || "Novalim-CIE").toUpperCase()}`, W / 2, 32, { align: "center" });
  doc.setTextColor(120, 53, 15);
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text("Yopougon – Zone 7 – Côte d'Ivoire", W / 2, 38, { align: "center" });

  // Title band
  doc.setFillColor(21, 128, 61);
  doc.rect(20, 56, W - 40, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CERTIFICAT DE NOMINATION", W / 2, 65.5, { align: "center" });

  // Intro
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(
    "Le Bureau Exécutif du District Cité Novalim - CIE certifie par la présente que :",
    W / 2, 80, { align: "center" }
  );

  // Photo
  if (m.photo_url) {
    try {
      const photo = await toDataURL(m.photo_url);
      if (photo) doc.addImage(photo, "PNG", W / 2 - 18, 86, 36, 44);
    } catch {}
  }

  // Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(21, 128, 61);
  doc.text(`${m.nom?.toUpperCase()} ${m.prenoms ?? ""}`.trim(), W / 2, 140, { align: "center" });

  // Function
  doc.setFontSize(13);
  doc.setTextColor(217, 119, 6);
  const poste = m.poste || categoryLabel(m.category);
  const posteLines = doc.splitTextToSize(poste, W - 60);
  doc.text(posteLines, W / 2, 148, { align: "center" });

  // Body — info table
  let y = 165;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11);
  const rows: [string, string][] = [
    ["N° de membre", m.member_number],
    ["District", m.district || "Novalim-CIE"],
    ["Catégorie", categoryLabel(m.category)],
    ["Téléphone", m.phone || "—"],
    ["Quartier", m.quartier || "—"],
    ["Email", m.email || "—"],
    ["Validité", "2025 – 2026"],
  ];
  rows.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${k} :`, 30, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(v), 75, y);
    y += 6.5;
  });

  // Cahier de charges
  if (m.cahier_charges?.trim()) {
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(21, 128, 61);
    doc.setFontSize(12);
    doc.text("CAHIER DE CHARGES", 30, y);
    y += 5;
    doc.setDrawColor(21, 128, 61);
    doc.line(30, y - 2, W - 30, y - 2);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(m.cahier_charges, W - 60);
    doc.text(lines, 30, y + 3);
    y += 3 + lines.length * 4.2;
  }

  // Footer — date + signature + tampon
  const footY = H - 50;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  doc.text(`Fait à Yopougon, le ${today}`, W - 22, footY, { align: "right" });

  doc.setFont("helvetica", "italic");
  doc.text("Le Président du District", W - 22, footY + 6, { align: "right" });

  // Tampon + signature stacked
  if (tamponImg) doc.addImage(tamponImg, "PNG", W - 70, footY + 8, 35, 25);
  if (signImg) doc.addImage(signImg, "PNG", W - 70, footY + 12, 35, 18);

  // Bottom note
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Document officiel – District Cité Novalim - CIE – contact: 07 89 53 63 18",
    W / 2, H - 14, { align: "center" }
  );

  const safe = `${m.nom}_${m.prenoms}`.replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`certificat_${safe}.pdf`);
};
