# ZONE ZÉRO — LE CARREFOUR

**Valsane Studio · Prototype tactique 08**

Ce dépôt héberge maintenant **Le Carrefour**, une nouvelle approche de ZONE ZÉRO : un jeu de stratégie de survie **au tour par tour** et en 3D isométrique. L'ancienne grande ville temps réel est conservée dans les fichiers historiques (\`game.js\`, \`world.js\`, \`stealth.js\`, etc.) mais n'est plus l'expérience lancée par \`index.html\`.

## Concept

Traverser **un petit quartier conçu à la main** et rejoindre le point B. Il existe plusieurs itinéraires. Sept zombies ordinaires patrouillent et réagissent simplement à la présence du survivant ou à un bruit. Il n'est pas nécessaire de les éliminer.

Chaque action fait avancer le jeu d'un tour. **Les zombies jouent après le joueur.** Le joueur voit à l'avance la destination partielle, la distance parcourue et le rayon sonore de son action.

L'objectif est de créer des choix lisibles : passage direct, prudence derrière les voitures, détour près des façades, diversion ou combat très limité.

### Commandes

| Action | Contrôle |
|---|---|
| Déplacer le survivant | Sélectionner « Déplacer » puis cliquer une case connue |
| Se faufiler (2 cases, bruit 1) | **1** |
| Marcher (3 cases, bruit 3) | **2** |
| Courir (jusqu'à 5 cases en ligne droite, bruit 8) | **3** |
| Activer le déplacement | **A** |
| Préparer un lancer de bouteille | **B**, puis cliquer sur une case visible à 7 cases ou moins |
| Viser et tirer sur un zombie visible | **F**, puis cliquer sur le zombie |
| Recharger le pistolet | **R** |
| Fouiller la case où se trouve le survivant | **E** |
| Utiliser un pansement | **H** |
| Attendre un tour, récupérer de l'endurance | **Espace** |
| Choisir le pistolet / fusil à pompe | **Q** / **D** (si le fusil a été trouvé) |
| Déplacer la caméra | Glisser la souris |
| Zoom | Molette |
| Recentrer la caméra une fois | **C** |
| Recommencer | Bouton « Recommencer » |

Les boutons sont également disponibles dans le panneau de droite.

### Règles essentielles

- **Visibilité limitée** : les bâtiments et le bus occultent la vue. Les cases découvertes restent mémorisées, mais les infectés hors champ redeviennent invisibles.
- **Bruit prévisible** : survoler une action affiche un cercle ambré correspondant à sa portée sonore ; certains ennemis hors de vue peuvent l'entendre.
- **Patrouilles** : les zombies suivent un comportement simple et une route définie ; un bruit les attire vers son origine, voir le joueur provoque une poursuite.
- **Couverts** : se faufiler derrière une voiture ou un obstacle bas réduit le risque d'être aperçu.
- **Course limitée** : sprinter coûte deux points d'endurance (sur quatre). La marche et l'infiltration en restaurent un ; attendre en restaure deux.
- **Combats limités** : le pistolet inflige un point de dégâts et les infectés en possèdent deux. Le fusil à pompe, optionnel, inflige deux points à courte portée mais est extrêmement bruyant.
- **Ressources rares** : quatre cartouches dans le chargeur initial, quatre en réserve, deux bouteilles et un pansement. Des caches permettent de récupérer du matériel, au prix d'un tour de fouille.
- **Santé** : trois points de vie. Un infecté adjacent au début de sa phase peut infliger un point.
- **Échec/rejeu** : la partie se termine si la santé tombe à zéro. L'extraction est réussie en atteignant la case B.

### Contenu du premier niveau

Un carrefour, un bus incendié, plusieurs automobiles abandonnées, des façades et commerces barricadés, des bennes, des barrages, quelques caches et sept zombies. Les itinéraires ne sont pas tous sûrs. Des marqueurs de trajet et de bruit guident les décisions.

### Architecture

- \`index.html\`, \`style.css\` : interface de jeu.
- \`tactics-rules.js\` : moteur pur, grille, vision, itinéraires, sons, ennemis et actions.
- \`tactics-world.js\` : diorama 3D, éclairage, personnages et affichage du brouillard de guerre.
- \`tactics.js\` : commandes, caméra indépendante, animations, prévisualisations, sons et HUD.

Le jeu charge Three.js depuis jsDelivr. GitHub Pages publie le dépôt avec le workflow \`.github/workflows/pages.yml\`.

**Statut : prototype expérimental.** Le décor 3D reste construit à partir de géométries procédurales et de textures dessinées par code : ce n'est pas encore un jeu photoréaliste. Les animations et l'équilibrage doivent être évalués en navigateur. Il n'y a pas encore de sauvegarde ni de campagne complète.

© Valsane Studio.
