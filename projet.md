# GM_LR — Point projet (dev & fonctionnalités)

Mise à jour au --.

## Vue d’ensemble
Backend Node/Express avec Socket.IO pour gérer des sessions de jeu LR: création/gestion de rooms, chat/dés, gestion des personnages, et intégration «Scénario» (génération/attachement, changement de scène, historique). Données de référence LR livrées en JSON.

## Fonctionnalités principales
- Rooms (sessions de jeu)
  - Création, liste, recherche, suppression
  - Public/privé (avec mot de passe)
  - Statuts: waiting, active, paused, completed
  - Joueurs: rejoindre/quitter, connexion en temps réel, historique de chat
  - Game data: currentScene, initiative, conditions, scenesHistory (limité à )

- WebSocket (compat JDR-test + extensions)
  - create-room (ack) — étendu pour scenarios (id/objet/génération)
  - list-rooms (ack)
  - find-room (ack)
  - join-room (ack)
  - chat (compat) et chat-message
  - roll-dice (résultats + diffusion) et dice (compat)
  - update-character (ack + broadcast)
  - gm-action / player-action (guardés)
  - change-room-status (GM seulement)
  - set-current-scene (GM seulement) — nouveau: ack + broadcast scene-changed

- API HTTP
  - Rooms: 
    - GET /api/rooms (liste publique)
    - GET /api/rooms/stats
    - GET /api/rooms/:roomId
    - GET /api/rooms/gm/:gmId
    - GET /api/rooms/player/:playerId
    - POST /api/rooms (créer)
    - POST /api/rooms/:roomId/join (rejoindre)
    - POST /api/rooms/:roomId/leave (quitter)
    - PUT /api/rooms/:roomId/status (changer statut — GM)
    - DELETE /api/rooms/:roomId (supprimer — GM)
  - Scénario (en mémoire):
    - GET /api/scenarios (liste)
    - GET /api/scenarios/:id
    - POST /api/scenarios (créer)
    - POST /api/scenarios/generate (générer)
    - DELETE /api/scenarios/:id
  - Rooms + Scénario (nouveau):
    - POST /api/rooms/with-scenario
      - payload: { name, gmName, isPrivate?, password?, scenarioId? | scenario? | generate? (true|options) }
      - crée la room et attache/ou génère un scénario
    - PUT /api/rooms/:roomId/scenario/scene
      - payload: { sceneIndex? | title? }
      - met à jour currentScene + scenesHistory

- Données de référence (JSON dans `gamemaster-backend/data/`):
  - anneaux, clans, compétences, techniques, sorts, kiho, maho, équipement, environnement, voyage, social, etc.
  - guide de création de scénario extrait (scenario_guide.json) + endpoints associés dans referenceRoutes (brut/structuré)

## Scripts utiles (locaux)
- Démarrage serveur (ports):
  - `npm --prefix .\gamemaster-backend run start:`
  - `npm --prefix .\gamemaster-backend run start:`
- Test WS scénario end-to-end (GM +  joueurs,  changements de scène):
  - `node .\gamemaster-backend\scripts\run_with_port.js .\test_session_with_scenario.js `
- Simulation de session (GM +  joueurs) — si besoin:
  - `npm --prefix .\gamemaster-backend run simulate:session:`

## Comment créer une session avec «Scénario»
- WebSocket (événement create-room, ack):
  - Exemple payloads:
    - Générer automatiquement: `{ name, gmId, gmName, isPublic: true, generateScenario: true }`
    - À partir d’un id: `{ name, gmId, gmName, scenarioId: "..." }`
    - Objet direct: `{ name, gmId, gmName, scenario: { title, synopsis, scenes: [...] } }`
- HTTP:
  - POST /api/rooms/with-scenario
    - `{"name":"Session Scenario","gmName":"Sensei","generate":true}`
  - PUT /api/rooms/:roomId/scenario/scene
    - par index: `{"sceneIndex":}`
    - par titre: `{"title":"Enquête et tensions"}`

## État des tests
- Test WS `test_session_with_scenario.js` : PASS
  - Crée la room (scénario généré), GM +  joueurs rejoignent
  - `set-current-scene` par index puis par titre
  - Diffusion `scene-changed` reçue par tous (GM + joueurs)
  - `scenesHistory.length >= ` vérifié via `find-room`

## Lancement (Windows PowerShell)
- Installer dépendances (si besoin):
  ```powershell
  npm --prefix .\gamemaster-backend ci
  ```
- Démarrer:
  ```powershell
  npm --prefix .\gamemaster-backend run start:
  # API: http://localhost:/api, Health: /api/health
  ```
- Tester WS scénario:
  ```powershell
  node .\gamemaster-backend\scripts\run_with_port.js .\test_session_with_scenario.js 
  ```

## Notes d’implémentation
- Stockage en mémoire (rooms/scénarios). Nettoyage périodique des rooms.
- CORS ouverts pour local (/) et GitHub Pages (JDR-test).
- `.gitignore` global ignore `node_modules/` et `scripts/` à tous niveaux.

## Prochaines étapes (suggestions)
- Exposer l’historique des scènes via HTTP: GET /api/rooms/:roomId/scenario/history
- Ajouter un miroir WS via `gm-action` pour les changements de scène (compat front legacy)
- Persistance simple (fichier) pour rooms/scénarios pour survivre aux redémarrages
- Améliorer la génération de scénarios (tags/seed optionnels, plus de variété)
- Brancher une route pour dupliquer/attacher un scénario existant à une room créée
