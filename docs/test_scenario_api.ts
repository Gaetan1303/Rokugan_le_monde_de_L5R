type Step = {
  action: string;
  start: number;
  end?: number;
  duration?: number;
  success?: boolean;
  comment?: string;
  error?: string;
};
const BASE_URL = 'https://gm-l5r.onrender.com';

async function registerUser(email: string, password: string, name: string) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Register failed: ${email} | ${text}`);
  return JSON.parse(text);
}

async function loginUser(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Login failed: ${email} | ${text}`);
  return JSON.parse(text);
}

async function createRoom(token: string, name: string) {
  const res = await fetch(`${BASE_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name })
  });
  const text = await res.text();
  if (!res.ok) throw new Error('Room creation failed: ' + text);
  return JSON.parse(text);
}

async function createScenario(token: string, data: any) {
  const res = await fetch(`${BASE_URL}/api/scenarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  const text = await res.text();
  if (!res.ok) throw new Error('Scenario creation failed: ' + text);
  return JSON.parse(text);
}

async function getScenario(token: string, id: string) {
  const res = await fetch(`${BASE_URL}/api/scenarios/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const text = await res.text();
  if (!res.ok) throw new Error('Get scenario failed: ' + text);
  return JSON.parse(text);
}

async function deleteScenario(token: string, id: number) {
  await fetch(`${BASE_URL}/api/scenarios/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
}

async function deleteRoom(token: string, id: number) {
  await fetch(`${BASE_URL}/api/rooms/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
}

async function addPlayerToRoom(token: string, roomId: string, userId: string, role: 'player' | 'gm') {
  const body = { userId, role };
  console.log('DEBUG addPlayerToRoom body:', body);
  const res = await fetch(`${BASE_URL}/api/rooms/${roomId}/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) throw new Error('Add player failed: ' + text);
  return JSON.parse(text);
}

async function main() {
  // Générer des emails uniques pour chaque run
  const unique = Date.now();
  const users = [
    { email: `mj${unique}@test.com`, password: 'test123', name: 'MJ' },
    { email: `j1${unique}@test.com`, password: 'test123', name: 'Joueur1' },
    { email: `j2${unique}@test.com`, password: 'test123', name: 'Joueur2' },
    { email: `j3${unique}@test.com`, password: 'test123', name: 'Joueur3' },
  ];
  const report: { steps: Step[]; start: number; end: number | null; duration: number | null } = {
    steps: [],
    start: Date.now(),
    end: null,
    duration: null
  };
  // 1. Création des utilisateurs
  const registered = [];
  let t0 = Date.now();
  for (const u of users) {
    const step: Step = { action: `register+login ${u.email}`, start: Date.now() };
    try {
      const result = await registerUser(u.email, u.password, u.name);
      const loginRes = await loginUser(u.email, u.password);
      const user = loginRes.user || loginRes;
      if (!user.id && !user._id && !user.uuid) {
        throw new Error('Impossible de récupérer l\'id utilisateur pour ' + u.email + ': ' + JSON.stringify(user));
      }
      registered.push({ ...user, id: user.id || user._id || user.uuid });
      step.success = true;
      step.comment = 'Utilisateur créé et connecté';
    } catch (e) {
      step.success = false;
      step.error = e && typeof e === 'object' && 'message' in e ? (e as { message: string }).message : String(e);
      // Si déjà existant, on tente de récupérer l'utilisateur via login
      try {
        const loginRes = await loginUser(u.email, u.password);
        const user = loginRes.user || loginRes;
        if (!user.id && !user._id && !user.uuid) {
          throw new Error('Impossible de récupérer l\'id utilisateur pour ' + u.email + ': ' + JSON.stringify(user));
        }
        registered.push({ ...user, id: user.id || user._id || user.uuid });
        step.success = true;
        step.comment = 'Utilisateur déjà existant, connexion OK';
      } catch (e2) {
        step.success = false;
        step.error = (e2 && typeof e2 === 'object' && 'message' in e2) ? (e2 as { message: string }).message : String(e2);
      }
    }
    step.end = Date.now();
    step.duration = step.end - step.start;
    report.steps.push(step);
  }
  // 2. Connexion
  const tokens = [];
  for (const u of users) {
    const step: Step = { action: `login ${u.email}`, start: Date.now() };
    try {
      const { token } = await loginUser(u.email, u.password);
      tokens.push(token);
      step.success = true;
      step.comment = 'Connexion réussie';
    } catch (e) {
      step.success = false;
      step.error = e && typeof e === 'object' && 'message' in e ? (e as { message: string }).message : String(e);
    }
    step.end = Date.now();
    step.duration = step.end - step.start;
    report.steps.push(step);
  }
  // 3. Création de la room (par le MJ)
  let room;
  {
    const step: Step = { action: 'createRoom', start: Date.now() };
    try {
      room = await createRoom(tokens[0], 'Salle de test');
      step.success = true;
      step.comment = 'Room créée';
    } catch (e) {
      step.success = false;
      step.error = e && typeof e === 'object' && 'message' in e ? (e as { message: string }).message : String(e);
    }
    step.end = Date.now();
    step.duration = step.end - step.start;
    report.steps.push(step);
  }
  // 3b. Ajout des joueurs et du MJ dans la room
  {
    const step: Step = { action: 'addPlayerToRoom (GM)', start: Date.now() };
    try {
      await addPlayerToRoom(tokens[0], room.id, registered[0].id, 'gm');
      step.success = true;
      step.comment = 'MJ ajouté à la room';
    } catch (e) {
      step.success = false;
      step.error = e && typeof e === 'object' && 'message' in e ? (e as { message: string }).message : String(e);
    }
    step.end = Date.now();
    step.duration = step.end - step.start;
    report.steps.push(step);
  }
  for (let i = 1; i < registered.length; i++) {
    const step: Step = { action: `addPlayerToRoom (player ${i})`, start: Date.now() };
    try {
      await addPlayerToRoom(tokens[i], room.id, registered[i].id, 'player');
      step.success = true;
      step.comment = `Joueur ${i} ajouté à la room`;
    } catch (e) {
      step.success = false;
      step.error = e && typeof e === 'object' && 'message' in e ? (e as { message: string }).message : String(e);
    }
    step.end = Date.now();
    step.duration = step.end - step.start;
    report.steps.push(step);
  }
  // 4. Création du scénario (par le MJ)
  let scenarioRes;
  {
    const step: Step = { action: 'createScenario', start: Date.now() };
    try {
      scenarioRes = await createScenario(tokens[0], {
        name: 'Scénario Test',
        title: 'Scénario Test',
        synopsis: 'Test de persistance avec 3 joueurs et 1 MJ',
        roomId: room.id,
        playerIds: registered.slice(1).map((u: any) => u.id),
        gmId: registered[0].id
      });
      step.success = true;
      step.comment = 'Scénario créé';
    } catch (e) {
      step.success = false;
      step.error = e && typeof e === 'object' && 'message' in e ? (e as { message: string }).message : String(e);
    }
    step.end = Date.now();
    step.duration = step.end - step.start;
    report.steps.push(step);
  }
  // 5. Vérification persistance
  let scenarioFetched;
  {
    const step: Step = { action: 'getScenario', start: Date.now() };
    try {
      const scenario = scenarioRes.scenario || scenarioRes;
      const scenarioId = scenario.id || scenario._id || scenario.uuid;
      if (!scenarioId) throw new Error('Impossible de trouver l\'id du scénario dans la réponse: ' + JSON.stringify(scenarioRes));
      scenarioFetched = await getScenario(tokens[0], scenarioId);
      step.success = true;
      step.comment = 'Scénario récupéré et persistant';
    } catch (e) {
      step.success = false;
      step.error = e && typeof e === 'object' && 'message' in e ? (e as { message: string }).message : String(e);
    }
    step.end = Date.now();
    step.duration = step.end - step.start;
    report.steps.push(step);
  }
  // 6. Nettoyage
  {
    const step: Step = { action: 'deleteScenario', start: Date.now() };
    try {
      const scenario = scenarioRes.scenario || scenarioRes;
      const scenarioId = scenario.id || scenario._id || scenario.uuid;
      await deleteScenario(tokens[0], scenarioId);
      step.success = true;
      step.comment = 'Scénario supprimé';
    } catch (e) {
      step.success = false;
      step.error = e && typeof e === 'object' && 'message' in e ? (e as { message: string }).message : String(e);
    }
    step.end = Date.now();
    step.duration = step.end - step.start;
    report.steps.push(step);
  }
  {
    const step: Step = { action: 'deleteRoom', start: Date.now() };
    try {
      await deleteRoom(tokens[0], room.id);
      step.success = true;
      step.comment = 'Room supprimée';
    } catch (e) {
      step.success = false;
      step.error = e && typeof e === 'object' && 'message' in e ? (e as { message: string }).message : String(e);
    }
    step.end = Date.now();
    step.duration = step.end - step.start;
    report.steps.push(step);
  }
  report.end = Date.now();
  report.duration = report.end - report.start;
  // Affichage du rapport détaillé
  console.log('\n===== RAPPORT DÉTAILLÉ DU TEST =====');
  for (const s of report.steps) {
    console.log(`- [${s.success ? 'OK' : 'FAIL'}] ${s.action} (${s.duration} ms)${s.comment ? ' : ' + s.comment : ''}${s.error ? ' | Erreur: ' + s.error : ''}`);
  }
  console.log(`Durée totale: ${report.duration} ms`);
  console.log('====================================\n');
}

main().catch(e => { console.error(e); process.exit(1); });
