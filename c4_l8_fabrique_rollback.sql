-- ============================================================================
-- ROLLBACK de `c4_l8_fabrique.sql` — N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- Fichier : c4_l8_fabrique_rollback.sql
-- ----------------------------------------------------------------------------
-- ⚠️ DESTRUCTIF DE CE QUE LES TABLES ET LES COLONNES PORTENT :
--   · les FICHES déposées et LEUR CORRESPONDANCE partent — il faudra les
--     redéposer ; la version citée par exercices_metacognition.questions_version
--     ne se reconstitue pas toute seule ;
--   · la DATE de chaque statut de recette part — et « updated_at ne peut pas en
--     tenir lieu » : elle est PERDUE, et le recalcul de la lettre à la bascule
--     n'aura plus de borne (07- §1.3) ;
--   · les BANQUES (textes, sujets, matériaux) partent, et avec elles l'identité
--     d'import qui rend l'idempotence possible : un redépôt du même fichier
--     recréera tout, sous de NOUVELLES clés de plateforme ;
--   · l'APPUI par cas part — defaut, distracteurs, reponse_attendue ;
--   · les RENVOIS des deux matériaux sur les instances partent.
--
-- ⚠️ NE TOUCHE PAS aux lignes de `scriptorium_contenus` que l'import a créées :
-- ce sont des textes du corpus du Scriptorium, que le RAG lit. Elles restent,
-- et c'est voulu — les retirer serait une opération sur un flux existant, à
-- mener à part, en protocole renforcé.
--
-- BLOC DE CONSTAT — À LIRE AVANT D'EXÉCUTER (il compte ce qui va partir).
-- select
--   (select count(*) from competences_fiches)          as fiches_deposees,
--   (select count(*) from competences_correspondance)  as blocs_de_correspondance,
--   (select count(*) from competences_niveaux where statut_recette_pose_le is not null) as dates_de_statut,
--   (select count(*) from exercices_textes)            as textes,
--   (select count(*) from exercices_sujets)            as sujets,
--   (select count(*) from exercices_materiaux)         as materiaux,
--   (select count(*) from exercices_cas)               as cas_avec_appui,
--   (select count(*) from exercices_imports)           as depots_de_fichier,
--   (select count(*) from exercices_depots where statut = 'retire') as depots_retires;
-- ⚠️ Si `depots_retires` > 0, le CHECK restauré REFUSERA : il faut d'abord
--    décider ce que deviennent ces dépôts.
-- ============================================================================

begin;

drop trigger if exists trg_cas_de_la_paire on exercices_cas;
drop function if exists public.garde_cas_de_la_paire();
drop trigger if exists trg_statut_porte_sa_date on competences_niveaux;
drop function if exists public.garde_statut_porte_sa_date();
drop function if exists public.poser_statut_recette(text, text, timestamptz);
drop function if exists public.poser_statut_recette_monitoring(text, timestamptz);

alter table exercices drop constraint if exists exercices_intervalles_chk;
alter table exercices drop constraint if exists exercices_observable_isole_chk;
alter table exercices drop column if exists materiau_cible_englobant;
alter table exercices drop column if exists materiau_cible_localisation;
alter table exercices drop column if exists materiau_cible_sujet_id;
alter table exercices drop column if exists materiau_cible_texte_id;
alter table exercices drop column if exists materiau_source_englobant;
alter table exercices drop column if exists materiau_source_localisation;
alter table exercices drop column if exists materiau_source_sujet_id;
alter table exercices drop column if exists materiau_source_texte_id;
alter table exercices drop column if exists signalements;
alter table exercices drop column if exists blocages;
alter table exercices drop column if exists bloque;
alter table exercices drop column if exists guide;
alter table exercices drop column if exists observable_isole_competence;
alter table exercices drop column if exists observable_isole_code;
alter table exercices drop column if exists import_id;
alter table exercices drop column if exists id_import;

alter table exercices_demonstrations drop constraint if exists demonstrations_statut_chk;
alter table exercices_demonstrations drop column if exists signalements;
alter table exercices_demonstrations drop column if exists statut;
alter table exercices_demonstrations drop column if exists import_id;
alter table exercices_demonstrations drop column if exists id_import;

drop table if exists exercices_cas;
drop table if exists exercices_materiaux;
drop table if exists exercices_sujets_cours;
drop table if exists exercices_sujets;
drop table if exists exercices_textes_cours;
drop table if exists exercices_textes;
drop table if exists exercices_imports;
drop table if exists competences_correspondance;
drop table if exists competences_fiches;

alter table competences_niveaux drop column if exists statut_recette_pose_le;

-- ⚠️ Restaure le CHECK d'origine — ÉCHOUERA s'il existe des dépôts `retire`.
alter table exercices_depots drop constraint if exists exercices_depots_statut_check;
alter table exercices_depots add constraint exercices_depots_statut_check
  check (statut in ('assigne','ouvert','v1_remis','retour_publie','vf_remis','clos','abandonne'));

alter table exercices_types drop constraint if exists exercices_types_mode_saisie_chk;

-- Le commentaire de C4-L1 sur l'empreinte est RÉTABLI TEL QUEL, bien qu'il ait
-- tort (piège 13). Un rollback restaure l'état d'avant, il ne corrige pas.
comment on column exercices_references.empreinte is
  'sha256 hex du texte source normalisé. UNIQUE : un texte ne se décompose jamais deux fois (07- §1.1). '
  'Immuable dès validee_at renseigné (trigger garde_reference_immuable).';

commit;

-- ============================================================================
-- VÉRIFICATION APRÈS ROLLBACK
-- select
--   (select count(*) from information_schema.tables where table_schema='public' and table_name in
--     ('competences_fiches','competences_correspondance','exercices_imports','exercices_textes',
--      'exercices_textes_cours','exercices_sujets','exercices_sujets_cours','exercices_materiaux',
--      'exercices_cas')) as restant,                                                     -- 0
--   (select count(*) from information_schema.columns where table_schema='public'
--      and table_name='competences_niveaux' and column_name='statut_recette_pose_le') as date_restante,  -- 0
--   (select count(*) from exercices_types) as quinze_types,                              -- 15
--   (select count(*) from exercices_crans) as doctrine_intacte;                          -- 9
-- ============================================================================
