# Gestion de Ferme — application mobile (Capacitor)

## Nouveau : version web (accessible depuis un navigateur, synchronisée)

Le même code sert maintenant de vrai site web, hébergé gratuitement sur
GitHub Pages, et connecté au **même espace cloud** que l'app mobile (avec
le même code de ferme + PIN dans Paramètres) — donc les données se
synchronisent entre le site et le téléphone.

**Activation (une seule fois) :**
1. Sur GitHub, allez dans **Settings** (du dépôt `Ferme_app`) → **Pages** (menu de gauche)
2. Sous "Build and deployment" → **Source** : choisissez **"GitHub Actions"**
3. Envoyez ce projet mis à jour (voir plus bas) — un nouveau workflow **"Deploy Web"** se déclenche automatiquement dans l'onglet Actions
4. Une fois terminé (✅, quelques minutes), le site est disponible à :
   **`https://desigo89-cyber.github.io/Ferme_app/`**

**Pour rester synchronisé avec le téléphone** : ouvrez le site → Paramètres (⚙️) → section Cloud → entrez la même URL Supabase / clé / code de ferme / PIN que sur le téléphone → "Rejoindre un espace existant". Ensuite, utilisez "Envoyer vers le cloud" / "Récupérer depuis le cloud" des deux côtés pour synchroniser (ce n'est pas automatique en temps réel — voir les explications précédentes).

---

## Nouveau : synchronisation multi-appareils (Cloud)

Pour que plusieurs téléphones partagent les mêmes données, il faut créer un
projet Supabase gratuit (une base de données en ligne) — une seule fois.

**1. Créer le projet Supabase**
- Allez sur [supabase.com](https://supabase.com) → "Start your project" → connectez-vous (Google ou email)
- "New project" → donnez-lui un nom (ex. "ferme-app") → choisissez un mot de passe de base de données (à garder de côté, différent du PIN de l'app) → région la plus proche → "Create new project" (peut prendre 1-2 minutes)

**2. Créer la table**
- Dans le menu de gauche, cliquez sur **"SQL Editor"** → **"New query"**
- Ouvrez le fichier `supabase-setup.sql` (inclus dans ce projet), copiez tout son contenu, collez-le dans l'éditeur
- Cliquez sur **"Run"** (ou Ctrl+Entrée)

**3. Récupérer les identifiants**
- Menu de gauche → **"Project Settings"** (roue crantée) → **"API"**
- Copiez la **"Project URL"** (ressemble à `https://xxxx.supabase.co`)
- Copiez la clé **"anon public"** (une longue chaîne de caractères)

**4. Connecter l'app**
- Dans l'app, ouvrez **Paramètres** (⚙️) → section **"Synchronisation multi-appareils (Cloud)"**
- Collez l'URL et la clé anon récupérées
- Choisissez un **code de ferme** (ex. `ferme-desire-2026`) et un **PIN secret**
- Sur le premier appareil : bouton **"Créer mon espace cloud"**
- Sur les appareils suivants : mêmes URL/clé/code/PIN, puis **"Rejoindre un espace existant"**

Ensuite, utilisez **"Envoyer vers le cloud"** / **"Récupérer depuis le cloud"** pour synchroniser manuellement — ce n'est pas automatique et en temps réel, c'est un point de synchronisation volontaire (voir les limites dans la conversation).

---

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
