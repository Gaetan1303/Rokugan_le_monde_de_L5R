# Application Web de Légende des 5 Anneaux - 4e édition

Cette application est conçue pour gérer la création de personnages, les parties en cours, la bibliothèque d'informations sur le jeu, et la possibilité de lancer des campagnes en ligne. Elle est développée avec Angular pour offrir une expérience fluide et interactive aux utilisateurs.

## Menu Principal

L'utilisateur accède à un menu principal simple et intuitif avec les options suivantes :

- **Création de personnage**
- **Mes personnages**
- **Bibliothèque**
- **Mes parties**
- **Lancer une campagne**

### 1. Création de personnage

Cette section permet à l'utilisateur de créer un personnage pour le jeu de rôle "Légende des 5 Anneaux", 4e édition. Le template de création de personnage offrira plusieurs étapes où l'utilisateur pourra sélectionner :

- **Clan** : Choisir un clan parmi ceux disponibles dans le jeu (par exemple, Dragon, Lion, Crabe, etc.).
- **Éducation** : Sélectionner une école et les compétences associées.
- **Caractéristiques** : Distribuer des points dans les différentes caractéristiques (Force, Agilité, Intelligence, etc.).
- **Avantages/Désavantages** : Choisir des avantages et des désavantages qui influencent le jeu.
- **Compétences** : Choisir des compétences spécifiques pour personnaliser davantage son personnage.
- **Background** : Décrire l'histoire et la personnalité de son personnage.

### 2. Mes personnages

Cette section affiche la liste des personnages créés par l'utilisateur. Chaque personnage aura une page détaillée contenant :

- **Nom du personnage**
- **Clan et école**
- **Caractéristiques**
- **Compétences**
- **Avantages/Désavantages**
- **Historique et autres informations pertinentes**
- **Option de modifier ou supprimer un personnage**

### 3. Bibliothèque

La bibliothèque est une ressource riche en informations liées à l'univers de "Légende des 5 Anneaux". Elle comprendra plusieurs sections utiles pour les joueurs et les maîtres de jeu (GM) :

- **Sorts** : Liste des sorts disponibles, leur description, effets et conditions d'utilisation.
- **Armes et équipements** : Description détaillée des différentes armes, armures et équipements.
- **Lore** : Informations sur l'histoire, les clans, les écoles et les traditions de l'univers L5R.
- **Règles** : Règles supplémentaires pour des mécaniques spécifiques du jeu (combat, magie, etc.).
  
### 4. Mes parties

Cette section présente les parties de jeu en cours auxquelles l'utilisateur participe en tant que joueur. Pour chaque partie, l'utilisateur peut voir :

- **Nom de la partie** 
- **Résumé du scénario**
- **État de la partie** : Si la partie est en pause, terminée, ou en cours.
- **Session en cours** : Un lien direct pour rejoindre la session en cours.
  
### 5. Lancer une campagne

Cette fonctionnalité est le cœur de l'application, permettant aux utilisateurs de créer et de gérer des campagnes multijoueurs en ligne. Elle comprend les éléments suivants :

- **Connexion au serveur** : L'utilisateur (joueur ou GM) se connecte à un serveur pour accéder à un scénario de jeu.
- **Scénarios** : Le GM choisit ou crée un scénario pour une nouvelle campagne.
- **Gestion des rôles** : Deux rôles principaux sont gérés :
  - **Maître de jeu (GM)** : Celui qui gère l'aventure, prépare les événements et interagit avec les joueurs.
  - **Joueur** : L'utilisateur participe à l'aventure, interagit avec le monde créé par le GM et prend des décisions qui affectent l'histoire.
  
Les joueurs peuvent rejoindre une campagne en ligne, interagir avec le monde du GM, et suivre l'évolution de l'histoire en temps réel.

Le GM aura accès à des outils spécifiques pour gérer la narration et le monde de jeu, tandis que les joueurs auront une interface dédiée pour interagir avec le monde et leurs personnages.

### Fonctionnalités supplémentaires

- **Notifications en temps réel** : Lorsque la partie commence, quand un événement majeur se produit, ou quand une action du joueur est nécessaire.
- **Chat en ligne** : Une fenêtre de chat pour la communication entre joueurs et GM pendant la partie.
- **Historique de la campagne** : Un journal de bord pour suivre les actions clés et les événements importants de la campagne.

## Conclusion

Ce projet vise à fournir une expérience complète pour les joueurs et maîtres de jeu de "Légende des 5 Anneaux" en facilitant la création de personnages, la gestion des parties en cours, et la possibilité de lancer des campagnes en ligne. L'application utilise Angular pour une interface dynamique et réactive, permettant aux utilisateurs de vivre une expérience immersive et engageante.
