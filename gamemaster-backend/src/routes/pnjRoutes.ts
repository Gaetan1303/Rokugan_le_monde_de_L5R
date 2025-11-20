import { Router, Request, Response } from 'express';
import { PNJService } from '../services/PNJService';

// Interface pour l’injection de dépendance (DIP)
export interface IPNJService {
  getAllPNJ(): Promise<any[]>;
  getPNJById(id: string): Promise<any | null>;
  searchPNJByClan(clan: string): Promise<any[]>;
}

// Instanciation du service (à remplacer par une vraie implémentation BigData)
const pnjService: IPNJService = new PNJService();

const router = Router();

// GET /api/pnj — Liste tous les PNJ
router.get('/', async (_req: Request, res: Response) => {
  const pnjs = await pnjService.getAllPNJ();
  res.json(pnjs);
});

// GET /api/pnj/:id — Détail d’un PNJ
router.get('/:id', async (req: Request, res: Response) => {
  const pnj = await pnjService.getPNJById(req.params.id);
  if (!pnj) return res.status(404).json({ error: 'PNJ non trouvé' });
  res.json(pnj);
});

// GET /api/pnj?clan=NomClan — Recherche par clan
router.get('/', async (req: Request, res: Response) => {
  const { clan } = req.query;
  if (clan) {
    const pnjs = await pnjService.searchPNJByClan(String(clan));
    return res.json(pnjs);
  }
  // Sinon, retourne tout (déjà géré plus haut, mais pour BigData, à optimiser)
  const pnjs = await pnjService.getAllPNJ();
  res.json(pnjs);
});

export default router;
