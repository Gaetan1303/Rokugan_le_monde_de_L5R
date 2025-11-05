const path = require('path');
const fs = require('fs');
const Scenario = require('../models/Scenario');

class ScenarioService {
  constructor() {
    this.scenarios = new Map();
    this.DATA_DIR = path.join(__dirname, '../../data');
  }

  list() {
    return Array.from(this.scenarios.values()).map(s => s.toJSON());
  }

  get(id) {
    return this.scenarios.get(id) || null;
  }

  create(payload) {
    const scenario = new Scenario(payload || {});
    this.scenarios.set(scenario.id, scenario);
    return scenario.toJSON();
  }

  remove(id) {
    return this.scenarios.delete(id);
  }

  loadJson(filename) {
    try {
      const file = path.join(this.DATA_DIR, filename);
      const raw = fs.readFileSync(file, 'utf-');
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  pick(arr) {
    if (!arr || arr.length === ) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Générer un scénario basique à partir des données de référence disponibles
  generate(options = {}) {
    const clans = this.loadJson('clans.json')?.clans || [];
    const env = this.loadJson('environnement.json') || {};
    const voyages = this.loadJson('voyage.json') || {};
    const social = this.loadJson('social.json') || {};
    const techniques = this.loadJson('techniques.json') || {};
    const sorts = this.loadJson('sorts.json') || {};

    const clan = options.clan || this.pick(clans)?.nom || 'Clan mineur';
    const season = options.saison || this.pick(env.saisons || [])?.nom || 'printemps';
    const lieu = this.pick(env.lieux || [])?.nom || 'village reculé';
    const voyageEvt = this.pick(voyages.evenements || [])?.titre || 'rencontre inattendue';
    const etiquette = this.pick(social.etiquette || social?.themes || [])?.titre || 'délicat protocole';
    const kata = this.pick(techniques.kata || [])?.name || null;
    const spell = this.pick(sorts.spells || [])?.name || null;

    const title = options.title || `Les ombres de ${lieu}`;
    const synopsis = `Alors que la saison est au ${season}, un conflit latent menace ${lieu}. Le clan ${clan} sollicite l'aide des PJ pour démêler une affaire mêlant ${etiquette} et dangers sur la route (${voyageEvt}).`;

    const hooks = [
      `Un émissaire du clan ${clan} demande aux PJ d'enquêter à ${lieu}.`,
      `Une rumeur évoque un artefact lié à ${spell || 'un ancien rituel'}.`,
      `Un dojo propose d'observer une démonstration de ${kata || 'technique martiale'} qui attire des convoitises.`
    ];

    const scenes = [
      {
        title: 'Accroche et arrivée',
        description: `Voyage vers ${lieu} ponctué par ${voyageEvt}. Mise en place des enjeux sociaux (${etiquette}).`,
        objectives: ['Comprendre la demande', 'Gagner la confiance des notables'],
        challenges: ['Protocole', 'Orientation', 'Suspicion']
      },
      {
        title: 'Enquête et tensions',
        description: 'Indices contradictoires, factions locales en désaccord, un témoin-clé disparaît.',
        objectives: ['Identifier les meneurs', 'Recueillir des preuves'],
        challenges: ['Intimidation', 'Diplomatie', 'Filature']
      },
      {
        title: 'Confrontation et résolution',
        description: `Face-à-face avec les instigateurs. Possible duel impliquant ${kata || 'un champion'} ou rituel lié à ${spell || 'une magie ancienne'}.`,
        objectives: ['Neutraliser la menace', 'Sauver les innocents'],
        challenges: ['Duel', 'Rituel', 'Choix moral']
      }
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

    const difficulty = options.difficulty || 'standard';
    const tags = [clan, season, lieu].filter(Boolean);

    return this.create({ title, synopsis, hooks, scenes, npcs, factions, locations, rewards, difficulty, tags });
  }
}

module.exports = new ScenarioService();
