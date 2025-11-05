const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

async function loadJsonFile(filename) {
    try {
        const filePath = path.join(DATA_DIR, filename);
        const data = await fs.readFile(filePath, 'utf-');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading ${filename}:`, error);
        throw error;
    }
}

router.get('/clans', async (req, res) => {
    try {
        const data = await loadJsonFile('clans.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load clans data' });
    }
});

router.get('/clans/:id', async (req, res) => {
    try {
        const data = await loadJsonFile('clans.json');
        const clan = data.clans.find(c => c.id === req.params.id);
        if (!clan) {
            return res.status(500).json({ error: 'Clan not found' });
        }
        res.json(clan);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load clan data' });
    }
});

router.get('/schools', async (req, res) => {
    try {
        const data = await loadJsonFile('ecoles.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load schools data' });
    }
});

router.get('/schools/:id', async (req, res) => {
    try {
        const data = await loadJsonFile('ecoles.json');
        const school = data.ecoles.find(s => s.id === req.params.id);
        if (!school) {
            return res.status(500).json({ error: 'School not found' });
        }
        res.json(school);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load school data' });
    }
});

router.get('/schools/clan/:clanId', async (req, res) => {
    try {
        const data = await loadJsonFile('ecoles.json');
        const schools = data.ecoles.filter(s => s.clan_id === req.params.clanId || s.clan === req.params.clanId);
        res.json({ ecoles: schools });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load schools data' });
    }
});

// Filtered/paginated schools (Lot  canonical)
router.get('/ecoles', async (req, res) => {
    try {
        const data = await loadJsonFile('ecoles.json');
        let schools = data.ecoles || [];
        
        // Filters
        if (req.query.clan) {
            schools = schools.filter(s => (s.clan || s.clan_id || '').toLowerCase() === req.query.clan.toLowerCase());
        }
        if (req.query.type) {
            schools = schools.filter(s => (s.type || '').toLowerCase() === req.query.type.toLowerCase());
        }
        if (req.query.canon_status) {
            schools = schools.filter(s => (s.canon_status || 'to-verify') === req.query.canon_status);
        }
        
        res.json({ ecoles: schools, meta: data.meta, count: schools.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load schools data' });
    }
});

router.get('/skills', async (req, res) => {
    try {
        const data = await loadJsonFile('competences.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load skills data' });
    }
});

router.get('/skills/:id', async (req, res) => {
    try {
        const data = await loadJsonFile('competences.json');
        const skill = data.competences.find(s => s.id === req.params.id);
        if (!skill) {
            return res.status(500).json({ error: 'Skill not found' });
        }
        res.json(skill);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load skill data' });
    }
});

router.get('/skills/type/:type', async (req, res) => {
    try {
        const data = await loadJsonFile('competences.json');
        const skills = data.competences.filter(s => s.type === req.params.type);
        res.json({ competences: skills });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load skills data' });
    }
});

// Alias FR pour Compétences
router.get('/competences', async (req, res) => {
    try {
        const data = await loadJsonFile('competences.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Échec du chargement des compétences' });
    }
});

router.get('/competences/:id', async (req, res) => {
    try {
        const data = await loadJsonFile('competences.json');
        const skill = data.competences.find(s => s.id === req.params.id);
        if (!skill) {
            return res.status(500).json({ error: 'Compétence introuvable' });
        }
        res.json(skill);
    } catch (error) {
        res.status(500).json({ error: 'Échec du chargement de la compétence' });
    }
});

router.get('/competences/type/:type', async (req, res) => {
    try {
        const data = await loadJsonFile('competences.json');
        const skills = data.competences.filter(s => s.type === req.params.type);
        res.json({ competences: skills });
    } catch (error) {
        res.status(500).json({ error: 'Échec du chargement des compétences' });
    }
});

router.get('/traits', async (req, res) => {
    try {
        const data = await loadJsonFile('traits.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load traits data' });
    }
});

router.get('/advantages', async (req, res) => {
    try {
        const data = await loadJsonFile('avantages.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load advantages data' });
    }
});

router.get('/advantages/:id', async (req, res) => {
    try {
        const data = await loadJsonFile('avantages.json');
        const advantage = data.advantages.find(a => a.id === req.params.id);
        if (!advantage) {
            return res.status(500).json({ error: 'Advantage not found' });
        }
        res.json(advantage);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load advantage data' });
    }
});

// Alias FR pour Avantages/Désavantages
router.get('/avantages', async (req, res) => {
    try {
        const data = await loadJsonFile('avantages.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Échec du chargement des avantages' });
    }
});

router.get('/avantages/:id', async (req, res) => {
    try {
        const data = await loadJsonFile('avantages.json');
        const advantage = data.advantages.find(a => a.id === req.params.id);
        if (!advantage) {
            return res.status(500).json({ error: 'Avantage introuvable' });
        }
        res.json(advantage);
    } catch (error) {
        res.status(500).json({ error: "Échec du chargement de l'avantage" });
    }
});

router.get('/disadvantages', async (req, res) => {
    try {
        const data = await loadJsonFile('desavantages.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load disadvantages data' });
    }
});

router.get('/disadvantages/:id', async (req, res) => {
    try {
        const data = await loadJsonFile('desavantages.json');
        const disadvantage = data.disadvantages.find(d => d.id === req.params.id);
        if (!disadvantage) {
            return res.status(500).json({ error: 'Disadvantage not found' });
        }
        res.json(disadvantage);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load disadvantage data' });
    }
});

router.get('/desavantages', async (req, res) => {
    try {
        const data = await loadJsonFile('desavantages.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Échec du chargement des désavantages' });
    }
});

router.get('/desavantages/:id', async (req, res) => {
    try {
        const data = await loadJsonFile('desavantages.json');
        const disadvantage = data.disadvantages.find(d => d.id === req.params.id);
        if (!disadvantage) {
            return res.status(500).json({ error: 'Désavantage introuvable' });
        }
        res.json(disadvantage);
    } catch (error) {
        res.status(500).json({ error: "Échec du chargement du désavantage" });
    }
});

module.exports = router;
 
// New endpoints for equipment, spells, kiho, maho, and techniques/kata

// Equipment endpoints
router.get('/equipment', async (req, res) => {
    try {
        const data = await loadJsonFile('equipement.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load equipment data' });
    }
});

router.get('/equipment/weapons', async (req, res) => {
    try {
        const data = await loadJsonFile('equipement.json');
        res.json({ weapons: data.weapons || [] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load weapons data' });
    }
});

router.get('/equipment/armor', async (req, res) => {
    try {
        const data = await loadJsonFile('equipement.json');
        res.json({ armor: data.armor || [] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load armor data' });
    }
});

router.get('/equipment/items', async (req, res) => {
    try {
        const data = await loadJsonFile('equipement.json');
        res.json({ items: data.items || [] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load items data' });
    }
});

// Alias FR pour Équipement
router.get('/equipement', async (req, res) => {
    try {
        const data = await loadJsonFile('equipement.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Échec du chargement de l'équipement" });
    }
});

// Spells endpoints
router.get('/spells', async (req, res) => {
    try {
        const data = await loadJsonFile('sorts.json');
        let spells = data.spells || [];
        
        // Filters
        if (req.query.element) {
            const element = (req.query.element || '').toLowerCase();
            spells = spells.filter(s => (s.element || '').toLowerCase() === element);
        }
        if (req.query.mastery || req.query.maitrise) {
            const mastery = parseInt(req.query.mastery || req.query.maitrise, 10);
            spells = spells.filter(s => Number(s.mastery || s.maitrise) === mastery);
        }
        if (req.query.canon_status) {
            spells = spells.filter(s => (s.canon_status || 'to-verify') === req.query.canon_status);
        }
        
        res.json({ spells, count: spells.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load spells data' });
    }
});

router.get('/spells/element/:element', async (req, res) => {
    try {
        const data = await loadJsonFile('sorts.json');
        const element = (req.params.element || '').toLowerCase();
        const spells = (data.spells || []).filter(s => (s.element || '').toLowerCase() === element);
        res.json({ spells });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load spells data' });
    }
});

router.get('/spells/mastery/:rank', async (req, res) => {
    try {
        const data = await loadJsonFile('sorts.json');
        const rank = parseInt(req.params.rank, 10);
        const spells = (data.spells || []).filter(s => Number(s.mastery) === rank);
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
        const data = await loadJsonFile('sorts.json');
        const element = (req.params.element || '').toLowerCase();
        const spells = (data.spells || []).filter(s => (s.element || '').toLowerCase() === element);
        res.json({ sorts: spells });
    } catch (error) {
        res.status(500).json({ error: 'Échec du chargement des sorts' });
    }
});

router.get('/sorts/rang/:rank', async (req, res) => {
    try {
        const data = await loadJsonFile('sorts.json');
        const rank = parseInt(req.params.rank, 10);
        const spells = (data.spells || []).filter(s => Number(s.mastery) === rank);
        res.json({ sorts: spells });
    } catch (error) {
        res.status(500).json({ error: 'Échec du chargement des sorts' });
    }
});

// Kiho endpoints
router.get('/kiho', async (req, res) => {
    try {
        const data = await loadJsonFile('kiho.json');
        let kiho = data.kiho || [];
        
        // Filters
        if (req.query.element) {
            const element = (req.query.element || '').toLowerCase();
            kiho = kiho.filter(k => (k.element || '').toLowerCase() === element);
        }
        if (req.query.type) {
            const type = (req.query.type || '').toLowerCase();
            kiho = kiho.filter(k => (k.type || '').toLowerCase() === type);
        }
        if (req.query.canon_status) {
            kiho = kiho.filter(k => (k.canon_status || 'to-verify') === req.query.canon_status);
        }
        
        res.json({ kiho, count: kiho.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load kiho data' });
    }
});

router.get('/kiho/element/:element', async (req, res) => {
    try {
        const data = await loadJsonFile('kiho.json');
        const element = (req.params.element || '').toLowerCase();
        const kiho = (data.kiho || []).filter(k => (k.element || '').toLowerCase() === element);
        res.json({ kiho });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load kiho data' });
    }
});

// Maho endpoints
router.get('/maho', async (req, res) => {
    try {
        const data = await loadJsonFile('maho.json');
        let maho = data.maho_spells || data.maho || [];
        
        // Filters
        if (req.query.maitrise || req.query.mastery) {
            const mastery = parseInt(req.query.maitrise || req.query.mastery, 10);
            maho = maho.filter(m => Number(m.maitrise || m.mastery) === mastery);
        }
        if (req.query.canon_status) {
            maho = maho.filter(m => (m.canon_status || 'to-verify') === req.query.canon_status);
        }
        
        res.json({ maho, count: maho.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load maho data' });
    }
});

// Techniques and Kata endpoints
router.get('/techniques', async (req, res) => {
    try {
        const data = await loadJsonFile('techniques.json');
        let techniques = data.clan_techniques || [];
        
        // Filters
        if (req.query.clan) {
            const clan = (req.query.clan || '').toLowerCase();
            techniques = techniques.filter(t => (t.clan || '').toLowerCase() === clan);
        }
        if (req.query.type) {
            const type = (req.query.type || '').toLowerCase();
            techniques = techniques.filter(t => (t.type || '').toLowerCase() === type);
        }
        if (req.query.canon_status) {
            techniques = techniques.filter(t => (t.canon_status || 'to-verify') === req.query.canon_status);
        }
        
        res.json({ techniques, count: techniques.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load techniques data' });
    }
});

router.get('/techniques/clan/:clan', async (req, res) => {
    try {
        const data = await loadJsonFile('techniques.json');
        const clan = (req.params.clan || '').toLowerCase();
        const list = (data.clan_techniques || []).filter(t => (t.clan || '').toLowerCase() === clan);
        res.json({ techniques: list });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load techniques data' });
    }
});

router.get('/kata', async (req, res) => {
    try {
        const data = await loadJsonFile('techniques.json');
        let kata = data.kata || [];
        
        // Filters
        if (req.query.clan) {
            const clan = (req.query.clan || '').toLowerCase();
            kata = kata.filter(k => (k.clan || '').toLowerCase() === clan);
        }
        if (req.query.canon_status) {
            kata = kata.filter(k => (k.canon_status || 'to-verify') === req.query.canon_status);
        }
        
        res.json({ kata, count: kata.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load kata data' });
    }
});

// Families endpoints
router.get('/families', async (req, res) => {
    try {
        const data = await loadJsonFile('clans.json');
        const allFamilies = data.clans.flatMap(clan => 
            (clan.familles || []).map(f => ({...f, clan: clan.nom}))
        );
        res.json({ families: allFamilies });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load families data' });
    }
});

router.get('/families/clan/:clan', async (req, res) => {
    try {
        const data = await loadJsonFile('clans.json');
        const clanName = (req.params.clan || '').toLowerCase();
        const clan = data.clans.find(c => (c.id || '').toLowerCase() === clanName);
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
        const data = await loadJsonFile('voies.json');
        const clan = (req.params.clan || '').toLowerCase();
        const paths = (data.paths || []).filter(p => (p.clan || '').toLowerCase() === clan || (p.clan || '').toLowerCase() === 'universel');
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
        const data = await loadJsonFile('voies.json');
        const clan = (req.params.clan || '').toLowerCase();
        const paths = (data.paths || []).filter(p => (p.clan || '').toLowerCase() === clan || (p.clan || '').toLowerCase() === 'universel');
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

module.exports = router;
 
// Guide de création de scénario structuré (classification simple)
router.get('/scenario-guide/structured', async (req, res) => {
    try {
        const data = await loadJsonFile('scenario_guide.json');
        const sections = data?.rawSections || [];

        const pickTop = (arr, n = 3) => arr.slice(0, n);

        const has = (s, rx) => {
            const title = (s.titre || '').toString();
            const text = (s.paragraphs || []).join(' ');
            return rx.test(title) || rx.test(text);
        };

        const buckets = {
            etapes: {
                accroche: [],
                enquete: [],
                confrontation: [],
                resolution: []
            },
            principes: [],
            conseils: []
        };

        for (const s of sections) {
            // Étapes
            if (has(s, /accroche|mise\s+en\s+sc[ée]ne/i)) buckets.etapes.accroche.push(s);
            if (has(s, /enqu[êe]te|indices?|investigation/i)) buckets.etapes.enquete.push(s);
            if (has(s, /confrontation|climax|duel|affrontement/i)) buckets.etapes.confrontation.push(s);
            if (has(s, /r[ée]solution|cons[ée]quences|d[ée]nouement/i)) buckets.etapes.resolution.push(s);

            // Principes (structure, trame, objectifs)
            if (has(s, /principes?|structure|trame|objectifs?/i)) buckets.principes.push(s);

            // Conseils (astuces, erreurs, recommandations)
            if (has(s, /conseils?|astuces?|erreurs?|recommandations?/i)) buckets.conseils.push(s);
        }

        const summarize = (s) => ({
            source: s.source,
            titre: s.titre,
            excerpt: (s.paragraphs || []).slice(0, 2)
        });

        const structured = {
            meta: {
                from: 'scenario_guide.json',
                generatedAt: new Date().toISOString()
            },
            etapes: {
                accroche: pickTop(buckets.etapes.accroche).map(summarize),
                enquete: pickTop(buckets.etapes.enquete).map(summarize),
                confrontation: pickTop(buckets.etapes.confrontation).map(summarize),
                resolution: pickTop(buckets.etapes.resolution).map(summarize)
            },
            principes: pickTop(buckets.principes).map(summarize),
            conseils: pickTop(buckets.conseils).map(summarize)
        };

        res.json(structured);
    } catch (error) {
        res.status(500).json({ error: 'Structured scenario guide not available yet' });
    }
});
