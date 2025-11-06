/**
 * [DEV SENIOR] Routes Room - expose les endpoints REST pour la gestion des rooms multijoueurs.
 * - Mapping direct vers le contrôleur, endpoints pour accès, stats, création, etc.
 * - Adapter les routes selon l'évolution des besoins métier et la structure des rooms.
 */

// [IMPORTS] Import des modules Express et du contrôleur Room
import { Router } from 'express';
import { RoomController } from '../controllers/RoomController.js';

// [ROUTER] Instanciation du routeur Express pour centraliser les endpoints
const router = Router();

router.get('/', RoomController.getPublicRooms);
router.get('/stats', RoomController.getAllRooms); // à adapter si stats spécifique
router.get('/gm/:gmId', RoomController.getRoomsByGM);
router.get('/player/:playerId', RoomController.getRoomsByPlayer);
router.get('/:roomId', RoomController.getRoomById);
router.post('/', RoomController.createRoom);
// [MAPPING] Mapping des endpoints vers les méthodes du contrôleur Room
// ...ajouter les autres routes en appelant les méthodes du contrôleur

// [EXPORT] Export du routeur principal pour intégration dans le serveur
export default router;
