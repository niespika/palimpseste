# RELEVÉ — La vue ouverte à `anon`, et le résumé qui ne pouvait pas voir une perte

**Séance du 21/08/2026** *(Cowork)*, sur `PROMPT_Session_Correctifs_RLS_et_Resume.md`.
Deux dépôts : `palimpseste` *(le travail principal)* et `palimpseste-conception`
*(`Doctrine.resume` seule)*.

---

## En un mot

**LES DEUX CHANTIERS SONT JOUÉS EN SANDBOX ET PROUVÉS. Toutes les prédictions écrites d'avance
sont exactes.**

⭐ **Le SQL a fini par être joué**, par les deux seuls chemins de cette séance qui aient le réseau :
**l'éditeur SQL Supabase piloté dans Chrome** pour le chantier 1, et **`psql` depuis le terminal de
Louis** pour le chantier 2 *(0,81 Mo de `delete`+`insert` sur douze tables ne se collent pas dans
un éditeur web)*. *Le diagnostic ci-dessous reste écrit : il resservira.*

Le chantier 1 *(la vue et le `search_path`)* est **FAIT** : constat, balayage, épreuve par
l'échec à trois temps, répétition à blanc, correctif, vérification et contre-épreuve — **toutes
les prédictions écrites d'avance sont exactes**. Ses deux points ouverts avaient été tranchés par
Louis : `pg_temp` en dernier, et **oui au second tour de clef** *(le `revoke` pour `anon`)*.

Le chantier 2 *(le résumé)* est **fini, prouvé et en base** : la réparation, sa preuve par
l'échec, la preuve que l'ancien résumé était aveugle au même défaut, le bump d'`OUTIL`, la
**cinquième dérivation jouée à 19:58:43 UTC en `1.2`**, la fixture régénérée à l'empreinte
attendue, `SOURCES : IDENTIQUE`, onze tables `IDENTIQUE`, `FIXTURE : IDENTIQUE`, **`npm test`
414/414**.

---

## ⚠️⚠️ Le blocage, dit d'emblée : aucun accès réseau à la base

**Ce n'est pas Supabase qui bugue, et rien n'a été « perdu » : cet environnement ne l'a jamais
eu.** Toute la sortie réseau du conteneur passe par un mandataire HTTP
*(`https_proxy=http://127.0.0.1:32823`)* qui applique **une liste blanche de domaines**. Deux
barrières indépendantes, mesurées :

| cible | résultat |
|---|---|
| `api.github.com` · `registry.npmjs.org:443` | **HTTP 200** · ouvert |
| `api.supabase.com` | **`CONNECT tunnel failed, 403 Forbidden`** |
| `aoakpxxlyvthzueaywna.supabase.co` | **403 Forbidden** |
| `…pooler.supabase.com:5432` et `:6543` | bloqué |
| `github.com:22` *(SSH)* | bloqué — *ce n'est donc pas propre à Supabase* |
| machine de Louis *(shell des dossiers montés)* | **ni `psql`, ni résolution DNS** |

Donc : **les domaines `supabase.com`/`supabase.co` ne sont pas sur la liste blanche** *(403 du
mandataire, même en 443)*, et **aucun port autre que 443 ne sort**. L'API de gestion Supabase — qui
sait pourtant exécuter du SQL arbitraire en HTTPS — tombe sur la première barrière.

⭐ **Et ça n'a jamais « marché avant »** : les séances précédentes ne jouaient pas le SQL non plus —
**c'est Louis qui collait les commandes dans son terminal**. La fiche mémoire du 21/08 le dit en
creux : *« la variable vide fait atterrir psql sur le **Postgres local de Louis** »*.

**Deux remèdes, en plus du navigateur** : ouvrir `supabase.com`/`supabase.co` dans la liste blanche
réseau de l'organisation Claude *(le plus propre — il débloquerait `psql` **et** l'API de gestion)* ;
ou, une fois cela fait, un **jeton d'accès personnel Supabase** pour piloter
`POST /v1/projects/{ref}/database/query`.

⭐ **Ce qui, lui, a marché sur la machine de Louis** : `python3` et `npm test`. Les deux ont servi,
et servent de contre-épreuve indépendante à ce qui a été fait dans le conteneur.

---

## CHANTIER 1 — La vue `assiduite_hebdo_classe`

### ⭐ CE QUI A ÉTÉ JOUÉ EN BASE, ET CE QUE ÇA A DONNÉ

**Constat d'avant** *(serveur **17.6**, `security_invoker` disponible)* :

| constat | attendu, écrit avant | obtenu |
|---|---|---|
| **combien d'autres vues dans le même cas ?** | une seule vue, celle-là | ⭐ **UNE SEULE LIGNE** — `assiduite_hebdo_classe`, **aucune vue matérialisée** |
| `security_invoker` | non posé | **non posé** |
| `anon` / `authenticated` sur la vue | true / true | **les SIX privilèges à `t` pour les deux** |
| policies appelant `est_prof` | 19 | **19** |
| `assiduite_hebdo` · la vue | 0 · 0 | **0 · 0** — *la preuve du « 0 ligne » est donc bien vide* |
| décor et témoin disponibles | ≥ 1 chacun | **19 inscriptions actives · 4 `holidays`** |
| `est_prof` et `handle_new_user` | sans `search_path` | **sans** |

⭐⭐ **UNE TROUVAILLE QUE JE N'AVAIS PAS PRÉDITE.** Sur les **sept** fonctions `security definer`
de `public`, **les cinq autres portaient déjà un `search_path` — et il vaut `public` SEUL**,
c'est-à-dire la forme que Louis venait d'écarter. **Elles n'ont pas été touchées** *(hors du
périmètre nommé par le prompt)*, et le risque est nul en pratique : elles sont fermées à `anon` et
à `authenticated`, donc seul `service_role` les appelle, et l'attaque par `pg_temp` supposerait
déjà d'être `service_role`. **Mais la base porte désormais deux formes** — ligne à ajouter au lot
de correctifs.

⭐⭐ **L'ÉPREUVE PAR L'ÉCHEC — les quatre prédictions exactes**, dans une transaction annulée qui
valait aussi répétition à blanc :

| temps | vue sous `anon` | témoin `holidays` |
|---|---|---|
| décor posé — vue sous le propriétaire | **1** | 4 |
| **1 — rien n'est corrigé** | **1** ← ⭐ **LE CONTOURNEMENT, VU À L'ŒIL** | 4 |
| 2 — après `security_invoker = true` | **0** ← la RLS joue | 4 |
| 3 — après le `revoke` | **`REFUSE — permission denied (42501)`** | 4 |

*Sous la clé anonyme, la vue rendait **une ligne d'assiduité d'un élève réel**. Elle est vide
aujourd'hui — mais la porte, elle, était ouverte.*

**Rollback vérifié PAR REQUÊTE** *(règle 6, jamais sur la foi du mot affiché)* : `assiduite_hebdo`
**0 ligne**, option de la vue **« non posée »**, `anon_lit` **true**, **0** table temporaire
restante.

✅ **Le correctif, puis sa vérification** : la vue à **`security_invoker = true`**, **`anon` =
false**, **`authenticated` = true** *(gardé : C4-L2 construit le taux d'inactivité par classe)* ;
`est_prof` à **`search_path=public, pg_temp`** et **toujours `t | t`** — rien n'a été révoqué sur
les fonctions ; `handle_new_user` à **`public, pg_temp`** et **toujours `f | f`** ; **les cinq
autres intactes**. ✅ **Contre-épreuve** : sous `anon`, la vue rend **`REFUSE — permission denied
(42501)`**, témoin **4**.

### Ce qui avait été constaté sans la base — et que la base a confirmé

| constat | comment | verdict |
|---|---|---|
| **un seul `create view` dans tout le dépôt** | balayage `*.sql` hors `node_modules`/`_to_delete` | `c4_l1_schema.sql:914` |
| **zéro vue au dump du 23/07** | `grep '^CREATE VIEW'` sur `backups/dump_2026-07-23_1435.sql.gz` | 0 |
| **aucun code ne lit la vue** | balayage `.ts` / `.tsx` / `.mjs` | **zéro occurrence** |
| **`assiduite_hebdo` porte la RLS et une seule policy `prof_all`** | `c4_l1_schema.sql`, bloc `do $rls$` | vue |
| **`inscriptions` : `eleve_read` sur `eleve_id = auth.uid()`** | dump du 23/07 | vue |
| **un témoin lisible par `anon` existe** | `holidays_eleve_read … using (true)`, 2 lignes au 23/07 | trouvé |

⭐ **Et la requête a dit la même chose que le dépôt — pour une fois.** Ce n'était pas acquis : la
leçon du 21/08 est justement que *le troisième cas vivait dans un autre fichier*. Le balayage
incluait les vues **matérialisées**, qui ne connaissent pas `security_invoker` et auraient été un
cas à part : **il n'y en a aucune**.

### Ce que le fichier fait — et rien d'autre

`securite_vue_et_search_path.sql` fait **trois gestes**, et **ne touche NI table, NI donnée, NI
policy**. Le seul privilège qu'il déplace, il le **retire** :

```sql
alter view     public.assiduite_hebdo_classe set (security_invoker = true);
revoke all on  public.assiduite_hebdo_classe from anon;          -- ⭐ le second tour de clef
alter function public.est_prof()        set search_path = public, pg_temp;
alter function public.handle_new_user() set search_path = public, pg_temp;
```

⭐ **Le `revoke` est l'arbitrage de Louis du 21/08.** `security_invoker` suffisait à fermer la fuite
— la RLS joue, `anon` voit 0 ligne ; le `revoke` ferme l'accès — `anon` ne lit plus la vue du tout.
⚠️ **`authenticated` GARDE son droit, volontairement** : C4-L2 doit construire le taux d'inactivité
par classe, et la RLS suffit à ce que seul un professeur y voie quelque chose. Le lui retirer
poserait un piège à une session future.

⚠️⚠️ **`alter function`, jamais `create or replace`.** Supabase pose au montage un
`alter default privileges … grant all on functions to anon, authenticated` : **recréer** une
fonction de `public` la ferait **renaître grantée** — exactement le trou refermé le 21/08.
`alter … set` ne touche aucun privilège, donc le `revoke` tient.

⚠️ **`est_prof` reste grantée à `anon` et `authenticated`, volontairement** — 19 policies
l'appellent. Et une remarque qui a failli manquer : `est_prof` est en `language sql`, où un `SET`
empêche normalement l'*inlining*, ce qui se paierait sur 19 policies. **Sans effet ici** :
PostgreSQL n'inline jamais une fonction `security definer`.

### ⭐ Le sort de `handle_new_user()` — tranché, et dit

**Elle reçoit son `search_path`. Elle n'est PAS retirée.** Trois raisons, dans cet ordre :

1. **Retirer n'apporte rien aujourd'hui** — déjà révoquée de `public, anon, authenticated`,
   injoignable par PostgREST, rattachée à aucun trigger : la surface est déjà nulle.
2. **Retirer est un geste destructif sur un objet du flux `auth`** — la règle 5 du `SUIVI_SQL.md`
   le met sous protocole renforcé. Un `drop function` ne se glisse pas dans un fichier qui, sinon,
   ne touche à rien.
3. **Un retrait de code mort est un nettoyage, pas un correctif de sécurité** : il doit emporter
   ses mentions au dépôt et sa ligne de journal. C'est un lot, pas une ligne.

*Rien n'est fait à moitié : les deux fonctions que la séance nomme sortent d'ici avec leur
`search_path`.*

### ⭐⭐ L'épreuve par l'échec — et pourquoi « 0 ligne » n'aurait rien prouvé

Le « fait quand » demande *« la vue rend 0 ligne sous `anon` »*. **Pris au pied de la lettre, ce
contrôle est vide** : `assiduite_hebdo` compte **0 ligne**, donc la vue rend 0 ligne **sous
n'importe quel rôle**, **avant comme après** le correctif. *Une preuve qui serait vraie sans le
correctif n'est pas une preuve.*

Le fichier contient donc un bloc qui **donne à la vue quelque chose à rendre** — une ligne
d'assiduité fabriquée pour un élève réellement inscrit *(aucun UUID en dur)* — puis pose les deux
gestes **l'un après l'autre**, en relisant la vue sous `set local role anon` **à chaque temps**,
**sur la même ligne et dans la même session**, et **annule tout**.

```
temps 1 — état actuel                      →  vue sous anon = 1      ← LE CONTOURNEMENT, vu à l'œil
temps 2 — après security_invoker = true    →  vue sous anon = 0      ← LA RLS JOUE
temps 3 — après le revoke                  →  REFUSÉ, 42501          ← LE SECOND TOUR DE CLEF
aux trois temps                            →  témoin positif > 0     ← le rôle a bien pris
```

⭐ **Ce bloc EST AUSSI la répétition à blanc** : le DDL est transactionnel en PostgreSQL, `alter
view` et `revoke` s'annulent avec le reste. *Le refus du temps 3 est capté par un gestionnaire
d'exception, sans quoi il avorterait la transaction et les mesures suivantes seraient perdues.*

Le **témoin positif** est `holidays`, qui porte une policy `for select using (true)` : une lecture
qui *marche* sous `anon` prouve que le zéro du temps 2 est un vrai zéro, et non une session restée
sur le rôle d'avant. ⚠️ **Si le témoin vaut 0, la ligne ne prouve rien** — changer de témoin. ⚠️ **Si
le temps 1 rend déjà 0 avec un témoin non nul, le constat de la revue est à réexaminer avant de
corriger quoi que ce soit.**

---

## CHANTIER 2 — Le résumé de la dérivation

### Le mot, puis l'absence

Le mot : « **544 routes** » quand `exercices_routes` porte **3264 lignes**. Les deux chiffres sont
justes — 544 est le nombre de **déclarations de routage**, 3264 le nombre de **lignes après
croisement par cran** —, mais un seul des deux mots l'était. La ligne dit maintenant
**« 544 déclarations de routage → 3264 lignes de route »**.

⭐ **L'absence, qui était le vrai défaut** : ni les 336 consignes isolées, ni les 24 guides, ni
leurs 11 déclinaisons par genre n'étaient nommés. **Une perte de six consignes laissait « 56
observables instanciés » intact.**

### Ce qui a été écrit — deux règles, pas une liste de nombres

1. **On ne nomme un compte que si une table le reçoit — et réciproquement.** La ligne porte
   désormais **les douze comptes** que la dérivation verse. ⭐ Dont `exercices_types_crans` (117),
   **la seule table qu'aucun bloc de `--verifie` ne relit** *(angle mort du `PLAN_DE_CHANTIER.md`
   §6)* : le résumé en est maintenant l'unique témoin.
2. **Un compte ne se garde pas tout seul : il se croise contre une autre source.** C'est
   l'arbitrage du `04-` §14.2 réappliqué — *un chiffre en dur se périme, une bijection se vérifie
   toute seule*. Les six crans qui isolent ne sont **pas écrits** dans la méthode : ils se
   **lisent au `02-` §2.2**, par la couverture de chaque cran.

Et la leçon du §14.2 est reprise entière — *un compte sur les entités ne garde pas les lignes* :
le croisement est fait **par observable**, pas seulement en total.

### La preuve, et sa contre-épreuve

Racine jetable faite de **copies réelles** *(jamais un répertoire de liens — la leçon du 21/08 : un
fichier dans un sous-répertoire lié se réécrit dans le dépôt RÉEL)*, empreintes du dépôt revérifiées
après coup : **intactes**.

| # | mutation | ce que le NOUVEAU résumé dit | ce que l'ANCIEN disait |
|---|---|---|---|
| a | **six consignes retirées** | `330 consignes isolées (56 × 6)` + `⚠ 1 CROISEMENT ROMPU : … synthese §1 (0/6 — manque 1, 3, 4, 5, 7, 9)` | **ligne identique à celle de la racine saine** |
| b | une seule retirée | `335 …` + `(5/6 — manque 9)` | — |
| c | ⭐ **une consigne DÉPLACÉE** d'un cran à l'autre | **`336`** *(le total ne bouge pas !)* + `(6/6 — manque 9, en trop 2)` | — |
| — | *témoin : racine saine* | `336 …` + `les croisements tiennent` | — |

⭐ **C'est le couple (a) / colonne de droite qui prouve que la réparation sert** — pas (a) seul. Et
le cas (c) montre pourquoi un compte global n'aurait pas suffi.

### ⚠️ Le piège du prompt, et comment il a été désamorcé

*« Aucun contrôle ne verra ta correction. »* Exact : ni `doctrine.py` ni la version de l'outil
n'entrent dans les quinze empreintes, donc **`--verifie` dira `IDENTIQUE` sur tout**. D'où le bump
**`OUTIL` `1.1` → `1.2`** *(numéro relu sur le fichier vivant juste avant écriture — compteur
partagé)*.

⭐ **Et l'angle mort du chemin absolu a été neutralisé** : la racine de reconstruction a été montée
**au chemin réel** dans le conteneur, et la fixture qui en sort est **octet pour octet** celle du
dépôt *(`0a974e48…52f0a`)*. Tout ce qui a été diffé l'a donc été contre le vrai état d'avant.

| contrôle | attendu écrit AVANT | obtenu |
|---|---|---|
| `--sql` avant / après | même nombre de lignes | **3999 / 3999** |
| lignes différentes | l'`OUTIL` et le résumé de l'en-tête, le `insert into doctrine_derivation` | **exactement ces trois-là** |
| lignes de **données** changées | zéro | **zéro** |
| fixture, les douze tables | `IDENTIQUE` | **`IDENTIQUE`** |
| fixture, `_derivation` | seuls `outil` et `resume` changent | **`empreintes` et `racine` identiques** |
| `npm test` *(machine de Louis)* | inchangé | **414 tests · 414 passés · 0 échoué** — ⚠️ *et le compte des IGNORÉS dépend de la machine : 413 + 1 ignoré sur le Linux du bac à sable Cowork. C'est le Mac qui fait foi.* |
| `--resume` sur les VRAIS fichiers | la même ligne | **caractère pour caractère** |
| ⭐ `--fixture` **rejoué sur la machine de Louis**, contre la fixture déposée | les 15 empreintes de source et les 12 tables identiques ; **seule `racine` diffère** *(chemin monté vs chemin réel)* | **exactement cela** — donc les sources sont intactes, la reconstruction était fidèle, et **la fixture déposée porte bien le chemin RÉEL** |

---

## ⚠️ Ce qui attend un arbitrage de Louis

### ✅ Rendus le 21/08

1. **`search_path = public, pg_temp`** — *« prends l'alternative la plus sécurisée »*. `pg_temp` est
   nommé **en dernier** parce que, non nommé, il est cherché **implicitement en premier** :
   `public` seul *(la lettre du relevé)* laisserait le schéma temporaire devant `public`, c'est-à-dire
   précisément le trou qu'on croit boucher. C'est la parade que documente `CREATE FUNCTION`.
2. **Oui au second tour de clef** — `revoke all on assiduite_hebdo_classe from anon`. ⚠️
   `authenticated` **garde** son droit, et la preuve change de forme : l'état final rend
   **« permission denied »** au lieu des 0 ligne du « fait quand ». **L'épreuve à trois temps prouve
   les deux**, et le `.sql` comme son rollback sont réécrits en conséquence.
3. **Le mode d'exécution : Chrome**, sur la machine de Louis — le seul chemin qui ait le réseau.

### Ce qui reste ouvert

4. **Le retrait de `handle_new_user()`**, si Louis le veut un jour : c'est un lot de nettoyage, avec
   ses mentions au dépôt et sa ligne de journal — pas une ligne à glisser ici.
5. **La liste blanche réseau.** Tant que `supabase.com`/`supabase.co` n'y sont pas, aucune séance
   Cowork ne pourra vérifier la base autrement qu'à travers un navigateur.

---

## Ce qui est écrit, et où

| dépôt | fichier | ce qu'il porte |
|---|---|---|
| `palimpseste` | `securite_vue_et_search_path.sql` | le correctif, son constat d'avant, sa vérification d'après, **l'épreuve par l'échec** |
| `palimpseste` | `securite_vue_et_search_path_rollback.sql` | le retour arrière — ⚠️ **il rouvre le contournement** |
| `palimpseste` | `SUIVI_SQL.md` | **trois lignes créées AVANT exécution, toutes décochées** |
| `palimpseste` | `SUIVI_tests_manuels.md` | section neuve : **10 prouvés avec leur preuve, 7 à jouer** |
| `palimpseste` | `scripts/derive-doctrine.py` | **la seule ligne `OUTIL`** : `1.1` → `1.2` |
| `palimpseste` | `utils/fabrique/doctrine.fixture.json` | **régénérée**, jamais éditée à la main |
| `palimpseste` | `PLAN_DE_CHANTIER.md` §6 | l'entrée **réduite à ce qui reste** |
| `conception` | `generateur/noyau/doctrine.py` | **`Doctrine.resume` seule** |
| `conception` | `CONTEXTE.md` | **une ligne au journal, insérée par ancre** |

**Rien d'autre n'a été ouvert en écriture.** Aucune source de doctrine — `00-` à `08-`,
`instances/`, `competences/` — n'a été touchée : leurs empreintes ont été revérifiées après la
séance. **Aucun `git commit` n'a été fait** : les deux dépôts portaient déjà des modifications non
commitées avant la séance, et le tri ne lui appartient pas.

---

## ⭐ CE QUE LA CINQUIÈME DÉRIVATION A DONNÉ

**Répétition à blanc d'abord**, par le seul geste que le fichier permette : `sed
's/^commit;$/rollback;/'` — le fichier ne porte **qu'un seul** `commit;`, devenu `rollback;`, donc
**elle ne pouvait rien valider**. ⚠️ **Et le constat en pied de fichier ne pouvait pas le dire** :
il rend **exactement les mêmes comptes** à blanc et pour de bon. **Le seul contrôle qui voyait
quelque chose** a été joué à part, par requête : `doctrine_derivation` portait **toujours 4
passes** après la répétition.

| | avant | après |
|---|---|---|
| passes de `doctrine_derivation` | 4 | **5** |
| horodatage | 21/08 16:05:41 UTC | **21/08 19:58:43 UTC** |
| `outil` | `derive-doctrine.py 1.1` | **`derive-doctrine.py 1.2`** |
| `resume` | « 13 objets · 9 crans · 6 compétences · 46 couples… » | **« 13 objets · 9 crans (6 isolent, 3 produisent) · 6 compétences · 13 modes admis… »** |
| les douze comptes | 3264 · 336 · 117 · 54 · 46 · 24 · 15 · 13 · 13 · 9 · 9 · 3 | **les mêmes, au chiffre près** |

⭐⭐ **La preuve que la passe a eu lieu n'est donc pas dans les comptes : elle est dans la ligne de
journal.** C'est très exactement le piège que le prompt avait nommé — et ce qui le tient est le
**bump d'`OUTIL`**, pas les contrôles.

✅ **La fixture régénérée sur la machine de Louis rend l'empreinte `3fa7c3ee…a648e`** — ⭐
**exactement celle de la fixture déposée au dépôt**, engendrée dans un conteneur où sa racine avait
été reconstruite **au chemin absolu réel**. *L'angle mort du chemin absolu est neutralisé et
prouvé, pas supposé.*

⚠️ **Une mise en garde sur mon propre contrôle** : j'avais proposé `git diff --stat` pour comparer
la fixture — **mauvais contrôle**. Il compare au dernier **commit**, pas à ce qui avait été déposé,
et comme la fixture est un JSON d'une seule ligne, **n'importe quel** changement y rend « 1
insertion, 1 suppression ». C'est l'empreinte qui tranche, et elle seule.

✅ **`--verifie` de clôture** : `SOURCES : IDENTIQUE` · **onze tables `IDENTIQUE`** aux comptes
annoncés · `FIXTURE : IDENTIQUE`. ⚠️ **Le douzième `IDENTIQUE` n'existe pas** —
`exercices_types_crans` reste hors de `--verifie` *(angle mort du `PLAN_DE_CHANTIER.md` §6)* :
**ces onze ne sont pas une couverture complète**, et c'est précisément pour cela que le nouveau
résumé nomme ce compte-là.

---

## Ce qui reste, et qui est neuf

### ✅ Deux d'entre eux ont été faits dans la foulée, le 21/08, à la demande de Louis

1. ✅ **Les cinq autres fonctions alignées sur `search_path = public, pg_temp`.** Répétition à
   blanc *(corps seul, `rollback`)*, **rollback vérifié par requête** *(5 divergeaient de nouveau)*,
   puis pour de bon : **les sept alignées**, ⭐ **`divergent_encore = 0`** — *le contrôle qui compte,
   pas « sept lignes »* — et **aucun privilège déplacé**. ⚠️ *Fait pour la **doctrine**, pas pour le
   risque : les cinq étaient fermées à `anon` et `authenticated`, donc l'attaque par `pg_temp`
   supposait déjà d'être `service_role`. Ce qu'on ferme, c'est la divergence.*
2. ✅ **`handle_new_user()` est retirée.** Orpheline **constatée par requête** : 0 trigger · 0
   fonction qui la nomme · 0 policy · 0 dépendance de catalogue. `drop function` **sans `cascade`**,
   délibérément — *un `cascade` aurait emporté en silence ce que le constat aurait manqué*. Après :
   `to_regprocedure` rend **NULL**, **six** `security definer` restantes toutes à `public, pg_temp`,
   **une seule** exécutable par `anon`, **`profiles` intacte (18 profils, 4 policies)**.
   ⚠️ **Le rollback la recrée ET la referme dans la même transaction** — recréer une fonction dans
   `public` la ferait renaître grantée à `anon` : c'est exactement le mode de panne que la dette du
   21/08 annonçait.

⚠️ **ET IL RESTE UN POINT, QUI N'EST PAS UNE REQUÊTE** : le **smoke test** du retrait — créer un
élève depuis l'écran professeur et constater sa ligne. C'est le seul chemin que la suppression
pourrait toucher, et **c'est le chemin de mardi 25**. Décoché au `SUIVI_tests_manuels.md` (SEC-21).
### Ce qui reste vraiment

3. **La liste blanche réseau — HORS DE PORTÉE DE CETTE SÉANCE.** C'est une **politique
   d'organisation**, pas un réglage de session : *« tout le trafic qui sort du bac à sable passe par
   un mandataire obligatoire que le bac à sable ne peut ni reconfigurer ni contourner, et seules les
   destinations sur liste blanche sont joignables »*. La documentation ne la décrit qu'au niveau des
   organisations **Enterprise** — sur un compte individuel, le réglage n'est vraisemblablement pas
   exposé. Tant que `supabase.com`/`supabase.co` n'y sont pas, aucune séance Cowork ne vérifiera la
   base autrement qu'à travers le navigateur ou le terminal de Louis.
4. **Aucun `git commit` n'a été fait** — les deux dépôts portaient déjà du non-commité avant la
   séance, et une séance parallèle a écrit dans `SUIVI_tests_manuels.md` et `PLAN_DE_CHANTIER.md`
   pendant celle-ci. *Le tri appartient à Louis.*

---

## L'ordre dans lequel tout a été joué

1. **Le constat AVANT** — version du serveur, l'option et les grants de la vue, ⭐ **le balayage de
   TOUTES les vues de `public`** *(réponse : une seule)*, le `proconfig` de **toutes** les fonctions
   `security definer` *(où la trouvaille des cinq est sortie)*, les 19 policies, et les compteurs de
   l'épreuve.
2. **L'épreuve par l'échec** — décor fabriqué, trois temps dans **une transaction annulée** qui
   valait aussi **répétition à blanc** *(le DDL est transactionnel)* : **1 → 0 → REFUSÉ**, témoin
   positif à 4 partout.
3. **Rollback vérifié PAR REQUÊTE** — 0 ligne, option non posée, `anon_lit` true, 0 table
   temporaire. *Jamais sur la foi du mot affiché.*
4. **Le correctif**, puis **sa vérification** : `security_invoker = true`, `anon` fermé,
   `authenticated` gardé, les deux `search_path` posés, les privilèges des fonctions **inchangés**.
5. **La contre-épreuve** — sous `anon`, `REFUSE 42501`, témoin 4.
6. **La répétition à blanc du `--sql`**, puis la **vérification par requête** que la base portait
   toujours **4 passes** *(le constat du fichier, lui, ne pouvait rien voir)*.
7. **`--sql` joué**, `COMMIT`, **cinquième ligne en `1.2`** ; **`--fixture`** régénérée à l'empreinte
   attendue ; **`--verifie`** : `SOURCES : IDENTIQUE`, onze tables, `FIXTURE : IDENTIQUE` ;
   **`npm test` 414/414**.
8. **Relecture de la colonne `resume`** de la nouvelle ligne — *la seule trace que la passe existe*.
9. **Les trois lignes du `SUIVI_SQL.md` cochées avec leur date**, les dix-huit points du
   `SUIVI_tests_manuels.md` cochés avec leur preuve, l'entrée du `PLAN_DE_CHANTIER.md` §6 **rayée**
   et réduite à ce qui reste, l'entrée de `CONTEXTE.md` mise à jour.
