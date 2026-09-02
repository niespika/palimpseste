-- ============================================================================
-- C6 · L4 — LE BRANCHEMENT DE L'ESSAI DE FRAGMENTS : LE LIEN ENTRE L'ESSAI
--            D'UNE CLASSE ET SON INSTANCE DE LA CHAÎNE.
-- ----------------------------------------------------------------------------
-- « Poser un essai dans Fragments EST le planifier » : l'assignation d'un essai
-- à une classe écrit une ligne de plan `essai × fragments × classe × evaluatif`
-- (la typologie l'admettait, réservée à zéro ligne) ET une instance
-- `examen_diagnostique_essai`, `lieu = classe`, et « les deux se retrouvent
-- l'une l'autre ». Ce fichier pose LA clé qui les fait se retrouver.
--
-- ⭐ UNE COLONNE, UN SEUL LIEN. « Deux clés étrangères pour un seul lien sont
--    deux domiciles qui divergent » (`07-` §1.1). Le patron est
--    `exercices.exercice_planifie_id` — une colonne, deux lectures. Ici le lien
--    vit sur `fragments_essais_classes` (essai × classe), pointe l'INSTANCE, et
--    la ligne de plan se lit sur l'instance (`uk_exercices_planifie` fait
--    1 ligne ⇔ 1 instance).
--
-- ⛔⛔ JAMAIS une colonne sur `exercices_depots` ni sur `competences_mesures` :
--    « il n'a besoin d'aucune valeur qui le nomme » (`07-` §2, C6-L4). La chaîne
--    reconnaît l'essai par son exercice (`lieu`) et sa ligne de plan (`forme`).
--
-- ⛔ POURQUOI PAS UNE DÉRIVATION SANS COLONNE (module = fragments, type = essai,
--    classe, semaine) : elle n'est pas TOTALE — deux essais la même semaine dans
--    la même classe la casseraient.
--
-- ⭐ ADDITIVE ET INERTE. Colonne NULLABLE, sans `default`, FK `on delete set
--    null` : si l'instance disparaît, le lien s'efface et l'essai de Fragments
--    reste tel qu'il était. La table porte **0 ligne dans les deux bases**
--    (constaté par requête le 2026-09-02, avant écriture). Aucun code déployé
--    ne la lit. ⛔ Ce n'est PAS un septième interrupteur (`07-` §5).
--
-- Rollback : `c6_l4_essai_lien_instance_rollback.sql`.
-- ============================================================================

-- ── CONSTAT DE TÊTE — ce qu'on trouve avant d'écrire ────────────────────────
select
  (select count(*) from fragments_essais_classes)                     as liens_avant,
  (select count(*) from fragments_essais_epreuves)                    as essais_avant,
  (select count(*) from scriptorium_exercices_planifies
     where type_exercice = 'essai')                                   as lignes_essai_avant,
  (select count(*) from information_schema.columns
     where table_name = 'fragments_essais_classes'
       and column_name = 'exercice_id')                               as colonne_deja_posee;

begin;

alter table fragments_essais_classes
  add column if not exists exercice_id uuid null
    references exercices(id) on delete set null;

comment on column fragments_essais_classes.exercice_id is
  'C6-L4 — l''instance de la chaîne de mesure (exercices, type '
  'examen_diagnostique_essai, lieu = classe) que l''assignation de cet essai à '
  'cette classe a fait naître, avec sa ligne de plan essai × fragments '
  '(exercices.exercice_planifie_id). NULL = aucune instance (la classe n''avait '
  'pas de plan d''évaluation validé, ou le lien est antérieur à C6-L4). '
  '⛔ Le seul domicile du lien : la ligne de plan se lit sur l''instance.';

-- L'index sert la lecture inverse — « de quel essai cette instance vient-elle ? »
-- (la page de passation du professeur, dans Fragments). Partiel : il ne porte
-- que les liens branchés.
create index if not exists idx_fragments_essais_classes_exercice
  on fragments_essais_classes (exercice_id) where exercice_id is not null;

-- ── CONSTAT DE PIED — quatre drapeaux, tous attendus à `t` ──────────────────
select
  (select count(*) = 1 from information_schema.columns
     where table_name = 'fragments_essais_classes'
       and column_name = 'exercice_id')                               as colonne_posee,
  (select is_nullable = 'YES' and column_default is null
     from information_schema.columns
     where table_name = 'fragments_essais_classes'
       and column_name = 'exercice_id')                               as nullable_sans_defaut,
  (select count(*) = 1 from pg_constraint
     where conrelid = 'fragments_essais_classes'::regclass
       and contype = 'f'
       and pg_get_constraintdef(oid) ilike '%exercice_id%set null%')  as fk_set_null,
  (select count(*) = 1 from pg_indexes
     where tablename = 'fragments_essais_classes'
       and indexname = 'idx_fragments_essais_classes_exercice')        as index_pose,
  (select count(*) from fragments_essais_classes)                     as liens_intacts;

commit;
