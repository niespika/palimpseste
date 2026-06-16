# SPEC — Lot 0 : Bugs & masquages (Palimpseste)

> Premier lot du plan global (`PLAN_Palimpseste_modifications.md`, à garder dans le dossier pour le contexte et les principes transversaux). Lot **indépendant** : aucune dépendance au refactor du modèle « classe ».
>
> Méthode : pour chaque point, **diagnostiquer la cause réelle dans le code existant**, corriger, puis vérifier le critère d'acceptation. **Ne pas élargir la portée** au-delà de ces quatre points ; toute autre amélioration repérée → la signaler, pas l'implémenter.

---

## 0.1 — Flashcards : le cloze ne masque pas la réponse *(Quazian, élève)*

- **Symptôme :** les éléments à deviner, entourés de parenthèses dans le contenu de la carte, restent visibles — la réponse s'affiche directement sur la carte au lieu d'être masquée.
- **Attendu :** au recto, l'élément cloze est masqué (placeholder type « … » ou case grisée) ; il n'apparaît qu'au retournement / à la révélation.
- **Pistes :** vérifier le parsing du marqueur de cloze (les parenthèses) et le rendu recto / verso.
- **Acceptation :** sur une carte contenant un cloze, l'élément à deviner est invisible au recto et n'apparaît qu'après révélation.

## 0.2 — Flashcards : compteur de progression faux *(Quazian, élève)*

- **Symptôme :** pendant la révision, le curseur de progression ne bouge pas, le compteur « cartes faites » reste bloqué à 1, et seul le « à faire » diminue.
- **Attendu :** une barre qui se remplit à mesure qu'on avance ; « cartes faites » qui s'incrémente à chaque carte ; total fixe pour toute la session.
- **Pistes :** l'état qui pilote l'index courant et les compteurs — probable confusion entre « restantes » et « faites », ou index non incrémenté.
- **Acceptation :** sur une session de N cartes, après k cartes : barre à k/N, « faites » = k, total = N.

## 0.3 — Quizz invisible pour l'élève assigné *(Quazian, élève)* — **diagnostiquer d'abord**

- **Symptôme :** quand le prof lance un quizz, un élève d'une classe pourtant assignée ne le voit pas.
- **Avant de corriger :** déterminer la cause parmi deux hypothèses — (a) simple bug de permission / requête côté élève ; (b) symptôme d'un scoping classe défaillant (le lien élève ↔ classe ↔ quizz). **Rapporter la cause trouvée avant d'implémenter.** Si c'est (b), ne pas bricoler ici : le noter, ce sera traité dans le Lot 1 (modèle « classe »).
- **Acceptation :** un élève membre d'une classe assignée à un quizz lancé voit ce quizz dans sa vue.

## 0.4 — Masquer la tuile Scriptorium côté élève *(Scriptorium, élève)*

- **Symptôme :** la tuile Scriptorium apparaît dans la vue élève.
- **Attendu :** la masquer côté élève. Prévoir un **interrupteur simple** (constante / flag) pour la réafficher plus tard si du contenu est partagé (ex. documentaires), sans rouvrir le code en profondeur.
- **Acceptation :** aucun élève ne voit la tuile Scriptorium ; la réactivation future tient en un changement de flag.

---

## Vérification du lot

Les quatre points passent leurs critères d'acceptation. Pour 0.3, la cause a été **rapportée** et, si elle relève du modèle de données, **renvoyée au Lot 1** plutôt que corrigée à la va-vite.
