#  DOCUMENTATION SÉCURITÉ - GameMaster LR

## Vue d'ensemble

Ce document détaille toutes les mesures de sécurité mises en place pour protéger l'application GameMaster LR contre les attaques courantes.

---

##  Mesures de sécurité implémentées

### . Protection des en-têtes HTTP (Helmet)

**Protège contre:** XSS, Clickjacking, MIME sniffing, etc.

```javascript
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection
- Referrer-Policy
```

### . Rate Limiting (Protection DDoS)

**Limite les requêtes** pour prévenir les abus et attaques DDoS.

- **API global:**  requêtes /  minutes par IP
- **Routes sensibles:**  requêtes /  minutes par IP
- Les health checks sont exemptés

**Configuration:** `.env` > `RATE_LIMIT_WINDOW_MS` et `RATE_LIMIT_MAX_REQUESTS`

### . Authentification WebSocket (JWT)

**Protège les connexions WebSocket** avec tokens JWT.

#### Obtenir un token :
```bash
POST /api/auth/ws-token
{
  "userId": "user",
  "userName": "JohnDoe",
  "userType": "player",  // ou "gm"
  "roomId": "room"    // optionnel
}
```

#### Connexion WebSocket avec token :
```javascript
const socket = io('https://your-server.com', {
  auth: {
    token: 'votre-token-jwt'
  }
});
```

**En production:** Token obligatoire
**En développement:** Token optionnel (pour compatibilité)

### . CORS Strict

**Autorise uniquement les origines configurées** dans `.env`

```bash
ALLOWED_ORIGINS=https://gaetan.github.io,https://autre-domaine.com
```

 En production, toute origine non listée sera **BLOQUÉE**.

### . Validation et Sanitization des données

**Protection contre les injections:**

-  NoSQL Injection (mongo-sanitize)
-  XSS (xss-clean)
-  HTTP Parameter Pollution (hpp)

Toutes les données entrantes sont automatiquement nettoyées.

### . Limitation de taille des requêtes

**Empêche les attaques par payload massif**

- Défaut: kb par requête
- Configurable: `.env` > `MAX_REQUEST_SIZE`

### . Monitoring de sécurité

**Détection automatique des patterns suspects:**

- Path traversal (`../`, `./`)
- SQL injection (`union`, `select`, etc.)
- XSS (`<script>`, `javascript:`, etc.)
- NoSQL injection (`$where`, `$ne`, etc.)

Les tentatives sont **loggées** avec IP, User-Agent et timestamp.

### . Limitation des connexions WebSocket

**Par IP:** Maximum  connexions simultanées (configurable)

Protège contre:
- Flooding de connexions
- Attaques par épuisement de ressources

### . Gestion sécurisée des erreurs

**En production:**
-  Pas de stack traces exposées
-  Pas de détails d'erreur sensibles
-  Messages génériques uniquement

**En développement:**
-  Stack traces complètes (debug)

---

##  Variables d'environnement sensibles

###  À CONFIGURER EN PRODUCTION :

```bash
# Clés secrètes - CHANGER IMMÉDIATEMENT
JWT_SECRET=VOTRE_CLE_SECRETE_MINIMUM__CARACTERES
SESSION_SECRET=VOTRE_AUTRE_CLE_SECRETE
WEBSOCKET_SECRET=VOTRE_TOKEN_WEBSOCKET

# CORS - Origines autorisées
ALLOWED_ORIGINS=https://votre-frontend.com,https://autre-domaine.com

# Environnement
NODE_ENV=production
```

### 📋 Fichiers ignorés par Git :

Tous les fichiers sensibles sont dans `.gitignore`:
- `.env*`
- `*.key`, `*.pem`, `*.cert`
- `secrets/`
- `*.log`

---

##  Checklist de sécurité avant déploiement

### Obligatoire :

- [ ] Changer toutes les clés secrètes (`JWT_SECRET`, etc.)
- [ ] Configurer `ALLOWED_ORIGINS` avec vos domaines réels
- [ ] Définir `NODE_ENV=production`
- [ ] Vérifier que `.env.production` n'est PAS commité
- [ ] Activer l'authentification WebSocket en prod
- [ ] Configurer HTTPS sur Render (automatique)
- [ ] Tester les CORS depuis votre frontend
- [ ] Vérifier les logs pour activités suspectes

### Recommandé :

- [ ] Configurer un monitoring (Sentry, etc.)
- [ ] Mettre en place des backups réguliers
- [ ] Documenter les tokens pour votre équipe
- [ ] Tester le rate limiting
- [ ] Vérifier les certificats SSL

---

##  Configuration Render

### Variables d'environnement à ajouter dans Render :

```bash
NODE_ENV=production
JWT_SECRET=<générer-une-clé-forte>
SESSION_SECRET=<générer-une-clé-forte>
WEBSOCKET_SECRET=<générer-une-clé-forte>
ALLOWED_ORIGINS=https://gaetan.github.io
RATE_LIMIT_WINDOW_MS=
RATE_LIMIT_MAX_REQUESTS=
WS_MAX_CONNECTIONS_PER_IP=
HELMET_ENABLED=true
```

### Générer des clés secrètes fortes :

```bash
# Dans votre terminal
node -e "console.log(require('crypto').randomBytes().toString('hex'))"
```

---

##  Endpoints de monitoring

### Health Check
```bash
GET /api/health
```
Vérifie que le serveur est opérationnel.

### Statistiques
```bash
GET /api/stats
```
 **À protéger en production** - Affiche les stats de connexion.

---

## 🐛 En cas d'attaque détectée

### Logs à surveiller :

```bash
 ALERTE SÉCURITÉ - Requête suspecte détectée
```

### Actions :

. **Identifier l'IP** dans les logs
. **Bloquer l'IP** au niveau Render/Cloudflare
. **Réinitialiser les connexions** de l'IP :
   ```javascript
   wsAuth.resetIPConnections('IP_MALVEILLANTE');
   ```
. **Changer les clés** si nécessaire
. **Auditer les logs** pour évaluer les dommages

---

##  Ressources de sécurité

- [OWASP Top ](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

##  Mises à jour de sécurité

### Audit régulier des dépendances :

```bash
# Vérifier les vulnérabilités
yarn audit

# Corriger automatiquement (si possible)
yarn audit fix
```

### Fréquence recommandée :
- Audit : **Hebdomadaire**
- Mise à jour : **Mensuelle**
- Revue de sécurité : **Trimestrielle**

---

##  Contact sécurité

En cas de découverte de vulnérabilité, contactez immédiatement l'équipe de développement.

**Ne divulguez PAS publiquement les failles de sécurité.**

---

*Dernière mise à jour :  novembre *
*Version : ..*
