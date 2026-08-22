# RELEVÉ — C4·L3 : ce qui ne peut pas être construit sans arbitrage

**Séance du 18/08/2026.** Prompt de session : `PROMPT_Code_C4_L3.md`. **Aucun code écrit, aucune
migration, aucune ligne au `SUIVI_SQL.md`, aucune écriture en base.**

Ce document porte quatre choses : ce que le **contrôle d'entrée** a donné, ce que la **dépendance
C4-L5** change — le prompt la prévoit et dit de construire quand même —, **huit questions** que les
sources du manifeste ne tranchent pas, et **ce qui se construit dès qu'elles le sont**.

**Le trait commun aux huit questions** : ce lot **n'appelle jamais un modèle** et **ne crée aucune
table**. Il **lit** ce que la conception et la chaîne ont déposé, et il **affiche**. Or huit des
formes qu'il doit lire ne sont déclarées nulle part — et une forme de lecture inventée puis démentie
coûte exactement ce que les pièges du prompt cherchent à éviter.

**Méthode.** Le manifeste a été lu en entier : `07-Implementation.md` §1, §3, §4 ·
`06-Palimpseste.md` §1, §2, §3, §6 · `02-exercices.md` §5 · `competences/monitoring.md`. Plus les
citations que le prompt autorise, et elles seules : `02-` §2.2, §2.3.1, §2.3.4, §2.4 ·
`01-routeur.md` §1, §8.2, §8.5, §9, §11, §12 · `00-referentiel.md` §3 · `competences/structure.md` §8.
Le `01-` §3 n'a **pas** été ouvert — il n'est pas cité, et c'est ce qui rend Q4 indécidable ici plutôt
qu'ailleurs. `SPEC_C3_exercices_competences.md` n'a pas été ouverte. Le balayage a produit
**25 candidats**, chacun soumis à une contre-épreuve chargée de le **réfuter sur pièce** : **17
réfutés**, huit survivants. *Un candidat s'est effondré à la contre-épreuve après avoir semblé le plus
grave de tous — voir l'encadré du §2.2.*

---

## 1. Le contrôle d'entrée — passé

| Pièce | Attendu au prompt | Constaté | Verdict |
|---|---|---|---|
| `07-Implementation.md` §1, §3, §4 | VERSION 2.2 | **VERSION 2.2**, VALIDÉ ET GELÉ | ✅ |
| `06-Palimpseste.md` §1, §2, §3, §6 | VERSION 2.4, ≥ *déposé* | **VERSION 2.4**, VALIDÉ ET GELÉ | ✅ |
| `02-exercices.md` §5 | VERSION 5.1, ≥ *déposé* | **VERSION 5.1**, VALIDÉ ET GELÉ | ✅ |
| `competences/monitoring.md` | VERSION 2.1, ≥ *relu et validé* | **VERSION 2.1**, RELUE ET VALIDÉE — et rien de plus ne lui a été demandé, c'est son plafond déclaré | ✅ |
| Les tables du `07-` §1 en base | toutes | **les 20 tables de C4-L1 présentes**, RLS active sur les 20, **20 policies — une prof par table, aucune policy élève** ; les 6 préexistantes que le §1 convoque (`api_couts`, `integrite_signalements`, `profiles`, `classes`, `inscriptions`, `scriptorium_params`) présentes aussi | ✅ |
| Les trois interrupteurs | à OFF | `exercices_actif` = f · `routeur_actif` = f · `competences_affichage_actif` = f — **vérifiés par requête, pas supposés** | ✅ |

La clause granulaire a ici un objet précis, et il est satisfait : le manifeste compte **une** fiche,
celle du Monitoring ; elle est présente et au statut requis.

---

## 2. L'état réel, avant les questions

### 2.1 C4-L5 n'est pas jouée — et le prompt tranche ce cas

Vérifié : **aucun fichier du dépôt ne touche `exercices_squelettes`, `competences_mesures` ni
`exercices_retours`** ; les deux premières et `exercices_retours` sont à **0 ligne**. Le prompt le
prévoit — *« si elle n'est pas jouée, construis, mais dis-le : la recette ne pourra pas passer »*.

**C'est dit.** Le « fait quand » exige que *« le retour final cite un progrès réel »*, et le prompt
précise qu'un texte posé à la main n'en cite aucun. **Ce n'est donc pas ce qui arrête la séance.**

### 2.2 Ce que la base porte, et ce qu'elle ne porte pas

| Table | Lignes | Ce que le déroulé y cherche |
|---|---|---|
| `exercices_types` | **15** | les treize objets + les deux diagnostiques — ✅ posés par C4-L1 |
| `exercices_types.crans_admis` | **vide sur les 15** | le cran, donc le **geste**, donc le `regime_v1vf` |
| `exercices_types_crans` | **0** | `couverture_observables` — Q5 |
| `exercices_demonstrations` | **0** | la démonstration du temps 1 — Q7 |
| `exercices` | **0** | `consigne_instanciee`, le cran élu, l'**appui** — Q3 |
| `exercices_depots` | **0** | la ligne que le déroulé fait avancer |
| `competences_niveaux` | **0** | le `statut_recette` `evaluee`, et la **lettre** qui dose le rappel |
| `competences_mesures` | **0** | les observables faibles de l'élève — Q4 |
| *(la banque « se juger »)* | **table absente** | les questions par observable — Q1 |

> **Le candidat qui s'est effondré, et il valait la peine d'être vérifié.** La **correspondance
> observable → formulation** est un **second plancher mécanique** de `evaluee` *(la fiche du
> Monitoring §4 ; `07-` §5)* : absente, aucune compétence n'est déclarable évaluée, donc « se juger »
> n'est jamais servi et la confiance de remise jamais demandée — deux des trois gestes de la remise et
> toute la phase 3 seraient inertes par construction. Un premier sondage sur les titres `##` des
> sept fiches n'avait rien trouvé. **Le sondage était trop étroit** : la section est en `###`, et
> **les six fiches la portent, remplies** — `argumentation` 8 observables, `connaissance` 7,
> `expression` 8, `questionnement` 9, `structure` 8, `synthese` 11, soit **51 blocs**, chacun avec sa
> *dimension dite à l'élève*, sa *question « se juger »* et ses **réponses fermées** (*« une réponse
> libre ne se compare à rien »*). **Le contenu existe donc, et sa forme est entièrement déterminée par
> les fiches.** Ce qui manque n'est plus que son **domicile en base** — c'est Q1, et c'est une question
> d'ordonnancement, pas de conception.

---

## 3. Les huit questions

Numérotées par ordre de gravité. Chacune est décidable en une phrase ; aucune n'a été tranchée, et
aucune ne l'a été par moi.

### Q1 — La banque « se juger » n'a pas de domicile en base ⛔ bloquant

**Où.** Piège 15 : *« Les questions et les formulations vivent par observable, dans la section de
correspondance de chaque fiche de compétence, **uploadée vers Palimpseste** par la fabrique (la fiche,
§4 ; C4-L8) […] **Ce lot lit cette table** ; il n'invente aucune question. »* Code : la phase 3, plus
les **questions servies et leur version** à écrire dans `exercices_metacognition` *(`07-` §1.2)*.

**Le trou.** La table n'existe pas, et **le `07-` §1 ne la nomme pas** — il énumère les tables en cinq
blocs et n'en porte aucune. Le piège 6 donne deux conduites, et cette donnée ne tombe sous aucune :
elle n'est pas *« ce que le §1 nomme sans que la base le porte »* (le §1 ne la nomme pas), et elle
n'est pas *« une donnée que rien ne nomme »* (la fiche du Monitoring §4 la nomme, et elle est au
manifeste).

**À trancher.** (a) Ce lot crée-t-il la table en **migration additive**, structure seule et **aucune
question dedans**, le contenu restant à C4-L8 ? (b) Ou attend-elle C4-L8, qui la crée avec son écran
d'import ? *La forme, elle, ne fait pas question : les fiches la donnent — une ligne par (compétence ×
observable), portant la formulation en langue élève, la question, la liste fermée des réponses, plus
une version, celle que `exercices_metacognition.questions_version` doit citer.*

*La même table sert trois choses : les questions de la phase 3, la **traduction en langue élève** du
rappel du temps 1 (Q4), et le retour du temps 4 qui **nomme la dimension**. C'est le verrou principal.*

### Q2 — La forme du squelette, que la comparaison de « se juger » doit lire ⛔ bloquant

**Où.** Piège 16 : *« La comparaison est du CODE, jamais le modèle — observable par observable, au
squelette de la compétence cible »*, et la garde `indetermine` dont le **troisième cas** est *« l'élève
affirme un observable que le squelette ne porte pas du tout »*. C'est **l'un des deux calculs propres
du lot**.

**Le trou.** `exercices_squelettes.artefact_extraction` et `artefact_jugement` sont **JSONB sans forme
déclarée** : le `07-` §1.2 dit ce qu'ils portent — *« ce que l'étage a produit »* —, jamais comment.
La forme fait foi aux chaînes de `03-competences.md` §1, **hors manifeste de ce lot**, et sera écrite
par C4-L5, non jouée.

**À trancher.** Quel **contrat minimal** le déroulé tient-il pour acquis — par exemple *« pour chaque
observable de la grille : un verdict, et la mention explicite que le squelette porte ou ne porte pas
cet observable »* —, et **qui l'écrit** : ce lot, sous forme d'un contrat que C4-L5 devra honorer, ou
C4-L5, ce lot attendant ? *Sans le second membre de la comparaison, ni le verdict de calibration ni la
garde du faux négatif d'extraction ne sont codables — et c'est cette garde qui empêche un
« surconfiant » injuste.*

### Q3 — L'appui — `defaut`, `distracteurs`, `reponse_attendue`, `guide` — n'a aucun domicile ⛔ bloquant sur trois écrans

**Où.** `02-` §2.3.4, cité par le prompt, et pièges 10 et 22. Trois écrans en dépendent : le **`guide`**
servi **avant la v1** (*« le guide n'est pas le retour »*) ; la **correction du premier cas d'une
paire**, servie **avant le second** — c'est la `reponse_attendue`, et c'est elle qui rend l'écart des
deux crédences interprétable ; et la **crédence aux deux crans guidés**, où *« les distracteurs SONT
les candidats de la saisie »*.

**Le trou.** Aucune colonne ne les porte. Le `07-` §1.1 énumère ce que la conception élit — le `cran`,
les `modes`, les deux matériaux — et **l'appui n'y figure pas** ; il dit seulement que *« ce que le
cran commande par ailleurs — l'appui […] — est donné par la table des neuf crans »*, laquelle donne la
**valeur** (présent / `null`), jamais **le contenu**. Le seul candidat est
`exercices.consigne_instanciee`, dont le §1.1 dit qu'une consigne porte *« ce qui aide »* — mais sa
forme n'est déclarée nulle part, et le seul contrat en base est le CHECK des paires (`array`,
longueur 2).

**À trancher.** L'appui vit-il **dans `consigne_instanciee`** — et sous quelle forme —, ou en **champs
propres** ajoutés à `exercices` en migration additive ? *Les 10 à 15 distracteurs d'un cran guidé sont
la saisie même de la crédence : sans eux, la porte 2 n'a pas d'écran, et le `02-` §5 dit qu'alors elle
**démarre plus tard, sans repli dégradé**.*

### Q4 — Le rappel des observables faibles du temps 1 n'a pas de domicile ⛔ bloquant aux grains meso et macro

**Où.** Piège 9 : *« le rappel des deux ou trois observables les plus faibles de l'élève sur la
compétence cible — en langue élève, jamais par leur code —, **élus par le routeur sur la fenêtre
d'évidence** (`01-` §8.2), et dosé par le palier »*.

**Le trou.** Si c'est **le routeur** qui les élit, l'écran les **lit** — mais rien ne les porte :
`routeur_decisions` est énuméré champ par champ au `07-` §1.5 et **ne contient pas ce résultat**
(vérifié aussi en base : quinze colonnes, aucune). Si c'est **l'écran** qui les calcule, il lui faut
la **fenêtre d'évidence**, définie au `01-` §3 — que le prompt **n'autorise pas à lire** ; les sections
citées du `01-` sont §1, §8.2, §8.5, §9, §11 et §12.

**À trancher.** (a) Le routeur pose-t-il le rappel sur `routeur_decisions` — un champ neuf, qui serait
alors du périmètre de C4-L2 —, l'écran se contentant de l'afficher ? (b) Ou l'écran le calcule-t-il,
et le `01-` §3 entre-t-il au périmètre de lecture de ce lot ?

*Le reste du temps 1 est tranché* : le dosage par palier — servi à E, D, C, absent à B et A
*(`00-` §3)* —, la semaine 1 où l'écran ne montre que la consigne, et la traduction en langue élève,
qui vient des fiches dès que Q1 l'est.

### Q5 — `couverture_observables` : la vf d'escalade en dépend

**Où.** Piège 7 — la vf devient **requise** *« sur les exercices portant l'observable ciblé »* — et
piège 8 : *« l'escalade entre dans la dérivation […] un écran qui grave « cran → régime » en dur ne
servira jamais la vf d'escalade — le delta vaudra NULL, et NULL n'est pas 0 : N2 serait aveugle. »*

**Le trou.** Savoir si un exercice « porte » un observable se lit sur
`exercices_types_crans.couverture_observables` — **JSONB sans forme déclarée, et à 0 ligne**. Sa
définition vit au `02-` §2.3.2, **hors des citations que le prompt autorise**.

**À trancher.** Quelle forme le déroulé peut-il lire ? Et, à défaut, faut-il se replier sur la
**compétence** en escalade plutôt que sur l'**observable** ? *Ce repli élargirait la règle — il
servirait une vf là où la source n'en demande pas —, et je ne l'ai pas pris.*

### Q6 — La chasse aux fautes : quel relevé mécanique ?

**Où.** Piège 26 : *« un relevé MÉCANIQUE, calculé en code — « il reste N fautes probables », l'élève
corrige ce qu'il trouve ; hors lettre, hors calibration »*. Le prompt le compte parmi les **deux
calculs** du lot. Écran : l'encart langue du temps 4, **ancré ligne à ligne**, hors du retour de
compétence.

**Le trou.** Aucune source ne dit **ce qu'est une faute probable**, ni avec quoi la compter, et
*« en code »* exclut le modèle. Le dépôt n'a **aucun correcteur** et **aucune dépendance de
dictionnaire français** (`package.json` relu) ; le seul relevé de langue existant est un champ `ortho`
**écrit par l'IA** dans `utils/codex-analyse.ts` — l'inverse de ce qui est demandé.

**À trancher.** (a) Une dépendance de dictionnaire / correcteur français est-elle acceptée — laquelle,
et fonctionnant hors ligne ? (b) Ou un jeu d'heuristiques resserré — accords manqués, doubles espaces,
majuscules, ponctuation — assumant de sous-compter ? (c) Ou l'encart langue est-il **différé**, le
temps 4 se construisant sans lui ? *Le nombre est montré à l'élève : un compteur qui annonce trois
fautes là où il y en a douze abîme le geste qu'il prétend servir.*

### Q7 — Le retour, ses points ancrés, et ce sur quoi le bouton se pose

**Où.** Pièges 27 et 28 : *« Chaque point du retour porte un identifiant stable »* — *« sans lui, la
contestation devient un commentaire libre et le drapeau des contestations répétées n'a plus rien à
compter »* —, et *« sur chaque point ancré, un bouton « je ne suis pas d'accord » et un champ court »*.

**Le trou.** `exercices_retours` porte un **`texte`** (un bloc) et des **`points_ids`** (une liste), et
rien qui dise **comment le texte se découpe en points**. Le gabarit Calame du `07-` §4 est *« la couche
contrat que la chaîne exécute »*, pas un format de sortie : il impose une longueur et un nombre de
choses nommées, jamais une structure. **Côté écriture, la forme m'appartient**
(`exercices_metacognition.contestation_points`) ; **côté lecture, non.**

**À trancher.** Le retour rend-il un **texte segmenté** — une liste de points, chacun avec son
identifiant stable, son ancrage et son texte —, `points_ids` n'étant alors qu'un index, ou reste-t-il
un bloc que l'écran doit découper ?

### Q8 — La forme de `exercices_demonstrations.contenu`, et l'avertissement quand elle manque

**Où.** Piège 10 : *« l'écran les LIT, il n'en fabrique aucune […] absente, le temps 1 s'en passe et
**le professeur en est averti** — rien ne s'engendre à sa place »*.

**Le trou, en deux morceaux.** *(a)* La colonne existe et la table est à 0 ligne ; C4-L1 a écrit noir
sur blanc que *« son format vit à la fabrique (C4-L8) et au `06-` §2, hors manifeste de ce lot :
jsonb, sans validation de forme ici »*. Le `06-` §2 **est** à mon manifeste, mais il donne la **nature**
de la démonstration par grain — l'exemple, le modelage (*« un brouillon commenté qui montre la genèse,
ou deux plans annotés à comparer »*), la checklist —, **jamais la forme du dépôt** ; or les trois ne se
rendent pas de la même façon. *(b)* **Aucun canal d'avertissement pédagogique n'existe** : le seul
canal du dépôt est `integrite_signalements`, qui porte l'intégrité et que le `07-` §1.2 réserve au
drapeau d'intégrité (*« un lot le réutilise, il n'en crée pas un second »*).

**À trancher.** (a) Une forme par `forme` — et laquelle —, ou une forme unique que les trois
partagent ? (b) L'avertissement passe-t-il par un canal neuf, par la page du professeur (**C6-L1**,
non jouée), ou se réduit-il pour l'instant à une trace serveur ?

*Les trois autres drapeaux du lot — trois `pas_pu`, incohérence répétée de la restitution,
contestations répétées — ne posent pas la question : le prompt les range explicitement en aval
(pièges 20, 21, 28), « ici, la saisie et un stockage qui les rendent possibles ».*

---

## 4. Les dix-sept candidats réfutés — pour que la reprise ne les rouvre pas

| Candidat | Ce qui le tranche |
|---|---|
| La banque « se juger » n'existerait nulle part | **Faux** — les six fiches portent leur section de correspondance, 51 blocs remplis, réponses fermées. Seul le domicile en base manque → réduit à Q1 |
| Où vit l'écran | **Codex** — `06-` §1, tableau des canaux : *écriture formative, à la maison → Codex, écran* |
| La durée indicative | se **dérive** du geste et du grain, **borne haute** de la cellule, un entier jamais un intervalle — `02-` §2.4 ; `duree_exercice_min` à 0 ligne n'y change rien |
| La micro-question de dépassement | au **double** de la durée indicative ; `motif_depassement` ∈ {`pause`, `difficulte`}, **NULL** quand elle n'a pas été déclenchée ou pas répondue — `02-` §2.4 ; `07-` §1.1 |
| Les trois boutons de confiance | libellés **libres** à l'écran, valeur stockée = l'enum `elevee` / `moyenne` / `faible` ; `non_exprimee` n'est jamais un bouton — `06-` §3 ; la fiche §2 |
| Les conditions de travail | geste unique, trois valeurs nommées : `temps_mis`, `au_plus_vite`, `pas_pu` — `06-` §3 |
| Le geste, à partir du cran | table des neuf crans — `02-` §2.1 et §2.2, cités |
| Le `regime_v1vf` **nominal** | colonne de la table des neuf crans : par paires / pas de vf / plein — `02-` §2.2 et §2.3.1 *(seule la branche d'escalade reste ouverte → Q5)* |
| Le palier qui dose le rappel | E, D, C servis ; B et A non — `00-` §3, et le prompt le recopie |
| La forme de la crédence | jetons sur 100 aux **deux crans guidés**, pourcentage unique aux crans nommés, aveugles et fin ; **une par diagnostic, deux sur une paire** — `02-` §5 ; `02-` §2.3.1 a *(seuls les candidats manquent → Q3)* |
| Le journal du faisceau — collages, rythme de frappe, apparition par blocs, sessions | **nommé** par la mission (*« la journalisation de chaque tentative »*) et par le `06-` §6 → migration additive, *« la forme physique t'appartient »* |
| L'échéance de la vf | *« se règle, elle ne se grave pas en dur »* : un paramètre — défaut le même jour, sinon 3 à 4 jours, **jamais à cheval sur deux semaines de travail** — `06-` §2 ; `01-` §11 |
| L'`etape` du job de chaîne | `exercices_jobs.etape` est un `text` libre : aucune migration en jeu, C4-L5 s'y aligne |
| Le jugement algorithmique des deux crans guidés | appartient à **C4-L5** — les deux calculs de ce lot sont nommés, et ce n'est pas l'un d'eux |
| Les trois drapeaux professeur | *« la règle joue en aval ; ici, la saisie »* — pièges 20, 21, 28 ; le compte et l'écran sont **C6-L1** |
| La RLS élève | **0 policy élève** sur les 20 tables, vérifié par requête (20 policies, toutes prof) : lecture et écriture passent par des **routes serveur** qui filtrent sur l'élève — décision du 14/08, *la règle vit dans le code, à un seul endroit* |
| Quelles compétences portent la confiance | celles que l'exercice **mesure** (`exercices.modes_par_competence`) ∩ `statut_recette = 'evaluee'`, **une valeur par compétence, jamais un scalaire** — `07-` §1.1 ; la fiche §6 |

---

## 5. Ce qui se construit dès que les huit sont tranchées

Pour que l'arbitrage se fasse en sachant ce qu'il débloque, et dans l'ordre où le déroulé se monte :

1. **Le champ de rédaction** — paragraphes encouragés et **conservés de bout en bout, de la saisie à
   l'extraction** ; collage refusé sur les **trois vecteurs** ; correcteur du navigateur **laissé
   actif** ; chaque tentative journalisée, plus le rythme de frappe, l'apparition par blocs et le
   nombre de sessions. **Ne dépend d'aucune question.**
2. **Les horodatages de tout le déroulé** et **le fil du statut** `assigne` → … → `clos`, la ligne de
   dépôt existant dès l'assignation, la clôture au retour aux crans sans vf, `abandonne` à part.
   *Ne dépend que de Q5, pour la branche d'escalade.*
3. **Les trois gestes de la remise**, dans cet ordre, et **l'ordre absolu de la fin de v1** — les deux
   saisies du Monitoring au dépôt et **avant** le retour, la restitution à chaud **avant tout envoi à
   l'IA**, l'attente comme **état explicite, jamais un écran muet**. *Q1 pour la confiance.*
4. **La crédence**, quatrième geste, pendant l'exercice. *Q3 pour les deux crans guidés seulement.*
5. **Le temps 1** — consigne, démonstration, rappel. *Q4, Q8.*
6. **Le temps 3** et sa garde `indetermine` à trois cas. *Q1, Q2.*
7. **Les temps 4, 5 et 6** — verdict de calibration, encart langue, contestation ancrée, action de
   révision unique, retour final et validation « lu ». *Q2, Q6, Q7.*

Le tout **derrière `exercices_actif` à OFF**, **aucun champ `note` ni rien qui y ressemble**, **aucun
écran d'édition de retour côté maison**, et **aucun appel de modèle**.
