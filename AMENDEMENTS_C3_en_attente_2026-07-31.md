# SPEC C3 — amendements en attente, liste consolidée au 31 juillet 2026

Ce document est la liste unique des amendements qui restent à poser sur `SPEC_C3_exercices_competences.md`, actuellement en **v4.3** (amendements A1 à A19 déjà inscrits au tableau de bord du socle, section A).

Il fusionne trois sources : le **relevé d'arbitrage du 30/07** (`RELEVE_Arbitrage_Referentiel_Routeur_2026-07-30.md`), relu ici **item par item, F1 à F27 et G1 à G5**, et non depuis son résumé ; le **récapitulatif consolidé du journal** de `palimpseste-conception/CONTEXTE.md` (entrée « passe §5 » du 30/07 et ses compléments) ; et les **quatre amendements A20 à A23** du chantier Structure (`copies-tests/structure/AMENDEMENT_C3_Structure_31juillet.md`).

Contrôle de non-perte fait contre la section A de la spec : aucun amendement déjà appliqué n'est remis en attente, et le récapitulatif du journal se révèle intégralement absorbé — voir la dernière section, à lire en premier.

---

## Tableau récapitulatif

| n° | intitulé court | régime | source | § de C3 visé | daté ? |
|---|---|---|---|---|---|
| 1 | La chaîne d'évaluation est en quatre temps | (a) | Structure A20 | §0, et §5 | — |
| 2 | « 2N + 4 » rétrogradée en ordre de grandeur | (a) *à vérifier* | Relevé F22 | §0, §10 | — |
| 3 | Banc du Questionnement sur quatre lots | (a) | Relevé F3 | §1.7 | avant la recette du 24/08 |
| 4 | Recalcul de la lettre à la bascule vers `evaluee` | (a) *à vérifier* | Relevé F2 | §1.7 | — |
| 5 | Le niveau d'une copie : mode + étendue ; recette mesurée par tirage | (a) | Structure A21 | §1.7 | — |
| 6 | A6 requalifié en trou déclaré, condition de fermeture nommée | (c) | Structure A22 | §1.7, B2-15 | avant la recette du 24/08 |
| 7 | L'essai de Fragments probablement réservé aux HLP | (b) | Relevé F27 | §1.4, §4 | — |
| 8 | Le dispositif mesure l'architecture telle qu'elle est écrite | (c) | Structure A23 | §2, §1.7 | — |
| 9 | La parenthèse « 75-90 min pour 45 min de rédaction » est fausse | (a) | Relevé F1 | §3 | — |
| 10 | Durée déclarée indicative, temps réel mesuré, micro-question de dépassement | (a) | Relevé F9 | §3, §6 | avant C4-L1 (volet schéma) |
| 11 | Contenu de la matrice normative par statut de recette | (a) | Relevé F6 | §4 | — |
| 12 | La cadence 2-1 revient en proportion 2/3–1/3 sur trois cycles | (a) | Relevé F24 | §4 | — |
| 13 | Deux colonnes dérivées de ciblage (par famille, non plafonnée) | (a) | Relevé F7, F14 | §4, §6 | — |
| 14 | Compteur « minutes assignées / minutes de budget » | (a) | Relevé F1 | §4, §6 | — |
| 15 | Ancre aveugle : unité de comparaison et journalisation | (a) *à vérifier* | Relevé G3 | §4 | — |
| 16 | Le retour de Monitoring nomme la dimension, jamais la grille | (a) | Relevé G1 | §5 | **avant les écrans du lot C4-L3** |
| 17 | `produit_mesure` et les attributs de contrat de type | (a) + (b) | Relevé F4, F6, F12, F23 | §6 `exercices_types` | avant C4-L1 |
| 18 | Forme de `lucidite_incompris` : un taux sur fenêtre | (a) | Relevé F8 | §6 `monitoring_*` | **avant que C4-L1 crée les tables** |
| 19 | `competences_niveaux.lettre` rendue NULLABLE | (a) | Relevé F19 | §6 | avant C4-L1 |
| 20 | Coût journalisé par appel et par phase | (a) | Relevé F21 | §6 | avant C4-L1 |
| 21 | Date d'ouverture des dossiers N3 et re-signalement | (a) *à vérifier* | Relevé G4 | §6 | — |
| 22 | Clé `famille` sur `historique_cibles` | (a) *à vérifier* | Relevé F11 | §6 — objet absent de C3 | — |
| 23 | Aucun champ de dispersion sur `competences_mesures` | (b) | Structure A21 | §6 | — |
| 24 | Table de calcul de l'amplitude du Monitoring | (c) | Relevé F8 | §1.1, §6 | se ferme après collecte |
| 25 | Périmètre du multiplicateur X des multi-appels | (b) | Relevé F20 | B2-8 | avec le régime de modèle |
| 26 | Branche d'échec du pipeline de sélection | (b) *à vérifier* | Relevé F4 | §4, §6 | — |
| 27 | Les deux gardiens côté lecture du seuil du Questionnement | (b) | Relevé F7 | §1.7, §4 | avant l'allumage |

---

## Entrées détaillées

### 1 — La chaîne d'évaluation est en quatre temps · §0 (et §5) · (a)

Le §0 écrit que « le **jugement froid** est la chaîne P1/P2 — P1 extrait le squelette, **P2 produit le verdict** (observables et niveau) ». C'est faux depuis le 30/07 : sur Expression puis sur Structure, la chaîne est **P1 (modèle) → code qui prépare → P2 (modèle) → code qui agrège**. P2 ne rend ni niveau, ni dimension, ni décompte ; le modèle ne produit aucune lettre et aucun nombre. Mesuré : sur 118 cellules, Haiku manque la règle d'agrégation 20 fois sur 25 quand elle est déterminée ; cinq répliques du même squelette figé donnent quatre décomptes différents pour un même verdict. **Source : Structure A20.**

*Point de vérification ajouté ici : la même formulation figure une seconde fois au **§5** (« le **jugement froid** (chaîne P1/P2 par compétence) ») — l'amendement doit passer aux deux endroits, alors que la note Structure ne cite que le §0.*

### 2 — « 2N + 4 » rétrogradée en ordre de grandeur · §0, §10 · (a), à vérifier

F22 acte que la formule est **un ordre de grandeur de conception, non un chiffre de pilotage**, que sa définition de N diffère selon les sections, qu'**aucune règle ne doit s'y appuyer** — ni plafond, ni projection, ni arbitrage — et que la télémétrie fait foi. Or C3 énonce la formule comme un fait au **§0** (« soit 2N + 4, où N est le nombre de compétences mesurées ») et au **§10** (« en régime, 2N + 4 appels par exercice »). La mise en cohérence consiste à y porter la réserve.

*À vérifier : le relevé ne pose la décision qu'aux §4 et §6 du routeur ; il n'a pas regardé si C3 portait la formule. Elle y est.* À noter que A20 confirme par ailleurs que la formule elle-même est **inchangée** par le passage en quatre temps — les deux temps de code ne sont pas des appels.

### 3 — Banc du Questionnement sur quatre lots · §1.7 · (a) · daté

Décision de Louis en F3 : le Questionnement sera bancé sur **4 lots de copies — 2 écriture, 2 lecture** — et ne passera `evaluee` qu'après avoir été éprouvé des deux côtés. Le relevé note que **cette contrainte est de protocole et n'est appliquée par aucun code** : sans inscription au critère de recette, rien n'empêcherait le Questionnement de passer `evaluee` sur la seule écriture. Le relevé désigne explicitement C3 comme lieu d'inscription (« à inscrire au **critère de recette** (C3) et au §12 du routeur »). Déclenchement : avant la recette du 24/08.

### 4 — Recalcul de la lettre à la bascule vers `evaluee` · §1.7 · (a), à vérifier

F2 acte que le passage de `mesuree_silencieusement` à `evaluee` **recalcule la lettre depuis les seules mesures postérieures à la recette**, les mesures antérieures restant au journal, distinguées par `instrument_version`. Le relevé porte cette règle au §3 du routeur. C3 §1.7 définit `statut_recette` et déclare « la spec construit le mécanisme » ; la règle de transition n'y figure pas.

*À vérifier : c'est peut-être délibérément une règle de routeur. Le champ `instrument_version`, lui, **existe déjà** sur `competences_mesures`, `exercices_squelettes` et `monitoring_mesures` — aucun ajout de schéma n'est nécessaire.*

### 5 — Le niveau d'une copie : mode + étendue, recette mesurée par tirage · §1.7 · (a)

Le critère de recette exige « accord à ±1 niveau ≥ 80 % » sans dire ce qu'est *le* niveau d'une copie passée plusieurs fois. À inscrire : le niveau au banc est le **mode des tirages, rendu avec son étendue** (`C (3/3)`, ou `C (2/3, l'autre tirage à B)`) ; une copie **sans mode** ne rend aucune mesure et compte comme désaccord. **Mais le critère se mesure par tirage, pas par mode**, parce qu'en production le §0 ne prévoit qu'un seul appel P1/P2 par compétence.

Mesuré sur le run Structure du 30/07 (9 copies × 3 tirages) : 88,9 % par tirage contre 77,8 % par mode à ±1, et 55,6 % d'accord exact dans les deux cas — l'instrument place à un cran près, pas au cran juste. **Source : Structure A21.** Réserve à conserver telle quelle : ces chiffres portent sur 9 copies, pas 15, et Structure n'est pas en état de recette.

### 6 — A6 requalifié en trou déclaré, avec sa condition de fermeture · §1.7, B2-15 · (c) · daté

A6 (« jalon *voir un palier Acquis produit* ») est inscrit depuis le 29/07 comme amendement **(b) en attente de décision**, et vit à l'ouverture B2-15. Structure lui donne son premier cas mesuré : **six copies sur neuf ne portent aucune charnière**, la cohésion locale étant définie sur les charnières, le §2c plafonne alors la cohésion à *satisfaite* et **ferme le palier Acquis par construction sur les deux tiers du jeu**. L'alerte `TROU_DECLARE_ACQUIS`, rangée en « cas attendu », est le régime ordinaire du corpus.

Décision de Louis du 31/07 : on n'élargit pas la définition de la charnière pour en fabriquer ; la condition de fermeture est **un lot de copies qui en portent** — le prochain lot réel si possible, un lot synthétique à défaut. A6 **change donc de régime, de (b) à (c)**, et B2-15 doit être réécrite en conséquence. **Source : Structure A22.**

### 7 — L'essai de Fragments probablement réservé aux HLP · §1.4, §4 · (b)

F27 tranche une question de fait : l'essai de Fragments se passe **en classe** — ce que C3 dit déjà au §7 (« les diagnostiques et l'essai Fragments… en classe, manuscrits, sous surveillance ») — et il sera « très probablement limité aux seuls HLP au moins cette année ». La conséquence est neuve et n'est écrite nulle part : **l'inventaire des ancres n'est pas le même selon le parcours**, un élève HLP disposant d'une source d'ancre de plus. La **cadence d'ancre du §4 (une ancre par compétence `evaluee` toutes les 6 semaines) est donc plus difficile à tenir en tronc commun**. À inscrire en régime (b) : la restriction n'est pas définitive (« au moins cette année »), mais son effet sur la cadence doit être connu. *Non listé au résumé du relevé.*

### 8 — Le dispositif mesure l'architecture telle qu'elle est écrite · §2, §1.7 · (c)

La Copie2 est écrite d'un seul tenant, sans retour à la ligne ; le découpage étant donné par les paragraphes, le squelette n'a qu'un bloc, aucune couture, et la chaîne ne rendait **aucun niveau** — un `null` silencieux au milieu d'un tableau de résultats. Corrigé le 31/07 : une copie sans couture est lue en défaillance forte et le déclare (`COPIE_SANS_COUTURE`), niveau Faible, conforme à son gold.

La réserve est le vrai amendement : **une copie saisie sans retour à la ligne est lue comme dépourvue d'architecture**, même si elle articule à l'intérieur de son bloc unique — un fait de mise en page devenu fait de mesure. Condition de fermeture : le §2 fait passer le formatif maison **au clavier** ; une interface de rédaction qui garantit ou encourage le découpage en paragraphes referme le trou. C'est **une contrainte d'interface, pas de mesure**, et elle appartient à C4. **Source : Structure A23.**

### 9 — La parenthèse « 75-90 min pour 45 min de rédaction » est fausse · §3 · (a)

Correction de fait de Louis en F1, sur le chiffre qui portait tout le constat du relecteur : « je conteste l'idée que 90 min d'exercice se traduise en seulement 45 min de rédaction. **45 min de rédaction, c'est 45 min d'exercice.** » Le relevé déclare la parenthèse « fausse et à réviser », en la localisant dans le routeur. **Elle est aussi dans C3, au §3, en toutes lettres** : « Un exercice dont la rédaction fait 45 minutes en coûte 75 à 90 en tout (préparer, écrire, se juger, lire le retour, réviser, lire le retour final). » C'est la justification écrite du dédoublement `duree_exercice_min` / `duree_redaction_min` ; le raisonnement du dédoublement survit, le chiffre non. *Non listé au résumé du relevé, qui ne retient de F1 que le compteur de minutes.*

### 10 — Durée déclarée indicative, temps réel mesuré, micro-question de dépassement · §3, §6 · (a) · daté

Solution de Louis en F9, qui remplace les deux correctifs des revues.

- **(i)** La durée déclarée par type reste celle du **régime nominal** et devient **indicative** — or C3 §3 écrit aujourd'hui que `duree_exercice_min` est « la seule que le routeur et le quota décomptent ».
- **(ii)** Le **temps réel est mesuré** par chronomètre ouverture→dépôt et journalisé ; il ne corrige pas le cycle en cours mais le suivant, le remplissage restant déterministe.
- **(iii)** Au-delà du seuil de dépassement (×2, provisoire), une **micro-question conditionnelle** : « pause, ou difficulté ? » — jamais notée, jamais renvoyée comme jugement, et **distincte du geste sur les conditions** déjà acté (`temps_mis` | `au_plus_vite` | `pas_pu`), qui porte sur l'effort.
- **(iv)** Conséquence explicite : **les champs `duree_v1_min` / `duree_vf_min` proposés par les deux revues ne sont pas nécessaires.**

*Note de vérification : `exercices_depots` porte déjà `ouvert_at`, `v1_remis_at`, `vf_remis_at`, `juger_debut_at/fin_at` et `duree_taguee` — le chronomètre est largement dérivable de l'existant ; seule la micro-question appelle un champ neuf.*

### 11 — Contenu de la matrice normative par statut de recette · §4 · (a)

C3 §4 **annonce** une « matrice normative par statut de recette : pour chaque état (`evaluee`, `mesuree_silencieusement`, `differee`), ce qui tourne et ce qui est masqué » — et son contenu n'existe pas. F6 lui donne sa première ligne : un exercice commun portant une compétence non `evaluee` **ne produit pas de verdict** ; le retour est de **registre descriptif**, il montre ce que le squelette contient et n'attribue aucun niveau. Cohérent avec « on suspend le verdict, jamais le feedback ». Le relevé désigne la matrice comme le lieu de la règle, « plutôt qu'au cas par cas ». La question de la **mesure** est déjà réglée par F2 ; c'est celle du **retour** que rien ne traitait.

### 12 — La cadence 2-1 revient en proportion 2/3–1/3 sur trois cycles · §4 · (a)

C3 §4 porte, depuis A12, ce seul état : « L'ancienne cadence 2-1 — deux semaines d'écriture, une de lecture — est **supprimée**. Le partage est désormais probabiliste et par élève. » F24 va plus loin que l'item et **rétablit la 2-1 sous forme de proportion** : « deux tiers des exercices doivent être des exercices d'écriture, un tiers des exercices de lecture, sur une rotation de 3 cycles, donc 3 semaines. » Le caractère probabiliste et par élève est intact — la proportion gouverne le partage entre familles, « niveau × fréquence » gouverne quelle compétence est servie à l'intérieur.

Motif : **toutes les règles qui élisent sont des règles d'écriture** (R1, R2, R3 ; R4 met la Connaissance hors rayon) ; sans proportion, l'écriture prenait 100 % des élections. En l'état, C3 §4 dit qu'il n'y a plus de partage réglé, ce qui est devenu faux. *Non listé au résumé du relevé.*

Conséquence à surveiller, à inscrire avec : un tiers des exercices pour cinq compétences de lecture donne un ciblage toutes les 5 à 7 semaines contre une fenêtre de montée de 6 — **les compétences de lecture seront à la limite de pouvoir monter par le seul ciblage**.

### 13 — Deux colonnes dérivées de ciblage · §4, §6 · (a)

Deux décisions du même patron. **F7** : le routeur élit sur un **signal dérivé par famille** — le ciblage écriture lit les mesures d'écriture, le ciblage lecture celles de lecture ; le champ `famille` est déjà sur chaque mesure. **F14** : **R2 élit sur une valeur non plafonnée**, calculée depuis les mêmes mesures, tandis que **la lettre affichée reste plafonnée à ancre + 2**.

Motif de F14 : l'élève solide diagnostiqué D en Structure alors que ses autres lettres sont à B voit R2 élire « la plus faible du trio » et passe le mois suivant sur la compétence où il est le meilleur, sans qu'aucun drapeau ne le voie.

**Aucune règle de lettre n'est changée, et aucune colonne physique n'est créée** — l'amendement porte sur la **règle écrite** : dire que le routeur lit une valeur dérivée et non la lettre affichée. F15 en tire une conséquence à écrire dans la même passe : la stagnation lit « lettre immobile », il faut préciser que c'est la **colonne dérivée non plafonnée**, sinon le plafond ancre + 2 fabrique de la stagnation.

### 14 — Compteur « minutes assignées / minutes de budget » · §4, §6 · (a)

Retenu en F1 comme gratuit : un compteur **par élève et par cycle**, qui dirait en novembre si la calibration du grain macro sur la fourchette hebdomadaire tient. Le relevé le place au §10 du routeur ; côté C3, il relève de `assiduite_hebdo` (par élève × semaine) ou d'une vue. Cet item **manquait au résumé jusqu'au 31/07** et fait partie des deux que l'avertissement de méthode signale.

### 15 — Ancre aveugle : unité de comparaison et journalisation · §4 · (a), à vérifier

G3 est réduit à sa moitié gratuite : **l'unité de comparaison est l'écart en crans, par compétence**, et le résultat de chaque mise en regard **se journalise**. Volontairement non fixés : le seuil qui déclencherait une action, et l'action — la première mise en regard a lieu en janvier et le jugement sur pièces vaudra mieux qu'un seuil posé d'avance. C3 §4 porte le bloc « Ancre aveugle (acté 29/07) » sans unité de comparaison, et §10 point 10 cite « la mise en regard semestrielle » comme seule parade.

*À vérifier : le relevé porte la décision au §8 du routeur ; reste à décider si C3 doit en porter l'unité, son §4 étant le lieu où l'ancre aveugle est définie.*

### 16 — Le retour de Monitoring nomme la dimension, jamais la grille · §5 · (a) · daté

G1 lève une contradiction entre deux décisions actées : le §8 du routeur pose que « le retour ne révèle jamais la grille complète des observables » (atténuation délibérée de l'effet Goodhart), et le Monitoring demande à l'élève de se calibrer sur ce même référent — un élève classé « surconfiant » n'avait aucun moyen de savoir sur quoi il se trompait, et l'asymétrie actée (« à amplitude égale, la surconfiance appelle une intervention ») faisait de cette impasse le cas qui déclenche le plus d'action.

Retenu : le retour **ne révèle aucun observable**, mais il dit **où** porte l'écart, en langage pédagogique — « tu t'es jugé plus sûr que tu ne l'étais sur la **justification** de tes liens ». Écarté : révéler les observables après la version finale, qui apprendrait les grilles à l'élève sur l'année.

**Dépendance explicite, et c'est ce qui le date : une correspondance observable → formulation pédagogique, qui rejoint les « attendus du retour » de la fiche de type — « à appliquer avant les écrans du lot C4-L3 ».** C3 §5 est le lieu de la couche contrat et de la couche compétence. *Non listé au résumé du relevé.*

### 17 — `produit_mesure` et les attributs de contrat de type · §6 `exercices_types` · (a) + (b) · daté

Quatre items convergent sur la même table.

- **F4 (a)** : une **couverture d'observables par type** à trois valeurs — « exercé » / « isolé » / « seulement observable » —, lue par N1 pour « choisir dans la même famille un type qui l'isole » ; et un **rang de richesse de sonde par compétence secondaire**, lu par la règle d'espacement pour retenir l'exercice « dont le type offre le substrat le plus riche », `competences_secondaires[]` n'exprimant aujourd'hui qu'une éligibilité binaire. Ces deux champs sont consommés par des règles actées qui, sans eux, ne s'exécutent pas.
- **F6 (a)** : `produit_mesure`, pour que la question du verdict se règle au type.
- **F12 (b)** : l'**éligibilité de parcours** n'a aucune case au contrat — un type générique a `genre = null` et rien ne dit à quel parcours il appartient ; et **`geste` et `regime_v1vf` sont déclarés indépendants alors que la table des régimes fait du second une fonction du premier** (production → plein, transformation → optionnel, diagnostic → par paires, en classe → sans objet), rien n'interdisant formellement `geste=diagnostic` avec `regime_v1vf=plein`.
- **F23 + G5 (b)** : les contraintes préalables par élève se déclarent **au type et à l'instance, à la conception**, non en couche d'exécution — le cas dur étant R1 qui impose la moitié des exercices à l'Expression pour tout élève coté D, sans distinguer une faiblesse du construct d'une dyslexie ou d'un français langue seconde.

*`regime_v1vf` étant un champ de C3 §6 (renommé par A9) et `mode_saisie_force` traitant le canal mais pas le ciblage, ces deux volets touchent C3 même si leur contenu se décide à la révision de `02-exercices.md`, où une note et une liste de contrôle sont déjà déposées.* `produit_mesure` est absent de C3 à ce jour.

### 18 — Forme de `lucidite_incompris` : un taux sur fenêtre · §6 · (a) · **daté, avant que C4-L1 crée les tables**

F8 requalifie le constat — les instruments existent, seule la table de conversion manque — puis tranche la contradiction de forme. **Retrait de `amplitude_courante` et `direction_courante` sur `lucidite_incompris`** ; elles ne restent que sur `calibration_confiance`. Motif : la direction vaut « surconfiance / sous-confiance » et n'a aucun sens appliquée à « l'élève a-t-il signalé ce qu'il n'a pas compris » — le champ serait structurellement vide, ce qu'A8 avait précisément refusé en créant des tables propres. Pas un booléen non plus, qui ne montrerait aucun progrès.

**Forme retenue : un taux sur fenêtre, à dénominateur restreint** — *parmi les exercices où le squelette montre un échec sur au moins un observable, dans combien l'élève a-t-il signalé un incompris ou marqué une hypothèse ?* Ce dénominateur montre le progrès et désamorce l'artefact de l'élève qui lisse tout : il obtient NULL, pas un mauvais score.

C3 §6 porte aujourd'hui `amplitude_ecart` + `direction` sur `monitoring_mesures` et `amplitude_courante` + `direction_courante` sur `monitoring_niveaux`, pour les deux sous-dimensions indifféremment.

### 19 — `competences_niveaux.lettre` rendue NULLABLE · §6 · (a) · daté

F19 : la passation de lecture de la semaine 1 a lieu, ses champs extraits sont conservés, et **aucun niveau n'est produit** tant que le pont E→A n'est pas validé — `lettre = NULL` sur les cinq compétences de lecture, le niveau se calculant rétroactivement sur des seuils **observés**.

S'y ajoute la règle : « une compétence sans lettre n'est ni ciblable, ni sondable, ni plafonnée, et n'entre dans aucun départage » — beaucoup de règles lisaient une lettre (R1, R2 et son départage, R3, le seuil du Questionnement, la table des proportions, le geste de la couche 3, le plafond, la descente) et aucune ne prévoyait qu'elle puisse manquer. C3 §6 déclare `competences_niveaux.lettre` sans nullabilité. Cet item **manquait au résumé jusqu'au 31/07**.

### 20 — Coût journalisé par appel et par phase · §6 · (a) · daté

F21 : chaque appel journalise sa **phase** (P1 / P2 / retour), son **modèle**, ses **tokens entrants et sortants** ; l'agrégation par élève, type et cycle se fait **en requête**. La jointure avec `routeur_decisions` est immédiate, le journal du routeur portant déjà les sondes retenues et leur motif.

Côté C3, `exercices_squelettes` porte aujourd'hui un `cout_api` par (dépôt × version × compétence) avec `modele` et `prompt_version`, ce qui ne sépare pas P1 de P2 et ne couvre pas la phase de retour. À ne pas doubler avec ce qui est déjà acté le 29/07 (plafond mensuel, alerte à 70 %, coupure automatique, plafond d'appels par dépôt) : ceux-là disent **combien** on dépense, F21 dit **où**. C'est aussi ce qui débloquera l'arbitrage n° 25.

### 21 — Date d'ouverture des dossiers N3 et re-signalement · §6 · (a), à vérifier

G4 : chaque dossier N3 porte sa **date d'ouverture** ; passé **N semaines** sans traitement, il **remonte en tête** de l'écran professeur. Pas de plafond hebdomadaire ni de file priorisée — le débit attendu (de l'ordre d'un dossier par semaine à partir de novembre, après les trois filtres actés le même jour) ne le justifie pas. Le problème : le §6 du routeur transférait la charge au professeur puis s'arrêtait, l'élève restant en régime d'entretien sans échéance.

*À vérifier : C3 §6 ne contient aucun objet « dossier N3 » — l'escalade N3 n'y est citée qu'en passant, aux §1 et §4. Le champ de date peut n'appartenir qu'au routeur ; le résumé du relevé le range pourtant parmi les amendements C3.*

### 22 — Clé `famille` sur `historique_cibles` · §6 · (a), à vérifier

F11 réécrit R5 en **contrainte de couverture** — « aucune compétence `evaluee` de la famille F ne reste plus de **K** exercices de la famille F sans être ciblée » — et ajoute une **clé `famille` sur `historique_cibles`**, qui n'était qu'une liste ordonnée des cibles primaires récentes. Sans elle, R5 est inerte dès qu'un cycle mêle écriture et lecture.

*À vérifier, et c'est le point le plus douteux de la liste : **`historique_cibles` n'apparaît nulle part dans C3** — c'est une structure du §3 du routeur. Soit l'item est un amendement du routeur seul et le résumé le classe à tort en C3, soit C3 §6 doit accueillir l'état du routeur, ce que rien n'indique aujourd'hui.*

À noter que **K a été corrigé le même jour par F24** : le K ≈ 4 global écrit en F11 était infaisable ; K doit être **≥ le nombre de compétences `evaluee` de la famille** (≈ 6 écriture, ≈ 5 lecture).

### 23 — Aucun champ de dispersion sur `competences_mesures` · §6 · (b)

Conséquence de schéma soulevée par A21 et laissée ouverte : `competences_mesures` porte une `lettre_equivalente` et **aucun champ de dispersion**. En production, le §0 ne prévoyant qu'un seul appel P1/P2 par compétence, **un tirage unique porte toute la dispersion sans la déclarer** — et l'accord exact mesuré à 55,6 % dit que cette dispersion est réelle. La note Structure est explicite : « ce n'est pas nécessairement à corriger — c'est à décider en connaissance de cause ». À inscrire en (b) pour cette raison. **Source : Structure A21.**

### 24 — Table de calcul de l'amplitude du Monitoring · §1.1, §6 · (c)

F8 volet 2 : la table de conversion vers l'amplitude 0-3 **s'écrit après collecte**. On collecte les événements bruts dès le premier exercice de septembre, comme A8 l'exige (« une année de collecte manquante ne se rattrape pas ») ; `calibration` reste NULL tant que la table n'existe pas. Même patron que pour les ancres de lecture et que pour F19 — collecter d'abord, convertir ensuite.

**Trois trous nommés qui restent à combler quand la table s'écrira** : la frontière entre amplitude 2 et 3 n'est pas dénombrable ; la source globale (« sûr / pas sûr » contre le niveau obtenu) n'a aucune correspondance vers l'échelle 0-3 ; et rien ne dit comment les deux sources se combinent. Condition de fermeture : l'existence de la collecte 2026-27. À rapprocher de B3-21, qui porte déjà les deux sous-dimensions et le nombre de crans en trou déclaré.

### 25 — Périmètre du multiplicateur X des multi-appels · B2-8 · (b)

F20 est **différé, mais cesse d'être invisible** : le §8 du routeur réserve les multi-appels « aux diagnostics » puis énumère « Trois diagnostics en classe » **et** « Les DS de classe » dans la même liste d'ancres. Les deux ordres de grandeur sont écrits : **4 620 × X** appels si X ne porte que sur les trois diagnostics annuels, **7 700 × X** s'il porte sur toute la cadence d'ancre — soit 9 240 appels d'écart à X = 3, 15 400 à X = 5. Ce sont les appels les plus chers du dispositif. La question se tranche **avec le régime de modèle**, c'est-à-dire à l'ouverture **B2-8** de C3, qui existe déjà et porte l'échéance « avant la recette ». L'amendement consiste à rattacher explicitement le périmètre de X à cette ouverture.

### 26 — Branche d'échec du pipeline de sélection · §4, §6 · (b), à vérifier

Relevé en séance sur F4 et non tranché : le pipeline de sélection n'a **aucune branche d'échec**. Rien ne dit ce qu'il advient quand aucun type ne satisfait la contrainte — et avec 2 à 4 types par compétence, le cas se présentera. La clause de repli reste disponible (« si aucun type n'isole l'observable dominant, N1 dégrade en retour mono-focal sur le type courant, et le journalise comme dégradé »).

**La correction D-11 du 31/07 en dépend** : la branche 3 de N2 exige « un type différent portant le même observable » et, si aucun autre type ne le porte, elle retombe précisément sur cette branche d'échec.

### 27 — Les deux gardiens côté lecture du seuil du Questionnement · §1.7, §4 · (b)

F7 volet 2 acte que **le seuil d'entrée du Questionnement vaut des deux côtés** — « on stabilise le corps du devoir avant la tête » décrit une progression pédagogique, pas une particularité de l'écriture. Reste à **nommer les deux gardiens côté lecture** : côté écriture ce sont Argumentation et Structure ; côté lecture, les candidates naturelles sont Restitution et Reconstruction, qui forment la coupe fondatrice du construct — non tranché. Le relevé note que le coût du report est nul, aucune compétence de lecture ne devant être `evaluee` à l'allumage, et renvoie à la séance unique « construction de la semaine + ciblage lecture », qui n'a pas de date. C3 §1.7 et §4 portent le seuil sans en nommer le domaine.

---

## Datés — à poser avant un événement précis

| n° | amendement | échéance | ce qui se perd si on la manque |
|---|---|---|---|
| 18 | Forme de `lucidite_incompris` | **avant que le lot C4-L1 crée les tables** | Seule échéance explicitement datée par le relevé. Après création, le retrait de deux colonnes et le changement de forme cessent d'être gratuits et deviennent une migration. |
| 16 | Retour de Monitoring : nommer la dimension | **avant les écrans du lot C4-L3** | La correspondance observable → formulation pédagogique doit exister avant que les écrans de retour soient dessinés ; sinon ils figent une formulation qui révèle la grille ou qui ne dit rien. |
| 3 | Banc du Questionnement sur quatre lots | **avant la recette du 24/08** | Une contrainte de protocole non écrite n'est appliquée par aucun code : le Questionnement passerait `evaluee` sur la seule écriture. |
| 6 | A6 requalifié, condition de fermeture nommée | **avant la recette du 24/08** (échéance déjà portée par B2-15) | Le critère de recette peut être satisfait sans que le palier Acquis ait jamais été observé ouvert — Structure montre que c'est le régime ordinaire, pas le cas limite. |
| 25 | Périmètre du multiplicateur X | **avec le régime de modèle**, avant la recette (B2-8) | Jusqu'à 15 400 appels d'écart sur les appels les plus chers du dispositif. |
| 27 | Gardiens côté lecture | **avant l'allumage** | Coût du report explicitement nul aujourd'hui ; il cesse de l'être dès qu'une compétence de lecture passe `evaluee`. |
| 10, 17, 19, 20 (+ 21, 22, 23 selon vérification) | tous les amendements de **schéma du §6** | **avant que C4-L1 tourne** | Échéance de fait, par le précédent d'A9 (« renommages faits avant la migration tant qu'ils sont gratuits »). Le relevé ne date que le n° 18, mais tous les changements du §6 partagent la même fenêtre. Rappel : `PROMPT_Code_C4_L1.md` et `PROMPT_Code_C4_L2.md` exigent la v4.2 et s'arrêtent déjà d'eux-mêmes ; leur réécriture est lançable, et devra l'être contre la version issue de cette passe. |

---

## Ce qui n'appelle PAS d'amendement de schéma

Le relevé pose lui-même cette distinction, et elle évite trois familles de faux amendements. Elle est reprise ici telle quelle, complétée de ce que la relecture item par item a confirmé.

**Colonnes dérivées, calculables en requête — aucune colonne physique.**

- Le **signal de routage par famille** (F7) : `famille` est déjà sur chaque mesure.
- La **valeur de ciblage non plafonnée** (F14) : calculée depuis les mêmes mesures que la lettre affichée.
- `distance_contexte` **dans la fenêtre d'évidence** (D-11) : le champ existe déjà sur chaque mesure, la fenêtre est dérivée par requête, aucun historique de types nouveau n'est nécessaire.
- L'**agrégation du coût** par élève, type et cycle (F21) : seule la journalisation par appel est un ajout.

*Réserve : les deux premiers figurent aussi dans la liste « amendements à poser » du relevé. La contradiction est apparente — ils appellent un amendement de **règle** (dire que le routeur lit une valeur dérivée et non la lettre affichée), pas un amendement de **schéma**. C'est le n° 13 ci-dessus.*

**Paramètres, qui vivent au §11 du routeur — registre faisant foi depuis A17.**

- La **proportion 2/3–1/3** (F24) et le **K de la couverture** R5 (F11, corrigé par F24).
- Le **seuil de dépassement** de la durée (×2, provisoire — F9).
- La **date de bascule** de `profil_provisoire`, devenue paramètre du professeur (F16).
- Le **plafond de sondes par cycle**, les budgets élève, le plancher de mesure, la fenêtre de montée, la cadence d'ancre, le quota bonus.

*C3 §B4 ne garde que les paramètres de la plateforme. Deux copies d'un même chiffre finissent par diverger. Attention toutefois : le n° 12 n'est pas un paramètre — c'est le fait que C3 §4 affirme aujourd'hui qu'aucun partage réglé n'existe.*

**Règles à porter au lot R1-R6, pas au schéma.**

- La **troisième branche de N2** (D-11) : delta fort, v1 plates, mais toutes les mesures récentes en `meme_type` → N2 ne conclut pas, il **crée le test**.
- L'**état initial conventionnel « non acquis »** et les **préconditions d'escalade aux deux bornes** (F15).
- Les **sondes nourrissent N1 et N2, jamais N3** (F17).
- L'**exception au départage de R2** : trio ≥ B ⇒ Questionnement > Argumentation > Structure (F18).
- Le **filtre N3 au-dessus de R2**, et **N3 ne filtre jamais R1** — le canal de l'Expression ne se lâche pas (F5).
- L'**ancienneté d'une compétence comptée sur tous les exercices**, familles confondues (F24).

**Décisions du routeur ou du référentiel seuls, vérifiées comme sans effet sur C3.**

- **F10** — la médiane de classe n'est jamais une ancre, régime propre sans ancre, cold start passation par passation, et la **fenêtre de rattrapage** absente du routeur. *Vérifié : ni « médiane » ni « rattrapage » n'apparaissent dans C3 ; ces règles vivent au §4 du routeur.*
- **F13** — le §7 du routeur consomme la **restitution à chaud** contre le squelette pour bloquer la montée. *Le champ `restitution_a_chaud` existe déjà sur `exercices_depots` et C3 §7 le porte déjà au faisceau ; la règle de blocage est du routeur.*
- **F25** — l'arrondi de Structure, renvoi croisé au chantier Structure, qui doit savoir que R2 consomme sa décision.
- **F26** — écarté, réglé par F11.
- **G2** — journaliser le nombre de compétences « fraîches » par élève et par mois (§10 du routeur) ; le plancher de sondes chez les élèves faibles est différé à cet indicateur.
- **F1**, volet calibration du grain macro sur la fourchette hebdomadaire, et **F13**, indicateur de proportion d'élèves au plafond ancre + 2 : tous deux au §10 du routeur. *Attention : le §10 de C3 est « Risques identifiés », pas la télémétrie — plusieurs renvois « au §10 » du relevé visent le routeur, pas C3.*
- **Section D du relevé** — les seize corrections mécaniques du 31/07 sont appliquées et **n'ajoutent aucun amendement de schéma**, à l'exception de D-11 devenue décision, dont la part C3 est nulle (règle) et la dépendance connue (n° 26).
- **Structure, explicitement** : la garantie par construction de l'anti-halo (A4) est **intacte** — P2 voit désormais moins, puisqu'il ne compte plus ; la formule `2N + 4` est inchangée par le passage en quatre temps ; le **nombre de tirages au banc reste à 3** (décision de Louis du 31/07).

---

## Écarts trouvés entre les trois listes

### 1. Ce que le résumé du relevé oubliait — six items, trouvés en relisant F1 à F27 et G1 à G5

L'avertissement du 31/07 disait qu'il en manquait deux (`lettre = NULL` et le compteur de minutes) ; ils ont été réparés depuis, dans le relevé comme au journal. La relecture item par item en trouve **six autres**, tous absents des dix puces de « CE QUI RESTE À FAIRE » :

- **n° 9 (F1)** — la parenthèse « 75-90 min pour 45 min de rédaction » est déclarée fausse par Louis, et **elle est dans C3 §3**, où elle justifie le dédoublement des deux champs de durée. Le résumé ne retient de F1 que le compteur de minutes.
- **n° 12 (F24)** — la cadence 2-1 **revient en proportion 2/3–1/3 sur trois cycles**, alors que C3 §4, depuis A12, affirme seulement qu'elle est supprimée. C'est l'écart le plus lourd : la spec dit aujourd'hui qu'il n'y a plus de partage réglé entre écriture et lecture, ce qui est devenu faux le jour même.
- **n° 16 (G1)** — le retour de Monitoring nomme la dimension et jamais la grille, **avec une échéance explicite : avant les écrans du lot C4-L3**. C'est le **second amendement daté** du relevé, et le résumé n'en date qu'un.
- **n° 7 (F27)** — l'essai de Fragments probablement réservé aux HLP, d'où un inventaire d'ancres inégal entre parcours et une cadence d'ancre plus difficile à tenir en tronc commun.
- **n° 2 (F22)** — la formule « 2N + 4 » rétrogradée : C3 l'énonce comme un fait au §0 et au §10.
- **n° 4 (F2)** — le recalcul de la lettre à la bascule vers `evaluee`, dont C3 §1.7 ne dit rien.

*Deux items du résumé posent en outre un problème d'objet, signalés « à vérifier » : `historique_cibles` (n° 22) n'existe nulle part dans C3 — c'est une structure du §3 du routeur ; et il n'existe aucun objet « dossier N3 » dans C3 §6 pour recevoir la date d'ouverture (n° 21). Le résumé les range en amendements C3 sans que la spec offre où les poser.*

### 2. Ce que le journal a et que le relevé n'a pas : rien

C'est le résultat le plus net du contrôle. Le récapitulatif consolidé du `CONTEXTE.md` — ouvert à la passe §5 du 30/07, complété aux passes §6, §8, §9, §11 et à la passe finale — compte douze points, et **les douze ont été appliqués** le 30/07 dans la passe unique qui a produit la v4.3. Le journal le dit lui-même : « impact C3 : amendements A9-A19 appliqués, spec en v4.3 ».

La correspondance est complète : (1) → A9 + A10, (2) → A11, (3) → A12, (4) → A13, (5) → A14, (6) → A18, (7) → A19 *(vérifié sans correction)*, (8) → B1-2 fermée par A15, B1-3 restant une ouverture et non un amendement, (9) → A7 et A8 journalisés, (10) → A15, passe §8 → A19 + B3-22, passe §9 → A9, passe §11 → A17, (11) → A16, (12) → néant.

**Les deux points nommés dans la consigne sont dans ce cas** : `duree_cycle_min` → `duree_exercice_min` et `regime_cycle` → `regime_v1vf` sont **A9, appliqué le 30/07**. Ils ne doivent pas être remis en attente. La seule contribution vivante du journal à cette liste est son entrée du 30/07 au soir, qui reproduit le résumé du relevé — donc avec les mêmes lacunes.

### 3. Ce que le relevé a et que le journal n'a pas : les quatre amendements du chantier Structure

A20 à A23 ne figuraient **ni dans le `CONTEXTE.md`, ni dans la SPEC C3** — vérifié par recherche directe, zéro occurrence dans les deux fichiers au moment de la consolidation. La note Structure prescrit pourtant une « ligne à écrire au journal », et elle ne l'avait jamais été : `CONTEXTE.md` impose qu'une session modifiant une source se termine par « impact C3 : néant » ou « impact C3 : amendement X », et les sources de Structure ont changé deux jours de suite — la chaîne, le module d'agrégation, P1, P2 — sans que cette ligne soit écrite.

Ces quatre amendements étaient donc **hors de tout circuit de traçabilité** jusqu'à cette liste *(la dette de journal a été soldée le 31/07 : quatre entrées ajoutées au `CONTEXTE.md`)*. Ils sont aussi les seuls à venir d'une mesure plutôt que d'une revue, et deux d'entre eux corrigent des affirmations que C3 tient pour vraies (la chaîne bi-phasée au §0, le niveau unique d'une copie au §1.7).

### 4. Une divergence interne au relevé, à trancher en posant la passe

Les **colonnes dérivées de ciblage** figurent à la fois dans la liste des amendements C3 à poser et dans la note « ne demandent PAS d'amendement de schéma ». Les deux sont vraies dans des registres différents : pas de colonne physique, mais une règle à écrire. La liste ci-dessus tranche en ce sens (n° 13). Le même raisonnement vaut pour l'agrégation du coût (n° 20), où seule la journalisation par appel est un ajout de schéma.

### 5. Effet net sur la version

La note Structure prévoit un passage **v4.3 → v4.4** pour A20-A23 seuls. La passe consolidée décrite ici en fait une seule série ; la règle de version de C3 impose d'incrémenter le numéro mineur une fois, quel que soit le nombre d'amendements — **v4.4**. Les deux prompts C4-L1 et C4-L2 exigent la v4.2 : ils sont déjà arrêtés d'eux-mêmes, et devront être réécrits contre la v4.4, non contre la v4.3.
