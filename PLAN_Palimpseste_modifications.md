# Palimpseste — Plan de modifications (post-tests)

Triage de la liste brute en lots cohérents et séquencés. Chaque lot décrit l'**intention** et un critère **« Fait quand »**. Le « comment » est laissé à Code (qui lit les fichiers réels) ; on rédige le prompt ciblé d'un lot au moment de l'attaquer.

---

## Principes transversaux (à appliquer partout)

- **Navigation tuile → classe → élève.** Partout (tableau de bord, modules, fragments, Scriptorium, Quazian, Codex) : on voit des tuiles de **classe**, jamais d'élève au premier niveau. Click sur une tuile → liste des élèves + détail. Composant réutilisable à construire une fois (au Lot 3) puis réemployer.
- **La classe est une entité, sélectionnée par menu déroulant.** Jamais en tapant un nom. Les classes sont créées en début d'année (fin août) ; tout rattachement (quizz, contenu, épreuve…) passe par un déroulant alimenté par ces classes.
- **Portée par (élève × classe).** Un élève peut appartenir à 2 classes (ex. HLP + Philo tronc commun) et y produit un travail **distinct** (fragments différents en HLP et en philo). Les fragments / essais / stats sont rattachés au couple élève-classe, pas à l'élève seul.
- **Accès au niveau classe.** On donne accès à un module à une **classe** ; tous ses élèves héritent du même accès. Un élève en 2 classes cumule les accès des deux.
- **Notation en lettres.** Partout où une note / évaluation s'affiche (barème, graphes d'épreuve, parcours élève) : des **lettres**, pas des chiffres.
- **Prompt IA visible en Paramètres.** Chaque module qui appelle l'IA expose, dans son onglet Paramètres, le(s) prompt(s) utilisé(s). Même motif réutilisable.

---

## Ordre d'exécution recommandé

Trois lots sont **sortis de ton ordre module-par-module et placés en tête**, parce qu'ils sont des fondations : si on ne les fait pas d'abord, une partie du reste sera à refaire.

0. Bugs & masquages triviaux *(indépendants — gains rapides)*
1. **Modèle de données « classe »** *(fondation de presque tout le côté prof)*
2. Cycle de vie d'une classe *(effacement manuel, retrait d'élève, nettoyage Scriptorium)*
3. Tableau de bord prof → 4. Modules → 5. Fragments → 6. Scriptorium → 7. Quazian → 8. Codex
9. Tableau de bord élève → 10. Fragments élève → 11. Quazian élève

---

## Lot 0 — Bugs & masquages (à faire tout de suite)

**Dépendances :** aucune (B3 possible exception, voir ci-dessous).

- **Flashcards — cloze non masqué.** Les éléments entre parenthèses à deviner doivent réellement masquer la réponse (actuellement elle est visible sur la carte). *[Quazian, élève]*
- **Flashcards — compteur de progression faux.** L'indicateur doit progresser, le nombre de cartes faites doit augmenter, le total rester fixe. Actuellement le curseur ne bouge pas, le « à faire » diminue, le « fait » reste bloqué à 1. *[Quazian, élève]*
- **Quizz invisible pour l'élève assigné.** Un élève d'une classe assignée ne voit pas le quizz lancé ; il devrait. **À diagnostiquer d'abord** : simple bug de permission / requête, ou symptôme du modèle de scoping classe (auquel cas → Lot 1). *[Quazian, élève]*
- **Masquer la tuile Scriptorium côté élève.** L'élève ne doit pas la voir pour l'instant (réactivable plus tard si tu partages du contenu type documentaires). *[Scriptorium, élève]*

**Fait quand :** une carte cloze masque sa réponse, le compteur reflète l'avancée réelle, un élève assigné voit le quizz, et la tuile Scriptorium a disparu côté élève.

---

## Lot 1 — Modèle de données « classe » (fondation)

**Dépendances :** aucune. **À faire avant tout le côté prof structurel.**

Auditer le modèle actuel, puis garantir que :
- les classes sont des entités créées en début d'année et sélectionnées par déroulant ;
- un élève peut appartenir à plusieurs classes ;
- le travail (fragments, essais, stats) est rattaché au couple **(élève × classe)** → deux flux distincts pour un élève en HLP + philo ;
- l'accès aux modules est rattaché à la **classe** ; un élève en 2 classes cumule les accès.

**Fait quand :** un élève-test placé dans 2 classes montre 2 flux de fragments indépendants ; assigner un module à une classe le donne exactement aux élèves de cette classe ; l'élève bi-classe voit l'union des accès.

---

## Lot 2 — Cycle de vie d'une classe

**Dépendances :** Lot 1 (à concevoir avec le modèle frais en tête).

- **Pas d'expiration automatique.** Une classe persiste tant que le prof ne l'efface pas. Certaines durent volontairement **plusieurs années** (ex. HLP sur 1ère + Terminale) — le prof seul décide du moment de l'effacement.
- **Effacement d'une classe** (fragments, essais, stats, etc.) : action **manuelle**, en **2 ou 3 étapes** avec confirmation. Pour des raisons de **vie privée, effacement complet et définitif** — pas d'archivage, disparition totale.
- **Rappels** au **30 juin** et au **30 août**, déclenchés **uniquement si la classe n'a pas encore été effacée**. Dismissibles par classe (« cette classe continue ») pour ne pas harceler une cohorte de 2 ans. Si le prof a effacé plus tôt (ex. 1er juin), aucun rappel.
- **Retrait d'un élève** d'une classe (départ de l'école).
- **Couplage critique — Scriptorium :** effacer une classe doit aussi **vider la valeur « classe »** sur les docs / unités / semaines de Scriptorium, sinon une classe homonyme l'année suivante hérite trop tôt de ressources.

**Fait quand :** une classe ne disparaît jamais toute seule ; l'effacement manuel (après 2-3 confirmations) supprime définitivement son travail ET libère les ressources Scriptorium rattachées ; on peut retirer un élève seul ; les rappels ne se déclenchent que pour les classes non effacées et restent dismissibles.

---

## Lot 3 — Tableau de bord prof

**Dépendances :** Lots 1 et 2 (les actions de cycle de vie y sont câblées). **Construit le composant tuile-classe réutilisable.**

- Rappels de choses à faire (validations en attente, contenu à uploader).
- Santé de la cohorte : proportion d'élèves qui travaillent bien (fiches faites, fragments rendus) ; signaler les élèves en difficulté (mauvaises notes, fragments manquants).
- Tuiles de classe cliquables → liste des élèves + où en est chacun.
- Câbler ici les actions du Lot 2 (effacement de classe, retrait d'élève).

**Fait quand :** le tableau de bord montre d'un coup d'œil ce qui t'attend, le taux d'élèves en règle, les élèves à risque, et donne accès par tuile au détail de chaque classe.

---

## Lot 4 — Modules (gestion des accès)

**Dépendances :** Lot 1.

- Affichage en **tuiles** (pas en liste). Chaque tuile : nom du module, actif / fermé. **Ne pas** lister les élèves.
- Click → **classes** ayant accès (accès au niveau classe).
- Gérer les élèves bi-classes (cumul des accès).

**Fait quand :** les modules s'affichent en tuiles ; cliquer montre les classes ayant accès ; donner / retirer un accès se fait par classe.

---

## Lot 5 — Fragments

**Dépendances :** Lot 1 (couple élève × classe) + modèle semestre ci-dessous.

- **5.0 — Fonctionnement par semestre.** Les fragments s'organisent par semestre ; l'élève change de thème / questions à la fin d'un semestre. *(À faire en premier dans ce lot : touche plusieurs onglets.)*
- **5.1 — Onglet « semaine » (fusion).** Fusionner « vue par semaine » et « semaine » (redondants) en un seul onglet. Bouton **« nouvelle semaine »**. Click sur une semaine → tuiles de classe avec les compteurs (déposés, retard, manquant, à valider, publié) → click → détail par élève. **« Choisir l'orateur »** n'apparaît qu'à l'intérieur d'une classe ; le prof **fixe d'abord le nombre d'orateurs** de la semaine, puis désigne ce nombre d'élèves.
- **5.2 — Onglet « vue d'ensemble ».** Tuiles de classe avec **moyennes par section** → click → liste élèves avec moyenne par section + taux de dépôt. *(Proche de l'existant — à affiner au motif tuile.)*
- **5.3 — Onglet « thèmes ».** Tuiles de classe, liste d'élèves déroulante avec leurs thèmes. **Supprimer** la distinction thème / question d'essai.
- **5.4 — Onglet « épreuve ».** Assigner une épreuve à une ou plusieurs classes, choisir les dates (même épreuve, dates différentes si plusieurs classes). Tuiles de classe → liste des épreuves (nom, date, ouverte / fermée). Click → détail (existant) + « fermer le dépôt » (existant) + **graphes** : répartition des lettres et répartition des notes. *Le reste de l'onglet est bon.*
- **5.5 — Onglet « semestre ».** **DIFFÉRÉ** (tests en cours de ton côté).
- **5.6 — Onglet « paramètre ».** Tuiles (ou déroulant), pas le détail en permanence. Tuiles : **Barème** (chiffres → lettres), Prompt Évaluation Fragment, Prompt Évaluation Oral, Prompt Essai, Prompt Synthèse.

**Fait quand :** la navigation fragments est cohérente (semestre → semaine → classe → élève), les graphes d'épreuve s'affichent en lettres, et les paramètres exposent barème + prompts sans tout dérouler.

---

## Lot 6 — Scriptorium

**Dépendances :** Lot 1. *(Le nettoyage des références à l'effacement est déjà au Lot 2.)*

- **Landing :** bouton **« Ajouter du contenu »** avec 3 champs : unité / semaine, Nom, Classe (multi-assignation). En dessous : 2 tuiles (classes, unités). 2 onglets : classes, unités.
- **Onglet « classes » :** arborescence unités → semaines pour chaque classe.
- **Onglet « unités » :** arborescence des classes pour chaque unité.

**Fait quand :** on ajoute un contenu en 3 champs, et on retrouve l'arborescence vue côté classe comme côté unité.

---

## Lot 7 — Quazian (côté prof)

**Dépendances :** Lot 1 + **Scriptorium (Lot 6)** car les cartes se génèrent à partir de son contenu.

- **7.1 — Onglet « flashcard ».** Tuile **unité** : afficher les semaines associées + s'il existe des cartes (combien ; sinon « à générer »). Tuile cliquable → générer les cartes **pour cette semaine-là uniquement**, depuis Scriptorium. *Le reste de l'écran reste identique.*
- **7.2 — Onglet « diagnostique ».** Ajouter un diagnostique **flashcards** (pas seulement quizz). Tuile **quizz** (diag. vers les quizz) + tuile **classe** → classes avec déroulant d'élèves pour voir s'ils révisent leurs cartes et le temps passé.
- **7.3 — Onglet « quizz ».** Garder « créer un nouveau quizz » mais **nombre de questions flexible**. Sous le bouton : tuiles de classe (nom + nombre de quizz faits). Classe attribuée par **déroulant** (classes créées fin août), pas en tapant un nom.
- **7.4 — Onglet « paramètres ».** Ajouter la section affichant le prompt de génération des flashcards et celui de génération des quizz.

**Fait quand :** on génère des cartes par semaine depuis Scriptorium, on voit qui révise (cartes + quizz), on crée un quizz à nombre de questions libre rattaché par déroulant, et les deux prompts sont visibles.

---

## Lot 8 — Codex (ex-Synthèse)

**Dépendances :** Lot 1.

- Ajouter un onglet **Paramètres** : prompt du retour IA en **V1** et en **V-Finale**.
- Donner au prof **accès aux retours IA de la V1**.
- Navigation par classes : tuile classe → nombre de séances de synthèse → page classe avec liste des synthèses → click sur une séance → noms des élèves + infos (nom, v1, vf, validation — existant) avec **v1 et vf cliquables** pour voir les retours.
- **Onglet « validation » :** penche vers **suppression** (redondant avec la VF du déroulant par élève) — à confirmer après tes tests Codex.

**Fait quand :** le prof navigue Codex par classe et séance, ouvre les retours IA de V1 et VF, et voit les deux prompts en Paramètres.

---

## Lot 9 — Tableau de bord élève (nouveau)

**Dépendances :** Lot 1.

- Synthèse de ce que l'élève doit faire : fragments (avec les **pistes** à suivre, nombre de flashcards à réviser).
- Rappel des **points forts**, de là où il s'est **amélioré**, et des **points à travailler**.

**Fait quand :** en arrivant, l'élève voit ses tâches du moment et un retour synthétique sur sa progression.

---

## Lot 10 — Fragments élève (page surchargée → restructurée)

**Dépendances :** Lots 1 et 5.

- **Haut de page :** évolution graphique des évaluations semaine après semaine (= « ton parcours » actuel) + tuiles taux de dépôt, meilleures sections, à travailler.
- **Rappel des pistes** en haut (≈ 3 pistes).
- **3 tuiles côte à côte** cliquables : Fragments écrits / Fragment oral / Essai. Code couleur : **verte** = à jour, **rouge** = travail à faire, **neutre** = rien de neuf.
- **Sous les tuiles :** retour complet du dernier fragment. L'élève doit **valider qu'il l'a lu** ; il ne peut pas déposer un nouveau fragment tant qu'il ne l'a pas validé.
- Tuile **« fragment écrit »** → liste des fragments + retours ; section de dépôt d'un nouveau fragment **en haut** de cette page.
- Tuile **« fragment oral »** → retour de l'oral.
- Tuile **« essai »** → **dépôt de l'essai** (tant qu'aucun essai n'est encore soumis) **et** retour de l'essai.
- **Un seul essai :** une fois un essai soumis, plus de nouvelle soumission ; la tuile n'affiche alors que le retour.
- **Photo — anti-triche (2 couches) :** (1) attribut `capture` pour orienter vers la caméra (hint, non bloquant) ; (2) à l'upload, lire l'**horodatage EXIF** de la photo (DateTimeOriginal) et le comparer à l'**horloge de l'appareil** : un écart important = photo ancienne tirée de la galerie → à signaler. *Limites à garder en tête : `capture` ne bloque pas la galerie et est ignoré sur desktop ; l'EXIF peut être absent (captures d'écran, images « nettoyées » par un partage) ou contournable par un utilisateur averti ; et ce contrôle attrape la photo recyclée, pas une photo d'antisèche prise à l'instant.*

**Fait quand :** la page est hiérarchisée (parcours + pistes en haut, 3 tuiles d'état, retour à valider), le dépôt est bloqué tant que le dernier retour n'est pas lu, un seul essai est possible, et la contrainte photo est posée (selon ce qui est faisable).

---

## Lot 11 — Quazian élève (hors bugs, déjà au Lot 0)

**Dépendances :** Lot 1.

- **Deux modes distincts** : un mode **« consultation »** (parcourir toutes les cartes avec leurs réponses, sans impact sur la révision) et un mode **« travail / révision »** (la session de répétition espacée — c'est elle qui porte les correctifs du Lot 0).
- En consultation, l'élève sait **combien** de cartes ont été ajoutées (quand le prof en ajoute) et **lesquelles**.

**Fait quand :** l'élève bascule entre consulter l'intégralité de ses cartes et les réviser ; les ajouts récents sont repérables en mode consultation.

---

## Points encore ouverts

- **Quizz invisible (Lot 0)** — *tranché : on le corrige*, mais on **diagnostique d'abord** (bug de permission / requête vs symptôme du modèle de classe ; si modèle → Lot 1).
- **Onglet « validation » de Codex (Lot 8)** — penche vers la **suppression** (il ne fait que renvoyer à la VF du déroulant par élève), **à confirmer après tes tests Codex**.
- **Onglet « semestre » de Fragments (Lot 5.5)** — différé tant que tes tests ne sont pas finis.

*Tranchés et intégrés au plan : effacement de classe (hard delete, 2-3 étapes, manuel, pas d'expiration auto → Lot 2) ; anti-triche photo (hint `capture` + comparaison EXIF → Lot 10).*

---

## Suite

On attaque lot par lot. Pour chaque lot, je rédige un prompt ciblé pour Code (intention + critères d'acceptation, en laissant Code lire les fichiers). Départ suggéré : **Lot 0** (gains rapides) puis **Lot 1** (la fondation qui conditionne le reste).
