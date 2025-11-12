
/**
 * [DEV SENIOR] Service Scenario - logique métier et accès aux scénarios.
 * - Centralise les opérations sur les scénarios, gestion des joueurs, accès et stats.
 * - Respecter la séparation des responsabilités et documenter toute évolution majeure.
 */

// [IMPORTS] Import des modèles nécessaires
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Scenario } from '../models/Scenario.js';

// Générateur UUID v4 simple (compatible Node et navigateur)
function generateUUIDv4() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback universel
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Types pour les données JSON
type Clan = { nom: string };
type Saison = { nom: string };
type Lieu = { nom: string };
type Evenement = { titre: string };
type Etiquette = { titre: string };
type Kata = { name: string };
type Spell = { name: string };

type ScenarioOptions = {
  clan?: string;
  saison?: string;
  title?: string;
  difficulty?: string;
};

export class ScenarioService {
  scenarios: Map<string, Scenario>;
  DATA_DIR: string;

  constructor() {
    this.scenarios = new Map<string, Scenario>();
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.DATA_DIR = path.join(__dirname, '../../data');
  }

  list(): any[] {
    return Array.from(this.scenarios.values());
  }

  get(id: string): Scenario | null {
    return this.scenarios.get(id) || null;
  }

  create(payload: Partial<Scenario>): Scenario {
    // Remplacer par repo.create lors de la migration TypeORM
    const scenario = Object.assign(new Scenario(), payload || {});
    // Génère un id UUID si absent (hors contexte TypeORM)
    if (!scenario.id) {
      scenario.id = generateUUIDv4();
    }
    this.scenarios.set(scenario.id, scenario);
    return scenario;
  }

  remove(id: string): boolean {
    return this.scenarios.delete(id);
  }

  loadJson(filename: string): any {
    try {
      const file = path.join(this.DATA_DIR, filename);
      const raw = fs.readFileSync(file, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  pick<T>(arr: T[]): T | null {
    if (!arr || arr.length === 0) return null;
  const result = arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;
  return result === undefined ? null : result;
  }

  // Générer un scénario basique à partir des données de référence disponibles
  generate(options: ScenarioOptions = {}) {
    const clans: Clan[] = this.loadJson('clans.json')?.clans || [];
    const env = this.loadJson('environnement.json') || {};
    const voyages = this.loadJson('voyage.json') || {};
    const social = this.loadJson('social.json') || {};
    const techniques = this.loadJson('techniques.json') || {};
    const sorts = this.loadJson('sorts.json') || {};

    const pickedClan = this.pick<Clan>(clans);
    const clan = options.clan ?? (pickedClan && typeof pickedClan.nom === 'string' ? pickedClan.nom : 'Clan mineur');

    const saisons: Saison[] = Array.isArray(env.saisons) ? env.saisons : [];
    const pickedSaison = this.pick<Saison>(saisons);
    const season = options.saison ?? (pickedSaison && typeof pickedSaison.nom === 'string' ? pickedSaison.nom : 'printemps');

    const lieux: Lieu[] = Array.isArray(env.lieux) ? env.lieux : [];
    const pickedLieu = this.pick<Lieu>(lieux);
    const lieu = pickedLieu && typeof pickedLieu.nom === 'string' ? pickedLieu.nom : 'village reculé';

    const evenements: Evenement[] = Array.isArray(voyages.evenements) ? voyages.evenements : [];
    const pickedEvt = this.pick<Evenement>(evenements);
    const voyageEvt = pickedEvt && typeof pickedEvt.titre === 'string' ? pickedEvt.titre : 'rencontre inattendue';

    const etiquettes: Etiquette[] = Array.isArray(social.etiquette) ? social.etiquette : [];
    const themes: Etiquette[] = Array.isArray(social.themes) ? social.themes : [];
    const etiquetteArr = etiquettes.length > 0 ? etiquettes : themes;
    const pickedEtiquette = this.pick<Etiquette>(etiquetteArr);
    const etiquette = pickedEtiquette && typeof pickedEtiquette.titre === 'string' ? pickedEtiquette.titre : 'délicat protocole';

    const katas: Kata[] = Array.isArray(techniques.kata) ? techniques.kata : [];
    const pickedKata = this.pick<Kata>(katas);
    const kata = pickedKata && typeof pickedKata.name === 'string' ? pickedKata.name : null;

    const spells: Spell[] = Array.isArray(sorts.spells) ? sorts.spells : [];
    const pickedSpell = this.pick<Spell>(spells);
    const spell = pickedSpell && typeof pickedSpell.name === 'string' ? pickedSpell.name : null;

    const title = options.title ?? `Les ombres de ${lieu}`;
    const synopsis = `Alors que la saison est au ${season}, un conflit latent menace ${lieu}. Le clan ${clan} sollicite l'aide des PJ pour démêler une affaire mêlant ${etiquette} et dangers sur la route (${voyageEvt}).`;

    const hooks = [
      `Un émissaire du clan ${clan} demande aux PJ d'enquêter à ${lieu}.`,
      `Une rumeur évoque un artefact lié à ${spell || 'un ancien rituel'}.`,
      `Un dojo propose d'observer une démonstration de ${kata || 'technique martiale'} qui attire des convoitises.`
    ];

    const npcs = [
      { name: `Daimyo du ${clan}`, role: 'commanditaire', clan, notes: 'Pragmatique, sensible à l’honneur.' },
      { name: 'Moine errant', role: 'témoin', notes: 'Aperçu des forces en présence.' },
      { name: 'Ronin ambitieux', role: 'antagoniste', notes: 'Recherche prestige à tout prix.' }
    ];

    const factions = [
      { name: `Faction loyaliste (${clan})`, goal: 'Stabilité et respect des traditions', attitude: 'prudente' },
      { name: 'Guilde marchande', goal: 'Profits et influence', attitude: 'opportuniste' }
    ];

    const locations = [
      { name: lieu, type: 'localité', description: 'Lieu principal des interactions.' },
      { name: 'Dojo local', type: 'dojo', description: 'Entrainement, duel, honneur.' }
    ];

    const rewards = [
      { type: 'honneur', description: 'Reconnaissance du clan' },
      { type: 'contact', description: 'Alliés parmi la guilde marchande' }
    ];

    const difficulty = options.difficulty ?? 'standard';
    const tags = [clan, season, lieu].filter(Boolean);

    // Crée d'abord le scénario sans les scènes
    const scenario = this.create({ title, synopsis, hooks, npcs, factions, locations, rewards, difficulty, tags });

    // Génère les scènes avec la bonne référence
    const scenes = [
      {
        id: 'scene-1',
        scenario: scenario,
        title: 'Accroche et arrivée',
        description: `Voyage vers ${lieu} ponctué par ${voyageEvt}. Mise en place des enjeux sociaux (${etiquette}).`,
        objectives: ['Comprendre la demande', 'Gagner la confiance des notables'],
        challenges: ['Protocole', 'Orientation', 'Suspicion']
      },
      {
        id: 'scene-2',
        scenario: scenario,
        title: 'Enquête et tensions',
        description: 'Indices contradictoires, factions locales en désaccord, un témoin-clé disparaît.',
        objectives: ['Identifier les meneurs', 'Recueillir des preuves'],
        challenges: ['Intimidation', 'Diplomatie', 'Filature']
      },
      {
        id: 'scene-3',
        scenario: scenario,
        title: 'Confrontation et résolution',
        description: `Face-à-face avec les instigateurs. Possible duel impliquant ${kata || 'un champion'} ou rituel lié à ${spell || 'une magie ancienne'}.`,
        objectives: ['Neutraliser la menace', 'Sauver les innocents'],
        challenges: ['Duel', 'Rituel', 'Choix moral']
      }
    ];
    scenario.scenes = scenes;
    return scenario;
  }
}

// [EXPORT] Export du service principal pour intégration dans les contrôleurs
export const scenarioService = new ScenarioService();
