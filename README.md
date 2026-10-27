# ZONE ZÉRO — La Pharmacie

Un petit jeu de **stratégie de survie au tour par tour**, imaginé et développé pour Valsane Studio. Ici, les zombies ne sont pas des cibles à éliminer : ce sont surtout des **pions dont le déplacement peut être influencé**.

La direction graphique assume l'apparence d'un **plateau de jeu tactique illustré**, et non celle d'une simulation 3D photoréaliste.

## Mission

Depuis le point de départ sur la gauche du quartier :

1. Entrer dans la **pharmacie** par l'une de ses portes.
2. Récupérer les **médicaments** au centre du bâtiment.
3. Revenir au **point d'extraction** vivant.

Le jeu se joue sur un plateau unique de **24 × 16 cases**, avec dix infectés initialement présents. Chaque action du joueur est suivie d'un tour de déplacement des zombies.

## Ce qui rend le niveau stratégique

- **Trois portes / passages** : l'entrée principale, la grille arrière et le portillon nord. Chacun doit être ouvert à proximité. Une porte modifie les passages disponibles pour le survivant **et pour les zombies**.
- **Alarme de voiture à distance** : un boîtier près du départ déclenche une sirène à l'est pour huit tours ; les zombies qui l'entendent convergent vers elle. À utiliser au bon moment.
- **Bouteilles** : deux au départ. Lancer à six cases au maximum produit un bruit entendu dans un rayon de huit cases.
- **Allures** : discrétion, marche, sprint. La course dépense de l'endurance et n'est efficace qu'en ligne droite ; attendre permet de reprendre son souffle.
- **Combats coûteux** : trois balles au départ, deux en réserve. Un zombie résiste à un tir, sauf s'il est déjà blessé. Une détonation attire les infectés sur un rayon de treize cases.
- **Hordes et goulets** : deux zombies ne peuvent pas occuper la même case. Les rues étroites et les portes peuvent créer des embouteillages.
- **Anticipation** : le plateau dessine le déplacement prévu du survivant, le cercle du bruit et des flèches vers **les positions estimées des zombies au tour suivant**. La simulation utilise les mêmes règles que l'exécution : ce que l'on prévoit est ce qui se produit.
- **Plusieurs chemins possibles** : les tests du moteur ont validé une traversée via l'alarme et l'entrée principale, et une autre via la grille arrière avec diversion sur le chemin du retour.

L'objectif est de gagner en ayant tiré le moins possible, et d'avoir envie de recommencer pour trouver une autre solution.

## Commandes

- **Choisir une allure** : Se faufiler (2 cases, aucun bruit), Marcher (3 cases, bruit 2), Courir (5 cases en ligne droite, bruit 6).
- **Choisir un outil** : Déplacer, Bouteille ou Tirer.
- **Survoler** une case pour prévisualiser les conséquences.
- **Cliquer** une destination, un zombie, un mécanisme ou une porte pour préparer une action.
- **Confirmer l'action** pour jouer le tour ; les zombies agissent immédiatement après.
- **Cliquer un symbole de porte, d'alarme ou de médicament** pour interagir si le survivant est adjacent ; les boutons contextuels apparaissent aussi à droite.
- **Attendre, recharger, se soigner** : ces actions consomment également un tour.
- **1 / 2 / 3** : allure discrète / normale / course.
- **A / B / F** : déplacement / lancer de bouteille / tir.
- **R / H / Espace** : recharger / soigner / attendre (prépare une action).
- **Entrée** : confirmer ; **Échap** : annuler.

## Architecture

- \`index.html\` : l'interface du nouveau jeu de plateau.
- \`pharmacy.css\` : la direction artistique de l'interface.
- \`pharmacy-engine.js\` : règles pures, déterministes et testables, routes, portes, alarmes, bruit, combat, déplacement des infectés et simulation des conséquences.
- \`pharmacy-board.js\` : peinture originale du plateau sur HTML Canvas 2D (24 × 16 cases).
- \`pharmacy.js\` : interaction, prévisualisation, confirmation, animation et ambiance sonore.

Les anciens prototypes 3D de la ville sont encore présents dans le dépôt, mais ne sont **plus chargés par la page d'accueil**. Le nouveau prototype n'utilise aucune bibliothèque graphique distante : il fonctionne avec le Canvas 2D natif du navigateur.

**État du jeu :** première mission expérimentale complète. Le réglage des paramètres (durée de l'alarme, nombre de zombies, ressources, collisions) et l'ergonomie sur téléphone doivent encore être évalués après les premiers essais dans un navigateur réel. Ce n'est pas un jeu commercial terminé.

© Valsane Studio.
