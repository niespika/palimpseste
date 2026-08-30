# Handoff — Codex · onglet **Exercices** (côté élève)

> **Périmètre : présentation seulement.** Aucune Server Action, aucun contrat de
> données, aucune règle de doctrine ne change. Les six temps, l'ordre
> « se juger avant le retour », l'absence de note/lettre/pourcentage, le secret
> de `indexAttendue`, les 44 px de cible tactile : tout cela reste tel quel.
> Ce lot refait **l'écran d'accueil de l'onglet** et **le déroulé d'un exercice**,
> qui empilaient tout dans une colonne unique.

Fichiers de référence (à ouvrir côte à côte) :

- `Codex Exercices (élève) - Wireframes.dc.html` — structures, tours 1 et 2.
- `Codex Exercices (élève) - Rendu charte.dc.html` — les 7 écrans à l'échelle
  réelle (ordinateur/tablette 1040, téléphone 390). **C'est la référence de
  couleurs, de tailles et de libellés.**

---

## 1. Les fichiers concernés

| Écran | Route / composant | Ce qui change |
|---|---|---|
| **Accueil de l'onglet** | `app/eleve/modules/codex/page.tsx` | trois groupes, échéances, action par ligne |
| **Déroulé d'un exercice** | `components/deroule/EcranDeroule.tsx` (+ `app/deroule/PageDuDeroule.tsx`) | plan de travail deux colonnes, temps passés repliés |
| **Se juger** | `components/deroule/SeJuger.tsx` | devient un **écran propre** (plus une section empilée) |
| **Champ de rédaction** | `components/deroule/ChampDeRedaction.tsx` | occupe la colonne de droite, pleine hauteur |
| **Crédence / choix** | `components/deroule/CredenceSaisie.tsx` | prend la place de l'écriture quand l'exercice est un choix |
| **Désignation** | `components/deroule/DesignationDansLeMateriau.tsx` | la matière passe devant ; état « passage surligné » + « Effacer » |
| **Retours** | `components/deroule/RetourSegmente.tsx` | côte à côte avec la v1 (texte), ou consigne à droite (choix) |
| Onglets du module | `components/nav/EnTeteSite.tsx`, `components/nav/SousNavModuleMobile.tsx`, `components/nav/configModules.ts` | **inchangés** — repris tels quels dans la maquette |

---

## 2. Jetons de couleur (tous existants, aucun hex nouveau sauf le bouton)

Pigment du module posé par `data-module="codex"` (`app/globals.css`) :

| Rôle | Jeton | Valeur |
|---|---|---|
| Pigment (identité, temps courant, filet d'onglet) | `--pigment` | `#2E4A3C` |
| Teinte du pigment (temps faits, sélection élève) | `--pigment-teinte` | `#DCE6DF` |
| Fond de module | `--fond-module` | `#F0EADE` |
| Cartes | `--surface` | `#FBF8F1` |
| Matériau / texte d'auteur | `--parchemin-fonce` | `#ECE4D6` |
| Bordure | `--bordure` | `#E4DBC9` |
| Encre / encre douce / tertiaire | `--encre` / `--encre-douce` / `--muet` | `#221C16` / `#5A4632` / `#8A6F4E` |
| Réussi | `--ok` / `--ok-teinte` | `#5B6E4A` / `#E4E8D8` |
| Échéance, à reprendre | `--attention` / `--attention-teinte` | `#9A6A2E` / `#EFE4CF` |
| Liseré Codex (filet sous l'en-tête) | `--liseret` | `#6E2A2C` |
| Onglets (config existante) | `ongletActifFond` / `ongletActifTexte` / `ongletInactif` | `#D0DED5` / `#2E4A3C` / `#56685E` |

**Bouton d'action — validé** : vert Codex **estompé**, conformément à la
préférence projet (les boutons ne sont pas des aplats saturés) :

```
--bouton: #5F7365;   texte: #F0F3EE
```

Bouton secondaire : fond `#FBF8F1`, bordure `#DFD4BE`, texte `#4A3A28`.

> ⚠️ **Ne pas utiliser** `#9A836A` ni `#A8906A` (gris inventés, sous AA) :
> tout tertiaire est `--muet #8A6F4E`, et les mentions d'état
> (« brouillon enregistré · 14:02 ») sont en `--encre-douce #5A4632`.

**Deux surlignages, jamais confondus :**

- **passage choisi par le professeur** (texte d'auteur, matériau servi) :
  fond `#EFE4CF`, filet bas `#C9A96A` ;
- **sélection de l'élève** (désignation) : fond `#DCE6DF`, filet bas 2px
  `#2E4A3C`.

**Polices** (déjà en place) : Cinzel = sur-titres en petites capitales ·
Cormorant Garamond = titres d'écran · EB Garamond = corps, consignes, textes
d'auteur, réponses · Alegreya Sans = boutons, pastilles, onglets, horodatages.

---

## 3. Écran 1 — l'accueil de l'onglet (`1a`)

`app/eleve/modules/codex/page.tsx`. La liste plate devient **trois groupes**,
dans cet ordre, chacun titré en Cinzel avec son compte :

1. **À faire · n** — le plus proche en premier. Ligne = pastille de module +
   titre (EB Garamond 19) + méta (compétence · forme · durée) + **échéance** +
   **une action** (« Commencer » plein, « Reprendre » secondaire). La première
   ligne porte un `border-left: 3px solid var(--pigment)`.
2. **En attente de ton retour · n** — carte en retrait (`#F7F2E8`). Deux états
   à **ne pas confondre** :
   - *retour en préparation* → pastille bleutée, **aucune action** ;
   - *retour reçu, version finale due* → pastille `attention` « à reprendre » +
     bouton « Ouvrir ».
3. **Terminés · n** — replié par défaut ; déplié, grille de 3 cartes sobres
   (titre + date), opacité `.72`.

Échéances : pastille `attention` (`#EFE4CF`/`#8A5A22`) si proche, sinon filet
neutre sur fond blanc.

⛔ **Rien d'autre** : pas de barre de progression, pas de compteur de complétion,
pas d'agrégat — « un onglet qui range des exercices n'est pas un endroit où l'on
découvre son niveau ».

**Vide** : les deux causes existantes (porte fermée / rien à faire) gardent
leurs deux textes actuels, dans une carte centrée.

**Téléphone** : mêmes groupes, une carte par exercice avec l'action en pleine
largeur (48 px), onglets du module **centrés**.

---

## 4. Écran 2 — le déroulé : un plan de travail, pas une pile

`components/deroule/EcranDeroule.tsx`. Structure commune à tous les exercices :

- **Barre de contenu** : « ← Exercices » · titre de l'exercice (Cormorant 23) ·
  durée indicative · échéance.
- **Fil des six temps** (bandeau `#F7F2E8`) : fait = `#DCE6DF` avec ✓ ·
  courant = plein `#2E4A3C` · à venir = filet `#E4DBC9`, texte `--muet`.
  À droite, l'état de sauvegarde ou l'échéance de la version finale.
  Sur une paire ou un exercice à jugement algorithmique, le fil n'affiche que
  les temps réellement servis (4, pas 6).
- **Deux colonnes** : à gauche **la matière**, à droite **le travail**.
  La colonne gauche défile seule ; les aides (`De quoi t'aider`,
  `Un exemple, sur un autre sujet`, `Ce sur quoi tu butais`) y restent
  **repliées**, et chaque dépliage compte une aide comme aujourd'hui.

### Le ratio des colonnes suit ce que l'exercice demande

| Forme | Ratio (sur 1040) | Colonne de droite |
|---|---|---|
| **Rédiger** (`2a`) | matière **400** / écriture **640** | `ChampDeRedaction` |
| **Choisir** (`2b`) — crans guidés | **520 / 520**, égales | les 4 lectures + 100 jetons |
| **Surligner** (`2c`) — crans 4, 7, 9 | **520 / 520**, égales | « Ce que tu en dis » |

- **Rédiger** : le champ fait 322 px de haut minimum, EB Garamond 17/1.68 ; pied
  du champ = « enregistré tout seul » + compte de signes. Sous le champ, les
  **trois gestes de la remise** (cases + bouton « Rendre ma v1 » à droite).
- **Choisir** : `CredenceSaisie` en `repartition` **remplace** le champ. Une
  carte par candidat (ordre reçu, **jamais retrié**), curseur + boutons de pas
  44 px, valeur à droite ; total « 100 sur 100 » sur `#ECE4D6` ; un seul bouton
  « Enregistrer ma réponse ». Le candidat qui porte le plus de jetons prend un
  fond `#F4F7F4` / bordure `#B9C9BE` — **effet de la saisie, jamais un indice**.
- **Surligner** : la matière porte le geste — « glisse sur le texte pour
  surligner », sélection en `#DCE6DF` souligné pigment, puis pastille
  « passage surligné » + bouton « Effacer ma sélection ». La sélection reste
  **gelée et visible** après la remise.

### Les temps passés
Repliés en une ligne (`▸ La consigne`, `▸ Le texte de départ`), jamais supprimés.

### Téléphone
- **Consigne collée en haut** : une ligne `▾ LA CONSIGNE — Explique ce que…`,
  dépliable au pouce, qui reste pendant toute la rédaction.
- **Bascule `Lire` / `Écrire`** (48 px) : la matière et le travail ne se
  disputent plus l'écran. Sur un exercice à surligner, on surligne dans **Lire**
  et le bouton « Passer à ma réponse → » fait basculer ; le passage surligné est
  rappelé en haut de **Écrire**.
- Compteur de temps discret dans la barre : `2 / 6`.

---

## 5. Écran 3 — « Se juger » devient un écran (`2d`)

`SeJuger.tsx` sort de la pile : quand `tempsCourant === 'se_juger'`, l'écran
**ne montre plus la matière ni le champ**. Colonne centrée de 660 px :

- titre Cormorant 30 « Avant de voir ton retour » ;
- sous-titre : « Trois questions sur ce que tu viens de rendre. **Ça ne se note
  pas** : se tromper en se jugeant ne coûte rien. » (compte en toutes lettres,
  comme aujourd'hui) ;
- une ligne repliée `▸ Relire ce que tu as rendu` ;
- une carte par question : dimension en Cinzel (**jamais le code observable**),
  question en EB Garamond 18, réponses en boutons de **48 px** à parts égales,
  liste **fermée** et dans l'ordre reçu ;
- un seul bouton « Envoyer mes réponses », **inactif à 42 % d'opacité** tant que
  les trois réponses ne sont pas données, avec la ligne « Réponds aux trois
  questions pour pouvoir envoyer. »

Téléphone : mêmes cartes, réponses **empilées** en pleine largeur.

---

## 6. Écran 4 — les retours : deux mises en page, selon ce qu'il faut comparer

### Retour d'un **texte produit** (`2e`)
Ce qu'il faut comparer, c'est **son texte et ce qu'on lui en dit** :

- **colonnes égales (520 / 520)** : à gauche « Ce que tu as écrit · v1 ·
  lecture seule » (fond `#F7F2E8`), à droite « Ton retour · n points » ;
- rien ne s'intercale entre les deux ;
- les points gardent leur segmentation d'origine : le premier point (réussite)
  sur `ok-teinte`, les suivants sur `surface` ; chaque point porte un renvoi
  `▸ voir le passage de mon texte` qui surligne le passage concerné à gauche
  (`#EFE4CF`) ;
- **sous les deux colonnes, pleine largeur** : l'unique action de révision, en
  encart `attention` avec `border-left: 3px solid #9A6A2E`, et le bouton
  « Reprendre mon texte » à droite ;
- **en bas**, repliés côte à côte : `▸ La consigne` et `▸ Le texte de départ`.

Téléphone : bascule **`Mon texte` / `Le retour · 3`**, puis l'encart de révision
et le bouton, puis la consigne repliée. Bandeau `attention` collé en haut :
« À rendre — version finale avant ven. 12 ».

### Retour d'un **choix** (`2f`)
Ce qu'il faut comparer, c'est **sa réponse et la bonne lecture** :

- **660 / 380** : à gauche la correction — « Ce qu'il fallait voir » (candidat
  nu en gras + explication, sur `ok-teinte`), « Pourquoi c'est celle-là »,
  « Ce que tu avais retenu — « … » » (réfutation du **seul** candidat le plus
  chargé ; si l'élève avait réparti à égalité, on sert le texte d'égalité
  existant et **rien d'autre**) ;
- à droite, en haut : **la consigne**, puis « Ce que tu avais posé » — les quatre
  lectures avec les jetons posés ;
- pied de la colonne gauche : « Cet exercice s'arrête ici — il n'y a pas de
  version finale à rendre. » + « ← Retour à mes exercices ».

> ✅ **Validé** : dans « Ce que tu avais posé », la bonne lecture est marquée
> **après coup** par une barre verte (`--ok #5B6E4A`) ; les autres barres restent
> `--muet`. C'est un ajout par rapport à l'existant côté crédence.
> ⛔ Dans tous les cas, **`indexAttendue` ne doit jamais atteindre l'écran de
> saisie** (`2b`) : ce marquage n'existe qu'**après** le retour.

---

## 7. Accessibilité et cibles

- Toute cible touchable : **44 px** minimum (48 px sur les boutons pleins de
  téléphone) — boutons de pas de la crédence compris.
- Aucun texte tertiaire sous `--muet #8A6F4E` ; taille plancher 12 px pour les
  horodatages, 15–17 px pour les consignes et les textes d'auteur.
- Le fil des temps est un `nav aria-label="Les temps de l'exercice"` ; les temps
  faits sont cliquables (retour en arrière), les temps à venir non.
- Les groupes de réponses de « Se juger » gardent `role="radiogroup"` /
  `role="radio"` + `aria-checked`.

---

## 8. Hors périmètre

- Côté **professeur** : rien (ni `prof/codex`, ni validation, ni synthèse).
- Onglet **Examens**, passation, synthèse élève : inchangés.
- **En-tête du site** (Barre 1 / Barre 2, sous-onglets) : repris tel quel de
  `EnTeteSite` / `SousNavModuleMobile` — la maquette n'en propose aucune
  modification, sauf **centrer les onglets** sur téléphone.
- Génération des retours, mise en file, sondage de l'attente : inchangés.

---

## 9. Recette

- [ ] **Accueil** : trois groupes, échéance sur chaque ligne, une seule action
      par ligne ; « en préparation » n'offre aucune action ; aucun compteur de
      progression nulle part.
- [ ] **Déroulé** : sur 1040, la matière et le travail sont côte à côte ; le
      ratio suit la forme (écriture large / égales / matière large) ; les temps
      passés tiennent en une ligne.
- [ ] **Choix** : les quatre candidats occupent la colonne de droite ; ordre
      reçu ; total visible ; un seul bouton.
- [ ] **Surligner** : le geste est expliqué au-dessus du texte ; la sélection
      survit à la remise, gelée.
- [ ] **Se juger** : écran seul, sans matière ni champ ; bouton fermé tant que
      tout n'est pas répondu.
- [ ] **Retour texte** : v1 et retour côte à côte ; une seule action de
      révision ; consigne en bas.
- [ ] **Retour choix** : consigne + répartition en haut à droite ; l'écran dit
      qu'il n'y a pas de version finale.
- [ ] **Téléphone** : consigne collante, bascule Lire/Écrire, cibles 44/48 px,
      onglets centrés.
- [ ] Aucune note, aucune lettre, aucun pourcentage, aucun code d'observable à
      l'écran.
