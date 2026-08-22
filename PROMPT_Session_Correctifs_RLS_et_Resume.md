# PROMPT — Session : la vue ouverte à `anon`, et le résumé qui ne peut pas voir une perte

**À coller au premier message d'une session Cowork neuve.** Deux dépôts sont en jeu — le travail
principal est dans `palimpseste`, une correction de dix lignes est dans `palimpseste-conception`.

---

## D'où viennent ces deux constats, et pourquoi ils sont ensemble

La **revue adversariale bornée de C4-L8** *(`palimpseste/RELEVE_Revue_Bornee_C4_L8_2026-08-21.md`,
onze agents, la revue qui a **exécuté** le code au lieu de le lire)* les portait **dans son corps**
et **les perdait dans sa liste ordonnée du §9**. Ils ont été inscrits au
`PLAN_DE_CHANTIER.md` §6 le 21/08 pour qu'ils cessent de n'exister que dans un relevé.

Ils n'ont rien en commun sinon **ce qui les rend traitables ensemble** : aucun des deux ne fausse
une donnée aujourd'hui, tous deux sont de petite taille, et **tous deux sont des trous dans ce qui
surveille**, pas dans ce qui produit. *Une séance, deux gestes, aucune dépendance entre eux.*

---

## ⚠️ CE QUI EST DÉJÀ VRAI, ET QUI NE SE ROUVRE PAS

Lis ceci avant d'ouvrir un fichier. Trois choses ont été faites le 21/08 et **se constatent, ne se
refont pas** :

1. **La porte RPC est refermée.** `securite_rpc_definer.sql` a révoqué `effacer_classe`,
   `retirer_inscription`, `poser_statut_recette`, `poser_statut_recette_monitoring`,
   `handle_new_user` et `chaine_depense_du_mois` de `public, anon, authenticated`. **N'y retouche
   pas.** ⚠️ **`est_prof` est grantée à `anon` et `authenticated` VOLONTAIREMENT** — 19 policies RLS
   l'appellent, la révoquer casserait la base. *Ce que cette séance lui ajoute est un `search_path`,
   pas une révocation.*
2. **La doctrine dérivée est à jour et prouvée** : quatrième passe le 21/08 à 16:05 UTC en `1.1`,
   `SOURCES : IDENTIQUE`, onze tables `IDENTIQUE`, `FIXTURE : IDENTIQUE`, `npm test` 414/414.
3. **La dette laissée ouverte par `securite_rpc_definer.sql`** est écrite dans le fichier lui-même :
   *le grant n'est qu'une serrure extérieure ; une fonction `security definer` devrait vérifier son
   appelant elle-même, sinon une migration future qui recrée la fonction la fera renaître grantée.*
   **Ce n'est pas cette séance** — mais si tu touches une de ces fonctions, tu hérites du geste.

---

## CHANTIER 1 — La vue `assiduite_hebdo_classe` est lisible par `anon`

### Le constat

`assiduite_hebdo_classe` **n'a pas `security_invoker` posé**. Une vue sans cette option s'exécute
avec les droits de son **propriétaire**, donc **contourne la RLS des tables qu'elle lit**, et elle
est **lisible par `anon`** — la clé anonyme vit dans le bundle du navigateur.

**Ce n'est pas une fuite aujourd'hui** : elle ne touche aucune banque d'exercices et compte
**0 ligne**. C'est un **contournement structurel** — la mesure est là avant que la donnée n'arrive.

### Et le second geste, plus petit

**`est_prof()` et `handle_new_user()` n'ont pas de `search_path` fixé.** Non exploitable
aujourd'hui — **ni `anon` ni `authenticated` n'ont le droit `CREATE` nulle part**, donc personne ne
peut planter un objet leurre sur leur chemin de résolution. Mais **`est_prof()` est la clef de voûte
des 26 policies** et mérite son `set search_path = public`.

⚠️ **`handle_new_user()` est du CODE MORT** — vérifié le 21/08 : **elle n'est rattachée à aucun
trigger dans toute la base**, et le commentaire du dépôt dit que l'insertion manuelle dans
`profiles` est *« plus fiable que le trigger »*. Le chemin de création de comptes
*(`app/prof/eleves/actions.ts:117-131`)* ne l'utilise pas. **Décide et dis ce que tu fais** : lui
poser son `search_path` par cohérence, ou la retirer. *Ne fais pas les deux à moitié.*

### Ce qu'on attend de toi

1. **Constate d'abord par requête** — l'état de `security_invoker` sur la vue, ses grants, le
   `proconfig` des deux fonctions. **Ne corrige rien que tu n'aies vu.**
2. **Cherche s'il existe d'autres vues dans le même cas.** ⭐ *La leçon du 21/08 : la revue avait
   trouvé deux cas d'une forme, le troisième vivait dans un autre fichier. **Balaye tout le schéma
   `public`**, ne traite pas seulement celle qu'on te nomme.*
3. Écris **un fichier `.sql` et son rollback**, et suis le protocole du `SUIVI_SQL.md` — voir plus
   bas, il n'est pas négociable.
4. **Éprouve par l'échec** : sous `set local role anon`, la vue doit rendre **0 ligne** après le
   correctif — et tu dois montrer un **témoin positif** *(une lecture qui, elle, marche)* pour
   prouver que ton zéro est réel et non un `set local` qui n'aurait pas pris.

---

## CHANTIER 2 — Le résumé de la dérivation ne peut pas voir une perte

### Le petit défaut, qui est un mot

`Doctrine.resume()` *(`palimpseste-conception/generateur/noyau/doctrine.py`, ~l. 661)* écrit
**« %d routes »** sur `n_routes = sum(len(v) for v in self.routes.values())` — soit **544**. Or
`exercices_routes` porte **3264 lignes**, et les `comptes` de `doctrine_derivation` le disent.
**Le chiffre est juste, le mot est faux** : 544 est le nombre de **déclarations de routage**, 3264
le nombre de lignes **après croisement**. Les deux nombres cohabitent dans la même ligne de base et
se contredisent.

### ⭐ Le vrai défaut, qui est une absence

Le résumé **ne nomme ni les 336 consignes, ni les 24 guides, ni les 11 genres**.

> **Une perte de six consignes laisserait « 56 observables instanciés » intact.**

Un résumé qu'on lit pour se rassurer et qui **ne peut pas voir une perte** n'est pas un contrôle :
c'est une décoration. **C'est ça qu'il faut réparer** ; le mot « routes » n'est que l'occasion.

⚠️ **Ne te contente pas d'ajouter des nombres.** Demande-toi **ce qu'un lecteur doit pouvoir
constater d'un coup d'œil**, et ce que la ligne doit faire quand un compte s'effondre. *Le chantier
a déjà tranché une fois que le bon garde-fou n'est pas un chiffre en dur mais un croisement contre
une autre source — voir le §14.2 de `04-Instances_Exercices.md` et son contrôle à trois hauteurs.*

### ⚠️⚠️ LE PIÈGE, ET IL EST SÉRIEUX

**Aucun contrôle ne verra ta correction.** Les **quinze empreintes** de `derive-doctrine.py` ne
couvrent que des markdown — `02-`, `04-`, `06-`, les six `instances/`, les six `competences/`. **Ni
`noyau/doctrine.py`, ni la version de l'outil n'en font partie**, et la fixture ne porte que
`_derivation.empreintes` et `_derivation.racine`.

Conséquence : tu peux changer `resume()` et **`--verifie` dira `IDENTIQUE` sur tout**. La seule
trace de ton changement sera **la colonne `resume` d'une nouvelle ligne de `doctrine_derivation`**,
et cette table **n'est comparée par aucun contrôle**.

**Donc : bumpe `OUTIL`** *(`scripts/derive-doctrine.py`, actuellement `1.1`)* **et rejoue `--sql`**,
sinon la base gardera le vieux résumé sans que rien ne le dise. ⚠️ **Relis le numéro juste avant de
l'écrire** — c'est un compteur partagé entre séances, et deux bumps simultanés s'écrasent.

---

## Ton périmètre d'écriture, et lui seul

**`palimpseste`** : un `.sql` neuf et son rollback · `SUIVI_SQL.md` · `SUIVI_tests_manuels.md` ·
`scripts/derive-doctrine.py` *(la seule ligne `OUTIL`)* · `utils/fabrique/doctrine.fixture.json`
*(régénérée, jamais éditée à la main)* · `PLAN_DE_CHANTIER.md` §6 *(pour rayer ce que tu fermes)*.

**`palimpseste-conception`** : `generateur/noyau/doctrine.py` — **la méthode `resume` seule** ·
`CONTEXTE.md` *(une entrée au journal, par ancre)*.

**Tu n'ouvres rien d'autre en écriture.** En particulier : aucune source de doctrine
*(`00-` à `08-`, `instances/`, `competences/`)* — **si ta correction t'y mène, tu t'arrêtes et tu le
dis à Louis**. Une source se signe, elle ne se retouche pas au passage.

---

## Les conventions, qui ne se négocient pas

**Avant d'exécuter du SQL** *(`SUIVI_SQL.md`, protocole R6)* :

- **Une ligne au journal AVANT exécution**, jamais après.
- ⚠️ **Répétition à blanc : le CORPS SEUL.** Nos fichiers portent leur propre `begin;` … `commit;` ;
  les inclure entiers dans une transaction d'essai fait que **le `commit;` du fichier valide la
  transaction englobante** — la répétition s'exécute alors **pour de bon**. *Vécu le 14/08 : deux
  sous-sections et quatre éléments supprimés.* Copie le corps, joue-le, `rollback`, puis **vérifie
  par une requête** que tout est revenu — ne te fie jamais au seul « ROLLBACK » affiché.
- **La sandbox est le projet Supabase `aoakpxxlyvthzueaywna`.** En ligne de commande, la variable
  est **`SUPABASE_DB_URL`** *(dans `.env.local`)*, **pas `DATABASE_URL`** — vide, elle te connecte
  silencieusement au Postgres local, où `BEGIN` et `CREATE TABLE` réussissent avant que tout casse.

**À la clôture** : **ta section au `SUIVI_tests_manuels.md`** — ce que tu as prouvé, coché **avec sa
preuve**, et ce qui reste à jouer en recette, décoché.

**Et une méthode que cette maison attend** : **annonce ce que tu attends AVANT de jouer**, puis
compare. Un contrôle qui confirme une prédiction écrite d'avance vaut dix contrôles lus après coup.

---

## Le « fait quand »

1. La vue ne rend **0 ligne sous `anon`** après correctif, **témoin positif à l'appui** — et tu as
   dit combien d'autres vues du schéma `public` étaient dans le même cas.
2. `est_prof()` porte son `search_path`, et le sort de `handle_new_user()` est **tranché et dit**.
3. Le `.sql` et son rollback sont au dépôt, la ligne du `SUIVI_SQL.md` est **cochée avec sa date**,
   la répétition à blanc est racontée.
4. Le résumé **nomme assez de comptes pour qu'une perte de six consignes se voie**, et tu montres
   **le cas qui le prouve** — un compte retiré, le résumé qui le dit.
5. `OUTIL` bumpé, `--sql` rejoué, `--fixture` régénérée, **`--verifie` : `SOURCES : IDENTIQUE`, onze
   tables `IDENTIQUE`, `FIXTURE : IDENTIQUE`**, et **`npm test` au vert**.
6. `PLAN_DE_CHANTIER.md` §6 : l'entrée des deux constats **rayée**, ou réduite à ce qui reste.
7. Une entrée au journal de `CONTEXTE.md`, et un relevé de séance.

---

## Pièges nommés

1. **Ne révoque pas `est_prof` de `anon`/`authenticated`** — 19 policies l'appellent *(§2 du
   relevé)*.
2. **Ne recrée pas une fonction `security definer` sans la révoquer** de `public, anon,
   authenticated` : Supabase pose au montage un `alter default privileges … grant all on functions
   to anon, authenticated`, et **`revoke … from public` ne retire pas un grant direct**.
3. **`exercices_types_crans` n'est comparée par aucun bloc de `--verifie`** — angle mort connu, au
   `PLAN_DE_CHANTIER.md` §6. Ne lis pas les « IDENTIQUE » comme une couverture complète.
4. **`_derivation.racine` porte un chemin absolu** : `FIXTURE : DIVERGE` sur toute machine autre que
   celle qui l'a engendrée. C'est un angle mort connu, **pas ton bug** — ne le « répare » pas au
   passage sans le dire.
5. **Une séance parallèle peut tourner.** Écris `CONTEXTE.md` **par ancre**, jamais en réécrivant le
   fichier ; relis le numéro de VERSION **juste avant** de le bumper, jamais celui que tu as lu au
   début du tour.
6. **Lis git avec `--no-optional-locks`**, et si un `index.lock` traîne, **vérifie son âge avant de
   conclure à autre chose** — un verrou périmé fait croire à un dépôt occupé.
