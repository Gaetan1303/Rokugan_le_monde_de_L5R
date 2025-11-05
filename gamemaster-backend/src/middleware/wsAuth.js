const jwt = require('jsonwebtoken');

/**
 *  AUTHENTIFICATION WEBSOCKET
 * Sécurise les connexions WebSocket avec JWT
 */

class WebSocketAuth {
  constructor() {
    this.secret = process.env.WEBSOCKET_SECRET || 'default_secret_CHANGE_ME';
    this.tokenExpiration = 'h';
    
    // Tracking des connexions par IP pour prévenir les abus
    this.connectionsByIP = new Map();
    this.maxConnectionsPerIP = parseInt(process.env.WS_MAX_CONNECTIONS_PER_IP) || ;
    
    if (this.secret === 'default_secret_CHANGE_ME' && process.env.NODE_ENV === 'production') {
      console.error(' ALERTE SÉCURITÉ: WEBSOCKET_SECRET non configuré en production!');
    }
  }

  /**
   * Génère un token d'authentification WebSocket
   */
  generateToken(userId, userName, userType = 'player', roomId = null) {
    const payload = {
      userId,
      userName,
      userType,
      roomId,
      iat: Math.floor(Date.now() / )
    };

    return jwt.sign(payload, this.secret, { 
      expiresIn: this.tokenExpiration 
    });
  }

  /**
   * Vérifie et décode un token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expiré');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Token invalide');
      }
      throw error;
    }
  }

  /**
   * Middleware d'authentification pour Socket.IO
   */
  middlewareSocketIO() {
    return (socket, next) => {
      const ip = socket.handshake.address;
      
      // . Vérifier le nombre de connexions par IP
      const currentConnections = this.connectionsByIP.get(ip) || ;
      if (currentConnections >= this.maxConnectionsPerIP) {
        console.warn(` IP ${ip} a atteint la limite de connexions (${this.maxConnectionsPerIP})`);
        return next(new Error('Trop de connexions depuis cette IP'));
      }

      // . Extraire et vérifier le token
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      
      // En développement, autoriser les connexions sans token (pour compatibilité)
      if (!token && process.env.NODE_ENV === 'development') {
        console.warn('  Connexion WebSocket sans token (mode développement)');
        socket.userData = { 
          userId: socket.id, 
          userName: 'Guest',
          userType: 'player',
          authenticated: false
        };
        this.trackConnection(ip, 'connect');
        return next();
      }

      // En production, token obligatoire
      if (!token) {
        console.error('Tentative de connexion WebSocket sans token');
        return next(new Error('Authentication required'));
      }

      // . Vérifier le token
      try {
        const decoded = this.verifyToken(token);
        socket.userData = {
          ...decoded,
          authenticated: true
        };
        
        this.trackConnection(ip, 'connect');
        console.log(` Connexion WebSocket authentifiée: ${decoded.userName} (${decoded.userType})`);
        next();
      } catch (error) {
        console.error(` Échec d'authentification WebSocket: ${error.message}`);
        return next(new Error('Invalid authentication token'));
      }
    };
  }

  /**
   * Suivi des connexions par IP
   */
  trackConnection(ip, action = 'connect') {
    if (action === 'connect') {
      const current = this.connectionsByIP.get(ip) || ;
      this.connectionsByIP.set(ip, current + );
    } else if (action === 'disconnect') {
      const current = this.connectionsByIP.get(ip) || ;
      if (current > ) {
        this.connectionsByIP.set(ip, current - );
      }
      // Nettoyer si plus de connexions
      if (current <= ) {
        this.connectionsByIP.delete(ip);
      }
    }
  }

  /**
   * Nettoyage lors de la déconnexion
   */
  onDisconnect(socket) {
    const ip = socket.handshake.address;
    this.trackConnection(ip, 'disconnect');
  }

  /**
   * Obtenir les statistiques de connexions
   */
  getConnectionStats() {
    return {
      totalIPs: this.connectionsByIP.size,
      connectionsByIP: Object.fromEntries(this.connectionsByIP),
      maxConnectionsPerIP: this.maxConnectionsPerIP
    };
  }

  /**
   * Réinitialiser les connexions pour une IP (en cas d'abus détecté)
   */
  resetIPConnections(ip) {
    this.connectionsByIP.delete(ip);
    console.log(` Connexions réinitialisées pour IP: ${ip}`);
  }
}

// Instance singleton
const wsAuth = new WebSocketAuth();

module.exports = wsAuth;
