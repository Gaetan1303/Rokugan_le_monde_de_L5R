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
const roomService = new RoomService();

// [CONTROLLER] Classe RoomController - expose les méthodes REST pour la gestion des rooms
export class RoomController {
  static createRoom(req: Request, res: Response) {
    const { name, gmId, gmName, scenario, isPrivate, password } = req.body;
    try {
      const room = roomService.createRoom(name, gmId, gmName, scenario, isPrivate, password);
      res.status(201).json(room);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  }

  static getRoomById(req: Request, res: Response) {
  const roomId = req.params.id ?? '';
      const room = roomService.getRoomById(roomId);
    if (room) {
      res.json(room);
    } else {
      res.status(404).json({ error: 'Room not found' });
    }
  }

  static getAllRooms(_req: Request, res: Response) {
    const rooms = roomService.getAllRooms();
    res.json(rooms);
  }

  static getPublicRooms(_req: Request, res: Response) {
    const rooms = roomService.getPublicRooms();
    res.json(rooms);
  }

  static getRoomsByGM(req: Request, res: Response) {
  const gmId = req.params.gmId ?? '';
    const rooms = roomService.getRoomsByGM(gmId);
    res.json(rooms);
  }

  static getRoomsByPlayer(req: Request, res: Response) {
  const playerId = req.params.playerId ?? '';
    const rooms = roomService.getRoomsByPlayer(playerId);
    res.json(rooms);
  }
}
