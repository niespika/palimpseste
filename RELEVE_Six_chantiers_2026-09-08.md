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

## ⑥ — Mesure faite, arrêt avant création du décor et modification du harnais

**0 exercice cran 2 · plan en sandbox ; 1 en production.** La prémisse du prompt est plus étroite que le problème réel : le seul exercice de production (`1b94f00a-352a-4499-85c9-c9a6b562ad3d`) porte `pieces: null`, `constituant: null`, `probleme: null`. Il appartient à l’ancienne banque et ne déclenche donc pas `PlanAOrdonner`. Aucun exercice de production modifié.

Le format `08-FORMAT_IMPORT.md:203` exige au cran 2 une clé de problème « pièce absente », dont se dérive l’observable ; la ligne 204 définit l’exception du plan pour les pièces (trois thèses dans le désordre, aucun texte nul), mais ne désigne pas sa clé. La base sandbox porte **13 clés du plan**, dont **aucune `plan.ordre.absent`**. La tentative de préparation a été arrêtée par une assertion AVANT toute création d’exercice ou de dépôt ; aucun décor ⑥ n’a été créé.

**Précision après lecture de la doctrine :** il existe bien une clé classée dans le mode « absent », `plan.ordre.liste` (`09-` §7, ligne 868), qui décrit l’absence de « mais » et de « donc ». `plan.ordre.inverse` (ligne 864) décrit les parties dans le mauvais sens. Il serait donc faux d’affirmer que le plan n’a aucune clé d’absence : ce qui n’est pas tranché est la clé du cran 2 « l’ordre, écrit », qui demande à la fois de déplacer les thèses et de les lier. Le script antérieur `scripts/recette/smoke-cran2.mjs:90` laisse `probleme: null`, en contradiction avec l’exigence du format.

**Question pour Louis : quelle clé de problème rattacher au décor de cran 2 · plan ?** Utiliser une clé existante, en créer une, ou dispenser ce décor de clé engagerait la mesure faite pendant le parcours complet ; aucune de ces décisions n’a été prise ici. Arrêt conformément à la consigne de session « en cas de doute ou de décision non tranchée […] note la question et arrête-toi ».

Le harnais n’a pas encore été modifié ni exécuté sur ce décor. **Le chantier ② n’a pas été entamé**, pour conserver l’ordre imposé ; aucune règle de gras ni doctrine de marquage modifiée. Les quatre correctifs ①, ③, ④, ⑤ sont dans des commits locaux ; aucun push ni déploiement.

### ⑥ — Reprise après décision de Louis

Louis approuve le rattachement du **seul décor neuf** à `plan.ordre.inverse` : l’ordre du raisonnement est visé, les liaisons rendent cet ordre compréhensible. Décision consignée dans `CONTEXTE.md` du dépôt de conception, sans commit de ce dépôt et sans changement de la règle générale d’import.

Décor sandbox créé : trois phrases copiées d’un matériau réel du plan (`de001ed4-7ab5-4ef8-a5e9-caad74394f1e`), longueurs **139 / 167 / 141 caractères** dans l’ordre proposé à l’écran ; aucune pièce nulle, constituant « l’ordre, écrit ». La dernière thèse est posée en premier. Le plan attendu est assemblé par la vraie fonction `composerLePlan`, **459 caractères**. Cible professeur Structure, celle que porte la clé approuvée. Ce sont des données de recette composées à partir de la banque, pas la copie d’un élève réel.

**Échec avant correction :** le harnais inchangé capture l’écran aux trois tailles, voit les flèches mais aucun champ de rédaction, puis s’arrête sur « rien à faire ». **Correction :** reconnaissance du composant par `data-plan`, déplacement vérifié des cartes, saisie et relecture des deux champs de liaison ; cette saisie est aussi reconnue en VF. Le harnais ne prétend pas résoudre n’importe quel plan : il effectue un ordre de recette déterministe, puis reformule les deux liaisons lors de la VF.

Première tentative après correction interrompue par un délai réseau dépassé lors de la création du lien de connexion, avant interaction avec l’exercice ; relancée sur le même décor. Les captures de saisie après correction aux trois tailles ont été inspectées. Aucun code d’écran modifié.

### Vérification de la fin du parcours, et limites observées

V1 déplacée et enregistrée, confiance et conditions déclarées, remise V1, retour réel parcouru et marqué lu, VF écrite dans les champs du plan puis rendue. **V1 : 459 caractères, ordre [1,2,0], liaisons Mais / Donc. VF : 464 caractères, même ordre, liaisons Pourtant / Ainsi.** Les vraies fonctions `lireLePlan` et `composerLePlan` relisent les deux textes et vérifient ces valeurs exactement.

La recette a exposé une seconde erreur du harnais : « Ce que tu as écrit », titre de la copie V1 encore visible pendant l’envoi VF, suffisait à déclarer un retour final. Une capture appelée à tort « retour-final-point-1 » montrait en fait **Envoi…**, sans retour final en base. Cette capture est conservée comme preuve d’échec et ne compte pas comme validation.

La garde du harnais exige désormais que **Retour final soit l’étape active**. Elle attend sa publication, signale explicitement un rechargement si nécessaire, puis exige sa présence réelle à l’écran. Une recette reprise avec `vf_remis_at` ne renvoie pas la VF. L’absence de retour final à l’échéance produit une erreur, plus un succès apparent.

Sur ce décor, Chrome avait été fermé trop tôt par l’ancienne garde ; le job VF était encore en attente, **zéro tentative**. Le vrai `traiterLaMesureEnFile`, limité à ce seul dépôt neuf, l’a achevé. Les jobs V1/VF ont abouti en **une tentative chacun**, respectivement **6 appels / 54 s** et **4 appels / 42 s**. Le juge a accepté V1 et refusé VF : le but de cette recette est de vérifier le parcours et la persistance des gestes, pas de forcer la réussite pédagogique d’une liaison choisie par le harnais. Aucun prompt du juge modifié.

Le parcours a donc nécessité une reprise du traitement VF et un rechargement ; il ne faut pas le présenter comme un parcours automatique sans intervention. Le défaut de rafraîchissement de l’écran de révision est consigné à `IDEES_post_rentree.md`, hors du correctif du harnais. Les difficultés de connexion et les répétitions de l’étape confiance ont été enregistrées dans le journal hors dépôt ; la confiance a bien été écrite.

Le dernier passage du harnais a atteint **le vrai retour final**, parcouru ses deux points et sa page de fin, avec captures inspectées à **1280 / 768 / 375**. Les 87 captures du parcours et des échecs sont conservées dans `/Users/louissagnieres/.codex/visualizations/2026/09/08/01a08117-dbdc-7863-a15e-592ec291de25/chantier-6/` ; les preuves finales valides portent le préfixe **plan-final**, les captures intermédiaires le préfixe plan-apres. Le décor a été supprimé et son absence vérifiée. **2577 tests réussis, TypeScript propre et syntaxe du harnais vérifiée.** Aucun changement de porte ni écriture en production.

## ② — Règle validée et appliquée : neuf phrases, quatre joints

Louis valide explicitement la proposition détaillée (`PROPOSITION_Chantier_2_Gras.md`) : **9 phrases entières, 4 joints conservés**, retour du texte à trou pour les neuf, même gras pour l’élève, l’aperçu professeur et le juge. L’amendement est écrit dans `palimpseste-conception/02-exercices.md` §5 et sa décision dans `CONTEXTE.md` ; aucun commit dans ce dépôt de conception.

### Mesure et échec avant correction

Remesure paginée et comptée le 08/09 à **20:57 UTC** : **61 exercices dans chaque base, 13 écarts, 0 dépôt concerné**. Les familles restent réparties en 6 / 3 / 2 / 1 / 1 comme dans les tableaux de la proposition. Quatre corrections ne font qu’ajouter une liaison, à la majuscule initiale près ; neuf réécrivent le contenu, parfois seulement une partie.

Deux nouveaux dépôts de recette, sur des exercices réels inchangés du bac à sable : matériau de **447 caractères** pour `ex-gab-transition-bilan-theme-c5`, de **688** pour `ex-gab-objection-accord-non-retourne-c5`. Captures AVANT : le premier affiche **« lentement. Nous » (15)** et un champ libre ; le second **« humoristique. Une » (17)**, lui aussi avec champ libre. L’aperçu professeur montre alors les phrases complètes dans les deux cas : cette divergence est également capturée. Trois tests ciblés reproduisent le défaut et échouent avant le correctif ; les sept autres gardent les comportements à conserver.

### Correction et preuve exécutée

`marquerLeMateriau` garde son unique algorithme. L’exception approuvée est activée uniquement au **cran 5 du gabarit actif** : si le reste du matériau est conservé et que la seule substitution accompagne l’ajout d’une liaison devant le premier mot devenu minuscule, la couture reste marquée. Toute réécriture du contenu retrouve les bornes de phrase. Aucun seuil de longueur, liste d’exercices ou contenu corrigé servi au client. La citation de consigne, `mot_impropre` et les insertions pures gardent leur priorité.

Écran et contexte du juge passent cette activation avec le même observable. La porte est lue une fois dans le contexte, puis utilisée pour le passage marqué et le réassemblage. L’aperçu professeur lit le gabarit par le lecteur existant de l’écran et transmet son marquage et l’observable pour ce seul périmètre.

Rejeu des **vraies fonctions** sur le corpus des deux bases, à **21:10–21:11 UTC**, production en lecture seule PostgREST :

| Résultat par base | Sandbox | Production |
|---|---:|---:|
| Exercices contrôlés | 61 | 61 |
| Passages étendus à la phrase, trous rétablis | 9 | 9 |
| Joints conservés parmi les 13 | 4 | 4 |
| Autres passages inchangés | 48 | 48 |
| Divergences écran / aperçu / passage du juge / réassemblage | 0 | 0 |

Les fonctions privées du contexte sont seulement exposées par un chargeur temporaire, jamais recopiées. Le lecteur de doctrine, le lecteur de gabarit, le composeur d’aperçu et le calcul des pièces sont les fonctions du dépôt. Chaque réassemblage est comparé aux pièces de l’écran. Sans l’activation nouvelle, le calcul conserve les **61 anciens passages**.

Épreuve complémentaire sur les **vrais chargeurs complets** `chargerLeDeroule`, `lireContexte`, puis `entreeDuContexte` et `assemblerLeJuge`, pour les deux dépôts : porte ouverte, **la phrase de 67 caractères** remplace le gras de 15 et apparaît dans le prompt du juge, avec réassemblage à la même place ; le joint de 17 reste sans trou. Porte fermée réellement dans le bac à sable : retour aux anciens passages, **aucun trou et aucun devoir réassemblé** dans les deux cas. Porte restaurée à `true` puis relue. Aucun appel au modèle ni remise de copie : le contrôle porte sur le document effectivement assemblé pour le juge.

**36 captures avant/après, aux largeurs 1280 / 768 / 375**, sur les deux exercices : lecture, écriture et aperçu professeur. Les rendus corrigés ont été inspectés aux trois tailles ; la phrase tient dans le matériau et le trou occupe exactement sa place. Largeur du document égale à celle de la fenêtre sur ces captures. Conservation : `/Users/louissagnieres/.codex/visualizations/2026/09/08/01a08117-dbdc-7863-a15e-592ec291de25/chantier-2/`.

**2590 tests passent**, TypeScript propre, différence sans erreur d’espacement. Les deux dépôts temporaires ont été supprimés et leur absence vérifiée ; zéro job créé. Les exercices, leurs matériaux, les anciens dépôts et verdicts sont inchangés. Les portes de production restent telles que relues : les quatre ouvertes ; bac à sable : gabarit et documents ouverts, mesure et clé fermés.

### Limites et livraison

Le gras de l’aperçu est aligné dans le périmètre approuvé ; sa consigne composée du gabarit reste absente sur les deux exemples observés, défaut antérieur consigné à `IDEES_post_rentree.md`. Aucun élargissement à la refonte de cet aperçu ni aux autres crans. L’accord et les tableaux de comparaison restent conservés dans la proposition. Aucun SQL pour ce chantier.

Les quatre premiers correctifs ont été poussés sur demande de Louis. Les chantiers **⑥ et ② restent en commits locaux**, sans nouveau déploiement. Le signal du chantier ① reste à activer pour les futurs retours : migration production et choix de sa date de départ sont le geste de Louis.

## Suite de ① — Commande professeur et activation demandées par Louis

Après publication des deux derniers commits (`e73f561`, statut Vercel réussi), Louis demande expressément de **créer et activer** la porte en production et d’ajouter une commande dans une page, dont il délègue l’emplacement. Cet accord remplace, pour cette seule opération, la réserve précédente « geste de Louis ». Décision consignée dans le `CONTEXTE.md` de conception, sans commit de ce dépôt.

**Production : effectué.** Migration `attention_retours_a_relire.sql` appliquée avec arrêt sur erreur et délai de verrou borné ; ajout de la colonne à NULL constaté. Journal `SUIVI_SQL.md` renseigné. Puis activation par le même `basculerLesRetoursARelire` que la commande professeur : **2026-09-08T21:41:24.928Z**, soit **17 h 41, heure de Montréal**. Seul `retours_a_relire_depuis` est écrit. Les quatre autres portes sont relues et inchangées ; **151 retours créés avant cette date sont exclus, zéro retour nouveau** au contrôle. Aucune donnée élève ni retour réécrit. Le vrai lecteur du panneau, exécuté en production en lecture seule sur les **65 profils de rôle élève**, rend **zéro signal et zéro incident** après activation (21:43 UTC).

**Commande ajoutée localement : Scriptorium → Paramètres → Retours à relire**, après les portes du gabarit et du juge. État, date d’ouverture en heure de Montréal, explication du périmètre et bouton Activer / Désactiver. Une colonne absente rend le bouton indisponible ; erreur d’écriture affichée sans annoncer de succès. L’action vérifie l’authentification et le rôle professeur, valide les champs et ne reçoit aucune date d’activation choisie dans le navigateur.

Épreuve réelle en sandbox du même écrivain : activation depuis NULL ; deux activations concurrentes conservent la date ; une ancienne page ne peut pas fermer une ouverture différente ; désactivation ; nouvelle activation avec une date ultérieure. Paramètre restauré à NULL et autres portes inchangées, vérifiés par relecture. **2590 tests passent, TypeScript propre.** Aucun nouveau fichier de migration nécessaire pour cette commande.

**Vérification visuelle terminée après déverrouillage par Louis.** Les états désactivé et activé ont été capturés et inspectés dans le navigateur aux largeurs **1280 / 768 / 375 px**. Le bloc mesure 343 px sur téléphone et reste dans les marges (16 à 359 px) ; le bouton passe sous le texte. Le document mesure 1280 et 768 px sur les deux grandes tailles. Sur téléphone, un ancien élément `code` hors du bloc porte le document à 377 px : découverte consignée dans `IDEES_post_rentree.md`, sans modification hors périmètre. Captures visibles dans la conversation.

Exercice par le vrai bouton dans la page professeur du bac à sable : activation à **17 h 51**, date et état conservés après rechargement, puis désactivation. Relecture directe à **21:54 UTC** : porte du bac à sable revenue à NULL, quatre autres portes inchangées ; date de production toujours **2026-09-08T21:41:24.928Z**. Commande vérifiée et prête à publier via GitHub Desktop.
