import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";

const categoryLabel = (c: string) => ({
  bureau: "Bureau Exécutif",
  cabinet: "Cabinet",
  coordonnateur: "Coordination",
  commission: "Commission",
  membre: "Membre",
  partenaire: "Partenaire",
}[c] ?? c);

export const exportAllMembersPDF = async () => {
  const { data: members, error } = await supabase
    .from("members")
    .select("*")
    .order("district", { ascending: true })
    .order("category", { ascending: true })
    .order("member_number", { ascending: true });
  if (error) throw error;
  if (!members || members.length === 0) throw new Error("Aucun membre à exporter");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297, H = 210;
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  // Page de couverture
  doc.setFillColor(21, 128, 61);
  doc.rect(0, 0, W, H, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("BASE DE DONNÉES DES MEMBRES", W / 2, 70, { align: "center" });
  doc.setFontSize(18);
  doc.text("District Cité Novalim - CIE", W / 2, 85, { align: "center" });
  doc.setFont("helvetica", "italic");
  doc.setFontSize(12);
  doc.text("Conseil Communal des Jeunes de Yopougon", W / 2, 95, { align: "center" });
  doc.setFontSize(11);
  doc.text(`Généré le ${dateStr}`, W / 2, 115, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Total : ${members.length} membres`, W / 2, 130, { align: "center" });

  // Répartition par district
  const byDistrict: Record<string, any[]> = {};
  members.forEach((m: any) => {
    const d = m.district || "Cité Novalim-CIE";
    (byDistrict[d] ||= []).push(m);
  });

  let y = 150;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  Object.entries(byDistrict).forEach(([d, list]) => {
    doc.text(`• District ${d} : ${list.length} membres`, W / 2, y, { align: "center" });
    y += 6;
  });

  // Tableau détaillé
  const drawHeader = (yPos: number) => {
    doc.setFillColor(21, 128, 61);
    doc.rect(10, yPos, W - 20, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("N° Membre", 12, yPos + 5.5);
    doc.text("Nom & Prénoms", 45, yPos + 5.5);
    doc.text("Catégorie", 115, yPos + 5.5);
    doc.text("Poste", 150, yPos + 5.5);
    doc.text("Téléphone", 210, yPos + 5.5);
    doc.text("Quartier / Cité", 250, yPos + 5.5);
  };

  const drawPageHeader = (title: string) => {
    doc.setFillColor(217, 119, 6);
    doc.rect(0, 0, W, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, W / 2, 9, { align: "center" });
  };

  Object.entries(byDistrict).forEach(([district, list]) => {
    doc.addPage();
    drawPageHeader(`District ${district} — ${list.length} membres`);
    let cy = 22;
    drawHeader(cy);
    cy += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);

    list.forEach((m: any, idx: number) => {
      if (cy > H - 12) {
        doc.addPage();
        drawPageHeader(`District ${district} (suite)`);
        cy = 22;
        drawHeader(cy);
        cy += 10;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 30, 30);
      }
      if (idx % 2 === 0) {
        doc.setFillColor(245, 250, 245);
        doc.rect(10, cy - 4, W - 20, 6.5, "F");
      }
      doc.text(String(m.member_number || "—").slice(0, 18), 12, cy);
      doc.text(`${(m.nom || "").toUpperCase()} ${m.prenoms || ""}`.slice(0, 40), 45, cy);
      doc.text(categoryLabel(m.category).slice(0, 18), 115, cy);
      doc.text(String(m.poste || "—").slice(0, 32), 150, cy);
      doc.text(String(m.phone || "—").slice(0, 20), 210, cy);
      doc.text(String(m.quartier || "—").slice(0, 22), 250, cy);
      cy += 6.5;
    });
  });

  // Pied de page final
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `District Cité Novalim - CIE · Document confidentiel · Page ${i}/${totalPages}`,
      W / 2, H - 4, { align: "center" }
    );
  }

  const fname = `base_membres_district_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(fname);
};
