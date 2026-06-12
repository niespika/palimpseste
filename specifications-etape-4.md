# Spécifications — Étape 4 : Suivi visuel et tirage au sort (module Fragments d'érudition)

## 1. Contexte

Les étapes 1 à 3 sont en production : dépôts photographiés, analyses IA avec mémoire (notes 0–4 sur trois sections, pistes individualisées), workflow de validation et publication. Lis `ARCHITECTURE.md` et les trois fichiers de spécifications précédents avant de commencer.

Cette étape 4 exploite les données accumulées : visualisation de la progression des élèves (côté prof et côté élève) et tirage au sort hebdomadaire de l'élève qui fera la présentation orale. **Aucune nouvelle interaction avec l'API Claude dans cette étape** — uniquement de la lecture et de la mise en forme des données existantes.

Bibliothèque de graphiques suggérée : Recharts (ou équivalent léger et bien maintenu).
Règle générale : tous les graphiques et statistiques ne prennent en compte que les analyses **publiées**.

## 2. Côté professeur

### 2.1 Graphique de progression par élève (sur la fiche élève)
- Courbes des trois notes (Découvertes, Sources, Réflexions) en fonction des semaines, sur un même graphique, couleurs distinctes, axe vertical fixé de 0 à 4.
- Courbe ou ligne de la **moyenne des trois notes**, visuellement distincte (plus épaisse ou pointillée), pour voir la tendance globale d'un coup d'œil.
- Les semaines sans dépôt apparaissent comme des trous visibles (pas de courbe qui « saute » par-dessus en silence) : une semaine manquée doit se voir.
- Au survol d'un point : les notes détaillées et un lien vers l'analyse de cette semaine.
- Sous le graphique, quelques chiffres : moyenne par section, taux de dépôt (x semaines sur y), nombre de dépôts en retard, nombre de pistes suivies / proposées.

### 2.2 Vue de classe (nouvel écran « Vue d'ensemble » du module)
- **Tableau de suivi** : une ligne par élève, une colonne par semaine, chaque cellule colorée selon la moyenne des trois notes de la semaine (dégradé clair, ex. rouge → vert), cellule grise pour « non rendu », hachurée ou marquée pour « en retard ». C'est l'écran qui me montre la classe entière d'un coup d'œil.
- Tri possible par moyenne générale, par taux de dépôt, par tendance.
- **Signalements automatiques** discrets en haut de l'écran : élèves avec 2 dépôts manquants consécutifs, élèves dont la moyenne baisse depuis 3 semaines, élèves dont aucune piste n'a été suivie depuis 3 semaines. Pas d'alarme dramatique : une simple liste « À surveiller » que je consulte.
- Moyennes de classe par section et par semaine (petit graphique secondaire) : utile pour voir si une consigne est mal comprise collectivement (ex. la section Sources stagne pour tout le monde).

### 2.3 Export
- Bouton « Exporter en CSV » : une ligne par élève et par semaine, avec les trois notes, le statut du dépôt et la date. Pour mes propres traitements et la préparation des bulletins.

## 3. Côté élève

### 3.1 Mon parcours
Sur la page du module, une section « Ton parcours » :
- le même graphique de progression (ses trois notes + moyenne, axe 0–4), avec les trous visibles pour les semaines manquées ;
- ses petits chiffres : taux de dépôt, meilleure section, section à travailler ;
- la liste de ses pistes encore ouvertes (statut « proposée » ou « partiellement suivie »), présentée comme « Tes pistes en attente » — c'est sa réserve d'idées pour les semaines creuses.

Ton de l'interface : factuel et encourageant. Le graphique montre ce qui est ; pas de messages automatiques culpabilisants ni de gamification (pas de badges, pas de classement entre élèves — **un élève ne voit jamais les données d'un autre**).

## 4. Tirage au sort de l'orateur

### 4.1 Nouvelle table `fragments_presentations`
- `id` (uuid)
- `eleve_id` (uuid → profiles)
- `semaine_id` (uuid → fragments_semaines)
- `statut` (enum : `tire` | `presente` | `reporte`)
- `created_at`

### 4.2 Fonctionnement (écran prof, dans la vue par semaine)
- Bouton « Tirer l'orateur de la semaine ».
- **Éligibles** : les élèves ayant accès au module et ayant déposé leur compte-rendu pour la semaine sélectionnée (on ne tire pas quelqu'un qui n'a rien à présenter). Possibilité d'exclure manuellement des élèves du tirage du jour (absents) via cases à cocher avant le tirage.
- **Équité** : tirage pondéré — la probabilité d'un élève est divisée par (1 + nombre de fois où il a déjà présenté dans l'année). Tout le monde reste tirable (pas d'exclusion ferme : l'incertitude fait partie du dispositif et maintient tout le monde préparé), mais ceux qui n'ont jamais présenté sont nettement favorisés.
- Petit moment de cérémonie : une brève animation de tirage (1 à 2 secondes, sobre) avant l'affichage du nom — c'est un rituel de classe, autant le rendre un peu théâtral. Je projetterai cet écran en classe.
- Après le tirage : boutons « A présenté » (statut `presente`) ou « Reporter » (statut `reporte`, l'élève redevient prioritaire) et « Retirer » (annule et retire quelqu'un d'autre, par exemple si l'élève tiré est finalement absent).
- Historique des présentations visible : qui a présenté quelle semaine, et compteur par élève (affiché aussi sur la fiche élève).

### 4.3 Côté élève
- Rien de particulier avant le tirage (le tirage se vit en classe, pas sur le site).
- Sur sa page, après coup : « Tu as présenté la semaine 7 ✓ » dans son historique. Pas de notification anxiogène du type « tu pourrais être tiré ».

## 5. Hors périmètre
- Notifications par courriel ; rappels automatiques aux retardataires.
- Tout autre module (Quiz, Essai…) — mais cette étape clôt le module Fragments d'érudition dans sa version complète.

## 6. Critères d'acceptation

1. Sur la fiche d'un élève ayant 3 analyses publiées et 1 semaine manquée, le graphique montre trois courbes + la moyenne, avec un trou visible à la semaine manquée ; le survol d'un point mène à l'analyse correspondante.
2. La vue de classe affiche le tableau coloré complet ; un élève sans dépôt apparaît en gris ; le tri par moyenne fonctionne ; l'export CSV s'ouvre correctement dans Excel/Numbers avec une ligne par élève-semaine.
3. Un élève connecté voit son propre graphique et ses pistes en attente, et ne peut accéder à aucune donnée d'un autre élève (vérifier par manipulation d'URL).
4. Le tirage au sort ne propose que les élèves ayant déposé pour la semaine ; après exclusion manuelle d'un élève, il ne peut pas sortir ; un élève ayant déjà présenté deux fois sort statistiquement beaucoup moins souvent (vérifiable en répétant des tirages de test).
5. Après « A présenté », l'historique et le compteur de l'élève sont à jour ; après « Reporter », l'élève redevient prioritaire au tirage suivant.
6. Les analyses non publiées n'apparaissent dans aucun graphique ni statistique.
7. `ARCHITECTURE.md` est à jour.

## 7. Méthode de travail
Comme aux étapes précédentes : plan d'abord, petites étapes, explications simples. Termine par un mini-guide : lire la vue de classe, faire le tirage en classe (avec projection), exporter le CSV.
