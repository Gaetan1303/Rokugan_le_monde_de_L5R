/**
 * [DEV SENIOR] Middleware d'authentification WebSocket - gestion des tokens et validation des connexions.
 * - Centralise la logique de sécurité pour les échanges temps réel.
 * - Adapter la configuration selon le niveau de sécurité requis en production.
 */

// [IMPORTS] Import des modules nécessaires pour la gestion des tokens JWT
import * as jwt from 'jsonwebtoken';

/**
 *  AUTHENTIFICATION WEBSOCKET
 * Sécurise les connexions WebSocket avec JWT
 */

class WebSocketAuth {
  secret: string;
  tokenExpiration: string | number;
  connectionsByIP: Map<string, number>;
  maxConnectionsPerIP: number;
  constructor() {
    this.secret = process.env.WEBSOCKET_SECRET || 'default_secret_CHANGE_ME';
    this.tokenExpiration = process.env.WS_TOKEN_EXPIRATION || '24h';
    
    // Tracking des connexions par IP pour prévenir les abus
      this.connectionsByIP = new Map<string, number>();
      this.maxConnectionsPerIP = parseInt(process.env.WS_MAX_CONNECTIONS_PER_IP ?? '10');
    
    if (this.secret === 'default_secret_CHANGE_ME' && process.env.NODE_ENV === 'production') {
      console.error(' ALERTE SÉCURITÉ: WEBSOCKET_SECRET non configuré en production!');
    }
  }

  /**
   * Génère un token d'authentification WebSocket
   */
  // (supprimé, version typée ci-dessous)
    generateToken(userId: string, userName: string, userType: string = 'player', roomId: string | null = null): string {
      const payload: Record<string, unknown> = {
        userId,
        userName,
        userType,
        roomId,
        iat: Math.floor(Date.now() / 1000)
      };
  return jwt.sign(payload, this.secret as string, { expiresIn: this.tokenExpiration } as jwt.SignOptions);
    }

  /**
   * Vérifie et décode un token
   */
  // (supprimé, version typée ci-dessous)
    verifyToken(token: string): jwt.JwtPayload | string {
      try {
        return jwt.verify(token, this.secret);
      } catch (error) {
        if (error instanceof Error && error.name === 'TokenExpiredError') {
          throw new Error('Token expiré');
        } else if (error instanceof Error && error.name === 'JsonWebTokenError') {
          throw new Error('Token invalide');
        }
        throw error;
      }
    }

  /**
   * Middleware d'authentification pour Socket.IO
   */
  // (supprimé, version typée ci-dessous)
    middlewareSocketIO() {
      return (socket: any, next: any) => {
        const ip: string = socket.handshake.address;
        const currentConnections = this.connectionsByIP.get(ip) || 0;
        if (currentConnections >= this.maxConnectionsPerIP) {
          console.warn(` IP ${ip} a atteint la limite de connexions (${this.maxConnectionsPerIP})`);
          return next(new Error('Trop de connexions depuis cette IP'));
        }
        const token: string | undefined = socket.handshake.auth?.token || socket.handshake.query?.token;
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
        if (!token) {
          console.error('Tentative de connexion WebSocket sans token');
          return next(new Error('Authentication required'));
        }
        try {
          const decoded = this.verifyToken(token);
          let userData: any = { authenticated: true };
          if (typeof decoded === 'object' && decoded !== null) {
            userData = { ...decoded, authenticated: true };
          }
          socket.userData = userData;
          this.trackConnection(ip, 'connect');
          // Affichage des infos utilisateur si elles existent
          const userName = (typeof decoded === 'object' && decoded !== null && 'userName' in decoded) ? (decoded as any).userName : undefined;
          const userType = (typeof decoded === 'object' && decoded !== null && 'userType' in decoded) ? (decoded as any).userType : undefined;
          console.log(` Connexion WebSocket authentifiée: ${userName ?? 'inconnu'} (${userType ?? 'inconnu'})`);
          next();
        } catch (error) {
          let message = 'Erreur inconnue';
          if (error instanceof Error) message = error.message;
          console.error(` Échec d'authentification WebSocket: ${message}`);
          return next(new Error('Invalid authentication token'));
        }
      };
    }

  /**
   * Suivi des connexions par IP
   */
  trackConnection(ip: string, action: string = 'connect') {
    if (action === 'connect') {
      const current = this.connectionsByIP.get(ip) || 0;
      this.connectionsByIP.set(ip, current + 1);
    } else if (action === 'disconnect') {
      const current = this.connectionsByIP.get(ip) || 0;
      if (current > 1) {
        this.connectionsByIP.set(ip, current - 1);
      }
      // Nettoyer si plus de connexions
      if (current <= 1) {
        this.connectionsByIP.delete(ip);
      }
    }
  }

  /**
   * Nettoyage lors de la déconnexion
   */
  onDisconnect(socket: any) {
    const ip = socket.handshake.address;
    this.trackConnection(ip, 'disconnect');
  }

  /**
   * Obtenir les statistiques de connexions
   */
  getConnectionStats(): { totalIPs: number; connectionsByIP: object; maxConnectionsPerIP: number } {
    return {
      totalIPs: this.connectionsByIP.size,
      connectionsByIP: Object.fromEntries(this.connectionsByIP),
      maxConnectionsPerIP: this.maxConnectionsPerIP
    };
  }

  /**
   * Réinitialiser les connexions pour une IP (en cas d'abus détecté)
   */
  resetIPConnections(ip: string) {
    this.connectionsByIP.delete(ip);
    console.log(` Connexions réinitialisées pour IP: ${ip}`);
  }
}

// Instance singleton
const wsAuth = new WebSocketAuth();

// [EXPORT] Export du middleware principal pour intégration dans Socket.io
export default wsAuth;
