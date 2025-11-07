/**
 * [DEV SENIOR] Contrôleur Scenario - gestion des scénarios, accès, création et suppression.
 * - Centralise la logique métier liée aux scénarios, appels aux services, validation des accès.
 * - Respecter la séparation des responsabilités et documenter toute évolution majeure.
 */
// [IMPORTS] Import des modèles et services nécessaires
import { Scenario } from '../models/Scenario.js';
import { ScenarioService } from '../services/scenarioService.js';
const scenarioService = new ScenarioService();
class ScenarioController {
    static list(req, res) {
        res.json({ success: true, scenarios: scenarioService.list() });
    }
    static get(req, res) {
        const s = scenarioService.get(req.params.id ?? '');
        if (!s)
            return res.status(404).json({ success: false, message: 'Scénario introuvable' });
        res.json({ success: true, scenario: s.toJSON ? s.toJSON() : s });
    }
    static create(req, res) {
        const { title, synopsis } = req.body || {};
        if (!title || !synopsis) {
            return res.status(400).json({ success: false, message: 'title et synopsis sont requis' });
        }
        const created = scenarioService.create(req.body);
        res.status(201).json({ success: true, scenario: created });
    }
    static generate(req, res) {
        const created = scenarioService.generate(req.body || {});
        res.status(201).json({ success: true, scenario: created });
    }
    static remove(req, res) {
        const ok = scenarioService.remove(req.params.id ?? '');
        if (!ok)
            return res.status(404).json({ success: false, message: 'Scénario introuvable' });
        res.json({ success: true });
    }
}
// [EXPORT] Export du contrôleur principal pour intégration dans les routes
export default ScenarioController;
//# sourceMappingURL=ScenarioController.js.map