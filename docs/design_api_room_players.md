# Design API REST : gestion des joueurs dans une room

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB

    Client->>API: POST /api/rooms (création room)
    API->>DB: Crée Room
    API-->>Client: { id: roomId }

    loop Pour chaque joueur (incl. MJ)
        Client->>API: POST /api/rooms/:roomId/players { userId, role }
        API->>DB: Crée PlayerInRoom (roomId, userId, role)
        API-->>Client: { id: playerInRoomId }
    end

    Client->>API: POST /api/scenarios { ... , roomId, playerIds, gmId }
    API->>DB: Crée Scenario lié à la room et aux joueurs
    API-->>Client: { id: scenarioId }

    Client->>API: GET /api/scenarios/:scenarioId
    API->>DB: Cherche Scenario
    API-->>Client: Scenario complet
```

**Endpoints à prévoir :**
- POST `/api/rooms` : crée une room
- POST `/api/rooms/:roomId/players` : ajoute un joueur (ou MJ) dans la room (persisté dans PlayerInRoom)
- POST `/api/scenarios` : crée un scénario lié à la room et aux joueurs
- GET `/api/scenarios/:id` : récupère le scénario

**Avantages :**
- Séparation claire entre gestion des rooms et des joueurs
- Facile à automatiser et à tester
- Extensible (retrait de joueur, changement de rôle, etc.)
