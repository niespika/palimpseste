# PROMPT — Passe de mise en cohérence : la SPEC C3 et les cinq sources

> **Rédigé le 2 août 2026** (session Cowork, sur cadrage de Louis — ses cinq décisions de cadrage
> sont rappelées ci-dessous). **À lancer dans une session Cowork neuve (poste Mètis, la session de
> conception)**, avec les DEUX dossiers connectés : `palimpseste-conception` (les sources) et
> `palimpseste` (le repo, où vivent la SPEC C3 et la liste d'amendements). Première vérification :
> les deux montages répondent (`ls mnt/` via `device_bash`). S'il en manque un, demander à Louis
> de l'ajouter (bouton « Ajouter un dossier ») avant toute autre chose.
>
> **Ce que c'est** : l'étape (1) de la séquence d'août arrêtée par Louis — le grand ménage qui
> rend les documents lisibles, cohérents chacun en soi et entre eux. **C'est la dernière étape
> avant la revue adversariale (étape 2 de la séquence).** Les étapes suivantes (construction de
> la semaine, matrice normative, gel final, réécriture de C4-L1 — le premier lot de code du
> moteur) ne sont PAS dans cette passe : elle prépare leur terrain, elle ne les absorbe pas.

## Le cadrage de Louis (2 août au soir) — six décisions, toutes actées

1. **La SPEC C3 d'abord.** La SPEC C3 (`SPEC_C3_exercices_competences.md`, repo — le contrat de
   construction des chantiers de code C4/C5/C6) est gelée en v4.3. La passe commence par lui
   appliquer les amendements en attente (chapitre 0) : elle passe en v4.4. Ensuite, et seulement
   ensuite, elle est modifiable pendant la passe — toujours par amendement daté.
2. **Le construct est stable : SIX compétences + le Monitoring.** La session dédiée
   « Questionnement ↔ Monitoring » (en cours au moment du cadrage, le 2 août au soir) a conclu que
   **le Questionnement survit comme compétence**. Ses décisions fines sont au journal du
   `CONTEXTE.md` — les lire, pas les deviner.
3. **Périmètre modifiable : six documents, et rien d'autre.**
   `SPEC_C3_exercices_competences.md` (repo) ; `00-referentiel.md`, `01-routeur.md`,
   `02-exercices.md`, `03-competences.md`, `04-competences-lecture.md` (conception).
   **Les fiches `competences/*.md` ne se touchent pas** — elles auront leur séance dédiée, et
   leurs blocs machine nourrissent le banc de calibration (échéance dure du 24/08).
4. **La liste de propagation est un livrable.** Tout écho d'un renommage ou d'une décision dans un
   fichier hors périmètre (fiches, NOTES, protocole, prompts…) s'y consigne — fichier, section,
   terme ou décision — au lieu d'être corrigé sur place. C'est l'entrée toute prête de la future
   séance sur les fiches.
5. **Les non-tranchés : trier, puis trancher les mûrs** en séance, un item à la fois (chapitre 5).
6. **La présomption de fraîcheur va à `02-exercices.md`.** C'est le document révisé en dernier
   (31/07 – 2/08) : il a été écrit en connaissance des révisions de `00-` et `01-` ET des
   dernières décisions de Louis. En cas d'écart entre documents, **la proposition par défaut
   aligne l'autre document sur `02-`** ; la présomption se renverse sur preuve (une entrée de
   journal postérieure à la section concernée de `02-`, un arbitrage explicite contraire). Elle
   règle le **sens des propositions**, jamais la décision — qui reste à Louis.

## Pourquoi cette passe

L'énorme travail de révision est fait, mais il s'est fait document par document, à des dates
différentes — et le construct a changé APRÈS la relecture des deux premiers :

- `00-referentiel.md` : relu en entier le 29/07 — **avant** la décision des six compétences.
  Son §1 s'intitule encore « dix compétences, deux familles ».
- `01-routeur.md` : relu et validé le 30/07 — avant aussi. Son §13 décrit une « aile lecture »
  qui n'existe plus sous cette forme.
- `02-exercices.md` : relu et validé le 2/08 — **le document le plus à jour, et la référence
  présumée en cas d'écart** (cadrage n° 6) : écrit en connaissance de ce qui précède et des
  dernières décisions de Louis. Porteur du construct actuel, avec le journal.
- `03-` et `04-` : jamais relus. `04-competences-lecture.md` est probablement obsolète depuis la
  disparition des compétences de lecture — son sort se statue en séance, avec Louis.
- La SPEC C3 : v4.3, plus une liste d'amendements en attente
  (`AMENDEMENTS_C3_en_attente_2026-07-31.md`, repo — la liste de référence unique ; 29 entrées au
  31/07, d'autres ont pu s'ajouter depuis, notamment de la session Questionnement ↔ Monitoring —
  relire la liste du jour, pas son souvenir).

Le but, dans les mots de Louis : « il ne faut pas que dans 6 mois on se dise "hein, mais on
parlait de quoi ici ?" ». Et que la revue adversariale qui suit ne perde pas son temps sur des
faux positifs de vocabulaire ou des contradictions de dates.

## Ta première action, avant toute autre chose

Dans cet ordre, avant de répondre quoi que ce soit d'autre :

1. `AGENTS.md` (conception) — les règles de travail avec Louis. La première est absolue.
2. La mémoire de projet (`project_memory_read`) — au moins `palimpseste-chantier`,
   `palimpseste-vocabulaire`, `exercices-contrat-interface`, `style-reponses-louis`,
   `outils-fichiers-device`, `feedback-trace-sessions`.
3. `CONTEXTE.md` (conception) — PAS en entier (330 Ko) : l'arborescence, les conventions, l'État
   du chantier, et le journal **depuis le 30/07 inclus**. Lire par tranches (`sed -n` via
   `device_bash`). **Garde-fou** : si l'entrée de journal de la session
   « Questionnement ↔ Monitoring » n'y est pas encore, s'arrêter et demander à Louis — cette
   passe a besoin de ses décisions.
4. `AMENDEMENTS_C3_en_attente_2026-07-31.md` (repo) — en entier, y compris ses trois sections
   annexes (les datés · ce qui n'appelle PAS d'amendement · les écarts entre les trois listes).
5. La SPEC C3 (repo) — l'en-tête, le « Tableau de bord du socle » (A : journal des amendements ;
   B : trous déclarés), et le §0 « Lexique et sources de vérité ». Le reste par sections, au
   moment d'y travailler (le fichier fait 113 Ko).
6. Les deux relevés d'arbitrage (repo) : `RELEVE_Arbitrage_C3_2026-07-29.md` et
   `RELEVE_Arbitrage_Referentiel_Routeur_2026-07-30.md` — au moins leurs sommaires. Les items
   F7, F18, F3 et F24 sont les plus consultés du second.
7. `RAPPORT_Validation_Bibliotheque_Unique_2026-08-02.md` (conception) — surtout sa §6, la liste
   de ce qui circule comme établi mais n'est pas vérifié.

Vérifie la date réelle : `TZ=America/Toronto date` via `device_bash` (jamais via le bash du
conteneur — il a déjà menti de plus de vingt-quatre heures).

Puis présente à Louis un état des lieux COURT (où en est la table de progression ci-dessous, LA
prochaine action) — et, si la session est neuve, propose-lui de la renommer dans la barre
latérale (« Mise en cohérence — chapitre N ») : tu ne peux pas le faire à sa place.

## La table de progression (à tenir à jour ici même, à chaque fin de séance)

| chapitre | objet | état |
|---|---|---|
| 0 | La SPEC C3 passe en v4.4 — application des amendements en attente | ✅ **TERMINÉ le 03/08/2026 — 30 entrées sur 30, amendements A20 à A51**, en quatre séances. Séance 1 (02/08) : entrées 1-4, **A20-A24**. Séance 2 (03/08) : entrées 5-16, **A25-A36**. Séance 3 (03/08) : entrées 18-27 et 30, **A37-A48**. Séance 4 (03/08) : le **groupe 17 + 28 + 29**, **A49-A51**. |
| 1 | Le vocabulaire — table des termes, arbitrages, renommages | ✅ **TERMINÉ le 03/08/2026 — les quatre familles, en une séance** (séance 5, 13 h 17 – 15 h 20). Livrable : **`palimpseste-conception/LEXIQUE.md`**, **23 distinctions**. **Trois amendements C3 posés — A52, A53, A54 ; la spec passe en v4.5.** Contrôle mécanique de sortie fait. |
| 2 | Cohérence interne, document par document (**00 → 01 → 02** — `03-` et `04-` **sortis du périmètre**, décision de Louis du 03/08) | ✅ **TERMINÉ le 03/08/2026 — en deux séances.** Séance 6 (15 h 40 – 17 h 40) : le **`00-referentiel.md` passé en entier** (sept items ; le §4 annoté), le **`01-routeur.md` §13 réécrit** plus six endroits, **C3 en v4.6 (A55-A57)**. Séance 7 (18 h 05 – 20 h 00) : les deux renvois du routeur vers le `00-` §5, l'en-tête du routeur, **les quatre titres en « composition + réception »**, **19 fragments de vocabulaire de familles**, et **`02-exercices.md` passé sur les quatre contrôles** — dette Questionnement ↔ Monitoring refermée, compte des grilles corrigé, « Note du 30 juillet » annotée. **C3 en v4.7 (A58-A60).** |
| 3 | Cohérence croisée (02 ↔ 01 d'abord ; 00 face aux deux ; sources ↔ C3 ; relevés ; rapport) | ✅ **TERMINÉ le 04/08/2026 — les CINQ points et les DEUX items durs, en huit séances. C3 passe en v5.0 (A72, A73).** *(historique ci-dessous)* — **EN COURS — le point 1 est CLOS ; le TROU DE L'ÉLECTION DES MODES, ouvert en séance 9, est REFERMÉ en séance 10 (04/08, 7 h 44 – 13 h 10) ; les points 2 à 5 restent.** **CE QUI A ÉTÉ ÉCRIT EN SÉANCE 10 — sept items, quatre amendements, C3 en v4.9.** *(1)* **Le cercle était écrit dans C3, en une ligne posée la veille** : A49 disait « les modes élus ne sont PAS repris ici : `competences_mesures.modes` en est déjà la trace », or une mesure n'existe qu'après le dépôt quand F24 et R5 ont besoin de la `famille` avant l'assignation. **Le mode devient une valeur élue à la conception, portée par `exercices`, par compétence mesurée (A62)** — retour à la Décision 1 du `02-` §4, « il n'est dérivable de rien ». *(2)* **Le matériau se dédouble (A63)** : `materiau_source` = ce qui **fonde la source de vérité de l'évaluation** · `materiau_cible` = ce que l'élève **modifie ou juge**, **`null` dès qu'il produit du neuf**. Domaines : `provenance` = `null`/`genere`/`production_eleve`/**`texte_auteur`** des deux côtés ; `support` = `null`/`phrase`/`paragraphe`/`extrait`/`texte`, la cible admettant **`mot`** en plus. *(3)* **Aucun mode ne se dérive du cran (A64)** — la phrase « `composer` est élu aux crans 2 à 6 » **était le trou lui-même** ; retirée de C3 et du `02-` §8. *(4)* **F24 et R5 comptent désormais sur la CIBLE PRIMAIRE (A65)**, journalisée par `routeur_decisions` — « en exercices » n'était plus calculable, un exercice pouvant porter deux familles. *(5)* **Trois règles de conception écrites au `02-` §4**, appliquées à la **file de validation de l'injecteur**, pas au routeur : réception impossible sans texte d'auteur · `composer` non déclarable pour Argumentation, Structure et Questionnement quand le texte d'auteur est en `materiau_source` *(**la Connaissance est laissée `[à valider]`**)* · le mode ne se dérive de rien. **Le routeur n'élit plus aucun mode : il choisit l'exercice dont le mode lui donne la famille dont il a besoin.** *(6)* **La table L1-L12 est effacée** *(décision de Louis)*, ses **sept couples (objet × support × mode × compétence) transférés au §8** en amorce des ~49 à remplir ; le bloc daté annoté. *(7)* **La colonne `Support` des treize objets ne se dédouble pas** — elle déclare l'étendue du matériau qui porte le `texte_auteur` ; l'instance porte les deux. Plus le renommage **`texte_source` → `texte_auteur`** (6 occurrences), le `LEXIQUE.md` (deux distinctions, un terme redéfini, deux termes neufs, un renvoi cassé rattrapé) et l'**item 13 de propagation**. **DEUX RÉPARATIONS DE FORME, TROUVÉES PAR LE CONTRÔLE** : le **tableau de bord des amendements de C3** était malformé depuis la séance 4 — 12 lignes sur 46 ne rendaient pas cinq colonnes — et le **journal du `CONTEXTE.md`** l'était aussi — 9 lignes sur 89. **Tous deux réparés, aucun mot perdu.** *Une session Code qui parse le tableau pour contrôler la version lisait n'importe quoi.* **UNE ERREUR DE MÈTIS À RETENIR** : le premier script d'échappement a **corrompu quatre lignes** en prenant des séparateurs de colonnes pour des barres de prose — vu au contrôle, restauré depuis `_to_delete/`, refait par fusion des cellules du milieu. **Ne jamais faire de regex sur les accolades pour réparer une table.** — **RESTENT LES POINTS 2 À 5** du chapitre, et les deux items durs : **Les deux items durs inscrits d'avance, toujours à faire** : le **contrôle des chiffres du routeur contre C3, en entier** *(le §8 et le registre du §11 portaient encore 4 620 / 7 700 × X après le réalignement en dix endroits de la séance 4 ; marqué `[À VÉRIFIER AU CHAPITRE 3]` dans le registre)*. **Un second item inscrit le 03/08** : ce qui **bloque encore C5** est à recompter — l'ouverture n° 5 de C3 a perdu sa moitié « R1-R6 lecture » *(**A57**)*, mais ce qu'elle bloque n'a pas été restatué ; **c'est une décision de Louis** — **SÉANCE 11 — chapitre 3, séance 4 (04/08, 13 h 17 – 15 h 07, CLOSE) : LE POINT 2 EST PRESQUE FINI, DEUX AMENDEMENTS (A66, A67), C3 EN v4.11.** **CE QUI RESTE DU POINT 2 : les ancres du `00-` §3 face aux diagnostics et mesures en classe du `01-` §8 — c'est par là qu'on reprend.** *(1)* **Deux résidus de la séance 10, trouvés au contrôle d'ouverture** : la ligne « Statut : » de C3 disait encore **v4.8** *(elle monte à chaque version — vérifié sur les sauvegardes ; oubliée une seule fois)*, et le **tableau des statuts de relecture du §0** s'arrêtait au 03/08 sur le `01-` et le `02-` — **le défaut même qu'A60 avait corrigé la veille**. Réparés **sans amendement** *(décision de Louis : c'est l'écriture d'A62-A65 qu'on termine)*. *(2)* **Le §12 du routeur s'appuyait sur deux raisons mortes**, et son avertissement ⚠️ affirmait qu'« elle garde ses raisons » : l'item 1 fonde la Restitution sur « l'hypothèse R1 lecture, §13 », que le §13 déclare **SANS OBJET depuis le 2 août** ; l'item 4 range le Mouvement en dernier pour tester **l'hypothèse de covariance du `00-` §7**, que ce §7 déclare **TOMBÉE**. *Cause : l'avertissement date du 03/08 au matin, le §7 est tombé le 03/08 au soir.* **Complément daté ajouté ; la liste n'est pas réordonnée** — cet arbitrage reste à la session « construction de la semaine + ciblage lecture ». *(3)* **« La seule compétence de lecture aux sous-dimensions actées » : le sens s'était retourné.** Le Questionnement est aujourd'hui **la seule des six** dont les sous-dimensions portent un `[à valider]`. **Décision de Louis : la décision tient, sa raison change** — le motif devient que **son protocole de banc est le seul à imposer déjà deux lots en réception (F3)**. *(4)* **A66 — le mot « cran » portait QUATRE sens vivants** : le barreau d'autonomie · une marche de l'échelle E→A *(**dix** endroits au routeur, dont la règle de montée « → +1 cran » et la règle d'ancre « ≥ 2 crans »)* · le palier d'escalade *(**quatre**)* · l'amplitude du Monitoring. **A49 n'avait réglé que les colonnes ; la prose était restée.** **Trois mots, trois choses** : `cran` = le barreau d'autonomie · **`palier`** = une marche de l'échelle E→A *(le mot du `00-` §2, employé dix-huit fois — le routeur s'aligne sur le référentiel)* · **`degre_escalade`** = N1/N2/N3. **« degré » est de Louis**, contre `cran d'escalade` proposé par Mètis — *un qualificatif s'abrège, un mot distinct ne s'abrège pas*. **La colonne suit** : `cran_escalade` → `degre_escalade`, un jour après A49, *parce qu'aucun lot n'a encore créé la table*. **A49 est annoté, non défait.** *(5)* **Deux résidus du contrôle de sortie** : l'amplitude du Monitoring passe à **graduations** ; « descendre le grain d'un **cran** » perd son compteur — *il nommait les deux axes de la matrice dans le même geste*. **Mot écarté : « rang »**, pris par un attribut **écarté** à la révision. *(6)* **Un bloc daté laissé tel quel, décision de Louis** — *un bloc daté a le droit de parler la langue de sa date*. *(7)* **v4.10, pas v5.0** : *« on passera en 5.0 une fois le chapitre 3 fini »*. **UNE ERREUR DE MÈTIS, DITE ET RÉPARÉE TOUT DE SUITE** : la première rédaction du motif (3) écrivait « les deux familles » deux fois dans la même clause, et sa raison de rechange était fausse — **les six** traversent les deux familles. **LE PONT COWORK EST TOMBÉ EN COURS DE SÉANCE, PUIS REVENU** ; aucune écriture pendant la coupure, vérifications refaites au retour. — **RESTENT AU POINT 2** : les compétences et les modes déclarés au `02-` face à ce que le `00-` définit *(item en attente : **le référentiel ne nomme jamais le mode `questionner`** — zéro occurrence contre douze au `02-`, et il ne donne la liste des cinq nulle part)* · les observables de `couverture_observables` face au référentiel · les ancres du `00-` §3 face au §8 du routeur. *(8)* **A67 — le mode `questionner` devient `interroger`, et c'est LE SEUIL qui a bougé.** Mètis proposait de **ne pas** renommer *(« Interrogation » déjà écarté le 29/07 ; toutes les occurrences vivantes de « interroger » au référentiel parlaient du **seuil** ; et le partage de racine entre mode et compétence est la grammaire du système)*. **Louis a renversé le problème** : ce n'est pas le mode qui change de mot, **c'est le seuil** — *« on se pose des questions, et quand on sait se poser des questions, **on se questionne sur ses questions** »*. La compétence, son seuil et ses observables restent dans la famille *question* ; *interroger* est libéré. **Note de conception de Louis, écrite au `00-` §1** : `interroger` traverse les six compétences, **et c'est le mode par lequel chacune est portée à un niveau méta-cognitif**. *(9)* **Le partage des 16 occurrences, montré avant d'écrire** : **cinq réalignées** *(les tables qui font foi — dont celle qui DÉFINIT les cinq modes)*, **onze laissées** dans le raisonnement daté du 2 août sous **une** annotation en tête du §4. *Décision de Louis : ne pas réaligner la ligne des sondes documentaires.* *(10)* **Le référentiel ne nommait les modes nulle part**, alors que son §1 énonce « si `composer` est parmi eux → composition ; **sinon**, réception ». **Les cinq sont nommés au §1** *(nommés, pas définis — domicile `02-` §4)*, et le §8 porte le renvoi. *(11)* **Deux prises du contrôle** : le lexique nommait **`competences_mesures.mode`** au singulier *(le champ est `modes` depuis A52, et depuis A62 le mode est élu sur `exercices`)* · et il portait une **seconde copie** du faux trou « l'avertissement *cran de diagnostic / mode `évaluer`* n'existe dans aucune source » — **il existe au `02-` §4 depuis le 2 août**, dans un bloc cité **imbriqué** que le relevé du chapitre 1 n'a pas atteint. *Les quatre items « Chapitre 2 » de la table de routage du lexique sont soldés.* *(12)* **Un contrôle sur douze noms morts ou écartés — neuf à zéro occurrence vive**, les trois autres légitimes *(la liste C3 des six attributs qui ne seront pas créés ; les `competences_secondaires[]` du `02-`, dont **une couverte par une annotation posée huit lignes plus haut** que le contrôle automatique n'avait pas vue)*. **Un seul mot vivant et faux** : le `02-` §1 point 6 fait déclarer une **`famille`** par le type, alors que depuis la Décision 4 elle qualifie la **mesure** et se **dérive** — clause ajoutée à l'annotation existante, qui couvrait déjà trois autres vieux mots. *(13)* **L'item « geste » du chapitre 5 est CLOS** — voir la ligne du chapitre 5 ci-dessous. **— IMPACT C3 : v4.11, A66 et A67.** — **SÉANCE 12 — chapitre 3, séance 5 (04/08, 15 h 09 – 16 h 05, CLOSE) : LE POINT 2 EST CLOS. TROIS AMENDEMENTS (A68, A69, A70), C3 EN v4.12.** **ON REPREND PAR LE POINT 3 : les sources ↔ C3.** L'axe traité était *les ancres du `00-` §3 face aux diagnostics et mesures en classe du `01-` §8*. *(1)* **A68 — la synthèse en classe n'est pas une ancre** *(décision de Louis)*. A54 la rangeait parmi les `sommatif` alors que le `01-` §8 l'annonçait « non sommative » et que le `00-` §6 pose la règle qui les sépare : **A54 se contredisait lui-même**, ce qu'il achetait étant qu'un formatif en classe ne fasse plus descendre une lettre. **`forme` = `formatif`** : ni descente, ni plafond ancre+2, ni cadence. **Elle reste, requalifiée** — mesure du profil, entrée de R3. **« micro-ancre » → « mesure récurrente en classe »** (3 occ.). **Les deux endroits les plus lourds ont été manqués par le relevé d'ouverture et rattrapés par le contrôle de sortie** : la **règle de descente du §7** et l'**architecture ancre/trajectoire du §1.6**. **La cadence d'ancre perd un de ses trois mécanismes** — conséquence **datée** : elle se compte par compétence `evaluee`, statut que ni Synthèse ni Connaissance n'aura à la rentrée. **Seconde branche inscrite à la dette du §2** : le dispositif peut rester ET ne plus tenir la cadence. *(2)* **A69 — la Synthèse est la TROISIÈME compétence sans lettre au sortir de la semaine 1.** L'explication la mesure en **`restituer`**, donc en **réception**, où F19/A39 met à NULL toutes les mesures tant que le pont E→A n'est pas validé ; Argumentation et Structure y échappent par l'essai (`composer`), **pas elle**. *Le `01-` §4 le disait déjà — « la Connaissance et la Synthèse restent `differee` » — mais les deux endroits qui font foi l'ignoraient.* **Porte : la recette de son banc (24/08).** *(3)* **A70 — le §0 de C3 employait « ancre » dans ses DEUX sens et n'en définissait qu'un** (la mesure d'A54 ; le descripteur de palier E→A quinze lignes plus bas) — **même défaut qu'A59**. **Aucun renommage** : 196 occurrences, ≈ 140 / ≈ 45, chaque sens dans son document → **`LEXIQUE.md` entrée 25**, et le §0 dit « **ancres comportementales** ». **Trois références périmées corrigées** : « ancres de réception à rédiger » · « **aile lecture §13** » *(terme proscrit)* · « annexe A + **aile L** » → `02-exercices.md` *(décision de Louis)*. *(4)* **DEUX RÉSIDUS RÉPARÉS SANS AMENDEMENT** : la ligne `00-` du **tableau des statuts de relecture du §0** s'arrêtait au 03/08 — **troisième occurrence en trois jours** · l'**entrée 24 du `LEXIQUE.md`** était **orpheline de sa table par une ligne vide**, deux heures après sa pose. *(5)* **UNE ERREUR DE MÈTIS À RETENIR** : le relevé cherchait avec une **fenêtre de 140 caractères EN AMONT** du mot — les lignes où il apparaît tôt ont été **silencieusement écartées**. *Couper la sortie d'un grep fabrique un faux positif ; une fenêtre trop large en amont fabrique un **faux négatif**. Ancrer les relevés au début de ligne.* *(6)* **LE PONT EST TOMBÉ DEUX FOIS**, dont une en pleine écriture — rien écrit pendant les coupures, disque relu au retour, écritures rejouées. *Rétabli par `Cmd+Q` de l'app.* **— IMPACT C3 : v4.12, A68, A69 et A70.** **— SÉANCE 13 — chapitre 3, séance 6 (04/08, 16 h 15 – 17 h 20, CLOSE) : LE POINT 3 EST CLOS. NEUF ITEMS, QUATORZE ÉCRITURES, UN AMENDEMENT (A71), C3 EN v4.13.** **ON REPREND PAR LE POINT 4 — les sources ↔ les deux relevés d'arbitrage, F1-F27 et G1-G5, un par un : c'est le plus gros morceau du chapitre, il demande une séance à lui.** *(1)* **L'ITEM DUR DES CHIFFRES EST SOLDÉ** : tous les nombres partagés routeur ↔ C3 ouverts un par un — 2 940 / 4 900 × X, les 980 appels, budgets, plancher, fenêtre, cadence, ancre+2, 2/3-1/3, ~28 cycles, 2N+4 — **tous alignés** ; les valeurs mortes ne subsistent que dans des parenthèses datées. Le marqueur `[À VÉRIFIER AU CHAPITRE 3]` du §11 est **levé**. *(2)* **Ce que la liste d'amendements renvoie au routeur est vérifié en entier** : les **dix paramètres** du §11 y sont, les **trois indicateurs** (F1, F13, G2) au §10 aussi. **Aucun manque.** *(3)* **Le critère de recette du routeur §2 était resté à l'état d'avant A25** — « ±1 ≥ 80 % » sans unité, alors qu'A25 a tranché que le 80 % porte **sur la cellule (copie × observable)**. *Le §11 écrit lui-même que ce paramètre n'est pas du routeur.* → **renvoi à C3 §1.7, pas seconde copie.** *(4)* **A66 N'AVAIT PAS ÉTÉ APPLIQUÉ À C3 LUI-MÊME** : la spec appelait encore `cran` une marche de l'échelle E→A à **cinq endroits** (§1.7 trois fois, §4 deux fois — dont l'**écart en paliers** de l'ancre aveugle, dont C3 nomme pourtant le routeur §8 comme domicile), et le **`LEXIQUE.md` entrée 9** contredisait son entrée 6. **Réparé sans amendement**, A66 annoté. Plus les **quatre** « nombre de crans » du Monitoring → **graduations** *(les sources l'écrivaient déjà)*, et les deux « ±1 niveau » du §1.7 → **±1 palier**. *(5)* **A71 — LE JALON D'AOÛT DU CORPUS CESSE D'ÊTRE CHIFFRÉ DANS C3.** Le §4 et le B4 demandaient « 20 textes avant la semaine 2 » *(29/07)* ; le **§7 du `02-`**, passé le 2 août, porte un phasage daté — **4-6 textes au 25 août, ~10 de plus à l'allumage, 60-80 en croisière** — et déclare périmée l'ancienne estimation. **C3 garde la règle, renvoie pour les comptes** *(même geste qu'A17)*. *(6)* **Deux renvois croisés faux** : le routeur envoyait deux fois vers « C3 §5 » pour `duree_exercice_min`, qui vit au **§3** — C3 le disait lui-même à A9. *(7)* **Deux marqueurs annonçaient un travail déjà fait** *(troisième occurrence du défaut)* — le « renvoi jumeau à écrire » du §1.7 était écrit au routeur §12 depuis le 30/07. *(8)* **Le §6 de C3 — la section qui fait foi pour le schéma — décrivait `competences_actives_par_classe` en « écriture / lecture »**, quand son propre §1 donne `composition` / `reception` (A51). *Une session Code y aurait lu l'énumération périmée.* Réaligné, plus trois autres emplois vivants ; la cadence 2-1 **reste** dans ses mots — règle morte, ton « non » de la séance 7. *(9)* **DÉCISION DE LOUIS — LA LANGUE DU MODÈLE N'EST PAS LA LANGUE DE L'ÉLÈVE.** « souhaites-tu davantage d'écriture ou de lecture ? » désigne bien la famille, et **ne se réécrit pas** : ce qui est adressé à l'élève garde le français ordinaire. **`LEXIQUE.md` entrée 26** — et le contrôle du chapitre 6 ne doit pas les compter comme des manques. **ITEM 15 DE PROPAGATION, LE SEUL POIDS LOURD** : `cran` nomme une marche de l'échelle de niveaux dans **~60 endroits de `copies-tests/`**, dont des **chaînes citées par le code** (`verifie-module.py`, la règle que le module doit citer mot pour mot) et des **clés de manifeste** (`biais_crans`). **Renommer invaliderait le module Structure et rendrait les runs passés illisibles.** Trois branches écrites, **décision de Louis, datée par le banc du 24/08**. **DEUX ERREURS DE MÈTIS** : un ancrage visé sur le mauvais fichier *(refusé — la vérification préalable a tout bloqué, rien écrit)* · et un **relevé sensible à la casse** qui a laissé passer un quatrième « **N**ombre de crans » en tête de phrase. *Un relevé se fait insensible à la casse : les débuts de phrase échappent sinon.* **Le tableau des statuts de relecture du §0 était encore en retard sur le `01-` — quatrième occurrence en quatre jours.** Complété. **— IMPACT C3 : v4.13, amendement A71.** **— SÉANCE 14 — chapitre 3, séance 7 (04/08, 17 h 38 – 18 h 05, CLOSE) : LE POINT 5 EST CLOS, ET LE RELEVÉ DU POINT 4 EST PRÉPARÉ. IMPACT C3 : NÉANT.** *(Séance courte, Louis au téléphone — aucune décision lourde prise volontairement.)* **POINT 5** — les réserves de la §6 du rapport de validation du 02/08 : **les deux formules de la note de service abrogée sont absentes des quatre sources**, ellipses comprises, et **les sept références non vérifiées sont à zéro**, cherchées par leur **contenu** autant que par le nom d'auteur. **Une seule prise** : le `00-` §2 citait « Kim (2026), 12 873 copies, Outfit MNSQ 0,475 » comme un fait, quand la §6 la classe « résultats inaccessibles » — **réserve attachée, piste gardée**. **POINT 4, PRÉPARÉ SANS DÉCISION** : les **trente-deux items F1-F27 et G1-G5 sont tous retombés dans le texte** *(les cinq jamais retouchés — F5, F15, F18, F23, F25 — rouverts un par un)*. **Trois trouvailles à reprendre** : *(a)* la table du relevé du 30/07 annonce « Section G (5 ⚖️) non traités » alors que ces cinq items **sont** G1 à G5, tranchés dans la même séance — **rien n'est en souffrance** ; *(b)* le **§1 du routeur dit que la règle d'espacement reste à écrire au §6**, alors qu'elle y est écrite depuis le 30/07 et que C3 a fermé son ouverture n°2 en la citant — **cinquième occurrence du défaut, NON TRANCHÉ, c'est par là qu'on peut reprendre** ; *(c)* le **« chemin critique d'août »** du relevé C3 porte « 20 textes avant la semaine 2 » *(périmé par A71)* et « 15 copies × 5 compétences de lecture » *(construct mort)*. **— SÉANCE 15 — chapitre 3, séance 8 (04/08, 18 h 10 – 20 h 05, CLOSE) : LE POINT 4 EST CLOS, L'ITEM DUR DE C5 AUSSI, ET LE CHAPITRE 3 EST TERMINÉ. DEUX AMENDEMENTS (A72, A73), C3 EN v5.0. ON REPREND AU CHAPITRE 4.** *(1)* **Contrôle d'ouverture** : la ligne `00-` du tableau des statuts de relecture s'arrêtait à A67 alors que deux séances du 04/08 avaient modifié le fichier — **cinquième occurrence en cinq jours**. *Leçon neuve : une séance « impact C3 : néant » doit quand même mettre ce tableau à jour si elle a touché une source.* *(2)* **POINT 4 (b) — la règle d'espacement.** Le §1 du routeur l'annonçait « à écrire au §6 » et renvoyait à l'ouverture n° 2 de C3 : elle est écrite au §6 **depuis le 30/07**, et C3 a **fermé** cette ouverture (A15) — la spec le dit elle-même ailleurs. **Remplacé par un renvoi, pas une seconde copie** *(geste de la séance 13)*. **ET LE CONTRÔLE DE SORTIE A TROUVÉ LA MÊME FAUTE DANS CE QUE MÈTIS VENAIT D'ÉCRIRE** : « à porter au §11 » alors que les deux paramètres y sont — **sixième occurrence**, à trois lignes de la règle. Réparé aux deux endroits. *Neuf marqueurs de cette famille subsistent dans les quatre documents, tous légitimes après ouverture ; **contrôle à porter au chapitre 6**.* *(3)* **POINT 4 (c) — le « chemin critique d'août » du relevé C3**, la liste de travail du mois : **quatre lignes mortes sur sept** — « 25 copies » *(les deux lots sont scellés à **11 + 5 = 16**, décision de Louis)*, « 15 copies × 5 compétences de lecture », « 20 textes avant la semaine 2 » (A71), et « la règle **nouvelle** d'espacement » *(septième occurrence)*. **Annoté, non réécrit** — fichier hors périmètre ouvert **sur décision de Louis** : *ce n'est pas un récit de décision, c'est une liste opératoire, et une liste fausse coûte du temps de terrain*. **Propagation 16.** *(4)* **POINT 4 (a)** — la ligne « Section G (5 ⚖️) non traités » **réalignée** : les cinq sont G1-G5, tranchés dans la même séance. *Table qui fait foi → on réaligne.* **Propagation 17.** *(5)* **LE RELEVÉ DU 29/07 PASSÉ À SON TOUR** : son **cadre de terrain est au §11 de C3 mot pour mot** ; ses « questions ouvertes » portaient deux mentions mortes, annotées ; ses 21 corrections mécaniques ont été **sondées à 7**, toutes présentes dans C3. *Deux de ses corrections parlent une langue morte (C1, C16) — récits datés, laissés.* *(6)* **LOUIS A DEMANDÉ SI LES 32 ITEMS ÉTAIENT VRAIMENT RETOMBÉS, ET IL AVAIT RAISON DE LE DEMANDER** *(la séance 7 avait duré 27 minutes)*. Contrôle refait : **31 codes sur 32 sont cités** ; le seul absent, **F26, était « écarté »** — rien à faire retomber. **Huit items rouverts au CONTENU** (F10, F13, F14, F16, F17, F18, F19, G2) : tous présents, quatre citant leur numéro d'arbitrage. *Dit à Louis : les 24 non rouverts reposent sur la séance 7 plus la trace du code.* *(7)* **A73 — ET LE CONTRÔLE A TROUVÉ MIEUX QUE CE QU'IL CHERCHAIT : LES DEUX RELEVÉS NUMÉROTENT PAREIL.** Deux `F5`, deux `F17`, deux `F25` dans le corpus. **Mètis proposait de dater les citations ; Louis a proposé une LETTRE dans le nom** — *« les erreurs vont forcément arriver »*, et **un qualificatif s'abrège quand un nom distinct ne s'abrège pas** *(sa règle d'A66)*. **Chiffré avant de trancher** : marquer le 30/07 = ≈ 450 modifications, marquer le 29/07 = ≈ 100 — **et le résultat est le même**. → **`GC1`-`GC26`** pour le relevé du 29/07 *(89 occurrences + note d'en-tête)*, **7 citations** dans les six documents, **46 dates** en ceinture-bretelles, **`LEXIQUE.md` entrée 27**, **propagation 18** *(422 occurrences laissées dans le journal, la liste d'amendements et les deux fusions — blocs datés)*. *Trois préfixes vérifiés libres avant de choisir ; A, C, D, G et R étaient tous pris.* *(8)* **A72 — L'ITEM DUR : L'OUVERTURE N° 5 NE BLOQUE PAS C5, ELLE BLOQUE C4-L2.** Le partage qui a convaincu Louis, en termes d'élève : **fabriquer** un exercice de lecture ne demande pas les proportions ; **décider lequel Marie reçoit lundi**, si. *Fabriquer = C5, distribuer = le routeur = C4.* **La pièce** : C4-L2 est le seul lot dont le manifeste cite `01-routeur.md`, et **aucun lot de C5 n'a de manifeste** — c'est ce qui a laissé l'étiquette en place. *Louis a dit « je vais devoir te faire confiance » : la réponse a été de lui rendre la pièce à vérifier, pas d'écrire.* *(9)* **LOUIS A PENSÉ TOUT HAUT SUR L'INDEXATION DES MODES, ET RIEN N'A ÉTÉ ÉCRIT** *(« ce n'est clairement pas le moment de trancher »)*. Trois faits lui ont été rendus : sa décision **existe déjà** au `02-` §8 du 02/08 — *en distribution, jamais en assignation*, M-b empêchant qu'une case se ferme, ce qui répond à son « le risque étant qu'il n'arrive jamais à A » ; le 2/3 est une proportion de **familles**, pas du mode `composer` ; et **`interroger` ne se range pas sur cette échelle** — il est servi **tôt, au cran 1**. **La session qu'il veut tenir a déjà son domicile : l'ouverture n° 5.** *(10)* **UNE ERREUR DE MÉTHODE DE MÈTIS, TROUVÉE PAR MÈTIS** : le premier relevé comptait **83** citations non datées, **par ligne** — or ces documents sont **coupés en lignes courtes**, et « arbitrage F6 du relevé du » finit à la ligne suivante avec sa date. *Une fenêtre de ±160 caractères donnait 115, l'unité « bloc » donne **50**. **Compter sur la bonne unité, pas sur la ligne.*** *(11)* **Le contrôle de forme des tables a été refait sur la BONNE invariante** : non plus « n barres attendues » mais « toutes les lignes d'une même table ont le même nombre de barres non échappées » — **67 tables sur huit fichiers, zéro irrégulière**. **— IMPACT C3 : v5.0, amendements A72 et A73.** **— PAS DE COMMIT** *(Louis le fera après 23 h)*. |
| 4 | L'appareil — justifications gardées, redites retirées | ✅ **TERMINÉ le 04/08/2026 — en une séance** *(séance 16, 20 h 00 – 23 h 00)*. **DEUX AMENDEMENTS (A74, A75), C3 EN v5.1. TROIS ANNEXES CRÉÉES.** **LA DÉCISION QUI A GOUVERNÉ LE CHAPITRE EST DE LOUIS** : *« il ne faut dans ces documents que les sources de vérité du chantier, et toutes les sources de vérité du chantier »* — **elle a deux tranchants**, et le second n'avait pas été vu : ce qui EST source de vérité et se trouve **coincé dans un bloc daté** doit **remonter dans le corps AVANT** que le bloc parte. *(1)* **LE RELEVÉ D'OUVERTURE A CHANGÉ LE CHAPITRE.** Les redites littérales n'existent plus — **10 phrases identiques entre deux documents, toutes légitimes** ; **3 paires de paragraphes proches**, légitimes aussi. En revanche l'appareil pesait **49 % des mots du `02-`**, 27 % du `00-` et du `01-`. *(2)* **LOT 1 — cinq notes qui annonçaient un travail déjà fait**, le défaut le plus fréquent de la passe : la dette du filet de lecture *(qui affirmait « rien ne remplace ce filet » à dix lignes de la proportion 2/3-1/3 qui le remplace)* · la dette de la couche 0 *(écrite au §4 depuis le 30/07)* · la dette de chiffrage *(dont le corps disait « tranché le 30/07 »)* · les deux exceptions de l'échelle et la réserve L9, **supprimées franchement sur décision de Louis — les types L8, 13 et L9 n'existent plus, et la trace existait déjà ailleurs**. *(3)* **A74 — LA PORTÉE DES MATÉRIAUX PAR CRAN ÉTAIT FAUSSE DANS C3, ET LOUIS L'A RATTRAPÉE EN DEMANDANT À TOUT VOIR.** Mètis proposait de traduire la table du 1er août ; Louis a demandé le dossier complet, **refusé la lecture de Mètis**, et donné la sienne : **le cran ne commande que la CIBLE** — présente aux crans 1-3, facultative au cran 4 *(l'appui est une cible **trouée**)*, `null` aux crans 5-7 ; **la présence du `materiau_source` dépend du MODE, pas du cran**. *Son argument : « dans une production sans appui ou en conditions d'examen, "explique ce texte de Descartes", le texte n'est pas l'objet de mon travail, c'est la source de vérité ».* **ET LA MÊME TRADUCTION MÉCANIQUE AVAIT DÉJÀ ÉTÉ FAITE, HUIT HEURES PLUS TÔT, DANS C3 §6** — la section que lit une session Code, celle sur laquelle C4-L1 aurait construit la table. **Vérifié sur les sauvegardes : écrite en séance 10 entre les items 1b et 7 — et la ligne A63 du tableau de bord n'en dit pas un mot.** *Louis a cherché la trace et ne l'a pas trouvée : elle n'existe pas. **Leçon : une ligne d'amendement doit couvrir tout ce que l'amendement a écrit.*** Plus la définition du `materiau_cible`, qui se contredisait — « modifie **ou juge** » contre « `null` dès qu'il produit du neuf », divergentes **au cran 7**. *(4)* **A75 — LE CRAN 6 EST RETIRÉ** *(constat de Louis : « tels qu'ils sont définis, les crans 5 et 6 n'ont aucune différence »)*. « Produit en conditions d'examen » n'est pas un degré d'autonomie mais un **contexte de passation**, déjà porté par l'instance depuis **A54** *(`lieu` = `classe` **et** `forme` = `sommatif`)* — **même argument qu'au 31/07 pour « en classe »**. **Le numéro n'est pas réattribué** : `diagnostic_fin` reste le **cran 7**, l'échelle compte **six crans numérotés de 1 à 7**. *Conséquence acceptée : la couche 3 sert `production_autonome` à B **et** à A ; ce qui distingue A côté production est le seul `diagnostic_fin`.* **Coût chiffré avant décision : 9 occurrences, 3 en blocs datés, rien dans `copies-tests/` ni dans les prompts C4.** *(5)* **TROIS SOURCES DE VÉRITÉ ÉTAIENT COINCÉES DANS LES BLOCS DU `02-` — remontées avant le déménagement** : **la table qui DÉFINIT les cinq modes** *(hors blocs datés, le document ne les nommait jamais ensemble — et cette table était **entretenue**, c'est là qu'`interroger` a été renommé le 4 août : un bloc daté qu'on tient à jour n'est plus un bloc daté)* · les règles **P-a / P-b / P-c** *(P-a et P-b actées, P-c provisoire ; elles n'existaient nulle part ailleurs)* · et la portée des matériaux, **réécrite** par A74 plutôt que remontée. *(6)* **`Annexe-exercice.md` — 10 100 mots.** Les deux récits déplacés **verbatim** ; le `02-` passe de **31 166 à 21 246 mots**. **Seize renvois « §4, Décision N » traités** avec une règle simple : le renvoi qui vise **la règle** garde `02-exercices.md` §4, celui qui vise **le raisonnement** pointe l'annexe ; **les sept qui sont dans des blocs datés restent tels quels**. *(7)* **`Annexe-routeur.md` — 778 mots, et c'est un bon résultat** : le routeur n'avait presque pas de récit, ses 49 blocs sont des règles et des « pourquoi ». **Mais la plus grosse redite de la passe y était** — le tampon « Section passée le 30 juillet 2026 (séance de révision Louis × Mètis) » **treize fois, dont dix mot pour mot**, alors que l'en-tête du même fichier dit déjà « quatorze passes, toutes journalisées ». Les dix sautent, les trois qui portaient une phrase la gardent. Plus **les deux comptes rendus de séance qui ouvraient le document** → annexe. Plus **la note du §4 qui redisait le §13 en le contredisant** *(« la plus faible des compétences dont la grille réceptive existe » contre « la plus faible des six, sur le signal de réception »)* → renvoi, **et la divergence est écrite**. **Sur demande de Louis, trois règles vivantes rédigées en note sont remontées dans le corps** : la proportion 2/3-1/3, la durée indicative contre le temps mesuré, ce que produit le diagnostic de lecture. *Et le « **Elle** revient le 30/07 » orphelin — la note qui répondait arrivait dix lignes avant la question — a reçu son antécédent.* *(8)* **`Annexe-referentiel.md` — 5 935 mots : le §4 « Les Constructs », un TIERS du `00-`.** *Décision de Louis, voie (c) : on déplace le récit **et** on écrit dix lignes vivantes à sa place* — le critère en deux exigences *(dissocier · être du bon ordre)* et les **cinq refus** *(les objections → un seuil · la mécanique → un plancher · le Monitoring → le second ordre · l'élucidation conceptuelle → un substrat · la Synthèse de lecture → coupée)*. **La numérotation 4.1 / 4.2 / 4.3 est conservée dans l'annexe** *(geste d'A73 : on change l'adresse, pas le numéro)* — **douze renvois réadressés, aucun cassé**. Le `00-` passe de 17 295 à **12 039 mots**. *(9)* **Le « À signaler au §9 du routeur » de P-b n'était jamais parti** — le §9 donnait « réviser en semaine 15 son introduction de la semaine 5 » sans dire que c'est un cran de **diagnostic**, à trois lignes du principe de continuité intentionnelle qui le veut. Écrit. *(10)* **DEUX ERREURS DE MÈTIS, TOUTES DEUX DANS SES PROPRES CONTRÔLES** : une assertion attendait 2 occurrences d'une phrase là où 3 sont légitimes, et un repère de position attrapait `#### 8.` en croyant lire `## 8.` — *les écritures étaient bonnes, les contrôles faux ; dits tout de suite.* Plus **une phrase vivante rattrapée au balayage des restes** : le `01-` §9 écrivait « **l'échelle des sept crans fait foi** » hors de tout bloc daté, dix minutes après A75. *Le compte brut annonçait « 2 dans le `01-` » et on aurait pu les croire toutes datées.* *(11)* **Contrôle de sortie : 75 tables sur onze fichiers, aucune irrégulière ; zéro renvoi orphelin.** **— IMPACT C3 : v5.1, amendements A74 et A75.** |
| 5 | Les non-tranchés — inventaire, tri, décisions mûres | à faire — **items déposés au 03/08** : *(a)* **ce que R0 écarte réellement à l'allumage** — la prémisse de l'item 6 du `01-` §13 est dissoute : il n'y a plus de « compétences de lecture » à écarter en bloc, et **la clé de recette n'est pas étendue à la famille** (§12), donc une compétence rendue `evaluee` en composition est ciblable en réception sans y avoir été éprouvée ; *(b)* l'inventaire des **19 marques de non-tranché de `02-exercices.md`**, relevées section par section ; *(c)* les trois trous du `00-` et les items des séances 1 à 4 déjà inscrits ; *(d)* **déposé le 03/08, séance 8 — la table de correspondance de la PAIRE pour N2** : sur un cran de diagnostic il n'y a pas de version finale, donc pas de `delta_v1_vf` ; N2 lit alors la paire (« correction, puis nouveau cas de la même famille de défauts »), **mais quel résultat de paire vaut quelle branche n'est pas tranché** *(marqué `[à valider]` au `01-routeur.md` §6)*. **Daté par C4-L2, le 25/08** : tant que ce n'est pas écrit, N2 n'est pas exécutable sur un cran de diagnostic ; *(e)* **déposé le 03/08, séance 8 — le mot « geste », jamais jugé au chapitre 1** *(objection de Louis : « type et geste n'existent plus »)*. L'axe `gestes[]` est bien mort — absorbé dans `crans[]` le 31/07 —, mais **le mot n'a aucune entrée à la table des termes** ; la ligne vient d'y être posée. **139 occurrences sur les quatre documents** ; **les 20 du `01-` ouvertes → zéro usage vivant** *(notes de renommage, descriptions datées, français ordinaire)*. ~~**Restent à ouvrir : les 69 du `02-` et les 34 de C3.**~~ **✅ ITEM CLOS le 04/08/2026, séance 11.** **Les 141 occurrences ont TOUTES été ouvertes** — y compris les **16 du `00-`, que l'item avait oubliées** *(20 + 69 + 34 = 123, et le relevé disait 139 : seize n'étaient assignées à personne)*, et **les 20 du `01-` rouvertes plutôt que crues sur parole**. **Zéro usage vivant de l'axe, partout.** **Et la vraie trouvaille est ailleurs : le mot « geste » N'EST PAS proscrit — seul `gestes[]`, l'axe avec ses crochets, l'est.** Trois termes techniques **vivants** le portent — **`geste_revision`** (champ des retours), **`{{GESTE_TENTE}}`** (emplacement du prompt de retour) et **« le geste sur les conditions »** (le champ `temps_mis`, présent dans C3, le `01-` ET le `00-`) — sans compter le français ordinaire. *Un contrôle du chapitre 6 qui grepe « geste » en attendant zéro rapporterait **141 faux positifs**. La précision est écrite à l'entrée `gestes[]` du `LEXIQUE.md`.* *À rapprocher de l'autre résidu du même ordre : le nom de la table **`exercices_types`** est un reste d'avant la refonte — ses lignes sont les treize **objets** ; c'est ce qui a fait trébucher Louis sur `depot_id`* — **DEUX ITEMS DÉPOSÉS LE 04/08, SÉANCE 12** : *(f)* **l'énumération des compétences sans lettre mêle deux causes** — C3 §6 annonce fixer le périmètre de la cause « pont E→A non validé », puis nomme des compétences pour une raison qui n'en est pas une (« aucune passation ne les mesure ») ; **cette troisième cause n'est nommée nulle part** *(relevé en posant A69)* · *(g)* **la liste du cold start omet le Questionnement** — le `01-` §4 déclare `differee` la Connaissance et la Synthèse, alors que C3 écrit lui-même que le Questionnement « n'aura pas le statut `evaluee` à la rentrée, sa fiche n'étant pas écrite » ; **il devrait y être**, et le point rejoint le régime du statut `differee`, déjà ouvert ici. |
| 6 | Sortie de passe — contrôles mécaniques, livrables, en-têtes | à faire |

**Séance 1 (2 août, 22 h 45 – 00 h 00) — ce qu'il faut savoir pour reprendre.**

- **Numérotation arrêtée** : les amendements de la passe se numérotent **dans l'ordre de la liste**,
  à partir d'**A20** (entrée 1 → A20, entrée 2 → A21, etc.). Pour les quatre amendements issus du
  chantier Structure, l'étiquette d'origine est rappelée en regard.
- **Version incrémentée dès le premier amendement**, et non en fin de chapitre : l'en-tête de C3 est
  en **v4.4** avec la mention « série A20-… en cours d'application ». *Motif : laisser v4.3 pendant
  l'application dirait à une session Code qu'elle travaille sur le socle gelé.*
- **Règle de conduite posée par Louis** : quand l'application d'une entrée découvre un **autre
  endroit du même défaut**, on le corrige dans la même passe et on l'inscrit au périmètre de ce
  qu'on tranche, au lieu d'en faire un item séparé. *A22 en est né.*
- **Deux items déjà envoyés au chapitre 5** : la généralisation aux six compétences de la couverture
  des deux familles au banc (A23) ; le partage des six compétences entre les deux passations de la
  semaine 1 (A22, rattaché à l'entrée 29).
- **Premier item de la liste de propagation** : `copies-tests/_commun/PROTOCOLE-CALIBRATION.md`
  (hors périmètre) — son statut est « proposé, à valider par Louis », et il contredit la liste
  d'amendements sur le nombre de tirages (5 contre 3).

**Séance 2 (3 août, 8 h 20 – 10 h 30) — douze entrées, A25 à A36.**

- **Trois arbitrages de Louis débloquent l'entrée 5** : le `PROTOCOLE-CALIBRATION.md` **fait foi**
  (donc **cinq tirages**, ce qui renverse la décision « reste à trois » du 31/07) · le seuil se
  compte **à la cellule** (copie × observable) · **le §1.7 garde 80 % en pourcentage brut**, la
  borne basse d'IC ≥ 85 % du protocole étant sa règle d'**arrêt de cycle**, pas la porte de recette.
- **Quatrième arbitrage, sur une divergence trouvée dans le code** : la bande de tolérance du
  harnais ne vaut **pas** ±1 — elle vaut l'incertitude déclarée au gold, donc l'accord **exact**
  quand le gold est certain. **Deux mesures, deux décisions** : le tri A/B/C/D garde la bande
  déclarée, la porte de recette garde le ±1.
- **Précédent de forme posé par Louis** : *« c'est vraiment nécessaire de mettre une note pour un
  truc qui n'a plus d'utilité ? »* — **une correction de fait ne laisse pas de récit dans le corps
  de la spec** ; le tableau de bord des amendements est son domicile.
- **Louis a réfuté une proposition sur pièces, et il avait raison** : la proportion 2/3-1/3 (entrée
  12) avait été rédigée en « écriture / lecture » d'après C3 §6, alors que `02-exercices.md` — le
  plus à jour — a acté `composition` / `reception`. *La vérification a trouvé plus que le nom : la
  table de propagation de `02-` annonce « F24 devient une proportion sur les modes », mais c'est un
  **relevé de la séance 3**, et la **séance 4 a écarté** la généralisation au mode. La proportion
  reste **binaire**.*
- **La passe a touché une source pour la première fois** : le `01-routeur.md`, sur demande de Louis
  (« réaligne tout de suite, pour éviter qu'on oublie un truc plus tard ») — quatre endroits, tous
  liés à A32. L'inventaire de ce qui reste y est ci-dessous.
- **Livrable ouvert** : `palimpseste-conception/PROPAGATION_Passe_Coherence.md`, **cinq items**
  *(domicile à confirmer par Louis)*.
- **Deux items envoyés au chapitre 5** : le régime du statut `differee`, qui n'est défini nulle part
  (A31) · le recalcul de la fréquence de ciblage en réception, qui dépend de l'entrée 29 (A32).

**Séance 3 (3 août, 10 h 37 – 12 h 00) — onze entrées, A37 à A48.**

- **Quatre décisions de Louis, toutes prises en séance** : le renommage **`marquage_hypothese` → `marquage_supposition`** (A38) · le **retrait de `cout_api`** de `exercices_squelettes` (A40) · **`historique_cibles` tranché DÉRIVÉ** (A42) · la **fermeture** de la question du champ de dispersion (A43).
- **Une correction de fait due à Louis, faite sur pièces** : il croyait le renommage `marquage_supposition` **déjà acté à `02-exercices.md`** ; il ne l'était nulle part — le mot n'apparaissait dans **aucun** fichier, et le `00-referentiel.md` §3 écrivait « le nom n'est PAS tranché ». *La décision qu'il avait en tête est la **Décision 8** du 02/08, sur `composer` / `composition` / `reception`.* **La décision est donc datée du 03/08, pas du 02.**
- **Louis a demandé « pourquoi j'ai besoin de ça au fait ? » sur l'entrée 23, et la réponse était « tu n'en as pas besoin ».** *La dispersion est une propriété de l'**instrument**, pas de la mesure : un tirage unique ne peut pas déclarer sa propre instabilité, et `instrument_version` porte déjà le lien vers l'accord mesuré au banc.* **Précédent de méthode : quand une entrée demande un champ, chiffrer d'abord ce que son absence coûte — ici une **décision de routage** fausse, pas une note fausse.**
- **Trois erreurs de la liste d'amendements trouvées en vérifiant** : l'entrée 21 annonçait un objet C3 qui n'existe pas · l'entrée 26 annonçait « §4, §6 » alors que C3 ne décrit pas le pipeline · **l'entrée 27 affirmait que « C3 §1.7 et §4 portent le seuil », ce qui est faux** — A19 l'avait déjà vérifié le 30/07.
- **Une erreur de Mètis, dite vite et réparée dans la passe suivante** : A37 avait corrigé le §6 et **manqué le §1 point 1**, qui écrivait encore que « le Monitoring se lit en amplitude plus une direction ». Rattrapé par A44.
- **Le trou le plus gros de la séance, trouvé en vérifiant l'entrée 21** : le `01-routeur.md` §2 nomme le « domaine partagé du profil » — trois tables de **C3 §6** —, et son §3 y déclare **trois champs stockés qui n'avaient aucune colonne** : `etat_escalade`, `historique_cibles`, `registre_retour`. **C4-L1 crée « toutes les tables du §6 » : il n'en aurait créé aucune.** Principe acté par Louis : **C3 §6 héberge l'état du routeur, le routeur reste le domicile des règles.**
- **Le `01-routeur.md` a été touché quatre fois de plus** (§3 deux fois, §5 deux fois) — tous des **réalignements**. **Et `02-exercices.md` a reçu son premier AJOUT de la passe** : l'exigence (6) au §7, signalée à Louis avant écriture.
- **Liste de propagation : trois items ajoutés** (6, 7, 8). **L'item 6 est le seul risque dur de la séance** : le **prompt P1 réel** (`competences-lecture/prompts-inventaire.md`) porte encore `marquage_hypothese` — *tant qu'il n'est pas repris, le champ extrait et le champ spécifié ne portent pas le même nom*. **Daté par le banc du 24/08**, pas par la rentrée.
- **Deux items envoyés au chapitre 5** : la **longueur de la fenêtre** du taux de lucidité, fixée nulle part (A37) · et, déjà là, la généralisation de la couverture des deux familles (A23).

**Séance 4 (3 août, 12 h 08 – …) — le groupe 17 + 28 + 29, TROIS AMENDEMENTS, et le chapitre 0 est clos.**

- **Le plan en trois phases a tenu tel quel** : décider sans écrire (ordre 29 → 17 → 28), écrire une fois, annoter. **Le relevé mécanique fait avant la phase A a rapporté deux fois** — il a corrigé le compte des attributs (**six** créés face à C3, non deux : le « bilan » de la liste comptait l'écart au gabarit de `02-exercices.md`) et il a fait trouver **cinq endroits périmés que la liste des six annotations ne portait pas**, dont deux à conséquence dure : `competences_mesures` (« dix en tout », c'est le seed de C4-L1) et le **manifeste du lot C5-L3** (« P1/P2 des cinq compétences »). **Louis a étendu le périmètre du groupe pour les inclure.**
- **Sept décisions de Louis** : le partage du diagnostic de la semaine 1 *(essai = Expression, Argumentation, Structure en `composer` ; explication = Expression en `composer`, Argumentation et Structure en `expliquer`, Synthèse en `restituer` ; ni Connaissance ni Questionnement)* · **six identifiants nus** sans préfixe de famille · `competences_actives_par_classe` : **« on renomme, et on dérive »** · le manifeste C5-L3 dit **« les compétences dont la grille réceptive existe »** · un objet partagé prend **une seule ligne** · `Support` devient **`support`** · et, sur la collision de noms, c'est **`competences_escalade.cran` qui est renommé `cran_escalade`**, `cran` seul gardant le sens premier.
- **Le trou le plus lourd, trouvé en vérifiant** : la table `exercices` — les instances conçues — **ne portait AUCUNE des quatre valeurs élues**. Sans le cran élu, ni le `regime_v1vf` de l'exercice, ni la durée à décompter, ni la `couverture_observables` applicable *(donc le candidat que N1 cherche)*, ni la règle de montée ne se calculent. **Trois colonnes ajoutées** : `cran`, `provenance_materiau`, `support`. *Même classe de défaut qu'A41.*
- **Une dérivation cherchée et refusée, et la raison vaut au-delà** : le trou d'`exercices` comblé, l'état de montée devenait calculable depuis le journal. **Il reste stocké** — c'est un **ÉTAT**, non une trace : recalculé, un changement d'`instrument_version` ferait redescendre un élève d'un cran sans décision. *C'est pourquoi A42 a pu dériver `historique_cibles`, qui n'était qu'une trace dupliquée, et pourquoi `competences_montee` ne se dérive pas.*
- **Deux recalculs mécaniques débloqués par le partage** : §10 point 2 passe de 1 540 à **980 appels** ; l'ouverture 8 passe de 4 620 / 7 700 × X à **2 940 / 4 900 × X**. *Le « onze » de ces chiffres était exactement le (6+5) du §1 point 4 — vérifié en refaisant le calcul.*
- **Louis avait raison sur ses deux réponses, vérifiées sur pièces** : la Connaissance est déjà « hors rayon » à **R4** (jamais cible primaire, signal continu = Quazian, qui n'écrit pas dans le profil) ; et le **segment 2** est bien le segment de calibration, R2 suspendue au profit de la couverture (`01-routeur.md` §4, §5, §11).
- **`01-routeur.md` réaligné dans la foulée, dix endroits** — §1 (les règles d'élection ; le compte), §2 (les trois puces TC/HLP), §4 (la note sur les couches 2-3), §5 et §11 (le **K de R5**, recompté à ≈ 6 des deux côtés), §7 (le format du diagnostic ; le pont E→A), §12 (annotation de l'ordre de lecture), plus l'**en-tête** (l. 17), qui annonçait encore des amendements C3 « non encore posés ». **Le §13 « L'aile lecture » part au chapitre 2, sur décision de Louis** : ce n'est plus un réalignement mais une réécriture de section.
- **Items envoyés au chapitre 5** : la cadence de ciblage en réception (le recalcul d'A32, sa dépendance à l'entrée 29 étant close) · le régime du statut `differee`, que la réserve du Questionnement au segment 2 rejoint · et, déjà là, la couverture des deux familles au banc (A23, §1.7).

**Séance 5 (3 août, 13 h 17 – 14 h 45) — chapitre 1, trois familles sur quatre, et le `LEXIQUE.md` existe.**

- **Domicile du lexique tranché** : un **`LEXIQUE.md` à la racine de `palimpseste-conception`**, hors des six
  documents. Le **§0 de C3 garde son lexique de contrat** ; les deux se citent — **C3 fait foi sur la forme
  technique, le `LEXIQUE.md` sur le sens pédagogique.**
- **LA RÈGLE DES BLOCS DATÉS, posée par Louis, gouverne tout le chapitre.** Ces documents mettent leur
  histoire **en ligne, dans des blocs datés**, pas dans un journal séparé. **Un terme proscrit qui y figure
  ne se réécrit pas** — le bloc reçoit **une ligne d'annotation en tête** (« partout ci-dessous, lire X là où
  il est écrit Y »), **une par bloc, pas une par occurrence**. *La forme n'était pas neuve : `02-` §1 la
  pratiquait déjà.* **Conséquence pour le chapitre 6 : la cible n'est plus « zéro » mais « zéro hors blocs
  datés et annotés ».**
- **La correction de Louis qui a changé le livrable** : *« ne pas simplement changer compétence pour mode ;
  le vocabulaire des compétences de lecture doit juste disparaître »*. La table de correspondance que Mètis
  proposait (Restitution → `restituer`…) aurait fait **retrouver quatre objets mesurables là où il n'y en a
  plus**. Vérifié sur pièces : les règles d'élection élisent une **compétence**, il y a **une lettre par
  compétence**, et la séance 4 a **écarté** le signal de ciblage au mode. → **les quatre noms sont proscrits
  SANS REMPLAÇANT**, seul cas de la table.
- **Seconde erreur de Mètis, réfutée en trois mots** : *« cran d'autonomie ? t'es sûr ? »*. Le terme était
  bon ; la formulation disait « le cran **déclaré par le type** », alors que le type déclare la **plage
  `crans[]`** et que **l'instance élit**. *Mètis allait réécrire le défaut qu'A49 avait réparé le matin même.*
- **LE COMPTE BRUT MENT, ET C'EST LA LEÇON DE MÉTHODE.** 14 occurrences relevées → 6 vivantes
  (`competences_secondaires`) · 43 → 1 (« Problématisation ») · 32 → 1 (« compétences de lecture ») ·
  **108 → 0** (les quatre ex-compétences). **Ouvrir chaque occurrence avant d'annoncer un coût** : le compte
  brut a surestimé le travail d'un facteur dix.
- **Trois corrections de fond trouvées derrière des mots** : le `01-` §6 annonçait comme acté un **rang de
  richesse de sonde** que `02-` avait écarté le 31/07 · le `01-` §1 disait le régime v1→vf « déclaré » quand
  son propre §9 dit « dérivé » · le `01-` §8 **et le registre du §11** portaient encore **4 620 / 7 700 × X**
  après le recalcul d'A51. **Les trois corrigées ; la troisième laisse un `[À VÉRIFIER AU CHAPITRE 3]`** dans
  le registre, à la demande de Louis.
- **Trouvaille** : il y a **TROIS « diagnostic »**, pas deux — le **cran**, les **types diagnostiques**, les
  **trois diagnostics en classe** —, et l'avertissement n'existait que dans **une cellule de tableau** du
  `01-` §9. Le relevé a rapporté **27 passages « à ne pas confondre » et 17 distinctions**, contre les cinq
  paires que ce prompt annonçait.
- **Deux trous inscrits plutôt que comblés au jugé** : les **deux « grain »** *(dette déclarée par la
  Décision 8, dont aucune phrase du corpus ne dit les deux sens — chapitre 5)* · l'avertissement **cran de
  diagnostic / mode `évaluer`** *(aucune source ne le porte — chapitre 2)*.
- **Cinq blocs annotés**, dont le `00-` §4 « Les Constructs » : *les faits qu'il rapporte sont ceux-là mêmes
  qui ont fondé la Décision 2 — c'est le statut des quatre noms qui a changé, pas les faits.*
- **Impact C3 : néant** — la SPEC C3 n'a pas été modifiée ; les décisions appliquées y étaient déjà
  (A38, A41, A49, A51).


**Séance 5, suite et fin (3 août, 14 h 45 – 15 h 20) — la famille 4, et TROIS AMENDEMENTS C3.**

- **La famille 4 s'est ouverte sur un item que C3 nous adressait**, et que la séance n'avait pas vu :
  le journal de C3 du matin même écrivait « *la collision se règle au chapitre 1 de la passe* ». Trouvé
  **en cherchant les deux « grain »**. → **A52** : le mot « mode » portait **trois sens vivants**, dont
  **deux colonnes du même schéma**. `exercices.mode` → `contexte_passation`, `competences_mesures.mode`
  → **`modes`**. *Même geste qu'A49 sur `cran`, écrit **trois lignes plus bas**.*
- **A53, décision de Louis** : `contexte` devient **`lieu`** et passe de quatre valeurs à **deux**,
  `maison` | `classe`. *« Toutes mes évals en classe sont des diagnostiques, et l'essai de Fragments est
  une éval en classe. »* **Il n'y avait jamais eu quatre valeurs : deux, écrites quatre fois.**
- **A54, idée lancée par Louis** — *« on pourrait imaginer que je décide de faire des formatifs en classe
  et des diagnostiques à la maison »*. **Deux axes** : `exercices.lieu` (`maison`|`classe`) et
  `competences_mesures.forme` (`formatif`|`sommatif`). **Le cœur n'est pas le champ, c'est la définition** :
  *une **ancre** est une mesure dont le `lieu` vaut `classe` **ET** la `forme` vaut `sommatif`.* Le mot
  « ancre » étant lu par **cinq** règles, ne faire lire `forme` qu'à la descente lui aurait fait dire deux
  choses. Son miroir : « montée par le **maison** » devient « montée par la **trajectoire** ».
  **Ce que ça achète, en termes d'élève** : un **formatif en classe ne fait plus descendre une lettre**.
- **La question de Louis avant d'écrire — « est-ce que ça casse quelque chose ? » — a rapporté trois
  faits** : le lieu **ne peut pas** quitter la mesure (`depot_id` est nullable) · ce qui fait une ancre est
  la **surveillance**, pas la note *(la spec l'écrit quatre fois)*, donc **un diagnostique à la maison n'en
  serait pas une** · le pipeline manuscrit + OCR s'indexe sur le **lieu seul**, il survit intact.
- **L'audit d'usage proprement dit est un NON-ÉVÉNEMENT, et c'est un résultat** : `type`, `objet`,
  `instance`, `exercice` sont **propres** sur 1 118 occurrences. **`cycle`** est le mot le plus chargé —
  165 occurrences, **trois sens vivants**. **Un travail fait traînait comme à faire** : le renommage
  `duree_cycle_min` → `duree_exercice_min`, accompli le 30/07 par A9, était encore écrit « à renommer ».
- **Deux fois dans la séance, le contrôle APRÈS écriture a rattrapé des endroits que la liste d'édition
  avait manqués** — quatre dans le `01-` pour A53, un pour le contrôle final. ***Greper le fichier entier,
  pas seulement les endroits annoncés*** : c'est la leçon du matin, elle s'est reproduite deux fois.
- **Une erreur de conduite de Mètis, relevée par Louis** : la séance a été déclarée close **sans qu'il
  l'ait demandé**. Les traces de clôture ont été reprises à la vraie fin. *La fin de séance appartient à
  Louis, comme le reste.*


**Séance 6 (3 août, 15 h 40 – 17 h 40) — chapitre 2 : le `00-` en entier, le `01-` §13, et C3 en v4.6.**

- **DÉCISION DE PÉRIMÈTRE DE LOUIS** : *« pour avancer sur C4, il me faut juste une cohérence entre C3, 00,
  01 et 02 »*. **Le chapitre 2 se limite à ces quatre documents.** `03-` et `04-` vont à un **chantier
  compétences** dédié — celui qui produira les fiches dont les bancs ont besoin.
- **Le sort de `04-` est tranché** : **voué à disparaître**, mais **après** transfert de ses observables au
  `03-`. Jusque-là il reste la source de ses observables. Et **`03-competences-ecriture.md` devient
  `03-competences.md`** *(16 occurrences comptées, 10 réécrites)*. **A56.**
- **La décision qui a gouverné le `00-`** : la **colonne « Famille » du §1 est supprimée** — depuis la
  Décision 4, `famille` est une propriété de la **mesure**, dérivée des modes, pas de la compétence.
- **RÈGLE POSÉE PAR LOUIS, valable pour toute la passe** : on renomme « écriture »/« lecture » en
  `composition`/`reception` **quand le mot désigne une famille** ; on ne touche à rien quand il désigne
  l'acte ordinaire ou un objet nommé (« les ancres d'écriture », les titres de fichiers).
- **LA LEÇON, TROISIÈME OCCURRENCE : greper les ELLIPSES du défaut, pas seulement son nom.** Le relevé
  annoncé à quinze endroits en valait **vingt-trois** (« dix compétences », « onzième », « les 10 »,
  « famille » n'étaient pas dans le motif) — d'où un **second tableau** non vu. Puis le routeur a livré
  **« cinq de lecture »**, forme elliptique qu'aucun grep de la journée ne couvrait, **trois fois vivantes**.
  *À porter au contrôle du chapitre 6 : compter les **comptes**, pas seulement les noms.*
- **Trois trous déclarés au `00-`, envoyés au chapitre 5** : l'attribution de la calibration à deux axes de
  juin (§3) · les **ancres non neutres** — Argumentation, Structure et Synthèse sont rédigées pour un élève
  qui produit son propre texte, seul le Questionnement a été mis en termes neutres (§5) · le quatrième terme
  du composite `Découvertes` (§6).
- **Le §5 et le §7 du `00-` changent d'objet sans disparaître** : « Le chantier des ancres de lecture » →
  **« Le pont E→A des mesures de réception »** ; « L'hypothèse de covariance des duals » →
  **« Les deux hypothèses différées à juin 2027 »**.
- **Deux faussetés trouvées par le contrôle des renvois, pas par le balayage du construct** : l'en-tête du
  `00-` disait `02-exercices.md` « en relecture » *(faux depuis le 02/08)*, et **C3 le disait aussi, à
  l'endroit qui fait foi** — **A55**. *Vérifié avant d'amender : aucun manifeste de lot ne cite `02-`, rien
  n'était arrêté.*
- **Deux fois les garde-fous d'écriture ont refusé d'écrire, et les deux fois ils avaient raison** : une
  phrase crue unique existait deux fois, un numéro de ligne de C3 avait été décalé par nos propres
  insertions. **La règle « ne rien écrire si un seul ancrage échoue » a payé deux fois en trente minutes.**
- **Un renvoi cassé par notre propre écriture** : le routeur §8 renvoyait aux « blocs d'ancres vides » du
  `00-` §3, retirés une heure plus tôt. *Le contrôle d'impact vaut aussi entre les sources, pas seulement
  vers C3.*

**Séance 7 (3 août, 18 h 05 – 20 h 00) — le chapitre 2 est CLOS, et C3 passe en v4.7.**

- **LE « NON » DE LOUIS EST LA TROUVAILLE DE LA SÉANCE, ET IL DEVIENT UNE RÈGLE.** Sur le point de
  rebaptiser « le calendrier ne dit plus si la semaine appartient à l'**écriture** ou à la **lecture** »,
  il arrête : *« cette idée n'a plus lieu d'être, ça renvoie une ancienne règle. À vérifier si on a
  d'autres cas similaires. »* **Réécrire aurait fait rentrer l'idée morte par la porte du vocabulaire
  neuf.** *La vérification a rapporté trois cas, dont **un de notre propre fait** — le §13, réécrit le
  matin même, disait que la cadence 2-1 « garantissait **à la réception** une semaine sur trois ».*
  **Son miroir se corrige, lui** : une règle **vivante** citée dans l'ancien vocabulaire se réaligne.
  **Écrit au `LEXIQUE.md`.**
- **« Modifie aussi les titres, c'est un oubli » — et le grep en a trouvé trois, pas deux**, plus un
  renvoi au `00-` §8, plus **le titre de la SPEC C3**, sorti au contrôle d'impact. *Cause du trou : le
  `LEXIQUE.md` ne proscrivait que trois formules ; **la paire « écriture » / « lecture » comme NOMS de
  familles n'y était pas**. La ligne manquante est posée.*
- **Le relevé des familles : 57 phrases apparient les deux mots, 19 fragments réécrits, 44 laissées** —
  toutes ouvertes une à une. Ne bougent pas : les citations de la rédaction antérieure, la genèse du
  `00-` §4, les noms de modules et de bibliothèques, et les descriptions de règles mortes.
- **Un faux renommage démasqué en écrivant** : « une **cible d'écriture** » (§5 l. 320) contredit la
  l. 322 réalignée le matin — « ces règles ne sont pas propres à une famille ». **La famille est
  supprimée, pas traduite.**
- **`02-exercices.md` déclarait ouverte une dette refermée le jour même** : la « dette Questionnement ↔
  Monitoring », en trou déclaré à l'en-tête et « NON tranchée » au §4, alors que la session dédiée du
  **2 août** a conclu que **la compétence survit**. *Le journal dit pourquoi : cette session **n'a
  modifié qu'un seul fichier, le `00-`**.*
- **Le Monitoring n'entre pas dans le compte des grilles, et Louis avait raison de le penser.** Vérifié
  à trois endroits. **Compté sur disque plutôt que raisonné : quatre grilles existent** (Synthèse est
  arrivée depuis), **il en reste deux**. Le §1 annonçait « les sept autres ».
- **La « Note du 30 juillet » se disait antérieure à une révision qui a eu lieu.** Annotée en tête — ce
  qui couvre du même coup les deux faits périmés de son corps.
- **Contrôles mécaniques de `02-` : propres.** 13 renvois externes et 9 internes valides ; `Support`
  majuscule, `marquage_hypothese`, `contexte`, `competences_escalade.cran` à **zéro**.
  *Une fausse alerte évitée : un renvoi cru cassé existait bien — le premier grep le coupait à 190
  caractères.* **Couper la sortie d'un grep, c'est fabriquer un faux positif.**
- **Deux erreurs de Mètis, dites et réparées tout de suite** ; et **un `assert` d'ancrage a refusé
  d'écrire** — les astérisques de gras n'entouraient pas ce qui était supposé. **Rien n'a été écrit tant
  que l'ancrage n'a pas tenu.**
- **Le pont Cowork est tombé en cours de séance.** L'appel n'a jamais atteint la machine. **L'état du
  disque a été relu avant de réécrire**, et il confirmait ce qui avait été annoncé.
- **Impact C3 : v4.7 — A58, A59, A60.** **A59 est le plus lourd** : le §0 déclarait **« Mouvement »**
  comme compétence de lecture et l'hypothèse de covariance des duals comme testable — **et la spec se
  contredisait elle-même**, écrivant plus bas « Mouvement est la Structure en mode `expliquer` ». *Une
  session Code lisant le §0, l'endroit qui fait foi, aurait créé une compétence inexistante.*


**Séance 9 (3-4 août, 22 h 29 – 00 h 11) — le trou de l'élection des modes, et AUCUNE écriture dans les sources.**

- **Séance de conception pure.** Rien n'a été écrit dans les cinq sources ni dans C3 : la séance a produit
  un **diagnostic** et une **chaîne de dérivation arrêtée**, dont la dernière case appartient à Louis.
  **Impact C3 : néant**, contrôlé sur le fichier (v4.8, A61).
- **LE COMPTE BRUT MENT AUSSI DANS L'AUTRE SENS.** Le relevé de la séance 8 annonçait « `modes` : zéro
  occurrence au routeur ». Il y en a **cinq** — mais toutes disent la même chose et aucune n'est une règle.
  *Un zéro annoncé se vérifie comme un grand nombre.*
- **MÈTIS A FAIT TÉMOIGNER UN MORT, SECONDE FOIS EN DEUX JOURS.** Pour objecter à Louis, la séance a cité le
  `00-` **§4.3** — le **récit de genèse du 26 juin**, annoté la veille — dont l'argument portait sur « la Synthèse
  doit-elle être l'une des **cinq compétences de lecture** ». Ces cinq n'existent plus, et la famille est
  désormais une propriété de la **mesure**. **La question posée sur cette base a été retirée.**
  *Contrôle à faire avant de citer : la pièce est-elle vivante, et son objet existe-t-il encore ?*
- **DEUX PROPOSITIONS DE MÈTIS RÉFUTÉES PAR LOUIS, LES DEUX FOIS À RAISON** : la colonne manquante « existe
  déjà sous le nom `support` » *(faux — `support` est **ambigu**, source pour le document, cible pour Louis)* ·
  « le prompt d'évaluation sait de quoi l'IA a besoin » *(faux — « le prompt va toujours inclure les deux
  emplacements » ; **l'opérande doit être connu du routeur AVANT que le prompt tourne »**)*.
  *La seconde réfutation a **évité** d'ouvrir les quatre grilles d'observables.*
- **LOUIS S'EST CORRIGÉ LUI-MÊME sur une faute d'inattention** — « seul le materiau_**cible** compte » inversait
  son propre argument. **Acté : seul le `materiau_source` détermine le mode.** *La signaler a coûté trois lignes ;
  l'écrire de travers dans le routeur aurait coûté un lot de code.*
- **La chaîne, la question restante et les items notés sont au chapitre 3 de la table ci-dessus** — c'est par
  la question qu'on reprend, pas par un état des lieux.


### Inventaire ouvert — le `01-routeur.md` porte encore le construct périmé (relevé le 03/08)

*Déposé ici sur demande de Louis — « réaligne tout de suite, pour éviter qu'on oublie un truc plus
tard » — pour que ni l'entrée 29 ni le chapitre 2 n'en manquent un. **Ce n'est pas une liste de
décisions** : plusieurs de ces endroits attendent des arbitrages qui appartiennent à l'entrée 29.*

**Déjà réaligné le 03/08 (amendement A32, entrée 12)** : l'énoncé de la proportion F24 au §1 · le
partage « probabiliste » · la conséquence à surveiller · la ligne du registre au §11.

**SOLDÉ le 03/08 — le §13 a été réécrit en séance 6, et ses résidus (item 6 du registre, proportion F24) réalignés en séance 7.** *(Les sept autres endroits ont été réalignés en séance 4, le 03/08 — voir ci-dessus.)*

| § | ce qui est périmé | où ça va |
|---|---|---|
| **§13, « L'aile lecture » en entier** | ce n'est plus une aile mais la famille **`reception`** — dont « la plus faible des **cinq compétences de lecture** » et l'ordre de priorité | **chapitre 2** — **ANNOTÉE le 03/08** *(ligne « vocabulaire d'époque — section à réécrire » en tête ; décision de Louis, 03/08 : ce n'est plus un réalignement mais une réécriture de section)* |
| **§12, l'ordre de lecture** | **annoté, non réécrit** : il ordonne quatre objets devenus des modes ; le ré-ordonner demande un **arbitrage**, non un réalignement | **session « construction de la semaine + ciblage lecture »**, que la liste désignait déjà comme son amendeur |


Une passe = plusieurs séances, c'est prévu. Chaque séance reprend ce prompt, lit la table,
continue où c'était. Les chapitres se font dans l'ordre.

## Chapitre 0 — la SPEC C3 passe en v4.4

**La liste `AMENDEMENTS_C3_en_attente_2026-07-31.md` fait foi**, dans son ordre. Les entrées sont
**déjà arbitrées** : on ne ré-arbitre pas, on rédige. Pour chaque entrée :

1. Relire son entrée détaillée dans la liste et le § de C3 visé (le tableau récapitulatif donne
   les deux ; les entrées détaillées portent souvent un texte presque prêt — s'en servir).
2. Montrer à Louis le texte exact à insérer ou à modifier — pas une paraphrase.
3. Après son accord, écrire (édition ancrée via `device_bash`), inscrire l'entrée au tableau de
   bord A de C3, cocher l'entrée dans la liste avec sa destination.
4. Si l'application révèle un conflit avec le texte en place, ou si une entrée « *à vérifier* »
   ne se vérifie pas : ne pas forcer. L'écart devient un item de séance — chapitre 5 s'il n'est
   pas mûr.

Le débit se règle avec Louis en début de chapitre : entrée par entrée par défaut ; les entrées
purement mécaniques peuvent passer par petits lots s'il le préfère.

Les régimes d'amendement, rappel : **(a)** correction d'une contradiction — s'applique au texte ;
**(b)** question de périmètre non tranchée — s'inscrit ouverte (tableau de bord B, ou
`[à valider]` au § visé) ; **(c)** trou déclaré — s'inscrit avec sa condition de fermeture. Les
entrées « *à vérifier* » (n° 2, 4, 15, 21, 22, 26 au 31/07) se vérifient AVANT application — le
n° 22 porte un problème d'objet connu : `historique_cibles` n'existe nulle part dans C3, c'est
une structure du §3 du routeur.

Les trois sections annexes de la liste font partie du travail : les **datés** gardent leur
échéance visible dans C3 · la section « **ce qui n'appelle PAS d'amendement de schéma** » fait
foi sur les destinations (paramètres au §11 du routeur — registre faisant foi depuis l'amendement
A17 —, règles au texte des lots R1-R6…) ; ce qu'elle envoie côté routeur se vérifie au
chapitre 3 · les « **écarts entre les trois listes** » se relisent pour n'en perdre aucun.

**Sortie du chapitre** : C3 en **v4.4**, tableau de bord à jour, entrée de journal au
`CONTEXTE.md`, la liste d'amendements marquée appliquée (entrée par entrée, avec destination).
À partir de là, C3 est modifiable pendant la passe — mais toute modification reste **un
amendement daté** au tableau de bord, et la version s'incrémente (les manifestes des lots de
code contrôlent la version mécaniquement ; c'est ce qui protège les sessions Code).

## Chapitre 1 — le vocabulaire : chaque chose a un nom, chaque nom a une chose

**Livrable : la table des termes.** Pour chaque terme retenu : sa définition en une phrase, son
domicile (le fichier + la section où il est défini), les termes proscrits qu'il remplace, et les
comptes d'occurrences. Premier item à trancher avec Louis : **où vit cette table** (proposition :
un `LEXIQUE.md` à la racine de `palimpseste-conception` ; le §0 de C3 garde son lexique propre
côté contrat — les deux doivent rester cohérents, et se citer l'un l'autre).

**Méthode, dans l'ordre :**

1. **Relevé mécanique d'abord** : pour chaque terme candidat, `grep -c` sur les six documents.
   Compter AVANT de proposer — un compte a déjà écarté un renommage en une minute le 2/08.
2. Construire la table et la présenter par familles de termes.
3. **Arbitrer les renommages un par un** : le problème, la proposition, le coût en occurrences,
   ce que ça ne change pas — validation de Louis — item suivant.
4. **Appliquer mécaniquement**, document par document, par remplacements ancrés via
   `device_bash`.
5. **Re-compter** : le terme proscrit doit tomber à zéro (hors journal et citations historiques,
   qui ne se réécrivent pas).

**Les chantiers connus** — liste d'amorçage à compléter par le relevé mécanique, pas une liste
fermée :

- **Le mode de composition et sa famille.** Les traces du 2/08 disent tantôt `produire` (« nom à
  trancher »), tantôt `composer` ; la famille tantôt `production`, tantôt `composition`. La
  collision avec les noms des crans (`production_etayee`, `production_autonome`,
  `production_contrainte`) est documentée. Vérifier d'abord si le journal a tranché ; sinon,
  c'est le premier arbitrage du chapitre.
- **L'expression « compétences de lecture »** : il n'y en a plus depuis le 2/08. Ce que chaque
  occurrence veut dire aujourd'hui — un mode réceptif, la famille réception, ou un signal de
  réception — se réécrit au cas par cas.
- **Restitution, Reconstruction, Évaluation** : ex-compétences devenues MODES (`restituer`,
  `expliquer`, `évaluer`) ; et **Mouvement = la Structure en mode `expliquer`**.
- **Problématisation → Questionnement** (fusion du 29/07) — l'ancien nom ne doit plus désigner
  la compétence.
- **`regime_v1vf`** (le régime du cycle première version → version finale, renommé le 30/07) —
  l'ancien nom « régimes de cycle » ne doit plus apparaître.
- **Les paires à ne jamais confondre**, dont les noms doivent porter la distinction : largeur de
  mesure / richesse de sonde · `grain` / `Support` · cran de diagnostic / mode `évaluer` ·
  `Support` / `provenance_materiau` · les deux « diagnostic » (crans de l'échelle d'autonomie,
  types diagnostiques du §8 du routeur).
- **type / objet / instance / exercice / sonde** — l'usage est-il partout celui que les §1 et §3
  de `02-exercices.md` définissent ?

**Règle du chapitre** : aucun renommage « au passage » dans les autres chapitres. Tout renommage
passe par la table, son compte, et l'accord de Louis.

## Chapitre 2 — cohérence interne, document par document

Ordre : `00` → `01` → `02` → `03` → `04` (C3 a eu son chapitre 0 ; ses retouches croisées
viennent au chapitre 3). **Ce n'est pas une re-révision** : les décisions sont prises, on
vérifie que le texte les dit partout pareil. Le pas est donc plus rapide qu'une relecture —
mais section par section quand même.

Pour chaque document, quatre contrôles :

1. **Le début contre la fin.** L'exemple canonique de Louis : une décision prise au §9 que le
   §1, resté vieux, contredit. Chercher les sections écrites avant une décision et jamais
   rattrapées.
2. **La propagation du construct du 2 août** : six compétences + le Monitoring · les cinq
   modes · les familles · `famille` dérivée des modes élus, jamais déclarée. **La référence de
   la propagation est `02-exercices.md`** (ses §1, §2 et §4) plus le journal : on propage DE lui
   VERS les autres, pas l'inverse (cadrage n° 6). Endroits connus :
   le titre du §1 de `00` (« dix compétences, deux familles ») ; ses §3 (les ancres « des
   dix »), §5 (le chantier des ancres de lecture), §7 (la covariance des duals) ; le §13 de `01`
   (« l'aile lecture ») ; `04` en entier — son sort (absorbé, réécrit, ou marqué obsolète avec
   renvoi) se statue avec Louis.
3. **Les statuts.** Ce qui est écrit « acté » doit l'être vraiment (le journal et les relevés en
   font foi). Les `[à valider]` et les *provisoires* s'inventorient au passage — c'est la
   matière du chapitre 5.
4. **Les renvois internes** : chaque « voir §X » pointe vers une section qui existe encore.

**Méthode par écart** : restituer les deux passages côte à côte · dater les deux états au
journal — **avec la présomption de fraîcheur pour `02-exercices.md`** (cadrage n° 6) : la
proposition par défaut aligne sur lui, sauf preuve contraire datée ; c'est Louis qui tranche ·
proposer la correction · écrire immédiatement après accord. **Journaliser après chaque document,
pas en fin de séance.**

## Chapitre 3 — cohérence croisée

Dans cet ordre :

1. **`02-exercices.md` ↔ `01-routeur.md`** — la demande explicite de Louis. Les points de
   contact à passer systématiquement : la règle de montée (matrice grain × cran, état par grain,
   marquage des sondes — amendement n° 28) · les deux colonnes dérivées de F7 (item 7 du relevé
   du 30/07 : le routeur voit deux valeurs de ciblage, l'élève une seule) · ce que le routeur
   consomme du contrat de type — **les six attributs écartés à la révision ne doivent plus être
   consommés nulle part** (rang de richesse de sonde, `produit_mesure`, `duree_redaction_min`,
   `complexite`, `etayage[]`, `statut_modal`) · `couverture_observables` et la règle de ciblage
   R5 · le `regime_v1vf` dérivé des crans · `Support` et la règle de non-emboîtement ·
   l'élection des modes et le ciblage. **En cas de divergence `02` ↔ `01`, la présomption de
   fraîcheur (cadrage n° 6) vaut** : l'alignement par défaut se fait sur `02-exercices.md`, sauf
   preuve au journal que le routeur porte la décision la plus récente.
2. **`00-referentiel.md` ↔ les deux autres.** Le référentiel est le plus ancien des trois (relu
   le 29/07, avant le changement de construct) : c'est lui qui a le plus de chances d'être en
   retard. **Contre `02-exercices.md`** : les compétences et les modes que les types déclarent
   (`competences[]`, `modes[]`) sont-ils exactement ceux que le référentiel définit (ses §1, §3
   et §4.3) ? · les observables que les types exercent ou isolent (`couverture_observables`)
   existent-ils tous au référentiel ? · l'échelle commune E→A (§2 de `00`) et l'échelle
   d'autonomie à sept crans (§2 de `02`) restent deux échelles distinctes, citées sans
   confusion. **Contre `01-routeur.md`** : les seuils nommés et les décisions structurantes de
   l'échelle (§2 de `00`) face aux règles de lettres (§7 de `01`) · les ancres (§3 de `00`) face
   aux diagnostics et mesures en classe (§8 de `01`) · le Monitoring de second ordre — jamais
   noté, jamais cible — ne doit être ciblable nulle part dans le routeur · l'hypothèse de
   covariance des duals (§7 de `00`) face à ce que le ciblage par famille suppose. Pour ces
   écarts, la présomption de fraîcheur s'étage par dates de relecture — `02-` (2/08), puis
   `01-` (30/07), puis `00-` (29/07) : l'alignement par défaut va vers le plus récent, preuve
   datée au journal toujours possible, et Louis tranche.
3. **Les sources ↔ C3 v4.4** : les points de contact listés à la fin de l'entrée du 29/07 du
   journal, et ce que la liste d'amendements a renvoyé côté routeur — les paramètres qu'elle
   envoie au §11 (le registre) y sont-ils réellement écrits ?
4. **Les sources ↔ les deux relevés d'arbitrage.** Les items F1 à F27 et G1 à G5 du relevé du
   30/07, un par un : la décision est-elle retombée dans le texte ? Même chose pour le relevé C3
   du 29/07 — il porte des corrections de terrain que les documents n'ont pas toutes (Louis
   enseigne au cégep, à des élèves de 17 ans et plus…).
5. **Les sources ↔ le rapport de validation du 2/08** — sa §6 : ne rien laisser affirmé comme
   établi qu'il marque non vérifié (les formules « aucune méthode n'est imposée » / « aucun
   barème fixé d'avance » viennent d'une note de service abrogée).

Même méthode par écart qu'au chapitre 2. Un écart tranché ici peut rouvrir une section déjà
passée au chapitre 2 : c'est normal, et ça se note à la table de progression.

## Chapitre 4 — l'appareil du texte : garder les pourquoi, retirer les redites

Deux gestes symétriques, à ne pas confondre :

- **Les justifications se GARDENT.** Un « pourquoi » attaché à une décision est de la
  conception, pas du bavardage — demande explicite de Louis. Si une décision importante n'a PAS
  sa justification dans le document, le signaler : elle existe souvent au journal ou dans un
  relevé, et se rapatrie en une phrase + un renvoi.
- **Les redites PARTENT — avec preuve de domicile.** Une note ne se supprime que si son contenu
  vit ailleurs (fichier + section montrés à Louis), et un renvoi la remplace. Jamais de
  suppression sèche. Proposer par petits lots (cinq ou six items, une ligne chacun : la note,
  son domicile, le renvoi proposé), validation de Louis par lot.

La règle de fond : **un contenu, un domicile, des renvois partout ailleurs.** Les domiciles
établis : les observables → la fiche `competences/<nom>.md` (elle fait foi) · les paramètres →
le §11 du routeur · les types → `02-exercices.md` · le contrat de construction → C3. Compter
avant de proposer (le précédent du 2/08 : « 23 lignes, 27 mentions » là où le souvenir disait
« trois renvois »).

## Chapitre 5 — les non-tranchés : inventaire, tri, décisions

1. **L'inventaire complet**, en croisant quatre gisements : les `[à valider]` et *provisoires*
   relevés au chapitre 2 · les trous déclarés de `02-exercices.md` (la liste est en mémoire de
   projet et au §9 du document) · le §11 du routeur (le registre des paramètres ouverts) · les
   amendements de régime (b) restés ouverts après le chapitre 0 (n° 7, 23, 25, 26, 27… au
   31/07).
2. **Le tri, présenté à Louis** — trois piles : **mûr** (l'information pour trancher existe) ·
   **attend une donnée** (dire laquelle, et quand elle arrive) · **session dédiée** (trop gros
   pour un item de séance — la construction de la semaine, par exemple, est l'étape 3 de la
   séquence, pas un item de ménage).
3. **Trancher les mûrs, un par un** : le problème, la proposition, ce que ça change, ce que ça
   ne change pas → validation → écriture immédiate → item suivant. Jamais un plateau.

Ce qui reste ouvert en fin de passe est **écrit** — statut + condition de fermeture. La revue
adversariale doit pouvoir distinguer une contradiction d'un ouvert assumé.

## Chapitre 6 — la sortie de passe

1. **Contrôle mécanique du vocabulaire** : pour chaque terme proscrit de la table, `grep -c` sur
   les six documents, comptes affichés à Louis. Zéro attendu (hors journal et citations
   historiques).
2. **Contrôle des renvois** : les « voir §X de Y » pointent vers des sections existantes.
3. **Les livrables déposés** : la table des termes (à son domicile choisi) · la **liste de
   propagation** (fichier hors périmètre × terme ou décision × section — l'entrée de la future
   séance sur les fiches) · l'inventaire des non-tranchés restants, avec statuts.
4. **Les en-têtes des six documents** mis à jour : statut de relecture, date de la passe,
   version.
5. **L'état C3 consigné** : version atteinte, amendements posés pendant la passe.
6. **Proposer le commit à Louis** — une commande à la fois, jamais de `git` via le pont.

## Le régime de travail (inchangé — c'est celui de toutes les séances depuis la revue du routeur)

**Un item à la fois.** Pour chaque section ou chaque écart :

1. Tu restitues en quelques lignes — ce que le texte dit, en clair.
2. Tu poses ce que les décisions actées imposent d'y changer, factuellement, sans plaider.
3. Tu signales ce que tu vois de fragile.
4. Louis commente. Tu reformules sa décision en spécification précise, tu la fais confirmer.
5. Tu écris dans le fichier immédiatement — pas en fin de séance.

**Règle cardinale** : tu ne tranches rien à la place de Louis. Tu proposes, tu chiffres, tu
vérifies — et tu t'arrêtes. Non tranché se marque `[à valider]`, jamais « acté ».

**Statuts** : *acté* / *provisoire (réglage empirique)* / *[à valider]*. Un « oui » de Louis
acte un **principe**, jamais un résultat.

**Convention anti-écrasement** : relire le passage sur disque juste avant d'écrire · modifier
par insertions ciblées avec assertion sur la chaîne d'ancrage · ne jamais régénérer un fichier
depuis ta mémoire. Écrire via `device_bash`, jamais par le montage (son cache peut mentir sur le
contenu avec des métadonnées justes). Lire les gros fichiers par tranches.

**Style** : lisibilité avant densité · chaque sigle explicité à sa première occurrence ·
rappeler le contexte d'un point avant d'en discuter · deux phrases courtes plutôt qu'une longue.

### Les leçons des séances passées, à appliquer

- **Vérifier avant d'affirmer, et le montrer.** Grep d'abord, propose ensuite — c'est ce qui a
  rapporté le plus, toutes séances confondues.
- **Louis réfute sur pièces, et il a raison plus souvent qu'à son tour** (trois fois le 2/08).
  Vérifier ses objections avant de défendre une position.
- **Chercher si le système ne tient pas déjà la réponse** avant d'inventer un mécanisme.
- **Préférer une dérivation à un champ déclaré** — le réflexe constant de Louis.
- **Mètis se trompe, et doit le dire vite** — une édition qui tronque une table se répare à la
  relecture immédiate, pas trois sections plus loin.

## Fin de chaque séance (obligatoire, même si la séance est courte)

1. **Mets à jour la table de progression** de ce prompt, et redépose-le au repo (même nom).
2. **Journalise au `CONTEXTE.md`** : une entrée datée — les « non » et les solutions propres de
   Louis en détail, les accords simples par plage, les fichiers touchés. Date vérifiée via
   `device_bash`.
3. **La ligne obligatoire d'impact.** Cette passe modifie C3 directement : la ligne cite ce qui
   a été fait (« impact C3 : v4.4 posée », « impact C3 : amendement n° X ») — ou, pour une
   séance qui n'a pas touché C3, « impact C3 : néant » après contrôle réel.
4. **Le lien de session** s'inscrit aux « Sources historiques » de `CONTEXTE.md` (assert
   d'absence d'abord — Louis l'a parfois déjà posé lui-même).
5. **La mémoire de projet** : l'état de la passe, les arbitrages rendus, ceux en attente.
6. S'il reste des arbitrages ouverts, **les rappeler à Louis sans les re-plaider**.

## Interdits

- **Rien trancher à la place de Louis** — y compris « juste un petit renommage ».
- **Ne pas rouvrir les décisions des relevés et des séances passées.** Si l'une paraît fausse,
  le dire à Louis, pièces à l'appui — ne pas la défaire de soi-même.
- **Pas de conception nouvelle sous couvert de ménage.** La passe fait tenir ensemble
  l'existant. Toute idée nouvelle : `IDEES_post_rentree.md` (repo), ou item du chapitre 5 si
  elle bloque la cohérence.
- **Ne pas toucher aux fichiers hors périmètre** — fiches `competences/*.md`, `copies-tests/`,
  les NOTES, les prompts déposés, le journal (on y ajoute, on ne le réécrit pas). Leurs échos
  vont à la liste de propagation.
- **Aucun renommage hors table des termes ; aucune suppression sans domicile prouvé.**
- **Pas de `git` via le pont Cowork.** Pour Louis : une seule commande de terminal à la fois,
  jamais deux, jamais de `&&`, jamais de « si tu vois X fais ceci ».
- **Aucun run de banc, aucun appel d'API** — la passe est purement documentaire.
- **« Une case vide n'est pas un manque à combler »** (garde-fou du §1 de `02-exercices.md`) —
  à ne pas confondre avec le contrôle de complétude, qui vérifie qu'on n'a rien perdu.
- **Ne pas réintroduire les confusions connues** : les deux « diagnostic » · mode `évaluer` /
  cran de diagnostic · `grain` / `Support` · `Support` / `provenance_materiau` · largeur de
  mesure / richesse de sonde.

---

*Ce prompt suit le gabarit des sessions du chantier (révision de `02-exercices.md` en quatre
séances ; session Questionnement ↔ Monitoring). Si ce prompt et un fichier du chantier se
contredisent, **le fichier a raison** — et l'écart se signale à Louis.*
