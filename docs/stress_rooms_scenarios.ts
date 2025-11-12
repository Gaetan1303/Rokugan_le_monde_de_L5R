// Stress test Rooms et Scenarios pour l’API GM_L5R
// Crée massivement des rooms et des scenarios, puis les supprime
// Utilisation : npx tsx docs/stress_rooms_scenarios.ts

import fs from 'fs/promises';
declare const fetch: typeof globalThis.fetch;

const BASE_URL = process.env.TEST_API_URL || 'https://gm-l5r.onrender.com';

// Mode "limite de charge" : on augmente progressivement le nombre de requêtes jusqu'à obtenir un 429
const MAX_ITEMS = 100;
const MAX_CONCURRENCY = 20;
const DELAY_BETWEEN_BATCH = 500; // ms entre chaque batch

async function findRateLimit(endpoint: 'room'|'scenario', token: string, userId: string) {
  let count = 0;
  let concurrency = 1;
  let got429 = false;
  let lastStatus429 = -1;
  while (!got429 && count < MAX_ITEMS) {
    const promises = [];
    for (let i = 0; i < concurrency && count < MAX_ITEMS; i++, count++) {
      if (endpoint === 'room') {
        const roomPayload = { name: `RoomLimit${count}-${Date.now()}`, gmId: userId };
        promises.push(fetch(BASE_URL + '/api/rooms', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(roomPayload)
        }).then(async res => {
          if (res.status === 429) got429 = true; lastStatus429 = count;
          return res.status;
        }).catch(()=>500));
      } else {
        const scenarioPayload = { name: `ScenarioLimit${count}-${Date.now()}`, gmId: userId, synopsis: 'Stress limit' };
        promises.push(fetch(BASE_URL + '/api/scenarios', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(scenarioPayload)
        }).then(async res => {
          if (res.status === 429) got429 = true; lastStatus429 = count;
          return res.status;
        }).catch(()=>500));
      }
    }
    const statuses = await Promise.all(promises);
    if (statuses.includes(429)) got429 = true;
    if (!got429) {
      concurrency = Math.min(concurrency + 1, MAX_CONCURRENCY);
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCH));
    }
  }
  return { endpoint, maxBefore429: got429 ? lastStatus429 : count, concurrency };
}

async function stressRoomsAndScenarios() {
  const results: any[] = [];
  let running = 0, done = 0, errors = 0;
  const startGlobal = Date.now();

  // Création d’un utilisateur MJ pour l’auth
  const unique = Date.now();
  const email = `mjstress${unique}@l5r.com`;
  const registerPayload = { name: 'MJStress', email, password: 'Bushido42!' };
  let token = '', userId = '';
  try {
    const resReg = await fetch(BASE_URL + '/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registerPayload)
    });
    const jsonReg = await resReg.json();
    userId = jsonReg?.user?.id || jsonReg?.userId || '';
    const resLog = await fetch(BASE_URL + '/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'Bushido42!' })
    });
    const jsonLog = await resLog.json();
    token = jsonLog?.token || '';
  } catch (e) {
    console.error('Erreur création MJ:', e);
    return;
  }

  // Test progressif de la limite de charge
  const roomLimit = await findRateLimit('room', token, userId);
  const scenarioLimit = await findRateLimit('scenario', token, userId);

  const duration = Date.now() - startGlobal;
  const report = { roomLimit, scenarioLimit, duration };
  await fs.writeFile('docs/stress_rooms_scenarios_report.json', JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\nLimite de charge atteinte :\nRooms : ${roomLimit.maxBefore429} créations avant 429 (concurrence max ${roomLimit.concurrency})\nScenarios : ${scenarioLimit.maxBefore429} créations avant 429 (concurrence max ${scenarioLimit.concurrency})`);
}

stressRoomsAndScenarios();
