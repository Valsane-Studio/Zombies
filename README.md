# ZONE ZÉRO — Valsane Studio

## Prototype 05 — Traversée urbaine, caméra tactique et sélection de groupe

Démo jouable dans un navigateur (Three.js) d'un **jeu tactique d'escouade**, sans vague ni bâtiment à défendre.

### Mission

**Faire rejoindre le point B (extraction) aux quatre survivants, depuis le point A.** Il suffit que tous les agents **encore vivants** soient à l'intérieur du cercle vert de sortie pour terminer la mission. La priorité est de préserver l'équipe, pas d'exterminer toute la ville.

- Une carte urbaine d'environ **185 × 130 mètres**, avec de grands pâtés de maisons, ruelles, rues et carrefours.
- **Carcasses de véhicules brûlés**, bennes et poubelles renversées, sacs-poubelle, gravats, clôtures brisées et revêtement marqué par les incendies.
- **Goulets tactiques** imposés par des voitures calcinées et des déchets encombrants, avec les obstacles intégrés à la navigation et représentés sur la mini-carte.
- Des **routes bouchées** par des barrages, voitures ou débris, qui imposent des détours calculés par l'algorithme A*.
- **21 zombies**, répartis dans **six secteurs infestés** (cercles rouges sur la carte) : moins nombreux que dans la première démo, mais beaucoup plus résistants (**220 à 309 PV** au lieu de 48 à 100 environ).
- Les zombies détectent le joueur quand il s'approche (environ 25 m). Ensuite, ils poursuivent toujours **le survivant le plus proche**, sans réaction tactique aux tirs et sans apparition de vagues.
- **Deux plateformes surélevées accessibles par rampe**, plusieurs postes de tir marqués par des **cercles jaunes**, offrant stabilité, cadence, précision et une protection partielle.
- Une **mini-carte interactive** pour explorer le quartier, repérer les obstacles, les concentrations d'infectés et le point B.
- Les quatre agents ont chacun un pistolet, des tirs automatiques et des munitions rechargeables automatiquement ; aucun ordre de tir manuel.
- Les impacts visuels, bruits de pistolet et corps temporaires de la version 03 sont conservés.
- Les éliminations rapportent des crédits de recherche, mais ces crédits ne servent pas encore à améliorer l'équipe.

### Contrôles

- **Clic sur un agent** ou **1 à 4** : sélectionner un survivant ; la caméra se recentre sur lui.
- **Maj + glisser avec la souris** : dessiner un lasso rectangulaire et sélectionner plusieurs survivants simultanément.
- **Maj + clic sur un agent** : l'ajouter ou le retirer de la sélection.
- **Clic sur le sol avec plusieurs agents sélectionnés** : les déplacer ensemble, avec une petite formation pour éviter la superposition.
- **Clic sur le terrain** : définir une destination. L'agent recherche un itinéraire praticable ; on peut donner de nouveaux ordres en cours de déplacement.
- **Glisser la souris** (ou **clic droit + glisser**) : déplacer manuellement la caméra dans les rues, sans rotation de la carte.
- **Maj + glisser** sert désormais exclusivement au lasso.
- **Molette** : zoom.
- **C** ou **◎ SUIVRE** : recentrer et suivre l'agent sélectionné.
- **Clic sur la mini-carte** : déplacer la caméra vers ce quartier, sans ordonner de déplacement aux agents.
- **Espace** : pause tactique.
- **1× / 2×** : vitesse du jeu.
- **♫ SON ON/OFF** : couper ou rétablir le son. L'audio s'active seulement après interaction avec la page.

### Implantation technique

- \`index.html\` : interface du jeu et mini-carte.
- \`style.css\` : habillage des panneaux et contrôles.
- \`game.js\` : agents, zombies, tirs automatiques, extraction, commandes et HUD.
- \`world.js\` : quartiers, immeubles, plateformes, routes bloquées, zones d'appui et objectifs.
- \`navigation.js\` : navigation A* optimisée, collisions et rampes.
- \`audio.js\`, \`effects.js\` : sons et effets des combats.

La 3D est générée procéduralement et les fenêtres sont instanciées pour limiter les appels de rendu. Le jeu charge Three.js depuis jsDelivr ; une connexion Internet est nécessaire.

Le prototype n'a pas encore de sauvegarde, de boutique, d'inventaire ni de missions multiples. Les dimensions, statistiques et temps de jeu pourront être rééquilibrés après test.

© Valsane Studio.
