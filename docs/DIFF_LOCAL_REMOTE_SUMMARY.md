# Différence entre local (HEAD) et remote (origin/main)

Généré automatiquement le 2025-11-12.

Résumé :
- origin/main contient 6 commits qui ne sont pas présents localement.
- HEAD local ne contient aucun commit qui n'est pas sur origin/main (pas de commits locaux non poussés).

Commits distants (origin/main) manquants localement :
- b37f128 render
- 2e77a67 render
- 17459e8 render
- fc76b91 build
- 7d6f07f build
- 4ecbaba doc tech

Fichiers modifiés (status) entre origin/main et HEAD :
- M .gitignore
- D doc/README.md
- D doc/architecture_backend.md
- D doc/classes_backend.md
- D doc/cycle_vie_room.md
- D doc/diagramme de classe.md
- D doc/endpoints.md
- D doc/flux_changement_scene.md
- D doc/flux_creation_session.md
- D doc/rapport de l'IA.md
- M gamemaster-backend/.gitignore
- M gamemaster-backend/package.json
- M gamemaster-backend/src/controllers/RoomController.ts
- M gamemaster-backend/src/controllers/ScenarioController.ts
- D gamemaster-backend/src/models/PlayerInRoom.ts
- M gamemaster-backend/src/models/Room.js
- M gamemaster-backend/src/models/Room.ts
- M gamemaster-backend/src/models/Scenario.js
- M gamemaster-backend/src/models/Scenario.ts
- D gamemaster-backend/src/models/Scene.ts
- M gamemaster-backend/src/models/User.ts
- M gamemaster-backend/src/routes/frontendRoutes.js
- M gamemaster-backend/src/routes/referenceRoutes.js
- M gamemaster-backend/src/routes/roomRoutes.js
- M gamemaster-backend/src/routes/scenarioRoutes.js
- M gamemaster-backend/src/server.js
- M gamemaster-backend/src/services/roomService.js
- M gamemaster-backend/src/services/roomService.ts
- M gamemaster-backend/src/services/scenarioService.js
- M gamemaster-backend/src/services/scenarioService.ts
- M gamemaster-backend/src/services/socketHandler.js
- M gamemaster-backend/src/services/socketHandler.ts
- M package.json
- M projet.md

Recommandations :
1) Si tu veux te mettre à jour avec le remote sans perdre de travail local, exécute :
   git pull --rebase origin main
   (ou stash tes modifications locales si tu as des changements non commit)

2) Si tu préfères ne pas toucher à ta copie locale, crée une branche pour appliquer le pull :
   git checkout -b sync/origin-main-2025-11-12
   git pull origin main

3) Si tu veux que je fasse le pull ici, dis "pull --rebase" ou "pull (merge)".
