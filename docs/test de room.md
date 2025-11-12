# Rapport de test automatisé : test de room

**Date d’exécution :** 12 novembre 2025

## Résumé
Ce rapport présente les résultats d’un test d’intégration automatisé simulant la création d’une room, l’ajout de 3 joueurs et 1 MJ, la création d’un scénario, la vérification de la persistance et le nettoyage. Chaque étape est mesurée en temps réel et commentée.

---

## Détail des étapes

- [OK] register+login mj1762957730415@test.com (2150 ms) : Utilisateur créé et connecté
- [OK] register+login j11762957730415@test.com (799 ms) : Utilisateur créé et connecté
- [OK] register+login j21762957730415@test.com (805 ms) : Utilisateur créé et connecté
- [OK] register+login j31762957730415@test.com (857 ms) : Utilisateur créé et connecté
- [OK] login mj1762957730415@test.com (338 ms) : Connexion réussie
- [OK] login j11762957730415@test.com (404 ms) : Connexion réussie
- [OK] login j21762957730415@test.com (394 ms) : Connexion réussie
- [OK] login j31762957730415@test.com (394 ms) : Connexion réussie
- [OK] createRoom (100 ms) : Room créée
- [OK] addPlayerToRoom (GM) (73 ms) : MJ ajouté à la room
- [OK] addPlayerToRoom (player 1) (84 ms) : Joueur 1 ajouté à la room
- [OK] addPlayerToRoom (player 2) (59 ms) : Joueur 2 ajouté à la room
- [OK] addPlayerToRoom (player 3) (61 ms) : Joueur 3 ajouté à la room
- [OK] createScenario (45 ms) : Scénario créé
- [OK] getScenario (46 ms) : Scénario récupéré et persistant
- [OK] deleteScenario (68 ms) : Scénario supprimé
- [OK] deleteRoom (110 ms) : Room supprimée

---

## Performances
- **Durée totale du test :** 6787 ms
- **Aucune erreur détectée**

## Commentaires
- Tous les appels API ont répondu dans des délais acceptables.
- La persistance et la suppression des entités sont confirmées.
- Ce test peut servir de référence pour comparer avec des tests manuels ou en production.

---


