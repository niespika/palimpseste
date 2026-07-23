# design_handoff_aletheia_retour_final

Dossier de handoff pour le retravail de l'**écran « retour final »** d'Aletheia côté élève
(état `FEEDBACK2_READY`) : passage d'un affichage empilé à une **divulgation progressive**
(une partie à la fois, cochée avant la suivante, parties lues repliées, synthèse en dernier
portant le bouton de clôture).

## Contenu
- `HANDOFF_aletheia_retour_final.md` — instructions de mise en œuvre (fichiers à toucher,
  mode séquentiel de `ValidationLecture`, ordre des tuiles, jetons, persistance, checklist).
- `Aletheia Retour final Rendu Charte.dc.html` — **maquette cible** (storyboard ordi + mobile).
- `support.js` — runtime requis pour ouvrir la maquette `.dc.html` (doit rester à côté du fichier).
- `sceaux/aletheia.png` — sceau du module (référencé en `sceaux/aletheia.png` par la maquette).

## Ouvrir la maquette
Ouvrir `Aletheia Retour final Rendu Charte.dc.html` dans un navigateur (les chemins relatifs
`./support.js` et `sceaux/aletheia.png` doivent être préservés). Le document est en mode
canvas : molette/glisser pour naviguer entre les états.

## Portée
**Présentation seulement.** Aucune refonte de la machine à états, des retours IA, de l'action
de validation (`validerLectureRetourVf` → `retour_vf_lu_at` → `DONE`) ni du verrou transversal
des retours non lus. Le mode séquentiel de `ValidationLecture` est **opt-in** : Fragments et
Codex, qui partagent le composant, restent inchangés.
