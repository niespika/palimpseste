# SUIVI_tests_manuels — validation humaine avant merge

> **Protocole.** Chaque spec/session ajoute sa section ici au moment où elle est écrite ou close
> (Cowork s'en charge, à partir du rapport de clôture de Code). Un test coché `[x]` = soldé
> (joué et validé, ou explicitement couvert autrement — la note de fin de ligne fait foi).
> Coche toi-même au fil de tes tests, ou dis-le en session (« coche C1C-3 ») et c'est fait.
>
> **Règle d'or (apprise le 24/07) :** toujours tester dans un vrai navigateur (Chrome), jamais
> dans l'aperçu embarqué de Code — les dialogues natifs (`confirm()`) y sont muets et tous les
> boutons à confirmation semblent morts. Et Cmd-R avant de conclure à un bug : un onglet resté
> ouvert pendant les hot-reloads du dev server finit par mentir.

## C1 — Robustesse · Session C (commit `c205e7b`, sur `feat/c2-l8-calibration`)

_Sessions A et B closes avant la création de ce fichier (tests faits à leur clôture) — le suivi
démarre ici._

**✅ Chantier C1 clos le 24/07.** 2·3·5·6·7 joués et validés ; 1 et 4 soldés par revue de code
et tests unitaires ; 8 et 9 non joués, risque accepté (dégradation propre couverte par la revue).

### C-a — Redirection sûre `/auth/confirm` + flux d'invitation

- [x] **C1C-1 · Lien piégé.** Visiter `/auth/confirm?token_hash=<token valide>&type=recovery&next=//evil.com`, puis la variante `next=/.//evil.com` → après vérification, atterrissage sur `/finaliser-inscription`, jamais sur evil.com. _(Soldé hors E2E le 24/07 : le wiring est vérifié dans la route — `cibleInterneSure` calcule la cible sûre AVANT `verifyOtp`, un `next` piégé ne peut donc atterrir que sur un chemin interne, token valide ou pas — et les 12 tests unitaires couvrent `//evil` et `/.//evil`. L'essai E2E butait sur un token déjà consommé → `/login?erreur=lien` avant toute redirection : chemin sûr attendu. Recette si on veut le jouer un jour : nouvelle invitation, NE PAS cliquer le lien de l'email, y remplacer la valeur de `next` par `//evil.com`, visiter.)_
- [x] **C1C-2 · Flux normal.** Inviter un élève test (`/prof/eleves`) → email reçu → clic sur le lien → « finaliser l'inscription » → mot de passe → arrivée sur `/eleve` → déconnexion → reconnexion via `/login`. Rien ne casse. _(Validé le 24/07.)_

### C-b — Fiche canonique (continuité inter-chapitres + génération partielle)

- [x] **C1C-3 · Continuité.** Régénérer les fiches d'un livre test multi-chapitres (« ↻ Régénérer les fiches (IA) » en vue-livre) → comparer avant/après : concepts nommés de façon cohérente d'un chapitre à l'autre, thèses qui se répondent. _(Validé le 24/07 — sur Chrome, après l'épisode du bouton muet dans l'aperçu de Code.)_
- [x] **C1C-4 · Partiel.** Si une génération échoue sur une séance : (a) les autres séances gardent leurs fiches, (b) bandeau « ⚠ Référence incomplète — séance X » en vue-livre, (c) séance « à générer » dans le rail, (d) régénérer comble le trou. _(Difficile à provoquer volontairement — soldé par la revue de code, décision du 24/07.)_
- [x] **C1C-5 · Non-régression.** Sur une référence complète : fiche prête, diagnostic, synthèse élève — rien ne régresse. _(Validé le 24/07.)_

### C-c — Retour V1 nourri par la fiche canonique

- [x] **C1C-6 · Qualité.** Séance test avec fiche prête → soumission d'un V1 par un élève → relances mieux ciblées/ancrées qu'avant, mais toujours socratiques : aucune réponse donnée, la fiche n'est jamais citée ni révélée. _(Validé le 24/07.)_
- [x] **C1C-7 · Anti-spoiler.** Le retour V1 de la séance N ne dit rien de la suite du livre. _(Validé le 24/07.)_
- [x] **C1C-8 · Repli sans fiche.** Référence pas encore générée (ou séance sans fiche) → le V1 fonctionne quand même (texte seul), sans erreur. _(Non joué — risque accepté le 24/07 ; le repli est couvert par la revue de code.)_
- [x] **C1C-9 · Override prof.** Prof ayant édité `prompt_feedback_1` en base → le V1 fonctionne toujours (fiche simplement non injectée — dégradation propre). _(Non joué — risque accepté le 24/07 ; couvert par la revue de code.)_

_Clos → prochaine étape : merge de `feat/c2-l8-calibration` dans `main` (elle embarque aussi Session B et le banc de calibration L8)._

## C8 · L1 — Fragments : remise en marche du calendrier et des semaines (branche `feat/c8-fragments`)

_Diagnostic complet : `RAPPORT_Diagnostic_C8_semaines.md`. Ce qui a pu être prouvé sans session
prof est déjà soldé (répétition à blanc en base, en transaction annulée + 142 tests unitaires
verts). **Ce qui reste ci-dessous demande un vrai navigateur, connecté en prof** — je n'ai pas de
compte prof de test. Rappel de la règle d'or : Chrome, pas l'aperçu embarqué, et Cmd-R avant de
conclure à un bug._

**État de la sandbox au 13/08 (point de départ des tests) :** semestre actif « Semestre test 2 »
(01→31/07), **0 semaine**, 0 dépôt. Le semestre archivé « Semestre test » a ses 15 semaines.

- [x] **C8L1-1 · Le mensonge est parti (à jouer AVANT tout clic — c'est LE test du chantier).**
  `npm run dev`, prof → `/prof/calendrier/config?section=semestres`. La carte « Semestre test 2 »
  doit dire **« Aucune semaine générée — Fragments n'affichera rien et aucun élève ne pourra
  déposer »** avec un bouton **Générer les semaines**, et le rail doit porter la pastille
  « semaines à générer ». _(Avant ce lot, ce même écran affichait sereinement « 5 semaines ».)_
  _(**Joué et validé le 13/08**, session prof, panneau navigateur : les deux mentions sont là.)_
- [x] **C8L1-2 · Réparation d'un clic.** Presser « Générer les semaines » → la mention d'écart
  disparaît. `/prof/fragments-erudition` liste alors **5 semaines** (S1 à S5), fermées.
  _(**Validé le 13/08** : `regenererSemaines` en 854 ms, 5 lignes créées, échéances au dimanche
  23:59:59 heure de Toronto, l'écart a disparu de la carte et du rail.)_
- [x] **C8L1-3 · Un semestre neuf naît AVEC ses semaines (la vraie correction de la cause).**
  Créer un semestre de test (p. ex. 24/08 → 19/12) → **sans toucher à quoi que ce soit d'autre**,
  ses semaines doivent déjà exister. Aucune mention d'écart sur sa carte.
  _(**Validé le 13/08** : « Semestre C8 test » 24/08 → 19/12 créé depuis l'écran, carte
  « 17 semaines », aucune mention d'écart, aucune pastille au rail — 17 lignes en base,
  première échéance dimanche 30/08 23:59:59 Toronto.)_
- [x] **C8L1-4 · Les vacances resserrent la numérotation.** Sur ce semestre, ajouter une période
  de vacances au milieu → sans presser aucun bouton, la numérotation de Fragments doit sauter la
  semaine concernée et les suivantes se renuméroter.
  _(**Validé le 13/08** : période « Relache de novembre » 02→08/11 ajoutée → la semaine du 02/11
  passe `is_vacation = true` / `pedagogical_number = null`, et celle du 09/11 passe de 12 à 11.
  Suppression non rejouée — même chemin de code. **Deux effets de bord repérés au passage, notés
  dans `IDEES_post_rentree.md`** : la ligne en vacances garde son ancien `numero` (doublon en
  base, invisible dans l'app) et `synthese-semestre.ts` compte les semaines de vacances dans son
  taux de dépôt — bug préexistant que ce chemin rend plus probable.)_
- [ ] **C8L1-5 · Dépôt élève de bout en bout (critère de sortie du lot).** ⚠️ **Prérequis :
  définir « Semestre C8 test » ACTIF** — l'écran élève ne lit que le semestre actif, et les
  échéances de « Semestre test 2 » sont toutes dans le passé (juillet), donc tout dépôt y serait
  légitimement « en retard ». Puis : ouvrir une semaine (« Rouvrir » sur
  `/prof/fragments-erudition`), se connecter avec le compte élève de test d'une classe qui a le
  module (`Test` ou `T5`), déposer une photo → dépôt accepté, statut **« Déposé »** et **pas
  « En retard »**, et le prof le voit sur `/prof/fragments-erudition/semaine/<id>`.
  _(**Validé le 13/08**, session élève réelle (Elo, classe Test) : « Semestre C8 test » passé
  actif, semaine 1 rouverte (échéance dimanche 30/08), dépôt d'une photo → `statut = depose`,
  1 photo en base, la tuile élève passe à « À jour » et l'écran affiche « ✓ Déposé ». La photo
  était une **image JPEG synthétique générée dans la page** (le panneau navigateur n'a pas de
  sélecteur de fichiers) — toute la chaîne réelle a tourné : compression cliente, upload Storage,
  action `deposerCompteRendu`, calcul du statut, puis l'analyse IA en `after()`.)_
- [ ] **C8L1-6 · L'échéance est à l'heure de l'école (item 7).** Sur cette semaine, l'élève doit
  lire « À rendre avant la fin du **dimanche** … » et le prof « Limite : fin du … » — **le même
  jour des deux côtés**, et le dimanche, jamais le lundi. Même contrôle sur
  `/eleve/calendrier` : la pastille « Fragment S*n* — à rendre » tombe le **dimanche**.
  _(Avant ce lot, l'échéance valait minuit UTC = samedi 20 h à Toronto : un dépôt du dimanche
  était compté en retard.)_
  _(**Validé des deux côtés le 13/08.** Prof : « Limite : fin du 30 août », « fin du 6 septembre »,
  … tous des dimanches. Élève : « À rendre avant la fin du **dimanche 30 août** » — même jour —
  et `/eleve/calendrier` place « Fragment S1 — à rendre » le **dimanche 30**, S2 le dimanche 6,
  S3 le 13, S4 le 20 : aucun décalage au lundi, c'est exactement la régression qu'évite le
  remplacement du `.slice(0,10)`. Preuve indépendante en base : les semaines neuves rendent
  `dimanche 23:59:59.999` en heure de Toronto, là où les 15 semaines du semestre archivé, non
  régénérées, rendent encore `samedi 19:00:00` — le bug d'origine, visible côte à côte. Cas DST
  réel au passage : la semaine 10 tombe le **1ᵉʳ novembre 23:59:59 local**, jour du retour à
  l'heure d'hiver.)_
- [x] **C8L1-7 · Non-régression du reste du calendrier.** `/prof/calendrier`, `/eleve/calendrier`
  et le tableau de bord élève s'affichent sans erreur ; la bande « Semaines du semestre » du volet
  Vacances est verte (« *n* semaines ✔ ») une fois la génération faite.
  _(**Validé le 13/08** : les trois écrans rendus sans erreur en session prof puis élève, bande
  verte après génération, aucune erreur console ni serveur.)_
- [ ] **C8L1-8 · Reprise du test reporté C11a-8 (part Fragments).** Une fois un dépôt analysé, la
  tuile « Coût API » de `/prof` doit voir monter la ligne **Fragments**. _(Reporté ici le 26/07 :
  la création de semaines était bloquée, on ne pouvait pas produire d'analyse.)_
  ⚠️ **Joué le 13/08 — ÉCHOUE, et pas à cause de C8.** L'analyse a tourné et écrit son coût
  ($0,028 dans `fragments_analyses.cout_api`), mais `api_couts` n'a reçu aucune ligne `fragments` :
  la chaîne Fragments n'appelle `enregistrerCoutApi()` nulle part. Câblage manquant de C11a →
  correctif décrit dans `IDEES_post_rentree.md`. **Ne pas recocher avant ce correctif**, et
  vérifier Codex au même moment. Le test a fait son travail : il était reporté ici pour être
  enfin jouable, et il l'a été.

> **État de la sandbox après la recette du 13/08 — nettoyée.** Le semestre de recette
> « Semestre C8 test » (24/08 → 19/12) a été effacé avec ses 17 semaines, sa période de vacances,
> le dépôt de test, sa photo (bucket `fragments` compris) et son analyse — dans une transaction,
> après remise de « Semestre test 2 » en semestre actif **par l'écran**, pour ne jamais laisser la
> base sans semestre actif. Vérifié après coup : 2 semestres (1 vivant, 1 archivé), 0 semaine
> orpheline, 0 dépôt, 0 photo, 0 analyse.
>
> **Ce qui RESTE volontairement :** les **5 semaines de « Semestre test 2 »** générées au test
> C8L1-2. Elles ne sont pas un résidu de recette — elles réparent le trou constaté le 24/07
> (semestre actif sans une seule semaine). Le semestre archivé garde ses 15 semaines intactes,
> y compris leur ancienne `date_limite` à minuit UTC (cf. Q4 du diagnostic).
>
> **Note de méthode, à ajouter à la règle d'or du haut de ce fichier.** Le panneau navigateur de
> Code a un décalage de coordonnées : un clic visant l'image de la capture n'atterrit pas au même
> endroit que dans le viewport. Plusieurs boutons ont paru **morts** alors que l'app répondait
> parfaitement — même conclusion fausse que le piège `confirm()` documenté en tête de fichier,
> pour une cause différente. **Réflexe : avant de conclure à un bouton mort, regarder les logs du
> serveur de dev** (l'action serveur y apparaît nommément, avec sa durée) **ou la base**. C'est ce
> qui a évité de diagnostiquer un faux bug deux fois dans la séance.

**Soldé sans navigateur, le 13/08 (n'a pas besoin d'être rejoué) :**

- [x] **C8L1-A · La base accepte le flux.** Répétition à blanc sous l'identité réelle du prof puis
  de l'élève (`set local role authenticated` + `request.jwt.claims`, transaction **annulée**) :
  `est_prof()` → `t`, insertion des 5 semaines du semestre actif, rejeu idempotent de la mise à
  jour, puis insertion d'un dépôt élève sur la semaine 1. `ROLLBACK` → sandbox intacte (0 semaine,
  0 dépôt, vérifié après coup). Aucune policy ne bloque le chemin.
- [x] **C8L1-B · Le calcul des semaines est juste.** Rejeu hors ligne de la génération sur les
  données réelles : elle redonne **exactement** les 15 semaines du semestre archivé (mêmes dates de
  début, mêmes numéros, mêmes sauts pour les deux périodes de vacances) et 5 semaines pour le
  semestre actif.
- [x] **C8L1-C · Fuseau et heure d'été.** 10 tests de garde (`utils/calendrier-semaines.test.ts`),
  dont les deux dimanches de bascule DST 2026 à Toronto (8 mars, 1ᵉʳ novembre) et un invariant
  « le jour lu est le jour demandé » sur 4 fuseaux × 4 dates. `npm test` : **142/142**.
  `npm run build` et `npx tsc --noEmit` : verts.

## C8 · L2 — Fragments : validation par lot et bugs de fond (branche `feat/c8-fragments`)

_Diagnostic de l'item 4 : `RAPPORT_Diagnostic_C8_expression.md`._

**✅ Recette jouée et VERTE le 13/08**, en session prof réelle sur la sandbox, sur une pile de test
fabriquée dans la classe **Test** (élèves fictifs, autorisation Louis). Sandbox **nettoyée** ensuite —
voir l'encadré en fin de section.

**Soldé sans navigateur (n'a pas besoin d'être rejoué) :**

- [x] **C8L2-A · La répartition d'un lot ne touche que ce qu'elle annonce.** 13 tests de garde
  (`utils/validation-lot.test.ts`) sur une classe portant les cinq cas d'une vraie semaine (à
  valider, déjà publiée, en cours, en erreur, déposée sans analyse, rien rendu) : « Publier » ne vise
  que les `generee`, « Dépublier » que les `publiee`, « Relancer » tout dépôt coché ; un élève sans
  dépôt n'entre dans aucun lot ; chaque cible relie le **bon** dépôt au **bon** élève (une inversion
  relancerait l'analyse d'un élève sur l'historique d'un autre) ; la case d'en-tête reste décochée
  sur une pile vide.
- [x] **C8L2-B · Le prompt hebdo retombe sur son défaut.** 10 tests
  (`utils/prompt-fragment.test.ts`) : config absente, champ vidé (**chaîne vide**, pas `NULL` — la
  colonne est `NOT NULL`), champ d'espaces → défaut du code ; une personnalisation réelle l'emporte
  sans fuite du défaut ; aucun `{{placeholder}}` ne survit ; les sentinelles anti-injection de
  l'historique élève tiennent.
- [x] **C8L2-C · Le dépôt compile et passe.** `npm test` **165/165**, `npx tsc --noEmit` et
  `npm run build` verts (toutes les routes `/prof/fragments-erudition/*` bâties).
- [x] **C8L2-D · L'écran de semaine rend sans erreur.** Session prof réelle, `/prof/fragments-erudition`
  puis la vue Semaine 1 · classe Test : colonne de sélection présente, cases **désactivées** faute de
  dépôt (comportement attendu), 0 erreur serveur, 0 erreur console applicative.

**Joués en session prof sur la sandbox, le 13/08 :**

- [x] **C8L2-0 · La pile de test (préalable, pas un test).** 5 dépôts posés en base sur la Semaine 1
  de « Semestre test 2 », classe **Test**, portant **tous les cas de bord d'une vraie semaine** :
  3 analyses « à valider », 1 déjà publiée, 1 encore « en cours », 1 élève sans dépôt, 1 dépôt en
  retard, 1 signal d'intégrité. Analyses écrites directement (pas d'appel au modèle) : ce qu'on teste
  ici est la **validation**, pas la génération.
- [x] **C8L2-1 · Le geste du lot — CRITÈRE DE SORTIE ATTEINT.** La case d'en-tête a pris
  **exactement 3** lignes : ni Elo (déjà publiée), ni RacemH (en cours), ni Sacha (rien rendu). La
  barre a annoncé « **Publier (3)** » et « **Relancer l'analyse (3)** », **sans** bouton Dépublier.
  Après le clic : « 3 retours publiés — les élèves y ont accès », compteurs passés à **À valider 0 ·
  Publié 4**, sélection vidée. **Preuve d'un seul aller-retour : les trois lignes portent le même
  `publiee_at` à la milliseconde** (`13:42:25.665`), pendant qu'Elo garde le sien
  (`13:41:05.645`) — elle n'a pas été republiée. `modifie_par_prof` reste `false` : le lot ne
  prétend pas avoir retouché. Action visible nommément dans les logs :
  `publierAnalysesLot([3 ids]) in 332ms`.
- [x] **C8L2-2 · L'élève voit ce que le lot a publié — et rien d'autre.** Sous l'identité réelle de
  Camille (`set local role authenticated` + `request.jwt.claims`, transaction **annulée**) : elle lit
  **sa** ligne, `publiee`, avec son commentaire — et **aucune** des quatre autres de la semaine. Le
  scoping RLS tient, et c'est bien la publication en lot qui l'a rendue visible.
- [x] **C8L2-3 · Juger sans ouvrir.** « Aperçu » sur la ligne Dylan : le motif d'intégrité
  (« Le contenu ne se rattache à aucune des trois sections demandées ») **et** le commentaire général
  s'affichent sous la ligne, avec « Ouvrir le retour complet → ». Le badge « ⚠ intégrité » est bien
  sur la ligne.
- [x] **C8L2-4 · Rattraper un lot publié trop vite.** Sélection d'Alice (publiée) : « Publier » passe
  **sans compte** (désactivé) et « **Dépublier (1)** » apparaît. Après le clic : Alice repasse
  `generee`, `publiee_at` à `null`, **les trois autres intactes**.
  `depublierAnalysesLot([1 id]) in 501ms`.
- [x] **C8L2-5 · « Refuser » = relancer — chaîne complète vérifiée.** Alice sélectionnée →
  « Relancer l'analyse (1) » : `generee` → `en_cours` → `erreur`. L'`after()` s'est bien exécuté et
  `lancerAnalyse` est allé jusqu'à son contrôle de photos (le dépôt de recette n'en portait pas) :
  **tout le câblage est prouvé sauf l'appel au modèle lui-même**, et sans dépenser un crédit.
  Seule Alice a bougé. ⚠️ **Reste à confirmer par Louis** : c'est la lecture retenue de « refuser »,
  faute d'état « refusée » au schéma.
- [x] **C8L2-7 · Synthèse de semestre : générer → CRITÈRE DE SORTIE ATTEINT.** Onglet **Synthèses** →
  Semestre test 2 → classe Test → « Générer » sur Camille : synthèse `generee` en ~30 s, note
  suggérée **4/20**, coût **0,0165 $**, texte réel et circonstancié (« *ce semestre s'ouvre sur un
  seul fragment rendu* »). Elle ne portait un vrai dossier que **parce que** C8L2-1 avait publié son
  analyse — les deux tests se tiennent.
- [x] **C8L2-7 bis · … et publiée — CRITÈRE DE SORTIE COMPLET.** Segment rejoué sur une pile
  minimale : **Valider** (ouvre l'éditeur) → **Publier**. Synthèse passée à `publiee`
  (`publiee_at = 13:53:25`, note validée 4/20), et **lue par l'élève sous sa propre identité** via
  RLS (transaction annulée). Contrôle de cohérence au passage : ce second texte annonce « un seul
  fragment sur les **cinq** attendus » — la semaine 5 étant redevenue une semaine de travail, le
  dénominateur suit, exactement comme en C8L2-8.
- [x] **C8L2-8 · Le taux de dépôt ne compte plus les vacances — PREUVE DIRECTE.** La semaine 5 a été
  passée en vacances (dénominateur SQL : 5 → **4**), la synthèse de Camille relancée. Texte produit :
  « *tu n'as rendu qu'un seul fragment sur **les quatre attendus**, soit un taux de participation de
  **25 %*** ». Avant le correctif, c'était 1/5 = 20 %. La semaine a été remise en semaine de travail
  aussitôt après.
- [x] **C8L2-9 · Non-régression de la validation à l'unité.** Le chemin dépôt par dépôt
  (`publierAnalyse` / `depublierAnalyse` / `relancerAnalyse` depuis l'écran d'analyse) n'a **pas été
  touché** par ce lot : les actions de lot sont des ajouts, `git diff` ne montre aucune modification
  des trois actions unitaires.

**Non joué, et pourquoi :**

- [ ] **C8L2-6 · Le prompt hebdo vidé n'empêche plus l'analyse.** Demanderait de vider
  `fragments_config.prompt_evaluation` (la personnalisation de 10 064 signes actuellement en base)
  **et** un dépôt avec photos pour relancer une vraie analyse. La règle est tenue par 10 tests de
  garde (`utils/prompt-fragment.test.ts`), dont le cas exact du piège : chaîne **vide** ≠ `NULL`.
  À jouer si tu veux la preuve de bout en bout — copier le prompt avant de vider le champ.

> **État de la sandbox après la recette du 13/08 — nettoyée, en deux passes.** Les dépôts de recette
> (`RECETTE-C8L2` puis `RECETTE-C8L2b`), leurs analyses et les synthèses ont été effacés dans des
> transactions ; la semaine 5 a retrouvé `is_vacation = false` et `pedagogical_number = 5`. Vérifié
> après coup : **0 dépôt, 0 analyse, 0 synthèse, 0 piste, 0 photo**, 5 semaines de travail au
> semestre actif dont **0 en vacances**, échéances toujours au dimanche **23 h 59 heure de Toronto**.
> `fragments_config` **jamais touchée** (10 064 signes, `updated_at` toujours au 07/07). Rien de la
> recette ne survit.
>
> **Coût de la recette :** deux appels de synthèse, **0,033 $** au total. Les analyses hebdomadaires
> ont été écrites directement en base plutôt que générées — ce qui était sous test ici est la
> **validation**, pas la génération.
>
> **Méthode, à ajouter au piège documenté en L1 :** le décalage de coordonnées du panneau navigateur
> s'est reproduit et a fait rater deux clics d'affilée sur un bouton parfaitement vivant. Ce qui a
> tranché : **les logs du serveur de dev nomment l'action serveur** (`publierAnalysesLot([…]) in
> 332ms`) — un clic raté n'y laisse aucune trace. Le contournement fiable a été de piloter le clic
> par le DOM plutôt que par les coordonnées.

## C8 · L3 — Fragments : onglets prof et élève (branche `feat/c8-fragments`)

_Lot de réorganisation et de design : **aucune logique métier ne change**, aucune migration. Les
écrans d'origine sont conservés — ce sont leurs surfaces qui fusionnent._

**Arbitrages pris en séance (règle R7 — trois questions non tranchées par le prompt, arbitrées par
Louis le 13/08) :**
1. **Élève — le bilan de semestre garde un onglet, mais seulement s'il est publié** : trois onglets
   fixes (Écrit · Oral · Essai) et un quatrième conditionnel (Synthèse).
2. **Élève — les tuiles d'état disparaissent** au profit des onglets ; leur signal (vert/rouge,
   « À déposer », « Retour à lire ») devient une **pastille** sur l'onglet concerné, mentions
   reprises mot pour mot (`utils/fragments-etat-eleve.ts` — source unique des deux surfaces).
3. **Prof — le côté Synthèse d'Évaluations entre directement sur le semestre du sélecteur** : la
   liste des semestres disparaît (le sélecteur de la Barre 2 y donne déjà accès, archives comprises).

**Joués en session prof réelle sur la sandbox, le 13/08 :**

- [x] **C8L3-1 · Les quatre onglets prof.** La Barre 2 porte **Semaine · Suivi · Évaluations ·
  Paramètres** (elle en portait six), sélecteur de semestre à sa place. Chaque écran de détail
  allume son onglet parent : `semaine/<id>` → **Semaine**, `eleve/<id>` → **Suivi**,
  `essais/<id>` → **Évaluations** (mécanisme `prefixes` de `configModules`).
- [x] **C8L3-2 · Suivi = la fusion, sans rien perdre.** Tuiles de classe portant **à la fois** les
  moyennes de sections en lettres et le compteur de thèmes ; classe ouverte : courbe d'évolution,
  puis une ligne par élève avec moyennes, taux de dépôt, thème **éditable sur place** et bascule
  « Essai » — plus le « Essai : Activer / Désactiver » au niveau de la classe. **Le nom de l'élève
  est le lien vers sa progression** (critère du prompt), et le retour de cette page revient à Suivi
  sur la bonne classe.
- [x] **C8L3-3 · Évaluations, le toggle.** Un onglet, deux côtés : **Essai** (nouvel essai, tuiles
  de classe, essais assignés) et **Synthèse** (tuiles de classe du semestre consulté →
  `GestionSyntheses`, « 0/6 générées · 0 publiées » et les six élèves). Le toggle conserve la
  classe choisie d'un côté à l'autre.
- [x] **C8L3-4 · Aucune ancienne URL ne tombe.** Les cinq routes retirées de la navigation
  redirigent, `?classe=` compris : `themes` → `suivi`, `vue-ensemble` → `suivi`,
  `essais` → `evaluations?vue=essai`, `semestres` → `evaluations?vue=synthese`,
  `semestres/<id>` → `evaluations?vue=synthese`. Vérifié en `fetch` : **5 sur 5 en 200**, sur la
  bonne cible. `revalidatePath` et liens entrants (calendrier prof, fiche élève, intégrité) suivis.
- [x] **C8L3-5 · Rien de cassé dans les flux réparés en L1-L2 — CRITÈRE DE SORTIE.** Dans l'ordre :
  (a) la config du calendrier annonce toujours « semaine 5 / 5 » sans mention d'écart — le mensonge
  réparé en L1 n'est pas revenu ; (b) **« Rouvrir » depuis l'écran Semaine** ouvre la semaine 5
  (`ouverte = t` en base, échéance toujours au dimanche `23:59:59.999` heure de Toronto) ; (c) une
  pile de 3 dépôts « à valider » posée en base (classe Test) — la vue Semaine les compte juste
  (**3 déposés · 3 manquants · 3 à valider**) ; (d) **validation par lot** : case d'en-tête →
  « **Publier (3)** », et après le clic les trois analyses passent `publiee` **au même `publiee_at`
  à la milliseconde** (`15:33:53.751`), `modifie_par_prof` toujours `false`. Action nommée dans les
  logs : `publierAnalysesLot([3 ids]) in 694ms`. Le geste de L2 traverse la réorganisation intact.
  _(Le décalage de coordonnées du panneau a encore fait rater un clic : les logs du serveur, muets,
  l'ont dit tout de suite — cf. la note de méthode en fin de section L2.)_

**Soldé sans navigateur, le 13/08 :**

- [x] **C8L3-A · Le dépôt compile et passe.** `npm test` **165/165**, `npx tsc --noEmit` et
  `npm run build` verts — toutes les routes `/prof/fragments-erudition/*` bâties, `suivi` et
  `evaluations` comprises. `eslint` : aucune erreur ; deux avertissements **préexistants**
  (`pistesEnAttente`, `mesPresen` — deux requêtes mortes de la page élève, notées dans
  `IDEES_post_rentree.md`).

**Joués en session élève réelle (compte de test **Elo**, classe Test), le 13/08 :**

- [x] **C8L3-6 · Les onglets élève, et leurs pastilles qui disent vrai.** La Barre 2 porte
  **Écrit · Oral · Essai** — les anciennes tuiles d'état ont disparu, et le sélecteur de semestre
  (outil du prof) ne s'affiche pas côté élève. Les trois états ont été observés **en changeant la
  base sous l'écran**, pas en les décrivant : (a) semaine 5 ouverte, aucun dépôt → **Écrit ● rouge,
  « À déposer »** ; (b) dépôt + retour publié non lu → **Écrit ● rouge, « Retour à lire »** ;
  (c) après validation de lecture → **Écrit ● vert, « À jour »**. Le nom accessible de l'onglet
  porte la mention (`Écrit — Retour à lire`), la pastille n'est pas le seul signal. Onglets Oral et
  Essai rendus sans erreur (« Aucun retour d'oral… », « Aucun essai n'est prévu pour toi… » — le
  message ajouté pour que l'onglet Essai ne soit jamais vide).
- [x] **C8L3-7 · Le 4ᵉ onglet conditionnel.** Sans synthèse publiée : **trois** onglets. Une
  synthèse publiée posée en base → **Synthèse** apparaît en quatrième, l'onglet s'allume et rend le
  bilan. Synthèse retirée → l'onglet disparaît. C'est l'arbitrage 1 tenu exactement.
- [x] **C8L3-8 · Design vérifié sur mobile (375 px).** Sous-nav du module sous l'en-tête, les
  **quatre** onglets sur une seule ligne sans scroll (`scrollWidth = clientWidth = 375`), **aucun
  débordement horizontal** de la page (`documentElement.scrollWidth = 375`), **cibles tactiles de
  44 px** pour les quatre, barre d'onglets du bas dégagée. 0 erreur console, 0 erreur serveur.
- [x] **C8L3-9 · Le gate de lecture traverse la réorganisation.** Retour publié non lu → l'écran
  Écrit affiche « **Dépôt bloqué** — lis et valide ton retour en attente », le formulaire de dépôt
  est remplacé par le lien de rattrapage ; après « J'ai tout lu » (les deux parties cochées),
  `retour_lu_at` est écrit en base, le dépôt redevient possible et la pastille passe au vert. Le
  mécanisme du Lot 10 / C8·L2 est intact.

- [x] **C8L3-10 · Un seul chargement d'état par affichage (correctif de clôture).** Défaut trouvé
  après coup, en relisant les logs : les deux barres d'onglets (Barre 2 desktop et sous-nav mobile)
  étant **montées ensemble** — le responsive les masque en CSS, il ne les démonte pas — chacune
  chargeait son état, soit **deux appels serveur identiques de ~1 s** par affichage de la page
  élève. L'état est désormais chargé une fois pour deux par `FournisseurEtatFragmentsEleve`
  (coquille `/eleve`), et rien n'est chargé hors du module. Vérifié en session élève : **un seul
  `chargerEtatOngletsFragments()` par chargement** dans les logs (deux avant), onglets, pastilles et
  sous-nav mobile inchangés (44 px, aucun débordement).

**Non joué, et pourquoi :**

- [ ] **C8L3-11 · Reprise du test C11a-8 (part Fragments).** ⚠️ **Cause inchangée depuis le 13/08
  (C8·L1) — revérifiée dans le code ce jour : `enregistrerCoutApi()` n'est appelé nulle part dans
  la chaîne Fragments** (`analyse.ts`, `analyse-orale.ts`, `analyse-essai.ts`,
  `synthese-semestre.ts`, `transcription.ts` : **0 occurrence**, seuls Quazian, Scriptorium et
  Aletheia alimentent `api_couts`). Le test ne peut donc pas passer, quoi que fasse C8 : c'est le
  câblage manquant de C11a. Le rejouer coûte un vrai dépôt élève avec photos (≈ 0,03 $) pour
  reprouver un fait déjà établi — **à rejouer avec le correctif C11a, pas avant**.

> **État de la sandbox après la recette du 13/08 — nettoyée.** Les 4 dépôts de recette
> (`Dépôt de recette C8·L3…`), leurs 4 analyses et la synthèse de recette ont été effacés dans une
> transaction, et la **semaine 5 refermée** comme elle l'était au départ. Vérifié après coup :
> **0 dépôt, 0 analyse, 0 synthèse, 0 piste, 0 photo**, 5 semaines au semestre actif dont **0
> ouverte**, `api_couts` toujours sans la moindre ligne `fragments`. `fragments_config` jamais
> touchée. Rien de la recette ne survit.
>
> **Coût de la recette : 0 $.** Aucun appel au modèle — les analyses et la synthèse ont été écrites
> directement en base : ce qui était sous test ici, ce sont des **surfaces**, pas de la génération.
>
> **Méthode.** Le décalage de coordonnées du panneau navigateur (documenté en L1 et L2) s'est
> reproduit une fois de plus sur « Publier (3) » : le clic par **référence DOM** l'a réglé, et les
> logs du serveur — muets sur le clic raté, puis `publierAnalysesLot([…]) in 694ms` — ont tranché
> en deux secondes. Côté élève, la validation de lecture a été pilotée de la même façon.

## C7 · L1 — Quazian : remise en marche des flashcards et des quiz (branche `feat/c7-quazian`)

_Diagnostic complet : `RAPPORT_Diagnostic_C7_quazian.md`, écrit avant le correctif. Ce qui pouvait
être prouvé sans session prof l'est déjà (répétition à blanc de la migration en transaction annulée,
vérification des helpers contre la sandbox réelle, `npm test` 165/165, `tsc --noEmit` et
`npm run build` verts). **Ce qui reste ci-dessous demande un vrai navigateur, connecté en prof puis
en élève** — je n'ai pas de compte prof de test, et la règle du dépôt m'interdit de saisir un mot de
passe. Rappel de la règle d'or : Chrome, pas l'aperçu embarqué, et Cmd-R avant de conclure à un bug._

**✅ Lot C7 · L1 VERT le 13/08 — les 7 tests + C11a-7 sont soldés.** Flashcards et quiz se créent à
nouveau depuis les contenus actuels, l'élève les voit par sa classe, le quiz se passe et se ferme,
le gel de l'intégrité tient. Trois défauts trouvés EN JOUANT la recette et corrigés dans la foulée :
la fermeture fail-silent (`586c5a5`), le `confirm()` natif qui rendait le bouton muet (`89625fc`),
et un tableau live qui confondait « pas commencé » et « en cours » (`1904add`). Reste à merger.

**⚠️ L'ORDRE COMPTE (protocole renforcé, règle 5 de `SUIVI_SQL.md`).** Le code part **d'abord**
(merge + push), le SQL **ensuite**. Les tests C7L1-1 et 2 ne sont observables qu'AVANT d'exécuter
`c7_quazian_contenus.sql`.

**État de la sandbox au 13/08 (point de départ) :** 0 carte, 0 publication, 0 quiz. Contenus
disponibles : **« NAture humaine »** (cours, 9 460 signes) et **« test »** (texte, 4 signes) — les
deux au parcours de la classe **Test** (6 élèves actifs) ; **« Cognitif »** (cours, 2 953 signes) au
parcours d'aucune classe. Les livres (4) restent hors de portée de Quazian.

- [ ] **C7L1-1 · L'écran cesse d'être vide (à jouer AVANT le SQL — c'est LE test du chantier).**
  `npm run dev`, prof → `/prof/quazian`. L'écran doit lister **trois contenus** (Cognitif, NAture
  humaine, test) au lieu de « Aucune unité dans le Scriptorium ». _(Avant ce lot, cette page
  s'arrêtait là, sans un seul bouton à presser.)_
- [ ] **C7L1-2 · Le lot dit à qui il parle (AVANT le SQL également).** Cliquer « NAture humaine » →
  le panneau doit annoncer « **Au parcours de Test** — ces élèves verront les cartes une fois
  publiées » ; cliquer « Cognitif » → « **n'est au parcours d'aucune classe** : même publiées, ces
  cartes n'atteindront personne ». C'est la contrepartie visible de la visibilité recâblée (§4.4 du
  rapport).
- [ ] **C7L1-3 · Migration.** SQL Editor de la sandbox → `c7_quazian_contenus.sql`, puis le bloc de
  vérification en pied de fichier → attendu `colonnes = 3`, `fc_unite_nullable = t`,
  `pub_unite_nullable = t`, `arcs_poses = t`, `index_poses = t`. Puis cocher la case **Sandbox** de
  la ligne du 13/08 dans `SUIVI_SQL.md`.
- [x] **C7L1-4 · Génération de cartes depuis un contenu réel (critère de sortie, moitié flashcards).**
  Sur « NAture humaine » → **✦ Générer les cartes** → un paquet de cartes atomiques arrive en
  « À valider ». Les valider (« ✓ Tout valider »), puis **Publier aux élèves**. _(Sur « test », le
  texte fait 4 signes : la génération doit refuser proprement, pas planter.)_
  _(**Validé le 13/08** — joué sur « Cognitif » plutôt que « NAture humaine » : **18 cartes
  générées et validées**, en base sous `contenu_id`. L'arc bi-source écrit donc pour de vrai.)_
- [x] **C7L1-5 · L'élève les voit — et seulement lui.** Connecté avec un élève de la classe **Test** →
  `/eleve/modules/quazian` : les cartes sont dans la file de révision. Avec un élève d'une autre
  classe (T5 ou THLP) : rien. C'est le scoping par classe qui n'existait plus.
  _(**Validé le 13/08** : les cartes sont là côté élève. La visibilité passe désormais par
  l'instance de parcours de la classe, `scriptorium_document_classes` étant vide.)_
- [x] **C7L1-6 · Quiz créé et passé (critère de sortie, moitié quiz).** Prof → `/prof/quazian/quizz` →
  « + Créer un nouveau quizz » : la liste des **contenus** doit être remplie (elle était vide). Cocher
  « NAture humaine », choisir la classe **Test**, générer → valider les questions → lancer. Élève de
  Test : passer le quiz. Prof : fermer, la note apparaît. _(Minimum 5 cartes validées, sinon le
  refus est attendu et explicite.)_
  _(**13/08 — création, lancement et passation VALIDÉS** ; la liste des contenus était bien remplie,
  l'élève a passé le quiz (5 questions, score 9,15 → 19,15/20). **Reste la FERMETURE.** Le bouton
  « Fermer le quizz » semblait mort : en base, statut toujours `lance` et `moyenne_cohorte` NULL —
  l'action n'était jamais partie. C'est **le seul `confirm()` natif de tout le flux Quazian**
  (`TableauLive.tsx`), donc très probablement la règle d'or du 24/07 (dialogues muets dans l'aperçu
  embarqué). **À rejouer dans Chrome.** Au passage, cette chaîne était fail-silent de bout en bout —
  corrigé au commit `586c5a5` : chaque écriture vérifiée, l'erreur affichée sous le bouton, garde
  `statut='lance'` + `.select()`, et l'écran se rafraîchit tout seul.)_
  _(**Clos le 13/08.** La cause était bien le `confirm()` natif : reproduit en session prof dans le
  panneau — clic → **zéro requête réseau**, le handler s'arrêtait à sa première ligne. Remplacé par
  une confirmation EN PAGE (patron `BoutonSupprimerUnite`, commit `89625fc`) ; **fermeture jouée et
  validée** — quizz `ferme`, moyenne de cohorte 9,150, écart-type 0, Elo à 19,15/20, z = 0, les
  5 réponses écrites et répondues, aucune auto-soumission. **Une inexactitude trouvée en relisant ce
  qu'avait écrit la fermeture** : le panneau annonçait « 5 élèves ont commencé sans soumettre »
  alors qu'aucun n'avait ouvert le quizz — `eleves` est le roster de la classe, pas la liste de ceux
  qui ont commencé. Corrigé (`1904add`) : les deux populations sont comptées à part, « ouvert sans
  soumettre → 25/25/25/25 » et « jamais ouvert → aucune note ». **À revoir au prochain quizz** :
  celui-ci est fermé, le bouton n'existe plus.)_
- [x] **C7L1-7 · Le gel de l'intégrité tient toujours (item 5 du chantier — assumé, pas retiré).**
  Bloquer l'élève de test depuis `/prof/integrite`, puis recharger sa page Quazian : bannière
  « cheeky », **révision gelée**, section Quizz **toujours ouverte**. Débloquer ensuite. _(La garde
  a été étendue à `chargerToutesLesCartes` et `chargerStatsRevision`, qui ne l'avaient pas — §5 du
  rapport.)_
  _(**Validé le 13/08.** ⚠️ **Le blocage a dû être posé en SQL** : « Bloquer l'élève » n'existe que
  dans le panneau d'un signalement, et il n'y avait aucun signalement en attente — un prof ne peut
  donc pas mettre en pause un élève jamais signalé. Trou noté dans `IDEES_post_rentree.md`
  (`d36d149`), périmètre Intégrité. Le drapeau reposé à `false` après le test, `integrite_strikes`
  remis à 0 : Elo est exactement dans son état d'avant.)_
- [x] **C11a-7 · Quazian — coûts API** _(reporté ici depuis le 26/07)_. Après C7L1-6, la requête de
  contrôle en pied de la section C11a doit montrer des lignes `quazian` : celle de la génération de
  **questions** porte un `classe_id`, **jamais** d'`eleve_id`. Les lignes de génération de **cartes**
  sont attendues **sans attribution** — c'est structurel (contenu partagé entre classes), pas un
  manque : cf. le pied de la section C11a.
  _(**Validé le 13/08**, requête de contrôle : `appels = 2`, **`attribues_eleve = 0`**,
  **`attribues_classe = 1`**, `avec_tokens = 2`, total 0,0509 $. Exactement le critère — la
  génération de questions porte la classe, celle des cartes reste non attribuée par construction.
  Le test dormait depuis le 26/07, faute de pouvoir créer un quiz.)_

```sql
-- Contrôle C11a-7, après création d'un quiz
select module, count(*) as appels, count(eleve_id) as attribues_eleve,
       count(classe_id) as attribues_classe, count(tokens_entree) as avec_tokens,
       round(sum(cout)::numeric, 4) as total_usd, max(created_at) as dernier
  from api_couts where module = 'quazian' group by module;
```

**Reste hors de ce lot, volontairement :** les onglets « Flashcards · Quiz », le commutateur élève à
trois états et la génération sur « vu » → **L2** ; l'affichage des notes élève en `/10` alors que
tout le reste est en `/20` → **L2** (le correctif L1 ne passe pas par ces écrans, §6 du rapport) ; le
diagnostic de fragilités → **C6** ; la même fracture côté **Codex prof** → notée dans
`IDEES_post_rentree.md`.

## C7 · L2 — Quazian : onglets, génération au bouton, commutateur trois états (branche `feat/c7-quazian`)

_**Aucune migration dans ce lot** — vérifié : le troisième état du commutateur tient dans la valeur
du cookie existant (`eleve_classe` = `toutes`), la file de validation et ses statuts
(`suggere`/`valide`/`archive`) datent de L1, et la note /20 lit `quazian_quiz_scores.note_formative_20`,
colonne déjà en base. Rien à jouer dans le SQL Editor, donc pas de ligne au `SUIVI_SQL.md`._

_Prouvé sans navigateur : `tsc --noEmit` vert, `npm test` **165/165**, `npm run build` vert (toutes
les routes compilées)._

_**Trois tests joués le 13/08 dans une session élève déjà ouverte** (« Elo », classe **Test**,
mono-classe) — aucun mot de passe saisi, la session était là. Ce qui reste demande **le compte prof**
(tests 1 et 6) et **un compte bi-classe** (tests 4 et 5), que cette session ne donne pas. Règle d'or :
Chrome, pas l'aperçu embarqué, et Cmd-R avant de conclure à un bug._

**Les tests 4 et 5 demandent un élève BI-CLASSE : c'est `Sacha` (`eleve1@test.com`), déjà inscrit en
**Test** ET **T5** — constaté le 13/08 sur sa fiche. Rien à créer, il suffit de s'y connecter.** Le
commutateur est masqué pour un mono-classe par construction : sans ce compte, le cœur du lot reste
invisible.

- [x] **C7L2-1 · Trois onglets côté prof, et rien de perdu.** `/prof/quazian` → la Barre 2 doit
  afficher **Flashcards · Quizz · Paramètres** (cinq avant ce lot). Puis : « Notes de semestre → »
  en haut de l'écran Quizz mène à `/prof/quazian/semestre`, **où l'onglet Quizz reste allumé**, et le
  « ← Quizz » du haut ramène. _(**Validé le 13/08** : les trois onglets sont en place, « Notes de
  semestre → » est en tête de l'écran Quizz, et la page Semestre garde bien l'onglet Quizz allumé
  (les `prefixes` font leur travail) sous son nouvel en-tête « ← Quizz · Notes de semestre ».
  Le **Diagnostic**, sorti de la barre, reste atteignable : la fiche de Sacha affiche « QUAZIAN —
  Diagnostic FSRS + quizz → » et `/prof/quazian/diagnostic/<id>` se charge sans erreur. Rien de
  perdu.)_
- [x] **C7L2-2 · Deux onglets côté élève.** Élève → `/eleve/modules/quazian` : **Flashcards** (par
  défaut, les stats et « Réviser mes N cartes ») et **Quizz** (la liste des quizz). Les deux zones
  empilées d'hier ne doivent plus coexister sur un même écran. _(**Validé le 13/08** : la Barre 2
  affiche « Flashcards · Quizz », la vue Flashcards ne porte plus que la zone Réviser — 18 cartes,
  18 dues — et la vue Quizz la seule liste. Zéro erreur console. **Reste à voir sur mobile (< 640 px)**,
  où la sous-nav est un composant distinct : non joué.)_
- [x] **C7L2-3 · La note passe en /20 (item 6).** Sur l'onglet Quizz, un quizz corrigé affiche
  `x/20`. Ouvrir le quizz : la tuile de gauche dit « score moyen » **sans « /10 »**. _(**Validé le
  13/08** : la tuile annonce **19,1/20**, l'écran de détail « 9.2 · score moyen » puis « 19.1/20 ·
  note formative ». La démonstration du bug est là : l'affichage d'avant disait « 9,1/10 » — un
  nombre qui passait pour une note sur 10 alors que c'est le score de Brier moyen, dont la note se
  déduit par `10 + score`. Un élève à 19/20 se croyait à 9/10.)_
  **Croisement prof/élève fait le 13/08 — les deux concordent.** Sur
  `/prof/quazian/quizz/72fe18d6…/lancer`, la ligne d'Elo dit Score `9.15` · Note **19.1/20** ; l'élève
  voit **19,1/20** sur sa tuile comme dans son détail. Le « 9.2 » de l'élève et le « 9.15 » du prof
  sont le MÊME nombre à l'arrondi près (`toFixed(1)` contre `toFixed(2)`). Le risque que je signalais
  — l'élève lit la colonne stockée `note_formative_20`, le prof **recalcule** `10 + score_moyen` — ne
  s'est pas matérialisé : même formule, même bornage, même résultat. _(Il reste théorique : si un jour
  la formule bouge d'un côté seulement, c'est là que ça se verra.)_
- [x] **C7L2-4 · Commutateur à trois états (le test du lot).** _(**Validé le 13/08 sur Sacha**, les
  cinq points joués dans l'ordre. 1 : la puce offre « Toutes les classes · T5 · Test ». 2 : sur une
  classe, le calendrier n'affiche que ses échéances et **sa légende de couleurs disparaît**. 3 : sur
  Toutes, le tableau de bord dit « Toutes les classes » sous le bonjour, le héros porte « · Test », et
  « Ensuite cette semaine » aligne **deux** lectures Aletheia — « · T5 » et « · Test » — pendant que
  le calendrier remontre la légende Test · T5. 4 : entrer dans Quazian affiche « Quelle classe ? » ;
  choisir Test amène les 18 cartes **et la puce de l'en-tête est passée sur Test**. 5 : la bascule
  Test ↔ T5 depuis l'intérieur du module marche, sans repasser par le tableau de bord.
  Vu au passage : le choix ne propose que les classes **qui ont le module** — Quazian n'offre que Test
  (T5 ne l'a pas), Fragments offre les deux, avec le pigment du module. Aucune erreur console.)_
  Avec le compte bi-classe :
  1. Le commutateur (puce de l'en-tête, ou bandeau mobile) propose **Toutes les classes · classe A ·
     classe B**.
  2. Sur **une classe** : le tableau de bord ne montre que le travail de cette classe, et le
     **calendrier n'affiche plus que ses échéances** _(avant ce lot il agrégeait toujours)_.
  3. Sur **Toutes** : le tableau de bord agrège — une ligne « à faire » par classe, chacune suffixée
     du nom de sa classe — et le calendrier remontre les deux, avec sa légende de couleurs.
  4. Sur **Toutes**, entrer dans un module (Quazian, Fragments, Codex, Aletheia, Scriptorium) : un
     écran **« Quelle classe ? »** s'affiche à la place du contenu. Choisir → le contenu arrive, et
     **le commutateur de l'en-tête a suivi** (il n'est plus sur « Toutes »).
  5. Depuis l'intérieur du module, **rechanger de classe par le commutateur** sans repasser par le
     tableau de bord.
- [x] **C7L2-5 · Un bi-classe ne voit jamais l'autre classe (item 3, le point dur).** _(**Validé le
  13/08 sur Sacha**, dans les deux sens, même session, seul le commutateur changeant :_

  | Contexte | Flashcards | Quizz |
  |---|---|---|
  | **T5** | 0 carte — « ton professeur n'a pas encore publié de cartes » | « aucun quizz pour l'instant » |
  | **Test** | **18** cartes, 18 dues | le quizz du 13/08, « terminé (non passé) » |

  _Les 18 cartes de « Cognitif » et le quizz appartiennent à Test : sur T5 ils sont bien invisibles.
  Avant ce lot, les deux modules lisaient l'UNION des classes et ignoraient le commutateur — Sacha
  aurait vu les deux dans les deux contextes.)_
  **Volet Codex clos le 14/08**, une fois la création de synthèse réparée (elle bloquait le test) et
  une séance lancée dans CHAQUE classe :

  | Contexte | Synthèse en cours | Session |
  |---|---|---|
  | **T5** | « Cognitif » | `32cc4f85…` |
  | **Test** | « NAture humaine » | `6e69e56e…` |

  _Deux sessions distinctes, même élève, même session de navigation : seul le commutateur a changé.
  Avant le lot, `classeIdsActives` rendait l'union et `visibles.find(live)` en désignait une au
  hasard, quel que soit le contexte affiché._
- [x] **C7L2-6 · Le gel de l'intégrité tient avec les onglets.** _(**Validé le 13/08** sur Elo,
  bloquée : onglet **Flashcards** = la bannière « Rendus en pause » SEULE — ni compteurs, ni bouton de
  révision ; onglet **Quizz** = **entièrement ouvert**, le quizz du 13/08 avec sa note et son
  « revoir → ». La règle de L1 traverse donc la mise en onglets. **Le découpage la sert même** : la
  bannière dit « le quizz, lui, reste ouvert » et l'onglet est désormais juste à côté, au lieu d'une
  section empilée sous le message.
  Vérifié en plus, parce que mon remaniement déplaçait ce point d'appel : le **tableau de bord**
  n'annonce AUCUNE carte à réviser pendant le blocage (Quazian « à jour »), alors qu'Elo en a 18 une
  fois débloquée — la garde de `chargerStatsRevision` tient, les compteurs ne promettent pas un
  travail inaccessible.
  ⚠️ **Elo est restée bloquée à la fin de la passe — la débloquer.**)_ _(Rappel : bloquer un élève
  jamais signalé est impossible depuis l'écran — trouvaille de C7·L1 notée dans
  `IDEES_post_rentree.md`.)_
- [x] **C7L2-7 · Non-régression mono-classe.** Avec un élève d'une seule classe : **aucun
  commutateur** ne s'affiche, aucun écran « Quelle classe ? » n'apparaît, et le tableau de bord, le
  calendrier et les modules se comportent comme avant le lot. _(**Validé le 13/08** sur « Elo »,
  mono-classe. Les cinq surfaces touchées par le troisième état ont été ouvertes une à une —
  tableau de bord, calendrier (scopé « Test », une échéance de quizz), Fragments (3 onglets),
  Codex (synthèse en cours), Aletheia (2 livres, 4 séances) : toutes rendues, **aucun commutateur,
  aucun écran de choix, zéro erreur console**. C'est le test qui comptait le plus ici : le troisième
  état a traversé les cinq modules, il aurait pu les casser tous.)_

**⚠️ Trouvaille du 14/08, à trancher — l'écran « Quelle classe ? » de Codex n'offre que Test.**
Le choix ne propose que les classes qui ONT le module (`classe_modules`), pour ne pas mener à « tu
n'as pas accès à ce module ». Or **T5 n'a pas le module Codex** alors qu'une synthèse Codex y est
lancée et que Sacha la voit très bien en contexte T5 — l'accès élève est l'UNION de ses classes
(`utils/acces.ts`, règle du Lot 1), pas la classe. Conséquence : un bi-classe en état « Toutes » ne
peut PAS atteindre la synthèse de T5 par le choix de classe ; il doit passer par le commutateur.
Deux lectures, à trancher :
1. **C'est une lacune de configuration** — donner le module Codex à T5 dans les paramètres, et le
   choix proposera les deux. Rien à changer au code. _(Lecture la plus probable : on vient de créer
   une séance Codex pour une classe qui n'a pas le module.)_
2. **C'est le choix qui est trop étroit** — lister toutes les inscriptions ; une classe sans le
   module mènerait alors à un cul-de-sac honnête plutôt qu'à une classe invisible.
Non tranché : aucune des deux n'est appliquée.

**Reste hors de ce lot, volontairement :** le déclencheur automatique sur « vu » → post-rentrée
(explicitement écarté par le prompt de session) ; le diagnostic de fragilités et ses **deux** fils
cassés → **C6** ; le design des Paramètres → coupe pré-décidée. **Item 2 du lot (bouton « Générer »
+ file de validation prof) : déjà livré par L1** — `BoutonGenererCartes`, statut `suggere` → section
« À valider » avec « ✓ Tout valider », et *valider / corriger / jeter* = les boutons **Valider /
Modifier / Archiver + Supprimer** de `CarteFlashcard`. Les coûts partent bien dans `api_couts` sous
`quazian` (non attribués pour les cartes : contenu partagé, cf. pied de la section C11a). Rien n'a
donc été réécrit là ; ce sont les tests C7L1-4 et C11a-7, déjà verts, qui le couvrent.

## C7 · L3 — Quazian : tuiles par cours et visibilité au « vu » (branche `feat/c7-l3-vu`)

_**Une migration dans ce lot** : `c7_quazian_sections.sql` (colonne `quazian_flashcards.section_id`,
FK `on delete set null` + CHECK de subordination + index partiel), ligne créée au `SUIVI_SQL.md`
**avant** exécution, rollback prêt (`c7_quazian_sections_rollback.sql`, non destructif). **Protocole
RENFORCÉ** : code mergé + poussé d'abord, SQL ensuite, fenêtre calme, smoke élève. **Non exécutée à
l'écriture de cette section.**_

_Prouvé sans navigateur : `tsc --noEmit` vert, `npm test` **172/172** (dont 8 neufs sur la règle de
visibilité, `utils/quazian-visibilite.test.ts`), `npm run build` vert (toutes les routes compilées)._

_**La recette navigateur n'est pas jouée** : elle demande la session prof PUIS la session élève, donc
des mots de passe que cette session ne saisit pas. Les tests ci-dessous sont écrits pour être joués
tels quels, **après** l'exécution du SQL. Règle d'or : Chrome, pas l'aperçu embarqué, et Cmd-R avant
de conclure à un bug._

**État de la sandbox au 14/08 (lu en base, lecture seule) — le terrain des tests :**

| Fait | Détail |
|---|---|
| Cartes en base | **18**, toutes sur « **Cognitif** » (cours, bras contenu), toutes `valide`, `section_id` null par construction |
| Publications | **1** ligne : « Cognitif », `flashcards_visibles = true` — *plus lue par personne après ce lot* |
| Cours découpé | « **NAture humaine** » : 2 sous-sections (« Qu'est-ce que la nature? », « Qu'est-ce que la nature humaine ? ») — **rien à découper pour la recette** |
| Parcours « test » | assigné à **Test** (6 élèves, daté au 01/07) et **T5** (1 élève, non daté) |
| « Vu » de **Test** | « NAture humaine » : **1 sous-section sur 2 vue** · « Cognitif » : élément `contenu` **NON vu** |
| « Vu » de **T5** | « NAture humaine » : **0 sur 2** · « Cognitif » : **pas au parcours de T5** |

**Le sort des cartes déjà publiées — comportement VOULU, pas une régression.** Les 18 cartes de
« Cognitif » sont aujourd'hui visibles des 6 élèves de Test par la seule publication. Sous le régime
« vu », elles **disparaissent** de leur écran tant que le prof n'a pas coché « vu » l'élément
« Cognitif » de l'instance de Test — après quoi les 18 reviennent d'un coup (cours NON découpé →
grain contenu → « entamé » suffit). C'est exactement ce que le lot cherche : la carte suit le cours
fait en classe. À dire à Louis avant de jouer le SQL, pour que la disparition ne se lise pas comme un
bug.

**Ce que fait une RE-DÉCOUPE (diagnostic (a) du lot).** `remplacerDecoupe`
(`app/prof/scriptorium/actions.ts:925`) **supprime** les éléments d'instance, **supprime** les
sections, **réinsère** les sections dérivées puis **re-matérialise** les éléments en reportant les
« vus » par correspondance exacte de TITRE. Les sections repartent donc avec des **uuid neufs**, même
à découpe identique. D'où le choix de FK : `on delete set null` — en `restrict` la re-découpe d'un
cours deviendrait impossible dès qu'il a des cartes (Quazian bloquerait le Scriptorium) ; en
`cascade` elle détruirait les cartes **et** les `quazian_card_states` (l'historique FSRS des élèves,
exactement ce que la garde `restrict` de L1 protège). En `set null`, la carte survit et retombe au
grain « cours entier » : **une re-découpe dé-granule les cartes**, une re-génération leur rend leur
sous-section. Aucune perte, une précision perdue — c'est le test C7L3-7 qui le vérifie en vrai.

- [ ] **C7L3-1 · Le bouton « Publier » a disparu, l'écran dit l'état réel.** Prof →
  `/prof/quazian` : plus aucun bouton « Publier aux élèves / Masquer », ni sur la fiche de la cible
  choisie ni sur `/prof/quazian/<cible>`. À la place, pour « NAture humaine » : « **Test** — 1
  sous-section vue sur 2 → N cartes visibles » et « **T5** — 0 sous-section vue sur 2 → 0 carte
  visible ». Pour « Cognitif » : « **Test** — pas encore vu → 0 carte visible » (et pas de ligne T5,
  qui ne l'a pas au parcours). La tuile n'est **verte** que si au moins une classe voit des cartes.
- [ ] **C7L3-2 · Génération par sous-section.** Prof → `/prof/quazian?cible=<NAture humaine>` →
  « ✦ Générer les cartes ». Attendu : **deux appels IA**, un par sous-section, et sur
  `/prof/quazian/<cible>` chaque carte à valider porte son « § <titre de sous-section> ». Un cours
  NON découpé (« Cognitif ») et un texte source (« test ») ne montrent aucun « § » — grain contenu.
  ⚠️ Si le SQL n'est pas joué, la génération d'un cours découpé refuse avec le message dédié
  (« La base ne connaît pas encore les sous-sections… ») : c'est le garde-fou, pas un bug.
- [ ] **C7L3-3 · Le « vu » ouvre CETTE sous-section, et elle seule (le cœur du lot).** Valider les
  cartes générées (**aucun geste de publication**). Scriptorium → grille d'instance de **Test** :
  la sous-section 1 de « NAture humaine » est déjà vue, la 2 ne l'est pas. Élève de Test →
  `/eleve/modules/quazian` : il voit les cartes de la sous-section **1** seulement, dans une tuile
  au nom du cours. Cocher « vu » la sous-section 2 → les siennes apparaissent. Décocher → elles
  repartent. Les compteurs du tableau de bord (« à réviser aujourd'hui », « cartes au total »)
  suivent.
- [ ] **C7L3-4 · Tuiles par cours côté élève.** Onglet Flashcards : une tuile par cours ayant des
  cartes visibles — **nom du cours**, nb de cartes, badge « N à réviser ». Un clic ouvre la
  consultation **de ce cours** (`?cours=<id>` dans l'URL, retour arrière du navigateur compris).
  La **file de révision reste GLOBALE** (décision R7) : « Réviser mes N cartes » mélange les cours,
  et chaque carte affiche le sien en haut à droite pendant la session.
- [ ] **C7L3-5 · Les cartes déjà publiées passent sous le régime « vu ».** Avant de cocher quoi que
  ce soit : l'élève de Test ne voit **plus** les 18 cartes de « Cognitif » (elles étaient publiées).
  Cocher « vu » l'élément « Cognitif » de l'instance de Test → **les 18 reviennent** d'un coup.
  Comportement voulu (cf. encadré ci-dessus), à consigner tel quel.
- [ ] **C7L3-6 · Rejeu de C7L2-5 — le bi-classe reste étanche.** `Sacha` (`eleve1@test.com`, Test +
  T5), même session, seul le commutateur change : en **T5** il ne voit **toujours rien** de
  « Cognitif » (pas au parcours de T5) et rien de « NAture humaine » tant que T5 n'a coché aucune
  sous-section ; en **Test** il voit ce que le « vu » de Test ouvre. Le « vu » étant par classe, la
  divergence est native — c'est le §10.2 du rapport de diagnostic, réglé au passage.
- [ ] **C7L3-7 · Re-découpe d'un cours qui a des cartes (le point dur du SQL).** Scriptorium →
  éditeur de sections de « NAture humaine » → re-sauver la découpe (confirmation « re-découpe
  consciente »). Attendu : **aucune carte supprimée** (le compte reste le même sur
  `/prof/quazian/<cible>`), le « § » disparaît de chaque carte (dé-granulation par `set null`), et
  côté élève les cartes deviennent visibles dès que le cours est **entamé** au lieu de suivre chaque
  sous-section. Re-générer leur rend leur sous-section. ⚠️ Vérifier aussi que l'historique FSRS
  survit : une carte déjà révisée ne redevient pas « Nouvelle ».
- [ ] **C7L3-8 · Smoke élève immédiat après le SQL (protocole renforcé).** Connexion élève test +
  une soumission Aletheia + un tour sur `/eleve/modules/quazian`. Rien d'autre du flux existant ne
  doit bouger.

**Reste hors de ce lot, volontairement :** la génération AUTOMATIQUE au clic « vu » (déclencheur) →
post-rentrée, écartée par le prompt de L2 et toujours écartée ; le diagnostic de fragilités et ses
deux fils cassés → **C6** ; le design des Paramètres → coupe pré-décidée ; le sort de
`quazian_publications` et de sa colonne `classe_id` → arbitrage (§10.1) ; l'accès module × classe →
séance dédiée (`PROMPT_Code_Acces_classes_L1.md`). Les quiz ne bougent pas.

## C2 — (à venir)

_Les tests seront ajoutés à l'écriture des specs / à la clôture des sessions (écran élève, calibration L8…). S'y ajoutera le test reporté C11a-6 (synthèse hebdo → ligne `scriptorium` classe seule)._

## C11a — Coûts API + attribution (commits `8d96c85` + `25e1884`, sur `feat/c11a-couts`)

_Section consolidée des deux rapports de clôture (C11a et C11a-bis, 25/07) par Cowork.
**L'ordre comptait** : le test 1 n'était observable qu'AVANT d'exécuter le SQL._

**✅ Chantier C11a clos le 26/07 (décision PO).** 1-5 joués et validés par la requête de
contrôle — la logique du journal est prouvée de bout en bout (écriture, attribution
élève + classe, tokens, tuile). 10 soldé par la manière dont 4-5 ont été joués (note).
6-9 reportés : ils testent les **modules porteurs** plus que le journal → repris dans les
sections **C2 · C7 · C4/C8 · C13** à l'écriture de leurs specs.
**Reliquat immédiat : merge `feat/c11a-couts` → `main` + push, sans attendre** — depuis
l'exécution du SQL, palimpseste.ink tourne sur le code d'AVANT C11a : il journalise des
lignes valides mais **non attribuées**, sans vérification d'`error`. La fenêtre se ferme
au déploiement.

- [x] **C11a-1 · État dégradé (joué AVANT le SQL).** `npm run dev` sur `feat/c11a-couts`, ouvrir `/prof` en prof → la ligne « Coût API » porte une pastille rouge et « Total partiel — source illisible : journal api_couts » ; le terminal crache `[cout-api] lecture illisible — api_couts … PGRST205`. _(Validé le 26/07. C'était le test du chantier : avant, cet écran affichait sereinement un total faux.)_
- [x] **C11a-2 · Migration.** SQL Editor de la sandbox → `c11a_api_couts.sql` (v2), puis le bloc de vérification → `table_ok = t, rls_ok = t, policies = 1, index_created_ok = t, index_eleve_ok = t, colonnes_attribution = 7`. _(Validé le 26/07 ; case **Sandbox** de la ligne du 25/07 cochée dans `SUIVI_SQL.md` (26/07).)_
- [x] **C11a-3 · Tuile réparée.** Recharger `/prof` → pastille bleue, plus de mention « total partiel ». _(Validé le 26/07.)_
- [x] **C11a-4 · Aletheia (le module le plus coûteux — test le plus important).** Retour V1 produit (soumission élève test) → ligne `aletheia` avec `eleve_id` renseigné. _(Validé le 26/07 — requête de contrôle.)_
- [x] **C11a-5 · Scriptorium chat.** `rag_actif` ON temporairement, 2-3 messages élève, OFF → lignes `scriptorium` avec élève ET classe ; montants cohérents avec `scriptorium_messages`. _(Validé le 26/07 — requête de contrôle.)_
- [ ] **C11a-6 · Synthèse hebdo.** « (Re)générer » sur une semaine ayant des messages → ligne `scriptorium` **classe seule** + `scriptorium_rag_syntheses.cout` renseigné ; semaine sans messages : `VIDE`, aucune ligne. _(**Reporté le 26/07 → recette C2** (fin du RAG, S2) — trop tôt ici.)_
- [x] **C11a-7 · Quazian.** Création d'un quiz → ligne `quazian` avec `classe_id`, jamais d'`eleve_id`. _(**Reporté le 26/07 → C7** — la création de flashcards/quiz est cassée en sandbox depuis le 24/07 ; C7 commence par la remise en marche.)_ ➜ **Rouvert et posé dans la section C7 · L1** (13/08) : il s'y joue après C7L1-6, la création de quiz étant redevenue possible. **Joué et validé le 13/08** (section C7 · L1) : `appels = 2`, `attribues_eleve = 0`, `attribues_classe = 1`, `avec_tokens = 2`, 0,0509 $. Reporté depuis le 26/07, soldé en 18 jours.
- [ ] **C11a-8 · Fragments / Codex (l'autre source).** Un dépôt analysé, une séance Codex → la tuile voit monter « Fragments » / « Codex » sans passer par `api_couts`. _(**Reporté le 26/07 → C8 pour Fragments** (création de semaines bloquée) **· C4 ou C13 pour Codex** (création de séance bloquée, reliquat C1).)_ ⚠️ **Part Fragments jouée le 13/08 (C8·L1) — le test ne peut pas passer en l'état.** Le dépôt a bien été analysé et le coût écrit ($0,028 dans `fragments_analyses.cout_api`), mais **`api_couts` est resté vide de toute ligne `fragments`** : la chaîne Fragments n'appelle `enregistrerCoutApi()` nulle part (vérifié sur `analyse.ts`, `analyse-orale.ts`, `analyse-essai.ts`, `synthese-semestre.ts`, `transcription.ts`). Ce n'est pas un effet de C8 : c'est un câblage manquant de C11a. Correctif proposé dans `IDEES_post_rentree.md` — **à faire avant de recocher ce test**, et vérifier Codex au même moment.
- [ ] **C11a-9 · Tuile complète.** Total = somme des modules affichés ; les 5 modules présents dès qu'ils ont un coût dans le mois _(critère « fait » du plan)_ ; format `$0.0421` / `$12.34`. _(**Reporté le 26/07 → C13** — le scénario de recette générale se termine déjà par « → coûts » : c'est là que les 5 modules seront visibles ensemble.)_
- [x] **C11a-10 · Non-régression.** _(Aucune manipulation nouvelle : ce test dit seulement « le flux élève marche toujours pendant que le journal écrit » — la journalisation est best-effort et ne doit jamais coûter son retour à un élève. Or 4 et 5 ont été joués avec un élève réel au bout du flux : le retour V1 est arrivé, le chat a répondu, et `avec_tokens = appels` à la requête de contrôle. **Soldé par 4-5 le 26/07** — à décocher si quelque chose avait cloché côté élève pendant ces tests.)_

**Requête de contrôle (à réutiliser pour 6-9 dans leurs chantiers porteurs) :**

```sql
select module, count(*) as appels, count(eleve_id) as attribues_eleve,
       count(classe_id) as attribues_classe, count(tokens_entree) as avec_tokens,
       round(sum(cout)::numeric, 4) as total_usd, max(created_at) as dernier
  from api_couts group by module order by total_usd desc;
```

_Vides d'attribution **attendus** (pas des bugs) : capstone et fiche de référence Aletheia (coûts
de livre), flashcards et régénération de question Quazian (contenu partagé), diagnostic Quazian
(toutes classes), synthèse hebdo (classe seule). C'est la future ligne « Coûts de classe / non
attribués » de `SPEC_C11c_ecran_couts.md`. Trou de comptage connu, accepté : un tour de chat dont
l'usage fournisseur est indisponible n'écrit rien au journal (compté 0, loggé `usage indisponible`
— recoupable via `scriptorium_messages`)._
