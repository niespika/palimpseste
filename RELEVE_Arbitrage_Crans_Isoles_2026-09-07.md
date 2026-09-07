# RELEVÉ — Séance d'arbitrage « sur un cran qui isole, le juge est la mesure » (07/09/2026, branche `feat/ecrans-passation`)

**Prompt** : `PROMPT_Session_Arbitrage_Chaine_Crans_Isoles.md` (commit `a2a0ea2`). **Nature de la séance** : conception ; **aucune ligne de code, aucune source de conception touchée, rien commité** — ce relevé est le seul fichier écrit, dans le dépôt de code, non commité. ⚠️ Machine : `2026-09-06` ; le prompt et les commits datent la séance du 07/09, je garde leur datation. **Ce que ce relevé porte** : les cinq mesures du §2 du prompt, faites en **lecture seule sur la PRODUCTION par PostgREST** (`ucmngachkxvvlegntuwh`, vérifié par sa référence), et ce que chacune dit des cinq points. **Rien n'est tranché ici** : les décisions sont à Louis, point par point.

Outillage de la séance : `prod.py` (lecteur PostgREST, scratchpad), les scripts `m1_m3_m5.py`, `m2.py`, `m2b.py`, `m2c.py`, `m4a.py`, `m4b.py` — tous en lecture. Les familles des observables sont lues dans les instruments **dérivés** du code (`utils/chaine/derive/competences/*.ts`, sortie de `derive-instruments.py`) : ⚠️ la table `observables_mesure` que le prompt nomme **n'existe pas en base** — les familles ne vivent que dans les fiches et leur dérivé.

---

## 1. Les cinq mesures du §2

### M1 — Les dépôts par cran depuis le 31/08 (`exercices_depots` × `exercices.cran`)

| | total | crans qui isolent (2·4·5·7·9) | crans 6·8 | crans 1·3 (personne ne juge) |
|---|---|---|---|---|
| dépôts du routeur créés depuis le 31/08 | **480** | **333** (69 %) — c2 : 11 · c4 : 118 · c5 : 106 · c7 : 92 · c9 : 6 | **26** (5 %) — c6 : 10 · c8 : 16 | 121 (25 %) — c1 : 73 · c3 : 48 |
| … dont v1 remise | 228 | **152** — c2 : 3 · c4 : 53 · c5 : 52 · c7 : 39 · c9 : 5 | **12** — c6 : 4 · c8 : 8 | 61 |
| … dont vf remise | **0** | 0 | 0 | — |

Statuts (depuis le 31/08) : `assigne` 197 · `ouvert` 38 · `v1_remis` 76 · `clos` 146 · `retire` 20 · `non_fait` 3. Tous d'origine `routeur`. Les 85 dépôts d'avant le 31/08 n'ont plus d'exercice lisible (`cran` NULL) : ils sont hors du compte.

⚠️ **Le cran 2 de production N'EST PAS le cran 2 du gabarit** : ses 11 dépôts sont sur la banque 1.4 (`production_guidee`, objet entier — `texte_v1` médian **725 car.**, contre 124 au cran 4 et 230 au cran 5). Le « trou qui est une pièce » n'existe qu'en bac à sable. Ce que la décision touche en prod aujourd'hui, c'est **4·5·7·9** ; le 2 s'y ajoute à la bascule.

### M2 — Ce que P1 relève sur les crans qui isolent (`exercices_squelettes.artefact_extraction`)

509 squelettes en prod ; **278 sur des crans qui isolent** (c4 : 79 · c5 : 105 · c7 : 65 · c9 : 18 · c2 : 11), tous en `v1` ; 41 sur 6·8. Par compétence (isolants) : expression 123 · questionnement 67 · structure 61 · argumentation 27.

- **La copie** : `texte_v1` médian **254 car. / 42 mots** sur les crans qui isolent (min 14, max 907) ; **519 car.** sur 6·8.
- **Le relevé** : médian **472 car.** (min 165, max 2 911), 2 entrées ; **866 car.** sur 6·8.
- **« RELEVÉ VIDE »** : la chaîne littérale n'apparaît dans **aucun** `artefact_extraction` ni dans **aucun** `exercices_jobs.dernier_message` de prod (0 sur la recherche `ilike`) — la phrase citée au §0 du prompt (« copie de 26 mots ») vient du **décor du bac à sable**, pas de la production.
- **Le relevé « structurellement vide »**, par compétence, sur les 278 (règle : expression = 0 fait et 0 réussite ; structure ≤ 1 bloc ; questionnement = enjeu et forme absents ; argumentation ≤ 1 unité) :

| compétence | n | vides | part | (sur 6·8) |
|---|---|---|---|---|
| structure | 61 | 54 | **89 %** | 58 % |
| questionnement | 67 | 60 | **90 %** | 50 % |
| argumentation | 27 | 13 | **48 %** | 20 % |
| expression | 123 | 9 | **7 %** | 0 % |

**Lecture** : pour Structure et Questionnement, la thèse de Louis est mesurée — sur une phrase, P1 ne relève rien (un bloc, ou « enjeu absent »). Pour l'**Expression**, P1 relève **presque toujours** quelque chose (faits, réussites, orthographe) — la phrase est son matériau naturel ; l'Argumentation est entre les deux. ⚠️ Ce n'est pas la même situation pour les quatre compétences.

### M3 — Le coût par dépôt sur ces crans (`api_couts`, prod)

1 622 lignes avec `depot_id` ; 207 dépôts à coût. **Sur les crans qui isolent : 124 dépôts, 724 appels (5,84/dépôt), 0,0809 $/dépôt.**

| étage (crans qui isolent) | appels/dépôt | $/dépôt | $/appel | sortie tok/appel | entrée tok/appel |
|---|---|---|---|---|---|
| `p1` | 2,30 | 0,0225 | 0,0098 | 266 | 478 |
| `p2` | 2,17 | 0,0321 | 0,0148 | 491 | 1 022 |
| `retour` (Calame) | 1,10 | 0,0242 | 0,0220 | 511 | 3 665 |
| juge (`exercices-chaine-juge`, phase NULL) | 0,27 | 0,0021 | **0,0078** | 211 | 1 547 |

- **P1 + P2 = 0,0546 $/dépôt, soit 67 % du coût d'un dépôt sur un cran qui isole.** Le scénario « 2 appels » (juge + Calame) vaut, aux prix d'aujourd'hui, **≈ 0,030 $/dépôt contre 0,081** (−63 %) ; par cran : c4 0,070 · c5 0,079 · c7 0,076 · c9 0,174 · c2 (1.4) 0,127 $/dépôt.
- Sur **6·8** : 12 dépôts, 7,83 appels, **0,139 $/dépôt** (p1 3,42 · p2 3,42 · retour 1,00).
- ⚠️ **Les 34 appels du juge sont tous du 03/09** (c4 : 13 · c5 : 10 · c7 : 8 · c9 : 3) et **`verdicts_cran` est NULL sur les 565 dépôts** — le juge a tourné un jour en prod sans laisser de verdict lisible. À vérifier (la migration `c7_l1` en prod ce jour-là ? l'écriture « séparée et tolérante » a-t-elle échoué ?) — hors de cette séance, mais la base du registre des réussites de C7-L7 en dépend.

### M4a — Les familles des observables isolés (`exercices_problemes` × instruments dérivés)

205 clés du `09-` ; **186 avec observable** (19 sans, `observable_route = false`) ; **52 observables distincts**.

| famille | observables distincts | clés |
|---|---|---|
| proportion | 14 | **61** |
| binaire | 11 | **52** |
| comptage rapporté | 15 | 41 |
| densité (Expression, seuils provisoires) | 5 | 6 |
| comptage | 2 | 5 |
| ordinal | **0** | 0 |
| **ABSENT des instruments** | **5** | **21** |

- **Aucun ordinal** parmi les observables isolés : la question « quel rang ? » du P1 est sans objet.
- ⚠️ **Cinq observables du `09-` n'existent dans aucun `observables_mesure`** : `structure|fonction_moments` (8 clés), `structure|decoupage_present` (5), `argumentation|these_adverse` (4), `argumentation|mode_discursif` (3), `argumentation|statuts_distingues` (1). **La chaîne ne les mesure pas aujourd'hui** (C7-L7 les journalise `hors_instrument`) : sur ces 21 clés, un verdict du juge n'a **aucune valeur** vers laquelle se convertir — la table de conversion doit dire ce qu'elle en fait (une entrée `observables_mesure` à écrire dans la fiche ? un verdict qui ne s'écrit que sur `verdicts_cran` ?).
- Sens de réussite sur les 47 connus : `plus_de`/`au_moins` (seuil 0,5 à 0,85) pour les proportions et comptages ; `au_plus 0` / `moins_de 0,5` pour les comptages rapportés (les défauts) ; `vaut <valeur>` pour les binaires (`oui`, `enonce`, `propre`… et la **liste** `['question_explicite','tension_affirmee']` de `question_presente`). Quatre seuils sont `seuil_parametre` non lisibles ici (`contresens_partiel`, `couverture_essentielles`, `relation_rendue` — Synthèse, `differee` —, et `garant_present` porte `plus_de 0,5` en proportion : le « comptage, seuil 0 » que le prompt suppose est faux, `garant_present` est une **proportion**).
- Banque 1.4 en prod : 39 observables isolés, dont **10 absents** des instruments (`garant`, `apports`, `operation`, `recadrages`… — les codes d'avant les fiches).

### M4b — Les lettres qui ont bougé (`competences_niveaux` × `competences_mesures`)

228 lignes de niveau ; 492 mesures (190 d'ancres `classe × sommatif`, **302 du routeur `maison × formatif`**, dont **261 sur des crans qui isolent — 86 %** — et 41 sur 6·8).

**16 lettres diffèrent de leur `lettre_initiale`** : 3 par l'**ancre** du 03/09 (structure C→D, expression D→E, argumentation C→E) et **13 par les mesures du routeur — toutes en Expression** (C→B ×5, D→B ×4, D→C ×3, E→D ×1), entre le 01/09 et le 07/09. Les mesures qui les portent sont aux crans 4·5·7·9 (une ou deux sondes de montée aux 6·8 par ligne au plus). **La réponse à « presque aucune ? » est donc NON** : les crans qui isolent ont fait bouger 13 lettres sur 16, par la **médiane des lettres-équivalentes** (`utils/routeur/mesure.ts`, `01-` §3), et les sondes de montée se disent réussies par `lettre_equivalente ≥ lettre` (`etat-serveur.ts`).

Sur les 261 mesures isolantes, la `lettre_equivalente` contre la lettre courante de l'élève : **109 égales · 79 plus basses · 23 plus hautes** — P2 sur une phrase rend plus souvent une lettre sous le palier de l'élève qu'au-dessus. `delta_v1_vf` : **0 non nul en prod** (aucune vf n'a jamais été remise).

### M5 — `regime_v1vf` par cran (`exercices_crans`)

| cran | régime | conséquence pour le delta |
|---|---|---|
| **2** | `plein` | vf attendue → un delta existe (sur le gabarit seulement, cf. M1) |
| **4**, **9** (et 1) | `par paires` | **pas de delta** — la paire tient lieu (`01-` §8.4) |
| **5**, **7** (et 3) | `pas de vf, sauf escalade` | **pas de delta hors escalade** ; en escalade la vf est requise (`01-` §8.5) |
| 6, 8 | `plein` | hors périmètre |

---

## 2. Ce que les mesures disent des cinq points — et ce qui reste à Louis

### P1 — Verdict binaire, table de conversion par observable
- **Ce que la base dit** : 5 familles en jeu (pas d'ordinal) ; **21 clés sur 186 n'ont pas d'observable mesurable** ; un même observable peut être isolé par 11 clés (`charniere_motivee`). La règle générale « réussi = la valeur qui franchit le seuil » est **calculable pour les 47 observables connus** à partir de `reussie` + `seuil` / `valeur_reussie` : proportion/comptage `plus_de 0,5` → réussi 1, raté 0 ; comptage rapporté `au_plus 0` → réussi 0, raté 1 ; binaire `vaut X` → réussi X, raté ≠ X (⚠️ pour une **liste**, « raté » n'a pas de valeur naturelle) ; densité `au_plus 3,5` → réussi 0 ?, raté seuil + 1 ?. **Une règle par famille tient**, sauf pour deux cas qui exigent un choix : la valeur « ratée » d'un binaire à liste, et la valeur « réussie » d'une densité (0 ou n'importe quoi sous le seuil).
- **(c) Qui lit la VALEUR, pas le statut** — vérifié dans le code : `statutDeLaMesure` / `tauxDeReussite` sont les seuls juges pour `competences-classe.ts`, `routeur/observables.ts`, `pilotage/attention-serveur.ts`, `monitoring.ts` (fenêtre d'évidence, acquis, registre) — **une valeur convertie y passe sans les changer**. Mais **deux lecteurs lisent la valeur brute** : (1) `chaine.ts` `resumerTendance` — l'« état antérieur » servi à Calame liste les valeurs (« 3 mesure(s) antérieure(s) : 0.5, 1, 0 ») ; (2) `deroule/juger.ts` `comparerAuSquelette` — la comparaison du « se juger » écrit `valeur_squelette` dans `exercices_metacognition`. Et `moteur/objets.ts` compte les mesures non `n/a` (règle 4 de C7-L7) — une valeur convertie compte, c'est voulu.
- **À Louis** : (a) **où vit la table** — par famille au `03-` §1 (une règle, écrite une fois), ou par observable dans le bloc machine (56 entrées à écrire, dérivées) ? ; (b) **les 21 clés sans observable mesurable** : le verdict s'écrit-il quand même (sur `verdicts_cran` seulement, sans mesure) ou ces clés reçoivent-elles une entrée `observables_mesure` ? ; (c) la valeur « ratée » d'un binaire à liste, et la valeur « réussie » d'une densité.

### P2 — La `lettre_equivalente`
- **Ce que la base dit** : la voie (i) (`null`) **coûte** — elle retire de la médiane 86 % des mesures du routeur, et c'est par elles que 13 lettres sur 16 ont bougé. Mais ce qu'elles ont fait bouger est discutable : 79 mesures isolantes rendent une lettre **sous** le palier de l'élève (P2 juge huit observables sans objet sur une phrase), 23 au-dessus.
- **Ce que le moteur engage** (lu) : la lettre bouge par la **médiane** des `lettre_equivalente` de la fenêtre (`01-` §3), l'ancre par `lieu = classe × forme = sommatif` seulement, la sonde de montée réussie par `lettre_equivalente ≥ lettre`. Avec (i), sur un élève dont la fenêtre n'a que des crans isolants, **la lettre ne bouge plus et les sondes de montée ne se disent plus réussies** (leur `lettre_equivalente` est `null`) — ⚠️ M-e est touché.
- **Voie (ii)** — dériver la lettre du registre des réussites de C7-L7 : le `10-` §7 dit déjà « deux réussites au cran d'en dessous débloquent le cran suivant » et le `01-` v5.12 §4 indexe la bande au palier ; « un objet tenu sur toute la bande = le palier » n'est écrit nulle part. **Voie (iii)** — une lettre par observable : les 47 observables connus n'ont pas de palier attaché dans `observables_mesure` (seulement famille/seuil) ; la table serait neuve.
- **À Louis** : la voie ; et, si (i), **ce que devient la sonde de montée** aux crans qui isolent.

### P3 — La version finale rejoue le juge ; le delta
- **Ce que la base dit** : **aucune vf, aucun delta en prod** ; par régime, **le delta n'existe sur un cran qui isole qu'au cran 2 du gabarit (`plein`) et aux 5·7 en escalade** ; les 4·9 sont « par paires » (pas de delta, jamais). La redéfinition ne touche donc que ces deux cas.
- **Ce que le code engage** : `deltaFort = delta_v1_vf > 0` (`deroule/mesure.ts`) ; le juge en vf reçoit déjà `productionV1`. **Un delta « raté → réussi = +1 » satisfait `deltaFort` tel quel** ; « réussi → raté = −1 » et 0 le laissent faux. Aucune autre lecture du delta que N2 (`escalade.ts`) et le faisceau d'intégrité (`delta_v1_vf` nul, `integrite-faisceau.ts` — NULL ≠ 0, à préserver).
- **À Louis** : la définition (différence des verdicts, ou différence des valeurs converties — sur une proportion 0/1 les deux coïncident) ; et si la phrase du `01-` §11 « le delta compare les squelettes, jamais les verdicts » reçoit un `[faux]` sur ces crans, ou une exception datée.

### P4 — La banque 1.4 meurt
- **Ce que la base dit** : 532 exercices 1.4 en prod, **529 non bloqués, 0 motif `[banque 1.4]`** — `retirer-banque-14.mjs --prod --applique` **n'a pas été joué** ; `gabarit_actif` OFF, `juge_documents_actif` OFF. Dépôts 1.4 « en cours » : 197 `assigne` + 38 `ouvert` (rien de remis), 76 `v1_remis` ; **aucune vf n'est attendue sous le régime normal** des crans 4·9 (paires) et 5·7 (pas de vf) — la question « la vf des dépôts ouverts se sert sous l'ancien régime » est **vide en prod aujourd'hui** (0 escalade N1 mesurée ? non vérifié : `competences_escalade` non lue). Ce qui reste : les 235 dépôts assignés/ouverts non remis, dont la v1 arrivera après la bascule — sous quelle chaîne ?
- **À Louis** : confirmer « plus servable, pas effacée » (c'est ce que le script fait : `bloque = true` + motif, réversible) ; et **la chaîne qui sert une v1 de 1.4 remise après la bascule** : l'ancienne (P1/P2 sur `observable_isole_code`, qui n'a pas de clé) — la lecture la plus simple —, ou rien.

### P5 — Calame, et la fusion
- **Ce que la base dit** : Calame reçoit en entrée **3 665 jetons/appel** sur les crans qui isolent, dont les squelettes (P1 + P2 de la compétence de la clé avec C7-L8, de toutes les compétences avant) ; le juge rend `reussi`, `probleme_present`, `probleme_vu`, `passage` (**verbatim, vérifié par `citationTient`**), `motif` — soit exactement ce que la règle 1 du gabarit demande à une citation, et ce que `retour.ts` lui sert déjà (« LE VERDICT DU JUGE DU CRAN … tu CITES ce passage »). Sans squelette, ce qui tombe dans l'assemblage : la section `SQUELETTE ET VERDICTS`, l'« état antérieur » (valeurs de la fenêtre), la règle 3 (« tu le lis dans le squelette »), la règle 4 (« le champ `levier` du verdict » — P2 le rend), la règle 2 (« une réussite citée » : sur une phrase ratée, le juge n'en fournit aucune).
- **Sur la fusion** : rien de mesuré ici. Deux faits de code : la contrainte d'`api_couts` n'admet que `p1`/`p2`/`retour`/NULL (le juge est à NULL) ; le verdict est **contrôlé par forme** (`FORME_VERDICT`, rejeu si non conforme) et le retour aussi (`retours_texte_segmente_chk`) — un appel fusionné cumule les deux motifs de rejeu.
- **À Louis** : séparé ou fusionné ; et ce que le gabarit **GELÉ** du `07-` §4 reçoit comme amendement daté (les règles 2, 3, 4 sur ces crans).

---

## 3. Ce qui n'était pas comme le prompt le disait

1. `observables_mesure` n'est pas une table : les familles se lisent aux instruments dérivés (§1, M4a).
2. « RELEVÉ VIDE … copie de 26 mots » est un constat de bac à sable ; en prod, le vide se mesure structurellement, et il est **inégal selon la compétence** (M2).
3. `garant_present` est une **proportion `plus_de 0,5`**, pas un comptage à seuil 0 (M4a).
4. Le cran 2 de prod est la banque 1.4, objet entier — le trou-pièce n'y existe pas (M1).
5. 34 appels du juge le 03/09 en prod, **0 verdict écrit** (M3) — à vérifier hors séance.
6. Cinq observables du `09-` (21 clés) sont hors instrument (M4a).

## 4. Ce que la séance n'a PAS fait
Aucune source de conception amendée (`01-`, `03-`, `07-`, `10-`, `INVENTAIRE`), aucune ligne `IDEES`, aucun lot `C7-L9` écrit, rien commité nulle part — **§3 du prompt : « si Louis tranche »**. Les scripts de mesure sont dans le scratchpad de la session et se rejouent en lecture seule.

---

## 5. Les décisions de Louis (07/09, nuit) — actées, écrites dans les sources

| Point | Décision | Où c'est écrit |
|---|---|---|
| **P4** | La banque 1.4 est retirée du routage **ce soir** (geste de Louis, `retirer-banque-14.mjs --prod --applique`) ; plus aucun exercice 1.4 servi d'ici quelques heures — la question de la chaîne pour une v1 tardive tombe. | `07-` §2, entrée `C7-L9` |
| **P1** | Verdict binaire converti en **valeur extrême du bon côté du seuil**, règle générale par famille écrite une fois ; onze valeurs d'absence pour les binaires ; densité ratée = seuil doublé ; les cinq observables hors instrument (21 clés) écrivent le verdict sur le dépôt seul. **Périmètre : les crans 1·2·3·4·5·7·9 servis par le routeur** ; les mesures en classe, les ancres et les crans 6·8 gardent la valeur réelle. Aux 1·3, le verdict algorithmique écrit une mesure convertie. | `03-` v2.2 §1 · `01-` v5.15 §8.2 · `INVENTAIRE` D10 |
| **P2** | `lettre_equivalente = null` sur ces mesures ; la lettre bouge par les ancres et les 6·8. **Pondération des mesures de la trajectoire dans le taux** : 6·8 : 1 · 7 : 0,8 · 2·5 : 0,6 · 4·9 : 0,5 · 1·3 : 0,2 (fenêtre et compteurs en mesures). **Signal de trajectoire** : majorité stricte des requis acquise (ou ratée) au taux pondéré ⇒ une sonde de montée au 6 ou 8 — « la trajectoire propose, le 6·8 dispose ». Une sonde sur un cran qui isole se dit réussie par le verdict. Pas de ligne IDEES pour la voie (ii). Les phrases du `01-` §11 amendées directement, datées — pas de `[faux]`. | `01-` §8.2, §8.4, §8.8, §11 · `07-` §1.2 · `10-` §7 |
| **P3** | En vf le juge rejoue **à l'aveugle** (ni verdict ni retour de v1) ; `delta_v1_vf` = différence des verdicts (+1 · 0 · −1) ; NULL sans vf ; cran 2 et 5·7 en escalade seulement, 4·9 par paires. | `01-` §11 · `07-` §1.2 · `10-` §6 |
| **P5** | **Deux appels**, le juge puis Calame — pas de fusion. Calame reçoit le verdict, la copie, les documents, la dimension, l'état antérieur en verdicts ; plus de squelette. Le §4 est gelé : un **§4 bis** daté. Idée post-rentrée : une personnalité de Calame unifiée à travers les modules. | `07-` §4 bis · `01-` §12 · `IDEES_post_rentree.md` |
| **Interrupteur** | Le sien, **`juge_mesure_actif`**, à OFF — acté au « go ». | `07-` §2 |

**Écrit cette nuit, non commité** : `01-` v5.15, `03-` v2.2, `07-` v2.81 (entrée `C7-L9`, amendement `C7-L8`, §1.2, §4 bis), `10-` v0.13, `INVENTAIRE` D10 *(dépôt de conception)* ; `IDEES_post_rentree.md` (forme (b) rayée, personnalité de Calame), `PLAN_DE_CHANTIER.md` (ligne `C7-L9`), **`PROMPT_Code_C7_L9.md`** (32 pièges) *(dépôt de code, branche `feat/ecrans-passation`)*. Hors séance : la bascule de la plateforme sur un autre fournisseur de modèle (Louis, cette semaine) ; les 34 appels du juge sans verdict (03/09) ; la calibration du Monitoring sur ces crans (piège 13 du prompt).
