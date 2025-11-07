/**
 * [DEV SENIOR] Contrôleur Room - gestion des rooms multijoueurs, accès, création et stats.
 * - Centralise la logique métier liée aux rooms, appels aux services, validation des accès.
 * - Respecter la séparation des responsabilités et documenter toute évolution majeure.
 */
import { Room } from '../models/Room.js';
import { RoomService } from '../services/roomService.js';
// [SERVICE] Instanciation du service Room pour centraliser la logique métier
const roomService = new RoomService();
// [CONTROLLER] Classe RoomController - expose les méthodes REST pour la gestion des rooms
export class RoomController {
    static createRoom(req, res) {
        const { name, gmId, gmName, scenario, isPrivate, password } = req.body;
        try {
            const room = roomService.createRoom(name, gmId, gmName, scenario, isPrivate, password);
            res.status(201).json(room);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static getRoomById(req, res) {
        const roomId = req.params.id ?? '';
        const room = roomService.getRoomById(roomId);
        if (room) {
            res.json(room);
        }
        else {
            res.status(404).json({ error: 'Room not found' });
        }
    }
    static getAllRooms(_req, res) {
        const rooms = roomService.getAllRooms();
        res.json(rooms);
    }
    static getPublicRooms(_req, res) {
        const rooms = roomService.getPublicRooms();
        res.json(rooms);
    }
    static getRoomsByGM(req, res) {
        const gmId = req.params.gmId ?? '';
        const rooms = roomService.getRoomsByGM(gmId);
        res.json(rooms);
    }
    static getRoomsByPlayer(req, res) {
        const playerId = req.params.playerId ?? '';
        const rooms = roomService.getRoomsByPlayer(playerId);
        res.json(rooms);
    }
}
//# sourceMappingURL=RoomController.js.map