/**
 * [DEV SENIOR] Middleware d'authentification WebSocket - gestion des tokens et validation des connexions.
 * - Centralise la logique de sécurité pour les échanges temps réel.
 * - Adapter la configuration selon le niveau de sécurité requis en production.
 */
import * as jwt from 'jsonwebtoken';
/**
 *  AUTHENTIFICATION WEBSOCKET
 * Sécurise les connexions WebSocket avec JWT
 */
declare class WebSocketAuth {
    secret: string;
    tokenExpiration: string | number;
    connectionsByIP: Map<string, number>;
    maxConnectionsPerIP: number;
    constructor();
    /**
     * Génère un token d'authentification WebSocket
     */
    generateToken(userId: string, userName: string, userType?: string, roomId?: string | null): string;
    /**
     * Vérifie et décode un token
     */
    verifyToken(token: string): jwt.JwtPayload | string;
    /**
     * Middleware d'authentification pour Socket.IO
     */
    middlewareSocketIO(): (socket: any, next: any) => any;
    /**
     * Suivi des connexions par IP
     */
    trackConnection(ip: string, action?: string): void;
    /**
     * Nettoyage lors de la déconnexion
     */
    onDisconnect(socket: any): void;
    /**
     * Obtenir les statistiques de connexions
     */
    getConnectionStats(): {
        totalIPs: number;
        connectionsByIP: object;
        maxConnectionsPerIP: number;
    };
    /**
     * Réinitialiser les connexions pour une IP (en cas d'abus détecté)
     */
    resetIPConnections(ip: string): void;
}
declare const wsAuth: WebSocketAuth;
export default wsAuth;
//# sourceMappingURL=wsAuth.d.ts.map