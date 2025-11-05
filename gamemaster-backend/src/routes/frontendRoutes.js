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

// Frontend-compatible endpoints - Return data in format matching .data.ts files

// GET /api/frontend/clans - Format compatible avec CLANS array
router.get('/clans', async (req, res) => {
    try {
        const data = await loadJsonFile('clans.json');
        // Return just the clans array for frontend compatibility
        res.json(data.clans || []);
    } catch (error) {
        res.status().json({ error: 'Failed to load clans data' });
    }
});

// GET /api/frontend/schools - Format compatible avec SCHOOLS array
router.get('/schools', async (req, res) => {
    try {
        const data = await loadJsonFile('ecoles.json');
        // Transform to frontend format
        const schools = (data.ecoles || []).map(school => ({
            name: school.nom,
            type: school.type,
            clan: school.clan,
            traitBonus: school.bonus_trait,
            skills: school.competences_ecole || [],
            technique: school.techniques?.rang_ || school.technique_rang_ || '',
            honor: school.honneur_initial || .,
            outfit: school.equipement_depart || [],
            startingMoney: school.argent_depart || 'd',
            spellLimits: school.limites_sorts || (school.type === 'shugenja' ? {
                rank: ,
                rank: ,
                affinity: school.affinite || 'Terre',
                deficiency: school.deficience || 'Air'
            } : undefined)
        }));
        res.json(schools);
    } catch (error) {
        res.status().json({ error: 'Failed to load schools data' });
    }
});

// GET /api/frontend/advantages - Format compatible avec ADVANTAGES array
router.get('/advantages', async (req, res) => {
    try {
        const data = await loadJsonFile('avantages.json');
        const advantages = (data.avantages || []).map(adv => ({
            name: adv.nom,
            type: adv.type,
            cost: adv.cout,
            description: adv.description,
            restrictions: adv.restrictions || '',
            effects: adv.effets || adv.description
        }));
        res.json(advantages);
    } catch (error) {
        res.status().json({ error: 'Failed to load advantages data' });
    }
});

// GET /api/frontend/disadvantages - Format compatible avec DISADVANTAGES array
router.get('/disadvantages', async (req, res) => {
    try {
        const data = await loadJsonFile('desavantages.json');
        const disadvantages = (data.desavantages || []).map(dis => ({
            name: dis.nom,
            type: dis.type,
            points: dis.points,
            description: dis.description,
            restrictions: dis.restrictions || '',
            effects: dis.effets || dis.description
        }));
        res.json(disadvantages);
    } catch (error) {
        res.status().json({ error: 'Failed to load disadvantages data' });
    }
});

// GET /api/frontend/spells - Format compatible avec SPELLS array
router.get('/spells', async (req, res) => {
    try {
        const data = await loadJsonFile('sorts.json');
        const spells = (data.sorts || []).map(spell => ({
            name: spell.nom,
            element: spell.element,
            mastery: spell.maitrise,
            range: spell.portee,
            area: spell.zone,
            duration: spell.duree,
            raises: spell.relances || '',
            description: spell.effet || spell.description
        }));
        res.json(spells);
    } catch (error) {
        res.status().json({ error: 'Failed to load spells data' });
    }
});

// GET /api/frontend/maho - Format compatible avec MAHO_SPELLS array
router.get('/maho', async (req, res) => {
    try {
        const data = await loadJsonFile('maho.json');
        const mahoSpells = (data.maho || []).map(spell => ({
            name: spell.nom,
            mastery: spell.maitrise,
            bloodCost: spell.cout_sang,
            taintGain: spell.souillure_gain,
            range: spell.portee,
            area: spell.zone,
            duration: spell.duree,
            description: spell.effet || spell.description
        }));
        res.json(mahoSpells);
    } catch (error) {
        res.status().json({ error: 'Failed to load maho data' });
    }
});

// GET /api/frontend/kiho - Format compatible avec KIHO array
router.get('/kiho', async (req, res) => {
    try {
        const data = await loadJsonFile('kiho.json');
        const kiho = (data.kiho || []).map(k => ({
            name: k.nom,
            element: k.element,
            type: k.type,
            mastery: k.rang || k.mastery || ,
            activation: k.activation,
            description: k.effet || k.description
        }));
        res.json(kiho);
    } catch (error) {
        res.status().json({ error: 'Failed to load kiho data' });
    }
});

// GET /api/frontend/equipment - Format compatible avec WEAPONS, ARMOR, ITEMS
router.get('/equipment', async (req, res) => {
    try {
        const data = await loadJsonFile('equipement.json');
        const equipment = {
            weapons: (data.armes || []).map(w => ({
                name: w.nom,
                type: w.type,
                damage: w.degats,
                skill: w.competence,
                range: w.portee,
                price: w.prix,
                description: w.description || ''
            })),
            armor: (data.armures || []).map(a => ({
                name: a.nom,
                type: a.type,
                tn: a.nd_armure,
                reduction: a.reduction || ,
                price: a.prix,
                description: a.description || ''
            })),
            items: (data.objets || []).map(i => ({
                name: i.nom,
                type: i.type || 'general',
                price: i.prix,
                description: i.description || ''
            }))
        };
        res.json(equipment);
    } catch (error) {
        res.status().json({ error: 'Failed to load equipment data' });
    }
});

// GET /api/frontend/techniques - Format compatible avec CLAN_TECHNIQUES et KATA
router.get('/techniques', async (req, res) => {
    try {
        const data = await loadJsonFile('techniques.json');
        const techniques = (data.techniques || []).map(t => ({
            name: t.nom,
            clan: t.clan,
            type: t.type,
            rank: t.rang || t.mastery || ,
            description: t.effet || t.description,
            keywords: t.mots_cles || []
        }));
        res.json(techniques);
    } catch (error) {
        res.status().json({ error: 'Failed to load techniques data' });
    }
});

// GET /api/frontend/kata - Format compatible avec KATA array
router.get('/kata', async (req, res) => {
    try {
        const data = await loadJsonFile('techniques.json');
        const kata = (data.techniques || [])
            .filter(t => t.type === 'kata')
            .map(t => ({
                name: t.nom,
                clan: t.clan,
                mastery: t.rang || t.mastery || ,
                description: t.effet || t.description,
                keywords: t.mots_cles || []
            }));
        res.json(kata);
    } catch (error) {
        res.status().json({ error: 'Failed to load kata data' });
    }
});

// GET /api/frontend/all - Retourne toutes les données en un seul appel
router.get('/all', async (req, res) => {
    try {
        const [clans, schools, advantages, disadvantages, spells, maho, kiho, equipment, techniques] = await Promise.all([
            router.handle({ path: '/clans' }, { json: () => {} }),
            router.handle({ path: '/schools' }, { json: () => {} }),
            router.handle({ path: '/advantages' }, { json: () => {} }),
            router.handle({ path: '/disadvantages' }, { json: () => {} }),
            router.handle({ path: '/spells' }, { json: () => {} }),
            router.handle({ path: '/maho' }, { json: () => {} }),
            router.handle({ path: '/kiho' }, { json: () => {} }),
            router.handle({ path: '/equipment' }, { json: () => {} }),
            router.handle({ path: '/techniques' }, { json: () => {} })
        ].map(p => p.catch(e => [])));

        res.json({
            clans,
            schools,
            advantages,
            disadvantages,
            spells,
            maho,
            kiho,
            equipment,
            techniques
        });
    } catch (error) {
        res.status().json({ error: 'Failed to load data bundle' });
    }
});

module.exports = router;
