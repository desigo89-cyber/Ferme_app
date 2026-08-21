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
