// --- TEST : reconnexion d'un joueur dans une room ---
async function testReconnectPlayerInRoom() {
	const results: TestResult[] = [];
	const unique = Date.now();
	// 1. Création joueur
	const registerPayload = { name: 'Ronin'+unique, email: `ronin${unique}@l5r.com`, password: 'Bushido42!' };
	let userId = '', token = '';
	let res: any, json: any = null, status: number = 0, duration: number = 0, start: number;

	// Helper pour retry sur 429
	async function fetchWith429Retry(url: string, options: any, label: string, maxRetries = 5, baseDelay = 1000) {
		let attempt = 0;
		let res, json = null, status = 0, ok = false, error = '', duration = 0, start = 0;
		while (attempt <= maxRetries) {
			start = Date.now();
			try {
				res = await fetch(url, options);
				status = res.status ?? 0;
				ok = res.ok ?? false;
				try { json = await res.json(); } catch { json = null; }
				if (status !== 429) break;
				// Attendre avant retry
				const wait = baseDelay * Math.pow(2, attempt);
				console.warn(`429 reçu pour ${label}, tentative ${attempt+1}/${maxRetries+1}, attente ${wait}ms...`);
				await new Promise(r => setTimeout(r, wait));
			} catch (e) {
				error = String(e);
				break;
			}
			attempt++;
		}
		duration = Date.now() - start;
		return { res, json, status, ok, error, duration };
	}

	// REGISTER
	const regRes = await fetchWith429Retry(BASE_URL + '/api/auth/register', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(registerPayload)
	}, 'Inscription joueur');
	userId = regRes.json?.user?.id || regRes.json?.userId || '';
	results.push({ route: '/api/auth/register', label: 'Inscription joueur', method: 'POST', status: regRes.status || 0, duration: regRes.duration, ok: regRes.ok || false, json: regRes.json, error: regRes.error||'' });

	// LOGIN
	const loginPayload = { email: registerPayload.email, password: registerPayload.password };
	const loginRes = await fetchWith429Retry(BASE_URL + '/api/auth/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(loginPayload)
	}, 'Connexion joueur');
	token = loginRes.json?.token || loginRes.json?.jwt || '';
	results.push({ route: '/api/auth/login', label: 'Connexion joueur', method: 'POST', status: loginRes.status || 0, duration: loginRes.duration, ok: loginRes.ok || false, json: loginRes.json, error: loginRes.error||'' });

	// CRÉATION ROOM (par le joueur, il devient GM)
	const roomPayload = { name: 'Salle de test reconnexion '+unique, gmId: userId };
	let roomId = '';
	const roomRes = await fetchWith429Retry(BASE_URL + '/api/rooms', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
		body: JSON.stringify(roomPayload)
	}, 'Création de room');
	roomId = roomRes.json?.id || roomRes.json?._id || roomRes.json?.roomId || '';
	results.push({ route: '/api/rooms', label: 'Création de room', method: 'POST', status: roomRes.status || 0, duration: roomRes.duration, ok: roomRes.ok || false, json: roomRes.json, error: roomRes.error||'' });

	// Si roomId est vide, on arrête le test pour éviter les routes invalides
	if (!roomId) {
		results.push({
			route: '/api/rooms/:roomId/players',
			label: 'Ajout joueur (avec perso)',
			method: 'POST',
			status: 400,
			duration: 0,
			ok: false,
			json: null,
			error: 'roomId non récupéré, test interrompu.'
		});
		return results;
	}

	// AJOUT DU JOUEUR DANS LA ROOM (avec personnage)
	const character = { nom: 'Kakita', anneaux: { air: 2, terre: 3 } };
	const playerPayload = { userId, role: 'player', character };
	const addRes = await fetchWith429Retry(BASE_URL + `/api/rooms/${roomId}/players`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
		body: JSON.stringify(playerPayload)
	}, 'Ajout joueur (avec perso)');
	const playerInRoomId = addRes.json?.player?.id || addRes.json?.id || '';
	results.push({ route: `/api/rooms/${roomId}/players`, label: 'Ajout joueur (avec perso)', method: 'POST', status: addRes.status || 0, duration: addRes.duration, ok: addRes.ok || false, json: addRes.json, error: addRes.error||'' });

	// SIMULER DÉCONNEXION : suppression du joueur de la room
	const delRes = await fetchWith429Retry(BASE_URL + `/api/rooms/${roomId}/players`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
		body: JSON.stringify({ userId })
	}, 'Déconnexion (suppression du joueur)');
	results.push({ route: `/api/rooms/${roomId}/players`, label: 'Déconnexion (suppression du joueur)', method: 'DELETE', status: delRes.status || 0, duration: delRes.duration, ok: delRes.ok || false, json: delRes.json, error: delRes.error||'' });

	// RECONNEXION : ré-ajout du joueur dans la room (même userId, même perso)
	const recRes = await fetchWith429Retry(BASE_URL + `/api/rooms/${roomId}/players`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
		body: JSON.stringify(playerPayload)
	}, 'Reconnexion joueur');
	results.push({ route: `/api/rooms/${roomId}/players`, label: 'Reconnexion joueur', method: 'POST', status: recRes.status || 0, duration: recRes.duration, ok: recRes.ok || false, json: recRes.json, error: recRes.error||'' });

	// VÉRIFICATION : récupérer la room et vérifier que le joueur a gardé son perso
	const verifRes = await fetchWith429Retry(BASE_URL + `/api/rooms/${roomId}`, {}, 'Vérification persistance perso');
	let persOk = false, persError = '';
	const found = (verifRes.json?.players || []).find((p: any) => p.user?.id === userId);
	if (found && found.character && found.character.nom === 'Kakita') {
		persOk = true;
	} else {
		persOk = false;
		persError = 'Le personnage n’a pas été conservé après reconnexion.';
	}
	results.push({ route: `/api/rooms/${roomId}`, label: 'Vérification persistance perso', method: 'GET', status: verifRes.status || 0, duration: verifRes.duration, ok: persOk, json: verifRes.json, error: persError||verifRes.error||'' });

	return results;
}
// Script de test universel pour toutes les routes de l’API
// Génère un rapport structuré dans docs/test_all_routes.md
// Pour chaque endpoint détecté, effectue un appel adapté et logue le résultat


// Dépendances : node-fetch (ou fetch natif Node 18+), fs
import fs from 'fs/promises';
// Utilisation de fetch natif Node.js 18+ ou via tsx (npx tsx ...)
declare const fetch: typeof globalThis.fetch;
if (typeof fetch !== 'function') {
  console.error('❌ fetch n\'est pas disponible dans cet environnement. Utilisez Node.js 18+ ou lancez avec npx tsx docs/test_all_routes.ts');
  process.exit(1);
}

// Liste des routes GET publiques à tester (certains chemins seront remplacés dynamiquement)
const GET_ROUTES = [
  { path: '/api/rooms', label: 'Liste des rooms' },
  { path: '/api/rooms/stats', label: 'Stats rooms' },
  { path: '/api/rooms/gm/:gmId', label: 'Rooms par GM (id dynamique)' },
  { path: '/api/rooms/player/:playerId', label: 'Rooms par joueur (id dynamique)' },
  { path: '/api/rooms/:roomId', label: 'Room par id (id dynamique)' },
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

const BASE_URL = process.env.TEST_API_URL || 'https://gm-l5r.onrender.com';
const REPORT_PATH = 'docs/test_all_routes.md';


function formatResult({ route, label, status, duration, ok, json, error }: {
	route: string,
	label: string,
	status: number,
	duration: number,
	ok: boolean,
	json: any,
	error: string
}) {
	let emoji = ok ? '🈴' : (status === 404 ? '🈚' : '🈲');
	let honneur = ok ? 'Honneur préservé.' : (status === 404 ? 'Honte : la ressource est introuvable.' : 'Honte : le serveur a failli à sa tâche.');
	let commentaire = ok
		? 'Le Kami de l’API sourit à cette requête.'
		: (status === 404
			? 'Le bushido enseigne la patience : la ressource n’existe pas ou n’est plus.'
			: 'Le Maître du code doit méditer sur cette erreur.');
	return [
		`## ${emoji} ${label} \`${route}\``,
		`- **Code HTTP** : ${status}`,
		`- **Durée** : ${duration} ms`,
		`- **Résultat** : ${ok ? 'Réussite' : 'Échec'}`,
		`- **Honneur** : ${honneur}`,
		error ? `- **Erreur** : ${error}` : '',
		json ? `- **Extrait réponse** : \`
${JSON.stringify(json, null, 2).slice(0, 400)}\`` : '',
		`- **Commentaire** : ${commentaire}`,
		''
	].join('\n');
}

async function testAllGetRoutes() {
	const results = [];
	// Récupérer un vrai UUID de room, gmId, playerId si possible
	let roomId = '', gmId = '', playerId = '';
	try {
		const res = await fetch(BASE_URL + '/api/rooms');
		const data = await res.json();
		if (Array.isArray(data) && data.length > 0) {
			roomId = data[0].id || data[0]._id || '';
			gmId = data[0].gmId || data[0].gm_id || '';
			if (Array.isArray(data[0].players) && data[0].players.length > 0) {
				playerId = data[0].players[0].id || data[0].players[0]._id || '';
			}
		}
	} catch {}

	for (const { path, label } of GET_ROUTES) {
		let realPath = path
			.replace(':roomId', roomId || '00000000-0000-0000-0000-000000000000')
			.replace(':gmId', gmId || '00000000-0000-0000-0000-000000000000')
			.replace(':playerId', playerId || '00000000-0000-0000-0000-000000000000');
		const url = BASE_URL + realPath;
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
		results.push({ route: realPath, label, status, duration, ok, json, error });
		let emoji = ok ? '🈴' : (status === 404 ? '🈚' : '🈲');
		let logMsg = ok
			? `${emoji} [${status}] ${realPath} (${duration}ms) Honneur préservé.`
			: (status === 404
				? `${emoji} [${status}] ${realPath} (${duration}ms) Honte : ressource introuvable.`
				: `${emoji} [${status}] ${realPath} (${duration}ms) Honte : erreur serveur.`);
		console.log(logMsg);
	}
	return results;
}


// --- TESTS CIBLÉS POST/PUT/DELETE ---

type TestResult = {
	route: string;
	label: string;
	method: string;
	status: number;
	duration: number;
	ok: boolean;
	json: any;
	error: string;
};

async function testTargetedRoutes() {
	const results: TestResult[] = [];
	// 1. Auth: register
	const unique = Date.now();
	const registerPayload = { name: 'Testeur'+unique, email: `testeur${unique}@l5r.com`, password: 'Bushido42!' };
	let userId = '', token = '';
	let res: any, json: any = null, status: number = 0, ok: boolean = false, error: string = '', duration: number = 0, start: number;

	// REGISTER
	start = Date.now();
	try {
		res = await fetch(BASE_URL + '/api/auth/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(registerPayload)
		});
		status = res.status ?? 0;
		ok = res.ok ?? false;
		try { json = await res.json(); } catch { json = null; }
		userId = json?.user?.id || json?.userId || '';
	} catch (e) { error = String(e); }
	duration = Date.now() - start;
	results.push({ route: '/api/auth/register', label: 'Inscription', method: 'POST', status: status || 0, duration, ok: ok || false, json, error: error||'' });

	// LOGIN
	const loginPayload = { email: registerPayload.email, password: registerPayload.password };
	error = '';
	status = 0; ok = false; json = null;
	start = Date.now();
	try {
		res = await fetch(BASE_URL + '/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(loginPayload)
		});
		status = res.status ?? 0;
		ok = res.ok ?? false;
		try { json = await res.json(); } catch { json = null; }
		token = json?.token || json?.jwt || '';
	} catch (e) { error = String(e); }
	duration = Date.now() - start;
	results.push({ route: '/api/auth/login', label: 'Connexion', method: 'POST', status: status || 0, duration, ok: ok || false, json, error: error||'' });

	// ROOM: création
	error = '';
	status = 0; ok = false; json = null;
	const roomPayload = { name: 'Salle de test '+unique, gmId: userId };
	let roomId = '';
	start = Date.now();
	try {
		res = await fetch(BASE_URL + '/api/rooms', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(roomPayload)
		});
		status = res.status ?? 0;
		ok = res.ok ?? false;
		try { json = await res.json(); } catch { json = null; }
		roomId = json?.id || json?._id || '';
	} catch (e) { error = String(e); }
	duration = Date.now() - start;
	results.push({ route: '/api/rooms', label: 'Création de room', method: 'POST', status: status || 0, duration, ok: ok || false, json, error: error||'' });

	// ROOM: ajout joueur
	error = '';
	status = 0; ok = false; json = null;
	const playerPayload = { name: 'Joueur '+unique };
	let playerId = '';
	start = Date.now();
	try {
		res = await fetch(BASE_URL + `/api/rooms/${roomId}/players`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(playerPayload)
		});
		status = res.status ?? 0;
		ok = res.ok ?? false;
		try { json = await res.json(); } catch { json = null; }
		playerId = json?.id || json?._id || '';
	} catch (e) { error = String(e); }
	duration = Date.now() - start;
	results.push({ route: `/api/rooms/${roomId}/players`, label: 'Ajout joueur', method: 'POST', status: status || 0, duration, ok: ok || false, json, error: error||'' });

	// SCENARIO: création
	error = '';
	status = 0; ok = false; json = null;
	const scenarioPayload = { name: 'Scénario test '+unique, gmId: userId };
	let scenarioId = '';
	start = Date.now();
	try {
		res = await fetch(BASE_URL + '/api/scenarios', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(scenarioPayload)
		});
		status = res.status ?? 0;
		ok = res.ok ?? false;
		try { json = await res.json(); } catch { json = null; }
		scenarioId = json?.id || json?._id || '';
	} catch (e) { error = String(e); }
	duration = Date.now() - start;
	results.push({ route: '/api/scenarios', label: 'Création scénario', method: 'POST', status: status || 0, duration, ok: ok || false, json, error: error||'' });

	// SCENARIO: suppression
	error = '';
	status = 0; ok = false; json = null;
	start = Date.now();
	try {
		res = await fetch(BASE_URL + `/api/scenarios/${scenarioId}`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' }
		});
		status = res.status ?? 0;
		ok = res.ok ?? false;
		try { json = await res.json(); } catch { json = null; }
	} catch (e) { error = String(e); }
	duration = Date.now() - start;
	results.push({ route: `/api/scenarios/${scenarioId}`, label: 'Suppression scénario', method: 'DELETE', status: status || 0, duration, ok: ok || false, json, error: error||'' });

	return results;
}

function formatResultFull({ route, label, method, status, duration, ok, json, error }: TestResult) {
	let emoji = ok ? '🈴' : (status === 404 ? '🈚' : '🈲');
	let honneur = ok ? 'Honneur préservé.' : (status === 404 ? 'Honte : la ressource est introuvable.' : 'Honte : le serveur a failli à sa tâche.');
	let commentaire = ok
		? 'Le Kami de l’API sourit à cette requête.'
		: (status === 404
			? 'Le bushido enseigne la patience : la ressource n’existe pas ou n’est plus.'
			: 'Le Maître du code doit méditer sur cette erreur.');
	return [
		`## ${emoji} ${label} [${method}] \`${route}\``,
		`- **Méthode** : ${method}`,
		`- **Code HTTP** : ${status}`,
		`- **Durée** : ${duration} ms`,
		`- **Résultat** : ${ok ? 'Réussite' : 'Échec'}`,
		`- **Honneur** : ${honneur}`,
		error ? `- **Erreur** : ${error}` : '',
		json ? `- **Extrait réponse** : \
${JSON.stringify(json, null, 2).slice(0, 400)}\`` : '',
		`- **Commentaire** : ${commentaire}`,
		''
	].join('\n');
}



// Nouveau main qui exécute tous les tests et génère un rapport complet
async function main() {
	const date = new Date().toLocaleString('fr-FR');
	const resultsGet = await testAllGetRoutes();
	const resultsTargeted = await testTargetedRoutes();
	const resultsReconnect = await testReconnectPlayerInRoom();
	let md = `# Rapport de test automatisé : toutes les routes\n\n**Date d’exécution :** ${date}\n\n`;
	md += '\n---\n';
	for (const r of resultsGet) md += '\n' + formatResult(r) + '\n';
	md += '\n---\n# Tests ciblés POST/DELETE\n';
	for (const r of resultsTargeted) md += '\n' + formatResultFull(r) + '\n';
	md += '\n---\n# Test reconnexion joueur dans une room\n';
	for (const r of resultsReconnect) md += '\n' + formatResultFull(r) + '\n';
	await fs.writeFile(REPORT_PATH, md, 'utf-8');
	console.log(`\nRapport généré dans ${REPORT_PATH}`);
}

main();
