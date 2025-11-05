const express = require('express');
const router = express.Router();
const roomService = require('../services/roomService');
const scenarioService = require('../services/scenarioService');
const { v: uuidv } = require('uuid');

// GET /api/rooms - Obtenir toutes les rooms publiques
router.get('/', (req, res) => {
  try {
    const rooms = roomService.getPublicRooms();
    res.json({
      success: true,
      count: rooms.length,
      rooms: rooms.map(room => room.toPublicJSON())
    });
  } catch (error) {
    console.error('Erreur récupération rooms:', error);
    res.status().json({
      success: false,
      message: 'Erreur lors de la récupération des rooms',
      error: error.message
    });
  }
});

// GET /api/rooms/stats - Obtenir les statistiques des rooms
router.get('/stats', (req, res) => {
  try {
    const stats = roomService.getStats();
    res.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur récupération stats:', error);
    res.status().json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

// GET /api/rooms/gm/:gmId - Obtenir les rooms d'un GM
router.get('/gm/:gmId', (req, res) => {
  try {
    const rooms = roomService.getRoomsByGM(req.params.gmId);
    res.json({
      success: true,
      count: rooms.length,
      rooms: rooms.map(room => room.toJSON())
    });
  } catch (error) {
    console.error('Erreur récupération rooms GM:', error);
    res.status().json({
      success: false,
      message: 'Erreur lors de la récupération des rooms du GM',
      error: error.message
    });
  }
});

// GET /api/rooms/player/:playerId - Obtenir les rooms d'un joueur
router.get('/player/:playerId', (req, res) => {
  try {
    const rooms = roomService.getRoomsByPlayer(req.params.playerId);
    res.json({
      success: true,
      count: rooms.length,
      rooms: rooms.map(room => room.toJSON())
    });
  } catch (error) {
    console.error('Erreur récupération rooms joueur:', error);
    res.status().json({
      success: false,
      message: 'Erreur lors de la récupération des rooms du joueur',
      error: error.message
    });
  }
});

// GET /api/rooms/:roomId - Obtenir une room spécifique
router.get('/:roomId', (req, res) => {
  try {
    const room = roomService.getRoomById(req.params.roomId);
    if (!room) {
      return res.status().json({
        success: false,
        message: 'Room non trouvée'
      });
    }

    res.json({
      success: true,
      room: room.toJSON()
    });
  } catch (error) {
    console.error('Erreur récupération room:', error);
    res.status().json({
      success: false,
      message: 'Erreur lors de la récupération de la room',
      error: error.message
    });
  }
});

// POST /api/rooms - Créer une nouvelle room
router.post('/', (req, res) => {
  try {
    const { name, gmName, scenario, isPrivate = false, password } = req.body;
    
    // Validation des données
    if (!name || name.trim().length === ) {
      return res.status().json({
        success: false,
        message: 'Le nom de la room est requis'
      });
    }

    if (!gmName || gmName.trim().length === ) {
      return res.status().json({
        success: false,
        message: 'Le nom du GM est requis'
      });
    }

    if (name.length > ) {
      return res.status().json({
        success: false,
        message: 'Le nom de la room ne peut pas dépasser  caractères'
      });
    }

    if (isPrivate && (!password || password.trim().length === )) {
      return res.status().json({
        success: false,
        message: 'Un mot de passe est requis pour les rooms privées'
      });
    }

    const gmId = uuidv(); // Générer un ID unique pour le GM
    const room = roomService.createRoom(
      name.trim(), 
      gmId, 
      gmName.trim(), 
      scenario?.trim() || 'Scénario libre', 
      isPrivate, 
      password?.trim()
    );

    res.status().json({
      success: true,
      message: 'Room créée avec succès',
      room: room.toJSON(),
      gmId: gmId,
      accessToken: gmId
    });
  } catch (error) {
    console.error('Erreur création room:', error);
    res.status().json({
      success: false,
      message: 'Erreur lors de la création de la room',
      error: error.message
    });
  }
});

// POST /api/rooms/:roomId/join - Rejoindre une room
router.post('/:roomId/join', (req, res) => {
  try {
    const { playerName, character, password } = req.body;
    const roomId = req.params.roomId;
    
    // Validation des données
    if (!playerName || playerName.trim().length === ) {
      return res.status().json({
        success: false,
        message: 'Le nom du joueur est requis'
      });
    }

    if (playerName.length > ) {
      return res.status().json({
        success: false,
        message: 'Le nom du joueur ne peut pas dépasser  caractères'
      });
    }

    const playerId = uuidv();
    const player = roomService.addPlayerToRoom(
      roomId, 
      playerId, 
      playerName.trim(), 
      character, 
      password?.trim()
    );
    const room = roomService.getRoomById(roomId);

    res.json({
      success: true,
      message: 'Vous avez rejoint la room avec succès',
      playerId: playerId,
      player: player,
      room: room.toJSON(),
      accessToken: playerId
    });
  } catch (error) {
    console.error('Erreur rejoindre room:', error);
    const statusCode = error.message.includes('mot de passe') ?  : 
                      error.message.includes('pleine') ?  : ;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/rooms/:roomId/leave - Quitter une room
router.post('/:roomId/leave', (req, res) => {
  try {
    const { playerId } = req.body;
    const roomId = req.params.roomId;
    
    if (!playerId) {
      return res.status().json({
        success: false,
        message: 'L\'ID du joueur est requis'
      });
    }

    const result = roomService.removePlayerFromRoom(roomId, playerId);

    if (result.roomDeleted) {
      res.json({
        success: true,
        message: 'Room supprimée car le GM l\'a quittée',
        roomDeleted: true
      });
    } else {
      const room = roomService.getRoomById(roomId);
      res.json({
        success: true,
        message: 'Vous avez quitté la room',
        roomDeleted: false,
        room: room ? room.toJSON() : null
      });
    }
  } catch (error) {
    console.error('Erreur quitter room:', error);
    res.status().json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/rooms/:roomId/status - Changer le statut d'une room (GM seulement)
router.put('/:roomId/status', (req, res) => {
  try {
    const { status, gmId } = req.body;
    const roomId = req.params.roomId;
    
    const room = roomService.getRoomById(roomId);
    if (!room) {
      return res.status().json({
        success: false,
        message: 'Room non trouvée'
      });
    }

    if (room.gmId !== gmId) {
      return res.status().json({
        success: false,
        message: 'Seul le GM peut changer le statut de la room'
      });
    }

    const validStatuses = ['waiting', 'active', 'paused', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status().json({
        success: false,
        message: 'Statut invalide. Valeurs autorisées: ' + validStatuses.join(', ')
      });
    }

    const updatedRoom = roomService.updateRoomStatus(roomId, status);

    res.json({
      success: true,
      message: `Statut de la room changé à: ${status}`,
      room: updatedRoom.toJSON()
    });
  } catch (error) {
    console.error('Erreur changement statut:', error);
    res.status().json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
});

// DELETE /api/rooms/:roomId - Supprimer une room (GM seulement)
router.delete('/:roomId', (req, res) => {
  try {
    const { gmId } = req.body;
    const roomId = req.params.roomId;
    
    const room = roomService.getRoomById(roomId);
    if (!room) {
      return res.status().json({
        success: false,
        message: 'Room non trouvée'
      });
    }

    if (room.gmId !== gmId) {
      return res.status().json({
        success: false,
        message: 'Seul le GM peut supprimer sa room'
      });
    }

    const deleted = roomService.deleteRoom(roomId);
    
    if (deleted) {
      res.json({
        success: true,
        message: 'Room supprimée avec succès'
      });
    } else {
      res.status().json({
        success: false,
        message: 'Erreur lors de la suppression de la room'
      });
    }
  } catch (error) {
    console.error('Erreur suppression room:', error);
    res.status().json({
      success: false,
      message: 'Erreur lors de la suppression de la room',
      error: error.message
    });
  }
});

module.exports = router;

// Routes avancées pour session + scénario
// POST /api/rooms/with-scenario - Créer une room et attacher un scénario (id, objet, ou génération)
router.post('/with-scenario', (req, res) => {
  try {
    const { name, gmName, isPrivate = false, password, scenarioId, scenario, generate } = req.body || {};

    if (!name || !gmName) {
      return res.status().json({ success: false, message: 'name et gmName sont requis' });
    }

    const gmId = uuidv();

    // Préparer le scénario
    let scenarioData = null;
    if (scenarioId) {
      const found = scenarioService.get(scenarioId);
      if (!found) return res.status().json({ success: false, message: 'Scénario introuvable' });
      scenarioData = found.toJSON ? found.toJSON() : found;
    } else if (generate) {
      // generate peut être true ou un objet d'options
      const created = scenarioService.generate(typeof generate === 'object' ? generate : {});
      scenarioData = created;
    } else if (scenario) {
      // si fournit une structure de scénario, on la (ré)crée côté service
      scenarioData = scenarioService.create(scenario);
    }

    const room = roomService.createRoom(
      name.trim(),
      gmId,
      gmName.trim(),
      scenarioData || 'Scénario libre',
      isPrivate,
      password?.trim()
    );

    res.status().json({
      success: true,
      room: room.toJSON(),
      gmId,
      scenario: room.scenario,
    });
  } catch (error) {
    console.error('Erreur création room with-scenario:', error);
    res.status().json({ success: false, message: error.message });
  }
});

// PUT /api/rooms/:roomId/scenario/scene - Définir la scène courante
router.put('/:roomId/scenario/scene', (req, res) => {
  try {
    const { sceneIndex, title } = req.body || {};
    const room = roomService.getRoomById(req.params.roomId);
    if (!room) return res.status().json({ success: false, message: 'Room non trouvée' });

    // Accepte soit un index de scène, soit un titre
    let currentScene = null;
    const scenariosScenes = room?.scenario?.scenes;
    if (Array.isArray(scenariosScenes)) {
      if (typeof sceneIndex === 'number' && scenariosScenes[sceneIndex]) {
        currentScene = { index: sceneIndex, ...scenariosScenes[sceneIndex] };
      } else if (title) {
        const idx = scenariosScenes.findIndex(s => s.title === title);
        if (idx >= ) currentScene = { index: idx, ...scenariosScenes[idx] };
      }
    }

    // Mettre à jour la scène et l'historique
    const entry = (currentScene || title) ? {
      index: currentScene?.index ?? null,
      title: currentScene?.title || title || null,
      at: new Date(),
      by: 'HTTP'
    } : null;

    const history = Array.isArray(room.gameData.scenesHistory) ? room.gameData.scenesHistory.slice() : [];
    if (entry) history.push(entry);
    if (history.length > ) history.splice(, history.length - );

    room.updateGameData({ currentScene: currentScene || (title ? { title } : null), scenesHistory: history });

    res.json({ success: true, room: room.toJSON() });
  } catch (error) {
    console.error('Erreur update current scene:', error);
    res.status().json({ success: false, message: error.message });
  }
});