import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// "base" doit être un chemin RELATIF ("./") pour fonctionner à la fois :
// - sur GitHub Pages, où l'app est servie depuis un sous-dossier
// (https://<utilisateur>.github.io/Ferme_app/)
// - dans l'app mobile (Capacitor), où l'app est servie depuis sa propre
// racine interne, sans sous-dossier.
// Un chemin absolu comme "/Ferme_app/" casserait le chargement des fichiers
// dans l'app mobile (écran blanc), même si la version web fonctionne.
export default defineConfig({
base: "./",
plugins: [react()],
server: {
host: true,
port: 5173,
},
});
