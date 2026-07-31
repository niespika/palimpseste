# SPEC C3 — Exercices & Compétences (spec unique, écriture + lecture)

> **Statut : v4.3 — SOCLE DE CONSTRUCTION** (gel du 29/07/2026 ; amendée les 29 et 30/07, amendements A1 à A19).
> **Règle de version (ajoutée le 29/07)** : toute série d'amendements **incrémente le numéro
> mineur**. Un lot dont le manifeste exige une version antérieure **s'arrête de lui-même** — le
> contrôle est mécanique, il ne dépend pas de la lecture d'une note.
> Le gel ne dit pas « ceci ne changera plus » : il dit que **la charge de la preuve a changé de
> camp**. On construit ce qui est écrit ici, sauf si quelque chose prouve que c'est faux. Ce qu'il
> protège, c'est qu'une session Code ne travaille jamais sur une cible mouvante.
> **Toute idée nouvelle va dans `IDEES_post_rentree.md` ; toute évolution de cette spec est un
> amendement daté**, inscrit au tableau de bord ci-dessous et journalisé au `CONTEXTE.md` du dossier
> de conception. Le relevé des arbitrages qui ont produit cette version :
> `RELEVE_Arbitrage_C3_2026-07-29.md`.
> Chantier C3 du plan de rentrée (`PLAN_CHANTIERS_RENTREE.md`) : le seul gros morceau neuf.
> **Règle R1 du plan : UN moteur + UN référentiel, instanciés deux fois** (écriture = Codex,
> lecture = Aletheia). Cette spec est le contrat de construction des chantiers C4 (moteur +
> écriture), C5 (lecture) et C6 (retours compétences). Elle **cite** la conception, elle ne la
> recopie pas — les sources de vérité pédagogiques vivent dans `palimpseste-conception/`.
>
> Toute session Code sur C4/C5/C6 lit : ce fichier + la section du lot demandé. Rien de plus (R4).
>
> **v2 (26/07, après revue de Louis).** Cycle à SIX temps ; formats 2×2 ; ortho/grammaire dans le
> cycle (hors lettre) ; Pangram en option [à valider] ; sources « en relecture Louis ».
>
> **v3 (27/07, reprise de Louis).** **Option B actée** : le routeur en charge dès la semaine 2 (§4)
> — **plus aucun arbitrage bloquant pour le gel de mercredi**. **Formats révisés** (§2) : la
> rédaction suivie passe au **manuscrit + photos + OCR partout**, y compris le formatif maison
> (v1 ET vf) ; le clavier reste pour les interactions courtes ; consigne de lisibilité + **signal
> de confiance de transcription** (au-delà du seuil : exercice à refaire lisiblement). **§5
> recadré** (objection de Louis retenue) : plus de « prompt maître » unique — une **architecture
> de retour en trois couches**, les couches par type s'écrivant avec les fiches de types, après
> leur spécification. Le modèle de certitude des lettres (§4bis) reste un chantier ouvert non
> bloquant.
>
> **v3.1 (28/07, relecture au fil de Louis — sections validées une à une).** **§4 tranché :
> variante B** (l'ex-A devient la coupe de repli) + note d'étalonnage de fin d'année ;
> **aménagement déclaré au profil élève, bascule clavier automatique** (§2, §6) ; **gabarit de
> la couche contrat révisé** (§5 — geste tenté nommé → verdict franc gradué → l'erreur →
> comment faire mieux) **[à valider sur le texte exact]** ; idée « validation OCR par l'élève »
> parquée dans `IDEES_post_rentree.md` (vigilance Expression consignée).
>
> **v4 (29/07, séance d'arbitrage et de gel).** Les trois revues adversariales indépendantes ont
> été fusionnées en une table unique (`FUSION_revues_C3.md`, 26 items + 21 corrections mécaniques
> + 5 faux positifs), et **Louis a validé la totalité des items, un par un**. Les changements
> structurants :
> - **§2 refondu** — **le formatif maison passe au clavier** (v1 et vf) ; le **manuscrit + OCR est
>   réservé aux passations en classe** et à l'essai Fragments ; **collage bloqué et journalisé**
>   dans les champs de rédaction.
> - **§3** — le **flux complet d'une passation diagnostique** est spécifié (rédaction seule en
>   classe, contrôle de la transcription par l'élève, retour en lot au déclenchement du prof) ;
>   deux champs de durée ; **restitution à chaud** et **geste sur les conditions** au dépôt.
> - **§4** — **trois gates** au lieu d'un ; **critère de recette chiffré** ; le routeur ne cible que
>   les compétences `evaluee` ; **budgets plancher/plafond par élève** ; **la file de validation
>   hebdomadaire disparaît** ; la stagnation change la **cible**, jamais le volume ; **dispositif
>   d'assiduité** (§4ter).
> - **§6** — assignation individuelle, table de jobs, index d'idempotence, identifiants de
>   compétence (**revus par A1 : dix identifiants, la famille en colonne**), définitions de
>   télémétrie, profil unifié confirmé.
> - **§11 nouveau** — **conformité loi 25**, avec un jalon daté au **22 août**.
> - Les lettres restent **côté prof** ; l'élève voit trajectoire et cible, et **choisit lui-même**
>   d'en voir davantage. **Aucune note dans Palimpseste.**
>
> **v4.3 (30/07, après la révision intégrale du `01-routeur.md`).** Onze amendements appliqués en une
> passe unique (A9-A19, détail au journal ci-dessous). Les quatre qui changent quelque chose au fond :
> **« cycle » désigne désormais la semaine de travail** — d'où `duree_exercice_min`, `regime_v1vf`,
> et un coût compté **par exercice** ; **la cadence 2-1 est supprimée**, le partage écriture/lecture
> devient probabiliste par élève et le nombre de cycles une dérivée du Calendrier ; **R6 est
> réécrite** — cibles disjointes TC/HLP dissoutes, drapeau « transfert » porté par le **genre**
> d'exercice et non par le parcours, d'où un champ `genre` au §6 ; **l'année d'exercices s'arrête au
> 10 mai**. Trois ouvertures se referment, le §11 du routeur devient le registre faisant foi de ses
> paramètres.

---

# Tableau de bord du socle

*Cette section est la première à lire et la première à mettre à jour. Elle dit **ce qui a bougé
depuis le gel** et **ce qui n'est pas décidé**. Une session qui la lit sait en une minute sur quoi
elle peut s'appuyer et sur quoi elle doit s'arrêter.*

## A. Journal des amendements

**Trois régimes.** Un amendement se qualifie avant de s'écrire — c'est ce qui permet d'en faire un
en trois minutes plutôt qu'en une séance.

| Régime | Quand | Ce qu'on fait |
|---|---|---|
| **(a) Correction** | Une **contradiction** est découverte dans la spec, ou entre la spec et une source de vérité | **Amendement immédiat, sans discussion.** On ne débat pas d'une incohérence, on la lève. Inscrit ici, journalisé au `CONTEXTE.md`. |
| **(b) Périmètre** | Un **chantier nouveau** ou une décision extérieure oblige à revoir C3 | **Inscrit ici tout de suite**, à l'état *en attente de décision*, **même non tranché** — c'est l'inscription qui l'empêche de se perdre. Il ne modifie le corps de la spec qu'une fois tranché par Louis. |
| **(c) Trou déclaré** | Une **précision essentielle est impossible aujourd'hui** (il manque un banc, un usage, une donnée) | Ce n'est pas un oubli : c'est un **trou nommé**, listé en section B. Il se referme quand la donnée existe, et devient alors un amendement (a). |

**Règle de circulation avec les sessions Code.** Un amendement se pose **entre** deux sessions,
jamais pendant. Chaque prompt de lot déclare la **version de la spec** contre laquelle il a été
écrit (règle de manifeste, §9) : si la spec change de version, le prompt le dit ou le lot s'arrête.

| Date | Origine | Ce qui change | Sections | Régime |
|---|---|---|---|---|
| 29/07/2026 | Séance d'arbitrage et de gel | Version initiale du socle | toutes | — |
| **29/07/2026** | Relecture du `00-referentiel.md`, passe §1 | **A1 — Questionnement.** Les deux Problématisations fusionnent en **une seule** compétence, renommée ; le compte passe à **dix compétences + Monitoring** ; les identifiants cessent d'être deux compétences distinctes ; l'activation devient **(compétence × famille × classe)** ; la phrase « un élève HLP pur ne la voit jamais » devient **fausse** | §0, §1.1, §6 | **(a)** |
| **29/07/2026** | Relecture, passe §2 | **A2 — le Monitoring sort de l'échelle unique E-A ↔ 0-4** et reçoit la sienne : **amplitude d'écart 0-3 + direction** (surconfiance / sous-confiance), jamais notée | §1.1 | **(a)** |
| **29/07/2026** | Relecture, passe §6 | **A3 — provenance.** Le parcours TC/HLP **n'est pas observable sur le travail fait à la maison** (seule exception : la lecture du livre) ; `classe_id` devient **nullable** sur `competences_mesures`, et le parcours dérivé vaut **`indetermine`** — valeur majoritaire | §6 | **(a)** |
| **29/07/2026** | Relecture, passe §4.2 | **A4 — justification de l'anti-halo.** C'est une **garantie par construction**, non une suppression de halo démontrée : l'hypothèse forte a été réfutée au test de juin | §0 | **(a)** |
| **29/07/2026** | Relecture, passe §6 | **A5 — attribution du parcours par le genre de l'exercice**, et **R6 à revoir** : ses cibles disjointes et son drapeau « transfert » présupposent une provenance disponible sur le maison | §6, et `01-routeur.md` R6 | **(b)** *en attente de décision* |
| **29/07/2026** | Dépouillement des conversations de juin | **A6 — jalon « voir un palier Acquis produit »** à ajouter au critère de recette : le critère actuel peut être satisfait sans que le seuil ait **jamais** été observé ouvert, sur aucune compétence | §1.7 | **(b)** *en attente de décision* |
| **30/07/2026** | Révision du `01-routeur.md`, 30/07 | **A9 — renommages de schéma, faits avant la migration tant qu'ils sont gratuits.** **`duree_cycle_min` → `duree_exercice_min`** et **`regime_cycle` → `regime_v1vf`** (§3, §6). Raison : « cycle » désigne désormais la **semaine de travail** (`01-routeur.md` §1, acté 30/07), et un cycle contient plusieurs exercices — les anciens noms se lisaient à contre-sens, une durée « de cycle » déclarée par exercice et un régime « de cycle » qui est en réalité le régime v1→vf du type | §3, §6 | **(a)** |
| **30/07/2026** | Révision du `01-routeur.md`, 30/07 | **A10 — le vocabulaire « cycle » dans le corps de la spec.** « Coût par cycle » → **coût par exercice** (§0) ; budgets « en temps de cycle » → **« en temps d'exercice cumulé sur la semaine »** (§4) ; « bonus = cycle normal », « un cycle entier sur une compétence non bancée », « 2N+4 appels par cycle » requalifiés. **Le « cycle à six temps » n'est PAS renommé dans `NOTE-CYCLE-PEDAGOGIQUE.md`** (hors périmètre) : le §3 porte un **avertissement de vocabulaire** qui signale la divergence au lieu de la résorber — à trancher quand ce document sera relu | §0, §3, §4, §4bis, §10 | **(a)** |
| **30/07/2026** | Révision du `01-routeur.md`, 30/07 | **A11 — la règle de la mesure secondaire, réécrite en trois étages.** La formulation du 29/07 (« jamais celle qu'on travaille dans le cycle de la semaine ») reposait sur une **prémisse fausse** — qu'une seule compétence soit travaillée par semaine. Désormais : **(1) contrainte dure**, la secondaire n'est jamais **la cible de cet exercice** ; **(2) préférence, non interdiction**, on sonde de préférence ce qu'on n'entraîne pas ; **(3) motifs légitimes de sondage**, une compétence qui semble stagner (vérifier) ou dont le niveau cible est atteint (vérifier que ça tient) | §6 | **(a)** |
| **30/07/2026** | Révision du `01-routeur.md`, 30/07 | **A12 — la cadence 2-1 est supprimée.** Le partage écriture/lecture n'est plus une rotation calendaire : il est **probabiliste et par élève** (fonction de l'élève, de son travail, de son progrès). Le nombre de cycles de l'année devient une **dérivée du Calendrier** (semaines de cours − 2) au lieu d'un chiffre posé | §4 | **(b)** *tranché par Louis le 30/07* |
| **30/07/2026** | Révision du `01-routeur.md`, 30/07 | **A13 — l'année d'exercices s'arrête début mai.** L'année scolaire des premières et terminales se termine le **20 mai** ; **plus aucun exercice après le 10 mai**. La note d'étalonnage du §4 compare donc septembre à une passation **de début mai**, non de juin ; l'ordre de grandeur annuel du §10 passe de ~34 semaines à **~28 cycles** | §4, §10 | **(a)** |
| **30/07/2026** | Révision du `01-routeur.md`, 30/07 | **A14 — A5 est TRANCHÉ : R6 réécrite, le drapeau « transfert » passe au GENRE.** La fonction « cibles primaires TC et HLP disjointes la même semaine » est **dissoute** — flux unique, profil unique, budget unique : il n'y a plus deux files à désynchroniser. Le drapeau « transfert » compare désormais les mesures d'une même compétence **par genre d'exercice**, non par parcours — ce qui le rend **calculable**, le genre étant toujours connu là où le parcours ne l'est pas (A3). Conséquences de schéma : **champ `genre` nullable** sur `exercices_types` (`dissertation`, `explication_texte` au tronc commun ; `question_interpretation`, `essai` en HLP ; les types génériques n'en ont pas), et **ordre d'attribution du parcours** écrit — la classe, puis le genre, puis `indetermine`. **Ferme B2-14** | §6, tableau de bord | **(a)** |
| **30/07/2026** | Révision du `01-routeur.md`, 30/07 | **A15 — B1-2 se referme : la règle d'espacement existe** (`01-routeur.md` §6 — pool des candidates, priorités, une sonde par compétence et par cycle au moment optimal, plafond de sondes). Le calcul de N est spécifiable ; **le chiffrage réel des appels dépend encore du plafond de sondes par cycle**, paramètre provisoire | tableau de bord | **(a)** |
| **30/07/2026** | Révision du `01-routeur.md`, 30/07 | **A16 — statut de relecture du routeur.** `01-routeur.md` → **relu intégralement par Louis le 30/07**, quatorze passes (§1-§13 + annexe B), révision close. **B1-6** mise à jour : les lots dont le manifeste exige le routeur ne sont plus bloqués par *son* statut ; restent en relecture `02-`, `03-`, `04-` | §0, tableau de bord | **(a)** |
| **30/07/2026** | Révision du `01-routeur.md`, 30/07 | **A17 — B4 renvoie au §11 du routeur, pas de double copie.** Le §11 du `01-routeur.md` devient le **registre faisant foi des paramètres du routeur** (valeurs importées le 30/07). B4 perd les lignes budgets élève, plancher de mesure, fenêtre de montée, cadence d'ancre et quota bonus, remplacées par un renvoi ; elle garde les paramètres de la **plateforme** hors routeur. Raison : deux copies d'un même chiffre finissent par diverger | tableau de bord | **(a)** |
| **30/07/2026** | Révision du `01-routeur.md`, 30/07 | **A18 — l'ouverture B3-19 se referme.** « Distinction visuelle Calame / Aletheia » : résolue par la décision de navigation du 30/07 (`01-routeur.md` §2) — le cycle vit sur **une page unique** dont **seul l'en-tête change** (module, couleur, voix de l'IA) ; la famille est un **attribut visuel, jamais un lieu** | tableau de bord | **(a)** |
| **30/07/2026** | Révision du `01-routeur.md`, 30/07 | **A19 — vérifications de cohérence sur les diagnostiques.** *Vérifié sans correction* : le format de la semaine 1 (**essai + explication de texte**) est déjà ce que disent §1.4 et §3 ; C3 ne cite **nulle part** l'ancienne progression de grain micro→méso→macro ; C3 ne cite **pas** le seuil d'entrée du Questionnement, passé d'[à valider] à acté — rien à mettre à jour de ce côté. *Inscrit* : les **formats de décembre et de février/mars** sont passés **[à valider]** et entrent en **B3-22**, avec un renvoi au §4 — leur existence au calendrier n'est pas en cause, seul leur format l'est | §4, tableau de bord | **(a)** |
| **29/07/2026** | Décision de Louis sur l'ouverture B1-7 | **A8 — le Monitoring reçoit ses tables propres.** Conséquence de schéma d'A2, laissée ouverte par A7 et tranchée : **`monitoring_mesures`** et **`monitoring_niveaux`** (§6), plutôt que deux colonnes nullables dans les tables de compétences. Raison retenue : le Monitoring est de second ordre — jamais noté, jamais cible du routeur, deux sous-dimensions qui ne se moyennent pas, un état qui n'est pas une lettre ; une table à part rend cette différence visible dans le schéma au lieu de la cacher derrière des colonnes vides. **Trois contraintes d'implémentation** y entrent : il **tourne en dernier** ; **la calibration ne compte que sur les compétences ayant passé la recette du §1.7**, ce qu'enregistre `competences_couvertes[]` ; la comparaison élève ↔ squelette se fait **par le code, jamais par l'IA**. **Et les quatre champs de télémétrie du Monitoring entrent dans `exercices_metacognition`, à collecter dès le premier exercice de septembre** — aucun banc ne peut valider cet instrument avant la rentrée, l'année 2026-27 en tient lieu d'épreuve, et une année de collecte manquante ne se rattrape pas. **Ferme l'ouverture B1-7 ; débloque C4-L1** | §6, tableau de bord | **(a)** |
| **29/07/2026** | Contrôle de cohérence après A1-A6 | **A7 — mises en cohérence rendues nécessaires par les six premiers.** *(i)* Le bloc « Sources de vérité » du §0 annonçait encore « 6 écriture + 5 lecture », portait le statut « en relecture (26/07) » pour un document désormais relu, et présentait le nommage des duals comme tranché en « deux compétences distinctes » — ce qu'A1 défait pour l'une des deux paires ; il est réécrit, avec un **tableau de statut de relecture par document**, seul objet que la règle de manifeste doit interroger. *(ii)* Le §1.4 précise désormais quelles compétences les deux diagnostiques portent, en TC et en HLP. *(iii)* La **section B du tableau de bord** rattrape la section A : A5 et A6 y entrent comme décisions différées, les deux sous-dimensions du Monitoring et le nombre de crans y entrent comme trous déclarés, et le statut des sources y est corrigé. *(iv)* **Passage en v4.1** avec règle de version : toute série d'amendements incrémente le numéro mineur, pour que le contrôle de manifeste soit mécanique. **Une conséquence d'A2 n'a pas pu être tirée** et devient l'ouverture **B1-7** : le Monitoring a sa propre échelle, mais `competences_niveaux` ne porte qu'une `lettre` | en-tête, §0, §1.4, tableau de bord | **(a)** |

> **Conséquence de manifeste — à traiter avant le prochain lot Code.** Les amendements **A1** et **A3** touchent le **schéma** du §6 : la clé de `competences_actives_par_classe`, les identifiants de compétence, l'ajout de `famille` et la nullabilité de `classe_id` sur `competences_mesures`. Or `PROMPT_Code_C4_L1.md` et `PROMPT_Code_C4_L2.md` ont été déposés le 29/07 **contre le socle non amendé (v4)** : **ils sont périmés** et doivent être réécrits avant lancement. **Depuis A7, le contrôle est mécanique** — un prompt qui exige une version antérieure s'arrête de lui-même ; cette note n'a plus à porter seule cette charge. **B1-7 étant tranchée par A8**, ils ont été **réécrits contre la v4.2** le 29/07 — manifeste, pièges de schéma et seed remis à jour. **Mise à jour du 30/07** : la spec passe en **v4.3** et les deux prompts exigent la v4.2 — ils sont donc de nouveau arrêtés d'eux-mêmes, et **A9** (renommages) comme **A14** (champ `genre`, ordre d'attribution du parcours) touchent leur §6. Mais **plus rien ne les attend** : B1-7 est fermée, le routeur est validé, le schéma est stabilisé. **Leur réécriture est lançable dès que Louis le décide** — elle n'a volontairement pas été faite dans la passe du 30/07.

> **Sources des six amendements** : séance de relecture intégrale du `00-referentiel.md` (Louis × Mètis, 29/07 — les huit sections sont passées) et dépouillement des six conversations de conception désormais versées dans `palimpseste-conception/conversations/`. Détail et arguments : journal du `CONTEXTE.md` au 29/07, et `00-referentiel.md` §1, §2, §4.2, §6.


## B. Ce qui n'est PAS décidé (trous déclarés au 29/07)

Une session qui rencontre l'un de ces points **ne l'invente pas** : elle s'arrête et le signale
(règle R7 du plan — les décisions se prennent hors session).

**B1 — Ouvertures qui bloquent un lot**

| # | Point ouvert | Qui le referme | Bloque |
|---|---|---|---|
| 1 | **Le cœur R1-R6 du routeur n'appartient à aucun lot** du §9, alors qu'il doit être écrit avant le 25/08 | Louis — créer le lot et le numéroter | l'allumage du routeur ; C4-L2 a été rédigé comme un lot d'écrans en conséquence |
| ~~2~~ | ~~**La règle d'espacement des mesures secondaires**~~ **ÉCRITE le 30/07** — `01-routeur.md` §6 : pool des candidates, priorités, une sonde par compétence et par cycle au moment optimal, plafond de sondes. Le calcul de N est donc spécifiable ; **le chiffrage réel des appels dépend encore du plafond de sondes par cycle**, paramètre provisoire (`01-routeur.md` §11) | — | *fermée* |
| 3 | **La construction de la semaine sous contrainte de budget** — comment le routeur compose des types de durées inégales entre plancher et plafond | `01-routeur.md` | C4-L2 (le *fait quand* du remplissage) |
| 4 | **La règle « pousser où ça progresse »** | session couches 2-3 | rien à court terme |
| 5 | **Les règles de ciblage LECTURE** (R1-R6 sont écrites pour l'écriture) | session dédiée Louis × Calame, avant l'allumage | C5 |
| 6 | **Le statut des sources de vérité.** `00-referentiel.md` **relu et validé** (29/07) · `01-routeur.md` **relu et validé** (30/07, quatorze passes) · `02-`, `03-`, `04-` restent **en relecture** — le tableau du §0 fait foi | Louis | tout lot dont le manifeste exige un document encore en relecture. **Le routeur n'est plus un blocage** : C4-L2 et le futur lot R1-R6 ne sont plus arrêtés par *son* statut |
| ~~7~~ | ~~**Où vit l'état du Monitoring ?**~~ **TRANCHÉ le 29/07 (A8) : deux tables propres**, `monitoring_mesures` et `monitoring_niveaux` (§6). Le Monitoring ne figure ni dans `competences_mesures` ni dans `competences_niveaux` | — | *fermé* |

**B2 — Décisions différées**

| # | Point ouvert | Échéance |
|---|---|---|
| 8 | **Régime de modèle** — Haiku-hebdo / Sonnet-ancres (D9 du 28/07). **Le plus gros levier de coût restant** | avant la recette |
| 9 | **Modèle de certitude cumulée** (§4bis) — remplacerait la règle discrète « 2 sur 3 » | session dédiée ; le schéma supporte les deux |
| 10 | **Option Pangram** (§7) — détection externe, déclenchement manuel. Préalables : qualité sur le français, ajout à la liste des sous-traitants | post-rentrée recommandé |
| 11 | **Information aux parents** (§11) — pratique d'établissement, pas obligation légale | à confirmer par l'établissement, avant le 22/08 |
| 12 | **Retour éditable par le prof** (§3bis) — conserve-t-on la version originale de l'IA à côté de la version publiée ? | à l'implémentation de C4-L4 |
| 13 | **Recalibration du corpus de lecture** sur copies réelles | possibilité, pas jalon |
| ~~14~~ | ~~**A5 — R6 est à revoir**~~ **TRANCHÉ le 30/07 (A14)** — R6 réécrite en **règle d'observation** : les cibles disjointes TC/HLP sont dissoutes (flux, profil et budget uniques), et le drapeau « transfert » compare les mesures d'une même compétence **par genre d'exercice**, non par parcours. Voir `01-routeur.md` §5 et le §6 ci-dessous | — | *fermée* |
| 15 | **A6 — jalon « voir un palier Acquis produit »** au critère de recette *(amendement (b), en attente de décision)*. Le critère actuel (§1.7) peut être satisfait sans que le seuil ait **jamais** été observé ouvert, sur aucune compétence | Louis, avant la recette du 24/08 |

**B3 — Textes et écrans non spécifiés (volontairement)**

| # | Point | Où il se décide |
|---|---|---|
| 16 | **Texte exact du gabarit de la couche contrat** (§5) | design C4-L3/L5 |
| 17 | **Contenu exact de l'écran de retour**, dont l'encart « langue » | design C4-L3/L5 |
| 18 | **Frise élève et page de parcours** (§3, §4ter) — seuls les **compteurs** entrent dans C4 | conception ultérieure |
| 22 | **Les formats des diagnostiques de décembre et de février/mars** sont passés **[à valider]** le 30/07 (l'ancienne « progression de grain micro→méso→macro » supposait un septembre en micro-tâches, ce que le format « essai + explication de texte » de la semaine 1 dénoue). Seul le format de la semaine 1 est arrêté | conception, avant décembre |
| ~~19~~ | ~~**Distinction visuelle Calame / Aletheia**~~ **RÉSOLU le 30/07 (A18)** — décision de navigation, `01-routeur.md` §2 : le cycle vit sur **une page unique** dont **seul l'en-tête change** (module, couleur, voix de l'IA). La famille est un **attribut visuel, jamais un lieu** | *fermée* |
| 20 | **Utilité réelle de `duree_redaction_min`** | à réévaluer à la conception des types |
| 21 | **Les deux sous-dimensions du Monitoring** — lucidité sur l'incompris, calibration de la confiance (A2, *[à valider]*) | **aucun banc ne peut le tester avant la rentrée** : l'année 2026-27 en tient lieu d'épreuve |

**B4 — Valeurs provisoires (réglage empirique)**

Toutes celles-ci sont **adoptées comme principe, pas comme résultat** — le banc et l'usage les
révisent, et leur révision est un amendement de régime (a), pas une renégociation.

> **A17 (30/07) — les paramètres DU ROUTEUR ne sont plus copiés ici.** Le **§11 du
> `01-routeur.md` est le registre faisant foi** des paramètres du routeur ; leurs valeurs y ont été
> importées le 30/07. Y vivent notamment : **budgets élève** (plancher/plafond, quota optionnel),
> **plancher de mesure**, **fenêtre de montée temporelle**, **cadence d'ancre**, **quota bonus**,
> et le **plafond de sondes par cycle**. Le tableau ci-dessous ne garde que les paramètres de la
> **plateforme**, hors routeur — deux copies d'un même chiffre finiraient par diverger.

| Paramètre | Valeur au 29/07 | Section |
|---|---|---|
| Critère de recette | ≥ 15 copies · accord ±1 ≥ 80 % · golds antérieurs | §1.7 |
| Seuil « semaine faite » | 2/3 ou 3/4 des exercices — **paramètre de configuration** | §4ter |
| `confiance_ocr` | désaccord entre deux passes ; coût à surveiller sur un an | §2 |
| `aide_consommee` | dépliages + relectures — définition révisable selon les types | §0 |
| Contrat de latence | retour < 3 minutes | §5 |
| Seuil des contestations répétées | **à chiffrer** | §9, C6-L1 |
| Corpus de textes décomposés | 20 avant la semaine 2, puis au fil de l'eau | §4 |
| Échelle du Monitoring (A2) | amplitude d'écart 0-3 + direction — **nombre de crans provisoire** | §1.1 |

---

## 0. Lexique et sources de vérité

**Lexique minimal** (le reste est expliqué en contexte) :
- **v1 / vf** : première version de l'élève / version finale après retour.
- **Squelette** : la sortie structurée de la Phase 1 d'évaluation — l'IA extrait les faits de la
  copie (thèses, preuves, liens, faits de langue…) avec citations exactes, sans juger. La Phase 2
  note depuis ce squelette seul. **C'est une garantie par construction** : la Phase 2 est structurellement empêchée d'être contaminée par ce qui ne figure pas au squelette. *(**A4, 29/07** — le nom « anti-halo » est un héritage. L'hypothèse d'un halo de la belle prose sur le jugement de fond a été **réfutée dans sa version forte** au test de juin. Ce que ce test a démontré est différent, et tient : forcer l'extraction **rend un modèle économique discriminant** — en une seule étape il écrasait les trois copies-tests au même palier — et **rend le jugement inspectable**. Le halo **inter-compétences**, lui, a bien été observé, et c'est ce que les règles de cécité mutuelle empêchent. Conséquence opérationnelle : **la précision du prompt de Phase 1 est le point de fragilité du dispositif entier**, puisque la Phase 2 ne peut plus rien rattraper. Détail : `00-referentiel.md` §4.2.)*
  **Il y a un squelette par (dépôt × version × compétence mesurée)** — jamais un squelette unique
  par copie : le design bi-phasé par compétence est celui que les bancs valident (pilote
  Argumentation, 4 runs Structure, 3 runs Expression ; leurs prompts font foi). Partout où cette
  spec écrit « le squelette » au singulier (§3.3, §3.6), il faut lire **le squelette de la
  compétence cible**.
- **Appels froids / chauds** (décision de juin) : le **jugement froid** est la chaîne P1/P2 —
  P1 extrait le squelette, **P2 produit le verdict** (observables et niveau, en données
  structurées, jamais du texte pour l'élève) ; la **reformulation chaude** est un **appel
  distinct** (§5) qui reçoit squelette et verdict et écrit ce que l'élève lit.
  **Coût par exercice** : `(P1+P2) × N` sur la v1, `(P1+P2) × 1` sur la vf (**la vf ne repasse que
  pour la compétence visée par le retour**), plus **2 appels chauds** (retour de v1, retour final)
  — soit **2N + 4**, où N est le nombre de compétences mesurées. *(A10, 30/07 : c'est bien par
  **exercice**, pas par cycle — les deux appels chauds sont le retour de v1 et le retour final d'un
  seul exercice, et un cycle en contient plusieurs.)*
- **Référence décomposée** : le corrigé structuré d'un texte support (problème, thèse, garants,
  moments…), généré par IA puis **validé par le prof**, une fois par texte. Elle appartient au
  **texte**, jamais à l'élève : elle se fabrique **une seule fois**, à la constitution du corpus.
  Le squelette d'une copie d'élève, lui, n'est jamais validé par le prof.
- **M1** : les observables d'une mesure viennent de la **v1 seule** ; la vf n'alimente que le delta.
  **Corollaire impératif** : le verdict de la Phase 2 sur la vf sert **uniquement** à écrire le
  retour final ; il **n'écrit jamais** dans `competences_mesures`.
- **M3** : trois champs de télémétrie par mesure, **définis ici avec leur unité et leur source** :
  - `aide_consommee` — **nombre de dépliages de la fiche stratégique + relectures** (la fiche est
    repliée-dépliable en B-A, §3.1). *Définition provisoire, révisable selon les types.*
  - `delai_depuis_dernier_travail` — **deux champs** : `delai_jours` (calendaire, pour la récence
    du modèle de certitude) et `delai_mesures` (unité native du routeur — `01-routeur.md` §3 :
    « l'unité de temps du routeur est la mesure, pas la semaine »).
  - `distance_contexte` — énumération **`meme_type` / `meme_famille` / `transfert`**. Elle mesure
    le transfert : un succès obtenu sur le type qu'on vient de travailler dix fois ne vaut pas un
    succès sur un type neuf, et c'est ce qui permet à l'escalade N2 de distinguer un problème de
    *réception* d'un problème de *transfert*.
- **`delta_v1_vf`** : **comparaison des squelettes** v1 et vf (jamais des verdicts) — la mesure du
  delta est ainsi objective. **NULL n'est pas 0** : une passation en classe n'a pas de vf, son delta
  est NULL, et le lire comme un zéro fabriquerait un faux signal de « réceptivité nulle » (§7).
- **Versionnage de l'instrument** : `prompt_version` et `modele` **par phase**, `instrument_version`
  sur les mesures. Sans eux, on ne peut pas séparer « l'élève a progressé » de « le prompt a
  changé ».
- **Ancre / trajectoire** : mesures en classe (haute validité, basse fréquence) / exercices maison
  (haute fréquence, validité molle). Règles v1 : montée par la trajectoire (2 mesures sur 3),
  descente par les ancres seules, plafond ancre+2. **Révision en cours** : un modèle de certitude
  cumulée pourrait unifier ces règles (§4bis) — le schéma les supporte toutes les deux.
- **Gate** : interrupteur de fonctionnalité (patron `rag_actif`). Tout le neuf naît gaté (R2).

**Sources de vérité** (dossier `palimpseste-conception/`). Ces documents portent l'état de la
conception ; aucun n'est tenu pour globalement acté tant que Louis ne l'a pas validé explicitement,
**document par document**. La **réorganisation en cinq documents est faite** (27/07 — Référentiel
unifié · Routeur · Exercices · Compétences Écriture · Compétences Lecture) ; les chemins ci-dessous
sont à jour.

**Statut de relecture (mis à jour le 29/07 — c'est lui que la règle de manifeste du §9 interroge) :**

| Document | Statut |
|---|---|
| `00-referentiel.md` | **relu intégralement par Louis le 29/07** — les huit sections sont passées ; il porte les amendements A1 à A6 |
| `01-routeur.md` | **relu intégralement par Louis le 30/07** — quatorze passes (§1-§13 + annexe B), révision close. Son **§11 est le registre faisant foi des paramètres du routeur** (A17) |
| `02-exercices.md` | **en relecture** |
| `03-competences-ecriture.md` → `competences/*.md` | **en relecture** ; les fiches versées sont validées une à une par leur banc |
| `04-competences-lecture.md` → `competences-lecture/*` | **en relecture** |

*Sur le **nommage des duals** : la décision du 27/07 (« deux compétences distinctes, celle de lecture
s'appelle Mouvement ») **reste vraie de la paire Structure / Mouvement** et **ne vaut plus pour la
paire Problématisation** — l'amendement **A1** les a fusionnées en une seule compétence, le
**Questionnement**. L'hypothèse de covariance des duals ne se teste donc plus que sur Structure /
Mouvement : on ne mesure pas la covariance de deux choses qui n'en font qu'une. Le **Monitoring** est
bien transversal lecture-écriture (il existe côté écriture via la phase « se juger ») et vit,
**depuis A2, sur sa propre échelle** — voir §1.1.*

- `00-referentiel.md` — le **Référentiel unifié** : **dix compétences** (5 écriture, 4 lecture, et le
  Questionnement, des deux familles) **+ le Monitoring**, l'échelle, les ancres (celles de lecture
  restent à rédiger, §5), les sources de mesure du profil (les décisions Fragments y sont intégrées —
  l'ex-note est archivée).
- `01-routeur.md` — le routeur des **deux familles** (couches, R1-R6, escalade, lettres [révision
  « certitude » ouverte], télémétrie §10, aile lecture §13).
- `02-exercices.md` — la **bibliothèque unifiée des types** (écriture 1-14, lecture L1-L12, gestes,
  banque d'instances, injecteur) — **le schéma n'en dépend pas** : un type = une ligne de la table.
- `03-competences-ecriture.md` → `competences/*.md` et `04-competences-lecture.md` →
  `competences-lecture/*` — grilles d'observables et **prompts P1/P2** (ils font foi ; les bancs
  d'août les valident — chemin critique : `NOTE-CYCLE-PEDAGOGIQUE.md` §7).
- `NOTE-CYCLE-PEDAGOGIQUE.md` — le cycle à six temps et ses règles (actées ; active jusqu'au gel).
- **`PROMPT_transcription_copies_tests.md` (repo)** — le **prompt de transcription**, conservé tel
  quel et **faisant foi** (acté 29/07). Il est strictement littéral (« tu es un scribe, pas un
  correcteur »), respecte retours à la ligne et paragraphes, produit une liste de « Doutes », et sa
  **règle 7 neutralise l'injection de prompt au stade de la transcription**. Sa génération réussie
  sur les copies-tests vaut test : **aucun jalon OCR n'entre au chemin critique d'août**.

*Renvoi corrigé (C3)* : la mention « §5 » du présent §0 désigne **`00-referentiel.md` §5**, non le
§5 de cette spec.

---

## 1. Les décisions qui fondent la spec (toutes actées, journal du CONTEXTE des 25-26/07)

1. **Un référentiel unifié — AMENDÉ le 29/07 (A1, A2)** : **dix compétences**, réparties en deux
   familles, **plus le Monitoring** en second ordre, transversal lecture-écriture (la calibration
   de l'élève sur lui-même). Écriture : Expression, Argumentation, Structure, Connaissance,
   Synthèse. Lecture : Restitution, Reconstruction, Évaluation, **Mouvement** (renommée le 27/07,
   anciennement « Structure » de lecture). Et **le Questionnement**, seule compétence des **deux**
   familles.
   **A1 — le Questionnement remplace les deux Problématisations, qui n'en font plus qu'une.**
   Renommage acté le 29/07 : « Problématisation » est le mot du bac et laissait croire à l'élève
   qu'on évaluait sa *problématique*. La fusion est motivée empiriquement — la frontière Moyen/Bon
   des ancres d'écriture (problème *reçu* contre problème *construit*) est exactement le champ
   `question_specifique` de la grille de lecture, écrit indépendamment. Conséquences dures :
   - **`ecriture.problematisation` et `lecture.problematisation` ne sont plus deux compétences.**
     Il y a **un** `questionnement`, avec **une** lettre au profil, alimentée par les deux familles.
     La phrase « deux compétences distinctes qui ne s'agrègent jamais » est **retirée**.
   - **L'activation se lit (compétence × famille × classe)** et non plus (compétence × classe).
     La **famille** devient une colonne de `competences_actives_par_classe` et de
     `competences_mesures` (§6).
   - **HLP a les dix compétences, pas neuf.** Le Questionnement n'y est **pas actif en écriture**
     (l'essai n'est pas la dissertation : la question est donnée) mais il l'est **en lecture**.
     Donc : **« un élève HLP pur ne la voit jamais » est faux** — c'était un oubli, corrigé par
     Louis le 29/07. Un élève bi-classe l'a dans les deux familles. Le sort de la 6ᵉ mesure de
     l'essai diagnostique se règle par la même table.
   **A2 — le Monitoring ne vit pas sur l'échelle commune.** Les neuf autres compétences et le
   Questionnement se lisent en **E-A ↔ 0-4** avec ancres comportementales. Le Monitoring, lui, se
   lit en **amplitude d'écart (0 calibré → 3 massif) plus une direction** (surconfiance /
   sous-confiance, sans objet à 0). Le progrès est l'amplitude qui baisse ; la direction est un
   diagnostic, jamais un niveau — et les deux directions ne se valent pas, la surconfiance bloquant
   l'apprentissage. Il n'est **jamais noté** et **jamais cible du routeur**. Nombre de crans
   *provisoire (réglage empirique)*. Ses deux sous-dimensions — lucidité sur l'incompris,
   calibration de la confiance — sont *[à valider]* : aucun banc ne peut le tester avant la
   rentrée, l'année 2026-27 en tiendra lieu d'épreuve. Détail : `00-referentiel.md` §1 et §2.
2. **L'exercice se déroule en SIX temps** (révisé 26/07 ; formulation précisée le 30/07 — A10) :
   préparer → écrire (v1) → se juger →
   retour → réviser (vf) → **retour final** (le retour sur la révision elle-même : ce qui s'est
   amélioré et pourquoi, ce qui ne s'est pas amélioré et pourquoi, la suite).
3. **La sélection des exercices — tranché le 27/07 : variante B, le routeur en charge dès la
   semaine 2**, sur les profils du diagnostic (raisonnement de Louis : le parcours doit suivre
   les forces et les faiblesses réelles). Le prof pilote par **budgets** (temps hebdomadaire +
   optionnel), garde l'override et les exercices communs. **Deux mécanismes d'ajustement actés** :
   (a) la **préférence de l'élève**, recueillie à intervalle régulier — veut-il davantage
   d'écriture ou de lecture dans son volume ? — respectée dans les limites du budget et des
   règles de ciblage ; (b) l'**ajustement dynamique** — là où l'élève stagne malgré les
   interventions, on allège (la pause : cousin de l'escalade N3) ; là où il progresse, on peut
   pousser (exploiter l'élan — règle nouvelle, à préciser à la session couches 2-3). La
   variante A (sélection par le plan du prof) reste la **coupe de repli** si le routeur n'est
   pas prêt au 25/08. Le routeur demeure un **algorithme** (zéro appel IA dans le routage) ;
   la télémétrie s'implémente dès le départ.
4. **Diagnostic de la semaine 1** : deux exercices en classe, **manuscrits + photo** — un essai sur
   un sujet d'actualité simple (porte les **6 compétences actives en écriture** — les 5 propres plus
   le Questionnement ; **5 en HLP**, où le Questionnement n'est pas actif dans cette famille) et une
   explication de texte simple (porte les **5 compétences actives en lecture** — les 4 propres plus
   le Questionnement, **en TC comme en HLP**). Dépouillement immédiat (option A : tous les bancs tournés avant
   le 25/08). Le pipeline photo/OCR de Codex est donc **critique dès la semaine 1** (la coupe
   « diagnostique sans pipeline manuscrit » de C4 est annulée).
5. **Fragments** : l'essai bascule sur la chaîne du référentiel (**`contexte`** `essai_fragments` —
   et non « provenance », terme supprimé le 29/07 : correction mécanique C1,
   signal diagnostique supplémentaire) ; le hebdo reste hors profil ; vocabulaire de la rubrique
   aligné (C8) ; « Clarté de la présentation » remplace « Expression » à l'oral (C8).
6. **« Calame »** est le nom de l'IA qui guide tous les exercices côté élève (écriture ET lecture).
   Aletheia reste la voix des séances de lecture guidée des livres.
7. **Statut de recette par compétence** : chaque compétence est, à la recette (C13), déclarée
   `evaluee` (banc passé → verdicts élève) / `mesuree_silencieusement` (P1 stocké, pas de verdict)
   / `differee`. La spec construit le mécanisme ; l'état effectif se décide selon les bancs au 24/08.

   **Critère de recette chiffré (acté 29/07)** — une compétence ne passe à `evaluee` que si les
   trois conditions sont réunies :
   - **≥ 15 copies** passées au banc ;
   - **accord à ±1 niveau ≥ 80 %** contre les gold standards de Louis ;
   - **golds écrits avant lecture des sorties**.

   *Chiffres provisoires (réglage empirique).* **Règle des golds** : une révision **après le run 1
   ou 2** est une erreur grossière — **la copie sort du lot de calibration** de cette compétence
   (le lot de 15 devient 15−n) ; un changement d'avis **au run 3 ou 4** est un affinement de
   calibration — **la copie reste dans le calcul**. Toute révision est journalisée avec son motif.
   **Louis prononce seul** ; le statut vit dans `competences_niveaux.statut_recette` et laisse une
   trace au journal du `CONTEXTE.md`.

   **Défaut de sécurité** : une compétence **naît `mesuree_silencieusement`** et ne devient
   `evaluee` que par un acte explicite. L'oubli ne doit jamais envoyer un verdict faux à un élève.

   **Corpus** : 15 copies par compétence d'écriture, sélectionnées parmi les 25 copies réelles de
   Louis (deux lots, 10 puis 5). Côté **lecture**, le corpus est **synthétique** — copies de qualités
   variées produites par une IA tenue en aveugle des gabarits et des compétences. Réserve consignée
   telle quelle : *« ce ne sera pas propre »* — l'accord mesuré sur ce corpus dit que l'instrument
   est cohérent, pas qu'il lit les élèves. Une recalibration sur copies réelles en cours d'année est
   une **possibilité**, pas un jalon.

---

## 2. Les formats v1 (verrouillés)

**RÉVISION DU 29/07 (acté) — le mode de saisie change de partage.** La décision du 27/07 (« tout
au manuscrit ») est **remplacée**. La règle est désormais :

> **Ce qui se fait à la maison se saisit à l'écran. Ce qui se fait en classe se rédige à la main.**

**Raisons de Louis, consignées.** Le manuscrit à la maison faisait payer à l'élève 20 à 30 minutes
de recopie pour photographier une **vf** — sans aucun enjeu de validité, puisque **M1 ne mesure que
la v1**. Le résultat prévisible était l'abandon des vf, donc la mort du sixième temps. Par ailleurs,
plusieurs types se font de toute façon dans l'application (choix guidés, textes à trous, réponses
courtes). **Contrepartie assumée** : l'entraînement à l'écriture manuscrite ne survit qu'en classe
— *« la vie est faite de compromis »*.

| Format | Où | Entrée | Compétences |
|---|---|---|---|
| **Écriture formative maison** | Codex | **écran, v1 ET vf** — dans l'application | cible primaire + secondaires **espacées** (§3) |
| **Écriture diagnostique classe** | Codex | **manuscrit → photos → OCR → contrôle par l'élève** | l'essai diagnostique porte les 6 (5 en HLP, cf. §1.1) |
| **Lecture formative maison** | Aletheia | **écran** — y compris les grosses analyses (L7 long, L9, L12-paragraphe) | 2-4 des cinq selon les questions |
| **Lecture diagnostique classe** | Aletheia | **manuscrit → photos → OCR → contrôle par l'élève** | l'explication diagnostique porte les 5 |
| **Essai Fragments** | Fragments | **manuscrit → photos → OCR** | signal diagnostique (`contexte = essai_fragments`) |

**Anti-copier-coller (acté 29/07)** — c'est la contrepartie technique du passage au clavier :
- Les **champs de rédaction refusent le collage** : raccourci clavier, glisser-déposer, menu
  contextuel.
- **Chaque tentative de collage bloquée est journalisée** et devient un signal du faisceau du §7.
- **Réserve écrite noir sur blanc** : ce blocage est **côté navigateur seulement**. Il arrête le
  geste paresseux, qui est le geste majoritaire ; il n'arrête pas l'élève déterminé qui recopie à
  l'écran ce que son téléphone affiche — mais le manuscrit ne l'arrêtait pas davantage.
- **Effet de bord assumé** : l'élève qui rédige hors ligne ne peut plus coller son texte.
- **Le correcteur orthographique du navigateur reste actif** — il n'est pas désactivé. Jugement de
  terrain de Louis : peu d'élèves l'utilisent, et tant mieux pour ceux qui le font ; il restera
  toujours des fautes, la chasse aux fautes garde son objet.

**Ce que le clavier rend au faisceau anti-triche** : la durée mesurée, que le manuscrit avait tuée,
revient — et avec elle le rythme de frappe, l'apparition du texte par blocs, le nombre de sessions
et les tentatives de collage. Le faisceau est **plus riche** qu'avec le manuscrit, pas plus pauvre.

**Lisibilité — périmètre réduit au canal classe (révisé 29/07).** Le dispositif n'a plus d'objet à
la maison ; il est **retiré du formatif** et **conservé pour les passations en classe** :
1. la consigne d'une passation manuscrite **rappelle l'exigence de lisibilité** (une ligne, ton
   Calame) ;
2. **signal de confiance de transcription** — `confiance_ocr`, dont la définition est désormais
   fixée : **le désaccord entre deux passes de transcription**, calculé en code, sans IA de
   jugement *(provisoire ; coût à surveiller sur un an — l'OCR ne tourne plus que sur ~140 copies
   deux à trois fois l'an)* ;
3. **« exercice à refaire lisiblement » est supprimé** — inapplicable à une passation collective, la
   copie est écrite et l'heure est passée. Il devient un **message reporté** (« la prochaine fois,
   il faudra faire mieux »), **mémorisé au profil et affiché à la passation suivante** ;
4. **exemption par élève conservée** pour les passations en classe — l'aménagement se déclare une
   fois au profil et bascule automatiquement l'élève en saisie clavier. **Le profil stocke
   `mode_saisie_force = ecran`, jamais le diagnostic médical** (§11).

Le diagnostic de la semaine 1 = un diagnostique classe d'écriture (l'essai) + un diagnostique
classe de lecture (l'explication), passations prêtes le 25/08. Les DS s'ingèrent plus tard par les
mêmes canaux diagnostiques.

**Contrainte matérielle (F15).** L'interdiction québécoise des téléphones vise le **secondaire** ;
l'établissement est un **lycée français au Québec** et rien ne dit qu'il l'étend. Si elle s'applique :
repli sur le **chariot d'iPad**. Dans les deux cas **l'élève dépose lui-même, depuis son compte** —
ce qui règle l'appariement élève ↔ pages sans en-tête pré-imprimé, sans QR et sans journal de
réattribution.

---

## 3. L'expérience élève : les six temps d'un exercice

> **Avertissement de vocabulaire (A10, 30/07).** Depuis la révision du routeur, **« cycle » désigne
> la semaine de travail** — un cycle contient plusieurs exercices. Ce que la conception appelle
> encore le **« cycle à six temps »** est le déroulé d'**un seul exercice** : c'est ce sens-là qui
> vaut ci-dessous, et cette spec dit désormais « les six temps » ou « le déroulé en six temps »
> pour l'éviter. **Le terme n'est pas renommé dans `NOTE-CYCLE-PEDAGOGIQUE.md`** (document de
> conception, hors périmètre de cette passe) : la divergence de nom est signalée, pas résorbée —
> à trancher quand ce document sera relu.

Détail pédagogique : `NOTE-CYCLE-PEDAGOGIQUE.md` (fait foi). Ce que C4/C5 implémentent :

1. **PRÉPARER** — l'écran d'entrée montre la fiche stratégique du type (quoi faire, pourquoi, le
   contre-exemple) **dosée par le niveau** : complète si l'élève est D-E sur la cible, rappel d'une
   ligne en C, repliée (dépliable) en B-A. Avant l'allumage du routeur : complète pour tous.
   Compétence jamais travaillée → préparation affichée avant ; consolidation → proposée après la v1.
2. **ÉCRIRE** — la v1, **à l'écran**. Timestamp d'ouverture et de remise. À la remise, trois gestes
   courts, dans cet ordre :
   - **confiance déclarée** (sûr / pas sûr, sur la compétence cible seulement — **v1 seule**) ;
   - **conditions de travail (acté 29/07)** — un geste unique : « j'y ai mis le temps » / « fait au
     plus vite » / « pas pu m'y mettre ». **Jamais noté, jamais renvoyé à l'élève comme jugement.**
     Une mesure déclarée bâclée ne fait **jamais monter** une lettre ; **trois « pas pu » d'affilée
     lèvent un drapeau prof**, jamais un allègement. *Raison : un élève capable et désinvesti produit
     exactement les mêmes données qu'un élève qui bute — sans ce geste, le routeur répond à un
     problème d'effort par un allègement pédagogique, que l'élève lit comme une insulte.*
   - **restitution à chaud (acté 29/07)** — 30 secondes au clavier : « ta thèse en une phrase ? ».
     Une incohérence forte avec le squelette est un signal du faisceau du §7, et l'exercice a une
     valeur pédagogique propre. **Placement : après la vérification de la transcription quand il y
     en a une, et toujours avant tout envoi à l'IA.**
3. **SE JUGER** — 2-3 questions fermées ou semi-fermées dérivées de la grille de la compétence
   cible (définies par type dans sa fiche). L'élève répond **avant** de voir le retour. Comparaison
   **en code** avec le squelette **de la compétence cible** → verdict de calibration. Jamais noté.
   **Ne s'active que si la compétence est `evaluee`** (on ne calibre pas un élève sur un instrument
   non bancé). **Sans objet sur une passation en classe**, qui n'a pas ce temps.
   **Garde-fous de la calibration (acté 29/07 — F17)** : une valeur **`indetermine`**, appliquée par
   défaut quand l'élève affirme un observable **absent** du squelette (un faux négatif de P1 ne doit
   jamais produire un « surconfiant » injuste — répété, cela enseigne la soumission à la machine) ;
   les verdicts sont conservés **par observable**, avec la **version des questions** ; le message est
   formulé « nous n'avons pas vu la même chose », jamais comme un verdict ; et **toute contestation
   portant sur une citation absente part directement en file prof** (ce qui satisfait aussi
   l'exigence d'examen humain du §11).
   **+ Hygiène de la langue** : une micro-tâche « chasse aux fautes » — le relevé mécanique (calculé
   en code, patron du pré-relevé du banc Expression) signale qu'il reste N fautes probables ; l'élève
   en corrige ce qu'il trouve. Hors lettre, hors calibration : de l'hygiène, pas de la mesure.
   **Périmètre fixé le 29/07** : la chasse aux fautes et la section « langue » du retour s'appuient
   **sur un texte dont l'élève répond** — saisi à l'écran, ou transcrit **puis contrôlé par lui**.
4. **RETOUR** — généré depuis le squelette par le modèle « chaud » (§5 : l'assemblage en trois couches). Affiche
   aussi le verdict de calibration (« l'IA a vu la même chose que toi sur X ; elle a relevé Y que
   tu n'avais pas vu — es-tu d'accord ? »). **Bouton « je ne suis pas d'accord »** (+ champ court)
   sur chaque point ancré : la contestation est journalisée, n'altère rien automatiquement,
   remonte au prof en drapeau si répétée. **Section « langue » séparée** (26/07, [à valider]) :
   les fautes d'orthographe/grammaire relevées mécaniquement, ancrées ligne à ligne, dans un
   encart distinct du retour de compétence — leur correction est attendue dans la vf (mécanisme
   « correction imposée » acté le 18/07). *Nota : le contenu exact de l'écran de retour est
   volontairement sous-déterminé ici — il se spécifie au design de C4-L3/L5 (session dédiée).*
5. **RÉVISER** — la vf, guidée par LE geste de révision (un seul). Timestamp.
6. **RETOUR FINAL** (le sixième temps, ajouté par Louis le 26/07) — généré **en code + modèle
   chaud** depuis la comparaison des deux squelettes (v1 vs vf) croisée avec le retour donné :
   **ce qui s'est amélioré, cité, et pourquoi c'est mieux** (confirmation spécifique — attribuée
   au geste de l'élève, jamais à un talent) ; **ce qui n'a pas bougé, cité, et ce qui manque
   encore** ; le delta hors-retour (les autocorrections spontanées, à féliciter) ; et le pont
   (« la prochaine fois : X »). Clôture par la validation « lu ». Ce que la recherche appuie :
   le feedback de progrès est le plus puissant des renforçateurs quand il est spécifique et
   attribué à l'action ; l'artisan valide la pièce reprise, pas l'apprenti.
   *Le retour final compare les **squelettes** v1 et vf de la compétence cible.*

**Durées (révisé 29/07) — deux champs au lieu d'un.** L'ancienne `duree_attendue_min` servait trois
maîtres à la fois : l'affichage, le signal anti-triche et le décompte du budget. Elle est scindée :
- **`duree_exercice_min`** — le temps total de l'exercice, **la seule que le routeur et le quota
  décomptent**. Un exercice dont la rédaction fait 45 minutes en coûte 75 à 90 en tout (préparer,
  écrire, se juger, lire le retour, réviser, lire le retour final). Confondre les deux faisait
  recevoir à l'élève le double du budget prévu, et lire ses non-remises comme de la stagnation.
  *(Renommée le 30/07 — A9. L'ancien `duree_cycle_min` se lisait à contre-sens depuis que « cycle »
  désigne la **semaine de travail** : un cycle contient plusieurs exercices, il n'a pas de durée
  déclarée par type.)*
- **`duree_redaction_min`** — **optionnelle et nullable**, renseignée pour les seuls types à
  rédaction suivie ; référence du signal anti-triche quand elle existe. **Son utilité se réévalue à
  la conception des types** : beaucoup d'exercices (choix multiples, textes à trous…) ne comportent
  aucune rédaction et leur temps entier compte.

**Les types n'ont pas tous la même durée** — de quelques minutes à 45 (voir `02-exercices.md`). Le
routeur **construit la semaine sous contrainte de temps**, en fonction des objectifs, du niveau et
des difficultés de l'élève ; la règle de construction exacte se précise côté routeur, pas ici.

**Ce que voit l'élève (acté 29/07)** : **pas de budget-temps hebdomadaire**. En début de semaine, il
voit **la quantité d'exercices** que le routeur lui a prévue ; sur chaque exercice, une **durée
indicative**. *(Écrans différés, à concevoir : une **frise** en haut de la page d'exercice montrant
où il en est de son parcours, et une **page de parcours** au tableau de bord — progrès, objectifs,
réussites, défauts récurrents.)*

**Timestamps** : chaque transition est horodatée (colonnes du schéma §6). Outliers (vs durée
attendue) **tagués, jamais supprimés** — un temps très court est un drapeau du faisceau du §7,
jamais une preuve. Pour une **passation en classe**, la durée mesurée = ouverture de l'exercice →
dépôt des photos : granularité par phase réduite, assumée.

---

### 3bis. Le flux d'une passation en classe (acté 29/07 — vaut pour tous les diagnostiques)

Une passation en classe **n'est pas un cycle à six temps**. Elle ne comporte que la **rédaction**,
et son retour arrive en différé. Le flux, spécifié par Louis, fait foi :

1. Les élèves se connectent à leur compte Palimpseste.
2. Le prof **affiche le sujet au tableau**.
3. Ils rédigent **à la main, ~45 min** *(durée indicative)*.
4. **Le prof ouvre le dépôt** au bout d'environ 40 minutes — c'est une **action manuelle du prof**,
   pas une fenêtre calendaire.
5. L'élève **photographie** son travail depuis son appareil ou l'iPad.
6. **En quelques secondes**, sa **transcription s'affiche, éditable**.
7. Il **relit et corrige** — environ 10 minutes, **en classe, devant le professeur**.
8. Il **valide**. Tout est sauvegardé.
9. Le prof **ramasse les copies papier**, qui restent la preuve.
10. Le soir même ou un autre jour, le prof **déclenche l'analyse en lot** d'un clic.
11. Il **corrige les copies à l'écran, retours MASQUÉS par défaut**, et peut les révéler à
    différents grains s'il le souhaite. *(Dispositif anti-ancrage : il juge avant de voir la
    machine — même esprit que le protocole de ses bancs.)*
12. Il peut **modifier le retour**.
13. Après lecture, il saisit un **commentaire général**. **Aucune note n'est saisie dans
    Palimpseste** (§4ter) : la note reste sur la copie papier et se saisit dans l'outil de bulletin.
14. Il valide **en masse ou individuellement**.
15. Le retour devient visible aux élèves **quand il coche la case de publication**
    (`published_at`), avec **obligation pour l'élève de valider la lecture** (`lu_at`).
16. Il rend les copies papier en classe.

**Le contrôle de la transcription (temps 7) est une correction, pas un signalement.** L'élève édite
librement le texte ; **la mesure porte sur la version corrigée** ; aucune version double n'est
conservée, aucun drapeau d'écart n'est levé, et **Expression reste mesurée sur toutes les copies**.
Les garde-fous sont de terrain : la relecture se fait en classe devant le professeur, la
transcription n'est relisible qu'après que **le prof** ait ouvert le dépôt, et les copies papier
sont ramassées.

*Deux conséquences consignées.* **(a)** Mesurer Expression **après relecture** est probablement un
meilleur construit — c'est ce qu'un élève est censé rendre. **(b)** Les 15 copies de calibration sont
des transcriptions de **jets bruts**, non relus : l'instrument sera donc étalonné sur du brut et
déployé sur du relu. Décalage assumé, absorbé par l'arbitrage de fond de Louis — *le risque de
surnoter est moins grave que celui de sous-noter*.

**Exigence de latence** : la transcription d'environ 35 copies doit revenir **en quelques secondes
par copie**, pendant l'heure de cours. Portée par la table de jobs du §6, inscrite au lot C4-L4.

---

## 4. Sélection des exercices, quotas, et allumage

**TRANCHÉ (28/07, relecture au fil de Louis) : variante B** — **le routeur en charge dès la
semaine 2**, sur les profils du diagnostic de la semaine 1. Le prof ne planifie plus exercice
par exercice : il fixe par classe un **budget de temps hebdomadaire** d'exercices (ex. 45 min)
et un **budget optionnel** (« en faire plus »), le routeur remplit (cible R1-R6 → type →
instanciation depuis la matière Scriptorium, non-spoiler pour la lecture). Le prof garde :
l'**override** (principe « le routeur propose, le professeur dispose ») et les **exercices
communs** qu'il impose (diagnostiques, séquences de classe).

**RÉVISION DU 29/07 — la file de validation hebdomadaire est supprimée.** Les trois revues avaient
chiffré une charge de validation intenable (27 min à 3 h par semaine). Leur prémisse était fausse :
**une référence décomposée appartient à un texte, pas à un élève**, et se fabrique **une seule fois**
à la constitution du corpus. Le prof ne valide **rien au fil de l'eau**. En conséquence :
- **Le routeur n'instancie de la lecture que depuis le corpus de textes validé.** Règle simple, qui
  remplace tout plafond de nouveautés et toute priorisation.
- **Unicité et empreinte immuable sur `exercices_references`** : un texte ne se décompose jamais
  deux fois, et une référence validée ne peut plus être modifiée en silence.
- **La validation à l'import de l'injecteur est conservée** (C5-L1, actée le 27/07) — c'est
  précisément le geste « une fois par texte ». La règle absolue est intacte : **une référence non
  validée n'entre jamais en Phase 2**.
- **Remplacement côté prof** : un **écran en lecture seule** — « voici ce que le routeur a assigné
  cette semaine » — **sans aucun geste de validation**, pour voir et, si besoin, utiliser
  l'override.
- **Jalon d'août** : **20 textes** décomposés et validés avant la semaine 2, puis ajout au fil de
  l'eau.

**Le partage écriture / lecture n'est plus une rotation calendaire (A12, tranché le 30/07).**
L'ancienne **cadence 2-1** — deux semaines d'écriture, une de lecture — est **supprimée**. Le partage
est désormais **probabiliste et par élève** : fonction de l'élève, de son travail et de son progrès.
Conséquence de comptage : **le nombre de cycles de l'année est une dérivée du Calendrier**
(semaines de cours − 2), et non plus un chiffre posé.

**Deux mécanismes du remplissage (actés 27/07, précisés le 29/07)** : la **préférence de l'élève** —
recueillie à intervalle régulier (souhaites-tu davantage d'écriture ou de lecture ?), pesée par le
routeur, jamais souveraine ; et l'**ajustement dynamique**, dont le vocabulaire est corrigé ici :

> **La stagnation change la CIBLE, jamais le VOLUME.** Là où l'élève stagne, le routeur déplace la
> cible (compétence, grain, type de préparation) — il ne réduit pas la charge. Là où il progresse,
> il augmente la difficulté.

*Raison de la correction : « on allège » se lisait comme une réduction de charge, alors que
l'escalade N3 du routeur fait déjà l'inverse — « la cible passe en secondaire, le primaire va à la
compétence suivante ». Deux revues avaient relevé qu'un allègement récompense la stagnation et
verrouille les élèves faibles : moins d'exercices sur une compétence, c'est une fenêtre de montée
qui s'étire jusqu'à devenir inatteignable. Trois garde-fous en découlent :*
- **Plancher de mesure** : au moins **une mesure toutes les 3 semaines** sur toute compétence
  ciblée.
- **Fenêtre de montée temporelle** : « 2 mesures améliorées sur les 3 dernières **ou** dans la
  fenêtre temporelle », avec la règle de cohérence **fenêtre = 2 × la période du plancher** — soit
  **6 semaines** ici. *(Les deux paramètres sont liés par construction : une fenêtre plus courte que
  deux périodes de plancher ne peut pas contenir deux mesures.)*
- **Niveaux initiaux en `profil_provisoire`**, à faible certitude : ni pause ni escalade déclenchées
  sur la foi d'une seule ancre.

**Le routeur ne cible que les compétences `evaluee` (acté 29/07).** Sans cette règle, un élève peut
faire un exercice entier sur une compétence non bancée et arriver au retour… qui n'existe pas,
faute de verdict. **Sortie retenue si peu de compétences sont `evaluee` en septembre : la voie mixte** —
le routeur remplit le budget avec les seules compétences `evaluee`, et le reste du temps va aux
**exercices communs** imposés par le prof.

**Trois gates au lieu d'un (acté 29/07)** — un seul interrupteur rendait le diagnostic impossible
sans tout allumer :
- **`exercices_actif`** — les élèves peuvent-ils faire des exercices ?
- **`routeur_actif`** — le routeur choisit-il, ou le prof planifie-t-il ?
- **`competences_affichage_actif`** — les lettres sont-elles visibles ?

S'y ajoute une **matrice normative par statut de recette** : pour chaque état (`evaluee`,
`mesuree_silencieusement`, `differee`), ce qui tourne et ce qui est masqué.

**Ancres : cadence et audit (acté 29/07).** *(A19, 30/07 : seul le format de la semaine 1 est arrêté — essai + explication de texte. Ceux de décembre et de février/mars sont **[à valider]**, voir B3-22 ; leur existence au calendrier, elle, n'est pas en cause.)* Les diagnostiques de septembre, décembre et mars sont au
projet, et les évaluations régulières en classe figurent au **plan d'évaluation**. La cadence cible
est d'**une ancre par compétence `evaluee` toutes les 6 semaines** ; si le plan d'évaluation manque
cet objectif, **un signal non bloquant part vers le prof** — la correction se fait à la
planification, pas après coup. **La lettre ne gèle pas** : elle continue de monter jusqu'au plafond
ancre+2. *(L'exigence de « fraîcheur d'ancre » pour le second cran est abandonnée avec le gel.)*

**Ancre aveugle (acté 29/07).** L'instrument qui mesure est celui qui enseigne : un élève peut
apprendre à produire les signes que la grille guette sans que sa pensée bouge, et rien dans le
système ne saurait faire la différence. Les diagnostiques **ne peuvent pas** jouer cet arbitre —
ils passent par la même chaîne et construisent les lettres. Le **bac blanc, corrigé à la main hors
de Palimpseste**, le peut : il est **marqué comme ancre aveugle** au calendrier d'évaluation, et
**une fois par semestre ses résultats sont mis en regard des lettres**. *C'est la mise en regard qui
est le dispositif.* Réserves de Louis consignées : il est lui-même sensible au halo, donc ses
propres verdicts au bac blanc ont une valeur limitée ; le travail de calibration vise justement à
ce qu'une hausse soit un progrès ; et l'effet « une mesure qui devient un objectif cesse d'être une
bonne mesure » est jugé inévitable mais atténué — **le retour ne révèle jamais la grille complète
des observables**, règle qui devient contraignante (§5).

**Coupe de repli (l'ex-variante A)** si le cœur R1-R6 n'est pas prêt au 25/08 : v1 par le plan
du prof — boucle `a_concevoir` → **Concevoir** (choix du type et de la matière, instanciation
générée, validation — la référence décomposée surtout) → `concu` → calendrier élève ; le routeur
prend les couches 2-3 à l'allumage. Le schéma et C4-L2 supportent les deux (§9). Impact chantier
assumé : le cœur algorithmique R1-R6 passe de « post-rentrée » à « avant le 25/08 » — de
l'algorithmique pure, faisable, mais du périmètre en plus en S2-S3.

**Note d'étalonnage (Louis, 28/07 — complétée le 29/07)** : en fin d'année, croiser les **progrès
réels** avec l'**assiduité** pour étalonner ce qu'un objectif *réaliste* veut dire — un D de
septembre peut-il atteindre B ? un C atteindre A ? — et régler les attentes du routeur sur des
trajectoires observées. **Trois garde-fous méthodologiques, sans lesquels la mesure produirait une
régression vers la moyenne et rien d'autre** : comparer des mesures **de même nature** — le
diagnostique de septembre contre une **passation du même format début mai** (A13 : l'année scolaire
des premières et terminales se termine le **20 mai**, et **plus aucun exercice n'est assigné après le
10 mai** — la passation de comparaison ne peut donc pas être en juin), jamais contre une lettre
agrégée ; utiliser le **groupe à faible assiduité comme contrefactuel** ; **journaliser le volume
assigné et le volume terminé** par élève.

**Budgets (révisé 29/07) — le budget est une propriété de l'ÉLÈVE, pas de la classe.** Un élève
inscrit en TC et en HLP recevait auparavant deux budgets que personne n'additionnait. Comme le
**profil est unifié** (décision du 17/07, amendée le 29/07 par A1 : les deux parcours ont les **dix** compétences, seule varie la famille dans laquelle chacune est active ; échelle commune) et que les compétences
sont les mêmes, l'élève bi-classe n'a **aucune raison de faire le travail en double**. Le budget est
décidé **en début d'année**, en **temps d'exercice cumulé sur la semaine** (A10), avec un plancher et un plafond :

| Situation | Plancher | Plafond | Optionnel |
|---|---|---|---|
| HLP seul | 1 h | 1 h 30 | + 30 min |
| TC seul | 45 min | 1 h | + 30 min |
| Bi-classe (TC + HLP) | 1 h 30 | 2 h | + 30 min |

*Chiffres provisoires (réglage empirique).* Le routeur remplit **au moins jusqu'au plancher, jamais
au-delà du plafond**, en composant avec des types de durées inégales. La **table des proportions**
micro/méso/macro par segment × niveau reste un paramètre de configuration (session dédiée) — jamais
en dur.

**§4bis — Lettres : montée, descente, et la révision « certitude » (26/07, chantier ouvert,
NON bloquant pour le gel).** Règles v1 : celles du routeur §7 (montée par le maison 2 mesures sur
3, descente par les ancres seules, plafond ancre+2, rien d'affiché avant l'allumage). **Révision à
l'étude** (session dédiée) : un **modèle de certitude cumulée** — chaque mesure apporte un poids de
confiance selon son contexte (diagnostic > synthèse en classe > essai > maison) et sa fraîcheur
(pondération par la récence, déjà actée pour l'agrégation côté Fragments) ; la lettre monte au
franchissement d'un seuil de certitude, au lieu de la règle discrète 2/3. Continuité : la fenêtre
2/3, le plafond ancre+2 et les deux étages de M2 sont des cas particuliers discrets de ce modèle.
**Le schéma est déjà prêt** : `competences_mesures` porte contexte + date + observables — le score
se calcule en code, quel que soit le modèle retenu. **Précision du 29/07 (C21)** : la matrice C6
affiche **`n` dès maintenant** (c'est un décompte réel) et **la « confiance » seulement le jour où le
modèle de certitude existe** — sinon elle afficherait un chiffre qui ne mesure rien, et sur lequel
on prendrait pourtant des décisions. C'est la règle « pas de fausse précision » appliquée à
elle-même.

**« En faire plus »** (C6-L3) : deux canaux — **pull** : l'élève demande un exercice bonus ;
quota = **~30 min/semaine** (provisoire) décompté sur les durées d'exercice ; le type est choisi par
le routeur (il sert la cible). **Les minutes non utilisées sont perdues** — ni report, ni écrêtage
(acté 29/07). **Push** : règle de fraîcheur — compétence sans mesure depuis N semaines chez un élève
≤ C → suggestion visible sur son tableau de bord. Bonus = exercice normal (mesures comprises), marqué
`bonus` en télémétrie.

---

### §4ter — Assiduité, motivation et affichage des niveaux (acté 29/07)

**Le dispositif réel de Louis**, qui répond à l'objection « rien ne sanctionne la stagnation » :
- **Punition collective** : si **un tiers de la classe** ne fait rien **deux semaines de suite**,
  tout le monde rend le travail imprimé et c'est noté.
- **Récompense individuelle** : **+1 par semaine de travail fait**, sur le **semestre**.

**Ce que la plateforme doit produire** (deux agrégats qui n'existaient nulle part) :
- le **taux d'inactivité hebdomadaire par classe** — le déclencheur du tiers ;
- le **pourcentage d'assiduité par élève** :

> **% assiduité = semaines faites ÷ (semaines du semestre − semaines de vacances)**
> Une **semaine est « faite »** quand l'élève a rendu au moins la proportion configurée
> (**2/3 ou 3/4**, **paramètre de configuration**, jamais en dur) de ses exercices assignés.
> Les **semaines de vacances sortent du dénominateur** — sans jamais empêcher qui veut de
> travailler ; le travail fait pendant les vacances peut ajouter **au plus une semaine** au
> numérateur, sur tout le semestre.
> *Dépendance : le compteur lit le calendrier scolaire (module Calendrier).*

**Les compteurs entrent dans C4 ; les écrans peuvent attendre.** Raison : un semestre ne se recompte
pas après coup — si la collecte ne démarre pas à la rentrée, le premier semestre est perdu.

**Aucune note dans Palimpseste.** La plateforme affiche un **pourcentage**, rien de plus ; Louis fait
lui-même la conversion en note, hors application, et saisit ses notes dans l'outil de bulletin comme
aujourd'hui.

**Affichage des niveaux à l'élève (F25 — décision actée du 26/07, révisée le 29/07).** Deux revues
objectaient qu'une lettre A-E affichée à l'élève **est** une note : forme du bulletin, stigmate du E
permanent, intérêt tangible à faire monter la lettre plutôt qu'à travailler. Position de Louis : ses
élèves ont un **bulletin français**, avec des notes et des moyennes **sur 20** — *les lettres ne sont
pas des notes*, et le contexte ne prête pas à confusion. La solution retenue :
- **Côté prof** : les lettres, toujours.
- **Côté élève, par défaut** : **trajectoire et cible** — « travaillé 4 fois · en progrès ·
  prochaine étape : … ». Pas de lettre.
- **Option de l'élève** : celui qui veut voir davantage que des mots vagues peut **afficher lui-même
  les courbes de progression et le reste**. **C'est l'élève qui choisit**, pas le système.

---

## 5. Les retours : architecture en trois couches (🎻 — la qualité pédagogique se joue ici)

Deux étages, deux modèles : le **jugement froid** (chaîne P1/P2 par compétence — prompts dans
`competences/*.md` et `competences-lecture/prompts-inventaire.md`, ils font foi, les bancs les
valident) ; la **reformulation chaude** pour l'élève, générée depuis le squelette et le verdict.

**Recadrage du 27/07 (objection de Louis, retenue)** : pas de « prompt maître » unique — les
exercices ont des consignes et des attendus différents, et leurs retours ne peuvent pas s'écrire
avant que les types soient complètement spécifiés. Le retour chaud s'**assemble en trois
couches** à l'exécution :

1. **La couche contrat (invariante — la seule que C3 fige)** : les règles vraies de tout retour
   formatif — citer les mots de l'élève, une réussite d'abord, puis l'**ossature révisée le
   28/07 (relecture Louis)** : *nommer le geste tenté → verdict franc et gradué → voilà
   l'erreur → voilà comment faire mieux* — UN point de travail, UN geste, jamais de note, la
   tâche jamais la personne, le ton Calame. C'est le gabarit ci-dessous.
2. **La couche compétence** : le vocabulaire de la grille, le levier, les seuils — elle vient du
   fichier de la compétence (`competences/*.md`), déjà spécifié et bancé.
3. **La couche type** : les attendus propres à l'exercice (sa consigne, ce que ce type mesure et
   comment en parler) — elle vit dans la **fiche du type** (`exercices_types.fiche`) et
   **s'écrit au fil de la spécification des types** (annexe A + aile L, en août, appuyée sur les
   bancs) — pas dans C3. **Ordre acté : spécifier l'exercice d'abord, écrire son retour ensuite.**
   **Garde-fou d'activation (acté 29/07)** : un type ne peut passer `actif = true` que si sa
   `fiche.attendus_retour` est **non vide** ; sinon il reste dans l'état explicite
   **`retour_degrade`** pendant la transition.

**Quatre règles ajoutées au contrat le 29/07 :**

- **`{{GESTE_TENTE}}` est un geste *observable dans le texte*.** La voix « ici, tu as visiblement
  essayé de… » reste — c'est l'ossature de Louis — mais le modèle **n'infère jamais une cause** dans
  la tête de l'élève : il nomme ce que le texte montre, pas ce que l'élève voulait.
- **En vf, le « pourquoi » causal devient un constat** : « ce qui manque encore, d'après les deux
  versions », et non « pourquoi ça n'a pas marché ».
- **En lecture, les citations sont namespacées** — `copie_eleve` contre `texte_support`. Sans cela,
  le retour finira par attribuer à l'élève une phrase de l'auteur qu'il citait ; à l'échelle d'une
  année, l'erreur est garantie.
- **Le retour ne révèle jamais la grille complète des observables.** Il nomme un point de travail et
  un geste ; il n'expose pas la liste de ce qui est mesuré. *(Ce qui protège partiellement de
  l'effet « une mesure qui devient un objectif cesse d'être une bonne mesure » — cf. l'ancre aveugle
  du §4.)*

**Contrat de latence (acté 29/07)** : **le retour arrive en moins de 3 minutes** — au-delà, il perd
son sens — sinon l'élève voit un **état d'attente explicite**, jamais un écran muet. **Conséquence
d'implémentation : les appels P1 des différentes compétences se lancent en parallèle**, sinon le
contrat est intenable dès deux compétences mesurées.

**Défense contre l'injection de prompt (acté 29/07).** La règle 7 du prompt de transcription ne
protège plus : le formatif est au clavier et l'élève édite sa transcription — l'injection peut être
tapée en aval du rempart. La défense vit donc au niveau de P1 et P2 :
1. **entrées délimitées** — la copie arrive dans un bloc explicitement balisé, jamais concaténée aux
   consignes ; la consigne déclare que ce bloc est **du matériau, jamais une instruction** ;
2. **validation stricte du schéma de sortie** — une sortie non conforme est rejetée et relancée, pas
   interprétée ;
3. **aucun outil attaché** à ces appels ;
4. **copies d'injection ajoutées aux jeux synthétiques du banc.**

*Le risque n'est pas seulement la note : une injection réussie peut corrompre le **retour** affiché
ou **fausser silencieusement une mesure**, donc la télémétrie et l'analyse de fin d'année.*

Gabarit de la **couche contrat** (ossature révisée le 28/07 — texte exact **[à valider]** ; les
{{variables}} viennent du squelette et des couches 2-3) :

```
SYSTÈME — CALAME · RETOUR FORMATIF ({{COMPETENCE}}, {{MOMENT: v1|vf}})

Tu es Calame, le guide d'exercices de Palimpseste. Tu écris à un élève de
lycée, en français, avec chaleur et précision — jamais de condescendance,
jamais de généralités. Tu parles de SON texte, pas de lui.

Tu reçois : le squelette extrait de sa copie (citations exactes comprises),
le verdict par observable, et [si vf] le retour donné en v1.

Règles absolues :
1. CITE ses mots. Chaque point s'ancre sur une citation du squelette
   (« tu écris : "..." — ... »). Aucun reproche sans citation, aucun
   compliment sans citation.
2. Commence par UNE réussite réelle, citée, en une phrase.
3. NOMME LE GESTE TENTÉ. Le cœur du retour part de ce que l'élève a
   essayé de faire ({{GESTE_TENTE}}, lu dans le squelette) : « ici, tu
   as visiblement essayé de... ». L'intention est reconnue avant d'être
   jugée — une tentative ratée reste une tentative vue. (Aucune
   tentative visible ? Dis-le : c'est ce constat qui ouvre le point
   de travail.)
4. JUGE L'EXÉCUTION AVEC FRANCHISE, en trois registres : « c'est
   raté » — dis-le simplement, sans détour ; « c'est pas mal, tu peux
   mieux faire » ; « c'est très bien ». Jamais de langue de bois :
   l'élève doit toujours savoir où il en est. Si c'est raté ou
   perfectible : VOILÀ L'ERREUR (citée, précise), puis VOILÀ COMMENT
   FAIRE MIEUX ({{LEVIER}} fourni par le verdict) — UN seul point de
   travail, même si le squelette en montre plusieurs.
5. Termine par UN geste de révision concret et faisable en 10 minutes
   [en v1] / par la prochaine étape (« la prochaine fois : ... »,
   fournie par {{FEED_FORWARD}}) [en vf].
6. Jamais de note, de lettre ou de moyenne dans le texte du retour.
7. Longueur : 80-140 mots. Vocabulaire de la grille (garant, articulation,
   attache…) — le même que dans les exercices.
8. Registre : {{REGISTRE: descriptif | interrogatif | demonstratif}} —
   descriptif par défaut ; en démonstratif, montre la phrase de l'élève
   réparée à côté de l'originale.
```

L'implémentation garde cette couche contrat **en paramètres éditables par sections** (convention
produit du 26/07 : sections `ton` / `longueur` éditables ; règles 1-6 verrouillées — elles portent
le contrat du feedback). Un fichier de personnalité **Calame** unique, partagé écriture/lecture ;
les couches compétence et type s'y injectent à l'exécution.

---

## 6. Le schéma (C4-L1 — migrations additives, gatées, SUIVI_SQL ligne par ligne)

Conventions repo : snake_case français, RLS élève = SELECT own strict / écritures serveur (leçons
C1), photos dans le bucket existant. Détail indicatif — la session Code ajuste les types exacts :

- **`exercices_types`** — la bibliothèque (`02-exercices.md`). `code` (ex. `t2`, `l7`), `famille`
  (`ecriture`|`lecture`), `grain` (**énuméré : `micro`|`meso`|`macro`**), `geste`, **`regime_v1vf`**
  (`plein`|`optionnel`|`paires` — **`paires` = pas de vf : correction puis nouveau cas de la même
  famille de défauts**, cf. `02-exercices.md` §1), **`duree_exercice_min`** (obligatoire, la seule
  décomptée), **`duree_redaction_min`** (nullable, types à rédaction suivie seulement),
  `competence_primaire`, **`competences_secondaires[]` = les secondaires ÉLIGIBLES** (voir la règle
  d'espacement ci-dessous), `fiche` JSONB (quand/pourquoi élève, procédure, exemples/contre-exemple,
  questions de guidage, questions d'auto-évaluation, contextes de transfert, **attendus du retour —
  non vide pour passer `actif`**), `mode_saisie` (`manuscrit`|`ecran`|`mixte`), `consigne_gabarit`,
  **`genre` NULLABLE (A14, 30/07)** — `dissertation` | `explication_texte` (genres du tronc commun)
  | `question_interpretation` | `essai` (genres de HLP) ; **les types génériques n'en ont pas**, d'où
  la nullabilité. C'est ce champ qui porte désormais le drapeau « transfert » (voir
  `competences_mesures`) — et `actif`.
  Seed : types écriture 1-14 ; **types diagnostiques à part entière** (a priori essai, dissertation,
  explication de texte — spécifiés au fil de l'eau) ; types L au fil de la co-conception. **Une
  ligne = un type, aucun changement de schéma.**
  **Règle de la mesure secondaire (actée 29/07, RÉÉCRITE le 30/07 — A11)** — elle remplace « chaque
  exercice évalue 2-3 compétences ». La formulation du 29/07 disait « jamais celle qu'on travaille
  dans le cycle de la semaine » : elle reposait sur une **prémisse fausse** — qu'une seule compétence
  soit travaillée par semaine, alors qu'on en travaille plusieurs. Trois étages, à ne pas confondre
  (source : `01-routeur.md` §1.4) :
  1. **Contrainte dure** : la secondaire d'un exercice n'est **jamais la cible de cet exercice**.
     C'est la seule interdiction absolue.
  2. **Préférence, non interdiction** : on sonde **de préférence** ce qu'on n'entraîne pas dans le
     cycle. Une compétence travaillée ailleurs dans la semaine peut donc être sondée si un motif le
     justifie.
  3. **Motifs légitimes de sondage** : une compétence qui **semble stagner** (vérifier) ; une
     compétence dont le **niveau cible est atteint** (vérifier que ça tient).

  **Tous les exercices ne portent pas de secondaire**, et une compétence n'est sondée qu'**une fois
  par cycle**, au moment optimal — logique de **répétition espacée**.
  *La règle d'espacement elle-même appartient au routeur et y est **écrite depuis le 30/07** —
  `01-routeur.md` §6 : pool des candidates, priorités, une sonde par compétence et par cycle au
  moment optimal, plafond de sondes. `delai_jours` et `delai_mesures` en sont l'entrée.*
- **`exercices_references`** — les références décomposées : `source` (contenu/livre + localisation),
  `contenu` JSONB (problème, thèse, garants, moments, concepts), `validee_par` / `validee_at`
  (**une référence non validée n'est jamais utilisée en P2**). **Contrainte d'unicité + empreinte
  immuable** : un texte ne se décompose jamais deux fois, une référence validée ne se modifie plus
  en silence.
- **`exercices`** — les instances conçues : `type_id`, `planifie_id` FK →
  `scriptorium_exercices_planifies`, `classe_id`, **`mode` (`formatif_maison`|`diagnostique_classe`
  — un CONTEXTE, rien d'autre ; la valeur `lecture` disparaît)**, `consigne_instanciee`,
  `reference_id?`, `fenetre_debut/fin`, **`borne_amont`** (journalisée à la décision — non-spoiler,
  voir plus bas), `statut` (`a_concevoir`→`concu`→`assigne`→`clos`), `bonus` bool.
  **La famille (écriture / lecture) se lit sur le TYPE**, avec règle de dérivation écrite. *Sans
  cette correction, un diagnostique de lecture n'aurait pas été une ancre — donc ni descente ni
  plafond ancre+2 côté lecture, toute l'année.*
- **`exercices_depots`** — élève × exercice. **Créée dès l'ASSIGNATION, pas au dépôt** : c'est elle
  qui porte le déroulé individuel, sans quoi l'objet « l'exercice de Léa, fenêtre du 8-12 » n'existe
  nulle part.
  - `eleve_id`, `exercice_id`, `assigne_at`, `du_at`, **`origine`** (`routeur`|`prof`),
    **`routeur_decision_id`** ;
  - **`statut` énuméré** : `assigne` → `ouvert` → `v1_remis` → `retour_publie` → `vf_remis` →
    `clos`, plus **`abandonne`**, **exclu des règles de stagnation** (un exercice jamais ouvert
    n'est pas une preuve de sur-place). *Pour une passation en classe, la séquence s'arrête à
    `retour_publie` — il n'y a pas de vf.*
  - par version (v1 et vf) : `texte` (saisie écran) **OU** `photos[]` + `transcription` +
    `confiance_ocr`. **`photos[]` porte l'ordre, la rotation, une somme de contrôle et sait dire
    qu'une page manque** ; dépôt **par URL signée** (convention d'écritures serveur) ; **métadonnées
    EXIF purgées** (§11).
  - `confiance_declaree` (**v1 seule**), **`conditions_declarees`**
    (`temps_mis`|`au_plus_vite`|`pas_pu`), **`restitution_a_chaud`** (texte court),
    `refaire_lisibilite` (canal classe uniquement, sans dimension de version) ;
  - timestamps : `ouvert_at`, `depot_ouvert_par_prof_at` (**passation en classe : ouverture
    manuelle**), `v1_remis_at`, `transcription_validee_at`, `juger_debut_at`, `juger_fin_at`,
    `retour_ouvert_at`, `vf_remis_at` ; `duree_taguee` (`normale`|`interrompue`|`suspecte`) ;
  - **passations en classe** : `commentaire_general`, `corrige_par`, `corrige_at`. **Aucun champ
    `note`** — la note reste sur la copie papier (§4ter).
  - **`lu_at` vit sur le retour, pas ici** (dédoublonnage — C6).
  - **Exemption lisibilité** : champ d'aménagement **au profil de l'élève**, valeur
    **`mode_saisie_force = ecran`** — **jamais un diagnostic médical** (§11) ; bascule automatique
    de tous les types `manuscrit` de cet élève.
- **`exercices_jobs`** — **nouvelle table** : l'infrastructure de traitement. `depot_id`, `etape`,
  `statut`, `tentatives`, **`cle_idempotence`**, plafond de tentatives, état **`echec_definitif`
  visible**. *Le mode de panne visé : un retry après expiration écrit une deuxième mesure pour la
  même copie, et la règle « 2 sur 3 » monte une lettre sans que l'élève ait rien fait.* Porte aussi
  le **traitement en lot** des passations (§3bis, étape 10) et l'**exigence de latence** du §5.
- **`exercices_squelettes`** — par dépôt × version (`v1`|`vf`) × **compétence mesurée** : `p1` JSONB,
  `p2` JSONB, `modele`, **`prompt_version`**, **`instrument_version`**, `cout_api` (branché sur
  `api_couts`, C11a). **`lettre_equivalente` retirée d'ici** (fausse précision) — elle reste sur
  `competences_mesures`.
  **Index unique `(depot_id, competence, version)`** — le garde-fou d'idempotence.
- **`exercices_metacognition`** — par dépôt : `questions` JSONB **+ leur version**, `reponses_eleve`
  JSONB, `comparaison` JSONB **par observable**, `calibration`
  (`bien_calibre`|`surconfiant`|`sous_confiant`|**`indetermine`**), `contestation` (`points[]` avec
  **identifiants stables**, texte) — jamais notée.
  **Les quatre champs de la télémétrie du Monitoring (A8 — à collecter dès le premier exercice de
  septembre)** : la **confiance déclarée** à la remise de la v1 · le **jugement de l'élève item par
  item** au temps 3 · la **réponse du squelette sur ces mêmes items** · le **niveau réellement
  obtenu**. Sans eux, le test grandeur nature de 2026-27 sera vide — et il n'existe aucun banc pour
  y suppléer avant la rentrée. **Cette table est la source du Monitoring** ; elle alimente
  `monitoring_mesures` ci-dessous, **jamais `competences_mesures`**.
  *(La comparaison élève ↔ squelette se fait **par le code, pas par l'IA**.)*
- **`exercices_retours`** — par dépôt × moment (`v1`|`vf`) : `texte`, **`texte_edite_par_prof`**,
  `geste_revision`, `feed_forward`, `registre`, **`published_at`** (la case à cocher du §3bis),
  `lu_at` (**validation de lecture obligatoire**), **identifiants stables des points** pour que la
  contestation puisse désigner ce qu'elle conteste.
- **`competences_mesures`** — LA table de télémétrie : `eleve_id`, `competence` (**un identifiant
  par compétence, dix en tout ; la famille est une colonne à part depuis A1 — le préfixe
  `ecriture.` / `lecture.` ne porte plus l'identité de la compétence**),
  `lettre_equivalente`, `observables` JSONB, `contexte`
  (`maison`|`classe`|`diagnostic`|**`essai_fragments`**), **`famille`** (`ecriture`|`lecture` —
  **ajoutée par A1** : depuis la fusion du Questionnement, la famille n'est plus déductible de
  l'identifiant de compétence), **`classe_id` NULLABLE** (remplace `provenance`).
  **A3 — 29/07 : `classe_id` est NULL pour la quasi-totalité du travail à la maison**, et c'est
  normal, pas un défaut de collecte. Un élève bi-classe reçoit à la maison un flux unique, servi
  par un routeur unique sur un profil unique : rien ne rattache l'exercice à l'un de ses deux
  cours. Le parcours n'est donc établi que pour les **passations en classe** et pour la **lecture
  du livre** ; partout ailleurs le parcours dérivé vaut **`indetermine`**. Deux choses que le mot
  « provenance » confondait sont désormais séparées : le **contexte de mesure**, toujours connu, et
  le **parcours**, connu par exception.

  **A14 — 30/07 : R6 est réécrite, et le drapeau « transfert » ne passe plus par le parcours.**
  A5 est tranché. La fonction « cibles primaires TC et HLP disjointes la même semaine » est
  **dissoute** : l'élève bi-classe reçoit un flux unique, servi par un routeur unique, sur un profil
  unique et un budget unique — il n'y a plus deux files à désynchroniser. Et le drapeau
  « transfert » compare désormais les mesures d'une même compétence **par genre d'exercice**, non
  par parcours — ce qui le rend calculable, puisque le genre est toujours connu là où le parcours ne
  l'est pas. Détail : `01-routeur.md` §5.

  **Ordre d'attribution du parcours d'une mesure** (à implémenter tel quel) :
  **1.** la **classe**, quand elle est connue — passation en classe, lecture du livre ;
  **2.** à défaut, le **genre du type** (les genres sont propres à un parcours : `dissertation` et
  `explication_texte` au tronc commun, `question_interpretation` et `essai` en HLP) ;
  **3.** à défaut, **`indetermine`** — qui reste le cas majoritaire, et n'est pas un défaut de
  collecte.

  `aide_consommee`,
  **`delai_jours`**, **`delai_mesures`**, `distance_contexte`, `delta_v1_vf` (**NULL ≠ 0**),
  `depot_id?`, `bonus` bool, **`instrument_version`**, `created_at`.
  **M1 : alimentée par les squelettes `v1` uniquement.** Doit permettre la requête « échecs répétés
  par élève × observable ».
  **A8 — le Monitoring n'entre pas dans cette table.** Il a ses tables propres (ci-dessous) : son
  état n'est pas une lettre, et le mélanger ici obligerait toute requête sur les niveaux à savoir
  laquelle des deux formes elle lit.
- **`competences_niveaux`** — l'état affiché : `eleve_id`, `competence`, `lettre`,
  `derniere_ancre_at/valeur`, `statut_recette` (`evaluee`|`mesuree_silencieusement`|`differee`),
  **`profil_provisoire`** bool, `updated_at`. **PAS de `classe_id` dans la clé** : le profil est
  **unifié par élève × compétence** — décision actée du 17/07 et **confirmée le 29/07 par A1** (les deux parcours ont les **dix** compétences ; ce qui varie est la **famille** dans laquelle chacune est active — donc une lettre unique par élève × compétence, alimentée par les deux familles), échelle commune, et
  règle R6 du routeur. Aucune lettre affichée avant l'allumage. **Le Monitoring n'y figure pas
  (A8).**

- **`monitoring_mesures`** — **nouvelle table (A8, 29/07)**. Le Monitoring est une compétence de
  **second ordre** : il ne se note pas, il n'est **jamais cible du routeur**, ses deux
  sous-dimensions **ne se moyennent pas** (échelles différentes), et son état n'est pas une lettre.
  Lui donner des tables propres rend cette différence visible dans le schéma au lieu de la cacher
  derrière des colonnes vides.
  `eleve_id` · **`sous_dimension`** (`lucidite_incompris` | `calibration_confiance` — *[à valider]*,
  cf. §1.1) · **`amplitude_ecart`** (0 calibré → 3 massif ; *nombre de crans provisoire*) ·
  **`direction`** (`surconfiance` | `sous_confiance` | **NULL quand l'amplitude vaut 0**) ·
  `observables` JSONB (`aveu_incomprehension`, `marquage_hypothese` pour la lucidité ;
  `confiance_declaree`, `calibration` pour la calibration) · `contexte` · `famille` ·
  **`classe_id` NULLABLE** (même règle qu'A3) · `depot_id?` ·
  **`competences_couvertes[]`** — voir la règle de périmètre ci-dessous · `delai_jours` ·
  `delai_mesures` · `prompt_version`, `modele`, `instrument_version` · `created_at`.

  **Trois règles qui sont des contraintes d'implémentation, pas des commentaires :**
  1. **Le Monitoring tourne en dernier**, après toutes les autres mesures du dépôt — il en dépend.
  2. **Sa validité est plafonnée par celle des autres compétences**, d'où la règle de périmètre
     chiffrée : **la calibration ne compte que sur les compétences dont le banc a passé la recette**
     (le critère du §1.7 — ≥ 15 copies, accord ±1 ≥ 80 %). `competences_couvertes[]` enregistre
     lesquelles ont compté, faute de quoi on ne saura jamais relire la mesure.
  3. **La lucidité est une observation directe de la Phase 1** (aucune comparaison) ; **la
     calibration est dérivée**, de deux sources — en local la phase « se juger » (comparaison **par
     le code, jamais par l'IA**, entre les réponses de l'élève et le squelette), en global la
     confiance déclarée à la remise de la v1 confrontée au niveau obtenu.

  *Dépendance d'interface, à ne pas perdre de vue* : toute cette télémétrie suppose que l'écran
  demande sa confiance à l'élève. C'est acquis — §3, temps 2 — mais si ce geste disparaît de
  l'interface, le Monitoring n'a plus d'objet.

- **`monitoring_niveaux`** — **nouvelle table (A8)**, l'état affiché : `eleve_id` ·
  `sous_dimension` · **`amplitude_courante`** · **`direction_courante`** · `n` (nombre de mesures) ·
  `statut_recette` · **`profil_provisoire`** bool · `updated_at`.
  **Le progrès est l'amplitude qui baisse ; la direction est un diagnostic, jamais un niveau.** Et
  les deux directions ne se valent pas : à amplitude égale, la **surconfiance** bloque
  l'apprentissage — l'élève cesse de travailler ce qu'il croit tenir — tandis que la
  **sous-confiance** coûte du moral, pas la vue. Elles appellent des réponses différentes ; le
  schéma doit permettre de les distinguer, l'affichage aussi.
  **Aucun banc ne peut valider cet instrument avant la rentrée : l'année 2026-27 en tient lieu
  d'épreuve.** C'est précisément pourquoi les quatre champs de télémétrie
  d'`exercices_metacognition` doivent être collectés **dès le premier exercice de septembre**.

- **`competences_actives_par_classe`** — **nouvelle table**, **clé amendée par A1** : la clé est
  **(classe, compétence, famille)** et non plus (classe, compétence). Elle dit quelle compétence est
  active dans quel cours **et dans quelle famille**. C'est elle qui porte le cas du Questionnement :
  **inactif en écriture pour HLP, actif en lecture** (§1.1). L'ancienne formulation « HLP n'a pas de
  Problématisation d'écriture » reste vraie de la seule famille écriture, mais elle ne dit plus que
  HLP n'a pas la compétence — il l'a, par la lecture.
- **`assiduite_hebdo`** — **nouvelle table (ou vue calculée)** : par élève × semaine, le nombre
  d'exercices assignés, terminés, et le booléen « semaine faite » au seuil configuré ; par classe ×
  semaine, le taux d'inactivité. **Collectée dès la rentrée** (§4ter).
- **Gates** : **`exercices_actif`**, **`routeur_actif`**, **`competences_affichage_actif`** (patron
  `rag_actif`, même emplacement). Tous OFF jusqu'à la recette.
- **Journal du routeur** : `routeur_decisions` — élève, slot, cible, règle déclenchée, alternatives
  écartées, choix élève, tirage aléatoire journalisé, **`borne_amont` retenue**. **Tout override
  prof est journalisé** (`origine` + entrée de journal).

**Non-spoiler (§ C5, précisé 29/07)** : la borne de la classe n'est pas celle de l'élève. Le routeur
**n'assigne jamais au-delà de la position de lecture connue de l'élève** ; à défaut de position
connue, il sert un **texte court hors livre**. La `borne_amont` retenue est journalisée à la
décision. *(Nuance de Louis : les livres lus étant des classiques, le spoiler pèse moins.)*

---

## 7. Anti-triche (T2) — un faisceau, jamais un verdict automatique

Les diagnostiques (et l'essai Fragments) sont le socle de validité : en classe, manuscrits, sous
surveillance — la triche n'y est pas le sujet.

**RÉVISION DU 29/07 — le faisceau change de nature avec le passage au clavier, et il en sort plus
riche.** Le manuscrit à la maison avait tué la durée mesurée ; le clavier la rend, et en ajoute.
Signaux du formatif maison, **tous tagués, aucun bloquant** :
- **durée** très inférieure à la durée attendue (redevenue mesurable) ;
- **rythme de frappe et apparition du texte par blocs** — un texte qui apparaît à 900 signes par
  minute n'est pas tapé par un élève ;
- **nombre de sessions** d'écriture ;
- **tentatives de collage bloquées** (§2) — chacune est journalisée ;
- **incohérence forte entre la qualité de la v1 et l'auto-jugement** (un texte excellent + un élève
  incapable de dire pourquoi) — renforcée par la **restitution à chaud** du §3.2 ;
- **delta v1→vf nul** sur un retour précis (réceptivité zéro répétée). **Attention : `delta_v1_vf`
  NULL n'est pas 0** — une passation en classe n'a pas de vf, et lire son NULL comme un zéro
  fabriquerait un faux signal ;
- **style discordant** avec l'historique (signal faible).

**Réserve consignée sur le blocage du collage** : il est côté navigateur seulement. Il arrête le
geste paresseux — qui est le geste majoritaire — pas l'élève déterminé qui recopie à l'écran ce que
son téléphone affiche. Le manuscrit ne l'arrêtait pas davantage.
Convergence de signaux → **drapeau intégrité au prof** (canal existant `signalerEnAttenteIA`, avec
confirmation humaine — patron C1/T3). **Option Pangram (proposition Louis, [à valider])** : sur
≥ 3 signaux congruents, le prof PEUT faire passer le prochain devoir de l'élève (diagnostique ou
exercice) par le détecteur externe Pangram — outil du prof, déclenchement manuel, jamais
automatique, jamais une preuve à lui seul. Préalables si adopté : vérifier la qualité du détecteur
sur le **français** ; ajouter Pangram à la liste des sous-traitants de la lettre Loi 25.
Recommandation : intégration **post-rentrée** (le faisceau v1 fonctionne sans). Rappel : la mesure formative maison est une *trajectoire*
(validité molle par construction) — les ancres en classe corrigent structurellement (§7 routeur) ;
l'anti-triche protège le retour élève, pas la note (il n'y en a pas).

---

## 8. Ce que C3 ne couvre PAS (frontières)

Les **bancs** (chemin critique d'août, hors quota code — `NOTE-CYCLE-PEDAGOGIQUE.md` §7) ; le
**contenu** des fiches pédagogiques et des exemples (conception, au fil des bancs — le schéma les
accueille en JSONB) ; la **réorganisation Fragments** (C8, y compris rubrique alignée et « Clarté
de la présentation ») ; le **prompt du tuteur RAG** (C2-L9, prompt de session déjà déposé) ; le
**allumage** du routage individuel (post-diagnostic) ; la variante du déroulé pour les **livres
Aletheia** (post-rentrée, `IDEES_post_rentree.md`) ; le **corpus des exercices d'écriture** (chantier
des semaines à venir — `reference_id` reste optionnel, beaucoup de types travaillent depuis la
production de l'élève ou un simple sujet) ; les **écrans** de l'assiduité — la frise élève et la page
de parcours (§3, §4ter : seuls les **compteurs** entrent dans C4).

**CORRECTION DU 29/07 — contradiction levée.** Ce paragraphe disait encore que « le code du routeur
peut s'écrire en C6 ou post-rentrée ». C'est **faux depuis la variante B** : le routeur prend la main
dès la semaine 2. **Le cœur R1-R6 est à écrire AVANT LE 25 AOÛT**, et avec lui la **règle
d'espacement des mesures secondaires** (§6). La télémétrie du §6 reste un prérequis non négociable.

---

## 9. Découpage en lots (C4 · C5 · C6)

**RÈGLE DE MANIFESTE (acté 29/07).** La règle R4 (« ce fichier et rien de plus ») rendait plusieurs
lots irréalisables : C4-L5 doit implémenter des prompts qui vivent dans `competences/*.md`, C4-L2 des
règles qui vivent dans `01-routeur.md`. **Chaque lot ci-dessous liste donc son manifeste de fichiers
faisant foi — nom et statut requis. Un fichier au statut insuffisant bloque le lot explicitement**,
au lieu de le laisser s'improviser.

**C4 — moteur + écriture (S2-S3 · ⚙️, prompts 🎻)**
- **L1 — Schéma & gates** : toutes les tables §6, seed des types écriture **et des types
  diagnostiques**, FK plan→module, RLS + gardes serveur (leçons C1), **les trois gates OFF**,
  **index unique `(depot_id, competence, version)`**, unicité + empreinte sur
  `exercices_references`. *Fait quand* : migrations sandbox ☑, `SUIVI_SQL.md` à jour ligne par ligne,
  un seed lisible, les trois gates vérifiés OFF.
  *Manifeste* : cette spec §6 · `SUIVI_SQL.md` · `c1_rls_eleve.sql` (patron RLS).
- **L2 — Pilotage prof (variante B)** : écran **budgets par élève** (plancher/plafond, optionnel,
  préférence élève recueillie à intervalle régulier) + création d'**exercices communs** + **écran en
  lecture seule** de ce que le routeur a assigné cette semaine + **compteurs d'assiduité** (§4ter).
  **La file de validation hebdomadaire est supprimée (F5).**
  *Fait quand* : le routeur remplit une semaine entière dans les bornes plancher/plafond de chaque
  élève ; le prof voit l'assignation de la semaine et peut l'écraser par override ; le taux
  d'inactivité par classe et le pourcentage d'assiduité par élève se calculent.
  *Coupe de repli* : si le routeur n'est pas prêt au 25/08, dégrader en écran Concevoir depuis
  `a_concevoir` (l'ex-variante A) — le schéma supporte les deux.
  *Manifeste* : cette spec §4, §4ter, §6 · `01-routeur.md` (couches, R1-R6, §7 lettres) — **statut
  requis : relu et validé par Louis**.
- **L3 — Élève formatif maison** : les **six temps** complets (§3) **à l'écran**, **blocage du
  collage + journalisation des tentatives**, timestamps, confiance déclarée, **conditions
  déclarées**, **restitution à chaud**, métacognition (avec `indetermine`), contestation à
  identifiants stables, retour final. *Fait quand* : un exercice entier traverse, chaque transition
  horodatée, le retour final cite le progrès réel, une tentative de collage est journalisée.
  *Manifeste* : cette spec §3, §5, §7 · `NOTE-CYCLE-PEDAGOGIQUE.md`.
- **L4 — Passation en classe** : le **flux complet du §3bis** — sujet au tableau, **ouverture
  manuelle du dépôt par le prof**, dépôt photos depuis le compte élève, **transcription en quelques
  secondes, éditable**, validation par l'élève, **traitement en lot au déclenchement du prof**, puis
  l'**écran de correction prof** : retours **masqués par défaut** et révélables à différents grains,
  retour **éditable**, **commentaire général**, validation **en masse ou individuelle**,
  **publication par case à cocher**, **obligation de lecture** côté élève. Les 2 sujets de la
  semaine 1 chargés.
  *Fait quand* : **140 copies** photographiées traversent **sans intervention** (c'est l'échelle
  réelle : 70 élèves × 2 passations — une file qui tient à 30 peut s'effondrer à 140) ; la
  transcription revient en quelques secondes par copie ; le prof publie un lot entier.
  *Manifeste* : cette spec §2, §3bis, §6, §11 · `PROMPT_transcription_copies_tests.md` — **fait foi,
  conservé tel quel**.
- **L5 — Mesures & niveaux** : chaîne P1/P2 **par compétence** (prompts de conception, appels
  froids, **lancés en parallèle** — contrat de latence 3 min), `competences_mesures` (M1/M3 avec les
  définitions du §0), agrégation des lettres (§4bis), **retour chaud** (§5), **retour final** (diff
  des squelettes v1/vf), **`exercices_jobs`** et ses garde-fous d'idempotence, **plafonds de coût**
  (mensuel, alerte à 70 %, coupure automatique qui bascule le gate en laissant les dépôts en file,
  plafond d'appels par dépôt), **prompt caching** (la copie en préfixe commun des N appels),
  **défense contre l'injection** (§5), coûts branchés sur `api_couts`.
  *Fait quand* : un dépôt produit squelettes + mesures + retours conformes au contrat ; un retry
  après expiration ne crée jamais une seconde mesure ; le retour arrive en moins de 3 minutes.
  *Manifeste* : cette spec §0, §5, §6 · `competences/*.md` — **statut requis : versé et bancé** ; un
  fichier de compétence absent ou non bancé **bloque cette compétence**, pas le lot entier.
- **L6 — Onglets Codex** (Exercices · Synthèse · Paramètres) + revue Synthèse. **L7 — Recette du
  flux.** *(Coupes C4 : conception Bac blanc ; revue Synthèse réduite aux onglets.)*

**C5 — lecture (S3 · ⚙️, prompts 🎻)**
- **L1 — Conception prof lecture** : extrait/tranche (non-spoiler : amont exposé seul), questions
  depuis la consigne-gabarit du type, **référence décomposée générée + validée** (le geste central).
- **L2 — Passation élève** : mêmes cinq temps, retour **ancré au texte** (citations de l'extrait).
- **L3 — Mesures lecture** : P1/P2 des cinq compétences (prompts de `prompts-inventaire.md`),
  Monitoring dérivé, mêmes tables. **L4 — Onglets Aletheia** (Exercices · Livres · Paramètres),
  design biblio. *(Coupes : un seul format élève (L7) ; design biblio en grille de tuiles.)*

**C6 — retours compétences (S3-S4 · 🎻 formulations / ⚙️ le reste)**
- **L1 — Matrice prof** : classe × compétence en lettres (0-4 sous-jacent), clic → élève
  (historique, **classe d'origine de chaque mesure**, **`n` par compétence — et la « confiance »
  seulement quand le modèle de certitude existe**), diagnostic Quazian rangé dedans, drapeaux
  (**contestations répétées, au seuil chiffré**, faisceau du §7, fraîcheur d'ancre).
- **L2 — Retour élève** : **par défaut, trajectoire et cible** (« travaillé 4 fois · en progrès ·
  prochaine étape ») ; **les lettres et les courbes ne s'affichent que si l'élève choisit de les
  afficher** (§4ter) ; « quoi travailler » (1-3 compétences + le geste concret).
- **L3 — « En faire plus »** : pull (quota 30 min/sem, **minutes non utilisées perdues**) + push
  (fraîcheur).
- **L4 — Branchement essai-Fragments** : l'essai évalué par la chaîne (`contexte =
  essai_fragments`) — activation à la décision de recette. *(Coupes : courbes d'évolution ;
  push différé si S4 déborde.)*

**Prompts de session** : déposés chantier par chantier au fil des cycles (boucle §8 du plan) —
`PROMPT_Code_C4_L1.md` et `PROMPT_Code_C4_L2.md` sont déposés au gel du 29/07.

---

## 10. Risques identifiés (révisés au gel du 29/07)

1. **Le pipeline de transcription en semaine 1**, resserré par le §3bis : la transcription doit
   revenir **en quelques secondes par copie**, **pendant l'heure de cours**, pour ~35 élèves
   simultanés. Tester la file en charge dès C4-L4, **à 140 copies**.
2. **Coût API.** 70 élèves × 2 passations × (6+5) compétences × 2 phases pour la seule semaine 1 ;
   en régime, **2N + 4 appels par exercice**. *Ordre de grandeur annuel révisé le 30/07 (A12, A13) :
   le nombre de cycles n'est plus posé mais **dérivé du Calendrier** (semaines de cours − 2), et
   l'année d'exercices s'arrête au **10 mai** — soit **~28 cycles**, non ~34 semaines.* Leviers déjà décidés : prompt caching, appels en
   parallèle, plafond mensuel avec coupure automatique, **mesure secondaire espacée** (§6). Levier
   encore ouvert : **le régime de modèle** — l'hypothèse Haiku-hebdo / Sonnet-ancres du 28/07 reste
   **[à valider]**, et c'est le plus gros levier restant.
3. La phase « se juger » sur mobile : 2-3 questions max, taps, pas de saisie longue.
4. **Le biais de l'OCR sur Expression** (réduit, pas éteint). L'OCR ne vit plus que sur le canal
   classe — mais c'est là que vivent les **ancres**. Un modèle de vision tranche les graphies
   ambiguës vers la **forme correcte**, ce qui surestime Expression et davantage chez les faibles.
   Le contrôle par l'élève répare les contresens, **pas** ce biais : un élève ne rétablit pas ses
   propres fautes. **Risque assumé** au titre de l'arbitrage « surnoter est moins grave que
   sous-noter » ; le prompt de transcription strictement littéral est conservé tel quel et **aucun
   test OCR n'entre au chemin critique** (décision du 29/07). *Second décalage consigné : les copies
   de calibration sont des jets bruts, la production sera du texte relu (§3bis).*
5. RLS : `exercices_metacognition` et `exercices_squelettes` ne doivent JAMAIS être lisibles
   élève avant publication du retour (patron aletheia_travaux FERMÉ, leçons C1).
6. **Données personnelles** : quota bonus, timestamps, rythme de frappe, tentatives de collage,
   conditions déclarées, assiduité — le faisceau du §7 est un profil comportemental fin. **Couvert
   par le §11**, jalon du 22 août.
7. **Périmètre d'août.** Le cœur R1-R6 **plus** la règle d'espacement des secondaires **plus**
   l'écran de correction du §3bis entrent avant le 25/08. La file de validation hebdomadaire ayant
   disparu, C4-L2 rétrécit d'autant — mais C4-L4 grossit.
8. **Le clavier rouvre le copier-coller.** Le blocage est côté navigateur seulement (§2, §7). Le
   faisceau compense, il ne remplace pas.
9. **Lisibilité et équité** : l'exemption par élève est livrée **en même temps** que la règle de
   lisibilité, jamais après — et le profil ne stocke que `mode_saisie_force`, jamais un diagnostic.
10. **La boucle lexicale auto-confirmante** : l'instrument qui mesure est celui qui enseigne. Seule
    parade posée : l'**ancre aveugle** du §4, et la mise en regard semestrielle. Réserve de Louis :
    l'effet est inévitable, et partiellement atténué par le fait que le retour ne révèle pas la
    grille complète.

---

## 11. Conformité — loi 25 (Québec)

**Cadre.** Établissement : **lycée français au Québec** — pédagogie et calendrier français (TC/HLP,
bulletin sur 20, bac blanc), **droit québécois**. Élèves de **17 ans et plus** dans leur immense
majorité : au Québec, **le consentement relève de l'élève lui-même** (dès 14 ans) ; l'information
aux parents est une **pratique d'établissement**, pas une obligation légale — à confirmer par
l'établissement. *Ce paragraphe est de l'information, pas un avis juridique.*

**Jalon daté : une lettre présentant le traitement, prête le 22 août** (chemin critique d'août —
c'est du temps de Louis, pas du code). Elle porte :

1. **La table de traitement**, jointe au schéma. Pour chaque donnée — photo de copie, transcription,
   texte saisi, squelette, verdict, retour, commentaire général, télémétrie comportementale du §7,
   assiduité : sa **finalité**, qui la **lit**, quel **sous-traitant** la reçoit et où, sa **durée de
   conservation**, son **mode d'effacement**.
2. **Toute contestation individuelle atteint un humain.** La loi encadre les décisions fondées
   exclusivement sur un traitement automatisé : le bouton « je ne suis pas d'accord » et la
   contestation de calibration (§3.3) aboutissent au professeur, jamais à une file qui s'auto-résout.
3. **Le profil ne stocke jamais un diagnostic médical** — l'aménagement s'enregistre comme
   `mode_saisie_force = ecran`, sans motif.
4. **Purge des métadonnées EXIF** (géolocalisation, appareil, horodatage) avant tout envoi de photo.
5. **Propriétaire institutionnel** : responsable du traitement nommé, mode dégradé si Louis est
   absent, scénario de sortie si le système s'arrête ou s'il quitte l'établissement. À régler avec
   la personne responsable de l'accès à l'information de l'établissement.

**Sous-traitants** : le fournisseur d'IA (transcription, P1/P2, retours) ; **Pangram** s'y ajoute si
l'option du §7 est adoptée.
