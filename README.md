# Gestion de Ferme — application mobile (Capacitor)

## Obtenir le fichier .apk sans rien installer (le plus simple)

Ce projet contient un fichier `.github/workflows/build-apk.yml` qui compile
automatiquement l'APK dans le cloud (via GitHub Actions), gratuitement :

1. Créez un compte gratuit sur [github.com](https://github.com) si vous n'en avez pas
2. Créez un nouveau dépôt (bouton vert "New"), puis envoyez-y ce dossier :
   ```bash
   cd ferme-app
   git init
   git add .
   git commit -m "Première version"
   git branch -M main
   git remote add origin https://github.com/VOTRE-NOM/ferme-app.git
   git push -u origin main
   ```
3. Sur la page GitHub du dépôt, allez dans l'onglet **Actions** — la compilation démarre automatiquement (≈ 5 minutes)
4. Une fois terminé (coche verte ✅), cliquez sur le run → en bas de la page, téléchargez le fichier **`gestion-ferme-apk.zip`** → il contient `app-debug.apk`
5. Envoyez cet `.apk` sur un téléphone Android (WhatsApp, câble USB...) et installez-le (autoriser "sources inconnues" dans les réglages si demandé)

Pas besoin d'installer Android Studio, ni Node, ni rien d'autre sur votre ordinateur pour cette méthode.

---

## Alternative : compiler vous-même avec Android Studio

Ce dossier est un projet complet et fonctionnel. J'ai déjà fait tout ce qui peut se faire sans Android Studio :

- ✅ Projet React + Vite créé, avec tout le code du prototype (cultures, élevage, stocks, finances, produits, comptes, documents, rapport, mot de passe)
- ✅ Stockage remplacé par `@capacitor/preferences` : les données sont écrites nativement sur le téléphone (`src/storage.js`), et persistent hors-ligne, contrairement à `window.storage` qui n'existait que dans l'aperçu Claude
- ✅ `npm install` exécuté et vérifié
- ✅ `npm run build` exécuté avec succès (le code compile sans erreur)
- ✅ Plateforme Android générée (`npx cap add android`) et synchronisée

Il ne reste que les étapes qui nécessitent un ordinateur avec **Android Studio installé** — impossible à faire depuis cet environnement.

## Pour obtenir l'application sur votre téléphone

**1. Installer les outils** (une seule fois)
- [Node.js](https://nodejs.org) (version 18 ou plus)
- [Android Studio](https://developer.android.com/studio)

**2. Récupérer le projet**
Dézippez ce dossier sur votre ordinateur, puis dans un terminal :
```bash
cd ferme-app
npm install
```

**3. Ouvrir dans Android Studio**
```bash
npx cap open android
```
Android Studio s'ouvre avec le projet déjà configuré.

**4. Lancer sur un téléphone ou un émulateur**
- Branchez un téléphone Android en USB (mode débogage activé), ou démarrez un émulateur dans Android Studio
- Cliquez sur ▶️ "Run" — l'app s'installe et s'ouvre automatiquement

**5. Générer un fichier installable (.apk) à partager**
Dans Android Studio : `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`.
Le fichier `.apk` généré peut être envoyé par WhatsApp/Bluetooth et installé sur n'importe quel téléphone Android (autoriser "sources inconnues" dans les réglages).

## Si vous modifiez le code plus tard

Après toute modification dans `src/App.jsx` :
```bash
npm run build
npx cap sync android
```
Puis relancez depuis Android Studio.

## Pour iOS (iPhone)

Nécessite un Mac avec Xcode installé :
```bash
npx cap add ios
npx cap sync ios
npx cap open ios
```

## Ce qui manque encore (prochaines étapes possibles)

- **Synchronisation multi-appareils** : pour l'instant, les données restent sur le téléphone où l'app est installée. Si plusieurs personnes doivent voir les mêmes données (propriétaire + ouvrier + comptable), il faut ajouter un backend (voir `schema-ferme-documentation.md` conçu précédemment) — c'est l'étape React Native + serveur évoquée plus tôt.
- **Icône et écran de démarrage personnalisés** : actuellement l'icône par défaut de Capacitor. Se change facilement avec [Capacitor Assets](https://capacitorjs.com/docs/guides/splash-screens-and-icons).
- **Publication sur le Play Store** : nécessite un compte développeur Google (paiement unique ~25$) et de signer l'APK.
