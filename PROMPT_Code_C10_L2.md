# PROMPT — Session Code : C10-L2 — « Le professeur clôt les dépôts d'une passation »

> **À coller dans une session Claude Code fraîche.** Une session, un lot. Fabriqué le **2026-09-05** avec `C10-L1` *(`PROMPT_Code_C10_L1.md`)* ; **il se joue après lui, ou seul — il n'en dépend pas.**

## Ce que Louis a demandé, mot pour mot

> *« Sur les dépôts en classe (ceux du 24, 25 et 26) il va me falloir un bouton : Clore les dépôts. Pour empêcher les élèves de déposer de nouveaux documents. »* — *« Les exercices que j'assigne, c'est moi qui les clos à la main. »*

**Mesuré en prod le 05/09** : cycle du 24/08, **70 dépôts de passation en classe** *(25 et 26 août, échéances posées à la main)*, dont **15 encore `ouvert` chez 13 élèves** — ouverts en classe, jamais remis, sans brouillon. Rien ne les ferme ; ils restent dans « à faire ».

## Le contrôle d'entrée

✅ **L'entrée `C10-L2` est écrite au `07-Implementation.md` §2, chapitre `### C10 — la semaine se ferme`** *(05/09 au soir, à la demande de Louis ; `07-` **2.78**)* : elle fait foi, vérifie qu'elle porte mission, « fait quand » et manifeste, et **tu n'écris rien dans le `07-`**. ⛔ **Aucun interrupteur — décision de Louis du 05/09.** Versions au 05/09 : `07-` **2.78**, `02-` **6.5**, `06-` **2.6**. **Manifeste** : `07-` §1.1 *(les statuts : `abandonne` = « non-geste de l'élève », au dénominateur, exclu des règles de stagnation ; `retire` = décision du professeur, hors dénominateur « pour l'avenir seulement »)* et §2 entrée `C4-L4` · `02-exercices.md` §6.D *(la passation en classe)* · `06-Palimpseste.md` §5.

## La mission

**Un bouton « Clore les dépôts » sur la page d'une passation en classe** *(`app/prof/codex/passation/[exerciceId]/page.tsx` et sa jumelle Aletheia)*, **miroir de « Ouvrir les dépôts »** *(`actionOuvrirLesDepots`, `app/passation/actions.ts` ; `ouvert_par_prof_at`, `utils/passation/depots.ts`)*. Il pose **`abandonne`** sur les dépôts de l'instance dont le statut est `assigne` ou `ouvert`. Rien d'autre.

## Les pièges

1. ⛔ **`abandonne`, pas `retire`, pas `clos`, pas `non_fait`.** `retire` sort l'élève du dénominateur *(c'est une décision du professeur qui absout)* ; `clos` compte comme rendu *(`STATUTS_RENDUS`, `utils/routeur/assiduite.ts`)* ; `non_fait` est réservé au ratissage d'intégrité *(`02-` §6, item 77)*. **`abandonne` reste au dénominateur sans compter comme rendu** — l'élève absent ou qui n'a pas remis pèse comme un non-rendu, ce que Louis veut. Il s'affiche déjà « abandonné », ton `clos` *(`etatDeLExercice`, `utils/codex-onglets/regles.ts`)*, donc **il quitte « à faire » de lui-même**.
2. ⭐ **Le chemin de remise refuse déjà** : `utils/passation/depots.ts` — `if (statut === 'retire' || 'abandonne' || 'clos') return refus('Ce dépôt est clos.')`. **Ne réécris pas cette garde**, éprouve-la : après clôture, une remise de photos sur un `ouvert` fermé est refusée.
3. ⛔ **Les copies remises ne bougent pas** : `v1_remis`, `retour_publie`, `vf_remis`, `clos`, `non_fait`, `retire` sont hors du geste. Idempotent : un second clic ne change rien et le dit *(« 0 dépôt à clore »)*.
4. ⭐ **Confirmation, JAMAIS un refus** *(règle du panneau d'intégrité, 01/09)* : le bouton annonce **combien** de dépôts vont passer à « abandonné » et **lesquels** *(noms des élèves)*, puis demande la confirmation. Le geste se **journalise** comme le retrait *(`07-` §1.5 : « il passe par l'override et se journalise »)* — cherche où le retrait écrit son journal *(`/prof/routeur?vue=assignation`, `C4-L13` §6)* et écris au même endroit, avec le motif `cloture_prof`. Si aucun journal ne convient, dis-le au relevé plutôt que d'en ouvrir un.
5. ⚠️ **L'assiduité de la semaine déjà comptée ne bouge pas** *(la ligne existe, `retraitCompteDansLaSemaine` rend `recalculer: false`)* : clore les 15 dépôts du 24/08 aujourd'hui **ne change aucun chiffre** montré au professeur, et c'est correct. Sur une semaine **en cours**, un `abandonne` posé avant le comptage compte comme non rendu — dis-le dans la confirmation quand la semaine n'est pas encore comptée.
6. ⚠️ **Les assignations à la main de la MAISON** *(`assignerALaClasse`, `app/prof/conception/actions.ts`)* n'ont pas de page de passation. **Hors de ce lot** : une ligne à la boîte du plan, et Louis nomme le bouton s'il le veut.
7. ⚠️ **`supabase-js` ne lève pas** : l'`update` en lot rend `{ error }` ; compte les lignes touchées et confronte au compte annoncé.
8. ⛔ **Aucune migration, aucun interrupteur.** `abandonne` est dans la contrainte `exercices_depots_statut_check` depuis `c4_l8_fabrique.sql`.

## Fait quand

> Sur la page d'une passation en classe, **« Clore les dépôts » annonce les dépôts `assigne`/`ouvert` de l'instance avec les noms, demande confirmation, les passe à `abandonne` en les comptant, se journalise, et se rejoue sans effet** ; **une remise après clôture est refusée « Ce dépôt est clos. »** ; les copies remises sont intactes ; les listes élève ne montrent plus ces dépôts dans « à faire » ; **prouvé en bac à sable par un script laissé au dépôt** *(`scripts/recette/couture-c10l2.mjs`, décor posé et retiré)* et à l'œil aux trois largeurs. Section `C10-L2` au `SUIVI_tests_manuels.md`. ⛔ `git add -A` interdit ; pousser, c'est déployer — **et Louis presse le bouton en prod lui-même, sur les 15 du 24/08, quand il veut.**
