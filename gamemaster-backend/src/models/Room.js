// Modèle pour une Room de jeu GameMaster LR
class Room {
  constructor(name, gmId, gmName, scenario = null) {
    this.id = this.generateId();
    this.name = name;
    this.gmId = gmId;
    this.gmName = gmName;
    this.scenario = scenario || 'Scénario libre';
    this.players = [];
    this.status = 'waiting'; // waiting, active, paused, completed
    this.createdAt = new Date();
    this.lastActivity = new Date();
    this.maxPlayers = ; // Limite typique pour LR
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

  generateId() {
    return Math.random().toString().substr(, ).toUpperCase();
  }

  addPlayer(playerId, playerName, character = null) {
    if (this.players.length >= this.maxPlayers) {
      throw new Error('La room est pleine');
    }
    
    if (this.players.find(p => p.id === playerId)) {
      throw new Error('Le joueur est déjà dans cette room');
    }

    const player = {
      id: playerId,
      name: playerName,
      character: character || {
        name: playerName,
        clan: null,
        school: null,
        rank: 
      },
      isConnected: true,
      joinedAt: new Date(),
      lastSeen: new Date()
    };

    this.players.push(player);
    this.updateActivity();
    return player;
  }

  updatePlayerCharacter(playerId, character) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Joueur introuvable dans cette room');
    }
    player.character = { ...player.character, ...character };
    this.updateActivity();
    return player;
  }

  removePlayer(playerId) {
    const index = this.players.findIndex(p => p.id === playerId);
    if (index > -) {
      const removedPlayer = this.players.splice(index, )[];
      this.updateActivity();
      return removedPlayer;
    }
    return null;
  }

  updatePlayerConnection(playerId, isConnected) {
    const player = this.players.find(p => p.id === playerId);
    if (player) {
      player.isConnected = isConnected;
      if (isConnected) {
        player.lastSeen = new Date();
      }
      this.updateActivity();
    }
  }

  getConnectedPlayers() {
    return this.players.filter(p => p.isConnected);
  }

  updateActivity() {
    this.lastActivity = new Date();
  }

  addChatMessage(senderId, senderName, message, isGM = false) {
    const chatMessage = {
      id: Date.now().toString(),
      senderId,
      senderName,
      message,
      isGM,
      timestamp: new Date()
    };
    this.chat.push(chatMessage);
    this.updateActivity();
    
    // Garder seulement les  derniers messages
    if (this.chat.length > ) {
      this.chat = this.chat.slice(-);
    }
    
    return chatMessage;
  }

  updateGameData(updates) {
    this.gameData = { ...this.gameData, ...updates };
    this.updateActivity();
  }

  // Méthodes pour la gestion de l'initiative
  setInitiative(initiativeOrder) {
    this.gameData.initiative = initiativeOrder;
    this.updateActivity();
  }

  addCondition(playerId, condition) {
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

  removeCondition(conditionId) {
    if (this.gameData.conditions) {
      this.gameData.conditions = this.gameData.conditions.filter(c => c.id !== conditionId);
      this.updateActivity();
    }
  }

  toJSON() {
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
  toPublicJSON() {
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

module.exports = Room;