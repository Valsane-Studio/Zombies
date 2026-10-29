# ZONE ZÉRO — Étude 05 : un salon post-apocalyptique explorable en 3D

**Démo : https://valsane-studio.github.io/Zombies/**

**Ancienne rue 3D, conservée : https://valsane-studio.github.io/Zombies/rue.html**

## Objectif

Une seule pièce très travaillée plutôt qu'un quartier entier : tester les limites techniques du rendu **3D en temps réel** dans un navigateur, avec une exploration libre et moderne. **Ce n'est pas une image ni un panorama** : l'utilisateur se déplace vraiment dans un salon modélisé en 3D et peut observer ses objets sous plusieurs angles.

## Le salon

- Environ **12 × 10 mètres**, vue subjective avec éclairage cinématographique.
- Parquet en centaines de lames distinctes, craquelures, murs altérés, peintures et plâtre abîmé, boiseries, corniches.
- Trois fenêtres sur un jardin envahi par les arbres et buissons, rideaux déchirés, vitres endommagées, radiateurs.
- Canapé ancien aux coussins distincts, fauteuil, table basse, livres, vaisselle, lampe, buffet, bibliothèque, cheminée, cadres, chaise renversée.
- Débris, morceaux de verre, livres et feuilles au sol.
- Plantes qui entrent par les fenêtres, **2 500 feuilles instanciées**, **1 850 plans d'herbe**, **225 taches de mousse**, poussière flottante, lianes, arbres dans la cour extérieure.
- Lumière directe et ombres douces, brouillard très discret, légères traînées de lumière, rendu ACES.
- Textures créées procéduralement sur Canvas. Quand la connexion le permet, remplacement progressif de certains matériaux par des cartes PBR photographiques **Poly Haven CC0** (diffuse, normale et rugosité). Si elles ne chargent pas, la scène reste jouable.

## Commandes

| Action | Commande |
|---|---|
| Entrer dans la pièce | Bouton **Entrer dans le salon** |
| Regarder autour de soi | Bouger la souris, après un clic dans la scène |
| Marcher | ZQSD / WASD |
| Courir | Maj |
| Interagir avec un objet proche | E / F, ou clic gauche quand la souris est capturée |
| Libérer la souris | Échap |
| Adapter la focale | Molette |
| Activer / désactiver l'ambiance sonore | M ou bouton SON |
| Masquer l'interface | H |
| Tactile | Joystick à gauche, glisser le doigt dans le décor pour regarder ; **Examiner** si un objet est à portée |

Des objets peuvent être examinés, et **un tiroir peut être ouvert et refermé**. Quelques interactions déclenchent de courtes descriptions, sans inventaire ou quête.

## Architecture des fichiers

- \`index.html\`, \`room.css\` : nouvelle expérience.
- \`room-play.js\` : moteur de vue subjective, commandes souris et tactile, déplacements fluides, collisions, interactions.
- \`room-world.js\` : architecture physique de la pièce, mobilier, détails et points d'interaction.
- \`room-nature.js\` : végétation instanciée, jardin 3D extérieur et poussière.
- \`room-materials.js\` : textures procédurales et couches PBR photographiques facultatives.
- \`immersive-ambience.js\` : sons Web Audio synthétiques, sans musique.
- \`rue.html\`, \`street-demo.js\`, \`visit-building.js\`, \`street-world.js\`, etc. : ancien prototype de rue, sauvegardé.

## Limites honnêtes

Les modèles sont actuellement construits à la main en géométries procédurales, sans photogrammétrie, sans véritables modèles scannés d'objets ni post-production SSAO avancée. Les tissus, objets et végétaux sont améliorés par des matériaux et des surfaces géométriques, mais **le résultat ne doit pas être confondu avec une image photoréaliste générée ou une scène AAA Unreal Engine**.

La construction 3D et la boucle principale ont été contrôlées avec des tests simulés, et les imports ont été vérifiés. **Le rendu final sur un navigateur réel n'a pas encore été contrôlé visuellement.** Cette étude sert précisément à évaluer ce qu'il faut améliorer : géométrie, textures, éclairage et fluidité.

© Valsane Studio. Textures photographiques facultatives : [Poly Haven](https://polyhaven.com/) (CC0).
