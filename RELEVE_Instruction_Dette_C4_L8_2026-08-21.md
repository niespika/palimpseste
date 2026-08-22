# RELEVÉ — instruction de la dette de la revue bornée C4-L8

**21 août 2026** · séance d'INSTRUCTION · **aucune écriture ailleurs que dans ce fichier.**
Quatorze items de la liste « la dette, quand le calendrier le permet »
*(`RELEVE_Revue_Bornee_C4_L8_2026-08-21.md`, §9)*, chacun en quatre champs.

---

## ⚠️ CE QUE CETTE SÉANCE A PU FAIRE, ET CE QU'ELLE N'A PAS PU

**La base sandbox est INJOIGNABLE depuis cette session.** Le conteneur d'exécution passe par un
mandataire à liste blanche : `aws-1-us-east-2.pooler.supabase.com:5432` n'y est pas *(TCP en
délai d'attente)*, ni `*.supabase.co` en HTTPS *(code 000)* ; la machine de Louis, elle, n'a
aucune sortie réseau depuis l'outil qui y exécute des commandes. **Aucune sonde n'a donc touché
le projet `aoakpxxlyvthzueaywna`** — et par voie de conséquence aucun `commit`, aucune écriture,
aucun risque pour l'élève réel.

**Ce qui a été fait à la place, et qui vaut mieux qu'une lecture.** Un **PostgreSQL 16 local** a
été monté et le schéma **rejoué depuis les fichiers de migration du dépôt**, dans l'ordre :
échafaudage Supabase *(rôles `anon`/`authenticated`/`service_role`, schéma `auth`, et la ligne
`alter default privileges in schema public grant all on functions to …` que le §2 de la revue
cite)* → `c4_l1_schema.sql` → `c4_l1_seed.sql` → `c4_l1_existant.sql` → `c4_l5_chaine.sql` +
complément → `c4_l8_doctrine.sql` + correctif + complément → `c4_l8_fabrique.sql` →
`fix_effacer_classe.sql` → `fix_retirer_inscription.sql` → `securite_rpc_definer.sql`.
**49 tables, 6 fonctions `security definer`.** Les seules pièces substituées sont les tables
d'amont dont les fichiers ne sont pas au dépôt *(`profiles`, `scriptorium_contenus`,
`scriptorium_exercices_planifies`, `aletheia_livre_reference`)* — réduites à leur clé primaire,
ce qui suffit aux clés étrangères et ne touche aucune garde instruite ici.

**Et la dérivation a été rejouée pour de bon** : `scripts/derive-doctrine.py --racine <copie de
palimpseste-conception> --sql` rend **exactement** les comptes de la revue — 13 objets · 9 crans ·
46 couples · **3 264 routes** · **336 consignes** · **24 guides** · **15 patrons** · **117 lignes
`exercices_types_crans`**. Les items B ont donc été **éprouvés par mutation de copies de sources**,
comme la revue, mais sur les sources **d'aujourd'hui**.

**Ce que cette limite interdit, et où c'est dit dans les items** : tout ce qui porte sur les
**données vivantes** — les deux exercices assignés malformés et leurs 12 dépôts, le nombre réel de
lignes de `competences_correspondance`, l'état effectif des `grant`. Ces points sont marqués
**« non vérifiable ici »** et le disent en clair.

---

## Comment lire les items

Quatre champs, et **le troisième est le seul qui compte**. **Reproduit ?** · **Déjà arbitré ?** ·
⭐ **Ce que ça coûte, et à qui** — un scénario concret, ou l'aveu qu'il n'y en a pas ·
**Les issues**, et une recommandation en une phrase, **sans trancher**.

Une convention de sonde : le trigger `garde_cas_de_la_paire` est
**`DEFERRABLE INITIALLY DEFERRED`** — il ne se déclenche **qu'au `commit`**. Une sonde
`begin; … rollback;` ne le fait **jamais** tomber. Toutes les sondes qui le concernent forcent
donc `set constraints all immediate;` **avec témoin positif et témoin négatif**. *C'est une
remarque de méthode pour la prochaine campagne, et elle est reprise au §« ce que la revue a
manqué ».*

---

# A · Les gardes de la base

## A1 · Les fonctions `security definer` ne vérifient pas leur appelant *(§2)*

**Reproduit ? OUI, et le vecteur exact est plus étroit — et plus concret — que ne le dit la revue.**

L'échafaudage reproduit le mécanisme d'origine à l'identique : avant `securite_rpc_definer.sql`,
`effacer_classe`, `retirer_inscription`, `poser_statut_recette` et
`poser_statut_recette_monitoring` sont exécutables par `anon` **et** `authenticated` ;
`chaine_depense_du_mois` — la seule dont le `revoke` nommait les trois rôles — est déjà fermée.
**Le diagnostic du §2 est exact.**

Sur la renaissance, la mesure tranche en deux :

| geste | `anon` peut exécuter, après ? |
|---|---|
| `create or replace function …` | **non** — l'ACL est attachée à l'objet et survit au remplacement |
| `drop function …` **puis** `create …` | **OUI** — objet neuf, `default privileges` appliqués |

**Donc « une migration future qui recrée la fonction la fera renaître grantée » n'est vrai que si
elle la DROPPE.** Et c'est précisément ce que fait le dépôt : `drop function` n'apparaît que dans
**trois fichiers, tous des `*_rollback.sql`** — dont `c4_l8_fabrique_rollback.sql:44` qui droppe
`poser_statut_recette(text,text,timestamptz)`. Sonde exécutée :

```
avant                                            → anon: f
drop (rollback) puis rejeu de c4_l8_fabrique.sql → anon: t     ← le revoke du 21/08 est défait
```

**Déjà arbitré ?** Partiellement. Le §9 de la revue inscrit au prompt de C4-L3 le piège n° 5 :
*« toute nouvelle fonction `security definer` doit être révoquée de `public, anon,
authenticated` »* — **il vise les fonctions neuves, pas le rejeu d'une migration existante.**
Le `PLAN_DE_CHANTIER.md` §6 ne porte rien là-dessus. **Rien n'est tranché sur la garde interne.**

⭐ **Ce que ça coûte, et à qui.** Le scénario s'écrit, et il n'est pas théorique — c'est le
protocole du dépôt lui-même *(« retour arrière prêt », `SUIVI_SQL` règle 5)* :

> Un lot de correctifs touche `poser_statut_recette`. On joue `c4_l8_fabrique_rollback.sql`, on
> corrige, on rejoue `c4_l8_fabrique.sql`. **On ne rejoue pas `securite_rpc_definer.sql`, parce
> que rien ne dit qu'il le faut.** La fonction est de nouveau exposée en
> `/rest/v1/rpc/poser_statut_recette`, la clé `anon` est dans le bundle du navigateur, et
> `poser_statut_recette('expression','evaluee', <date>)` écrit sur les 17 élèves. **Et rien ne le
> dira** : aucun contrôle du dépôt ne relit les `grant`.

Sur `effacer_classe` et `retirer_inscription`, l'exposition est le §2 déjà corrigé — mais le même
rejeu la rouvrirait, et là c'est la suppression en cascade de sept tables dont
`aletheia_travaux`.

**Les issues.**
1. **Une garde d'appelant dans le corps** de chaque fonction — `if not est_prof() then raise …` —
   *coût : six fonctions, quelques lignes chacune ; c'est la seule qui ne dépend d'aucun geste
   d'exploitation.* Attention : `est_prof()` est elle-même `security definer` sans `search_path`
   *(§8, déjà inscrit au `PLAN_DE_CHANTIER.md` §6)*.
2. **Un `revoke` en pied de chaque fichier qui crée la fonction**, pour que le rejeu se referme
   tout seul — *coût : une ligne par fichier ; ne protège pas d'un fichier futur qui l'oublierait.*
3. **Un contrôle** — la requête `has_function_privilege` sur les `prosecdef` — au `SUIVI_SQL`,
   à jouer après toute migration — *coût : un geste d'exploitation de plus, qu'on peut oublier.*

*Recommandation, sans trancher : les issues 1 et 2 ensemble, la 1 étant la seule qui tienne sans
discipline humaine et la 2 celle qui referme le vecteur du rejeu.*

---

## A2 · La chaîne vide passe partout où le NULL est refusé *(§5.1)*

**Reproduit en base ? OUI.** `not null` n'interdit pas `''` : `exercices_materiaux.contenu = ''`
accepté ; `exercices_types.libelle` accepte `''` **et** `NULL` ; `consigne_gabarit = ''` accepté.
Le constat de la revue est exact **au niveau de la contrainte**.

⭐ **Mais la question posée par le prompt — *lesquelles peuvent réellement recevoir `''` par un
chemin d'écriture existant ?* — renverse le tableau. La réponse est : presque aucune.**

| colonne | chemin d'écriture existant | verdict |
|---|---|---|
| **`exercices_materiaux.contenu`** *(« le texte que l'élève lit »)* | import seul *(`import-ecriture.ts:337`)* | **FERMÉ** — `verifie-import.ts:430` : `if (!nonVide(m.contenu)) v.refuse(…, '`contenu` vide', 3)` |
| `exercices_materiaux.defaut` | id. | **FERMÉ** — `verifie-import.ts:441` |
| `exercices_textes.{auteur,titre,reference,contenu}` | id. | **FERMÉ** — `verifie-import.ts:334-335`, boucle sur les quatre champs |
| `exercices_sujets.enonce` | id. | **FERMÉ** — `verifie-import.ts:364` |
| `exercices_demonstrations.theme` | id. | **FERMÉ** — `verifie-import.ts:381` |
| **`competences_correspondance.reponses` = `{"",""}`** | dépôt de fiche | **IMPOSSIBLE** — `fiche-competence.ts:167` : `.filter(Boolean)` retire les vides **avant** le test `< 2` |
| `exercices_cas.{defaut,reponse_attendue}`, `exercices.guide`, `observable_isole_code` | écran de conception | **FERMÉ** — l'idiome `(String(form.get(…) ?? '').trim() \|\| null)` est appliqué systématiquement *(`conception/actions.ts:64,68,69,113,114,115`, et `:249,260-262` à l'édition)* : un champ vide donne **`null`**, jamais `''` |
| `exercices_types.libelle`, `crans_admis`, `consigne_gabarit` | `derive-doctrine.py` seul | **hors d'atteinte d'une saisie** — écrites depuis les sources |
| ⚠️ **`competences_correspondance.dimension_eleve`** | dépôt de fiche, `fiche-competence.ts:177` | **OUVERT** |
| ⚠️ **`competences_correspondance.question`** | dépôt de fiche, `fiche-competence.ts:178` | **OUVERT** |

**Déjà arbitré ?** Non. Rien au `PLAN_DE_CHANTIER.md` §6, rien aux relevés d'arbitrage.

⭐ **Ce que ça coûte, et à qui — sur les deux colonnes qui restent, et sur elles seules.**

`nu()` *(`fiche-competence.ts:65-71`)* commence par `.replace(/\*\((.*?)\)\*/g, '')` : **une cellule
qui ne contient qu'une note en italique entre parenthèses devient la chaîne vide.** Le scénario :

> Louis rédige la fiche de la Structure. Dans la table de correspondance, pour un observable, il
> écrit la colonne « question » comme `*(à reformuler)*` — un pense-bête, exactement la forme que
> `nu` est fait pour retirer ailleurs. **Le bloc est versé**, la cellule vaut `''`, `reponses` en
> porte deux, aucun avertissement ne remonte. La compétence devient déclarable `evaluee`. L'écran
> « se juger » servira à l'élève **une question vide** avec deux réponses possibles.

Pour les autres colonnes, **je ne sais pas écrire de scénario** — et c'est le résultat : le
constat y est vrai de la contrainte et faux du système.

**Les issues.**
1. **Deux `if (!nonVide(...))` dans `fiche-competence.ts`**, sur le modèle exact du test `reponses`
   déjà présent trois lignes plus haut : le bloc n'est pas versé, un avertissement le nomme —
   *coût : quatre lignes, et le patron existe.*
2. **Des `check (… <> '')` sur les colonnes concernées** — *coût : une migration ; défend contre
   un chemin d'écriture futur, mais ne dit rien de lisible au professeur.*
3. **Les deux.**

*Recommandation, sans trancher : l'issue 1 seule ferme le seul trou atteignable, au coût le plus
bas et avec un message qui explique ; l'issue 2 relève d'un choix de doctrine sur ce que la base
doit garder d'elle-même, qui dépasse cet item.*

---

## A3 · `garde_cas_de_la_paire` ne garde qu'une moitié de la règle *(§5.2)*

**Reproduit ? OUI, intégralement, avec témoins.** Toutes les sondes forcent
`set constraints all immediate` — sans quoi elles ne prouveraient rien *(voir « Comment lire »)*.

```
A3.0  TÉMOIN POSITIF · deux cas de même matériau        → ✗ Refus n° 14 : « les deux cas visent le même matériau »
A3.5  TÉMOIN NÉGATIF · paire=false, deux cas, insertion → ✗ Refus n° 14 : « plus d'un cas hors des trois crans »
A3.1  paire=true, UN seul cas                           → ACCEPTÉE
A3.2  paire=true, ZÉRO cas                              → ACCEPTÉE
A3.3  paire=true, deux cas SANS matériau, MÊME défaut   → ACCEPTÉS      ← l'état exact de 473b2c25
A3.4  paire=true + 2 cas, puis update paire=false       → ÉTAT INTERDIT EN BASE
```

Le contournement A3.4 s'explique par la structure et non par le hasard : le trigger est posé
**sur `exercices_cas` seule** ; `paire_diagnostic` vit sur `exercices`, **que rien ne garde**. Le
même état est refusé à l'insertion *(A3.5)* et fabriqué en un `update` *(A3.4)*.

**Déjà arbitré ?** Non. Le §7 de la revue range cette garde parmi celles « qui tiennent » — sur
les deux cas qu'elle attrape ; le §5.2 en dit l'autre moitié. Rien au `PLAN_DE_CHANTIER.md` §6.

⭐ **Ce que ça coûte, et à qui.** C'est **le seul item de la liste A dont un défaut déjà constaté
en base porte la signature** : le §3.3 de la revue note `473b2c25` — assigné, **2 dépôts d'élèves**,
deux cas **sans matériau** et **le même `defaut` sur les deux**. C'est exactement A3.3.

> Un professeur conçoit une paire diagnostique, remplit le premier cas, est interrompu, revient et
> l'assigne. **La base l'accepte à un seul cas.** L'écran élève doit servir deux cas pour mesurer
> un transfert ; il en trouve un. Ou bien : les deux cas portent le même défaut et aucun matériau
> — **la paire ne mesure aucun transfert, et le diagnostic rend un résultat sur rien.**

⚠️ **Le coût dépend d'un lot qui n'est pas écrit** : l'écran élève n'existe pas *(§1 de la revue)*.
Tant qu'il n'existe pas, une paire malformée ne fait rien de faux — elle attend. **Le jour où il
existe, elle sert un diagnostic faux sans le dire.**

**Les issues.**
1. **Compléter la fonction** : refuser `v_paire and v_n <> 2`, et refuser deux cas dont aucun ne
   nomme de matériau — *coût : trois lignes dans une fonction qui existe ; ⚠️ mais le trigger est
   `INITIALLY DEFERRED`, donc il tombe au `commit` : une transaction qui crée un exercice et son
   premier cas en deux gestes reste possible, c'est même pour ça qu'il est différé.*
2. **Poser le même trigger sur `exercices`** *(UPDATE OF `paire_diagnostic`)* — ferme A3.4 —
   *coût : un trigger de plus, et il faut vérifier qu'il ne gêne pas les mises à jour légitimes.*
3. **Les deux**, qui traitent deux défauts distincts : l'incomplétude *(1)* et le contournement *(2)*.

*Recommandation, sans trancher : l'issue 3, avec l'issue 1 d'abord — c'est elle qui couvre l'état
déjà présent en base, et elle ne demande pas d'objet nouveau.*

---

## A4 · La date du statut de recette accepte son propre effacement *(§5.3)*

**Reproduit ? OUI, sur les trois points — et un quatrième que la revue n'a pas nommé.**

```
A4.0  TÉMOIN · update du seul statut          → ✗ Garde 07- §1.3 : « la date DANS LE MÊME GESTE »
A4.1  poser_statut_recette(…,'2000-01-01')    → ACCEPTÉ · statut=evaluee, date=2000-01-01
A4.2  poser_statut_recette(…,'2099-01-01')    → ACCEPTÉ · date=2099-01-01     ← non nommé par la revue
A4.3  update statut='evaluee', pose_le=null   → ACCEPTÉ · statut=evaluee, date=NULL
A4.4  deux poses de la MÊME compétence, une transaction  → ✗ REFUSÉE
A4.5  deux poses de DEUX compétences, une transaction    → ACCEPTÉES
```

**A4.3 s'explique par la garde elle-même.** `garde_statut_porte_sa_date` ne lève que si
`new.statut_recette IS DISTINCT FROM old.statut_recette` **ET**
`new.statut_recette_pose_le IS NOT DISTINCT FROM old.…`. Poser `NULL` sur une date non nulle rend
la seconde condition **fausse** : la garde ne voit pas passer l'effacement qu'elle existe pour
interdire.

**A4.5 corrige la revue sur son second grief.** Le refus de A4.4 ne frappe **pas** « deux poses
dans la même transaction » : il frappe **deux poses de la même compétence**. Six compétences
posées d'affilée dans une transaction passent sans un mot. Le grief « trop étroite » est donc
réel mais **beaucoup plus rare** que la formule ne le laisse croire : il faut poser deux fois la
même compétence dans une transaction, et **aucun chemin applicatif ne le fait**.

**Déjà arbitré ?** Non.

⭐ **Ce que ça coûte, et à qui.** La colonne a **un seul lecteur déclaré** — le recalcul de la
lettre depuis les mesures **postérieures** à la recette.

> Louis déclare l'Expression `evaluee` et se trompe de date — ou copie une date depuis un ancien
> relevé. La fonction l'accepte. **La recette est antidatée : le recalcul compte alors toutes les
> mesures jamais faites**, y compris celles d'avant que la fiche existe. La lettre servie à
> l'élève est calculée sur un corpus que la doctrine excluait. **Le défaut exact que la colonne
> existe pour empêcher, atteint par le geste que la fonction propose.**

Sur A4.3, le scénario demande un `update` direct en SQL — **il n'y a pas de chemin applicatif**,
et je le dis : c'est un constat de contrainte, pas de système. Sur A4.4, le coût est un message
qui **accuse le professeur d'avoir omis la date alors qu'il l'a fournie deux fois** — désagréable,
sans conséquence sur une donnée, et sur un chemin que rien n'emprunte.

**Les issues.**
1. **Borner `p_pose_le`** dans la fonction : ni antérieure au dépôt de la fiche
   *(`competences_fiches.deposee_at`, qui est en base et que la fonction lit déjà pour le plancher
   1)*, ni postérieure à `now()` — *coût : quatre lignes, et les deux bornes sont à portée de la
   requête.* **C'est la seule issue qui traite A4.1 et A4.2 ensemble.**
2. **Un `check` sur `competences_niveaux`** : `statut_recette <> 'differee'` implique
   `statut_recette_pose_le is not null` — ferme A4.3 — *coût : une contrainte.*
3. **Élargir la garde** au cas des deux poses *(comparer aussi `updated_at`, ou lever seulement
   quand la date est inchangée ET non nulle)* — *coût : faible ; bénéfice : un message juste sur
   un chemin que personne ne prend.*

*Recommandation, sans trancher : les issues 1 et 2, qui ferment ce qui fausse une lettre ;
l'issue 3 est un confort et peut attendre indéfiniment.*

---

## A5 · Le reste, en bref *(§5.4)* — **onze constats, et ils ne se valent pas**

Tous **reproduits en base**. Ce qui les sépare est ce qui les atteint.

### A5-a · Ceux qu'aucun chemin applicatif n'atteint — **ils sortent de la liste**

| constat | reproduit en base | ce que le code fait |
|---|---|---|
| **« une entrée bloquée se valide »** | ✓ *exercice `bloque=true` → `concu` ; texte `bloque=true` → `valide`* | **GARDÉ.** `corpus/actions.ts:118-127` — `validerEnFile` lit les bloquées et les exclut ; une lecture ratée refuse **tout** *(`:120-124`)*. Le commentaire `:114-117` dit qu'il le sait : *« C'EST LE SEUL GARDE-FOU SERVEUR […] aucune contrainte de base ne lie `bloque` à `statut` »*. Second rideau à l'écran : `FileDeValidation.tsx:37,70`. ⚠️ *Et la prémisse est inexacte sur `exercices_materiaux`, qui n'a pas de colonne `bloque`.* |
| **« un dépôt `clos` passe à `retire` »** | ✓ | **INATTEIGNABLE.** Aucun chemin applicatif n'écrit `retire` sur `exercices_depots`. Le seul `.update()` visant la table est `conception/actions.ts:357` et n'écrit que `{ echeance }`. `retire` n'y est posable qu'en SQL direct. |

### A5-b · Ceux qui sont le comportement voulu, mal nommé

| constat | ce qu'il est réellement |
|---|---|
| **« `id_import` unique globalement, pas par import »** | ✓ reproduit — et **les cinq** tables portent le même index *(`exercices`, `exercices_textes`, `exercices_sujets`, `exercices_materiaux`, `exercices_demonstrations`)*, pas la seule que la revue nomme. **Mais la collision est le régime voulu** : `verifie-import.ts:302-306` — *« L'IDEMPOTENCE : une entrée dont l'`id` existe déjà est IGNORÉE, jamais dupliquée, jamais écrasée en silence (`08-` §1 ; piège 11) »*. ⚠️ **Le défaut réel n'est pas l'unicité, c'est que `ignores` n'est rendu par AUCUN écran** *(présent au verdict `verifie-import.ts:789`, absent de tous les `.tsx`)*. |

### A5-c · Ceux qui restent, et qui sont réels

| constat | reproduit | ⭐ ce que ça coûte |
|---|---|---|
| **`exercices_intervalles_chk` ne contrôle que la longueur** | ✓ `{50,10}` · `{-3,-1}` · `{7,7}` · englobant `{1,2}` qui n'englobe pas `{5,9}` · coordonnées sans texte source — **tous acceptés** | Ce sont **les coordonnées qui découpent le texte servi**. Un englobant qui n'englobe pas, ou une borne inversée, sert à l'élève un extrait faux ou vide — **et l'écran qui le sert n'existe pas encore**, donc rien n'est faux aujourd'hui. |
| **aucun énuméré sur `observable_isole_competence`** | ✓ `patate` passe | Le champ décide **quelle compétence est mesurée**. Une valeur hors des six ne correspond à aucune fiche : la mesure part dans le vide. ⚠️ *Mais `conception/actions.ts` le prend de la route, pas d'une saisie libre, et l'import le contrôle contre la doctrine — je ne sais pas écrire de scénario d'écriture réelle.* |
| **aucun minimum de trois distracteurs** *(refus n° 13)* | ✓ `distracteurs: []` accepté | Le cran 1 sert **quatre candidats**. Une banque vide en sert un. C'est le défaut du §3.3 de la revue, constaté **sur deux exercices assignés** — *non vérifiable ici : la base vivante est injoignable.* |
| **le cran accepte `4.4`, `'4'`, `patate`** | ✓ `exercices.cran` est **`text` sans énuméré** | Le cran commande tout — appui, matériau, jugement. Un cran hors échelle n'est routé nulle part. ⚠️ *L'arrondi silencieux `4.4 → 4` est une conversion vers les colonnes `integer` de la doctrine, pas vers `exercices.cran`, qui garde `'4.4'` tel quel.* |
| **`demonstrations_formes` ne garde pas le couple** | ✓ `exemple × macro` accepté ; les trois formes en `micro` acceptées | Une démonstration est servie **au grain de l'observable**. Le mauvais grain sert un exemple qui ne montre pas ce qu'il doit. |
| **`doctrine_derivation` n'a aucune unicité** | ✓ ligne vide, dupliquée, et `comptes = {"exercices_routes": 999999}` acceptées | **L'autorité repose sur `derive_at desc` seul.** Une ligne mensongère insérée après la vraie devient la référence de `--verifie`. ⚠️ *Il faut un accès `service_role` pour l'écrire — donc un geste délibéré ou un script fautif, pas une manœuvre d'un tiers.* |
| **le plancher 2 teste l'existence, pas la complétude** | ✓ `evaluee` posé avec **une seule** correspondance | Le plancher existe pour garantir qu'on sait **nommer à l'élève** chaque observable mesuré. Avec une correspondance sur huit, sept observables restent innommables et le retour ne s'écrit pas. *Le compte réel n'est pas vérifiable ici.* |

**Déjà arbitré ?** Aucun des onze n'est au `PLAN_DE_CHANTIER.md` §6 ni aux relevés d'arbitrage.

**Les issues, communes.** Ces gardes se posent toutes de la même façon — un `check` ou un trigger,
avec un message en français citant sa source, sur le modèle des **quatre gardes exemplaires** que
le §5.5 de la revue nomme. *Coût : une migration additive, non cassante, sur une base dont aucune
donnée existante ne viole ces règles — à vérifier avant, ce que cette séance n'a pas pu faire.*

*Recommandation, sans trancher : traiter A5-c en un seul geste et laisser tomber A5-a et A5-b, qui
ne sont pas des problèmes ; à l'intérieur de A5-c, `exercices_intervalles_chk` et le minimum de
trois distracteurs sont les deux qui touchent ce que l'élève reçoit.*

---

## A6 · Les messages d'erreur trahissent, et fuient *(§5.5)*

**Reproduit ? DEUX TIERS OUI, ET LA « FUITE » — NON.**

**Ce qui se reproduit.** Les deux cas trompeurs sont exacts :

```
mode 'evaluer' (sans accent) → ERROR: new row … violates check constraint "exercices_materiaux_mode_check"
                               DETAIL: Failing row contains (…, evaluer, …)
mode 'évaluer' (avec accent) → ACCEPTÉ
empreinte SHA-256 MAJUSCULE  → ERROR: … violates check constraint "exercices_textes_empreinte_check"
empreinte minuscule          → ACCEPTÉE
```

Dans les deux cas, **le dump ne dit pas ce qui cloche**, et la différence est invisible à l'œil.

**Ce qui NE se reproduit pas : la fuite.** La revue écrit que sur `exercices_depots`,
`DETAIL: Failing row contains …` **affiche l'`eleve_id`**. Le `DETAIL` le contient, oui — sonde
exécutée. **Mais il n'atteint aucun écran.** Le champ Supabase `error.details` — celui qui porte
le `DETAIL` — n'est rendu **nulle part** : ses deux seules lectures sont des `console.error`
serveur *(`CoutApi.tsx:34,74`)*. Le `details?: string[]` de `competences/actions.ts:24`, rendu par
`DepotFiche.tsx:37-39`, est un champ **maison**, rempli par du code applicatif *(des
`fiche.avertissements`)*, sans rapport avec Postgres. **Seul `error.message` remonte à l'écran.**
Et l'écran en question est un écran **professeur** : l'`eleve_id` y serait montré à quelqu'un qui
lit déjà la table. **Ce n'est une fuite dans aucun sens utile du mot.**

**Déjà arbitré ?** Non.

⭐ **Ce que ça coûte, et à qui.**

> Un générateur produit une banque où `mode` vaut `evaluer` — un fichier passé par un outil qui
> déplie les accents, ou un copier-coller depuis un terminal. Le contrôle d'import le refuse
> proprement *(`verifie-import.ts:432` : « mode inconnu »)*. **Mais si la ligne arrive par une
> autre porte** — une reprise SQL, un script — le professeur reçoit
> `violates check constraint "exercices_materiaux_mode_check"` et **rien qui nomme l'accent**.
> Il relira son fichier vingt fois.

⚠️ **Le coût est donc BEAUCOUP plus faible qu'il n'y paraît**, parce que le contrôle d'import
attrape les deux cas en amont avec un message en français. Le dump brut n'est atteint que par les
chemins qui contournent l'import.

**Les issues.**
1. **Ne rien faire sur la fuite** — elle n'existe pas *(voir ci-dessus)*.
2. **Normaliser à l'entrée plutôt que d'expliquer au refus** : replier l'empreinte en minuscules,
   et l'accent de `évaluer` — *coût : deux lignes ; ⚠️ mais cela ferme un refus dont la doctrine a
   peut-être voulu la sévérité, et ce n'est pas à cette séance d'en décider.*
3. **Des messages nommés** sur ces deux contraintes, sur le patron des quatre gardes exemplaires —
   *coût : une migration ; bénéfice limité aux chemins hors import.*

*Recommandation, sans trancher : l'issue 3 sur ces deux contraintes seulement, et laisser tomber
la fuite ; l'issue 2 demande un arbitrage de doctrine que je ne prends pas.*

---

## A7 · Deux objets fantômes *(§6.5, première moitié)*

**Reproduit ? LE COMPTE, OUI. LE MOT « FANTÔME », NON — ET LA CONDITION EST TENUE.**

`exercices_types` porte bien **15 lignes**, `libelle`, `grain` et `crans_admis` vides sur
`diagnostic_essai` et `diagnostic_explication_texte`. **Mais ce ne sont pas des orphelins :**

- ce sont les deux lignes de **`nature = 'complet'`**, seedées **délibérément** par
  `c4_l1_seed.sql:84-90`, avec un commentaire qui les nomme — *« L'essai. Aucun support d'auteur
  n'est exigé par construction »* ;
- la contrainte **`types_complet_sans_objet_ni_cran_chk`** **exige** que `nature = 'complet'` ait
  `grain is null` et zéro `crans_admis`. **Leurs champs vides sont la forme que la base leur
  impose**, pas un remplissage manqué ;
- il n'y a donc pas « 15 lignes pour 13 objets » mais **13 objets et 2 diagnostics complets**,
  deux `nature` différentes dans une même table.

**La condition posée par le prompt — *« inoffensifs tant qu'aucun écran ne liste `exercices_types`
sans filtre » : est-elle tenue partout ?* — la réponse est OUI.** Quatre sites lisent la table :

| site | filtre |
|---|---|
| `conception/actions.ts:140` | `.eq('code', objet).single()` |
| `utils/chaine/contexte.ts:137` | `.eq('id', exercice.type_id)` |
| `utils/chaine/mesures.ts:73` | `.eq('id', e.type_id)` |
| `utils/fabrique/import-ecriture.ts:329` · `utils/fabrique/doctrine.ts:386` | **sans filtre SQL** |

Les deux derniers lisent les 15 lignes — **et le filtre est immédiatement après, en TypeScript** :
`utils/fabrique/doctrine.ts:216-221`

```ts
// Les deux types diagnostiques (`nature` `complet`) n'ont ni objet ni cran :
// ils n'entrent ni dans le format d'import (`08-` §5) ni dans le pipeline
// du `02-` §6 B — ils sont le « fait quand » de C4-L4 (piège 2).
if (t.nature === 'complet') continue
```

C'est `d.objets` qui alimente l'écran de conception *(`conception/nouvelle/page.tsx:39,59-66`)*
**et** le contrôle d'import *(`verifie-import.ts:426` : `declaree(d.objets, m.objet)`)*. **Les deux
types complets sont donc écartés avant d'atteindre le professeur, avant d'atteindre l'import, et
avant d'atteindre l'élève.** Aucun `.tsx` ne liste la table sans filtre. **Le filtre existe ; il
est en TypeScript et non dans la requête.**

**Déjà arbitré ?** Oui, en amont : le piège 2 du prompt de lot, cité par le commentaire, dit que
ces deux types sont « le *fait quand* de C4-L4 ».

⭐ **Ce que ça coûte, et à qui. RIEN, et je n'arrive pas à écrire de scénario** — ce qui est
l'information. Le seul coût imaginable est **de lecture** : quelqu'un qui compte les lignes de
`exercices_types` lira 15 et cherchera 13.

**Les issues.** *(1)* Rien. *(2)* Un `.neq('nature','complet')` dans les deux requêtes non filtrées
— *coût : deux mots ; bénéfice : rendre le filtre visible là où on le cherche.*

*Recommandation, sans trancher : cet item sort de la liste ; si quelque chose devait être fait,
c'est l'issue 2, qui est une clarté de lecture et non une correction.*

---

# B · Les cribles de la dérivation

## B8 · Le resserrement par `crans[]` est silencieux *(§6.2)*

**Reproduit ? OUI, et exécuté.** Mutation d'un `crans[]` d'en-tête, de `**les neuf**` à `1, 3` :

```
avant : routes = 3264 · exercices_types_crans = 117
après : routes = 3064 · exercices_types_crans = 110       ← 200 routes et 7 lignes disparues
le script dit : « ✓ doctrine chargée — … 544 routes · 56 observables instanciés … »   ← INCHANGÉ
```

Le resserrement est bien à `doctrine.py:459` *(`retenus = [c for c in crans if c in
self.objets[o].crans]`)*, **sans journal** ; le compteur est bien à `derive-04.py:141-143`.

⚠️ **Mais la promesse du `04-:71` nomme `derive-04.py`, et `derive-04.py` la tient.** Ce sont deux
dérivations distinctes : `derive-04.py` engendre le **document** `04-Instances_Exercices.md` depuis
`instances/` ; `derive-doctrine.py` (via `noyau/doctrine.py`) engendre la **base**. La promesse
n'est pas rompue — **elle ne couvre simplement pas la seconde chaîne.**

⚠️ **Et la seconde moitié du constat est FAUSSE.** « `--verifie` dira toujours IDENTIQUE » ne tient
pas : son **bloc (a)** compare les **empreintes SHA des sources** à celles de la dernière
dérivation et dit `SOURCES : DIVERGE — <fichier>` dès qu'une source bouge ; et `exercices_routes`
est comparée par compte **et** empreinte de contenu. `--verifie` ne dit `IDENTIQUE` qu'**après**
qu'on ait rejoué `--sql` sur la source mutée — ce qui est vrai de **toute** édition de source et
est exactement ce que le piège 6 du prompt énonce déjà *(« il prouve la stabilité, jamais la
justesse »)*.

**Déjà arbitré ?** Le `PLAN_DE_CHANTIER.md` §6 porte deux voisins — *« `exercices_types_crans` est
écrite par `--sql` et jamais lue par `--verifie` »* et le **résumé qui ment** — **tous deux
inscrits le 21/08**, le second en **séance dédiée**. Le resserrement lui-même n'y est pas.

⭐ **Ce que ça coûte, et à qui.**

> Un lot restreint un objet à quelques crans — précisément l'usage pour lequel le champ existe,
> et que le `04-:71` appelle son *« domicile de la première restriction qui viendra »*. On rejoue
> `--sql`. **La ligne de résumé est identique au caractère près**, parce qu'elle compte les 544
> **déclarations** et jamais les 3 264 **routes**. Deux cents routes ont disparu. Le routeur, le
> jour venu, ne servira rien sur ces couples — **et rien n'aura dit qu'une restriction a eu lieu.**

**C'est le même défaut que le « résumé qui ment » du `PLAN_DE_CHANTIER.md` §6, vu par un autre
bout** : un résumé qui ne peut pas voir une perte n'est pas un contrôle.

**Les issues.**
1. **Ajouter le compteur à `noyau/doctrine.py`**, sur le modèle exact de `derive-04.py:141-143` —
   *coût : quelques lignes.*
2. **Compléter `Doctrine.resume()`** *(`doctrine.py:661-668`)* pour qu'il nomme les **routes
   effectives**, les **336 consignes**, les **24 guides** et les **11 genres** — *coût : une ligne
   de format ;* ⚠️ **et cette issue-là ferme aussi B9-d, B9-e et B9-f** *(voir B9)*.
3. **Les deux.**

*Recommandation, sans trancher : l'issue 2 d'abord, parce qu'elle est unique et couvre quatre
constats ; l'issue 1 ensuite, qui nomme la cause au lieu de la laisser deviner. À noter : l'issue 2
est le geste que le `PLAN_DE_CHANTIER.md` §6 a déjà envoyé en séance dédiée — c'est la même.*

---

## B9 · Quatre cribles ignorent au lieu de refuser *(§6.3)*

**Reproduit ? QUATRE MUTATIONS SUR SIX SONT DÉSORMAIS GARDÉES. Trois seulement survivent — et
elles sont un seul défaut.** Les six mutations de la revue, rejouées sur les sources d'aujourd'hui :

| mutation légitime en markdown | effet | dit-il quelque chose ? |
|---|---|---|
| `<!--ROUTAGE` sans espace **ou** deux espaces | routes 3264→3204, consignes 336→330 | ⚠️ le résumé **bouge** *(544→534 routes, 56→55 observables)* — **et `derive-04.py --verifie` dit `DIVERGENT`** |
| une ligne de genre retirée | — | **✗ REFUSÉ** : *« `partie` admet les genres [...] et la table par genre en pourvoit [...] »* |
| le `×` écrit `x` | — | **✗ REFUSÉ** : message analogue sur `conclusion` |
| une table « variante nommée » sous les genres *(« le plus retors »)* | — | **✗ REFUSÉ** : *« les objets qui déclinent leur guide au genre ne se recoupent pas — … pourvus par la table ['argument', …] »* |
| titre « Les six crans qui isolent » **sans gras** | consignes 336→**330** | **RIEN.** Résumé identique. `derive-04.py --verifie` : `IDENTIQUE` |
| un `\|` littéral dans une consigne | consignes 336→**335** | **RIEN.** Idem |
| un 7ᵉ cran ajouté à une table de six | consignes 336→**337** | **RIEN.** Idem |

⭐ **Les trois mutations qui restent touchent LA MÊME TABLE et sont invisibles pour LA MÊME
RAISON** : `exercices_consignes_isolees`, et un résumé de chargement qui ne nomme jamais les 336
consignes. **Ce n'est pas quatre cribles à écrire : c'est une ligne de résumé à compléter.**

**Le précédent du §14.2 a déjà fait son travail.** Le contrôle à trois hauteurs
*(`doctrine.py:560-601` — les objets vus de trois côtés, et le **compte que la prose annonce en
toutes lettres**)* tue les trois mutations sur les genres, **y compris celle que la revue appelait
« le plus retors »** et que le `04-:1576` désignait comme sa propre parade. La leçon citée par le
prompt — *« un compte sur les entités ne garde pas les lignes »* — est exactement la forme du
remède qui manque ici, transposée : **il faut un compte sur les CONSIGNES.**

**Déjà arbitré ?** Le remède est le même que celui du **résumé qui ment**, `PLAN_DE_CHANTIER.md`
§6, **inscrit le 21/08 et envoyé en séance dédiée** — qui écrit d'ailleurs, mot pour mot :
*« une perte de six consignes laisserait "56 observables instanciés" intact »*. **C'est le cas d-.**

⭐ **Ce que ça coûte, et à qui.**

> Louis retire le gras d'un titre en relisant une `instances/`, ou glisse un `|` dans une consigne
> pour marquer une alternative. Il rejoue `--sql`. **Le script affiche la même ligne, au caractère
> près.** Six consignes ont disparu de la banque. Aux couples (objet × mode × cran) concernés,
> l'écran de conception n'offrira **aucune consigne** — et le blocage n° 3 de l'import
> *(« la route existe, la consigne manque », `08-` §7.2)* refusera des banques légitimes sans que
> personne comprenne pourquoi.

**Les issues.**
1. **Compléter `Doctrine.resume()`** — *ferme d-, e- et f- d'un coup ; coût : une ligne ; c'est
   l'issue 2 de B8, et le geste déjà envoyé en séance dédiée.*
2. **Faire annoncer son compte à chaque `instances/`**, sur le patron du §14.2 *(la prose annonce,
   le code vérifie — `doctrine.py:590-601`)* — *coût : six lignes de prose et un contrôle ;
   ⚠️ demande d'éditer six documents que Louis signe.*
3. **Un crible sur la forme du titre et sur le nombre de colonnes** — *coût : modéré ; ⚠️ chaque
   crible de forme est une nouvelle façon d'être trop strict.*
4. **Rien sur la première ligne du tableau** : elle est déjà gardée par `derive-04.py --verifie`,
   que le `04-` §0 ligne 7 désigne explicitement.

*Recommandation, sans trancher : l'issue 1 seule, qui rend les trois mutations bruyantes pour un
coût d'une ligne ; l'issue 2 est le vrai contrôle et mérite d'être pesée à part, parce qu'elle
touche des documents signés.*

---

## B10 · La syntaxe de la ligne `<!-- ROUTAGE -->` n'est spécifiée nulle part *(§6.3, aggravant)*

**Reproduit ? OUI, littéralement.** Comptage :

```
02-exercices.md          : 0 occurrence de « ROUTAGE »
07-Implementation.md     : 0
08-FORMAT_IMPORT.md      : 0
04-Instances_Exercices.md: 2  — ligne 7 (le rôle) et ligne 46 (ce que la ligne NOMME)
```

Le `04-` §0 ligne 46 dit ce que la ligne *nomme* — *« l'observable, sa compétence, ses modes, ses
crans et ses objets »* — **jamais comment elle s'écrit**. La syntaxe n'existe que sous forme
d'expression régulière, dans **deux lecteurs indépendants** : `doctrine.py:448`
*(`<!-- ROUTAGE section=(\d+) nom=(\S+) (.*?) -->`, **une espace exacte**)* et un second dans
`derive-04.py`.

**Déjà arbitré ?** Non.

⭐ **Ce que ça coûte, et à qui.** Le coût **n'est pas** celui que la revue lui prête. La garde
`if "<!-- ROUTAGE" not in corps: continue` *(`doctrine.py:442`)* fait bien traverser une section
mal espacée en silence — **mais `derive-04.py --verifie` la voit** *(mesuré : `DIVERGENT`)*, et le
résumé bouge. **Le coût réel est ailleurs, et il est humain :**

> Quelqu'un — Louis, ou un lot à venir — ajoute un observable et écrit sa ligne de routage en
> s'appuyant sur l'exemple voisin. Il met deux espaces, ou omet `nom=`. **La section entière
> n'entre pas.** Le contrôle qui l'attrape *(`derive-04.py --verifie`)* dit « DIVERGENT — relancer
> sans `--verifie` » — et **relancer régénère le `04-` avec la section manquante**, ce qui referme
> l'alerte en entérinant la perte. **La spécification manquante ne cause pas la perte : elle
> empêche de comprendre l'alerte.**

**Les issues.**
1. **Écrire la syntaxe au `04-` §0**, à côté de la ligne 46 qui dit déjà ce qu'elle nomme —
   *coût : un paragraphe dans un document VALIDÉ ET GELÉ, donc l'accord explicite de Louis.*
2. **Faire refuser la ligne mal formée** au lieu de sauter la section : si le corps contient
   `ROUTAGE` sous une forme quelconque et que la regex ne mord pas, lever `SourceMouvante` —
   *coût : trois lignes, et c'est le comportement que le reste du fichier applique déjà partout
   ailleurs.*
3. **Les deux.**

*Recommandation, sans trancher : l'issue 2 d'abord — elle transforme un silence en arrêt net et ne
touche aucun document signé ; l'issue 1 ensuite, quand un `04-` s'ouvrira pour autre chose.*

---

## B11 · Cinq « variantes nommées » ne sont dérivées nulle part *(§6.4)*

**Reproduit ? LE FOND, OUI. LE CRITÈRE D'ARRÊT, NON — ET C'EST UNE ERREUR DE CATÉGORIE.**

### Le fond : confirmé, et chiffré

La clé de `exercices_consignes_isolees` est **`(competence, source_section, cran)`**, et le
commentaire de `c4_l8_doctrine.sql:219-221` le dit sans détour :

> *« la CONSIGNE appartient à l'OBSERVABLE, pas à l'objet : un même texte sert tous les objets que
> la route nomme. »*

Le mot « variante » n'apparaît dans **aucun script** — ni `generateur/`, ni `scripts/`, ni le code
TypeScript *(les six occurrences trouvées sont des propriétés d'affichage sans rapport)*.

Les cinq blocs se lisent **« Variante d'objet »**, et ils ne demandent pas tous la même chose :

| source | ce qu'elle demande | destinataire |
|---|---|---|
| `04-argumentation.md:220` | *« les consignes se lisent « cette **référence** » plutôt que « cette citation »* | **le texte servi** |
| `04-expression.md:224` | *« les consignes se lisent « cette **transition** »* | **le texte servi** |
| `04-structure.md:73` | *« le cran 1 offre trois transitions entre les deux mêmes blocs »* | **la fabrique du matériau** |
| `04-structure.md:141` | *« le cran 1 offre trois mots de liaison pour le même passage »* | **la fabrique du matériau** |
| `04-synthese.md:78` | *« le cran 1 offre trois lectures de la même phrase »* | **la fabrique du matériau** |

⚠️ **Trois des cinq ne sont pas un trou de dérivation** : elles s'adressent à qui écrit le
matériau, et le matériau est **écrit à la main et importé** — la dérivation n'a jamais eu à les
porter. **Le trou porte sur deux blocs**, ceux que la revue nomme d'ailleurs correctement.

**Le chiffre exact**, relevé sur la dérivation rejouée :
`reference × argumentation §5` → **6 routes**, crans 1·3·4·5·7·9 ;
`transition × expression §6` → **6 routes**, mêmes crans. **Douze couples (objet × cran)** servent
une consigne dont la source dit qu'elle devrait se lire autrement. Exemple en base aujourd'hui :

```
('argumentation',5,4,…,'« Cette citation est **décorative** — elle ne prouve rien. … »')
```
— servie pour l'objet `reference`, dont la variante dit qu'on devrait lire « cette référence ».

### Le critère d'arrêt : la revue compte les mauvaises variantes

Le `04-:1576` dit :

> *« Ce §14.2 fait le pari que **le guide ne dépend pas du mode**. […] La parade prévue est la
> **variante nommée**, écrite sous la table. **Au-delà de TROIS variantes, le pari est perdu.** »*

Le compteur de ce critère porte sur des variantes **du GUIDE, par MODE, écrites sous la table du
§14.2**. Le mot « variante » apparaît **exactement une fois dans tout le `04-`** : dans le critère
lui-même. **Il y en a donc ZÉRO, pas cinq.**

Les cinq relevées sont des variantes **de la CONSIGNE, par OBJET**, dans les `instances/`, régies
par une **autre** règle — `04-argumentation.md:15` : *« La consigne […] ne change pas d'un objet à
l'autre — sauf variante nommée »*. **Deux registres, deux tables, deux seuils.** ⚠️ **Le critère
d'arrêt du §14.2 n'est pas franchi, et rien ne commande de passer aux 46 blocs.**

**Déjà arbitré ?** Non — mais le `02-exercices.md:439` change la portée du reste :

> *« Une **banque de consignes** s'affiche […] le professeur en choisit une, **puis il peut en
> réécrire la formulation avant de valider** — la banque donne **un point de départ générique**,
> et **c'est le texte qu'il arrête que l'élève lit**. »*

**La doctrine tient déjà la consigne dérivée pour un point de départ générique.** L'élève ne reçoit
pas « la formulation générique » : il reçoit ce que le professeur a arrêté.

⭐ **Ce que ça coûte, et à qui.**

> Le professeur conçoit un exercice sur `reference`, cran 4, argumentation. Le champ est
> prérempli avec « Cette citation est décorative… ». **La variante qui dit d'écrire « cette
> référence » vit dans `instances/04-argumentation.md`, que l'écran de conception ne montre pas.**
> S'il ne la connaît pas par cœur, il valide le texte tel quel — sur douze couples possibles.

Le coût est donc **une nuance de formulation, sur douze couples, rattrapable d'un geste que la
doctrine prévoit, et invisible tant qu'aucun professeur ne conçoit sur ces deux objets.**

**Les issues.**
1. **Rien**, en actant que la réécriture par le professeur est le mécanisme prévu — *coût : nul ;
   ⚠️ mais la variante reste écrite dans une source que rien ne sert.*
2. **Faire remonter la variante à l'écran** comme note à côté du champ prérempli — *coût : une
   colonne dérivée et un affichage ; c'est le geste qui respecte la source sans toucher la clé.*
3. **Élargir la clé** de `exercices_consignes_isolees` à l'objet — *coût : élevé, et ⚠️ il
   contredit frontalement le commentaire de doctrine cité plus haut.*

*Recommandation, sans trancher : l'issue 2, qui sert la variante à qui doit la lire sans toucher
une clé que la doctrine justifie explicitement. **Et le critère d'arrêt du §14.2 est à retirer de
la liste : il n'est pas franchi.***

---

## B12 · `exercices_types.nature` — l'accent de la source, l'absence d'accent en base *(§6.9)*

**Reproduit ? OUI, sur les quatre maillons.**

```
source   : 02-exercices.md:49-52  →  « élément »   (avec accent)
base     : c4_l1_seed.sql:52-58   →  'element'     (tapé à la main, sans accent)
contrainte : CHECK (nature = ANY (ARRAY['moment','element','complet']))   ← n'admet que celle-là
fixture  : derive-doctrine.py:598  →  {"nature": o.nature}  = « élément », lu de la source
```

Et le contrôle : `types_objet` ne transporte que `(code, crans, excl, libelle)` — **`nature` n'est
pas dérivée** ; `--verifie` ne l'emploie que comme filtre *(`derive-doctrine.py:761` :
`where nature <> 'complet'`)* et **ne la compare jamais**.

**Déjà arbitré ?** Non. Le `PLAN_DE_CHANTIER.md` §6 porte deux angles morts voisins de
l'outillage — `exercices_types_crans` non comparée, et le chemin absolu de la racine — **pas
celui-ci**.

⭐ **Ce que ça coûte, et à qui. Rien aujourd'hui, et je le dis.** La colonne n'est écrite que par
le seed, jamais par la dérivation ; personne ne compare les deux formes. Le coût est **différé et
certain** :

> Un lot ajoute `nature` aux colonnes que `derive-doctrine.py` remplit — geste naturel, puisque le
> lot revendique de ne rien recopier à la main. Le `--sql` engendre `'élément'`, la contrainte
> refuse, **et la migration échoue en bloc**, sur une transaction unique qui posait douze tables.
> Le message dira `violates check constraint "exercices_types_nature_check"` et **rien sur
> l'accent** *(voir A6)*.

**Les issues.**
1. **Aligner la base sur la source** : ajouter `'élément'` à la contrainte et migrer les quatre
   lignes — *coût : une migration sur une colonne qu'aucun code ne compare ; ⚠️ à vérifier :
   qui lit `nature` côté TypeScript ? `doctrine.ts:216` le fait, sur `'complet'` seulement.*
2. **Aligner la source sur la base** — *coût : éditer le `02-`, document signé, pour retirer un
   accent français correct. Peu défendable.*
3. **Rien, et l'écrire au `PLAN_DE_CHANTIER.md` §6** à côté des trois angles morts déjà là, comme
   piège nommé pour le lot qui dérivera `nature` — *coût : trois lignes.*

*Recommandation, sans trancher : l'issue 3 aujourd'hui et l'issue 1 le jour où un lot ouvre cette
colonne — l'item est une dette d'information, pas de code.*

---

## B13 · Trois valeurs recopiées en dur *(§6.9)*

**Reproduit ? OUI — et l'une des trois est bien moins chère à corriger que la revue ne le laisse
croire.**

| valeur | où | la source la porte-t-elle lisiblement ? |
|---|---|---|
| `CRANS_QUI_ISOLENT = (1,3,4,5,7,9)` · `CRANS_DE_PRODUCTION = (2,6,8)` | `derive-doctrine.py:59-60` | **OUI, et elle est DÉJÀ LUE** |
| `SIX = [1,4,9,3,5,7]` | `doctrine.py:430` | idem — même ensemble, autre ordre |
| `MODES` · `COMPETENCES` | `doctrine.py:73-75` | le `02-` les déclare ; le fichier lit déjà la table des modes admis |

⭐ **Le point décisif : `doctrine.py` lit déjà la colonne.** `_crans()` *(`doctrine.py:385-396`)*
parcourt la table du `02-` §2.2 et remplit `Cran(…, couverture=_nu(c[11]), …)` — la douzième
colonne, `couverture_observables`, qui vaut `isole` sur 1·3·4·5·7·9 et `exerce` sur 2·6·8. La
classe `Cran` porte même la propriété : `return self.couverture == "isole"`.

**La donnée est déjà en mémoire.** Les deux tuples de `derive-doctrine.py:59-60` **redisent une
valeur que la doctrine chargée porte déjà**, et le crible « cite ou refuse » ne s'y applique pas.

**Déjà arbitré ?** Le `PLAN_DE_CHANTIER.md` §6 porte le voisin — `RACINE_DEFAUT`, le chemin absolu
embarqué dans les deux chaînes, *« `npm test` ne peut passer que sur la machine du professeur »*.
Les trois valeurs en dur n'y sont pas.

⭐ **Ce que ça coûte, et à qui. Rien aujourd'hui** — les trois coïncident exactement avec les
sources, ce que cette séance a revérifié. Le coût est celui d'une **décision de contenu prise dans
le code** :

> Le `02-` §2.2 est édité : un cran change de `couverture_observables` — c'est une décision de
> doctrine, écrite dans le document qui fait foi. `doctrine.py` la lit et la porte dans `Cran`.
> **`derive-doctrine.py`, lui, garde son tuple.** Les deux moitiés de la même chaîne travaillent
> alors sur deux découpages différents des neuf crans, **et rien ne le dit** : le crible « cite ou
> refuse » ne peut pas mordre sur une valeur qui n'est pas citée.

**Les issues.**
1. **Dériver les deux tuples de `d.crans`** — *coût : deux lignes, la donnée est déjà chargée.
   C'est l'issue à bas coût, et elle vise la seule des trois que la revue qualifie de « décision
   de contenu ».*
2. **Faire vérifier `MODES` et `COMPETENCES`** contre les tables lues, plutôt que de les dériver
   *(elles servent d'ossature au parseur, qui a besoin d'elles avant de lire)* — *coût : un
   contrôle d'égalité en fin de chargement.*
3. **Rien pour `SIX`**, qui est le même ensemble dans l'ordre de service — *ou le dériver aussi,
   pour une ligne.*

*Recommandation, sans trancher : l'issue 1, et l'issue 2 dans le même geste — ensemble elles
suppriment le seul écart possible entre les deux moitiés de la chaîne, pour un coût de quelques
lignes.*

---

# C · Le port

## C14 · `4.0` — JSON n'a qu'un type de nombre, Python en a deux *(§4.2)*

**Reproduit ? OUI, exécuté sur le vrai script — et il y a PIRE, que la revue n'a pas trouvé.**

`generateur/verifie-import.py --banque … --racine …`, une banque minimale par valeur de `cran` :

```
cran = 4      → ✗ [R11] le cran 4 exige un materiau_cible …        (lu comme 4 · correct)
cran = 4.0    → ✗ [R05] cran hors de 1–9 : 4.0                     ← REFUS, quand le port accepte
cran = "4"    → ✗ [R05] cran hors de 1–9 : '4'                     ← refus des deux côtés · correct
cran = true   → ✗ [R11] le cran 1 exige un materiau_cible …        ← ⚠️ LU COMME LE CRAN 1
```

⚠️ **`{"cran": true}` est silencieusement lu comme le cran 1 par le script Python** — parce qu'en
Python `isinstance(True, int)` vaut `True` et `True == 1`. **Le port, lui, le refuse**
*(`typeof true === 'boolean'`, `Number.isInteger(true) === false`)*. **Les deux contrôles se
contredisent donc dans les DEUX sens**, et le second est le plus grave : sur `4.0` le script
refuse une banque légitime *(fausse sévérité)* ; sur `true` **il en accepte une malformée et la
lit de travers** *(fausse acceptation)*. Le même défaut vaut aux deux autres sites
*(`verifie-import.py:135` `plan_de_lecture.semaine`, `:364` `materiau_source.localisation`)*, qui
emploient le même `isinstance(…, int)`.

**Déjà arbitré ?** ✅ **OUI, et le prompt le dit : l'arbitrage est pris — *« dans le sens du
port » : `4.0` est l'entier 4*.** Vérifié : `verifie-import.py:317` teste encore
`isinstance(cran, int)` strict. **Le geste n'a jamais été porté.** Le §9 de la revue le range à
« côté générateur Python ».

⭐ **Ce que ça coûte, et à qui.**

> Un générateur — JS, R, pandas — sérialise ses entiers en flottants : `"cran": 4.0`. Le
> professeur passe sa banque au script avant de la déposer, comme le `08-` le prescrit. **Le
> script la refuse** avec « cran hors de 1–9 : 4.0 ». Il corrige à la main, ou renonce. **Puis il
> la dépose : la plateforme l'avale sans un mot.** Les deux contrôles qui devaient dire la même
> chose lui ont donné deux verdicts opposés — **et c'est le contrôle censé le protéger qui a eu
> tort.**
>
> Et symétriquement : une banque avec `"cran": true` — sortie d'un gabarit fautif — **passe le
> script comme un cran 1**, puis se fait refuser par la plateforme. Là encore deux verdicts
> opposés, et cette fois c'est le script qui s'est laissé tromper.

**Les issues.** *(le geste, pas la décision — elle est prise)*
1. **Un prédicat d'entier au sens JSON**, appliqué aux trois sites :
   `est_entier(x) = isinstance(x, int) and not isinstance(x, bool)`, **ou**
   `isinstance(x, float) and x.is_integer()` → convertir en `int` — *coût : une fonction et trois
   appels ; ferme `4.0` **et** `true` du même geste.*
2. **Ne porter que `4.0`** *(accepter le flottant entier)* et laisser `true` — *coût : moindre ;
   ⚠️ laisse ouverte la fausse acceptation, qui est le pire des deux.*
3. **Ajouter le vecteur `true` aux autotests** des deux côtés — *coût : deux vecteurs ; à faire
   quelle que soit l'issue retenue, sans quoi rien ne verrouille le correctif.*

*Recommandation, sans trancher : l'issue 1 avec l'issue 3 — l'arbitrage étant pris, le seul choix
qui reste est de le porter d'une manière qui ferme aussi le trou des booléens, qu'il serait
étrange de laisser ouvert en y touchant.*

---

# LE CLASSEMENT EN TROIS TAS

## Tas 1 — **avant la première passation réelle**

| # | item | pourquoi ce tas |
|---|---|---|
| **A1** | la garde d'appelant des `security definer` | le vecteur du **rejeu après rollback** est le protocole même du dépôt, et il défait `securite_rpc_definer.sql` **en silence** ; deux des six fonctions suppriment sept tables en cascade |
| **A3** | `garde_cas_de_la_paire` | c'est **la seule** de la liste dont un défaut est **déjà en base** *(l'exercice `473b2c25`, §3.3)* ; le jour où l'écran élève existe, elle sert un diagnostic faux |
| **A4** *(bornes de date)* | l'antidatage et la postdatation | une recette antidatée **fausse la lettre servie à l'élève**, par le geste que la fonction propose elle-même |
| **C14** | le portage de l'arbitrage `4.0` | l'arbitrage est **pris** ; il ne reste qu'un geste, et tant qu'il n'est pas fait les deux contrôles se contredisent **dans les deux sens** |

## Tas 2 — **ce qui peut attendre**

| # | item | condition qui le rend urgent |
|---|---|---|
| **A2** *(les deux colonnes de correspondance)* | quatre lignes dans `fiche-competence.ts` | dès qu'une fiche est versée et bancée |
| **A4** *(le NULL par `update`)* | un `check` | jamais atteint par un chemin applicatif |
| **A5-c** | intervalles · énuméré de l'observable · minimum de distracteurs · couple des démonstrations · unicité de `doctrine_derivation` · complétude du plancher 2 | les deux premiers touchent ce que l'élève reçoit : à faire **avec** l'écran élève, pas avant |
| **A6** *(messages nommés sur `mode` et `empreinte`)* | l'import les attrape déjà en amont | dès qu'une reprise SQL contourne l'import |
| **B8 + B9** | **une seule ligne** : compléter `Doctrine.resume()` | ⚠️ **le geste est déjà en séance dédiée** au `PLAN_DE_CHANTIER.md` §6 — à ne pas dédoubler |
| **B10** *(l'issue 2)* | faire refuser la ligne `ROUTAGE` malformée | dès qu'un lot ajoute un observable |
| **B11** *(l'issue 2)* | servir la variante d'objet au professeur | dès qu'un professeur conçoit sur `reference` ou `transition` |
| **B12** | inscrire le piège au §6 | avant le lot qui dérivera `nature` |
| **B13** | dériver les deux tuples de crans | avant toute édition du `02-` §2.2 |

## Tas 3 — **ce qui n'est pas un problème, et sort de la liste**

**A7** · **B11 (le critère d'arrêt du §14.2)** · **A5-a** *(l'entrée bloquée, le dépôt clos)* ·
**A5-b** *(la collision `id_import`)* · **A6 (la fuite du `DETAIL`)** · **B8 (« `--verifie` dira
toujours IDENTIQUE »)** · **B9 (quatre mutations sur six)**. *Argumenté ci-dessous.*

---

# ⭐ CE QUI N'EST PAS UN PROBLÈME

*La séance existe pour cette section. Sept constats sortent de la liste — quatre parce que le
système les garde ailleurs, trois parce qu'ils décrivent mal ce qu'ils ont vu.*

### 1 · A7 — les deux « objets fantômes » sont deux diagnostics complets

Ce ne sont pas des lignes orphelines mais les deux `nature = 'complet'`, seedées délibérément
*(`c4_l1_seed.sql:84-90`)*, dont la contrainte `types_complet_sans_objet_ni_cran_chk` **exige** les
champs vides. **La condition posée est tenue** : `doctrine.ts:216-221` fait
`if (t.nature === 'complet') continue`, avec un commentaire qui les nomme, **avant** l'écran de
conception et **avant** le contrôle d'import. **Aucun scénario de coût ne s'écrit.**

### 2 · B11 — le critère d'arrêt du §14.2 n'est pas franchi

Le seuil de trois porte sur des variantes **du guide, par mode, sous la table du §14.2**. Le mot
« variante » apparaît **une seule fois dans tout le `04-`** : dans le critère lui-même. **Il y en
a zéro.** Les cinq relevées sont des variantes **de la consigne, par objet**, dans les
`instances/`, régies par une autre règle. **Rien ne commande de passer aux 46 blocs.**

### 3 · A5 — « une entrée bloquée se valide »

Vrai de la contrainte, faux du système. `corpus/actions.ts:118-127` exclut les bloquées, refuse
**tout** si la lecture échoue, et le commentaire `:114-117` déclare **savoir** qu'aucune contrainte
de base ne le fait — c'est un choix, pas un oubli. L'écran filtre en second rideau.
*Et `exercices_materiaux`, que la revue englobe, n'a pas de colonne `bloque`.*

### 4 · A5 — « un dépôt `clos` passe à `retire` »

**Aucun chemin applicatif n'écrit `retire` sur `exercices_depots`.** Le seul `.update()` visant la
table n'écrit que `{ echeance }`. Le constat décrit une transition qu'il faut du SQL direct pour
provoquer.

### 5 · A5 — la collision des `id_import`

L'unicité globale **est** le mécanisme d'idempotence, écrit et documenté
*(`verifie-import.ts:302-306` ; `08-` §1 ; piège 11)*. ⚠️ **Ce qui reste, et qui est réel, est
autre chose** : `ignores` figure au verdict *(`verifie-import.ts:789`)* et **n'est rendu par aucun
écran** — le professeur ne voit jamais ce qui a été écarté. *À traiter comme un item d'affichage,
pas comme un défaut d'unicité.*

### 6 · A6 — la fuite de l'`eleve_id`

Le `DETAIL` de Postgres contient bien l'`eleve_id`. **Il n'atteint aucun écran** : `error.details`
n'est lu que par deux `console.error` serveur ; seul `error.message` remonte. **Et l'écran est un
écran professeur**, qui lit déjà la table. *Ce n'est une fuite dans aucun sens utile du mot.*

### 7 · B8 et B9 — trois quarts des cribles sont gardés

- **« `--verifie` dira toujours IDENTIQUE » est faux** : son bloc (a) compare les **empreintes SHA
  des sources** et dit `SOURCES : DIVERGE` dès qu'une source bouge.
- **Quatre mutations sur six sont refusées ou vues** : les trois sur les genres tombent sur le
  **contrôle à trois hauteurs du §14.2**, posé le 21/08 — *y compris « le plus retors »* ; la
  quatrième *(`<!--ROUTAGE` mal espacé)* est vue par `derive-04.py --verifie`.
- **Les trois qui restent ne sont pas quatre cribles à écrire** : elles touchent la même table,
  pour la même raison, et **une ligne de résumé les rend toutes les trois bruyantes** — la ligne
  que le `PLAN_DE_CHANTIER.md` §6 a déjà envoyée en séance dédiée.

---

# CE QUE LA REVUE A MANQUÉ

*Six trouvailles, dans le voisinage immédiat des items instruits. Cinq sont exécutées.*

### 1 · ⚠️ `{"cran": true}` est lu comme le cran 1 par le script Python — **exécuté**

Le même `isinstance(…, int)` que le §4.2 dénonce sur `4.0` **accepte les booléens**, parce qu'en
Python `bool` hérite de `int`. Le port, lui, les refuse. La divergence court donc **dans les deux
sens**, et le sens que la revue a manqué est **le pire** : sur `4.0` le script refuse une banque
bonne ; sur `true` **il en accepte une mauvaise et la lit de travers**. Les trois sites
*(`:135`, `:317`, `:364`)* portent le même trou.

### 2 · ⚠️ `poser_statut_recette` accepte une date **postdatée** — **exécuté**

Le §5.3 nomme l'antidatage. `poser_statut_recette('expression','evaluee','2099-01-01')` est
**accepté** aussi. Une recette postdatée fait l'inverse : le recalcul depuis les mesures
*postérieures* n'en trouve **aucune**, et la lettre se calcule sur rien.

### 3 · ⚠️ Le vecteur exact de A1 est le **rejeu après rollback** — **exécuté**

`create or replace` **conserve** l'ACL ; seul `drop` + `create` la fait renaître grantée. Et
`drop function` n'existe **que** dans les trois `*_rollback.sql` du dépôt. Rejouer
`c4_l8_fabrique.sql` après son rollback **rend `poser_statut_recette` exécutable par `anon`** et
défait `securite_rpc_definer.sql` sans un mot. *La revue disait « une migration future » ; le
vecteur est plus étroit, plus précis, et il est inscrit au protocole du dépôt.*

### 4 · ⚠️ Note de méthode — `garde_cas_de_la_paire` est **`INITIALLY DEFERRED`** — **exécuté**

Elle ne se déclenche **qu'au `commit`**. Une sonde `begin; … rollback;` — le protocole des 181
sondages — **ne la fait jamais tomber**, sauf `set constraints all immediate`. Toute campagne
future qui sonde un trigger de contrainte sans cette ligne mesure le vide. *Les sondes A3 de ce
relevé la posent, avec témoin positif et témoin négatif.*

### 5 · Les **cinq** tables portent le défaut d'`id_import`, pas une — **exécuté**

`exercices`, `exercices_textes`, `exercices_sujets`, `exercices_materiaux`,
`exercices_demonstrations` : cinq index uniques **globaux**. *Sans conséquence, puisque c'est le
régime d'idempotence voulu — mais le constat doit être dit en entier ou pas du tout.*

### 6 · Une **contre-épreuve** qui ne trouve rien, et c'est un résultat

Dans l'esprit du septième cas sorti le 21/08, j'ai balayé toutes les cellules
« En réception » / « En composition » des six `instances/` à la recherche d'autres gloses dont
`premier_code` tirerait un faux code *(le défaut du §6.1)*. **Deux cellules ressortent —
`forme_question` *(`04-questionnement.md:66`)* et `reponses_concurrentes` *(`:241`)* — et les deux
sont de vrais codes**, correctement portés en base *(`question_presente | forme_question`,
`debat_situe | reponses_concurrentes`)*. **Aucun septième cas dans cette forme.**

---

# LES QUESTIONS QUE JE N'AI PAS TRANCHÉES

*Elles appartiennent à Louis, et rien dans le prompt ne les tranche.*

1. **A6, issue 2 — normaliser ou refuser ?** Replier l'empreinte en minuscules et l'accent de
   `évaluer` fermerait les deux cas trompeurs d'une ligne. **Mais la sévérité de ces deux refus
   est peut-être voulue** *(une empreinte est une valeur canonique ; un mode est un identifiant de
   doctrine)*. Normaliser à l'entrée est un choix de doctrine, pas un correctif.

2. **B10, issue 1 — ouvrir un document GELÉ ?** Écrire la syntaxe de la ligne `<!-- ROUTAGE -->`
   au `04-` §0 demande l'accord explicite de Louis, le `04-` étant **VALIDÉ ET GELÉ**. La question
   est de savoir si cela justifie d'ouvrir le document maintenant, ou d'attendre qu'il s'ouvre
   pour autre chose.

3. **B12 — quel côté s'aligne ?** `élément` avec accent est le français correct et c'est ce
   qu'écrit le `02-`. `element` sans accent est ce que la base porte et ce que la contrainte
   admet. **Aligner la base** touche une migration ; **aligner la source** touche un document
   signé pour y retirer un accent juste. Je ne prends pas ce choix.

4. **A5-c — poser ces gardes exige de savoir qu'aucune donnée existante ne les viole.** Cette
   séance n'a pas pu l'établir : la base vivante est injoignable. **La vérification préalable est
   à jouer avant toute migration de ce paquet**, et c'est une condition, pas une formalité.

5. **B8/B9 versus le `PLAN_DE_CHANTIER.md` §6.** Le remède de B8 et B9 *(compléter le résumé de
   chargement)* **est** le geste déjà inscrit au §6 sous « le résumé qui ment », envoyé en séance
   dédiée. **Faut-il fusionner les trois, ou la séance dédiée les absorbe-t-elle ?** Je le signale
   plutôt que d'en décider.

---

# NOTE DE MÉTHODE

**Ce qui a été exécuté**, et non lu : le schéma rejoué depuis les migrations *(49 tables,
6 fonctions `security definer`)* ; **une trentaine de sondes** sur les items A, chacune dans son
`begin; … rollback;`, avec `set constraints all immediate` là où un trigger différé l'exigeait, et
**témoin positif et témoin négatif** sur A3 et A4 ; la **dérivation rejouée** et **huit mutations
de sources** pour les items B ; le **script d'import Python** joué sur quatre littéraux de `cran`.

**Ce qui n'a pas pu l'être** : toute vérification portant sur les **données vivantes** — la base
sandbox est injoignable depuis cette session *(voir l'encadré en tête)*. Sont donc **non
vérifiés** : l'état effectif des `grant` après le 21/08, le nombre réel de lignes de
`competences_correspondance`, et l'état des deux exercices assignés malformés et de leurs
12 dépôts. Chaque item concerné le dit à sa place.

**Quatre tables d'amont sont des substituts** : `profiles`, `scriptorium_contenus`,
`scriptorium_exercices_planifies` et `aletheia_livre_reference` ont été réduites à leur clé
primaire, faute des fichiers d'origine au dépôt. **Aucune garde instruite ici ne les traverse** —
elles ne servent qu'à satisfaire des clés étrangères.

**Aucune écriture n'a eu lieu hors de ce fichier** — ni source, ni migration, ni
`PLAN_DE_CHANTIER.md`, ni `CONTEXTE.md`.
