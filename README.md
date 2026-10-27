# ZONE ZÉRO — Rue abandonnée

## Étude de rendu 02 · Un survivant, une rue et son pistolet

Cette version reprend le prototype d'exploration réaliste à petite échelle. **Il n'y a aucun zombie, aucun farming, aucune mission, aucune collecte** : le but est de juger les proportions, le rendu végétal et la sensation de déplacement.

**Site** : https://valsane-studio.github.io/Zombies/

### Commandes

- **Clic gauche sur le sol** : rejoindre le point choisi. Le trajet contourne automatiquement les voitures, bennes et bâtiments.
- **Double-clic ou Maj + clic gauche** : rejoindre la destination en courant.
- **Clic droit (maintenu)** : orienter le pistolet vers le pointeur et tirer. Le personnage conserve toujours son pistolet à la main, même pendant la marche.
- **R** : recharger le pistolet de démonstration.
- **Échap** : annuler le déplacement.
- **Flèches gauche / droite** : faire pivoter la caméra.
- **Flèches haut / bas** : modifier la plongée.
- **Molette** : zoom.
- **H** : masquer ou réafficher l'interface.
- **C** : recentrer la caméra.
- **Écran tactile** : toucher le sol pour se déplacer, bouton Tirer.

Les touches ZQSD / WASD **ne dirigent plus le personnage**.

### Graphismes

- Personnage **civil en tee-shirt et jean**. Proportions plus discrètes : le modèle est réduit à 76 % de son échelle précédente, de sorte qu'il reste plus petit que les voitures. Sa main droite tient le pistolet.
- **Perspective oblique**, caméra douce, soleil avec ombres, brume et flaques.
- **Nature qui reconquiert la rue** : 3 300 herbes instanciées, 460 plaques de mousse irrégulières au sol, 64 panneaux de lierre sur les façades et 110 buissons. Leur densité se concentre aux bordures des trottoirs, joints du béton et murs. Ces éléments n'interrompent pas les déplacements.
- Les arbres, façades, enseignes et véhicules de l'étude précédente restent présents.
- Les matériaux de sol disposent de textures de secours procédurales ; certaines textures PBR de Poly Haven peuvent aussi être chargées en ligne.

### Architecture

- \`index.html\`, \`street.css\` : interface.
- \`street-demo.js\` : moteur d'exploration, caméra, rendu, armes.
- \`click-navigation.js\` : recherche d'itinéraires au clic, collisions, lissage des trajectoires, repère de destination.
- \`civilian.js\` : personnage civil avec animations simples des jambes et pistolet fixé à la main.
- \`street-world.js\` : rue, immeubles, véhicules, matières.
- \`overgrowth.js\` : herbes, mousse, buissons, lierre, textures végétales Canvas et instancing.

Les prototypes historiques restent dans le dépôt mais **ne sont pas chargés** par l'accueil.

### Limites

Le décor et le personnage restent construits principalement en géométries 3D procédurales. C'est plus détaillé qu'un plateau de jeu, mais ce n'est pas un environnement photoréaliste de production. Pour progresser franchement vers ce rendu, il faudra des modèles de personnes et de végétation texturés professionnellement, des décors scannés, de meilleures animations et une optimisation graphique.

Les modules ont été vérifiés en syntaxe ; la création de décor et les trajectoires de contournement d'obstacles ont été simulées. Le rendu dans un vrai navigateur WebGL n'a pas encore été contrôlé de bout en bout.

© Valsane Studio.
