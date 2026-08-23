# PROMPT — Session Code : C4-L11 — Les correctifs

> **À coller dans une session Claude Code fraîche.** Une session, un lot.
>
> Ce prompt est fabriqué selon la recette du `PLAN_DE_CHANTIER.md` §5. Ce que le lot construit, son manifeste et son « fait quand » font foi au `07-Implementation.md` §2 — ils sont recopiés ci-dessous avec leurs versions au moment de l'écriture.

---

## Le manifeste — recopié du `07-Implementation.md` §2

> *Manifeste* : **ce document, §1, §4 et §5** · `01-routeur.md` §1, §8.7, §11 et §12 — **relu et validé**, la cible primaire de l'exercice, le registre du retour, ce qu'une mesure journalise, et le contrat de latence · `02-exercices.md` §2 — **relu et validé**, les crans et leurs noms · `04-Instances_Exercices.md` §14 — **relu et validé**, les crans de production, où la couche type se remplit · `06-Palimpseste.md` §5 · le **suivi SQL** · le **suivi des tests manuels**, où vit la moitié de ses items.

« Ce document » est le `07-Implementation.md`. Les sept pièces :

| Pièce | Où | Statut requis | Au moment de l'écriture |
|---|---|---|---|
| `07-Implementation.md`, **§1, §4 et §5** | `/Users/louissagnieres/Documents/GitTest/palimpseste-conception/` | aucun — un lot n'exige pas un statut de la source qui le déclare *(`07-` §2)* | **VERSION 2.35** · RELU ET VALIDÉ · ⚠️ **régimes mêlés** : le **§1** et le **§5** sont OUVERTS À L'IMPLÉMENTATION, le **§4 est GELÉ** *(en-tête du document)* |
| `01-routeur.md`, **§1, §8.7, §11 et §12** | même dépôt | **relu et validé** *(explicite au manifeste)* | **VERSION 5.5** · VALIDÉ ET GELÉ |
| `02-exercices.md`, **§2** | même dépôt | **relu et validé** *(explicite au manifeste)* | **VERSION 5.4** · VALIDÉ ET GELÉ |
| `04-Instances_Exercices.md`, **§14** | même dépôt | **relu et validé** *(explicite au manifeste)* | **VERSION 3.2** · VALIDÉ ET GELÉ |
| `06-Palimpseste.md`, **§5** | même dépôt | **déposé** *(entrée sans statut explicite — `07-` §2)* | **VERSION 2.6** · VALIDÉ ET GELÉ |
| `SUIVI_SQL.md` | `/Users/louissagnieres/Documents/GitHub/palimpseste/` | **déposé** *(entrée sans statut explicite)* | pas de ligne VERSION — c'est un registre, il s'écrit **avant** chaque exécution |
| `SUIVI_tests_manuels.md` | même dépôt | **déposé** *(entrée sans statut explicite)* | pas de ligne VERSION — ⭐ **et c'est ta boîte aux lettres** : la moitié de tes items y vivent, décochés, sous leur nom |

Ce que chaque section fait ici. Le **`07-` §1** déclare les tables et les colonnes que tu touches — `exercices` et sa `cible_primaire` *(§1.1)*, `exercices_jobs` et son bail *(§1.1)*, `exercices_squelettes` et son `instrument_version` *(§1.2)*, `competences_actives_par_classe` et l'opt-out *(§1.3)*. Le **`07-` §4** est **le gabarit du retour de Calame** : ce qui s'édite, ce qui ne s'édite pas, les trois variables, la persona unique — **il est GELÉ, il commande, tu ne l'amendes pas**. Le **`07-` §5** porte **les six interrupteurs** et **ce qu'un statut de recette commande**. ⚠️ *Il ne porte PAS la contrainte de cadence, contrairement à ce que le `PLAN_DE_CHANTIER.md` §6 annonce : elle vit au **`07-` §1.1**, dernier paragraphe — voir le piège 27.* Le **`01-` §1** pose que *« l'exercice porte la cible »* — le premier de ses principes. Le **§8.7** définit le **registre de retour** — descriptif / interrogatif / démonstratif —, celui de la variable `{{REGISTRE}}`. Le **§11** dit ce qu'une mesure journalise et que **rien n'est versionné par phase**. Le **§12** porte **le contrat de trois minutes** et la défense contre l'injection. Le **`02-` §2** donne **les neuf crans, avec leur numéro ET leur code** — c'est la source de ton seul arbitrage. Le **`04-` §14** dit **où la couche type se remplit aux trois crans de production**, la table que le contrôle de dérivation ne lit pas. Le **`06-` §5** porte *« un écran n'affiche un nombre que si ce nombre compte quelque chose »* — la règle qui décide du sort de la zone en construction.

**Rien de plus : la règle de manifeste veut que ce qui n'y figure pas ne se lise pas** *(`PLAN_DE_CHANTIER.md` §5, la recette de ce prompt — le `07-` §2, lui, ne pose que l'exigence de statut et le blocage)*. Quatre précisions pour que la règle ne fasse pas trébucher :

- l'`AGENTS.md` du dépôt n'est pas une source : Claude Code le charge d'office, il porte les conventions du repo ;
- ⛔ **`SPEC_C3_exercices_competences.md` est archivée : elle ne fait foi sur rien et ne se lit pas.** Elle traîne à la racine du dépôt `palimpseste` et son nom ressemble à ton sujet — ne l'ouvre pas. Il en va de même de `AMENDEMENTS_C3_en_attente_2026-07-31.md`, de `SPEC_aletheia_mode_c.md` et de `SPEC_scriptorium_rag.md`, qui ont l'air de porter le gabarit du retour et ne le portent pas ;
- ⛔ **aucun relevé de lot ne se lit** — ni `RELEVE_C4_L10_2026-08-22.md`, ni ceux de C4-L4, C4-L5, C4-L8, C4-L9, ni `RELEVE_Correctifs_RLS_et_Resume_2026-08-21.md`, ni `RELEVE_Revue_Bornee_C4_L8_2026-08-21.md`. La règle de manifeste l'interdit, et ce n'est pas une privation : **ce que ces lots avaient à te dire est déjà dans les pièges ci-dessous**, et le reste est au `SUIVI_tests_manuels.md`, qui est **à ton manifeste** ;
- **« Le statut porte sur le FICHIER, jamais sur la section. […] la section dit seulement où lire »** *(`07-` §2)* — **donc une section du manifeste qui cite une autre section du MÊME fichier se suit** : dans le `01-`, le **§3** *(qui lit l'opt-out)*, le **§5** *(le cas où l'instance n'a qu'une cible possible)* et le **§8.2** *(la fenêtre d'évidence, que le gabarit du `07-` §4 nomme)* ; dans le `02-`, le **§6.D** *(l'analyse en lot, « explicitement différée »)*. **Les six fiches de compétence ne se lisent pas** : ce lot n'ouvre aucune compétence et ne porte aucun module.

---

## Le contrôle d'entrée — en deux temps, et les deux ne font pas la même chose

> **Le statut bloque.** Un fichier du manifeste dont l'en-tête porte un statut inférieur à celui exigé **arrête le lot**, explicitement. Le barème est au `07-Implementation.md` §2 : *déposé* → *relu et validé* → *versé et bancé*, cumulatifs ; « VALIDÉ ET GELÉ » vaut *relu et validé*.
>
> **La version avertit.** Si la ligne VERSION d'un fichier du manifeste diffère de celle inscrite ici, **relis son en-tête avant de continuer** — une version qui bouge dit qu'un texte a changé, pas qu'il est devenu faux.
>
> **Le blocage est granulaire quand il peut l'être.** Une fiche de compétence absente ou non bancée bloque **cette compétence**, pas le lot.

Concrètement, pour ce lot : vérifie que les sept pièces **existent**, que le `07-` porte **VERSION 2.35**, le `01-` **VERSION 5.5**, le `02-` **VERSION 5.4**, le `04-` **VERSION 3.2** et le `06-` **VERSION 2.6**, et que les quatre sources de conception valent au moins *relu et validé*. **La clause granulaire n'a ici aucun objet** : ce manifeste ne compte aucune fiche de compétence.

**Vérifie que ta dépendance est jouée.** Le `PLAN_DE_CHANTIER.md` §3 écrit que C4-L11 dépend de **« tout C4 joué »**. À l'écriture de ce prompt, **tout C4 est joué en bac à sable sauf C4-L7 et les cinq reprises de C4-L10** — et c'est **délibéré** : *« décision de Louis, 22/08 : il se joue TOUT DE SUITE, en séance dédiée — après `C4-L10 · Expression`, avant les cinq compétences qui restent à ouvrir, et avant C4-L7 »*. **C'est cet ordre qui tient l'échéance de la `cible_primaire`.** Ce que tu dois constater avant de partir, au `SUIVI_SQL.md` et dans le dépôt :

- **C4-L1** *(`c4_l1_schema.sql`, `c4_l1_existant.sql`, `c4_l1_seed.sql`)* — les tables du `07-` §1, dont `exercices`, `exercices_jobs`, `exercices_squelettes` ;
- **C4-L8** *(`c4_l8_doctrine.sql`, `c4_l8_fabrique.sql` et leurs compléments)* — la doctrine dérivée, l'écran des compétences, `competences_actives_par_classe` — et **C4-L8-bis**, qui **n'a laissé aucune migration** : sa preuve est sa section au `SUIVI_tests_manuels.md` ;
- **C4-L5** *(`c4_l5_chaine.sql`, `c4_l5_chaine_complement.sql`)* — `utils/chaine/`, la file, `app/api/chaine/route.ts` ;
- **C4-L2** *(`c4_l2_routeur.sql`)*, **C4-L3** *(`c4_l3_deroule.sql`)*, **C4-L4** *(`c4_l4_passation.sql`, `c4_l4_collage_journal.sql`)*, **C4-L9** *(`c4_l9_examens_diagnostiques.sql`, `c4_l9_bis_examen_produire_macro.sql`)* — tous exécutés en bac à sable le 22/08 ;
- **C4-L6** — joué le 22/08, **aucune migration** ; sa preuve est sa section au `SUIVI_tests_manuels.md` ;
- **C4-L10 · Expression** — joué le 22/08, **aucune migration** ; l'Expression est **branchée** dans la chaîne, et **c'est pour cela que `exercices_squelettes` n'est plus vide**.

⚠️ **Un décor de recette de C4-L6 peut être en base, avec `exercices_actif` à ON.** `scripts/recette/decor-c4l6.mjs --retire` le remet comme avant. **Constate l'état des six interrupteurs avant de commencer, et rends-le tel quel à la fin.**

Si une pièce manque ou bloque, **arrête-toi et signale-le, ne devine pas**.

**Ce que tu peux écrire dans une source, et ce que tu ne peux pas.** Deux régimes, à ne pas confondre :

- **Le `07-` §1 et le `07-` §5 sont ouverts à l'implémentation** : ce que la construction fait apparaître **s'y écrit depuis ton relevé, sans accord préalable** ; la modification se dit au relevé et n'attend rien. ⚠️⚠️ **Le `07-` §4 est GELÉ, et il est à ton manifeste** — c'est la section que trois de tes chantiers servent. **Tu l'appliques, tu ne le modifies pas** ; si tu le trouves faux, c'est la convention de dette qui joue, pas ta plume. Le §3, le §6 et la règle de manifeste du §2 sont gelés aussi.
- **Partout ailleurs, une session Code ne corrige jamais une source** *(`07-` §2)*. Quand tu trouves une source **fausse** — pas incomplète, fausse —, tu poses **`[faux]`** au point de l'erreur et tu portes la correction au **registre des ouverts**, section **DETTES** du `INVENTAIRE_Non_Tranches.md`, avec l'avant et l'après. **Une source qui porte `[faux]` ne bloque aucun lot** : elle cesse de faire foi sur ce point, et elle le dit.

---

## La mission — reprise du `07-Implementation.md` §2

> **C4-L11 — Les correctifs.** Ce lot n'a pas été conçu : **il s'est constitué tout seul, lot après lot.** Chaque séance qui trouvait un défaut hors de son périmètre l'a adressé *« au lot de correctifs »* — un destinataire sans numéro, cité une dizaine d'endroits, au `PLAN_DE_CHANTIER.md` §6 comme au suivi des tests manuels. **Il en a un désormais, et son inventaire est ici.** *Chacun de ses items a déjà été arbitré par la séance qui l'a trouvé : ce lot exécute, il n'arbitre pas.*
>
> **Douze chantiers, en six familles.**
>
> **A — Ce que la chaîne mesure faux.**
>
> - La **`cible_primaire`** : la colonne **nullable** sur `exercices`, le champ à l'écran de conception, et sa lecture par `cibleDuRetour` **avant tout défaut** *(§1.1)*. En attendant, la chaîne prend l'**ordre alphabétique**, assumé comme convention, et **lève une alerte** dès qu'il sert sur plus d'une compétence.
> - **`exercices.cran` porte DEUX formes en base** — des lignes au **code**, d'autres au **numéro**, sur une colonne `text` **sans `CHECK`**. `utils/deroule/vue.ts` lit par le code ; `utils/chaine/contexte.ts` fait `Number(cran)` et part avec **`cran=eq.NaN`** *(400 avalé)*, rendant `cran`, `cranCode`, `regimeV1vf`, `servable` et `patronProduction` **tous vides**. **Trancher quelle forme fait foi**, poser la contrainte, convertir.
>
> **B — Ce que la chaîne écrit en trop.**
>
> - Le retrait de **`exercices_squelettes.prompt_version`** — *« rien n'est versionné par phase »* *(§1.2)*. ⚠️ **Une colonne ET deux écritures** : `chaine.ts` la pose **deux fois**, avec exactement la valeur d'`instrument_version`. Et **la table n'est plus vide** depuis C4-L10.
>
> **C — Ce qui ne tourne pas.**
>
> - **Le déclencheur de la chaîne n'existe pas.** `app/api/chaine/route.ts` est écrit, protégé et éprouvé, et **rien ne l'appelle** : aucune tâche planifiée déclarée. Poser la **cadence** que l'offre autorise *(§5)*, porter **`maxDuration`** à la mesure du contrat de latence, et **une garde de budget sur la boucle** — elle réclame un job **sans réserver la durée de son traitement**, et `reclamerJobs` incrémente `tentatives` **à la prise** : le dernier job de chaque invocation est **tué en vol, sans clôture, et brûle une tentative**. Trois fois, et c'est `echec_definitif` sur une copie jamais traitée. *Ce n'est pas un cas limite : c'est le dernier job de chaque tour.*
>
> **D — Les chiffres de diagnostic faux.**
>
> - **Le bilan d'un dépôt perd les appels d'une compétence qui a levé.** `chaine.ts` rassemble ses chaînes par `allSettled` ; sur un `rejected`, il pousse le motif en alerte et **jette le compte d'appels**, que `SortieNonConforme` et `AppelInterrompu` portent tous deux *précisément pour qu'il ne se perde pas*. Constaté en vrai : `bilan.appels = 0` quand **trois lignes** étaient déjà écrites au journal. *Aucune décision n'en dépend — le plafond par dépôt se lit au nombre de lignes en base — : c'est un chiffre faux, pas une garde percée.*
>
> **E — Ce qui est au mauvais endroit, ou en double.**
>
> - **L'opt-out déménage au profil de la classe** *(§1.3)* : il vit au tableau des compétences, il doit vivre au profil. **Plus le sort de la « zone en construction »** de l'onglet Compétences du profil de classe, qui affiche **cinq colonnes inventées** — *Analyser · Interpréter · Argumenter · Problématiser · Conceptualiser* — qui ne sont pas les six du référentiel.
> - **La garde « référence validée » vit à DEUX endroits** — l'écran de conception et la conception d'examen lisent la **même** colonne avec le **même** prédicat. Une fonction partagée.
> - **Un index devenu redondant** depuis C4-L9 : la clé unique de l'exercice planifié a la même clé et le même prédicat que l'index simple qui la précède. **Retrait, ou jamais** — le coût est une écriture d'index de plus par instance.
> - **L'écran de conception rend « cran NaN »** sur une instance d'examen diagnostique, et son bloc d'édition refuse *(il lit des cas qu'un examen n'a pas)*. **Cosmétique** : le bloc d'assignation, par où passe la suite du flux, fonctionne.
>
> **F — L'outillage, le gabarit et la base.**
>
> - **Trois angles morts de la dérivation.** `exercices_types_crans` est **écrite par `--sql` et jamais lue par `--verifie`** — douze tables remplies, **onze** contrôlées, et la manquante est justement celle où la couche type se remplit aux crans de production. · Les **deux** chaînes de dérivation embarquent **le chemin absolu de la racine** dans ce que leur contrôle compare : ailleurs que sur la machine du professeur, elles disent **DIVERGE** alors que tout le reste est identique à l'octet — **`npm test` ne peut donc passer ni en intégration continue, ni sur un second poste**. · **`cran` est un entier dans une table de doctrine et une chaîne dans l'autre.**
> - **Les trois exigences du §4 que C4-L5 ne tient pas** — le §4 a été réécrit **après** sa construction, et **aucune n'est un défaut du lot**. La dérivation **n'émet pas le gabarit découpé en sections nommées**, que le §4 exige *« pour qu'un remplacement ait quelque chose d'identifié à remplacer »* : la règle 7 est donc déclarée ouverte et **matériellement inremplaçable**. · La **`longueur`** n'a pas son paramètre de plateforme, **NULL valant la règle 7**. · Le **`ton` partagé n'est pas reçu** par la couche contrat. ⚠️ **Le même geste porte l'alignement de la persona** — le §4 veut **une seule voix sur trois surfaces**, et elle n'existe aujourd'hui que dans la chaîne — et **toucher au bloc partagé diverge du prompt calibré au banc** : **rejouer ce banc fait partie du correctif**, décoché tant qu'il ne l'est pas.
> - **La base porte deux formes de `search_path`** : cinq fonctions `security definer` portent `public` **seul**, sans `pg_temp`, quand les autres portent les deux. **Risque nul aujourd'hui** *(elles sont fermées à `anon` et `authenticated`)* — c'est une **divergence de doctrine**.
>
> *Ce lot ne construit aucune fonctionnalité neuve et n'ouvre aucun écran. Il ne rouvre aucun arbitrage : chacun de ses items a été tranché par la séance qui l'a trouvé. **Une seule exception, et elle est nommée** : quelle forme de `cran` fait foi — cela se tranche ici, et se dit au relevé.*

---

## Les pièges — les décisions dont l'oubli coûte une migration

**Ils sont numérotés en continu ; les numéros sont cités ailleurs, ne les renumérote pas.** Chacun porte son renvoi. *C'est la seule partie de ce prompt qui demande du jugement : elle se relit contre la source, pas contre un prompt précédent.*

### Ce que ce lot est, et ce qu'il n'est pas

**1. Douze chantiers indépendants, pas un projet.** Rien n'oblige à les jouer dans l'ordre du document, et **rien ne les lie entre eux** — sauf deux : la **forme du `cran`** *(famille A)* et le **`cran` entier / chaîne** *(famille F)* sont **le même sujet à deux hauteurs**, et se tranchent ensemble. Joue-les un par un, **chacun avec sa preuve**, et coche-les un par un.

**2. Ce lot exécute, il n'arbitre pas — sauf une fois, et c'est écrit.** *« Chacun de ses items a déjà été arbitré par la séance qui l'a trouvé »* *(`07-` §2)*. **La seule exception est nommée : quelle forme de `cran` fait foi.** Si un autre item te paraît demander un arbitrage, **c'est un signal que tu as mal lu la source, ou que la source est fausse** — dans le second cas, la convention de dette, pas une décision.

**3. Aucune fonctionnalité neuve, aucun écran neuf.** Trois de tes chantiers *déplacent* un bouton, *extraient* une fonction, *retirent* un index. **La réussite se mesure en diff minimal**, pas en lignes écrites. Un correctif qui refait l'écran qu'il corrige n'est plus un correctif.

**4. Trois de tes chantiers touchent la base** — la contrainte de `cran`, le retrait de `prompt_version`, le retrait de l'index —, **et un seul est destructif** *(le `drop column`)*. Les trois conventions de dépôt s'appliquent en entier *(plus bas)*.

### A · La `cible_primaire` — l'échéance qui a fait passer ce lot devant les autres

**5. Elle est NULLABLE, et elle le reste.** *« Sur la voie du routeur elle reste NULL : la cible est la sortie de la couche 2 et vit à la décision (`routeur_decisions.cible_retenue`) »* *(`07-` §1.1)*. **Un `NOT NULL` casserait toute la voie du routeur.** Le `07-` §1.1 la nomme explicitement *« la `cible_primaire` NULLABLE »* dans la liste des colonnes d'`exercices`.

**6. ⭐ SIX FICHIERS portent aujourd'hui le repli ou son commentaire « elle n'existe pas encore ». Ne répare pas le premier et n'oublie pas les cinq autres.** Recensés au dépôt :

| Fichier | Ce qu'il dit aujourd'hui |
|---|---|
| `utils/chaine/chaine.ts:312` | `cibleDuRetour()` — le repli alphabétique et son motif |
| `utils/chaine/chaine.ts` *(fonction voisine)* | `cibleIndeterminee()` — l'alerte, vraie seulement à plus d'une compétence |
| `utils/passation/metacognition.ts:111-146` | *« l'alerte de repli alphabétique »*, **la MÊME convention recopiée** |
| `utils/deroule/vue.ts:255` | *« la cible vient de la DÉCISION, et non d'`exercices.cible_primaire` »* |
| `utils/deroule/mesure.ts:92` | *« le `07-` §1.1 nomme la colonne, mais elle… »* |
| `utils/deroule/depot.ts:96` | ⚠️ *« `cible_primaire` N'EST PAS DANS CE SELECT, ET C'EST DÉLIBÉRÉ »* |
| `utils/examens/conception.ts:356` | *« la colonne n'existe pas encore, et un examen en… »* |

**Chacun devient faux le jour où tu poses la colonne.** Le `depot.ts:96` est le plus dangereux : c'est un `select` explicite, et l'oublier fait que la colonne existe **et ne descend jamais jusqu'à la chaîne**.

⚠️⚠️ **Et DEUX scripts de recette la nomment aussi — dont un qui PASSERA AU ROUGE quand tu répareras `depot.ts`.** `scripts/recette/deroule-c4l3.mjs:276` porte une assertion vivante : `dire(!selectSansCommentaires.includes('cible_primaire'), 'SUR PIÈCE — le SELECT de utils/deroule/depot.ts (commentaires ôtés) ne nomme plus cible_primaire')`. **Elle est écrite à l'envers exprès**, pour tenir tant que le report tient — le fichier le dit lui-même, *« ce report est désormais dû »*. **Retourne-la, ne la supprime pas.** Le second, `scripts/recette/passation-c4l4.mjs:620-624`, compte le repli alphabétique et note que la colonne est reportée : **sa mention se met à jour, son compteur reste utile.**

**7. L'ordre de lecture, et l'alerte qui NE se supprime PAS.** `cibleDuRetour(ctx, mesurees)` fait aujourd'hui : décision du routeur → `[...mesurees].sort()[0]`. Il doit faire : décision du routeur → **`cible_primaire` de l'instance** → repli alphabétique. ⚠️ **Les deux premiers ne coexistent jamais par construction** *(`07-` §1.1 : NULL sur la voie du routeur, posée sur la voie du professeur)* — **si tu constates qu'ils coexistent, ne choisis pas en silence : dis-le au relevé.** Et `cibleIndeterminee()` reste : **elle doit désormais ne se lever que si les DEUX manquent**, sur plus d'une compétence.

**8. L'écran la pose SANS LA DEMANDER quand il n'y a qu'une possibilité.** *« Parmi les compétences que son exercice mesure, et une seule ; quand il n'y en a qu'une possible — l'exercice n'en mesure qu'une, ou le cran est de `transformer` ou de `diagnostiquer`, où l'instance n'a qu'une cible (`01-` §5) —, l'écran la pose sans la demander »* *(`07-` §1.1)*. **Un champ toujours affiché est un écart à la source**, pas un confort.

**9. Pourquoi l'échéance est ferme, et ce que ça t'impose.** *« En version finale, les appels froids ne se rejouent que pour la seule compétence visée par le retour (`01-` §11) — une cible tirée de l'ordre d'un tableau ferait porter le `delta_v1_vf`, donc le signal de réceptivité de N2, sur une compétence que personne n'a choisie »* *(`07-` §1.1)*. **Le squelette de version finale s'attache à la cible** : ta preuve n'est pas « la colonne existe », c'est **un dépôt réel dont la vf rejoue les appels de la bonne compétence**.

**10. Le champ va à l'écran de conception de C4-L8** *(`app/prof/conception/`)*, **pas à l'écran d'examen diagnostique** : `utils/examens/conception.ts:356` explique pourquoi un examen n'en a pas besoin — relis son commentaire avant de trancher, et si tu le contredis, dis-le au relevé.

### A · La forme du `cran` — **ton seul arbitrage**

**11. L'état des lieux, table par table, à recompter en base avant de trancher.** Ce que le dépôt déclare :

| Objet | Type de `cran` | Posé par |
|---|---|---|
| `exercices.cran` | **`text`, SANS `CHECK` de forme** — des lignes au code, d'autres au numéro | `c4_l1_schema.sql:361` |
| `exercices_crans.cran` | **`int` primary key**, `check (cran between 1 and 9)`, plus `code text not null unique` | `c4_l8_doctrine.sql:86-88` |
| `exercices_routes.cran` | **`int not null check (cran between 1 and 9)`** | `c4_l8_doctrine.sql:188` |
| `exercices_consignes_production.cran` | **`int not null check (cran in (2,6,8))`** — les trois crans de production | `c4_l8_doctrine.sql:262`, remplie par `derive-doctrine.py` |
| `exercices_types_crans.cran` | ⚠️ **`text not null`** | `c4_l1_schema.sql:204` |

⭐ **Le `02-` §2.1 et §2.2 donnent LES DEUX** — la table des crans porte un **`#`** de 1 à 9 **et** un **code** *(`diagnostic_guide`, `production_guidee`…)*. **La source ne tranche pas ; c'est toi.** Le chiffre du dernier constat *(C4L3-20, au `SUIVI_tests_manuels.md`)* est **6 lignes au code, 5 au numéro** — **recompte-le, il date.**

**12. Le `NaN` ne part que d'UNE ligne, et trois gardes existent déjà.** `utils/chaine/contexte.ts` fait `Number(exercice.cran)` à la ligne 153, puis **teste `Number.isFinite`** aux lignes 156, 247 et 261. **La ligne 178 ne le teste pas** — `if (cran != null && tousLesModes.length)` —, et c'est de là que part `.eq('cran', cran)` avec `NaN` *(400 avalé par PostgREST)*. **Ne réécris pas les trois gardes qui marchent.** *Et note que la vraie réparation n'est pas cette ligne : c'est la forme unique et la contrainte, sans quoi une instance au code rendra toujours `cran = null`.*

**13. Deux lecteurs, deux formes — et ton arbitrage en déplace un.** `utils/deroule/vue.ts:172-173` lit `exercices_crans` **par le code** *(`.eq('code', depot.exercice.cran ?? '')`)*, et `vue.ts:225` passe `depot.exercice.cran` **tel quel** à `offreDeCredence()`. `utils/chaine/contexte.ts:158` lit **par le numéro**. **Quelle que soit la forme retenue, l'un des deux change de lecture** — et `vue.ts:488` fait déjà `.eq('cran', String(ctx.cran ?? ''))` sur `exercices_types_crans`, un aller-retour de type qui disparaîtrait avec une forme unique.

**14. ⚠️ LA GARDE QUE TU CROIS TROUVER N'EST PLUS LÀ.** `exercices_cran_chk` — *« `statut = 'a_concevoir'` ou `cran is not null` »* — **a été SUPPRIMÉE par C4-L9** *(`c4_l9_examens_diagnostiques.sql:230`)*, précisément parce qu'*« un `CHECK` ne pouvait pas lire `exercices_types.nature` »*. Ce qui la remplace est **un trigger** : `trg_exercices_cran_selon_le_type` *(`:290`, commentaire `:282` — « Remplace `exercices_cran_chk` (C4-L1) »)*, et le drapeau de vérification `:360` **exige que le `CHECK` ait disparu**. ⭐ **Deux conséquences pour ton geste** : *(a)* ta contrainte de **forme** — une valeur parmi neuf — n'est pas la même chose que la garde de **présence**, qui vit désormais dans le trigger ; *(b)* **un `CHECK` de forme reste possible et souhaitable**, puisqu'il ne regarde que la colonne, mais **il doit tolérer `NULL`** : un examen diagnostique n'a **pas de cran du tout** — `types_complet_macro_sans_cran_chk` *(`c4_l9_bis_examen_produire_macro.sql:113`, qui a remplacé `types_complet_sans_objet_ni_cran_chk` en imposant en outre le grain `macro`)* lui en interdit un. ⛔ **Ne réintroduis pas `exercices_cran_chk` sous un autre nom : tu casserais le drapeau de C4-L9 et le trigger d'un même geste.**

**15. Convertir, c'est une migration sur une table VIVANTE.** `exercices` porte des instances réelles, conçues et assignées. Protocole **renforcé** *(`SUIVI_SQL.md`, règle 5)* : code d'abord, SQL ensuite, fenêtre calme, `*_rollback.sql` prêt, et **répétition à blanc en copiant le CORPS du fichier**, jamais le fichier entier *(règle 6)*. **Et l'ordre compte** : convertir avant de poser le `CHECK`, dans la même transaction, sinon le `CHECK` refuse les lignes qu'il doit corriger.

**16. `exercices_types_crans.cran` ne se convertit PAS à la main.** C'est une table **dérivée** — `derive-doctrine.py --sql` la `delete` puis la remplit. Si tu changes son type, **change le dériveur** *(la valeur y est écrite en `tc.append((code, cran, couv, cible, duree))`)*, puis rejoue `--sql`. **Corriger la base à la main la fera diverger au prochain passage.**

**17. Dis ton arbitrage, et dis-le au bon endroit.** *« Cela se tranche ici, et se dit au relevé »* *(`07-` §2)*. Le relevé, plus une ligne à ta section du `SUIVI_tests_manuels.md`. ⚠️ **Ne modifie pas le `02-` §2** : il est GELÉ, il donne les deux formes, et ton arbitrage porte sur la **représentation en base**, pas sur la doctrine.

### B · `prompt_version`

**18. Une colonne et DEUX écritures, et l'ordre compte.** La colonne est à `c4_l1_schema.sql:556` ; les écritures sont à `utils/chaine/chaine.ts:502` et `:564`, toutes deux `prompt_version: instrument.version, instrument_version: instrument.version`. **Le code d'abord** *(cesser d'écrire)*, **le SQL ensuite** — l'inverse casse la chaîne entre les deux gestes.

**19. `instrument_version` RESTE.** *« Le versionnage de l'instrument : `instrument_version`, sur la mesure et sur le squelette »*, et *« rien n'est versionné par phase »* — **les deux phrases vivent au `01-` §11**, pas au `07-` §1.2 que la mission cite ; le §1.2, lui, porte la substance. Il dit pourquoi la seconde colonne tombe : *« un prompt vit dans sa fiche, donc l'`instrument_version` bouge dès qu'un prompt bouge — une seconde colonne serait une copie du même chiffre, et deux copies finissent par diverger »*. **Retirer les deux serait l'erreur symétrique.**

**20. Un `drop column` n'est pas additif.** C'est le seul geste **destructif** de ce lot. Son rollback **recrée la colonne nullable** — et ne récupère rien de ce qu'elle portait. **Ce n'est pas grave, et il faut le dire au relevé plutôt que le laisser deviner** : la colonne portait *exactement* `instrument_version`, la valeur est donc encore là, à côté.

**21. La table n'est plus vide.** *« Depuis C4-L10 »* *(`07-` §2)* : la recette de l'Expression y a écrit un squelette réel, et **elle se remplira dès qu'un dépôt sera traité**. **Compte les lignes avant, compte-les après**, et vérifie qu'`instrument_version` y est intacte sur toutes.

### C · Le déclencheur, la cadence et la garde de budget

**22. Un seul cron existe aujourd'hui, et ce n'est pas le tien.** `vercel.json` déclare `{ "path": "/api/scriptorium/synthese-hebdo", "schedule": "0 9 * * 1" }`. **C'est aussi ton patron** : la route de la chaîne est protégée par le même `CRON_SECRET`, et la tâche planifiée doit porter l'en-tête `Authorization: Bearer …`.

**23. ⭐ Le contrat de trois minutes ne porte QUE sur le retour maison, et la source est formelle.** *« Le contrat de trois minutes porte sur le retour maison (`01-` §12) ; le traitement en lot d'une passation est explicitement différé — “le soir même ou un autre jour” (`02-` §6.D, étape 12) — et ne porte aucune exigence de latence »* *(`07-` §1.1)*. **Deux voies drainent la file** : le dépôt appelle lui-même le déclencheur, **ou** une tâche planifiée à la minute. ⚠️ *« Une tâche planifiée est due dans les deux cas — c'est le filet qui reprend les jobs dont le bail a expiré et que plus aucun dépôt ne rappelle ; à la cadence quotidienne elle y suffit, mais elle ne tient pas le contrat à elle seule. »* **Ce que tu poses est le FILET, pas le chemin normal.**

**24. ⚠️⚠️ LA GARDE DE BUDGET EXISTE À MOITIÉ. Lis le code avant d'en écrire une.** `app/api/chaine/route.ts` porte déjà `MARGE_MS = 8_000`, `LOT_PAR_TOUR = 1`, `const budgetMs = maxDuration * 1000 - MARGE_MS` et `while (Date.now() - debut < budgetMs)`. **Ce qui manque n'est pas la boucle bornée : c'est la RÉSERVATION.** La condition dit *« il reste du budget »*, pas *« il reste de quoi TRAITER le job que je vais réclamer »* — et comme `reclamerJobs` **pose le bail et incrémente `tentatives` à la prise**, le dernier job de chaque tour est réclamé puis tué en vol. **Le correctif est une estimation de durée par étape, comparée au reste, AVANT `reclamerJobs`** — pas une seconde boucle. *Le commentaire de la ligne 92 dit déjà l'intention : « aucun job ne porte un bail qu'on n'a pas l'intention d'honorer ». Le code ne la tient pas.*

**25. Le compte des tentatives, chiffré.** `exercices_jobs.tentatives_max` vaut **3** par défaut *(`c4_l1_schema.sql:520`, « confirmé par Louis le 18/08 »)* ; `reclamerJobs` incrémente `tentatives` en **compare-and-swap** *(`utils/chaine/file.ts:185-190`)* ; à `tentatives >= tentatives_max`, `echec_definitif` passe à vrai. **Trois tours tués en vol = une copie jamais traitée, définitivement.**

**26. La route sert DEUX étapes derrière DEUX portes, et les lier serait un mode de panne.** Les mesures obéissent à `chaine_actif`, la transcription à `passation_classe_actif` **et** `exercices_actif`. Le commentaire en tête de la route dit pourquoi : *« la coupure automatique de facture bascule `chaine_actif` (C4-L5), et une classe entière se retrouverait sans transcription, pendant l'heure de cours, parce que la facture du mois a coupé »*. ⛔ **En posant la cadence, ne touche pas à ce partage.**

**27. Aucun chiffre d'hébergeur ne vit dans les sources, et c'est délibéré.** Le **`07-` §1.1** — **et non le §5, que le `PLAN_DE_CHANTIER.md` §6 désigne par erreur** — écrit la contrainte : *« La cadence de planification, elle, est bornée par l'offre : vérifier laquelle avant la rentrée est une condition de C4-L4, au même titre que le test de charge de la transcription (§7). »* Jamais le nombre. **Vérifie la cadence et le plafond de durée que l'offre autorise au moment où tu poses**, et écris le chiffre **dans `vercel.json` et dans la route**, pas dans une source. *Le commentaire faux — « `maxDuration = 60` est le plafond du plan Vercel Hobby » — a déjà été corrigé par C4-L4 ; ne le réintroduis pas sous une autre forme.*

**28. `verifierCoherence()` garde la porte, et rend 409 avant tout appel payé.** Une cadence à la minute qui tomberait sur des instruments incohérents ferait **1440 réponses 409 par jour, silencieuses**. **Ce n'est pas une raison de retirer la garde** — c'en est une de dire, au relevé, comment on saura qu'elle s'est allumée.

### D · Le bilan qui perd les appels

**29. Le compte se perd à un endroit précis, et à un seul.** `utils/chaine/chaine.ts` : `Promise.allSettled` aux lignes 175-185, puis `regles.forEach` aux lignes 187-192 — sur un `rejected`, le motif part en `ecartees` et en `alertes`, **et rien n'additionne `appels`**, parce que le `reason` est une `Error` et non un résultat. La boucle qui suit *(`for (const r of resultats) { appels += r.appels … }`)* ne voit que les `fulfilled`. **Le correctif est de lire `appels` sur l'erreur quand elle le porte** — `SortieNonConforme` *(`utils/chaine/appel.ts:82`)* et `AppelInterrompu` *(`:94`)* exposent tous deux un `readonly appels`, et le commentaire de la première dit pourquoi : *« les appels RÉELLEMENT dépensés avant l'abandon — l'appelant les compte »*. **L'appelant ne les compte pas.**

**30. ⛔ Ne passe PAS de `allSettled` à `all`.** Le commentaire de la ligne 172 dit pourquoi : *« avec `all`, une compétence qui lève emporte le RÉSULTAT des autres — dont les mesures sont pourtant déjà écrites et les appels déjà payés —, et le dépôt reste sans retour »*.

**31. Ne transforme pas ce correctif en changement de garde.** *« Aucune décision n'en dépend — le plafond par dépôt se lit au nombre de lignes en base »* *(`07-` §2)*. **Deux gardes distinctes, et aucune ne passe par le bilan** : `controlerLaFacture(admin, config.plafondMensuelUsd)` *(`chaine.ts:115`)* pour la facture du mois, et `appelsDuDepot(admin, depotId)` *(`:121`, puis `depotAAtteintSonPlafond` à `:122`)* pour le plafond d'appels par dépôt. **Tu répares un chiffre de diagnostic. Les gardes, elles, marchent.**

### E · Ce qui est au mauvais endroit, ou en double

**32. L'opt-out : ce qui déménage, et ce qui ne bouge pas.** Le composant `app/prof/competences/OptOutClasses.tsx` va au profil de classe — **`app/prof/classes/[classeId]/page.tsx`, vue `?vue=competences`** *(la bascule se lit à la ligne 36 : `vueParam === 'competences'`)* ; **l'action `poserOptOut` — `app/prof/competences/actions.ts:194` — NE BOUGE PAS**. La source : *« le profil de la classe, au tableau de pilotage, porte l'opt-out »* *(`07-` §1.3)*.

**33. `competences_actives_par_classe` est la MÊME table, et elle ne se remplit pas à la main.** *« Elle ne se remplit pas à la main : une compétence déclarée `evaluee` l'est pour toutes les classes, et le profil de la classe, au tableau de pilotage, porte l'opt-out — la compétence qu'un cours ne travaille pas. La table enregistre ce choix ; le routeur le lit »* *(`07-` §1.3)*. ✓ **Rien ne t'attend** : C4-L2 la **lit** sans savoir d'où elle est écrite. **Le déménagement ne touche ni la table, ni l'action, ni le routeur.**

**34. La « zone en construction » : cinq colonnes inventées, et une règle qui décide de leur sort.** `components/pilotage/MatriceCompetences.tsx:12` porte `COMPETENCES_PLACEHOLDER = ['Analyser', 'Interpréter', 'Argumenter', 'Problématiser', 'Conceptualiser']`, et son encart *« Zone en construction »* est à la ligne 40 ; il est monté par `app/prof/classes/[classeId]/page.tsx:107` — **ce ne sont pas les six du référentiel**. Deux sources commandent : *« un onglet dont l'interrupteur est à OFF s'affiche, et son contenu dit pourquoi il est vide »* *(`07-` §5)*, et *« un écran n'affiche un nombre que si ce nombre compte quelque chose »* *(`06-` §5)*. ⭐ **Donc : un vide expliqué, jamais un onglet qui disparaît, et jamais cinq colonnes qui n'existent pas.** *L'écran est antérieur à C4 (`project_pilotage_classe`) — le corriger n'est pas le refaire.*

**35. La garde « référence validée » : deux endroits, mais PAS deux jointures identiques.** `app/prof/conception/actions.ts:129-138` lit `exercices_textes → exercices_references(validee_at)` **pour la source ET pour la cible, en boucle sur deux identifiants** ; `utils/examens/conception.ts:215 et :260` sélectionne `exercices_references(id, validee_at), scriptorium_contenus(texte_extrait)` sur un seul. ⭐ **La fonction partagée prend l'identifiant d'un texte et rend le verdict — elle ne recopie pas une jointure.** ⚠️ **Elle touche un fichier de C4-L8** : c'est prévu, c'est pour ça que l'item est ici. **Et les deux motifs de refus ne se fondent pas en un seul** : le §6 A veut que le motif **nomme la référence**.

**36. L'index redondant, et le rollback qui compte dessus.** `idx_exercices_planifie` *(`c4_l1_schema.sql:388`, non unique)* et `uk_exercices_planifie` *(`c4_l9_examens_diagnostiques.sql:215`, unique)* ont la même clé et le même prédicat. ⚠️⚠️ **`c4_l9_examens_diagnostiques_rollback.sql` compte explicitement sur le premier** : *« `uk_exercices_planifie` disparaît… `idx_exercices_planifie` (C4-L1, non unique) reste : les lectures continuent de marcher »*. **Si tu le retires, ce rollback devient faux, et il faut le dire — au fichier de rollback ou au `SUIVI_SQL.md`.** *« Retrait, ou jamais » : le second est une réponse légitime, à condition d'être écrite.*

**37. « cran NaN » à l'écran, et pourquoi l'arbitrage du `cran` ne le règle PAS.** `app/prof/conception/[id]/page.tsx:53` fait `const cran = Number(txt(e.cran))`, puis `d.crans[cran]` *(:55)* et affiche `cran {cran}` *(:114)*. ⭐ **Une instance d'examen diagnostique n'a pas de cran du tout** — pas « un cran dans l'autre forme » : **aucun**. **Unifier la forme du `cran` ne fera donc pas disparaître ce `NaN`** : il faut un cas *« sans cran »* à l'affichage. **Cosmétique** : le bloc d'assignation, par où passe la suite du flux, fonctionne — **ne le refais pas.**

### F · L'outillage, le gabarit et la base

**38. Le compte exact des tables, pour que ta preuve soit vraie.** `scripts/derive-doctrine.py --sql` vide et remplit **onze** tables nommées, plus il met à jour `exercices_types` *(`crans_admis`, `exclusions_parcours`, `libelle`)* — **douze écritures**. `--verifie` compare **dix** tables *(cinq en `COMPARAISONS`, cinq en « grandes tables »)* plus `exercices_types` — **onze verdicts**. ⭐ **La manquante est `exercices_types_crans`**, précisément celle où la couche type se remplit **aux crans de production** *(`04-` §14 : « aux crans 2, 6 et 8, `couverture_observables` vaut `exerce` »)*. **Ta preuve est douze verdicts, pas « le contrôle passe ».**

**39. Le chemin absolu est aux DEUX chaînes, et l'une des deux s'en sert comme d'un verrou utile.** `scripts/derive-doctrine.py` écrit `_derivation.racine` **dans la fixture que `--verifie` compare** ; `scripts/derive-instruments.py` écrit `racine_conception` dans `utils/chaine/derive/MANIFESTE.ts` *(ligne 114 du dérivé : `/Users/louissagnieres/Documents/GitTest/palimpseste-conception`)*. ⚠️ **Et `derive-instruments.py` REFUSE `--ecris` depuis une autre racine** — c'est délibéré, ça évite qu'une dérivation lancée d'ailleurs écrive le chemin d'un bac à sable. **Le correctif sort la racine de ce que le contrôle COMPARE ; il ne retire pas le refus, et il ne retire pas la trace de provenance.**

⚠️⚠️ **ET LA PREUVE PAR `npm test` EST UN PIÈGE À ELLE SEULE : AUJOURD'HUI, `npm test` PASSE DÉJÀ AILLEURS — EN SAUTANT LE CONTRÔLE.** `utils/chaine/instruments.test.ts:141-144` fait `if (!existsSync(RACINE_CONCEPTION)) { t.skip('dépôt de conception absent'); return }`, et `utils/chaine/branchements/expression.test.ts:95-96` saute de même ; **aucun test ne lance `derive-doctrine.py --verifie`**. Sur un runner d'intégration continue sans le dépôt de conception, le vert ne prouve **rien**. ⭐ **Ta preuve est donc précise : le dépôt de conception PRÉSENT, sous un autre chemin absolu que celui de la machine du professeur, et le test qui TOURNE — pas qui saute.** *Reformule la phrase du « fait quand » dans ce sens à ton relevé : « `npm test` passe sur une autre machine » veut dire « le contrôle de dérivation tourne et rend IDENTIQUE depuis une autre racine », pas « la suite est verte ».*

**40. `cran` entier ici, chaîne là — c'est le piège 11, vu par l'autre bout.** `exercices_crans.cran int` contre `exercices_types_crans.cran text`. **Rien ne casse tant que personne ne joint les deux tables** — et `utils/chaine/contexte.ts` les interroge déjà toutes les deux, avec deux types. **Tranche-le avec la forme du `cran`, dans le même geste.**

**41. Le gabarit en sections nommées : le découpage est DONNÉ, il ne s'invente pas.** `utils/chaine/derive/calame-retour.ts` rend aujourd'hui le gabarit **en un seul bloc**, `regles_verrouillees` et `sections_editables` n'étant que des métadonnées posées à côté. Le `07-` §4 tranche : *« les règles 1 à 6 et la règle 8 sont verrouillées, **la règle 7 est la seule ouverte** »*, et *« la dérivation émet le gabarit découpé en sections nommées »* — *« ici les défauts ne se recopient pas dans le code, ils viennent de la source »*. ⛔ **Le §4 est GELÉ. Tu l'appliques.**

**42. La `longueur` est un PARAMÈTRE, pas une variable.** *« Son domicile est un paramètre de plateforme, au même endroit que les interrupteurs (§5), NULL valant la règle 7 du gabarit »* *(`07-` §4)* — donc `scriptorium_params`, à côté des six interrupteurs. ⛔ **N'ajoute aucune variable au gabarit** : *« `{{...}}` ne désigne que ce que l'assembleur substitue : `{{COMPETENCE}}`, `{{MOMENT}}` et `{{REGISTRE}}`. **Il n'y en a pas d'autres.** »* Un remplacement de **section** n'est pas une substitution de variable.

**43. ⚠️⚠️ LA COLLISION DE NOM, ET C'EST UN MODE DE PANNE, PAS UNE HYPOTHÈSE.** `REGISTRE`, dans `utils/ia-commun.ts:13`, est le **registre de LANGUE** — le bloc de voix transversal, *« injecté dans TOUS les prompts »*. `{{REGISTRE}}`, dans le gabarit, est le **registre de RETOUR** — descriptif / interrogatif / démonstratif, élu par le `01-` §8.7. **Substituer l'un dans l'autre remplirait la règle 8 avec le bloc de langue** *(`07-` §4, mot pour mot : « substituer l'un dans l'autre est un mode de panne, pas une hypothèse »)*.

**44. Le `ton` se REÇOIT, il ne se recopie pas — et `rag_prompt_ton` n'est pas lui.** *« Le `ton` n'est pas propre au retour, et il n'a donc pas de domicile propre. C'est celui du fichier de personnalité partagé […] et la couche contrat le **reçoit**, elle n'en porte pas de copie »* *(`07-` §4)*. Aujourd'hui la couche contrat ne le reçoit pas. ⛔ **Et ne branche pas `scriptorium_params.rag_prompt_ton` dessus** : c'est la section éditable **du tuteur**, lue par `utils/scriptorium-rag.ts:72` et `app/prof/scriptorium/SectionParametresScriptorium.tsx:41`. Y accrocher le retour ferait exactement *« le second fichier de personnalité que le §4 interdit »*. **L'identité vit dans le fichier partagé ; chaque atelier n'écrit que son RÔLE.**

**45. ⭐ Le rejeu du banc fait PARTIE du correctif, et il se coche.** *« Toucher au bloc partagé diverge du prompt calibré au banc : rejouer ce banc fait partie du correctif, décoché tant qu'il ne l'est pas »* *(`07-` §2)*. ⚠️ **L'écran ne t'avertira pas** : le bandeau « recommandé : rejouer le banc » ne s'allume que sur une **édition du professeur** *(`rag_prompt_sections_maj`)*, **jamais sur un changement de défaut dans le code**. Et **le bloc partagé irrigue aussi les retours Aletheia** : le rejeu n'est pas propre à Codex. *Si le rejeu n'est pas jouable en séance, la ligne reste décochée à ta section du `SUIVI_tests_manuels.md`, avec sa condition de reprise nommée — c'est un dépôt de boîte aux lettres réussi.*

**46. ⚠️⚠️ LE `search_path` EST PROBABLEMENT DÉJÀ CLOS — VÉRIFIE AVANT DE JOUER QUOI QUE CE SOIT.** L'inventaire du `07-` §2 décrit l'état du **21/08 au matin** ; le `SUIVI_SQL.md` porte, **le 21/08 en bac à sable** :

- `securite_search_path_reste.sql` — ☑ exécutée : *« les **SEPT** à `search_path=public, pg_temp`, `divergent_encore = 0`, et aucun privilège n'a bougé »* ;
- `securite_handle_new_user_retrait.sql` — ☑ exécutée : *« il reste **SIX** fonctions `security definer` — **toutes** à `search_path=public, pg_temp` »*.

Et au `SUIVI_tests_manuels.md`, **`SEC-19` est déjà coché** — *« les cinq autres `security definer` alignées sur `public, pg_temp` »*.

⭐ **Donc : l'item de la famille F est très vraisemblablement fait, et le « fait quand » qui dit « les SEPT fonctions » compte une fonction qui n'existe plus.** **Ton geste ici est un CONTRÔLE, pas un chantier** : une requête sur `pg_proc` — combien de `security definer` dans `public`, et combien divergent — et **si `divergent_encore = 0`, tu coches avec ta requête pour preuve et tu ne joues rien**. ⚠️ **Si tu confirmes, c'est une source fausse** : `[faux]` au point de l'erreur du `07-` §2 et une ligne à la section DETTES du `INVENTAIRE_Non_Tranches.md`, avec l'avant et l'après. ⛔ **Ne recrée jamais une de ces fonctions par `create or replace`** : *« le `alter default privileges` de Supabase ferait renaître la fonction grantée »* — `alter function … set`, toujours.

**47. Et ce qui reste de cette séance-là n'est PAS de toi.** Le **smoke test** — *« créer un élève depuis l'écran professeur »*, après le retrait de `handle_new_user()` — est décoché au `SUIVI_tests_manuels.md` et **c'est un test de recette, pas un correctif**. Ne le joue pas à sa place ; **rappelle-le à ta clôture**.

### La conduite, les preuves, la clôture

**48. Ta boîte aux lettres est le `SUIVI_tests_manuels.md`, et elle est à ton manifeste.** ⭐ **NEUF items y vivent DÉCOCHÉS, sous leur nom** — lis-les, ils portent le détail que l'inventaire résume, et **coche-les là où ils vivent**, en plus de ta propre section :

`C4L3-20` *(la forme du `cran`, avec son compte de lignes)* · `C4L4-E` *(la cadence et `maxDuration`)* · `C4L5-18` *(la `cible_primaire`)* · `C4L5-19` *(`prompt_version`)* · `C4L5-20` *(le déclencheur, `maxDuration` et son commentaire)* · `C4L5-21` *(le `ton`, la `longueur`, le gabarit, la persona et le rejeu du banc)* · `C4L9-16` *(« cran NaN »)* · `C4L9-18` *(l'index redondant)* · `C4L9-19` *(la garde « référence validée »)*.

⚠️ **Deux de tes chantiers n'ont AUCUNE entrée décochée, et il faut donc que tu écrives la leur** — sans quoi ils resteront invisibles au `grep` : **le bilan qui perd les appels** *(famille D)* et **l'opt-out plus la zone en construction** *(famille E, dont le seul écrit est une note `ℹ️` sous `C4L8-2`, déjà coché)*. **Le contrôle de dérivation à onze tables** est de même : sa mention vit sous une ligne **cochée** du contrôle d'entrée de C4-L8-bis, *« hors périmètre : lot de correctifs »*. ⛔ **Et `SEC-12` n'est pas ton item** : c'est le balayage des vues, coché ; le tien est **`SEC-19`**, **coché lui aussi** *(voir le piège 46)*.

**49. Ce qui n'est PAS de toi, et qui reste au `PLAN_DE_CHANTIER.md` §6.** La **table de conversion 0-3 du Monitoring** et la **préférence de l'élève** : *« qui sont des décisions à prendre, pas des correctifs »*. La **dévalidation d'une référence qui ne défait pas les instances assignées** est **tranchée et assumée** — *« le message honnête suffit »* —, il n'y a rien à faire.

**50. Vérifié veut dire par requête et à l'écran, pas supposé.** Pour ce lot en particulier : **le repli alphabétique et le `NaN` ne se voient sur aucun test vert** — ils se prouvent en faisant traverser la chaîne à un dépôt réel **sur deux compétences**, et en lisant ce que le contexte rend. *Un lot de correctifs qui rend `npm test` vert sans avoir fait tourner la chaîne n'a rien prouvé.*

---

## Le « fait quand » — recopié du `07-Implementation.md` §2

> *Fait quand* : la **`cible_primaire` se déclare à l'écran et commande le retour** ; **`exercices.cran` porte une seule forme, sous contrainte**, et la chaîne ne rend plus jamais de champ vide sur une instance valide ; **`prompt_version` n'existe plus**, ni en colonne ni en écriture ; **quelque chose appelle la route de la chaîne** à une cadence déclarée, et **aucun job n'est plus tué en vol** ; le **bilan d'un dépôt compte les appels d'une compétence qui a levé** ; l'**opt-out est au profil de la classe** et la zone en construction **a un sort** ; le contrôle de dérivation lit ses **douze** tables ; **`npm test` passe sur une autre machine que celle du professeur** ; le **gabarit sort découpé en sections nommées**, la `longueur` a son paramètre, le `ton` partagé est reçu, et **le banc est rejoué** ; et les **sept fonctions `security definer` portent la même forme de `search_path`**.

C'est la condition de recette, et **elle ne se négocie pas en séance**. Six précisions qui n'en changent rien :

- **« commande le retour »** ne se prouve pas en lisant la colonne : il faut **un dépôt réel qui mesure DEUX compétences**, une `cible_primaire` posée sur la seconde par ordre alphabétique, et le retour qui parle **d'elle**. *C'est le seul cas où le défaut se voyait ; c'est donc le seul cas qui prouve la réparation.*
- **« ne rend plus jamais de champ vide sur une instance valide »** se lit à la sortie de `utils/chaine/contexte.ts` : `cran`, `cranCode`, `regimeV1vf`, `servable` et `patronProduction` **tous les cinq renseignés**, sur une instance de chacune des deux formes d'avant la conversion.
- **« aucun job n'est plus tué en vol »** se prouve **par le compteur**, pas par l'absence d'erreur : une invocation qui traite *n* jobs doit avoir réclamé *n* jobs, et `tentatives` ne doit avoir bougé que d'un par job **abouti ou légitimement échoué**.
- **« le contrôle de dérivation lit ses douze tables »** : douze verdicts à la sortie de `--verifie`, `exercices_types_crans` comprise — **et le douzième doit pouvoir échouer**. Casse-le exprès une fois *(une ligne modifiée à la main, puis rendue)* et regarde s'il tombe : un contrôle qu'on n'a pas vu échouer n'est pas un contrôle.
- **« `npm test` passe sur une autre machine »** : pas « devrait passer », et surtout **pas « la suite est verte »**. Aujourd'hui elle l'est déjà ailleurs, **parce que le contrôle SAUTE quand le dépôt de conception est absent** *(piège 39)*. **Ta preuve est le test qui TOURNE depuis une autre racine absolue et rend IDENTIQUE** — donc : copie le dépôt de conception sous un autre chemin, pointe-le, et colle la sortie du contrôle, pas celle du runner.
- **« les sept fonctions »** — voir le **piège 46** : il y en a **six** depuis le retrait de `handle_new_user()`, et elles portent déjà la même forme. **Vérifie, puis coche ou joue** ; ne joue pas parce que la phrase le dit.

**Vérifié veut dire par requête et à l'écran, pas supposé.**

---

## Les conventions — `PLAN_DE_CHANTIER.md` §5

**Trois conventions de dépôt.** Les deux premières valent pour tout lot qui touche la base :

- **Une ligne au `SUIVI_SQL.md` avant exécution**, jamais après — et **bac à sable d'abord** *(protocole, règles 1 et 2)* ; **ne rejoue jamais un fichier de l'Archive** *(règle 4)* ; **répétition à blanc : copie le CORPS du fichier, jamais le fichier entier**, puis **vérifie par requête** le retour à l'état d'avant *(règle 6)*. ⚠️ **Protocole renforcé** : à la lettre, la règle 5 vise les **flux existants** *(Aletheia, Fragments, Quazian, Codex, auth)* et **exempte les migrations additives et gatées de C3/C4/C5** — mais le journal l'a déjà étendue, et il dit pourquoi : *« protocole renforcé (règle 5) sur ce geste : `exercices` porte des lignes de recette »* *(entrée de C4-L9)*. **Ta conversion de `cran` est dans ce cas** *(piège 15)*.
- **Les migrations sont additives et gatées** — les interrupteurs restent à **OFF** jusqu'à la recette, et tu les **re-constates** à la fin. ⚠️ **Deux de tes gestes ne sont pas additifs** — le `drop column` de `prompt_version` et le `drop index` éventuel : ils ont chacun leur `*_rollback.sql`, et le relevé dit ce que le rollback ne rend pas *(piège 20)*.
- ⭐ **La doctrine en base est DÉRIVÉE, jamais tapée, et il n'y a qu'un dériveur.** Avant de lire ses tables, joue `python3 scripts/derive-doctrine.py --verifie` : il doit dire **IDENTIQUE** sur les onze tables, les empreintes de source et la fixture. **S'il dit DIVERGE, rejoue `--sql` ; jamais corriger la base à la main.** ⚠️⚠️ **Et pour ce lot, le dériveur n'est pas seulement un préalable : il est l'objet de deux chantiers.** Le contrôle à onze tables *(piège 38)* et le chemin absolu *(piège 39)* le modifient. **Joue `--verifie` avant de toucher au script, et après** — et prends garde à ne pas prendre pour une divergence de doctrine ce qui n'est que ton propre changement de contrôle.

**Une convention de clôture.** Ajoute **ta section au `SUIVI_tests_manuels.md`** — ce qui a été prouvé en séance, **coché avec sa preuve**, et ce qui **reste à jouer en recette**, décoché **avec sa condition de reprise nommée**. ⭐ **Et coche aussi, là où ils vivent, les onze items nommés du piège 48** : ils ont été écrits pour être retrouvés d'un `grep`, pas pour être recopiés. *Un reste de recette qui ne vit que dans un relevé ne se rappelle à personne.*

**Une convention de dette.** Une source trouvée **fausse** se marque, elle ne se corrige pas : **`[faux]`** au point de l'erreur, **plus une ligne à la section DETTES** du `INVENTAIRE_Non_Tranches.md`, avec l'avant et l'après. *Le `07-` §1 et le `07-` §5 font exception — ils sont ouverts à l'implémentation et s'écrivent depuis ton relevé ; **le §4, le §3, le §6 et la règle de manifeste du §2 sont gelés**, et le §4 est à ton manifeste.* ⚠️ **Tu as déjà un candidat, et il est nommé : le piège 46.**

*La convention d'ouverture de compétence — les trois gestes de `utils/chaine/LISEZ-MOI.md` — n'a pas d'objet ici : ce lot n'ouvre aucune compétence. Mais **il rejoue `derive-instruments.py`** pour le gabarit découpé en sections nommées *(piège 41)* : `--ecris`, puis l'import du dérivé.*

⚠️⚠️ **ET UNE DIVERGENCE T'ATTEND AVANT QUE TU AIES RIEN TOUCHÉ — ne la prends pas pour la tienne.** Les dérivés de `utils/chaine/derive/` sont épinglés sur le `07-Implementation.md` **v2.34** *(`MANIFESTE.ts:119`, `calame-retour.ts:30`, avec leur empreinte de source)* ; **la source est à v2.35**. `derive-instruments.py --verifie` dira donc **DIVERGE dès le premier appel**. ⭐ **Le geste est `python3 scripts/derive-instruments.py --ecris`, et il appartient à ta séance** — c'est le seul endroit du chantier d'où il se joue, la racine de conception étant en chemin absolu. **Constate la divergence AVANT, joue `--ecris`, et vérifie que le seul écart du dérivé est celui que tu voulais** *(les sections nommées)* **plus le rattrapage de version.**

---

*Prompt fabriqué le 22/08/2026 selon la recette du `PLAN_DE_CHANTIER.md` §5. Épinglé sur le `07-Implementation.md` **v2.35**, le `01-routeur.md` **v5.5**, le `02-exercices.md` **v5.4**, le `04-Instances_Exercices.md` **v3.2** et le `06-Palimpseste.md` **v2.6**. Relis les lignes VERSION avant de lancer : une séance parallèle peut les avoir déplacées.*
