// Partage natif de la sauvegarde : ouvre la feuille de partage du téléphone
// (WhatsApp, email, Google Drive, Bluetooth...) — c'est la façon la plus simple
// d'envoyer les données "vers le cloud" sans construire un vrai serveur de
// synchronisation. Sur le web (avant l'empaquetage Capacitor), on retombe sur
// un simple téléchargement.

import { Capacitor } from "@capacitor/core";

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

// Partage d'un document (reçu, facture...) — ouvre la feuille de partage
// native (l'utilisateur y choisit son application mail) avec le résumé du
// document en texte, et la signature en pièce jointe si elle existe.
export async function partagerDocument({ titre, texte, sujet, signatureDataUrl, nomFichierImage }) {
  if (Capacitor.isNativePlatform()) {
    const { Share } = await import("@capacitor/share");

    if (signatureDataUrl) {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const base64 = signatureDataUrl.split(",")[1];
      const written = await Filesystem.writeFile({
        path: nomFichierImage || "signature.png",
        data: base64,
        directory: Directory.Cache,
      });
      await Share.share({ title: sujet || titre, text: texte, url: written.uri, dialogTitle: "Partager le document" });
      return true;
    }

    await Share.share({ title: sujet || titre, text: texte, dialogTitle: "Partager le document" });
    return true;
  }

  // Fallback web : ouvre le client mail par défaut avec le texte pré-rempli.
  const mailto = `mailto:?subject=${encodeURIComponent(sujet || titre)}&body=${encodeURIComponent(texte)}`;
  window.open(mailto, "_blank");
  return true;
}
