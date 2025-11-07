/**
 * [DEV SENIOR] Contrôleur Room - gestion des rooms multijoueurs, accès, création et stats.
 * - Centralise la logique métier liée aux rooms, appels aux services, validation des accès.
 * - Respecter la séparation des responsabilités et documenter toute évolution majeure.
 */
import type { Request, Response } from 'express';
export declare class RoomController {
    static createRoom(req: Request, res: Response): void;
    static getRoomById(req: Request, res: Response): void;
    static getAllRooms(_req: Request, res: Response): void;
    static getPublicRooms(_req: Request, res: Response): void;
    static getRoomsByGM(req: Request, res: Response): void;
    static getRoomsByPlayer(req: Request, res: Response): void;
}
//# sourceMappingURL=RoomController.d.ts.map