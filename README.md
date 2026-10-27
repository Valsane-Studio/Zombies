# ZONE ZÉRO — Rue abandonnée

## Étude visuelle 01 · 27 octobre 2026

Cette version **repart de zéro** : une petite démonstration **3D jouable en temps réel**, avec un survivant et son pistolet dans une rue post-apocalyptique. **Aucun zombie, aucun farming, aucune récolte, aucun système de mission ou de progression.** Le but est de valider le rendu, l'ambiance et la sensation des déplacements avant de construire un vrai jeu d'exploration.

**Ouvrir :** https://valsane-studio.github.io/Zombies/

### Contrôles

- **ZQSD / WASD** : déplacer le survivant librement, par rapport à la caméra.
- **Maj** : courir.
- **Souris** : regarder / orienter le personnage, qui tient un pistolet.
- **Clic gauche** : tirer dans le décor (aucun ennemi et aucun système de dégâts).
- **R** : recharger le pistolet de démonstration (munitions d'essai renouvelables).
- **Flèches gauche / droite** : tourner la caméra autour de la scène.
- **Flèches haut / bas** : modifier l'angle de plongée.
- **Molette** : zoom.
- **C** : recentrer la vue.
- **H** : masquer / réafficher l'interface pour examiner le rendu.
- **Écran tactile** : joystick et bouton de tir élémentaires (à perfectionner).

### Direction visuelle

- **Vraie caméra perspective**, placée au-dessus et derrière le survivant, avec déplacement fluide et ombres.
- Rue de **145 mètres environ** bordée de bâtiments à plusieurs étages, commerces clos, fenêtres, corniches, tuyaux, enseignes, toits abîmés et petites ruelles.
- Voitures abandonnées, bennes, vitrines barricadées, lampadaires, gravats, végétation qui repousse, flaques d'eau et détails routiers.
- Matériaux **PBR** avec textures de chaussée et de trottoir de **Poly Haven** (CC0), chargées en ligne si disponibles. Secours sous forme de textures générées localement en Canvas, pour éviter un décor complètement vide si une ressource n'arrive pas.
- Personnage animé **Soldier.glb** issu des exemples publics de Three.js, chargé si disponible ; personnage entièrement généré en 3D comme solution de secours.
- Éclairage directionnel avec ombres, brouillard atmosphérique, teintes délavées et légère ambiance de fin de journée.

### Fichiers actifs

- \`index.html\` : scène et commandes simplifiées.
- \`street.css\` : interface visuelle.
- \`street-demo.js\` : caméra, déplacements WASD, collisions, personnage, chargement glTF, tir, animations.
- \`street-world.js\` : bâtiments, route, matériaux, véhicules, accessoires, colliders.

Les anciens prototypes sont **conservés dans le dépôt**, sans être chargés par cette version de la page d'accueil.

### Limites importantes

Ce prototype teste une **direction** plus réaliste, mais n'est pas photoréaliste : une rue 3D créée principalement avec des géométries procédurales ne peut pas atteindre le niveau visuel d'un jeu conçu avec des modèles de décors scannés, des assets high-poly, du baking, des animations professionnelles et un pipeline PBR complet. Les bâtiments ne sont pas encore visitables ; le pistolet est un élément de démonstration. L'essentiel est de pouvoir juger le rendu dans un navigateur avant d'investir davantage dans des assets de qualité.

Le moteur WebGL demande un navigateur compatible et une connexion pour charger Three.js. Le personnage animé et certaines textures externes nécessitent aussi une connexion, mais disposent de solutions de secours. Les tests automatiques ont porté sur la syntaxe JavaScript, les dépendances des fichiers et la génération de scène / collisions, **pas** sur une partie complète dans un navigateur réel.

### Crédits des ressources externes

- [Three.js](https://threejs.org/) — moteur 3D, exemples et modèle Soldier.
- [Poly Haven](https://polyhaven.com/) — [asphalt_03](https://polyhaven.com/a/asphalt_03) et [concrete_pavement](https://polyhaven.com/a/concrete_pavement), matériaux mis à disposition sous licence CC0.

© Valsane Studio.
