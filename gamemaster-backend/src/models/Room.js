/**
 * [DEV SENIOR] Modèle Room - structure et logique métier d'une room multijoueur.
 * - Définit les propriétés, méthodes et interactions des rooms.
 * - Adapter la structure selon les évolutions du gameplay et des besoins métier.
 */
// [MODEL] Classe Room - encapsule la logique métier et les propriétés d'une room
export class Room {
    constructor(name, gmId, gmName, scenario = null) {
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
    generateId() {
        return Math.random().toString(36).substr(2, 9).toUpperCase();
    }
    addPlayer(playerId, playerName, character) {
        if (this.players.length >= this.maxPlayers) {
            throw new Error('La room est pleine');
        }
        if (this.players.find((p) => p.id === playerId)) {
            throw new Error('Le joueur est déjà dans cette room');
        }
        const player = {
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
    updatePlayerCharacter(playerId, character) {
        const player = this.players.find((p) => p.id === playerId);
        if (!player) {
            throw new Error('Joueur introuvable dans cette room');
        }
        player.character = { ...player.character, ...character };
        this.updateActivity();
        return player;
    }
    removePlayer(playerId) {
        const index = this.players.findIndex((p) => p.id === playerId);
        if (index > -1) {
            const removedPlayer = this.players.splice(index, 1)[0] ?? null;
            this.updateActivity();
            return removedPlayer;
        }
        return null;
    }
    updatePlayerConnection(playerId, isConnected) {
        const player = this.players.find((p) => p.id === playerId);
        if (player) {
            player.isConnected = isConnected;
            if (isConnected) {
                player.lastSeen = new Date();
            }
            this.updateActivity();
        }
    }
    getConnectedPlayers() {
        return this.players.filter((p) => p.isConnected);
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
        // Garder seulement les 100 derniers messages
        if (this.chat.length > 100) {
            this.chat = this.chat.slice(-100);
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
            this.gameData.conditions = this.gameData.conditions.filter((c) => c.id !== conditionId);
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
//# sourceMappingURL=Room.js.map