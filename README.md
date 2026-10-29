# ZONE ZÉRO — Démo point-and-click interactive

**Jouer directement : https://valsane-studio.github.io/Zombies/**

Cette version n'utilise plus la 3D procédurale. Le décor de bureau post-apocalyptique est **une image détaillée embarquée dans le HTML**, utilisée directement comme fond de jeu. C'est la méthode retenue pour maintenir à l'écran une qualité d'image proche du concept initial.

## Une énigme complète dans une seule pièce

1. Examiner les papiers au sol et trouver une consigne de maintenance.
2. Manipuler réellement les quatre disjoncteurs du tableau électrique, dans l'ordre indiqué.
3. Rétablir le courant : l'état du panneau et de la pièce change.
4. Ouvrir le tiroir de l'armoire, désormais déverrouillé, pour récupérer une clé.
5. Utiliser la clé sur la porte de sortie.

Le joueur peut également examiner le bureau et la fenêtre, activer la lampe, consulter les objets récupérés, obtenir une piste, couper le son ou recommencer. Les interactions sont persistantes pendant la partie et la manipulation des disjoncteurs propose une vraie combinaison avec remise à zéro en cas d'erreur.

**Commandes :** souris ou toucher l'écran pour examiner, Échap pour fermer une vue rapprochée, M pour activer/désactiver le son. Aucun déplacement 3D, aucune collision de géométrie.

## Architecture

- `index.html` : démo complète et autonome avec l'image WebP intégrée, CSS, interface et logique JS (sans dépendance externe).
- `pointclick.html` : accès direct alternatif à la même démo.
- `cour.html` : ancienne cour industrielle 3D.
- `salon.html` : ancien salon procédural en vue subjective.
- `rue.html` : ancienne rue 3D.

Ce prototype démontre la distinction entre **décor illustré très soigné** et **gameplay interactif**, sans essayer de transformer une image photoréaliste en modèles 3D rudimentaires.

## Limites de cette étude

Les vues rapprochées des mécanismes sont ici dessinées et animées avec HTML/CSS. Un prochain niveau pourrait bénéficier d'illustrations supplémentaires pour les gros plans et de courtes transitions visuelles entre lieux. Le décor reste un point de vue fixe et non une scène entièrement traversable. L'utilisateur conserve néanmoins la possibilité de jouer réellement et de résoudre l'énigme.

Les interactions de bout en bout ont été testées dans un navigateur Chromium local : récupération de la note, séquence des disjoncteurs, ouverture du tiroir, clé et ouverture de la porte.

© Valsane Studio.
