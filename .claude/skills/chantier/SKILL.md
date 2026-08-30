---
name: chantier
description: État et conduite du chantier Palimpseste de la rentrée 2026 — la file de ce qui reste, les protocoles qui évitent les dégâts, et les quatre campagnes de revue. À invoquer quand Louis dit « on continue le chantier », « qu'est-ce qui reste », « lance la revue », ou dès qu'une séance touche à la file des correctifs, aux relevés de lot, au SUIVI_tests_manuels, au registre des ouverts, ou à une écriture en production.
version: 1.0.0
---

# Le chantier Palimpseste — état, file, protocoles

> ✅⭐ **`C-RLS-4`, LA FUITE QUAZIAN, EST FERMÉE — 29/08, `72561ce` + `c_rls_4_quazian_reponse.sql`,
> joué SANDBOX ET PROD.** Elle a été **éprouvée avant d'être corrigée**, dans la peau d'un élève réel :
> `scripts/recette/rls-quazian-c-rls-4.mjs` passe de **3 FAIL / sortie 1** à **4 PASS / sortie 0**.
> ⛔⛔ **Et la mesure a trouvé plus large que le constat : il y avait DEUX policies, et la pire ne
> vérifiait pas la classe** — n'importe quel élève lisait les réponses de n'importe quel quizz de la
> plateforme ; les policies étant **OR'ées**, *n'en retirer qu'une n'aurait rien fermé*. ✅ **ET LE SMOKE ÉLÈVE EST JOUÉ** *(29/08,
> décor `scripts/recette/decor-quizz-lance.mjs`, semé puis retiré, base revenue à l'identique)* : les
> quatre fonctions à **zéro passage** ont tourné, note posée **14,35/20**, et **79 Ko de page inspectés
> sans une occurrence** de la bonne réponse. ⛔⛔ **Il a trouvé TROIS défauts qu'aucun test ne voyait**
> *(`C-RLS-4-bis` au SUIVI)*, dont le pire : **le client jetait le retour de l'action** — le serveur
> refusait, l'écran affichait « Quizz soumis ! », et l'élève serait parti. **C'est l'argument du smoke,
> mesuré une fois de plus.**
>
> ⭐ **CE QUI VIENT ENSUITE** : les **six constats restants de la campagne C** *(§2, item 3)* — aucun
> n'a d'échéance, et **chacun se MESURE d'abord** ; puis les campagnes **B → A → D** *(§4)*.

---

⛔ **Rien ici ne remplace une vérification.** Cet état est daté du **2026-08-29**. Chaque
chiffre a été mesuré ce jour-là ; il a pu bouger. **Devant une anomalie de données, lire la
donnée d'abord.**

---

## 1. L'état, au 2026-08-29

**La plateforme est EN PRODUCTION et elle sert des élèves.** Ce n'est plus « avant la recette » :
les six interrupteurs sont à **ON dans les deux bases**, par **décision écrite** *(`07-` §5, v2.60,
27/08)*. Tout verdict de relevé qui dit « coût nul, rien n'est servi » est **périmé**.

| | |
|---|---|
| prod | `ucmngachkxvvlegntuwh` · **62 élèves**, 4 classes actives, toutes avec `type_pedagogique` |
| bac à sable | `aoakpxxlyvthzueaywna` |
| prod, au 29/08 | 184 mesures · 168 lignes de niveau · 86 dépôts · **0 `routeur_decisions`** |
| `origin/main` | ⛔ **aucun numéro ici : il se périme en heures.** `git fetch && git log --oneline -5 origin/main`.
  *Deux mesures le 29/08 : `340abd7` avait **12 commits** de retard le soir même, et le `2363e4b`
  qui l'a remplacé était faux **vingt minutes** plus tard — une séance voisine écrit le même arbre.* |

**Les segments de l'année, lus au calendrier réel de prod** *(32 semaines de cours)* :
S1 `2026-08-24` *(diagnostic, hors routage)* · **S2 `2026-08-31`** *(calibration, 2 sem.)* ·
**S3 `2026-09-14`** *(amorce, 9 sem.)* · S4 `2026-11-23` · S5 `2027-02-08`.

**Trois échéances qui ne se rattrapent pas** :
- **lundi 2026-09-07** — premier comptage d'assiduité réel *(`C4L13-14`, coût irréversible)* ;
- **lundi 2026-09-14** — la clôture de la calibration bascule `profil_provisoire`. L'écrivain est
  posé *(28/08)*, il se déclenche **sur l'état** *(segment ≥ 3)* et non sur une date, donc il
  rattrape un lundi manqué. **Avant ce jour, aucune lettre ne s'affiche à aucun élève.**
- **avant le Run 1** de chaque compétence — après le premier run, réviser un prompt devient un acte
  de calibration réglé par protocole. Quatre items y sont adossés *(voir §2)*.
- ~~**avant le PREMIER QUIZZ lancé de l'année**~~ — ✅ **LEVÉE le 29/08** : la fuite Quazian
  *(`C-RLS-4`)* est fermée dans le code **et** dans les deux bases. ⚠️ La note d'inertie du constat
  d'origine **était fausse pour le bac à sable** *(les 5 questions n'y étaient pas orphelines : elles
  pendent à un quizz `ferme`, et la sonde a bien lu leurs réponses)* — **0 quizz** ne valait que pour
  la PROD. *Une inertie se mesure base par base.*

**Les deux registres** : `SUIVI_tests_manuels.md` *(~101 cases décochées ; c'est la boîte aux
lettres de la recette)* et `INVENTAIRE_Non_Tranches.md` *(dépôt de conception ; 57 items + 9 dettes)*.
⚠️ **Trois entrées du registre sont périmées et vérifiées** : item **57** *(la chaîne descend la
référence depuis le 23/08)*, item **66** *(le marquage existe depuis C4-L15, et il est en prod)*, et
le chapitre **C11b** *(la prod existe depuis le 25/08)*.

---

## 2. La file, dans l'ordre

⛔ **Cette file s'est périmée en quelques heures la première fois — remesure-la avant de t'y
fier.** L'item 1 d'origine *(`C6L2-31`)* était **déjà corrigé et poussé** quand la séance suivante
l'a ouvert : `git fetch` puis `git log <commit du skill>..HEAD` **avant de choisir un item**.

1. ~~**Le CRLF des `<textarea>`**~~ — ✅ **FERMÉ LE 29/08, et ce n'était PAS « une ligne »** :
   **11 sites, 6 fichiers**, tous par `normaliserRetours`. ⛔ **Corriger la seule garde annoncée
   aurait fabriqué un bug** — `creerContenu` écrit le même champ sans normaliser, et les deux côtés
   dérivaient ENSEMBLE. ⭐ Épreuve sur la donnée réelle : garde déclenchée à tort **6/6 → 0/6**, et
   contre-épreuve que la garde **parle encore** sur un vrai changement. ⭐ Script au dépôt :
   `scripts/recette/crlf-textarea.mjs --epreuve`. ⭐ **0 `\r` en base des deux côtés** : c'était de
   la prévention, pas de la réparation.
2. **Les trois items « avant le Run 1 » qui restent** *(voir §5)* — ⛔ **aucun n'est du code** :
   ce sont un prompt dérivé d'une fiche, une décision de module, et un arbitrage de Louis. Une
   séance Code ne les joue pas ; **le quatrième, D4, est payé** *(29/08)*.
3. **Les RESTES de la campagne C** *(jouée le 29/08 — voir §4 et la section « Campagne C » du
   `SUIVI_tests_manuels.md`)*. ✅ **`C-RLS-4` est fermé** *(29/08, les deux bases)* ; **aucun des six restants n'a d'échéance.**
   · **à éprouver** : `C-RLS-5` *(UPDATE `fragments_depots` ouvert → l'élève blanchit ses marques
   d'anti-triche)* · `C-RLS-6` *(policy INSERT `profiles` sans `role='eleve'`)* · `C-RLS-7` *(tuteur :
   module vérifié sur l'UNION des classes, pas LA classe)* · `C-RLS-8` *(`garderEleve` ne lit pas le
   rôle)* · `C-RLS-9` *(calendrier : quizz à classe effacée non écarté)*. · **dettes d'outillage** :
   `C-RLS-10` *(22 tables élève sur 89 sans policy traçable)* · `C-RLS-11` *(la sonde n'éprouve que
   8 tables, et son test d'escalade `profiles` rate le cas dangereux)*. **Chacun se MESURE d'abord :
   plusieurs sont « garde absente » dont le coût réel reste à établir.**
4. **Les campagnes de revue B, A, D** *(§4)*, dans l'ordre **B → A → D** *(C est jouée)*.
5. **La passe du registre des ouverts** — rayer les trois entrées périmées quand la séance voisine
   aura rendu le fichier.

---

## 3. Les protocoles — ils sont là parce qu'ils ont chacun coûté quelque chose

**⛔ `git add -A` est INTERDIT.** L'arbre porte en permanence le travail d'autres séances. On stage
**fichier par fichier**, et on relit `git status --short` avant chaque commit. *Un `add -A` a
emporté trois fichiers d'une autre séance le 29/08 ; réparé par `reset --soft` + désindexation.*

**⛔ On ne commite jamais le travail d'une autre séance.** Si git ne peut pas séparer *(deux séances
dans le même fichier)*, on commite quand même **et le message le dit**. Si git peut séparer, on fait
**deux commits**, dont un nommé « d'une autre séance, porté tel quel ».

**⭐ Vérifier plutôt que croire.** La prod se lit en lecture seule : `.env.local` porte
`PROD_SUPABASE_URL` + `PROD_SUPABASE_SECRET_KEY`, PostgREST au `curl`. **Un relevé n'est pas un
état.** Quinze cases du SUIVI ont été fermées le 28/08 en confrontant les relevés au dépôt.

**⚠️ `supabase-js` ne lève pas.** Il rend `{ error }`. Une écriture ignorée échoue en silence ; une
**lecture mal posée se lit comme une réponse négative**. Tout `select` passe par un
`lu(nom, {data, error})` qui **lève**. *Ce piège a fait rougir trois recettes pour rien, et il a
caché une colonne inexistante dans un script d'épreuve le 29/08.*
Il **plafonne aussi toute réponse à 1000 lignes sans rien signaler** → paginer, ordonner sur une clé
unique, et **confronter au `count: 'exact'`**.

**⭐ Constat avant écriture, registre avant tout geste.** Un script qui écrit commence par un mode
**constat** qui n'écrit rien, et pose **l'état AVANT sur le disque** avant la première écriture.
Le registre est **gitignoré** quand il porte des identifiants d'élèves.

**⛔ Sandbox d'abord, prod ensuite** *(`SUIVI_SQL.md`, règle R6)*. Une écriture en prod demande un
**drapeau explicite en plus** du mode écriture.

**⭐ L'épreuve par l'échec avant l'épreuve par le succès.** Un correctif se prouve en remettant une
ligne dans son état d'avant et en constatant que le défaut revient. *C'est ce qui a montré, le
29/08, que la garde qui levait était celle du dépôt et non PostgREST — et que ce qu'elle empêchait
était pire qu'un refus.*

**⭐ Une décision n'est pas un reste de recette.** Quand le geste d'une ligne est joué et qu'il n'en
reste qu'un arbitrage, la ligne se **coche** et l'arbitrage part au registre des ouverts.

**⚠️ Amender le `07-Implementation.md` casse `npm test`** — ses dérivés portent sa version et son
empreinte. Le geste : `python3 scripts/derive-instruments.py --racine <conception> --ecris`, **joué
EN DERNIER**, après tous les amendements. *Le dépôt de conception ne se commite que sur demande
explicite : il mêle plusieurs séances non commitées dans les mêmes fichiers.*

**⚠️ Pousser, c'est déployer.** `main` est déployé par Vercel.

**⭐ La convention de couture** *(`PLAN_DE_CHANTIER.md` §5)* : tout lot qui succède à un autre
**éprouve la couture avec le lot dont il dépend**, par exécution, et laisse son script au dépôt.
*Elle a trouvé la porte de mode manquante (39 copies protégées), le motif qui n'allait nulle part,
et le `classe_id` du vivier.*

---

## 4. Les quatre campagnes de revue

⛔ **Ne pas réviser lot par lot, et surtout pas dans la conversation d'implémentation** : l'auteur se
relit, son contexte est périmé, et c'est le plus cher pour le moins de rendement. **Réviser par
AXE, une fois, contre un commit TAGUÉ** — `git tag -a revue-c4c6 -m "…"` au début, et chaque brief
dit « tu tournes contre ce tag ».

Dans ce dépôt, **tout ce qui a été trouvé de sérieux l'a été en EXÉCUTANT**, jamais en lisant.

| axe | quoi |
|---|---|
| ~~**C · RLS et exposition élève**~~ | ✅ **JOUÉE LE 29/08** *(tag `revue-c-rls`)*. Le fait qui commande : **25 fichiers élève sur 81 utilisent `createAdminClient()`** — RLS contournée, seule protection = le filtrage du code. **61 constats, 47 sains, 14 chauds, 3 défauts réels ÉPROUVÉS, 3 corrigés.** ⛔ La pire est une **ÉCRITURE croisée** — un élève fabrique une accusation de collage sur le dépôt d'un autre *(prouvée en base puis restaurée)*. ✅ **La fuite Quazian est FERMÉE le 29/08** — et sa correction a montré que **le constat sous-estimait le défaut** *(deux policies, dont une SANS contrôle de classe)* et que **son inertie ne valait que pour la prod**. Reste au SUIVI : 6 constats à éprouver + 2 dettes d'outillage *(la sonde ne couvre que 8 tables sur 89)*. |
| **B · Les gardes de la base** | Sondage en transaction annulée, **sandbox ET prod**. Le **Tas 1** de la dette C4-L8 est entier : **A1** *(le rejeu après rollback rouvre `poser_statut_recette` à `anon`)* · **A3** *(`garde_cas_de_la_paire`, un défaut déjà en base)* · **A4** *(antidatage ET postdatation du statut de recette)* · **C14** *(`4.0`, et `{"cran": true}` lu comme le cran 1)*. ⚠️ `garde_cas_de_la_paire` est `INITIALLY DEFERRED` : sans `set constraints all immediate`, une sonde en rollback **mesure le vide**. |
| **A · Les ports Python ↔ TypeScript** | La veine la plus riche : **huit écarts de langage** trouvés en six portages, chacun par le portage *suivant*. Un harnais différentiel sur les six branchements + `verifie-import` + `verifie-reference`, plus l'épreuve par mutation là où elle n'a pas été faite *(la Synthèse a eu **11 survivantes sur 59** au premier passage)*. |
| **D · Les coutures** | ⭐ **Restreint à C4-L1 → C4-L16**, joués avant la convention de couture. C5 et C6 l'ont appliquée et ont leurs scripts au dépôt. |

**Le protocole de campagne** : un sous-répertoire de scratchpad **par agent** *(deux agents s'étaient
écrasé un fichier)* · aucune écriture hors du rapport · et **un TRI obligatoire après chaque
campagne**, en quatre champs — *reproduit ? · déjà arbitré ? · ⭐ ce que ça coûte et à qui, un
scénario concret ou l'aveu qu'il n'y en a pas · les issues*. **Sans ce tri, une revue gonfle
l'arriéré au lieu de le réduire** : la séance d'instruction de C4-L8 a sorti **7 constats sur 14**.

---

## 5. Les items « avant le Run 1 » — un payé, trois qui ne sont pas du code

✅ ~~`C4L10C-23` **D4**~~ — **PAYÉ LE 29/08.** `pre_p1` des deux modules reçoit désormais le
contexte, sur le patron que leur propre `code1` portait déjà — **deux lignes chacun**. ⭐ **La
condition de reprise a été mesurée ouverte, pas supposée** : le dépôt de conception porte **7
manifestes en tout**, tous du 30-31/07, **tous `module: ABSENT`**, **aucun ne hache un `code.py`** —
donc aucun run n'est rendu incomparable. ⭐ **Éprouvé par la porte du banc elle-même**
*(`verifie_slots_p1`, le contrôle au chargement)* : lève sur les modules d'avant, passe sur ceux
d'après. ⭐ **Le canal a changé, pas le calcul** — sortie identique octet pour octet, `VERSION`
inchangée. ⛔ *Le dépôt de conception n'a PAS été commité.*

⛔ **Les trois qui restent ne se jouent pas depuis une séance Code** — c'est leur point commun, et
c'est ce qui les distingue de D4 :

✅ ~~`C4L10A-14` **D2**~~ — **PAYÉ LE 29/08, fiche en 4.4.** ⛔⛔ **Et il avait déjà TIRÉ en production** : `garant_ambigu` et `garant_vague` à **0 sur 53 mesures / 53**, 52 élèves, zéro variance. ⚠️⚠️ **C'est Louis qui l'a signalé** — j'avais conclu « aucun run » en ne mesurant que le BANC, pas la PLATEFORME. **Mesurer les deux.** ⭐ Rattrapé sans réparation : fenêtre d'évidence de **4**, une seule mesure par élève, corrigé avant l'ouverture du segment 2. ⭐ Le code n'était pas en cause — **aucun test ne peut vérifier ce qu'un modèle choisit d'émettre**. ⭐ Variante propre (champ `marque`) portée à **2027**.

⭐⭐ **LES DEUX QUI RESTAIENT ONT ÉTÉ MESURÉS EN PRODUCTION LE 29/08** — en REJOUANT
`BRANCHEMENT_STRUCTURE.code1/code2` sur les **52 squelettes réels**, jamais en réimplémentant
*(`scripts/recette/structure-population.ts`)*. **Le banc et la production ne disent pas la même
chose, et c'est la leçon.**

✅ ~~`C4L10S-18`~~ — **SANS OBJET en production.** `relation_nommee` illisible **0/109** *(banc :
68/112, mais « sur les squelettes d'avant la v1.4 »)* ; **0 copie sur 52** où les deux lectures
divergent. L'arbitrage de Louis **ne bloque plus rien** et redevient de l'hygiène de source.

⚠️ `C4L10S-19` — **trois replis muets, et le quatrième est celui que le banc n'avait jamais vu** :
`role` hors catalogue, **5 blocs / 161, sur 2 copies**. Cause nommée : P1 met `role: "service"`, qui
est une valeur de `correspondance_annonce` ; des lignes d'en-tête *(« Nom de l'élève », « Titre de
l'essai »)* sont comptées en **blocs de développement**. `bloc_unite` **0,2 au lieu de 1**. ⭐ **La
lettre ne bouge pas** — c'est de la télémétrie — **mais la télémétrie pilote l'escalade N1/N2**.
✅ **La CAUSE est corrigée le 29/08** *(fiche 3.4 : la liste `# ORTHOGRAPHE DES VALEURS` mêlait à
plat les valeurs de trois champs)*. ⛔ **L'ALERTE reste due** — c'est une décision de MODULE, donc un
acte de calibration.

---

## 6. Les gestes qui marchent

```bash
# les quatre dérivations, avant de s'appuyer sur quoi que ce soit
python3 scripts/derive-doctrine.py    --racine <conception> --verifie
python3 scripts/derive-instruments.py --racine <conception> --verifie

# un script de recette / de réparation
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
     --import ./scripts/register-calibration-resolver.mjs scripts/recette/<x>.mjs
```

⚠️ **Ne jamais lancer `next build` pendant `next dev`** *(corrompt le cache `.next`)*.
⚠️ **`utils/aletheia-retours.ts` est invisible à `grep`** *(octets NUL)* → toujours `grep -a`.
