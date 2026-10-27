# ZONE ZÉRO — Exploration immersive 04

**Démo jouable :** https://valsane-studio.github.io/Zombies/

Cette version du projet Valsane Studio explore une **caméra derrière le personnage, légèrement surélevée**, dans une rue post-apocalyptique. Le personnage est seul, en tee-shirt et pantalon, avec son pistolet. Le jeu reste un prototype d'exploration en temps réel : pas de zombies, pas de farming, pas d'inventaire ni de missions obligatoires.

## Ce qui change

- **Caméra de troisième personne :** à environ six mètres derrière le personnage à l'extérieur, plus proche à l'intérieur. Les pivots, les changements de hauteur et le suivi sont amortis pour accompagner le survivant plutôt que surveiller un plateau.
- **Rotation libre et recentrage :** la caméra suit l'orientation du personnage en déplacement, mais peut être orientée indépendamment avec Alt + glisser ou le bouton central ; la molette permet le zoom. Une gestion simple des obstacles évite qu'une façade passe systématiquement devant le regard.
- **Café Nord :** l'unique immeuble visitable est conservé (hall, porte condamnée, escalier, appartement et toit), avec adaptation automatique de la caméra aux étages.
- **La fenêtre éclairée :** une lumière vacille à l'étage, visible depuis la rue. Le joueur peut décider librement de s'approcher. Des indices sonores et un carnet permettent de découvrir une petite trace de vie. Ce n'est pas une quête ni une séquence dirigée.
- **Ambiance sonore :** vent discret, pas, portes et grincements synthétisés localement avec Web Audio. Le son ne se lance qu'après interaction, et peut être coupé avec le bouton « SON ».
- **Immersion visuelle :** une interface allégée qui laisse davantage de place au décor, arbres, herbes, mousse et immeubles délabrés.

## Commandes

| Action | Commande |
|---|---|
| Marcher | Clic gauche sur le sol |
| Courir | Double-clic ou Maj + clic gauche |
| Interagir avec porte, escalier ou indice | Clic gauche sur son étiquette |
| Viser et tirer | Maintenir le clic droit |
| Recharger | R |
| Faire pivoter la caméra | Alt + glisser / bouton central + glisser / flèches gauche-droite |
| Ajuster la hauteur de vue | Flèches haut-bas |
| Zoom | Molette |
| Recentrer | C |
| Annuler un déplacement | Échap |
| Masquer l'interface | H |
| Couper / activer les sons | Bouton SON |

Le déplacement au clic est volontairement conservé pour respecter les préférences établies. La caméra est maintenant derrière le survivant, et non en plongée isométrique.

## Fichiers principaux

- \`street-demo.js\` : jeu, caméra, événements d'exploration, sons, personnage.
- \`immersive-camera.js\` : caméra 3e personne, suivi, rotation manuelle, rapprochement intérieur et obstacles.
- \`immersive-ambience.js\` : vent, pas, métal, portes en synthèse Web Audio.
- \`visit-building.js\` : Café Nord, fenêtre éclairée, intérieur, escaliers, carnet, toit.
- \`click-navigation.js\` : navigation A*, interactions et visée.
- \`civilian.js\` : petit personnage civil, marche et pistolet dans la main.
- \`street-world.js\`, \`overgrowth.js\` : rue et végétation.
- \`index.html\`, \`street.css\` : interface.

Les anciens prototypes (jeu de plateau et vue du dessus) demeurent dans le dépôt, mais ne sont plus actifs sur la page d'accueil.

## Limites actuelles

Le jeu n'est **pas encore photoréaliste**. Les décors, les déplacements et les animations sont largement procéduraux ; une expérience vraiment convaincante exigera des modèles et animations plus aboutis, des matériaux de qualité et une amélioration de l'architecture des intérieurs. La montée d'escalier et le franchissement de fenêtre restent des transitions simplifiées.

Le code est vérifié en syntaxe, les modules principaux en tests simulés et la gestion de la caméra est testée en dehors du navigateur. La démo **n'a pas été validée dans un navigateur WebGL réel**, ni sa dernière mise en ligne GitHub Pages.

© Valsane Studio. Ressources externes : [Three.js](https://threejs.org/) et textures [Poly Haven](https://polyhaven.com/) (CC0).
