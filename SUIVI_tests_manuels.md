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
- [ ] **C11a-7 · Quazian.** Création d'un quiz → ligne `quazian` avec `classe_id`, jamais d'`eleve_id`. _(**Reporté le 26/07 → C7** — la création de flashcards/quiz est cassée en sandbox depuis le 24/07 ; C7 commence par la remise en marche.)_
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
