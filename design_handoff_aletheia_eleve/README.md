# design_handoff_aletheia_eleve

Dossier de handoff pour la mise à niveau du module **Aletheia côté élève** : remise en valeur
des **sceaux** (agrandis + ajoutés là où ils manquaient), **revue d'une semaine terminée**
repensée (d'une pile de 4 blocs égaux à une archive hiérarchisée — synthèse à relire,
avant/après V1↔VF, détail replié), et **planning** plus lisible (4 points d'avancement par
semaine + barre globale). Aucune refonte fonctionnelle.

## Contenu
- `HANDOFF_aletheia_eleve.md` — instructions de mise en œuvre (4 chantiers : sceaux, planning,
  revue d'une semaine `DONE`, capstone ; fichiers à toucher, jetons de charte, responsive, checklist).
- `Aletheia - Parcours élève.dc.html` — **maquette cible** (tous les écrans élève : planning,
  les 6 états de la semaine, capstone, états limites — ordi + mobile).
- `support.js` — runtime requis pour ouvrir la maquette `.dc.html` (doit rester à côté du fichier).
- `sceaux/aletheia.png` — sceau du module (référencé en `sceaux/aletheia.png` par la maquette).

## Ouvrir la maquette
Ouvrir `Aletheia - Parcours élève.dc.html` dans un navigateur (les chemins relatifs
`./support.js` et `sceaux/aletheia.png` doivent être préservés). Le document est en mode
canvas : molette/glisser pour naviguer entre les écrans.

## Portée
**Présentation seulement.** La machine à états (`DRAFT → V1_SUBMITTED → FEEDBACK1_READY →
VF_SUBMITTED → FEEDBACK2_READY → DONE`), les retours IA, l'atelier deux-colonnes, le capstone
et le déblocage séquentiel restent **inchangés**. On retouche l'agencement, la hiérarchie de
lecture et la présence des sceaux — via les composants et jetons existants
(`Pastille`, `VueRetours`, `AtelierDeuxColonnes`, `font-*`, `bg-pigment`…), sans couleur ni
police en dur.
</content>
