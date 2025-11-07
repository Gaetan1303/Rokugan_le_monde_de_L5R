/**
 * [DEV SENIOR] Service Room - logique métier et accès aux rooms.
 * - Centralise les opérations sur les rooms, gestion des joueurs, accès et stats.
 * - Respecter la séparation des responsabilités et documenter toute évolution majeure.
 */
import type { IRoomService } from './IRoomService.js';
import { Room } from '../models/Room.js';
export declare class RoomService implements IRoomService {
    rooms: Map<string, Room>;
    constructor();
    createRoom(name: string, gmId: string, gmName: string, scenario?: string, isPrivate?: boolean, password?: string | null): Room;
    getRoomById(roomId: string): Room | undefined;
    getAllRooms(): Room[];
    getPublicRooms(): Room[];
    getRoomsByGM(gmId: string): Room[];
    getRoomsByPlayer(playerId: string): Room[];
    deleteRoom(roomId: string): boolean;
    addPlayerToRoom(roomId: string, playerId: string, playerName: string, character?: any, password?: string | null): any;
    updatePlayerCharacter(roomId: string, playerId: string, character: any): any;
    getPlayer(roomId: string, playerId: string): any;
    removePlayerFromRoom(roomId: string, playerId: string): any;
    updateRoomStatus(roomId: string, status: string): any;
    addChatMessage(roomId: string, senderId: string, senderName: string, message: string): any;
    updateGameData(roomId: string, updates: any): any;
    cleanupRooms(): number;
    getStats(): {
        totalRooms: number;
        publicRooms: number;
        privateRooms: number;
        activeRooms: number;
        waitingRooms: number;
        pausedRooms: number;
        completedRooms: number;
        totalPlayers: number;
        connectedPlayers: number;
    };
}
declare const roomService: RoomService;
export default roomService;
//# sourceMappingURL=roomService.d.ts.map