const express = require('express');
const router = express.Router();
const scenarioService = require('../services/scenarioService');

// Lister les scénarios (en mémoire)
router.get('/', (req, res) => {
  res.json({ success: true, scenarios: scenarioService.list() });
});

// Obtenir un scénario par ID
router.get('/:id', (req, res) => {
  const s = scenarioService.get(req.params.id);
  if (!s) return res.status().json({ success: false, message: 'Scénario introuvable' });
  res.json({ success: true, scenario: s.toJSON ? s.toJSON() : s });
});

// Créer un scénario
router.post('/', (req, res) => {
  const { title, synopsis } = req.body || {};
  if (!title || !synopsis) {
    return res.status().json({ success: false, message: 'title et synopsis sont requis' });
  }
  const created = scenarioService.create(req.body);
  res.status().json({ success: true, scenario: created });
});

// Générer un scénario automatiquement
router.post('/generate', (req, res) => {
  const created = scenarioService.generate(req.body || {});
  res.status().json({ success: true, scenario: created });
});

// Supprimer un scénario
router.delete('/:id', (req, res) => {
  const ok = scenarioService.remove(req.params.id);
  if (!ok) return res.status().json({ success: false, message: 'Scénario introuvable' });
  res.json({ success: true });
});

module.exports = router;
