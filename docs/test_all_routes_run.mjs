// Script exécutable Node.js ESM pour tester toutes les routes GET publiques
// Placez ce fichier à la racine du projet et lancez-le avec : node test_all_routes_run.mjs

import fs from 'fs/promises';
import fetchPkg from 'node-fetch';
const fetch = globalThis.fetch || fetchPkg;

const GET_ROUTES = [
  { path: '/api/rooms', label: 'Liste des rooms' },
  { path: '/api/rooms/stats', label: 'Stats rooms' },
  { path: '/api/rooms/gm/1', label: 'Rooms par GM (id=1)' },
  { path: '/api/rooms/player/1', label: 'Rooms par joueur (id=1)' },
  { path: '/api/rooms/1', label: 'Room par id (id=1)' },
  { path: '/api/scenarios', label: 'Liste des scénarios' },
  { path: '/api/scenarios/1', label: 'Scénario par id (id=1)' },
  { path: '/api/reference/skills', label: 'Compétences' },
  { path: '/api/reference/clans/1', label: 'Clan par id (id=1)' },
  { path: '/api/reference/schools/1', label: 'École par id (id=1)' },
  { path: '/api/reference/disadvantages/1', label: 'Désavantage par id (id=1)' },
  { path: '/api/reference/equipment', label: 'Équipement' },
  { path: '/api/reference/equipment/weapons', label: 'Armes' },
  { path: '/api/reference/equipment/armor', label: 'Armures' },
  { path: '/api/reference/equipment/items', label: 'Objets' },
  { path: '/api/reference/equipement', label: 'Équipement (FR)' },
  { path: '/api/reference/spells', label: 'Sorts (filtrable)' },
  { path: '/api/reference/spells/element/terre', label: 'Sorts par élément (terre)' },
  { path: '/api/reference/spells/mastery/1', label: 'Sorts par rang (1)' },
  { path: '/api/reference/sorts', label: 'Sorts (alias FR)' },
  { path: '/api/reference/sorts/element/terre', label: 'Sorts (FR) par élément' },
  { path: '/api/reference/sorts/rang/1', label: 'Sorts (FR) par rang' },
  { path: '/api/reference/kiho', label: 'Kiho' },
  { path: '/api/frontend/clans', label: 'Clans (frontend)' },
  { path: '/api/frontend/schools', label: 'Écoles (frontend)' },
  { path: '/api/frontend/advantages', label: 'Avantages (frontend)' },
  { path: '/api/frontend/disadvantages', label: 'Désavantages (frontend)' },
  { path: '/api/frontend/spells', label: 'Sorts (frontend)' },
  { path: '/api/frontend/maho', label: 'Maho (frontend)' },
  { path: '/api/frontend/kiho', label: 'Kiho (frontend)' },
  { path: '/api/frontend/equipment', label: 'Équipement (frontend)' },
  { path: '/api/frontend/techniques', label: 'Techniques (frontend)' },
  { path: '/api/frontend/kata', label: 'Kata (frontend)' },
  { path: '/api/frontend/all', label: 'Bundle complet (frontend)' },
  { path: '/api/health', label: 'Health check' },
  { path: '/api/stats', label: 'Stats serveur' },
];

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';
const REPORT_PATH = 'docs/test_all_routes.md';

function formatResult({ route, label, status, duration, ok, json, error }) {
  return [
    `## ${label} \`${route}\``,
    `- **Code HTTP** : ${status}`,
    `- **Durée** : ${duration} ms`,
    `- **Succès** : ${ok ? '✅' : '❌'}`,
    error ? `- **Erreur** : ${error}` : '',
    json ? `- **Extrait réponse** : \`
${JSON.stringify(json, null, 2).slice(0, 400)}\`` : '',
    ''
  ].join('\n');
}

async function testAllGetRoutes() {
  const results = [];
  for (const { path, label } of GET_ROUTES) {
    const url = BASE_URL + path;
    const start = Date.now();
    let status = 0, ok = false, json = null, error = '';
    try {
      const res = await fetch(url);
      status = res.status;
      ok = res.ok;
      try { json = await res.json(); } catch {}
    } catch (e) {
      error = String(e);
    }
    const duration = Date.now() - start;
    results.push({ route: path, label, status, duration, ok, json, error });
    console.log(`[${status}] ${path} (${duration}ms) ${ok ? 'OK' : 'FAIL'}`);
  }
  return results;
}

async function main() {
  const date = new Date().toLocaleString('fr-FR');
  const results = await testAllGetRoutes();
  let md = `# Rapport de test automatisé : toutes les routes\n\n**Date d’exécution :** ${date}\n\n`;
  md += '\n---\n';
  for (const r of results) md += '\n' + formatResult(r) + '\n';
  await fs.writeFile(REPORT_PATH, md, 'utf-8');
  console.log(`\nRapport généré dans ${REPORT_PATH}`);
}

main();
