# PROMPT — Instruire la dette de la revue bornée : lesquels sont de vrais problèmes ?

**À coller au premier message d'une session Cowork neuve.** Deux dépôts sont en lecture —
`palimpseste` et `palimpseste-conception`.

---

## ⚠️⚠️ CETTE SÉANCE N'ÉCRIT RIEN. RIEN DU TOUT.

Elle **instruit**. Elle ne corrige pas, ne migre pas, ne réécrit aucune source, ne bumpe aucune
version. **Son seul livrable est un relevé** que Louis lira pour arbitrer.

C'est une demande explicite de Louis : *« voir si ce sont effectivement de vrais problèmes et quoi
faire »*. **Répare quoi que ce soit et tu détruis l'objet de la séance** — on ne saurait plus si le
problème existait.

---

## D'où vient cette liste

La **revue adversariale bornée de C4-L8** *(`palimpseste/RELEVE_Revue_Bornee_C4_L8_2026-08-21.md`,
onze agents, 181 sondages en base, chacun dans son propre `begin; … rollback;`)* a rangé une
quinzaine de constats sous « la dette, quand le calendrier le permet ». **Aucun n'a été instruit.**
Les items du §9 déjà traités *(la porte RPC, les cinq corrections de source, la re-dérivation)* sont
faits et **ne se rouvrent pas**.

## ⚠️ LA POSTURE PAR DÉFAUT EST LE DOUTE, ET ELLE EST FONDÉE

Ce chantier a déjà mesuré ce que vaut une revue adversariale non instruite :

> **Sur les douze constats d'une revue système, UN SEUL était ce que la revue disait.**

Et cette revue-ci s'est déjà trompée deux fois, de façon vérifiée :

- son **§3.4** accusait la dérivation de prendre un renvoi documentaire au pied de la lettre — **les
  onze lignes par genre étaient en base depuis le début**, et les deux consommateurs faisaient déjà
  le bon appel ; le défaut vivait dans la **ligne de repli**, ailleurs ;
- son **§6.8** déclarait la base périmée — **elle avait été re-dérivée quatre minutes avant que le
  relevé s'écrive**.

**Donc, pour chaque item** : va voir la source, la table, le code. **Un constat qui ne se reproduit
pas est un constat mort**, et le dire est un résultat, pas un échec.

⭐ **Et avant de rouvrir quoi que ce soit, vérifie que ce n'est pas déjà arbitré** : lis la colonne
ÉTAT des relevés d'arbitrage, balaye le `PLAN_DE_CHANTIER.md` §6 *(qui porte déjà cinq entrées)*, le
`CONTEXTE.md`, et les autres revues. *Trouver la ligne ne suffit pas — c'est son état qu'il faut
lire.*

---

## Ce qu'on attend, pour CHAQUE item

Un bloc court, quatre champs, et **le troisième est le seul qui compte** :

1. **Reproduit ?** — la requête, le fichier et la ligne, ou le vecteur qui le montre. *Ou : « ne se
   reproduit pas », avec ce que tu as essayé.*
2. **Déjà arbitré ?** — où, quand, avec quel état.
3. ⭐ **Qu'est-ce que ça coûte, et à qui ?** — *pas* « c'est un risque ». **Un scénario concret** :
   quelles données, quel geste d'un professeur ou d'un élève, quel résultat faux. Si tu ne sais pas
   écrire ce scénario, **dis-le** — c'est le signe d'un constat théorique, et c'est une information.
4. **Les issues**, avec leur coût — et **ce que tu recommanderais**, en une phrase, sans trancher.

**Et un classement final, en trois tas** : ce qui doit être fait **avant la première passation
réelle** · ce qui peut attendre · ce qui **n'est pas un problème** et sort de la liste.

---

## LES ITEMS À INSTRUIRE

### A · Les gardes de la base (`palimpseste`)

1. **Les fonctions `security definer` ne vérifient pas leur appelant** *(§2)*. Le `revoke` du 21/08
   est **une serrure extérieure** : une migration future qui recrée la fonction la fera **renaître
   grantée** — Supabase pose au montage un `alter default privileges … grant all on functions to
   anon, authenticated`. ⚠️ **`effacer_classe(uuid)` et `retirer_inscription(uuid)` suppriment en
   cascade sept tables**, dont `aletheia_travaux` — d'un flux **en production, avec un élève réel**.
2. **La chaîne vide passe partout où le NULL est refusé** *(§5.1)*. `not null` n'a jamais interdit
   `''`. Passent : version, statut et contenu d'une fiche ; **le contenu d'un matériau — le texte
   que l'élève lit** ; les **réponses de la liste fermée** *(`{"",""}` satisfait le `>= 2`)* ; et
   `exercices_types.libelle`, **qui accepte `''` et `NULL`** — c'est la case `<objet>` des quinze
   patrons. *Instruis d'abord : lesquelles de ces colonnes peuvent réellement recevoir `''` par un
   chemin d'écriture existant ?*
3. **`garde_cas_de_la_paire` ne garde qu'une moitié de la règle** *(§5.2)*. Elle laisse passer une
   paire à **un** cas, à **zéro** cas, et une paire dont **aucun** cas ne nomme de matériau — le
   refus n° 14 exige `count(materiau_id) = 2` pour se déclencher. **Et elle se contourne** : retirer
   `paire_diagnostic` d'un exercice à deux cas fabrique en un `update` l'état exact qu'elle refuse à
   l'insertion. ⚠️ *C'est cette garde qui a laissé passer les deux exercices de décor malformés.*
4. **La date du statut de recette accepte son propre effacement** *(§5.3)*. La colonne existe pour
   un seul lecteur — *« le recalcul de la lettre depuis les seules mesures POSTÉRIEURES à la
   recette »*. Or `poser_statut_recette('expression','evaluee','2000-01-01')` écrit `2000-01-01` sur
   les 17 élèves, et un `update` direct pose `evaluee` avec la date à `NULL`. **Antidatée, la
   recette compte toutes les mesures jamais faites** — le défaut exact que la colonne existe pour
   empêcher. ⚠️ **Et symétriquement elle est trop étroite** : deux poses dans la même transaction
   sont refusées *(`now()` est l'heure de transaction)*, avec un message qui **accuse le professeur
   d'avoir omis la date alors qu'il l'a fournie deux fois**.
5. **Le reste, en bref** — à trier vite, la plupart sont probablement mineurs :
   `exercices_intervalles_chk` ne contrôle que la **longueur** du tableau *(borne inversée `{50,10}`,
   bornes négatives, intervalle vide)* · aucun énuméré sur `observable_isole_competence` *(`patate`
   passe)* · **aucun minimum de trois distracteurs** *(refus n° 13)* · **une entrée bloquée se
   valide** *(la règle n'existe qu'en commentaire)* · un dépôt `clos` passe à `retire` · aucune
   unicité d'identité sur `exercices_imports` *(trois lignes `import_bloque.json` coexistent
   déjà)*, et `id_import` unique **globalement** et non par import · le plancher 2 teste
   l'existence et non la complétude · le cran accepte `4.4` et `'4'` · `demonstrations_formes` ne
   garde pas le couple · `doctrine_derivation` n'a **aucune unicité**, et l'autorité repose sur le
   seul `derive_at desc`.
6. **Les messages d'erreur trahissent, et fuient** *(§5.5)*. Deux gardes et deux fonctions sont
   exemplaires — français, doctrine citée. **Tout le reste remonte le dump Postgres brut**, qui est
   aussi une fuite : sur `exercices_depots`, `DETAIL: Failing row contains …` **affiche
   l'`eleve_id`**. Deux cas trompent franchement : l'empreinte en hexadécimal **majuscule** est
   refusée sans dire pourquoi, et le mode **`evaluer` sans accent** est refusé quand `évaluer`
   passe — *un fichier d'import qui perd l'accent se verra opposer un dump de contrainte.*
7. **Deux objets fantômes, et un résumé qui ment** *(§6.5)*. `exercices_types` porte **15 lignes
   pour 13 objets** : `diagnostic_essai` et `diagnostic_explication_texte` ont `libelle`, `grain` et
   `crans_admis` vides, inatteignables par la doctrine — *« inoffensifs tant qu'aucun écran ne liste
   `exercices_types` sans filtre »*. **Instruis cette condition : est-elle tenue partout ?**
   *(La seconde moitié du §6.5 — le résumé — part en séance dédiée, ne la traite pas.)*

### B · Les cribles de la dérivation (`palimpseste-conception`)

8. **Le resserrement par `crans[]` est silencieux** *(§6.2)*. `04-Instances_Exercices.md:71`
   **promet le contraire** : *« `derive-04.py` annonce à chaque passe combien de routes il a
   resserrées — aucun resserrement ne peut être silencieux. »* Ce compteur existe dans
   `derive-04.py`, **pas dans `noyau/doctrine.py`**. Effet aujourd'hui nul *(les treize objets
   admettent les neuf crans, 0 route resserrée)* ; le jour où un `crans[]` changera, la base
   recevra moins de routes et **`--verifie` dira toujours IDENTIQUE**.
9. **Quatre cribles ignorent au lieu de refuser** *(§6.3)*, éprouvés par des mutations **toutes
   légitimes en markdown** : `<!--ROUTAGE` sans espace ou avec deux → **la section entière traversée
   en silence** · une ligne de genre retirée, ou `×` écrit `x` → genres = 10, sans alarme · une
   table « variante nommée » ajoutée sous les genres → **ingérée comme un genre** · le titre « Les
   six crans qui isolent » sans gras → 330 consignes au lieu de 336. ⚠️ **Le plus retors** :
   `04-:1576` désigne la variante nommée comme sa propre parade — *et c'est précisément la forme qui
   corrompt la table des genres.*
   ⭐ **Un précédent utile** : le §14.2 a été gardé le 21/08 par **un contrôle à trois hauteurs**,
   dont le deuxième n'a été écrit qu'après avoir vu le premier échouer — *un compte sur les entités
   ne garde pas les lignes*. Lis comment, avant de proposer.
10. **La syntaxe de la ligne `<!-- ROUTAGE -->` n'est spécifiée nulle part** *(§6.3, aggravant)*. Ni
    le `02-`, ni le `07-`, ni le `08-` ne la décrivent ; le `04-` §0 ne la donne **que par
    l'exemple**. *Une dérivation dont le point d'entrée n'a pas de règle écrite.*
11. **Cinq « variantes nommées » ne sont dérivées nulle part** *(§6.4)*.
    `instances/04-argumentation.md:15` pose la règle — la consigne *« ne change pas d'un objet à
    l'autre — **sauf variante nommée** »* — et **cinq existent, écrites comme prescrit**
    *(`04-argumentation.md:220`, `04-expression.md:224`, `04-structure.md:73` et `:141`,
    `04-synthese.md:78`)*. Or **le mot « variante » n'apparaît dans aucun script**, et la clé
    `(competence, source_section, cran)` **n'a pas de place pour une consigne qui dépend de
    l'objet**. Les deux premières disent en toutes lettres que le texte servi doit changer :
    **l'élève reçoit la formulation générique.** ⚠️ *Et le `04-:1558` porte un critère d'arrêt :
    au-delà de TROIS variantes, le pari du §14.2 est perdu. Il y en a cinq. Instruis ce que ce
    critère commande.*
12. **`exercices_types.nature` : la source écrit `élément` avec accent, la base porte la forme sans
    accent** *(§6.9)* — tapée à la main par `c4_l1_seed.sql`, et la contrainte n'admet que celle-là.
    La fixture, engendrée des sources, porte donc la forme accentuée et **ne reproduit pas la
    base** ; `--verifie` **ne compare pas cette colonne**. Sans effet aujourd'hui, mais un lot qui
    dériverait `nature` échouerait sur la contrainte.
13. **Trois valeurs recopiées en dur** là où le lot revendique « rien n'est écrit en dur »
    *(§6.9)* : `CRANS_QUI_ISOLENT` / `CRANS_DE_PRODUCTION` *(`derive-doctrine.py:53-54`)* — qui est
    la colonne `couverture_observables` du `02-` —, `SIX` *(`doctrine.py:410`)*, et
    `MODES` / `COMPETENCES`. Les trois coïncident exactement avec les sources **aujourd'hui** ;
    *pour les crans, c'est une décision de contenu prise dans le code.*

### C · Les deux ports, et l'arbitrage qui n'a pas été porté

14. **`4.0` — JSON n'a qu'un type de nombre, Python en a deux** *(§4.2)*. `{"cran": 4.0}` : Python
    refuse *(`isinstance(cran, int)` est faux sur un `float`)*, le port accepte
    *(`JSON.parse("4.0")` rend `4`)*. Même cause à `plan_de_lecture.semaine` et à
    `materiau_source.localisation`. ⚠️ **Un générateur qui sérialise ses entiers en flottants — JS,
    R, pandas — dépose une banque que le script refuse et que la plateforme avale.**
    **L'arbitrage est déjà pris** *(« dans le sens du port » : `4.0` **est** l'entier 4)* — **il n'a
    simplement jamais été porté côté Python.** *Vérifié : `generateur/verifie-import.py` teste
    encore `isinstance(…, int)` strict.* Instruis le geste, pas la décision.

---

## Le livrable

**Un seul fichier** : `palimpseste/RELEVE_Instruction_Dette_C4_L8_<date>.md`.

- Les quatorze items, chacun avec ses quatre champs.
- **Le classement en trois tas.**
- ⭐ **Une section « ce qui n'est pas un problème »**, argumentée. *Elle est le vrai produit de la
  séance : c'est elle qui allège la suite.*
- Et, si tu en trouves : **ce que la revue a manqué** dans le même voisinage. *Le 21/08, un
  septième cas d'une forme corrigée est sorti tout seul en balayant le corpus — la revue en avait
  trouvé deux sur trois.*

**Aucune écriture ailleurs.** Ni source, ni migration, ni `PLAN_DE_CHANTIER.md`, ni `CONTEXTE.md` —
Louis versera lui-même ce qu'il retient, après arbitrage.

---

## Pièges nommés

1. **Ne joue aucun SQL qui écrit.** Si tu dois sonder, fais-le comme la revue : `begin; … rollback;`
   pour chaque sonde, **jamais de `commit`**. ⚠️ **Un élève réel utilise cette base.**
2. **La sandbox est le projet Supabase `aoakpxxlyvthzueaywna`** ; en ligne de commande, la variable
   est **`SUPABASE_DB_URL`** *(`.env.local`)*, **pas `DATABASE_URL`**.
3. **Ne touche pas aux tables des flux existants** — `aletheia_*`, `scriptorium_*`, `quazian_*`,
   `codex_*`, `profiles`. La revue s'en est abstenue et l'a écrit ; fais de même.
4. **Une déclaration recopiée d'une fiche sœur se vérifie contre les routes, jamais contre la
   symétrie.** *Leçon du 21/08 : la Structure surdisait parce qu'une phrase avait été mise au
   pluriel par symétrie.*
5. **Ne tire jamais une norme d'un document qui s'en défend.** Plusieurs annexes portent
   explicitement « ne fait pas foi » — elles documentent, elles ne prescrivent pas.
6. **`--verifie` prouve la stabilité, jamais la justesse** : il redérive depuis la même source. Et
   **`exercices_types_crans` n'est comparée par aucun de ses blocs**. Ne lis pas ses « IDENTIQUE »
   comme une couverture.
