# PROMPT Code — C7 · L3 : Quazian, tuiles par cours et visibilité au « vu »

*(⚙️ modèle standard · une session = ce lot (règle R4) · `/clear` avant de commencer · branche `feat/c7-l3-vu` depuis un `main` à jour · prérequis : C7·L1-L2 mergés et recettés — 13-14/08)*

## Contexte

Deux demandes de Louis, issues de ses tests du 14/08 — dans la continuité directe de C7·L1
(arc bi-source, génération au bouton, file de validation) et L2 (onglets, commutateur trois états) :

1. **Côté élève, les cartes de tous les cours arrivent en un seul pot commun.** La consultation les
   groupe par libellé, mais l'écran Flashcards est un pot unique. Voulu : **des tuiles par cours,
   portant le nom du cours** — comme l'écran prof — pour la lisibilité.
2. **Le prof ne doit plus avoir à PUBLIER les cartes validées.** Aujourd'hui la visibilité élève =
   publication manuelle par cible (`quazian_publications`, bouton « Publier aux élèves » de
   `/prof/quazian`) ET « au programme » de la classe. Voulu : c'est **la fonction « vu » du
   Scriptorium** qui gouverne — une carte validée devient visible quand l'élément correspondant est
   coché « vu » dans le pilotage de la classe.

Le « vu » vit sur `scriptorium_parcours_classe_elements.vu_at` (par CLASSE et par ÉLÉMENT —
`marquerVu`, `app/prof/scriptorium/actions.ts:1926` ; schéma `scriptorium_rag_l1.sql:97`). Un élément
est un contenu entier, une **sous-section** d'un cours découpé (`ref_type='section'`, `section_id` →
`scriptorium_contenu_sections`, `scriptorium_rag_l1.sql:37`), ou une semaine de livre. Un cours
découpé est matérialisé en un élément PAR SOUS-SECTION : pour que le « vu » filtre au bon grain,
**les cartes doivent porter la sous-section d'origine** — c'est la méta-donnée qui manque
(la question était déjà posée au §10.4 du `RAPPORT_Diagnostic_C7_quazian.md` ; ce lot y répond).

## Objectif du lot

1. **Diagnostic d'abord, écrit en tête de PR.** (a) Ce que fait une RE-DÉCOUPE : `remplacerDecoupe`
   (`app/prof/scriptorium/actions.ts:941` et alentour) **supprime et recrée** les sections, avec
   re-matérialisation consciente des éléments d'instance. Dire ce que deviennent alors des cartes
   ancrées à une section, et choisir la sémantique de FK en conséquence (attendu : `on delete set
   null` — la carte retombe au grain « cours entier » — mais c'est le diagnostic qui tranche, pas ce
   prompt). (b) L'état de la sandbox : les cartes existantes (recette des 13-14/08, ex. « Cognitif »)
   sont au grain contenu et aujourd'hui publiées — dire ce qu'elles deviennent sous le nouveau régime.
2. **Migration additive** `c7_quazian_sections.sql` : `quazian_flashcards.section_id` (FK
   `scriptorium_contenu_sections`, nullable, cohérente avec l'arc bi-source : `section_id` non nul ⇒
   bras contenu). Patron et protocole de `c7_quazian_contenus.sql` : ligne au `SUIVI_SQL.md` **avant**
   d'exécuter, protocole renforcé, rollback prêt.
3. **Génération par sous-section.** Un cours découpé se génère section par section, chaque carte
   naissant avec son `section_id` ; un cours non découpé et un texte source gardent le grain contenu.
   La règle F2 est inchangée (un texte source → 1-2 cartes). La génération reste **au bouton**, cible
   par cible.
4. **La publication disparaît, le « vu » gouverne.** Une carte partagée est visible d'un élève si
   elle est `valide` ET que l'instance de parcours ACTIVE de la classe en contexte a vu l'élément
   correspondant : carte à `section_id` → l'élément de CETTE section est vu ; carte au grain
   contenu → le contenu est ENTAMÉ (au moins un de ses éléments vu — décision prise ici, R7).
   Recâbler UNIQUEMENT le point central (`contexteVisibiliteCartes` / `cartesPartageesVisibles`,
   `app/eleve/modules/quazian/actions.ts:53-125`) : file, consultation et stats suivent d'eux-mêmes,
   c'est fait pour. Les cartes personnelles (`eleve_id` non nul) ne passent pas par ce périmètre —
   inchangé. `quazian_publications` (bras contenu) cesse d'être lue et écrite ; le bouton
   « Publier aux élèves / Masquer » (`togglePublication`, `app/prof/quazian/actions.ts:262` ;
   formulaire `app/prof/quazian/page.tsx:113-125`) disparaît ; la table RESTE en base (son sort est
   un arbitrage, comme `classe_id` text — §10.1 du rapport). Le bras unité hérité ne bouge pas
   (0 ligne en base). Au passage ce lot règle le §10.2 (« la publication reste globale ») : le « vu »
   étant par classe, la divergence entre classes est native.
5. **L'écran prof dit l'état réel** à la place du bouton : pour la cible choisie, par classe au
   parcours, l'avancement du « vu » (ex. « Test — 3 sous-sections vues sur 5 → 12 cartes visibles »),
   en reprenant le libellé « Au parcours de… » existant (`app/prof/quazian/page.tsx:142-148`).
6. **Tuiles par cours côté élève** (onglet Flashcards) : une tuile par cible ayant des cartes
   visibles — nom du cours, nb de cartes, nb dues — et la consultation s'ouvre par cours. Décision
   prise ici (R7) : la FILE de révision FSRS reste GLOBALE (la répétition espacée est transverse),
   chaque carte continuant d'afficher son cours. Reformuler au passage les messages qui parlent de
   « publier » (ex. `QuazianDashboard.tsx:108` « Ton professeur n'a pas encore publié de cartes »).

## Hors périmètre de ce lot

- La génération AUTOMATIQUE au clic « vu » (déclencheur) — écartée post-rentrée par le prompt de L2,
  elle le reste. Les quiz (périmètre, lancement par classe) ne bougent pas.
- Le diagnostic fragilités et ses deux fils cassés → **C6** ; le design Paramètres → coupe pré-décidée ;
  le sort de `quazian_publications` et de sa colonne `classe_id` → arbitrage, pas ici.
- L'accès module × classe (élève ET prof) → session dédiée `PROMPT_Code_Acces_classes_L1.md` — ne pas
  l'entamer ici, même si les deux se frôlent sur l'écran élève Quazian.
- Toute idée au-delà → une ligne dans `IDEES_post_rentree.md`.

## Règles du dépôt (AGENTS.md — rappel)

- **SQL** : lire `SUIVI_SQL.md` AVANT ; nouvelle migration = `.sql` à la racine + ligne au journal ;
  **protocole renforcé** (flux existant, non gaté) : code mergé+poussé d'abord, SQL ensuite, fenêtre
  calme, rollback prêt, smoke élève. Zone : `c7_quazian_contenus.sql`, `scriptorium_rag_l1.sql`.
- Pas de `confirm()` natif sur un bouton neuf — patron `TableauLive` (commit `89625fc`), cf. l'entrée
  dédiée d'`IDEES_post_rentree.md`. UI : jetons de `globals.css`, pas de hex en dur.
- Question de conception → noter en fin de session, ne pas trancher (R7).

## Critère de sortie

Sandbox, Chrome (pas l'aperçu embarqué), session prof PUIS élève : un cours découpé en sous-sections
(en découper un via l'éditeur de sections si aucun ne l'est) → générer → valider — **aucun geste de
publication** ; cocher UNE sous-section « vue » pour la classe Test → l'élève de Test voit apparaître
les cartes de CETTE sous-section seulement, dans une tuile au nom du cours ; une sous-section non vue
ne montre rien ; les compteurs du tableau de bord suivent. Rejouer **C7L2-5** (bi-classe Sacha : T5
ne voit toujours rien). Consigner dans la PR le sort des cartes déjà publiées (elles passent sous le
régime « vu » : comportement voulu, pas une régression — le dire aussi au journal des tests).
Reporter les tests au `SUIVI_tests_manuels.md` (section C7 · L3). Commit + merge si vert.
