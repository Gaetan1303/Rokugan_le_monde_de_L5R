const express = require('express');
const router = express.Router();
const roomService = require('../services/roomService');
const scenarioService = require('../services/scenarioService');
const { v: uuidv } = require('uuid');

// GET /api/rooms - Obtenir toutes les rooms publiques
import type { Request, Response } from 'express';

router.get('/', (req: Request, res: Response) => {
  try {
    const rooms = roomService.getPublicRooms();
    res.json({
      success: true,
      count: rooms.length,
  rooms: rooms.map((room: any) => room.toPublicJSON())
    });
  } catch (error) {
    console.error('Erreur récupération rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rooms',
  error: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /api/rooms/stats - Obtenir les statistiques des rooms
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = roomService.getStats();
    res.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur récupération stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
  error: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /api/rooms/gm/:gmId - Obtenir les rooms d'un GM
router.get('/gm/:gmId', (req: Request, res: Response) => {
  try {
    const rooms = roomService.getRoomsByGM(req.params.gmId);
    res.json({
      success: true,
      count: rooms.length,
  rooms: rooms.map((room: any) => room.toJSON())
    });
  } catch (error) {
    console.error('Erreur récupération rooms GM:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rooms du GM',
  error: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /api/rooms/player/:playerId - Obtenir les rooms d'un joueur
router.get('/player/:playerId', (req: Request, res: Response) => {
  try {
    const rooms = roomService.getRoomsByPlayer(req.params.playerId);
    res.json({
      success: true,
      count: rooms.length,
  rooms: rooms.map((room: any) => room.toJSON())
    });
  } catch (error) {
    console.error('Erreur récupération rooms joueur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rooms du joueur',
  error: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /api/rooms/:roomId - Obtenir une room spécifique
router.get('/:roomId', (req: Request, res: Response) => {
  try {
    const room = roomService.getRoomById(req.params.roomId);
    if (!room) {
      return res.status(404).json({
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
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la room',
  error: error instanceof Error ? error.message : String(error)
    });
  }
});

// POST /api/rooms - Créer une nouvelle room
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, gmName, scenario, isPrivate = false, password } = req.body;
    
    // Validation centralisée via RoomService
    const validation = roomService.validateRoomData({ name, gmName, isPrivate, password });
    if (!validation.success) {
      return res.status(400).json(validation);
    }

    const gmId = uuidv();
    const room = roomService.createRoom(
      name.trim(),
      gmId,
      gmName.trim(),
      scenario?.trim() || 'Scénario libre',
      isPrivate,
      password?.trim()
    );

    res.status(201).json({
      success: true,
      message: 'Room créée avec succès',
      room: room.toJSON(),
      gmId: gmId,
      accessToken: gmId
    });
  } catch (error) {
    console.error('Erreur création room:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la room',
  error: error instanceof Error ? error.message : String(error)
    });
  }
});

// POST /api/rooms/:roomId/join - Rejoindre une room
router.post('/:roomId/join', (req: Request, res: Response) => {
  try {
    const { playerName, character, password } = req.body;
    const roomId = req.params.roomId;
    
    // Validation des données
    if (!playerName || playerName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du joueur est requis'
      });
    }

    if (playerName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du joueur ne peut pas dépasser 50 caractères'
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
      let message = 'Erreur inconnue';
      let statusCode = 500;
      if (error instanceof Error) {
        message = error.message;
        if (message.includes('mot de passe')) statusCode = 403;
        else if (message.includes('pleine')) statusCode = 409;
      }
      res.status(statusCode).json({
        success: false,
        message
      });
  }
});

// POST /api/rooms/:roomId/leave - Quitter une room
router.post('/:roomId/leave', (req: Request, res: Response) => {
  try {
    const { playerId } = req.body;
    const roomId = req.params.roomId;
    
    if (!playerId) {
      return res.status(400).json({
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
      let message = 'Erreur inconnue';
      if (error instanceof Error) message = error.message;
      res.status(500).json({
        success: false,
        message
      });
  }
});

// PUT /api/rooms/:roomId/status - Changer le statut d'une room (GM seulement)
router.put('/:roomId/status', (req: Request, res: Response) => {
  try {
    const { status, gmId } = req.body;
    const roomId = req.params.roomId;
    
    const room = roomService.getRoomById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room non trouvée'
      });
    }

    if (room.gmId !== gmId) {
      return res.status(403).json({
        success: false,
        message: 'Seul le GM peut changer le statut de la room'
      });
    }

    const validStatuses = ['waiting', 'active', 'paused', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
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
      let message = 'Erreur lors de la mise à jour du statut';
      let errorMsg = 'Erreur inconnue';
      if (error instanceof Error) errorMsg = error.message;
      res.status(500).json({
        success: false,
        message,
        error: errorMsg
      });
  }
});

// DELETE /api/rooms/:roomId - Supprimer une room (GM seulement)
router.delete('/:roomId', (req: Request, res: Response) => {
  try {
    const { gmId } = req.body;
    const roomId = req.params.roomId;
    
    const room = roomService.getRoomById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room non trouvée'
      });
    }

    if (room.gmId !== gmId) {
      return res.status(403).json({
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
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la room'
      });
    }
    } catch (error) {
      console.error('Erreur suppression room:', error);
      let message = 'Erreur lors de la suppression de la room';
      let errorMsg = 'Erreur inconnue';
      if (error instanceof Error) errorMsg = error.message;
      res.status(500).json({
        success: false,
        message,
        error: errorMsg
      });
  }
});

module.exports = router;

// Routes avancées pour session + scénario
// POST /api/rooms/with-scenario - Créer une room et attacher un scénario (id, objet, ou génération)
router.post('/with-scenario', (req: Request, res: Response) => {
  try {
    const { name, gmName, isPrivate = false, password, scenarioId, scenario, generate } = req.body || {};

    if (!name || !gmName) {
      return res.status(400).json({ success: false, message: 'name et gmName sont requis' });
    }

    const gmId = uuidv();

    // Préparer le scénario
    let scenarioData = null;
    if (scenarioId) {
      const found = scenarioService.get(scenarioId);
      if (!found) return res.status(404).json({ success: false, message: 'Scénario introuvable' });
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

    res.status(201).json({
      success: true,
      room: room.toJSON(),
      gmId,
      scenario: room.scenario,
    });
    } catch (error) {
      console.error('Erreur création room with-scenario:', error);
      let message = 'Erreur inconnue';
      if (error instanceof Error) message = error.message;
      res.status(500).json({ success: false, message });
  }
});

// PUT /api/rooms/:roomId/scenario/scene - Définir la scène courante
router.put('/:roomId/scenario/scene', (req: Request, res: Response) => {
  try {
    const { sceneIndex, title } = req.body || {};
    const room = roomService.getRoomById(req.params.roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room non trouvée' });

    // Accepte soit un index de scène, soit un titre
    let currentScene = null;
    const scenariosScenes = room?.scenario?.scenes;
    if (Array.isArray(scenariosScenes)) {
      if (typeof sceneIndex === 'number' && scenariosScenes[sceneIndex]) {
        currentScene = { index: sceneIndex, ...scenariosScenes[sceneIndex] };
      } else if (title) {
        const idx = scenariosScenes.findIndex(s => s.title === title);
        if (idx >= 0) currentScene = { index: idx, ...scenariosScenes[idx] };
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
    if (history.length > 100) history.splice(0, history.length - 100);

    room.updateGameData({ currentScene: currentScene || (title ? { title } : null), scenesHistory: history });

    res.json({ success: true, room: room.toJSON() });
  } catch (error) {
    console.error('Erreur update current scene:', error);
  let message = 'Erreur inconnue';
  if (error instanceof Error) message = error.message;
  res.status(500).json({ success: false, message });
  }
});