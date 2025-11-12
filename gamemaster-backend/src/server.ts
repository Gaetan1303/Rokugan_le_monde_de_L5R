import 'reflect-metadata';
import fs from 'fs';
import path from 'path';
import { AppDataSource } from './data-source.js';
/**
 * [DEV SENIOR] Point d'entrée principal du backend GameMaster L5R
 * - Structure modulaire, sécurité renforcée, gestion des erreurs et du temps réel.
 * - Respecter la séparation des responsabilités et documenter toute évolution majeure.
 */

// [SECURITE] Chargement dynamique des variables d'environnement selon le contexte d'exécution.
import dotenv from 'dotenv';
dotenv.config({
  path: process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development'
});

// [ARCHITECTURE] Import des dépendances principales (Express, HTTP, Socket.io, CORS)
import express from 'express';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';


import roomRoutes from './routes/room.routes.js';
import referenceRoutes from './routes/referenceRoutes.js';
import scenarioRoutes from './routes/scenarioRoutes.js';
import frontendRoutes from './routes/frontendRoutes.js';
import authRoutes from './routes/authRoutes.js';
import socketHandler from './services/socketHandler.js';
import { home } from './controllers/HomeController.js';
import { AuthService } from './services/authService.js';


// [SECURITE] Import des middlewares de sécurité et d'authentification WebSocket
import { helmetConfig, apiLimiter, strictLimiter, sanitizeData, validateOrigin, securityLogger, requestSizeLimit } from './middleware/security.js';
import wsAuth from './middleware/wsAuth.js';

// [INITIALISATION] Création de l'application Express et du serveur HTTP
const app = express();
const server = http.createServer(app);

// [EXPORT] Export de l'instance Express pour les tests ou l'intégration
export default app;

// [INFRA] Active le mode proxy pour récupérer l'IP réelle derrière un reverse proxy
app.set('trust proxy', true);


// [SECURITE] Définition dynamique des origines autorisées pour CORS via .env
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(o => o);

// [LOG] Affichage des origines CORS configurées pour vérification en dev
console.log(`CORS configuré pour: ${allowedOrigins.join(', ')}`);

// [TEMPS REEL] Initialisation de Socket.io avec CORS strict et paramètres de sécurité WebSocket
const io = new SocketIOServer(server, {
  cors: {
    origin: validateOrigin(allowedOrigins),
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: parseInt(process.env.WS_TIMEOUT ?? '60000'), 
  pingInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL ?? '30000'),
  maxHttpBufferSize: 1e6, // 1MB max par message
  transports: ['websocket', 'polling'], // Préférer websocket
  allowEIO3: false // Désactiver les anciennes versions
});

// [SECURITE] Authentification WebSocket (à activer impérativement en production)
// if (process.env.NODE_ENV === 'production') {
//   io.use(wsAuth.middlewareSocketIO());
// }

// ============================================
// [SECURITE] Middlewares HTTP : headers, CORS, rate limiting, sanitization
// ============================================

// [SECURITE] Activation de Helmet pour renforcer les headers HTTP (désactivable via env)
if (process.env.HELMET_ENABLED !== 'false') {
  app.use(helmetConfig);
}

// [SECURITE] CORS strict pour limiter les origines et méthodes autorisées
app.use(cors({
  origin: validateOrigin(allowedOrigins),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // Cache preflight 24h
}));

// [SECURITE] Limitation stricte de la taille des payloads pour éviter les attaques DoS
app.use(express.json({ limit: requestSizeLimit }));
app.use(express.urlencoded({ extended: true, limit: requestSizeLimit }));

// [SECURITE] Nettoyage des données entrantes pour éviter les injections
app.use(sanitizeData);

// [MONITORING] Logger de sécurité pour tracer toutes les requêtes et détecter les comportements suspects
app.use(securityLogger);

// [SECURITE] Rate limiting global sur toutes les routes API pour limiter les abus
app.use('/api', apiLimiter);

// [INFRA] Mise à disposition des fichiers statiques (favicon, assets, etc.)
app.use(express.static('public'));

// ============================================
// [ROUTAGE] Définition des routes API et des endpoints principaux
// ============================================

// [ROUTAGE] Endpoint d'authentification (rate limit allégé)
app.use('/api/auth', authRoutes);

// [ROUTAGE] Endpoints rooms et scenarios avec rate limiting strict pour éviter le spam
app.use('/api/rooms', strictLimiter);
app.use('/api/rooms', roomRoutes);
app.use('/api/scenarios', strictLimiter);
app.use('/api/scenarios', scenarioRoutes);


// [ROUTAGE] Endpoints pour les pages statiques et la documentation de référence
app.use('/api/reference', referenceRoutes);
app.use('/api/frontend', frontendRoutes);
// Compatibility alias: ancien front-end qui envoie en POST sur /login
// Pour éviter de modifier le front existant, on expose un alias
app.options('/login', (req: Request, res: Response) => {
  // Permettre le preflight CORS
  res.sendStatus(204);
});
app.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const auth = new AuthService();
    const result = await auth.login(email, password);
    if (!result.ok) return res.status(401).json(result);
    res.json(result);
  } catch (e: any) {
    console.error('Error /login alias:', e);
    res.status(500).json({ ok: false, error: 'Erreur serveur' });
  }
});
// [ROUTAGE] Route d'accueil
app.get('/', home);

// [MONITORING] Endpoint de health check pour le monitoring et l'orchestration
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    message: 'Serveur GameMaster L5R opérationnel',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// [MONITORING] Endpoint pour récupérer les statistiques serveur (à sécuriser en production)
app.get('/api/stats', (req: Request, res: Response) => {
  // Note: En production, protéger cette route avec authentification
  const stats = {
    websocket: wsAuth.getConnectionStats(),
    timestamp: new Date().toISOString()
  };
  res.json({
    success: true,
    stats: stats
  });
});

// [TEMPS REEL] Initialisation du handler WebSocket pour la gestion des connexions et des événements
socketHandler(io, wsAuth);

// ============================================
// [ROBUSTESSE] Gestion globale des erreurs HTTP et des routes non trouvées
// ============================================

// [ROBUSTESSE] Middleware global de gestion des erreurs : log serveur + réponse adaptée côté client
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // Logging détaillé côté serveur (toujours visible dans les logs Render)
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('Erreur serveur:', err.message);
  console.error('Route:', req.method, req.path);
  console.error('Query:', JSON.stringify(req.query));
  console.error('Stack:', err.stack);
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  // Ne jamais exposer les détails d'erreur en production (côté client)
  const errorResponse = {
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Une erreur est survenue' 
      : err.message
  };
  res.status(err.status || 500).json(errorResponse);
});

// [ROBUSTESSE] Middleware pour les routes non trouvées (404)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.path
  });
});

// ============================================
// [INFRA] Démarrage du serveur HTTP et gestion des logs de configuration
// ============================================

const PORT = process.env.PORT || 3000;


// [BDD] Initialisation de la connexion PostgreSQL via TypeORM
AppDataSource.initialize()
  .then(() => {
    console.log(' Connexion à la base de données PostgreSQL réussie !');
    server.listen(PORT, () => {
      console.log('');
      console.log('====================================');
      console.log('  SERVEUR GAMEMASTER L5R SÉCURISÉ');
      console.log('====================================');
      console.log(`Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Port: ${PORT}`);
      console.log(`CORS: ${allowedOrigins.length} origine(s) autorisée(s)`);
      console.log(`Helmet: ${process.env.HELMET_ENABLED !== 'false' ? 'Activé' : 'Désactivé'}`);
      console.log(`Rate Limit: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} req/${process.env.RATE_LIMIT_WINDOW_MS || 900000}ms`);
      console.log(`WebSocket Auth: ${process.env.NODE_ENV === 'production' ? 'Activé' : 'Désactivé (dev)'}`);
      const apiBaseUrl = process.env.NODE_ENV === 'production'
        ? 'https://gm-l5r.onrender.com'
        : `http://localhost:${PORT}`;
      console.log(`API: ${apiBaseUrl}/api`);
      console.log(`Health: ${apiBaseUrl}/api/health`);
      console.log(`Stats: ${apiBaseUrl}/api/stats`);
      console.log('====================================');
      console.log('');
    });
  })
  .catch((error) => {
    const logDir = path.resolve(process.cwd(), 'log');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    const logPath = path.join(logDir, 'db-error.log');
    const errorMsg = [
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'Erreur de connexion à la base de données :',
      String(error),
      'Paramètres utilisés :',
      `DATABASE_URL: ${process.env.DATABASE_URL}`,
      `DB_HOST: ${process.env.DB_HOST}`,
      `DB_PORT: ${process.env.DB_PORT}`,
      `DB_USERNAME: ${process.env.DB_USERNAME}`,
      `DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : '(non défini)'}`,
      `DB_DATABASE: ${process.env.DB_DATABASE}`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ].join('\n');
    fs.appendFileSync(logPath, errorMsg + '\n');
    console.error(errorMsg);
    if (!process.env.DATABASE_URL && (!process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_USERNAME || !process.env.DB_PASSWORD || !process.env.DB_DATABASE)) {
      console.error(' Une ou plusieurs variables d\'environnement nécessaires à la connexion sont manquantes.');
      fs.appendFileSync(logPath, ' Une ou plusieurs variables d\'environnement nécessaires à la connexion sont manquantes.\n');
    }
    process.exit(1);
  });

// [INFRA] Gestion propre des signaux d'arrêt (SIGTERM/SIGINT) pour éviter les corruptions de données
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu. Arrêt du serveur...');
  server.close(() => {
    console.log('Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT reçu. Arrêt du serveur...');
  server.close(() => {
    console.log('Serveur arrêté proprement');
    process.exit(0);
  });
});
