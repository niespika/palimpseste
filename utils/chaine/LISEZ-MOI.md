# `utils/chaine/` — ce que C4-L5 a posé, et ce qui ne s'édite pas

**La chaîne froide par compétence, et son infrastructure.** Aucun écran : le
déroulé de l'élève est C4-L3, l'écran de correction C4-L4, le pilotage C4-L2, la
fabrique C4-L8. Ce lot **mesure ce qu'on lui dépose et écrit ce que les autres
liront**.

| Fichier | Ce que c'est | Pur ? |
|---|---|---|
| `derive/` | ⚠️ **des SORTIES**, jamais des fichiers qu'on édite | — |
| `types.ts` | le vocabulaire partagé ; chaque liste fermée cite sa source | ✓ |
| `instruments.ts` | **la clé qui ouvre chaque slot** — les six, et le Monitoring | ✓ |
| `schema.ts` | la validation stricte du schéma de sortie (`01-` §12) | ✓ |
| `anti-injection.ts` | les entrées délimitées, et le contrôle des citations | ✓ |
| `modele.ts` | le régime de modèle, **débrayable** (`07-` §6) | ✓ |
| `observables.ts` | la **valeur** des observables, et la lecture du verdict | ✓ |
| `distance-contexte.ts` | `distance_contexte`, calculée et jamais jugée | ✓ |
| `retour.ts` | les trois couches, les trois variables, le texte segmenté | ✓ |
| `monitoring-calcul.ts` | la calibration, la lucidité, la porte 2 | ✓ |
| `couts.ts` | plafond, alerte à 70 %, coupure, plafond par dépôt | ✓ |
| `config.ts` | ce qui vit **à la configuration** (environnement) | ✓ |
| `appel.ts` | un appel : caché, journalisé, sans outil, revalidé | serveur |
| `contexte.ts` | ce que la chaîne lit en base avant de partir | serveur |
| `file.ts` | la file, la clé d'idempotence, le **bail** | serveur |
| `mesures.ts` | l'écriture des mesures, les délais, la fenêtre d'évidence | serveur |
| `monitoring.ts` | l'étage du Monitoring, **qui tourne en dernier** | serveur |
| `couts-serveur.ts` | la facture, lue où elle s'écrit | serveur |
| `acces.ts` | l'interrupteur **propre** du lot, et la coupure | serveur |
| `chaine.ts` | l'orchestrateur : quatre temps, deux appels | serveur |

Les fichiers **purs** n'importent jamais `server-only` : ils sont testés sous
`npm test` (patron `utils/cout-usage.ts`).

## Rien de ce que la chaîne exécute ne se tape

Le gabarit du retour vit au `07-Implementation.md` §4, entre ses deux marqueurs ;
le prompt d'extraction du Monitoring et son bloc machine vivent à
`competences/monitoring.md` §7 ; les instruments des six compétences vivent à
leurs fiches. `scripts/derive-instruments.py` les **lit** et les verse dans
`derive/`.

    python3 scripts/derive-instruments.py --resume     # ce qui a été lu
    python3 scripts/derive-instruments.py --ecris      # écrit les dérivés
    python3 scripts/derive-instruments.py --verifie    # IDENTIQUE, ou DIVERGE

`--verifie` **ne modifie rien**. Il dit **DIVERGE** si un dérivé a été édité de
son côté, et **SOURCE MOUVANTE** si un marqueur a disparu de la source — *cite ou
refuse* : le script s'arrête au lieu de deviner. **S'il diverge, rejouer
`--ecris`** ; jamais corriger un dérivé à la main.

## La clause granulaire, et où elle vit

> « Une compétence dont la fiche n'a pas passé sa porte reste **hors de la
> chaîne** — pas d'instrument dérivé, pas de mesure. »

Elle est appliquée **à la dérivation, et nulle part ailleurs** : une fiche qui
n'est pas *versée et bancée* ne produit aucun fichier dans `derive/competences/`.
Au 21/08/2026, **c'est le cas des six** ; `competences/monitoring.md` est à son
**statut plafond déclaré** — pas de banc, « versé et bancé » ne s'applique pas —
et son étage est construit en entier.

**Ouvrir un slot**, le jour où une fiche passe sa porte, tient en trois gestes :

1. `python3 scripts/derive-instruments.py --ecris` — le dérivé apparaît ;
2. importer `INSTRUMENT_<NOM>` dans `instruments.ts` et le poser dans `INSTRUMENTS` ;
3. écrire son **branchement** dans `BRANCHEMENTS` — quel prompt est P1, lequel
   est P2, ce que Code1 prépare, ce que Code2 agrège. **Cela ne se devine pas
   depuis les titres des blocs** : « le détail de chaque chaîne fait foi à sa
   fiche » (`03-` §1), et la fiche est alors lisible.

`verifierCoherence()` refuse un slot branché sans dérivé, et l'inverse ; la route
ne part pas si elle rend quelque chose.

## La recette

    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
         --import ./scripts/register-calibration-resolver.mjs \
         scripts/recette/chaine-c4l5.mjs [--sans-appel]

Elle éprouve **en base** ce qu'aucun test pur ne prouve : la file, le bail, une
**expiration provoquée**, une reprise qui n'écrit pas de seconde mesure, un
passage réel de la chaîne (l'étage du Monitoring, seul instrument ouvert), le
journal par appel avec sa `phase`, et la **coupure automatique** qui laisse les
dépôts en file. `--sans-appel` saute la partie qui dépense.
