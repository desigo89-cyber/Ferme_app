// Couche de stockage locale et persistante pour l'app native.
//
// Sur Android/iOS (via Capacitor), les données sont écrites dans le stockage
// natif de l'application (Preferences / UserDefaults / SharedPreferences) :
// elles restent disponibles hors-ligne et survivent aux redémarrages du
// téléphone. En développement web (npm run dev, avant l'empaquetage
// Capacitor), on retombe sur localStorage pour pouvoir tester dans le
// navigateur sans installer l'app.
//
// Cette couche remplace `window.storage` utilisé dans le prototype Claude —
// même forme d'API (get/set retournant { value } ou null) pour limiter les
// changements dans App.jsx.

import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();

export const storage = {
  async get(key) {
    if (isNative) {
      const res = await Preferences.get({ key });
      return res.value ? { key, value: res.value } : null;
    }
    const value = localStorage.getItem(key);
    return value ? { key, value } : null;
  },

  async set(key, value) {
    if (isNative) {
      await Preferences.set({ key, value });
      return { key, value };
    }
    localStorage.setItem(key, value);
    return { key, value };
  },

  async delete(key) {
    if (isNative) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  },
};
