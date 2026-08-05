# RELEVÉ D'ARBITRAGE — Séance de gel de la SPEC C3 (29 juillet 2026)

> **Renommage du 04/08/2026 — décision de Louis.** Les items de ce relevé s'appellent désormais **`GC1` à `GC26`** (*gel de C3*), et non plus `F1` à `F26`. **Motif** : le relevé d'arbitrage du **30/07** (référentiel × routeur) numérote **aussi** ses items `F1` à `F27` — il y avait donc deux `F17`, deux `F25`, deux `F5`, sans moyen de les distinguer. **Un `F` nu, partout dans le chantier, désigne désormais le relevé du 30/07** ; les items de celui-ci portent la lettre. *Les sections C1-C21 (corrections mécaniques) et D1-D5 (constats écartés) de ce relevé ne sont pas renommées — elles ne sont presque jamais citées ailleurs.* Convention écrite au `LEXIQUE.md`. **Le journal, la liste d'amendements et les deux fichiers de fusion gardent leurs `F` nus : ce sont des blocs datés.**

> **Rôle de ce fichier** : le relevé au fil de l'eau de la séance d'arbitrage Louis × Calame sur
> `FUSION_revues_C3.md`. Il est écrit **pendant** la séance, item par item, pour qu'aucune décision
> ni aucune donnée apportée par Louis ne se perde. Il fait foi pour l'application des décisions à
> `SPEC_C3_exercices_competences.md` (étape 2), le gel (étape 3), les prompts C4-L1/L2 (étape 4) et
> l'entrée au journal du `CONTEXTE.md` (étape 5).
>
> **Statuts employés** : *acté (séance)* — décidé explicitement par Louis aujourd'hui ·
> *provisoire (réglage empirique)* — un chiffre adopté aujourd'hui mais que le banc ou l'usage
> révisera · *[à valider]* — pas encore tranché.
>
> **Rappel du garde-fou de séance** : un « oui » de Louis acte un **principe**, jamais un résultat.
> Les seuils chiffrés restent provisoires sauf mention contraire.

---

## Table de suivi

| Item | Décision | Statut |
|---|---|---|
| GC1 | **Autre** (solution Louis) — clavier à la maison, OCR réservé à la classe | acté (séance) |
| GC2 | **Oui, amendé** — arbitrage de fond : surnoter < sous-noter | acté (séance) |
| GC3 | **Oui, amendé** — critère de recette chiffré, 3 gates, voie mixte | acté (séance) |
| GC4 | **Oui** — `exercices_depots` créée à l'assignation | acté (séance) |
| GC5 | **Autre** — prémisse fausse : la validation est en amont, une fois | acté (séance) |
| GC6 | **Oui** — `exercices_jobs`, index uniques, plafonds de coût | acté (séance) |
| GC7 | **Oui, corrigé** — namespaces oui ; `classe_id` sur les niveaux : NON | acté (séance) |
| GC8 | **Autre** — budgets plancher/plafond par élève ; durée = cycle | acté (séance) |
| GC9 | **Oui, amendé** — un squelette par compétence mesurée ; ambiguïté levée | acté (séance) |
| GC10 | **Oui, amendé** — définitions M3 ; P2-vf **conservée** (garde-fou M1) | acté (séance) |
| GC11 | **Oui** — lettre Loi 25 prête le **22/08** | acté (séance) |
| GC12 | **Oui, amendé** — `mode` = contexte ; famille lue sur le type | acté (séance) |
| GC13 | **Oui** — manifeste de fichiers faisant foi par lot | acté (séance) |
| GC14 | **Oui, amendé** — la stagnation change la cible, jamais le volume | acté (séance) |
| GC15 | **Oui, amendé** — appariement par le compte élève | acté (séance) |
| GC16 | **Autre** — l'élève **corrige** sa transcription ; flux complet du diagnostique | acté (séance) |
| GC17 | **Oui** — `indetermine`, verdicts par observable, contestation → file prof | acté (séance) |
| GC18 | **Autre** — signal non bloquant au plan d'évaluation | en cours |
| GC19 | **Oui** — NULL ≠ 0 ; restitution à chaud retenue | acté (séance) |
| GC20 | **Oui** — geste sur les conditions au dépôt | acté (séance) |
| GC21 | **Oui** — défense contre l'injection retenue | acté (séance) |
| GC22 | **Oui** — geste observable, constat en vf, citations namespacées | acté (séance) |
| GC23 | **Oui** — borne d'élève, `borne_amont` journalisée | acté (séance) |
| GC24 | **Oui** — mesures de même nature, contrefactuel, volumes journalisés | acté (séance) |
| GC25 | **Autre** — lettres prof par défaut + **option élève** ; **pas de note dans Palimpseste** | acté (séance) |
| GC26 | **Oui, amendé** — contrat de latence à **3 minutes** | acté (séance) |
| Section C (C1-C21) | **Oui à tout** — C7 sans objet, C16 et C20 tranchés par Louis | acté (séance) |
| Section D (D1-D5) | **Écartements confirmés** | acté (séance) |
| Section C (C1-C21) | **Oui à tout** — C7 sans objet, C16 et C20 tranchés par Louis | acté (séance) |
| Section D (D1-D5) | **Écartements confirmés** | acté (séance) |

---

## SECTION A

### GC1 — La vf manuscrite casse le geste de 10 min et le retour final
**Décision : AUTRE — solution Louis, qui remplace le correctif de la fusion.**

Texte retenu :

1. **Maison (formatif, écriture et lecture, v1 et vf)** : saisie **écran**, dans l'application.
   Inclut les grosses analyses de lecture (L7 long, L9, L12-paragraphe), qui étaient au manuscrit
   dans la v3.1.
2. **Manuscrit + photos + OCR** : réservé aux **passations en classe** — les deux diagnostiques de
   la semaine 1, les DS ingérés par le même canal — **et à l'essai Fragments**.
3. **Une passation en classe = une seule version**, stockée comme **`v1`** (M1 ne mesure que la v1 ;
   la nommer `vf` la sortirait du périmètre de mesure). Pas de révision, pas de retour final.
4. **Écran de contrôle de la transcription par l'élève, avant tout retour.** C'est ce qui sauve la
   validité des ancres. Bénéfice pédagogique relevé par Louis : cela force l'élève à se relire.
5. **Anti-collage** : les champs de rédaction **refusent le collage** (raccourci clavier,
   glisser-déposer, menu contextuel). **Chaque tentative bloquée est journalisée** et devient un
   signal du faisceau anti-triche T2 (§7).
6. **Dispositif de lisibilité** : **retiré du canal maison** (sans objet) ; **conservé au canal
   classe**. « Exercice à refaire lisiblement » devient un **message reporté** — « la prochaine
   fois, il faudra faire mieux » — mémorisé au profil et **affiché à la passation suivante**.
   **Exemption au profil conservée** pour les passations en classe (dysgraphie, plan d'intervention).
7. **Correcteur orthographique du navigateur : laissé actif**, non désactivé. Jugement de terrain de
   Louis : peu d'élèves l'utilisent, et tant mieux pour ceux qui le font ; il restera toujours des
   fautes, donc la chasse aux fautes garde son objet.

Assumé explicitement par Louis : **la raison pédagogique du 27/07** (« le bac s'écrit à la main »)
ne survit qu'en classe. *« La vie est faite de compromis. »*

Conséquences enregistrées :
- Le faisceau anti-triche **change de nature** : la durée mesurée, morte sur manuscrit (constat de
  GC19), renaît ; s'y ajoutent rythme de frappe, apparition du texte par blocs, nombre de sessions,
  tentatives de collage. Réserve consignée : le blocage du collage est **côté navigateur seulement**
  — il arrête le geste paresseux, pas l'élève déterminé.
- Effet de bord assumé : l'élève qui rédige hors ligne ne peut plus coller ; certaines aides
  techniques passent par le collage.
- **Coût OCR en forte baisse** : l'OCR ne tourne plus que sur ~140 copies deux à trois fois l'an.
  Le chiffrage de GC6 est à réviser à la baisse ; le risque n°8 du §10 se réduit au canal classe.

### GC2 — L'OCR ne fait pas qu'échouer : il corrige, et surtout chez les faibles
**Décision : OUI, amendé.**

**Arbitrage de fond de Louis, qui gouverne l'item** : *le risque de surnoter les élèves est moins
grave que celui de les sous-noter.*

- **(a) Prompt de transcription : conservé tel quel.** C'est
  `PROMPT_transcription_copies_tests.md` (repo), déjà **strictement littéral** (« Tu es un scribe,
  pas un correcteur »), gérant retours à la ligne et paragraphes, produisant une liste de
  « Doutes ». Sa **règle 7 neutralise l'injection de prompt par la copie** — cela couvre l'essentiel
  de GC21. Louis considère que **la génération réussie de ses copies-tests vaut test** : **aucun
  jalon OCR n'entre au chemin critique d'août.**
  *Réserve consignée (journal du 28/07, décision D1) : Louis a dû réviser lui-même les
  transcriptions ; la génération n'était donc pas fidèle du premier coup. Risque encaissé par
  l'arbitrage ci-dessus et par l'écran de contrôle élève.*
  → **Le prompt devient source de vérité citée par la spec.**
- **(b) Expression est mesurée normalement au diagnostique** — pas de mise en sourdine.
- **(c) `confiance_ocr` = désaccord entre deux passes de transcription**, calculé en code, sans IA
  de jugement. *Provisoire — Louis surveille le coût sur un an.*
- **(d) Périmètre de la chasse aux fautes et de la section « langue »** — formulation retenue :
  *elles s'appuient sur un texte dont l'élève répond — saisi à l'écran, ou transcrit puis contrôlé
  par lui.* Le diagnostique produit donc **un retour élève avec section langue**.
- **Limite nommée et acceptée** : l'écran de contrôle répare les contresens de transcription, pas
  le biais de correction orthographique — un élève ne rétablit pas ses propres fautes.

**Forme du diagnostique (précisé par Louis)** : en classe, **seule la phase de rédaction** —
écrire à la main, photographier, contrôler la transcription. Pas de temps 3 (« se juger »), pas de
révision, pas de retour final. **Le retour part en lot, au déclenchement du prof** (le soir même ou
le lendemain) et arrive à l'élève en différé.

### GC3 — Statut de recette, gate unique, routeur qui ne filtre rien
**Décision : OUI, amendé.**

- **Trois gates** au lieu d'un : `exercices_actif` (les élèves peuvent-ils faire des exercices),
  `routeur_actif` (le routeur choisit-il), `competences_affichage_actif` (les lettres sont-elles
  visibles). Plus une **matrice normative par statut de recette** : pour chaque état, ce qui tourne
  et ce qui est masqué.
- **Le routeur ne cible que les compétences `evaluee`.**
- **Critère de recette** — une compétence passe à `evaluee` si : **≥ 15 copies** au banc ·
  **accord à ±1 niveau ≥ 80 %** contre les golds de Louis · **golds écrits avant lecture des
  sorties**. *Chiffres provisoires (réglage empirique).*
- **Règle des golds (version Louis)** : les golds s'écrivent avant lecture des sorties. Une révision
  **après le run 1 ou 2** = erreur grossière → **la copie sort du lot de calibration de cette
  compétence** (le lot de 15 devient 15−n). Un changement d'avis **au run 3 ou 4** = affinement de
  calibration → **la copie reste dans le calcul**. Toute révision est journalisée avec son motif.
  *(Louis dispose de 25 copies : 10 en réserve permettent de recompléter le lot s'il le souhaite.)*
- **Corpus de calibration** : **15 copies par compétence**, choisies parmi les **25 copies** en sa
  possession, transcrites cette semaine en **deux lots (10 puis 5)**. Des golds sont déjà écrits.
- **Corpus lecture** : **synthétique** — copies de qualités variées produites par une IA **tenue en
  aveugle des gabarits et des compétences**. Réserve de Louis consignée telle quelle : *« ce ne sera
  pas propre. »* Recalibration sur copies d'élèves réelles en cours d'année : **possibilité, pas
  jalon** (selon ses disponibilités).
- **Louis prononce seul** le statut de recette ; il vit dans `competences_niveaux.statut_recette` et
  laisse une trace au journal du `CONTEXTE.md`.
- **Défaut de sécurité** : une compétence naît `mesuree_silencieusement` et ne devient `evaluee` que
  par un acte explicite de Louis.
- **Sortie retenue : la voie mixte (γ)** — le routeur remplit le budget hebdomadaire avec les seules
  compétences `evaluee` ; le reste du temps va aux **exercices communs** imposés par le prof.
  *« Dans l'espoir que tout soit prêt pour la rentrée. »*
- **§8 réécrit** : le cœur R1-R6 du routeur est **à écrire avant le 25 août** — la mention « le code
  du routeur peut s'écrire en C6 ou post-rentrée » disparaît (contradiction avec la variante B).

### GC4 — L'assignation individuelle n'existe pas dans le schéma
**Décision : OUI, tel quel.**

Une ligne **`exercices_depots` créée dès l'assignation** (et non au dépôt) : elle porte le cycle
individuel. Champs ajoutés : `statut` énuméré
(`assigne` → `ouvert` → `v1_remis` → `retour_publie` → `vf_remis` → `clos`, plus `abandonne`),
`assigne_at`, `du_at`, `origine` (`routeur` | `prof`), `routeur_decision_id`.
`exercices` reste l'instance partagée : type × matière × fenêtre.
**`abandonne` est exclu des règles de stagnation.**
**Effet de GC1** : pour une passation en classe, la séquence s'arrête à `retour_publie` (pas de
`vf_remis`).

### GC5 — La file de validation est intenable / semaine 2 à vide
**Décision : AUTRE — la prémisse des trois revues est fausse.**

Correction de Louis : **une référence décomposée appartient à un texte support, pas à un élève.**
Elle se fabrique **une fois**, à la constitution du corpus des textes d'exercices. Louis **ne valide
jamais le squelette d'une copie d'élève**. Toute l'arithmétique des revues (8,6 s/item, 27 min/sem,
2-3 h/sem) tombe avec la prémisse.

Ce qui est retenu :

- **Aucune file de validation hebdomadaire.** Le critère de réussite de C4-L2 (« le prof valide la
  file en moins de 10 min ») disparaît — **C4-L2 rétrécit** à l'écran des budgets et aux exercices
  communs. *À ne pas confondre avec la validation à l'import de l'injecteur (C5-L1, actée le
  27/07) : celle-là survit — c'est précisément la validation « une fois par texte ».*
- **Remplacement retenu** : un **écran en lecture seule** — « voici ce que le routeur a assigné
  cette semaine » — sans geste de validation, pour que Louis puisse voir et utiliser son override.
- **Unicité et empreinte (hash) sur `exercices_references`** : un texte ne se décompose jamais deux
  fois ; une référence validée ne peut plus être modifiée en silence.
- **Règle du routeur** : il n'instancie de la lecture **que depuis le corpus validé**. Cela remplace
  le plafond de nouveautés et la priorisation proposés par la fusion.
- **Corpus des exercices d'écriture** : chantier des prochaines semaines, **hors périmètre du gel**.
  `reference_id` reste optionnel.

### GC6 — Aucune infrastructure de traitement
**Décision : OUI, tel quel.**

Table **`exercices_jobs`** (étape, statut, tentatives, clé d'idempotence) ; **index uniques**
`(depot_id, competence, version)` sur les mesures ; plafond de tentatives ; état `echec_definitif`
**visible**. Côté coût : plafond mensuel, alerte à 70 %, **coupure automatique** (le gate bascule,
les dépôts restent en file), plafond d'appels par dépôt, compression des photos côté client.
*Le mode de panne visé : un retry après timeout écrit une deuxième mesure pour la même copie →
la règle « 2 sur 3 » monte une lettre sans progrès de l'élève.*
**Renforcé par GC1/GC2** : le retour du diagnostique part **en lot au déclenchement du prof** — c'est
un traitement par jobs. **Chiffrage à réviser à la baisse** (l'OCR a quitté le formatif maison).

### GC7 — Deux Problématisation, pas de dimension cours
**Décision : OUI pour les namespaces et la table des compétences actives ; NON pour `classe_id` sur
les niveaux.**

Retenu :
- **Identifiants namespacés** : `ecriture.problematisation` / `lecture.problematisation`.
- **Table des compétences actives par classe** (c'est elle qui dit que HLP n'a pas de
  Problématisation d'écriture).

Écarté, avec sa raison :
- **`classe_id` dans la clé de `competences_niveaux` : NON.** Le correctif renversait sans le savoir
  une décision actée du 17/07 — *TC 6 / HLP 5 avec **profil unifié** et échelle commune* — et la
  règle **R6** du routeur (« profil unifié sur les cinq compétences communes, alimenté par les deux
  flux »). Position de Louis : **les compétences n'ont pas de `classe_id`.** Un seul profil par
  élève × compétence.

*(Point restant : le sort du champ `provenance` (`tc`|`hlp`) sur `competences_mesures` — voir
« Questions ouvertes ».)*

### GC8 — `duree_attendue_min` sert trois maîtres ; le double budget TC+HLP
**Décision : AUTRE — modèle de budget de Louis.**

Donnée de terrain apportée par Louis, absente de la spec C3 mais présente dans `02-exercices.md` :
**les types n'ont pas la même durée** — de ~3 min à ~45 min (L8 ~5 min, L10 ~5 min, L11 ~8 min,
L3 ~10-12 min, L7 ~15-20 min, L9 45 min…). **Le routeur construit la semaine sous contrainte de
temps**, en fonction des objectifs, des compétences et des difficultés de l'élève. *La règle de
construction exacte se précise côté routeur (`01-routeur.md`), pas dans C3.*

- **Deux champs** : `duree_cycle_min` (le temps total de l'exercice — **la seule décomptée** du
  budget) et `duree_redaction_min`. **Amendement de Louis** : `duree_redaction_min` sert peu — de
  nombreux types (choix multiples, textes à trou…) ne comportent aucune rédaction et leur temps
  entier compte. Elle devient donc **optionnelle**, renseignée pour les seuls types à rédaction
  suivie, et **son utilité se réévalue à la conception des types**.
- **Le budget est une propriété de l'élève**, pas de la classe. Décidé en début d'année.
  **Plancher et plafond** :

  | Situation | Plancher | Plafond | Optionnel |
  |---|---|---|---|
  | HLP mono | 1 h | 1 h 30 | + 30 min |
  | TC (philo) mono | 45 min | 1 h | + 30 min |
  | Bi-classe | 1 h 30 | 2 h | + 30 min |

  *Provisoire (réglage empirique).* Raison du bi-classe : **les compétences sont les mêmes**, donc
  l'élève bi-classe n'a aucune raison de faire le travail en double — « budget HLP complet + un peu
  de la TC ». C'est la décision du 17/07 (profil unifié) qui le permet.
- **Ce que voit l'élève** : **pas de budget-temps hebdomadaire**. Il voit **la quantité d'exercices**
  que le routeur lui a prévue en début de semaine, et sur chaque exercice **une durée indicative**.

### GC9 — « Le squelette » : un par dépôt ou un par compétence ?
**Décision : OUI, amendé.**

- **Le design bancé est conservé** : **P1 par compétence** (un P1 unique invaliderait le pilote
  Argumentation, les 4 runs Structure et les 3 runs Expression).
- **Règle générale retenue** : **un squelette par (dépôt × version × compétence mesurée)** — ce que
  le schéma dit déjà. Le nombre est déclaré par le type. Formulation de Louis : *les exercices
  mono-compétence n'ont qu'un squelette ; les diagnostiques pluri-compétences en ont autant que de
  compétences.*
- **Ambiguïté textuelle levée** : les §0, §3.3 et §3.6 écrivent « le squelette » au singulier. À
  corriger : *le temps 3 (se juger) et le temps 6 (retour final) portent sur le squelette de la
  **compétence cible**.*
- **Prompt caching** noté au lot C4-L5 : la copie en préfixe commun des N appels.

### GC10 — Champs de télémétrie jamais définis, appels sans consommateur
**Décision : OUI, amendé.**

- **`aide_consommee`** = dépliages de la fiche stratégique + relectures. *Définition provisoire,
  révisable selon les types d'exercices (réserve de Louis).*
- **`distance_contexte`** = énumération `meme_type` / `meme_famille` / `transfert`. Sa finalité,
  reconstituée en séance : mesurer le **transfert** — un succès obtenu sur le type qu'on vient de
  travailler dix fois ne vaut pas un succès sur un type neuf ; c'est aussi ce qui permet à
  l'escalade N2 de distinguer un problème de *réception* d'un problème de *transfert*.
- **`delai_depuis_dernier_travail`** → **deux champs** : `delai_jours` (calendaire, pour la récence
  du modèle de certitude) et `delai_mesures` (unité native du routeur — `01-routeur.md` §3 :
  « unité de temps du routeur : la mesure, pas la semaine »).
- **`delta_v1_vf` = comparaison des squelettes** (« la mesure du delta est objective comme ça »).
- **Phase 2 sur la vf : CONSERVÉE** — contrairement à la proposition de la fusion. Raison de Louis :
  le retour de vf en est le consommateur. **Garde-fou attaché (impératif)** : le verdict de la
  Phase 2 sur la vf sert **uniquement à écrire le retour final** ; il **n'écrit jamais** dans
  `competences_mesures` — sinon la règle M1 (« les mesures viennent de la v1 seule ») saute en
  silence.
- **Chemin d'écriture du Monitoring** vers `competences_mesures`, depuis `exercices_metacognition`.
- **Versionnage de l'instrument** : `prompt_version` + `modele` par phase, `instrument_version` sur
  les mesures.

**Chiffrage des appels par cycle** (établi en séance) :
- appels **froids** = la chaîne P1/P2 (P1 extrait le squelette, **P2 produit le verdict** — de la
  donnée, pas du texte) ;
- appels **chauds** = la reformulation pour l'élève (§5, « SYSTÈME — CALAME · RETOUR FORMATIF »),
  qui reçoit squelette + verdict : **un pour le retour de v1, un pour le retour final**.
- Formule : `(P1+P2) × N` sur la v1 + `(P1+P2) × 1` sur la vf (**la vf ne repasse que pour la
  compétence visée par le retour** — décision de Louis) + 2 appels chauds = **2N + 4**.

**Mesure secondaire — modèle retenu (Louis)**, qui remplace « chaque exercice évalue 2-3
compétences » :
1. **La compétence mesurée en secondaire n'est jamais celle qui est travaillée dans le cycle de la
   semaine** — on sonde ce qu'on n'entraîne pas.
2. **Tous les exercices ne mesurent pas de secondaire** ; certains ne peuvent pas.
3. **Dans un cycle d'une semaine : 1 ou 2 compétences secondaires mesurées, une seule fois chacune.**
4. Logique de **répétition espacée** : la secondaire se mesure au moment optimal pour voir s'il faut
   la retravailler.
5. Exemple donné : une série d'exercices mesurant Argumentation et Expression en primaire peut
   mesurer Structure en secondaire.

→ Conséquences : `competences_secondaires[]` du type devient une liste de secondaires **éligibles**,
non « toujours mesurées » ; **la règle d'espacement appartient au routeur** (`01-routeur.md`) et
reste à écrire ; les champs `delai_jours` / `delai_mesures` en sont l'entrée naturelle.

**Appel fusionné (idée de Louis) : écarté du gel, conservé comme hypothèse.** Un appel unique
contenant tous les prompts et tous les squelettes détruirait le dispositif **anti-halo**, qui est le
résultat le mieux établi du chantier (gold Copie5 A→B+, halo Connaissance ; gold Copie1, halo
Argumentation ; raison d'être du bi-phasé inversé d'Expression : « le fond intelligent gonfle la
note de langue » ; cécité croisée renforcée le 28/07). Il faudrait de surcroît re-bancer un
instrument neuf. Le gain d'entrée est déjà capté sans risque par le **prompt caching**.
**Noté comme hypothèse d'optimisation à tester au banc, hors gel.**

**Lien avec une décision ouverte du journal** : Louis souligne qu'il est « d'autant plus important
d'être certain que le modèle le moins cher fonctionne bien avec mes prompts » — c'est la question
D9 du 28/07, **[à valider]** : régime mixte Haiku-hebdo / Sonnet-ancres. Le chiffrage de GC6 en
dépend.

### GC11 — Loi 25
**Décision : OUI, avec jalon daté.**

**Jalon : une lettre présentant le traitement, prête le 22 août.** Elle porte :
- la **table de traitement** — pour chaque donnée (photo de copie, transcription, squelette,
  verdict, retour, télémétrie) : finalité, lecteur, sous-traitant, **durée de conservation**,
  **mode d'effacement** ;
- le principe que **toute contestation individuelle atteint un humain** (rejoint GC17) ;
- **`mode_saisie_force = ecran`** au profil — **jamais** le diagnostic médical (dysgraphie, plan
  d'intervention) ;
- la **purge des métadonnées EXIF** avant tout envoi ;
- la question du **propriétaire institutionnel** (responsable du traitement, mode dégradé sans
  Louis, scénario de sortie) — à régler avec la personne responsable de l'accès à l'information du
  collège.

**Correction de terrain apportée en séance** : les revues parlaient de « copies de mineurs » et
d'« information aux parents ». Louis enseigne au **cégep** — élèves de 17 ans et plus. Au Québec un
mineur de 14 ans et plus peut en règle générale consentir lui-même. Le volet « parents » tombe
probablement ; le volet « mandat de la direction » change de forme. *À faire confirmer par le
collège — aucun avis juridique n'a été donné en séance.*

Si **Pangram** est adopté (§7, option), il s'ajoute à la liste des sous-traitants.

### GC12 — `mode` mélange famille et contexte
**Décision : OUI, amendé.**

- **`mode` = `formatif_maison` | `diagnostique_classe`** — un contexte, rien d'autre. La valeur
  `lecture` disparaît.
- **La famille (écriture / lecture) se lit sur le type**, avec règle de dérivation écrite.
- **Précision de Louis** : les **types diagnostiques sont des types à part entière**, distincts des
  types d'exercices — a priori **essai, dissertation, explication de texte**. Il n'y en aura
  probablement pas d'autres, mais ils **se spécifient au fil de l'eau** (une ligne de plus dans
  `exercices_types`, aucun changement de schéma).
- **Enjeu réglé** : sans cette correction, un diagnostique de lecture n'aurait pas été une **ancre**
  — donc ni descente, ni plafond ancre+2 côté lecture, toute l'année.

### GC13 — R4 interdit aux sessions de lire ce qu'elles doivent implémenter
**Décision : OUI, tel quel.**

Chaque lot du §9 liste **son manifeste de fichiers faisant foi** — nom **et statut requis**. Un
fichier non validé **bloque le lot explicitement**. *(C4-L5 a besoin de `competences/*.md` ; C4-L2 a
besoin de `01-routeur.md` — que R4 leur interdisait d'ouvrir.)* Les prompts C4-L1 et C4-L2 rédigés
en fin de séance porteront ce manifeste.

### GC14 — « Stagne → pause, progresse → pousse » (décision actée, contestée par deux revues)
**Décision : OUI, amendé — la décision du 27/07 n'est pas renversée, elle est mise en cohérence.**

Constat établi en séance : **la moitié du correctif était déjà dans le routeur.** L'escalade **N3**
dit « la cible passe en secondaire, le primaire va à la compétence suivante » — le volume ne bouge
pas, c'est la cible qui se déplace. C'est la paraphrase du §4 de C3 (« on allège », « le routeur
lève le pied ») qui a créé l'ambiguïté.

Retenu :
1. **La stagnation change la CIBLE, jamais le VOLUME.** Vocabulaire du §4 aligné sur N3.
2. **Plancher de mesure** : au moins **une mesure toutes les 3 semaines** sur toute compétence
   ciblée. *(Le modèle de secondaires espacées de GC10 en fait déjà l'essentiel du travail.)*
3. **Fenêtre de montée temporelle** : « 2 mesures améliorées sur les 3 dernières **ou** dans la
   fenêtre temporelle ». **Règle de cohérence retenue : fenêtre temporelle = 2 × la période du
   plancher** — donc **6 semaines** ici. Raison : une fenêtre plus courte que deux périodes de
   plancher ne peut pas contenir deux mesures, la montée y serait arithmétiquement impossible.
   *(Les deux paramètres sont liés par construction, pas fixés séparément.)*
4. **Niveaux initiaux en `profil_provisoire`**, à faible certitude : ni pause ni escalade
   déclenchées sur la foi d'une seule ancre.

**L'objection motivationnelle tombe — le dispositif de notes de Louis existe** (voir « Assiduité »
ci-dessous).

### Assiduité et motivation — élément neuf apporté par Louis (hors fusion)
**Statut : acté (séance) ; entre au périmètre du gel pour la collecte des données.**

Dispositif réel de Louis, qui répond à l'objection de GC14 :
- **Punition collective** : si **un tiers de la classe** ne fait rien **deux semaines de suite**,
  tout le monde rend le travail imprimé et c'est noté.
- **Récompense individuelle** : **+1 par semaine de travail fait**, **par semestre** (les notes
  fonctionnent au semestre), 0 pour qui ne fait rien.

Conséquences pour la spec :
- **Deux agrégats à produire, absents de la spec** : le **taux d'inactivité hebdomadaire par
  classe** (déclencheur du tiers) et le **compteur de semaines de travail fait par élève**.
- **Décision retenue : les compteurs entrent dans C4 ; les écrans peuvent attendre.** Raison : un
  semestre ne se recompte pas après coup — si la collecte ne démarre pas à la rentrée, le premier
  semestre est perdu.
- **Définition d'une « semaine de travail fait »** : **2/3 ou 3/4** des exercices assignés faits —
  **seuil = paramètre de configuration**, jamais en dur.
- **Semaines de vacances** : elles **ne comptent pas** comme semaines de travail dû (elles sortent
  du dénominateur) ; un élève qui veut travailler pendant ces semaines n'en est jamais empêché.
  *Dépendance : le compteur lit le calendrier scolaire (module Calendrier).*
- **Barème : hors périmètre (révisé à GC25).** Palimpseste n'affiche qu'un **pourcentage
  d'assiduité** ; Louis fait lui-même la conversion en note, hors application. *(La formule
  `20 / (semaines_semestre − semaines_vacances)`, envisagée en séance, est abandonnée côté produit.)*
- **Écrans (différés, conception ultérieure)** : une **frise** en haut de la page d'exercice montrant
  où en est l'élève dans son parcours ; une **page de parcours** au tableau de bord (progrès,
  objectifs, réussites, défauts récurrents).

### GC15 — Diagnostique en classe (téléphones, appariement, absents)
**Décision : OUI, amendé.**

- **Téléphones** : l'interdiction vise le **secondaire** ; Louis est au **cégep** et rien ne dit que
  son collège l'étend. Si elle s'applique : **chariot d'iPad**, les élèves se connectent depuis là.
  Dans les deux cas **l'élève dépose lui-même** — le correctif « le prof ramasse et numérise en un
  lot » est écarté.
- **Appariement élève ↔ pages** : réglé par le **dépôt depuis le compte de l'élève**, créé au premier
  cours. En-tête pré-imprimé, QR et journal des réattributions : **sans objet**.
- **Absents au diagnostique** : profil par défaut = **médiane de la classe** + `profil_provisoire`,
  avec fenêtre de rattrapage.
- **Connaissance et Synthèse** : lettre **`differee`** au diagnostique — une mesure de semaine 1
  capte le capital culturel, pas la compétence. *(Connaissance est de toute façon hors rayon du
  routeur depuis le 17/07.)*

### GC16 — La transcription visible de l'élève
**Décision : AUTRE — l'élève CORRIGE sa transcription. Et Louis spécifie le flux complet.**

- **L'élève peut éditer le texte de sa transcription.** Pas de signalement, **pas de double version
  conservée**, **la mesure porte sur la version corrigée**, aucun drapeau d'écart, **Expression
  reste mesurée sur toutes les copies**.
- Garde-fous de terrain (raison de Louis) : la relecture se fait **en 10 minutes, en classe, devant
  lui** ; l'OCR n'est relisible qu'après que **le prof** ait ouvert le dépôt ; **les copies papier
  sont ramassées** et restent la preuve. La relecture sert à corriger les fautes d'inattention et
  les phrases mal construites — *« au contraire, c'est ce qu'on demande toujours aux élèves, et ça
  renforce la métacognition »*.
- **Point de construit consigné** : mesurer Expression **après relecture** est sans doute un
  meilleur construit (c'est ce qu'un élève est censé rendre). **Décalage à ne pas oublier** : les
  15 copies de calibration sont des transcriptions de **jets bruts**, non relus — l'instrument sera
  étalonné sur du brut et déployé sur du relu. Absorbé par l'arbitrage « surnoter < sous-noter ».

**FLUX COMPLET D'UNE PASSATION DIAGNOSTIQUE (spécifié par Louis — vaut pour tous les
diagnostiques). C'est du périmètre neuf : il étend le lot C4-L4.**

1. Les élèves se connectent à leur compte Palimpseste.
2. Le prof **affiche le sujet au tableau**.
3. Ils rédigent **45 min sur papier** *(durée indicative, comme toutes les suivantes)*.
4. **Le prof ouvre le dépôt** au bout de ~40 min — c'est une **action manuelle du prof**, pas une
   fenêtre calendaire.
5. L'élève photographie son travail avec l'iPad.
6. **En quelques secondes**, sa transcription OCR s'affiche, **éditable**.
7. Il relit et modifie.
8. Il **valide**. Tout est sauvegardé.
9. Le prof **ramasse les copies papier**.
10. Le soir ou un autre jour, le prof **déclenche l'analyse en lot** d'un clic. Les retours sont
    produits ; il a accès à tout.
11. **Il corrige les copies à l'écran, dans Palimpseste, retours MASQUÉS par défaut** — il peut les
    survoler à différents grains s'il le veut. *(Dispositif anti-ancrage : il juge avant de voir la
    machine — même esprit que le protocole de ses bancs.)*
12. Il peut **modifier le retour** si besoin.
13. Après lecture, il saisit **une note** et **un commentaire général**, dans **deux champs
    séparés**.
14. Il valide **en masse ou individuellement**.
15. Le retour devient visible aux élèves **quand il coche une case** — avec **obligation pour
    l'élève de valider la lecture** du retour.
16. Il rend les copies papier en classe.

**Conséquences à porter au schéma et aux lots :**
- **`exercices_depots`** : ouverture manuelle du dépôt par le prof (état + horodatage).
- **Nouveaux champs par dépôt de diagnostique** : `commentaire_general`, `corrige_par`,
  `corrige_at`. **⚠️ Le champ `note` est retiré — décision GC25** : Louis garde la note sur la copie
  papier et la saisit dans Pronote, comme aujourd'hui. Aucune note dans Palimpseste.
- **`exercices_retours`** : `published_at` (déjà en liste mécanique) trouve ici son consommateur ;
  `lu_at` devient une **obligation** côté élève.
- **Retour éditable par le prof** — donc une version « originale IA » et une version publiée,
  ou un champ d'édition ; à trancher à l'implémentation.
- **Exigence de latence** : la transcription de ~35 copies doit revenir **en quelques secondes par
  copie**, pendant l'heure de cours. Portée par `exercices_jobs` (GC6), inscrite au lot C4-L4.
- **Loi 25** : la note et le commentaire sont des renseignements personnels — une ligne de plus à la
  table de traitement (GC11).
- **Lien GC25** : il y aura donc bien des **notes** dans Palimpseste, saisies par Louis, distinctes
  des lettres de compétence. À reprendre à GC25.

### GC17 — Les faux négatifs de la calibration deviennent des « surconfiant » injustes
**Décision : OUI, tel quel.**

Valeur **`indetermine`** par défaut quand l'élève affirme un observable **absent** du squelette ;
verdicts conservés **par observable** + **version des questions** ; message reformulé
(« nous n'avons pas vu la même chose ») ; **toute contestation portant sur une citation absente part
directement en file prof** — ce qui satisfait aussi l'exigence d'examen humain de GC11.
*(Sans objet au diagnostique : il n'a pas de temps 3.)*

### GC18 — Cadence plancher des ancres et « ancre + 2 »
**Décision : AUTRE — solution Louis. Un point reste ouvert.**

- **Les diagnostiques obligatoires de septembre, décembre et mars sont déjà au projet** ; s'y
  ajoutent les **évaluations régulières en classe**, qui figurent au **plan d'évaluation**.
- **Solution de Louis** : fixer la cadence à **6 semaines** et **envoyer un signal non bloquant au
  prof quand son plan d'évaluation manque cet objectif** — la correction se fait à la
  planification, pas après coup.
- **Reste à trancher** : si le trou survient malgré le signal, la lettre **gèle**-t-elle (avec la
  mention « en attente d'une mesure en classe »), ou continue-t-elle de monter jusqu'à ancre+2 ?
- **Fraîcheur d'ancre exigée pour le second cran** au-dessus : à confirmer.
- **Ancre aveugle par semestre** : à trancher (voir Questions ouvertes).

### GC19 — Anti-triche sur manuscrit
**Décision : OUI — largement dissous par GC1.**

Le manuscrit ne vit plus qu'en classe, sous surveillance. Restent :
- **`delta_v1_vf` NULL n'est pas 0.** Un diagnostique n'a pas de vf : son delta est NULL. Le lire
  comme un zéro fabriquerait un faux signal de « réceptivité nulle ». À écrire explicitement.
- **Question de restitution à chaud retenue** : 30 secondes au clavier, « ta thèse en une phrase ? ».
  **Placement précisé par Louis : après la vérification de la transcription OCR, avant tout envoi à
  l'IA.** Incohérence forte avec le squelette = signal ; valeur pédagogique propre.

### GC20 — Le sous-effort massif est indiscernable de la difficulté
**Décision : OUI, tel quel.**

Un geste unique au dépôt sur les **conditions** — « j'y ai mis le temps » / « fait au plus vite » /
« pas pu m'y mettre » — **jamais noté, jamais renvoyé comme jugement**. Une mesure déclarée bâclée
ne fait **jamais monter** une lettre. **Trois « pas pu » d'affilée = drapeau prof**, jamais un
allègement.
*Note : le dispositif de +1 hebdomadaire rend ce geste plus fiable — « pas pu m'y mettre » coûte
déjà son point, l'élève n'a rien à gagner à mentir.*

### GC18 (suite) — L'ancre aveugle
**Décision : OUI, sous la forme retenue, avec trois réserves de Louis.**

Ce que la spec ajoute est minuscule : **le bac blanc (et les évaluations corrigées à la main, hors
chaîne IA) est marqué comme ancre aveugle** au calendrier d'évaluation, et **une fois par semestre,
ses résultats sont mis en regard des lettres**. C'est la mise en regard qui est le dispositif, pas
l'évaluation — que Louis fait déjà.

*Précision établie en séance : les **diagnostiques ne peuvent pas** jouer ce rôle — ils passent par
la même chaîne P1/P2, dans les formats que le système enseigne, et ce sont eux qui construisent les
lettres. Un instrument ne s'audite pas lui-même.*

**Trois réserves de Louis, consignées telles quelles :**
1. Il est lui-même **sensible à l'effet de halo** : ses propres lettres au bac blanc ont donc une
   valeur limitée — l'ancre aveugle n'est pas un étalon pur.
2. Le travail de calibration et de conception des compétences vise justement à rapprocher la mesure
   du réel : **une hausse a vocation à être un progrès**, pas un artefact.
3. Il connaît l'effet Goodhart (une mesure qui devient un objectif cesse d'être une bonne mesure),
   le juge **impossible à éviter**, et l'estime **atténué** : les élèves restent en partie aveugles
   à ce qui est précisément mesuré — **le retour ne révèle pas tous les éléments de la mesure**.

→ **Règle de conception qui en découle** : le retour à l'élève **ne révèle jamais la grille complète
des observables**. À écrire.

### GC21 — Injection de prompt par la copie
**Décision : OUI — « je prends la défense ».**

**Constat neuf établi en séance** : la règle 7 du prompt de transcription ne protège plus, puisque
GC1 met tout le formatif au clavier et GC16 laisse l'élève **éditer** sa transcription — l'injection
peut être tapée en aval du rempart. La défense doit donc vivre au niveau de P1 et P2 :
1. **Entrées délimitées** — la copie arrive dans un bloc explicitement balisé, jamais concaténée aux
   consignes ; la consigne dit que ce bloc est du matériau, jamais une instruction.
2. **Validation stricte du schéma de sortie** — une sortie non conforme est rejetée et relancée, pas
   interprétée. *(À moitié fait : le réparateur JSON et le parseur « dernier objet » du banc.)*
3. **Aucun outil attaché** à ces appels — vrai par défaut, à écrire pour que ça le reste.
4. **Copies d'injection ajoutées aux jeux synthétiques du banc.**

*Appréciation de Louis, consignée : l'incitation est faible (le formatif n'est pas noté, et il
corrige la transcription des exercices notés en ayant la copie papier). Argument retenu pour agir
malgré tout : une injection peut aussi corrompre le **retour** affiché ou **fausser silencieusement
une mesure**, donc la télémétrie et l'analyse de fin d'année.*

### GC22 — Retour : intention inférée et citations non namespacées
**Décision : OUI, tel quel.**

`{{GESTE_TENTE}}` = **geste observable dans le texte** (la voix « tu as visiblement essayé » reste,
l'inférence de cause disparaît) · en vf, le « pourquoi » causal devient « ce qui manque encore,
d'après les deux versions » · en lecture, **citations namespacées** `copie_eleve` vs `texte_support`
· `actif = true` exige `fiche.attendus_retour` non vide, sinon état **`retour_degrade`** explicite.

### GC23 — Non-spoiler : borne de classe ≠ borne d'élève
**Décision : OUI, tel quel.**

`borne_amont` **journalisée à la décision** du routeur ; **interdiction d'assigner au-delà de la
position de lecture connue de l'élève** ; à défaut, texte court hors livre.
*Nuance de Louis consignée : les livres lus sont des classiques, le spoiler pèse moins.*

### GC24 — Étalonnage de fin d'année
**Décision : OUI, tel quel.**

Comparer des mesures **de même nature** — diagnostique de septembre contre **passation du même
format en juin**, jamais contre une lettre agrégée (sinon régression vers la moyenne garantie) ;
**groupe à faible assiduité comme contrefactuel** ; **volume assigné et volume terminé journalisés**.
*(Les deux dernières pièces sont produites par le compteur d'assiduité.)*

### GC25 — « Les lettres affichées à l'élève SONT des notes » *(décision actée, contestée)*
**Décision : AUTRE — solution Louis.**

**Position de fond de Louis** : ses élèves ont un **bulletin français** — des notes et des moyennes
**sur 20**. *Les lettres ne sont pas des notes*, et le contexte ne prête pas à confusion.

- **Côté élève, par défaut** : **trajectoire et cible** seulement (« travaillé 4× · en progrès ·
  prochaine étape »). Pas de lettre.
- **Option de l'élève** : celui qui veut voir davantage que des mots vagues peut **afficher les
  courbes de progression et tout le reste**. **C'est l'élève qui choisit** — pas le système.
- **Côté prof** : les lettres, toujours.
- **Aucune note dans Palimpseste.** La note reste sur la **copie papier** et se saisit dans
  **Pronote**, comme aujourd'hui. *(Retire le champ `note` du flux GC16.)*
- **Assiduité** : Palimpseste affiche un **pourcentage**, rien de plus. Louis fait la conversion en
  note de son côté. *« Comme ça, aucune confusion. »*

### GC26 — Latence, relances, deux voix d'IA
**Décision : OUI, amendé — la latence passe à 3 minutes.**

**Contrat de latence : le retour arrive en moins de 3 minutes** — au-delà, « ça perd son sens »
(Louis) — sinon l'élève voit un **état d'attente explicite**, jamais un écran muet.
**Conséquence d'implémentation** : les appels P1 des différentes compétences doivent se lancer **en
parallèle**, sinon le contrat est intenable dès N=2.
Plus : relance minimale via le calendrier existant, badge au tableau de bord, et distinction
visuelle **Calame / Aletheia** renvoyée au design de C5.

---

## SECTION C — corrections mécaniques (C1-C21)
**Décision : OUI à tout**, avec trois précisions.

| # | Correction | Note |
|---|---|---|
| C1 | `essai_fragments` est une valeur de **`contexte`**, pas de `provenance` | |
| C2 | Un seul couple de noms **A/B** dans tout le corpus (les « options A/B » des bancs renommées) | |
| C3 | Le renvoi « §5 » du §0 pointe vers **`00-referentiel.md` §5** | |
| C4 | Régime de cycle **`paires`** défini | *Déjà défini dans `02-exercices.md` §1 — la spec le cite* |
| C5 | Valeurs de **`grain`** (micro/méso/macro) et de **segment** (1-4) énumérées | |
| C6 | **`lu_at` dédupliqué** (il figure sur le dépôt et sur le retour) + horodatage du temps 6 | |
| C7 | ~~`refaire_lisibilite` par version~~ | **Sans objet depuis GC1** : la lisibilité ne vit plus que sur le canal classe, à version unique |
| C8 | **`lettre_equivalente` retirée des squelettes** (fausse précision) ; conservée sur `competences_mesures` | |
| C9 | **Override prof journalisé** (`origine` + entrée de journal) | |
| C10 | **Dépôt des photos par URL signée** (convention d'écritures serveur) | |
| C11 | **Unicité `exercices_references` + validation sur empreinte immuable** | *Déjà acté à GC5* |
| C12 | **`photos[]`** : ordre, rotation, somme de contrôle, page manquante | *Renforcé par le flux GC16* |
| C13 | **`confiance_declaree` sur la v1 seule** | |
| C14 | **Identifiants stables des points du retour** (sans quoi une contestation ne désigne rien) | |
| C15 | **`published_at`** sur le retour | *Consommateur : la case à cocher du flux GC16* |
| C16 | **Problématisation d'écriture = compétence active pour les classes TC seulement** | **Tranché par Louis** : mesurée et entraînée dès que l'élève a du TC dans ses classes, ou que le diagnostique est assigné à une classe TC. Un élève HLP pur ne la voit jamais ; un bi-classe l'a. S'inscrit dans la table des compétences actives par classe (GC7) |
| C17 | **C4-L4 : « 30 copies » → 140** dans le critère de réussite | 70 élèves × 2 passations. Une file qui tient à 30 peut s'effondrer à 140 (débit du fournisseur, engorgement, coupure de coût, expirations) |
| C18 | **C4-L6 : retirer « périmètre de ta revue »** | |
| C19 | **Seuil des « contestations répétées » chiffré** | |
| C20 | **Quota bonus : les minutes non utilisées sont PERDUES** | **Tranché par Louis** — ni report ni écrêtage |
| C21 | **Matrice C6 : afficher `n` tout de suite, la « confiance » seulement quand le modèle de certitude existe** | Application de la règle « pas de fausse précision » à elle-même |

---

## SECTION D — constats écartés (D1-D5)
**Décision : les cinq écartements sont CONFIRMÉS.**

- **D1** — « un seul P1 par copie » : contredit le pilote Argumentation, les 4 runs Structure et les
  3 runs Expression. Design bancé conservé ; seule l'ambiguïté d'écriture est levée (GC9).
- **D2** — « le routeur ciblera Connaissance » : hors rayon du routeur depuis le 17/07 (R4). Ce qui
  reste vrai est traité en GC15 (lettre `differee` au diagnostique).
- **D3** — « surapprentissage du diagnostic » : c'est déjà le chantier **modèle de certitude**
  (§4bis) ; les correctifs concrets sont repris en GC14 et GC15.
- **D4** — « la coupe de repli n'est pas exécutable » : elle est actée et le schéma la supporte ; la
  part vraie (§8 contradictoire, gates, critère de bascule) est reprise en GC3.
- **D5** — « le parcage de la validation OCR est une erreur » : la piste était déjà au parking
  `IDEES_post_rentree.md` ; la convergence indépendante l'a promue en spec (GC16), que Louis a depuis
  largement dépassée avec son flux complet.

---

## Cadre d'exercice de Louis (établi en séance — à retenir pour toute session future)

**Lycée français au Québec** : pédagogie et calendrier français (TC / HLP, bulletin et moyennes
**sur 20**, Pronote, bac blanc), **droit québécois** (loi 25). Élèves de **17 ans et plus** dans leur
immense majorité → au Québec, **le consentement relève de l'élève lui-même** (dès 14 ans) ;
l'information aux parents redevient une **pratique d'établissement**, pas une obligation légale.
*(L'interdiction québécoise des téléphones vise le secondaire ; en cas d'extension, repli sur le
chariot d'iPad — cf. GC15.)*

---

## Questions ouvertes (à trancher avant l'application)

> *Relu le 04/08/2026 (passe de mise en cohérence, chapitre 3) — **deux mentions ne valent plus** : la question ouverte n° 1, « la règle d'espacement des mesures secondaires », est **écrite au `01-routeur.md` §6 depuis le 30/07** *(seul son **plafond de sondes par cycle** reste `[à valider]`, au registre du §11)* · et « corpus → **20 textes** avant la semaine 2 » est renvoyé à `02-exercices.md` §7 par l'amendement **A71**. **La question n° 2 — le régime de modèle — reste ouverte** : c'est l'**ouverture n° 8** du tableau de bord de C3.*

*(Résolues : `provenance` → conservée sous forme de `classe_id` sur la mesure, sa raison étant le
drapeau « transfert » de R6, utile parce que les diagnostiques sont classe-dépendants — un élève
peut sortir B en HLP-Expression et D en TC-Expression. Corpus → 20 textes avant la semaine 2, puis
ajout au fil de l'eau ; validation à l'import de l'injecteur conservée.)*

1. **La règle d'espacement des mesures secondaires** (GC10) : quelle compétence, à quelle cadence ?
   Elle appartient au routeur, pas à C3 — mais elle doit être écrite avant l'allumage.
2. **Le régime de modèle** (D9 du 28/07, **[à valider]**) : Haiku-hebdo / Sonnet-ancres ? Le
   chiffrage de GC6 en dépend, et Louis en fait une priorité.
*(Toutes les autres questions ouvertes ont été tranchées en séance. Pour mémoire :
`commentaire_general` **reste** dans Palimpseste ; l'assiduité se calcule en **semaines faites ÷
(semaines du semestre − semaines de vacances)**, une semaine étant « faite » au seuil configuré
(2/3 ou 3/4) des exercices assignés, le travail de vacances pouvant ajouter **au plus une semaine**
au numérateur ; le cadre légal est québécois et le consentement relève de l'élève.)*

---

## À porter au chemin critique d'août (à consolider en clôture)

> *Relu le 04/08/2026 (passe de mise en cohérence, chapitre 3) — **quatre lignes ne valent plus** : « transcrire **25 copies** → lots (10 puis 5) » *(les deux lots définitifs sont scellés à **11 + 5 = 16 copies** — le compte du `copies-tests/_commun/PROTOCOLE-CALIBRATION.md`, qui fait foi ; décision de Louis, 04/08)* · « 15 copies × **5 compétences de lecture** » *(elles n'existent plus depuis la Décision 2 du 02/08 ; la famille `reception` les remplace)* · « **20 textes** avant la semaine 2 » *(renvoyé à `02-exercices.md` §7 par l'amendement **A71** — 4-6 textes au 25 août, ~10 de plus à l'allumage, 60-80 en croisière)* · « la **règle nouvelle d'espacement** des mesures secondaires » *(écrite au `01-routeur.md` §6 depuis le 30/07)*. **Le reste tient.***

- **Transcrire 25 copies** → constituer les lots de calibration (10 puis 5) par compétence.
- **Golds** : compléter les golds manquants avant lecture des sorties.
- **Corpus lecture synthétique** : générer les copies de lecture (IA en aveugle des gabarits) +
  écrire leurs golds — 15 copies × 5 compétences de lecture.
- **Corpus de textes décomposés + références validées** : **20 textes** avant la semaine 2, puis
  ajout au fil de l'eau.
- **Cœur R1-R6 du routeur** : avant le 25 août (§8 de la spec réécrit). **+ la règle nouvelle
  d'espacement des mesures secondaires.**
- **Lettre Loi 25 prête le 22 août** (table de traitement + vérification auprès du collège).
- *Retiré du chemin critique* : le test de fidélité OCR au banc (décision GC2-a).
