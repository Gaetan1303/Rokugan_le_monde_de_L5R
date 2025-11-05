// Service de gestion des rooms GameMaster en mémoire
class RoomService {
  constructor() {
    this.rooms = new Map();
    console.log('Service de gestion des rooms GameMaster initialisé');
  }

  createRoom(name, gmId, gmName, scenario = null, isPrivate = false, password = null) {
    const Room = require('../models/Room');
    const room = new Room(name, gmId, gmName, scenario);
    
    room.isPrivate = isPrivate;
    room.password = password;
    
    this.rooms.set(room.id, room);
    console.log(`Nouvelle room créée: ${room.name} (${room.id}) par ${gmName}`);
    return room;
  }

  getRoomById(roomId) {
    return this.rooms.get(roomId);
  }

  getAllRooms() {
    return Array.from(this.rooms.values());
  }

  getPublicRooms() {
    return Array.from(this.rooms.values())
      .filter(room => !room.isPrivate)
      .sort((a, b) => b.lastActivity - a.lastActivity); // Trier par activité récente
  }

  getRoomsByGM(gmId) {
    return Array.from(this.rooms.values())
      .filter(room => room.gmId === gmId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getRoomsByPlayer(playerId) {
    return Array.from(this.rooms.values())
      .filter(room => room.players.some(player => player.id === playerId))
      .sort((a, b) => b.lastActivity - a.lastActivity);
  }

  deleteRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      console.log(`Room supprimée: ${room.name} (${roomId})`);
      return this.rooms.delete(roomId);
    }
    return false;
  }

  addPlayerToRoom(roomId, playerId, playerName, character = null, password = null) {
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

    const player = room.addPlayer(playerId, playerName, character);
    console.log(`${playerName} a rejoint la room ${room.name} (${roomId})`);
    return player;
  }

  updatePlayerCharacter(roomId, playerId, character) {
    const room = this.getRoomById(roomId);
    if (!room) throw new Error('Room non trouvée');
    return room.updatePlayerCharacter(playerId, character);
  }

  getPlayer(roomId, playerId) {
    const room = this.getRoomById(roomId);
    if (!room) throw new Error('Room non trouvée');
    return room.players.find(p => p.id === playerId) || null;
  }

  removePlayerFromRoom(roomId, playerId) {
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

  updateRoomStatus(roomId, status) {
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

  addChatMessage(roomId, senderId, senderName, message) {
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room non trouvée');
    }

    const isGM = senderId === room.gmId;
    const chatMessage = room.addChatMessage(senderId, senderName, message, isGM);
    
    console.log(`[${room.name}] ${senderName}${isGM ? ' (GM)' : ''}: ${message.substring(, )}${message.length >  ? '...' : ''}`);
    return chatMessage;
  }

  updateGameData(roomId, updates) {
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room non trouvée');
    }

    room.updateGameData(updates);
    console.log(`Données de jeu mises à jour pour la room ${room.name} (${roomId})`);
    return room;
  }

  // Nettoyer les rooms vides ou anciennes
  cleanupRooms() {
    const now = new Date();
    const maxAge =  *  *  * ; //  heures
    const emptyRoomMaxAge =  *  *  * ; //  heures pour les rooms vides
    
    let cleanedCount = ;

    for (const [roomId, room] of this.rooms.entries()) {
      let shouldDelete = false;
      let reason = '';

      // Supprimer les rooms vides depuis plus de  heures
      if (room.players.length ===  && (now - room.createdAt) > emptyRoomMaxAge) {
        shouldDelete = true;
        reason = 'room vide depuis plus de  heures';
      }
      
      // Supprimer les rooms très anciennes sans activité récente
      else if ((now - room.lastActivity) > maxAge && room.status === 'waiting') {
        shouldDelete = true;
        reason = 'inactivité depuis plus de  heures';
      }
      
      // Supprimer les rooms terminées depuis plus de  heures
      else if (room.status === 'completed' && (now - room.lastActivity) > maxAge) {
        shouldDelete = true;
        reason = 'partie terminée depuis plus de  heures';
      }

      if (shouldDelete) {
        this.rooms.delete(roomId);
        cleanedCount++;
        console.log(`Room ${room.name} (${roomId}) nettoyée: ${reason}`);
      }
    }

    if (cleanedCount > ) {
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
      totalPlayers: rooms.reduce((sum, room) => sum + room.players.length, ),
      connectedPlayers: rooms.reduce((sum, room) => sum + room.getConnectedPlayers().length, )
    };
  }
}

// Instance singleton
const roomService = new RoomService();

// Nettoyage automatique toutes les heures
setInterval(() => {
  console.log('Démarrage du nettoyage automatique des rooms...');
  roomService.cleanupRooms();
},  *  * );

// Nettoyage au démarrage après  minutes
setTimeout(() => {
  console.log('Premier nettoyage automatique...');
  roomService.cleanupRooms();
},  *  * );

module.exports = roomService;