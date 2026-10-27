# ZONE ZÉRO — Valsane Studio

## Prototype 07 : exploration et survie tactique

Cette application est le jeu de **survie solitaire** du catalogue Valsane Studio. Le jeu **INTERVENTION** constitue un autre projet, consacré à la tactique d'escouade et au sauvetage d'otages.

### Objectif

Départ au point A. Rejoindre vivant le point B à travers une ville ravagée, sans connaître d'avance la configuration des rues, la position précise des zombies ni les emplacements de matériel. Les ennemis ne réapparaissent pas en vagues pour défendre un objectif fixe : la ville existe indépendamment du survivant.

### Systèmes de jeu

- **Brouillard de guerre** : visibilité en temps réel autour du survivant, raccourcie par les bâtiments, grands murs et obstacles ; la mini-carte ne dessine que les zones explorées. Les zombies et caches hors du champ de vision ne sont pas affichés.
- **Déplacement tactique** : mode accroupi, marche ou course, avec vitesses, distances de bruit et consommation d'endurance différentes. La course permet de se replier, mais elle est bruyante et fatigante.
- **Dissimulation** : couvert derrière une voiture, un muret ou un mur, accroupissement, contournement des obstacles et coupure des lignes de vue. Le couvert accorde également un bonus de stabilité au tir.
- **Détection des infectés** : un zombie ordinaire réagit à la proximité visuelle et aux bruits (pas, tirs, verre brisé). Il suit le dernier endroit détecté et peut perdre la piste. Il ne sélectionne pas stratégiquement les cibles et n'évite pas intelligemment les tirs.
- **Armes** : pistolet (au départ), carabine et fusil à pompe (à trouver). Cadence, précision, dégâts, portée et bruit différents. Chaque arme a son propre chargeur et sa propre réserve de munitions.
- **Tir** : automatique mais désactivable, pour pouvoir explorer sans déclencher involontairement une fusillade. Tirs sonores, trajectoires, impacts et corps temporaires conservés.
- **Fouille** : caches de munitions 9 mm, 5,56 mm et calibre 12, armes et trousses de soins. Il faut s'approcher et passer quelques instants à fouiller.
- **Soins** : kits transportables, utilisation immobile avec délai et possibilité d'interrompre l'action.
- **Leurres** : bouteilles cassées pouvant être lancées à distance limitée ; leur bruit attire les zombies et permet d'organiser une diversion.
- **Lampe** : allonge la portée de vision mais rend le survivant plus facile à détecter.
- **Carte urbaine** : grandes rues, bâtiments de plusieurs étages, véhicules calcinés, bennes renversées, amas de gravats et étranglements praticables ou bloqués.
- **Ambiance** : éclairage et brume, pluie fine, bitume humide et effets de lumière d'urgence.

### Commandes

| Commande | Action |
|---|---|
| Clic sur le terrain | Ordre de déplacement |
| Glisser la souris | Déplacer librement la caméra |
| Molette | Zoom |
| C | Recentrer une fois sur le survivant ; **aucun suivi automatique** |
| Z | Accroupi et discret |
| X | Marche normale |
| V | Course |
| 1 / 2 / 3 | Pistolet / carabine / fusil à pompe (si trouvé) |
| F | Autoriser ou couper le tir automatique |
| L | Allumer ou éteindre la lampe |
| R | Recharger si des munitions restent |
| E | Fouiller une cache à proximité (immobile) |
| H | Utiliser un kit de soins (immobile) |
| T | Activer le lancer de leurre, puis cliquer à moins de 13 m |
| Espace | Pause |
| Boutons HUD | Toutes les actions principales sont également cliquables |

### État technique et limites

Il s'agit d'un **prototype jouable**, pas d'une simulation complète ni d'un jeu fini. Les zombies ont une logique rudimentaire de poursuite et recherche, les personnages sont encore réalisés par assemblage de formes 3D, les bâtiments ne sont pas visitables et le monde ne possède pas encore de sauvegarde, crafting, animations artistiques importées ou campagne multi-missions. Les équilibres de vitesse, perception, butin et points de vie doivent être validés en situation réelle.

Code :
- \`index.html\` et \`style.css\` : interface de survie.
- \`game.js\` : boucle de jeu, combat, inventaire et commandes.
- \`world.js\` et \`street-details.js\` : géométrie des quartiers.
- \`navigation.js\` : itinéraires et obstacles.
- \`vision.js\` : champ de vision et brouillard de guerre.
- \`stealth.js\` : détection visuelle et sonore.
- \`survival-rules.js\` : armes et modes de déplacement.
- \`loot.js\` : caches et matériels.
- \`weather.js\`, \`audio.js\`, \`effects.js\` : atmosphère et effets.

Dépendance : Three.js chargé depuis jsDelivr. Publication statique GitHub Pages par GitHub Actions.

© Valsane Studio.
