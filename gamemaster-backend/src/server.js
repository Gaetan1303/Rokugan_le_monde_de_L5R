require('dotenv').config({ 
  path: process.env.NODE_ENV === 'production' 
    ? '.env.production' 
    : '.env.development' 
});

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');

const roomRoutes = require('./routes/roomRoutes');
const referenceRoutes = require('./routes/referenceRoutes');
const scenarioRoutes = require('./routes/scenarioRoutes');
const frontendRoutes = require('./routes/frontendRoutes');
const authRoutes = require('./routes/authRoutes');
const socketHandler = require('./services/socketHandler');

//  MIDDLEWARES DE SÉCURITÉ
const {
  helmetConfig,
  apiLimiter,
  strictLimiter,
  sanitizeData,
  validateOrigin,
  securityLogger,
  requestSizeLimit
} = require('./middleware/security');
const wsAuth = require('./middleware/wsAuth');

const app = express();
const server = http.createServer(app);

//  CONFIGURATION DES ORIGINES AUTORISÉES
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      "http://localhost:",
      "http://localhost:",
      "http://localhost:",
      "https://gaetan.github.io"
    ];

console.log(` CORS configuré pour: ${allowedOrigins.join(', ')}`);

//  SOCKET.IO AVEC AUTHENTIFICATION ET CORS STRICT
const io = socketIo(server, {
  cors: {
    origin: validateOrigin(allowedOrigins),
    methods: ["GET", "POST"],
    credentials: true
  },
  // Sécurité WebSocket
  pingTimeout: parseInt(process.env.WS_TIMEOUT) || ,
  pingInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || ,
  maxHttpBufferSize: e, // MB max par message
  transports: ['websocket', 'polling'], // Préférer websocket
  allowEIO: false // Désactiver les anciennes versions
});

//  Authentification WebSocket
if (process.env.NODE_ENV === 'production') {
  io.use(wsAuth.middlewareSocketIO());
}

// ============================================
//  MIDDLEWARES DE SÉCURITÉ HTTP
// ============================================

// . Helmet - Headers de sécurité
if (process.env.HELMET_ENABLED !== 'false') {
  app.use(helmetConfig);
}

// . CORS strict
app.use(cors({
  origin: validateOrigin(allowedOrigins),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  maxAge:  // Cache preflight h
}));

// . Limitation de taille des requêtes
app.use(bodyParser.json({ limit: requestSizeLimit }));
app.use(bodyParser.urlencoded({ extended: true, limit: requestSizeLimit }));

// . Sanitization des données
app.use(sanitizeData);

// . Logger de sécurité
app.use(securityLogger);

// . Rate limiting global
app.use('/api', apiLimiter);

// ============================================
//  ROUTES API
// ============================================

// Routes d'authentification (sans rate limit strict)
app.use('/api/auth', authRoutes);

// Routes avec rate limiting strict pour création
app.use('/api/rooms', strictLimiter, roomRoutes);
app.use('/api/scenarios', strictLimiter, scenarioRoutes);

// Routes normales
app.use('/api/reference', referenceRoutes);
app.use('/api/frontend', frontendRoutes);

// Route de santé du serveur (sans rate limit)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    message: 'Serveur GameMaster LR opérationnel',
    timestamp: new Date().toISOString(),
    version: '..',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route pour obtenir les statistiques (protégée)
app.get('/api/stats', (req, res) => {
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

// Gestion des WebSockets
socketHandler(io, wsAuth);

// ============================================
//  GESTION DES ERREURS
// ============================================

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error(' Erreur serveur:', err.message);
  
  // Log complet en développement seulement
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  
  // Ne jamais exposer les détails d'erreur en production
  const errorResponse = {
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Une erreur est survenue' 
      : err.message
  };
  
  res.status(err.status || ).json(errorResponse);
});

// Route 
app.use((req, res) => {
  res.status().json({
    success: false,
    message: 'Route non trouvée',
    path: req.path
  });
});

// ============================================
//  DÉMARRAGE DU SERVEUR
// ============================================

const PORT = process.env.PORT || ;

server.listen(PORT, () => {
  console.log('');
  console.log('====================================');
  console.log('    SERVEUR GAMEMASTER LR SÉCURISÉ');
  console.log('====================================');
  console.log(` Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Port: ${PORT}`);
  console.log(` CORS: ${allowedOrigins.length} origine(s) autorisée(s)`);
  console.log(`  Helmet: ${process.env.HELMET_ENABLED !== 'false' ? 'Activé' : 'Désactivé'}`);
  console.log(` Rate Limit: ${process.env.RATE_LIMIT_MAX_REQUESTS || } req/${process.env.RATE_LIMIT_WINDOW_MS || }ms`);
  console.log(` WebSocket Auth: ${process.env.NODE_ENV === 'production' ? 'Activé' : 'Désactivé (dev)'}`);
  console.log(` API: http://localhost:${PORT}/api`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log(` Stats: http://localhost:${PORT}/api/stats`);
  console.log('====================================');
  console.log('');
});

// Gestion des arrêts propres
process.on('SIGTERM', () => {
  console.log(' SIGTERM reçu. Arrêt du serveur...');
  server.close(() => {
    console.log(' Serveur arrêté proprement');
    process.exit();
  });
});

process.on('SIGINT', () => {
  console.log('\n SIGINT reçu. Arrêt du serveur...');
  server.close(() => {
    console.log(' Serveur arrêté proprement');
    process.exit();
  });
});

module.exports = app;