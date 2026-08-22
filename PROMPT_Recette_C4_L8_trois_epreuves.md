# PROMPT — Recette C4-L8 : les trois épreuves jamais jouées

**À coller dans une session Claude Code fraîche, dépôt `palimpseste`, branche
`feat/c4-l8-fabrique`.** Une session, trois épreuves.

---

## Ce que cette séance est, et ce qu'elle n'est pas

**Elle ne construit rien.** Le lot C4-L8 est joué, ses quatre migrations sont en sandbox, et
**douze preuves sur quinze sont déjà cochées** au `SUIVI_tests_manuels.md`. Il reste **trois
épreuves qui demandent un vrai navigateur connecté en professeur** — c'est tout l'objet.

⚠️ **Tu ne corriges rien de ce que tu trouves sans le dire d'abord.** Si une épreuve échoue, tu
**décris ce que la plateforme fait**, tu cites la règle qu'elle enfreint, et **tu t'arrêtes**. Une
recette qui répare en passant ne prouve plus rien : elle prouve l'état d'après.

**La règle d'or, apprise le 24/07** : teste dans **Chrome**, jamais dans l'aperçu embarqué de Code
— les dialogues natifs (`confirm()`) y sont muets et **tous les boutons à confirmation semblent
morts**. Et **Cmd-R avant de conclure à un bug** : un onglet resté ouvert pendant les hot-reloads
finit par mentir.

---

## ⚠️ L'état de la base a CHANGÉ depuis que ces épreuves ont été écrites

Les trois textes datent du 20/08. Le 21/08, deux séances ont écrit dans la même sandbox. Lis ceci
avant de t'étonner d'un écart :

1. **La doctrine a été re-dérivée deux fois** — quatrième passe le 21/08 à 16:05 UTC, outil `1.1`.
   Trois tables ont changé **dans leurs lignes, à taille constante** : les **15 patrons de
   production**, les **336 consignes isolées**, les **24 guides**.
   ⭐ **Le patron `interroger` a été retourné** : il dit désormais *« Quel est le problème dont
   `<objet>` du texte **est** la réponse ? »* et non plus *« De quel problème … est-il la
   réponse ? »*. **Si tu conçois un exercice en `interroger`, le préremplissage ne dira pas ce que
   le relevé du 20/08 montre. C'est voulu.**
   ⭐ **Les guides de repli d'`introduction`, `conclusion` et `partie` au cran 6 sont désormais
   `null`** — ils portaient un renvoi documentaire *(« selon le genre — table ci-dessous »)* qui
   partait à l'élève. Les onze lignes **par genre**, elles, sont intactes et c'est ce que les deux
   consommateurs lisent.
2. **La porte RPC a été refermée** *(`securite_rpc_definer.sql`, 21/08)* : six fonctions
   `security definer` sont révoquées de `anon` et `authenticated`. `est_prof` reste grantée aux
   deux **volontairement** — 19 policies l'appellent.
3. **Les quatre interrupteurs sont à OFF** — les trois du `07-` §1.5 (`exercices_actif`,
   `routeur_actif`, `competences_affichage_actif`) plus `fabrique_actif`.
   ⚠️ **Ils ne gardent presque rien** : la revue bornée a montré qu'ils sont lus **en un seul
   endroit du dépôt**, le bandeau de l'écran Compétences. **Ne conclus pas d'un « ON » que quelque
   chose s'ouvre**, ni d'un « OFF » que quelque chose est fermé — regarde le code.
4. **Les statuts de recette ont été remis à `mesuree_silencieusement`** après les preuves du 20/08 —
   `evaluee` est un acte du professeur, pas d'une recette. **Les reposer fait partie de tout test
   qui en dépend, et les remettre au défaut fait partie de la clôture.**

---

## Le décor qui existe déjà — ne le prends pas pour des données

`exercices` porte **4 lignes**, `exercices_depots` **12** : c'est le **décor de recette de C4-L8**,
pas du travail d'élèves. Deux de ces exercices sont **assignés et malformés**, et c'est **connu** :

| | `07c62048…` | `473b2c25…` |
|---|---|---|
| origine | importé *(`ex-argument-04-garant-0001`)* | tapé à la main |
| dépôts | 10 | 2 |
| défaut | moins de trois distracteurs sur ses deux cas | idem, **plus** deux cas sans matériau et le même défaut sur les deux |
| consigne | texte nu | ⚠️ **porte du gras markdown** |

⚠️ **Si l'écran affiche `**la raison manque**` avec ses astérisques, ce n'est PAS un bug à
corriger ici.** C'est la conséquence d'un arbitrage de Louis du 21/08 : **le balisage markdown se
rend à l'écran**, et le rendu restreint sera écrit par **C4-L3**. Note-le, ne le répare pas.

**Et ne répare pas non plus les deux exercices** : leurs défauts sont des symptômes. La maladie est
dans les gardes de la base — le refus n° 13 *(minimum trois distracteurs)* n'existe pas, et le
refus n° 14 ne se déclenche que si les deux cas nomment un matériau. C'est une dette instruite
ailleurs.

---

## ÉPREUVE 1 · C4L8-1 — La porte Codex, de bout en bout

**Ce qui manque avant de pouvoir jouer** : la banque ne porte **aucun matériau `genere` pour un
couple objet × `composer` utilisable**. C'est ton premier geste, pas un obstacle.

**Dans l'ordre :**

1. **Déposer un tel matériau** par le dépôt du corpus.
2. **Concevoir → éditer → prévisualiser → assigner** par la **voie Codex** — les six étapes du
   `02-` §6 B.2.
3. **Vérifier en base** la ligne d'`exercices_depots` : `origine = 'prof'`, et **son échéance**.

*La voie Aletheia est déjà prouvée (C4L8-6) — ne la rejoue pas. Ce qui n'a jamais tourné, c'est
Codex.*

⚠️ **Regarde l'aperçu avec attention.** Il doit rendre **`candidats: string[]`** — trois
distracteurs tirés déterministement plus la réponse attendue — et **jamais la banque entière, jamais
la ligne de correction**. Si tu vois autre chose, c'est le constat le plus grave que cette séance
puisse produire.

---

## ÉPREUVE 2 · C4L8-2 — L'opt-out d'une classe, AU BOUTON

L'opt-out a été posé **par requête** le 20/08 et il se lit bien *(C4L8-12)*. Ce qui n'a **jamais**
été rejoué, c'est **le clic**, après la remise à `active`.

**Le geste** : au profil d'une classe, au tableau de pilotage, retirer une compétence **par le
bouton**.

**Ce qu'il faut constater** : `competences_actives_par_classe.active` passe à faux **pour cette
classe seule** — *les autres classes gardent la compétence*. Puis **remettre à `active` et
recliquer** : le geste doit être rejouable.

⚠️ Ce test dépend d'une compétence en `evaluee` : repose le statut avant, remets-le au défaut après.

---

## ÉPREUVE 3 · C4L8-3 — La dévalidation d'une référence validée

**Jamais jouée, et c'est la seule des trois dont on ne connaît pas la réponse.**

À l'écran de validation de la référence *(`app/prof/conception/reference/[id]/`, `05-` §4.4)*,
**dévalider une référence déjà validée**, puis **observer ce que deviennent les instances qui la
visent**.

**Ce que la doctrine veut** : le `02-` §6 A veut qu'**aucune instance ne tourne sur une référence
non relue**, et le `08-` §7 en fait son **blocage n° 1**.

⭐ **Ce que la plateforme fait exactement dans ce sens n'a pas été éprouvé — et c'est ça, l'objet du
test.** Ne cherche pas à faire passer l'épreuve : **décris le comportement réel**, puis dis s'il
satisfait la règle, s'il la dépasse, ou s'il la laisse ouverte. Un « ça marche » sans description ne
vaut rien ici.

---

## Le « fait quand »

1. Les trois épreuves sont **jouées dans Chrome**, connecté en professeur.
2. Chacune est **cochée au `SUIVI_tests_manuels.md`, section C4 · L8, avec sa preuve** — ce que tu
   as vu, pas ce que tu as conclu. Une preuve nomme une ligne de base, un compte, ou une capture de
   ce que l'écran affiche.
3. **Ce qui échoue reste décoché**, avec la description de l'écart et la règle qu'il enfreint.
4. Les **statuts de recette sont remis à `mesuree_silencieusement`**, et les **quatre interrupteurs
   à OFF**, vérifié par requête — pas supposé.
5. Le décor que tu as ajouté *(le matériau `genere`, l'exercice conçu)* est **soit retiré, soit
   décrit** dans ta section : la sandbox ne doit pas gagner un décor que personne ne sait dater.
6. Un **rapport de clôture** qui distingue ce qui est prouvé, ce qui a échoué, et ce que tu as vu
   sans savoir l'interpréter.

---

## Pièges nommés

1. **Aucune route d'exercice n'existe côté élève** — `grep -rln "exercice" app/eleve/` ne rend rien.
   Ne cherche pas à voir le résultat « côté élève » : **il n'y a pas d'écran**. C4-L3 ne l'a pas
   encore écrit.
2. **Ne conçois pas d'exercice `interroger` en croyant vérifier le vieux libellé** — il a changé ce
   matin *(voir plus haut)*.
3. **La sandbox est le projet Supabase `aoakpxxlyvthzueaywna`.** En ligne de commande, la variable
   est **`SUPABASE_DB_URL`** *(`.env.local`)*, **pas `DATABASE_URL`** — vide, elle te connecte
   silencieusement au Postgres local où `BEGIN` réussit avant que tout casse.
4. **Un élève réel utilise cette base** *(Aletheia, lecture en cours — pilote conscient des
   travaux)*. Tu ne touches ni à `aletheia_*`, ni à `scriptorium_*`, ni à `profiles`.
5. **Les messages d'erreur de la base fuient** : sur `exercices_depots`, un `DETAIL: Failing row
   contains …` affiche l'`eleve_id`. Si tu en captures un dans ton rapport, **caviarde-le**.
6. **`utils/fabrique/verifie-import.ts` est à ré-aligner sur son script** *(dette ouverte le 21/08,
   deux vecteurs d'écart)*. **Ce n'est pas ta séance** — ne l'ouvre pas.
