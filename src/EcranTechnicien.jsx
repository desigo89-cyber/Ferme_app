import React, { useState, useMemo } from "react";
import { LogOut, ChevronDown, Filter } from "lucide-react";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Configuration des champs par section — dupliquée localement pour rester
// autonome ; doit être tenue à jour avec FIELD_CONFIG_PAR_SECTION dans App.jsx
// si de nouvelles espèces détaillées sont ajoutées.
const CHAMPS_ELEVAGE_COMMUN = [
  { key: "poids", label: "Poids moyen (kg)", type: "number", step: "0.01" },
  { key: "alimentJour", label: "Aliment consommé (kg)", type: "number" },
  { key: "stock", label: "Stock (têtes)", type: "number" },
  { key: "entrees", label: "Entrées", type: "number" },
  { key: "sorties", label: "Sorties", type: "number" },
  { key: "malades", label: "Malades", type: "number" },
  { key: "morts", label: "Morts", type: "number" },
  { key: "vendus", label: "Vendus", type: "number" },
  { key: "transferes", label: "Transférés", type: "number" },
  { key: "perdus", label: "Perdus", type: "number" },
  { key: "traitement", label: "Traitement administré", type: "text" },
];

const CHAMPS_VEGETAL_COMMUN = [
  { key: "speculation", label: "Spéculation (culture)", type: "text" },
  { key: "superficie", label: "Superficie (ha)", type: "number", step: "0.01" },
  { key: "densite", label: "Densité de semis", type: "text" },
  { key: "labour", label: "Labour effectué", type: "text" },
  { key: "semis", label: "Semis effectué", type: "text" },
  { key: "semences", label: "Semences utilisées (kg)", type: "number" },
  { key: "sarclages", label: "Nombre de sarclages", type: "number" },
  { key: "engraisOrganique", label: "Engrais organique utilisé (kg)", type: "number" },
  { key: "engraisChimique", label: "Engrais chimique utilisé (kg)", type: "number" },
  { key: "mainOeuvrePayee", label: "Nombre de mains d'œuvre payées", type: "number" },
  { key: "rendement", label: "Rendement (kg/ha)", type: "number" },
  { key: "traitement", label: "Traitement phytosanitaire", type: "text" },
];

const CHAMPS_TRANSFORMATION_COMMUN = [
  { key: "matierePremiere", label: "Matière première utilisée (kg)", type: "number" },
  { key: "quantiteProduite", label: "Quantité produite", type: "number" },
  { key: "quantiteVendue", label: "Quantité vendue", type: "number" },
  { key: "quantiteStockee", label: "Quantité stockée", type: "number" },
  { key: "pertes", label: "Pertes / déchets", type: "number" },
  { key: "mainOeuvrePayee", label: "Nombre de mains d'œuvre payées", type: "number" },
];

const CHAMPS_COMPOSTAGE = [
  { key: "matiereVerte", label: "Matière verte (kg)", type: "number" },
  { key: "matiereAnimale", label: "Matière animale (kg)", type: "number" },
  { key: "cendre", label: "Cendre (kg)", type: "number" },
  { key: "terreauLimon", label: "Terreau ou limon (kg)", type: "number" },
  { key: "eau", label: "Eau (litres)", type: "number" },
  { key: "compostSolideProduit", label: "Compost solide produit (kg)", type: "number" },
  { key: "engraisLiquideProduit", label: "Engrais liquide produit (litres)", type: "number", step: "0.1" },
  { key: "quantiteTotaleProduite", label: "Quantité totale produite", type: "number" },
  { key: "quantiteStockee", label: "Quantité stockée", type: "number" },
  { key: "quantiteVendue", label: "Quantité vendue", type: "number" },
  { key: "quantiteTransferee", label: "Quantité transférée", type: "number" },
  { key: "mainOeuvrePayee", label: "Nombre de mains d'œuvre payées", type: "number" },
];

const LIBELLE_SPECULATION_PAR_SECTION = {
  "Maraîchage": "Type de produit maraîcher",
  "Céréales": "Type de céréale",
  "Agroforesterie": "Type d'arbre produit",
  "Pépinière": "Type de plant/arbre en pépinière",
  "Semence": "Type de semence produite",
};

function getChampsVegetal(nomSection) {
  const libelle = LIBELLE_SPECULATION_PAR_SECTION[nomSection] || "Spéculation (culture)";
  return CHAMPS_VEGETAL_COMMUN.map((c) => c.key === "speculation" ? { ...c, label: libelle } : c);
}

const SECTIONS_TRANSFORMATION = ["Transformation artisanale de produits locaux", "Pâtisserie industrielle", "Restauration"];

const SECTIONS_VEGETALES = ["Maraîchage", "Céréales", "Agroforesterie", "Pépinière", "Semence"];

const FIELD_CONFIG_PAR_SECTION = {
  "Pondeuse": { reproduction: [
    { key: "oeufsPondus", label: "Œufs pondus (jour)", type: "number" },
    { key: "tauxPonte", label: "Taux de ponte (%)", type: "number", step: "0.1" },
    { key: "oeufsCouves", label: "Œufs mis en couvaison", type: "number" },
    { key: "eclosions", label: "Éclosions", type: "number" },
  ]},
  "Chair": { reproduction: [] },
  "Porc": { reproduction: [
    { key: "saillie", label: "Saillies", type: "number" },
    { key: "gestation", label: "Femelles gestantes", type: "number" },
    { key: "miseBas", label: "Mises bas", type: "number" },
    { key: "sevrage", label: "Sevrages", type: "number" },
  ]},
  "Bovin": { reproduction: [
    { key: "saillie", label: "Saillies / inséminations", type: "number" },
    { key: "gestation", label: "Femelles gestantes", type: "number" },
    { key: "miseBas", label: "Mises bas", type: "number" },
    { key: "sevrage", label: "Sevrages", type: "number" },
  ]},
  "Ovin": { reproduction: [
    { key: "saillie", label: "Saillies", type: "number" },
    { key: "gestation", label: "Femelles gestantes", type: "number" },
    { key: "miseBas", label: "Mises bas", type: "number" },
    { key: "sevrage", label: "Sevrages", type: "number" },
  ]},
  "Caprin": { reproduction: [
    { key: "saillie", label: "Saillies", type: "number" },
    { key: "gestation", label: "Femelles gestantes", type: "number" },
    { key: "miseBas", label: "Mises bas", type: "number" },
    { key: "sevrage", label: "Sevrages", type: "number" },
  ]},
  "Autres volailles": { reproduction: [
    { key: "oeufsPondus", label: "Œufs pondus (jour)", type: "number" },
    { key: "oeufsCouves", label: "Œufs mis en couvaison", type: "number" },
    { key: "eclosions", label: "Éclosions", type: "number" },
  ]},
  "Équin": { reproduction: [
    { key: "saillie", label: "Saillies", type: "number" },
    { key: "gestation", label: "Femelles gestantes", type: "number" },
    { key: "miseBas", label: "Mises bas (poulinages)", type: "number" },
    { key: "sevrage", label: "Sevrages", type: "number" },
  ]},
  "Asin": { reproduction: [
    { key: "saillie", label: "Saillies", type: "number" },
    { key: "gestation", label: "Femelles gestantes", type: "number" },
    { key: "miseBas", label: "Mises bas", type: "number" },
    { key: "sevrage", label: "Sevrages", type: "number" },
  ]},
  "Apiculture": { reproduction: [
    { key: "essaimage", label: "Essaimages", type: "number" },
    { key: "nombreRuches", label: "Nombre de ruches actives", type: "number" },
    { key: "mielRecolte", label: "Miel récolté (litres)", type: "number", step: "0.1" },
    { key: "mielVendu", label: "Miel vendu (litres)", type: "number", step: "0.1" },
    { key: "mielStocke", label: "Miel stocké (litres)", type: "number", step: "0.1" },
  ]},
  "Pisciculture": { reproduction: [
    { key: "empoissonnement", label: "Alevins mis en bassin", type: "number" },
    { key: "recoltePoisson", label: "Récolte (kg)", type: "number" },
  ]},
};

const CHAMPS_SIMPLES_DEFAUT = [
  { key: "activite", label: "Activité réalisée", type: "textarea" },
  { key: "quantiteRecoltee", label: "Quantité récoltée", type: "number" },
  { key: "quantiteLivree", label: "Quantité livrée à la vente", type: "number" },
  { key: "morts", label: "Animaux morts", type: "number" },
  { key: "produitsUtilises", label: "Produits phytosanitaires / vétérinaires utilisés", type: "textarea" },
];

function getConfigSection(nomSection) {
  const config = FIELD_CONFIG_PAR_SECTION[nomSection];
  if (config) return { champs: [...CHAMPS_ELEVAGE_COMMUN, ...config.reproduction] };
  if (SECTIONS_VEGETALES.includes(nomSection)) return { champs: getChampsVegetal(nomSection) };
  if (SECTIONS_TRANSFORMATION.includes(nomSection)) return { champs: CHAMPS_TRANSFORMATION_COMMUN };
  if (nomSection === "Compostage") return { champs: CHAMPS_COMPOSTAGE };
  return { champs: CHAMPS_SIMPLES_DEFAUT };
}

function ChampSaisie({ champ, valeur, onChange }) {
  if (champ.type === "select") {
    return (
      <div className="mb-3">
        <label className="text-xs text-[#8B8974] block mb-1.5">{champ.label}</label>
        <select
          value={valeur || ""}
          onChange={(e) => onChange(champ.key, e.target.value)}
          className="w-full border border-[#DFD8C2] rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="">Sélectionner…</option>
          {champ.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }
  if (champ.type === "textarea") {
    return (
      <div className="mb-3">
        <label className="text-xs text-[#8B8974] block mb-1.5">{champ.label}</label>
        <textarea
          rows={2}
          value={valeur || ""}
          onChange={(e) => onChange(champ.key, e.target.value)}
          className="w-full border border-[#DFD8C2] rounded-md px-3 py-2 text-sm bg-white"
        />
      </div>
    );
  }
  if (champ.type === "text") {
    return (
      <div className="mb-3">
        <label className="text-xs text-[#8B8974] block mb-1.5">{champ.label}</label>
        <input
          type="text"
          value={valeur || ""}
          onChange={(e) => onChange(champ.key, e.target.value)}
          className="w-full border border-[#DFD8C2] rounded-md px-3 py-2 text-sm bg-white"
        />
      </div>
    );
  }
  return (
    <div className="mb-3">
      <label className="text-xs text-[#8B8974] block mb-1.5">{champ.label}</label>
      <input
        type="number"
        step={champ.step || "1"}
        value={valeur ?? ""}
        onChange={(e) => onChange(champ.key, e.target.value)}
        placeholder="0"
        className="w-full border border-[#DFD8C2] rounded-md px-3 py-2 text-sm bg-white"
      />
    </div>
  );
}

function EcranSaisie({ sections, data, update, gestionnaire }) {
  const [sectionId, setSectionId] = useState(sections[0]?.id || "");
  const [valeurs, setValeurs] = useState({});
  const [confirme, setConfirme] = useState(false);

  const section = sections.find((s) => s.id === sectionId);
  const config = section ? getConfigSection(section.nom) : null;

  const onChangeChamp = (key, val) => setValeurs((prev) => ({ ...prev, [key]: val }));

  const enregistrer = () => {
    if (!section) return;
    update((d) => {
      d.saisiesTechnicien.push({
        id: uid(),
        gestionnaireId: gestionnaire.id,
        sectionId: section.id,
        date: today(),
        timestamp: new Date().toISOString(),
        champs: valeurs,
      });
    });
    setValeurs({});
    setConfirme(true);
    setTimeout(() => setConfirme(false), 2500);
  };

  return (
    <div className="p-4">
      {sections.length > 1 && (
        <div className="mb-4">
          <label className="text-xs text-[#8B8974] block mb-1.5">Section</label>
          <select
            value={sectionId}
            onChange={(e) => { setSectionId(e.target.value); setValeurs({}); }}
            className="w-full border border-[#DFD8C2] rounded-md px-3 py-2 text-sm bg-white"
          >
            {sections.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
        </div>
      )}

      {!section ? (
        <p className="text-sm text-[#8B8974]">Aucune section ne vous est encore assignée. Contactez votre administrateur.</p>
      ) : (
        <>
          <h2 className="font-serif text-lg mb-1">{section.nom}</h2>
          <p className="text-xs text-[#8B8974] mb-4">Saisie journalière</p>
          {config.champs.map((champ) => (
            <ChampSaisie key={champ.key} champ={champ} valeur={valeurs[champ.key]} onChange={onChangeChamp} />
          ))}
          {confirme && <p className="text-xs text-[#5B7A4A] mb-2">Journée enregistrée.</p>}
          <button
            onClick={enregistrer}
            className="w-full h-11 bg-[#2F3B2C] text-[#F3EFE2] rounded-md text-sm font-medium mt-2"
          >
            Enregistrer la journée
          </button>
        </>
      )}
    </div>
  );
}

function EcranHistorique({ sections, saisies }) {
  const [filtreSectionId, setFiltreSectionId] = useState("toutes");

  const saisiesFiltrees = useMemo(() => {
    return saisies
      .filter((s) => filtreSectionId === "toutes" || s.sectionId === filtreSectionId)
      .slice()
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [saisies, filtreSectionId]);

  return (
    <div className="p-4">
      <div className="flex gap-2 overflow-x-auto mb-4 pb-1">
        <button
          onClick={() => setFiltreSectionId("toutes")}
          className={`text-xs px-3 py-1 rounded-md whitespace-nowrap border ${filtreSectionId === "toutes" ? "bg-[#2F3B2C] text-[#F3EFE2] border-[#2F3B2C]" : "border-[#DFD8C2] text-[#8B8974]"}`}
        >
          Toutes sections
        </button>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setFiltreSectionId(s.id)}
            className={`text-xs px-3 py-1 rounded-md whitespace-nowrap border ${filtreSectionId === s.id ? "bg-[#2F3B2C] text-[#F3EFE2] border-[#2F3B2C]" : "border-[#DFD8C2] text-[#8B8974]"}`}
          >
            {s.nom}
          </button>
        ))}
      </div>

      {saisiesFiltrees.length === 0 ? (
        <p className="text-sm text-[#8B8974]">Aucune saisie enregistrée pour le moment.</p>
      ) : (
        <div className="space-y-2">
          {saisiesFiltrees.map((s) => {
            const section = sections.find((x) => x.id === s.sectionId);
            const entrees = Object.entries(s.champs || {}).filter(([, v]) => v !== "" && v !== undefined && v !== null);
            return (
              <div key={s.id} className="border border-[#DFD8C2] rounded-md px-3 py-2.5 bg-white">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{section ? section.nom : "Section supprimée"}</span>
                  <span className="text-xs text-[#8B8974]">{new Date(s.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6E6B58]">
                  {entrees.length === 0 ? (
                    <span>Aucune valeur saisie</span>
                  ) : entrees.map(([k, v]) => (
                    <span key={k}>{k} : {String(v)}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function EcranTechnicien({ data, update, gestionnaire, onDeconnexion }) {
  const [onglet, setOnglet] = useState("saisie");

  const sections = useMemo(() => {
    const assignees = gestionnaire.sectionsAssignees || [];
    return data.sectionsProduction.filter((s) => s.actif !== false && assignees.includes(s.id));
  }, [data.sectionsProduction, gestionnaire.sectionsAssignees]);

  const mesSaisies = useMemo(() => {
    return data.saisiesTechnicien.filter((s) => s.gestionnaireId === gestionnaire.id);
  }, [data.saisiesTechnicien, gestionnaire.id]);

  return (
    <div className="min-h-screen bg-[#EFEAD9] text-[#232620] flex flex-col">
      <header className="bg-[#2F3B2C] text-[#F3EFE2] px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{gestionnaire.nom}</p>
          <p className="text-xs text-[#C7C2A8]">Technicien</p>
        </div>
        <button onClick={onDeconnexion} className="text-[#C7C2A8] hover:text-white">
          <LogOut size={18} />
        </button>
      </header>

      <div className="flex border-b border-[#DFD8C2] bg-white">
        <button
          onClick={() => setOnglet("saisie")}
          className={`flex-1 text-sm py-2.5 ${onglet === "saisie" ? "text-[#2F3B2C] border-b-2 border-[#2F3B2C] font-medium" : "text-[#8B8974]"}`}
        >
          Saisie du jour
        </button>
        <button
          onClick={() => setOnglet("historique")}
          className={`flex-1 text-sm py-2.5 ${onglet === "historique" ? "text-[#2F3B2C] border-b-2 border-[#2F3B2C] font-medium" : "text-[#8B8974]"}`}
        >
          Historique
        </button>
      </div>

      <div className="flex-1 max-w-lg w-full mx-auto">
        {onglet === "saisie" ? (
          <EcranSaisie sections={sections} data={data} update={update} gestionnaire={gestionnaire} />
        ) : (
          <EcranHistorique sections={sections} saisies={mesSaisies} />
        )}
      </div>
    </div>
  );
}
