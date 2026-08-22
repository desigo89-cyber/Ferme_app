// Lien entre les fournisseurs/clients de l'app et le répertoire de contacts
// du téléphone (plugin natif). Ne fait rien sur le web (le répertoire du
// téléphone n'existe pas dans un navigateur) : les fonctions renvoient alors
// simplement `null` / `false` et l'app propose la saisie manuelle.

import { Capacitor } from "@capacitor/core";

async function getPlugin() {
  const { Contacts } = await import("@capacitor-community/contacts");
  return Contacts;
}

// Ouvre le sélecteur natif de contacts du téléphone et renvoie un objet
// { nom, telephone, email } prêt à préremplir le formulaire, ou `null` si
// l'utilisateur a annulé ou si la fonctionnalité n'est pas disponible (web).
export async function choisirContactTelephone() {
  if (!Capacitor.isNativePlatform()) return null;
  const Contacts = await getPlugin();

  const perm = await Contacts.checkPermissions();
  if (perm.contacts !== "granted") {
    const demande = await Contacts.requestPermissions();
    if (demande.contacts !== "granted") {
      throw new Error("Permission refusée pour accéder au répertoire du téléphone.");
    }
  }

  const { contact } = await Contacts.pickContact({
    projection: { name: true, phones: true, emails: true },
  });
  if (!contact) return null;

  const telephone = contact.phones && contact.phones.length > 0 ? contact.phones[0].number : "";
  const email = contact.emails && contact.emails.length > 0 ? contact.emails[0].address : "";
  const nom = contact.name?.display || [contact.name?.given, contact.name?.family].filter(Boolean).join(" ") || "";

  return { nom, telephone: telephone || "", email: email || "" };
}

// Enregistre un fournisseur/client de l'app dans le répertoire natif du
// téléphone. Renvoie `true` en cas de succès, `false` si indisponible (web).
export async function enregistrerDansRepertoire({ nom, telephone, email }) {
  if (!Capacitor.isNativePlatform()) return false;
  const Contacts = await getPlugin();

  const perm = await Contacts.checkPermissions();
  if (perm.contacts !== "granted") {
    const demande = await Contacts.requestPermissions();
    if (demande.contacts !== "granted") {
      throw new Error("Permission refusée pour accéder au répertoire du téléphone.");
    }
  }

  const [given, ...reste] = (nom || "").trim().split(" ");
  await Contacts.createContact({
    contact: {
      name: { given: given || nom, family: reste.join(" ") || null },
      phones: telephone ? [{ type: "mobile", number: telephone, isPrimary: true }] : [],
      emails: email ? [{ type: "work", address: email, isPrimary: true }] : [],
    },
  });
  return true;
}

export function surAppareilNatif() {
  return Capacitor.isNativePlatform();
}
