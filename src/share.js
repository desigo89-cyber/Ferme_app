// Partage natif de la sauvegarde : ouvre la feuille de partage du téléphone
// (WhatsApp, email, Google Drive, Bluetooth...) — c'est la façon la plus simple
// d'envoyer les données "vers le cloud" sans construire un vrai serveur de
// synchronisation. Sur le web (avant l'empaquetage Capacitor), on retombe sur
// un simple téléchargement.

import { Capacitor } from "@capacitor/core";
import { genererDocumentPDF, dataUriVersBase64 } from "./pdf.js";

export async function partagerSauvegarde(data, nomFichier) {
  const json = JSON.stringify(data, null, 2);

  if (Capacitor.isNativePlatform()) {
    // Chargement paresseux : ces plugins ne sont utiles qu'en natif.
    const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");

    const written = await Filesystem.writeFile({
      path: nomFichier,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });

    await Share.share({
      title: "Sauvegarde de la ferme",
      text: "Sauvegarde des données de la ferme",
      url: written.uri,
      dialogTitle: "Partager / enregistrer la sauvegarde",
    });
    return true;
  }

  // Fallback web : téléchargement classique.
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomFichier;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}

// Partage d'un document (reçu, facture...) — génère un vrai fichier PDF
// (titre, texte, signature en pièce jointe si présente) et ouvre la feuille
// de partage native (l'utilisateur y choisit son application mail) avec ce
// PDF en pièce jointe. Sur le web, le PDF est téléchargé (les navigateurs ne
// permettent pas de joindre un fichier à un mailto:), puis le client mail
// s'ouvre avec le texte pré-rempli pour que l'utilisateur joigne le fichier
// téléchargé manuellement.
export async function partagerDocument({ titre, texte, sujet, signatureDataUrl, nomFichierImage, nomFichierPdf }) {
  const nomPdf = nomFichierPdf || `${(sujet || titre || "document").replace(/[^a-z0-9\-_]+/gi, "_")}.pdf`;
  const pdfDataUri = genererDocumentPDF({ titre, sousTitre: sujet, texte, signatureDataUrl });

  if (Capacitor.isNativePlatform()) {
    const { Share } = await import("@capacitor/share");
    const { Filesystem, Directory } = await import("@capacitor/filesystem");

    const written = await Filesystem.writeFile({
      path: nomPdf,
      data: dataUriVersBase64(pdfDataUri),
      directory: Directory.Cache,
    });
    await Share.share({ title: sujet || titre, text: texte, url: written.uri, dialogTitle: "Partager le document (PDF)" });
    return true;
  }

  // Fallback web : télécharge le PDF, puis ouvre le client mail avec le texte pré-rempli.
  const a = document.createElement("a");
  a.href = pdfDataUri;
  a.download = nomPdf;
  document.body.appendChild(a);
  a.click();
  a.remove();

  const mailto = `mailto:?subject=${encodeURIComponent(sujet || titre)}&body=${encodeURIComponent(
    `${texte}\n\n(Le document PDF vient d'être téléchargé — pensez à le joindre à cet email avant l'envoi.)`
  )}`;
  window.open(mailto, "_blank");
  return true;
}
