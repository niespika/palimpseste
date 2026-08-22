# RELEVÉ DE NON-PERTE POUR LA v6 — rafraîchi

**Établi le 18 août 2026.** Il remplace `RELEVE_C3_pour_v6_decisions_sans_domicile_2026-08-15.md`, dont le corpus constaté a trois jours de retard et ignore trois documents.

**Statut : relevé préparatoire — aucune décision n'est prise ici, aucun amendement n'est posé.**

---

## Ce qui a changé depuis le relevé du 15/08

Le relevé du 15/08 travaillait sur **six** sources et concluait que le gros de C3 était « C3-natif, sans domicile par construction » : le schéma, les lots, la porte de recette, les formats, les six temps, la passation en classe. **Cette conclusion était exacte le 15 août. Elle ne l'est plus.**

Entre-temps, `06-Palimpseste.md` a été écrit en entier, `07-Implementation.md` est né, `08-FORMAT_IMPORT.md` est apparu. Ces trois documents ont absorbé l'essentiel du matériau que le relevé croyait orphelin.

| document | dans le relevé du 15/08 | au 18/08 |
|---|---|---|
| `00-referentiel.md` | v3.0 | **v4.0** |
| `01-routeur.md` | v4.0 | **v5.0** |
| `02-exercices.md` | v4.0 | **v5.0** |
| `03-competences.md` | v1.1, *pas encore gelé* | **v2.0, VALIDÉ ET GELÉ** |
| `04-Instances_Exercices.md` | sans numéro, *« en flux »* | **v3.0, VALIDÉ ET GELÉ** |
| `05-GENERATEUR_Reference_Decomposee.md` | v1.2 | **v2.0** |
| `06-Palimpseste.md` | *absent du corpus* | **v2.0, VALIDÉ ET GELÉ** |
| `07-Implementation.md` | *absent du corpus* | **v2.0, VALIDÉ ET GELÉ** |
| `08-FORMAT_IMPORT.md` | *n'existait pas* | **v1.0, DÉPOSÉ** |
| amendements en attente | 27 | **29** *(entrées 58, 59, 60 ajoutées)* |

**Méthode.** C3 v5.4 relue en huit passes parallèles, section par section, chaque item cherché dans les neuf sources par son nom technique **et** par son libellé français. Aucun verdict rendu sur un titre de section : chaque domicile est attesté par une phrase exacte et son numéro de ligne. Ce qui n'a pas pu être tranché est dit tel quel.

---

## Le résultat en un chiffre

**325 items de C3 passés au crible.**

| verdict | n | part |
|---|---|---|
| **DOMICILIÉ** — la substance vit dans une source | **230** | 71 % |
| **DIVERGENT** — les deux le portent et ils se contredisent | **39** | 12 % |
| **PARTIEL** — la source en porte une part | **30** | 9 % |
| **SANS DOMICILE** — C3 est le seul porteur | **26** | 8 % |

Et le registre des ouverts de C3 *(section B, 34 entrées)* : **18 fermées · 12 transportées · 4 sans porteur.**

**Deux conclusions, et la seconde est la plus importante.**

**(1) C3 n'est plus le domicile de son propre contenu.** Sept de ses onze sections ont un successeur nommé, souvent plus complet qu'elle.

**(2) C3 est FAUSSE en trente-neuf endroits.** Ce n'est plus seulement de la redondance : c'est un document qu'une session de code lit *(règle R4 / règle de manifeste)* et qui lui dira des choses que le corpus a démenties.

---

## La carte — où vit aujourd'hui chaque section de C3

| section de C3 v5.4 | son domicile au 18/08 | état |
|---|---|---|
| **§0** — lexique, télémétrie, sources de vérité | `01-routeur.md` §11 · `LEXIQUE.md` · `07-` §2 *(les statuts)* | domicilié à ~85 % |
| **§1** — les décisions qui fondent la spec | éclaté : `00-` §1-§3 · `01-` §10 · `07-` §4 et §5 | 7 décisions sur 8 |
| **§1.7** — la porte de recette | **`03-competences.md` §9** | **intégral, et enrichi** |
| **§2** — les formats v1 | **`06-Palimpseste.md` §1** | **intégral** |
| **§3** — les six temps | **`06-Palimpseste.md` §2 et §3** | domicilié, sauf le temps 1 |
| **§3bis** — la passation en classe | **`02-exercices.md` §6.D** | **intégral — et 18 étapes, pas 16** |
| **§4 / §4bis** — sélection, budgets, allumage | `01-routeur.md` §4-§9 · `07-` §5 | domicilié, 6 divergences chiffrées |
| **§4ter** — assiduité et affichage | **`06-Palimpseste.md` §5** | **intégral** |
| **§5** — les retours en trois couches | `01-routeur.md` **§12** *(l'architecture)* + `07-` §4 *(le texte)* | **deux domiciles, pas un** |
| **§6** — le schéma | **`07-Implementation.md` §1** | 30 items sur 35 |
| **§7** — anti-triche | **`06-Palimpseste.md` §6** | domicilié |
| **§8** — les frontières | dispersé | le plus faible du lot |
| **§9** — le découpage en lots | **`07-Implementation.md` §2** | **remplacé, et amélioré** |
| **§10** — les risques | **`07-Implementation.md` §7 et §6** | domicilié |
| **§11** — loi 25 | **`06-Palimpseste.md` §7** | **domicilié et étendu** — sauf la date |

---

## PARTIE I — Ce qui mourrait si C3 était périmé demain

**La liste courte, et elle est sûre.** Chaque ligne a été prouvée par un grep sur les neuf sources.

### A. Décisions de Louis qui n'existent qu'en C3

1. **« L'essai de Fragments sera très probablement limité aux seuls HLP, au moins cette année »** *(A27, C3 §1 et §4)*. Le corpus a gardé **la conséquence** — `01-routeur.md` §9 : *« La cadence ne se différencie pas par parcours […] Aucun traitement particulier d'un parcours n'est à construire »* — et **jeté la prémisse**. Le fait lui-même est introuvable ailleurs.

2. **Le dépouillement immédiat du diagnostic** *(option A, C3 §1 point 4)* : tous les bancs tournés avant le 25/08, pipeline photo/OCR critique dès la semaine 1. La **substance** est domiciliée *(les deux passations manuscrites au `06-` §1, le test de charge en condition de recette de C4-L4 au `07-` §7)* ; **le calendrier ne l'est pas**, et il ne peut pas l'être : le `07-` §2 refuse par principe de porter les dates.

3. **Le trou déclaré A26** — aucun palier Acquis observé, six copies sur neuf sans charnière, et la règle *« on n'élargit pas la définition de la charnière pour en fabriquer »*. La règle survit à `competences/structure.md` §8 ; **le constat qui la fonde, non**.

4. **Les chiffres du run Structure du 30/07** — 88,9 % par tirage, 77,8 % par mode, 55,6 % en exact, et la réserve *« l'instrument place à un palier près »*. Aucune des trois valeurs n'existe hors C3.

### B. Noms techniques que seule C3 porte

5. **`signalerEnAttenteIA`** et le patron C1/T3. Le `06-` §6 dit *« le canal de signalement existant »* **sans le nommer**. Une session C6-L1 ne saura pas quel canal réutiliser.

6. **Le journal de coût `api_couts`.** Le `07-` §1 porte l'exigence mot pour mot — *« ce qu'il lui manque : la `phase` et le rattachement à l'exercice »* — mais écrit *« le journal transverse qui existe déjà »* **sans jamais nommer la table**. C4-L1 fait ses migrations une ligne à la fois : il lui faut le nom. *(Le `07-` avait fait exactement ce travail pour `profiles` deux paragraphes plus haut ; il rate la même marche ici.)*

7. **`reference_id` reste optionnel**, et la frontière qui la justifie *(« beaucoup de types travaillent depuis la production de l'élève ou un simple sujet »)*.

8. **Les décisions négatives** : `duree_v1_min` et `duree_vf_min` **ne sont pas créés**. Le `07-` §1 tient pourtant le registre des attributs à ne pas créer *« pour qu'une session ne les cherche pas »* — ces deux-là n'y ont pas été versés.

9. **`published_at` · `lu_at` · `ouvert_at` · `v1_remis_at` · `vf_remis_at` · `juger_debut_at` · `juger_fin_at` · `duree_taguee`.** Tous les **mécanismes** sont écrits en prose au `07-` §1 ; **aucun des noms** n'existe dans le corpus.

### C. Objets du schéma sans successeur

10. **La `fiche` JSONB du type** — quand et pourquoi à l'élève, la procédure, les exemples et le contre-exemple, les questions de guidage, les questions d'auto-évaluation, les contextes de transfert, les **attendus du retour**. Grep nul sur les sept intitulés dans tout le corpus. **C3 en faisait la condition de bascule d'un type en `actif`.** Ce qui disparaît avec elle, c'est tout ce que l'objet disait à l'élève et au professeur : le schéma a gardé la mécanique et perdu la pédagogie de l'objet. *C'est le trou le plus cher de la liste.*

11. **Le garde-fou `retour_degrade`** — un type ne passe pas `actif` si `fiche.attendus_retour` est vide. Retiré du `01-` le 17/08 en même temps que l'objet `fiche` cessait d'exister. **Les deux planchers mécaniques survivants portent sur la COMPÉTENCE, pas sur le TYPE** : rien n'empêche aujourd'hui un type d'exercice de s'activer sans que ce qu'il faut dire à l'élève à son sujet soit écrit.

12. **La règle d'effondrement** de `couverture_observables` : *« entre `exerce` et `isole`, déclarer `exerce` »*. Peut-être devenue sans objet — le `08-` §6 pose que la valeur vient désormais de la route, pas d'une déclaration — **à vérifier avant d'effacer**.

13. **La valeur `paragraphe` de `support`.** L'énuméré vivant n'en a que trois — `phrase`, `extrait`, `texte` *(plus `mot` sur la cible)*. `paragraphe` a disparu **sans que rien ne le dise**, et il reste un **objet** de la bibliothèque : la disparition est silencieuse.

### D. Ce qui n'a plus d'adresse

14. **Le registre des paramètres.** C3 §B/A17 est le dernier document à dire *où* il vit — et il pointe sur le `01-` §11, **qui est devenu « Télémétrie et journalisation »**. `Annexe-routeur.md` a zéro occurrence dans les neuf sources. Les valeurs provisoires sont désormais **éparpillées à huit endroits au moins**, chacune chez sa règle, sans index. *C'est peut-être voulu — mais alors il faut l'écrire, parce que A17 disait le contraire.*

15. **`PROTOCOLE-CALIBRATION.md` fait foi dans sept documents gelés et n'apparaît dans AUCUN manifeste de lot.** Il échappe donc au seul contrôle qui devrait le rattraper. Et rien hors C3 ne dit son statut : source annexe gelée, ou document vivant ?

16. **Les six coupes du §9** *(« ce qu'on coupe si le temps manque »)*, les fenêtres S2-S3 / S3 / S3-S4, les charges ⚙️/🎻. Le `07-` §2 les refuse explicitement et les renvoie au **plan de chantier** — **qui n'existe pas dans le corpus**. Périmer C3 §9 sans écrire ce plan les efface.

17. **`prompts-inventaire.md`** — effacé avec le dossier `competences-lecture/`, jamais réhébergé. Or C3 en fait dépendre un défaut vivant : *le prompt P1 réel porte encore l'ancien nom `marquage_hypothese` là où la spec dit `marquage_supposition`*. **Périmer C3 fait disparaître le seul endroit où cette dépendance est écrite.**

### E. Le cas particulier — ce qui mourrait de l'exécution du plan, pas de son abandon

18. **Le périmètre de conduite de la rentrée** : *« aux diagnostics de la semaine 1, on ne regarde qu'Argumentation et Expression, bien que les deux passations mesurent aussi Structure et Synthèse »* — décision de Louis du 11/08. **Elle n'est pas dans C3.** Elle ne vit que dans `AMENDEMENTS_C3_en_attente…md`, que le plan prévoit de clore et d'archiver avec la v5.4.

---

## PARTIE II — Les trente-neuf divergences

**C3 et une source disent deux choses différentes.** Dans presque tous les cas, **c'est la source qui a raison et C3 qui est en retard**. Voici celles qui ont une conséquence.

### Les six qui coûteraient cher à une session de code

| ce que C3 dit | ce que le corpus dit | conséquence |
|---|---|---|
| La chaîne de mesure est **en quatre temps, P1 → code → P2 → code**, pour toutes les compétences | `01-` §11 : *« ses quatre temps ne sont pas les mêmes partout »* — la **Synthèse a TROIS appels** *(relevé aveugle → aligneur → juge → code)*, « parce que l'alignement *est* sa mesure » | C3 décrit une chaîne qu'on ne peut pas implémenter pour la Synthèse |
| Le coût s'écrit **2N + 4** | `01-` §11 : *« et il sous-estime dès que la Synthèse entre dans N »*. Le `07-` §7 recompte : **quinze appels froids par élève** en semaine 1, pas douze | le chiffre de C3 est directement exploitable, et faux |
| Le corpus de calibration : **15 copies, deux lots de 10 + 5** | `03-` §9 : **seize** copies, **onze en calibration + cinq en holdout SCELLÉ** | ce n'est pas +1 : c'est un partage de nature différente, dont l'écart *est* la mesure du sur-apprentissage |
| Le gabarit du retour : **une** réussite, **un** point de travail, **80-140 mots** | `07-` §4 : **une ou deux par compétence ciblée**, plafond 2/3/5 selon le grain, **80-200 mots** | sur un exercice macro à trois compétences, C3 autorise 2 éléments, le corpus en autorise 5 — **les deux textes sont incompatibles, pas seulement divergents** |
| Le prompt de transcription **fait foi, conservé tel quel** | `07-` §2 et `06-` §4 : le **corps** se conserve, mais l'**énoncé d'usage** et la **règle d'anonymisation** se règlent **avant la première passation** | un C4-L4 lancé sur C3 embarquerait une règle d'anonymisation encore déclarée facultative — **sur des copies d'élèves** |
| La proportion composition / réception : **2/3 – 1/3, rotation glissante de trois cycles**, binaire, clé `famille` | `01-` §7 : **X = 40 % / Y = 15 %**, objectifs d'année, *« il n'y a pas de fenêtre glissante »*, trois groupes **qui se recouvrent** · `07-` §1 : *« Aucune table ne porte de colonne `famille` »* | quatre choses changent à la fois : le chiffre, la période, le nombre de valeurs, et l'existence du champ |

### Les cinq renversements de doctrine

| ce que C3 dit | ce que le corpus dit |
|---|---|
| **RR4** interdit d'exposer la liste de ce qui est mesuré ; le Monitoring en est *une exception* | `01-` §12 : *« la coupure passe entre le **barème** et **ce qui doit se trouver dans une copie** »* — nommer la dimension en langue élève est ce que le retour **doit** faire, et **trois endroits** le font. **Sous la règle de C3, la fiche dite à l'élève est illégale ; sous la règle vivante, elle est le troisième cas prévu.** |
| **Aletheia reste la voix** des séances de lecture guidée | `07-` §4 : *« Tous les retours sont de sa voix […] et les séances de lecture guidée également. La règle est générale, et elle n'a pas d'exception. »* Aletheia est un **atelier**, plus une voix |
| L'option **Pangram** est `[à valider]`, recommandée post-rentrée | `06-` §6 : *« Aucun détecteur externe n'est utilisé cette année »* — et la rouvrir coûterait *« une information complémentaire aux familles avant tout usage »* |
| La **confiance agrégée** s'affiche *« seulement quand le modèle de certitude existe »* | `06-` §5 et `07-` §2 : *« Aucune confiance agrégée ne s'affiche »*, à plat. **C3 est seule de son côté** |
| Le **seuil des contestations répétées** est une dette *« à chiffrer »* | `07-` §2 : *« il se règle ; il n'est pas arrêté […] un seuil posé d'avance deviendrait la cible que le dispositif apprend à viser […] son absence de valeur ne bloque pas l'écran »* — **ce n'est pas une dette payée, c'est une dette annulée** |

### Les trois valeurs chiffrées qui ont bougé

- **Le seuil « semaine faite »** : C3 laisse le choix ouvert *(2/3 ou 3/4)*, le `06-` §5 tranche **3/4**, *« la valeur est arrêtée »*. Deux pourcentages d'assiduité calculés sur des seuils différents ne sont pas comparables — et un semestre ne se recompte pas.
- **Les bornes de fin d'année** : C3 pose le **20 mai** *(fin d'année)* et le **10 mai** *(plus aucun exercice assigné)*. **Aucune des deux n'existe dans le corpus**, qui ne connaît que « début mai ». La règle du 10 mai a une conséquence opératoire réelle sur le routeur.
- **Le budget** : C3 écrit **« par classe »** au début de son §4 et **« propriété de l'élève »** 200 lignes plus bas — elle se contredit elle-même. Le corpus ne connaît que la seconde. *(Les valeurs de la table, elles, sont identiques des deux côtés : 45/60, 60/90, 90/120, +30.)*

### Et une contradiction interne à C3 qu'il faut connaître

Le **§2** de C3 dit que l'essai diagnostique porte **« les 6 compétences (5 en HLP) »** et l'explication **« les 5 »**. Son propre **§1** — et le `01-` §10 — disent **3** et **4**, *« identiques en TC et en HLP »*. La table du §2 n'a jamais été réalignée par A51. **La contradiction est à 230 lignes d'écart, dans le même document.**

---

## PARTIE III — Les renvois de C3 qui pointent dans le vide

Neuf renvois enverront un lecteur au mauvais endroit, ou nulle part.

| renvoi de C3 | ce qu'il y a au bout |
|---|---|
| `02-exercices.md` **§7** *(deux fois : le jalon du corpus, et le registre B)* | **le `02-` s'arrête au §6.** La section n'existe pas |
| `01-routeur.md` **§6** *(détection de stagnation)* | c'est **§8.2** |
| `01-routeur.md` **§7** *(« on suspend le verdict »)* | c'est **§4** |
| `01-routeur.md` **§5** *(règle F6, registre descriptif)* | c'est **§8.7** |
| `01-routeur.md` **§8** *(écart en paliers de l'ancre aveugle)* | c'est **`07-Implementation.md` §6** |
| `01-routeur.md` **§7** *(règles v1 des lettres)* | c'est **§9** |
| `01-routeur.md` **§11** *(registre des paramètres, A17)* | le §11 est devenu **« Télémétrie et journalisation »** |
| `NOTE-CYCLE-PEDAGOGIQUE.md` *(« fait foi »)* | **absorbé** par `06-` §2, fichier absent du corpus |
| `competences-lecture/prompts-inventaire.md` | **effacé** avec tout le dossier, jamais réhébergé |
| `04-competences-lecture.md` *(table des sources du §0)* | **effacé** ; le `04-` est aujourd'hui `04-Instances_Exercices.md` |

⚠️ Et le §0 de C3 annonce *« la réorganisation en **cinq** documents est faite »*. **Il y en a neuf.**

---

## PARTIE IV — Les quatre ouverts sans porteur

Le registre B de C3 compte 34 entrées : **18 sont fermées**, 12 sont transportées dans une source. **Quatre disparaîtraient avec C3.**

1. **B1-4 — « pousser où ça progresse ».** *Nuance importante* : la formule n'existe nulle part, mais **la règle est écrite deux fois** au `01-` §5 *(PA3 : « une compétence en progression est inscrite une seconde fois, en fin de liste — au plus une par cycle »)* et §8.8. À vérifier avec Louis : l'ouvert est-il fermé sous un autre nom, ou reste-t-il quelque chose ?
2. **B3-18 — la frise élève et la page de parcours.** Aucune source ne les décrit ni ne les déclare à faire ; le `01-` décline explicitement la conception d'écran. **Les compteurs sont livrés, les écrans qui les montrent n'ont ni lot ni ouvert.**
3. **B4 — le corpus de textes décomposés : phasage et comptes.** Renvoi mort au `02-` §7. **C5-L1 conçoit depuis un corpus dont personne ne dit combien de textes il compte ni quand ils arrivent.**
4. **B4 / A17 — le registre des paramètres.** Voir Partie I, point 14.

**Et un résidu à trancher** : le **multiplicateur X des multi-appels**, second volet de B2-8. Le régime de modèle est fermé *(le `07-` §6 : trajectoire au modèle économique, ancres au modèle fort, avec contre-épreuve en condition de recette)*. Mais la question *« X porte-t-il sur les trois diagnostics ou sur toute la cadence d'ancre ? »* n'est reformulée nulle part. **Dissoute plus que répondue** — à confirmer que c'est une décision et non une chute.

---

## PARTIE V — Le jalon du 22 août, à quatre jours

**La lettre est écrite. La date ne l'est pas.**

Le contenu de C3 §11 est intégralement domicilié au `06-Palimpseste.md` §7, **et augmenté** : les cinq points y sont tous, et le point 1 a gagné un régime d'effacement en sept puces que C3 ne portait pas — *« rien n'expire, tout s'efface à la main »*.

Ce qui a été perdu, **c'est la date, et rien d'autre**. Il n'y a plus **aucune** date de calendrier dans le corpus gelé : le `06-` §7 écrit *« une lettre présentant le traitement est due **avant la première passation de l'année** »*. C'est **plus sûr juridiquement** et **plus flou opérationnellement** : cela dit à quoi ne pas être en retard, pas quand écrire.

**Deux dépendances restent ouvertes à quatre jours :**

- **l'information aux parents** *« est à confirmer avec l'établissement »* — et son échéance a disparu avec la date ;
- **le propriétaire institutionnel** *« se règle avec la personne responsable de l'accès à l'information de l'établissement »* : c'est le seul des cinq points qui exige un tiers que Louis ne contrôle pas.

**Point positif :** la liste des sous-traitants est stabilisée à **un seul** — le fournisseur d'IA. La lettre est donc rédigeable aujourd'hui. C'est exactement ce que le refus de Pangram achète.

---

## PARTIE VI — Ce que ce relevé change pour la v6

Le relevé du 15/08 posait la v6 comme **une réécriture de C3 depuis les sources**, avec lui-même comme contrôle de non-perte. Ce rafraîchissement ne dit pas que ce plan est mauvais ; il dit que **son objet a changé de taille**.

**Trois faits nouveaux commandent la décision.**

**(1) Le travail de réécriture est largement fait, et il n'a pas été fait dans C3.** Le `06-` et le `07-` ne sont pas des documents voisins : ce sont, section pour section, les successeurs de §2, §3, §3bis, §4ter, §5, §6, §7, §9, §10 et §11. Ils sont gelés, ils portent leurs motifs, et **ils corrigent C3 en plusieurs endroits**.

**(2) Ce qui reste sans domicile tient en dix-huit points**, dont quatre sont des décisions de Louis, cinq des noms techniques, quatre des objets de schéma, et cinq des questions de statut ou d'ordonnancement.

**(3) Le danger n'est plus la perte, c'est la contradiction.** Trente-neuf divergences vivent aujourd'hui entre C3 et le corpus, dont six qu'une session de code exécuterait à l'aveugle. **C3 est actuellement le document le plus dangereux du chantier** — non parce qu'il est vide, mais parce qu'il fait foi *(règle R4)* en disant des choses fausses.

**La question à trancher n'est donc plus « comment réécrire C3 » mais « à quoi sert C3 v6 ».** Trois formes tiennent debout, et le choix appartient à Louis :

- **Une v6 mince** — C3 se réduit aux dix-huit points sans domicile plus une table de renvois vers les neuf sources, et cesse de recopier ce qu'elles portent. Le plus court, et c'est ce que la règle du domicile unique commande.
- **Une v6 réécrite** — comme prévu le 15/08, en intégrant les 29 amendements et en purgeant les 39 divergences. Le plus long, et il recrée un second domicile pour tout ce que le `06-` et le `07-` portent déjà.
- **Pas de v6 du tout** — les dix-huit points se versent chacun dans la source qui les concerne, les manifestes des lots C4 se réadressent sur les neuf sources, et C3 est archivée. Le plus radical, et il suppose d'écrire le **plan de chantier**, qui n'existe pas et sans lequel les six coupes et toutes les dates disparaissent.

**Un préalable commun aux trois** : le plan de chantier doit exister avant que C3 §9 soit périmé, sous peine d'effacer en silence les coupes, les fenêtres de semaine et le jalon du 22 août.

---

## Contrôle de non-perte de ce relevé lui-même

Ce document a été établi par huit passes indépendantes, chacune sur un bloc de C3, chacune tenue de citer une phrase exacte et son numéro de ligne pour tout verdict. **Trois choses n'ont pas pu être vérifiées, et elles sont dites ici plutôt que tues :**

1. **Le plan de chantier** n'était pas dans le corpus mis à disposition. Je ne peux donc pas vérifier qu'il porte le jalon du 22 août, les six coupes, ni le calendrier du dépouillement immédiat.
2. **Le multiplicateur X** de B2-8 : je constate sa disparition, je ne peux pas dire si Louis la tient pour une décision.
3. **La `fiche` du type** : je constate que ses sept intitulés ont zéro occurrence dans le corpus. Je ne peux pas dire si l'objet a été abandonné délibérément le 17/08, avec la séance qui a supprimé la fiche du type, ou s'il est tombé par entraînement.
