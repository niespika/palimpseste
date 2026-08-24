# PROMPT — Session Code : C4-L14 — La correction d'un cran à candidats, et le champ qui la rend possible

> **À coller dans une session Claude Code fraîche.** Une session, un lot.
>
> Ce prompt est fabriqué selon la recette du `PLAN_DE_CHANTIER.md` §5. Ce que le lot construit, son manifeste et son « fait quand » font foi au `07-Implementation.md` §2 — ils sont recopiés ci-dessous avec leurs versions au moment de l'écriture.
>
> ⭐ **Le lot tient en quatre gestes, et le troisième est celui pour lequel les deux premiers existent.** Le port de l'import, la colonne, **la correction servie**, et le sixième état de la paire. *Ne commence pas par l'écran : sans le champ, il n'aurait rien à montrer.*

---

## Le manifeste — recopié du `07-Implementation.md` §2

> *Manifeste* : **ce document, §1.1 et §2** · `08-FORMAT_IMPORT.md` **v1.3, format 1.2** — VALIDÉ ET GELÉ · `02-exercices.md` §2.3.1 a, §2.3.4 et §5 · `06-Palimpseste.md` §2.

« Ce document » est le `07-Implementation.md`. Les quatre pièces :

| Pièce | Où | Statut requis | Au moment de l'écriture |
|---|---|---|---|
| `07-Implementation.md`, **§1.1 et §2** | `/Users/louissagnieres/Documents/GitTest/palimpseste-conception/` | **aucun** — *« un lot n'exige pas un statut de la source qui le déclare »* *(`07-` §2)* | **VERSION 2.43** · RELU ET VALIDÉ · ⚠️ **régimes mêlés** : le **§1.1 est OUVERT À L'IMPLÉMENTATION** ; au **§2**, la **règle de manifeste est GELÉE** et l'**inventaire des lots est OUVERT** *(en-tête du document)* |
| `08-FORMAT_IMPORT.md` — **le document entier** | même dépôt | **relu et validé** *(explicite au manifeste : « VALIDÉ ET GELÉ »)* | **VERSION 1.3** · format **1.2** · VALIDÉ ET GELÉ |
| `02-exercices.md`, **§2.3.1 a, §2.3.4 et §5** | même dépôt | **déposé** *(entrée sans statut explicite — `07-` §2)* | **VERSION 5.4** · VALIDÉ ET GELÉ |
| `06-Palimpseste.md`, **§2** | même dépôt | **déposé** *(entrée sans statut explicite)* | **VERSION 2.6** · VALIDÉ ET GELÉ |

⚠️ **Le manifeste ne borne PAS le `08-` à quelques sections, et ce prompt ne le bornera pas non plus.** Il te donne le document entier. *Un prompt plus strict que sa source perd des données en silence.* Ce qui suit dit seulement **où lire d'abord**, jamais où s'arrêter.

**Ce que chaque pièce fait ici.**

- Le **`07-` §1.1** déclare l'**appui, par cas** : *« le `defaut`, les `distracteurs`, la `reponse_attendue`, le `guide` »*, et il ajoute deux choses qui te concernent directement — *« le format d'import en donne les champs et leurs conditions de cran (`08-FORMAT_IMPORT.md` §5.2) ; **la forme physique en base t'appartient** »*, et *« la banque de distracteurs d'un cran guidé est la saisie même de la crédence […] sans elle, la porte 2 n'a pas d'écran »*. Il pose aussi qu'**une paire est UNE ligne à deux cas, un seul dépôt, deux crédences, une mesure**.
- Le **`07-` §2** porte **ta mission, ton « fait quand » et ton échéance** — recopiés en pièces 3 et 5 ci-dessous —, et la **règle de manifeste** elle-même.
- Le **`08-`** est **le format que tu portes**. Lis d'abord le **§1** *(la forme du fichier, le majeur qui refuse et le mineur que personne ne lit, le refus n° 2 des clés inconnues, ce que la 1.2 ajoute)*, le **§5.2** *(la table des champs du `cas`, la forme d'un distracteur, la règle en une ligne sur le pourquoi)*, le **§5.3** *(un exemple complet)* et le **§7** *(les dix-huit refus, les trois blocages, les neuf signalements, et le contrôle machine)*.
- Le **`02-` §2.3.1 a** exige que **la correction du premier cas soit servie avant le second** — c'est la clause qui rend l'écart des deux crédences interprétable. Le **§2.3.4** donne la table de l'appui par cran et **qui juge** : c'est là qu'est écrit *« le candidat le plus chargé **est** la réponse, la distribution **est** la crédence »*. Le **§5** dit ce que l'écran sert — **quatre candidats**, cent jetons, le plancher de trois distracteurs.
- Le **`06-` §2** donne les six temps du déroulé à la maison, et son **temps 4** : *« RETOUR. Engendré depuis le squelette par le modèle chaud »* — c'est lui qui prouve qu'aux crans au jugement algorithmique **rien ne vient derrière**.

**Rien de plus : la règle de manifeste veut que ce qui n'y figure pas ne se lise pas** *(`07-` §2)*. Quatre précisions pour que la règle ne fasse pas trébucher :

- l'`AGENTS.md` du dépôt n'est pas une source : Claude Code le charge d'office, il porte les conventions du repo — **dont la règle SQL absolue** ;
- ⛔ **`SPEC_C3_exercices_competences.md` est ARCHIVÉE : elle ne fait foi sur rien, et elle ne se cite jamais.** Elle traîne à la racine du dépôt `palimpseste` et son nom ressemble à ton sujet — **ne l'ouvre pas**. Il en va de même de `FUSION_revues_C3.md`, de `revue_adversariale_SPEC_C3.md`, de `AMENDEMENTS_C3_en_attente_2026-07-31.md` et de `SPEC_import_pdf_scriptorium.md`, qui ont l'air de porter le format d'import et ne le portent pas ;
- ⛔ **aucun relevé de lot ne se lit** — ni `RELEVE_C4_L3_2026-08-22.md`, ni ceux de C4-L8 ou de C4-L11. La règle de manifeste l'interdit, et ce n'est pas une privation : **ce que ces lots avaient à te dire est dans les pièges ci-dessous**, versé par la boîte aux lettres du `PLAN_DE_CHANTIER.md` §5 ;
- **le code du dépôt n'est pas une source, c'est ton terrain.** Les fichiers nommés dans les pièges sont des repères vérifiés, pas des autorités : **en cas de doute entre ce prompt et une source du manifeste, la source a raison.**

---

## Le contrôle d'entrée — en deux temps, et les deux ne font pas la même chose

**Le statut bloque.** Un fichier du manifeste dont l'en-tête porte un statut inférieur à celui exigé **arrête le lot**, explicitement. Le barème est au `07-Implementation.md` §2 : *déposé* → *relu et validé* → *versé et bancé*, **cumulatifs** ; « VALIDÉ ET GELÉ » vaut *relu et validé*.

**La version avertit.** Si la ligne VERSION d'un fichier du manifeste diffère de celle inscrite ci-dessus, **relis son en-tête avant de continuer** — une version qui bouge dit qu'un texte a changé, pas qu'il est devenu faux.

**Le blocage est granulaire quand il peut l'être.** Une fiche de compétence absente ou non bancée bloque **cette compétence**, pas le lot. ⚠️ *Ici la clause est sans objet : aucune fiche de compétence n'est à ton manifeste.* Elle est recopiée parce que la recette se recopie entière.

### Trois contrôles machine à jouer AVANT d'écrire une ligne, et ils ne disent pas la même chose

```bash
python3 generateur/verifie-import.py --autotest      # dépôt palimpseste-conception
npm test                                             # dépôt palimpseste
python3 scripts/derive-doctrine.py --verifie         # dépôt palimpseste
```

**1. `--autotest` doit rendre `53 vérification(s) jouée(s)` et `✓ tout passe`.** C'est le contrôle **dont tu vas recopier les vecteurs** — il provoque chaque refus un par un. *Mesuré au moment de l'écriture : 53, tout passe.*

**2. `npm test` doit rendre `# fail 0`.** *Mesuré au moment de l'écriture : **1234 tests, 1121 pass, 0 fail, 113 skipped**, en ~3,5 s.* ⚠️ **Note le compte avant de commencer** : un test qui disparaît est aussi silencieux qu'un test qui tombe, et **un vert n'est une preuve que si l'on sait combien de vert il y avait**.

**3. ⚠️ `derive-doctrine.py --verifie` DIT « DIVERGE » AUJOURD'HUI, ET CE N'EST PAS TOI — mais lis bien SUR QUOI.** Le contrôle porte sur **trois choses** : les **douze tables** de doctrine, les **empreintes de source**, et **la fixture** *(`PLAN_DE_CHANTIER.md` §5)*.

> ⭐ **La divergence est sur LA FIXTURE, et la fixture est l'entrée des tests que tu vas étendre.** Le verdict exact est : `FIXTURE : DIVERGE — la fixture committée ne vient plus de ces sources ; rejouer --fixture`. La fixture est `utils/fabrique/doctrine.fixture.json`, et c'est elle que lisent `verifie-import.test.ts`, `divergences.test.ts` et `doctrine-lecture.test.ts`.
>
> ⭐⭐ **Vérifié à la fabrication, clé par clé : AUCUNE LIGNE DE DONNÉES NE DIFFÈRE.** La fixture régénérée depuis les sources d'aujourd'hui est identique à la fixture committée sur **toutes** ses tables ; le seul écart est dans `_derivation.empreintes`, et il porte sur **deux fichiers, nommément** — `competences/argumentation.md` et `competences/connaissance.md`, modifiés dans l'arbre de travail avant ce lot. *La doctrine que ton port lit est donc la bonne ; c'est la trace de provenance qui a vieilli.*
>
> **Ce que tu fais** : **signale-le, et continue.** ⛔ **Ne rejoue pas `--sql`** — ce serait toucher la base pour faire taire un contrôle. **Si tu rejoues `--fixture`**, alors *(a)* fais-le **en un geste séparé**, *(b)* **vérifie que le diff ne porte que sur `_derivation`**, et *(c)* **dis-le au relevé**. Une fixture régénérée en passant, au milieu d'un port, rend le port inévaluable : on ne saurait plus si un test a changé d'avis à cause de toi ou à cause d'elle.

---

## La mission — reprise du `07-Implementation.md` §2

*Reprise du `07-Implementation.md` §2, entrée C4-L14.*

Le `08-FORMAT_IMPORT.md` est passé au **format 1.2**, sur accord explicite de Louis : il déclare **`pourquoi_juste`** et, pour la première fois, la **forme d'un distracteur**. **Le port de l'import le refuse** — `utils/fabrique/verifie-import.ts` tient un jeu de clés fermé, et une clé de plus vaut **refus n° 2 par cas**, donc sur tout exercice neuf. *Mesuré : **0 refus** avant, **3 refus** après, tous `[R02]`.*

**Ce lot fait coller le port au format, et sert enfin la correction que le `02-` exige.** Quatre gestes.

### A. Le port du format 1.2

`pourquoi_juste` entre au **jeu de clés du `cas`**. Il est **refusé hors des crans 1 et 3** *(refus n° 12)*, **signalé absent** à ces deux crans, et un distracteur sans son `pourquoi_faux` est **signalé — en une ligne agrégée par cas**.

⚠️ **Les vecteurs se recopient SANS ADAPTATION** de `generateur/verifie-import.py --autotest`, qui en joue **53** : *« ce que tu construis doit rendre LES MÊMES VERDICTS SUR LES MÊMES VECTEURS »* *(`07-` §2, ta propre entrée)*. **C'est la seule preuve du port.**

### B. La colonne et ses écrivains

`exercices_cas.pourquoi_juste`, migration **additive** avec son rollback. `utils/fabrique/import-ecriture.ts` l'écrit. Et **l'écran de conception en ligne le saisit et le relit**, sans quoi une instance conçue en ligne naîtrait **muette** là où une instance importée parle.

⭐ **Le `07-` §1.1 te donne la main sur la forme** — *« la forme physique en base t'appartient »* — **et il te donne aussi le domicile de la déclaration** : sa liste d'appui *« par cas »* en compte **quatre**, et `pourquoi_juste` est le **cinquième**. **Le §1.1 est OUVERT À L'IMPLÉMENTATION : tu l'amendes depuis ton relevé, sans accord préalable**, et la modification se dit au relevé.

### C. La correction servie, qui change de nature

Elle est aujourd'hui la `reponse_attendue` **seule**, sous le titre « Ce qu'il fallait voir » *(`utils/deroule/vue.ts`, `components/deroule/EcranDeroule.tsx`)*. Or depuis le `02-` §5 cette réponse **est un candidat nu**, affiché parmi quatre : elle ne peut rien dire d'elle-même.

Elle porte désormais **trois choses** :

1. la bonne réponse ;
2. son **`pourquoi_juste`** ;
3. le **`pourquoi_faux` du seul candidat que l'élève a le plus chargé**.

⭐ **Aucune donnée n'est à collecter** : `saisieARegistrer` journalise déjà `jetons`, **`choix`**, `index_correct` et `candidats` *(`utils/deroule/credence.ts`)*.

⚠️ **La règle de l'égalité est à écrire** — voir le piège 12.

### D. Un sixième état de paire

`EtapePaire` s'arrête à `credence_2`, et l'état `correction` ne vit **qu'entre les deux cas** : **le second cas ne reçoit rien.** Or aux crans 1 et 3 le jugement est **algorithmique**, et **aucun retour IA ne vient derrière** — le retour du `06-` §2, temps 4, *« s'engendre depuis le squelette »*, et il n'y a pas de squelette sans extraction.

**C'est le cas du transfert, celui qui porte toute la raison d'être de la paire. Décision de Louis, 23/08 : il reçoit LA MÊME CORRECTION que le premier.**

### ⚠️⚠️ Une affirmation du code est renversée, et il faut la retirer

`utils/deroule/credence.ts` porte *« `pourquoi_faux` n'est pas servi à l'élève — c'est une note de conception »*. **Personne ne l'a jamais tranché** : l'archéologie du 23/08 montre que la forme `candidats: string[]` est née pour l'**aperçu du professeur** *(C4-L8)*, qu'elle est devenue le patron de l'élève par une instruction de réemploi *(piège 39 de C4-L3)*, et que le commentaire l'a justifiée après coup. **La décision inverse est prise ; le commentaire part avec elle.**

### Ce que ce lot NE porte PAS

Les trois se ressemblent assez pour qu'on les fasse par mégarde.

- la **règle d'affichage conditionnée à la crédence** — *l'effet d'hypercorrection*. Le signal est **déjà en base** *(`jetons[choix]`)*, mais la règle demande son propre travail : elle est **parquée** *(`IDEES_post_rentree.md`, entrée « Crédence — servir la réfutation À LA MESURE de la confiance »)* ;
- la **normalisation des deux formes physiques** de `exercices_cas.distracteurs` — objets à l'import, chaînes à l'écran de conception. Elle est à **C4-L11** ;
- **aucune règle neuve de conception.** Tout ce que ce lot sert est déjà écrit au `02-` §5 et §2.3.1 a.

---

## Les pièges — les décisions dont l'oubli coûte une migration

*Tirés des sources du manifeste et vérifiés sur pièces. Chacun porte son renvoi. **En cas de doute entre ce prompt et la source, la source a raison.***

### Le port du contrôle — ce qui existe déjà, et ce qui manque

**1. ⭐ LA FORME DU DISTRACTEUR EST DÉJÀ PORTÉE — NE LA RÉÉCRIS PAS.** `CLES.distracteur` de `utils/fabrique/verifie-import.ts` porte **déjà** `{texte, pourquoi_faux}`. *Le `08-` §5.2 dit d'ailleurs pourquoi : « cette forme était appliquée par le contrôle machine sans qu'aucun document la déclare ; ce paragraphe paie la dette ».* **Ce qui manque au port est exactement trois choses** : `pourquoi_juste` dans `CLES.cas`, son **refus n° 12** hors des crans 1 et 3, et **deux signalements** — l'absent aux crans 1 et 3, et le distracteur muet. *Le geste A est plus étroit qu'il n'en a l'air : commence par mesurer ce qui y est.*

**2. ⚠️ LES VECTEURS SE RECOPIENT SANS ADAPTATION, ET C'EST LA SEULE PREUVE DU PORT.** `generateur/verifie-import.py --autotest` en joue **53**. Les quatre vecteurs neufs sont **nommés dans le script** et se retrouvent au grep : un **cran 1 complet** *(« douze candidats motivés, et un `pourquoi_juste` »)*, **S10** *(un cran 1 sans `pourquoi_juste`)*, **S11** *(deux distracteurs muets — UNE ligne, agrégée)*, et **R12** *(un `pourquoi_juste` hors des crans 1 et 3)*. *(`07-` §2.)*

**3. ⛔ LA MINEURE NE CASSE RIEN, ET UN PORT QUI REFUSERAIT CASSERAIT LA BANQUE EXISTANTE.** Le `08-` §1 : *« Une mineure n'ajoute que des champs **facultatifs**, dont l'absence a toujours un sens défini ; **casser la compatibilité, c'est incrémenter le majeur** »*. **`pourquoi_juste` absent aux crans 1 et 3 SIGNALE, il ne refuse jamais.** *Contrôle vérifié à la fabrication : `generateur/banque/banque.json`, produite sous la **1.0**, rend aujourd'hui `→ IMPORTABLE — 0 refus, 0 blocage(s), **18 signalement(s)**`, dont **trois** qui nomment exactement les trois cas à refaire. **Si ton port la refuse, il est faux.***

**4. `pourquoi_juste` PRÉSENT hors des crans 1 et 3 est un REFUS n° 12**, exactement comme une `reponse_attendue` hors des crans 1, 3, 4 et 5, ou un `guide` hors des crans 2 et 6 — **le n° 12 est un seul refus, celui de « l'appui qui ne suit pas le cran »**, et il porte déjà quatre cas. *N'en crée pas un dix-neuvième.* **Un champ là où il n'a pas de sens est un refus ; un champ manquant là où il en a est un signalement.** *(`08-` §7.1 et §7.3.)*

**5. LE SIGNALEMENT DES DISTRACTEURS MUETS EST AGRÉGÉ — une ligne par cas, jamais quinze.** Le `08-` §7.3 le range parmi les neuf signalements ; le patron d'agrégation y est écrit pour les entrées sans rattachement au cours : *« une seule ligne, agrégée, qui en donne le compte »*. ⚠️ **Le port TS a déjà un signalement de banque au même endroit** — *« N distracteurs en banque — le `02-` §6 en veut de 10 à 15 »* — : **le tien s'ajoute, il ne le remplace pas.**

**6. ⛔ LES TROIS VERDICTS NE SE CONFONDENT PAS, ET LE CODE DE SORTIE EN DÉPEND.** *« `0` = importable (blocages et signalements possibles), `1` = au moins un refus »* *(`08-` §7.4)*. Un signalement de plus **ne doit pas** faire passer `code` à 1. *La signature de `controleImport` est un contrat avec `divergences.test.ts` : ne la change pas pour te simplifier la vie.*

### Ce que la réponse attendue est devenue

**7. ⚠️⚠️ LA `reponse_attendue` D'UN CRAN À CANDIDATS N'EST PAS UN COMMENTAIRE : C'EST LE QUATRIÈME CANDIDAT AFFICHÉ.** *« L'écran sert QUATRE candidats : trois distracteurs tirés de la banque, plus la `reponse_attendue` »* *(`02-` §5)*. **Ne remets jamais de prose dans ce champ**, et ne l'affiche jamais comme un paragraphe d'explication : c'est ce que fait l'encart « Ce qu'il fallait voir », et c'est ce que ce lot corrige. *Le `pourquoi_juste` est l'explication ; la `reponse_attendue` est le candidat.*

**8. AUX CRANS 4 ET 5, L'INVERSE : la `reponse_attendue` EST le pourquoi**, et `pourquoi_juste` y vaut `null`. *« La règle tient en une ligne : là où la réponse attendue est un candidat, elle a besoin d'un pourquoi ; ailleurs, elle est le pourquoi »* *(`08-` §5.2)*.

**9. ⚠️ SERS LE `pourquoi_faux` DU SEUL CANDIDAT CHARGÉ, PAS DES TROIS.** La décision est au `07-` §2 — *« le `pourquoi_faux` du seul candidat que l'élève a le plus chargé »* —, et son motif est écrit : *« l'effet de **renversement d'expertise** dit que la rétroaction élaborée surcharge les élèves à faible bagage et devient redondante pour les avancés »* *(`IDEES_post_rentree.md`)*. **Trois réfutations pour une erreur commise iraient contre.** *`pourquoi_juste`, lui, se sert toujours : c'est une explication, pas trois.*

**10. NE RELIS PAS `pourquoi_faux` DEPUIS LA BANQUE ENTIÈRE.** Les distracteurs sont **10 à 15 en banque** et **trois seulement sont servis** — *« elle n'en affiche jamais quinze »* *(`02-` §5)*. `candidats` porte ce qui a été **réellement affiché, dans l'ordre réellement mêlé**, et c'est là-dedans que `choix` pointe.

### La crédence, et le candidat chargé

**11. ⭐ `choix` EXISTE DÉJÀ — NE COLLECTE RIEN, NE RECALCULE RIEN.** `saisieARegistrer` *(`utils/deroule/credence.ts`)* journalise à chaque saisie de répartition : `jetons`, **`choix`**, `at`, `index_correct` et `candidats`. **`candidats[choix]` te donne le texte servi ; le texte retrouve son entrée en banque.** ⚠️ **Ne renomme aucune de ces clés** : *« `jetons` / `index_correct` et `pourcentage` / `reussi` sont un CONTRAT avec C4-L5 : les renommer romprait la porte 2 en silence »* *(même fichier)*.

**12. ⚠️⚠️ L'ÉGALITÉ N'A PAS DE RÈGLE, ET IL T'EN FAUT UNE.** `choix: j.indexOf(Math.max(...j))` rend **0** sur un 25/25/25/25 : « le candidat le plus chargé » **n'existe pas** sur une égalité, et le `02-` §2.3.4 — *« le candidat le plus chargé **est** la réponse »* — ne dit rien de ce cas. **Servir la réfutation d'un candidat que l'élève n'a pas choisi est pire que n'en servir aucune.** Écris la règle, commente-la, **pose un test discriminant**, et **relève-la**. *Position de repli, si tu hésites : sur une égalité, ne sers pas de `pourquoi_faux`, sers le `pourquoi_juste` seul, et dis-le à l'écran. L'absence est honnête ; l'invention ne l'est pas.* ⛔ **Et ne touche pas à `choix` lui-même** — il part en base et la chaîne le relit ; la règle d'égalité est une règle **de l'écran de correction**, pas de la saisie.

**13. ⛔ IL N'Y A PAS D'ACTE DE « CHOISIR », ET NE VA PAS EN FABRIQUER UN.** Aux deux crans guidés, l'élève *« répartit des jetons sur 100 entre les candidats »* *(`02-` §5)* ; *« le candidat le plus chargé **est** la réponse, la distribution **est** la crédence »* *(`02-` §2.3.4)*. **Un seul geste fait les deux métiers.** N'ajoute ni bouton radio, ni colonne « réponse choisie ».

**14. ⚠️ LA CORRECTION NE SE SERT QU'APRÈS LA CRÉDENCE, ET C'EST STRUCTURANT.** `regime.ts` fait de `correction` **un état à part entière**, *« et non une donnée du cas 1 : la correction ne se sert qu'une fois la première crédence donnée — sans quoi l'élève déclarerait sa sûreté en connaissant la réponse, et la porte 2 ne mesurerait plus rien »*. **Le sixième état obéit à la même règle** : il vient **après `credence_2`**, jamais avant.

### Le sixième état — trois endroits, pas un

**15. ⚠️⚠️ `etapeDeLaPaire` NE REND JAMAIS `cas_2`, ET SON DERNIER `return` EST `credence_2`.** Vérifié : la fonction enchaîne `cas_1` → `credence_1` → `correction` → `credence_2`, et **`credence_2` est aussi ce qu'elle rend quand tout est fait**. ⛔ **Ajouter un sixième état n'est donc PAS ajouter une branche à la fin : c'est changer ce que rend le cas terminal.** *Sans quoi ton état ne sera jamais atteint, et rien ne tombera.*

**16. `ETAPES_PAIRE` est une LISTE ORDONNÉE, et deux tests la tiennent.** `utils/deroule/regime.test.ts` assère `etapeDeLaPaire(['a','b'], [{cas:1}, null]) === 'credence_2'` **et** `etapeDeLaPaire(['a','b'], [{cas:1},{cas:2}]) === 'credence_2'` — **la seconde est exactement le cas terminal que tu déplaces**. Mets la liste, le type, la fonction et les deux assertions d'accord **dans le même geste**. *Le nom se choisit ; `correction_2` dit ce qu'il est.*

**17. ⭐ LE SECOND CAS EST REFUSÉ À DEUX ENDROITS, ET LE SECOND N'EST PAS DANS `regime.ts`.** *(a)* `utils/deroule/vue.ts` ne compose `correctionDuPremierCas` que depuis `casBruts.find((c) => c.ordre === 1)` ; *(b)* `components/deroule/EcranDeroule.tsx` **garde le rendu derrière `c.ordre === 1`**. **Les deux tombent, ou le second cas reste muet.** *Généralise la correction par cas plutôt que d'ajouter un second champ : deux champs pour la même chose sont deux domiciles qui divergent.*

**18. ⛔ LA CORRECTION N'ENTRE PAS DANS LA CHARGE UTILE DU CAS.** `vue.ts` le dit et le tient : *« elle N'ENTRE PAS dans la charge utile du cas 1 — ce champ n'est pas une donnée de l'énoncé »* *(piège 40 de C4-L3)*. **Sers-la depuis l'état, jamais depuis le cas.** *Un `pourquoi_juste` qui partirait avec l'énoncé serait lisible avant la crédence, et la porte 2 ne mesurerait plus rien.*

### Les trois écritures de la colonne

**19. ⚠️ « SES DEUX ÉCRIVAINS » SONT TROIS SITES D'ÉCRITURE, ET LE TROISIÈME EST CELUI QU'ON OUBLIE.** *(a)* `utils/fabrique/import-ecriture.ts` insère les lignes `exercices_cas` à l'import ; *(b)* `app/prof/conception/actions.ts` les **insère** à la création ; *(c)* **le même fichier les MET À JOUR** à l'édition. **Oublier la mise à jour fait perdre le `pourquoi_juste` en silence à la première correction du professeur** — et une perte silencieuse ne se voit qu'à l'écran de l'élève, des semaines plus tard.

**20. LE FORMULAIRE DE CONCEPTION LIT DES CHAMPS À PLAT, PAR CAS** — `cas_${i}_distracteurs`, une entrée par ligne. Ton champ suit le même patron. ⚠️ **Et sa validation vit ailleurs** : `utils/fabrique/conception.ts` porte les conditions de cran de la voie en ligne — c'est là qu'est le **jumeau du refus n° 12** pour l'écran, et il ne connaît pas encore `pourquoi_juste`. *Deux voies, une seule règle : si l'import refuse, l'écran doit refuser aussi.*

**21. ⛔ NE NORMALISE PAS `exercices_cas.distracteurs` EN BASE.** L'import écrit des objets `{texte, pourquoi_faux}`, l'écran de conception écrit des **chaînes**, et *« réécrire la banque d'une instance importée la détruirait »* *(`utils/deroule/credence.ts`)*. `texteDuCandidat` lit déjà les deux. **Conséquence directe pour toi** : sur une instance **conçue en ligne**, un candidat est une chaîne et **n'a pas de `pourquoi_faux`** — ton écran doit se comporter proprement, sans rien inventer et sans se taire sur le `pourquoi_juste`, qui, lui, existera. *La normalisation est à C4-L11.*

**22. ⛔ NE RÉÉCRIS PAS L'APERÇU DU PROFESSEUR.** `composerApercu` *(`utils/fabrique/conception.ts`)* laisse délibérément la bonne réponse en dernière position — son tirage est déterministe pour qu'un rechargement ne change pas ce qu'il relit *(piège 38 de C4-L3)*. **Le mêlage réel vit dans `credence.ts`, et il y est déjà.** *Si tu montres le `pourquoi_juste` dans l'aperçu, montre-le sans toucher au tirage.*

### Ce qu'il faut retirer

**23. ⚠️⚠️ RETIRE L'AFFIRMATION RENVERSÉE, ET ELLE SEULE.** Le commentaire de `texteDuCandidat` — *« `pourquoi_faux` n'est pas servi à l'élève — c'est une note de conception »* — **part**. ⛔ **Le reste du bloc RESTE** : les deux formes physiques, les deux écrivains, et *« on ne normalise rien en base »* sont **justes**, et ce sont eux qui tiennent le piège 21. *Ne retire pas un paragraphe pour une phrase.*

---

## Le « fait quand » — recopié du `07-Implementation.md` §2

*Recopié du `07-Implementation.md` §2. C'est la condition de recette, et **elle ne se négocie pas en séance**.*

- un fichier produit par `generateur/papier.py` **sous le format 1.2** entre **sans refus** ;
- à un cran 1 ou 3, l'élève qui a donné sa première crédence voit **la bonne réponse, son pourquoi, et la réfutation du candidat qu'il a chargé** ;
- **le second cas la sert aussi** ;
- une instance **conçue en ligne** en fait autant ;
- l'**égalité** se comporte comme la règle l'aura tranché, et **un test la tient** ;
- et `verifie-import.ts` rend **les mêmes verdicts** que `verifie-import.py --autotest` sur ses **53** vecteurs.

*Échéance* : **avant le premier import d'une banque produite sous le format 1.2** — c'est-à-dire **avant que la banque d'exercices se peuple pour de bon**. *Rien d'extérieur n'est en attente : le format est gelé, le générateur produit déjà le champ, et la donnée de l'écran est en base.*

---

## Les conventions — `PLAN_DE_CHANTIER.md` §5

### Du dépôt

**Une ligne au `SUIVI_SQL.md` AVANT exécution, jamais après** — date, fichier, zone, cases Sandbox/Prod. **La migration est additive et gatée** : les **six** interrupteurs restent à OFF jusqu'à la recette. ⚠️ **Le reste du protocole n'est pas ici : il est en tête du `SUIVI_SQL.md`, règle R6** — sandbox d'abord, ne jamais rejouer un fichier de l'Archive, protocole renforcé sur les tables vivantes, répétition à blanc sur le CORPS du fichier. **Lis-le avant d'écrire ta migration** *(c'est aussi la règle absolue de l'`AGENTS.md`)*.

**La doctrine en base est dérivée, jamais tapée, et il n'y a qu'un dériveur.** Avant de lire ces tables, `python3 scripts/derive-doctrine.py --verifie` doit dire **IDENTIQUE** sur les **douze** tables, les empreintes de source et la fixture. **S'il dit DIVERGE, ne corrige jamais la base à la main** — et pour l'état d'aujourd'hui, voir le contrôle d'entrée n° 3 ci-dessus.

### De clôture

**Ta section au `SUIVI_tests_manuels.md`**, au moment où le lot se clôt : ce qui a été **prouvé en séance, coché avec sa preuve**, et ce qui **reste à jouer en recette, décoché, avec sa condition de reprise nommée**. *Un reste de recette qui ne vit que dans un relevé ne se rappelle à personne — et c'est la boîte aux lettres de C4-L7.*

### De dette

**Une source trouvée fausse se MARQUE, elle ne se corrige pas.** Deux gestes : **`[faux]`** au point de l'erreur, et **une ligne à la section DETTES** du `INVENTAIRE_Non_Tranches.md`, qui porte l'**avant / après**. ⚠️ *Ne confonds pas avec le `07-` §1.1 et l'inventaire du §2, qui sont **OUVERTS À L'IMPLÉMENTATION** : ceux-là, tu les amendes depuis ton relevé, sans accord préalable — ce n'est pas une dette, c'est ton travail.*

### Et une garde de séance

⚠️ **UNE AUTRE SESSION TRAVAILLE DANS CE DÉPÔT.** Le `PLAN_DE_CHANTIER.md`, le `SUIVI_tests_manuels.md` et les LISEZ-MOI portent régulièrement des modifications qui ne sont pas d'un lot. **Vérifie `git status` avant d'écrire, écris par ancres plutôt qu'en pleine page, et ne rends jamais compte de ce que tu n'as pas fait.**

---

### Et ce que ton relevé doit porter

Le nom du fichier : `RELEVE_C4_L14_2026-08-XX.md`, à la racine du dépôt `palimpseste`. **Quatre choses au minimum**, en plus du récit :

1. **la règle de l'égalité que tu as écrite**, et le test qui la tient ;
2. **ce que tu as amendé au `07-` §1.1** — le cinquième appui — et à l'**inventaire du §2** ;
3. **l'état du contrôle de dérivation** à l'entrée et à la sortie, et ce que tu as fait de la divergence de fixture ;
4. **ce qui reste à jouer en recette**, avec sa condition de reprise — parce que c'est cela qui part au `SUIVI_tests_manuels.md`, et de là à C4-L7.
