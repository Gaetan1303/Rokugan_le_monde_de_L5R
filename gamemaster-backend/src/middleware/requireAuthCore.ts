import type { Request, Response, NextFunction } from 'express';
import type { AuthTokenPayload } from '../services/authService.js';

declare module 'express-serve-static-core' {
  interface Request {
    /** Renseigné par `requireAuth` : identité tirée du JWT, jamais du body. */
    user?: AuthTokenPayload;
  }
}

export type TokenVerifier = (token: string) => AuthTokenPayload;

/**
 * Fabrique le middleware à partir d'une fonction de vérification de token.
 * Séparé de `requireAuth.ts` pour pouvoir être testé sans charger TypeORM.
 */
export function createRequireAuth(verify: TokenVerifier) {
  return function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentification requise' });
      return;
    }
    try {
      req.user = verify(header.slice('Bearer '.length).trim());
      next();
    } catch {
      res.status(401).json({ error: 'Token invalide ou expiré' });
    }
  };
}
