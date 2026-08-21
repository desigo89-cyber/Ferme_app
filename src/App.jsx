import React, { useState, useEffect, useMemo } from "react";
import {
  Sprout, PawPrint, Boxes, Wallet, ListChecks, LayoutDashboard,
  Plus, X, Trash2, AlertTriangle, Calendar, ChevronRight, Heart, Baby, Milk,
  FileText, Landmark, Banknote, Smartphone, Lock, KeyRound, Eye, EyeOff, BarChart3, Package, TrendingUp, Settings,
  Users, Share2, Palette, Image as ImageIcon, Coins, CalendarOff, UserCircle, Building2,
  PiggyBank, Percent, HandCoins, Contact, Phone, Mail, PenTool, Send, Check, ClipboardList
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { storage } from "./storage.js";
import { partagerSauvegarde, partagerDocument } from "./share.js";
import * as sync from "./sync.js";

// ---------- Design tokens ----------
// bg (paper): #EFEAD9 | surface: #FFFFFF | ink: #232620 | muted: #6E6B58
// primary (feuillage): #2F3B2C | accent (ble): #C08A2E | clay: #8B5E3C | alert: #A6402A

const uid = () => crypto.randomUUID();
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—");

const STORAGE_KEY = "ferme-app-data-v1";

const emptyState = {
  ferme: {
    nom: "Ma Ferme", logo: null, devise: "FCFA", theme: "vert",
    nif: "", rccm: "", adresse: "", email: "", telephone: "", siteWeb: "", reseauxSociaux: "",
  },
  parcelles: [],
  animaux: [],
  stocks: [],
  transactions: [],
  taches: [],
  comptes: [],
  documents: [],
  mouvementsStock: [],
  produits: [],
  employes: [],
  investissements: [],
  investisseurs: [],
  prets: [],
  gestionnaires: [],
  connexions: [],
  tiers: [],
  departements: [],
  categoriesDepenses: [],
  sectionsProduction: [],
  productions: [],
  security: { password: null },
};

const MODULE_COLORS = {
  cultures: "#5B7A4A",
  elevage: "#8B5E3C",
  stocks: "#C08A2E",
  finances: "#2F3B2C",
  documents: "#7A8B99",
};
const MODULE_LABELS = { cultures: "Cultures", elevage: "Élevage", stocks: "Stocks", finances: "Finances", documents: "Documents" };

const COMPTE_ICONS = { banque: Landmark, caisse: Banknote, mobile_money: Smartphone };
const COMPTE_LABELS = { banque: "Banque", caisse: "Caisse", mobile_money: "Mobile Money" };
const DOC_LABELS = { recu: "Reçu", facture: "Facture", bordereau_reception: "Bordereau de réception", commande: "Commande" };

const CONTRAT_LABELS = { cdi: "CDI", cdd: "CDD", stage: "Stage", essai: "Période d'essai", prestation: "Prestation" };

const HIERARCHIE_POSTES = [
  "Ouvrier",
  "Agent de livraison",
  "Poste de vente",
  "Technicien de production",
  "Responsable de département",
  "Responsable de site",
  "Gérant / Responsable de l'entreprise",
  "Promoteur de l'entreprise",
];
const COMPETENCES_SUGGESTIONS = [
  "Agronome", "Comptable", "Chauffeur", "Ingénieur", "Gestionnaire", "Vétérinaire", "Commercial", "Technicien",
];
const DOC_PERSO_LABELS = { cv: "CV", attestation: "Attestation", contrat: "Contrat", piece_identite: "Pièce d'identité", diplome: "Diplôme", autre: "Autre" };

const DEPARTEMENTS_DEFAUT = [
  { nom: "Production animale", code: "PA" },
  { nom: "Production végétale", code: "PV" },
  { nom: "Aquaculture", code: "AQ" },
  { nom: "Apiculture", code: "AP" },
  { nom: "Transport de produits agricoles", code: "TR" },
  { nom: "Boutique intrant agricole", code: "BI" },
  { nom: "Autres activités", code: "AU" },
];

const CATEGORIES_DEPENSES_DEFAUT = [
  { nom: "Matière première", type: "variable", code: "CHV-01" },
  { nom: "Semences", type: "variable", code: "CHV-02" },
  { nom: "Alimentation animale", type: "variable", code: "CHV-03" },
  { nom: "Intrants agricoles", type: "variable", code: "CHV-04" },
  { nom: "Emballage", type: "variable", code: "CHV-05" },
  { nom: "Carburant", type: "fixe", code: "CHF-01" },
  { nom: "Communication", type: "fixe", code: "CHF-02" },
  { nom: "Repas", type: "fixe", code: "CHF-03" },
  { nom: "Condiment", type: "fixe", code: "CHF-04" },
  { nom: "Fournitures", type: "fixe", code: "CHF-05" },
  { nom: "Bureautique", type: "fixe", code: "CHF-06" },
  { nom: "Petits matériels", type: "fixe", code: "CHF-07" },
  { nom: "Loyer", type: "fixe", code: "CHF-08" },
  { nom: "Assurance", type: "fixe", code: "CHF-09" },
  { nom: "Entretien matériel", type: "fixe", code: "CHF-10" },
];

const SECTIONS_PRODUCTION_DEFAUT = [
  { nom: "Maraîchage", code: "SEC-01" },
  { nom: "Culture céréalière", code: "SEC-02" },
  { nom: "Arboriculture", code: "SEC-03" },
  { nom: "Pondeuse", code: "SEC-04" },
  { nom: "Chair", code: "SEC-05" },
  { nom: "Pisciculture", code: "SEC-06" },
  { nom: "Apiculture", code: "SEC-07" },
  { nom: "Transport", code: "SEC-08" },
  { nom: "Vente", code: "SEC-09" },
];
const CHARGE_LABELS = { variable: "Charge variable", fixe: "Charge fixe", sociale: "Charge sociale", salariale: "Salaire", autre: "Autre" };
const DEVISES = ["FCFA", "EUR", "USD", "GNF", "MAD", "CDF"];

const THEMES = {
  vert: { primary: "#2F3B2C", primaryDark: "#242E21", accent: "#C08A2E", accentDark: "#A9761F", bg: "#EFEAD9", nav: "#B9C4AE" },
  bleu: { primary: "#1E3A5F", primaryDark: "#162C48", accent: "#3B82A0", accentDark: "#2F6A85", bg: "#E8EEF2", nav: "#A9C2D6" },
  brun: { primary: "#4A342A", primaryDark: "#3A281F", accent: "#B5651D", accentDark: "#95511A", bg: "#F0E6DA", nav: "#C9AE97" },
  vertBlanc: { primary: "#2F3B2C", primaryDark: "#242E21", accent: "#C08A2E", accentDark: "#A9761F", bg: "#FFFFFF", nav: "#B9C4AE", totalBg: "#2F3B2C", totalText: "#FFFFFF" },
  bleuBlanc: { primary: "#1E3A5F", primaryDark: "#162C48", accent: "#3B82A0", accentDark: "#2F6A85", bg: "#FFFFFF", nav: "#A9C2D6", totalBg: "#1E3A5F", totalText: "#FFFFFF" },
};

const THEME_LABELS = { vert: "Vert", bleu: "Bleu", brun: "Brun", vertBlanc: "Vert — corps blanc", bleuBlanc: "Bleu — corps blanc" };

function money(amount, devise) {
  return `${Number(amount || 0).toLocaleString("fr-FR")} ${devise || "FCFA"}`;
}

// ---------- Small UI primitives ----------
function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-lg border border-[#DFD8C2] shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Badge({ children, tone = "default" }) {
  const tones = {
    default: "bg-[#EFEAD9] text-[#5A5744] border-[#DFD8C2]",
    good: "bg-[#EAF0E6] text-[#3C5A34] border-[#C9DBC0]",
    warn: "bg-[#F7E9D2] text-[#8B5E14] border-[#EAD3A0]",
    bad: "bg-[#F5DFDA] text-[#A6402A] border-[#E9BCB0]",
    accent: "bg-[#F3E4C4] text-[#7A5715] border-[#E6CB8F]",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Button({ children, onClick, variant = "primary", type = "button", className = "", disabled }) {
  const base = "inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[var(--color-primary)] text-[#F3EFE2] hover:bg-[var(--color-primary-dark)]",
    accent: "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-dark)]",
    ghost: "bg-transparent text-[#2F3B2C] hover:bg-[#E9E3CF] border border-[#DFD8C2]",
    danger: "bg-transparent text-[#A6402A] hover:bg-[#F5DFDA] border border-[#E9BCB0]",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-[#6E6B58] mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full rounded-md border border-[#DFD8C2] bg-[#FFFEFB] px-3 py-2 text-sm text-[#232620] focus:outline-none focus:ring-2 focus:ring-[#C08A2E] focus:border-transparent";

function Input(props) {
  return <input {...props} className={`${inputCls} ${props.className || ""}`} />;
}
function Select(props) {
  return <select {...props} className={`${inputCls} ${props.className || ""}`} />;
}
function TextArea(props) {
  return <textarea {...props} className={`${inputCls} ${props.className || ""}`} rows={props.rows || 2} />;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-[#FBF9F2] w-full sm:max-w-lg sm:rounded-lg rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DFD8C2] sticky top-0 bg-[#FBF9F2]">
          <h3 className="font-serif text-lg text-[#232620]">{title}</h3>
          <button onClick={onClose} className="text-[#6E6B58] hover:text-[#232620]">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <Icon size={28} className="text-[#C7C2A8] mb-3" />
      <p className="text-sm text-[#6E6B58] mb-4">{text}</p>
      {action}
    </div>
  );
}

// ============================================================
export default function FarmApp() {
  const [data, setData] = useState(emptyState);
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [currentGestionnaireId, setCurrentGestionnaireId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(STORAGE_KEY);
        const seed = (merged) => {
          if (!merged.departements || merged.departements.length === 0) {
            merged.departements = DEPARTEMENTS_DEFAUT.map((d) => ({ id: uid(), ...d, actif: true }));
          }
          if (!merged.categoriesDepenses || merged.categoriesDepenses.length === 0) {
            merged.categoriesDepenses = CATEGORIES_DEPENSES_DEFAUT.map((c) => ({ id: uid(), ...c, actif: true }));
          }
          if (!merged.sectionsProduction || merged.sectionsProduction.length === 0) {
            merged.sectionsProduction = SECTIONS_PRODUCTION_DEFAUT.map((s) => ({ id: uid(), ...s, actif: true }));
          }
          return merged;
        };
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          const merged = seed({ ...emptyState, ...parsed });
          setData(merged);
          const verrouille = !!parsed?.security?.password || (parsed?.gestionnaires || []).length > 0;
          setUnlocked(!verrouille);
        } else {
          setData(seed({ ...emptyState }));
          setUnlocked(true);
        }
      } catch (e) {
        setUnlocked(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    (async () => {
      try {
        const result = await storage.set(STORAGE_KEY, JSON.stringify(data));
        setSaveError(!result);
      } catch (e) {
        setSaveError(true);
      }
    })();
  }, [data, loading]);

  const update = (fn) => setData((prev) => {
    const next = structuredClone(prev);
    fn(next);
    return next;
  });

  const tabs = [
    { id: "dashboard", label: "Accueil", icon: LayoutDashboard },
    { id: "cultures", label: "Cultures", icon: Sprout },
    { id: "elevage", label: "Élevage", icon: PawPrint },
    { id: "stocks", label: "Stocks", icon: Boxes },
    { id: "finances", label: "Finances", icon: Wallet },
    { id: "produits", label: "Produits", icon: Package },
    { id: "production", label: "Circuit production", icon: ClipboardList },
    { id: "comptes", label: "Comptes", icon: Landmark },
    { id: "investissements", label: "Investissements", icon: PiggyBank },
    { id: "contacts", label: "Fournisseurs & clients", icon: Contact },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "rapport", label: "Rapport", icon: BarChart3 },
    { id: "personnel", label: "Personnel", icon: Users },
    { id: "taches", label: "Tâches", icon: ListChecks },
  ];

  const theme = THEMES[data.ferme.theme] || THEMES.vert;
  const themeVars = {
    "--color-primary": theme.primary,
    "--color-primary-dark": theme.primaryDark,
    "--color-accent": theme.accent,
    "--color-accent-dark": theme.accentDark,
    "--color-bg": theme.bg,
    "--color-nav": theme.nav,
    "--color-total-bg": theme.totalBg || "transparent",
    "--color-total-text": theme.totalText || "inherit",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFEAD9] flex items-center justify-center">
        <p className="text-[#6E6B58] text-sm">Chargement de la ferme…</p>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <LockScreen
        nomFerme={data.ferme.nom}
        password={data.security?.password}
        gestionnaires={data.gestionnaires}
        onUnlock={(gestionnaireId) => {
          if (gestionnaireId) {
            update((d) => { d.connexions.push({ id: uid(), gestionnaireId, date: today(), heure: new Date().toISOString() }); });
            setCurrentGestionnaireId(gestionnaireId);
          }
          setUnlocked(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[#232620]" style={themeVars}>
      <header className="bg-[var(--color-primary)] text-[#F3EFE2] px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data.ferme.logo && <img src={data.ferme.logo} alt="Logo" className="h-9 w-9 rounded-full object-cover bg-white" />}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-nav)]">SénèApp</p>
              <h1 className="font-serif text-xl sm:text-2xl">{data.ferme.nom}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saveError && (
              <span className="flex items-center gap-1 text-xs text-[#F3D9A0]">
                <AlertTriangle size={14} /> Sauvegarde impossible
              </span>
            )}
            <button onClick={() => setShowSecurity(true)} className="text-[var(--color-nav)] hover:text-white" title="Paramètres">
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {showSecurity && (
        <ParametresModal
          data={data}
          update={update}
          onClose={() => setShowSecurity(false)}
        />
      )}

      <nav className="bg-[var(--color-primary)] border-t border-[#3E4A3A] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex overflow-x-auto no-scrollbar px-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                  active ? "border-[var(--color-accent)] text-white" : "border-transparent text-[var(--color-nav)] hover:text-white"
                }`}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {tab === "dashboard" && <Dashboard data={data} setTab={setTab} />}
        {tab === "cultures" && <Cultures data={data} update={update} />}
        {tab === "elevage" && <Elevage data={data} update={update} />}
        {tab === "stocks" && <Stocks data={data} update={update} />}
        {tab === "finances" && <Finances data={data} update={update} />}
        {tab === "produits" && <Produits data={data} update={update} />}
        {tab === "production" && <ProductionCircuit data={data} update={update} />}
        {tab === "comptes" && <Comptes data={data} update={update} />}
        {tab === "investissements" && <Investissements data={data} update={update} />}
        {tab === "contacts" && <Contacts data={data} update={update} />}
        {tab === "documents" && <Documents data={data} update={update} />}
        {tab === "rapport" && <RapportMensuel data={data} />}
        {tab === "personnel" && <Personnel data={data} update={update} />}
        {tab === "taches" && <Taches data={data} update={update} />}
      </main>
    </div>
  );
}

// ============================================================
// SÉCURITÉ (verrouillage par mot de passe)
// ============================================================
function LockScreen({ nomFerme, password, gestionnaires = [], onUnlock }) {
  const gestionnairesActifs = gestionnaires.filter((g) => g.actif !== false);
  const modeMultiUtilisateurs = gestionnairesActifs.length > 0;
  const [selectedGestionnaire, setSelectedGestionnaire] = useState(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [show, setShow] = useState(false);

  const submitPassword = (e) => {
    e.preventDefault();
    if (value === password) {
      onUnlock(null);
    } else {
      setError(true);
    }
  };

  const submitCode = (e) => {
    e.preventDefault();
    if (selectedGestionnaire && value === selectedGestionnaire.code) {
      onUnlock(selectedGestionnaire.id);
    } else {
      setError(true);
    }
  };

  if (modeMultiUtilisateurs && !selectedGestionnaire) {
    return (
      <div className="min-h-screen bg-[#2F3B2C] flex items-center justify-center p-4">
        <Card className="p-6 w-full max-w-sm">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="h-10 w-10 rounded-full bg-[#EFEAD9] flex items-center justify-center mb-3">
              <UserCircle size={18} className="text-[#2F3B2C]" />
            </div>
            <h2 className="font-serif text-lg">{nomFerme}</h2>
            <p className="text-xs text-[#8B8974] mt-1">Qui êtes-vous ?</p>
          </div>
          <div className="space-y-2">
            {gestionnairesActifs.map((g) => (
              <button
                key={g.id}
                onClick={() => { setSelectedGestionnaire(g); setValue(""); setError(false); }}
                className="w-full text-left px-3.5 py-2.5 rounded-md border border-[#DFD8C2] hover:bg-[#E9E3CF] flex items-center gap-2"
              >
                <UserCircle size={16} className="text-[#8B5E3C]" />
                <span className="text-sm">{g.nom}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2F3B2C] flex items-center justify-center p-4">
      <Card className="p-6 w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="h-10 w-10 rounded-full bg-[#EFEAD9] flex items-center justify-center mb-3">
            <Lock size={18} className="text-[#2F3B2C]" />
          </div>
          <h2 className="font-serif text-lg">{modeMultiUtilisateurs ? selectedGestionnaire.nom : nomFerme}</h2>
          <p className="text-xs text-[#8B8974] mt-1">{modeMultiUtilisateurs ? "Entrez votre code d'entrée" : "Entrez le mot de passe pour continuer"}</p>
        </div>
        <form onSubmit={modeMultiUtilisateurs ? submitCode : submitPassword} className="space-y-3">
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(false); }}
              placeholder={modeMultiUtilisateurs ? "Code" : "Mot de passe"}
              autoFocus
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B8974]">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <p className="text-xs text-[#A6402A]">{modeMultiUtilisateurs ? "Code incorrect." : "Mot de passe incorrect."}</p>}
          <Button type="submit" variant="accent" className="w-full">Déverrouiller</Button>
          {modeMultiUtilisateurs && (
            <button type="button" onClick={() => { setSelectedGestionnaire(null); setValue(""); setError(false); }} className="w-full text-xs text-[#8B8974] hover:text-[#232620]">
              ← Ce n'est pas moi
            </button>
          )}
        </form>
      </Card>
    </div>
  );
}

function GestionnairesSection({ data, update }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showJournal, setShowJournal] = useState(false);

  const journalParJour = useMemo(() => {
    const map = {};
    (data.connexions || []).forEach((c) => {
      map[c.date] = map[c.date] || [];
      const g = data.gestionnaires.find((x) => x.id === c.gestionnaireId);
      map[c.date].push({ nom: g ? g.nom : "Gestionnaire supprimé", heure: c.heure });
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [data.connexions, data.gestionnaires]);

  return (
    <div className="border-t border-[#DFD8C2] pt-4">
      <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5"><Users size={14} /> Gestionnaires (multi-utilisateurs)</h4>
      <p className="text-xs text-[#8B8974] mb-3">Ajoutez un gestionnaire par personne qui utilise l'application, chacun avec son propre code d'entrée. Dès qu'au moins un gestionnaire est ajouté, l'écran de déverrouillage demande de choisir son nom puis son code, à la place du mot de passe unique.</p>

      {data.gestionnaires.length === 0 ? (
        <p className="text-xs text-[#8B8974] mb-3">Aucun gestionnaire enregistré pour le moment.</p>
      ) : (
        <div className="space-y-2 mb-3">
          {data.gestionnaires.map((g) => (
            <div key={g.id} className="flex items-center justify-between text-sm border border-[#DFD8C2] rounded-md px-3 py-2">
              <div className="flex items-center gap-2">
                <UserCircle size={16} className="text-[#8B5E3C]" />
                <span>{g.nom}</span>
                {g.actif === false && <Badge tone="default">Inactif</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => update((d) => { const x = d.gestionnaires.find((y) => y.id === g.id); x.actif = x.actif === false ? true : false; })}
                  className="text-xs text-[#8B5E3C]"
                >{g.actif === false ? "Activer" : "Désactiver"}</button>
                <button onClick={() => { if (confirm("Supprimer ce gestionnaire ?")) update((d) => { d.gestionnaires = d.gestionnaires.filter((x) => x.id !== g.id); }); }} className="text-[#C7C2A8] hover:text-[#A6402A]">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button variant="ghost" onClick={() => setShowAdd(true)}><Plus size={14} /> Ajouter un gestionnaire</Button>
        {data.connexions.length > 0 && <Button variant="ghost" onClick={() => setShowJournal(true)}><CalendarOff size={14} /> Journal des connexions</Button>}
      </div>

      {showAdd && (
        <Modal title="Nouveau gestionnaire" onClose={() => setShowAdd(false)}>
          <GestionnaireForm
            onSubmit={(vals) => {
              update((d) => d.gestionnaires.push({ id: uid(), ...vals, actif: true }));
              setShowAdd(false);
            }}
          />
        </Modal>
      )}

      {showJournal && (
        <Modal title="Journal des gestionnaires par jour" onClose={() => setShowJournal(false)}>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {journalParJour.length === 0 ? (
              <p className="text-sm text-[#8B8974]">Aucune connexion enregistrée.</p>
            ) : (
              journalParJour.map(([date, entries]) => (
                <div key={date} className="border-b border-[#EFEAD9] pb-2">
                  <p className="text-xs font-medium text-[#5A5744]">{fmtDate(date)}</p>
                  <ul className="mt-1 space-y-0.5">
                    {entries.map((e, i) => (
                      <li key={i} className="text-sm flex justify-between">
                        <span>{e.nom}</span>
                        <span className="text-xs text-[#8B8974]">{new Date(e.heure).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function GestionnaireForm({ onSubmit }) {
  const [nom, setNom] = useState("");
  const [code, setCode] = useState("");
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!nom || !code) return; onSubmit({ nom, code }); }}>
      <Field label="Nom du gestionnaire"><Input value={nom} onChange={(e) => setNom(e.target.value)} /></Field>
      <Field label="Code d'entrée"><Input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex. 1234" /></Field>
      <Button type="submit" variant="accent" className="w-full">Enregistrer</Button>
    </form>
  );
}

function ListeAvecCodeSection({ data, update, champ, titre, description, icon: Icon }) {
  const [nouveauNom, setNouveauNom] = useState("");
  const [nouveauCode, setNouveauCode] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingNom, setEditingNom] = useState("");
  const [editingCode, setEditingCode] = useState("");
  const liste = data[champ];

  const ajouter = () => {
    if (!nouveauNom.trim()) return;
    update((d) => { d[champ].push({ id: uid(), nom: nouveauNom.trim(), code: nouveauCode.trim(), actif: true }); });
    setNouveauNom("");
    setNouveauCode("");
  };

  const sauverEdition = (id) => {
    if (!editingNom.trim()) return;
    update((d) => { const x = d[champ].find((y) => y.id === id); x.nom = editingNom.trim(); x.code = editingCode.trim(); });
    setEditingId(null);
  };

  return (
    <div className="border-t border-[#DFD8C2] pt-4">
      <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5"><Icon size={14} /> {titre}</h4>
      <p className="text-xs text-[#8B8974] mb-3">{description}</p>

      <div className="space-y-2 mb-3">
        {liste.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm border border-[#DFD8C2] rounded-md px-3 py-2">
            {editingId === item.id ? (
              <div className="flex items-center gap-2 flex-1">
                <Input value={editingNom} onChange={(e) => setEditingNom(e.target.value)} className="flex-1" placeholder="Nom" />
                <Input value={editingCode} onChange={(e) => setEditingCode(e.target.value)} className="w-24" placeholder="Code" />
                <button onClick={() => sauverEdition(item.id)} className="text-[#8B5E3C] text-xs">OK</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className={item.actif === false ? "text-[#8B8974] line-through" : ""}>{item.nom}</span>
                  {item.code && <Badge tone="accent">{item.code}</Badge>}
                  {item.actif === false && <Badge tone="default">Inactif</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditingId(item.id); setEditingNom(item.nom); setEditingCode(item.code || ""); }} className="text-xs text-[#8B5E3C]">Modifier</button>
                  <button
                    onClick={() => update((d) => { const x = d[champ].find((y) => y.id === item.id); x.actif = x.actif === false ? true : false; })}
                    className="text-xs text-[#8B5E3C]"
                  >{item.actif === false ? "Activer" : "Désactiver"}</button>
                  <button onClick={() => { if (confirm("Supprimer cet élément ?")) update((d) => { d[champ] = d[champ].filter((x) => x.id !== item.id); }); }} className="text-[#C7C2A8] hover:text-[#A6402A]">
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input value={nouveauNom} onChange={(e) => setNouveauNom(e.target.value)} placeholder="Nom" className="flex-1" />
        <Input value={nouveauCode} onChange={(e) => setNouveauCode(e.target.value)} placeholder="Code" className="w-24" />
        <Button variant="ghost" onClick={ajouter}><Plus size={14} /> Ajouter</Button>
      </div>
    </div>
  );
}

function CategoriesDepensesSection({ data, update }) {
  const [nouveauNom, setNouveauNom] = useState("");
  const [nouveauCode, setNouveauCode] = useState("");
  const [nouveauType, setNouveauType] = useState("variable");
  const [editingId, setEditingId] = useState(null);
  const [editingNom, setEditingNom] = useState("");
  const [editingCode, setEditingCode] = useState("");

  const ajouter = () => {
    if (!nouveauNom.trim()) return;
    update((d) => { d.categoriesDepenses.push({ id: uid(), nom: nouveauNom.trim(), code: nouveauCode.trim(), type: nouveauType, actif: true }); });
    setNouveauNom("");
    setNouveauCode("");
  };

  const sauverEdition = (id) => {
    if (!editingNom.trim()) return;
    update((d) => { const x = d.categoriesDepenses.find((y) => y.id === id); x.nom = editingNom.trim(); x.code = editingCode.trim(); });
    setEditingId(null);
  };

  return (
    <div className="border-t border-[#DFD8C2] pt-4">
      <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5"><Wallet size={14} /> Catégories de dépenses (codes analytiques)</h4>
      <p className="text-xs text-[#8B8974] mb-3">Ces catégories, avec leur code analytique, sont proposées lors de la création d'une dépense dans Finances.</p>

      {["variable", "fixe"].map((t) => (
        <div key={t} className="mb-3">
          <p className="text-xs font-medium text-[#5A5744] mb-1">{t === "variable" ? "Charges variables" : "Charges fixes"}</p>
          <div className="space-y-2">
            {data.categoriesDepenses.filter((c) => c.type === t).map((cat) => (
              <div key={cat.id} className="flex items-center justify-between text-sm border border-[#DFD8C2] rounded-md px-3 py-2">
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input value={editingNom} onChange={(e) => setEditingNom(e.target.value)} className="flex-1" placeholder="Nom" />
                    <Input value={editingCode} onChange={(e) => setEditingCode(e.target.value)} className="w-24" placeholder="Code" />
                    <button onClick={() => sauverEdition(cat.id)} className="text-[#8B5E3C] text-xs">OK</button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className={cat.actif === false ? "text-[#8B8974] line-through" : ""}>{cat.nom}</span>
                      {cat.code && <Badge tone="accent">{cat.code}</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingId(cat.id); setEditingNom(cat.nom); setEditingCode(cat.code || ""); }} className="text-xs text-[#8B5E3C]">Modifier</button>
                      <button
                        onClick={() => update((d) => { const x = d.categoriesDepenses.find((y) => y.id === cat.id); x.actif = x.actif === false ? true : false; })}
                        className="text-xs text-[#8B5E3C]"
                      >{cat.actif === false ? "Activer" : "Désactiver"}</button>
                      <button onClick={() => { if (confirm("Supprimer cette catégorie ?")) update((d) => { d.categoriesDepenses = d.categoriesDepenses.filter((x) => x.id !== cat.id); }); }} className="text-[#C7C2A8] hover:text-[#A6402A]">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-2 flex-wrap">
        <Input value={nouveauNom} onChange={(e) => setNouveauNom(e.target.value)} placeholder="Nom" className="flex-1" />
        <Input value={nouveauCode} onChange={(e) => setNouveauCode(e.target.value)} placeholder="Code" className="w-20" />
        <Select value={nouveauType} onChange={(e) => setNouveauType(e.target.value)} className="w-32">
          <option value="variable">Variable</option>
          <option value="fixe">Fixe</option>
        </Select>
        <Button variant="ghost" onClick={ajouter}><Plus size={14} /> Ajouter</Button>
      </div>
    </div>
  );
}

function ParametresModal({ data, update, onClose }) {
  const hasPassword = !!data.security?.password;
  const [nomFerme, setNomFerme] = useState(data.ferme.nom);
  const [devise, setDevise] = useState(data.ferme.devise || "FCFA");
  const [infoEntreprise, setInfoEntreprise] = useState({
    nif: data.ferme.nif || "", rccm: data.ferme.rccm || "", adresse: data.ferme.adresse || "",
    email: data.ferme.email || "", telephone: data.ferme.telephone || "",
    siteWeb: data.ferme.siteWeb || "", reseauxSociaux: data.ferme.reseauxSociaux || "",
  });
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");
  const [importError, setImportError] = useState("");
  const [partageEnCours, setPartageEnCours] = useState(false);
  const [logoError, setLogoError] = useState("");

  const [cloudConfig, setCloudConfigState] = useState(null);
  const [cloudUrl, setCloudUrl] = useState("");
  const [cloudAnonKey, setCloudAnonKey] = useState("");
  const [codeFerme, setCodeFerme] = useState("");
  const [pin, setPin] = useState("");
  const [cloudStatus, setCloudStatus] = useState("");
  const [cloudError, setCloudError] = useState("");
  const [cloudBusy, setCloudBusy] = useState(false);

  useEffect(() => {
    sync.getCloudConfig().then((cfg) => {
      if (cfg) {
        setCloudConfigState(cfg);
        setCloudUrl(cfg.url); setCloudAnonKey(cfg.anonKey); setCodeFerme(cfg.codeFerme); setPin(cfg.pin);
        setCloudStatus(`Connecté à l'espace cloud « ${cfg.codeFerme} »`);
      }
    });
  }, []);

  const buildConfig = () => ({ url: cloudUrl.trim(), anonKey: cloudAnonKey.trim(), codeFerme: codeFerme.trim(), pin: pin.trim() });

  const creerEspace = async () => {
    setCloudError(""); setCloudBusy(true);
    try {
      const cfg = buildConfig();
      if (!cfg.url || !cfg.anonKey || !cfg.codeFerme || !cfg.pin) throw new Error("Remplissez tous les champs (URL, clé, code, PIN).");
      await sync.creerEspaceCloud(cfg, data);
      await sync.setCloudConfig(cfg);
      setCloudConfigState(cfg);
      setCloudStatus(`Espace cloud créé et connecté : « ${cfg.codeFerme} »`);
    } catch (err) {
      setCloudError(err.message || "Échec de la création de l'espace cloud.");
    } finally {
      setCloudBusy(false);
    }
  };

  const rejoindreEspace = async () => {
    setCloudError(""); setCloudBusy(true);
    try {
      const cfg = buildConfig();
      if (!cfg.url || !cfg.anonKey || !cfg.codeFerme || !cfg.pin) throw new Error("Remplissez tous les champs (URL, clé, code, PIN).");
      const result = await sync.rejoindreEspaceCloud(cfg);
      if (!confirm("Rejoindre remplacera les données actuelles de cet appareil par celles du cloud. Continuer ?")) { setCloudBusy(false); return; }
      update((d) => { Object.keys(emptyState).forEach((k) => { d[k] = result.data[k] ?? emptyState[k]; }); });
      await sync.setCloudConfig(cfg);
      setCloudConfigState(cfg);
      setCloudStatus(`Connecté à l'espace cloud « ${cfg.codeFerme} » — données récupérées.`);
    } catch (err) {
      setCloudError(err.message || "Échec de la connexion à l'espace cloud.");
    } finally {
      setCloudBusy(false);
    }
  };

  const envoyerCloud = async () => {
    setCloudError(""); setCloudBusy(true);
    try {
      await sync.envoyerVersCloud(cloudConfig, data);
      setCloudStatus(`Envoyé vers le cloud à ${new Date().toLocaleTimeString("fr-FR")}`);
    } catch (err) {
      setCloudError(err.message || "Échec de l'envoi.");
    } finally {
      setCloudBusy(false);
    }
  };

  const recupererCloud = async () => {
    setCloudError(""); setCloudBusy(true);
    try {
      const result = await sync.recupererDuCloud(cloudConfig);
      if (!confirm("Récupérer remplacera les données actuelles de cet appareil par celles du cloud. Continuer ?")) { setCloudBusy(false); return; }
      update((d) => { Object.keys(emptyState).forEach((k) => { d[k] = result.data[k] ?? emptyState[k]; }); });
      setCloudStatus(`Données récupérées à ${new Date().toLocaleTimeString("fr-FR")}`);
    } catch (err) {
      setCloudError(err.message || "Échec de la récupération.");
    } finally {
      setCloudBusy(false);
    }
  };

  const deconnecterCloud = async () => {
    await sync.clearCloudConfig();
    setCloudConfigState(null);
    setCloudStatus("");
  };

  const saveNom = () => {
    if (nomFerme.trim()) update((d) => { d.ferme.nom = nomFerme.trim(); });
  };

  const saveDevise = (val) => {
    setDevise(val);
    update((d) => { d.ferme.devise = val; });
  };

  const saveTheme = (val) => {
    update((d) => { d.ferme.theme = val; });
  };

  const saveInfoEntreprise = () => {
    update((d) => {
      d.ferme.nif = infoEntreprise.nif.trim();
      d.ferme.rccm = infoEntreprise.rccm.trim();
      d.ferme.adresse = infoEntreprise.adresse.trim();
      d.ferme.email = infoEntreprise.email.trim();
      d.ferme.telephone = infoEntreprise.telephone.trim();
      d.ferme.siteWeb = infoEntreprise.siteWeb.trim();
      d.ferme.reseauxSociaux = infoEntreprise.reseauxSociaux.trim();
    });
  };

  const uploadLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setLogoError("Image trop lourde (max 1 Mo). Choisissez une image plus légère.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update((d) => { d.ferme.logo = reader.result; });
      setLogoError("");
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => update((d) => { d.ferme.logo = null; });

  const savePassword = (e) => {
    e.preventDefault();
    if (hasPassword && current !== data.security.password) {
      setError("Mot de passe actuel incorrect.");
      return;
    }
    if (!next) {
      setError("Le nouveau mot de passe ne peut pas être vide.");
      return;
    }
    update((d) => { d.security = { password: next }; });
    setCurrent(""); setNext(""); setError("");
  };

  const removePassword = () => {
    if (hasPassword && current !== data.security.password) {
      setError("Mot de passe actuel incorrect.");
      return;
    }
    update((d) => { d.security = { password: null }; });
    setCurrent(""); setNext(""); setError("");
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sauvegarde-${data.ferme.nom.replace(/\s+/g, "-").toLowerCase()}-${today()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.parcelles)) {
          throw new Error("format invalide");
        }
        if (!confirm("Importer ce fichier remplacera toutes les données actuelles de la ferme. Continuer ?")) return;
        update((d) => { Object.keys(emptyState).forEach((k) => { d[k] = parsed[k] ?? emptyState[k]; }); });
        setImportError("");
        onClose();
      } catch (err) {
        setImportError("Fichier invalide — impossible d'importer cette sauvegarde.");
      }
    };
    reader.readAsText(file);
  };

  const partager = async () => {
    setPartageEnCours(true);
    try {
      await partagerSauvegarde(data, `sauvegarde-${data.ferme.nom.replace(/\s+/g, "-").toLowerCase()}-${today()}.json`);
    } catch (err) {
      setImportError("Le partage a échoué. Réessayez ou utilisez le téléchargement.");
    } finally {
      setPartageEnCours(false);
    }
  };

  return (
    <Modal title="Paramètres" onClose={onClose}>
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium mb-2">Nom de la ferme</h4>
          <div className="flex gap-2">
            <Input value={nomFerme} onChange={(e) => setNomFerme(e.target.value)} />
            <Button variant="ghost" onClick={saveNom}>Enregistrer</Button>
          </div>
        </div>

        <div className="border-t border-[#DFD8C2] pt-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5"><ImageIcon size={14} /> Logo de la ferme</h4>
          <div className="flex items-center gap-3">
            {data.ferme.logo ? (
              <img src={data.ferme.logo} alt="Logo" className="h-14 w-14 rounded-full object-cover border border-[#DFD8C2]" />
            ) : (
              <div className="h-14 w-14 rounded-full bg-[#EFEAD9] flex items-center justify-center text-[#8B8974]"><ImageIcon size={20} /></div>
            )}
            <div className="flex gap-2 flex-wrap">
              <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium border border-[#DFD8C2] text-[#2F3B2C] hover:bg-[#E9E3CF] cursor-pointer">
                Changer le logo
                <input type="file" accept="image/*" onChange={uploadLogo} className="hidden" />
              </label>
              {data.ferme.logo && <Button variant="danger" onClick={removeLogo}>Retirer</Button>}
            </div>
          </div>
          {logoError && <p className="text-xs text-[#A6402A] mt-2">{logoError}</p>}
        </div>

        <div className="border-t border-[#DFD8C2] pt-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5"><Building2 size={14} /> Informations de l'entreprise</h4>
          <p className="text-xs text-[#8B8974] mb-3">Ces informations pourront apparaître sur vos factures et documents officiels.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="NIF"><Input value={infoEntreprise.nif} onChange={(e) => setInfoEntreprise((v) => ({ ...v, nif: e.target.value }))} /></Field>
            <Field label="RCCM"><Input value={infoEntreprise.rccm} onChange={(e) => setInfoEntreprise((v) => ({ ...v, rccm: e.target.value }))} /></Field>
            <Field label="Adresse" className="sm:col-span-2"><Input value={infoEntreprise.adresse} onChange={(e) => setInfoEntreprise((v) => ({ ...v, adresse: e.target.value }))} /></Field>
            <Field label="Email"><Input type="email" value={infoEntreprise.email} onChange={(e) => setInfoEntreprise((v) => ({ ...v, email: e.target.value }))} /></Field>
            <Field label="Téléphone"><Input value={infoEntreprise.telephone} onChange={(e) => setInfoEntreprise((v) => ({ ...v, telephone: e.target.value }))} /></Field>
            <Field label="Site web"><Input value={infoEntreprise.siteWeb} onChange={(e) => setInfoEntreprise((v) => ({ ...v, siteWeb: e.target.value }))} /></Field>
            <Field label="Réseaux sociaux"><Input value={infoEntreprise.reseauxSociaux} onChange={(e) => setInfoEntreprise((v) => ({ ...v, reseauxSociaux: e.target.value }))} placeholder="Ex. Facebook, Instagram..." /></Field>
          </div>
          <Button variant="ghost" className="mt-3" onClick={saveInfoEntreprise}>Enregistrer les informations</Button>
        </div>

        <div className="border-t border-[#DFD8C2] pt-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5"><Coins size={14} /> Devise</h4>
          <Select value={devise} onChange={(e) => saveDevise(e.target.value)}>
            {DEVISES.map((dv) => <option key={dv} value={dv}>{dv}</option>)}
          </Select>
          <p className="text-xs text-[#8B8974] mt-1">S'applique à tous les montants affichés dans l'application.</p>
        </div>

        <div className="border-t border-[#DFD8C2] pt-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5"><Palette size={14} /> Apparence de l'interface</h4>
          <div className="flex flex-wrap gap-3">
            {Object.entries(THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => saveTheme(key)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 ${data.ferme.theme === key ? "border-[var(--color-accent)]" : "border-transparent"}`}
              >
                <span className="flex h-8 w-8 rounded-full overflow-hidden border border-[#DFD8C2]">
                  <span className="w-1/2 h-full" style={{ backgroundColor: t.primary }} />
                  <span className="w-1/2 h-full" style={{ backgroundColor: t.accent }} />
                </span>
                <span className="text-xs text-center leading-tight">{THEME_LABELS[key] || key}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[#DFD8C2] pt-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5"><Share2 size={14} /> Synchronisation multi-appareils (Cloud)</h4>
          <p className="text-xs text-[#8B8974] mb-3">
            Connectez plusieurs téléphones au même espace cloud pour qu'ils partagent les mêmes données. Nécessite un projet Supabase gratuit (voir les instructions fournies).
          </p>

          {cloudConfig ? (
            <div className="space-y-3">
              <p className="text-xs text-[#3C5A34]">{cloudStatus}</p>
              <div className="flex gap-2 flex-wrap">
                <Button variant="ghost" onClick={envoyerCloud} disabled={cloudBusy}>Envoyer vers le cloud</Button>
                <Button variant="ghost" onClick={recupererCloud} disabled={cloudBusy}>Récupérer depuis le cloud</Button>
                <Button variant="danger" onClick={deconnecterCloud} disabled={cloudBusy}>Se déconnecter</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Field label="URL du projet Supabase"><Input value={cloudUrl} onChange={(e) => setCloudUrl(e.target.value)} placeholder="https://xxxx.supabase.co" /></Field>
              <Field label="Clé anonyme (anon key)"><Input value={cloudAnonKey} onChange={(e) => setCloudAnonKey(e.target.value)} placeholder="eyJhbGciOi..." /></Field>
              <Field label="Code de la ferme"><Input value={codeFerme} onChange={(e) => setCodeFerme(e.target.value)} placeholder="Ex. ferme-tapokro" /></Field>
              <Field label="Code PIN (secret, partagé entre vos appareils)"><Input type="password" value={pin} onChange={(e) => setPin(e.target.value)} /></Field>
              {cloudStatus && <p className="text-xs text-[#3C5A34]">{cloudStatus}</p>}
              <div className="flex gap-2 flex-wrap">
                <Button variant="accent" onClick={creerEspace} disabled={cloudBusy}>Créer mon espace cloud</Button>
                <Button variant="ghost" onClick={rejoindreEspace} disabled={cloudBusy}>Rejoindre un espace existant</Button>
              </div>
              <p className="text-xs text-[#8B8974]">
                Premier appareil : « Créer mon espace cloud » (envoie les données actuelles). Appareils suivants : mêmes URL/clé/code/PIN, puis « Rejoindre un espace existant ».
              </p>
            </div>
          )}
          {cloudError && <p className="text-xs text-[#A6402A] mt-2">{cloudError}</p>}
        </div>

        <div className="border-t border-[#DFD8C2] pt-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5"><Lock size={14} /> Sécurité</h4>
          <form className="space-y-3" onSubmit={savePassword}>
            {hasPassword && (
              <Field label="Mot de passe actuel">
                <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
              </Field>
            )}
            <Field label={hasPassword ? "Nouveau mot de passe" : "Définir un mot de passe"}>
              <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Ex. 4 chiffres ou plus" />
            </Field>
            {error && <p className="text-xs text-[#A6402A]">{error}</p>}
            <Button type="submit" variant="accent" className="w-full">{hasPassword ? "Mettre à jour" : "Activer le verrouillage"}</Button>
            {hasPassword && <Button type="button" variant="danger" className="w-full" onClick={removePassword}>Désactiver le verrouillage</Button>}
          </form>
          <p className="text-xs text-[#8B8974] mt-2">Le mot de passe unique n'est utilisé que si aucun gestionnaire n'est défini ci-dessous.</p>
        </div>

        <GestionnairesSection data={data} update={update} />

        <ListeAvecCodeSection
          data={data} update={update} champ="departements" icon={Boxes}
          titre="Départements"
          description="Ces départements permettent de classer les productions et les postes du personnel (production animale, végétale, aquaculture, apiculture, transport, boutique intrant, autres...). Chaque département peut avoir un code analytique."
        />

        <ListeAvecCodeSection
          data={data} update={update} champ="sectionsProduction" icon={Sprout}
          titre="Sections de production (codes analytiques)"
          description="Ces sections (maraîchage, pisciculture, apiculture...) sont proposées pour les techniciens de production dans Personnel, et peuvent servir de code analytique pour vos dépenses."
        />

        <CategoriesDepensesSection data={data} update={update} />

        <div className="border-t border-[#DFD8C2] pt-4">
          <h4 className="text-sm font-medium mb-2">Sauvegarde des données</h4>
          <p className="text-xs text-[#8B8974] mb-3">Téléchargez une copie de toutes vos données, ou restaurez une sauvegarde précédente. Recommandé régulièrement pour éviter toute perte.</p>
          <div className="flex gap-2 flex-wrap">
            <Button variant="ghost" onClick={exportData}>Télécharger la sauvegarde (.json)</Button>
            <Button variant="ghost" onClick={partager} disabled={partageEnCours}>
              <Share2 size={14} /> {partageEnCours ? "Partage..." : "Partager (cloud, WhatsApp, email...)"}
            </Button>
            <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium border border-[#DFD8C2] text-[#2F3B2C] hover:bg-[#E9E3CF] cursor-pointer">
              Restaurer une sauvegarde
              <input type="file" accept="application/json" onChange={importData} className="hidden" />
            </label>
          </div>
          {importError && <p className="text-xs text-[#A6402A] mt-2">{importError}</p>}
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// DASHBOARD
// ============================================================
function Dashboard({ data, setTab }) {
  const tachesDues = data.taches
    .filter((t) => t.statut !== "termine")
    .sort((a, b) => (a.echeance || "9999").localeCompare(b.echeance || "9999"))
    .slice(0, 5);

  const stocksBas = data.stocks.filter((s) => Number(s.seuil) > 0 && Number(s.quantite) <= Number(s.seuil));

  const miseBasProches = data.animaux.flatMap((a) =>
    (a.reproduction || [])
      .filter((r) => r.statut !== "mise_bas" && r.dateMiseBasPrevue)
      .map((r) => ({ animal: a, r }))
  ).sort((a, b) => a.r.dateMiseBasPrevue.localeCompare(b.r.dateMiseBasPrevue)).slice(0, 5);

  const revenus = data.transactions.filter((t) => t.type === "revenu").reduce((s, t) => s + Number(t.montant || 0), 0);
  const depenses = data.transactions.filter((t) => t.type === "depense").reduce((s, t) => s + Number(t.montant || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Parcelles" value={data.parcelles.length} icon={Sprout} />
        <StatCard label="Animaux" value={data.animaux.length} icon={PawPrint} />
        <StatCard label="Solde" value={money(revenus - depenses, data.ferme.devise)} icon={Wallet} tone={revenus - depenses >= 0 ? "good" : "bad"} />
        <StatCard label="Tâches ouvertes" value={data.taches.filter((t) => t.statut !== "termine").length} icon={ListChecks} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <SectionTitle icon={ListChecks} title="Tâches à venir" onClick={() => setTab("taches")} />
          {tachesDues.length === 0 ? (
            <p className="text-sm text-[#8B8974] mt-2">Aucune tâche en attente.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {tachesDues.map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{t.titre}</span>
                  <Badge tone={t.priorite === "haute" ? "bad" : "default"}>{fmtDate(t.echeance)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <SectionTitle icon={AlertTriangle} title="Alertes stock" onClick={() => setTab("stocks")} />
          {stocksBas.length === 0 ? (
            <p className="text-sm text-[#8B8974] mt-2">Tous les stocks sont au-dessus du seuil.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {stocksBas.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{s.nom}</span>
                  <Badge tone="bad">{s.quantite} {s.unite}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <SectionTitle icon={Baby} title="Mises bas prévues" onClick={() => setTab("elevage")} />
          {miseBasProches.length === 0 ? (
            <p className="text-sm text-[#8B8974] mt-2">Aucune mise bas prévue enregistrée.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {miseBasProches.map(({ animal, r }) => (
                <li key={r.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{animal.identifiant}</span>
                  <Badge tone="accent">{fmtDate(r.dateMiseBasPrevue)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone }) {
  const toneCls = tone === "bad" ? "text-[#A6402A]" : tone === "good" ? "text-[#3C5A34]" : "text-[#232620]";
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-[#8B8974] text-xs mb-1">
        <Icon size={14} /> {label}
      </div>
      <p className={`font-serif text-2xl ${toneCls}`}>{value}</p>
    </Card>
  );
}

function SectionTitle({ icon: Icon, title, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center justify-between w-full group">
      <span className="flex items-center gap-2 font-serif text-base text-[#232620]">
        <Icon size={16} className="text-[#8B5E3C]" /> {title}
      </span>
      <ChevronRight size={16} className="text-[#C7C2A8] group-hover:text-[#8B5E3C]" />
    </button>
  );
}

// ============================================================
// CULTURES
// ============================================================
function Cultures({ data, update }) {
  const [showAddParcelle, setShowAddParcelle] = useState(false);
  const [selected, setSelected] = useState(null);

  const parcelle = data.parcelles.find((p) => p.id === selected);

  if (parcelle) {
    return <ParcelleDetail parcelle={parcelle} update={update} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Parcelles</h2>
        <Button variant="accent" onClick={() => setShowAddParcelle(true)}><Plus size={16} /> Nouvelle parcelle</Button>
      </div>

      {data.parcelles.length === 0 ? (
        <EmptyState icon={Sprout} text="Aucune parcelle enregistrée pour l'instant." action={<Button variant="ghost" onClick={() => setShowAddParcelle(true)}>Créer la première parcelle</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.parcelles.map((p) => {
            const cycleActif = p.cycles.find((c) => c.statut === "en_cours");
            return (
              <Card key={p.id} className="p-4 cursor-pointer hover:border-[#C08A2E]" >
                <div onClick={() => setSelected(p.id)}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg">{p.nom}</h3>
                    <ChevronRight size={16} className="text-[#C7C2A8]" />
                  </div>
                  <p className="text-xs text-[#8B8974] mt-0.5">{p.superficie} ha · {p.typeSol || "sol non précisé"}</p>
                  {cycleActif ? (
                    <div className="mt-3 flex items-center gap-2">
                      <Badge tone="good">Culture en cours</Badge>
                      <span className="text-sm">{cycleActif.culture}</span>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[#8B8974]">Aucune culture en cours</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showAddParcelle && (
        <Modal title="Nouvelle parcelle" onClose={() => setShowAddParcelle(false)}>
          <ParcelleForm
            onSubmit={(vals) => {
              update((d) => d.parcelles.push({ id: uid(), ...vals, cycles: [] }));
              setShowAddParcelle(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function ParcelleForm({ onSubmit }) {
  const [nom, setNom] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [typeSol, setTypeSol] = useState("");
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!nom) return; onSubmit({ nom, superficie, typeSol }); }}>
      <Field label="Nom de la parcelle"><Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Champ du bas" required /></Field>
      <Field label="Superficie (ha)"><Input type="number" step="0.01" value={superficie} onChange={(e) => setSuperficie(e.target.value)} /></Field>
      <Field label="Type de sol"><Input value={typeSol} onChange={(e) => setTypeSol(e.target.value)} placeholder="Ex. argileux" /></Field>
      <Button type="submit" variant="accent" className="w-full">Créer la parcelle</Button>
    </form>
  );
}

function ParcelleDetail({ parcelle, update, onBack }) {
  const [showAddCycle, setShowAddCycle] = useState(false);
  const [showIntervention, setShowIntervention] = useState(null);

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-[#8B5E3C] flex items-center gap-1">← Retour aux parcelles</button>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl">{parcelle.nom}</h2>
          <p className="text-xs text-[#8B8974]">{parcelle.superficie} ha · {parcelle.typeSol || "sol non précisé"}</p>
        </div>
        <Button variant="accent" onClick={() => setShowAddCycle(true)}><Plus size={16} /> Démarrer une culture</Button>
      </div>

      {parcelle.cycles.length === 0 ? (
        <EmptyState icon={Sprout} text="Aucun cycle de culture pour cette parcelle." />
      ) : (
        <div className="space-y-3">
          {[...parcelle.cycles].reverse().map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{c.culture}</h4>
                  <p className="text-xs text-[#8B8974]">Semis : {fmtDate(c.dateSemis)}</p>
                </div>
                <Badge tone={c.statut === "en_cours" ? "good" : "default"}>{c.statut === "en_cours" ? "En cours" : "Récolté"}</Badge>
              </div>

              {c.interventions?.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-[#5A5744] border-t border-[#EFEAD9] pt-2">
                  {c.interventions.map((i) => (
                    <li key={i.id} className="flex justify-between">
                      <span>{i.type} — {i.produit || "—"}</span>
                      <span className="text-[#8B8974]">{fmtDate(i.date)}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 flex gap-2 flex-wrap">
                <Button variant="ghost" onClick={() => setShowIntervention(c.id)}><Plus size={14} /> Intervention</Button>
                {c.statut === "en_cours" && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const rendement = prompt("Rendement récolté (kg) ?");
                      if (rendement === null) return;
                      update((d) => {
                        const pp = d.parcelles.find((x) => x.id === parcelle.id);
                        const cc = pp.cycles.find((x) => x.id === c.id);
                        cc.statut = "recolte";
                        cc.dateRecolteReelle = today();
                        cc.rendementKg = rendement;
                      });
                    }}
                  >
                    Clôturer / Récolte
                  </Button>
                )}
              </div>

              {showIntervention === c.id && (
                <Modal title="Nouvelle intervention" onClose={() => setShowIntervention(null)}>
                  <InterventionForm
                    onSubmit={(vals) => {
                      update((d) => {
                        const pp = d.parcelles.find((x) => x.id === parcelle.id);
                        const cc = pp.cycles.find((x) => x.id === c.id);
                        cc.interventions = cc.interventions || [];
                        cc.interventions.push({ id: uid(), ...vals });
                      });
                      setShowIntervention(null);
                    }}
                  />
                </Modal>
              )}
            </Card>
          ))}
        </div>
      )}

      {showAddCycle && (
        <Modal title="Démarrer une culture" onClose={() => setShowAddCycle(false)}>
          <CycleForm
            onSubmit={(vals) => {
              update((d) => {
                const pp = d.parcelles.find((x) => x.id === parcelle.id);
                pp.cycles.push({ id: uid(), ...vals, statut: "en_cours", interventions: [] });
              });
              setShowAddCycle(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function CycleForm({ onSubmit }) {
  const [culture, setCulture] = useState("");
  const [dateSemis, setDateSemis] = useState(today());
  const [dateRecoltePrevue, setDateRecoltePrevue] = useState("");
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!culture) return; onSubmit({ culture, dateSemis, dateRecoltePrevue }); }}>
      <Field label="Culture"><Input value={culture} onChange={(e) => setCulture(e.target.value)} placeholder="Ex. Maïs" required /></Field>
      <Field label="Date de semis"><Input type="date" value={dateSemis} onChange={(e) => setDateSemis(e.target.value)} /></Field>
      <Field label="Récolte prévue"><Input type="date" value={dateRecoltePrevue} onChange={(e) => setDateRecoltePrevue(e.target.value)} /></Field>
      <Button type="submit" variant="accent" className="w-full">Démarrer le cycle</Button>
    </form>
  );
}

function InterventionForm({ onSubmit }) {
  const [type, setType] = useState("irrigation");
  const [date, setDate] = useState(today());
  const [produit, setProduit] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit({ type, date, produit, notes }); }}>
      <Field label="Type d'intervention">
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="irrigation">Irrigation</option>
          <option value="traitement">Traitement</option>
          <option value="fertilisation">Fertilisation</option>
          <option value="desherbage">Désherbage</option>
          <option value="autre">Autre</option>
        </Select>
      </Field>
      <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Produit utilisé"><Input value={produit} onChange={(e) => setProduit(e.target.value)} /></Field>
      <Field label="Notes"><TextArea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <Button type="submit" variant="accent" className="w-full">Enregistrer</Button>
    </form>
  );
}

// ============================================================
// ÉLEVAGE
// ============================================================
function Elevage({ data, update }) {
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const animal = data.animaux.find((a) => a.id === selected);

  if (animal) return <AnimalDetail animal={animal} data={data} update={update} onBack={() => setSelected(null)} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Cheptel</h2>
        <Button variant="accent" onClick={() => setShowAdd(true)}><Plus size={16} /> Nouvel animal</Button>
      </div>

      {data.animaux.length === 0 ? (
        <EmptyState icon={PawPrint} text="Aucun animal enregistré." action={<Button variant="ghost" onClick={() => setShowAdd(true)}>Ajouter un animal</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.animaux.map((a) => (
            <Card key={a.id} className="p-4 cursor-pointer hover:border-[#C08A2E]" onClick={() => setSelected(a.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{a.identifiant}</h3>
                  <p className="text-xs text-[#8B8974]">{a.espece} · {a.race || "race inconnue"} · {a.sexe === "F" ? "Femelle" : "Mâle"}</p>
                </div>
                <ChevronRight size={16} className="text-[#C7C2A8]" />
              </div>
              <div className="flex gap-2 mt-2">
                <Badge tone={a.statut === "actif" ? "good" : "default"}>{a.statut}</Badge>
                {a.sante?.length > 0 && <Badge><Heart size={11} className="inline mr-1" />{a.sante.length}</Badge>}
                {a.reproduction?.length > 0 && <Badge><Baby size={11} className="inline mr-1" />{a.reproduction.length}</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Nouvel animal" onClose={() => setShowAdd(false)}>
          <AnimalForm
            animaux={data.animaux}
            onSubmit={(vals) => {
              update((d) => d.animaux.push({ id: uid(), ...vals, sante: [], reproduction: [], production: [] }));
              setShowAdd(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function AnimalForm({ animaux, onSubmit }) {
  const [identifiant, setIdentifiant] = useState("");
  const [espece, setEspece] = useState("");
  const [race, setRace] = useState("");
  const [sexe, setSexe] = useState("F");
  const [dateNaissance, setDateNaissance] = useState("");
  const [parentId, setParentId] = useState("");
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!identifiant || !espece) return; onSubmit({ identifiant, espece, race, sexe, dateNaissance, parentId: parentId || null, statut: "actif" }); }}>
      <Field label="Identifiant"><Input value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} placeholder="Ex. VA-014" required /></Field>
      <Field label="Espèce"><Input value={espece} onChange={(e) => setEspece(e.target.value)} placeholder="Ex. Vache, Poule..." required /></Field>
      <Field label="Race"><Input value={race} onChange={(e) => setRace(e.target.value)} /></Field>
      <Field label="Sexe">
        <Select value={sexe} onChange={(e) => setSexe(e.target.value)}>
          <option value="F">Femelle</option>
          <option value="M">Mâle</option>
        </Select>
      </Field>
      <Field label="Date de naissance"><Input type="date" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} /></Field>
      <Field label="Parent (optionnel)">
        <Select value={parentId} onChange={(e) => setParentId(e.target.value)}>
          <option value="">Aucun</option>
          {animaux.map((a) => <option key={a.id} value={a.id}>{a.identifiant}</option>)}
        </Select>
      </Field>
      <Button type="submit" variant="accent" className="w-full">Ajouter l'animal</Button>
    </form>
  );
}

function AnimalDetail({ animal, data, update, onBack }) {
  const [modal, setModal] = useState(null); // 'sante' | 'reproduction' | 'production'
  const parent = data.animaux.find((a) => a.id === animal.parentId);
  const petits = data.animaux.filter((a) => a.parentId === animal.id);

  const addEntry = (field, vals) => update((d) => {
    const a = d.animaux.find((x) => x.id === animal.id);
    a[field] = a[field] || [];
    a[field].push({ id: uid(), ...vals });
  });

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-[#8B5E3C] flex items-center gap-1">← Retour au cheptel</button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl">{animal.identifiant}</h2>
          <p className="text-xs text-[#8B8974]">{animal.espece} · {animal.race || "race inconnue"} · {animal.sexe === "F" ? "Femelle" : "Mâle"} · né(e) {fmtDate(animal.dateNaissance)}</p>
          {parent && <p className="text-xs text-[#8B8974] mt-0.5">Parent : {parent.identifiant}</p>}
          {petits.length > 0 && <p className="text-xs text-[#8B8974]">Descendance : {petits.map((p) => p.identifiant).join(", ")}</p>}
        </div>
      </div>

      {/* Santé */}
      <Card className="p-4">
        <SectionTitle icon={Heart} title="Santé" onClick={() => setModal("sante")} />
        {(!animal.sante || animal.sante.length === 0) ? (
          <p className="text-sm text-[#8B8974] mt-2">Aucun événement de santé enregistré.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {[...animal.sante].reverse().map((s) => (
              <li key={s.id} className="flex justify-between border-b border-[#EFEAD9] pb-1">
                <span>{s.type} {s.traitement && `— ${s.traitement}`}</span>
                <span className="text-[#8B8974]">{fmtDate(s.date)}</span>
              </li>
            ))}
          </ul>
        )}
        <Button variant="ghost" className="mt-3" onClick={() => setModal("sante")}><Plus size={14} /> Ajouter un événement</Button>
      </Card>

      {/* Reproduction */}
      <Card className="p-4">
        <SectionTitle icon={Baby} title="Reproduction" onClick={() => setModal("reproduction")} />
        {(!animal.reproduction || animal.reproduction.length === 0) ? (
          <p className="text-sm text-[#8B8974] mt-2">Aucun événement de reproduction enregistré.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {[...animal.reproduction].reverse().map((r) => (
              <li key={r.id} className="flex justify-between border-b border-[#EFEAD9] pb-1">
                <span>{r.type} {r.nombrePetits ? `— ${r.nombrePetits} petit(s)` : ""}</span>
                <Badge tone={r.statut === "mise_bas" ? "good" : "accent"}>{r.statut}</Badge>
              </li>
            ))}
          </ul>
        )}
        <Button variant="ghost" className="mt-3" onClick={() => setModal("reproduction")}><Plus size={14} /> Ajouter un événement</Button>
      </Card>

      {/* Production */}
      <Card className="p-4">
        <SectionTitle icon={Milk} title="Production" onClick={() => setModal("production")} />
        {(!animal.production || animal.production.length === 0) ? (
          <p className="text-sm text-[#8B8974] mt-2">Aucune production enregistrée.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {[...animal.production].reverse().slice(0, 8).map((p) => (
              <li key={p.id} className="flex justify-between border-b border-[#EFEAD9] pb-1">
                <span>{p.type} — {p.quantite} {p.unite}</span>
                <span className="text-[#8B8974]">{fmtDate(p.date)}</span>
              </li>
            ))}
          </ul>
        )}
        <Button variant="ghost" className="mt-3" onClick={() => setModal("production")}><Plus size={14} /> Ajouter une production</Button>
      </Card>

      {modal === "sante" && (
        <Modal title="Événement de santé" onClose={() => setModal(null)}>
          <SanteForm onSubmit={(vals) => { addEntry("sante", vals); setModal(null); }} />
        </Modal>
      )}
      {modal === "reproduction" && (
        <Modal title="Événement de reproduction" onClose={() => setModal(null)}>
          <ReproductionForm onSubmit={(vals) => { addEntry("reproduction", vals); setModal(null); }} />
        </Modal>
      )}
      {modal === "production" && (
        <Modal title="Enregistrer une production" onClose={() => setModal(null)}>
          <ProductionForm onSubmit={(vals) => { addEntry("production", vals); setModal(null); }} />
        </Modal>
      )}
    </div>
  );
}

function SanteForm({ onSubmit }) {
  const [type, setType] = useState("vaccination");
  const [date, setDate] = useState(today());
  const [traitement, setTraitement] = useState("");
  const [veterinaire, setVeterinaire] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit({ type, date, traitement, veterinaire, notes }); }}>
      <Field label="Type">
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="vaccination">Vaccination</option>
          <option value="maladie">Maladie</option>
          <option value="traitement">Traitement</option>
          <option value="controle">Contrôle de routine</option>
        </Select>
      </Field>
      <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Traitement / produit"><Input value={traitement} onChange={(e) => setTraitement(e.target.value)} /></Field>
      <Field label="Vétérinaire"><Input value={veterinaire} onChange={(e) => setVeterinaire(e.target.value)} /></Field>
      <Field label="Notes"><TextArea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <Button type="submit" variant="accent" className="w-full">Enregistrer</Button>
    </form>
  );
}

function ReproductionForm({ onSubmit }) {
  const [type, setType] = useState("saillie");
  const [dateSaillieOuIA, setDateSaillieOuIA] = useState(today());
  const [dateMiseBasPrevue, setDateMiseBasPrevue] = useState("");
  const [dateMiseBasReelle, setDateMiseBasReelle] = useState("");
  const [nombrePetits, setNombrePetits] = useState("");
  const [statut, setStatut] = useState("en_cours");
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit({ type, dateSaillieOuIA, dateMiseBasPrevue, dateMiseBasReelle, nombrePetits, statut }); }}>
      <Field label="Type d'événement">
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="saillie">Saillie</option>
          <option value="insemination_artificielle">Insémination artificielle</option>
          <option value="mise_bas">Mise bas</option>
        </Select>
      </Field>
      <Field label="Date saillie / IA"><Input type="date" value={dateSaillieOuIA} onChange={(e) => setDateSaillieOuIA(e.target.value)} /></Field>
      <Field label="Mise bas prévue"><Input type="date" value={dateMiseBasPrevue} onChange={(e) => setDateMiseBasPrevue(e.target.value)} /></Field>
      <Field label="Mise bas réelle"><Input type="date" value={dateMiseBasReelle} onChange={(e) => setDateMiseBasReelle(e.target.value)} /></Field>
      <Field label="Nombre de petits"><Input type="number" value={nombrePetits} onChange={(e) => setNombrePetits(e.target.value)} /></Field>
      <Field label="Statut">
        <Select value={statut} onChange={(e) => setStatut(e.target.value)}>
          <option value="en_cours">En cours</option>
          <option value="confirmee">Gestation confirmée</option>
          <option value="mise_bas">Mise bas effectuée</option>
          <option value="echec">Échec</option>
        </Select>
      </Field>
      <Button type="submit" variant="accent" className="w-full">Enregistrer</Button>
    </form>
  );
}

function ProductionForm({ onSubmit }) {
  const [type, setType] = useState("");
  const [date, setDate] = useState(today());
  const [quantite, setQuantite] = useState("");
  const [unite, setUnite] = useState("L");
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!type) return; onSubmit({ type, date, quantite, unite }); }}>
      <Field label="Type de produit"><Input value={type} onChange={(e) => setType(e.target.value)} placeholder="Ex. Lait, Œufs" required /></Field>
      <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Quantité"><Input type="number" step="0.01" value={quantite} onChange={(e) => setQuantite(e.target.value)} /></Field>
      <Field label="Unité"><Input value={unite} onChange={(e) => setUnite(e.target.value)} /></Field>
      <Button type="submit" variant="accent" className="w-full">Enregistrer</Button>
    </form>
  );
}

// ============================================================
// STOCKS
// ============================================================
function Stocks({ data, update }) {
  const [showAdd, setShowAdd] = useState(false);
  const [mvtFor, setMvtFor] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Stocks & intrants</h2>
        <Button variant="accent" onClick={() => setShowAdd(true)}><Plus size={16} /> Nouvel article</Button>
      </div>

      {data.stocks.length === 0 ? (
        <EmptyState icon={Boxes} text="Aucun article en stock." action={<Button variant="ghost" onClick={() => setShowAdd(true)}>Ajouter un article</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.stocks.map((s) => {
            const bas = Number(s.seuil) > 0 && Number(s.quantite) <= Number(s.seuil);
            return (
              <Card key={s.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{s.nom}</h3>
                    <p className="text-xs text-[#8B8974]">{s.categorie}</p>
                  </div>
                  <button onClick={() => update((d) => { d.stocks = d.stocks.filter((x) => x.id !== s.id); })} className="text-[#C7C2A8] hover:text-[#A6402A]">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-serif text-lg">{s.quantite} <span className="text-sm font-sans text-[#8B8974]">{s.unite}</span></span>
                  {bas && <Badge tone="bad"><AlertTriangle size={11} className="inline mr-1" />Stock bas</Badge>}
                </div>
                <Button variant="ghost" className="mt-3 w-full" onClick={() => setMvtFor(s.id)}>Entrée / sortie</Button>
              </Card>
            );
          })}
        </div>
      )}

      {showAdd && (
        <Modal title="Nouvel article de stock" onClose={() => setShowAdd(false)}>
          <StockForm
            onSubmit={(vals) => {
              update((d) => d.stocks.push({ id: uid(), ...vals }));
              setShowAdd(false);
            }}
          />
        </Modal>
      )}

      {mvtFor && (
        <Modal title="Mouvement de stock" onClose={() => setMvtFor(null)}>
          <MouvementForm
            onSubmit={({ typeMouvement, quantite, date }) => {
              update((d) => {
                const s = d.stocks.find((x) => x.id === mvtFor);
                const q = Number(quantite || 0);
                s.quantite = typeMouvement === "entree" ? Number(s.quantite || 0) + q : Number(s.quantite || 0) - q;
                d.mouvementsStock.push({ id: uid(), stockId: mvtFor, type: typeMouvement, quantite: q, date: date || today() });
              });
              setMvtFor(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function StockForm({ onSubmit }) {
  const [nom, setNom] = useState("");
  const [categorie, setCategorie] = useState("semence");
  const [quantite, setQuantite] = useState("");
  const [unite, setUnite] = useState("kg");
  const [seuil, setSeuil] = useState("");
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!nom) return; onSubmit({ nom, categorie, quantite: quantite || 0, unite, seuil: seuil || 0 }); }}>
      <Field label="Nom"><Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Semence de maïs" required /></Field>
      <Field label="Catégorie">
        <Select value={categorie} onChange={(e) => setCategorie(e.target.value)}>
          <option value="semence">Semence</option>
          <option value="engrais">Engrais</option>
          <option value="aliment_betail">Aliment bétail</option>
          <option value="materiel">Matériel</option>
          <option value="autre">Autre</option>
        </Select>
      </Field>
      <Field label="Quantité initiale"><Input type="number" step="0.01" value={quantite} onChange={(e) => setQuantite(e.target.value)} /></Field>
      <Field label="Unité"><Input value={unite} onChange={(e) => setUnite(e.target.value)} /></Field>
      <Field label="Seuil d'alerte"><Input type="number" step="0.01" value={seuil} onChange={(e) => setSeuil(e.target.value)} /></Field>
      <Button type="submit" variant="accent" className="w-full">Ajouter l'article</Button>
    </form>
  );
}

function MouvementForm({ onSubmit }) {
  const [typeMouvement, setTypeMouvement] = useState("sortie");
  const [quantite, setQuantite] = useState("");
  const [date, setDate] = useState(today());
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!quantite) return; onSubmit({ typeMouvement, quantite, date }); }}>
      <Field label="Type de mouvement">
        <Select value={typeMouvement} onChange={(e) => setTypeMouvement(e.target.value)}>
          <option value="entree">Entrée</option>
          <option value="sortie">Sortie</option>
        </Select>
      </Field>
      <Field label="Quantité"><Input type="number" step="0.01" value={quantite} onChange={(e) => setQuantite(e.target.value)} required /></Field>
      <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Button type="submit" variant="accent" className="w-full">Valider</Button>
    </form>
  );
}

// ============================================================
// FINANCES
// ============================================================
function Finances({ data, update }) {
  const [showAdd, setShowAdd] = useState(false);
  const revenus = data.transactions.filter((t) => t.type === "revenu").reduce((s, t) => s + Number(t.montant || 0), 0);
  const depenses = data.transactions.filter((t) => t.type === "depense").reduce((s, t) => s + Number(t.montant || 0), 0);

  const tresorerie = useMemo(() => {
    const especes = data.transactions.filter((t) => !t.compteId).reduce((s, t) => s + (t.type === "revenu" ? Number(t.montant || 0) : -Number(t.montant || 0)), 0);
    const parCompte = data.comptes.map((c) => ({ id: c.id, nom: c.nom, type: c.type, solde: soldeCompte(data, c.id) }));
    const total = especes + parCompte.reduce((s, c) => s + c.solde, 0);
    return { especes, parCompte, total };
  }, [data.transactions, data.comptes]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Finances</h2>
        <Button variant="accent" onClick={() => setShowAdd(true)}><Plus size={16} /> Nouvelle transaction</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Revenus" value={money(revenus, data.ferme.devise)} icon={Wallet} tone="good" />
        <StatCard label="Dépenses" value={money(depenses, data.ferme.devise)} icon={Wallet} tone="bad" />
        <StatCard label="Solde" value={money(revenus - depenses, data.ferme.devise)} icon={Wallet} tone={revenus - depenses >= 0 ? "good" : "bad"} />
      </div>

      <Card className="p-4">
        <h3 className="font-serif text-base mb-3 flex items-center gap-2"><Landmark size={16} className="text-[#8B5E3C]" /> Trésorerie</h3>
        <p className="text-xs text-[#8B8974]">Position de trésorerie totale (tous comptes + espèces)</p>
        <p className={`font-serif text-2xl mt-1 ${tresorerie.total >= 0 ? "text-[#3C5A34]" : "text-[#A6402A]"}`}>{money(tresorerie.total, data.ferme.devise)}</p>
        <div className="text-sm space-y-1.5 border-t border-[#EFEAD9] pt-3 mt-3">
          <div className="flex justify-between">
            <span className="text-[#8B8974]">Espèces (non rattachées)</span>
            <span>{money(tresorerie.especes, data.ferme.devise)}</span>
          </div>
          {tresorerie.parCompte.map((c) => (
            <div key={c.id} className="flex justify-between">
              <span className="text-[#8B8974]">{COMPTE_LABELS[c.type]} ({c.nom})</span>
              <span>{money(c.solde, data.ferme.devise)}</span>
            </div>
          ))}
        </div>
        {data.comptes.length === 0 && (
          <p className="text-xs text-[#8B8974] mt-3">Ajoutez vos comptes (banque, caisse, mobile money) dans l'onglet Comptes pour un suivi de trésorerie plus détaillé.</p>
        )}
      </Card>

      {data.transactions.length === 0 ? (
        <EmptyState icon={Wallet} text="Aucune transaction enregistrée." action={<Button variant="ghost" onClick={() => setShowAdd(true)}>Ajouter une transaction</Button>} />
      ) : (
        <Card className="divide-y divide-[#EFEAD9]">
          {[...data.transactions].reverse().map((t) => {
            const compte = data.comptes.find((c) => c.id === t.compteId);
            const produit = data.produits.find((p) => p.id === t.produitId);
            const departement = data.departements.find((d) => d.id === t.departementId);
            const section = data.sectionsProduction.find((s) => s.id === t.sectionProductionId);
            return (
              <div key={t.id} className="p-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{t.description || t.categorie}</p>
                  <p className="text-xs text-[#8B8974]">
                    {t.categorie}{t.codeCategorie ? ` (${t.codeCategorie})` : ""} · {fmtDate(t.date)} · {compte ? `${COMPTE_LABELS[compte.type]} (${compte.nom})` : "Espèces"}{produit ? ` · ${produit.nom}` : ""}
                    {departement ? ` · ${departement.nom}` : ""}{section ? ` · ${section.nom}` : ""}
                  </p>
                </div>
                <span className={t.type === "revenu" ? "text-[#3C5A34] font-medium" : "text-[#A6402A] font-medium"}>
                  {t.type === "revenu" ? "+" : "-"}{Number(t.montant).toLocaleString("fr-FR")}
                </span>
              </div>
            );
          })}
        </Card>
      )}

      {showAdd && (
        <Modal title="Nouvelle transaction" onClose={() => setShowAdd(false)}>
          <TransactionForm
            comptes={data.comptes}
            produits={data.produits}
            employes={data.employes}
            categoriesDepenses={data.categoriesDepenses}
            departements={data.departements}
            sectionsProduction={data.sectionsProduction}
            devise={data.ferme.devise}
            onSubmit={(vals) => {
              update((d) => d.transactions.push({ id: uid(), ...vals }));
              setShowAdd(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function TransactionForm({ onSubmit, comptes = [], produits = [], employes = [], categoriesDepenses = [], departements = [], sectionsProduction = [], devise = "FCFA" }) {
  const [type, setType] = useState("depense");
  const [categorie, setCategorie] = useState("");
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState("");
  const [compteId, setCompteId] = useState("");
  const [produitId, setProduitId] = useState("");
  const [quantite, setQuantite] = useState("");
  const [typeCharge, setTypeCharge] = useState("variable");
  const [employeId, setEmployeId] = useState("");
  const [departementId, setDepartementId] = useState("");
  const [sectionProductionId, setSectionProductionId] = useState("");

  const categoriesDisponibles = categoriesDepenses.filter((c) => c.actif !== false && c.type === typeCharge);

  const choisirCategorie = (nom) => {
    setCategorie(nom);
  };
  const codeCategorie = categoriesDisponibles.find((c) => c.nom === categorie)?.code || "";

  return (
    <form className="space-y-3" onSubmit={(e) => {
      e.preventDefault(); if (!montant) return;
      onSubmit({
        type, categorie, montant, date, description, compteId: compteId || null, produitId: produitId || null,
        quantite: quantite || null, typeCharge: type === "depense" ? typeCharge : null, employeId: employeId || null,
        departementId: departementId || null, sectionProductionId: sectionProductionId || null,
        codeCategorie: type === "depense" ? codeCategorie : "",
      });
    }}>
      <Field label="Type">
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="depense">Dépense</option>
          <option value="revenu">Revenu</option>
        </Select>
      </Field>
      <Field label="Catégorie">
        <Input
          value={categorie}
          onChange={(e) => choisirCategorie(e.target.value)}
          placeholder="Ex. Vente lait, Achat semence"
          list={type === "depense" && categoriesDisponibles.length > 0 ? "charge-categories" : undefined}
        />
        {type === "depense" && categoriesDisponibles.length > 0 && (
          <datalist id="charge-categories">
            {categoriesDisponibles.map((c) => <option key={c.id} value={c.nom} />)}
          </datalist>
        )}
        {codeCategorie && <p className="text-xs text-[#8B8974] mt-1">Code analytique : <span className="font-medium">{codeCategorie}</span></p>}
      </Field>
      <Field label={`Montant (${devise})`}><Input type="number" step="0.01" value={montant} onChange={(e) => setMontant(e.target.value)} required /></Field>
      <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      {type === "depense" && (
        <Field label="Type de charge">
          <Select value={typeCharge} onChange={(e) => { setTypeCharge(e.target.value); setCategorie(""); }}>
            <option value="variable">Charge variable (liée à l'exploitation : matière première, semences, alimentation...)</option>
            <option value="fixe">Charge fixe (indirecte : carburant, communication, repas, condiment, fournitures, bureautique, petits matériels...)</option>
            <option value="sociale">Charge sociale (cotisations)</option>
            <option value="salariale">Salaire</option>
            <option value="autre">Autre</option>
          </Select>
        </Field>
      )}
      {type === "depense" && (typeCharge === "salariale" || typeCharge === "sociale") && (
        <Field label="Employé concerné">
          <Select value={employeId} onChange={(e) => setEmployeId(e.target.value)}>
            <option value="">Aucun</option>
            {employes.map((emp) => <option key={emp.id} value={emp.id}>{emp.nom}</option>)}
          </Select>
        </Field>
      )}
      {type === "depense" && departements.length > 0 && (
        <Field label="Département (code analytique)">
          <Select value={departementId} onChange={(e) => setDepartementId(e.target.value)}>
            <option value="">Non précisé</option>
            {departements.filter((d) => d.actif !== false).map((d) => <option key={d.id} value={d.id}>{d.nom}{d.code ? ` (${d.code})` : ""}</option>)}
          </Select>
        </Field>
      )}
      {type === "depense" && sectionsProduction.length > 0 && (
        <Field label="Section de production (code analytique)">
          <Select value={sectionProductionId} onChange={(e) => setSectionProductionId(e.target.value)}>
            <option value="">Non précisé</option>
            {sectionsProduction.filter((s) => s.actif !== false).map((s) => <option key={s.id} value={s.id}>{s.nom}{s.code ? ` (${s.code})` : ""}</option>)}
          </Select>
        </Field>
      )}
      <Field label="Moyen de paiement">
        <Select value={compteId} onChange={(e) => setCompteId(e.target.value)}>
          <option value="">Espèces (non rattaché)</option>
          {comptes.map((c) => <option key={c.id} value={c.id}>{COMPTE_LABELS[c.type]} — {c.nom}</option>)}
        </Select>
      </Field>
      <Field label="Produit concerné (optionnel)">
        <Select value={produitId} onChange={(e) => setProduitId(e.target.value)}>
          <option value="">Aucun</option>
          {produits.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </Select>
      </Field>
      {produitId && (
        <Field label={`Quantité (${type === "revenu" ? "vendue" : "concernée"})`}>
          <Input type="number" step="0.01" value={quantite} onChange={(e) => setQuantite(e.target.value)} />
        </Field>
      )}
      <Field label="Description"><TextArea value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <Button type="submit" variant="accent" className="w-full">Enregistrer</Button>
    </form>
  );
}

// ============================================================
// TÂCHES
// ============================================================
function Taches({ data, update }) {
  const [showAdd, setShowAdd] = useState(false);
  const enCours = data.taches.filter((t) => t.statut !== "termine").sort((a, b) => (a.echeance || "9999").localeCompare(b.echeance || "9999"));
  const terminees = data.taches.filter((t) => t.statut === "termine");

  const toggle = (id) => update((d) => {
    const t = d.taches.find((x) => x.id === id);
    t.statut = t.statut === "termine" ? "a_faire" : "termine";
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Tâches</h2>
        <Button variant="accent" onClick={() => setShowAdd(true)}><Plus size={16} /> Nouvelle tâche</Button>
      </div>

      {data.taches.length === 0 ? (
        <EmptyState icon={ListChecks} text="Aucune tâche planifiée." action={<Button variant="ghost" onClick={() => setShowAdd(true)}>Ajouter une tâche</Button>} />
      ) : (
        <div className="space-y-4">
          <Card className="divide-y divide-[#EFEAD9]">
            {enCours.map((t) => (
              <TacheRow key={t.id} t={t} onToggle={() => toggle(t.id)} />
            ))}
            {enCours.length === 0 && <p className="p-4 text-sm text-[#8B8974]">Tout est fait ! 🎉</p>}
          </Card>
          {terminees.length > 0 && (
            <details>
              <summary className="text-sm text-[#8B8974] cursor-pointer">Tâches terminées ({terminees.length})</summary>
              <Card className="divide-y divide-[#EFEAD9] mt-2">
                {terminees.map((t) => (
                  <TacheRow key={t.id} t={t} onToggle={() => toggle(t.id)} />
                ))}
              </Card>
            </details>
          )}
        </div>
      )}

      {showAdd && (
        <Modal title="Nouvelle tâche" onClose={() => setShowAdd(false)}>
          <TacheForm
            onSubmit={(vals) => {
              update((d) => d.taches.push({ id: uid(), ...vals, statut: "a_faire" }));
              setShowAdd(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function TacheRow({ t, onToggle }) {
  return (
    <div className="p-3 flex items-center gap-3">
      <input type="checkbox" checked={t.statut === "termine"} onChange={onToggle} className="h-4 w-4 accent-[#2F3B2C]" />
      <div className="flex-1">
        <p className={`text-sm ${t.statut === "termine" ? "line-through text-[#8B8974]" : ""}`}>{t.titre}</p>
        {t.assignee && <p className="text-xs text-[#8B8974]">Assignée à {t.assignee}</p>}
      </div>
      {t.echeance && (
        <span className="text-xs text-[#8B8974] flex items-center gap-1"><Calendar size={12} />{fmtDate(t.echeance)}</span>
      )}
      <Badge tone={t.priorite === "haute" ? "bad" : t.priorite === "basse" ? "default" : "accent"}>{t.priorite}</Badge>
    </div>
  );
}

function TacheForm({ onSubmit }) {
  const [titre, setTitre] = useState("");
  const [echeance, setEcheance] = useState("");
  const [priorite, setPriorite] = useState("normale");
  const [assignee, setAssignee] = useState("");
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!titre) return; onSubmit({ titre, echeance, priorite, assignee }); }}>
      <Field label="Titre"><Input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. Traiter le champ du bas" required /></Field>
      <Field label="Échéance"><Input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} /></Field>
      <Field label="Priorité">
        <Select value={priorite} onChange={(e) => setPriorite(e.target.value)}>
          <option value="basse">Basse</option>
          <option value="normale">Normale</option>
          <option value="haute">Haute</option>
        </Select>
      </Field>
      <Field label="Assignée à"><Input value={assignee} onChange={(e) => setAssignee(e.target.value)} /></Field>
      <Button type="submit" variant="accent" className="w-full">Créer la tâche</Button>
    </form>
  );
}

// ============================================================
// COMPTES (banque, caisse, mobile money)
// ============================================================
function soldeCompte(data, compteId) {
  const compte = data.comptes.find((c) => c.id === compteId);
  if (!compte) return 0;
  const mvts = data.transactions.filter((t) => t.compteId === compteId);
  const delta = mvts.reduce((s, t) => s + (t.type === "revenu" ? Number(t.montant || 0) : -Number(t.montant || 0)), 0);
  return Number(compte.soldeInitial || 0) + delta;
}

// ---------- Investissements, amortissement, capital, prêts ----------
function calculAmortissement(inv) {
  const montant = Number(inv.montant || 0);
  const valeurResiduelle = Number(inv.valeurResiduelle || 0);
  const duree = Math.max(Number(inv.dureeAmortissement || 0), 0.01);
  const base = Math.max(montant - valeurResiduelle, 0);
  const annuel = base / duree;
  const mensuel = annuel / 12;
  const dateAchat = new Date(inv.date || today());
  const maintenant = new Date();
  let anneesEcoulees = (maintenant - dateAchat) / (1000 * 60 * 60 * 24 * 365.25);
  anneesEcoulees = Math.max(0, Math.min(anneesEcoulees, duree));
  const cumul = annuel * anneesEcoulees;
  const vnc = Math.max(montant - cumul, valeurResiduelle);
  const tauxAvancement = duree > 0 ? Math.min(anneesEcoulees / duree, 1) : 1;
  return { annuel, mensuel, cumul, vnc, tauxAvancement, termine: tauxAvancement >= 1 };
}

function calculPret(pret) {
  const montant = Number(pret.montant || 0);
  const tauxAnnuel = Number(pret.tauxInteret || 0) / 100;
  const tauxMensuel = tauxAnnuel / 12;
  const n = Math.max(Math.round(Number(pret.dureeMois || 1)), 1);
  const mensualite = tauxMensuel > 0
    ? (montant * tauxMensuel) / (1 - Math.pow(1 + tauxMensuel, -n))
    : montant / n;
  const dateDebut = new Date(pret.dateDebut || today());
  const echeances = [];
  let solde = montant;
  for (let i = 1; i <= n; i++) {
    const interet = solde * tauxMensuel;
    let principal = mensualite - interet;
    if (i === n) principal = solde;
    solde = Math.max(solde - principal, 0);
    const d = new Date(dateDebut);
    d.setMonth(d.getMonth() + i);
    echeances.push({ n: i, date: d.toISOString().slice(0, 10), interet, principal, solde, mensualite: principal + interet });
  }
  const maintenant = today();
  const echeancesPassees = echeances.filter((e) => e.date <= maintenant);
  const montantRembourseCumule = echeancesPassees.reduce((s, e) => s + e.mensualite, 0);
  const interetPayeCumule = echeancesPassees.reduce((s, e) => s + e.interet, 0);
  const soldeRestant = echeancesPassees.length ? echeancesPassees[echeancesPassees.length - 1].solde : montant;
  const totalInteret = echeances.reduce((s, e) => s + e.interet, 0);
  const prochaineEcheance = echeances.find((e) => e.date > maintenant);
  return {
    mensualite, echeances, echeancesPassees, montantRembourseCumule, interetPayeCumule,
    soldeRestant, totalInteret, totalARembourser: montant + totalInteret, prochaineEcheance,
    solde: solde >= 0 ? solde : 0,
  };
}

// ---------- Bulletin de paie (Mali) ----------
// Taux INPS/AMO et barème ITS conformes au Code Général des Impôts du Mali (dgi.gouv.ml/CGI/), vérifiés en ligne.
const INPS_TAUX_SALARIAL = 0.036; // retraite — part salariale
const INPS_TAUX_PATRONAL = 0.054; // retraite — part patronale
const AMO_TAUX_SALARIAL = 0.0306; // assurance maladie obligatoire — part salariale
const AMO_TAUX_PATRONAL = 0.035; // assurance maladie obligatoire — part patronale
const ANPE_TAUX_PATRONAL = 0.01; // taxe emploi (patronale uniquement)
const TAUX_AUTRES_CHARGES_PATRONALES_DEFAUT = 10.5; // prestations familiales, accidents du travail (1-4%, variable selon secteur), formation... — estimation ajustable

const BAREME_ITS_ANNUEL = [
  { min: 0, max: 330000, taux: 0 },
  { min: 330000, max: 578400, taux: 0.05 },
  { min: 578400, max: 1176400, taux: 0.12 },
  { min: 1176400, max: 1789733, taux: 0.18 },
  { min: 1789733, max: 2384195, taux: 0.26 },
  { min: 2384195, max: 3494130, taux: 0.31 },
  { min: 3494130, max: Infinity, taux: 0.37 },
];

function calculITSAnnuel(baseAnnuelle) {
  let its = 0;
  for (const tr of BAREME_ITS_ANNUEL) {
    if (baseAnnuelle > tr.min) {
      its += (Math.min(baseAnnuelle, tr.max) - tr.min) * tr.taux;
    }
  }
  return its;
}

function calculBulletinPaie({ brut, primes = 0, situationFamiliale = "celibataire", nombreEnfants = 0, tauxAutresChargesPatronales = TAUX_AUTRES_CHARGES_PATRONALES_DEFAUT }) {
  const brutTotal = Number(brut || 0) + Number(primes || 0);
  const inpsSalarial = brutTotal * INPS_TAUX_SALARIAL;
  const amoSalarial = brutTotal * AMO_TAUX_SALARIAL;
  const baseImposableMensuelle = Math.max(brutTotal - inpsSalarial - amoSalarial, 0);
  const baseImposableAnnuelle = baseImposableMensuelle * 12;
  const itsBrutAnnuel = calculITSAnnuel(baseImposableAnnuelle);
  const tauxReduction = (situationFamiliale === "marie" ? 0.10 : 0) + Math.min(Number(nombreEnfants || 0), 10) * 0.025;
  const itsNetAnnuel = itsBrutAnnuel * (1 - tauxReduction);
  const its = itsNetAnnuel / 12;
  const totalRetenues = inpsSalarial + amoSalarial + its;
  const net = brutTotal - totalRetenues;

  const inpsPatronal = brutTotal * INPS_TAUX_PATRONAL;
  const amoPatronal = brutTotal * AMO_TAUX_PATRONAL;
  const anpePatronal = brutTotal * ANPE_TAUX_PATRONAL;
  const autresChargesPatronales = brutTotal * (Number(tauxAutresChargesPatronales || 0) / 100);
  const totalChargesPatronales = inpsPatronal + amoPatronal + anpePatronal + autresChargesPatronales;
  const coutTotalEmployeur = brutTotal + totalChargesPatronales;

  return {
    brutTotal, inpsSalarial, amoSalarial, baseImposableMensuelle, its, totalRetenues, net,
    inpsPatronal, amoPatronal, anpePatronal, autresChargesPatronales, totalChargesPatronales, coutTotalEmployeur,
    tauxReduction,
  };
}

function Investissements({ data, update }) {
  const [subTab, setSubTab] = useState("investissements");
  const [showAddInv, setShowAddInv] = useState(false);
  const [showAddInvestisseur, setShowAddInvestisseur] = useState(false);
  const [showAddPret, setShowAddPret] = useState(false);
  const [selectedPret, setSelectedPret] = useState(null);
  const devise = data.ferme.devise;

  const totalCapital = data.investisseurs.reduce((s, i) => s + Number(i.montantInvesti || 0), 0);

  const resultatNetGlobal = useMemo(() => {
    const ca = data.transactions.filter((t) => t.type === "revenu").reduce((s, t) => s + Number(t.montant || 0), 0);
    const depensesHorsPrets = data.transactions.filter((t) => t.type === "depense").reduce((s, t) => s + Number(t.montant || 0), 0);
    const remboursementsPrets = data.prets.reduce((s, p) => s + calculPret(p).montantRembourseCumule, 0);
    const amortissements = data.investissements.reduce((s, inv) => s + calculAmortissement(inv).cumul, 0);
    return ca - depensesHorsPrets - remboursementsPrets - amortissements;
  }, [data.transactions, data.prets, data.investissements]);

  const subTabs = [
    { id: "investissements", label: "Investissements" },
    { id: "capital", label: "Capital & investisseurs" },
    { id: "prets", label: "Prêts & emprunts" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-serif text-xl">Investissements</h2>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {subTabs.map((s) => (
          <button
            key={s.id}
            onClick={() => setSubTab(s.id)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border ${subTab === s.id ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-white text-[#5A5744] border-[#DFD8C2]"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {subTab === "investissements" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="accent" onClick={() => setShowAddInv(true)}><Plus size={16} /> Nouvel investissement</Button>
          </div>
          {data.investissements.length === 0 ? (
            <EmptyState icon={PiggyBank} text="Aucun investissement enregistré (matériel, bâtiment, véhicule...)." action={<Button variant="ghost" onClick={() => setShowAddInv(true)}>Ajouter un investissement</Button>} />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {data.investissements.map((inv) => {
                const am = calculAmortissement(inv);
                return (
                  <Card key={inv.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{inv.nom}</h3>
                        <p className="text-xs text-[#8B8974]">Acquis le {fmtDate(inv.date)} · {money(inv.montant, devise)}</p>
                      </div>
                      <button onClick={() => { if (confirm("Supprimer cet investissement ?")) update((d) => { d.investissements = d.investissements.filter((x) => x.id !== inv.id); }); }} className="text-[#C7C2A8] hover:text-[#A6402A]">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-3 text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-[#8B8974]">Amortissement annuel</span><span>{money(am.annuel, devise)}</span></div>
                      <div className="flex justify-between"><span className="text-[#8B8974]">Amortissement cumulé</span><span>{money(am.cumul, devise)}</span></div>
                      <div className="flex justify-between font-medium"><span className="text-[#8B8974]">Valeur nette comptable</span><span>{money(am.vnc, devise)}</span></div>
                    </div>
                    <div className="mt-2 h-1.5 bg-[#EFEAD9] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-accent)]" style={{ width: `${am.tauxAvancement * 100}%` }} />
                    </div>
                    <p className="text-xs text-[#8B8974] mt-1">{am.termine ? "Entièrement amorti" : `${Math.round(am.tauxAvancement * 100)}% amorti sur ${inv.dureeAmortissement} an(s)`}</p>
                  </Card>
                );
              })}
            </div>
          )}
          {showAddInv && (
            <Modal title="Nouvel investissement" onClose={() => setShowAddInv(false)}>
              <InvestissementForm devise={devise} onSubmit={(vals) => { update((d) => d.investissements.push({ id: uid(), ...vals })); setShowAddInv(false); }} />
            </Modal>
          )}
        </div>
      )}

      {subTab === "capital" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="accent" onClick={() => setShowAddInvestisseur(true)}><Plus size={16} /> Nouvel investisseur</Button>
          </div>
          {data.investisseurs.length === 0 ? (
            <EmptyState icon={Percent} text="Aucun investisseur enregistré." action={<Button variant="ghost" onClick={() => setShowAddInvestisseur(true)}>Ajouter un investisseur</Button>} />
          ) : (
            <>
              <Card className="p-4">
                <h3 className="font-serif text-base mb-1">Répartition du capital</h3>
                <p className="text-xs text-[#8B8974] mb-3">Capital total investi : {money(totalCapital, devise)}</p>
                <div className="space-y-2">
                  {data.investisseurs.map((inv) => {
                    const pct = totalCapital > 0 ? (Number(inv.montantInvesti || 0) / totalCapital) * 100 : 0;
                    return (
                      <div key={inv.id} className="text-sm">
                        <div className="flex justify-between"><span>{inv.nom}</span><span className="text-[#8B8974]">{pct.toFixed(1)}%</span></div>
                        <div className="h-1.5 bg-[#EFEAD9] rounded-full overflow-hidden mt-1"><div className="h-full bg-[var(--color-accent)]" style={{ width: `${pct}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-serif text-base mb-1">Répartition des bénéfices</h3>
                <p className="text-xs text-[#8B8974] mb-3">
                  Résultat net global (revenus − dépenses − remboursements de prêts − amortissements) : <span className={resultatNetGlobal >= 0 ? "text-[#3C5A34]" : "text-[#A6402A]"}>{money(resultatNetGlobal, devise)}</span>
                </p>
                {resultatNetGlobal <= 0 ? (
                  <p className="text-xs text-[#8B8974]">Pas de bénéfice à répartir pour le moment.</p>
                ) : (
                  <div className="divide-y divide-[#EFEAD9]">
                    {data.investisseurs.map((inv) => {
                      const pct = totalCapital > 0 ? Number(inv.montantInvesti || 0) / totalCapital : 0;
                      const part = resultatNetGlobal * pct;
                      return (
                        <div key={inv.id} className="py-2 flex justify-between text-sm">
                          <span>{inv.nom} <span className="text-[#8B8974]">({(pct * 100).toFixed(1)}%)</span></span>
                          <span className="font-medium">{money(part, devise)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              <Card className="divide-y divide-[#EFEAD9]">
                {data.investisseurs.map((inv) => (
                  <div key={inv.id} className="p-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{inv.nom}</p>
                      <p className="text-xs text-[#8B8974]">Capital investi le {fmtDate(inv.date)}{inv.telephone ? ` · ${inv.telephone}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{money(inv.montantInvesti, devise)}</span>
                      <button onClick={() => { if (confirm("Supprimer cet investisseur ?")) update((d) => { d.investisseurs = d.investisseurs.filter((x) => x.id !== inv.id); }); }} className="text-[#C7C2A8] hover:text-[#A6402A]">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </Card>
            </>
          )}
          {showAddInvestisseur && (
            <Modal title="Nouvel investisseur" onClose={() => setShowAddInvestisseur(false)}>
              <InvestisseurForm devise={devise} onSubmit={(vals) => { update((d) => d.investisseurs.push({ id: uid(), ...vals })); setShowAddInvestisseur(false); }} />
            </Modal>
          )}
        </div>
      )}

      {subTab === "prets" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="accent" onClick={() => setShowAddPret(true)}><Plus size={16} /> Nouveau prêt</Button>
          </div>
          <p className="text-xs text-[#8B8974]">Les mensualités des prêts sont automatiquement ajoutées aux charges fixes dans le tableau Marge brute & charges (Finances), au fur et à mesure des échéances passées.</p>
          {data.prets.length === 0 ? (
            <EmptyState icon={HandCoins} text="Aucun prêt ou emprunt enregistré (bancaire, familial, ami, particulier)." action={<Button variant="ghost" onClick={() => setShowAddPret(true)}>Ajouter un prêt</Button>} />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {data.prets.map((pret) => {
                const calc = calculPret(pret);
                return (
                  <Card key={pret.id} className="p-4 cursor-pointer hover:border-[var(--color-accent)]" onClick={() => setSelectedPret(pret.id)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge tone="accent">{pret.type === "bancaire" ? "Bancaire" : "Tiers (famille/ami/particulier)"}</Badge>
                        <h3 className="font-medium mt-1">{pret.preteur}</h3>
                        <p className="text-xs text-[#8B8974]">{money(pret.montant, devise)} · {pret.tauxInteret}%/an · {pret.dureeMois} mois</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); if (confirm("Supprimer ce prêt ?")) update((d) => { d.prets = d.prets.filter((x) => x.id !== pret.id); }); }} className="text-[#C7C2A8] hover:text-[#A6402A]">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-3 text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-[#8B8974]">Mensualité</span><span>{money(calc.mensualite, devise)}</span></div>
                      <div className="flex justify-between"><span className="text-[#8B8974]">Solde restant dû</span><span>{money(calc.soldeRestant, devise)}</span></div>
                      <div className="flex justify-between"><span className="text-[#8B8974]">Intérêts déjà payés</span><span>{money(calc.interetPayeCumule, devise)}</span></div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
          {showAddPret && (
            <Modal title="Nouveau prêt / emprunt" onClose={() => setShowAddPret(false)}>
              <PretForm devise={devise} onSubmit={(vals) => { update((d) => d.prets.push({ id: uid(), ...vals })); setShowAddPret(false); }} />
            </Modal>
          )}
          {selectedPret && (() => {
            const pret = data.prets.find((p) => p.id === selectedPret);
            if (!pret) return null;
            const calc = calculPret(pret);
            return (
              <Modal title={`Échéancier — ${pret.preteur}`} onClose={() => setSelectedPret(null)}>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-[#8B8974]">Montant emprunté</p><p className="font-medium">{money(pret.montant, devise)}</p></div>
                    <div><p className="text-xs text-[#8B8974]">Total à rembourser</p><p className="font-medium">{money(calc.totalARembourser, devise)}</p></div>
                    <div><p className="text-xs text-[#8B8974]">Total intérêts</p><p className="font-medium">{money(calc.totalInteret, devise)}</p></div>
                    <div><p className="text-xs text-[#8B8974]">Mensualité</p><p className="font-medium">{money(calc.mensualite, devise)}</p></div>
                  </div>
                  <div className="max-h-72 overflow-y-auto border-t border-[#DFD8C2] pt-2">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[#8B8974] text-left">
                          <th className="pb-1">Échéance</th><th className="pb-1">Date</th><th className="pb-1 text-right">Intérêt</th><th className="pb-1 text-right">Principal</th><th className="pb-1 text-right">Solde</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calc.echeances.map((e) => (
                          <tr key={e.n} className={e.date <= today() ? "text-[#232620]" : "text-[#C7C2A8]"}>
                            <td className="py-0.5">{e.n}</td>
                            <td className="py-0.5">{fmtDate(e.date)}</td>
                            <td className="py-0.5 text-right">{money(e.interet, devise)}</td>
                            <td className="py-0.5 text-right">{money(e.principal, devise)}</td>
                            <td className="py-0.5 text-right">{money(e.solde, devise)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Modal>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function InvestissementForm({ onSubmit, devise = "FCFA" }) {
  const [nom, setNom] = useState("");
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState(today());
  const [dureeAmortissement, setDureeAmortissement] = useState("5");
  const [valeurResiduelle, setValeurResiduelle] = useState("0");
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!nom || !montant) return; onSubmit({ nom, montant, date, dureeAmortissement, valeurResiduelle }); }}>
      <Field label="Nom de l'investissement"><Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Tracteur, forage, hangar..." /></Field>
      <Field label={`Montant investi (${devise})`}><Input type="number" step="0.01" value={montant} onChange={(e) => setMontant(e.target.value)} required /></Field>
      <Field label="Date d'acquisition"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Durée d'amortissement (années)"><Input type="number" step="1" min="1" value={dureeAmortissement} onChange={(e) => setDureeAmortissement(e.target.value)} /></Field>
      <Field label={`Valeur résiduelle (${devise})`}><Input type="number" step="0.01" value={valeurResiduelle} onChange={(e) => setValeurResiduelle(e.target.value)} /></Field>
      <Button type="submit" variant="accent" className="w-full">Enregistrer</Button>
    </form>
  );
}

function InvestisseurForm({ onSubmit, devise = "FCFA" }) {
  const [nom, setNom] = useState("");
  const [montantInvesti, setMontantInvesti] = useState("");
  const [date, setDate] = useState(today());
  const [telephone, setTelephone] = useState("");
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!nom || !montantInvesti) return; onSubmit({ nom, montantInvesti, date, telephone }); }}>
      <Field label="Nom de l'investisseur"><Input value={nom} onChange={(e) => setNom(e.target.value)} /></Field>
      <Field label={`Capital investi (${devise})`}><Input type="number" step="0.01" value={montantInvesti} onChange={(e) => setMontantInvesti(e.target.value)} required /></Field>
      <Field label="Date de l'investissement"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Téléphone (optionnel)"><Input value={telephone} onChange={(e) => setTelephone(e.target.value)} /></Field>
      <Button type="submit" variant="accent" className="w-full">Enregistrer</Button>
    </form>
  );
}

function PretForm({ onSubmit, devise = "FCFA" }) {
  const [type, setType] = useState("bancaire");
  const [preteur, setPreteur] = useState("");
  const [montant, setMontant] = useState("");
  const [tauxInteret, setTauxInteret] = useState("");
  const [dureeMois, setDureeMois] = useState("12");
  const [dateDebut, setDateDebut] = useState(today());
  const [notes, setNotes] = useState("");
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!preteur || !montant || !dureeMois) return; onSubmit({ type, preteur, montant, tauxInteret: tauxInteret || 0, dureeMois, dateDebut, notes }); }}>
      <Field label="Type de prêt">
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="bancaire">Emprunt bancaire</option>
          <option value="tiers">Tiers (famille, ami, particulier)</option>
        </Select>
      </Field>
      <Field label={type === "bancaire" ? "Nom de la banque" : "Nom du prêteur"}><Input value={preteur} onChange={(e) => setPreteur(e.target.value)} /></Field>
      <Field label={`Montant emprunté (${devise})`}><Input type="number" step="0.01" value={montant} onChange={(e) => setMontant(e.target.value)} required /></Field>
      <Field label="Taux d'intérêt annuel (%)"><Input type="number" step="0.01" value={tauxInteret} onChange={(e) => setTauxInteret(e.target.value)} placeholder="0 si sans intérêt" /></Field>
      <Field label="Durée (mois)"><Input type="number" step="1" min="1" value={dureeMois} onChange={(e) => setDureeMois(e.target.value)} required /></Field>
      <Field label="Date de début"><Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} /></Field>
      <Field label="Notes (optionnel)"><TextArea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <Button type="submit" variant="accent" className="w-full">Enregistrer</Button>
    </form>
  );
}

// ---------- Fournisseurs & clients ----------
const TIERS_TYPE_LABELS = { fournisseur: "Fournisseur", client: "Client", les_deux: "Fournisseur & client" };

function Contacts({ data, update }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("tous");

  const filtered = data.tiers.filter((t) => filter === "tous" || t.type === filter || (filter !== "tous" && t.type === "les_deux"));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-serif text-xl">Fournisseurs & clients</h2>
        <Button variant="accent" onClick={() => setShowAdd(true)}><Plus size={16} /> Nouveau contact</Button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {["tous", "fournisseur", "client"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border ${filter === f ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-white text-[#5A5744] border-[#DFD8C2]"}`}
          >
            {f === "tous" ? "Tous" : f === "fournisseur" ? "Fournisseurs" : "Clients"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Contact} text="Aucun contact enregistré (fournisseur ou client)." action={<Button variant="ghost" onClick={() => setShowAdd(true)}>Ajouter un contact</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{t.nom}</h3>
                  <Badge tone="accent">{TIERS_TYPE_LABELS[t.type] || t.type}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditing(t.id)} className="text-[#8B5E3C] text-xs">Modifier</button>
                  <button onClick={() => { if (confirm("Supprimer ce contact ?")) update((d) => { d.tiers = d.tiers.filter((x) => x.id !== t.id); }); }} className="text-[#C7C2A8] hover:text-[#A6402A]">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                {t.telephone && <p className="flex items-center gap-1.5 text-[#8B8974]"><Phone size={12} /> {t.telephone}</p>}
                {t.email && <p className="flex items-center gap-1.5 text-[#8B8974]"><Mail size={12} /> {t.email}</p>}
                {t.adresse && <p className="text-[#8B8974]">{t.adresse}</p>}
              </div>
              {t.produits && t.produits.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.produits.map((p) => <Badge key={p} tone="default">{p}</Badge>)}
                </div>
              )}
              {t.notes && <p className="text-xs text-[#8B8974] mt-2 italic">{t.notes}</p>}
            </Card>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Nouveau contact" onClose={() => setShowAdd(false)}>
          <ContactForm produits={data.produits} onSubmit={(vals) => { update((d) => d.tiers.push({ id: uid(), ...vals })); setShowAdd(false); }} />
        </Modal>
      )}

      {editing && (
        <Modal title="Modifier le contact" onClose={() => setEditing(null)}>
          <ContactForm
            produits={data.produits}
            initial={data.tiers.find((t) => t.id === editing)}
            onSubmit={(vals) => {
              update((d) => { const t = d.tiers.find((x) => x.id === editing); Object.assign(t, vals); });
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function ContactForm({ onSubmit, initial, produits = [] }) {
  const [nom, setNom] = useState(initial?.nom || "");
  const [type, setType] = useState(initial?.type || "fournisseur");
  const [telephone, setTelephone] = useState(initial?.telephone || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [adresse, setAdresse] = useState(initial?.adresse || "");
  const [produitsSelect, setProduitsSelect] = useState(initial?.produits || []);
  const [notes, setNotes] = useState(initial?.notes || "");

  const toggleProduit = (nomProduit) => {
    setProduitsSelect((ls) => ls.includes(nomProduit) ? ls.filter((p) => p !== nomProduit) : [...ls, nomProduit]);
  };

  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!nom) return; onSubmit({ nom, type, telephone, email, adresse, produits: produitsSelect, notes }); }}>
      <Field label="Nom">
        <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Coopérative Sikasso" />
      </Field>
      <Field label="Type">
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="fournisseur">Fournisseur</option>
          <option value="client">Client</option>
          <option value="les_deux">Fournisseur & client</option>
        </Select>
      </Field>
      <Field label="Téléphone"><Input value={telephone} onChange={(e) => setTelephone(e.target.value)} /></Field>
      <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Field label="Adresse"><Input value={adresse} onChange={(e) => setAdresse(e.target.value)} /></Field>
      {produits.length > 0 && (
        <Field label="Produits associés">
          <div className="flex flex-wrap gap-1.5">
            {produits.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => toggleProduit(p.nom)}
                className={`px-2.5 py-1 rounded-full text-xs border ${produitsSelect.includes(p.nom) ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]" : "bg-white text-[#5A5744] border-[#DFD8C2]"}`}
              >
                {p.nom}
              </button>
            ))}
          </div>
        </Field>
      )}
      <Field label="Notes (optionnel)"><TextArea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <Button type="submit" variant="accent" className="w-full">Enregistrer</Button>
    </form>
  );
}

function Comptes({ data, update }) {
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Comptes</h2>
        <Button variant="accent" onClick={() => setShowAdd(true)}><Plus size={16} /> Nouveau compte</Button>
      </div>

      {data.comptes.length === 0 ? (
        <EmptyState icon={Landmark} text="Aucun compte enregistré (banque, caisse, mobile money)." action={<Button variant="ghost" onClick={() => setShowAdd(true)}>Ajouter un compte</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.comptes.map((c) => {
            const Icon = COMPTE_ICONS[c.type];
            const solde = soldeCompte(data, c.id);
            return (
              <Card key={c.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-[#8B5E3C]" />
                    <div>
                      <h3 className="font-medium">{c.nom}</h3>
                      <p className="text-xs text-[#8B8974]">{COMPTE_LABELS[c.type]}</p>
                    </div>
                  </div>
                  <button onClick={() => { if (confirm("Supprimer ce compte ?")) update((d) => { d.comptes = d.comptes.filter((x) => x.id !== c.id); }); }} className="text-[#C7C2A8] hover:text-[#A6402A]">
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className={`font-serif text-2xl mt-3 ${solde >= 0 ? "text-[#3C5A34]" : "text-[#A6402A]"}`}>
                  {money(solde, data.ferme.devise)}
                </p>
                <Button variant="ghost" className="mt-3 w-full" onClick={() => setSelected(c.id)}>Voir les mouvements</Button>
              </Card>
            );
          })}
        </div>
      )}

      {showAdd && (
        <Modal title="Nouveau compte" onClose={() => setShowAdd(false)}>
          <CompteForm
            onSubmit={(vals) => {
              update((d) => d.comptes.push({ id: uid(), ...vals }));
              setShowAdd(false);
            }}
          />
        </Modal>
      )}

      {selected && (
        <Modal title="Mouvements du compte" onClose={() => setSelected(null)}>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.transactions.filter((t) => t.compteId === selected).length === 0 ? (
              <p className="text-sm text-[#8B8974]">Aucun mouvement sur ce compte.</p>
            ) : (
              [...data.transactions].filter((t) => t.compteId === selected).reverse().map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm border-b border-[#EFEAD9] pb-2">
                  <div>
                    <p>{t.description || t.categorie}</p>
                    <p className="text-xs text-[#8B8974]">{fmtDate(t.date)}</p>
                  </div>
                  <span className={t.type === "revenu" ? "text-[#3C5A34]" : "text-[#A6402A]"}>
                    {t.type === "revenu" ? "+" : "-"}{Number(t.montant).toLocaleString("fr-FR")}
                  </span>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function CompteForm({ onSubmit }) {
  const [nom, setNom] = useState("");
  const [type, setType] = useState("banque");
  const [soldeInitial, setSoldeInitial] = useState("");
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!nom) return; onSubmit({ nom, type, soldeInitial: soldeInitial || 0 }); }}>
      <Field label="Type de compte">
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="banque">Banque</option>
          <option value="caisse">Caisse</option>
          <option value="mobile_money">Mobile Money</option>
        </Select>
      </Field>
      <Field label="Nom du compte"><Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. BICIS, Caisse principale, Orange Money" required /></Field>
      <Field label="Solde initial (FCFA)"><Input type="number" step="0.01" value={soldeInitial} onChange={(e) => setSoldeInitial(e.target.value)} /></Field>
      <Button type="submit" variant="accent" className="w-full">Créer le compte</Button>
    </form>
  );
}

// ============================================================
// DOCUMENTS (reçu, facture, bordereau de réception, commande)
// ============================================================
function texteDocument(doc, data) {
  const lignes = [
    `${DOC_LABELS[doc.type]}${doc.numero ? ` N° ${doc.numero}` : ""}`,
    `Date : ${fmtDate(doc.date)}`,
    `${data.ferme.nom}`,
    doc.tiers ? `Tiers : ${doc.tiers}` : "",
    "",
  ];
  if (doc.lignes && doc.lignes.length > 0) {
    doc.lignes.forEach((l) => lignes.push(`- ${l.produit || "?"} : ${l.quantite} ${l.unite || ""} × ${money(l.prixUnitaire, data.ferme.devise)}`));
    lignes.push("");
  }
  if (doc.montant) lignes.push(`Montant : ${money(doc.montant, data.ferme.devise)}`);
  lignes.push(`Statut : ${{ en_attente: "En attente", valide: "Validé", paye: "Payé" }[doc.statut] || doc.statut}`);
  if (doc.notes) lignes.push("", `Notes : ${doc.notes}`);
  if (doc.signataire) lignes.push("", `Signé par ${doc.signataire} le ${fmtDate(doc.dateSignature)}`);
  return lignes.filter(Boolean).join("\n");
}

function Documents({ data, update }) {
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("tous");
  const [selected, setSelected] = useState(null);
  const [showSignature, setShowSignature] = useState(false);
  const [shareError, setShareError] = useState("");

  const filtered = filter === "tous" ? data.documents : data.documents.filter((d) => d.type === filter);
  const doc = data.documents.find((d) => d.id === selected);

  const partager = async (d) => {
    setShareError("");
    try {
      await partagerDocument({
        titre: `${DOC_LABELS[d.type]} — ${data.ferme.nom}`,
        sujet: `${DOC_LABELS[d.type]}${d.numero ? ` N° ${d.numero}` : ""} — ${data.ferme.nom}`,
        texte: texteDocument(d, data),
        signatureDataUrl: d.signature || null,
        nomFichierImage: `signature-${d.numero || d.id}.png`,
      });
    } catch (err) {
      setShareError("Le partage a échoué. Réessayez.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-serif text-xl">Documents</h2>
        <Button variant="accent" onClick={() => setShowAdd(true)}><Plus size={16} /> Nouveau document</Button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {["tous", "recu", "facture", "bordereau_reception", "commande"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border ${filter === f ? "bg-[#2F3B2C] text-white border-[#2F3B2C]" : "bg-white text-[#5A5744] border-[#DFD8C2]"}`}
          >
            {f === "tous" ? "Tous" : DOC_LABELS[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} text="Aucun document enregistré." action={<Button variant="ghost" onClick={() => setShowAdd(true)}>Ajouter un document</Button>} />
      ) : (
        <Card className="divide-y divide-[#EFEAD9]">
          {[...filtered].reverse().map((d) => (
            <div key={d.id} className="p-3 flex items-center justify-between text-sm gap-3 cursor-pointer hover:bg-[#FBF9F2]" onClick={() => setSelected(d.id)}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone="accent">{DOC_LABELS[d.type]}</Badge>
                  {d.numero && <span className="text-xs text-[#8B8974]">N° {d.numero}</span>}
                  {d.signature && <Badge tone="good"><Check size={10} className="inline -mt-0.5" /> Signé</Badge>}
                </div>
                <p className="font-medium truncate mt-0.5">{d.tiers || "Tiers non précisé"}</p>
                <p className="text-xs text-[#8B8974]">{fmtDate(d.date)}</p>
                {d.stockId && (
                  <p className="text-xs text-[#8B5E14] mt-0.5">
                    + {d.quantiteRecue} {data.stocks.find((s) => s.id === d.stockId)?.unite} → {data.stocks.find((s) => s.id === d.stockId)?.nom}
                  </p>
                )}
                {d.lignes && d.lignes.length > 0 && (
                  <ul className="mt-1 text-xs text-[#8B8974] space-y-0.5">
                    {d.lignes.map((l) => (
                      <li key={l.id}>{l.produit || "?"} — {l.quantite} {l.unite || ""} × {money(l.prixUnitaire, data.ferme.devise)}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {d.montant && <span className="font-medium">{money(d.montant, data.ferme.devise)}</span>}
                <Badge tone={d.statut === "paye" ? "good" : d.statut === "valide" ? "accent" : "default"}>
                  {{ en_attente: "En attente", valide: "Validé", paye: "Payé" }[d.statut] || d.statut}
                </Badge>
                <ChevronRight size={16} className="text-[#C7C2A8]" />
              </div>
            </div>
          ))}
        </Card>
      )}

      {showAdd && (
        <Modal title="Nouveau document" onClose={() => setShowAdd(false)}>
          <DocumentForm
            stocks={data.stocks}
            produits={data.produits}
            tiersListe={data.tiers}
            devise={data.ferme.devise}
            onSubmit={(vals) => {
              update((d) => {
                d.documents.push({ id: uid(), ...vals });
                if (vals.type === "bordereau_reception" && vals.stockId && Number(vals.quantiteRecue) > 0) {
                  const s = d.stocks.find((x) => x.id === vals.stockId);
                  if (s) s.quantite = Number(s.quantite || 0) + Number(vals.quantiteRecue);
                  d.mouvementsStock.push({ id: uid(), stockId: vals.stockId, type: "entree", quantite: Number(vals.quantiteRecue), date: vals.date || today() });
                }
              });
              setShowAdd(false);
            }}
          />
        </Modal>
      )}

      {doc && (
        <Modal title={`${DOC_LABELS[doc.type]}${doc.numero ? ` — N° ${doc.numero}` : ""}`} onClose={() => setSelected(null)}>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-[#8B8974]">Tiers</span><span className="font-medium">{doc.tiers || "—"}</span></div>
            <div className="flex justify-between"><span className="text-[#8B8974]">Date</span><span>{fmtDate(doc.date)}</span></div>
            {doc.lignes && doc.lignes.length > 0 && (
              <div className="border-t border-[#EFEAD9] pt-2">
                {doc.lignes.map((l) => (
                  <div key={l.id} className="flex justify-between text-xs py-0.5">
                    <span>{l.produit || "?"} — {l.quantite} {l.unite || ""}</span>
                    <span>{money(Number(l.quantite || 0) * Number(l.prixUnitaire || 0), data.ferme.devise)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between font-medium border-t border-[#EFEAD9] pt-2"><span>Montant</span><span>{money(doc.montant, data.ferme.devise)}</span></div>
            <div className="flex justify-between"><span className="text-[#8B8974]">Statut</span>
              <Badge tone={doc.statut === "paye" ? "good" : doc.statut === "valide" ? "accent" : "default"}>
                {{ en_attente: "En attente", valide: "Validé", paye: "Payé" }[doc.statut] || doc.statut}
              </Badge>
            </div>
            {doc.notes && <p className="text-xs text-[#8B8974] border-t border-[#EFEAD9] pt-2">{doc.notes}</p>}

            <div className="border-t border-[#EFEAD9] pt-3">
              <p className="text-xs font-medium text-[#5A5744] mb-1">Signature</p>
              {doc.signature ? (
                <div>
                  <img src={doc.signature} alt="Signature" className="h-16 border border-[#DFD8C2] rounded-md bg-white" />
                  <p className="text-xs text-[#8B8974] mt-1">Signé par {doc.signataire} le {fmtDate(doc.dateSignature)}</p>
                </div>
              ) : (
                <p className="text-xs text-[#8B8974]">Aucune signature.</p>
              )}
              <Button variant="ghost" className="mt-2" onClick={() => setShowSignature(true)}><PenTool size={14} /> {doc.signature ? "Re-signer" : "Signer le document"}</Button>
            </div>

            {shareError && <p className="text-xs text-[#A6402A]">{shareError}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="accent" className="flex-1" onClick={() => partager(doc)}><Send size={14} /> Partager par email</Button>
              <Button variant="danger" onClick={() => { if (confirm("Supprimer ce document ?")) { update((d) => { d.documents = d.documents.filter((x) => x.id !== doc.id); }); setSelected(null); } }}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showSignature && doc && (
        <Modal title="Signer le document" onClose={() => setShowSignature(false)}>
          <SignaturePad
            initialNom={doc.signataire || ""}
            onSave={(signature, signataire) => {
              update((d) => {
                const target = d.documents.find((x) => x.id === doc.id);
                target.signature = signature;
                target.signataire = signataire;
                target.dateSignature = today();
              });
              setShowSignature(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function SignaturePad({ onSave, initialNom = "" }) {
  const canvasRef = React.useRef(null);
  const drawing = React.useRef(false);
  const [empty, setEmpty] = useState(true);
  const [nom, setNom] = useState(initialNom);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#232620";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
  }, []);

  const pos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: (point.clientX - rect.left) * (canvas.width / rect.width), y: (point.clientY - rect.top) * (canvas.height / rect.height) };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const { x, y } = pos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    setEmpty(false);
  };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const { x, y } = pos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const end = () => { drawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setEmpty(true);
  };

  const save = () => {
    if (empty) return;
    onSave(canvasRef.current.toDataURL("image/png"), nom.trim());
  };

  return (
    <div className="space-y-3">
      <Field label="Nom du signataire"><Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Désiré Forogo" /></Field>
      <div>
        <p className="text-xs text-[#6E6B58] mb-1">Signez dans le cadre ci-dessous</p>
        <canvas
          ref={canvasRef}
          width={500}
          height={200}
          className="w-full h-40 border border-[#DFD8C2] rounded-md bg-white touch-none"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={clear} className="flex-1">Effacer</Button>
        <Button variant="accent" onClick={save} disabled={empty || !nom.trim()} className="flex-1">Valider la signature</Button>
      </div>
    </div>
  );
}

function DocumentForm({ onSubmit, stocks = [], produits = [], tiersListe = [], devise = "FCFA" }) {
  const [type, setType] = useState("recu");
  const [numero, setNumero] = useState("");
  const [date, setDate] = useState(today());
  const [tiers, setTiers] = useState("");
  const [montant, setMontant] = useState("");
  const [statut, setStatut] = useState("en_attente");
  const [notes, setNotes] = useState("");
  const [stockId, setStockId] = useState("");
  const [quantiteRecue, setQuantiteRecue] = useState("");
  const [lignes, setLignes] = useState([]);

  const showLignes = type === "facture" || type === "commande";
  const totalLignes = lignes.reduce((s, l) => s + Number(l.quantite || 0) * Number(l.prixUnitaire || 0), 0);

  const addLigne = () => setLignes((ls) => [...ls, { id: uid(), produit: "", quantite: "", unite: "", prixUnitaire: "" }]);
  const updateLigne = (id, field, value) => setLignes((ls) => ls.map((l) => {
    if (l.id !== id) return l;
    const updated = { ...l, [field]: value };
    if (field === "produit") {
      const p = produits.find((pr) => pr.nom === value);
      if (p && !l.unite) updated.unite = p.unite;
    }
    return updated;
  }));
  const removeLigne = (id) => setLignes((ls) => ls.filter((l) => l.id !== id));

  return (
    <form className="space-y-3" onSubmit={(e) => {
      e.preventDefault();
      const montantFinal = showLignes && lignes.length > 0 ? totalLignes : montant;
      onSubmit({ type, numero, date, tiers, montant: montantFinal, statut, notes, stockId: stockId || null, quantiteRecue: quantiteRecue || null, lignes: showLignes ? lignes : [] });
    }}>
      <Field label="Type de document">
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="recu">Reçu</option>
          <option value="facture">Facture</option>
          <option value="bordereau_reception">Bordereau de réception</option>
          <option value="commande">Commande</option>
        </Select>
      </Field>
      <Field label="Numéro"><Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex. FA-2026-014" /></Field>
      <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Fournisseur / Client">
        <Input list="tiers-liste" value={tiers} onChange={(e) => setTiers(e.target.value)} />
        <datalist id="tiers-liste">
          {tiersListe.map((t) => <option key={t.id} value={t.nom} />)}
        </datalist>
      </Field>

      {showLignes && (
        <div className="rounded-md border border-[#DFD8C2] bg-[#FBF9F2] p-3 space-y-3">
          <p className="text-xs text-[#6E6B58]">Détail des produits — le montant total se calcule automatiquement.</p>
          {lignes.map((l) => (
            <div key={l.id} className="grid grid-cols-2 sm:grid-cols-[2fr_0.8fr_0.8fr_1fr_auto] gap-2 items-end">
              <Field label="Produit">
                <Input list="produits-liste" value={l.produit} onChange={(e) => updateLigne(l.id, "produit", e.target.value)} placeholder="Ex. Semence de maïs" />
              </Field>
              <Field label="Unité">
                <Input value={l.unite} onChange={(e) => updateLigne(l.id, "unite", e.target.value)} placeholder="kg, sac, L..." />
              </Field>
              <Field label="Quantité">
                <Input type="number" step="0.01" value={l.quantite} onChange={(e) => updateLigne(l.id, "quantite", e.target.value)} />
              </Field>
              <Field label="Prix unitaire">
                <Input type="number" step="0.01" value={l.prixUnitaire} onChange={(e) => updateLigne(l.id, "prixUnitaire", e.target.value)} />
              </Field>
              <div className="flex items-center gap-2 pb-2">
                <span className="text-xs text-[#8B8974] whitespace-nowrap">{money(Number(l.quantite || 0) * Number(l.prixUnitaire || 0), devise)}</span>
                <button type="button" onClick={() => removeLigne(l.id)} className="text-[#C7C2A8] hover:text-[#A6402A]"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          <datalist id="produits-liste">
            {produits.map((p) => <option key={p.id} value={p.nom} />)}
          </datalist>
          <Button type="button" variant="ghost" onClick={addLigne}><Plus size={14} /> Ajouter une ligne</Button>
          {lignes.length > 0 && (
            <div className="flex justify-between bg-[var(--color-total-bg)] text-[var(--color-total-text)] rounded-md px-2 py-2 text-xs font-serif font-bold">
              <span>Total</span>
              <span className="text-[var(--color-accent)]">{money(totalLignes, devise)}</span>
            </div>
          )}
        </div>
      )}

      {!(showLignes && lignes.length > 0) && (
        <Field label={`Montant (${devise})`}><Input type="number" step="0.01" value={montant} onChange={(e) => setMontant(e.target.value)} /></Field>
      )}

      {type === "bordereau_reception" && (
        <div className="rounded-md border border-[#EAD3A0] bg-[#F7E9D2] p-3 space-y-3">
          <p className="text-xs text-[#8B5E14]">À la réception, la quantité indiquée est ajoutée automatiquement au stock choisi.</p>
          <Field label="Article de stock reçu">
            <Select value={stockId} onChange={(e) => setStockId(e.target.value)}>
              <option value="">— Sélectionner un article —</option>
              {stocks.map((s) => <option key={s.id} value={s.id}>{s.nom} ({s.unite})</option>)}
            </Select>
          </Field>
          <Field label="Quantité reçue"><Input type="number" step="0.01" value={quantiteRecue} onChange={(e) => setQuantiteRecue(e.target.value)} /></Field>
        </div>
      )}

      <Field label="Statut">
        <Select value={statut} onChange={(e) => setStatut(e.target.value)}>
          <option value="en_attente">En attente</option>
          <option value="valide">Validé</option>
          <option value="paye">Payé</option>
        </Select>
      </Field>
      <Field label="Notes"><TextArea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <Button type="submit" variant="accent" className="w-full">Enregistrer</Button>
    </form>
  );
}

// ============================================================
// RAPPORT MENSUEL (visuel)
// ============================================================
function GrandLivre({ data }) {
  const [vue, setVue] = useState("categorie");
  const [ouverts, setOuverts] = useState({});
  const devise = data.ferme.devise;

  const toggle = (cle) => setOuverts((o) => ({ ...o, [cle]: !o[cle] }));

  const groupes = useMemo(() => {
    const map = {};
    const codeDe = {};
    const cleDe = (t) => {
      if (vue === "categorie") {
        const cat = data.categoriesDepenses.find((c) => c.nom === t.categorie);
        return { cle: t.categorie || "Non catégorisé", code: cat?.code || "" };
      }
      if (vue === "compte") {
        if (!t.compteId) return { cle: "Espèces (non rattaché)", code: "" };
        const c = data.comptes.find((x) => x.id === t.compteId);
        return { cle: c ? `${COMPTE_LABELS[c.type]} — ${c.nom}` : "Compte supprimé", code: "" };
      }
      if (vue === "departement") {
        const d = data.departements.find((x) => x.id === t.departementId);
        return { cle: d ? d.nom : "Non précisé", code: d?.code || "" };
      }
      const s = data.sectionsProduction.find((x) => x.id === t.sectionProductionId);
      return { cle: s ? s.nom : "Non précisé", code: s?.code || "" };
    };
    [...data.transactions].sort((a, b) => a.date.localeCompare(b.date)).forEach((t) => {
      const { cle, code } = cleDe(t);
      map[cle] = map[cle] || [];
      map[cle].push(t);
      if (code) codeDe[cle] = code;
    });
    return Object.entries(map)
      .map(([cle, lignes]) => {
        let solde = 0;
        const lignesAvecSolde = lignes.map((t) => {
          solde += t.type === "revenu" ? Number(t.montant || 0) : -Number(t.montant || 0);
          return { ...t, soldeApres: solde };
        });
        const totalDebit = lignes.filter((t) => t.type === "depense").reduce((s, t) => s + Number(t.montant || 0), 0);
        const totalCredit = lignes.filter((t) => t.type === "revenu").reduce((s, t) => s + Number(t.montant || 0), 0);
        return { cle, code: codeDe[cle] || "", lignes: lignesAvecSolde, totalDebit, totalCredit, solde };
      })
      .sort((a, b) => a.cle.localeCompare(b.cle));
  }, [data.transactions, data.comptes, data.categoriesDepenses, data.departements, data.sectionsProduction, vue]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h3 className="font-serif text-sm">Grand livre</h3>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
        {[
          { id: "categorie", label: "Par catégorie" },
          { id: "compte", label: "Par compte" },
          { id: "departement", label: "Par département" },
          { id: "section", label: "Par section" },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setVue(v.id)}
            className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap border ${vue === v.id ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-white text-[#5A5744] border-[#DFD8C2]"}`}
          >{v.label}</button>
        ))}
      </div>
      <p className="text-xs text-[#8B8974] mb-3">Liste chronologique de toutes les écritures, regroupées selon la vue choisie, avec code analytique et solde cumulé. Touchez un groupe pour voir le détail des écritures.</p>

      <div className="divide-y divide-[#EFEAD9]">
        {groupes.map((g) => (
          <div key={g.cle} className="py-2">
            <button onClick={() => toggle(g.cle)} className="w-full flex items-center justify-between text-sm">
              <span className="font-medium flex items-center gap-1.5">
                <ChevronRight size={14} className={`text-[#C7C2A8] transition-transform ${ouverts[g.cle] ? "rotate-90" : ""}`} />
                {g.cle}
                {g.code && <Badge tone="accent">{g.code}</Badge>}
              </span>
              <span className={`font-medium ${g.solde >= 0 ? "text-[#3C5A34]" : "text-[#A6402A]"}`}>{money(g.solde, devise)}</span>
            </button>
            {ouverts[g.cle] && (
              <div className="mt-2 ml-5 space-y-1">
                <div className="flex justify-between text-xs text-[#8B8974] pb-1 border-b border-[#EFEAD9]">
                  <span>Total débit (sorties) : {money(g.totalDebit, devise)}</span>
                  <span>Total crédit (entrées) : {money(g.totalCredit, devise)}</span>
                </div>
                {g.lignes.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-xs py-0.5">
                    <span className="text-[#8B8974] w-16 shrink-0">{fmtDate(t.date)}</span>
                    <span className="flex-1 truncate px-2">{t.description || "—"}</span>
                    <span className={`w-20 text-right shrink-0 ${t.type === "revenu" ? "text-[#3C5A34]" : "text-[#A6402A]"}`}>
                      {t.type === "revenu" ? "+" : "-"}{money(t.montant, devise)}
                    </span>
                    <span className="w-24 text-right shrink-0 text-[#8B8974]">{money(t.soldeApres, devise)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function RapportMensuel({ data }) {
  const [mois, setMois] = useState(today().slice(0, 7)); // "YYYY-MM"
  const inMonth = (d) => d && d.slice(0, 7) === mois;

  // ---- Vue globale (toute la période) : progression & CA annuel ----
  const progressionMensuelle = useMemo(() => {
    const map = {};
    data.transactions.forEach((t) => {
      if (!t.date) return;
      const m = t.date.slice(0, 7);
      map[m] = map[m] || 0;
      map[m] += t.type === "revenu" ? Number(t.montant || 0) : -Number(t.montant || 0);
    });
    let cumul = 0;
    return Object.keys(map).sort().map((m) => {
      cumul += map[m];
      return { mois: m, solde: Math.round(cumul) };
    });
  }, [data.transactions]);

  const caParAnnee = useMemo(() => {
    const map = {};
    data.transactions.forEach((t) => {
      if (!t.date) return;
      const y = t.date.slice(0, 4);
      map[y] = map[y] || { annee: y, chiffreAffaires: 0, depenses: 0 };
      if (t.type === "revenu") map[y].chiffreAffaires += Number(t.montant || 0);
      else map[y].depenses += Number(t.montant || 0);
    });
    return Object.values(map).sort((a, b) => a.annee.localeCompare(b.annee));
  }, [data.transactions]);

  // ---- Marge brute & charges (toute la période) ----
  const chargesEtMarge = useMemo(() => {
    const ca = data.transactions.filter((t) => t.type === "revenu").reduce((s, t) => s + Number(t.montant || 0), 0);
    const parType = { variable: 0, fixe: 0, sociale: 0, salariale: 0, autre: 0 };
    const parCategorieCharge = { variable: {}, fixe: {} };
    data.transactions.filter((t) => t.type === "depense").forEach((t) => {
      const key = t.typeCharge && parType.hasOwnProperty(t.typeCharge) ? t.typeCharge : "autre";
      parType[key] += Number(t.montant || 0);
      if (key === "variable" || key === "fixe") {
        const cat = t.categorie || "Non catégorisé";
        parCategorieCharge[key][cat] = (parCategorieCharge[key][cat] || 0) + Number(t.montant || 0);
      }
    });
    const remboursementsPrets = (data.prets || []).reduce((s, p) => s + calculPret(p).montantRembourseCumule, 0);
    if (remboursementsPrets > 0) {
      parType.fixe += remboursementsPrets;
      parCategorieCharge.fixe["Remboursement de prêts (auto)"] = (parCategorieCharge.fixe["Remboursement de prêts (auto)"] || 0) + remboursementsPrets;
    }
    const amortissements = (data.investissements || []).reduce((s, inv) => s + calculAmortissement(inv).cumul, 0);
    if (amortissements > 0) {
      parType.fixe += amortissements;
      parCategorieCharge.fixe["Dotations aux amortissements (auto)"] = (parCategorieCharge.fixe["Dotations aux amortissements (auto)"] || 0) + amortissements;
    }
    const chargesVariables = parType.variable;
    const margeBrute = ca - chargesVariables;
    const autresCharges = parType.fixe + parType.sociale + parType.salariale + parType.autre;
    const resultatNet = margeBrute - autresCharges;
    return { ca, parType, parCategorieCharge, chargesVariables, margeBrute, autresCharges, resultatNet, remboursementsPrets, amortissements };
  }, [data.transactions, data.prets, data.investissements]);

  const transactionsMois = data.transactions.filter((t) => inMonth(t.date));
  const mouvementsStockMois = data.mouvementsStock.filter((m) => inMonth(m.date));
  const interventionsMois = data.parcelles.flatMap((p) => (p.cycles || []).flatMap((c) => (c.interventions || []).map((i) => ({ ...i, parcelle: p.nom }))))
    .filter((i) => inMonth(i.date));
  const santeMois = data.animaux.flatMap((a) => (a.sante || []).map((s) => ({ ...s, animal: a.identifiant }))).filter((s) => inMonth(s.date));
  const reproMois = data.animaux.flatMap((a) => (a.reproduction || []).map((r) => ({ ...r, animal: a.identifiant, date: r.dateSaillieOuIA }))).filter((r) => inMonth(r.date));
  const productionMois = data.animaux.flatMap((a) => (a.production || []).map((p) => ({ ...p, animal: a.identifiant }))).filter((p) => inMonth(p.date));
  const documentsMois = data.documents.filter((doc) => inMonth(doc.date));
  const elevageMois = [...santeMois, ...reproMois, ...productionMois];

  const revenus = transactionsMois.filter((t) => t.type === "revenu").reduce((s, t) => s + Number(t.montant || 0), 0);
  const depenses = transactionsMois.filter((t) => t.type === "depense").reduce((s, t) => s + Number(t.montant || 0), 0);

  const parCategorie = useMemo(() => {
    const map = {};
    transactionsMois.forEach((t) => {
      const cat = t.categorie || "Autre";
      map[cat] = map[cat] || { categorie: cat, revenu: 0, depense: 0 };
      map[cat][t.type === "revenu" ? "revenu" : "depense"] += Number(t.montant || 0);
    });
    return Object.values(map).sort((a, b) => (b.revenu + b.depense) - (a.revenu + a.depense)).slice(0, 6);
  }, [mois, data.transactions]);

  const soldeParJour = useMemo(() => {
    const jours = {};
    transactionsMois.forEach((t) => {
      const j = t.date;
      jours[j] = (jours[j] || 0) + (t.type === "revenu" ? Number(t.montant) : -Number(t.montant));
    });
    let cumul = 0;
    return Object.keys(jours).sort().map((j) => {
      cumul += jours[j];
      return { jour: j.slice(8, 10), solde: cumul };
    });
  }, [mois, data.transactions]);

  const parModule = [
    { module: "cultures", count: interventionsMois.length },
    { module: "elevage", count: elevageMois.length },
    { module: "stocks", count: mouvementsStockMois.length },
    { module: "finances", count: transactionsMois.length },
    { module: "documents", count: documentsMois.length },
  ].filter((m) => m.count > 0);

  const stockParArticle = useMemo(() => {
    const map = {};
    mouvementsStockMois.forEach((m) => {
      const stock = data.stocks.find((s) => s.id === m.stockId);
      const nom = stock ? stock.nom : "Article supprimé";
      map[nom] = map[nom] || { nom, entree: 0, sortie: 0 };
      map[nom][m.type] += Number(m.quantite || 0);
    });
    return Object.values(map);
  }, [mois, data.mouvementsStock]);

  const chrono = [
    ...interventionsMois.map((i) => ({ date: i.date, module: "cultures", label: `${i.type} — ${i.parcelle}` })),
    ...santeMois.map((s) => ({ date: s.date, module: "elevage", label: `Santé (${s.type}) — ${s.animal}` })),
    ...reproMois.map((r) => ({ date: r.date, module: "elevage", label: `Reproduction (${r.type}) — ${r.animal}` })),
    ...productionMois.map((p) => ({ date: p.date, module: "elevage", label: `Production ${p.type} — ${p.animal}` })),
    ...mouvementsStockMois.map((m) => ({ date: m.date, module: "stocks", label: `${m.type === "entree" ? "Entrée" : "Sortie"} — ${data.stocks.find((s) => s.id === m.stockId)?.nom || "?"} (${m.quantite})` })),
    ...transactionsMois.map((t) => ({ date: t.date, module: "finances", label: `${t.type === "revenu" ? "Revenu" : "Dépense"} — ${t.categorie || t.description || "?"} (${t.montant})` })),
    ...documentsMois.map((doc) => ({ date: doc.date, module: "documents", label: `${DOC_LABELS[doc.type]} — ${doc.tiers || "?"}` })),
  ].filter((e) => e.date).sort((a, b) => b.date.localeCompare(a.date));

  const totalMouvements = chrono.length;
  const moisLabel = new Date(mois + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {(progressionMensuelle.length > 1 || caParAnnee.length > 0) && (
        <div className="grid lg:grid-cols-2 gap-4">
          {progressionMensuelle.length > 1 && (
            <Card className="p-4">
              <h3 className="font-serif text-base mb-1 flex items-center gap-2"><TrendingUp size={16} className="text-[#8B5E3C]" /> Progression de l'entreprise</h3>
              <p className="text-xs text-[#8B8974] mb-3">Solde cumulé depuis le début, mois par mois</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={progressionMensuelle}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFEAD9" />
                  <XAxis dataKey="mois" tick={{ fontSize: 10, fill: "#6E6B58" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#6E6B58" }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#DFD8C2" }} />
                  <Line type="monotone" dataKey="solde" name="Solde cumulé" stroke="#2F3B2C" strokeWidth={2.5} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {caParAnnee.length > 0 && (
            <Card className="p-4">
              <h3 className="font-serif text-base mb-1">Chiffre d'affaires par année</h3>
              <p className="text-xs text-[#8B8974] mb-3">Revenus et dépenses cumulés par année</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={caParAnnee}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFEAD9" />
                  <XAxis dataKey="annee" tick={{ fontSize: 11, fill: "#6E6B58" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#6E6B58" }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#DFD8C2" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="chiffreAffaires" name="Chiffre d'affaires" fill="#5B7A4A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="depenses" name="Dépenses" fill="#A6402A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {chargesEtMarge.ca > 0 && (
        <Card className="p-4">
          <h3 className="font-serif text-sm mb-3">Marge brute & charges (toute la période)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div>
              <p className="text-xs text-[#8B8974]">Chiffre d'affaires</p>
              <p className="font-serif text-lg">{money(chargesEtMarge.ca, data.ferme.devise)}</p>
            </div>
            <div>
              <p className="text-xs text-[#8B8974]">Charges variables</p>
              <p className="font-serif text-lg text-[#A6402A]">{money(chargesEtMarge.chargesVariables, data.ferme.devise)}</p>
            </div>
            <div className="bg-[var(--color-total-bg)] text-[var(--color-total-text)] rounded-md px-2 py-1.5 -m-1">
              <p className="text-xs opacity-80">Marge brute</p>
              <p className="font-serif font-bold text-lg text-[var(--color-accent)]">{money(chargesEtMarge.margeBrute, data.ferme.devise)}</p>
            </div>
            <div className="bg-[var(--color-total-bg)] text-[var(--color-total-text)] rounded-md px-2 py-1.5 -m-1">
              <p className="text-xs opacity-80">Résultat net</p>
              <p className="font-serif font-bold text-lg text-[var(--color-accent)]">{money(chargesEtMarge.resultatNet, data.ferme.devise)}</p>
            </div>
          </div>
          <div className="text-xs space-y-1 border-t border-[#EFEAD9] pt-3">
            <div className="flex justify-between"><span className="text-[#8B8974]">Charges fixes</span><span>{money(chargesEtMarge.parType.fixe, data.ferme.devise)}</span></div>
            <div className="flex justify-between"><span className="text-[#8B8974]">Charges sociales</span><span>{money(chargesEtMarge.parType.sociale, data.ferme.devise)}</span></div>
            <div className="flex justify-between"><span className="text-[#8B8974]">Salaires</span><span>{money(chargesEtMarge.parType.salariale, data.ferme.devise)}</span></div>
            <div className="flex justify-between"><span className="text-[#8B8974]">Autres charges</span><span>{money(chargesEtMarge.parType.autre, data.ferme.devise)}</span></div>
          </div>
          {(Object.keys(chargesEtMarge.parCategorieCharge.variable).length > 0 || Object.keys(chargesEtMarge.parCategorieCharge.fixe).length > 0) && (
            <div className="grid sm:grid-cols-2 gap-4 border-t border-[#EFEAD9] pt-3 mt-3">
              {Object.keys(chargesEtMarge.parCategorieCharge.variable).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[#5A5744] mb-1">Charges variables par catégorie</p>
                  <div className="text-xs space-y-1">
                    {Object.entries(chargesEtMarge.parCategorieCharge.variable).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
                      <div key={cat} className="flex justify-between"><span className="text-[#8B8974]">{cat}</span><span>{money(val, data.ferme.devise)}</span></div>
                    ))}
                  </div>
                </div>
              )}
              {Object.keys(chargesEtMarge.parCategorieCharge.fixe).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[#5A5744] mb-1">Charges fixes par catégorie</p>
                  <div className="text-xs space-y-1">
                    {Object.entries(chargesEtMarge.parCategorieCharge.fixe).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
                      <div key={cat} className="flex justify-between"><span className="text-[#8B8974]">{cat}</span><span>{money(val, data.ferme.devise)}</span></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-[#8B8974] mt-3">Marge brute = chiffre d'affaires − charges variables. Résultat net = marge brute − charges fixes, sociales, salaires et autres. Charges variables = liées directement à l'exploitation (matière première, semences...). Charges fixes = charges indirectes (carburant, communication, repas, condiment, fournitures, bureautique, petits matériels...). Le type et la catégorie de charge se choisissent lors de la création d'une dépense dans Finances.</p>
        </Card>
      )}

      {chargesEtMarge.ca > 0 && (
        <Card className="p-4">
          <h3 className="font-serif text-sm mb-3">Compte d'exploitation (toute la période)</h3>
          <table className="w-full text-xs">
            <tbody>
              <tr><td className="pt-1 font-medium" colSpan={2}>Produits d'exploitation</td></tr>
              <tr><td className="py-0.5 pl-3 text-[#8B8974]">Chiffre d'affaires (ventes)</td><td className="py-0.5 text-right">{money(chargesEtMarge.ca, data.ferme.devise)}</td></tr>
              <tr className="border-t border-[#DFD8C2]"><td className="py-1 font-medium">Total produits d'exploitation</td><td className="py-1 text-right font-medium">{money(chargesEtMarge.ca, data.ferme.devise)}</td></tr>

              <tr><td className="pt-4 font-medium" colSpan={2}>Charges d'exploitation</td></tr>
              <tr><td className="py-0.5 pl-3 text-[#8B8974]">Charges variables (achats consommés)</td><td className="py-0.5 text-right">{money(chargesEtMarge.parType.variable, data.ferme.devise)}</td></tr>
              <tr><td className="py-0.5 pl-3 text-[#8B8974]">Charges fixes</td><td className="py-0.5 text-right">{money(chargesEtMarge.parType.fixe, data.ferme.devise)}</td></tr>
              {chargesEtMarge.remboursementsPrets > 0 && <tr><td className="py-0.5 pl-6 text-[10px] text-[#8B8974]">dont remboursement de prêts</td><td className="py-0.5 text-right text-[10px]">{money(chargesEtMarge.remboursementsPrets, data.ferme.devise)}</td></tr>}
              {chargesEtMarge.amortissements > 0 && <tr><td className="py-0.5 pl-6 text-[10px] text-[#8B8974]">dont dotations aux amortissements</td><td className="py-0.5 text-right text-[10px]">{money(chargesEtMarge.amortissements, data.ferme.devise)}</td></tr>}
              <tr><td className="py-0.5 pl-3 text-[#8B8974]">Charges sociales</td><td className="py-0.5 text-right">{money(chargesEtMarge.parType.sociale, data.ferme.devise)}</td></tr>
              <tr><td className="py-0.5 pl-3 text-[#8B8974]">Charges de personnel (salaires)</td><td className="py-0.5 text-right">{money(chargesEtMarge.parType.salariale, data.ferme.devise)}</td></tr>
              <tr><td className="py-0.5 pl-3 text-[#8B8974]">Autres charges</td><td className="py-0.5 text-right">{money(chargesEtMarge.parType.autre, data.ferme.devise)}</td></tr>
              <tr className="border-t border-[#DFD8C2]"><td className="py-1 font-medium">Total charges d'exploitation</td><td className="py-1 text-right font-medium">{money(chargesEtMarge.autresCharges + chargesEtMarge.chargesVariables, data.ferme.devise)}</td></tr>

              <tr>
                <td className="pt-3 font-serif font-bold text-sm bg-[var(--color-total-bg)] text-[var(--color-total-text)] rounded-l-md px-2">Résultat d'exploitation</td>
                <td className="pt-3 text-right font-serif font-bold text-sm bg-[var(--color-total-bg)] rounded-r-md px-2 text-[var(--color-accent)]">{money(chargesEtMarge.resultatNet, data.ferme.devise)}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-[#8B8974] mt-3">Résultat d'exploitation = total des produits d'exploitation − total des charges d'exploitation (y compris remboursements de prêts et amortissements, comptabilisés automatiquement).</p>
        </Card>
      )}

      {data.transactions.length > 0 && <GrandLivre data={data} />}

      <div className="border-t border-[#DFD8C2] pt-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-serif text-xl capitalize">Rapport mensuel — {moisLabel}</h2>
        <Input type="month" value={mois} onChange={(e) => setMois(e.target.value)} className="w-auto" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Mouvements du mois" value={totalMouvements} icon={BarChart3} />
        <StatCard label="Revenus" value={money(revenus, data.ferme.devise)} icon={Wallet} tone="good" />
        <StatCard label="Dépenses" value={money(depenses, data.ferme.devise)} icon={Wallet} tone="bad" />
        <StatCard label="Solde du mois" value={money(revenus - depenses, data.ferme.devise)} icon={Wallet} tone={revenus - depenses >= 0 ? "good" : "bad"} />
      </div>

      {totalMouvements === 0 ? (
        <EmptyState icon={BarChart3} text="Aucun mouvement enregistré pour ce mois." />
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-4">
            {parCategorie.length > 0 && (
              <Card className="p-4">
                <h3 className="font-serif text-base mb-3">Revenus vs dépenses par catégorie</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={parCategorie}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFEAD9" />
                    <XAxis dataKey="categorie" tick={{ fontSize: 11, fill: "#6E6B58" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#6E6B58" }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#DFD8C2" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="revenu" name="Revenus" fill="#5B7A4A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="depense" name="Dépenses" fill="#A6402A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {soldeParJour.length > 1 && (
              <Card className="p-4">
                <h3 className="font-serif text-base mb-3">Solde cumulé du mois</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={soldeParJour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFEAD9" />
                    <XAxis dataKey="jour" tick={{ fontSize: 11, fill: "#6E6B58" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#6E6B58" }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#DFD8C2" }} />
                    <Line type="monotone" dataKey="solde" stroke="#C08A2E" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            {parModule.length > 0 && (
              <Card className="p-4">
                <h3 className="font-serif text-base mb-3">Répartition des mouvements par module</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={parModule} dataKey="count" nameKey="module" cx="50%" cy="50%" outerRadius={80} label={({ module, count }) => `${MODULE_LABELS[module]} (${count})`}>
                      {parModule.map((m) => <Cell key={m.module} fill={MODULE_COLORS[m.module]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#DFD8C2" }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}

            {stockParArticle.length > 0 && (
              <Card className="p-4">
                <h3 className="font-serif text-base mb-3">Entrées / sorties de stock</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stockParArticle} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFEAD9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#6E6B58" }} />
                    <YAxis type="category" dataKey="nom" width={100} tick={{ fontSize: 11, fill: "#6E6B58" }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#DFD8C2" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="entree" name="Entrées" fill="#5B7A4A" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="sortie" name="Sorties" fill="#A6402A" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>

          <Card className="p-4">
            <h3 className="font-serif text-base mb-3">Journal du mois ({totalMouvements} mouvements)</h3>
            <div className="max-h-96 overflow-y-auto divide-y divide-[#EFEAD9]">
              {chrono.map((e, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between text-sm gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: MODULE_COLORS[e.module] }} />
                    <span className="truncate">{e.label}</span>
                  </div>
                  <span className="text-xs text-[#8B8974] shrink-0">{fmtDate(e.date)}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
      </div>
    </div>
  );
}

// ============================================================
// PRODUITS (coût de production, coût total, bénéfice par produit)
// ============================================================
function calculProduit(data, produit) {
  const ventes = data.transactions.filter((t) => t.produitId === produit.id && t.type === "revenu");
  const couts = data.transactions.filter((t) => t.produitId === produit.id && t.type === "depense");
  const chiffreAffaires = ventes.reduce((s, t) => s + Number(t.montant || 0), 0);
  const quantiteVendue = ventes.reduce((s, t) => s + Number(t.quantite || 0), 0);
  const coutProduction = quantiteVendue * Number(produit.coutProductionUnitaire || 0);
  const autresCouts = couts.reduce((s, t) => s + Number(t.montant || 0), 0);
  const coutTotal = coutProduction + autresCouts;
  const benefice = chiffreAffaires - coutTotal;
  return { chiffreAffaires, quantiteVendue, coutProduction, autresCouts, coutTotal, benefice };
}

function Produits({ data, update }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const stats = data.produits.map((p) => ({ ...p, ...calculProduit(data, p) }));
  const chartData = stats.map((p) => ({ nom: p.nom, benefice: p.benefice, coutTotal: p.coutTotal, chiffreAffaires: p.chiffreAffaires }));
  const beneficeTotal = stats.reduce((s, p) => s + p.benefice, 0);
  const chiffreAffairesTotal = stats.reduce((s, p) => s + p.chiffreAffaires, 0);
  const produitsAvecVentes = stats.filter((p) => p.chiffreAffaires > 0);
  const produitLePlusRentable = produitsAvecVentes.length > 0
    ? produitsAvecVentes.reduce((best, p) => (p.benefice > best.benefice ? p : best), produitsAvecVentes[0])
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Produits</h2>
        <Button variant="accent" onClick={() => setShowAdd(true)}><Plus size={16} /> Nouveau produit</Button>
      </div>

      {data.produits.length === 0 ? (
        <EmptyState
          icon={Package}
          text="Définissez vos produits (ex. Lait, Maïs, Œufs) avec leur coût de production unitaire, puis liez vos ventes et achats à un produit dans Finances."
          action={<Button variant="ghost" onClick={() => setShowAdd(true)}>Ajouter un produit</Button>}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="Chiffre d'affaires total" value={money(chiffreAffairesTotal, data.ferme.devise)} icon={Wallet} tone="good" />
            <StatCard label="Bénéfice total" value={money(beneficeTotal, data.ferme.devise)} icon={Wallet} tone={beneficeTotal >= 0 ? "good" : "bad"} />
            {produitLePlusRentable && (
              <Card className="p-4">
                <p className="text-xs text-[#8B8974] flex items-center gap-1"><TrendingUp size={12} /> Produit le plus rentable</p>
                <p className="font-serif text-lg mt-1">{produitLePlusRentable.nom}</p>
                <p className="text-xs text-[#3C5A34]">{money(produitLePlusRentable.benefice, data.ferme.devise)} de bénéfice</p>
              </Card>
            )}
          </div>

          {chartData.some((c) => c.chiffreAffaires || c.coutTotal) && (
            <Card className="p-4">
              <h3 className="font-serif text-base mb-3">Chiffre d'affaires, coût total et bénéfice par produit</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFEAD9" />
                  <XAxis dataKey="nom" tick={{ fontSize: 11, fill: "#6E6B58" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#6E6B58" }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#DFD8C2" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="chiffreAffaires" name="Chiffre d'affaires" fill="#5B7A4A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="coutTotal" name="Coût total" fill="#A6402A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="benefice" name="Bénéfice" fill="#C08A2E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            {stats.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-medium">{p.nom}</h3>
                      {produitLePlusRentable && p.id === produitLePlusRentable.id && <Badge tone="good">Le plus rentable</Badge>}
                    </div>
                    <p className="text-xs text-[#8B8974]">Coût de production : {money(p.coutProductionUnitaire, data.ferme.devise)} / {p.unite}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditing(p.id)} className="text-[#8B5E3C] text-xs">Modifier</button>
                    <button onClick={() => { if (confirm("Supprimer ce produit ?")) update((d) => { d.produits = d.produits.filter((x) => x.id !== p.id); }); }} className="text-[#C7C2A8] hover:text-[#A6402A]">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-y-1 text-sm">
                  <dt className="text-[#8B8974]">Chiffre d'affaires</dt>
                  <dd className="text-right font-medium">{money(p.chiffreAffaires, data.ferme.devise)}</dd>
                  <dt className="text-[#8B8974]">Quantité vendue</dt>
                  <dd className="text-right">{p.quantiteVendue.toLocaleString("fr-FR")} {p.unite}</dd>
                  <dt className="text-[#8B8974]">Coût de production</dt>
                  <dd className="text-right">{money(p.coutProduction, data.ferme.devise)}</dd>
                  <dt className="text-[#8B8974]">Autres coûts liés</dt>
                  <dd className="text-right">{money(p.autresCouts, data.ferme.devise)}</dd>
                  <dt className="text-[#8B8974] font-medium">Coût total</dt>
                  <dd className="text-right font-medium">{money(p.coutTotal, data.ferme.devise)}</dd>
                  <dt className={`font-medium ${p.benefice >= 0 ? "text-[#3C5A34]" : "text-[#A6402A]"}`}>Bénéfice</dt>
                  <dd className={`text-right font-medium ${p.benefice >= 0 ? "text-[#3C5A34]" : "text-[#A6402A]"}`}>{money(p.benefice, data.ferme.devise)}</dd>
                </dl>
              </Card>
            ))}
          </div>
        </>
      )}

      {showAdd && (
        <Modal title="Nouveau produit" onClose={() => setShowAdd(false)}>
          <ProduitForm onSubmit={(vals) => { update((d) => d.produits.push({ id: uid(), ...vals })); setShowAdd(false); }} />
        </Modal>
      )}

      {editing && (
        <Modal title="Modifier le produit" onClose={() => setEditing(null)}>
          <ProduitForm
            initial={data.produits.find((p) => p.id === editing)}
            onSubmit={(vals) => {
              update((d) => { const p = d.produits.find((x) => x.id === editing); Object.assign(p, vals); });
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function ProduitForm({ onSubmit, initial }) {
  const [nom, setNom] = useState(initial?.nom || "");
  const [unite, setUnite] = useState(initial?.unite || "kg");
  const [coutProductionUnitaire, setCoutProductionUnitaire] = useState(initial?.coutProductionUnitaire ?? "");
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!nom) return; onSubmit({ nom, unite, coutProductionUnitaire: coutProductionUnitaire || 0 }); }}>
      <Field label="Nom du produit"><Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Lait, Maïs, Œufs" required /></Field>
      <Field label="Unité de vente"><Input value={unite} onChange={(e) => setUnite(e.target.value)} placeholder="Ex. L, kg, douzaine" /></Field>
      <Field label="Coût de production par unité (FCFA)">
        <Input type="number" step="0.01" value={coutProductionUnitaire} onChange={(e) => setCoutProductionUnitaire(e.target.value)} placeholder="Ex. 150" />
      </Field>
      <p className="text-xs text-[#8B8974]">
        Ce coût unitaire (intrants, alimentation, main-d'œuvre estimée...) sera multiplié par la quantité vendue pour calculer le coût de production total. Liez vos ventes à ce produit dans Finances pour que les calculs se fassent automatiquement.
      </p>
      <Button type="submit" variant="accent" className="w-full">{initial ? "Mettre à jour" : "Créer le produit"}</Button>
    </form>
  );
}

// ============================================================
// CIRCUIT PRODUCTION → VENTE → CAISSE
// ============================================================
function genererNumeroBon(data) {
  const annee = today().slice(0, 4);
  const compteur = (data.productions || []).filter((p) => p.numeroBonVersement && p.numeroBonVersement.includes(annee)).length + 1;
  return `BV-${annee}-${String(compteur).padStart(4, "0")}`;
}

function texteBonVersement(p, data) {
  const departement = data.departements.find((d) => d.id === p.departementId);
  const lignes = [
    `Bon de versement ${p.numeroBonVersement}`,
    `${data.ferme.nom}`,
    `Date : ${fmtDate(p.dateVersement)}`,
    "",
    `Produit : ${p.produitNom} ${departement ? `(${departement.nom})` : ""}`,
    `Quantité récoltée : ${p.quantiteRecoltee} ${p.unite}`,
    `Quantité vendue : ${p.quantiteVendue} ${p.unite}${Number(p.perte) > 0 ? ` · Perte : ${p.perte} ${p.unite}` : ""}`,
    `Montant de la vente : ${money(p.montantVente, data.ferme.devise)}`,
    `Montant versé à la caisse : ${money(p.montantVerse, data.ferme.devise)}`,
    "",
    `Agent de terrain : ${p.agentTerrainNom || "—"}`,
    `Agent de vente : ${p.agentVenteNom || "—"}`,
    `Approuvé par (caisse) : ${p.caissierNom || "—"}`,
  ];
  if (p.signataire) lignes.push("", `Signé par ${p.signataire} le ${fmtDate(p.dateSignature)}`);
  return lignes.filter(Boolean).join("\n");
}

const STATUT_PRODUCTION_LABELS = {
  recolte: "Récolte enregistrée",
  vente_enregistree: "Vente enregistrée — en attente de caisse",
  verse_approuve: "Versement approuvé",
};

function ProductionCircuit({ data, update }) {
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [showSignature, setShowSignature] = useState(false);
  const [shareError, setShareError] = useState("");

  const filtered = filtreStatut === "tous" ? data.productions : data.productions.filter((p) => p.statut === filtreStatut);
  const p = data.productions.find((x) => x.id === selected);
  const employesActifs = data.employes.filter((e) => e.statut === "actif");

  const partagerBon = async (prod) => {
    setShareError("");
    try {
      await partagerDocument({
        titre: `Bon de versement ${prod.numeroBonVersement}`,
        sujet: `Bon de versement ${prod.numeroBonVersement} — ${data.ferme.nom}`,
        texte: texteBonVersement(prod, data),
        signatureDataUrl: prod.signature || null,
        nomFichierImage: `signature-${prod.numeroBonVersement}.png`,
      });
    } catch (err) {
      setShareError("Le partage a échoué. Réessayez.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-serif text-xl">Circuit production → vente → caisse</h2>
        <Button variant="accent" onClick={() => setShowAdd(true)}><Plus size={16} /> Nouvelle récolte</Button>
      </div>
      <p className="text-xs text-[#8B8974]">L'agent de terrain enregistre la récolte, l'agent de vente enregistre la vente et déclare le versement, puis la caisse approuve et délivre un bon de versement. Le revenu n'est comptabilisé dans les finances qu'une fois le versement approuvé par la caisse.</p>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {["tous", "recolte", "vente_enregistree", "verse_approuve"].map((f) => (
          <button
            key={f}
            onClick={() => setFiltreStatut(f)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border ${filtreStatut === f ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-white text-[#5A5744] border-[#DFD8C2]"}`}
          >
            {f === "tous" ? "Tous" : STATUT_PRODUCTION_LABELS[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} text="Aucune récolte enregistrée." action={<Button variant="ghost" onClick={() => setShowAdd(true)}>Enregistrer une récolte</Button>} />
      ) : (
        <Card className="divide-y divide-[#EFEAD9]">
          {[...filtered].reverse().map((prod) => {
            const departement = data.departements.find((d) => d.id === prod.departementId);
            return (
              <div key={prod.id} className="p-3 flex items-center justify-between text-sm gap-3 cursor-pointer hover:bg-[#FBF9F2]" onClick={() => setSelected(prod.id)}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone={prod.statut === "verse_approuve" ? "good" : prod.statut === "vente_enregistree" ? "warn" : "default"}>{STATUT_PRODUCTION_LABELS[prod.statut]}</Badge>
                    {departement && <span className="text-xs text-[#8B8974]">{departement.nom}</span>}
                  </div>
                  <p className="font-medium mt-0.5">{prod.produitNom}</p>
                  <p className="text-xs text-[#8B8974]">Récolté le {fmtDate(prod.date)} · {prod.quantiteRecoltee} {prod.unite}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {prod.montantVerse != null && <span className="font-medium">{money(prod.montantVerse, data.ferme.devise)}</span>}
                  <ChevronRight size={16} className="text-[#C7C2A8]" />
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {showAdd && (
        <Modal title="Nouvelle récolte" onClose={() => setShowAdd(false)}>
          <RecolteForm
            produits={data.produits}
            departements={data.departements}
            employes={employesActifs}
            onSubmit={(vals) => {
              update((d) => d.productions.push({ id: uid(), ...vals, statut: "recolte" }));
              setShowAdd(false);
            }}
          />
        </Modal>
      )}

      {p && p.statut === "recolte" && (
        <Modal title={p.produitNom} onClose={() => setSelected(null)}>
          <div className="space-y-3 text-sm">
            <Badge tone="default">{STATUT_PRODUCTION_LABELS[p.statut]}</Badge>
            <div className="flex justify-between"><span className="text-[#8B8974]">Récolté le</span><span>{fmtDate(p.date)}</span></div>
            <div className="flex justify-between"><span className="text-[#8B8974]">Quantité récoltée</span><span>{p.quantiteRecoltee} {p.unite}</span></div>
            <div className="flex justify-between"><span className="text-[#8B8974]">Agent de terrain</span><span>{p.agentTerrainNom || "—"}</span></div>
            {p.noteRecolte && <p className="text-xs text-[#8B8974] border-t border-[#EFEAD9] pt-2">{p.noteRecolte}</p>}
            <div className="border-t border-[#EFEAD9] pt-3">
              <p className="text-xs font-medium text-[#5A5744] mb-2">Étape suivante : l'agent de vente enregistre la vente</p>
              <VenteForm
                produit={p}
                devise={data.ferme.devise}
                employes={employesActifs}
                onSubmit={(vals) => {
                  update((d) => {
                    const target = d.productions.find((x) => x.id === p.id);
                    Object.assign(target, vals, { statut: "vente_enregistree" });
                  });
                  setSelected(null);
                }}
              />
            </div>
          </div>
        </Modal>
      )}

      {p && p.statut === "vente_enregistree" && (
        <Modal title={p.produitNom} onClose={() => setSelected(null)}>
          <div className="space-y-3 text-sm">
            <Badge tone="warn">{STATUT_PRODUCTION_LABELS[p.statut]}</Badge>
            <div className="flex justify-between"><span className="text-[#8B8974]">Quantité vendue</span><span>{p.quantiteVendue} {p.unite}</span></div>
            {Number(p.perte) > 0 && <div className="flex justify-between"><span className="text-[#8B8974]">Perte déclarée</span><span className="text-[#A6402A]">{p.perte} {p.unite}</span></div>}
            <div className="flex justify-between font-medium"><span>Montant de la vente</span><span>{money(p.montantVente, data.ferme.devise)}</span></div>
            <div className="flex justify-between"><span className="text-[#8B8974]">Agent de vente</span><span>{p.agentVenteNom || "—"}</span></div>
            {p.noteVente && <p className="text-xs text-[#8B8974]">{p.noteVente}</p>}
            <div className="border-t border-[#EFEAD9] pt-3">
              <p className="text-xs font-medium text-[#5A5744] mb-2">Étape suivante : la caisse approuve le versement</p>
              <CaisseForm
                production={p}
                comptes={data.comptes}
                devise={data.ferme.devise}
                employes={employesActifs}
                onSubmit={(vals) => {
                  const numeroBonVersement = genererNumeroBon(data);
                  update((d) => {
                    const target = d.productions.find((x) => x.id === p.id);
                    Object.assign(target, vals, { statut: "verse_approuve", numeroBonVersement });
                    const produitLie = d.produits.find((pr) => pr.nom === p.produitNom);
                    d.transactions.push({
                      id: uid(), type: "revenu", categorie: `Vente ${p.produitNom}`, montant: vals.montantVerse,
                      date: vals.dateVersement, description: `${p.produitNom} — Bon ${numeroBonVersement}`,
                      compteId: vals.compteId || null, produitId: produitLie ? produitLie.id : null, quantite: p.quantiteVendue,
                    });
                  });
                  setSelected(null);
                }}
              />
            </div>
          </div>
        </Modal>
      )}

      {p && p.statut === "verse_approuve" && (
        <Modal title={`Bon de versement ${p.numeroBonVersement}`} onClose={() => setSelected(null)}>
          <div className="space-y-3 text-sm">
            <Badge tone="good">{STATUT_PRODUCTION_LABELS[p.statut]}</Badge>
            <div className="flex justify-between"><span className="text-[#8B8974]">Produit</span><span className="font-medium">{p.produitNom}</span></div>
            <div className="flex justify-between"><span className="text-[#8B8974]">Quantité récoltée / vendue</span><span>{p.quantiteRecoltee} / {p.quantiteVendue} {p.unite}</span></div>
            {Number(p.perte) > 0 && <div className="flex justify-between"><span className="text-[#8B8974]">Perte</span><span>{p.perte} {p.unite}</span></div>}
            <div className="flex justify-between"><span className="text-[#8B8974]">Montant de la vente</span><span>{money(p.montantVente, data.ferme.devise)}</span></div>
            <div className="bg-[var(--color-total-bg)] text-[var(--color-total-text)] rounded-md px-3 py-2 flex justify-between font-serif font-bold">
              <span>Montant versé à la caisse</span>
              <span className="text-[var(--color-accent)]">{money(p.montantVerse, data.ferme.devise)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#8B8974] border-t border-[#EFEAD9] pt-2">
              <span>Agent de terrain : {p.agentTerrainNom || "—"}</span>
              <span>Agent de vente : {p.agentVenteNom || "—"}</span>
              <span>Approuvé par : {p.caissierNom || "—"}</span>
              <span>Date : {fmtDate(p.dateVersement)}</span>
            </div>

            <div className="border-t border-[#EFEAD9] pt-3">
              <p className="text-xs font-medium text-[#5A5744] mb-1">Signature</p>
              {p.signature ? (
                <div>
                  <img src={p.signature} alt="Signature" className="h-16 border border-[#DFD8C2] rounded-md bg-white" />
                  <p className="text-xs text-[#8B8974] mt-1">Signé par {p.signataire} le {fmtDate(p.dateSignature)}</p>
                </div>
              ) : (
                <p className="text-xs text-[#8B8974]">Aucune signature.</p>
              )}
              <Button variant="ghost" className="mt-2" onClick={() => setShowSignature(true)}><PenTool size={14} /> {p.signature ? "Re-signer" : "Signer le bon"}</Button>
            </div>

            {shareError && <p className="text-xs text-[#A6402A]">{shareError}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="accent" className="flex-1" onClick={() => partagerBon(p)}><Send size={14} /> Partager par email</Button>
              <Button variant="danger" onClick={() => { if (confirm("Supprimer cet enregistrement ?")) { update((d) => { d.productions = d.productions.filter((x) => x.id !== p.id); }); setSelected(null); } }}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showSignature && p && (
        <Modal title="Signer le bon de versement" onClose={() => setShowSignature(false)}>
          <SignaturePad
            initialNom={p.signataire || p.caissierNom || ""}
            onSave={(signature, signataire) => {
              update((d) => {
                const target = d.productions.find((x) => x.id === p.id);
                target.signature = signature;
                target.signataire = signataire;
                target.dateSignature = today();
              });
              setShowSignature(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function RecolteForm({ onSubmit, produits = [], departements = [], employes = [] }) {
  const [produitNom, setProduitNom] = useState("");
  const [unite, setUnite] = useState("");
  const [departementId, setDepartementId] = useState("");
  const [quantiteRecoltee, setQuantiteRecoltee] = useState("");
  const [date, setDate] = useState(today());
  const [agentTerrainId, setAgentTerrainId] = useState("");
  const [noteRecolte, setNoteRecolte] = useState("");

  const choisirProduit = (nom) => {
    setProduitNom(nom);
    const p = produits.find((x) => x.nom === nom);
    if (p && !unite) setUnite(p.unite);
  };

  return (
    <form className="space-y-3" onSubmit={(e) => {
      e.preventDefault(); if (!produitNom || !quantiteRecoltee) return;
      const agent = employes.find((x) => x.id === agentTerrainId);
      onSubmit({ produitNom, unite, departementId: departementId || null, quantiteRecoltee, date, agentTerrainId: agentTerrainId || null, agentTerrainNom: agent ? agent.nom : "", noteRecolte });
    }}>
      <Field label="Produit récolté">
        <Input list="produits-recolte" value={produitNom} onChange={(e) => choisirProduit(e.target.value)} placeholder="Ex. Maïs, Lait, Œufs..." required />
        <datalist id="produits-recolte">
          {produits.map((p) => <option key={p.id} value={p.nom} />)}
        </datalist>
      </Field>
      <Field label="Unité"><Input value={unite} onChange={(e) => setUnite(e.target.value)} placeholder="kg, L, douzaine..." /></Field>
      <Field label="Quantité récoltée"><Input type="number" step="0.01" value={quantiteRecoltee} onChange={(e) => setQuantiteRecoltee(e.target.value)} required /></Field>
      {departements.length > 0 && (
        <Field label="Département">
          <Select value={departementId} onChange={(e) => setDepartementId(e.target.value)}>
            <option value="">Non précisé</option>
            {departements.filter((d) => d.actif !== false).map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
          </Select>
        </Field>
      )}
      <Field label="Date de récolte"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Agent de terrain">
        <Select value={agentTerrainId} onChange={(e) => setAgentTerrainId(e.target.value)}>
          <option value="">Non précisé</option>
          {employes.map((emp) => <option key={emp.id} value={emp.id}>{emp.nom}</option>)}
        </Select>
      </Field>
      <Field label="Notes (optionnel)"><TextArea value={noteRecolte} onChange={(e) => setNoteRecolte(e.target.value)} /></Field>
      <Button type="submit" variant="accent" className="w-full">Enregistrer la récolte</Button>
    </form>
  );
}

function VenteForm({ onSubmit, produit, devise = "FCFA", employes = [] }) {
  const [quantiteVendue, setQuantiteVendue] = useState(produit.quantiteRecoltee || "");
  const [perte, setPerte] = useState(0);
  const [prixUnitaire, setPrixUnitaire] = useState("");
  const [agentVenteId, setAgentVenteId] = useState("");
  const [dateVente, setDateVente] = useState(today());
  const [noteVente, setNoteVente] = useState("");

  const montantVente = Number(quantiteVendue || 0) * Number(prixUnitaire || 0);

  return (
    <form className="space-y-3" onSubmit={(e) => {
      e.preventDefault(); if (!quantiteVendue || !prixUnitaire) return;
      const agent = employes.find((x) => x.id === agentVenteId);
      onSubmit({ quantiteVendue, perte: perte || 0, prixUnitaire, montantVente, agentVenteId: agentVenteId || null, agentVenteNom: agent ? agent.nom : "", dateVente, noteVente });
    }}>
      <Field label={`Quantité vendue (${produit.unite})`}><Input type="number" step="0.01" value={quantiteVendue} onChange={(e) => setQuantiteVendue(e.target.value)} required /></Field>
      <Field label={`Perte éventuelle (${produit.unite})`}><Input type="number" step="0.01" value={perte} onChange={(e) => setPerte(e.target.value)} /></Field>
      <Field label={`Prix unitaire (${devise})`}><Input type="number" step="0.01" value={prixUnitaire} onChange={(e) => setPrixUnitaire(e.target.value)} required /></Field>
      <p className="text-xs text-[#8B8974]">Montant de la vente : <span className="font-medium text-[#232620]">{money(montantVente, devise)}</span></p>
      <Field label="Agent de vente">
        <Select value={agentVenteId} onChange={(e) => setAgentVenteId(e.target.value)}>
          <option value="">Non précisé</option>
          {employes.map((emp) => <option key={emp.id} value={emp.id}>{emp.nom}</option>)}
        </Select>
      </Field>
      <Field label="Date de vente"><Input type="date" value={dateVente} onChange={(e) => setDateVente(e.target.value)} /></Field>
      <Field label="Notes (optionnel)"><TextArea value={noteVente} onChange={(e) => setNoteVente(e.target.value)} /></Field>
      <Button type="submit" variant="accent" className="w-full">Enregistrer la vente et déclarer le versement</Button>
    </form>
  );
}

function CaisseForm({ onSubmit, production, comptes = [], devise = "FCFA", employes = [] }) {
  const [montantVerse, setMontantVerse] = useState(production.montantVente || "");
  const [compteId, setCompteId] = useState("");
  const [caissierId, setCaissierId] = useState("");
  const [dateVersement, setDateVersement] = useState(today());

  return (
    <form className="space-y-3" onSubmit={(e) => {
      e.preventDefault(); if (!montantVerse) return;
      const caissier = employes.find((x) => x.id === caissierId);
      onSubmit({ montantVerse, compteId: compteId || null, caissierId: caissierId || null, caissierNom: caissier ? caissier.nom : "", dateVersement });
    }}>
      <Field label={`Montant versé (${devise})`}><Input type="number" step="0.01" value={montantVerse} onChange={(e) => setMontantVerse(e.target.value)} required /></Field>
      <Field label="Compte de destination">
        <Select value={compteId} onChange={(e) => setCompteId(e.target.value)}>
          <option value="">Espèces (non rattaché)</option>
          {comptes.map((c) => <option key={c.id} value={c.id}>{COMPTE_LABELS[c.type]} — {c.nom}</option>)}
        </Select>
      </Field>
      <Field label="Approuvé par (caisse)">
        <Select value={caissierId} onChange={(e) => setCaissierId(e.target.value)}>
          <option value="">Non précisé</option>
          {employes.map((emp) => <option key={emp.id} value={emp.id}>{emp.nom}</option>)}
        </Select>
      </Field>
      <Field label="Date de versement"><Input type="date" value={dateVersement} onChange={(e) => setDateVersement(e.target.value)} /></Field>
      <Button type="submit" variant="accent" className="w-full">Approuver et générer le bon de versement</Button>
    </form>
  );
}

// ============================================================
// PERSONNEL (liste, contrats, salaires, congés)
// ============================================================
function Personnel({ data, update }) {
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showPointage, setShowPointage] = useState(false);
  const [datePointage, setDatePointage] = useState(today());
  const [filtreDepartement, setFiltreDepartement] = useState("tous");
  const employe = data.employes.find((e) => e.id === selected);

  if (employe) return <EmployeDetail employe={employe} data={data} update={update} onBack={() => setSelected(null)} />;

  const masseSalarialeMensuelle = data.employes
    .filter((e) => e.statut === "actif")
    .reduce((s, e) => s + Number(e.salaireMensuel || 0), 0);

  const employesFiltres = filtreDepartement === "tous" ? data.employes : data.employes.filter((e) => e.departementId === filtreDepartement);

  const employesActifs = data.employes.filter((e) => e.statut === "actif");
  const pointageDuJour = (nom) => today() === datePointage
    ? `Pointage du jour (${fmtDate(datePointage)})`
    : `Pointage du ${fmtDate(datePointage)}`;

  const statutDuJour = (e) => (e.presences || []).find((p) => p.date === datePointage)?.statut || null;

  const setPresence = (empId, statut) => {
    update((d) => {
      const e = d.employes.find((x) => x.id === empId);
      e.presences = e.presences || [];
      const existant = e.presences.find((p) => p.date === datePointage);
      if (existant) existant.statut = statut;
      else e.presences.push({ id: uid(), date: datePointage, statut });
    });
  };

  const presentsCount = employesActifs.filter((e) => statutDuJour(e) === "present").length;
  const absentsCount = employesActifs.filter((e) => statutDuJour(e) === "absent").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Personnel</h2>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setShowPointage((v) => !v)}><ListChecks size={16} /> Pointage</Button>
          <Button variant="accent" onClick={() => setShowAdd(true)}><Plus size={16} /> Nouvel employé</Button>
        </div>
      </div>

      {data.employes.length > 0 && (
        <Card className="p-4">
          <p className="text-xs text-[#8B8974]">Masse salariale mensuelle (employés actifs)</p>
          <p className="font-serif text-2xl">{money(masseSalarialeMensuelle, data.ferme.devise)}</p>
        </Card>
      )}

      {showPointage && employesActifs.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <h3 className="font-serif text-base">{pointageDuJour()}</h3>
            <Input type="date" value={datePointage} onChange={(e) => setDatePointage(e.target.value)} className="w-auto" />
          </div>
          <p className="text-xs text-[#8B8974] mb-3">{presentsCount} présent(s) · {absentsCount} absent(s) sur {employesActifs.length} employé(s) actif(s)</p>
          <div className="divide-y divide-[#EFEAD9]">
            {employesActifs.map((e) => {
              const statut = statutDuJour(e);
              return (
                <div key={e.id} className="py-2 flex items-center justify-between gap-2">
                  <span className="text-sm">{e.nom}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setPresence(e.id, "present")}
                      className={`px-2.5 py-1 rounded-md text-xs border ${statut === "present" ? "bg-[#EAF0E6] text-[#3C5A34] border-[#C9DBC0]" : "bg-white text-[#8B8974] border-[#DFD8C2]"}`}
                    >Présent</button>
                    <button
                      onClick={() => setPresence(e.id, "absent")}
                      className={`px-2.5 py-1 rounded-md text-xs border ${statut === "absent" ? "bg-[#F5DFDA] text-[#A6402A] border-[#E9BCB0]" : "bg-white text-[#8B8974] border-[#DFD8C2]"}`}
                    >Absent</button>
                    <button
                      onClick={() => setPresence(e.id, "retard")}
                      className={`px-2.5 py-1 rounded-md text-xs border ${statut === "retard" ? "bg-[#F7E9D2] text-[#8B5E14] border-[#EAD3A0]" : "bg-white text-[#8B8974] border-[#DFD8C2]"}`}
                    >Retard</button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {data.departements.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFiltreDepartement("tous")}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border ${filtreDepartement === "tous" ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-white text-[#5A5744] border-[#DFD8C2]"}`}
          >Tous</button>
          {data.departements.filter((d) => d.actif !== false).map((d) => (
            <button
              key={d.id}
              onClick={() => setFiltreDepartement(d.id)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border ${filtreDepartement === d.id ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-white text-[#5A5744] border-[#DFD8C2]"}`}
            >{d.nom}</button>
          ))}
        </div>
      )}

      {data.employes.length === 0 ? (
        <EmptyState icon={Users} text="Aucun employé enregistré." action={<Button variant="ghost" onClick={() => setShowAdd(true)}>Ajouter un employé</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {employesFiltres.map((e) => {
            const congesEnCours = (e.conges || []).filter((c) => c.statut === "en_cours" || (c.dateDebut <= today() && c.dateFin >= today()));
            const departement = data.departements.find((d) => d.id === e.departementId);
            return (
              <Card key={e.id} className="p-4 cursor-pointer hover:border-[var(--color-accent)]" onClick={() => setSelected(e.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCircle size={20} className="text-[#8B5E3C]" />
                    <div>
                      <h3 className="font-medium">{e.nom}</h3>
                      <p className="text-xs text-[#8B8974]">{e.poste || "Poste non précisé"}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#C7C2A8]" />
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge tone="accent">{CONTRAT_LABELS[e.typeContrat] || e.typeContrat}</Badge>
                  {e.niveauHierarchique && <Badge tone="default">{e.niveauHierarchique}</Badge>}
                  {departement && <Badge tone="default">{departement.nom}</Badge>}
                  <Badge tone={e.statut === "actif" ? "good" : "default"}>{e.statut === "actif" ? "Actif" : "Inactif"}</Badge>
                  {congesEnCours.length > 0 && <Badge tone="warn">En congé</Badge>}
                </div>
                <p className="text-sm mt-2">{money(e.salaireMensuel, data.ferme.devise)} / mois</p>
              </Card>
            );
          })}
        </div>
      )}

      {showAdd && (
        <Modal title="Nouvel employé" onClose={() => setShowAdd(false)}>
          <EmployeForm
            departements={data.departements}
            sectionsProduction={data.sectionsProduction}
            onSubmit={(vals) => {
              update((d) => d.employes.push({ id: uid(), ...vals, conges: [], presences: [], evaluations: [], documentsPerso: [], bulletins: [] }));
              setShowAdd(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function EmployeForm({ onSubmit, initial, departements = [], sectionsProduction = [] }) {
  const [nom, setNom] = useState(initial?.nom || "");
  const [poste, setPoste] = useState(initial?.poste || "");
  const [niveauHierarchique, setNiveauHierarchique] = useState(initial?.niveauHierarchique || HIERARCHIE_POSTES[0]);
  const [sectionProduction, setSectionProduction] = useState(initial?.sectionProduction || "");
  const [competence, setCompetence] = useState(initial?.competence || "");
  const [departementId, setDepartementId] = useState(initial?.departementId || "");
  const [typeContrat, setTypeContrat] = useState(initial?.typeContrat || "cdi");
  const [salaireMensuel, setSalaireMensuel] = useState(initial?.salaireMensuel ?? "");
  const [dateDebut, setDateDebut] = useState(initial?.dateDebut || today());
  const [dateFin, setDateFin] = useState(initial?.dateFin || "");
  const [statut, setStatut] = useState(initial?.statut || "actif");
  const [telephone, setTelephone] = useState(initial?.telephone || "");
  const [situationFamiliale, setSituationFamiliale] = useState(initial?.situationFamiliale || "celibataire");
  const [nombreEnfants, setNombreEnfants] = useState(initial?.nombreEnfants ?? 0);
  return (
    <form className="space-y-3" onSubmit={(e) => {
      e.preventDefault(); if (!nom) return;
      onSubmit({
        nom, poste, niveauHierarchique, sectionProduction, competence, departementId: departementId || null,
        typeContrat, salaireMensuel: salaireMensuel || 0, dateDebut, dateFin: dateFin || null, statut, telephone,
        situationFamiliale, nombreEnfants: nombreEnfants || 0,
      });
    }}>
      <Field label="Nom complet"><Input value={nom} onChange={(e) => setNom(e.target.value)} required /></Field>
      <Field label="Intitulé du poste"><Input value={poste} onChange={(e) => setPoste(e.target.value)} placeholder="Ex. Ouvrier agricole, Vacher..." /></Field>
      <Field label="Niveau hiérarchique">
        <Select value={niveauHierarchique} onChange={(e) => setNiveauHierarchique(e.target.value)}>
          {HIERARCHIE_POSTES.map((p) => <option key={p} value={p}>{p}</option>)}
        </Select>
      </Field>
      {niveauHierarchique === "Technicien de production" && (
        <Field label="Unité / section de production">
          <Input list="sections-production" value={sectionProduction} onChange={(e) => setSectionProduction(e.target.value)} placeholder="Ex. Maraîchage, Pisciculture..." />
          <datalist id="sections-production">
            {sectionsProduction.filter((s) => s.actif !== false).map((s) => <option key={s.id} value={s.nom} />)}
          </datalist>
        </Field>
      )}
      <Field label="Type de compétence">
        <Input list="competences-liste" value={competence} onChange={(e) => setCompetence(e.target.value)} placeholder="Ex. Agronome, Comptable, Chauffeur..." />
        <datalist id="competences-liste">
          {COMPETENCES_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
        </datalist>
      </Field>
      {departements.length > 0 && (
        <Field label="Département">
          <Select value={departementId} onChange={(e) => setDepartementId(e.target.value)}>
            <option value="">Non précisé</option>
            {departements.filter((d) => d.actif !== false).map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
          </Select>
        </Field>
      )}
      <Field label="Téléphone"><Input value={telephone} onChange={(e) => setTelephone(e.target.value)} /></Field>
      <Field label="Type de contrat">
        <Select value={typeContrat} onChange={(e) => setTypeContrat(e.target.value)}>
          <option value="cdi">CDI</option>
          <option value="cdd">CDD</option>
          <option value="stage">Stage</option>
          <option value="essai">Période d'essai</option>
          <option value="prestation">Prestation</option>
        </Select>
      </Field>
      <Field label="Salaire mensuel"><Input type="number" step="0.01" value={salaireMensuel} onChange={(e) => setSalaireMensuel(e.target.value)} /></Field>
      <Field label="Date de début"><Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} /></Field>
      {(typeContrat === "cdd" || typeContrat === "stage" || typeContrat === "essai" || typeContrat === "prestation") && (
        <Field label="Date de fin"><Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} /></Field>
      )}
      <Field label="Statut">
        <Select value={statut} onChange={(e) => setStatut(e.target.value)}>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Situation familiale">
          <Select value={situationFamiliale} onChange={(e) => setSituationFamiliale(e.target.value)}>
            <option value="celibataire">Célibataire</option>
            <option value="marie">Marié(e)</option>
          </Select>
        </Field>
        <Field label="Enfants à charge"><Input type="number" min="0" step="1" value={nombreEnfants} onChange={(e) => setNombreEnfants(e.target.value)} /></Field>
      </div>
      <p className="text-xs text-[#8B8974]">Situation familiale et enfants à charge servent au calcul de la réduction ITS sur le bulletin de paie.</p>
      <Button type="submit" variant="accent" className="w-full">{initial ? "Mettre à jour" : "Ajouter l'employé"}</Button>
    </form>
  );
}

function calculAnciennete(dateDebut, dateFin) {
  if (!dateDebut) return "";
  const debut = new Date(dateDebut);
  const fin = dateFin ? new Date(dateFin) : new Date();
  let mois = (fin.getFullYear() - debut.getFullYear()) * 12 + (fin.getMonth() - debut.getMonth());
  if (fin.getDate() < debut.getDate()) mois -= 1;
  mois = Math.max(mois, 0);
  const annees = Math.floor(mois / 12);
  const moisRestants = mois % 12;
  if (annees === 0) return `${moisRestants} mois`;
  if (moisRestants === 0) return `${annees} an${annees > 1 ? "s" : ""}`;
  return `${annees} an${annees > 1 ? "s" : ""} et ${moisRestants} mois`;
}

function EmployeDetail({ employe, data, update, onBack }) {
  const [showEdit, setShowEdit] = useState(false);
  const [showConge, setShowConge] = useState(false);
  const [showPaie, setShowPaie] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [showBulletin, setShowBulletin] = useState(false);
  const [selectedBulletin, setSelectedBulletin] = useState(null);
  const moisCourant = today().slice(0, 7);
  const inMonth = (d) => d && d.slice(0, 7) === moisCourant;

  const paiements = data.transactions.filter((t) => t.employeId === employe.id && t.typeCharge === "salariale").sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-[#8B5E3C] flex items-center gap-1">← Retour au personnel</button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl">{employe.nom}</h2>
          <p className="text-xs text-[#8B8974]">{employe.poste || "Poste non précisé"} {employe.telephone && `· ${employe.telephone}`}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge tone="accent">{CONTRAT_LABELS[employe.typeContrat]}</Badge>
            {employe.niveauHierarchique && <Badge tone="default">{employe.niveauHierarchique}</Badge>}
            {employe.sectionProduction && <Badge tone="default">{employe.sectionProduction}</Badge>}
            {employe.competence && <Badge tone="default">{employe.competence}</Badge>}
            {data.departements.find((d) => d.id === employe.departementId) && <Badge tone="default">{data.departements.find((d) => d.id === employe.departementId).nom}</Badge>}
            <Badge tone={employe.statut === "actif" ? "good" : "default"}>{employe.statut === "actif" ? "Actif" : "Inactif"}</Badge>
          </div>
          <p className="text-xs text-[#8B8974] mt-1">
            Depuis {fmtDate(employe.dateDebut)}{employe.dateFin ? ` — jusqu'au ${fmtDate(employe.dateFin)}` : ""} · Ancienneté : {calculAnciennete(employe.dateDebut, employe.dateFin)}
          </p>
        </div>
        <button onClick={() => setShowEdit(true)} className="text-[#8B5E3C] text-xs">Modifier</button>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#8B8974]">Salaire mensuel</p>
            <p className="font-serif text-xl">{money(employe.salaireMensuel, data.ferme.devise)}</p>
          </div>
          <Button variant="accent" onClick={() => setShowPaie(true)}>Enregistrer un paiement</Button>
        </div>
        {paiements.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm border-t border-[#EFEAD9] pt-2">
            {paiements.slice(0, 6).map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>{p.description || "Salaire"}</span>
                <span className="text-[#8B8974]">{money(p.montant, data.ferme.devise)} · {fmtDate(p.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-sm">Bulletin de paie</h3>
          <Button variant="accent" onClick={() => setShowBulletin(true)}>Générer un bulletin</Button>
        </div>
        <p className="text-xs text-[#8B8974] mt-1">Calcul complet selon le barème malien (ITS, INPS, AMO) — enregistre automatiquement le salaire net en charge salariale et les charges patronales en charge fixe du mois.</p>
        {(!employe.bulletins || employe.bulletins.length === 0) ? (
          <p className="text-sm text-[#8B8974] mt-2">Aucun bulletin généré.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {[...employe.bulletins].reverse().map((b) => (
              <li key={b.id} className="flex justify-between items-center border-b border-[#EFEAD9] pb-1.5">
                <button onClick={() => setSelectedBulletin(b)} className="text-left text-[#8B5E3C]">{b.mois}</button>
                <span className="text-[#8B8974]">Net : {money(b.net, data.ferme.devise)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <SectionTitle icon={CalendarOff} title="Congés" onClick={() => setShowConge(true)} />
        {(!employe.conges || employe.conges.length === 0) ? (
          <p className="text-sm text-[#8B8974] mt-2">Aucun congé enregistré.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {[...employe.conges].reverse().map((c) => (
              <li key={c.id} className="flex justify-between border-b border-[#EFEAD9] pb-1">
                <span>{{ paye: "Congé payé", maladie: "Congé maladie", sans_solde: "Sans solde" }[c.type] || c.type}</span>
                <span className="text-[#8B8974]">{fmtDate(c.dateDebut)} → {fmtDate(c.dateFin)}</span>
              </li>
            ))}
          </ul>
        )}
        <Button variant="ghost" className="mt-3" onClick={() => setShowConge(true)}><Plus size={14} /> Ajouter un congé</Button>
      </Card>

      <Card className="p-4">
        <h3 className="font-serif text-base mb-2 flex items-center gap-2"><ListChecks size={16} className="text-[#8B5E3C]" /> Présence & absence</h3>
        {(!employe.presences || employe.presences.length === 0) ? (
          <p className="text-sm text-[#8B8974]">Aucun pointage enregistré. Utilisez le bouton « Pointage » dans la liste du personnel pour marquer les présences au jour le jour.</p>
        ) : (
          (() => {
            const presencesMois = employe.presences.filter((p) => inMonth(p.date));
            const presents = presencesMois.filter((p) => p.statut === "present").length;
            const absents = presencesMois.filter((p) => p.statut === "absent").length;
            const retards = presencesMois.filter((p) => p.statut === "retard").length;
            return (
              <>
                <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
                  <div className="bg-[#EAF0E6] rounded-md py-2"><p className="font-serif text-lg text-[#3C5A34]">{presents}</p><p className="text-xs text-[#8B8974]">Présent (mois)</p></div>
                  <div className="bg-[#F5DFDA] rounded-md py-2"><p className="font-serif text-lg text-[#A6402A]">{absents}</p><p className="text-xs text-[#8B8974]">Absent (mois)</p></div>
                  <div className="bg-[#F7E9D2] rounded-md py-2"><p className="font-serif text-lg text-[#8B5E14]">{retards}</p><p className="text-xs text-[#8B8974]">Retard (mois)</p></div>
                </div>
                <ul className="space-y-1 text-sm max-h-56 overflow-y-auto">
                  {[...employe.presences].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30).map((p) => (
                    <li key={p.id} className="flex justify-between border-b border-[#EFEAD9] pb-1">
                      <span>{fmtDate(p.date)}</span>
                      <Badge tone={p.statut === "present" ? "good" : p.statut === "absent" ? "bad" : "warn"}>
                        {{ present: "Présent", absent: "Absent", retard: "Retard" }[p.statut] || p.statut}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </>
            );
          })()
        )}
      </Card>

      <Card className="p-4">
        <SectionTitle icon={TrendingUp} title="Évaluations" onClick={() => setShowEvaluation(true)} />
        {(!employe.evaluations || employe.evaluations.length === 0) ? (
          <p className="text-sm text-[#8B8974] mt-2">Aucune évaluation enregistrée.</p>
        ) : (
          <>
            <p className="text-xs text-[#8B8974] mt-2">
              Note moyenne : <span className="font-medium text-[#232620]">{(employe.evaluations.reduce((s, e) => s + Number(e.note || 0), 0) / employe.evaluations.length).toFixed(1)} / 5</span>
            </p>
            <ul className="mt-2 space-y-2 text-sm">
              {[...employe.evaluations].reverse().map((ev) => (
                <li key={ev.id} className="border-b border-[#EFEAD9] pb-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{ev.service || "Service non précisé"}</span>
                    <span className="text-[#8B5E14]">{"★".repeat(Number(ev.note || 0))}{"☆".repeat(5 - Number(ev.note || 0))}</span>
                  </div>
                  <p className="text-xs text-[#8B8974]">{fmtDate(ev.date)}</p>
                  {ev.commentaire && <p className="text-xs mt-0.5">{ev.commentaire}</p>}
                </li>
              ))}
            </ul>
          </>
        )}
        <Button variant="ghost" className="mt-3" onClick={() => setShowEvaluation(true)}><Plus size={14} /> Ajouter une évaluation</Button>
      </Card>

      <Card className="p-4">
        <SectionTitle icon={FileText} title="Documents (CV, attestation...)" onClick={() => setShowDocument(true)} />
        {(!employe.documentsPerso || employe.documentsPerso.length === 0) ? (
          <p className="text-sm text-[#8B8974] mt-2">Aucun document enregistré.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {[...employe.documentsPerso].reverse().map((doc) => (
              <li key={doc.id} className="flex items-center justify-between border-b border-[#EFEAD9] pb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge tone="accent">{DOC_PERSO_LABELS[doc.type] || doc.type}</Badge>
                  <span className="truncate">{doc.nom}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {doc.fichier && <a href={doc.fichier} download={doc.nom} className="text-[#8B5E3C] text-xs">Voir</a>}
                  <span className="text-xs text-[#8B8974]">{fmtDate(doc.date)}</span>
                  <button onClick={() => update((d) => { const e = d.employes.find((x) => x.id === employe.id); e.documentsPerso = e.documentsPerso.filter((x) => x.id !== doc.id); })} className="text-[#C7C2A8] hover:text-[#A6402A]">
                    <Trash2 size={12} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Button variant="ghost" className="mt-3" onClick={() => setShowDocument(true)}><Plus size={14} /> Ajouter un document</Button>
      </Card>

      {showEdit && (
        <Modal title="Modifier l'employé" onClose={() => setShowEdit(false)}>
          <EmployeForm
            initial={employe}
            departements={data.departements}
            sectionsProduction={data.sectionsProduction}
            onSubmit={(vals) => {
              update((d) => { const e = d.employes.find((x) => x.id === employe.id); Object.assign(e, vals); });
              setShowEdit(false);
            }}
          />
        </Modal>
      )}

      {showConge && (
        <Modal title="Nouveau congé" onClose={() => setShowConge(false)}>
          <CongeForm
            onSubmit={(vals) => {
              update((d) => { const e = d.employes.find((x) => x.id === employe.id); e.conges = e.conges || []; e.conges.push({ id: uid(), ...vals }); });
              setShowConge(false);
            }}
          />
        </Modal>
      )}

      {showPaie && (
        <Modal title="Enregistrer un paiement de salaire" onClose={() => setShowPaie(false)}>
          <PaieForm
            comptes={data.comptes}
            salaireDefaut={employe.salaireMensuel}
            onSubmit={(vals) => {
              update((d) => {
                d.transactions.push({
                  id: uid(),
                  type: "depense",
                  categorie: "Salaire",
                  montant: vals.montant,
                  date: vals.date,
                  description: `Salaire — ${employe.nom}`,
                  compteId: vals.compteId || null,
                  typeCharge: "salariale",
                  employeId: employe.id,
                  produitId: null,
                  quantite: null,
                });
              });
              setShowPaie(false);
            }}
          />
        </Modal>
      )}

      {showEvaluation && (
        <Modal title="Nouvelle évaluation" onClose={() => setShowEvaluation(false)}>
          <EvaluationForm
            onSubmit={(vals) => {
              update((d) => { const e = d.employes.find((x) => x.id === employe.id); e.evaluations = e.evaluations || []; e.evaluations.push({ id: uid(), ...vals }); });
              setShowEvaluation(false);
            }}
          />
        </Modal>
      )}

      {showDocument && (
        <Modal title="Nouveau document" onClose={() => setShowDocument(false)}>
          <DocumentPersoForm
            onSubmit={(vals) => {
              update((d) => { const e = d.employes.find((x) => x.id === employe.id); e.documentsPerso = e.documentsPerso || []; e.documentsPerso.push({ id: uid(), ...vals }); });
              setShowDocument(false);
            }}
          />
        </Modal>
      )}

      {showBulletin && (
        <Modal title="Générer un bulletin de paie" onClose={() => setShowBulletin(false)}>
          <BulletinPaieForm
            employe={employe}
            comptes={data.comptes}
            devise={data.ferme.devise}
            onSubmit={({ mois, brut, primes, tauxAutresChargesPatronales, compteId, calc }) => {
              update((d) => {
                const e = d.employes.find((x) => x.id === employe.id);
                e.bulletins = e.bulletins || [];
                e.bulletins.push({ id: uid(), mois, brut, primes, tauxAutresChargesPatronales, ...calc, dateEmission: today() });
                d.transactions.push({
                  id: uid(), type: "depense", categorie: "Salaire", montant: calc.net, date: today(),
                  description: `Salaire net — ${employe.nom} (${mois})`, compteId: compteId || null,
                  typeCharge: "salariale", employeId: employe.id, produitId: null, quantite: null,
                });
                d.transactions.push({
                  id: uid(), type: "depense", categorie: "Charges patronales (INPS/AMO/ANPE)", montant: calc.totalChargesPatronales, date: today(),
                  description: `Charges patronales — ${employe.nom} (${mois})`, compteId: compteId || null,
                  typeCharge: "fixe", employeId: employe.id, produitId: null, quantite: null,
                });
              });
              setShowBulletin(false);
            }}
          />
        </Modal>
      )}

      {selectedBulletin && (
        <Modal title={`Bulletin de paie — ${selectedBulletin.mois}`} onClose={() => setSelectedBulletin(null)}>
          <BulletinPaieDetail bulletin={selectedBulletin} employe={employe} devise={data.ferme.devise} nomFerme={data.ferme.nom} />
        </Modal>
      )}
    </div>
  );
}

function BulletinPaieForm({ onSubmit, employe, comptes = [], devise = "FCFA" }) {
  const [mois, setMois] = useState(today().slice(0, 7));
  const [brut, setBrut] = useState(employe.salaireMensuel || "");
  const [primes, setPrimes] = useState("");
  const [tauxAutresChargesPatronales, setTauxAutresChargesPatronales] = useState(TAUX_AUTRES_CHARGES_PATRONALES_DEFAUT);
  const [compteId, setCompteId] = useState("");

  const calc = calculBulletinPaie({
    brut: brut || 0, primes: primes || 0,
    situationFamiliale: employe.situationFamiliale, nombreEnfants: employe.nombreEnfants,
    tauxAutresChargesPatronales,
  });

  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit({ mois, brut: brut || 0, primes: primes || 0, tauxAutresChargesPatronales, compteId, calc }); }}>
      <Field label="Mois"><Input type="month" value={mois} onChange={(e) => setMois(e.target.value)} /></Field>
      <Field label={`Salaire de base brut (${devise})`}><Input type="number" step="0.01" value={brut} onChange={(e) => setBrut(e.target.value)} /></Field>
      <Field label={`Primes / indemnités (${devise}, optionnel)`}><Input type="number" step="0.01" value={primes} onChange={(e) => setPrimes(e.target.value)} /></Field>
      <Field label="Taux autres charges patronales (%)">
        <Input type="number" step="0.1" value={tauxAutresChargesPatronales} onChange={(e) => setTauxAutresChargesPatronales(e.target.value)} />
        <p className="text-xs text-[#8B8974] mt-1">Prestations familiales, accidents du travail (1 à 4% selon secteur), formation... — estimation à ajuster selon votre secteur d'activité.</p>
      </Field>
      <Field label="Moyen de paiement">
        <Select value={compteId} onChange={(e) => setCompteId(e.target.value)}>
          <option value="">Espèces (non rattaché)</option>
          {comptes.map((c) => <option key={c.id} value={c.id}>{COMPTE_LABELS[c.type]} — {c.nom}</option>)}
        </Select>
      </Field>

      <div className="rounded-md border border-[#DFD8C2] bg-[#FBF9F2] p-3 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-[#8B8974]">Brut total</span><span>{money(calc.brutTotal, devise)}</span></div>
        <div className="flex justify-between"><span className="text-[#8B8974]">INPS salarial (3,6%)</span><span>-{money(calc.inpsSalarial, devise)}</span></div>
        <div className="flex justify-between"><span className="text-[#8B8974]">AMO salarial (3,06%)</span><span>-{money(calc.amoSalarial, devise)}</span></div>
        <div className="flex justify-between"><span className="text-[#8B8974]">ITS</span><span>-{money(calc.its, devise)}</span></div>
        <div className="flex justify-between font-medium border-t border-[#DFD8C2] pt-1"><span>Net à payer</span><span className="text-[#3C5A34]">{money(calc.net, devise)}</span></div>
        <div className="flex justify-between text-[#8B8974] pt-1"><span>Charges patronales (total)</span><span>{money(calc.totalChargesPatronales, devise)}</span></div>
        <div className="flex justify-between text-[#8B8974]"><span>Coût total employeur</span><span>{money(calc.coutTotalEmployeur, devise)}</span></div>
      </div>

      <Button type="submit" variant="accent" className="w-full">Générer et enregistrer le bulletin</Button>
    </form>
  );
}

function BulletinPaieDetail({ bulletin: b, employe, devise, nomFerme }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex justify-between border-b border-[#DFD8C2] pb-2">
        <div>
          <p className="font-serif font-bold">{nomFerme}</p>
          <p className="text-xs text-[#8B8974]">Bulletin de paie — {b.mois}</p>
        </div>
        <div className="text-right">
          <p className="font-medium">{employe.nom}</p>
          <p className="text-xs text-[#8B8974]">{employe.poste || "—"}</p>
        </div>
      </div>

      <div>
        <p className="font-serif text-sm font-bold mb-1">Gains</p>
        <div className="flex justify-between"><span className="text-[#8B8974]">Salaire de base</span><span>{money(b.brut, devise)}</span></div>
        {Number(b.primes) > 0 && <div className="flex justify-between"><span className="text-[#8B8974]">Primes / indemnités</span><span>{money(b.primes, devise)}</span></div>}
        <div className="flex justify-between font-medium border-t border-[#EFEAD9] pt-1 mt-1"><span>Salaire brut total</span><span>{money(b.brutTotal, devise)}</span></div>
      </div>

      <div>
        <p className="font-serif text-sm font-bold mb-1">Retenues salariales</p>
        <div className="flex justify-between"><span className="text-[#8B8974]">INPS — retraite (3,6%)</span><span>-{money(b.inpsSalarial, devise)}</span></div>
        <div className="flex justify-between"><span className="text-[#8B8974]">AMO — assurance maladie (3,06%)</span><span>-{money(b.amoSalarial, devise)}</span></div>
        <div className="flex justify-between"><span className="text-[#8B8974]">ITS (impôt sur salaires)</span><span>-{money(b.its, devise)}</span></div>
        <div className="flex justify-between font-medium border-t border-[#EFEAD9] pt-1 mt-1"><span>Total retenues</span><span>-{money(b.totalRetenues, devise)}</span></div>
      </div>

      <div className="bg-[var(--color-total-bg)] text-[var(--color-total-text)] rounded-md px-3 py-2 flex justify-between font-serif font-bold">
        <span>Net à payer</span>
        <span className="text-[var(--color-accent)]">{money(b.net, devise)}</span>
      </div>

      <div>
        <p className="font-serif text-sm font-bold mb-1">Charges patronales (à la charge de l'employeur)</p>
        <div className="flex justify-between"><span className="text-[#8B8974]">INPS patronal (5,4%)</span><span>{money(b.inpsPatronal, devise)}</span></div>
        <div className="flex justify-between"><span className="text-[#8B8974]">AMO patronal (3,5%)</span><span>{money(b.amoPatronal, devise)}</span></div>
        <div className="flex justify-between"><span className="text-[#8B8974]">ANPE (1%)</span><span>{money(b.anpePatronal, devise)}</span></div>
        <div className="flex justify-between"><span className="text-[#8B8974]">Autres charges patronales ({b.tauxAutresChargesPatronales}%)</span><span>{money(b.autresChargesPatronales, devise)}</span></div>
        <div className="flex justify-between font-medium border-t border-[#EFEAD9] pt-1 mt-1"><span>Total charges patronales</span><span>{money(b.totalChargesPatronales, devise)}</span></div>
        <div className="flex justify-between font-medium"><span>Coût total employeur</span><span>{money(b.coutTotalEmployeur, devise)}</span></div>
      </div>

      <p className="text-xs text-[#8B8974]">Le salaire net a été enregistré en charge salariale et les charges patronales en charge fixe du mois de génération. Taux INPS/AMO et barème ITS conformes au Code Général des Impôts du Mali.</p>
    </div>
  );
}

function EvaluationForm({ onSubmit }) {
  const [service, setService] = useState("");
  const [note, setNote] = useState(5);
  const [date, setDate] = useState(today());
  const [commentaire, setCommentaire] = useState("");
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit({ service, note, date, commentaire }); }}>
      <Field label="Service / poste évalué"><Input value={service} onChange={(e) => setService(e.target.value)} placeholder="Ex. Traite du lait, Gardiennage..." /></Field>
      <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Note">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNote(n)}
              className={`h-9 w-9 rounded-md border text-sm ${Number(note) >= n ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]" : "bg-white text-[#8B8974] border-[#DFD8C2]"}`}
            >{n}</button>
          ))}
        </div>
      </Field>
      <Field label="Commentaire (optionnel)"><TextArea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Ponctualité, qualité du travail, assiduité, initiative..." /></Field>
      <Button type="submit" variant="accent" className="w-full">Enregistrer</Button>
    </form>
  );
}

function DocumentPersoForm({ onSubmit }) {
  const [type, setType] = useState("cv");
  const [nom, setNom] = useState("");
  const [date, setDate] = useState(today());
  const [fichier, setFichier] = useState(null);
  const [error, setError] = useState("");

  const uploadFichier = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setError("Fichier trop lourd (max 1 Mo). Choisissez un fichier plus léger ou une photo compressée.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setFichier(reader.result); setError(""); };
    reader.readAsDataURL(file);
  };

  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!nom) return; onSubmit({ type, nom, date, fichier }); }}>
      <Field label="Type de document">
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          {Object.entries(DOC_PERSO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </Field>
      <Field label="Nom / intitulé"><Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. CV 2026, Attestation de travail..." /></Field>
      <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Fichier (image ou PDF, optionnel, max 1 Mo)">
        <input type="file" accept="image/*,.pdf" onChange={uploadFichier} className="text-sm" />
      </Field>
      {error && <p className="text-xs text-[#A6402A]">{error}</p>}
      <Button type="submit" variant="accent" className="w-full">Enregistrer</Button>
    </form>
  );
}

function CongeForm({ onSubmit }) {
  const [type, setType] = useState("paye");
  const [dateDebut, setDateDebut] = useState(today());
  const [dateFin, setDateFin] = useState(today());
  const [statut, setStatut] = useState("planifie");
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit({ type, dateDebut, dateFin, statut }); }}>
      <Field label="Type de congé">
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="paye">Congé payé</option>
          <option value="maladie">Congé maladie</option>
          <option value="sans_solde">Sans solde</option>
        </Select>
      </Field>
      <Field label="Date de début"><Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} /></Field>
      <Field label="Date de fin"><Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} /></Field>
      <Button type="submit" variant="accent" className="w-full">Enregistrer</Button>
    </form>
  );
}

function PaieForm({ onSubmit, comptes, salaireDefaut }) {
  const [montant, setMontant] = useState(salaireDefaut || "");
  const [date, setDate] = useState(today());
  const [compteId, setCompteId] = useState("");
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!montant) return; onSubmit({ montant, date, compteId }); }}>
      <Field label="Montant versé"><Input type="number" step="0.01" value={montant} onChange={(e) => setMontant(e.target.value)} required /></Field>
      <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Moyen de paiement">
        <Select value={compteId} onChange={(e) => setCompteId(e.target.value)}>
          <option value="">Espèces (non rattaché)</option>
          {comptes.map((c) => <option key={c.id} value={c.id}>{COMPTE_LABELS[c.type]} — {c.nom}</option>)}
        </Select>
      </Field>
      <Button type="submit" variant="accent" className="w-full">Enregistrer le paiement</Button>
    </form>
  );
}
