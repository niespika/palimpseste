# PROMPT — Session dédiée : le Questionnement, le Monitoring, et le mode `questionner`

> **Usage** : session Cowork fraîche, avec les deux dossiers connectés — `GitTest/palimpseste-conception`
> et `GitHub/palimpseste`. Poste **Mètis** (conception).
>
> **Déposé le 2 août 2026**, à la clôture de la séance 4 de la révision de `02-exercices.md`, **à la demande
> explicite de Louis**. La dette qu'il ouvre a été relevée en séance et **délibérément non tranchée** : elle a la
> taille d'une décision de construct, et elle mérite sa séance.

---

## La question, en une phrase

**La compétence Questionnement a-t-elle lieu d'être — ou n'est-elle qu'un seuil méta-cognitif lié au mode
`questionner` d'une autre compétence ?**

C'est **l'hypothèse de Louis**, posée le 2 août : *« chaque compétence a forcément un niveau méta-réflexif, quand
elle passe en mode questionner, mais il vaut mieux ne pas inclure la mesure de cette méta-réflexion dans autre chose
que la mesure de la compétence. Si c'est bien ça, alors la compétence de questionnement n'a pas lieu d'être. Elle est
juste un seuil méta-cognitif lié à un mode d'expression d'une compétence. »*

**Si elle tient, le construct passe de six compétences à cinq.** C'est une révision de la **Décision 2 du 2 août**, du
même ordre de grandeur qu'elle — et la Décision 2 avait, elle, reçu une **validation documentaire** avant d'être
tenue pour acquise (`RAPPORT_Validation_Bibliotheque_Unique_2026-08-02.md`). **Celle-ci mérite le même traitement.**

---

## Ta première action, avant toute autre chose

**Affiche `00-referentiel.md` dans le panneau latéral.**

> **Piège vérifié cinq fois.** `device_stage_files` sert parfois une copie en **cache périmée**, avec des
> **métadonnées justes** — la taille rapportée ne prouve rien. **Recette obligatoire** : copier le fichier sous un
> **nom neuf** via `device_bash` (`cp 00-referentiel.md _to_delete/00-referentiel_ENVOI_<hhmm>.md`), stager **ce
> nom-là**, **vérifier le contenu dans le conteneur** (`cksum` des deux côtés, ou un `grep -c` sur une chaîne
> distinctive), puis `SendUserFile`. **Refais-le à chaque fois que tu modifies le fichier.**

> **Deuxième piège : l'horloge du conteneur Cowork peut retarder de plus de vingt-quatre heures.** Vérifie la date en
> `device_bash` (`TZ=America/Toronto date`), **jamais en `bash`**, avant de dater une décision.

> **Troisième piège.** Dans une édition Python, **ne jamais mêler `str.replace` et des tranches d'index calculées
> avant lui** — les positions se décalent et l'écriture tronque le texte. **Une passe = un mécanisme.** Ancre par
> `assert`, relis immédiatement, et compte.

> **Quatrième point, non un piège : le pont peut tomber** si l'ordinateur de Louis se met en veille. Ne pas relancer
> en boucle : préparer le script d'édition, le dire, attendre. *(C'est arrivé le 2 août ; l'`assert` d'ancrage a
> empêché toute double écriture.)*

Puis lis, dans cet ordre, et rien de plus :

| Fichier | Ce qu'on y lit |
|---|---|
| `palimpseste-conception/00-referentiel.md` | **§1** (le compte des compétences et la ligne « Le Questionnement — la seule compétence des deux familles ») · **§3** *(c'est la pièce centrale : le Questionnement y est un **troisième type structurel**)* · **§4.3** (la genèse du construct de lecture, et le logement de la Connaissance sous `these_adverse`) · **§7** (ce qui reste des paires de second ordre) |
| `palimpseste-conception/02-exercices.md` | **§4**, Décisions **1 à 9** — en particulier la **Décision 8** (le nommage) et la **Dette ouverte** en fin de bloc. Puis **§8**, l'indexation du mode |
| `palimpseste-conception/CONTEXTE.md` | l'entrée du **2 août, séance 4** — elle porte les pièces relevées et leur origine |
| `palimpseste-conception/RAPPORT_Validation_Bibliotheque_Unique_2026-08-02.md` | **§3.2 groupe 2** (l'hypothèse d'interprétation) et **§6** *(les réserves de fiabilité : **rien de ce qu'elle signale comme non vérifié ne doit circuler comme établi**)* |
| `palimpseste/RELEVE_Arbitrage_Referentiel_Routeur_2026-07-30.md` | **F7** (les deux volets), **F18** (l'inversion du départage chez les B visant A), **F3** (le banc sur quatre lots) |
| `palimpseste-conception/01-routeur.md` | **§5** (R2, le trio, le seuil d'entrée) · **§3** (l'état du Monitoring, qui ne vit pas dans `competences_niveaux`) |

---

## Ce qui soutient l'hypothèse — cinq pièces, toutes trouvées le 2 août

1. **Le référentiel en fait déjà un cas à part.** Son **§3** : *« Le Questionnement faisait bande à part — le seuil
   n'y est pas franchi par une seconde dimension (il n'y en a qu'une), mais par **un changement qualitatif à
   l'intérieur de la dimension unique**. **Troisième type structurel.** »* **C'est presque mot pour mot la
   formulation de Louis.**
2. **Sa seconde sous-dimension n'en est pas une.** La *situation du débat* est **filée dans les paliers**
   (« le débat n'apparaît pas » à Faible, « position adverse identifiée » à Bon) et non traitée en axe séparé.
3. **L'argument de la fusion du 29 juillet joue POUR l'hypothèse, pas contre.** Les deux Problématisations n'en font
   qu'une parce que *« le geste est le même des deux côtés »*. **Or ce qui traverse les familles, depuis le 2 août,
   c'est précisément un mode.**
4. **La fiche `competences/questionnement.md` n'existe pas.** Il n'y a rien à défaire — seulement à décider.
5. **Le 2 août a déjà fait de `questionner` un mode ET une compétence**, en présentant cette singularité comme
   l'explication du fait que le Questionnement soit la seule compétence des deux familles. *L'hypothèse dit que la
   singularité était le symptôme, pas l'explication.*

---

## Ce qu'elle casse — à traiter, pas à contourner

1. **`these_adverse` perd son hôte.** Ce n'est pas un champ mineur : le **§4.3** y loge **la Connaissance côté
   lecture** — *« non plus combien tu sais, mais sais-tu reconstruire le débat que le texte habite »*.
2. **Les enjeux sont déjà sans domicile.** Le §4.3 les donne « à cheval » entre le Questionnement et l'Évaluation,
   *« placés dans Évaluation par défaut, **jamais ratifiés par Louis** »* — et **l'Évaluation n'existe plus**.
3. **R2 perd un membre.** Le trio {Questionnement, Argumentation, Structure} devient un duo.
4. **F18 est l'objection dure.** Acté le 30 juillet : *« chez les B visant A, le Questionnement remonte en priorité —
   c'est lui qui sépare les bonnes copies des excellentes »*. Si ce n'est plus une compétence, **cibler le
   questionnement signifie cibler « Argumentation en mode `questionner` », c'est-à-dire un ciblage indexé par
   mode** — ce que Louis a refusé le 2 août au matin, et que la Décision 4 a confirmé en binaire. **Soit F18 meurt,
   soit le refus se rouvre.**
5. **Le seuil d'entrée perd son objet** (F7 volet 2, acté). Ce serait la troisième simplification de F7 en quatre
   jours.
6. **Le banc sur quatre lots disparaît** (F3). C'est une économie réelle — mais elle se décide, elle ne se constate
   pas.

---

## Le Monitoring, la troisième pièce — et la ligne proposée le 2 août

**Ce que le Monitoring est**, et qui ne change pas : compétence de **second ordre**, **jamais notée, jamais cible du
routeur**, **hors de l'échelle E→A**, avec **ses deux tables propres** (amendement A8). Deux sous-dimensions :
`lucidite_incompris` (**un taux sur fenêtre à dénominateur restreint**) et `calibration_confiance` (amplitude signée).

**La ligne proposée en séance 4, à éprouver** : **le mode `questionner` et la compétence Questionnement prennent un
objet HORS de l'élève** — un texte, un sujet ; **le Monitoring prend l'élève lui-même** pour objet — ce qu'il n'a pas
compris, à quel point il est sûr.

**Et le raffinement qui la complique, relevé le même jour** : **`questionner` n'est réflexif que quand l'objet est la
production de l'élève lui-même.** Sur un texte d'auteur, questionner est un acte **interprétatif**, pas réflexif.
**La ligne passe donc par `provenance_materiau`** — `production_eleve` d'un côté, `texte_source` de l'autre.

**Ce que le référentiel dit et qui n'a jamais été éprouvé** : son **§7** garde **Questionnement ↔ Monitoring** comme
**la seule paire de second ordre survivante** après la chute des duals. *Jamais testée.*

---

## Les trois questions de la séance, dans cet ordre

### 1. La compétence Questionnement survit-elle ? *(l'item bloquant)*

Rien ne se décide avant. **Et la primauté du banc s'applique** : un « oui » de Louis acte un **principe**, jamais un
résultat. **Si la réponse est oui, exiger une validation documentaire** — c'est ce qui a sauvé la séance 3 de
construire la moitié fausse de son hypothèse.

### 2. Où vivent `these_adverse` et les enjeux ?

**Ces deux-là sont sans domicile quelle que soit la réponse à la question 1** — les enjeux le sont déjà depuis que
l'Évaluation a disparu. *À traiter même si le Questionnement survit.*

### 3. Quel exercice travaille l'hypothèse d'interprétation ?

*« Le texte peut vouloir dire A ou B, A est plus probable parce que… »* — **le seul manque du rapport de validation
qui ne se dérive pas**. Le Monitoring en a l'observable, `marquage_hypothese` (« distingue le posé-sûr de
l'avancé-en-hypothèse »), et **aucun objet ni aucun exercice ne la travaille**.

*Piste ouverte en séance 4, non tranchée : son **contenu** se mesurerait par la compétence de lecture en mode
`expliquer`, son **marquage** par le Monitoring — deux mesures sur une production, ce que le système fait déjà. Le
manque serait alors dans la **bibliothèque**, pas dans le construct : un objet servi en mode `expliquer`, à un cran où
**deux lectures sont plausibles**, avec l'habillage « lecture calibrée » actif.*

---

## Le régime de travail *(inchangé — il a marché sept fois)*

**Un item à la fois, dans l'ordre ci-dessus.** Pour chaque item :

1. **Tu le restitues en quelques lignes** — ce qu'il dit, en clair.
2. **Tu poses ce que les décisions actées imposent d'y changer**, factuellement, sans plaider.
3. **Tu signales ce que tu y vois de fragile** : contradiction interne, attribut qu'une règle consomme et que rien ne
   déclare, chiffre sans justification, silence sur un cas fréquent.
4. **Louis commente.** Tu écoutes, tu **reformules sa décision en spécification précise**, tu la **fais confirmer**.
5. **Tu écris dans le fichier immédiatement**, point par point — **pas à la fin de la séance**.

**Règle cardinale** : tu ne tranches rien à la place de Louis. Tu proposes, tu chiffres, tu vérifies la cohérence — et
tu t'arrêtes. Non tranché se marque **[à valider]**, jamais « acté ».

**Convention anti-écrasement** : relire le fichier sur disque **juste avant** de l'écrire, modifier par **insertions
ciblées** avec une **assertion sur la chaîne d'ancrage**, jamais de régénération depuis ta mémoire. **Écrire via
`device_bash`, jamais par le montage.**

**Style** : lisibilité avant densité ; **expliciter chaque sigle à sa première occurrence** ; rappeler le contexte d'un
point avant d'en discuter. **Un item à la fois, jamais un plateau.**

### Les leçons des quatre séances de la révision, à appliquer

- **Vérifier avant d'affirmer, et le montrer. Grep d'abord, propose ensuite.** C'est ce qui a rapporté le plus, les
  quatre fois. Le 2 août : le compte de « conception » (71 occurrences) a écarté une proposition de Louis en une
  minute ; le coût des deux renommages comparé avant de choisir ; le rapport de validation pris en défaut sur sa
  propre §1.2.
- **Préférer une DÉRIVATION à un champ déclaré.** Réflexe constant de Louis. Sur toute la révision, **deux attributs
  ajoutés contre six écartés**.
- **Chercher si le système ne tient pas déjà la moitié de la réponse.** Le 2 août, quatre fois — dont « la liste des
  moments **est** une liste de relations typées », qui a comblé « le manque le plus profond » du rapport avant qu'il
  soit formulé.
- **Louis réfute sur pièces, et il a raison plus souvent qu'à son tour.** Le 2 août : le mode attaché au couple
  (compétence, exercice) et non à l'exercice ; `questionner` qui n'est ni écriture ni lecture ; et la transformation
  qui est « uniquement au niveau de la composition, pas de la réception » — trois fois avant Mètis.
- **Mètis se trompe, et doit le dire vite.** Le 2 août : « à un cran de transformation, l'élève doit comprendre le
  défaut » — de la **psychologie, pas de la mesure**. Corrigé en séance.

---

## Fin de séance (obligatoire, même si la séance est courte)

1. **Renvoie les fichiers touchés à Louis** — par une copie à **nom neuf**, contenu vérifié dans le conteneur.
2. **Journalise au `CONTEXTE.md`** : une entrée datée — **les « non » et les solutions propres de Louis en détail**,
   les accords simples résumés par plage, les fichiers touchés. *Vérifier la date en `device_bash`.*
3. **Inscris les amendements C3** dans `AMENDEMENTS_C3_en_attente_2026-07-31.md` — **entrée 29** pour le construct,
   une entrée neuve sinon — **et non au tableau de bord de la spec** *(décision de Louis, 31/07)*.
4. **Inscris le lien de la session** à la section « Sources historiques » du `CONTEXTE.md` *(assert d'absence
   d'abord)*.
5. **Termine par la ligne obligatoire** : **« impact C3 : néant »** ou **« impact C3 : amendement X »**. Sans cette
   ligne, la séance n'est pas close.

---

## Interdits

- **Ne rien trancher à la place de Louis.** En cas de doute : note la question, pose-la, et arrête-toi.
- **Ne pas rouvrir** les vingt-sept décisions d'arbitrage du 30-31 juillet, ni les neuf décisions du §4 de
  `02-exercices.md`. Si l'une paraît fausse, **dis-le** — mais ne la défais pas de toi-même.
- **Ne pas modifier `01-routeur.md` ni `02-exercices.md` en séance.** Les deux sont **relus et validés** ; une
  conséquence qui les touche se **signale**, elle ne s'écrit pas — sauf demande explicite de Louis.
- **`00-referentiel.md` est le document de cette séance** : c'est le seul qui peut être modifié, et **seulement**
  après une décision explicite de Louis.
- **Ne pas régénérer un fichier entier** depuis ta mémoire — insertions ciblées uniquement.
- **Ne pas citer comme établi ce que le rapport de validation signale comme non vérifié** — sa **§6** fait foi.
- **Ne pas confondre le mode `évaluer` et le cran de diagnostic** : le cran porte sur une **production** avec un
  **défaut injecté** et mesure la détection ; le mode porte sur **l'objet lui-même**, sans bonne réponse fournie.
- **Ne pas confondre les deux grains** : `grain` (micro/méso/macro, la charge de ce que l'élève produit) et `Support`
  (phrase → texte, l'étendue du texte d'auteur).
- **Ne pas rouvrir sans le dire le refus d'indexer par mode** la fenêtre d'acquisition et la matrice de montée
  *(Louis, 2 août, sur chiffrage)*. **L'objection F18 y touche** — si la séance y arrive, elle doit le nommer.
