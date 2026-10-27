# ZONE ZÉRO — Valsane Studio

## Prototype 06 : survie solitaire

Le jeu **Zombies** est désormais distinct du jeu **Intervention**.

Un seul survivant traverse la ville du point A jusqu'au point B. Il doit éviter les zones infestées, chercher des passages praticables et ramasser armes, munitions et soins.

- Caméra **100 % manuelle** : glisser la souris déplace la vue. Aucun suivi automatique, même lorsqu'on sélectionne ou déplace le personnage.
- Clic sur le terrain : se rendre à cet endroit par un chemin calculé, si praticable.
- Touche **C** ou bouton **CENTRER** : recentrer **une fois** sur le survivant (sans suivi).
- Molette : zoom.
- **1** : équiper le pistolet ; **2** : équiper la carabine, après l'avoir trouvée.
- Les armes tirent automatiquement sur les zombies visibles à portée.
- **Munitions limitées** : 12 cartouches initiales dans le pistolet et 36 en réserve. Des caisses de munitions sont disséminées en ville.
- **Carabine à trouver** et trousses de soins à récupérer en passant dessus.
- Zombies moins nombreux que dans la version d'escouade, répartis dans six secteurs. Les zombies poursuivent le survivant proche, sans comportement tactique.
- Barrages, voitures calcinées, poubelles et gravats compliquent la progression.
- Objectif : rejoindre le cercle vert d'extraction du point B en restant vivant.

### Technique

Site statique Three.js : \`index.html\`, \`style.css\`, \`game.js\`, \`world.js\`,
\`navigation.js\`, \`street-details.js\`, \`loot.js\`, \`audio.js\`, \`effects.js\`.
Le moteur Three.js est chargé en ligne depuis jsDelivr.

Ce prototype représente une première boucle de survie, sans sauvegarde ni fabrication.
La 3D est encore procédurale. À terme, le jeu doit devenir une véritable exploration
urbaine avec découverte d'équipement et prise de risque liée aux ressources.

**Autre application :** [INTERVENTION](https://valsane-studio.github.io/Intervention/) pour le gameplay tactique d'escouade et de libération d'otages.

© Valsane Studio.
