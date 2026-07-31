# FUSION des deux revues adversariales — RÉFÉRENTIEL + ROUTEUR (table d'arbitrage)

**Assemblée le 30 juillet 2026 par Mètis**, à partir de deux revues adversariales externes du même
couple de documents :

| Source | Préfixe | Contenu |
|---|---|---|
| `revue_adversariale_referentiel_routeur_opus.md` | **O** | 17 constats (O1-O17) + 10 lignes de vrac + 4 angles morts |
| `revue_adversariale_referentiel_routeur_codex.md` | **C** | 14 constats (C1-C14) + 9 lignes de vrac + 3 angles morts |

Les deux relecteurs ont travaillé sur **`00-referentiel.md` + `01-routeur.md` + le contrat
d'interface de l'annexe A du prompt de séance, et rien d'autre.** Ils n'avaient ni la bibliothèque
de types (`02-exercices.md`), ni les fiches de compétences (`03-`, `04-`), ni la SPEC C3
(= le contrat de construction, `SPEC_C3_exercices_competences.md`). Plusieurs de leurs constats
tombent donc sur des points déjà réglés ailleurs ; ils sont signalés comme tels en **section E**,
avec la preuve, et ne sont pas comptés comme défauts.

**Le détail complet de chaque constat reste dans les deux fichiers source** — cette table y renvoie
par référence `[On]` / `[Cn]` et ne les recopie pas.

**La revue O déclare une passe d'auto-vérification** — « sept constats de la première rédaction ont
été **retirés ou rétrogradés** ». Elle ne les énumère pas, et cette table ne peut donc pas certifier
qu'ils ont disparu : ce qui a été vérifié est plus étroit, et il est écrit en section E. **Les deux
revues ont été passées au même crible** — aucun constat de C n'a été retenu sur sa seule autorité,
aucun constat d'O n'a bénéficié de son auto-vérification déclarée.

> **Cette table prépare l'arbitrage, elle n'arbitre rien.** Les recommandations qu'elle porte sont
> marquées « *Recommandation fusion* » et n'ont aucune valeur de décision.

---

## Lecture rapide

**27 items fusionnés (F1-F27)**, dont **20 demandent un arbitrage de Louis** (marqués ⚖️) — la
proportion est haute parce que les deux revues comptent 14 constats `BLOQUANT` à elles deux et que
quatre items contestent explicitement une décision **actée** (F13, F16, F17, F23). **Sept convergences franches** — cinq portées par un item (F2, F4, F7, F9, F16),
deux hors items (une ligne de vrac en section D, et l'angle mort Loi 25) — et **quatre
rapprochements** de constats voisins (F10, F13, F15, F21). Le reste est propre à l'une des deux
revues.

**Les deux revues convergent massivement sur cinq zones** : (1) le **statut de recette** — ce que
des instruments non bancés écrivent dans le profil, par les sondes et par le repli
`mesuree_silencieusement` ; (2) le **contrat d'interface** de l'annexe A, qui ne porte ni les
observables qu'un type isole ni la richesse de sonde ; (3) la **durée d'exercice**, scalaire face à
un régime v1→vf (= première version → version finale) qui change à l'exécution ; (4) le
**Questionnement fusionné**, une seule lettre pour deux instruments d'inégale validité ; (5) le
**profil provisoire**, qui bascule sur une date et non sur une preuve.

---

## A. BLOQUANT — à trancher ou à écrire avant les deux sessions dédiées et avant la réécriture des lots C4

**F1 ⚖️ — Le plancher macro du segment 5 ne rentre pas dans le budget hebdomadaire, et la règle « jamais à cheval sur deux cycles » interdit de l'étaler.** `[O1]`

Le seul repère de durée chiffré des deux documents est l'encadré du §1 du routeur : **75-90 minutes
pour une rédaction de 45 minutes**, « le temps total de l'exercice ». Le budget d'un élève de TC
(= tronc commun) est de **45-60 minutes par cycle** (= par semaine), plus 30 optionnelles. Or le §4
pose comme garde-fou de la décision actée du 30/07 qu'« au segment 5, la part macro a un plancher
**pour tous les niveaux** », tandis que le §8, passé le même jour, écrit l'inverse : « Le budget
plateforme reste ainsi presque entièrement **micro/méso** ». Un exercice macro complet ne tient donc
ni dans une semaine, ni sur deux, puisque le §9 interdit à un exercice de chevaucher deux cycles.

*Vérification.* Les deux phrases existent, mot pour mot, aux endroits cités. Le §10 (télémétrie)
ne journalise **aucune réconciliation entre les minutes assignées et le budget de l'élève** :
l'échec serait donc invisible jusqu'en mai. **Une nuance qu'O n'a pas vue** : le §11 (registre des
paramètres) qualifie la règle de rythme d'« **Acté sur le principe** ; modalités selon l'emploi du
temps réel », là où le §9 la donne comme actée sèche. Le degré de liberté existe donc, mais il
n'est écrit qu'au §11. *À trancher : laquelle des deux règles cède. Recommandation fusion : écrire
au §4 que le grain macro du segment 5 est porté par les **passations en classe** (DS = devoir
surveillé, diagnostics) et non par le budget plateforme — ce que le §8 dit déjà — et reformuler le
plancher en plancher de passations ; plus un compteur « minutes assignées / minutes de budget » au
§10.*

**F2 ⚖️ — Les sondes font monter les lettres de compétences dont l'instrument n'a pas passé la recette, et rien ne recalcule à la bascule de statut.** `[O3 + C3 — convergence]`

Le §6 admet dans le pool des sondes les compétences de statut `evaluee` **ou**
`mesuree_silencieusement` (« R0 restreint le ciblage, pas la mesure »). Le §7 pose qu'« une sonde
réussie compte pour la montée ; une sonde échouée ne compte **jamais** contre la lettre ». Pour une
compétence `mesuree_silencieusement`, la composition des deux produit une lettre que les sondes ne
peuvent que faire **monter** — construite par un instrument non bancé. Or le `00-referentiel.md` §6
pose que le profil « n'est alimenté **que** par des instruments bancés », et le routeur §2 s'appuie
sur cette phrase même pour refuser à Quazian le droit d'écrire au profil. Le jour où la compétence
passe `evaluee`, cette lettre devient affichée et devient l'entrée du ciblage lecture (§13) —
**aucune règle ne prévoit de recalcul, de remise à zéro ni de marquage à la transition**.

*Vérification — et le constat en sort renforcé, pas affaibli.* La SPEC C3, arbitrage du 29/07,
item F3, pose un **défaut de sécurité** : « une compétence **naît** `mesuree_silencieusement` et ne
devient `evaluee` que par un acte explicite de Louis ». Ce n'est donc pas un cas de repli : c'est
l'état **initial de toutes les compétences**. Le chemin décrit par les deux revues est le régime
nominal de septembre. *À trancher : les sondes comptent-elles pour la montée d'une compétence non
`evaluee` ? Recommandation fusion : non, et une phrase au §3 sur le recalcul depuis les seules
mesures postérieures à la recette (les antérieures restant au journal, distinguées par
`instrument_version`).*

**F3 ⚖️ — Le statut de recette porte sur la compétence, alors que c'est l'instrument qui est bancé.** `[C2]`

`statut_recette` vit dans l'état par élève × compétence (§3) et vaut pour la compétence entière.
Une fois Argumentation passée `evaluee` sur un paragraphe micro avec l'instrument v1, le routeur
peut servir une dissertation macro, un autre genre, ou une version de prompt postérieure : ces
mesures non bancées alimentent lettres et escalade. R0 (= le filtre de recette) ne filtre aucun de
ces axes. Le versionnage du §10 (`prompt_version`, `modele`, `instrument_version`) permet de
constater l'écart **après coup**, jamais de l'empêcher.

*Vérification — un précédent mesuré existe, et aucune des deux revues ne l'a cité.* Le
`00-referentiel.md` §4.3 documente l'**offset d'axes** de juin : sur 1 280 appels,
« sur l'axe thèse, la machine est trop indulgente, d'environ un cran sur le milieu de gamme ; sur
l'axe arguments, trop sévère, d'environ un cran sur le haut », avec une faible variance — donc
« ce n'est pas du bruit, c'est un problème de calibration ». Le §7 ne
lève un drapeau qu'à partir d'une « **Discordance ≥ 2 crans** entre trajectoire maison et ancre » :
un offset d'un cran ne suffit donc pas à lui seul. Mais il **consomme la moitié de la tolérance** —
un écart réel d'un seul cran entre le travail maison et l'ancre atteint alors le seuil, et « la
lettre suit l'ancre **et** un drapeau part vers le professeur (aide extérieure ? stress ?
conditions ?) ». Or le régime de modèle envisagé (Haiku pour l'hebdomadaire, Sonnet pour les
ancres — ouverture n° 8 de C3, encore ouverte) est précisément une différence d'instrument entre
les deux canaux que le §7 compare. *Précision à ne pas perdre : l'offset de juin est mesuré entre **deux axes
d'un même instrument** dans la famille lecture, pas entre deux familles ni entre deux modèles — il
établit qu'un instrument peut décaler d'un cran sans bruit, pas que ces deux axes-là décalent.
L'argument propre de C pour la famille est ailleurs, et il est solide : « un banc réussi côté
écriture peut rendre la compétence ciblable côté lecture alors que ce versant n'a pas passé sa
recette » — c'est le cas du Questionnement (F7). À trancher : la clé de la recette s'étend-elle à
(compétence, famille, type, `instrument_version`, régime de modèle) ? Recommandation fusion : la
**famille** d'abord, seul axe où le défaut est démontré sur un cas nommé ; le régime de modèle
ensuite, comme risque à surveiller au banc plutôt que comme clé.*

**F4 ⚖️ — Le contrat d'interface ne dit ni quel observable un type isole, ni quelle sonde est la plus riche : N1 et la règle d'espacement n'ont pas d'entrée.** `[O6 + C4 — convergence]`

Toute la machinerie d'escalade est indexée sur les **observables** : `etat_escalade` est « indexé
par observable » (§3) ; N1 (= premier cran d'escalade) consiste à « Identifier le sous-défaut
dominant… choisir dans la même famille un type qui l'**isole** » (§6) ; la désescalade se déclenche
« dès que l'observable ciblé change de statut ». Le contrat, lui, est indexé sur les **compétences**
— `competence_primaire`, `competences_secondaires[]`, `grain`, `geste`, complexité. **Aucun de ses
onze attributs ne dit quels observables un type expose.** Même trou pour la sonde : le §6 veut
retenir l'exercice « dont le type offre le **substrat le plus riche** », mais
`competences_secondaires[]` n'exprime qu'une éligibilité binaire (vérifié dans C3 : « les
secondaires **ÉLIGIBLES** »). Deux types également éligibles sont indiscernables.

*Vérification.* C'est exactement le test que la règle 6 du prompt de revue demandait d'appliquer au
contrat, et l'annexe A est explicitement dans le périmètre. Aggravant : le pipeline du §5 **n'a
aucune branche d'échec** — rien ne dit ce qu'il advient quand aucun type ne satisfait la contrainte,
alors que le cas se présentera au premier N1 avec 2 à 4 types par compétence, et que le §10
journalisera « N1, intervention appliquée » comme si l'escalade avait fait son travail. *À trancher :
la forme de l'attribut. O propose `observables_isoles[]` ; C propose une couverture à trois valeurs
(« exercé » / « isolé » / « seulement observable ») plus un rang de richesse par compétence
secondaire. Recommandation fusion : la proposition de C, qui sert les deux règles d'un coup ; plus
la clause de repli d'O au §6 (« si aucun type n'isole l'observable dominant, N1 dégrade en retour
mono-focal sur le type courant, et le journalise comme dégradé »).*

**F5 — N3 est une règle de couche 2 écrite en couche 3 : le pipeline ne peut pas l'appliquer.** `[O5]`

Le pipeline du §5 place l'escalade **après** l'élection de la cible (« sinon : R2 propose la
cible / R5 filtre (rotation, en exercices) / → couche 3 : type, étayage, registre (+ escalade §6) »), et le §4 confirme :
« C'est ici que s'exécute l'escalade anti-stagnation (§6) ». N1 et N2 sont bien des opérations de
couche 3. **N3 non** : il retire la compétence du pool des cibles (« la compétence quitte les cibles
primaires… le primaire allant à la compétence suivante »). C'est une opération de couche 2, et R2
n'en sait rien — sa définition est « la plus faible du trio », sans filtre d'escalade. Une
compétence en N3 est par définition celle qui stagne, donc la plus faible, donc celle que R2 réélit.

*Vérification.* Confirmé sur pièces ; rien ailleurs dans les deux documents ne retire une compétence
en N3 du pool de R2 (le §6 ne la mentionne qu'en priorité 1 des **sondes**). Le seul comportement
implémentable en l'état est que N3 n'ait **aucun effet sur le ciblage**, alors que le §6 le justifie
par l'inverse (« le coût motivationnel d'un neuvième essai automatique dépasse son bénéfice
espéré »). *Correctif sans arbitrage : une ligne au-dessus de R2 dans le pseudo-code — « filtre N3 →
les compétences en régime d'entretien sont retirées du pool de R2 » — et corriger la phrase du §4.*

**F6 ⚖️ — La voie mixte réinstalle en régime nominal le scénario que R0 existe pour empêcher, et rien ne dit ce que produit un exercice commun.** `[O2]`

R0 énonce : « Aucune règle ne peut proposer une compétence dont le statut n'est pas `evaluee` », et
sa raison est explicite — « un élève qui ferait un cycle entier sur une compétence non bancée
arriverait au retour… **qui n'existe pas, faute de verdict** ». Le §1.5 remplit ensuite le reste du
budget avec les « exercices communs imposés par le professeur », et le §1.8 en fait « le mode de
fonctionnement **nominal** de septembre ». Trois questions restent sans réponse : cet exercice
produit-il une mesure ? Si oui, sur quel instrument, puisque la recette n'est pas passée ? Si non,
l'élève reçoit-il un retour sans verdict, et lequel ?

*Vérification — le constat tient, avec deux nuances.* (1) La question de la **mesure** est
partiellement réglée par le `00-referentiel.md` §6 (le profil n'est alimenté que par des instruments
bancés) et par l'existence du statut `mesuree_silencieusement` ; la question du **retour** ne l'est
nulle part. (2) O écrit que les exercices communs portent « par construction » les compétences
écartées par R0 ; le texte ne le dit pas — il dit seulement que le trou du budget vient du manque
de compétences `evaluee`, ce qui rend le cas très probable sans le rendre nécessaire. **Le lieu où
la réponse doit s'écrire existe déjà** : la « **matrice normative par statut de recette** : pour
chaque état…, ce qui tourne et ce qui est masqué » est annoncée dans la SPEC C3 (arbitrage F3 du
29/07) et **son contenu n'est pas écrit**. *À trancher : ce que produit un exercice commun portant
une compétence non `evaluee`. Recommandation fusion : « ne produit pas de mesure et ne produit qu'un
retour non-verdictif (registre descriptif, sans niveau) », écrit dans la matrice de C3 plutôt qu'au
cas par cas ; plus un attribut `produit_mesure` au contrat.*

**F7 ⚖️ — Le Questionnement a une lettre unique pour deux instruments d'inégale validité, aucune règle de résolution, et deux règles de ciblage qui se contournent l'une l'autre.** `[O8 + C1 — convergence sur le défaut, deux scénarios distincts]`

Le §2 tranche la clé : « une lettre par élève × compétence, **alimentée par les deux familles** ».
Trois conséquences que personne n'avait suivies.

*(a) La collision d'ancres, relevée par C.* En semaine 1, un élève de TC obtient B en Questionnement
sur l'essai et D sur l'explication de texte. Les deux sont des ancres simultanées, « l'ancre fait
foi », et **aucun texte ne dit laquelle**, ni comment elles s'agrègent. Le plafond d'inflation et la
cible de R2 en dépendent.

*(b) Les deux règles de ciblage, relevé par O.* R2 porte un **seuil d'entrée acté** : « pour un
élève globalement faible, le Questionnement ne devient cible primaire que si Argumentation *et*
Structure ont atteint C ». La règle de ciblage lecture du §13 élit « la plus faible des cinq », sans
seuil. Un élève faible est donc **bloqué** en écriture sur le Questionnement et **simultanément**
routé dessus par la lecture. Et l'inverse : la lettre que le seuil surveille peut monter par des
mesures de lecture pures, jusqu'à sortir le Questionnement du bas du trio sans qu'aucune
dissertation ait bougé.

*(c) La commensurabilité.* Le `00-referentiel.md` §6 exige « **Échelle commune** pour les compétences partagées entre les
deux parcours… condition de la collige des signaux ». Un élève HLP (= Humanités-Littérature-Philosophie) pur n'a aucune mesure
de Questionnement d'écriture (le §1 l'acte) : sa lettre est **entièrement** de lecture, quand celle
d'un élève de TC est mixte. Le typage à seuil est d'ailleurs « acté de longue date côté écriture,
et **hérité sans preuve côté lecture** », avec deux sous-dimensions *[à valider]*.

*Vérification, périmètre compris.* Le volet (b) touche la règle de ciblage lecture du §13, qui
appartient au chantier déclaré « ciblage lecture » et n'est donnée que comme « proposition minimale
v1 ». **Ce qui est en périmètre n'est pas cette proposition, c'est la portée de la décision actée** :
le seuil d'entrée du Questionnement a été acté le 30/07 sans que son domaine d'application soit
écrit — écriture seulement, ou les deux familles ? Tant qu'il n'est pas écrit, la session « ciblage
lecture » n'a aucun moyen de savoir si elle doit le respecter. Le reste de l'item (volets a et c) ne
dépend d'aucun chantier ouvert. La prémisse, elle, est confirmée par la SPEC C3, amendement A1 : « `ecriture.problematisation`
et `lecture.problematisation` ne sont plus deux compétences. Il y a **un** `questionnement`, avec
**une** lettre au profil, alimentée par les deux familles. » La question n'est donc **pas** de
refaire la fusion — elle est actée et portée au schéma — mais d'écrire la règle d'agrégation qui
n'existe pas. *À trancher, deux questions distinctes : (1) la règle déterministe de collision entre
deux ancres de familles différentes ; (2) le seuil d'entrée du Questionnement s'étend-il au ciblage
lecture, ou vaut-il explicitement en écriture seulement ? Recommandation fusion : trancher (2) en
une phrase au §13 dès maintenant, et garder derrière la lettre commune un signal de routage dérivé
par famille (la `famille` est déjà sur chaque mesure, §10) — ce qui rend aussi de nouveau testable
la corrélation Questionnement-écriture ↔ Questionnement-lecture, retirée des duals au
`00-referentiel.md` §7 au motif qu'« il n'y a plus deux mesures à corréler » : c'est vrai des
lettres, pas des mesures.*

**F8 ⚖️ — Le Monitoring : le routeur donne une amplitude 0-3 à une sous-dimension que le référentiel lit en présent/absent, et aucune table ne calcule l'amplitude.** `[C6]`

Le `00-referentiel.md` impose deux formes **incompatibles** : la lucidité sur l'incompris se lit
« en présent/absent », la calibration « en amplitude signée » — et le §2 précise que les deux
sous-dimensions « **ne se moyennent pas** : elles ne sont pas sur la même échelle ». Le routeur §3
décrit pourtant chaque ligne élève × sous-dimension — **`lucidite_incompris` incluse** — avec
`amplitude_courante` et `direction_courante`.

*Vérification, et la justification de périmètre est celle de C, qu'il faut garder.* La
contradiction de forme est confirmée mot pour mot entre `00-referentiel.md` §2/§3 et `01-routeur.md`
§3. Les deux sous-dimensions sont marquées *[à valider]* des deux côtés — le routeur écrit lui-même
« `lucidite_incompris` et `calibration_confiance`, **toutes deux *[à valider]*** ». Ce qui est
**acté**, c'est l'échelle du Monitoring (« actée le 29 juillet 2026 ») et la décision de schéma A8.
On est donc dans l'exception 3 du périmètre, telle que C l'invoque : « des sous-dimensions toujours
`[à valider]` sont ainsi présupposées résolues par des tables déclarées actées ». Second volet, à nuancer : C affirme qu'aucune règle ne
permet au code de produire 1, 2 ou `indetermine`. Les descripteurs du §2 sont en réalité
**presque** dénombrables sur la source locale — « décalage ponctuel, sur un observable ou deux »
(= 1) contre « décalage systématique » (= 2) —, et le champ `comparaison` par observable existe. Ce
qui manque vraiment est ailleurs : la frontière 2/3 n'est pas dénombrable ; la source **globale**
(confiance déclarée « sûr / pas sûr » confrontée au niveau obtenu) n'a aucune correspondance vers
l'échelle 0-3 ; et rien ne dit comment les deux sources se combinent. *À trancher : séparer
strictement l'état booléen de lucidité de l'état amplitude/direction dans le schéma, et la table de
calcul déterministe de l'amplitude. Recommandation fusion : conserver d'abord les événements bruts
(C3 les collecte déjà dans `exercices_metacognition` « dès le premier exercice de septembre ») et
ne produire `calibration` qu'après ; la donnée d'une année ne se rattrape pas, la table de calcul
oui.*

**F9 — `duree_exercice_min` est un scalaire alors que le régime v1→vf change à l'exécution, et la fuite tombe sur les plus petits budgets.** `[O12 + C5 — convergence]`

Le contrat déclare **une** durée par type. Le §9 pose que cette durée dépend du régime (« un type
sans vf coûte moins de temps — il en rentre donc davantage dans le cycle ») et le §6 fait basculer
les types du régime `optionnel` au régime `plein` pendant une escalade active. Les deux branches
sont mauvaises : si la valeur inclut la version finale, le budget de tous les élèves **non**
escaladés est surestimé toute l'année ; si elle l'exclut — lecture plus naturelle —, le budget des
élèves **en escalade** est dépassé silencieusement de toute la phase de révision. **L'escalade
frappe par définition les élèves en difficulté, c'est-à-dire ceux du budget le plus bas** (TC,
45-60 minutes). O ajoute le même défaut, plus lent, sur l'étayage : la couche 1 le fait décroître
jusqu'aux « conditions d'examen » du segment 5, et c'est son retrait qui allonge le travail — le
budget décompte pourtant la même valeur, et se trompe de plus en plus à l'approche du bac.

*Vérification.* Confirmé dans C3 : `duree_exercice_min` est « la seule que le routeur et le quota
décomptent ». *Une correction à apporter à C, qui écrit que « la promesse de propositions iso-durée devient
également fausse dès que le régime effectif diffère » : les 2-3 propositions de la couche 4 sont du **même type** (« la couche 3 choisit
un type, la couche 4 l'instancie deux ou trois fois sur des matières différentes »), donc un
changement de régime les déplace toutes ensemble — leur égalité tient. Ce qui casse est la valeur
absolue décomptée par le budget, c'est-à-dire le constat principal de l'item.* À noter pour le correctif : un second champ `duree_redaction_min` existe
déjà au schéma, **nullable et optionnel**, réservé aux types à rédaction suivie — son « utilité
réelle » est l'ouverture n° 20 de C3. Il ne faut pas le confondre avec la découpe demandée ici.
*Correctif sans arbitrage, convergent entre les deux revues : deux valeurs — `duree_v1_min` et
`duree_vf_min` (nulle pour les types sans version finale) —, le budget décomptant leur somme selon
le régime **effectif au moment de l'assignation**.*

**F10 ⚖️ — L'élève absent de la semaine 1 reçoit un niveau qui n'est peut-être pas une ancre, et l'absence *partielle* n'est traitée nulle part.** `[O7 + C1 partiel — rapprochement]`

Le cold start attribue à l'élève absent « la médiane de sa classe », marquée `profil_provisoire`.
**Les deux documents ne disent pas si cette médiane est écrite dans `derniere_ancre`**, et les deux
lectures cassent quelque chose de différent. *Si elle n'est pas une ancre* : l'élève n'a aucune
ancre, donc le plafond d'inflation (ancre + 2) n'a pas d'opérande — sa lettre monte sans borne — la
descente est impossible, et le drapeau de discordance ne se calcule pas. *Si elle est une ancre* :
le §7 s'applique intégralement à un nombre fabriqué — élève absent, médiane C, niveau réel E, ses
exercices maison mesurent E : discordance de 2 crans → « la lettre suit l'ancre », elle est
**remontée** à C, et un drapeau part vers le professeur avec les hypothèses « aide extérieure ?
stress ? ». Le système corrige la mesure juste par la mesure fabriquée.

Deux ajouts. **L'absence partielle**, absente des deux documents : le §8 fait du diagnostic de la
semaine 1 **deux passations** distinctes (un essai, une explication) ; un élève présent à l'une et
absent à l'autre a six niveaux d'écriture mesurés et cinq niveaux de lecture manquants, et le texte
ne connaît que « les élèves absents » comme catégorie globale. Et, relevé par C : pour un élève
bi-classe, « **la médiane de sa classe** » est ambiguë — il appartient à deux classes.

*Vérification — une pièce du correctif existe déjà et manque au routeur : voir la section F,
constat F-a.* *À trancher : la médiane est-elle une ancre ? Recommandation fusion : non — écrire au
§4 qu'elle n'est jamais écrite dans `derniere_ancre`, qu'une compétence sans ancre réelle est
plafonnée à sa valeur initiale + 1, ne peut pas descendre et ne déclenche aucun drapeau de
discordance jusqu'à sa première ancre ; et appliquer le cold start **passation par passation**,
non élève par élève.*

**F11 ⚖️ — R5 est inerte exactement là où l'interleaving est réclamé : elle interdit les triplets, pas le verrouillage.** `[O4]`

R5 est une contrainte de **consécutivité** : « Jamais plus de deux exercices consécutifs sur la même
cible primaire ». Le document lui confie pourtant le rôle de porteur de l'interleaving à cette
couche. Trois situations la rendent silencieuse. *(1) Sous R1* — Expression E, Argumentation D,
Structure C, Questionnement C : R1 donne un exercice sur deux à Expression, R2 (« une fonction d'état (elle regarde le
profil du jour, **sans mémoire**) ») réélit Argumentation à chaque appel. La suite est Expression, Argumentation,
Expression, Argumentation… : jamais deux identiques consécutives, R5 ne se déclenche jamais, et
**Structure et Questionnement reçoivent zéro exercice ciblé** tant qu'Expression n'a pas atteint C.
*(2) En HLP*, le trio se réduit au duo {Argumentation, Structure} : avec R1, Structure ne sort
jamais ; sans R1, la suite A, A, S, A, A, S donne deux tiers d'Argumentation. *(3) `historique_cibles`
est **une seule liste** sans clé de famille*, alors que le cycle mêle désormais écriture et lecture :
une semaine alternant les deux familles rend R5 inerte des deux côtés.

*Vérification.* Les trois scénarios sont confirmés sur pièces. **Une nuance de périmètre** : le
volet (3) touche en partie la proposition minimale v1 du §13, qui appartient au chantier déclaré
« ciblage lecture » — il vaut donc comme avertissement à cette session, pas comme constat. Les
volets (1) et (2) et l'absence de clé `famille` sur `historique_cibles` sont, eux, entièrement dans
le périmètre : R1, R2, R5 et le §3 sont tous actés. *À trancher : R5 reste-t-elle une contrainte de
consécutivité ? Recommandation fusion : la transformer en contrainte de **couverture**, comptée par
famille (« aucune compétence `evaluee` de la famille F ne reste plus de K exercices de la famille F
sans être ciblée », K ≈ 4, provisoire), et donner à `historique_cibles` une clé `famille`.*

**F12 — Le contrat des types ne porte ni l'éligibilité de parcours, ni les invariants qui lient geste et régime.** `[C7]`

*Éligibilité.* Le `00-referentiel.md` §6 exclut en HLP les types 1 et 9, ou exige une variante. Le
contrat n'a aucun `parcours_eligibles[]`, et un type générique a `genre = null` : le routeur ne peut
donc pas distinguer un type commun d'un type réservé au TC sans coder des identifiants en dur.
*Invariants.* Le contrat déclare `geste` et `regime_v1vf` comme deux attributs indépendants, alors
que la table du §9 fait du régime une **fonction** du geste (production → plein ; transformation →
optionnel ; diagnostic → par paires). Rien n'interdit formellement de déclarer un type
`geste=diagnostic` en `regime_v1vf=plein`.

*Vérification.* Les deux points sont confirmés. Nuance honnête sur le premier : le **contenu** de
l'éligibilité TC/HLP est marqué *[à spécifier]* au `00-referentiel.md` §6, donc c'est un trou
déclaré ; ce qui est en périmètre est l'absence de **case** dans le contrat pour l'y ranger.
*Correctif sans arbitrage, celui de C : ajouter `parcours_eligibles[]` au contrat et une
**matrice de validation croisée** famille × genre × geste × régime. (Dériver `regime_v1vf` du
`geste` et retirer le champ serait plus économe, mais défait la décision actée du §9 — « Chaque type
de la bibliothèque **déclare son régime** » — et devient donc un arbitrage, pas un correctif.)*

---

## B. AVANT-ALLUMAGE — à corriger avant septembre

**F13 ⚖️ — Entre deux ancres, la lettre est monotone croissante par construction, et le seul garde-fou vient d'être retiré.** `[O10 + C14 — rapprochement]`

Trois asymétries **actées** se composent : la montée se fait par le travail maison (2 mesures sur
3) ; la descente se fait **par les ancres uniquement** ; une sonde échouée ne compte jamais contre
la lettre. **Entre deux ancres, aucun canal de mesure disponible ne peut faire baisser une lettre.**
Le seul correctif qui existait — l'exigence de « fraîcheur d'ancre » pour le second cran — a été
**abandonné** au gel du 29/07, et le §7 déclare la cadence d'ancre non contraignante : si le plan la
manque, « la lettre ne gèle pas, elle continue de monter jusqu'au plafond ancre + 2 ». C ajoute le
scénario qui exploite exactement cette porte : un élève fait produire ses versions maison par une
IA externe ou par un tiers, monte D→C puis C→B jusqu'au plafond acté, et le routeur lui sert alors
du méso/macro en cessant de traiter ses vraies faiblesses — `aide_consommee` ne suit que l'aide
interne à la plateforme (vérifié : « dépliages de la fiche + relectures »).

*Vérification.* L'abandon de la fraîcheur d'ancre est confirmé dans les deux documents **et** dans
la SPEC C3. La question qu'O pose et que les documents ne posent jamais est la bonne : une ancre par
compétence `evaluee` toutes les six semaines sur ~30 semaines demande **cinq rondes**, dont trois
sont fournies par les diagnostics — restent **quatre passations longues supplémentaires par élève
et par an**, à répartir dans les intervalles septembre-décembre et décembre-mars. Contre-poids que
ni O ni C n'ont vu : l'arbitrage C3 du 29/07 (F19) a retenu une **question de restitution à chaud**
(30 secondes au clavier, « ta thèse en une phrase ? », placée après la vérification de la
transcription et avant tout envoi à l'IA), dont l'incohérence avec le squelette est un signal
anti-externalisation — mais **aucun des deux documents ne la mentionne**, et le §7 ne la consomme
pas. *Ceci conteste une décision actée (l'abandon de la fraîcheur d'ancre) et le signale comme tel.
À trancher : rétablir ou non une condition de fraîcheur pour le second cran gagné exclusivement à
la maison. Recommandation fusion : deux gestes d'abord, dont l'un est gratuit — compter sur le
calendrier 2026-27 réel le nombre de passations longues déjà prévues par famille et par intervalle,
et le comparer à quatre ; et ajouter au §10 un indicateur hebdomadaire « proportion d'élèves dont au
moins une lettre est au plafond ancre + 2 », qui est le symptôme visible de l'inflation.*

**F14 ⚖️ — Le plafond d'inflation ne borne pas seulement l'affichage : il pilote le ciblage.** `[O9]`

L'annexe B examine le plafond du seul point de vue de l'affichage (« Le fort au mauvais jour » :
plafond D + 2 = B, « aucun drapeau — c'est le comportement voulu »). Personne n'a regardé l'effet
sur le **routage** pendant l'intervalle. Le même élève, diagnostiqué D en Structure alors que ses
autres lettres sont justes à B : R2 élit « la plus faible du trio », donc Structure ; R5 impose un
exercice sur une autre cible après deux, d'où Structure, Structure, Argumentation, Structure… —
**deux tiers de son écriture sur la compétence où il est en réalité le meilleur**. Et rien ne le
voit : la stagnation exige « aucun changement de statut sur la fenêtre *et* lettre immobile », or ses observables
passent en acquis, donc aucun N1, aucun drapeau.

*Vérification — un chiffrage à corriger, dans le sens de l'atténuation.* O estime l'intervalle à
« six à douze semaines ». La règle de montée n'impose aucun délai minimal : elle exige « 2 mesures
sur 3 au niveau ≥ lettre+1 », la fenêtre de six semaines étant une **fenêtre**, pas un délai. Avec
deux tiers de ses exercices sur Structure et 2-3 exercices par cycle, six mesures s'accumulent en
**trois à quatre semaines** ; deux crans prennent donc de l'ordre d'**un mois**, pas d'un trimestre.
Le mauvais routage reste réel, sa durée est plus courte qu'annoncé. Autre nuance : le cas symétrique
(élève diagnostiqué E, plafonné à C) est **moins grave** qu'O ne l'écrit — les deux seuils qu'il
cite (sortie de R1 « quand Expression atteint C », seuil d'entrée du Questionnement « ≥ C ») sont
satisfaits **à** C, donc ils se déclenchent ; ce qui reste vrai est que la lettre ne peut plus
progresser au-delà, donc que R2 continue de l'élire. *À trancher : découpler la lettre **affichée**
de la lettre **de ciblage** (R2 élirait sur la valeur non plafonnée) — une colonne dérivée, aucune
règle changée. À défaut : lever un drapeau quand une lettre est au plafond depuis plus de N semaines
**et** que ses observables progressent.*

**F15 — La définition de la stagnation est indéfinie à ses deux bornes.** `[O15 + C9 — rapprochement, les deux bornes de la même définition]`

Le §6 définit : acquis = « quand son taux de réussite sur la fenêtre des 3-4 dernières mesures dépasse ~2/3 » ;
progression = « au moins un observable **change de statut** vers acquis » ; stagnation = « aucun
changement de statut sur la fenêtre *et* lettre immobile ». Trois cas sortent faux.

*(a) La première fenêtre (O).* Un *changement* suppose un état antérieur, et les compteurs ne
démarrent qu'au segment 3 : la première fenêtre pleine est aussi la première. Deux implémentations
également fidèles au texte divergent — « aucun changement observé » ⇒ « stagnation vraie par défaut », qui envoie
en N1 dès les premières semaines d'octobre tout élève dont les observables ne sont pas déjà acquis ;
ou « pas de comparaison possible ⇒ pas de verdict », qui rend N1 impossible avant deux fenêtres pleines,
c'est-à-dire après le seuil nominal de N2.

*(b) Le bas (O).* La définition ne distingue pas un observable **en échec** d'un observable **jamais
travaillé** : les deux se présentent identiquement (taux nul, aucun changement). L'élève qui
découvre une compétence et celui qui la travaille depuis deux mois reçoivent le même verdict et la
même intervention, alors que le premier n'a besoin que d'être enseigné.

*(c) Le haut (C).* Un élève dont tous les observables sont acquis et dont la lettre est A —  ou B
bloquée au plafond d'ancre, cas beaucoup plus fréquent, voir F14 — satisfait **littéralement** la
définition de la stagnation. N1 lui demande alors « l'observable non acquis au taux le plus bas » :
il n'existe pas.

*Vérification.* Les trois cas sont confirmés sur le texte du §6, et rien ailleurs ne les exclut.
*Correctif sans arbitrage, les deux revues se complétant : « la stagnation exige deux fenêtres
consécutives closes ; aucun compteur ne court avant la clôture de la première » (O) ; « Ajouter comme
précondition d'escalade l'existence d'au moins un observable requis non acquis. La stabilité acquise
doit produire entretien ou absence d'action, jamais N1 » (C) ; et « N1 ne se déclenche que sur un observable dont le taux est
**descendu sous un plancher après avoir été mesuré au moins une fois au-dessus**, ou qui plafonne
sous ce plancher sur deux fenêtres » (O), ce qui sépare l'échec de l'inconnu.*

**F16 ⚖️ — La bascule de `profil_provisoire` est déclenchée par une date, pas par la preuve que le segment 2 devait produire.** `[O14 + C8 — convergence]`

Le dispositif est cohérent sur le principe : le segment 2 cherche la **couverture** — « les
compétences `evaluee` ayant le moins de mesures, jusqu'à en avoir **au moins deux** chacune ». Mais
la bascule est déclenchée « à la clôture du segment 2 », et **aucune des deux formulations (§4 point
c, §7) ne la conditionne à l'atteinte de cet objectif**. Le cas se produira : trois semaines, un
élève qui rend peu, un élève arrivé en cours de segment, un élève dont la moitié des exercices est
allée à Expression parce que R1 était active. Il sort avec zéro ou une mesure sur plusieurs
compétences ; le drapeau bascule tout de même ; **les compteurs d'escalade démarrent**, les lettres
s'affichent, et le plafond d'inflation se calcule — sur un profil dont la certitude est exactement
celle que le drapeau signalait la veille. C ajoute le cas de l'absent, qui sort du provisoire sans
**aucune** preuve individuelle, après que R1 lui a imposé la moitié de ses exercices sur la foi
d'une médiane empruntée.

*Vérification.* Confirmé : le seuil « au moins deux mesures » est écrit comme cible de ciblage, pas
comme condition de bascule ; le §6 confirme que rien d'autre que le segment ne retient les
compteurs. *Ceci conteste une décision actée du 30/07 (« les niveaux restent en `profil_provisoire`
pendant tout le segment 2 et **basculent à sa clôture** ») et le signale comme tel. À trancher — et les deux revues ne proposent
pas tout à fait la même chose. O conditionne **par compétence** : « `profil_provisoire` passe à faux
à la clôture du segment 2 **pour les seules compétences ayant atteint le seuil de couverture**, et
reste vrai pour les autres ». C conditionne **par élève** et ajoute une conséquence d'affichage :
« Clore le segment globalement, mais ne lever `profil_provisoire` qu'élève par élève après une
condition minimale d'évidence ; garder les lettres masquées sinon ». Recommandation fusion : la
granularité de O — par compétence, c'est la maille de l'état du §3 — avec la conséquence
d'affichage de C.*

**F17 ⚖️ — La sonde échouée est déclarée trop ambiguë pour la lettre, mais assez forte pour envoyer l'élève jusqu'en N3.** `[C10]`

Le §7 écarte la sonde échouée de la lettre avec un argument explicite : « une sonde échouée a mille
explications — l'exercice ne s'y prêtait peut-être pas, l'attention était ailleurs ». La même phrase
ajoute qu'« elle nourrit l'escalade (§6) et la vigilance », et le §6 confirme que le compteur ne se
réinitialise pas, « puisque les mesures s'accumulent en continu, **y compris par les sondes
secondaires** ». Une mesure jugée insuffisante
pour une conséquence faible (un cran de lettre) produit donc une conséquence beaucoup plus forte :
N1, N2, puis N3 et un dossier professeur.

*Vérification, avec le chiffrage que C ne fait pas.* La règle « une compétence n'est sondée qu'une
fois par cycle » et la double condition de N3 (~8 mesures plates **et** ≥ X semaines, X ≈ 4-6) font
qu'un chemin **entièrement** par les sondes demande environ huit cycles — donc environ huit
semaines, ce qui satisfait la condition de temps. Le scénario est donc atteignable en un semestre,
sans qu'aucun exercice n'ait jamais ciblé la compétence. *Ceci conteste une décision actée du 30/07
(l'asymétrie des sondes) et le signale comme tel. À trancher : quelles sondes peuvent incrémenter
les compteurs d'escalade ? Recommandation fusion : réserver le déclenchement aux mesures où la
compétence était **cible** ; les sondes peuvent confirmer une escalade ou la désescalader, jamais
l'ouvrir.*

**F18 ⚖️ — R2 donne deux priorités opposées au même élève à B.** `[C11]`

Le départage acté de R2 est « (a) la moins récemment ciblée, puis (b) l'ordre de levier
**Argumentation > Structure > Questionnement** ». La phrase suivante dit : « chez les B visant A, le
**Questionnement remonte en priorité** ». Argumentation, Structure et Questionnement toutes à B et
aussi récentes : le départage choisit Argumentation, la phrase suivante choisit le Questionnement.
Le pipeline ne contient aucun branchement qui renverse le départage.

*Vérification.* Contradiction confirmée sur le texte du §5, et le cas est étroit mais réel : il
faut une égalité de lettre **et** de récence. Deux implémentations également conformes produiront
des cibles opposées. *À trancher : la phrase « chez les B visant A » remplace-t-elle le départage
général, ou s'y ajoute-t-elle comme exception ? Recommandation fusion : l'écrire comme une exception
nommée au départage (b), et la borner aux élèves dont les trois lettres du trio sont ≥ B.*

**F19 ⚖️ — Le diagnostic de lecture de la semaine 1 est acté ; l'instrument qui le convertit en niveaux est *[à valider]*, et aucun état « sans lettre » n'existe.** `[O11]`

*Premier volet.* Le §8 acte que « l'**explication** porte les cinq de lecture », et le
cold start précise que « la **Connaissance** et la **Synthèse** restent `differee` » — mention qui
n'aurait pas de sens si les autres ne recevaient pas un niveau. Or le `00-referentiel.md` §3 laisse
les blocs d'ancres de Restitution, Reconstruction, Évaluation et Mouvement **vides**, et le §5 dit
ce qui en tient lieu : le **pont E→A**, *[à valider]*, « pis-aller assumé : il transforme des champs
en niveaux **sans que personne ait observé où tombent les seuils** ». C'est le cas exact où un
*[à valider]* est présupposé résolu par une règle actée.

*Vérification — une nuance importante, et une question que le constat fait apparaître.* Le §13
point 6 anticipe déjà qu'« aucune compétence de lecture ne sera `evaluee` à l'allumage, R0 les
écarte toutes ». Mais il **ne dit pas lequel des deux autres statuts s'applique**, et les deux mènent
ailleurs. *Si elles sont `mesuree_silencieusement`*, le constat ne disparaît pas, il **change de
porte** : il devient le point d'entrée du défaut F2, ces lettres non affichées ne pouvant que monter
par les sondes avant de devenir la lettre affichée à la recette. *Si elles sont `differee`*, le pool
de sondes du §6 les exclut aussi (il n'admet que « `evaluee` ou `mesuree_silencieusement` ») — et la
question devient alors : **à quoi sert le diagnostic de lecture de la semaine 1 ?** Le §8 acte son
format et son contenu, mais aucune règle ne consomme son produit. Dans les deux cas, le plafond
d'inflation de la lecture sera calculé pour l'automne à partir de niveaux issus du pont E→A.

*Second volet, indépendant.* **Il n'existe aucun état « sans lettre ».** Le §3 énumère `lettre` = « E,
D, C, B ou A », sans valeur d'absence (confirmé au schéma de C3 : `competences_niveaux` porte une
`lettre`, sans nullabilité déclarée). Le cas se présente dès qu'un élève manque une passation
(voir F10) ou s'inscrit tardivement, et **beaucoup de règles en aval lisent une lettre** :
R1 (« Si Expression ≤ D »), R2 et son départage, R3 (« Synthèse ≤ C stable »), le seuil d'entrée du
Questionnement, la table des proportions de la couche 1 (indexée sur « la **LETTRE DE
LA COMPÉTENCE CIBLE** de l'exercice »), le geste indexé au niveau en couche 3, le plafond d'inflation
et la descente. Aucune ne prévoit qu'elle puisse manquer, alors que le document
pose ailleurs la discipline exactement contraire — « **NULL n'est pas 0** » (§1.1, §9, §10).
*Correction à porter à O, qui cite aussi R0 et la règle de couverture du segment 2 : ces deux-là ne
lisent pas de lettre — R0 lit `statut_recette` et la règle de couverture lit un nombre de mesures.
Le constat n'en souffre pas : la liste des consommateurs de `lettre` reste longue.* *À trancher : quelle branche s'applique si le pont E→A
n'est pas validé au 24 août. Le second volet, lui, s'écrit sans arbitrage : ajouter au §3 une valeur
`lettre = NULL` avec sa règle en une ligne — « une compétence sans lettre n'est ni ciblable, ni
sondable, ni plafonnée, et n'entre dans aucun départage ».*

**F20 ⚖️ — Le multiplicateur X des multi-appels s'applique-t-il aux DS ingérés ? Personne ne pose la question, et elle vaut la moitié d'un poste de dépense.** `[O13]`

Le §8 réserve les multi-appels « aux diagnostics », puis énumère dans la même liste « Trois
diagnostics en classe » **et** « Les DS de classe », ces derniers passant « par les canaux
diagnostiques ». Rien ne dit si un DS (= devoir surveillé) ingéré hérite du multiplicateur X. Les
deux lectures : X sur les seuls trois diagnostics = 70 × 11 × 2 × 3 × X = **4 620 X** appels ; X sur
toute la cadence d'ancre (cinq rondes) = **7 700 X**. Ce sont les appels les plus chers du
dispositif : les seuls à tourner sur le modèle fort dans le régime envisagé, et portant sur des
textes au format complet.

*Vérification — les calculs tiennent, une comparaison est à corriger.* 70 × 11 × 2 × 3 = 4 620 et
70 × 11 × 2 × 5 = 7 700 : exacts. L'écart entre les deux lectures est de **9 240 appels à X = 3** et
**15 400 à X = 5**. O écrit que c'est, « dans les deux cas, la moitié du régime hebdomadaire annuel » :
à X = 5 c'est juste (régime hebdomadaire estimé 25 000-30 000), à X = 3 c'est **environ un tiers**.
À noter aussi que 11 compétences est le maximum (TC) ; un élève HLP en a 10. *À trancher : X
s'applique-t-il aux DS ? Recommandation fusion : une phrase au §8 — « les multi-appels sont réservés
aux trois diagnostics annuels ; un DS ingéré comme ancre passe en un seul passage bi-phasé (X = 1) »
— et porter les deux ordres de grandeur au §11, pour que l'arbitrage du régime de modèle parte d'un
chiffre.*

**F21 — La facture est théorisée, mais rien ne la journalise au grain qui permettrait l'arbitrage dont tout dépend.** `[C13 + O13 partiel — rapprochement]`

Le §10 journalise le modèle et les versions de prompt, mais **pas le nombre réel d'appels, ni les
tokens, ni le coût imputable aux sondes et aux multi-appels**. Or le §4 fait dépendre l'arbitrage du
régime de modèle — « le plus gros levier de coût restant » — d'un calcul de largeur de mesure dont
il dit lui-même que « lequel l'emporte n'a pas été calculé », et le §11 laisse X « à chiffrer — dépend du
régime de modèle ». Chacun attend l'autre, et la donnée qui trancherait n'est pas
collectée.

*Vérification — l'arithmétique de C a été entièrement recalculée : elle est exacte dans son propre
modèle, mais ce modèle est faux sur les diagnostics, et il faut le dire avant la séance.* Le régime
hebdomadaire tient : 70 × 28 × (2N + 4) = 11 760 appels à N = 1, 15 680 à N = 2, 19 600 à N = 3.
En revanche, C chiffre un diagnostic complet à (2×6 + 4) + (2×5 + 4) = **30 appels** par élève et
par passage, c'est-à-dire en appliquant le terme fixe « + 4 » à chacune des deux passations. Ce
terme fixe est, selon la lecture cohérente établie en **F22**, le coût de la cible : P1 + P2 sur la
v1 **et** P1 + P2 sur la vf. Or le §9 pose, à la ligne « En classe » de sa table des régimes, qu'une passation
en classe n'a pas de version finale : régime « **Sans objet** », « **La passation s'arrête à
`retour_publie`** (C3 §3bis) ; retour informatif seulement. Son `delta_v1_vf` vaut NULL ». **Le « + 4 » ne s'applique donc pas à un diagnostic.** Le coût correct est de 2 appels par
compétence : 6 × 2 + 5 × 2 = **22 appels** par élève et par ronde, ce qui redonne exactement le
70 × 11 × 2 = 1 540 par ronde du modèle d'O — les deux revues se réconcilient sur **4 620 X** pour
les trois diagnostics, et non 6 300 X. **Les totaux annuels de C sont donc surestimés de 1 680 X** :
à X = 3, le total passe de « 30 660 à 38 500 » à **25 620 à 33 460** appels, et de « 42 420 à
58 100 » à **37 380 à 53 060** à deux exercices hebdomadaires. L'ordre de grandeur et la conclusion
de C ne bougent pas ; le chiffre à porter au §11, si.* **Partiellement couvert ailleurs** : l'arbitrage C3 du 29/07
(F6) a acté un plafond mensuel, une alerte à 70 %, une coupure automatique, un plafond d'appels par
dépôt, et la table `exercices_jobs` qui compte les tentatives — donc les retries **sont** suivis et
un compteur de coût global existe. Ce qui manque est l'**attribution** : coût par appel, par phase,
par exercice et par motif de sonde, seule forme qui permette de comparer les deux régimes de modèle.
*Correctif sans arbitrage : journaliser l'usage par appel et par phase, agrégé par élève, type et
cycle — le §10 journalise déjà « les sondes retenues et leur motif », la jointure est donc immédiate.*

**F22 — La formule « 2N + 4 » définit N de deux façons incompatibles, et l'écart vaut ~10 000 appels par an.** `[vrac O — promu ici, la formule portant l'arbitrage de coût]`

Le §4 couche 3 écrit : « N est le nombre de compétences **mesurées** » — ce qui inclut la cible,
elle-même mesurée. Le §6 point 4 écrit : « chaque sonde ajoute 2 appels… **cette règle fixe donc le
N** », avec « la version finale ne repasse que pour la compétence cible » — soit 4 appels fixes pour
la cible et N = les seules sondes. L'écart est de **2 appels par exercice**, soit de l'ordre de
10 000 sur l'année pour ~5 000 exercices.

*Vérification.* Les deux phrases existent aux endroits cités. La lecture cohérente est celle du §6 :
la cible coûte P1 + P2 sur la v1 et P1 + P2 sur la vf, soit les 4 appels fixes, et chaque sonde
ajoute 2 (P1 + P2 sur la v1 seule). La formulation du §4 est donc la formulation lâche.
*Correctif sans arbitrage : aligner le §4 sur le §6 — « N est le nombre de compétences **sondées**,
la cible étant déjà comptée dans le terme fixe ». Promu ici depuis le vrac parce que c'est sur cette
formule que reposera l'arbitrage du régime de modèle.*

**F23 ⚖️ — L'override post-hoc ne permet pas réellement au professeur de « disposer ».** `[C12]`

Le §1.8 acte : « Le professeur ne voit donc plus rien **avant** l'assignation : l'override reste
possible à chaque couche, mais il corrige après coup, il n'arbitre plus en amont. » Conséquence :
pour un élève sous aménagement, ou pour un contenu inapproprié à sa situation, le routeur assigne,
l'élève voit, et le professeur découvre l'affectation sur un écran en lecture seule. L'override
corrige la suite ; il ne retire pas ce qui a été montré et n'empêche pas une première mesure
erronée.

*Vérification — le constat n'est pas couvert par l'arbitrage qui a produit cette décision.*
L'arbitrage C3 du 29/07 (F5) a supprimé la file de validation hebdomadaire sur une **prémisse
différente** : Louis ne valide jamais le squelette d'une copie d'élève, la référence décomposée se
fabrique une fois par texte. Toute l'arithmétique des revues de juillet tombait avec cette prémisse
— mais la question soulevée ici, qui est celle des **contraintes préalables par élève**, n'a pas été
posée. *Ceci conteste une décision actée et le signale comme tel. À trancher. Recommandation
fusion : sans rétablir de file hebdomadaire, permettre des **contraintes préalables persistantes**
par élève / type / contenu, que le routeur consulte au moment d'assigner — c'est un filtre, pas une
file.*

**F24 ⚖️ — La session datée dépend de la session sans date.** `[O16]`

La session « ciblage lecture » (§13) porte une échéance ferme : « avant l'allumage de début
septembre ». Son agenda comporte en point 2 : « **L'interface avec la session
"construction de la semaine"** — comment le partage probabiliste écriture/lecture se règle-t-il dans
le remplissage du budget ? ». La session « construction de la semaine » (§5), qui décide de cette interface, n'a
**aucune date** — elle est seulement rattachée à l'ouverture n° 3 du tableau de bord de C3. Et la
seule règle qui rendait le couplage inoffensif, la cadence 2-1, a été supprimée le 30/07 : le §13
l'écrit lui-même : « **Rien ne garantit plus une part de lecture** ». Le chevauchement de périmètre est
réel : la « préférence de l'élève » est revendiquée par le §5 et figure au point 3 du §13.

*Vérification, périmètre compris.* Les deux sessions sont des chantiers déclarés, donc hors
périmètre **par leur contenu**. Ce constat ne porte pas sur leur contenu mais sur leur **ordre**, et
il relève de l'exception nommée par la spec de revue — une décision actée rend un chantier
insoluble : la suppression de la cadence 2-1, actée le 30/07, retire le seul mécanisme qui
permettait à la session datée de trancher son point 2 sans attendre la session non datée. Le §13
l'écrit lui-même. *À trancher : dater la session « construction de la semaine » avant celle du
ciblage lecture. Recommandation fusion : la dater ; à défaut, poser une règle de repli tenant lieu
de cadence 2-1 — un plancher fixe de minutes de lecture par cycle, applicable dès qu'une compétence
de lecture est `evaluee`. (O suggère aussi de retirer du §13 le point 3, la préférence de l'élève,
qui est revendiquée par le §5 : c'est une remarque à porter à la session, pas un correctif au
document.)*

---

## C. À SURVEILLER — la télémétrie ou une décision différée suffit

**F25 ⚖️ — R2 compare trois lettres dont l'une repose sur une fonction d'agrégation non tranchée.** `[O17]`

R2 élit « la plus faible du trio », donc compare trois lettres qui ne sont pas fabriquées de la même
façon. Argumentation est à seuil et son seuil est observable. **Structure est symétrique** : sa
lettre sort d'une agrégation entre deux sous-dimensions graduées, et le `00-referentiel.md` §2 note
que la règle « graduée 0-4 par dimension, puis **moyenne arrondie vers le bas** » n'a été actée que
« portée Expression », reste « à étendre ou non aux autres symétriques dans leur chantier
respectif », et que « le choix de *moyenne arrondie vers le bas* est désormais **un paramètre à
défendre**, et non une évidence. *[à valider]* ». Sur une échelle 0-4, l'arrondi décide de la
lettre : 2,5 sort à **C** avec l'arrondi vers le bas et à **B** avec l'arrondi au plus proche —
selon le cas, R2 cible Structure ou Argumentation, et l'élève passe l'automne sur l'une ou l'autre.

*Vérification.* La citation est exacte, l'arithmétique aussi (2,5 → 2 = C ou 3 = B). C'est le cas
où un *[à valider]* d'un document pilote une règle actée de l'autre. *À trancher au chantier
Structure, mais avant que R2 ne tourne en production. Recommandation fusion (celle d'O, qui absorbe
l'incertitude sans attendre le chantier) : « en cas d'écart d'un seul cran entre deux membres du
trio dont les procédures d'agrégation diffèrent, l'ordre de levier (Argumentation > Structure >
Questionnement) prime sur l'écart ».*

**F26 — Le bi-classe reçoit une prime de budget que rien ne convertit en éventail de cibles.** `[vrac O]`

Le §3 justifie l'écart de déclenchement par le volume d'évidence (« environ deux fois plus »), et le
§6 garantit qu'« une compétence n'est sondée qu'une fois par cycle » — donc plus d'exercices élargit
bien la **mesure**. Mais aucune règle n'élargit ses **cibles** : R2 est sans mémoire, R5 est inerte
sous R1 (F11). Le supplément de budget produit d'abord plus d'exercices sur les mêmes cibles.
*Vérifié sur pièces. Se règle avec F11 ; à surveiller au §10 par le nombre de cibles distinctes par
élève et par mois.*

**F27 ⚖️ — Le lieu de passation de l'essai de Fragments n'est écrit nulle part, alors qu'il porte le droit de descente.** `[vrac O]`

Le §8 en fait « une ancre de plus », contexte de mesure `essai_fragments` — donc porteuse du droit
de faire **descendre** une lettre, que le §7 réserve aux ancres au motif qu'« un mauvais exercice
maison a mille explications ». Ni le §8 ni le `00-referentiel.md` §6 ne disent où il est écrit. S'il
l'est à la maison, l'architecture ancre/trajectoire du §1.6 est percée par sa propre liste d'ancres.
*Vérifié : l'information est absente des deux documents. À trancher — c'est une question de fait à
Louis, dont la réponse décide si la ligne du §8 est correcte.*

---

## D. Corrections mécaniques — à appliquer sans arbitrage

Toutes vérifiées sur pièces ; chacune se corrige par une phrase ou un mot.

1. **`01-routeur.md` §2 contre §10, même jour.** Le tableau du §2 écrit pour le Monitoring :
   « Télémétrie au §10 — **qui ne journalise aujourd'hui aucun de ses champs** ». Le §10 point 4
   journalise les quatre champs et déclare l'alerte refermée. Les deux sections sont marquées
   « passée le 30 juillet ». `[vrac O]`
2. **Alerte périmée dans le référentiel.** Le `00-referentiel.md` §2 porte encore « le §10 du
   `01-routeur.md`… ne mentionne aucun de ces champs. À aligner à la passe du routeur ». La passe a
   eu lieu et le §10 dit que l'alerte « peut être levée » — personne ne l'a levée. `[vrac O + vrac C
   — convergence]`
3. **Statut de relecture.** Le `00-referentiel.md` écrit encore que `01-routeur.md` « reste en
   relecture » ; celui-ci se déclare « RELU INTÉGRALEMENT ET VALIDÉ par Louis le 30 juillet ».
   `[vrac C]`
4. **R6 dans le référentiel.** Le `00-referentiel.md` §6 porte encore un encadré « À reprendre à la
   passe du `01-routeur.md` » sur l'ancienne R6 fondée sur la provenance TC/HLP. La passe a eu lieu
   le 30/07 : R6 est réécrite, la moitié « **Cibles primaires TC et HLP disjointes la même semaine** » est dissoute et le drapeau
   « transfert » est passé au **genre**. `[vrac C]`
5. **Combien de compétences reçoivent le retour.** Le `00-referentiel.md` §1 écrit « le retour n'en
   porte qu'**une ou deux** » ; le routeur §1.1 et §1.4 imposent que **seule la cible** reçoive le
   retour ; et le routeur conserve le pluriel « **compétences retournées** » au §1.8 et à la sortie
   de la couche 3 (§4). Trois formulations pour une seule règle. `[vrac C]`
6. **Ordre d'attribution du parcours.** Il est *[à valider]* au `00-referentiel.md` §6 et au routeur
   §2, et énoncé comme un fait au routeur §5 (R6) et §10. *Correction du décompte d'O, qui écrit
   « [à valider] dans trois sections et un fait dans une quatrième » : c'est **deux et deux**.* Ce
   qui est acté par R6 est le **changement de support** du drapeau (du parcours au genre), pas
   l'ordre d'attribution qui le sert. `[vrac O]`
7. **Collision de vocabulaire sur « diagnostic ».** Le §9 appelle *geste diagnostic* un exercice par
   paires de copies, sans version finale ; le §8 appelle *types diagnostiques à part entière* les
   formats longs (essai, dissertation, explication) par lesquels un DS devient une ancre. Deux
   objets sans rapport sous le même mot. `[vrac O]`
8. **`derniere_ancre` est défini plus étroitement que la liste des ancres.** §3 : « Date et valeur de
   la dernière **mesure en classe** ». §8 : cinq entrées, dont l'essai de Fragments et les DS. Le
   §1.6 donne la clé de lecture, mais la définition gagnerait à **énumérer** plutôt qu'à qualifier —
   d'autant que `contexte` (§10) a quatre valeurs dont trois sont des ancres. `[vrac O]`
9. **« Ni pause » est un reliquat, à **trois** endroits et non deux.** Le §3 (« **Ni pause ni
   escalade ne se déclenchent tant qu'il est vrai** »), le §4 cold start (« **ni pause ni escalade**
   ne se déclenchent sur la foi d'une seule ancre ») et le §7 (« **ni pause, ni escalade, ni
   affichage** ») disent tous que `profil_provisoire` empêche une « pause » ; or le §4 acte
   lui-même que « la stagnation change la CIBLE, jamais le VOLUME » et le §6 que « **L'escalade ne
   réduit jamais le volume** ». La pause n'existe plus : le mot doit disparaître des trois endroits.
   *(C ne chiffrait pas les occurrences ; la troisième est un relevé de la vérification.)* `[vrac C]`
10. **`complexité` (annexe A) n'a ni nom technique ni domaine de valeurs**, alors qu'il pilote
    directement 0, 1 ou 2 sondes. Même remarque pour « plage d'étayage » et « consigne-gabarit ».
    `[vrac C]`
11. **`distance_contexte` a une finalité déclarée et aucun consommateur.** Le §10 dit qu'il « permet
    à N2 de distinguer un problème de *réception* d'un problème de *transfert* » — formulation
    reprise de l'arbitrage C3 du 29/07 (F10) —, mais l'algorithme de N2 au §6 branche uniquement sur
    `delta_v1_vf`. Aligner les deux : soit N2 le consomme, soit le §10 cesse de le lui attribuer.
    `[vrac C]`
12. **Le segment 2 se clôt le 18 septembre, pas « fin septembre ».** Rentrée le **mardi 25 août
    2026** ; semaine 1 = diagnostic ; trois semaines de calibration = semaines du 1er, du 8 et du
    15 septembre ; clôture le **vendredi 18 septembre**. Le §4 écrit « → fin septembre » pour le
    segment 2 et « fin septembre → décembre » pour le segment 3 : une dizaine de jours reste
    non attribuée. *(Calcul refait ; C avait raison, la date est bien le 18-20 septembre.)* `[vrac C]`
13. **Annexe B, « Le canal bouché » : le sondage décrit est celui que la règle classe dernier.** Le
    cas prévoit qu'« Expression est **sondée en secondaire** sur les exercices du trio » ; or sous
    R1 elle est ciblée un exercice sur deux, donc la plus récemment mesurée, donc **dernière** au
    critère 3 du §6 (« la plus anciennement mesurée »). Elle ne sera sondée que là où elle est seule
    candidate. `[vrac O]`
14. **Annexe B, « Le canal bouché » : l'état supposé est improbable.** Le cas exige « Expression D,
    Questionnement D, Argumentation C, Structure C — **toutes `evaluee`** », alors que le §12 place
    le Questionnement **en dernier** dans l'ordre d'écriture. L'exception (réquisition par la session
    ciblage lecture) porte sur la fiche, pas sur la recette du banc. `[vrac O]`
15. **§9 contre §11 sur le chevauchement de cycles.** Le §9 donne « jamais à cheval sur deux
    cycles » comme *acté* ; le §11 le donne comme « **Acté sur le principe** ; modalités selon
    l'emploi du temps réel ». Aligner — la nuance change la marge de manœuvre de F1. *(Relevé par
    la vérification, pas par les revues.)*
16. **§6 contre §11 sur le statut du plafond de sondes.** Le §6 le marque « *paramètre **provisoire
    (réglage empirique)*** » ; le §11 le porte comme « **à chiffrer — c'est lui qui borne la
    facture** », de statut « **[à valider]** ». Ce n'est pas
    cosmétique : *provisoire* et *[à valider]* ne sont pas le même régime de décision dans ce
    dossier, et le §11 se déclare « **Ce registre FAIT FOI pour les paramètres du routeur** ».
    Aligner sur l'un des deux. *(Relevé par la vérification, pas par les revues — même espèce que
    l'entrée 15.)*

---

## E. Déjà couvert, hors périmètre ou faux positif — avec la référence qui le prouve

- **Loi 25 et données de mineurs** `[angle mort O n° 2 + angle mort C n° 1 — convergence]`. Les deux
  revues concluent qu'aucun des deux documents ne fixe minimisation, durée de conservation, accès,
  suppression ni procédure d'incident. **C'est exact des deux documents, et déjà arbitré ailleurs** :
  `RELEVE_Arbitrage_C3_2026-07-29.md`, item F11 — « **Décision : OUI, avec jalon daté. Jalon : une
  lettre présentant le traitement, prête le 22 août** », portant « pour chaque donnée (photo de
  copie, transcription, squelette, verdict, retour, télémétrie) : finalité, lecteur, sous-traitant,
  **durée de conservation**, **mode d'effacement** », le principe que « toute contestation
  individuelle atteint un humain », la purge des métadonnées EXIF, et la question du propriétaire
  institutionnel. **Correction de fait, apportée en séance le 29/07 et que les deux revues ne
  pouvaient pas connaître** : le prompt de revue leur a décrit un « lycée français au Québec (16-18 ans) » et des élèves
  « **mineurs** » ;
  le relevé écrit « Louis enseigne au **cégep** — élèves de **17 ans et plus**. Au Québec un mineur
  de 14 ans et plus peut en règle générale consentir lui-même. Le volet "parents" tombe
  probablement ». **Résidu réel, une ligne** : la lettre du 22 août énumère les données par nom, et
  `monitoring_niveaux` (amplitude d'écart et direction — « surconfiant » / « sous-confiant ») et
  `exercices_metacognition` n'y figurent pas nommément. Le point spécifique d'O — une caractérisation
  produite par un instrument que ses propres auteurs déclarent non validé jusqu'en juin 2027 —
  mérite d'être nommé dans cette lettre. *Pas un défaut du référentiel ni du routeur.*
- **`01-routeur.md` §13, « deux renvois incompatibles pour l'indexation lecture »** `[vrac C]`. Le
  document le déclare lui-même, dans la phrase qui porte le renvoi : « le brouillon d'indexation
  geste ↔ niveau *(deux renvois divergents subsistent — `02-exercices.md` §8 ici,
  `competences-lecture/types-lecture.md` §6 au §4 : **à vérifier à la relecture de ces documents**)* ».
  Trou déclaré, avec sa procédure. *Faux positif.*
- **L'auto-vérification déclarée par la revue O — ce qui a pu être vérifié, et ce qui ne l'a pas
  été.** La spec de séance demandait d'exiger la même fiabilité des deux revues malgré cette
  déclaration. Limite à énoncer franchement : **O n'énumère pas les sept constats**, et son fichier
  parle de constats « retirés **ou rétrogradés** » — un constat rétrogradé est toujours là, sous une
  forme plus étroite. Il est donc impossible, depuis les fichiers seuls, de certifier que les sept
  ont disparu. **Ce qui a été vérifié, et qui tient** : (1) aucun constat d'O n'a été retenu ici sur
  sa seule autorité — les 17 ont été repassés contre les deux documents source comme ceux de C, et
  trois de ses affirmations en sont ressorties corrigées (F14, F20, D-6) ; (2) là où O signale
  lui-même une rétrogradation, la version livrée est bien la version étroite — son vrac sur
  `derniere_ancre` (D-8) n'est pas le constat large ; (3) C ne rejoue aucun constat manifestement
  réfuté : en particulier C1 ne prétend pas que les deux documents se contredisent sur le nombre de
  lettres du Questionnement, il prend acte de la lettre unique et attaque l'absence de règle
  d'agrégation (F7).
- **Trois chiffrages corrigés, sans que le constat tombe** : la durée du mauvais routage de F14 (six
  à douze semaines → de l'ordre d'un mois) ; la comparaison de F20 (« la moitié du régime
  hebdomadaire » n'est vraie qu'à X = 5, c'est un tiers à X = 3) ; le décompte de D-6 (deux
  sections *[à valider]* et deux qui l'énoncent comme fait, non trois et une). **Et un chiffrage
  corrigé sur le fond** : les totaux annuels de C13 (F21) sont surestimés de 1 680 X, parce que le
  terme fixe « + 4 » de la formule 2N + 4 y est appliqué à des passations en classe, qui n'ont pas
  de version finale (§9). Une fois corrigés, les deux modèles de coût des deux revues se
  réconcilient sur **4 620 X** pour les trois diagnostics annuels. C'est le seul chiffre que la
  séance d'arbitrage doit retenir des deux revues.

---

## F. Constats propres à la fusion — ce que la vérification a révélé et que personne n'avait vu

**F-a — La « fenêtre de rattrapage » des absents au diagnostique a été arbitrée le 29/07 et n'existe
nulle part dans le routeur.** Le relevé d'arbitrage C3 (item F15) acte : « **Absents au
diagnostique** : profil par défaut = **médiane de la classe** + `profil_provisoire`, **avec fenêtre
de rattrapage**. » Le cold start du routeur §4 reprend la médiane et le drapeau — et **omet la
fenêtre**. Or c'est précisément la pièce qui répondrait à une moitié de F10 et de F16 : elle donne
à l'élève absent une occasion de produire une preuve individuelle avant la bascule. Aucun des deux
relecteurs ne pouvait le voir : ils n'avaient pas C3. *À porter au §4 du routeur, avec sa durée.*

**F-b — Le plancher de mesure ne protège que les compétences *ciblées*, donc pas celles que R1 et R5
laissent de côté pendant des mois.** Le §7 écrit : « au moins **une mesure toutes les 3 semaines**
sur toute compétence **ciblée**. C'est le garde-fou qui empêche la fenêtre de montée de devenir
inatteignable », et il pose que « fenêtre de montée = 2 × la période du plancher de mesure », les
deux paramètres étant « **liés par construction** ». Mais sous R1, Structure et Questionnement ne
sont **jamais ciblés** (mécanisme de F11) : le plancher ne les couvre pas, et leur seule voie de
montée devient la sonde. Or le nombre de sondes est borné par un **plafond de sondes par cycle**, que le §6 marque
« *paramètre provisoire (réglage empirique)* » — c'est donc exactement le cas prévu par le
périmètre : un chiffre provisoire dont la fausseté casserait quelque chose que la télémétrie ne
verrait pas. Autrement dit : la montée
de ces compétences dépend entièrement d'un paramètre non chiffré, et le §10 ne journalise rien qui
permette de s'en apercevoir. C'est exactement le cas que le §4 dit vouloir éviter — « moins
d'exercices sur une compétence, c'est une fenêtre de montée qui s'étire jusqu'à devenir
inatteignable » — obtenu par une autre porte que celle qu'il surveille. *Se règle en partie avec
F11 ; demande en propre soit d'étendre le plancher aux compétences `evaluee` non ciblées, soit de
journaliser le délai depuis la dernière mesure par compétence.*

**F-c — R3 est bloquée deux fois au démarrage, et une seule des deux raisons est écrite.** Le §5
signale que « l'entrée de R3 est la **synthèse en classe**, dont le sort reste à décider ». La
seconde raison n'est écrite nulle part : le cold start met **la Synthèse elle-même en `differee`**
(§4), et R0 est le premier filtre du pipeline — R3 ne peut donc pas insérer d'exercice de
condensation tant que la Synthèse n'a pas passé la recette, indépendamment du sort de la synthèse en
classe. *Une phrase au §5 suffit ; l'intérêt est d'éviter qu'on croie R3 opérante en septembre.*

---

## G. Angles morts fusionnés et vrac fusionné

### Angles morts (7 chez les deux relecteurs, 6 après fusion)

- **⚖️ L'anti-Goodhart et le Monitoring se détruisent l'un l'autre** `[O]`. Le §8 acte que « le
  retour ne révèle **jamais** la grille complète des observables » ; le Monitoring demande à l'élève
  de calibrer son jugement sur ce même référent et lui renvoie une amplitude et une direction. On
  demande donc à un élève de se calibrer sur des critères qu'on lui cache — et l'asymétrie actée
  (« à amplitude égale, la surconfiance appelle une **intervention** ») fait de cette impasse le cas
  qui déclenche le plus d'action. Le référentiel §3 anticipe l'artefact voisin (« l'élève qui
  **lisse tout** ne produit ni aveu ni hypothèse ») sans voir que c'est la stratégie exacte que
  l'opacité récompense. *Geste minimal proposé : révéler les observables de la seule compétence du
  jour, après remise de la version finale — trop tard pour être joué, assez tôt pour être appris.
  Décision à prendre avant les écrans du lot C4-L3.*
- **⚖️ La largeur de mesure est indexée sur le niveau : plus un élève est en difficulté, moins la
  plateforme sait de lui** `[O]`. Le §1.4 fait suivre la largeur de mesure à la complexité de
  l'exercice, et la couche 3 indexe la complexité sur le niveau. Le §4 n'en tire qu'une conséquence
  de facture (« l'élève qui progresse fait peu d'exercices mais chers ; l'élève faible en fait
  beaucoup mais bon marché »). La conséquence pédagogique n'est notée nulle part : l'élève à D
  reçoit des exercices étroits, donc une ou zéro sonde, donc un profil qui ne se rafraîchit pas —
  alors que R1, R2 et l'escalade le routent en permanence sur la foi de ce profil. *Geste minimal
  proposé : traiter la largeur de mesure comme un **plancher** chez les élèves faibles (« au moins
  une sonde par cycle, quel que soit le grain ») plutôt que comme un plafond uniforme, et
  journaliser le nombre de compétences fraîches par élève.*
- **⚖️ L'ancre aveugle est le seul juge extérieur, et sa sentence n'a aucune suite prévue** `[O]`.
  Le §8 acte le bac blanc « corrigé à la main hors de toute chaîne IA », mis en regard des lettres
  une fois par semestre. Puis le dispositif s'arrête : pas d'unité de comparaison, pas de seuil, pas
  de destinataire, pas d'action ; aucune table au §10, aucune mention au §11, aucune règle des §5,
  §6, §7 ne le cite. *Vérifié : la SPEC C3 s'arrête au même endroit — elle écrit « c'est la mise en
  regard qui est le dispositif » et ne va pas plus loin. Geste minimal proposé : définir avant
  septembre l'unité de comparaison (l'écart en crans, par compétence), le seuil qui déclenche
  quelque chose, et ce que ce quelque chose est.*
- **⚖️ La capacité du professeur à absorber N3** `[C]`. Si 20 % des ~70 élèves stagnent sur deux
  observables, cela fait **28 dossiers** potentiels (calcul refait : 14 élèves × 2). Le §6 transfère
  la charge au professeur (« drapeau professeur avec dossier complet ») sans file priorisée, sans
  plafond hebdomadaire, sans délai d'intervention et sans comportement de repli ; les élèves restent
  entre-temps en régime d'entretien sans échéance. *Geste minimal proposé : un plafond hebdomadaire
  de dossiers N3, une file priorisée, et un comportement de repli écrit au-delà du plafond.*
- **⚖️ Aménagements et biais de canal** `[C]`. R1 impose la moitié des exercices à l'Expression pour
  tout élève coté D, sans distinguer une faiblesse du construct d'une dyslexie, d'un trouble moteur,
  du français langue seconde ou d'une transcription dégradée. Avec l'override uniquement post-hoc
  (F23), une caractéristique d'**accès** peut devenir automatiquement le centre du parcours.
  *Recoupe F23 ; l'arbitrage C3 du 29/07 a déjà acté `mode_saisie_force = ecran` au profil et
  l'exclusion de tout diagnostic médical — ce qui traite le canal de saisie, pas le ciblage.*
- **Loi 25 et mineurs** `[O + C — convergence]` → **traité en section E** : arbitré le 29/07 avec
  jalon daté au 22 août, plus un résidu d'une ligne sur les tables du Monitoring.

### Vrac fusionné (19 lignes chez les deux relecteurs)

Les 19 lignes sont distribuées et toutes vérifiées : **15 en section D** — regroupées en
14 entrées, l'alerte périmée du référentiel §2 étant relevée par les deux revues ; **2 promues en
items** (F22, la double définition de N ; F26, la prime de budget du bi-classe) ; **1 promue en item
à trancher** (F27, le lieu de passation de l'essai de Fragments) ; **1 en section E** (les deux
renvois du §13, que le document déclare lui-même). *Les deux dernières entrées de la section D — le §9 contre le §11 sur le
chevauchement de cycles, et le §6 contre le §11 sur le statut du plafond de sondes — ne viennent
d'aucune des deux revues : elles sortent de la vérification.* Aucune ligne de vrac n'a été écartée sans preuve.

---

*Séquence proposée pour la séance d'arbitrage — proposition, pas décision. Les 20 ⚖️ ne tiennent pas
en une séance : à raison d'un item à la fois, compter deux ou trois séances. Ordre suggéré, du plus
bloquant au plus dérivé : **F2, F3, F6** (le statut de recette, qui commande le reste) — **F7, F10**
(le Questionnement et le cold start, qui commandent les lettres de septembre) — **F1, F11, F4** (le
budget, la rotation, le contrat des types, qui commandent les deux sessions dédiées) — puis **F8,
F13, F14, F16, F17, F18, F19, F20, F23, F24, F25, F27** et les **cinq ⚖️ de la section G** —
soit vingt-cinq décisions en tout. Les
sections D et F s'appliquent sans redemander.*

**impact C3 : néant** (instrument d'arbitrage — les amendements éventuels sortiront de l'arbitrage
de Louis, pas de cette fusion).
