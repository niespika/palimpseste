# Refonte — le routeur et la fabrique à l'heure de la clé (écrit le 05/09/2026 au soir)

> À coller dans une nouvelle séance Claude Code ouverte dans `palimpseste`. La mémoire se charge seule ; ce
> message dit le problème, ce qui est mesuré, et ce que j'attends. Règles inchangées : la doctrine se dérive et
> s'amende AVANT le code (`01-routeur.md`, `10-Gabarit.md` dans `palimpseste-conception`), toute
> fonctionnalité naît derrière un flag OFF, jamais `git add -A`, un push est un déploiement, mesurer avant
> d'affirmer, rien en production sans mon « go », et pas d'appels API : les exercices se fabriquent et se
> relisent EN SÉANCE (agents), avec la revue à trois temps du 05/09.

Lis d'abord dans la mémoire `project_c7_l5_routeur_registre`, `project_c7_l4_fabrique_gabarit`,
`project_avocat_de_leleve_revue_gabarit` et `project_lundi_7_septembre_bascule_gabarit`. Puis mesure :
`git fetch`, `git status`, les portes dans les deux bases, et `banc-porte-registre.mjs --prod --jours 7`.

## Le problème, tel que je le vois
Le gabarit a changé l'unité de fabrication : une CLÉ du `09-` donne UN devoir d'élève (deux cas sur le même
sujet) et HUIT exercices qui le réutilisent — 1(a), 1(b), 3, 4(a), 4(b), 5, 7, 9. Le routeur, lui, raisonne
encore par exercice et par objet : il n'écarte que les instances où l'élève porte déjà un dépôt (piège 30).
Mesuré le 05/09 dans `utils/moteur/vivier.ts` : aucune notion de clé, aucun délai, aucune exclusion du
« même devoir ». Donc aujourd'hui rien n'empêche de servir à un élève le 1(a) et le 4(a) d'une même clé la
même semaine (le même texte deux fois), ni la même clé d'une semaine sur l'autre.

Mon intuition, à éprouver puis à écrire dans la doctrine :
a) **Le fonctionnement par clé change le lien d'indépendance entre deux exercices.** Deux exercices de la même
   clé ne sont pas indépendants : ce qui est servi est le même devoir. On ne sert pas un cran 1 et un cran 4 de
   la même clé la même semaine, ni la même clé d'une semaine sur l'autre ; il faut attendre trois semaines.
   Le même OBSERVABLE, oui ; la même CLÉ, non.
b) **Le routeur doit tenir ce lien** : une quarantaine par clé et par élève, avec sa trace dans la décision.
c) **La nouvelle manière de penser les crans change la manière dont les exercices sont tirés** — le cran vient
   du registre (« deux et deux », semaine de méthode 1·3·4, sondes de montée), la clé doit venir d'une rotation
   qui respecte la quarantaine, et le nombre de clés disponibles par objet borne ce que le routeur peut servir.

## Ce qui est mesuré, pour cadrer
- Production : 63 élèves ; 480 dépôts du routeur sur 7 jours, 5 à 13 par élève, médiane 9.
- Banque prête pour lundi : 304 exercices, 38 clés — par objet : transition 10 · argument 6 · objection 6 · paragraphe 6 · exemple 4 · phrase 3 · plan 3.
  En semaine de méthode, cinq exercices par clé se servent (1a, 1b, 3, 4a, 4b).
- Avec une quarantaine de trois semaines par clé, un objet à trois ou quatre clés s'épuise en une semaine pour un
  élève qui en reçoit deux : la refonte du routeur et le volume de la fabrique se décident ENSEMBLE.

## Ce que j'attends de toi, dans cet ordre
1. **Mesurer d'abord** ce que la règle (a) aurait changé sur les dépôts réels : combien de fois, cette semaine,
   un même élève aurait reçu deux crans d'une même clé ou la même clé à moins de trois semaines — un banc en
   lecture seule, sur les deux bases, avant toute écriture.
2. **Écrire la doctrine** : dans `01-routeur.md` (§3 le tirage, §8 l'espacement) et `10-Gabarit.md` (§7), la
   règle de la clé comme unité de service — quarantaine, ce qu'elle interdit dans le cycle et entre cycles, ce
   que fait le routeur quand un objet n'a plus de clé servable (sonde ? autre objet ? rien ?), et comment la
   fabrique doit dimensionner les vagues par objet pour tenir un trimestre. Versionner, me faire relire, puis
   rejouer la dérivation si le `10-` bouge (`derive-doctrine.py --sql --fixture`, des deux côtés).
3. **Le lot Code** (chapitre C7 du `07-`, nouveau lot, derrière `gabarit_actif`) : le vivier connaît la clé de
   chaque instance (`exercices_cas.probleme`), écarte `cle_en_quarantaine` avec la date du dernier dépôt de cette
   clé, journalise dans `routeur_decisions`, et le banc dit ce qu'il aurait fermé. Tests purs, tsc, smoke bac à
   sable, mesure en prod en lecture seule — et me le montrer avant d'ouvrir.
4. **La fabrique** : ce que la règle change au dimensionnement (combien de clés par objet), et mon idée du 05/09 :
   les deux cas d'une clé sur DEUX SUJETS différents, pour que le second ne se reconnaisse pas à sa forme.
   Les prochaines vagues sont écrites par toi en séance, contrôlées par les deux contrôles d'import, relues par la
   revue à trois temps.

Toute idée hors périmètre va dans `IDEES_post_rentree.md`. Liste tes arbitrages à la fin.

## Quatre questions de plus, ajoutées le 05/09 au soir — à instruire dans la même refonte
5. **Une gradation des crans plus évidente que celle qu'on a.** Les neuf crans se lisent aujourd'hui par
   le geste (reconnaître, transformer, produire) et par « deux et deux ». Cherche dans les études pédagogiques
   ce qui fonde une progression d'exercices (retrieval practice et espacement, interleaving, apprentissage par
   exemples résolus puis fading, contrastive cases, feedback différé ou immédiat…) et propose ce que ça change
   à l'ordre et aux seuils du `10-` §7 — avec les sources, et ce qui est mesurable chez nous.
6. **Le cran 2 en semaine de méthode.** La porte sert 1·3·4 en méthode et ferme le 2 (« pas encore produire »).
   Éprouve l'inverse : un cran 2 tôt, comme entrée dans l'objet. Ce que ça suppose de la fabrique (les pièces
   du 2 se dérivent du contre-exemple canonique, contrôle « recollées » pas écrit) et ce que ça change à la porte.
7. **Le temps réel contre le temps prévu.** Mesuré en prod le 05/09 sur 198 dépôts ouverts ET remis
   (`ouvert_at` → `v1_remis_at`) : cran 1 médiane 6 min (n = 17), cran 3 2 min (13), cran 4 11 min (22),
   cran 5 10 min (23), cran 7 12 min (22), crans 6·8·9 de 18 à 63 min sur 2 à 4 dépôts ; `duree_taguee` est
   renseignée 92 fois. Les durées PRÉVUES (`exercices_types_crans.duree_exercice_min`) vont de 2 à 40 min
   selon l'objet, sans lien visible avec ces mesures. Le budget du cycle et le bonus comptent en minutes
   prévues : recale-les sur le réel, par cran et par objet, et dis ce que ça change au nombre d'exercices
   servis par semaine.
8. **Les comptes micro / méso / macro tiennent-ils encore ?** Le `01-` §5 distribue les cibles en proportions
   micro/méso/macro par palier et par segment. Depuis le gabarit, ce qui est servi est un couple (objet, cran)
   au grain de l'objet, et la clé fixe le grain du passage. Vérifie si ces proportions décrivent encore ce que
   le routeur tire, ou si la table doit se réécrire en objets × crans ; mesure sur les décisions réelles avant
   de proposer.
