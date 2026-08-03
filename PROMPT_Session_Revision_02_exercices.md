# PROMPT — Révision de `02-exercices.md` — **RÉVISION TERMINÉE (2 août 2026)**

> ## ⛔ CE PROMPT EST CLOS. NE PAS L'EXÉCUTER.
>
> **`02-exercices.md` est RELU ET VALIDÉ par Louis** — les **neuf sections** sont passées, en **quatre séances**
> (Louis × Mètis) : **§1 et §2 le 31 juillet 2026** · **§3 le 1er août** · **§4 à §9 le 2 août**.
> **La règle de manifeste ne bloque plus C4-L1.**
>
> Ce fichier est conservé comme **archive de la méthode** — le régime de travail des §« Le régime de travail » et
> « Interdits » a fait ses preuves **sept** fois et reste le modèle des révisions à venir. Le détail des décisions est
> au journal du `CONTEXTE.md` (entrées des 31/07, 1er et 2 août) et dans le document lui-même.
>
> **La suite du chantier**, arrêtée par Louis le 2 août : *(1)* la **passe de mise en cohérence** — SPEC C3,
> `00-referentiel.md`, `01-routeur.md`, `02-exercices.md` · *(2)* une **revue adversariale sur les trois fichiers en
> même temps** · *(3)* la séance « **construction de la semaine + ciblage lecture** » · *(4)* la **matrice normative
> par statut de recette** · *(5)* le **gel de C3 en un bloc** · *(6)* la **réécriture de C4-L1 et C4-L2**. En
> parallèle et indépendamment : **les bancs, seule échéance dure, au 24 août**. **Et une session dédiée neuve :
> Questionnement ↔ Monitoring** (`PROMPT_Session_Questionnement_Monitoring.md`).

> **Usage** : session Cowork fraîche, avec les deux dossiers connectés — `GitTest/palimpseste-conception`
> et `GitHub/palimpseste`. Poste **Mètis** (conception).
>
> **Ce fichier est le prompt de la révision entière, tenu à jour de séance en séance.** La séance 1
> (31/07) a passé les §1 et §2 ; la séance 2 (1er août) a passé le §3 et refondu la bibliothèque
> d'écriture ; la **séance 3 (2 août) n'a PAS passé le §4** — elle a supprimé quatre compétences et
> produit un rapport de validation qui **réfute une de ses propres décisions**. Table de progression
> au §0. Méthode héritée de `PROMPT_Session_Revue_Routeur.md`, qui a maintenant fait ses preuves
> **six** fois.

---

## Pourquoi cette séance, et ce qu'elle débloque

**La séance 3 a changé le construct, pas la bibliothèque.** Elle est partie du §4 et a trouvé un
**axe manquant** — le **mode**, la relation du discours de l'élève à l'objet. En le nommant, quatre
compétences de lecture ont cessé d'exister : Restitution, Reconstruction et Évaluation sont les modes
`restituer`, `expliquer`, `évaluer` ; **Mouvement est la Structure en mode expliquer**. Il reste **six
compétences plus le Monitoring**, au lieu de dix plus un.

**Puis Louis a demandé une vraie validation avant d'aller plus loin** — littérature scientifique et
méthodes françaises. Elle est faite, et **elle ne dit pas ce qu'on espérait** :

- elle **confirme** la suppression des compétences de lecture — comprendre et évaluer ne se séparent
  pas comme dimensions ;
- elle **réfute** la fusion de `produire` et des modes de lecture **sous une seule lettre de ciblage** ;
- elle montre que **la liste d'objets oublie une classe entière** — non pas des objets, mais un
  **statut** ;
- et elle nomme le mode de panne qui guette : **Guilford**, la matrice à cases non codables.

**Le §4 ne peut donc pas se clôturer comme prévu.** Il faut d'abord trancher ce que le rapport
soulève, puis reprendre la liste d'objets — qui n'est plus celle qu'on croyait tenir.

**Par la règle de manifeste.** Le tableau du §0 de la SPEC C3 marque `02-exercices.md` « en
relecture », et l'ouverture n° 6 pose que tout lot dont le manifeste exige un document en relecture
s'arrête de lui-même. **C4-L1 reste bloqué tant que ce fichier n'est pas validé en entier** — donc
jusqu'au §9. *(Et il n'attend PAS les grilles d'observables manquantes : établi le 1er août, et
renforcé le 2 — les quatre grilles de lecture n'ont plus à être inventées, elles se portent depuis
l'écriture.)*

**La séquence d'août, mise à jour le 2 :** (1) cette révision, §4 à §9 · (2) la **passe de mise en
cohérence** — SPEC C3, `00-referentiel.md`, `01-routeur.md`, `02-exercices.md` · (3) une **revue
adversariale sur les trois fichiers en même temps** · (4) la séance « construction de la semaine +
ciblage lecture » · (5) la matrice normative par statut de recette · (6) le gel de C3 en un bloc ·
(7) la réécriture des prompts C4-L1 et C4-L2. En parallèle et indépendamment : **les bancs**, seule
échéance dure au 24 août — et **ils ne sont pas touchés** : Expression et Structure sont l'un et
l'autre en mode `produire`.

---

## Ta première action, avant toute autre chose

**Affiche `02-exercices.md` dans le panneau latéral.**

> **Attention, piège vérifié quatre fois.** `device_stage_files` sert parfois une copie en **cache
> périmée**, avec des **métadonnées justes** — la taille rapportée ne prouve donc rien.
> **Recette obligatoire** : copier le fichier sous un **nom neuf** via `device_bash`
> (`cp 02-exercices.md _to_delete/02-exercices_ENVOI_<hhmm>.md`), stager **ce nom-là**, **vérifier le
> contenu dans le conteneur** (`cksum` des deux côtés, ou un `grep -c` sur une chaîne distinctive),
> puis `SendUserFile`. **Refais-le à chaque fois que tu modifies le fichier.**

> **Deuxième piège : l'horloge du conteneur Cowork peut retarder de plus de vingt-quatre heures.**
> **Vérifie la date en `device_bash` (`TZ=America/Toronto date`), jamais en `bash`**, avant de dater
> une décision ou une entrée de journal.

> **Troisième piège, appris le 2 août aux dépens du fichier.** Dans une édition Python, **ne jamais
> mêler `str.replace` et des tranches d'index calculées avant lui** — les positions se décalent et
> l'écriture tronque le texte. Une passe = un mécanisme. **Ancre par `assert`, relis immédiatement,
> et compte** (nombre de lignes de table, en-tête, résidus).

> **Quatrième point, non un piège : le pont peut tomber** si l'ordinateur de Louis se met en veille
> pendant qu'il répond depuis son téléphone. Ne pas relancer en boucle : préparer le script d'édition,
> le dire, attendre.

Puis lis, dans cet ordre, et rien de plus :

| Fichier | Ce qu'on y lit |
|---|---|
| `palimpseste-conception/RAPPORT_Validation_Bibliotheque_Unique_2026-08-02.md` | **En entier, et en premier.** C'est la pièce neuve de cette séance : ce qui tient, ce qui casse, ce qu'on oublie, et les modes de panne. **Sa §6 dit ce qui n'a pas pu être vérifié — ne rien citer d'autre comme établi.** |
| `palimpseste-conception/CONTEXTE.md` | conventions, journal, règle de circulation avec C3. **L'entrée du 2 août est la plus importante** ; celles des 31/07 et 1er août portent ce dont elle hérite. |
| `palimpseste-conception/02-exercices.md` | le document. **Lis en entier le §1, le §2, le §3 et le bloc « REFONTE EN COURS — séance 3 » du §4** (Décisions 1 à 3). C'est la spécification que la suite doit satisfaire. |
| `palimpseste/AMENDEMENTS_C3_en_attente_2026-07-31.md` | **entrée 29** (le construct : six compétences, `modes[]`, la lettre, la réserve r = .44), **entrée 17** (contrat de type) et **entrée 28** (règle de montée). |
| `palimpseste-conception/01-routeur.md` | §4 (couches 1 et 3), §5 (R0-R6, et **F7 volet 1** dont on veut généraliser la forme), §6 (escalade, règle de montée, règle d'espacement), §9 (régimes dérivés du cran), §13 (l'aile lecture). |
| `palimpseste/RELEVE_Arbitrage_Referentiel_Routeur_2026-07-30.md` | les vingt-sept décisions. **Elles font foi, ne pas les rouvrir** — sauf **F4** (refermée le 1er août) et **F7 volet 2**, qui **se referme tout seul** depuis la séance 3 : les deux gardiens sont Argumentation et Structure des deux côtés. |
| `palimpseste-conception/00-referentiel.md` | §1 (le compte des compétences), §3 (les blocs de compétences), §4.3 (**la genèse du mode**, à relire dans cette lumière), §7 (**qui tombe** : il n'y a plus de duals). |

Ne relis `03-`, `04-` et les fichiers de `competences/` que si Louis demande un détail précis — **sauf**
`04-competences-lecture.md`, dont les cinq blocs deviennent des modes et dont **les champs, eux, ne
bougent pas**.

---

## §0 — Table de progression — **TOUTES LES SECTIONS SONT PASSÉES**

| § | Section | État final |
|---|---|---|
| 1 | Le gabarit de la fiche de type | **PASSÉE** (séance 1, 31/07) — porte « Le contrat d'interface », **dix points**. Amendée le 1er, le 2 (le mode entre au contrat) et le 2 au soir : **point 10, les deux règles de méthode** — l'effondrement asymétrique de `couverture_observables` et « une case vide n'est pas un manque à combler » |
| 2 | L'échelle d'autonomie | **PASSÉE** (séance 1, 31/07) — sept crans. Amendée le 1er (cran 7) et le 2 (**l'exception L8 refermée** : la lecture 2 des durées la couvrait déjà) |
| 3 | La bibliothèque unique — les treize objets | **PASSÉE** (séance 2, 1er août) — treize objets. Amendée le 2 : colonnes **Nature** et **Durée dérivée**, puis colonne **`Support`**, et « **le mot** » gagne **Structure** et **Argumentation** |
| 4 | Les modes, et ce que la lecture ajoute | **PASSÉE** (séances 3 et 4, 2 août) — **neuf décisions**. La bibliothèque de lecture est **dissoute** ; la section porte l'axe `mode`, la colonne `Support` et les **règles d'instance héritées** |
| 5 | Activation par vagues | **PASSÉE** (séance 4) — **rétrécie** : l'esquisse de progression faisait doublon avec le routeur §4, et ils avaient déjà divergé. Ne garde que l'**activation par vagues** |
| 6 | Clôture des questions de la co-conception lecture | **PASSÉE** (séance 4) — table de clôture ; cinq questions sans objet, **seule 4.1 reste ouverte**, reformulée en (objet × mode × cran) |
| 7 | Banque d'instances, réutilisation, injecteur | **PASSÉE** (séance 4) — **trois dépendances** et **deux exigences** ajoutées ; phasage retraduit ; estimation de volume **déclarée périmée** |
| 8 | L'indexation du mode sur le niveau | **PASSÉE** (séance 4) — **entièrement réécrite** : le cran n'a plus besoin de version lecture, R1-R6 non plus, et ce que le brouillon indexait vraiment était le **mode** |
| 9 | Renvois — et ce qui reste à nettoyer ailleurs | **PASSÉE** (séance 4) — renvois corrigés, inventaire des déménagements, et **dette de nettoyage** rendue visible (23 lignes, 27 mentions) |

---

## Ce que la séance 4 doit trancher, dans cet ordre

### 1. L'item bloquant — généraliser F7 du `famille` au `mode` ? *(à trancher en premier)*

C'est le seul point où le rapport **réfute une décision prise le 2 août**. La Décision 3 pose **une
lettre par compétence, toutes modalités confondues**. Or compréhension en lecture et composition
écrite ne partagent que **19 % de variance** (r = .44, N = 120 669), et **25 à 30 % des élèves** ont
une modalité en décrochage. **Cinq règles lisent cette lettre** — R1, R3, le seuil du Questionnement,
la table des proportions, l'indexation du cran.

**Le correctif est déjà dans le chantier** : F7 volet 1, pour le Questionnement — « une seule lettre
affichée… le routeur élit sur un **signal dérivé par famille**… **aucune règle de lettre n'est
changée** ». Le généraliser au `mode` coûte **zéro au schéma**, la mesure portant déjà le mode.

*Rien d'autre ne se tranche avant celui-là : il décide de ce que la table de lecture doit déclarer.*

### 2. La liste d'objets, révisée par le rapport

La séance 3 avait posé sept objets de lecture, puis vu qu'ils se fondaient dans les treize objets
d'écriture — « le mouvement » est « le plan » lu, « la question » est « la problématisation », « le
concept » est « le mot ». **Le rapport dit que la fusion est juste au niveau des objets et fausse au
niveau des opérations** : l'explication compte **31 opérations dont 22 sans équivalent** en
dissertation, contre 13 propres à la dissertation.

**Le remède qu'il propose n'est pas d'ajouter des objets, mais trois attributs transverses — dont deux
existent déjà** : *producteur* = `provenance_materiau` · *ordre* = dérivable du mode ·
**`statut_modal`** (affirmé / rapporté / concédé / hypothétique / ironique) = **le seul manque réel**.
C'est lui qui modélise l'erreur la plus fréquente de l'explication : **attribuer à l'auteur ce qu'il
combat**.

**À trancher, un item à la fois** : *(a)* une seule bibliothèque ou deux ? · *(b)* `statut_modal`
entre-t-il au contrat ? · *(c)* `Support` devient-il une colonne de la table unique — le rapport le
dit **constitutif** des modes non productifs, et sa longueur ne décide **pas** du grain · *(d)* que
faire de **l'hypothèse d'interprétation avec son degré de vraisemblance** (le Monitoring en a
l'observable, aucun exercice ne la travaille) et de **la relation typée entre objets** (X justifie /
objecte à / reformule Y), que le rapport nomme comme le manque le plus profond.

### 3. Les deux points de forme laissés ouverts le 2 août

- **Le nom du mode d'écriture** : `produire` **entre en collision** avec trois crans qui s'appellent
  déjà `production_*`. Candidats : **composer** · **affirmer** *(premier mot de Louis ; réserve : un
  plan n'affirme pas)* · **produire** *(le mot du référentiel, au prix de la collision)*.
- **`mode` ou `modes[]`** : la condensation étant « produire **et** restituer », le contrat aurait une
  liste, comme `crans[]`.

### 4. Les quatre dettes anciennes du §4, à relire sous les modes

1. **Les types à extension de grain** (L1, L5, L6, L10, L11, L12) couvrent deux supports — la question
   se dissout si le `Support` devient une colonne distincte du grain. **À vérifier, pas à supposer.**
2. **L8** déclaré `optionnel` là où un cran de production donnerait `plein`.
3. **La distribution dix micro / deux méso / un macro** — sa prémisse est morte, le grain ne portant
   plus la difficulté.
4. **L9 déclare 45 min**, qui est la durée de l'**épreuve**, non celle du cycle.

### 5. Le garde-fou de méthode, à écrire dans le document

13 objets × 5 modes × 7 crans × 3 grains ≈ **1 365 cases** — la forme de la matrice de Guilford. Le
rapport impose deux règles à inscrire noir sur blanc :

- **pré-déclarer les effondrements** — quelles paires de crans et de modes fusionnent quand on ne peut
  pas trancher *(des enseignants classant six items obtiennent κ = 0,25 ; en effondrant six niveaux en
  trois, l'exactitude passe à 81,8 %)* ;
- **« une case vide n'est pas un manque à combler »** — c'est l'inverse de la prescription de Bloom,
  et c'est ce que disent les données : les axes ne sont pas orthogonaux, la masse se concentre sur
  quelques diagonales.

*Et un troisième, à porter au protocole de banc plutôt qu'ici : si le format de la mesure épouse celui
de l'exercice, **on mesure le format, pas le construct**.*

### 6. Puis les §5 à §9, dans l'ordre du document

Le §8 est le plus lourd : son brouillon indexe **des compétences qui n'existent plus**, et doit devenir
l'indexation **(mode × cran) ↔ niveau**. Le §6 est le plus léger : la moitié de ses questions est
refermée ou périmée.

---

## Le régime de travail *(inchangé — il a marché six fois)*

**Une section à la fois, dans l'ordre du document.** Pour chaque section :

1. **Tu la restitues en quelques lignes** — ce qu'elle dit, en clair.
2. **Tu poses ce que les décisions actées imposent d'y changer**, factuellement, sans plaider.
3. **Tu signales ce que tu y vois de fragile** : contradiction interne, attribut qu'une règle
   consomme et que le type ne déclare pas, chiffre sans justification, silence sur un cas fréquent.
4. **Louis commente.** Tu écoutes, tu **reformules sa décision en spécification précise**, tu la
   **fais confirmer**.
5. **Tu écris dans le fichier immédiatement**, point par point — **pas à la fin de la séance**.

**Règle cardinale** : tu ne tranches rien à la place de Louis. Tu proposes, tu chiffres, tu vérifies
la cohérence — et tu t'arrêtes. Non tranché se marque **[à valider]**, jamais « acté ».

**Statuts** : *acté* / *provisoire (réglage empirique)* / *[à valider]*. Un « oui » de Louis acte un
**principe**, jamais un résultat.

**Convention anti-écrasement** : relire le fichier sur disque **juste avant** de l'écrire, modifier
par **insertions ciblées** avec une **assertion sur la chaîne d'ancrage**, jamais de régénération
depuis ta mémoire. Écrire via `device_bash`, jamais par le montage.

**Style** : lisibilité avant densité ; **expliciter chaque sigle à sa première occurrence** ;
rappeler le contexte d'un point avant d'en discuter. **Un item à la fois, jamais un plateau.**

### Les leçons des séances 1 à 3, à appliquer

- **Vérifier avant d'affirmer, et le montrer.** C'est ce qui a rapporté le plus, les trois fois. Le
  2 août : le coût réel du nettoyage compté (23 lignes, 27 mentions, contre « trois renvois ») · R4
  relue et trouvée plus forte que le souvenir de Louis · le coût du renommage `t`/`l` → `E`/`L`
  vérifié nul au schéma **avant** de le proposer. **Grep d'abord, propose ensuite.**
- **Préférer une DÉRIVATION à un champ déclaré.** Réflexe constant de Louis. Sur toute la révision,
  deux attributs seulement ont été **ajoutés** — la provenance et le mode —, et chaque fois après
  avoir cherché la dérivation sans la trouver. **Et le mode en a fait disparaître un** : `famille`
  devient dérivable.
- **Chercher si le système ne tient pas déjà la moitié de la réponse.** Le 2 août, quatre fois : les
  fondements du mode étaient au §4.3 du référentiel · la machinerie « une compétence, plusieurs
  instruments » était **déjà actée** par F7 et F3 · `provenance_materiau` **est** l'attribut
  *producteur* que le rapport réclame · et F7 volet 2 s'est refermé tout seul.
- **Louis réfute sur pièces, et il a raison plus souvent qu'à son tour.** Le 2 août : il a vu la
  collision des deux sens de « type », il a vu que la Restitution n'a pas un parent mais quatre hôtes,
  et il a vu que le `Support` manquait à la table fusionnée — trois fois avant Mètis. *Et il a demandé
  la validation documentaire qui a réfuté une décision du jour : quand il dit « ça demande une vraie
  validation », il a raison de le dire.*
- **Mètis se trompe, et doit le dire vite.** Le 2 août : une édition Python qui a tronqué la table du
  §3, détectée à la relecture immédiate et réparée. Le 1er août : une extrapolation d'horloge et un
  pronostic trop pessimiste sur C4-L1.

---

## Fin de chaque séance (obligatoire, même si la séance est courte)

1. **Renvoie le fichier à Louis** — par une copie à nom neuf, contenu vérifié dans le conteneur.
2. **Mets à jour la table de progression du §0** de ce prompt, et redépose-le au repo.
3. **Journalise au `CONTEXTE.md`** : une entrée datée — **les « non » et les solutions propres de
   Louis en détail**, les accords simples résumés par plage, les sections validées, les fichiers
   touchés. *Vérifier la date en `device_bash`.*
4. **Inscris les amendements C3** dans `AMENDEMENTS_C3_en_attente_2026-07-31.md` — entrée **17** pour
   le contrat de type, **28** pour la règle de montée, **29** pour le construct et les modes, une
   entrée neuve sinon — **et non au tableau de bord de la spec** *(décision de Louis, 31/07)*.
5. **Termine par la ligne obligatoire** : **« impact C3 : néant »** ou **« impact C3 : amendement
   X »**. Sans cette ligne, la séance n'est pas close.
6. **Marque la section dans le fichier quand elle devient stable.** Le document porte « **EN
   RELECTURE par Louis** » en tête. Il ne passera « **relu et validé** » — et ne débloquera C4-L1 —
   que lorsque **toutes** les sections seront passées.

---

## Interdits

- **Ne rien trancher à la place de Louis.** En cas de doute, ou de décision que ce prompt ne règle
  pas : note la question, pose-la, et arrête-toi.
- **Ne pas rouvrir les vingt-sept décisions d'arbitrage** du relevé du 30-31 juillet, ni les décisions
  des séances 1 à 3. Si l'une paraît fausse à la lumière du rapport, **dis-le à Louis** — mais ne la
  défais pas de toi-même. *(C'est exactement ce qui est arrivé le 2 août à la Décision 3 : signalée,
  non défaite, et portée en tête de cette séance.)*
- **Ne pas modifier `01-routeur.md` ni `00-referentiel.md` en séance.** Les deux sont **dans le
  périmètre de la passe de mise en cohérence** *(Louis, 2 août : « le référentiel est un oubli, il
  doit faire partie »)*, mais la passe vient **après** cette révision. Une conséquence qui les touche
  se **signale**, elle ne s'écrit pas — sauf demande explicite de Louis, comme le 1er août pour la
  règle de montée.
- **Ne pas régénérer le fichier entier** depuis ta mémoire — insertions ciblées uniquement.
- **Ne pas traiter plusieurs sections d'un coup** parce que « elles sont courtes ».
- **Ne pas citer comme établi ce que le rapport signale comme non vérifié** — sa §6 fait foi. En
  particulier : les formules « aucune méthode n'est imposée » et « aucun barème fixé d'avance », qui
  circulent partout, viennent d'une note de service **abrogée**.
- **Ne pas confondre les deux « diagnostic »** : les **crans de diagnostic** de l'échelle et les
  **types diagnostiques** du §8 du routeur.
- **Ne pas confondre le mode `évaluer` et le cran de diagnostic** *(nouveau, 2 août)* : le cran porte
  sur une **production** avec un **défaut injecté** et mesure la détection ; le mode porte sur
  **l'objet lui-même**, sans bonne réponse fournie.
- **Ne pas confondre les deux grains en lecture** : `grain` (micro/méso/macro, lu par la table des
  proportions) et **`Support`** (phrase → paragraphe → extrait → texte, lu par la règle de
  non-emboîtement, §7). Les fusionner casserait le §7.
- **Ne pas confondre `Support` et `provenance_materiau`** : le premier dit l'étendue du **texte
  d'auteur**, le second d'où vient le **spécimen**. Les deux coexistent sur un même exercice.

---

## Ce qui reste ouvert au 2 août, et que la suite doit fermer

- **La généralisation de F7 au `mode`** — l'item n° 1 de cette séance.
- **`statut_modal`**, l'**hypothèse d'interprétation** et la **relation typée entre objets** — les
  trois manques que le rapport nomme et qu'aucune décision ne couvre.
- **Le nom du mode d'écriture** et **`mode` vs `modes[]`**.
- **La fiche de la conclusion et celle de l'exemple** n'existent pas — deux trous déclarés.
- **Argumentation sur « la transition »** est **provisoire, à réviser** — Louis veut revoir les
  observables avant le gel. *Le rapport donne un argument neuf : sur 130 copies, thèse et données ne
  corrèlent pas avec la qualité ; seules la contre-thèse et la réfutation corrèlent.*
- **La lecture 2 des durées est actée** ; les fourchettes restent **provisoires**.
- **Le nettoyage des renvois par numéro de type** : 23 lignes, 27 mentions, dans quatre fiches et le
  routeur. *Et `competences/synthese.md` porte le statut **PROPOSITION v0, rien d'acté**, alors que
  l'arborescence du `CONTEXTE.md` le dit encore « À CRÉER ».*
- **La règle de montée** est écrite au routeur ; son état de progression et le marquage des sondes
  sont des amendements C3 (entrée 28) non encore posés à la spec.
- **`competences_secondaires[]` → `competences[]`** : décidé, pas encore porté dans la SPEC C3.
