# Diagnostic — la lenteur côté élève (mesuré en prod le 17/09/2026)

> Mesures prises depuis Montréal, dans Chrome, avec le compte de décor d'Élo, sur `palimpseste.ink`.
> Aucune écriture en prod ; seuls des exercices déjà terminés ont été ouverts. Lectures serveur :
> observabilité Vercel (7 jours), `pg_stat_statements` de la prod en transaction lecture seule,
> réglages Supabase. Les comptes d'allers-retours viennent de la lecture du code, pas de l'exécution.

## 0. État courant — le Lot 0 est DÉPLOYÉ et remesuré (17/09)

Les fonctions tournent maintenant en `pdx1` (vérifié dans l'en-tête : `x-vercel-id: yul1::pdx1::…`).
Même protocole et même compte qu'au §1, serveur chaud. La valeur est la fin d'arrivée du document.

| Écran | Avant (`iad1`) | Après (`pdx1`) |
|---|---|---|
| Tableau de bord | 5,9 – 7,8 s | **3,4 – 3,5 s** |
| Ma semaine | 5,5 s | **1,8 s** |
| Vestigia | 4,6 s | **1,9 s** |
| Calendrier | 4,1 s | **2,1 s** |
| Moi | 3,6 s | **1,0 s** |
| Quazian | 3,5 s | **1,7 s** |
| Scriptorium | 3,0 s | **2,3 s** |
| Intégrité | 1,4 – 3,1 s | **0,8 s** |
| Codex (liste) | 2,6 s | **0,9 s** |
| Aletheia (liste) | 2,2 s | **1,3 s** |
| Un exercice terminé | — | 3,4 s |
| Clic « Tableau de bord » depuis un exercice | 8,9 s | **3,0 s** |

**Ce qui reste**

- Un saut en série coûte encore environ 70 ms : l'accueil fait 42 sauts pour 3,4 s. La passerelle
  Supabase a donc un coût propre même à côté de la base. La profondeur en série (Lots 1 à 5) reste
  le levier à travailler.
- Le plancher du premier octet est de 0,55 à 0,85 s.
- Le premier appel juste après le déploiement a pris 2,9 s. C'était un démarrage à froid, non rejoué ensuite.

**À regarder à l'œil** : l'événement `load` tombe environ 2 s après la fin du document sur toutes les
pages, avant comme après. Mon onglet était en arrière-plan, et Chrome y bride les minuteurs. C'est
probablement un artefact de mesure et non une attente réelle.

## 0 ter. Lot 1 DÉPLOYÉ et remesuré (17/09, commit `9c2856e`)

Même protocole et même compte qu'avant. La valeur est la fin d'arrivée du document, serveur chaud.

| Écran | `iad1` | Lot 0 | **Lot 1** | Premier octet, lot 0 → lot 1 |
|---|---|---|---|---|
| Tableau de bord | 5,9–7,8 s | 3,4–3,5 s | **2,6–3,4 s** | 0,53–0,86 → **0,34 s** (1,1 s sur un tir) |
| Ma semaine | 5,5 s | 1,8 s | **1,2 s** | 1,40 → 0,73 s |
| Vestigia | 4,6 s | 1,9 s | **1,6 s** | 0,75 → 0,42 s |
| Calendrier | 4,1 s | 2,1 s | **1,9 s** | 1,05 → 0,83 s |
| Moi | 3,6 s | 1,0 s | **0,9 s** | 0,61 → 0,41 s |
| Quazian | 3,5 s | 1,7 s | **1,5 s** | 0,85 → 0,45 s |
| Scriptorium | 3,0 s | 2,3 s | **1,8 s** | 1,31 → 0,87 s |
| Intégrité | 1,4–3,1 s | 0,8 s | **0,5 s** | 0,68 → 0,36 s |
| Codex (liste) | 2,6 s | 0,9 s | **0,9 s** | 0,64 → 0,44 s |
| Aletheia (liste) | 2,2 s | 1,3 s | **1,1 s** | 0,66 → 0,43 s |
| Un exercice terminé | — | 3,4 s | **3,0 s** | 0,85 → 0,60 s |
| Clic « Tableau de bord » depuis un exercice | 8,9 s | 3,0 s | 3,0 s | |

La navigation et les modules s'affichent : la requête embarquée passe en prod avec le jeton d'Élo.

**Ce qui reste.** L'accueil et la page d'exercice sont encore autour de 3 s. Le Lot 2 traite la page
d'exercice, le Lot 3 l'accueil.

## 0 decies. BILAN — les cinq lots DÉPLOYÉS et remesurés (17/09) — ÉTAT COURANT

**Protocole.** Pour cette dernière mesure, chaque page est chargée par `fetch` depuis une page déjà
ouverte : un tir de chauffe, puis trois tirs. Les tableaux précédents mesuraient une navigation
complète. Les deux se recoupent à environ 0,1–0,4 s près : Vestigia donne 1,25 s en navigation pour
0,87 s en `fetch`, le calendrier 1,24 s pour 0,91 s.

| Écran | Au départ (`iad1`) | **Maintenant** (médiane de 3 tirs) |
|---|---|---|
| Tableau de bord | 5,9 – 7,8 s | **1,6 s** |
| Ma semaine | 5,5 s | **0,6 s** |
| Vestigia | 4,6 s | **0,9 s** |
| Calendrier | 4,1 s | **0,9 s** |
| Moi | 3,6 s | **0,8 s** |
| Quazian | 3,5 s | **0,7 s** |
| Scriptorium | 3,0 s | **0,9 s** |
| Intégrité | 1,4 – 3,1 s | **0,4 s** |
| Codex (liste) | 2,6 s | **0,6 s** |
| Aletheia (liste) | 2,2 s | **1,0 s** |
| Un exercice terminé | non mesuré (3,4 s après le lot 0) | **1,7 s** |
| Une séance Aletheia | non mesurée | **1,4 s** après la suite A du 18/09 (2,0 s avant ; quatre séances 1,29 – 1,44 s) |

- Le premier octet est à 0,24 – 0,35 s presque partout. Il était à 0,85 s ou plus au départ.
- **Vu à l'écran en prod** : Vestigia s'affiche (thème, « à faire maintenant », semaine 4), et le
  calendrier affiche ses échéances.

**Ce qui reste, par ordre de poids**

1. **La séance Aletheia (1,4 s le 18/09, après la suite A).** La garde d'accès lit désormais en
   parallèle et le parcours ne se lit qu'une fois par rendu (`88116d8`). Ce qui reste est la
   préparation des fenêtres de relance et du retour final, une chaîne série qui lit le texte du livre.
2. **La page d'exercice (1,7 s).** `lireContexte` puis le chargeur gardent environ 15 lectures de
   profondeur.
3. **L'accueil (1,6 s).** La chaîne Aletheia (`livresPourClasse`) et les signaux pèsent encore.

**Hors lots**

- `assemblerEvenements` (calendrier) reste séquentiel. Il est partagé avec le côté professeur.
- Le passage gratuit de la base de Nano à Micro reste à décider par Louis.
- La charge d'une classe entière en simultané n'a pas été mesurée en prod. Au bac à sable, 90
  chargements simultanés de l'écran d'exercice passent sans erreur.

## 0 nonies. Lot 5 (Aletheia, Vestigia, calendrier, Scriptorium) — ce qui a changé (⚠️ état dépassé : déployé, voir 0 decies)

**Ce qui change**

- **Aletheia, sondage** : `etatDuRetourAletheia` lit le seul statut du travail. `PollStatut` ne re-rend
  plus la page à chaque tic (34 lectures toutes les 4 s avant). Les tics s'enchaînent, et un seul
  rendu a lieu quand l'attente finit. Si l'action lève (session perdue, travaux, déploiement), il
  rend la main au rendu, comme avant. Le capstone garde l'ancien rafraîchissement.
- **Aletheia, page de séance** : les lectures indépendantes partent ensemble. `OuvertureSeance`
  n'est monté que si `ouvert_at` est absent.
- **Rechargements** : 6 `router.refresh()` redondants sont retirés (4 formulaires Aletheia, dépôt
  Vestigia, thème). **Trois sont gardés, et c'est voulu** :
  - celui du dépôt d'essai, car son action crée « analyse en cours » dans `after()`, donc après le
    rendu qu'elle transporte ;
  - celui de la réinitialisation des photos, dont l'action ne revalide pas ;
  - celui de `ValidationLecture`, qui sert quatre actions différentes.
- **Vestigia** : les chaînes de la page partent ensemble, et les quatre blocs de l'état des onglets
  se lisent ensemble.
- **Calendrier et Scriptorium** : les lectures de page partent ensemble.

**Éprouvé**

- `tsc` est propre et les 2 685 tests passent.
- **39 écrans identiques** entre l'ancien et le nouveau code (13 pages × 3 contextes de classe,
  texte et identifiants).
- L'état des onglets Vestigia est identique, vu à l'écran.
- Le sondage a été joué pour de bon au bac à sable. La séance était mise « en attente » : un tic
  d'environ 300 ms toutes les 4 s, au lieu d'un rendu de 2,4 s. Au retour du statut, l'écran a
  basculé seul et le sondage s'est arrêté. La séance est restaurée, vérifié en base.
- Durées en local : Vestigia 2,0 → 1,05 s ; Scriptorium 1,3 → 0,9 s ; calendrier 2,2 → 1,7 s ;
  séance Aletheia 2,7 → 2,2 s.
- Passe adversariale : aucun défaut bloquant, trois points corrigés (les deux du sondage et le
  rechargement de l'essai rétabli).

**Non fait.** `assemblerEvenements`, l'agrégateur du calendrier, reste séquentiel. Il est partagé
avec le côté professeur : ce serait un lot à part.

**Non éprouvé.** Une vraie soumission Aletheia jusqu'au retour de l'IA, un dépôt Vestigia réel, la
proposition d'un thème.

## 0 octies. Lot 4 (Quazian) DÉPLOYÉ et remesuré (17/09)

**Mesures en prod**

| Écran | Avant le lot 4 | Après |
|---|---|---|
| Page Quazian, onglet Flashcards | 1,1 s (3,5 s au départ) | **0,7 – 1,1 s** (trois tirs à chaud : 0,93 · 1,13 · 0,72) |
| Page Quazian, onglet Quizz | non mesuré avant | 0,6 s |
| Accueil | 1,6 – 2,2 s | 1,3 – 1,9 s |

Le premier tir après le déploiement a pris 2,65 s (démarrage à froid).

**Vu à l'écran en prod.** La page Quazian affiche « 30 à réviser », « 43 cartes au total » et deux
tuiles de cours.

**Non mesuré en prod.** Noter une carte : ce serait écrire sur le compte d'Élo. En local, la note
passe d'environ 525 ms à environ 460 ms.

**Ce qui a changé**

- Un socle commun pour la file, la consultation et les compteurs, avec une version légère pour l'accueil.
- Les états FSRS sont lus par élève.
- Les lectures de `soumettreNote` partent ensemble.
- Les scores de quizz s'écrivent par paquets de six, et un échec est journalisé.
- Le `refresh` de « J'ai vu ma note » est retiré.

**À surveiller.** La ligne `[quazian] score par réponse NON ÉCRIT` dans les journaux Vercel, au
prochain quizz.

## 0 septies. Lot 3 DÉPLOYÉ et remesuré (17/09) — ⚠️ état dépassé, voir 0 octies

Même protocole et même compte qu'avant. La valeur est la fin d'arrivée du document, serveur chaud.

| Écran | Au départ (`iad1`) | Lot 0 | Lot 1 | Lot 2 | **Lot 3** |
|---|---|---|---|---|---|
| Tableau de bord | 5,9–7,8 s | 3,4–3,5 s | 2,6–3,4 s | 2,6 s | **1,6 – 2,2 s** (3 tirs : 1,6 · 2,2 · 1,65) |
| Ma semaine | 5,5 s | 1,8 s | 1,2 s | — | **1,05 s** |
| Vestigia | 4,6 s | 1,9 s | 1,6 s | — | 1,6 s |
| Calendrier | 4,1 s | 2,1 s | 1,9 s | — | 1,6 s |
| Moi | 3,6 s | 1,0 s | 0,9 s | — | 0,8 s |
| Quazian | 3,5 s | 1,7 s | 1,5 s | — | **1,1 s** |
| Scriptorium | 3,0 s | 2,3 s | 1,8 s | — | 1,6 s |
| Intégrité | 1,4–3,1 s | 0,8 s | 0,5 s | — | 0,5 s |
| Codex (liste) | 2,6 s | 0,9 s | 0,9 s | — | 0,7 s |
| Aletheia (liste) | 2,2 s | 1,3 s | 1,1 s | — | 1,2 s |
| Un exercice terminé | — | 3,4 s | 3,0 s | 1,6–2,2 s | 1,8 s |
| Clic « Tableau de bord » depuis un exercice | 8,9 s | 3,0 s | 3,0 s | — | **2,0 s** |

- Le premier tir juste après le déploiement a pris 4,7 s. C'était un démarrage à froid, non reproduit ensuite.
- **Vu à l'écran en prod** : l'accueil d'Élo porte la tâche Vestigia « Semaine 4 — à déposer avant
  dimanche 20 septembre ». Le bloc Vestigia avec une semaine ouverte tourne donc en prod, ce qui
  n'avait pas été éprouvé en local.
- **Vu à l'écran en prod** : « Mes mondes » suit l'ordre du menu (Vestigia, Scriptorium, Quazian,
  Codex, Aletheia).
- **Non vu** : des pistes sous la tâche Vestigia. Élo n'en a pas.

**Ce qui reste**

- Tous les écrans sont à 2,2 s ou moins.
- Les plus lents sont l'accueil (1,6 à 2,2 s), la page d'exercice (1,8 s), puis Vestigia, le calendrier
  et Scriptorium (1,6 s chacun). Ces trois derniers relèvent du lot 5.
- Les gestes Quazian (noter une carte) relèvent du lot 4 et n'ont pas été mesurés en prod.

## 0 sexies. Lot 3 (accueil et Ma semaine) — ce qui a changé (⚠️ état dépassé : déployé, voir 0 septies)

**Ce qui change**

- **`app/eleve/page.tsx`** : les blocs de l'accueil partent ensemble. Ce sont Vestigia (semaine, dépôt,
  thème, pistes), Codex, quizz, Aletheia, Quazian, le calendrier et les signaux. Chaque bloc garde ses
  lectures et ses gardes. Les résultats sont reversés dans l'ordre des inscriptions.
- **`app/eleve/modules/quazian/actions.ts`** : le compteur de cartes dues passe de 13 lectures en série
  à environ 7 de profondeur, avec la garde d'intégrité toujours lue en premier. Les trois bras de la
  visibilité des cartes partent ensemble, ce qui profite aussi à la page Quazian.
- **`app/eleve/semaine/page.tsx`** : le quota se lit en même temps que la semaine.
- **`utils/integrite.ts`** : `messageSiBloque` lit ses deux sources ensemble ; cette garde joue à chaque geste.
- **`utils/lancer.ts`** (nouveau) : l'outil du départ groupé a maintenant un seul domicile. Les lots 2
  et 3 en portaient quatre copies.

**Éprouvé**

- `tsc` est propre et les 2 685 tests passent. Un test qui simule ses imports
  (`utils/quazian-fiabilite.test.ts`) a dû apprendre le nouveau module : c'est lui qui a signalé
  l'oubli.
- **Écrans identiques au caractère près.** J'ai fait tourner l'ancien et le nouveau code côte à côte
  sur le bac à sable, avec le compte d'Élo, qui est bi-classe. J'ai comparé l'accueil, Ma semaine et
  Quazian en contexte « T5 », puis l'accueil et Ma semaine en état « Toutes les classes ».
- Durées en local (Montréal vers Ohio) : l'accueil passe de 2 065 à 625 ms en « T5 » et de 3 556 à
  1 509 ms en « Toutes ». Quazian passe de 1 124 à 921 ms. Ma semaine ne bouge pas.
- **Passe adversariale** : aucun défaut bloquant, aucun point à corriger.

**Non éprouvé.** Un élève qui a Vestigia avec une semaine ouverte et des pistes. Le bloc a tourné chez
Élo en état « Toutes », mais je n'ai pas vérifié qu'une semaine y était ouverte ni que des pistes existaient.

## 0 quinquies. Lot 2 DÉPLOYÉ et remesuré (17/09, commit `ac844ee`)

Mesure sur la page d'un exercice terminé du compte d'Élo, en prod : fin d'arrivée du document, sur
5 tirs et 4 exercices.

| | `pdx1` seul | Lot 1 | **Lot 2** |
|---|---|---|---|
| Page d'exercice | 3,4 s | 3,0 s | **1,6 – 2,2 s** (2,1 – 2,2 s sur les deux premiers tirs juste après le déploiement, puis 1,8 – 1,6 – 1,6 s) |

L'écran se rend correctement : retour, consigne et correction s'affichent.

**Non mesuré en prod.** Un geste (crédence, remise) n'a pas été rejoué : ce serait écrire sur le
compte d'Élo. Le gain par geste est attendu plus fort que celui du rendu. Avant, un geste cumulait
un portier en série, le chargeur en série et deux rendus. Maintenant il cumule un portier groupé, un
chargeur groupé et un seul rendu.

**À surveiller.** Dans les journaux Vercel, une ligne `[deroule] … illisible` voudrait dire que la
base sature sous la rafale.

## 0 quater. Lot 2 (le déroulé) — ce qui a changé (⚠️ état dépassé : déployé, voir 0 quinquies)

| Pièce | Avant | Après |
|---|---|---|
| `chargerLeDeroule` (`utils/deroule/vue.ts`), rejoué à chaque rendu et dans six actions | ~38 lectures en série | Les lectures indépendantes partent ensemble, et chacune est attendue à sa place d'origine |
| `lireContexte` (`utils/chaine/contexte.ts`), aussi utilisé par la chaîne IA | ~15 lectures en série | Même patron : lectures indépendantes lancées ensemble |
| Portier des actions (`app/deroule/actions.ts`) | 7 à 20 lectures en série à chaque geste, brouillon (15 s) et sondage (5 s) | **Les mêmes gardes**, lancées ensemble ; refus lus dans le même ordre, mêmes messages |
| Après un geste réussi | l'action revalide, PUIS l'écran refait un `router.refresh()`, soit deux rendus complets | Un seul rendu : le `refresh` redondant est retiré à 7 endroits (remise ×2, confiance, conditions, restitution, se juger, crédence) |
| Sondage de l'attente | 2 lectures en série | en parallèle |

**Éprouvé**

- `tsc` est propre et les 2 685 tests passent.
- **Vue identique avant/après** sur 20 dépôts du bac à sable, soit 9 cas (cran × statut). La vue et le
  contexte sont comparés champ par champ : **0 différence**.
- Sur ces mêmes dépôts, le chargeur passe de **2 352 ms à 1 058 ms** en médiane. La mesure est prise
  depuis Montréal, donc chaque aller-retour est long : c'est le rapport qui compte.
- **Parcours complet joué au bac à sable** avec `scripts/recette/parcours-deroule.mjs`, sur un cran 4
  en paire : surlignage, correction du premier cas, second cas, crédence, conditions, remise, puis
  correction affichée. L'écran avance sans les `refresh` retirés.

**Arbitrages**

- **Aucune garde retirée ni allégée.** Le « portier léger » du plan, avec identité lue dans le jeton,
  aurait laissé un compte révoqué enregistrer jusqu'à 1 h. Le parallélisme donne l'essentiel du gain
  sans toucher à la sécurité.
- **Les actions rechargent toujours la vue entière** pour valider le geste (régime, offre de crédence,
  « se juger »). La vue dérive ces règles, et les relire à part ferait un second domicile. C'est le
  chargeur lui-même qui est devenu plus rapide.
- **`rafraichir()` garde sa portée de `layout` sur deux modules.** La doc de Next 16 dit qu'un
  `revalidatePath` depuis une action invalide aujourd'hui TOUTES les pages visitées, quelle que soit
  la portée. La resserrer ne gagnerait rien.

## 0 bis. Lot 1 (le socle) — ce qui a changé (⚠️ état dépassé : déployé, voir 0 ter)

**État.** `tsc` est propre, les 2 685 tests passent, et les 10 écrans élève répondent 200 en local sur
le bac à sable, sans erreur au journal du serveur.

**Non éprouvé**
- une Server Action élève ;
- le côté professeur : il n'y a aucun compte prof de test ;
- la prod.

**Ce qui change**

| Pièce | Avant | Après | Où |
|---|---|---|---|
| Proxy | 1 `getUser` (réseau) par requête, par action et par préchargement | `getClaims`, vérifié sur place (ES256) ; 3 à 7 ms mesurés en local | `utils/supabase/middleware.ts` |
| Identité dans un rendu | 3 à 5 `getUser` | **1**, compté à la sonde : le client du rendu garde la première réponse ; aucun des 30 appelants n'est modifié | `utils/supabase/server.ts` |
| Layout élève (chemin du premier octet) | 5 lectures en série | **2 de profondeur** : la session, puis profil ∥ inscriptions ∥ modules ∥ semestre | `app/eleve/layout.tsx`, `utils/supabase/identite.ts` |
| Modules de la classe | `classe_modules` puis `modules`, 3 fois par rendu de l'accueil, soit 6 appels | **1** requête embarquée, mémoïsée, comptée à la sonde | `utils/acces.ts` |
| Interrupteurs | 1 requête par porte, jusqu'à 6 par page | **1 ou 2** par rendu, comptées à la sonde | `utils/scriptorium-params.ts` (neuf), 13 portes branchées, `utils/supabase/admin.ts` (un client par rendu) |

**Arbitrages**

- **Le `getUser` du rendu reste un vrai `getUser`**, vérifié par le serveur d'authentification. Seul
  le proxy vérifie le jeton sur place, et il n'a jamais autorisé personne. Passer aussi le rendu à
  `getClaims` retirerait encore un saut, mais un compte révoqué garderait alors l'accès jusqu'à
  l'expiration du jeton (1 h). Cette décision revient à Louis.
- **`materialiserSemestreActif` reste dans le layout.** Il tourne en parallèle, hors du chemin
  critique. Le sortir gagnerait 2 appels et aucun temps d'attente, au prix d'une page fausse pour le
  premier visiteur le matin de la bascule.
- **Les portes gardent chacune leur règle d'échec.** Le lecteur partagé rend `{ data, error }` tel
  quel. Il fait un `select('*')` sur une ligne de 1 Ko : une colonne absente d'une base ne ferme que sa porte.
- **Les interrupteurs de la console prof et de la chaîne ne sont pas branchés** : ils ne sont pas sur le chemin élève.

**Correction du §3.** Les écrans d'attente existent déjà : `app/eleve/loading.tsx` et un par module.
Ce qui retardait leur apparition, c'était le layout (0,55 à 0,85 s avant le premier octet). Le point 5
du Lot 1 n'avait donc rien à construire. La réponse est la réduction de profondeur ci-dessus.

## 1. Ce que l'élève attendait AVANT le Lot 0 (`iad1`)

Temps entre le clic et la fin d'arrivée de la page, serveur chaud :

| Écran | Fin du document | Événement `load` |
|---|---|---|
| Tableau de bord `/eleve` | **5,9 – 7,8 s** (4 mesures) | 7,5 – 9,8 s |
| Ma semaine | 5,5 s | 6,8 s |
| Vestigia | 4,6 s | — |
| Calendrier | 4,1 s | — |
| Moi | 3,6 s | 5,3 s |
| Quazian | 3,5 s | 5,5 s |
| Scriptorium | 3,0 s | 5,2 s |
| Intégrité | 1,4 – 3,1 s | 5,3 s |
| Codex (liste) | 2,6 s | 4,7 s |
| Aletheia (liste) | 2,2 s | 4,3 s |
| Un exercice (terminé) | en-tête à 1,0 – 1,3 s, puis flux | — |
| **Clic « Tableau de bord » depuis un exercice (navigation interne)** | **8,9 s** | |

Le plancher est d'environ 0,85 s : aucune page n'envoie son premier octet utile plus tôt.
Sur téléphone en 4G, il faut ajouter le réseau ; je ne l'ai pas mesuré, car l'extension ne bride pas le débit.

## 2. Ce qui n'est PAS la cause

- **La base n'est pas lente.** Les 25 requêtes les plus coûteuses de `pg_stat_statements` s'exécutent
  en 0,4 à 15 ms de moyenne (deux à 33-38 ms). Le cache de lecture est à 100 %, et il ne manque aucun
  index critique. La seule anomalie est `SELECT name FROM pg_timezone_names` (735 ms, 59 appels),
  émise par le tableau de bord Supabase et non par l'application.
- **Les démarrages à froid** touchent 0,9 % des invocations.
- **Le JavaScript** pèse 549 Ko décodés en 10 fichiers sur l'accueil, et les polices sont
  préchargées. C'est correct.
- **L'IA** n'est jamais attendue dans une action élève. Tout part en `after()` : les remises du
  déroulé et d'Aletheia sont vérifiées, le chat de Scriptorium ne l'est pas.

## 3. Les deux causes, qui se multiplient l'une par l'autre

### Cause A — le serveur et la base sont à deux bouts du continent

- Les fonctions Vercel tournent en **`iad1` (Washington)**.
- La base Supabase de prod est en **West US (Oregon)**.
- Vercel a mesuré **374 000 appels à Supabase en 7 jours, à 248 ms de moyenne** (P75 à 288 ms, P99 à 984 ms).
- La requête elle-même dure 1 à 15 ms. Tout le reste est du trajet.
- Contre-mesure depuis Montréal, qui est à la même distance de l'Oregon :
  - l'aller-retour nu par `psql` prend 73 ms ;
  - un appel REST trivial sur une connexion déjà ouverte prend 150 à 185 ms ;
  - une connexion neuve prend 356 ms.

### Cause B — chaque page fait des dizaines d'appels, presque tous l'un après l'autre

| Rendu | Appels | Dont en série |
|---|---|---|
| Socle commun (proxy + layout) | 8 | 6 |
| `/eleve` | ≈ 72 | ≈ 42 |
| Un exercice du déroulé | ≈ 53 | ≈ 38 |
| Quazian (flashcards) | ≈ 53 | ≈ 22 |
| Vestigia | ≥ 40 | ≈ 28 |
| Aletheia, une séance | ≥ 31 | ≈ 24 |
| Ma semaine | ≈ 26 | ≈ 15 |

**Le temps mesuré se retrouve.** 42 sauts en série à environ 150 ms donnent 6,3 s, soit la durée
mesurée de l'accueil.

**Motifs récurrents**

- **`auth.getUser()` refait 3 à 5 fois par rendu.** Il est appelé par le proxy, par le layout, par la
  page et par chaque chargeur. On en compte 32 occurrences dans 30 fichiers, alors que
  `lireIdentite()` est mémoïsé.
- **Les interrupteurs se lisent une requête par drapeau.** Ils sont sur la même ligne
  `scriptorium_params`, mais il y a 29 sites de lecture sans `cache()`, soit jusqu'à 6 lectures sur `/eleve`.
- **Quazian** : trois chargeurs (file, stats, tuiles) refont chacun la même chaîne de 12 appels, soit
  36 appels pour 9 lectures distinctes.
- **`vue.ts` du déroulé** : 1 581 lignes et 4 `Promise.all`.
- **Relectures** : `classe_modules` et `modules` sont lus 3 fois sur l'accueil, `semesters` 3 fois.

### Ce que l'élève paie pendant qu'il travaille (route n° 1 du site : 109 000 appels en 7 jours)

| Geste | Coût |
|---|---|
| Sauvegarde automatique toutes les 15 s | ≈ 9 appels, dont 7 pour re-prouver identité et portes |
| Sondage de l'attente du retour toutes les 5 s | ≈ 10 appels, soit 120 par minute |
| Une remise | ≈ 165 appels : la vue est rechargée dans l'action (45), puis `revalidatePath` en portée `layout` sur deux modules (53), puis un `router.refresh()` redondant (53) |
| Noter une carte Quazian, le clic le plus fréquent | 7 à 9 appels en série, soit plus de 1 s par carte |
| Attente d'un retour Aletheia | `router.refresh()` toutes les 4 s, soit environ 31 appels par tic et 465 par minute |
| « J'ai vu ma note » (quizz) | ≈ 56 appels, alors que le bouton est déjà passé à « vu » en local |

### Ce que l'élève ressent en plus

- **Rien ne s'affiche pendant le chargement d'un module.** Il n'y a que 5 `loading.tsx` sous
  `app/eleve`, et la page d'un module n'arrive qu'à la fin de sa chaîne d'appels. Un clic qui ne
  donne rien pendant 5 à 9 s passe pour une panne.
- **Les préchargements coûtent eux aussi des appels.** Chaque écran lance 6 à 12 préchargements de
  liens, et chacun passe par le proxy, donc par un `getUser`. Le proxy fait ainsi 69 000 appels par semaine.

## 4. Plan d'ajustement, du plus rentable au plus coûteux

Chaque lot se mesure avant et après avec le même protocole, sur les 11 écrans du §1.

### Lot 0 — rapprocher le serveur de la base (une ligne, réversible)

- **Geste** : passer la région des fonctions de `iad1` à **`pdx1`** (Portland, à côté de la base).
  Cela se fait dans `vercel.json` (`"regions": ["pdx1"]`) ou dans Vercel → Settings → Functions. Il faut redéployer.
- **Effet sur les appels** : l'aller-retour serveur–base passe d'environ 65 ms à environ 2 ms.
- **Effet sur l'élève** : il paie environ 75 ms de plus, une seule fois par requête, pour joindre
  Portland. Il économise l'aller-retour sur 25 à 70 appels.
- **Gain attendu** : les pages vont 2 à 3 fois plus vite sans toucher au code. Je ne peux pas chiffrer
  plus finement, parce que la part de la passerelle Supabase dans les 248 ms ne se sépare que par la mesure.
- **À vérifier avant** : la région du projet Supabase du bac à sable. Les previews la subiront aussi.
- **Ce qui ne bouge pas** : les appels IA.
- **Alternative écartée** : déplacer la base vers l'Est. C'est une migration de prod pour le même gain.

### Lot 1 — le socle (profite à toutes les pages et à toutes les actions)

1. **Proxy** : remplacer `getUser` par `getClaims`, qui vérifie le JWT localement. C'est 1 appel de
   moins sur chaque requête, chaque préchargement et chaque action.
2. **Identité** : passer par `lireIdentite()` partout (30 fichiers, plus `garderEleveDeroule`,
   `verifierEleve` et `utils/passation/garde.ts`). C'est 1 à 4 appels de moins par rendu.
3. **Interrupteurs** : un seul lecteur de `scriptorium_params` sous `cache()`, dont dérivent les 29
   portes. C'est 1 à 5 appels de moins par rendu.
4. **Layout** :
   - lire `classe_modules` et `modules` en un seul embed mémoïsé, réutilisé par l'accueil et les signaux ;
   - sortir `materialiserSemestreActif` du rendu, vers un cron quotidien ou `after()`.
5. **Attente visible** : un `loading.tsx` avec la plume d'attente par module et sur les pages de
   travail. Ce point ne retire aucun appel, mais il change la perception : l'élève voit que ça charge.

### Lot 2 — le déroulé des exercices (là où l'élève passe son temps)

1. **Portier léger** pour le brouillon et le sondage : identité par le JWT, puis un seul
   `update … eq(id).eq(eleve_id)`. On passe de 9-10 appels à 2-3 par tic, soit environ 70 % du
   volume de la route.
2. **Après un geste** : `rafraichir()` ne revalide que la page du dépôt en portée `page`, et le
   `router.refresh()` redondant est retiré (`EcranDeroule.tsx:268,273`). Une remise perd environ 100 appels.
3. **Dans l'action** : ne pas recharger toute la vue, et ne lire que le champ utile. C'est environ
   40 appels de moins par geste.
4. **Paralléliser `chargerLeDeroule`** (`utils/deroule/vue.ts:508-1119`) : la profondeur passe de 38 à environ 8.

### Lot 3 — l'accueil et Ma semaine

- **Accueil** : un `Promise.all` sur les blocs indépendants de `app/eleve/page.tsx:103-232`. La
  profondeur passe de 42 à environ 12.
- **Accueil, lectures en double** : `exercices_depots` lu une seule fois pour les deux ateliers, les
  pistes en une requête embarquée, et une variante par classe de `livresPourClasse`.
- **Ma semaine** : le quota du cycle en parallèle de la semaine. La profondeur passe de 15 à environ 8.

### Lot 4 — Quazian

- Un seul chargeur pour file, stats et tuiles : 36 appels ramenés à environ 8.
- `soumettreNote` : lectures en parallèle et journal écrit dans `after()`. La profondeur passe de
  7-8 à 3, ce qui fait gagner 6 à 7 s sur une séance de 30 cartes.
- `soumettreQuizz` : un upsert groupé à la place de la boucle d'`update`.
- `BoutonVuNote` : sans `router.refresh()`.

### Lot 5 — le reste

- **Aletheia, sondage** : `PollStatut` lit un statut en 1 ou 2 appels au lieu de faire un
  `router.refresh()` toutes les 4 s.
  - Aujourd'hui, chaque tic coûte 34 appels de profondeur 24.
  - Les tics se superposent dès qu'un rendu dépasse 4 s.
  - Une soumission coûte ainsi 170 à 340 appels pour lire un seul champ.
- **Aletheia, page de séance** (26 à 44 appels, profondeur 23 à 34) :
  - paralléliser les étapes 4 à 12 ;
  - résoudre les dates du livre une seule fois ;
  - ne monter `OuvertureSeance` que si `ouvert_at` est absent, ce qui retire 11 appels par visite ;
  - `verifierSurlignage` coûte 21 appels et télécharge deux fois le livre à chaque essai.
- **`router.refresh()` qui double un `revalidatePath`** : à retirer à 9 endroits.
  - Il fait un rendu complet de trop par clic, soit 1,5 à 4,5 s.
  - Endroits : les quatre `FormulaireV1*` et `FormulaireVf*`, `FormulaireDepot.tsx:133`,
    `ThemeEleve.tsx:59`, `EssaiDepot.tsx:115`, `ValidationLecture.tsx:102`, `EcranDeroule.tsx:268,273`.
  - Avant de le retirer, vérifier à l'œil la purge du brouillon local.
- **Vestigia** (≈ 42 appels, profondeur 28) :
  - passer à quatre vagues parallèles ;
  - ne charger que l'onglet demandé : l'essai et la synthèse se chargent aujourd'hui sans être affichés ;
  - `fragments_depots` et `fragments_analyses` sont lus 4 fois chacun ;
  - l'état des onglets doit être porté par le rendu serveur. `EtatFragmentsEleve.tsx:32` relance au
    montage 14 à 19 appels en série, qui bloquent tout clic fait pendant ce temps ;
  - téléversement des photos : une URL par photo en boucle, soit environ 9 appels par photo.
- **Passation avec photos** : `actionEnvoyerLesPhotos` est la seule action où l'élève attend une IA
  (`transcrireMaintenant`). `rafraichir()` de `app/passation/actions.ts:32-39` invalide 6 layouts.
- **Calendrier et Scriptorium** : aucun `Promise.all` aujourd'hui. À dérouler avant de chiffrer.

### À décider par Louis, hors code

- Supabase propose un **« Free Upgrade » de Nano à Micro**, soit 1 Go de mémoire au lieu de 0,5.
  - L'opération demande un redémarrage de quelques minutes.
  - Le panneau Infrastructure affiche une jauge à 67 %. Sa lecture est ambiguë entre CPU et mémoire :
    à regarder à l'œil.
  - Ce n'est pas la cause d'aujourd'hui, mais c'est une marge pour 30 élèves en même temps.
- **La charge d'une classe entière en simultané n'a pas été mesurée.** Un seul compte ne la montre
  pas ; elle se simule en bac à sable.

## 5. Trouvé en route, hors performance

- Les lectures Quazian (`lireCartes`, `quazian_card_states`) n'ont ni `range` ni pagination. Elles
  tronqueront sans erreur à 1 000 lignes, vers 40 cours entamés. Les `.in()` qui passent des
  centaines d'UUID dans l'URL risquent une erreur 414.
- `scriptorium_params.select('*')` rapatrie tous les prompts pour lire un booléen.
