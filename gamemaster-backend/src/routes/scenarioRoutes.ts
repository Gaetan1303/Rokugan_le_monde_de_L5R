
/**
 * [DEV SENIOR] Routes Scenario - expose les endpoints REST pour la gestion des scénarios.
 * - Mapping direct vers le contrôleur, endpoints pour accès, création, génération, suppression.
 * - Adapter les routes selon l'évolution des besoins métier et la structure des scénarios.
 */

// [IMPORTS] Import des modules Express et du contrôleur Scenario
import { Router } from 'express';
import ScenarioController from '../controllers/ScenarioController.js';

// [ROUTER] Instanciation du routeur Express pour centraliser les endpoints
const router = Router();

// [MAPPING] Mapping des endpoints vers les méthodes du contrôleur Scenario
// Lister les scénarios
router.get('/', ScenarioController.list);

// Obtenir un scénario par ID
router.get('/:id', ScenarioController.get);

// Créer un scénario
router.post('/', ScenarioController.create);

// Générer un scénario automatiquement
router.post('/generate', ScenarioController.generate);

// Supprimer un scénario
router.delete('/:id', ScenarioController.remove);

// [EXPORT] Export du routeur principal pour intégration dans le serveur
export default router;
