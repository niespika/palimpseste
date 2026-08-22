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

_**RECETTE CLOSE le 14/08 — dix tests sur dix.** Les huit prévus, plus deux défauts découverts en
chemin et corrigés dans la foulée (C7L3-9, la révision élève qui ne s'enregistrait jamais ;
C7L3-10, le compteur qui annonçait trois nombres différents). Jouée à deux : les clics dans les
sessions prof et élève par Louis (aucun mot de passe saisi par l'agent), le pilotage d'écran et
tous les constats en base par l'agent. Règle d'or respectée : Chrome pour la re-découpe (`confirm()`
natif), et Cmd-R avant de conclure à un bug — deux fois, une lecture trop rapide m'a fait croire à
un clic mort qui n'en était pas un._

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
grain « cours entier » : **une re-découpe dé-granule les cartes**. Aucune perte, une précision
perdue — c'est le test C7L3-7 qui le vérifie en vrai. ⚠️ Et « ✦ Régénérer » ne rend PAS cette
précision : `genererCartes` insère sans rien remplacer, donc on obtiendrait les anciennes cartes au
grain contenu PLUS un jeu neuf ancré aux sous-sections — des doublons. Retrouver le grain fin
demande d'archiver ou supprimer les anciennes d'abord (parqué dans `IDEES_post_rentree.md`).

- [x] **C7L3-1 · Le bouton « Publier » a disparu, l'écran dit l'état réel.** Prof →
  `/prof/quazian` : plus aucun bouton « Publier aux élèves / Masquer », ni sur la fiche de la cible
  choisie ni sur `/prof/quazian/<cible>`. À la place, pour « NAture humaine » : « **Test** — 1
  sous-section vue sur 2 → N cartes visibles » et « **T5** — 0 sous-section vue sur 2 → 0 carte
  visible ». Pour « Cognitif » : « **Test** — pas encore vu → 0 carte visible » (et pas de ligne T5,
  qui ne l'a pas au parcours). La tuile n'est **verte** que si au moins une classe voit des cartes.
  _(**Validé le 14/08**, session prof déjà ouverte, aucun mot de passe saisi. Les deux écrans sont
  nets : aucun bouton de publication nulle part, et la phrase de l'exemple du prompt sort telle
  quelle une fois les cartes validées — « **Test — 1 sous-section vue sur 2 → 14 cartes visibles** »,
  « **T5 — 0 sous-section vue sur 2 → 0 carte visible** ». **14, c'est exactement le compte de la
  sous-section 1**, la seule cochée « vue » en Test : les 31 cartes de la sous-section 2 sont
  écartées, et T5, qui n'a rien coché, ne voit rien. Le compte passe par `compterVisibles`,
  c'est-à-dire par la règle de l'élève elle-même — l'écran prof ne peut donc pas annoncer autre chose
  que ce que l'élève verra.)_
- [x] **C7L3-2 · Génération par sous-section.** Prof → `/prof/quazian?cible=<NAture humaine>` →
  « ✦ Générer les cartes ». Attendu : **deux appels IA**, un par sous-section, et sur
  `/prof/quazian/<cible>` chaque carte à valider porte son « § <titre de sous-section> ». Un cours
  NON découpé (« Cognitif ») et un texte source (« test ») ne montrent aucun « § » — grain contenu.
  ⚠️ Si le SQL n'est pas joué, la génération d'un cours découpé refuse avec le message dédié
  (« La base ne connaît pas encore les sous-sections… ») : c'est le garde-fou, pas un bug.
  _(**Validé le 14/08.** **45 cartes** générées : **14** ancrées sur « Qu'est-ce que la nature? »
  (1835 signes) et **31** sur « Qu'est-ce que la nature humaine ? » (7624 signes) — la proportion
  suit la matière, ce qui est le signe que chaque sous-section a bien été décortiquée pour
  elle-même. **Deux appels IA distincts prouvés en base** : deux lignes `api_couts` module `quazian`,
  `claude-sonnet-4-6`, 0,023 $ puis 0,056 $ — et non un seul appel sur le texte entier. Chaque carte
  de la file de validation porte son « § Qu'est-ce que la nature? ». Les 45 validées d'un coup par
  « ✓ Tout valider ».)_
- [x] **C7L3-3 · Le « vu » ouvre CETTE sous-section, et elle seule (le cœur du lot).** Valider les
  cartes générées (**aucun geste de publication**). Scriptorium → grille d'instance de **Test** :
  la sous-section 1 de « NAture humaine » est déjà vue, la 2 ne l'est pas. Élève de Test →
  `/eleve/modules/quazian` : il voit les cartes de la sous-section **1** seulement, dans une tuile
  au nom du cours. Cocher « vu » la sous-section 2 → les siennes apparaissent. Décocher → elles
  repartent. Les compteurs du tableau de bord (« à réviser aujourd'hui », « cartes au total »)
  suivent. _(**Validé le 14/08**, en croisant session prof (navigateur intégré) et session Elo
  (Chrome). Les 45 cartes validées de « NAture humaine » se répartissent en **14 + 31** ; la
  visibilité a suivi le « vu » dans les deux sens, à chaque cran :_

  | « Vu » de la classe Test | Ce que voit Elo |
  |---|---|
  | sous-section 1 seule | **14 cartes** — les 31 de la sous-section 2 restent invisibles |
  | + sous-section 2 | **45 cartes** _(constaté par Louis)_ |
  | les deux décochées | **0 carte de ce cours** — la tuile disparaît |

  _Le dernier cran est le plus parlant : le cours a **45 cartes validées en base** et l'élève n'en
  voit **aucune**, parce qu'aucune sous-section n'est vue — donc le cours n'est pas « entamé », et
  même la règle du grain contenu ne laisse rien passer. Les compteurs du haut suivent à chaque fois
  (« N à réviser aujourd'hui · N cartes au total »).
  ⚠️ **Limite d'outillage, pas un défaut de l'app** : la case « vu » de `GrilleInstance` n'a pas
  répondu aux clics pilotés dans le navigateur intégré (clic par référence, clic par coordonnées
  vérifiées au pixel, barre d'espace après focus — **aucune Server Action ne partait**, journal
  réseau vide, case ni désactivée ni masquée, console propre). Les `<button onClick>` du même
  environnement répondent très bien (génération et « Tout valider » pilotés sans souci). Les clics
  du test ont donc été faits **à la main par Louis** — ce qui prouve au passage que la case répond
  à un vrai clic.)_
- [x] **C7L3-4 · Tuiles par cours côté élève.** Onglet Flashcards : une tuile par cours ayant des
  cartes visibles — **nom du cours**, nb de cartes, badge « N à réviser ». Un clic ouvre la
  consultation **de ce cours** (`?cours=<id>` dans l'URL, retour arrière du navigateur compris).
  La **file de révision reste GLOBALE** (décision R7) : « Réviser mes N cartes » mélange les cours,
  et chaque carte affiche le sien en haut à droite pendant la session. _(**Validé le 14/08** sur Elo
  (classe Test, mono-classe) : « MES COURS » porte **une seule tuile, « NAture humaine — 14 cartes »**,
  avec les badges « 14 à réviser » et « 14 nouvelles » ; les stats du haut disent « 14 à réviser
  aujourd'hui · 14 cartes au total ». Le clic ouvre bien la consultation du seul cours
  (`?cours=4171c66e…`), titrée à son nom. **Deux ratés relevés et traités :**
  (1) la navigation prend ~4 s en dev — deux lectures trop rapides m'ont fait croire à un clic mort,
  ce n'en était pas un ; (2) **vrai défaut de ce lot, corrigé sur-le-champ** : l'écran de consultation
  affichait **DEUX « ← Retour » empilés** — celui du module (vers le tableau de bord) au-dessus de
  celui de la consultation (vers les tuiles). Le premier est désormais masqué quand `?cours=` est
  posé. Revérifié : un seul retour.)_
- [x] **C7L3-5 · Les cartes déjà publiées passent sous le régime « vu ».** Avant de cocher quoi que
  ce soit : l'élève de Test ne voit **plus** les 18 cartes de « Cognitif » (elles étaient publiées).
  Cocher « vu » l'élément « Cognitif » de l'instance de Test → **les 18 reviennent** d'un coup.
  Comportement voulu (cf. encadré ci-dessus), à consigner tel quel. _(**Validé le 14/08**, dans les
  deux temps. **Avant** : aucune tuile « Cognitif » chez Elo — les 18 cartes publiées le 13/08 ont
  bel et bien disparu, sans que rien n'ait été dépublié. **Après** un seul clic « vu » sur l'élément
  « Cognitif » de l'instance de Test : la tuile revient et **les 18 cartes avec**, d'un coup
  (« Cognitif — 18 cartes · 18 à réviser · 18 nouvelles »). Cours NON découpé → grain contenu → le
  contenu « entamé » suffit, exactement la décision R7 du prompt de lot. **Le prof n'a rien publié
  ni dépublié de la séance** : la publication n'existe plus, seul le « vu » a parlé.)_
- [x] **C7L3-6 · Rejeu de C7L2-5 — le bi-classe reste étanche.** `Sacha` (`eleve1@test.com`, Test +
  T5), même session, seul le commutateur change : en **T5** il ne voit **toujours rien** de
  « Cognitif » (pas au parcours de T5) et rien de « NAture humaine » tant que T5 n'a coché aucune
  sous-section ; en **Test** il voit ce que le « vu » de Test ouvre. Le « vu » étant par classe, la
  divergence est native — c'est le §10.2 du rapport de diagnostic, réglé au passage. _(**Validé le
  14/08 par Louis**, session Sacha — je n'ai pas piloté celle-ci. L'étanchéité tient : en contexte
  **Test** il voit ce que le « vu » de Test ouvre, en contexte **T5** il ne voit rien, et le message
  d'absence porte bien la reformulation du lot (« Elles apparaîtront au fil des cours vus en
  classe » — plus « ton professeur n'a pas encore publié de cartes »).
  ⚠️ **Constat de Louis en jouant le test, hors périmètre :** en contexte T5, Sacha ne devrait même
  pas ATTEINDRE cette page — **T5 n'a pas le module Quazian**. Il devrait rester au choix de classe.
  C'est le trou déjà consigné le 14/08 dans `IDEES_post_rentree.md` (« les modules donnés à une
  classe ne donnent ni ne retirent réellement l'accès ») : côté élève, `aAccesModule`
  (`utils/acces.ts`) répond oui dès qu'UNE classe a le module — l'UNION, par conception du Lot 1.
  Le prompt de ce lot l'avait anticipé : « l'accès module × classe → session dédiée
  (`PROMPT_Code_Acces_classes_L1.md`), **ne pas l'entamer ici, même si les deux se frôlent sur
  l'écran élève Quazian** ». **Rien touché**, décision de Louis confirmée sur le moment.)_
- [x] **C7L3-7 · Re-découpe d'un cours qui a des cartes (le point dur du SQL).** Scriptorium →
  éditeur de sections de « NAture humaine » → re-sauver la découpe (confirmation « re-découpe
  consciente »). Attendu : **aucune carte supprimée** (le compte reste le même sur
  `/prof/quazian/<cible>`), le « § » disparaît de chaque carte (dé-granulation par `set null`), et
  côté élève les cartes deviennent visibles dès que le cours est **entamé** au lieu de suivre chaque
  sous-section. Re-générer leur rend leur sous-section. ⚠️ Vérifier aussi que l'historique FSRS
  survit : une carte déjà révisée ne redevient pas « Nouvelle ». _(**Joué le 14/08 par Louis**
  (re-découpe à l'identique, confirmation native validée dans Chrome), **vérifié en base par moi.
  Trois clauses sur quatre sont vertes :**
  (1) **les sections sont bien recréées avec des uuid NEUFS** — `created_at` 18:33:40, alors que le
  « vu » d'une d'elles datait de 18:30:57 : la preuve directe que la re-découpe détruit et recrée ;
  (2) **les 45 cartes sont toutes là**, aucune détruite, `contenu_id` intact ;
  (3) **toutes dé-granulées** — `section_id` à null pour les 45, exactement ce que `on delete set
  null` promettait, et le « § » a disparu de l'écran prof ;
  (4) le **« vu » est reporté par TITRE** : « Qu'est-ce que la nature? » a gardé son horodatage
  d'origine (18:30:57) à travers la re-découpe, sur une section pourtant nouvelle.
  **La quatrième clause — la survie de l'historique FSRS — n'a PAS pu être jouée à ce moment-là** :
  il n'y avait aucun historique à faire survivre, et c'est en le cherchant qu'on a trouvé le bug
  muet de `soumettreNote` (test C7L3-9 ci-dessous). Depuis le correctif, l'historique existe
  (18 états FSRS sur ce cours) : **une seconde re-découpe le prouverait pour de bon** — à jouer.
  ➜ **CLAUSE FERMÉE le 14/08, seconde re-découpe jouée par Louis** — cette fois avec un historique
  à mettre en danger. Constat en base, et l'horodatage scelle la démonstration : les sections sont
  **encore recréées avec des uuid neufs** (`7a6739eb…` / `04e81be6…`, `created_at` **18:57:55** —
  différents du jeu précédent, `19cc2392…` / `06b78428…` à 18:33:40, donc bien deux destructions
  successives) ; les **45 cartes** sont là, toutes dé-granulées ; et surtout **les 18 états FSRS de
  ce cours sont intacts, 18 révisions comptées, ZÉRO carte revenue à l'état « New »** — alors que la
  plus ancienne révision date de **18:47:52**, soit AVANT la re-découpe de 18:57:55. Les 30 lignes
  de `quazian_review_log` sont également intactes. Louis le confirme à l'écran : aucune carte n'est
  redevenue « Nouvelle ». **Le choix `on delete set null` est donc validé de bout en bout** : la
  re-découpe reste possible (ce que `restrict` interdirait), et elle n'emporte ni les cartes ni
  l'historique FSRS des élèves (ce que `cascade` détruirait).)_
- [x] **C7L3-9 · Un bug MUET débusqué par la recette : la révision élève ne s'enregistrait jamais.**
  _(Hors plan de test initial — trouvé le 14/08 en cherchant à prouver la clause FSRS de C7L3-7.)_
  **Le symptôme :** `quazian_card_states` était **vide pour toute la base**, alors qu'Elo venait de
  noter des cartes. L'écran affichait pourtant « ✓ N cartes révisées ». **La cause :** la policy RLS
  `eleve_read_flashcards` joint sur `scriptorium_unite_id` (NULL pour toute carte du bras contenu →
  `NULL = NULL` jamais vrai) et exige une ligne `quazian_publications`. **Prouvé en simulant
  l'identité d'Elo** (rôle `authenticated` + claims JWT, transaction annulée) : **zéro carte
  lisible**. Or la garde de `soumettreNote` lisait la carte avec le client user-scoped avant de créer
  l'état FSRS → `null` → sortie silencieuse. **Antérieur à ce lot** : le bug date de C7·L1 (naissance
  du bras contenu sans que la policy suive) et restait masqué parce que toutes les autres lectures
  passent par le client admin — cette garde était le seul endroit à interroger la table sous RLS.
  C7·L3 l'aurait rendu définitif en retirant la publication que la policy réclame.
  **Correctif (voie 1, décidée par Louis) :** la garde lit en `admin`, comme le reste du fichier ;
  le périmètre n'est volontairement PAS resserré au passage (ce serait une décision de conception,
  R7). _(**Validé le 14/08** : après correctif, Elo note ses cartes → **30 états FSRS et 30 lignes
  de `quazian_review_log`** créés au premier essai, 12 sur « Cognitif » et 18 sur « NAture humaine »,
  contre 0 avant. Le geste qui tombait dans le vide depuis six semaines est réparé.)_
  **Suite SQL (voie 2, décidée par Louis) :** la policy morte est retirée par
  `c7_quazian_rls_eleve.sql` — pas réécrite, pour ne pas tenir la règle du « vu » à deux endroits.
  _(**Jouée en sandbox le 14/08**, après merge et push : les trois drapeaux à `t`
  — `policy_retiree`, `policy_prof_intacte`, `rls_toujours_active`.)_
- [x] **C7L3-10 · Trois nombres pour une seule notion : le compteur mentait à l'élève.**
  _(Hors plan de test initial — signalé par Louis en révisant ses cartes, le 14/08.)_
  **Le symptôme :** l'écran annonçait « **50** à réviser », la session n'en servait que **30**, et la
  somme des tuiles par cours en disait **58**. Trois définitions concurrentes sur un même écran,
  pour l'état réel d'Elo : 63 cartes, 28 nouvelles, 30 dues.
  **La cause :** deux formules qui n'ont jamais concordé. `chargerFileRevision` coupe la file à
  `slice(0, 30)` ; `chargerStatsRevision` annonçait `dues + min(nouvelles, 20)` — une troisième
  valeur, qui ne correspond ni au stock mûr ni à la session. Le plafond de « 20 nouvelles par
  jour » qu'esquissait cette formule **n'a jamais existé dans la file**. **Antérieur au lot**
  (Lots 6/7), mais invisible tant qu'un élève restait sous le plafond : Elo avait 18 cartes avant
  C7·L3, les trois nombres coïncidaient. **Le troisième nombre, lui, vient de ce lot** — les tuiles
  par cours comptent les cartes mûres avec le même prédicat que la file, ce qui a rendu
  l'incohérence flagrante.
  **Correctif (formulation proposée par Louis) : un état honnête, deux notions, deux mots.**
  `mures` = tout ce qui est prêt (jamais vu, ou échéance atteinte) ; `aFaire` = `min(mures, 30)`,
  c'est-à-dire ce que la file servira vraiment, le plafond de session étant désormais une constante
  partagée par les deux. L'écran dit « Tu as X cartes mûres — aujourd'hui tu en révises Y », le
  bouton ne promet que Y, et les tuiles par cours disent « N mûres » : elles décrivent l'état d'un
  cours, elles ne promettent pas une session. _(**Validé le 14/08 à l'écran**, session Elo :
  « 30 à réviser aujourd'hui · 63 cartes au total », « Tu as 63 cartes mûres — aujourd'hui tu en
  révises 30 », bouton « Réviser mes 30 cartes », tuiles « 18 mûres » et « 45 mûres ». Croisé avec
  la base : 63 cartes, 28 nouvelles, 35 dues, **63 mûres** — l'écran dit exactement l'état réel.
  ⚠️ Au passage, un raté à moi rattrapé par la vérification navigateur : la constante du plafond
  était d'abord `export`, ce qu'un fichier `'use server'` interdit — `tsc` ne le voit pas, la page
  rendait une 500. Corrigé avant commit.)_
- [x] **C7L3-8 · Smoke élève immédiat après le SQL (protocole renforcé).** Connexion élève test +
  une soumission Aletheia + un tour sur `/eleve/modules/quazian`. Rien d'autre du flux existant ne
  doit bouger. _(**Validé le 14/08**, les deux volets joués APRÈS le retrait de la policy.
  **Quazian** — c'était le vrai risque, la migration touchant précisément cette table : les états
  FSRS passent de **30 à 35** (dernière révision 19:38:55), donc la lecture élève survit sans la
  policy et l'écriture tient. **Aletheia** — soumission d'Elo à 19:38, `statut = FEEDBACK1_READY`,
  retour V1 généré, aucun `retour_v1_erreur_at` : la chaîne complète (dépôt → génération → retour
  prêt à lire) est passée. ⚠️ **Première tentative bloquée**, et c'est l'app qui a bien fonctionné :
  le gate transverse « retours non lus » (`utils/retours-lus.ts`) gèle tout rendu tant qu'un retour
  reste non lu — ici une note de quizz Quazian. Louis l'a levée en lisant la note, puis la
  soumission est passée. Rien à corriger : le gate a fait exactement son travail.)_

**Reste hors de ce lot, volontairement :** la génération AUTOMATIQUE au clic « vu » (déclencheur) →
post-rentrée, écartée par le prompt de L2 et toujours écartée ; le diagnostic de fragilités et ses
deux fils cassés → **C6** ; le design des Paramètres → coupe pré-décidée ; le sort de
`quazian_publications` et de sa colonne `classe_id` → arbitrage (§10.1) ; l'accès module × classe →
séance dédiée (`PROMPT_Code_Acces_classes_L1.md`). Les quiz ne bougent pas.

## Accès & classes · L1 — le module appartient à la classe (branche `feat/acces-classes`)

_**Une migration dans ce lot** : `acces_classes_l1_retirer_inscription.sql` (reprise de
`retirer_inscription` — une instruction ajoutée, la purge des conversations Scriptorium), ligne créée
au `SUIVI_SQL.md` **avant** exécution, rollback prêt (`acces_classes_l1_retirer_inscription_rollback.sql`,
non destructif). **Protocole RENFORCÉ, et respecté** : répétition à blanc d'abord (corps du fichier
seul, transaction annulée, règle 6 — sandbox revérifiée intacte après le `rollback`), puis code mergé
et poussé (`a68f2d8`), puis SQL en sandbox, puis smoke élève. **Exécutée le 14/08.**_

_**Questions ouvertes tranchées par Louis le 14/08, après la recette** : la synthèse « Cognitif » × T5
— **il redonne Codex à T5 et l'efface lui-même** ; les sélecteurs transverses (Scriptorium, plan
d'évaluation) — **on ne les filtre pas**, motifs en table ci-dessous, mais la règle se tient au moment
d'écrire (ACL1-12) ; la nav élève, l'index « Tes mondes » et le calendrier — **restent sur l'union**,
donc en contexte T5 un onglet Codex reste offert et mène à « Pas dans cette classe » ; le Scriptorium
élève — **garde la phrase de refus** plutôt que le 404._

_**RECETTE CLOSE le 14/08 — douze tests sur douze.** Jouée à deux : les sessions prof et élève ouvertes
par Louis (aucun mot de passe saisi par l'agent), le pilotage d'écran et tous les constats en base par
l'agent. Face élève dans l'aperçu embarqué — sans risque, aucun `confirm()` n'y intervient — et **face
Pilotage dans Chrome**, le seul endroit où la preuve comptait puisque c'est là que le dialogue natif
mordait. ACL1-9 a été joué en DEUX temps, avant et après la migration, pour constater le trou en vrai
plutôt que le déduire._

_Prouvé sans navigateur : `tsc --noEmit` vert, `npm test` **175/175** (dont 3 neufs sur « Au parcours
de… », `utils/quazian-visibilite.test.ts`), `npm run build` vert, `eslint` identique à `main`
(13 problèmes, tous préexistants et hors des fichiers du lot)._

### Le diagnostic de la croix de retrait (fait le 14/08, en base sandbox)

Trois suspects étaient à départager. Verdict :

| Suspect | Verdict |
|---|---|
| **(a)** `confirm()` natif muet | ✅ **C'EST LA CAUSE.** Les deux surfaces faisaient `if (!confirm(…)) return` : dans un aperçu embarqué ou un onglet ayant bloqué les dialogues, le handler abandonne **avant toute requête**. Cinquième morsure du même piège (24/07, C8·L2, C8·L3, C7·L1). |
| **(b)** RPC de juin vs schéma d'août | ⚠️ **Pas un blocage, mais un vrai défaut.** Les **12 FK qui pointent `inscriptions` sont toutes `on delete cascade`** — aucune ne bloque le delete ; les FK élève-scopées pointent `profiles`, qu'un retrait ne touche pas. Répétition à blanc du retrait (Sacha × T5, transaction annulée) : passée sans erreur. **En revanche la fonction laisse du travail ORPHELIN** : `scriptorium_conversations` (née en juillet, RAG L5) est scopée (élève × CLASSE) **sans `inscription_id`** → aucune cascade ne l'atteint, la fonction ne la nommait pas. Prouvé : conversation + message semés sur Sacha × Test, retrait joué, `rollback` → **tous deux survivaient**. D'où la migration de ce lot. |
| **(c)** `GestionEleves.tsx` | ✅ **Confirmé, et pire que la croix** : cette surface `await retirerEleve(fd)` et **jetait le résultat** — un échec serveur n'y apparaissait nulle part. `LigneEleve.tsx`, lui, affichait bien l'erreur (en petit, sous les jetons). |

_Correctif : une seule confirmation EN PAGE (`components/pilotage/ConfirmationRetrait.tsx`, patron
`TableauLive` du commit `89625fc`) partagée par les **deux** surfaces, qui **dit ce qui va partir**
(aperçu serveur `apercuRetraitEleve` : dépôts, essais, oraux, synthèses Codex, quizz passés, séances
Aletheia, conversations Scriptorium, et la révision FSRS si c'est la dernière classe) et affiche
l'erreur dans le panneau, plus dans le vide._

### Le recensement demandé (requête de contrôle du 14/08 — RIEN N'A ÉTÉ DÉTRUIT)

Lignes déjà créées pour une classe qui n'a pas le module, balayage complet (Codex, Quazian, livres
Aletheia, travaux Aletheia, conversations Scriptorium, dépôts Fragments) :

| Objet | Classe | Lignes | Détail |
|---|---|---|---|
| `codex_sessions` | **T5** | 1 | « Cognitif », statut `phase_1`, créée le 14/08, **0 travail élève** |
| Livre assigné (Aletheia) | **T5** | 1 | « LesLumière test » (`scriptorium_unite_classes`) |

> ⚠️ **Conséquence à trancher (Louis).** Les tuiles de classe filtrant désormais elles aussi, la
> synthèse « Cognitif » × T5 **n'est plus atteignable depuis `/prof/codex`** — elle est intacte en
> base, mais l'écran ne l'offre plus, donc plus moyen de la fermer par l'interface. Trois issues
> possibles : donner Codex à T5, supprimer la ligne, ou rouvrir une tuile « classes sans le module ».
> Rien n'a été fait dans un sens ou dans l'autre.

### Le balayage `from('classes')` — corrigé vs listé

**Corrigés (surfaces de CONCEPTION)** : Codex `page.tsx` (formulaire **et** tuiles) · Quazian
`quizz/page.tsx` (création + tuiles) · Quazian `page.tsx` et `[cibleId]/page.tsx` (le libellé « Au
parcours de… ») · Aletheia `page.tsx` (tuiles de classes). **Plus TROIS gardes serveur** :
`creerSynthese`, `creerQuizz` et `preparerSynthese` refusent une classe sans le module (filtrer le
sélecteur empêche le geste nominal, la garde empêche le geste tout court).

**Listés, NON touchés** (et pourquoi) :

| Site | Motif |
|---|---|
| `app/prof/quazian/diagnostic/page.tsx:128` et `:250` | Écran de CONSULTATION, et rangé en **C6** par `IDEES_post_rentree.md` (ses deux fils sont cassés par ailleurs). |
| `app/prof/quazian/semestre/page.tsx:42` | Résolution de noms pour des classes déjà dérivées des quiz fermés — consultation. |
| `app/prof/codex/synthese-a-preparer.ts:37`, `aletheia/eleve/[eleveId]:259`, `fragments-erudition/essais/[essaiId]:36`, `quazian/quizz/plan-quazian.ts:63`, `scriptorium/instance-serveur.ts:74`, `evaluations/panoptique-serveur.ts:143` | Lectures **par id** (résolution de nom), pas des sélecteurs. |
| `app/prof/scriptorium/page.tsx:83` | Sélecteur de conception, mais **transverse** : c'est l'atelier où l'on assigne un livre à une classe, et ce livre est lu par **Aletheia**, pas par le Scriptorium. Le filtrer ferait disparaître **THLP** — qui a Aletheia sans avoir le Scriptorium — et interdirait de lui donner un livre. **Tranché le 14/08 : on ne filtre pas.** |
| `evaluations/modele-serveur.ts:170`, `evaluations/plan-serveur.ts:120` | Sélecteurs du plan d'évaluation : un plan fabrique du travail pour **plusieurs modules à la fois**, aucun ne peut le filtrer seul. **Tranché le 14/08 : on ne filtre pas le sélecteur — la règle se tient au moment d'écrire** (cf. ACL1-12 ci-dessous). |
| `/prof/a-risque`, `/prof/calendrier/*`, `/prof/classes/*`, `/prof/eleves`, `/prof/modules`, `/prof/page.tsx`, `utils/calendrier-*`, `utils/rappels.ts` | Hors d'un écran de module. |

### Les tests

_Terrain (lu en base le 14/08) : **T5** n'a que `fragments-erudition` · **Test** a les cinq modules ·
**THLP** n'a qu'`aletheia`. **Sacha** est bi-classe (Test + T5), **Elo** mono-classe (Test)._
_Règle d'or : Chrome, pas l'aperçu embarqué, et Cmd-R avant de conclure à un bug._
_⚠️ **Ne pas jouer le test 9 sur Sacha** — les tests bi-classe vivent sur lui : créer un élève JETABLE._

- [x] **ACL1-1 · Prof / Codex** — `/prof/codex` : le formulaire de synthèse ne propose plus **T5** (Test seule), et les tuiles de classe non plus. _(Joué le 14/08 dans Chrome. Le `<select>` « Classe » n'a plus qu'une option, « Test » ; la tuile T5 a disparu de la liste.)_
- [x] **ACL1-2 · Prof / Quazian** — `/prof/quazian/quizz` : la création de quizz ne propose que **Test**. Sur `/prof/quazian` et sur la fiche d'un cours, « Au parcours de… » n'annonce plus **T5**. _(Joué le 14/08. **Le cas est probant, pas vide** : vérifié en base que T5 a bien « NAture humaine » au parcours — instance active, 2 éléments — tout en n'ayant pas le module Quazian. Avant ce lot l'écran affichait « T5 — 0 sous-section vue sur 2 », promettant des cartes visibles à des élèves qui n'ouvriraient jamais Quazian ; il n'annonce plus que « Test — 1 sous-section vue sur 2 → 45 cartes visibles ». Même résultat sur l'écran de détail `/prof/quazian/[cibleId]`.)_
- [x] **ACL1-3 · Prof / Aletheia** — `/prof/aletheia` : les tuiles de classe montrent **Test** et **THLP**, pas T5. _(Joué le 14/08. T5 disparaît alors qu'un livre lui est bien assigné — c'est exactement la ligne du recensement ci-dessus.)_
- [x] **ACL1-4 · Recensement intact** — en base, la synthèse « Cognitif » × T5 et le livre assigné à T5 sont **toujours là** (rien détruit). _(Vérifié le 14/08 après les corrections : synthèse `32cc4f85…` toujours en `phase_1`, livre « LesLumière test » toujours lié à T5.)_
- [x] **ACL1-5 · Sacha, contexte Test** — la grille « Mes mondes » montre les modules de **Test** ; en basculant sur **T5**, elle se réduit à **Fragments** seul. _(Joué le 14/08, dans les deux sens. T5 → « FRAGMENTS D'ÉRUDITION » seul ; Test → les cinq. C'est le changement le plus visible du lot : l'union y affichait les cinq quelle que soit la classe.)_
- [x] **ACL1-6 · Sacha, le cas réel** — entrer dans **Quazian** depuis Test, puis basculer le commutateur sur **T5** : l'écran-message « Quazian n'est pas ouvert pour T5 · Passe sur Test avec le commutateur » s'affiche (plus la page vide d'hier, cf. C7L3-6). _(Joué le 14/08, sans quitter la page : « **Pas dans cette classe** — Quazian n'est pas ouvert pour T5. Passe sur Test avec le commutateur, en haut, pour y accéder. » **Et le refus ne déborde pas** : en contexte T5, Fragments — que T5 a — s'ouvre normalement, tandis que Codex, Aletheia et le Scriptorium donnent le même message, chacun sous son propre nom.)_
- [x] **ACL1-7 · Sacha, état « Toutes »** — comportement **C7L2-4 inchangé** : le tableau de bord agrège, et chaque module demande « Quelle classe ? ». _(Joué le 14/08. Le tableau agrège et chaque tâche porte sa classe (« Une séance de synthèse est en cours. · Test ») ; « Mes mondes » montre l'union — juste, le périmètre EST l'union dans cet état ; le Scriptorium demande « Quelle classe ? » en n'offrant que **Test**, T5 ne l'ayant pas.)_
- [x] **ACL1-8 · Elo, mono-classe** — **rien ne change** (C7L2-7) : aucun écran-message, aucun choix de classe. _(Joué le 14/08. Commutateur absent, « Mes mondes » = les 5 modules de Test, les trois tâches du tableau de bord présentes, et les 5 modules ouverts un par un s'affichent normalement — Quazian, Codex, Scriptorium, Aletheia, Fragments. Aucun écran-message, aucun « Quelle classe ? ». Joué dans l'aperçu embarqué : sans risque ici, aucun `confirm()` n'intervient côté élève.)_
- [x] **ACL1-9 · Pilotage, la croix retire vraiment** — créer un élève **JETABLE**, l'inscrire dans **deux** classes, y semer un peu de travail (au moins une conversation Scriptorium sur Test, le cas que la migration répare). Croix sur un jeton de classe → le panneau s'ouvre **et dit ce qui va partir**. Confirmer. **Vérifier en base** : l'inscription part, le travail scopé de cette classe part (conversations comprises), l'autre classe survit.
  _**Première moitié jouée le 14/08, AVANT la migration** (élève « ZZ Jetable ACL1 », inscrit Test + T5, semé d'1 conversation Scriptorium + 2 messages et d'1 séance Aletheia, tous sur Test) :_
  - _le panneau s'ouvre **dans la page** et annonce « 1 séance de lecture Aletheia · 1 conversation du Scriptorium », puis « Son compte n'est pas touché. Il reste inscrit en T5, où son travail est intact. » ;_
  - _**la croix retire vraiment** — c'était le bug (a) : inscription Test partie, T5 intacte, séance Aletheia partie ;_
  - _**et le trou est constaté en vrai** : la conversation Scriptorium et ses 2 messages **ont survécu** au retrait, exactement ce que la répétition à blanc annonçait. Le panneau promet donc une suppression que la RPC de juin ne fait pas._
  _**Seconde moitié jouée le 14/08, APRÈS la migration**, sur le même élève remis en place (Test + T5, 2 conversations Scriptorium — dont l'orpheline du premier essai — + 4 messages, et 1 séance Aletheia) : le panneau annonce cette fois « 2 conversations du Scriptorium », et le retrait emporte **tout** — inscription Test partie, **conversations 2 → 0**, **messages 4 → 0**, séance Aletheia partie, **T5 intacte**, compte intact. Aucun dégât collatéral : Elo (3), Girard Dupont (1) et Sacha (1) gardent leurs conversations. Le trou est donc constaté ET refermé sur la même donnée, le même jour. **Test soldé.**_
- [x] **ACL1-10 · L'échec se voit** — provoquer un échec (ex. retirer deux fois) : le message s'affiche **en clair dans le panneau**. _(Joué le 14/08 : inscription retirée en base derrière le dos d'une page restée ouverte, puis clic sur « Retirer » → « **Cet élève n'est plus inscrit dans cette classe.** » s'affiche en rouge dans le panneau. C'est la surface qui, avant ce lot, jetait purement et simplement le résultat de l'action.)_
- [x] **ACL1-11 · L'autre surface** — même geste depuis « Gérer les élèves » d'une classe (`GestionEleves`) : **même panneau**, même aperçu, même affichage d'erreur. _(Joué le 14/08 : même composant, et les deux formulations alternatives vérifiées au passage — « Il n'a encore aucun travail dans cette classe. » et « C'est sa dernière classe. »)_

- [x] **ACL1-12 · La porte dérobée du plan d'évaluation** — trouvée en tranchant les questions ouvertes, le 14/08, **après la clôture des onze premiers tests**. Le plan d'évaluation est le seul endroit qui écrit dans un flux vivant (`codex_sessions`, via « Préparer → ») ; il ne vérifiait pas que la classe a Codex, et le gate est **actif** (`plan_evaluation_actif = t`). C'est très probablement ce qui a produit la synthèse « Cognitif » × T5. _(Joué sur pièce : un plan JETABLE créé sur T5 — classe sans Codex — avec une synthèse « à concevoir ». L'écran affichait bien « NAture humaine — T5 · Préparer → » alors que la tuile T5 avait disparu. **Deux pressions du bouton : aucune séance Codex créée, l'exercice reste `a_concevoir`, aucune session liée.** Cas de recette retiré ensuite, sandbox revérifiée à son état.)_
  _⚠️ **Et un second défaut trouvé au passage, corrigé dans la foulée** : la garde refusait **en silence** — l'action jetait son `error`, le prof pressait « Préparer → » et il ne se passait rien, sans un mot. C'est le même défaut que la croix du Pilotage, dans un autre écran. L'échec s'affiche désormais en clair au-dessus de la liste : « La classe de ce plan n'a pas le module Codex. Donne-lui le module depuis sa fiche avant de préparer la synthèse. »_

> **Dérive d'état pendant la recette, dite plutôt que lissée.** `classe_modules` a changé en cours de
> route : **T5 a reçu le module Scriptorium le 14/08 à 22:42 UTC** (Louis, en cochant le chip du
> Pilotage — les chips de « Modules accessibles » basculent au premier clic, sans confirmation, et
> écrivent aussitôt). ACL1-5 et ACL1-6 ont été joués **avant** ce basculement et restent valides :
> l'écran suivait fidèlement `classe_modules` à ce moment-là. Depuis, Sacha en contexte T5 verrait
> Fragments **et** Scriptorium — même règle, donnée différente.

**Reste hors de ce lot, volontairement :** le sort du travail d'une classe à qui l'on RETIRE un
module (séances, cartes, contenus restent en base — la règle d'accès de ce lot suffit à le rendre
inatteignable dans le contexte de cette classe) → check-in ; la visibilité Quazian au « vu » →
`PROMPT_Code_C7_L3.md` ; « bloquer un élève jamais signalé » → non.

## Calendrier · Année — on borne l'année, les semestres se déduisent (branche `feat/calendrier-annee`)

_**Aucune migration dans ce lot** : ni table, ni colonne. `semesters` reste la source de vérité et
ses trente-huit lectures ne bougent pas — seule la PORTE D'ENTRÉE change (une action d'année à la
place des actions de semestre)._

_**Vert avant recette** : `npm test` 192/192, `tsc --noEmit` propre, `eslint` propre, `next build`
compilé. Les nouveaux tests purs couvrent `calerAnnee` (rentrée un mercredi, fin de S1 un mercredi,
S2 qui démarre bien le lundi suivant, année d'une seule semaine, **et la semaine à cheval comptée
deux fois SANS le calage**) et `semestreActifAttendu` (dans le S1, dans le S2, avant la rentrée,
après la fin d'année, aucun semestre, déterminisme). Trois tests de plus prouvent P8 : une année
calée ne laisse à la frise ni avis de troncature, ni `avisBloquant`, ni `a_definir`._

**✅ RECETTE CLOSE LE 20/08 — neuf tests sur neuf.** Jouée à deux : sessions prof et élève ouvertes
par Louis (aucun mot de passe saisi par l'agent), pilotage d'écran et constats en base par l'agent.
Face prof **dans Chrome** (règle d'or — c'est là que les confirmations comptaient) ; face élève dans
le navigateur intégré, sans risque : l'écran de dépôt ne porte aucun `confirm()`.

**État de la sandbox au départ (20/08, relevé en lecture seule) :** un seul semestre vivant,
« Semestre test 2 » (2026-07-01 → 2026-08-21), **de l'année scolaire 2025-2026** — donc pas de
l'année du jour. L'écran Année ouvrait un formulaire vide pour 2026-2027 (comportement voulu) et
signalait ce semestre dans le bloc « Encore vivant hors de 2026-2027 ». 2 semestres, 2 périodes de
vacances, 23 semaines, **0 dépôt**.

**État à l'arrivée (à savoir avant de jouer avec) :** la **Semaine 1 est OUVERTE** et porte **un
dépôt de contrôle** de l'élève Elo (photo générée, commentaire « Dépôt de contrôle — recette CAL-5b »).
À retirer quand tu voudras repartir vierge. Par ailleurs : année 2026-2027 créée — `Semestre 1` 2026-08-31 → 2027-01-24 et `Semestre 2`
2027-01-25 → 2027-06-20 ; l'année 2025-2026 archivée (ses deux semestres, restaurables) ; 4 périodes
de vacances ; 69 lignes `fragments_semaines` (jamais une de moins qu'au départ) ; une seule ligne
`is_active`. ⚠️ **Reliquat de recette** : le S2 porte **4 semaines hors calendrier** (2026-12-21,
12-28, 2027-01-04, 01-11), nées des allers-retours de CAL-3/CAL-7 et conservées à dessein. L'écran
les affiche. À purger à la main si tu veux repartir propre.

- [x] **CAL-1 · Adoption.** Ouvrir `/prof/calendrier/config?section=annee` : les trois dates sont
  pré-remplies depuis les bornes des deux semestres (`rentrée = S1.start`, `fin S1 = S1.end`,
  `fin d'année = S2.end`), **aucune ligne créée, aucun `id` changé** (relevé en base avant/après :
  identique, `6868293f` et `87942c63` inchangés). _(Joué après CAL-2, l'adoption n'ayant rien à
  adopter au départ — cf. l'état de sandbox ci-dessus.)_
- [x] **CAL-2 · Saisie non calée.** Trois dates hors bornes de semaine — **mercredi 2026-09-02**,
  **mercredi 2027-01-20**, **jeudi 2027-06-17**. Le bloc « Ce qui sera retenu » a annoncé, au mot
  près de la spec, **« Semestre 1 : lundi 31 août → dimanche 24 janvier »** et **« Semestre 2 :
  lundi 25 janvier → dimanche 20 juin »**. Enregistrement : **2 lignes créées**, 21 semaines
  chacune, et **aucune semaine à cheval**. _(Validé le 20/08.)_
  **⚠️ La requête de contrôle a dû être corrigée** — celle d'origine
  (`select date_debut, count(*) … having count(*) > 1`) est **trop grossière** : elle compte aussi
  les semaines « hors calendrier », que le lot conserve VOLONTAIREMENT (P3) et qui peuvent partager
  un lundi avec une semaine vivante de l'autre semestre. Le contrôle qui vaut ne regarde que les
  lignes **alignées sur la grille de leur propre semestre** :
  ```sql
  -- (a) le vrai bug visé : deux semestres VIVANTS dont les grilles partagent un lundi
  select a.name, b.name
  from semesters a join semesters b on a.id < b.id
  where a.archived_at is null and b.archived_at is null
    and a.start_date <= b.end_date and b.start_date <= a.end_date;   -- → 0 ligne

  -- (b) deux lignes ALIGNÉES qui portent le même lundi (hors orphelines)
  select w.date_debut, count(*)
  from fragments_semaines w join semesters s on s.id = w.semestre_id
  where w.date_debut between s.start_date - 6 and s.end_date
  group by w.date_debut having count(*) > 1;                          -- → 0 ligne
  ```
  _(Les deux à 0 le 20/08, y compris après les déplacements de CAL-3 et CAL-7.)_
- [x] **CAL-3 · Déplacement.** Rentrée **repoussée** d'un mois (31 août → 28 septembre) : les deux
  semestres suivent, S1 passe de 21 à 17 semaines, la numérotation se recale, le compteur
  **« 4 semaines hors calendrier — conservées telles quelles »** apparaît sur la carte du S1 (P3,
  qui ne vivait jusqu'ici que dans un message fugace), le rail porte « semaines à générer », et
  **aucune ligne n'est supprimée** (65 lignes avant, 65 après ; l'`id` du semestre inchangé).
  _(Validé le 20/08. L'avertissement « dépôts existants » n'a pas pu être vu : 0 dépôt en base.)_
  **⚠️ Note sur l'énoncé** : « reculer la rentrée d'un mois » depuis le 31 août franchit la
  frontière du 1er août. Joué tel quel, l'écran **refuse proprement** : « Une année scolaire va du
  1er août au 31 juillet : ces dates enjambent la frontière (2025-2026 → 2026-2027) », et le bloc
  « Ce qui sera retenu » montre pourquoi (« lundi 27 juillet »). Rien n'a été écrit. Le piège du §3
  est donc vérifié en vrai, en plus du test pur.
- [x] **CAL-4 · Actif.** Après archivage de l'année 2025-2026, `Semestre 1` a pris le drapeau
  **sans aucune intervention** — alors qu'il ne commence que le 31 août, soit onze jours plus tard :
  c'est la **règle 2** (« le prochain à commencer ») démontrée sur données réelles. En base, une
  seule ligne `is_active = true`, et le semestre archivé a bien vu son drapeau **éteint**. Plus
  aucun bouton « Définir actif » à l'écran. _(Validé le 20/08.)_
- [x] **CAL-5a · Fragments vit (face prof).** `/prof/fragments-erudition` liste les **18 semaines**
  du Semestre 1 — exactement les 18 semaines d'enseignement de la frise, vacances sautées — avec
  les échéances au **dimanche** (« Limite : fin du 6 septembre », pas le 5 : la discipline de fuseau
  de l'item 7 tient). _(Validé le 20/08.)_
- [x] **CAL-5b · Un dépôt élève passe.** Smoke test de la règle 5 du `SUIVI_SQL.md`. Élève « Elo »
  (classe Test) : Fragments disait d'abord « Aucune semaine n'est ouverte » — juste, les semaines
  naissent fermées ; après « Rouvrir » sur la Semaine 1 côté prof, l'élève voit **« Semaine 1 · À
  rendre avant la fin du dimanche 6 septembre »** et le dépôt **passe** (« ✓ Déposé »). En base :
  1 ligne `fragments_depots` (`statut = depose`, **1 photo** stockée — donc l'upload et la RLS ont
  fonctionné), rattachée à la **semaine n° 1 du Semestre 1**, celui qui porte `is_active`, et sa
  `date_limite` vaut `2026-09-07T03:59:59.999+00:00` — soit **dimanche 6 septembre 23 h 59 à
  Toronto**. L'item 7 tient donc jusqu'au dépôt réel, pas seulement dans les tests.
  _(Validé le 20/08. **Réserve honnête** : aucun outil ne pilote le sélecteur de fichiers de l'OS —
  la photo a été fabriquée dans la page et remise à l'`<input type=file>`. Tout le reste du chemin
  — compression, EXIF, upload au stockage, action serveur, RLS — est le vrai.)_
- [x] **CAL-3b · P4, l'avertissement « dépôts existants ».** Rejoué APRÈS CAL-5b, une fois un dépôt
  en base — il n'avait pas pu se déclencher jusque-là. « Enregistrer l'année » ouvre bien la
  confirmation : « L'année 2026-2027 porte déjà **1 dépôt**. Déplacer les bornes renumérote les
  semaines : un élève qui avait lu « Semaine 7 » pourra lire « Semaine 6 ». Aucun dépôt n'est perdu
  (ils suivent leur semaine), et aucune ligne n'est supprimée. » _(Validé le 20/08, puis **annulé** —
  rien n'a été réécrit.)_
- [x] **CAL-6 · Le parcours vit.** Vérifié sur pièce en rejouant `construireFrise` (la vraie
  fonction du dépôt) sur les données de la sandbox : **`avis` aucun, `avisBloquant` aucun**, ancre
  résolue à l'index 1 sans avis, **39 semaines de parcours dont 0 non résolue** (donc plus aucun
  `a_definir`), frontière S1→S2 contiguë (dernier dimanche 2027-01-17 → premier lundi 2027-01-25)
  et index continus. Le calage éteint bien la troncature de `end_date` non dominicale.
  _(Validé le 20/08. La vue Évaluations elle-même est derrière le flag `plan_evaluation_actif` :
  la preuve a été prise sur la fonction, pas sur l'écran.)_
- [x] **CAL-7 · Vacances — les deux branches.** (a) **Rattachée** : une période créée dans le S1
  (« Relâche de test », 18→24 janv.) et devenue entièrement intérieure au S2 après déplacement de la
  frontière → `semester_id` passé de S1 à S2, **même `id`**, message « 1 période de vacances
  rattachée à l'autre semestre ». (b) **Signalée** : une période à cheval sur la frontière
  (« Vacances de Noël », 24 déc. → 3 janv.) → laissée en place, message « 1 période désormais hors
  des dates de son semestre — à corriger dans Vacances (rien n'a été supprimé) », et l'écran
  Vacances porte l'avertissement sur la ligne. (c) **Sens inverse** : remise de l'année à ses dates
  initiales → les deux périodes reviennent au S1. `select count(*) from holidays` inchangé à chaque
  fois. _(Validé le 20/08.)_
- [x] **CAL-8 · Le rail dit « Année ».** Le rail porte **Année**, son résumé dit l'année scolaire et
  son état (« 2026-2027 · S1 à venir », puis « S1 en cours » à la rentrée), le fil se lit
  « Fuseau → Année → Vacances → Classes », et l'ancre `?section=semestres` atterrit bien sur Année.
  _(Validé le 20/08 — **après correctif** : le rail annonçait « à définir » sur une année pourtant
  saisie, parce que l'état se lisait sur le drapeau GLOBAL, porté par un semestre d'une autre année
  scolaire. Il se lit désormais sur les semestres de l'année elle-même.)_
- [x] **CAL-9 · Plus de `confirm()` natif.** Sur **Chrome** : « Archiver l'année » ouvre une
  confirmation **dans la page**, qui dit ce qui va partir (« 1 semestre quitte les listes de l'app.
  Rien n'est détruit : dépôts, thèmes, synthèses, quizz et semaines restent en base, et l'année se
  restaure depuis l'onglet Archives »). Aucune boîte native. _(Validé le 20/08. « Supprimer » et
  l'avertissement « dépôts existants » partagent le même composant, non déclenchés faute de dépôt.)_

**🔍 REVUE ADVERSARIALE (20/08, après la recette).** Quinze agents sur six lentilles, puis un
sceptique par constat chargé de le RÉFUTER : **cinq constats sont tombés, huit ont tenu**. Six ont
été corrigés dans la foulée, les trois plus graves vérifiés à la main avant correction :

- **A · « Archiver l'année » pouvait laisser ZÉRO `is_active`, et ça désarmait une garde côté élève.**
  Le lot avait levé le garde-fou « ne jamais archiver l'actif » (l'archivage porte désormais sur
  l'année). Or `app/eleve/modules/fragments-erudition/actions.ts` lisait
  `if (semActifDepot && …)` — garde **sautée** quand personne n'est actif, donc un dépôt passait sur
  une semaine restée ouverte d'un semestre archivé. Passée en **fail-closed** : plus de semestre
  actif = plus de dépôt. _(Trou ouvert par ce lot, refermé par ce lot.)_
- **B · Le formulaire ne se resynchronisait jamais avec la base.** Après « Archiver l'année », les
  trois champs gardaient les dates archivées, le bouton repassait à « Créer l'année », et un clic
  insérait **deux lignes en doublon exact** — la garde de chevauchement ignore les archivés, à
  raison. Dépôts et semaines seraient restés sur les `id` archivés pendant que les lignes neuves et
  vides auraient pris le drapeau. Corrigé des deux côtés : resynchronisation des props pendant le
  rendu côté client, **et** refus serveur de recréer des bornes déjà présentes en archive.
  _(Vérifié en vrai le 20/08 : archivage → champs vides ; restauration → champs remplis, sans
  navigation.)_
- **C · La branche « trois semestres ou plus » n'offrait que « Archiver toute l'année ».** La spec
  §5 demande d'archiver les **surnuméraires** ; la seule sortie offerte emportait aussi le semestre
  porteur des dépôts. `archiverSemestre(id)` est réintroduite, réservée à cette branche, avec un
  bouton par carte. _(Non joué en vrai : la branche est inatteignable par l'écran — l'action refuse
  au-delà de deux — il faudrait insérer une troisième ligne à la main.)_
- **D · `restaurerAnnee` ne comparait pas les archivées entre elles** (`chevauchementSemestre` ne
  lit que les vivants). Une AY portant plusieurs générations archivées les ressuscitait toutes d'un
  coup → `avisBloquant` sur la frise. Tri + refus de chevauchement, et refus au-delà de deux.
- **E · `semainesGenerees` comptait les lignes hors calendrier.** Vu à l'écran pendant la recette
  sans être relevé : « 21 semaines générées sur 17 » **et** « 4 hors calendrier » — 17 + 4 = 21. La
  pastille « semaines à générer » restait donc allumée à vie après un déplacement de bornes. Le
  compte ne retient plus que les lignes alignées sur la grille. _(Vérifié : la pastille a disparu.)_
- **F · La pastille « ACTIF » sur un semestre pas encore commencé** contredisait le rail de la même
  page (« S1 à venir ») et affichait une barre de progression à 0 %. **Décision de Louis : l'état
  temporel prime.** La carte dit désormais « à venir » / « en cours » / « terminé », la bordure verte
  reste sur l'actif attendu, et une ligne en clair dit le reste : « Porte le drapeau actif — c'est ce
  semestre que lisent Fragments et Quazian ».
- **G · Le signalement P5 était invisible sur l'écran vers lequel il renvoie.** `horsBornes` n'était
  calculé que pour le semestre affiché, et l'écran Vacances s'ouvre par défaut sur l'actif : si la
  période signalée appartenait à l'autre, le prof arrivait sur un écran muet. Le compte se fait
  désormais sur tous les semestres, le rail porte « n à replacer », le sélecteur marque les
  semestres concernés, et un bandeau renvoie vers le bon.

**Reste hors de ce lot, volontairement :** plus de deux semestres (trimestres, sessions d'été) ;
réparer les semaines hors calendrier (les montrer suffit) ; geler le `numero` sous un dépôt ; le taux
de dépôt qui compte les semaines de vacances ; recâbler les lecteurs de `is_active` ; **préparer
l'année suivante pendant l'année en cours** (l'écran travaille sur l'année scolaire du jour, et
refuse explicitement des dates d'une autre année plutôt que de réécrire l'année en cours en silence).
`EcranVacances` garde son `confirm()` natif — touché par le lot, hors de son périmètre.

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

## C4 · L8 — La fabrique du professeur (sandbox, quatre migrations du 20/08)

_Section ouverte le 21/08 depuis `RELEVE_C4_L8_2026-08-20.md`. **Le chantier C4 n'avait aucune
section ici** — ni C4-L1, joué le 18/08, ni C4-L8 : le suivi du chantier commence à cette ligne, et
les trois restes ci-dessous ne vivaient jusqu'ici que dans un relevé que personne ne relit._

_Ce qui a été prouvé EN SÉANCE est coché avec sa preuve. `npm test` : **296 tests, 0 échec** ;
`derive-doctrine.py --verifie` dit **IDENTIQUE** sur les onze tables, les neuf empreintes de source
et la fixture. **Les trois restes demandaient un vrai navigateur, connecté en prof** — règle d'or :
Chrome, jamais l'aperçu embarqué, et Cmd-R avant de conclure à un bug._

_**Séance du 21/08 — « les trois épreuves » : LES QUINZE SONT COCHÉES.** Les trois dernières ont été
jouées dans Chrome, connecté en professeur, et la séance a rapporté **un défaut grave qu'elle n'a
pas réparé** — la doctrine lue tronquée à 1000 routes sur 3264 (**F1** ci-dessous), qui vide la
banque de consignes de **sept objets sur treize**. Elle n'invalide aucune des quinze preuves : les
3264 routes sont bien en base, c'est la LECTURE applicative qui plafonne._

⚠️ **Quatre interrupteurs sont à OFF** : les trois du `07-` §1.5 (`exercices_actif`, `routeur_actif`,
`competences_affichage_actif`) plus `fabrique_actif`, propre au lot. Et **les statuts de recette ont
été remis à `mesuree_silencieusement`** après les preuves — `evaluee` est un acte du professeur, pas
d'une recette. Les reposer fait partie de tout test qui en dépend.

### Les trois dernières, jouées le 21/08 dans Chrome (session « trois épreuves »)

_Jouées **dans Chrome**, connecté en professeur, contre le serveur de développement et la sandbox
`aoakpxxlyvthzueaywna` ; chaque preuve est une ligne de base ou ce que l'écran affiche, relu par
requête. **Les quatre interrupteurs étaient et sont restés à OFF** ; le statut `evaluee` posé pour
C4L8-2 a été **remis à `mesuree_silencieusement`**, vérifié par requête._

- [x] **C4L8-1 · La porte Codex, de bout en bout.** Les six étapes du `02-` §6 B.2, dans l'ordre.
  (1) **Dépôt du matériau `genere`** par le bouton du corpus — `recette_c4l8_materiau_codex.json`,
  rapport à l'écran : « materiaux : **1 entrée(s)** », 0 refus, **2 signalements** (« visé par aucune
  instance » ; « famille « le lien manque » (argument) : un seul membre — aucune paire ne pourra s'y
  faire »), puis validé en file : `mat-lien-codex-0001` → `statut = valide`
  (`fbd50f7c-36e3-495c-9a8d-8b4e3e2c0cd3`, `argument` × `composer`, support `extrait`).
  (2) **Conception par la porte Codex** — `argument` × `composer` × **cran 3** *(transformation_guidee)*,
  `materiau_cible` `genere` / `extrait`, observable **`charniere_formule` · structure** pris à la
  route, banque de **12 distracteurs** saisie : instance `d15ef81f-f3bc-4d24-bbad-f15adbe57a88`,
  `statut = concu`, `modes_par_competence = {"structure": ["composer"]}`.
  ⭐ **La porte tient sa règle** : la provenance n'offre que `genere` et `sujet` —
  **`texte_auteur` n'y est pas** (piège 28).
  (3) **Édition** — « Instance corrigée. » à l'écran, `consigne_instanciee` réécrite et
  `updated_at ≠ created_at` en base.
  (4) **APERÇU — le constat que le prompt disait le plus grave, et il est BON** : sur une banque de **12**,
  l'aperçu rend **QUATRE candidats** — trois distracteurs *(« d'ailleurs », « or », « en
  conséquence »)* **plus la `reponse_attendue`** — et **jamais la banque entière** ; **aucune ligne
  de correction** (cran 3 = `transformer`, pas `diagnostiquer`). **Tirage déterministe vérifié** :
  les trois mêmes après rechargement.
  (5-6) **Assignation** à T5, fenêtre 22 → 29 septembre : « Exercice commun assigné — **2 dépôt(s)
  créé(s), `origine` `prof`** ». En base : `exercices` `statut = assigne`, `classe_id` T5 ; et
  **2 lignes d'`exercices_depots`, `origine = prof`, `statut = assigne`, `echeance =
  2026-09-29 00:00:00+00`**. _(21/08.)_
  ⚠️ **Deux écarts constatés en chemin, décrits et NON réparés** — voir « Ce que la séance a trouvé »
  plus bas : la **doctrine lue tronquée** (F1) et la **`reponse_attendue` toujours en dernière
  position** (F2).
  ℹ️ Le relevé disait « la banque ne porte aucun matériau `genere` pour un couple objet ×
  `composer` » : **elle en portait déjà deux** (`mat-garant-a`, `mat-garant-b`, `argument` ×
  `composer`, `valide`, entrés par l'import du 20/08). Le dépôt a été fait quand même — c'est le
  geste que l'épreuve demande.
- [x] **C4L8-2 · L'opt-out d'une classe, AU BOUTON.** `expression` posée **`evaluee` au bouton**
  (« expression → evaluee — **17 ligne(s) d'élève**, la date posée dans le même geste »), puis
  **clic sur le bouton « active » de THLP × Expression** : « expression : opt-out posé — ce cours ne
  la travaille pas », le bouton devient **`opt-out`** et son `aria-label` passe de « Retirer » à
  « Remettre ». En base : **THLP `active = f`** (`updated_at 18:40:32`) et **T5 et Test restent
  `active = t`, `updated_at` inchangé à `02:38:00`** — la compétence n'a bougé que pour cette classe.
  **Le geste est rejouable** : « redevient active » → `t`, puis retiré une seconde fois → `f`
  (`18:41:15`), puis remis `t`. Synthèse n'a bougé dans aucune des trois classes.
  **Remises en état vérifiées par requête** : les 6 lignes à `active = t`, `expression` de retour à
  `mesuree_silencieusement` sur ses 17 lignes. _(21/08.)_
  ℹ️ **Le bouton n'est pas là où la règle le loge.** Le `07-` §1.3 dit « au **profil de la classe**,
  au tableau de pilotage » ; il vit en fait à **`/prof/competences` §4**, en matrice classes ×
  compétences. Le profil de classe *a* un onglet « Compétences »
  (`/prof/classes/[id]?vue=competences`) mais c'est une **« Zone en construction »** qui affiche
  cinq colonnes inventées *(Analyser · Interpréter · Argumenter · Problématiser · Conceptualiser)*
  et « Aucune donnée réelle » — **ce ne sont pas les six du `07-` §1.2**. Écran antérieur à C4
  (`project_pilotage_classe`), hors périmètre du lot : constaté, non touché.
  ⭐ **TRANCHÉ par Louis le 21/08 : le bouton DÉMÉNAGE au profil de la classe**, comme le `07-` §1.3
  l'écrit. Geste au **lot de correctifs** — déplacer `OptOutClasses.tsx` *(l'action `poserOptOut` ne bouge
  pas)* et décider du sort de la zone en construction. Inscrit au `PLAN_DE_CHANTIER.md` §6. **La preuve
  ci-dessus reste valable** : c'est le bouton qui a été éprouvé, pas son adresse.
- [x] **C4L8-3 · La dévalidation d'une référence validée — jouée, et voici ce qu'elle fait.**
  Dévalidée à l'écran (`ff46eabc-…`, la décomposition de `txt-descartes-med2`), retour affiché :
  « **Référence dévalidée : aucune instance NEUVE ne peut plus se concevoir dessus. 1 instance(s)
  déjà bâtie(s) sur ce texte ne sont pas défaites — retirez-les une à une si c'est ce que vous
  voulez.** » Ce que la plateforme fait **exactement** :
  · **Ce qu'elle FERME, et immédiatement** — `validee_at` et `validee_par` passent à `null` ; la
    porte **Aletheia n'offre plus aucun texte** (liste vérifiée : 1 texte avant, **0 après**) ; la
    référence **revient en file** (« Les références à valider » passe de **1 à 2**) ; et la garde
    serveur de `concevoirInstance` refuse en source **comme en cible**.
  · **Ce qu'elle NE FAIT PAS** — l'instance `473b2c25-…` qui vise ce texte **reste `assigne`**,
    `bloque = f`, `blocages = []`, `updated_at` **inchangé** ; ses **2 dépôts restent `assigne`**
    avec leur échéance ; son écran ne porte **aucun bandeau**, et le bouton **« Assigner à la
    classe » y reste actif** — `assignerALaClasse` ne lit jamais la référence. Le texte lui-même
    **reste `valide` et non bloqué** au corpus : `validerReference` lève le blocage du texte,
    `devaliderReference` **ne le repose pas**.
  ⭐ **Verdict : la règle est LAISSÉE OUVERTE, pas satisfaite ni dépassée.** Le `02-` §6 A veut
  qu'**aucune** instance ne tourne sur une référence non relue, et le `08-` §7 en fait son blocage
  n° 1 : la plateforme l'applique **à la conception à venir** et **le dit honnêtement**, mais
  **rien de mécanique ne retient une instance déjà assignée** — elle serait servie telle quelle si
  `exercices_actif` passait à ON. **Aucun élève n'a rien vu** : les quatre interrupteurs sont à OFF.
  **Remise en état** : la référence a été **re-validée au bouton** ; `validee_at` porte une
  **nouvelle date** (`2026-08-21 18:44:48+00` au lieu de `02:46:41`) — l'état est le même, l'horodate
  ne l'est pas. _(21/08.)_
  ⭐ **TRANCHÉ par Louis le 21/08 : le message honnête suffit** — on assume que la règle reste ouverte, et
  **aucun mécanisme ne sera posé** pour retenir les instances déjà assignées. *Le doute est noté avec la
  décision (« je crois »).* ⚠️ **Ce qui la rouvrirait** : une passation réelle sur une référence dévalidée
  en cours de route — impossible tant qu'`exercices_actif` est à OFF. Inscrit au `PLAN_DE_CHANTIER.md` §6.

### Ce que la séance a trouvé, et n'a PAS réparé

_**Les quatre écarts ont été soumis à Louis le 21/08 et tranchés le jour même** ; chaque arbitrage est recopié sous son écart, et son geste est inscrit au `PLAN_DE_CHANTIER.md`._

- ⛔ **F1 — LA DOCTRINE EST LUE TRONQUÉE : 1000 routes sur 3264.**
  `chargerLignesDepuisBase` (`utils/fabrique/doctrine.ts`) lit `exercices_routes` par un
  `admin.from('exercices_routes').select(…)` **sans `range`** ; PostgREST plafonne la réponse.
  Constaté par en-tête : `content-range: 0-999/3264`, **stable sur trois lectures**. Conséquences
  vues **à l'écran**, pas déduites : à la porte Codex, `argument` × `composer` × cran 3 propose
  **16 consignes** quand la base en route **24** *(les **7 routes d'Argumentation** et
  `connaissance/contresens` manquent)* ; et `partie` × `composer` × cran 3 affiche
  « — choisir une consigne de la banque **(0)** — » quand la base en porte **40** — le `select` étant
  `required`, **l'objet devient inconcevable**. **Sept objets sur treize n'ont AUCUNE route
  visible** : `paragraphe`, `partie`, `phrase`, `plan`, `problematisation`, `reference`,
  `transition`. La même doctrine tronquée sert la **garde serveur** (`empechementsDeConception`) et
  le **contrôle d'import de la plateforme** (`verifie-import.ts`) : un observable pourtant routé s'y
  ferait refuser « non routé » (refus n° 15 / blocage n° 3). Règle enfreinte : « l'observable vient
  **DE LA ROUTE** » (`04-` §0) et « la banque du couple objet × mode × cran s'affiche » (`02-` §6 B).
  ⚠️ **C4L8-15 reste vrai** — les **3264 routes SONT en base**, et le contrôle Python qui dit
  `IDENTIQUE` lit les sources, pas PostgREST : c'est **la lecture applicative** qui est en défaut,
  pas la dérivation. **`exercices_routes` est la seule des douze tables de doctrine à dépasser 1000
  lignes** (la suivante, `exercices_consignes_isolees`, en porte 336).
  ⭐ **TRANCHÉ par Louis le 21/08 : F1 devient SON PROPRE LOT, et il passe AVANT C4-L3.** Inscrit au
  `PLAN_DE_CHANTIER.md` §2 et §3 sous le nom **`C4-L8-bis` — la doctrine lue en entier** ; C4-L3 en dépend
  désormais au graphe. **Rien n'a été réparé ici.**
  ✅ **RÉPARÉ le 21/08 par C4-L8-bis** — voir la section de ce lot plus bas. `chargerLignesDepuisBase`
  pagine désormais **les douze tables** par un seul chemin (`lireTable`), chacune **ordonnée sur sa clé
  primaire**, et **confronte ce qu'elle a lu au décompte que la base annonce** : elle **s'arrête** sur
  une doctrine tronquée au lieu de refuser en silence ce qui est licite. Constaté à l'écran :
  `partie` × `composer` × cran 3 passe de **(0) à (40)**, **les treize objets offrent leur banque**, et
  un observable routé sur un objet naguère aveugle **passe la garde serveur ET le contrôle d'import**.
  ⚠️ **La liste des sept objets aveugles n'était PAS stable** : au rejeu du 21/08 au soir,
  `argument` × `composer` × cran 3 affichait déjà **24** avant correction (et non 16) — `--sql` refait
  l'ordre physique à chaque passe, et c'est lui qui décide quelles mille lignes reviennent. **Les sept
  objets nommés ci-dessus étaient bien les sept aveugles au moment du rejeu.**
- ⚠️ **F2 — la `reponse_attendue` est toujours le dernier candidat.** `composerApercu`
  (`utils/fabrique/conception.ts`) compose `[...tirerTrois(banque), reponseAttendue]` : la bonne
  réponse **n'est jamais mêlée**, elle est en position 4 à tous les coups — vérifié à l'écran, deux
  affichages sur deux. Le commentaire du même fichier écrit pourtant « **QUATRE candidats, mêlés** ».
  Le tirage réel de la passation vit au déroulé (C4-L3) et n'existe pas encore ; l'aperçu, lui, est
  ce que le professeur relit pour juger le placement.
  ⭐ **TRANCHÉ par Louis le 21/08 : on laisse C4-L3 le corriger.** L'aperçu du professeur **reste
  déterministe** — c'est ce qui permet de le relire deux fois sans qu'il change ; **le mêlage appartient au
  tirage réel de la passation**, qui n'existe pas encore. Déposé en **neuvième item de la boîte de C4-L3**
  (`PLAN_DE_CHANTIER.md` §5).
- ℹ️ **F3 — la consigne dérivée dit « ces trois », l'écran en sert quatre.** La banque écrit
  « **Parmi ces trois** mots de liaison… » ; l'aperçu affiche trois distracteurs **plus** la
  `reponse_attendue`. La réécriture de la formulation par le professeur suffit à le corriger — c'est
  ce qui a été fait sur l'instance de C4L8-1 — mais **la source rendra « trois » à chaque
  dérivation**.
  ⭐ **CORRIGÉ À LA SOURCE LE 21/08** *(accord de Louis)*. **Ce n'était pas un arbitrage** : le
  `02-` §6 *(« l'écran sert QUATRE candidats »)* et le `04-` §1 *(« l'instance en tire TROIS — avec la
  `reponse_attendue`, quatre »)* disent tous deux quatre, **et le code était conforme** ; ce sont les
  libellés d'`instances/` qui étaient faux. **117 lignes réalignées** — **112 consignes** des crans 1 et 3
  et **5 paragraphes « Variante d'objet »** —, les six fichiers bumpés *(argumentation 1.2 · connaissance
  1.1 · expression 2.2 · questionnement 1.1 · structure 1.1 · synthèse 2.2)*. ✅ **RE-DÉRIVÉ ET JOUÉ EN SANDBOX LE 21/08 à
  20:51:13 UTC**, depuis le Mac : `--fixture` régénérée *(empreinte `cf1d46cd5ceb…`)*, `npm test`
  **414/414**, puis le `--sql` **par `psql`** — répétition à blanc *(`commit;` → `rollback;`)* d'abord,
  comptes identiques des deux côtés, puis `COMMIT`. **Vérifié par requête** : `like '%ces trois%'` →
  **0**, `like '%ces quatre%'` → **96**, `doctrine_derivation` → **6 passes**, `outil 1.2`.
  Ligne **cochée** au `SUIVI_SQL.md`. ⚠️ **Mais l'écran, lui, n'en montrera que 6 objets sur 13**
  tant que F1 *(la pagination de `chargerLignesDepuisBase`)* n'est pas levé — lot `C4-L8-bis`.
- ℹ️ **Une autre séance a écrit dans le dépôt pendant celle-ci** — `SUIVI_SQL.md`,
  `scripts/derive-doctrine.py` (`OUTIL` **1.1 → 1.2**) et `utils/fabrique/doctrine.fixture.json`,
  à `14:38` locale, **sans accès à la base et sans exécution**. **Vérifié par requête : la doctrine
  en sandbox n'a pas bougé** — `doctrine_derivation` s'arrête à la **quatrième passe**, `outil 1.1`,
  `2026-08-21 16:05:41+00`, et c'est le `derive_at` que portent `exercices_routes` et
  `exercices_consignes_isolees`. Les constats ci-dessus portent bien sur l'état décrit par le prompt.
- ✔️ **Le balisage markdown se rend à l'écran** — `« **Parmi ces trois…** »`, `**la raison manque**`
  avec leurs astérisques, à l'aperçu comme à l'édition. **Conforme à l'arbitrage du 21/08**, rendu
  restreint attendu de C4-L3 : constaté, **non réparé**.

### Le décor que cette séance a ajouté, et qui reste

_Rien n'a été retiré : ces lignes **sont** la preuve de C4L8-1. Toutes datent du **21/08 vers
18 h 30 UTC**, toutes portent la marque de la recette._

| | identifiant | ce que c'est |
|---|---|---|
| matériau | `mat-lien-codex-0001` · `fbd50f7c-36e3-495c-9a8d-8b4e3e2c0cd3` | `argument` × `composer`, famille « le lien manque », `valide` |
| import | `recette_c4l8_materiau_codex.json` | la trace du dépôt |
| instance | `d15ef81f-f3bc-4d24-bbad-f15adbe57a88` | `argument` × cran 3, conçue **par la porte Codex**, assignée à **T5** |
| dépôts | 2 lignes | `origine = prof`, échéance `2026-09-29` |
| cas | 1 ligne | 12 distracteurs en banque |

**Comptes avant → après** : `exercices` 4 → **5** · `exercices_depots` 12 → **14** ·
`exercices_cas` 6 → **7** · `exercices_materiaux` 2 → **3** · `exercices_imports` 6 → **7**.
`exercices_textes`, `exercices_sujets` et `exercices_demonstrations` **inchangés**. Aucune table
`aletheia_*`, `scriptorium_*` ni `profiles` n'a été touchée.

### Ce qui est prouvé — pour ne pas le rejouer

- [x] **C4L8-4 · Dépôt d'une fiche et statut à l'écran.** Dépôt **par le bouton**, 7 fiches lues ;
  statut posé par `poser_statut_recette`. _(Séance du 20/08.)_
- [x] **C4L8-5 · Un import refusé pour un motif lisible, puis accepté.** `[R02] exercice … : clé
  « credence_cible » que le 08- ne déclare pas` — **le même motif que le script qui fait foi** —
  puis le même fichier corrigé, redéposé sous les mêmes `id`, accepté ; **le second dépôt montre le
  compte des ignorées, banque par banque**. _(20/08.)_
- [x] **C4L8-6 · Un exercice conçu en ligne (voie Aletheia).** Conçu à l'écran (`argument` ×
  `expliquer` × cran 4), édité, aperçu rendu, **assigné → 2 lignes d'`exercices_depots`, `origine`
  `prof`, avec échéance**. _(20/08.)_
- [x] **C4L8-7 · Un exercice conçu dehors suit le même chemin.** L'importé
  `ex-argument-04-garant-0001` passe par la **file** (`a_concevoir` → `concu`), l'édition, l'aperçu,
  et entre au calendrier **par le même geste** — 10 lignes de dépôt. _(20/08.)_
- [x] **C4L8-8 · Les démonstrations, par compétence et par grain.** 2 démonstrations entrées par la
  **cinquième banque** ; la table compétence × grain les montre, et **l'avertissement d'absence
  compte les 16 couples vides**. _(20/08.)_
- [x] **C4L8-9 · La correspondance d'une fiche déposée, lisible en base.** 51 blocs, 6 compétences,
  par requête — **et le Monitoring n'en a aucun, comme la règle le veut**. _(20/08.)_
- [x] **C4L8-10 · Le statut porte sa date.** `statut_recette_pose_le` sur les 17 lignes, **et la
  garde refuse** un statut changé sans sa date. _(20/08.)_
- [x] **C4L8-11 · Sujet et texte rattachés à un cours.** `generique` pour le sujet, un cours apparié
  pour le texte ; **la ligne agrégée des « sans rattachement » disparaît** dès que tout est trié.
  _(20/08.)_
- [x] **C4L8-12 · Une compétence `evaluee` est active dans toutes les classes, sauf opt-out.**
  3 classes ouvertes **sans second geste** ; l'opt-out posé au profil d'une classe s'y lit, pour
  cette classe seule. _(20/08 — le geste au bouton reste à rejouer : C4L8-2.)_
- [x] **C4L8-13 · Le Monitoring a sa ligne et son avertissement.** Une ligne, **deux
  sous-dimensions**, et le passage à `evaluee` **impossible tant que la confirmation n'est pas
  cochée** — l'avertissement d'abord, la confirmation ensuite. _(20/08.)_
- [x] **C4L8-14 · La file de validation, en masse ou une à une.** Les cinq banques validées en
  masse ; **et la validation en masse ne prend jamais une entrée bloquée** — « Tout prendre (0) —
  les bloquées restent dehors ». _(20/08.)_
- [x] **C4L8-15 · La doctrine est lisible en base, et DÉRIVÉE.** 9 crans · 13 modes · 3264 routes ·
  336 consignes isolées · 15 patrons · 24 guides · les `crans[]` des 13 objets. Le contrôle dit
  **IDENTIQUE**, et **il sait dire DIVERGE** : éprouvé sur une valeur changée, sur quinze routes
  retirées, et sur **un seul octet ajouté à `06-Palimpseste.md`**. _(20/08.)_

### Une dette de code ouverte le 21/08, hors recette

⚠️ **`utils/fabrique/verifie-import.ts` est à ré-aligner sur son script.** Le 21/08,
`generateur/verifie-import.py` (dépôt `palimpseste-conception`) a été réparé : le blocage n° 2 force
désormais `validee` à faux, et le blocage n° 1 lit cette valeur **effective** — ce que le `08-` §1
écrivait déjà (« un texte dont la décomposition est bloquée entre avec `validee: false`, quoi que le
fichier déclare »). Son autotest passe de **46 à 48 vecteurs**, dont un qui **échoue sans la
réparation** (`B1 attendu, rendus ['B2']`). Le port en porte 48 + 2 sondes : il lui manque donc les
deux mêmes vecteurs, et la faute que le port recopiait fidèlement (piège 22). **La plateforme, elle,
se comporte déjà bien** — c'est l'écriture qui referme la porte par un B1 hérité —, donc rien
n'urge ; mais tant que les deux contrôles divergent, leurs verdicts ne sont plus comparables.

---

## C4 · L8-bis — La doctrine lue en entier (séance du 21/08 — **AUCUNE MIGRATION**)

**Ce que le lot a changé, et rien d'autre** : `utils/fabrique/doctrine.ts`. La lecture des **douze
tables de doctrine** passe par un seul chemin, `lireTable`, qui **pagine** par pages de mille
*(patron de `depenseParPages`, `utils/chaine/couts-serveur.ts`)*, **ordonne sur la clé primaire de
chaque table**, et **confronte le nombre lu au décompte que la base annonce** — `DoctrineTronquee`,
qui hérite de `DoctrineAbsente`, arrête la lecture quand les deux diffèrent. Plus
`utils/fabrique/doctrine-lecture.test.ts`, qui prouve tout cela **sans base et sans racine**.

⚠️ **Aucune migration, aucune ligne au `SUIVI_SQL.md`, aucune re-dérivation** : ce lot n'écrit rien
en base et ne lit rien de neuf — il lit mieux ce qui était déjà lu. Vérifié en fin de séance :
`doctrine_derivation` **compte toujours 6** *(pas de septième passe)*, dernier outil
`scripts/derive-doctrine.py 1.2`, `exercices_routes` **3264**, `like '%ces trois%'` **0** /
`'%ces quatre%'` **96**, le décor de recette C4L8-1 (`mat-lien-codex-0001`) **intact**, et les
**cinq interrupteurs toujours à OFF** *(`exercices_actif`, `routeur_actif`,
`competences_affichage_actif`, `fabrique_actif`, `chaine_actif`)*.

### Le contrôle d'entrée — joué avant d'écrire une ligne

- [x] **Les quatre pièces du manifeste, à leur version.** `07-` **2.21** · `02-` **5.4** · `04-`
  **3.2** · `08-` **1.2**, toutes **VALIDÉ ET GELÉ** *(vaut relu et validé)*. _(21/08.)_
- [x] **La convention de doctrine — `derive-doctrine.py --verifie`, joué contre la sandbox.**
  `SOURCES : IDENTIQUE` + **onze tables IDENTIQUE** + `FIXTURE : IDENTIQUE`. ⚠️ **Onze contrôlées,
  douze remplies** — `exercices_types_crans` est écrite par `--sql` et jamais lue par `--verifie`
  *(hors périmètre : lot de correctifs)*. _(21/08.)_

### Ce qui est prouvé — pour ne pas le rejouer

- [x] **L8bis-1 · Le défaut reproduit par la lecture applicative, avant correction.**
  `chargerLignesDepuisBase` avec le vrai client admin : `exercices_routes` **1000 lues / 3264 en
  base**, les onze autres tables exactes. Banque `composer` × cran 3 : **sept objets à 0** —
  `paragraphe`, `partie`, `phrase`, `plan`, `problematisation`, `reference`, `transition`.
  ⚠️ `argument` était déjà à **24** *(et non 16 comme le 21/08 au matin)* : **la liste des aveugles
  n'est pas stable**, elle dépend de l'ordre physique que `--sql` refait à chaque passe. _(21/08.)_
- [x] **L8bis-2 · La lecture rend autant de lignes que la base en compte, table par table.**
  Après correction, les **douze** concordent : `exercices_types` **15/15** *(13 objets dérivés + les
  2 types diagnostiques du seed C4-L1 — la fixture, elle, n'en porte que 13)* ·
  `exercices_types_modes` **54/54** · `exercices_types_modes_source` **46/46** ·
  `exercices_types_crans` **117/117** · `exercices_crans` **9/9** · `exercices_durees` **9/9** ·
  `competences_modes_admis` **13/13** · `exercices_routes` **3264/3264** ·
  `exercices_consignes_isolees` **336/336** · `exercices_consignes_production` **15/15** ·
  `exercices_guides_production` **24/24** · `demonstrations_formes` **3/3**. _(21/08.)_
- [x] **L8bis-3 · Le CONTENU, pas seulement le nombre.** Les 3264 routes lues, réduites à leur
  clé `(objet, mode, cran, compétence, code, fichier, section)` : **3264 distinctes**, et **`diff`
  vide** contre les 3264 lignes de la base. **Aucune ligne sautée, aucune répétée** — c'est le tri
  stable qui le garantit. _(21/08.)_
- [x] **L8bis-4 · Les trois cas de la doublure de client — hors ligne, sans base ni racine.**
  `utils/fabrique/doctrine-lecture.test.ts`, **14 tests verts** : ① **pagination complète** —
  4 tours sur `exercices_routes` *(0-999 · 1000-1999 · 2000-2999 · 3000-3999)*, arrêt sur page
  courte, **une seule page** sur les onze autres tables, et **les 3264 sections distinctes et dans
  l'ordre** ; ② **décompte concordant** — la doctrine s'assemble, et le décompte se demande **à la
  base, jamais à la fixture** ; ③ **décompte divergent** — `DoctrineTronquee` levée, **éprouvée sur
  les douze tables une par une**, plus le cas du décompte indisponible. La doctrine **vide** reste
  refusée par son propre message, et **les deux refus ne se confondent pas**. _(21/08.)_
- [x] **L8bis-5 · Le refus est lisible par un humain.** `Doctrine TRONQUÉE — la table
  exercices_routes : 1000 ligne(s) lue(s), 3264 en base. On s'arrête : […] Rien n'est à corriger en
  base : c'est la LECTURE qui n'a pas tout rendu. Si le nombre en base est lui-même trop bas, c'est
  une dérivation qui manque, et elle se rejoue par \`python3 scripts/derive-doctrine.py --sql\`.`
  **Table, nombre lu, nombre attendu**, et ce qu'il faut faire. _(21/08.)_
- [x] **L8bis-6 · Les treize objets offrent leur banque — porte Codex, à l'écran.**
  `composer` × cran 3, objet par objet, lu au libellé du `select` :
  `argument` **24** · `conclusion` **21** · `exemple` **11** · `introduction` **22** · `mot` **7** ·
  `objection` **25** · `paragraphe` **31** · **`partie` 40** · `phrase` **8** · `plan` **15** ·
  `problematisation` **14** · `reference` **10** · `transition` **18**. **Aucune vide.** _(21/08.)_
- [x] **L8bis-7 · `partie` × `composer` × cran 3 : de (0) à (40).** Le chiffre qui rendait l'objet
  **inconcevable**, le `select` étant `required`. Constaté à l'écran, avant et après. _(21/08.)_
- [x] **L8bis-8 · Les treize objets — porte Aletheia, à l'écran.** **33 couples** objet × mode
  réceptif au cran 3, **aucun vide**, minimum 2 :
  `argument` 6·12·8·6 · `mot` 2·2·2·2 · `objection` 6·13·10·6 · `paragraphe` 20·17·13·9 ·
  `phrase` 8·10·9·6 · `plan` 6·8·6·6 · `problematisation` 9·9·9·9 · `partie` 20·17·13·9
  *(englobant `texte`)* · `conclusion` `restituer` **10**
  *(dans l'ordre `restituer` · `expliquer` · `évaluer` · `interroger`)*.
  ⚠️ **Quatre objets ne peuvent PAS paraître en Aletheia, et c'est la doctrine, pas un défaut** :
  `exemple`, `introduction`, `reference` et `transition` **ne déclarent que `composer`**
  *(`02-` §3, table des modes admis)*. _(21/08.)_
- [x] **L8bis-9 · Les 112 consignes réalignées apparaissent enfin sur les objets aveugles.** Sur
  `partie`, la consigne servie par la banque est « **Parmi ces quatre ajouts, lequel donne la
  raison ?** » — la réécriture de la sixième passe, **visible pour la première fois** sur un objet
  qui n'avait aucune route. _(21/08.)_
- [x] **L8bis-10 · La conception d'une instance sur un objet naguère aveugle, jusqu'à
  l'assignation.** `partie` × `composer` × cran 3, `genre` `generique`, observable **`garant_present`
  (argumentation)** pris **dans la banque** ; matériau `mat-l8bis-partie-0001`, 12 distracteurs,
  `reponse_attendue`. La **garde serveur passe** — « Instance conçue » —, l'aperçu élève rend les
  quatre candidats, et l'assignation à la classe `Test · terminale · HLP` crée **7 lignes
  d'`exercices_depots`, `origine` `prof`** ; l'exercice passe `concu` → `assigne`
  *(id `974b6f51-3723-446d-9e46-f7964051662f`)*. _(21/08.)_
- [x] **L8bis-11 · Le contrôle d'import : refus n° 15 AVANT, entrée APRÈS.** Le **même fichier**
  (`recette_c4l8bis_partie_routee.json`, un `observable_isole` **routé** sur `partie`), déposé par
  `scripts/recette/deposer-import.mjs`. **Avant** *(lecture non paginée, `doctrine.ts` remis à
  `HEAD` le temps de la preuve)* : `verdict : REFUS` — `[R15] exercice
  ex-l8bis-partie-composer-03-garant_present-0001 : l'observable \`garant_present\`
  (argumentation) n'est routé ni pour \`partie\`, ni pour \`composer\``. **Après** : `verdict :
  IMPORTABLE`, l'exercice entre `a_concevoir`, et le matériau déjà déposé est **reconnu et ignoré**
  *(idempotence)*. Seul reste un **signalement légitime** — famille à un seul membre. _(21/08.)_
- [x] **L8bis-12 · Les deux messages de la garde serveur restent distincts.** « l'observable `X`
  n'est pas routé pour … » et « la route existe, la consigne manque (blocage n° 3) » — **non
  fusionnés, non affaiblis** ; le second doit rester possible et le reste. _(21/08, par lecture de
  `empechementsDeConception`.)_
- [x] **L8bis-13 · `npm test` : 428 tests, 428 verts.** **+14** par rapport aux 414 d'avant la
  séance, **et l'échec pré-existant refermé** *(L8bis-14)*. `tsc --noEmit` et `eslint` **propres**
  sur les deux fichiers touchés. _(21/08.)_
- [x] **L8bis-14 · L'échec pré-existant de la chaîne, refermé sur décision de Louis.**
  `derive-instruments.py --ecris` rejoué **à la demande explicite de Louis** — le piège 4 du prompt
  disait « ne touche pas la chaîne », l'arbitrage le lève. `--verifie` passe de **DIVERGE** à
  **`INSTRUMENTS : IDENTIQUE (3 fichier(s) dérivé(s))`**, et `utils/chaine/instruments.test.ts`
  repasse au vert. ⚠️ **Ce qui a changé est de la MÉTADONNÉE, rien d'autre** : `MANIFESTE.ts` et
  `calame-retour.ts` voient leur `empreinte_source`, leur `statut_source` et leur `version_source`
  passer de `2.20` / « VALIDÉ ET GELÉ » à **`2.23` / « RELU ET VALIDÉ »** ; `monitoring.ts` est
  **inchangé** (même empreinte). **Le texte du gabarit Calame est identique octet pour octet** —
  3422 caractères, même empreinte avant et après : **aucun comportement de la chaîne n'a bougé**,
  seule l'estampille de provenance a rattrapé sa source. Six lignes changées en tout. _(21/08.)_

- [x] **L8bis-15 · LES NEUF CRANS, objet par objet, aux deux portes — balayage exhaustif à
  l'écran.** **425 lectures, AUCUNE banque vide.**
  · **Codex** *(`composer`)* : **117 / 117** — les 13 objets × les 9 crans. Aux **six crans qui
  isolent**, chaque objet rend **le même compte à tous les six** *(chaque route couvre les six)* :
  `argument` 24 · `conclusion` 21 · `exemple` 11 · `introduction` 22 · `mot` 7 · `objection` 25 ·
  `paragraphe` 31 · **`partie` 40** · `phrase` 8 · `plan` 15 · `problematisation` 14 ·
  `reference` 10 · `transition` 18. Aux **trois crans de production**, un **patron** est servi
  partout — jamais un vide.
  · **Aletheia** *(les 4 modes réceptifs)* : **297 / 297** — les **33 couples** objet × mode
  déclarables × 9 crans, **0 manquant, 0 vide**, même régularité.
  · **Le `genre` au cran 6, sur les trois objets terminaux** : **11 / 11** — `conclusion` et
  `introduction` × leurs 4 genres, `partie` × ses 3. Chacun sert **ses moments nommés**
  *(« bilan · réponse · ouverture », « situer le texte · la thèse qu'il défend · l'annonce des
  mouvements », …)*. ⚠️ **Trouvé en chemin** : **sans genre élu, le cran 6 d'un objet terminal rend
  un appui nommé VIDE** — « Écris la conclusion.  » — parce que son guide se décline au genre
  *(`04-` §14.2)*. **Ce n'est pas un défaut de ce lot** : le `genre` est `required` sur ces trois
  objets, l'écran ne laisse pas concevoir sans lui. _(21/08.)_
- [x] **L8bis-16 · Les crans de production ne changent pas, et c'était attendu.** Aux crans **2, 6,
  8**, `exercices_routes` est **vide par contrainte** *(`routes_cran_isole_chk`)* : la banque vient
  des **quinze patrons** du `04-` §14.1 et des guides du §14.2, que la pagination ne touche pas.
  **Constaté aux 13 objets × 3 crans en Codex et aux 33 couples × 3 crans en Aletheia : un patron
  partout, jamais un vide.** _(21/08.)_

### Ce qui reste à jouer en recette

- [x] ~~**L8bis-R1 · Les crans de production (2, 6, 8).**~~ ~~**L8bis-R2 · Les cinq autres crans
  qui isolent (1, 4, 5, 7, 9), objet par objet.**~~ **JOUÉS le 21/08 sur demande de Louis — voir
  L8bis-15 ci-dessus.**
- [x] ~~**L8bis-R3 · Le décor de recette de cette séance, à retirer ou à garder.**~~ **TRANCHÉ ET
  JOUÉ par Louis le 21/08 : le fichier au dépôt, le décor en base retiré.**
  ✅ **Le FICHIER est versé** : `scripts/recette/recette_c4l8bis_partie_routee.json`, avec son
  paragraphe au `scripts/recette/LISEZ-MOI.md` — **la preuve L8bis-11 se rejoue d'une commande**, et
  son idempotence a été revérifiée depuis ce domicile.
  ✅ **Le DÉCOR EN BASE est retiré** — en une transaction, dans l'ordre qu'impose
  `exercices_cas.materiau_id` *(**ON DELETE RESTRICT** : les exercices d'abord, le matériau ensuite)* :
  les **2 exercices** *(l'importé `ec7073d4-…` et celui conçu à l'écran `974b6f51-…`)*, leurs
  **2 `exercices_cas`** et leurs **7 `exercices_depots`** par cascade, puis le matériau
  `mat-l8bis-partie-0001`. ⚠️ **Vérifié AVANT de supprimer que rien d'aval n'existait** — `jobs`,
  `squelettes`, `metacognition`, `retours`, `competences_mesures`, `monitoring_mesures`, `api_couts`,
  `routeur_decisions` : **0 partout**, et **aucun dépôt horodaté** *(la cascade des dépôts détruit le
  travail élève : elle ne se lance pas à l'aveugle)*. Vérifié APRÈS : **0 reste** côté `l8bis`, aucun
  orphelin, et le **décor de C4L8-1 intact** *(`mat-lien-codex-0001`, instance `d15ef81f-…`, ses
  2 dépôts)*. Totaux revenus à leur état d'avant la séance : 5 exercices · 3 matériaux · 14 dépôts.
  ⚠️ **Aucune migration : ce n'est pas du schéma, c'est le geste symétrique de la recette** — rien au
  `SUIVI_SQL.md`, comme pour le décor semé-puis-retiré de C4-L5.
  ℹ️ **Les 4 lignes du journal `exercices_imports` ont été GARDÉES**, délibérément : un journal
  atteste ce qui a eu lieu, et l'effacer falsifierait l'historique — celle de C4L8-1 est restée de
  même. *Elles se retirent d'un `delete … where nom_fichier = 'recette_c4l8bis_partie_routee.json'`
  si vous préférez.*
  ⚠️ **Conséquence à assumer : L8bis-10 et L8bis-11 ne se vérifient plus PAR REQUÊTE** — leurs
  lignes n'existent plus. Elles restent prouvées par ce qui est écrit ici, et **rejouables** : le
  fichier d'import est au dépôt, la conception se refait à l'écran en quelques clics.
- [x] ~~**L8bis-R4 · `npm test` porte UN échec pré-existant, étranger à ce lot.**~~ **TRANCHÉ ET
  JOUÉ par Louis le 21/08** — voir **L8bis-14** ci-dessus. *(L'autre dette de la chaîne, la racine
  absolue embarquée dans la fixture, reste ouverte et n'a pas été frôlée : le test neuf de ce lot ne
  lit ni base ni chemin absolu.)*

---

## C4 · L5 — Les mesures et les niveaux : la chaîne froide (sandbox, migration du 21/08)

_Section ouverte le 21/08 depuis `RELEVE_C4_L5_2026-08-21.md`, à la clôture du lot._

_Ce qui a été prouvé EN SÉANCE est coché avec sa preuve. `npm test` : **380 passés, 0 échoué**
(dont ~90 neufs sur ce lot) ; `npx tsc --noEmit` et `eslint` sur les fichiers du lot : rien ;
`scripts/recette/chaine-c4l5.mjs` : **45 contrôles, 45 passés**, joués **par le même code que la
route**, en base, décor semé puis **retiré** (sandbox revenue à son état d'avant, vérifié par
requête)._

⚠️ **Cinq interrupteurs sont à OFF** : `chaine_actif`, propre à ce lot, plus les quatre de C4-L8
(`exercices_actif`, `routeur_actif`, `competences_affichage_actif`, `fabrique_actif`).

⚠️⚠️ **LES QUATRE RESTES SONT DERRIÈRE UNE SEULE ET MÊME PORTE : la première fiche de compétence
*versée et bancée*.** Tant qu'aucune ne l'est, la clause granulaire tient chaque compétence hors de
la chaîne — **zéro compétence ouverte**, donc aucune matière pour ces tests. **Ce n'est pas un oubli
de séance** : c'est la dépendance qui n'est pas un lot (`PLAN_DE_CHANTIER.md` §3), et le prompt du
lot ordonnait de le dire au relevé. **Rien de ce qui suit ne se tente avant cette porte.**

### Ce qui reste à jouer — les quatre

- [ ] **C4L5-1 · Un dépôt produit squelettes, mesures et retours conformes au contrat, sur une VRAIE
  compétence.** C'est le « fait quand » du lot. Les formes du `07-` §1.2, le gabarit du §4 et
  **RR1-RR4 relus sur pièce**, sur le texte d'un retour réel — pas sur un test.
- [ ] **C4L5-2 · La latence à PLUSIEURS compétences en parallèle.** Mesurée en séance sur **un seul
  appel — 3,1 s** contre un contrat de moins de trois minutes. **C'est à deux compétences et plus
  que le contrat mord**, les chaînes étant lancées en parallèle.
- [ ] **C4L5-3 · La reprise après expiration, sur la chaîne ENTIÈRE.** Prouvée en séance sur la
  fonction d'écriture et sur l'index unique (C4L5-8). Reste à **tuer un job après P1** sur une
  compétence ouverte, et à constater **le squelette unique** au bout.
- [ ] **C4L5-4 · Le `delta_v1_vf` et les deux résultats de la paire.** Le code les attache, mais
  **leur calcul est au branchement de chaque fiche** — il n'y a donc rien à jouer avant la première.

### Ce qui est prouvé — pour ne pas le rejouer

- [x] **C4L5-5 · La clause granulaire tient en production.** 0 compétence ouverte, et **chaque
  écartée dit pourquoi**. _(21/08.)_
- [x] **C4L5-6 · La clé d'idempotence.** Deux mises en file → **un seul job**. _(21/08.)_
- [x] **C4L5-7 · Le bail, et son expiration PROVOQUÉE.** Bail pris, personne d'autre ne l'obtient
  tant qu'il court ; puis bail d'une seconde, attente, **le job se reprend**, tentative comptée,
  **toujours un seul job**. _(21/08.)_
- [x] **C4L5-8 · Une reprise n'écrit jamais une seconde mesure.** `ecrireMesure` deux fois → la
  seconde rend `dejaLa`, **une seule mesure au bout** ; et l'**index unique partiel
  `(depot_id, competence)`** refuse la seconde en SQL, tandis que **deux mesures sans dépôt
  passent**. _(21/08.)_
- [x] **C4L5-9 · La chaîne en vrai, avec un appel réel.** Un dépôt de synthèse en classe, l'étage du
  Monitoring, **3,1 s**. _(21/08 — mais voir C4L5-2.)_
- [x] **C4L5-10 · La lucidité sur pièce.** La copie porte « ce passage me résiste » → `signale` ;
  « on peut supposer que » → `distingue`. _(21/08.)_
- [x] **C4L5-11 · `n/a` déclaré, et NULL jamais 0.** Amplitude **et** direction à `n/a` ;
  dénominateur vide → `taux = null` avec `denominateur_fenetre = 0` ; et les colonnes de l'autre
  sous-dimension restent à NULL. _(21/08.)_
- [x] **C4L5-12 · La calibration ne compte que sur les `evaluee`.** Aucune mesure de calibration, la
  Connaissance n'étant pas `evaluee`. _(21/08.)_
- [x] **C4L5-13 · Le journal des coûts dit l'étage.** **1 ligne d'`api_couts` pour 1 appel**, `phase`
  = `p1`, avec modèle, coût et les **quatre compteurs de jetons**. _(21/08.)_
- [x] **C4L5-14 · Le Monitoring n'entre jamais dans `competences_mesures`.** 0 mesure, 0 squelette.
  _(21/08.)_
- [x] **C4L5-15 · La coupure automatique bascule le bon interrupteur.** Plafond atteint →
  `chaine_actif` **à OFF**, **les trois du `07-` §1.5 intacts** ; les dépôts restent `en_attente`,
  `echec_definitif` faux, **tentative rendue**, motif lisible. _(21/08.)_
- [x] **C4L5-16 · La migration, éprouvée par l'échec dans la même transaction.** Répétition à blanc
  jouée d'abord (corps seul, `rollback`), sept drapeaux à `t`, **retour à l'état d'avant vérifié par
  requête**. Puis : un retour **en bloc** refusé · un point **sans identifiant** refusé · une
  citation **sans source** refusée · **deux points au même identifiant** refusés · le cas légitime
  accepté · `spontane` refusé et `spontanee` accepté. _(21/08.)_
- [x] **C4L5-17 · La dérivation refuse, et elle sait dire DIVERGE.** Épreuve négative **en trois
  sens**, sur une racine **ombre** en liens symboliques : un octet de `competences/monitoring.md` →
  **DIVERGE** · un dérivé édité à la main → **DIVERGE** · le marqueur `<!-- DEBUT-CONFIG -->` retiré
  → **SOURCE MOUVANTE**, il s'arrête · rien → **IDENTIQUE (3 fichiers)**. _(21/08.)_

### Ce que les arbitrages du 21/08 ont changé APRÈS le jeu du lot

_Quatre questions ouvertes du relevé ont été tranchées le soir même. **Deux n'ont rien changé au
code** — elles ont écrit dans les sources ce que la chaîne faisait déjà : la `forme` de la mesure se
lit à la ligne du plan d'évaluation, `evaluatif` étant le `sommatif` du `07-` (§1.2) ; et la chaîne
**n'intersecte pas** `competences_actives_par_classe`, l'opt-out se lisant à l'assignation et jamais
à la mesure (§1.3). **Les deux autres créent du travail, reporté à un lot de correctifs** et inscrit
au `PLAN_DE_CHANTIER.md` §6 avec sa condition de fermeture — **avant la première fiche versée et
bancée, et de toute façon avant C4-L7** :_

- [ ] **C4L5-18 · La `cible_primaire` de l'exercice conçu par le professeur.** `exercices` gagne une
  colonne NULLABLE, l'écran de conception de C4-L8 gagne le champ, et `cibleDuRetour` la lit avant
  tout défaut (`07-` §1.1). **Aujourd'hui la chaîne prend la première compétence mesurée** — un
  ordre de clés JSONB, que le `07-` §1.1 refuse explicitement de tenir pour une hiérarchie.
- [ ] **C4L5-19 · Le retrait de `exercices_squelettes.prompt_version`.** **Rien n'est versionné par
  phase** : l'`instrument_version` bouge dès qu'un prompt bouge, un prompt vivant dans sa fiche
  (`01-` §11 v5.4, `07-` §1.2). La table est **vide** et la colonne nullable — personne ne l'écrit
  ni ne la lit.
- [ ] **C4L5-20 · `maxDuration`, le commentaire qui le justifie, et le DÉCLENCHEUR.** La route porte
  `maxDuration = 60` et un commentaire qui le présente comme *« le plafond du plan Vercel Hobby »* —
  **c'est faux** : avec fluid compute, l'offre gratuite est à **300 s en défaut ET en maximum**, donc
  au-dessus du contrat de trois minutes. Passer à **300** et réécrire le commentaire. ⚠️ **Mais la
  vraie contrainte est ailleurs** : les tâches planifiées de l'offre gratuite ne tournent **qu'une
  fois par jour** (±59 min), alors que la route est conçue pour être drainée par l'une d'elles
  (`CRON_SECRET`, patron de `synthese-hebdo`). **Le contrat de trois minutes exige donc que le dépôt
  appelle lui-même le déclencheur (C4-L3), ou une offre payante** — `07-` §1.2. Et `vercel.json` ne
  porte à ce jour **aucune entrée de tâche planifiée pour cette route** : le déclencheur n'est pas
  branché. _(Le lot n'a, lui, aucune exigence de latence : l'analyse en lot est différée — « le soir
  même ou un autre jour », `02-` §6.D étape 12.)_
- [ ] **C4L5-21 · Le `ton` et la `longueur` du gabarit du retour.** Le `07-` §4 les déclare éditables ;
  rien n'existe, et le gabarit sert ses défauts. Tranché le 21/08 : **le `ton` n'a pas de domicile
  propre** — c'est le bloc de voix transversal (`utils/ia-commun.ts`, `REGISTRE`), *« injecté dans
  TOUS les prompts »*, que **le gabarit de Calame est aujourd'hui le seul à ne pas recevoir** ; la
  **`longueur`** prend un paramètre de plateforme, NULL valant la règle 7. Donc, au correctif :
  injecter le bloc partagé dans la couche contrat, ajouter le paramètre, faire **émettre par
  `derive-instruments.py` un gabarit découpé en sections nommées** (les défauts viennent de la
  source, jamais du code — contrairement au tuteur), et l'écran. ⚠️ **Collision de nom à ne pas
  manquer en câblant** : `REGISTRE` d'`ia-commun` est le registre de **LANGUE** ; `{{REGISTRE}}` du
  gabarit est le registre de **RETOUR** (descriptif / interrogatif / démonstratif, `01-` §8.7).
  Substituer l'un dans l'autre remplirait la règle 8 avec le bloc de langue.
  ⭐ **Le même geste porte l'ALIGNEMENT DE LA PERSONA** (question n° 2, tranchée le 21/08) : « Calame »
  n'existe aujourd'hui que dans `utils/chaine/` — **zéro occurrence** dans le prompt du tuteur, dans
  `scriptorium-rag.ts`, dans `ia-commun.ts` —, alors que le `07-` §4 veut une seule voix sur les
  **trois** surfaces (retours, Discussion, séances de lecture guidée). L'identité doit donc entrer
  dans **le bloc partagé**, chaque atelier ne gardant que son **rôle** ; un override du professeur ne
  peut pas la porter, ce serait le second fichier de personnalité que le §4 interdit.
  ⚠️ **Coût à tracer ici, parce que rien ne le lèvera tout seul** : toucher au bloc partagé diverge du
  **prompt calibré au banc L8 des 24-25/07** — et il irrigue aussi les retours Aletheia. Le bandeau
  « recommandé : rejouer le banc » ne s'allume que sur une **édition du professeur**
  (`rag_prompt_sections_maj`), **jamais sur un changement de défaut dans le code**. **Rejouer le banc
  L8 fait donc partie de ce correctif**, décoché tant qu'il ne l'est pas.


---

## SÉCURITÉ · La vue ouverte à `anon` et le résumé aveugle (séance du 21/08 — **PRÉPARÉE, NON EXÉCUTÉE**)

_Section ouverte le 21/08 depuis `PROMPT_Session_Correctifs_RLS_et_Resume.md`
(deux constats de la revue bornée de C4-L8, §6.5 et §8). Relevé de séance :
`RELEVE_Correctifs_RLS_et_Resume_2026-08-21.md`._

✅✅ **LES DEUX CHANTIERS SONT JOUÉS ET PROUVÉS — 21/08.** Le **chantier 1** depuis **l'éditeur SQL Supabase piloté dans Chrome** *(le navigateur de Louis était le seul chemin qui ait le réseau)* ; le **chantier 2** par **`psql` depuis sa machine** *(le `--sql` fait 0,81 Mo : un `delete`+`insert` sur douze tables ne se colle pas dans un éditeur web)*. **Les dix-huit points ci-dessous sont cochés avec leur preuve.**

⚠️⚠️ **LE DIAGNOSTIC RÉSEAU, PUISQU'IL RESSERVIRA. La séance n'avait aucun accès réseau à la base** — ports 5432 et
6543 fermés par l'allowlist côté conteneur *(DNS résolu, TCP refusé)*, et **ni `psql` ni DNS** sur
le shell qui voit les dossiers montés. Tout ce qui suit est donc **prouvé hors base** ou **reste à
jouer**, et rien n'est coché sur la foi d'une prédiction. **Les trois lignes du `SUIVI_SQL.md` sont
créées AVANT exécution et décochées.**

⚠️ **Le dépôt est en `OUTIL 1.2`, la base en `1.1`** — et **`--verifie` ne le dira pas** : ni
`doctrine.py` ni la version de l'outil n'entrent dans les quinze empreintes. Tant que la ligne du
journal n'est pas cochée, cet écart existe et **aucun contrôle ne le voit**.

### Ce qui est prouvé — avec sa preuve

- [x] **SEC-1 · Le nouveau résumé VOIT une perte de six consignes.** Racine jetable *(copies
  réelles, jamais un répertoire de liens)*, les **six lignes** de la table « Les six crans qui
  isolent » d'un observable retirées : le résumé passe à **`330 consignes isolées (56 × 6)`** et
  finit par **`⚠ 1 CROISEMENT ROMPU : … synthese §1 (0/6 — manque 1, 3, 4, 5, 7, 9)`**. _(21/08.)_
- [x] **SEC-2 · L'ANCIEN résumé est aveugle à la MÊME perte.** Joué sur la **même** racine mutée,
  il rend une ligne **rigoureusement identique** à celle de la racine saine : « 56 observables
  instanciés » intact, rien d'autre ne bouge. ⭐ *C'est ce couple SEC-1/SEC-2 qui prouve que la
  réparation sert à quelque chose — pas SEC-1 seul.* _(21/08.)_
- [x] **SEC-3 · Le croisement voit ce qu'un compte ne verrait pas.** Trois mutations, trois
  verdicts : **six consignes retirées** → 330, `(0/6 — manque 1, 3, 4, 5, 7, 9)` ; **une seule
  retirée** → 335, `(5/6 — manque 9)` ; ⭐ **une consigne DÉPLACÉE d'un cran à l'autre** → **le
  total reste 336** et le résumé dit quand même `(6/6 — manque 9, en trop 2)`. *Un compte global
  n'aurait rien vu du troisième cas.* Témoin positif : racine saine → « les croisements
  tiennent ». _(21/08.)_
- [x] **SEC-4 · La racine de reconstruction est PROUVÉE PAR EMPREINTE.** La fixture régénérée
  depuis la racine reconstruite au **chemin absolu réel** est **octet pour octet** celle du dépôt
  *(`0a974e48…52f0a`)* — donc tout ce qui a été diffé contre elle l'a été contre le vrai état
  d'avant, et l'angle mort du chemin absolu est neutralisé pour cette séance. _(21/08.)_
- [x] **SEC-5 · La passe de dérivation ne change QUE la ligne de journal.** `--sql` avant et
  après : **3999 lignes de part et d'autre**, **trois lignes diffèrent** — l'`OUTIL` de l'en-tête,
  le résumé de l'en-tête, le `insert into doctrine_derivation`. **Aucune ligne de données.** Côté
  fixture : **les douze tables `IDENTIQUE`**, `_derivation.empreintes` et `_derivation.racine`
  `IDENTIQUE`, **seuls `outil` et `resume` changent**. _(21/08.)_
- [x] **SEC-6 · Le résumé nomme les DOUZE comptes que la dérivation verse.** 13 · 9 · 6 · 13 · 9 ·
  3 · 46 · 46 · 54 · 117 · 544 → 3264 · 56 · 336 · 15 · 24 (13 + 11), vérifiés un à un contre la
  sortie `--resume` table par table. ⭐ Dont **`exercices_types_crans` (117)**, la seule table
  qu'aucun bloc de `--verifie` ne relit : **le résumé en est désormais l'unique témoin**. _(21/08.)_
- [x] **SEC-7 · `npm test` au vert avec la fixture régénérée.** **414 tests, 0 échoué** — et ⚠️
  **le compte des ignorés dépend de la machine** : **414 passés, 0 ignoré** sur le Mac de Louis
  *(qui fait foi)*, **413 passés + 1 ignoré** sur le Linux du bac à sable Cowork. Un test est
  donc conditionné par l'environnement — à savoir si l'on relit ces chiffres un jour. Aucun test n'assertait sur `_derivation` :
  vérifié par balayage, `doctrine.fixture.json` n'est lu que par `divergences.test.ts` et
  `verifie-import.test.ts`. _(21/08, sur la machine de Louis.)_
- [x] **SEC-8 · Le résumé se reproduit sur les VRAIS fichiers.** `--resume` joué sur le dépôt monté
  rend **la même ligne, caractère pour caractère**, que la racine reconstruite. _(21/08.)_
- [x] **SEC-9 · Aucun chemin de code ne lit `assiduite_hebdo_classe`.** Balayage `.ts` / `.tsx` /
  `.mjs` hors `node_modules` : **zéro occurrence**. C'est ce qui fait du constat un contournement
  **structurel** et non une fuite. _(21/08.)_
- [x] **SEC-10 · Le sort de `handle_new_user()` est tranché et écrit.** Elle **reçoit son
  `search_path`, elle n'est PAS retirée** — code mort mais déjà révoquée *(surface nulle)*, et un
  `drop function` sur un objet du flux `auth` relève de la règle 5 et d'un lot de nettoyage. Raisons
  au long en tête du `.sql`. _(21/08.)_

### Les deux gestes de la rallonge du 21/08 — joués après coup, sur demande de Louis

- [x] **SEC-19 · Les cinq autres `security definer` alignées sur `public, pg_temp`.**
  Répétition à blanc *(corps seul, `rollback`)* : **7 fonctions, `divergent_encore = 0`** dans
  l'essai ; **rollback vérifié par requête** — 5 divergeaient de nouveau. Puis pour de bon : les
  **SEPT** alignées, ⭐ **`divergent_encore = 0`** *(le contrôle qui compte, pas « sept
  lignes »)*, **aucun privilège déplacé**. ⚠️ *Fait pour la DOCTRINE, pas pour le risque : les
  cinq étaient fermées à `anon` et `authenticated`, donc l'attaque par `pg_temp` supposait déjà
  d'être `service_role`. Ce qu'on ferme, c'est la divergence — deux formes d'une même règle.*
  _(21/08.)_
- [x] **SEC-20 · `handle_new_user()` est retirée.** Orpheline **constatée par requête** :
  **0 trigger · 0 fonction qui la nomme · 0 policy · 0 dépendance de catalogue**, et `f | f`
  pour `anon`/`authenticated`. `drop function` **SANS `cascade`** — délibérément : un `cascade`
  aurait emporté en silence ce que le constat aurait manqué. Après : `to_regprocedure` rend
  **NULL**, **six** `security definer` restantes toutes à `public, pg_temp`, **une seule**
  exécutable par `anon`, **`profiles` intacte (18 profils, 4 policies)**. _(21/08.)_
- [ ] ⚠️ **SEC-21 · LE SMOKE TEST DU RETRAIT — créer un élève depuis l'écran professeur.**
  C'est le **seul** chemin que la suppression pourrait toucher, et **ce n'est pas une requête**
  qui le prouve : il faut créer un compte et constater sa ligne dans `profiles`. ⭐ **C'est le
  chemin de mardi 25** *(création des comptes élèves)*. Retour arrière prêt si besoin :
  `securite_handle_new_user_retrait_rollback.sql` — ⚠️ *qui recrée la fonction **et la referme
  dans la même transaction**, sans quoi elle renaîtrait grantée à `anon`.*

### Ce qui reste à jouer — tout ce qui touche la base

- [x] **SEC-11 · Le constat AVANT, par requête. _(21/08.)_** `server_version_num >= 150000` *(sans quoi
  `security_invoker` n'existe pas et le fichier est à revoir)* · l'option et les grants de la vue ·
  le `proconfig` de **toutes** les fonctions `security definer` · le compte des policies qui
  appellent `est_prof` *(attendu : 19)*. **On ne corrige rien qu'on n'ait vu.**
- [x] **SEC-12 · ⭐ LE BALAYAGE DE TOUTES LES VUES DU SCHÉMA `public` — RÉPONSE : AUCUNE AUTRE.**
  Serveur **17.6** ; **une seule ligne**, `assiduite_hebdo_classe`, genre « vue », **aucune vue
  matérialisée** ; `security_invoker` **non posé** ; `anon` et `authenticated` à `SELECT = t`
  *(et les six privilèges à `t` pour les deux)* ; propriétaire `postgres` ; **19 policies**
  appellent `est_prof` ; `assiduite_hebdo` **0 ligne**, la vue **0 ligne** ; **19 inscriptions
  actives** et **4 `holidays`** pour l'épreuve. ⭐⭐ **Trouvaille non prédite** : sur les sept
  fonctions `security definer`, **les cinq autres portaient déjà `search_path=public`** — sans
  `pg_temp`. **Non traitées, hors périmètre** ; risque nul en pratique *(fermées à `anon` et
  `authenticated`)*, mais **la base porte deux formes** → au lot de correctifs. _(21/08.)_ Dire **combien** d'autres
  vues sont dans le même cas. *Attendu d'après le dépôt : celle-ci et elle seule — un seul
  `create view` dans tout le dépôt, **zéro vue** au dump du 23/07. Mais le dépôt n'est pas la base,
  et la leçon du 21/08 est justement que le troisième cas vivait ailleurs.* ⚠️ La requête inclut les
  vues **matérialisées**, qui ne connaissent pas `security_invoker` : s'il en sort une, c'est un cas
  **à part**, à traiter par les privilèges — à dire, pas à « corriger » avec la même option.
- [x] **SEC-13 · La répétition à blanc — FAITE, et confondue avec l'épreuve.** ⭐ Le DDL étant
  transactionnel, l'épreuve à trois temps **est** la répétition à blanc : `alter view` et
  `revoke` y ont été joués puis annulés. **Rollback vérifié PAR REQUÊTE** *(règle 6, jamais sur
  la foi du mot affiché)* : `assiduite_hebdo` **0 ligne**, option de la vue **« non posée »**,
  `anon_lit` **true**, **0** table temporaire restante. _(21/08.)_ Règle 6 : le fichier porte son propre
  `begin;`/`commit;`, l'inclure entier dans une transaction d'essai la validerait pour de bon. Puis
  **revérifier par requête** que l'option et les `proconfig` sont revenus — jamais sur la foi du
  « ROLLBACK » affiché.
- [x] **SEC-14 · ⭐⭐ L'ÉPREUVE PAR L'ÉCHEC — LES QUATRE PRÉDICTIONS EXACTES.** Décor posé : la
  vue rend **1** sous le propriétaire. **Temps 1** *(rien de corrigé)* → **1 sous `anon`** —
  ⭐ **le contournement vu à l'œil : sous la clé anonyme, la vue rendait une ligne d'assiduité
  d'un élève réel**. **Temps 2** *(après `security_invoker = true`)* → **0**. **Temps 3**
  *(après le `revoke`)* → **`REFUSE — permission denied (42501)`**. **Témoin positif `holidays`
  = 4 aux quatre lignes** : les zéros et le refus sont réels. _(21/08.)_
  ⚠️ **Elle ne peut pas être « 0 ligne »** : la vue rend 0 ligne aujourd'hui **sous n'importe quel
  rôle** *(`assiduite_hebdo` est vide)*, donc un zéro constaté tel quel serait vrai avant comme
  après. Le bloc du `.sql` fabrique **une ligne**, puis pose les deux gestes **l'un après l'autre**
  — le DDL est transactionnel, donc **ce bloc EST aussi la répétition à blanc** — en relisant la
  vue sous `set local role anon` **à chaque temps**, sur la même ligne et dans la même session :
  **1** *(état actuel)* → **1 ligne**, le contournement ; **2** *(après `security_invoker`)* →
  **0**, la RLS joue ; **3** *(après le `revoke`)* → **REFUSÉ, 42501**. Témoin positif `holidays`
  *(policy `for select using (true)`)* aux trois temps. ⚠️ Si le témoin vaut 0 sur une ligne, cette
  ligne ne prouve rien : changer de témoin. ⚠️ Si le temps 1 rend déjà 0 avec un témoin non nul,
  **le constat de la revue est à réexaminer avant de corriger quoi que ce soit.**
- [x] **SEC-15 · Le correctif exécuté, et sa vérification. _(21/08.)_** La vue à
  **`security_invoker = true`**, **`anon` = false**, **`authenticated` = true** *(gardé : C4-L2
  construit le taux d'inactivité par classe)*, `service_role` = true. `est_prof` à
  **`search_path=public, pg_temp`** et **toujours `t | t`** — rien n'a été révoqué sur les
  fonctions. `handle_new_user` à **`search_path=public, pg_temp`** et **toujours `f | f`** — le
  revoke du 21/08 tient. **Les cinq autres fonctions intactes.** `security_invoker = true` sur la vue ;
  `search_path` sur les deux fonctions ; et **les privilèges INCHANGÉS** — `est_prof` toujours à
  `t | t` *(19 policies l'appellent)*, `handle_new_user` toujours à `f | f` *(le revoke du 21/08
  tient)*.
- [x] **SEC-16 · La cinquième dérivation — JOUÉE le 21/08 à 19:58:43 UTC, en `1.2`.**
  **Répétition à blanc d'abord** *(`sed 's/^commit;$/rollback;/'` — le fichier ne porte qu'un
  seul `commit;`)*, puis **vérification PAR REQUÊTE** que `doctrine_derivation` portait
  **toujours 4 passes** : le constat en pied de fichier, lui, rend les mêmes comptes des deux
  côtés et **ne pouvait rien voir**. ⭐⭐ **La preuve de la passe n'est pas dans les comptes**
  *(identiques à blanc et pour de bon : `routes=3264 consignes_isolees=336 types_crans=117 …`)*
  **mais dans la ligne de journal** : `outil` `1.1` → **`1.2`**, et le `resume` qui devient
  « … 9 crans (6 isolent, 3 produisent) … ». ✅ `--fixture` régénérée sur la machine de Louis :
  empreinte **`3fa7c3ee…a648e`**, ⭐ **exactement celle de la fixture déposée**. ✅ `--verifie` :
  **`SOURCES : IDENTIQUE`**, **onze tables `IDENTIQUE`**, **`FIXTURE : IDENTIQUE`**. ✅
  **`npm test` : 414 / 414, 0 échoué.** ⚠️ **Le douzième `IDENTIQUE` n'existe pas** —
  `exercices_types_crans` reste hors de `--verifie` : ces onze ne sont **pas** une couverture
  complète. _(21/08.)_ `--verifie` *(attendu : **tout `IDENTIQUE`** — c'est le
  piège, pas un feu vert)*, répétition à blanc, `--sql` en sandbox, `--fixture` régénérée sur la
  machine de Louis *(elle doit rendre le fichier déjà posé à l'identique)*, `npm test`. **Puis
  relire la colonne `resume` de la nouvelle ligne de `doctrine_derivation` — c'est la SEULE trace
  que la passe existe.**
- [x] **SEC-17 · Les deux points d'arbitrage, TRANCHÉS par Louis le 21/08.** **(A)** `search_path
  = public, pg_temp` — *« prends l'alternative la plus sécurisée »* ; **(B)** **oui au second tour
  de clef** : `revoke all on assiduite_hebdo_classe from anon`. ⚠️ `authenticated` **garde** son
  droit *(C4-L2 construit le taux d'inactivité par classe, et la RLS suffit à ce que seul un
  professeur y voie quelque chose)*. Le `.sql` et son rollback sont réécrits en conséquence.
  _(21/08.)_
- [x] **SEC-18 · La contre-épreuve d'après correctif — PASSÉE.** Sous `anon`, la lecture de la
  vue rend **`REFUSE — permission denied (42501)`**, témoin `holidays` = **4**. *Le refus a été
  capté par un gestionnaire d'exception plutôt que par deux transactions séparées — l'éditeur
  SQL n'ayant pas de session persistante entre deux exécutions, c'est la forme qui convient là.*
  _(21/08.)_ La lecture de la vue
  sous `anon` doit **échouer en 42501** — et une transaction qui a avorté ignore tout ce qui suit,
  donc le **témoin positif** doit vivre dans **sa propre** transaction. Les deux blocs sont au pied
  du `.sql`.

---

## C4 · L4 — La passation en classe (sandbox, migration du 22/08)

_Section ouverte le 22/08 depuis `RELEVE_C4_L4_2026-08-22.md`, à la clôture du lot._

_Ce qui a été prouvé EN SÉANCE est coché avec sa preuve. `npm test` : **476 passés, 0 échoué**
(dont **48 neufs** sur ce lot) ; `npx tsc --noEmit` : rien ;
`python3 scripts/derive-instruments.py --verifie` : **IDENTIQUE (4 fichiers dérivés)**, le prompt de
transcription compris ; `scripts/recette/passation-c4l4.mjs --charge=140` : **56 contrôles, 55
passés, 1 échoué** — et **l'échoué est un CONSTAT, pas un défaut de construction** (la latence,
C4L4-1 ci-dessous). Décor semé puis **retiré**, sandbox revenue à son état d'avant, vérifié par
requête._

⚠️ **SIX interrupteurs sont à OFF, et ils ont été RECONSTATÉS après la recette** :
`exercices_actif`, `routeur_actif`, `competences_affichage_actif`, `fabrique_actif`, `chaine_actif`,
et `passation_classe_actif`, propre à ce lot. *La recette ouvre les deux dernières portes le temps
de son passage et les remet exactement comme elle les a trouvées ; elle le vérifie et le dit.*

### ⚠️ LE TEST DE CHARGE — joué à l'échelle, le 22/08, et voici ses chiffres

_Cent quarante copies, **la même photo réelle** d'une copie manuscrite d'élève (une page pleine
d'écriture cursive avec ratures, 338 Ko, prise au stockage du **compte de test** `test@test.com` —
aucune copie d'élève réel n'a été renvoyée au sous-traitant). Lancées **par vagues de trente-cinq**,
le chiffre de la simultanéité d'une salle (`02-` §6.D), par **le chemin réel** de l'écran de
l'élève. Modèle `claude-sonnet-4-6`, **deux passes par copie**._

| Ce que le « fait quand » demande | Mesuré le 22/08 | |
|---|---|---|
| **140 copies traversent SANS INTERVENTION** | **140/140 transcrites, 0 en échec** | ✅ |
| aucun `echec_definitif` | **0** | ✅ |
| aucune copie oubliée en file | **0** — et **140/140 jobs CLOS `abouti`** | ✅ |
| aucun job repris à la main | **0 job à plus d'une tentative** | ✅ |
| la transcription revient **en quelques secondes par copie** | **médiane 22,4 s · p95 24,3 s · max 25,2 s** | ❌ |
| alertes de repli alphabétique | **0** sur les dépôts sondés | ✅ |
| le découpage tient à l'échelle | **4 blocs sur les 140 copies**, aucune en un seul bloc | ✅ |
| la facture | **280 lignes d'`api_couts`, 4,54 $** — soit **exactement 2,0 appels par copie** | ✅ |

⭐ **Une salle entière revient en vingt-cinq secondes** : les trente-cinq copies d'une vague
reviennent ensemble, et les cent quarante d'une journée en **99 s de bout en bout**. **La file tient
à cent quarante** — c'est le risque n° 1 du corpus, et il est levé.

⚠️⚠️ **MAIS LE CONTRAT DE LATENCE N'EST PAS TENU, ET IL FAUT LE DIRE NET.** *« Quelques secondes par
copie, pendant l'heure de cours »* (`02-` §6.D) : l'élève attend **vingt-deux secondes**, pas
quelques-unes. La recette lit le contrat **à dix secondes** et rend un rouge : *une recette qui se
donne trente secondes de marge ne mesure plus le contrat, elle le déplace.* **Les leviers sont tous
des décisions de Louis, aucune n'appartenant à ce lot** — un modèle plus rapide pour la
transcription · une seule passe (mais `confiance_ocr` disparaît, et c'est une règle de source) ·
ou admettre que « quelques secondes » veuille dire une demi-minute.

⭐⭐ **CE QUE LE TEST DE CHARGE A TROUVÉ, ET QUI A ÉTÉ RÉPARÉ EN SÉANCE.** Au premier passage, les
140 copies étaient transcrites **mais leurs 140 jobs restaient en file**. Le rouge a fait remonter
un vrai défaut de conception : `reclamerJobs` trie par `created_at ASC`, et *« le dépôt appelle
lui-même le déclencheur »* réclamait donc **le job du PREMIER dépôt de la file**, pas le sien. **À
trente-cinq élèves dans une salle, un seul écran aurait répondu** ; les trente-quatre autres
auraient attendu une tâche planifiée qui « ne tient pas la seconde » et qui n'est même pas posée.
`reclamerJobs` accepte désormais un `depotId`, et le second passage rend **0 copie oubliée**.
*Le test de charge a payé pour lui-même.*

### La cadence que l'offre d'hébergement autorise — **le constat, pas le geste**

- [x] **C4L4-C · La cadence est vérifiée, et elle autorise la minute.** Documentation Vercel
  consultée le 22/08 (« Usage & Pricing for Cron Jobs ») : **Hobby — 100 crons/projet, intervalle
  minimal UNE FOIS PAR JOUR, précision à l'heure (±59 min) ; Pro — 100 crons/projet, intervalle
  minimal UNE FOIS PAR MINUTE, précision à la minute.** ⭐ **Louis étant passé au plan payant le
  21/08, la cadence à la minute que le `07-` §1.1 réclame EST autorisée.** _(Constat lu à la
  documentation ; il n'y a sur cette machine ni CLI ni jeton Vercel pour lire le plan du compte.)_
- [x] **C4L4-D · `maxDuration = 60` n'a JAMAIS été un plafond d'hébergement — confirmé.** Même
  source (« Vercel Functions Limits », fluid compute) : **Hobby 300 s par défaut ET maximum ; Pro
  300 s par défaut, 800 s maximum, 1 800 s en maximum étendu (bêta).** Le commentaire de
  `app/api/chaine/route.ts` disait « le plafond du plan Vercel Hobby » : **il était faux**, il est
  corrigé dans le fichier. _(22/08.)_
- [ ] **C4L4-E · POSER LA CADENCE et monter `maxDuration`.** ⚠️ **Ce geste appartient AU LOT DE
  CORRECTIFS, pas à C4-L4** (`PLAN_DE_CHANTIER.md` §6). Il reste que **rien ne vise `/api/chaine`
  aujourd'hui** : `vercel.json` ne déclare qu'un cron, celui de la synthèse hebdomadaire. **Tant
  qu'il n'est pas fait, la recette de C4-L4 est PARTIELLE** — elle a appelé l'ouvrier en direct,
  comme l'écran de l'élève le fait, mais **le filet qui reprend les jobs orphelins n'existe pas**.

### Ce qui reste à jouer en recette

- [ ] **C4L4-1 · La latence, rejouée après la décision de Louis sur le modèle** (question Q3 du
  relevé). **22,4 s médiane** aujourd'hui. Rien d'autre ne bloque : la file, elle, tient.
- [x] **C4L4-2 · SMOKE TEST ÉLÈVE — JOUÉ le 22/08, dans Chrome, sur `localhost`.** Vraie copie
  manuscrite déposée, **page 2 déclarée manquante** (la copie garde son compte de pages), page
  tournée, transcription revenue, **passages difficiles affichés SANS aucun score**, texte corrigé
  à deux endroits, copie validée. La transcription est **diplomatique** — « Heidegge », « univront »,
  « un vie bons », « à un certain dégré », les `[illisible]` : **rien n'est corrigé**. Le rappel de
  lisibilité est bien **une ligne en italique**, pas un encart. ⭐ **C'est ce test qui a trouvé le
  CRLF** — voir ci-dessous.
- [x] **C4L4-3 · SMOKE TEST PROFESSEUR — JOUÉ le 22/08.** Les deux drapeaux levés **avant**
  l'ouverture puis **grisés après** (« le dépôt est ouvert : les drapeaux ne se lèvent plus »),
  ouverture horodatée pour 7 élèves, lot déclenché (**« 1 copie mise en file, 6 sans copie remise,
  écartée(s) »**), révélation **cran par cran** — Masqué → Le compte → Les points → Le détail, chacun
  montrant strictement plus —, retour **édité** (un point réécrit, un point retiré : 3 → 2), **commentaire
  général** saisi, correction validée, **case de publication cochée**, et l'élève a **validé sa
  lecture**. Vérifié en base au bout : `retour_publie`, **identifiants stables `["r1","r2"]`
  conservés**, `transcription_v1` **abouti en 1 tentative**. ⭐ **Le cran revient à « Masqué » au
  rechargement** — la révélation ne se persiste nulle part, comme le piège 27 l'exige.

### ⚠️⚠️ CE QUE LE SMOKE TEST A TROUVÉ — trois défauts, tous corrigés le 22/08

- [x] **C4L4-A · LE CRLF FAISAIT LIRE TOUTE COPIE EN UN SEUL BLOC — défaillance forte silencieuse.**
  La soumission d'un formulaire HTML **normalise la valeur d'un `<textarea>` en CRLF** (c'est la
  spécification). Le texte validé par l'élève arrivait donc en `\r\n` et s'y stockait ; or `blocs()`
  cherche `\n[ \t]*\n`, et **`\r\n\r\n` ne matche pas**. Mesuré sur la vraie copie :
  **`blocs()` = 1 au lieu de 4**. C'est mot pour mot la panne du `06-` §4 et du `07-` §3 — « la copie
  est lue en défaillance forte » —, et **la Structure de toute copie validée depuis un navigateur
  aurait planché**. ⚠️ **Ni la recette ni les 476 tests ne pouvaient le voir** : ils écrivent depuis
  Node, avec des `\n`. **C'est la règle d'or du 24/07 qui a payé.** Corrigé par `normaliserRetours()`
  à l'écriture ET à la lecture, sans rien « nettoyer » d'autre (un test compare caractère à
  caractère) ; 4 tests neufs ; ligne déjà stockée réparée. _(commit `702a60f`.)_
- [x] **C4L4-B · « 0 copie validée sur 7 » alors qu'une copie était remise.** L'écran comptait
  `corrige_at` — la validation DU PROFESSEUR — au lieu de `v1_remis_at`, la remise de l'élève.
  **Le serveur, lui, comptait juste** (« 1 copie mise en file »). Un écran qui compte autre chose
  que ce qu'il dit est un écran qui ment. Corrigé : « **1 copie remise sur 7** ». _(22/08.)_
- [x] **C4L4-F · `capitalize` sur toute la ligne du sommaire** — « 1 Réussite(S), 0 Point(S) De
  Travail ». Il ne porte plus que sur le nom de la compétence : « **Argumentation — 1 réussite(s),
  0 point(s) de travail** ». _(22/08.)_
- [ ] **C4L4-4 · Le retour AFFICHÉ, sur un vrai retour engendré.** ⚠️ **Derrière la même porte que
  les quatre restes de C4-L5 : la première fiche *versée et bancée*.** La chaîne ouvre **zéro
  compétence**, n'engendre **aucun retour**, et la recette a donc **posé une fixture** à la forme
  exacte que C4-L5 écrira — et l'a dit. Le flux, la transcription, la file, la correction, la
  publication et l'obligation de lecture s'éprouvent tous sans elle ; **le retour affiché, non.**
- [ ] **C4L4-5 · « Se juger » réellement servi.** Il ne l'est pas : **aucune compétence n'est
  `evaluee`** en base (`competences_niveaux` ne porte que `mesuree_silencieusement`, sur Expression
  et Synthèse). Le drapeau est nécessaire, pas suffisant.
- [ ] **C4L4-6 · La confiance de remise réellement collectée.** L'étape **est servie** et **sert un
  objet vide** — construite quand même, c'est la collecte qu'une année manquée ne rattrape pas.
- [ ] **C4L4-7 · La crédence, sur une instance qui en porte.** ⚠️ **Constat revérifié par requête le
  22/08** : les deux types diagnostiques seedés (`diagnostic_essai`,
  `diagnostic_explication_texte`) sont **SANS CRAN** — `crans_admis` vaut `{}`, et
  `exercices_types_crans` ne porte **aucune ligne** pour eux. Il n'y a donc **aucun écran de
  crédence à servir pour eux** aujourd'hui.
- [ ] **C4L4-8 · LES SUJETS DES DEUX PASSATIONS DIAGNOSTIQUES.** ⚠️ **Non faits.** En base au 22/08 :
  **un** sujet (« Peut-on douter de tout ? », `generique`, `valide`) et **deux** textes, mais
  **AUCUNE instance `lieu = classe`** — les cinq instances sont toutes `maison`. **C'est un geste de
  FABRIQUE (C4-L8, joué), pas de ce lot**, et il reste entier. C'est la quatrième ligne du « fait
  quand » de C4-L4.
- [ ] **C4L4-9 · L'élève exempté, de bout en bout.** `profiles.mode_saisie_force = 'ecran'` n'est
  posé sur **aucun profil** en base. Le chemin clavier est construit et testé au type, jamais joué.
- [ ] **C4L4-10 · L'effacement d'une classe qui porte des dépôts.** ⚠️ **Les FICHIERS partent**
  (`utils/effacement.ts` les collecte, paginé) ; **les LIGNES de dépôt, non** —
  `effacer_classe()` ne touche pas `exercices_depots`, les tables de C4-L1 étant nées après elle.
  **Dette écrite au relevé, §5.1** : c'est un `security definer` d'un flux existant, protocole
  renforcé, et cela ne se fait pas en passant.

### Ce qui est prouvé — pour ne pas le rejouer

- [x] **C4L4-11 · L'ouverture est un geste MANUEL, et elle commande.** Avant elle : statut
  `assigne`, aucun horodatage, **et le dépôt des photos est REFUSÉ**. Après : statut `ouvert`,
  `ouvert_par_prof_at` posé. Une instance de **maison** la refuse — c'est le `lieu` qui commande.
  **Aucune minuterie ne ferme quoi que ce soit** : rien ne lit `fenetre_fin`. _(22/08.)_
- [x] **C4L4-12 · Les deux drapeaux se lèvent JUSQU'À l'ouverture, et plus après.** Levés avant :
  acceptés, indépendants. Après : refusés, avec leur motif. _(22/08.)_
- [x] **C4L4-13 · La mise en file est IDEMPOTENTE.** Deux mises en file → un job, `deja = true` — un
  double-clic ne paie pas deux transcriptions, donc pas **quatre** appels. _(22/08.)_
- [x] **C4L4-14 · LE DÉCOUPAGE SURVIT DE BOUT EN BOUT.** Sur une copie réelle : la machine rend
  **4 blocs**, l'élève édite, la mesure lira **4 blocs** — empreinte de découpage identique des deux
  côtés. Et à l'échelle : **4 blocs sur les 140 copies, aucune en un seul bloc**. Plus **19 tests
  purs** qui tiennent la règle : deux paragraphes fusionnés se voient, corriger une faute ne change
  rien, une ligne vide mangée se voit. _(22/08.)_
- [x] **C4L4-15 · Aucune version double n'est conservée.** Le texte machine est **écrasé** par
  l'édition de l'élève ; aucune colonne de transcription brute, aucun diff, aucun compteur de
  corrections, aucun drapeau d'écart. _(22/08.)_
- [x] **C4L4-16 · La garde de classe refuse la version finale.** `texte_vf` sur un dépôt de classe →
  **`23514`**. La séquence s'arrête à `retour_publie`. _(22/08.)_
- [x] **C4L4-17 · Le traitement en lot passe par LA MÊME FILE.** Chaque dépôt validé y entre en
  `mesure_v1` ; relancer le lot crée **0 doublon** ; les copies non remises sont **écartées** plutôt
  que mises en file (elles brûleraient une tentative pour rien). _(22/08.)_
- [x] **C4L4-18 · Le lot REFUSE de partir sur une liste tronquée.** La lecture des dépôts est
  paginée et **confrontée au décompte que la base annonce** ; si les deux diffèrent, rien n'est mis
  en file — *un lot posé sur une liste tronquée oublierait des copies en silence*. _(22/08.)_
- [x] **C4L4-19 · Les retours sont MASQUÉS PAR DÉFAUT, et la révélation est graduée.** Cran 0 : rien.
  Cran 1 : le compte, **ni texte ni citation**. Cran 2 : les points, **sans citation**. Cran 3 : le
  détail. **Le cran est PAR COPIE et ne se persiste nulle part** — rouvrir l'écran remasque tout ;
  **aucun interrupteur global** n'existe. **L'identifiant stable survit à tous les crans.** _(22/08.)_
- [x] **C4L4-20 · L'édition du professeur passe la garde, et conserve les identifiants.** Un point
  **sans ancrage** passe (« il peut modifier le retour ») ; un identifiant **inventé** est refusé ;
  un texte fait d'**espaces** est refusé ; un point **ajouté** par le professeur se reconnaît à son
  préfixe. **La garde en base est appelée à DEUX arguments**, et elle n'a qu'un domicile. _(22/08.)_
- [x] **C4L4-21 · AUCUNE NOTE, NULLE PART.** Aucune colonne dont le nom porte `note` sur le dépôt ;
  le professeur saisit un **commentaire général**, avec `corrige_par` et `corrige_at`. _(22/08.)_
- [x] **C4L4-22 · La publication et l'obligation de lecture, de bout en bout.** Avant la case :
  `published_at` NULL. Après : posé, et le dépôt passe à `retour_publie`. L'élève valide sa lecture
  → `lu_at`, **sur le retour, un seul domicile** ; valider deux fois est sans effet. **Dépublier
  retire la case MAIS PAS la lecture** — un élève qui a lu a lu. _(22/08.)_
- [x] **C4L4-23 · Le message reporté a UN SEUL domicile, et il est sur le dépôt.** Posé sur la copie
  qui l'a motivé, **lu à la passation SUIVANTE du même élève**, et **pas** sur celle qui l'a motivé
  — *« la copie est écrite et l'heure est passée »*. **Aucun second domicile au profil.** _(22/08.)_
- [x] **C4L4-24 · La `phase` de la transcription est NULL, avec son `depot_id`.** Les 280 lignes du
  test de charge la portent — la transcription est dans un exercice **sans être un étage de la
  chaîne**, et la contrainte en base n'admet que `p1`, `p2`, `retour` ou NULL. _(22/08.)_
- [x] **C4L4-25 · `photos[]` sait dire qu'une page manque, VRAIMENT.** Une page manquante **tient
  son rang** : une copie de quatre pages dont la 3 est absente se dépose en **quatre** entrées, dont
  une vide. Un **trou** dans l'ordre est refusé. `rotation` est bornée au **quart de tour**, en base
  et dans le code. **`null` et `[]` restent légitimes** — un dépôt sans photo existe. _(22/08.)_
- [x] **C4L4-26 · Le prompt de transcription est DÉRIVÉ, et son contrôle le dit.**
  `--verifie` : **IDENTIQUE**. Il est découpé en trois parts, ce qui **nomme** les deux réglages
  ouverts sans en décider aucun — et la recette les **affiche en tête** à chaque passage. _(22/08.)_
- [x] **C4L4-27 · Un seul sous-traitant.** L'appel passe par `utils/chaine/appel.ts` → le
  fournisseur d'IA, et par lui seul. Aucun OCR tiers, aucun service d'images. _(22/08.)_
