# Handoff — « La copie annotée » (professeur)

*Écrit le 2026-09-03, sur demande de Louis. Éprouvé AVANT d'être suivi (`AGENTS.md`) : chaque
prémisse ci-dessous est un chiffre lu en production le 03/09 par PostgREST, pas une intuition.*

## 0. Ce que Louis a demandé

> « À gauche, la copie de l'élève ; à droite, les commentaires liés à la copie par des flèches et
> des surlignages. Pour chaque compétence, la liste des observables dans les mots de l'élève, avec
> ce qui ne va pas. […] Cette justification ne va pas parce qu'elle échoue à tel test. »

Plus : dans la page de passation, **une liste de noms**, et un clic ouvre la page de la copie ;
les champs de commentaire y suivent. **Flag à OFF**, accès limité pour le moment. L'élève : plus tard.

## 1. Les prémisses, mesurées (production, 03/09, 128 copies · 281 squelettes · 86 retours)

| Champ | Mesure |
|---|---|
| Longueur d'une copie v1 | **médiane 564 caractères (88 mots)**, p90 1 457, max 2 298 |
| Compétences mesurées par dépôt | médiane 3, max 4 |
| Citations P1 d'Expression (`faits[].citations`, `reussites`) | **médiane 9 par copie, max 32** · longueur médiane 25 car., max 403 · **2 % introuvables** |
| Citations P1 de Structure (idée directrice, jointures, annonce) | médiane 4, max 21 · **longueur médiane 90 car., p90 203, max 394** · 1 % introuvables |
| Citations P1 d'Argumentation (garant, liaison) | médiane 2, max 6 · longueur médiane 17 · **12 % introuvables** |
| Citations P1 de Synthèse (unités, apports, rapports) | médiane 12, max 18 · longueur médiane 46 · 7 % introuvables |
| Citations P1 de Questionnement | 0 à 2 · 30 % introuvables (3 sur 10) |
| Surlignages retrouvés par dépôt, hors Expression | médiane 7, p90 16, max 24 |
| Chevauchements entre compétences | **16 %** des surlignages en croisent un d'une autre compétence |
| Points du retour | 4 par retour (max 5), tous ancrés · **texte d'un point : médiane 407 car., p90 575** |
| Squelettes sans jugement P2 | 17 sur 281 (P1 seul, P2 refusé) |

**Ce que ces chiffres tranchent :**

- **Une copie tient sur un écran** (564 car.), la colonne de gauche n'a pas besoin de pagination.
  Le p90 (1 457 car.) fait une colonne d'environ trois écrans sur téléphone : la copie garde sa
  position naturelle, le panneau se colle dessous.
- **Jusqu'à ~40 surlignages sur une copie** (9 Expression + 7 autres en médiane ; 32 + 24 au
  pire). **Quarante flèches sont illisibles** : une seule flèche, celle de l'annotation ACTIVE ;
  les autres sont des surlignages numérotés. C'est la décision de structure.
- **Les surlignages de Structure sont des PHRASES** (90 car. en médiane, jusqu'à 394) : ils
  couvrent les mots courts d'Expression. Donc **couches** : la teinte de fond suit la compétence du
  surlignage le plus long, un filet bas marque qu'une seconde compétence est dessous, et un clic
  sur un segment partagé fait défiler les annotations qu'il porte.
- **Un point de retour fait 400 caractères** : la bulle de droite ne peut pas être une infobulle ;
  c'est une carte pleine dans une colonne qui défile.
- **Une citation sur huit en Argumentation ne se retrouve pas** : la liste « non retrouvées » n'est
  pas une case d'erreur, c'est un compartiment normal de chaque compétence.

## 2. La structure de l'écran

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Passation · Elo — « Consigne de l'exercice… » · classe · v1 [vf]       │
│ [Expression E] [Argumentation A] [Structure St] [Retour R]  ← filtres    │
├────────────────────────────────┬─────────────────────────────────────────┤
│ LA COPIE (sticky, défile seule)│ LE PANNEAU (défile)                     │
│                                │ ▸ Expression — lettre C · confiance…    │
│  Les vacances représentent     │   ce qui plafonne · levier              │
│  pour les élèves ce que        │   E1 mot impropre « un échappatoire »   │
│  l'école n'offre pas : un      │      ⤷ rejeté au test « procédé » : …   │
│  [échappatoire]E1 …            │   E2 mot générique « une certaine … »   │
│                                │   Non retrouvées (1)                    │
│                     ╭──────────┼── flèche : UNE seule, vers l'active     │
│  [phrase entière…]St2          │ ▸ Structure — …                         │
│                                │   St1 ¶4 idée directrice « … »          │
│                                │   St2 jointure ¶5 → ¶6 « Pourtant … »   │
│                                │      ⤷ rétrogradée : « le manque cité   │
│                                │        est la reprise de la thèse… »    │
│                                │ ▸ Retour (v1, publié) — R1 … R4         │
├────────────────────────────────┴─────────────────────────────────────────┤
│ Commentaire général · Message de lisibilité reporté (les mêmes qu'avant)  │
└──────────────────────────────────────────────────────────────────────────┘
```

- **≥ 1024 px** : deux colonnes égales ; la copie est `sticky` et défile dans sa hauteur ; la
  flèche est un trait SVG entre le surlignage actif et sa carte, redessiné au défilement.
- **< 1024 px** (tablette et téléphone) : une colonne, la copie d'abord, le panneau dessous ;
  toucher un surlignage fait défiler jusqu'à la carte et la met en relief, sans flèche ; un bouton
  « ↑ la copie » ramène en haut. *(Le handoff prévoyait deux colonnes de 768 à 1023 px ; à
  l'implémentation, la copie d'Elo — 1 561 caractères, 38 annotations d'Expression — ne laissait
  pas de place lisible à une seconde colonne de 380 px. Tranché : une colonne sous 1024.)*

## 3. Le modèle : une ANNOTATION

Une annotation = `{ numéro, compétence, source (retour | P1 | P2), titre, citation, texte,
verdicts[], intervalles[] }`. Elle vient de trois endroits, sans rien regénérer :

| Source | Table | Ce qui devient une annotation | Ce qui devient un verdict attaché |
|---|---|---|---|
| Retour | `exercices_retours.texte` (ou `texte_edite_par_prof`) | chaque point, sa citation, sa nature | — |
| P1 | `exercices_squelettes.artefact_extraction` | chaque champ déclaré verbatim (`CHAMPS_VERBATIM_P1` + les faits d'Expression) | — |
| P2 | `exercices_squelettes.artefact_jugement` | l'en-tête de la compétence : lettre, confiance, ce qui plafonne, levier | `crible.requalifications[]` (Argumentation, par `unite`), `crible.retrogradations[]` (Structure, par `entre`), `etiquettes_rejetees[]` / `reussites_rejetees[]` (Expression, par phrase + citation), `crible[]` (Synthèse, par `terme_cite`) |

Le placement dans la copie passe par `retrouverCitation` (`utils/chaine/citation-approchee.ts`),
**le même code que la chaîne** : ce que le retour a réparé se retrouve ici, ce qu'il a écarté ne
se surligne pas. Une annotation introuvable va dans « non retrouvées », jamais « à côté ».

**Numérotation** : une lettre par compétence (E, A, St, C, Sy, Q, R pour le retour) et un rang
dans l'ordre du texte. Le numéro est en exposant au début du surlignage et en tête de la carte.

**Couleurs** : six jetons neufs dans `globals.css` (`--comp-<compétence>` et sa teinte) ; le retour
prend le pigment du module. Aucun hex hors de `globals.css`.

## 4. Ce que cet écran NE fait PAS (et où c'est noté)

- **L'élève ne le voit pas** : flag `copie_annotee_actif` à OFF, page professeur seulement.
- **Les citations du `texte_support` ne se surlignent pas** : le texte d'auteur n'est pas à l'écran.
  Elles s'affichent dans la carte, en italique, étiquetées « le texte dit ».
- **Pas d'édition du retour ici** : elle reste dans la passation (édition point par point) ; la
  page de la copie lit, commente, et renvoie.
- **La vf** s'affiche par un second onglet quand des squelettes vf existent (0 en prod au 03/09).

## 5. Arbitrages pris sans demander (à contester)

1. **Une seule flèche**, pour l'annotation active — les 40 autres sont numérotées. Motif : §1.
2. **La copie est celle que la chaîne a lue** (`texte_v1` d'abord, `transcription_v1` sinon —
   `utils/chaine/contexte.ts`, `production()`), pas celle de l'écran de passation
   (`transcription ?? texte`). Sinon les offsets tombent à côté sur un élève exempté.
3. **Les champs reformulés de P1 ne se surlignent pas** (`these`, `preuve_offerte`, `objet`,
   `note`) : ils ne sont pas verbatim par contrat (`fidelite-p1.ts`). Ils s'affichent dans la carte.
4. **La liste de la passation devient une liste de noms** quand le flag est ON, avec les cases de
   sélection et les trois boutons de masse conservés ; la copie brute et le retour dépliants
   disparaissent de cette page (ils vivent sur la page de la copie). Flag OFF : rien ne change.
5. **Le professeur voit la page même à OFF ?** Non : à OFF, la page dit « à OFF » et ne charge
   rien — c'est la demande (« limiter l'accès »). L'écart au piège 41 est assumé et écrit.

## 6. Ce que le rendu réel a montré (bac à sable, 03/09, copie d'Elo : 1 561 car., 38 + 8 + 2 annotations)

- 1280 px : deux colonnes, la copie `sticky` ; clic sur un surlignage → la carte vient au centre,
  la flèche pointillée se trace du passage à la carte ; les numéros en exposant restent lisibles
  à 38 surlignages d'Expression sur une copie.
- 768 px et 375 px : une colonne, aucun débordement horizontal (`scrollWidth` 375 = `innerWidth`).
- La page de passation, flag à ON : sept noms, chacun un lien vers sa copie ; les cases et les
  trois boutons de masse sont restés.
- Flag à OFF (colonne absente ou `false`) : la page de la copie dit « à OFF », la passation est
  inchangée — vérifié par le code (`lireLaPorteCopieAnnotee` rend `false` sur erreur).
