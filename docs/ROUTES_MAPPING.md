# ROUTES MAPPING — GM_L5R

But : fournir un fichier prêt à insérer dans la documentation (`docs/`) listant les routes exposées par le backend, leur méthode HTTP, le chemin complet et le fichier source correspondant.

Remarque : les routes listées ici sont extraites du code présent dans `gamemaster-backend/src` et reflètent l'état au moment du scan.

## Points d'entrée montés dans `server.js`
- `/api/auth` -> `gamemaster-backend/src/routes/authRoutes.ts`
- `/api/rooms` -> `gamemaster-backend/src/routes/room.routes.ts` (limiter: `strictLimiter`)
- `/api/scenarios` -> `gamemaster-backend/src/routes/scenarioRoutes.ts` (limiter: `strictLimiter`)
- `/api/reference` -> `gamemaster-backend/src/routes/referenceRoutes.ts`
- `/api/frontend` -> `gamemaster-backend/src/routes/frontendRoutes.ts`

Autres endpoints hors préfixe `/api` :
- `POST /login` -> alias (implémenté dans `gamemaster-backend/src/server.js`)
- `GET /` -> `gamemaster-backend/src/controllers/HomeController.js` (exported `home`)
- `GET /api/health` -> health check (implémenté dans `server.js`)
- `GET /api/stats` -> stats endpoint (implémenté dans `server.js`)

---

## Détail des endpoints découverts

### /api/auth  (fichier: `src/routes/authRoutes.ts`)
- POST /api/auth/register -> implémentation inline (registre un utilisateur)
- POST /api/auth/login -> implémentation inline (login utilisateur)
- POST /api/auth/ws-token -> génère token WebSocket (body: userId, userName, userType, roomId)
- POST /api/auth/verify-token -> vérifie un token WebSocket

### /api/rooms  (fichier: `src/routes/room.routes.ts`)
- GET /api/rooms/ -> RoomController.getPublicRooms
- GET /api/rooms/stats -> RoomController.getAllRooms
- GET /api/rooms/gm/:gmId -> RoomController.getRoomsByGM
- GET /api/rooms/player/:playerId -> RoomController.getRoomsByPlayer
- GET /api/rooms/:roomId -> RoomController.getRoomById
- POST /api/rooms/ -> RoomController.createRoom

### /api/scenarios  (fichier: `src/routes/scenarioRoutes.ts`)
- GET /api/scenarios/ -> ScenarioController.list
- GET /api/scenarios/:id -> ScenarioController.get
- POST /api/scenarios/ -> ScenarioController.create
- POST /api/scenarios/generate -> ScenarioController.generate
- DELETE /api/scenarios/:id -> ScenarioController.remove

### /api/reference  (fichier: `src/routes/referenceRoutes.ts`)
Les endpoints ci-dessous sont accessibles sous le préfixe `/api/reference` :

- GET /api/reference/skills -> ReferenceController.getSkills
- GET /api/reference/clans/:id -> ReferenceController.getClanById
- GET /api/reference/schools/:id -> ReferenceController.getSchoolById
- GET /api/reference/disadvantages/:id -> ReferenceController.getDisadvantageById

- GET /api/reference/equipment -> retourne tout l'équipement (charge `equipement.json`)
- GET /api/reference/equipment/weapons -> armes
- GET /api/reference/equipment/armor -> armures
- GET /api/reference/equipment/items -> objets
- GET /api/reference/equipement -> alias FR (note orthographe)

- GET /api/reference/spells -> liste des sorts (filtrable par query params)
- GET /api/reference/spells/element/:element -> sorts par élément
- GET /api/reference/spells/mastery/:rank -> sorts par rang
- GET /api/reference/sorts -> alias FR pour sorts
- GET /api/reference/sorts/element/:element
- GET /api/reference/sorts/rang/:rank

- GET /api/reference/kiho -> liste de kiho (filtrable)
- GET /api/reference/kiho/element/:element

- GET /api/reference/maho -> maho (filtrable par maitrise)

- GET /api/reference/techniques -> techniques (filtrables)
- GET /api/reference/techniques/clan/:clan
- GET /api/reference/kata

- GET /api/reference/families -> familles (agrégat à partir des clans)
- GET /api/reference/families/clan/:clan

- GET /api/reference/wounds -> `blessures.json`
- GET /api/reference/blessures -> alias FR

- GET /api/reference/honor -> `honneur.json`
- GET /api/reference/honneur -> alias FR

- GET /api/reference/combat-maneuvers -> `manoeuvres.json`
- GET /api/reference/manoeuvres -> alias FR

- GET /api/reference/paths -> `voies.json`
- GET /api/reference/paths/clan/:clan
- GET /api/reference/voies
- GET /api/reference/voies/clan/:clan

- GET /api/reference/creation -> `creation.json`
- GET /api/reference/anneaux -> `anneaux.json`
- GET /api/reference/regles -> `regles.json`
- GET /api/reference/creation-details -> `creation_details.json`
- GET /api/reference/combat -> `combat.json`
- GET /api/reference/magie -> `magie.json`
- GET /api/reference/environnement -> `environnement.json`
- GET /api/reference/peur -> `peur.json`
- GET /api/reference/souillure -> `souillure.json`
- GET /api/reference/social -> `social.json`
- GET /api/reference/economie -> `economie.json`
- GET /api/reference/voyage -> `voyage.json`
- GET /api/reference/formules -> `formules.json`
- GET /api/reference/scenario-guide -> `scenario_guide.json`
- GET /api/reference/scenario-guide/structured -> renvoie sections structurées

### /api/frontend  (fichier: `src/routes/frontendRoutes.ts`)
Endpoints exposés pour le frontend (formatage spécifique) :

- GET /api/frontend/clans
- GET /api/frontend/schools
- GET /api/frontend/advantages
- GET /api/frontend/disadvantages
- GET /api/frontend/spells
- GET /api/frontend/maho
- GET /api/frontend/kiho
- GET /api/frontend/equipment
- GET /api/frontend/techniques
- GET /api/frontend/kata

(Le fichier `frontendRoutes.ts` contient d'autres mappings et transformations; consulter le fichier pour les détails des champs retournés.)

---

## Notes et recommandations
- Pour intégrer ce fichier dans la doc publique, je recommande :
  - Lier chaque ligne vers le fichier source correspondant (ex : `src/routes/referenceRoutes.ts`) pour faciliter la navigation.
  - Ajouter un court exemple request/response pour les endpoints critiques (auth, rooms, scenarios).
  - Indiquer clairement les endpoints nécessitant authentification (WebSocket token, routes de modification, etc.).

- Si tu veux, je peux :
  1) Générer automatiquement un fichier `docs/ENDPOINTS_EXAMPLES.md` contenant quelques exemples curl / JSON pour les endpoints principaux.
  2) Ajouter des liens directs vers les contrôleurs dans chaque ligne (extraction automatique des handlers si nommés).
  3) Faire une passe pour remplacer noms obsolètes dans `doc technique/*.md` en utilisant ce mapping.

---

Fichier généré automatiquement — vérifie et dis-moi si tu veux que je :
- ajoute des exemples, 
- lie chaque endpoint vers le code, 
- commit les modifications dans une branche `doc/update-<date>` et pousse.
