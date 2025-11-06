/**
 * [DEV SENIOR] Handler Socket.io - gestion des connexions, événements et stats WebSocket.
 * - Centralise la logique temps réel, sécurité et monitoring des sessions.
 * - Adapter la configuration selon les besoins métier et la charge attendue.
 */

// [IMPORTS] Import des modules nécessaires pour la gestion des sockets et des services
import { Server, Socket } from 'socket.io';
import { RoomService } from './roomService.js';
import { ScenarioService } from './scenarioService.js';

const roomService = new RoomService();
const scenarioService = new ScenarioService();

// Gestion des connexions WebSocket pour GameMaster L5R
type UserInfo = {
  userId: string;
  roomId: string;
  userType: 'gm' | 'player';
  userName: string;
  connectedAt: Date;
};

function socketHandler(io: Server, wsAuth: any) {
  // Map pour associer les socket IDs aux users
  const connectedUsers = new Map<string, UserInfo>();

  io.on('connection', (socket) => {
  // Utilisation de socket.data pour stocker les infos utilisateur (Socket.IO v4+)
  const userData = (socket as any).data?.userData || { userId: socket.id, userName: 'Guest', authenticated: false };
    const ip = socket.handshake.address;
    
    console.log(`Nouvelle connexion WebSocket: ${socket.id} (${userData.userName}) - IP: ${ip}`);
    
    // Gestion de la déconnexion pour nettoyer le tracking
    socket.on('disconnect', () => {
      if (wsAuth) {
        wsAuth.onDisconnect(socket);
      }
      connectedUsers.delete(socket.id);
      console.log(`Déconnexion: ${socket.id}`);
    });

    // Rejoindre une room
    // =============================
    // Compatibilité JDR-test (front GitHub Pages)
    // Implémente les événements utilisés par le front:
    // - create-room (ack)
    // - list-rooms (ack)
    // - find-room (ack)
    // - join-room (ack)
    // - chat (broadcast)
    // - dice (broadcast)
    // Ces événements cohabitent avec les événements natifs existants.
    // =============================

    // Créer une room (ack via callback)
    socket.on('create-room', (data, callback) => {
      try {
        const { name, gmId, gmName, maxPlayers = 6, isPublic = true, scenarioId, scenario, generateScenario, generateOptions } = data || {};
        if (!name || !gmId || !gmName) {
          return callback && callback({ ok: false, error: 'Paramètres manquants (name, gmId, gmName)' });
        }

        // Préparer le scénario si fourni/demandé
        let scenarioData = null;
        try {
          if (scenarioId) {
            const found = scenarioService.get(scenarioId);
            if (found) scenarioData = found.toJSON ? found.toJSON() : found;
          } else if (generateScenario || generateOptions) {
            const created = scenarioService.generate(generateOptions || {});
            scenarioData = created;
          } else if (typeof scenario === 'object' && scenario) {
            // Si un objet scénario est passé directement
            const created = scenarioService.create(scenario);
            scenarioData = created;
          } else if (typeof scenario === 'string') {
            scenarioData = scenario; // simple titre/label
          }
        } catch (e) {
          console.warn('create-room: scénario ignoré suite à erreur:', (e as Error).message);
        }

  // Si scenarioData est null, passer une chaîne vide
        // Convertir scenarioData en string si nécessaire
        let scenarioString: string = '';
        if (typeof scenarioData === 'string') {
          scenarioString = scenarioData;
        } else if (scenarioData && typeof scenarioData === 'object') {
          scenarioString = JSON.stringify(scenarioData);
        }
        const room = roomService.createRoom(name, gmId, gmName, scenarioString);
        // Ajuster options de la room selon la demande du front
        room.maxPlayers = Math.max(1, Math.min(10, Number(maxPlayers) || 6));
        room.isPrivate = !isPublic;

        // Notifier tous les clients comme dans le serveur de référence JDR-test
        io.emit('room-created', room.toPublicJSON());

        callback && callback({ ok: true, room: room.toJSON() });
      } catch (error) {
        console.error('Erreur create-room:', error);
  callback && callback({ ok: false, error: (error as Error).message });
      }
    });

    // Lister les rooms publiques (ack)
    socket.on('list-rooms', (callback) => {
      try {
        const rooms = roomService.getPublicRooms();
  callback && callback({ ok: true, rooms: rooms.map((r: any) => r.toPublicJSON()) });
      } catch (error) {
        console.error('Erreur list-rooms:', error);
  callback && callback({ ok: false, error: (error as Error).message });
      }
    });

    // Chercher une room par ID (ack)
    socket.on('find-room', (roomId, callback) => {
      try {
        const room = roomService.getRoomById(roomId);
        if (!room) return callback && callback({ ok: false, error: 'Session introuvable' });
        callback && callback({ ok: true, room: room.toJSON() });
      } catch (error) {
        console.error('Erreur find-room:', error);
  callback && callback({ ok: false, error: (error as Error).message });
      }
    });
    socket.on('join-room', (data, callback) => {
      try {
        const { roomId, userId, userType, userName, character } = data; // userType: 'gm' ou 'player'
        
        const room = roomService.getRoomById(roomId);
        if (!room) {
          const errPayload = { type: 'ROOM_NOT_FOUND', message: 'Room non trouvée' };
          if (typeof callback === 'function') return callback({ ok: false, error: errPayload.message });
          socket.emit('error', errPayload);
          return;
        }

        // Vérifier si l'utilisateur a le droit de rejoindre cette room
        const isGM = room.gmId === userId;
  let isPlayer = room.players.some((p: any) => p.id === userId);

        // Compat: si le joueur n'existe pas encore et que c'est un player, tenter l'ajout auto
        if (!isGM && !isPlayer && userType === 'player') {
          try {
            roomService.addPlayerToRoom(roomId, userId, userName, character || null);
            isPlayer = true;
          } catch (e) {
            const errPayload = { type: 'JOIN_ERROR', message: (e as Error).message };
            if (typeof callback === 'function') return callback({ ok: false, error: (e as Error).message });
            socket.emit('error', errPayload);
            return;
          }
        }

        if (!isGM && !isPlayer) {
          const errPayload = { type: 'ACCESS_DENIED', message: 'Vous n\'êtes pas autorisé à rejoindre cette room' };
          if (typeof callback === 'function') return callback({ ok: false, error: errPayload.message });
          socket.emit('error', errPayload);
          return;
        }

        // Rejoindre la room Socket.IO
        socket.join(roomId);
        
        // Enregistrer la connexion
        connectedUsers.set(socket.id, {
          userId,
          roomId,
          userType: isGM ? 'gm' : 'player',
          userName,
          connectedAt: new Date()
        });

        // Mettre à jour le statut de connexion du joueur
        if (isPlayer) {
          room.updatePlayerConnection(userId, true);
        }

        console.log(`${userName} (${isGM ? 'GM' : 'Joueur'}) a rejoint la room ${room.name} (${roomId})`);

        // Notifier les autres utilisateurs de la room
        socket.to(roomId).emit('user-joined', {
          userId,
          userName,
          userType: isGM ? 'gm' : 'player',
          room: room.toJSON(),
          timestamp: new Date()
        });

        const joinPayload = {
          success: true,
          room: room.toJSON(),
          userType: isGM ? 'gm' : 'player',
          chatHistory: room.chat.slice(-50),
          timestamp: new Date()
        };

        if (typeof callback === 'function') {
          callback({ ok: true, room: room.toJSON() });
        } else {
          // Confirmer la connexion à l'utilisateur (événement natif)
          socket.emit('room-joined', joinPayload);
        }

      } catch (error) {
        console.error('Erreur lors de la connexion à la room:', error);
  if (typeof callback === 'function') return callback({ ok: false, error: (error as Error).message });
  socket.emit('error', { type: 'JOIN_ERROR', message: (error as Error).message });
      }
    });

    // Mettre à jour le personnage du joueur (compat sessions utilisateur)
    // Attendu: { roomId, userId, character }
    socket.on('update-character', (data, callback) => {
      try {
        const { roomId, userId, character } = data || {};
        if (!roomId || !userId || !character) {
          return callback && callback({ ok: false, error: 'Paramètres manquants (roomId, userId, character)' });
        }

        const userInfo = connectedUsers.get(socket.id);
        // Autoriser GM à mettre à jour n'importe quel joueur, un joueur seulement lui-même
        const isAllowed = userInfo && userInfo.roomId === roomId && (userInfo.userType === 'gm' || userInfo.userId === userId);
        if (!isAllowed) {
          if (typeof callback === 'function') return callback({ ok: false, error: 'Accès refusé' });
          return socket.emit('error', { type: 'ACCESS_DENIED', message: 'Accès refusé' });
        }

        const updated = roomService.updatePlayerCharacter(roomId, userId, character);
        // Diffuser à la room
        io.to(roomId).emit('character-updated', { roomId, player: updated });
        callback && callback({ ok: true, player: updated });

      } catch (error) {
        console.error('Erreur update-character:', error);
  if (typeof callback === 'function') return callback({ ok: false, error: (error as Error).message });
  socket.emit('error', { type: 'CHARACTER_UPDATE_ERROR', message: (error as Error).message });
      }
    });

    // Quitter une room
    socket.on('leave-room', (data) => {
      try {
        const userInfo = connectedUsers.get(socket.id);
        if (!userInfo) return;

        const { roomId, userId } = userInfo;
        const room = roomService.getRoomById(roomId);

        if (room) {
          // Mettre à jour le statut de connexion
          room.updatePlayerConnection(userId, false);

          // Notifier les autres utilisateurs
          socket.to(roomId).emit('user-left', {
            userId,
            userName: userInfo.userName,
            userType: userInfo.userType,
            room: room.toJSON(),
            timestamp: new Date()
          });
        }

        socket.leave(roomId);
        connectedUsers.delete(socket.id);

        console.log(`${userInfo.userName} a quitté la room ${roomId}`);

      } catch (error) {
        console.error('Erreur lors de la déconnexion de la room:', error);
      }
    });

    // Envoyer un message de chat
    socket.on('chat-message', (data) => {
      try {
        const { roomId, message } = data;
        const userInfo = connectedUsers.get(socket.id);
        
        if (!userInfo) {
          socket.emit('error', { 
            type: 'NOT_CONNECTED',
            message: 'Vous devez être connecté à une room' 
          });
          return;
        }

        if (!message || message.trim().length === 0) {
          socket.emit('error', { 
            type: 'EMPTY_MESSAGE',
            message: 'Le message ne peut pas être vide' 
          });
          return;
        }

        if (message.length > 500) {
          socket.emit('error', { 
            type: 'MESSAGE_TOO_LONG',
            message: 'Le message est trop long (max 500 caractères)' 
          });
          return;
        }

        const chatMessage = roomService.addChatMessage(
          roomId,
          userInfo.userId,
          userInfo.userName,
          message.trim()
        );

        // Diffuser le message à tous les utilisateurs de la room
        io.to(roomId).emit('chat-message', chatMessage);

      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        socket.emit('error', { 
          type: 'CHAT_ERROR',
          message: (error as Error).message
        });
      }
    });

    // Compatibilité: événement 'chat' (JDR-test)
    socket.on('chat', (data) => {
      try {
        const { roomId, message } = data || {};
        if (!message || !message.text) return;
        // Ajouter au chat interne pour l'historique
        roomService.addChatMessage(roomId, message.userId, message.userName, message.text);
        // Relayer tel quel pour le front existant
        io.to(roomId).emit('chat', message);
      } catch (error) {
        console.error('Erreur chat (compatibilité):', error);
      }
    });

    // Changer le statut de la room (GM seulement)
    socket.on('change-room-status', (data) => {
      try {
        const { roomId, status } = data;
        const userInfo = connectedUsers.get(socket.id);
        
        if (!userInfo || userInfo.userType !== 'gm') {
          socket.emit('error', { 
            type: 'GM_ONLY',
            message: 'Seul le GM peut changer le statut de la room' 
          });
          return;
        }

        const validStatuses = ['waiting', 'active', 'paused', 'completed'];
        if (!validStatuses.includes(status)) {
          socket.emit('error', { 
            type: 'INVALID_STATUS',
            message: 'Statut invalide' 
          });
          return;
        }

        const room = roomService.updateRoomStatus(roomId, status);

        // Notifier tous les utilisateurs du changement de statut
        io.to(roomId).emit('room-status-changed', {
          status,
          room: room.toJSON(),
          changedBy: userInfo.userName,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Erreur lors du changement de statut:', error);
        socket.emit('error', { 
          type: 'STATUS_ERROR',
          message: (error as Error).message
        });
      }
    });

    // Actions spécifiques au GM
    socket.on('gm-action', (data) => {
      try {
        const userInfo = connectedUsers.get(socket.id);
        
        if (!userInfo || userInfo.userType !== 'gm') {
          socket.emit('error', { 
            type: 'GM_ONLY',
            message: 'Action réservée au GM' 
          });
          return;
        }

        const { roomId, action, payload } = data;

        // Valider l'action
        const validActions = [
          'scene-change', 'npc-action', 'initiative-update', 
          'condition-add', 'condition-remove', 'game-update'
        ];
        
        if (!validActions.includes(action)) {
          socket.emit('error', { 
            type: 'INVALID_ACTION',
            message: 'Action GM invalide' 
          });
          return;
        }

        // Diffuser l'action du GM à tous les joueurs
        socket.to(roomId).emit('gm-action', {
          action,
          payload,
          gmName: userInfo.userName,
          timestamp: new Date()
        });

        console.log(`Action GM ${action} dans la room ${roomId} par ${userInfo.userName}`);

      } catch (error) {
        console.error('Erreur lors de l\'action GM:', error);
        socket.emit('error', { 
          type: 'GM_ACTION_ERROR',
          message: (error as Error).message
        });
      }
    });

    // Définir la scène courante du scénario (GM seulement)
    // Attendu: { roomId, sceneIndex?: number, title?: string }
    socket.on('set-current-scene', (data, callback) => {
      try {
        const userInfo = connectedUsers.get(socket.id);
        if (!userInfo || userInfo.userType !== 'gm') {
          if (typeof callback === 'function') return callback({ ok: false, error: 'Action réservée au GM' });
          return socket.emit('error', { type: 'GM_ONLY', message: 'Action réservée au GM' });
        }

        const { roomId, sceneIndex, title } = data || {};
        const room = roomService.getRoomById(roomId);
        if (!room) {
          if (typeof callback === 'function') return callback({ ok: false, error: 'Room non trouvée' });
          return socket.emit('error', { type: 'ROOM_NOT_FOUND', message: 'Room non trouvée' });
        }

        // Trouver la scène dans room.scenario.scenes si possible
        let currentScene = null;
  // Vérifier que scenario est un objet et possède scenes
  const scenarioObj = typeof room?.scenario === 'object' && room?.scenario !== null ? room.scenario as any : null;
  const scenes = Array.isArray(scenarioObj?.scenes) ? scenarioObj.scenes : null;
        if (scenes) {
          if (typeof sceneIndex === 'number' && scenes[sceneIndex]) {
            currentScene = { index: sceneIndex, ...scenes[sceneIndex] };
          } else if (title) {
            const idx = scenes.findIndex((s: any) => s.title === title);
            if (idx >= 0) currentScene = { index: idx, ...scenes[idx] };
          }
        }

        // Si aucune scène trouvée mais un titre fourni, stocker un stub
        if (!currentScene && title) {
          currentScene = { title };
        }

        // Mettre à jour la scène courante et l'historique
        const historyEntry = currentScene ? {
          index: currentScene.index ?? null,
          title: currentScene.title || (currentScene?.description ? undefined : null),
          at: new Date(),
          by: userInfo.userName
        } : { title, at: new Date(), by: userInfo.userName };

        const history = Array.isArray(room.gameData.scenesHistory) ? room.gameData.scenesHistory.slice() : [];
        history.push(historyEntry);
        if (history.length > 100) history.splice(0, history.length - 100);

        room.updateGameData({ currentScene: currentScene, scenesHistory: history });

        // Diffuser aux clients de la room
        io.to(roomId).emit('scene-changed', {
          roomId,
          currentScene,
          by: userInfo.userName,
          timestamp: new Date()
        });

        if (typeof callback === 'function') return callback({ ok: true, currentScene });

      } catch (error) {
        console.error('Erreur set-current-scene:', error);
  if (typeof callback === 'function') return callback({ ok: false, error: (error as Error).message });
  socket.emit('error', { type: 'SCENE_SET_ERROR', message: (error as Error).message });
      }
    });

    // Actions des joueurs
    socket.on('player-action', (data) => {
      try {
        const userInfo = connectedUsers.get(socket.id);
        
        if (!userInfo || userInfo.userType !== 'player') {
          socket.emit('error', { 
            type: 'PLAYER_ONLY',
            message: 'Action réservée aux joueurs' 
          });
          return;
        }

        const { roomId, action, payload } = data;

        // Valider l'action
        const validActions = [
          'roll-dice', 'use-skill', 'cast-spell', 'attack', 
          'defend', 'move', 'interact', 'initiative'
        ];
        
        if (!validActions.includes(action)) {
          socket.emit('error', { 
            type: 'INVALID_ACTION',
            message: 'Action joueur invalide' 
          });
          return;
        }

        // Diffuser l'action du joueur au GM et aux autres joueurs
        socket.to(roomId).emit('player-action', {
          playerId: userInfo.userId,
          playerName: userInfo.userName,
          action,
          payload,
          timestamp: new Date()
        });

        console.log(`Action joueur ${action} de ${userInfo.userName} dans la room ${roomId}`);

      } catch (error) {
        console.error('Erreur lors de l\'action joueur:', error);
        socket.emit('error', { 
          type: 'PLAYER_ACTION_ERROR',
          message: (error as Error).message
        });
      }
    });

    // Lancer des dés
    socket.on('roll-dice', (data) => {
      try {
        const userInfo = connectedUsers.get(socket.id);
        if (!userInfo) return;

        const { roomId, diceType, numberOfDice, modifier = 0, description = '', isPrivate = false } = data;

        // Validation
        if (!diceType || ![2, 4, 6, 8, 10, 12, 20, 100].includes(diceType)) {
          socket.emit('error', { 
            type: 'INVALID_DICE',
            message: 'Type de dé invalide' 
          });
          return;
        }

        if (!numberOfDice || numberOfDice < 1 || numberOfDice > 100) {
          socket.emit('error', { 
            type: 'INVALID_DICE_COUNT',
            message: 'Nombre de dés invalide (1-100)' 
          });
          return;
        }

        if (modifier < -100 || modifier > 100) {
          socket.emit('error', { 
            type: 'INVALID_MODIFIER',
            message: 'Modificateur invalide (-100 à +100)' 
          });
          return;
        }

        // Simuler le lancer de dés
        const results = [];
        let total = 0;

        for (let i = 0; i < numberOfDice; i++) {
          const roll = Math.floor(Math.random() * diceType) + 1;
          results.push(roll);
          total += roll;
        }

        total += modifier;

        const rollResult = {
          rollerId: userInfo.userId,
          rollerName: userInfo.userName,
          rollerType: userInfo.userType,
          diceType,
          numberOfDice,
          modifier,
          results,
          total,
          description: description.trim(),
          isPrivate,
          timestamp: new Date()
        };

        // Diffuser le résultat
        if (isPrivate && userInfo.userType === 'player') {
          // Jet privé : seulement au joueur et au GM
          socket.emit('dice-rolled', rollResult);
          // Trouver le socket du GM et lui envoyer
          for (const [socketId, user] of connectedUsers.entries()) {
            if (user.roomId === roomId && user.userType === 'gm') {
              io.to(socketId).emit('dice-rolled', rollResult);
              break;
            }
          }
        } else {
          // Jet public : à tous les utilisateurs de la room
          io.to(roomId).emit('dice-rolled', rollResult);
        }

        console.log(`${userInfo.userName} a lancé ${numberOfDice}d${diceType}${modifier >= 0 ? '+' : ''}${modifier}: ${total}${isPrivate ? ' (privé)' : ''}`);

      } catch (error) {
        console.error('Erreur lors du lancer de dés:', error);
        socket.emit('error', { 
          type: 'DICE_ERROR',
          message: (error as Error).message
        });
      }
    });

    // Compatibilité: événement 'dice' (JDR-test)
    socket.on('dice', (data) => {
      try {
        const { roomId, roll } = data || {};
        if (!roomId || !roll) return;
        // Relayer tel quel pour le front existant
        io.to(roomId).emit('dice', roll);
      } catch (error) {
        console.error('Erreur dice (compatibilité):', error);
      }
    });

    // Ping/Pong pour maintenir la connexion
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    // Obtenir les utilisateurs connectés dans une room
    socket.on('get-room-users', (data) => {
      try {
        const { roomId } = data;
        const userInfo = connectedUsers.get(socket.id);
        
        if (!userInfo || userInfo.roomId !== roomId) {
          socket.emit('error', { 
            type: 'ACCESS_DENIED',
            message: 'Vous n\'êtes pas dans cette room' 
          });
          return;
        }

        const roomUsers = Array.from(connectedUsers.values())
          .filter(user => user.roomId === roomId)
          .map(user => ({
            userId: user.userId,
            userName: user.userName,
            userType: user.userType,
            connectedAt: user.connectedAt
          }));

        socket.emit('room-users', {
          roomId,
          users: roomUsers,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Erreur récupération utilisateurs room:', error);
        socket.emit('error', { 
          type: 'USERS_ERROR',
          message: (error as Error).message
        });
      }
    });

    // Déconnexion
    socket.on('disconnect', (reason) => {
      try {
        const userInfo = connectedUsers.get(socket.id);
        
        if (userInfo) {
          const { roomId, userId, userName } = userInfo;
          const room = roomService.getRoomById(roomId);

          if (room) {
            // Mettre à jour le statut de connexion
            room.updatePlayerConnection(userId, false);

            // Notifier les autres utilisateurs
            socket.to(roomId).emit('user-disconnected', {
              userId,
              userName,
              userType: userInfo.userType,
              room: room.toJSON(),
              reason: reason,
              timestamp: new Date()
            });
          }

          connectedUsers.delete(socket.id);
          console.log(`${userName} s'est déconnecté de la room ${roomId} (raison: ${reason})`);
        }

        console.log(`Connexion fermée: ${socket.id} (raison: ${reason})`);

      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
      }
    });
  });

  // Fonction utilitaire pour obtenir les statistiques des connexions
  // Fonction utilitaire pour obtenir les statistiques des connexions
  function getConnectionStats() {
    const stats = {
      totalConnections: connectedUsers.size,
      connectionsByRoom: {} as { [roomId: string]: number },
      connectionsByType: { gm: 0, player: 0 },
      connectionsDetails: [] as Array<{
        socketId: string;
        userId: string;
        userName: string;
        userType: 'gm' | 'player';
        roomId: string;
        connectedAt: Date;
        connectedDuration: number;
      }>
    };

    for (const [socketId, userInfo] of connectedUsers.entries()) {
      // Par room
      if (userInfo.roomId) {
        const roomId = userInfo.roomId as string;
        if (typeof stats.connectionsByRoom[roomId] !== 'number') {
          stats.connectionsByRoom[roomId] = 0;
        }
        stats.connectionsByRoom[roomId]!++;
      }

      // Par type
      stats.connectionsByType[userInfo.userType]++;

      // Détails
      stats.connectionsDetails.push({
        socketId,
        userId: userInfo.userId,
        userName: userInfo.userName,
        userType: userInfo.userType,
        roomId: userInfo.roomId,
        connectedAt: userInfo.connectedAt,
        connectedDuration: new Date().getTime() - userInfo.connectedAt.getTime()
      });
    }

    return stats;
  }

  // Heartbeat pour nettoyer les connexions fantômes
  setInterval(() => {
    const now = new Date();
    for (const [socketId, userInfo] of connectedUsers.entries()) {
      const socket = io.sockets.sockets.get(socketId);
      if (!socket || !socket.connected) {
        console.log(`Nettoyage connexion fantôme: ${userInfo.userName} (${socketId})`);
        connectedUsers.delete(socketId);
        
        // Mettre à jour le statut dans la room
        const room = roomService.getRoomById(userInfo.roomId);
        if (room) {
          room.updatePlayerConnection(userInfo.userId, false);
        }
      }
    }
  }, 60000); // Toutes les 60 secondes

  console.log('Gestionnaire WebSocket GameMaster L5R initialisé');
}

// [EXPORT] Export du handler principal pour intégration dans le serveur
export default socketHandler;