/**
 * [DEV SENIOR] Middleware de sécurité - centralise la configuration des protections HTTP.
 * - Headers, rate limiting, sanitization, validation d'origine, logger.
 * - Adapter chaque middleware selon le contexte de déploiement et les besoins métier.
 */
import type { Request, Response, NextFunction } from 'express';
/**
 * MIDDLEWARE DE SÉCURITÉ - PROTECTION MULTICOUCHE
 * Protection contre: XSS, Injection NoSQL, HPP, DDoS, Clickjacking
 */
declare const helmetConfig: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
declare const apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
declare const strictLimiter: import("express-rate-limit").RateLimitRequestHandler;
declare const sanitizeData: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>[];
declare const validateOrigin: (allowedOrigins: string[]) => (origin: string | undefined, callback: Function) => any;
declare const securityLogger: (req: Request, res: Response, next: NextFunction) => void;
declare const requestSizeLimit: string;
export { helmetConfig, apiLimiter, strictLimiter, sanitizeData, validateOrigin, securityLogger, requestSizeLimit };
//# sourceMappingURL=security.d.ts.map