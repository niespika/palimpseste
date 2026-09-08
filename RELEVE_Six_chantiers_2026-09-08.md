# Six chantiers — relevé du 08/09/2026

Spec : PROMPT_six_chantiers.md, lu intégralement. Ordre : ①, ③, ④, ⑤, ⑥, puis proposition ② soumise à Louis.

## Décisions complémentaires de Louis

- Aucun rattrapage des anciens retours : corriger le futur.
- Pour les futurs retours aussi, la lecture par l’élève ferme le signal, même si le professeur ne l’a pas encore relu.

## État d’entrée

Après git fetch : HEAD = origin/main = 2c6f3e0, zéro commit de différence. Messages des six réparations du matin lus.
Les modifications de .gitignore, PROMPT_six_chantiers.md et les deux scripts de production préexistants restent hors des commits de cette session.

Portes remesurées le 08/09 à 13:02 UTC :

| Porte | Sandbox | Production |
|---|---|---|
| juge_mesure_actif | false | true |
| chaine_cle_actif | false | true |
| juge_documents_actif | true | true |
| gabarit_actif | true | true |

## ① — Le retour à relire

### Mesures

Production, 14:19 UTC, PostgREST en lecture seule, pagination par id unique, pages de 500 confrontées aux comptes exacts, toutes les erreurs contrôlées : **151 retours, dont 150 publiés**. La vraie fonction partagée retrouve **7 défauts de forme** : aucun point de réussite, tous sans verdict de cran enregistré. Six retours sont marqués lus ; un ne l’est pas. Zéro dépassement du plafond et zéro action de révision/pont manquant parmi les retours publiés. **Une ouverture maintenant lèverait zéro drapeau sur ces anciens retours.** Aucun dépôt, retour ou job de production modifié ni rejoué.

### Réparation

- Les règles 2 et 5 ont un seul domicile, `utils/chaine/forme-retour.ts`. Le contrôle avant publication et le lecteur du panneau l’appellent. Les ancrages éventuellement élagués ne font plus obstacle à la relecture de la forme persistée.
- Nouvelle nature `retour_a_relire`, avec phrase et motifs dans le panneau existant. Le lecteur reprend le périmètre réel de C7-L9 via `regimeJugeMesure`, pas la seule porte : sans réussite est admis uniquement avec ce régime et un verdict explicitement raté pour la version considérée.
- Le signal exige un retour publié, encore non lu, non édité par le professeur et créé depuis l’ouverture. Il disparaît à la lecture suivante du panneau quand `lu_at` est posé. Le panneau n’ajoute pas de rafraîchissement automatique entre deux visites.
- `scriptorium_params.retours_a_relire_depuis` est la configuration d’ouverture : **NULL = OFF**, une date ouvre le signal pour les nouveaux retours. Aucun état de contrôle ni marque de rattrapage n’est stocké sur les retours. La migration ne l’ouvre pas.
- Le drapeau `citation_composee` reste inchangé ; le nouveau signal ferme les règles 2 et 5.

### Preuves exécutées

Migration `attention_retours_a_relire.sql` : répétition annulée, colonne **0 → 1 → 0** ; puis application sandbox, paramètre NULL. Pas de migration en production.

Décor isolé de sandbox : nouveau dépôt et copie d’un exercice existant, deux points de travail réels de **560 et 368 caractères** repris du retour `042c3b93-af1a-4514-803f-190d58c5744d`. Leur omission de réussite est fabriquée pour l’épreuve ; leur prose ne l’est pas. Nom de l’élève de test : **3 caractères**. Aucun retour existant modifié.

Ancien assemblage du panneau (branchement retiré temporairement) : signal absent malgré le défaut. Branchement rétabli : signal présent avec son motif. Donnée du décor passée à `lu_at` non NULL : signal absent au rechargement. Donnée redevenue non lue : le vrai lecteur rend de nouveau le signal. Décor ensuite retiré et absence vérifiée ; configuration restaurée à NULL.

Captures avant, après, et après lecture aux **1280 / 768 / 375** : dossier local
`/Users/louissagnieres/.codex/visualizations/2026/09/08/01a08117-dbdc-7863-a15e-592ec291de25/chantier-1/`.

**Limite visuelle préexistante :** à 375 px en émulation mobile, la page entière s’élargit à 759 px et se réduit automatiquement, avant comme après le correctif. Les captures le montrent ; ce n’est pas un rendu mobile validé de toute la page. Consigné dans IDEES_post_rentree.md, hors périmètre.

TypeScript propre ; **2575 tests réussis**, dont 10 nouveaux tests purs du signal (72 tests ciblés avec ceux du retour). Aucun build lancé pendant le serveur de développement.

### Mise en service restant à Louis

Code non poussé, donc non déployé. Migration de production non jouée. Après déploiement et migration, l’ouverture consiste à poser l’instant courant dans `retours_a_relire_depuis` pour id 1 ; NULL ferme le signal. Cette date exclut les anciens retours, même encore non lus. Aucun SQL de rattrapage.

Les scripts de mesure et de recette sont hors dépôt, dans `/private/tmp/palimpseste-six-chantiers/`.


## ③ — Les bornes du cran 5 du gabarit

Mesure avant modification : **13 divergences sur 61 exercices dans CHAQUE base**, **0 dépôt** sur ces exercices dans chaque base. Les fonctions réelles de contexte sont importées avec un chargeur temporaire qui expose leurs noms privés sans changer leur corps ; aucun miroir de leur algorithme. Les appels de production sont limités à GET/HEAD et toute erreur HTTP est contrôlée en plus des erreurs PostgREST.

Le commentaire de `utils/chaine/contexte.ts` annonçait « les mêmes que l’écran : un seul domicile », mais ses deux appels de marquage omettaient l’observable que `utils/deroule/vue.ts` passe. Le `10-Gabarit.md` §2 bis.6, lignes 172 et 176, exige le champ à la place du gras et le passage réécrit à sa place dans le devoir réassemblé. Sur les 13 cas, l’écran ne sert plus de trou depuis la réparation du matin ; le juge, lui, réassemblait encore.

Le bloc du prompt du juge « passage qui porte le problème » utilisait en plus le diff brut : il différait du gras sur **51 des 61 exercices**. Il lit désormais le passage marqué au cran 5 du gabarit. La règle de calcul du gras ne change pas : son amendement reste au chantier ②.

Réparation bornée au cran 5 et aux cas qui portent une clé de problème du gabarit. L’observable de l’exercice descend aux deux appels de `marquerLeMateriau` ; les 13 cas sans trou n’envoient plus de réassemblage, et les 48 autres gardent leurs bornes. **Rejeu après : 0 divergence sur 61 dans chaque base.**

Vérification du périmètre supplémentaire avant correction : hors gabarit, **1 exercice / 1 dépôt en sandbox**, sans changement de marquage ; **16 exercices / 106 dépôts en production**, dont **2 exercices / 17 dépôts (10 remis)** dont le marquage changerait en passant l’observable. Ils appartiennent à l’ancienne banque et sont exclus de ce correctif ; défaut consigné à IDEES_post_rentree.md. Aucun de ces dépôts n’est rejoué ou modifié.

**Attention au protocole de cette mesure supplémentaire :** son premier calcul de trou appliquait la règle du gabarit à l’ancienne banque et donnait 11 différences artificielles. Ce compte a été rejeté ; le compte de 2 porte uniquement sur les changements de passage marqué. Il ne prétend pas qu’un trou est servi hors gabarit.

TypeScript propre, **2575 tests réussis**. Aucune migration, aucun changement de porte, aucun appel IA. Le chantier ⑤ doit encore traiter la porte du réassemblage, restée inchangée ici.

### Les passages côte à côte — avant correction

#### Sandbox : 13 divergences / 61 exercices ; 0 dépôts

| Exercice | Observable | Écran | Juge | Trou écran / réassemblage juge |
|---|---|---|---|---|
| ex-gab-transition-limite-absente-c5 | jointure_presente | importante. Le (14) | Le salaire des sportifs de haut niveau dépend surtout de leur célébrité et des revenus qu'ils rapportent. (105) | false / true |
| ex-gab-objection-accord-non-retourne-d2-c5 | jointure_presente | élèves. Une (11) | Une note indique seulement le résultat obtenu et réduit parfois un travail complexe à un chiffre. (97) | false / true |
| ex-gab-exemple-attache-absente-d2-c5 | jointure_presente | pratique. Les (13) | Les habitants d'un immeuble peuvent organiser un bac commun pour montrer que le tri fonctionne mieux quand chacun y participe volontairement au quotidien. (154) | false / true |
| ex-gab-transition-annonce-vide-d2-c5 | charniere_motivee | faire. Nous (11) | Nous allons maintenant voir la suite de notre raisonnement. (59) | false / true |
| ex-gab-paragraphe-rattachement-absent-d2-c5 | bloc_relie | nature. Beaucoup (16) | Beaucoup de ces animaux sont présentés au public dans des conditions qui permettent de mieux les connaître. (107) | false / true |
| ex-gab-plan-ordre-formule-c5 | charniere_formule | journées. Donc (14) | Donc les élèves devraient surtout préserver leur repos pendant les vacances. (76) | false / true |
| ex-gab-objection-accord-non-retourne-c5 | jointure_presente | humoristique. Une (17) | Une blague qui reprend des clichés sur une minorité peut faire rire aux dépens de ses membres et rendre ces clichés plus acceptables. (133) | false / true |
| ex-gab-transition-bilan-theme-c5 | jointure_presente | lentement. Nous (15) | Nous avons donc parlé des notes et de leur importance dans l'école. (67) | false / true |
| ex-gab-exemple-attache-absente-c5 | jointure_presente | occupation. Dans (16) | Dans la cour, ils inventent des jeux et transforment leur attente en découvertes qu'ils font seuls. (99) | false / true |
| ex-gab-exemple-attache-ainsi-d2-c5 | attache_presente | peu. Ainsi, (11) | Ainsi, sur la liaison entre Paris et Lyon, les voyageurs prendraient davantage le train au lieu de l'avion. (107) | false / true |
| ex-gab-exemple-attache-ainsi-c5 | attache_presente | information. Ainsi, (19) | Ainsi, dans certains cours, des élèves consultent leurs messages au lieu d'écouter, ce qui montre que le téléphone portable devrait être interdit au lycée. (155) | false / true |
| ex-gab-transition-limite-mal-dirigee-c5 | charniere_motivee | particulier. Cependant, (23) | Cependant, le mérite sportif ne garantit pas que les athlètes soient heureux, donc nous allons maintenant étudier le rôle des sponsors. (135) | false / true |
| ex-gab-transition-limite-declaree-c5 | charniere_motivee | résultats. Elles (16) | Elles ont pourtant des limites, et il faut donc examiner ce qu'elles apportent réellement aux élèves. (101) | false / true |
#### Production : 13 divergences / 61 exercices ; 0 dépôts

| Exercice | Observable | Écran | Juge | Trou écran / réassemblage juge |
|---|---|---|---|---|
| ex-gab-transition-limite-mal-dirigee-c5 | charniere_motivee | particulier. Cependant, (23) | Cependant, le mérite sportif ne garantit pas que les athlètes soient heureux, donc nous allons maintenant étudier le rôle des sponsors. (135) | false / true |
| ex-gab-paragraphe-rattachement-absent-d2-c5 | bloc_relie | nature. Beaucoup (16) | Beaucoup de ces animaux sont présentés au public dans des conditions qui permettent de mieux les connaître. (107) | false / true |
| ex-gab-transition-limite-declaree-c5 | charniere_motivee | résultats. Elles (16) | Elles ont pourtant des limites, et il faut donc examiner ce qu'elles apportent réellement aux élèves. (101) | false / true |
| ex-gab-objection-accord-non-retourne-c5 | jointure_presente | humoristique. Une (17) | Une blague qui reprend des clichés sur une minorité peut faire rire aux dépens de ses membres et rendre ces clichés plus acceptables. (133) | false / true |
| ex-gab-transition-limite-absente-c5 | jointure_presente | importante. Le (14) | Le salaire des sportifs de haut niveau dépend surtout de leur célébrité et des revenus qu'ils rapportent. (105) | false / true |
| ex-gab-plan-ordre-formule-c5 | charniere_formule | journées. Donc (14) | Donc les élèves devraient surtout préserver leur repos pendant les vacances. (76) | false / true |
| ex-gab-exemple-attache-absente-c5 | jointure_presente | occupation. Dans (16) | Dans la cour, ils inventent des jeux et transforment leur attente en découvertes qu'ils font seuls. (99) | false / true |
| ex-gab-transition-bilan-theme-c5 | jointure_presente | lentement. Nous (15) | Nous avons donc parlé des notes et de leur importance dans l'école. (67) | false / true |
| ex-gab-objection-accord-non-retourne-d2-c5 | jointure_presente | élèves. Une (11) | Une note indique seulement le résultat obtenu et réduit parfois un travail complexe à un chiffre. (97) | false / true |
| ex-gab-exemple-attache-ainsi-c5 | attache_presente | information. Ainsi, (19) | Ainsi, dans certains cours, des élèves consultent leurs messages au lieu d'écouter, ce qui montre que le téléphone portable devrait être interdit au lycée. (155) | false / true |
| ex-gab-exemple-attache-ainsi-d2-c5 | attache_presente | peu. Ainsi, (11) | Ainsi, sur la liaison entre Paris et Lyon, les voyageurs prendraient davantage le train au lieu de l'avion. (107) | false / true |
| ex-gab-exemple-attache-absente-d2-c5 | jointure_presente | pratique. Les (13) | Les habitants d'un immeuble peuvent organiser un bac commun pour montrer que le tri fonctionne mieux quand chacun y participe volontairement au quotidien. (154) | false / true |
| ex-gab-transition-annonce-vide-d2-c5 | charniere_motivee | faire. Nous (11) | Nous allons maintenant voir la suite de notre raisonnement. (59) | false / true |

### Traversée des chargeurs complets

Sur deux dépôts temporaires de sandbox, `chargerLeDeroule`, `lireContexte`, `entreeDuContexte` et `assemblerLeJuge` sont exécutés ensemble :

- `ex-gab-transition-bilan-theme-c5` : gras « lentement. Nous », pas de trou, pas de bloc de devoir réassemblé, passage du juge identique au gras.
- `ex-gab-argument-garant-vague-d2-c5` : trou présent, mêmes morceaux avant/après côté écran et juge, passage du juge identique au gras, bloc de devoir réassemblé présent.

Les deux dépôts ont été supprimés après l’épreuve ; leur absence a été vérifiée. Le rendu de l’écran lui-même n’est pas modifié par le chantier ③. Les différences sont celles du document donné au juge.

## ④ — Le verdict au-dessus de la VF

Production remesurée : **11 dépôts de cran 2, 106 de cran 5, 92 de cran 7**. Pour chacun de ces crans : **0** date de remise VF, **0** texte VF non nul, **0** verdict VF, **0** paire. Aucune donnée historique reprise.

Épreuve avant code sur localhost : exercice réel de cran 2 du bac à sable `0710c408-4677-4298-8815-335c80e991a7`, cloné dans un décor temporaire. V1 de **188 caractères** reprise d’une pièce du matériau ; VF de **143 caractères**, la réponse attendue de cet exercice. Verdicts de recette explicitement fabriqués : V1 fausse, VF vraie. Le retour publié est emprunté à un autre retour réel de sandbox : il sert à ouvrir l’écran final, sans prétendre être l’évaluation de cette copie. Aucun appel IA. Le scénario est contrôlé, ce n’est pas un dépôt réel d’élève.

**Avant :** `chargerLeDeroule` rend `retour_final`, `verdictParCas: [false]` ; l’écran affiche la VF et « Ta réponse n’est pas la bonne ». **Après :** la même copie affiche « Ta réponse est juste ». Captures avant/après aux trois largeurs 1280 / 768 / 375, inspectées, dans `/Users/louissagnieres/.codex/visualizations/2026/09/08/01a08117-dbdc-7863-a15e-592ec291de25/chantier-4/`. À 375, la largeur de mise en page mesurée est **404** avant comme après : débordement préexistant, consigné hors périmètre ; le verdict et la VF restent lisibles.

`verdictDeLaCopie` suit la version effectivement affichée : VF au retour final si son texte existe, V1 si l’écran se replie sur elle. Les deux cas d’une paire gardent leur version et leur recours au verdict de zone. Une VF seule sans verdict n’hérite pas d’un verdict V1. Deux tests de régression couvrent ces branches. **TypeScript propre, 2577 tests réussis.** Aucune migration, aucun changement de porte.

Après correction, le chargeur complet rend bien `verdictParCas: [true]`. Le décor a été supprimé et son absence vérifiée.

## ⑤ — Le réassemblage respecte la porte du gabarit

Gardes constatées avant correction : `utils/deroule/vue.ts:890` exige `gabarit.actif && ctx.cran === 5` pour le trou ; `utils/gabarit/lecture.ts:67` lit la porte et la ligne 68 rend le gabarit inactif si elle est fermée. `utils/chaine/contexte.ts`, fonction `avecLeReassemblage`, n’exigeait que le cran 5 et au moins un cas avec `probleme`. Son commentaire « Porte fermée […] rien » était faux.

La doctrine, `07-Implementation.md:144` (§1.1), dit « Rien de ceci ne s’allume sans son interrupteur : gabarit_actif ». `10-Gabarit.md:176` (§2 bis.6) prévoit le passage réécrit à sa place dans le devoir réassemblé. **Le côté chaîne est corrigé** : il lit désormais `lireLaPorteGabarit`, exactement comme le lecteur écran. Fermer cette porte doit supprimer le réassemblage, puisque le trou a disparu ; l’écran respecte déjà cette garde.

Production remesurée : **106 dépôts de cran 5, 0 avec un cas à problème du gabarit ; 61 exercices de cette banque**. Aucun dépôt rejoué.

Épreuve par les chargeurs réels `chargerLeDeroule`, `lireContexte`, `entreeDuContexte`, `assemblerLeJuge`, sur un dépôt temporaire de `ex-gab-argument-garant-vague-d2-c5` :

| État du code | Porte | Trou écran | Réassemblage dans le contexte | Bloc effectif dans le prompt du juge |
|---|---|---|---|---|
| Avant | ouverte | oui | oui | oui |
| Avant | fermée | non | oui | oui |
| Après | ouverte | oui | oui | oui |
| Après | fermée | non | non | non |

Le prompt réel de chaque cas est enregistré hors dépôt. Aucun appel IA : on vérifie le document assemblé qui lui serait envoyé. L’écran n’est pas modifié par ce lot. **TypeScript propre et 2577 tests réussis.** Aucun SQL.

Le dépôt de recette a été supprimé et la porte sandbox restaurée à `true`, puis les deux états ont été relus. La lecture intermédiaire de 14:48:51 UTC avait vu `false` pendant l’épreuve ; elle ne décrivait pas l’état restauré. La production n’a pas été modifiée.
