import type { Request, Response } from 'express';
/**
 * [DEV SENIOR] Contrôleur Scenario - gestion des scénarios, accès, création et suppression.
 * - Centralise la logique métier liée aux scénarios, appels aux services, validation des accès.
 * - Respecter la séparation des responsabilités et documenter toute évolution majeure.
 */

// [IMPORTS] Import des modèles et services nécessaires
import { scenarioService } from '../services/scenarioService.js';
import { routeParam } from '../utils/httpParams.js';

class ScenarioController {
  static async list(_req: Request, res: Response) {
    const scenarios = await scenarioService.list();
    res.json({ success: true, scenarios });
  }

  static async get(req: Request, res: Response) {
    const s = await scenarioService.get(routeParam(req.params.id));
    if (!s) return res.status(404).json({ success: false, message: 'Scénario introuvable' });
    res.json({ success: true, scenario: s });
  }

  static async create(req: Request, res: Response) {
    const { title, synopsis } = req.body || {};
    if (!title || !synopsis) {
      return res.status(400).json({ success: false, message: 'title et synopsis sont requis' });
    }
    const created = await scenarioService.create(req.body);
    // On retourne toutes les propriétés du scénario, y compris l'id
    res.status(201).json({ success: true, scenario: created });
  }

  static async generate(req: Request, res: Response) {
    const created = await scenarioService.generate(req.body || {});
    res.status(201).json({ success: true, scenario: created });
  }

  static async remove(req: Request, res: Response) {
    const ok = await scenarioService.remove(routeParam(req.params.id));
    if (!ok) return res.status(404).json({ success: false, message: 'Scénario introuvable' });
    res.json({ success: true });
  }
}

export default ScenarioController;
