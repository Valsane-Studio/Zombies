# ZONE ZÉRO — Étude 06 · Cour des ombres

**Jouer : https://valsane-studio.github.io/Zombies/**

Cette nouvelle page d'accueil est un **prototype de monde 3D en perspective cinématographique** inspiré par une esthétique industrielle sombre, brumeuse et épurée. Ce n'est pas un jeu à choix ni un panorama : on dirige un personnage directement à travers la profondeur réelle de la scène.

## Prototype actuel

- Grand espace 3D avec entrepôts monumentaux, murs de béton, carcasse automobile, rails métalliques, ferrailles, structure triangulaire et végétation discrète.
- Petite silhouette humaine en veste rouge sombre et pantalon anthracite, bras/jambes animés.
- Lumière directionnelle et ombres portées, brume bleutée, teintes désaturées et volumétrie industrielle.
- **Rampe praticable** sur ~16 mètres, qui monte de 0 à 3,24 mètres, puis vraie **passerelle surélevée** avec garde-corps et supports.
- Marcher, courir, sauter, avancer/reculer et tourner librement dans la profondeur.
- Déplacement au clic avec recherche de chemin **A\*** et prise en compte des obstacles / dénivelés.
- Collisions indépendantes de la géométrie décorative : pas de collision contre les herbes, câbles ou petits gravats.
- Petite radio lumineuse en hauteur, à examiner en appuyant sur E quand on s'approche.
- Interface épurée, contrôles tactiles simplifiés.

## Commandes

| Action | Commande |
| --- | --- |
| Marcher | ZQSD / WASD |
| Courir | Maj |
| Sauter | Espace |
| Cliquer pour se déplacer | Clic gauche sur le sol, la rampe ou la passerelle |
| Orienter la caméra | Maintenir clic droit (ou central) et glisser, ou flèches |
| Zoomer | Molette |
| Recentrer la caméra | C |
| Retourner au point de départ | R ou bouton |
| Masquer l'interface | H |
| Examiner la radio, une fois à proximité | E |
| Tactile | Joystick et bouton Sauter |

Le déplacement au clavier est **relatif à la caméra** pour rester confortable. La souris permet un trajet automatisé en terrain praticable, sans téléportation.

## Architecture

- \`index.html\` : nouvelle étude 06 (accueil).
- \`yard.css\` : habillage.
- \`yard-world.js\` : cour 3D, hauteur de la rampe/passerelle, collisions explicites, végétation et éclairage décoratif.
- \`yard-game.js\` : personnage animé, mouvement, saut, caméra de suivi, contrôles.
- \`yard-nav.js\` : cheminement A* avec contraintes de hauteur et collisions.
- \`immersive-ambience.js\` : ambiance sonore générative.

Les études précédentes restent accessibles :
- **Salon 3D** : https://valsane-studio.github.io/Zombies/salon.html
- **Ancienne rue 3D** : https://valsane-studio.github.io/Zombies/rue.html

## Limites

Il s'agit d'une **étude artistique et jouable**, pas encore d'un jeu fini. Le style privilégie les silhouettes, l'éclairage et l'atmosphère au photoréalisme. Les personnages et éléments industriels restent modélisés avec des volumes géométriques simples, mais cette fois c'est une direction artistique volontaire.

La construction des objets 3D, les hauteurs de la rampe, la montée et les routes de navigation ont été simulées, et les fichiers testés en syntaxe. Le rendu WebGL complet sur un navigateur réel n'a pas encore été inspecté visuellement. Les performances et l'aspect final peuvent dépendre du navigateur et de l'appareil.

© Valsane Studio · Trois.js / Three.js.
