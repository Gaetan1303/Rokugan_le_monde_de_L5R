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

// Ajout d'un joueur ou MJ à une room
// POST /api/rooms/:roomId/players
router.post('/:roomId/players', async (req, res) => {
	try {
		const { userId, role } = req.body;
		const { roomId } = req.params;
		if (!userId || !role) {
			return res.status(400).json({ success: false, message: 'userId et role requis' });
		}
		// Appel du service ou du contrôleur pour ajouter le joueur/MJ
		// À adapter selon ta logique métier
		const result = await RoomController.addPlayerToRoom(req, res);
		// Si le contrôleur gère la réponse, ne rien faire ici
		// Sinon, décommenter la ligne suivante si tu veux renvoyer le résultat :
		// return res.json(result);
	} catch (err: any) {
		res.status(500).json({ success: false, message: 'Erreur serveur', error: err?.message });
	}
});
// [MAPPING] Mapping des endpoints vers les méthodes du contrôleur Room
// ...ajouter les autres routes en appelant les méthodes du contrôleur

// [EXPORT] Export du routeur principal pour intégration dans le serveur
export default router;
