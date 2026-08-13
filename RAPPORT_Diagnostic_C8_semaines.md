# C8 · L1 — Diagnostic : pourquoi Fragments ne peut plus créer de semaines

*(Écrit AVANT le correctif, comme le demande le prompt de session. Constats faits le 13/08/2026
sur la sandbox `aoakpxxlyvthzueaywna`, en lecture seule, plus une répétition à blanc en
transaction annulée. Aucune écriture n'a été faite en base pendant ce diagnostic.)*

## 1. Ce qui est cassé, en une phrase

Il existe **deux définitions de « la semaine N »** — une **calculée** que les écrans du Calendrier
affichent, une **stockée** que Fragments est seul à lire — et **rien ne fabrique la seconde** en
dehors d'un bouton unique, invisible depuis Fragments et placé dans un volet où personne n'ira le
chercher. Le prof voit donc partout « ce semestre a *n* semaines » pendant que la table est vide, et
Fragments annonce « aucune semaine » sans dire quoi faire. Aucun élève ne peut déposer.

Ce n'est **pas** une lecture résiduelle de l'ancien monde. `fragments_semestres` (droppée par
`calendrier_c1b_cutover.sql`) n'est plus référencée nulle part dans le code — vérifié par grep sur
`app/`, `utils/`, `components/`, `types/`, `scripts/` : la seule occurrence restante est une phrase
de commentaire dans `types/calendrier.ts`. Les lecteurs pointent tous sur `semesters`, et
`contexte-semestre.ts` fait proprement l'alias `label:name, courant:is_active`. **Le cutover de code
est terminé ; c'est la couture qu'il a ouverte qui n'a jamais été refermée.**

## 2. Les deux définitions

| | Définition A — **calculée** | Définition B — **stockée** |
|---|---|---|
| Où | `utils/calendrier-grille.ts` · `calculerGrilleSemaines()` — fonction pure | Lignes de `fragments_semaines` |
| Entrée | `semesters.start_date/end_date` + `holidays` | ce qu'on y a écrit une fois |
| Qui la lit | `/prof/calendrier/config` (cartes de semestre, bande « Semaines du semestre »), `/prof/calendrier`, `/eleve/calendrier`, tableau de bord élève | **tout Fragments**, prof et élève — et c'est la cible de la FK `fragments_depots.semaine_id` |
| Quand elle bouge | à chaque rendu, instantanément | jamais, sauf appel explicite à `regenererSemaines()` |

La seule couture entre A et B est `regenererSemaines()`
(`app/prof/calendrier/config/actions.ts`), câblée à **un seul bouton** : « Régénérer les semaines »,
dans le volet **Vacances** de `/prof/calendrier/config`.

Ni `creerSemestre`, ni `modifierSemestre`, ni `creerHoliday` / `modifierHoliday` /
`supprimerHoliday` ne l'appellent. **Un semestre naît donc toujours sans semaines**, et une
modification de ses dates ou de ses vacances déplace la grille affichée sans toucher aux lignes.

## 3. La preuve, en base

```
semesters
  Semestre test    2026-01-17 → 2026-05-15   archivé le 16/07
  Semestre test 2  2026-07-01 → 2026-07-31   ACTIF, créé le 16/07

fragments_semaines
  15 lignes, toutes rattachées au semestre ARCHIVÉ
   0 ligne  pour le semestre ACTIF
```

Le 07/07, la refonte de la config a généré les 15 semaines du premier semestre (le bouton a été
pressé une fois). Le 16/07, « Semestre test 2 » est créé et activé — **sans une seule semaine**.
Le 24/07, le test C1 tombe sur un Fragments muet. Les trois faits s'enchaînent exactement.

## 4. Pourquoi le prof ne peut ni le voir ni le réparer

Trois portes fermées, dans cet ordre :

1. **Fragments ne crée plus de semaines.** La création manuelle a été retirée au cutover
   (`app/prof/fragments-erudition/actions.ts`, commentaire l. 51-53 : « La création de semaines se
   fait désormais dans le Calendrier »). L'écran renvoie vers `/prof/calendrier/config` sans ancre.
2. **Le Calendrier n'a pas de section « Semaines ».** Le rail de la config offre *Classes ·
   Semestres · Vacances · Fuseau* et s'ouvre par défaut sur **Classes**. Le seul bouton qui
   matérialise les semaines est dans **Vacances** — un prof qui n'a pas de vacances à saisir n'y
   entre jamais. Son libellé, « **Ré**générer », dit d'ailleurs une maintenance, pas une création.
3. **Et surtout : les écrans affirment que les semaines existent.** La carte de semestre affiche
   `totalSemaines`, la bande de Vacances affiche « *n* semaines ✔ » **en vert** — les deux calculés
   par `calculerGrilleSemaines`, sans jamais compter une ligne en base. Un semestre à zéro semaine
   s'affiche donc « 5 semaines ✔ ». **Le prof n'a aucune raison de presser le bouton : l'écran lui
   dit que c'est déjà fait.**

C'est le point qui rend le bug bloquant plutôt que gênant. Le mécanisme n'est pas en panne — la
répétition à blanc ci-dessous le prouve — c'est le fait que **rien ne le déclenche et que
l'interface ment sur son état**.

## 5. Le cousin annoncé par l'audit du 02/07

L'audit signalait « deux définitions de la semaine N » (§ 🟠, `utils/calendrier-grille.ts` vs
Aletheia). C'est bien la même famille, à un cran de gravité au-dessus : là où Aletheia risquait une
date indicative fausse, Fragments **perd la totalité de son flux de dépôt**. La divergence
Fragments n'était pas dans l'audit parce qu'à l'époque le premier semestre avait ses semaines : la
faille ne s'ouvre qu'au **deuxième** semestre — donc exactement à la rentrée du 25 août.

Il y a d'ailleurs une **troisième** définition, plus discrète, dans la même famille :
`fragments_semaines.date_limite` est un `timestamptz` qu'on remplissait avec une **date pure**
(`date_limite: span.end`). Elle est ensuite lue de deux manières incompatibles :

- comme un **jour** — `.slice(0, 10)` (`app/eleve/calendrier/page.tsx`,
  `app/prof/scriptorium/evaluations/panoptique-serveur.ts`) ou `formatJour(...)` en UTC (les trois
  écrans Fragments, le tableau de bord élève) ;
- comme un **instant** — `maintenant > new Date(semaine.date_limite)` qui décide `depose` vs
  `en_retard` (`app/eleve/modules/fragments-erudition/actions.ts`), plus `utils/sante.ts` et
  `utils/matrice-pilotage.ts`.

Les deux lectures ne coïncident que **parce que** la valeur tombait pile à minuit UTC. Or minuit UTC
le dimanche, c'est **le samedi à 20 h à Toronto** : tout ce qu'un élève déposait le dimanche — et
même le samedi soir — était déjà compté **en retard**. C'est l'item 7 du chantier, et il est ici
inséparable du correctif puisque c'est la génération des semaines qui écrit cette colonne.

## 6. Ce qui n'est PAS en cause (écarté par mesure)

- **La base.** Répétition à blanc sous l'identité réelle du prof (`set local role authenticated` +
  `request.jwt.claims`), en transaction annulée : `est_prof()` → `t`, les 5 semaines du semestre
  actif s'insèrent, le rejeu du `update` est idempotent, puis un dépôt élève s'insère sur la
  semaine 1 sous l'identité de l'élève. `ROLLBACK` — la sandbox est repartie à 0 semaine, 0 dépôt.
- **Les policies.** `fragments_semaines` : « Prof gère les semaines » (ALL / `est_prof()`) +
  lecture pour tout authentifié. `profiles` : le prof lit bien son propre rôle (`verifierProf` ne
  peut pas lever). Rien de ce que C1 a resserré ne touche ce chemin.
- **Le calcul de la grille.** Rejoué hors ligne sur les données réelles : il redonne **exactement**
  les 15 semaines du semestre archivé, mêmes `date_debut`, mêmes numéros, mêmes sauts de vacances.
  La numérotation pédagogique est juste.
- **`fragments_semestres`.** Absente de la base (droppée) et absente du code. Aucun rapport.

## 7. Le correctif (ce qui suit dans ce lot)

1. **Un semestre naît avec ses semaines.** `synchroniserSemaines()` est appelée par
   `creerSemestre`, `modifierSemestre`, `creerHoliday`, `modifierHoliday`, `supprimerHoliday` —
   partout où la grille bouge. Best-effort : elle ne fait jamais échouer l'action porteuse.
2. **L'écran cesse de mentir.** `/prof/calendrier/config` compte désormais les lignes réelles.
   La carte de semestre affiche l'écart (« aucune semaine générée », « 3 sur 12 ») avec un bouton
   **Générer les semaines** sur place ; la bande de Vacances passe de « 12 semaines ✔ » à
   « 12 prévues · 3 générées » quand elles divergent ; le rail porte une pastille
   « semaines à générer ».
3. **Fragments dit quoi faire.** L'écran vide annonce la conséquence (« les élèves ne peuvent rien
   déposer ») et pointe directement sur `?section=semestres`.
4. **Les échéances passent à l'heure de l'école.** `finDeJourDansFuseau()` (`utils/fuseau.ts`) :
   `date_limite` = **fin de journée du dimanche dans le fuseau configuré** (`calendrier_params`,
   `America/Toronto`), écrite à la création **et à la mise à jour** — donc réparée par un simple
   « Régénérer ». Les six lectures « jour » passent de UTC au fuseau de l'école.
5. **Fail-visible.** Les deux poignées de la config (`agir`, `handleRegenerer`) ont un
   `try/catch/finally` : une action serveur qui lève rend la main et se dit, au lieu de laisser le
   bouton figé sur « … ».

**Aucune migration SQL** : le schéma est déjà bon (`calendrier_c2_semaines.sql` a posé `end_date`,
`pedagogical_number`, `is_vacation` ; `date_limite` est déjà `timestamptz`). Rien à ajouter au
journal de `SUIVI_SQL.md` — et surtout rien à rejouer de l'archive.

Les 15 semaines du semestre archivé gardent leur ancienne `date_limite` à minuit UTC. C'est sans
effet (semestre archivé, aucun dépôt en base) et ça se répare d'un clic sur « Régénérer les
semaines » si ce semestre revient un jour.

## 8. Fichiers touchés

| Fichier | Nature |
|---|---|
| `app/prof/calendrier/config/actions.ts` | cœur : `synchroniserSemaines()`, câblage sur le cycle de vie du semestre, `date_limite` au fuseau |
| `app/prof/calendrier/config/page.tsx` | compte les semaines stockées, les passe aux volets, pastille du rail |
| `app/prof/calendrier/config/EcranSemestres.tsx` | écart visible + bouton « Générer les semaines » ; `agir` fail-visible |
| `app/prof/calendrier/config/EcranVacances.tsx` | compte honnête ; `handleRegenerer` fail-visible |
| `app/prof/fragments-erudition/page.tsx` | écran vide actionnable ; échéance au fuseau |
| `app/prof/fragments-erudition/semaine/[id]/page.tsx` | échéance au fuseau |
| `app/eleve/modules/fragments-erudition/page.tsx` | échéance au fuseau |
| `app/eleve/modules/fragments-erudition/actions.ts` | commentaire : `date_limite` est un instant |
| `app/eleve/page.tsx` | échéance au fuseau |
| `app/eleve/calendrier/page.tsx` | jour de l'échéance au fuseau (plus de `.slice(0,10)`) |
| `app/prof/scriptorium/evaluations/panoptique-serveur.ts` | jour de l'échéance au fuseau |
| `utils/fuseau.ts` | `finDeJourDansFuseau()` (+ helper de décalage) |
| `utils/calendrier-semaines.test.ts` | **nouveau** — 10 tests de garde (grille, fuseau, DST, régression item 7) |

## 9. Ce que ce lot ne fait pas

Hors périmètre déclaré par le prompt, laissé intact : validation par lot, synthèse de semestre,
prompt hebdo (→ L2) ; onglets et design (→ L3) ; le toggle semestre (tranché au check-in, pas ici).
Les découvertes hors réparation sont parquées dans `IDEES_post_rentree.md`.

## 10. Questions posées par ce lot (règle R7 — noter, ne pas trancher seul)

**Q1 — L'heure de la date limite. ✅ TRANCHÉ par Louis le 13/08 : dimanche 23 h 59, heure de
l'école.** Le prompt fixait la règle (« en fuseau `America/Toronto`, jamais en UTC ») mais pas
l'heure ; c'est la valeur implémentée (`finDeJourDansFuseau` → 23:59:59.999 locales). Si elle devait
changer un jour, c'est une ligne dans `utils/fuseau.ts` + un « Régénérer les semaines » pour
repropager.

**Q2 — Fuseau réglable ou Toronto en dur ?** *(ouverte, choix par défaut appliqué)* L'item 7 nomme
`America/Toronto` ; le code, lui, a déjà généralisé en fuseau **configurable**
(`calendrier_params.fuseau`, réglé sur `America/Toronto` depuis le 07/07, sélecteur prof dans le
volet Fuseau). J'ai suivi le réglage plutôt que d'écrire Toronto en dur — sinon le sélecteur prof
mentirait sur les échéances. À confirmer : si l'intention était « Toronto quoi qu'il arrive », c'est
le sélecteur qu'il faut retirer, pas le code des échéances.

**Q3 — « Créer une semaine dans une classe de test » n'est pas réalisable à la lettre.** Le critère
de sortie du prompt suppose des semaines **par classe** ; `fragments_semaines` n'a pas de
`classe_id` — les semaines sont **globales au semestre**, partagées par toutes les classes qui ont
le module. Deux classes qui ne se voient pas les mêmes jours ont donc la même échéance du dimanche.
Le test C8L1-5 est écrit dans cette réalité (une semaine, un dépôt depuis une classe qui a le
module). Le recâblage par classe est déjà différé (D12) → noté dans `IDEES_post_rentree.md`.

**Q4 — Les 15 semaines du semestre archivé gardent une `date_limite` à minuit UTC.** J'ai fait le
choix de **ne pas écrire de migration SQL** : semestre archivé, aucun dépôt en base, et la valeur se
répare d'un clic sur « Régénérer les semaines » si ce semestre revenait. Une migration de données
aurait déclenché le protocole renforcé de `SUIVI_SQL.md` (table d'un flux existant) pour zéro
bénéfice réel. À rouvrir seulement si un semestre passé doit redevenir vivant.

**Q5 — Le merge attendait le vert humain. ✅ VERT le 13/08.** Recette jouée en session prof puis
élève sur la sandbox : C8L1-1 à 7 validés (voir `SUIVI_tests_manuels.md`). **Le critère de sortie du
lot est atteint** — semaine créée depuis l'écran prof, dépôt élève réussi dedans (`statut = depose`,
pas `en_retard`), diagnostic écrit. Sandbox nettoyée de ses données de recette ensuite ; seules
restent les 5 semaines de « Semestre test 2 », qui réparent le trou du 24/07.

Un seul test reste ouvert, et il ne porte pas sur ce lot : **C8L1-8 / C11a-8** échoue parce que la
chaîne Fragments n'appelle `enregistrerCoutApi()` nulle part — la tuile « Coût API » ne verra jamais
Fragments. Câblage manquant de C11a, découvert seulement maintenant parce que ce test était bloqué
depuis juillet par l'impossibilité de créer des semaines. Correctif décrit dans
`IDEES_post_rentree.md`.
