// Stress test pour l’API GM_L5R
// Envoie un grand nombre de requêtes POST /api/auth/register et /api/auth/login en parallèle
// Utilisation : npx tsx docs/stress_test.ts

import fs from 'fs/promises';
declare const fetch: typeof globalThis.fetch;

const BASE_URL = process.env.TEST_API_URL || 'https://gm-l5r.onrender.com';
const NB_USERS = 50; // Nombre d’utilisateurs à créer
const CONCURRENCY = 10; // Nombre de requêtes en parallèle

async function stressTest() {
  const results: any[] = [];
  let running = 0, done = 0;
  let errors = 0;
  const startGlobal = Date.now();

  async function registerAndLogin(i: number) {
    const unique = Date.now() + '-' + i + '-' + Math.floor(Math.random()*10000);
    const email = `stress${unique}@l5r.com`;
    const registerPayload = { name: 'Stress'+i, email, password: 'Bushido42!' };
    let statusReg = 0, statusLog = 0, t1 = Date.now(), t2 = 0, t3 = 0, okReg = false, okLog = false, err = '';
    let token = '';
    try {
      // Register
      const resReg = await fetch(BASE_URL + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerPayload)
      });
      statusReg = resReg.status;
      okReg = resReg.ok;
      t2 = Date.now();
      let jsonReg = null;
      try { jsonReg = await resReg.json(); } catch {}
      // Login
      if (okReg) {
        const resLog = await fetch(BASE_URL + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: 'Bushido42!' })
        });
        statusLog = resLog.status;
        okLog = resLog.ok;
        t3 = Date.now();
        let jsonLog = null;
        try { jsonLog = await resLog.json(); token = jsonLog?.token || ''; } catch {}
      }
      results[i] = {
        i, email, statusReg, statusLog, okReg, okLog, tReg: t2-t1, tLog: t3-t2, token
      };
    } catch (e) {
      err = String(e);
      errors++;
      results[i] = { i, email, statusReg, statusLog, okReg, okLog, error: err };
    }
    done++;
    if (done % 10 === 0) {
      console.log(`${done}/${NB_USERS} comptes traités...`);
    }
  }

  // Gestion de la concurrence
  let next = 0;
  async function runBatch() {
    const promises = [];
    while (running < CONCURRENCY && next < NB_USERS) {
      promises.push(registerAndLogin(next++));
      running++;
    }
    await Promise.all(promises);
    running -= promises.length;
    if (next < NB_USERS) {
      await runBatch();
    }
  }

  await runBatch();
  const duration = Date.now() - startGlobal;
  await fs.writeFile('docs/stress_test_report.json', JSON.stringify({ results, duration, errors }, null, 2), 'utf-8');
  console.log(`\nStress test terminé en ${duration} ms. Résultats dans docs/stress_test_report.json`);
}

stressTest();
