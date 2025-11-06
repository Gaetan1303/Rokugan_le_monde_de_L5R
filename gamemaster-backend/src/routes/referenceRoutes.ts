
/**
 * [DEV SENIOR] Routes de référence - expose les endpoints pour les données de référence du jeu.
 * - Mapping direct vers le contrôleur, endpoints REST pour équipements, sorts, techniques, etc.
 * - Adapter les routes selon l'évolution des besoins métier et la structure des données.
 */

// [IMPORTS] Import des modules Express et du contrôleur de référence
import { Router } from 'express';
import ReferenceController from '../controllers/ReferenceController.js';

// [ROUTER] Instanciation du routeur Express pour centraliser les endpoints
const router = Router();

// [MAPPING] Mapping des endpoints vers les méthodes du contrôleur
router.get('/skills', ReferenceController.getSkills);
router.get('/clans/:id', ReferenceController.getClanById);
router.get('/schools/:id', ReferenceController.getSchoolById);
router.get('/disadvantages/:id', ReferenceController.getDisadvantageById);

// [EXPORT] Export du routeur principal pour intégration dans le serveur
export default router;

 
// New endpoints for equipment, spells, kiho, maho, and techniques/kata

// Equipment endpoints
router.get('/equipment', async (req, res) => {
    try {
        const data = await loadJsonFile<any>('equipement.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load equipment data' });
    }
});

router.get('/equipment/weapons', async (req, res) => {
    try {
        const data = await loadJsonFile<any>('equipement.json');
        res.json({ weapons: data.weapons || [] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load weapons data' });
    }
});

router.get('/equipment/armor', async (req, res) => {
    try {
        const data = await loadJsonFile<any>('equipement.json');
        res.json({ armor: data.armor || [] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load armor data' });
    }
});

router.get('/equipment/items', async (req, res) => {
    try {
        const data = await loadJsonFile<any>('equipement.json');
        res.json({ items: data.items || [] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load items data' });
    }
});


import type { Request, Response } from 'express';
import { loadJsonFile } from '../controllers/ReferenceController.js';

// Alias FR pour Équipement
router.get('/equipement', async (req: Request, res: Response) => {
    try {
        const data = await loadJsonFile<any>('equipement.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Échec du chargement de l'équipement" });
    }
});

// Spells endpoints
router.get('/spells', async (req: Request, res: Response) => {
    try {
        const data = await loadJsonFile<any>('sorts.json');
        let spells = data.spells || [];

        // Filters
        if (typeof req.query.element === 'string') {
            const element = req.query.element.toLowerCase();
            spells = spells.filter((s: any) => (s.element || '').toLowerCase() === element);
        }
        if (typeof req.query.mastery === 'string' || typeof req.query.maitrise === 'string') {
            const masteryStr = String(req.query.mastery || req.query.maitrise || '0');
            const mastery = parseInt(masteryStr, 10);
            spells = spells.filter((s: any) => Number(s.mastery || s.maitrise) === mastery);
        }
        if (typeof req.query.canon_status === 'string') {
            spells = spells.filter((s: any) => (s.canon_status || 'to-verify') === req.query.canon_status);
        }

        res.json({ spells, count: spells.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load spells data' });
    }
});

router.get('/spells/element/:element', async (req: Request, res: Response) => {
    try {
        const data = await loadJsonFile<any>('sorts.json');
        const element = (req.params.element || '').toLowerCase();
        const spells = (data.spells || []).filter((s: any) => (s.element || '').toLowerCase() === element);
        res.json({ spells });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load spells data' });
    }
});

router.get('/spells/mastery/:rank', async (req: Request, res: Response) => {
    try {
        const data = await loadJsonFile<any>('sorts.json');
    const rank = req.params.rank ? parseInt(req.params.rank, 10) : 0;
        const spells = (data.spells || []).filter((s: any) => Number(s.mastery) === rank);
        res.json({ spells });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load spells data' });
    }
});

// Alias FR pour Sorts
router.get('/sorts', async (req, res) => {
    try {
        const data = await loadJsonFile('sorts.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Échec du chargement des sorts' });
    }
});

router.get('/sorts/element/:element', async (req, res) => {
    try {
        const data = await loadJsonFile<any>('sorts.json');
        const element = (req.params.element || '').toLowerCase();
        const spells = (data.spells || []).filter((s: any) => (s.element || '').toLowerCase() === element);
        res.json({ sorts: spells });
    } catch (error) {
        res.status(500).json({ error: 'Échec du chargement des sorts' });
    }
});

router.get('/sorts/rang/:rank', async (req, res) => {
    try {
        const data = await loadJsonFile<any>('sorts.json');
        const rank = parseInt(req.params.rank, 10);
        const spells = (data.spells || []).filter((s: any) => Number(s.mastery) === rank);
        res.json({ sorts: spells });
    } catch (error) {
        res.status(500).json({ error: 'Échec du chargement des sorts' });
    }
});

// Kiho endpoints
router.get('/kiho', async (req, res) => {
    try {
        const data = await loadJsonFile<any>('kiho.json');
        let kiho = data.kiho || [];
        // Filters
        if (req.query.element) {
            const element = String(req.query.element || '').toLowerCase();
            kiho = kiho.filter((k: any) => (k.element || '').toLowerCase() === element);
        }
        if (req.query.type) {
            const type = String(req.query.type || '').toLowerCase();
            kiho = kiho.filter((k: any) => (k.type || '').toLowerCase() === type);
        }
        if (req.query.canon_status) {
            kiho = kiho.filter((k: any) => (k.canon_status || 'to-verify') === req.query.canon_status);
        }
        res.json({ kiho, count: kiho.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load kiho data' });
    }
});

router.get('/kiho/element/:element', async (req, res) => {
    try {
        const data = await loadJsonFile<any>('kiho.json');
        const element = (req.params.element || '').toLowerCase();
        const kiho = (data.kiho || []).filter((k: any) => (k.element || '').toLowerCase() === element);
        res.json({ kiho });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load kiho data' });
    }
});

// Maho endpoints
router.get('/maho', async (req, res) => {
    try {
        const data = await loadJsonFile<any>('maho.json');
        let maho = data.maho_spells || data.maho || [];
        // Filters
        if (req.query.maitrise || req.query.mastery) {
            const masteryStr = String(req.query.maitrise || req.query.mastery || '0');
            const mastery = parseInt(masteryStr, 10);
            maho = maho.filter((m: any) => Number(m.maitrise || m.mastery) === mastery);
        }
        if (req.query.canon_status) {
            maho = maho.filter((m: any) => (m.canon_status || 'to-verify') === req.query.canon_status);
        }
        res.json({ maho, count: maho.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load maho data' });
    }
});

// Techniques and Kata endpoints
router.get('/techniques', async (req, res) => {
    try {
        const data = await loadJsonFile<any>('techniques.json');
        let techniques = data.clan_techniques || [];
        // Filters
        if (req.query.clan) {
            const clan = String(req.query.clan || '').toLowerCase();
            techniques = techniques.filter((t: any) => (t.clan || '').toLowerCase() === clan);
        }
        if (req.query.type) {
            const type = String(req.query.type || '').toLowerCase();
            techniques = techniques.filter((t: any) => (t.type || '').toLowerCase() === type);
        }
        if (req.query.canon_status) {
            techniques = techniques.filter((t: any) => (t.canon_status || 'to-verify') === req.query.canon_status);
        }
        res.json({ techniques, count: techniques.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load techniques data' });
    }
});

router.get('/techniques/clan/:clan', async (req, res) => {
    try {
        const data = await loadJsonFile<any>('techniques.json');
        const clan = (req.params.clan || '').toLowerCase();
        const list = (data.clan_techniques || []).filter((t: any) => (t.clan || '').toLowerCase() === clan);
        res.json({ techniques: list });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load techniques data' });
    }
});

router.get('/kata', async (req, res) => {
    try {
        const data = await loadJsonFile<any>('techniques.json');
        let kata = data.kata || [];
        // Filters
        if (req.query.clan) {
            const clan = String(req.query.clan || '').toLowerCase();
            kata = kata.filter((k: any) => (k.clan || '').toLowerCase() === clan);
        }
        if (req.query.canon_status) {
            kata = kata.filter((k: any) => (k.canon_status || 'to-verify') === req.query.canon_status);
        }
        res.json({ kata, count: kata.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load kata data' });
    }
});

// Families endpoints
router.get('/families', async (req, res) => {
    try {
        const data = await loadJsonFile<any>('clans.json');
        const allFamilies = data.clans.flatMap((clan: any) =>
            (clan.familles || []).map((f: any) => ({...f, clan: clan.nom}))
        );
        res.json({ families: allFamilies });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load families data' });
    }
});

router.get('/families/clan/:clan', async (req, res) => {
    try {
        const data = await loadJsonFile<any>('clans.json');
        const clanName = (req.params.clan || '').toLowerCase();
        const clan = data.clans.find((c: any) => (c.id || '').toLowerCase() === clanName);
        if (!clan) {
            return res.status(500).json({ error: 'Clan not found' });
        }
        res.json({ families: clan.familles || [] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load families data' });
    }
});

// Wounds and conditions endpoints
router.get('/wounds', async (req, res) => {
    try {
        const data = await loadJsonFile('blessures.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load wounds data' });
    }
});

// Alias FR Blessures
router.get('/blessures', async (req, res) => {
    try {
        const data = await loadJsonFile('blessures.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Échec du chargement des blessures' });
    }
});

// Honor and glory endpoints
router.get('/honor', async (req, res) => {
    try {
        const data = await loadJsonFile('honneur.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load honor data' });
    }
});

// Alias FR Honneur
router.get('/honneur', async (req, res) => {
    try {
        const data = await loadJsonFile('honneur.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Échec du chargement de l\'honneur' });
    }
});

// Combat maneuvers endpoints
router.get('/combat-maneuvers', async (req, res) => {
    try {
        const data = await loadJsonFile('manoeuvres.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load combat maneuvers data' });
    }
});

// Alias FR Manoeuvres
router.get('/manoeuvres', async (req, res) => {
    try {
        const data = await loadJsonFile('manoeuvres.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Échec du chargement des manoeuvres' });
    }
});

// Paths and advanced schools endpoints
router.get('/paths', async (req, res) => {
    try {
        const data = await loadJsonFile('voies.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load paths data' });
    }
});

router.get('/paths/clan/:clan', async (req, res) => {
    try {
        const data = await loadJsonFile<any>('voies.json');
        const clan = (req.params.clan || '').toLowerCase();
        const paths = (data.paths || []).filter((p: any) => (p.clan || '').toLowerCase() === clan || (p.clan || '').toLowerCase() === 'universel');
        res.json({ paths });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load paths data' });
    }
});

// Alias FR Voies
router.get('/voies', async (req, res) => {
    try {
        const data = await loadJsonFile('voies.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Échec du chargement des voies' });
    }
});

router.get('/voies/clan/:clan', async (req, res) => {
    try {
        const data = await loadJsonFile<any>('voies.json');
        const clan = (req.params.clan || '').toLowerCase();
        const paths = (data.paths || []).filter((p: any) => (p.clan || '').toLowerCase() === clan || (p.clan || '').toLowerCase() === 'universel');
        res.json({ voies: paths });
    } catch (error) {
        res.status(500).json({ error: 'Échec du chargement des voies' });
    }
});

// Character creation endpoints
router.get('/creation', async (req, res) => {
    try {
        const data = await loadJsonFile('creation.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load creation data' });
    }
});

// Rings system endpoints
router.get('/anneaux', async (req, res) => {
    try {
        const data = await loadJsonFile('anneaux.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load rings data' });
    }
});

// Game rules and mechanics endpoints
router.get('/regles', async (req, res) => {
    try {
        const data = await loadJsonFile('regles.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load rules data' });
    }
});

// Part- details
router.get('/creation-details', async (req, res) => {
    try {
        const data = await loadJsonFile('creation_details.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load creation details' });
    }
});

// Part- combat and magic
router.get('/combat', async (req, res) => {
    try {
        const data = await loadJsonFile('combat.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load combat data' });
    }
});

router.get('/magie', async (req, res) => {
    try {
        const data = await loadJsonFile('magie.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load magic data' });
    }
});

// Environment, Fear, and Taint endpoints
router.get('/environnement', async (req, res) => {
    try {
        const data = await loadJsonFile('environnement.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load environment data' });
    }
});

router.get('/peur', async (req, res) => {
    try {
        const data = await loadJsonFile('peur.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load fear data' });
    }
});

router.get('/souillure', async (req, res) => {
    try {
        const data = await loadJsonFile('souillure.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load taint data' });
    }
});

// Lot : Social, Economy, Travel, and Formulas endpoints
router.get('/social', async (req, res) => {
    try {
        const data = await loadJsonFile('social.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load social data' });
    }
});

router.get('/economie', async (req, res) => {
    try {
        const data = await loadJsonFile('economie.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load economy data' });
    }
});

router.get('/voyage', async (req, res) => {
    try {
        const data = await loadJsonFile('voyage.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load travel data' });
    }
});

router.get('/formules', async (req, res) => {
    try {
        const data = await loadJsonFile('formules.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load formulas data' });
    }
});

// Guide de création de scénario (si extrait)
router.get('/scenario-guide', async (req, res) => {
    try {
        const data = await loadJsonFile('scenario_guide.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Scenario guide not available yet' });
    }
});

 
// Guide de création de scénario structuré (classification simple)
router.get('/scenario-guide/structured', async (req, res) => {
    try {
        const data = await loadJsonFile<any>('scenario_guide.json');
    const sections = data.rawSections || [];
    const pickTop = (arr: any[], n = 3) => arr.slice(0, n);
    // Exemple d'utilisation : renvoyer les 3 premières sections
    res.json({ sections: pickTop(sections, 3) });
    } catch (error) {
        res.status(500).json({ error: 'Scenario guide not available yet' });
    }
});

