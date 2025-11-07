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
export class ScenarioService {
    constructor() {
        this.scenarios = new Map();
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        this.DATA_DIR = path.join(__dirname, '../../data');
    }
    list() {
        return Array.from(this.scenarios.values()).map((s) => s.toJSON());
    }
    get(id) {
        return this.scenarios.get(id) || null;
    }
    create(payload) {
        const scenario = new Scenario(payload || {});
        this.scenarios.set(scenario.id, scenario);
        return scenario;
    }
    remove(id) {
        return this.scenarios.delete(id);
    }
    loadJson(filename) {
        try {
            const file = path.join(this.DATA_DIR, filename);
            const raw = fs.readFileSync(file, 'utf-8');
            return JSON.parse(raw);
        }
        catch (e) {
            return null;
        }
    }
    pick(arr) {
        if (!arr || arr.length === 0)
            return null;
        const result = arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;
        return result === undefined ? null : result;
    }
    // Générer un scénario basique à partir des données de référence disponibles
    generate(options = {}) {
        const clans = this.loadJson('clans.json')?.clans || [];
        const env = this.loadJson('environnement.json') || {};
        const voyages = this.loadJson('voyage.json') || {};
        const social = this.loadJson('social.json') || {};
        const techniques = this.loadJson('techniques.json') || {};
        const sorts = this.loadJson('sorts.json') || {};
        const pickedClan = this.pick(clans);
        const clan = options.clan ?? (pickedClan && typeof pickedClan.nom === 'string' ? pickedClan.nom : 'Clan mineur');
        const saisons = Array.isArray(env.saisons) ? env.saisons : [];
        const pickedSaison = this.pick(saisons);
        const season = options.saison ?? (pickedSaison && typeof pickedSaison.nom === 'string' ? pickedSaison.nom : 'printemps');
        const lieux = Array.isArray(env.lieux) ? env.lieux : [];
        const pickedLieu = this.pick(lieux);
        const lieu = pickedLieu && typeof pickedLieu.nom === 'string' ? pickedLieu.nom : 'village reculé';
        const evenements = Array.isArray(voyages.evenements) ? voyages.evenements : [];
        const pickedEvt = this.pick(evenements);
        const voyageEvt = pickedEvt && typeof pickedEvt.titre === 'string' ? pickedEvt.titre : 'rencontre inattendue';
        const etiquettes = Array.isArray(social.etiquette) ? social.etiquette : [];
        const themes = Array.isArray(social.themes) ? social.themes : [];
        const etiquetteArr = etiquettes.length > 0 ? etiquettes : themes;
        const pickedEtiquette = this.pick(etiquetteArr);
        const etiquette = pickedEtiquette && typeof pickedEtiquette.titre === 'string' ? pickedEtiquette.titre : 'délicat protocole';
        const katas = Array.isArray(techniques.kata) ? techniques.kata : [];
        const pickedKata = this.pick(katas);
        const kata = pickedKata && typeof pickedKata.name === 'string' ? pickedKata.name : null;
        const spells = Array.isArray(sorts.spells) ? sorts.spells : [];
        const pickedSpell = this.pick(spells);
        const spell = pickedSpell && typeof pickedSpell.name === 'string' ? pickedSpell.name : null;
        const title = options.title ?? `Les ombres de ${lieu}`;
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
        const difficulty = options.difficulty ?? 'standard';
        const tags = [clan, season, lieu].filter(Boolean);
        return this.create({ title, synopsis, hooks, scenes, npcs, factions, locations, rewards, difficulty, tags });
    }
}
const scenarioService = new ScenarioService();
// [EXPORT] Export du service principal pour intégration dans les contrôleurs
export default scenarioService;
//# sourceMappingURL=scenarioService.js.map