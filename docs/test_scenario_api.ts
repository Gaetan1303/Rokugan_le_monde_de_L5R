const BASE_URL = 'https://gm-l5r.onrender.com';

async function registerUser(email: string, password: string, username: string) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username })
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
  const res = await fetch(`${BASE_URL}/api/rooms/${roomId}/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ userId, role })
  });
  const text = await res.text();
  if (!res.ok) throw new Error('Add player failed: ' + text);
  return JSON.parse(text);
}

async function main() {
  // Générer des emails uniques pour chaque run
  const unique = Date.now();
  const users = [
    { email: `mj${unique}@test.com`, password: 'test123', username: 'MJ' },
    { email: `j1${unique}@test.com`, password: 'test123', username: 'Joueur1' },
    { email: `j2${unique}@test.com`, password: 'test123', username: 'Joueur2' },
    { email: `j3${unique}@test.com`, password: 'test123', username: 'Joueur3' },
  ];
  // 1. Création des utilisateurs
  const registered = [];
  for (const u of users) {
    try {
      const result = await registerUser(u.email, u.password, u.username);
      registered.push(result);
    } catch (e) {
      // Si déjà existant, on tente de récupérer l'utilisateur via login
      const { token, user } = await loginUser(u.email, u.password);
      registered.push(user ? user : { email: u.email });
    }
  }
  // 2. Connexion
  const tokens = [];
  for (const u of users) {
    const { token } = await loginUser(u.email, u.password);
    tokens.push(token);
  }
  // 3. Création de la room (par le MJ)
  const room = await createRoom(tokens[0], 'Salle de test');
  // 3b. Ajout des joueurs et du MJ dans la room
  await addPlayerToRoom(tokens[0], room.id, registered[0].id, 'gm');
  for (let i = 1; i < registered.length; i++) {
    await addPlayerToRoom(tokens[i], room.id, registered[i].id, 'player');
  }
  // 4. Création du scénario (par le MJ)
  const scenario = await createScenario(tokens[0], {
    name: 'Scénario Test',
    title: 'Scénario Test',
    synopsis: 'Test de persistance avec 3 joueurs et 1 MJ',
    roomId: room.id,
    playerIds: registered.slice(1).map((u: any) => u.id),
    gmId: registered[0].id
  });
  console.log('Réponse création scénario:', scenario);
  // 5. Vérification
  const scenarioId = scenario.id || scenario._id || scenario.uuid;
  if (!scenarioId) throw new Error('Impossible de trouver l\'id du scénario dans la réponse: ' + JSON.stringify(scenario));
  const scenarioFetched = await getScenario(tokens[0], scenarioId);
  console.log('Scénario persistant:', scenarioFetched);
  // 6. Nettoyage
  await deleteScenario(tokens[0], scenario.id);
  await deleteRoom(tokens[0], room.id);
  console.log('Nettoyage terminé.');
}

main().catch(e => { console.error(e); process.exit(1); });
