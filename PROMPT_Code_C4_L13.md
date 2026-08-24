# PROMPT — Session Code : C4-L13 — Les compteurs d'assiduité, et pourquoi ils ne peuvent pas attendre

> **À coller dans une session Claude Code fraîche.** Une session, un lot.
>
> Ce prompt est fabriqué selon la recette du `PLAN_DE_CHANTIER.md` §5. Ce que le lot construit, son manifeste et son « fait quand » font foi au `07-Implementation.md` §2 — ils sont recopiés ci-dessous avec leurs versions au moment de l'écriture.
>
> ⭐ **Le lot tient en deux gestes, et le second n'existe que pour le premier.** L'**écriture des deux agrégats** par élève et par cycle, et le **déclencheur hebdomadaire** qui pose la ligne. ⛔ **Il ne pose JAMAIS les minutes** — elles sont une sortie du routeur, et `C4-L12` les remplira dans la même ligne.
>
> ⚠️ **Son échéance est LA RENTRÉE, et c'est le seul geste manquant du chantier dont le coût soit IRRÉVERSIBLE** : une semaine non comptée ne se rattrape pas. *Son numéro est postérieur à celui de `C4-L12`, son échéance est antérieure — et c'est la règle du chantier, pas une exception : « jamais dans l'ordre des numéros ».*

---

## Le manifeste — recopié du `07-Implementation.md` §2

> *Manifeste* : **ce document, §1 et §5** · `06-Palimpseste.md` §5 · `01-routeur.md` §11.

« Ce document » est le `07-Implementation.md`. Les trois pièces :

| Pièce | Où | Statut requis | Au moment de l'écriture |
|---|---|---|---|
| `07-Implementation.md`, **§1 et §5** | `/Users/louissagnieres/Documents/GitTest/palimpseste-conception/` | **aucun** — *« un lot n'exige pas un statut de la source qui le déclare »* *(`07-` §2)* | **VERSION 2.44** · RELU ET VALIDÉ · ⭐ **tes deux sections sont OUVERTES À L'IMPLÉMENTATION** *(en-tête du document : §1, §2 inventaire, §5)* — **tu les amendes depuis ton relevé, sans accord préalable** |
| `06-Palimpseste.md`, **§5** | même dépôt | **déposé** *(entrée sans statut explicite — `07-` §2)* | **VERSION 2.6** · VALIDÉ ET GELÉ |
| `01-routeur.md`, **§11** | même dépôt | **déposé** *(entrée sans statut explicite)* | **VERSION 5.5** · VALIDÉ ET GELÉ |

⚠️ **Le manifeste ne borne AUCUNE de ces pièces à ses sections, et ce prompt ne les bornera pas non plus.** *« Le statut porte sur le FICHIER, jamais sur la section ; la section dit seulement où lire »* *(`07-` §2)*. Ce qui suit dit où lire **d'abord**, jamais où s'arrêter — et deux renvois hors section te seront utiles : le **`01-` §1** *(« le cycle = la semaine de travail »)* et le **`01-` §2** *(le module Calendrier, « qui donne le dénominateur du pourcentage d'assiduité »)*.

**Ce que chaque pièce fait ici.**

- Le **`07-` §1.5** porte **ta table**, mot pour mot : *« `assiduite_hebdo` — par élève et par semaine, la semaine étant le cycle. Le nombre d'exercices assignés et terminés, et le booléen "semaine faite" au seuil configuré ; et, par classe et par semaine, le taux d'inactivité »*, puis **la phrase qui fonde ton échéance** : *« Elle est collectée dès la rentrée, même si les écrans attendent — un semestre ne se recompte pas après coup »*. Il déclare aussi les **deux compteurs de minutes** qui **ne sont pas à toi**.
- Le **`07-` §1.1** porte `exercices_depots` — *« créée dès l'assignation, pas au dépôt »* — et **la chaîne des statuts**, avec la distinction qui commande ton dénominateur : *« `abandonne` est un non-geste de l'élève, `retire` une décision du professeur, et l'assiduité mesure l'élève »*.
- Le **`07-` §5** porte l'**allumage**, et la phrase qui t'en dispense : *« La collecte, elle, ne les attend pas : les compteurs d'assiduité démarrent à la rentrée même si les écrans suivent »*. Il porte aussi la règle qui t'interdit d'ouvrir une porte de plus.
- Le **`06-` §5** porte **la formule**, les deux agrégats, le seuil des trois quarts, la sortie des vacances du dénominateur, le bonus d'au plus une semaine, et la règle du retrait *« pour l'avenir seulement »*. **C'est ta source de calcul, et elle est déjà écrite en code.**
- Le **`01-` §11** porte la **télémétrie** : le point 7, *« minutes assignées / minutes de budget, par élève et par cycle »* — **la moitié de ta ligne que tu ne remplis pas**.

**Rien de plus : la règle de manifeste veut que ce qui n'y figure pas ne se lise pas** *(`07-` §2)*. Quatre précisions pour que la règle ne fasse pas trébucher :

- l'`AGENTS.md` du dépôt n'est pas une source : Claude Code le charge d'office, il porte les conventions du repo — **dont la règle SQL absolue** ;
- ⛔ **`SPEC_C3_exercices_competences.md` est ARCHIVÉE : elle ne fait foi sur rien, et elle ne se cite jamais.** Elle traîne à la racine du dépôt `palimpseste` — **ne l'ouvre pas**. Il en va de même de `FUSION_revues_C3.md`, de `revue_adversariale_SPEC_C3.md` et de `AMENDEMENTS_C3_en_attente_2026-07-31.md` ;
- ⛔ **aucun relevé de lot ne se lit** — ni `RELEVE_C4_L2_2026-08-22.md`, ni `RELEVE_C4_L5_revue_2026-08-21.md`, ni les autres. La règle de manifeste l'interdit, et ce n'est pas une privation : **ce que C4-L2 avait à te dire est au piège 11 ci-dessous**, versé par la boîte aux lettres du `PLAN_DE_CHANTIER.md` §5 ;
- **le code du dépôt n'est pas une source, c'est ton terrain.** Les fichiers nommés dans les pièges sont des repères **vérifiés le 24/08**, pas des autorités : **en cas de doute entre ce prompt et une source du manifeste, la source a raison.**

---

## Le contrôle d'entrée — en deux temps, et les deux ne font pas la même chose

**Le statut bloque.** Un fichier du manifeste dont l'en-tête porte un statut inférieur à celui exigé **arrête le lot**, explicitement. Le barème est au `07-Implementation.md` §2 : *déposé* → *relu et validé* → *versé et bancé*, **cumulatifs** ; « VALIDÉ ET GELÉ » vaut *relu et validé*.

**La version avertit.** Si la ligne VERSION d'un fichier du manifeste diffère de celle inscrite ci-dessus, **relis son en-tête avant de continuer** — une version qui bouge dit qu'un texte a changé, pas qu'il est devenu faux.

**Le blocage est granulaire quand il peut l'être.** Une fiche de compétence absente ou non bancée bloque **cette compétence**, pas le lot. ⚠️ *Ici la clause est sans objet : aucune fiche de compétence n'est à ton manifeste, et ce lot ne mesure aucune compétence.* Elle est recopiée parce que la recette se recopie entière.

### Deux contrôles machine avant d'écrire une ligne, et un constat en base

```bash
npm test
```

**`npm test` doit rendre `fail 0`.** *Mesuré le 24/08 : **1268 tests, 1268 pass, 0 fail, 0 skipped**, en ~4,8 s.* ⚠️ **Note le compte avant de commencer** : un test qui disparaît est aussi silencieux qu'un test qui tombe, et **un vert n'est une preuve que si l'on sait combien de vert il y avait**.

```bash
python3 scripts/derive-doctrine.py --verifie
```

**Il doit dire `IDENTIQUE` sur les douze tables, les empreintes de source et la fixture.** *Mesuré le 24/08 : **`FIXTURE : IDENTIQUE`**, doctrine chargée sans écart.* ⚠️ **Pour toi, la convention est SANS OBJET et tu ne dois pas t'en servir comme d'un prétexte** : **ce lot ne lit aucune table de doctrine.** Le contrôle est ici pour que tu saches dans quel état tu prends le dépôt, pas pour te donner un geste à faire. ⛔ **Ne rejoue ni `--sql` ni `--fixture`.**

**Et un constat, à faire en base avant d'écrire quoi que ce soit** *(client admin, script de recette ou éditeur SQL)* :

- **`select count(*) from assiduite_hebdo` doit rendre 0.** *Dernier état connu : 0 ligne, décor semé puis retiré le 22/08.* **S'il rend autre chose, ARRÊTE-TOI et regarde les minutes** : une ligne dont `minutes_assignees = 50` et `minutes_budget_plancher = 45` est un **semis de décor**, pas une mesure *(piège 11)*.
- **Les six interrupteurs sont à OFF** — `exercices_actif`, `routeur_actif`, `competences_affichage_actif`, `fabrique_actif`, `chaine_actif`, `passation_classe_actif` *(`utils/allumage.ts:36-43`)*. **Ils ne bougent pas de ton fait** *(piège 28)*.

---

## La mission — reprise du `07-Implementation.md` §2

*Reprise du `07-Implementation.md` §2, entrée C4-L13.*

Les règles sont écrites et éprouvées — complétion, semaine faite, ce qui entre au dénominateur, le retrait —, **les écrans sont joués** avec C4-L2, et **rien n'écrit `assiduite_hebdo`** : son seul écrivain dans le dépôt est un **décor de recette**, qui sème des minutes en dur pour peupler l'écran.

⚠️ **C'est le seul geste manquant dont le coût est IRRÉVERSIBLE, et le §5 le dit déjà** : *« la collecte, elle, ne les attend pas : les compteurs d'assiduité démarrent à la rentrée même si les écrans suivent — un semestre ne se recompte pas après coup »*. **Une semaine non comptée ne se rattrape pas.**

⭐ **Et les deux agrégats ne dépendent d'aucun routeur** : les dépôts sont **déjà** assignés par la voie du professeur, et c'est exactement ce qu'ils comptent.

### A. L'écriture des deux agrégats

**Par élève et par cycle** — exercices **assignés**, exercices **terminés**, et le booléen **semaine faite** au seuil **lu en configuration**.

Tu ne calcules rien de neuf : **les règles existent, pures et éprouvées**, et tu les appelles. Ce qui manque est **la jonction** — la fonction qui transforme une liste de dépôts en `(assignes, termines)` pour un `(élève × cycle_lundi)`. **Elle n'existe nulle part** *(piège 12)*.

### B. Le déclencheur hebdomadaire qui pose la ligne

*« Le cron se copie tel quel sur celui de la synthèse hebdomadaire — garde, fuseau et boucle par classe comprises. »* ⚠️ **« Tel quel » a une exception, et une seule : un commentaire faux** *(piège 24)*.

⛔ **UN SEUL DÉCLENCHEUR HEBDOMADAIRE, ET C'EST CELUI-CI.** Le `07-` §2 le dit **des deux côtés** : à ton entrée — *« `C4-L12` écrit dans la ligne qu'il trouve, il n'en ouvre pas »* — et à la sienne — *« il n'ouvre PAS son propre déclencheur hebdomadaire : `C4-L13` en pose déjà un sur la même clé (élève × cycle), et deux crons sur une même clé fabriquent deux lignes. Ce lot se greffe sur celui de `C4-L13` »*. **Écris-le donc pour qu'on puisse s'y greffer** *(piège 25)*.

### ⚠️ Le partage des minutes avec `C4-L12`, parce que les deux lots écrivent dans la MÊME ligne

Les compteurs de minutes — le `01-` §11 en nomme **deux**, *minutes assignées* et *minutes de budget*, que la base porte en **trois colonnes** — **ne sont pas de la collecte, ce sont des sorties du routeur** : elles n'existent que si une semaine a été posée.

⛔ **Ce lot pose la LIGNE et ses deux agrégats ; `C4-L12` remplit les minutes de cette même ligne quand il pose une semaine.** *Sans ce partage dit, le lot d'assiduité écrirait des minutes qu'il n'a pas et le routeur créerait une seconde ligne sur la même clé.*

### Ce que ce lot NE porte PAS

- les **écrans** — la frise, le tableau et les deux agrégats sont **joués à C4-L2**, et ils **lisent** ;
- le **taux d'inactivité par classe**, qui **se dérive** de ces mêmes lignes — la vue existe déjà, elle a été durcie le 21/08, **et tu n'y touches pas** *(piège 23)* ;
- les **trois colonnes de minutes** *(ci-dessus)*.

---

## Les pièges — les décisions dont l'oubli coûte une migration

*Tirés des sources du manifeste et **vérifiés sur pièces le 24/08**. Chacun porte son renvoi. **En cas de doute entre ce prompt et la source, la source a raison.***

### La table existe déjà — commence par mesurer ce qui y est

**1. ⭐⭐ TU N'AS AUCUN DDL À ÉCRIRE SUR `assiduite_hebdo` : ELLE EST COMPLÈTE, MINUTES COMPRISES.** `c4_l1_schema.sql:885-907` — `eleve_id`, `cycle_lundi`, `exercices_assignes`, `exercices_termines`, `semaine_faite`, les **trois** colonnes de minutes *(nullables)*, `updated_at`, et **clé primaire `(eleve_id, cycle_lundi)`**. *Migration jouée en bac à sable le 18/08 (`SUIVI_SQL.md`), prod ☐.* **Ton écriture est donc un `upsert` sur `onConflict: 'eleve_id,cycle_lundi'`** — idempotent par construction, ce qui est exactement ce qu'un cron demande.

**2. ⚠️ LA BASE REFUSE TOUTE DATE QUI N'EST PAS UN LUNDI ISO.** `constraint assiduite_lundi_chk check (extract(isodow from cycle_lundi) = 1)` — `c4_l1_schema.sql:888`. Un cadrage approximatif ne rendra pas une ligne fausse : **il rendra un refus**, et un refus de supabase-js **ne lève pas** *(piège 26)*.

**3. ⚠️⚠️ LE DÉFAUT DE LA BASE EST LE CONTRAIRE DE LA RÈGLE.** `semaine_faite boolean not null default false` *(`c4_l1_schema.sql:894`)*, quand la règle dit qu'une semaine **sans exercice assigné est faite PAR CONSTRUCTION** — `completion()` rend `null`, *« et ce n'est pas 0 »*, et `semaineFaite()` rend **`true`** *(`utils/routeur/assiduite.ts:65-80`)*. **Calcule toujours le booléen, ne laisse jamais le défaut le poser.**

**4. `updated_at` N'A AUCUN TRIGGER, et son `default` ne joue qu'à l'INSERT.** `c4_l1_schema.sql:905` ; les quatre triggers du fichier sont ailleurs. **Un `upsert` qui ne pose pas `updated_at` laissera l'horodatage de la première pose** — et tu perdras la seule trace qui dise que le cron est passé cette semaine.

**5. ⛔⛔ NE METS JAMAIS LES MINUTES DANS LA CHARGE UTILE — ET MÉFIE-TOI DE L'`upsert` EN LOT.** Les trois colonnes sont à `C4-L12`, sur **la même ligne que la tienne** *(clé primaire partagée)* : une clé que tu n'envoies pas garde sa valeur, une clé que tu envoies à `null` **efface un budget réel sans un mot**. ⚠️ **Et un `upsert` en lot unifie les colonnes de son tableau** : une clé présente sur une seule ligne devient une colonne de toutes, et celles qui ne la portaient pas partent à `NULL`. ⭐ **Ne me crois pas sur parole : c'est du comportement d'API, pas de source** — **pose-le en épreuve** *(une ligne avec minutes, un `upsert` sans, puis relis les minutes)* **avant d'écrire le cron.** *Deux gestes qui suffisent : n'inclus jamais ces trois clés, et vérifie que **toutes** les lignes d'un même envoi portent **exactement** le même jeu de clés.*

**6. ⛔ N'OUVRE AUCUNE POLICY ÉLÈVE, ET PASSE PAR LE CLIENT ADMIN.** `assiduite_hebdo` n'a **qu'une** policy — `assiduite_hebdo_prof_all`, posée par la boucle `do $rls$` de `c4_l1_schema.sql:1043-1062`. ⭐ **Et « zéro policy élève » est un invariant CONTRÔLÉ PAR REQUÊTE dans deux migrations déjà jouées** — `c4_l3_deroule.sql:271-276` et `c4_l9_examens_diagnostiques.sql:373-378`, drapeau `zero_policy_eleve`. **Ouvrir une policy élève ferait basculer deux vérifications passées.** Ton écrivain est un cron : il monte `createAdminClient()` *(`service_role`)*, qui contourne la RLS.

### Le rattachement à la semaine — le trou central, et c'est TON arbitrage

**7. ⛔⛔ `exercices_depots` NE PORTE AUCUNE COLONNE DE CYCLE NI DE SEMAINE.** Vérifié : `cycle_lundi` n'existe qu'à `routeur_decisions` et à `assiduite_hebdo`. **Les trois chemins possibles, et pourquoi deux sont morts** :

> *(a)* par **`routeur_decision_id`** → `routeur_decisions.cycle_lundi`. ⛔ **Nullable, et NULL sur toute la voie du professeur** : `assignerALaClasse()` n'écrit jamais cette clé *(`app/prof/conception/actions.ts:402-411`)*. Or **c'est la voie du professeur que tu comptes**.
> *(b)* par **`exercices.exercice_planifie_id`** → `scriptorium_exercices_planifies.semaine_lundi`. ⛔ **Deux sauts, deux NULL possibles** — la clé est nullable *(« le routeur assigne aussi hors créneau planifié »)*, et `semaine_lundi` l'est aussi sous `ancrage = 'parcours'`.
> *(c)* ⭐ par **`exercices_depots.assigne_at`**, `timestamptz not null default now()` *(`c4_l1_schema.sql:445`)* — **le seul chemin total**, et **celui que le dépôt emploie déjà** *(`app/prof/routeur/serveur.ts:152-156`, `app/prof/routeur/actions.ts:136`)*.

**Le `07-` §1 est OUVERT À L'IMPLÉMENTATION : la forme t'appartient.** *Position de repli, si tu hésites : dérive de `assigne_at` — c'est total, c'est déjà l'usage, et cela n'ajoute pas un domicile de plus.* **Quelle que soit ta décision, écris-la au `07-` §1.1 et dis-la au relevé** : la prochaine session ne doit pas refaire cette archéologie.

**8. ⭐ `assigne_at` N'EST JAMAIS RÉÉCRIT, ET C'EST CE QUI REND (c) STABLE.** À la ré-assignation, seules les lignes **manquantes** sont insérées ; les existantes ne reçoivent qu'une nouvelle `echeance` *(`app/prof/conception/actions.ts:389-419`)*, et le commentaire dit pourquoi : *« un `upsert` qui repose `statut` et `assigne_at` ferait repasser à `assigne` un élève déjà à `v1_remis` […] et l'assiduité le recompterait »*. **La semaine d'un dépôt est figée à sa première assignation.**

**9. ⭐⭐ LA FONCTION CANONIQUE EST `lundiDuCycle`, ET IL Y EN A DÉJÀ TROIS AUTRES DANS LE DÉPÔT — N'EN ÉCRIS PAS UNE QUATRIÈME.** `lundiDuCycle(instant: Date, fuseau: string): Date` — `utils/deroule/echeance.ts:111-113`, `= lundiOnOrBefore(jourDansFuseau(instant, fuseau))`, pure, testée, et qui rend *« une DATE PURE ancrée à minuit UTC, dont le jour ISO vaut 1 »* — **exactement la forme que la contrainte du piège 2 attend**. Son en-tête pose l'interdit : *« ON NE RÉÉCRIT PAS LE CALENDRIER »*. ⛔ **Ne prends pas `lundiDe` de `app/prof/routeur/serveur.ts:50-54`** : il ne connaît pas le fuseau.

**10. ⚠️⚠️ DEUX VIOLATIONS VIVANTES DU PIÈGE DE FUSEAU, ET ELLES SONT DANS LE CHEMIN MÊME DE L'ASSIDUITÉ.** *(a)* `app/prof/routeur/actions.ts:136` — `lundiDe(d.assigne_at.slice(0, 10))` : `.slice(0,10)` d'un `timestamptz` est le **jour UTC**, pas le jour école. *(b)* `app/prof/routeur/actions.ts:160` — le « cycle courant » lu de la même façon, **et c'est l'argument de `retraitCompteDansLaSemaine`**, la règle « une semaine déjà arrêtée ne se recalcule pas ». **La règle est écrite à cinq endroits du dépôt** — *« les INSTANTS se lisent dans le fuseau, les DATES PURES restent en UTC »* *(`utils/fuseau.ts:5-8`, `utils/deroule/echeance.ts:43-47`)* — et son coût est chiffré : *« un dépôt du dimanche 20 h 30 à Toronto est le lundi 00 h 30 UTC : lu en UTC il ouvrirait la semaine SUIVANTE […] l'heure exacte à laquelle les élèves déposent »*. ⭐ **Relève-le. Si tu le corriges — c'est deux lignes —, fais-en un geste SÉPARÉ et dis-le** : ton lot ne se juge pas sur les corrections d'un voisin.

**11. ⚠️⚠️ LE DÉCOR DE RECETTE — LE SEUL ITEM DE TA BOÎTE AUX LETTRES, ET IL A DEUX DENTS.** *(`PLAN_DE_CHANTIER.md` §5, boîte C4-L13, déposé par C4-L2.)* `scripts/recette/routeur-c4l2-decor.mjs` est **le seul écrivain d'`assiduite_hebdo` du dépôt** : il sème 3 semaines × les inscrits d'une classe, `exercices_assignes: 4` en dur, et `minutes_assignees: 50, minutes_budget_plancher: 45, minutes_budget_plafond: 60` *(`:74-87`)*.

> ⛔ **Dent 1 — `--retire` supprime PAR SIGNATURE DE MINUTES** : `.eq('minutes_assignees', 50).eq('minutes_budget_plancher', 45)` *(`:106-111`)*. Or **45–60 min est le budget réel d'un élève de tronc commun** — constaté en base, et **asséré par la recette de C4-L2** *(`scripts/recette/routeur-c4l2.mjs:109` : `b.budget?.plancher === 45 && b.budget?.plafond === 60`)* —, et 50 minutes assignées est parfaitement plausible : **le jour où `C4-L12` posera de vraies minutes, `--retire` effacera des lignes RÉELLES.**
> ⛔ **Dent 2 — son en-tête ment sur son code** : il affirme *« il n'écrit que des lignes neuves »* *(`:16`)*, mais l'écriture est un **`upsert`** *(`:84-85`)* : sur une base collectée, `--seme` **écrase silencieusement** les compteurs réels de ces élèves × ces trois semaines. Et sa preuve de retour à l'état d'avant **compte toute la table et attend 0** *(`:114-118`)* — présupposé qui cesse d'être vrai le jour de ta rentrée.
>
> **Ce que tu fais** : *« le décor est à retirer du chemin dès que le vrai écrivain existe, sans quoi la recette relira ses propres semis et les prendra pour une mesure »*. **La forme t'appartient** — le retirer, le neutraliser, ou lui donner une marque qui ne soit pas une coïncidence de valeurs. ⚠️ *Il n'existe aucun drapeau de provenance : `assiduite_hebdo` n'a aucune colonne texte, et **aucun garde côté lecture** ne peut distinguer un semis d'une mesure.* **Dis au relevé ce que tu as choisi.**

### Ce qui se compte — et ce qui existe déjà pour le compter

**12. ⭐⭐ LES TROIS RÈGLES D'INGRÉDIENTS SONT ÉCRITES, ÉPROUVÉES, ET N'ONT AUCUN APPELANT DE PRODUCTION. C'EST TON POINT DE SOUDURE.** `utils/routeur/assiduite.ts` — `STATUTS_RENDUS = ['v1_remis','retour_publie','vf_remis','clos']` *(`:294`)*, `estRendu()` *(`:296-298`)*, `entreAuDenominateur(statut) { return statut !== 'retire' }` *(`:300-302`)*. **Importe-les, ne les réécris pas**, et ne recopie surtout pas la liste des statuts ailleurs. ⚠️ **Faux positif à connaître** : l'`estRendu` de `utils/matrice-pilotage.ts:11` vient d'Aletheia — **ce n'est pas le même**.

**13. ⛔ `retire` EST BIEN UN STATUT ADMIS — ET LE `create table` DE C4-L1 TE DIRA LE CONTRAIRE.** Le `CHECK` d'origine *(`c4_l1_schema.sql:453-454`)* en porte **sept** ; il a été **remplacé** par `c4_l8_fabrique.sql:634-636`, qui en porte **huit**, `retire` compris, avec son `comment on column`. *C'est un `CHECK` textuel, jamais un `enum`.* **Lis toujours le dernier `alter`, jamais le premier `create`** — la même erreur a été commise pendant la fabrication de ce prompt.

**14. ⚠️ `abandonne` RESTE AU DÉNOMINATEUR, `retire` EN SORT — ET `abandonne` N'A AUJOURD'HUI AUCUN ÉCRIVAIN.** La règle est au `07-` §1.1 et au `06-` §5 ; elle est en code *(`utils/routeur/assiduite.ts:287-302`)* et sous test *(`assiduite.test.ts:180-184`)*. **Mais rien ne pose jamais `'abandonne'`** — vérifié sur tout le dépôt. **Ne fabrique pas cet écrivain en passant** : ce n'est pas ton lot, et la branche est correcte même vide. *Le seul écrivain de `'retire'` est `retirerLExercice()` — `app/prof/routeur/actions.ts:130-131`.*

**15. ⭐ « ASSIGNÉS » SE COMPTE SUR DES LIGNES, PAS SUR UNE INTENTION.** *« `exercices_depots` — créée dès l'assignation, pas au dépôt »* *(`07-` §1.1)*, et le code le tient : `assignerALaClasse()` insère **immédiatement une ligne par élève** *(`app/prof/conception/actions.ts:402-411`)*, et le module élève le prend pour acquis — *« la ligne existe dès l'assignation ; le déroulé la fait AVANCER, il ne la crée pas »* *(`utils/deroule/depot.ts:5-7`)*. **Compte les lignes de `exercices_depots`, et rien d'autre.**

**16. ⚠️⚠️ LE RETRAIT NE RÉTROAGIT PAS — C'EST LA RÈGLE QUI COMMANDE TOUT TON ÉCRIVAIN.** *« Une semaine dont le compte est déjà arrêté ne se recalcule pas. Un chiffre déjà montré au professeur ne bouge plus »* *(`06-` §5)*, et `retraitCompteDansLaSemaine(cycleDuDepot, cycleCourant)` le dit en code *(`utils/routeur/assiduite.ts:276-285`)*. ⛔ **Ton cron ne réécrit JAMAIS une ligne dont le `cycle_lundi` est antérieur au cycle qu'il pose.** *C'est la contrepartie exacte de l'irréversibilité qui justifie ton échéance : ce qui a été compté est compté.*

### Le seuil, et les deux vérités de « semaine faite »

**17. ⛔ JAMAIS 0,75 EN DUR — LE SEUIL SE LIT EN CONFIGURATION.** *« La valeur est arrêtée ; elle reste un paramètre de configuration, jamais une constante en dur »* *(`06-` §5)*. `lireLesSeuils(admin)` — `utils/routeur/donnees.ts:417-435` — lit `scriptorium_params.assiduite_seuil_semaine_faite` / `assiduite_borne_basse_frise` / `assiduite_contrat_classe` *(posées par `c4_l2_routeur.sql:195-209`, défauts 0,75 / 0,50 / 0,75, jouées en bac à sable le 22/08)*, avec un repli **qui se dit** — `parDefaut: true`. ⚠️ **Le décor de recette, lui, calcule `semaine_faite` avec un `0.75` EN DUR** *(`routeur-c4l2-decor.mjs:80`)* : **c'est le seul défaut du chantier assiduité sur ce point, et c'est précisément le fichier que tu es tenté de recopier.**

**18. ⚠️⚠️ « SEMAINE FAITE » A DEUX VÉRITÉS, ET ELLES PEUVENT DIVERGER SANS UNE ALERTE.** La **colonne stockée** n'est lue que par la **vue SQL** `assiduite_hebdo_classe` *(`count(*) filter (where not a.semaine_faite)`, `c4_l1_schema.sql:918`)*. Les **écrans**, eux, la **recalculent** de `assignes`/`termines` par `semaineFaite()` et `bandeDeLaFrise()` *(`app/prof/routeur/serveur.ts:274-292`)* — `lireLAssiduite` la mappe *(`utils/routeur/donnees.ts:399`)* et **aucun appelant ne s'en sert**. ⭐ **Conséquence** : si ton écrivain pose la colonne avec un seuil différent de celui que l'écran applique à la volée, **le taux d'inactivité de la vue et la frise de l'écran donneront deux chiffres**, sans qu'aucun signal ne le dise. **Pose la colonne avec le seuil lu par `lireLesSeuils`, et pas un autre.**

### Le dénominateur, et le trou des vacances

**19. ⛔⛔ LE DÉNOMINATEUR D'AUJOURD'HUI N'EST PAS CELUI QUE LA RÈGLE ANNONCE — ET C'EST TON ÉCRITURE QUI LE DÉCIDE.** `assiduiteDeLEleve()` calcule `denominateur = horsVacances.length` *(`utils/routeur/assiduite.ts:114`)* — **le nombre de lignes qu'on lui passe**, c'est-à-dire le nombre de lignes en base. Le module s'en dédouane explicitement : *« "Le dénominateur vient du module Calendrier" : `semainesDuSemestre` est ce qu'il rend, ce module ne le recompte pas »* *(`:100-101`)* — **et personne ne le lui rend.**

> ⭐ **Donc : si ton cron ne pose une ligne que pour les élèves qui ont eu des exercices, le pourcentage d'assiduité est FAUX** — une semaine sans assignation disparaît du dénominateur au lieu d'y entrer. *Position de repli, si tu hésites : **pose une ligne par élève actif et par semaine DE TRAVAIL, même à zéro**.* ⚠️ **Et sache ce que ce zéro vaut à l'écran** : `exercices_assignes = 0` rend `completion() === null`, donc `semaineFaite() === true` — *« faite par construction »*. **C'est la règle, pas un défaut** ; mais dis-le au relevé, parce que la lecture est contre-intuitive.

**20. ⛔⛔ `enVacances` EST CÂBLÉ EN DUR À `false`, ET LA TABLE N'A AUCUNE COLONNE POUR LE PORTER.** Trois sites : `app/prof/routeur/serveur.ts:87`, `:291`, et `utils/routeur/assiduite.ts:241` *(dans `vueFine`)*. La sortie des vacances du dénominateur et le **bonus d'au plus une semaine** *(`06-` §5, code à `assiduite.ts:106-125`, testé à `assiduite.test.ts:47-80`)* sont donc **du code mort en production**. ⛔ **Ce n'est PAS ton geste** — ton entrée au `07-` §2 ne le porte pas. ⭐ **Mais ton choix de la population de semaines le décide en pratique** : si tu ne poses de ligne que pour les semaines de travail, le drapeau reste sans emploi et le compte est juste ; si tu poses aussi les semaines de vacances, **il te faut une colonne qui n'existe pas**. **Relève-le, quel que soit ton choix.**

**21. ⭐ LES SEMAINES DE VACANCES SONT CALCULÉES, JAMAIS STOCKÉES — ET LE PATRON « VACANCES SAUTÉES » EXISTE DÉJÀ, À DEUX FICHIERS DE TOI.** `calculerGrilleSemaines(semestre, holidays)` — `utils/calendrier-grille.ts:42-66` — découpe lundi→dimanche, marque `isVacation` au chevauchement d'un jour, et numérote les semaines de travail en sautant les vacances. **Et `chargerLesSegments()` — `app/prof/routeur/serveur.ts:317-343` — en fait exactement ce que tu veux** : `semesters` non archivés + `holidays`, puis `for (const w of calculerGrilleSemaines(s, h)) { if (w.isVacation) continue }`. **Copie ce patron.** ⚠️ **Et le semestre est GLOBAL au prof** — aucun lien élève↔semestre, aucun lien classe↔semestre : le rattachement se fait **par les dates**, avec `resoudreSemestrePourSemaine(admin, semaineLundi)` *(`utils/plan-exercices.ts:97-109`)*, **jamais par `is_active`**.

**22. ⛔⛔ UNE LIGNE ABSENTE SE LIT *VERT* À L'ÉCRAN — UNE COLLECTE EN PANNE RESSEMBLE À UNE CLASSE PARFAITE.** `chargerAssiduite` remplace l'absence par `assignes: 0, termines: 0` *(`app/prof/routeur/serveur.ts:276-280`)* → `completion` rend `null` → la bande est **verte**, le tableau affiche « — faite », **et le taux d'inactivité compte l'absent comme actif**. Le seul garde-fou honnête est `collecteVide: lignes.length === 0` *(`:301`)*, **et il est GLOBAL** : dès qu'une seule classe a des lignes, le bandeau disparaît. ⭐ **Conséquence pour toi, et c'est une exigence de conception, pas un ornement** : ton cron doit **rendre un bilan** qui distingue *« rien à compter »* de *« pas passé »* — le patron voisin le fait *(`{ actif, semaineLundi, ready, vides, erreurs }`, `utils/scriptorium-synthese-rag.ts:207`)*, et `app/api/chaine/route.ts:205-208` en donne la doctrine : *« `reclames` et `traites` SE COMPARENT, et c'est la preuve que la garde tient »*.

**23. ⛔ NE TOUCHE PAS À LA VUE `assiduite_hebdo_classe`, ET NE REJOUE JAMAIS SON ROLLBACK.** Elle existe *(`c4_l1_schema.sql:914-924`)*, elle **n'a aucun lecteur de code** — *« le taux d'inactivité ne se stocke pas : il se calcule »* —, et elle a été **durcie le 21/08** : `security_invoker = true` et `revoke all … from anon` *(`securite_vue_et_search_path.sql:200,207`)*, `authenticated` gardant volontairement son droit. ⛔ **`securite_vue_et_search_path_rollback.sql` REND la vue à `anon`** : il ne se rejoue jamais.

### Le cron — le patron, et l'unique chose qu'il ne faut pas copier

**24. ⛔⛔ LE PATRON SE COPIE « TEL QUEL » SAUF UN COMMENTAIRE, ET CE COMMENTAIRE EST FAUX ET DÉJÀ BANNI DU DÉPÔT.** `app/api/scriptorium/synthese-hebdo/route.ts:15` porte *« Plafond du plan Vercel Hobby »* au-dessus de `maxDuration = 60`. **C'est faux** — l'offre gratuite est à 300 s en défaut comme en maximum *(constat `C4L5-20`)* — et `app/api/chaine/route.ts:51-52` porte l'interdit exprès : *« ne le réintroduis sous aucune forme »*. **Copier la route sans regarder réimporterait une contre-vérité déjà chassée.**

**Ce qui, lui, se copie mot pour mot** *(`app/api/scriptorium/synthese-hebdo/route.ts:18-27`)* :

- la **garde** — un **en-tête**, pas un paramètre : l'`authorization` de la requête doit être **exactement** `Bearer <CRON_SECRET>`, sinon **401** — et **secret absent de l'environnement → 401 aussi** *(un déploiement sans la variable est fermé, pas ouvert)*. ⚠️ *`CRON_SECRET` n'est pas dans `.env.example` : elle ne vit que dans Vercel, et le cron l'envoie de lui-même quand elle existe* ;
- `createAdminClient()`, puis `const fuseau = await lireFuseau()` et `jourDansFuseau(new Date().toISOString(), fuseau)` ;
- `return Response.json(bilan)` — **200 dès que le secret passe**, le corps portant le bilan ;
- ⭐ **et le partage, qui est le vrai patron** : la route est un **déclencheur mince**, tout le travail vit dans un **util partagé** *(`utils/scriptorium-synthese-rag.ts`, partagé avec le bouton prof de secours)*. **C'est ce qui rend le greffon de `C4-L12` possible** *(piège 25)*.

**25. ⭐ ÉCRIS-LE POUR QU'ON PUISSE S'Y GREFFER — C'EST UNE OBLIGATION DE TON ENTRÉE AU `07-` §2.** `C4-L12` doit pouvoir remplir **les minutes de la ligne que tu poses**, sans ouvrir un second cron sur la même clé. **Donc : le travail dans un util appelable, la ligne posée AVANT que quiconque écrive les minutes, et un point d'entrée nommé.** *Ne cache pas la logique dans le corps de la route.*

**26. ⚠️⚠️ LE CRON VOISIN IGNORE LE `{ error }` DE SON `upsert` — NE COPIE PAS CE DÉFAUT.** `utils/scriptorium-synthese-rag.ts:74` : `await admin.from(...).upsert(...)` sans déstructuration. **supabase-js ne lève pas** : il retourne `{ error }`, et une écriture ratée y est **invisible, y compris sous un `try/catch`**. *Le contre-exemple correct est dans le même flux : `utils/cout-api.ts:55-61` lit `{ error }` et journalise `journalisation PERDUE`.* ⭐ **Et le décor, lui, le lit** *(`routeur-c4l2-decor.mjs:86`)* — le bon geste existe déjà à deux endroits.

**27. ⭐ LE LUNDI D'UN CRON HEBDOMADAIRE EST CELUI DE LA SEMAINE ÉCOULÉE, PAS DE LA SEMAINE EN COURS.** `lundiSemaineEcoulee(aujourdHui)` — `utils/scriptorium-synthese-rag.ts:36-38`, `= toISODate(addDaysUTC(lundiOnOrBefore(aujourdHui), -7))`. **Un cron du lundi matin qui compterait la semaine en cours compterait une semaine vide, chaque semaine.** ⚠️ **Et le cron existant tourne à `0 9 * * 1` UTC** — *« 09:00 UTC le lundi = 05:00 à Toronto »*, ce que le commentaire ne qualifie pas : **c'est 04:00 en heure normale**. Choisis ta cadence en connaissance, et **déclare-la dans `vercel.json`** *(aucune clé `functions` ni `maxDuration` n'y vit : la durée est un `export const` de la route)*.

**28. ⛔ NE GATE RIEN, ET N'OUVRE PAS UN SEPTIÈME INTERRUPTEUR.** *« La collecte ne les attend pas »* *(`07-` §5)* — et surtout **pas `routeur_actif`** : *« les deux agrégats ne dépendent d'AUCUN routeur »* *(`07-` §2)*. ⚠️ **Un interrupteur d'assiduité serait le geste exactement contraire à l'échéance du lot** : une porte fermée à la rentrée, c'est un semestre perdu. *Les six sont à `utils/allumage.ts:36-43` ; ils restent à OFF, et aucun ne te concerne.*

**29. ⚠️ TU ÉCRIS UNE LIGNE PAR ÉLÈVE × SEMAINE, SUR TOUTES LES CLASSES — ET LE PLAFOND DE 1000 LIGNES NE SIGNALE RIEN.** Pour lire, le patron du dossier est `lirePagine` *(`utils/routeur/donnees.ts:47-79`)* : **paginer · ordonner sur une clé unique · confronter au `count: 'exact'`**, sinon `LectureTronquee`. ⚠️ *Son `Promise.resolve` n'est pas décoratif : « un constructeur de requête supabase-js est PARESSEUX, il ne part qu'au premier `then` ».* ⛔ **La requête la plus proche de la tienne est le contre-exemple** : `chargerAssignation()` *(`app/prof/routeur/serveur.ts:151-157`)* borne `exercices_depots` à une semaine **sans `.range()` ni décompte**. Idem pour `elevesEtClasses()` *(`:57-59`)* et les lectures d'`inscriptions` *(`:248`, `:258`)*. ⭐ **Aucun helper de découpage d'ÉCRITURE n'existe** : soit tu écris **classe par classe** comme le fait la synthèse, soit tu lotis — **et tu le dis**.

**30. ⚠️ `import 'server-only'` REND UN MODULE INTESTABLE, ET LE GLOB DE TEST EST `utils/**/*.test.ts`.** `lireFuseau()` *(`utils/fuseau-serveur.ts`)* porte `server-only` : **garde ton calcul dans un module PUR qui REÇOIT le fuseau** — c'est le patron de `utils/deroule/echeance.ts`, et c'est la règle du dossier *(`utils/routeur/LISEZ-MOI.md:7-15` : « tout est PUR ; deux fichiers font exception, et ils ne portent aucune règle »)*. ⛔ **Une règle posée sous `app/` ne serait JAMAIS éprouvée**, sans qu'aucun message ne le dise *(`package.json`, script `test`)*.

**31. ⚠️ ET UNE LIGNE À ÉCRIRE DANS UN DOSSIER QUI SE DÉCLARE SANS ÉCRIVAIN.** `utils/routeur/LISEZ-MOI.md:24-31` affirme : *« RIEN DANS CE DOSSIER N'ÉCRIT — c'est un état vérifié, pas une intention »*, et `:76-77` : *« les compteurs d'assiduité ne s'écrivent pas ici non plus — c'est `C4-L13` »*. **Si ton écrivain atterrit dans `utils/routeur/`, ce LISEZ-MOI devient faux le jour de ton commit.** *Deux issues honnêtes : loger l'écrivain ailleurs, ou mettre le LISEZ-MOI à jour dans le même geste. **Choisis, et dis-le.***

---

## Le « fait quand » — recopié du `07-Implementation.md` §2

*Recopié du `07-Implementation.md` §2. C'est la condition de recette, et **elle ne se négocie pas en séance**.*

- **une semaine réelle laisse une ligne par élève en base** ;
- **ses deux agrégats se calculent depuis des dépôts RÉELS** ;
- et **les écrans de C4-L2 cessent de lire un décor**.

*Échéance* : **À LA RENTRÉE.** ⚠️ **Son numéro est postérieur à celui de `C4-L12`, son échéance est antérieure** — et c'est la règle du chantier, pas une exception : *« jamais dans l'ordre des numéros »*.

⭐ **Lis la troisième clause comme une exigence de PREUVE** : « cesser de lire un décor » ne se constate pas en regardant l'écran — le décor et la mesure y sont **indiscernables** *(piège 11)*. **Il te faut une traversée qui sème de vrais dépôts, fasse tourner ton déclencheur, et confronte la ligne posée au compte des dépôts.** *Le dossier `scripts/recette/` en porte les patrons, et `scripts/recette/traversee-c4l7.mjs:797-870` montre comment on éprouve une route de cron — secret posé, module importé, `GET(new Request(...))` appelé, et **les deux refus éprouvés PAR L'ÉCHEC**.* ⚠️ **Cela ne vaudra pas preuve que l'hébergeur l'appelle** : la réserve est écrite au `SUIVI_tests_manuels.md` pour `C4L11-C`, et elle vaudra pour toi.

---

## Les conventions — `PLAN_DE_CHANTIER.md` §5

### Du dépôt

**Ce lot n'a pas besoin d'une migration** — la table, ses gardes, sa RLS et sa vue sont posées depuis C4-L1, et les seuils depuis C4-L2 *(piège 1)*. ⭐ **Mais le piège 7 peut t'en faire écrire une** *(une colonne de cycle sur le dépôt)*, et le piège 20 aussi. **Si tu en écris une** :

**Une ligne au `SUIVI_SQL.md` AVANT exécution, jamais après** — date, fichier, zone, cases Sandbox/Prod. **La migration est additive et gatée** : les **six** interrupteurs restent à OFF. ⚠️ **Le reste du protocole n'est pas ici : il est en tête du `SUIVI_SQL.md`, règle R6** — sandbox d'abord, ne jamais rejouer un fichier de l'Archive, protocole renforcé sur les tables vivantes, et **répétition à blanc sur le CORPS du fichier, jamais sur le fichier entier** *(son `commit;` validerait la transaction d'essai)*. **Lis-le avant d'écrire ta migration** *(c'est aussi la règle absolue de l'`AGENTS.md`)*. ⚠️ **`exercices_depots` est une table VIVANTE** : 25 dépôts réels y sont, et un élève pilote travaille dans cette base.

**La doctrine dérivée : SANS OBJET ici** — ce lot ne lit aucune des douze tables. *Le contrôle est vert au 24/08 ; il est au contrôle d'entrée pour mémoire, pas pour te donner un geste.*

**L'ouverture d'une compétence : SANS OBJET** — ce lot n'en ouvre aucune.

### De clôture

**Ta section au `SUIVI_tests_manuels.md`**, au moment où le lot se clôt : ce qui a été **prouvé en séance, coché avec sa preuve**, et ce qui **reste à jouer en recette, décoché, avec sa condition de reprise NOMMÉE**. *« Un reste décoché avec sa condition de reprise nommée est un dépôt de boîte aux lettres réussi — il se retrouve d'un `grep`, il vieillit avec le lot qui l'a écrit, et il n'oblige personne à lire un relevé »* *(`PLAN_DE_CHANTIER.md` §5)*. ⭐ **Et regarde `C4L2-7`** — *« L'assiduité : les deux agrégats, la frise et le tableau »*, coché le 22/08 **sur un décor** : c'est l'entrée que ton lot rend enfin vraie, et elle mérite d'être nommée dans la tienne.

### De dette

**Une source trouvée fausse se MARQUE, elle ne se corrige pas.** Deux gestes : **`[faux]`** au point de l'erreur, et **une ligne à la section DETTES** du `INVENTAIRE_Non_Tranches.md`, qui porte l'**avant / après**. ⚠️ *Ne confonds pas avec le `07-` §1 et le §5, qui sont **OUVERTS À L'IMPLÉMENTATION** : ceux-là, tu les amendes depuis ton relevé, sans accord préalable — ce n'est pas une dette, c'est ton travail.*

### Et une garde de séance

⚠️ **UNE AUTRE SESSION TRAVAILLE DANS CE DÉPÔT, ET ELLE COMMITE PENDANT QUE TU LIS.** *Constaté à la fabrication de ce prompt : entre son début et sa fin, l'arbre de travail a changé deux fois — des modifications non commitées ont disparu du `git status` sans que rien ne le signale.* Le `PLAN_DE_CHANTIER.md`, le `SUIVI_tests_manuels.md` et les LISEZ-MOI portent régulièrement des modifications qui ne sont pas d'un lot. **Vérifie `git status` avant d'écrire, écris par ancres plutôt qu'en pleine page, et ne rends jamais compte de ce que tu n'as pas fait.** ⚠️ **`git add -u` n'ajoute pas les fichiers neufs** : relis `git status` et `git show --stat` avant de pousser — **pousser, c'est déployer**.

---

### Et ce que ton relevé doit porter

Le nom du fichier : `RELEVE_C4_L13_2026-XX-XX.md`, à la racine du dépôt `palimpseste`. **Cinq choses au minimum**, en plus du récit :

1. **le rattachement d'un dépôt à sa semaine que tu as choisi** *(piège 7)* — dérivé de `assigne_at` ou porté par une colonne —, **et ce que tu as amendé au `07-` §1.1** pour l'y écrire ;
2. **la population de semaines que ton cron pose** *(pièges 19-21)* — quelles semaines reçoivent une ligne, pour quels élèves, et ce que devient le drapeau `enVacances` resté mort ;
3. **ce que tu as fait du décor de recette** *(piège 11)*, et comment la recette distingue désormais un semis d'une mesure ;
4. **le bilan que rend ton déclencheur** *(piège 22)*, et le point d'entrée sur lequel `C4-L12` viendra se greffer *(piège 25)* ;
5. **ce qui reste à jouer en recette, avec sa condition de reprise** — parce que c'est cela qui part au `SUIVI_tests_manuels.md`, et de là à C4-L7.

⭐ **Et une chose à dire même si elle est petite** : les **deux lectures UTC du chemin de retrait** *(piège 10)* — corrigées ou relevées, mais jamais tues.
