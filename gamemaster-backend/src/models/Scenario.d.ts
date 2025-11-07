/**
 * [DEV SENIOR] Modèle Scenario - structure et logique métier d'un scénario de jeu.
 * - Définit les propriétés, méthodes et interactions des scénarios.
 * - Adapter la structure selon les évolutions du gameplay et des besoins métier.
 */
export interface Scene {
    title: string;
    description: string;
    objectives?: string[];
    challenges?: string[];
}
export interface NPC {
    name: string;
    role: string;
    clan?: string;
    notes?: string;
}
export interface Faction {
    name: string;
    goal: string;
    attitude?: string;
}
export interface Location {
    name: string;
    type: string;
    description: string;
}
export interface Reward {
    type: string;
    description: string;
}
export declare class Scenario {
    id: string;
    title: string;
    synopsis: string;
    hooks: string[];
    scenes: Scene[];
    npcs: NPC[];
    factions: Faction[];
    locations: Location[];
    rewards: Reward[];
    difficulty: string;
    tags: string[];
    createdAt: Date;
    constructor({ id, title, synopsis, hooks, scenes, npcs, factions, locations, rewards, difficulty, tags }: {
        id?: string;
        title?: string;
        synopsis?: string;
        hooks?: string[];
        scenes?: Scene[];
        npcs?: NPC[];
        factions?: Faction[];
        locations?: Location[];
        rewards?: Reward[];
        difficulty?: string;
        tags?: string[];
    });
    private generateId;
    toJSON(): Record<string, any>;
}
//# sourceMappingURL=Scenario.d.ts.map