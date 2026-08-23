// Génération de vrais fichiers PDF pour les documents de l'app (reçus,
// factures, bordereaux, bons de versement, bulletins de paie...).
// Utilisé par share.js pour que "partager"/"envoyer par email" attache
// un fichier .pdf réel, au lieu d'un simple texte.

import { jsPDF } from "jspdf";

const MARGE = 15;
const LARGEUR_PAGE = 210; // A4 mm

/**
 * Construit un PDF simple à partir d'un titre, d'un corps de texte
 * (une ligne par élément du tableau, ou une chaîne avec retours à la ligne),
 * et éventuellement d'une image de signature (dataURL PNG/JPEG).
 * Retourne le PDF sous forme de dataURL base64 ("data:application/pdf;base64,...").
 */
export function genererDocumentPDF({ titre, sousTitre, texte, signatureDataUrl }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGE;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(titre || "Document", MARGE, y);
  y += 8;

  if (sousTitre) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110, 107, 88);
    doc.text(sousTitre, MARGE, y);
    doc.setTextColor(0, 0, 0);
    y += 8;
  }

  doc.setDrawColor(223, 216, 194);
  doc.line(MARGE, y, LARGEUR_PAGE - MARGE, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const lignesTexte = Array.isArray(texte) ? texte : String(texte || "").split("\n");
  const largeurUtile = LARGEUR_PAGE - MARGE * 2;
  lignesTexte.forEach((ligne) => {
    const morceaux = doc.splitTextToSize(ligne || " ", largeurUtile);
    morceaux.forEach((m) => {
      if (y > 280) { doc.addPage(); y = MARGE; }
      doc.text(m, MARGE, y);
      y += 6;
    });
  });

  if (signatureDataUrl) {
    if (y > 250) { doc.addPage(); y = MARGE; }
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(110, 107, 88);
    doc.text("Signature :", MARGE, y);
    y += 4;
    try {
      doc.addImage(signatureDataUrl, "PNG", MARGE, y, 60, 30);
    } catch {
      // Format d'image non supporté par jsPDF (rare) : on ignore silencieusement,
      // le reste du document PDF reste valide.
    }
  }

  return doc.output("datauristring"); // "data:application/pdf;base64,...."
}

export function dataUriVersBase64(dataUri) {
  return dataUri.split(",")[1];
}
