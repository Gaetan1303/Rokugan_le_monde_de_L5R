/**
 * [DEV SENIOR] Contrôleur Room - gestion des rooms multijoueurs, accès, création et stats.
 * - Centralise la logique métier liée aux rooms, appels aux services, validation des accès.
 * - Respecter la séparation des responsabilités et documenter toute évolution majeure.
 */

// [IMPORTS] Import des modèles et services nécessaires
import type { Request, Response } from 'express';
import { Room } from '../models/Room.js';
import { RoomService } from '../services/roomService.js';

// [SERVICE] Instanciation du service Room pour centraliser la logique métier
import { roomService } from '../services/roomService.js';

// [CONTROLLER] Classe RoomController - expose les méthodes REST pour la gestion des rooms
export class RoomController {
  static async createRoom(req: Request, res: Response) {
    const { name, gmId, scenarioId, isPrivate, password } = req.body;
    // Validation du nom de la salle (univers Rokugan)
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: "Un samouraï ne peut entrer dans une salle sans nom. Veuillez honorer la tradition en nommant votre salle." });
    }
    // Vérification du token (authentification)
    if (!req.headers.authorization) {
      return res.status(401).json({ error: "Vous n'êtes pas autorisé à pénétrer dans cette salle sans l'autorisation du Champion d'Émeraude." });
    }
    try {
      const room = await roomService.createRoom({ name, gmId, scenarioId, isPrivate, password });
      res.status(201).json(room);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  }

  /**
   * Ajoute un joueur ou MJ à une room (POST /api/rooms/:roomId/players)
   * Body: { userId, role }
   */
  static async addPlayerToRoom(req: Request, res: Response) {
    try {
      const { userId, role } = req.body;
      const { roomId } = req.params;
      if (!userId || !role) {
        return res.status(400).json({ success: false, message: "L'identité et le rôle sont requis pour rejoindre la cour de Rokugan." });
      }
      if (!["player", "gm"].includes(role)) {
        return res.status(400).json({ success: false, message: `Le rôle '${role}' n'est pas reconnu par les traditions de l'Empire d'Émeraude. Seuls les samouraïs (player) ou les maîtres du jeu (gm) peuvent rejoindre la salle.` });
      }
      // Appel du service métier (adapter selon la signature réelle)
      const player = await roomService.addPlayerToRoom(roomId, userId, undefined, role);
      return res.status(201).json({ success: true, player });
    } catch (err) {
      return res.status(500).json({ success: false, message: `Une ombre plane sur la salle : ${(err as Error).message}` });
    }
  }

  static async getRoomById(req: Request, res: Response) {
    const roomId = req.params.id ?? '';
    const room = await roomService.getRoomById(roomId);
    if (room) {
      res.json(room);
    } else {
      res.status(404).json({ error: 'Room not found' });
    }
  }

  static async getAllRooms(_req: Request, res: Response) {
    const rooms = await roomService.getAllRooms();
    res.json(rooms);
  }

  static async getPublicRooms(_req: Request, res: Response) {
    const rooms = await roomService.getPublicRooms();
    res.json(rooms);
  }

  static async getRoomsByGM(req: Request, res: Response) {
    const gmId = req.params.gmId ?? '';
    const rooms = await roomService.getRoomsByGM(gmId);
    res.json(rooms);
  }

  static async getRoomsByPlayer(req: Request, res: Response) {
    const playerId = req.params.playerId ?? '';
    const rooms = await roomService.getRoomsByPlayer(playerId);
    res.json(rooms);
  }
}
