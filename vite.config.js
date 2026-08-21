import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// "base" doit correspondre au nom du dépôt GitHub pour que GitHub Pages
// trouve correctement les fichiers (l'app est servie depuis
// https://<utilisateur>.github.io/Ferme_app/). Si vous renommez le dépôt,
// mettez cette valeur à jour.
export default defineConfig({
  base: "/Ferme_app/",
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
