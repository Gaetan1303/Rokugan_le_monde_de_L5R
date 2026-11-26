# Couche temps réel (Mercure)

## Principe

Mercure transporte des **Server-Sent Events** (SSE) : le flux va du hub vers le navigateur, dans un seul sens.
Les actions des joueurs arrivent par de simples requêtes HTTP vers le backend, qui valide, écrit en base,
puis publie le résultat.

```
Navigateur ──POST action──► Backend ──(1 transaction)──► event_log + outbox + état du jeu
                                                              │
                                              OutboxDispatcher (lit l'outbox)
                                                              ▼
Navigateur ◄──── SSE ──── Hub Mercure ◄──POST (JWT éditeur)───┘
```

Règle d'or : **on écrit en base, puis on publie** (jamais l'inverse). PostgreSQL reste la source de vérité ;
Mercure ne fait que diffuser. Un client qui rate un message se resynchronise par un `GET`, il ne réclame pas
l'historique au hub.

## Démarrer

```bash
docker compose up -d                 # PostgreSQL + hub Mercure (racine du dépôt)
cp gamemaster-backend/.env.example gamemaster-backend/.env
cd gamemaster-backend && npm install && npm run dev
```

Sans `MERCURE_URL`, le temps réel est simplement désactivé et le reste du serveur fonctionne.

## Écrire un événement

```ts
await AppDataSource.transaction(async (m) => {
  await m.save(character);                                   // changement d'état
  await appendEvent(m, {                                     // même transaction
    realmId: cfg.defaultRealmId,
    type: 'dice.rolled',
    data: toDiceRolledData(result, { rollId, hidden: false }),
    targets: [{ kind: 'table', tableId }],                   // le 1er cible fixe la séquence `seq`
    actorId: user.id,
  });
});
```

`appendEvent` incrémente atomiquement `seq` par (royaume, portée), écrit `event_log` (ajout seul) et une ligne
`outbox` par cible. Le dispatcher publie ensuite sur Mercure, avec reprise et backoff.

Un jet caché se publie avec `targets: [{ kind: 'tableGm', tableId }]` : topic privé, jamais visible des joueurs.

## Topics

| Cible | Topic | Privé |
|---|---|---|
| `world` | `rokugan:/realm/{r}/world` | non |
| `table` | `rokugan:/realm/{r}/table/{t}` | non |
| `tableGm` | `rokugan:/realm/{r}/table/{t}/gm` | **oui** |
| `place` | `rokugan:/realm/{r}/place/{p}` | non |
| `user` | `rokugan:/realm/{r}/user/{u}` | **oui** |
| `clan` | `rokugan:/realm/{r}/clan/{c}` | **oui** |
| `admin` | `rokugan:/admin` | **oui** |

Un événement privé n'est livré qu'aux abonnés dont le jeton couvre son topic.
`allowedTopics()` (src/realtime/subscriberToken.ts) est **la seule source d'autorisation**.

## Jetons : deux protocoles

Le hub Mercure **1.x** (version actuelle) a abandonné l'ancien claim `mercure`. Il exige des jetons OAuth 2.0
RFC 9068 : sans cela il répond `401`.

| | `MERCURE_PROTOCOL=1` (défaut) | `MERCURE_PROTOCOL=legacy` (hub 0.x) |
|---|---|---|
| En-tête | `typ: at+jwt` | — |
| Claims | `iss`, `aud`, `exp`, `sub`, `client_id`, `iat`, `jti`, `authorization_details` | `mercure.publish` / `mercure.subscribe` |
| `iss` | doit égaler `MERCURE_TRUSTED_ISSUERS` du hub | — |
| `aud` | URL du hub contactée (ou `MERCURE_AUDIENCE`) | — |
| Abonnement | `?match=<topic>` | `?topic=<topic>` |
| Cookie par défaut | `__Secure-mercure_access_token` (dev : `mercure_access_token`) | `mercureAuthorization` |
| Jeton dans l'URL | **interdit** | toléré (`?authorization=`) |

Si tu utilises un hub managé, vérifie quelle version il fait tourner et règle `MERCURE_PROTOCOL` en conséquence.

## Côté navigateur : cookie ou bearer

`GET /api/realtime/session?roomId=…` (JWT de l'API requis) renvoie `hubUrl`, `subscribeParam`, `topics`,
`expiresAt`, `authMode`.

- **`cookie`** : le jeton est posé en cookie HttpOnly limité au chemin du hub. Le front ouvre
  `new EventSource(url, { withCredentials: true })`. Il faut que le hub et l'API partagent un domaine
  (`MERCURE_COOKIE_DOMAIN`) et que le hub autorise l'origine du front (`cors_origins`).
- **`bearer`** : le jeton est renvoyé dans le corps. Le front lit le flux avec `fetch()` et l'en-tête
  `Authorization: Bearer …` (il faut donc un lecteur SSE basé sur fetch, `EventSource` ne sait pas envoyer d'en-tête).
  **Obligatoire si le hub est sur un autre domaine que le front** (par exemple front sur GitHub Pages).

Dans les deux cas, le jeton expire (`MERCURE_SUBSCRIBER_TTL_SECONDS`, 15 min par défaut) : le front rappelle
`/session` avant `expiresAt` puis rouvre le flux.

Le front doit : dédoublonner par `eventId`, ordonner par `seq` dans chaque portée (`scope`), et recharger l'état
par `GET` s'il constate un trou.

## Garanties et limites

- Livraison **au moins une fois**. L'ordre est respecté dans le cas normal ; après un échec de publication, une
  reprise peut inverser deux événements : se fier à `seq`, pas à l'ordre d'arrivée.
- `event_log` est en ajout seul : verrou SQL dans `docs/sql/001_event_log_append_only.sql` (à intégrer à la
  migration S1-1). Une correction passe par un événement compensatoire.
- Le dispatcher peut tourner sur plusieurs instances (bail + `FOR UPDATE SKIP LOCKED`).

## Tests

| Commande | Ce qu'elle exige | Ce qu'elle couvre |
|---|---|---|
| `npm test` | rien | typecheck + tests unitaires (contrat, jetons, publisher, dispatcher, dés, middleware) |
| `npm run test:e2e` | un hub Mercure (`MERCURE_URL`, clés) | isolation des topics privés, jetons invalides, droits de publication |
| `npm run test:session` | un serveur lancé (`API_URL`), un hub, une base | parcours complet : inscription → connexion → table → `/api/realtime/session` → abonnement au hub → réception, en mode `cookie` et `bearer` |
| `npm run test:integration` | `INTEGRATION_DATABASE_URL` (+ `MERCURE_URL` pour la chaîne complète) | SQL réel : séquences sous concurrence, rollback, outbox, bail, verrou « ajout seul » |

⚠️ `test:integration` **vide** la base ciblée (`dropSchema`). Utilise une base dédiée aux tests.
Les tests d'intégration sont compilés avec `tsc` (dossier `.tmp-integration/`) parce que TypeORM a besoin des
métadonnées de décorateurs, que `tsx` n'émet pas.

## Ce qui a été vérifié, et ce qui ne l'a pas été

Vérifié (exécuté, pas seulement relu) :
- Tests unitaires et typecheck (`npm test`).
- Tests de bout en bout contre un **vrai hub Mercure 1.1.6** (10 tests) et un hub **0.16.3** (7 tests ; les 3 autres
  sont propres à la 1.x) : isolation des topics privés (`/gm`, utilisateurs), jetons expirés, mauvaise clé,
  mauvaise audience, mauvais émetteur, impossibilité de publier avec un jeton d'abonné.
- Tests d'intégration contre un **vrai PostgreSQL** : 25 transactions concurrentes donnent un `seq` contigu et
  unique ; un rollback ne laisse ni événement, ni outbox, ni trou de séquence ; `FOR UPDATE SKIP LOCKED` empêche
  deux consommateurs de réserver la même ligne ; le bail expiré est repris ; le trigger « ajout seul » refuse
  UPDATE et DELETE.
- Chaîne complète : transaction → outbox → dispatcher → **vrai hub** → abonné, avec les événements reçus dans
  l'ordre.
- Parcours utilisateur complet (`npm run test:session`) contre le serveur lancé avec `tsx` : le contrôleur
  `/api/realtime/session` délivre des jetons acceptés par le hub ; le joueur ne reçoit pas `/gm`, le MJ oui ; un
  non-membre reçoit 403, une requête sans token 401, un `roomId` invalide 400. Cookie (HttpOnly, chemin du hub,
  SameSite=Strict) et mode bearer vérifiés.
- Le schéma créé par `tsx` est identique à celui du code d'origine compilé avec `tsc` (aucune migration nécessaire
  pour les tables existantes).

Non vérifié :
- `docker-compose.yml` (pas de Docker disponible lors de l'écriture) et la directive `cors_origins`.
  Les paramètres du hub ont été validés avec le binaire Mercure, pas avec l'image Docker.
- Le comportement des hubs managés (Mercure Cloud, Stackhero) : version et configuration à confirmer, puis régler
  `MERCURE_PROTOCOL`.
- Le moteur de dés suit ma lecture des règles de la 4e édition : **à valider avec le livre** (voir `rules/dice.ts`).

## Note : `npm run dev` et les décorateurs TypeORM

`tsx` (utilisé par `npm run dev`) n'émet pas les métadonnées de décorateurs (`emitDecoratorMetadata`). Une colonne
déclarée sans type explicite (`@Column()`) fait donc planter le démarrage avec `ColumnTypeUndefinedError`.
Toutes les colonnes des entités ont maintenant un type explicite (`varchar`, `integer`, `boolean`), identique à
celui que TypeORM déduisait avant : le schéma ne change pas. **Pour toute nouvelle colonne, indique son type.**
