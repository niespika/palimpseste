# PROMPT — Session d'arbitrage : « Sur un cran qui isole, le juge est la mesure » (à coller dans une session fraîche, dépôt de conception connecté)

> Usage : une session Claude avec les deux dossiers — `GitHub/palimpseste` *(le code, branche `feat/ecrans-passation`)* et `GitTest/palimpseste-conception` *(les sources)*. La session travaille avec Louis, en français. **C'est une séance de CONCEPTION : elle tranche dans les sources, elle n'écrit pas une ligne de code.** Le prompt du lot Code se fabriquera après, selon `PLAN_DE_CHANTIER.md` §5.
>
> ⛔ **Règle cardinale** : ce qui suit sont les décisions PROVISOIRES de Louis (07/09 au soir), prises sur un constat de coût, pas des décisions actées. Louis valide tout, point par point ; sa solution prime ; rien ne s'écrit dans une source sans son accord explicite, et tout ce qui s'écrit porte son statut (*acté / provisoire / [à valider]*) et sa date.

---

## 0. Le constat qui ouvre la séance (mesuré le 07/09, `RELEVE_C7_L8_2026-09-07.md`)

Sur les crans qui **isolent** (2, 4a, 5, 7, 9), l'élève ne produit qu'**une phrase ou un court paragraphe** *(145 caractères sur le décor du cran 5 ; le trou du cran 2 est une pièce)*. La chaîne y joue pourtant l'architecture des crans de production : **P1 extrait un squelette** *(« RELEVÉ VIDE : P1 n'a relevé aucune entrée sur une copie de 26 mots », dit la chaîne elle-même)*, **P2 le juge sur tous les observables de la compétence**, et **le juge du cran** *(C7-L1, 03/09)* tranche en plus la tâche contre la réponse en base. Coût mesuré en prod : **6 appels par dépôt en v1** (2,2 compétences × P1 + P2, plus Calame, plus le juge quand il tourne), 0,088 $. Avec C7-L8 *(la clé : une seule compétence)* : **4**. Avec ce que cette séance doit trancher : **2** — le juge et Calame.

**La thèse de Louis, 07/09** : *« Ce qui est produit EST un squelette. On peut passer directement à la P2, et le boulot est de comparer avec la réponse qui est en base pour cet exercice. Cette P2, c'est le juge du cran. L'anti-halo ne sert à rien aux crans qui isolent. »* Aux crans **6 et 8**, où l'élève produit l'objet entier et où plusieurs observables sont en jeu, l'anti-halo (P1 → P2) reste entier. Aux crans **1 et 3**, personne ne juge déjà (algorithmique).

**Ce que « le juge du cran » est** *(pour ne pas le confondre avec P2)* : un appel qui reçoit la copie, le devoir d'élève, l'énoncé du problème, la version corrigée et la réponse attendue, et répond : réussi ? le problème est-il encore là ? quel passage ? pourquoi. Il ne sait rien des observables. Son verdict s'écrit sur `exercices_depots.verdicts_cran`, Calame le reçoit et le dit, le registre des réussites de C7-L7 s'en dérive. Porte `juge_documents_actif`.

---

## 1. Les cinq points à trancher — la position provisoire de Louis, et ce que chaque point engage

### P1 — Le verdict est binaire ; l'observable a une famille ⇒ **une table de conversion par observable**
- **Louis (07/09)** : oui, binaire, avec une table de conversion par observable.
- **Ce que ça engage.** Chaque observable du §5 d'une fiche a une `famille` (proportion, densité, comptage rapporté, comptage, binaire, ordinal), un `seuil` ou une `valeur_reussie`, et `statutDeLaMesure` lit la valeur contre ce seuil (`utils/chaine/observables.ts`). Un verdict réussi/raté doit devenir **une valeur de cette famille** : pour `garant_present` (comptage, seuil 0 « au plus » ?) réussi = ?, raté = ? ; pour une proportion réussi = 1 ?, raté = 0 ? ; pour un ordinal, quel rang ?
- **À trancher** : (a) **où vit la table** — un champ par observable dans le bloc machine du §5 de chaque fiche *(patron `valeur_reussie`, dérivé par `derive-instruments.py`)*, ou une règle générale par famille écrite une fois au `03-` §1 *(« sur un cran qui isole, réussi vaut la valeur qui franchit le seuil, raté la valeur qui ne le franchit pas »)* ; (b) **les observables des 205 clés du `09-`** : combien de familles distinctes parmi les observables isolés *(à MESURER en séance sur `exercices_problemes` × `observables_mesure`, un nombre par famille)* ; (c) ce que dit la fenêtre d'évidence d'une suite de binaires *(le taux de réussite, `tauxDeReussite`, marche déjà sur `reussie` / `ratee` — vérifier que rien d'autre ne lit la VALEUR)*.
- **Sources à amender** : `03-competences.md` §1 (les familles), `01-routeur.md` §8.2 (la mesure), les fiches `competences/*.md` §5 si (a) retient le champ par observable ; `07-` §1.2.

### P2 — La `lettre_equivalente`
- **Louis (07/09)** : « ça va être un peu plus complexe ».
- **Ce que ça engage.** Aujourd'hui `branchement.lettre(agrege)` la tire du jugement P2 entier ; `competences_mesures.lettre_equivalente` la porte ; le moteur (`utils/moteur/etat.ts`, `jugerLaLettre`) la lit avec les observables pour faire bouger la lettre de l'élève, et « ne fabrique jamais une première lettre sans ancre ». Sans P2 sur un cran qui isole, **la mesure n'a pas de lettre équivalente**.
- **Trois voies à mettre devant Louis** : (i) `lettre_equivalente = null` sur ces crans, et la lettre ne bouge que par les crans 6·8 et les examens ; (ii) la lettre se DÉRIVE du registre des réussites de C7-L7 *(un objet « tenu » sur toute la bande d'un palier = le palier — le `10-` §7 et le `01-` v5.12 §4 le disent presque)* ; (iii) une lettre par observable isolé selon une table (à écrire). ⚠️ Chaque voie change `01-` §8 (le moteur), §11 (« il y a un squelette par dépôt × version × compétence mesurée » devient FAUX sur ces crans — à marquer), et `07-` §1.2.
- **À mesurer avant de trancher** : sur les 118 dépôts du routeur en prod, combien ont fait bouger une lettre *(`competences_niveaux.updated_at` contre `competences_mesures.mesure_at`)* — si la réponse est « presque aucun », la voie (i) ne coûte rien.

### P3 — La version finale rejoue le juge sur l'observable seul, comme la v1 ; le delta reste
- **Louis (07/09)** : « on fait en vf comme en v1, ça garde le delta. Non ? »
- **Ce que ça engage.** `delta_v1_vf` compare aujourd'hui **deux squelettes P1** (`branchement.delta`), et c'est le signal de réceptivité de N2 (`01-` §8.4). Sans P1, le delta doit se **redéfinir** : la différence des deux verdicts *(raté → réussi = +1, réussi → raté = −1, sinon 0)*, ou la différence des deux valeurs converties (P1). ⚠️ Vérifier le `regime_v1vf` des crans qui isolent (`exercices_crans.regime_v1vf` : « par paires », « pas de vf sauf escalade », « plein ») — si un cran n'a pas de vf, il n'a pas de delta, et ce n'est pas nouveau.
- **À trancher** : la définition du delta sur un verdict ; si le juge en vf reçoit la v1 *(il la reçoit déjà : `productionV1`)*.
- **Sources** : `01-` §8.4 et §11, `07-` §1.2 (`delta_v1_vf`), `10-` §6 (ce que le juge reçoit en vf).

### P4 — La banque 1.4 meurt avec la bascule
- **Louis (07/09)** : oui.
- **Ce que ça engage.** 532 exercices en prod portent `observable_isole_code` sans clé ; 565 dépôts, 480 avec décision, s'y rattachent ; les mesures et retours existants restent. « Mourir » = plus servable (retirée du vivier, `retirer-banque-14.mjs` existe), pas effacée. ⚠️ Les dépôts 1.4 en cours (v1 remise, vf attendue) : la chaîne d'aujourd'hui doit-elle finir de les servir ? Un « pas de nouvelle mesure 1.4 après la bascule, la vf des dépôts ouverts se sert sous l'ancien régime » est la lecture la plus simple.
- **Sources** : `07-` §1.1 (la bascule par objet), `PLAN_DE_CHANTIER.md` (la bascule de dimanche), `scripts/recette/BASCULE_gabarit_lundi_7_septembre.md`.

### P5 — Calame, et pourquoi le point existe
- **Louis (07/09)** : « pas sûr de comprendre le point ».
- **Le point, dit simplement.** Aujourd'hui Calame reçoit **les squelettes** (le relevé de P1 et le jugement de P2) et le gabarit lui dit d'y puiser ses citations et « le champ `levier` du verdict » (règle 4 du `07-` §4). Mesuré le 31/08 : **94,6 % des citations de Calame viennent du squelette de P1**. Sans P1 ni P2 sur un cran qui isole, Calame n'a plus que **la copie (une phrase), les documents et le verdict du juge** — c'est déjà ce que C7-L1 lui donne en plus, et déjà la borne de C7-L8 (« ton retour ne parle que de cet observable »). Il faut donc **réécrire la moitié du gabarit de Calame pour ces crans** : plus de squelette, plus de levier de P2 ; le verdict, son motif, son passage cité, la dimension à dire à l'élève. Ce n'est pas un problème, c'est un travail à nommer : la section « SQUELETTE ET VERDICTS » de l'assemblage n'a plus d'objet sur ces crans, et les règles RR1-RR4 du `01-` §12 se relisent sans squelette *(RR3 : la citation se contrôle contre la copie, c'est déjà le cas ; RR4 : le nom de l'observable ne doit pas sortir — le juge ne le connaît pas, tant mieux)*.
- **À trancher** : Calame reste-t-elle un appel séparé du juge (2 appels), ou le juge rend-il aussi le retour (1 appel, un seul modèle qui juge ET rédige — moins contraint, plus de rejeux si la forme est refusée) ? Louis, 07/09 : la fusion n'a pas été tranchée.
- **Sources** : `07-` §4 (le gabarit de Calame — GELÉ, donc un amendement daté), `01-` §12.

---

## 2. Ce que la séance mesure AVANT de trancher (le Code n'est pas là ; ces nombres se lisent par PostgREST, lecture seule, prod)

1. **Les dépôts par cran depuis le 31/08** (`exercices_depots` → `exercices.cran`) : combien aux crans 2·4·5·7·9, combien aux 6·8. C'est la part du coût que la décision touche.
2. **Ce que P1 relève sur ces crans** : sur 20 squelettes `artefact_extraction` de crans qui isolent, la taille du relevé et la part de « relevé vide » — la preuve que l'extraction n'extrait rien.
3. **Le coût de P1 + P2 par dépôt sur ces crans** (`api_couts`, phases `p1` et `p2`, `cout`, `tokens_sortie`) contre le coût du juge (phase NULL, module `exercices-chaine-juge`) et de Calame (`retour`).
4. **Les familles des observables isolés** (P1) et **les lettres qui ont bougé** (P2).
5. **`regime_v1vf` par cran** (P3).

---

## 3. Ce que la séance écrit, si Louis tranche

- Une **décision datée** au `07-Implementation.md` §2, chapitre C7 : un lot **« C7-L9 — sur un cran qui isole, le juge est la mesure »** *(mission, « fait quand », manifeste, dépendances C7-L1 · C7-L8, son interrupteur — le sien, ou `chaine_cle_actif` élargi : à dire)*.
- Les amendements aux sources nommées à chaque point (`01-` §8.2, §8.4, §11, §12 ; `03-` §1 ; `07-` §1.2, §4 ; `10-` §6), chacun avec son statut et sa date ; `[faux]` posé là où une phrase devient fausse *(« un squelette par dépôt × version × compétence mesurée »)*, et une ligne à `INVENTAIRE_Non_Tranches.md` DETTES.
- La conséquence sur **C7-L8** : ses pièces (2) et (3) restent *(la clé, la borne, le « se juger »)* ; sa pièce (2) forme (a) *(« la mesure ne garde que l'observable, `n/a` ailleurs »)* devient sans objet sur ces crans, et la ligne `IDEES` de la forme (b) *(restreindre P2)* se raye.
- Rien de ceci ne se commite dans le dépôt de conception sans que Louis le demande.

## 4. Hors de la séance

Le code · les fiches elles-mêmes *(la dérivation suivra)* · les crans 6 et 8 *(l'anti-halo y reste)* · les examens diagnostiques · le Monitoring · la fusion de la branche et la migration de C7-L8 en prod *(des gestes, pas des décisions)*.
