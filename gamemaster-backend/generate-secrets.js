#!/usr/bin/env node

/**
 *  Générateur de clés secrètes
 * Génère des clés cryptographiquement sûres pour les variables d'environnement
 */

const crypto = require('crypto');

console.log('\n GÉNÉRATEUR DE CLÉS SECRÈTES\n');
console.log('Copiez ces valeurs dans votre fichier .env.production\n');
console.log('=' .repeat());

// Générer les clés
const jwtSecret = crypto.randomBytes().toString('hex');
const sessionSecret = crypto.randomBytes().toString('hex');
const websocketSecret = crypto.randomBytes().toString('hex');

console.log('\n# Clés secrètes - NE JAMAIS PARTAGER');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log(`WEBSOCKET_SECRET=${websocketSecret}`);

console.log('\n' + '='.repeat());
console.log('\n  IMPORTANT:');
console.log('  . Sauvegardez ces clés dans un endroit sûr');
console.log('  . Ne les commitez JAMAIS dans Git');
console.log('  . Utilisez des clés différentes pour chaque environnement');
console.log('  . Changez-les régulièrement (tous les - mois)');
console.log('\n Configuration Render:');
console.log('  Dashboard > Environment > Add Environment Variable');
console.log('\n');
