---
name: chantier
description: État et conduite du chantier Palimpseste de la rentrée 2026 — la file de ce qui reste, les protocoles qui évitent les dégâts, et les quatre campagnes de revue. À invoquer quand Louis dit « on continue le chantier », « qu'est-ce qui reste », « lance la revue », ou dès qu'une séance touche à la file des correctifs, aux relevés de lot, au SUIVI_tests_manuels, au registre des ouverts, ou à une écriture en production.
version: 1.0.0
---

# Le chantier Palimpseste — état, file, protocoles

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
| `origin/main` | `2363e4b` — tout est poussé *(re-fetché le 29/08 en fin de journée ; le
  `340abd7` de la première rédaction avait **12 commits de retard** au bout de quelques heures)* |

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

1. **Le CRLF des `<textarea>`** — correction d'une ligne, et il fait dériver `texte_extrait`, donc
   le corps que sert le RAG, à chaque sauvegarde d'un cours.
2. **Les trois items « avant le Run 1 » qui restent** *(voir §5)* — ⛔ **aucun n'est du code** :
   ce sont un prompt dérivé d'une fiche, une décision de module, et un arbitrage de Louis. Une
   séance Code ne les joue pas ; **le quatrième, D4, est payé** *(29/08)*.
3. **Les quatre campagnes de revue** *(§4)*, dans l'ordre **C → B → A → D**.
4. **La passe du registre des ouverts** — rayer les trois entrées périmées quand la séance voisine
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
| **C · RLS et exposition élève** | ⭐ **En premier.** Le verdict « aucune fuite, la carte des lectures est vide » de la revue bornée C4-L8 est **périmé** : C4-L3, C4-L6, C4-L4, C4-L15, C5-L2, C5-L4, C6-L2 et C6-L3 ont depuis construit des écrans élève, et la prod est allumée. |
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
c'est ce qui les distingue de D4 : · `C4L10A-14` **D2** — le bloc
`# SORTIE` de P2 de l'Argumentation ne déclare que **2 des 4 tests**, donc deux observables valent
structurellement 0 et Acquis ne se ferme jamais · `C4L10S-19` — quatre valeurs illisibles du
squelette Structure ne lèvent **aucune alerte** *(68 cas sur 112)* · `C4L10S-18` — `bloc_relie` :
le §5 et le §4 ne comptent pas la même population.

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
