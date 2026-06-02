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

// Matricule UNIQUE du District (identique sur tous les certificats)
export const DISTRICT_MATRICULE = "CCJY-2025/D-CNC/KKEG/045";

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
  bureau: "BUREAU EXÉCUTIF",
  cabinet: "CABINET",
  coordonnateur: "COORDINATION",
  commission: "COMMISSION",
  membre: "MEMBRE",
  partenaire: "PARTENAIRE",
}[c] ?? c.toUpperCase());

export const generateCertificate = async (m: CertMember) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297;

  // Fond crème
  doc.setFillColor(253, 246, 227);
  doc.rect(0, 0, W, H, "F");

  // Cadre vert externe + filet orange interne
  doc.setDrawColor(21, 128, 61);
  doc.setLineWidth(2.2);
  doc.rect(8, 8, W - 16, H - 16);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.6);
  doc.rect(11.5, 11.5, W - 23, H - 23);

  const [novaImg, ccjyImg, tamponImg, signImg] = await Promise.all([
    toDataURL(logoNova), toDataURL(logoCcjy), toDataURL(tampon), toDataURL(signature),
  ]);

  // Logos en haut
  if (novaImg) doc.addImage(novaImg, "PNG", 16, 16, 30, 30);
  if (ccjyImg) doc.addImage(ccjyImg, "PNG", W - 46, 16, 30, 30);

  // Filigrane central
  if (novaImg) {
    // @ts-ignore
    doc.setGState(new (doc as any).GState({ opacity: 0.06 }));
    doc.addImage(novaImg, "PNG", 35, 95, 140, 140);
    // @ts-ignore
    doc.setGState(new (doc as any).GState({ opacity: 1 }));
  }

  // En-tête
  doc.setFont("helvetica", "bold");
  doc.setTextColor(217, 119, 6);
  doc.setFontSize(13);
  doc.text("CONSEIL COMMUNAL DES JEUNES DE YOPOUGON", W / 2, 22, { align: "center" });
  doc.setTextColor(21, 128, 61);
  doc.setFontSize(17);
  doc.text(`DISTRICT ${String(m.district || "CITÉ NOVALIM-CIE").toUpperCase()}`, W / 2, 31, { align: "center" });
  doc.setTextColor(120, 53, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("Yopougon – Côte d'Ivoire", W / 2, 37, { align: "center" });

  // Bande titre
  doc.setFillColor(21, 128, 61);
  doc.rect(20, 54, W - 40, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("CERTIFICAT DE NOMINATION", W / 2, 64, { align: "center" });

  // Introduction
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11.5);
  doc.text(
    "Le Président du District Cité Novalim - CIE certifie par la présente que :",
    W / 2, 79, { align: "center" }
  );

  // Nom + Prénoms en grand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(21, 128, 61);
  const fullName = `${(m.nom || "").toUpperCase()} ${(m.prenoms || "").toUpperCase()}`.trim();
  doc.text(fullName, W / 2, 92, { align: "center" });

  // Fonction
  doc.setFont("helvetica", "italic");
  doc.setFontSize(12.5);
  doc.setTextColor(217, 119, 6);
  const poste = m.poste || categoryLabel(m.category);
  const posteLines = doc.splitTextToSize(poste, W - 50);
  doc.text(posteLines, W / 2, 101, { align: "center" });

  // Bloc informations
  let y = 101 + posteLines.length * 6 + 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11.5);

  const rows: [string, string][] = [
    ["N° de membre", m.member_number],
    ["District", m.district || "Cité Novalim-CIE"],
    ["Catégorie", categoryLabel(m.category)],
    ["Téléphone", m.phone || "—"],
    ["Numéro Matricule", DISTRICT_MATRICULE],
    ["Validité", "2025 – 2027"],
  ];
  rows.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(21, 128, 61);
    doc.text(`${k} :`, 30, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    doc.text(String(v), 78, y);
    y += 7;
  });

  // Cahier de charges
  y += 4;
  doc.setFillColor(217, 119, 6);
  doc.rect(20, y - 5, W - 40, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("CAHIER DE CHARGES", W / 2, y + 1, { align: "center" });
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10.5);
  const cahier = m.cahier_charges?.trim()
    || "Le présent membre exerce les fonctions qui lui sont conférées par le règlement intérieur du District, dans le respect des valeurs du CCJY et au service de la jeunesse de Yopougon.";
  const lines = doc.splitTextToSize(cahier, W - 50);
  doc.text(lines, 25, y + 2, { align: "justify", maxWidth: W - 50 });
  y += lines.length * 5 + 6;

  // Date + signature (en bas)
  const footY = H - 55;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  doc.text(`Fait à Yopougon, le ${today}`, W / 2, footY, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(21, 128, 61);
  doc.text("Le Président du District", W - 25, footY + 8, { align: "right" });

  // Tampon + signature empilés
  if (tamponImg) doc.addImage(tamponImg, "PNG", W - 78, footY + 10, 45, 32);
  if (signImg) doc.addImage(signImg, "PNG", W - 78, footY + 14, 45, 24);

  // Pied de page
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Document officiel – District Cité Novalim - CIE – contact: 07 89 53 63 18 / 01 70 01 53 73",
    W / 2, H - 14, { align: "center" }
  );

  const safe = `${m.nom}_${m.prenoms}`.replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`certificat_${safe}.pdf`);
};
