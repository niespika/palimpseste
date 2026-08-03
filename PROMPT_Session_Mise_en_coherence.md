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
   `02-exercices.md`, `03-competences-ecriture.md`, `04-competences-lecture.md` (conception).
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
| 2 | Cohérence interne, document par document (00 → 01 → 02 → 03 → 04) | **à faire — C'EST LA PROCHAINE ÉTAPE.** **Quatre items déjà en attente** : le `01-` §13 *(annoté le 03/08)*, le `00-` §7 *(contradiction sur les duals)*, l'avertissement **cran de diagnostic / mode `évaluer`** *(à écrire, aucune source ne le porte)*, et le sort de `04-` |
| 3 | Cohérence croisée (02 ↔ 01 d'abord ; 00 face aux deux ; sources ↔ C3 ; relevés ; rapport) | à faire — **un item dur déjà inscrit** : le **contrôle des chiffres du routeur contre C3, en entier** *(le §8 et le registre du §11 portaient encore 4 620 / 7 700 × X après le réalignement en dix endroits de la séance 4 ; marqué `[À VÉRIFIER AU CHAPITRE 3]` dans le registre)* |
| 4 | L'appareil — justifications gardées, redites retirées | à faire |
| 5 | Les non-tranchés — inventaire, tri, décisions mûres | à faire |
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


### Inventaire ouvert — le `01-routeur.md` porte encore le construct périmé (relevé le 03/08)

*Déposé ici sur demande de Louis — « réaligne tout de suite, pour éviter qu'on oublie un truc plus
tard » — pour que ni l'entrée 29 ni le chapitre 2 n'en manquent un. **Ce n'est pas une liste de
décisions** : plusieurs de ces endroits attendent des arbitrages qui appartiennent à l'entrée 29.*

**Déjà réaligné le 03/08 (amendement A32, entrée 12)** : l'énoncé de la proportion F24 au §1 · le
partage « probabiliste » · la conséquence à surveiller · la ligne du registre au §11.

**RESTE À TRAITER : LE SEUL §13.** *(Les sept autres endroits ont été réalignés en séance 4, le 03/08 — voir ci-dessus.)*

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
