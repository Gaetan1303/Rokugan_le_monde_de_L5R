# Rokugan, le monde de L5R

## Présentation 

Ce projet est une application web dédiée à l'univers de Rokugan, inspiré du jeu de rôle "La Légende des Cinq Anneaux" (L5R). Il s'agit d'une plateforme backend Node.js/TypeScript permettant de gérer des données de jeu, des scénarios, des personnages, du lore et des mécaniques spécifiques à L5R.

### Stack technique
- **Backend** : Node.js avec TypeScript (structure modulaire, contrôleurs, services, middlewares)
- **Données** : Fichiers JSON structurés pour le lore, les personnages, les règles, etc.
- **Tests** : Scripts de tests automatisés (stress, scénarios, routes API)
- **API** : Endpoints RESTful pour l'accès et la gestion des ressources du jeu

### Fonctionnalités principales
- Gestion des ressources de jeu (clans, personnages, techniques, sorts, etc.)
- Accès au lore et à l'historique de Rokugan via des endpoints dédiés
- Scénarios de test pour valider la persistance et la robustesse de l'API
- Structure évolutive pour intégrer de nouvelles mécaniques ou données

### Pour démarrer
1. Installer les dépendances dans le dossier `gamemaster-backend` :
	```bash
	cd gamemaster-backend
	npm install
	```
2. Lancer le serveur de développement :
	```bash
	npm run dev
	```
3. Explorer les routes API documentées dans `docs/` et interagir avec les données du jeu.

### Contribution
Le projet est ouvert à la contribution pour enrichir le lore, ajouter des fonctionnalités ou améliorer l'API. Merci de respecter la structure des fichiers et d'ajouter des tests pour toute nouvelle fonctionnalité.

### Licence 
Ce projet est sous licence de El Miminette ! 