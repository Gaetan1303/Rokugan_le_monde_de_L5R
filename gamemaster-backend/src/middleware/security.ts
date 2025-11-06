/**
 * [DEV SENIOR] Middleware de sécurité - centralise la configuration des protections HTTP.
 * - Headers, rate limiting, sanitization, validation d'origine, logger.
 * - Adapter chaque middleware selon le contexte de déploiement et les besoins métier.
 */

// [IMPORTS] Import des modules nécessaires pour la sécurité
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import type { Request, Response, NextFunction } from 'express';

/**
 * MIDDLEWARE DE SÉCURITÉ - PROTECTION MULTICOUCHE
 * Protection contre: XSS, Injection NoSQL, HPP, DDoS, Clickjacking
 */

// . HELMET - Headers de sécurité HTTP
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 an en secondes
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' }, // Protection contre clickjacking
  noSniff: true, // Empêche le MIME sniffing
  xssFilter: true, // Active le filtre XSS du navigateur
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// . RATE LIMITING - Protection DDoS
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000'), // 15 min par défaut
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '100'),
  message: {
    success: false,
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting pour les health checks
  skip: (req: Request) => req.path === '/api/health',
  // Configuration pour Render (behind proxy)
  validate: {
    trustProxy: false, // Désactive la validation stricte du trust proxy
    xForwardedForHeader: false
  }
});

// Rate limiter strict pour les routes sensibles (création de room, etc.)
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20, // max 20 requêtes
  message: {
    success: false,
    message: 'Trop de tentatives. Action temporairement bloquée.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false
  }
});

// . SANITIZATION - Protection contre les injections
// Note: mongoSanitize et xss-clean désactivés (incompatibles Express 5 - req.query readonly)
const sanitizeData = [
  // mongoSanitize(), // DÉSACTIVÉ: incompatible avec Express 5
  // xss(), // DÉSACTIVÉ: incompatible avec Express 5
  hpp() // Protection contre HTTP Parameter Pollution
];

// . VALIDATION DES ORIGINES CORS
const validateOrigin = (allowedOrigins: string[]) => {
  return (origin: string | undefined, callback: Function) => {
    // Autoriser les requêtes sans origin (ex: Postman, mobile apps)
    if (!origin) {
      return callback(null, true);
    }

    // En production, strictement vérifier l'origine
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = ` CORS bloqué: origine ${origin} non autorisée`;
        console.warn(msg);
        return callback(new Error('Non autorisé par CORS'), false);
      }
    }
    
    callback(null, true);
  };
};

// . LOGGER DE SÉCURITÉ - Détection d'activité suspecte
const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || 'unknown';
  
  // Détecter les patterns suspects
  const suspiciousPatterns = [
    /(\.\.)|(\.\/)/gi,  // Path traversal
    /(union|select|insert|update|delete|drop|create|alter)/gi, // SQL injection
    /(<script|javascript:|onerror=|onload=)/gi, // XSS
    /(\$where|\$ne|\$gt|\$lt)/gi, // NoSQL injection
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => {
    return pattern.test(req.url) || 
           pattern.test(JSON.stringify(req.body)) ||
           pattern.test(JSON.stringify(req.query));
  });

  if (isSuspicious) {
    console.error(` ALERTE SÉCURITÉ - Requête suspecte détectée:
    IP: ${ip}
    Method: ${req.method}
    Path: ${req.path}
    User-Agent: ${userAgent}
    Timestamp: ${timestamp}
    Body: ${JSON.stringify(req.body).substring(0, 1000)}
    Query: ${JSON.stringify(req.query)}`);
  }

  // Log normal en développement seulement
  if (process.env.NODE_ENV === 'development' && !process.env.HIDE_SENSITIVE_LOGS) {
    console.log(`${req.method} ${req.path} - IP: ${ip} - ${timestamp}`);
  }

  next();
};

// LIMITATION DE TAILLE DES REQUÊTES
const requestSizeLimit = process.env.MAX_REQUEST_SIZE || '10kb';

export {
  // [EXPORTS] Exporte tous les middlewares et utilitaires de sécurité pour usage global
  helmetConfig,
  apiLimiter,
  strictLimiter,
  sanitizeData,
  validateOrigin,
  securityLogger,
  requestSizeLimit
};
