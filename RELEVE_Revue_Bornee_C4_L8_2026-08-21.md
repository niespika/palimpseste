# RELEVÉ — revue adversariale bornée du lot C4-L8

**21 août 2026** · branche `feat/c4-l8-fabrique` · onze agents · commandée après la revue légère,
« un peu plus dense, mais profonde quand même ».

---

## Ce qui distingue cette passe de la précédente

La revue légère **a lu** le code. Celle-ci l'a **exécuté**. C'est la seule différence qui
compte, et c'est elle qui a produit tous les constats sérieux ci-dessous :

- deux harnais différentiels ont joué **1 594 charges** et **571 couples** dans le Python
  *et* dans son port TypeScript, verdict contre verdict ;
- **181 sondages** ont tenté des écritures illégitimes en base, chacun dans son propre
  `begin; … rollback;` — 118 sur la fabrique, 63 sur la doctrine, zéro `commit;` ;
- la RLS a été éprouvée par **endossement de rôle** (`set local role anon` /
  `authenticated`, avec l'identifiant d'un vrai élève), avec témoin négatif et contrôle
  positif — sans jamais ouvrir de session ni employer d'identifiant ;
- les 3 264 routes, 336 consignes, 15 patrons et 24 guides ont été **retracés jusqu'à leur
  ligne de source**, et le compte a été refait par une implémentation indépendante.

Aucune de ces preuves n'était atteignable par la lecture.

---

## 0. Ce qui a été CORRIGÉ, et ce qui attend une décision

**Corrigé et prouvé le 21/08** — `npx tsc` propre, ESLint propre, **414 tests, 413 au vert**
(l'unique échec est `utils/chaine/instruments.test.ts`, antérieur et relevant de C4-L5).
Quatorze tests neufs verrouillent chaque correctif, et **sept de leurs huit vecteurs ont été
vérifiés comme DISCRIMINANTS** : ils échouent sur l'ancien code et passent sur le nouveau.

| Correctif | Fichier | Ce qu'il ferme |
|---|---|---|
| La coercion muette des listes racines | `verifie-import.ts` | une banque malformée était déclarée IMPORTABLE, 0 refus, et le dépôt disparaissait |
| `declare(genre)` | `verifie-import.ts` | `genre: []` bloquait le professeur à tort |
| `plie` : NFKD vers **NFD** | `verifie-reference.ts` | l'insécable, l'ellipse et l'exposant ne se rabattent plus : le port acceptait ce que le script refuse |
| `plie` : minusculiser AVANT de replier l'eszett | `verifie-reference.ts` | l'eszett CAPITAL gelait la validation d'une référence corrigée |
| `plie` : sigma final, ligatures, signe micro | `verifie-reference.ts` | ce que `casefold()` fait et que `toLowerCase()` ne fait pas |
| `rogne()` au lieu de `.trim()`, quatre appels | `verifie-reference.ts` | la SEGMENTATION divergeait : un BOM en queue donnait deux phrases à Python, une au port |
| Tri numérique des doublons | `verifie-reference.ts` | « [10,3] » au professeur au lieu de « [3, 10] » |
| `Object.hasOwn` au lieu de `??` | `verifie-reference.ts` | `n: null` s'annonçait « phrase 0 » au lieu de « phrase None » |

Le `liste()` coercitif a été **retiré du fichier**, pas seulement contourné : ce qui coerce en
silence ne doit pas rester à portée de main.

**Non corrigé DÉLIBÉRÉMENT — deux décisions qui appartiennent à Louis, et qui doivent entrer
dans le prompt de C4-L3** : le balisage markdown des 336 consignes (§3.1) et l'accord du patron
`interroger` (§6.7). Les deux sont détaillées au §9.

---

## 1. Le constat qui domine tout : l'écran élève n'existe pas

**Basculer les quatre interrupteurs mardi ne changera rien pour un élève.**

Les trois interrupteurs du `07-` §1.5 sont lus **en un seul endroit du dépôt** —
`utils/fabrique/acces.ts:56` — par `lireLesTroisInterrupteurs`, dont l'unique appelant est
le **bandeau d'information** de l'écran Compétences (`app/prof/competences/page.tsx:51`).
Ils ne gardent aucune route, aucune action, aucun trigger. Aucun `.sql` ne les consulte.
`fabrique_actif` alimente trois bandeaux d'avertissement et n'interdit rien.

La raison est en amont : **il n'y a aucune route d'exercice côté élève.** L'intégralité de
`app/eleve/` :

```
page · moi · calendrier · integrite
modules/ → aletheia · codex · fragments-erudition · quazian · scriptorium
```

`grep -rln "exercice" app/eleve/` ne rend aucun fichier. Les deux commits de C4-L8 touchent
59 fichiers, **aucun sous `app/eleve/`**. C4-L2 (le routeur) et C4-L3 (le déroulé élève) se
sont arrêtés au constat — le `PLAN_DE_CHANTIER.md` le dit.

**Ce qui est réellement prêt** : la fabrique du professeur. Importer un corpus, concevoir
une instance, l'assigner. Les douze dépôts sont en base. Ce qui manque n'est pas un défaut
de L8 : c'est un lot qui n'a pas été écrit.

**Le risque n'est donc pas une fuite, c'est un faux sentiment de mise en service** :
l'écran affichera « ON » et le dispositif restera dans l'état d'aujourd'hui.

### Et même si l'écran existait : dix-sept élèves sur dix-neuf sont hors parcours

```
classe | type_pedagogique | inscrits actifs | compétences actives
T5     | tc               |  2              | 2
Test   | (vide)           |  7              | 2
THLP   | (vide)           | 10              | 2
```

Sans `type_pedagogique`, l'ensemble de parcours est vide et la règle d'exclusion est vraie
par vacuité : aucun exercice routé. C'est la condition de recette de C4-L2, consignée au
`SUIVI_SQL.md` le 18/08, jamais jouée.

---

## 2. Corrigé pendant la revue : la porte RPC ouverte à tous

**C'était réel, et un agent l'a exécuté avant que je la referme.** Sous
`set local role anon`, `poser_statut_recette('expression','differee')` a écrit **17
lignes** ; sous `authenticated`, la version Monitoring en a écrit **34** — en transaction
annulée.

**La cause.** Supabase pose au montage
`alter default privileges in schema public grant all on functions to anon, authenticated`.
Toute fonction née dans `public` porte donc un grant **direct** à ces deux rôles, qu'un
`revoke … from public` ne retire pas. PostgREST publie tout `public.*` en
`/rest/v1/rpc/<nom>`, et la clé `anon` vit dans le bundle du navigateur.

**La preuve par le voisin** : `chaine_depense_du_mois` (C4-L5) est la seule fonction dont le
`revoke` nommait `public, anon, authenticated` — et la seule qui était fermée.

**Le plus grave n'était pas dans L8.** `effacer_classe(uuid)` et `retirer_inscription(uuid)`
(`lot2_cycle_de_vie.sql`) sont `security definer`, **sans aucun contrôle d'appelant**, et
suppriment en cascade `quazian_answers`, `quazian_sessions`, `quazian_quiz_scores`,
`codex_sessions`, `aletheia_travaux`, `inscriptions` et la classe. Un visiteur **anonyme**
pouvait effacer une classe entière.

**Fermé le 21/08** par `securite_rpc_definer.sql` (journal, répétition à blanc, exécution,
vérification). État final :

```
effacer_classe · retirer_inscription · poser_statut_recette
poser_statut_recette_monitoring · handle_new_user · chaine_depense_du_mois
    anon: f | authenticated: f | service_role: t
est_prof
    anon: t | authenticated: t     ← voulu : 19 policies RLS l'appellent
```

**Dette laissée ouverte, écrite au fichier** : le grant n'est qu'une serrure extérieure. Une
fonction `security definer` devrait vérifier son appelant elle-même — sinon une migration
future qui recrée la fonction la fera renaître grantée.

---

## 3. À réparer avant que quoi que ce soit soit servi à un élève

### 3.1 · Les 336 consignes livrent le balisage markdown en clair

`generateur/noyau/doctrine.py:491-492` : deux cellules de la **même ligne de la même
table**, deux conventions. L'`appui` passe par le nettoyeur `_nu` ; la `consigne` ne passe
que par `.strip()`.

Résultat : **336/336 consignes portent `**`**, 676 occurrences. L'application n'a aucun
moteur de rendu markdown (aucune dépendance `react-markdown`/`marked`/`remark`, aucun
`dangerouslySetInnerHTML`) : les astérisques s'afficheront tels quels.

**Ce n'est pas une hypothèse** — l'exercice `473b2c25` porte déjà en base :
« Ici `**`la raison manque`**` — un connecteur en tient lieu. »

⚠️ **Le remède naïf amputerait une consigne.** `_nu` commence par
`re.sub(r"\*\((.*?)\)\*", "", s)` : il *supprime le contenu* des notes italiques entre
parenthèses. Passer la consigne par `_nu` détruirait
`questionnement §1 cran 1` (`instances/04-questionnement.md:86`), seule du corpus à porter
cette forme. Il faut un nettoyeur qui retire le gras **sans** manger les notes.

### 3.2 · Dix consignes de cran 2 servent un aparté de conception

`_nu` retire le gras et les backticks, mais ni le pictogramme ⚠️ ni les apartés adressés au
concepteur. `04-Instances_Exercices.md:1550` et `:1553` en portent. Le patron du cran 2 les
injecte dans `<ce qui est servi>` :

> « Voici **⚠️ les moments DÉLIMITÉS, sans leur fonction — *un « plan fourni » serait la
> réponse*.** Écris le plan en t'appuyant dessus. »

« un « plan fourni » serait la réponse » est une consigne au concepteur, promue en texte
servi à l'élève.

### 3.3 · Deux exercices assignés sont malformés, avec 12 dépôts d'élèves

```
exercice   | statut  | depots | cas | sans_materiau | moins de 3 distracteurs | consigne en gras
07c62048…  | assigne |   10   |  2  |       0       |            2            | non
473b2c25…  | assigne |    2   |  2  |       2       |            2            | oui
```

L'écran doit servir **quatre candidats** ; ces quatre cas ne le peuvent pas. `473b2c25` a
en outre ses deux cas sans matériau et le même `defaut` sur les deux — ce que le refus n° 14
existe pour interdire, et que la garde laisse passer (§4.3).

### 3.4 · Le guide du cran 6 de trois objets est un renvoi documentaire

`04-Instances_Exercices.md:1551, 1552, 1556` écrivent « selon le `genre` — table ci-dessous ».
La dérivation le prend au pied de la lettre. Tant qu'aucun genre n'est choisi, le
préremplissage affiche : « Écris l'introduction. selon le genre — table ci-dessous ».

---

## 4. Les deux ports : ce qui change un verdict

**Import** — 1 594 charges · 1 311 identiques · 283 divergentes.
**Référence** — 571 couples · 344 identiques · 227 divergents.
Aucun plantage TypeScript sur 603 exécutions. Les 45 + 40 vecteurs des autotests Python
sont rejoués **à l'identique** : toutes les divergences sont hors de la couverture des tests
committés.

### 4.1 · Le seul écart où une donnée fausse entre sans qu'un mot soit dit

```json
{ "format": "palimpseste/import-exercices", "version": "1.1", "exercices": "x" }
```

- **Python** → plante, le fichier n'entre pas.
- **Port** → **IMPORTABLE. 0 refus, 0 blocage, 0 signalement.**

`liste()` (`verifie-import.ts:134`) coerce en tableau vide en silence — et l'écrivain
(`import-ecriture.ts:144, 151, 192, 290, 331, 360, 436`) refait la même coercion. Le
professeur voit une coche verte, et le dépôt entier a disparu. Vérifié sur les cinq clés
racine × six valeurs.

**Correctif** : un `[R05] « exercices » n'est pas une liste` **avant** la coercion.

### 4.2 · `4.0` — JSON n'a qu'un type de nombre, Python en a deux

`{"cran": 4.0}` : Python refuse (`isinstance(cran, int)` est faux sur un `float`), le port
accepte (`JSON.parse("4.0")` rend `4`). Même cause à `plan_de_lecture.semaine` et à
`materiau_source.localisation`. **Un générateur qui sérialise ses entiers en flottants —
JS, R, pandas — dépose une banque que le script refuse et que la plateforme avale.**

C'est la divergence que j'avais tranchée « dans le sens du port » à la revue précédente.
L'arbitrage tient (`4.0` *est* l'entier 4), mais il faut le porter côté Python, sinon les
deux contrôles continuent de se contredire.

### 4.3 · Le pliage de casse et d'accents, dans les deux sens

- **`plie` replie en NFKD ce que `casefold` laisse intact** (`verifie-reference.ts:99`) :
  l'insécable devient une espace, `…` devient `...`, `x²` devient `x2`. Le refus n° 10 —
  celui qui gèle la validation d'une référence corrigée — tombe côté Python et pas côté
  port, sur cinq formes.
- **L'eszett capital U+1E9E** : le port fait `.replace(/ß/g,'ss')` **avant**
  `.toLowerCase()` (`verifie-reference.ts:101`), donc U+1E9E échappe au repli. Le port
  **refuse ce que Python accepte** — exactement le gel que son propre commentaire
  (`:88-95`) dit vouloir éviter. Inverser les deux opérations suffit.
- **Le sigma médian** : `casefold` rabat `ς` sur `σ`, `toLowerCase()` applique le contexte
  Final_Sigma. `ΛΟΓΟΣ` diverge.

### 4.4 · La segmentation en phrases diverge — et c'est elle qui localise

`str.strip()` ôte cinq caractères que `String.trim()` ignore (**U+0085 NEL**, U+001C à
U+001F) ; `trim()` ôte le **BOM** que `strip()` garde. Conséquences mesurées : neuf couples
segmentent différemment, trois n'ont **pas le même nombre de phrases**, et vingt charges
d'import divergent sur « le champ est-il vide ». La localisation d'un exercice repose sur
cette segmentation.

### 4.5 · Les petites, à corriger d'une ligne

- `verifie-import.ts:467` — `} else if (genre) {` doit être `declare(genre)`. `genre: []`
  est faux en Python, vrai en JS : le port **bloque le professeur à tort**. La ligne 461
  voisine est correcte ; c'est un oubli isolé.
- `verifie-reference.ts:190` — le tri des doublons est lexicographique : `[10,3]` au lieu de
  `[3,10]` dans le message.
- `verifie-reference.ts:159,164,169,174` — `p.n ?? i` substitue l'index aussi sur `null`,
  là où `p.get('n', i)` ne le fait que sur clé absente : identifiant faux dans le message.

---

## 5. Les gardes de la base : ce qu'elles ne tiennent pas

181 sondages, 181 transactions annulées. Ce qui **tient** est listé au §7.

### 5.1 · La chaîne vide passe partout où le NULL est refusé

`not null` n'a jamais interdit `''`. Passent : version, statut et contenu d'une fiche ;
dimension dite à l'élève, question, et jusqu'aux **réponses de la liste fermée**
(`{"",""}` satisfait le `>= 2`) ; énoncé de sujet ; **contenu de matériau — le texte que
l'élève lit** ; défaut, réponse attendue, thème, guide, auteur, titre, référence.
Côté doctrine : consigne, patron, guide, `figure`, et **`exercices_types.libelle`, qui
accepte `''` *et* `NULL`** — c'est la case `<objet>` des quinze patrons.

### 5.2 · `garde_cas_de_la_paire` ne garde qu'une moitié de la règle

Elle refuse le cas surnuméraire et les deux cas de même matériau. Elle laisse passer : une
paire à **un** cas, une paire à **zéro** cas, et une paire dont **aucun** cas ne nomme de
matériau (le refus n° 14 exige `count(materiau_id) = 2` pour se déclencher). Et elle se
contourne : retirer `paire_diagnostic` d'un exercice à deux cas fabrique en un `update`
l'état exact qu'elle refuse à l'insertion.

### 5.3 · La date du statut de recette accepte son propre effacement

La colonne existe pour un seul lecteur : « le recalcul de la lettre depuis les seules
mesures POSTÉRIEURES à la recette ». Or `poser_statut_recette('expression','evaluee',
'2000-01-01')` écrit `2000-01-01` sur les 17 élèves, et un `update` direct pose `evaluee`
avec la date à `NULL`. **Antidatée, la recette compte toutes les mesures jamais faites** —
le défaut exact que la colonne existe pour empêcher.

Symétriquement, la garde est **trop étroite** dans un cas : deux poses de statut dans la
même transaction sont refusées (`now()` est l'heure de transaction), avec un message qui
accuse le professeur d'avoir omis la date alors qu'il l'a fournie deux fois.

### 5.4 · Le reste, en bref

- **`exercices_intervalles_chk` ne contrôle que la longueur du tableau** : borne inversée
  `{50,10}`, englobant qui n'englobe pas, bornes négatives, intervalle vide, coordonnées
  sans texte source, texte *et* sujet à la fois. Ce sont des coordonnées qui découperont le
  texte de travers.
- **Aucun énuméré sur `observable_isole_competence`** : `patate` passe.
- **Aucun minimum de trois distracteurs** (refus n° 13) : la banque vide passe.
- **Une entrée bloquée se valide** : un texte `bloque = true` passe à `valide`, un exercice
  `bloque = true` passe à `concu`. La règle est citée dans le fichier ; elle n'existe qu'en
  commentaire.
- **Un dépôt `clos` passe à `retire`**, alors que le commentaire pose l'inverse.
- **Aucune unicité d'identité sur `exercices_imports`** : trois lignes `import_bloque.json`
  coexistent déjà. Et `id_import` est unique **globalement**, pas par import : deux fichiers
  qui nomment tous deux `T1` entrent en collision.
- **Le plancher 2 teste l'existence, pas la complétude** : avec 1 correspondance sur 8,
  `expression` est déclarable `evaluee`.
- **Le cran accepte `4.4` et `2.6`** (arrondis silencieusement à 4 et 3) et `'4'` en texte.
- **`demonstrations_formes` ne garde pas le couple** : `exemple → macro` passe, et les trois
  formes peuvent être mises à `micro` d'un coup.
- **`doctrine_derivation` n'a aucune unicité** : une ligne vide, dupliquée ou mensongère
  (`comptes = {"exercices_routes": 999999}`) est acceptée, et l'autorité repose sur le seul
  `derive_at desc`.

### 5.5 · Les messages d'erreur trahissent, et fuient

Les deux gardes et les deux fonctions sont exemplaires — français, doctrine citée, article
nommé. **Tout le reste remonte le dump Postgres brut**, qui est aussi une fuite : sur
`exercices_depots`, `DETAIL: Failing row contains …` affiche l'`eleve_id`.

Deux cas où le message trompe franchement : l'empreinte en hexadécimal **majuscule** est
refusée sans dire pourquoi, et le mode **`evaluer` sans accent est refusé** alors que
`évaluer` passe — un fichier d'import qui perd l'accent se verra opposer un dump de
contrainte.

---

## 6. La doctrine dérivée : exacte aujourd'hui, gardée à moitié

**Les données sont justes.** Les neuf crans, les neuf durées, les 117 durées par
(objet, cran), les 3 264 routes, les 336 consignes, les 15 patrons et les 24 guides
reproduisent **exactement** ce que les sources écrivent — vérifié ligne à ligne sur un
échantillon difficile, et recompté par une implémentation indépendante : **0 écart**. Les
clauses fines tiennent (`conclusion × restituer` réservé à la Synthèse ; six crans
seulement ; les 306 collisions légitimes toutes préservées par section). Les quinze
empreintes SHA-256 de la fixture correspondent aux sources d'aujourd'hui, et la base est
ligne à ligne identique à la fixture.

Ce qui manque est **en amont des données** — des endroits où une source légitimement
modifiée produirait un dérivé faux **sans bruit**, et qu'aucun `--verifie` ne peut voir,
par construction (il redérive depuis la même source : il prouve la stabilité, jamais la
justesse).

### 6.1 · Un code d'observable fabriqué à partir d'une glose — **déjà en base**

`instances/04-argumentation.md:123` dit littéralement l'inverse d'un code :

> `| **En réception** | — *aucun champ propre ; le défaut se relève sur `unites[]` en composition seulement* |`

`premier_code` prend le premier jeton entre backticks. La base porte :

```
argumentation | §3  | compo: preuve_circulaire | recep: unites   ← faux
argumentation | §4  | compo: garant_circulaire | recep: (vide)   ← correct
argumentation | §5  | compo: source_cosmetique | recep: (vide)
argumentation | §10 | compo: garant_ambigu     | recep: (vide)
argumentation | §11 | compo: garant_vague      | recep: (vide)
```

Les quatre sœurs disent la même chose sans backtick et rendent bien le vide. Sans effet
aujourd'hui — §3 ne route qu'en `composer` — mais **à une édition de distance** : ajouter
`expliquer=*:…` verserait 30 routes portant un champ de composition comme code de réception.

### 6.2 · Le resserrement par `crans[]` est silencieux

`04-Instances_Exercices.md:71` **promet le contraire** : « `derive-04.py` […] annonce à
chaque passe combien de routes il a resserrées — aucun resserrement ne peut être
silencieux. » Ce compteur existe dans `derive-04.py`, pas dans `noyau/doctrine.py`, qui fait
le même resserrement sans journal. Effet aujourd'hui **nul** (les treize objets admettent
les neuf crans, 0 route resserrée) ; le jour où un `crans[]` changera, la base recevra moins
de routes et `--verifie` dira toujours IDENTIQUE.

### 6.3 · Quatre cribles ignorent au lieu de refuser

Éprouvés en mutant des copies de sources dans le scratchpad, avec des réécritures **toutes
légitimes en markdown**. Les tables gardées par un compteur s'arrêtent net ; celles qui n'en
ont pas laissent tomber des lignes sans un mot :

| mutation légitime | effet |
|---|---|
| `<!--ROUTAGE` sans espace, ou deux espaces | la section entière est **traversée en silence** |
| une ligne de genre retirée, ou `×` écrit `x`, ou sans backticks | genres = 10, sans alarme |
| une table « variante nommée » ajoutée sous les genres | **ingérée comme un genre** |
| titre « Les six crans qui isolent » sans gras | 330 consignes au lieu de 336 |
| un `\|` littéral dans une consigne | 335 consignes |
| un 7ᵉ cran ajouté à une table des six | 337 consignes |

⚠️ Le plus retors : `04-:1576` désigne la **variante nommée** comme sa propre parade — et
c'est précisément la forme qui corrompt la table des genres.

Aggravant : **la syntaxe de la ligne `<!-- ROUTAGE -->` n'est spécifiée nulle part.** Ni le
`02-`, ni le `07-`, ni le `08-` ne la décrivent ; le `04-` §0 ne la donne que par l'exemple.
Une dérivation dont le point d'entrée n'a pas de règle écrite.

### 6.4 · Cinq « variantes nommées » ne sont dérivées nulle part

`instances/04-argumentation.md:15` pose la règle : la consigne « ne change pas d'un objet à
l'autre — **sauf variante nommée** ». Cinq existent, écrites comme prescrit :

| source | ce qu'elle change |
|---|---|
| `04-argumentation.md:220` | sur `reference` : « cette **référence** » et non « cette citation » |
| `04-expression.md:224` | sur `transition` : « cette **transition** » |
| `04-structure.md:73` | sur `transition` : trois transitions entre les deux mêmes blocs |
| `04-structure.md:141` | sur `mot` : trois mots de liaison |
| `04-synthese.md:78` | sur `phrase` : trois lectures de la même phrase |

Le mot « variante » n'apparaît dans **aucun** script, et la clé
`(competence, source_section, cran)` **n'a pas de place pour une consigne qui dépend de
l'objet**. Les deux premières disent en toutes lettres que le texte servi doit changer :
l'élève reçoit la formulation générique.

### 6.7 - Le patron `interroger` est faux en francais sur quatre objets sur huit

`04-Instances_Exercices.md:1526` ecrit : « De quel probleme `<objet>` du texte **est-il** la
reponse ? » Huit objets admettent `interroger`. Quatre sont feminins, et c'est ce que l'eleve
lira :

> « De quel probleme **l'objection** du texte **est-il** la reponse ? » *(il faudrait est-elle)*
> et de meme pour **la partie**, **la phrase**, **la problematisation**.

Corrects : l'argument, le mot, le paragraphe, le plan. Le libelle substitue est juste ; c'est
l'accord du patron qui ne l'est pas. **La correction est dans la source**, pas dans le derive.
Et `Pipeline.tsx:443` pre-remplit le champ avec ce texte : sans retouche du professeur, c'est
la consigne servie.

### 6.8 - La base tourne sur une derivation PERIMEE : 39 lignes vides qui devraient etre pleines

`doctrine_derivation` dit `scripts/derive-doctrine.py **1.0**`, avec **9 empreintes**. Le script
est aujourd'hui en **1.1** et en enregistre **15** : les six `competences/*.md` s'y sont
ajoutees, avec la lecture des lignes `<!-- PRODUCTION exerce=... -->`. **La base n'a jamais vu
la 1.1.**

Consequence : `exercices_types_crans` porte `couverture_observables = NULL` sur les **39 lignes**
des crans de production (13 objets x crans 2, 6, 8). Ce que la base ignore et que la doctrine
dit : **quatre objets ont un `observable_seul` non vide** - `exemple` en argumentation ; `mot`
en argumentation, questionnement, structure ; `phrase` en argumentation, synthese ;
`problematisation` en structure. Le `04-` en fait des **sondes silencieuses, jamais des
cibles**. Cette distinction n'existe pas en base.

C'est une porte **fermee a tort**, pas ouverte : `utils/chaine/contexte.ts:311-318` tolere
l'etat vide et retombe sur le patron. **Un `--sql` la referme**, et c'est a jouer avant le
premier diagnostic.

Aggravant : **`exercices_types_crans` n'est comparee par AUCUN controle de divergence.** Elle
est dans les `delete` de `--sql` et absente des deux blocs de `--verifie` : c'est exactement la
table ou l'ecart vit, et le controle ne sait pas le dire.

### 6.9 - Ce que l'axe des modes et des objets a etabli de sain

Les **13 modes admis**, les **54 axes**, les **13 libelles**, les **46 `materiau_source`** et
`demonstrations_formes` sont **conformes ligne a ligne**, avec un controle croise fort : la
bijection « 46 couples routes = 46 couples pourvus en materiau » est **stricte**, et un audit
cote source des 544 declarations de routage contre `modes_admis`, `objets[].modes[]` et
`objets[].competences[]` rend **0 anomalie**. Les 13 libelles se substituent tous correctement
dans `<objet>` : aucune troncature, aucun balisage, la minuscule d'attaque bien rendue.

Trois valeurs sont pourtant **recopiees en dur** dans les scripts, la ou le lot revendique
« rien n'est ecrit en dur » : `CRANS_QUI_ISOLENT`/`CRANS_DE_PRODUCTION`
(`derive-doctrine.py:53-54`), qui est la colonne `couverture_observables` du `02-` ; `SIX`
(`doctrine.py:410`) ; et `MODES`/`COMPETENCES`. Les trois coincident exactement avec les sources
aujourd'hui ; pour les crans, c'est une decision de contenu prise dans le code.

Enfin `exercices_types.nature` : la source ecrit **`element` avec accent**, la base porte la
forme **sans accent** (tapee a la main par `c4_l1_seed.sql`), et la contrainte n'admet que
celle-la. La fixture, engendree des sources, porte donc la forme accentuee et **ne reproduit pas
la base** ; `--verifie` ne compare pas cette colonne. Sans effet aujourd'hui, mais un lot qui
deriverait `nature` echouerait sur la contrainte.

### 6.5 · Deux objets fantômes, et un résumé qui ment

`exercices_types` porte **15 lignes pour 13 objets** : `diagnostic_essai` et
`diagnostic_explication_texte` ont `libelle`, `grain` et `crans_admis` vides. Inatteignables
par la doctrine (0 route, 0 guide) — donc inoffensifs *tant qu'aucun écran ne liste
`exercices_types` sans filtre*.

Le `resume` de `doctrine_derivation` écrit « **544 routes** » quand ses propres `comptes`
disent **3 264** (544 = déclarations de routage ; 3 264 = lignes après croisement). Et le
résumé de chargement ne nomme **ni les 336 consignes, ni les 24 guides, ni les 11 genres** :
une perte de six consignes laisserait « 56 observables instanciés » intact.

### 6.6 · Un défaut de type qui fera planter la première jointure naturelle

`exercices_types_crans.cran` est de type **`text`** et `exercices_types.crans_admis` un
**`text[]`** (C4-L1), alors que les neuf tables de C4-L8 typent `cran` en **`integer`**.
`r.cran = any(t.crans_admis)` échoue franchement :
`ERROR: operator does not exist: integer = text`.

---

## 7. Ce qui est prouvé sain — et qui compte autant

- **Les banques sont réellement closes.** Les 26 tables portent la RLS active et une seule
  policy `prof_all`, byte-identique sur les 26 (`md5(qual)` unique). Sous `anon` **et** sous
  `authenticated` avec l'identifiant d'un vrai élève : **0 ligne partout**, y compris
  `exercices_cas` — la grille de correction. Témoin négatif et contrôle positif validés :
  les zéros sont réels, pas un `set local` qui n'aurait pas pris. **Aucune table du schéma
  `public` n'a la RLS désactivée.**
- **Aucune fuite côté élève, et pour une raison radicale** : aucun chemin de code atteignable
  par un élève ne lit une seule des dix-neuf tables. La carte des lectures est vide.
- **Aucune fuite par colonne.** C4-L1 a choisi « aucune policy élève, nulle part » : les 16
  colonnes neuves d'`exercices` n'ont aucune ligne à offrir. Le seul chemin hors écrans prof
  (`utils/chaine/contexte.ts:129`) énumère ses douze colonnes et n'en prend aucune des
  seize.
- **La garde des actions serveur est complète.** Les douze fonctions exportées appellent
  `garderProf(false)` en **première instruction du corps**. Aucun `route.ts` ajouté, aucune
  action ne fabrique son propre client admin, aucun `try/catch` n'avale le refus.
- **L'aperçu respecte la doctrine** : `composerApercu` ne rend que `candidats: string[]` —
  trois distracteurs tirés déterministement plus la réponse attendue — jamais la banque.
- **Les gardes qui tiennent** : `garde_statut_porte_sa_date` sur le geste conjoint ; le
  refus n° 14 sur le cas surnuméraire et sur les deux cas de même matériau ; les deux
  planchers mécaniques (fiche déposée, correspondance en base), avec des messages qui citent
  la source ; `textes_valide_apparie_chk` ; `textes_plan_couple_chk` ; l'empreinte
  sha256 minuscule 64 caractères et son unicité ; les cascades et les `restrict` sur les
  suppressions ; l'unicité de `competences_correspondance` et des `id_import` ;
  `uk_routes_case` — **l'index réellement en base est bien le corrigé**, et les 306
  collisions annoncées par le correctif sont **exactement** vérifiées (738 lignes, réparties
  `question_posee` 168 · `recadrages` 72 · `apports` 18 · `correspond_a` 18 · `operation` 18
  · `rapports` 12).
- **Aucune ligne incohérente dans la doctrine dérivée** : 24 sondes d'intégrité à 0. Aucune
  route ne nomme un mode, un couple (objet, mode) ou une compétence hors doctrine. Aucun
  gabarit non substitué, aucune espace double, aucune troncature sur les 336 + 15 + 24.
- **Les clés héritées sont refusées à l'identique** des deux côtés (`__proto__`,
  `constructor`, `toString`, `hasOwnProperty`, `valueOf`) : le correctif de la revue
  précédente tient.
- **`npm test` : 399/400.** Le seul échec est `utils/chaine/instruments.test.ts`, sans
  rapport avec ce lot.

---

## 8. Ce que cette revue n'a pas couvert

- **Les trois épreuves de recette non jouées** : le bout-en-bout Codex (il manque un
  matériau `genere` pour un couple objet × `composer`), la dévalidation d'une référence
  validée, l'opt-out après remise à zéro. Elles demandent une session ouverte à deux.
- **Aucune page élève authentifiée n'a été chargée** : cela aurait exigé d'ouvrir une
  session avec un mot de passe. Les verdicts du §7 reposent sur le code exact, le manifeste
  de routes construit et le catalogue Postgres — jamais sur une page rendue.
- **Trois règles de suppression n'ont pas été sondées** : elles auraient exigé un `delete`
  dans `scriptorium_contenus`, `aletheia_*` ou `profiles` — tables d'un flux existant,
  interdites à la campagne.
- **`cite_ou_refuse`** n'a pas de contrepartie dans le port : rien à comparer. Vérifié côté
  Python seul contre le `02-exercices.md` réel — 0 citation manquante.
- **La vue `assiduite_hebdo_classe`** contourne la RLS (`security_invoker` non posé) et est
  lisible par `anon`. Elle ne touche aucune banque et compte 0 ligne aujourd'hui : c'est un
  contournement structurel à refermer, hors périmètre de ce lot.
- **`est_prof()` et `handle_new_user()` n'ont pas de `search_path` fixé.** Non exploitable
  aujourd'hui — ni `anon` ni `authenticated` n'ont le droit `CREATE` nulle part — mais
  `est_prof()` est la clef de voûte des 26 policies et mérite son `set search_path = public`.

---

## 9. Ce qu'il reste a faire, dans cet ordre

**Le calendrier reel** (tranche par Louis le 21/08) : **mardi 25** = creation des comptes
eleves et presentation de la plateforme. **Lundi 31** = premier diagnostic. Les lots qui
construisent les interfaces eleves sont lances des le 21 et pendant le week-end.

### Mardi 25 : rien ne bloque

Le chemin de creation de comptes est **sain et verifie** :
`admin.auth.admin.createUser` puis un `insert` explicite dans `profiles`, avec suppression du
compte si le profil echoue (`app/prof/eleves/actions.ts:117-131`). Il ne depend PAS du
declencheur `handle_new_user` — qui, verification faite, **n'est rattache a aucun trigger dans
toute la base** : c'est du code mort, et le commentaire du depot dit que l'insertion manuelle
est « plus fiable que le trigger ». La revocation du 21/08 ne peut donc rien casser.

L'ecran eleve manquant n'est pas un probleme de mardi : rien de ce qui est presente ce jour-la
ne passe par le flux d'exercices.

### DEUX DECISIONS, a porter au prompt de C4-L3 avant qu'il ne soit lance

**(1) Le balisage markdown des 336 consignes (§3.1).** Deux issues, et le choix n'est pas
technique :

- **Le nettoyer a la derivation.** Les asterisques disparaissent. Mais l'emphase disparait
  avec : « **lequel pose un probleme, et non un theme ?** » — le gras EST la question. On
  aplatit 336 consignes ecrites avec une emphase deliberee. Et le remede naif ampute une
  consigne (§3.1, le piege de `_nu`).
- **Le rendre a l'ecran.** L'intention de l'auteur est preservee, et le cout est un rendu
  markdown restreint (gras et italique seulement) dans l'ecran eleve — que C4-L3 ecrit
  justement maintenant.

**Ma recommandation : le rendre.** Le gras est du sens, pas de la decoration ; le retirer
appauvrit la consigne, et le lot qui pourrait le rendre est en train d'etre ecrit. Si le choix
est de nettoyer, il faut un nettoyeur qui retire l'emphase **sans** manger le contenu des notes
entre parentheses.

**(2) L'accord du patron `interroger` (§6.7).** « De quel probleme l'objection du texte
**est-il** la reponse ? » Quatre objets sur huit sont feminins. La correction est **dans la
source** (`04-Instances_Exercices.md:1526`), donc dans un document que Louis signe : je ne la
fais pas seul. La piste la plus simple est de tourner le patron pour qu'il s'accorde tout seul
— par exemple « De quel probleme le texte fait-il `<objet>` la reponse ? » ou une formule qui
evite l'accord — plutot que de porter le genre dans la table des objets.

### Avant le lundi 31, dans l'ordre

1. **Rejouer `derive-doctrine.py --sql`** : la base tourne sur la derivation **1.0** quand le
   script est en **1.1**, et 39 lignes de `couverture_observables` sont vides alors que la
   doctrine les remplit (§6.8). C'est une porte fermee a tort, et un diagnostic passera dessus.
2. **Les deux exercices assignes malformes** (§3.3), avec leurs 12 depots d'eleves.
3. **Les deux classes sans `type_pedagogique`** (§1) : 17 eleves sur 19 hors parcours.
4. Les trois epreuves de recette jamais jouees (§8).

### A inscrire au prompt de C4-L3 comme pieges nommes

1. ne **pas** copier `app/prof/conception/[id]/page.tsx:48` ; le patron eleve est
   `composerApercu`, qui rend `candidats: string[]` et jamais la ligne ;
2. `correctionServieAvantLeSuivant` ne doit pas entrer dans la charge utile du cas 1 ;
3. le filtre `statut != 'retire'` sur `exercices_depots` n'existe nulle part ;
4. les policies eleve devront etre ouvertes table par table, en excluant explicitement
   `exercices_cas`, `exercices_squelettes` et `exercices_metacognition` ;
5. **toute nouvelle fonction `security definer` doit etre revoquee de `public, anon,
   authenticated`** — `from public` seul ne ferme rien (§2), et elle doit verifier son appelant.

### La dette, quand le calendrier le permet

Les gardes internes des fonctions `security definer` (§2), la chaine vide acceptee partout
(§5.1), la garde de la paire (§5.2), la date du statut de recette (§5.3), les compteurs
manquants des cribles (§6.2, §6.3), les variantes nommees (§6.4), le desaccord de type sur
`cran` (§6.6), et la specification ecrite de la ligne `<!-- ROUTAGE -->`.

**Cote generateur Python**, dans l'autre depot : l'arbitrage `4.0` (§4.2) — les deux controles
doivent cesser de se contredire. Le repli de casse et les cinq caracteres d'espace (§4.3, §4.4)
sont desormais corriges **cote port**, qui suit maintenant Python exactement.

## Note de méthode

Onze agents lancés, dix rapports exploités. Un agent a été refusé par le classifieur de
sûreté parce que son brief lui demandait de s'authentifier avec le mot de passe du compte
élève de test ; il a été relancé sur une méthode qui s'en passe — l'endossement de rôle
Postgres — et qui produit une preuve plus directe.

Deux agents travaillant en parallèle dans le scratchpad se sont écrasé un fichier de script.
Aucun travail n'a été perdu (l'échec a été bruyant), mais **la prochaine campagne doit
donner à chaque axe son sous-répertoire**.
