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

⚠️⚠️ **LA PORTE EST OUVERTE DEPUIS LE 22/08 — C4-L10 A BRANCHÉ L'EXPRESSION.** Ces quatre restes
étaient tous derrière la même : « la première fiche de compétence *versée et bancée* ». Cette
condition **n'existe plus** — le seuil de la dérivation est passé à *relu et validé*, par alignement
sur le `03-` §9 et le `01-` §3, et l'Expression est dérivée **et branchée**. **Deux des quatre sont
joués, deux restent, et leurs conditions sont désormais NOMMÉES UNE PAR UNE ci-dessous** : ce ne
sont plus les mêmes, et elles ne se lèveront pas ensemble.

### Ce qui reste à jouer — les quatre

- [x] **C4L5-1 · Un dépôt produit squelette et mesure sur une VRAIE compétence — JOUÉ le 22/08, par
  C4-L10.** `scripts/recette/expression-c4l10.mjs`, **29 contrôles verts**, en base, sur un dépôt
  réel et **deux vrais appels** : un squelette portant SES DEUX artefacts, une mesure, sa
  **lettre-équivalente « E »**, et **les neuf observables du §5 écrits, aucun en `n/a`**.
  ⚠️ **LE RETOUR, LUI, A ÉTÉ REFUSÉ, et c'est un constat de fond, pas un incident** : la règle 2 du
  gabarit exige de « COMMENCER PAR UNE RÉUSSITE réelle, citée », la règle 1 interdit « un compliment
  sans citation », et la copie de recette **n'en porte aucune** au relevé — la fiche §3 le pose
  ainsi : « l'absence de réussite n'est pas un défaut […] elle ne s'invente pas ». **Sur une copie
  plancher, le retour est donc structurellement impossible**, et l'élève ne reçoit rien. *La mesure,
  elle, s'écrit quand même : la chaîne dégrade proprement.* **Porté au registre des ouverts.**
- [x] **C4L5-1bis · Le RETOUR engendré, relu sur pièce (RR1-RR4, `07-` §4).** ⭐ **SA CONDITION EST
  LEVÉE le 23/08** — « une copie qui porte au moins une réussite au relevé » : le tour de C4-L10 ·
  Argumentation en a servi une, **le retour est sorti**, et son texte intégral est au relevé de cette
  séance. **Ce qui reste est la relecture RR1-RR4 par le professeur** ; automatiquement, seule RR4
  est contrôlée. ⚠️ **Et la première lecture a déjà trouvé quelque chose** : le retour **invente un
  passé** — « la fois précédente, ces liens étaient presque absents » — alors qu'**aucun état
  antérieur ne lui a été servi**. *Registre des ouverts, item 49.*
  ⭐⭐ **RELECTURE FAITE LE 23/08 AU SOIR — outil dédié `scripts/recette/relecture-rr-c4l5.mjs`,
  sur les TROIS retours en base.** *(Le retour que l'item 49 cite ne survit qu'au relevé : la
  recette de C4-L10 · Argumentation a retiré son décor.)*
  ✅ **RR3 — VERTE sur les trois.** Chaque point porte une citation non vide ET nomme sa source
  (`copie` partout ; aucun `texte_support`, ces exercices n'en servent pas).
  ✅ **RR4 — VERTE sur les trois.** 0 des **56** codes d'observable dans les textes, et aucun
  barème, seuil, note ni palier. ⚠️ *« Une phrase suffit » et « les trois unités de ce paragraphe »
  ont été pesés : ce sont des faits de la copie et une consigne d'écriture, pas « combien il en
  faudrait » — la règle les autorise explicitement.*
  ✅ **RR2 — VERTE, et de façon exemplaire sur le retour final** : *« Ce qui manque encore, dans
  les deux versions »* — la formule même de la règle —, et la réussite est un constat d'écart entre
  deux états *(« il n'était pas là avant »)*, jamais un « pourquoi ça n'a pas marché ».
  ⚠️ **RR1 — UN SEUL POINT À TRANCHER, ET IL REVIENT À LOUIS.** Le retour du 22/08 ouvre par
  *« Tu as eu une **intuition** juste : utiliser le cas du suicide **pour montrer que** la peur de
  mourir n'explique pas tout. »* RR1 autorise la tentative *(« ici, tu as visiblement essayé
  de… »)* mais interdit d'inférer **une cause dans la tête de l'élève**. « Une intuition » et
  « pour montrer que » nomment ce que l'élève **voulait**, non ce que le texte **montre** :
  c'est à la frontière. **Tout le reste des trois retours nomme des faits du texte** — « ta
  justification tourne en rond », « ce “donc” saute une étape », « la phrase s'arrête sans se
  terminer ».
  ⚠️ **Une remarque de LISIBILITÉ, qui n'est pas une infraction** : le retour final dit
  *« l'unité la plus solide »* et *« les trois unités »*. `unité` est un mot de la grille, pas de
  la langue élève — RR4 est sauve *(ce n'est pas un observable)*, mais un élève ne sait pas ce
  qu'est une « unité ».
  ⛔⛔ **ET L'OUTIL LUI-MÊME A EU DEUX DÉFAUTS, tous deux trouvés en l'éprouvant** — un contrôle
  qu'on ne met pas à l'épreuve ne prouve rien. *(a)* **Le contrôle RR4 était VIDE au premier tour** :
  `observables_mesure` est un **tableau** de codes, et un `Object.keys()` dessus rend des indices —
  il cherchait « 0 », « 1 »… et **passait au vert sans rien chercher**. Corrigé, et le script
  **refuse désormais de tourner** s'il trouve moins de 40 codes. *(b)* **Le détecteur de « passé
  invoqué » était muet sur une de ses deux formes** : `/tu avais tendance à\b/` ne trouve rien,
  parce que **le `\b` de JavaScript est ASCII et qu'il n'y a aucune frontière de mot après « à »**.
  ⭐ *C'est le MÊME écart que le `\w` unicode déjà relevé sur la Structure — troisième occurrence de
  cette famille dans le chantier.* Épreuve négative jouée : le texte fautif de l'item 49 est
  **attrapé**, les deux formes du passé aussi, et un retour licite ne déclenche rien.
  ✅ **RR1 TRANCHÉ PAR LOUIS, 23/08 : « intuition, ça passe. »** L'entrée n'attend plus rien de ce
  côté.
  ✅ **AMENDÉ PAR C4-L7 (24/08) — RELECTURE REJOUÉE SUR LES RETOURS NEUFS : TOUT EST VERT, ET LE
  DÉFAUT DE L'ITEM 49 NE S'EST PAS REPRODUIT.** `scripts/recette/relecture-rr-c4l5.mjs` rejoué après
  la traversée : **20 contrôles mécaniques, 0 échec, 0 point à lire à la main**. Sur le retour engendré
  par la voie classe de C4-L7 : **RR3 verte** *(chaque point porte une citation non vide qui nomme sa
  source — `copie`)* ; **RR4 verte** *(aucun des codes d'observable, aucun barème, seuil, note ni
  palier)* ; **RR1/RR2 sans tournure suspecte**. ⭐⭐ **ET C'EST LE CONTRE-CONTRÔLE DE L'ITEM 49 DU
  REGISTRE** *(piège 41 du prompt de C4-L7)* : le détecteur de « passé invoqué » — celui-là même qui
  avait été réparé le 23/08 après avoir été muet sur `/tu avais tendance à\b/` — **ne trouve rien**.
  **Le retour n'a PAS inventé de passé cette fois**, sur un dépôt qui n'avait aucun état antérieur.
  ⭐ **Et il nomme les dimensions en langue élève sans nommer un observable** — *« la raison qui
  explique pourquoi ta preuve entraîne ta conclusion »* —, ce que RR4 autorise et demande.
  ⚠️ *Le « slip » sur `unité`, lui, reste entier : c'est une dette de CONCEPTION, pas de ce lot.*
  ⚠️⚠️ **MAIS LE « SLIP » SUR `unité` EST UN VRAI MANQUE, ET IL EST DE CONCEPTION — remonté sur
  pièces.** Le mot élève existe : **« argument »**, et c'est le `01-` §12 qui le donne, dans
  l'exemple même qui illustre RR4 — *« trois de tes six **arguments** n'ont pas de justification »
  est un fait de son texte*. Le retour aurait donc dû écrire « ton argument le plus solide » et
  « tes trois arguments ». ⭐ **Et le modèle n'avait pas de quoi le savoir** : *(a)* le bloc
  « Vocabulaire de la grille » est **VIDE**, délibérément (`utils/chaine/chaine.ts` ~853 : « il vit
  DANS LA FICHE et n'est pas dérivable d'ailleurs ») — « unité » n'en vient donc pas ; *(b)* le
  prompt injecte les **dimensions dites à l'élève** (`utils/chaine/retour.ts` ~264), qui nomment des
  QUALITÉS — « la raison qui justifie tes conclusions », « les liens entre justification et
  conclusion » — **mais jamais l'OBJET QU'ON COMPTE** ; *(c)* et il injecte le **squelette BRUT en
  JSON** (`retour.ts` ~269), dont les clés sont du vocabulaire de grille : `unites`, `garant_cite`,
  `statut_du_lien`. **Quand le modèle a dû COMPTER, la seule étiquette disponible était la clé
  JSON.** C'est mécanique, et ça se reproduira sur les six.
  ⛔ **LE MANQUE, NOMMÉ** : la correspondance porte la **dimension** dite à l'élève, jamais **LE NOM
  DE L'UNITÉ dit à l'élève** — « un argument » pour l'Argumentation, « une couture » ou « un lien »
  pour la Structure, etc. **C'est une case que le gabarit du `03-` §1 n'a jamais eue**, exactement
  comme celle du `delta` (item 47). ⚠️ *Et RR4 ne l'attrape pas : `unite` n'est pas un code
  d'observable, donc le contrôle automatique est vert — c'est la lisibilité qui souffre, pas le
  secret du barème.*
  **Ce qu'il faudrait** : une colonne de plus à la correspondance *(ou une ligne au gabarit)*, et le
  prompt du retour la sert à côté des dimensions. ⛔ **Rien n'est corrigé ici** : une source en
  retard se marque, elle ne se corrige pas depuis le code.
  ⭐ **DÉPOSÉ AU REGISTRE DES OUVERTS, ITEM 62** *(`INVENTAIRE_Non_Tranches.md`, juste après l'item
  47)* — parce qu'une décision de conception qui ne vit que dans une entrée de test **ne se rappelle
  à personne**. Même nature et même domicile que le `delta` : une case absente du gabarit du `03-`
  §1. **À porter dans la MÊME séance, avant le SEGMENT 2.**
  ⛔ **CE QUI RESTE** : la séance de conception ci-dessus. La relecture RR1-RR4, elle, est **faite**.
  > ✅ **PASSE DE RÉCONCILIATION DU 28/08 — LE GESTE EST JOUÉ ; CE QUI RESTE EST UNE
  > DÉCISION, ET UNE DÉCISION N'EST PAS UN RESTE DE RECETTE.** La relecture RR1-RR4 **a été faite
  > le 23/08 au soir**, à l'outil dédié `scripts/recette/relecture-rr-c4l5.mjs`, **sur les trois
  > retours en base** : **RR2, RR3 et RR4 vertes**. ⚠️ **Il reste UN point, et il est à Louis** —
  > l'ouverture *« Tu as eu une intuition juste… »*, à la frontière de RR1, qui autorise la
  > tentative mais interdit d'inférer une cause dans la tête de l'élève. **Ce point vit au registre
  > des ouverts**, pas ici ; la ligne de recette, elle, a rendu ce qu'on lui demandait.
- [x] **C4L5-2 · La latence à PLUSIEURS compétences en parallèle — JOUÉE le 23/08, par C4-L10 ·
  Argumentation.** Sa condition de reprise — **LA DEUXIÈME compétence branchée** — est levée :
  l'Argumentation l'est. **Mesure à DEUX compétences, sur trois tours réels : 47 s, 49 s et 52 s**
  pour 2×P1 + 2×P2 + retour, sur un dépôt froid, contre un contrat de moins de trois minutes.
  ⭐ **Le contrat tient, et la marge se lit** : passer d'une compétence *(39 s au tour de
  l'Expression)* à deux coûte **~13 s**, et non le double — les chaînes tournent bien en parallèle,
  et le retour est l'appel commun. ⚠️ **À six compétences, l'extrapolation reste à faire** : même
  appel de retour, mais six chaînes froides. *(Détail à la section C4-L10 · Argumentation.)*
- [x] **C4L5-3 · La reprise après expiration, sur la chaîne ENTIÈRE.** Prouvée en séance sur la
  fonction d'écriture et sur l'index unique (C4L5-8). Reste à **tuer un job après P1** sur une
  compétence ouverte, et à constater **le squelette unique** au bout. ⭐ **DEVENU JOUABLE le 22/08** :
  une compétence est ouverte. *L'idempotence a par ailleurs été reprouvée sur la chaîne réelle —
  `traiterDepot` rejoué : **une** mesure, **un** squelette (recette C4-L10).*
  ✅ **AMENDÉ PAR C4-L7 (24/08) — LE JOB A ÉTÉ TUÉ APRÈS P1, SUR LA CHAÎNE RÉELLE.** Décor :
  un dépôt maison neuf, `argumentation` ouverte. **L'ouvrier A** met en file, réclame *(bail 4 s ;
  `tentatives` monte À LA PRISE — 1)*, et part. On attend que **P1 soit réellement passé** — la
  première ligne d'`api_couts` en `phase = p1`, constatée par requête, jamais supposée. On **expire
  alors son bail** : il est réputé mort après P1. **L'ouvrier B réclame le même job** — même
  `cle_idempotence` (`<depotId>:mesure_v1`) — et rejoue TOUTE la chaîne pendant que A finit.
  ⭐⭐ **AU BOUT : UN SEUL SQUELETTE, UNE SEULE MESURE, UN SEUL JOB**, constatés par requête.
  ⭐ **Et c'est plus dur que le scénario écrit** : **TROIS** passages complets de la chaîne ont eu
  lieu *(9 lignes d'`api_couts` — 3 × p1/p2/retour)*, et les deux gardes ont tenu quand même —
  l'index unique (dépôt × compétence × version) et la clé d'idempotence de la file. Les deux ouvriers
  rendent `mesuresEcrites=0, dejaLa=1` : le premier arrivé a écrit, les autres ont été refusés.
  ⚠️ **Le prix du filet se dit** : 9 appels payés pour UNE mesure — une reprise REPAYE, ce n'est pas
  un défaut. ⚠️ **Un artefact du banc, pas du produit** : le job finit `en_cours` avec `tentatives=3`
  parce que le banc appelle `traiterDepot` directement et non `mesurerMaintenant`, qui seul appelle
  `terminerJob`. *(`traversee-c4l7.mjs --reprise`.)*
- [ ] **C4L5-4 · Le `delta_v1_vf` et les deux résultats de la paire.** Le code les attache, mais
  **leur calcul est au branchement de chaque fiche**. ⚠️ **LA CONDITION A CHANGÉ, ET ELLE S'EST
  PRÉCISÉE** : l'Expression est branchée, et **son branchement NE DÉCLARE PAS de `delta`** — sa
  fiche ne dit nulle part ce que « comparer deux squelettes » veut dire pour elle, et l'inventer
  depuis le code serait trancher une règle de grille. La chaîne le dit par une alerte et laisse
  **NULL — qui n'est pas 0**. **Condition de reprise : une fiche qui DÉFINIT son delta.** *Porté au
  registre des ouverts, et à la boîte aux lettres de C4-L10.* ⭐⭐ **AMENDÉ LE 23/08 — TROIS FICHES
  SUR TROIS SE TAISENT, ET LA TROISIÈME COMPTE DESSUS.** L'Argumentation ne le définit pas non plus
  *(le mot n'y figure pas une fois)* ; **la Structure non plus — mais son §8 en fait l'arbitre
  empirique de sa seule vraie question ouverte**, la pondération cohérence/cohésion : *« arbitre
  empirique possible : les deltas v1→vf »*. **Une source s'appuie donc sur une grandeur que rien ne
  calcule.** Ce n'est plus un oubli de l'Expression : c'est **une case du gabarit du `03-` §1 que
  personne n'a remplie**. *Registre des ouverts, item 47, amendé deux fois.*
  ⭐⭐ **REQUALIFIÉE LE 23/08 — DÉCISION DE LOUIS, ET C'EST LE MOTIF QUE C4-L7 ATTENDAIT.**
  **SIX fiches sur six se taisent : le corpus est épuisé**, et la condition d'origine — « une fiche
  qui DÉFINIT son delta » — **ne pouvait plus se lever par aucun lot Code**. Trois voies ont été
  pesées ; la règle **générique** a été écartée sur un fait de câblage vérifié : le crochet `delta`
  reçoit les deux **extractions** *(`utils/chaine/chaine.ts` ~l.703 ; `lireSquelette(…,'v1')` rend
  `artefact_extraction`)*, et **rien de ce qui se calcule depuis une extraction seule ne porte une
  DIRECTION** — « mieux » n'est défini que par `observables_mesure`, appliqué **en aval de P2**.
  Une règle générique aurait donc comparé des grandeurs passées par le jugement, ce que le `01-` §11
  **GELÉ** interdit. ⭐ **NOUVELLE CONDITION DE REPRISE : une séance de CONCEPTION remplit la case du
  gabarit du `03-` §1** — fiche par fiche, chacune disant ce qu'elle compare sur son propre
  squelette *(la seule voie qui respecte le §11 à la lettre)*. **Échéance : avant le SEGMENT 2 du calendrier — les semaines 2 à 4**
  *(`01-` §11, couche 1)*. **Décision de Louis, 23/08 : une session dédiée, la semaine prochaine** —
  « pour faire passer le segment 1 je n'en ai pas besoin ». *La Structure fait déjà du delta
  l'arbitre empirique de sa seule vraie question ouverte, et attend donc cette séance.*
  ⛔ **CE QUE C4-L7 EN FAIT** : plus rien. Son « fait quand » est requalifié *(`07-` §2, v2.41)* et
  demande désormais un `delta_v1_vf` **calculé, OU NULL accompagné de son alerte nommée**. Un NULL
  **silencieux** reste un échec de recette ; ce NULL-ci se déclare, à chaque version finale.
  ⚠️ **CE QUE ÇA COÛTE, ET C'EST ASSUMÉ, PAS RÉSOLU** : le signal de réceptivité de N2 est
  **ÉTEINT** — `receptiviteRetrouvee` *(`utils/routeur/escalade.ts` ~l.473)* ne tient plus que sur
  `paire_correction_juste`, et au cran de transformation l'escalade rend `sans_objet` avec son
  motif. *Registre des ouverts, item 47, amendé une sixième fois.*

- [ ] **C4L5-22 · ⚠️⚠️ DEUX CHEMINS RENDENT `delta_v1_vf` NULL **SANS AUCUNE ALERTE**, et la clause
  requalifiée de C4-L7 repose précisément sur cette alerte.** Trouvé le 23/08 en écrivant la
  requalification de `C4L5-4`. `utils/chaine/chaine.ts` ~l.703-710 :
  `const delta = branchement.delta && squeletteV1 != null ? branchement.delta(...) : null`, puis
  `if (delta === null && !branchement.delta) alertes.push(...)`. **L'alerte est gardée par
  `!branchement.delta` seul.** Donc, dès qu'un branchement DÉCLARE son delta : *(a)* un
  **squelette v1 introuvable** — `lireSquelette` rend `null` sur erreur comme sur absence — donne
  `delta = null` **en silence** ; *(b)* un `delta()` qui **rend `null` lui-même** *(cas légitime :
  la fiche ne sait pas comparer ces deux squelettes-là)* passe **en silence** aussi. ⭐ **Inoffensif
  AUJOURD'HUI, et c'est pour ça que personne ne l'a vu** : les six branchements ne déclarent aucun
  `delta`, donc `!branchement.delta` est toujours vrai et l'alerte tombe à chaque version finale.
  ⛔ **Le jour où la voie (C) livre la première fiche qui définit son delta, le trou s'ouvre** — et
  il s'ouvre sur la grandeur même que C4-L7 accepte de voir NULL *à condition qu'elle se déclare*.
  ⚠️ **Un troisième défaut, plus petit** : sur le chemin *(a)* d'aujourd'hui, l'alerte tombe bien
  mais **avec le mauvais motif** — elle dit « le branchement n'en déclare pas le calcul » quand la
  cause réelle est un squelette v1 manquant. **Condition de reprise : le lot de correctifs**, ou la
  séance qui portera le premier `delta` — la parade est de garder l'alerte sur `delta === null`
  seul, en nommant les trois causes séparément.
  ✅ **AMENDÉ PAR C4-L7 (24/08) — L'ALERTE A ÉTÉ VUE TOMBER SUR UNE VRAIE VERSION FINALE, ET SON
  MOTIF A ÉTÉ LU.** La traversée maison a produit un dépôt à **DEUX squelettes** *(argumentation
  v1 + vf)*, `delta_v1_vf` **NULL en base**, et l'alerte est **présente**, mot pour mot :
  *« argumentation : `delta_v1_vf` reste NULL : le branchement de la compétence n'en déclare pas le
  calcul — et NULL n'est pas 0 (01- §11) »*. ⭐ **La clause requalifiée du « fait quand » de C4-L7
  est donc satisfaite sur les DEUX branches** — la valeur quand elle existe, l'alerte nommée quand
  elle n'existe pas — **et éprouvée, pas seulement écrite**. ⭐ **Et le motif ne ment pas ICI** : le
  squelette v1 existait bien *(constaté par requête)*, donc la cause réelle **est** l'absence de
  `delta` au branchement, ce que l'alerte dit. ⛔ **Les trois défauts nommés ci-dessus RESTENT
  ENTIERS** : ils ne s'ouvrent que le jour où une fiche définira son delta, et aucune ne le fait.
  **Cette entrée n'est donc PAS cochée** — la parade appartient au lot qui touchera `chaine.ts`.
  *(`traversee-c4l7.mjs --maison`, section B5.)*

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

- [x] **C4L5-18 · La `cible_primaire` de l'exercice conçu par le professeur.** `exercices` gagne une
  colonne NULLABLE, l'écran de conception de C4-L8 gagne le champ, et `cibleDuRetour` la lit avant
  tout défaut (`07-` §1.1). **Aujourd'hui la chaîne prend la première compétence mesurée** — un
  ordre de clés JSONB, que le `07-` §1.1 refuse explicitement de tenir pour une hiérarchie.
- [x] **C4L5-19 · Le retrait de `exercices_squelettes.prompt_version`.** **Rien n'est versionné par
  phase** : l'`instrument_version` bouge dès qu'un prompt bouge, un prompt vivant dans sa fiche
  (`01-` §11 v5.4, `07-` §1.2). La table est **vide** et la colonne nullable — personne ne l'écrit
  ni ne la lit.
- [x] **C4L5-20 · `maxDuration`, le commentaire qui le justifie, et le DÉCLENCHEUR.** La route porte
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
- [x] **C4L5-21 · Le `ton` et la `longueur` du gabarit du retour.** Le `07-` §4 les déclare éditables ;
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
  ✅ **COCHÉ PAR C4-L11 (23/08).** La colonne existe — `text` **NULLABLE**, `CHECK` de **domaine seul** (les six, `NULL` toléré) : un `NOT NULL` aurait cassé la voie du routeur. ⭐ **Les SIX fichiers ont été repris, pas seulement le premier** — dont `utils/deroule/depot.ts`, dont le `select` explicite est le plus dangereux : sans lui la colonne existerait **sans jamais descendre jusqu'à la chaîne**. L'ordre de lecture est celui du `07-` §1.1 : décision → `cible_primaire` → repli, et l'alerte **se resserre** au lieu de disparaître. L'écran de conception la **pose sans la demander** quand une seule cible est possible. **La coexistence que la source dit impossible SE DIT** (`alerteDeCoexistence`). Prouvé sur des instances réelles : `scripts/recette/correctifs-c4l11.mjs`, partie A. ⚠️ **Ce qui reste** : le retour ÉCRIT par un vrai appel sur DEUX compétences — voir la section C4-L11.
  ✅ **COCHÉ PAR C4-L11 (23/08).** **Une colonne et DEUX écritures** : `chaine.ts` la posait à l'extraction *et* au jugement, avec exactement `instrument.version`. **Le code d'abord** (les deux écritures retirées), **le SQL ensuite** (`c4_l11_retraits.sql`). ⭐ `instrument_version` **RESTE** — retirer les deux aurait été l'erreur symétrique. ⚠️ **Rectification d'un fait de la source** : le `07-` §2 disait « la table n'est plus vide depuis C4-L10 » ; **elle est vide** — la recette de C4-L10 a retiré son décor —, ce qui a été **amendé au `07-` §2 depuis le relevé**. Le geste compte les lignes avant, **s'arrête par `raise exception`** si une seule portait autre chose que sa jumelle, et recompte après.
  ✅ **COCHÉ PAR C4-L11 (23/08).** `maxDuration` = **300 s**, le cron posé (voir C4L4-E), et ⭐ **LA MOITIÉ QUI MANQUAIT À LA GARDE DE BUDGET : LA RÉSERVATION.** La boucle bornée existait ; ce qui manquait, c'est « il reste de quoi TRAITER le job que je vais réclamer ». Comme `reclamerJobs` pose le bail **et incrémente `tentatives` à la prise**, le dernier job de chaque tour était tué en vol et brûlait un essai — trois fois, et c'est `echec_definitif`. Le correctif est **une estimation de durée par étape, comparée au reste, AVANT `reclamerJobs`** — et il **resserre le filtre `etapes`** plutôt que de s'arrêter d'un coup : un tour à 40 s de la fin peut encore prendre une transcription (réserve 30 s, p95 mesuré 24,3 s), jamais une mesure (réserve = le contrat de latence). La réponse porte désormais `reclames`, `traites` et **`tuesEnVol`** — le compteur qui prouve la garde.
  ✅ **COCHÉ PAR C4-L11 (23/08) — LES TROIS EXIGENCES DU §4, ET LE BANC REJOUÉ.** *(1)* **Le gabarit sort découpé en sections nommées** : `entete` + `regle_1`…`regle_8`, titres **dérivés du texte** (« CITE SES MOTS », « LONGUEUR »…), `verrouillee` d'après le §4, et **le recollage rend le gabarit à l'octet** — la dérivation s'arrête sinon. *(2)* **La `longueur` a son paramètre de plateforme** : `scriptorium_params.exercices_retour_longueur`, **NULL valant la règle 7**, remplaçant de **section** et jamais variable ; une section verrouillée ne se remplace jamais (garde dans `assemblerGabarit`). *(3)* **Le `ton` partagé est REÇU** par la couche contrat, et l'**identité** descend au fichier partagé (`utils/ia-commun.ts`, `IDENTITE`) : les **trois surfaces** la reçoivent — le retour, le tuteur, les retours de lecture d'Aletheia —, chaque atelier n'écrivant plus que son **rôle**. ⚠️ **La collision `REGISTRE` est fermée par une garde qui lève** : `{{REGISTRE}}` refuse tout ce qui n'est pas un registre de retour. ⭐ **LE BANC EST REJOUÉ, sur les DEUX modèles** (23/08) : `claude-haiku-4-5` et `gemini-3.5-flash-lite`, 27 scénarios chacun — **0 fuite de sentinelle future, 0 fuite de sentinelle livre, 0 dépassement de longueur, 0 erreur**, et **exactement le même unique `NON-REFUS` heuristique que les références du 25/07** (`adv-injection-2` pour haiku, `adv-injection-1` pour gemini). **0,144 $.** Rapports : `rapport-claude-haiku-4-5-2026-08-23.md`, `rapport-gemini-3.5-flash-lite-2026-08-23.md`. *L'écart au prompt du banc L8 est **borné à la seule section `ton`**, et un test le prouve : les six sections verrouillées sont intactes, octet pour octet.*


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
- [x] ⚠️ **SEC-21 · LE SMOKE TEST DU RETRAIT — créer un élève depuis l'écran professeur.**
  C'est le **seul** chemin que la suppression pourrait toucher, et **ce n'est pas une requête**
  qui le prouve : il faut créer un compte et constater sa ligne dans `profiles`. ⭐ **C'est le
  chemin de mardi 25** *(création des comptes élèves)*. Retour arrière prêt si besoin :
  `securite_handle_new_user_retrait_rollback.sql` — ⚠️ *qui recrée la fonction **et la referme
  dans la même transaction**, sans quoi elle renaîtrait grantée à `anon`.*
  > ✅ **JOUÉ — ET À UNE ÉCHELLE QU'UN TEST MANUEL N'AURAIT PAS ATTEINTE.** *Constat de Louis, 29/08 :
  > « oui ça s'est bien passé ». **Corroboré par requête**, parce qu'un constat se vérifie quand il
  > peut l'être.*
  > **En PRODUCTION, 60 profils sur 63 ont été créés APRÈS le retrait de `handle_new_user()`** — du
  > **2026-08-25 02:11** au **2026-08-26 01:42**, tous en `role = 'eleve'`. ⭐ **C'est exactement « le
  > chemin de mardi 25 » que cette ligne annonçait**, et il a tenu **soixante fois**.
  > ⭐ **Ce que ça prouve, et c'est plus que ce qui était demandé** : le chemin de création ne dépend
  > PAS du déclencheur retiré — `admin.auth.admin.createUser` puis un `insert` explicite dans
  > `profiles`, avec suppression du compte si le profil échoue *(`app/prof/eleves/actions.ts`)*. La
  > révocation du 21/08 n'a rien cassé, et **`securite_handle_new_user_retrait_rollback.sql` n'a pas
  > eu à servir**.
  > ⚠️ *Le bac à sable, lui, ne le prouve pas : ses 18 profils sont tous antérieurs au 21/08. La
  > preuve est en production, et c'est là qu'elle compte.*

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
- [x] **C4L4-E · POSER LA CADENCE et monter `maxDuration`.** ⚠️ **Ce geste appartient AU LOT DE
  CORRECTIFS, pas à C4-L4** (`PLAN_DE_CHANTIER.md` §6). Il reste que **rien ne vise `/api/chaine`
  aujourd'hui** : `vercel.json` ne déclare qu'un cron, celui de la synthèse hebdomadaire. **Tant
  qu'il n'est pas fait, la recette de C4-L4 est PARTIELLE** — elle a appelé l'ouvrier en direct,
  comme l'écran de l'élève le fait, mais **le filet qui reprend les jobs orphelins n'existe pas**.
  ✅ **COCHÉ PAR C4-L11 (23/08).** `vercel.json` déclare `{ "path": "/api/chaine", "schedule": "* * * * *" }` — **la cadence que l'offre autorise**, constatée à C4L4-C. ⚠️ **C'est le FILET, pas le chemin normal** : le dépôt appelle lui-même le déclencheur, et ce cron « reprend les jobs dont le bail a expiré ». `maxDuration` passe de 60 à **300 s**, au-dessus du contrat de trois minutes. ⛔ Aucun chiffre d'hébergeur n'est entré dans une source. **La garde de budget** vient avec : voir C4L5-20.

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
- [x] **C4L4-4 · Le retour AFFICHÉ, sur un vrai retour engendré.** ⭐ **LA PORTE D'ORIGINE EST
  LEVÉE** — C4-L10 a branché l'Expression le 22/08, la chaîne engendre. La recette de C4-L4 avait
  posé une **fixture** à la forme exacte, et l'avait dit. ⚠️ **Une seconde condition est apparue, et
  elle est nommée** : le retour n'est engendré que sur une copie **portant au moins une réussite au
  relevé** — la règle 2 du gabarit exige de commencer par une réussite citée, la règle 1 interdit
  d'en inventer une. **Condition de reprise : un dépôt réel dont le relevé porte une réussite.**
  ⚠️ **AMENDÉ PAR C4-L7 (24/08) — LA SECONDE CONDITION EST LEVÉE, ET LE DÉCOR EST LAISSÉ EXPRÈS EN
  BASE POUR QUE LOUIS LA COCHE À L'ŒIL.** Un dépôt réel existe, dont la chaîne a engendré un retour
  **et l'a publié puis fait lire** — voie classe, examen diagnostique. ⛔ **Elle n'est PAS cochée
  ici, et c'est délibéré** : c'est un contrôle **À L'ŒIL**, et une session Code ne saisit pas
  d'identifiants *(piège 66)*. **Le chemin est préparé, il ne reste qu'à regarder** :
  *(1)* décor laissé en base — ligne de plan `4770f701` *(note `RECETTE C4-L7`, module codex,
  fenêtre `decembre`)*, instance `0f6c3fb4`, **7 dépôts**, dont un porte 3 mesures `sommatif` et un
  retour **`published_at` + `lu_at` posés** ; *(2)* ouvrir `passation_classe_actif` **et**
  `exercices_actif` *(le plus fermé gagne — piège 11)* ; *(3)* écran de correction de la passation ;
  *(4)* **refermer les deux**. ⚠️ **Dans un vrai navigateur, jamais l'aperçu embarqué**, et **Cmd-R
  avant de conclure à un bug** *(protocole du suivi)*. ⭐ **Ce qu'il faut voir** : le retour rendu
  **SEGMENTÉ — une liste de points, chacun avec son identifiant stable et son ancrage —, jamais un
  bloc que l'écran découperait** *(§1.2 ; piège 20)*. **Pour retirer le décor ensuite :**
  `node --import ./scripts/register-calibration-resolver.mjs scripts/recette/traversee-c4l7.mjs --retire`.
  ✅ **COCHÉ LE 24/08 — VU À L'ŒIL, ET SEGMENTÉ.** La preuve complète est sous `C4L7-11`, aux smokes du 24/08 : 5 points, chacun avec sa compétence, sa nature, sa citation, et en base son identifiant stable `{depot}:v1:01…05`.
- [x] **C4L4-5 · « Se juger » réellement servi.** Il ne l'est pas : **aucune compétence n'est
  `evaluee`** en base (`competences_niveaux` ne porte que `mesuree_silencieusement`). Le drapeau est
  nécessaire, pas suffisant. ⚠️ **CETTE CONDITION-LÀ N'EST PAS CELLE QUE C4-L10 A LEVÉE**, et les
  deux ne se confondent pas : ouvrir une compétence à la chaîne est un geste de CODE ; poser
  `evaluee` est un geste **DU PROFESSEUR**, à l'écran de C4-L8, et aucun lot ne le fait à sa place
  (`01-` §3 ; `03-` §9). **Condition de reprise : un statut `evaluee` posé à la fabrique.**
  ✅ **AMENDÉ PAR C4-L7 (24/08) — LA CONDITION EST LEVÉE ET LE GESTE EST SERVI.** Les six
  statuts sont posés depuis le 23/08 (21:18–21:19). Traversée classe sur un examen diagnostique
  conçu à la fenêtre `decembre` : `offreSeJuger` rend **`servie: true`, 2 questions** sur
  `argumentation` *(fiche v4.1)*, et `enregistrerSeJuger` les écrit. ⭐ **Éprouvé PAR L'ÉCHEC** :
  une réponse hors de la liste fermée est refusée — « Réponse hors liste pour « garant_present ». »
  *(`scripts/recette/traversee-c4l7.mjs --classe`, section A6.)*
- [x] **C4L4-6 · La confiance de remise réellement collectée.** L'étape **est servie** et **sert un
  objet vide** — construite quand même, c'est la collecte qu'une année manquée ne rattrape pas.
  ✅ **AMENDÉ PAR C4-L7 (24/08) — L'OBJET N'EST PLUS VIDE, ET IL EST COMPTÉ.** L'objet était
  vide parce que la confiance est « une valeur par compétence `evaluee` mesurée, jamais un
  scalaire » (§1.1) et qu'il n'y en avait aucune. Les six sont `evaluee` depuis le 23/08.
  `offreConfianceRemise` rend **3 compétences** — `structure, expression, argumentation` —, et
  `exercices_depots.confiance_declaree` porte **en base** `{"structure":"elevee",
  "expression":"elevee","argumentation":"elevee"}` : **trois valeurs, une par compétence, comptées
  par requête**. ⚠️ *Cette entrée ne nommait aucune condition de reprise — elle n'en a plus besoin.*
  *(`traversee-c4l7.mjs --classe`, section A6.)*
- [x] **C4L4-7 · LA CRÉDENCE — JOUÉE le 22/08, aux DEUX formes.** Décor monté : deux instances de
  classe, l'une au cran **`diagnostic_guide`**, l'autre au cran **`diagnostic_nomme`**.
  ⭐ **Cran GUIDÉ** : l'écran sert **QUATRE candidats** — trois distracteurs tirés de la banque plus
  la `reponse_attendue` — et 100 jetons à répartir (`02-` §5, à la lettre). La garde du total tient
  et le dit : « **Cas 1 : les jetons doivent totaliser 100 (ils font 40)** ». ⭐ **Cran NOMMÉ** :
  **un pourcentage unique, AUCUN candidat**. En base, les deux sont stockées **en tableau**, une
  entrée par cas, chacune portant sa forme. ⚠️ **C'est ce test qui a trouvé le défaut C4L4-G.**
- [x] **C4L4-7bis · LA CRÉDENCE SUR UNE PAIRE — JOUÉE le 22/08, et ⚠️ ELLE A TROUVÉ UN DÉFAUT.**
  Décor monté pour la première fois : **deux vraies paires** de classe — un exercice,
  `paire_diagnostic = true`, **DEUX `exercices_cas`** aux distracteurs et réponses attendues
  différents, deux consignes. ⚠️⚠️ **Avant correction, l'écran ne servait qu'UNE crédence** — celle
  du cas 1, avec les candidats du cas 1 — et la base recevait `[{"cas": 1, …}]` **sur une paire**.
  Or *« il y en a une par diagnostic, donc DEUX sur une paire »* (§1.2), et c'est **l'écart entre
  les deux** qui mesure le transfert (`02-` §2.3.1 a) : **une crédence unique sur une paire ne
  mesure rien**. ✅ **Corrigé et rejoué aux DEUX formes** : cran **guidé** → 8 champs (`j:1:…`,
  `j:2:…`), **quatre candidats DIFFÉRENTS par cas**, base = deux entrées (70 puis 40 sur la bonne
  réponse) ; cran **nommé** → 2 champs (`pourcentage:1`, `pourcentage:2`), base = deux entrées
  (85 % puis 35 %). ✅ Les gardes nomment le bon cas : « **Cas 2** : les jetons doivent totaliser
  100 (ils font 40). » et « **Une paire demande une crédence par cas : il manque celle du cas 2.** »
  ⭐ **Et « absent n'est pas zéro »** : un champ manquant au cran nommé aurait enregistré « 0 % de
  chances » — une crédence **inventée** que le Monitoring aurait crue déclarée (même règle que
  « `delta_v1_vf` NULL n'est pas 0 »). L'action ne pousse plus rien pour un cas muet.
  ✅ **Recette rejouée : 44 verts, 0 rouge** — le chemin à un seul cas n'a pas bougé.
  ⚠️ **RESTE UNE QUESTION DE SOURCE, portée au relevé** : la paire est « un exercice EN DEUX TEMPS »,
  et *« la correction du premier cas est servie avant le second »* — **le flux de classe n'a pas ce
  moment**. Les deux crédences se collectent donc au même instant, après la copie entière : l'écart
  existe, mais **ce n'est pas l'écart que la source définit**.
- [ ] **C4L4-7ter · La crédence sur une paire dont les deux cas visent DES MATÉRIAUX distincts.**
  Le décor du 22/08 laisse `materiau_id` NULL des deux côtés — le trigger `garde_cas_de_la_paire`
  (« un même matériau servi deux fois ne mesure aucun transfert ») n'est donc **pas éprouvé**.
  ⚠️ **Constat revérifié par requête le 22/08** : les deux types diagnostiques seedés
  (`diagnostic_essai`, `diagnostic_explication_texte`) sont **SANS CRAN** — `crans_admis` vaut `{}`,
  et `exercices_types_crans` ne porte **aucune ligne** pour eux.
- [x] **C4L4-8 · LES SUJETS DES DEUX PASSATIONS DIAGNOSTIQUES — ⚠️⚠️ BLOQUÉ, et le blocage est
  établi par requête le 22/08.** Les deux types seedés par C4-L1 — `diagnostic_essai` et
  `diagnostic_explication_texte` — sont **entièrement vides** : `crans_admis = {}`, **0 mode,
  0 cran, aucun grain**, `nature = 'complet'`. Or **l'écran de conception de C4-L8 dérive ses choix
  de LA DOCTRINE**, qui ne connaît **que les treize objets** (`exercices_routes` :
  `argument, conclusion, exemple, introduction, mot, objection, paragraphe, partie, phrase, plan,
  problematisation, reference, transition`) — **les deux diagnostiques n'y sont pas**.
  ⚠️ **Une passation diagnostique n'est donc pas concevable par l'écran** : ce n'est pas un objet à
  un cran, c'est une copie entière. **Ce n'est ni un défaut de C4-L4, ni un défaut de C4-L8** — c'est
  une question de source : par quelle voie ces deux passations naissent-elles ? *(Question portée au
  relevé de C4-L4.)*
  ✅ **AMENDÉ PAR C4-L7 (24/08) — LA QUESTION A SA RÉPONSE, ET LA VOIE EST PARCOURUE.** La
  réponse est venue en séance de conception le 22/08 — *un examen diagnostique n'est pas un objet à
  un cran, c'est une **copie entière*** — et **C4-L9 a construit la voie**. La traversée de C4-L7 l'a
  **parcourue de bout en bout** : ligne de plan diagnostique → `chargerConception` (choix d'un
  **sujet** dans Codex) → `concevoirExamenDiagnostique` → instance `lieu = classe`, `nature =
  complet`, **sans cran** → assignation → ouverture → transcription → mesure → **ancre `forme =
  sommatif`** → retour publié et lu. *La voie ne passe donc PAS par la doctrine objet × mode × cran,
  et c'est cohérent.* *(`traversee-c4l7.mjs --classe`, sections A1 à A10.)*
- [x] **C4L4-9 · L'ÉLÈVE EXEMPTÉ — JOUÉ le 22/08, de bout en bout, dans Chrome.**
  `mode_saisie_force = 'ecran'` posé sur un compte de test → l'écran bascule en **« RÉDIGE TA
  COPIE »**, et ⭐ **le rappel de lisibilité DISPARAÎT** — « ne livre pas l'exigence sans
  l'exemption » (piège 34) est tenu à l'écran. ⭐⭐ **LE REFUS DU COLLAGE EST PROUVÉ POUR DE VRAI** :
  texte chargé dans le presse-papiers du système, `Cmd+V` → **rien ne s'insère** ; clic droit → **le
  menu ne s'ouvre pas**. Les deux vecteurs laissent leur trace serveur (`moyen raccourci`,
  `moyen menu-contextuel`) et ⭐ **ZÉRO signalement d'intégrité** — en classe c'est une trace, pas un
  signal (`06-` §6). Le correcteur orthographique reste **actif** (« lui-meme » souligné).
  En base : `texte_v1` écrit, `transcription_v1` et `photos_v1` NULL, **0 CR et 3 blocs** — le
  correctif CRLF tient aussi sur le chemin clavier.
- [x] **C4L4-9bis · LE GLISSER-DÉPOSER — JOUÉ le 22/08.** Un `DragEvent('drop')` porteur d'un vrai
  `DataTransfer` a été déposé sur le champ : **`defaultPrevented: true`**, la valeur du champ **ne
  bouge pas**, et la trace serveur porte `moyen glisser-deposer`. ⭐ **Les TROIS vecteurs de `06-` §1
  sont désormais tracés** — `raccourci`, `menu-contextuel`, `glisser-deposer` — et **zéro
  signalement d'intégrité** sur les trois. *Réserve honnête : l'événement est DISPATCHÉ, pas produit
  par une souris ; ce qui est prouvé est que le gestionnaire est câblé et annule, pas le geste de
  l'utilisateur.*
- [x] **C4L4-9ter · LES TROIS COLLAGES RAPPORTÉS AU PROFESSEUR — JOUÉ le 22/08, sur pièce.**
  ⭐ **Décision de Louis du 22/08** : la journalisation n'était **pas** un journal — un
  `console.warn` que personne ne lit et **que le professeur ne voit jamais**. Elle s'écrit désormais
  sur le dépôt (`collages_bloques`, ajout **atomique** par RPC) et **l'écran de correction la
  montre**. **Rejoué en vrai, les trois vecteurs** — `Cmd+V` au presse-papiers **réel** du système,
  **clic droit réel**, `DragEvent` porteur d'un vrai `DataTransfer` : **rien ne s'insère** (244
  caractères avant, 244 après), et la base porte **trois entrées horodatées par le SERVEUR**, une
  par moyen. ⭐ **Ce que l'écran du professeur rend, mot pour mot** : « **3 tentatives de collage
  bloquées — 1 au raccourci clavier, 1 au glisser-déposer, 1 au menu contextuel.** Le collage est
  refusé dans le champ de rédaction ; ces tentatives n'ont rien inséré. C'est une information, pas
  un verdict : rien n'a été signalé, et le blocage est côté navigateur seulement — il arrête le
  geste paresseux, pas l'élève déterminé. » ✅ **`integrite_signalements` : 13 lignes, toutes du
  24/07, aucune nouvelle** — zéro signalement levé, le motif tient. ✅ **Les élèves à zéro tentative
  n'affichent RIEN** (Elo, Dylan, Sacha vérifiés) : « un écran n'affiche un nombre que si ce nombre
  compte quelque chose » (`06-` §5) — et un zéro afficherait une garantie que le blocage, côté
  navigateur seulement, ne donne pas. ✅ Le journal **survit à la validation** de la copie.
- [x] **C4L4-9quater · LA COPIE DE L'ÉLÈVE EXEMPTÉ ÉTAIT INVISIBLE — TROUVÉ ET CORRIGÉ le 22/08.**
  ⚠️⚠️ **Deux écrans mentaient sur le même chemin, et le smoke test du 22/08 ne pouvait pas le
  voir** parce qu'il a tapé et validé **d'un seul trait, sans jamais recharger**.
  **(1) Côté PROFESSEUR** : l'écran de correction ne lisait que `transcription_v1` — la copie d'un
  élève exempté, qui vit dans `texte_v1`, **n'apparaissait NULLE PART**. Le professeur corrigeait un
  retour **sans pouvoir lire la copie**, alors que la chaîne, elle, la lisait bien
  (`production()` lit l'un **ou** l'autre). **(2) Côté ÉLÈVE** : le champ s'initialisait sur
  `vue.transcription` — l'élève qui **rouvrait sa page après avoir validé** trouvait un champ
  **vide et verrouillé** : sa copie avait disparu de son écran. ✅ **Les deux corrigés et éprouvés
  au navigateur** : l'élève retrouve ses 244 caractères en lecture seule, et le professeur lit
  « **La copie (3 paragraphes · tapée au clavier (aménagement))** » avec le texte dedans.
- [x] **C4L4-10 · L'EFFACEMENT D'UNE CLASSE — JOUÉ le 22/08**, sur une classe **jetable**
  (`SMOKE-EFFACEMENT`), par le même chemin que l'écran du professeur —
  `collecterCheminsInscriptions` → `effacer_classe` → `retirerFichiers`. ⚠️ **Jamais sur `THLP`.**
  **Ce qu'il établit, et c'est plus précis que la dette telle qu'elle était écrite :**
  ✅ **les FICHIERS partent** — la collecte trouve la photo de passation, 0 fichier restant ;
  ✅ **l'INSTANCE est DÉTACHÉE** (`classe_id → NULL`) — c'est exactement le régime que `06-` §7
  prescrit au *contenu créé par le professeur* ; ✅ **le JOURNAL DES COÛTS survit**, et c'est voulu ;
  ⚠️ **le DÉPÔT, le RETOUR et le JOB survivent** — or c'est du **travail d'élève**, qui doit être
  *supprimé*. **C'est la dette du relevé §5.1, désormais chiffrée.**

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

---

## C4 · L2 — Le pilotage du professeur et le moteur du routeur (sandbox, migration du 22/08)

**Ce que le lot porte** : le **cœur des règles de ciblage** *(les cinq règles, les trois phases de
la construction de la semaine, l'espacement des sondes)*, le **moteur d'escalade** *(N1, N2, N3,
leurs compteurs, la désescalade)*, et **quatre écrans du professeur** — les budgets par élève,
l'assignation **en lecture seule**, l'assiduité, et le **panneau des cinq segments** au plan
d'évaluation.

**Où il vit** : `utils/routeur/` *(quinze modules PURS + deux modules serveur)* ·
`app/prof/routeur/` *(les trois écrans du Pilotage)* ·
`app/prof/scriptorium/evaluations/PanneauSegments.tsx` *(le quatrième)* ·
`c4_l2_routeur.sql` *(additive, jouée le 22/08)* · `scripts/recette/routeur-c4l2.mjs` *(la recette
en base, lecture seule)* et `routeur-c4l2-decor.mjs` *(le décor des écrans — il se sème et se
retire)*.

### Ce qui est prouvé — pour ne pas le rejouer

- [x] **C4L2-1 · La migration est en base, et les six interrupteurs n'ont pas bougé.**
  Répétition à blanc d'abord *(corps seul, règle 6)* : **douze drapeaux à `t`**, puis `rollback;`,
  et le retour arrière **vérifié par requête** — dix colonnes absentes, quatre gardes absentes, les
  trois aménagements de C4-L1 intacts, **18 profils intacts**. Puis pour de bon : `COMMIT`, **douze
  drapeaux à `t`**, et `exercices_actif · routeur_actif · competences_affichage_actif ·
  chaine_actif · fabrique_actif · passation_classe_actif` **tous à `f`**. _(22/08.)_
- [x] **C4L2-2 · Les observables requis se lisent AUX FICHES, et sur les six.**
  `01-` §8.3 : « c'est la fiche de la compétence qui le déclare — le routeur lit, il ne décide
  pas ». Le lecteur tourne sur `competences_fiches.contenu` et rend **argumentation 8/9 ·
  expression 7/9 · structure 8/8 · questionnement 7/9 · synthèse 12/13 · connaissance 0/8** —
  exactement ce que chaque fiche déclare, **avertissements : aucun**, y compris le recoupement de
  « les sept premiers ». ⭐ **Et il fallait bien les lire là** : `competences_correspondance` **ne
  coïncide pas** — elle donne un bloc à `reussites`, qui n'est pas requis, et sept à la
  Connaissance, qui n'en a aucun. _(22/08, `routeur-c4l2.mjs` §2.)_
- [x] **C4L2-3 · LE PIÈGE DE LA VACUITÉ se déclenche sur des élèves RÉELS.**
  *Condition de recette nommée au `07-` §1.3.* Sur les **17 élèves** de la base : **2 servis**
  *(T5, tronc commun — budget `tc_seul` 45–60 min, dérivé de sa situation)* et **15 non servis**,
  chacun avec le motif `aucun_parcours`, **jamais en silence**. L'écran des budgets les **nomme en
  tête**, avec leur classe. _(22/08, par requête et à l'écran.)_
- [x] **C4L2-4 · Les cinq segments se dérivent du VRAI calendrier.**
  Sur les deux semestres non archivés : **39 semaines de cours → C = 37, R = 33 → 1 · 3 · 11 · 11 ·
  11**, la somme se refermant sur C. Vu **à l'écran** au panneau du plan d'évaluation, avec ses
  dates réelles *(diagnostic 31/08 · calibration 07/09–21/09 · amorce 28/09–07/12 · stabilisation
  14/12–15/03 · clôture 22/03–31/05)*. _(22/08.)_
- [x] **C4L2-5 · Un calendrier trop court SE SIGNALE SANS RIEN BLOQUER.**
  Le modèle de plan existant pointe vers une année scolaire sans semestre : le panneau rend **C = 0**,
  les cinq segments **« aucune semaine · aucune borne — le routeur n'en invente pas »**, et le
  **signal non bloquant**. L'écran reste entier. _(22/08, à l'écran.)_
- [x] **C4L2-6 · L'écran d'assignation est EN LECTURE SEULE, et l'override se journalise.**
  Aucun geste de validation nulle part. Le retrait a été **joué à l'écran** sur un dépôt réel : le
  dépôt passe à **`retire`** *(jamais `abandonne`)*, et `routeur_decisions.override_prof` porte
  `{ geste: 'retrait', depot_id, motif, par: <id du professeur>, at }` — **origine comprise**,
  comme le §1.5 l'exige. **État remis d'avant après l'épreuve**, vérifié par requête. _(22/08.)_
- [x] **C4L2-7 · L'assiduité : les deux agrégats, la frise et le tableau.**
  Décor semé sur T5 *(trois semaines, trois distributions)* : la **frise à trois couleurs** rend
  `vert · vert+orange · vert+rouge`, l'**avertissement de classe** part — « T5 n'a pas fait sa
  semaine : 1 élève sur 2 n'ont pas rendu les 75 % attendus, quand le contrat en demande 75 % de
  faites » —, et le **tableau dit qui** *(Sacha 100 %, l'autre 0 %)*. ⭐ **Les deux seuils se lisent
  EN CONFIGURATION**, pas en dur : `assiduite_seuil_semaine_faite` **0,75** et
  `assiduite_borne_basse_frise` **0,50**, et l'écran les affiche tels qu'il les a lus. **Décor
  retiré**, base vérifiée à **0 ligne**. _(22/08.)_
  > ⚠️ **CETTE ENTRÉE A ÉTÉ COCHÉE SUR UN DÉCOR — et C4-L13 la rend enfin vraie** *(24/08)*.
  > Ce qu'elle prouvait, c'était que **l'écran sait lire** ; elle ne pouvait rien prouver de la
  > **collecte**, qui n'existait pas : le seul écrivain d'`assiduite_hebdo` du dépôt était
  > `routeur-c4l2-decor.mjs`, qui semait `exercices_assignes: 4` et des minutes en dur. Les deux
  > agrégats **se calculent désormais depuis des dépôts réels** — voir `C4L13-1` à `C4L13-4`. ⛔ Et
  > le décor **ne peut plus être pris pour une mesure** : voir `C4L13-5`.
- [x] **C4L2-8 · Les lectures sont paginées et confrontées au décompte.**
  Le défaut qui a coûté C4-L8-bis ne se répète pas : `lirePagine` pagine par 1000, **ordonne sur une
  clé unique** et **lève `LectureTronquee`** quand le décompte `count: 'exact'` diffère. Les six
  lectures du lot passent par lui. _(22/08.)_
- [x] **C4L2-9 · Les règles sont éprouvées — 251 tests neufs, `npm test` 731/731.**
  Les trois cas de l'**Annexe A** du `01-` sont des tests qui passent : « Le canal bouché » *(R1 en
  exercices, seuil du Questionnement franchi)*, « La stagnation instructive » *(3 mesures plates →
  N1, vf requise, delta faible → N2 réception)*, « Le fort au mauvais jour » *(plafond D+2 = B,
  bute, **aucun drapeau**)*. _(22/08.)_
- [x] **C4L2-10 · `routeur_actif` reste à OFF, et les écrans ne s'y ferment pas.**
  « Le routeur prend ses couches à l'allumage **sans rien changer au schéma ni aux écrans** »
  *(`07-` §5)*. Les quatre écrans se visitent, et le bandeau dit que le moteur est éteint. _(22/08.)_

### Ce qui reste à jouer en recette

- [ ] ⚠️ **C4L2-11 · L'ESCALADE SUR DONNÉES RÉELLES — bloquée par la clause granulaire, pas par ce
  lot.**
  > ⭐⭐ **AMENDÉ PAR `C4-L12` (24/08) — LE MOTIF A ENCORE CHANGÉ, ET DEUX OBSTACLES SUR TROIS SONT
  > TOMBÉS.** *(1)* **`MANIFESTE_INSTRUMENTS` ne porte plus `ouverte: false` sur personne** : les
  > **six** sont à `true` depuis `C4-L10` — vérifié par comptage sur le fichier dérivé, 6 `true`,
  > 0 `false`. Le paragraphe ci-dessous est donc **périmé sur ce point**, et la section correspondante
  > du `utils/routeur/LISEZ-MOI.md` a été corrigée. *(2)* **L'ÉCRIVAIN EXISTE** :
  > `ecrireLEtatApresMesure()` appelle `degreAppele`, `desescalade`, les deux compteurs,
  > `deplacementsDeMasse` et `reporterAuGrainSuperieur`, et écrit `competences_escalade` /
  > `competences_montee` — la désescalade **retire** la ligne d'état, la trace vivant à
  > `routeur_decisions.etat_escalade`. ⛔ **CE QUI RESTE EST EXACTEMENT CE QUE CETTE ENTRÉE DIT
  > DÉJÀ, ET RIEN D'AUTRE : une fenêtre d'évidence remplie** — quatre mesures d'une même compétence
  > chez un même élève —, **au segment 3** *(« les compteurs ne démarrent qu'au segment 3 »)* et
  > **hors `profil_provisoire`**. `degreAppele` refuse tout seul avant cela, et il le DIT.
  > *(= `C4L12-16`.)* Le « fait quand » demande qu'« une escalade se déclenche, s'applique et se désescalade sur
  des données réelles ». Elle **ne le peut pas aujourd'hui** : le taux de réussite d'un observable
  se lit contre le **seuil de sa fiche**, que `derive-instruments.py` verse — et
  `MANIFESTE_INSTRUMENTS` porte **`ouverte: false` sur les six**, faute de fiche *versée et bancée*.
  Sans instrument, `statutDeLaMesure` rend `sans_objet`, le taux vaut `null`, et « un observable
  sans taux ne se classe pas ». **C'est la clause granulaire du `07-` §2** — « une fiche seulement
  déposée bloque *sa* compétence, pas le lot ». Les règles sont écrites et éprouvées *(34 tests sur
  l'escalade seule)*. ⭐ **LA PREMIÈRE MOITIÉ EST LEVÉE le 22/08** : l'Expression est dérivée et
  branchée, son instrument porte ses NEUF seuils de réussite, et une mesure réelle écrit ses neuf
  observables. **Condition de reprise restante : assez de mesures pour remplir une fenêtre
  d'évidence** — quatre mesures sur la compétence —, **plus un statut `evaluee`** pour que le routeur
  la cible (« le routeur ne cible que les `evaluee` »).
  ⚠️ **AMENDÉ PAR C4-L7 (24/08) — LES DEUX MOITIÉS SONT OUVERTES, ET LA SECONDE N'A PAS ÉTÉ JOUÉE :
  LE CHIFFRE EST DIT.** Le statut `evaluee` est posé sur les six depuis le 23/08 : **ce n'est plus
  lui qui manque**. Ce qui manque est la **fenêtre d'évidence** — *quatre mesures sur la même
  compétence, pour le même élève*. ⭐ **Le chiffrage, avant de décider** : la traversée de C4-L7
  mesure **3 appels par chaîne froide à une compétence** *(p1 + p2 + retour, constaté par requête sur
  `api_couts`)* — donc **quatre dépôts réels ≈ 12 appels**, plus le décor. ⛔ **Décision de cette
  séance : NON JOUÉ.** Deux motifs, et ils se disent. *(a)* Ce n'est pas une clause du « fait quand »
  de C4-L7. *(b)* Surtout : **l'escalade qu'on observerait serait déclenchée par quatre mesures que
  la recette aurait FABRIQUÉES sur une copie qu'elle a écrite** — ce ne serait pas « des données
  réelles » au sens de l'énoncé, ce serait un décor à quatre étages. **Condition de reprise
  inchangée quant au fond, reformulée quant au motif : quatre mesures sur la même compétence pour le
  même élève — et la question de savoir si des mesures de recette y suffisent est une décision de
  Louis, pas de la session Code.**
- [x] **C4L2-12 · Une semaine réellement remplie par le moteur.** Aujourd'hui **zéro compétence est
  `evaluee`** *(les deux qui existent sont `mesuree_silencieusement`)* : R0 n'en laisse passer
  aucune, et la semaine entière revient à la **voie mixte** — « un régime normal, pas un repli », et
  « une semaine pleine en voie mixte est une semaine conforme ». **Condition de reprise : un statut
  `evaluee` posé à la fabrique**, plus des instances conçues à servir.
  ⚠️⚠️ **SA CONDITION EST RÉÉCRITE PAR C4-L7 (24/08) — LE MOTIF A CHANGÉ SOUS ELLE, ET LE TEXTE
  CI-DESSUS MENT DEUX FOIS.** *(1)* « Aujourd'hui zéro compétence est `evaluee` » est **faux depuis
  le 23/08 au soir** : **les SIX le sont**, posées par Louis à l'écran de la fabrique
  *(`competences_statut_recette`, 21:18–21:19, re-constaté par requête le 24/08)*. *(2)* « Condition
  de reprise : un statut `evaluee` posé à la fabrique » **n'est donc plus ce qui bloque**.
  ⛔ **CE QUI BLOQUE EST LA LETTRE.** `filtreR0` exige **DEUX** conditions —
  `statutRecette === 'evaluee'` **ET `lettre !== null`** *(`utils/routeur/ciblage.ts:62`)* — et
  `competences_niveaux.lettre` **n'a aucun écrivain dans tout le dépôt** *(balayage de `utils/`,
  `app/` et `scripts/` : tous les accès sont des `select` ; **0 lettre sur 102 lignes d'état**,
  vérifié par requête)*. **La semaine revient donc entière à la voie mixte par défaut de LETTRE, non
  par défaut de statut** — et *« une semaine pleine en voie mixte est une semaine conforme »* reste
  vrai. ⭐ **NOUVELLE CONDITION DE REPRISE, NOMMÉE : `C4-L12` — « Ce qui écrit ce que le routeur
  décide », dont l'écriture de la lettre est le QUATRIÈME geste, échéance AVANT LE SEGMENT 2.**
  *Le second verrou tombe dans le même lot : `poserLaSemaine` n'a aucun appelant hors de ses tests
  et son `candidatsPour` aucun producteur.* ⛔ **Cette entrée n'est donc PAS cochée par C4-L7 : elle
  change de motif, pas d'état.** *(Voir `C4L7-2`.)*
  ⭐⭐ **LEVÉE PAR `C4-L12` LE 24/08, ET MESURÉE — voir `C4L12-1`.** Le lot a écrit le vivier,
  l'orchestrateur, la persistance **et la lettre** : la recette pose **6 exercices sur deux élèves
  réels, 55 min sous un plafond de 60, au segment 2**, chacun avec sa cible `evaluee`, sa règle, sa
  borne amont et son état d'escalade. ⛔ **La semaine n'est donc plus vide, et elle ne revient plus
  entière à la voie mixte.** ⚠️ **Ce qui la borne désormais n'est ni le statut ni la lettre, mais LE
  VIVIER** : la couche 4 ne sert que les instances rattachées à un cours **déjà vu**, dans le parcours
  de l'élève, et sous sa position de lecture — et le bilan **nomme lequel des trois filtres a mordu**.
  **Cochée.**
- [x] ⚠️⚠️ **C4L2-15 · RIEN N'ÉCRIT LA DÉCISION DU ROUTEUR — constat déposé par C4-L11 (23/08),
  ET IL N'EST PAS TRANCHÉ QUE CE SOIT UN RESTE DE CE LOT.** Le moteur est écrit et éprouvé, en
  fonctions pures ; **rien ne le fait tourner et rien ne persiste ce qu'il rend** — 0 ligne de
  `routeur_decisions`, 0 dépôt sur 25 qui en porte une, et aucun appelant de `poserLaSemaine` hors
  des tests. ⭐ **L'entrée de C4-L2 au `07-` §2 ne promet PAS cet écrivain** : elle porte les règles,
  le moteur d'escalade et les écrans, dont l'assignation **« en lecture seule »**. **Le constat est
  déposé ici parce que c'est là qu'un `grep` le retrouvera ; le destinataire est une question pour
  Louis**, pas une décision de session Code. *Voir `C4L11-8` pour les pièces.*
  ⭐⭐ **TRANCHÉ LE 23/08 — DÉCISION DE LOUIS : L'ÉCRIVAIN A SON LOT, ET CE N'EST PLUS UN RESTE DE
  CELUI-CI.** La question posée par cet item était le **destinataire** ; elle est fermée. **Le geste
  part à `C4-L12` — « Ce qui écrit ce que le routeur décide »** *(`07-` §2, v2.42)* : le **vivier**
  et ses trois filtres *(parcours, cours vu, non-spoiler — aucun des trois n'existe)*, l'**orchestrateur
  par élève**, la **persistance de la décision** *(`cible_retenue`, `sondes_retenues`, `etat_escalade`,
  `borne_amont`, `origine = 'routeur'`, `routeur_decision_id`)* et l'**écriture de la lettre**, que la
  chaîne délègue nommément et que personne ne fait. **Échéance : AVANT LE SEGMENT 2** — le segment 1
  est hors routage, le routeur ne s'allume qu'au 2 *(`01-` §4, couche 1)*. ⚠️ **Les gestes manquants ont été
  recomptés sur pièces le 23/08 : ils sont DOUZE** — et l'un d'eux n'existe **à aucun étage**, pas
  même en règle pure : la **recombinaison en 2-3 propositions iso-durée** et le choix de l'élève
  *(`01-` §4, couche 4 ; `routeur_decisions.propositions_iso_duree` et `choix_eleve`, zéro ligne de
  code)*. ⭐ **Et le verrou du statut est tombé le même soir** : Louis a posé les six compétences à
  `evaluee`. ⚠️ **Mais `filtreR0` en exige DEUX** — `evaluee` ET `lettre !== null` — et
  `competences_niveaux.lettre` n'a aucun écrivain. **Ce second verrou est DANS `C4-L12`**, c'est son
  quatrième geste. *La condition de reprise de `C4L2-12` — « un statut `evaluee` posé à la
  fabrique » — est donc DATÉE D'AVANT le 23/08 au soir, et ce n'est plus elle qui bloque.* ⭐ **Ce qui reste ici** :
  rien.
  ⭐⭐ **ET LE GESTE EST JOUÉ — `C4-L12`, 24/08.** L'écrivain vit à **`utils/moteur/`** — le dossier
  `utils/routeur/` **n'écrit toujours rien**, et c'est vérifié —, il **se greffe sur le déclencheur de
  `C4-L13`** sans en ouvrir un second, et la chaîne froide l'appelle une fois ses mesures écrites.
  **`routeur_decisions` n'est plus vide**, `routeur_decision_id` **est écrit**, et la lettre a son
  écrivain. ⚠️ **Les douze gestes recomptés le 23/08 sont faits, y compris celui qui n'existait à
  aucun étage** : la **recombinaison en 2-3 propositions iso-durée** est construite et journalisée —
  `choix_eleve` reste NULL, *« la place qu'y prend la préférence recueillie n'est pas tranchée »*, et
  la main de l'élève demande un écran qui n'est pas de ce lot. **Cette entrée est close.** *Les compteurs d'assiduité, qui souffraient du même défaut d'écrivain, partent à `C4-L13` —
  échéance À LA RENTRÉE, parce qu'« un semestre ne se recompte pas après coup ».*
- [ ] **C4L2-13 · Le smoke prof des quatre écrans, connecté comme professeur.** Les écrans ont été
  vus en session serveur ; le parcours complet *(régler un budget, noter un recueil, naviguer les
  semaines)* reste à faire à la main.
- [ ] **C4L2-14 · La préférence de l'élève — LE CONTENU MANQUE, et il ne s'invente pas.** Le recueil
  est posé *(date + réponse libre)*, et l'écran **le dit au professeur**. ⚠️ **Ni la question ni ses
  valeurs ne sont écrites dans les sources**, et **sa place dans le ciblage n'est pas tranchée** :
  aucune règle du lot ne la lit. **Ce n'est pas une recette à jouer, c'est une décision à prendre.**

## C4 · L3 — Le déroulé de l'élève, à la maison (sandbox, migration du 22/08)

_Section ouverte le 22/08 depuis `RELEVE_C4_L3_2026-08-22.md`, à la clôture du lot._

**Ce que le lot porte** : les **six temps à l'écran, branchés sur le `regime_v1vf`** *(dérivé du
cran **plus l'escalade**, jamais gravé)*, le **blocage du collage** sur ses trois vecteurs et la
**journalisation de chaque tentative**, les **horodatages de tout le déroulé**, les **trois gestes
de la remise**, la phase **« se juger »** avec sa garde `indetermine`, la **contestation à
identifiants stables**, le **retour final** — et **la contrainte d'interface qui n'est pas
cosmétique** : le champ de rédaction **encourage et préserve le découpage en paragraphes**.

**Où il vit** : `utils/deroule/` *(11 modules PURS + 6 serveur)* · `components/deroule/` *(7
composants)* · `app/deroule/actions.ts` · `app/eleve/modules/codex/exercice/[depotId]/page.tsx` ·
`c4_l3_deroule.sql` *(additive, jouée le 22/08)* · `scripts/recette/deroule-c4l3.mjs` *(la recette
en base — elle sème et elle retire)*.

⚠️ **Les six interrupteurs sont à OFF**, re-constatés après la migration et après la recette :
`exercices_actif`, `routeur_actif`, `competences_affichage_actif`, `fabrique_actif`, `chaine_actif`,
`passation_classe_actif`. L'écran naît derrière **`exercices_actif`**, et **ce lot n'en détourne
aucun autre**.

_`npx tsc --noEmit` et `eslint` sur les fichiers du lot : **rien**. **220 tests neufs, 0 échec**.
`scripts/recette/deroule-c4l3.mjs --sans-appel` : **88 contrôles, 87 passés, 0 échoué, 1 non
éprouvé (⊘)**, joués **par le même code que les écrans**, décor semé puis **retiré** (base revenue à
son état d'avant, **vérifié par requête table par table**)._

⚠️ **`npm test` complet porte UN échec qui n'est PAS de ce lot** : `derive-instruments --verifie`
DIVERGE parce que le `07-` a bougé pendant la séance *(2.25 → 2.27 par une session parallèle, puis
2.28 par nos amendements)*. **Le gabarit Calame n'a pas changé** — c'est la ligne VERSION du dérivé
qui diverge. La re-dérivation appartient à qui a fait bouger la source.

### Ce qui est prouvé — pour ne pas le rejouer

- [x] **C4L3-1 · La migration est en base, et les six interrupteurs n'ont pas bougé.**
  Répétition à blanc d'abord *(corps seul, règle 6)* : **dix drapeaux à `t`**, puis `rollback;`, et
  le retour arrière **vérifié PAR REQUÊTE** — cinq colonnes absentes, trois gardes absentes, la
  fonction absente, **`collages_bloques` de C4-L4 intacte**, **25 dépôts et 2 démonstrations
  inchangés**. Puis pour de bon : `COMMIT`, **dix drapeaux à `t`**, les six interrupteurs à `f`.
  _(22/08.)_
- [x] **C4L3-2 · La doctrine rend IDENTIQUE sur les ONZE tables, les empreintes et la fixture.**
  `derive-doctrine.py --verifie` **puis son SQL joué par `psql`** *(le script ne vérifie rien tout
  seul : il génère)*. `SOURCES : IDENTIQUE` · `FIXTURE : IDENTIQUE` · les onze verdicts, dont
  **`exercices_routes` 3264** et **`exercices_consignes_isolees` 336**. ⚠️ `exercices_types_crans`
  **n'est couverte par aucun verdict** — ses 117 lignes comptées à la main. _(22/08.)_
- [x] **C4L3-3 · ⭐⭐ LES RETOURS À LA LIGNE ARRIVENT INTACTS JUSQU'À CE QUE L'EXTRACTION REÇOIT.**
  Une copie de **quatre paragraphes en `\r\n\r\n`** — ce qu'un formulaire HTML produit. Un découpage
  qui ne normalise pas y compte **1 bloc** *(défaillance forte)* ; en base, **0 `\r`** et
  **`blocs()` = 4** ; **l'indentation de deux espaces a survécu** *(pas de `trim()` en son sein)* ;
  et **`lireContexte().productionV1` — ce que la chaîne lit — porte 4 blocs**, `productionVf` aussi.
  _(22/08, par requête.)_
- [x] **C4L3-4 · Chaque transition est horodatée, par requête.** Les **cinq** horodatages posés et
  non nuls, **ordre chronologique strict, 0 inversion** ; `ouvert_at` **ne se réécrit pas** au second
  appel *(le chronomètre ne repart pas)* ; `juger_debut_at` et `juger_fin_at` **distincts** —
  contrairement au canal classe, où ils sont posés au même instant. _(22/08.)_
- [x] **C4L3-5 · Les trois vecteurs de collage sont journalisés, et RIEN ne part à l'intégrité.**
  Trois entrées en base, chacune avec son `moyen` et son `at` ; `integrite_signalements` **13 avant,
  13 après**. La colonne, la RPC atomique et le module pur sont **ceux de C4-L4** : « un lot le
  réutilise, il n'en crée pas un second ». _(22/08.)_
- [x] **C4L3-6 · Les trois gardes de lecture tiennent.** Dépôt d'un autre élève → `null` ; exercice
  `lieu = classe` → `null` ; dépôt **`retire`** → `null` — ⭐ **le filtre que personne ne posait**
  *(piège 41)* —, avec un **témoin au statut `assigne`** qui prouve que le `null` vient bien du
  filtre. État remis d'avant. _(22/08.)_
- [x] **C4L3-7 · ⭐ LE MÊLAGE DES CANDIDATS — la décision de Louis, tenue.** Sur douze dépôts
  simulés, la `reponse_attendue` tombe aux rangs `[1,2,2,1,2,1,2,1,2,1,1,1]` : **elle n'est plus la
  dernière à tous les coups**. Et le mêlage est **STABLE** sur `(dépôt × cas)` — un rechargement rend
  le même ordre. L'aperçu du professeur **n'a pas été touché** *(piège 38)*. _(22/08.)_
- [x] **C4L3-8 · La paire : deux cas, deux crédences, et la correction servie ENTRE LES DEUX.**
  `correctionDuPremierCas` est **`null` avant la crédence du cas 1**, servie après — *sans quoi
  l'élève déclarerait sa sûreté en connaissant la réponse*. La crédence du cas 2 **n'efface pas**
  celle du cas 1. En base : `jetons` **et** `index_correct`, **les deux clés que la chaîne lit**.
  _(22/08.)_
- [x] **C4L3-9 · L'ordre des trois gestes est MÉCANIQUE, pas espéré.** La remise **refuse** sans
  restitution à chaud, **refuse encore** sans conditions, **passe** une fois les deux posées. Et
  `confiance_declaree` **reste NULL** : 0 compétence `evaluee`, donc le geste **ne se présente pas**
  — *la fiche §6, flux 2, et ce n'est pas une panne*. _(22/08.)_
- [x] **C4L3-10 · La file : idempotente, et le job REPOSÉ quand la chaîne est fermée.**
  `cle_idempotence` = `<depotId>:mesure_v1` ; **un seul job après deux déclenchements** *(le
  double-clic ne paie pas deux mesures)* ; sous `chaine_actif` à OFF, le job revient
  **`en_attente`** et **sa tentative lui est rendue** (`tentatives = 0`). _(22/08.)_
- [x] **C4L3-11 · Le régime se dérive du cran PLUS l'escalade.** Escalade N2 posée en base sur
  `(argumentation × garant_present)` → régime **`plein`**, `vfRequiseParEscalade = true`, **six
  temps** ; escalade retirée → **`sans_vf`**, **quatre temps**, aucune échéance calculée. ⭐ **Et une
  PAIRE reste une paire sous escalade** — un test le tient. _(22/08.)_
- [x] **C4L3-12 · ⚠️ LA NON-RÉGRESSION `cible_primaire`.** La recette a trouvé que le lot lisait
  **une colonne qui n'existe pas** : PostgREST faisait échouer la requête **entière** (`42703`), donc
  `lireDepotMaison` rendait `null`, et **l'écran était mort pour tous les élèves** — avec pour seul
  symptôme « exercice introuvable ». **Corrigé en séance** : la cible se lit sur
  `routeur_decisions.cible_retenue`. La recette vérifie désormais **sur pièce** que le SELECT ne la
  nomme plus, **et par appel** que `lireDepotMaison` rend un dépôt maison **réel** de la sandbox.
  _(22/08.)_
- [x] **C4L3-13 · Le décor est retiré, et la base est revenue à son état d'avant.** Onze tables
  comptées **avant et après**, identiques ; interrupteurs remis exactement comme trouvés ; **aucune
  classe `RECETTE-C4L3%` ne survit**. _(22/08.)_

### Ce qui reste à jouer en recette

- [x] ⭐⭐ **C4L3-14 · LE RETOUR FINAL QUI CITE UN PROGRÈS RÉEL — FAIT LE 23/08, ET LE PROGRÈS EST
  RÉEL.** *(L'énoncé d'origine suit, il n'est pas retouché.)* La **double condition restante est
  levée** : un dépôt porte enfin **DEUX squelettes** — `scripts/recette/vf-c4l3.mjs`, écrit pour ça,
  sur l'exercice **maison cran 2** (`cd2fe916`, régime `plein`) assigné à la classe **Test** ;
  **17 contrôles, 0 échec, 6 appels payés**. ⭐ **Le retour final cite un progrès QUE L'ÉLÈVE A
  VRAIMENT FAIT** : *« Tu as ajouté quelque chose que ta v1 n'avait pas : tu écris « Or si une idée
  était innée […] ». […] et il n'était pas là avant. »* ⭐⭐ **C'est le contrepoint exact de l'item 49
  du registre** — où le retour avait FABRIQUÉ un passé faute d'état antérieur. Ici la comparaison a
  deux squelettes réels : **elle dit vrai**. ✅ Au passage : `delta_v1_vf` est NULL **et son alerte
  tombe** — la clause requalifiée de C4-L7 est donc éprouvée sur un run réel, pas seulement écrite ;
  la vf **n'écrit aucune mesure** (piège 16) ; `chaine_actif` ouvert le temps de deux appels et
  **re-constaté à OFF**. ⚠️ **Reste la relecture RR1-RR4 formelle** (`C4L5-1bis`) : les deux retours
  ouvrent bien sur une **réussite citée** avec son `ancrage.citation`, et aucun ne nomme d'observable,
  de palier ni de note — mais c'est une lecture de séance, pas un contrôle automatique.
  *(énoncé d'origine)* ⚠️ **C4L3-14 · LE RETOUR FINAL QUI CITE UN PROGRÈS RÉEL — bloqué par la clause granulaire,
  pas par ce lot.** Le « fait quand » l'exige, et il *« suppose un retour final **engendré**, sur
  deux squelettes réels — des textes posés à la main ne citent aucun progrès »*. **La chaîne est
  jouée et ne peut rien engendrer** : `MANIFESTE_INSTRUMENTS` porte `ouverte: false` sur les six
  compétences, faute de fiche *versée et bancée* ; `traiterDepot` n'écrit ni squelette, ni mesure,
  ni retour. **Aucun texte n'a été posé à la main pour faire semblant.** *Même mur que C4L2-11.*
  ⭐ **LE MUR EST TOMBÉ le 22/08 (C4-L10)** : `traiterDepot` écrit désormais squelette et mesure sur
  l'Expression. **Condition de reprise restante — et elle est double** : un dépôt en **version
  finale** (le retour final se compare à DEUX squelettes), et une copie **portant une réussite au
  relevé**, sans quoi la règle 2 du gabarit refuse le retour.
- [x] ⚠️ **C4L3-15 · « SE JUGER » ET LA CONFIANCE DE REMISE — zéro compétence `evaluee`.** Les deux
  flux ont leur troisième condition fermée sur `evaluee`, et **les 34 lignes de
  `competences_niveaux` sont toutes `mesuree_silencieusement`**. Le code est écrit et testé *(la
  garde `indetermine` et ses trois cas compris)* ; l'écran refuse proprement. **Condition de
  reprise : un statut `evaluee` posé à la fabrique** — ce qui suppose la fiche, la recette, et la
  correspondance *(les trois sont là ; seul le choix du professeur manque)*.
  ✅ **AMENDÉ PAR C4-L7 (24/08) — LE CHOIX DU PROFESSEUR EST FAIT, LES DEUX FLUX SONT SERVIS.**
  Les six compétences sont `evaluee` (23/08, 21:18–21:19), lues par `utils/statut-recette.ts` et par
  lui seul. ⚠️ **Le chiffre de l'énoncé est périmé de deux façons** : ce ne sont plus « 34 lignes de
  `competences_niveaux` toutes `mesuree_silencieusement` » — la colonne **n'existe plus** sur cette
  table *(`c4_statut_recette_retrait.sql`)*, et le statut vit désormais sur
  `competences_statut_recette`, **une ligne par compétence**. Les deux flux sont servis pour de vrai :
  voir `C4L4-5` et `C4L4-6`, cochés le même jour. *(`traversee-c4l7.mjs --classe`, section A6.)*
- [ ] ⚠️ **C4L3-16 · LA COMPARAISON DE « SE JUGER » NE REND AUCUN ACCORD — il manque un champ à la
  SOURCE.** `competences_correspondance` porte quatre colonnes et **aucune ne dit quelle réponse
  vaut « réussi »** ; le sens **varie ligne à ligne** *(« aucune » sur `jointure_presente`, « non »
  sur `charniere_formule`, « oui » sur `plan_tenu`)*. La comparaison **consigne les deux côtés** et
  rend `accord: null` — *collecter d'abord, convertir ensuite*. **Ce n'est pas une recette à jouer,
  c'est une décision de source** : une cinquième colonne aux sections de correspondance des sept
  fiches. *Le troisième cas de la garde `indetermine`, lui, est actif dès aujourd'hui.*
- [ ] **C4L3-17 · Le smoke élève à l'écran, dans un vrai navigateur.** Rien n'a été vu à l'écran :
  la séance a tout éprouvé **par requête et par appel**. À jouer, `exercices_actif` ouvert, sur un
  dépôt maison réel : les six temps, **le collage refusé sur les trois vecteurs au clavier réel**
  *(`Cmd+V`, clic droit, glisser-déposer avec un vrai `DataTransfer` — comme C4L4-9)*, le compteur
  de paragraphes, la micro-question de dépassement, la crédence au doigt sur téléphone, et **le
  rendu du gras des consignes**. ⚠️ **Règle d'or : un vrai Chrome, jamais l'aperçu embarqué.**
- [ ] **C4L3-18 · La parade à l'imitation de surface ne mord sur rien.** `cours_declares` et
  `notions` existent sur les démonstrations, la parade les lit — **et le format d'import ne les
  connaît pas** *(`verifie-import.ts` : `demonstration: new Set(['id','competence','grain','theme',
  'forme','corps'])`)*. Les **deux** démonstrations en base sont donc non déclarées : elles sont
  **servies, et le professeur est averti** *(décision du PO, 22/08)*. **Adressé à C4-L8** : deux
  clés au `08-FORMAT_IMPORT.md` §5 bis et à son contrôle.
- [x] ⭐ **C4L3-19 · La file professeur des contestations sur citation absente n'a pas d'écran.**
  Le lot **détecte**, **marque en base** (`citation_absente`) et laisse une **trace serveur** ; il
  **n'invente aucune file**. ⚠️ C'est **l'exigence d'examen humain de la loi** *(`06-` §2 et §7)*,
  pas un confort. **Adressé à C6-L1.** ➜ ✅ **LEVÉE PAR C6-L1 LE 28/08.** L'écran est le **bloc
  « Ce qui demande votre attention »** de l'onglet Compétences du profil de classe. La file
  n'attend **aucune répétition** *(elle est distincte du drapeau des contestations répétées,
  qui, lui, a son seuil réglable)*, elle montre **le point du retour PUBLIÉ** — jamais le
  squelette —, et elle **se traite** : `marquer_contestation_traitee()` pose `traite_at` dans
  l'acte, **en une instruction**, et l'acte quitte la file au rechargement. **Éprouvé par
  exécution** — `scripts/recette/couture-c6l1.mjs`, section C : acte semé, vu en file, examiné,
  constaté en base, **rejeu idempotent**, absent au rechargement.
- [x] ⚠️ **C4L3-20 · `exercices.cran` porte DEUX formes en base — 6 lignes au CODE, 5 au NUMÉRO.**
  La colonne est un `text` **sans CHECK**. `utils/deroule/vue.ts` lit par le **code** ;
  `utils/chaine/contexte.ts` fait `Number(cran)` et lit par le **numéro** — sur une instance au code,
  il part avec `cran=eq.NaN` *(400 avalé)* et rend `cran`, `cranCode`, `regimeV1vf`, `servable` et
  `patronProduction` **tous vides**. **Hors manifeste de C4-L3, non corrigé.** **À trancher au lot
  de correctifs : quelle forme fait foi ?**
- [ ] **C4L3-21 · L'encart langue ne s'affiche jamais.** *N* se compte **depuis le relevé de langue
  que la chaîne produit**, et **la chaîne n'en produisait aucun** — le champ `orthographe` vit dans
  la fiche Expression, qui n'était pas ouverte. Le chemin de lecture est écrit et testé ; **l'absence
  était le cas nominal**, et ce n'est pas une panne. ⭐ **LA CONDITION EST LEVÉE le 22/08 (C4-L10)** :
  l'Expression est branchée, la chaîne écrit un squelette dont le relevé porte `orthographe`, et
  l'encart a de quoi se remplir **sans qu'une ligne d'écran ait été retouchée**. **Condition de
  reprise restante : le smoke élève à l'écran**, sur un dépôt dont le relevé porte des fautes —
  celui de la recette du 22/08 en déclarait **zéro**, et zéro n'est pas `null`.
  ⚠️ **AMENDÉ PAR C4-L7 (24/08) — TOUJOURS PAS DE FAUTES, ET LE MOTIF EST MAINTENANT CHIFFRÉ.** La
  traversée de C4-L7 a fait mesurer l'Expression sur **deux copies réelles** *(voie classe)*, écrites
  pour porter une argumentation défendable — donc **sans fautes d'orthographe volontaires**. Le
  relevé de langue est là, l'encart a de quoi se remplir, mais *N* reste à **zéro**, « et zéro n'est
  pas `null` » : **l'encart ne s'affiche donc toujours pas, et c'est le cas nominal**. ⛔ **Ce n'est
  pas une panne, c'est un décor qui manque.** ⭐ **Condition de reprise, PRÉCISÉE : une copie de
  recette écrite AVEC DES FAUTES** — le décor n'en porte aucune aujourd'hui —, puis le smoke élève à
  l'écran. *Aucun des dix-neuf scripts de `scripts/recette/` n'en sème.*
  ✅ **COCHÉ PAR C4-L11 (23/08) — L'ARBITRAGE EST RENDU : LE NUMÉRO FAIT FOI.** Recompté en base avant de trancher : **6 au code, 5 au numéro** — le chiffre tenait. Quatre constats l'ont tranché : `exercices_crans.cran` est déjà l'`int` **clé primaire** de la table des crans ; **trois** des quatre tables de doctrine le portent en entier sous `check between 1 and 9` ; l'échelle est **ordinale** ; et ⭐ **tous les chemins d'écriture réels écrivaient déjà le numéro** — les six lignes au code venaient **toutes des décors de recette**. `c4_l11_cran_forme.sql` convertit *(en joignant `exercices_crans`, jamais une table de correspondance tapée)*, passe la colonne en `integer` et pose un `CHECK` de **forme** qui **tolère `NULL`** ; `exercices_types_crans.cran` suit, **par son dériveur**. ⛔ `exercices_cran_chk` **n'est pas réintroduite** — le drapeau de C4-L9 et le trigger sont re-constatés intacts. Éprouvé **par l'échec** : un cran `42` est refusé (`23514`), l'ancienne forme aussi (`22P02`). L'arbitrage est écrit au `07-` §1.1 et au `utils/cran.ts`.

---

## C4 · L9 — La conception des examens diagnostiques (sandbox, migration du 22/08)

_Section ouverte le 22/08 depuis `RELEVE_C4_L9_2026-08-22.md`, à la clôture du lot._

**Ce que le lot porte** : **toute ancre naît là**. Les **deux types d'examen diagnostique**
deviennent **concevables** *(l'essai dans Codex, l'explication de texte dans Aletheia)* ; le
professeur **voit ce qu'il a à concevoir dans son module**, avec sa date et son retard ; il conçoit
— un **sujet** dans Codex, un **texte** dans Aletheia — **sans qu'aucune date lui soit demandée** ;
l'instance naît avec **`lieu = classe`**, la **ligne de plan passe conçue**, et **les deux se
retrouvent l'une l'autre** ; au lancement, **l'élève voit son signal** et entre **par son module**.

**Où il vit** : `utils/examens/` *(4 modules — 2 purs, 2 serveur)* · `components/examens/`
*(3 composants)* · `app/prof/examens-diagnostiques/actions.ts` ·
`app/prof/{codex,aletheia}/examen-diagnostique/[planifieId]/page.tsx` ·
`c4_l9_examens_diagnostiques.sql` **et `c4_l9_bis_examen_produire_macro.sql`** *(jouées le 22/08)* ·
`scripts/recette/examens-c4l9.mjs`.

⚠️ **Les six interrupteurs sont à OFF**, re-constatés **après la migration, après la recette, et
après le smoke** : `exercices_actif`, `routeur_actif`, `competences_affichage_actif`,
`fabrique_actif`, `chaine_actif`, `passation_classe_actif`. L'écran de conception vit derrière
**`fabrique_actif`** *(montré, jamais fermant — le régime de toute la fabrique)*, et le signal de
l'élève derrière **les deux portes de C4-L4** *(`exercices_actif` **et** `passation_classe_actif`,
le plus fermé gagne)*. **Ce lot n'en crée aucun septième et n'en détourne aucun.**

_`npx tsc --noEmit` et `eslint` sur les fichiers du lot : **rien**. **18 tests neufs, 0 échec**
(`npm test` : 981 tests, 980 passés). `scripts/recette/examens-c4l9.mjs` : **138 vérifications, 0
échec**, jouées **par le même code que les écrans**, décor semé puis **retiré** (base revenue à son
état d'avant, **vérifié par requête**)._

⚠️ **`npm test` complet porte UN échec qui n'est PAS de ce lot**, et c'est **le même qu'à C4-L3** :
`derive-instruments --verifie` DIVERGE parce que le `07-` a bougé. **Vérifié cette fois-ci à
l'octet** : le gabarit Calame est **identique**, seuls `empreinte_source` et `version_source`
*(2.25 → 2.28)* diffèrent. **La re-dérivation appartient à qui a fait bouger la source.**

⚠️ **`derive-doctrine.py --verifie` dit `SOURCES : DIVERGE — 06-Palimpseste.md`**, et **les onze
tables sont IDENTIQUES** — joué **avant et après** le geste de ce lot, sans changement. Le `06-` a
bougé le 22/08 ; ce qu'il alimente *(`demonstrations_formes`)* est inchangé. **Hors périmètre de ce
lot, non corrigé.**

✅ **LE DÉCOR DE RECETTE A ÉTÉ RETIRÉ**, une fois les deux smokes joués *(22/08)* — **14 dépôts,
3 instances et 4 lignes de plan** *(`note = 'RECETTE C4-L9'`)*, dans l'ordre imposé par le
`on delete restrict` : les dépôts, puis les instances, puis les lignes de plan. ✓ **Rien de dérivé
n'y pendait** — zéro squelette, zéro métacognition, zéro mesure —, et **la base est revenue à son
état d'avant la séance, vérifié par requête** : 11 instances *(celles de la recette C4-L8)*,
10 lignes de plan, **aucune instance liée au plan**.

**Ce que le lot laisse en base, et rien d'autre** : les **deux lignes de type** *(codes renommés,
`genres_admis`, `exclusions_parcours` vide, `mode_saisie = manuscrit`, `libelle`, **`grain = macro`**,
`crans_admis` toujours vide)*, l'**index unique** `uk_exercices_planifie`, le **trigger**
`trg_exercices_cran_selon_le_type` et la **garde** `types_complet_macro_sans_cran_chk`.
**Les six interrupteurs à OFF, zéro statut `evaluee`, zéro policy élève.**

### Ce qui est prouvé — pour ne pas le rejouer

- [x] **C4L9-1 · Les deux types sont concevables.** Les deux lignes portent leurs `genres_admis`
  *(`dissertation_tc` + `essai_hlp` · `explication_texte_tc` + `interpretation_hlp`)*,
  `exclusions_parcours = '{}'` **écrit explicitement**, `mode_saisie = 'manuscrit'` et leur
  `libelle`. ⚠️ **Ni `grain` ni `crans_admis` remplis**, `competences` toujours **les six**
  *(plafond)*. **Preuve** : 15 drapeaux de vérification de `c4_l9_examens_diagnostiques.sql`, tous
  à `t`.
- [x] **C4L9-2 · Le renommage est fait, et il ne casse rien.** `diagnostic_essai` →
  `examen_diagnostique_essai`, `diagnostic_explication_texte` →
  `examen_diagnostique_explication_texte`. **Preuve** : les **sept** clés étrangères vers
  `exercices_types` pointent son `id`, jamais son `code` *(requête)*, et **zéro** ligne
  d'`exercices_routes.objet_code` ne portait l'un des deux anciens.
- [x] ⭐ **C4L9-3 · LE MUR EST TOMBÉ, ET DANS LES DEUX SENS.** `exercices_cran_chk` refusait toute
  conception d'examen diagnostique dès `statut = 'concu'`. **Preuve, par écriture réelle en
  transaction rollbackée** *(bloc « ÉPREUVE DU MUR »)* : un examen `concu` **sans cran passe** ; un
  examen **avec** un cran est **refusé** *(le sens qu'aucun CHECK ne pouvait exprimer)* ; un
  **objet** `concu` sans cran **reste refusé** *(la règle d'avant, mot pour mot)*.
- [x] ⭐ **C4L9-4 · L'insertion de l'instance EST le claim.** Deux conceptions sur la même ligne de
  plan : la **seconde perd**, et **une seule** instance revendique la ligne. **Preuve** :
  `uk_exercices_planifie` éprouvé en transaction rollbackée *(migration)* **et** par le geste réel
  *(recette, étape G)*.
- [x] ⭐ **C4L9-5 · Les deux se retrouvent l'une l'autre — PAR REQUÊTE, DANS LES DEUX SENS.** De
  l'instance vers la ligne par `exercice_planifie_id` ; de la ligne vers l'instance par la lecture
  inverse. **Et aucune colonne neuve n'est allée sur la ligne de plan** *(vérifié : pas
  d'`exercice_id` sur `scriptorium_exercices_planifies`)*. **Preuve** : recette, étape E.
- [x] ⭐ **C4L9-6 · La `forme` vaut `sommatif`** — lue **là où la chaîne l'écrit**, jamais sur
  `exercices` *(elle n'y est pas)* : `utils/chaine/contexte.ts` appelé **sur l'instance réelle**
  rend `forme = 'sommatif'` et `lieu = 'classe'` pour les deux examens. **C'EST UNE ANCRE.**
  **Preuve** : recette, étape F.
- [x] ⭐ **C4L9-7 · Le refus de référence, et son motif la nomme.** À l'affichage **et au geste** —
  *« un écran n'est pas une garde »*. Après le refus, **aucune instance ne reste** et la ligne de
  plan est **restée `a_concevoir`**. **Preuve** : recette, étape C, sur le texte réel
  `txt-bloque-0001` dont la référence n'est pas validée.
- [x] ⭐ **C4L9-8 · Le flux de C4-L4 prend l'instance SANS UNE LIGNE DE CHANGEMENT.**
  `ouvrirLesDepots()` accepte l'instance, `chargerVueEleve()` rend une vue, le dépôt s'y voit
  ouvert, l'élève lit sa consigne — et côté Aletheia **le texte à expliquer y est** *(1 270
  caractères servis)*. **Preuve** : recette, étape H. ✓ **Et le diff le confirme** : `git diff` sur
  `utils/passation/` et `components/passation/` ne porte **que des lignes de commentaire**, dans un
  seul fichier *(le renommage du piège 30 à `metacognition.ts`)*.
- [x] ⭐ **C4L9-9 · L'élève voit son signal, et entre par son module.** Le signal se lève sur un
  dépôt **réellement ouvert par le geste du professeur**, porte l'instant de ce geste, mène à
  `/eleve/modules/{module}/passation/{depotId}`, **ne fuit pas dans l'autre module**, et **s'éteint
  à la remise**. ⚠️ **Et portes fermées, il est INERTE** — aucun signal. **Preuve** : recette,
  étape I.
- [x] **C4L9-10 · Les deux examens de la semaine 1 sont montés, un par module.** Et la garantie
  **préexistait au plan** : une **seconde** écriture diagnostique de septembre est refusée par
  `uk_exercices_diagnostic`. **Preuve** : recette, étape J — *servi comme preuve, jamais construit*.
- [x] **C4L9-11 · Aucune policy élève n'a été ouverte**, ni par la migration ni par le code : le
  signal se sert **par le serveur**, filtré sur `eleve_id`. **Preuve** : drapeau 13 de la migration
  et requête `pg_policies` re-jouée après la recette.
- [x] **C4L9-12 · Les quatre routes compilent et se comportent.** Les deux écrans de conception, les
  deux pages de module prof et les deux pages de module élève rendent `307 → /login` sans
  authentification, **sans erreur de compilation ni d'exécution** *(journal du serveur de dev)*.

- [x] ⭐⭐ **C4L9-15 · « SE JUGER » SE SERT SUR UN EXAMEN DIAGNOSTIQUE — le blocage de STRUCTURE
  est levé** *(C4-L9-bis, 22/08 — décision de Louis)*. Le défaut livré par C4-L9 était **silencieux** :
  le drapeau se levait, la confiance de remise passait, et **« se juger » ne venait jamais** —
  `offreSeJuger` exige un geste **`produire`** au grain **`meso`/`macro`** *(`02-` §5)*, or le geste
  se lit au **cran** *(un examen n'en a pas)* et le grain au **type** *(la garde l'interdisait sur
  `complet`)*. ⭐ **Ce n'est pas la condition qu'on a relâchée, c'est l'examen qui la satisfait** :
  il porte « un genre terminal entier […] **il est donc macro par construction** » *(`01-` §10)*.
  **Preuve, par le même code que l'écran** *(recette, étape H bis)* : le refus **ne porte plus sur
  le geste ni sur le grain** ; un statut `evaluee` posé le temps de la vérification, **« se juger »
  se sert sur les deux examens** — **deux questions, jamais trois**, sur la compétence évaluée, avec
  la version de la fiche *(3.1)* et la liste fermée des réponses ; le geste dérivé vaut `produire`,
  le grain stocké vaut `macro`, et l'instance reste **SANS CRAN** — *rien n'a été inventé*. Les
  statuts et **leurs dates** sont remis, re-constatés par requête.
- [x] ⭐ **C4L9-15 bis · Et la « durée fantôme » ne peut pas naître** — la peur qui justifiait
  d'interdire le grain. **Preuve** : la durée vit à `exercices_types_crans`, **clé (type_id, cran)**
  *(`utils/deroule/vue.ts`)*, `crans_admis` reste `'{}'`, et **aucune ligne de cette table ne porte
  l'un des deux types**. ✓ **Ils ne deviennent pas non plus servables comme exercices** :
  l'assemblage de la doctrine écarte sur **`nature === 'complet'`, jamais sur le grain**
  *(`utils/fabrique/doctrine.ts`)*.
- [x] ⚠️ **C4L9-15 ter · LE PIÈGE DU NULL DANS UN CHECK, attrapé par l'épreuve de la migration.**
  La garde écrite `grain = 'macro'` **laissait passer un `complet` SANS grain** : `NULL = 'macro'`
  rend **NULL**, et **un CHECK qui rend NULL est réputé satisfait** — elle n'interdisait donc pas le
  cas même qu'elle visait. Corrigée en **`grain is not distinct from 'macro'`**. *Cousin exact du
  piège `array_length` d'un tableau vide, déjà relevé en tête de `c4_l1_schema.sql`.* **À retenir :
  dans un CHECK, tout ce qui peut rendre NULL laisse passer.**

- [x] ⭐⭐ **C4L9-13 · LE SMOKE PROFESSEUR, JOUÉ À L'ÉCRAN LE 22/08** — Chrome réel, session prof,
  `localhost:3000`. **L'encart** « EXAMENS DIAGNOSTIQUES À CONCEVOIR · 1 » s'affiche dans le module,
  avec sa date, son **retard**, sa fenêtre et son deep-link. **L'écran de conception** rend
  l'intitulé, la classe, `fabrique_actif est à OFF`, l'avertissement de **classe sans parcours**, le
  sélecteur de texte, la **consigne pré-composée et éditable**, et **les deux cases d'opt-in cochées**.
  ⭐ **VÉRIFIÉ NOMMÉMENT : AUCUN CHAMP DE DATE NULLE PART** — seulement la mention « la date vient de
  la ligne de plan et ne se saisit pas ici ». **Le refus déplié nomme la référence**, mot pour mot.
  **Conception jouée pour de vrai depuis le bouton** → « L'examen est conçu », et en base :
  ligne de plan `concu` **horodatée**, instance `lieu = classe`, **sans cran, sans genre, sans
  fenêtre**, `modes_par_competence` = l'arrêté du `01-` §10, référence portée, type au grain `macro`.
- [x] ⭐⭐ **C4L9-14 · LE SMOKE ÉLÈVE, JOUÉ À L'ÉCRAN LE 22/08** — session élève réelle (Elo, classe
  Test). ⭐ **Portes fermées : AUCUN signal** — le gate est inerte, vérifié à l'écran avant tout.
  Portes ouvertes : **« Passation en classe ouverte — Examen diagnostique — l'essai »** dans Codex et
  **« — l'explication de texte »** dans Aletheia, **chacun dans son module et sans fuite dans
  l'autre**. Le clic mène à `/eleve/modules/aletheia/passation/{depotId}` — et **le texte de Descartes
  y est servi en entier**, avec le rappel de lisibilité et l'étape photo. **Les deux portes ont été
  refermées et re-constatées.**
- [x] ⭐⭐ **C4L9-15 quater · ET « TE JUGER » EST À L'ÉCRAN.** Après validation de la copie par le
  **vrai code de C4-L4** (`validerLaTranscription`, jamais une ligne posée à la main), l'écran élève
  rend **« TE JUGER » avec DEUX questions** — les vraies questions de la fiche Expression, avec leurs
  listes fermées — **et « COMMENT TE SENS-TU ? »** pour la confiance de remise. *C'est la preuve à
  l'écran de ce que C4-L9-bis a débloqué.* Le statut `evaluee` posé pour la vérification a été
  **rendu au professeur, avec sa date d'origine**.
- [x] **C4L9-13 bis · Les libellés du plan, à l'écran** : la grille rend **« Examen diagnostique —
  écriture »** et **« Examen diagnostique — lecture »**, et non plus « Écriture diagnostique ».

### Ce qui reste à jouer en recette

- [x] **C4L9-16 · L'écran de C4-L8 rend « cran NaN » sur une instance d'examen diagnostique.**
  `/prof/conception/{id}` compose son titre avec `Number(e.cran)` — `NaN` sur une instance sans
  cran — et son bloc **Édition** refuse *(elle lit `exercices_cas`, qu'un examen n'a pas : son appui
  ne dépend que du cran)*. Le bloc **Assignation**, lui, **fonctionne** — et c'est par lui que passe
  la suite du flux. **Cosmétique et hors périmètre** *(écran de C4-L8)*. **Adressé au lot de
  correctifs.**
- [ ] **C4L9-17 · Le geste d'assignation reste celui de C4-L8.** Ce lot conçoit *(instance `concu`,
  ligne de plan `concu`)* et **n'assigne pas** — la mission en compte quatre choses, et
  l'assignation n'en est pas. Le professeur passe donc par `/prof/conception/{id}` **hors de son
  module** pour créer les dépôts. **L'écran le dit et l'y mène**, mais **le chemin traverse deux
  modules**. **À trancher : l'assignation doit-elle rejoindre l'écran du module ?**
- [x] **C4L9-18 · `idx_exercices_planifie` est devenu redondant.** `uk_exercices_planifie` a la même
  clé et le même prédicat, en UNIQUE. **Laissé en place** — il appartient à C4-L1, les migrations de
  ce lot sont additives, et aucun piège n'en demandait le retrait. **Retrait à faire au lot de
  correctifs, ou jamais** *(le coût est une écriture d'index de plus par instance)*.
- [x] **C4L9-19 · La garde « référence validée » vit maintenant à DEUX endroits.**
  `app/prof/conception/actions.ts:130` *(C4-L8)* et `utils/examens/conception.ts` lisent la **même**
  colonne `exercices_references.validee_at` avec le **même** prédicat. **L'extraction en une
  fonction partagée toucherait un fichier de C4-L8**, hors périmètre. **Adressé au lot de
  correctifs.**
- [ ] **C4L9-20 · `consigne_gabarit` reste NULL sur les deux types, et c'est délibéré.** Aucune
  source n'arrête le texte d'une consigne d'examen diagnostique — *« une donnée que rien ne nomme se
  signale, elle ne s'invente pas »*. L'écran compose donc un **point de départ** *(l'intitulé du
  type, puis le matériau)* que **le professeur arrête** : c'est le texte qu'il arrête que l'élève
  lit. **Si un gabarit doit exister, il se décide en source.**
  ✅ **COCHÉ PAR C4-L11 (23/08).** ⭐ **Unifier la forme du `cran` NE L'AURAIT PAS RÉGLÉ** — un examen n'a pas « un cran dans l'autre forme », il n'en a **aucun** : il fallait un cas « sans cran » à l'affichage, et c'est ce qui a été fait (`cranDeLInstance`, qui ne rend jamais 0 ni NaN). L'en-tête dit « sans cran », l'aperçu se tait plutôt que de composer depuis un cran inventé. ⭐ **Et le bloc d'édition ne refuse plus** : la garde « déclare 1 cas, n'en porte 0 » était écrite pour les treize objets ; un type de nature `complet` déclare **0 cas**, et édite sa consigne, son lieu et ses deux opt-ins. **Le bloc d'assignation n'a pas été touché** — il fonctionnait.
  ✅ **COCHÉ PAR C4-L11 (23/08) — C'EST LE RETRAIT.** Même clé, même prédicat, confirmé par `pg_indexes`. `c4_l11_retraits.sql` le retire, et **refuse de partir si l'unique est absent** (la colonne resterait sans index). ⚠️⚠️ **Et le rollback de C4-L9 comptait dessus** — « `idx_exercices_planifie` reste : les lectures continuent de marcher » : **cette phrase devenait fausse**. `c4_l9_examens_diagnostiques_rollback.sql` a été **amendé dans le même geste** (il recrée l'index simple avant de retirer l'unique, plus un drapeau `index_simple_remis`), et le `SUIVI_SQL.md` porte la ligne. *Il n'a jamais été joué : on amende un fichier qui n'a rien fait tourner.*
  ✅ **COCHÉ PAR C4-L11 (23/08).** Le prédicat vit désormais à **un seul endroit**, `utils/reference-validee.ts`, qui porte le `select` de la jointure **et** le prédicat pur. ⭐ **La fonction partagée ne recopie pas une jointure** : l'écran de conception (un ou deux identifiants) appelle le **verdict par identifiant**, la conception d'examen (une liste) appelle le **prédicat** sur des lignes déjà jointes — jamais une requête par ligne. ⚠️ **Les deux motifs de refus ne se fondent pas** : « aucune référence déposée » et « déposée mais non validée » n'appellent pas le même geste, et **le motif nomme la référence** (`02-` §6 A). *Elle touche un fichier de C4-L8 : c'était prévu, c'est pour ça que l'item était au lot de correctifs.*

---

- [x] **C4L11-I · ⭐ LES DEUX BLOCAGES DE LA FILE SONT UN DÉCOR VOLONTAIRE — RIEN À ARBITRER, ET
  SURTOUT RIEN À DÉBLOQUER.** Question posée le 23/08 en regardant l'écran de la file de validation,
  où `txt-bloque-0001` et `ex-bloque-0001` apparaissent bloqués, l'un dépendant de l'autre — ce qui
  ressemble à une décision en attente du professeur. **Ce n'en est pas une.** ⭐ **Les deux viennent
  du MÊME dépôt d'import**, le 21/08 à 02:54, `import_id = ad5e3edb…`, et **le fichier s'appelle
  `import_bloque.json`** : son nom dit ce qu'il est. Les deux blocages sont **les deux bouts d'une
  même démonstration** — `[B2]` sur le texte *(« décomposition bloquée — M2 : fonction « refute »
  sans cible — le professeur tranche, rien ne se devine »)* et `[B1]` sur l'exercice *(« le matériau
  cible renvoie à la référence non validée … donc `validee` est forcée à `false` : aucune instance
  ne tourne dessus »)*. **Le blocage se propage, et c'est ce que le décor prouve.**
  ⛔ **CE SONT DES PIÈCES PORTANTES** : `RELEVE_Recette_C4_L8_trois_epreuves_2026-08-21.md` écrit
  *« Le décor ajouté est DÉCRIT, pas retiré — ces lignes SONT la preuve de C4L8-1 »*, et **`C4L9-7`
  s'appuie dessus** *(« le refus de référence, et son motif la nomme … sur le texte réel
  `txt-bloque-0001` »)*. **Les débloquer détruirait deux preuves cochées.**
  ⚠️ **CE QUI RESTE VRAI, ET QUI EST UN VRAI DÉFAUT D'ÉCRAN** : rien, à la file de validation, ne
  dit qu'une entrée est un **décor permanent**. Elle s'y présente comme n'importe quelle entrée en
  attente, avec son motif — et le professeur, en septembre, la regardera en se demandant ce qu'il
  doit trancher. *C'est la même famille que `C4L11-G` : l'écran dit le MOTIF, il ne dit pas la
  NATURE.* ✅ **CORRIGÉ LE MÊME SOIR, par `C4L11-G`** — décision de Louis : la
  file affiche désormais **LE FICHIER D'IMPORT** de chaque entrée, à côté de son `id_import`.
  `import_bloque.json` dit sa nature tout seul, et les deux décors ne ressemblent plus à un geste
  qui attend. ⭐ *Écartées : une colonne `nature = 'decor'` — une migration, et une convention que
  chaque futur décor devrait penser à tenir, sinon la catégorie ment — et une simple note au
  bandeau, qui ne distingue rien ligne par ligne.* **Zéro migration.**
  *Déposé hors lot, le 23/08 ; refermé le même soir.*


- [x] **C4L11-G · ⚠️ LA FILE DE VALIDATION NE DISAIT NI POURQUOI UNE PUCE EST MORTE, NI CE QU'ON
  VALIDE.** Trouvée le 23/08 au soir **par le professeur à l'écran**, et ce n'est pas un bug : c'est
  un écran qui refuse sans dire pourquoi. *(a)* **LE REFUS MUET.** `disabled` valait
  `bloque || statut !== ATTENTE[banque]`, et **seul le premier terme se voyait**. Les deux autres
  causes — *déjà validée* et *sortie de la file* *(un exercice `assigne` ou `clos`)* — rendaient une
  puce morte **sans un mot**. Sur l'état réel de la base, **11 entrées dont UNE SEULE cochable** :
  7 déjà validées, 2 bloquées, 1 `assigne`, 1 cochable. L'écran ressemblait à une panne.
  *(b)* **LE LIBELLÉ QUI NE DIT RIEN.** Un exercice s'affichait « `argument · cran 2 · maison` » —
  **un gabarit, pas un exercice**. Le professeur validait un identifiant. *(Les quatre autres
  banques nommaient déjà leur contenu : auteur—titre, énoncé, défaut, thème. Seuls les exercices
  étaient muets.)*
  ✅ **CORRIGÉ, LES DEUX.** `motifInerte()` rend désormais la cause en toutes lettres —
  « déjà validée — rien à faire ici » · « statut « assigne » : cette entrée est sortie de la file,
  elle ne s'y valide plus » — la bloquée gardant son motif détaillé existant. Et la ligne d'un
  exercice porte **sa consigne** *(`consigne_instanciee`, ajoutée à la requête POUR L'ÉCRAN ; une
  paire rend ses deux consignes jointes)* et **un lien vers `/prof/conception/[id]`**, pour aller
  voir le détail plutôt que valider à l'aveugle. ⭐ *Ce lien ne valait rien avant ce soir : l'écran
  de destination était cassé — voir `C4L11-F`.*
  ✅ **Vérifié à l'écran, sur les onze entrées** : chaque puce inerte porte sa cause, et les trois
  exercices affichent leur consigne. `npx tsc --noEmit` 0 · `eslint` 0 · 0 erreur de console.
  ✅ **TRANCHÉ ET FAIT LE 23/08 — la file ne liste plus la banque entière.** Ce qui attend un geste
  reste en haut ; **ce qui ne demande plus rien — validé, ou sorti de la file — se replie** dans un
  `<details>` qui l'annonce (« N entrée(s) qui ne demandent plus rien »). Il ne disparaît pas, il
  cesse d'encombrer. **Mesuré à l'écran** : de **11 entrées** qui se disputaient l'attention, il en
  reste **3 visibles**, dont **1 seule cochable** — les deux autres étant des décors permanents.
  Une banque sans rien en attente le dit (« Rien en attente dans cette banque »).
  ⭐⭐ **ET LA NATURE D'UNE ENTRÉE SE LIT ENFIN — décision de Louis, 23/08 : afficher LE FICHIER
  D'IMPORT.** La ligne portait son `id_import`, qui étiquette la LIGNE ; elle porte désormais aussi
  **le dépôt qui l'a déposée**, et c'est lui qui dit la nature — `import_bloque.json` se lit tout
  seul. *Écartées : une colonne `nature = 'decor'` (une migration, et une convention que chaque
  futur décor devrait penser à tenir, sinon la catégorie ment) et une simple note au bandeau (qui
  ne distingue rien ligne par ligne).* **Zéro migration** : `exercices_imports.nom_fichier` était
  déjà en base. ⚠️ **Lue EN ENTIER, pas les dix derniers dépôts** — une entrée peut venir d'un
  import plus ancien, et son nom manquerait sans qu'on le voie. **Vérifié à l'écran** : les deux
  décors annoncent `import_bloque.json`, la seule entrée qui attend vraiment annonce
  `corpus-recette-3.json`. *Cela referme aussi le défaut d'écran noté à `C4L11-I`.*
  ⚠️ **UN PIÈGE RENCONTRÉ EN CHEMIN, ET IL EST TRANSVERSE** : couper la chaîne d'un `.select()` en
  deux avec un `+` pour la mise en forme **casse le typage de supabase-js** — elle cesse d'être une
  constante de type, le typeur rend `GenericStringError[]`, et la ligne devient inassignable **sans
  que rien ne dise que c'est la MISE EN FORME qui l'a cassée**. *Même famille que le piège déjà noté
  à `utils/routeur/donnees.ts`.* **Un `select` reste un littéral d'un seul tenant.**
  ✅ `tsc` 0 · `npm test` **1234/1234** · `eslint` 0 erreur · les **quatre onglets** du Scriptorium
  rendent 200 sans incident *(dépôt, file, rattachement, démonstrations — les requêtes des cinq
  banques ont été touchées)*. *Déposé hors lot, le 23/08 ; refermé le même soir.*


- [x] **C4L11-H · ⛔⛔ LE PIÈGE DE RENTRÉE — TOUT ÉLÈVE INSCRIT APRÈS LA POSE D'UN STATUT ÉTAIT HORS
  DU ROUTEUR, EN SILENCE. CORRIGÉ.** Trouvé le 23/08 au soir en vérifiant *pourquoi* les six
  compétences venaient de passer à `evaluee` sur exactement 102 lignes. ⭐ **La cause est une
  discordance entre la doctrine et le stockage** : le `07-` §1.3 pose que *« une compétence déclarée
  `evaluee` l'est POUR TOUTES LES CLASSES »* — le statut est une propriété **de la compétence** —,
  mais il était rangé **par élève**, dans `competences_niveaux(eleve_id, competence)`. Un fait global
  rangé par élève doit être re-propagé à chaque inscription, et **rien ne le faisait** : *(a)*
  `poser_statut_recette` est un **instantané** sur `inscriptions where statut = 'active'` ; *(b)*
  **aucun trigger** sur `inscriptions`, et **la RPC est le seul écrivain du dépôt** *(balayage
  complet, SQL et TS)* ; *(c)* `lireLesNiveaux` ne rend **que les lignes existantes** — les
  compétences d'un élève sans ligne n'étaient pas `mesuree_silencieusement`, elles étaient
  **ABSENTES**, et le routeur n'avait rien à cibler ; *(d)* `utils/deroule/mesure.ts` retombait sur
  `mesuree_silencieusement` — ni « se juger », ni palier au retour. ⚠️ **Le Monitoring portait le
  même défaut DEUX fois** : sa RPC est le même instantané, et `utils/chaine/monitoring.ts` fait un
  `upsert` **sans** `statut_recette`, donc un élève neuf naissait au défaut de la colonne.
  ⚠️⚠️ **CE QUE ÇA COÛTAIT** : les élèves de la RENTRÉE seraient partis hors du routeur, sans
  « se juger » et sans palier, **sans une alerte** — et **C4-L7 ne pouvait pas le voir**, puisqu'il
  tourne sur les 17 élèves d'aujourd'hui, qui ont leurs lignes.
  ✅ **CORRIGÉ EN DEUX MOITIÉS, et la seconde n'était pas prévue.** **(1) SQL** —
  `c4_statut_recette_global.sql` : table `competences_statut_recette(competence PK, …)`, **une ligne
  par compétence**, `monitoring` compris. Les deux planchers de la RPC sont **inchangés** ; la reprise
  **refuse de deviner** si des élèves divergent *(garde `raise exception` ; elle n'a pas tiré)* ;
  **aucun `drop column`** — les deux colonnes par élève sont marquées **DORMANTES** en base.
  Exécutée en sandbox après **répétition à blanc corps seul** : 7 lignes, 6 `evaluee`, RLS active.
  **(2) CODE** — `utils/statut-recette.ts`, **le seul endroit où le statut se lit** *(la leçon de
  `C4L11-F` : une copie privée finit toujours par diverger)*, et **cinq sites de chargement** y
  passent. ⭐⭐ **Et surtout : `lireLesNiveaux` ÉNUMÈRE DÉSORMAIS LES SIX COMPÉTENCES au lieu des
  lignes trouvées.** Sans ça, déplacer le statut ne fermait rien — un élève sans ligne rendait
  toujours un tableau vide. *C'est la moitié qu'on n'aurait pas vue sans l'éprouver.*
  ✅ **ÉPROUVÉ SUR L'ÉLÈVE DE SEPTEMBRE, SIMULÉ** — un identifiant sans aucune ligne : **6
  compétences rendues, toutes `evaluee`, lettre `null`, profil provisoire `true`**. *Avant le
  correctif : **0**.* Un élève existant rend les mêmes six. `npm test` **1234/1234** · `tsc` 0 ·
  `eslint` 0 erreur.
  ⚠️ **Deux conséquences dites plutôt que subies** : le retour des deux RPC **change de sens** — ce
  n'est plus « combien de lignes d'élève » mais **à combien d'élèves inscrits le statut s'applique**,
  et l'écran le dit *(« s'applique aux N élèves inscrits **et à tous ceux qui s'inscriront** »)* ; et
  **« 0 » n'est plus un échec** — le statut a désormais son domicile même sans aucun élève inscrit,
  alors que l'action le refusait en rouge, ce qui était précisément le défaut.
  ✅ **SMOKE PROF FAIT, À L'ÉCRAN, dans la foulée** *(la session avait expiré, elle a été rouverte)* :
  `/prof/competences` rend les **six à `evaluee`** et le **Monitoring à `mesuree_silencieusement`**,
  chacun suivi de « s'applique aux 17 élève(s) inscrit(s) **et à tous ceux qui s'inscriront** »,
  0 incident, 0 erreur de console.
  ⚠️⚠️ **ET LE SMOKE A TROUVÉ UN DÉFAUT QUE J'AVAIS INTRODUIT** : l'écran affichait **19** quand la
  RPC disait **17**. La RPC fait `count(distinct eleve_id)` ; ma requête d'écran comptait **les
  LIGNES** de `inscriptions` — or **deux élèves sont inscrits dans DEUX classes**, donc portent deux
  inscriptions. ✅ Corrigé : l'écran déduplique *et* **pagine** *(supabase-js plafonne toute réponse
  à 1000 lignes sans rien signaler)*. Re-vérifié à l'écran : **17**, accordé avec la RPC.
  ✅ **CHEMIN D'ÉCRITURE ÉPROUVÉ, dans une transaction ANNULÉE** — le poser depuis l'écran aurait
  déplacé `statut_recette_pose_le`, qui borne le recalcul de la lettre : les deux RPC écrivent bien
  leur ligne et rendent **17**, puis `rollback` et **rien n'a bougé** *(vérifié par requête)*.
  ✅ **ÉPREUVE NÉGATIVE DES DEUX PLANCHERS** : correspondance retirée → `evaluee` **refusé** avec son
  motif ; fiche retirée → `mesuree_silencieusement` **refusé** avec le sien. Les deux mordent, et
  `structure` est intacte après annulation.
  ⛔ **CE QUI RESTE** : le **retrait** des deux colonnes dormantes — geste destructif, propre fichier,
  propre décision. *Déposé hors lot, le 23/08.*


- [x] **C4L11-F · ⛔⛔ RÉGRESSION DE C4-L11 — TOUTE INSTANCE AYANT UN VRAI CRAN S'AFFICHAIT
  « SANS CRAN », DONC COMME UN EXAMEN DIAGNOSTIQUE, ET SON FORMULAIRE DE CORRECTION PERDAIT LE CAS,
  LE GUIDE ET LES TROIS APPUIS.** Trouvée le 23/08 au soir, **par le professeur à l'écran**, en
  essayant de concevoir l'exercice maison dont C4-L7 a besoin. ⭐ **La cause, en une ligne** :
  `app/prof/conception/[id]/page.tsx` gardait une **copie privée** de la lecture du cran,
  `cranDeLInstance`, qui filtrait par son helper local `txt()` — `(x) => typeof x === 'string' ? x : ''`.
  Or **C4-L11 a converti `exercices.cran` en ENTIER** *(`c4_l11_cran_forme.sql`)* : `txt(2)` rend
  `''`, donc `cran` devenait `null`, donc `sansCran` devenait vrai. La page basculait alors sur la
  branche « examen diagnostique » — en-tête « · sans cran », texte « Un examen diagnostique n'a pas
  de cran », **une seule zone de saisie**, et ni cas, ni guide, ni `defaut`, ni distracteurs, ni
  `reponse_attendue`. L'aperçu se taisait aussi *(`cran === null` ⇒ `composerApercu` n'est pas
  appelé)*. ⚠️⚠️ **C'est EXACTEMENT le défaut que `utils/cran.ts` nomme dans son propre commentaire**
  — *« un 400 avalé par PostgREST, et cinq champs vides sur une instance parfaitement valide »* —,
  et C4-L11 avait créé ce module en le déclarant **« le SEUL endroit où la forme se lit »**. La page
  ne l'a jamais importé, et **son commentaire disait encore « `exercices.cran` est du texte »**,
  vrai avant C4-L11 seulement. ⭐ **Pourquoi personne ne l'avait vu** : aucun test ne rend cette
  page, et `C4L11-D` — le smoke des trois écrans professeur — **est décoché**. Le défaut attendait
  le premier œil humain.
  ✅ **CORRIGÉ** : la copie privée est remplacée par `cranNumero` de `utils/cran.ts`, qui accepte
  **les deux** formes — le numéro que la base porte, et le code résiduel des scripts de recette.
  `npx tsc --noEmit` : 0 erreur · `eslint` : 0. **Vérifié À L'ÉCRAN, dans le navigateur** : sur
  `cd2fe916` l'en-tête passe de « Le paragraphe · sans cran » à **« Le paragraphe · cran 2 ·
  production_guidee »**, le bloc **LE CAS** et le **guide** reviennent, leurs deux `<textarea>` sont
  **pré-remplis** *(relevés par requête sur le DOM)*, et l'aperçu rend « durée indicative 20 min ·
  **régime plein** » ; sur `ff98bbdd`, « diagnostique » devient **« L'argument · cran 2 ·
  production_guidee »**. Zéro erreur de console.
  ⭐⭐ **LA CHASSE A ÉTÉ FAITE DANS LA FOULÉE, ET ELLE A RENDU DEUX AUTRES SITES** — même cause,
  même `txt()` sur un entier, symptôme plus discret : *(a)* `app/prof/conception/page.tsx` l.123 et
  *(b)* `app/prof/corpus/page.tsx` l.195 écrivaient toutes deux `cran ${txt(e.cran)}` dans leur
  libellé de liste, donc **« cran » suivi de RIEN sur chaque instance**. ✅ Les deux passent à
  `cranNumero`, avec le cas `null` rendu par **« sans cran »** au lieu d'un blanc — ce qui distingue
  enfin un examen diagnostique d'un défaut d'affichage. **Vérifié à l'écran** : la liste de
  conception rend « Le paragraphe · cran 2 · maison » et « L'examen diagnostique — l'essai · **sans
  cran** · classe » ; l'onglet *file* du Scriptorium rend « argument · cran 4 · maison ».
  ⚠️ **ET UNE SOURCE FAUSSE, redressée** : `utils/deroule/types.ts` l.28 affirmait encore
  *« `exercices.cran` porte le code, pas le numéro »* — l'inverse de ce que C4-L11 a tranché. C'est
  la phrase qui fabrique la copie privée suivante ; elle porte désormais l'avertissement et le
  renvoi à cette entrée.
  ✅ **Contrôles sur les trois fichiers** : `npx tsc --noEmit` 0 erreur · `eslint` 0 · aucune erreur
  de console sur les quatre écrans visités.
  ⚠️ **CE QUI RESTE, ET QUI N'EST PAS DE MOI** : `utils/cran.ts` n'est importé que par cinq modules.
  Une passe systématique — « tout ce qui lit un `cran` passe par lui » — reste à faire, et elle est
  du ressort d'un lot de correctifs. *Déposé hors lot, le 23/08.*


- [x] **C4L9-21 · ⚠️⚠️ POSER LES SIX `evaluee` REND LA RECETTE DE C4-L9 ROUGE — 5 vérifications,
  et ce n'est PAS un défaut de l'application.** Constaté le 23/08 au soir, en rejouant
  `scripts/recette/examens-c4l9.mjs --garde-le-decor` après que Louis a posé les six compétences à
  `evaluee` *(102 lignes sur 102)* ⭐ **Le décor laissé n'a touché AUCUN élève réel** :
  7 élèves des classes **Test** et **T5**, 14 dépôts, **zéro intersection avec THLP** *(les seuls
  élèves réels — vérifié par identifiant, pas par nom : un compte de test s'appelle « Sacha »)* : **127 passées, 5 en échec**. ⭐ **La mécanique est juste, ce
  sont les ASSERTIONS qui sont périmées** — elles encodaient un monde où rien n'était `evaluee`,
  monde qui a pris fin ce soir. *(a)* l.392, **×2 modules** : *« sans compétence `evaluee`, l'étape
  se refuse »* — elle ne se refuse plus, et c'est le comportement voulu. *(b)* l.424, **×2** :
  *« sur la compétence évaluée »* — le script pose `expression`, mais `offreSeJuger` sert désormais
  `argumentation`. *(c)* l.459 : *« les statuts sont REMIS »* asserte `resteEvaluee === 0` ; la
  **restauration est correcte** *(elle repose l'instantané `avant2`, et l'instantané vaut
  `evaluee`)*, donc l'assertion échoue sur un comportement juste. ✅ **Vérifié après coup : les six
  statuts sont INTACTS, 102/102** — la recette n'a rien écrasé.
  ⚠️⚠️ **ET LE MÊME PIÈGE DORT DANS D'AUTRES SCRIPTS**, lu sur pièces sans les rejouer :
  `deroule-c4l3.mjs` l.781-787 *(trois assertions : `evaluees.length === 0`,
  `competencesDeLaConfiance` vide, « confiance » absent des gestes restants)* — et il travaille sur
  un élève **inscrit et PERSISTANT** *(`eleves[1].id`, l.350)*, comme C4-L9 — **c'est là toute la
  bascule** : ces scripts ne créent pas leurs élèves, ils prennent ceux des classes de test, qui
  portent donc désormais les six statuts. *Un script qui créerait ses élèves à la volée ne verrait
  rien : une ligne neuve de `competences_niveaux` n'existe pas, et le défaut vaut alors
  `mesuree_silencieusement` — c'est le même piège que celui de la rentrée.* ; `chaine-c4l5.mjs` l.294
  *(`dire(!calib, …)` — « la Connaissance n'est pas `evaluee` »)* ; et les trois scripts de C4-L10
  *(`argumentation` l.467, `expression`, `structure`)* qui assertent *« AUCUN statut `evaluee` n'a
  été posé — pas même pour tester »*. ✅ **Sans effet** : `routeur-c4l2.mjs` l.148 et
  `passation-c4l4.mjs` l.360 ne font que **noter** le compte.
  ⛔ **POURQUOI ÇA COMPTAIT POUR C4-L7** : son « fait quand » exige que *« rien de ce que C4-L3,
  C4-L4, C4-L5 et C4-L9 ont éprouvé ne casse — leurs sections se rejouent vertes »*.
  ✅ **PASSE FAITE LE 23/08 AU SOIR — ONZE SCRIPTS REJOUÉS, TOUS VERTS.** `examens-c4l9` **126/0**
  *(126 contrôles, 0 rouge)* · `routeur-c4l2` **tout passe** · `deroule-c4l3` **86/0** *(+1 ⊘)* ·
  `chaine-c4l5` **51/0** · `passation-c4l4` **44/0** · les six C4-L10 : expression **14/0**,
  argumentation **26/0**, structure **33/0**, connaissance **37/0**, questionnement **34/0**,
  synthèse **46/0**. `npm test` **1234/1234**, `eslint` 0 erreur.
  ⭐ **LE PRINCIPE DE LA PASSE, et il vaut pour toute recette future** : *une assertion ne fige pas
  un MONDE, elle assère une RÈGLE.* Chaque « aucune compétence n'est `evaluee` », « DEUX compétences
  ouvertes », « aucun squelette » a été remplacé par la biconditionnelle ou l'invariant
  correspondant — vrai dans les deux mondes, et qui **éprouve désormais la branche que personne
  n'avait jamais exercée**. *Vérifié : sur les examens diagnostiques, « se juger » emprunte
  maintenant la branche SERVIE (`servie: true`, compétence `argumentation`, 2 questions) — l'ancienne
  assertion attendait `expression` et échouait.*
  ⚠️⚠️ **ET LE TOUR PAYÉ A TROUVÉ TROIS ROUGES QUE `--sans-appel` NE MONTRAIT PAS** : dans
  `chaine-c4l5`, « aucune compétence n'entre dans la chaîne », « chaque compétence écartée dit
  pourquoi » *(qui exigeait `>= 1` écartée)* et « aucun squelette : le Monitoring n'écrit pas »
  vivaient tous dans la partie D, sautée sans appel. **Une passe qui n'aurait pas dépensé les aurait
  manqués.**
  ⛔ **CE QUE LA PASSE A DÛ RETIRER, ET C'EST IMPORTANT** : `examens-c4l9` **posait un statut puis le
  restaurait**. Sur l'ancienne colonne par élève c'était local ; depuis `c4_statut_recette_global.sql`
  le statut est **GLOBAL**, et porter ce geste tel quel **aurait changé le statut pour TOUS les
  élèves**. La danse est supprimée : la recette **LIT** l'état et n'écrit plus rien — ce qui est la
  meilleure garantie qu'« elle ne décide pas à la place du professeur ».
  ⚠️ **Deux motifs redressés au passage** *(l'attendu ne bouge pas, la raison si)* : dans
  `deroule-c4l3`, `confiance_declaree` reste NULL parce que **l'élève n'a rien déclaré**, non plus
  parce qu'« aucune compétence n'est `evaluee` » ; et le ⊘ de `aide_consommee` invoquait « la porte
  de la première fiche versée et bancée » — **cette porte est levée** depuis C4-L10, le seul
  obstacle restant étant que la chaîne n'a pas tourné sur ce dépôt. Le contrôle **peut désormais
  verdir**, et le fait dès qu'une mesure existe.
  ⚠️ **Le décor de C4-L9 a été refait** *(il fallait le retirer pour rejouer)* : les instances
  d'examen diagnostique portent de **NOUVEAUX identifiants** — `7605c3ac-0ca8-400b-96e4-d48c28329aac`
  *(codex)* et `bb8d6153-24db-442e-9c98-6d4366ea1f1f` *(aletheia)*, toujours étiquetées
  `note = 'RECETTE C4-L9'`.
  *Déposé hors lot, le 23/08 au soir ; refermé le même soir.*


## C4 · L6 — Les onglets de l'écriture (⚠️ **AUCUNE MIGRATION** — aucune n'était attendue, aucune n'a été nécessaire)

_Section ouverte le 22/08 depuis `RELEVE_C4_L6_2026-08-22.md`, à la clôture du lot._

**Ce que le lot porte** : **deux onglets de chaque côté** — *Exercices* et *Paramètres* pour le
professeur, *Exercices* et *Examens* pour l'élève — et **l'ouverture des portes** que la
réorganisation rend possible. *« Un écran sans porte n'existe pas. »*

**Où il vit** : `components/nav/configModules.ts` *(le domicile unique des sous-onglets)* ·
`utils/codex-onglets/` *(`regles.ts` PUR + `liste.ts` serveur)* · `app/prof/codex/page.tsx` ·
`app/eleve/modules/codex/page.tsx` · `app/eleve/modules/codex/examens/page.tsx` *(route neuve)* ·
plus quatre retouches de libellé et **un `revalidatePath`**.

⚠️⚠️ **ÉTAT LAISSÉ EN SANDBOX À LA CLÔTURE — À REFERMER.** Le décor de recette d'**Elo** et
**Alice** *(6 instances et 6 dépôts, **une synthèse en classe fermée** avec le travail d'Elo, et **une ligne
de plan diagnostique à concevoir**)*
**est laissé en place à la demande de Louis**, et
**`exercices_actif` est resté à ON** : sans lui la liste est vide, et le décor ne montrerait rien.
**Un seul geste remet tout comme avant** — le décor part, l'interrupteur revient à OFF :

    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
         scripts/recette/decor-c4l6.mjs --retire

*(`--etat` dit ce qui est en base et où en est l'interrupteur ; le registre de ce qui a été semé vit
dans `.decor-c4l6.json`, git-ignoré, et un repli par la marque `DECOR-C4L6` rattrape un décor semé
sans registre.)*

⚠️ **Les six interrupteurs étaient à OFF**, re-constatés par la recette de C4-L9 rejouée en clôture :
`exercices_actif`, `routeur_actif`, `competences_affichage_actif`, `fabrique_actif`, `chaine_actif`,
`passation_classe_actif`. **Ce lot n'en allume aucun, n'en crée aucun, et n'en détourne aucun** — il
en **lit** un seul, `exercices_actif`, pour expliquer un vide côté élève.

⚠️ **Les quatre dossiers qui devaient sortir INCHANGÉS le sont, à la ligne près** :
`utils/deroule/`, `utils/passation/`, `utils/chaine/`, `utils/examens/` — plus `components/deroule/`,
`components/passation/` et `components/examens/`. **Zéro écart à justifier** *(`git status` sur les
sept chemins : rien)*.

⚠️ **La face professeur a été éprouvée EN DEUX TEMPS.** La session Code était connectée en **élève**
— une session Code ne saisit pas d'identifiants. Louis a ensuite ouvert son propre Chrome, où la
session **professeur** était déjà active, et **les cinq contrôles prof ont été joués là**
*(C4L6-11, -14, -18, -19, -20)*. **C'est cette reprise qui a trouvé le défaut d'ordre de C4L6-20.**

_`npx tsc --noEmit` : **rien**. `eslint` sur tout le dépôt : **0 erreur**, 4 avertissements
préexistants dans des fichiers non touchés *(`fragments-erudition/page.tsx`,
`utils/synthese-semestre.ts`)*. **`npm test` : 1010 tests, 0 échec** — dont **29 neufs**._

_**La doctrine : sans objet, et c'est vérifié.** La convention ne demande `derive-doctrine.py
--verifie` que si un écran du lot **lit les tables de doctrine**. Aucun ne le fait : les lectures de
ce lot portent sur `exercices_depots`, `exercices`, `exercices_retours`, `codex_travaux`,
`scriptorium_exercices_planifies` et `classes`. **`derive-instruments.py --verifie` a été rejoué,
lui, parce que le `07-` a bougé** — voir C4L6-9._

### Ce qui est prouvé — pour ne pas le rejouer

- [x] **C4L6-1 · Les deux barres portent DEUX onglets, et deux seulement.**
  Prof : *Exercices* · *Paramètres*. Élève : *Exercices* · *Examens*. **« Validation » et
  « Synthèses » ne sont plus des onglets** ; les quatre autres modules gardent leur compte exact
  *(aletheia 2/0, fragments 4/3, quazian 3/2, scriptorium 4/2)*. Tenu par test —
  `utils/codex-onglets/onglets.test.ts`, qui lit **la config réelle**, jamais une copie. _(22/08.)_
- [x] **C4L6-2 · ⭐ LES TREIZE ROUTES DE CODEX ALLUMENT LE BON ONGLET.**
  Les sept routes prof allument *Exercices* — `/prof/codex`, `synthese/<id>`, `validation`,
  `validation/<id>`, `travail/<id>/v1`, `passation/<id>`, `examen-diagnostique/<id>` — et
  `/prof/codex/parametres` allume *Paramètres* : **le plus long préfixe gagne**, la racine ne
  l'emporte jamais par accident. Côté élève, `/eleve/modules/codex` et `exercice/<id>` allument
  *Exercices* ; `examens`, `passation/<id>` et `synthese/<id>` allument *Examens*. _(22/08, par
  test.)_
- [x] **C4L6-3 · ⭐ LE PARCOURS DE REVUE TIENT BOUT À BOUT SOUS LE MÊME ONGLET.**
  liste → `synthese/<id>` → `travail/<id>/v1` → `validation/<id>` : **quatre écrans, un seul onglet
  allumé**. C'est la *« revue complète d'une synthèse rendue »* du `07-` §2 — au sens de l'onglet
  allumé, pas de la page. _(22/08, par test.)_
- [x] **C4L6-4 · La face élève, À L'ÉCRAN, en desktop et à 375 px.**
  Les deux onglets sont rendus **par les deux composants** — Barre 2 `hidden sm:block` et
  `SousNavModuleMobile` `sm:hidden` — depuis le **domicile unique** : rien n'a été écrit dans les
  layouts de module. À **375 px** : hauteur **44 px** *(la cible tactile)*, largeurs 82 et 81 px,
  **`scrollWidth === clientWidth` sur les deux libellés** *(aucun mot coupé)*, et **la page ne
  défile pas horizontalement**. `aria-current="page"` tombe sur le bon onglet dans les deux barres.
  _(22/08, navigateur, compte élève réel.)_
- [x] **C4L6-5 · Le vide de l'onglet Exercices élève est EXPLIQUÉ, et il ne clignote pas.**
  `exercices_actif` étant à OFF, l'onglet **s'affiche** et rend *« Les exercices ne sont pas encore
  ouverts. Ton professeur t'indiquera quand ils commencent. »* — jamais un onglet qui disparaît
  selon un drapeau, jamais le nom d'un interrupteur dit à un élève. L'onglet Examens fait de même
  *(« Rien en classe pour le moment… »)*. _(22/08, à l'écran.)_
- [x] **C4L6-6 · Les deux gardes précèdent le contenu, sous LES DEUX onglets.**
  `modules.actif` puis `seuilModule()` — même ordre, même refus, sur `/eleve/modules/codex` et sur
  `/eleve/modules/codex/examens` : cliquer l'autre onglet ne mène jamais à une page vide, mais au
  même écran-seuil qui explique. _(22/08, à la lecture des deux pages + rendu à l'écran.)_
- [x] **C4L6-7 · ⭐⭐ RIEN DE CE QUE C4-L3, C4-L4, C4-L5 ET C4-L9 ONT ÉPROUVÉ N'A CASSÉ — REJOUÉ,
  PAS RELU.** Les quatre recettes en base, dans l'ordre :
  `deroule-c4l3.mjs --sans-appel` → **88 contrôles, 87 passés, 0 échoué, 1 non éprouvé (⊘)** —
  identique au relevé d'origine ; `examens-c4l9.mjs` → **138 vérifications, 0 en échec**, et les
  **six interrupteurs re-constatés à OFF** ; `passation-c4l4.mjs --sans-appel` → **44 verts, 0
  rouge** ; `chaine-c4l5.mjs --sans-appel` → **31 passés, 0 échoué**. **Les quatre sèment puis
  retirent** : la sandbox est revenue à son état d'avant, **vérifié par requête table par table**
  *(classes=3 · exercices=11 · exercices_depots=25 · exercices_jobs=2 · exercices_retours=1 …)*.
  _(22/08.)_
- [x] **C4L6-8 · Le `revalidatePath` a suivi le déménagement.**
  `marquerSyntheseLue` ne revalidait que `/eleve/modules/codex` — devenue l'onglet *Exercices*, qui
  n'affiche plus aucune synthèse. `/eleve/modules/codex/examens` a été **ajoutée**, la racine
  **gardée** *(la lecture d'un retour débloque des rendus ailleurs, `utils/retours-lus.ts`)*.
  ⚠️ **Les deux autres écritures qui touchent Codex élève passent déjà en `'layout'`**
  *(`app/deroule/actions.ts`, `app/passation/actions.ts`)* : elles couvrent la route neuve sans
  retouche. _(22/08, vérifié site par site sur les quatre fichiers d'actions.)_
- [x] **C4L6-9 · Le `07-` §5 amendé, et les instruments re-dérivés.**
  Le §5 ne nommait que **trois** interrupteurs quand la base en porte **six** ; l'écart est
  désormais écrit *(le `07-` passe en **2.32**)*. La ligne VERSION ayant bougé,
  `derive-instruments.py --verifie` a dit **DIVERGE** → `--ecris` rejoué → **IDENTIQUE (4 fichiers
  dérivés)**. **Le gabarit Calame n'a pas changé** : le diff ne porte que la version et l'empreinte
  de la source. `npm test` **1010/1010** après. _(22/08.)_
- [x] **C4L6-10 · Aucun libellé ne nomme plus un onglet disparu.**
  `← Synthèses` devient `← Exercices` sur l'écran de séance ; *« à valider dans l'onglet
  Validation »* devient *« dans la file de validation, sous l'onglet Exercices »* ; la fiche élève
  du professeur ne renvoie plus vers « Synthèses ». **Et la chose garde son nom** — *« la synthèse
  en classe, et pas un autre »* *(`01-` §10)* : le formulaire de création et l'historique élève le
  portent. _(22/08.)_

- [x] **C4L6-11 · ⭐ LA FACE PROFESSEUR, À L'ÉCRAN — sur le Chrome du professeur, connecté.**
  *(Rejoué le 22/08 après coup, sur autorisation de Louis : la session Code était connectée en
  élève et ne saisit pas d'identifiants ; son Chrome, lui, portait déjà la session professeur.)*
  **La barre à DEUX onglets** — Exercices allumé sur `/prof/codex`, dans les deux rendus — ·
  **le bouton « File de validation »**, qui ouvre la file *(vide ce jour-là, d'où l'absence de
  badge)* **en gardant l'onglet Exercices allumé** · **« Concevoir un exercice → »**, qui mène à
  l'écran de C4-L8 *(lequel dit lui-même « `fabrique_actif` est à OFF »)* — **un renvoi, pas un
  déménagement** · **la section « Passations en classe · 6 »**, avec ses six deep-links ·
  **« + Nouvelle synthèse en classe »** au nom canonique du `01-` §10. _(22/08.)_
- [x] **C4L6-14 · ⭐ LA PORTE DE LA PASSATION EN CLASSE, FRANCHIE.** « Ouvrir → » sur la première
  des six mène à `/prof/codex/passation/e834dcf3…`, l'écran de C4-L4 s'affiche
  *(« Passation en classe · Codex — l'écriture diagnostique »)*, **et l'onglet Exercices reste
  allumé**. L'écran dit lui-même *« La passation en classe est à OFF […] l'interrupteur s'ouvre à
  la recette »* — **un vide expliqué, exactement le régime voulu**. _(22/08.)_
- [x] **C4L6-18 · ⚠️ `/prof/codex/parametres` allume bien PARAMÈTRES, et l'onglet est intact.**
  La règle du plus long préfixe, vérifiée à l'écran et non plus seulement par test ; les **quatre
  champs** de `codex_params` sont là — deux consignes, deux prompts. _(22/08.)_
- [x] **C4L6-19 · Le message `?echec=` s'affiche EN TÊTE, hors de toute condition.**
  `/prof/codex?echec=…` rend le bandeau rouge **au-dessus des portes**, que la liste « Synthèses à
  préparer » soit là ou non. *Avant le lot il vivait DANS ce bloc : liste vide, message muet.*
  _(22/08.)_
- [x] **C4L6-20 · ⚠️ UN DÉFAUT TROUVÉ PAR L'ÉCRAN, ET CORRIGÉ : l'ordre des passations n'était pas
  déterministe.** Les six instances ont **toutes `fenetre_debut` à NULL** — le tri par date rendait
  donc `0` sur les six comparaisons, et l'ordre était **celui que la base servait**, changeant d'un
  rechargement à l'autre sous les yeux du professeur. **Départage ajouté sur `exerciceId`**, la clé
  unique. Vérifié à l'écran : l'ordre rendu est **strictement croissant par identifiant**, et il
  l'est encore après re-fetch. _(22/08.)_
- [x] **C4L6-12 · ⭐⭐ LA PORTE DU DÉROULÉ, FRANCHIE AU CLIC, AVEC DES DONNÉES RÉELLES.**
  Décor semé par `scripts/recette/decor-c4l6.mjs --seme --ouvre --eleves=Elo,Alice` : **trois
  exercices de maison par élève**, dans **leur vraie classe** *(Test)*, en trois états — *à faire*
  avec échéance · *à faire* sans échéance · *commencé*. L'onglet **Exercices** d'Elo rend **ses
  trois lignes et rien de plus** *(les trois d'Alice n'y sont pas — la garde `eleve_id` tient à
  l'écran)*, **dans l'ordre voulu** : ce qui appelle un geste d'abord, la plus proche échéance en
  tête, le sans-échéance en fin. **Un clic** ouvre `…/exercice/<depotId>` — **le déroulé à six temps
  de C4-L3 s'affiche** *(frise « Préparer · Écrire · Se juger · Retour · Réviser · Retour final »,
  la consigne, le champ avec « le collage est désactivé »)* **et l'onglet Exercices reste allumé**.
  ⭐ *C'est la clause centrale du « fait quand » : « tout écran d'écriture posé par les lots
  précédents s'atteint sans connaître d'identifiant ».* _(22/08.)_
- [x] **C4L6-13 · ⭐ LE CLOISONNEMENT PAR CLASSE, ÉPROUVÉ SUR UN VRAI BI-CLASSE.**
  `decor-c4l6.mjs --biclasse` : un exercice semé **dans chacune des deux classes** de **Sacha**
  *(Test + T5)*, puis **le code de l'écran** *(`exercicesMaisonDeLEleve`)* interrogé une fois par
  classe en contexte. **Chaque contexte ne rend que le sien** — *« dans les modules on reste par
  classe »*. Décor du contrôle **retiré dans un `finally`**, échec compris. _(22/08.)_
- [x] **C4L6-22 · ⭐ LE NETTOYAGE EST ÉPROUVÉ, PAS SEULEMENT ÉCRIT.** `--retire` a été **joué pour
  de vrai** avant d'être documenté : **6 instances retirées, dépôts compris**, `exercices_actif`
  **remis à OFF comme trouvé**, et `--etat` re-constate **0 instance**. Le décor a ensuite été
  **re-semé** pour que Louis puisse regarder. ⚠️ *Ce contrôle a rattrapé une régression de la
  séance même* : l'import de `liste.ts` était au niveau supérieur du script, ce qui rendait le
  résolveur de calibration obligatoire pour **les quatre gestes** — `--retire`, celui qui remet la
  sandbox comme elle était, **aurait échoué** dès qu'on l'appelle sans lui. L'import est désormais
  **paresseux**, dans `--biclasse` seul : *le geste de nettoyage ne doit dépendre de rien*. _(22/08.)_
- [x] **C4L6-16 · ⭐⭐ LA REVUE COMPLÈTE D'UNE SYNTHÈSE RENDUE, PARCOURUE AU CLIC, BOUT À BOUT.**
  Décor semé par `decor-c4l6.mjs --synthese` : une **synthèse en classe FERMÉE** pour la classe
  Test *(bras `contenu_id`, le chemin nominal)*, avec le **travail d'Elo** — V1 et V-finale
  envoyées, deux analyses `prete`, retour non validé. *La séance naît fermée parce que la revue est
  ce que le professeur fait QUAND LES COPIES SONT RENDUES.* **Les quatre écrans, cliqués dans
  l'ordre, l'onglet Exercices allumé sur chacun** :
  **(1)** `/prof/codex` → la tuile « Test · 1 synthèse » → la section « Test — synthèses en classe »
  → la ligne « NAture humaine · Fermée » ;
  **(2)** le **tableau de la séance** — l'encart dit *« à valider dans la file de validation, sous
  l'onglet Exercices »* *(le libellé corrigé par ce lot)*, et la ligne d'Elo porte « Voir → » en V1
  et en V-finale, plus « À valider » ;
  **(3)** la **V1** — oublis signalés, erreurs, transcription ;
  **(4)** la **validation** — l'éditeur complet : tag, importance, correction éditable, suivi des
  suggestions, les deux onglets internes, « Enregistrer » et « Valider le retour ».
  ⚠️ **Rien n'a été validé** : cliquer « Valider le retour » écrit en base et engendre des cartes de
  révision. ✓ **Et « File de validation » porte bien le compte 1** — le badge de C4L6-11, éprouvé
  cette fois avec une ligne réelle. _(22/08.)_
- [x] **C4L6-17 · TRANCHÉ — la section « Passations en classe » n'ira PAS chercher de date.**
  *(Décision de Louis, 22/08, sur constat.)* Les six passations ont **toutes `fenetre_debut` à
  NULL** ; `EncartAConcevoir`, lui, **résout** la sienne depuis la ligne de plan
  *(`dateEffectiveSemaine`)* — d'où la question. **Ce qui la referme, vérifié par requête : aucune
  des six ne porte de `exercice_planifie_id`.** Aller chercher la date sur le plan **ne donnerait
  rien** — une lecture de plus en base pour afficher le même vide. ⭐ Et les passations qui *ont*
  une ligne de plan sont les **examens diagnostiques**, qui passent déjà par l'encart au-dessus,
  **avec leur date et leur drapeau de retard**. *Si une vraie passation planifiée apparaît un jour
  dans cette liste sans date, ce sera le signe qu'il faut la résoudre — pas avant.* _(22/08.)_
- [x] **C4L6-23 · ⚠️ LE DÉCOR DE LA REVUE A CASSÉ L'ÉCRAN AVANT DE LE PROUVER — et c'était le
  décor.** Premier jet : `retour_critique` rempli avec des objets `{titre, detail}` partout →
  `/prof/codex/validation/<id>` tombe sur *« Objects are not valid as a React child »*. **La forme
  n'est pas libre** : `RetourCritique` *(`app/prof/codex/validation/actions.ts`)* mêle des listes
  d'**objets à clés fixes** — `erreurs_corrections` *(`concept_tag`, `description`, `correction`,
  `importance`)*, `suivi_suggestions` *(`suggestion`, `statut`, `commentaire`)*, `ajouts`
  *(`titre`, `contenu`)* — et des listes de **chaînes nues** — `pouvait_aller_plus_loin`,
  `non_ameliore`. **Le script porte désormais la bonne forme, et le pourquoi**, pour que le
  prochain décor ne retombe pas dedans. *L'écran n'a jamais été en cause.* _(22/08.)_
- [x] **C4L6-15 · ⭐ L'ENCART « EXAMENS DIAGNOSTIQUES À CONCEVOIR » S'AFFICHE, ET SA PORTE S'OUVRE.**
  Décor semé par `decor-c4l6.mjs --examen` : **une ligne de plan diagnostique `a_concevoir`**
  *(`ecriture` × `diagnostique`, fenêtre `septembre`)* sur le plan validé de la classe Test, calée
  sur **un lundi passé** pour que le retard se voie. ⚠️ **Ce n'était pas la porte du plan** :
  `plan_evaluation_actif` est à ON *(l'écran affiche « Synthèses à préparer »)* — il n'existait
  simplement aucune ligne, les recettes retirant les leurs. **À l'écran** : l'encart rend
  « **Examens diagnostiques à concevoir · 1** », la ligne « *Écriture — examen diagnostique ·
  septembre — Test* », **« 10 août · en retard »** *(le drapeau est CALCULÉ, jamais saisi)*, et la
  note *« la date vient du plan d'évaluation ; l'écran de conception ne la demande jamais »*.
  **« Concevoir → » ouvre** `/prof/codex/examen-diagnostique/<planifieId>` — l'écran de C4-L9,
  **l'onglet Exercices toujours allumé** —, qui affiche sa date, son retard, sa fenêtre, et dit
  lui-même *« `fabrique_actif` est à OFF »*. _(22/08.)_
- [x] **C4L6-24 · ⭐ LE RETRAIT EMPORTE LES TROIS DÉCORS, LIGNE DE PLAN COMPRISE — éprouvé.**
  `--retire` rejoué avec les trois en place : **1 ligne de plan · 1 séance (travaux compris) · 6
  instances (dépôts compris)**, `exercices_actif` **remis à OFF**, et `--etat` re-constate **0**.
  ⚠️ **La ligne de plan appartient au PLAN DU PROFESSEUR** : le retrait la vise par **son
  identifiant au registre ET par sa `note` de marque** — jamais par un critère qui pourrait
  attraper une ligne qu'il aurait posée lui-même. Les trois décors ont été **re-semés** ensuite.
  _(22/08.)_
- [x] **C4L6-21 · ⚠️ UN SECOND DÉFAUT TROUVÉ PAR LE DÉCOR : la liste ne naissait pas derrière sa
  porte.** `exercicesMaisonDeLEleve` listait les dépôts **quel que soit `exercices_actif`** — or
  l'écran du déroulé, lui, **se ferme sur ce drapeau** *(`utils/deroule/acces.ts`)*. L'élève aurait
  donc vu une liste d'exercices « à faire » **menant chacun à un refus poli** : *un lien qui promet
  une porte close*, exactement ce que `utils/examens/signal.ts` évite pour la sienne. **La lecture
  est désormais dans la fonction**, pas au site d'appel : une garde qu'on peut oublier en écrivant
  un second écran n'est pas une garde. ⚠️ **L'onglet ne clignote toujours pas** *(piège 41)* : il
  s'affiche, et son contenu dit *« Les exercices ne sont pas encore ouverts. »* _(22/08.)_

### Ce qui reste à jouer en recette


---

## C4 · L10 — L'ouverture d'une compétence dans la chaîne : l'EXPRESSION (sandbox, 22/08)

_Section ouverte le 22/08 à la clôture du lot. **Aucune migration** : ce lot ne touche que du code
et des dérivés — le suivi SQL n'a pas bougé, et n'avait pas à bouger._

_Ce qui a été prouvé EN SÉANCE est coché avec sa preuve. `npm test` : **1047 passés, 0 échoué**
(dont **37 neufs** sur ce lot ; l'état d'entrée était 1009/1010, l'unique rouge étant le contrôle de
dérivation, que le `07-` passé en 2.33 le matin même avait rendu divergent) ; `npx tsc --noEmit` :
rien ; `python3 scripts/derive-instruments.py --verifie` : **IDENTIQUE** sur les dix dérivés ;
`scripts/recette/expression-c4l10.mjs` : **29 contrôles, 29 passés**, joués **par le même code que
la route**, en base, sur un **dépôt réel** et **deux vrais appels de modèle**, décor semé puis
**retiré** (aucun reste, vérifié par requête)._

⛔ **AUCUN STATUT DE RECETTE N'A ÉTÉ POSÉ, et aucun n'est proposé.** L'Expression est
`mesuree_silencieusement` — son état de naissance. Ouvrir une compétence à la chaîne est un geste de
CODE ; poser `evaluee` est un geste **du professeur**, à l'écran de C4-L8. **Rien n'a changé pour un
élève** : la chaîne mesure et écrit, et aucune lettre n'est servie.

⚠️ **`chaine_actif` est REVENU À OFF**, vérifié par requête à la fin de chaque tour de recette.

### Ce qui est prouvé — pour ne pas le rejouer

- [x] **C4L10E-1 · LE VERROU DE LA DÉRIVATION EST DESCENDU À *RELU ET VALIDÉ*, et les six fiches
  dérivent.** `derive-instruments.py --resume` : les six compétences sont **OUVERTES à la
  dérivation** (9 · 9 · 8 · 8 · 13 · 9 observables de télémétrie, **56 en tout**), là où l'état
  d'entrée disait « AUCUNE ». `--verifie` dit **IDENTIQUE**. ⭐ **C'est un alignement, pas un
  contournement** : le seuil de banc n'est une règle dans **aucune** des neuf sources — vérifié
  par lecture ET par `grep` sur les neuf —, il n'existait que comme **exigence d'un lot**, à la
  ligne de manifeste de C4-L5. Cette ligne est réécrite en *relu et validé*, `07-` **2.34**. _(22/08.)_
- [x] **C4L10E-2 · LES DEUX PLANCHERS MÉCANIQUES TIENNENT — c'est le seul contrôle de non-régression
  du geste.** Fiche **absente ou seulement déposée** → hors de la chaîne, avec son motif (le refus
  est resté, à `degre < RELU`) ; **correspondance observable → formulation** non uploadée → non
  déclarable `evaluee`, intacte à C4-L8. **Aucun des deux n'était à ce lot de les lever.** _(22/08.)_
- [x] **C4L10E-3 · `verifierCoherence()` NE REND AUCUN ÉCART**, l'Expression est ouverte, et **les
  cinq autres sont NOMMÉES comme attendant leur branchement** — `competencesEnAttenteDeBranchement()`.
  ⚠️ « Dérivée » n'est plus « branchée », et ce n'est pas une incohérence : C4-L10 se rejoue une
  compétence à la fois. _(22/08.)_
- [x] **C4L10E-4 · LES SLOTS SONT SUBSTITUÉS, ET LE REFUS TOMBE AU CHARGEMENT.** Avant ce lot, le
  modèle recevait **la chaîne littérale `{copie}`** : `chaine.ts` passait le gabarit tel quel. Sur
  pièce, dans la recette : plus aucun slot littéral, la copie **renumérotée** (`[¶1]`, `[1] …`), les
  trois valeurs **en blocs balisés**, la déclaration de matériau **avant** les blocs, et une **tête
  cachable de 9008 caractères sans un seul slot**. Le contrôle des deux sens — slot sans
  fournisseur, et bloc calculé jamais injecté — est porté de `banc.py` et joué par
  `verifierCoherence()`, donc **avant tout appel payé**. **15 tests** sur `slots.ts`. _(22/08.)_
- [x] **C4L10E-5 · LE PORTAGE REPRODUIT LE MODULE, SUR LES TROIS CLÉS.** `scripts/vecteurs-expression.py`
  rejoue `copies-tests/expression/code.py` **à chaque exécution** — jamais une fixture recopiée, qui
  « pourrirait en silence » — et le test confronte `verdicts`, **`trace` mot pour mot** et `alertes`
  sur : les **7 vecteurs gold**, le **balayage des 25 couples de grades**, les **6 bandes du
  garde-fou bas**, les **3 cas du crible**, et **3 chaînes complètes** (`code1` → `code2` →
  `conformite`, `document_p2` comparé clé pour clé). **L'autotest du module est vert**, et le test
  le vérifie : un portage confronté à un module rouge ne prouve rien. _(22/08.)_
- [x] **C4L10E-6 · ⚠️ L'ÉPREUVE NÉGATIVE — le contrôle a été CASSÉ EXPRÈS, trois fois.** Un contrôle
  qui ne peut pas échouer n'est pas un contrôle. **(a)** Inverser le seuil du profil dissocié
  (`ecart <= 1` → `<= 2`) **passait les sept vecteurs gold** : ils portent tous un écart ≤ 1. D'où le
  **balayage des 25 couples**, qui le fait tomber. **(b)** Remplacer l'arrondi de Python par
  `Math.round` **passait les seize tests du portage** : aucun vecteur ne tombe sur une égalité
  exacte. D'où `arrondi.test.ts`, qui confronte **33 valeurs** à `python3` — dont les égalités, où
  Python tranche AU PAIR et JavaScript vers le haut. **(c)** Retirer « vers le bas » de la trace
  fait tomber deux tests. _(22/08.)_
- [x] **C4L10E-7 · LES NEUF OBSERVABLES DU §5 ONT TOUS UNE VALEUR, OU UNE ALERTE NOMMÉE.** C'est
  l'autre moitié du lot, et elle ne se voit pas : « un observable oublié ne lève aucune erreur — il
  rend `n/a`, `n/a` sort du dénominateur, et l'escalade est aveugle sur lui POUR TOUJOURS, SANS UN
  SYMPTÔME ». Sur un dépôt réel, **les neuf sont écrits en base** : `taux_sens_passe=0.5` ·
  `densite_friction=4.71` · `attache_presente=1` · `densite_generique=8.24` · `mot_impropre=0` ·
  `savant_plaque=0` · `repetition_pauvre=2.35` · `reussites=0` · `orthographe=0` — **aucun en
  `n/a`**. Un test l'exige des deux côtés : valeur **ou** alerte nommée, jamais ni l'un ni l'autre,
  jamais les deux. _(22/08.)_
- [x] **C4L10E-8 · UN DÉPÔT RÉEL TRAVERSE LA CHAÎNE, ET ÉCRIT.** Un squelette portant **ses deux
  artefacts**, `instrument_version` = **3.2** (la ligne VERSION de la fiche), **une** mesure, sa
  **lettre-équivalente « E »**, `delta_v1_vf` **NULL** (et NULL n'est pas 0), les neuf observables,
  et le journal **une ligne par appel avec sa phase** — `p1`, `p2`, `retour` —, chacune rattachée au
  dépôt, à la compétence et à la version. _(22/08.)_
- [x] **C4L10E-9 · L'IDEMPOTENCE SUR LA CHAÎNE RÉELLE.** `traiterDepot` rejoué sur le même dépôt :
  **une** mesure, **un** squelette, et la reprise compte « 1 mesure déjà là ». _(22/08.)_
- [x] **C4L10E-10 · ⚠️ LE DÉSACCORD MODÈLE / CALCUL, ATTRAPÉ EN VRAI, DÈS LA PREMIÈRE COPIE.** P2 a
  déclaré « Faible » ; le croisement calcule « **Absent** ». **Le calcul fait foi, et le désaccord
  est la donnée** : il sort en alerte de `code2` ET en alerte de `conformite`. *C'est exactement le
  défaut que le module existe pour attraper — « confier le calcul au modèle produit des erreurs
  d'arithmétique » —, et il s'est produit au premier essai.* Le **contrôle d'existence des
  citations** a de son côté trouvé **2 citations infidèles** sur la même copie : alerte seule, rien
  retiré — le pari de la fiche §8, qui se ferme au premier lot réel. _(22/08.)_
- [x] **C4L10E-11 · ⚠️ LE DÉFAUT QUE SEUL UN DÉPÔT RÉEL POUVAIT VOIR — LA FORME DE SORTIE DE P2.**
  `chaine.ts` déclarait le jugement `{ type: 'objet', champs: {}, optionnels: [] }`, c'est-à-dire
  « **l'objet VIDE, et rien d'autre** » : la garde des clés inconnues **refusait toute sortie de
  P2**, relance comprise — `niveau`, `grades`, `profil`, `levier`… rejetés un par un —, puis la
  chaîne levait, **sans aucune mesure**. Le verdict revenait pourtant complet et juste. `schema.ts`
  portait l'avertissement mot pour mot, et **P1 avait déjà été corrigé** : « c'est la distinction
  qui manquait, et elle bloquait la chaîne entière **le jour où une compétence s'ouvre** ». Ce jour
  est arrivé. **Corrigé en séance** — une ligne, `objet_libre`. *Aucun test pur ne pouvait le voir :
  il fallait un vrai appel.* _(22/08.)_
- [x] **C4L10E-12 · LE DÉCOR EST RETIRÉ, ET LE GESTE EST SYMÉTRIQUE.** `--retire` retrouve un décor
  laissé par sa MARQUE, même si le tour a cassé ; le `finally` nettoie toujours. Vérifié par
  requête : **zéro reste**, `chaine_actif` à OFF, **zéro statut `evaluee`** sur l'Expression. _(22/08.)_

### Ce qui reste à jouer en recette

- [ ] **C4L10E-13 · LE SMOKE PROF ET ÉLÈVE À L'ÉCRAN.** Rien n'a été vu dans un navigateur : tout ce
  qui précède est prouvé **par requête et sur pièce**, jamais à l'œil. À voir : la tuile de la
  fabrique qui dit l'Expression ouverte, et l'**encart langue** du déroulé élève (C4L3-21).
- [x] **C4L10E-14 · LE RETOUR ENGENDRÉ SUR UNE COPIE QUI PORTE UNE RÉUSSITE.** ⭐ **FAIT le 23/08
  par C4-L10 · Argumentation** — le retour est sorti sur une copie qui porte une réussite citable,
  et son texte est au relevé de cette séance ; **il reste la relecture RR1-RR4** *(= C4L5-1bis)*.
  ⚠️ **Condition de reprise nommée** : la règle 2 du gabarit exige de « commencer par une réussite réelle, citée », la
  règle 1 interdit d'en inventer une, et une copie plancher n'en porte aucune — le retour est alors
  **structurellement impossible**, et l'élève ne reçoit rien. *Porté au registre des ouverts.*
  > ✅ **PASSE DE RÉCONCILIATION DU 28/08 — LE RETOUR EST SORTI, ET LA RELECTURE AUSSI.**
  > Le geste demandé — un retour engendré sur une copie qui porte une réussite citable — **est fait
  > depuis le 23/08**, et la relecture RR1-RR4 qui lui restait accrochée l'est aussi *(voir
  > `C4L5-1bis`)*. ⚠️ **Ce que la « condition de reprise nommée » décrit n'est pas cette
  > vérification** : c'est le cas de la copie SANS aucune réussite, où le retour est
  > **structurellement impossible** — la règle 2 en exige une citée, la règle 1 interdit de
  > l'inventer. **C'est l'item 46 du registre des ouverts, une décision de Louis**, et il y reste
  > entier.
- [x] **C4L10E-15 · ⭐ LES AUTRES COMPÉTENCES — DÉPEND D'UNE AUTRE COMPÉTENCE QUE CELLE
  OUVERTE.** ✅ **L'ARGUMENTATION PUIS LA STRUCTURE SONT BRANCHÉES LE 23/08** — elles ne sont plus
  cinq, ni quatre, mais **TROIS**. `connaissance`, `synthese`, `questionnement` sont **dérivées et en
  attente de branchement**. **Condition de reprise : C4-L10 rejoué pour chacune** — le lot est écrit
  pour ça, et la boîte aux lettres du `PLAN_DE_CHANTIER.md` §5 porte ce que le premier portage a
  appris. ⚠️ **Trois d'entre elles ont un obstacle NOMMÉ, trouvé en lisant leurs modules** : la
  **Synthèse** dont `code1` ne rend pas `document_p2` — **sur ses DEUX chemins de sortie**, et dont
  un commentaire affirme même que « `document_p2` n'est pas une clé du contrat » quand le contrat §2
  l'exige **dès que `code1` existe** *(le banc refuserait le run ; la chaîne le refuse aussi depuis
  ce lot — c'est « le seul défaut de ce contrat dont RIEN NE TÉMOIGNE »)* ; la **Connaissance** dont
  `pre_p1` prend le TEXTE là où le contrat §2 et le banc passent le CONTEXTE *(même écart que
  l'Expression — le banc lèverait une `AttributeError` au premier passage ; ce lot l'a contourné en
  suivant LE CONTRAT, qui est au manifeste)* ; et ~~la **Structure**, dont `prepare_copie` doit être
  confronté au correctif CRLF de C4-L4 *(piège 17)*~~ — ✅ **LE TROISIÈME OBSTACLE EST TOMBÉ LE
  23/08, ET IL N'EN ÉTAIT PAS UN** : `normaliserRetours()` ramène `\r\n?` à `\n` **à l'écriture**
  du dépôt et ne nettoie rien d'autre, `prepare_copie` découpe et renumérote **à la lecture** — le
  premier garantit au second que ses `\n` sont des `\n`, et le crochet tient même sur du CRLF brut
  *(C4L10S-6)*. **Deux obstacles restent, et ils sont au chantier de conception.**
  ✅ **AMENDÉ PAR C4-L7 (24/08) — ÉPUISÉE : LES SIX SONT OUVERTES.**
  `competencesEnAttenteDeBranchement()` rend **`[]`**, `verifierCoherence()` rend **`[]`**, et
  C4-L10 ne se rejoue plus. ✅ *L'identifiant a été RENOMMÉ le 24/08 — il portait `C4L10-15`, il
  porte `C4L10E-15` : voir `C4L7-9`. L'entrée est ici, sous l'Expression ; les deux lignes de même
  nom, à l'Argumentation et à la Structure, la METTENT À JOUR — elles ne la dupliquent pas.*
- [x] **C4L10E-16 · LA LATENCE À DEUX COMPÉTENCES — JOUÉE le 23/08, par C4-L10 · Argumentation.**
  La deuxième compétence est branchée. **47 s, 49 s et 52 s** sur trois tours réels à deux
  compétences, contre 39 s à une — les chaînes tournent bien en parallèle *(= C4L5-2)*.

---

## C4 · L11 — Les correctifs (sandbox, trois migrations du 23/08)

_Douze chantiers en six familles, **joués un par un, chacun avec sa preuve**. Ce lot ne construit
aucune fonctionnalité et n'ouvre aucun écran : la réussite s'y mesure en **diff minimal**._

_Contrôle d'entrée : les **sept pièces** du manifeste existent et portent les versions attendues —
`07-` **2.35** (RELU ET VALIDÉ, régimes mêlés : §1 et §5 ouverts, **§4 GELÉ**), `01-` **5.5**, `02-`
**5.4**, `04-` **3.2**, `06-` **2.6**, toutes VALIDÉ ET GELÉ. Dépendances constatées jouées en bac à
sable *(C4-L1, L8, L8-bis, L5, L2, L3, L4, L9, L9-bis ; L6 et L10 sans migration)*. **Décor de C4-L6
absent** et `exercices_actif` **OFF** à l'entrée (`decor-c4l6.mjs --etat`). **Les six interrupteurs
constatés à OFF à l'entrée, et re-constatés à OFF à la clôture.**_

_État de sortie : `npm test` **1057 passés, 0 échoué, 0 SAUTÉ** · `npx tsc --noEmit` : rien ·
`eslint` : les 2 avertissements préexistants, aucun neuf · `derive-doctrine.py --verifie` : **DOUZE
verdicts IDENTIQUE** + SOURCES + FIXTURE · `derive-instruments.py --verifie` : **IDENTIQUE** ·
`scripts/recette/correctifs-c4l11.mjs` : **36 contrôles, 36 passés**, sur des instances réelles semées
puis retirées._

### Ce qui est prouvé — pour ne pas le rejouer

- [x] **C4L11-1 · LES DOUZE TABLES DE LA DÉRIVATION, ET LE DOUZIÈME VERDICT SAIT TOMBER.**
  `--sql` écrivait douze tables, `--verifie` en contrôlait **onze** — et la manquante était
  `exercices_types_crans`, « celle où la couche type se remplit aux crans de production » (`04-`
  §14). Elle a désormais son verdict : **117 lignes, IDENTIQUE**. ⭐ **Et il a été VU TOMBER** :
  une ligne modifiée à la main (`mot` × cran 2, durée 10 → 999) le fait rendre
  `DIVERGE — 1 manquante en base, 1 en trop` ; ligne rendue, verdict `IDENTIQUE`. *Un contrôle
  qu'on n'a pas vu échouer n'est pas un contrôle.* ⚠️ *Cet item n'avait aucune entrée décochée :
  sa seule mention vivait sous une ligne **cochée** du contrôle d'entrée de C4-L8-bis.*

- [x] **C4L11-2 · `npm test` PASSE DEPUIS UNE AUTRE RACINE ABSOLUE — ET LE CONTRÔLE TOURNE.**
  ⚠️ **Ce n'est pas « la suite est verte »** : elle l'était déjà ailleurs, **en sautant le
  contrôle**. Trois défauts se cumulaient : les deux chaînes embarquaient le **chemin absolu** dans
  ce que leur contrôle compare, et **les tests fixaient ce chemin en dur** puis sautaient s'il
  n'existait pas. Les trois sont réparés — la racine sort de la **comparaison** *(hors de la donnée
  dérivée pour le manifeste, hors de l'empreinte pour la fixture)* **sans sortir du fichier** : elle
  reste en **trace de provenance**, au bandeau du `MANIFESTE.ts` et dans `_derivation.racine`. ⛔ **Le
  refus d'`--ecris` depuis une racine d'essai n'a pas été retiré.** La racine se déclare par
  `PALIMPSESTE_RACINE_CONCEPTION`, le chemin du professeur restant le défaut.
  ⭐ **La preuve, jouée** : dépôt de conception copié sous `…/scratchpad/autre-racine`, puis
  `PALIMPSESTE_RACINE_CONCEPTION=… npm test` → **1057 passés, 0 échoué, 0 SAUTÉ**, le test
  « les dérivés sont IDENTIQUES à leurs sources » **tournant en 78 ms** ; `derive-doctrine.py
  --verifie --racine <autre>` → **12 verdicts IDENTIQUE + FIXTURE IDENTIQUE**. ⭐ **Et vu tomber** :
  un octet ajouté à `calame-retour.ts` fait passer la suite à **1053/1 échec** depuis cette racine.

- [x] **C4L11-3 · LE BILAN NE PERD PLUS LES APPELS D'UNE COMPÉTENCE QUI A LEVÉ.**
  Sur un `rejected` de l'`allSettled` des chaînes, le motif partait en alerte et **le compte
  tombait** — `bilan.appels = 0` avec trois lignes déjà au journal. `appelsDeLErreur` lit
  l'`appels` que `SortieNonConforme` et `AppelInterrompu` exposent *précisément pour qu'il ne se
  perde pas*. ⛔ **`allSettled` n'est PAS devenu `all`** : « avec `all`, une compétence qui lève
  emporte le résultat des autres ». ⚠️ **Aucune garde n'a bougé** — `controlerLaFacture` et
  `depotAAtteintSonPlafond` ne passent pas par ce bilan : *on répare un chiffre de diagnostic.* La
  fonction est **pure et testée** (`utils/chaine/couts.ts`, 3 tests neufs).
  ⚠️ *Cet item n'avait aucune entrée décochée : elle est créée ici.*

- [x] **C4L11-4 · L'OPT-OUT EST AU PROFIL DE LA CLASSE, ET LA ZONE EN CONSTRUCTION A UN SORT.**
  Le composant a déménagé (`components/pilotage/OptOutClasses.tsx`), monté à
  `/prof/classes/[id]?vue=competences`. ⛔ **L'action `poserOptOut` n'a pas bougé**, ni la table,
  ni le routeur qui la lit. L'écran des compétences garde un **renvoi** — un écran qui perd une
  fonction sans le dire fait chercher — avec le compte d'opt-out par classe. ⭐ **Les cinq colonnes
  inventées sont parties** *(Analyser · Interpréter · Argumenter · Problématiser · Conceptualiser —
  ce ne sont pas les six du référentiel)*, et avec elles la pastille vide par élève : « un écran
  n'affiche un nombre que si ce nombre compte quelque chose » (`06-` §5). **L'onglet reste**, et son
  contenu **dit pourquoi il est vide** — l'affichage des lettres est fermé (`07-` §5 : « un vide
  expliqué, jamais un onglet qui clignote »). *L'écran est antérieur à C4 : le corriger n'était pas
  le refaire — la bascule d'onglet, la liste d'élèves et le tri n'ont pas bougé.*
  ⚠️ *Cet item n'avait aucune entrée décochée : elle est créée ici.*

- [x] **C4L11-5 · LES CINQ CHAMPS VIDES — LE `NaN` EST FERMÉ À LA SOURCE.**
  `Number(exercice.cran)` rendait **NaN** sur un cran écrit au code, et `NaN != null` est vrai : la
  requête partait en `cran=eq.NaN`, PostgREST rendait un **400 que supabase-js avale**, et `cran`,
  `cranCode`, `regimeV1vf`, `servable` et `patronProduction` sortaient **tous les cinq vides**.
  ⛔ **Les trois gardes `Number.isFinite` qui marchaient n'ont pas été réécrites** — c'est la
  **lecture** qui est fermée (`cranNumero`, qui ne rend jamais NaN ni 0), et la ligne du `servable`,
  seule sans garde, ne peut plus recevoir de NaN. ⭐ **Prouvé sur des instances réelles, aux DEUX
  régimes de cran** : cran 6 et cran 8 *(production)* → `cran`, `cranCode`, `regimeV1vf` et
  `patronProduction` renseignés ; cran 3 *(qui isole)* → les trois premiers **plus `servable` à 31
  observables**.
  ⚠️⚠️ **UNE PRÉCISION DU « FAIT QUAND » NE PEUT PAS ÊTRE VRAIE À LA LETTRE, ET C'EST LA DOCTRINE
  QUI LE DIT** : « les cinq tous renseignés » est **impossible sur une même instance**, parce que
  `servable` et `patronProduction` sont **mutuellement exclusifs** — « aux trois crans de
  production, les tables “Ce qui est servable ici” n'ont rien à en dire » (`04-` §14), et aux six
  crans qui isolent c'est l'inverse. Ce qui se prouve, et qui est prouvé, est qu'**aucun n'est vide
  pour une mauvaise raison** : la couche type est portée par l'un **ou** par l'autre, jamais par
  aucun. *(La précision est du prompt, pas d'une source : rien à marquer `[faux]`.)*

- [x] **C4L11-6 · LE `search_path` — UN CONTRÔLE, ET IL ÉTAIT DÉJÀ CLOS.**
  Requête sur `pg_proc` le 22/08 : **six** fonctions `security definer` dans `public`
  *(`chaine_depense_du_mois`, `effacer_classe`, `est_prof`, `poser_statut_recette`,
  `poser_statut_recette_monitoring`, `retirer_inscription`)*, **toutes** à
  `search_path=public, pg_temp`, **`divergent_encore = 0`**. ⛔ **Rien n'a été joué** — et surtout
  aucun `create or replace`, qui aurait fait renaître une fonction grantée. ⚠️ **La source était
  fausse sur deux points** *(« deux formes », « cinq fonctions », « les sept »)* : `[faux]` posé au
  `07-` §2 et **dette D1** au registre des ouverts, avec l'avant et l'après. *Voir aussi `SEC-19`,
  déjà coché le 21/08.*

- [x] **C4L11-7 · LES TROIS MIGRATIONS — RÉPÉTITION À BLANC, PUIS EXÉCUTION.**
  Les trois ont eu leur **ligne au `SUIVI_SQL.md` AVANT exécution**, puis leur **répétition à blanc
  en copiant LE CORPS du fichier** *(règle 6 — jamais le fichier entier)*, chacune suivie d'un
  **retour à l'état d'avant vérifié PAR REQUÊTE**, jamais sur le seul « ROLLBACK » affiché.
  ⭐ **`c4_l11_retraits.sql` porte le seul geste destructif du lot**, et il **s'arrête par
  `raise exception`** si un seul squelette portait un `prompt_version` différent de sa jumelle, ou
  si l'index unique était absent. **Les trois rollbacks sont écrits**, et chacun dit ce qu'il ne
  rend pas.

- [x] ⚠️⚠️ **C4L11-8 · CONSTAT — LA BRANCHE « DÉCISION DU ROUTEUR » EST DORMANTE, ET RIEN NE
  L'ÉCRIT.** *(Trouvé en séance de vérification à la clôture, sur une question de Louis ; vérifié
  sur pièces ET en base.)* Le moteur du routeur est écrit et éprouvé — `ciblesPossibles`,
  `poserLaSemaine`, `elireR2`, `ordreDeLevier`, **fonctions pures** — mais **RIEN NE PERSISTE SA
  DÉCISION** :
  · aucun code n'écrit `routeur_decisions.cible_retenue` — le **seul `insert`** du dépôt est le
  journal d'override *(`app/prof/routeur/actions.ts:154`)*, qui pose `regle_declenchee:
  'override_prof'` **sans cible**, et **sur la branche même où le dépôt n'a PAS de décision** : la
  ligne créée ne peut donc jamais être relue comme la décision d'un dépôt ;
  · **rien n'écrit `exercices_depots.routeur_decision_id`** — les 19 occurrences sont des lectures,
  et le seul écrivain de dépôts *(`app/prof/conception/actions.ts:386`)* pose `origine: 'prof'` sans
  décision ;
  · **rien n'appelle `poserLaSemaine` ni `elireR2`** hors de `utils/routeur/` et de ses tests ;
  · **en base** : **0** ligne de `routeur_decisions`, **0 dépôt sur 25** qui en porte une.
  ⭐ **CE QUE ÇA CHANGE POUR C4-L11 — dans l'autre sens que ce qu'on croirait** : avant ce lot,
  **cent pour cent des dépôts tombaient sur le repli alphabétique**, la voie du professeur comprise.
  La `cible_primaire` est aujourd'hui **le seul domicile qui puisse empêcher le repli** — le
  chantier était donc plus nécessaire que le prompt ne le disait, pas moins. **Rien à changer au
  code** : l'ordre de lecture est celui que le `07-` §1.1 impose, et sa première branche doit être
  juste le jour où l'écrivain existera. *Les deux contrôles de la recette qui l'exercent sont
  étiquetés **contexte SYNTHÉTIQUE**, et `alerteDeCoexistence` est une **garde posée d'avance** —
  elle ne peut pas se lever aujourd'hui, et le code le dit.*
  ⚠️⚠️ **QUI ÉCRIT LA DÉCISION N'EST TRANCHÉ PAR AUCUNE SOURCE QUE CE LOT AIT LE DROIT DE LIRE, ET
  CE LOT NE LE TRANCHE PAS.** L'entrée de **C4-L2** au `07-` §2 porte les règles de ciblage, le
  moteur d'escalade et les écrans — dont l'écran d'assignation **explicitement « en lecture
  seule »** : elle **ne promet pas** l'écrivain. **La question est posée au relevé, elle n'est pas
  résolue ici.** *`routeur_actif` est à OFF, tout passe par la conception à la main, et rien n'est
  en souffrance aujourd'hui.*

### Ce qui reste à jouer en recette

- [x] ⚠️ **C4L11-A · LE RETOUR ÉCRIT PAR UN VRAI APPEL, SUR DEUX COMPÉTENCES — JOUÉ le 23/08, par
  C4-L10 · Argumentation.** Sa condition de reprise nommée — **la deuxième compétence branchée** —
  est levée, et le dernier maillon a tourné : un dépôt réel a **mesuré deux compétences**, la
  `cible_primaire` a **battu l'ordre alphabétique** *(instance visant `expression`, quand le repli
  aurait dit `argumentation`)*, et **le retour est sorti** — trois points segmentés, ancrés,
  registre `descriptif`, aucune fuite RR4. *Ce qui suit était l'état d'avant, gardé pour mémoire.* Le « fait quand »
  demande « un dépôt réel qui mesure DEUX compétences, une `cible_primaire` posée sur la seconde par
  ordre alphabétique, et **le retour qui parle d'elle** ». ⭐ **Tout est prouvé sauf le dernier
  maillon, et l'obstacle est nommé** : **une seule compétence est branchée à la chaîne**
  (`competencesOuvertes() === ['expression']`) — les cinq autres sont dérivées et attendent leur
  passage de C4-L10. Un dépôt réel ne peut donc **mesurer** qu'une compétence, et le départage à
  deux est structurellement injouable aujourd'hui. **Ce qui EST prouvé sur du réel** : la colonne
  **descend** jusqu'à `lireContexte` *(`ciblePrimaire === 'structure'`)*, et `cibleDuRetour` sur ce
  contexte réel, avec deux compétences, rend **`structure`** — la seconde alphabétiquement — là où
  le repli aurait rendu `expression`. **Condition de reprise nommée : la deuxième compétence
  branchée** *(= C4L5-2, = C4L10E-16)*. *Le retour parlera d'elle parce que la couche compétence et
  le squelette servis sont les siens ; c'est le seul maillon qui n'a pas été vu tourner.*

- [x] ⚠️ **C4L11-B · LE COMPTEUR DE LA GARDE DE BUDGET, SUR UNE VRAIE INVOCATION.** « Aucun job
  n'est plus tué en vol » **se prouve par le compteur** : une invocation qui traite *n* jobs doit
  avoir réclamé *n* jobs. Le code le rend désormais (`reclames`, `traites`, **`tuesEnVol`**), la
  réservation est en place et **prouvée sur pièce** *(la réserve est comparée au reste AVANT
  `reclamerJobs`)* — mais **la route n'a pas été appelée en vrai avec une file chargée** : les six
  interrupteurs sont à OFF, et l'appeler y répondrait par le gate. **Condition de reprise : une
  file non vide derrière `chaine_actif` ou `passation_classe_actif` — donc la recette de bout en
  bout de C4-L7, ou la première passation réelle.** *L'échéance du chantier est la même : « avant
  la première passation réelle ».*
  ✅ **AMENDÉ PAR C4-L7 (24/08) — LA ROUTE A ÉTÉ APPELÉE EN VRAI, FILE CHARGÉE.** La recette se
  donne son propre `CRON_SECRET` et appelle `GET` de `app/api/chaine/route.ts` avec un job réel en
  file et `chaine_actif` ouvert le temps de l'appel. ⭐ **Réponse en toutes lettres** :
  `{"reclames":1,"traites":1,"arret":"file vide","tuesEnVol":0,"dureeMs":30395}` — **une invocation
  qui traite 1 job en a réclamé 1**, et **`tuesEnVol` vaut ZÉRO**. La mesure est **en base** au bout :
  la route a mené le job jusqu'au bout, elle ne l'a pas seulement réclamé.
  ⭐ **LES TROIS PORTES SONT ÉPROUVÉES DANS L'ORDRE (piège 12), dont deux PAR L'ÉCHEC** : sans
  `Bearer` → **401** ; avec un MAUVAIS secret → **401** ; portes fermées → **200
  `{"gate":"`chaine_actif` et `passation_classe_actif` sont à OFF","traites":0,"enFile":true}`**, et
  **aucun job réclamé** — donc aucune tentative brûlée. ⚠️ *Cela ne coche pas `C4L11-C` : la route a
  été appelée par la recette, pas par le cron de l'hébergeur.* *(`traversee-c4l7.mjs --route`.)*

- [x] ⚠️ **C4L11-C · LE CRON, VU TOURNER CHEZ L'HÉBERGEUR.** `vercel.json` déclare la tâche à la
  minute ; **une déclaration n'est pas une exécution**. Rien ne l'a vue partir : les crons ne
  tournent qu'en déploiement, et rien n'est poussé. **Condition de reprise : le premier
  déploiement** — vérifier alors, aux journaux de l'hébergeur, qu'une invocation par minute part et
  répond `{"gate": …}` tant que les portes sont fermées.
  ⚠️ **Et savoir si `verifierCoherence()` s'est allumée** : à cette cadence, un 409 se répéterait
  **1440 fois par jour**, et un 409 dans un journal de cron ne réveille personne. ⛔ **La garde n'a
  pas été retirée** — elle rend 409 **avant tout appel payé** ; ce qui a été ajouté, c'est un
  `console.error` qui remonte aux journaux de l'hébergeur là où le corps de la réponse ne remonte
  pas. **Le vérifier au premier déploiement.**
  > ✅ **VU TOURNER LE 24/08 — aux journaux Vercel, en séance** *(constat de C4-L13, qui avait la
  > même condition de reprise)*. `/api/chaine` part **à la minute, sans un trou** — 12:46:31,
  > 12:47:31, 12:48:31 … 12:57:30 — et répond **200** à chaque fois. ⭐ **Et le 200 vaut preuve du
  > secret** : la route rend **401** si l'en-tête ne vaut pas exactement `Bearer ${CRON_SECRET}`.
  > La tâche est déclarée **Enabled** aux réglages du projet.
  > ✅ **Et `verifierCoherence()` ne s'est PAS allumée** : sur la fenêtre observée, **0 Warning,
  > 0 Error, 0 Fatal**, et aucun 409 — le `console.error` n'a donc jamais tiré. ⚠️ **Honnêteté de la
  > mesure : la fenêtre était « Last 30 minutes »**, soit ~30 invocations. C'est un démenti franc
  > du scénario « 1440 fois par jour », pas une observation au long cours.
  > ✅ **PASSE DE RÉCONCILIATION DU 28/08 — LA CASE N'AVAIT JAMAIS ÉTÉ COCHÉE.** Le bloc
  > ci-dessus porte sa propre preuve depuis le 24/08, et le commit qui l'a écrite le dit dans son
  > titre — `1f96018`, *« Le cron est armé, et vu tourner — `C4L13-13` et `C4L11-C` cochés sur
  > pièces »*. **`C4L13-13` a bien été cochée ; celle-ci ne l'a pas été.** *Rien de neuf n'a été
  > constaté : la case rattrape sa preuve.*

- [ ] **C4L11-D · SMOKE TEST PROFESSEUR — les trois écrans touchés.** Aucun n'a été ouvert dans un
  navigateur : *(a)* l'écran de conception, sur une instance **d'examen diagnostique** — l'en-tête
  doit dire « sans cran » et le bloc d'édition **accepter** la consigne *(la base n'en porte aucune
  aujourd'hui : il faut en concevoir une)* ; *(b)* le profil de classe, onglet **Compétences** —
  l'opt-out et le vide expliqué ; *(c)* l'écran des compétences — le **renvoi** vers les classes.
  **Condition de reprise : `fabrique_actif` ouvert le temps du smoke, et refermé après.**

- [x] **C4L11-E · CE QUI N'EST PAS DE MOI, ET QUI RESTE DÛ.** Le **smoke test « créer un élève
  depuis l'écran professeur »**, après le retrait de `handle_new_user()` le 21/08 — *c'est un test
  de recette, pas un correctif*, et il n'a pas été joué à sa place. Rappelé ici pour qu'il ne se
  perde pas : il vit à la section SÉCURITÉ du 21/08.
  > ✅ **SOLDÉ LE 29/08 — voir `SEC-21`, où la preuve vit.** 60 comptes créés en production après le
  > retrait, du 25 au 26/08. **Il ne reste rien de ce rappel.**

---

## C4 · L10 — L'ouverture d'une compétence dans la chaîne : l'ARGUMENTATION (sandbox, 23/08)

_Section ouverte le 23/08 à la clôture du lot. **Aucune migration** : ce lot ne touche que du code,
un dérivé et un `[faux]` de source — le suivi SQL n'a pas bougé, et n'avait pas à bouger._

_Ce qui a été prouvé EN SÉANCE est coché avec sa preuve. `npm test` : **1083 passés, 0 échoué**
(dont **25 neufs** sur ce portage ; l'état d'entrée était 1047/1047) ; `npx tsc --noEmit` : rien ;
`npx eslint` sur les fichiers du lot : **0 erreur**, 2 avertissements sur des paramètres de contrat
volontairement non lus, chacun commenté ; `python3 scripts/derive-instruments.py --verifie` :
**IDENTIQUE** sur les dix dérivés ; `scripts/recette/argumentation-c4l10.mjs` : **52 contrôles, 52
passés**, joués **par le même code que la route**, en base, sur un **dépôt réel à DEUX compétences**
et **cinq vrais appels de modèle**, décor semé puis **retiré** (aucun reste, vérifié par requête)._

⛔ **AUCUN STATUT DE RECETTE N'A ÉTÉ POSÉ, et aucun n'est proposé.** L'Argumentation est
`mesuree_silencieusement` — son état de naissance. **Rien n'a changé pour un élève.**

⚠️ **`chaine_actif` est REVENU à OFF**, vérifié par requête à la fin de chaque tour de recette.

### Ce qui est prouvé — pour ne pas le rejouer

- [x] **C4L10A-1 · L'ARGUMENTATION EST OUVERTE — dérivée, importée, branchée.**
  `derive-instruments.py --resume` la déclare **OUVERTE** (`argumentation v4.3 — 9 observables de
  télémétrie`) et `--verifie` dit **IDENTIQUE** ; `verifierCoherence()` ne rend **aucun écart** ;
  `competencesOuvertes()` rend **`['expression', 'argumentation']`**. ⭐ **Le premier des trois
  gestes était déjà fait** — les six fiches dérivent depuis C4-L10 · Expression ; ce lot n'a porté
  que les deux autres, l'import du slot et l'écriture du branchement.
- [x] **C4L10A-2 · LE PORTAGE REPRODUIT LE MODULE, LES TROIS CLÉS COMPARÉES.** `code1`, `code2` et
  `conformite` rendent **exactement** ce que `copies-tests/argumentation/code.py` produit — `mesures`,
  `document_p2`, `verdicts`, **`trace` mot pour mot** et `alertes` — sur **les 29 vecteurs
  embarqués** (2 `code1`, 27 de composition ; `python3 code.py --autotest` : *29 réussis, 0
  échoués*) **et sur 742 entrées de balayage**. ⚠️ **Aucun appel de modèle** : le harnais
  `scripts/vecteurs-argumentation.py` importe le module et rejoue ses fonctions.
- [x] **C4L10A-3 · LE BALAYAGE — 742 entrées de plus, et il n'invente aucune règle.**
  ⚠️ **L'Argumentation n'a NI GOLD NI RUN STOCKÉ** (`TESTS_P2_PARFAIT` vide, `VERSION_GOLDS_TESTEE =
  None`) : le balayage est ici la seule preuve de couverture. Six familles, toutes passées dans **la
  même fonction du même module** : **680** distributions de 1 à 4 unités sur les quatre statuts
  déclarables × avec/sans objection *(la majorité par palier, l'égalité au plus faible, le seuil qui
  n'élève pas la base)* · **16** croisements test × statut *(sur quoi chaque test mord ; que `sens`
  et `contour` MARQUENT sans changer le statut)* · **12** paires de « limite » **dans les deux ordres
  d'écriture de la note** *(la borne basse suit l'ordre de la fiche, jamais celui de la phrase)* ·
  **15** traitements × marques *(ce qui ouvre le seuil, ce qui le ferme)* · **8** appariements de
  thèse *(casse, accents, espaces, ligatures d'OCR)* · **11** notes de « limite » *(les frontières
  de mot)*.
- [x] **C4L10A-4 · ⭐⭐ L'ÉPREUVE NÉGATIVE — 14 mutations, 0 survivante.** Le portage a été **cassé
  exprès, règle par règle**, et le contrôle est tombé à chaque fois : égalité tranchée par le plus
  fort · borne des « limite » prise en haut · `sens`/`contour` qui rétrogradent · seuil qui ignore
  les marques · seuil qui élève la base · `source` qui ne mord plus sur `implicite` · « limite »
  illisible comptée quand même · `garant_present` rapporté à toutes les unités · `garant_circulaire`
  qui compte le test de la source · `nb_limites` rapporté au décompte sans les écartées ·
  `document_p2` vidé · `casefold` retombé sur `toLowerCase` · `\b` redevenu ASCII · `repr()` rendant
  la chaîne nue. ⚠️ **DEUX de ces quatorze SURVIVAIENT au premier passage** — `garant_present` et
  `garant_circulaire` — parce que les vecteurs de télémétrie étaient **symétriques** : un compte par
  test, et toutes les unités au décompte. Les deux cas ont été rendus **discriminants** *(un compte
  asymétrique ; une unité écartée qui porte un garant)*, puis les quatorze sont tombées.
- [x] **C4L10A-5 · LES NEUF OBSERVABLES DU §5, VALEUR OU ALERTE NOMMÉE, SUR 769 CAS.**
  `garant_present` · `lien_explicite` · `preuve_circulaire` · `garant_circulaire` ·
  `source_cosmetique` · `garant_ambigu` · `garant_vague` · `objection_traitee` · `nb_limites`.
  Le test l'exige sur **tous** les cas du paquet, et il exige aussi qu'aucun n'ait **à la fois** une
  valeur et une alerte. ⭐ **Les DEUX dénominateurs sont au relevé, sous le nom EXACT de la fiche** —
  `les unités du décompte` et `les unités du décompte, écartées comprises` : sans eux, les cinq
  `comptage rapporté` n'auraient rien à diviser et sortiraient en `n/a`.
- [x] **C4L10A-6 · UN DÉPÔT RÉEL, DEUX COMPÉTENCES, DEUX SQUELETTES, DEUX MESURES.**
  `scripts/recette/argumentation-c4l10.mjs`, **52 contrôles verts**, sur un `paragraphe` de la maison
  qui mesure l'Expression **et** l'Argumentation : **5 appels** (p1, p1, p2, p2, retour), **2
  squelettes** portant chacun ses deux artefacts, **2 mesures**, un `instrument_version` **égal à la
  ligne VERSION de la fiche** *(la recette le lit au manifeste dérivé, jamais en dur — voir
  C4L10A-19)*, la
  **lettre-équivalente « D »** pour l'Argumentation, et **les neuf observables écrits, aucun en
  `n/a`** — `garant_present=0.4 · lien_explicite=0.2 · preuve_circulaire=0.4 · garant_circulaire=0 ·
  source_cosmetique=0 · garant_ambigu=0 · garant_vague=0 · objection_traitee="oui" · nb_limites=0.2`.
  `delta_v1_vf` **NULL**, et NULL n'est pas 0. Reprise : **une** mesure, **un** squelette par
  compétence.
- [x] **C4L10A-7 · ⭐⭐ LA `cible_primaire` BAT L'ORDRE ALPHABÉTIQUE — sur trois instances réelles.**
  C'est le piège qui « mord à la deuxième compétence branchée », et sa condition de fermeture était
  *« AVANT LA DEUXIÈME COMPÉTENCE BRANCHÉE »*. Vérifié **en base**, à travers `lireContexte` :
  une instance visant `argumentation` → cible `argumentation`, **aucune alerte** ; une instance
  visant **`expression`** → cible **`expression`**, alors que **le repli alphabétique aurait dit
  `argumentation`** *(c'est elle qui discrimine)* ; une instance **sans** `cible_primaire` → repli
  alphabétique **et l'alerte tombe**. **C4-L11 tenait sa promesse, et cela se voit.**
- [x] **C4L10A-8 · LES SLOTS DE L'ARGUMENTATION.** P1 porte **exactement** `{sujet}` et `{copie}`,
  tous deux **natifs** — aucun `slotsFournis`, aucun crochet pré-phase ; la tête cachable fait
  **4056 caractères** et ne porte aucun slot ; le message assemblé ne garde **aucun slot littéral**
  et sert ses matériaux **en blocs balisés**, la déclaration avant les blocs. P2 porte **un seul**
  slot, `{squelette_phase_1}` : c'est le document, sans déclaration.
- [x] **C4L10A-9 · LE MODÈLE NE REND NI NIVEAU, NI DÉCOMPTE — vérifié sur la vraie sortie.** Le P2
  réel a rendu `crible, levier, confiance, ce_qui_plafonne, justification_ancree` — et **ni `niveau`,
  ni `palier_base`, ni `seuil_franchi`**. `conformite` tourne à chaque passage et n'a rien à dire.
- [x] **C4L10A-10 · ⭐ LE RETOUR, ENGENDRÉ ET LU SUR PIÈCE — une première sur ce chantier.** Le tour
  de l'Expression n'avait **jamais pu le lire** : sa copie plancher ne portait aucune réussite
  citable, et la règle 2 du gabarit refusait le retour. **La copie de recette de l'Argumentation en
  porte une**, et le retour est sorti : **3 points segmentés**, chacun avec son **identifiant
  stable** et son **ancrage verbatim**, registre **`descriptif`**, `published_at` **NULL** *(écrit,
  pas publié)*, et **aucune fuite RR4** — ni nom d'observable, ni palier, ni note. **Le texte
  intégral est au relevé de séance.**
- [x] **C4L10A-11 · LES DEUX TEMPS DE CODE NE JOURNALISENT RIEN.** Le journal du dépôt réel porte
  **cinq lignes** — `p1, p1, p2, p2, retour` — et **aucune** ligne `code1` ni `code2` : « la `phase`
  dit l'étage, pas le nombre d'appels », et les deux temps de code **ne sont pas des appels**.
- [x] **C4L10A-12 · `arrondi.ts` NE SERT PAS ICI, ET C'EST VÉRIFIÉ.** Le piège de l'arrondi ne mord
  que là où l'on arrondit : `grep round( copies-tests/argumentation/code.py` ne rend **rien**, le
  module ne calcule **aucune densité** *(« il n'y a pas de densités ici », fiche §4)*, et les deux
  `proportion` du §5 se rendent **non arrondies** — exactement comme `observables.ts` rend un
  `comptage rapporté`. **Rien à arrondir, donc rien à porter.**

### Ce que ce lot vient de LEVER ailleurs dans ce fichier

- [x] **C4L5-2 · La latence à PLUSIEURS compétences en parallèle — LEVÉE le 23/08.** Sa condition de
  reprise était **« LA DEUXIÈME compétence branchée »** ; elle l'est. **Mesure du jour, à DEUX
  compétences** : **52 s** pour 2×P1 + 2×P2 + retour sur un dépôt froid, contre un contrat de moins
  de trois minutes *(trois tours : 47 s, 49 s, 52 s)*. ⭐ **Le contrat tient, et la marge se lit** :
  passer d'une compétence *(39 s au tour de l'Expression)* à deux coûte **~13 s**, et non le double
  — les chaînes tournent bien en parallèle, et le retour est l'appel commun. ⚠️ **À six compétences,
  l'extrapolation reste à faire** : c'est le même appel de retour, mais six chaînes froides.
- [x] **C4L10E-16 · La latence à deux compétences — LEVÉE le 23/08** *(= C4L5-2 ci-dessus)*.
- [x] **C4L5-1bis · Le RETOUR engendré, relu sur pièce (RR1-RR4) — SA CONDITION EST LEVÉE, sa
  lecture reste.** *« Reste à jouer sur une copie qui porte au moins une réussite au relevé — la
  seule condition qui manque »* : **c'est fait le 23/08**, le retour est sorti et son texte intégral
  est au relevé. Ce qui reste est la **relecture RR1-RR4 par le professeur** — automatiquement, seule
  RR4 est contrôlée. ⚠️ **Et la première lecture a déjà trouvé quelque chose** : le retour **invente
  un passé** (« la fois précédente, ces liens étaient presque absents ») alors qu'**aucun état
  antérieur ne lui a été servi**. *Porté au registre des ouverts, item 49.*
  > ✅ **PASSE DE RÉCONCILIATION DU 28/08 — LE GESTE EST JOUÉ ; CE QUI RESTE EST UNE
  > DÉCISION, ET UNE DÉCISION N'EST PAS UN RESTE DE RECETTE.** La relecture RR1-RR4 **a été faite
  > le 23/08 au soir**, à l'outil dédié `scripts/recette/relecture-rr-c4l5.mjs`, **sur les trois
  > retours en base** : **RR2, RR3 et RR4 vertes**. ⚠️ **Il reste UN point, et il est à Louis** —
  > l'ouverture *« Tu as eu une intuition juste… »*, à la frontière de RR1, qui autorise la
  > tentative mais interdit d'inférer une cause dans la tête de l'élève. **Ce point vit au registre
  > des ouverts**, pas ici ; la ligne de recette, elle, a rendu ce qu'on lui demandait.
- [x] **C4L10E-14 · Le retour engendré sur une copie qui porte une réussite — MÊME LEVÉE, même
  reste** *(voir C4L5-1bis)*.
  > ✅ **PASSE DE RÉCONCILIATION DU 28/08 — LE RETOUR EST SORTI, ET LA RELECTURE AUSSI.**
  > Le geste demandé — un retour engendré sur une copie qui porte une réussite citable — **est fait
  > depuis le 23/08**, et la relecture RR1-RR4 qui lui restait accrochée l'est aussi *(voir
  > `C4L5-1bis`)*. ⚠️ **Ce que la « condition de reprise nommée » décrit n'est pas cette
  > vérification** : c'est le cas de la copie SANS aucune réussite, où le retour est
  > **structurellement impossible** — la règle 2 en exige une citée, la règle 1 interdit de
  > l'inventer. **C'est l'item 46 du registre des ouverts, une décision de Louis**, et il y reste
  > entier.
- [x] **C4L10E-15 · Les compétences qui restent — ELLES NE SONT PLUS CINQ MAIS QUATRE.** `structure`,
  `connaissance`, `synthese`, `questionnement` sont dérivées et en attente de branchement.
  **Condition de reprise inchangée : C4-L10 rejoué pour chacune.** *Les trois obstacles nommés au
  tour de l'Expression tiennent tous les trois — la Synthèse dont `code1` ne rend pas `document_p2`,
  la Connaissance dont `pre_p1` prend le TEXTE, la Structure et son `prepare_copie` face au correctif
  CRLF.*
  ✅ **AMENDÉ PAR C4-L7 (24/08) — ÉPUISÉE : LES SIX SONT OUVERTES.**
  `competencesEnAttenteDeBranchement()` rend **`[]`**, `verifierCoherence()` rend **`[]`**, et
  C4-L10 ne se rejoue plus. ✅ *L'identifiant a été RENOMMÉ le 24/08 — il portait `C4L10-15`, il
  porte `C4L10E-15` : voir `C4L7-9`. L'entrée est ici, sous l'Expression ; les deux lignes de même
  nom, à l'Argumentation et à la Structure, la METTENT À JOUR — elles ne la dupliquent pas.*

### Ce qui reste à jouer en recette

- [ ] **C4L10A-13 · LE SMOKE PROF ET ÉLÈVE À L'ÉCRAN.** Rien n'a été vu dans un navigateur : tout ce
  qui précède est prouvé **par requête et sur pièce**, jamais à l'œil. À voir : la tuile de la
  fabrique, qui doit maintenant dire **deux** compétences ouvertes. **Condition de reprise :
  `fabrique_actif` ouvert le temps du smoke, et refermé après.** *Le même reste que C4L10E-13.*
- [x] **C4L10A-14 · ✅ LE BLOC `# SORTIE` DE P2 DÉCLARE ENFIN SES QUATRE TESTS — CORRIGÉ LE 29/08,
  FICHE EN 4.4, ET IL ÉTAIT MOINS UNE.**
  ⛔⛔ **LE DÉFAUT AVAIT DÉJÀ TIRÉ EN PRODUCTION, et c'est Louis qui l'a signalé** — j'avais conclu
  « aucun run n'existe » en ne mesurant que le BANC de calibration *(7 manifestes, tous de juillet)*,
  sans mesurer la PLATEFORME. Lu en prod avant de corriger :
  `garant_ambigu` **0 sur 53 mesures / 53** · `garant_vague` **0 sur 53 / 53**, sur **52 élèves**,
  **zéro variance** — quand `bloc_relie` de la Structure variait normalement à côté
  *(`{"0":37,"1":4,"n/a":10,"0.5":1}`)*. **C'est le contraste qui fait la preuve** : la chaîne SAIT
  écrire des valeurs variées ; ces deux-là ne pouvaient structurellement pas en prendre.
  ⭐ **Aucun élève n'en a vu** : les **168 lignes de niveau sont toutes en `profil_provisoire`**, et
  sous ce drapeau la lettre est tue *(`utils/moteur/etat.ts`, `app/eleve/moi/page.tsx:111`)*.
  ⭐⭐ **CE N'ÉTAIT PAS UN ARBITRAGE — LE CODE AVAIT DÉJÀ TRANCHÉ**, et je l'avais présenté à tort
  comme une décision de conception. Le module *(`TESTS_TERMES = {sens → ambigu, contour → vague}`)*,
  le portage TypeScript, **et les autotests du module lui-même** *(`{"test": "sens", "vers":
  "ambigu"}`)* portaient déjà la forme. Pour les tests 3 et 4, `vers` porte **la marque** et le
  statut ne change pas. **Seul le schéma était plus étroit que le contrat** — et il contredisait le
  corps du même prompt, dont les sections « Test 3 — LE SENS » et « Test 4 — LE CONTOUR » sont
  écrites en entier, et dont la liste des cinq mouvements permis nomme « marquée ambigu » et
  « marquée vague ».
  ⭐ **Le geste** : `"test": "distinction | source | sens | contour"` et
  `"vers": "implicite | cosmetique | ambigu | vague"`, `competences/argumentation.md` **4.3 → 4.4**,
  puis `derive-instruments.py --ecris` **joué EN DERNIER** — deux dérivés touchés, `MANIFESTE.ts` et
  `competences/argumentation.ts`, puis **IDENTIQUE**.
  ⭐ **La chaîne de bout en bout est vérifiée** : l'artefact dérivé porte les quatre valeurs et
  `"version": "4.4"` · `utils/chaine/instruments.ts:37` importe cet artefact-là *(pas la fiche)* ·
  et le code transforme bien `test: sens` en `garant_ambigu` — c'est le **BALAYAGE « les 4 tests du
  crible × les 4 statuts déclarables »**, 16 cas, **qui existait déjà et qui passait**.
  ⚠️⚠️ **ET C'EST LA LEÇON** : le code n'a JAMAIS été en cause, ses tests non plus. **Aucun test ne
  peut vérifier ce qu'un modèle CHOISIT d'émettre** — seul un schéma trop étroit le lui interdit, en
  silence. `npm test` **1921/1921** ici comme avant la correction.
  ⭐ **POURQUOI ÇA SE RATTRAPE SANS RÉPARATION** : la fenêtre d'évidence est de **4**
  *(`FENETRE_EVIDENCE`)* et il n'y a **qu'une mesure par élève** (53 pour 52). Corrigé **avant
  l'ouverture du segment 2, lundi 31/08**, la quinzaine de calibration remplit la fenêtre de mesures
  justes et **les 53 fautives en sortent d'elles-mêmes** avant la bascule du 14/09. ⭐ **Filet si
  besoin** : re-poser `competences_statut_recette.statut_recette_pose_le` *(posé au 25/08 16:50 pour
  l'Argumentation, donc antérieur aux mesures)* écarte d'un coup tout ce qui précède —
  `utils/routeur/mesure.ts:132`, mécanisme prévu, pas un bricolage.
  ⭐ **La bascule 4.3 → 4.4 rend les mesures d'avant identifiables à la requête**, par
  `competences_mesures.instrument_version`.
  ⚠️ **Une variante plus propre a été ÉCARTÉE, sur décision de Louis : rentrée 2027.** Un champ
  `marque` distinct de `vers` — `vers` veut aujourd'hui dire deux choses selon le test. Elle coûte le
  module, ses trois autotests et le portage, donc un **acte de calibration**, pour un résultat que le
  code produit déjà. *Écrite en entier au `IDEES_post_rentree.md`.* **Dette D2 fermée au registre
  (le compte passe de 7 à 6).**
  **Énoncé d'origine :** Le schéma de sortie du prompt de jugement écrit `"test": "distinction | source"`
  et `"vers": "implicite | cosmetique"`, quand le §4 en pose **quatre** et que le module lit les
  quatre dans la même liste. **Un juge fidèle à son schéma n'émettra jamais de `sens` ni de
  `contour`** → `garant_ambigu` et `garant_vague` valent **structurellement 0**, toujours réussis, et
  **le seuil d'Acquis ne se ferme jamais sur une marque**. ⛔ **Le prompt ne se retouche pas depuis
  une session Code** : `[faux]` posé à la fiche *(hors des marqueurs — le prompt est dérivé)*,
  correction écrite au registre des ouverts, **dette D2**. **Condition de reprise : une séance de
  conception, AVANT le Run 1 de l'Argumentation** — après le premier run, réviser un prompt devient
  un acte de calibration réglé par le protocole.
- [ ] **C4L10A-15 · LE DÉSACCORD P1 ↔ P2 SUR LA MÊME UNITÉ, VU SUR LES TROIS TOURS RÉELS.** Chaque
  tour a rendu la même alerte : *« requalification (rang 4, source) sans correspondance avec une
  unité "explicite" ou "implicite" — consignée, jamais appliquée »*. **P1 a déclaré l'unité Rousseau
  `circulaire`** ; **P2 a voulu la requalifier en `cosmetique` au test de la source**, qui ne mord
  que sur `explicite` et `implicite`. Le garde-fou `requalification_inappariable` a fait exactement
  ce que la fiche demande — consigner sans appliquer —, et `source_cosmetique` **vaut 0 alors que la
  source cosmétique est le défaut le plus visible de la copie**. ⛔ **Ce n'est pas un défaut du
  portage** : les deux juges lisent la même unité différemment, et le code refuse de trancher.
  **Condition de reprise : le Run 1 de l'Argumentation**, qui dira si le cas est fréquent — et, s'il
  l'est, si c'est le P1 qui sur-déclare `circulaire` ou le P2 qui déborde de ses statuts d'entrée.
- [ ] **C4L10A-16 · LE `delta_v1_vf` DE L'ARGUMENTATION — sa fiche se tait, comme celle de
  l'Expression.** Le branchement **ne déclare pas de `delta`** ; la chaîne le dit par une alerte et
  laisse **NULL**. ⚠️ **Deux fiches sur deux se taisent** : ce n'est plus un oubli de l'Expression,
  c'est une case du gabarit du `03-` §1 que personne n'a remplie. **Condition de reprise : une fiche
  qui DÉFINIT son delta** *(= C4L5-4)*. *Registre des ouverts, item 47, amendé.*
- [ ] **C4L10A-17 · LE CONTRÔLE D'EXISTENCE DES CITATIONS N'EXISTE PAS SUR L'ARGUMENTATION.** Son P1
  rend du verbatim (`garant_cite`) et le `CONTRAT-MODULES.md` §3 rend le contrôle **obligatoire** ;
  **deux modules sur six le portent, et pas celui-ci** *(§8, `[à valider]`)*. ⛔ **Ne pas l'inventer
  dans le branchement** : ce serait ajouter une règle que le module n'a pas. **Condition de reprise :
  la condition de fermeture du pari, le premier lot réel** — qui dira quelle part des alertes sont de
  vraies inventions et quelle part des artefacts de normalisation. *Le tour de recette a d'ailleurs
  vu le contrôle de l'**Expression** lever **2 citations infidèles** sur la même copie.*
- [x] **C4L10A-19 · ⭐ LA FICHE EST PASSÉE DE 4.2 À 4.3 PENDANT LE LOT, et dans le sens du
  portage.** Une séance de conception a nommé, le 23/08 en cours de séance, **la population des deux
  observables `proportion`** — « proportion **des unités du décompte** », aux deux endroits (table du
  §5 et champ `sens` du bloc machine) — et changé `nb_limites` de « **nombre** » à « **part** », ce
  qui confirme aussi la division du `comptage rapporté`. **C'est mot pour mot la lecture que le
  branchement avait prise** *(registre des ouverts, item 48 : déposé et **clos le jour même**)*.
  **Rien à changer dans le code** ; instrument re-dérivé en **4.3**, `--verifie` **IDENTIQUE**, et
  le `[faux]` du §7 **a survécu** à l'amendement — la dette D2 reste ouverte. ⚠️ **UNE SEULE CHOSE
  ÉTAIT CASSÉE** : la recette épinglait `'4.2'` **en dur**, à deux endroits ; elle lit désormais
  `MANIFESTE_LU.competences.argumentation.version`. *Une version recopiée dans un contrôle rougit
  pour une raison qui n'en est pas une ; savoir si le dérivé a divergé de sa source est le travail
  de `--verifie`, et de lui seul.*

- [ ] **C4L10A-18 · `seuil_franchi` RECOUVRE DEUX CHOSES, ET LE CONTEXTE NE PERMET PAS DE LES
  SÉPARER.** Le `non` dit tantôt « l'élève n'a pas franchi », tantôt « l'élève **n'a pas pu** » —
  *« un exercice qui ne porte qu'une ou deux unités sans place pour une objection ne peut pas faire
  franchir le seuil »* (fiche §6). Le second cas est un observable **sans objet**, à qui le contrat
  prescrit `n/a` ; **mais le contexte promis au branchement ne porte ni l'objet, ni la section
  d'instance** (`CONTRAT-MODULES.md` §8, `[à valider]`). **Le portage rend le comportement du module
  tel qu'il est** — `oui`/`non`, jamais `n/a`. **Condition de reprise : l'arbitrage de ce que le
  CONTEXTE doit porter**, qui n'est pas une règle de notation.

---

## C4 · L10 — L'ouverture d'une compétence dans la chaîne : la STRUCTURE (sandbox, 23/08)

_Section ouverte le 23/08 à la clôture du lot. **Aucune migration** : ce lot ne touche que du code,
un dérivé et un `[faux]` de source — le suivi SQL n'a pas bougé, et n'avait pas à bouger._

_Ce qui a été prouvé EN SÉANCE est coché avec sa preuve. `npm test` : **1116 passés, 0 échoué**
(dont **32 neufs** sur ce portage ; l'état d'entrée était 1083/1083, plus une entrée de registre
mise à jour) ; `npx tsc --noEmit` : rien ; `npx eslint` sur les fichiers du lot : **0 erreur**,
2 avertissements sur des paramètres de contrat volontairement non lus, chacun commenté — les mêmes
que sur l'Argumentation ; `python3 scripts/derive-instruments.py --verifie` : **IDENTIQUE** sur les
dix dérivés ; `scripts/recette/structure-c4l10.mjs` : **60 contrôles, 60 passés**, joués **par le
même code que la route**, en base, sur un **dépôt réel à TROIS compétences** et **sept vrais appels
de modèle**, décor semé puis **retiré** (aucun reste, vérifié par requête)._

⛔ **AUCUN STATUT DE RECETTE N'A ÉTÉ POSÉ, et aucun n'est proposé.** La Structure est
`mesuree_silencieusement` — son état de naissance. **Rien n'a changé pour un élève.**

⚠️ **`chaine_actif` est REVENU à OFF**, vérifié par requête à la fin de chaque tour de recette.

### Ce qui est prouvé — pour ne pas le rejouer

- [x] **C4L10S-1 · LA STRUCTURE EST OUVERTE — dérivée, importée, branchée.**
  `derive-instruments.py --resume` la déclare **ouverte** en **v3.3**, `--verifie` dit **IDENTIQUE**,
  `verifierCoherence()` rend **[]**, et `competencesOuvertes()` rend
  **`expression, argumentation, structure`**. Les trois qui restent —
  `connaissance, synthese, questionnement` — sont **dérivées et en attente**, et
  `competencesEnAttenteDeBranchement()` les nomme.
- [x] **C4L10S-2 · ⭐⭐ LA CONTRE-ÉPREUVE DES 112 COUPLES RÉELS — la preuve que les cinq autres
  compétences n'auront pas.** `TESTS_P2_PARFAIT` est **vide**, `TESTS_CODE1_PARFAIT` porte **UN**
  vecteur, `VERSION_GOLDS_TESTEE` vaut **None** : les vecteurs embarqués ne prouvent presque rien.
  ⚠️ **Et les « 9 golds » du dossier `golds/` n'en sont pas** : ce sont neuf `Gabarit-CopieN.doc`,
  des **gabarits Word vides**. La fiche §9 le dit — *« le fichier qui fait foi est
  `gold-structure.md`, celui qui porte un `version_golds` — **il n'existe pas encore** »*. **La
  Structure repart au Run 1, golds d'abord.**
  Mais `copies-tests/structure/resultats/` porte **112 couples (P1, P2) RÉELLEMENT PRODUITS PAR LE
  BANC** — 15 du 17/07, 27 du run du 30/07, 70 des trois bancs nichés 5×5. **Les deux côtés les
  rejouent sur les mêmes entrées, et LES TROIS CLÉS sont identiques** : `verdicts`, `trace` mot pour
  mot, `alertes`. **Aucun appel, aucune dépense.** ⭐ Ils portent ce qu'aucun vecteur synthétique ne
  porte : des accents, des apostrophes typographiques, des `niveau` hors catalogue, des
  `parties[].blocs` en dictionnaires, **deux générations de schéma de squelette**, et un P2 qui
  rendait encore des niveaux. ⚠️ **Et il a fallu les DÉSENVELOPPER** : les `-p2.json` du 30/07 ne
  portent pas la sortie de P2 mais une **enveloppe de run** `{jugements_modele, calcul_code}` ; passée
  telle quelle, elle n'a ni `doublon` ni `retour_en_arriere`, et **les 97 couples tombaient tous en
  `PASSAGE MANQUÉ`** — la contre-épreuve était verte et ne prouvait qu'une chose : que les deux côtés
  savent refuser une sortie tronquée. *Les **65** qui restent en `PASSAGE MANQUÉ` après
  désenveloppage sont les vrais : leur P2 est d'avant la v1.4 et ne rend pas les deux booléens
  obligatoires — « le silence du juge ne vaut jamais acquiescement », sur pièce.*
- [x] **C4L10S-3 · LE BALAYAGE — 1 254 cas de plus, dans la même fonction du même module.** Neuf
  familles : **400** distributions de charnières × tissu *(A6, A7)*, **210** statuts déclarés et
  notes de « limite », **336** états du socle de la cohérence *(A1)*, **96** croisements de la
  cascade A10, **96** paliers couvrant **les seize cellules** du croisement, **76** textes de la
  RECETTE, **23** découpages de `prepare_copie`, **17** valeurs d'énumération bordées de blancs, et
  **27** formes illisibles. **Il n'invente aucune règle** — il cesse de ne la demander qu'une fois.
- [x] **C4L10S-4 · ⭐⭐ L'ÉPREUVE NÉGATIVE — 29 MUTATIONS, 29 TOMBÉES.** Le portage a été cassé
  **règle par règle**, et le contrôle a été regardé. **Cinq ont survécu au premier passage**, et
  l'avertissement de la boîte aux lettres s'est vérifié : **TROIS des cinq étaient dans la
  TÉLÉMÉTRIE**. La parade a été celle qu'elle prescrit — des comptes **asymétriques**, et **au moins
  un élément écarté du décompte qui porte quand même la propriété mesurée** :
  · `bloc_relie` — une couture de tissu à **relation illisible** *(la seule chose qui sépare
  « du tissu » de « des relations lisibles »)* ;
  · `derive` — un bloc de **service déclaré « hors annonce »** *(la seule chose qui sépare « les
  blocs de développement » de « tous les blocs »)* ;
  · `promesse_presente` — les cas où **UN SEUL** des deux termes du « et/ou » est présent ;
  · le garde-fou Absent — **deux formes hors catalogue** *(« question posée » l'ouvre, « tension » ne
  l'ouvre pas)*, parce que toute forme DU catalogue rend Absent inatteignable et laisse la lecture
  stricte inéprouvable ;
  · `_n()` — des valeurs d'énumération bordées de **`\x85`, `\x1f` et de la BOM**.
  ⭐ **Au deuxième passage, les 29 tombent.** *Le fichier est restauré à l'identique après chaque
  mutation, vérifié par `diff`.*
- [x] **C4L10S-5 · ⭐⭐ LES QUATRE ÉCARTS DE LANGAGE, ET UN CINQUIÈME QUE CE LOT A TROUVÉ.**
  `utils/chaine/python.ts` en portait quatre depuis l'Argumentation ; **la Structure en a ajouté
  un** : **les blancs de Python ne sont pas ceux de JavaScript.** Vérifié caractère par caractère —
  Python tient `\x1c`-`\x1f` et `\x85` pour des blancs, JavaScript non ; JavaScript tient la BOM
  pour un blanc, Python non. Or `_n()` fait un `strip()` **de Python** sur TOUTES les valeurs
  d'énumération du squelette, et `prepare_copie` découpe sur `\n\s*\n+`. ⚠️⚠️ **CE QUE ÇA COÛTE, ET
  ÇA NE SE VOIT PAS** : une ligne « vide » faite d'un `\x85` est une **frontière de bloc** pour
  Python et pas pour JavaScript — donc **une couture de plus ou de moins** ; et « étape 1 » et
  « étape\x1f1 » sont **la même étape** pour Python — donc du TISSU — et deux étapes différentes
  pour JavaScript — donc une **CHARNIÈRE**. ⭐ **Deuxième trouvaille, et elle est cent fois plus
  fréquente** : le `\w` de Python est UNICODE. Vérifié — **« la 3ème partie » ne contient AUCUN
  nombre pour lui**, et « café3 » non plus. Porté naïvement, le contrôle de recette aurait accusé le
  juge d'avoir compté **à chaque copie qui écrit « 3ème »**. Le module de formes porte désormais
  `CAR_BLANC_PYTHON`, `CAR_MOT_PYTHON`, `CAR_CHIFFRE_PYTHON`, `strip`, `remplaceBlancs`, `estVrai`,
  `itere`, `longueur` et `trie` — **écrits une fois, pour les six**.
- [x] **C4L10S-6 · ⭐ `prepare_copie` NE SE CONTREDIT PAS AVEC LE CORRECTIF CRLF — l'obstacle annoncé
  n'en était pas un.** Vérifié sur pièce : `normaliserRetours()` ramène `\r\n?` à `\n` **et ne
  nettoie rien d'autre** ; il tourne à **l'ÉCRITURE** du dépôt (`utils/deroule/depot.ts`).
  `prepare_copie` découpe et renumérote à la **LECTURE**. Le premier garantit au second que ses `\n`
  sont des `\n`. ⭐ **Et le crochet tient même sur du CRLF brut** — son `\n\s*\n+` avale le `\r` —,
  ce qui est précisément **ce qui rendait le défaut de C4-L4 invisible de ce côté-ci** : ce n'est
  jamais `prepare_copie` qui planchait, c'est `blocs()`. ⚠️ **UNE SEULE NUANCE, RELEVÉE ET NON
  ARBITRÉE** : `blocs()` coupe sur `\n[ \t]*\n+`, le module sur `\n\s*\n+`. **Une ligne « vide »
  faite d'une espace insécable est UNE frontière pour la Structure et AUCUNE pour l'écran de
  l'élève** — le compteur de blocs qu'il voit et celui que la mesure lit divergeraient d'un. Un test
  le fixe dans les deux sens.
- [x] **C4L10S-7 · LES HUIT OBSERVABLES DU §5 ONT TOUS UNE VALEUR, OU LEUR ALERTE NOMMÉE.** Vérifié
  sur **les 1 366 passages** du corpus : pour chacun des huit, ou bien le relevé porte une entrée, ou
  bien une alerte commence par son code — **jamais ni l'un ni l'autre, jamais les deux**. ⭐ **Et un
  `PASSAGE MANQUÉ` ne les fait pas taire** : sept des huit ne dépendent d'aucun des deux jugements
  manquants, et ils se rendent quand même ; **seul `derive` dit son alerte**. *Les perdre serait
  perdre sept signaux d'escalade sur une copie que la chaîne a pourtant lue.*
- [x] **C4L10S-8 · LES DEUX DÉNOMINATEURS SONT DES PHRASES, et le relevé les porte.**
  `charniere_formule` se rapporte à **« les charnières du squelette »**, `derive` à **« les blocs de
  développement »** — `observables.ts` cherche l'entrée **sous ce nom exact**. Un test les échange
  volontairement et le contrôle tombe.
- [x] **C4L10S-9 · ⭐⭐ CE QUE PORTER RETIRE, MESURÉ SUR LE CORPUS RÉEL.** Le P2 de la Structure
  ouvre la route de la promesse sur *« problème **et/ou** plan annoncés »*, et « les deux modèles
  réparaient le et/ou sans le dire ». **Le code applique le texte.** Compté sur les 112 couples :
  **69 portent UN SEUL des deux termes** *(60 un problème seul, 9 un plan seul)* — sur ces 69, le
  code ouvre la route là où un « et » la fermerait. ⚠️ **Et la route ouverte est PLUS FACILE** : sa
  clause « étapes réalisées dans l'ordre » devient vide sans annonce, et sur une copie faible cela
  donne `défaillance` au lieu de `défaillance forte`. **C'est la coupure D/C du routeur, et elle
  tient à un « ou ».** *L'écart est nommé, mesuré, et il ne se corrige pas : la fiche fait foi.*
- [x] **C4L10S-10 · LE CONTRÔLE GRATUIT DU CONTRAT §7 — ce que le modèle réparait, cas par cas.**
  **Onze motifs d'alerte nommés** sont rencontrés sur le corpus réel : `PASSAGE MANQUÉ` (65),
  `RECETTE` (27), `CONFORMITE` (27), `CRIBLE_NON_APPARIE` (26),
  `GARDE_FOU_REINTEGRATION_SEUILS` (21), `PROMESSE_INCOHERENTE` (14), `SQUELETTE_INCOHERENT` (15),
  `NIVEAU_HORS_CATALOGUE` (12), `COPIE_SANS_COUTURE` (3), `OBJETS_DISTINCTS_HORS_PERIMETRE` (3),
  `TROU_DECLARE_ACQUIS` (1). **Le portage n'a eu à en créer aucune** — c'est le bénéfice de
  l'extraction. ⚠️ **QUATRE CAS Y ÉCHAPPENT POURTANT**, et ils sont au registre des ouverts *(item
  51)* : une `relation_nommee` illisible **(68 fois sur 112)**, un `entre` illisible **(11 fois)**,
  un `statut` et un `role` hors catalogue. ⛔ **Le portage ne les a pas ajoutées** : une alerte de
  plus ferait diverger la troisième clé, et le « fait quand » exige l'identité.
- [x] **C4L10S-11 · LE PORTAGE NE LÈVE JAMAIS.** **Quinze** des vingt-sept formes du balayage font
  **lever le module** — `.get` sur un non-dictionnaire, `for … in` sur un nombre, `len()` sur un
  entier —, quand le contrat §3 l'interdit. Chacune rend ici **une alerte nommée**, et un verdict
  sort quand même. ⭐ **Et une forme n'est PAS un durcissement mais la sémantique** : une CHAÎNE est
  itérable en Python et rend ses caractères, donc `gestes: "manque"` ne porte **aucun** geste
  « manque ». Un portage qui la lirait comme un geste unique **inventerait une motivation** et
  ferait monter la copie d'un cran.
- [x] **C4L10S-12 · LE DÉPÔT RÉEL, À TROIS COMPÉTENCES.** Sept appels, **TROIS squelettes**, **TROIS
  mesures**, la lettre **C** pour la Structure, ses **huit** observables écrits, `delta_v1_vf` à
  **NULL**, une ligne d'`api_couts` **par appel** (`p1, p1, p1, p2, p2, p2, retour`) et **aucune**
  pour `code1`/`code2`. **Reprise** : aucune seconde mesure, aucun second squelette. ⭐ **P1 a rendu
  EXACTEMENT autant de blocs que la copie en portait de paragraphes** (5 pour 5) — « le découpage
  t'est donné, tu n'en fusionnes aucun » —, **et il n'a qualifié aucune jointure** : ni `statut`, ni
  `niveau`, exactement comme la fiche §3 le pose.
- [x] **C4L10S-13 · ⭐ LA `cible_primaire` BAT L'ORDRE ALPHABÉTIQUE, sur trois instances.** Le repli
  aurait dit « argumentation » dans les trois cas ; il ne sert que sur celle qui ne vise rien, et
  **l'alerte tombe**. *C4-L11 tenait sa promesse ; le piège de l'alphabet ne mord pas.*
- [x] **C4L10S-14 · ⭐ LA LATENCE À TROIS COMPÉTENCES : 55 s.** Contre **39 s à une** (Expression) et
  **47-52 s à deux** (Argumentation), pour un contrat de moins de trois minutes. ⭐ **La marge se
  lit, et la courbe est plate** : passer de deux à trois coûte **~4 s**, quand passer d'une à deux en
  coûtait ~13 — les chaînes tournent bien en parallèle, et le retour est l'appel commun.
  ⚠️ **À six, l'extrapolation reste à faire.**
- [x] **C4L10S-15 · LE RETOUR ENGENDRÉ ET LU — trois points, RR4 propre.** Le retour est sorti,
  segmenté en trois points à identifiant stable, `published_at` **NULL**, registre `descriptif`. Son
  texte intégral est au relevé de cette séance. **Aucun nom d'observable, aucun palier, aucune note**
  n'y paraît. ⭐ **Et le point 2 porte bien sur la Structure** — la charnière rétrogradée —, avec sa
  citation exacte et son levier.
- [x] **C4L10S-16 · AUCUN CANAL N'A ÉTÉ AJOUTÉ AU SOCLE.** La promesse de l'item 1 de la boîte aux
  lettres tient pour la **troisième** fois : `BranchementCompetence` n'a pas bougé, et
  `prepareCopie` — le seul crochet que la Structure ouvre pour de bon — **y était déjà**, posé par la
  séance Expression sans client. *Le seul ajout est au module de FORMES, pas à l'interface.*

### Ce que ce lot vient de LEVER ailleurs dans ce fichier

- [x] **C4L10E-15 · Les compétences qui restent — ELLES NE SONT PLUS QUATRE MAIS TROIS.**
  `connaissance`, `synthese`, `questionnement` sont dérivées et en attente de branchement.
  **Condition de reprise inchangée : C4-L10 rejoué pour chacune.** ⭐ **ET LE TROISIÈME OBSTACLE
  NOMMÉ AU TOUR DE L'EXPRESSION EST TOMBÉ** — « la Structure et son `prepare_copie` face au
  correctif CRLF » n'en était pas un *(voir C4L10S-6)*. **Les deux autres tiennent** : la Synthèse
  dont `code1` ne rend pas `document_p2`, la Connaissance dont `pre_p1` prend le TEXTE.
  ✅ **AMENDÉ PAR C4-L7 (24/08) — ÉPUISÉE : LES SIX SONT OUVERTES.** `competencesEnAttenteDeBranchement()`
  rend **`[]`** et `verifierCoherence()` rend **`[]`**, constatés à l'entrée du lot ; les six
  `*.test.ts` de branchement sont là. **C4-L10 ne se rejoue plus** : cette entrée ne peut plus
  attendre personne. ⚠️⚠️ **ET UN DÉFAUT D'IDENTIFIANT, RELEVÉ AU PASSAGE** — `C4L10-14`, `C4L10-15`
  et `C4L10-16` apparaissaient **dans TROIS sections** *(Expression, Argumentation, Structure)* : la
  renumérotation du 23/08 au soir a créé `C4L10A-`, `C4L10S-`, `C4L10C-`, `C4L10Q-` et `C4L10SY-`
  **mais n'avait pas couvert l'Expression**, restée sous le préfixe nu. Un `grep C4L10-15` rendait
  donc trois lignes. ✅ **RÉPARÉ LE 24/08 : la série de l'Expression porte `C4L10E-`**, et les trois
  lignes se lisent pour ce qu'elles sont — **une entrée et deux mises à jour**, le patron même de
  `C4L5-2` et de `C4L5-1bis`. Voir `C4L7-9`.
- [ ] **C4L5-4 · Le `delta_v1_vf` — TROIS FICHES SUR TROIS SE TAISENT, et la troisième compte
  dessus.** Condition de reprise **inchangée** : *une fiche qui DÉFINIT son delta*. ⚠️ **Mais elle
  s'est durcie** : `competences/structure.md` ne le définit nulle part **et son §8 en fait l'arbitre
  empirique de sa seule vraie question ouverte** — *« la pondération cohérence/cohésion … arbitre
  empirique possible : les deltas v1→vf »*. **Elle s'appuie sur une grandeur que rien ne calcule.**
  *Registre des ouverts, item 47, amendé.*
- [x] **C4L5-1bis · Le RETOUR relu sur pièce (RR1-RR4) — un deuxième retour est disponible.** La
  condition était levée depuis le 23/08 ; **le tour de la Structure en a engendré un second**, sur
  une copie différente et à trois compétences. Son texte intégral est au relevé. **Ce qui reste est
  toujours la relecture RR1-RR4 par le professeur** — automatiquement, seule RR4 est contrôlée.
  ⭐ **Bonne nouvelle sur l'item 49** : ce retour-ci **n'invente aucun passé** — il ne porte aucune
  comparaison temporelle. *Un cas ne fait pas une garde ; la question reste ouverte.*
  > ✅ **PASSE DE RÉCONCILIATION DU 28/08 — LE GESTE EST JOUÉ ; CE QUI RESTE EST UNE
  > DÉCISION, ET UNE DÉCISION N'EST PAS UN RESTE DE RECETTE.** La relecture RR1-RR4 **a été faite
  > le 23/08 au soir**, à l'outil dédié `scripts/recette/relecture-rr-c4l5.mjs`, **sur les trois
  > retours en base** : **RR2, RR3 et RR4 vertes**. ⚠️ **Il reste UN point, et il est à Louis** —
  > l'ouverture *« Tu as eu une intuition juste… »*, à la frontière de RR1, qui autorise la
  > tentative mais interdit d'inférer une cause dans la tête de l'élève. **Ce point vit au registre
  > des ouverts**, pas ici ; la ligne de recette, elle, a rendu ce qu'on lui demandait.
- [x] **C4L10E-14 · Le retour engendré sur une copie qui porte une réussite — MÊME LEVÉE, même
  reste** *(voir C4L5-1bis)*.
  > ✅ **PASSE DE RÉCONCILIATION DU 28/08 — LE RETOUR EST SORTI, ET LA RELECTURE AUSSI.**
  > Le geste demandé — un retour engendré sur une copie qui porte une réussite citable — **est fait
  > depuis le 23/08**, et la relecture RR1-RR4 qui lui restait accrochée l'est aussi *(voir
  > `C4L5-1bis`)*. ⚠️ **Ce que la « condition de reprise nommée » décrit n'est pas cette
  > vérification** : c'est le cas de la copie SANS aucune réussite, où le retour est
  > **structurellement impossible** — la règle 2 en exige une citée, la règle 1 interdit de
  > l'inventer. **C'est l'item 46 du registre des ouverts, une décision de Louis**, et il y reste
  > entier.

### Ce qui reste à jouer en recette

- [ ] **C4L10S-17 · LE SMOKE PROF ET ÉLÈVE À L'ÉCRAN.** Rien n'a été vu dans un navigateur : tout ce
  qui précède est prouvé **par requête et sur pièce**, jamais à l'œil. À voir : la tuile de la
  fabrique, qui doit maintenant dire **trois** compétences ouvertes. **Condition de reprise :
  `fabrique_actif` ouvert le temps du smoke, et refermé après.** *Le même reste que C4L10E-13 et
  C4L10A-13 — il s'accumule, et il se jouera d'un coup.*
- [x] **C4L10S-18 · ✅ SANS OBJET SUR LE CORPUS DE PRODUCTION — mesuré le 29/08, l'arbitrage n'a
  pas à être rendu avant lundi.**
  ⭐ **Mesuré en REJOUANT le vrai code**, jamais en le réimplémentant :
  `BRANCHEMENT_STRUCTURE.code1/code2/releve` sur les **52 squelettes réels de la prod**, lus dans
  `exercices_squelettes` *(script au dépôt : `scripts/recette/structure-population.ts`)*.
  **`relation_nommee` illisible : 0 sur 109 jointures. Copies où les deux lectures divergent au
  seuil de 0,5 : 0 sur 52.**
  ⭐⭐ **Le 68/112 de l'énoncé reste vrai — et il ne vaut que pour le BANC** : l'énoncé le dit
  lui-même, *« sur les squelettes d'avant la v1.4 »*. Le prompt actuel remplit toujours la relation
  lisiblement, donc **le cas qui sépare les deux lectures ne se présente jamais en production**.
  ⚠️ **La question de fond reste ouverte** — deux phrases de la même fiche nomment toujours deux
  populations — **mais elle ne bloque plus rien** : elle redevient de l'hygiène de source, et cesse
  d'être « avant le Run 1 ». *Registre des ouverts, item 50, amendé.*
  ⭐ **Contrôle interne de la rejoue** : le `bloc_relie` écrit en base est égal au §5 recalculé sur
  les 52 copies, **sans un écart** — c'est ce qui autorise à se fier au reste de la mesure.
  ⚠️ **Deux fausses pistes traversées avant d'y arriver, et toutes deux corrigées en mesurant** :
  j'ai d'abord DÉDUIT le tissu total depuis `bloc_relie`, ce qui fabriquait « 0 illisible » par
  construction quand la valeur était 0 *(37 copies sur 42)* — remplacé par la lecture directe de
  `code1.mesures.n_tissu` ; et j'ai d'abord deviné le catalogue des rôles au lieu de le recopier.
  **Énoncé d'origine :** ⚠️⚠️ `bloc_relie` — LE §5 ET LE §4 NE COMPTENT PAS LA MÊME POPULATION. Le §5
  écrit *« proportion **du tissu** dont la relation est nommée »* — le tissu ENTIER, et c'est ce que
  le portage applique. Le champ `sens` du bloc machine l'adosse au **§4, point 4**, qui compare
  `oui > non` et **laisse dehors** toute couture dont la relation est illisible. **Les deux lectures
  divergent sur ce seul cas — et il apparaît 68 fois sur les 112 couples réels.** ⛔ **Le portage a
  suivi la fiche** : elle nomme sa population, et une session Code ne corrige pas une source. **La
  lecture est commentée et fixée par un test discriminant** — si l'arbitrage tombe dans l'autre sens,
  c'est **une ligne à changer**. **Condition de reprise : une décision de Louis sur la population**
  *(registre des ouverts, item 50)*.
- [ ] **C4L10S-19 · ⭐⭐ MESURÉ EN PRODUCTION LE 29/08 — TROIS REPLIS SUR QUATRE SONT MUETS, ET LE
  QUATRIÈME EST CELUI QUE LE BANC N'AVAIT JAMAIS VU. La CAUSE est corrigée ; l'ALERTE reste due.**

  | repli | banc | production *(52 copies)* |
  |---|---|---|
  | (a) `relation_nommee` illisible | 68/112 | **0 / 109** ✅ |
  | (b) `entre` illisible | 11/112 | **0 / 109** ✅ |
  | (c) `statut` hors catalogue | jamais vu | **0** ✅ |
  | (d) **`role` hors catalogue** | **jamais vu** | **⛔ 5 blocs / 161, sur 2 copies** |

  ⭐⭐ **ET LA CAUSE EST NOMMÉE.** Les 5 blocs portent `role: "service"` — une valeur de
  **`correspondance_annonce`**, jamais un rôle. Ce sont des lignes d'en-tête : *« Nom de l'élève »,
  « Indication de thème et période », « Indication de site », « Titre de l'essai et rappel du
  sujet », « identification de l'élève »*. Le code les compte en **blocs de développement**
  *(`dev = blocs.filter(b => !estService(b))`, `structure.ts:395`)*.
  ⭐ **COÛT MESURÉ EN REJOUANT, pas estimé** — le même squelette, une fois avec `role: "service"` et
  une fois avec `role: "intro"` : `bloc_unite` **0,2 → 1** sur une copie, **0,75 → 1** sur l'autre.
  ⭐ **La LETTRE ne bouge pas** *(D reste D, C reste C)* : `bloc_unite` est un observable de
  télémétrie, pas de niveau. ⚠️ **Mais c'est la télémétrie qui pilote l'escalade N1/N2** — deux
  élèves passent pour rater « une idée directrice par bloc » alors qu'ils la tiennent, et **le
  routeur leur enverra le mauvais travail**.
  ✅ **LA CAUSE EST CORRIGÉE À LA SOURCE, fiche Structure en 3.4.** La section
  `# ORTHOGRAPHE DES VALEURS` du prompt P1 listait **à plat les valeurs de TROIS champs différents**
  — `position_idee`, `role` et `correspondance_annonce` mêlées — sous la consigne « recopie
  exactement », **et sans même y faire figurer `"intro"` ni `"bilan"`**. Elle est désormais **rangée
  par champ**, avec l'avertissement qui nomme le piège. `derive-instruments.py --ecris` joué EN
  DERNIER ; l'artefact dérivé porte la liste rangée et `"version": "3.4"`.
  ⚠️ **Cause PROBABLE, et je ne la donne pas pour prouvée** : on ne peut pas démontrer ce qui a
  décidé le modèle sans relancer des appels. Mais la liste était objectivement fautive.
  ⛔⛔ **CE QUI RESTE DÛ, ET C'EST L'ITEM LUI-MÊME** : la correction rend le défaut moins probable,
  **elle ne rend pas l'alerte**. Le contrat §3 veut toujours *« une alerte, pas une valeur par
  défaut »*, et un `role` hors catalogue **retombe toujours en silence sur le développement**.
  **Condition de reprise inchangée : une décision de MODULE, au chantier de conception** — elle
  change le calcul, donc c'est un acte de calibration. *Registre des ouverts, item 51, amendé.*
  **Énoncé d'origine :** ⚠️ QUATRE VALEURS ILLISIBLES DU SQUELETTE NE LÈVENT AUCUNE ALERTE. Le contrat
  §3 veut *« une alerte, pas une valeur par défaut »* ; le module le tient sur onze motifs et le
  manque sur quatre — `relation_nommee` illisible **(68/112)**, `entre` illisible **(11/112)**,
  `statut` et `role` hors catalogue. ⛔ **Ne pas les ajouter au branchement** : ce serait diverger du
  module sur la troisième clé. **Condition de reprise : une décision de MODULE, au chantier de
  conception, AVANT le Run 1 de la Structure** *(registre des ouverts, item 51)*.
- [ ] **C4L10S-20 · ⚠️ LE PARI DU §8 EST ACTIF, ET IL SE VOIT SUR PIÈCE.** *« Le dispositif mesure
  l'architecture TELLE QU'ELLE EST ÉCRITE : une copie saisie sans retour à la ligne est lue comme
  dépourvue d'architecture — défaillance forte, alerte déclarée. »* Le corpus réel le montre **trois
  fois** (`COPIE_SANS_COUTURE`, avec sa RÉSERVE), et **21 fois** le garde-fou de réintégration des
  seuils. ⚠️ **Sa condition de fermeture est une contrainte D'INTERFACE, pas de mesure** — *« une
  interface de rédaction qui garantit le découpage en paragraphes »* *(`07-` §3)*. **Condition de
  reprise : le smoke de l'écran de rédaction**, qui dira si l'élève peut rendre une copie d'un seul
  tenant sans être averti.
- [ ] **C4L10S-21 · ⚠️ LE CONTRÔLE D'EXISTENCE DES CITATIONS N'EXISTE PAS SUR LA STRUCTURE.** Son P1
  rend **quatre champs de verbatim** — `texte_cite`, `fin_bloc_precedent`, `debut_bloc_suivant`,
  `idee_directrice_citee` — et le `CONTRAT-MODULES.md` §3 rend le contrôle **obligatoire** ; le §8
  constate que *« Argumentation, Questionnement, Structure et Synthèse n'en ont aucun »*.
  ⭐ **Le module reçoit pourtant la copie** — `code1` la lit sous `contexte["copie"]` — **et ne s'en
  sert jamais** : le canal est là, le client n'y est pas. ⛔ **Ne pas l'inventer dans le
  branchement.** **Condition de reprise : la condition de fermeture du pari de l'Expression, le
  premier lot réel.**
- [ ] **C4L10S-22 · ⚠️ P1 A SOUS-DÉCLARÉ SES PARTIES MARQUÉES, SUR LE DÉPÔT RÉEL — et la cascade a
  rattrapé.** La copie de recette ouvre deux paragraphes par « D'abord » et « Dans un second temps »,
  que le prompt P1 nomme explicitement comme **marqueurs de partie** ; **P1 a rendu `parties: []`**.
  La charnière est née quand même, **par la troisième branche de la cascade A10** *(deux étapes
  annoncées différentes)*. ⭐ **Les deux routes vers une charnière ne sont donc pas redondantes**, et
  sur cette copie **seule la seconde a servi** — une copie sans annonce de plan n'aurait eu ni l'une
  ni l'autre. ⛔ **Ce n'est pas un défaut du portage** : le code compose ce que P1 consigne.
  **Condition de reprise : le Run 1 de la Structure**, qui dira si la sous-déclaration est fréquente
  — et, si elle l'est, si c'est le prompt qu'il faut resserrer.

---

## C4 · L10 — L'ouverture d'une compétence dans la chaîne : la CONNAISSANCE (sandbox, 23/08)

_Section ouverte le 23/08 à la clôture du lot. **Aucune migration** : ce lot ne touche que du code,
deux dérivés et deux `[faux]` de source — le suivi SQL n'a pas bougé, et n'avait pas à bouger._

_Ce qui a été prouvé EN SÉANCE est coché avec sa preuve. `npm test` : **1160 passés, 0 échoué**
(dont **44 neufs** sur ce portage ; l'état d'entrée était 1116/1116, plus deux entrées de registre
mises à jour — « trois compétences ouvertes » devient quatre) ; `npx tsc --noEmit` : **rien** ;
`npx eslint` sur les cinq fichiers du lot : **0 erreur, 0 avertissement** ; `derive-instruments.py
--verifie` : **IDENTIQUE** sur les dix dérivés, après un `--ecris` rendu nécessaire par le `[faux]`
posé dans la fiche ; `scripts/recette/connaissance-c4l10.mjs` : **54 contrôles, 54 passés**, joués
**par le même code que la route**, en base, sur un **dépôt réel à QUATRE compétences** et **huit
vrais appels de modèle**, décor semé puis **retiré** (aucun reste, vérifié par requête)._

⛔ **AUCUN STATUT DE RECETTE N'A ÉTÉ POSÉ, et aucun n'est proposé.** La Connaissance est
`mesuree_silencieusement` — son état de naissance. **Rien n'a changé pour un élève.**

⚠️ **`chaine_actif` est REVENU à OFF**, vérifié par requête à la fin de chaque tour de recette.

⚠️⚠️ **ET CE LOT SE FERME SUR UN FAIT QUI N'EST PAS UNE PANNE, ET QU'IL FAUT LIRE EN PREMIER : LA
CONNAISSANCE EST BRANCHÉE ET N'ÉCRIRA AUCUNE MESURE TANT QUE LA CHAÎNE NE PORTERA PAS DE CORPUS DE
COURS.** Voir `C4L10C-9`. Tout le reste du lot est fait, prouvé et vert.

### Ce qui est prouvé — pour ne pas le rejouer

- [x] **C4L10C-1 · LA CONNAISSANCE EST OUVERTE — dérivée, importée, branchée.**
  `derive-instruments.py --resume` la déclare **ouverte** en **v2.2**, `--verifie` dit **IDENTIQUE**,
  `verifierCoherence()` rend **[]**, et `competencesOuvertes()` rend
  **`expression, argumentation, structure, connaissance`**. Les deux qui restent — `synthese`,
  `questionnement` — sont **dérivées et en attente**, et `competencesEnAttenteDeBranchement()` les
  nomme.
- [x] **C4L10C-2 · LE PORTAGE REPRODUIT LE MODULE, SUR LES TROIS CLÉS, EN 1 023 CAS.**
  `scripts/vecteurs-connaissance.py` importe `copies-tests/connaissance/code.py` **à chaque
  exécution** — jamais une fixture recopiée —, joue ses crochets et rend ses entrées ET ses sorties
  en JSON ; le test rejoue **les mêmes entrées** et compare `verdicts`, **`trace` mot pour mot** et
  `alertes`. **18 vecteurs `code2` + 4 vecteurs `code1` + 1 001 cas de balayage**, tous identiques.
  ⚠️ **Les types des constantes sont vérifiés, pas seulement leurs tailles** — « chez l'Expression,
  `TESTS_CODE1_PARFAIT` est une CHAÎNE, et un `len()` y a rendu 52 vecteurs qui étaient 52
  caractères ». **Aucun appel de modèle.**
- [x] **C4L10C-3 · ⭐⭐ L'ÉPREUVE NÉGATIVE — 40 MUTATIONS, 40 TUÉES, 0 SURVIVANTE.** Le portage a été
  cassé **exprès, règle par règle**, par un harnais qui patche le fichier et relance le test
  (`.tmp-c4l10/mutations.mjs`, retiré à la clôture). **La télémétrie D'ABORD**, comme le deuxième
  portage l'a appris : 10 mutations sur les huit observables et les deux dénominateurs, 30 sur le
  calcul. ⭐ **Deux ont SURVÉCU au premier passage, et les deux étaient des CHEMINS MORTS**, pas des
  trous — voir `C4L10C-4` et `C4L10C-6`. **Après les deux cas ajoutés pour les atteindre : aucune
  survivante.**
- [x] **C4L10C-4 · ⭐⭐ LA STRICTE INÉGALITÉ DE LA PORTE 2 EST INÉPROUVABLE AUX PARAMÈTRES PAR
  DÉFAUT — vérifié par énumération, pas raisonné.** Inverser `ratio > seuil` en `>=` survivait à tout
  le balayage. **Énumération jusqu'à n = 4 000** : **aucun** couple (unités, invérifiables) ne met le
  rapport EXACTEMENT à 4,5 sans que la PORTE 1 ait déjà arrêté la copie — `200k = 9(k+j)j` n'a pas de
  solution entière sous le plafond. La règle contrôlait donc **un chemin mort**. ⭐ **Elle redevient
  atteignable dès que le seuil bouge, et il bougera** : cinq des six paramètres sont *provisoire
  (réglage empirique)*. À `seuil_ratio_haut = 5.0`, une copie de **cinq unités dont une
  invérifiable** a un rapport de **5,0 pile**. D'où le balayage **aux seuils déplacés** — 108 cas sur
  neuf jeux de paramètres —, et la mutation tombe. *« Cherche toujours si la règle que tu éprouves
  est ATTEIGNABLE par la chaîne ; sinon, tu contrôles un chemin mort. »*
- [x] **C4L10C-5 · ⭐⭐ LE SEPTIÈME ÉCART DE LANGAGE : LE FORMATAGE `%.1f` / `%.2f`.** L'arrondi de
  `round()` était le premier ; **le formatage d'une trace en est un autre, et il n'était pas porté**.
  `"%.1f" % 6.25` vaut **`6.2`** en Python *(round-half-even)* et `toFixed(1)` rend **`6.3`** ;
  `"%.2f" % 0.625` vaut **`0.62`** contre **`0.63`**. ⚠️ **Et l'égalité exacte n'est pas une
  curiosité** : la part d'unités invérifiables vaut `100·k/n`, donc **6,25 % pour UNE unité sur
  SEIZE**, 31,25 % pour cinq sur seize, 12,5 % pour une sur huit. **Aucun des 18 vecteurs ne tombe
  dessus** — ils tombent sur des valeurs rondes. ⭐ `utils/chaine/python.ts` porte désormais
  `formateFlottant()`, **écrit une fois pour les six**, et adossé à `arrondi()` : mesuré identique à
  Python sur douze valeurs, là où `toFixed` divergeait sur trois.
- [x] **C4L10C-6 · ⭐⭐ LE HUITIÈME ÉCART, TROUVÉ AUX SEUILS DÉPLACÉS : `str()` D'UN FLOTTANT
  PYTHON.** `python.ts` le nommait déjà, en le tenant pour théorique — *« cela ne touche QUE des
  textes d'alerte, jamais un verdict »*. **Il touche une TRACE**, et le « fait quand » exige
  l'identité sur les trois clés. Python distingue `5` de `5.0` et écrit `« 5.0 »` ; JavaScript perd
  le type en JSON et écrit `« 5 »`. Au défaut de **4,5** les deux textes coïncident et **rien ne se
  voit** ; le jour où le banc règle `seuil_ratio_haut` sur un entier — ce que le balayage d'un
  paramètre *provisoire* fait —, la trace diverge. ⭐ **Le type ne se retrouve qu'à la DÉCLARATION** :
  un paramètre dont la fiche écrit `bornes: [0.0, 100.0]` est un flottant, `[0, 100]` un entier.
  `python.ts` gagne `strFlottant()`, le branchement un `PARAMS_FLOTTANTS`, et **un test confronte cet
  ensemble aux types Python réels du module** — il ne peut donc pas diverger en silence.
- [x] **C4L10C-7 · ⭐ LA BOM EST LE SEUL BLANC QUI SÉPARE `strip()` DE PYTHON ET `trim()` DE JS —
  et sans l'épreuve négative, le contrôle était vide.** Remplacer `strip()` par `trim()` dans `_n`
  **survivait** : le `.strip()` initial est en effet **REDONDANT** avec le `" ".join(s.split())`
  final, qui retire déjà les blancs de Python aux deux bords. Il ne cesse de l'être que sur **la
  BOM (U+FEFF)**, que `trim()` mange et que `strip()` garde. Vérifié en Python : `_n("﻿reference")`
  vaut `"﻿reference"`, **hors catalogue** — un portage en `trim()` aurait compté le registre,
  **sans une alerte**. Le cas est entré au balayage ; la mutation tombe. *Le NEL, lui, EST un blanc
  pour Python : `"\x85reference\x85"` compte, et sans alerte — les deux sens sont éprouvés.*
- [x] **C4L10C-8 · LES HUIT OBSERVABLES DU §5 ONT TOUS UNE VALEUR, OU UNE ALERTE NOMMÉE — et LES
  DEUX DÉNOMINATEURS AUSSI.** `mobilisation`, `diversite_registres`, `diversite_sources`,
  `taux_justesse`, `contresens`, `unite_plaquee`, `inverifiable`, `etendue_rappel`. ⭐ **Quatre se
  lisent sur ce que le module compte déjà ; les quatre autres demandent les POPULATIONS DE LA
  CASCADE**, que le module calcule en local et ne rend jamais. ⚠️ **Et `rapporte_a` est un TEXTE
  LIBRE dont il existe DEUX valeurs distinctes** — `les unités jugées, les inverifiable exclues (§4)`
  pour `contresens` et `unite_plaquee`, `les unités du relevé` pour `inverifiable` :
  `observables.ts` cherche l'entrée **sous ce nom exact**, et il en manquerait une que les
  observables concernés sortiraient en `n/a` **sans un mot**. Les deux sont au relevé, et un test
  les fixe. ⭐ **`taux_justesse` est la SEULE `proportion` de la fiche, et elle NOMME sa population,
  exclusion comprise** — *« les `inverifiable` hors du dénominateur »* au §5, *« la majorité stricte
  des unités JUGÉES »* au champ `sens` : **les deux endroits disent la même chose**, rien à arbitrer
  *(contrairement à l'Argumentation et à la Structure)*. Un dénominateur nul rend **`null`, donc
  `n/a`, jamais 0**.
- [x] **C4L10C-9 · ⚠️⚠️ UN DÉPÔT RÉEL TRAVERSE LA CHAÎNE, ÉCRIT SON SQUELETTE — ET S'ARRÊTE AU
  JUGEMENT, FAUTE DE CORPUS DE COURS.** Sur un dépôt réel à quatre compétences : **quatre squelettes
  écrits**, celui de la Connaissance portant **son extraction et pas son jugement** — la chaîne s'est
  arrêtée exactement entre les deux. **Le motif est nommé** : `REFUS : preP2 ne peut pas servir
  « corpus_cours » — le contexte de l'exercice ne le porte pas`. ⭐ **C'est le comportement voulu,
  pas une panne** : la Justesse se juge contre **deux référents** et le premier est *« le corpus du
  cours de la classe […] c'est lui qui fait foi quand le cours diverge de la doctrine des manuels »*
  (fiche §1) ; servir un vide au juge aurait produit **une lettre fausse sur un référent absent**.
  ⚠️ **Et la fiche le savait** : son §8 l'écrit dans **« LES VRAIES QUESTIONS OUVERTES »** — *« Le
  corpus de cours n'est déclaré dans aucune source qui fait foi : le `01-routeur.md` §2 le mentionne
  en passant […] Le premier référent de la Justesse repose donc sur un objet que le chantier n'a
  jamais écrit »*, condition de fermeture : *« la séance qui écrira l'assembleur, ou celle qui
  déclarera le corpus dans une source »*. **Vérifié en base, pas supposé** : aucun `corpus_cours`
  n'existe nulle part dans le dépôt, et `contexteExercice` ne sert que `sujet`, `consigne`, `copie`,
  `mode`. ⭐ **Le canal, lui, est bon** : dès qu'un contexte porte un corpus, `pre_p2` le sert —
  éprouvé dans la recette. **C'est LA SOURCE qui manque.**
- [x] **C4L10C-10 · LES TROIS AUTRES CHAÎNES NE SONT PAS EMPORTÉES.** Sur le même dépôt,
  `expression`, `structure` et `argumentation` ont écrit leurs **trois mesures et leurs trois
  lettres** (C, C, C) pendant que la Connaissance refusait. **L'arrêt d'une chaîne n'en emporte
  aucune autre**, et `mesuresEcrites` vaut **3**.
- [x] **C4L10C-11 · ⭐ LE PRÉ-RELEVÉ MÉCANIQUE TOURNE SUR UNE COPIE RÉELLE, ET LE RELEVÉ EST
  AVEUGLE.** `pre_p1` a numéroté **8 phrases, 181 mots**, à partir de `[1]`, et **le message
  réellement assemblé porte le pré-relevé numéroté** — ce sont ces numéros que le relevé cite. P1 a
  rendu **5 unités mobilisées couvrant LES QUATRE REGISTRES** (`reference`, `concept`, `exemple`,
  `donnee`), **zéro décompte**, **zéro verdict de justesse** — *« c'est ce qui l'empêche de corriger
  l'élève en le relevant »* (fiche §3) —, et il a rangé **« Comme le dit Kant, il faut y réfléchir »
  dans `mentions_vides`**, sans en faire une unité : le pari du §8 tient sur ce premier cas.
  `code1` sur ce relevé réel : **5 unités, 4 registres, 3 sources, 1 mention vide, 2 `[posee_seule]`**.
- [x] **C4L10C-12 · ⚠️⚠️ CE QUE LE MODÈLE RÉPARAIT EN SILENCE — MESURÉ, PAS RAISONNÉ, ET IL RESTE
  UN TROU.** Le « contrôle gratuit » du contrat §7 a été fait **en comptant** : tous les champs à
  liste fermée alertent — `type` hors catalogue, `justesse`/`attribution`/`apropos`/`referent` hors
  liste *(l'unité est écartée, donc la bijection tombe, donc `PASSAGE MANQUÉ`)*, `etendue` hors
  liste, `citation` vide ou illisible. **Le portage n'a eu à créer aucune alerte** — bénéfice de
  l'extraction, pour la quatrième fois. ⚠️⚠️ **MAIS `source` EST UN TEXTE LIBRE, ET IL N'A AUCUN
  GARDE-FOU — et il a mordu SUR LA PREMIÈRE COPIE RÉELLE.** La fiche §3 veut *« l'auteur, l'œuvre ou
  le domaine que la copie nomme, mots exacts »* ; P1 a rendu **`"distinction que nous avons vue en
  cours"`** — une phrase. **Mesuré, toutes choses égales par ailleurs** : cette seule entrée fait
  passer `sources` de **2 à 3**, donc la Diversité de **`satisfaite` à `haut`**, donc **le niveau de
  BON à ACQUIS — avec ZÉRO alerte**. ⛔ **Non corrigé, et délibérément** : ajouter une alerte ferait
  diverger la troisième clé, et le « fait quand » exige l'identité. **Relevé** *(boîte aux lettres,
  et `C4L10C-19`)*.
- [x] **C4L10C-13 · LA `cible_primaire` BAT L'ORDRE ALPHABÉTIQUE — QUATRIÈME FOIS, sur trois
  instances.** Sur `vise_connaissance` (4 compétences) et `vise_connaissance_bis` (2), la cible du
  retour est **`connaissance`** ; le repli aurait dit **`argumentation`** dans les deux cas. Et sur
  l'instance **sans** `cible_primaire`, **l'alerte tombe** et le repli désigne `argumentation`, que
  personne ne vise. C4-L11 tient sa promesse.
- [x] **C4L10C-14 · LES SEPT SLOTS, ET LE CONTRÔLE DES DEUX SENS AU CHARGEMENT.** ⭐ **La
  Connaissance est la plus exigeante en slots des six** : **trois à P1** — `{consigne}` NATIF,
  `{production}` et `{pre_releve}` par `pre_p1` — et **QUATRE à P2**, le maximum du corpus :
  `{releve_phase_1}` le document, plus `{consigne}`, `{corpus_cours}` et `{restitution_de_cours}`
  par `pre_p2`. `refusSlotsJugement()` rend **0 refus**, et `verifierCoherence()` **[]** : le
  contrôle tombe **au chargement**, dans les deux sens, avant le premier appel payé. ⭐ **La tête
  invariante de P1 fait 4 476 caractères et ne porte AUCUN slot** — elle se cache ; les trois
  matériaux arrivent **en blocs balisés**, et aucun slot littéral ne subsiste dans le message.
- [x] **C4L10C-15 · `SLOT_DOCUMENT_P2` EST DÉCLARÉ, JAMAIS DEVINÉ.** Le module l'annonce
  (`"releve_phase_1"`), le branchement le reprend tel quel, et un test confronte les deux. ⛔ *« Le
  slot du document se déclare dès que le prompt P2 en porte plus d'un »*, et le contrat dit pourquoi :
  *« jusqu'au jour où un `pre_p2` incomplet ferait passer le relevé entier dans le slot du
  référent, sans que rien ne le voie »*. Le prompt en porte **quatre**.
- [x] **C4L10C-16 · `valeursDesParametres()` EST LE SEUL DOMICILE, ET LA CONNAISSANCE EST L'UNE DES
  DEUX FICHES CONCERNÉES.** Ses **six** paramètres sortent en **nombres** par
  `valeursDesParametres()`, quand `instrument.parametres.seuil_ratio_haut` porte bien un **OBJET**
  (`defaut`, `bornes`, `statut`) — vérifié en recette. ⛔ **Aucun seuil en dur** : les défauts du
  branchement ne sont qu'un **repli**, et **un test les confronte à ceux du module**, donc à ceux de
  la fiche.
- [x] **C4L10C-17 · `conformite` TOURNE À CHAQUE PASSAGE, ET LE CONTRÔLE DE FIDÉLITÉ EST BRANCHÉ.**
  ⭐ La Connaissance est **l'un des deux modules sur six** à porter le contrôle d'existence des
  citations, et **le seul à le porter dans `conformite`** *(l'Expression le porte dans `code1`)* —
  un `[à valider]` du contrat §8. **Le portage garde le sien où il est** et n'uniformise rien.
  ⚠️ **UNE DÉCISION D'IMPLÉMENTATION, DÉCLARÉE** : le module cherche la production sous
  `mesures._production` puis `sortie_p1._production`, **et rien ne les remplit jamais** — son alerte
  de repli dit d'ailleurs le motif, *« la production n'est pas jointe au CONTEXTE »*. Dans la chaîne
  **elle l'est** (`ctx.contexteExercice.copie`), et le portage la lit là **en troisième recours** :
  c'est le contrôle du module, alimenté par l'entrée qu'il nomme, et non un contrôle nouveau. **Sur
  les vecteurs, où le contexte est vide, le repli « NON EXÉCUTÉ » tombe exactement comme dans le
  module** — les 14 cas de `conformite` sont identiques des deux côtés. *À confirmer par Louis si
  la lecture ne lui convient pas ; l'annuler tient en une ligne.*
- [x] **C4L10C-18 · L'IDEMPOTENCE, ET LE DÉCOR RETIRÉ.** `traiterDepot` rejoué sur le même dépôt :
  **3 mesures avant, 3 après**, aucune seconde écriture. Le décor semé est **retiré** — plus aucune
  entrée `RECETTE-C4L10-CON` en base, vérifié par requête —, et `chaine_actif` est **rendu à son
  état d'avant**.

### Ce que ce lot vient de LEVER ailleurs dans ce fichier

- **`C4L10E-15` · Les compétences qui restent — ELLES NE SONT PLUS TROIS MAIS DEUX.** `synthese` et
  `questionnement` sont dérivées et en attente de branchement. **Condition de reprise inchangée :
  C4-L10 rejoué pour chacune.** ⭐ **ET L'OBSTACLE NOMMÉ DE LA CONNAISSANCE EST TRAITÉ** — son
  `pre_p1` prend le TEXTE là où le contrat passe le CONTEXTE : **le portage a suivi LE CONTRAT**,
  qui est au manifeste, et la dette est désormais **au registre, D4**, à traiter avant le Run 1.
  ⚠️ **Il n'en restait qu'un, et il en reste toujours un** : la **Synthèse**, dont `code1` ne rend
  pas `document_p2` sur ses deux chemins de sortie. **⚠️ Mais un obstacle NOUVEAU est né du portage
  de la Connaissance, et il n'appartient à aucune des deux qui restent** — voir `C4L10C-9` : le
  **corpus de cours**.
- **`C4L5-4` · Le `delta_v1_vf` — QUATRE FICHES SUR QUATRE SE TAISENT.** Condition de reprise
  **inchangée** : *une fiche qui DÉFINIT son delta*. ⚠️ **Elle ne se lève pas et ne se durcit pas
  non plus** : le mot « delta » **n'apparaît pas une seule fois** dans `competences/connaissance.md`
  — ni §3, ni §4, ni §5, ni bloc machine, ni §8. *Registre des ouverts, item 47, amendé une
  troisième fois.*

### Ce qui reste à jouer en recette

- [ ] **C4L10C-19 · ⚠️⚠️ LE CORPUS DE COURS — LA CONNAISSANCE NE MESURERA RIEN SANS LUI, ET CE N'EST
  PAS UN LOT CODE.** Voir `C4L10C-9`. Il faut **déclarer le corpus dans une source** — ce qu'il est,
  d'où il vient *(Scriptorium ?)*, sa granularité, et par quel canal le contexte de l'exercice le
  sert — **puis** ajouter le fournisseur. ⛔ **Aucun lot Code ne peut le trancher** : *« le premier
  référent de la Justesse repose sur un objet que le chantier n'a jamais écrit »*.
  **Condition de reprise : une source qui déclare le corpus de cours, ou la séance qui écrira
  l'assembleur** *(la condition de fermeture est celle de la fiche §8, mot pour mot)*.
- [ ] **C4L10C-20 · ⚠️ LA `source` LIBRE QUI GONFLE `diversite_sources` — mesuré à Bon → Acquis sur
  la PREMIÈRE copie réelle.** Voir `C4L10C-12`. Trois issues possibles, toutes de conception :
  resserrer le prompt P1, ajouter un `source_canonique` au relevé *(le §8 l'envisage déjà, mais pour
  un autre motif — les graphies multiples)*, ou accepter le bruit et le mesurer.
  **Condition de reprise : le Run 1 de la Connaissance**, qui dira quelle part des `source` relevées
  ne sont pas des désignations. ⛔ **Ne pas ajouter d'alerte au branchement** : elle ferait diverger
  la troisième clé.
- [ ] **C4L10C-21 · ⚠️ LE CHAMP `phrases` DU RELEVÉ N'EST LU PAR PERSONNE.** La fiche §3 le déclare
  — *« les numéros de phrase du pré-relevé qui la portent »* — et `pre_p1` numérote **pour lui** ;
  **ni `code1`, ni `code2`, ni `conformite` ne le lisent jamais**. Il ne sert donc qu'au retour, à
  la relecture humaine, et **rien ne vérifie qu'il pointe une phrase existante**. ⛔ **Ne pas
  inventer le contrôle** *(il ferait diverger la troisième clé)*. **Condition de reprise : le Run 1**,
  et la question à trancher est celle du contrat §3 — *l'EFFET du contrôle est une décision par
  compétence*.
- [ ] **C4L10C-22 · LE SMOKE PROF ET ÉLÈVE À L'ÉCRAN.** Rien n'a été vu dans un navigateur : tout ce
  que ce lot prouve passe par le test, par la recette et par la base. **Condition de reprise :
  le même smoke que `C4L10E-13`**, dont ce lot ne change ni l'objet ni la condition.
- [x] **C4L10C-23 · ✅ LA DETTE D4 EST PAYÉE — LES DEUX CROCHETS REÇOIVENT LE CONTEXTE, 29/08.**
  ⭐ **La condition de reprise a été MESURÉE ouverte, pas supposée.** Elle disait « la séance qui
  ouvre le Run 1 » : le dépôt de conception porte **7 manifestes en tout**, tous datés des
  **30-31/07**, **tous avec `module: ABSENT`**, et **aucun ne hache un `code.py`**. L'Expression a
  3 runs, **tous antérieurs au module** ; la Connaissance en a **0**. ⛔ *C'était la seule chose qui
  pouvait interdire le geste — le registre le dit : « un module est haché au manifeste, deux runs ne
  sont comparables que si ce hash coïncide ». **Aucun run n'est rendu incomparable.***
  ⭐ **Le défaut, reproduit avant d'être corrigé** : `expression.pre_p1({...})` levait
  `AttributeError: 'dict' object has no attribute 'strip'`, `connaissance.pre_p1({...})`
  `… no attribute 'split'`.
  ⭐ **Corrigé sur le patron que le module portait déjà chez lui**, et la correction tient bien dans
  les **deux lignes** annoncées par lot :
  `contexte = contexte if isinstance(contexte, dict) else {"copie": contexte or ""}` puis
  `texte = contexte.get("copie") or ""` — exactement ce que `code1` fait vingt lignes plus bas.
  ⭐⭐ **ÉPROUVÉ PAR L'ÉCHEC AVANT DE L'ÊTRE PAR LE SUCCÈS, ET PAR LA PORTE DU BANC ELLE-MÊME.**
  `verifie_slots_p1` *(`_commun/banc.py` l. 399 — le contrôle **AU CHARGEMENT**, l'endroit exact où
  l'exception serait tombée)* joué côte à côte sur une copie du fichier d'avant et sur celui
  d'après : **il LÈVE sur les deux modules d'avant, il PASSE sur les deux d'après**, slots servis
  `['copie', 'pre_releve', 'sujet']` et `['pre_releve', 'production', 'sujet']`.
  ⭐⭐ **LE CANAL A CHANGÉ, PAS LE CALCUL — et c'est ce qui rend le geste gratuit pour le protocole.**
  Sortie **identique octet pour octet** sur quatre copies *(deux paragraphes, un seul tenant, vide,
  accents et guillemets)*, servie **par le contexte comme par le repli en texte nu**. `VERSION` reste
  donc à **1.1** et **1.3** : `version_calcul` n'avait pas à bouger.
  ⭐ **Et les deux modules rejoignent leur propre portage** : `prePhaseP1` et `prePhase1` lisent
  `ctx.contexteExercice.copie` depuis le premier jour — c'est le Python qui démentait le TypeScript.
  ⚠️ **Contrôles** : `autotest()` des deux modules **0 échec** ; `derive-doctrine.py --verifie` et
  `derive-instruments.py --verifie` **IDENTIQUE** *(le `CONTRAT-MODULES.md` n'alimente aucune
  dérivation — vérifié)*. ⛔ **Le dépôt de conception n'est PAS commité** *(règle de la maison)*.
  ⚠️ *Reste, sans rapport et non touché : la variable `texte` de `code1` de la Connaissance est
  calculée et jamais lue — code mort, sans effet.*
  **Marque `[faux]` du `CONTRAT-MODULES.md` §2 ligne 2 amendée, et dette D4 fermée au registre des
  ouverts *(le compte des dettes passe de 8 à 7)*.**
  **Énoncé d'origine :** `copies-tests/expression/code.py` et `copies-tests/connaissance/code.py` :
  `pre_p1` prend le TEXTE là où le contrat passe le CONTEXTE. **Le banc lèverait une
  `AttributeError` au premier passage sur les deux.** ⭐ Le `code1` de la Connaissance porte déjà le
  patron du repli — la correction est **de deux lignes par module**. **Condition de reprise : la
  séance de conception qui ouvre le Run 1** de l'une ou l'autre. *Registre des ouverts, DETTES, D4.*
- [ ] **C4L10C-24 · ⚠️ `competencesMesurees` NOMME CE QUI EST SOUMIS, PAS CE QUI EST MESURÉ — et ce
  lot est le premier à le rendre visible.** Le bilan d'un dépôt calcule `competencesMesurees` **avant
  les passages** (`competencesFroides.filter(ouvertes.has)`), et `competencesEcartees` ne porte que
  les écartements **de pré-vol** *(statut `differee`, compétence non branchée)* ou les chaînes qui
  **ont levé**. Une chaîne qui tourne et **refuse proprement** — le cas de la Connaissance — reste
  dans « mesurées » et dit son motif **en alerte**. ⭐ **Rien n'est tu** : `mesuresEcrites` vaut 3
  quand `competencesMesurees` en compte 4, et `resumerBilan` affiche les deux côte à côte. ⚠️ **Mais
  le cas n'existait pas avant** : la Connaissance est **la première compétence du chantier refusée
  EN COURS DE CHAÎNE plutôt qu'au pré-vol**. ⛔ **Non corrigé ici** — `chaine.ts` est bâtie et
  éprouvée, et ce lot se mesure à un diff quasi nul hors d'`instruments.ts`. **Condition de reprise :
  le prochain lot qui touche au bilan d'un dépôt** *(un candidat naturel pour un lot de correctifs)*.
- [ ] **C4L10C-25 · LA LATENCE À QUATRE COMPÉTENCES — 59 s, et la courbe n'est plus plate.** 39 s à
  une, 47-52 s à deux, 55 s à trois, **59 s à quatre** — mais ⚠️ **la quatrième chaîne s'arrête à
  P2** : elle ne dépense qu'un appel d'extraction là où les trois autres en dépensent deux. **Le
  chiffre n'est donc PAS comparable aux trois précédents**, et il sous-estime. ⚠️ **Un premier tour
  avait mesuré 98 s** sur le même décor, avec un appel de plus — la variance du fournisseur est du
  même ordre que l'effet mesuré. **Condition de reprise : la Connaissance mesurant vraiment**, donc
  `C4L10C-19`.

---

## C4 · L10 — L'ouverture d'une compétence dans la chaîne : le QUESTIONNEMENT (sandbox, 23/08)

_Section ouverte le 23/08 à la clôture du lot. **Aucune migration** : ce lot ne touche que du code —
le suivi SQL n'a pas bougé, et n'avait pas à bouger. **Aucun `[faux]` posé dans une source** : rien
de ce que le portage a trouvé n'était une source fausse (voir `C4L10Q-16` et `C4L10Q-17`, qui sont
des dettes de CADRE, pas de fiche)._

_Ce qui a été prouvé EN SÉANCE est coché avec sa preuve. `npm test` : **1198 passés, 0 échoué**
(dont **38 neufs** sur ce portage ; l'état d'entrée était **1160/1160**, plus deux entrées de
registre mises à jour — « quatre compétences ouvertes » devient **cinq**) ; `npx tsc --noEmit` :
**rien** ; `npx eslint` sur les cinq fichiers du lot : **0 erreur**, 4 avertissements
`no-unused-vars` sur des paramètres imposés par la signature de l'interface — la même forme que
`structure.ts` ; `derive-instruments.py --verifie` : **IDENTIQUE** sur les dix dérivés. ⚠️ **La FICHE
n'a pas bougé — aucun `[faux]` n'y est posé —, mais un `--ecris` a été rendu nécessaire par le
passage du `07-Implementation.md` en 2.39** : `MANIFESTE.ts` et `calame-retour.ts` portent la version
de ce document, et le diff des deux dérivés fait **4 lignes**, la version et rien d'autre.
`scripts/recette/questionnement-c4l10.mjs` : **50 contrôles,
50 passés**, joués **par le même code que la route**, en base, sur un **dépôt réel à TROIS
compétences** et **sept vrais appels de modèle**, décor semé puis **retiré** (aucun reste, vérifié
par requête)._

⛔ **AUCUN STATUT DE RECETTE N'A ÉTÉ POSÉ, et aucun n'est proposé.** Le Questionnement est
`mesuree_silencieusement` — son état de naissance. **Rien n'a changé pour un élève.**

⚠️ **`chaine_actif` est REVENU à OFF**, vérifié par requête à la fin de chaque tour de recette.

⚠️⚠️ **ET CE LOT SE FERME SUR UN FAIT QUI N'EST PAS UNE PANNE, ET QU'IL FAUT LIRE EN PREMIER : LE
QUESTIONNEMENT MESURE EN `composer` ET SE TAIT DANS LES QUATRE MODES RÉCEPTIFS**, faute que la chaîne
descende la **référence décomposée**. Voir `C4L10Q-15`. ⭐ **La différence d'avec le corpus de cours
de la Connaissance est décisive** : là, aucune source ne déclarait l'objet ; ici **la source le
déclare**, l'écran de conception le valide et `exercices_references` le porte — c'est **la chaîne**
qui ne le sert pas. **C'est donc une question de CODE, pas de conception, et elle attend l'arbitrage
de Louis.** Tout le reste du lot est fait, prouvé et vert.

### Ce qui est prouvé — pour ne pas le rejouer

- [x] **C4L10Q-1 · LE QUESTIONNEMENT EST OUVERT — dérivé, importé, branché.**
  `derive-instruments.py --resume` le déclare **ouvert** en **v2.2** avec ses **9 observables de
  télémétrie**, `--verifie` dit **IDENTIQUE**, `verifierCoherence()` rend **[]**, et
  `competencesOuvertes()` rend **`expression, argumentation, structure, connaissance,
  questionnement`**. La dernière — `synthese` — est **dérivée et en attente**, et
  `competencesEnAttenteDeBranchement()` la nomme seule.
- [x] **C4L10Q-2 · LE PORTAGE REPRODUIT LE MODULE, SUR LES TROIS CLÉS, EN 3 635 CAS.**
  `scripts/vecteurs-questionnement.py` importe `copies-tests/questionnement/code.py` **à chaque
  exécution** — jamais une fixture recopiée —, joue ses crochets et rend ses entrées ET ses sorties
  en JSON ; `utils/chaine/branchements/questionnement.test.ts` rejoue **les mêmes entrées** sur le
  branchement et compare `code1.mesures`, `code1.document_p2`, `code1.alertes`, puis
  **`verdicts`, `trace` ET `alertes`** de `code2` — *« une trace qui diverge dit qu'un chemin de
  calcul a changé, même quand le verdict tombe juste »*. **30 vecteurs embarqués + 7 vecteurs
  d'alerte + 26 cas de référent + 19 de conformité + 3 553 cas de balayage.**
- [x] **C4L10Q-3 · ⚠️⚠️ LES DEUX NOMS DU « FAIT QUAND » N'EXISTENT PAS DANS CE MODULE, ET LE TEST
  L'ASSÈRE.** Ni `TESTS_P2_PARFAIT` ni `TESTS_CODE1_PARFAIT` : le module porte `VECTEURS` (**30**),
  `ALERTES_ATTENDUES` (**7**) et `VECTEURS_REFERENT` (**7**), plus **2 cas de conformité écrits en
  dur dans `autotest()`**. ⛔ Un `getattr(m, "TESTS_P2_PARFAIT", [])` aurait rendu **un zéro qui
  ressemble à une mesure** : le harnais écrit `meta.absentes`, et le premier test du fichier vérifie
  que les deux valent `false`. ⚠️ **Le TYPE est vérifié aussi, pas supposé** — chez l'Expression,
  `TESTS_CODE1_PARFAIT` est une CHAÎNE, et un `len()` y a rendu « 52 vecteurs » qui étaient
  52 caractères. **Ici les cinq constantes sont bien des LISTES**, vérifié par `type().__name__`.
- [x] **C4L10Q-4 · LE BALAYAGE COUVRE LA CASCADE ENTIÈRE — 3 072 cas.** 4 formes × 4 tensions ×
  4 enjeux × 4 débats × 4 `question_propre` × 3 `question_specifique`, à `conjonction_bon` stricte,
  **plus 81 cas** sur les deux valeurs du paramètre *(et une troisième, illégale, qui retombe en
  silence sur le mode permissif)*. Les **quatre paliers de base** sont atteints — un balayage qui
  n'atteindrait pas ses paliers contrôlerait des chemins morts.
- [x] **C4L10Q-5 · LE CRIBLE ENTIER, 180 cas + 8 lots multiples.** déplacement (écrit / vide /
  `[aucun]`) × reprise (écrite / vide / `[aucune]`) × 5 verdicts du juge × 4 tests. ⭐ **L'ORDRE DES
  DEUX TESTS EST PORTEUR, et il est prouvé sur son cas discriminant** : ni déplacement ni reprise
  rend **`verbal`**, jamais `non_tenu` — *« sa reprise ne se regarde même pas »* ; et un juge qui
  dit `verbal` sur un recadrage à reprise vide **l'emporte** sur le pré-verdict du code.
- [x] **C4L10Q-6 · LA BORNE HAUTE DES `limite`, sur les HUIT parties des trois champs × 8 notes.**
  Un `limite` seul → **le plus fort des deux** ; deux ou plus → **tout retombe à la borne basse** ;
  une note qui ne nomme pas deux valeurs → **`LIMITE_ILLISIBLE`** et borne basse. ⚠️ **Le cas « une
  seule valeur nommée » a été ajouté APRÈS l'épreuve négative** : sans lui, `len(lus) < 2` et
  `len(lus) < 1` rendaient la même chose partout et la mutation survivait.
- [x] **C4L10Q-7 · ⭐⭐ SEULEMENT DEUX DES HUIT ÉCARTS PYTHON/JS MORDENT ICI, ET ILS SONT PROUVÉS SUR
  CE QUI LES DISCRIMINE.** Le module n'importe **pas `re`**, n'appelle **ni `round()`, ni `%.1f`, ni
  `.casefold()`, ni `.split()`, ni `len()` d'une chaîne** — les écarts 1, 4, 5 *(en partie)*, 6, 7 et
  8 des lots précédents **ne peuvent pas mordre**. Restent :
  **(a) les BLANCS** — `strip()` de Python retire `\x85` (NEL) et `\x1c`-`\x1f` que `trim()` garde,
  et **garde la BOM `﻿` que `trim()` mange** : les deux sens sont éprouvés, sur les valeurs de
  catalogue **et** sur les `cite` du crible ;
  **(b) `str()` implicite** — `str(['limite'])` rend `['limite']` là où `String(['limite'])` rend
  `limite` *(⚠️ un port naïf y aurait vu un `limite`, donc une borne haute, donc un palier de plus)*,
  `str({})` rend `{}` contre `[object Object]`, et **`str(None)` rend `None` contre `undefined`** —
  ce dernier dans le texte de l'alerte `test_illisible`, sur un chemin **atteignable** ;
  **(c) la VÉRITÉ d'une valeur** — `[]` et `{}` sont FAUX en Python, VRAIS en JavaScript ;
  **(d) ⭐ UN NEUVIÈME ÉCART, ET IL N'ÉTAIT PAS PORTÉ : `s[:n]`** — Python tranche par POINTS DE
  CODE, `slice` par unités UTF-16. Le module s'en sert pour citer les 40 premiers caractères d'une
  requalification inappariable ; le balayage l'éprouve sur `𝔔` (hors du plan de base) et sur un
  émoji en tête. *Il est porté **dans le branchement**, pas dans `python.ts` : il n'a qu'un client.*
- [x] **C4L10Q-8 · ⭐⭐ LES NEUF OBSERVABLES DU §5 ONT LEUR VALEUR AU RELEVÉ — et TROIS demandaient
  un calcul propre.** Cinq se lisent tels quels *(`question_presente` sur `forme_question` ;
  `notions_en_tension`, `enjeu` et `debat_situe` sur les champs **RÉSOLUS** par la borne haute, ceux
  que la cascade lit ; `question_propre` sur le jugement)* ; **`question_specifique` est RECOPIÉ du
  verdict de `code2`** *(voir `C4L10Q-9`)* ; et **trois ne se lisaient nulle part** :
  **`recadrage`** — « au moins un recadrage `valide` après crible », ⛔ **et ce n'est PAS
  `seuil_franchi`**, qui exige en plus le palier de base Bon —, **`recadrage_verbal`** et
  **`recadrage_non_tenu`**, comptés sur les verdicts finaux du crible. Le **dénominateur** part au
  relevé sous son nom littéral **« les recadrages tentés »** — `observables.ts` le cherche à la
  lettre. **Vérifié EN BASE** : 9 entrées écrites, **aucun `n/a`**, sur le dépôt réel.
- [x] **C4L10Q-9 · ⭐⭐ `question_specifique` EST LE SEUL OBSERVABLE DU CORPUS DANS LES DEUX LISTES —
  UN SEUL CALCUL, DEUX LECTURES.** Sur 24 observables de module et 56 de télémétrie, *« un seul
  observable croise les deux listes »* *(`03-` §9)*, et c'est le nôtre. Le relevé **RECOPIE** le
  verdict composé par `code2` ; deux calculs seraient deux domiciles qui divergent. Un test l'assère
  sur les **trois** valeurs du catalogue, et une mutation qui lui donnerait un second domicile
  **tombe**.
- [x] **C4L10Q-10 · ⭐⭐ L'ÉPREUVE NÉGATIVE — 55 MUTATIONS, 53 TOMBÉES, ET LES DEUX SURVIVANTES SONT
  DES ÉQUIVALENTS DÉMONTRÉS.** Le portage a été cassé **règle par règle** — les 11 lignes de la
  cascade, les 3 du seuil, les 8 du crible, les 5 de la borne `limite`, les 9 écarts de langage, les
  12 de la télémétrie, les 7 du contrat — et le test rejoué à chaque fois.
  ⚠️ **Au premier passage, CINQ ont survécu, dont TROIS étaient des trous réels — et DEUX des trois
  étaient dans la TÉLÉMÉTRIE**, exactement comme les portages précédents l'annonçaient :
  `question_presente` lisant `question_posee` et `question_propre` lisant un champ du relevé
  passaient, **parce que les assertions vérifiaient qu'un observable EXISTE et n'est pas `n/a`,
  jamais CE QU'IL VAUT**. ⭐ **La parade, et elle a fermé les trois** : une copie où les six champs
  lus portent des valeurs **toutes différentes et toutes différentes de leur valeur réussie**, plus
  le cas `limite` à note d'une seule valeur.
  ⭐ **Les deux survivantes restantes sont du CODE ÉQUIVALENT, et deux tests le DÉMONTRENT par
  exhaustion** : la vérité de Python et celle de JS ne divergent que sur `[]` et `{}`, dont le
  `str()` — `[]` et `{}` — n'égale ni `limite` ni aucune des huit valeurs d'échelle ; et `sorted()`
  et `.sort()` coïncident sur les **trois** noms de champ, tous ASCII minuscules.
- [x] **C4L10Q-11 · LE « CONTRÔLE GRATUIT » DU CONTRAT §7, MESURÉ : DIX CHAMPS À LISTE FERMÉE SUR
  DIX LÈVENT UNE ALERTE, et le portage n'a eu à en créer AUCUNE.** `forme_question`,
  `notions_en_tension`, `enjeu`, `reponses_concurrentes`, `recadrages[].type`, `question_propre`,
  `question_specifique`, `crible[].verdict`, `crible[].test`, `confiance` — mesuré en injectant une
  valeur hors catalogue dans chacun. **C'est le bénéfice de l'extraction, pour la cinquième fois.**
- [x] **C4L10Q-12 · UN DÉPÔT RÉEL TRAVERSE LA CHAÎNE ET ÉCRIT UN SQUELETTE, UNE MESURE ET SA
  LETTRE.** `scripts/recette/questionnement-c4l10.mjs`, en base, par **le même code que la route** :
  **3 squelettes** *(expression, questionnement, structure)*, celui du Questionnement portant **son
  extraction ET son jugement** ; **3 mesures** — `questionnement=E, expression=A, structure=D` ;
  `instrument_version = 2.2`, la ligne VERSION de la fiche et rien d'autre ; `delta_v1_vf` **NULL**.
  **7 appels**, `chaine_actif` allumé puis **éteint**, décor **retiré**.
- [x] **C4L10Q-13 · ⭐⭐ ET LA COPIE DE RECETTE A MONTRÉ LE PLANCHER À L'ŒUVRE, SUR PIÈCE.** La copie
  porte **tout** ce qu'il faut pour Acquis — question explicite, notions articulées, enjeu énoncé,
  réponse concurrente énoncée, **et un recadrage valide après crible**. Le juge a pourtant rendu
  `question_propre: "reprise_enonce"` — parce que **la première phrase EST le sujet retourné** — et
  la cascade a donné **Absent (E)**. ⭐ *« Une copie qui recopie l'énoncé au point d'interrogation
  est parfaitement spécifique, et ce champ est le seul qui l'attrape »* *(fiche §4)* : **le second
  plancher a mordu sur une copie réelle, du premier coup.** ⭐⭐ **Et la dissociation portée en
  `C4L10Q-8` s'observe alors en vrai** : `recadrage = oui` **avec** `niveau = E`. L'élève a recadré,
  la télémétrie le sait, et sa lettre ne le dit pas — c'est exactement ce que le §5 veut.
  L'alerte l'écrit : *« le seuil ouvre Acquis, il n'élève jamais la base : un recadrage valide sur un
  palier de base Absent ne fait pas monter la copie »*.
- [x] **C4L10Q-14 · LA `cible_primaire` BAT L'ORDRE ALPHABÉTIQUE, une CINQUIÈME fois**, sur trois
  instances *(le repli aurait dit « expression » dans les trois cas)*, et **l'alerte de repli tombe**
  sur l'instance sans cible. C4-L11 tient sa promesse.
- [x] **C4L10Q-14bis · L'IDEMPOTENCE — une reprise n'écrit AUCUNE seconde mesure.** 3 avant, 3 après,
  et le bilan le DIT : `mesuresDejaLa = 3`, `mesuresEcrites = 0`. ⚠️ **Elle rejoue bien la chaîne**
  *(7 appels)* — ce n'est pas un cache : c'est l'index unique qui garde la ligne.
- [x] **C4L10Q-14ter · LES CINQ SLOTS, ET LE CAS LE PLUS SIMPLE DES SIX.** P1 porte **DEUX** slots,
  `{copie}` et `{sujet}`, **tous deux NATIFS** : le module ne définit **ni `pre_p1` ni
  `prepare_copie`**, et `slotsFournis` est **vide**. P2 en porte **TROIS**, dont
  **`SLOT_DOCUMENT_P2 = "squelette_phase_1"` DÉCLARÉ par le module** — obligatoire à trois slots — et
  **le document n'est PAS le référent**. `refusSlotsJugement` rend **0 refus**, au chargement, dans
  les deux sens. La **tête cacheable** fait **4 429 caractères** et ne porte aucun slot.

### Ce que ce lot vient de LEVER ailleurs dans ce fichier

- ⭐ **`C4L10E-15` compte désormais UNE compétence en attente** — `synthese` seule.
- ⭐ **`C4L5-4`** *(« une fiche qui définit son delta »)* **ne bouge toujours pas, et se durcit une
  fois de plus : CINQ fiches sur cinq se taisent.** Le mot « delta » n'apparaît **pas une seule
  fois** dans `competences/questionnement.md`.

### Ce qui reste à jouer en recette

- [x] **C4L10Q-15 · ✅ LEVÉ ET ÉPROUVÉ PAR C5-L3, LE 27/08 — le Questionnement MESURE en mode
  réceptif.** ⭐⭐ *Sa condition de reprise était satisfaite depuis le 23/08* (commit `4e865b5` :
  `FOURNISSEURS_NATIFS` porte six noms, `reference` et `source` compris), **et personne ne l'avait
  relue** — son jumeau `C4L10SY-14` avait été coché, pas lui, et **aucune mesure hors `composer`
  n'existait dans les deux bases**. ⭐ **PREUVE PAR EXÉCUTION**, sur un dépôt réel de lecture, en bac
  à sable *(`scripts/recette/reception-c5l3.mjs --avec-chaine`)* : `questionnement × expliquer` →
  squelette d'extraction, **verdict**, et **`lettre_equivalente = E`** avec `modes: ["expliquer"]` en
  base, instrument 2.2 ; `armature.question_directrice` servie pour de bon *(« Le doute porté sur
  toute chose laisse-t-il subsister une certitude… »)*. 3 lignes d'`api_couts`, 56,4 s pour deux
  chaînes. ⚠️ **RR4 n'a pas refusé à ce tirage** — voir `C4L10Q-16`, qui reste ouvert. *L'énoncé
  ci-dessous est conservé tel qu'il était, pour mémoire du diagnostic.*

  ~~**⚠️⚠️ LE QUESTIONNEMENT SE TAIT DANS LES QUATRE MODES RÉCEPTIFS, ET C'EST UNE
  QUESTION DE CODE — LA SEULE DÉCISION QUE CE LOT LAISSE À LOUIS.**~~ Constaté **en base**, sur un
  dépôt réel en `interroger` : `pre_p2` sert `referent` à **`null`**, la chaîne **arrête la mesure en
  nommant le slot** — *« REFUS : `preP2` ne peut pas servir « referent » — le contexte de l'exercice
  ne le porte pas »* —, aucune mesure de questionnement n'est écrite, et **les autres compétences du
  même dépôt mesurent normalement** *(expression = A)*. ⭐ **Le canal est bon** : servi une référence,
  `pre_p2` la lit sous le SEUL champ que le module lit — `armature.question_directrice`. ⛔ **Ce qui
  manque est le FOURNISSEUR** : `contexteExercice` porte quatre noms — `sujet`, `consigne`, `copie`,
  `mode` —, et `contexte.ts` ne lit `exercices.reference_id` **que** pour en déduire un référent
  `texte | cours | null`, jamais le contenu. ⚠️⚠️ **Ce n'est PAS le cas du corpus de cours** : là,
  aucune source ne déclarait l'objet ; **ici la fiche §4 le déclare** — *« tel que la référence
  décomposée le porte, c'est son champ `armature.question_directrice` »* —, l'écran de conception
  **refuse un texte dont la référence n'est pas validée**, et `exercices_references` la porte. ⚠️ **Et
  la portée est grande** : le Questionnement est l'une des **deux seules** compétences à qui la table
  de proportion s'applique en entier — **≥ 40 %** en échelle réceptive et **≥ 15 %** en `interroger`
  *(fiche §1.4)* —, et **chez les HLP il n'est ciblé QU'en modes autres que `composer`** *(`01-` §3,
  R2)*. **Condition de reprise : la décision de Louis** — poser le fournisseur natif de la référence
  décomposée dans `contexte.ts` + `chaine.ts` est un geste hors du périmètre d'un lot « à diff quasi
  nul », et il ouvre les quatre modes réceptifs d'un coup.
- [ ] **C4L10Q-16 · ⚠️⚠️ RR4 REFUSE UN RETOUR QUI EMPLOIE « recadrage » OU « enjeu » — et ce sont les
  DEUX SEULS observables du corpus qui soient des mots français ordinaires.** Observé **une fois sur
  deux tours de recette** : *« retour refusé : RR4 : le texte nomme des observables — recadrage »*.
  `fuitesRR4` *(`utils/chaine/retour.ts`)* cherche chaque code **en SOUS-CHAÎNE**, ce qui convient à
  `garant_circulaire` ou `densite_friction` — mais **`enjeu` et `recadrage` sont le vocabulaire même
  du levier** que la fiche prescrit au juge *(« interroger ta problématique, redéfinir un mot »)*.
  **Mesuré : sur les 56 observables de télémétrie des six fiches, DEUX seulement sont des mots
  ordinaires, et les deux sont au Questionnement.** ⛔ **Non corrigé** : RR4 est au `01-` §12, source
  gelée, et ce lot ne corrige pas une source. **Trois issues possibles, et c'est un arbitrage** :
  RR4 cherche le **mot isolé** plutôt que la sous-chaîne · la fiche **renomme** ses deux codes · le
  prompt de retour **proscrit** ces deux mots. **Condition de reprise : le lot qui touche au retour,
  ou une décision de conception sur RR4.**
- [ ] **C4L10Q-17 · ⚠️⚠️ LE PREMIER TROU SILENCIEUX DU QUESTIONNEMENT EST DANS UN CHAMP LIBRE, ET IL
  OUVRE LE SEUIL — mesuré, pas supposé.** `deplacement` et `reprise` sont du **verbatim libre**
  qu'aucune liste fermée ne peut garder, et **ils décident du `pre_verdict` donc du seuil**. Mesuré
  sur la même copie, toutes choses égales par ailleurs : un P1 honnête *(l'élève n'a rien écrit :
  `[aucun]` / `[aucune]`)* rend **Bon**, seuil fermé, **avec** l'alerte `promotion_refusee` ; un P1
  qui **invente** un déplacement et une reprise rend **ACQUIS**, seuil ouvert, **et ZÉRO alerte**.
  ⚠️ C'est le pendant exact du `source` de la Connaissance — sauf qu'ici ça ne coûte pas un cran,
  **ça ouvre le palier le plus haut de la compétence**. ⛔ **Ne pas ajouter l'alerte au branchement**
  *(elle ferait diverger la troisième clé)*. **C'est le `[à valider]` du contrat §8**, partagé avec
  l'Argumentation, la Structure et la Synthèse : *aucun contrôle d'existence des citations contre la
  copie*. **Condition de reprise : le Run 1, qui dira la fréquence** — et la séance de conception qui
  tranchera le `[à valider]`.
- [ ] **C4L10Q-18 · ⚠️ UN EXERCICE À PLUSIEURS MODES POUR LA MÊME COMPÉTENCE — l'arbitrage est
  DOCUMENTÉ, pas tranché par une source.** `exercices.modes_par_competence[c]` est un **tableau**, et
  `chaine.ts` sert `mode: modes.join(', ')` ; le module, lui, lit **UN** mode. Le portage retient la
  lecture **prudente** : *réceptif dès que l'un des modes l'est* — le référent d'un texte ne se
  remplace pas par un sujet. ⭐ **Le cas n'existe pas en base aujourd'hui** : sur les **16** couples
  (exercice × compétence) portant des modes, **aucun** n'en porte plus d'un. **Condition de reprise :
  la première instance à deux modes sur une même compétence** — ou une source qui dit ce qu'un
  exercice multi-modes veut dire pour un référent.
- [ ] **C4L10Q-19 · ⚠️ LA TRACE DU QUESTIONNEMENT EST STRUCTURÉE, ET `SortieCode2['trace']` LA
  DÉCLARE `string[]`.** Le module rend `[{rang, verdict}]` sur le chemin nominal et `[texte]` sur le
  PASSAGE MANQUÉ — **il est le seul des six**, les quatre déjà portés ne rendant que du texte. Le
  « fait quand » exigeant l'**identité** sur les trois clés, la conversion est **contenue dans une
  fonction nommée** du branchement, commentée, et **rien dans la chaîne ne LIT la trace**. ⛔ Élargir
  le type toucherait `instruments.ts` **et les tests des quatre branchements déjà écrits**, qui
  appellent `.startsWith` sur leurs lignes. **Condition de reprise : un lot qui touche à
  `SortieCode2`** — ou la Synthèse, si sa trace est structurée elle aussi.
- [ ] **C4L10Q-20 · ⚠️ `question_propre` N'A PAS DE `sans_objet_si`, ALORS QUE `n/a` EST UNE VALEUR
  LÉGALE DE SON CATALOGUE.** `question_specifique` déclare `sans_objet_si: n/a` au bloc machine ;
  `question_propre`, **non** — alors que la fiche §4 écrit *« `n/a` si `question_posee` est vide »*.
  Lu à la lettre, un `n/a` compterait **RATÉ**. ⭐ **Le cadre tranche dans le sens de la fiche par un
  autre chemin** : `NA = 'n/a'` est la sentinelle **globale** d'`observables.ts`, et
  `statutDeLaMesure` rend `sans_objet` sur elle avant même de regarder `sans_objet_si`. **Un test le
  fixe.** ⛔ **Non corrigé dans la fiche** : la conduite est bonne aujourd'hui, et l'asymétrie ne
  coûte rien tant que la sentinelle globale existe. **Condition de reprise : la révision du
  `03-competences.md` §1** *(registre des ouverts, item 31)*, qui est le domicile du vocabulaire.
- [ ] **C4L10Q-21 · LA LATENCE À TROIS COMPÉTENCES : 55 s** — et c'est **exactement** la mesure de la
  Structure au même nombre de chaînes *(39 s à une, 47-52 s à deux, 55 s à trois, 59 s à quatre mais
  non comparable)*. ⭐ **La courbe reste plate**, et deux mesures indépendantes tombent sur le même
  chiffre. ⚠️ Un premier tour du même décor avait mesuré **68 s** avec un appel de plus : la variance
  du fournisseur reste du même ordre que l'effet mesuré. **Condition de reprise : C4-L7**, qui mesure
  le flux de bout en bout.
- [x] **C4L10Q-22 · LA RECETTE A ROUGI POUR UNE RAISON QUI N'EN ÉTAIT PAS UNE — et c'est le piège
  transverse de `supabase-js`.** Au premier tour, six contrôles rouges disaient « 0 mesure écrite »
  quand la chaîne en avait écrit trois : le `select` demandait `competences_mesures.alertes`, **une
  colonne qui n'existe pas**, et `supabase-js` **ne lève pas** — il rend `{ data: null, error }`, et
  `(data ?? []).length` rend alors **zéro, qui ressemble à une mesure**. ⭐ **Le script porte
  désormais un `lu()` qui lève sur `error`**, et c'est la parade générale. ⚠️ **Même motif que
  `C4L10C-24`** — « la recette lisait le mauvais champ et rougissait pour rien » : c'est la
  **deuxième fois en deux lots**. **Condition de reprise : aucune — c'est une leçon, pas un reste.**
  > ✅ **PASSE DE RÉCONCILIATION DU 28/08 — « REPRISE : AUCUNE » — c'est une leçon, et
  > elle est apprise.** La ligne le dit elle-même. ⭐ **Et elle a servi deux fois depuis** : le
  > `lu()` qui lève sur `error` est le patron repris par `reception-c5l3.mjs` *(C5-L3, §10-2 : le
  > même piège a mordu sur `competences_mesures.version`, une colonne qui n'existe pas)* et par le
  > script de la couture de C6-L3. **Une leçon qui a essaimé n'est plus un reste de recette.**

---

## C4 · L10 — L'ouverture d'une compétence dans la chaîne : la SYNTHÈSE (sandbox, 23/08)

> ⚠️ **RENUMÉROTÉE LE 23/08 AU SOIR : `C4L10S-…` → `C4L10SY-…`.** Cette section et celle de la
> **STRUCTURE** *(plus haut)* portaient toutes deux le préfixe `C4L10S-` sur les **mêmes numéros
> 1 à 22** — Structure et Synthèse commencent par la même lettre —, si bien qu'un `grep C4L10S-17`
> rendait **deux tests différents**. Or ce fichier est **la seule boîte aux lettres de C4-L7**, et
> ce lot vide ses restes **par identifiant**. **La STRUCTURE garde `C4L10S-`** *(elle l'a porté la
> première)* ; **la SYNTHÈSE prend `C4L10SY-`**, sur le modèle de `C4L10A-`, `C4L10C-` et
> `C4L10Q-`. *Le relevé de séance `RELEVE_C4_L10_Synthese_2026-08-23.md` ne cite aucun identifiant :
> rien d'autre n'est à reporter.*

_Section ouverte le 23/08 à la clôture du lot — **la sixième et dernière**. **Aucune migration** : ce
lot ne touche que du code, le suivi SQL n'a pas bougé et n'avait pas à bouger. **Aucun `[faux]` posé
dans une source** : rien de ce que le portage a trouvé n'est une source fausse._

_Ce qui a été prouvé EN SÉANCE est coché avec sa preuve. `npm test` : **1 230 passés, 0 échoué**
(dont **32 neufs** sur ce portage ; l'état d'entrée était **1 198/1 198**, et les 32 neufs
l'ont porté à 1 230 — **deux entrées de registre** ont alors rougi, qui disaient « cinq compétences
ouvertes » et « la dernière attend son branchement » : elles sont à jour) ; `npx tsc --noEmit` : **rien** ; `npx eslint` sur les fichiers du lot : **0 erreur**, 2
avertissements `no-unused-vars` sur des paramètres imposés par la signature de l'interface — la même
forme que `structure.ts` et `questionnement.ts` ; `derive-instruments.py --verifie` : **IDENTIQUE**
sur les dix dérivés, **et la fiche n'a pas bougé** — aucun `--ecris` n'a été nécessaire.
`scripts/recette/synthese-c4l10.mjs` : **64 contrôles, 64 passés**, joués **par le même code que la
route**, en base, sur des **dépôts réels** et **seize vrais appels de modèle**, décor semé puis
**retiré** (aucun reste, vérifié par requête)._

⛔ **AUCUN STATUT DE RECETTE N'A ÉTÉ POSÉ, et aucun n'est proposé.** La Synthèse est
`mesuree_silencieusement` — son état de naissance. **Rien n'a changé pour un élève.**

⚠️ **`chaine_actif` est REVENU à OFF**, vérifié par requête à la fin de chaque tour de recette.

⭐⭐ **ET CE LOT SE FERME SUR DEUX GESTES, DANS DEUX DÉPÔTS.** Le portage a été précédé d'une
**réparation au chantier de conception**, sur mandat explicite de Louis : `synthese.code1` ne rendait
`document_p2` sur **aucun** de ses deux chemins, et `banc.py` refusait le run pour ça — **le banc
n'avait donc jamais pu tourner sur la Synthèse**. Voir `C4L10SY-1` et `C4L10SY-2`.

⚠️⚠️ **ET IL SE FERME SUR UN FAIT QUI N'EST PAS UNE PANNE : LA SYNTHÈSE MESURE SUR LE RÉFÉRENT COURS
ET SE TAIT SUR LE RÉFÉRENT TEXTE**, faute que la chaîne descende la **référence décomposée**. Voir
`C4L10SY-14`. ⭐ **C'est LE MÊME canal manquant que celui du Questionnement (`C4L10Q-15`), et un seul
geste ferme les deux** — `exercices_references` porte `contenu` ET le texte source. Tout le reste du
lot est fait, prouvé et vert.

### Ce qui est prouvé — pour ne pas le rejouer

- [x] **C4L10SY-1 · ⭐⭐ LE MODULE DE CALIBRATION EST RÉPARÉ — `document_p2` EST RENDU SUR SES DEUX
  CHEMINS.** *(dépôt de conception, `copies-tests/synthese/code.py`, NON commité)* `code1` rendait
  `mesures` sans la quatrième clé du `CONTRAT-MODULES.md` §2 — obligatoire dès qu'un module définit
  `code1` — avec un commentaire ligne 264 qui affirmait qu'elle *« n'est pas une clé du contrat »*.
  ⚠️ **`banc.py` ligne 580 refusait le run pour ça : LE BANC N'A JAMAIS PU TOURNER SUR LA SYNTHÈSE**,
  et rien ne le disait — l'autotest passait ses 57 vecteurs, `verifie-module.py` rendait REÇU. *Preuve :
  autotest **57 → 66 vecteurs, 0 échec** (les 57 intacts) · `verifie-module.py` **REÇU** · le pilote du
  banc conduit **en boîte**, sans un appel, passe `verifie_slots_p2`, `verifie_slots_p1` **et
  `apres_p1`** sur les deux référents · prompt P2 assemblé à **6 359 car. (cours)** et **7 630
  (texte)**, aucun slot non servi.*
- [x] **C4L10SY-2 · ⭐⭐ CE QUE LE JUGE LIT SE DÉCIDE AU §4 DE LA FICHE, ET NULLE PART AILLEURS — ET IL
  Y A DEUX FORMES.** Le prompt P2 ne porte **qu'un slot** (`{squelette}`) et le module n'a **aucun
  `pre_p2`** : `document_p2` est **tout** ce que le juge verra. Le §4 le tranche en trois phrases :
  *« le juge lit le squelette nu »* → le relevé de P1A (`unites`, `rapports`, `apports`,
  `these_forme`) ; *« aucun nombre n'est injecté »* → ni pré-relevé, ni `mesures`, ni clé à tiret bas ;
  *« le juge nomme l'origine du contresens, **et il en a les moyens** : la référence déclare le statut
  d'énonciation de chaque phrase »* → **ses moyens n'ont pas d'autre route**. ⭐ **Référent texte : +
  l'alignement de P1B + la référence décomposée entière** ; **référent cours : ni l'un ni l'autre**
  (*« le cours n'a pas de référence décomposée, et ne doit pas en avoir »*, §1 acté ; la fidélité est
  *« référent texte seulement »*, §4). *Preuve : 6 mutations sur 6 tombent — clé retirée de chaque
  chemin, `_corr` qui fuit, nombre injecté, référence servie sur le cours, squelette amputé.*
- [x] **C4L10SY-3 · LA SYNTHÈSE EST OUVERTE — dérivée, importée, branchée, ET LES SIX AVEC ELLE.**
  `derive-instruments.py --resume` rend les six OUVERTES, `synthese v3.4 — 13 observables` ;
  `--verifie` dit **IDENTIQUE** ; `verifierCoherence()` ne rend **aucun écart**, **les trois référents
  éprouvés** (`texte`, `cours`, `null`) ; `competencesEnAttenteDeBranchement()` est **VIDE**.
- [x] **C4L10SY-4 · LE PORTAGE REPRODUIT LE MODULE, SUR LES TROIS CLÉS, EN 6 069 CAS.** `code1`
  (`mesures` / `document_p2` / `alertes`), `code2` (`verdicts` / `trace` / `alertes`) et `conformite`
  sont rejoués des deux côtés sur les mêmes entrées, par `scripts/vecteurs-synthese.py`, qui **importe
  le module et le rejoue à chaque exécution** — jamais une fixture figée. Les **5** vecteurs de Code1
  et les **15** de composition y sont, plus les balayages. ⚠️ `TESTS_P2_PARFAIT` est **VIDE** et
  `VERSION_GOLDS_TESTEE` vaut **`None`** : la Synthèse n'a **ni gold, ni copie, ni critère, ni run
  stocké** — c'est **le balayage** qui porte la preuve.
- [x] **C4L10SY-5 · ⭐⭐ 4 800 CAS DE FRONTIÈRE — parce que « balayer les seuils » NE SUFFIT PAS.**
  L'item 28 de la boîte aux lettres disait de balayer les paramètres, pas seulement les entrées.
  ⚠️ **Vérifié ici : c'est nécessaire et insuffisant.** Quatre comparaisons du palier — `partInt <=
  0.5`, `rendus < pr`, `couvEss < pe`, `partiels > plafond` — survivaient à l'épreuve négative **parce
  qu'un autre terme du `ou` faisait déjà tomber le palier**, et déplacer l'inégalité ne changeait rien.
  ⭐ **La parade : une référence bâtie pour ISOLER chaque seuil** — quatre essentielles (`couvEss ∈ {0,
  ¼, ½, ¾, 1}`), quatre moments déclarés (`rendus ∈ {0, ¼, ½, ¾}`), **aucune fonction `illustre`**
  (donc **jamais** d'inversion pour masquer), et deux familles d'alignement dont l'une met `partInt` à
  **½ pile**. Les quatre tombent alors.
- [x] **C4L10SY-6 · ⭐⭐ L'ÉPREUVE NÉGATIVE — 61 MUTATIONS, 61 TOMBÉES, ZÉRO SURVIVANTE.** *(2/14,
  5/29, 2/40 et 5/55 aux quatre portages précédents.)* ⚠️ **Mais pas du premier coup : ONZE
  survivaient**, et les traiter est le vrai travail de la séance. **Deux étaient des trous réels de
  télémétrie**, **quatre étaient masquées par la disjonction** (`C4L10SY-5`), **quatre étaient des
  écarts de langage éprouvés au mauvais endroit** (`C4L10SY-8`), **une était un décompte muet**.
- [x] **C4L10SY-7 · ⚠️ `elagage` PORTE LES INVERSIONS, ET NON LE TAUX D'ÉLAGAGE — et le confondre
  survivait.** Le `sens` de l'observable le dit : *« l'observable rend **deux nombres**, le verdict ne
  lit que celui-là »*, et son `porte_sur` nomme *« les inversions comptées à part »*. ⛔ **Sur la
  plupart des copies les deux valent 0** et l'écart ne se voit pas : il a fallu une référence où le
  taux d'élagage vaut **½** et où **aucune** inversion n'a lieu. Le second nombre part **à la trace**,
  où il se lit sans rien décider.
- [x] **C4L10SY-8 · ⚠️⚠️ LES ÉCARTS PYTHON/JS SE PROUVENT DANS LE CHAMP QUI EN DÉPEND, PAS AILLEURS.**
  Quatre survivantes venaient de là — les balayages faisaient bien passer blancs et ligatures, **mais
  jamais où ils décident** : `casefold()` → il fallait la **ligature `ﬁ`** *(qu'une OCR produit)*
  **dans une note de « limite »**, où elle décide d'un palier ; `strip()` → la **BOM dans un
  `terme_cite`**, où l'appariement du crible décide du seuil donc d'Acquis ; les **blancs de Python**
  (`\x85`, `\x1c`-`\x1f`) → même champ ; `sorted()` → des identifiants **à deux chiffres**, le tri
  par défaut de JavaScript étant **lexical**. ⭐ Sont aussi éprouvés et portés : le **`\b` UNICODE**
  (*« infidèle »* ne contient **pas** *« fidele »* isolé pour Python), le **`\w` UNICODE**, le
  formatage **`%.2f`** *(qui tranche AU PAIR)*, **`str()` d'un flottant** *(`relation_rendue` à 1.0
  s'écrit « 1.0 », `String(1)` rend « 1 » — et c'est **dans la trace**)*, **`str()` d'une liste**, et
  **`for x in v` sur une CHAÎNE** *(un `entre: "12"` ne relie PAS 1 et 2 : il porte deux unités
  inexistantes)*.
- [x] **C4L10SY-9 · ⭐⭐ LES TREIZE OBSERVABLES DU §5 ONT LEUR VALEUR AU RELEVÉ — le plus gros paquet
  des six, quand le module n'en rend que trois.** **Un se RECOPIE** : `apport_organisateur` a mot pour
  mot la définition de `seuil_franchi` — un seul calcul, deux lectures, le relevé recopie le verdict de
  `code2`. **Six se lisent aux mesures.** **Six demandent un calcul propre** : `couverture_essentielles`
  *(après la fidélité — c'est ce que la règle d'agrégation lit)*, les trois rétrogradations du crible
  *(par étiquette, après l'appariement des termes)*, et les deux contresens *(après la borne basse)*.
  ⚠️ **DEUX dénominateurs**, portés sous leur nom exact : *« les apports tentés »* — qui vaut
  `nb_apports`, ce que **l'élève** a écrit, et non le nombre de criblés — et *« les unités appariées à
  la référence »*, qui vaut `couvrantes`.
- [x] **C4L10SY-10 · ⛔ LA POPULATION DE `copie_verbatim` EST UN ARBITRAGE DE LOUIS, PAS UNE LECTURE.**
  Cinq des six `proportion` de cette fiche écrivent leur fraction ; **`copie_verbatim` est *« part
  d'unités en `copie` »*, sans dénominateur**, et la fiche distingue deux populations. ⚠️ **La question
  porte DEUX FOIS** : sur l'observable **et** sur la branche **Absent** du §4 *(« reprise verbatim
  dominante »)*. Trois unités dont une `copie` et deux `apport` donnent **1,0** sur les couvrantes et
  **0,33** sur toutes les unités. ⭐ **Tranché le 23/08 : les unités couvrantes**, comme le module —
  et c'est le parallèle de `part_integrative`, que le §4 « Ce que le code compose » #3 met dans la même
  énumération. *Marqué comme décision de source dans le code, et fixé par un test discriminant.*
- [x] **C4L10SY-11 · UN DÉPÔT RÉEL TRAVERSE LA CHAÎNE ET ÉCRIT UN SQUELETTE, UNE MESURE ET SA
  LETTRE.** Référent **cours** — la synthèse en classe : **6 appels, 46 s à deux chaînes**, un
  squelette portant **son extraction ET son jugement**, **une mesure, lettre A**, et **les treize
  observables en base** (aucun absent). `instrument_version = 3.4`, la ligne VERSION de la fiche.
  ⭐ **L'extraction est rangée PAR PHASE — `{ p1a: … }` — et le cours n'en a qu'UNE** : c'est la
  Synthèse qui a fait exister cette forme, étant la seule à avoir deux étages.
- [x] **C4L10SY-12 · ⭐ LA COPIE DE RECETTE A MONTRÉ LE CRIBLE À L'ŒUVRE, SUR PIÈCE.** P1A a relevé
  **6 unités, 5 rapports** *(dont un `additive`)* **et 3 apports** ; le crible en a rendu **deux
  `organisateur` et un `vide`** — et le `vide` est *« la mémoire est une question complexe »*,
  exactement le chapeau que la copie portait pour lui. `mobilisation_reliee = 0,833`, base **Bon**,
  seuil ouvert → **Acquis**. ⭐ Et `apport_vide = 1/3` : le dénominateur est bien **les apports
  tentés**. ⭐ **Le jugement porte `"fidelite": []`**, comme le prompt le prescrit sans alignement, et
  **P1A ne rend aucun alignement** — l'aligneur n'a pas tourné.
- [x] **C4L10SY-13 · LES SEPT SLOTS, ET LA SEULE CHAÎNE DES SIX QUI CHANGE DE FORME.** **P1A** porte
  trois slots — `{consigne}` **natif**, `{pre_releve}` et `{production}` servis par `pre_p1a`, qui
  range son calcul sous **`_mesures`**, à tiret bas ; **P1B** en porte trois, tous servis par
  `pre_p1b` ; **P2** n'en porte **qu'un**, donc c'est le document, **sans déclaration**, et il n'y a
  **aucun `pre_p2`**. ⭐ `extractions()` rend **UN** étage sur le cours et **DEUX** ailleurs, lu sur
  `ctx.referent`. La **tête cacheable** de P1A fait **4 733 caractères** et ne porte aucun slot.
  `refusSlotsExtraction` et `refusSlotsJugement` rendent **0 refus**, au chargement, dans les deux
  sens.
- [x] **C4L10SY-13bis · LA `cible_primaire` BAT L'ORDRE ALPHABÉTIQUE, une SIXIÈME fois**, sur trois
  instances — le repli aurait dit « expression » dans les trois cas. Et **sans** `cible_primaire`,
  l'alerte tombe. **L'IDEMPOTENCE** : une reprise rejoue la chaîne *(6 appels — ce n'est pas un
  cache)* et n'écrit **aucune seconde mesure** ; le bilan le dit par `mesuresDejaLa = 2`,
  `mesuresEcrites = 0`.

### Ce que ce lot vient de LEVER ailleurs dans ce fichier

- ⭐⭐ **`C4L10E-15` NE COMPTE PLUS AUCUNE COMPÉTENCE EN ATTENTE.** Les six sont ouvertes ; C4-L10 ne
  se rejoue plus.
- ⭐ **`C4L5-4`** *(« une fiche qui définit son delta »)* **ne se lèvera jamais par une reprise de
  C4-L10 : SIX fiches sur six se taisent, le corpus entier est épuisé.** Le mot « delta » n'apparaît
  **pas une seule fois** dans `competences/synthese.md`. *La condition doit être requalifiée : ce
  n'est plus « la prochaine fiche », c'est une décision de conception sur le gabarit du `03-` §1.*

### Ce qui reste à jouer en recette

- [x] **C4L10SY-14 · ✅ LEVÉ LE 23/08, À LA DEMANDE DE LOUIS — LA RÉFÉRENCE DÉCOMPOSÉE DESCEND, ET
  LE RÉFÉRENT TEXTE MESURE.** `lireContexte` joint `exercices_references` : `contenu` donne la
  référence, `source_contenu_id → scriptorium_contenus.texte_extrait` donne **le matériau**.
  `FOURNISSEURS_NATIFS` passe de quatre noms à **six**. ⛔ **Servie SEULEMENT si elle est VALIDÉE** —
  `garde_reference_validee`, en base, **lève une exception** dès qu'un `artefact_jugement` s'écrit
  sinon : servir une référence non validée échangerait un arrêt propre contre une exception qui
  emporte la trace. *Constaté en base : squelette à **deux phases** `p1a,p1b`, mesure écrite
  (**E**), et `taux_compression = 0,58` — le matériau est là.* ⭐ **Et le même geste ouvre les quatre
  modes réceptifs du Questionnement**, qui lisait déjà `ctx.contexteExercice.reference` en attendant
  ce jour. **Voir `C4L10SY-20`, `C4L10SY-21` et `C4L10SY-22` : le chemin a fait apparaître trois choses
  que personne ne pouvait voir sans servir une VRAIE référence.** ~~L'énoncé d'origine~~
- [ ] ~~**C4L10SY-14 (origine) · LA SYNTHÈSE SE TAIT SUR LE RÉFÉRENT TEXTE, ET C'EST LE MÊME CANAL QUE
  CELUI DU QUESTIONNEMENT.**~~ Constaté **en base**, sur un dépôt réel portant une `reference_id` : l'aligneur
  réclame `{reference_decomposee}`, `pre_p1b` le sert à **`null`**, et la chaîne **arrête la mesure en
  nommant le slot** — *« synthese : REFUS : le contexte de l'exercice ne porte pas de quoi servir
  reference_decomposee à P1B »*. **Aucune mesure, AUCUN squelette** *(le refus tombe au service des
  slots, avant le premier appel de la phase qui manque)*, et **l'expression du même dépôt mesure
  normalement** *(A)*. ⭐ **Le canal est bon** : servi une référence au contexte, `pre_p1b` la sert.
  ⛔ **Ce qui manque est le FOURNISSEUR** : `contexteExercice` porte quatre noms, et `contexte.ts` ne
  lit `exercices.reference_id` **que** pour en déduire `texte | cours | null`. ⭐⭐ **UN SEUL GESTE
  FERME LES DEUX MANQUES DE LA SYNTHÈSE ET CELUI DU QUESTIONNEMENT (`C4L10Q-15`)** :
  `exercices_references` porte **`contenu`** *(la référence — dont le Questionnement lit
  `armature.question_directrice`)* **ET** `source_contenu_id → scriptorium_contenus.texte_extrait`
  *(le texte source, dont le pré-relevé de la Synthèse a besoin pour la compression et les
  recouvrements)*. **Condition de reprise : la décision de Louis** — poser ces fournisseurs natifs
  touche `contexte.ts` et `chaine.ts`, hors du périmètre d'un lot « à diff quasi nul ».
- [ ] **C4L10SY-20 · ⛔⛔ LE MODULE ET LA SOURCE NE PARLENT PAS LE MÊME FORMAT DE RÉFÉRENCE — trouvé
  le 23/08 en servant la première VRAIE référence.** `copies-tests/_commun/verifie-reference.py`
  déclare le schéma **CLOS** : `phrases {n, fonctions, statuts}` · `moments {m, de, a, fonction,
  cible, statuts, etiquette}` · `armature` · `concepts` · `lectures` · `hesitation` — et *« toute
  autre clé est la porte par laquelle une crédence chiffrée reviendrait »*. ⚠️ Or
  `copies-tests/synthese/code.py` lit `reference["unites"]` et `moments[].unites` : **ni l'une ni
  l'autre n'existe au format canonique**. *Le Questionnement, lui, lit `armature.question_directrice` :
  canonique.* ⭐⭐ **Et ce n'est pas une curiosité** : descendre la référence sans traiter ça aurait
  fait composer un palier **Moyen** sur des décomptes tous nuls — un arrêt propre échangé contre une
  **lettre C servie à un élève**. ⭐ **Ce que le portage fait, et pourquoi c'est à lui de le faire** :
  le contrat §7 pose que *« le parsage tolérant appartient au BANC, pas au module »* — le banc est le
  harnais du module en calibration, la chaîne l'est en production, donc **normaliser la source vers
  ce que le module lit est le travail du harnais**. La correspondance est mécanique et garantie
  (`phrases[].n → unites[].u` — *« la segmentation qui fait foi, la même que le pré-relevé de la
  Synthèse »* —, `de..a → moments[].unites`, le validateur garantissant le pavage). ⛔ **Elle est
  ADDITIVE** : `unites` s'ajoute **à côté** de `phrases`, jamais à leur place — le juge lit la
  référence entière par `document_p2`, et c'est là qu'il prend le **statut d'énonciation** et les
  **lectures défendables**. **Deux verrous** : `pre_p1b` refuse une référence illisible **avant le
  premier appel payé**, et `code2` refuse de composer si elle arrivait par une autre route.
  **Condition de reprise : le pré-vol du Run 1 de la Synthèse** — c'est au MODULE de lire le format
  qui fait foi, et la normalisation du harnais devra alors devenir un no-op.
- [ ] **C4L10SY-21 · ⚠️⚠️ DETTE DE SOURCE — LA FICHE SYNTHÈSE IGNORE `relance`, QUE LE `02-` §6
  DÉCLARE.** La vraie référence en base porte **`relance`** sur **4 de ses 17 phrases**. Le
  `02-exercices.md` §6 pose la liste des fonctions de phrase **OUVERTE**, initiée à `defend_these ·
  illustre · explique · relance`, et dit ce qu'elle vaut : *« `relance` est la phrase qui ouvre la
  suite sans rien avancer […] **Elle ne porte aucun contenu à restituer : une phrase dont `relance`
  est la seule fonction n'est pas une unité de restitution.** »* ⛔ Le bloc machine de
  `competences/synthese.md` n'en déclare que **TROIS**, et son §3.2 ne dérive un statut que de
  celles-là. ⭐ **La conduite reste juste** — ces phrases sortent des décomptes de couverture,
  exactement ce que la source prescrit — **mais par DEUX ALERTES chacune** *(« fonction inconnue »,
  puis « aucune fonction lisible »)* au lieu d'une exclusion nommée. ⚠️ **Non corrigé** : une source
  trouvée en retard se **marque**, elle ne se corrige pas depuis le code. **Condition de reprise : la
  séance de conception qui accordera le bloc machine de la Synthèse au `02-` §6** — le geste est
  d'ajouter `relance` au catalogue et de dire au §3.2 qu'il n'ouvre aucun statut.
- [x] **C4L10SY-22 · ⭐ LA RÈGLE ABSOLUE DE L'EXTRACTION TIENT SUR PIÈCE — « ne rien créditer ».** La
  recette a servi la seule référence validée de la base — un texte de Descartes — à une copie qui
  restitue un cours sur la mémoire. **L'aligneur a rendu six `apport`, ZÉRO correspondance** : *« une
  unité de la référence n'est restituée que si l'unité de l'élève la dit effectivement, jamais parce
  que ça va de soi »* (fiche §1). Zéro couvrante, donc **zéro fidélité** — et le prompt du juge le
  prescrit : *« si aucun alignement ne t'est fourni, rends `fidelite: []` »*. ⚠️ *Un attendu de la
  recette a rougi là-dessus : il supposait un décor cohérent. L'assertion porte désormais la vraie
  règle — zéro couvrante ⇒ zéro fidélité.*
- [ ] **C4L10SY-15 · ⚠️⚠️ UN GARDE-FOU ACTÉ EST INERTE DANS LE MODULE, ET RIEN NE LE DIT.**
  `code2` lit `mesures["termes_reference"]` *(ligne 490)*, **qu'aucun chemin de `code1` n'écrit** — au
  module comme au portage. Le garde-fou **acté** `apport_apparie` — *« un apport dont le terme se
  retrouve dans la référence n'ouvre pas le seuil »*, bloc machine, statut **acté** — ne se déclenche
  donc **jamais**. ⛔ **Non corrigé** : le mandat de la séance ne levait le piège A-2 que pour
  `document_p2`, et corriger ici ferait diverger le portage du module que le banc validera.
  **Condition de reprise : le pré-vol du Run 1 de la Synthèse**, qui est le moment où le module se
  reprend.
- [x] **C4L10SY-16 · ⚠️ `taux_compression` NE SE MESURERA PAS TANT QUE LA CHAÎNE NE PORTERA PAS LE
  MATÉRIAU.** Le pré-relevé du §3 compte *« le nombre de mots de la production **et du matériau** »* ;
  `contexteExercice` ne porte aucun matériau, `taux_compression` sort donc en **`n/a`** avec son alerte
  nommée. ⭐ **Il n'est pas requis** — le §5 l'exclut explicitement des observables requis de
  l'escalade : *« un signal de conformité de consigne, pas de compétence : il pilote la confiance,
  jamais l'escalade »*. ⛔ **Et le slot NE MENT PAS** : sans matériau, le pré-relevé **ne dit pas**
  « aucune » reprise littérale — il dit qu'il n'a pas pu chercher. *C'est le seul point où le portage
  s'écarte du module, et c'est un durcissement : le banc, lui, sert toujours une source.* ⭐ **LEVÉ LE 23/08 SUR LE RÉFÉRENT TEXTE** : le matériau descend par la même jointure que la
  référence (`source_contenu_id → scriptorium_contenus.texte_extrait`), et `taux_compression` a
  mesuré **0,58** sur un dépôt réel. ⚠️ **Il reste `n/a` sur le référent COURS**, et c'est normal :
  le §5 l'y déclare sans objet, et un cours n'a pas de texte source. **Condition de reprise :
  aucune.**
  > ✅ **PASSE DE RÉCONCILIATION DU 28/08 — LE MATÉRIAU DESCEND, ET `taux_compression`
  > A ÉTÉ MESURÉ.** La condition était *« tant que la chaîne ne portera pas le matériau »* : elle
  > est tombée le **23/08**, quand `contexte.ts` a joint `exercices_references` et que
  > `source_contenu_id → scriptorium_contenus.texte_extrait` a fait descendre le matériau
  > *(`FOURNISSEURS_NATIFS` passe de quatre noms à six — c'est `C4L10SY-14`, cochée)*. ⭐ **Et il
  > est mesuré, pas déduit** : sur le référent TEXTE, la recette a rendu **`taux_compression =
  > 0,58`** — l'observable ne sort plus en `n/a`, et le pré-relevé cherche bien ses reprises
  > littérales.
- [ ] **C4L10SY-17 · ⚠️ LE RETOUR N'A PAS ÉTÉ INSPECTÉ SUR CE TOUR, et `elagage` est le seul des treize
  codes qui soit un mot français ordinaire.** L'item 37 de la boîte aux lettres demandait ce geste.
  **Fait par l'analyse, pas par l'observation** : `fuitesRR4` *(`utils/chaine/retour.ts`)* cherche
  chaque code **en sous-chaîne** et **ne replie pas les accents** — un retour qui écrit « élagage » ne
  déclenche rien, un retour qui écrirait « elagage » **ferait refuser tout le retour**. *Le risque est
  réel mais mince.* ⭐ La lecture de `bilan.retourEcrit` est **ajoutée au script de recette** pour le
  prochain tour. **Condition de reprise : le prochain tour de `synthese-c4l10.mjs`, ou C4-L7.**
- [x] **C4L10SY-18 · LA LATENCE À DEUX CHAÎNES : 46 s.** À comparer aux **39 s à une**, **47-52 s à
  deux**, **55 s à trois** *(mesuré deux fois indépendamment)* et **59 s à quatre** *(non comparable)*
  des lots précédents. ⭐ **La mesure tombe dans la fourchette de la Structure et de l'Argumentation au
  même nombre de chaînes**, et la courbe reste plate. ⚠️ La variance du fournisseur reste du même ordre
  que l'effet mesuré. **Condition de reprise : C4-L7**, qui mesure le flux de bout en bout.
  ✅ **AMENDÉ PAR C4-L7 (24/08) — LA CONDITION EST HONORÉE : CINQ TOURS DE PLUS, ET LA COURBE RESTE
  PLATE.** Mesures de la traversée, chronométrées autour de `traiterDepot` / `mesurerMaintenant` :
  **48,8 s** et **49,5 s** à **TROIS** chaînes froides en parallèle *(structure + expression +
  argumentation, voie classe)* ; **31,8 s** (v1) et **40,4 s** (vf) à **UNE** chaîne, voie maison ;
  **30,4 s** à une chaîne par la route `/api/chaine`. ⭐⭐ **LE CONTRAT TIENT AVEC PLUS DE TROIS FOIS
  LA MARGE** : moins de 50 s contre un contrat de moins de 180 s, à trois compétences — et la clause
  du « fait quand » de C4-L7 demandait qu'il tienne **à deux**. ⭐ **La courbe reste plate** : passer
  de une à trois chaînes coûte ~17 s, pas le triple — les chaînes tournent bien en parallèle et le
  retour est l'appel commun. ⚠️ **Deux réserves, et elles se disent.** *(a)* Les deux mesures à trois
  sont sur la **voie CLASSE** : le contrat de trois minutes **ne porte que sur le retour maison**
  *(pièges 16-17 ; §1.1)* — la chaîne est la même, mais la clause ne s'y applique pas.
  *(b)* **La variance du fournisseur reste du même ordre que l'effet** : 48,8 vs 49,5 s sur deux
  tours identiques. **⛔ L'extrapolation à SIX chaînes froides reste à faire** — aucun exercice du
  décor n'en mesure six. **Condition de reprise restante : un dépôt dont l'instance déclare les six
  compétences.** *(`traversee-c4l7.mjs`.)*
  > ✅ **PASSE DE RÉCONCILIATION DU 28/08 — LA CONDITION EST HONORÉE, ET LE BLOC LE DIT
  > DÉJÀ.** L'amendement de C4-L7 du 24/08, ci-dessus, porte les cinq tours demandés et le verdict
  > *« la courbe reste plate »*. **La case n'avait pas suivi.** ⚠️ *Ce qui reste — l'extrapolation
  > à SIX chaînes — n'a jamais été de cette ligne : il vit à `C4L10C-25`, avec sa propre
  > condition.*
- [ ] **C4L10SY-19 · ⚠️ LE MODULE LÈVE SUR DIX-NEUF FORMES QUE P1 OU P2 PEUVENT PRENDRE, et le contrat
  §3 l'interdit.** Mesuré sur les 6 069 cas : un `crible` non-objet ou en texte, une note de
  « limite » qui n'est pas une chaîne, un `correspond_a` non parcourable, un `alignement` en texte,
  des `fonctions` de référence qui sont un nombre, une unité du relevé qui n'est pas un objet.
  ⭐ **Le portage traverse et NOMME**, chaque durcissement marqué en commentaire, et **aucun ne se
  déclenche sur un vecteur** — un test assère qu'il ne lève jamais et qu'il ne se tait jamais.
  ⛔ **Le module n'est pas corrigé** : hors mandat. **Condition de reprise : le pré-vol du Run 1**,
  avec `C4L10SY-15`.


---

## C4 · L14 — La correction d'un cran à candidats, et le champ qui la rend possible (sandbox, migration du 24/08)

_Section ouverte le 24/08 à la clôture du lot. **Une migration** : `c4_l14_pourquoi_juste.sql`,
**additive et gatée**, jouée en bac à sable le 24/08 *(ligne au `SUIVI_SQL.md` écrite AVANT, répétition
à blanc sur le CORPS du fichier, retour vérifié par requête)*. **Aucun `[faux]` posé dans une source** :
rien de ce que ce portage a trouvé n'est une source fausse — les deux constats transverses sont portés
à `IDEES_post_rentree.md`._

_Ce qui a été prouvé EN SÉANCE est coché avec sa preuve. **`npm test` à l'entrée : 1 234 tests,
1 233 passés, 1 ÉCHOUÉ** — `utils/chaine/instruments.test.ts`, échec **PRÉEXISTANT** et étranger à ce
lot *(le `07-` était passé de 2.41 à 2.43 et les dérivés portaient l'ancienne empreinte)*, résolu
**pendant la séance par une autre session** *(commit `fc30441`, Louis ayant rejoué `--ecris`)*.
**À la sortie : 1 260 tests, 1 259 passés, 1 échoué** — **le même test**, et cette fois **à cause de ce
lot** : l'amendement du `07-` §1.1 et de l'inventaire du §2, que ce lot avait mandat de faire, le fait
passer en **2.44** et périme la **provenance** des deux dérivés. **Vérifié fichier par fichier sur les
dix dérivés : QUATRE LIGNES, DEUX FICHIERS, toutes de provenance** — l'empreinte SHA-256 du `07-` et
son numéro de version ; **le gabarit Calame n'a pas bougé d'un octet**. `npx tsc --noEmit` : **rien** ;
`npm run lint` sur les fichiers du lot : **0 erreur, 0 avertissement** *(les 2 erreurs du dépôt sont
dans `handoff_en_tete/support.js`, préexistantes et étrangères)*._

### Prouvé en séance

- [x] **C4L14-1 · Le port rend LES MÊMES VERDICTS que le script sur ses 53 vecteurs.**
  `verifie-import.py --autotest` : **53 vérification(s) jouée(s), ✓ tout passe**. Le port TS :
  `utils/fabrique/verifie-import.test.ts`, **60 tests, 60 passés**, dont les **quatre vecteurs neufs
  recopiés sans adaptation** — un cran 1 complet *(douze candidats motivés + `pourquoi_juste`)* qui
  **passe**, son pendant négatif *(il ne signale ni candidat muet ni pourquoi manquant)*, **S10**
  *(un cran 1 sans `pourquoi_juste`)*, **S11** *(deux distracteurs muets — UNE ligne, agrégée)* et
  **R12** *(un `pourquoi_juste` hors des crans 1 et 3)*.
- [x] **C4L14-2 · ⭐ LES DEUX CONTRÔLES, CONFRONTÉS SUR LE MÊME FICHIER RÉEL, MOT POUR MOT.**
  `generateur/banque/banque.json`, produite par `papier.py`. **Deux états successifs de ce fichier ont
  été mesurés** *(une autre session l'a versée pendant la séance)*, et les deux contrôles ont rendu
  **exactement la même ligne à chaque fois** : d'abord `→ IMPORTABLE — 0 refus, 0 blocage(s),
  **18 signalement(s)**` *(9 exercices, sous la 1.0)*, puis `→ IMPORTABLE — 0 refus, 0 blocage(s),
  **6 signalement(s)**` *(22 exercices, **sous la 1.2**, 26 des 29 cas de cran 1/3 motivés)* —
  signalement par signalement, dont les trois qui nomment les cas encore muets.
- [x] **C4L14-3 · Le « fait quand », première clause : un fichier produit par `papier.py` SOUS LE
  FORMAT 1.2 entre SANS REFUS.** Prouvé sur le fichier réel ci-dessus, `"version": "1.2"`, **0 refus**.
  ⭐ **Et le port d'AVANT le refusait** : mesuré en rejouant la version `HEAD` du module sur le même
  fichier — **3 refus, tous `[R02]`**, « clé « pourquoi_juste » que le `08-` ne déclare pas ». C'est
  exactement le chiffre annoncé par le `07-` §2.
- [x] **C4L14-4 · La colonne, en base.** `exercices_cas.pourquoi_juste` : `text`, `is_nullable = YES`,
  **aucun défaut**, **aucune contrainte de plus** *(6 avant, 6 après)*, **aucune policy touchée**
  *(1 avant, 1 après)*. **`les_six_toujours_a_off = t`.** Constat d'entrée : 17 cas en base, dont
  **6 aux crans à candidats**.
- [x] **C4L14-5 · ⭐⭐ LA RÈGLE DE L'ÉGALITÉ, ÉCRITE ET TENUE PAR UN TEST DISCRIMINANT.**
  `utils/deroule/correction.ts:leCandidatLePlusCharge`. **Sur une égalité, aucun candidat n'est le plus
  chargé** : aucun `pourquoi_faux`, le `pourquoi_juste` **seul**, **et l'écran le dit**. Le test assère
  **les deux valeurs sur le même `25/25/25/25`** — `choix` rend **0**, la correction rend **`null`** —,
  plus l'égalité partielle en tête *(40/40/20/0)*, l'égalité hors tête *(60/20/20/0, qui ne compte
  pas)* et trois répartitions illisibles. ⛔ **`choix` n'a pas été touché.**
- [x] **C4L14-6 · Les trois choses, et LA SEULE réfutation.** `utils/deroule/correction.test.ts` :
  **20 tests, 20 passés**. Un test assère explicitement que **les deux autres `pourquoi_faux`
  n'apparaissent nulle part** dans ce que l'écran sert. Quatre silences se disent sans rien inventer :
  égalité · bonne réponse chargée · candidat muet *(dont **une instance conçue en ligne**, dont la
  banque est faite de chaînes)* · crédence illisible.
- [x] **C4L14-7 · Le sixième état, et le cas terminal qui a changé.** `etapeDeLaPaire(['a','b'],
  [{cas:1},{cas:2}])` rend désormais **`correction_2`** ; `[{cas:1}, null]` rend toujours
  **`credence_2`**. `ETAPES_PAIRE` en compte **six**, dans l'ordre. `utils/deroule/regime.test.ts` :
  **18 tests, 18 passés**.
- [x] **C4L14-8 · Les DEUX endroits qui rendaient le second cas muet sont tombés.** `vue.ts` ne compose
  plus la correction depuis `casBruts.find(c => c.ordre === 1)` : **un seul champ, `corrections[]`,
  généralisé par cas** ; et `EcranDeroule.tsx` n'a plus sa garde `c.ordre === 1`.
- [x] **C4L14-9 · L'affirmation renversée est retirée, ET ELLE SEULE.** `grep` sur *« n'est pas servi à
  l'élève — c'est une note de »* dans `utils/deroule/credence.ts` : **0**. Les deux formes physiques,
  les deux écrivains et « on ne normalise rien en base » **sont toujours là**.
- [x] **C4L14-10 · Les TROIS sites d'écriture sont câblés**, et le troisième est celui qu'on oublie :
  `import-ecriture.ts` *(insert)*, `app/prof/conception/actions.ts` *(insert à la création)* et **le
  même fichier à la mise à jour de l'édition**. Le champ se **saisit** aux deux formulaires
  *(`Pipeline.tsx`, `Edition.tsx`)* et **se relit** *(`[id]/page.tsx`)*.

### Reste à jouer en recette

- [x] **C4L14-11 · ⛔ LE CONTRÔLE DE DÉRIVATION DES INSTRUMENTS EST ROUGE, ET C'EST CE LOT QUI L'A
  ROUGI.** `derive-instruments.py --verifie` dit **DIVERGE** sur `MANIFESTE.ts` et `calame-retour.ts`
  — **4 lignes, 2 fichiers, uniquement l'empreinte du `07-` et son numéro (2.43 → 2.44)**, vérifié par
  régénération dans un dossier d'essai : **aucune ligne de contenu ne diffère**. Le geste qui le
  referme est `python3 scripts/derive-instruments.py --ecris`. ⚠️ **Il n'a PAS été joué** : le commit
  `fc30441` du 24/08 pose que *« une session Code n'en a pas le droit »* et que Louis l'a rejoué
  lui-même la veille pour la même cause. **Condition de reprise : un geste de Louis** — une commande,
  puis `npm test` doit rendre **1 260/1 260**.
  ✅ **AMENDÉ PAR C4-L7 (24/08) — LE GESTE A ÉTÉ FAIT, ET LES DEUX BORNES SONT VERTES.** Constaté au
  contrôle d'entrée de C4-L7 : `python3 scripts/derive-instruments.py --verifie` rend
  **`INSTRUMENTS : IDENTIQUE (10 fichier(s) dérivé(s))`**, et `npm test` rend **1 260 / 1 260,
  0 échoué** — exactement le chiffre que cette entrée demandait. *Les deux dérivés régénérés
  (`MANIFESTE.ts`, `calame-retour.ts`) sont au commit `b648740`.* ⛔ **C4-L7 n'a PAS joué `--ecris`**
  *(interdit à une session Code — piège 2 de son prompt)* : le geste est celui de Louis, et cette
  entrée ne fait que le constater.
- [ ] **C4L14-12 · L'ÉCRAN DE L'ÉLÈVE N'A PAS ÉTÉ VU.** La correction à trois volets — la réponse, son
  pourquoi, la réfutation du candidat chargé — est **prouvée en fonctions pures et en types**, jamais
  **à l'écran**. Il faut un dépôt réel au **cran 1**, une première crédence donnée, puis le second cas
  et sa crédence. ⚠️ **Et la phrase de l'égalité n'a jamais été affichée.** **Condition de reprise : le
  smoke prof/élève de C4-L7**, ou un décor de recette au cran 1 *(le décor de C4-L3 est au cran 4)*.
  ⚠️ **AMENDÉ PAR C4-L7 (24/08) — NON LEVÉE, ET LE MOTIF EST UNE CONTRAINTE DE RÔLE, PAS UN
  MANQUE.** C4-L7 a traversé les deux voies de bout en bout **par requête**, mais *« une session Code
  ne saisit pas d'identifiants »* : la face professeur, et tout smoke dans un vrai navigateur,
  demandent **le Chrome de Louis** *(protocole écrit à la recette de C4-L6, et rappelé au piège 66 du
  prompt de C4-L7)*. ⛔ **Et il manque en plus la matière** : **aucune instance de cran 1 n'existe en
  base** — le décor traversé par C4-L7 est au **cran 2** *(maison)* et **sans cran** *(les examens
  diagnostiques, de nature `complet`)*. **Condition de reprise, PRÉCISÉE : (1) une instance de
  cran 1 conçue ou importée — la banque 1.2 en portera —, puis (2) le smoke élève dans un vrai
  navigateur.** *La phrase de l'égalité n'a toujours jamais été affichée.*
- [ ] **C4L14-13 · LE CRAN 3 N'A JAMAIS SERVI DE CORRECTION EN VRAI.** C'est le cas **hors paire** :
  pas d'état, la crédence du cas seule commande. Aucune instance de cran 3 n'existe en base *(les
  6 cas aux crans à candidats sont des crans 1 et 3 de la banque, non importés)*. **Condition de
  reprise : le premier import de la banque 1.2**, qui en portera.
- [ ] **C4L14-14 · L'ÉCRAN DE CONCEPTION N'A PAS ÉTÉ MANIPULÉ.** La saisie de `pourquoi_juste`, sa
  relecture après enregistrement, **et surtout sa SURVIE À UNE CORRECTION DU PROFESSEUR** *(le
  troisième site d'écriture)* sont câblées et typées, jamais exercées. ⚠️ **C'est précisément la perte
  silencieuse que le `07-` §2 met en garde** : elle ne se verrait qu'à l'écran de l'élève, des semaines
  plus tard. **Condition de reprise : le smoke prof de C4-L7**, en concevant une instance au cran 1,
  en la corrigeant, et en relisant le champ.
  ⚠️ **AMENDÉ PAR C4-L7 (24/08) — NON LEVÉE : LE SMOKE PROF N'APPARTIENT PAS À UNE SESSION CODE.**
  Même motif que `C4L14-12` : l'écran de conception est derrière `garderProf`, et une session Code
  n'a pas de session professeur — elle ne peut ni saisir `pourquoi_juste`, ni corriger l'instance,
  ni relire le champ à l'écran. ⚠️ *La perte silencieuse que le `07-` §2 met en garde reste donc
  entière et non éprouvée.* **Condition de reprise, PRÉCISÉE : Louis, dans son propre navigateur,
  `fabrique_actif` ouvert puis refermé — même geste que `C4L11-D`, avec lequel il se joue en une
  fois.**
- [ ] **C4L14-15 · LE JUMEAU DU REFUS N° 12 À L'ÉCRAN N'A PAS DE TEST.** `empechementsDeConception`
  refuse désormais un `pourquoi_juste` hors des crans 1 et 3, comme l'import. Le module n'a pas de
  banc de test dans le dépôt, et ce lot n'en a pas créé un. **Condition de reprise : C4-L7**, ou le
  premier lot qui touche `utils/fabrique/conception.ts`.
  ⛔ **AMENDÉ PAR C4-L7 (24/08) — CETTE CONDITION NE POUVAIT PAS DÉSIGNER C4-L7, ET IL FAUT LE
  DIRE.** Ce qu'elle demande est **un banc de test**, donc **du code neuf** — or *« C4-L7 ne construit
  rien »*, au pied de la lettre : pas de table, pas de colonne, pas d'écran, pas de route, et pas
  davantage un fichier de tests de production. **Écrire ce banc aurait été changer de lot en cours de
  route.** ⭐ **Condition de reprise CORRIGÉE : le premier lot qui touche
  `utils/fabrique/conception.ts`** — c'est la seconde branche de la condition d'origine, et c'est la
  seule des deux qui tienne. *(Voir `C4L7-10`.)*
- [x] **C4L14-16 · LA MIGRATION N'EST PAS EN PROD** — la prod n'existe pas encore *(C11b)*. ⚠️ **Et le
  RUNBOOK de C11b n'emporte aucune table de C4** : la colonne naîtra du `--schema-only`, mais **aucune
  ligne** ne suivra. **Condition de reprise : C11b.**
  > ✅ **PASSE DE RÉCONCILIATION DU 28/08 — C11b A EU LIEU, ET LA COLONNE EST EN PROD.**
  > La condition était `C11b` ; la production existe depuis le 25/08. **Vérifié par requête, en
  > lecture seule** : `exercices_cas.pourquoi_juste` répond **200** en production. ⛔ *La réserve
  > du RUNBOOK — « il n'emporte aucune table de C4 » — ne s'est pas réalisée : la prod est née d'un
  > dump `--schema-only` de la sandbox, qui portait déjà cette colonne.*

---

## C4 · L7 — La recette du flux (⚠️ **AUCUNE MIGRATION** — aucune n'était attendue, aucune n'a été écrite)

_Section ouverte le 24/08 à la clôture du lot. **Ce lot ne construit rien** : il éprouve. **Aucune
ligne au `SUIVI_SQL.md` n'est due, et aucune n'a été écrite.** Le seul fichier neuf est un
instrument de recette, `scripts/recette/traversee-c4l7.mjs` — le dix-neuvième du dossier —, plus son
registre de décor. **Aucun `[faux]` posé dans une source** : rien de ce que la traversée a trouvé
n'est une source fausse ; les défauts sont dans le CODE et sont relevés ici._

_**Les deux bornes.** À l'entrée : `npm test` **1 260 / 1 260, 0 échoué** · `npx tsc --noEmit`
**rien** · `derive-doctrine.py --verifie` **DOUZE `IDENTIQUE`** · `derive-instruments.py --verifie`
**`IDENTIQUE` (10 dérivés)** · **les six interrupteurs à OFF** · décor de C4-L6 **absent**. À la
clôture : **identiques**, et les six interrupteurs **re-constatés à OFF**._

_⚠️ **Le contrôle d'entrée a trouvé plus récent que la fabrication de son prompt, et l'a lu avant
tout** : `fa47bf4` *(les recettes rejouées vertes, plus deux outils neufs)*, `fc30441` *(naissance
de `C4-L12`/`C4-L13`)* et `b648740` *(**C4-L14**, section datée du 24/08)*. **Le `07-` a dérivé de
2.43 à 2.44** ; la clause de dérive a été appliquée : les **trois blocs de l'entrée C4-L7** —
manifeste, mission, « fait quand » — sont **identiques au mot près** à ceux recopiés au prompt._

### Le « fait quand », clause par clause

- [x] **C4L7-1 · ⭐⭐ LA VOIE DE LA CLASSE — L'ANCRE EST PRODUITE, ET SON RETOUR EST PUBLIÉ PUIS LU.**
  Un **examen diagnostique conçu** *(Codex, fenêtre `decembre` — la fenêtre `septembre` était prise
  par le décor de C4-L9 laissé en base le 23/08, et `uk_exercices_diagnostic` n'en admet qu'une par
  plan × fenêtre × type ; **on ne sème pas sur le décor d'un autre lot**)*, assigné à 7 élèves,
  ouvert, transcrit, remis, mesuré, corrigé, **publié**, **lu**. **57 contrôles, 0 échec.**
  ⭐ **L'ancre, en base** : les **trois** mesures portent `lieu = classe` **et `forme = sommatif`**
  — lue **là où la chaîne l'écrit**, `competences_mesures.forme`, jamais sur `exercices` où la
  colonne n'existe pas *(piège 24)* —, chacune avec sa **lettre-équivalente** *(`A`, `B`, `C`)*.
  ⭐ **Le retour** : `published_at` posé par `publier()`, puis **`exercices_retours.lu_at`** par
  `validerLaLecture()` — *« un seul domicile pour un seul geste »* —, et le dépôt s'arrête à
  **`retour_publie`** : *« pour une passation en classe, il n'y a pas de version finale »*
  *(piège 15)*, tenu. ⭐ **Le repli alphabétique tombe AVEC son alerte** — *« argumentation sert par
  convention (ordre alphabétique), pas par intention »* — et **c'est le comportement ATTENDU sur un
  examen** *(piège 29)*, pas un défaut.
- [x] **C4L7-2 · ⛔ LE ROUTEUR — L'ABSENCE EST CONSTATÉE ET DÉCLARÉE, AVEC SON MOTIF NOMMÉ.**
  La clause requalifiée le 23/08 demande un routage **exercé, ou dont l'absence est posée AVEC son
  motif** — *« quelle compétence manquait, et quel geste manquait »*. **Constaté par requête, avant
  et après la traversée** : `routeur_decisions` porte **0 ligne**, et **0 dépôt sur 53** ne porte de
  `routeur_decision_id`. **Constaté sur pièces** : `poserLaSemaine` *(`utils/routeur/semaine.ts:123`)*
  n'a **aucun appelant hors de `semaine.test.ts`**, son `candidatsPour` **aucun producteur**, et
  `competences_niveaux` **n'a aucun écrivain dans tout le dépôt** *(balayage `utils/`, `app/`,
  `scripts/` : tous les accès sont des `select`)*.
  ⭐⭐ **LE MOTIF, NOMMÉ EN DEUX PARTS, COMME LA CLAUSE L'EXIGE** :
  **la compétence qui manquait — AUCUNE** *(les six sont `evaluee` depuis le 23/08)* ;
  **le geste qui manquait — L'ÉCRITURE DE LA LETTRE.** `filtreR0` exige **deux** conditions,
  `statutRecette === 'evaluee'` **ET `lettre !== null`** *(`utils/routeur/ciblage.ts:62`)*, et il y a
  **0 lettre sur 102 lignes d'état**. **Ce n'est donc pas le statut qui éteint le routeur, c'est la
  lettre** — et son écriture est le **quatrième geste de `C4-L12`**, échéance avant le segment 2.
  ⭐ **Relevé PAR DIFFÉRENCE — ce que la voie du professeur ne produit pas** : aucune sonde
  secondaire *(la chaîne ne les lit que sur `routeur_decisions.sondes_retenues`)* · aucun budget
  décompté · aucune règle de pose PB1-PB6 · aucun ciblage R0-R5 · aucune journalisation du §11 ·
  et **l'historique des cibles reste vide, donc R2 et R5 sont AVEUGLES et la démonstration arrive
  toujours « avant »** *(`momentDeLaDemonstration` compte sur `routeur_decisions`)*.
  ⛔ **Décochée à dessein** : l'absence est déclarée, elle n'est pas levée. **Condition de reprise :
  `C4-L12`.** *La clause du « fait quand » est satisfaite par cette déclaration ; l'entrée reste
  ouverte parce que le routage, lui, ne l'est pas.*
  ⭐⭐ **LA CONDITION DE REPRISE EST TOMBÉE LE 24/08 — `C4-L12` EST JOUÉ, ET LE ROUTAGE EST EXERCÉ.**
  Le geste qui manquait — **l'écriture de la lettre** — est écrit *(cold start, médiane de classe,
  `lettre_initiale`, et l'état après chaque mesure)*, et le moteur tourne : **6 exercices posés sur
  deux élèves réels au segment 2**, avec sondes, borne amont, état d'escalade et minutes. ⭐ **Le
  relevé PAR DIFFÉRENCE de cette entrée n'a plus d'objet** : les sondes secondaires sont posées, le
  budget est décompté, PB1-PB6 et R0-R5 tournent, le §11 se journalise, et **l'historique des cibles
  n'est plus vide** — `momentDeLaDemonstration` bascule enfin de `avant` à `en_retour`.
  **Cochée. Détail : `C4L12-1` à `C4L12-15`.**
- [x] **C4L7-3 · ⭐ LA REPRISE APRÈS EXPIRATION — UN JOB TUÉ APRÈS P1, ET RIEN N'EST ÉCRIT DEUX
  FOIS.** *(= `C4L5-3`, coché le même jour.)* Un seul squelette, une seule mesure, un seul job —
  sous **trois** passages complets de la chaîne. **Le détail est à `C4L5-3`.**
- [x] **C4L7-4 · LE CONTRAT DE LATENCE TIENT, ET AVEC PLUS DE TROIS FOIS LA MARGE.**
  **48,8 s** et **49,5 s** à **TROIS** chaînes froides en parallèle ; **31,8 s** / **40,4 s** à une,
  voie maison ; **30,4 s** par la route. La clause demandait qu'il tienne **à deux**. ⚠️ **Deux
  réserves dites** : les mesures à trois sont sur la voie **classe**, où le contrat de trois minutes
  **ne porte pas** *(pièges 16-17)* ; et la variance du fournisseur reste du même ordre que l'effet.
  ⛔ **L'extrapolation à SIX chaînes reste à faire** — aucune instance du décor ne mesure six
  compétences. *(Détail à `C4L10SY-18`.)*
- [x] **C4L7-5 · ⛔⛔ LA VOIE DE LA MAISON VA JUSQU'AU RETOUR FINAL — ET S'ARRÊTE LÀ. LA CLAUSE
  « RETOUR FINAL **LU** » N'EST PAS ATTEIGNABLE.** **47 contrôles, 0 échec**, et tout le flux passe :
  instance conçue à la fabrique → assignation *(`origine: 'prof'`)* → déroulé → **les trois gestes de
  la remise dans l'ordre** *(remise prématurée REFUSÉE ; condition hors des trois valeurs REFUSÉE)* →
  remise → `mesurerMaintenant` *(en file **puis** déclenché — piège 73)* → mesure `lieu = maison`,
  `forme = formatif` *(sans ligne de plan, et **ce n'est pas un repli** — piège 25)*, **lettre-
  équivalente `C`** → version finale → **DEUX squelettes** → **retour final engendré**, et
  `delta_v1_vf` **NULL avec son alerte nommée**, dont le motif a été **lu** et ne ment pas ici.
  ⛔ **PUIS LE MUR — voir `C4L7-6`.** **Condition de reprise : le défaut de publication maison.**

### Ce que la couture a fait apparaître — défauts relevés, non corrigés

- [x] **C4L7-6 · ⛔⛔ RIEN NE PEUT PUBLIER UN RETOUR DE LA MAISON : IL EST ENGENDRÉ, PUIS
  STRUCTURELLEMENT INVISIBLE À L'ÉLÈVE.** *Le défaut central de ce lot, et aucun des dix qui le
  précèdent ne pouvait le voir : chacun est juste à sa frontière, et le trou est **entre** eux.*
  **Établi sur pièces, exhaustivement** : *(a)* la chaîne **n'écrit jamais** `published_at` — aucune
  occurrence dans `utils/chaine/` ; *(b)* `publier()` *(`utils/passation/retours.ts:186`)* n'a que
  **deux appelants de production**, `app/passation/actions.ts:159` et son jumeau de dépublication,
  **tous deux dans le flux de classe** ; *(c)* la pile de correction **exclut la maison par
  construction** — `utils/passation/vues.ts:49` : `if (d.exercice.lieu !== 'classe') return null`,
  commenté *« un dépôt de maison n'a rien à faire ici »* ; *(d)* **aucun défaut de colonne, aucune
  fonction, aucun trigger** ne le pose *(le seul trigger d'`exercices_retours` est
  `trg_retour_maison_non_edite`, qui garde `texte_edite_par_prof`)* ; *(e)* et
  `utils/deroule/vue.ts:614` **saute tout retour sans `published_at`** — *« un retour non publié
  n'existe pas pour l'élève : c'est une ABSENCE, pas un masquage »*.
  ⭐ **VÉRIFIÉ À L'ÉCRAN DE L'ÉLÈVE, pas seulement par requête** : `chargerLeDeroule` charge
  normalement sur un dépôt `vf_remis` portant **deux retours réels en base**, et rend
  **`chaud = ABSENT · final = ABSENT`**. Donc `lu_at` ne peut **jamais** être posé côté maison.
  ⚠️ **CE N'EST PAS LE PIÈGE 18.** Le §1.2 interdit l'**édition** d'un retour maison — et le trigger
  la tient. **La publication est un autre geste**, et le « fait quand » de C4-L7 la présuppose en
  toutes lettres : *« il suppose un `published_at`, qui est la case que coche le professeur »*.
  ⛔ **Non corrigé — C4-L7 ne corrige rien.**
  ✅⭐ **TRANCHÉ PAR LOUIS LE 24/08, en séance de revue : LA PUBLICATION EST AUTOMATIQUE.** La
  chaîne pose `published_at` quand elle écrit le retour ; la voie (ii) — ouvrir la pile de
  correction aux dépôts maison — est écartée, comme le `06-` §1.2 l'écartait déjà.
  ⚠️⚠️ **ET LA REVUE A ÉLARGI LE DÉFAUT SUR DEUX AXES, avant que la décision se prenne. La décision
  porte sur le défaut ÉLARGI.**
  **(a) LES DEUX MOMENTS, pas seulement la version finale.** `ecrireRetour`
  *(`utils/chaine/chaine.ts:946`)* écrit `moment = 'chaud'` sur la v1 **et** `moment = 'final'` sur
  la vf, **sans poser `published_at` ni dans un cas ni dans l'autre** ; et le filtre de
  `utils/deroule/vue.ts:613` tombe **AVANT** le tri par moment. ⭐ **Le plus grave est donc le
  retour CHAUD, pas le final** : c'est le **temps 4**, celui sur lequel l'élève **révise au temps
  5**. Sans lui, la révision se fait à l'aveugle, et le `delta_v1_vf` du temps 6 mesurerait l'écart
  entre deux versions dont la seconde n'a rien lu.
  **(b) LES TROIS GESTES, pas seulement `produire`.** `app/deroule/actions.ts:330` appelle
  `mesurerMaintenant` sur **toute** remise maison, sans regarder ni le geste ni le cran. La seule
  exception n'est pas un geste mais **deux crans** — `diagnostic_guide` et `transformation_guidee`,
  au jugement algorithmique, où *« rien ne vient derrière »* et où la correction est celle de
  C4-L14, qui ne passe pas par `exercices_retours`. **Les sept autres crans sont concernés.**
  ⚠️ **LE GARDE-FOU À NE PAS OUBLIER À L'ÉCRITURE** : conditionner sur **`lieu = maison`**. En
  classe, `publier()` **est** la case que coche le professeur *(`app/passation/actions.ts:159`)* ;
  un automatisme non conditionné court-circuiterait son geste.
  ✅✅ **POSÉE ET ÉPROUVÉE LE 24/08 — LE DÉFAUT CENTRAL DE C4-L7 EST FERMÉ.** `ecrireRetour`
  *(`utils/chaine/chaine.ts`)* reçoit désormais le `lieu` et pose `published_at` **aux deux
  moments** quand il vaut `maison`. ⛔ **Et seulement là** : en classe, `published_at` **EST** la
  case que coche le professeur — publier automatiquement lui retirerait le contrôle de ce que ses
  élèves lisent.
  ⭐⭐ **PROUVÉ SUR UN VRAI RUN, PAS PAR LECTURE** : copie remise à la maison *(cran 2, Elo)*, les
  trois gestes de la remise dans l'ordre, chaîne déclenchée, **retour engendré en 30 s**, et en
  base `published_at = 14:09:24`. ⭐ **PUIS VU À L'ÉCRAN DE L'ÉLÈVE** — « TON RETOUR · Reçu le
  24 août à 10 h 09 », un point **Réussi** et un point **À travailler**, chacun avec sa citation et
  son bouton « Je ne suis pas d'accord ». ⭐⭐ **ET `lu_at` EST ENFIN ATTEIGNABLE** : « J'ai lu mon
  retour » → « Lecture validée. » → `lu_at = 14:10:00` en base. *La clause du « fait quand » de
  C4-L7 — « retour final LU » — cesse d'être insatisfaisable.*
  ⭐ **CONTRE-ÉPREUVE FAITE** : sur la voie **classe** *(le décor de ce lot)*, `published_at` reste
  celui que le professeur a posé — l'automatisme ne déborde pas.
- [x] **C4L7-7 · ⚠️ `bilan.appels` PEUT SOUS-COMPTER — 7 ANNONCÉS, 8 LIGNES EN BASE.** Sur le
  **premier** des deux tours de la voie classe, le dépôt portait **8 lignes d'`api_couts`** quand
  `bilan.appels` disait **7** — un `p1` d'`expression` de plus, journalisé **après** tous les `p2`,
  avec un `tokens_entree` **identique** au premier *(675)* et une sortie différente.
  ⚠️ **Il NE s'est PAS reproduit** au second tour *(7 lignes = 7)* : c'est **intermittent**.
  **Ce qui est écarté sur pièces** : `expression` déclare **exactement UNE** extraction
  *(`utils/chaine/branchements/expression.ts:1507`)* ; les **seuls** émetteurs de `phase: 'p1'` sont
  `chaine.ts:563` *(attribué à la compétence)* et `monitoring.ts:176` *(attribué à `null` — et le
  Monitoring n'a fait **aucun** appel sur ce tour)*. **L'origine du passage surnuméraire n'est donc
  pas établie.** ⭐ **Le plafond, lui, est SAUF** : `appelsDuDepot` *(`chaine.ts:128`)* lit **la
  base**, comme le piège 72 l'exige — *« le plafond par dépôt se lit AU NOMBRE DE LIGNES EN BASE,
  jamais au bilan »*. C'est le **chiffre de diagnostic** qui ment, pas la garde.
  **Condition de reprise : le premier lot qui touche `utils/chaine/chaine.ts`** — instrumenter
  `traiterCompetence` pour compter ses passages, et confronter à `api_couts` à chaque tour.
  ✅ **INSTRUMENTÉ LE 24/08 — LA CONDITION ÉTAIT ÉCHUE, ET ELLE L'A ÉTÉ PAR MOI.** Le correctif de
  la publication automatique a touché `utils/chaine/chaine.ts` **sans instrumenter**, ce que cette
  entrée exigeait du premier lot qui y toucherait. *Relevé en relisant la section, réparé dans la
  foulée.*
  ⭐ **CE QUI EST POSÉ — un témoin, pas une garde.** `traiterDepot` compte désormais ses
  **`passages`** *(les entrées dans une chaîne de compétence — on compte les ENTRÉES, pas les
  retours : une chaîne qui lève est passée, et ses appels sont payés)* et **confronte le bilan à la
  base à chaque tour** : `appelsDuDepot` est relu en fin de tour, et `apresLeTour − dejaFaits` dit
  ce que ce tour a **réellement** écrit au journal. **L'écart part en alerte avec ses deux
  chiffres**, et le résumé servi à l'élève le porte aussi *(`utils/deroule/mesure.ts`)*.
  ⚠️ **`appels` NE CHANGE PAS DE SENS** et reste un chiffre de diagnostic : les deux gardes —
  `controlerLaFacture` et `appelsDuDepot` — lisent la base et ne passent pas par ce bilan
  *(piège 72)*. **Rien n'a été déplacé : un témoin a été ajouté.**
  ⚠️ **Une base illisible ne fabrique pas un faux écart** : `appelsDuDepot` rend `+Infinity` sur
  erreur, et le témoin vaut alors `null` avec son alerte propre — *on le dit, on n'accuse personne*.
  ⛔ **L'origine du passage surnuméraire reste NON ÉTABLIE** — c'est un défaut **intermittent**, vu
  une fois. **Ce qui change : il se dénoncera de lui-même la prochaine fois.** *Un chiffre qui ment
  une fois sur deux ne se débusque pas en le relisant.*
- [x] **C4L7-8 · ⚠️ DEUX ASSERTIONS DE `deroule-c4l3.mjs` SONT PÉRIMÉES — PAR C4-L14, ET CE N'EST
  PAS UNE RÉGRESSION.** `scripts/recette/deroule-c4l3.mjs --sans-appel` rend **84 passés, 2 échoués,
  1 non éprouvé**. Les deux rouges sont aux **lignes 929 et 963**, et ils assèrent sur
  **`vue.correctionDuPremierCas`**. ⭐ **Ce champ N'EXISTE PLUS** : C4-L14 l'a remplacé par
  `corrections: Array<CorrectionServie | null>` *(`utils/deroule/vue.ts:118`, servi l.376)*, et le
  commentaire de la l.116 le dit mot pour mot — *« Il remplace `correctionDuPremierCas`, qui ne
  pouvait rien dire du second »*. La lecture rend donc `undefined`, et les deux égalités tombent.
  **Le comportement est JUSTE** *(`utils/deroule/correction.test.ts`, 20 tests, verts dans les
  1 260)* ; **ce sont les ASSERTIONS qui figent un monde d'avant le 24/08**. *C'est la même famille
  que le piège du prompt sur les six scripts périmés par la pose des statuts — sauf que celle-là
  avait déjà été réparée par `fa47bf4`, et que celle-ci était neuve.*
  ✅ **RÉPARÉ LE 24/08, en séance de revue, à la demande de Louis.** Les deux assertions lisent
  désormais l'état par `corrections[0]` : `(vue.corrections?.[0] ?? null) === null` avant la
  crédence, `vue.corrections?.[0]?.reponse === ATTENDUE_CAS_1` après. ⭐ **La recette est au vert —
  `86 passés, 0 échoués, 1 ⊘`** *(le `⊘` restant est le bout-en-bout `aide_consommee`, qui demande
  que la chaîne tourne : il n'est pas un rouge)*. **Aucun code de production touché** — le seul
  `correctionDuPremierCas` qui subsiste dans le dépôt est le commentaire de `vue.ts:116`, qui
  raconte le remplacement.
- [x] **C4L7-9 · ✅ RÉPARÉ LE 24/08 — LA SÉRIE DE L'EXPRESSION PORTE ENFIN SON PRÉFIXE,
  `C4L10E-`.** La renumérotation du 23/08 au soir avait créé `C4L10A-`, `C4L10S-`, `C4L10C-`,
  `C4L10Q-` et `C4L10SY-` **et oublié l'Expression**, restée sous le préfixe nu `C4L10-` : un
  `grep C4L10-15` rendait **trois** lignes, et le prompt de C4-L7 affirmait l'unicité des
  identifiants pour vider la boîte aux lettres *« par identifiant »*. **Les 39 occurrences de
  `C4L10-N` sont renommées `C4L10E-N`** ; il n'en reste **aucune** sous le préfixe nu, et les six
  séries comptent **16 · 19 · 22 · 25 · 22 · 22** identifiants, sans un doublon.
  ⚠️⚠️ **ET LA CONSIGNE QUE C4-L7 AVAIT ÉCRITE ICI AURAIT FAIT DES DÉGÂTS — elle est corrigée avec
  le défaut.** Elle disait de renuméroter *« en `C4L10E-` / `C4L10A-` / `C4L10S-`, comme les cinq
  autres »*, c'est-à-dire **une par section où le numéro apparaît**. Or `C4L10A-14/15/16` et
  `C4L10S-14/15/16` **existaient déjà**, et désignaient tout autre chose : le geste aurait
  **fusionné six entrées distinctes** sous trois noms. ⭐ **Le diagnostic d'origine se trompait de
  nature** : ce n'étaient pas trois entrées homonymes, c'était **UNE entrée et DEUX mises à jour**
  — les lignes de l'Argumentation et de la Structure vivent sous *« Ce que ce lot vient de LEVER
  ailleurs dans ce fichier »*, exactement comme celles qui amendent `C4L5-2`, `C4L5-4` et
  `C4L5-1bis` depuis leur section d'origine. **Ce qui manquait n'était pas l'unicité, c'était que
  le préfixe dise de quelle section l'entrée VIENT.** *Un identifiant qui ne nomme pas son domicile
  se fait recopier au lieu d'être suivi.*
- [x] **C4L7-10 · ⚠️ `derive-doctrine.py --verifie` DIT `SOURCES : DIVERGE` ET `FIXTURE : DIVERGE`,
  ET LES DOUZE TABLES SONT POURTANT `IDENTIQUE`.** Réduit à sa cause : la fixture régénérée a été
  comparée **clé par clé** à celle du dépôt — **aucune ligne dérivée ne diffère**, seul le bloc
  `_derivation` bouge, sur **2 empreintes de 15** : `competences/argumentation.md` et
  `competences/connaissance.md`. Les deux fiches portent des **modifications NON COMMITÉES** dans
  `palimpseste-conception` *(leurs `VERSION` n'ont pas bougé — 4.3 et 2.2 —, et
  `derive-instruments.py --verifie` reste `IDENTIQUE`)*. ⛔ **Rien n'a été rejoué** : `--sql` ou
  `--fixture` ne réécriraient qu'un bloc d'empreintes, et **ce lot ne touche pas la base**.
  **Condition de reprise : la séance de conception qui commitera ces deux fiches**, puis un
  `--fixture` par le lot qui en aura le droit.
  > ✅ **PASSE DE RÉCONCILIATION DU 28/08 — CONDITION REMPLIE, ET REVÉRIFIÉE.** La condition
  > nommée était *« la séance de conception qui commitera ces deux fiches »* : elle a eu lieu — le
  > dépôt `palimpseste-conception` ne porte plus que `INVENTAIRE_Non_Tranches.md` et
  > `verifie-vocabulaire.py` en travail non commité. ⭐ **Rejoué le 28/08 :
  > `derive-doctrine.py --verifie` rend `FIXTURE : IDENTIQUE`**, et le commit `7869afd` le dit pour
  > l'autre moitié : *« `derive-doctrine.py --verifie` rend IDENTIQUE sur les TREIZE verdicts,
  > **SOURCES COMPRISES** »*, sandbox et prod. `derive-instruments.py --verifie` rend
  > `INSTRUMENTS : IDENTIQUE (10 fichiers)`.

### Ce qui reste à jouer en recette — et qui ne m'appartient pas

- [ ] **C4L7-11 · LES SMOKES À L'ÉCRAN — UNE SESSION CODE NE SAISIT PAS D'IDENTIFIANTS.**
  ⚠️⚠️ **CETTE LISTE EST CE QU'ON LIT QUAND ON DEMANDE « QUELS SMOKES RESTENT » — ET ELLE EST
  SUSPECTE DEPUIS LE 29/08.** Une passe de mesure la donne périmée aux trois quarts *(elle soutient
  que plusieurs de ces gestes ont un JUMEAU DÉJÀ COCHÉ ailleurs dans ce fichier, joués le 24/08)*.
  ⛔ **Je ne l'ai pas réécrite, et voici pourquoi** : à la mesure des CASES, les **neuf** cases
  nommées ci-dessous sont **toutes encore décochées** — la passe parlait du GESTE joué ailleurs, pas
  de la case, ce qui est une affirmation plus profonde et qu'il faut vérifier **une par une**.
  *Rayer neuf lignes sur un compte qu'on n'a pas refait serait pire que la liste périmée.*
  ⭐ **Ce qui EST mesuré (29/08)** : `C4L14-12` a été requalifiée en CORRECTIF le 24/08 *(sous
  `C4L7-15`)* et n'est donc plus un smoke ; la prémisse technique de `C4L13-15` est plus faible que
  son texte *(le motif `export type { X }` n'existe nulle part au dépôt — le vrai motif est que le
  résolveur de recette ne charge pas `next/cache`)* ; et `C4L14-13` a **perdu sa condition de
  blocage**, les crans 1 et 3 abondant désormais dans les deux bases.
  ⚠️ **À faire, et c'est une passe à part** : reprendre les neuf, jumeau par jumeau.
  Le
  protocole est celui de C4-L6 : la session travaille en requête, **Louis ouvre son propre Chrome**
  pour la face professeur. ⭐ **Le décor est LAISSÉ EN BASE exprès, et le chemin est préparé à
  `C4L4-4`.** Restent : `C4L2-13` *(les quatre écrans du pilotage)* · `C4L3-17` *(le déroulé élève)* ·
  `C4L10E-13`, `C4L10A-13`, `C4L10S-17`, `C4L10C-22` *(la tuile de la fabrique et l'encart langue)* ·
  `C4L11-D` *(les trois écrans touchés, `fabrique_actif` ouvert puis refermé)* · `C4L14-12` et
  `C4L14-14` *(la correction à trois volets, et `pourquoi_juste` à l'écran de conception)*.
  ⚠️ **Deux règles de terrain** : **toujours un vrai navigateur, jamais l'aperçu embarqué** *(les
  `confirm()` natifs y sont muets)*, et **Cmd-R avant de conclure à un bug**.
  ⚠️ **Le décor laissé** : ligne de plan `4770f701` *(note `RECETTE C4-L7`)*, instance `0f6c3fb4`,
  **7 dépôts**. **Registre : `scripts/recette/.traversee-c4l7-registre.json`. Retrait :
  `scripts/recette/traversee-c4l7.mjs --retire`.**
### ⭐ ANNEXE au 24/08 — L'ÉCRAN DE L'ALLUMAGE, né d'un manque que ce lot a mis au jour

_Ce lot a dû ouvrir et refermer des interrupteurs pour traverser, et il l'a fait **par requête**,
faute d'autre chemin. Le constat qui en sort est net : **les six interrupteurs que le `07-` §5
confie au professeur n'avaient aucun écran.** `poserPassationClasse`
*(`utils/passation/acces.ts:75`)* porte même le commentaire « ouvrir et refermer sont des gestes du
professeur ; **ceci existe pour la recette** » — et rien dans `app/` ne les basculait. Trois d'entre
eux — `routeur_actif`, `competences_affichage_actif`, `fabrique_actif` — n'avaient **aucun écrivain
applicatif du tout** : ils ne se posaient qu'en SQL, à la main._

**Décision de Louis, 24/08 : l'écran est construit, et il vit à `/prof/allumage`**, dans Pilotage.
*Le nom vient de la source — le `07-` §5 s'appelle « L'allumage ».*

⚠️ **IL EST HORS LOT, et cette ligne en tient lieu d'entrée.** Aucune entrée du `07-` §2 ne le
porte : C4-L6 est clos *(navigation Codex)* et C4-L11 déclare en toutes lettres « n'ouvre aucun
écran ». **Décision de Louis : une annexe à C4-L7 suffit — il n'y aura pas d'entrée au `07-` §2
pour lui.** *Il ne construit aucune fonctionnalité neuve : il sert des interrupteurs que le §5
déclarait déjà, et que personne ne pouvait atteindre.*

**Ce que le §5 imposait, et que l'écran porte** — il interdisait la présentation naïve en six
bascules :

- **DEUX GROUPES SÉPARÉS.** « Les trois ci-dessus répondent à des questions **du professeur** […]
  les trois ci-dessous à une question **de chantier** — **c'est pourquoi ils ne se mélangent pas aux
  premiers**. »
- **Chacun dit SA QUESTION**, recopiée du §5 au mot près, **et ce qu'il commande** — relevé sur les
  lecteurs réels du dépôt, jamais deviné.
- **Aucun grisage, aucune séquence imposée** : « ils s'ouvrent dans l'ordre que le professeur
  décide ».
- ⛔ **L'écran ne se ferme derrière AUCUN des six** — un écran d'allumage gardé par ce qu'il commande
  serait une porte fermée à clé de l'intérieur. Sa seule garde est `garderProf`.
- ⛔ **Et il n'est pas un septième interrupteur** : « aucun lot n'en crée un septième pour ses
  écrans ».

⭐ **TROIS AVERTISSEMENTS QUI ÉVITENT TROIS FAUSSES PANNES**, et c'est là que l'écran vaut mieux que
six cases : *(a)* **`chaine_actif` est le seul des six qu'une MACHINE bascule** — la coupure
automatique de coût l'éteint au plafond mensuel ; s'il se referme seul le 12 du mois, c'est la
facture, pas un bug ; *(b)* **`passation_classe_actif` — le plus fermé gagne, ET SEULEMENT D'UN
CÔTÉ** : l'élève exige les deux portes, le professeur une seule *(`acces.ts:57` vs `:70`)* ;
*(c)* ⚠️ **`routeur_actif` à ON N'ALLUME RIEN** — `filtreR0` exige `evaluee` **et** une lettre, et
`competences_niveaux.lettre` n'a aucun écrivain avant `C4-L12`. *C'est le constat de `C4L7-2`,
désormais dit à l'écran plutôt que découvert par un professeur qui conclurait à une panne.*

**Trois défauts trouvés par la revue et corrigés avant la fin :** *(1)*
`components/pilotage/Interrupteur.tsx` **existait déjà**, jetonné, `role="switch"`, commenté
« réutilisable (accès modules, futurs réglages) », et **sans aucun importeur** — l'écran l'emploie
au lieu de redessiner un toggle ; *(2)* ⛔ **un `update` qui ne trouve pas sa ligne rend
`error: null` et zéro ligne touchée** : *refermer* un interrupteur aurait « réussi » sans rien
écrire, la relecture rendant `false` — justement la valeur voulue. **La relecture seule ne voit que
la moitié du cas** ; `.select('id')` + test de longueur ferme le trou ; *(3)* la revalidation ne
portait que sur `/prof` alors que **ces six booléens commandent d'abord des écrans ÉLÈVE**.

**Éprouvé de bout en bout, pas seulement affiché** : clic → écriture constatée **en base par
requête** *(un seul interrupteur touché, les cinq autres intacts)* → écran à jour → **et effet réel
sur un autre écran** *(la fabrique s'ouvre ; et `competences_affichage_actif` fait passer le profil
de classe de « l'affichage est fermé » à « aucune lettre n'est encore posée » — **le vide expliqué
dans ses DEUX régimes**)*. `npm test` **1 260/1 260** · `tsc` rien · `eslint` rien.

### ⭐ LES SMOKES DU 24/08 — joués en session Code, dans le navigateur embarqué

_⚠️ **Deux limites, dites d'emblée** : le navigateur embarqué rend les `confirm()` natifs **muets**
*(règle de terrain de `C4L7-11`)*, et une session Code **ne peut pas passer en session élève**.
Tout ce qui suit est donc la face **professeur**, et **les smokes élève restent entiers**._

- [x] **C4L4-4 · ⭐⭐ LE RETOUR AFFICHÉ, SUR UN VRAI RETOUR ENGENDRÉ — VU, ET SEGMENTÉ.** Écran de
  correction de la passation, sur le décor laissé par ce lot *(instance `0f6c3fb4`)*. Le dépôt de
  Sacha porte **RETOUR PUBLIÉ**, « publié le 24/08 07 h 39 · **lu par l'élève** le 24/08 07 h 39 ».
  ⭐ **Le retour est SERVI SEGMENTÉ**, comme le piège 20 l'exige — **5 points**, chacun avec sa
  compétence et sa nature *(`EXPRESSION · RÉUSSITE`, `STRUCTURE · RÉUSSITE`, `ARGUMENTATION · À
  TRAVAILLER` ×2, `STRUCTURE · À TRAVAILLER`)*, **chacun citant la copie** — et **jamais un bloc que
  l'écran découperait** : confronté à la base, chaque point porte son **identifiant stable**,
  `{depot}:v1:01` … `:05`, doublé par la colonne `points_ids`, plus sa `competence`, sa `nature`
  (`reussite` / `point_de_travail`) et son `ancrage`. ⭐ **Le retour s'ouvre sur des réussites
  CITÉES** — la règle 2 du gabarit, tenue. ⚠️ *Le retour est **masqué par défaut** derrière trois
  volets (« Le compte · Les points · Le détail ») : « jugez d'abord ; révélez ensuite ».*
- [x] **C4L14-14 · ⭐⭐ `pourquoi_juste` À L'ÉCRAN DE CONCEPTION — LES TROIS EXIGENCES TOMBENT, Y
  COMPRIS LA SURVIE À UNE CORRECTION.** *C'était le smoke le plus précieux de la liste : il traque
  une **perte silencieuse**, « qui ne se verrait qu'à l'écran de l'élève, des semaines plus tard ».*
  **(1) La saisie** : une instance neuve conçue au **cran 1** en paire *(argument × composer,
  consigne de banque `lien_explicite`)* — les deux `cas_<i>_pourquoi_juste` sont écrits en base.
  **(2) La relecture** : les deux se relisent à l'écran d'édition après enregistrement.
  **(3) ⭐ LA SURVIE** : une correction ne touchant **que la consigne** a été soumise — la consigne
  a bien changé en base, **et les deux `pourquoi_juste` sont INTACTS**. **Le troisième site
  d'écriture tient** *(`editerInstance`, `app/prof/conception/actions.ts:325`)*. **La perte
  silencieuse annoncée n'a pas lieu.**
  ⚠️ **ET UNE CONDITION QUE L'ENTRÉE NE DISAIT PAS** : le smoke **ne peut pas se jouer sur une
  instance `assigne`** — `editerInstance` refuse en tête, « Cette instance est déjà assignée :
  l'édition avant validation est passée », et le refus **s'affiche proprement**. Les trois instances
  de cran 1 en base étant toutes `assigne`, il **faut** en concevoir une. *Elle a été **retirée
  après le contrôle**, enfants d'abord — la leçon de `C4L7-13`.*
- [x] **C4L11-D · LES TROIS ÉCRANS TOUCHÉS — VUS, `fabrique_actif` ouvert puis REFERMÉ.**
  *(a)* **L'écran de conception sur un examen diagnostique** : l'en-tête dit bien
  **« L'examen diagnostique — l'essai · SANS CRAN »** *(là où les autres instances portent « cran 1 »,
  « cran 4 »…)*, et le bloc d'édition **accepte** la consigne — `textarea[name=consigne]` ni
  `disabled` ni `readOnly`, portant le texte réel, avec son explication : « Un examen diagnostique
  n'a pas de cran : il ne porte ni appui, ni défaut, ni distracteurs, ni réponse attendue. **Sa
  consigne est tout ce qui s'édite ici.** » ⭐ *La condition « la base n'en porte aucun : il faut en
  concevoir un » est **levée par le décor de ce lot**.*
  *(b)* **Le profil de classe, onglet Compétences** : l'opt-out est rendu en matrice sur **les six
  vraies compétences**, toutes `active`. ⭐ **La « zone en construction » aux cinq colonnes inventées
  — Analyser · Interpréter · Argumenter · Problématiser · Conceptualiser — A DISPARU.**
  ⭐ **Et le vide est EXPLIQUÉ** : « L'affichage des lettres est fermé (`competences_affichage_actif`).
  Cet onglet reste ouvert, et il est vide **pour cette raison-là — pas parce que la classe n'a rien
  fait**. » *Ouvert puis refermé, le message devient « Aucune lettre n'est encore posée » : les deux
  régimes du vide, et aucun des deux ne ment.*
  *(c)* **L'écran des compétences — le renvoi** : « il se pose au profil de la classe, onglet
  Compétences », avec **un lien par classe** vers `?vue=competences`. ✓
- [ ] **C4L10E-13 · C4L10A-13 · C4L10S-17 · C4L10C-22 — ⚠️ CE QU'ELLES DEMANDENT DE VOIR N'EXISTE
  À AUCUN ÉCRAN.** Les quatre veulent « **la tuile de la fabrique** qui dit N compétences
  **ouvertes** » *(une, deux, trois… six aujourd'hui)*. **Établi sur pièces :
  `competencesOuvertes()` *(`utils/chaine/instruments.ts:545`)* n'a QU'UN SEUL LECTEUR dans tout le
  dépôt — `utils/chaine/chaine.ts:141` — et AUCUN écran.** *Il existe bien un
  `competencesOuvertes` dans `app/prof/conception/nouvelle/Pipeline.tsx:161`, mais c'est un
  **homonyme local** : il calcule les modes admis par le `02-` §3, pas les compétences branchées à
  la chaîne. Les confondre ferait cocher ces quatre entrées à tort.*
  ⭐ **Ce que la fabrique montre, en revanche, est juste et a été vu** : les six fiches avec leur
  version et leur statut de source *(RELUE ET VALIDÉE)*, leur correspondance *(8 · 8 · 8 · 7 · 11 ·
  9 observables)*, **les six statuts de recette à `evaluee` posés le 23 août**, et le Monitoring à
  part en `mesuree_silencieusement` avec sa règle.
  **Condition de reprise : une décision — soit l'écran de la fabrique dit ce que la chaîne a
  ouvert, soit ces quatre entrées se requalifient sur ce qu'il montre déjà.** *Ce n'est pas un
  smoke qui manque, c'est un afficheur.*
- [ ] **C4L2-13 · LES QUATRE ÉCRANS DU PILOTAGE — VUS, MAIS LE PARCOURS D'ÉCRITURE NON JOUÉ.** Les
  trois vues rendent : **Budgets** *(avec le piège de la vacuité en tête, nommé — « 15 élèves ne
  reçoivent aucun exercice routé »)*, **Assignation** *(navigation par semaines, « cet écran montre,
  il ne demande pas »)*, **Assiduité**. ⭐ **Le gate se MONTRE sans fermer** : « Le routeur est
  éteint. `routeur_actif` est à OFF […] Ces écrans, eux, restent ouverts — ils préparent
  l'allumage. » ⛔ **Non coché** : l'entrée demande « régler un budget, noter un recueil, naviguer
  les semaines », **et ce sont des écritures sur des élèves réels** — une session Code ne les fait
  pas sans demande. **Condition de reprise : le parcours à la main.**
- [x] **C4L3-17 · ⭐ LE SMOKE ÉLÈVE — JOUÉ LE 24/08, Louis ayant ouvert une session élève dans le
  navigateur local et une session professeur dans son Chrome.** *(Les deux limites tombent : la
  session Code n'a saisi aucun identifiant, et les `confirm()` natifs sont accessibles côté prof.)*
  Sur un dépôt maison réel *(Elo, classe Test, `argument × composer × cran 2`)* :
  ⭐ **LES SIX TEMPS sont servis** — Préparer · Écrire · Se juger · Retour · Réviser · Retour final.
  ⭐ **LE COLLAGE EST REFUSÉ SUR SES TROIS VECTEURS**, et deux fois plutôt qu'une : par événements
  *(`paste`, `drop`, `contextmenu` — les trois rendent `defaultPrevented: true`, la valeur du champ
  ne bouge pas)* **et AU CLAVIER RÉEL** — le presse-papier système chargé par `pbcopy`, puis `Cmd+V`
  dans le champ : **le texte n'entre pas**, longueur inchangée.
  ⭐ **LE COMPTEUR DE PARAGRAPHES** compte juste : deux blocs séparés d'une ligne vide, tapés au
  clavier réel, rendent « 2 paragraphes ».
  ⭐ **LE GRAS EST RENDU** *(piège 36, « le gras est du SENS »)* : sur la consigne d'un cran à
  candidats, `<strong>` porte bien le segment balisé, et **zéro `**` n'est visible à l'écran**.
  ⭐ **AUCUN CRLF** dans la saisie React — le champ contrôlé rend des `\n` seuls. *Le piège CRLF de
  C4-L4 visait un formulaire HTML classique ; il ne mord pas ici.*
  ⛔ **Restent non joués** : la **micro-question de dépassement** *(il faut dépasser la durée
  indicative — l'éprouver demande de reculer `ouvert_at`, donc d'écrire sur un dépôt)* et la
  **crédence au doigt sur téléphone** *(un cran 2 n'a pas de crédence, et le tactile n'est pas
  éprouvable ici)*.
- [x] **C4L14-12 · ⛔⛔ INJOUABLE — ET LE SMOKE A TROUVÉ POURQUOI. LA CORRECTION À TROIS VOLETS NE
  PEUT PAS S'AFFICHER SUR UN CRAN À CANDIDATS EN PAIRE.** *Voir `C4L7-15`. L'entrée reste ouverte,
  et sa condition de reprise n'est plus « un smoke » mais **un correctif**.*

### ⛔⛔ CE QUE LE SMOKE ÉLÈVE DU 24/08 A TROUVÉ — trois défauts, dont un corrigé sur place

- [x] **C4L7-14 · ⛔⛔ TOUT LE DÉROULÉ ÉLÈVE ÉTAIT MORT — `ReferenceError: Competence is not
  defined`. CORRIGÉ EN SÉANCE, UNE LIGNE.** *Le défaut le plus grave de la journée, et **rien** ne
  pouvait le voir sans ouvrir l'écran.*
  **Le symptôme** : toute action de l'élève rendait « L'envoi n'a pas abouti. Réessaie dans un
  instant — rien n'est perdu. » — la crédence, la remise, la contestation, la validation de lecture.
  **La cause, sur pièces** : `app/deroule/actions.ts` porte `'use server'` et se terminait par
  **`export type { Competence }`**. Un module de server actions **ne peut exporter que des fonctions
  async** : `tsc` accepte le ré-export *(le type existe à la compilation)*, mais le compilateur le
  laisse devenir un export de VALEUR, et **le module entier meurt à son évaluation** — donc **toutes**
  les actions du fichier, pas une seule.
  ⚠️⚠️ **ET RIEN NE LE VOYAIT** : `npx tsc --noEmit` **passe**, `npm test` **1 260/1 260 passe**, la
  recette `deroule-c4l3.mjs` **passe** *(elle appelle les fonctions de `utils/`, jamais le module
  d'actions)*, et **la page se rend normalement** — seule une ACTION, à l'écran, échoue.
  ⭐ **Le ré-export n'avait AUCUN importeur** *(balayage de `app/` et `utils/`)* : il est né le 22/08
  avec C4-L3 *(`04604df`)* et n'a jamais servi. **Retiré, et la leçon écrite à sa place** ; la
  crédence s'enregistre depuis. *Le type se lit à sa source, `@/utils/deroule/types`.*
- [x] **C4L7-15 · ⛔⛔ SUR UN CRAN À CANDIDATS EN PAIRE, L'AUTOMATE NE DÉPASSE JAMAIS `cas_1` — LA
  CORRECTION N'EST DONC JAMAIS SERVIE.** *C'est ce qui rend `C4L14-12` injouable, et ce n'est pas un
  manque de décor : c'est le code.*
  **Sur pièces** : `utils/deroule/vue.ts:282` appelle
  `etapeDeLaPaire([depot.texte_v1, depot.texte_vf], [credence_1, credence_2])` — **les « réponses
  aux DEUX CAS de la paire » sont la v1 et la VERSION FINALE de la rédaction.** Or à un cran à
  candidats *(1 et 3)* **l'élève ne rédige pas** : sa réponse à chaque cas **EST sa crédence**.
  `texte_v1` reste donc `null`, `repondu(0)` reste faux, et `etapeDeLaPaire` s'arrête à sa toute
  première ligne — `if (!repondu(0)) return 'cas_1'` *(`utils/deroule/regime.ts:202`)* — **avant même
  de regarder la crédence**.
  ⭐ **MESURÉ EN VRAI, sur un dépôt réel** : crédence du cas 1 écrite en base
  *(`{cas:1, choix:0, jetons:[100,0,0,0], index_correct:1}`)*, et pourtant `repondu(0) = false`,
  `credencee(0) = true`, **`etapePaire = cas_1`**, et `correctionDue(1) = false`. **L'élève a chargé
  100 jetons sur un mauvais candidat et n'a rien reçu en retour.**
  ⚠️ **POURQUOI LES 20 TESTS DE `correction.test.ts` SONT VERTS** : ils éprouvent la fonction PURE,
  avec des réponses fabriquées. **Le défaut est dans l'APPEL, pas dans la fonction** — c'est
  exactement l'angle mort qu'un test unitaire ne couvre pas et qu'un smoke trouve.
  ✅✅ **TRANCHÉ ET CORRIGÉ LE 24/08.** Décision de Louis : *« la réponse c'est la crédence, il n'y a
  pas de retour IA, c'est juste de l'algo »*. `etapeDeLaPaire` reçoit un troisième argument,
  `laCredenceEstLaReponse`, que `vue.ts` lève sur les crans à candidats — et là, `repondu(i)`
  **est** `credencee(i)`. ⚠️ `credence_1` et `credence_2` deviennent alors inatteignables, et
  **c'est juste** : à ces crans il n'y a pas d'étape de réponse distincte de la crédence. *Vérifié
  avant de toucher : **aucun écran ne lit `etapePaire`** — il ne sert qu'à `correctionDue`.*
  ⭐⭐ **ÉPROUVÉ À L'ÉCRAN DE L'ÉLÈVE, SUR LES DEUX CAS** : crédence donnée → **la correction
  sort**. Cas 1 : « CE QU'IL FALLAIT VOIR » + « POURQUOI C'EST CELLE-LÀ ». Cas 2, avec des
  distracteurs au format de l'import : **LES TROIS VOLETS**, dont « CE QUE TU AVAIS RETENU — “Le
  plan est annoncé deux fois” » et sa réfutation. **`C4L14-12` est donc COCHÉ par la même
  épreuve**, et **le second cas reçoit bien sa correction** — la décision de Louis du 23/08, vue à
  l'œil pour la première fois.
  ⭐ **Six tests neufs le tiennent**, dont celui qui rejoue le bug : sans le drapeau, une crédence
  donnée laisse l'étape à `cas_1`. *Le drapeau est opt-in — les crans où l'élève rédige ne bougent
  pas.*
- [x] **C4L7-16 · ⚠️ LA CONSIGNE D'UNE PAIRE EST SERVIE À L'ÉLÈVE COMME DU JSON BRUT — ET À LA
  CHAÎNE AUSSI.** L'en-tête « LA CONSIGNE » de l'écran élève affiche, littéralement :
  `["« Parmi ces quatre, … »","« Parmi ces quatre, … »"]`.
  **La cause** : `enTexte()` *(`utils/chaine/contexte.ts:476`)* connaît **trois** formes — une
  chaîne, un objet `{texte}`, un objet `{cas:[…]}` — et se replie sur `JSON.stringify(v)` pour tout
  le reste. Or sur une paire, `consigne_instanciee` est **un TABLEAU NU**, `cas.map(x => x.consigne)`
  *(`app/prof/conception/actions.ts`)* : ce n'est aucune des trois, et le repli sort la bouillie.
  ⚠️⚠️ **CE N'EST PAS QU'UN DÉFAUT D'ÉCRAN** : `lireContexte` vit dans `utils/chaine/`, et
  `ctx.consigne` est ce que la chaîne sert au modèle qui écrit le retour. **Le modèle reçoit la même
  chose que l'élève.** ⭐ *Les consignes PAR CAS, elles, s'affichent correctement plus bas — c'est le
  bloc d'en-tête qui est fautif.* **Non corrigé** : la forme à servir *(la consigne du cas courant ?
  ✅✅ **CORRIGÉ LE 24/08, EN DEUX ENDROITS.** Louis : *« pour une paire il y a deux consignes, une
  pour chaque exercice — comme ils sont conçus en paires, ça ne devrait poser aucun problème »*.
  **La donnée était bonne ; c'étaient la lecture et l'affichage.**
  *(a)* **`enTexte` connaît désormais le TABLEAU NU** et rend les deux consignes **nommées** —
  « Cas 1 — … / Cas 2 — … », jamais collées à plat : *un modèle qui reçoit deux énoncés bout à bout
  ne sait plus lequel il juge*. ⭐ **Extrait dans un module PUR, `utils/chaine/consigne.ts`** —
  `contexte.ts` porte `import 'server-only'` et n'était donc pas testable *(patron du dépôt, cf.
  `utils/cout-usage.ts`)* : **six tests neufs**, dont la paire dégénérée à un seul cas, le tableau
  vide, et le repli qui ne sert plus qu'à ce qui n'est pas une consigne.
  *(b)* **L'écran ne répète plus les deux consignes en en-tête** : sur une paire il dit « Deux cas,
  l'un après l'autre — chacun porte sa propre consigne », et la durée reste, qui vaut pour la paire
  entière. ⭐ **Vérifié à l'écran : plus aucun `["` visible.**

- [ ] **C4L7-12 · RAPPELS — CE QUI EST DÛ ET QUI N'EST PAS DE CE LOT.**
  ⚠️ **Mesuré le 29/08, case par case** : sur les quatre rappels ci-dessous, **`C4L11-E` et
  `C4L14-16` sont déjà COCHÉES**, et `C4L11-C` comme `SEC-21` n'ont **pas d'entrée propre** dans ce
  fichier — la liste renvoie donc à des identifiants qu'on ne peut pas ouvrir. Seul `C4L14-13`
  reste une case ouverte, et **sa condition de blocage est tombée** *(les crans 1 et 3 abondent
  dans les deux bases depuis un import de banque)*. `C4L11-C` *(le cron vu
  tourner chez l'hébergeur — **condition : le premier déploiement**, pas moi ; C4-L7 a appelé la
  route **lui-même**, ce qui coche `C4L11-B` et non `C4L11-C`)* · `C4L11-E` et `SEC-21` *(le smoke
  « créer un élève depuis l'écran professeur », après le retrait de `handle_new_user()` le 21/08 —
  section SÉCURITÉ)* · `C4L14-13` *(le cran 3 n'a jamais servi de correction — **condition : le
  premier import de la banque 1.2**)* · `C4L14-16` *(la migration en prod — **condition : C11b**)*.
- [x] **C4L7-13 · ⚠️ CE QUE LA TRAVERSÉE A LAISSÉ EN BASE — ✅ RETIRÉ LE 24/08, SA RAISON D'ÊTRE
  ÉTANT REMPLIE.** Le décor n'était gardé que pour que Louis coche `C4L4-4` à l'œil : **c'est fait**
  *(le retour vu SEGMENTÉ, 5 points avec leurs identifiants stables)*. `traversee-c4l7.mjs --retire`
  rend **3 passés, 0 en échec** — instance `0f6c3fb4`, ligne de plan `4770f701`, et « AUCUNE trace
  de la traversée dans le plan ». ⭐ **Contrôlé après, table par table** : 0 dépôt du décor, **0
  mesure, 0 squelette, 0 retour, 0 job, 0 métacognition orphelins**, et les **six interrupteurs à
  OFF**. *Le texte d'origine, pour mémoire :*
  Outre le décor de smoke ci-dessus, **rien** : les décors maison, de reprise et de route ont été
  **retirés dans le run même**, et les six interrupteurs **re-constatés à OFF**.
  ⚠️⚠️ **UN DÉFAUT DE LA RECETTE ELLE-MÊME, TROUVÉ ET RÉPARÉ EN SÉANCE — et c'est le patron exact que
  ce lot traque ailleurs** : le premier nettoyage de `traversee-c4l7.mjs` supprimait les dépôts
  **sans supprimer leurs enfants d'abord**. Or `competences_mesures.depot_id` est en
  **`on delete set null`** : **trois mesures `sommatif` sont restées ORPHELINES**, sans dépôt,
  invisibles à tout contrôle qui compte par dépôt — et elles auraient pollué la fenêtre d'évidence du
  routeur. **Constatées par requête, supprimées, et les deux chemins de nettoyage du script
  corrigés** *(le run et `--retire`)*. **Vérifié après : 0 mesure orpheline, 0 squelette orphelin,
  0 retour orphelin, 0 job orphelin.** *« Un retour ignoré ment » — un `on delete set null` aussi.*

---

## C4 · L13 — Les compteurs d'assiduité (⚠️ **AUCUNE MIGRATION** — aucune n'était attendue, aucune n'a été nécessaire)

> **Le lot en une phrase** : `assiduite_hebdo` existait depuis C4-L1, les écrans depuis C4-L2, les
> règles depuis C4-L2 — et **rien ne l'écrivait**. Son seul écrivain du dépôt était un **décor de
> recette**. Elle a désormais un écrivain de production, `poserLaSemaineDAssiduite()`, et un
> déclencheur hebdomadaire unique, `/api/assiduite/hebdo`.
>
> ⚠️ **Échéance : LA RENTRÉE.** *« Une semaine non comptée ne se rattrape pas. »*
>
> **La recette est un script, et c'est délibéré** — à l'écran, un semis et une mesure sont
> **indiscernables** *(`assiduite_hebdo` n'a aucune colonne de provenance)* :
>
> ```
> node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
>      --import ./scripts/register-calibration-resolver.mjs \
>      scripts/recette/assiduite-c4l13.mjs
> ```
>
> **38 vérifications, 0 en échec** *(24/08, sandbox)*, base rendue à l'identique par requête
> — `assiduite_hebdo` = 0, `exercices_depots` = 46, six interrupteurs à OFF.

### Le « fait quand », clause par clause

- [x] **C4L13-1 · « Une semaine réelle laisse une ligne par élève en base. »**
  Semaine `2026-08-31` *(semaine pédagogique 1 du semestre non archivé, résolue à l'exécution —
  jamais une date en dur)* : **17 lignes posées pour 17 élèves attendus**, et **17 lignes relues
  PAR REQUÊTE**. ⭐ **Les 13 élèves sans aucun dépôt ont bien leur ligne, à zéro** — sans elles,
  « une semaine sans assignation disparaîtrait du dénominateur au lieu d'y entrer », et le
  pourcentage d'assiduité serait faux. ⚠️ **Et ces lignes à zéro se lisent « faite par
  construction »** *(la complétion rend `null`, « et ce n'est pas 0 »)* : c'est la règle, pas un
  défaut, mais la lecture est contre-intuitive. _(24/08.)_

- [x] **C4L13-2 · « Ses deux agrégats se calculent depuis des dépôts RÉELS. »**
  14 dépôts semés sur 4 instances *(la contrainte `uk_depots_eleve_exercice` impose une instance
  par dépôt)*, avec les statuts qui font les cas : **17/17 lignes concordent avec un recompte
  INDÉPENDANT des dépôts**, fait dans le script sans passer par le code éprouvé. Les quatre règles,
  vues séparément : `v1_remis`/`retour_publie`/`vf_remis`/`clos` comptent au numérateur *(4/4)* ·
  deux rendus sur quatre passent **sous** le seuil *(non faite)* · ⚠️ **`abandonne` RESTE au
  dénominateur** *(3/4, faite)* — « un non-geste de l'ÉLÈVE, et l'assiduité mesure l'élève » · ⛔
  **`retire` EN SORT** *(1/1)* — « une décision du professeur ». _(24/08.)_

- [x] **C4L13-3 · ⭐ LE DÉPÔT DU DIMANCHE SOIR TOMBE DANS LA SEMAINE QUI S'ACHÈVE.**
  Un dépôt à **2026-09-07T00:30:00Z**, c'est-à-dire **dimanche 20 h 30 à Toronto** : compté dans la
  semaine `2026-08-31`, **pas dans la suivante**. Lu en UTC il aurait ouvert la semaine d'après — « à
  l'heure exacte à laquelle les élèves déposent ». Le rattachement passe par `lundiDuCycle`, la
  fonction canonique, et **aucune quatrième fonction de calendrier n'a été écrite**. _(24/08.)_

- [x] **C4L13-4 · « Les écrans de C4-L2 cessent de lire un décor. »**
  Prouvé **par la chaîne complète**, pas à l'œil : dépôts réels → déclencheur → ligne → **la vue SQL
  `assiduite_hebdo_classe` relit ce que le cron a posé** *(3 classes, taux d'inactivité 0,1429 / 0 /
  0)*. ⛔ La vue n'a **pas** été touchée, et son rollback n'a **pas** été rejoué. _(24/08.)_

- [x] **C4L13-5 · ⛔⛔ LE DÉCOR DE C4-L2 NE PEUT PLUS ÊTRE PRIS POUR UNE MESURE — ses deux dents,
  fermées et ÉPROUVÉES SUR UNE VRAIE MESURE.**
  Épreuve : une mesure réelle posée là où le décor sème, **avec la signature exacte de l'ancien
  `--retire`** *(`minutes_assignees: 50`, budget `45-60` — le budget réel d'un élève de tronc
  commun)*.
  · **Dent 1** — `--retire` supprimait `.eq('minutes_assignees', 50).eq('minutes_budget_plancher',
  45)` : il **aurait effacé cette mesure**. Il consomme désormais un **registre des couples
  (élève × semaine) réellement semés** *(`.routeur-c4l2-decor-registre.json`, gitignoré)* : **5
  couples retirés nommément, la mesure INTACTE (6/7, minutes 50/45-60) après le retrait.**
  · **Dent 2** — son en-tête affirmait « il n'écrit que des lignes neuves » quand son écriture était
  un `upsert` : le semis lit d'abord et **n'insère que les couples absents**. Vérifié : *« 1 ligne
  d'assiduité EXISTE DÉJÀ sur ces semaines : elle est une MESURE, pas du décor. Elle n'est pas
  touchée. »*, et la mesure est **intacte après `--seme`**.
  · **Et son `0.75` en dur** — le seul défaut du chantier assiduité sur ce point — **lit désormais
  la configuration** *(« seuil lu : 0.75 »)*.
  · ⚠️ **Sa preuve de retour à l'état d'avant ne compte plus toute la table** : « 0 ligne en base »
  était un présupposé qui **cesse d'être vrai le jour de la rentrée**. Elle porte sur les couples
  semés. _(24/08.)_

### Ce qui est prouvé — pour ne pas le rejouer

- [x] **C4L13-6 · La garde du cron, éprouvée PAR L'ÉCHEC, quatre fois.**
  Sans `Bearer` → **401** · mauvais secret → **401** · en paramètre d'URL au lieu d'un en-tête →
  **401** · ⭐ **`CRON_SECRET` absente de l'environnement → 401 aussi** : *un déploiement sans la
  variable est FERMÉ, pas ouvert*. Puis **200** dès que le secret passe, le corps portant le bilan.
  _(24/08.)_

- [x] **C4L13-7 · ⭐⭐ LES MINUTES DE C4-L12 SURVIVENT AU CRON — les deux faits d'API, éprouvés en
  base AVANT d'écrire une ligne de l'écrivain.**
  *(1)* Une ligne dont les minutes sont remplies *(95 / 45-60, ce que `C4-L12` fera)*, puis le cron
  repasse : **les minutes sont intactes** — une clé qu'on n'envoie pas garde sa valeur. *(2)* ⛔ **Un
  `upsert` EN LOT unifie les colonnes de son tableau** : dans une épreuve dédiée, une ligne portant
  `minutes_assignees` dans le même envoi qu'une ligne sans a mis **la seconde à `NULL`**. D'où la
  garde `verifierLaCharge()`, qui **lève** si une clé de minutes entre dans la charge ou si les
  jeux de clés d'un envoi sont hétérogènes — et **aucune autre ligne n'a été contaminée** au run.
  _(24/08.)_

- [x] **C4L13-8 · ⛔ LE RETRAIT NE RÉTROAGIT PAS — « un chiffre déjà montré ne bouge plus ».**
  Élève à **2/4**, puis le professeur retire un exercice de cette semaine **après coup**, puis le
  cron rejoue avec un « aujourd'hui » de la semaine suivante : **0 ligne réécrite, 17 figées**, le
  bilan **dit pourquoi**, et **le chiffre est toujours 2/4**. ⭐ Et le pendant : une ligne
  **manquante** se rattrape *(1 posée, 16 figées)* — une semaine jamais comptée n'a jamais été
  montrée à personne. *La garde porte sur l'existence de la ligne, pas sur la date.* _(24/08.)_

- [x] **C4L13-9 · L'idempotence, et l'horodatage.**
  **Trois passages du déclencheur → toujours 17 lignes** *(`upsert` sur `(eleve_id, cycle_lundi)`)*.
  ⚠️ **`updated_at` est posé par la charge** : la colonne n'a **aucun trigger** et son `default` ne
  joue qu'à l'INSERT — sans cela on perdrait la seule trace qui dise que le cron est passé.
  _(24/08.)_

- [x] **C4L13-10 · ⛔⛔ DEUX ÉLÈVES SONT INSCRITS DANS DEUX CLASSES — constaté en base, et ce
  n'était pas théorique.** 19 inscriptions actives → **17 élèves**. La clé primaire est
  (élève × cycle), **pas** (élève × classe × cycle) : une population construite classe par classe
  aurait envoyé **deux fois la même clé**, et Postgres refuse **tout le lot** — `21000 : ON CONFLICT
  DO UPDATE command cannot affect row a second time` *(éprouvé)*. La population est dédoublonnée.
  _(24/08.)_

- [x] **C4L13-11 · La contrainte du lundi ISO refuse, et supabase-js NE LÈVE PAS.**
  Un `cycle_lundi` au mardi → **`23514`, `assiduite_lundi_chk`**, rendu en `{ error }` **sans
  exception**. C'est pourquoi le `{ error }` de l'écriture est lu et journalisé *(« COLLECTE
  PERDUE »)*, sur le patron de `utils/cout-api.ts` — et **pas** sur celui du cron voisin, qui
  ignore le sien. _(24/08.)_

- [x] **C4L13-12 · ⚠️ LE BILAN DISTINGUE « RIEN À COMPTER » DE « PAS PASSÉ » — et il l'a prouvé sur
  la base réelle, sans qu'on le provoque.** Appelée sur la vraie semaine écoulée *(`2026-08-17`)*,
  la route rend `semaineDeTravail: false`, son **motif nommé**, et ⭐ **`depotsOrphelins: 46`** — les
  46 dépôts réels de la sandbox ont tous été assignés **avant le début du semestre**, et **aucune
  ligne ne les comptera jamais**. *Sans ce compteur, le silence aurait été indiscernable d'une
  semaine légitimement vide* — et « une ligne absente se lit VERT à l'écran ». _(24/08.)_

### Ce qui reste à jouer en recette — chacun avec sa condition de reprise NOMMÉE

- [x] **C4L13-13 · LE DÉCLENCHEUR EST ARMÉ CHEZ L'HÉBERGEUR — vérifié le 24/08, aux journaux et
  aux réglages Vercel.** ⭐ **Les trois faits, constatés à l'écran** :
  *(1)* **`CRON_SECRET` EXISTE** — *Sensitive, Production and Preview, ajoutée le 23/07*. Elle n'a
  donc **jamais été à créer** : elle préexistait à ce lot. *(La valeur n'a pas été ouverte.)*
  *(2)* **ELLE EST VALIDE** — `/api/chaine` part à la minute et répond **200** sans un trou
  *(12:46:31 → 12:57:30)*. La route rendant **401** si l'en-tête ne vaut pas exactement
  `Bearer ${CRON_SECRET}`, **un 200 prouve le secret**. Et **0 Warning, 0 Error, 0 Fatal**.
  *(3)* **`/api/assiduite/hebdo` EST ENREGISTRÉ** — `30 9 * * 1`, *« At 09:30 AM, only on Monday »*,
  aux Cron Jobs du projet, la fonctionnalité étant **Enabled**. Le déploiement du push de 12h52 est
  passé.
  ⚠️ **Ce qui n'est PAS prouvé, et c'est `C4L13-14`** : que Vercel invoque **cette route-ci**. Le
  mécanisme est identique à celui de `/api/chaine`, qui tourne ; mais l'invocation propre à
  l'assiduité est **hebdomadaire**, et la première tombe le **lundi 2026-09-07 à 09:30 UTC**.
  *(Le bouton « Run » des réglages permettrait de la déclencher à la main : sur la semaine écoulée
  d'aujourd'hui elle **ne poserait aucune ligne** — semaine hors calendrier —, donc l'essai serait
  gratuit. Non joué : ce n'est pas à une session Code de presser un bouton de production.)*
  > *Texte d'origine, pour mémoire :* La route a été appelée **par la recette
  elle-même** — cela prouve la route, **pas que Vercel l'appelle**. ⚠️ **Deux conditions, pas une** :
  *(a)* **le déploiement** — fait, `main` poussé le 24/08 *(`6c143a6`)* —, et *(b)* **`CRON_SECRET`
  présente dans Vercel** : elle n'est **pas** dans `.env.example`, elle ne vit que là, et **sans elle
  la route rend 401 à tout le monde, cron compris**. *Même réserve que `C4L11-C`, dont c'est le
  jumeau.*
  > ⭐ **ELLE N'EST PAS À CRÉER — ELLE EST À VÉRIFIER, et un seul regard répond.** `CRON_SECRET`
  > **préexiste à ce lot** : `/api/scriptorium/synthese-hebdo` s'en sert **depuis le 21/07**
  > *(`63d2deb`)* et `/api/chaine` **depuis C4-L11** *(`fb3ee68`)*, **tous deux déployés avant le
  > push du 24/08**. Ce lot n'ajoute donc **aucune variable** : il se branche sur celle qui existe.
  > ⚠️ **Mais rien n'a jamais prouvé qu'elle soit posée** — c'est précisément ce que `C4L11-C` attend
  > depuis C4-L11, et **un 401 de cron ne réveille personne** : les deux crons voisins sont des
  > no-op quand leur porte est fermée, donc *« rien ne se passe »* et *« 401 »* sont
  > **indiscernables de l'extérieur**.
  > ⭐ **LE GESTE QUI TRANCHE, ET IL COCHE LES DEUX ENTRÉES** : aux journaux de l'hébergeur, filtrer
  > sur **`/api/chaine`** — il part **toutes les minutes**, donc la réponse est immédiate.
  > **200 `{"gate": …}`** → le secret est posé, **il n'y a rien à faire**, et la collecte
  > d'assiduité partira d'elle-même au premier lundi. **401** → le secret manque, et alors **les
  > deux crons voisins sont morts depuis des semaines**, ce qui est un constat bien plus large que
  > ce lot.

- [ ] **C4L13-14 · LE PREMIER LUNDI RÉEL DE LA RENTRÉE.** ⚠️ **C'est la seule vérification dont le
  coût soit irréversible.** **Condition de reprise : le lundi 2026-09-07 après 09:30 UTC** — le
  premier passage qui comptera une vraie semaine de travail *(`2026-08-31`, semaine pédagogique 1)*.
  **Ce qu'il faut regarder** : `select count(*), min(cycle_lundi) from assiduite_hebdo` doit rendre
  **une ligne par élève actif** sur `2026-08-31`. ⛔ **Le lundi 2026-08-31 lui-même ne posera RIEN**,
  et c'est correct : sa semaine écoulée *(`2026-08-24`)* est hors calendrier.

- [ ] **C4L13-15 · LE RETRAIT D'UN EXERCICE, JOUÉ À L'ÉCRAN.** La correction des deux lectures UTC
  *(geste séparé, commit `6168049`)* est éprouvée **en calcul**, et `tsc` + `npm test` passent — mais
  ⛔ **`app/prof/routeur/actions.ts` est un `'use server'`, et le résolveur de recette ne sait pas
  résoudre son import de `next/cache`** : **son chargement n'est pas prouvé**. *C'est exactement la
  classe de défaut d'`export type` dans un `'use server'`, que seule une action à l'écran révèle.*
  **Condition de reprise : le premier passage sur `/prof/routeur?vue=assignation` avec un dépôt à
  retirer.**

- [ ] **C4L13-16 · LA SEMAINE EN COURS N'EST JAMAIS EN BASE — et l'écran ne la montre PAS DU TOUT.**
  ⚠️ *Rectifié le 24/08, après vérification à l'exécution : une première rédaction disait « l'écran
  la montre VERTE ». **C'est faux, et la réalité est meilleure.*** `chargerAssiduite` construit ses
  semaines **À PARTIR DES LIGNES QUI EXISTENT** *(`lundis = [...new Set(siennes.map(l =>
  l.cycleLundi))]`)* : une semaine sans aucune ligne **n'entre jamais dans la frise**, et
  `semaineAffichee` retombe sur la dernière semaine comptée. **Éprouvé** — semaine `2026-08-31`
  peuplée, `2026-09-07` laissée vide : frise `["2026-08-31"]`, semaine affichée `2026-08-31`.
  Le déclencheur compte **la semaine écoulée** *(sans quoi il compterait une semaine vide chaque
  semaine)* : le professeur voit donc **la dernière semaine close, jamais celle en cours**. ⭐ **Le
  point d'entrée sait déjà poser une semaine nommée** *(`poserLaSemaineDAssiduite(admin, fuseau,
  aujourdHui, semaineLundi)`)* et recalcule sans réserve tant qu'elle est en cours. ⛔ **Mais ouvrir
  un second déclencheur est interdit** : « deux crons sur une même clé fabriquent deux lignes ».
  **Condition de reprise : une décision de Louis** — un bouton prof, ou rien.

- [x] **C4L13-19 · ⚠️ UN ÉLÈVE INSCRIT *APRÈS* LE COMPTAGE SE LIT VERT — ⭐ DÉFAUT CONNU ET ASSUMÉ.**
  *(Décision de Louis, 24/08 : « on assume le problème ». Coché parce qu'il n'y a plus rien à jouer
  ni à décider — **pas** parce que le défaut est corrigé. Il reste vrai, et il est décrit ci-dessous
  pour qu'on ne le rouvre pas comme un bug.)*
  C'est **le seul cas où « une ligne absente se lit VERT » subsiste**, et il est étroit : un élève
  déjà inscrit au moment du comptage a toujours sa ligne. La collecte pose une ligne pour
  **tous** les élèves actifs au moment où elle compte : à l'intérieur d'une semaine comptée, plus
  aucun trou. ⛔ **Mais `chargerAssiduite` liste les élèves de la classe AUJOURD'HUI** : un élève
  inscrit après coup apparaît au tableau d'une semaine antérieure **sans ligne**. **Éprouvé** — ligne
  retirée pour un élève d'une semaine peuplée : `{assignes: 0, termines: 0, completion: null, bande:
  "vert"}`, et **le taux d'inactivité de la classe le compte comme actif** *(0,1429 sur 7 élèves)*.
  ⚠️ **Ce n'est pas rattrapable par la collecte** — « une semaine dont le compte est arrêté ne se
  recalcule pas », et rétro-poser des lignes pour un nouvel inscrit **fabriquerait une assiduité
  qu'il n'a pas eue**. ⭐ **CE QUE ÇA COÛTE, ET POURQUOI C'EST ASSUMABLE** : l'élève neuf paraît
  assidu sur les semaines d'avant son arrivée, et il abaisse d'autant le taux d'inactivité de sa
  classe **sur ces semaines-là seulement**. Dès la première semaine comptée après son inscription,
  tout est juste. *Le cas se produit à chaque arrivée en cours d'année.*
  **Si on veut le fermer un jour**, deux voies, toutes deux côté ÉCRAN et non côté collecte : soit
  l'écran distingue « pas de ligne » de « ligne à zéro » *(la base le permet — l'absence est
  discernable)*, soit la frise borne son tableau aux élèves inscrits **à la date de la semaine**.

- [x] **C4L13-17 · LE BONUS DE VACANCES — ⭐ TRANCHÉ : IL EST FERMÉ.** *(Décision de Louis, 24/08,
  en clôture du lot. Il n'y a donc plus rien à jouer en recette.)* `06-` §5 accordait « au plus une
  semaine » au travail fait pendant les vacances ; **le bonus ne sera pas construit.** Le motif est
  chiffré : sans colonne `en_vacances` — et il n'y en a aucune —, poser les semaines de vacances les
  ferait **entrer au dénominateur**, ce qui rendrait le pourcentage faux pour **tout élève, chaque
  semaine**, quand le bonus ne vaut **au plus +1 semaine par semestre** et pour les seuls élèves qui
  travaillent pendant les vacances. ⭐ **Et il n'a jamais été vivant** : avant C4-L13, rien n'écrivait
  `assiduite_hebdo`. ✅ **Le code n'est pas supprimé** — `bonusVacances` et ses tests restent, dormants
  et non faux *(il rend `0` faute de semaine de vacances à lire)* : le retirer toucherait un fichier
  de C4-L2 sans mandat et rendrait une réouverture plus chère que la fermeture ne rapporte.
  `enVacances` reste **câblé à `false` aux quatre sites**. **Détail et raisons :
  `IDEES_post_rentree.md`.**
  > ⚠️ **UN RESTE, ET IL N'EST PAS DE CE FICHIER** : `06-Palimpseste.md` §5 **porte toujours la
  > règle**, et il est **VALIDÉ ET GELÉ** — sa modification demande l'accord explicite de Louis et
  > **remonte à `CONTEXTE.md`**. ⛔ Aucun `[faux]` n'a été posé : la règle n'est pas fausse, elle est
  > **retirée par décision**. **Dû : une passe de conception** qui l'en retire ou l'y marque
  > abandonnée. *(Le `07-` §1.5, OUVERT À L'IMPLÉMENTATION, porte déjà la fermeture — v2.46.)*

- [x] **C4L13-18 · LA MIGRATION EN PROD.** ⚠️ **Sans objet pour ce lot — il n'écrit AUCUN SQL.**
  Mais `c4_l1_schema.sql` *(la table, ses gardes, sa RLS, sa vue)* et `c4_l2_routeur.sql` *(les
  seuils)* sont **joués en bac à sable seulement**. ⛔ **La collecte ne peut pas démarrer en prod
  tant qu'ils n'y sont pas.** **Condition de reprise : C11b (RUNBOOK).**
  > ✅ **PASSE DE RÉCONCILIATION DU 28/08 — SANS OBJET, ET LA CONDITION EST TOMBÉE.**
  > La ligne ne visait aucun SQL de ce lot ; elle attendait que `c4_l1_schema.sql` et
  > `c4_l2_routeur.sql` soient en prod. **Ils y sont** — vérifié par requête, colonne par colonne,
  > en lecture seule : `assiduite_hebdo` répond **200** *(et ses trois colonnes de minutes —
  > `minutes_assignees`, `minutes_budget_plafond`, `minutes_budget_plancher`)*, et **la vue
  > `assiduite_hebdo_classe` aussi**. La table est à **0 ligne** : le premier comptage réel reste
  > `C4L13-14`, le lundi 2026-09-07. **La collecte PEUT démarrer en prod.**

---

## C4 · L12 — Ce qui écrit ce que le routeur décide (⚠️ **AUCUNE MIGRATION** — aucune n'était attendue, aucune n'a été nécessaire)

> **Séance du 24/08.** Le moteur de C4-L2 existait, éprouvé, et **rien ne le faisait tourner** :
> `poserLaSemaine` n'avait aucun appelant hors de ses tests, son `candidatsPour` aucun producteur,
> et il y avait **0 ligne de `routeur_decisions`**. Ce lot n'invente aucune règle : il écrit
> **l'orchestration et la persistance**. ⭐ **Il porte aussi le SECOND VERROU** — `filtreR0` exige
> `evaluee` **ET** `lettre !== null`, et `competences_niveaux.lettre` n'avait **aucun écrivain**.
>
> **Contrôles d'entrée** : `npm test` **1299 / 1299 / 0 fail** *(1401 après le lot — +102 tests
> purs)* · `derive-doctrine.py --verifie` **FIXTURE : IDENTIQUE** · **0** `routeur_decisions` ·
> **6** compétences `evaluee` · **0 lettre sur 102** lignes d'état · **0** dépôt portant
> `routeur_decision_id` · **les six interrupteurs à OFF, et ce lot n'en a basculé aucun.**
>
> **Recette** : `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import
> ./scripts/register-calibration-resolver.mjs scripts/recette/routeur-c4l12.mjs` — **64
> vérifications, 0 échec**, base rendue à son état d'entrée par requête *(46 dépôts, 15 instances,
> 3 mesures, 102 niveaux, 0 lettre, 0 décision, 0 ligne d'assiduité)*.

### Ce qui est PROUVÉ, et par quoi

- [x] **C4L12-1 · ⭐⭐ UNE SEMAINE RÉELLE SE POSE PAR ÉLÈVE, DANS SES BORNES.** Deux élèves d'un
  parcours réel *(classe `T5`, `type_pedagogique = tc`, budget 45-60 min)*, cycle `2026-09-07`
  **au segment 2** — celui de l'échéance du lot. **6 exercices posés, 6 décisions écrites, 6 dépôts**,
  **55 min assignées** sous un plafond de 60. ⭐ **Et le bilan se compare à lui-même** :
  `elevesAttendus = elevesServis + nonServis` *(2 = 2 + 0)*, `decisionsEcrites` annoncé **égal** au
  décompte en base — « le chiffre ne ment pas ».
- [x] **C4L12-2 · ⛔ LE SEGMENT 1 EST HORS ROUTAGE, ET LE BILAN LE DIT.** Appelé sur la semaine du
  segment 1, le point d'entrée pose **0** et rend le motif nommé : *« il sert les deux examens
  diagnostiques imposés en classe »*. Les cinq segments se dérivent du Calendrier réel
  *(C = 37, R = 33 → 1/3/11/11/11 semaines)*.
- [x] **C4L12-3 · ⛔ `routeur_actif` EST LU, JAMAIS OUVERT.** À OFF, le point d'entrée pose **0** et
  dit pourquoi. La recette passe par `forcerHorsAllumage: true`, **un drapeau réservé à la recette**,
  et le bilan porte `horsAllumage: true` : *« un lot lit LE SIEN, jamais celui d'un voisin »*.
- [x] **C4L12-4 · ⭐⭐ LE SECOND VERROU TOMBE — des lettres s'écrivent.** Le **cold start** pose
  **6 lettres** sur des mesures de diagnostic réelles. ⭐ **L'élève ABSENT reçoit la médiane de sa
  classe** *(3 lettres)*, et ⛔ **cette médiane n'entre JAMAIS dans `derniere_ancre`** — vérifié par
  requête, 0 ancre sur ses lignes. ⭐ **`lettre_initiale` est écrite DANS LE MÊME GESTE**, avec sa
  date — son unique lecteur est `plafondApplicable()`, *« sans qui une compétence sans ancre
  monterait sans borne »*.
- [x] **C4L12-5 · ⛔ NI LA CONNAISSANCE NI LE QUESTIONNEMENT NE SORTENT DE LA SEMAINE 1 AVEC UNE
  LETTRE.** Constaté sur ce que les passations mesurent RÉELLEMENT, jamais sur une liste recopiée du
  `01-` §10 — qui périmerait au premier plan d'évaluation changé.
- [x] **C4L12-6 · ⛔⛔ LA COLONNE PORTE LA VALEUR PLAFONNÉE, JAMAIS `verdict.lettre`.** Sous
  `profil_provisoire`, `verdict.lettre` vaut `null` — **et la colonne porte `C`**. ⭐ Un test pur
  *(`utils/moteur/etat.test.ts`)* joue les deux branches côte à côte : avec `verdict.lettre`, **R0
  rend une liste VIDE** ; avec la valeur plafonnée, **il laisse passer**. *C'est le piège qui aurait
  refermé le verrou au moment même de l'ouvrir, pendant tout le segment 2.*
- [x] **C4L12-7 · ⭐⭐ `exercices_depots.routeur_decision_id` EST ÉCRIT** — la colonne que **cinq
  modules** lisaient et que rien n'avait jamais remplie. **Un dépôt, une décision** : autant de
  décisions distinctes que de dépôts, vérifié. Les dépôts portent `origine = 'routeur'`, et
  `exercices.cible_primaire` **reste NULL** sur cette voie.
- [x] **C4L12-8 · ⭐⭐ LA CHAÎNE LIT LA CIBLE SANS TOMBER SUR LE REPLI ALPHABÉTIQUE.** Sur un dépôt
  routé réel, `lireContexte` rend la décision, `cibleDuRetour` rend **la cible de la décision**
  *(premier cran de l'ordre de lecture du `07-` §1.1)*, et **`cibleIndeterminee()` rend `false`** —
  la clause du « fait quand », **mesurée** et non déclarée. `alerteDeCoexistence()` reste `null`.
- [x] **C4L12-9 · ⭐⭐ `sondes_retenues` PORTE LE BOOLÉEN QUI ALLUME M-e.** Les sondes secondaires
  sont posées **la semaine entière en main** *(phase C)*, et une **sonde de montée** a été posée sur
  une case au-dessus de la bande. ⭐⭐ **ET LES DEUX SONDES NE SE CONFONDENT PAS** :
  `sondesDeLExercice()` écarte du retour la sonde **secondaire** — silencieuse par règle — et
  **PAS** la sonde de **montée**, qui est la cible même de l'exercice et reçoit un retour
  démonstratif *(§8.7)*. *Le partage a demandé un resserrement d'une ligne à `utils/chaine/
  contexte.ts` — voir le relevé §3.*
- [x] **C4L12-10 · ⭐⭐ LE PARTAGE DE LA LIGNE AVEC C4-L13 TIENT, DANS LES DEUX SENS.** *(Le seul
  point où ce lot pouvait casser un lot déjà en production.)* La collecte pose la ligne de `W1` et
  ses deux agrégats *(`0/3`)* ; le tour suivant, le routeur **remplit les minutes de `W1`** —
  `minutes_assignees = 55`, budget `45-60` — **et les deux agrégats n'ont pas bougé**. Puis la
  collecte repasse sur `W2` : **elle écrit toujours ses agrégats**. ⛔ **Et par l'échec** : sur un
  cycle sans ligne, `.update()` touche **0 ligne** et **n'en ouvre aucune**.
- [x] **C4L12-11 · ⭐⭐ `momentDeLaDemonstration` BASCULE de `avant` à `en_retour`** — un écran élève
  que personne n'avait demandé de toucher, et qui était **figé à « avant » pour tout le monde**
  faute d'historique des cibles. `compterLesCiblages()` rend désormais un nombre non nul.
- [x] **C4L12-12 · ⭐⭐ UNE LETTRE S'ÉCRIT DEPUIS UNE MESURE.** Une mesure posée sur un dépôt routé,
  puis `ecrireLEtatApresMesure()` : la ligne d'état est réécrite, `updated_at` bouge, la lettre reste
  non nulle. Le bilan compare `reclamees` à `traitees + ecartees` — *« jamais un silence »*.
- [x] **C4L12-13 · ⭐ LA CLÔTURE DE LA CALIBRATION EST UN ÉVÉNEMENT DE BORNE DE SEGMENT.**
  `cloturerLaCalibrationDesEleves()` juge **chaque lettre une fois** *(6 jugées, 6 restées)* et fait
  **basculer `profil_provisoire` à `false`**. ⛔ Elle **ne peut pas vivre dans la chaîne** : elle
  appartient au passage hebdomadaire, au dernier lundi du segment 2.
- [x] **C4L12-14 · ⭐⭐ LE VIVIER, ET SON VIDE EXPLIQUÉ.** Sur des données réelles, le vivier retient
  ce qui est servable et **nomme chaque écart** : `lieu_classe` *(hors routage)*, `statut`,
  `deja_deposee`, `aucun_materiau`. ⭐ **Chaque instance retenue porte SA BORNE AMONT**, écrite à la
  décision. Les trois filtres sont éprouvés **cas par cas** sous `npm test` *(35 tests)*, y compris
  ceux qu'aucune donnée réelle ne déclenche aujourd'hui.
- [x] **C4L12-15 · ⭐⭐ `assigne_at` S'ANCRE DANS LE CYCLE POSÉ — DÉFAUT TROUVÉ PAR CETTE RECETTE.**
  Laissé au `default now()`, un dépôt posé pour le cycle `W` mais écrit un autre jour tombait dans la
  semaine d'assiduité **du jour d'écriture** — `exercices_assignes` restait à **0**, `completion()`
  rendait `null` et la semaine se lisait **« faite par construction »**. *C'est exactement le mode de
  panne que C4-L13 a passé son lot à fermer.* Le routeur pose désormais
  `assigne_at = <lundi du cycle>T12:00:00Z` — **midi UTC, pas minuit** : à minuit UTC un lundi est
  encore le **dimanche** à Toronto, et le dépôt ouvrirait la semaine précédente.

### Ce qui RESTE À JOUER, avec sa condition de reprise NOMMÉE

- [ ] **C4L12-16 · L'ESCALADE ET LA MONTÉE, SUR DONNÉES RÉELLES.** Le code est écrit et branché
  *(`ecrireLEtatApresMesure` appelle `degreAppele`, `desescalade`, `compteurN1N2`, `compteurN3`,
  `deplacementsDeMasse` et `reporterAuGrainSuperieur`)*, mais **0 ligne de `competences_escalade` et
  0 de `competences_montee`** ont été écrites en recette : `degreAppele` refuse **avant le segment 3**
  et sous `profil_provisoire`, et M-d demande **deux sondes de montée réussies à la même case**.
  ⛔ **Condition de reprise NOMMÉE : une fenêtre d'évidence remplie — quatre mesures d'une même
  compétence chez un même élève, au segment 3, hors `profil_provisoire`.** *(= la condition de
  `C4L2-11`.)*
- [ ] **C4L12-17 · LE NON-SPOILER, SUR UNE INSTANCE RÉELLEMENT BORNÉE.** Le filtre est éprouvé
  **cas par cas** sous `npm test` — position inconnue, position sous la borne, position atteinte —,
  mais aucun écart `non_spoiler` n'est tombé en base : **une seule instance porte un plan de lecture**
  *(`exercices_textes.plan_semaine = 3`)*, et aucune n'était servable par ailleurs.
  ⛔ **Condition de reprise : une instance dont le matériau porte un `plan_livre_id` ET dont le cours
  rattaché a été vu**, chez un élève ayant terminé au moins une séance du livre.
- [ ] **C4L12-18 · LE COURS VU, SUR UN MATÉRIAU `liste`.** Éprouvé sous `npm test` ; en base, le seul
  matériau servable du décor est `generique`. ⛔ **Condition de reprise : un sujet ou un texte en
  `cours_etat = 'liste'`, apparié à un cours du Scriptorium que le parcours d'une classe a marqué vu.**
- [ ] **C4L12-19 · LE BUDGET QUE L'ÉCRAN ACCEPTE ET QUE LA BASE REFUSE.** `budgetDeLEleve` **avertit
  sans refuser** quand le professeur règle un plafond sous le plancher, et `assiduite_budget_ordre_chk`
  **refuse la ligne**. Le lot ne maquille rien : les deux colonnes de budget **ne partent pas**,
  `minutes_assignees` part quand même, et **le bilan nomme l'élève** *(`budgetsRefuses`)*. Éprouvé
  sous `npm test`, **jamais en base** — aucun élève n'a de budget inversé aujourd'hui.
  ⛔ **Condition de reprise : un budget réglé à l'écran avec plafond < plancher.**
- [x] **C4L12-20 · ⭐⭐ LE SMOKE PROF, JOUÉ — et il a trouvé un défaut d'affichage.** *(24/08, session
  prof connectée, décor monté par `--garde-le-decor`.)* **Ce qui a été vu, écran par écran :**
  · **`/prof/routeur?vue=assignation`** — les décisions s'affichent : *« Cible : expression ·
  CALIBRATION · assigné · origine routeur · échéance 2026-09-13 »*, six dépôts sur deux élèves.
  · **`/prof/routeur?vue=assiduite`** — la frise et le tableau lisent les agrégats de la collecte
  *(0/3 par élève, deux semaines)*, et **cessent de lire un décor**.
  · **`/prof/routeur?vue=budgets`** — *« 15 élèves ne reçoivent aucun exercice routé »* avec le motif
  du piège de la vacuité, et **2 élèves servis** au défaut TC 45-60.
  · **`/prof/allumage`** — l'avertissement réécrit de `routeur_actif` s'affiche, **les six sont
  FERMÉS**. · **0 erreur console, 0 erreur serveur.**
  ⛔⛔ **ET LE DÉFAUT QUE SEUL L'ÉCRAN POUVAIT MONTRER** : l'assignation affichait
  *« Cible : expression … **Sondes : expression (sonde_montee)** »* — les deux sondes dans une seule
  liste, sur la compétence qui est **la cible même**. Illisible, et c'est exactement la confusion que
  le `01-` §8.8 interdit. ⭐ **Corrigé dans le même geste** *(`VueAssignation.tsx`)* : la sonde
  **secondaire** se dit *« mesurée en silence, sans retour »*, la sonde de **montée** a sa propre
  ligne — *« la cible servie au-dessus de sa bande »* — avec l'explication de M-e en `title`.
  *C'est le troisième lecteur que ce lot rend juste, après `sondesDeLExercice()` et l'avertissement
  d'allumage : une colonne qui se remplit rend faux tout ce qui la lisait vide.*
- [x] **C4L12-24 · ⭐⭐ L'OVERRIDE SUR UN DÉPÔT ROUTÉ — une branche qui n'avait JAMAIS PU S'EXÉCUTER.**
  `retirerLExercice()` a deux branches *(`actions.ts`)* : si le dépôt porte une décision, l'override
  s'ajoute **à cette décision** ; sinon il **crée une ligne orpheline**. ⛔ **La première était
  inatteignable** — aucun dépôt ne portait de `routeur_decision_id`. **Retrait joué à l'écran, avec
  son motif**, et vérifié par requête : **1 décision porte l'override** *(`regle_declenchee =
  calibration`, `cible_retenue = expression` — donc la ligne du routeur, pas une orpheline)*, et
  **0 décision `override_prof` n'a été créée**. Le dépôt passe à `retire`, l'écran dit *« retiré par
  vous »* et *« semaine en cours : le retrait sort du dénominateur »*. *C'est le piège 21 refermé sur
  pièces : « la ligne qu'il crée naît orpheline ; la tienne doit pouvoir l'être » — la nôtre ne l'est
  pas, parce qu'elle a une décision où se poser.*
- [ ] **C4L12-21 · ⚠️ `chargerAssignation()` NE PAGINE PAS, et il lit désormais des lignes réelles.**
  `app/prof/routeur/serveur.ts` borne `exercices_depots` à une semaine **sans `.range()` ni
  décompte** — le contre-exemple que `donnees.ts` nomme déjà. Le risque était nul tant que rien
  n'écrivait ; il devient réel le jour où le routeur pose. ⛔ **Il reste sous le seuil de 1000 pour un
  effectif de professeur** *(25 élèves × ~4 exercices = ~100 lignes)*, et **aucun écran n'est de ce
  lot**. **Condition de reprise : un lot qui touche l'écran d'assignation, ou un effectif qui approche
  200 élèves.**
- [ ] **C4L12-23 · ⚠️ DEUX ENTRÉES DE LA LISTE DE PRIORITÉ SONT PASSÉES À LEUR VALEUR NEUTRE, ET
  JE LE DIS PLUTÔT QUE DE LES LAISSER PASSER.** L'orchestrateur passe `aProgresse: false` *(PA3 —
  « une compétence EN PROGRESSION est inscrite une seconde fois, en fin de liste »)* et
  `cyclesSansProgresExpression: 0` *(la borne d'`exception_expression`, `01-` §6)*. ⛔ **Les deux
  demandent la MÊME chose** : l'historique des STATUTS d'observables, c'est-à-dire une **fenêtre
  d'évidence** jouée d'un pas à l'autre *(`suiviDeLObservable`)*. ⭐ **Ce n'est pas un oubli, c'est
  un refus d'affirmer** : `aProgresse: true` sans instrument ferait poser un exercice de plus au
  nom d'un progrès que personne n'a mesuré, et un `cyclesSansProgres` inventé ferait tomber la part
  de l'Expression d'un sur deux à un sur trois **sur un élève qui progresse peut-être**. ⚠️ **Ce que
  la neutralité coûte, et c'est peu** : PA3 « ne joue que dans les cycles longs » — sa seconde
  inscription n'est atteinte que si le budget épuise la liste — et la borne d'Expression **ne joue
  qu'au palier D chez un élève marqué `exception_expression`, au-delà de six cycles**. ⛔ **Condition
  de reprise : la même que `C4L12-16`** — une fenêtre d'évidence remplie, au segment 3, hors
  `profil_provisoire`. *Le code qui les calcule existe déjà et est éprouvé
  (`ilYAProgression`, `compteurN1N2`) : il ne manque que des mesures.*
- [x] **C4L12-22 · LA MIGRATION EN PROD.** ⚠️ **Sans objet pour ce lot — il n'écrit AUCUN SQL, et
  aucune colonne ne manquait** *(vérifié colonne par colonne : `routeur_decisions.etat_escalade`,
  les trois minutes d'`assiduite_hebdo`, `competences_niveaux.lettre_initiale`,
  `exercices_depots.routeur_decision_id`)*. Mais `c4_l1_schema.sql` et `c4_l2_routeur.sql` sont joués
  **en bac à sable seulement**. ⛔ **Condition de reprise : C11b (RUNBOOK).**
  > ✅ **PASSE DE RÉCONCILIATION DU 28/08 — SANS OBJET, ET LA CONDITION EST TOMBÉE.**
  > Vérifié par requête, en lecture seule, sur les quatre objets que la ligne nomme :
  > `routeur_decisions.etat_escalade` **200** · les trois minutes d'`assiduite_hebdo` **200** ·
  > `competences_niveaux.lettre_initiale` **200** · `exercices_depots.routeur_decision_id` **200**.
  > ⭐ **Le schéma de C4-L1 et de C4-L2 a voyagé avec le dump `--schema-only` du 25/08**, et c'est
  > ce que la colonne « Prod » du `SUIVI_SQL.md` ne dit pas encore.

- [x] **C4L12-24 · ⛔⛔ `ecrireLEtatApresMesure` PERD TOUT UN LOT DE LETTRES, EN SILENCE — ET LE
  DÉFAUT EST EN PRODUCTION.** *Trouvé le 29/08 par la séance voisine, au peuplement du profil d'Élo ;
  **revérifié ici par requête, en lecture seule, avant d'être rangé**.*
  **Ce qui se passe** : `utils/moteur/etat-serveur.ts:313` envoie `lignesNiveau` en **UN SEUL
  `upsert`**, et les jeux de clés y sont **hétérogènes** dès qu'un même dépôt touche une compétence
  **déjà lettrée** et une compétence **neuve** — la ligne neuve porte `lettre_initiale` et
  `lettre_initiale_at`, l'autre non. La garde lève, **tout le lot est perdu**, et le compte de
  lettres écrites du bilan ne le dit pas.
  ⭐⭐ **LA PARADE EXISTE DÉJÀ DANS LE MÊME FICHIER, DEUX FOIS** : `poserLeColdStart` *(l. 458)* et
  `cloturerLaCalibrationDesEleves` *(l. 573)* groupent leurs lignes **`parForme`** — une clé par
  forme d'objet — avant d'écrire. **Celle-ci ne le fait pas**, et c'est le seul écart.
  ⭐ **LA PREUVE, EN PRODUCTION, MESURÉE LE 29/08** : sur 184 mesures, **13 de `synthese` et
  ZÉRO ligne de niveau `synthese`** ; les trois autres compétences ont leur ligne
  *(argumentation 53/52, expression 66/52, structure 52/51)*. **13 paires mesurées sans ligne de
  niveau, toutes en `synthese`** — c'est-à-dire exactement la compétence neuve du lot perdu.
  ⚠️⚠️ **ET ÇA TRAVERSE LA CLÔTURE QUE LE 28/08 VIENT DE POSER** *(`C6L2-25`)* : la clôture lit
  `lireLesNiveaux`, qui rend `lettre: null` pour une ligne absente → `mouvement: 'sans_lettre'` →
  **elle saute**. ⛔ **Les treize élèves n'auront donc jamais de lettre de Synthèse, et la bascule du
  2026-09-14 passera dessus sans un mot.** *La clôture, elle, n'est pas atteinte par le défaut : elle
  groupe.*
  ⛔ **Non corrigé ici** — la séance voisine l'a déposé plutôt que réparé, avec ses requêtes, à
  `IDEES_post_rentree.md`. **Condition de reprise : le correctif applicatif, qui est de grouper
  `parForme` comme les deux voisines.** ⚠️ *Le décor d'écran le contourne en écrivant
  `competences_niveaux` une compétence à la fois ; le défaut applicatif reste entier.*
  > ✅ **CORRIGÉ LE 29/08, HORS LOT.** ⭐ **Le geste n'est pas de recopier la parade une troisième
  > fois : c'est de lui donner UN DOMICILE.** `grouperParForme()` est désormais une **fonction pure**
  > d'`utils/moteur/etat.ts`, et **les TROIS écrivains de `competences_niveaux` l'appellent** —
  > `ecrireLEtatApresMesure`, `poserLeColdStart`, `cloturerLaCalibrationDesEleves`. *Deux la
  > portaient recopiée, le troisième l'avait oubliée : c'est le mode de panne d'une règle à trois
  > domiciles.*
  > ⭐ **Et le compte du bilan se défait LOT PAR LOT**, jamais en bloc : un lot perdu n'efface plus
  > les lettres qu'un autre a bien écrites — sans quoi le bilan mentirait dans l'autre sens. Le
  > `console.error` nomme désormais **les compétences du lot**, pas seulement leur nombre.
  > ⚠️⚠️ **LE RAYON EXACT, MESURÉ EN PRODUCTION LE 29/08 — 13 ÉLÈVES × 2 COMPÉTENCES = 26 ÉTATS
  > FAUX**, et c'est la signature du lot perdu : les **13 lignes `synthese` manquent**, et les **13
  > lignes `expression` des MÊMES élèves sont figées au 26/08 ~20h50** alors que leur dernière
  > mesure date du **27/08 ~21h30**. *Le dépôt du 27/08 touchait `expression` (déjà lettrée) et
  > `synthese` (neuve) : charge hétérogène, tout perdu, les deux à la fois.*
  > **Preuves** : `npm test` **1904 / 1904** *(+5 vecteurs purs, dont le CAS RÉEL — une compétence
  > déjà lettrée n'envoie pas `lettre_initiale`, une neuve l'envoie, et c'est là qu'est l'écart)* ·
  > `tsc` et `eslint` silencieux · **aucune migration**.
  > ⛔ **CE QUI RESTE, ET C'EST UNE DÉCISION DE LOUIS : LA RÉPARATION DE LA DONNÉE.** Le correctif
  > empêche la prochaine perte ; il ne refait pas les 26 états. **Les mesures, elles, sont toutes en
  > base** — l'état est donc recalculable sans rien inventer, en rejouant
  > `ecrireLEtatApresMesure(admin, eleve, ['expression','synthese'], fuseau)` sur les treize.
  > ⚠️ **C'est une écriture en production**, et elle n'a pas été faite. → **`C4L12-25`.**

- [x] **C4L12-25 · ✅ LA RÉPARATION DES 26 ÉTATS FAUX EN PRODUCTION — JOUÉE LE 29/08, SUR DÉCISION DE LOUIS.**
  Louis.** Le correctif de `C4L12-24` ferme la fuite ; **les 26 états écrits faux avant lui restent
  faux**. ⭐ **Rien n'est à inventer** : les 13 mesures de `synthese` et celles d'`expression` sont
  en base, et `ecrireLEtatApresMesure` — désormais corrigée — recalcule l'état depuis elles.
  ⚠️ **Ce que ça change pour l'élève** : sans réparation, ces treize n'auront **jamais** de lettre de
  Synthèse *(la clôture du 14/09 les sautera en `sans_lettre`)*, et leur lettre d'Expression restera
  celle d'avant leur dernière copie. **Condition de reprise : une décision de Louis, puis un
  passage sur les treize.**
  > ⭐ **LE SCRIPT EST PRÊT — `scripts/recette/reparation-etats-c4l12-24.mjs`, 29/08.** ⛔ **Ce n'est
  > pas une recette** : il ne sème rien, ne monte aucun décor, et n'a rien à retirer. Il **rejoue la
  > fonction de production** `ecrireLEtatApresMesure` sur des mesures déjà en base — *rien ne
  > s'invente*. ⛔ **Aucun `upsert` écrit à la main.**
  > **Les quatre gardes** : `--base=sandbox|prod` **obligatoire, sans défaut** · **constat par
  > défaut**, `--repare` pour écrire · écrire en prod exige **`--oui-la-prod` en plus** · et le
  > **registre horodaté de l'état AVANT** part sur le disque *(gitignoré : il porte des identifiants
  > d'élèves)* **avant** la moindre écriture.
  > ⭐⭐ **LA CIBLE SE DÉRIVE, ET ELLE A DÛ ÊTRE RESSERRÉE — le bac à sable l'a montré.** Le premier
  > prédicat *(« mesurée, et ligne absente OU périmée »)* rendait **6 paires chez un élève du bac à
  > sable** dont les lignes dataient de la pose des statuts du 23/08, pour des **mesures de décor**
  > des 26-28/08. ⛔ **Une mesure semée n'appelle jamais l'écrivain : son retard est légitime, et la
  > réparer fabriquerait une lettre depuis un décor.** ⭐ Le discriminant retenu est **la signature
  > du défaut** : une charge perdue emporte, pour un même élève, une compétence **neuve** *(ligne
  > absente)* **et** une **déjà lettrée** *(ligne périmée)*. On ne répare donc que les élèves portant
  > **au moins une ligne absente** ; les autres sont **écartés et NOMMÉS** à la sortie.
  > **Constats joués, en lecture seule, sur les deux bases (29/08)** : **bac à sable → 0 à réparer**
  > *(6 suspectes, toutes écartées, 1 élève de décor)* · **production → 26 à réparer sur 13 élèves,
  > 0 écartée**, et **chacun des treize porte exactement une `synthese` absente et une `expression`
  > périmée**. La signature est parfaite.
  > ⚠️ **CE QUI N'A PAS ÉTÉ EXERCÉ, ET IL FAUT LE DIRE** : le **chemin d'écriture du script**. Le bac
  > à sable ne porte aucun cas à la signature, donc `--repare` n'y a **rien** à faire — la sélection,
  > le registre, le constat et le contrôle final y tournent, la boucle d'appel non. *Ce qu'elle
  > appelle, en revanche, est la fonction de production, couverte par cinq vecteurs purs neufs et
  > par `routeur-c4l12.mjs` §M sur données réelles.*
  > ⛔ **Rien n'a été écrit nulle part.** **Condition de reprise : ta décision de le lancer.**
  > ⭐⭐ **LA BOUCLE D'ÉCRITURE EST ÉPROUVÉE — 29/08, EN BAC À SABLE, PAR L'ÉCHEC PUIS PAR LE
  > SUCCÈS.** Le décor est au dépôt : `scripts/recette/epreuve-reparation-c4l12-25.mjs`, `--seme` /
  > `--retire`, **bac à sable uniquement** *(aucun chemin vers la prod)*. Il pose la signature exacte
  > sur un élève choisi **inerte** *(0 mesure, 0 escalade, 0 montée — vérifié au semis, et le script
  > s'arrête si ce n'est plus vrai)*, et **jamais sur l'élève `89662514`, qui porte le décor d'une
  > autre séance**.
  > ⚠️ **Le décor FABRIQUE la compétence déjà lettrée, et il faut le dire** : hors du décor voisin,
  > le bac à sable ne porte **aucune** ligne avec `lettre_initiale`. Les deux mesures semées sont
  > `classe` + `sommatif` — **des ANCRES** —, comme les treize de la production *(vérifié : 13/13
  > `classe`/`sommatif`)*, sans quoi une compétence sans lettre n'en recevrait aucune et le décor
  > n'éprouverait rien.
  > **① PAR L'ÉCHEC** *(une ligne du correctif remise à son état d'avant)* : `traitées=2`,
  > **`lettres=0`**, les deux paires **toujours fausses**, et le motif nommé —
  > *« jeux de clés HÉTÉROGÈNES dans un même envoi »*, avec l'attendu et le reçu côte à côte, la
  > différence étant exactement `lettre_initiale` / `lettre_initiale_at`.
  > **② PAR LE SUCCÈS** *(correctif restauré)* : `traitées=2`, **`lettres=2`**, 0 erreur, niveaux
  > **101 → 102**, **ZÉRO paire restante**. La `synthese` naît avec `lettre='B'` **et
  > `lettre_initiale='B'`** ; l'`expression` garde sa `lettre_initiale='D'` et reçoit son ancre.
  > **③ IDEMPOTENCE** : un second passage rend *« aucune réparation à faire »* — et **écarte
  > toujours nommément les 6 paires de l'élève de décor voisin**, ce qui éprouve le tri dans le même
  > tour.
  > **④ LA BASE EST RENDUE** : 102 niveaux · 16 mesures · 0 escalade · 0 montée, **exactement l'état
  > d'entrée**, vérifié par requête après le `--retire`.
  > ⚠️⚠️ **ET L'ÉPREUVE A DÉMENTI UN DE MES COMMENTAIRES, corrigé dans la foulée** : **ce n'est pas
  > PostgREST qui refuse, c'est `verifierLesLignesDeNiveau`, la garde de ce dépôt**, et elle lève
  > **avant** que la base soit sollicitée. ⭐ **Elle a raison de lever** : un `upsert` en lot
  > **unifie les clés**, donc la `lettre_initiale` de la compétence déjà lettrée serait partie à
  > **NULL** — et son plafond avec elle. *Ce qu'elle empêche est pire que ce qu'elle coûte.*
  > ⭐⭐ **ET LE TROISIÈME VOLET — LE SILENCE — EST FERMÉ LE 29/08.** Le registre des ouverts
  > *(item 85)* nommait un défaut de plus que le mien : **rien ne DISAIT la perte**.
  > `bilanEtat.erreurs` entrait bien dans `alertes`, mais `resumeBilan` ne les retrouvait que par
  > `motifDuRetourManquant`, **qui ne s'exécute que si le retour MANQUE** — une perte survenue alors
  > qu'un retour avait été écrit restait invisible au `dernier_message` du job, **seul canal durable
  > qu'un écran lise**. *Le 27/08, le job a affiché « … retour écrit, 6 appel(s), 64 s » pendant que
  > treize élèves perdaient deux lettres chacun.*
  > ✅ **`motifDesEtatsPerdus()`** retrouve les alertes par leur préfixe et les dit **SANS
  > CONDITION** : le job porte désormais *« ⚠️ N ÉCRITURE(S) D'ÉTAT PERDUE(S) — »* avec **les
  > compétences nommées**. ⛔ Et il **ne dit que les pertes** : un écartement légitime porte
  > `état de X non réécrit` et relève de `motifDesEcartees` — le préfixe les sépare, et c'est pour
  > ça qu'il a **un domicile unique**, partagé par celui qui pousse l'alerte et celui qui la retrouve.
  > ⭐⭐ **La fonction vit dans un module PUR** — `utils/chaine/bilan-motifs.ts` — **et c'est le
  > point** : `chaine.ts` porte `import 'server-only'`, ce qui le rend **intestable sous `npm
  > test`**, et c'est la raison pour laquelle son voisin `motifDesEcartees` n'a jamais eu de vecteur.
  > **Cinq vecteurs neufs**, dont le cas réel du 27/08, la non-confusion avec un écartement, et
  > **le compte qui survit à la troncature** *(la leçon de `motifDesEcartees`, appliquée)*.
  > `npm test` **1914 / 1914** · `tsc` silencieux · `eslint` inchangé *(l'unique avertissement de
  > `chaine.ts` est préexistant — vérifié par `git stash`)*.
  > ─────────────────────────────────────────────────────────────────────────────
  > ✅ **JOUÉE EN PRODUCTION LE 29/08 — 13 ÉLÈVES, 26 LETTRES, 0 ERREUR.**
  > `--base=prod --repare --oui-la-prod`. **Treize appels, un par élève, chacun portant SES DEUX
  > compétences dans la même charge** — c'est-à-dire, treize fois, exactement la charge hétérogène
  > qui échouait. **`traitées=2 lettres=2` sur les treize**, `escalades=0 montées=0`, et
  > `competences_niveaux` **155 → 168**.
  > **Le contrôle, refait à part et par requête** *(jamais sur la foi du bilan)* : `synthese`
  > **13 mesures → 13 lignes** *(elle en avait ZÉRO)* · **0 paire mesurée sans ligne** · **0 paire
  > périmée** · les **184 mesures inchangées** — rien d'autre n'a été touché.
  > ⭐ **ET RIEN N'A ÉTÉ INVENTÉ, ÇA SE VÉRIFIE SUR LES LETTRES** : les 13 nouvelles lignes de
  > `synthese` portent **D×9, E×2, C×2** — exactement la distribution des `lettre_equivalente` de
  > leurs 13 mesures. Toutes ont leur `lettre_initiale` *(« sa première lettre vient de sa première
  > ancre »)* et restent en `profil_provisoire`.
  > ⚠️⚠️ **ET LE DÉFAUT COÛTAIT PLUS QUE TREIZE LIGNES MANQUANTES : QUATRE LETTRES D'EXPRESSION
  > ÉTAIENT FAUSSES, ET TROP HAUTES D'UN PALIER.** La réparation les a bougées — `5c8bdc20` C→D,
  > `bf47d5c8` C→D, `ae5b657a` C→D, `0d02c8b3` D→E. *Les neuf autres n'ont bougé que d'horodatage.*
  > ⛔ **Une charge perdue n'emportait donc pas seulement la compétence NEUVE : elle figeait aussi la
  > DÉJÀ LETTRÉE, à sa valeur d'avant la copie.**
  > ⭐ **Aucun élève n'a vu la fausse** : `profil_provisoire` est resté `true` partout, et « sous
  > `profil_provisoire`, aucune lettre ne s'affiche ». **Le défaut a été réparé avant d'être vu.**
  > ⭐ **IDEMPOTENCE VÉRIFIÉE EN PROD** : un second passage rend *« AUCUNE paire fausse — rien à
  > réparer »*.
  > ⛔ **Le registre de l'état AVANT est sur le disque**, horodaté et gitignoré —
  > `scripts/recette/.reparation-c4l12-25-prod-2026-08-29T04-38-06-731Z.json`. **Il porte des
  > identifiants d'élèves réels : il ne se commite pas, et il ne s'efface pas à la légère.**
  > ⭐ **Et la clôture du 2026-09-14 les prendra** : les treize `synthese` existent désormais, avec
  > leur lettre et leur `profil_provisoire` — elles ne seront plus sautées en `sans_lettre`.


---

## C4 · L15 — Ce que l'écran montre du matériau, et ce qu'il cesse de montrer deux fois (séance du 24/08)

**Le décor est EN PLACE en bac à sable** — `c4_l15_decor_recette.sql`, cinq instances `ex-c4l15-*` et
un matériau `mat-c4l15-substitution`, toutes en `lieu = 'maison'`, assignées à l'élève qui porte déjà
le décor de C4-L8 *(`108aaa3a-…`)*. **Retrait en un geste** : `c4_l15_decor_recette_rollback.sql`.

⚠️ **POURQUOI IL A FALLU EN SEMER, ET CE QUE ÇA APPREND.** La sandbox portait des instances aux crans
1, 2, 3, 4, 5 et 8 — **aucune au cran 6**, et les seules du cran 1 étaient en `lieu = 'classe'`, que
le déroulé maison ne charge pas. Et **ses trois matériaux portaient tous un défaut d'ABSENCE** : leur
`version_corrigee` AJOUTE une phrase, le diff y est donc vide, et le marquage des crans 3 et 5
n'était **pas éprouvable** en base. *Un décor n'est pas un confort : sans lui, trois des cinq clauses
du « fait quand » n'avaient aucun support.*

### Prouvé en séance, avec sa preuve

⭐ **La preuve est le CHEMIN SERVEUR RÉEL** : `chargerLeDeroule()` *(`utils/deroule/vue.ts`)* appelé
contre la sandbox, sur des dépôts réels — donc le `select` neuf, la doctrine lue en base, le
découpage et la charge utile, tels que l'écran les reçoit.

- [x] **C4L15-1 · Au cran 1, les QUATRE candidats servis sont en évidence, la bonne réponse comprise.**
  *`ex-c4l15-cran1`, dépôt `18eef5d2-…`, LES DEUX cas.* Cas 1 : marqués `["villes","interdit","donc","meilleure"]`
  pour des candidats servis `["meilleure","donc","interdit","villes"]` — **les mêmes quatre, la
  `reponse_attendue` `donc` comprise**, dans l'ordre DU TEXTE. Cas 2 : idem sur `mat-garant-a`.
- [x] **C4L15-2 · Aux crans 3 et 5, le passage fautif et lui seul.** *`ex-c4l15-cran5`, dépôt
  `a9d69b54-…`* : **un seul** segment marqué, `donc`, sur un matériau où la version corrigée le
  remplace par `or`. ⭐ **Et le cran 5 n'a AUCUN distracteur** (`candidats servis : []`) : la preuve
  que **le déclencheur est le CRAN**, jamais la présence d'un champ.
- [x] **C4L15-3 · Au cran 4, AUCUNE marque — sur le MÊME matériau.** *`ex-c4l15-cran4`, dépôt
  `fdca25c2-…`, les deux cas* : `0 marqué`, alors que le cran a une `reponse_attendue` et que le
  matériau porte de quoi marquer. *« L'y trouver EST le travail. »*
- [x] **C4L15-4 · Un cran 6 réel n'affiche plus le guide en bloc.** *`ex-c4l15-cran6`, dépôt
  `5fba9470-…`* : `guide servi : AUCUN`, la consigne portant déjà le guide.
- [x] **C4L15-5 · ⭐ ET LA GARDE MORD.** *`ex-c4l15-cran6-nu`, dépôt `b10f8be2-…`* — même cran 6, même
  champ `guide`, mais la consigne ne le porte pas : **le bloc RESTE servi**, et un avertissement
  serveur se lève *(« le replier retirerait l'étayage, et le cran 6 deviendrait un cran 8 en
  silence »)*. **C'est le vecteur qui prouve que la garde n'est pas décorative.**
- [x] **C4L15-6 · ⛔ `version_corrigee` n'entre JAMAIS dans la charge utile.** Vérifié sur les **six**
  dépôts smokés, en cherchant la chaîne entière que la base porte dans le `JSON.stringify` de la vue :
  **aucune occurrence**. *C'est LA RÉPONSE aux crans 3 et 5 — « la `reponse_attendue` est la version
  corrigée à la transformation ».*
- [x] **C4L15-7 · ⚠️ UN CRAN 3 RÉEL QUI NE MARQUE RIEN, ET C'EST JUSTE.** *Dépôt `dffe9ca9-…`,
  instance préexistante* : le défaut injecté est une **ABSENCE** — la version corrigée AJOUTE une
  phrase —, donc **rien dans le matériau n'est fautif**. L'avertissement serveur le dit, avec ses
  trois causes légitimes. *Marquer l'endroit du manque donnerait la réponse.*
- [x] **C4L15-8 · Le port de l'import rend le même verdict que le script sur la banque RÉELLE.**
  `python3 generateur/verifie-import.py --banque generateur/banque/banque.json` → **`IMPORTABLE — 0
  refus, 0 blocage, 0 signalement`** *(152 matériaux, 148 exercices)* ; le port TS, sur la même
  banque, **0 signalement de longueur**. ⭐ **Et le contrôle n'est pas muet par accident** : il a
  mesuré **100 cas réels** sur quatre crans, rapports **0,20 à 0,71** — tous sous le seuil de 0,90.

### Ce qui reste à jouer en recette, avec sa condition de reprise

- [x] **C4L15-R1 · ✅ LE RENDU, DANS UN NAVIGATEUR — JOUÉ LE 24/08, session élève réelle (`Elo`).**
  ⚠️ **L'interrupteur `scriptorium_params.exercices_actif` a dû être ouvert quelques minutes** *(accord
  de Louis, journalisé au `SUIVI_SQL.md`, valeur d'origine relevée puis restaurée et **vérifiée par
  requête**)* : sans lui l'écran rend « Les exercices ne sont pas encore ouverts ». **Les cinq
  dépôts, un par un, sur `localhost:3000` :**
  - **cran 1** *(`d94d273f-…`)* — **QUATRE `<strong>` par cas**, sur les deux cas de la paire :
    `villes · interdit · donc · meilleure`, puis `machines · remplacent · donc · travail`. **Les
    quatre candidats servis, la `reponse_attendue` (`donc`) comprise.** Le DOM porte
    `<span>Les </span><strong>villes</strong><span> du Nord ont </span>…` — **aucun HTML fabriqué**,
    et le texte se recompose à l'identique.
  - **cran 5** *(`819b7e30-…`)* — **UN SEUL gras, `donc`**, sur un matériau **sans aucun distracteur**.
  - **cran 4** *(`28db4e9e-…`)* — **ZÉRO gras**, sur exactement le même matériau, les deux cas.
  - **cran 6** *(`4877cd08-…`)* — **le bloc « De quoi t'aider » est ABSENT**, et la consigne porte le
    guide : la phrase n'est lue **qu'une fois**.
  - **cran 6 « nu »** *(`7e8ebc46-…`)* — **le bloc « ▸ DE QUOI T'AIDER » RESTE**, consigne sans guide.
    **La garde tient à l'écran.**
- [x] **C4L15-R1b · ✅ RÉPARÉ ET REVU À L'ÉCRAN LE 24/08 — le mot est ENTOURÉ, en plus d'être en gras.**
  **Décision de Louis** : *« on entoure le mot en plus que de le rendre en gras »*. ⚠️ **Le gras
  RESTE, et il le faut** — « les mots **en gras** dans le texte » (cran 1) et « le mot **en gras** »
  (cran 3) sont écrits dans des consignes SERVIES À L'ÉLÈVE : entourer *à la place* ferait mentir la
  consigne. **On entoure EN PLUS.** ⭐ Le cadre sépare deux marques contiguës parce que **l'espace
  qui les sépare est un `<span>` HORS des deux boîtes**. Revu à l'écran : « Les [villes] du Nord ont
  [interdit] les feux de bois. La qualite de l'air y est [donc] [meilleure]. » — **quatre cadres,
  quatre mots**, comme la consigne l'annonce. Style vérifié en `getComputedStyle` : `font-weight 600`
  *(le gras)*, `1px solid` *(le cadre)*, fond `rgb(220,230,223)` = le **pigment du module** — jamais
  un hex en dur. `box-decoration-clone` referme la boîte de chaque côté d'un retour à la ligne.
  ⭐ **Une seule classe, `MARQUE`, exportée et importée par les deux écrans** : deux listes qui
  divergeraient feraient mentir « l'aperçu rend ce que l'élève verra ».
- [x] **C4L15-R2 · ✅ L'APERÇU DU PROFESSEUR — JOUÉ LE 24/08, session prof réelle. QUATRE cas sur
  cinq exacts, et le cinquième a trouvé autre chose.**
  - **cran 5** — `donc`, un seul. ✅ · **cran 4** — zéro gras, les deux cas. ✅
  - **cran 6** — pas de bloc « AVANT D'ÉCRIRE ». ✅ · **cran 6 « nu »** — le bloc **reste**. ✅
    **La garde tient dans les DEUX voies.**
  - ⚠️⚠️ **cran 1 — l'aperçu ne marque QU'UN mot (`donc`) là où l'élève en voit QUATRE**, et
    **ce n'est pas le marquage qui est en cause** : voir C4L15-R2b, juste en dessous.
- [x] **C4L15-R2b · ✅ RÉPARÉ ET REVU À L'ÉCRAN LE 24/08 — l'aperçu lit les DEUX formes.**
  `page.tsx` passe désormais par **`lireLaBanque`** *(`utils/deroule/credence.ts`)*, le lecteur de
  l'écran ÉLÈVE, déjà éprouvé : **les deux voies lisent par la MÊME fonction**. ⛔ **Et on ne
  normalise toujours rien en base** — la forme stockée reste la question de `C4-L11`. Revu à l'écran,
  session prof : l'aperçu liste **quatre candidats réels** *(`interdit · meilleure · villes · donc`,
  fini les lignes blanches)* et **marque les quatre** dans le matériau, sur les deux cas — **identique
  à l'écran élève**. Un test le garde *(`apercu-marquage.test.ts` : « les DEUX formes de distracteur
  donnent le MÊME marquage »)*.
- [x] **C4L15-R2c · ⛔⛔ ET LE MÊME DÉFAUT SUR UN SECOND SITE, CELUI-LÀ COÛTAIT DE LA DONNÉE — réparé.**
  **Trouvé sur la capture d'écran de R2b**, au-dessus de l'aperçu : le **formulaire d'édition**
  affichait un textarea de distracteurs **VIDE** sur une instance importée. Or `lireCas`
  *(`app/prof/conception/actions.ts`)* écrit **`null` quand le textarea est vide** : **ouvrir
  l'instance et l'enregistrer DÉTRUISAIT les trois distracteurs**, sans un mot. Le champ passe
  désormais par `lireLaBanque` aussi — vérifié à l'écran : `interdit\nmeilleure\nvilles`.
- [ ] **C4L15-R2d · ⚠️ CE QUI RESTE DE CE DÉFAUT, ET QUI EST UNE DÉCISION, PAS UN BOGUE.**
  `lireCas` réécrit toujours des **CHAÎNES**. Enregistrer une instance importée garde donc les
  textes mais **perd les `pourquoi_faux`** — une perte bien moindre que la précédente, mais réelle.
  ⛔ **Non tranché ici, et délibérément** : choisir ce qu'on réécrit, **c'est trancher la FORME
  STOCKÉE**, c'est-à-dire la normalisation. ⭐ La pièce existe déjà — `pourquoiFauxDuCandidat`
  retrouve le motif **par le texte** — donc la réparation est courte une fois la forme choisie.
  **Condition de reprise : `C4-L11`.**
- [x] **C4L15-R3 · ✅ LA DÉFINITION EXISTAIT — trouvée le 24/08 sur remarque de Louis, et la source est amendée.**
  ⭐ **Elle vit à DEUX endroits, et je ne les avais pas cherchés.** *(1)* **`01-routeur.md` §11**, la
  définition canonique : *« `aide_consommee` : dépliages de la fiche et relectures (définition
  provisoire, révisable selon les types) »* — ⛔ **VALIDÉ ET GELÉ, non touché.** *(2)* **`07-` §1.1**,
  la lecture opérationnelle, **déjà amendée par C4-L3** : *« ce qu'elle compte à la maison : les
  dépliages des aides que **cet écran sert** — la démonstration du temps 1 et le guide de l'appui —
  plus les relectures du retour »*.
  ⭐⭐ **ET C'EST CE SECOND TEXTE QUI DEVAIT BOUGER, PAS LE CODE.** Il énumère le guide **sans
  condition** ; depuis C4-L15 il n'est plus servi au cran 6. **La DÉFINITION, elle, reste vraie** —
  elle dit « les aides que cet écran **SERT** », et au cran 6 l'écran ne le sert pas : **c'est
  l'ÉNUMÉRATION qui devait la nuance.** Le `07-` §1.1 étant **OUVERT À L'IMPLÉMENTATION**, l'amender
  **était mon travail, pas une dette** — et je l'avais manqué. **Fait : `07-` v2.50 → v2.51**, avec
  la conséquence de lecture écrite noir sur blanc — ⛔ **`aide_consommee` n'est PAS comparable d'un
  cran à l'autre**, et la colonne étant un `integer` unique, **l'écart ne se rattrape pas après
  coup**.
- [ ] **C4L15-R3b · ⚠️ ET LA VRAIE QUESTION, QUI N'EST PAS D'UN LOT CODE : cette grandeur mesure-t-elle
  encore quelque chose de comparable ?** ⭐ **C'est la SECONDE fois qu'elle perd un morceau de sa
  définition.** La première : le `CONTEXTE.md` du **17/08** note que la SPEC C3 §478 faisait compter
  à `aide_consommee` *« les dépliages de la fiche stratégique »* — et **la fiche du type a été
  supprimée ce jour-là**, si bien que *« ce compteur perd la moitié de sa définition »*. La seconde
  est C4-L15. ⚠️ Le `01-` §11 la déclare lui-même *« provisoire, révisable selon les types »*.
  **Condition de reprise : le propriétaire du `01-` §11**, à qui appartient de dire si le compteur
  se redéfinit, se stratifie par cran, ou se met à journaliser QUELLE aide.
- [x] **C4L15-R4 · LA MIGRATION EN PROD — ⛔ SANS CIBLE, et ⚠️ C11b N'EST DANS AUCUN PLAN.**
  **La base de production n'existe pas.** Le `SUIVI_SQL.md` le pose en tête : *« elle naîtra au
  chantier C11b d'un dump du schéma de la sandbox »* — **il n'y a qu'UNE base en usage**, et c'est
  celle-ci. Ce n'est donc pas une tâche différée : c'est **une tâche sans cible**.
  ⭐ **CE QU'EST C11b, puisque le nom ne dit rien tout seul** *(vérifié le 24/08, sur question de
  Louis)* : c'est **le montage de la prod propre**, et son mode d'emploi est écrit —
  **`RUNBOOK_prod_propre.md`** *(à la racine du dépôt, 30/06, « Chemin A »)*, dix étapes : créer une
  **seconde base Supabase** *(la prod)*, y **cloner le SCHÉMA seul**, y recopier une **liste blanche**
  de tables de config, recréer les **buckets Storage et leurs policies**, **séparer les variables
  d'env Vercel** Production/Preview, puis compte prof, smoke test, et la discipline continue.
  *« Les élèves, livres et classes ne vivent pas dans une branche git : ils vivent dans une base. »*
  ⚠️⚠️ **ET C'EST LÀ LE CONSTAT QUI COMPTE : `C11b` N'EXISTE DANS AUCUN PLAN.**
  `PLAN_DE_CHANTIER.md` ne connaît que **C3, C4, C5 et C6** — `grep -E "C1[0-9]"` y rend **zéro**,
  et son §7 *(« ce qui ne relève d'aucun chantier »)* ne parle que de la lettre de la loi 25. Le nom
  `C11b` ne vit que dans le **`SUIVI_SQL.md`** *(6 mentions)* et dans les **relevés** de C4-L12, L13,
  L14 et L15. **Il vient d'une numérotation antérieure au plan de la rentrée, et rien ne le
  planifie.** ⛔ **Conséquence : TOUTE la colonne « Prod » du `SUIVI_SQL.md` attend un chantier que
  rien ne porte**, et la date que la note lui donne — *« ~mar-mer 18-19/08 »* — **est passée.**
  ⭐ **Ce que C4-L15 doit à ce chantier, et qui est le vrai contenu de cette ligne** : le RUNBOOK
  monte la prod en **`--schema-only`** puis recopie une liste blanche **où aucune table de C4 ne
  figure** *(le RUNBOOK date du 30/06, avant que C4 existe)*. La prod naîtra donc **avec les deux
  colonnes `marquage`/`longueur` et SANS leur contenu** — et **le marquage y sera muet, en
  silence**, exactement comme le cas VIDE que le code sait tenir. ⛔ **Il faudra y rejouer
  `derive-doctrine.py --sql`.**
  **Condition de reprise : C11b — dès que quelqu'un le met à un plan.**
  > ✅ **PASSE DE RÉCONCILIATION DU 28/08 — C11b A EU LIEU, ET LE CONTENU DÉRIVÉ AUSSI.**
  > ⭐ **C'est celle des quatre où la réserve comptait le plus** — le relevé prévenait que « la prod
  > naîtrait avec les deux colonnes et SANS leur contenu, et le marquage y serait muet, en
  > silence ». **Vérifié par requête, en lecture seule** : `exercices_crans.marquage` et
  > `.longueur` répondent **200**, la table porte ses **9 lignes**, et **6 d'entre elles portent un
  > `marquage` non nul**. Le `--sql` que la ligne réclamait a été joué en prod le 28/08
  > *(`7869afd`, treize verdicts IDENTIQUE)*. **Le marquage n'est pas muet en production.**
- [x] **C4L15-R5 · ✅ LE DÉCOR EST RETIRÉ — 24/08, la recette close.** Répétition à blanc d'abord
  *(le CORPS seul, règle 6 : 5 instances → 0, 1 matériau → 0, puis `rollback`, et **le décor est
  revenu, vérifié par requête**)*, puis le retrait réel. ⛔ **Ce qui ne devait pas partir est intact,
  vérifié nommément** : `mat-garant-a`, `mat-garant-b`, `mat-lien-codex-0001` — le décor de C4-L8 —
  sont toujours là, et `exercices_depots` porte encore 46 lignes. **Elo ne voit plus les cinq
  exercices de recette.** ⚠️ **Le fichier reste au dépôt** : il est idempotent et rejouable, et la
  prochaine séance qui veut ces cinq crans le rejoue en un geste.


---

## C4 · L16 — Le cours déclare ce qu'il traite, et les sujets s'y rattachent seuls (séance du 24/08)

**Migration jouée en bac à sable** — `c4_l16_notions.sql` *(deux `CHECK` élargis à quatre valeurs,
`exercices_textes.notions` et `scriptorium_contenus.notions` posées)*. Rollback écrit :
`c4_l16_notions_rollback.sql` ⛔ **il rétrécit deux `CHECK` et droppe deux colonnes — lire son
en-tête.** Les **six interrupteurs restent à OFF**, vérifié à l'exécution.

⭐ **LE SMOKE PROF A ÉTÉ JOUÉ EN SÉANCE**, dans le navigateur embarqué, sur un compte prof ouvert par
Louis à ma demande. **Trois des cinq clauses du « fait quand » s'y sont prouvées à l'écran**, et
elles seraient parties décochées sans lui. *Le décor semé pour l'occasion a été retiré le soir même
— ligne au `SUIVI_SQL.md`.*

### Prouvé en séance, avec sa preuve

- ☑ **Un cours déclare ses notions à l'écran, EN LES CHOISISSANT dans celles que la banque connaît.**
  `/prof/scriptorium?vue=cours` → *Modifier* : le formulaire propose en cases à cocher les notions
  que la banque déclare *(« la connaissance », « la vérité », lues sur `exercices_sujets.notions` et
  `exercices_textes.notions`)*. Coché « la vérité », enregistré → **`scriptorium_contenus.notions =
  {"la vérité"}` en base**, et la ligne affiche la puce. ⭐ **Les deux écrivains sont éprouvés** :
  l'édition en ligne *(ci-dessus)* **et la création** — un cours neuf créé par le formulaire, avec
  notions choisies.
- ☑ **Le dédoublonnage se fait sur la CLÉ, pas sur la chaîne.** À la création : case « la vérité »
  cochée **et** « La Vérité » tapée dans la zone libre, plus « le temps ». Résultat en base :
  **`{"la vérité","le temps"}`** — la majuscule a été reconnue comme la même notion. *C'est la
  clause « la Vérité » / « la vérité » prouvée par le geste réel, pas seulement par un test.*
- ☑ **Un sujet dont aucune notion n'est réclamée est compté à part, et sa notion nommée.**
  `/prof/corpus?onglet=rattachement` : bannière **« 1 entrée(s) attendent une notion qu'aucun cours
  ne déclare : `la vérité`, `la connaissance`. Elles paraissent rattachées et sont pourtant aussi
  muettes qu'une entrée sans rattachement. »** ⭐ Et **elle disparaît dès qu'un cours déclare l'une
  d'elles** — vérifié en déclarant « la vérité » sur un cours : le compte tombe à zéro et la notion
  passe au vert, seule « la connaissance » restant marquée *orpheline*.
- ☑ **Le quatrième état est saisissable, et l'action l'accepte.** Le `<select>` porte sa quatrième
  option — *« notions — servable dès qu'un cours déclare l'une d'elles »* —, les `<select>`
  d'appariement **disparaissent** en `notions` *(il n'y a aucun cours à apparier, et les montrer
  ferait croire à un geste qui reste à faire)*, et « Rattacher » rend le message neuf : *« Servable
  dès qu'un cours VU déclare l'une de ses notions — le rattachement se déclare désormais SUR LE
  COURS (Scriptorium → Cours), pas sur cette entrée. »*
- ☑ **L'écran vivant n'a pas été cassé** *(la garde du piège 14)*. `/prof/scriptorium` n'est derrière
  **aucun** drapeau : création et modification d'un cours **marchent encore**, éprouvées l'une et
  l'autre. Rien n'a été réordonné ni renommé.
- ☑ **La chaîne, sur des lignes RÉELLES de la sandbox** *(sonde serveur)* : un sujet en
  `cours_etat = 'notions'` déclarant `{la vérité, la connaissance}`, trois cours en base — l'un
  déclarant `{La Vérité, le langage}`, deux n'en déclarant aucune. `notionsPartagees()` rend **un
  cours, et un seul, le bon** ; `notionsOrphelines()` rend **`[la connaissance]`**.
- ☑ **Le port rend le même verdict que le script sur la banque réelle** — `0 refus · 0 blocage ·
  0 signalement` des deux côtés, sur `generateur/banque/banque.json` *(15 sujets, tous en
  `"cours": "notions"`)*. ⭐⭐ **Et c'était FAUX avant ce lot** : le port de la plateforme rendait
  **15 refus, code 1**, quand le script disait `IMPORTABLE`. *Mesuré des deux côtés, avant et après.*

### Ce qui reste à jouer en recette, avec sa condition de reprise NOMMÉE

- ☐ **« Un sujet devient SERVABLE dès qu'un cours déclare sa notion »** — la deuxième clause du
  « fait quand », et **elle ne se prouve pas tant que la couche 4 ne lit pas l'état**.
  ⚠️ *« Devient servable » est un fait de couche 4, et la couche 4 n'est pas de ce lot.* **Ce qui EST
  prouvé** : l'état écrit en base, les notions déclarées des deux côtés, et l'intersection normalisée
  qui rend le bon cours *(ci-dessus)* — c'est-à-dire **tout ce dont la couche 4 a besoin**.
  **CONDITION DE REPRISE : quand `C4-L12` aura remplacé la branche `cours_par_notions_non_lu` de
  `filtreDuCoursVu` par l'appel à `notionsPartagees()` sur les notions des cours VUS.** *Se rejoue
  alors en une passe : un sujet en `notions`, un cours vu qui déclare la sienne, et il doit entrer
  au vivier.*
- ☐ **Le motif d'écart du vivier, LU PAR UN HUMAIN.** `cours_par_notions_non_lu` est fixé par trois
  tests, mais **personne ne l'a encore vu s'afficher** : `routeur_actif` est à OFF et aucune décision
  n'est posée. **CONDITION DE REPRISE : à la première semaine routée en bac à sable** — vérifier que
  l'écart lu à l'écran dit *« la couche 4 ne le lit pas encore »* et **jamais** *« N cours déclaré(s),
  AUCUN apparié »*.
- ☑ **L'import d'un fichier en format 1.3, de bout en bout, PAR L'ÉCRAN DE DÉPÔT — JOUÉ LE 25/08.**
  ⭐⭐ **LA MOITIÉ INVISIBLE EST FERMÉE, SUR DONNÉE RÉELLE.** Louis a déposé `banque.json`
  *(format 1.3, régénéré le 25/08 : **16 sujets**, 1 texte, 152 matériaux, 148 exercices)* par
  `/prof/corpus?onglet=depot`. **Verdict : `importable`, 0 refus, 0 blocage.**
  ⭐ **Les 15 sujets en `"cours": "notions"` sortent en `cours_etat = 'notions'`** — et non `'aucun'`,
  ce qu'ils auraient tous fait avant ce lot — **avec leurs 31 déclarations de notions écrites**.
  ⭐ **Le 16ᵉ sujet est le vecteur discriminant, et il est arrivé tout seul** : le sujet de
  diagnostic *(« Est-ce une bonne chose de devoir suivre un cours de philosophie ? »)* porte des
  `notions` **mais aucune clé `cours`** → il sort en **`'aucun'`**, ce qui est JUSTE : *« un sujet
  qui déclare des `notions` sans déclarer `cours` n'est toujours PAS servable ; l'un aide à trouver,
  l'autre autorise à servir »* (`08-` §3). **Le port n'écrit donc pas `'notions'` dès qu'il voit des
  notions — il lit bien `cours`.**
  ⭐ **Et les deux contrôles rendent le MÊME verdict sur ce fichier-là**, confronté chaîne par
  chaîne : `0 refus · 0 blocage · 2 signalements`, les deux signalements identiques au mot près
  *(l'agrégé « 1 sujet(s) et 1 texte(s) sans rattachement », et « servi par aucune instance »)*.
- ☑ **« Un sujet devient RÉCLAMÉ dès qu'un cours déclare sa notion, sans re-import » — JOUÉ LE 25/08.**
  Sur les 15 sujets réellement importés : la bannière annonçait **« 15 entrée(s) attendent une notion
  qu'aucun cours ne déclare : la science, la nature, la vérité, la raison, le langage »**. Quatre
  notions déclarées **sur un seul cours** *(« Cognitif »)*, par l'écran, en cochant → **la bannière
  disparaît**, et la mesure en base donne **15 sujets réclamés, 0 muet**. ⛔ **Aucun re-import, et
  aucun sujet touché.** ⚠️ *Ce qui reste non prouvé, c'est « SERVABLE » — un fait de couche 4 (ci-dessous).*
- ☐ **`notions` sur un TEXTE, avec une VALEUR.** ⭐ **Le chemin a tourné le 25/08** : le fichier
  déposé portait **un texte** *(Épicure, `Lettre à Ménécée`)* — il n'en portait aucun la veille —, et
  il est entré proprement, `cours_etat = 'aucun'`, `notions = {}`. ⚠️ **Mais il ne DÉCLARE ni `cours`
  ni `notions`** : la colonne a donc été écrite **vide**, et le chemin n'est pas éprouvé avec une
  valeur. **CONDITION DE REPRISE : au premier texte déposé qui porte `"notions"`** — vérifier que
  `exercices_textes.notions` se remplit.
  ⚠️ **Et c'est le SEUL point où le port et `generateur/verifie-import.py` divergent** : le script
  **refuse** la clé *(`✗ [R02] clé « notions » que le 08- ne déclare pas`)*, le port l'accepte parce
  que le `08-` §2, gelé, la déclare. *Épinglé par un test, porté au registre en dette D7.*
- ✅ **Le chemin de confirmation de la garde L2 — CORRIGÉ LE 29/08, AU CHANTIER, ET LA CONDITION DE
  REPRISE EST HONORÉE DANS SES DEUX MOITIÉS.**
  ⭐ **Éprouvé par l'échec avant de l'être par le succès, sur la donnée RÉELLE des deux bases** —
  script laissé au dépôt : `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON
  scripts/recette/crlf-textarea.mjs --epreuve`. Il simule ce que la soumission fait *(LF → CRLF)*,
  puisque rien en Node ne le fait, et joue l'expression de la garde AVANT et APRÈS :
  · **un enregistrement SANS changement de texte ne demande plus rien** — la garde se déclenchait à
  tort **6 fois sur 6** *(5 sandbox, 1 prod)*, elle se déclenche désormais **0 fois sur 6**. Dont
  « NAture humaine », **110 lignes** : le compte exact du relevé du 25/08 ci-dessous.
  · **et un changement RÉEL demande toujours confirmation** — contre-épreuve sur les mêmes 6 corps,
  la garde reste muette **0 fois sur 6**. ⛔ *Sans cette seconde moitié, une garde « corrigée » est
  simplement morte.*
  ⭐⭐ **ET CORRIGER CETTE GARDE SEULE AURAIT FABRIQUÉ UN BUG** — c'est le balayage qui l'a vu, pas la
  note d'origine : `creerContenu` (`actions.ts:736`) écrit `texte_extrait` sans normaliser, tout
  comme `modifierContenuBiblio`. Aujourd'hui **les deux côtés dérivent ensemble**. Normaliser la
  seule comparaison aurait rendu **tout cours collé au clavier « différent de lui-même »** à sa
  première ré-ouverture — et un « oui » du professeur détruit la découpe **et rabat les `vu_at` des
  élèves**. **Les deux sites sont partis dans le même commit.**
  ⭐ **Le balayage a couvert le dépôt entier** : 92 `<textarea>` recensés, **53 sites instruits**,
  **17 exposés** et **36 propres avec leur raison**. ⭐ **Le discriminant n'est pas
  `<form action={…}>`** — c'est *« la valeur traverse-t-elle un FormData construit DEPUIS le
  formulaire »*. Un `<textarea>` contrôlé qui part par **argument de fonction** reste en LF : c'est
  ce qui innocente les sept éditeurs de prompts d'IA de `components/BlocPrompt.tsx`, les formulaires
  élève d'Aletheia, le chat du Scriptorium et les paramètres du Codex.
  ⭐ **Onze sites corrigés, six fichiers, tous par `normaliserRetours`** *(qui est déjà le
  normalisateur partagé du dépôt — six importateurs depuis quatre dossiers ; aucun module neuf
  n'a été inventé)* : `scriptorium/actions.ts` **736 et 790** · `conception/actions.ts` **76, 84,
  131, 329, 339** *(et **576** aligné sur le même outil, qui couvre en plus le CR seul)* ·
  `quazian/actions.ts` **270-271** *(recto/verso partent à l'élève ET au modèle)* ·
  `fragments-erudition/essai-actions.ts` **43 et 77** · `fragments-erudition/actions.ts` **75** ·
  `utils/passation/depots.ts` **526 et 559** *(le commentaire et le message du PROF, seuls champs
  non normalisés d'un écran dont les trois champs de l'ÉLÈVE l'étaient depuis C4-L4)*.
  ⭐ **Et la donnée a été LUE avant d'être réparée** : **0 `\r`** dans les deux bases, sur toutes les
  colonnes mesurées. Les corps multi-lignes existent *(33/33 documents en prod)* mais viennent tous
  d'une extraction de fichier ou du chemin élève. **Le défaut était armé et n'avait pas encore
  tiré — c'est de la prévention, pas de la réparation.** ⚠️ *Et il fallait le mesurer : la note du
  26/08 donnait `consigne_instanciee` à 1 CR ; elle est à 0 aujourd'hui, simplement parce que 448
  de ses 452 lignes sont **mono-ligne** — un `\r` n'apparaît qu'où il y a un saut de ligne.*
  ⚠️ **Trois non-constats, vérifiés en exécutant plutôt que supposés** : `distracteurs`
  (`conception/actions.ts:80`) et `notions_libres` (`scriptorium/actions.ts:713`) **tiennent par
  leur `.trim()`** — le déplacer rouvrirait le défaut ; et `utils/examens/conception.ts` était **déjà
  propre** *(il passe par `consigneANoter`)*. ⚠️ **Deux sites exposés laissés sciemment** :
  `ajouterContenu` (**143**) et `modifierContenu` (**629**), dont les composants
  `FormulaireContenu.tsx` et `LigneContenu.tsx` **ne sont montés nulle part** *(seul le type
  `ImageItem` est importé)* — le geste est écrit au `IDEES_post_rentree.md` pour qui les remontera.
  ⚠️ `npm test` **1921/1921**, `tsc --noEmit` **rien**, `eslint` **0 erreur** sur les sept fichiers —
  ⛔ *et c'est exactement pourquoi ces trois-là ne prouvent rien ici : aucun n'envoie un formulaire.*
  **Énoncé d'origine :**
  **La garde se déclenche À TORT, à chaque enregistrement d'un cours découpé, même si le texte n'a
  pas bougé.** Cause : **la soumission d'un formulaire HTML normalise les sauts de ligne d'un
  `<textarea>` en CRLF**, quand le texte stocké porte des `\n` — les deux ne sont donc jamais égaux.
  **Mesuré en instrumentant l'action** *(sonde retirée depuis)*, sur le cours réel « NAture
  humaine » : `lenStocke: 9460 · lenSoumis: 9570 · premiereDivergence: 28` — **110 `\r` de plus,
  un par saut de ligne.**
  ⛔ **Ce que ça coûte** : *(1)* le professeur reçoit « votre découpe sera effacée » **pour rien**, à
  chaque sauvegarde — et s'il confirme, **elle est réellement détruite** ; *(2)* `texte_extrait` est
  **réécrit avec les CRLF** à chaque enregistrement, donc le corps que le RAG sert **dérive dès la
  première édition** *(vérifié : « Cognitif » est passé de 0 à 34 `\r` sur une simple sauvegarde —
  remis en état ensuite)*.
  ⚠️⚠️ **ET IL EST STRUCTURELLEMENT INVISIBLE** : `new FormData(formulaire)` **ne fait pas** la
  normalisation, si bien qu'une sonde côté navigateur rend « identiques : true ». **Seule la
  soumission réelle la fait.** Aucun test, aucun `tsc`, aucun lint ne peut l'attraper.
  ⭐ **La correction est d'une ligne**, et le dépôt connaît déjà ce piège *(C4-L4, `blocs()`)* : elle
  est écrite au **`IDEES_post_rentree.md`**, avec sa mesure.
  **CONDITION DE REPRISE : dès que la correction est prise en charge** — vérifier alors qu'un
  enregistrement SANS changement de texte **ne demande plus rien**, et qu'un changement RÉEL du texte
  demande toujours confirmation. ⭐ *Au passage, la conséquence pour C4-L16 : **on ne peut pas
  déclarer de notions sur un cours DÉCOUPÉ** sans passer par cette fausse alerte. Sur un cours non
  découpé, tout fonctionne — prouvé le 25/08.*

---

## C5 · L1 — La conception, côté professeur : un texte se dépose, se décompose, se valide (séance du 26/08)

**⚠️ AUCUNE MIGRATION — aucune n'était attendue, aucune n'a été nécessaire.** Le piège 19 du prompt
en autorisait une *(rendre `exercices_textes.id_import` nullable)* ; elle a été **évitée** en
fabriquant un `id_import` qui **dit d'où il vient** — `depot-en-ligne:<uuid>`, `import_id` NULL.
**Aucun interrupteur neuf** : le lot lit `fabrique_actif`, qui existe depuis C4-L8.

**⭐ LE SMOKE PROF A ÉTÉ JOUÉ EN SÉANCE**, sur un compte prof ouvert par Louis à ma demande — une
session Code ne s'authentifie pas. **Les CINQ clauses du « fait quand » sont donc prouvées à
l'écran**, et elles seraient parties décochées sans lui. Tout ce qui pouvait se prouver **par
requête et sur pièce** l'avait été auparavant — `scripts/recette/generateur-c5l1.mjs`,
**27 vérifications, 0 échec**, décor semé et retiré, sandbox revenue à son état d'avant.
⭐ **Et le smoke a trouvé ce qu'aucun test ne pouvait trouver** : la troisième morsure du CRLF,
mesurée des deux côtés *(plus bas)*.

### Prouvé en séance, avec sa preuve — EN BASE, pas à l'écran

- ☑ **Un texte se dépose hors fichier d'import.** `deposerUnTexteNeuf()` — *le même code que
  l'action de `/prof/conception/textes`, qui ne l'enveloppe que d'une garde d'accès*. En base :
  `id_import = depot-en-ligne:<uuid>`, `import_id` **NULL**, `contenu_id` pointant l'unique ligne de
  `scriptorium_contenus` créée *(7 → 8, aucune seconde table)*, `reference_id` **NULL** — le dépôt
  et la décomposition sont **deux gestes**.
- ☑ **Il se décompose — G1, puis G2, puis G3, sur un texte RÉEL.** Le texte du `05-` §4.7
  *(220 mots, 17 phrases)*. **Deux passages complets, les 26/08 à 16 h 47 et 16 h 52** : `CONFORME`
  les deux fois, **0 refus, 0 blocage** — 4 moments, 17 phrases, 8 lectures sur 6 phrases-thèses,
  4 concepts, **~75 valeurs déclarées**. **Trois lignes à `api_couts`** à chaque fois, module
  `exercices-generateur`, **`phase` NULL sur les trois**. **0,0897 $** puis **0,0584 $**
  *(−35 % : 5 756 jetons lus au cache — le préfixe stable travaille d'un texte à l'autre)*, en
  ~47 s et ~50 s.
- ☑ **Un signalement s'affiche et n'arrête rien.** Au second passage : *« lectures, phrase 10 : une
  lecture de 35 mots (au-delà de 30) »* — la référence reste `CONFORME` et elle est écrite.
- ☑ **Les intervalles se dérivent, et les STOCKER fait refuser.** Les 4 moments localisés en
  caractères par dérivation, les 4 concepts retrouvés par leurs formes, l'union du statut du moment
  rendue à sa phrase. **Et y ajouter une clé `intervalle` déclenche le refus n° 11**, éprouvé sur la
  référence réellement écrite.
- ☑ **⭐ Une référence non validée n'entre jamais dans une phase de jugement — PROUVÉ PAR
  L'ÉCHEC.** Insertion d'un `exercices_squelettes` portant un `artefact_jugement`, sur un dépôt dont
  l'exercice vise la référence non validée → **la base refuse** : *« Garde 07- §1.1 : une référence
  non validée n'entre jamais dans une phase de jugement »*. **L'extraction seule passe** — la garde
  porte sur le jugement, pas sur tout —, et **le jugement passe une fois la référence validée** : la
  garde est une condition, pas un mur.
- ☑ **Une référence validée devient immuable.** `update` du `contenu` après validation → **la base
  refuse** : *« une référence validée ne se modifie plus en silence »*.
- ☑ **Le texte n'entre au pipeline Aletheia qu'une fois sa référence validée.** La requête **même**
  de `/prof/conception/nouvelle` ne le rend pas avant, le rend après ; et le prédicat unique
  (`utils/reference-validee.ts`) bascule dans le même sens.
- ☑ **Les quatre écrans touchés EXISTENT, COMPILENT et sont GARDÉS.** `npx next build` les liste et
  les compile *(`ƒ /prof/conception/textes` au manifeste)* — **c'est lui qui aurait attrapé un export
  illégal depuis un `'use server'`**, le défaut que ni `tsc` ni `npm test` ne voient. Et sur le
  serveur de développement, `/prof/conception`, `/prof/conception/textes`,
  `/prof/conception/nouvelle` et `/prof/corpus` rendent tous **307 → `/login`** : le proxy les garde,
  et aucune erreur n'apparaît au journal du serveur. ⚠️ *Cela prouve que les modules sont valides et
  que la porte est fermée — **pas** que les écrans se comportent bien derrière elle. C'est ce que le
  smoke ci-dessous a prouvé ensuite, session prof ouverte.*

### ⭐ SMOKE PROF JOUÉ LE 26/08 — les cinq lignes sont COCHÉES

**Louis a ouvert une session prof en séance.** Les cinq gestes ont été joués à l'écran, dans
l'ordre, sur un texte réel déposé pour l'occasion — **Kant, *Qu'est-ce que les Lumières ?*, 131 mots,
8 phrases**. *Le décor a été retiré le soir même ; seul le texte Kant reste au corpus, décomposé et
validé, parce que c'est une entrée légitime qui a coûté un appel réel.*

- ☑ **C5L1-1 · La décomposition depuis l'écran.** Texte déposé au formulaire, puis
  **« Décomposer ce texte »**. Le bouton a bien affiché **« G1, puis G2, puis G3… »** pendant
  **37 s**, et le retour a porté : `G1 : 1 appel(s)` · `G2 : 1 appel(s)` · `G3 : 1 appel(s)` ·
  *« 3 ligne(s) attendue(s) à `api_couts` — module `exercices-generateur`, modèle
  `claude-sonnet-4-6`, `phase` NULL »* · `8 phrase(s), 131 mot(s)` · `3 moment(s) · 8 phrase(s) ·
  4 lecture(s) sur 3 phrase(s)-thèses · 5 concept(s)` · `~45 valeurs déclarées`.
  **Verdict : CONFORME.** ⭐ Et le dépôt en base porte `id_import = depot-en-ligne:d23f8081…`,
  `import_id` **NULL**, une **seule** ligne de `scriptorium_contenus`.
- ☑ **C5L1-2 · La validation, D'UN SEUL GESTE.** Bandeau à quatre chiffres, armature en tête,
  moments en filet de marge avec leur étiquette et leur flèche de cible (`conclut → M1`,
  `precise → M1`), lectures défendables en clair avec leur drapeau, concepts en pied de page **avec
  le nombre d'occurrences retrouvées**. ⭐ **Et les intervalles dérivés s'affichent** :
  `phrases 1–3 · car. 0–412`, `phrases 4–6 · car. 413–512`, `phrases 7–8 · car. 513–745`.
  *« Référence validée — un seul geste, pour toute la référence. »* ⭐ **L'onglet « Corriger »
  DISPARAÎT alors**, remplacé par « Dévalider — explicitement ».
- ☑ **C5L1-3 · ⭐ TRANCHER UN BLOCAGE — les trois temps, joués.**
  *(a)* **Un REFUS n'écrit rien** : `M2.de` porté de 4 à 5 *(trou sur la phrase 4)* →
  *« La correction est REFUSÉE par le contrôle : elle n'a pas été écrite. "Un trou ne passe jamais
  en silence." · trou entre M1 (finit en 3) et M2 (commence en 5) »*, **et la base n'a pas bougé**
  *(vérifié : `M2.de = 4`)*.
  *(b)* **Un BLOCAGE s'écrit et bloque** : cible de M2 retirée *(`conclut` sans cible)* →
  *« Correction écrite, mais 1 blocage(s) restent »*, et **à la recharge le bandeau dit
  « À TRANCHER »**, avec sa raison, **bouton de validation désactivé**.
  *(c)* **La correction qui tranche rouvre la validation** : cible remise → *« Correction écrite,
  et le contrôle repasse : la validation est possible. »*
- ☑ **C5L1-4 · La sélection DANS le texte, et le pipeline jusqu'au bout.** Le texte décomposé
  **n'apparaissait pas** au pipeline avant validation, et y est **apparu après**. Sélection à la
  souris de *« Sapere aude ! Aie le courage… »* → **`caractères 413–482 · extrait`**, avec le
  passage cité en regard. ⭐⭐ **413 est EXACTEMENT la borne de M2 affichée à l'écran de la
  référence** : la dérivation depuis les numéros de phrase et la capture à la souris tombent sur le
  même caractère. La garde mord : un englobant `0–100` qui ne contient pas la sélection →
  *« L'englobant est la portion AFFICHÉE AUTOUR de la sélection : il doit la contenir
  entièrement. »*, **bouton désactivé** ; englobant `300–600` → alerte levée. Instance conçue, et
  **en base** : `materiau_source_localisation = [413,482]`, `englobant = [300,600]`,
  `provenance = texte_auteur`, `support = extrait`, `cran = 8`.
- ☑ **C5L1-5 · La dévalidation, et ce qu'elle ne défait pas.** *« Référence dévalidée : aucune
  instance NEUVE ne peut plus se concevoir dessus. **1 instance(s)** déjà bâtie(s) sur ce texte ne
  sont pas défaites — retirez-les une à une si c'est ce que vous voulez. »* **Le compte est juste**,
  et le texte **sort** aussitôt de la liste du pipeline.
- ☑ **La doctrine refuse ce qu'elle doit refuser.** Au passage, en Codex : un cran 8 avec le
  matériau en cible → *« le cran 8 veut `materiau_cible` nul »*. `empechementsDeConception` (C4-L8)
  mord toujours.

### ⚠️⚠️ CE QUE LE SMOKE A TROUVÉ, ET QUI N'EST PAS DE CE LOT — le CRLF, TROISIÈME morsure

**Mesuré en tapant vraiment dans un `<textarea>`, puis lu en base :**

| Où | CR |
|---|---|
| `textarea.value` | **0** |
| `new FormData(formulaire)` *(côté navigateur)* | **0** |
| **en base**, sur un champ qu'aucun code ne normalise — `exercices.consigne_instanciee` | **1** ⚠️ |

⭐ **La normalisation en CRLF a donc bien lieu SUR LE CHEMIN DES SERVER ACTIONS REACT** — ce qu'on
pouvait espérer différent, puisque React sérialise en JavaScript. **Ce n'est pas différent.**
⭐ **Et la normalisation défensive de C5-L1 a fait son travail** : dans la MÊME séance, le texte
déposé et le JSON corrigé sont mesurés à **0 CR**, face au **1 CR** de la consigne.
⛔ **Le défaut est PRÉ-EXISTANT, hors périmètre, et NON CORRIGÉ** : `concevoirInstance` et
`editerInstance` (C4-L8) écrivent la `consigne_instanciee` et l'appui sans normaliser, et
`distracteurs: brut.split('\n')` laisse un `\r` **en queue de chaque distracteur**.
**Porté au `IDEES_post_rentree.md`**, avec sa mesure et la correction d'une ligne par site.
**CONDITION DE REPRISE : dès que la correction est prise en charge** — vérifier alors qu'une
consigne saisie sur deux lignes revient à `0 CR`, et qu'un distracteur ne porte plus de `\r` en queue.

### ⭐ CE QUI A ÉTÉ TRANCHÉ EN CLÔTURE — `consigne_gabarit` est RETIRÉE

**La troisième pièce de la mission de C5-L1 ne se construira pas, et elle n'a plus à se construire :
`consigne_gabarit` était un RELIQUAT.** Décision de Louis du 26/08, sur l'archéologie faite en fin
de séance — **et la réponse était déjà écrite au `CONTEXTE.md` du 16/08** : *« le schéma sait déjà
déclarer par cran ; `consigne_gabarit` est restée à plat PAR OUBLI. Ce n'est pas un arbitrage à
rendre, c'est une dette du `07-` à écrire. »*

- ☑ **La colonne sort de la déclaration du `07-` §1.1**, avec ses trois écarts mesurés
  *(cardinalité 13 contre ~400 · la consigne ne varierait ni avec le mode ni avec le cran · 324
  consignes existantes qui ne rentrent pas)* et sa généalogie. **`07-` v2.55.**
- ☑ **Ce qui fait le travail est nommé** : la banque `exercices_routes`, **3264 lignes** dérivées,
  servie par le pipeline à son étage 4. *« Les questions engendrées depuis la consigne-gabarit du
  type » le sont, correctement, depuis la ROUTE.*
- ☑ **La MIGRATION DE RETRAIT — ✅ JOUÉE LE 26/08, EN SANDBOX ET EN PROD.**
  `c5_l1_retrait_consigne_gabarit.sql` + son rollback. Elle porte un bloc qui **refuse de jouer** si
  une seule ligne porte une valeur, et **aucun lecteur applicatif n'était à retirer d'abord**.
  Sa condition de reprise — *le go de Louis* — a été remplie le jour même, et le `SUIVI_SQL.md` la
  porte **☑ sandbox (26/08) · ☑ prod (26/08)**, sa ligne écrite avant l'exécution comme la règle 1
  l'exige.
  ⚠️ **Case corrigée au check-in du 27/08 : elle est restée `☐` un jour après le geste.** *Le texte
  d'origine disait « écrite et NON JOUÉE ».* C'est le même défaut de tenue que les six cases `Prod`
  du `SUIVI_SQL.md` reprises le même jour — **le journal a pris du retard sur la base au moment
  précis où la base est devenue une production**. Un reste qui traîne après coup ne se contente pas
  de mentir : il appelle un rejeu, et ici le rejeu était un `drop column`.

### ⚠️ Et « la tranche » est tranchée aussi — c'est la lecture (b)

**Décision de Louis du 26/08** : « la tranche » est **la part de la RÉFÉRENCE servie à la Phase 2**
*(ce que le `02-` §6 A dit littéralement)*, **jamais un segment du livre**. Ce n'est donc **pas une
seconde échelle de sélection**, et l'entrée de C5-L1 ne demandait qu'un geste — le choix de
l'extrait, qui est construit et prouvé. ⭐ **Ce que (b) désigne appartient à `C5-L3`**, dont l'entrée
du `07-` §2 le porte désormais ; la brique existe *(`valeursServies()`)*.
⚠️ *Ce qui a fait écarter (a), pour qui voudrait rouvrir : elle exigerait de savoir quelle plage est
« exposée » pour une CLASSE, quand la position de lecture est par élève.*

---

## C5 · L2 — La passation de lecture, côté élève (⚠️ **AUCUNE MIGRATION** — aucune n'était attendue, aucune n'a été nécessaire)

**Séance du 27/08.** Relevé : `RELEVE_C5_L2_2026-08-27.md`. Recette :
`scripts/recette/lecture-c5l2.mjs` — **42 vérifications, 0 échec**, décor semé et retiré.
`npm test` **1611 / 1611** *(1581 avant)* · les deux étalons **44 / 44** *(30 avant)* ·
les quatre dérivations **IDENTIQUE** · `npx next build` **compilé**.

> ⭐⭐⭐ **LES TROIS CHOSES SONT FERMÉES.** ① la porte *(une route, une liste, le prédicat de C4-L6
> appliqué **des deux côtés**)* · ② le texte *(l'englobant servi, la sélection marquée, **pas un
> octet retouché**)* · ③ la référence *(`exercices.reference_id` a enfin un écrivain de production,
> et **la garde en base mord** — prouvé par l'échec)*.

### Prouvé en séance, avec sa preuve — EN BASE et PAR APPEL

- [x] **C5L2-A · La porte, dans les deux sens.** `/eleve/modules/codex/exercice/<dépôt de LECTURE>`
  est **refusé** *(il était servi avant ce lot, à qui connaissait l'identifiant)* ;
  `/eleve/modules/aletheia/exercice/<dépôt d'ÉCRITURE>` est refusé aussi. Et les deux listes se
  départagent : Aletheia porte le dépôt de lecture, jamais celui d'écriture ; Codex l'inverse.
  _(Recette, section B — 7 vérifications ; `utils/codex-onglets/onglets.test.ts`, 4 vecteurs neufs.)_
- [x] **C5L2-B · La porte est `exercices_actif`, et lui seul.** À OFF, la liste de lecture est
  **vide** ; l'interrupteur est remis **exactement comme trouvé** en fin de course. **Aucun septième
  interrupteur n'est né, et `configModules.ts` n'est pas touché** *(les onglets sont C5-L4 — le test
  « Aletheia n'en gagne aucun côté élève » reste vert)*. _(Recette, section B.)_
- [x] **C5L2-C · Le texte d'auteur s'affiche.** Sur le texte réel de C5-L1 *(Kant, référence validée
  le 26/08)* : l'englobant `[101, 512]` rend **411 caractères sur 745**, identiques à la base ; la
  sélection `[413, 482]` — **la borne même que le smoke prof de C5-L1 a captée à la souris** — est
  marquée dedans ; et **la concaténation des segments REND la tranche à l'octet près**.
  _(Recette, section C — 9 vérifications ; `utils/lecture/texte-support.test.ts` 11 vecteurs,
  `utils/deroule/marquage.test.ts` 5 vecteurs neufs.)_
- [x] **C5L2-D · La chaîne a enfin le texte, et la garde en base MORD.** Avec `reference_id` posée :
  `referent = texte`, `reference` et `materiau` non nuls. Sans elle : **les trois nuls**. Et la garde
  `garde_reference_validee` **refuse** un `artefact_jugement` sur une référence non validée
  *(`check_violation`)* — puis **laisse passer** dès que `reference_id` retombe à NULL, ce qui était
  l'état de toute instance conçue en ligne. _(Recette, section D — 6 vérifications, dont deux **par
  l'échec**.)_
- [x] **C5L2-E · RR3 — la preuve PAR L'ÉCHEC.** Une sortie de modèle **fabriquée**, **conforme au
  schéma**, où « Aie le courage de te servir de ton propre entendement » *(Kant)* porte l'étiquette
  `copie` : le contrôle la **REFUSE**, et elle ne glisse pas jusqu'à l'écran pour y devenir une
  contestation. Le sens inverse ne lève ni refus ni alerte — **y compris quand la copie cite
  l'auteur**. _(Recette, section E ; `utils/chaine/retour.test.ts`, 10 vecteurs neufs.)_
- [x] **C5L2-F · Le texte part au modèle, BALISÉ.** `messageAvecMateriau` — déclaration, bloc
  `<<<MATERIAU nom="le texte support…"`, demande RR3 — et la neutralisation empêche de refermer la
  balise depuis l'intérieur. **L'appel du retour était le seul de la chaîne à concaténer ses morceaux
  à la main.** _(Recette, section E ; tests.)_
- [x] **C5L2-G · La traversée, jusqu'au retour publié.** Cran 8 → **les six temps** ; les trois
  gestes dans l'ordre ; **copie soumise en CRLF → 0 CR en base et 3 blocs** ; la chaîne tourne,
  **3 lignes à `api_couts`** *(`p1`, `p2`, `retour`)*, **40,5 s** puis **41,0 s** contre 180 s de
  contrat ; **retour écrit ET publié**. **Aucune citation n'attribue à l'élève une phrase de
  l'auteur.** *(Deux traversées payantes, **0,1333 $** au total, en bac à sable.)*

### ⚠️⚠️ Ce que les deux traversées ont montré, et qui est une QUESTION POUR LOUIS

**Sur 4 points ancrés — deux tirages, deux points chacun —, `ancrage.source` valait `copie` 4 fois
sur 4**, y compris au tirage où la copie de l'élève **citait Kant entre guillemets**. Le canal
`texte_support` est **servi, balisé et contrôlé** ; il n'a simplement **pas été employé**.

⚠️ **UN TROISIÈME TIRAGE, AU SMOKE DU 27/08, A DONNÉ LE MÊME RÉSULTAT** — 2 points, **2 « copie »,
0 « texte_support »** —, sur une copie qui citait pourtant l'auteur entre guillemets **et** sur un
exercice dont la consigne dit *« Appuie-toi sur les mots du texte »*. **Six points ancrés, six fois
« copie ».**

**La cause est structurelle, et elle est dans une section GELÉE** : la **règle 1** du gabarit de
Calame *(`07-` §4)* dit *« chaque point s'ancre sur une citation **du squelette** »*, et le squelette
est fait de **la copie** ; **RR3** *(`01-` §12)* suppose au contraire qu'un point puisse citer
**le texte support**. ⛔ **Le gabarit n'a pas été touché** — il est gelé et dérivé ; ⭐ ce qui
m'appartenait, **l'assemblage**, a été renforcé *(le bloc balisé dit quelle étiquette porte une
citation qui en vient)*, **et ça n'a pas suffi sur deux tirages**. **La décision est de source.**
_(Détail : `RELEVE_C5_L2_2026-08-27.md` §6.)_

### ⭐⭐ LE SMOKE ÉLÈVE DU 27/08 — joué dans l'aperçu embarqué, session ouverte par Louis

> **Louis s'est connecté en élève (Elo · T5) et m'a passé la main.** ⚠️ **La session élève vivait
> dans l'APERÇU EMBARQUÉ**, pas dans le vrai Chrome — celui-là portait la session PROF. La règle
> d'or de ce fichier veut l'inverse ; ici elle ne mord pas *(aucun de ces écrans n'ouvre de
> `confirm()`)*, **mais elle est la raison pour laquelle deux lignes restent décochées ci-dessous.**
> Décor : `scripts/recette/lecture-c5l2.mjs --decor-smoke <eleveId> <classeId>` — deux instances
> dans une classe RÉELLE *(la liste de l'élève est bornée par sa classe en contexte)*.

- [x] **C5L2-1 · La porte, cliquée.** Sous `/eleve/modules/aletheia`, en **vue mobile** : le bloc
  « **Mes exercices de lecture** » apparaît, avec sa ligne et sa pastille « à faire » ; **le clic
  entre dans le déroulé**, qui affiche la frise des six temps. Et les deux URL croisées, tapées à la
  main, **rendent 404 toutes les deux** — avec, au serveur, le motif exact : *« dépôt … refusé à la
  porte « codex » : son instance relève de « aletheia » »*, et son symétrique. ⭐ **Contre-épreuve
  faite** : le dépôt d'ÉCRITURE, lui, **s'ouvre bien sous Codex** — les 404 sont la borne, pas une
  panne. *(27/08.)*
- [x] **C5L2-2 · Le rendu du texte.** Le bloc « **LE TEXTE** » s'affiche **avant** la consigne des
  cas, avec son identité *(Kant · Qu'est-ce que les Lumières ? · Berlinische Monatsschrift, 1784,
  trad. Barni, ouverture)*. ⭐⭐ **Sondé dans le DOM, contre la base** : `textContent` = **411
  caractères, identiques octet pour octet** à `texte_extrait[101:512]` ; **un seul `<strong>`**, et
  il vaut exactement `texte_extrait[413:482]` — *« Sapere aude ! Aie le courage de te servir de ton
  propre entendement ! »*. Le gras **et** le cadre au pigment d'Aletheia sont là, et le cadre **se
  referme de chaque côté du retour à la ligne** *(le `box-decoration-clone` de C4-L15)*. ⛔ **RR4
  vérifié dans le HTML entier** : ni `armature`, ni `moments`, ni `lectures_defendables`, ni
  `question_directrice`. *(27/08, vue mobile 501×714.)*
- [x] **C5L2-6 · Le vide expliqué.** `exercices_actif` basculé à OFF : la page rend *« Les exercices
  de lecture ne sont pas encore ouverts. Ton professeur t'indiquera quand ils commencent. »*, et
  **aucun onglet n'apparaît ni ne disparaît**. ⚠️ L'interrupteur a été **remis à ON dans la foulée**,
  et les six ont été re-constatés à leur état d'origine. *(27/08.)*

### ⚠️ CE QUE LE SMOKE A TROUVÉ — deux constats, aucun n'est de ce lot

1. ⭐⭐ **LA GARDE DE LECTURE DES RETOURS BLOQUE LE DÉROULÉ DE LECTURE, ET ELLE LE DIT.** L'écran a
   rendu *« Tu as un retour à lire avant de pouvoir rendre : Fragments — … »*, et **c'est pour cela
   que rien ne s'écrivait en base** : `portier` (`app/deroule/actions.ts`) passe
   `messageSiRetoursNonLus` **avant toute écriture**, donc l'ouverture du dépôt, l'enregistrement du
   brouillon et la remise étaient tous refusés — le dépôt est resté `assigne`, `texte_v1` vide.
   ⭐ **C'est le comportement voulu** *(« 1 retour non lu bloque tous les rendus »)*, il vaut pour la
   lecture comme pour l'écriture, et **l'écran le dit en toutes lettres**. ⛔ **Le retour non lu est
   un vrai retour Fragments d'Elo** : je n'y ai pas touché. *C'est ce qui laisse `C5L2-3` décoché.*
2. ✅ **DOUBLE « ← Retour » sur la page élève d'Aletheia — TROUVÉ PUIS CORRIGÉ le 27/08.**
   `CarteMessage` (`app/eleve/modules/aletheia/page.tsx`) portait **son propre** lien de retour, en
   plus de celui du haut de page : quand aucun livre n'était assigné, **les deux s'affichaient**.
   **Le défaut PRÉEXISTAIT à ce lot** — il vient de C7-L2 — et il ne se voyait pas, les deux liens
   se touchant presque ; la section « Mes exercices de lecture » s'est insérée entre eux et l'a rendu
   voyant. ⛔ **Le retirer du composant aurait cassé les DEUX retours anticipés**, où il est la seule
   issue : c'est donc l'appelant qui déclare s'il en porte déjà un (`avecRetour`).
   ⭐ **Aucun test ne compte les liens d'une page** — c'est le smoke, et lui seul, qui pouvait le voir.

- [x] **C5L2-7 · Les quatre chemins de la page élève d'Aletheia, après correction.** Vérifiés **un à
  un à l'écran**, tous à **UN SEUL « ← Retour »** *(compté dans le DOM, sur les `<a>` du `<main>`)* :
  **module inactif** → « Ce module n'est pas encore activé. », le Retour est **présent et seul** ·
  **module indisponible** → « Ce module n'est pas disponible pour ton compte. », idem ·
  **aucun livre** → la carte, sans Retour propre, sous celui du haut de page ·
  **au moins un livre** → la liste des séances. ⚠️ Les deux premiers chemins ont demandé de basculer
  `modules.actif` puis de retirer `classe_modules` pour les deux classes de l'élève : **les deux
  bascules ont été restaurées à l'identique** *(mêmes `id`, `classe_id`, `module_id`, `created_at` —
  re-constatés par requête)*. ⭐ **Bonus vérifié au passage** : sous la classe **Test**, la section
  « Mes exercices de lecture » **disparaît** — la borne par classe en contexte (`01-` §2), à
  l'écran. *(27/08.)*

### Ce qui reste à jouer en recette — chacun avec sa condition de reprise NOMMÉE

> ⚠️ **Trois lignes seulement restent, et le motif de chacune est écrit.** Les deux premières ne
> demandent plus une session — elles demandent de **lever d'abord la garde de lecture des retours**
> pour l'élève de test ; la troisième demande le **vrai Chrome**, parce que le presse-papier de
> l'aperçu embarqué est inaccessible dans les deux sens.

- [x] **C5L2-3 · Le CRLF sur une ANALYSE LONGUE — COCHÉ le 27/08, une fois la garde levée.** Le `06-` §1 range « les analyses longues » dans la
  lecture : c'est le champ le plus sollicité de cet écran. Sonde serveur pendant un **vrai clic** —
  ⚠️ **`new FormData()` NE LE MONTRE PAS**, et le piège a mordu **trois fois** (C4-L4, C4-L16, C5-L1,
  ce dernier **sur le chemin des server actions React**).
  Louis a lu le retour Fragments en attente, la garde est tombée, et **la traversée est allée
  jusqu'au bout**. Une analyse de **trois paragraphes** tapée **à la main** dans le champ :
  `textarea.value` portait **750 caractères, 0 CR, 4 LF** ; **et EN BASE, après le vrai clic sur
  « Rendre ma v1 » : 750 caractères, 0 CR, 4 LF, et `blocs()` en compte TROIS** — le découpage
  survit de la frappe à la mesure. ⭐ *C'est la quatrième fois qu'on éprouve ce piège, et la première
  fois sur le chemin de la lecture.*
- [x] **C5L2-4 · Le collage refusé, sur ses TROIS vecteurs — COCHÉ le 27/08, DANS LE VRAI CHROME.**
  Session élève ouverte par Louis dans son **vrai Chrome** *(la règle d'or de ce fichier, tenue)*, sur
  le serveur de dev. **Trois gestes PHYSIQUES, trois handlers distincts** — `onPaste`, `onDrop`,
  `onContextMenu` — et **les trois journalisés en base** :

  | Geste réel | Ce qui s'est passé | `collages_bloques` |
  |---|---|---|
  | **Cmd+V** dans le champ | rien ne se colle | `raccourci` · 19:01:02 |
  | **clic droit** sur le champ | **aucun menu contextuel n'apparaît** | `menu-contextuel` · 19:01:24 |
  | **glisser-déposer** dans le champ | rien ne se dépose | `glisser-deposer` · 19:01:50 |

  ⭐⭐ **ET LA CONTRE-ÉPREUVE EST CE QUI REND LE TEST CONCLUANT.** Un `Cmd+V` qui ne colle rien ne
  prouve rien **si le presse-papier est vide**. Il a donc été rempli par un **vrai `Cmd+C`**, puis
  **collé avec succès dans un champ témoin de la MÊME page** *(64 caractères reçus)* — avant d'être
  refusé par le champ de rédaction. *C'est précisément ce qui était impossible dans l'aperçu
  embarqué, où le presse-papier refuse l'écriture par l'API comme par `execCommand`. La règle d'or
  existe pour ça, et on peut enfin dire pourquoi pour ce vecteur-là.*

  ✓ `texte_v1` en base : **0 caractère** — rien n'est entré. ✓ `integrite_signalements` : **0** —
  *« tous tagués, aucun bloquant »* (`06-` §6). ✓ Décor retiré *(164 instances, comme avant)*.
- [x] **C5L2-8 · LA TRAVERSÉE ENTIÈRE, À L'ÉCRAN — COCHÉ le 27/08.** Les **trois gestes dans
  l'ordre** *(confiance par compétence → conditions → « ta thèse en une phrase ? », et l'écran refuse
  de rendre tant qu'il en manque un : « Tu peux rendre ta copie. » n'apparaît qu'au bout)*, puis
  **« Rendre ma v1 » cliqué pour de vrai**. La chaîne est partie : `mesure_v1` **abouti**, *« 1
  mesurée, 1 écrite, retour écrit, 3 appels, 40 s »*, **trois lignes à `api_couts`** *(p1 0,0381 $ ·
  p2 0,0247 $ · retour 0,0233 $ — `claude-sonnet-4-6`)*. Et **l'écran de l'élève a montré le
  retour** : « TON RETOUR — reçu le 27 août à 11 h 42 », une **réussite** et un **point de travail**,
  chacun sous « **TU ÉCRIS** » avec sa citation, chacun avec son bouton « Je ne suis pas d'accord » ;
  plus « CE QUE TU AS À REPRENDRE », l'échéance de la version finale *(« avant le dimanche 30 août »)*
  et la validation « J'ai lu mon retour ». ⭐⭐ **`controlerRR3` rejoué sur ce retour RÉEL : 0 refus,
  0 alerte** — *« aucune citation n'attribue à l'élève une phrase de l'auteur »* : **VRAI, à l'écran.**
- [x] **C5L2-5 · Un retour de lecture relu par un humain — COCHÉ le 27/08 par Louis.** Il a lu les
  retours des examens diagnostiques : *« ils sont excellents »*. ⭐ **La mécanique était déjà passée**
  — quatre retours réels engendrés dans la journée, **aucun refus RR3**, et les citations du texte
  pertinentes quand elles apparaissent *(cf. `C5L2b-7`)*. **Ce qui manquait était le jugement d'un
  lecteur sur la QUALITÉ, et il est rendu.** ⚠️ La publication à l'élève reste un geste de Louis :
  en classe, `published_at` est sa case.

### ⚠️ Les renvois de périmètre — constatés, non réparés (la liste complète est au relevé, §7)

- **L'import écrit toujours `reference_id: null`** — `utils/fabrique/import-ecriture.ts:437`. Une
  instance de lecture **importée** naît sans référence sur l'instance. **Destinataire : C4-L8.**
- **Le non-spoiler ne s'applique à personne sur la voie du professeur** — `filtreDuNonSpoiler` est
  appelé par l'écran de conception avec une carte de positions **vide**. **Un élève en retard peut
  recevoir un texte au-delà de sa position.** ⛔ Relevé, **pas réparé** : la règle est au `01-` §4, et
  C5-L1 a refusé nommément de fabriquer une « position de classe ». **Question de source.**
- **La chaîne n'a aucune porte de MODE** : la traversée a mesuré `structure` en `expliquer` **par
  l'instrument de composition**. **Destinataire : `C5-L3`.**
- **Les six interrupteurs sont à ON en bac à sable ET EN PROD** *(constaté par requête le 27/08)*,
  quand le `07-` §5 les dit « à OFF jusqu'à la recette ». **Constat d'état, pour Louis.**
- `C4L3-16`, `C4L3-18` et `C4L3-19` **se rejouent à l'identique en lecture** ; `notionsDeLExercice`
  reste asymétrique *(elle ne lit que les notions des SUJETS — et un exercice de lecture n'a pas de
  sujet)*.

---

## C5 · L2-bis — Trois correctifs du retour, demandés par Louis le 27/08 (⚠️ **AUCUNE MIGRATION**)

> ⚠️ **CE N'EST PAS C5-L2.** Ces trois gestes sont nés d'une question de Louis en clôture de
> séance ; ils touchent le RETOUR, pas la passation de lecture. Ils sont consignés ici parce
> qu'ils partent dans le même push, et parce que le troisième répond à **trois copies bloquées
> en PROD**.

### 1 · Le contrôle des citations DE LA PROSE

**Le trou.** `controlerRR3` ne regardait que le champ structuré `ancrage.citation`. Or la **règle 1
du gabarit** fait écrire au modèle *« tu écris : "…" »* **DANS LE TEXTE du point** : une phrase de
l'auteur pouvait donc passer par la prose sans être vue. *Mesuré sur le retour réel du smoke : la
prose portait bien une citation de plus que l'ancrage.*

- [x] **C5L2b-1 · La forme naïve produit un faux positif, et c'est mesuré.** « Tout ce qui est entre
  guillemets est une citation » ramasse, sur le retour réel : *« Ce que Kant ajoute… »* (la copie ✓),
  *« ajoute »* (**une mention d'un mot**), et *« Mais cette définition ne dit pas encore qui en est
  responsable. »* — **une phrase que le MODÈLE INVENTE**, la réparation que la règle 4 lui commande
  de proposer, **qui n'est ni dans la copie ni dans le texte, et qui est parfaitement correcte**.
  ⛔ Un contrôle naïf **refuserait ce retour**, et l'élève le perdrait à cause d'une phrase juste.
  _(5 vecteurs, sur la prose RÉELLE, verbatim.)_
- [x] **C5L2b-2 · La forme étroite tient.** On ne retient qu'un passage cité **attribué à l'élève** —
  une formule d'attribution (*« tu écris »*, *« tu dis »*, *« ta phrase »*…) dans les 40 caractères
  qui précèdent le guillemet ouvrant. La réparation proposée sort ; « tu écris : « … » » entre. Même
  partage qu'à l'ancrage : la faute identifiée **refuse**, le reste **alerte**.

### 2 · Le rejeu automatique du retour refusé, et son garde-fou

**Le constat qui l'a rendu nécessaire, et il est en PROD.** Un retour refusé laisse un dépôt mesuré
**sans commentaire**, et le seul rattrapage était un geste humain qu'il fallait penser à faire.

> ⚠️⚠️ **RECTIFICATION DU 27/08, APRÈS TIR À BLANC — J'AI DIT « TROIS COPIES », IL Y EN A UNE.**
> J'avais lu le champ `dernier_message` d'un job comme s'il décrivait **l'état du dépôt**. Il décrit
> **le dernier passage de CE JOB-LÀ** : un `mesure_v1` qui a dit « retour non écrit » le garde pour
> toujours, **même quand un `retour_v1` a réussi vingt minutes plus tard**. ⭐ *Une trace n'est pas
> un état* — la même leçon que le retrait d'un exercice conçu, et je viens de la repayer.
> **L'état réel, vérifié par requête :** deux des trois copies ont bien leur retour *(écrit le 26/08
> à 19 h 23, par un rejeu manuel)* ; **une seule reste sans retour**, `b946541a`, déjà rejouée une
> fois en vain.
>
> ⭐⭐ **ET LE REFUS N'EST DONC PAS DÉTERMINISTE.** Les deux copies débloquées l'ont été **au second
> tirage**, sur la même copie et le même motif. *C'est la leçon déjà écrite ailleurs : « relancer
> d'abord, enquêter ensuite ».* **Le rejeu automatique va donc très probablement suffire** ; le
> garde-fou de la 3ᵉ tentative est là pour le cas où il ne suffit pas.
>
> ⚠️ **Et « non publié » n'est pas « manquant ».** Les 35 retours non publiés de la prod sont **tous
> en CLASSE**, où `published_at` **est la case que coche le professeur** — c'est le comportement
> voulu. **Aucun retour de MAISON n'est non publié.**

⭐ **Décision de Louis, 27/08** : *« après 3 retours refusés, on arrête et on accepte le retour tel
quel, mais le prof doit relire »*. ⚠️ **Et la règle 2 PEUT être insatisfaisable** : le gabarit exige
« une réussite **réelle** » — sur une copie très faible, il se peut qu'il n'y en ait pas.

- [x] **C5L2b-3 · Les deux familles de refus.** **FALSIFICATION** *(RR3, RR4, règle 6, compétence hors
  périmètre)* : jamais tolérée, à aucune tentative — publier ça fait lire à l'élève quelque chose de
  faux, ou lui montre la grille. **FORME** *(règle 2, règle 5)* : tolérée à la **dernière** tentative,
  parce qu'un retour maladroit vaut mieux que pas de retour. ⛔ **Un seul refus bloquant retient
  tout.** _(7 vecteurs ; le cas RÉEL de prod — une copie sans aucune réussite — en fait partie.)_
- [x] **C5L2b-4 · Le schéma ne se tolère JAMAIS.** Une sortie non conforme au schéma est refusée quelle
  que soit la tentative : c'est la défense 2 du `01-` §12, `appeler()` a déjà relancé, et le champ
  `points` pourrait ne même pas exister. _(Le partage est explicite dans le code, en deux temps.)_
- [x] **C5L2b-8 · ⭐ LE GESTE DE RATTRAPAGE — écrit, tiré à blanc sur la PROD, PAS JOUÉ.**
  `scripts/recette/rattraper-retours-refuses.mjs` : sans `--prod` il vise le bac à sable, sans
  `--joue` il ne fait que dire. ⛔ **Il ne lit pas le message d'un job comme un état** — c'est ce
  qui a corrigé mon compte — et **il distingue le `lieu`** : en classe, un retour rejoué **ne sera
  pas publié**, il ira au professeur. *Le garde-fou de la 3ᵉ tentative y est donc structurellement
  tenu ; à la maison, c'est le message « à relire » qui le porte.*
  ⭐⭐ **JOUÉ EN PROD LE 27/08, ET LA COPIE EST DÉBLOQUÉE.** Déploiement vérifié d'abord par une
  sonde : `/eleve/modules/aletheia/exercice/<faux>` rend **307** *(redirection vers `/login`)* comme
  la route de Codex, là où une route inexistante rend **404** — la route neuve est donc bien en
  ligne. Puis le geste : **remise en file, et le retour est écrit AU PREMIER TIRAGE** — **un seul
  appel**, 25 s, `11 → 12` lignes à `api_couts`. ⭐ Le retour porte **4 points et commence bien par
  une réussite** : *le refus de la règle 2 n'était pas déterministe, et la tolérance de la 3ᵉ
  tentative n'a même pas eu à servir.* ⛔ **`published_at` reste NULL** — c'est un exercice EN
  CLASSE : la case appartient au professeur. ✓ Tir à blanc final : **0 copie à rattraper**, et la
  file ne porte **aucune boucle** *(les trois jobs à `t=1`, `echec_definitif` faux)*.
- [x] **C5L2b-5 · ⭐⭐ LE GARDE-FOU, ÉPROUVÉ EN BASE** — `scripts/recette/rejeu-retour.mjs`,
  **12 vérifications, 0 échec, aucun appel de modèle, aucun coût**. Le compteur **monte** à chaque
  tour *(1 → 2 → 3)*, la remise en file **le préserve**, et au plafond **le rejeu s'arrête**.
  ⚠️⚠️ **Et la recette épingle le piège qui a failli me coûter une boucle infinie** :
  `relancerUnJob` **rend ses tentatives au job** — c'est voulu, c'est le geste de l'HUMAIN — et un
  rejeu automatique bâti dessus n'aurait **jamais** vu son compteur monter : sur un refus
  déterministe, **un appel brûlé par tour, à la minute, indéfiniment**. D'où `remettreEnFile`, le
  geste de la MACHINE, qui ne rend rien. *`file.ts` porte `import 'server-only'` : il est intestable
  sous `npm test` — cette mécanique ne pouvait s'éprouver qu'en base.*

### 3 · L'instruction d'ancrage sur le texte — conditionnée au texte support

- [x] **C5L2b-6 · Le bloc n'existe QUE s'il y a un texte support, et c'est toute sa sûreté.** Le
  corpus calibré au banc est celui de l'**écriture**, qui n'en a pas : il **ne voit pas un octet de
  plus**. ⛔ L'instruction **ne commente ni ne réécrit la règle 1** du gabarit *(§4, GELÉ)* — elle dit
  ce que chaque étiquette DÉSIGNE, ce qui est le propre de l'assemblage. _(2 vecteurs.)_
- [x] **C5L2b-7 · ⭐⭐⭐ MESURÉ LE 27/08 — L'INSTRUCTION MORD, ET LA QUESTION DE SOURCE TOMBE.**
  `scripts/recette/lecture-c5l2.mjs --mesure-ancrage 4`, **8 appels, 0,1717 $**, décor semé et retiré.
  ⭐ **Le décor est choisi pour INVITER la citation du texte** : la copie **contredit l'auteur** sur
  le point central — elle dit que la tutelle vient d'un manque d'intelligence, quand le texte dit
  *« non pas à une insuffisance de l'entendement, mais à une insuffisance de la résolution et du
  courage »*. *Si le modèle doit citer le texte un jour, c'est là.*

  | | avant l'instruction | après |
  |---|---|---|
  | tirages | 3 | 4 *(dont 1 sans retour)* |
  | points ancrés | 6 | 6 |
  | ⭐ sur `texte_support` | **0** | **3** |
  | tirages avec un point sur le texte | 0 / 3 | **3 / 3** *(des tirages qui ont produit un retour)* |
  | RR3 | 0 refus | **0 refus** |

  **Les trois citations du texte sont pertinentes**, et c'est ce qui compte : *« la cause tient non
  pas à une insuffisance de l'entendement… »* et *« On est soi-même responsable de cet état de
  tutelle quand… »* — **exactement ce que la copie contredisait**. ⭐⭐ **Le retour de lecture peut
  donc pointer ce que l'auteur dit et que l'élève a manqué** : c'était la seule chose que le lot ne
  savait pas faire.

> ⚠️ **UN FAUX POSITIF DE MON CONTRÔLE DE LA PROSE, RELEVÉ ET NON CORRIGÉ.** Un tirage a levé
> *« la prose attribue à l'élève une citation introuvable dans sa copie — « Kant appelle 'état de
> tutelle' le… » »*. **La citation EST dans la copie** : le modèle l'a re-citée avec des
> **apostrophes droites** là où la copie porte des **guillemets français**. `aplatir`
> (`utils/chaine/anti-injection.ts`) fait tomber `« » " " “ ”` mais **pas l'apostrophe droite
> employée comme guillemet**. ⛔ **Je ne l'ai pas corrigé, et c'est délibéré** : `aplatir` est
> l'outil PARTAGÉ du contrôle des citations — il sert P1 et la contestation —, et le toucher change
> un comportement calibré ailleurs. ⭐ **La conséquence est nulle pour l'élève** : c'est une ALERTE,
> jamais un refus. *1 alerte sur 6 points ; à surveiller, pas à réparer en passant.*


## C5 · L3 — Les mesures en réception : la porte de mode, les deux grilles qui existent, la tranche

**Clos le 27/08/2026.** Aucune migration, aucun interrupteur neuf, **aucune ligne au `SUIVI_SQL.md`**.
Relevé : `RELEVE_C5_L3_2026-08-27.md`.

> ⭐⭐ **CE QUE LE LOT A EMPÊCHÉ, ET ÇA SE COMPTE EN ÉLÈVES.** En **production**, un exercice
> `assigne` × `classe` à référence validée élit `argumentation: [expliquer]` et
> `structure: [expliquer]` — **les deux compétences sans instrument réceptif** — et porte **23 dépôts,
> dont 13 au statut `v1_remis`**, 0 squelette, 0 mesure. Les six interrupteurs sont à `ON`, et le geste
> qui déclenche tout est **un clic** (l'analyse en lot de la passation en classe). Le jour où la chaîne
> les traite, elle écrivait **vingt-six lettres calculées par l'instrument de COMPOSITION sur des
> copies de lecture**, les rangeait dans le signal de ciblage réceptif du routeur, et **rien ne le
> disait**. ⭐ **Ces 26 lettres ne peuvent plus s'écrire** : la chaîne refuse, et elle nomme le motif.

### Ce qui est PROUVÉ en séance — pour ne pas le rejouer

Tout ci-dessous est éprouvé par `scripts/recette/reception-c5l3.mjs` *(bac à sable, **37 verts, 0
rouge**)*, ou par les tests unitaires. **Le script se rejoue à la prochaine revue** :

```
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
     --import ./scripts/register-calibration-resolver.mjs \
     scripts/recette/reception-c5l3.mjs [--avec-chaine]
```

⛔ **Mode de retrait** : sans `--garde-le-decor`, le script retire tout ce qu'il a semé, y compris sur
interruption. Le décor se reconnaît à sa classe, `nom LIKE 'RECETTE-C5L3%'`. ⚠️ `--avec-chaine`
**paie 6 appels** (~56 s).

- [x] **C5L3-1 · LA PORTE DE MODE REFUSE, ET SON MOTIF EST SERVI.** Sur un dépôt réel de lecture qui
  élit quatre compétences, `competencesDeLExercice` écarte `argumentation × expliquer` et
  `structure × expliquer` avec un motif qui nomme **la compétence, le mode élu, et le fait que
  l'instrument ne le couvre pas**. *Preuve : section B du script ; `utils/chaine/instruments.test.ts`
  (9 vecteurs neufs).* ⭐ **Les quatre compétences sont `evaluee` ET ouvertes : seul LE MODE les
  sépare.**
- [x] **C5L3-2 · LA PREUVE PAR L'ÉCHEC — ZÉRO APPEL PAYÉ sur les compétences écartées.** `api_couts`
  porte **6 lignes** sur le dépôt : 3 `questionnement`, 3 `synthese`, **0 `argumentation`, 0
  `structure`**. *« Un appel dépensé sur une chaîne qui produirait des trous est un appel perdu. »*
  ⭐ Le nombre d'appels se lit **au nombre de lignes**, jamais à un compteur.
- [x] **C5L3-3 · LE « FAIT QUAND » — squelette, verdict ET LETTRE sur une copie de LECTURE.**
  `questionnement × expliquer` → **lettre E**, `modes: ["expliquer"]`, instrument 2.2 ;
  `synthese × restituer` → **lettre D**, `modes: ["restituer"]`, instrument 3.4. **Constaté en base**,
  après nettoyage du décor. ⚠️ *La clause « bancée en réception » a été levée par décision de Louis —
  le banc de réception n'existe pas.*
- [x] **C5L3-4 · AUCUNE MESURE FAUSSE N'ENTRE DANS LE SIGNAL DE CIBLAGE RÉCEPTIF.** Aucune ligne de
  `competences_mesures` ne porte `argumentation` ni `structure` sur ce dépôt — donc rien n'entre dans
  le groupe de modes réceptif du routeur (`01-` §3). *Et aucun squelette de composition n'a été écrit
  sur une copie de lecture.*
- [x] **C5L3-5 · UNE COMPÉTENCE ÉCARTÉE POUR CAUSE DE MODE N'ENTRE PAS DANS `competences_couvertes[]`.**
  *« Faute de quoi on ne saura jamais relire la mesure »* (`07-` §1.4). **Vérifié en base**, pas déduit.
- [x] **C5L3-6 · LA TRANCHE MORD SUR UNE VRAIE RÉFÉRENCE.** Sur la référence validée de Descartes
  (17 phrases, 4 moments), les **4 phrases dont `relance` est la seule fonction** (5, 11, 14, 16) sont
  écartées **EN SILENCE** pour la Synthèse — parce qu'une valeur *déclarée au `02-` que la règle ne
  lit pas* est **inerte, pas inconnue**. ⭐ La règle se **lit sur la fiche**
  (`bloc_machine.squelette.catalogue.fonctions_reference`), elle n'y est pas recopiée. ⛔ **Aucune
  unité n'est retirée** — la retirer ferait mentir les moments.
- [x] **C5L3-7 · LE QUESTIONNEMENT NE REÇOIT QUE CE QU'IL LIT.** Toutes les fonctions et tous les
  statuts d'unité lui sont retranchés ; **`armature.question_directrice` descend intacte**, et c'est
  son seul référent en réception. *`utils/chaine/tranche.test.ts` (9 vecteurs).*
- [x] **C5L3-8 · LA PORTE NE RETIRE RIEN À CE QUI MESURAIT DÉJÀ.** Contre-épreuve : les cinq
  compétences admises en `composer` y passent toutes, exactement comme avant le lot. *`npm test` :
  **1643 / 1643**, contre 1625 à l'ouverture.*
- [x] **C5L3-9 · `C4L10Q-15` EST LEVÉ ET COCHÉ** — voir son entrée, plus haut dans ce fichier.
- [x] **C5L3-10 · LA COUTURE AVEC `C4-L5`, ÉPROUVÉE PAR EXÉCUTION** *(convention du
  `PLAN_DE_CHANTIER.md` §5)*. *« La chaîne sait-elle servir un instrument RÉCEPTIF de bout en bout,
  sur un dépôt réel, et écrire sa mesure ? »* — **oui**, quatre coutures nommées et traversées
  (`modes_par_competence` · `reference_id → contenu` · `exercices_squelettes` ·
  `competences_mesures.modes`). Latence **56,4 s < 180 s**.

- [x] **C5L3-18 · ⭐⭐ QUAND LA PORTE ÉCARTE TOUT, LA CHAÎNE DÉGRADE PROPREMENT.** *Le cas n'est pas
  théorique : `473b2c25` en bac à sable n'élit QUE `argumentation:[expliquer]` et
  `structure:[expliquer]`.* Éprouvé sur un dépôt réel *(section D-bis du script)* : **0 compétence
  passe**, la chaîne **ne lève pas**, **0 ligne d'`api_couts` sur tout le dépôt**, 0 mesure, et elle
  **le dit** — *« aucun squelette : aucune compétence n'est entrée dans la chaîne — pas de retour
  engendré (clause granulaire) »*. ⭐ **L'écran ne demande la confiance de l'élève sur RIEN**, ce qui
  est juste. ⭐⭐ **Et sur CE chemin-là le professeur VOIT le motif** : sans retour, l'état est
  `sans_retour`, qui sert `motif` — les deux compétences écartées sont nommées. *C'est le cas MIXTE
  (celui de la prod) qui se tait — voir `C5L3-11-bis`.*

- [x] **C5L3-19 · ⭐⭐ LA PORTE TIENT EN `vf`, ÉPROUVÉE LE 27/08.** *Je ne l'avais éprouvée qu'en
  `v1`.* En `vf` la chaîne ne rejoue que la cible (`01-` §11), et `cibleDuRetour` lit `mesurees` — qui
  exclut déjà les écartées. **Constaté** *(section D-ter)* : cible = `questionnement` **jamais une
  écartée** · la porte tourne aussi en `vf` (**2 écartées**) · **1** seule compétence rejouée ·
  **0 mesure de plus** écrite *(`07-` §1.2)* · **0 appel payé sur les écartées, `vf` comprise**.
  ⚠️ `delta_v1_vf` sort **NULL** avec son alerte nommée — dette assumée du `07-` §2 v2.41
  *(registre des ouverts, item 47)*, **pas un défaut de ce lot**.

### Ce qui RESTE à jouer — avec sa condition de reprise

- [x] **C5L3-11 · ⭐⭐ LE SMOKE PROF, JOUÉ LE 27/08 — ET IL A TROUVÉ QUE MON MOTIF N'ALLAIT NULLE PART.**
  *Joué sur session prof authentifiée, bac à sable, `/prof/aletheia/passation/<exerciceId>`.*
  ⛔ **Le défaut trouvé** : `competencesDeLExercice` porte depuis toujours la note *« ce motif-là est
  SERVI : le bilan d'un dépôt l'affiche »* — **c'était FAUX**. `competencesEcartees` ne vivait que dans
  la valeur de retour **EN MÉMOIRE** de `traiterDepot` ; les deux seuls résumés qui persistent
  (`resume()` de `utils/deroule/mesure.ts` et `resumeBilan()` de `utils/chaine/chaine.ts`) ne le
  mentionnaient pas, et `exercices_jobs.dernier_message` est le seul canal durable.
  **La porte refusait juste, et EN SILENCE.** ⭐ **Corrigé** (`motifDesEcartees()`), et **éprouvé en
  base par la file réelle** — pas par un appel direct : *« 2 écartée(s) — structure, argumentation :
  mode « expliquer » non couvert par l'instrument de structure… »* dans `dernier_message`.
  ⚠️ **Leçon de recette** : la première version du script appelait `traiterDepot` **en direct** et
  court-circuitait donc la file — *une recette qui court-circuite le chemin de production ne prouve pas
  le chemin de production.* Le script passe désormais par `mettreEnFile` + `reclamerJobs` + `tourDeFile`.
- [x] **C5L3-11-bis · ✅ LEVÉE PAR `C5-L4` LE 27/08 — L'ÉCRAN MONTRE LE MOTIF QUAND TOUT VA BIEN.**
  ~~`etatChaineDeLaCopie()` ne sert `motif` que sur `echec` et `sans_retour` ; sur `abouti` il rend
  `motif: null`.~~ **La branche `if (c.aUnRetour)` sert désormais son motif** quand la porte de mode
  a écarté des compétences *(`utils/passation/file-copie.ts`)*, et `TraitementDeLaCopie` ne rend plus
  `null` que sur **`abouti` SANS motif** *(`components/passation/EcranProf.tsx`)*.
  ⭐ **FORME CHOISIE : l'état `abouti` porte son motif — PAS un sixième compteur.** Motif du choix :
  les six comptes de « LA FILE » sont **disjoints et couvrent tout** *(leur somme vaut le nombre de
  copies, un test l'assère)*, et *« aboutie avec écartées » n'est pas un septième état — c'est la
  MÊME aboutie qui a quelque chose à dire*. Un test neuf tient ce choix avec son motif.
  ⭐⭐ **PREUVE SUR LA PRODUCTION, PAS SUR UNE FIXTURE** *(le bac à sable n'a que le cas « tout
  écarté », qui servait déjà son motif)* : `scripts/recette/couture-c5l4.mjs` section E lit les
  **13 jobs de PROD** en lecture seule, reconstitue ce que l'écran reçoit *(jobs + retour + copie)*
  et constate **13/13 `abouti` qui servent leur motif, 0 qui se taisent**.
  ⛔ **La clé reste `abouti`, la phrase reste « Traitement terminé. », `relancable` reste `false`** —
  *une trace n'est pas un état* : on LIT `dernier_message` pour l'AFFICHER, on n'en DÉDUIT rien.
  ⛔ **Le silence reste la règle sans écartées** *(un bandeau « tout va bien » ferait du bruit)*, et
  le chemin `sans_retour` n'a pas bougé. ⚠️ **CODEX EN PROFITE AUSSI** — l'écran est partagé.
  ⚠️ **Reste à VOIR à l'écran** : `C5L4-D` ci-dessous.
- [x] **C5L3-11-ter · ✅ LE SMOKE PROF SUR LA PROD, JOUÉ LE 27/08 — LA PORTE TIENT SUR 13 COPIES
  RÉELLES.** 26 mesures (**2 par copie** : `expression×composer` et `synthese×restituer`, avec leurs
  lettres) · **0 mesure** et **0 appel payé** sur `argumentation`/`structure` · **13/13** jobs dont
  `dernier_message` nomme les deux écartées avec le motif entier · 13 retours engendrés (non publiés) ·
  ancrage **15 % au texte support** (8/54). ⭐ **Effet de bord bienvenu** : `cible_primaire` étant
  `NULL`, le repli alphabétique élisait **`argumentation`** — celle sans instrument réceptif (piège 13) ;
  il élit désormais **l'Expression**.
- [x] **C5L3-20 · ✅ LES HUIT LIGNES DE PROD SONT RÉPARÉES, le 27/08, sur mandat explicite de Louis.**
  `competences_couvertes` passe de `["synthese","structure","expression","argumentation"]` à
  **`["synthese","expression"]`** sur les 8 ; `observables.confiance_de_remise` est ramené à ses deux
  compétences réelles sur ses **trois** volets — `niveaux`, `confiances` et `par_competence` *(4 → 2
  entrées, les deux `indetermine` « l'instrument n'a rendu aucun niveau » disparaissent)*.
  ⭐ **Le script ne devine rien** : il lit les mesures RÉELLEMENT écrites dans `competences_mesures`
  et retranche ce qui n'y figure pas — *la base fait foi contre elle-même*. **Idempotent** (seconde
  passe : « 0 à réparer, 8 déjà conformes »), sauvegarde avant écriture hors du dépôt.
  ⛔ **`monitoring_niveaux` n'était PAS concernée** : son `n` compte les LIGNES de monitoring, pas les
  compétences — vérifié avant d'écrire. ⭐ Script laissé au dépôt :
  `scripts/recette/reparer-competences-couvertes.mjs`. ⚠️ *Il ne devrait plus jamais rien trouver ;
  s'il trouve quelque chose après le 27/08, c'est que le correctif a régressé.*
  ~~⛔⛔ HUIT LIGNES DE `monitoring_mesures` EN PROD PORTENT LES DEUX ÉCARTÉES.~~ Écrites **avant** le correctif du 27/08 : elles listent quatre
  compétences quand **deux** ont compté, avec un `niveau` à `null` pour les deux autres. ⭐ **Le code
  est corrigé** *(`competencesQuiComptent()` écarte ce que la chaîne n'a pas mesuré)* — **les lignes
  déjà écrites, non.** ⛔ **Réparer demande une écriture sur des données de prod : décision de Louis.**
  *Rien d'aval ne les lit encore : la table de conversion n'est pas écrite, et le principe est
  « collecter d'abord, convertir ensuite ».* **Condition de reprise : décision de Louis.**
- [ ] **C5L3-11-quater · ⛔ ANCIENNE FORMULATION — le smoke prod avant qu'il soit joué.** Le smoke ci-dessus est en bac à
  sable. **L'exercice qui attend en prod porte 13 dépôts remis**, et le code de la porte **n'y est pas
  encore déployé**. **Condition de reprise : pousser le lot**, puis déclencher l'analyse en lot et
  relire la file. *⚠️ Ce geste PAIE — 13 dépôts × 2 compétences mesurables.*
- [x] **C5L3-12 · ✅ RR4 COMPTÉ LE 27/08 — 0 refus sur 10 tours en RÉCEPTION** *(13 traversées en
  tout, à copie différente à chaque tour)*. `C4L10Q-16` en observait un *« une fois sur deux tours »*
  en **composition** ; en réception, **zéro**. ⭐ *Explication plausible, non tranchée : le retour de
  lecture parle du texte et de la question directrice, pas du « recadrage » ni de l'« enjeu » — le
  vocabulaire qui déclenche RR4 est celui de la problématisation.* ⛔ **`C4L10Q-16` RESTE OUVERT** : 10
  tours en réception ne disent rien de la composition, où le défaut a été vu.
  ⚠️⚠️ **MAIS TROIS RETOURS ONT ÉTÉ REFUSÉS POUR UNE AUTRE RAISON** — *« `points[1].ancrage.citation`
  texte trop court (0 < 1) »*, une **citation VIDE**, donc un refus de **forme**. ⭐ **Et ma première
  instrumentation ne l'a pas vu, parce qu'elle ne comptait que RR4** : deux refus sur cinq sont passés
  sans motif. *Compter les refus d'UNE règle fait manquer ceux de toutes les autres.* Le script imprime
  désormais le motif de tout refus. **Reste à savoir si ce refus de forme a une fréquence** — condition
  de reprise : `--tours` sur plus de tours, et regarder les motifs.
  ~~⚠️ RR4 N'A PAS REFUSÉ À CE TIRAGE, ET LE COMPTE EST DE 1 SUR 1.~~ `C4L10Q-16`
  observait un refus *« une fois sur deux tours »* quand le retour emploie « recadrage » ou « enjeu ».
  La traversée de réception **n'a pas été refusée** — le retour a été écrit et publié. ⛔ **Un tirage
  ne fait pas une fréquence** : `C4L10Q-16` reste ouvert, et le compte demande des tours.
  **Condition de reprise : rejouer le script `--avec-chaine` plusieurs fois et compter.**
- [x] **C5L3-13 · ✅ L'ANCRAGE COMPTÉ LE 27/08 — 32 % AU TEXTE SUPPORT, sur 13 traversées.**
  **15 points « copie » et 7 points « texte_support » sur 22.** *C5-L2 mesurait **0 sur 4** en
  composition.* ⭐⭐ **Le canal `texte_support` n'est donc PAS mort** : `ancrage.source` cessait d'être
  « un enum à deux valeurs dont une seule est employée » **dès qu'on mesure en réception**.
  ⚠️ **Très variable** : deux séries de cinq tours ont donné **17 %** puis **40 %**.
  ⛔ **La décision reste de source, et le §4 est GELÉ** — j'apporte le compte, je ne tranche pas.
  **Condition de reprise : décision de Louis, sur ce compte.**
  ~~⭐ LA DONNÉE QUE LA QUESTION DE SOURCE DE `C5-L2` ATTEND — premier point.~~ Sur la
  première traversée d'un retour de **RÉCEPTION**, l'ancrage s'est réparti **1 point « copie », 1 point
  « texte_support »** sur 2. ⭐ **C'est la première fois que le canal `texte_support` est employé** :
  C5-L2 mesurait quatre points sur quatre ancrés sur la copie. ⚠️ **Un tirage ne tranche pas une
  question de source** — la règle 1 du gabarit (§4, **GELÉ**) fait ancrer « sur une citation du
  squelette », et le squelette est fait de la copie. **Condition de reprise : accumuler des tirages de
  RÉCEPTION, et porter le compte à Louis.** *La décision est de source, et le §4 est gelé.*
- [ ] **C5L3-14 · ⛔ LES DEUX INSTRUMENTS RÉCEPTIFS ABSENTS — Argumentation et Structure.**
  *« Aucune session ne construit un instrument manquant. »* Leur grille vit **en prose** à leur fiche
  §3 : ni marqueur de prompt réceptif, ni enum au volet `squelette.catalogue`, ni cascade active — et
  leur cascade réceptive lit des champs que leur P1 de composition ne produit pas. **Ce que ça coûte
  aujourd'hui** : `argumentation × expliquer`, `argumentation × évaluer` et `structure × expliquer`
  sont **admis et non mesurables**. **Condition de reprise : le banc lecture valide l'étape de notation
  réceptive de la fiche** → la fiche reçoit ses enums → `modesCouverts` passe de `['composer']` à sa
  liste complète, à `utils/chaine/branchements/{argumentation,structure}.ts`.
- [ ] **C5L3-15 · ⛔ LE BANC DE CALIBRATION LECTURE N'EXISTE PAS.** `03-` §7 : *« Protocole du banc de
  réception : **reste à écrire** »*, et `copies-tests/lecture/` est **à créer** *(vérifié : absent)*.
  ⚠️ **C'est la clause du « fait quand » que Louis a levée le 27/08** pour ne pas bloquer le lot ; elle
  ne se lève qu'une fois. **Condition de reprise : une séance de conception.**
- [ ] **C5L3-16 · ⚠️ LE QUESTIONNEMENT EST `evaluee` SANS SON BANC, DANS LES DEUX BASES.** Le `03-` §9
  lui impose, **à lui seul**, quatre lots de banc — deux en `composer`, deux en modes réceptifs —
  avant cette bascule. Il est à `evaluee` depuis le 23/08. *« Une contrainte de protocole n'est
  appliquée par aucun code. »* ⛔ **Relevé, pas réparé : le statut appartient au professeur.**
  **Condition de reprise : décision de Louis.**
- [ ] **C5L3-17 · ⚠️ `competences_statut_recette` — SEPT lignes en bac à sable, CINQ en prod.**
  `connaissance` et `monitoring` **n'ont pas de ligne du tout** en production. *« Pas de ligne » n'est
  pas « pas d'objet »* — c'est la leçon exacte du déménagement du statut de recette. ⛔ **Relevé, pas
  réparé : c'est une donnée, pas un défaut de code.** **Condition de reprise : l'écran de la fabrique
  (C4-L8), où le professeur pose le statut.**


## C5 · L4 — Les onglets de la lecture (⚠️ **AUCUNE MIGRATION** — aucune n'était attendue, aucune n'a été nécessaire)

> **Séance du 27/08.** `npx tsc --noEmit` vert · `npm test` **1673 / 1673, 0 échec** *(le seul rouge
> — antérieur au lot — a été levé en fin de séance sur décision de Louis : `derive-instruments.py
> --ecris` rejoué pour reprendre la version 2.59 du `07-` ; voir `C5L4-0`)* · `npx eslint` **0 erreur**.
> ⭐⭐ **LES DEUX SMOKES ONT ÉTÉ JOUÉS À L'ÉCRAN LE 27/08**, dans des sessions que Louis a ouvertes —
> **professeur** puis **élève**. ⭐ **SEPT RESTES SUR HUIT SONT LEVÉS** : `C5L4-0`, `A`, `B`, `C`,
> `D`, `E`, `E-bis`, `F`, `F-bis`, `F-ter` et `G`. **Il ne reste que `C5L4-H`** — le déménagement de
> `app/prof/conception/`, que Louis a reporté.
> ⚠️⚠️ **ET LE LOT EST POUSSÉ, DONC DÉPLOYÉ EN VRAIE PRODUCTION** — `57fa854..7300624`, 6 commits,
> 25 fichiers, le 27/08. **Les six interrupteurs étant à ON, les onglets sont pleins immédiatement**,
> et **les 13 copies de production disent désormais leurs compétences écartées**.
> Relevé : `RELEVE_C5_L4_2026-08-27.md`.
> ⛔ **Aucun interrupteur posé, allumé ni éteint. Aucune migration. Aucune dette.**

### Prouvé en séance

- [x] **C5L4-1 · ⭐ LES TROIS ONGLETS DU PROFESSEUR — Livres · Exercices · Paramètres.**
  `components/nav/configModules.ts`. **L'onglet qui garde la RACINE vient en tête** *(décision de
  Louis, 27/08)* : `/prof/aletheia` reste la cible de « Modules → Aletheia », de ses propres tuiles
  `?classe=<id>` et de six des dix `revalidatePath`. **« Classe » a disparu de la barre**, et l'écran
  nomme désormais ce qu'il montre *(« Les livres, classe par classe »)*. **L'onglet Exercices est une
  route NEUVE** ; `passation` et `examen-diagnostique` y sont rattachés par `prefixes[]`.
- [x] **C5L4-2 · ⭐ LES TROIS ONGLETS DE L'ÉLÈVE — Livres · Exercices · Examens.** Même règle, même
  ordre. ⛔ Pas de « Paramètres » côté élève, pas de quatrième onglet « Diagnostic » — la trajectoire
  E→A vit **sous Livres**, avec ce qu'elle décrit *(`AGENTS.md` : « un module = 2-3 onglets »)*.
- [x] **C5L4-3 · ⚠️⚠️ LE PIÈGE DU SEGMENT DYNAMIQUE À LA RACINE, LEVÉ AU NAVIGATEUR.**
  `app/eleve/modules/aletheia/[livreId]/` est au même niveau que mes deux dossiers neufs. **Sondes au
  serveur de dev** : `/eleve/modules/aletheia/exercices` et `…/examens` rendent **307** *(elles
  existent)*, `…/exercice/abc` et `…/uuid-x/3` rendent **307** *(intactes)*, et
  `…/nexistepas` rend **404** — ⭐ **rien ne l'avale**, il n'y a pas de `[livreId]/page.tsx`. Côté
  prof, `/prof/aletheia/exercices` **307** et `/prof/aletheia/nexistepas` **404**.
- [x] **C5L4-4 · ⭐ UNE SÉANCE DE LECTURE ALLUME BIEN « LIVRES ».** `/eleve/modules/aletheia/<uuid>/<n>`
  et `…/<uuid>/capstone` : **aucun préfixe statique ne peut décrire un UUID**, seule la racine les
  sert. *C'est ce qui rend l'ordre de Louis techniquement le plus sûr.* Tenu par un test nommé.
- [x] **C5L4-5 · ⚠️ SINGULIER / PLURIEL À UN CARACTÈRE PRÈS.** `…/aletheia/exercice/<id>` *(le
  déroulé de C5-L2, **il ne bouge pas**)* et `…/aletheia/exercices` *(l'onglet)*. `ongletActifParRoute`
  les sépare *(le caractère qui suit `…/exercice` est `s`, pas `/`)* — **un test l'assère dans les
  deux sens**, et vérifie que le pluriel ne tombe pas sur la racine par accident. Le commentaire est
  à trois endroits : la config, `regles.ts`, la page du déroulé.
- [x] **C5L4-6 · ⭐ LES TROIS ROUTES SANS PORTE SONT FERMÉES.**
  `app/prof/aletheia/passation/[exerciceId]` *(un seul lien dans tout le dépôt)*,
  `app/prof/aletheia/examen-diagnostique/[planifieId]` *(atteignable uniquement par un encart en tête
  de la racine)* et `app/eleve/modules/aletheia/passation/[depotId]` *(un signal noyé sous les
  livres)*. **Les treize routes du module ont chacune leur clic depuis un onglet** — l'inventaire
  AVANT / APRÈS est au §1 du relevé, et le script de couture le vérifie **par exécution**.
- [x] **C5L4-7 · ⭐⭐ LA LISTE DES PASSATIONS EST PARAMÉTRÉE, JAMAIS DUPLIQUÉE.**
  `passationsDeClasseCodex(admin)` → `passationsDeClasse(admin, atelier = 'codex')` ; le `href` suit
  par `hrefDeLaPassationProf(atelier, id)`, le pendant de `hrefDuDeroule`. *« Deux ateliers, deux
  portes, un seul prédicat. »* ⛔ Aucun second exemplaire.
- [x] **C5L4-8 · ⭐⭐ L'ORDRE LIGNE-DE-PLAN-PUIS-MODE, PROUVÉ PAR CONTRE-ÉPREUVE.** Le décor sème une
  passation qui **porte `composer`** et dont la **ligne de plan dit `lecture`** — c'est l'explication
  de texte. Constaté : elle **n'apparaît PAS** chez Codex, ni dans la liste ni dans les signaux, et
  elle apparaît chez Aletheia. **Si quelqu'un inverse les deux règles, ce décor le fait tomber.**
- [x] **C5L4-9 · ⛔⛔ LES QUATRE GARDES DU MODULE SE REJOUENT SUR LES TROIS ONGLETS.**
  `contexteAletheia` est **réutilisée, pas dupliquée** : ses quatre sorties anticipées vivent
  désormais dans `app/eleve/modules/aletheia/gardes.tsx`, que les trois onglets appellent. *« Un
  onglet qu'on clique doit dire POURQUOI il refuse, jamais rendre une page vide. »* `CarteMessage` a
  été extraite dans son fichier, avec `avecRetour` intact.
- [x] **C5L4-10 · ⭐ LE VIDE DE L'ONGLET EXERCICES A CHANGÉ DE FORME, ET C'EST VOULU.** Sur la racine,
  le bloc ne s'affichait **que s'il y avait quelque chose** *(la page porte d'abord des livres)*.
  **Sous un onglet dédié, on vient de cliquer exprès : il doit dire quelque chose** — et les deux
  vides sont **distingués** *(« pas encore ouverts » ≠ « aucun exercice pour le moment »)*.
- [x] **C5L4-11 · ⭐⭐ LA COPIE `abouti` DIT SES ÉCARTÉES — PROUVÉ SUR LA PRODUCTION.** Voir
  `C5L3-11-bis`, levée. **13/13 des copies de prod servent leur motif ; 0 se taisent.**
- [x] **C5L4-12 · ⭐⭐ LA COUTURE, ÉPROUVÉE PAR EXÉCUTION — 41 verts, 0 rouge.**
  `scripts/recette/couture-c5l4.mjs`, avec son `--retire` et son `--garde-le-decor`. **Cinq coutures
  nommées** *(qui écrit · qui lit · quel chemin réel y mène)*, et pour chaque `href` **rendu par une
  lecture** — jamais tapé — **deux vérifications que rien d'autre ne fait ensemble** : que la ROUTE
  SERT *(`chargerVueProf` / `chargerVueEleve` / `chargerConception` / `lireDepotMaison`)* et que
  l'ONGLET S'ALLUME *(`ongletActifParRoute` sur la config réelle)*. ⛔ **Aucun appel de modèle payé.**
  Décor semé et retiré, **idempotent sur deux tours**, six interrupteurs identiques avant / après.
- [x] **C5L4-13 · ⚠️ LES TROIS `<main>` IMBRIQUÉS D'ALETHEIA SONT CORRIGÉS.**
  `app/eleve/modules/aletheia/passation/[depotId]`, `app/prof/aletheia/passation/[exerciceId]`,
  `app/prof/aletheia/examen-diagnostique/[planifieId]` : `<main>` → `<div>`, **classes inchangées**.
  *La coquille du rôle rend déjà un `<main>` : deux repères « principal » s'entendent au lecteur
  d'écran.* ⚠️ **Les trois jumelles de CODEX portent encore le défaut** — hors périmètre, nommées au
  §6.2 du relevé.
- [x] **C5L4-14 · ⭐ LA BARRE MOBILE À 375 px, MESURÉE.** Markup réel de `SousNavModuleMobile`,
  police réelle *(Alegreya Sans)*, couleurs réelles d'Aletheia : **64 + 81 + 81 px**, `scrollWidth`
  = `clientWidth` = 375 → **aucun débordement**, et **44 px de haut les trois** *(la cible tactile
  que le composant impose)*. ⚠️ *Mesuré dans le navigateur, hors session authentifiée — la page
  vivante va en `C5L4-B`.*
- [x] **C5L4-15 · ⛔ CE QUI N'A PAS BOUGÉ, ET C'EST LA MOITIÉ DE LA RÉUSSITE.**
  `utils/deroule/`, `utils/chaine/`, `utils/examens/`, `utils/generateur/` et **tout le chemin du
  livre** sortent du lot **inchangés** *(`git diff --stat` par dossier)*. Aucun onglet de Codex n'a
  bougé *(un test l'assère : libellés ET les quatre listes de préfixes)*. `app/prof/conception/`
  **n'a pas déménagé** — un renvoi, décision de Louis. Le sélecteur `classesAvecModule` est intact ;
  les deux écrans de paramètres qui écrivent dans `aletheia_params` **n'ont pas été réunis**.
- [x] **C5L4-16 · ⚠️ LES SCRIPTS QUI TRAVERSENT ALETHEIA, REJOUÉS.** `lecture-c5l2` **38/0** ·
  `generateur-c5l1` **27/0** · `passation-c4l4` **56/1** *(le rouge est la **latence connue**,
  22,8 s, déjà relevée le 22/08 — sans rapport)* · `reception-c5l3` **26/1** *(le rouge —
  `la vf N'A ÉCRIT AUCUNE MESURE de plus` — ne peut pas venir d'ici : `git diff utils/chaine/` est
  **vide** et ce script n'importe **aucun** de mes fichiers ; le tour porte un `RR4` refusé, et **le
  refus n'est pas déterministe** — relancer d'abord)*. **Coût des rejeux payants : 108 appels,
  1,66 USD**, bac à sable.

### Reste à jouer en recette

- [x] **C5L4-0 · ✅ `npm test` EST VERT — 1673 / 1673, LE 27/08, SUR DÉCISION DE LOUIS EN FIN DE
  SÉANCE.** `utils/chaine/instruments.test.ts:207` disait *« les dérivés ont divergé de leurs
  sources »*. **Le rouge était né AVANT le lot** — la complétion de l'entrée `C5-L4` au `07-` §2, en
  séance de fabrication du prompt, avait porté le `07-` de **2.57 à 2.58** — **et il avait bougé AVEC
  lui** : les deux amendements aux sections ouvertes l'ont porté en **2.59**. ⛔ **La session ne l'a
  pas tranché** : le prompt écrit *« Ne joue pas `derive-instruments.py --ecris` »* **et** exige par
  ailleurs un test vert avant d'écrire — inconciliable. **Elle a caractérisé l'écart sans rien
  écrire, et posé la question.** ⭐ **Louis a dit de rejouer, et `--ecris` a été joué.**
  ⭐⭐ **CE QUI A CHANGÉ SUR DISQUE — EXACTEMENT LES QUATRE VALEURS ANNONCÉES, ET RIEN D'AUTRE** :
  `version`/`empreinte` du `07-` dans `MANIFESTE.ts`, `version_source`/`empreinte_source` dans
  `calame-retour.ts` — `2.57` → `2.59`, `b078bae…` → `fbecf94…`. **Les HUIT autres dérivés ont été
  réécrits À L'IDENTIQUE** *(`git status` ne les voit pas)*, le **gabarit Calame est inchangé à
  l'octet** *(3347 caractères)*, et **les six compétences gardent leur version et leur compte
  d'observables** *(expression v3.2/9 · argumentation v4.3/9 · structure v3.3/8 · connaissance v2.2/8
  · synthese v3.4/13 · questionnement v2.2/9)*. `--verifie` rend désormais **`INSTRUMENTS :
  IDENTIQUE (10 fichier(s))`**. ⭐ **La leçon, pour le prochain lot qui amende le `07-`** : *amender
  une section ouverte du `07-` fait mécaniquement diverger les dérivés — le geste de clôture est de
  rejouer `derive-instruments.py --ecris`, et il ne touche que la métadonnée de version.*
- [x] **C5L4-A · ✅ LE SMOKE PROF, JOUÉ À L'ÉCRAN LE 27/08, dans une session que Louis a ouverte.**
  **Barre 2 desktop ET barre mobile** rendues toutes les deux — la mobile d'abord *(le pane était
  étroit)*, ce qui éprouve `SousNavModuleMobile` **en vrai**, et pas seulement la mesure de
  `C5L4-14`. **Les allumages, relevés par `aria-current="page"` sur la config réelle :**
  `/prof/aletheia` → **Livres** · `/prof/aletheia/eleve/<id>` → **Livres** *(sans préfixe déclaré :
  l'onglet racine l'attrape, comme prévu)* · `/prof/aletheia/exercices` → **Exercices** ·
  `/prof/aletheia/passation/<id>` → **Exercices** · `/prof/aletheia/examen-diagnostique/<id>` →
  **Exercices** *(titre servi : « Examen diagnostique — l'explication de texte »)* ·
  `/prof/aletheia/parametres` → **Paramètres**. ⭐ **L'onglet Exercices porte bien ses TROIS renvois**
  *(`/prof/conception/nouvelle?porte=aletheia`, `/prof/conception/textes`, `/prof/conception`)* **et
  sa liste : « PASSATIONS EN CLASSE · 4 »**. ⭐⭐ **DEUX de ces quatre sont de VRAIES passations de
  lecture du bac à sable** — « Examen diagnostique — l'explication de texte », pour T5 et pour Test —
  **qui n'avaient jusqu'ici qu'UNE SEULE porte dans tout le dépôt** : c'est le 🔴 du piège 21,
  constaté en vrai et fermé. ⚠️ **L'encart des examens à concevoir est ABSENT en bac à sable**, et
  c'est juste : ses deux lignes `lecture` y sont `concu`, pas `a_concevoir` — *une page nue n'est pas
  la preuve qu'il est cassé*. **En PRODUCTION, la même capture montre l'encart avec ses DEUX lignes**
  *(T5, 12 oct. et 4 janv.)*, sous l'ancienne barre « Classe · Paramètres » : c'est l'état AVANT,
  photographié.
- [x] **C5L4-B · ✅ LE SMOKE ÉLÈVE, JOUÉ À L'ÉCRAN LE 27/08** *(session ouverte par Louis, élève
  **Elo**, classe **Test**)*. **Les six allumages, relevés par `aria-current="page"` :**
  `/eleve/modules/aletheia` → **Livres** · `…/<livreId>/2` → **Livres** ⭐⭐ *(le piège 18 levé EN
  PAGE VIVANTE : aucun préfixe statique ne décrit un UUID, seule la racine la sert)* ·
  `…/exercices` → **Exercices** · `…/exercice/<depotId>` → **Exercices** ⭐⭐ *(le piège du
  singulier / pluriel tenu en page vivante : le déroulé de C5-L2 allume l'onglet, PAS la racine)* ·
  `…/examens` → **Examens** · `…/passation/<depotId>` → **Examens**.
  ⭐ **UN SEUL « ← Retour » PAR ÉCRAN**, compté au DOM sur les cinq écrans qui en portent un
  *(`nbRetours: 1` partout)* : le défaut trouvé par le smoke du 27/08 ne s'est pas rouvert en
  déménageant les blocs. ⭐ **`<main>` unique** sur `…/exercice/<id>` et `…/passation/<id>`
  *(`mains: 1`)* — le correctif tient côté élève aussi.
  ⭐⭐ **CE QUE L'ONGLET EXAMENS A RÉVÉLÉ** : il sert **DEUX passations en classe réellement
  OUVERTES** pour cet élève — *« Passation en classe ouverte — Examen diagnostique — l'explication
  de texte »*. **Elles n'étaient atteignables que par le signal noyé sur la racine, sous les
  livres.** C'est le 🔴 du piège 23, constaté sur des données réelles et fermé.
  ⭐ **La barre MOBILE à 375 px, en page vivante** : `Livres 63 · Exercices 82 · Examens 81` px,
  **44 px de haut les trois**, `scrollWidth = clientWidth = 375` → **aucun débordement**. *La mesure
  isolée de `C5L4-14` (64/81/81) est confirmée à un pixel près.*
- [x] **C5L4-C · ✅⭐ LES DEUX VIDES, VUS ET DISTINCTS — LE 27/08, sur autorisation explicite de
  Louis.** `exercices_actif` a été **éteint puis remis** en bac à sable *(et NULLEMENT en prod,
  revérifiée après coup)*, **par l'écrivain du lot** `poserExercicesActifs`, jamais par un `update`
  écrit pour l'occasion. **Les TROIS états de l'onglet, vus à l'écran :**

  | La porte | Ce que l'onglet dit |
  |---|---|
  | **ON**, aucun exercice | *« Aucun exercice de lecture pour le moment. Ceux que ton professeur te donne apparaîtront ici. »* |
  | **ON**, un exercice | la ligne, avec son état *(« à faire », puis « commencé »)* |
  | **OFF** | *« Les exercices de lecture ne sont pas encore ouverts. Ton professeur t'indiquera quand ils commencent. »* |

  ⭐⭐ **ET LE LIEN DISPARAÎT ALORS QUE LE DÉPÔT EXISTE** *(relevé au DOM : `liens: []`)* : la porte
  ferme **la liste**, pas l'onglet — *un lien qui mènerait à une page fermée est un lien qui promet
  une porte close*. ⭐ **Les trois onglets restent affichés** dans les trois cas : *« un vide
  expliqué, jamais un onglet qui clignote »*, vérifié plutôt que supposé.
  ⭐ **C'est la règle du §5 du `07-` prise en flagrant délit d'être JUSTE** : sur la racine, ce bloc
  se cachait *(C5-L2)* ; sous un onglet dédié, il parle — et il dit **deux choses différentes**.
  ⚠️ **Les six interrupteurs ont été relus après coup, des deux côtés : identiques.**
- [x] **C5L4-D · ✅⭐⭐ LE MOTIF VU À L'ŒIL LE 27/08 — ET SON TÉMOIN MUET À CÔTÉ.** C'est là que
  C5-L3 avait constaté le silence, et c'est là qu'il parle. ⚠️ **Le bac à sable n'a AUCUN job mixte**
  *(son seul exercice de porte de mode n'élit que des couples non couverts → `sans_retour`, qui
  servait déjà son motif)* : un mode `--decor-ecran` a donc été ajouté au script de couture, qui sème
  **deux copies abouties sur la même passation** — l'une dont le job porte les écartées, l'autre non.
  **CE QUE L'ÉCRAN A RENDU :**
  · section **« LA FILE »** — *2 terminées · 0 en file · 0 pas encore en file · 0 sans retour ·
    0 en échec · 0 sans copie*, et **« Rien n'attend de geste de votre part. »** ⭐ *Les six comptes
    restent disjoints et rien n'est réclamé au professeur : c'est bien la MÊME aboutie qui parle, pas
    un septième état.*
  · **Nina Panaitescot** → « **Traitement terminé.** » **+ le motif** : *« 2 écartée(s) — structure,
    argumentation : mode « expliquer » non couvert par l'instrument de structure, qui ne couvre que
    « composer »… »* — **et AUCUN bouton « Relancer »** *(relevé au DOM : `boutonRelancer: false`)*.
  · **Eléonore Delprat** → **RIEN** : le composant rend `null` *(relevé au DOM :
    `blocDeTraitement: false`)*. ⛔ **Le silence reste la règle ; ce lot n'y a ouvert qu'une
    exception nommée**, et les deux se voient côte à côte sur le même écran.
  ⭐ **Le décor a été RETIRÉ** *(deux tours de `--retire`, zéro trace, six interrupteurs identiques)*
  ; une commande le resème : `couture-c5l4.mjs --decor-ecran`.
- [x] **C5L4-E · ✅ L'ÉCRAN PARTAGÉ AVEC CODEX, VU À L'ÉCRAN LE 27/08.**
  `/prof/codex/passation/<exerciceId>` : ses **deux** onglets intacts, **Exercices** allumé, et la
  file rend ses six comptes sur des données réelles — *1 terminée · 0 en file · **1 pas encore en
  file** · 0 sans retour · 0 en échec · **5 sans copie***, avec leurs phrases par élève *(« Copie
  remise, mais pas encore mise en file : déclenchez l'analyse en lot. », « Aucune copie remise — la
  chaîne n'a rien à lire. »)*. ⭐⭐ **ET LA RÈGLE DU SILENCE TIENT CHEZ CODEX** : la copie d'Elo est
  `abouti` **sans écartées**, et son bloc de traitement ne s'affiche pas. *La correction profite à
  Codex sans y ajouter de bruit.*
- [x] **C5L4-E-bis · ⚠️ LES `<main>` IMBRIQUÉS, MESURÉS À L'ÉCRAN — MES TROIS SONT À 1, LES JUMEAUX
  DE CODEX SONT À 2.** Relevé par `document.querySelectorAll('main').length` :
  `/prof/aletheia/passation/<id>` → **1** · `/prof/aletheia/examen-diagnostique/<id>` → **1** ·
  `/prof/codex/passation/<id>` → **2** · `/prof/codex/examen-diagnostique/<id>` → **2**.
  ⭐ *Le correctif est vérifié par la mesure, et le renvoi de périmètre l'est aussi : les jumelles de
  Codex portent bien le défaut, et il se compte.* **Elles restent hors de ce lot**, nommées à
  `IDEES_post_rentree.md`.
- [x] **C5L4-F · ✅ LE RÉSIDU EST RETIRÉ ET `examens-c4l9.mjs` REJOUÉ — 126 verts, 6 rouges**, le
  27/08, **sur mandat explicite de Louis** *(« retire le résidu du 24/08 et rejoue examens-c4l9, mais
  assure-toi que le résidu ne sert vraiment à rien »)*.
  ⚠️⚠️ **LE RÉSIDU N'ÉTAIT PAS UNE LIGNE, C'ÉTAIT DEUX** — les jumeaux d'un même run
  `--garde-le-decor` du 24/08 à 01:38, à une seconde d'intervalle :
  `6ff2d56b…` *(codex/ecriture)* et **`12c914c5…`** *(aletheia/lecture)*. **La seconde n'a été
  trouvée que par le contrôle final du retrait**, qui compte les lignes restant à la marque — *une
  vérification qui se fie au retour de la suppression n'aurait rien vu.*
  ⭐ **CHACUNE PORTAIT UNE INSTANCE `assigne` ET SEPT DÉPÔTS `ouvert`**, soit **quatorze signaux de
  lancement vivants** pour sept élèves réels du bac à sable. ⛔ **Et AUCUN travail** : pré-vol par
  requête sur `transcription_v1`/`texte_v1`/`photos_v1`/`v1_remis_at`, puis sur `exercices_jobs`,
  `exercices_retours`, `exercices_squelettes`, `exercices_metacognition`, `competences_mesures`,
  `monitoring_mesures`, `api_couts` et `routeur_decisions` — **zéro partout**. Le script de retrait
  **refusait de jouer** si l'un de ces comptes avait été non nul, et une sauvegarde JSON a été écrite
  hors du dépôt avant toute écriture.
  ⭐ **LE RETRAIT EST PASSÉ PAR LA FONCTION DE PRODUCTION** `retirerExamenDiagnostique`, dans l'ordre
  que le script dit lui-même *(dépôts → statut `concu` → retrait → ligne de plan)* — jamais par un
  `delete` brut : c'est elle qui fait **revenir la ligne de plan à `a_concevoir`** avant d'effacer
  l'instance, sans quoi la ligne resterait `concu` sans instance.
  ⚠️ **UNE CORRECTION À CE QUE C5L4-A ET C5L4-B AVAIENT CONCLU** : sur les **deux** « vraies
  passations de lecture » que les smokes avaient célébrées, **une seule l'était** — `41e66a82…`,
  ligne de plan **sans note**, conçue le **26/08**. L'autre, `97eb21da…`, était le jumeau Aletheia du
  résidu. **Le fond tient** *(la vraie passation n'avait, elle aussi, qu'une seule porte avant ce
  lot ; et elle est intacte, ses sept dépôts avec)* — **mais le compte était faux, et il est
  rectifié ici.**
- [x] **C5L4-F-bis · ✅⭐ `examens-c4l9.mjs` REMET DÉSORMAIS LES INTERRUPTEURS COMME IL LES TROUVE —
  corrigé le 27/08 sur mandat de Louis, au patron de `decor-c4l6.mjs`.** ~~À sa section I, le script
  ouvrait les deux portes élève pour sa vérification, puis exécutait `poserPortes(false, false)` —
  une valeur en dur, pas l'état d'avant.~~ ⚠️ **Le commentaire de `poserPortes` annonçait pourtant
  déjà le bon geste** — *« la recette les bascule le temps d'une vérification, et les REMET »* :
  **le commentaire était juste et le code avait tort**, et la différence ne se voyait pas tant que
  les six étaient à OFF. **Quatre gestes :**
  · `PORTES_TROUVEES` est lu **au démarrage**, et `restituerLesPortes()` y revient ;
  · ⭐ **le contrôle « portes FERMÉES, AUCUN signal » LES FERME LUI-MÊME** au lieu de le supposer —
    *un contrôle qui affirme un état au lieu de l'établir échoue quand le régime change, sans que
    rien ne soit cassé* ;
  · la fin de section I **restitue** au lieu de forcer ;
  · ⚠️ **`process.on('SIGINT')` restitue aussi sur interruption** *(patron de `lecture-c5l2.mjs`)* —
    un Ctrl-C entre l'ouverture et la restitution laissait deux portes ouvertes.
  ⭐⭐ **ÉPROUVÉ DANS LES DEUX RÉGIMES, ce qu'un seul tour n'aurait pas prouvé** : portes trouvées à
  **ON** → rendues **ON** ; portes trouvées à **OFF** → rendues **OFF**. *C'est la différence entre
  une restitution et une constante.*
- [x] **C5L4-F-ter · ✅ LE RÉGIME DU `07-` §5 N'EST PLUS UN CRITÈRE DE RÉUSSITE DE C4-L9 — corrigé
  le 27/08.** ~~Le bloc final affirmait `v === false` sur les six interrupteurs~~ : il transformait
  **un état de la base** en **échec de la recette**, et rendait quatre rouges qui ne disaient rien de
  ce que C4-L9 construit. **Il fait désormais la part des deux :**
  · **une ASSERTION** sur ce dont la recette répond — *« `exercices_actif` est remis COMME TROUVÉ »*,
    idem pour `passation_classe_actif` : les deux seules portes qu'elle bascule ;
  · **un CONSTAT** sur les six, avec un avertissement nommé quand l'un est à ON — *« le `07-` §5 les
    dit à OFF ; l'écart est un ÉTAT DE LA BASE, pas un défaut de ce lot ; il se répare à
    `/prof/allumage`, jamais ici »*.
  ⭐ *« Un écran qui compte autre chose que ce qu'il dit est un écran qui ment » — un compteur de
  recette aussi.*
  ⭐⭐ **RÉSULTAT : `examens-c4l9.mjs` rend 128 vérifications passées, 0 en échec**, dans les deux
  régimes — contre 126/6 avant la correction, dont **aucun des six rouges n'était un défaut**.
- [x] **C5L4-G · ✅⭐ TRANCHÉ PAR LOUIS LE 27/08 — LES SIX SONT À ON, ET C'EST VOULU.**
  ~~Le `07-` §5 les disait « à OFF jusqu'à la recette », la base disait le contraire depuis une date
  que personne n'avait écrite.~~ `C5-L2` puis `C5-L4` l'avaient constaté le même jour et **relevé
  sans le changer** — *un lot ne décide pas d'un allumage*. ⭐ **Ce n'était donc pas une dérive à
  réparer : c'était une décision qui n'avait pas encore été écrite.** Elle l'est désormais, au
  **`07-` §5, section « Ce que l'allumage est devenu »** *(v2.60)*, avec ce qu'elle change pour
  chacune des deux familles :
  · **les trois du professeur** *(`exercices_actif`, `routeur_actif`, `competences_affichage_actif`)*
    sont **ouverts** — la période « avant la recette » est close ; ⚠️ **le geste reste le sien**, à
    `/prof/allumage`, et **aucun lot n'en bascule un** ;
  · **les trois de chantier** *(`fabrique_actif`, `chaine_actif`, `passation_classe_actif`)*
    répondent *« ce lot est-il construit et éprouvé ? »* — **oui pour les trois**. ⭐ `chaine_actif`
    reste **le seul des six qu'une MACHINE bascule** : le retrouver à OFF un 12 du mois ne sera pas
    une décision mais **une facture**.
  ⚠️ **Et le §5 porte maintenant ce que toute recette doit en tirer**, appris à ses dépens le même
  jour : *un contrôle qui AFFIRME une porte fermée au lieu de la FERMER échoue dès que le régime
  change* · *une recette qui « remet » un interrupteur en écrivant une constante ne le remet pas,
  elle l'impose* · ⛔ *le régime ne se compte jamais comme un échec de lot*.
  ⚠️ **Ce qui reste vrai pour la recette** : les six onglets d'Aletheia et les quatre de Codex sont
  **visibles et pleins dès la première seconde**, et **aucune recette ne peut prétendre avoir
  éprouvé un comportement « porte fermée » sans avoir éteint l'interrupteur exprès — puis l'avoir
  remis** *(c'est exactement ce que `C5L4-C` a fait)*.
- [ ] **C5L4-H · ⛔ LE DÉMÉNAGEMENT DE `app/prof/conception/` EST REPORTÉ** — décision de Louis, 27/08 :
  *« ça va me demander un peu plus de réflexion, donc pour le moment on fait juste un renvoi »*.
  **Son coût est listé, fichier par fichier et ligne par ligne, au §6.1 du relevé** *(dix
  `revalidatePath` dans six fichiers, plus quatre autres sites et l'entrée de nav)*. ⚠️ **Un
  `revalidatePath` sur un chemin mort ne lève aucune erreur.** **Condition de reprise : une décision
  de Louis sur l'organisation de la conception.** *(Ligne posée à `IDEES_post_rentree.md`.)*

---

## C6 · L1 — La page du professeur : quatre drapeaux, deux files qui se vident, et un diagnostic rangé (séance du 28/08, migration `c6_l1_attention.sql`)

> ⭐⭐ **CE LOT EST UN LOT DE COUTURE, pas un lot d'écran.** La matrice existait et elle est en
> production ; ce qui restait, c'est la seconde moitié de l'entrée — **quatre canaux écrits d'un
> côté et lus de personne**. **Tout ce qui est coché ci-dessous a été prouvé PAR EXÉCUTION**, par
> `scripts/recette/couture-c6l1.mjs` *(41 contrôles verts, décor semé et retiré)* — jamais par
> lecture de code.
>
> ⚠️ **Une session Code ne s'authentifie pas** : tout ce qui demande un ŒIL DE PROFESSEUR DEVANT
> L'ÉCRAN reste décoché, avec sa condition de reprise.

### Ce qui est prouvé, avec sa preuve

- [x] **C6L1-1 · Le constat d'entrée, chiffres en main.** La matrice montrait **149 lettres
  réelles en PRODUCTION** *(D 72 · C 59 · E 14 · B 4)*, sur **178 mesures** et **trois
  compétences** *(structure, expression, argumentation)* ; en **bac à sable**, **102 niveaux dont
  la lettre est NULLE** sur 3 mesures. *Preuve : requêtes PostgREST des deux côtés, 28/08.*
  ⭐ **La première phrase de la mission était donc tenue avant le lot** — et « aucune lettre »
  n'est pas « aucune mesure ».
- [x] **C6L1-2 · Canal ② — `jugerLaLettre` rend `drapeaux[]`, et il a enfin un lecteur.**
  *Preuve : couture §B, « ② fraîcheur d'ancre : 1 drapeau — Cadence d'ancre manquée : 8 cycles… »,
  et le contrôle que **la phrase vient de `lettres.ts`**, jamais de l'écran.*
  ⚠️ **Deux appelants droppaient le tableau, pas un** : `utils/moteur/etat-serveur.ts:215` **et**
  `utils/moteur/cycle-serveur.ts:379` — le second n'était pas nommé au prompt.
- [x] **C6L1-3 · Canal ③ — la file N3 apparaît, se traite, et disparaît.** *Preuve : couture §C —
  dossier semé ouvert depuis 5 cycles, vu en file **et en tête** (re-signalé), traité par
  `prendreLeDossierN3`, **`dossier_n3_traite_at` constaté en base**, **rejeu idempotent**
  (la date ne bouge pas), **absent de la file au rechargement**.*
  ⛔ **Et il ne désescalade pas** : le `degre` est resté `N3`, constaté en base.
- [x] **C6L1-4 · Le dossier N3 est un DOSSIER, pas une ligne.** Cinq pièces : observable en échec
  **au sens de l'ACQUISITION** *(fenêtre d'évidence, seuil > 2/3 — pas la réussite d'une mesure)*,
  interventions tentées *(degré + entrée en N1 + cycles)*, productions *(les 4 dernières, et le
  compte total est dit)*, plus le re-signalement et l'opt-out quand ils s'appliquent.
- [x] **C6L1-5 · Canal ④ — la file d'examen humain se vide.** *Preuve : couture §B et §C — acte
  semé `citation_absente: true`, vu en file, **la preuve montre le point du RETOUR PUBLIÉ**,
  examiné, **`traite_at` constaté en base**, **rejeu idempotent**, absent au rechargement, et
  **rien d'autre n'a bougé** (texte et drapeau de l'acte intacts).*
- [x] **C6L1-6 · La file et le drapeau des répétitions sont DEUX choses.** La première n'attend
  aucune répétition *(loi 25)* ; le second n'existe que si un seuil est réglé, et **NULL vaut
  « aucun drapeau »**. **La distribution observée s'affiche même sans seuil.** *Preuve : couture §B
  (« la DISTRIBUTION est montrée : 1 élève, 1 acte, 1 sur citation absente ») + tests unitaires.*
- [x] **C6L1-7 · Canal ⑤ — le faisceau part par le canal existant, ET NE COMPTE AUCUN STRIKE.**
  *Preuve : couture §B et §C — dépôt maison semé, **6 signaux sur 7** convergent, ligne
  `module='exercices'` **en base**, type `faisceau_integrite`, **`compte_strike = false`**,
  `rendu_ref` = l'id du dépôt ; confirmé → `statut='confirme'`, `acquitte_at` posé,
  **`compte_strike` toujours `false`**, **strikes 0 → 0 et bloqué false → false**, et **rejeu
  idempotent par `acquitte_at`**.*
- [x] **C6L1-8 · La migration porte exactement les quatre valeurs.** *Preuve : répétition à blanc
  sur le CORPS du fichier, retour **vérifié par requête**, puis exécution **sandbox puis prod** —
  `les_quatre_valeurs` à `t` des deux côtés, et la définition rendue en toutes lettres.*
- [x] **C6L1-9 · Le diagnostic de rétention a une porte, et ses deux fils sont réparés.**
  *Preuve : couture §D — la lecture réparée rend **8 cibles** là où elle en rendait **0**
  (`type='unite'` : 0 ligne en base), et elle **agrège** : 1 cible couverte, 5 concepts,
  **par `scope_contenus`** — le bras que l'écran ignorait.*
- [x] **C6L1-10 · Le décor se retire, et les états partagés reviennent comme trouvés.**
  Les **deux seuils** et le **semestre emprunté** sont mémorisés au registre et **reposés tels
  quels, `null` compris**. ⛔ **Aucun des six interrupteurs n'a été touché** — reconstatés à ON
  des deux côtés au début de la séance.

### Ce qui reste à jouer en recette, avec sa condition de reprise

- [x] ⭐ **C6L1-A · LE SMOKE PROF, À L'ÉCRAN — JOUÉ LE 28/08, EN SANDBOX ET EN PRODUCTION.**
  *(Session ouverte par Louis ; sandbox dans le panneau navigateur sur `localhost:3000`, production
  dans son Chrome sur `palimpseste.ink`.)*
  ⭐⭐ **PRODUCTION — LA MATRICE MONTRE DES LETTRES RÉELLES, À L'ÉCRAN.** `THLP`, **16 élèves** :
  Expression **16 mesures**, Argumentation **15**, Structure **14**, Synthèse **1**, Questionnement
  **0**, Connaissance **« mesurée en silence »**. Les lettres **C, D, B, E** sont posées et lisibles
  élève par élève. ⭐ **Et la distinction que la grille tenait déjà se voit** : *« Victoria Lell
  Fotso · Synthèse · **aucune lettre posée** · 1 mesure »* — « aucune lettre » n'est pas « aucune
  mesure ». ⭐ **Toutes portent `provisoire`, et le professeur les voit quand même** : « côté
  professeur, les lettres, toujours » (`06-` §5) — la règle de masquage est une règle d'élève.
  ⭐ **L'ORDRE DE LA PAGE EST CELUI VOULU**, des deux côtés : « Ce qui demande votre attention »
  **au-dessus** de la grille · l'opt-out et la grille **inchangés** · le diagnostic de rétention
  **en dessous**, avec son lien. **Aucun troisième onglet, aucune entrée neuve au Pilotage.**
  ⭐ **LE VIDE DIT LA BONNE DE SES TROIS RAISONS** : *« Rien ne demande votre attention sur cette
  classe. Une file vide en début d'année est le régime normal… »* — et non « une lecture a échoué ».
  ⭐ **LA PORTE DU DIAGNOSTIC EST RÉELLE, DES DEUX CÔTÉS** : le lien porte déjà la classe, l'écran
  d'arrivée porte son **retour** vers l'onglet Compétences, et **il n'est plus muet** — sandbox
  **8 tuiles** dont *« Cognitif · 1 élève évalué »* avec ses **5 concepts** ; production **2 tuiles**
  *(« Pas encore de quizz » : la prod n'en porte aucun — c'est honnête, pas muet)*.
  ⭐ **LA DISTRIBUTION DU FAISCEAU PARLE** *(sandbox, classe `Test`)* : *« 1 dépôt maison regardé ·
  0 → 1 »*, et **par signal : 6 des 7 sont NON MESURÉS**, seuls les collages le sont *(0/1)*.
  **C'est le vrai état du faisceau aujourd'hui, et il fallait pouvoir le lire.**
  ⚠️ **La production tourne encore sans ce bloc** — il est au commit suivant, non poussé au moment
  du smoke.
- [x] ⭐ **C6L1-A-bis · AUCUNE RÉGRESSION À L'ATELIER D'INTÉGRITÉ**, dont j'ai touché deux
  composants *(`PanneauPreuve`, `HistoriqueEleve`)*. Les deux vues rendent en production.
  ⚠️ **MAIS LE SMOKE A TROUVÉ UN DÉFAUT QUE J'AVAIS INTRODUIT** : l'en-tête annonçait couvrir
  *« Aletheia · Codex · Fragments »* et promettait un **gel au seuil** — or l'atelier montrera
  désormais des signalements du module **Exercices**, dont le faisceau **ne compte aucun strike**.
  **Un écran qui promet un gel sur un signal qui n'en produit aucun ment.** Corrigé : le quatrième
  module est nommé, avec ce qui le distingue.
- [x] ⭐⭐ **C6L1-A-ter · LES QUATRE DRAPEAUX VUS À L'ÉCRAN, ET LES TROIS GESTES CLIQUÉS — 28/08,
  sandbox.** ⚠️ **C'est le test que la couture NE PEUT PAS faire** : le script appelle
  `utils/pilotage/gestes-serveur.ts` et **contourne donc l'enveloppe `'use server'`, la garde de
  rôle et `revalidatePath`**. Seul un clic dans un navigateur exerce ce chemin. Décor semé par
  `couture-c6l1.mjs --decor-ecran` *(mode ajouté pour ça)*, puis retiré.
  ⭐ **LES CINQ DRAPEAUX S'AFFICHENT, DANS L'ORDRE VOULU** : `DOSSIER N3 · RE-SIGNALÉ` **en tête**,
  puis le faisceau, la file d'examen humain, la répétition, la fraîcheur d'ancre. Compteur :
  *« 1 dossier N3 ouvert **chez 1 élève** »* — les dossiers ET les élèves, lisibles tous les deux.
  ⭐ **Les trois qui ont un geste le portent ; les deux qui n'en ont pas n'en portent pas** — la
  répétition se traite acte par acte, et la cadence d'ancre est **non bloquante**.
  ⭐ **LE DOSSIER N3 REND SES CINQ PIÈCES**, et **dit honnêtement ce qu'il ne peut pas calculer**
  *(« l'instrument de cette compétence n'est pas lisible… le dossier reste, il n'est pas moins
  réel »)* — l'observable semé n'est pas un observable de l'instrument.
  ⭐ **LES TROIS CLICS DESCENDENT JUSQU'À LA BASE**, et la file se vide sous les yeux : le N3
  disparaît et le compteur passe à 0 · `dossier_n3_traite_at` posé **et `degre` toujours `N3`** ·
  le faisceau `confirme` + `acquitte_at` **et `compte_strike` toujours `false`** · **Nina
  Panaitescot : 0 strike, non bloquée** *(c'est l'arbitrage ③, vérifié sur une vraie élève)* ·
  `traite_at` posé sur l'acte, `citation_absente` / `texte` / `point_id` **intacts**.
  ⭐ **LA 4ᵉ BRANCHE DE `chargerPreuve` REND** : `/prof/integrite` montre
  *« EXERCICES · exercice à la maison · version finale rendue »*, **LA PREUVE = la production de
  l'élève** *(899 caractères utiles)*, et **le MOTIF journalisé en entier** — les 6 signaux nommés,
  plus le 7ᵉ *« non mesuré »*.
  ⚠️ **ET LE DÉCOR A RÉVÉLÉ DEUX DÉFAUTS DE LANGUE, corrigés** : *« 1 contestation**s**
  distinctes »* *(accord)*, et *« **au-delà** du seuil réglé (1) »* — **faux au seuil exact**, la
  comparaison étant `>=`. *Un écran qui décrit mal sa propre règle apprend une règle fausse à qui
  le lit.*
- [ ] **C6L1-B · LES DEUX DRAPEAUX COMPTÉS EN CYCLES, SUR LE CALENDRIER RÉEL.** ⚠️ Au 28/08/2026,
  la sandbox ne porte **qu'UNE SEULE semaine d'enseignement commencée** : ni la cadence d'ancre
  *(6 cycles)* ni le re-signalement N3 *(3 cycles)* ne peuvent se lever. Le script les prouve en
  **empruntant un semestre archivé passé**. **Condition de reprise : à rejouer sans emprunt vers
  la mi-octobre**, quand 7 semaines d'enseignement auront réellement passé.
- [ ] **C6L1-C · « DES FRAGILITÉS RÉELLES » — la base n'en porte aucune.** L'écran **montre bien
  quelque chose** *(1 élève, 5 réponses notées, 8 cibles, 1 couverte)*, mais **0 concept fragile**,
  et c'est un fait de la donnée, pas un écran muet : les 5 réponses portent sur **5 concepts
  distincts, une question chacun** — `classerConcept` rend `insuffisant` sous 2 questions — et
  **les scores sont hauts** *(7,15 à 10)*. **Condition de reprise : un quizz de plusieurs questions
  sur un même concept, réellement passé et fermé.**
- [ ] **C6L1-D · LE FAISCEAU SUR UN DÉPÔT RÉEL, NON SEMÉ.** La convergence a été prouvée sur un
  dépôt fabriqué. ⚠️ **Aucun dépôt maison réel ne porte encore de télémétrie de saisie** en base.
  **Condition de reprise : un premier exercice fait à la maison au clavier**, une fois la rentrée
  passée. ⭐ **Le seuil, lui, n'est plus un préalable pour VOIR** : la **distribution du faisceau
  s'affiche même à `null`** — répartition des dépôts par nombre de signaux levés, ce que chaque
  seuil possible attraperait, et le compte par signal. **C'est sur elle que le seuil se réglera.**
- [ ] **C6L1-E · LE SEPTIÈME SIGNAL — le style discordant — N'A AUCUN PRODUCTEUR.** Il rend
  **« non mesuré »**, jamais « concordant ». ⭐ **DÉCIDÉ LE 28/08 (Louis) : il se construira PAR
  DÉRIVATION** des **neuf observables stylistiques que l'instrument d'Expression mesure déjà**
  *(`densite_friction`, `mot_impropre`, `repetition_pauvre`, `savant_plaque`, `taux_sens_passe`,
  `orthographe`…)* — **aucun NLP à écrire, aucune colonne à poser**. ⚠️ **Mais pas avant qu'un
  historique existe** : c'est le signal au pire profil de faux positifs, et *un élève dont
  l'Expression bondit, c'est à quoi ressemble le progrès*. **Condition de reprise : un historique
  de mesures maison par élève.**
- [ ] **C6L1-F · LES TROIS DRAPEAUX QUE CE LOT NE POSE PAS.** *(a)* trois `pas_pu` d'affilée
  *(`06-` §3 ; `exercices_depots.conditions_declarees`)* · *(b)* l'incohérence répétée de la
  restitution à chaud *(`06-` §3 ; `01-` §9 ; `ContexteLettre.incoherenceRepetee`,
  `utils/routeur/lettres.ts:145`, jamais passé)* · *(c)* la discordance de deux paliers
  *(`utils/routeur/lettres.ts:203`)*. ⭐ **Le canal les accueille sans code neuf pour (a) et (b)** ;
  **(c) est TRANSITOIRE** — elle ne se lève qu'à l'arrivée d'une ancre, donc **à l'écriture**, chez
  `utils/moteur/etat-serveur.ts:215`. ⭐ **DÉCIDÉ LE 28/08 (Louis) : la DISCORDANCE d'abord, en
  petit lot, AVANT le prochain examen en classe** — c'est la seule des trois qui soit mûre, parce
  qu'elle **ne dépend pas de la maison** : elle se lève quand une ANCRE arrive. ⛔ Les deux autres
  attendent les exercices maison — elles portent **zéro ligne en base des deux côtés**.
  **Condition de reprise de (a) et (b) : un premier exercice maison remis.**

---

## C6 · L2 — Ce que l'élève voit : trois écrans, cinq canaux, et une migration (séance du 28/08, migration `c6_l2_marques_eleve.sql`)

> ⭐⭐ **CE LOT EST LE SYMÉTRIQUE DE `C6-L1`, ET IL EN PARTAGE LA NATURE : un lot de COUTURE.**
> `C6-L1` a trouvé la matrice du professeur déjà écrite et les canaux coupés ; ici c'est l'inverse
> — **les trois écrans de l'élève n'existaient pas**, mais les trois mots de la première phrase
> avaient chacun leur producteur, et **deux n'étaient lus par personne**.
>
> **Tout ce qui est coché a été prouvé PAR EXÉCUTION**, par `scripts/recette/couture-c6l2.mjs`
> *(**51 contrôles verts, 0 rouge**, décor semé et retiré, base revenue au caractère près)* —
> jamais par lecture de code.
>
> ⚠️⚠️ **UNE SESSION CODE NE S'AUTHENTIFIE PAS, ET C'EST LA LIGNE DE PARTAGE DE CETTE SECTION.**
> Le script appelle **les lectures que les trois écrans appellent** et constate en base ; il
> **n'exerce aucun JSX, aucune server action, aucune redirection**. *Le layout élève redirige un
> visiteur non-élève avant même de charger le module de la page : les trois écrans n'ont donc
> **jamais été rendus**.* **Tout ce qui demande un ŒIL D'ÉLÈVE DEVANT L'ÉCRAN reste décoché.**

### Ce qui est prouvé, avec sa preuve

- [x] **C6L2-1 · Le constat d'entrée, chiffres en main.** Le tableau de bord savait produire
  **six** tuiles — quizz 100 · synthèse 95 · retour d'examen 92 · fragment 90/70 · flashcards 50 ·
  lecture 40 — et **aucune ne naissait d'un exercice assigné** : `app/eleve/page.tsx` n'importait
  ni `exercices_depots`, ni `exercicesMaisonDeLEleve`. *Preuve : lecture intégrale du fichier au
  contrôle machine 6, avant toute écriture.*
- [x] **C6L2-2 · Canal ④ — une tuile naît de l'ASSIGNATION.** `signalDeLaSemaine` voit les dépôts
  du cycle et allume la tuile. *Preuve : couture §B ④ — 2 exercices vus, 2 attendant un geste.*
  ⭐ **Et ce n'est pas le signal de lancement de `C4-L9`** : celui-là naît du LANCEMENT par le
  professeur, celui-ci de l'ASSIGNATION. Deux événements, deux signaux.
- [x] **C6L2-3 · Canal ⑤ — l'écran de la semaine sert LES DEUX ATELIERS.** *Preuve : couture §B ⑤
  — `aletheia + codex` sur un décor qui pose une instance de chaque ; une liste par atelier en
  aurait manqué un.* ⭐ `exercicesMaisonDeLEleve` est appelée **deux fois**, jamais élargie.
- [x] **C6L2-4 · Chaque ligne de la semaine mène au déroulé à six temps.** *Preuve : couture §B ⑤ —
  tous les `href` portent `/exercice/`.* ⛔ « Un lien qui mène à `notFound()` n'est pas un geste. »
- [x] **C6L2-5 · Le récapitulatif nomme les FORCES et AUCUNE faiblesse.** *Preuve : couture §B ⑤bis
  — forces rendues par `dimension_eleve` ; le rendu complet passé au crible de
  `/faible|faiblesse|tu rates|échou|à revoir/i`, aucun résultat.* ⭐ **Le motif est mécanique** :
  nommer la faiblesse d'entrée donnerait à l'élève la réponse à « se juger », et détruirait la
  mesure du Monitoring en silence.
- [x] **C6L2-6 · Les deux temps ne s'affichent JAMAIS ensemble.** *Preuve : couture §B ⑤bis
  (bilan vide) puis §C (récapitulatif vide) — c'est le type `MomentDeLaSemaine` qui l'interdit.*
- [x] **C6L2-7 · ⭐⭐ Un retour PUBLIÉ NON LU retient le bilan.** *Preuve : couture §C — l'écran
  reste au récapitulatif tant que `lu_at` est nul, et bascule dès qu'il est posé.* ⭐ **Trouvé en
  jouant la recette, pas en la concevant** : `etatDeLExercice` met l'obligation de lecture DEVANT
  le statut du dépôt *(`02-` §6.D, étape 17)*, et c'est ce qui garantit que la semaine ne se
  referme pas sur un retour que l'élève n'a pas ouvert.
- [x] **C6L2-8 · ⭐⭐ Canal ② — « en progrès » a enfin un appelant de PRODUCTION.**
  `progressionALaLecture` calcule la progression **à la lecture**, pour le seul écran de l'élève.
  *Preuve : couture §D — `progres` sur un décor où `lien_explicite` passe à acquis d'une fenêtre à
  la suivante (2/4 → 3/4).* ⛔ **Cela ne lève PAS `C4L12-23`**, qui reste un refus d'affirmer côté
  moteur : un `aProgresse` faux **fait poser un exercice de plus**, un mot à l'écran non.
- [x] **C6L2-9 · Et il se tait quand il ne sait pas.** *Preuve : couture §D — une compétence sous
  la fenêtre de quatre rend `pas_assez_de_mesures`, jamais « en progrès ».* ⭐ **C'est l'état de
  TOUS les élèves réels aujourd'hui** *(production : 162 paires, zéro à quatre mesures)*, et
  l'écran **dit pourquoi** au lieu de disparaître.
- [x] **C6L2-10 · ⭐⭐ Canal ③ — un écran de PROFIL lit `exercices_retours.action_revision`.**
  *Preuve : couture §D — le geste rendu est mot pour mot celui que la chaîne a écrit, avec sa date
  de publication et le lien du déroulé.*
- [x] **C6L2-11 · `published_at` est la porte, et elle tient.** *Preuve : couture §D — un second
  retour, PLUS RÉCENT et NON publié, portant un texte sentinelle, n'est jamais sorti.*
- [x] **C6L2-12 · Le geste ne nomme AUCUNE compétence, et c'est juste.** *Preuve : couture §D —
  `competence === null`.* ⚠️ **Le seul rattachement écrit est la cible primaire**
  *(`routeur_decisions.cible_retenue`, à défaut `exercices.cible_primaire`)*, et **les deux sont
  vides** : 0 ligne de `routeur_decisions` des deux côtés, `cible_primaire` NULL sur **251/251** en
  production. ⛔ **Et `competences_mesures.depot_id` ne peut pas y suppléer** : les **14** retours
  publiés de production portent tous un dépôt qui mesure **DEUX OU TROIS** compétences — *aucun
  n'en mesure une seule*. « Le dernier conseil que Calame t'a donné » est honnête ; « ton geste
  pour l'Argumentation » ne le serait pas.
- [x] **C6L2-13 · Les TROIS conditions d'une lettre, éprouvées une par une.** *Preuve : couture §D
  — sans le choix, aucune lettre et la raison est `choix_de_l_eleve` ; avec les trois réunies, la
  lettre « C » s'affiche.* ⭐ **Les deux sens sont éprouvés** : « une bascule qui ne montre jamais
  rien n'est pas un choix ».
- [x] **C6L2-14 · Le choix de l'élève se persiste et se relit.** *Preuve : couture §D —
  `ecrireLeChoixDesLettres` puis `lireLeChoixDesLettres` rendent `true`.* ⚠️ Migration
  `c6_l2_marques_eleve.sql`, **sandbox le 28/08**.
- [x] **C6L2-15 · ⭐⭐ RR4 — aucun champ interdit d'`ObservableEleve` n'atteint l'écran.**
  *Preuve : couture §D et §C — le JSON de ce que reçoivent le profil et le bilan est passé au
  crible de `code`, `sens`, `taux`, `tauxFenetre`, `reussies`, `denominateur`, `reussiesFenetre`,
  `denominateurFenetre`, `serie` : **aucun**.* ⭐ **La coupure est dans le TYPE, pas dans le JSX** —
  un écran qui oublierait un champ ne pourrait pas le trouver.
- [x] **C6L2-16 · ⭐⭐ Le bilan nomme LES DEUX ÉCARTS QUI INSTRUISENT, un de chaque sens.**
  *Preuve : couture §C, sur un cas semé de chaque sens — `bonneSurprise` (bien réussi là où il
  était faible : `objection_traitee`, 0,5 → 1) et `angleMort` (moins bien réussi là où il avait
  une force : `garant_present`, 1 → 0).*
- [x] **C6L2-17 · Le bilan dit ce qui manque.** *Preuve : couture §C — une copie rendue sans mesure
  écrite, et le bilan l'annonce.* ⭐ *« Une mesure qui n'a pas eu lieu ne se voit pas » — la leçon
  payée par `C5-L4`.*
- [x] **C6L2-18 · SIX fiches, et six exactement.** *Preuve : couture §E — 6 rendues, la septième
  (`monitoring`) écartée AVEC SON MOTIF.* ⚠️ `competences_fiches` porte **7 lignes** dans les deux
  bases ; `monitoring` **n'a pas de `### 1.1`** et n'est pas une compétence du référentiel.
- [x] **C6L2-19 · La fiche est GÉNÉRIQUE, et son texte est servi tel quel.** *Preuve : couture §E —
  aucun code d'observable, aucun « travaillé N fois », et la ligne de fabrication en italique
  (« Ni observable, ni seuil, ni décompte ») **ne sort pas** : c'est une consigne, pas le texte.*
- [x] **C6L2-20 · « Servie une fois » est posée et idempotente.** *Preuve : couture §E — la marque
  s'écrit au premier passage, et un second passage ne réécrit pas la date du premier.*
- [x] **C6L2-21 · Les lettres de Fragments ont quitté le tableau de bord.** Le bloc « Ta
  progression » — calcul, rendu, l'import `noteVersLettre` et la table `TEXTE_LETTRE` — est retiré
  de `app/eleve/page.tsx`. *Preuve : `npx tsc --noEmit` propre (aucun orphelin) et `npm run lint`
  sans avertissement sur le fichier.* ⛔ **Rien n'a été touché dans
  `app/eleve/modules/fragments-erudition/` : elles y restent, à « Ton parcours ».**
- [x] **C6L2-22 · La base revient EXACTEMENT à son point de départ.** *Preuve : après le dernier
  jeu — 3 mesures · 261 exercices · 46 dépôts · 3 retours · 102 niveaux tous provisoires · 0 lettre
  · 0 marque écrite, et « balayage : aucun reste marqué ».*

### Ce qui reste à jouer en recette, avec sa condition de reprise

- [x] **C6L2-23 · ⭐⭐ LE SMOKE ÉLÈVE — JOUÉ LE 28/08, ET IL A TROUVÉ QUATRE DÉFAUTS D'ÉCRAN.**
  *Preuve : parcours complet en session ÉLÈVE réelle (`test@test.com`, « Elo », bi-classe), décor
  semé par `--eleve test@test.com --decor-ecran`, puis `--retire`.*
  ⚠️ **La session a été MINTÉE PAR L'API ADMIN** — `auth.admin.generateLink({ type: 'magiclink' })`
  puis la route `/auth/confirm` du dépôt, qui pose les cookies par `verifyOtp`. ⛔ **Aucun mot de
  passe n'a été saisi nulle part.** *Le patron est réutilisable pour tout smoke élève à venir.*
  **Ce qui a été vu et cliqué**, écran par écran :
  · `/eleve` — **la tuile « Mes exercices de la semaine » est le HÉROS** *(« À FAIRE MAINTENANT ·
    2 à faire »)*, la tuile « Les six compétences · à lire une fois » est en second, ⛔ **et le bloc
    de lettres A→E a bien disparu** ;
  · **la nav desktop porte « Moi »** *(Tableau de bord · Calendrier · Intégrité · **Moi** ·
    Modules)* — ✅ *décision de Louis du 28/08 : la ligne reste* ;
  · `/eleve/semaine` — frise « 0 exercice fait sur 2 », récapitulatif *(forces + dimensions)*, la
    liste **avec ses deux pastilles d'atelier** ;
  · ⭐ **LE CLIC DE BOUT EN BOUT** : tuile → `/eleve/semaine` → exercice → **le déroulé à six temps
    s'ouvre** *(« Préparer · Écrire · Se juger · Retour », la consigne, « Durée indicative :
    4 minutes », le champ de rédaction, la confiance déclarée)*. ⭐ *Et le clic a réellement fait
    passer le dépôt de `assigne` à `ouvert` en base — la chaîne est vraie.* ;
  · ⭐ **LE BILAN À L'ÉCRAN** *(après clôture des deux dépôts et validation de la lecture)* :
    « 2 exercices faits sur 2 », l'avertissement de la copie non corrigée, puis **les deux écarts**
    — *« Tu as réussi … — là où tu avais du mal jusqu'ici »* et *« À reprendre : … — c'était
    pourtant un de tes points forts »*. **Le récapitulatif avait disparu** : les deux temps ne
    coexistent jamais ;
  · `/eleve/moi` — « travaillé 6 fois · en progrès », la lettre **C**, « Le dernier conseil que
    Calame t'a donné : … », le lien « Revoir ce retour » ;
  · ⭐ **LA BASCULE DES LETTRES, LES DEUX SENS, PAR LE VRAI CLIC** : « Masquer » → le **C**
    disparaît et la base passe à `false` ; « Afficher » → le **C** revient. *La server action est
    donc exercée pour de vrai, enveloppe `'use server'` et `revalidatePath` compris.* ;
  · `/eleve/moi/competences` — les **six** fiches, chacune avec son paragraphe et ses dimensions ;
    ⭐ **la marque de service a été posée par la VISITE** *(effet client)*, et **la tuile de
    découverte s'est éteinte** au retour sur `/eleve` ;
  · ⛔ `/eleve/modules/fragments-erudition` — **« TON PARCOURS » et son axe E/D/C/B/A sont
    toujours là**. *L'arbitrage ④ est tenu des deux côtés.* ;
  · **la semaine passée** *(2026-08-17)* rend le vrai dépôt d'Elo, et **une semaine sans exercice**
    *(2026-09-07)* rend « Aucun exercice ne t'a été donné cette semaine-là. » ;
  · **l'état « Toutes les classes »** agrège et l'en-tête le dit *(« · toutes les classes »)*.
- [x] **C6L2-29 · ⭐⭐ QUATRE DÉFAUTS D'ÉCRAN TROUVÉS PAR L'ŒIL, ET CORRIGÉS** — *aucun n'était
  visible autrement : `tsc`, les 60 tests et les 51 contrôles de couture passaient tous.*
  **(1)** `/eleve/moi` répétait **cinq fois** « Ton profil se stabilise encore… », une fois par
  compétence provisoire → **les motifs sont dédoublonnés et dits une seule fois**, sous le bloc.
  **(2)** `/eleve/moi` disait « **jamais travaillé · pas encore travaillé** » — deux fois la même
  chose → à zéro mesure, **le décompte seul**. **(3)** `/eleve/semaine` alignait **huit dimensions
  d'affilée séparées par des virgules**, illisibles → **une liste, une par ligne**, et ⛔ **aucune
  n'est coupée**. **(4)** `/eleve/moi/competences` collait « CE QU'ON Y REGARDE » au dernier mot du
  paragraphe — `Balise` rend un `<span>` **inline**, que `space-y-4` ne sépare pas → **enveloppé
  dans un `<p>`**. *Les quatre re-vérifiés à l'écran après correction.*
- [x] **C6L2-30 · ⚠️ LE SEUL ÉTAT D'ÉCRAN NON ATTEINT : LA PORTE FERMÉE.** Le `07-` §5 est formel —
  *« aucune recette ne peut prétendre avoir éprouvé un comportement "porte fermée" sans avoir
  éteint l'interrupteur exprès — puis l'avoir remis »*. **La tentative a été faite et REFUSÉE** :
  écrire `scriptorium_params.exercices_actif` est une bascule d'un des six interrupteurs, et elle
  a été bloquée. ⭐ **Les six ont été re-constatés à ON après coup, inchangés.** Le message existe
  et il est écrit *(« Les exercices ne sont pas encore ouverts. Ton professeur te préviendra quand
  ils le seront. »)*, mais **il n'a jamais été affiché**.
  **Condition de reprise : Louis ferme `exercices_actif` à `/prof/allumage`, regarde
  `/eleve/semaine`, et le rouvre.** *C'est un geste de quelques secondes, et c'est le sien.*
  > ✅ **SMOKE JOUÉ À L'ÉCRAN LE 29/08, des deux côtés à la fois.**
  > `exercices_actif` **refermé depuis `/prof/allumage`** *(l'écran passe à « 5 ouverts sur six » et
  > dit « Refermé. »)*, puis `/eleve/semaine` rechargé en session élève : **« Les exercices ne sont
  > pas encore ouverts. Ton professeur te préviendra quand ils le seront. »**
  > ⭐ C'est le vide EXPLIQUÉ, et il ne dit **jamais** le nom d'un interrupteur — les deux règles du
  > `07-` §5 tenues dans la même phrase. ⛔ Ce n'est pas « tu n'as rien à faire ».
  > ⭐ **L'interrupteur a été RENDU par le même écran**, et son retour **vérifié PAR REQUÊTE** — les
  > six à `true`, comme à l'entrée. *« Une recette qui remet un interrupteur en écrivant une
  > constante ne le remet pas : elle l'impose. »*
- [x] **C6L2-31 · ⭐⭐ LE SMOKE DE PRODUCTION, APRÈS DÉPLOIEMENT — 28/08.** Le code est poussé
  *(`origin/main` = `bad15b2` ; mes deux commits `1e635c0` et `fdd67a5` y sont)* et le schéma de
  prod portait déjà ses deux colonnes. **Vérifié, en LECTURE SEULE, sur la production :**
  · ⭐ **les deux routes neuves EXISTENT dans le build déployé** — `/eleve/semaine` et
    `/eleve/moi/competences` rendent **307** *(la redirection d'authentification)*, quand
    `/eleve/nimporte-quoi` et `/eleve/moi/inexistant` rendent **404**. *Le contraste est la preuve :
    un 307 sur une route inexistante serait impossible.*
  · ⭐ **LES SIX FICHES SE SERVENT EN PRODUCTION** — 6 rendues, `monitoring` écarté, **aucun
    incident** ; chacune avec son texte *(726 à 824 caractères)* et ses dimensions *(7 à 11)*.
    ⚠️ Ce sont les versions de PROD *(expression 3.2 · argumentation 4.3 · structure 3.3 ·
    connaissance 2.2 · synthèse 3.4 · questionnement 2.2)*, en avance sur le bac à sable.
  · ⭐⭐ **LE CANAL ③ EST OUVERT POUR DE VRAI : 12 élèves sur 62 ont désormais une « prochaine
    étape »** — l'`action_revision` de leurs retours publiés, que **seul le professeur voyait**
    jusqu'à aujourd'hui. *C'est le canal coupé qui se referme, sur des données réelles.*
  · ⛔ **AUCUNE LETTRE N'EST VISIBLE POUR PERSONNE** — 0 sur 62 élèves × 6 compétences.
    *`profil_provisoire` est vrai partout, et aucun élève n'a demandé ses lettres.*
  · ⚠️ **« EN PROGRÈS » EST MUET POUR TOUT LE MONDE, ET L'ÉCRAN DIT POURQUOI** — sur 360 lignes
    de profil lues : **141** disent « travaillé 1 fois · pas encore assez d'exercices pour le dire
    (1 sur 4) », **14** en disent 2, **une** en dit 3, et le reste « jamais travaillé ».
    **Zéro paire n'atteint la fenêtre de quatre.** *C'est exactement ce qui était prédit.*
  · ⭐ **L'ÉCRAN DE LA SEMAINE : 62/62 élèves en « porte ouverte · vide · 0 exercice »**, donc
    « Tu n'as aucun exercice cette semaine. » — l'état honnête, et **0 tuile allumée**.
  · ⭐⭐ **ET ZÉRO INCIDENT DE LECTURE sur les 62**, sur le profil comme sur la semaine : les deux
    colonnes neuves se lisent, et rien n'a régressé pour les comptes réels.
  ⚠️ *`profiles` porte **63 comptes** et **62 élèves ont une inscription active**.*

- [ ] **C6L2-24 · ⚠️ LA TUILE ET LA FRISE NE SE PROUVENT QU'EN BAC À SABLE — RECONFIRMÉ APRÈS
  DÉPLOIEMENT.** **La production ne porte AUCUN dépôt maison** — mesuré le 28/08 : 86 dépôts,
  `lieu = 'classe'` sur les 86, **zéro maison** *(le bac à sable en porte 21)*. ⭐ **Et le code
  déployé le confirme sur les 62 élèves réels** : tous en « porte ouverte · vide · 0 exercice »,
  **0 tuile allumée, 0 incident** *(`C6L2-31`)*. ⛔ **Un écran vide en production n'est donc pas un
  échec** : les 247 instances maison de production sont non servables, et le routeur n'a jamais
  tourné. **Condition de reprise : le premier exercice maison assigné en production** — c'est-à-dire
  `C4-L12` joué, ou une assignation manuelle par le professeur.
- [ ] **C6L2-25 · ⚠️ LA LETTRE DU PROFIL NE SE PROUVE À L'ÉCRAN QU'APRÈS LA BASCULE DE
  `profil_provisoire`.** Mesuré le 28/08 : **VRAI sur les 149 lignes de production et les 102 du
  bac à sable**. La couture l'a éprouvée **en semant la bascule et en la reposant** ; en vrai, elle
  tombe **à la clôture du segment 2** — `SEMAINES_SEGMENT_1 = 1` + `SEMAINES_SEGMENT_2 = 2` *(lus
  au fichier le 28/08)*, soit la **quatrième semaine d'enseignement**, le **lundi 2026-09-14** pour
  un semestre ouvert le 24/08. ⛔ **Et la bascule n'a AUCUN écrivain de production** —
  `cloturerLaCalibrationDesEleves` n'est appelée que par `scripts/recette/routeur-c4l12.mjs`.
  **Condition de reprise : `C4-L12` pose l'écrivain, puis la quatrième semaine arrive.**
  > ✅ **L'ÉCRIVAIN EST POSÉ — 28/08, hors lot.** `poserLesSemainesDuRouteur` appelle la clôture
  > **avant la pose**, dans le passage hebdomadaire qui existe déjà *(`01-` §9 : « il appartient au
  > passage hebdomadaire, pas à la chaîne »)*. **Aucun cron neuf** — deux déclencheurs sur la même
  > clé fabriquent deux lignes.
  > ⭐⭐ **Il se déclenche sur L'ÉTAT — « segment ≥ 3 » —, pas sur une date.** Les deux disent la
  > même chose le jour J ; ils ne disent pas la même chose le jour où le passage manque son tour.
  > Sur une date, un lundi sauté laisserait `profil_provisoire` à `true` **pour toujours** — aucune
  > lettre ne s'afficherait jamais à personne, et **rien ne le dirait**. Sur l'état, le passage
  > suivant répare de lui-même.
  > ⭐ **Et ce qui rend cela possible est une garde d'idempotence** : la clôture saute désormais tout
  > niveau déjà clos (`dejaCloturees` au bilan). Sans elle, repasser chaque lundi **re-jugerait
  > depuis la lettre déjà bougée** — la règle n'est pas idempotente, et un test le démontre
  > maintenant dans le sens **non plafonné**, la descente : les mêmes deux mesures font descendre
  > B → C, puis C → D. *À la montée, le plafond amortit — mais seulement tant qu'aucune ancre réelle
  > n'existe : c'est une coïncidence de régime, pas une garde.*
  > ⭐ **La borne HAUTE rend le verdict indépendant de l'heure** : les mesures comptées sont celles
  > de `[premier lundi du segment 2, premier lundi du segment 3[`, qu'on tourne à l'heure ou trois
  > semaines plus tard. Une clôture en retard rend **exactement** le même verdict qu'à l'heure.
  > **Preuves** : `npm test` **1894 / 1894** *(+1 vecteur : la non-idempotence de la règle pure)* ·
  > `tsc` et `eslint` silencieux · **aucune migration** · et la recette `routeur-c4l12.mjs` §N
  > gagne **le rejeu** — second passage à `lettresJugees = 0`, `dejaCloturees` égal au compte du
  > premier, **et les lettres relues en base, identiques**.
  > ⚠️ **UNE COUPLURE À CONNAÎTRE, ET ELLE EST ASSUMÉE** : la clôture vit derrière `routeur_actif`,
  > comme tout ce point d'entrée. **Routeur fermé un lundi de segment 3, aucune lettre ne se fige,
  > donc aucune ne s'affiche à un élève.** Le déclenchement sur l'état fait que le lundi suivant
  > rattrape — mais si l'interrupteur reste fermé, rien ne bascule. *`routeur_actif` est à ON dans
  > les deux bases.*
  > ⭐⭐ **ET LA DATE EST VÉRIFIÉE SUR LE CALENDRIER RÉEL DE PRODUCTION**, en lecture seule, en
  > rejouant `lireLesSegments` sur ses `semesters` et ses `holidays` — **32 semaines de cours** :
  > segment 1 *(diagnostic)* **2026-08-24**, 1 semaine · segment 2 *(calibration)* **2026-08-31**,
  > 2 semaines · **segment 3 *(amorce)* : premier lundi 2026-09-14**, 9 semaines · segment 4
  > 2026-11-23 · segment 5 2027-02-08. **La clôture tombera donc au cron du lundi 2026-09-14,
  > 09:30 UTC**, avec `debut2 = 2026-08-31` et `debut3 = 2026-09-14` — les mesures comptées seront
  > exactement celles des deux semaines de calibration.
  > **Ce qui reste sur cette ligne, et rien d'autre : la lettre VUE À L'ÉCRAN, le lundi
  > 2026-09-14.**
- [x] **C6L2-26 · ✅ LA MIGRATION EST JOUÉE — SANDBOX ET PRODUCTION, LE 28/08.**
  *Preuve : constat de tête en prod (63 comptes, 16 colonnes, 0 déjà posée, 4 policies), puis les
  **cinq drapeaux à `t`** et `comptes_intacts = 63` ; vérification indépendante **par les deux
  chemins** — psql (18 colonnes, les deux nullables sans défaut, 4 policies inchangées, 0 ligne
  écrite) et PostgREST (18 colonnes).*
  ⭐ **Jouée AVANT le push, sur décision de Louis, et c'est le protocole renforcé BIEN LU** — le
  même raisonnement que `c6_l1_attention.sql` le même jour : la migration est **inerte pour le code
  DÉPLOYÉ** *(vérifié sur `origin/main` : aucun lecteur de `profiles` ne fait `select('*')`, aucun
  ne nomme les deux colonnes)*, tandis que **le code NEUF exige le schéma neuf**. ⛔ L'ordre inverse
  aurait laissé, le temps de l'écart, un `/eleve/moi` dégradé pour TOUS les élèves.
  ⚠️ **`profiles` porte 63 comptes en production**, pas 14 — le 14 était le nombre d'ÉLÈVES.
- [ ] **C6L2-27 · ⚠️ « EN PROGRÈS » SERA MUET POUR TOUT LE MONDE À LA RENTRÉE.** Mesuré le 28/08 :
  **aucune paire (élève × compétence) n'atteint la fenêtre de quatre**, dans aucune des deux bases
  *(production : 162 paires — 147 à une mesure, 14 à deux, 1 à trois, **zéro à quatre** ; bac à
  sable : 3 paires à une)*. L'écran dira donc « pas encore assez d'exercices pour le dire », avec
  son décompte. ⭐ **Ce n'est pas une panne, et c'est le même mur que `C4L12-23`.**
  **Condition de reprise : une quatrième mesure sur une même paire — soit quatre exercices d'une
  même compétence remis et mesurés par un même élève.**
  > ↻ **PASSE DE RÉCONCILIATION DU 28/08 — RECOMPTÉ, ET LE CHIFFRE A BOUGÉ SANS CHANGER LA
  > CONCLUSION.** Relevé en production, en lecture seule : **184 mesures**, **168 paires
  > (élève × compétence)** hors sondes de montée — **153 à une mesure, 14 à deux, UNE à
  > trois**, et **ZÉRO n'atteint la fenêtre de quatre**. *(Le 28/08 au matin : 141 · 14 · 1.)*
  > **La condition tient, et c'est la même qui tient `C4L2-11`, `C4L12-16` et `C4L12-23`.**

- [x] **C6L2-31 · ✅ EN « TOUTES LES CLASSES », LA SEMAINE COMPTAIT DOUBLE — CORRIGÉ LE 29/08.**
  *Trouvé le 29/08 par la séance voisine, sur le profil d'Élo ; chemin revérifié ici sur pièce.*
  `app/eleve/semaine/page.tsx:77` appelle **`chargerLaSemaineDeLEleve` UNE FOIS PAR INSCRIPTION**
  *(`Promise.all(enContexte.map(...))`)*, et les instances de la vague `vgen1` portent
  **`classe_id = NULL`** — donc `visibleDansLaClasse` les laisse passer **pour chacune**. Un élève
  bi-classe lit **« 0 exercice fait sur 8 » pour 4 exercices**, et **le bloc des compétences est rendu
  deux fois**. ⭐ **En classe unique, c'est propre.**
  ⭐⭐ **ET LE MÊME PIÈGE A DÉJÀ ÉTÉ VU ET FERMÉ À DEUX LIGNES DE LÀ** : le commentaire de la l. 80
  dit *« LE QUOTA EST UNIFIÉ PAR ÉLÈVE, ET IL SE LIT UNE SEULE FOIS […] le lire dans
  `chargerLaSemaineDeLEleve` l'aurait compté deux fois »*. **Le quota a été sorti de la boucle ; les
  exercices et les compétences ne l'ont pas été.**
  ⚠️ **Ce n'est pas le défaut du `classe_id` du vivier** *(fermé le 28/08)* : là, une instance
  estampillée partait à la mauvaise classe ; ici, une instance **sans classe** est comptée autant de
  fois que l'élève a d'inscriptions. **Les deux se rencontrent sur `visibleDansLaClasse`, et le NULL
  est le cas commun.**
  **Condition de reprise : le correctif — dédoublonner par `exerciceId` avant de compter, ou sortir
  la liste de la boucle comme le quota l'a été.** *L'écran est en production, et deux élèves sont
  inscrits dans deux classes.*
  > ✅ **CORRIGÉ À LA SOURCE, ET NON PAR UN DÉDOUBLONNAGE D'AFFICHAGE.** `chargerLaSemaineDeLEleve`
  > prend désormais **la LISTE des classes** et n'est appelée **qu'une fois** — c'est exactement le
  > geste que le quota avait déjà reçu deux lignes plus bas *(« un élève inscrit dans DEUX CLASSES a
  > UN SEUL budget »)*. ⭐ **Le dédoublonnage se fait sur `depotId`, dans le chargeur, AVANT tout
  > calcul** : la frise, le récapitulatif, le bilan et « ce qui manque » sont donc comptés une seule
  > fois. ⛔ **La page ne somme plus rien** — sommer par inscription ÉTAIT le défaut.
  > **Preuves** : `npm test` **1909 / 1909** *(+5 vecteurs, dont celui qui montre le défaut : la
  > frise rend **4** sur deux dépôts doublés, et **2** une fois dédoublonnée)* · `tsc` et `eslint`
  > silencieux · **aucune migration**.
  > ✅ **VU À L'ÉCRAN LE 29/08, SESSION ÉLÈVE RÉELLE — et c'est le seul endroit qui pouvait le
  > montrer.** Élève **Elo**, inscrit en **T5 et Test**. En **T5 seul** : « **1 exercice fait sur
  > 4** », cinq blocs de compétence, quatre lignes. En **« toutes les classes »** *(l'en-tête le
  > dit)* : **exactement la même chose** — 1 sur 4, chaque bloc **une seule fois**. *Avant le
  > correctif : « 2 sur 8 », et tout en double.*
  > ⭐⭐ **ET LE DÉDOUBLONNAGE N'A RIEN MANGÉ — vérifié, pas supposé.** La classe Test montre un
  > **cinquième** exercice absent de la semaine ; suivi jusqu'à sa cause, son `assigne_at` vaut
  > `2026-08-24T00:16 UTC`, soit **dimanche 23 août 20h16 à Toronto** — il appartient donc à la
  > semaine **du 17 au 23**. ✅ **Vu à l'écran sur cette semaine-là** : « 0 exercice fait sur 1 », et
  > c'est bien lui. *C'est la règle de fuseau de `C4-L13` qui joue, exactement comme elle doit — un
  > compte qui paraît manquer n'est pas toujours un compte perdu.*
- [ ] **C6L2-28 · ⚠️ LE RATTACHEMENT DU GESTE À UNE COMPÉTENCE N'A JAMAIS ÉTÉ VU EN VRAI.** Le code
  lit `routeur_decisions.cible_retenue` puis `exercices.cible_primaire` *(l'ordre du `07-` §1.1)*,
  et **la couture n'a éprouvé que la branche « aucune des deux »** — les seules données qui
  existent. **Condition de reprise : une décision de routeur écrite (`C4-L12`) ou une instance
  conçue avec sa cible primaire ; alors l'écran doit dire « Ta prochaine étape, sur … ».**

---

## C6 · L3 — « En faire plus » : le pull, le push, et la marque qui les distingue (séance du 28/08, migration `c6_l3_bonus_au_journal.sql`)

> ⭐⭐ **CE LOT N'AJOUTE PAS UN CANAL : IL EN BRANCHE UN QUE TROIS LOTS AVAIENT POSÉ SANS JAMAIS LE
> RELIER.** L'emplacement de l'offre existait *(`C6-L2` s'était arrêté sur la phrase qui la
> précède)*, la règle du pull existait *(`01-` §5, gelée)*, le quota existait en base *(défaut 30
> min, commentaire de colonne nommant ce lot)*, et **la marque `bonus` avait un LECTEUR DE
> PRODUCTION et AUCUN ÉCRIVAIN**. *Mesuré à l'entrée : 0 instance et 0 mesure marquées, dans les
> deux bases.*
>
> **Tout ce qui est coché a été prouvé PAR EXÉCUTION**, par `scripts/recette/couture-c6l3.mjs`
> *(**43 contrôles verts, 0 rouge**, décor semé et retiré, base revenue à son état d'entrée et
> **vérifiée par requête** : 0 décision · 0 marque · 3 mesures · 46 dépôts · 261 instances ·
> `exercices_actif = true`)* — ou **PAR L'ŒIL**, en session élève réelle *(session mintée par l'API
> admin, `generateLink` + `/auth/confirm` : aucun mot de passe saisi)*.
>
> ⭐ **Le décor d'écran a son mode** : `--decor-ecran` sème sur le cycle COURANT et s'arrête là.
> C'est le seul moyen d'exercer **la server action elle-même** — la couture l'appelle en dessous, et
> *« `export type` dans un module `'use server'` tue tout le module à l'exécution »* sans que `tsc`,
> `npm test` ni une recette ne le disent. **`--retire` pour le retirer.**

### Ce qui est prouvé, avec sa preuve

- [x] **C6L3-1 · Le point de départ, mesuré et non recopié.** Les six interrupteurs lus **par
  requête dans les deux bases** — tous à ON, `rag_actif` compris — et l'état de la marque : 0
  décision, 0 instance, 0 mesure marquées des deux côtés. *`updated_at` n'a pas été utilisé pour
  dater quoi que ce soit : il ne date rien.*
- [x] **C6L3-2 · Canal ① — le quota se LIT, et il est unifié PAR ÉLÈVE.** `lireLeQuotaDuCycle` rend
  `optionnel / consommé / restant` depuis `budgetDeLEleve` ; **aucun réglage en base**, donc le
  défaut de situation *(30 min)* sert. *Preuve : couture §D — « optionnel 30 min · consommé 0 ·
  restant 30 ».* ⭐ **Il ne se compte jamais par classe** : la page l'appelle **une fois**, hors de
  la boucle par inscription.
- [x] **C6L3-3 · Canal ② — le pull POSE UN DÉPÔT RÉEL.** *Preuve : couture §D — 9 → 10 dépôts en
  base, `origine = routeur`, `statut = assigne`, `routeur_decision_id` écrit.* ⛔ **Prouvé par la
  ligne, jamais par un message de succès.**
- [x] **C6L3-4 · `assigne_at` est ancré à MIDI UTC DU LUNDI DU CYCLE, pas à l'instant du clic.**
  *Preuve : couture §D — `2026-08-31T12:00:00+00:00` pour un clic du 28/08.* ⛔ Laissé au
  `default now()`, un bonus demandé le dimanche soir à l'école tomberait dans la semaine SUIVANTE
  et sortirait du quota qu'il consomme.
- [x] **C6L3-5 · Canal ③ amont — la marque se pose AU JOURNAL.** `routeur_decisions.bonus = true`.
  *Preuve : couture §D bis.*
- [x] **C6L3-6 · « Servi par les mêmes règles » — la ligne de journal, champ par champ.** Le script
  imprime la ligne du bonus **à côté d'une ligne de semaine ordinaire** : mêmes `cycle_lundi`,
  `cible_retenue`, `regle_declenchee`, `borne_amont`, `etat_escalade`, `tirage_aleatoire` ; seuls
  `bonus` et `sondes_retenues` diffèrent. *Preuve : couture §D bis.*
- [x] **C6L3-7 · ⛔ AUCUNE SONDE SECONDAIRE sur un bonus.** *Preuve : couture §D bis — les seules
  sondes de la ligne sont des sondes de MONTÉE, qui vivent sur l'exercice et restent.*
- [x] **C6L3-8 · « Jamais au-delà » — prouvé PAR L'ABUS.** Demandes répétées jusqu'à l'arrêt : le
  quota consommé ne dépasse jamais l'autorisé, le compte s'arrête, **et l'écran dit pourquoi**.
  *Preuve : couture §E — « 20 min consommées sur 30 », motif `ne_tient_pas`, phrase rendue.*
- [x] **C6L3-9 · ⛔ LE QUOTA NE SE REPORTE PAS.** *Preuve : couture §E — le cycle suivant repart à
  30/30, sur la même base et le même élève.*
- [x] **C6L3-10 · ⛔⛔ LE DOUBLE CLIC NE SERT QU'UN EXERCICE.** Deux appels **concurrents**
  *(`Promise.all`)* → **un seul dépôt neuf**, le perdant rend `un_a_la_fois`, **et aucune décision
  orpheline ne reste**. *Preuve : couture §F.* ⭐ La garde est `uk_depots_eleve_exercice` +
  le **tirage déterministe par (élève × cycle × rang)** + l'ordre « décision PUIS dépôt ».
- [x] **C6L3-11 · Canal ③ aval — `lireContexte` RELIT la marque au journal.** *Preuve : couture §G —
  `ctx.bonus = true`, et `ctx.decision.bonus = true`.*
- [x] **C6L3-12 · ⛔⛔ LA MÊME INSTANCE, IMPOSÉE À UN AUTRE ÉLÈVE, RESTE `bonus = false`.** *Preuve :
  couture §G — un témoin choisi **sans aucun dépôt** sur cette instance.* ⭐ **C'est exactement ce
  qu'`exercices.bonus` n'aurait pas su dire**, et c'est le constat central du lot.
- [x] **C6L3-13 · `competences_mesures.bonus` porte la bonne valeur des deux côtés.** Écrit par le
  **vrai** `ecrireMesure`, depuis le **vrai** `lireContexte`. *Preuve : couture §G — `true` sur le
  dépôt demandé, `false` sur le dépôt imposé de la même instance.*
- [x] **C6L3-14 · Canal ④ — la frise DISTINGUE.** *Preuve : couture §H, et **l'œil** : « 2 exercices
  faits sur 2 » + « Et 1 exercice que tu as demandé en plus, fait. »* ⛔ Le demandé ne rejoint jamais
  la fraction.
- [x] **C6L3-15 · Un bonus non fait ne se lit PAS comme un retard.** *Preuve : à l'écran, le bonus
  repassé à « à faire » — la frise dit toujours « 2 exercices faits sur 2 », et la ligne porte
  « à faire · demandé en plus ».*
- [x] **C6L3-16 · Canal ⑤ — le push SUGGÈRE.** Une compétence `evaluee`, à E, sans aucune mesure :
  la tuile naît. *Preuve : couture §I, et **l'œil** : « Un exercice en plus ? · si tu veux » sur le
  tableau de bord.*
- [x] **C6L3-17 · ⛔⛔ ET IL N'ASSIGNE RIEN — prouvé PAR LA NÉGATIVE.** *Preuve : couture §I — 10 →
  10 dépôts après l'affichage de la suggestion.* ⭐ *« La clause la plus facile à croire tenue. »*
- [x] **C6L3-18 · Aucune compétence au-dessus de C n'est suggérée, et `NULL` n'est pas « E ».**
  *Preuve : couture §I + `utils/routeur/bonus.test.ts`.*
- [x] **C6L3-19 · Le bonus SORT du dénominateur d'assiduité, et l'écart est MESURÉ.** *Preuve :
  couture §J — avec la règle 0/3, sans elle 0/4.* ⛔ Sans elle, un élève à 3/3 qui demande un
  exercice de plus et ne le finit pas tombe **sous le seuil des trois quarts** : le dispositif
  punirait le geste qu'il offre. ⭐ **C'est le `06-` §5 APPLIQUÉ** — *« ses exercices ASSIGNÉS »* —,
  jamais amendé.
- [x] **C6L3-20 · La PORTE FERMÉE refuse, et elle le dit sans nommer un interrupteur.** *Preuve :
  couture §K — `exercices_actif` **emprunté le temps d'un appel**, valeur écrite au registre AVANT
  la bascule, **remise et vérifiée par requête**.* ⭐ Et **la tuile du push ne naît pas** non plus :
  elle porte un lien, donc elle lit sa porte — dans le module partagé, jamais au site d'appel.
- [x] **C6L3-21 · ⭐ LA SERVER ACTION EST VIVANTE — prouvé PAR UN CLIC dans un navigateur.** Session
  élève mintée, clic sur « Demander un exercice de plus », réponse rendue à l'écran. ⛔ *C'est le
  seul chemin que la couture contourne, et c'est celui où `export type` dans un `'use server'`
  tuerait tout le module en silence.*
- [x] **C6L3-22 · Les quatre états de l'offre, VUS À L'ÉCRAN.** *(a)* ouverte au bilan · *(b)*
  `semaine_en_cours` — « Quand tu auras fini les exercices de ta semaine… » · *(c)* `un_a_la_fois`
  — « Tu as déjà un exercice en plus à faire… » · *(d)* le refus après le clic. ⛔ **Aucun état ne
  se tait.**
- [x] **C6L3-23 · ⭐ UN DÉFAUT TROUVÉ À L'ŒIL, ET PAR RIEN D'AUTRE.** Le récapitulatif annonçait
  **« Argumentation · 3 exercices »** quand la frise, deux blocs plus haut, disait **« 1 exercice
  fait SUR 2 »** — *deux nombres, même écran, même ensemble, et pas d'accord.* Les deux fonctions
  étaient justes séparément ; `tsc`, 1888 tests et 43 contrôles de couture passaient. **Corrigé et
  re-vérifié à l'écran** *(`competencesDeLaSemaine` ne compte plus le bonus ; la compétence reste
  dans la liste pour le BILAN, qui, lui, compte le bonus comme n'importe quel exercice)*.
- [x] **C6L3-24 · La tuile du push tient à largeur MOBILE.** *Preuve : à l'écran, 375 px — « Un
  exercice en plus ? » n'est pas tronqué.* ⭐ Le nom a été choisi COURT exprès : le mécanisme de
  troncature est celui de `C7-L2`, partagé par toutes les tuiles, et le corriger n'était pas de ce
  lot.
- [x] **C6L3-25 · La migration, sandbox PUIS prod, avec sa répétition à blanc des deux côtés.**
  *Preuve : `SUIVI_SQL.md` — corps extrait du fichier (2554 octets, sans `begin;` ni `commit;`),
  transaction annulée, quatre drapeaux à `t`, **retour vérifié par requête** et non sur le mot
  `ROLLBACK`.*

### Ce qui reste à jouer en recette, avec sa condition de reprise

- [ ] **C6L3-26 · ⛔⛔ LE CLIC QUI SERT VRAIMENT UN EXERCICE, DANS UN NAVIGATEUR.** Le clic a été
  fait et l'action a répondu — mais **par un refus** : le bac à sable met la **semaine courante au
  segment 1** *(Semestre 1 ouvert le 2026-08-24)*, qui est **hors routage**, et l'offre ne
  s'affiche que sur la semaine **EN COURS**. *La voie serveur, elle, est prouvée par la couture, qui
  a joué sur un cycle du segment 2.* **Condition de reprise : dès le lundi 2026-08-31, la semaine
  courante passe au segment 2 — refaire le décor d'écran et cliquer.**
- [ ] **C6L3-27 · ⚠️ `competences_mesures.bonus` ÉCRIT PAR LA CHAÎNE ELLE-MÊME.** La recette a
  exercé le **vrai** `lireContexte` et le **vrai** `ecrireMesure`, et **reproduit à l'identique**
  la ligne qui les relie *(`bonus: ctx.bonus`, `chaine.ts`)* — mais cette ligne vit dans un étage à
  **deux appels froids**, et **aucun appel de modèle n'a été payé**. **Condition de reprise : une
  copie réelle passée en file avec `chaine_actif` à ON ; la mesure écrite doit porter `bonus =
  true` si son dépôt vient du pull.**
- [ ] **C6L3-28 · ⚠️ LE PUSH EN PRODUCTION — il est muet en recette et parlant en prod.** Le bac à
  sable porte **102 niveaux dont la lettre est NULLE** *(0 lettre réelle)* ; la production en porte
  **149 réelles**. *« Une compétence sans lettre n'est ni ciblable ni sondable »* — le décor a donc
  dû **emprunter une lettre** pour faire naître la tuile. **Condition de reprise : ouvrir le
  tableau de bord d'un élève de production dont une compétence `evaluee` est à C ou moins et sans
  mesure depuis trois cycles ; la tuile doit naître seule.**
- [ ] **C6L3-29 · ⚠️ LE DÉROULÉ À SIX TEMPS OUVERT DEPUIS UN DÉPÔT BONUS.** La couture prouve que le
  dépôt est posé, `assigne`, et lié à sa décision ; **le clic sur la ligne n'a pas été fait sur un
  bonus servi par le pull** *(le décor d'écran pose des dépôts `clos`)*. **Condition de reprise :
  après C6L3-26, cliquer la ligne « demandé en plus » et vérifier que le temps 1 s'ouvre comme pour
  n'importe quel exercice.**
- [x] **C6L3-30 · ⛔⛔ CE QUE LA COUTURE A RÉVÉLÉ, ET QUI N'EST PAS DE CE LOT — ✅ FERMÉ LE 28/08,
  HORS LOT, SUR ARBITRAGE DE LOUIS.** **La réponse est « borner le vivier »** *(l'autre branche —
  retirer `visibleDansLaClasse` sur les dépôts d'origine `routeur` — est écartée : elle casse
  « dans les modules on reste PAR CLASSE », `01-` §2, à l'écran de l'élève)*. **Un sixième filtre**,
  motif **`classe_autre`**, à `utils/moteur/vivier.ts`, **posé après `lieu_classe`** — une passation
  en classe sort toujours par son vrai motif. ⛔ **Le NULL entre TOUJOURS** : il est le cas ordinaire
  *(seul `assignerALaClasse` écrit la colonne)*, et l'écarter viderait le vivier en entier — même
  lecture que `visibleDansLaClasse`, tranchée à C4-L6. **Le contexte reçoit l'UNION des inscriptions
  actives** : un bi-classe reçoit ce qui est donné à l'une OU à l'autre.
  ⭐ **La contre-épreuve, sur données réelles et en lecture seule** : le filtre retire **37 couples
  (élève × instance) sur 7 531 en bac à sable — 0,49 %** — et **ZÉRO en production**, dont les
  **247** instances de maison servables portent toutes un `classe_id` NULL. *Le défaut n'avait donc
  encore rien produit : `routeur_decisions` était à 0 en prod, et aucun dépôt invisible n'existait à
  réparer.* ⚠️ **Ce qui l'armait n'était pas le calendrier mais le GESTE du professeur** — le premier
  clic sur « Assigner à la classe » d'un exercice de maison.
  **Preuves** : `npm test` **1893 / 1893** *(+5 vecteurs : l'autre classe, la sienne, le NULL, le
  bi-classe, et l'ordre des motifs)* · `npx tsc --noEmit` silencieux · `eslint` sur les cinq fichiers
  touchés, rien. **Aucune migration, aucune ligne au `SUIVI_SQL.md`** — la colonne existe depuis
  C4-L1. ⚠️ **Et la question de source reste ouverte** : le `07-` §1.1 ne dit toujours pas ce que
  `classe_id` VEUT DIRE. Le filtre est un arbitrage, et **la portée choisie à l'assignation** est
  déposée à `IDEES_post_rentree.md` — le filtre est cette idée avec le réglage câblé, et la même
  ligne lira la colonne le jour où la case existera.
  *(Énoncé d'origine, pour mémoire :)*
  `constituerLeVivier` **ne filtre pas par `classe_id`**, quand `exercicesMaisonDeLEleve` filtre par
  `visibleDansLaClasse` : le routeur peut assigner à un élève une instance d'une classe **où il
  n'est pas inscrit**, et **le dépôt n'apparaît sur aucun de ses écrans** — tout en comptant au
  dénominateur d'assiduité. ⚠️ **Le défaut vaut pour la POSE HEBDOMADAIRE de `C4-L12` autant que
  pour le bonus.** *Mesuré : 1 dépôt invisible sur 4 chez l'élève de recette ; le script le
  recompte sur toute la base à chaque passage (section L).* **Déposé à la boîte de `C4-L12`
  (`PLAN_DE_CHANTIER.md` §5). Condition de reprise : ce lot-là, qui doit choisir entre borner le
  vivier et retirer la garde de classe sur les dépôts d'origine `routeur`.**
- [ ] **C6L3-31 · ⚠️ LE BILAN REND UN TITRE DE COMPÉTENCE NU quand rien n'est mesuré.** Vu à l'œil :
  « Argumentation » seul dans sa carte. ⛔ **Le bilan est de `C6-L2`**, clos, et le prompt
  interdisait d'y toucher. **Déposé à `IDEES_post_rentree.md`. Condition de reprise : n'importe quel
  passage sur l'écran de la semaine avec une copie non encore mesurée.**

---

## Campagne C — RLS et exposition élève (revue par axe, contre le tag `revue-c-rls`, 29/08/2026)

_Revue par EXÉCUTION, jamais par lecture seule. **6 agents, une phase de fan-out, tri fait à la
main.** Le fait qui commande tout : **25 fichiers du chemin élève sur 81 appellent
`createAdminClient()`** — le client service-role, qui contourne RLS. Sur ces chemins, la seule
protection est le filtrage que le code s'impose. La question n'était donc pas « les policies
sont-elles bonnes » mais « chaque lecture/écriture service-role se borne-t-elle à cet élève ? »._

_**61 constats, 47 déclarés sains avec leur raison, 14 chauds triés.** Chaque défaut retenu a été
ÉPROUVÉ sur la donnée réelle du bac à sable, dans la peau d'un élève (session mintée par
`generateLink`, aucun mot de passe) ou en rejouant le vrai code. Trois défauts réels ; trois
corrigés le jour même._

### ✅ Corrigés le 29/08

- [x] **C-RLS-1 · ⛔⛔ ÉCRITURE CROISÉE — un élève fabrique une accusation de collage sur le dépôt
  d'un AUTRE.** `app/passation/actions.ts` `actionCollageBloque` appelait
  `journaliserCollageBloque(admin, depotId, userId)` **sans vérifier la propriété du dépôt** ; la RPC
  `journaliser_collage` écrit `where id = p_depot_id`, sans filtre (`c4_l4_collage_journal.sql:93`).
  **Sa jumelle du déroulé (`app/deroule/actions.ts:151`) portait déjà la garde** — `lireDepotMaison`
  puis `if (!depot) return` —, la passation ne l'avait pas.
  ⭐ **ÉPROUVÉ EN BASE, PUIS RESTAURÉ** : la RPC appelée avec le `depot_id` d'un autre élève a
  **ajouté `{moyen:"raccourci", at}` à son `collages_bloques`**, que le professeur lit comme une
  triche (`utils/passation/vues.ts:122`). État d'avant remis dans le même script *(constat AVANT →
  écriture → constat APRÈS → restauration → constat final `[]`)*.
  ⭐ **Correctif** : `const d = await lireDepot(admin, depotId); if (!d || d.eleve_id !== userId)
  return` — le patron exact de la maison. **Épreuve par l'échec avant le succès** : mon dépôt passe
  `true → true`, celui d'un autre `true → false`. **Coût : une accusation d'intégrité à charge, au
  nom d'un tiers.**
- [x] **C-RLS-2 · ⛔ LECTURE AVANT LA GARDE — `actionCredence` révèle le cran et le geste de
  l'instance d'un autre élève.** `app/passation/actions.ts` `actionCredence` appelait
  `offreCredence(admin, depotId)` **avant** toute vérification de propriété ; la garde
  `d.eleve_id !== eleveId` ne venait que dans `enregistrerCredence`, plus bas. Le `motif` retourné
  porte le cran et le geste, et distingue un dépôt réel d'un id bidon (« périmètre illisible » —
  oracle d'existence).
  ⭐ **ÉPROUVÉ** en rejouant `offreCredence` sur 8 dépôts d'autres élèves : **`servie=true`, forme et
  cas exposés** à chaque fois ; un id inexistant rend « périmètre illisible ». ⚠️ **Ce qui fuit est
  une MÉTADONNÉE de l'exercice** — cran, geste, forme —, **jamais la copie, la transcription ou le
  retour.** Coût réel mais mince ; je ne le gonfle pas.
  ⭐ **Correctif** : `lireDepot` + `eleve_id !== userId` posé **avant `offreCredence`**.
- [x] **C-RLS-3 · ⚠️ `soumettreQuizz` note le quizz Y avec la session d'un quizz X.**
  `app/eleve/modules/quazian/quizz/[quizId]/actions.ts` : le verrou vérifiait que la SESSION est à
  l'élève (`.eq('eleve_id', userId)`) mais **jamais qu'elle appartient au `quizId` noté**. Un élève
  pouvait appeler `soumettreQuizz(sessionDUnQuizX, Y)` : questions de Y, réponses de X, aucune ne
  correspond → note « tout non répondu » qui **écrase** sa note de Y. ⛔ **Non éprouvé en base — il
  n'y a AUCUN quizz dans les deux bases** *(0 en sandbox, 0 en prod)* ; le défaut est lu, pas tiré.
  ⭐ **Correctif** : un `.eq('quiz_id', quizId)` de plus au compare-and-set.

### ⚠️ Fuite RÉELLE dans le code mais INERTE aujourd'hui, faute de données — à surveiller

- [x] **C-RLS-4 · ⛔ QUAZIAN — la bonne réponse est lisible avant de répondre, par DEUX chemins.**
  ✅ **FERMÉ LE 29/08** *(`72561ce` + `c_rls_4_quazian_reponse.sql`, joué **sandbox ET prod**)*.
  *(a)* `initialiserSession` servait `indexCorrecteRandomise` dans la charge de la passation ;
  *(b)* les policies de SELECT de `quazian_questions` autorisaient un `select index_correct` PostgREST
  direct. **Un élève lisait le corrigé complet avant de composer, note 20/20.**
  ⭐ **ÉPROUVÉ AVANT D'ÊTRE CORRIGÉ**, dans la peau d'un élève réel *(clé anon + JWT)* :
  `scripts/recette/rls-quazian-c-rls-4.mjs` — **3 FAIL / sortie 1 avant, 4 PASS / sortie 0 après**,
  les 5 questions rendant leur réponse puis 0 ligne.
  ⛔⛔ **LA MESURE A TROUVÉ PLUS LARGE QUE LE CONSTAT : il y avait DEUX policies, et la pire ne
  vérifie pas la classe.** `eleve_read_questions_actifs` ne demande que « le quizz est lancé » ET
  « je suis un élève » : **n'importe quel élève lisait les réponses de n'importe quel quizz de la
  plateforme**. Les policies permissives étant **OR'ées**, le contrôle de classe de
  `quazian_questions_eleve_classe` ne servait à rien — *et n'en retirer qu'une n'aurait rien fermé.*
  ⛔ **ET LA NOTE D'INERTIE DE CE CONSTAT ÉTAIT FAUSSE POUR LE BAC À SABLE** : les 5
  `quazian_questions` n'étaient pas orphelines — elles pendent au quizz `ferme` `72fe18d6`, que la
  policy couvrait. **0 quizz** ne valait que pour la **PRODUCTION** *(re-mesuré le 29/08 : 0 quizz,
  0 question)*. *Une inertie se mesure base par base.*
  ⭐ **Pas de `revoke` de colonne** : prof et élève partagent le rôle `authenticated`, et le
  diagnostic du professeur LIT `index_correct` — un `revoke` l'aurait aveuglé ; et **une policy RLS
  ne restreint pas les colonnes**. Les deux policies élève sont donc **retirées**, et les trois
  lectures d'`app/eleve/…/quizz/[quizId]/actions.ts` passent au **client admin derrière
  `chargerQuizAccessible`, qui vérifie LA CLASSE** — la garde est plus stricte qu'avant.
  ⭐ Le champ `(a)` **n'était lu nulle part** : son commentaire annonçait « pour le retour
  post-quizz », mais le retour passe par `chargerRetourQuizz` *(soumis ET quizz fermé)*. Suppression
  pure, `tsc` propre, `npm test` **1929/1929**.
  ✅ **LE SMOKE ÉLÈVE EST JOUÉ — 29/08, au navigateur, sur un quizz `lance` de décor**
  *(`scripts/recette/decor-quizz-lance.mjs`, semé puis retiré, base revenue à l'identique :
  1 quizz · 5 questions · 1 session · 5 réponses · 1 note)*. Les quatre fonctions à **zéro
  passage** ont tourné : création de session, `sauvegarderReponse`, `soumettreQuizz`, et le
  retour. Note posée **14,35/20**, dé-randomisation vérifiée en base *(l'écran montrait C=50,
  la base porte `p_b=0.5`, l'index d'origine de la bonne réponse)*.
  ⭐⭐ **ET LA PREUVE DU CHEMIN 1 CESSE D'ÊTRE UN `grep`** : **79 Ko** de page et de scripts
  inspectés dans le navigateur, **zéro occurrence** de `indexCorrecteRandomise`, `index_correct`
  ou `indexCorrect`. *La sonde disait « le texte du fichier ne porte plus la colonne » ; le
  navigateur dit « la charge servie ne la porte pas ».*
  ⛔⛔ **ET LE SMOKE A TROUVÉ CE QU'AUCUN TEST NE VOYAIT** — voir `C-RLS-4-bis` ci-dessous.

- [x] **C-RLS-4-bis · ⛔ CE QUE LE SMOKE A TROUVÉ — trois défauts que `tsc` et `npm test` ne
  pouvaient pas voir, tous ANTÉRIEURS au correctif C-RLS-4.** ✅ **Corrigés le 29/08.**
  **(1) `soumettreQuizz` posait `submitted_at` AVANT de lire les questions.** Une lecture en échec
  laissait l'élève « soumis », **sans note**, devant un écran de succès — et le compare-and-set
  `.is('submitted_at', null)` lui interdisait de recommencer. La lecture remonte **avant** le
  verrou *(aucune course : les questions d'un quizz ne bougent pas ; les réponses, si — leur
  instantané a besoin du verrou, alors leur échec le RELÂCHE)*. ⭐ **Éprouvé par l'échec** : en
  retirant ses questions au quizz sous les pieds de l'élève, le serveur refuse et
  **`submitted_at` reste NULL, aucune note écrite**.
  **(2) Les trois lectures ne capturaient aucun `{ error }`.** `supabase-js` ne lève pas : un
  retour vide était **muet**, et « Aucune question trouvée » s'affichait pour ce qui était une
  panne de lecture. Les deux cas se disent désormais séparément.
  **(3) ⛔⛔ ET LE CLIENT JETAIT LE RETOUR DE L'ACTION** — `await soumettreQuizz(...)` puis
  `setSoumis(true)` **sans condition** *(`PassationJetons.tsx`)*. **Mesuré au navigateur : le
  serveur refusait correctement et l'écran affichait « Quizz soumis ! ».** L'élève serait parti.
  ⭐ *Une garde serveur qui refuse en silence ne protège que la base.* L'écran porte maintenant le
  motif du refus et l'élève reste sur son quizz — contre-épreuvé.
  ⭐ **La garde `length === 0` manquait ici alors qu'elle existe dans `fermerQuizz`** *(contre le
  `NaN` de `scoreMoyen /= questions.length`)* — **et elle ne POUVAIT pas s'y trouver** tant que la
  lecture venait après le verrou : il était déjà trop tard pour refuser.


### ⚠️ À éprouver — gardes absentes dont le coût ou l'exploitabilité restent à mesurer

- [ ] **C-RLS-5 · `fragments_depots` — l'UPDATE élève est ouvert : il blanchit ses propres marques
  d'anti-triche.** `c1_rls_eleve.sql:144` pose `using auth.uid()=eleve_id` **sans `with_check` ni
  restriction de colonnes** — l'élève peut `PATCH` `photos_suspectes=false`, `signal_integrite=null`
  sur SA ligne. ⚠️ Il ne lit rien d'autrui ; il efface une trace le concernant. **Le report est
  DOCUMENTÉ dans le SQL** (« Module MASQUÉ »). ⚠️ Fragments est-il masqué en prod ? à mesurer avant
  de statuer.
- [x] **C-RLS-6 · `profiles` — la policy INSERT n'interdit pas `role='prof'`.** ✅ **FERMÉ LE 29/08**
  *(`c_rls_6_profiles_insert.sql`, **les deux bases**)* — la policy est **retirée**, pas amendée.
  ⭐⭐ **Le geste était GRATUIT, et c'est la mesure qui l'a montré** : sur **162 occurrences** de `from('profiles')`,
  exactement **3 insert**, **tous sur `createAdminClient()`**, **0 upsert**. La policy ne servait **aucun** chemin.
  ⭐⭐ **Cycle de preuve complet sur un compte orphelin réel** *(`scripts/recette/epreuve-escalade-profiles.mjs`)* :
  refusé (`42501`, 0 profil lu) · rollback joué en bac à sable → **escalade RÉUSSIE, 19 profils lus** · refermé.
  ⛔ **Le dépôt affirmait le contraire** : `securite_handle_new_user_retrait.sql:51-55` disait la policy nécessaire.
  ⚠️ **Et la porte d'entrée n'est PAS dans le dépôt** : `disable_signup` est **false en bac à sable**, **true en prod**
  — un bouton du tableau de bord Supabase, zéro occurrence au dépôt. **Le correctif mure la porte quel qu'en soit
  l'état**, ce qui est tout son intérêt. ✅ **0 compte orphelin** dans les deux bases au moment du geste.
  `c1_rls_eleve.sql:64` est `with check (auth.uid() = id)` : borne l'identité, jamais la valeur de
  `role`. Un compte auth **sans ligne `profiles`** pourrait s'insérer `role:'prof'` et entrer dans
  `/prof`. ⚠️ **Condition d'existence à mesurer** : le trigger `handle_new_user` qui créait la ligne
  a été retiré (`securite_handle_new_user_retrait.sql`) — combien de comptes auth sans profil ?
  L'affirmation « plus aucun chemin applicatif n'insère » est à confirmer. **Correctif : `and role =
  'eleve'` au `with_check`.**
- [x] **C-RLS-7 · Chat du tuteur — le contrôle de module est l'UNION des classes, pas LA classe.**
  ✅ **FERMÉ LE 29/08** — `app/api/scriptorium/chat/route.ts` : `slugsModulesAccessibles(user)` devient
  `classeAModule(classeId, 'scriptorium')`, l'outil écrit le 14/08 pour cette question exacte et déjà employé par
  trois actions prof. **Les deux gardes restent distinctes** — « cette classe a-t-elle le module » ET « cet élève y
  est-il inscrit ». **Aucune migration.**
  ⭐⭐ **ÉPROUVÉ SUR LA DONNÉE RÉELLE DE PRODUCTION, en lecture seule** — les deux prédicats rejoués sur le seul
  élève exploitable *(Eléonore Delprat : THLP **a** Scriptorium, « Hors classe » **ne l'a pas**)* :
  **ancienne garde → PASSAIT · nouvelle → REFUSE**, et l'inscription reste vérifiée, donc c'est bien le premier
  prédicat qui tranche. *(2 élèves bi-classe en prod ; l'autre a le module dans ses deux classes.)*
  ⛔ **Le constat sous-décrivait la conséquence : ce n'est pas qu'une lecture.** Passé la garde, la route **crée**
  une conversation portant ce `classe_id`, **consomme le quota**, **appelle le modèle** et **inscrit un coût**
  attribué à une classe à qui le prof avait refusé le module — le tout par le client admin, RLS hors jeu.
  ⚠️ **Ce qui le rendait inerte n'était pas une garde** : **0 parcours assigné** à « Hors classe », donc la route
  mourait trois lignes plus loin sur un message pédagogique *(409, « aucun parcours daté »)*. **Une inertie qui
  tient à une configuration de données que deux clics du professeur défont.**
  ✅ **SMOKE JOUÉ LE 30/08, SUR LA ROUTE RÉELLE, avec la session élève de Louis** *(`eleve1@test.com`,
  bac à sable, serveur de dev)*. **Chemin légitime** *(T5, qui a le module et 2 parcours)* : **`HTTP 200` en
  4,3 s**, réponse ancrée sur le parcours « Introduction à la philosophie ». **Aucune régression.** Écritures
  vérifiées par requête : **+1 conversation** portant le **bon `classe_id`**, **+2 messages**, **+1 `api_couts`**
  — `gemini-3.5-flash-lite`, 1525→98 jetons, **0,0007 USD**, attribué à T5 et au bon élève.
  **Chemin de refus** *(une classe où il n'est pas inscrit)* : **`HTTP 403`**, message propre, et **rien n'a été
  écrit ni facturé** — conversations et `api_couts` inchangés : **la garde tire AVANT le modèle**.
  ⭐ **Contre-épreuve faite en amont, sous la VRAIE RLS et en PRODUCTION** *(identité réelle d'Eléonore, en
  transaction annulée)* : THLP → `true`, « Hors classe » → `false`, 5 modules lisibles. ⛔ **Ce contrôle-là était
  indispensable** : `classeAModule` lit `modules` et `classe_modules` **avec le client de l'ÉLÈVE**, alors que ses
  trois appelants d'origine sont des actions PROF — sans policy de lecture élève, la garde aurait refusé **tout le
  monde**. Elles existent : « Lecture modules authentifiés » et `classe_modules_eleve_read`.
  ⚠️ **Non couvert en bac à sable** : le cas du défaut lui-même *(élève inscrit dans une classe SANS le module)* —
  aucune configuration ne l'offre ici, et elle n'existe **qu'en production**. Elle a été éprouvée en SQL, pas par
  la route.
  ⚠️ **Reste ouvert, distinct et plus large** : la route ne teste jamais `modules.actif`, là où ses deux sœurs
  Quazian et Codex le font. Éteindre `scriptorium` globalement retirerait la tuile **sans fermer la route** —
  et `classeAModule` ne le teste pas non plus, donc le manque vaut aussi pour ses trois autres appelants.
  `app/api/scriptorium/chat/route.ts:53` vérifie « une de tes classes a-t-elle Scriptorium ? », pas
  « celle-ci l'a-t-elle ? ». Un élève bi-classe reçoit le corpus d'une classe où Scriptorium n'est
  pas donné. **Ce n'est pas la donnée d'un autre élève** — c'est un cours d'une classe où il est
  inscrit. Coût : accès à un module non donné à cette classe. Décision « Accès par classe » à
  appliquer.
- [ ] **C-RLS-8 · `garderEleve` authentifie mais ne vérifie pas le rôle.**
  `utils/passation/garde.ts:52` fait `getUser()` puis passe au client admin sans lire
  `profiles.role` ; son jumeau `garderEleveDeroule` le fait. ⚠️ **Aucun scénario de fuite
  aujourd'hui** : toutes les actions du fichier sont ensuite bornées à `userId`. Défaut de
  confiance-de-rôle qui coûterait dès la première action prenant une autre borne. **Correctif :
  aligner sur `garderEleveDeroule`.**
- [ ] **C-RLS-9 · `/eleve/calendrier` — un quizz dont la classe a été effacée n'est écarté par aucun
  code.** `utils/calendrier-evenements.ts:87` ne borne pas par classe, là où la source Codex du même
  fichier fail-close (ligne 135). Un `classe_id` passé à NULL (`fix_effacer_classe.sql:92`) ferait
  apparaître une pastille datée « Quizz » — sans titre — chez un élève d'une autre classe, **si la
  RLS ne le retient pas**. Coût minuscule (le mot « Quizz » + une date). À éprouver contre la RLS
  réelle.

- [x] **C-RLS-12 · ⛔⛔ FRAGMENTS — UN RE-DÉPÔT DÉTRUISAIT LES PHOTOS DU PRÉCÉDENT, SANS RETOUR
  POSSIBLE.** ✅ **Corrigé le 29/08.** ⚠️ **Trouvé en mesurant C-RLS-5, et il n'était dans AUCUN des
  cinq constats de la campagne.**
  **La chaîne, vérifiée de bout en bout** : `deposerCompteRendu` prend le client **élève**
  *(`verifierEleve()`)* ; sur un re-dépôt il effaçait **d'abord** les photos du Storage, **puis**
  supprimait la ligne — or la **seule policy DELETE de `fragments_depots` est `est_prof()`**.
  Mesuré : **`DELETE 0`, aucune erreur levée** *(supabase-js ne lève pas)*, **et le retour n'était
  pas lu**. La contrainte `UNIQUE (inscription_id, semaine_id)` refusait alors le nouveau dépôt —
  cette erreur-là, elle, était lue — donc **l'élève voyait une erreur, son ancien dépôt survivait,
  et ses photos étaient déjà détruites**, la ligne pointant vers des fichiers absents.
  ⭐ **Le correctif est l'ORDRE et le CLIENT, pas la cascade** : on supprime d'abord ce qui est
  **réversible** (la ligne, par le client admin, gardée par `.eq('eleve_id', userId)`), et seulement
  ensuite ce qui ne l'est pas (les fichiers). *La doctrine que `fermerQuizz` écrit déjà pour le
  professeur.* Le retour du Storage est capturé : un échec laisse des fichiers orphelins, jamais
  une destruction, et le dépôt aboutit.
  ⭐ **ÉPREUVE EN TRANSACTION ANNULÉE, trois temps** : ancien chemin *(rôle `authenticated`, RLS)*
  **DELETE 0** · nouveau *(admin + garde)* **DELETE 1** · **contre-épreuve** avec un autre
  `eleve_id` **DELETE 0** — le client admin n'est pas un passe-droit. Retour vérifié PAR REQUÊTE.
  ⚠️⚠️ **IL N'A JAMAIS TIRÉ, ET IL ÉTAIT À VINGT-QUATRE HEURES DE LE FAIRE** : **0 dépôt en prod**,
  1 en bac à sable — mais la **première échéance est le `2026-08-31 03:59 UTC`**, semestre actif
  depuis le 24/08, et **40 des 62 élèves** ont Fragments *(1HLP 24 + THLP 16)*. Il tire au premier
  re-dépôt. ⛔ **Aucune migration** : la policy DELETE prof-only est correcte, c'est le code qui
  l'ignorait.

### 📋 Dette d'outillage relevée par la campagne — sans laquelle la revue ne se referme pas

- [ ] **C-RLS-10 · La carte des policies ne se dresse PAS depuis le dépôt** : **22 des 89 tables du
  chemin élève** n'ont aucune déclaration RLS traçable dans les 147 `.sql` (dont les 14 tables de
  Fragments, `profiles`, les tables de révision Quazian). ⚠️ Les `.sql` disent l'INTENTION, pas
  l'état. **Ces 22 tables sont celles à mesurer EN PREMIER par une sonde** — aucun document ne s'y
  substitue.
- [ ] **C-RLS-11 · `scripts/verif_rls_c1.mjs` éprouve 8 tables sur 89**, et son test d'escalade
  `profiles` insère un id ALÉATOIRE (≠ `auth.uid()`), donc **rate précisément le cas dangereux** de
  C-RLS-6. La sonde à écrire doit couvrir les 22 tables non déclarées et refaire le test d'escalade
  avec le VRAI `auth.uid()`.

### ✅ Vérifiés SAINS et notés pour ne pas les re-soulever

- **La zone des écrans neufs (C6-L2/L3) n'a AUCUN segment de route dynamique** — pas un `[depotId]`,
  pas un `[id]`. Les seuls `searchParams` (`?cycle`, `?date`, `?vue`) sont des fenêtres temporelles
  validées par regex, jamais des identifiants d'objet. Le piège IDOR n'a pas de site où se poser.
- **Le moteur maison (`utils/passation/depots.ts`) porte la garde partout** : `lireDepot` +
  `if (d.eleve_id !== eleveId) return refus(...)` sur `validerLaTranscription`,
  `enregistrerLaTranscription`, et les quatre autres. C'est de LÀ que le patron des correctifs 1-2
  est repris.
- **`utils/supabase/admin.ts` sans `import 'server-only'` : ZÉRO chemin d'un `'use client'` vers
  lui**, mesuré sur le graphe d'imports complet. Et la clé n'a pas le préfixe `NEXT_PUBLIC_`, donc
  elle serait `undefined` dans le navigateur même si un import fuyait. Un `import 'server-only'`
  reste une ceinture bon marché, mais aucune fuite aujourd'hui.
- **`/eleve/integrite`** filtre au `statut='confirme'` et sert la preuve en mode `slim` (jamais les
  photos, le texte, ni un lien `/prof/`). Composant serveur : `eleveId` et `source` ne sont pas
  sérialisés vers le navigateur.
