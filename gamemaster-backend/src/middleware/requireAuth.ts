import { AuthService } from '../services/authService.js';
import { createRequireAuth } from './requireAuthCore.js';

const authService = new AuthService();

/** Exige un JWT valide (en-tête `Authorization: Bearer <token>`) et renseigne `req.user`. */
export const requireAuth = createRequireAuth((token) => authService.verifyToken(token));
