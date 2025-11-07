/**
 * [DEV SENIOR] Modèle Room - structure et logique métier d'une room multijoueur.
 * - Définit les propriétés, méthodes et interactions des rooms.
 * - Adapter la structure selon les évolutions du gameplay et des besoins métier.
 */
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
export interface RoomGameData {
    currentScene: any;
    notes: string;
    initiative: any[];
    conditions: any[];
    scenesHistory: any[];
}
export declare class Room {
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
    constructor(name: string, gmId: string, gmName: string, scenario?: string | null);
    private generateId;
    addPlayer(playerId: string, playerName: string, character?: Character): Player;
    updatePlayerCharacter(playerId: string, character: Partial<Character>): Player;
    removePlayer(playerId: string): Player | null;
    updatePlayerConnection(playerId: string, isConnected: boolean): void;
    getConnectedPlayers(): Player[];
    updateActivity(): void;
    addChatMessage(senderId: string, senderName: string, message: string, isGM?: boolean): ChatMessage;
    updateGameData(updates: Partial<RoomGameData>): void;
    setInitiative(initiativeOrder: any[]): void;
    addCondition(playerId: string, condition: string): void;
    removeCondition(conditionId: string): void;
    toJSON(): Record<string, any>;
    toPublicJSON(): Record<string, any>;
}
//# sourceMappingURL=Room.d.ts.map