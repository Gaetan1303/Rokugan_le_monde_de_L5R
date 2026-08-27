/**
 * Authentification Socket.IO basée sur le même JWT que l'API REST.
 * Le client transmet le token via `handshake.auth.token`.
 */
import jwt, { type JwtPayload } from 'jsonwebtoken';

class WebSocketAuth {
  private readonly secret: string;
  private readonly connectionsByIP = new Map<string, number>();
  private readonly maxConnectionsPerIP: number;

  constructor() {
    const configuredSecret = process.env.JWT_SECRET;

    if (process.env.NODE_ENV === 'production' && !configuredSecret) {
      throw new Error('JWT_SECRET doit être configuré pour sécuriser Socket.IO en production.');
    }

    this.secret = configuredSecret || 'development-only-secret-change-me';
    this.maxConnectionsPerIP = parseInt(process.env.WS_MAX_CONNECTIONS_PER_IP ?? '10', 10);
  }

  verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.secret);
      if (typeof decoded === 'string') throw new Error('Payload JWT invalide');
      return decoded;
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new Error('Token expiré');
      }
      throw new Error('Token invalide');
    }
  }

  middlewareSocketIO() {
    return (socket: any, next: (error?: Error) => void) => {
      const ip = this.getClientIP(socket);
      const currentConnections = this.connectionsByIP.get(ip) || 0;

      if (currentConnections >= this.maxConnectionsPerIP) {
        console.warn(`[WS] Limite de connexions atteinte pour ${ip}`);
        return next(new Error('Trop de connexions depuis cette IP'));
      }

      const token: string | undefined = socket.handshake.auth?.token;

      if (!token && process.env.NODE_ENV !== 'production') {
        const guest = {
          userId: socket.id,
          userName: 'Guest',
          userType: 'player' as const,
          authenticated: false
        };
        socket.data.userData = guest;
        socket.userData = guest;
        this.trackConnection(ip, 'connect');
        return next();
      }

      if (!token) {
        return next(new Error('Authentication required'));
      }

      try {
        const decoded = this.verifyToken(token);
        const userId = String(decoded['id'] ?? decoded['userId'] ?? '');
        const userName = String(decoded['name'] ?? decoded['userName'] ?? decoded['email'] ?? 'Utilisateur');
        const role = String(decoded['role'] ?? decoded['userType'] ?? 'joueur').toLowerCase();

        if (!userId) {
          return next(new Error('Invalid authentication token'));
        }

        const userData = {
          userId,
          userName,
          userType: role === 'gm' ? ('gm' as const) : ('player' as const),
          authenticated: true
        };

        socket.data.userData = userData;
        // Compatibilité temporaire avec d'anciens handlers.
        socket.userData = userData;
        this.trackConnection(ip, 'connect');
        return next();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error(`[WS] Échec authentification: ${message}`);
        return next(new Error('Invalid authentication token'));
      }
    };
  }

  trackConnection(ip: string, action: 'connect' | 'disconnect' = 'connect'): void {
    if (action === 'connect') {
      this.connectionsByIP.set(ip, (this.connectionsByIP.get(ip) || 0) + 1);
      return;
    }

    const current = this.connectionsByIP.get(ip) || 0;
    if (current <= 1) {
      this.connectionsByIP.delete(ip);
    } else {
      this.connectionsByIP.set(ip, current - 1);
    }
  }

  onDisconnect(socket: any): void {
    this.trackConnection(this.getClientIP(socket), 'disconnect');
  }

  getConnectionStats(): { totalIPs: number; totalConnections: number; maxConnectionsPerIP: number } {
    return {
      totalIPs: this.connectionsByIP.size,
      totalConnections: Array.from(this.connectionsByIP.values()).reduce((sum, count) => sum + count, 0),
      maxConnectionsPerIP: this.maxConnectionsPerIP
    };
  }

  resetIPConnections(ip: string): void {
    this.connectionsByIP.delete(ip);
  }

  private getClientIP(socket: any): string {
    const forwarded = socket.handshake.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return socket.handshake.address || 'unknown';
  }
}

const wsAuth = new WebSocketAuth();
export default wsAuth;
