/**
 * [DEV SENIOR] Routes Auth - expose les endpoints REST pour l'authentification WebSocket.
 * - Génération de tokens JWT, validation des identités, sécurité des connexions temps réel.
 * - Adapter les routes selon l'évolution des besoins métier et la politique de sécurité.
 */

// [IMPORTS] Import des modules Express et du middleware d'authentification WebSocket
import express from 'express';
const router = express.Router();
import wsAuth from '../middleware/wsAuth.js';

// [MAPPING] Mapping des endpoints vers la logique d'authentification WebSocket
/**
 *  Routes d'authentification pour WebSocket
 * Génère des tokens JWT pour les connexions WebSocket sécurisées
 */

/**
 * POST /api/auth/ws-token
 * Génère un token d'authentification WebSocket
 * 
 * Body: {
 *   userId: string (obligatoire)
 *   userName: string (obligatoire)
 *   userType: 'gm' | 'player' (optionnel, défaut: 'player')
 *   roomId: string (optionnel)
 * }
 */
router.post('/ws-token', (req, res) => {
  try {
    const { userId, userName, userType = 'player', roomId } = req.body;

    // Validation
    if (!userId || !userName) {
      return res.status(400).json({
        success: false,
        message: 'userId et userName sont obligatoires'
      });
    }

    if (userType && !['gm', 'player'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'userType doit être "gm" ou "player"'
      });
    }

    // Validation du nom d'utilisateur (sécurité)
    if (userName.length < 2 || userName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Le nom d\'utilisateur doit contenir entre 2 et 50 caractères'
      });
    }

    // Générer le token
    const token = wsAuth.generateToken(userId, userName, userType, roomId);

    res.json({
      success: true,
      token,
      expiresIn: '24h',
      user: {
        userId,
        userName,
        userType,
        roomId
      }
    });

  } catch (error) {
    console.error('Erreur génération token WebSocket:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du token'
    });
  }
});

/**
 * POST /api/auth/verify-token
 * Vérifie la validité d'un token WebSocket
 */
router.post('/verify-token', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token manquant'
      });
    }

    const decoded = wsAuth.verifyToken(token);

    res.json({
      success: true,
      valid: true,
      user: decoded
    });

  } catch (error) {
    let message = 'Erreur inconnue';
    if (error instanceof Error) {
      message = error.message;
    }
    res.status(401).json({
      success: false,
      valid: false,
      message
    });
  }
});

export default router;
