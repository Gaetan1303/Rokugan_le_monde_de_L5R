import fs from 'fs';
const BASE_URL = 'https://gm-l5r.onrender.com';
type Step = {
	action: string;
	input?: any;
	expected?: string;
	start: number;
	end?: number;
	duration?: number;
	success?: boolean;
	code?: number;
	message?: string;
	error?: string;
	comment?: string;
};

async function testCreateRoomNoToken() {
	const step: Step = { action: 'Créer une room sans token', start: Date.now(), input: { name: 'Room sans token' }, expected: '401 Unauthorized' };
	try {
		const res = await fetch(`${BASE_URL}/api/rooms`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: 'Room sans token' })
		});
		step.code = res.status;
		step.message = await res.text();
		step.success = res.status === 401;
		step.comment = step.success ? 'Erreur attendue (401)' : 'Erreur non conforme';
	} catch (e) {
		step.success = false;
		step.error = String(e);
	}
	step.end = Date.now();
	step.duration = step.end - step.start;
	return step;
}

async function testCreateRoomEmptyName(token: string) {
	const step: Step = { action: 'Créer une room avec nom vide', start: Date.now(), input: { name: '' }, expected: '400 Bad Request' };
	try {
		const res = await fetch(`${BASE_URL}/api/rooms`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
			body: JSON.stringify({ name: '' })
		});
		step.code = res.status;
		step.message = await res.text();
		step.success = res.status === 400;
		step.comment = step.success ? 'Erreur attendue (400)' : 'Erreur non conforme';
	} catch (e) {
		step.success = false;
		step.error = String(e);
	}
	step.end = Date.now();
	step.duration = step.end - step.start;
	return step;
}

async function testAddPlayerBadRole(token: string, roomId: string, userId: string) {
	const step: Step = { action: 'Ajout de joueur avec mauvais rôle', start: Date.now(), input: { userId, role: 'admin' }, expected: '400 Bad Request' };
	try {
		const res = await fetch(`${BASE_URL}/api/rooms/${roomId}/players`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
			body: JSON.stringify({ userId, role: 'admin' })
		});
		step.code = res.status;
		step.message = await res.text();
		step.success = res.status === 400;
		step.comment = step.success ? 'Erreur attendue (400)' : 'Erreur non conforme';
	} catch (e) {
		step.success = false;
		step.error = String(e);
	}
	step.end = Date.now();
	step.duration = step.end - step.start;
	return step;
}

async function main() {
	const report: Step[] = [];
	// 1. Création de room sans token
	report.push(await testCreateRoomNoToken());

	// 2. Préparation d’un utilisateur et d’un token valides
	const unique = Date.now();
	const email = `testeur${unique}@test.com`;
	const password = 'test123';
	let token = '';
	let userId = '';
	let roomId = '';
	// Register + login
	try {
		const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password, name: 'Testeur' })
		});
		await regRes.text();
		const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		});
		const loginData = await loginRes.json();
		token = loginData.token;
		userId = loginData.user?.id || loginData.user?._id || loginData.user?.uuid;
	} catch {}

	// 3. Création de room avec nom vide
	if (token) {
		const step = await testCreateRoomEmptyName(token);
		report.push(step);
		// 4. Création d’une vraie room pour la suite
		const res = await fetch(`${BASE_URL}/api/rooms`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
			body: JSON.stringify({ name: 'Room pour test erreur' })
		});
		if (res.ok) {
			const room = await res.json();
			roomId = room.id || room._id || room.uuid;
		}
	}

	// 5. Ajout de joueur avec mauvais rôle
	if (token && roomId && userId) {
		const step = await testAddPlayerBadRole(token, roomId, userId);
		report.push(step);
	}

	// Génération du rapport markdown
	let md = `# Rapport de test d’erreur : test de room\n\n`;
	md += `**Date d’exécution :** ${new Date().toLocaleString()}\n\n`;
	for (const s of report) {
		md += `- **${s.action}**\n`;
		md += `    - Input : \`${JSON.stringify(s.input)}\`\n`;
		md += `    - Attendu : ${s.expected}\n`;
		md += `    - Code HTTP : ${s.code}\n`;
		md += `    - Succès : ${s.success ? 'NON' : 'OUI'}\n`;
		md += `    - Message : \`${s.message || s.error || ''}\`\n`;
		md += `    - Durée : ${s.duration} ms\n`;
		md += `    - Commentaire : ${s.comment || ''}\n`;
	}
	fs.writeFileSync('./docs/test de room - erreurs.md', md, 'utf-8');
	console.log('Rapport d’erreur généré dans docs/test de room - erreurs.md');
}

main();
// Script de test d’erreur pour API room/scenario
// Inspiré des pratiques métier QA/testeur
// Génère un rapport structuré dans docs/test de room - erreurs.md

// À compléter : ce fichier sera le point d’entrée du test d’erreur automatisé.

// Exemples de cas à tester :
// - Création de room sans token
// - Création de room avec nom vide
// - Ajout de joueur avec mauvais rôle
// - Ajout de joueur avec mauvais token
// - Création de scénario avec données manquantes
// - Suppression d’une room inexistante
// - Suppression d’un scénario déjà supprimé
// - Accès à une room/scenario avec mauvais token
// - etc.

// Le script produira un rapport markdown détaillé à la fin.

// (L’implémentation détaillée suit dans les prochaines étapes)
