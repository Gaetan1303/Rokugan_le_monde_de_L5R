/**
 * [DEV SENIOR] Modèle Scenario - structure et logique métier d'un scénario de jeu.
 * - Définit les propriétés, méthodes et interactions des scénarios.
 * - Adapter la structure selon les évolutions du gameplay et des besoins métier.
 */
// [MODEL] Classe Scenario - encapsule la logique métier et les propriétés d'un scénario
export class Scenario {
    constructor({ id, title, synopsis, hooks = [], scenes = [], npcs = [], factions = [], locations = [], rewards = [], difficulty = 'standard', tags = [] }) {
        this.id = id || this.generateId();
        this.title = title || 'Scénario sans titre';
        this.synopsis = synopsis || '';
        this.hooks = hooks;
        this.scenes = scenes;
        this.npcs = npcs;
        this.factions = factions;
        this.locations = locations;
        this.rewards = rewards;
        this.difficulty = difficulty;
        this.tags = tags;
        this.createdAt = new Date();
    }
    generateId() {
        return Math.random().toString(36).substr(2, 9).toUpperCase();
    }
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            synopsis: this.synopsis,
            hooks: this.hooks,
            scenes: this.scenes,
            npcs: this.npcs,
            factions: this.factions,
            locations: this.locations,
            rewards: this.rewards,
            difficulty: this.difficulty,
            tags: this.tags,
            createdAt: this.createdAt
        };
    }
}
//# sourceMappingURL=Scenario.js.map