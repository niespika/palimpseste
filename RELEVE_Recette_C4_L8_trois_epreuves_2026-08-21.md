# RELEVÉ — Recette C4-L8 : les trois épreuves, jouées

**21/08/2026 · branche `feat/c4-l8-fabrique` · sandbox `aoakpxxlyvthzueaywna` · Chrome, connecté en
professeur, contre `npm run dev`.**

Séance de recette pure, conduite selon `PROMPT_Recette_C4_L8_trois_epreuves.md`. **Rien n'a été
construit, rien n'a été réparé.** Ce qui a été trouvé est décrit ici et au
`SUIVI_tests_manuels.md` § C4 · L8, avec la règle que ça enfreint.

---

## En un paragraphe

**Les trois épreuves sont jouées. Les quinze de C4-L8 sont cochées.** La porte Codex marche de bout
en bout et son aperçu est juste ; l'opt-out au bouton n'écrit que la classe visée et se rejoue ; la
dévalidation, elle, a rendu sa réponse — elle ferme la conception à venir et **laisse tourner ce qui
est déjà assigné**. Mais la séance a buté sur un défaut qui n'était pas au programme et qui pèse
plus lourd que les trois : **l'application ne lit que 1000 des 3264 routes de la doctrine**, ce qui
vide la banque de consignes de **sept objets sur treize**. Il n'est pas réparé.

---

## 1 · Ce qui est PROUVÉ

### C4L8-1 — la porte Codex, de bout en bout ✅

Les six étapes du `02-` §6 B.2, dans l'ordre, chacune par le bouton :

| étape | preuve |
|---|---|
| dépôt du matériau `genere` | rapport d'import à l'écran : « materiaux : **1 entrée(s)** », 0 refus, 2 signalements |
| validation en file | `mat-lien-codex-0001` → `statut = valide` (`fbd50f7c-…`) |
| conception (porte Codex) | `argument` × `composer` × **cran 3**, `materiau_cible` `genere`/`extrait`, observable `charniere_formule` · structure **pris à la route** → `d15ef81f-…`, `statut = concu` |
| édition | « Instance corrigée. », `updated_at ≠ created_at` |
| **aperçu** | **4 candidats sur une banque de 12** — 3 distracteurs **+ la `reponse_attendue`** ; jamais la banque entière, aucune ligne de correction ; **tirage déterministe** (les mêmes après rechargement) |
| assignation | « 2 dépôt(s) créé(s), `origine` `prof` » → en base : 2 lignes, `origine = prof`, `statut = assigne`, `echeance = 2026-09-29 00:00:00+00` |

⭐ **La porte tient ses deux règles nommées** : `texte_auteur` n'est pas offert dans Codex
(piège 28), et l'aperçu ne fuit ni la banque ni la correction (le constat que le prompt annonçait
comme le plus grave — il est bon).

### C4L8-2 — l'opt-out d'une classe, AU BOUTON ✅

`expression` posée `evaluee` au bouton (« 17 ligne(s) d'élève, la date posée dans le même geste »),
puis **clic** sur « active » de THLP × Expression :

- **THLP** → `active = f`, `updated_at 18:40:32` ;
- **T5 et Test** → `active = t`, `updated_at` **inchangé à `02:38:00`** — rien d'autre n'a bougé ;
- **Synthèse** intacte dans les trois classes ;
- **rejouable** : remis `t`, retiré une seconde fois (`18:41:15`), remis `t`.

### C4L8-3 — la dévalidation d'une référence validée ✅ *(jouée ; sa réponse est au § 3)*

---

## 2 · Ce qui a ÉCHOUÉ, ou n'a pas été réparé

### ⛔ F1 — la doctrine est lue tronquée : **1000 routes sur 3264**

**Ce que la plateforme fait.** `chargerLignesDepuisBase` ([doctrine.ts](utils/fabrique/doctrine.ts))
lit `exercices_routes` par `admin.from('exercices_routes').select(…)` **sans pagination** ; PostgREST
plafonne la réponse à 1000 lignes. Constaté par en-tête, `content-range: 0-999/3264`, **identique sur
trois lectures**.

**Ce que ça fait à l'écran, constaté, pas déduit :**

- porte Codex, `argument` × `composer` × cran 3 → **16 consignes** proposées, la base en route **24**
  *(les 7 routes d'Argumentation manquent, et `connaissance/contresens`)* ;
- porte Codex, `partie` × `composer` × cran 3 → « — choisir une consigne de la banque **(0)** — »
  quand la base en porte **40**. Le `select` est `required` : **l'objet devient inconcevable** ;
- **7 objets sur 13 n'ont AUCUNE route visible** : `paragraphe`, `partie`, `phrase`, `plan`,
  `problematisation`, `reference`, `transition`.

**Où ça mord ailleurs.** La même doctrine tronquée sert la garde serveur
(`empechementsDeConception`) **et** le contrôle d'import de la plateforme
([verifie-import.ts](utils/fabrique/verifie-import.ts)) : un observable pourtant routé s'y ferait
refuser « non routé » — refus n° 15 / blocage n° 3.

**La règle enfreinte.** « L'observable vient **DE LA ROUTE** » (`04-` §0) ; « la banque du couple
objet × mode × cran s'affiche » (`02-` §6 B).

⚠️ **C4L8-15 reste vrai.** Les 3264 routes **sont** en base, et `derive-doctrine.py --verifie` lit
les sources, pas PostgREST : c'est la **lecture applicative** qui plafonne, pas la dérivation.
`exercices_routes` est **la seule des douze tables de doctrine à dépasser 1000 lignes** — la
suivante en porte 336.

**Non réparé, comme la séance l'exigeait.** ⭐ **Tranché par Louis le 21/08 : F1 devient son propre
lot, `C4-L8-bis`, et il passe AVANT C4-L3** — inscrit au `PLAN_DE_CHANTIER.md` §2 et §3, avec la
dépendance portée au graphe. *(Deux voies pour ce lot : paginer la lecture, ou relever « Max rows »
côté projet. La première ne dépend de personne.)*

### ⚠️ F2 — la `reponse_attendue` est toujours le **dernier** candidat

`composerApercu` compose `[...tirerTrois(banque), reponseAttendue]` : la bonne réponse n'est **jamais
mêlée**, elle est en position 4 à tous les coups — deux affichages sur deux. Le commentaire du même
fichier écrit pourtant « QUATRE candidats, **mêlés** ». Le tirage réel de la passation vit au déroulé
(C4-L3) et n'existe pas encore ; l'aperçu, lui, est ce que le professeur relit pour juger le
placement.

### ℹ️ F3 — la consigne dérivée dit « ces **trois** », l'écran en sert **quatre**

La banque écrit « Parmi ces trois mots de liaison… » ; l'aperçu affiche 3 distracteurs **plus** la
`reponse_attendue`. La réécriture de la formulation par le professeur suffit à le corriger — c'est
ce qui a été fait — mais **la source rendra « trois » à chaque dérivation**.

---

## 3 · Ce que la dévalidation fait *(la seule des trois dont on ne savait pas la réponse)*

Retour affiché : « **Référence dévalidée : aucune instance NEUVE ne peut plus se concevoir dessus.
1 instance(s) déjà bâtie(s) sur ce texte ne sont pas défaites — retirez-les une à une si c'est ce que
vous voulez.** »

**Ce qu'elle ferme, immédiatement :**
`validee_at` et `validee_par` → `null` · la porte **Aletheia n'offre plus aucun texte** (1 avant,
**0 après**) · la référence **revient en file** (« Les références à valider » : 1 → **2**) · la garde
serveur de `concevoirInstance` refuse en source **comme en cible**.

**Ce qu'elle ne fait pas :**
l'instance `473b2c25-…` **reste `assigne`**, `bloque = f`, `blocages = []`, `updated_at` inchangé ·
ses **2 dépôts restent `assigne`** avec leur échéance · son écran ne porte **aucun bandeau** et le
bouton **« Assigner à la classe » y reste actif** (`assignerALaClasse` ne lit jamais la référence) ·
le texte **reste `valide` et non bloqué** au corpus — `validerReference` lève son blocage,
`devaliderReference` **ne le repose pas**.

⭐ **Verdict — la règle est LAISSÉE OUVERTE, ni satisfaite ni dépassée.** Le `02-` §6 A veut
qu'**aucune** instance ne tourne sur une référence non relue et le `08-` §7 en fait son blocage
n° 1 ; la plateforme l'applique **à la conception à venir**, le **dit honnêtement**, et **ne retient
mécaniquement rien de ce qui est déjà assigné**. Avec `exercices_actif` à OFF, aucun élève n'a rien
vu ; le jour où il passe à ON, l'écart devient réel.

---

## 4 · Vu, sans savoir l'interpréter

1. **L'opt-out n'est pas là où la règle le loge.** Le `07-` §1.3 dit « au **profil de la classe**, au
   tableau de pilotage » ; il vit à **`/prof/competences` §4**, en matrice classes × compétences. Le
   profil de classe *a* un onglet « Compétences » (`?vue=competences`) : c'est une **« Zone en
   construction »** avec cinq colonnes inventées *(Analyser · Interpréter · Argumenter ·
   Problématiser · Conceptualiser)* et « Aucune donnée réelle » — **ce ne sont pas les six du `07-`
   §1.2**. Écran antérieur à C4, hors périmètre du lot.
2. **Le relevé du 20/08 se trompait sur un point de fait** : il annonçait « aucun matériau `genere`
   pour un couple objet × `composer` utilisable » ; la banque en portait **deux**
   (`mat-garant-a`, `mat-garant-b`, `argument` × `composer`, `valide`). Le dépôt a été fait quand
   même — c'est le geste que l'épreuve demandait.
3. **Deux interrupteurs hors périmètre sont à ON en sandbox** : `rag_actif = true` et
   `plan_evaluation_actif = true`. Constaté, non touché — hors C4-L8, et la mémoire de projet les
   disait à OFF. *Question ouverte : est-ce voulu ?*
4. **Re-valider une référence lui donne une nouvelle date.** Après remise en état, `validee_at` vaut
   `2026-08-21 18:44:48+00` au lieu de `02:46:41` : l'état est le même, l'horodate ne l'est pas.
5. **Une autre séance a écrit dans le dépôt PENDANT celle-ci.** À `14:38` heure locale — entre
   l'épreuve 1 et l'épreuve 2 — `SUIVI_SQL.md`, `scripts/derive-doctrine.py` (`OUTIL` **1.1 → 1.2**)
   et `utils/fabrique/doctrine.fixture.json` ont été modifiés sur disque. **Ce ne sont pas mes
   écritures** ; la ligne de journal qu'elles posent dit elle-même n'avoir **aucun accès réseau à la
   base** et n'être **pas exécutée**. **Vérifié par requête : la doctrine en sandbox n'a pas
   bougé** — `doctrine_derivation` s'arrête à la **quatrième passe**, `outil 1.1`,
   `2026-08-21 16:05:41+00`, et `exercices_routes` comme `exercices_consignes_isolees` portent ce
   même `derive_at`. Les constats de cette recette portent donc bien sur l'état que le prompt
   décrivait. ⚠️ **Le dépôt est désormais en `1.2` et la base en `1.1`** : la passe reste à jouer.
6. ✔️ **Le balisage markdown se rend à l'écran** (`« **Parmi ces trois…** »`, `**la raison manque**`).
   **Conforme à l'arbitrage du 21/08** — rendu restreint attendu de C4-L3. Constaté, **non réparé**,
   comme le prompt le demandait.

---

## 5 · Clôture — remises en état, vérifiées PAR REQUÊTE

| | attendu | constaté |
|---|---|---|
| `exercices_actif` · `routeur_actif` · `competences_affichage_actif` · `fabrique_actif` | OFF | **`f · f · f · f`** |
| statuts de recette | `mesuree_silencieusement` | **expression 17 · synthese 17 · monitoring 17+17** |
| `competences_actives_par_classe` | 6 lignes `active = t` | **6/6 à `t`** |
| références | 1 validée, 1 non | **conforme** (`ff46eabc` validée, `8157a2a9` non) |
| textes | `txt-descartes-med2` valide · `txt-bloque-0001` bloqué | **conforme** |

**Le décor ajouté est DÉCRIT, pas retiré** — ces lignes *sont* la preuve de C4L8-1 :

| | identifiant | ce que c'est |
|---|---|---|
| matériau | `mat-lien-codex-0001` · `fbd50f7c-36e3-495c-9a8d-8b4e3e2c0cd3` | `argument` × `composer`, famille « le lien manque », `valide` |
| import | `recette_c4l8_materiau_codex.json` | la trace du dépôt |
| instance | `d15ef81f-f3bc-4d24-bbad-f15adbe57a88` | cran 3, conçue **par la porte Codex**, assignée à **T5** |
| dépôts | 2 lignes | `origine = prof`, échéance `2026-09-29` |
| cas | 1 ligne | 12 distracteurs en banque |

**Comptes avant → après** : `exercices` 4 → **5** · `exercices_depots` 12 → **14** ·
`exercices_cas` 6 → **7** · `exercices_materiaux` 2 → **3** · `exercices_imports` 6 → **7**.
`exercices_textes`, `exercices_sujets`, `exercices_demonstrations` **inchangés**.
**Aucune table `aletheia_*`, `scriptorium_*` ni `profiles` n'a été touchée**, et
`utils/fabrique/verifie-import.ts` n'a pas été ouvert.

**Aucune migration n'a été écrite ni jouée** : `SUIVI_SQL.md` n'a pas de ligne à recevoir.

---

## 6 · Ce qui a été tranché — Louis, le 21/08

_Les cinq questions ont été posées à la clôture et tranchées le jour même. **Chaque décision est
inscrite là où elle sera relue**, pas seulement ici._

| # | question | décision | où elle est inscrite |
|---|---|---|---|
| 1 | F1 mérite-t-il son propre lot, et quand ? | **Oui — son propre lot, AVANT C4-L3.** | `PLAN_DE_CHANTIER.md` §2 et §3 : lot **`C4-L8-bis` — la doctrine lue en entier**, et C4-L3 en dépend au graphe |
| 2 | F2 : corriger l'aperçu, ou laisser C4-L3 ? | **Laisser C4-L3.** L'aperçu du professeur reste **déterministe** — c'est ce qui permet de le relire deux fois sans qu'il change ; **le mêlage appartient au tirage réel de la passation**. | `PLAN_DE_CHANTIER.md` §5, **9ᵉ item de la boîte de C4-L3** |
| 3 | l'écart de C4L8-3 : un mécanisme, ou le message ? | **Le message honnête suffit** *(« je crois » — le doute est noté avec la décision)*. Aucun mécanisme ne sera posé. ⚠️ **Ce qui la rouvrirait** : une passation réelle sur une référence dévalidée en cours de route. | `PLAN_DE_CHANTIER.md` §6 |
| 4 | l'opt-out doit-il déménager ? | **Oui, au profil de la classe**, comme le `07-` §1.3 l'écrit. Deux gestes : déplacer `OptOutClasses.tsx` *(l'action ne bouge pas)*, et décider du sort de la « zone en construction ». | `PLAN_DE_CHANTIER.md` §6, **lot de correctifs** |
| 5 | le décor de recette reste-t-il ? | **Il reste.** Et il **disparaîtra de lui-même** au montage de la prod propre — vérifié au RUNBOOK, pas supposé *(voir ci-dessous)*. | `SUIVI_SQL.md`, note « Où est la sandbox ? » |

**Et le fichier d'import entre au dépôt** : `scripts/recette/recette_c4l8_materiau_codex.json`, documenté
au `scripts/recette/LISEZ-MOI.md` — il se rejoue par `deposer-import.mjs`, et **il est idempotent**.

---

## 7 · Le décor et la prod propre — vérifié au RUNBOOK

**Question de Louis : « quand je ferai la migration vers une base prod propre, ils disparaîtront,
non ? » — OUI, et sans aucun geste, SI C11b suit le `RUNBOOK_prod_propre.md` tel qu'il est écrit.**

La prod se monte en **`--schema-only`** *(étape 2)*, puis reçoit une **liste blanche** de six tables
de config *(étape 3 : `modules`, `calendrier_params`, `codex_params`, `aletheia_params`,
`integrite_params`, `fragments_semestres`)*. **Aucune table de C4 n'est sur l'une ni l'autre liste** :
la prod naît **sans une seule ligne** d'`exercices`, `exercices_depots`, `exercices_cas` ou
`exercices_materiaux`. Le décor de recette ne survit pas au passage.

⚠️ **Mais trois choses à savoir avant de s'y fier :**

1. **La doctrine dérivée disparaît avec.** `exercices_crans`, `exercices_routes` *(3264 lignes)*,
   `exercices_consignes_isolees`, les patrons, les guides, `exercices_types*` : ce n'est **pas** de
   la donnée d'élève, c'est de la **config**, et sans elle **aucun écran de la fabrique ne
   fonctionne**. Le RUNBOOK date du **30/06**, avant que C4 existe — il ne pouvait pas le prévoir.
   **À trancher à C11b** : la **re-dériver** sur la prod (`derive-doctrine.py --sql`) ou l'ajouter à
   la liste blanche. ⭐ **La première est la bonne** — « la doctrine est dérivée, jamais tapée », et
   la re-dériver rejoue le crible « cite ou refuse » contre les sources.
2. **L'étape 3 est cassée en l'état** : elle dumpe `--table=public.fragments_semestres`, table
   **droppée** par `calendrier_c1b_cutover.sql` — vérifié par requête le 21/08, `to_regclass` rend
   `NULL`. `pg_dump` échouera « no matching tables » et **ne produira aucun dump de config**.
   *(Constat déjà porté par l'`AUDIT_Consolidation_2026-07-02.md` — il tient toujours.)*
3. **Si C11b se fait autrement** — restauration d'une sauvegarde du dashboard, ou `supabase db dump`
   avec les données — **tout voyage, décor compris**. C'est la méthode qui décide, pas la table.

*Les trois points sont inscrits au `SUIVI_SQL.md`, dans la note « Où est la sandbox ? », à côté du
« à trancher à C11b » qui y vivait déjà.*
