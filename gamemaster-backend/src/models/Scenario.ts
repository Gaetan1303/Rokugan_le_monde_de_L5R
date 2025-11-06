/**
 * [DEV SENIOR] Modèle Scenario - structure et logique métier d'un scénario de jeu.
 * - Définit les propriétés, méthodes et interactions des scénarios.
 * - Adapter la structure selon les évolutions du gameplay et des besoins métier.
 */

// [INTERFACES] Définition des types principaux pour les scènes, PNJ, factions, lieux et récompenses
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

// [MODEL] Classe Scenario - encapsule la logique métier et les propriétés d'un scénario
export class Scenario {
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

  constructor({
    id,
    title,
    synopsis,
    hooks = [],
    scenes = [],
    npcs = [],
    factions = [],
    locations = [],
    rewards = [],
    difficulty = 'standard',
    tags = []
  }: {
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
  }) {
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

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  toJSON(): Record<string, any> {
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
