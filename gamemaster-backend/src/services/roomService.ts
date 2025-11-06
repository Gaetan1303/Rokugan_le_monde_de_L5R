/**
 * [DEV SENIOR] Service Room - logique métier et accès aux rooms.
 * - Centralise les opérations sur les rooms, gestion des joueurs, accès et stats.
 * - Respecter la séparation des responsabilités et documenter toute évolution majeure.
 */

// [IMPORTS] Import des modèles et interfaces nécessaires
import type { IRoomService } from './IRoomService.js';
import { Room } from '../models/Room.js';

export class RoomService implements IRoomService {
  rooms: Map<string, Room>;

  constructor() {
    this.rooms = new Map<string, Room>();
    console.log('Service de gestion des rooms GameMaster initialisé');
  }

  createRoom(name: string, gmId: string, gmName: string, scenario: string = '', isPrivate: boolean = false, password: string | null = null): Room {
    const room = new Room(name, gmId, gmName, scenario);
    room.isPrivate = isPrivate;
    room.password = password;
    this.rooms.set(room.id, room);
    console.log(`Nouvelle room créée: ${room.name} (${room.id}) par ${gmName}`);
    return room;
  }

  getRoomById(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  getPublicRooms(): Room[] {
    return Array.from(this.rooms.values())
      .filter((room: Room) => !room.isPrivate)
      .sort((a: Room, b: Room) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  getRoomsByGM(gmId: string): Room[] {
    return Array.from(this.rooms.values())
      .filter((room: Room) => room.gmId === gmId)
      .sort((a: Room, b: Room) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getRoomsByPlayer(playerId: string): Room[] {
    return Array.from(this.rooms.values())
      .filter((room: Room) => room.players.some((player: any) => player.id === playerId))
      .sort((a: Room, b: Room) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  deleteRoom(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (room) {
      console.log(`Room supprimée: ${room.name} (${roomId})`);
      return this.rooms.delete(roomId);
    }
    return false;
  }

  addPlayerToRoom(roomId: string, playerId: string, playerName: string, character?: any, password?: string | null): any {
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room non trouvée');
    }

    if (room.isPrivate && room.password !== password) {
      throw new Error('Mot de passe incorrect');
    }

    if (room.status === 'completed') {
      throw new Error('Cette partie est terminée');
    }

  const player = room.addPlayer(playerId, playerName, character ?? undefined);
    console.log(`${playerName} a rejoint la room ${room.name} (${roomId})`);
    return player;
  }

  updatePlayerCharacter(roomId: string, playerId: string, character: any): any {
    const room = this.getRoomById(roomId);
    if (!room) throw new Error('Room non trouvée');
    return room.updatePlayerCharacter(playerId, character);
  }

  getPlayer(roomId: string, playerId: string): any {
    const room = this.getRoomById(roomId);
    if (!room) throw new Error('Room non trouvée');
    return room.players.find(p => p.id === playerId) || null;
  }

  removePlayerFromRoom(roomId: string, playerId: string): any {
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room non trouvée');
    }

    const removedPlayer = room.removePlayer(playerId);
    
    // Si c'était le GM qui quitte, supprimer la room
    if (playerId === room.gmId) {
      this.deleteRoom(roomId);
      console.log(`Le GM ${removedPlayer?.name} a quitté sa room ${room.name}, room supprimée`);
      return { roomDeleted: true, player: removedPlayer };
    }

    if (removedPlayer) {
      console.log(`${removedPlayer.name} a quitté la room ${room.name} (${roomId})`);
    }

    return { roomDeleted: false, player: removedPlayer };
  }

  updateRoomStatus(roomId: string, status: string): any {
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room non trouvée');
    }

    const oldStatus = room.status;
    room.status = status;
    room.updateActivity();
    
    console.log(`Statut de la room ${room.name} (${roomId}) changé de ${oldStatus} à ${status}`);
    return room;
  }

  addChatMessage(roomId: string, senderId: string, senderName: string, message: string): any {
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room non trouvée');
    }

    const isGM = senderId === room.gmId;
    const chatMessage = room.addChatMessage(senderId, senderName, message, isGM);
    
    console.log(`[${room.name}] ${senderName}${isGM ? ' (GM)' : ''}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
    return chatMessage;
  }

  updateGameData(roomId: string, updates: any): any {
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room non trouvée');
    }

    room.updateGameData(updates);
    console.log(`Données de jeu mises à jour pour la room ${room.name} (${roomId})`);
    return room;
  }

  // Nettoyer les rooms vides ou anciennes
  cleanupRooms(): number {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 heures
    const emptyRoomMaxAge = 2 * 60 * 60 * 1000; // 2 heures pour les rooms vides
    
    let cleanedCount = 0;

    for (const [roomId, room] of this.rooms.entries()) {
      let shouldDelete = false;
      let reason = '';

      // Supprimer les rooms vides depuis plus de 2 heures
  if (room.players.length === 0 && (now.getTime() - room.createdAt.getTime()) > emptyRoomMaxAge) {
        shouldDelete = true;
        reason = 'room vide depuis plus de 2 heures';
      }
      
      // Supprimer les rooms très anciennes sans activité récente
  else if ((now.getTime() - room.lastActivity.getTime()) > maxAge && room.status === 'waiting') {
        shouldDelete = true;
        reason = 'inactivité depuis plus de 24 heures';
      }
      
      // Supprimer les rooms terminées depuis plus de 24 heures
  else if (room.status === 'completed' && (now.getTime() - room.lastActivity.getTime()) > maxAge) {
        shouldDelete = true;
        reason = 'partie terminée depuis plus de 24 heures';
      }

      if (shouldDelete) {
        this.rooms.delete(roomId);
        cleanedCount++;
        console.log(`Room ${room.name} (${roomId}) nettoyée: ${reason}`);
      }
    }

    if (cleanedCount > 0) {
      console.log(`Nettoyage terminé: ${cleanedCount} room(s) supprimée(s)`);
    }

    return cleanedCount;
  }

  // Obtenir des statistiques
  getStats() {
    const rooms = Array.from(this.rooms.values());
    
    return {
      totalRooms: rooms.length,
      publicRooms: rooms.filter(r => !r.isPrivate).length,
      privateRooms: rooms.filter(r => r.isPrivate).length,
      activeRooms: rooms.filter(r => r.status === 'active').length,
      waitingRooms: rooms.filter(r => r.status === 'waiting').length,
      pausedRooms: rooms.filter(r => r.status === 'paused').length,
      completedRooms: rooms.filter(r => r.status === 'completed').length,
      totalPlayers: rooms.reduce((sum, room) => sum + room.players.length, 0),
      connectedPlayers: rooms.reduce((sum, room) => sum + room.getConnectedPlayers().length, 0)
    };
  }
}

// Instance singleton
const roomService = new RoomService();

// Nettoyage automatique toutes les heures
setInterval(() => {
  console.log('Démarrage du nettoyage automatique des rooms...');
  roomService.cleanupRooms();
}, 60 * 60 * 1000);

// Nettoyage au démarrage après 5 minutes
setTimeout(() => {
  console.log('Premier nettoyage automatique...');
  roomService.cleanupRooms();
}, 5 * 60 * 1000);

// [EXPORT] Export du service principal pour intégration dans les contrôleurs
export default roomService;