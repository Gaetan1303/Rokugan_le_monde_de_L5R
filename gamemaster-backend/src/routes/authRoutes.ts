import { Router } from 'express';
import type { Request, Response } from 'express';
import { AuthService } from '../services/authService.js';

const router = Router();
const auth = new AuthService();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ ok: false, error: 'Champs requis manquants' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ ok: false, error: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    const result = await auth.register(String(name), String(email), String(password));
    return res.status(result.ok ? 201 : 409).json(result);
  } catch (error) {
    console.error('[AUTH] Erreur register:', error);
    return res.status(500).json({ ok: false, error: 'Erreur serveur' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Champs requis manquants' });
    }

    const result = await auth.login(String(email), String(password));
    return res.status(result.ok ? 200 : 401).json(result);
  } catch (error) {
    console.error('[AUTH] Erreur login:', error);
    return res.status(500).json({ ok: false, error: 'Erreur serveur' });
  }
});

/**
 * Compatibilité pour les anciens clients qui demandent un token WebSocket séparé.
 * L'identité est dérivée du JWT REST déjà authentifié afin d'empêcher l'usurpation
 * d'un userId/userName arbitraire dans le body.
 */
router.post('/ws-token', (req: Request, res: Response) => {
  try {
    const authorization = req.header('authorization');
    const accessToken = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : null;

    if (!accessToken) {
      return res.status(401).json({ ok: false, error: 'Bearer token requis' });
    }

    const decoded = auth.verifyToken(accessToken);
    const userType = String(decoded.role || 'joueur').toLowerCase() === 'gm' ? 'gm' : 'player';
    const token = auth.generateToken({
      userId: decoded.id,
      userName: decoded.name || decoded.email,
      userType,
      roomId: typeof req.body?.roomId === 'string' ? req.body.roomId : undefined
    });

    return res.json({
      ok: true,
      token,
      expiresIn: '24h'
    });
  } catch {
    return res.status(401).json({ ok: false, error: 'Token invalide ou expiré' });
  }
});

router.post('/verify-token', (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ ok: false, valid: false, error: 'Token manquant' });
    }

    const decoded = auth.verifyToken(String(token));
    return res.json({ ok: true, valid: true, user: decoded });
  } catch {
    return res.status(401).json({ ok: false, valid: false, error: 'Token invalide ou expiré' });
  }
});

export default router;
