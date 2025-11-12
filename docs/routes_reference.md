# Référentiel des routes API GameMaster L5R

## Authentification
- `POST /api/auth/register` : Inscription d'un utilisateur
- `POST /api/auth/login` : Connexion utilisateur
- `POST /api/auth/ws-token` : Génération d'un token WebSocket
- `POST /api/auth/verify-token` : Vérification d'un token WebSocket

## Rooms
- `GET /api/rooms` : Liste des rooms
- `POST /api/rooms` : Création d'une room
- `GET /api/rooms/:id` : Détails d'une room
- `PUT /api/rooms/:id` : Modification d'une room
- `DELETE /api/rooms/:id` : Suppression d'une room

## Scenarios
- `GET /api/scenarios` : Liste des scénarios
- `POST /api/scenarios` : Création d'un scénario
- `GET /api/scenarios/:id` : Détails d'un scénario
- `PUT /api/scenarios/:id` : Modification d'un scénario
- `DELETE /api/scenarios/:id` : Suppression d'un scénario

## Références
- `GET /api/reference` : Documentation de référence

## Frontend
- `GET /api/frontend` : Pages statiques frontend

## Monitoring
- `GET /api/health` : Health check du serveur
- `GET /api/stats` : Statistiques serveur

## Accueil
- `GET /` : Page d'accueil API

---
**Base URL production** : `https://gm-l5r.onrender.com`
