# Règles - La Légende des 5 Anneaux (4ème édition)

## Structure des Données

### 1. Personnages (`characters`)

```json
{
  "id": "uuid",
  "nom": "string",
  "clan": "clan_id",
  "famille": "famille_id",
  "ecole": "ecole_id",
  "rang": 1-5,
  "xp": "number",
  "honneur": 0-10,
  "gloire": 0-10,
  "souillure": 0-10,
  "statut": 0-10,
  "anneaux": {
    "terre": {"valeur": 2},
    "eau": {"valeur": 2},
    "feu": {"valeur": 2},
    "air": {"valeur": 2},
    "vide": {"valeur": 2}
  },
  "traits": {
    "terre": {"endurance": 2, "volonte": 2},
    "eau": {"force": 2, "perception": 2},
    "feu": {"agilite": 2, "intelligence": 2},
    "air": {"reflexes": 2, "intuition": 2}
  },
  "competences": [
    {
      "nom": "string",
      "rang": 1-10,
      "trait": "trait_id",
      "emphase": "string"
    }
  ],
  "avantages": ["avantage_id"],
  "desavantages": ["desavantage_id"],
  "techniques": ["technique_id"],
  "sorts": ["sort_id"],
  "kata": ["kata_id"],
  "kiho": ["kiho_id"],
  "equipement": ["equipement_id"],
  "blessures": {
    "en_pleine_sante": {"malus": 0, "blesse": false},
    "egratignes": {"seuil": "terre * 5", "malus": 3, "blesse": false},
    "legerement_blesse": {"seuil": "terre * 10", "malus": 5, "blesse": false},
    "blesse": {"seuil": "terre * 15", "malus": 10, "blesse": false},
    "grievement_blesse": {"seuil": "terre * 20", "malus": 15, "blesse": false},
    "entaille": {"seuil": "terre * 40", "malus": 20, "blesse": false},
    "mourant": {"seuil": "terre * 60", "mort_imminente": true},
    "mort": {"decede": true}
  }
}
```

### 2. Clans (`clans`)

```json
{
  "id": "string",
  "nom": "string",
  "description": "string",
  "avantage_clan": "string",
  "desavantage_clan": "string",
  "bonus": {"honneur": 0, "gloire": 0, "statut": 0},
  "familles": ["famille_id"],
  "couleurs": ["couleur1", "couleur2"],
  "mon": "url_image"
}
```

**Liste des Clans:**
- Crabe (Hida, Hiruma, Kaiu, Kuni, Yasuki)
- Grue (Asahina, Daidoji, Doji, Kakita)
- Dragon (Agasha/Tamori, Kitsuki, Mirumoto, Togashi)
- Lion (Akodo, Ikoma, Kitsu, Matsu)
- Phénix (Asako, Isawa, Shiba)
- Scorpion (Bayushi, Shosuro, Soshi, Yogo)
- Licorne (Iuchi, Ide, Moto, Shinjo, Utaku)
- Mante (Yoritomo, Moshi, Tsuruchi)
- Impériaux (Miya, Otomo, Seppun)

### 3. Familles (`familles`)

```json
{
  "id": "string",
  "nom": "string",
  "clan_id": "string",
  "bonus_traits": {"trait": "+1"},
  "description": "string"
}
```

### 4. Écoles (`ecoles`)

```json
{
  "id": "string",
  "nom": "string",
  "clan_id": "string",
  "famille_id": "string",
  "type": "bushi|shugenja|courtisan|ninja|moine",
  "bonus_honneur": "number",
  "competences": [
    {"nom": "string", "rang_requis": 1}
  ],
  "equipement_depart": ["string"],
  "techniques": [
    {
      "rang": 1-5,
      "nom": "string",
      "effet": "string"
    }
  ],
  "affinite_element": "terre|eau|feu|air|vide",
  "deficience_element": "terre|eau|feu|air|vide"
}
```

**Types d'écoles:**
- **Bushi**: Guerriers, écoles de combat
- **Shugenja**: Prêtres magiciens, lanceurs de sorts
- **Courtisan**: Politiciens, diplomates
- **Ninja**: Espions, assassins (Scorpion)
- **Moine**: Moines tatouistes ou Confréries

### 5. Compétences (`competences`)

```json
{
  "id": "string",
  "nom": "string",
  "type": "haute|basse|bugei|marchande",
  "trait": "trait_id",
  "description": "string",
  "emphases": ["string"],
  "maitrise": [
    {"rang": 3, "effet": "string"},
    {"rang": 5, "effet": "string"},
    {"rang": 7, "effet": "string"}
  ]
}
```

**Catégories:**
- **Haute**: Compétences nobles (Calligraphie, Cérémonie du thé, Courtisan, Étiquette, etc.)
- **Basse**: Compétences roturières (Artisanat, Commerce, etc.)
- **Bugei**: Compétences martiales (Kenjutsu, Kyujutsu, Jiujutsu, etc.)
- **Marchande**: Compétences commerciales

### 6. Avantages/Désavantages (`avantages`, `desavantages`)

```json
{
  "id": "string",
  "nom": "string",
  "cout": "number",
  "type": "mental|physique|social|spirituel|materiel",
  "description": "string",
  "restrictions": ["clan_id", "ecole_id"],
  "rangs": 1-5
}
```

### 7. Sorts (`sorts`)

```json
{
  "id": "string",
  "nom": "string",
  "element": "terre|eau|feu|air|vide",
  "maitrise": 1-6,
  "portee": "string",
  "zone_effet": "string",
  "duree": "string",
  "augmentations": ["string"],
  "description": "string",
  "effet": "string"
}
```

**Éléments et philosophie:**
- **Terre**: Résistance, endurance, stabilité
- **Eau**: Adaptabilité, défense, clarté
- **Feu**: Agressivité, destruction, illumination
- **Air**: Précision, communication, illusion
- **Vide**: Transcendance, néant, mystère

### 8. Kata (`kata`)

```json
{
  "id": "string",
  "nom": "string",
  "type": "attaque|defense|mouvement",
  "rang_requis": 1-5,
  "maitrise_ecole": "number",
  "effet": "string",
  "cout_activation": "string"
}
```

### 9. Kiho (`kiho`)

```json
{
  "id": "string",
  "nom": "string",
  "type": "interne|martial|mystique",
  "maitrise": 1-6,
  "anneau": "terre|eau|feu|air|vide",
  "effet": "string",
  "duree": "string"
}
```

### 10. Équipement (`equipement`)

```json
{
  "id": "string",
  "nom": "string",
  "type": "arme|armure|objet",
  "cout": "koku",
  "description": "string",
  
  // Pour armes
  "dommages": "XkY",
  "vd": "number",
  "portee": "string",
  "mains": 1-2,
  "competence": "competence_id",
  "mots_cles": ["samurai", "paysan", "grand", "petit"],
  
  // Pour armures
  "rd": "number",
  "malus_tn": "number",
  
  // Pour objets
  "effet": "string"
}
```

### 11. Campagnes (`campagnes`)

```json
{
  "id": "uuid",
  "nom": "string",
  "description": "string",
  "mj_id": "user_id",
  "joueurs": ["user_id"],
  "personnages": ["character_id"],
  "sessions": ["session_id"],
  "date_creation": "timestamp",
  "statut": "active|terminee|pause"
}
```

### 12. Sessions (`sessions`)

```json
{
  "id": "uuid",
  "campagne_id": "uuid",
  "numero": "number",
  "titre": "string",
  "date": "timestamp",
  "resume": "string",
  "xp_accordes": "number",
  "evenements": ["string"],
  "pnj_rencontres": ["pnj_id"],
  "lieux_visites": ["lieu_id"]
}
```

---

## Règles de Jeu

### Système de Résolution

**Formule de base:** Trait + Compétence + Modificateurs
- Lancer: `Trait + Compétence` dés à 10 faces (d10)
- Garder: `Trait` dés
- Notation: `XkY` (lancer X dés, garder Y)
- Seuil de réussite typique: 15

**Règle du 10:** Un dé qui fait 10 explose (relancer et ajouter)

**ND (Number to be Defeated):**
- 5: Très facile
- 10: Facile
- 15: Moyen
- 20: Difficile
- 25: Très difficile
- 30+: Héroïque

### Combat

**Initiative:** Réflexes + Intuition + 1d10

**Armure TN (à toucher):** 
- Réflexes × 5 + 5 + bonus armure + bonus école + modificateurs

**Séquence du tour:**
1. Déclaration des actions
2. Sorts (initiative)
3. Tir à distance (initiative)
4. Corps à corps (initiative)
5. Autre actions (initiative)

**Actions:**
- **Action simple:** Attaque, lancer un sort, se déplacer
- **Action complexe:** Attaque totale, défense totale
- **Action gratuite:** Parler, lâcher un objet

**Jets d'attaque:**
- Attaque simple: Trait + Compétence d'arme
- Si réussi ≥ TN adverse: touché
- Jet de dommages: Arme (XkY) + bonus Force (pour mêlée)

**Réduction de dommages (RD):**
- Armure réduit les dégâts reçus
- Calcul: Dommages - RD = Blessures infligées

**Modificateurs de combat:**
- Position avantageuse: +10 TN attaquant
- Défense totale: +10 à son TN
- Attaque totale: +2k1 attaque, -10 à son TN
- Flanqué: -5 à son TN
- À terre: -10 à son TN

### Blessures et Guérison

**Niveaux de blessures:** (calculés selon Terre du personnage)
- En pleine santé: 0 malus
- Égratigné (+5): -3 aux jets
- Légèrement blessé (+10): -5 aux jets
- Blessé (+15): -10 aux jets
- Grièvement blessé (+20): -15 aux jets
- Entaillé (+40): -20 aux jets, inconscient
- Mourant (+60): mort en `Endurance` rounds
- Mort: décès

**Guérison:**
- Naturelle: 1 blessure/jour avec repos
- Médecine: Intelligence + Médecine vs ND 15
- Magie: Sorts de guérison (eau/terre)

### Magie

**Lancer un sort:**
1. Anneau du sort ≥ Maîtrise du sort
2. Lancer: Anneau + Shugenja (école) + 1d10
3. ND = Maîtrise × 5
4. Si réussi: sort lancé, effets appliqués

**Augmentations:**
- +1 portée, +1 dommage, +1 cible, etc.
- Coût: +5 au ND par augmentation

**Parchemins:**
- Permettent de lancer un sort sans jet
- Consommables
- Création: Calligraphie + Intelligence

**Souillure:**
- Maho (magie de sang): +1 Souillure/sort
- Portail des Ombres: +0.5 Souillure/round
- Souillure ≥ Terre × 2: Perdu

### Honneur, Gloire, Statut

**Honneur (0-10):**
- Représente l'intégrité personnelle
- Perdu par actions déshonorantes
- Seuil 0: Seppuku obligatoire
- Gain: actes héroïques, respecter Bushido

**Gloire (0-10):**
- Renommée dans l'Empire
- Gagnée par exploits publics
- Influence les réactions des PNJ

**Statut (0-10):**
- Position sociale
- 1: Ronin, 3: Samouraï, 5: Seigneur, 8: Champion

**Souillure (0-10):**
- Corruption par les Ombres
- Gagnée via Maho, Portail, lieux maudits
- Irrécupérable

### Expérience

**Coût d'amélioration:**
- Anneau: Nouveau rang × 8 XP
- Trait: Nouveau rang × 6 XP
- Compétence (école): Nouveau rang × 1 XP
- Compétence (autre): Nouveau rang × 2 XP
- Technique d'école: 10 XP
- Sort: 3 XP
- Kata: 2 XP
- Kiho: 4 XP

**Gain d'XP:**
- Fin de session: 2-4 XP
- Bonne interprétation: +1 XP
- Accomplissement majeur: +2 XP

### Social et Influence

**Jet de Courtisan:**
- Intuition + Courtisan vs TN = Statut × 5 + 10

**Jet d'Étiquette:**
- Intuition + Étiquette pour connaître protocoles

**Duel d'honneur:**
1. Défi (Iaijutsu)
2. Évaluation (Focus): 3 rounds
3. Frappe (Iaijutsu + Focus gardé)
4. Résolution

---

## Lore - Rokugan

### Géographie

**L'Empire d'Émeraude (Rokugan):**
- Dirigé par l'Empereur Hantei
- 7 Grands Clans + 2 Clans Mineurs principaux
- Capitale: Toshi Ranbo / Kyuden Seppun

**Territoires par Clan:**
- **Crabe**: Mur Kaiu (sud), défense contre l'Outremonde
- **Grue**: Terres côtières (nord-ouest), richesse culturelle
- **Dragon**: Montagnes du Nord, isolés et mystiques
- **Lion**: Plaines centrales, cœur militaire
- **Phénix**: Nord, bibliothèques et temples
- **Scorpion**: Sud-ouest, terres arides
- **Licorne**: Nord-ouest, terres de pâturages
- **Mante**: Îles (est), maîtres des mers

**Lieux importants:**
- Château du Kyuden de chaque clan
- Ville de Ryoko Owari (crime, Scorpion)
- Cité du Crépuscule Perpétuel (Dragon)
- Le Mur Kaiu (Crabe)

### Cosmologie

**Les Kami:**
- 9 enfants divins tombés de Tengoku (Paradis Céleste)
- Fondateurs des 7 Grands Clans + Impérial
- Fu Leng tomba dans Jigoku (Enfers) → Dieu Noir

**Les Trois Royaumes:**
- **Tengoku**: Paradis, Fortunes et Kami
- **Ningen-do**: Monde mortel (Rokugan)
- **Jigoku**: Enfers, démons et souillure

**Les Fortunes:**
- Divinités mineures (7 Fortunes, Fortunes des vents)
- Fortune de Jurojin (longévité), Benten (amour), etc.

### Histoire

**Chronologie majeure:**
- **An 1**: Chute des Kami, fondation de Rokugan
- **An ~400**: Premier Jour des Tonnerres vs Fu Leng
- **An ~1000**: Coup du Scorpion
- **An ~1120**: Guerre des Clans
- **An ~1160**: Deuxième Jour des Tonnerres (4e édition)
- **An ~1170**: Période actuelle (4e édition)

**Événements clés:**
- **Coup du Scorpion**: Tentative de meurtre de l'Empereur
- **Guerre des Clans**: Grand conflit entre tous les clans
- **Retour de la Licorne**: Après 800 ans d'errance

### Bushido - Les 7 Vertus

1. **Gi (Rectitude/Justice)**: Être juste, droit
2. **Yu (Courage)**: Affronter la mort sans peur
3. **Jin (Compassion)**: Aider les plus faibles
4. **Rei (Respect/Courtoisie)**: Étiquette parfaite
5. **Makoto (Sincérité)**: Parole = engagement
6. **Meiyo (Honneur)**: Préserver sa réputation
7. **Chugo (Loyauté)**: Fidélité absolue à son seigneur

**Violations:**
- Mensonge: -5 Honneur
- Lâcheté: -10 Honneur
- Trahison: Seppuku obligatoire

### Philosophie et Religion

**Shinseisme (Tao de Shinsei):**
- Philosophie dominante
- "Le chemin c'est l'homme lui-même"
- Cycle de réincarnation

**Fortunisme:**
- Vénération des Fortunes
- Temples et sanctuaires
- Prières et offrandes

**Shugenja et Kami:**
- Élémentarisme: parler aux esprits (kami) des éléments
- Pas de "sorts" mais requêtes aux kami
- Équilibre cosmique essentiel

### Société

**Hiérarchie sociale:**
1. Empereur (Fils du Ciel)
2. Familles impériales
3. Champions de Clan
4. Daimyo (seigneurs)
5. Samouraïs
6. Heimin (paysans, artisans)
7. Hinin (intouchables)
8. Ronin (samouraïs sans maître)

**Obligations:**
- **Giri**: Devoir envers son seigneur
- **Ninjo**: Désirs personnels
- Conflit Giri/Ninjo = drame rokugani

**Seppuku (suicide rituel):**
- Restaure l'honneur perdu
- Peut être ordonné ou volontaire
- Kaishakunin: celui qui décapite

### Les Ombres (Outremonde)

**Fu Leng et Jigoku:**
- Dieu Noir, Kami déchu
- Source de corruption (Souillure)
- Portails vers Jigoku

**Maho (magie de sang):**
- Invocation de démons
- Pouvoir via sacrifice et sang
- Illégal, peine de mort

**Les Oni:**
- Démons de Jigoku
- Envahissent le monde mortel
- Combattus par le Crabe

**Terre Souillée:**
- Au-delà du Mur Kaiu
- Infectée par Jigoku
- Perdition assurée

---

## API Backend

### Endpoints Principaux

**Authentification:**
- `POST /api/auth/register` - Créer compte
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion

**Personnages:**
- `GET /api/characters` - Liste personnages
- `POST /api/characters` - Créer personnage
- `GET /api/characters/:id` - Détails personnage
- `PUT /api/characters/:id` - Modifier personnage
- `DELETE /api/characters/:id` - Supprimer personnage

**Campagnes:**
- `GET /api/campaigns` - Liste campagnes
- `POST /api/campaigns` - Créer campagne
- `GET /api/campaigns/:id` - Détails campagne
- `PUT /api/campaigns/:id` - Modifier campagne
- `POST /api/campaigns/:id/sessions` - Ajouter session

**Référence:**
- `GET /api/clans` - Liste des clans
- `GET /api/ecoles` - Liste des écoles
- `GET /api/competences` - Liste des compétences
- `GET /api/sorts` - Liste des sorts
- `GET /api/equipement` - Liste équipement

**Jets de dés:**
- `POST /api/rolls` - Effectuer jet de dés
```json
{
  "character_id": "uuid",
  "trait": "reflexes",
  "competence": "kenjutsu",
  "modificateur": 0,
  "garder": 3
}
```

---

## Notes d'Implémentation

### Calculs Automatiques

**TN d'Armure:**
```
TN = (Reflexes × 5) + 5 + Bonus_Armure + Bonus_École + Modificateurs_Situation
```

**Seuils de Blessures:**
```
Égratigné: Terre × 5
Légèrement Blessé: Terre × 10
Blessé: Terre × 15
Grièvement Blessé: Terre × 20
Entaillé: Terre × 40
Mourant: Terre × 60
```

**XP pour Rang École:**
```
Rang 2: 75 XP cumulés
Rang 3: 150 XP cumulés
Rang 4: 250 XP cumulés
Rang 5: 350 XP cumulés
```

### Validations

- Anneaux: 2-10 (1 pour déficiences)
- Traits: Min = Anneau, Max = 10
- Compétences: 0-10
- Honneur/Gloire/Statut/Souillure: 0-10
- XP négatifs interdits

### Permissions

- MJ: Contrôle total campagne
- Joueur: Peut modifier uniquement son personnage
- Lecture publique: Référentiels (clans, écoles, sorts, etc.)

---

## Références

**Livre de base:** L5R 4ème édition
**Extensions majeures:** 
- The Great Clans
- Emerald Empire
- Enemies of the Empire
- Imperial Histories

**Outils de calcul:**
- Initiative = `1d10 + Réflexes + Intuition`
- Dés lancés = `Trait + Compétence`
- Dés gardés = `Trait`
- Jets opposés = Plus haut total gagne

**Gestion des exploding 10:**
- Si dé = 10: relancer et additionner
- Récursif (10 → 10 → 5 = 25)

---

Ce document structure l'intégralité des données, règles et lore nécessaires pour votre backend L5R 4e édition. Adaptez les schémas JSON selon votre stack technique (PostgreSQL, MongoDB, etc.).