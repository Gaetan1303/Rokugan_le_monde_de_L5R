const express = require('express');
const router = express.Router();
const wsAuth = require('../middleware/wsAuth');

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
      return res.status().json({
        success: false,
        message: 'userId et userName sont obligatoires'
      });
    }

    if (userType && !['gm', 'player'].includes(userType)) {
      return res.status().json({
        success: false,
        message: 'userType doit être "gm" ou "player"'
      });
    }

    // Validation du nom d'utilisateur (sécurité)
    if (userName.length <  || userName.length > ) {
      return res.status().json({
        success: false,
        message: 'Le nom d\'utilisateur doit contenir entre  et  caractères'
      });
    }

    // Générer le token
    const token = wsAuth.generateToken(userId, userName, userType, roomId);

    res.json({
      success: true,
      token,
      expiresIn: 'h',
      user: {
        userId,
        userName,
        userType,
        roomId
      }
    });

  } catch (error) {
    console.error('Erreur génération token WebSocket:', error);
    res.status().json({
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
      return res.status().json({
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
    res.status().json({
      success: false,
      valid: false,
      message: error.message
    });
  }
});

module.exports = router;
