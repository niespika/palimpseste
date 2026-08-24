# `utils/routeur/` — C4-L2, le moteur qui remplit la semaine

> **Ce dossier porte les RÈGLES, jamais les écrans.** Les quatre écrans du
> professeur vivent sous `app/prof/routeur/` et au plan d'évaluation ; ils
> lisent d'ici, ils ne recalculent rien.

## La règle de ce dossier : tout est PUR

**Les RÈGLES sont pures — pas le dossier entier, et la nuance compte.** Aucun fichier de
règle n'importe `server-only` ni ne touche la base ; **deux fichiers font exception, et ils
ne portent aucune règle** : `donnees.ts` *(qui importe bien `server-only`, l. 21)* et
`acces.ts` *(la garde de rôle et la lecture de `routeur_actif`)*.
Le motif est mécanique : `npm test` ne résout pas `server-only`, et un module qui
l'importe devient **inexécutable sous test**. Or les règles du routeur sont
exactement ce qu'il faut éprouver.

D'où le partage, le même que celui de `utils/chaine/` :

| | Ce qu'il fait |
|---|---|
| `*.ts` de ce dossier | **calculent**, sur des données qu'on leur passe |
| `donnees.ts`, `acces.ts` | **LISENT** — les deux seuls de ce dossier qui parlent à la base, et **aucun des deux n'écrit** |

⚠️ **RIEN DANS CE DOSSIER N'ÉCRIT — c'est un état vérifié, pas une intention.** Aucun `insert`,
`update`, `upsert` ni `rpc` dans tout `utils/routeur/` — vérifié le 23/08 puis **re-vérifié le
24/08**, `donnees.ts` et `acces.ts` compris. *Cette ligne annonçait autrefois un
`moteur.ts` « qui lit et écrit » : **ce fichier n'a jamais existé** — aucun commit de l'historique
ne le porte, et c'était sa seule occurrence dans le dépôt —, et `donnees.ts` n'écrit pas davantage.
L'écrivain du routeur n'était pas absent de ce dossier par oubli : **il n'était écrit nulle part.**
Constat de C4-L11, déposé à `C4L2-15` ; corrigé ici le 23/08.*

⭐⭐ **L'ÉCRIVAIN EXISTE DEPUIS LE 24/08, ET IL VIT AILLEURS — `utils/moteur/`.** `C4-L12` a gardé
la phrase ci-dessus vraie exactement comme `C4-L13` l'avait fait pour l'assiduité : le dossier des
règles n'écrit toujours rien, et le lot qui les fait tourner a son propre domicile.

| Fichier de `utils/moteur/` | Ce qu'il fait |
|---|---|
| `vivier.ts` | **PUR** — la couche 4 : parcours, cours vu, non-spoiler, et `candidatsPour` |
| `decision.ts` | **PUR** — la forme d'une ligne de `routeur_decisions`, les deux sondes, le tirage |
| `minutes.ts` | **PUR** — le partage de la ligne d'assiduité avec `C4-L13`, et sa garde symétrique |
| `etat.ts` | **PUR** — ce que porte `competences_niveaux.lettre`, le cold start, les deux clés |
| `vivier-serveur.ts` · `cycle-serveur.ts` · `etat-serveur.ts` · `calendrier-serveur.ts` | **LISENT ET ÉCRIVENT** |

**Il se greffe sur le déclencheur de `C4-L13`** — `/api/assiduite/hebdo` — et **n'ouvre aucun cron**.
La chaîne froide, elle, appelle `ecrireLEtatApresMesure()` une fois ses mesures écrites : c'est là
que « tu écris des MESURES ; le moteur en fera des lettres » se réalise.

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
  règle, sa *consommation* ne se construit pas ;
- ⭐ **il ne FAIT TOURNER aucune de ces règles, et n'en persiste aucune sortie —
  c'est `C4-L12`**, né le 23/08 *(`07-` §2, v2.42)* et **joué le 24/08**. Le vivier
  que `poserLaSemaine` interroge, l'orchestrateur par élève, l'écriture de
  `routeur_decisions` et des dépôts en `origine = 'routeur'`, et **l'écriture de la
  lettre** — que la chaîne délègue nommément ici *(`utils/chaine/mesures.ts:10`)* —
  vivent désormais à **`utils/moteur/`**, jamais ici ;
- **les compteurs d'assiduité ne s'écrivent pas ici non plus — c'est `C4-L13`** :
  `assiduite.ts` calcule, et l'écrivain vit **ailleurs, à `utils/assiduite/`** —
  `collecte.ts` *(pur : la jonction dépôts → `(assignés, terminés)`)* et
  `collecte-serveur.ts` *(`poserLaSemaineDAssiduite()`, le seul écrivain
  d'`assiduite_hebdo` du dépôt, déclenché par `/api/assiduite/hebdo`)`*.
  ⭐ **C'est délibéré, et c'est ce qui garde vraie l'affirmation ci-dessus** :
  ce dossier n'écrit toujours rien. *Constat de C4-L13, 24/08.*
  ⚠️ Le nouveau dossier **importe d'ici sans rien y ajouter** : `estRendu`,
  `entreAuDenominateur`, `semaineFaite` et `retraitCompteDansLaSemaine` restent
  les seules règles, et elles ne se recopient nulle part.

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

⛔⛔ **CETTE SECTION AFFIRMAIT LE CONTRAIRE, ET ELLE ÉTAIT PÉRIMÉE — corrigée le
24/08 par `C4-L12`.** Elle disait que « `MANIFESTE_INSTRUMENTS` porte `ouverte: false`
sur les six », et en concluait que **l'escalade ne pouvait pas se prouver sur données
réelles**. ⭐ **C'est faux depuis `C4-L10`** : les **six** compétences portent
`"ouverte": true` dans `utils/chaine/derive/MANIFESTE.ts` — un fichier **DÉRIVÉ**,
sortie de `scripts/derive-instruments.py --ecris`, qui ne s'édite jamais à la main.
*L'obstacle que cette section nommait est tombé ; l'écrire encore, c'était décourager
la seule recette qui vaille.*

**Ce qui reste vrai, et qui n'est pas la même chose** : le taux de réussite d'un
observable se lit contre le **seuil de la fiche**, et une compétence dont
l'instrument n'est pas importé ou dont la chaîne n'est pas branchée reste écartée
— `etatCompetence()` en sert le motif, et le bilan du moteur le RECOPIE plutôt que
de se taire. C'est **la clause granulaire du `07-` §2** : une fiche qui manque
bloque *sa* compétence, pas le lot.

**Ce qui manque désormais pour prouver l'escalade sur données réelles n'est plus un
instrument, c'est une FENÊTRE D'ÉVIDENCE REMPLIE** — quatre mesures d'une même
compétence chez un même élève, au segment 3, hors `profil_provisoire`. C'est la
condition de reprise nommée de `C4L2-11`.
