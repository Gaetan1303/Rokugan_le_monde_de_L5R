/**
 * [DEV SENIOR] Modèle Room - structure et logique métier d'une room multijoueur.
 * - Définit les propriétés, méthodes et interactions des rooms.
 * - Adapter la structure selon les évolutions du gameplay et des besoins métier.
 */

// [INTERFACES] Définition des types principaux pour les personnages, joueurs et messages
// Modèle pour une Room de jeu GameMaster L5R
export interface Character {
  name: string;
  clan?: string;
  school?: string;
  rank?: number;
  honor?: number;
  glory?: number;
  status?: number;
  traits?: any;
  skills?: Record<string, number>;
}

export interface Player {
  id: string;
  name: string;
  character: Character;
  isConnected: boolean;
  joinedAt: Date;
  lastSeen: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  isGM: boolean;
  timestamp: Date;
}

// [GAME DATA] Structure des données de partie pour la room
export interface RoomGameData {
  currentScene: any;
  notes: string;
  initiative: any[];
  conditions: any[];
  scenesHistory: any[];
}

// [MODEL] Classe Room - encapsule la logique métier et les propriétés d'une room
export class Room {
  id: string;
  name: string;
  gmId: string;
  gmName: string;
  scenario: string;
  players: Player[];
  status: string;
  createdAt: Date;
  lastActivity: Date;
  maxPlayers: number;
  isPrivate: boolean;
  password: string | null;
  currentSession: string | null;
  chat: ChatMessage[];
  gameData: RoomGameData;

  constructor(name: string, gmId: string, gmName: string, scenario: string | null = null) {
    this.id = this.generateId();
    this.name = name;
    this.gmId = gmId;
    this.gmName = gmName;
    this.scenario = scenario || 'Scénario libre';
    this.players = [];
    this.status = 'waiting';
    this.createdAt = new Date();
    this.lastActivity = new Date();
    this.maxPlayers = 6;
    this.isPrivate = false;
    this.password = null;
    this.currentSession = null;
    this.chat = [];
    this.gameData = {
      currentScene: null,
      notes: '',
      initiative: [],
      conditions: [],
      scenesHistory: []
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  addPlayer(playerId: string, playerName: string, character?: Character): Player {
    if (this.players.length >= this.maxPlayers) {
      throw new Error('La room est pleine');
    }
    if (this.players.find((p: Player) => p.id === playerId)) {
      throw new Error('Le joueur est déjà dans cette room');
    }
    const player: Player = {
      id: playerId,
      name: playerName,
      character: character || { name: playerName },
      isConnected: true,
      joinedAt: new Date(),
      lastSeen: new Date()
    };
    this.players.push(player);
    this.updateActivity();
    return player;
  }

  updatePlayerCharacter(playerId: string, character: Partial<Character>): Player {
    const player = this.players.find((p: Player) => p.id === playerId);
    if (!player) {
      throw new Error('Joueur introuvable dans cette room');
    }
    player.character = { ...player.character, ...character };
    this.updateActivity();
    return player;
  }

  removePlayer(playerId: string): Player | null {
    const index = this.players.findIndex((p: Player) => p.id === playerId);
    if (index > -1) {
      const removedPlayer = this.players.splice(index, 1)[0] ?? null;
      this.updateActivity();
      return removedPlayer;
    }
    return null;
  }

  updatePlayerConnection(playerId: string, isConnected: boolean): void {
    const player = this.players.find((p: Player) => p.id === playerId);
    if (player) {
      player.isConnected = isConnected;
      if (isConnected) {
        player.lastSeen = new Date();
      }
      this.updateActivity();
    }
  }

  getConnectedPlayers(): Player[] {
    return this.players.filter((p: Player) => p.isConnected);
  }

  updateActivity(): void {
    this.lastActivity = new Date();
  }

  addChatMessage(senderId: string, senderName: string, message: string, isGM: boolean = false): ChatMessage {
    const chatMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId,
      senderName,
      message,
      isGM,
      timestamp: new Date()
    };
    this.chat.push(chatMessage);
    this.updateActivity();
    // Garder seulement les 100 derniers messages
    if (this.chat.length > 100) {
      this.chat = this.chat.slice(-100);
    }
    return chatMessage;
  }

  updateGameData(updates: Partial<RoomGameData>): void {
    this.gameData = { ...this.gameData, ...updates };
    this.updateActivity();
  }

  // Méthodes pour la gestion de l'initiative
  setInitiative(initiativeOrder: any[]): void {
    this.gameData.initiative = initiativeOrder;
    this.updateActivity();
  }

  addCondition(playerId: string, condition: string): void {
    if (!this.gameData.conditions) {
      this.gameData.conditions = [];
    }
    this.gameData.conditions.push({
      id: Date.now().toString(),
      playerId,
      condition,
      addedAt: new Date(),
      addedBy: 'GM'
    });
    this.updateActivity();
  }

  removeCondition(conditionId: string): void {
    if (this.gameData.conditions) {
      this.gameData.conditions = this.gameData.conditions.filter((c: any) => c.id !== conditionId);
      this.updateActivity();
    }
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      gmId: this.gmId,
      gmName: this.gmName,
      scenario: this.scenario,
      players: this.players,
      status: this.status,
      createdAt: this.createdAt,
      lastActivity: this.lastActivity,
      maxPlayers: this.maxPlayers,
      isPrivate: this.isPrivate,
      currentSession: this.currentSession,
      playersCount: this.players.length,
      connectedPlayersCount: this.getConnectedPlayers().length,
      gameData: this.gameData
    };
  }

  // Version publique pour les listes (sans données sensibles)
  toPublicJSON(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      gmName: this.gmName,
      scenario: this.scenario,
      status: this.status,
      createdAt: this.createdAt,
      lastActivity: this.lastActivity,
      maxPlayers: this.maxPlayers,
      playersCount: this.players.length,
      connectedPlayersCount: this.getConnectedPlayers().length,
      isPrivate: this.isPrivate
    };
  }
}