#  Guide de déploiement sécurisé - Render

## Configuration rapide en  minutes

###  Générer les clés secrètes

```bash
cd gamemaster-backend
yarn generate-secrets
```

Copiez les  clés générées (JWT_SECRET, SESSION_SECRET, WEBSOCKET_SECRET).

---

###  Configurer les variables d'environnement sur Render

Dans le dashboard Render > Votre service > Environment :

```bash
NODE_ENV=production
PORT=

# Collez vos clés générées ici :
JWT_SECRET=<votre_clé_jwt>
SESSION_SECRET=<votre_clé_session>
WEBSOCKET_SECRET=<votre_clé_websocket>

# CORS - Votre domaine frontend
ALLOWED_ORIGINS=https://gaetan.github.io

# Rate Limiting
RATE_LIMIT_WINDOW_MS=
RATE_LIMIT_MAX_REQUESTS=

# WebSocket
WS_MAX_CONNECTIONS_PER_IP=
WS_HEARTBEAT_INTERVAL=
WS_TIMEOUT=

# Sécurité
MAX_REQUEST_SIZE=kb
HELMET_ENABLED=true
LOG_LEVEL=warn
HIDE_SENSITIVE_LOGS=true
```

---

###  Vérifier le déploiement

Une fois déployé, testez :

```bash
# Health check
curl https://votre-app.onrender.com/api/health

# Devrait retourner :
{
  "status": "healthy",
  "message": "Serveur GameMaster LR opérationnel",
  "environment": "production"
}
```

---

###  Obtenir un token WebSocket (depuis votre frontend)

```javascript
// Votre frontend doit d'abord obtenir un token
const response = await fetch('https://votre-app.onrender.com/api/auth/ws-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user',
    userName: 'JohnDoe',
    userType: 'player'
  })
});

const { token } = await response.json();

// Puis se connecter avec le token
const socket = io('https://votre-app.onrender.com', {
  auth: { token }
});
```

---

###  Monitoring

Surveillez les logs Render pour :
- ` ALERTE SÉCURITÉ` - Tentatives d'attaque
- ` CORS bloqué` - Origines non autorisées
- Erreurs d'authentification

---

##  CHECKLIST SÉCURITÉ

Avant de mettre en production :

- [x]  Clés secrètes générées et configurées
- [x]  CORS configuré avec vos domaines réels
- [x]  NODE_ENV=production
- [x]  Rate limiting activé
- [x]  Helmet activé
- [x]  Authentification WebSocket en production
- [ ]  Tests CORS depuis votre frontend
- [ ]  Tests d'authentification WebSocket
- [ ]  Vérification des logs

---

##  Sécurité implémentée

 **Headers de sécurité (Helmet)**
- XSS Protection
- Clickjacking Protection
- MIME Sniffing Protection
- HSTS

 **Rate Limiting**
-  req/min par IP (global)
-  req/min pour création de rooms

 **Authentification WebSocket JWT**
- Token obligatoire en production
- Expiration h
- Limitation  connexions/IP

 **Validation des données**
- Protection NoSQL injection
- Protection XSS
- Protection HPP

 **CORS Strict**
- Origines whitelistées uniquement

 **Monitoring**
- Détection patterns suspects
- Logs sécurisés

---

##  Documentation complète

Voir [SECURITY.md](./SECURITY.md) pour :
- Architecture de sécurité complète
- Procédures en cas d'incident
- Checklist d'audit de sécurité
- Ressources et best practices

---

##  Besoin d'aide ?

. Vérifiez [SECURITY.md](./SECURITY.md)
. Consultez les logs Render
. Testez avec `curl` ou Postman

---

*Bon déploiement ! *
