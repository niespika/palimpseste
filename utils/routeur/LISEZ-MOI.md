# `utils/routeur/` — C4-L2, le moteur qui remplit la semaine

> **Ce dossier porte les RÈGLES, jamais les écrans.** Les quatre écrans du
> professeur vivent sous `app/prof/routeur/` et au plan d'évaluation ; ils
> lisent d'ici, ils ne recalculent rien.

## La règle de ce dossier : tout est PUR

Aucun fichier de ce dossier n'importe `server-only` et aucun ne touche la base.
Le motif est mécanique : `npm test` ne résout pas `server-only`, et un module qui
l'importe devient **inexécutable sous test**. Or les règles du routeur sont
exactement ce qu'il faut éprouver.

D'où le partage, le même que celui de `utils/chaine/` :

| | Ce qu'il fait |
|---|---|
| `*.ts` de ce dossier | **calculent**, sur des données qu'on leur passe |
| `donnees.ts`, `moteur.ts` | **lisent et écrivent** — eux seuls parlent à la base |

⚠️ **Le glob de `npm test` est `utils/**/*.test.ts` et rien d'autre** : une règle
posée sous `app/` ne serait jamais éprouvée, sans qu'aucun message ne le dise.

## Où vit quoi

| Fichier | La section qui fait foi |
|---|---|
| `types.ts` | le vocabulaire — paliers, crans, gestes, degrés, parcours |
| `config.ts` | **les chiffres arrêtés**, chacun citant sa source. Un domicile, et un seul |
| `fiche-observables.ts` | **§8.3** — quels observables sont **requis**, LU À LA FICHE |
| `mesure.ts` | la forme d'une ligne de `competences_mesures`, et les trois lectures que toutes les règles refont |
| `segments.ts` | **§4, couche 1** — les cinq segments, dérivés du Calendrier |
| `budget.ts` | **§4, couche 0** — le budget de l'ÉLÈVE, et le piège de la vacuité |
| `profil.ts` | **§3** — signal de ciblage, fenêtre d'évidence, historique des cibles |
| `observables.ts` | **§8.2 et §8.3** — acquisition, stagnation, les deux préconditions |
| `lettres.ts` | **§9** — montée, descente, plafonds, clôture de la calibration |
| `escalade.ts` | **§8.4 à §8.7** — N1, N2, N3, compteurs, désescalade, registres |
| `montee.ts` | **§8.8** — M-a à M-e, le sens ascendant |
| `proportions.ts` | **§7** — le contrôle de trajectoire, qui gouverne les trois tables |
| `ciblage.ts` | **§6** — la calibration, R0 à R5, la branche d'échec, PA2 et PA3 |
| `sondes.ts` | **§8.9** — qui sonder, et dans quel ordre |
| `semaine.ts` | **§5** — les trois phases, PB1-PB6 et PC1-PC5 |
| `assiduite.ts` | **`06-` §5** — les deux agrégats, la vue fine, le retrait |

## Ce que ce lot NE fait pas, et où ça vit

- **il n'appelle jamais un modèle et n'écrit aucune mesure** — c'est la chaîne,
  C4-L5. On la déclenche par `mettreEnFile(admin, depotId, 'mesure_v1')`, et on
  lui **passe le registre élu** : `traiterDepot(admin, id, 'v1', { registre })` ;
- **il ne fabrique rien** — déposer une fiche, poser un statut de recette,
  concevoir un exercice : C4-L8 ;
- **il n'a pas d'écran d'édition de retour** côté maison : `texte_edite_par_prof`
  reste NULL sur tout formatif de la maison, par conséquence du contrat de
  latence. L'édition appartient au flux de classe, C4-L4 ;
- **la file des dossiers N3 est l'écran de C6-L1** — le moteur d'ouverture et de
  re-signalement, lui, est ici ;
- **le pull et le push sont C6-L3** : ici la *valeur* du budget optionnel se
  règle, sa *consommation* ne se construit pas.

## Trois pièges qui coûtent cher

1. **`competences_correspondance` n'est PAS la liste des observables requis.**
   Les deux ne coïncident pas, et c'est délibéré — l'Expression donne un bloc de
   correspondance à `reussites`, qui n'est pas requis ; la Connaissance en donne
   sept alors qu'aucun des siens ne l'est. Le requis se lit **à la fiche**
   (`fiche-observables.ts`), c'est-à-dire dans `competences_fiches.contenu`.
2. **Le `regime_v1vf` ne se dérive jamais du cran seul** : l'état d'escalade
   entre dans la dérivation (§8.5). Sans lui le delta vaut NULL — et NULL n'est
   pas 0, N2 serait aveugle.
3. **`cible_primaire` reste NULL sur la voie du routeur** (`07-` §1.1) : la cible
   vit à la décision, `routeur_decisions.cible_retenue`. La colonne de l'instance
   sert la voie du professeur.

## Ce qui reste décoché en recette, et pourquoi

**L'escalade ne peut pas se prouver sur données réelles aujourd'hui.** Le taux de
réussite d'un observable se lit contre le **seuil de la fiche**, que
`derive-instruments.py` verse — et les six fiches sont *relues et validées*, pas
*versées et bancées* : `MANIFESTE_INSTRUMENTS` porte `ouverte: false` sur les six.
Sans instrument, `statutDeLaMesure` rend `sans_objet`, le taux vaut `null`, et
« un observable sans taux ne se classe pas ». C'est **la clause granulaire du
`07-` §2** : une fiche seulement déposée bloque *sa* compétence, pas le lot. Les
règles sont écrites et éprouvées ; leur recette attend la première fiche bancée.
