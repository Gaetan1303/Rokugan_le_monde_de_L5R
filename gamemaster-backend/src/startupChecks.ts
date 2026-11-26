/**
 * Avertissements au démarrage pour les erreurs de configuration silencieuses mais dangereuses.
 * Fonction pure (testable) : le serveur les affiche, sans jamais s'arrêter.
 */
export function isHosted(env: NodeJS.ProcessEnv): boolean {
  return Boolean(env.RENDER || env.DYNO || env.FLY_APP_NAME || env.RAILWAY_ENVIRONMENT || env.VERCEL);
}

export function collectStartupWarnings(env: NodeJS.ProcessEnv): string[] {
  const warnings: string[] = [];
  const production = env.NODE_ENV === 'production';

  if (isHosted(env) && !production) {
    warnings.push(
      "NODE_ENV n'est pas 'production' alors que le serveur est hébergé : les connexions WebSocket « invité » " +
        'sont acceptées sans jeton et les messages d\'erreur détaillés sont renvoyés aux clients. Définis NODE_ENV=production.',
    );
  }
  if (isHosted(env) && !env.JWT_SECRET) {
    warnings.push(
      "JWT_SECRET est absent : un secret par défaut PUBLIC (visible dans le dépôt) signe les jetons, n'importe qui peut " +
        'donc forger un jeton valide. Définis JWT_SECRET (32 caractères aléatoires minimum).',
    );
  }
  return warnings;
}
