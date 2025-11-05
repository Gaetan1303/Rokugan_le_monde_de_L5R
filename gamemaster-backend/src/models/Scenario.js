class Scenario {
  constructor({ id, title, synopsis, hooks = [], scenes = [], npcs = [], factions = [], locations = [], rewards = [], difficulty = 'standard', tags = [] }) {
    this.id = id || this.generateId();
    this.title = title || 'Scénario sans titre';
    this.synopsis = synopsis || '';
    this.hooks = hooks; // accroches
    this.scenes = scenes; // [{ title, description, objectives, challenges }]
    this.npcs = npcs; // [{ name, role, clan?, notes }]
    this.factions = factions; // [{ name, goal, attitude }]
    this.locations = locations; // [{ name, type, description }]
    this.rewards = rewards; // [{ type, description }]
    this.difficulty = difficulty; // facile | standard | difficile | épique
    this.tags = tags;
    this.createdAt = new Date();
  }

  generateId() {
    return Math.random().toString().substr(, ).toUpperCase();
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

module.exports = Scenario;
