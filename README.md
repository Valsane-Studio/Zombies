# ZONE ZÉRO — Le Café Nord (étude d’exploration 03)

Une étude **d’exploration 3D à la souris**, sans zombies, sans farming ni collecte obligatoire, dans une rue abandonnée envahie par la végétation.

**Jouer :** https://valsane-studio.github.io/Zombies/

## Nouveau bâtiment explorable : le Café Nord

L'ancien « Café Nord », sur le côté nord de la rue, n’est plus un volume fermé décoratif. Il a été remplacé par un bâtiment réellement constitué de pièces et de niveaux.

- **Hall au rez-de-chaussée** : entrée ouvrable au clic, carrelage, comptoir, mobilier abandonné, cage d’escalier.
- **Porte condamnée** : une seconde porte de rue, barrée de planches et définitivement inaccessible. Une interaction explique pourquoi.
- **Escalier** : les marches sont visibles, avec montée et descente animées. Le personnage peut atteindre un vrai premier étage.
- **Premier étage** : palier, porte à ouvrir, appartement avec lit, table, bibliothèque et objets anciens.
- **Toit** : second accès par la cage d’escalier. La vue de dessus permet d’observer les alentours et de redescendre.
- **Fenêtre arrière** : un passage alternatif, atteignable depuis le hall ou par la cour arrière, avec animation simplifiée pour franchir le rebord.
- **Gestion des occultations** : le toit et l’étage supérieur s’effacent quand le personnage explore le hall ; sur le palier, le toit s’efface ; il réapparaît lorsqu’on se trouve sur la terrasse.
- **Étiquettes cliquables** : entrée, portes, escaliers, fenêtre, observations. Une interaction éloignée fait marcher le personnage jusqu’au point adapté avant de s’exécuter.

Les autres immeubles restent **fermés et non visitables**. Il n’y a pas de téléportation libre entre les étages ni de système de quêtes.

## Commandes

- **Clic gauche au sol** : marcher jusqu’à la destination en contournant les obstacles.
- **Clic gauche sur l’étiquette d’une porte, d’un escalier ou d’une fenêtre** : se rapprocher et interagir.
- **Double-clic / Maj + clic** : courir.
- **Clic droit** : viser puis tirer ; le personnage garde son pistolet et le lève uniquement pour tirer.
- **R** : recharger ; **Échap** : annuler un trajet.
- **Molette** : zoom ; **flèches directionnelles** : faire pivoter ou incliner la caméra.
- **H** : masquer l’interface ; **C** : recentrer.
- Sur téléphone, toucher le sol pour se déplacer ; le bouton Tirer reste disponible.

## Structure du projet

- \`index.html\`, \`street.css\` : page et interface.
- \`street-demo.js\` : vue perspective, caméra, personnage, actions et changement de niveau.
- \`civilian.js\` : personnage civil en tee-shirt et pantalon, pistolet fixé à la main.
- \`click-navigation.js\` : navigation A*, repères de déplacement, interactions au clic et plans de hauteur.
- \`street-world.js\` : rue et intégration du bâtiment explorable.
- \`visit-building.js\` : architecture, mobilier, portes, escalier, appartement, toit, fenêtre, collisions par niveau et masquage des étages.
- \`overgrowth.js\` : herbe, mousse, lierre et buissons.

Les anciennes versions du plateau tactique restent dans le dépôt mais ne sont plus chargées.

## Limites de ce prototype

Il s’agit d'une première exploration architecturale, **pas d’un jeu terminé**. Les bâtiments et objets sont principalement issus de géométries procédurales ; les ascensions, franchissements et ouvertures utilisent des animations simples, pas encore de captures de mouvement ni de système physique avancé. Les interactions ne sont pas toujours synchronisées à une animation de mains. Le rendu WebGL dans un véritable navigateur doit encore être examiné : les vérifications ont porté sur la syntaxe et les simulations de trajectoires/collisions.

Texturations extérieures facultatives : [Poly Haven](https://polyhaven.com/) (CC0). Rendu : [Three.js](https://threejs.org/).

© Valsane Studio.
