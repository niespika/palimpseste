-- ============================================================================
-- C4 · L8 — LA DOCTRINE DÉRIVÉE (additive, gatée, NON-CASSANTE).
-- Fichier : c4_l8_doctrine.sql
-- ----------------------------------------------------------------------------
-- Lot C4-L8 — « la fabrique du professeur ». Manifeste : `07-Implementation.md`
-- §1 et §2 (VERSION 2.7, VALIDÉ ET GELÉ) · `02-exercices.md` (VERSION 5.4) ·
-- `04-Instances_Exercices.md` (VERSION 3.1) · `instances/04-*.md` ·
-- `08-FORMAT_IMPORT.md` (VERSION 1.2) · `SUIVI_SQL.md` · `c1_rls_eleve.sql`.
--
-- POURQUOI CE FICHIER EXISTE
--   Le seed de C4-L1 a posé les treize objets avec leur grain, leurs
--   `supports_source`, leurs `genres_admis` et leurs `competences[]`, et a
--   LAISSÉ VIDES — parce que hors de son manifeste — `crans_admis`,
--   `exercices_types_crans`, `exercices_types_modes`, `mode_saisie`,
--   `consigne_gabarit` et `exclusions_parcours`. Or la conception en ligne et
--   les contrôles d'import les lisent TOUS (piège 37 du prompt de lot).
--   Ce fichier pose les TABLES qui manquent ; il n'y écrit AUCUNE VALEUR.
--
-- ⚠️ RIEN N'EST SEEDÉ ICI, ET C'EST LA RÈGLE DU LOT.
--   « Ne recopie aucune de ces tables à la main, ni dans le code ni dans un
--   seed tapé […] Dérive-les des sources par un script, avec un contrôle qui
--   sait dire quand elles ont divergé » (piège 38 ; `08-` §7.4 ; `07-` §2 :
--   « ce que la fabrique lit de ces deux-là, elle le DÉRIVE des fichiers, elle
--   ne le recopie pas »). Le remplissage se fait par
--   `scripts/derive-doctrine.py`, qui lit les sources de l'autre dépôt par
--   `generateur/noyau/doctrine.py` et son crible « cite ou refuse ».
--   Une table de ce fichier laissée vide est un script non joué, jamais une
--   valeur manquante à taper.
--
-- CE QUE CE FICHIER POSE
--   • `exercices_crans`               — les neuf crans (`02-` §2.1 et §2.2)
--   • `exercices_durees`              — geste × grain (`02-` §2.4)
--   • `competences_modes_admis`       — la table des modes admis (`02-` §3)
--   • `exercices_types_modes_source`  — le `materiau_source` par objet × mode
--                                       (`04-` §0 ; `02-` §2.3, « déclaré par
--                                       le type, pas par le cran »)
--   • `exercices_routes`              — observable × objet × mode × cran
--                                       (les lignes `<!-- ROUTAGE -->`)
--   • `exercices_consignes_isolees`   — la banque des six crans qui isolent
--   • `exercices_consignes_production`— les quinze patrons du `04-` §14.1
--   • `exercices_guides_production`   — les guides du `04-` §14.2, genre compris
--   • `doctrine_derivation`           — le journal de dérivation : ce qui a été
--                                       lu, quand, et l'empreinte de chaque
--                                       source. C'est lui qui rend le contrôle
--                                       de divergence possible.
--   • le QUATRIÈME interrupteur, `fabrique_actif`, à OFF, au même emplacement
--     que les cinq existants (convention de dépôt ; piège 41 : les trois du
--     `07-` §1.5 ne nomment pas le professeur qui prépare, donc les écrans de
--     la fabrique ne se mettent pas derrière eux — mais toute fonctionnalité
--     nouvelle naît derrière un flag OFF).
--
-- CE QUE CE FICHIER NE POSE PAS — écrit pour qu'on ne le cherche pas
--   • aucune valeur : voir ci-dessus ;
--   • aucune table du `07-` §1 : elles existent (C4-L1) ;
--   • `provenances_admises_source` sur `exercices_types_crans` reste NULL et
--     son domicile est `exercices_types_modes_source` — le `02-` §2.3 écrit
--     « déclaré par le type, pas par le cran » et « aucun cran ne le borne »,
--     et le `04-` §0 « sa valeur est donc la même sur les neuf crans ; la
--     répéter neuf fois lui donnerait neuf domiciles ». La plage varie en
--     revanche AVEC LE MODE (`composer` : les cinq provenances ; les quatre
--     modes réceptifs : `texte_auteur` seul). Un commentaire de colonne le dit.
--
-- PROTOCOLE : NORMAL (`SUIVI_SQL.md` règle 5) — tables neuves, additives,
-- gatées ; aucune table ni policy d'un flux existant n'est touchée. Seul
-- `scriptorium_params` reçoit une colonne de gate, patron déjà suivi par
-- `c2_l9_prompt_tuteur.sql` et `c4_l1_schema.sql`.
--
-- RÉPÉTITION À BLANC (`SUIVI_SQL.md` règle 6) : ne JAMAIS jouer ce fichier
-- entier dans une transaction d'essai — son `commit;` validerait la transaction
-- englobante. Copier le CORPS seul (entre `begin;` et `commit;`), puis après le
-- `rollback`, VÉRIFIER PAR REQUÊTE le retour à l'état d'avant.
--
-- Idempotence : create ... if not exists · add column if not exists.
-- Rollback : `c4_l8_doctrine_rollback.sql`.
-- ============================================================================

begin;

-- ════════════════════════════════════════════════════════════════════════════
-- 1. exercices_crans — les neuf crans
-- ════════════════════════════════════════════════════════════════════════════
-- `02-` §2.1 (le croisement geste × appui) et §2.2 (l'échelle : ce que chaque
-- cran commande). Le `07-` §1 pose que le `regime_v1vf` « n'est pas une
-- colonne » SUR L'EXERCICE — « la table des neuf crans le porte en colonne ».
-- C'est cette table-là. Elle est LUE, jamais écrite à la main.
create table if not exists exercices_crans (
  cran                   int  primary key check (cran between 1 and 9),
  code                   text not null unique,
  geste                  text not null check (geste in ('diagnostiquer','transformer','produire')),
  appui                  text not null check (appui in ('donné','nommé','absent')),
  fait                   text not null,          -- « ce que l'élève fait »
  palier_vise            text not null,
  -- Les quatre valeurs d'appui, plus la cible : `02-` §2.2, telles quelles.
  materiau_cible         text not null check (materiau_cible   in ('présent','null','présent ou null')),
  defaut                 text not null check (defaut           in ('présent','null')),
  distracteurs           text not null check (distracteurs     in ('présent','null')),
  reponse_attendue       text not null check (reponse_attendue in ('présent','null')),
  guide                  text not null check (guide            in ('null','complet','léger')),
  jugement               text not null check (jugement         in ('algorithmique','IA')),
  couverture_observables text not null check (couverture_observables in ('isole','exerce')),
  regime_v1vf            text not null,
  derive_at              timestamptz not null default now()
);
comment on table exercices_crans is
  'Les neuf crans (02- §2.1 et §2.2). DÉRIVÉE par scripts/derive-doctrine.py — jamais écrite à la main (07- §2, piège 38).';
comment on column exercices_crans.couverture_observables is
  'isole aux six crans qui isolent (1,3,4,5,7,9) · exerce aux trois crans de production (2,6,8) — 02- §2.3.2.';

-- ════════════════════════════════════════════════════════════════════════════
-- 2. exercices_durees — geste × grain
-- ════════════════════════════════════════════════════════════════════════════
-- `02-` §2.4 : « `duree_exercice_min` ne se déclare plus : elle se dérive du
-- GESTE et du GRAIN ». La FOURCHETTE reste l'information, l'ENTIER est la
-- valeur, et c'est la BORNE HAUTE — « un entier, jamais un intervalle ».
create table if not exists exercices_durees (
  geste     text not null check (geste in ('diagnostiquer','transformer','produire')),
  grain     text not null check (grain in ('micro','meso','macro')),
  borne_min int  not null check (borne_min > 0),
  borne_max int  not null check (borne_max > 0),
  duree_min int  not null check (duree_min > 0),   -- la borne HAUTE : la valeur
  derive_at timestamptz not null default now(),
  primary key (geste, grain),
  constraint durees_ordre_chk    check (borne_max >= borne_min),
  constraint durees_valeur_chk   check (duree_min = borne_max)
);
comment on table exercices_durees is
  'La dérivation de la durée, 02- §2.4. duree_min = borne HAUTE de la cellule : la seule valeur que le budget décompte.';

-- ════════════════════════════════════════════════════════════════════════════
-- 3. competences_modes_admis — la table des modes admis par compétence
-- ════════════════════════════════════════════════════════════════════════════
-- `02-` §3 : « une propriété de la COMPÉTENCE », indépendante de l'objet et de
-- l'exercice. Elle BORNE ce que `exercices_types_modes` peut porter, elle ne le
-- remplit pas. Refus n° 9 de l'import la lit.
create table if not exists competences_modes_admis (
  competence text not null check (competence in
    ('expression','argumentation','structure','connaissance','synthese','questionnement')),
  mode       text not null check (mode in
    ('composer','restituer','expliquer','évaluer','interroger')),
  derive_at  timestamptz not null default now(),
  primary key (competence, mode)
);
comment on table competences_modes_admis is
  'La table des modes admis par compétence (02- §3). DÉRIVÉE — jamais recopiée.';

-- ════════════════════════════════════════════════════════════════════════════
-- 4. exercices_types_modes_source — le `materiau_source` par objet × mode
-- ════════════════════════════════════════════════════════════════════════════
-- `04-` §0 : « Ce que chaque sous-section porte EN TÊTE : le `materiau_source`
-- du couple objet × mode, sa `provenance` et son `support` […] sa valeur est
-- donc la même sur les neuf crans. » Le `02-` §2.3 : « déclaré par le type, pas
-- par le cran […] aucun cran ne le borne : ce qui le borne est le MODE. »
-- D'où l'axe (type × mode), et non (type × cran).
create table if not exists exercices_types_modes_source (
  type_id             uuid not null references exercices_types(id) on delete cascade,
  mode                text not null check (mode in
    ('composer','restituer','expliquer','évaluer','interroger')),
  provenances_admises text[] not null default '{}',
  supports_admis      text[] not null default '{}',
  derive_at           timestamptz not null default now(),
  primary key (type_id, mode),
  constraint types_modes_source_prov_chk check (
    provenances_admises <@ array['null','genere','sujet','production_eleve','texte_auteur']),
  constraint types_modes_source_supp_chk check (
    supports_admis <@ array['phrase','extrait','texte'])
);
comment on table exercices_types_modes_source is
  'Le materiau_source admis par objet × mode (04- §0). C''est le DOMICILE de provenances_admises_source : '
  'la colonne homonyme d''exercices_types_crans reste NULL, le cran ne bornant pas la source (02- §2.3).';

-- ════════════════════════════════════════════════════════════════════════════
-- 5. exercices_routes — observable × objet × mode × cran
-- ════════════════════════════════════════════════════════════════════════════
-- Les lignes `<!-- ROUTAGE -->` d'`instances/04-*.md`, croisées aux `crans[]`
-- de l'objet (`04-` §0 : « derive-04.py croise les crans de chaque route avec
-- les crans[] de l'objet »). C'est la table que lit le refus n° 15 de l'import
-- (« un observable_isole […] qui n'est routé ni pour cet objet, ni pour ce
-- mode, ni pour ce cran ») et que lit la conception en ligne pour remplir
-- `couverture_observables` « sans une saisie de plus » (`02-` §6 B.1).
-- ⚠️ Une donnée que le §1 ne nomme pas : la forme physique appartient à la
-- session (`07-` §1 ; piège 3), mais la donnée EXISTE et EST NOMMÉE.
create table if not exists exercices_routes (
  id              uuid primary key default gen_random_uuid(),
  type_id         uuid not null references exercices_types(id) on delete cascade,
  objet_code      text not null,            -- redondance de lecture, jamais de décision
  mode            text not null check (mode in
    ('composer','restituer','expliquer','évaluer','interroger')),
  cran            int  not null check (cran between 1 and 9),
  competence      text not null check (competence in
    ('expression','argumentation','structure','connaissance','synthese','questionnement')),
  observable_code text not null,            -- le code technique, quand la fiche le donne
  observable_nom  text not null,            -- le nom lisible, celui de la colonne « Observable »
  -- « Où » : le fichier de `instances/` et la section qui portent le défaut
  -- injecté, la cible mode par mode et les consignes (`04-` §0).
  source_fichier  text not null,
  source_section  int  not null,
  derive_at       timestamptz not null default now(),
  constraint routes_cran_isole_chk check (cran in (1,3,4,5,7,9))
);
-- Une route est unique par (objet, mode, cran, compétence, SECTION D'ORIGINE) :
-- la même case ne se déclare pas deux fois.
-- ⚠️ La clé porte la SECTION, jamais le code technique. Plusieurs blocs
-- d'observable d'`instances/` isolent des aspects distincts d'UN MÊME champ de
-- la grille réceptive — `apports` à la Synthèse (§8 à §11), `recadrages` au
-- Questionnement (§7 à §9), `question_posee` (§2 et §4). Le domicile d'une
-- route est « le fichier de `instances/` et la section » (`04-` §0) ; le code
-- technique est ce que la fiche donne, et il se partage légitimement.
create unique index if not exists uk_routes_case
  on exercices_routes(type_id, mode, cran, competence, source_section);
create index if not exists idx_routes_lecture on exercices_routes(objet_code, mode, cran);
create index if not exists idx_routes_observable on exercices_routes(competence, observable_code);
comment on constraint routes_cran_isole_chk on exercices_routes is
  'Les crans 2, 6 et 8 sont de production : ils déclarent `exerce`, aucun observable n''y est isolé, '
  'et cette table n''a rien à en dire (04- §0). Leur banque de consignes est au 04- §14.';

-- ════════════════════════════════════════════════════════════════════════════
-- 6. exercices_consignes_isolees — la banque des six crans qui isolent
-- ════════════════════════════════════════════════════════════════════════════
-- La table « Les six crans qui isolent » de chaque bloc d'observable dans
-- `instances/04-*.md`. La clé est (compétence, section, cran) — la CONSIGNE
-- appartient à l'OBSERVABLE, pas à l'objet : un même texte sert tous les objets
-- que la route nomme. C'est le join avec `exercices_routes` qui donne la banque
-- du couple objet × mode × cran que le `02-` §6 B.1 exige.
-- Le BLOCAGE n° 3 de l'import la lit : « l'observable isolé n'a pas de consigne
-- écrite pour son cran — la route existe, la consigne manque » (`08-` §7.2).
create table if not exists exercices_consignes_isolees (
  competence      text not null check (competence in
    ('expression','argumentation','structure','connaissance','synthese','questionnement')),
  source_section  int  not null,
  cran            int  not null check (cran in (1,3,4,5,7,9)),
  observable_nom  text not null,
  observable_code_composition text not null default '',
  observable_code_reception   text not null default '',
  defaut_injecte  text not null,     -- « Le défaut injecté » du bloc
  appui           text not null,     -- la colonne « Appui » de la table
  consigne        text not null,     -- le texte, tel que la source le porte
  derive_at       timestamptz not null default now(),
  primary key (competence, source_section, cran)
);
comment on table exercices_consignes_isolees is
  'La banque de consignes des six crans qui isolent, dérivée de instances/04-*.md. '
  'Se joint à exercices_routes pour donner la banque objet × mode × cran (02- §6 B.1).';
comment on column exercices_consignes_isolees.consigne is
  'Le texte de départ. Le professeur en choisit une puis PEUT EN RÉÉCRIRE LA FORMULATION ; '
  'ce qu''il arrête vit sur l''instance sous le nom consigne_instanciee. La réécriture porte sur la '
  'formulation, JAMAIS sur l''observable — celui-ci vient de la route (02- §6 B.1 ; 04- §0).';

-- ════════════════════════════════════════════════════════════════════════════
-- 7. exercices_consignes_production — les quinze patrons du `04-` §14.1
-- ════════════════════════════════════════════════════════════════════════════
-- Aux crans 2, 6 et 8, `couverture_observables` vaut `exerce` : aucun
-- observable n'est isolé, et les tables de routage n'ont rien à en dire. Mais
-- le `02-` §6 B exige une banque de consignes pour le couple objet × mode ×
-- cran : « sans cette section, un exercice conçu en `production_guidee` arrive
-- sur un écran vide » (`04-` §14).
-- ⚠️ « Une consigne de cran de production ne nomme AUCUN observable » — une
-- consigne qui en nommerait un ferait d'`exerce` un `isole` sans que personne
-- l'ait décidé (`04-` §14.1 ; signalement de l'import, `08-` §7.3).
create table if not exists exercices_consignes_production (
  mode      text not null check (mode in
    ('composer','restituer','expliquer','évaluer','interroger')),
  cran      int  not null check (cran in (2,6,8)),
  patron    text not null,   -- porte les cases <objet>, <ce qui est servi>, <les appuis nommés>
  derive_at timestamptz not null default now(),
  primary key (mode, cran)
);
comment on table exercices_consignes_production is
  'Les quinze patrons du 04- §14.1 (mode × cran). Le verbe vient du mode ; <objet> est la case que '
  'remplit l''objet du 02- §1 ; <ce qui est servi> et <les appuis nommés> renvoient au §14.2.';

-- ════════════════════════════════════════════════════════════════════════════
-- 8. exercices_guides_production — les guides du `04-` §14.2
-- ════════════════════════════════════════════════════════════════════════════
-- Une ligne par objet, plus les déclinaisons au `genre` des TROIS OBJETS
-- TERMINAUX, et d'eux seuls (`04-` §14.2). `genre` NULL = la ligne de l'objet ;
-- `genre` renseigné = la déclinaison du cran 6.
-- Le cran 8 n'a pas de colonne : « l'appui y est absent, et le `02-` §2.3.4
-- écrit "rien à déclarer" ».
create table if not exists exercices_guides_production (
  type_id     uuid not null references exercices_types(id) on delete cascade,
  objet_code  text not null,
  genre       text,                       -- NULL = la ligne de l'objet
  figure      text,                       -- « matériau » ou « plan » — sur la ligne de l'objet
  guide_cran2 text,                       -- ce qui est SERVI (guide complet)
  guide_cran6 text,                       -- ce qui est NOMMÉ (guide léger)
  derive_at   timestamptz not null default now()
);
create unique index if not exists uk_guides_production
  on exercices_guides_production(type_id, coalesce(genre, ''));
comment on table exercices_guides_production is
  'Les guides des crans 2 et 6 (04- §14.2). Écrite À LA MAIN dans la source et dérivée d''elle : '
  '« aucun contrôle machine ne la vérifie — c''est le seul endroit du document où une erreur ne sera '
  'rattrapée par personne » (04- §14).';

-- ════════════════════════════════════════════════════════════════════════════
-- 9. doctrine_derivation — le journal, et ce qui rend la divergence visible
-- ════════════════════════════════════════════════════════════════════════════
-- « Dérive-les des sources par un script, AVEC UN CONTRÔLE QUI SAIT DIRE QUAND
-- ELLES ONT DIVERGÉ » (piège 38). Deux divergences possibles, et deux gardes :
--   (a) la SOURCE a bougé depuis la dérivation → `empreintes` porte le sha256
--       de chaque fichier lu, et le contrôle les recalcule ;
--   (b) la BASE a bougé depuis la dérivation → `derive-doctrine.py --verifie`
--       reconstruit les lignes attendues et les diffe symétriquement.
-- S'y ajoute le crible « cite ou refuse » de `noyau/doctrine.py`, qui arrête le
-- script AVANT d'écrire si une déclaration a bougé mot pour mot.
create table if not exists doctrine_derivation (
  id          uuid primary key default gen_random_uuid(),
  derive_at   timestamptz not null default now(),
  racine      text not null,      -- le dépôt de conception lu, en chemin absolu
  outil       text not null,      -- l'outil et sa version
  resume      text not null,      -- « 13 objets · 9 crans · … · 544 routes »
  empreintes  jsonb not null,     -- { "02-exercices.md": "<sha256>", … }
  comptes     jsonb not null      -- { "routes": 544, "consignes_isolees": …, … }
);
create index if not exists idx_doctrine_derivation_at on doctrine_derivation(derive_at desc);
comment on table doctrine_derivation is
  'Le journal de dérivation. La ligne la plus récente dit contre QUELLES sources la base a été remplie ; '
  'le contrôle de divergence compare les empreintes et les lignes.';

-- ════════════════════════════════════════════════════════════════════════════
-- 10. LA RLS — patron `c1_rls_eleve.sql`, posture de C4-L1
-- ════════════════════════════════════════════════════════════════════════════
-- « Toutes les écritures passent par le serveur ; lecture élève : ses propres
-- lignes, strictement » (`07-` §1). Ces neuf tables ne portent AUCUNE ligne
-- d'élève : RLS active, policy PROF `for all`, aucune policy élève — la même
-- posture que C4-L1, `scriptorium_rag_l1.sql` §D et `c7_quazian_rls_eleve.sql`.
-- ⚠️ Une seule policy par table et par rôle : les policies sont OR'ées, un
-- doublon rouvrirait ce qu'on ferme (piège documenté par `c1_rls_eleve.sql`).
do $rls$
declare t text;
begin
  foreach t in array array[
    'exercices_crans','exercices_durees','competences_modes_admis',
    'exercices_types_modes_source','exercices_routes',
    'exercices_consignes_isolees','exercices_consignes_production',
    'exercices_guides_production','doctrine_derivation'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_prof_all', t);
    execute format($p$create policy %I on %I for all
        using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
        with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))$p$,
      t || '_prof_all', t);
  end loop;
end $rls$;

-- ════════════════════════════════════════════════════════════════════════════
-- 11. L'INTERRUPTEUR PROPRE — `fabrique_actif`, à OFF
-- ════════════════════════════════════════════════════════════════════════════
-- Piège 41 : la fabrique doit MARCHER pendant que les trois interrupteurs du
-- `07-` §1.5 sont à OFF — « aucun ne nomme le professeur qui prépare : ne mets
-- pas ses écrans derrière eux ». La convention du dépôt reste due (« toute
-- fonctionnalité nouvelle naît derrière un flag OFF ») : un interrupteur
-- PROPRE, au même emplacement que les existants, à OFF.
-- ⚠️ `default false` SANS backfill : la ligne singleton existe déjà et prend le
-- défaut. Aucun `update` — rien ne peut allumer par accident.
-- ⚠️ Les trois du `07-` restent à OFF jusqu'à la recette : ce fichier n'y touche pas.
alter table scriptorium_params add column if not exists fabrique_actif boolean not null default false;
comment on column scriptorium_params.fabrique_actif is
  'C4-L8 — les cinq écrans de la fabrique du professeur. OFF par convention de dépôt. '
  'Distinct des trois interrupteurs du 07- §1.5, qui commandent les ÉLÈVES, le ROUTEUR et l''AFFICHAGE '
  'et ne nomment pas le professeur qui prépare (piège 41).';

commit;

-- ============================================================================
-- VÉRIFICATION APRÈS EXÉCUTION — à jouer telle quelle
-- ============================================================================
-- Les neuf tables existent, sont vides (le script de dérivation ne s'est pas
-- encore exécuté), et l'interrupteur est à OFF sans avoir touché les trois
-- autres.
--
-- select
--   (select count(*) from information_schema.tables where table_schema='public'
--      and table_name in ('exercices_crans','exercices_durees','competences_modes_admis',
--        'exercices_types_modes_source','exercices_routes','exercices_consignes_isolees',
--        'exercices_consignes_production','exercices_guides_production','doctrine_derivation')) as tables_posees,  -- 9
--   (select count(*) from exercices_crans) as crans,          -- 0 avant dérivation
--   (select count(*) from exercices_routes) as routes,        -- 0 avant dérivation
--   (select count(*) from doctrine_derivation) as derivations,-- 0 avant dérivation
--   (select fabrique_actif from scriptorium_params limit 1) as fabrique_off,  -- false
--   (select (exercices_actif or routeur_actif or competences_affichage_actif) = false
--      from scriptorium_params limit 1) as les_trois_toujours_a_off;          -- true
--
-- Et la RLS : neuf tables, neuf policies prof, aucune policy élève.
-- select count(*) as policies_prof from pg_policy
--  where polrelid::regclass::text in ('exercices_crans','exercices_durees','competences_modes_admis',
--    'exercices_types_modes_source','exercices_routes','exercices_consignes_isolees',
--    'exercices_consignes_production','exercices_guides_production','doctrine_derivation');  -- 9
-- ============================================================================
