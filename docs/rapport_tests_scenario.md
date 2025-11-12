# Rapport de tests – Simulation d’un scénario (3 joueurs, 1 MJ)

## 1. Tests unitaires

- **Définition** : Vérifient le comportement isolé des fonctions/services (ex : RoomService, ScenarioService, UserService).
- **Exemples** :
  - Création d’un utilisateur (mock DB)
  - Ajout d’un joueur à une room
  - Génération d’un scénario sans dépendance externe
- **Statut** : À compléter (non automatisés dans ce projet, à implémenter avec Jest ou équivalent).

## 2. Tests d’intégration

- **Définition** : Vérifient l’interaction entre plusieurs modules (ex : API REST + base de données).
- **Exemple réalisé** :
  - Script `test_scenario_api.ts` :
    - Création de 4 utilisateurs (1 MJ, 3 joueurs)
    - Connexion de chaque utilisateur
    - Création d’une room par le MJ
    - Création d’un scénario lié à la room et aux joueurs
    - Vérification de la persistance via l’API
    - Nettoyage (suppression room/scénario)
- **Résultat attendu** :
  - Toutes les étapes doivent retourner un code 200/201 et les entités doivent être retrouvées via l’API.
  - En cas d’erreur (ex : "No metadata for 'Room' was found"), vérifier la configuration TypeORM côté serveur.

## 3. Tests fonctionnels

- **Définition** : Vérifient que les fonctionnalités répondent au besoin métier (ex : workflow de création de partie).
- **Exemple** :
  - Un MJ peut créer une room, inviter des joueurs, lancer un scénario, et tous les participants voient la même session.
- **Statut** : Validé manuellement via le script d’intégration.

## 4. Tests de bout en bout (E2E)

- **Définition** : Simulent un parcours utilisateur complet (front + back + DB).
- **Exemple** :
  - Utilisation de Cypress ou Playwright pour automatiser la création d’une partie depuis l’interface jusqu’à la persistance en base.
- **Statut** : Non automatisé, mais le script d’intégration couvre la logique API principale.

## 5. Tests d’acceptation

- **Définition** : Vérifient que le produit répond aux critères d’acceptation du client.
- **Exemple** :
  - "En tant que MJ, je peux créer une session avec 3 joueurs et démarrer un scénario."
- **Statut** : Accepté si le script d’intégration fonctionne sans erreur.

## 6. Tests de performance

- **Définition** : Mesurent la rapidité et la robustesse sous charge.
- **Exemple** :
  - Création de 100 rooms/scénarios en parallèle, mesure du temps de réponse.
- **Statut** : Non réalisé, à prévoir avec Artillery, k6 ou JMeter.

## 7. Smoke tests

- **Définition** : Vérifient que les fonctionnalités critiques démarrent sans erreur après déploiement.
- **Exemple** :
  - Lancement du serveur, test de l’endpoint `/api/health`, création simple d’une room.
- **Statut** : OK si `/api/health` répond et que la création de room/scénario fonctionne.

---

**Conclusion** :
- Les tests d’intégration via script API valident le scénario principal (3 joueurs, 1 MJ, persistance, nettoyage).
- Pour une couverture complète, il est recommandé d’ajouter des tests unitaires automatisés, des E2E front, et des tests de performance.
