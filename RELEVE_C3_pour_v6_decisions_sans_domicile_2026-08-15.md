# RELEVÉ pour la v6 — ce que C3 v5.4 porte et que les sources gelées ne portent pas

**Établi dans la nuit du 14 au 15 août 2026 par Mètis** (passe demandée par Louis au check-in du 12/08 : « lister les décisions portées par C3 qui n'ont pas de correspondant dans les sources gelées, avant la refonte »).

**Statut : relevé préparatoire — aucune décision n'est prise ici, aucun amendement n'est posé.** La v6 se réécrit depuis les sources gelées ; ce document est l'assurance que ce qui ne vit *que* dans C3 ne meurt pas en silence pendant la réécriture. Chaque ligne est à cocher pendant la rédaction de la v6, comme un contrôle de non-perte.

**Corpus de la passe, vérifié sur pièces cette nuit :**

| Document | Version constatée | Statut constaté |
|---|---|---|
| `SPEC_C3_exercices_competences.md` | v5.4 (modifiée le 13/08, annotations de l'entrée 53) | l'objet de la passe |
| `00-referentiel.md` | **v3.0** | **VALIDÉ ET GELÉ** |
| `01-routeur.md` | **v4.0** | **VALIDÉ ET GELÉ** |
| `02-exercices.md` | **v4.0** | **VALIDÉ ET GELÉ** |
| `03-competences.md` | v1.1 | **pas encore gelé** au moment de la passe (« sur le point de l'être » — Louis, 14/08 au soir) |
| `04-Instances_Exercices.md` | sans numéro | **EN FLUX** (son en-tête le dit ; « demande un peu plus de travail » — Louis) |
| `05-GENERATEUR_Reference_Decomposee.md` | v1.2 | gelé (annoncé par Louis le 14/08) |
| `AMENDEMENTS_C3_en_attente_2026-07-31.md` | 57 entrées, dont 31 à 57 non posées | l'autre intrant de la passe |

**Méthode.** C3 lue en entier (2 259 lignes, quatre extractions parallèles § par §) ; domiciles vérifiés par sondages nominatifs dans les six sources ; les 27 entrées en attente (31-57) lues intégralement et triées. Ce que je n'ai pas pu vérifier est dit tel quel, en Partie V.

---

## Partie I — Le matériau C3-natif : pas de domicile PAR CONSTRUCTION

Ces blocs sont le métier propre de C3 (contrat de construction) : les sources ne les porteront jamais, la v6 doit les **réécrire en entier**, en y intégrant directement les amendements en attente qui les touchent (colonne de droite). *Autrement dit : la passe d'amendements 31-57 ne se fait pas — ses contenus s'écrivent directement dans la v6.*

| Bloc C3 v5.4 | Contenu à ne pas perdre | Amendements à intégrer à la réécriture |
|---|---|---|
| **§6 — le schéma entier** | Toutes les tables : `exercices_types`, `exercices`, `exercices_references`, `exercices_depots`, `exercices_squelettes`, `exercices_metacognition`, `exercices_retours`, `exercices_jobs`, `competences_mesures`, `competences_niveaux`, `competences_montee`, `competences_actives_par_classe`, `monitoring_mesures`, `monitoring_niveaux`, `profil_eleve`, `routeur_decisions` ; conventions RLS (« SELECT own strict / écritures serveur, leçons C1 ») ; index unique `(depot_id, competence, version)` ; unicité + empreinte immuable sur `exercices_references` ; règle non-spoiler avec `borne_amont` journalisée | **33** (une paire = UNE mesure), **34** (`regime_v1vf` par geste, échelle morte), **36** (purge certitude cumulée), **37** (`registre_retour` n'est plus une colonne), **43** (pont E→A retiré, règle du NULL réécrite), **44** (`confiance_declaree` en enum à trois valeurs), **46+50+51** (champ `source`, deux séries de lucidité par famille, fenêtre à 5, site = synthèse en classe), **47** (`credence`, porte 2), **48** (confiance par compétence, gatée `evaluee`), **49** (deux drapeaux d'opt-in sur `exercices`), **53+56** (JSONB `contenu` réaligné : trois unités, statuts sur le moment, union phrase∪moment), **54** (domaine de `genre` refondu ; le filtre de parcours devient une opération nommée du routeur), **57** (drapeau « restitution de cours », corpus de cours servi au juge, `etendue` + phrase du manque), et les datés du premier lot encore ouverts : **17, 18, 19, 20, 28** |
| **§9 — les lots et la règle de manifeste** | La règle de manifeste elle-même (un fichier au statut insuffisant bloque le lot) ; les manifestes de C4-L1 à L7, C5-L1 à L4, C6-L1 à L4 avec leurs *fait quand* et leurs coupes | **35** (manifeste C4-L2 += routeur §6), **49** (manifeste C4-L4 lit les drapeaux d'opt-in), **56** (C5-L1 nomme le `05-`), **53** (C5-L1 cesse d'annoncer le format comme dû) ; et les manifestes se réadressent sur les numérotations des sources gelées (v3/v4) |
| **§1.7 — la porte de recette** | ≥ 15 copies ; accord ±1 palier ≥ 80 % **par cellule** (copie × observable) ; le mode des **cinq tirages** avec étendue ; cellule sans mode = désaccord ; distinction bande du banc / tolérance de recette ; `taux_par_passage` déclaré sans faire porte ; borne IC ≥ 85 % pour cesser de réviser un prompt ≠ porte ; règles de révision des golds (run 1-2 = sortie du lot, run 3-4 = affinement, Louis prononce seul) ; corpus 15/25 en deux lots (10 + 5) ; exception Questionnement quatre lots (A23/A77) | **42** (la correspondance uploadée devient une condition d'`evaluee`) |
| **§2 — les formats v1** | « Maison à l'écran, classe à la main » et ses raisons ; anti-collage journalisé ; correcteur du navigateur laissé actif ; lisibilité réduite au canal classe (consigne, `confiance_ocr` deux passes, message reporté, exemption `mode_saisie_force` sans diagnostic) ; chariot d'iPad (GC15) | — |
| **§3 — les six temps, côté implémentation** | Fiche stratégique dosée par niveau ; gestes de remise (confiance, conditions de travail, restitution à chaud 30 s et son placement) ; « se juger » et ses garde-fous GC17 (`indetermine`, « nous n'avons pas vu la même chose », contestation → file prof) ; chasse aux fautes hors lettre ; encart langue + correction imposée en vf ; retour final = diff des squelettes, attribué au geste jamais au talent ; durées scindées (`duree_exercice_min` seule décomptée), seuil de dépassement ×2 et `motif_depassement` | **44** (échelle de remise), **45** (questions par observable — les fiches font foi), **48** (gate + grain), **49** (fermeture en classe = défaut ouvrable), **47** (saisie de crédence aux crans guidés/nommés) |
| **§3bis — le flux de passation en classe** | Les 16 étapes intégrales (ouverture manuelle du dépôt, photo, transcription éditable en secondes, contrôle élève ~10 min, ramassage papier, analyse en lot, correction prof à retours **masqués par défaut** révélables par grains, retour éditable, publication par case, obligation de lecture) ; « le contrôle est une correction, pas un signalement » ; instrument étalonné sur du brut déployé sur du relu — **surnoter moins grave que sous-noter** ; latence ~35 copies en quelques secondes chacune | **49** (l'étape « se juger » s'insère entre 8 et 9 quand le prof l'ouvre) |
| **§4 — sélection, quotas, allumage** | Les **trois gates** (`exercices_actif`, `routeur_actif`, `competences_affichage_actif`) et leur raison ; la **matrice normative par statut de recette** (six lignes, « on suspend le verdict, jamais le feedback ») ; la suppression de la file de validation hebdomadaire (GC5) et l'écran lecture seule qui la remplace ; l'**ancre aveugle** : bac blanc marqué au calendrier, mise en regard semestrielle en écart par palier journalisé, première en **janvier**, seuil volontairement non fixé ; la coupe de repli (ex-variante A) ; la note d'étalonnage de fin d'année (trois garde-fous, comparaison même format début mai, année d'exercices close au 10 mai) | **31, 32** (les phrases périmées se réécrivent en citant `01-` §3 et §7), **36** (la « révision certitude » disparaît) |
| **§4ter — assiduité et affichage** | La formule (% = semaines faites ÷ (semaines − vacances)) ; seuil « semaine faite » 2/3 ou 3/4 configurable ; vacances hors dénominateur, +1 semaine max au numérateur ; les deux agrégats (taux d'inactivité classe, % élève) ; **les compteurs entrent dans C4, un semestre ne se recompte pas** ; **aucune note dans Palimpseste** ; affichage élève par défaut = trajectoire et cible, lettres à la demande de l'élève seul | — *(le régime punition/récompense est la pratique de classe de Louis : contexte, pas spec — à garder comme note)* |
| **§5 — l'architecture des retours** | Les **trois couches** ; la couche contrat intégrale : identité **Calame**, les **8 règles** (citation obligatoire, une réussite d'abord, geste tenté, verdict franc en trois registres verbatim, UN point de travail, geste 10 min / feed-forward, jamais de note, 80-140 mots), sections `ton`/`longueur` éditables et règles 1-6 verrouillées ; garde-fou `retour_degrade` (un type ne s'active pas sans `attendus_retour`) ; règles 1-4 du 29/07 (geste observable, causal→constat en vf, namespaces `copie_eleve`/`texte_support`, **jamais la grille complète**) ; exception Monitoring (nomme la dimension) ; les **4 défenses anti-injection** ; latence < 3 min et parallélisation des P1 ; fichier de personnalité Calame unique | **38** (rendu par registre, `interrogatif` défini), **41** (l'injection se fait depuis les sections des fiches), **37** (la règle 8 cesse de dire l'élection) |
| **§7 — anti-triche** | Les **sept signaux** (durée, rythme/900 signes-min, sessions, collages bloqués, incohérence v1/auto-jugement, delta nul sur retour précis avec garde NULL≠0, style discordant), tous tagués, aucun bloquant ; convergence → drapeau via `signalerEnAttenteIA` (patron C1/T3) ; option **Pangram** [à valider], manuelle, jamais une preuve, post-rentrée recommandé ; « l'anti-triche protège le retour, pas la note » | — |
| **§10 — les risques** | Les dix risques révisés, en particulier : file de transcription à 140 copies (test de charge C4-L4), coût (980 appels semaine 1, leviers, B2-8), RLS sur `exercices_squelettes`/`exercices_metacognition` **jamais lisibles avant publication**, boucle lexicale auto-confirmante et sa seule parade | à réviser contre l'état réel (C7/C8 faits, calendrier) |
| **§11 — loi 25** | Le cadre (élèves 17+, consentement à 14 ans au Québec, information parents = pratique) ; **la lettre du 22 août** ; les 5 points (table de traitement, contestation → humain, jamais de diagnostic, purge EXIF, propriétaire institutionnel) ; sous-traitants | — ⚠️ **le jalon du 22/08 est dans sept jours** |
| **§0 — le socle** | La chaîne en **quatre temps** et sa raison (A20 : 20/25, quatre décomptes) ; un squelette par (dépôt × version × compétence) ; M1 (v1 seule alimente, vf = delta) ; 2N+4 ordre de grandeur jamais pilotage (A21) ; plafond mensuel, alerte 70 %, coupure ; versionnage `prompt_version`/`modele`/`instrument_version` ; définitions M3 (`aide_consommee`, `delai_*`, `distance_contexte` calculée, `delta_v1_vf` NULL≠0) — **la plupart ont maintenant un domicile au `01-` §11 (télémétrie) : la v6 peut citer au lieu de redéfinir** ; prompt de transcription fait foi (scribe, doutes, règle 7) | **36**, **39** (sous-dimensions actées cadre de collecte) |
| **Section B — les trous déclarés** | Le registre entier est à transporter et à retrier : voir Partie IV | **36** ferme B2-9 ; **53** ferme le trou d'`exercices_references` ; B2-14, B3-19, B3-20, B1-2, B1-7 déjà fermés |

---

## Partie II — Les décisions fines sans domicile NULLE PART

Celles-ci ne sont ni du schéma ni des lots : des décisions pédagogiques ou de conduite qui ne vivent **que** dans C3 v5.4 (vérifié par sondage dans les six sources — zéro occurrence), ou que dans la liste d'amendements. Si la v6 ne les recopie pas, elles meurent.

1. **L'identité de Calame** (Décision 6, §1) : Calame guide **tous** les exercices, composition et réception ; Aletheia reste la voix des séances de lecture guidée des livres. Le mot « Calame » n'apparaît dans aucune des six sources.
2. **Le geste « conditions de travail »** (§3) : trois valeurs, jamais noté, une mesure bâclée ne monte jamais une lettre, **trois « pas pu » d'affilée = drapeau prof, jamais un allègement**.
3. **La restitution à chaud** (§3) : 30 secondes, « ta thèse en une phrase ? », placée après le contrôle de transcription et avant tout envoi à l'IA. *(Le `01-` §7 la consomme pour bloquer une montée — mais sa définition n'existe qu'en C3.)*
4. **L'arbitrage « surnoter est moins grave que sous-noter »** (§3bis, §10) — il justifie deux décalages assumés (brut/relu, biais OCR) ; sans lui, un relecteur futur « corrigera » ces choix.
5. **Le périmètre de conduite de la rentrée** (entrée 49, in fine) : **aux diagnostics de la semaine 1, on ne regarde qu'Argumentation et Expression**, bien que les passations mesurent aussi Structure et Synthèse. *Décision de Louis du 11/08 — elle n'existe aujourd'hui QUE dans la liste d'amendements.*
6. **L'essai de Fragments probablement réservé aux HLP** (A27) et sa conséquence : l'inventaire d'ancres diffère par parcours ; la cadence se tient au plan d'évaluation, propriété du professeur, sans cadence différenciée.
7. **Le dépouillement immédiat du diagnostic** (option A, §1) : tous les bancs tournés avant le 25/08, pipeline photo/OCR critique dès la semaine 1 — la coupe « diagnostique sans pipeline manuscrit » de C4 est annulée depuis le 29/07.
8. **La voie mixte de septembre** (§4) : si peu de compétences sont `evaluee`, le routeur remplit avec elles seules, le reste du budget va aux exercices communs.
9. **« En faire plus »** (§4bis) : pull ~30 min/sem, minutes perdues (ni report ni écrêtage) ; push par fraîcheur chez l'élève ≤ C ; le bonus est un exercice normal marqué `bonus`.
10. **La règle « pas de fausse précision »** (C21, §4bis) : la matrice C6 affiche `n` dès maintenant, la « confiance » seulement si un modèle de certitude existe un jour — *à reformuler en v6 puisque le modèle est abandonné (36), mais la règle d'affichage survit.*
11. **Les deux réserves de méthode consignées de Louis** : sa propre sensibilité au halo au bac blanc (§4) ; « les livres lus étant des classiques, le spoiler pèse moins » (§6).

---

## Partie III — Tri des 27 amendements en attente (31 à 57)

Principe du tri : la v6 étant une réécriture depuis les sources, un amendement dont le contenu **est** désormais dans une source gelée s'absorbe tout seul. Ce qui reste est la **part C3** de chaque entrée — presque toujours du schéma ou des lots.

**S'absorbent par la réécriture (la source gelée fait foi, la v6 cite)** : **31** (signal de ciblage, `01-` §3), **32** (clôture de calibration, `01-` §7), **39** (pour sa part `00-`), **40** (fenêtre → fiche Monitoring §3), **45** (questions par observable → fiches), **52 + 55** (tables des modes admis, `02-` §3 — la v6 borne par renvoi et n'en cite plus les lignes), **54** pour sa part sources (réparées le 13/08).

**Part C3 à écrire directement dans la v6 — schéma et §3 (les « datés avant C4-L1 »)** : **33, 34, 37, 43, 44, 46, 47, 48, 49, 50, 51, 57**, plus les anciens **17, 18, 19, 20, 28**. Tant que C4-L1 n'a pas tourné, tout cela est gratuit ; après, ce sont des migrations. **La v6 doit reprendre la table « Datés » de la liste d'amendements comme registre à part entière** — elle est en soi un des contenus sans domicile.

**Part C3 à écrire dans la v6 — lots et purges** : **35** (manifeste C4-L2), **36** (purge des six mentions de la certitude cumulée + fermeture B2-9), **38** (rendu par registre au contrat), **41 + 42** (mécanisme d'injection depuis les fiches + condition d'`evaluee`), **53 + 56** (JSONB `contenu`, trou fermé, C5-L1 nomme le `05-`), **54** (domaine `genre`, filtre de parcours nommé comme opération du routeur avec son adresse), **57** (les trois demandes à la plateforme).

**Écarts préexistants signalés par l'entrée 57, à corriger en v6** : C3 écrit deux fois « la Connaissance et le Questionnement ne sont pas dans la table des modes admis » — faux depuis que le `02-` §3 donne `composer` à la Connaissance ; et C3 situe cette table au `02-` **§4** alors qu'elle est au **§3**.

**Chaîne 46 → 50 → 51, état net à retenir** (trois révisions successives, seule la somme compte) : le champ `source` et la règle de non-mélange (46) ; **deux séries de lucidité par famille** (50) ; détection = **un appel d'extraction unique**, aucun prompt de compétence touché, **site = la synthèse en classe**, fenêtre à **5**, hors opt-in du professeur (51). Le pari de Louis sur `marquage_supposition` est enregistré à la fiche Monitoring §9 avec sa condition de fermeture.

---

## Partie IV — Les trous que la v6 hérite (à transporter, pas à résoudre cette nuit)

1. **L'inscription de l'élève n'est déclarée dans aucune source** (⚠ entrée 54) : le filtre de parcours a besoin des classes de l'élève **au pluriel** (« est exclu l'élève dont TOUS les parcours figurent dans la liste ») ; le `parcours` du routeur §3 est une propriété de la *mesure*, pas de l'élève. C'est une donnée de la **plateforme** — le chantier « Accès & classes » du 14/08 (le module appartient à la classe) est probablement son point d'ancrage naturel, à vérifier.
2. **« La synthèse en classe » n'est définie nulle part** (⚠ entrée 51) : le flux 3 de la lucidité est conditionnel à un objet que les fiches appellent « l'ancre récurrente » alors qu'elle est déclarée non sommative — le renvoi commun est mort. À écrire quelque part avant que C4-L5 implémente la lucidité.
3. **B1-1 — le cœur R1-R5 n'appartient toujours à aucun lot** (item 34 du registre des ouverts, échéance 25/08). **B1-25 — l'écran de dépôt des fiches et de choix des statuts non plus** (sans lui, les statuts se posent en base à la main au 24/08).
4. **Trois documents « font foi » sans être du périmètre gelé** : `NOTE-CYCLE-PEDAGOGIQUE.md` (les six temps pédagogiques), `copies-tests/_commun/PROTOCOLE-CALIBRATION.md` (le banc), `Annexe-routeur.md` (le **registre des paramètres**, depuis A17 — budgets, planchers, fenêtres, cadences, quotas). La v6 doit déclarer leur statut : sources annexes gelées avec les six, ou documents vivants cités avec précaution.
5. **Trous déclarés restant ouverts à transporter** : B1-3 (construction de la semaine — largement écrite au `01-` §5 depuis, à re-vérifier), B1-4 (« pousser où ça progresse »), B1-5 (allumage du ciblage réception), B1-6 (statut de `03-`/`04-`), B1-23 (déclencheur C6-L4), B2-8 (**régime de modèle — le plus gros levier de coût, échéance avant la recette**), B2-10 à B2-13, B2-15 (palier Acquis, donnée due avant le 24/08), B2-24 (branche d'échec, clause provisoire au `01-` §5), B3-16, B3-17, B3-18, B3-21 (table de conversion 0-3 — la crédence de l'entrée 47 lui donne enfin une source dénombrable), B3-22 (formats de décembre/février), seuil des contestations répétées (B4).

---

## Partie V — Ce que je n'ai pas pu vérifier

- **`03-competences.md` (v1.1) et `04-Instances_Exercices.md` étaient encore en travail pendant la passe** (modifiés jusqu'à 00 h 50). Les verdicts « domicile dans les fiches / dans le 04- » sont à re-confirmer d'un coup d'œil à leur gel.
- **La numérotation du `01-` v4.0** : la v4 porte un §11 « Télémétrie et journalisation » ; l'ancien §11 « registre des paramètres » vit à `Annexe-routeur.md`. Tout renvoi « §11 » écrit avant le 13/08 doit être relu avec ce double sens en tête ; le renvoi « routeur §13 » du §0 de C3 est mort.
- **Le principe « la stagnation change la cible, jamais le volume »** : je le tiens pour probablement porté par le `01-` §1 (principes), mais je ne l'ai pas vérifié mot à mot — à confirmer avant de le retirer du §4 de la v6.
- Les extractions ont couvert 100 % des lignes de C3, mais une extraction n'est pas une lecture de Louis : ce relevé est un filet, pas une preuve d'exhaustivité.

---

## Proposition de méthode pour la séance v6 — [à valider]

1. Écrire la v6 depuis les six sources gelées + les fiches v2, en **citant** partout où un domicile existe (le réflexe anti-divergence : un contenu, un domicile).
2. Réinjecter la Partie I bloc par bloc, en intégrant les amendements de la Partie III **directement dans le texte** — la liste d'amendements se clôt et s'archive avec la v5.4, elle ne survit pas comme document vivant.
3. Recopier les Parties II et IV (décisions fines, registre des trous, registre des datés).
4. Contrôle de non-perte : chaque ligne de ce relevé cochée contre la v6 ; ce qui est volontairement abandonné se dit (comme `sens = passe` à la standardisation d'Expression).
