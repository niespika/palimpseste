# REVUE ADVERSARIALE — `00-referentiel.md` + `01-routeur.md`

*Relecteur adversarial, 30 juillet 2026. Périmètre : les deux documents fournis et le contrat d'interface de l'annexe A du prompt de séance. Les trois chantiers déclarés ouverts (construction de la semaine §5, ciblage lecture §13, révision « certitude » des lettres §7) ne comptent pas comme trouvailles — sauf lorsqu'une décision **actée** les rend insolubles, ce qui est signalé explicitement.*

*Cette liste a subi une passe de vérification contradictoire contre le texte des deux documents ; sept constats de la première rédaction ont été retirés ou rétrogradés parce qu'une phrase, ailleurs dans les documents, y répondait déjà.*

*Sigles employés : **TC** = tronc commun (cours de philosophie commun à tous) · **HLP** = spécialité Humanités-Littérature-Philosophie · **v1** = première version d'un exercice · **vf** = version finale · **DS** = devoir surveillé · **P1 / P2** = Phase 1 (extraction des faits) / Phase 2 (jugement depuis l'extraction seule).*

---

## G1 — Le plancher macro du segment 5 et la règle « jamais à cheval sur deux cycles » ne peuvent pas tenir ensemble à un budget plausible

**Où** — `01-routeur.md` §1, encadré « Vocabulaire : cycle et exercice » (l'unique durée d'exercice chiffrée du document) ; §1.2 (budgets en minutes par cycle) ; §4 couche 1 (table des proportions, garde-fou du segment 5) et couche 3 (geste indexé au niveau) ; §8 (dernière phrase du bloc « Les DS de classe ») ; §9 (table des régimes, rythme v1→vf) ; §11.

**L'attaque** — Le budget d'un élève de TC est de **45-60 minutes par cycle**, plus 30 optionnelles. La seule durée d'exercice chiffrée dans tout le document est celle de l'encadré de vocabulaire du §1 : **75-90 minutes pour une rédaction de 45 minutes**, sous la forme « le temps total de l'exercice » que le routeur décompte.

Suivons un exercice macro pour un élève à B, au segment 5. La couche 3 indexe le geste au niveau : « B → **production autonome** ». Le §9 fait correspondre au geste *production* le régime **plein** — v1, retour, vf. Le §9 impose que cette séquence tienne « le même jour au mieux, sur 3-4 jours au pire, **jamais à cheval sur deux cycles** ». Un exercice complet — dissertation ou explication au format terminal — écrit puis révisé, plus la préparation, l'auto-jugement et les deux lectures de retour, se compte en heures, pas en dizaines de minutes : par simple extrapolation du seul repère chiffré du document (45 minutes de rédaction → 75-90 minutes d'exercice), une production complète dépasse largement le plafond hebdomadaire d'un élève de TC, optionnelles comprises.

Le §4 impose pourtant, comme **garde-fou** de la décision actée du 30/07, que « au segment 5, la part macro a un plancher **pour tous les niveaux** — personne n'arrive à l'examen sans avoir fait d'exercices complets ». Le §8, passé le même jour, concède le contraire en une ligne : « Le budget plateforme reste ainsi presque entièrement **micro/méso**, là où le rendement par minute est maximal. »

L'objection prévisible — « les budgets sont *provisoires*, la session dédiée les fixera » — ne referme pas le problème, et c'est le point : **la session « construction de la semaine » n'a pas de degré de liberté suffisant à l'intérieur des décisions actées.** Pour qu'un macro rentre, il faut soit tripler le budget hebdomadaire d'un élève de terminale qui a six autres matières — ce n'est pas un réglage empirique, c'est un autre dispositif —, soit rompre la règle **actée** du §9 qui interdit à un exercice de chevaucher deux cycles. Le trou déclaré ne se comble donc qu'en défaisant une décision prise.

Enfin, la télémétrie du §10 ne verra rien : elle journalise les décisions du routeur et les mesures, mais **aucune réconciliation entre les minutes assignées et le budget de l'élève**, ni aucun compteur d'exercices macro effectivement faits. L'échec se présentera en mai sous la forme « le segment 5 n'a pas eu lieu », sans qu'aucune ligne de journal ne le nomme.

**Gravité** — `BLOQUANT`

**Correctif minimal** — Trancher, avant la session dédiée, laquelle des deux règles cède. La voie la moins coûteuse : écrire au §4 que **le grain macro du segment 5 est porté par les passations en classe (DS, diagnostics) et non par le budget plateforme**, ce que le §8 dit déjà — et reformuler le plancher en plancher de passations. Sinon, autoriser explicitement au §9 le chevauchement de deux cycles pour le seul grain macro. Dans les deux cas, ajouter au §10 un compteur « minutes assignées / minutes de budget » par élève et par cycle.

---

## G2 — La voie mixte est le régime nominal de septembre, et rien n'est écrit sur ce que produit un exercice commun

**Où** — `01-routeur.md` §1.5 (voie mixte) ; §1.8 (« Les exercices communs ne sont plus une exception… C'est le mode de fonctionnement nominal de septembre » ; « quand tout est imposé, elle descend au retour seul ») ; §5 R0 et sa justification.

**L'attaque** — R0 énonce : « Aucune règle ne peut proposer une compétence dont le statut n'est pas `evaluee` », et sa raison est explicite : « un élève qui ferait un cycle entier sur une compétence non bancée arriverait au retour… **qui n'existe pas, faute de verdict** ».

Le §1.5 décrit ensuite la voie mixte : « le routeur remplit le budget avec les seules compétences `evaluee`, et le reste du temps va aux **exercices communs imposés par le professeur** ». La structure de cette phrase force une conséquence : si les exercices communs ne portaient que sur des compétences `evaluee`, le routeur aurait pu les servir lui-même et la voie mixte n'aurait pas de raison d'être. Les exercices communs occupent donc, par construction, l'espace des compétences que R0 vient d'écarter.

Ce qui n'est écrit nulle part, c'est **ce que la plateforme rend à l'élève au bout de cet exercice**. Le §1.8 garantit qu'« il y a toujours un étage personnalisable » et que, le type étant imposé, la personnalisation descend aux paramètres puis « au **retour seul** » — donc la plateforme produit un retour. Trois questions restent sans réponse dans les deux documents : cet exercice produit-il une entrée dans `competences_mesures` ? Si oui, sur quel instrument, puisque le banc de sa compétence n'a pas passé la recette ? Si non, l'élève reçoit-il un retour sans verdict, et lequel ?

Le scénario que R0 existe pour empêcher est ainsi réinstallé, non comme accident mais comme **régime nominal**, sur la part du budget que le routeur ne peut pas servir — c'est-à-dire, en septembre, la part majoritaire.

**Gravité** — `BLOQUANT`

**Correctif minimal** — Une ligne au §1.8 : **un exercice commun portant sur une compétence non `evaluee` ne produit pas de mesure et ne produit qu'un retour non-verdictif** (registre descriptif, sans niveau). Et ajouter au contrat d'interface (annexe A) un attribut `produit_mesure`, pour que la question se règle au type et non au cas par cas.

---

## G3 — Les sondes font monter les lettres de compétences dont l'instrument a échoué à la recette, et le repli déclaré du référentiel §5 est le chemin qui y mène

**Où** — `01-routeur.md` §6 (« Le pool des candidates… de statut **`evaluee` ou `mesuree_silencieusement`** ») ; §7 (« une sonde réussie compte pour la montée ») ; §3 ; `00-referentiel.md` §6 (« le profil de compétences n'est alimenté **que** par des instruments bancés ») et §5 (repli : « les compétences concernées passent en `mesuree_silencieusement` »).

**L'attaque** — Le §6 admet dans le pool de sondes les compétences `mesuree_silencieusement`, avec cette justification : « R0 restreint le ciblage, pas la mesure ». Le §7 pose que « **une sonde réussie compte pour la montée** ; une sonde échouée ne compte **jamais** contre la lettre ». La composition des deux produit, pour toute compétence `mesuree_silencieusement`, une lettre que les sondes ne peuvent que faire **monter** — c'est-à-dire une lettre construite par un instrument dont le banc **n'a pas** passé la recette.

Or le référentiel §6 pose que le profil n'est alimenté que par des instruments bancés, et le routeur §2 s'appuie explicitement sur cette phrase pour refuser à Quazian le droit d'écrire dans le profil : « Raison : le `00-referentiel.md` §6 pose que le profil n'est alimenté **que** par des instruments bancés. » La même phrase interdit donc ce que le §6 du routeur autorise.

Le chemin n'est pas hypothétique : c'est le **repli déclaré** du référentiel §5. Si le banc de calibration lecture glisse au-delà du 24 août — et sa date est marquée *[à valider]* —, « les compétences concernées passent en `mesuree_silencieusement` plutôt que de faire glisser le reste ». Les cinq compétences de lecture entrent alors dans le pool de sondes et accumulent des mesures toute l'année sur un instrument non fiabilisé. Les diagnostics et les DS ingérés restent des points de descente possibles, mais entre deux, la lettre ne peut que monter.

Le jour où Restitution passe la recette et bascule en `evaluee`, sa lettre — construite par un instrument qui avait échoué — devient **affichée** et devient l'entrée de la règle de ciblage lecture (§13 : « la plus faible des cinq »). **Aucune règle des deux documents ne prévoit de recalcul, de remise à zéro ni même de marquage à la transition de statut.**

**Gravité** — `BLOQUANT`

**Correctif minimal** — Deux phrases. Au §7 : « une sonde ne compte pour la montée que si la compétence sondée est `evaluee` ». Au §3 : « le passage de `mesuree_silencieusement` à `evaluee` **recalcule la lettre depuis les seules mesures postérieures à la recette** ; les mesures antérieures restent au journal, distinguées par `instrument_version` ».

---

## G4 — R5 est inerte exactement là où l'interleaving est réclamé : elle interdit les triplets, pas le verrouillage

**Où** — `01-routeur.md` §5 R5 et R1 ; §3 (`historique_cibles`) ; §13 (proposition minimale v1 lecture) ; §1.2 (suppression de la cadence 2-1).

**L'attaque** — R5 est formulée comme une contrainte de **consécutivité** : « Jamais plus de deux exercices consécutifs sur la même cible primaire ; après deux, au moins un exercice sur la deuxième cible légitime. » Le document lui confie le rôle d'agent de l'interleaving à cette couche — « R5 en est le porteur à cette couche » — les deux autres porteurs cités étant la table des proportions, dont les valeurs sont *provisoires* et se fixent en session dédiée, et cette même session dédiée. Trois scénarios rendent R5 silencieuse.

*Scénario 1 — R1 active.* Élève de TC, Expression **E**, Argumentation **D**, Structure **C**, Questionnement **C**. R1 s'applique : « un exercice sur deux cible Expression », les autres vont au trio. La suite des cibles primaires est **Expression, Argumentation, Expression, Argumentation, …** — jamais deux identiques consécutives, donc **R5 ne se déclenche jamais**. R2, que le document décrit lui-même comme « une fonction d'état (elle regarde le profil du jour, **sans mémoire**) », réélit Argumentation à chaque appel puisqu'elle reste la plus faible. Structure et Questionnement reçoivent **zéro exercice ciblé** tant que l'Expression n'a pas atteint C — pour un élève diagnostiqué E, une bonne partie de l'année. L'« acharnement démotivant » que R5 est censée empêcher se produit, et R5 le regarde sans rien voir.

*Scénario 2 — HLP.* En HLP le trio se réduit au duo {Argumentation, Structure}. Avec R1 active, la suite est Expression, Argumentation, Expression, Argumentation… : Structure ne sort jamais. Sans R1, la suite est A, A, S, A, A, S — deux tiers d'Argumentation, régime de massage.

*Scénario 3 — les deux familles dans un même cycle.* `historique_cibles` est décrit comme **une seule liste** — « la liste ordonnée des cibles primaires des derniers **exercices** » — sans clé de famille, alors que le cycle mêle désormais écriture et lecture dans une enveloppe unique. Une semaine alternant les deux familles produit écriture, lecture, écriture, lecture : aucune cible n'apparaît deux fois de suite, R5 est inerte des deux côtés. Or la proposition minimale v1 du §13 confie à R5 **toute** la rotation lecture : « cible = la plus faible des cinq compétences de lecture parmi les `evaluee` + **rotation R5** ». Sous cette proposition, l'aile lecture se verrouille dès le premier cycle sur sa compétence la plus faible.

Aggravant : le §1.2 supprime la cadence 2-1 — le seul mécanisme qui garantissait structurellement l'alternance entre familles — dans le document même qui déclare l'interleaving « principe de conception de la plateforme ».

**Gravité** — `BLOQUANT`

**Correctif minimal** — Transformer R5 de contrainte de consécutivité en contrainte de **couverture**, comptée par famille : « aucune compétence `evaluee` de la famille F ne reste plus de K exercices de la famille F sans être ciblée » (K ≈ 4, provisoire). Et donner à `historique_cibles` une clé `famille`.

---

## G5 — N3 est une règle de couche 2 placée en couche 3 : le pipeline du §5 ne peut pas l'appliquer

**Où** — `01-routeur.md` §5 (pseudo-code du pipeline, définition de R2) ; §4 couche 3 (« C'est ici que s'exécute l'escalade anti-stagnation (§6) ») ; §6 (N3).

**L'attaque** — Le pipeline place l'escalade explicitement **après** l'élection de la cible :

```
sinon : R2 propose la cible
        R5 filtre (rotation, en exercices)
  → couche 3 : type, étayage, registre (+ escalade §6)
```

N1 et N2 sont bien des opérations de couche 3 : elles changent le type, le grain, le registre. **N3 non.** Il retire la compétence du pool des cibles : « la compétence **quitte les cibles primaires** et devient candidate prioritaire de sonde, le primaire allant à la compétence suivante ». C'est une opération de couche 2, qui doit s'exécuter **avant** R2 — et R2 n'en sait rien, sa définition étant « la plus faible du trio », sans aucun filtre d'escalade.

Déroulé. Novembre. Argumentation entre en N3 (huit mesures plates **et** cinq semaines depuis N1). Au cycle suivant, R2 est appelée, regarde le trio, constate qu'Argumentation est toujours la plus faible — elle stagne, c'est la définition même de N3 — et l'élit. La couche 3 découvre alors l'état N3 et devrait annuler la décision de la couche 2, sans que le pipeline prévoie de retour en arrière. Le seul comportement implémentable en l'état est que **N3 n'ait aucun effet sur le ciblage** : le routeur continue d'assigner un neuvième, un dixième exercice sur une compétence qu'il a lui-même déclarée hors de sa portée, alors que le §6 justifie exactement l'inverse — « le coût motivationnel d'un neuvième essai automatique dépasse son bénéfice espéré ».

**Gravité** — `BLOQUANT`

**Correctif minimal** — Une ligne dans le pseudo-code du §5, au-dessus de R2 : `filtre N3 → les compétences en régime d'entretien sont retirées du pool de R2`. Et corriger la phrase du §4 couche 3, qui affirme que l'escalade s'exécute entièrement à cette couche.

---

## G6 — Le contrat d'interface ne déclare nulle part quel observable un type isole : N1 n'a pas d'entrée

**Où** — Annexe A du prompt de séance (les onze attributs) ; `01-routeur.md` §3 (`etat_escalade` « **indexé par observable** ») ; §6 (N1 : « choisir dans la même famille un type qui l'**isole** ») ; §5 (pipeline, sans branche d'échec).

**L'attaque** — C'est le test que la règle 6 du prompt de séance demande d'appliquer au contrat : *chaque règle du routeur qui consomme un attribut absent du contrat est une trouvaille.*

Toute la machinerie d'escalade est indexée sur les **observables** : `etat_escalade` est « indexé par observable — un élève peut être en N2 sur `garant_cité` en Argumentation et en régime normal partout ailleurs » ; N1 consiste à « identifier le sous-défaut dominant (l'observable non-acquis au taux le plus bas) ; **choisir dans la même famille un type qui l'isole** » ; la désescalade se déclenche « dès que **l'observable ciblé** change de statut ».

Le contrat, lui, est indexé sur les **compétences** : `competence_primaire`, `competences_secondaires[]`, `grain`, `geste`, complexité. **Aucun des onze attributs ne dit quels observables un type expose, ni lequel il isole.** N1 doit donc choisir « un type qui isole `garant_cité` » dans une bibliothèque qui n'a pas de champ où cette information puisse se lire.

L'objection possible est que le §12 loge cette correspondance dans la méthode — « en co-concevant à chaque fois la grille d'observables et les 2-4 types qui la rendent mesurable ». Mais une co-conception produit une connaissance chez le concepteur, pas un champ interrogeable par la couche 3. Et le pipeline du §5 n'a **aucune branche d'échec** : il se termine sur « couche 3 : type, étayage, registre » sans dire ce qu'il advient quand aucun type ne satisfait la contrainte demandée. Le cas se présentera dès le premier N1, avec seulement 2 à 4 types par compétence : la couche 3 interrogera la bibliothèque avec (compétence = Argumentation, grain = micro, geste = transformation), recevra deux candidats, et n'aura aucun moyen de savoir lequel isole les garants plutôt que les connecteurs. Elle en prendra un — et le §10 journalisera consciencieusement « N1, intervention appliquée », donnant l'illusion que l'escalade a fait son travail.

**Gravité** — `BLOQUANT`

**Correctif minimal** — Ajouter au contrat d'interface un attribut **`observables_isoles[]`** (vide pour les types non-isolants), qui est l'artefact rendant la co-conception du §12 exploitable par le code. Et ajouter au §6 une clause de repli en une phrase : « si aucun type n'isole l'observable dominant, N1 dégrade en retour mono-focal sur le type courant, et le journalise comme dégradé ».

---

## G7 — L'élève absent de la semaine 1 reçoit un niveau qui n'est pas une ancre, et l'absence *partielle* n'est traitée nulle part

**Où** — `01-routeur.md` §4 (cold start : « Les élèves absents reçoivent la médiane de leur classe ») ; §3 (`derniere_ancre` = « Date et valeur de la dernière mesure en classe ») ; §7 (plafond ancre + 2 ; descente par les ancres uniquement ; discordance ≥ 2 crans → drapeau) ; §8 (le diagnostic est **deux passations** distinctes).

**L'attaque** — Le cold start attribue à l'élève absent « la médiane de sa classe », marquée `profil_provisoire`. **Les deux documents ne disent pas si cette médiane est écrite dans `derniere_ancre`**, et les deux lectures cassent quelque chose de différent :

- **Si elle n'est pas une ancre** : l'élève n'a **aucune ancre** jusqu'à la première évaluation en classe que le plan lui donnera — date non garantie, puisque le §7 concède que « tenir la cadence est un acte de planification ». Pendant cet intervalle, le plafond d'inflation (ancre + 2) n'a pas d'opérande : sa lettre monte sans borne, exactement l'inflation que le plafond existe pour empêcher. La descente est impossible, elle est réservée aux ancres. Le drapeau de discordance ne peut pas se calculer. Et à la clôture du segment 2, `profil_provisoire` bascule à faux sur un niveau que **personne n'a mesuré sur cet élève**.
- **Si elle est une ancre** : le §7 s'applique intégralement à un nombre fabriqué. Déroulé : élève absent, médiane de classe = C en Argumentation, niveau réel E. Ses exercices maison mesurent E, E, E. Discordance de 2 crans entre la trajectoire maison et « l'ancre » → **« la lettre suit l'ancre »**, elle est **remontée** à C, et un drapeau part vers le professeur avec les hypothèses écrites au §7 : « aide extérieure ? stress ? conditions ? ». Le système corrige la mesure juste par la mesure fabriquée, et signale l'élève comme suspect.

Plus fréquent, et absent des deux documents : **l'absence partielle.** Le §8 précise que le diagnostic de la semaine 1 est composé de **deux passations en classe** — un essai et une explication de texte — donc deux séances distinctes, en première semaine de rentrée, avec des élèves bi-classe répartis sur deux cours. Un élève présent à l'essai et absent à l'explication a six niveaux d'écriture mesurés et cinq niveaux de lecture manquants. Le texte ne connaît que « les élèves absents » comme catégorie globale. Sur l'effectif indiqué au contexte de séance (~70 élèves), ce cas n'a rien de marginal.

**Gravité** — `BLOQUANT`

**Correctif minimal** — Écrire au §4 : « la médiane de classe **n'est jamais écrite dans `derniere_ancre`** ; une compétence sans ancre réelle est plafonnée à sa valeur initiale + 1, ne peut pas descendre et ne déclenche aucun drapeau de discordance jusqu'à sa première ancre ». Et appliquer le cold start **passation par passation**, non élève par élève.

---

## G8 — Le Questionnement a une seule lettre pour deux instruments d'inégale validité, consommée par deux règles de ciblage qui s'ignorent

**Où** — `01-routeur.md` §2 (« une lettre par élève × compétence, **alimentée par les deux familles** ») ; §5 R2 et le seuil d'entrée ; §13 (règle de ciblage lecture v1) ; §10 (`famille` sur chaque mesure) ; `00-referentiel.md` §1 (sous-dimensions *[à valider]*), §2 (typage « **hérité sans preuve côté lecture** »), §6 (échelle commune), §7.

**L'attaque** — Le §2 tranche la clé : une lettre unique par compétence, alimentée par les deux familles. La fusion du 29/07 est donc appliquée jusqu'au bout. Personne n'a regardé ce que cette lettre unique fait subir aux deux règles qui la consomment.

*Deux instruments, une lettre.* Le Questionnement est mesuré côté écriture par un instrument dont les ancres existent depuis le 17 juillet, et côté lecture par un instrument dont le référentiel dit que le typage à seuil est « acté de longue date côté écriture, et **hérité sans preuve côté lecture** », dont les deux sous-dimensions sont *[à valider]* et dont le seuil est *[à valider côté lecture]*. Les deux versent dans la même case. Une lettre de Questionnement à C ne dit donc pas la même chose selon la proportion de mesures de lecture qu'elle contient — proportion qui varie d'un élève à l'autre et n'apparaît nulle part.

*Deux règles, aucune communication.* R2 (écriture) élit « la plus faible du trio {Questionnement, Argumentation, Structure} », sous un **seuil d'entrée acté** : « pour un élève globalement faible, le Questionnement ne devient cible primaire que si Argumentation *et* Structure ont atteint C ». La règle de ciblage lecture du §13 élit « la plus faible des cinq », sans seuil d'entrée. Conséquence : un élève faible en Argumentation et en Structure est **bloqué** en écriture sur le Questionnement, et **simultanément** routé dessus par la lecture — le seuil d'entrée, décision actée du 30/07 dont l'argument est « on stabilise le corps du devoir avant la tête », est contourné par l'autre famille sans que personne l'ait décidé. Et l'inverse : la lettre que le seuil d'entrée surveille peut monter par des mesures de lecture pures, jusqu'à sortir le Questionnement du bas du trio sans qu'aucune dissertation ait bougé.

*L'échelle commune, condition de la collige.* Le référentiel §6 exige « une **échelle commune** pour les compétences partagées entre les deux parcours… condition de la collige des signaux ». Un élève HLP pur n'a aucune mesure de Questionnement d'écriture — le §1 acte que le Questionnement « n'est pas actif en écriture pour le HLP ». Sa lettre est donc **entièrement** de lecture, quand celle d'un élève de TC est mixte. Les deux ne sont pas commensurables, et c'est pourtant sur cette comparaison que reposent l'agrégation et l'analyse de fin d'année.

*Un dernier effet, mineur.* Le référentiel §7 retire la paire de duals Questionnement écriture ↔ lecture au motif qu'« il n'y a plus **deux mesures** à corréler ». C'est vrai des lettres, pas des mesures : le §10 du routeur pose que chaque mesure porte `famille`, donc les deux flux restent séparables et corrélables. Le test qui aurait dit si le geste est vraiment le même des deux côtés — l'argument central de la fusion — est retiré alors que la donnée qui le permet est journalisée.

**Gravité** — `AVANT-ALLUMAGE`

**Correctif minimal** — Étendre le seuil d'entrée du Questionnement à la règle de ciblage lecture, ou déclarer explicitement qu'il ne vaut qu'en écriture — c'est une phrase au §13, mais c'est une décision de conception qui appartient à l'auteur. Et rétablir au référentiel §7 la corrélation Questionnement-écriture ↔ Questionnement-lecture **au niveau des mesures**, `famille` étant déjà au journal.

---

## G9 — Le plafond d'inflation ne borne pas seulement l'affichage : il pilote le ciblage

**Où** — `01-routeur.md` §7 (plafond ancre + 2, « cas assumé du début d'année ») ; §5 R2 et son départage ; §6 (définition de la stagnation) ; annexe B, cas « Le fort au mauvais jour ».

**L'attaque** — L'annexe B examine le plafond du seul point de vue de l'affichage : l'élève solide diagnostiqué D en Structure plafonne à B, « sa trajectoire maison monte et bute au plafond ; **aucun drapeau** — c'est le comportement voulu, l'anti-inflation ; le premier DS ingéré comme ancre ou le diagnostic suivant relève le plafond ». Personne n'a regardé l'effet sur le **routage** pendant l'intervalle.

Déroulé, du même élève. Diagnostic raté en Structure : **D**. Ses autres lettres sont justes : Argumentation B, Questionnement B. R2 élit « la plus faible du trio » : Structure, strictement en dessous des deux autres. R5 impose un exercice sur une autre cible après deux, d'où **Structure, Structure, Argumentation, Structure, Structure, Argumentation…** — deux tiers de son écriture sur la compétence où il est en réalité le meilleur.

Combien de temps ? Sa lettre doit monter de D à B, soit **deux crans**, chacun exigeant « 2 mesures sur 3 au niveau ≥ lettre+1 » dans une fenêtre de montée de six semaines, avec « jamais plus d'un cran à la fois ». Six à douze semaines, donc, avant que Structure n'égale Argumentation et que le départage « (a) la moins récemment ciblée » ne prenne le relais — après quoi l'élève alterne encore, à parts égales, entre sa meilleure compétence et les autres.

Et rien ne le voit pendant ce temps. L'escalade ne se déclenche pas, parce que la stagnation est définie au §6 comme « aucun changement de statut sur la fenêtre **et** lettre immobile » : ses observables passent en acquis, la première condition est fausse, donc aucun N1, aucun N2, aucun drapeau professeur — et l'annexe B a explicitement béni l'absence de drapeau. La correction ne vient que d'un DS ingéré ou du diagnostic de décembre, c'est-à-dire d'un événement qui n'est pas garanti (§7 : « acte de planification »).

Le cas symétrique est plus grave pédagogiquement : l'élève faible diagnostiqué **E** plafonne à **C**, pile la valeur qui déclenche la sortie de R1 (« Sortie de R1 quand Expression atteint C ») et pile le seuil d'entrée du Questionnement (« Argumentation *et* Structure ≥ C »). Un seul mauvais matin borne trois règles de ciblage à la fois.

**Gravité** — `AVANT-ALLUMAGE`

**Correctif minimal** — Découpler la lettre **affichée** de la lettre **de ciblage** : R2 élit sur la valeur non plafonnée, l'affichage reste plafonné. Une colonne dérivée, aucune règle changée. À défaut : lever un drapeau lorsqu'une lettre est au plafond depuis plus de N semaines **et** que ses observables progressent — c'est le signal exact que le diagnostic initial était faux.

---

## G10 — Entre deux ancres, la lettre est monotone croissante par construction, et le seul garde-fou vient d'être retiré

**Où** — `01-routeur.md` §7 (montée par le maison ; descente par les ancres uniquement ; asymétrie des sondes ; cadence d'ancre et son signal non bloquant ; abandon de la « fraîcheur d'ancre »).

**L'attaque** — Trois asymétries **actées** se composent : (a) la montée se fait par le travail maison, 2 mesures sur 3 ; (b) la descente se fait **par les ancres uniquement** ; (c) « une sonde réussie compte pour la montée ; une sonde échouée ne compte **jamais** contre la lettre ». Entre deux ancres, **aucun canal de mesure disponible ne peut faire baisser une lettre.** La fonction est monotone croissante par construction, bornée seulement par le plafond ancre + 2.

Chaque asymétrie est défendable isolément, et le document défend chacune. Leur composition n'est examinée nulle part.

Ce qui rétablit la vérité est la cadence d'ancre — « 1 par compétence `evaluee` toutes les 6 semaines » — et le §7 la déclare non contraignante : « Si le plan manque cet objectif : signal non bloquant vers le professeur… et **la lettre ne gèle pas**, elle continue de monter jusqu'au plafond ancre + 2. » Le seul garde-fou qui existait a été retiré le 29/07 : « L'exigence de *fraîcheur d'ancre* pour le second cran est **abandonnée**. »

Le §7 assume que la cadence tienne, et renvoie la charge au plan d'évaluation : « **Tenir la cadence est donc un acte de planification de Louis, pas une règle du routeur.** » Mais aucun des deux documents ne vérifie l'hypothèse dont tout dépend : **combien de passations en classe le calendrier réel contient-il déjà ?** Une ancre par compétence `evaluee` toutes les six semaines, sur ~30 semaines, demande **cinq rondes** ; chaque ronde exige une passation par famille, au format long puisque les DS s'ingèrent « via les types diagnostiques à part entière (essai, dissertation, explication de texte) ». Trois de ces rondes sont fournies par les diagnostics. Restent deux rondes, soit **quatre passations longues supplémentaires par élève et par an**, réparties dans les intervalles septembre-décembre (treize semaines) et décembre-mars. Si le calendrier réel en contient déjà autant, la cadence tient sans coût nouveau ; s'il en contient moins, la cadence est manquée, et le mode de défaillance est **l'inflation silencieuse et généralisée** de toutes les lettres jusqu'au plafond, sur des intervalles de trois mois.

Le document ne pose jamais cette question, alors qu'il en dépend entièrement — et la seule alarme prévue est un signal non bloquant adressé à la personne qui est déjà le goulot.

*Ceci conteste une décision actée — l'abandon de la fraîcheur d'ancre — et le signale comme tel : l'arbitrage appartient à l'auteur.*

**Gravité** — `AVANT-ALLUMAGE`

**Correctif minimal** — Deux choses, l'une avant septembre, l'autre gratuite. Compter, sur le calendrier 2026-27 réel, le nombre de passations longues déjà prévues par famille et par intervalle inter-diagnostics, et le comparer à quatre : c'est un quart d'heure de vérification qui décide si la cadence est une hypothèse ou un vœu. Et ajouter au §10 un indicateur hebdomadaire : *proportion d'élèves dont au moins une lettre est au plafond ancre + 2* — c'est le symptôme visible de l'inflation, et il ne coûte rien à journaliser.

---

## G11 — Le diagnostic de lecture de la semaine 1 est acté ; l'instrument qui le convertit en niveaux est *[à valider]*, et aucun état « sans lettre » n'existe

**Où** — `01-routeur.md` §4 (cold start) et §8 (« l'explication porte les cinq de lecture », tranché le 30/07) ; §3 (table des champs d'état) ; `00-referentiel.md` §5 (le pont E→A, *[à valider]*) et §3 (les quatre blocs d'ancres de lecture, **vides**).

**L'attaque** — Le format du diagnostic de la semaine 1 est **acté** : l'explication de texte « porte les cinq [compétences] de lecture ». Le cold start précise, dans la même section, que « la **Connaissance** et la **Synthèse** restent `differee` » — mention qui n'aurait pas de sens si les autres compétences ne recevaient pas, elles, un niveau. Les cinq compétences de lecture sortent donc du diagnostic avec une lettre.

Or le référentiel §3 laisse les blocs d'ancres de Restitution, Reconstruction, Évaluation et Mouvement **vides**, et le §5 dit exactement ce qui en tient lieu : « le **pont E→A** en règles d'agrégation… **[à valider]** — et activable seulement une fois les champs jugés fiables au banc », en le qualifiant de « pis-aller assumé : il transforme des champs en niveaux **sans que personne ait observé où tombent les seuils** ». Une règle actée du routeur consomme donc, dès la semaine 1, un instrument que le référentiel déclare non validé — et ces niveaux fixent immédiatement le plafond d'inflation (ancre + 2) de la lecture pour tout l'automne.

Second point, indépendant du premier : **il n'existe aucun état « sans lettre ».** Le §3 énumère les champs de l'état par élève × compétence ; `lettre` y est « E, D, C, B ou A », sans valeur d'absence. `profil_provisoire` est un drapeau de **certitude**, pas d'**absence** ; `statut_recette` porte sur l'instrument, pas sur l'élève. Le cas se présente dès que le diagnostic de lecture n'a pas eu lieu pour un élève donné — absence à la seconde passation (voir G7), inscription tardive — et chaque règle en aval lit une lettre : R0, la règle de couverture du segment 2, le pool de sondes, le plafond, la descente, le départage de R2. Aucune ne prévoit qu'elle puisse manquer, alors que le document pose ailleurs la discipline exactement contraire : « **NULL n'est pas 0** » (§1.1, §9, §10).

**Gravité** — `AVANT-ALLUMAGE`

**Correctif minimal** — Ajouter au §3 une valeur `lettre = NULL` avec sa règle en une ligne — « une compétence sans lettre n'est ni ciblable, ni sondable, ni plafonnée, et n'entre dans aucun départage » —, cohérente avec la discipline `NULL ≠ 0` déjà posée. Et écrire au §8 quelle branche s'applique si le pont E→A n'est pas validé au 24 août.

---

## G12 — `duree_exercice_min` est un scalaire alors que le régime v1→vf change à l'exécution, et la fuite tombe sur les plus petits budgets

**Où** — Annexe A du prompt (`duree_exercice_min`, une seule valeur ; `regime_v1vf` ; plage d'étayage) ; `01-routeur.md` §9 (« un type sans vf coûte moins de temps — il en rentre donc davantage dans le cycle » ; « seule valeur que le routeur et le quota décomptent ») ; §6 (« le régime de cycle "optionnel" devient "plein" **pour les exercices portant l'observable ciblé** ») ; §4 couche 1 (progression de l'étayage : segment 3 « étayage fort puis décroissant », segment 4 « étayage faible », segment 5 « conditions d'examen »).

**L'attaque** — Le contrat déclare **une** durée par type. Le §9 pose explicitement que cette durée dépend du régime : « un type sans vf coûte moins de temps — il en rentre donc davantage dans le cycle ». Et le §6 fait basculer les types en régime **optionnel** vers le régime **plein** pendant une escalade active. La durée est donc une variable d'exécution déclarée comme une constante de type.

Les deux branches sont mauvaises, et l'une est nettement pire :

- si la valeur déclarée inclut la version finale, le budget de tous les élèves **non** escaladés est surestimé : on leur donne moins d'exercices qu'ils ne peuvent en faire, toute l'année ;
- si elle l'exclut — lecture plus naturelle, puisqu'un type « optionnel » est nominalement sans vf —, le budget des élèves **en escalade** est dépassé silencieusement de toute la phase de révision et de lecture du retour final. Et l'escalade frappe par définition les élèves en difficulté, qui sont ceux du budget le plus bas (TC, 45-60 minutes). **On ajoute de la charge non budgétée exactement à ceux qui n'en ont pas**, et le §10 ne journalise rien qui permette de s'en apercevoir.

Le même problème se pose, plus lentement, avec l'étayage. La couche 1 fait décroître l'étayage de segment en segment, jusqu'aux « conditions d'examen » du segment 5 ; le contrat traite la plage d'étayage comme un paramètre de consigne, sans effet sur la durée déclarée. Le même type, instancié avec étayage fort en octobre et sans étayage en avril, ne prend manifestement pas le même temps — c'est le retrait de l'étayage qui allonge le travail. Le budget décompte pourtant la même valeur, et se trompe donc de plus en plus à mesure qu'on approche du bac.

**Gravité** — `AVANT-ALLUMAGE`

**Correctif minimal** — Remplacer l'attribut scalaire par **deux valeurs** au contrat : `duree_v1_min` et `duree_vf_min` (la seconde nulle pour les types sans version finale), le budget décomptant leur somme selon le régime **effectif** au moment de l'assignation. La plage d'étayage peut rester un paramètre de consigne si l'on assume l'écart, mais alors l'assumer par écrit.

---

## G13 — Le multiplicateur X des multi-appels n'est pas un paramètre de diagnostic : selon la lecture retenue, il domine ou non la facture annuelle

**Où** — `01-routeur.md` §8 (« Multi-appels IA… sur **X passages**… **réservés aux diagnostics** » ; « Les DS de classe… s'ingèrent par les canaux diagnostiques ») ; §7 (« les DS s'ingèrent par les **mêmes** canaux diagnostiques », citant la SPEC C3 §3) ; §11 (« X passages : **à chiffrer** ») ; §4 couche 3 (« Lequel l'emporte n'a pas été calculé »).

**L'attaque** — Le document identifie un seul poste de dépense non chiffré — la largeur de mesure des exercices hebdomadaires — et concède que « lequel l'emporte n'a pas été calculé ». Un second poste, plus gros, n'est pas même identifié comme poste.

*L'ordre de grandeur du régime hebdomadaire.* Avec l'effectif du contexte de séance (~70 élèves) et ~28 cycles à 2-3 exercices, soit **~5 000 exercices par an**, à 4 appels pour la cible (P1 + P2 sur v1, P1 + P2 sur vf) plus 2 par sonde : **de l'ordre de 25 000 à 30 000 appels**, sur le modèle économique.

*L'ordre de grandeur des ancres, et l'ambiguïté qui le décide.* Le §8 réserve les multi-appels « aux diagnostics », puis énumère dans la même liste « Trois diagnostics en classe » et « Les DS de classe », ces derniers passant « par les canaux diagnostiques ». **Rien ne dit si un DS ingéré hérite du multiplicateur X.** Les deux lectures ne diffèrent pas à la marge :

> lecture étroite (X sur les seuls trois diagnostics) : 70 × 11 compétences × 2 appels × **3** rondes × X = **4 620 × X**
> lecture large (X sur toute la cadence d'ancre) : 70 × 11 × 2 × **5** rondes × X = **7 700 × X**

À X = 3, l'écart entre les deux lectures est de 9 000 appels ; à X = 5, de 15 000 — soit, dans les deux cas, la moitié du régime hebdomadaire annuel. Et ce sont les appels les plus chers du dispositif à deux titres : dans le régime de modèle envisagé au §4 (« Haiku pour l'hebdomadaire, **Sonnet pour les ancres** »), ce sont les seuls à tourner sur le modèle fort ; et ils portent sur des textes **au format complet**, le §8 ayant acté que le diagnostic est « un essai + une explication de texte » et écarté l'option « batterie de micro-tâches ».

Le §11 laisse X « à chiffrer — dépend du régime de modèle » ; le §4 fait dépendre l'arbitrage du régime de modèle du calcul de la largeur de mesure. Chacun attend l'autre, et aucun des deux ne pose la question qui les précède : **X s'applique-t-il aux DS ?**

**Gravité** — `AVANT-ALLUMAGE`

**Correctif minimal** — Une phrase au §8 : « les multi-appels sont réservés aux **trois diagnostics annuels** ; un DS ingéré comme ancre passe en un seul passage bi-phasé (X = 1) ». Et porter les deux ordres de grandeur ci-dessus au §11, pour que l'arbitrage du régime de modèle parte d'un chiffre.

---

## G14 — La bascule de `profil_provisoire` est inconditionnelle : elle ne vérifie pas que l'objectif de couverture a été atteint

**Où** — `01-routeur.md` §3 (définition de `profil_provisoire`) ; §4 point (c) ; §5 (règle de calibration : « jusqu'à en avoir **au moins deux** chacune ») ; §7 ; §6 (« Les compteurs ne démarrent donc qu'au segment 3 »).

**L'attaque** — Le dispositif est cohérent sur le principe : `profil_provisoire` marque un niveau à faible certitude, le segment 2 est le segment où cette certitude se construit — « le routeur ne cherche pas le levier, il cherche la **couverture** », cible « les compétences `evaluee` ayant le moins de mesures, **jusqu'à en avoir au moins deux chacune** » — et le drapeau bascule à la clôture.

Ce qui manque est le lien entre les deux. La bascule est déclenchée par une **date** — « à la clôture du segment 2 » — et non par l'atteinte de l'objectif que le segment 2 poursuit. Aucune des deux formulations (§4 point c, §7) ne conditionne la bascule au fait que l'objectif « au moins deux mesures » ait été rempli.

Le cas se produira. Trois semaines, un élève qui ne rend rien ou peu, un élève arrivé en cours de segment, un élève dont la moitié des exercices est allée à Expression parce que R1 était active : il sortira du segment 2 avec zéro ou une mesure sur plusieurs compétences. Le drapeau bascule tout de même. À partir de là, **les compteurs d'escalade démarrent** (§6 : « les compteurs ne démarrent qu'au segment 3 » — et rien d'autre ne les retient), les lettres s'affichent, et le plafond d'inflation se calcule — sur un profil dont la certitude est exactement celle que le drapeau signalait la veille.

**Gravité** — `AVANT-ALLUMAGE`

**Correctif minimal** — Faire de la bascule une condition et non une date : « `profil_provisoire` passe à faux à la clôture du segment 2 **pour les seules compétences ayant atteint le seuil de couverture**, et reste vrai pour les autres ». C'est une clause `WHERE`, et elle rend le seuil du §5 opérant au lieu d'indicatif.

---

## G15 — La définition de la stagnation est indéfinie sur sa première fenêtre, et rien ne distingue « ne progresse plus » de « n'a pas encore commencé »

**Où** — `01-routeur.md` §6 (acquisition d'un observable ; définition de la progression et de la stagnation ; N1 ≈ 3 mesures plates ; « les compteurs ne démarrent qu'au segment 3 »).

**L'attaque** — Les trois définitions du §6 s'enchaînent ainsi : un observable est **acquis** « quand son taux de réussite sur la fenêtre des 3-4 dernières mesures dépasse ~2/3 » ; la **progression** est « au moins un observable **change de statut** vers acquis » ; la **stagnation** est « aucun changement de statut sur la fenêtre *et* lettre immobile ».

Un *changement* de statut suppose un état antérieur auquel comparer. Or les compteurs démarrent au segment 3 : la première fenêtre pleine est aussi la première fenêtre, et il n'y a rien avant elle. La définition n'a donc pas de valeur définie sur son premier cas d'application, et deux implémentations également fidèles au texte divergent :

- « aucun changement observé » ⇒ **stagnation vraie par défaut** : tout élève dont les observables ne sont pas déjà acquis au bout de trois mesures entre en N1, dès les premières semaines d'octobre ;
- « pas de comparaison possible ⇒ pas de verdict » ⇒ N1 ne peut jamais se déclencher avant **deux** fenêtres pleines, soit six à huit mesures sur une même compétence — auquel cas N1 arrive après le seuil nominal de N2.

Le second défaut est indépendant du premier et survit à sa correction : la définition ne distingue pas **un observable en échec** d'**un observable jamais réussi parce que jamais travaillé**. Les deux se présentent identiquement — taux nul, aucun changement de statut. Un élève qui découvre une compétence au segment 3 et un élève qui la travaille depuis deux mois sans progresser reçoivent le même verdict et la même intervention (type isolant, retour mono-focal), alors que le premier n'a besoin que d'être enseigné.

**Gravité** — `AVANT-ALLUMAGE`

**Correctif minimal** — Deux phrases au §6. « La stagnation exige **deux fenêtres consécutives closes** ; aucun compteur ne court avant la clôture de la première. » Et : « N1 ne se déclenche que sur un observable dont le taux est **descendu sous un plancher après avoir été mesuré au moins une fois au-dessus**, ou qui plafonne sous ce plancher sur deux fenêtres » — ce qui sépare l'échec de l'inconnu.

---

## G16 — La session datée dépend de la session sans date

**Où** — `01-routeur.md` §5, chapeau (session « construction de la semaine », sans date) ; §13 (session « ciblage lecture », « **avant l'allumage de début septembre** », agenda points 2 et 3).

**L'attaque** — La session « ciblage lecture » porte une échéance ferme : sa version des couches 2-3 est « à construire en session de conception dédiée, **avant l'allumage de début septembre** ». Son agenda comporte, en point 2, « **L'interface avec la session "construction de la semaine"** — comment le partage probabiliste écriture/lecture se règle-t-il dans le remplissage du budget ? », et en point 3 « La place de la préférence de l'élève ».

La session « construction de la semaine », qui décide de cette interface — le §5 lui attribue « combien d'exercices par cycle, quelles durées, comment le budget se remplit, **comment la préférence écriture/lecture est pesée** » —, n'a **aucune date** dans le document. Elle est seulement rattachée à « l'ouverture n°3 du tableau de bord de la SPEC C3, qui bloque le *fait quand* du lot C4-L2 ».

Une session datée avant septembre a donc pour entrée le résultat d'une session non datée, et la seule règle qui rendait ce couplage inoffensif — la cadence 2-1, qui tranchait le partage écriture/lecture sans avoir besoin d'aucune des deux — a été **supprimée** le 30/07 (§1.2). Le §13 le dit lui-même : « **Rien ne garantit plus une part de lecture** ». Le chevauchement des périmètres est réel aussi : la « préférence de l'élève » est revendiquée par le §5 et figure en point 3 du §13.

**Gravité** — `AVANT-ALLUMAGE`

**Correctif minimal** — Dater la session « construction de la semaine » **avant** celle du ciblage lecture, et retirer du §13 le point 3 (la préférence), qui appartient au §5. À défaut, poser une règle de repli explicite tenant lieu de cadence 2-1 : un plancher fixe de minutes de lecture par cycle, applicable dès qu'une compétence de lecture est `evaluee`.

---

## G17 — R2 compare trois lettres dont l'une repose sur une fonction d'agrégation non tranchée

**Où** — `01-routeur.md` §5 R2 (« la plus faible du trio {Questionnement, Argumentation, Structure} ») ; `00-referentiel.md` §2 (encadré « cette règle rouvre-t-elle l'Option A ? », *[à valider]*).

**L'attaque** — R2, règle de ciblage principale et actée, élit « la plus faible du trio » — donc compare trois lettres. Les trois ne sont pas fabriquées de la même façon.

**Argumentation** est à seuil, son seuil est observable (`objections[].traitement`), c'est la compétence pilote : sa procédure tient. **Structure** est symétrique : sa lettre sort d'une agrégation entre deux sous-dimensions graduées, et le référentiel §2 note que la règle « graduée 0-4 par dimension, puis **moyenne arrondie vers le bas** » n'a été actée que « portée Expression », qu'elle reste « **à étendre ou non aux autres symétriques dans leur chantier respectif** », et surtout que « le choix de *moyenne arrondie vers le bas* est désormais **un paramètre à défendre**, et non une évidence. *[à valider]* ».

Sur une échelle 0-4, l'arrondi décide de la lettre : un élève à 2,5 en Structure sort à **C** avec l'arrondi vers le bas et à **B** avec l'arrondi au plus proche. Selon le cas, R2 cible Structure ou Argumentation, et l'élève passe l'automne sur l'une ou sur l'autre. Une décision de conception marquée *[à valider]* dans un document pilote donc une règle marquée actée dans l'autre — c'est le cas où un *[à valider]* est en réalité présupposé résolu par une règle actée.

**Gravité** — `À SURVEILLER` (à trancher au chantier Structure, mais avant que R2 tourne en production)

**Correctif minimal** — Une phrase au §5 : « en cas d'écart d'un seul cran entre deux membres du trio dont les procédures d'agrégation diffèrent, l'ordre de levier (Argumentation > Structure > Questionnement) prime sur l'écart ». Cela absorbe l'incertitude d'arrondi sans attendre le chantier.

---

# Vrac

- **`01-routeur.md` §2 contre §10, même jour.** Le tableau du §2 écrit, pour le Monitoring : « Télémétrie au §10 — **qui ne journalise aujourd'hui aucun de ses champs** (alerte du 29/07, à traiter à la passe du §10) ». Le §10, point 4, journalise les quatre champs et déclare l'alerte refermée. Les deux sections sont marquées « passée le 30 juillet ».
- **Alerte périmée dans le référentiel.** L'encadré du `00-referentiel.md` §2 porte encore « le §10 du `01-routeur.md`… ne mentionne aucun de ces champs. À aligner à la passe du routeur ». Le §10 du routeur dit désormais qu'elle « peut être levée » — mais personne ne l'a levée. Un lecteur du référentiel lit aujourd'hui une alerte fausse.
- **L'ordre d'attribution du parcours est *[à valider]* dans trois sections et un fait dans une quatrième.** `00-referentiel.md` §6 : « **Proposition**… ***[à valider]*** ». `01-routeur.md` §2 : « *Piste **[à valider]*** ». `01-routeur.md` §5 R6 : « *L'attribution du parcours d'une mesure suit l'ordre du §2* », sans réserve. `01-routeur.md` §10 : journalisé comme acquis (« le parcours dérivé suit l'ordre du §2 »). Ce qui est acté par R6 est le **changement de support du drapeau** (du parcours au genre), pas l'ordre d'attribution qui le sert.
- **La formule « 2N + 4 » définit N de deux façons incompatibles.** §4 couche 3 : « N est le nombre de compétences **mesurées** » — ce qui inclut la cible, elle-même mesurée (§1.4). §6 point 4 : « chaque sonde ajoute 2 appels… **cette règle fixe donc le N** », avec « la version finale ne repasse que pour la compétence cible » — soit 4 appels fixes pour la cible et N = les seules sondes. L'écart est de **2 appels par exercice**, environ 10 000 sur l'année, et c'est sur cette formule que se fera l'arbitrage du régime de modèle, décrit comme « le plus gros levier de coût restant ».
- **Collision de vocabulaire sur « diagnostic ».** Le §9 appelle *geste diagnostic* un exercice par paires de copies, sans version finale, servant de test de transfert immédiat. Le §8 appelle *types diagnostiques à part entière* les formats longs (essai, dissertation, explication) par lesquels un DS devient une ancre. Deux objets sans rapport sous le même mot, dans un document qui a passé sa révision à homogénéiser son vocabulaire.
- **Le lieu de passation de l'essai de Fragments n'est écrit nulle part**, alors que le §8 en fait « une ancre de plus » — donc porteuse du droit de descente, que le §7 réserve aux ancres au motif qu'« un mauvais exercice maison a mille explications ». S'il est écrit à la maison, l'architecture ancre/trajectoire du §1.6 est percée par sa propre liste d'ancres.
- **`derniere_ancre` est défini plus étroitement que la liste des ancres.** §3 : « Date et valeur de la dernière **mesure en classe** ». §8 : cinq entrées, dont l'essai de Fragments et les DS. Le §1.6 (« les mesures en classe — diagnostics, synthèse en classe — sont les ancres ») donne la clé de lecture, mais l'énumération de `contexte` du §10 distingue quatre valeurs dont trois sont des ancres : la définition gagnerait à énumérer plutôt qu'à qualifier.
- **Annexe B, « Le canal bouché », attend un sondage que la règle d'espacement classe dernier.** Le cas prévoit qu'« Expression est **sondée en secondaire** sur les exercices du trio ». Sous R1, Expression est ciblée un exercice sur deux, donc la plus récemment mesurée du profil, donc dernière au critère 3 du §6 (« la plus anciennement mesurée »). Elle ne sera sondée que là où elle est seule candidate. Le cas de test n'est pas faux, mais il décrit un comportement que la règle rend exceptionnel.
- **Annexe B, « Le canal bouché », suppose un état que l'ordre de développement rend improbable.** Le cas exige « Expression D, Questionnement D, Argumentation C, Structure C — **toutes `evaluee`** », alors que le §12 place le Questionnement **en dernier** dans l'ordre d'écriture. L'exception y est prévue (réquisition par la session ciblage lecture), mais elle porte sur la fiche, pas sur la recette du banc.
- **Le bi-classe reçoit une prime de budget que rien ne convertit en éventail.** Le §3 justifie l'écart de déclenchement par le volume d'évidence (« environ deux fois plus »), et le §6 garantit qu'« une compétence n'est sondée qu'une fois par cycle » — donc plus d'exercices élargit bien la mesure. Mais aucune règle n'élargit ses **cibles** : R2 est sans mémoire, R5 est inerte sous R1 (G4). Le supplément de budget produit d'abord plus d'exercices sur les mêmes cibles.

---

# Angles morts

**1. L'anti-Goodhart et le Monitoring se détruisent l'un l'autre, et aucun des deux documents ne les met face à face.**

Le §8 acte que « **le retour ne révèle jamais la grille complète des observables** », comme atténuation délibérée de l'effet Goodhart : on ne veut pas que l'élève apprenne à produire les signes que la grille guette. Le Monitoring, lui, est décrit par le référentiel §1 comme « l'axe que la plateforme cherche, à terme, à **installer** » : il demande à l'élève de juger sa propre copie, mesure l'écart entre ce jugement et celui de l'instrument, et lui renvoie une amplitude et une direction (« surconfiant »).

On demande donc à un élève de 16-18 ans de calibrer son jugement sur un référent dont on lui cache délibérément les critères, et on lui signale l'écart. Un élève classé « surconfiant » n'a, par construction, aucun moyen de savoir sur quoi il se trompe — et l'asymétrie actée au référentiel §2 (« à amplitude égale, la surconfiance appelle une **intervention** ») fait de cette impasse le cas qui déclenche le plus d'action. Le référentiel §3 anticipe même l'artefact voisin — « l'élève qui **lisse tout** ne produit ni aveu ni hypothèse, donc peu de matière à calibrer » — sans voir que c'est la stratégie rationnelle exacte que l'opacité récompense : ne rien déclarer, c'est ne jamais être pris en défaut de calibration.

*Le geste minimal* : décider ce que le retour de Monitoring montre. Révéler les observables **de la seule compétence du jour**, après remise de la version finale — donc trop tard pour être joué, assez tôt pour être appris — réconcilie les deux objectifs. C'est une décision de conception à prendre avant les écrans du lot C4-L3.

**2. La plateforme stocke, pour des mineurs, une caractérisation psychologique qu'aucun banc n'a validée — et rien n'est écrit sur son statut.**

`monitoring_niveaux` conserve, par élève et par sous-dimension, une amplitude d'écart et une **direction** : « surconfiance » ou « sous-confiance ». Le référentiel §2 est explicite : ces ancres sont « écrites a priori le 29/07 », « le Monitoring ne peut pas être bancé avant la rentrée », et « **juin 2027 dira si on s'est trompé** ». Le §10 du routeur journalise en outre les réponses de l'élève aux questions de « se juger » et sa `confiance_declaree`.

Une lettre de compétence est un objet scolaire ordinaire : elle est contestable, elle a une grille, elle se périme. « Surconfiant » n'est aucune de ces choses. C'est un trait attribué à une personne mineure, produit par un instrument que ses propres auteurs déclarent non validé, conservé sans durée de rétention écrite, dans un dossier dont ni le référentiel ni le routeur ne disent qui peut le consulter, ce qu'il devient en fin d'année, ni ce qu'un parent verrait s'il le demandait. La protection « il n'est **jamais noté** » est une garantie sur l'usage sommatif, pas sur l'existence de la donnée.

Le contexte rappelé au prompt de séance — élèves mineurs, établissement québécois, Loi 25 — fait de ce point autre chose qu'une élégance de conception. Aucun des deux documents ne le mentionne une seule fois.

*Le geste minimal* : une ligne de politique de données pour `monitoring_niveaux` et `exercices_metacognition` — rétention, purge de fin d'année, accès — écrite avant que le lot C4-L1 ne crée les tables, c'est-à-dire maintenant.

**3. La largeur de mesure est indexée sur le niveau : le diagnostic le plus riche va à ceux qui en ont le moins besoin.**

Le §1.4 pose que « la largeur de mesure suit la **complexité de l'exercice** : plus l'exercice est complexe — donc plus l'élève progresse — plus on mesure large ; sur un exercice simple, mesurer large est difficile, et on mesure étroit ». La couche 3 indexe la complexité sur le niveau. Le §4 en tire la seule conséquence qu'il regarde, et c'est une conséquence de facture : « l'élève qui progresse fait **peu** d'exercices mais **chers** ; l'élève faible en fait **beaucoup** mais **bon marché**. »

La conséquence pédagogique n'est notée nulle part. Un élève à D reçoit des exercices micro, donc étroits, donc une ou zéro sonde : son profil se construit sur une compétence à la fois, et les autres restent à leur valeur du diagnostic pendant des mois. Un élève à B reçoit des exercices méso-macro, donc larges : deux ou trois compétences mesurées à chaque fois, un profil dense et frais. **Plus un élève est en difficulté, moins la plateforme sait de lui** — alors que c'est de lui qu'il faudrait le plus savoir, puisque R1, R2 et l'escalade le routent en permanence sur la foi de ce profil. Le plafond de sondes par cycle, dont le §6 dit qu'« **il borne la facture** », est le paramètre qui décidera de l'ampleur de l'écart, et il est aujourd'hui « à chiffrer ».

*Le geste minimal* : traiter la largeur de mesure comme un **plancher** chez les élèves faibles — « au moins une sonde par cycle, quel que soit le grain » — plutôt que comme un plafond uniforme. Et journaliser au §10 le **nombre de compétences fraîches** par élève : c'est l'indicateur qui rendrait l'écart visible dès novembre plutôt qu'à l'analyse de fin d'année.

**4. L'ancre aveugle est le seul juge extérieur du dispositif, et sa sentence n'a aucune suite prévue.**

Le §8 acte le bac blanc « corrigé à la main hors de toute chaîne IA », marqué comme **ancre aveugle**, dont « une fois par semestre ses résultats sont mis en regard des lettres ». La justification est la plus lucide des deux documents : « l'instrument qui mesure est celui qui enseigne, et un élève peut apprendre à produire les signes que la grille guette **sans que sa pensée bouge** ». Les diagnostics ne peuvent pas jouer cet arbitre, puisqu'ils passent par la même chaîne.

Puis le dispositif s'arrête. Rien ne dit **ce qui se passe si l'écart est grand** : pas d'unité de comparaison, pas de seuil, pas de destinataire, pas d'action. Le §10 ne prévoit aucune table pour lui ; il n'apparaît pas au §11 ; il n'est cité par aucune règle des §5, §6 ou §7. La première mise en regard aura lieu en janvier, sur des lettres qui pilotent déjà tout le routage depuis quatre mois. Si elle montre un décrochage, aucune règle n'obligera à en tirer quoi que ce soit ; si elle ne montre rien, personne ne saura si c'est parce que le dispositif est juste ou parce que la comparaison a porté sur trop peu de copies.

*Le geste minimal* : définir avant septembre les trois choses qui manquent — l'unité de comparaison (l'écart en crans, par compétence), le seuil qui déclenche quelque chose, et ce que ce quelque chose est (au minimum : geler les montées de la compétence concernée jusqu'au diagnostic suivant). Une ancre aveugle sans conséquence écrite est un rituel, pas un contrôle.
