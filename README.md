# ZONE ZÉRO — Valsane Studio

Prototype de jeu de tactique d'escouade en 3D (Three.js), jouable dans un navigateur moderne.

## Lancer le jeu

Ouvrir le site GitHub Pages du dépôt. Aucun compte ni installation ne sont nécessaires.

- **1 à 4** : sélectionner un survivant
- **Clic sur le sol** : donner un ordre de déplacement
- **Glisser** : faire pivoter la caméra
- **Maj + glisser** ou **clic droit + glisser** : déplacer la caméra
- **Molette** : zoom
- **Espace** : pause tactique
- Boutons de l'interface : pause, vitesse ×2 et recommencer

## Règles du prototype

- Quatre agents avec des pistolets 9 mm, tirs et rechargements automatiques.
- Les zombies visent uniquement le survivant le plus proche en distance horizontale.
- Les agents peuvent bouger pendant les vagues.
- Le bloc central est accessible par la rampe à l'est.
- Les **cercles jaunes** sont les zones de tir stables : **+15 points de précision de référence**, cadence passant de 2 à 2,85 tirs/seconde et dégâts de contact réduits de 42 %. Bonus actifs si l'agent est arrêté dans le cercle.
- En hauteur : +4 mètres de portée et +7 points de précision de référence.
- Chaque zombie éliminé rapporte des crédits de recherche.
- La mission dure cinq vagues ; aucune installation n'est à défendre.

Le système de combat et les statistiques sont une base de réglage, et non une simulation balistique réelle. Le modèle 3D est semi-réaliste procédural (sans assets externes) et doit encore être enrichi.

## Technique

Les fichiers principaux sont : \`index.html\`, \`style.css\`, \`world.js\`, \`game.js\`. Le navigateur charge Three.js depuis jsDelivr ; il faut donc une connexion Internet.

Publication automatique via GitHub Actions / GitHub Pages, si GitHub Pages et Actions sont autorisés dans les paramètres du dépôt.

© Valsane Studio — prototype en cours de conception.
