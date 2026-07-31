# PROMPT — Fusion des deux revues adversariales du dispositif référentiel-routeur

> **Usage** : session fraîche avec les deux dossiers connectés — `GitHub/palimpseste` (repo) et
> `GitTest/palimpseste-conception`. Objet : fusionner les deux revues adversariales externes en
> **une table d'arbitrage unique** pour Louis, sur le modèle de `FUSION_revues_C3.md` (28/07),
> qui a fait ses preuves au gel de C3. **Tu prépares l'arbitrage, tu n'arbitres pas.**

---

## Les entrées

| Fichier | Rôle |
|---|---|
| `palimpseste/Revue Adversarial/revue_adversariale_referentiel_routeur_opus.md` | Revue n°1 (Opus) — préfixe **O** (O1, O2, …). Note : elle déclare avoir déjà retiré sept constats après auto-vérification — **vérifie quand même**, même fiabilité exigée des deux. |
| `palimpseste/Revue Adversarial/revue_adversariale_referentiel_routeur_codex.md` | Revue n°2 (Codex/ChatGPT) — préfixe **C** (C1, C2, …). |
| `palimpseste-conception/00-referentiel.md` | Source de vérité n°1 — pour **vérifier** chaque constat. |
| `palimpseste-conception/01-routeur.md` | Source de vérité n°2 — idem. |
| `palimpseste/PROMPT_Revue_adversariale_referentiel_routeur.md` | Le prompt qu'ont reçu les relecteurs — il porte le **périmètre** (exclusions et exceptions) et le **contrat d'interface** (annexe A) contre lesquels tu classes. |
| `palimpseste/FUSION_revues_C3.md` | Le gabarit de sortie — reprendre sa structure, ses conventions de renvoi `[On + Cm]`, son marqueur ⚖️. |

*Attention au chemin : le dossier s'appelle `Revue Adversarial` — avec un espace, sans « e » final.*

## La méthode, dans l'ordre

1. **Lire les deux revues en entier** et re-numéroter leurs constats avec le préfixe du relecteur
   (le G1 d'Opus devient O1, le G1 de Codex devient C1). Les fichiers source ne se modifient pas —
   le détail complet de chaque constat y reste, la fusion y renvoie par référence.
2. **Regrouper.** Même constat chez les deux → **un** item fusionné, marqué `[On + Cm — convergence]` ;
   la convergence de deux relecteurs indépendants est le signal le plus fort de la table, elle se
   voit. Constats voisins mais non identiques → un item avec la nuance explicitée. Constats uniques
   → un item chacun.
3. **Vérifier chaque constat contre les deux documents source** — c'est le cœur du travail :
   - le § cité existe-t-il, et dit-il ce que le relecteur affirme ? (contrôler les **citations** au mot près) ;
   - le point est-il **déjà couvert ailleurs** dans les deux documents ? (donner la référence exacte qui le prouve) ;
   - le constat viole-t-il le **périmètre** de la revue — chantiers déclarés (construction de la
     semaine, ciblage lecture, certitude), valeurs *provisoires*, *[à valider]* déclarés — **sauf**
     si une exception s'applique (une décision actée rend un chantier insoluble ; une casse
     invisible à la télémétrie ; deux [à valider] incompatibles) ?
   - les **chiffrages** : refaire le calcul, dire s'il tient.
4. **Classer** chaque item fusionné dans les sections de sortie ci-dessous, et marquer **⚖️** ceux
   qui exigent un arbitrage de Louis (par opposition à ceux qui s'écrivent sans décision nouvelle).
5. **Tu peux recommander** (« *Recommandation fusion : …* »), comme la fusion C3 le faisait — mais
   toujours marqué comme recommandation, jamais comme décision. **Même un « faux positif » garde sa
   ligne avec la preuve** : Louis a validé les items de C3 un par un, y compris les faux positifs ;
   il fera pareil ici, et doit pouvoir te contredire pièce en main.
6. Si **la vérification te fait découvrir un défaut nouveau** (une incohérence que ni O ni C n'a vue),
   il va dans une section à part, clairement marquée — jamais mélangé aux constats des relecteurs.

## Le format de sortie

Un fichier : **`palimpseste/Revue Adversarial/FUSION_revues_referentiel_routeur.md`**, structuré ainsi :

- **En-tête** : assemblée le [date] à partir des deux revues (avec leurs préfixes et leurs comptes),
  rappel que les relecteurs ont travaillé sur `00` + `01` + le contrat d'interface **seuls** ;
- **« Lecture rapide »** : N items fusionnés (F1-Fn), combien demandent un arbitrage (⚖️), et les
  zones de **convergence massive** entre les deux revues — trois lignes, pas plus ;
- **A. BLOQUANT** — à trancher ou à écrire **avant les deux sessions dédiées et la réécriture des
  lots C4** ;
- **B. AVANT-ALLUMAGE** — à corriger avant septembre ;
- **C. À SURVEILLER** — la télémétrie ou une décision différée suffit ;
- **D. Corrections mécaniques** — renvois, arithmétique, vocabulaire : à appliquer sans arbitrage ;
- **E. Déjà couvert, hors périmètre ou faux positif** — chaque ligne avec **la référence exacte qui
  le prouve** (document + §, citation si utile) ;
- **F. Constats propres à la fusion** — ce que la vérification a révélé et que personne n'avait vu
  (vide si rien) ;
- **G. Angles morts fusionnés** et **Vrac fusionné** — une ligne par item.

Gabarit d'un item (reprendre celui de `FUSION_revues_C3.md`) :

> **F7 ⚖️ — Titre en une phrase qui porte le mécanisme.** `[O12 + C3 — convergence]`
> L'attaque compressée mais fidèle (le scénario, le mécanisme, le chiffre s'il y en a un). Le
> résultat de ta vérification s'il nuance le constat. *À trancher : la question précise posée à
> Louis. Recommandation fusion : …*

## Fin de session (obligatoire)

1. Déposer `FUSION_revues_referentiel_routeur.md` dans le dossier `Revue Adversarial`.
2. **Journaliser au `CONTEXTE.md`** de `palimpseste-conception` : une entrée datée — les comptes
   (items par relecteur, fusionnés, convergences, faux positifs), les zones de convergence, **sans
   rien arbitrer** — et la mention que la table attend la **séance d'arbitrage de Louis** (item par
   item, sur le modèle de `RELEVE_Arbitrage_C3_2026-07-29.md`).
3. **Terminer par la ligne obligatoire** : « **impact C3 : néant** (instrument d'arbitrage — les
   amendements éventuels sortiront de l'arbitrage de Louis, pas de cette fusion). »

## Interdits

- **Ne rien arbitrer, ne rien corriger** dans `00-referentiel.md` ni `01-routeur.md` — même une
  coquille manifeste se liste en section D, elle ne se corrige pas dans cette session.
- Ne pas ouvrir `02-exercices.md`, `03-`, `04-` ni les fiches de `competences/` : les relecteurs ne
  les avaient pas, la fusion ne les a pas non plus. `SPEC_C3_exercices_competences.md` peut être
  ouverte **uniquement** pour vérifier un point de fait qu'un constat met en cause — jamais pour
  élargir la revue.
- Ne pas adoucir un constat pour ménager l'auteur : la valeur de la table est dans sa dureté
  vérifiée. Ne pas durcir non plus : ce que la vérification réfute va en E, avec la preuve.
- En cas de doute de classement : l'item monte d'une section (vers le plus grave), avec une note —
  Louis descendra ce qui doit descendre.
