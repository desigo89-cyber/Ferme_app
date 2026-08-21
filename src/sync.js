// Synchronisation multi-appareils.
//
// Principe : chaque ferme a un "code" unique (choisi ou généré à la
// création). Toutes les données de la ferme (le même objet JSON que celui
// stocké localement) sont sauvegardées dans une seule ligne d'une table
// Supabase, identifiée par ce code. N'importe quel appareil qui se connecte
// avec le même code + code PIN lit et écrit la même ligne : c'est ainsi que
// plusieurs téléphones "voient" les mêmes données.
//
// Ce n'est PAS une synchronisation en temps réel avec fusion intelligente :
// c'est la dernière écriture qui l'emporte (comme un fichier partagé sur un
// drive classique). Suffisant pour un usage "un appareil à la fois" ou une
// synchro régulière (matin/soir), pas pour une édition simultanée fine.

import { Preferences } from "@capacitor/preferences";

const CONFIG_KEY = "ferme-app-cloud-config-v1";

export async function getCloudConfig() {
  const res = await Preferences.get({ key: CONFIG_KEY });
  return res.value ? JSON.parse(res.value) : null;
}

export async function setCloudConfig(config) {
  await Preferences.set({ key: CONFIG_KEY, value: JSON.stringify(config) });
}

export async function clearCloudConfig() {
  await Preferences.remove({ key: CONFIG_KEY });
}

async function getClient(config) {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(config.url, config.anonKey);
}

// Crée un nouvel espace cloud avec les données locales actuelles.
// Échoue si le code existe déjà (pour éviter d'écraser une autre ferme).
export async function creerEspaceCloud(config, data) {
  const client = await getClient(config);
  const { error } = await client
    .from("fermes")
    .insert({ code: config.codeFerme, pin: config.pin, data, updated_at: new Date().toISOString() });
  if (error) {
    if (error.code === "23505") throw new Error("Ce code de ferme existe déjà. Choisissez-en un autre, ou utilisez « Rejoindre » si c'est le vôtre.");
    throw new Error(error.message);
  }
  return true;
}

// Rejoint un espace existant : vérifie le code + PIN, renvoie les données actuelles du cloud.
export async function rejoindreEspaceCloud(config) {
  const client = await getClient(config);
  const { data: rows, error } = await client
    .from("fermes")
    .select("data, pin, updated_at")
    .eq("code", config.codeFerme)
    .limit(1);
  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) throw new Error("Aucune ferme trouvée avec ce code.");
  if (rows[0].pin !== config.pin) throw new Error("Code PIN incorrect.");
  return { data: rows[0].data, updatedAt: rows[0].updated_at };
}

// Envoie les données locales vers le cloud (écrase la version en ligne).
export async function envoyerVersCloud(config, data) {
  const client = await getClient(config);
  const { error } = await client
    .from("fermes")
    .update({ data, updated_at: new Date().toISOString() })
    .eq("code", config.codeFerme)
    .eq("pin", config.pin);
  if (error) throw new Error(error.message);
  return true;
}

// Récupère les données du cloud (pour les comparer ou les rapatrier).
export async function recupererDuCloud(config) {
  const client = await getClient(config);
  const { data: rows, error } = await client
    .from("fermes")
    .select("data, updated_at")
    .eq("code", config.codeFerme)
    .eq("pin", config.pin)
    .limit(1);
  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) throw new Error("Aucune donnée trouvée pour ce code.");
  return { data: rows[0].data, updatedAt: rows[0].updated_at };
}
