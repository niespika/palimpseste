# SPEC C3 — Exercices & Compétences (spec unique, écriture + lecture)

> **Statut : v4.5 — SOCLE DE CONSTRUCTION** (gel du 29/07/2026 ; amendée les 29 et 30/07, amendements A1 à A19).
> **SÉRIE A20-A51 APPLIQUÉE EN ENTIER — chapitre 0 de la passe de mise en cohérence, CLOS le
> 03/08/2026.** Les **30 entrées** de `AMENDEMENTS_C3_en_attente_2026-07-31.md` sont posées, en
> quatre séances (02/08 : entrées 1-4 · 03/08 : 5-16, puis 18-27 et 30, puis le groupe **17 + 28 +
> 29**). Le tableau de bord A ci-dessous en porte le détail entrée par entrée. *La version a été
> incrémentée dès le premier amendement de la série, et non à sa fin : laisser l'en-tête à v4.3
> pendant l'application aurait dit à une session Code qu'elle travaille sur le socle gelé, ce qui
> était faux.*
> **v4.5 — CHAPITRE 1 DE LA PASSE, le 03/08/2026 : amendements A52 à A54.** Le mot « mode » ne
> nomme plus qu'une chose (**A52**), le lieu de la mesure passe à **deux valeurs** (**A53**), et le
> **lieu** et la **forme** deviennent deux axes distincts — ce qui déplace la définition de l'**ancre**
> (**A54**).
> **À partir d'ici, C3 redevient modifiable pendant la passe — mais toute modification reste un
> amendement daté**, inscrit au tableau de bord, et la version s'incrémente.
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
| **29/07/2026** | Dépouillement des conversations de juin | **A6 — jalon « voir un palier Acquis produit »** à ajouter au critère de recette : le critère actuel peut être satisfait sans que le seuil ait **jamais** été observé ouvert, sur aucune compétence | §1.7 | ~~**(b)** *en attente de décision*~~ → **requalifié (c) le 03/08 par A26** |
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
| **02/08/2026** | Chantier Structure, note du 31/07 (son A20) — appliqué à la passe de mise en cohérence, chapitre 0, entrée 1 | **A20 — la chaîne d'évaluation est en QUATRE temps, et le modèle ne calcule plus.** `P1 (modèle) → code qui prépare → P2 (modèle) → code qui agrège`. **P2 ne rend ni niveau, ni dimension, ni décompte** ; aucune lettre et aucun nombre ne sortent du modèle. *Révise « P2 produit le verdict », vrai jusqu'au 30/07.* **Motif mesuré** (Expression puis Structure) : sur 118 cellules, Haiku manque la règle d'agrégation **20 fois sur 25** là où elle est déterminée, et cinq répliques d'un même squelette figé rendent **quatre décomptes différents** pour un même verdict. **La formule 2N + 4 est inchangée** — les deux temps de code ne sont pas des appels. **Trois endroits corrigés** : §0 (lexique « Appels froids / chauds ») · §5 (phrase d'ouverture) · **§9, lot C4-L5** — ce troisième ajouté en séance, la description du lot ne mettait pas les deux temps de code dans son périmètre, ce qu'une session Code appliquant R4 (« ce fichier + la section du lot ») n'aurait pas su | §0, §5, §9 | **(a)** |
| **02/08/2026** | Relevé d'arbitrage du 30/07, item F22 — passe de mise en cohérence, chapitre 0, entrée 2 | **A21 — « 2N + 4 » est rétrogradée en ordre de grandeur.** La formule reste vraie comme estimation de conception ; elle cesse d'être un chiffre de pilotage. **Aucune règle ne doit s'y appuyer — ni plafond, ni projection, ni arbitrage** ; le chiffre qui fait foi est celui de la **télémétrie** (F21 : chaque appel journalise phase, modèle et tokens). *Objection de Louis à l'origine : « je ne suis pas sûr de trop voir à quoi tout cela sert… je le verrai bien en testant. »* **Motif technique** : le `01-routeur.md` définit N de deux façons incompatibles entre son §4 et son §6 — le risque n'est pas de mal prévoir, mais qu'un lot de code implémente un plafond sous une lecture pendant qu'une autre section en suppose une autre. **Vérification faite en séance** (l'entrée était marquée *à vérifier*) : la formule est bien portée par C3, en **deux endroits de fond**, §0 et §10 point 2 ; en revanche l'incompatibilité des deux définitions de N est **interne au routeur**, non à C3, dont l'arithmétique est cohérente — la réserve est donc portée, pas un constat de contradiction interne | §0, §10 | **(a)** |
| **02/08/2026** | Découvert en appliquant A21 — traité dans la même passe sur décision de Louis | **A22 — le compte « (6+5) compétences » est périmé, et il est détaché des calculs.** Le §10 point 2 chiffrait la semaine 1 sur « 6 compétences d'écriture + 5 de lecture ». **Il n'y a plus dix compétences réparties en deux familles déclarées : il y en a six**, et ce qui distingue l'essai de l'explication de texte est le **mode**, non l'appartenance de famille (décision du 02/08, séances 3 et 4 de la révision de `02-exercices.md`). **Deux endroits touchés** : §10 point 2, dont le calcul cesse de s'appuyer sur le compte périmé ; et **§1, point 4**, où les deux comptes passent **[à valider]** sans être effacés — *le partage réel des six compétences entre les deux passations de la semaine 1 est une décision à prendre, pas une correction mécanique ; elle appartient à l'entrée 29 de la liste d'amendements.* **Pris par anticipation sur l'entrée 29** pour ne pas corriger deux fois la même phrase | §1, §10 | **(a)** partiel — le compte lui-même reste **(b)**, ouvert |
| **02/08/2026** | Relevé d'arbitrage du 30/07, item F3 — passe de mise en cohérence, chapitre 0, entrée 3 | **A23 — le banc du Questionnement couvre les deux familles avant `evaluee`.** Condition ajoutée au **critère de recette du §1.7** : **quatre lots au lieu de deux — deux en `composition`, deux en `reception`**. *Motif d'inscription : une contrainte de protocole n'est appliquée par aucun code ; sans cette ligne le Questionnement passerait `evaluee` sur une seule famille.* **Aucun effet de schéma** — `statut_recette` reste sur la compétence, sa clé n'est pas étendue à la famille. **Traduction de vocabulaire assumée** : F3 disait « 2 lots écriture, 2 lots lecture » ; les familles s'appellent désormais `composition` et `reception`. **RÉSERVE INSCRITE AVEC L'AMENDEMENT, sur constat de Louis** : le **motif** de F3 est périmé — il réservait la contrainte au Questionnement comme « seule compétence des deux familles », or la **Décision 4 du 02/08** retire à toutes leur appartenance déclarée et **les six traversent les deux familles**. *La condition est maintenue, sa généralisation aux six est **[à valider]** et part au chapitre 5 de la passe.* | §1.7, et `01-routeur.md` §12 (à écrire au chapitre 3) | **(a)**, avec une réserve **(b)** attachée |
| **02/08/2026** | Relevé d'arbitrage du 30/07, item F2 — passe de mise en cohérence, chapitre 0, entrée 4 | **A24 — la bascule vers `evaluee` recalcule la lettre.** Le passage de `mesuree_silencieusement` à `evaluee` **recalcule la lettre depuis les seules mesures postérieures à la recette** ; les antérieures restent au journal, distinguées par `instrument_version`. **Vérification faite en séance** (l'entrée était marquée *à vérifier*) : **F2 place explicitement la règle au `01-routeur.md` §3** — ce n'est pas un oubli de C3. **Elle est donc inscrite ici en RENVOI, non en copie** : C3 est le seul document qu'une session Code lit (R4), et un lot implémentant `statut_recette` sans la transition laisserait des lettres bâties sur un instrument non bancé. *Application de la règle « un contenu, un domicile, des renvois partout ailleurs ».* **Aucun ajout de schéma, vérifié** : `instrument_version` est déjà porté par `exercices_squelettes`, `competences_mesures` et `monitoring_mesures` | §1.7 | **(a)** |
| **03/08/2026** | Chantier Structure, note du 31/07 (son A21), croisée avec le `PROTOCOLE-CALIBRATION.md` — passe de mise en cohérence, chapitre 0, entrée 5 | **A25 — ce qu'est « le niveau » d'une copie passée plusieurs fois, et sur quoi porte le 80 %.** Quatre règles inscrites au critère de recette du §1.7 : **cinq tirages, toujours** ; **l'unité de mesure est la cellule (copie × observable), jamais la copie** ; la valeur retenue par cellule est le **mode des cinq tirages, rendu avec son étendue** (une cellule sans mode compte comme désaccord) ; et la **tolérance de ±1 cran de la recette ne se confond pas avec la bande déclarée au gold** qu'emploie le tri A/B/C/D du protocole. **Trois arbitrages de Louis du 03/08.** *(1)* **Le `PROTOCOLE-CALIBRATION.md` fait foi** — ce qui renverse la décision « le nombre de tirages reste à trois » du 31/07 ; les deux décisions avaient été journalisées le même jour, dans deux séances parallèles qui ne se voyaient pas, et l'`AGENTS.md` du dossier de conception portait déjà la règle de primauté. *(2)* **Le seuil se compte à la cellule**, ce qui porte n de 11 à 64-80 et le rend estimable à ±5 points. *(3)* **Le §1.7 garde 80 % en pourcentage brut** : la borne basse d'intervalle de confiance ≥ 85 % du protocole est sa règle d'**arrêt du cycle de calibration**, pas la porte de recette — deux décisions distinctes *(l'aligner aurait exigé 60 cellules sur 64, soit 93,8 % brut, et mis la recette hors d'atteinte au 24/08)*. **Clause renversée, et ce qu'elle protégeait conservé** : la note Structure posait « le critère se mesure par tirage, jamais par mode » ; le protocole et son harnais gatent sur le mode (`accord_modal`), donc la clause tombe — mais le **taux par passage** (`taux_par_passage`, déjà produit par le harnais) est déclaré au journal de recette à côté du taux qui fait porte, parce qu'en production le §0 ne prévoit qu'un seul appel P1/P2. **Aucun effet de schéma.** *Le mot « mode » est conservé au sens statistique, malgré la collision avec les cinq modes du contrat de type — un avertissement est écrit au §1.7, et la collision se règle au chapitre 1 de la passe.* **Trois retouches de grain dans la même passe** : la condition chiffrée du §1.7, la ligne « Critère de recette » du tableau des paramètres, et le renvoi de la section Monitoring | §1.7, tableau des paramètres, §6 Monitoring | **(a)** |
| **03/08/2026** | Chantier Structure, note du 31/07 (son A22) — passe de mise en cohérence, chapitre 0, entrée 6 | **A26 — A6 est requalifié en trou déclaré, avec sa condition de fermeture.** Le jalon « voir un palier Acquis produit » **n'est PAS ajouté au critère de recette** : ce serait une condition qu'aucun corpus disponible ne permet de remplir. Il est **déclaré ouvert**, et se referme quand la donnée existe — **un lot de copies qui portent des charnières**, le prochain lot réel si possible, un lot synthétique à défaut. **Premier cas mesuré** (run Structure du 30/07) : **six copies sur neuf ne portent aucune charnière** ; la cohésion locale étant définie sur les charnières, la branche §2c plafonne la cohésion à *satisfaite* et **ferme le palier Acquis par construction sur les deux tiers du jeu** — l'alerte `TROU_DECLARE_ACQUIS`, rangée en « cas attendu », est le **régime ordinaire** du corpus. *Second mécanisme documenté le 31/07 sur la Copie4 : une copie qui ferme sa première partie et ouvre la seconde par des blocs de service n'a aucune charnière au sens de la règle de Structure.* **Décision de Louis du 31/07 qui commande la requalification** : *on n'élargit pas la définition de la charnière pour en fabriquer* — une définition étirée jusqu'à produire des Acquis mesurerait la définition, pas l'élève. **Change le régime d'A6, de (b) à (c)** ; l'ouverture 15 du tableau de bord B est réécrite en conséquence. **Échéance visible conservée** : la question se repose avant la recette du 24/08 | §1.7, tableau de bord B (ouverture 15) | **(c)** |
| **03/08/2026** | Relevé d'arbitrage du 30/07, item F27 — passe de mise en cohérence, chapitre 0, entrée 7 | **A27 — l'essai de Fragments sera très probablement réservé aux HLP, et c'est sans effet sur la construction.** Le fait : l'essai de Fragments se passe en classe, manuscrit, sous surveillance (§7, déjà écrit), et sera « très probablement limité aux seuls HLP **au moins cette année** ». **La conséquence, neuve et écrite nulle part jusqu'ici** : l'essai étant une **source d'ancre**, **l'inventaire des ancres n'est pas le même selon le parcours** — un élève HLP en a une de plus qu'un élève de tronc commun, donc la cadence cible d'une ancre par compétence `evaluee` toutes les 6 semaines est plus facile à tenir en HLP. **RÉGIME CHANGÉ EN SÉANCE, de (b) à (a), sur arbitrage de Louis** : l'entrée prévoyait d'inscrire une question ouverte ; Louis l'a fermée — *« je fais mes évaluations en classe quand je veux, et je tiendrai le compte dans mon plan d'évaluation »*. **Aucune cadence différenciée, aucune source d'ancre de remplacement, aucun traitement particulier du tronc commun n'est à construire** : la cadence se tient au plan d'évaluation, qui appartient au professeur, et le signal non bloquant déjà spécifié suffit, à l'identique quel que soit le parcours. *C'est donc une fermeture écrite, pour qu'une session ultérieure ne rouvre pas la question — et non un `[à valider]`.* **Correction de destination** : l'entrée annonçait « §1.4 » ; le point Fragments est le **§1 point 5**, le point 4 étant le diagnostic de la semaine 1 | §1 point 5, §4 | **(a)** *(l'entrée était classée (b))* |
| **03/08/2026** | Chantier Structure, note du 31/07 (son A23) — passe de mise en cohérence, chapitre 0, entrée 8 | **A28 — le dispositif mesure l'architecture telle qu'elle est écrite sur la page.** Le découpage en blocs, sur lequel Structure est mesurée, est **donné par les paragraphes** : une copie saisie **sans retour à la ligne** n'a qu'un bloc, aucune couture, et se lit comme **dépourvue d'architecture** même si elle articule à l'intérieur de ce bloc unique — **un fait de mise en page devenu fait de mesure**. **Cas constaté** : la Copie2 du jeu de test, sur laquelle la chaîne ne rendait **aucun niveau**, un `null` silencieux au milieu d'un tableau de résultats. **Corrigé le 31/07** — une copie sans couture est lue en défaillance forte et le déclare (`COPIE_SANS_COUTURE`), niveau Faible conforme à son gold, la règle dérivée d'abord et le niveau constaté ensuite — **mais le correctif rend le trou visible, il ne le referme pas**. **Condition de fermeture** : une **interface de rédaction qui garantit ou encourage le découpage en paragraphes** — **contrainte d'interface, pas de mesure**, donc inscrite au **lot C4-L3**, dont le manifeste reçoit le §2 ; le passage du formatif maison au clavier en est la condition de possibilité. **Trois endroits écrits** : §2 (le trou et sa condition) · §1.7 (renvoi — une recette passée sur un corpus bien paragraphé ne dit rien d'une copie d'un seul tenant) · §9, lot C4-L3 (la contrainte et son *fait quand*). *Le versant manuscrit du même défaut — rien n'exige que la transcription OCR préserve les retours à la ligne — vit hors périmètre, au `PROMPT_transcription_copies_tests.md`, et part à la liste de propagation.* | §2, §1.7, §9 (lot C4-L3) | **(c)** |
| **03/08/2026** | Relevé d'arbitrage du 30/07, item F1 — passe de mise en cohérence, chapitre 0, entrée 9 | **A29 — la parenthèse « 75-90 min pour 45 min de rédaction » est retirée, et aucun rapport chiffré ne la remplace.** Le §3 écrivait « un exercice dont la rédaction fait 45 minutes en coûte 75 à 90 en tout ». **Correction de fait de Louis (F1)** : *« je conteste l'idée que 90 min d'exercice se traduise en seulement 45 min de rédaction. 45 min de rédaction, c'est 45 min d'exercice. »* L'ancienne valeur **additionnait les six temps du cycle et surestimait le total** ; c'était la **seule durée d'exercice chiffrée** du dispositif, et un relecteur adversarial en avait extrapolé un constat entier. **Ce qui survit est le motif du dédoublement `duree_exercice_min` / `duree_redaction_min`, pas le chiffre** : les deux durées mesurent deux choses différentes, et leur écart réel se constate au lieu de se postuler. **La phrase est supprimée, non commentée** *(sur remarque de Louis en séance : une note explicative sur un chiffre qui n'a plus d'utilité est de l'appareil — la trace vit ici, au tableau de bord)* ; seule reste au §3 la **règle** « aucun rapport chiffré n'est posé entre les deux durées », qui empêche d'en re-déduire un. **Vérifications faites** : le chiffre n'apparaissait qu'**une fois** dans C3 ; le `01-routeur.md` **était déjà corrigé** le 30/07, et les deux autres formulations que sa note visait avaient été traitées par A10 — rien à reporter au chapitre 3 | §3 | **(a)** |
| **03/08/2026** | Relevé d'arbitrage du 30/07, item F9, complété le 31/07 à la révision de `02-exercices.md` — passe de mise en cohérence, chapitre 0, entrée 10 | **A30 — la durée déclarée est indicative, le temps réel est mesuré, et `duree_redaction_min` disparaît.** **(i)** La durée déclarée par type reste celle du régime nominal et devient **indicative** ; elle demeure la seule que le routeur et le quota décomptent, ce qui garde le remplissage **déterministe**. **(ii)** Le **temps réel est mesuré** (chronomètre ouverture → dépôt) et journalisé ; il corrige **le cycle suivant, pas celui en cours**. *Vérifié : aucun champ neuf — `exercices_depots` porte déjà `ouvert_at`, `v1_remis_at`, `vf_remis_at`, `juger_debut_at`, `juger_fin_at` et `duree_taguee`.* **(iii)** Au-delà du seuil de dépassement (**×2**, provisoire — paramètre, registre au §11 du routeur, A17), une **micro-question conditionnelle** « pause, ou difficulté ? », **jamais notée, jamais renvoyée comme jugement**, et **distincte du geste sur les conditions** qui porte sur l'effort. **Un seul champ neuf : `motif_depassement`** (`pause` \| `difficulte`, NULL si non déclenchée ou non répondue) sur `exercices_depots` — *nom validé par Louis en séance*. **(iv)** Les champs `duree_v1_min` / `duree_vf_min` proposés par les deux revues adversariales **ne sont pas créés**. **(v) `duree_redaction_min` EST SUPPRIMÉ** de `exercices_types` (§6) et sa définition retirée du §3 — *raison de Louis : « mes diagnostiques en classe ont une durée qui est déterminée par la durée des séances dont je dispose. Rien de plus » ; la durée d'une passation en classe est une propriété de la **séance**, pas du type*. **Ferme l'ouverture 20** du tableau de bord. **(vi)** Le signal anti-triche du §7 se compare désormais explicitement à **`duree_exercice_min`**. **(vii) Une contradiction interne se referme du même coup** : le §7 comparait déjà à « la durée attendue » — donc à `duree_exercice_min` — quand le §3 nommait `duree_redaction_min` ; **les deux sections ne lisaient pas le même champ**. **DATÉ : volet schéma dû avant C4-L1** | §3, §6 (`exercices_types`, `exercices_depots`), §7, tableau de bord B (ouverture 20) | **(a)** |
| **03/08/2026** | Relevé d'arbitrage du 30/07, item F6 — passe de mise en cohérence, chapitre 0, entrée 11 | **A31 — la matrice normative par statut de recette reçoit son contenu.** Le §4 **annonçait** une matrice — « pour chaque état, ce qui tourne et ce qui est masqué » — dont le contenu n'existait pas : une phrase, rien dessous. **La ligne neuve, celle qu'apporte F6** : un exercice commun portant une compétence **non `evaluee`** ne produit **pas de verdict**, et son retour est de **registre descriptif** — il montre ce que le squelette contient et **n'attribue aucun niveau**. *La question de la **mesure** était déjà réglée par A24 (arbitrage F2) ; c'est celle du **retour** que rien ne traitait, et le relevé désigne la matrice comme son lieu, « plutôt qu'au cas par cas ».* **Les cinq autres lignes ne décident rien de neuf** : elles rassemblent des règles déjà actées, chacune avec sa source (§1 pt 7 pour la mesure et le verdict ; §4 pour le ciblage ; A8/§6 pour la calibration du Monitoring ; les gates pour l'affichage). **Vérifié où vivent les règles, pour citer plutôt que recopier** : le principe « on suspend le verdict, jamais le feedback » a son domicile au `01-routeur.md` §7, et F6 y est écrite au §5, `02-exercices.md` la portant aussi. C3 doit néanmoins porter la matrice, puisque c'est C3 qui l'annonce et qu'une session Code ne lit que C3 plus la section de son lot (R4). **TROUVAILLE EN CONSTRUISANT LA MATRICE : `differee` n'a de définition NULLE PART** — ni dans C3, ni au routeur, ni dans `02-exercices.md` ; on sait seulement qu'elle n'est ni ciblée ni co-présente. Mesure-t-on encore ? que voit l'élève ? **Deux cases de la colonne sont donc `[à valider]`**, et la question part au **chapitre 5** — *un lot qui implémente les trois statuts n'a aujourd'hui rien à écrire pour le troisième*. Louis, en séance : « on tranchera plus tard » | §4 | **(a)**, avec deux cases **(b)** attachées |
| **03/08/2026** | Relevé d'arbitrage du 30/07, item F24, relu contre la Décision 4 du 02/08 — passe de mise en cohérence, chapitre 0, entrée 12 | **A32 — la cadence 2-1 revient comme PROPORTION, binaire, sur les familles dérivées.** **Deux tiers des exercices en famille `composition`, un tiers en `reception`, sur une rotation glissante de trois cycles.** Le §4 ne portait, depuis A12, que la suppression de la cadence calendaire et un partage « probabiliste et par élève » — **devenu incomplet** : il n'y a plus de partage réglé, ce qui est faux. *Motif de la règle : **toutes les règles qui élisent sont des règles d'écriture** (R1, R2, R3 ; R4 met la Connaissance hors rayon) — sans proportion, la composition prenait **100 %** des élections.* Le caractère probabiliste et par élève est intact : la proportion gouverne le partage entre familles, « niveau × fréquence » gouverne quelle compétence est servie à l'intérieur. **OBJECTION DE LOUIS EN SÉANCE, VÉRIFIÉE ET RETENUE** : la première rédaction écrivait « écriture / lecture », d'après C3 §6 — *« il me semble que 02-exercices, qui est le plus à jour, a acté composition-reception »*. **Il a raison** (Décision 4 du 02/08 : `famille` n'est plus déclarée, elle se dérive du mode élu). **ET LA VÉRIFICATION A TROUVÉ PLUS QUE LE NOM** : la table de propagation de `02-exercices.md` annonce « F24 devient une proportion **sur les modes** » — mais elle **s'annonce elle-même comme un relevé de la séance 3**, et la **séance 4 a explicitement écarté** la généralisation du signal de ciblage au mode *(le r = .44 qui la fonde oppose la composition à la réception — deux valeurs — et les modes de réception ne se séparent pas)*. **La proportion reste donc BINAIRE.** **Conséquence à surveiller, inscrite avec la règle** : un tiers des exercices laisse aux compétences servies en réception un ciblage plus espacé que la fenêtre de montée de six semaines — *le chiffre exact est à refaire, il avait été calculé sur cinq compétences de lecture ; le recalcul appartient à l'entrée 29, le risque non*. **LE `01-routeur.md` A ÉTÉ RÉALIGNÉ DANS LA MÊME PASSE, sur demande de Louis** (« réaligne tout de suite, pour éviter qu'on oublie un truc plus tard ») — quatre endroits : l'énoncé de F24 au §1, le partage « probabiliste », la conséquence à surveiller, et la ligne du **registre §11** *(« Proportion écriture / lecture » → « Proportion `composition` / `reception` »)* | §4, et `01-routeur.md` §1 et §11 | **(a)** |
| **03/08/2026** | Relevé d'arbitrage du 30/07, items F7 et F14, plus la conséquence relevée en F15 — passe de mise en cohérence, chapitre 0, entrée 13 | **A33 — deux valeurs dérivées gouvernent le ciblage, et ce ne sont pas les lettres affichées.** **(1)** Le **signal de ciblage est dérivé par famille** (F7) : le ciblage en `composition` lit les mesures de cette famille, celui en `reception` les siennes — la lettre affichée restant **unique** par élève × compétence. **(2)** **R2 élit sur une valeur NON PLAFONNÉE** (F14), quand la lettre affichée reste plafonnée à **ancre + 2** — *motif concret : un élève solide diagnostiqué D en Structure alors que ses autres lettres sont à B voit R2 élire « la plus faible du trio » et passe le mois suivant sur la compétence où il est le meilleur, sans qu'aucun drapeau ne le voie*. **(3)** **La stagnation se lit sur la valeur non plafonnée** (conséquence de F14 relevée en F15) — sinon le plafond ancre + 2 **fabrique de la stagnation**. **Aucune règle de lettre changée, aucune colonne physique créée** : l'amendement porte sur la **règle écrite**. **VÉRIFICATION FAITE, ET ELLE ÉVITE UN DOUBLE TRAVAIL** : le `01-routeur.md` **porte déjà les trois points** — son §3 déclare les deux valeurs « dérivé, jamais stocké » (F7 et F14), son §6 définit la stagnation sur « la colonne dérivée non plafonnée, pas la lettre affichée », son §7 précise que le plafond « borne l'AFFICHAGE, pas le ciblage ». **C'est C3 seul qui ne les avait pas**, et il les lui faut au titre de R4 (une session Code ne lit que C3 plus la section de son lot). *Aucun réalignement du routeur n'était donc dû* | §4, §6 (`competences_mesures`) | **(a)** |
| **03/08/2026** | Relevé d'arbitrage du 30/07, item F1 — passe de mise en cohérence, chapitre 0, entrée 14 | **A34 — deux compteurs de minutes entrent à `assiduite_hebdo`.** **Minutes assignées** (somme des `duree_exercice_min` posées par le routeur) et **minutes de budget** (plancher/plafond de l'élève), **par élève et par cycle**. *Usage : dire dès novembre si la calibration du grain macro sur la fourchette hebdomadaire tient — si les durées déclarées des types remplissent réellement le budget.* **Retenu comme gratuit en F1** : les deux nombres existent déjà, l'un dans les types assignés, l'autre au profil. **Lien avec A30, posé le même jour** : la durée déclarée étant désormais **indicative** et le temps réel mesuré à côté, l'écart entre les deux se lira ici. **L'indicateur a son domicile au §10 du `01-routeur.md`**, où il est déjà inscrit ; C3 n'écrit que l'origine des deux nombres. *Rien ajouté au §4 : son bloc « budget de temps hebdomadaire » se lit sans le compteur, et le doubler serait une redite.* **Attention de destination, relevée par la liste elle-même** : le §10 de C3 est « Risques identifiés », **pas** la télémétrie — le « §10 » du relevé vise le routeur | §6 (`assiduite_hebdo`) | **(a)** |
| **03/08/2026** | Relevé d'arbitrage du 30/07, angle mort G3 — passe de mise en cohérence, chapitre 0, entrée 15 | **A35 — l'ancre aveugle reçoit son unité de comparaison.** La mise en regard semestrielle se lit en **écart en crans, par compétence**, et **son résultat se journalise**. *Le seuil qui déclencherait une action et l'action elle-même ne sont volontairement pas fixés — la première mise en regard a lieu en janvier, et le jugement sur pièces vaudra mieux qu'un seuil posé d'avance sur un effectif de cette taille.* **VÉRIFICATION FAITE** (l'entrée était marquée *à vérifier*) : la règle **est déjà écrite au `01-routeur.md` §8**, mot pour mot, avec sa raison — « sans unité écrite, la comparaison se ferait à l'œil et ne laisserait aucune trace exploitable ». *Erreur de lecture rattrapée en séance : un premier grep avait paru dire le contraire, les trois motifs cherchés étant sur une même ligne très longue dont je n'avais lu que le début.* **Ce qui restait à décider — et qui est tranché ici : C3 en porte l'unité, en une phrase et non en copie.** *Motif : aucun lot de C4/C5/C6 ne construit la mise en regard — l'argument R4 ne joue pas — mais le §4 est le lieu où l'ancre aveugle est définie, et le §10 point 10 la cite comme **seule parade** au risque que la mesure devienne un objectif. Un dispositif défini sans son unité de mesure se lit comme une intention.* | §4 | **(a)** |
| **03/08/2026** | Relevé d'arbitrage du 30/07, angle mort G1 — passe de mise en cohérence, chapitre 0, entrée 16 | **A36 — le retour de Monitoring nomme la DIMENSION, jamais la grille.** Il **ne révèle aucun observable**, mais dit **où** porte l'écart, en langage pédagogique : « tu t'es jugé plus sûr que tu ne l'étais sur la **justification** de tes liens ». **Le conflit levé** : la règle du §5 (« le retour ne révèle jamais la grille complète ») et le Monitoring se détruisaient l'un l'autre — on demandait à l'élève de se calibrer sur un référent dont on lui cache les critères, et « surconfiant » était un verdict sur lequel il ne pouvait rien ; l'asymétrie actée au `00-referentiel.md` §2 faisait de cette impasse le cas qui déclenche **le plus** d'action. **Écarté, avec sa raison** : révéler les observables après la version finale — sur l'année, l'élève finirait par connaître les grilles. **DÉPENDANCE DATÉE, avant les écrans du lot C4-L3** : une correspondance **observable → formulation pédagogique**, qui rejoint les « attendus du retour » de la fiche de type (`02-exercices.md` §1) — *sans elle la règle est inapplicable, il n'y a rien à dire à l'élève*. **Vérifié : aucune ligne à ajouter au §9** — le manifeste du lot C4-L3 porte déjà `§5`, contrairement au cas d'A28 où le §2 manquait | §5 | **(a)** |
| **03/08/2026** | Relevé d'arbitrage du 30/07, item F8 — passe de mise en cohérence, chapitre 0, entrée 18 | **A37 — les deux sous-dimensions du Monitoring n'ont pas la même forme, et `lucidite_incompris` devient un TAUX SUR FENÊTRE.** `monitoring_niveaux` portait `amplitude_courante` et `direction_courante` **pour les deux sous-dimensions indifféremment** ; elles ne valent désormais que pour **`calibration_confiance`**. La lucidité reçoit **`taux_lucidite`** et **`n_fenetre`** — *parmi les exercices de la fenêtre où le squelette montre un échec sur au moins un observable, dans combien l'élève a-t-il signalé un incompris ou marqué une hypothèse ?* **Motif** : la direction vaut « surconfiance / sous-confiance » et n'a **aucun sens** appliquée à « l'élève a-t-il signalé ce qu'il n'a pas compris » — le champ serait **structurellement vide**, ce qu'A8 refusait précisément en créant des tables propres ; et un booléen ne montrerait aucun progrès. **`n_fenetre` = 0 ⇒ `taux_lucidite` NULL, jamais 0** : le dénominateur restreint désamorce l'artefact de l'élève qui lisse tout — n'ayant rien raté, il obtient NULL et non un mauvais score. **VÉRIFICATION FAITE AVANT RÉDACTION** : la décision est déjà écrite en toutes lettres au **`01-routeur.md` §3** et au **`00-referentiel.md` §2 et §3** — **c'est C3 seul qui ne l'avait pas**, et il la lui faut au titre de R4 (une session Code ne lit que C3 plus la section de son lot). **Aucun champ neuf sur `monitoring_mesures`** : le numérateur se lit aux observables `aveu_incomprehension` et `marquage_supposition` déjà portés par son JSONB, le dénominateur aux mesures du même dépôt — *dérivation plutôt que déclaration*. **DEUXIÈME ENDROIT DU MÊME DÉFAUT, CORRIGÉ DANS LA MÊME PASSE** *(règle de conduite de Louis du 02/08)* : le `01-routeur.md` §3 **se contredisait à deux lignes d'écart** — sa ligne 192 disait encore « la lucidité se lit en présent/absent », vieille rédaction restée sur place quand F8 a corrigé la ligne 197. **TROU LAISSÉ OUVERT, `[à valider]` → chapitre 5** : la **longueur de la fenêtre** n'est fixée nulle part — ni dans C3, ni au §3 du routeur, ni au registre des paramètres du §11 —, et un lot ne peut pas calculer le taux sans elle. **DATÉ : avant que C4-L1 crée les tables** | §6 (`monitoring_niveaux`), et `01-routeur.md` §3 | **(a)** |
| **03/08/2026** | Décision de nommage de Louis — passe de mise en cohérence, chapitre 0, séance 3 | **A38 — `marquage_hypothese` devient `marquage_supposition`.** **Motif** : collision de sujets. **`hypothetique`** est une valeur du **statut d'énonciation** — elle dit que **l'AUTEUR** avance quelque chose en hypothèse ; **`marquage_hypothese`** disait que **L'ÉLÈVE** avance sa lecture en hypothèse. *Deux hypothèses, deux sujets, et les deux seront présentes dans le même exercice.* **`marquage_supposition` a zéro collision dans tout le chantier** et **garde la promesse binaire** du champ (`distingue` / `tout_assertif`) — *`marquage_probabilite`, examiné le 02/08, a été écarté : il promet un nombre là où le champ rend un booléen.* **PRÉCISION DE DATE, VÉRIFIÉE SUR PIÈCES** : le candidat avait été retenu en discussion le 02/08 mais **non acté** — le `00-referentiel.md` §3 écrivait « le nom n'est PAS tranché », et `marquage_supposition` n'apparaissait dans **aucun** fichier du chantier. **C'est donc une décision du 03/08.** **Propagation faite en un bloc, 14 occurrences dans les six documents du périmètre** : C3 (4, dont `monitoring_mesures.observables` au §6) · `00-referentiel.md` (6) · `04-competences-lecture.md` (2) · `01-routeur.md` (1) · `02-exercices.md` (1). *Trois paragraphes du `00-referentiel.md` §3 ont été **réécrits à la main** et non renommés : ils discutaient le nommage, et un remplacement aveugle y aurait décrit une collision que le renommage supprime.* **CONSÉQUENCE DURE, NON RÉSOLUE ET DATÉE PAR LE BANC DU 24/08** : le **prompt P1 réel** (`competences-lecture/prompts-inventaire.md`, hors périmètre) porte encore l'ancien nom — **tant qu'il n'est pas repris, le champ extrait et le champ spécifié ne portent pas le même nom**. → liste de propagation, item 6 | §6 (`monitoring_mesures`), et les cinq sources | **(a)** |
| **03/08/2026** | Relevé d'arbitrage du 30/07, item F19 — passe de mise en cohérence, chapitre 0, entrée 19 | **A39 — `competences_niveaux.lettre` devient NULLABLE, et l'absence de lettre reçoit sa règle.** **Une compétence sans lettre n'est ni ciblable, ni sondable, ni plafonnée, et n'entre dans aucun départage.** **Deux causes connues** : un élève **inscrit tardivement** ; et, tant que le **pont E→A** n'est pas validé, la passation a lieu, les champs extraits sont conservés au journal, **aucun niveau n'est produit**, et le niveau **se calcule rétroactivement sur des seuils observés**. *Motif de F19 : une règle actée consommait, dès la semaine 1, un instrument que le `00-referentiel.md` §5 déclare lui-même « pis-aller assumé […] marqué [à valider] » — et ces niveaux auraient fixé le plafond d'inflation pour tout l'automne, le diagnostic d'un élève présent **étant** une ancre (F10).* **VÉRIFICATION FAITE** : la règle est **déjà écrite au `01-routeur.md` §3**, ligne `lettre` du tableau des champs — **C3 seul ne l'avait pas**, et il la lui faut au titre de R4. **Pourquoi C3 et pas seulement le routeur** : *R1, R2 et son départage, R3, le seuil du Questionnement, la table des proportions, le cran de la couche 3, le plafond et la descente **lisent tous une lettre**, et aucun ne prévoyait qu'elle puisse manquer* — alors que la discipline inverse, « NULL n'est pas 0 », est posée ailleurs dans les deux documents. **PÉRIMÈTRE RENVOYÉ À L'ENTRÉE 29** : la formulation de F19, « `lettre = NULL` sur les **cinq compétences de lecture** », est périmée — il n'y a plus de compétences de lecture. La cause est inscrite, son périmètre exact se réécrit au groupe 17 + 28 + 29. **DEUXIÈME ENDROIT DU MÊME DÉFAUT, NON CORRIGÉ ET ANNOTÉ** *(application de la quatrième convention de la passe)* : le même bloc `competences_niveaux` écrit « les deux parcours ont les **dix** compétences » — périmé, mais c'est l'objet propre de l'**entrée 29**, donc annoté plutôt que corrigé deux fois. **DATÉ : avant C4-L1** | §6 (`competences_niveaux`) | **(a)** |
| **03/08/2026** | Relevé d'arbitrage du 30/07, item F21 — passe de mise en cohérence, chapitre 0, entrée 20 | **A40 — le coût se journalise par APPEL et par PHASE, et `cout_api` disparaît de `exercices_squelettes`.** Chaque appel journalise sa **phase** (`p1` \| `p2` \| `retour`), son **modèle** et ses **tokens** ; **l'agrégation par élève, par type et par cycle se fait en requête**. *Motif de F21 : les règles actées le 29/07 — plafond mensuel, alerte à 70 %, coupure automatique, plafond d'appels par dépôt — disent **combien** on dépense ; rien ne disait **où**.* **LE SYSTÈME TENAIT DÉJÀ LA MOITIÉ DE LA RÉPONSE, vérifié sur le SQL** : le journal transverse `api_couts` (C11a, joué en sandbox le 26/07) porte **déjà** `modele` et **quatre compteurs de tokens** — entrée, sortie, cache en lecture, cache en écriture —, plus l'attribution `eleve_id` / `classe_id` ajoutée par C11a-bis. **Il ne lui manque que deux choses** : la **`phase`**, et le **rattachement à l'exercice** (`depot_id`, `competence`, `version`) — sans `depot_id`, on ne peut remonter ni au type ni au cycle, et l'agrégation que F21 demande est impossible. *Tous nullables, best-effort, selon la doctrine déjà écrite de la table : un coût non attribuable reste une ligne valide.* **SUPPRESSION DE CHAMP TRANCHÉE PAR LOUIS EN SÉANCE** : `cout_api` **est retiré** de `exercices_squelettes` — une fois le journal par appel en place, c'est une somme recopiée, et *« deux copies d'un même chiffre finissent par diverger »*, la règle même qu'A17 avait appliquée aux paramètres. **Aucun autre endroit de C3 ne le lisait** *(vérifié : une seule occurrence, plus une mention générique au §9)*. **Les deux temps de CODE de la chaîne en quatre temps (A20) ne journalisent rien — ce ne sont pas des appels.** **HORS PÉRIMÈTRE, à la liste de propagation (item 8)** : `c11a_api_couts.sql` étant **déjà joué en sandbox**, l'ajout de colonnes est une **migration additive** à inscrire au `SUIVI_SQL` avant exécution — et non plus l'édition d'un fichier jamais joué, comme l'avait été C11a-bis. **DATÉ : avant C4-L1** | §6 (`exercices_squelettes`, et le journal `api_couts`) | **(a)** |
| **03/08/2026** | Relevé d'arbitrage du 30/07, angle mort G4 — passe de mise en cohérence, chapitre 0, entrée 21 | **A41 — C3 §6 héberge l'état du routeur, et la table `competences_escalade` est créée.** **VÉRIFICATION FAITE, et elle renverse l'entrée** *(marquée « à vérifier »)* : la **règle** de G4 — chaque dossier N3 porte sa date d'ouverture, et remonte en tête de l'écran professeur passé N semaines sans traitement — est **entièrement écrite au `01-routeur.md` §6**, et **aucun lot de C4/C5/C6 ne construit cet écran** ; l'argument R4 qui justifiait A24, A37 et A39 ne joue donc pas, le manifeste de C4-L2 incluant explicitement le routeur. **Ce qui manquait n'était pas la règle : c'était l'endroit où poser la date.** **LE TROU RÉEL, TROUVÉ EN VÉRIFIANT** : le `01-routeur.md` §2 nomme lui-même le « domaine partagé du profil » — `competences_niveaux`, `competences_mesures`, `competences_actives_par_classe` —, **qui sont des tables de C3 §6** ; et son §3 y déclare **trois champs stockés qui n'ont aucune colonne dans C3** : `etat_escalade`, `historique_cibles` et `registre_retour` *(vérifié : zéro occurrence des trois dans C3)*. **Le lot C4-L1 crée « toutes les tables du §6 » — il n'en aurait créé aucune, puis C4-L2 aurait implémenté l'escalade sur un état inexistant en base.** **PRINCIPE ACTÉ PAR LOUIS** : *« c'est mûr »* — **C3 §6 héberge l'état, le routeur reste le domicile des règles qui le lisent.** **Table `competences_escalade`**, clé **(élève × compétence × observable)** — *l'escalade est indexée par observable* —, champs `cran` (`N1` \| `N2` \| `N3`), **`entre_n1_at`** *(lue par une règle : la double condition de N3 exige « au moins X semaines depuis l'entrée en N1 »)*, **`n3_ouvert_at`**, **`n3_traite_at`** NULLABLE, `updated_at`. **`registre_retour` ENTRE DANS LE MÊME AMENDEMENT** *(convention de Louis du 02/08 : le même défaut trouvé ailleurs se corrige dans la même passe, sauf s'il a déjà son entrée — celui-ci n'en a pas ; précédent d'A22)* : colonne sur `competences_niveaux`, **à ne pas confondre avec `exercices_retours.registre`** — *ici c'est l'état, là c'est la trace*. **Le troisième champ, `historique_cibles`, est traité à part en A42 : Louis l'a tranché DÉRIVÉ.** **DATÉ : avant C4-L1** | §6 (`competences_escalade` neuve, `competences_niveaux`) | **(a)** |
| **03/08/2026** | Relevé d'arbitrage du 30/07, item F11 — passe de mise en cohérence, chapitre 0, entrée 22 | **A42 — `historique_cibles` est DÉRIVÉ, et la clé `famille` de F11 devient une colonne de `routeur_decisions`.** **VÉRIFICATION FAITE** *(l'entrée était marquée « à vérifier », et la liste la donnait pour « le point le plus douteux »)* : `historique_cibles` **n'apparaît nulle part dans C3** — zéro occurrence. **ARBITRAGE DE LOUIS : dérivé.** *Motif : C3 §6 déclare déjà `routeur_decisions`, le journal du routeur, qui porte « élève, slot, **cible**, règle déclenchée, alternatives écartées » — un journal qui porte déjà la cible n'a pas besoin d'une seconde liste des mêmes cibles.* **C'est exactement le geste que le routeur a fait sur lui-même le 30/07** en supprimant son champ `evidence` stocké : *« la table `competences_mesures` **est** le journal complet des mesures ; stocker une seconde copie, c'est fabriquer deux sources »*. **CE QUE F11 DEMANDAIT SURVIT, DÉPLACÉ** : la clé `famille` devient une **colonne de `routeur_decisions`** — sans elle, R5 (contrainte de couverture comptée au sein de chaque famille) est **inerte dès qu'un cycle mêle les deux**. *Ce n'est pas une redite du `famille` de `competences_mesures` : là c'est la famille d'une **mesure obtenue**, ici celle d'une **décision prise** — la distinction état / trace que le routeur §3 pose lui-même entre `registre_retour` et `exercices_retours.registre`.* **LE ROUTEUR RÉALIGNÉ DANS LA MÊME PASSE, sur la demande permanente de Louis** *(« réaligne tout de suite »)* — **deux endroits** : son **§3** où `historique_cibles` passe de `stocké` à `dérivé — jamais stocké`, et sa règle **R5 au §5**, dont la parenthèse « clé `famille` sur `historique_cibles` » devient « la `famille` portée par `routeur_decisions` ». **SIGNALÉ, NON TRAITÉ → chapitre 2** : l'en-tête du `01-routeur.md` (l. 17) liste des « amendements C3 non encore posés » dont **sept le sont depuis ce matin** — en-tête devenu faux, pas défaut de construct | §6 (`routeur_decisions`), et `01-routeur.md` §3 et §5 | **(a)** |
| **03/08/2026** | Chantier Structure, note du 31/07 (son A21) — passe de mise en cohérence, chapitre 0, entrée 23 | **A43 — la question du champ de dispersion est FERMÉE : il n'y en aura pas, et la raison est écrite.** **RÉGIME CHANGÉ EN SÉANCE, de (b) à (a), sur arbitrage de Louis** *(« ok pour 3 » — fermer plutôt qu'inscrire)* : l'entrée prévoyait une ouverture au tableau de bord B ; elle est close. **CE QUE LE PROBLÈME COÛTAIT VRAIMENT, ET IL FALLAIT LE NOMMER** : pas une note fausse — il n'y a pas de note — mais une **décision de routage fausse**. *Un élève à C reçoit C, B, B ; la règle de montée « 2 mesures améliorées sur les 3 dernières » le passe à B ; le routeur cesse de cibler la compétence. Or l'accord **exact** de l'instrument est à **55,6 %** (run Structure du 30/07) : les deux B pouvaient être des C. L'élève cesse de travailler ce qu'il n'a pas travaillé.* **POURQUOI UNE COLONNE NE LE RÉPARE PAS** : **la dispersion n'est pas une propriété de la mesure, c'est une propriété de l'instrument.** Un tirage unique ne peut pas déclarer sa propre instabilité — pour remplir la colonne il faudrait **répliquer en production**, alors que le §0 ne prévoit qu'un appel P1/P2 par compétence : la colonne serait vide, ou doublerait la facture. **ET LE SYSTÈME TIENT DÉJÀ LA RÉPONSE** : `competences_mesures` porte **`instrument_version`**, et le banc de recette mesure l'accord de cette version — le lien existe, aucune colonne à ajouter. **TROIS AMORTISSEURS DE BRUIT SONT DÉJÀ ACTÉS** *(juillet)* : la montée se fait sur **2 mesures sur 3**, la **descente par les ancres seules** (`lieu` = `classe` **et** `forme` = `sommatif` — haute validité, **A54**), et le **plafond ancre + 2** borne la dérive de la trajectoire. **CE QUI RESTE VRAI ET N'EST PAS UN AMENDEMENT** : la question « avec l'accord réel de cet instrument, combien de fausses montées la règle 2-sur-3 laisse-t-elle passer ? » — *elle se simule sur les données du banc, sans toucher au schéma ; si le chiffre est mauvais, ce qui bouge est la **règle** (3 sur 4, ou une ancre obligatoire avant montée), pas une colonne.* **Fermeture écrite au §6 pour qu'une session ultérieure ne rouvre pas la question** — la règle seule, non le récit | §6 (`competences_mesures`) | **(a)** *(l'entrée était classée (b))* |
| **03/08/2026** | Relevé d'arbitrage du 30/07, item F8 volet 2 — passe de mise en cohérence, chapitre 0, entrée 24 | **A44 — la table de conversion vers l'amplitude 0-3 est un TROU DÉCLARÉ, avec sa condition de fermeture.** Elle **s'écrit après collecte**, sur des seuils **observés** ; d'ici là **`amplitude_ecart` et `calibration` restent NULL**, et les **événements bruts se collectent dès le premier exercice de septembre** — *une année de collecte manquante ne se rattrape pas (A8)*. **Même discipline que les ancres de lecture et que F19 : collecter d'abord, convertir ensuite.** **Trois trous nommés qui restent** : la frontière entre amplitude 2 et 3 n'est pas dénombrable · la source globale n'a **aucune** correspondance vers 0-3 · rien ne dit comment les deux sources se combinent. **Condition de fermeture : l'existence de la collecte 2026-27.** **L'ouverture 21 est ÉTENDUE plutôt qu'une 24ᵉ créée** — elle portait déjà les deux sous-dimensions et le nombre de crans : *un contenu, un domicile*. **La source candidate du 02/08 y est inscrite avec son coût** : une **crédence chiffrée par hypothèse avancée** produit un écart dénombrable, mais elle alimente `confiance_declaree` et **non** la lucidité, et la solliciter **sature le taux de lucidité** (`marquage_supposition` devient vrai pour tout le monde). **ERREUR D'A37 RATTRAPÉE DANS LE MÊME AMENDEMENT, ET DITE EN SÉANCE** : le **§1 point 1** écrivait encore que « le Monitoring se lit en amplitude d'écart plus une direction » — vrai de la **`calibration_confiance` seule** depuis A37 ; la phrase est précisée, et la lucidité y est renvoyée au taux sur fenêtre. *A37 avait corrigé le §6 et manqué le §1.* **ANNOTÉ POUR L'ENTRÉE 29, non corrigé** : la même phrase dit « les **neuf autres** compétences et le Questionnement » | §1 point 1, §6 (`monitoring_mesures`), tableau de bord B (ouverture 21) | **(c)** |
| **03/08/2026** | Relevé d'arbitrage du 30/07, item F20 — passe de mise en cohérence, chapitre 0, entrée 25 | **A45 — le périmètre du multiplicateur X est rattaché explicitement à l'ouverture 8.** F20 est **différé** — il se tranche **avec le régime de modèle**, décision de Louis du 30/07 — **mais il cesse d'être invisible**. *La question n'était posée nulle part, alors que le §8 du `01-routeur.md` réserve les multi-appels « aux diagnostics » puis énumère « Trois diagnostics en classe » **et** « Les DS de classe » dans la même liste d'ancres.* **Les deux ordres de grandeur sont inscrits** : **4 620 × X** appels si X ne porte que sur les trois diagnostics annuels, **7 700 × X** s'il porte sur toute la cadence d'ancre — **9 240 d'écart à X = 3, 15 400 à X = 5**. *Enjeu : ce sont les appels les plus chers du dispositif, les seuls sur le modèle fort et sur des textes au format complet.* ⚠️ **RÉSERVE TROUVÉE EN VÉRIFIANT, ET C'EST LE MÊME DÉFAUT QU'A22** : le relevé F20 note lui-même que « **11 compétences** est le maximum, celui du tronc commun » — **il y en a six** depuis le 02/08. Les deux ordres de grandeur sont donc **calculés sur un construct périmé et surestimés** ; **le recalcul appartient à l'entrée 29**, la réserve est inscrite avec eux. *Ils gardent leur usage — situer l'écart entre les deux lectures — mais **aucune règle ne doit s'y appuyer**, ce qu'A21 a posé pour toute cette famille d'estimations.* **Aucun effet de schéma, un seul endroit touché** | tableau de bord B (ouverture 8) | **(b)** |
| **03/08/2026** | Relevé d'arbitrage du 30/07, item F4 — passe de mise en cohérence, chapitre 0, entrée 26 | **A46 — le pipeline de sélection reçoit une branche d'échec, et la question F4 devient un trou déclaré.** **VÉRIFICATION FAITE** *(l'entrée était marquée « à vérifier »)* : le pipeline du `01-routeur.md` §5 enchaîne R0, le filtre N3, R1, R2, R5 puis les couches 3 et 4 — **aucune branche pour le cas où rien ne sort** ; C3 ne décrit pas ce pipeline du tout. *Avec 2 à 4 types par compétence, le cas se présentera : il suffit qu'aucun ne porte l'observable visé.* **CE QUE LA VÉRIFICATION A RAPPORTÉ EN PLUS** : `02-exercices.md` — le document le plus à jour — **a déjà nommé la condition de fermeture** : la question « se referme quand la table remplie dira à **quelle fréquence** le cas se présente ». *On ne peut pas choisir la politique avant de savoir si le cas tombe une fois par an ou une fois par semaine.* **RÉGIME REQUALIFIÉ, de (b) à (c)** — trou déclaré avec sa condition de fermeture, comme A26 l'a fait le même jour pour A6. **ARBITRAGE DE LOUIS : la clause de repli est écrite, provisoire** *(« go pour 2 »)* — **si aucun type ne porte l'observable visé, N1 dégrade en retour mono-focal sur le type courant et journalise `degrade`** ; la branche 3 de N2 y retombe de même. *Motif : **C4-L2 doit être écrit avant le 25 août** et implémente ce pipeline — sans branche, une session Code en invente une ou le pipeline s'arrête sur son premier cas.* **ÉCRIRE LA CLAUSE N'EST PAS TRANCHER F4** : F4 demande ce qu'il **faudrait** faire, la clause dit ce qui se passe **en attendant** — et **le drapeau `degrade` est précisément ce qui refermera F4**, le compteur tournant dès septembre. **Domicile respecté** : la clause va au **`01-routeur.md` §5**, domicile du pipeline ; C3 porte le trou déclaré à l'**ouverture 24** | tableau de bord B (ouverture 24), et `01-routeur.md` §5 | **(c)** *(l'entrée était classée (b))* |
| **03/08/2026** | Relevé d'arbitrage du 30/07, item F7 volet 2 — passe de mise en cohérence, chapitre 0, entrée 27 | **A47 — les deux gardiens du seuil du Questionnement sont Argumentation et Structure DES DEUX CÔTÉS : la question est close, et C3 n'a rien à écrire.** **VÉRIFICATION FAITE SUR PIÈCES** *(l'entrée portait un avertissement : « elle repose peut-être sur le même motif mort que l'entrée 3 — non vérifié »)*, **et elle donne deux résultats.** **(1) La question EST close** : `02-exercices.md` écrit que « F7 volet 2 demandait de nommer les deux gardiens côté lecture, les candidates étant Restitution et Reconstruction — **les gardiens sont Argumentation et Structure des deux côtés**, la question dissout ». *Raison : Restitution et Reconstruction ne sont plus des compétences depuis le 02/08, ce sont des **modes** ; les six compétences traversent les deux familles, il n'y a donc qu'un seul jeu de gardiens.* **L'échéance de l'entrée meurt du même coup** — « avant l'allumage, le coût du report est nul, aucune compétence de lecture ne devant être `evaluee` » : il n'y a plus de compétences de lecture. **(2) LA PRÉMISSE DE L'ENTRÉE SUR C3 EST FAUSSE** : elle écrivait « C3 §1.7 et §4 portent le seuil sans en nommer le domaine ». **C3 ne porte pas le seuil du tout** — zéro occurrence de « corps du devoir » comme de « seuil d'entrée ». *Et ce n'était pas neuf : **A19 l'avait déjà vérifié le 30/07** (« C3 ne cite pas le seuil d'entrée du Questionnement — rien à mettre à jour de ce côté »).* **AUCUNE ÉCRITURE DANS LE CORPS DE C3**, comme A19 et A35. **CE QUI ÉTAIT RÉELLEMENT DÛ, ET QUI EST FAIT : le `01-routeur.md` §5, sous R2, déclarait encore la dépendance OUVERTE.** Écart entre deux sources, tranché sans présomption — `02-exercices.md` (02/08) **ferme** ce que le routeur (30/07) laissait ouvert —, et c'est le routeur qu'une session Code lit, son manifeste étant au lot C4-L2. **RÉGIME CHANGÉ, de (b) à (a)**, comme A27 le même jour : l'entrée prévoyait d'inscrire une question ouverte, elle est fermée | aucun — vérification ; `01-routeur.md` §5 (R2) | **(a)** *(l'entrée était classée (b))* |
| **03/08/2026** | Session dédiée « Questionnement ↔ Monitoring » du 02/08 — passe de mise en cohérence, chapitre 0, entrée 30 | **A48 — le format de la référence décomposée doit porter les LECTURES DÉFENDABLES et leur vraisemblance relative.** **Le problème, et il est dur** : **P2 juge depuis le squelette contre la référence**. Si un passage admet deux lectures et que la référence n'en porte qu'une, **l'élève ayant choisi la seconde est compté en contresens** — *l'exercice punirait exactement ce qu'il prétend récompenser*. **Ce qu'il faut** : les lectures défendables et leur **vraisemblance relative**, non un drapeau « ambigu ». *Forme suggérée, non actée, retenue par Louis (« c'est celle que j'imaginais ») : un **enum** — `lecture unique` / `n lectures équiprobables` / `une dominante et une secondaire` — dont la **crédence cible se dérive**.* **NI OBJET, NI ATTRIBUT DE CONTRAT, NI TYPE NOUVEAU** : « la phrase » ou « le paragraphe » en mode `expliquer`, à un cran de production, avec l'habillage « lecture calibrée » — **l'exercice existe, le manque est dans le format du matériau**. *Même forme et même raison que l'exigence (4) du §7 de `02-exercices.md`, le statut d'énonciation : c'est une propriété du **matériau**, pas du **type**.* **Ce que ça débloque** : l'« hypothèse d'interprétation avec son degré de vraisemblance », **seul manque du groupe 2 du rapport de validation qui ne se dérivait pas**. **VÉRIFICATION QUI A CHANGÉ LES DESTINATIONS** : l'entrée n'annonçait que `02-exercices.md` (§7 et §1). Or **le lot C5-L1 n'a pas de manifeste** au §9, contrairement aux lots C4 — **la règle R4 s'applique donc en plein** (« ce fichier + la section du lot, rien de plus »), et **une session C5-L1 ne lirait jamais `02-exercices.md`**. *Même cas qu'A20, où la description du lot C4-L5 ne portait pas les deux temps de code.* **Trois endroits écrits** : `02-exercices.md` §7, **exigence (6)** — son domicile, son titre passant de « les **deux** exigences ouvertes par la séance 4 » à « les exigences ouvertes par les séances du 2 août » · **C3 §6** (`exercices_references`, le trou déclaré) · **C3 §9, lot C5-L1** (la ligne que R4 exige). *Première fois que la passe **ajoute** du contenu à `02-exercices.md` — les quatre interventions antérieures, toutes au `01-routeur.md`, étaient des réalignements.* **Condition de fermeture : l'écriture du format. Échéance : avant C5-L1** | §6 (`exercices_references`), §9 (lot C5-L1), et `02-exercices.md` §7 | **(c)** |
| **03/08/2026** | Révision de `02-exercices.md` (séances 1 à 4, 31/07 – 02/08) — passe de mise en cohérence, chapitre 0, **entrée 17**, groupe 17+28+29 | **A49 — le contrat des types est refondu, et le bloc `exercices_types` est régénéré EN ENTIER.** **RELEVÉ MÉCANIQUE FAIT AVANT RÉDACTION, et il corrige le compte qui circulait** : le « bilan » de la liste d'amendements annonçait **deux** attributs ajoutés (`provenance_materiau`, `modes[]`) — c'était l'écart au **gabarit de `02-exercices.md`**, non à C3. Face au schéma, il y en a **six**. **CRÉÉS** : `couverture_observables` (par **cran × compétence × observable**, `exerce`|`isole`|`observable_seul`) · `exclusions_parcours[]` · `crans[]` (les sept de l'échelle d'autonomie) · `provenance_materiau` · `modes[]` · `support` *(minuscule — il était le seul attribut à porter une majuscule)*. **DEUX AXES DE DÉCLARATION IMBRIQUÉS, écrits pour la première fois** : **par cran** (`duree_exercice_min`, `couverture_observables`, `provenance_materiau`) et **par compétence** (`modes[]`). *Sans eux, C4-L1 crée une table plate et les décisions des 31/07 et 02/08 deviennent inécrivables ; la forme physique — JSONB ou table fille — reste au choix de la session Code.* **DÉRIVÉS, plus de colonne** : `regime_v1vf` (du cran) et la **largeur de mesure** (du couple `grain`, `cran`). **FONDUS** : `competence_primaire` + `competences_secondaires[]` → **`competences[]`**, d'où le pool de la mesure secondaire réaligné en « `competences[]` moins la cible ». **SIX ATTRIBUTS INSCRITS COMME NON CRÉÉS**, pour qu'une session ne les cherche pas. **UN OBJET PARTAGÉ PREND UNE SEULE LIGNE** *(décision de Louis)* — *la question « une ligne ou deux », ouverte le 01/08, ne se posait que parce que la ligne portait une `famille` déclarée.* **LE TROU LE PLUS LOURD DE LA SÉANCE, TROUVÉ EN VÉRIFIANT** : `exercices` — les instances conçues — **ne portait AUCUNE des valeurs élues**. Sans le cran élu, le `regime_v1vf` de l'exercice, la durée à décompter, la `couverture_observables` applicable *(donc le candidat que N1 cherche)* et toute la règle de montée sont **incalculables**. **Trois colonnes ajoutées** : `cran`, `provenance_materiau`, `support`. *Les modes élus ne sont pas repris : `competences_mesures.mode` en est déjà la trace — geste d'A42.* **RENOMMAGE DE COLLISION** *(décision de Louis)* : `competences_escalade.cran` devient **`cran_escalade`**, `cran` seul désignant désormais le cran d'autonomie. *Deux « cran » dans le même §6 auraient refait une confusion que les interdits de la passe demandent de ne pas réintroduire — et celui d'A41 datait du matin même.* **DATÉ : avant C4-L1** | §0, §6 (`exercices_types` régénéré, `exercices`, `competences_escalade`) | **(a)** |
| **03/08/2026** | Révision de `02-exercices.md`, séance 2 (01/08) — passe de mise en cohérence, chapitre 0, **entrée 28**, groupe 17+28+29 | **A50 — la règle de montée devient exécutable : la table des proportions change de forme, un état de progression naît, les sondes se marquent.** **(1)** La **table des proportions** distribuait sur le grain seul par (segment × niveau) ; elle distribue désormais sur le **couple (`grain`, `cran`)**. *Décision liée : le `grain` cesse d'être indexé sur le niveau — le **cran porte la difficulté**, le **grain porte la charge**.* **(2)** Table neuve **`competences_montee`**, clé **(élève × compétence × grain)**, champs **`cran_atteint`** et `updated_at` — *forme retenue plutôt que trois colonnes `cran_atteint_micro`/`_meso`/`_macro`, qui graveraient l'énuméré des grains dans des noms de colonnes*. **Tout le reste se dérive**, et **la distribution ne se stocke jamais**. Règle de prérequis écrite : *on ne monte au grain supérieur qu'après avoir atteint le cran au grain inférieur*. **(3)** **`sonde_montee`** booléen sur `competences_mesures` : une mesure de sonde **ne compte ni dans la fenêtre d'acquisition, ni dans la stagnation**. *Sans lui, la sonde étant au-dessus du niveau de l'élève, deux échecs dans une fenêtre de quatre font tomber un observable sous les 2/3 — et **N1 se déclencherait sur un élève qui progresse**. C'est l'arbitrage F2 pris en sens inverse : « sonder n'est pas mesurer ».* **VÉRIFICATION FAITE, ET ELLE CONFIRME L'ENTRÉE PLUTÔT QU'ELLE NE LA DÉFAIT** : le trou d'`exercices` comblé par A49, l'état de montée devenait **calculable** depuis le journal — la question de le dériver s'est donc posée pour de bon. **Elle est tranchée non** : c'est un **ÉTAT**, pas une trace ; recalculé, un changement d'`instrument_version` ou une mesure requalifiée ferait **redescendre** un élève sans que personne ne l'ait décidé. *C'est la distinction état / trace que le `01-routeur.md` §3 pose lui-même, et la raison pour laquelle A42 a pu, lui, dériver `historique_cibles`.* **Origine de la règle, à ne pas perdre** — objection de Louis : *« on ne peut pas réellement penser qu'un élève à D qui n'a que des exercices de crans 1 à 4 va progresser ; il faut qu'il produise de l'autonome. »* **DATÉ : avant que C4-L1 tourne** | §4, §6 (`competences_montee` neuve, `competences_mesures`) | **(a)** |
| **03/08/2026** | Révision de `02-exercices.md`, séances 3 et 4 (02/08) et session dédiée « Questionnement ↔ Monitoring » — passe de mise en cohérence, chapitre 0, **entrée 29**, groupe 17+28+29 | **A51 — les compétences de lecture disparaissent : SIX compétences, un axe `modes[]`, une `famille` dérivée.** Restitution, Reconstruction et Évaluation deviennent les **modes** `restituer`, `expliquer`, `évaluer` ; **Mouvement est la Structure en mode `expliquer`**. `competences_niveaux` passe à **six** lignes ; `competences_mesures` gagne **`mode` (une LISTE)** et **perd `famille`**, qui se dérive — *`composer` parmi les modes élus → `composition`, sinon → `reception`*. **SIX IDENTIFIANTS NUS** *(décision de Louis)* — `expression`, `argumentation`, `structure`, `connaissance`, `synthese`, `questionnement` : le préfixe `ecriture.` / `lecture.` disparaît, A1 ayant déjà constaté qu'il ne portait plus l'identité de la compétence. **LE §1 POINT 4 NE PORTE PLUS DEUX NOMBRES, MAIS DEUX LISTES (compétence × mode)** *(décision de Louis ; ferme le [à valider] d'A22)*, identiques en TC et en HLP : **l'essai** mesure Expression, Argumentation et Structure, **les trois en `composer`** ; **l'explication de texte** mesure Expression en `composer`, Argumentation en `expliquer`, Structure en `expliquer` et **Synthèse en `restituer`**. **La Connaissance et le Questionnement n'y sont mesurés nulle part.** **CE QUI REFERME LE PÉRIMÈTRE LAISSÉ OUVERT PAR A39** : les compétences sans lettre au sortir de la semaine 1 sont donc la **Connaissance** et le **Questionnement** — non plus « les cinq compétences de lecture ». **Par où chacune entre** *(décision de Louis)* : la **Connaissance** est hors rayon (R4, jamais cible primaire ; son signal continu est **Quazian**, qui n'écrit pas dans le profil) ; le **Questionnement entre par le segment 2**, les trois semaines de **calibration**, où R2 est suspendue au profit de la couverture. *Vérifié sur pièces au `01-routeur.md` §4, §5 et §11.* **Réserve inscrite** : le seuil de couverture du segment 2 est écrit « par compétence `evaluee` », statut que le Questionnement n'aura pas à la rentrée — le point rejoint le régime du statut `differee`, au chapitre 5. **`competences_actives_par_classe` : on renomme et on dérive** *(décision de Louis)* — la clé reste **(classe, compétence, famille)**, une **déclaration du professeur**, dont les valeurs deviennent `composition` et `reception` ; la famille d'une **mesure**, elle, reste dérivée. **LE MANIFESTE DU LOT C5-L3 EST RÉÉCRIT** — il annonçait « P1/P2 des **cinq compétences** », instruments qui n'existent plus ; il annonce désormais **« les compétences dont la grille réceptive existe »** *(formulation choisie par Louis : elle se remplit d'elle-même)*, **un instrument par compétence et non par (compétence × mode)**, `statut_recette` restant sur la compétence (F3). **DEUX RECALCULS MÉCANIQUES QUE LE PARTAGE DÉBLOQUE** : le §10 point 2 passe de 1 540 à **980 appels** en semaine 1 ; l'ouverture 8 passe de **4 620 / 7 700 × X** à **2 940 / 4 900 × X** — *les anciens chiffres étaient bâtis sur les onze couples du « (6+5) », il y en a sept ; hypothèse conservée : les diagnostics de décembre et de février/mars portent le même partage, leurs formats restant [à valider]*. **CINQ ENDROITS PÉRIMÉS TROUVÉS EN PLUS DES SIX ANNOTATIONS ATTENDUES**, et le périmètre a été étendu par Louis pour les inclure : le §0 « Sources de vérité » (deux entrées) · le §1 point 1 (« HLP a les dix compétences, pas neuf ») · le §4bis Budgets · `competences_mesures` (« dix en tout ») · **le §9, manifeste du lot C5-L3**. *Les deux derniers ne sont pas de la formulation : l'un est le seed que C4-L1 écrit en base, l'autre ce qu'une session Code lit pour savoir quoi construire.* **DATÉ : avant que C4-L1 tourne** | en-tête, §0, §1 points 1 et 4, §4, §4bis, §6 (`competences_mesures`, `competences_niveaux`, `exercices`), §9 (C5-L3), §10, ouverture 8 | **(a)** |

> **Conséquence de manifeste — à traiter avant le prochain lot Code.** Les amendements **A1** et **A3** touchent le **schéma** du §6 : la clé de `competences_actives_par_classe`, les identifiants de compétence, l'ajout de `famille` et la nullabilité de `classe_id` sur `competences_mesures`. Or `PROMPT_Code_C4_L1.md` et `PROMPT_Code_C4_L2.md` ont été déposés le 29/07 **contre le socle non amendé (v4)** : **ils sont périmés** et doivent être réécrits avant lancement. **Depuis A7, le contrôle est mécanique** — un prompt qui exige une version antérieure s'arrête de lui-même ; cette note n'a plus à porter seule cette charge. **B1-7 étant tranchée par A8**, ils ont été **réécrits contre la v4.2** le 29/07 — manifeste, pièges de schéma et seed remis à jour. **Mise à jour du 30/07** : la spec passe en **v4.3** et les deux prompts exigent la v4.2 — ils sont donc de nouveau arrêtés d'eux-mêmes, et **A9** (renommages) comme **A14** (champ `genre`, ordre d'attribution du parcours) touchent leur §6. Mais **plus rien ne les attend** : B1-7 est fermée, le routeur est validé, le schéma est stabilisé. **Leur réécriture est lançable dès que Louis le décide** — elle n'a volontairement pas été faite dans la passe du 30/07.
| **03/08/2026** | Passe de mise en cohérence, **chapitre 1 (le vocabulaire)** — collision renvoyée ici par le journal du 03/08 : « *la collision se règle au chapitre 1 de la passe* » | **A52 — le mot « mode » ne nomme plus qu'une chose.** Deux colonnes du même schéma s'appelaient `mode` sans vouloir dire la même chose. **`exercices.mode` devient `contexte_passation`** — *cette spec écrivait déjà « un CONTEXTE, rien d'autre » : ce n'était pas un mode.* **`competences_mesures.mode` devient `modes`** — *c'est une **LISTE** ; le pluriel l'aligne sur `exercices_types.modes[]`.* **Le sens statistique est conservé** — le **mode des cinq tirages** du banc (`accord_modal`) —, avec son avertissement au §1.7. *Même geste qu'**A49** sur `competences_escalade.cran` → `cran_escalade`, et il était écrit **trois lignes plus bas** : la collision était dans le même paragraphe et est passée entre les mailles.* | §6 (`exercices`, `competences_mesures`), §1.7 | **(a)** |
| **03/08/2026** | Passe de mise en cohérence, chapitre 1 — **décision de Louis** | **A53 — le lieu de la mesure passe à DEUX valeurs, et `contexte` devient `lieu`.** `competences_mesures.contexte` et `monitoring_mesures.contexte` deviennent **`lieu`**, et l'énuméré `maison`|`classe`|`diagnostic`|`essai_fragments` devient **`maison`|`classe`**. **Raison de Louis** : *« toutes mes évals en classe sont des diagnostiques, et l'essai de Fragments est une éval en classe. Pas la peine de se casser la tête. »* — il n'y avait donc jamais eu quatre valeurs, il y en avait **deux, écrites quatre fois**. **Ce que le contrôle a rapporté** : la règle `derniere_ancre` du `01-routeur.md` §3 énumérait les trois valeurs d'ancre pour ne pas être « trop étroite » *(correction mécanique D-8, 30/07)* — elle redevient « le `lieu` vaut `classe` » et **couvre exactement le même ensemble** ; la correction D-8 devient sans objet. **Ce qu'on perd** : le **modèle de certitude cumulée** (« diagnostic > synthèse en classe > essai > maison ») ne pourra plus pondérer par ce champ — *il est déclaré « à l'étude, session dédiée », non acté*. **Ce qui part au tableau de bord B** : le déclencheur du lot **C6-L4**, qui lisait `contexte = essai_fragments`. | §6 (`competences_mesures`, `monitoring_mesures`), §3, §9 ; `00-referentiel.md` §6, `01-routeur.md` §3 | **(a)** + un trou déclaré |
| **03/08/2026** | Passe de mise en cohérence, chapitre 1 — **idée lancée par Louis**, vérifiée sur pièces avant écriture | **A54 — le lieu et la forme deviennent deux axes, et la définition de l'ANCRE se déplace.** *Point de départ de Louis : « on pourrait imaginer que je décide de faire des formatifs en classe et des diagnostiques à la maison ».* Un seul mot soudait deux choses. **Deux colonnes** : `exercices.contexte_passation` devient **`lieu`** (`maison`|`classe`, le lieu seul), et `competences_mesures` gagne **`forme`** (`formatif`|`sommatif`). **`sommatif` veut dire « la mesure compte pour le verdict »** — c'est le sens système, pas le sens didactique : les trois diagnostics en classe, les DS ingérés, la synthèse en classe et l'essai de Fragments en sont tous. **LA DÉFINITION DE L'ANCRE SE DÉPLACE, ET C'EST LE CŒUR DE L'AMENDEMENT** : une **ancre** est une mesure dont le `lieu` vaut `classe` **ET** la `forme` vaut `sommatif`. *Motif : le mot « ancre » est lu par **cinq** règles — descente, plafond ancre+2, cadence d'une ancre toutes les 6 semaines, drapeau de discordance, `derniere_ancre`. Ne faire lire `forme` qu'à la descente aurait fait dire à « ancre » deux choses selon la règle — la collision même que la passe répare.* **Son miroir** : le `01-routeur.md` §7 disait « **montée par le maison** », ce qui aurait exclu un formatif en classe de **tout** ; il dit désormais « **montée par la trajectoire** », la trajectoire étant **tout ce qui n'est pas une ancre**. *Les deux formulations coexistaient depuis juillet — le §0 de cette spec écrivait déjà « montée par la trajectoire ».* **CE QUE LE CONTRÔLE A ÉTABLI AVANT D'ÉCRIRE** *(la question de Louis était « est-ce que ça casse quelque chose ? »)* : *(1)* le **lieu ne peut pas quitter la mesure** — `competences_mesures.depot_id` est **nullable**, donc toutes les mesures ne remontent pas à un exercice ; *(2)* ce qui fait une ancre, c'est la **surveillance**, pas la note — la spec l'écrit quatre fois, « mesures en classe, **haute validité** » contre « exercices maison, **validité molle** » —, **donc un diagnostique à la maison ne serait pas une ancre** ; *(3)* le **pipeline d'entrée** (clavier contre manuscrit + photos + OCR) s'indexe sur le **lieu seul** — « le manuscrit + OCR est réservé aux passations en classe » —, il survit intact. **Ce que ça achète, en termes d'élève** : un **formatif passé en classe ne fait plus descendre une lettre**. C'est l'endroit où l'élève essaie et rate exprès ; l'y punir découragerait l'essai. | §0, §1, §4bis, §6 (`exercices`, `competences_mesures`) ; `01-routeur.md` §3, §7, §8, §9 ; `00-referentiel.md` §6 | **(a)** |

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
| 8 | **Le déclencheur du lot C6-L4** — l'essai de Fragments était reconnu par `contexte = essai_fragments`, valeur supprimée par **A53** le 03/08 | **Se dérive** : toutes les évaluations en classe sont des diagnostiques, et l'essai de Fragments est une évaluation en classe *(Louis, 03/08)* — la provenance se retrouvera par la chaîne du dépôt ou de l'exercice. **À spécifier au moment du lot, pas avant.** | C6-L4 |

**B2 — Décisions différées**

| # | Point ouvert | Échéance |
|---|---|---|
| 8 | **Régime de modèle** — Haiku-hebdo / Sonnet-ancres (D9 du 28/07). **Le plus gros levier de coût restant**. **ÉTENDUE LE 03/08 (A45 — F20) : le PÉRIMÈTRE DU MULTIPLICATEUR X des multi-appels se tranche ici, avec le régime de modèle.** Le §8 du `01-routeur.md` réserve les multi-appels « aux diagnostics », puis énumère « Trois diagnostics en classe » **et** « Les DS de classe » dans la même liste d'ancres — *la question n'était posée nulle part*. **Deux ordres de grandeur** : **2 940 × X** si X ne porte que sur les trois diagnostics annuels, **4 900 × X** s'il porte sur toute la cadence d'ancre — soit **5 880 appels d'écart à X = 3**, **9 800 à X = 5**. *Ce sont les appels les plus chers du dispositif : les seuls sur le modèle fort, et sur des textes au format complet.* ✅ **RECALCULÉS LE 03/08 (A51)**. Les chiffres antérieurs — **4 620** et **7 700** — étaient bâtis sur **onze** couples (compétence × passation), c'est-à-dire le « (6+5) » du §1 point 4. Le partage arrêté le 03/08 en compte **sept** : 70 élèves × 7 × 2 phases = **980 appels par diagnostic**, contre 1 540. *Hypothèse conservée de l'ancien calcul : les diagnostics de décembre et de février/mars portent le même partage — leurs formats sont **[à valider]** (B3-22).* Ils gardent leur usage — situer l'écart entre les deux lectures — **mais aucune règle ne doit s'y appuyer (A21)**. | avant la recette |
| 9 | **Modèle de certitude cumulée** (§4bis) — remplacerait la règle discrète « 2 sur 3 » | session dédiée ; le schéma supporte les deux |
| 10 | **Option Pangram** (§7) — détection externe, déclenchement manuel. Préalables : qualité sur le français, ajout à la liste des sous-traitants | post-rentrée recommandé |
| 11 | **Information aux parents** (§11) — pratique d'établissement, pas obligation légale | à confirmer par l'établissement, avant le 22/08 |
| 12 | **Retour éditable par le prof** (§3bis) — conserve-t-on la version originale de l'IA à côté de la version publiée ? | à l'implémentation de C4-L4 |
| 13 | **Recalibration du corpus de lecture** sur copies réelles | possibilité, pas jalon |
| ~~14~~ | ~~**A5 — R6 est à revoir**~~ **TRANCHÉ le 30/07 (A14)** — R6 réécrite en **règle d'observation** : les cibles disjointes TC/HLP sont dissoutes (flux, profil et budget uniques), et le drapeau « transfert » compare les mesures d'une même compétence **par genre d'exercice**, non par parcours. Voir `01-routeur.md` §5 et le §6 ci-dessous | *fermée* |
| 15 | **A6 — « voir un palier Acquis produit »** : **requalifié le 03/08 en TROU DÉCLARÉ, régime (c)** *(A26)*. La décision est prise — **on n'élargit pas la définition de la charnière pour fabriquer des Acquis** (Louis, 31/07) — et le jalon **n'est donc pas ajouté** au critère de recette du §1.7. Ce qui reste ouvert n'est plus une décision, c'est **une donnée** : sur les neuf copies du run Structure du 30/07, **six ne portent aucune charnière**, ce qui ferme le palier Acquis par construction sur les deux tiers du jeu | **se referme quand la donnée existe** — un lot de copies qui portent des charnières, le prochain lot réel si possible, un lot synthétique à défaut. Question reposée **avant la recette du 24/08** |
| 24 | **La branche d'échec du pipeline de sélection** *(A46, 03/08 ; item F4, relevé du 30/07)*. **Vérifié sur pièces** : le pipeline du `01-routeur.md` §5 enchaîne R0, le filtre N3, R1, R2, R5 puis les couches 3 et 4 — **et n'avait aucune branche pour le cas où rien ne sort** ; C3 non plus. *Avec 2 à 4 types par compétence, il suffit qu'aucun ne porte l'observable visé — N1 comme la branche 3 de N2 y retombent.* **Ce qui reste ouvert est la POLITIQUE, pas le comportement** : une clause de repli **provisoire** est écrite au `01-routeur.md` §5 depuis le 03/08 — *N1 dégrade en retour mono-focal sur le type courant et journalise `degrade`* —, pour qu'un lot de code n'invente pas sa propre règle. **Condition de fermeture, nommée par `02-exercices.md`** : la question « se referme quand la table remplie dira à **quelle fréquence** le cas se présente ». *On ne peut pas choisir la bonne politique avant de savoir si le cas tombe une fois par an ou une fois par semaine ; le drapeau `degrade` produit ce chiffre dès septembre.* **Dépendance** : `couverture_observables` se remplit au fil des grilles d'observables — trois compétences en ont au 31/07. | **se ferme sur la statistique** ; la clause de repli est due **avant C4-L2**, écrite le 03/08 |

**B3 — Textes et écrans non spécifiés (volontairement)**

| # | Point | Où il se décide |
|---|---|---|
| 16 | **Texte exact du gabarit de la couche contrat** (§5) | design C4-L3/L5 |
| 17 | **Contenu exact de l'écran de retour**, dont l'encart « langue » | design C4-L3/L5 |
| 18 | **Frise élève et page de parcours** (§3, §4ter) — seuls les **compteurs** entrent dans C4 | conception ultérieure |
| 22 | **Les formats des diagnostiques de décembre et de février/mars** sont passés **[à valider]** le 30/07 (l'ancienne « progression de grain micro→méso→macro » supposait un septembre en micro-tâches, ce que le format « essai + explication de texte » de la semaine 1 dénoue). Seul le format de la semaine 1 est arrêté | conception, avant décembre |
| ~~19~~ | ~~**Distinction visuelle Calame / Aletheia**~~ **RÉSOLU le 30/07 (A18)** — décision de navigation, `01-routeur.md` §2 : le cycle vit sur **une page unique** dont **seul l'en-tête change** (module, couleur, voix de l'IA). La famille est un **attribut visuel, jamais un lieu** | *fermée* |
| ~~20~~ | ~~**Utilité réelle de `duree_redaction_min`**~~ **FERMÉE le 03/08 (A30)** — le champ est **supprimé**. *Raison de Louis : « mes diagnostiques en classe ont une durée qui est déterminée par la durée des séances dont je dispose. Rien de plus. » La durée d'une passation en classe est une propriété de la **séance**, pas du type* | *fermé* |
| 21 | **Les deux sous-dimensions du Monitoring** — lucidité sur l'incompris, calibration de la confiance (A2, *[à valider]*). **ÉTENDUE LE 03/08 (A44 — F8 volet 2) : la TABLE DE CONVERSION vers l'amplitude 0-3 n'existe pas.** `amplitude_ecart` et `calibration` restent **NULL** tant qu'elle n'est pas écrite ; les événements bruts se collectent malgré tout **dès le premier exercice de septembre** — *une année de collecte manquante ne se rattrape pas (A8)*. **Trois trous nommés** : la frontière entre 2 et 3 n'est pas dénombrable · la source globale (« sûr / pas sûr » contre le niveau obtenu) n'a **aucune** correspondance vers 0-3 · rien ne dit comment les deux sources se combinent. **Source candidate repérée le 02/08, NON actée** : une **crédence chiffrée par hypothèse avancée** — elle produit un écart **dénombrable**, qui se convertit sans invention là où la source globale n'a aucune correspondance. *Mais elle alimente **`confiance_declaree`**, **pas** la lucidité ; et la solliciter **sature le taux de lucidité**, `marquage_supposition` devenant vrai pour tout le monde. À trancher au chantier Monitoring, avec ce coût.* | **aucun banc ne peut le tester avant la rentrée** : l'année 2026-27 en tient lieu d'épreuve. **La table se ferme sur l'existence de la collecte 2026-27.** |

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
| Critère de recette | ≥ 15 copies · accord ±1 ≥ 80 % **sur les cellules (copie × observable)**, sur le mode de **5 tirages** · golds antérieurs *(A25, 03/08)* | §1.7 |
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
- **Appels froids / chauds** (décision de juin) : le **jugement froid** est une chaîne **en quatre
  temps** — **P1 (modèle)** extrait le squelette · **du code** prépare ce que P2 doit voir ·
  **P2 (modèle)** juge, observable par observable, en données structurées, jamais du texte pour
  l'élève · **du code** agrège les observables en dimensions et en niveau. **Le modèle ne rend ni
  niveau, ni dimension, ni décompte** — aucune lettre et aucun nombre ne sortent de lui.
  *(**A20, 02/08** — révise « P2 produit le verdict », vrai jusqu'au 30/07. Motif mesuré, sur
  Expression puis sur Structure : sur 118 cellules, Haiku manque la règle d'agrégation **20 fois
  sur 25** là où elle est déterminée, et cinq répliques d'un même squelette figé rendent **quatre
  décomptes différents** pour un même verdict. **Les deux temps de code ne sont pas des appels** :
  la formule 2N + 4 ci-dessous est inchangée.)* ; la **reformulation chaude** est un **appel
  distinct** (§5) qui reçoit squelette et verdict et écrit ce que l'élève lit.
  **Coût par exercice** : `(P1+P2) × N` sur la v1, `(P1+P2) × 1` sur la vf (**la vf ne repasse que
  pour la compétence visée par le retour**), plus **2 appels chauds** (retour de v1, retour final)
  — soit **2N + 4**, où N est le nombre de compétences mesurées. *(A10, 30/07 : c'est bien par
  **exercice**, pas par cycle — les deux appels chauds sont le retour de v1 et le retour final d'un
  seul exercice, et un cycle en contient plusieurs.)*
  **« 2N + 4 » est un ordre de grandeur de conception, JAMAIS un chiffre de pilotage** *(**A21,
  02/08**)*. **Aucune règle ne doit s'y appuyer** — ni plafond, ni projection, ni arbitrage. Le
  chiffre qui fait foi est celui de la **télémétrie** : depuis F21, chaque appel journalise sa
  phase, son modèle et ses tokens, et la facture ventilée arrive dès les premières semaines.
  *Motif : le `01-routeur.md` définit N de deux façons incompatibles entre son §4 et son §6,
  chacune cohérente selon ce qu'on compte comme « appel au modèle ». Le risque n'est pas de mal
  prévoir — c'est qu'un lot de code implémente un plafond sous une lecture pendant qu'une autre
  section en suppose une autre. Les garde-fous réels de la facture sont ailleurs et sont actés :
  plafond mensuel, alerte à 70 %, coupure automatique (§9 lot C4-L5, §10 point 2).*
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
- **Ancre / trajectoire** *(définition fixée par **A54**, 03/08)* : une **ancre** est une mesure dont
  le **`lieu`** vaut **`classe`** ET la **`forme`** vaut **`sommatif`** (haute validité, basse
  fréquence) ; la **trajectoire**, c'est **tout le reste** — les exercices maison, et les formatifs
  passés en classe
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

- `00-referentiel.md` — le **Référentiel unifié** : **six compétences** — Expression,
  Argumentation, Structure, Connaissance, Synthèse, Questionnement, **toutes des deux familles**
  *(A51, 03/08)* — **+ le Monitoring**, l'échelle, les ancres (celles de réception
  restent à rédiger, §5), les sources de mesure du profil (les décisions Fragments y sont intégrées —
  l'ex-note est archivée).
- `01-routeur.md` — le routeur des **deux familles** (couches, R1-R6, escalade, lettres [révision
  « certitude » ouverte], télémétrie §10, aile lecture §13).
- `02-exercices.md` — la **bibliothèque unique** : **treize objets**, l'échelle d'autonomie à sept
  **crans**, l'axe des **modes**, le `Support`, la banque d'instances et l'injecteur *(A51, 03/08 —
  la description « écriture 1-14, lecture L1-L12, gestes » est périmée : il n'y a plus deux
  bibliothèques, et les codes `t1…t14` / `l1…l12` ne survivent pas)* — **le schéma n'en dépend
  pas** : un objet = une ligne de la table.
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

1. **Un référentiel unifié — AMENDÉ le 29/07 (A1, A2), puis le 03/08 (A51)** : **six
   compétences** — Expression, Argumentation, Structure, Connaissance, Synthèse, Questionnement —,
   **plus le Monitoring** en second ordre (la calibration de l'élève sur lui-même).
   **Restitution, Reconstruction et Évaluation ne sont plus des compétences : ce sont des MODES**
   — `restituer`, `expliquer`, `évaluer` — et **Mouvement est la Structure en mode `expliquer`**.
   **Un mode n'appartient à aucune compétence : il les traverse**, donc **les six sont des deux
   familles**, `composition` et `reception`. *Décision du 02/08 ; contenu et preuves :
   `02-exercices.md` §4, Décisions 1 à 9. Ce que ça débloque : les quatre compétences de lecture
   n'avaient ni sous-dimensions, ni typage, ni ancres — elles n'existent plus, et celles
   d'Argumentation et de Structure se **portent** au lieu de s'inventer.*
   **A1 — le Questionnement remplace les deux Problématisations, qui n'en font plus qu'une.**
   Renommage acté le 29/07 : « Problématisation » est le mot du bac et laissait croire à l'élève
   qu'on évaluait sa *problématique*. La fusion est motivée empiriquement — la frontière Moyen/Bon
   des ancres d'écriture (problème *reçu* contre problème *construit*) est exactement le champ
   `question_specifique` de la grille de lecture, écrit indépendamment. Conséquences dures :
   - **`ecriture.problematisation` et `lecture.problematisation` ne sont plus deux compétences.**
     Il y a **un** `questionnement`, avec **une** lettre au profil, alimentée par les deux familles.
     La phrase « deux compétences distinctes qui ne s'agrègent jamais » est **retirée**.
   - **L'activation se lit (compétence × famille × classe)** et non plus (compétence × classe).
     La **famille** est une colonne de `competences_actives_par_classe` — **une déclaration du
     professeur**, dont les deux valeurs deviennent **`composition`** et **`reception`** *(A51,
     03/08)*. *Sur `competences_mesures`, en revanche, la famille n'est plus une colonne : elle s'y
     **dérive** des modes élus (§6). Déclarée à l'activation, dérivée à la mesure — les deux se
     rencontrent au ciblage : le routeur ne cible une compétence dans une famille que si le couple
     est déclaré actif pour la classe.*
   - **HLP a les six compétences, comme le tronc commun** *(A51, 03/08 — le compte disait « dix,
     pas neuf »)*. Le Questionnement n'y est **pas actif en `composition`** (l'essai n'est pas la
     dissertation : la question est donnée) mais il l'est **en `reception`**.
     Donc : **« un élève HLP pur ne la voit jamais » est faux** — c'était un oubli, corrigé par
     Louis le 29/07. Un élève bi-classe l'a dans les deux familles. *Le motif de cette exception
     tient au **genre**, non à la famille : le changement de construct ne le touche pas.*
   **A2 — le Monitoring ne vit pas sur l'échelle commune.** Les **six** compétences
   se lisent en **E-A ↔ 0-4** *(A51, 03/08 — la rédaction disait « les neuf autres et le
   Questionnement »)* avec ancres comportementales. Le Monitoring, lui, se
   lit en **amplitude d'écart (0 calibré → 3 massif) plus une direction** (surconfiance /
   sous-confiance, sans objet à 0) — **pour la `calibration_confiance` seule, depuis A37** ; la
   **lucidité sur l'incompris** se lit en **taux sur fenêtre**, sans amplitude ni direction (§6).
   Le progrès est l'amplitude qui baisse ; la direction est un
   diagnostic, jamais un niveau — et les deux directions ne se valent pas, la surconfiance bloquant
   l'apprentissage. Il n'est **jamais noté** et **jamais cible du routeur**. Nombre de crans
   *provisoire (réglage empirique)*. Ses deux sous-dimensions — lucidité sur l'incompris,
   calibration de la confiance — sont *[à valider]* : aucun banc ne peut le tester avant la
   rentrée, l'année 2026-27 en tiendra lieu d'épreuve. Détail : `00-referentiel.md` §1 et §2.
   **La table de conversion vers l'amplitude 0-3 n'existe pas encore** *(A44 — trou déclaré,
   ouverture 21)* : elle **s'écrit après collecte**, sur des seuils observés.
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
   un sujet d'actualité simple, et une explication de texte simple. **Ce que chacun mesure est
   arrêté depuis le 03/08** *(**A51** ; remplace les deux comptes périmés « 6 en écriture, 5 en
   HLP » et « 5 en lecture », passés [à valider] par A22)*. **Le point ne porte plus deux nombres :
   il porte deux listes (compétence × mode), identiques en TC et en HLP.**

   | Passation | Ce qu'elle mesure, et dans quel mode |
   |---|---|
   | **L'essai** | **Expression** · **Argumentation** · **Structure** — les trois en **`composer`** |
   | **L'explication de texte** | **Expression** en `composer` · **Argumentation** en `expliquer` · **Structure** en `expliquer` · **Synthèse** en `restituer` |

   **La Connaissance et le Questionnement ne sont mesurés dans aucune des deux passations** — d'où
   leur absence de lettre au sortir de la semaine 1, et les deux portes par lesquelles chacune entre
   (§6, `competences_niveaux`). **Sept couples (compétence × passation) en tout**, contre onze dans
   l'ancien compte : c'est ce chiffre que lisent le §10 point 2 et l'ouverture 8.
   Dépouillement immédiat (option A : tous les bancs tournés avant
   le 25/08). Le pipeline photo/OCR de Codex est donc **critique dès la semaine 1** (la coupe
   « diagnostique sans pipeline manuscrit » de C4 est annulée).
5. **Fragments** : l'essai bascule sur la chaîne du référentiel (**`lieu` = `classe`** — *la valeur
   `essai_fragments` est supprimée par **A53**, 03/08 ; le déclencheur du lot se dérive, voir le
   trou déclaré au tableau de bord B* — et non « provenance », terme supprimé le 29/07 : correction mécanique C1,
   signal diagnostique supplémentaire) ; le hebdo reste hors profil ; vocabulaire de la rubrique
   aligné (C8) ; « Clarté de la présentation » remplace « Expression » à l'oral (C8).
   **Précision de fait, ajoutée le 03/08** *(**A27** — arbitrage F27 du relevé du 30/07)* :
   **l'essai de Fragments sera très probablement limité aux seuls HLP** (Humanités, Littérature et
   Philosophie), **au moins cette année**. Conséquence à connaître : l'essai de Fragments étant une
   **source d'ancre** (en classe, manuscrit, sous surveillance — §7), **l'inventaire des ancres
   n'est pas le même selon le parcours**, un élève HLP en ayant une de plus qu'un élève de tronc
   commun. **Sans effet sur la construction** — voir le §4.
6. **« Calame »** est le nom de l'IA qui guide tous les exercices côté élève (écriture ET lecture).
   Aletheia reste la voix des séances de lecture guidée des livres.
7. **Statut de recette par compétence** : chaque compétence est, à la recette (C13), déclarée
   `evaluee` (banc passé → verdicts élève) / `mesuree_silencieusement` (P1 stocké, pas de verdict)
   / `differee`. La spec construit le mécanisme ; l'état effectif se décide selon les bancs au 24/08.

   **La transition vers `evaluee` recalcule la lettre** *(**A24, 02/08** — arbitrage F2 du 30/07)*.
   Le passage de `mesuree_silencieusement` à `evaluee` **recalcule la lettre depuis les seules
   mesures postérieures à la recette** ; les mesures antérieures **restent au journal**,
   distinguées par `instrument_version`. **La règle a son domicile au `01-routeur.md` §3** — elle
   est rappelée ici parce que C3 est le seul document qu'une session Code lit (R4), et qu'un lot
   qui implémenterait `statut_recette` sans elle laisserait des lettres bâties sur un instrument
   non bancé. *Motif : la lettre pilote le routage entre-temps, et côté réception elle pilote le
   ciblage dès la recette.* **Aucun ajout de schéma** : `instrument_version` existe déjà sur
   `exercices_squelettes`, `competences_mesures` et `monitoring_mesures` (§6). *Règle jumelle, au
   `01-routeur.md` §7 et hors C3 : une sonde ne compte pour la montée que si la compétence sondée
   est `evaluee`.*

   **Critère de recette chiffré (acté 29/07)** — une compétence ne passe à `evaluee` que si les
   trois conditions sont réunies :
   - **≥ 15 copies** passées au banc ;
   - **accord à ±1 niveau ≥ 80 %** contre les gold standards de Louis — **au grain de la
     cellule (copie × observable)**, voir A25 ci-dessous ;
   - **golds écrits avant lecture des sorties**.

   **Ce qu'est « le niveau » d'une copie passée plusieurs fois, et sur quoi porte le 80 %**
   *(**A25, 03/08** — chantier Structure, note du 31/07, plus trois arbitrages de Louis du
   03/08/2026)*. Le critère ci-dessus exige un « accord à ±1 niveau ≥ 80 % » sans dire ce
   qu'est *le* niveau d'une copie que le banc passe plusieurs fois, ni sur quoi le pourcentage
   se compte. Quatre règles le fixent.

   - **Le banc tourne à CINQ tirages, toujours** — un « tirage » étant un passage complet de la
     chaîne (l'appel P1, puis l'appel P2) sur une copie. *Règle 1 du
     `copies-tests/_commun/PROTOCOLE-CALIBRATION.md`, qui **fait foi** (`AGENTS.md` du dossier
     de conception). Arbitrage de Louis du 03/08, qui renverse la décision « reste à trois » du
     31/07 : les deux avaient été journalisées le même jour, dans deux séances parallèles.
     Motif : la détection d'un cas réellement limite repose sur la structure modale, et trois
     tirages ne la produisent pas — à cinq, un partage 3-2 se distingue d'un 4-1 et d'un 5-0.*
   - **L'unité de mesure est la CELLULE (copie × observable), jamais la copie** *(arbitrage de
     Louis du 03/08 ; règle 2 du protocole, déjà actée au journal du 31/07)*. Le niveau de la
     copie n'échappe pas à la règle : il est lui-même un observable (`niveau`), donc une cellule
     parmi les autres. *Motif : sur 11 copies, un seuil vaut 10/11 — une seule copie qui bascule
     le traverse, et l'intervalle de confiance d'un tel taux couvre 60 à 98 points. Au grain de
     la cellule, une compétence à 4 observables passée sur 16 copies compte 64 cellules, et le
     seuil devient estimable à ±5 points.* **Concrètement** : 80 % de 64 cellules, c'est 51
     cellules accordées ; à 5 observables (80 cellules), 64.
   - **La valeur retenue par cellule est le MODE des cinq tirages, rendu avec son étendue.**
     `C` seul est interdit : on écrit `C (5/5)`, ou `C (3/5, deux tirages à B)`. Une **cellule
     sans mode** — deux valeurs à égalité — ne rend aucune mesure et **compte comme désaccord**.
     *Motif : un dispositif qui rend un mode sans son étendue prétend à une précision qu'il n'a
     pas.*
   - **La tolérance de ±1 cran est celle de la recette, et ne se confond pas avec la bande de
     tolérance du banc** *(arbitrage de Louis du 03/08)*. Deux mesures se calculent sur le même
     run, pour deux décisions différentes. **(i)** Le **tri A/B/C/D** du protocole de calibration
     lit l'accord dans la **bande déclarée au gold** — le rang du gold élargi de l'incertitude
     que Louis a déclarée sur cette cellule, donc l'accord **exact** là où il a déclaré son gold
     certain. C'est ce qui sépare un désaccord de bruit (**C**) d'un item réellement limite
     (**D**). **(ii)** La **porte de recette du présent §1.7** lit l'accord à **±1 cran**,
     tolérance accordée partout, parce qu'elle répond à une autre question : la lettre est-elle
     assez juste pour être montrée à l'élève ? *Ne pas fusionner les deux — accorder un ±1
     global au tri effacerait la distinction C / D, et la déclaration d'incertitude au gold ne
     servirait plus à rien.*

   > **Attention au mot « mode ».** Il est employé ici au sens de la statistique — la valeur la
   > plus fréquente d'une série de tirages — et non au sens des cinq **modes** du contrat de
   > type (`composer`, `restituer`, `expliquer`, `évaluer`, `questionner`, §6). La collision de
   > vocabulaire est connue et se règle globalement au chapitre 1 de la passe de mise en
   > cohérence ; le mot est conservé ici parce que le harnais de calibration l'implémente sous
   > ce nom (`mode`, `taux_modal`, `modes_ex_aequo`, `accord_modal`).

   **À déclarer avec la recette, sans faire porte : le taux par passage.** L'accord de recette se
   lit sur le mode des cinq tirages ; or **en production, le §0 ne prévoit qu'un seul appel P1/P2
   par compétence**. Le taux recalculé passage par passage — que le harnais produit déjà
   (`taux_par_passage`) — est donc le chiffre honnête de ce que le produit délivre, et il
   s'inscrit au journal de recette à côté du taux qui fait porte. *Origine : la note Structure du
   31/07 posait « le critère se mesure par tirage, jamais par mode » ; le protocole, qui fait foi,
   gate sur le mode. La clause est renversée, ce qu'elle protégeait est conservé.*

   **Ne pas confondre avec la règle d'arrêt du cycle de calibration.** Le protocole porte de son
   côté un critère à **borne basse de l'intervalle de confiance ≥ 85 %**, qui dit quand cesser de
   réviser un prompt. Ce n'est pas la porte de recette — deux décisions distinctes — et le présent
   §1.7 garde **80 % en pourcentage brut** *(arbitrage de Louis du 03/08)*.

   *Mesuré, avec sa réserve* : sur le run Structure du 30/07 (9 copies × **3** tirages), **88,9 %
   d'accord à ±1 par tirage contre 77,8 % par mode**, et **55,6 % d'accord exact** dans les deux
   cas — **l'instrument place à un cran près, pas au cran juste**. Réserve à conserver telle
   quelle : neuf copies et non quinze ; un taux compté par copie et non par cellule ; un run à
   trois tirages, donc sous-répliqué au regard de la première règle ci-dessus ; et **Structure
   n'est pas en état de recette**.

   **Condition supplémentaire, propre au Questionnement** *(**A23, 02/08** — arbitrage F3 du
   30/07)*. Le banc du Questionnement doit couvrir **les deux familles avant** son passage à
   `evaluee` : **quatre lots de copies au lieu de deux — deux en `composition`, deux en
   `reception`**. *Décision de Louis : « quand le moment viendra je m'assurerai de bancer sur
   4 lots de copies au lieu de 2 ».* **Pourquoi c'est écrit ici et pas seulement au protocole de
   banc** : une contrainte de protocole n'est appliquée par aucun code — sans cette ligne, un
   Questionnement bancé sur la seule composition passerait `evaluee` sans que rien ne s'y oppose.
   **Rien ne change au schéma** : `statut_recette` reste porté par la compétence, sa clé n'est pas
   étendue à la famille — l'extension a été explicitement écartée, le coût n'étant pas justifié.
   *Déclenchement : avant la recette du 24/08. Renvoi jumeau à écrire : `01-routeur.md` §12.*

   > **LE MOTIF DE CETTE CONDITION EST PÉRIMÉ ; LA CONDITION NE L'EST PAS** *(constat de Louis,
   > 02/08)*. F3 la réservait au Questionnement parce qu'il était « **la seule compétence des deux
   > familles** ». **Cette appartenance n'existe plus** : depuis la **Décision 4 du 02/08**,
   > `famille` cesse d'être un champ déclaré et se **dérive du mode élu** (`composer` parmi les
   > modes → `composition`, sinon `reception`) — **les six compétences traversent les deux
   > familles**. La question devient donc : *la couverture des deux familles au banc doit-elle
   > valoir pour les six, pour aucune, ou rester une exception nommée sur le Questionnement ?*
   > **[à valider]** — item porté au **chapitre 5** de la passe de mise en cohérence. *En attendant,
   > la condition est maintenue telle qu'elle a été décidée : elle protège, elle ne coûte que du
   > temps de banc, et la retirer sur un raisonnement non tranché serait le mauvais sens du doute.*
   > *Question voisine, du même chapitre : le protocole de banc doit par ailleurs éprouver **chaque
   > mode** (entrée 29) — reste à dire si « les deux côtés » se lit sur la coupe binaire ou sur les
   > cinq modes.*

   **Trou déclaré : aucun palier Acquis n'a encore été observé ouvert** *(**A26, 03/08** —
   requalification d'A6, régime (b) → (c) ; décision de Louis du 31/07, premier cas mesuré au
   chantier Structure)*. Le critère de recette ci-dessus peut être satisfait **sans que le palier
   Acquis ait jamais été produit**, sur aucune compétence : un instrument qui place correctement
   de Absent à Bon, et n'atteint jamais le haut de l'échelle, passerait la recette.

   **Le premier cas mesuré, et il est pire que le soupçon.** Sur les neuf copies du run Structure
   du 30/07, **six ne portent aucune charnière** ; les trois autres en portent une. La cohésion
   locale étant définie sur les charnières, la branche §2c du calcul plafonne alors la cohésion à
   *satisfaite*, ce qui **ferme le palier Acquis par construction sur les deux tiers du jeu**.
   L'alerte `TROU_DECLARE_ACQUIS`, rangée dans le harnais comme « cas attendu », est en réalité le
   **régime ordinaire** du corpus. *Second mécanisme, documenté le 31/07 sur la Copie4 et distinct
   du premier : une copie qui ferme sa première partie et ouvre la seconde par des blocs de
   service — ce qui est plutôt bien fait — n'a aucune charnière au sens de la règle de Structure,
   qui exige deux blocs portant chacun une étape annoncée distincte.*

   **Décision de Louis (31/07) : on n'élargit pas la définition de la charnière pour en
   fabriquer.** Une définition étirée jusqu'à produire des Acquis mesurerait la définition, pas
   l'élève.

   **Conséquence, et c'est le régime (c) :** le jalon « voir un palier Acquis produit » **n'est
   pas ajouté au critère de recette** — ce serait une condition qu'aucun corpus disponible ne
   permet de remplir. Il est **déclaré ouvert** (tableau de bord B, ouverture 15), avec sa
   **condition de fermeture : un lot de copies qui portent des charnières** — le prochain lot réel
   si possible, un lot synthétique à défaut. *Échéance visible : la question se repose **avant la
   recette du 24/08**.*

   **Renvoi — trou déclaré sur la mise en page** *(**A28, 03/08**)* : le découpage en blocs étant
   donné par les paragraphes, une copie saisie sans retour à la ligne est lue comme dépourvue
   d'architecture. Une recette passée sur un corpus bien paragraphé ne dit donc rien de ce qui
   arrive à une telle copie. *Domicile du trou et condition de fermeture : §2.*

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
| **Essai Fragments** | Fragments | **manuscrit → photos → OCR** | signal diagnostique (**`lieu` = `classe`** — *déclencheur dérivé, **A53***) |

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

**Trou déclaré : le dispositif mesure l'architecture telle qu'elle est écrite sur la page**
*(**A28, 03/08** — chantier Structure, note du 31/07 ; régime (c))*. Le découpage en blocs, sur
lequel la compétence Structure est mesurée, est **donné par les paragraphes**. Une copie saisie
**sans retour à la ligne** n'a donc qu'un seul bloc, aucune couture, et se lit comme **dépourvue
d'architecture** — même si elle articule parfaitement à l'intérieur de son bloc unique. **Un fait de
mise en page est devenu un fait de mesure.**

*Cas constaté, et il n'est pas théorique* : la Copie2 du jeu de test est écrite d'un seul tenant. La
chaîne ne rendait alors **aucun niveau** — un `null` silencieux au milieu d'un tableau de résultats.
**Corrigé le 31/07** : une copie sans couture est lue en **défaillance forte** et le déclare
(`COPIE_SANS_COUTURE`), d'où un niveau Faible qui est bien son gold — *la règle a été dérivée
d'abord, le niveau constaté ensuite*. **Mais le correctif rend le trou visible, il ne le referme
pas** : la copie reste lue comme sans architecture.

**Condition de fermeture** : une **interface de rédaction qui garantit ou encourage le découpage en
paragraphes**. C'est une **contrainte d'interface, pas de mesure**, et elle appartient à C4 —
inscrite au lot **C4-L3** (§9). Le passage du formatif maison **au clavier**, décidé ci-dessus, en
est la condition de possibilité : c'est une interface qu'on maîtrise.

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
  décomptent** : préparer, écrire, se juger, lire le retour, réviser, lire le retour final.
  Confondre les deux faisait recevoir à l'élève le double du budget prévu, et lire ses non-remises
  comme de la stagnation. **Aucun rapport chiffré n'est posé entre les deux durées** *(A29,
  03/08)*.
  *(Renommée le 30/07 — A9. L'ancien `duree_cycle_min` se lisait à contre-sens depuis que « cycle »
  désigne la **semaine de travail** : un cycle contient plusieurs exercices, il n'a pas de durée
  déclarée par type.)*
*(**`duree_redaction_min` est SUPPRIMÉ** — A30, 03/08. La durée d'une passation en classe est une
propriété de la **séance**, pas du type. Ferme l'ouverture 20 du tableau de bord.)*

**La durée déclarée est indicative ; le temps réel est mesuré** *(**A30, 03/08** — solution de
Louis, arbitrage F9 du relevé du 30/07, complétée le 31/07 à la révision de `02-exercices.md`)*.

- **La durée déclarée par type est celle du régime nominal, et elle est indicative.** Elle reste la
  seule que le routeur et le quota décomptent — c'est ce qui garde le remplissage de la semaine
  **déterministe** — mais elle ne prétend pas dire ce que l'exercice a réellement coûté à cet
  élève-là.
- **Le temps réel est mesuré et journalisé** : chronomètre **ouverture → dépôt**. Il **ne corrige
  pas le cycle en cours, mais le suivant**. *Aucun champ neuf : `exercices_depots` porte déjà
  `ouvert_at`, `v1_remis_at`, `vf_remis_at`, `juger_debut_at`, `juger_fin_at` et `duree_taguee` —
  le chronomètre s'en dérive.*
- **Au-delà du seuil de dépassement, une micro-question conditionnelle** : « pause, ou
  difficulté ? » — champ **`motif_depassement`** (§6). **Jamais notée, jamais renvoyée comme
  jugement.** Elle est **distincte du geste sur les conditions** (`temps_mis` | `au_plus_vite` |
  `pas_pu`), qui porte sur l'effort : celle-ci porte sur le temps. *Seuil : **×2 la durée
  déclarée**, provisoire — c'est un paramètre, et le registre qui en fait foi est le §11 du
  `01-routeur.md` (A17).*
- **Les champs `duree_v1_min` / `duree_vf_min` proposés par les deux revues adversariales ne sont
  pas nécessaires** et ne sont pas créés.

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

**Mais elle revient comme PROPORTION, et non comme calendrier** *(**A32, 03/08** — arbitrage F24 du
relevé du 30/07, relu contre la Décision 4 du 02/08)*. **Deux tiers des exercices sont en famille
`composition`, un tiers en famille `reception`, sur une rotation glissante de trois cycles** — donc
trois semaines. *Le caractère probabiliste et par élève est intact : la **proportion** gouverne le
partage entre les deux familles, « niveau × fréquence » gouverne quelle compétence est servie à
l'intérieur.* **Sans elle, la composition prenait 100 % des élections** — toutes les règles qui
élisent sont des règles d'écriture (R1, R2, R3 ; R4 met la Connaissance hors rayon). *Valeurs
provisoires ; le registre qui en fait foi est le §11 du `01-routeur.md` (A17).*

> **La proportion est BINAIRE, et elle le reste** *(Décision 4 du 02/08)*. `famille` n'est plus un
> champ déclaré : elle se **dérive du mode élu** — `composer` parmi les modes → `composition`,
> sinon → `reception`. La proportion porte donc sur cette coupe à deux valeurs, **et non sur les
> cinq modes**. *Une note de séance du 02/08 annonçait « la proportion devient une proportion sur
> les modes » ; c'était un **relevé de la séance 3**, et la **séance 4 a explicitement écarté** la
> généralisation du signal de ciblage au mode — le r = .44 qui la fonde oppose la composition à la
> réception, deux valeurs, et les modes de réception ne se séparent pas.*

> **Conséquence à surveiller, inscrite avec la règle.** Un tiers des exercices, à 2-3 exercices par
> cycle, laisse aux compétences servies en réception un ciblage nettement plus espacé que la
> **fenêtre de montée de six semaines** : **elles seront à la limite de pouvoir monter par le seul
> ciblage.** *Le chiffre exact est à refaire — il avait été calculé sur « cinq compétences de
> lecture », compte périmé. **La dépendance à l'entrée 29 est close le 03/08 (A51)** : les
> compétences servies en réception sont les **six**, moins celles dont la grille réceptive n'existe
> pas encore — donc **plus nombreuses que les cinq du calcul d'origine**, ce qui aggrave le
> resserrement plutôt qu'il ne l'allège. **Le recalcul lui-même reste au chapitre 5 de la passe**,
> avec le K de R5 et les autres paramètres de cadence. Le risque, lui, ne dépend pas du compte.*

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

**Deux valeurs DÉRIVÉES gouvernent le ciblage — et ce ne sont pas les lettres affichées**
*(**A33, 03/08** — arbitrages F7 et F14 du relevé du 30/07, plus la conséquence relevée en F15)*.
**Aucune règle de lettre n'est changée, et aucune colonne physique n'est créée** : les deux valeurs
se calculent depuis `competences_mesures`. L'amendement porte sur la **règle écrite**, que C3
n'avait pas — le `01-routeur.md` les déclare déjà « dérivé, jamais stocké » à son §3.

- **Le signal de ciblage est dérivé PAR FAMILLE** *(F7)*. Le ciblage en composition lit les mesures
  de famille `composition`, celui en réception les mesures de famille `reception`. **La lettre
  affichée, elle, reste unique** par élève × compétence. *La famille d'une mesure se dérive du mode
  élu (Décision 4 du 02/08) : c'est sa **source** qui change avec l'entrée 29, pas la règle de
  ciblage.*
- **R2 élit sur une valeur NON PLAFONNÉE** *(F14)*, calculée depuis les mêmes mesures, tandis que
  **la lettre affichée reste plafonnée à ancre + 2**. *Motif, et il est concret : un élève solide
  diagnostiqué D en Structure alors que ses autres lettres sont à B voit R2 élire « la plus faible
  du trio » — et passe le mois suivant sur la compétence où il est le meilleur, sans qu'aucun
  drapeau ne le voie.*
- **La stagnation se lit sur la valeur non plafonnée, jamais sur la lettre affichée** *(conséquence
  de F14 relevée en F15)*. Sinon **le plafond ancre + 2 fabrique de la stagnation** : une lettre
  immobile parce qu'elle bute sur son plafond serait lue comme un élève qui ne progresse plus.
  *Domicile de la règle de détection : `01-routeur.md` §6.*

**Trois gates au lieu d'un (acté 29/07)** — un seul interrupteur rendait le diagnostic impossible
sans tout allumer :
- **`exercices_actif`** — les élèves peuvent-ils faire des exercices ?
- **`routeur_actif`** — le routeur choisit-il, ou le prof planifie-t-il ?
- **`competences_affichage_actif`** — les lettres sont-elles visibles ?

S'y ajoute une **matrice normative par statut de recette** : pour chaque état (`evaluee`,
`mesuree_silencieusement`, `differee`), ce qui tourne et ce qui est masqué.

**Contenu de la matrice — première ligne posée** *(**A31, 03/08** — arbitrage F6 du relevé du
30/07)*. Ce tableau **rassemble des règles déjà actées ailleurs dans cette spec** et en ajoute une
qui manquait ; chaque case porte sa source. **Il est incomplet, et il le déclare.**

| | `evaluee` | `mesuree_silencieusement` | `differee` |
|---|---|---|---|
| **La mesure tourne ?** | oui | oui — **P1 stocké, pas de verdict** (§1 pt 7) | **[à valider]** |
| **Ciblable par le routeur ?** | oui | **non** (§4 — le routeur ne cible que les `evaluee`) | **non** (idem ; le routeur ajoute qu'une compétence `differee` n'est pas co-présente) |
| **Verdict ?** | oui | **non** (§1 pt 7) | non |
| **Contenu du retour** | verdict + retour formatif | **registre descriptif** : montre ce que le squelette contient, **n'attribue aucun niveau** — *ligne neuve, F6* | **[à valider]** |
| **Lettre visible ?** | selon la gate `competences_affichage_actif` et la bascule de `profil_provisoire` | sans objet — il n'y a pas de lettre | sans objet |
| **Compte pour la calibration du Monitoring ?** | oui | **non** (A8, §6 — seules les compétences ayant passé la recette comptent) | non |

*Le principe qui gouverne la ligne du retour — « **on suspend le verdict, jamais le feedback** » —
a son domicile au `01-routeur.md` §7 ; la règle F6 elle-même y est écrite au §5, et `02-exercices.md`
la porte aussi. Elles sont **rassemblées ici, non recopiées** : le relevé désigne explicitement la
matrice comme le lieu de la règle, « plutôt qu'au cas par cas ». La question de la **mesure** était
déjà réglée (A24, arbitrage F2) ; c'est celle du **retour** que rien ne traitait.*

**Ce qui reste ouvert : la colonne `differee`.** Le statut est nommé au §1 point 7, mais **son
régime n'est écrit nulle part** — ni ici, ni au `01-routeur.md`, ni dans `02-exercices.md`. On sait
seulement qu'il n'est ni ciblé ni co-présent. Mesure-t-on encore ? que voit l'élève ? *[à valider],
porté au **chapitre 5** de la passe de mise en cohérence — un lot qui implémente les trois statuts
n'a aujourd'hui rien à écrire pour le troisième.*

**Ancres : cadence et audit (acté 29/07).** *(A19, 30/07 : seul le format de la semaine 1 est arrêté — essai + explication de texte. Ceux de décembre et de février/mars sont **[à valider]**, voir B3-22 ; leur existence au calendrier, elle, n'est pas en cause.)* Les diagnostiques de septembre, décembre et mars sont au
projet, et les évaluations régulières en classe figurent au **plan d'évaluation**. La cadence cible
est d'**une ancre par compétence `evaluee` toutes les 6 semaines** ; si le plan d'évaluation manque
cet objectif, **un signal non bloquant part vers le prof** — la correction se fait à la
planification, pas après coup. **La lettre ne gèle pas** : elle continue de monter jusqu'au plafond
ancre+2. *(L'exigence de « fraîcheur d'ancre » pour le second cran est abandonnée avec le gel.)*

**L'inventaire des ancres diffère selon le parcours — et c'est sans effet sur la construction**
*(**A27, 03/08** — arbitrage F27 du relevé du 30/07 ; voir §1 point 5)*. L'**essai de Fragments**
sera très probablement **limité aux seuls HLP** (Humanités, Littérature et Philosophie) au moins
cette année. Or il est une source d'ancre : **un élève HLP en dispose donc d'une de plus qu'un élève
de tronc commun**, et la cadence cible d'une ancre par compétence `evaluee` toutes les 6 semaines
est plus facile à tenir en HLP qu'en tronc commun.

> **Tranché par Louis le 03/08 : cela ne change rien au plan de développement.** *« Je fais mes
> évaluations en classe quand je veux, et je tiendrai le compte dans mon plan d'évaluation. »* La
> cadence se tient **au plan d'évaluation**, qui appartient au professeur ; le mécanisme du système
> est **déjà écrit et suffit** — un signal non bloquant part vers le prof quand le plan manque
> l'objectif, et il fonctionne à l'identique quel que soit le parcours. **Aucune cadence
> différenciée, aucune source d'ancre de remplacement, aucun traitement particulier du tronc commun
> n'est à construire.** *Consigné pour qu'une session ultérieure ne rouvre pas la question.*

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

**Unité de comparaison** *(**A35, 03/08** — angle mort G3 du relevé du 30/07)* : la mise en regard
se lit en **écart en crans, par compétence**, et **son résultat se journalise**. *Le seuil qui
déclencherait une action, et l'action elle-même, ne sont volontairement pas fixés : la première mise
en regard a lieu en janvier, et le jugement sur pièces vaudra mieux qu'un seuil posé d'avance sur un
effectif de cette taille.* **Domicile de la règle : `01-routeur.md` §8** — elle est rappelée ici
parce que le §4 est le lieu où l'ancre aveugle est définie, et que le §10 point 10 la cite comme
**seule parade** au risque que la mesure devienne un objectif.

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
**profil est unifié** (décision du 17/07, amendée le 29/07 par A1 : les deux parcours ont les **six** compétences (**A51**, 03/08), seule varie la famille dans laquelle chacune est active ; échelle commune) et que les compétences
sont les mêmes, l'élève bi-classe n'a **aucune raison de faire le travail en double**. Le budget est
décidé **en début d'année**, en **temps d'exercice cumulé sur la semaine** (A10), avec un plancher et un plafond :

| Situation | Plancher | Plafond | Optionnel |
|---|---|---|---|
| HLP seul | 1 h | 1 h 30 | + 30 min |
| TC seul | 45 min | 1 h | + 30 min |
| Bi-classe (TC + HLP) | 1 h 30 | 2 h | + 30 min |

*Chiffres provisoires (réglage empirique).* Le routeur remplit **au moins jusqu'au plancher, jamais
au-delà du plafond**, en composant avec des types de durées inégales. La **table des proportions**
reste un paramètre de configuration (session dédiée) — jamais en dur. **Sa FORME change le 03/08**
*(**A50**, entrée 28)* : elle distribuait des proportions **micro / méso / macro** par
(segment × niveau) ; elle distribue désormais sur le **couple (`grain`, `cran`)**, l'unité
d'assignation n'étant plus le grain seul. *Décision liée : le `grain` cesse d'être indexé sur le
niveau — **le cran porte la difficulté, le grain porte la charge de travail**. La table garde son
rôle en haut de l'échelle, où elle dit ce que le cran ne dit pas : « il ne sert à rien qu'un élève à
B fasse de petits exercices ».*

**§4bis — Lettres : montée, descente, et la révision « certitude » (26/07, chantier ouvert,
NON bloquant pour le gel).** Règles v1 : celles du routeur §7 (montée par la **trajectoire** 2 mesures sur
3, descente par les **ancres** seules — `lieu` = `classe` et `forme` = `sommatif`, **A54** —,
plafond ancre+2, rien d'affiché avant l'allumage). **Révision à
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

Deux étages, deux modèles : le **jugement froid** (chaîne **en quatre temps** par compétence,
P1 → code → P2 → code — voir §0 ; prompts dans `competences/*.md` et
`competences-lecture/prompts-inventaire.md`, ils font foi, les bancs les valident) ; la **reformulation chaude** pour l'élève, générée depuis le squelette et le verdict.

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
- **Exception réglée pour le retour de Monitoring : il nomme la DIMENSION, jamais la grille**
  *(**A36, 03/08** — angle mort G1 du relevé du 30/07)*. Le retour de Monitoring **ne révèle aucun
  observable**, mais il dit **où** porte l'écart, en langage pédagogique : « tu t'es jugé plus sûr
  que tu ne l'étais sur la **justification** de tes liens ». L'élève peut agir ; la grille reste
  cachée. *Le conflit que ça lève : la règle ci-dessus et le Monitoring se détruisaient l'un
  l'autre — on demandait à l'élève de se calibrer sur un référent dont on lui cache les critères,
  et « surconfiant » était un verdict sur lequel il ne pouvait rien. L'asymétrie actée au
  `00-referentiel.md` §2 — « à amplitude égale, la surconfiance appelle une intervention » —
  faisait de cette impasse le cas qui déclenche le plus d'action.* **Écarté, avec sa raison** :
  révéler les observables après la version finale — sur l'année, l'élève finirait par connaître les
  grilles, ce que la règle veut précisément éviter.
  **DÉPENDANCE DATÉE — à appliquer avant les écrans du lot C4-L3.** Le retour a besoin d'une
  correspondance **observable → formulation pédagogique**, qui rejoint les « attendus du retour »
  déjà prévus à la fiche de type (`02-exercices.md` §1). **Sans elle la règle est inapplicable** :
  il n'y a rien à dire à l'élève.

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

- **`exercices_types`** — la bibliothèque (`02-exercices.md`). **Bloc régénéré en entier le
  03/08/2026** — **A49** (entrée 17, le contrat), **A50** (entrée 28, la montée), **A51**
  (entrée 29, le construct).
  **À plat sur le type** : `code` (identifiant stable ; *les codes `t1…t14` et `l1…l12` de
  l'ancien seed ne survivent pas*), `grain` (**énuméré : `micro`|`meso`|`macro`** — il porte la
  **charge** de ce que l'élève produit, **plus la difficulté**, passée au cran),
  **`competences[]`** (liste unique des compétences que l'objet permet d'entraîner ou d'évaluer ;
  **plus de compétence primaire déclarée** — c'est le routeur qui, en élisant une cible, la rend
  primaire), **`support`** (**plage** `phrase` → `paragraphe` → `extrait` → `texte`, l'instance
  en choisit une ; **obligatoire dès qu'un mode réceptif est élu**),
  **`exclusions_parcours[]`** (sur **tous** les types, vide dans la quasi-totalité des cas),
  **`genre` NULLABLE (A14, 30/07)** — `dissertation` | `explication_texte` (tronc commun) |
  `question_interpretation` | `essai` (HLP) ; **les types génériques n'en ont pas**. C'est lui
  qui porte le drapeau « transfert » (voir `competences_mesures`) — `fiche` JSONB (quand/pourquoi
  élève, procédure, exemples/contre-exemple, questions de guidage, questions d'auto-évaluation,
  contextes de transfert, **attendus du retour — non vide pour passer `actif`**), `mode_saisie`
  (`manuscrit`|`ecran`|`mixte`), `consigne_gabarit`, `actif`.

  **DEUX AXES DE DÉCLARATION IMBRIQUÉS — sans eux, rien de ce qui suit n'est écrivable** *(A49)*.
  La forme physique (colonne JSONB ou table fille) est **au choix de la session Code** ; C3 exige
  seulement que les deux axes existent.
  1. **PAR CRAN.** Le type déclare **`crans[]`** parmi les sept de l'échelle d'autonomie
     (`02-exercices.md` §2) : `diagnostic_guide` · `transformation_nommee` ·
     `transformation_aveugle` · `production_etayee` · `production_autonome` ·
     `production_contrainte` · `diagnostic_fin`. **C'est le cran qui porte la difficulté.** Pour
     **chaque** cran admis : **`duree_exercice_min`** (obligatoire, seule décomptée,
     **indicative** — A30) · **`couverture_observables`** · **`provenance_materiau`** (`genere` |
     `production_eleve` | `texte_source` | rien — *crans 1, 2, 3, 7 : le **matériau** · cran 4 :
     l'**appui** · crans 5 et 6 : **aucune***).
  2. **PAR COMPÉTENCE.** **`modes[]`** se déclare **par compétence du type**, jamais par type —
     une même compétence peut en admettre plusieurs sur un même objet, l'instance élit. Cinq
     valeurs : `composer` · `restituer` · `expliquer` · `évaluer` · `questionner`. *`composer`
     est élu aux crans 2 à 6, absent aux crans 1 et 7 : au diagnostic l'élève rend un jugement,
     pas un texte.*
  3. **`couverture_observables` croise les deux** — elle se déclare par **(cran × compétence ×
     observable)**, à trois valeurs : `exerce` | `isole` | `observable_seul`. **`competences[]`
     borne la couverture** ; à l'intérieur d'une compétence déclarée elle est **partielle**,
     l'absence de ligne valant « pas en jeu ici ». Consommée par **N1** et la **troisième branche
     de N2** (`01-routeur.md` §6). **Règle d'effondrement, à appliquer sans hésiter** : entre
     `exerce` et `isole`, **déclarer `exerce`** — *un `isole` faux casse l'escalade en silence ;
     un `exerce` faux ne coûte qu'un candidat* (`02-exercices.md` §1 point 10).

  **TROIS VALEURS SE DÉRIVENT ET NE SONT PAS DES COLONNES** : **`famille`** — `composer` parmi
  les modes élus de la **mesure** → `composition`, sinon → `reception` *(A51)* ·
  **`regime_v1vf`** — du **cran** : 1 et 7 → **par paires**, 2 et 3 → **pas de version finale
  sauf escalade active**, 4, 5, 6 → **plein** *(A49)* · la **largeur de mesure** — du couple
  (`grain`, `cran`) *(A49)*. *La contradiction que F12 signalait devient impossible par
  construction : on n'écrit plus le régime.*

  **SIX ATTRIBUTS NE SERONT PAS CRÉÉS — inscrit pour qu'une session ne les cherche pas** *(A49)* :
  le **rang de richesse de sonde** (contextuel, calculé à la sélection) · **`produit_mesure`**
  (indexé sur le `statut_recette`, que le routeur connaît déjà) · **`duree_redaction_min`**
  (A30) · **`complexite`** (c'est le couple (`grain`, `cran`)) · **`etayage[]`** (absorbé dans
  `crans[]`) · **`statut_modal`** (`these_adverse` existe déjà).

  **Un objet partagé par deux compétences de familles différentes prend UNE SEULE LIGNE** *(A49)*
  — la condensation, l'ancien type 14. *La question « une ligne ou deux » ne se posait que parce
  que la ligne portait une `famille` déclarée.* **Deux objets ne se séparent que si ce que
  l'élève PRODUIT diffère** (Décision 9 du 02/08).

  Seed : les **treize objets** de `02-exercices.md` §3, les **variantes de parcours** au
  méso-macro, et les **types diagnostiques à part entière**. **Une ligne = un objet, aucun
  changement de schéma.**
  **Règle de la mesure secondaire (actée 29/07, RÉÉCRITE le 30/07 — A11 ; pool réaligné sur
  `competences[]` le 03/08 — A49)** — elle remplace « chaque exercice évalue 2-3 compétences ».
  La formulation du 29/07 disait « jamais celle qu'on travaille dans le cycle de la semaine » :
  elle reposait sur une **prémisse fausse** — qu'une seule compétence soit travaillée par
  semaine, alors qu'on en travaille plusieurs. Trois étages, à ne pas confondre (source :
  `01-routeur.md` §1.4) :
  1. **Contrainte dure** : la secondaire d'un exercice n'est **jamais la cible de cet exercice**.
     C'est la seule interdiction absolue. **Le pool des secondaires se lit « `competences[]`
     moins la cible »** — un champ de moins qu'avant, la contrainte inchangée.
  2. **Préférence, non interdiction** : on sonde **de préférence** ce qu'on n'entraîne pas dans
     le cycle. Une compétence travaillée ailleurs dans la semaine peut donc être sondée si un
     motif le justifie.
  3. **Motifs légitimes de sondage** : une compétence qui **semble stagner** (vérifier) ; une
     compétence dont le **niveau cible est atteint** (vérifier que ça tient).

  **Tous les exercices ne portent pas de secondaire**, et une compétence n'est sondée qu'**une
  fois par cycle**, au moment optimal — logique de **répétition espacée**.
  *La règle d'espacement elle-même appartient au routeur et y est **écrite depuis le 30/07** —
  `01-routeur.md` §6 : pool des candidates, priorités, une sonde par compétence et par cycle au
  moment optimal, plafond de sondes. `delai_jours` et `delai_mesures` en sont l'entrée.*
- **`exercices_references`** — les références décomposées : `source` (contenu/livre + localisation),
  `contenu` JSONB (problème, thèse, garants, moments, concepts), `validee_par` / `validee_at`
  (**une référence non validée n'est jamais utilisée en P2**). **Contrainte d'unicité + empreinte
  immuable** : un texte ne se décompose jamais deux fois, une référence validée ne se modifie plus
  en silence.
  **TROU DÉCLARÉ — le format de la référence n'est pas écrit, et il doit porter les LECTURES
  DÉFENDABLES** *(A48, 03/08 ; session dédiée « Questionnement ↔ Monitoring » du 02/08)*. Le
  `contenu` JSONB ci-dessus énumère problème, thèse, garants, moments, concepts — **il ne dit rien
  de ce qui se passe quand le passage admet plus d'une lecture**. *Raison, et elle est dure : **P2
  juge depuis le squelette contre cette référence**. Si le matériau admet deux lectures et que la
  référence n'en porte qu'une, l'élève ayant choisi la seconde est compté en **contresens** —
  l'exercice punirait exactement ce qu'il prétend récompenser.* **Ce qu'il faut : les lectures
  défendables et leur vraisemblance relative**, non un drapeau « ambigu ». *Forme suggérée, non
  actée : un enum — `lecture unique` / `n lectures équiprobables` / `une dominante et une
  secondaire` — dont la **crédence cible se dérive**.* **Ni objet, ni attribut de contrat, ni type
  nouveau : le manque est dans le format du matériau.** **Condition de fermeture : l'écriture du
  format**, dont le domicile est `02-exercices.md` §7, exigence (6). **Échéance : avant C5-L1.**
- **`exercices`** — les instances conçues : `type_id`, `planifie_id` FK →
  `scriptorium_exercices_planifies`, `classe_id`, **`lieu` (`maison`|`classe`
   — le LIEU de la passation, rien d'autre ; la valeur `lecture` disparaît ; *nommé `mode` jusqu'à
   **A52**, puis `contexte_passation` ; **A54** le réduit au seul lieu, la nature de l'épreuve passant
   sur la mesure*)**, `consigne_instanciee`,
  `reference_id?`, `fenetre_debut/fin`, **`borne_amont`** (journalisée à la décision — non-spoiler,
  voir plus bas), `statut` (`a_concevoir`→`concu`→`assigne`→`clos`), `bonus` bool.
  **LES TROIS VALEURS ÉLUES À LA CONCEPTION** *(A49, 03/08 — sans elles, quatre règles actées sont
  inexécutables)* : **`cran`**, le cran élu parmi les `crans[]` du type — *à ne pas confondre avec
  `competences_escalade.cran_escalade`, qui vaut N1/N2/N3* · **`provenance_materiau`**, la
  provenance choisie parmi celles admises **à ce cran** · **`support`**, l'étendue choisie dans la
  plage du type. *Ce que le seul `cran` commande : le **`regime_v1vf`** de cet exercice, la
  **`duree_exercice_min`** à décompter, la **`couverture_observables`** applicable — donc le
  candidat que N1 cherche —, et l'entrée de la règle de montée (A50).* **Les modes élus ne sont PAS
  repris ici** : `competences_mesures.modes` en est déjà la trace — *même geste qu'A42, on ne stocke
  pas deux fois le même fait.*
  **La `famille` d'une mesure NE se lit plus sur le type** *(A51, 03/08)* : elle se **dérive des
  modes élus de la mesure** — `composer` parmi eux → `composition`, sinon → `reception`. *Ce que la
  rédaction antérieure protégeait reste vrai, et vaut désormais par la dérivation : un diagnostique
  passé en réception est une ancre comme une autre — descente et plafond ancre + 2 s'y appliquent.*
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
    **`motif_depassement`** (`pause`|`difficulte`, **NULL** si la micro-question n'a pas été
    déclenchée ou pas répondue — **A30, 03/08** ; jamais notée, jamais renvoyée comme jugement,
    et **distincte du geste sur les conditions** ci-dessus, qui porte sur l'effort),
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
  `p2` JSONB, `modele`, **`prompt_version`**, **`instrument_version`**.
  **`lettre_equivalente` retirée d'ici** (fausse précision) — elle reste sur `competences_mesures`.
  **Index unique `(depot_id, competence, version)`** — le garde-fou d'idempotence.
  **`cout_api` EST RETIRÉ d'ici** *(A40, 03/08 ; arbitrage F21 du 30/07)* : le coût ne se stocke plus
  au grain du squelette, il **s'agrège en requête** depuis le journal par appel ci-dessous.
  *Deux copies d'un même chiffre finissent par diverger — règle déjà appliquée par A17.*

- **Le coût se journalise PAR APPEL et PAR PHASE** *(A40 — F21)*. Le domicile est le journal
  transverse **`api_couts`** (C11a), qui porte **déjà** le `modele` et **quatre compteurs de tokens**
  (entrée, sortie, cache en lecture, cache en écriture), plus l'attribution `eleve_id` / `classe_id`.
  **Ce qui lui manque, et que C3 exige** : la **`phase`** (`p1` | `p2` | `retour` — NULL hors
  exercices) et le **rattachement à l'exercice** (`depot_id`, `competence`, `version`) — **tous
  nullables, best-effort**, selon la doctrine déjà écrite de cette table : un coût non attribuable
  reste une ligne valide.
  **L'agrégation par élève, par type et par cycle se fait en requête** ; la jointure avec
  `routeur_decisions` est immédiate, ce journal portant déjà les sondes retenues et leur motif.
  *À ne pas doubler avec ce qui est acté depuis le 29/07 — plafond mensuel, alerte à 70 %, coupure
  automatique, plafond d'appels par dépôt : ceux-là disent **combien** on dépense, F21 dit **où**.*
  *Les deux temps de CODE de la chaîne en quatre temps (A20) ne journalisent rien : ce ne sont pas
  des appels.*
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
- **`competences_mesures`** — LA table de télémétrie : `eleve_id`, `competence` (**six
  identifiants NUS, sans préfixe de famille** — `expression`, `argumentation`, `structure`,
  `connaissance`, `synthese`, `questionnement` ; *le préfixe `ecriture.` / `lecture.` disparaît :
  A1 avait déjà constaté qu'il ne portait plus l'identité de la compétence, et les six traversent
  désormais les deux familles* — **A51, 03/08**),
  **`modes`** (**une LISTE, jamais une valeur** ; *le pluriel EST le nom — renommé de `mode` par **A52**, 03/08, aligné sur `exercices_types.modes[]`* — la condensation est « composer **et** restituer »,
  la problématisation nue « composer **et** questionner » ; *un même exercice nourrit ainsi les deux
  signaux : sur une explication de texte, l'Argumentation se mesure en `expliquer` et l'Expression
  en `composer`* — **A51**),
  `lettre_equivalente`, `observables` JSONB, **`lieu`** (`maison` | `classe` — *deux valeurs et pas davantage ; **A53**, 03/08*), **`forme`**
  (`formatif` | `sommatif` — ***A54**, 03/08 : `sommatif` veut dire **la mesure compte pour le
  verdict**, c'est-à-dire qu'elle peut faire **descendre** une lettre ; les trois diagnostics en
  classe, les DS ingérés, la synthèse en classe et l'essai de Fragments sont tous `sommatif`*), **`classe_id` NULLABLE** (remplace
  `provenance`).
  **`famille` N'EST PLUS UNE COLONNE** *(A51, 03/08 — révise A1)* : elle se **dérive de `modes`** —
  `composer` parmi les modes élus → `composition`, sinon → `reception`. **Ses deux valeurs ne sont
  plus `ecriture` et `lecture`.**
  **`sonde_montee`** booléen *(A50, 03/08 ; entrée 28)* — une mesure issue d'une **sonde de montée**
  **ne compte ni dans la fenêtre d'acquisition des observables, ni dans la stagnation** ; elle ne
  sert qu'au déclencheur de la règle de montée. *Sans ce marquage la règle se retourne contre
  elle-même : la sonde est **au-dessus** du niveau de l'élève, il la rate souvent, deux échecs dans
  une fenêtre de quatre font tomber un observable sous les 2/3 — et **N1 se déclencherait sur un
  élève qui progresse**.* **À ne pas confondre avec les sondes secondaires** de la règle
  d'espacement (`01-routeur.md` §6), qui mesurent une compétence **non ciblée** et qui, elles,
  comptent.
  **Deux valeurs s'en DÉRIVENT et ne s'y stockent jamais** *(A33, 03/08 — voir §4)* : le
  **signal de ciblage par famille**, et la **valeur non plafonnée** sur laquelle R2 élit.
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
  **Aucun champ de dispersion, et c'est une décision** *(A43, 03/08)* : **la dispersion est une
  propriété de l'INSTRUMENT, pas de la mesure** — elle se mesure au banc et se lit par
  `instrument_version`, déjà porté ici. *Un tirage unique ne peut pas déclarer sa propre
  instabilité : la colonne serait vide, ou coûterait de répliquer chaque appel en production.*
  **A8 — le Monitoring n'entre pas dans cette table.** Il a ses tables propres (ci-dessous) : son
  état n'est pas une lettre, et le mélanger ici obligerait toute requête sur les niveaux à savoir
  laquelle des deux formes elle lit.
- **`competences_niveaux`** — l'état affiché : `eleve_id`, `competence`, **`lettre` NULLABLE**,
  `derniere_ancre_at/valeur`, `statut_recette` (`evaluee`|`mesuree_silencieusement`|`differee`),
  **`profil_provisoire`** bool, `updated_at`. **PAS de `classe_id` dans la clé** : le profil est
  **unifié par élève × compétence** — décision actée du 17/07 et **confirmée le 29/07 par A1** (les deux parcours ont les **six** compétences (**A51**, 03/08) ; ce qui varie est la **famille** dans laquelle chacune est active — donc une lettre unique par élève × compétence, alimentée par les deux familles), échelle commune, et
  règle R6 du routeur. Aucune lettre affichée avant l'allumage. **Le Monitoring n'y figure pas
  (A8).**

  **`lettre` est NULLABLE, et l'absence de lettre est une règle, pas un cas limite** *(A39, 03/08 ;
  arbitrage F19 du 30/07)*. **Une compétence sans lettre n'est ni ciblable, ni sondable, ni
  plafonnée, et n'entre dans aucun départage.** *Domicile de la règle : `01-routeur.md` §3.*
  **Deux causes connues.** *(1)* Un élève **inscrit tardivement**. *(2)* Tant que le **pont E→A**
  n'est pas validé : la passation a lieu, les champs extraits sont conservés au journal, **aucun
  niveau n'est produit**, et le niveau **se calcule rétroactivement sur des seuils observés** quand
  le pont existe. **PÉRIMÈTRE FIXÉ LE 03/08** *(**A51** ; il remplace la formulation
  périmée du 30/07, « les cinq compétences de lecture »)*. Au sortir du **diagnostic de la semaine
  1**, les deux compétences sans lettre sont la **Connaissance** et le **Questionnement** — aucune
  des deux passations ne les mesure (§1, point 4). **Par où chacune entre, puisque « sans lettre »
  vaut « ni ciblable ni sondable »** : la **Connaissance** est **hors rayon** — R4 en fait une
  compétence *jamais cible primaire*, et son signal continu est **Quazian**, qui n'écrit pas dans le
  profil ; le **Questionnement entre par le segment 2**, les trois semaines de **calibration**, où
  R2 est suspendue au profit de la **couverture** (`01-routeur.md` §4 et §5). *Réserve inscrite : le
  seuil de couverture du segment 2 est écrit « par compétence **`evaluee`** », statut que le
  Questionnement n'aura pas à la rentrée, sa fiche n'étant pas écrite — le point rejoint le régime
  du statut `differee`, ouvert au chapitre 5 de la passe.*
  *Pourquoi C3 doit la porter et pas seulement le routeur : **R1, R2 et son départage, R3, le seuil
  du Questionnement, la table des proportions, le cran de la couche 3, le plafond et la descente
  lisent tous une lettre**, et aucun ne prévoyait qu'elle puisse manquer — alors que la discipline
  inverse, « NULL n'est pas 0 », est posée ailleurs dans les deux documents.*

- **`competences_escalade`** — **table neuve** *(A41, 03/08 ; angle mort G4 du relevé du 30/07)*.
  **C3 §6 héberge l'état du routeur ; le `01-routeur.md` reste le domicile des RÈGLES qui le
  lisent.** *Motif : le routeur §2 nomme lui-même le « domaine partagé du profil » —
  `competences_niveaux`, `competences_mesures`, `competences_actives_par_classe` —, qui sont des
  tables d'ici ; et son §3 y déclare des champs **stockés** qui n'avaient aucune colonne. Le lot
  C4-L1 crée « toutes les tables du §6 » : sans cette table, C4-L2 implémenterait l'escalade sur un
  état inexistant en base.*
  Clé **(élève × compétence × observable)** — *l'escalade est indexée par observable : un élève peut
  être en N2 sur `garant_cite` en Argumentation et en régime normal partout ailleurs.*
  Champs : **`cran_escalade`** (`N1` | `N2` | `N3` — *renommé le 03/08, **A49** : `cran` seul
  désigne désormais le cran d'autonomie élu, porté par `exercices`*) · **`entre_n1_at`** — *lue par une règle : la double
  condition de N3 exige « au moins X semaines depuis l'entrée en N1 »* · **`n3_ouvert_at`** (la date
  d'ouverture du dossier, NULL avant N3) · **`n3_traite_at`** NULLABLE · `updated_at`.
  **Le re-signalement est une règle du routeur, pas un objet d'ici** : passé N semaines sans
  traitement, le dossier remonte en tête de l'écran professeur (`01-routeur.md` §6). *Pas de plafond
  hebdomadaire ni de file priorisée — le débit attendu ne les justifie pas.* **Aucun lot de
  C4/C5/C6 ne construit cet écran** ; C3 n'en porte que l'état.

- **`competences_montee`** — **table neuve** *(A50, 03/08 ; entrée 28)*. L'**état de progression**
  que la règle de montée lit et écrit. Clé **(élève × compétence × grain)**, champs
  **`cran_atteint`** et `updated_at` — deux ou trois petits entiers par compétence, rien de plus.
  *Forme retenue plutôt que trois colonnes `cran_atteint_micro` / `_meso` / `_macro` sur
  `competences_niveaux` : trois colonnes graveraient l'énuméré des grains dans des noms de
  colonnes.*
  **Tout le reste se DÉRIVE** : masse principale au cran courant de chaque grain **et en dessous**,
  **sonde juste au-dessus**. **La distribution elle-même ne se stocke jamais** — *elle diverge du
  jour où on l'écrit.*
  **Règle de prérequis, écrite ici parce qu'un lot la lit** : *on ne monte au grain supérieur
  qu'après avoir atteint le cran au grain inférieur.*
  **Le déclencheur** *(décision de Louis, 01/08)* : **deux sondes de montée réussies à la même
  case** déplacent la masse — pas de taux, pas de fenêtre glissante. *Le critère d'acquisition
  ordinaire (≥ 2/3 sur les 3-4 dernières mesures) a été écarté **sur chiffrage** : un élève coté D
  en Expression accumule de l'ordre de 60 mesures dans l'année pour une dizaine de cases, et les
  cases de sonde n'en recevraient que deux ou trois, étalées sur des mois. Coût assumé : le premier
  report arrive vers la dixième semaine.*
  **POURQUOI UN ÉTAT STOCKÉ ET NON UNE DÉRIVÉE DU JOURNAL** *(vérifié le 03/08, la question étant
  devenue possible)*. `competences_mesures` porte désormais de quoi le recalculer — `sonde_montee`,
  plus le `cran` de l'instance. **Mais c'est un ÉTAT, pas une trace** : recalculé, un changement
  d'`instrument_version` ou une mesure requalifiée ferait **redescendre** un élève d'un cran sans
  que personne ne l'ait décidé. *C'est la distinction que le `01-routeur.md` §3 pose lui-même entre
  `registre_retour` et `exercices_retours.registre` — et c'est pourquoi A42 a pu dériver
  `historique_cibles`, qui n'était, lui, qu'une trace dupliquée.*
  **DATÉ : avant que C4-L1 crée les tables.**

- **`competences_niveaux` reçoit `registre_retour`** *(A41)* — le registre courant du retour
  (`descriptif` | `interrogatif` | `demonstratif`), **troisième champ déclaré stocké** par le
  `01-routeur.md` §3 et sans colonne jusqu'ici. **À ne pas confondre avec
  `exercices_retours.registre`**, qui enregistre celui qui a effectivement servi sur un dépôt
  donné : *ici c'est l'état, là c'est la trace.*

- **`monitoring_mesures`** — **nouvelle table (A8, 29/07)**. Le Monitoring est une compétence de
  **second ordre** : il ne se note pas, il n'est **jamais cible du routeur**, ses deux
  sous-dimensions **ne se moyennent pas** (échelles différentes), et son état n'est pas une lettre.
  Lui donner des tables propres rend cette différence visible dans le schéma au lieu de la cacher
  derrière des colonnes vides.
  `eleve_id` · **`sous_dimension`** (`lucidite_incompris` | `calibration_confiance` — *[à valider]*,
  cf. §1.1) · **`amplitude_ecart`** (0 calibré → 3 massif ; *nombre de crans provisoire*) ·
  **`direction`** (`surconfiance` | `sous_confiance` | **NULL quand l'amplitude vaut 0**) ·
  `observables` JSONB (`aveu_incomprehension`, `marquage_supposition` pour la lucidité ;
  `confiance_declaree`, `calibration` pour la calibration) · **`lieu`** · `famille` ·
  **`classe_id` NULLABLE** (même règle qu'A3) · `depot_id?` ·
  **`competences_couvertes[]`** — voir la règle de périmètre ci-dessous · `delai_jours` ·
  `delai_mesures` · `prompt_version`, `modele`, `instrument_version` · `created_at`.

  **TROU DÉCLARÉ — la table de conversion vers l'amplitude 0-3 s'écrit APRÈS collecte** *(A44,
  03/08 ; arbitrage F8 du 30/07 ; ouverture 21 du tableau de bord B)*. Les **événements bruts** se
  collectent **dès le premier exercice de septembre**, comme A8 l'exige ; **`amplitude_ecart` et
  `calibration` restent NULL** tant que la table n'existe pas. *Même discipline que les ancres de
  lecture et que F19 : collecter d'abord, convertir ensuite — sur des seuils **observés**, jamais
  posés d'avance.* **Trois trous à combler quand elle s'écrira** : la frontière entre amplitude 2 et
  3 n'est pas dénombrable · la source globale (« sûr / pas sûr » contre le niveau obtenu) n'a
  **aucune** correspondance vers l'échelle 0-3 · rien ne dit comment les deux sources se combinent.
  **Condition de fermeture : l'existence de la collecte 2026-27.**

  **Trois règles qui sont des contraintes d'implémentation, pas des commentaires :**
  1. **Le Monitoring tourne en dernier**, après toutes les autres mesures du dépôt — il en dépend.
  2. **Sa validité est plafonnée par celle des autres compétences**, d'où la règle de périmètre
     chiffrée : **la calibration ne compte que sur les compétences dont le banc a passé la recette**
     (le critère du §1.7 — ≥ 15 copies, accord ±1 ≥ 80 % au grain de la cellule). `competences_couvertes[]` enregistre
     lesquelles ont compté, faute de quoi on ne saura jamais relire la mesure.
  3. **La lucidité est une observation directe de la Phase 1** (aucune comparaison) ; **la
     calibration est dérivée**, de deux sources — en local la phase « se juger » (comparaison **par
     le code, jamais par l'IA**, entre les réponses de l'élève et le squelette), en global la
     confiance déclarée à la remise de la v1 confrontée au niveau obtenu.

  *Dépendance d'interface, à ne pas perdre de vue* : toute cette télémétrie suppose que l'écran
  demande sa confiance à l'élève. C'est acquis — §3, temps 2 — mais si ce geste disparaît de
  l'interface, le Monitoring n'a plus d'objet.

- **`monitoring_niveaux`** — **nouvelle table (A8)**, l'état affiché : `eleve_id` ·
  `sous_dimension` · `n` (nombre de mesures) · `statut_recette` ·
  **`profil_provisoire`** bool · `updated_at` — **plus les colonnes propres à chaque
  sous-dimension, car les deux n'ont pas la même forme** *(A37, 03/08 ; arbitrage F8 du 30/07 — la
  rédaction antérieure donnait une amplitude et une direction aux deux)* :

  - **`calibration_confiance`** : **`amplitude_courante`** (0 calibré → 3 massif, *nombre de crans
    provisoire*) · **`direction_courante`** (`surconfiance` | `sous_confiance`, **NULL quand
    l'amplitude vaut 0**).
    **Le progrès est l'amplitude qui baisse ; la direction est un diagnostic, jamais un niveau.** Et
    les deux directions ne se valent pas : à amplitude égale, la **surconfiance** bloque
    l'apprentissage — l'élève cesse de travailler ce qu'il croit tenir — tandis que la
    **sous-confiance** coûte du moral, pas la vue. Elles appellent des réponses différentes ; le
    schéma doit permettre de les distinguer, l'affichage aussi.
  - **`lucidite_incompris`** : **`taux_lucidite`** (0-1) · **`n_fenetre`** (la taille du
    dénominateur, à distinguer de `n` qui compte toutes les mesures).
    **C'est un taux sur fenêtre, à dénominateur restreint** — *parmi les exercices de la fenêtre où
    le squelette montre un échec sur au moins un observable, dans combien l'élève a-t-il signalé un
    incompris (`aveu_incomprehension`) ou marqué une hypothèse (`marquage_supposition`) ?* **Ni
    amplitude, ni direction** : « surconfiance » n'a aucun sens appliqué à cette observation, et le
    champ serait structurellement vide — ce qu'A8 refusait précisément en créant des tables propres.
    **Ni booléen** : il ne montrerait aucun progrès. **`n_fenetre` = 0 ⇒ `taux_lucidite` NULL,
    jamais 0.** Le dénominateur restreint désamorce ainsi l'artefact de l'élève qui lisse tout :
    n'ayant rien raté, il obtient NULL, pas un mauvais score.
    **[à valider] — la longueur de la fenêtre n'est fixée nulle part**, ni ici, ni au §3 du
    `01-routeur.md`, ni à son registre des paramètres du §11. Un lot ne peut pas calculer ce taux
    sans elle.

  **Les colonnes ne se croisent pas** : `amplitude_courante` et `direction_courante` sont NULL sur
  les lignes `lucidite_incompris` ; `taux_lucidite` et `n_fenetre` sont NULL sur les lignes
  `calibration_confiance`.
  **Aucun champ neuf sur `monitoring_mesures`** — le numérateur se lit aux observables
  `aveu_incomprehension` et `marquage_supposition` que son JSONB porte déjà, le dénominateur aux
  mesures du même dépôt. Domicile de la règle : `01-routeur.md` §3.
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
  **Plus deux compteurs de minutes, par élève et par cycle** *(**A34, 03/08** — arbitrage F1 du
  relevé du 30/07)* : **minutes assignées** (la somme des `duree_exercice_min` des exercices que le
  routeur a posés) et **minutes de budget** (le plancher/plafond de l'élève, §4). *À quoi ils
  servent : dire dès novembre si la calibration du grain macro sur la fourchette hebdomadaire tient
  — c'est-à-dire si les durées déclarées des types remplissent réellement le budget. Retenu comme
  **gratuit** en F1 : les deux nombres existent déjà, l'un dans les types assignés, l'autre au
  profil.* **Le rapprochement est d'autant plus utile depuis A30** : la durée déclarée est
  **indicative** et le temps réel est mesuré à côté — l'écart entre les deux se lira ici.
  *L'indicateur lui-même a son domicile au **§10 du `01-routeur.md`**, où il est déjà inscrit ; ce
  qui est écrit ici, c'est seulement d'où viennent les deux nombres.*
- **Gates** : **`exercices_actif`**, **`routeur_actif`**, **`competences_affichage_actif`** (patron
  `rag_actif`, même emplacement). Tous OFF jusqu'à la recette.
- **Journal du routeur** : `routeur_decisions` — élève, slot, cible, **`famille`**, règle déclenchée,
  alternatives écartées, choix élève, tirage aléatoire journalisé, **`borne_amont` retenue**. **Tout
  override prof est journalisé** (`origine` + entrée de journal).
  **`historique_cibles` N'EST PAS UNE STRUCTURE À CRÉER : c'est une requête sur ce journal** *(A42,
  03/08 ; arbitrage de Louis)*. La liste ordonnée des cibles des derniers exercices, que R5 consomme,
  se lit ici — *un journal qui porte déjà « la cible » n'a pas besoin d'une seconde liste des mêmes
  cibles*. **C'est le geste qu'a fait le routeur lui-même le 30/07** en supprimant son champ
  `evidence` stocké : « la table `competences_mesures` **est** le journal complet des mesures ;
  stocker une seconde copie, c'est fabriquer deux sources ».
  **La clé `famille` demandée par F11 devient donc une colonne DE CE JOURNAL**, non d'une liste.
  *Sans elle, R5 est inerte dès qu'un cycle mêle les deux familles — elle compte la couverture au
  sein de chacune.* **Ce n'est pas une redite du `famille` porté par `competences_mesures`** : là
  c'est la famille d'une **mesure obtenue**, ici celle d'une **décision prise**. *Même distinction
  que `registre_retour` (l'état) et `exercices_retours.registre` (la trace), posée par le
  `01-routeur.md` §3.*

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
- **durée** très inférieure à **`duree_exercice_min`**, la durée déclarée du type (redevenue
  mesurable) *(**A30, 03/08** — le §3 nommait jusqu'ici `duree_redaction_min`, supprimé : les
  deux sections ne lisaient pas le même champ)* ;
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
  horodatée, le retour final cite le progrès réel, une tentative de collage est journalisée,
  **et une copie rédigée en plusieurs paragraphes arrive à la mesure avec ses retours à la
  ligne intacts** *(A28)*.
  **Le champ de rédaction doit encourager et préserver le découpage en paragraphes** *(**A28,
  03/08** — condition de fermeture du trou déclaré au §2 : le découpage en blocs, sur lequel
  Structure est mesurée, est donné par les paragraphes).*
  *Manifeste* : cette spec **§2**, §3, §5, §7 · `NOTE-CYCLE-PEDAGOGIQUE.md`.
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
- **L5 — Mesures & niveaux** : chaîne **en quatre temps** **par compétence** — P1 (modèle) →
  **code qui prépare** → P2 (modèle) → **code qui agrège** les observables en dimensions et en
  niveau (§0). **Les deux temps de code appartiennent à ce lot** : le modèle ne rend ni niveau, ni
  dimension, ni décompte. Prompts de conception, appels froids, **lancés en parallèle** — contrat
  de latence 3 min. Puis `competences_mesures` (M1/M3 avec les
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
  **Le format de la référence doit porter les LECTURES DÉFENDABLES et leur vraisemblance relative**
  *(**A48, 03/08** — trou déclaré au §6 : sans elles, P2 compte en **contresens** l'élève ayant
  choisi la seconde lecture d'un passage qui en admet deux).*
- **L2 — Passation élève** : mêmes cinq temps, retour **ancré au texte** (citations de l'extrait).
- **L3 — Mesures en réception** : P1/P2 **des compétences dont la grille réceptive existe**
  *(**A51**, 03/08 — il n'y a plus « cinq compétences de lecture » ; la formulation se remplit
  d'elle-même à mesure que les fiches arrivent, et aucune session ne construit un instrument
  manquant)*. **Un instrument par compétence, non par (compétence × mode)** : `statut_recette` reste
  **sur la compétence** (F3), et c'est le **protocole de banc** qui impose d'éprouver chaque mode.
  Prompts de `prompts-inventaire.md`,
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
- **L4 — Branchement essai-Fragments** : l'essai évalué par la chaîne (**déclencheur à dériver — trou déclaré B, **A53****) — activation à la décision de recette. *(Coupes : courbes d'évolution ;
  push différé si S4 déborde.)*

**Prompts de session** : déposés chantier par chantier au fil des cycles (boucle §8 du plan) —
`PROMPT_Code_C4_L1.md` et `PROMPT_Code_C4_L2.md` sont déposés au gel du 29/07.

---

## 10. Risques identifiés (révisés au gel du 29/07)

1. **Le pipeline de transcription en semaine 1**, resserré par le §3bis : la transcription doit
   revenir **en quelques secondes par copie**, **pendant l'heure de cours**, pour ~35 élèves
   simultanés. Tester la file en charge dès C4-L4, **à 140 copies**.
2. **Coût API.** 70 élèves × **7 couples (compétence × passation)** × 2 phases = **980 appels**
   pour la seule semaine 1 *(**A51, 03/08** — le compte « (6+5) » qui figurait ici en valait 1 540 ;
   le partage réel est arrêté au **§1, point 4** : trois compétences sur l'essai, quatre sur
   l'explication)* ;
   en régime, **de l'ordre de 2N + 4 appels par exercice** — *ordre de grandeur de conception et
   non chiffre de pilotage : aucune règle ne s'y appuie, la télémétrie fait foi (**A21, 02/08** —
   voir §0)*. *Ordre de grandeur annuel révisé le 30/07 (A12, A13) :
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
