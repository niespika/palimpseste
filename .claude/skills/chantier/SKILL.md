---
name: chantier
description: État et conduite du chantier Palimpseste de la rentrée 2026 — la file de ce qui reste, les protocoles qui évitent les dégâts, et les quatre campagnes de revue. À invoquer quand Louis dit « on continue le chantier », « qu'est-ce qui reste », « lance la revue », ou dès qu'une séance touche à la file des correctifs, aux relevés de lot, au SUIVI_tests_manuels, au registre des ouverts, ou à une écriture en production.
version: 1.0.0
---

# Le chantier Palimpseste — état, file, protocoles

> ⭐⭐⭐ **CE QUI COMMANDE MAINTENANT, CE SONT LES DATES — la campagne C est finie.**
> Nuit du 29 au 30/08 : **cinq constats fermés et poussés** *(`C-RLS-4`, `5`, `6`, `7`, et `C-RLS-12`
> trouvé hors liste)*, chacun **éprouvé avant d'être corrigé** et **smoké** quand il touchait un
> chemin élève. Il ne reste de la campagne **aucun item daté** *(§2, item 3)*.
>
> ⛔⛔ **CE QUI RESTE, EN REVANCHE, NE SE RATTRAPE PAS** *(§1)* : l'ouverture de la semaine Fragments,
> le segment 2, **le comptage d'assiduité du 31/08** *(et non du 07/09 : le skill s'est trompé d'une
> semaine — voir §1)* et la bascule de `profil_provisoire` du **14/09**.
> **C'est là qu'une séance doit aller en premier**, pas dans les campagnes de revue.
>
> ⭐⭐ **LA LEÇON DE LA NUIT, ET ELLE VAUT POUR TOUTE LA SUITE — un constat SOUS-DÉCRIT presque
> toujours son défaut.** Quatre fois sur cinq, la mesure a trouvé plus large ou ailleurs :
> **deux** policies là où le constat en nommait une *(et la seconde ne vérifiait pas la classe)* ·
> une inertie vraie en prod et **fausse en bac à sable** · un vecteur **à l'INSERT** quand le constat
> visait l'UPDATE · et **le pire défaut de la nuit n'était dans aucun constat** *(`C-RLS-12`, le
> re-dépôt Fragments qui détruisait les photos, à 24 h de tirer sur 40 élèves)*.
> ⭐ **`pg_policies` fait foi, jamais les `.sql` du dépôt. Et une inertie se mesure BASE PAR BASE.**

---

⛔ **Rien ici ne remplace une vérification.** Cet état est daté du **2026-08-30**. Chaque
chiffre a été mesuré ce jour-là ; il a pu bouger. **Devant une anomalie de données, lire la
donnée d'abord.**

---

## 1. L'état, au 2026-08-30

**La plateforme est EN PRODUCTION et elle sert des élèves.** Ce n'est plus « avant la recette » :
les six interrupteurs sont à **ON dans les deux bases**, par **décision écrite** *(`07-` §5, v2.60,
27/08)*. Tout verdict de relevé qui dit « coût nul, rien n'est servi » est **périmé**.

| | |
|---|---|
| prod | `ucmngachkxvvlegntuwh` · **62 élèves**, 4 classes actives, toutes avec `type_pedagogique` |
| bac à sable | `aoakpxxlyvthzueaywna` |
| prod, au 30/08 | **187 mesures · 171 lignes de niveau · 86 dépôts · 0 `routeur_decisions`** *(remesuré ; c'était 184/168 le 29/08 — ces chiffres bougent, les relire)* |
| `origin/main` | ⛔ **aucun numéro ici : il se périme en heures.** `git fetch && git log --oneline -5 origin/main`.
  *Deux mesures le 29/08 : `340abd7` avait **12 commits** de retard le soir même, et le `2363e4b`
  qui l'a remplacé était faux **vingt minutes** plus tard — une séance voisine écrit le même arbre.* |

**Les segments de l'année, lus au calendrier réel de prod** *(32 semaines de cours)* :
S1 `2026-08-24` *(diagnostic, hors routage)* · **S2 `2026-08-31`** *(calibration, 2 sem.)* ·
**S3 `2026-09-14`** *(amorce, 9 sem.)* · S4 `2026-11-23` · S5 `2027-02-08`.

**LES ÉCHÉANCES — c'est ce qui commande la file** *(état mesuré au 2026-08-30)* :
- ⛔ **la semaine Fragments** — première `date_limite` au **2026-08-31 03:59 UTC**, et elle est
  **FERMÉE** *(`ouverte = 0` en prod)*. **L'ouvrir est un geste de Louis**, pas du code. **40 des
  62 élèves** ont Fragments *(1HLP 24 + THLP 16)*. ⭐ Le re-dépôt destructeur *(`C-RLS-12`)* est
  corrigé et smoké **avant** cette ouverture — il aurait tiré au premier remplacement.
- **le segment 2** *(calibration)* s'ouvre le **2026-08-31**. `routeur_decisions` : **0 ligne** en
  prod au 30/08.
- ⛔⛔ **lundi 2026-08-31, 09:30 UTC — LE PREMIER COMPTAGE D'ASSIDUITÉ RÉEL, et ce skill a
  longtemps dit le 07/09 : C'ÉTAIT FAUX D'UNE SEMAINE.** Le cron compte la semaine **ÉCOULÉE** :
  celui du 31/08 compte le **24/08**, qui est dans le semestre *(vérifié : 0 vacance la couvrant,
  semestre actif 2026-08-24 → 2027-01-10)*. **Il écrira 62 lignes** — une par élève actif.
  *Le coût irréversible tombe donc une semaine plus tôt que ce qui était écrit.* `assiduite_hebdo` :
  **0 ligne** en prod au 30/08. ⭐ **Le geste de vérification, le lundi : recompter `assiduite_hebdo`
  après 09:30 UTC. S'il reste à 0, le cron a échoué** — et le 0 d'avant ne prouvait rien, la seule
  semaine écoulée jusque-là *(17/08)* tombant hors semestre.
- ✅ **L'authentification des crons est PROUVÉE** *(30/08, tableau de bord Vercel)* : `CRON_SECRET`
  existe, scopée **« Production and Preview »**, les crons sont **Enabled**, et surtout
  **`/api/chaine` rend `200` toutes les minutes** contre la production — même garde
  `Authorization: Bearer`, donc la chaîne fonctionne de bout en bout. ⭐ **Ce raccourci évite
  d'attendre le lundi pour savoir** : le cron d'une minute est le témoin de celui de la semaine.
- **lundi 2026-09-14** — la clôture de la calibration bascule `profil_provisoire`. L'écrivain est
  posé *(28/08)*, il se déclenche **sur l'état** *(segment ≥ 3)* et non sur une date, donc il
  rattrape un lundi manqué. **Avant ce jour, aucune lettre ne s'affiche à aucun élève** — mesuré :
  `competences_niveaux` = **171 lignes, 171 en `profil_provisoire`**.
- **avant le Run 1** de chaque compétence — après le premier run, réviser un prompt devient un acte
  de calibration réglé par protocole. ⭐ **Trois des quatre items sont soldés** ; reste
  `C4L10S-19`, qui est une décision de module *(§5)*.
- ~~**avant le PREMIER QUIZZ lancé de l'année**~~ — ✅ **LEVÉE le 29/08** *(`C-RLS-4`, code + les
  deux bases, smoke élève joué)*. ⚠️ La note d'inertie du constat d'origine **était fausse pour le
  bac à sable** — **0 quizz** ne valait que pour la PROD. *Une inertie se mesure base par base.*

**Les deux registres** : `SUIVI_tests_manuels.md` *(**98** cases décochées au 30/08 ; c'est la boîte
aux lettres de la recette)* ⚠️ **et ce nombre SURESTIME d'environ un facteur 4** : sur 23 smokes
réels, **9 ne sont plus dus** — voir l'item 5 du §2 et `INVENTAIRE_Non_Tranches.md` *(dépôt de conception ; 57 items + 9 dettes)*.
⚠️ **Trois entrées du registre sont périmées et vérifiées** : item **57** *(la chaîne descend la
référence depuis le 23/08)*, item **66** *(le marquage existe depuis C4-L15, et il est en prod)*, et
le chapitre **C11b** *(la prod existe depuis le 25/08)*.

---

## 2. La file, dans l'ordre

⛔ **Cette file se périme en heures — remesure-la avant de t'y fier.** Le geste : `git fetch`, puis
`git log <commit du skill>..HEAD`, **avant de choisir un item**. *Deux fois déjà, l'item 1 était
déjà fermé quand la séance suivante l'a ouvert.*

⭐ **L'ordre a changé le 30/08 : ce sont les DATES qui commandent, plus les campagnes.**

1. ⛔⛔ **CE QUI A UNE ÉCHÉANCE** *(le détail et les chiffres au §1)* — l'ouverture de la semaine
   Fragments, le segment 2, le **31/08** *(premier comptage d'assiduité, coût irréversible — **PAS** le 07/09 : le cron compte la semaine ÉCOULÉE)* et le
   **14/09** *(bascule de `profil_provisoire` — avant ce jour **aucune lettre ne s'affiche**)*.
   **Mesurer l'état de chacun AVANT de conclure quoi que ce soit** : `assiduite_hebdo`,
   `routeur_decisions` et `quazian_quizzes` étaient tous à **0 ligne en prod** au 30/08.
2. **Les restes de la campagne C — QUATRE entrées, aucune datée** *(§4)*.
   · **`C-RLS-8`** *(`garderEleve` ne lit pas le rôle)* et **`C-RLS-9`** *(quizz à classe effacée)* :
     **mesurés INERTES le 29/08, avec leur raison**. ⭐ `C-RLS-9` l'est **structurellement** — la
     policy n'a aucune branche `classe_id IS NULL` —, donc il ne se réveillera pas.
   · **`C-RLS-10`** : ⭐ **DÉCLASSÉE** — la RLS est active sur **111/111** tables des deux bases.
     C'est un manque de **documentation**, pas d'exposition.
   · **`C-RLS-11`** : **à moitié payée** *(`scripts/recette/epreuve-escalade-profiles.mjs` éprouve
     l'escalade avec le VRAI `auth.uid()`)*. Reste la sonde élargie — la vraie cible est
     **39 tables** *(celles portant une policy lisible hors prof)*, pas 8, pas 89.
3. **`C4L10S-19`**, le dernier « avant le Run 1 » *(§5)* — ⛔ **ce n'est pas du code** : c'est une
   décision de MODULE, donc un acte de calibration. Les trois autres sont payés ou sans objet.
4. **Les campagnes de revue B, A, D** *(§4)*, dans l'ordre **B → A → D**.
5. ⚠️ **La passe des listes-parapluie `C4L7-11` et `C4L7-12`** — ce sont elles qu'on lit quand on
   demande « quels smokes restent », et elles sont **périmées**. Le 29/08 elles ont été **ANNOTÉES,
   pas réécrites** : une mesure les donne périmées aux trois quarts, mais à la mesure des CASES les
   neuf sont encore ouvertes. **Il faut les reprendre jumeau par jumeau**, et c'est le plus gros
   écart restant entre ce que le dépôt déclare et ce qui est vraiment dû.

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
| ~~**C · RLS et exposition élève**~~ | ✅ **JOUÉE, ET SES RESTES AUSSI — clôturée dans la nuit du 29 au 30/08.** Le fait qui commande : **25 fichiers élève sur 81 utilisent `createAdminClient()`** — RLS contournée, seule protection = le filtrage du code. **61 constats, 5 défauts fermés et poussés** *(`C-RLS-4` la bonne réponse d'un quizz · `C-RLS-5` le blanchiment des marques · `C-RLS-6` l'escalade de rôle · `C-RLS-7` le tuteur par classe · et `C-RLS-12`, **trouvé HORS LISTE**, le re-dépôt Fragments qui détruisait les photos)*. ⭐ Chacun **éprouvé avant d'être corrigé**, avec **contre-épreuve** *(rouvrir le défaut, le voir revenir, refermer)*, et **smoké** quand il touchait un chemin élève. ⛔⛔ **CE QUE LA CAMPAGNE APPREND POUR LES SUIVANTES : le constat sous-décrit presque toujours son défaut** — deux policies au lieu d'une, une inertie fausse d'un côté, un vecteur à l'INSERT quand le constat visait l'UPDATE, et le pire défaut absent de la liste. **Ne jamais corriger sur la lettre d'un constat sans remesurer sa prémisse.** Restent 4 entrées, **aucune datée** *(§2 item 2)*. |
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
