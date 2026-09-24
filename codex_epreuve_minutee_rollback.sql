-- ============================================================================
-- Rollback de `codex_epreuve_minutee.sql`. N'exécuter qu'en cas de problème.
-- La porte disparaît (lecteur tolérant ⇒ OFF) : la conception et la passation
-- redeviennent celles d'hier, en un geste.
-- ⚠️ PERDUS : les durées, l'instant de lancement, l'heure d'ouverture et les consignes pratiques des
--    épreuves préparées. Le SUJET d'une épreuve à sujet libre, lui, RESTE : il vit
--    dans `consigne_instanciee`, qu'aucune ligne de ce fichier ne touche. Aucun
--    dépôt, aucune photo, aucune transcription, aucun retour n'est touché ; un
--    dépôt ouvert automatiquement reste ouvert (`ouvert_par_prof_at` est posé).
-- ============================================================================

-- constat de tête — TOLÉRANT : il ne lit pas les colonnes, qui peuvent ne plus exister.
select
  (select count(*) from information_schema.columns
     where table_name = 'exercices' and column_name in
       ('epreuve_redaction_min', 'epreuve_relecture_min', 'epreuve_debut_at', 'epreuve_ouverture_at',
        'consignes_pratiques'))
     as colonnes_presentes,
  (select count(*) from exercices) as exercices_avant;

begin;

alter table exercices drop constraint if exists exercices_epreuve_chk;
alter table exercices
  drop column if exists consignes_pratiques,
  drop column if exists epreuve_ouverture_at,
  drop column if exists epreuve_debut_at,
  drop column if exists epreuve_relecture_min,
  drop column if exists epreuve_redaction_min;
alter table scriptorium_params drop column if exists epreuve_minutee_actif;

commit;

-- constat de pied
select
  not exists (select 1 from information_schema.columns
                where table_name = 'exercices' and column_name in
                  ('epreuve_redaction_min', 'epreuve_relecture_min', 'epreuve_debut_at', 'epreuve_ouverture_at',
        'consignes_pratiques'))
    as colonnes_retirees,
  not exists (select 1 from pg_constraint where conname = 'exercices_epreuve_chk') as contrainte_retiree,
  not exists (select 1 from information_schema.columns
                where table_name = 'scriptorium_params' and column_name = 'epreuve_minutee_actif') as porte_retiree,
  (select count(*) from exercices) as exercices_intacts;
