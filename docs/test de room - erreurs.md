# Rapport de test d’erreur : test de room

**Date d’exécution :** 12/11/2025 15:33:26

- **Créer une room sans token**
    - Input : `{"name":"Room sans token"}`
    - Attendu : 401 Unauthorized
    - Code HTTP : 201
    - Succès : OUI
    - Message : `{"name":"Room sans token","status":"waiting","currentScene":0,"scenesHistory":[],"maxPlayers":6,"isPrivate":false,"gm":{"id":"e577d344-e507-43dd-badd-3c01de21c738","email":"mj1762955311649@test.com","password":"$2b$10$uijd5ZrdcnrZ/RdV5vpUou3VQ9kJA619FFr9021TgZnZniEDFTVjK","name":"MJ","role":"joueur","createdAt":"2025-11-12T13:48:32.790Z"},"password":null,"id":"ad95b2c1-ad6f-4f09-beae-3965ca44c88b","createdAt":"2025-11-12T14:33:25.867Z","updatedAt":"2025-11-12T14:33:25.867Z"}`
    - Durée : 753 ms
    - Commentaire : Erreur non conforme
- **Créer une room avec nom vide**
    - Input : `{"name":""}`
    - Attendu : 400 Bad Request
    - Code HTTP : 201
    - Succès : OUI
    - Message : `{"name":"","status":"waiting","currentScene":0,"scenesHistory":[],"maxPlayers":6,"isPrivate":false,"gm":{"id":"e577d344-e507-43dd-badd-3c01de21c738","email":"mj1762955311649@test.com","password":"$2b$10$uijd5ZrdcnrZ/RdV5vpUou3VQ9kJA619FFr9021TgZnZniEDFTVjK","name":"MJ","role":"joueur","createdAt":"2025-11-12T13:48:32.790Z"},"password":null,"id":"b8be1566-c039-4d3f-b0f1-ab45b8991cb7","createdAt":"2025-11-12T14:33:26.745Z","updatedAt":"2025-11-12T14:33:26.745Z"}`
    - Durée : 58 ms
    - Commentaire : Erreur non conforme
- **Ajout de joueur avec mauvais rôle**
    - Input : `{"userId":"b09b68e3-e3e7-4fcc-b8fc-124f35adedb1","role":"admin"}`
    - Attendu : 400 Bad Request
    - Code HTTP : 201
    - Succès : OUI
    - Message : `{"success":true,"player":{"role":"admin","joinedAt":"2025-11-12T14:33:26.878Z","room":{"id":"ec740f3f-a0b2-4491-a121-b4f70be8e330","name":"Room pour test erreur","status":"waiting","currentScene":0,"scenesHistory":[],"maxPlayers":6,"isPrivate":false,"password":null,"createdAt":"2025-11-12T14:33:26.807Z","updatedAt":"2025-11-12T14:33:26.807Z","gm":{"id":"e577d344-e507-43dd-badd-3c01de21c738","email":"mj1762955311649@test.com","password":"$2b$10$uijd5ZrdcnrZ/RdV5vpUou3VQ9kJA619FFr9021TgZnZniEDFTVjK","name":"MJ","role":"joueur","createdAt":"2025-11-12T13:48:32.790Z"},"players":[],"scenario":null},"user":{"id":"b09b68e3-e3e7-4fcc-b8fc-124f35adedb1","email":"testeur1762958005957@test.com","password":"$2b$10$L5cz4rQoJ2JdlrImRSKnCetviW4CfVeKIVzUGa2dPBAqvSIuFT6IW","name":"Testeur","role":"joueur","createdAt":"2025-11-12T14:33:26.292Z"},"character":null,"lastSeen":null,"id":"ce8523dd-39ab-4dbb-930b-67731a9ca8aa"}}`
    - Durée : 65 ms
    - Commentaire : Erreur non conforme
