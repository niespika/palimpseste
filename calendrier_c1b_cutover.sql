-- ============================================================================
-- Calendrier — Lot C1b : bascule Fragments → semestre global (CASSANT)
-- ----------------------------------------------------------------------------
-- La période propre à Fragments (fragments_semestres) disparaît : on copie ses
-- lignes dans `semesters` (IDs identiques → les valeurs semestre_id existantes
-- restent valides, le cookie de sélection aussi), on retargue les FK, puis on
-- drop l'ancienne table.
--
-- ⚠ À déployer EN MÊME TEMPS que les éditions de code C1b (tous les lecteurs de
-- fragments_semestres pointent désormais sur semesters).
--
-- Prérequis : calendrier_c1a.sql (table semesters) déjà appliqué.
-- Idempotent : tout est gardé par l'existence de fragments_semestres ; un second
-- passage est un no-op. Transaction → un échec partiel est annulé en entier.
-- ============================================================================

begin;

do $$
declare r record;
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'fragments_semestres'
  ) then

    -- 1. Copier les semestres (mêmes IDs ; label→name, courant→is_active).
    insert into semesters (id, name, start_date, end_date, is_active, created_at)
    select id, label, date_debut, date_fin, courant, created_at
      from fragments_semestres
    on conflict (id) do nothing;

    -- 2. Retarguer les FK semestre_id → semesters. Les noms de contraintes en
    --    base sont inconnus (tables live-DB) → on les retrouve via pg_constraint.
    for r in
      select con.conname, rel.relname as tbl
        from pg_constraint con
        join pg_class rel  on rel.oid  = con.conrelid
        join pg_class fref on fref.oid = con.confrelid
       where con.contype = 'f'
         and fref.relname = 'fragments_semestres'
         and rel.relname in ('fragments_semaines', 'fragments_themes', 'fragments_syntheses')
    loop
      execute format('alter table %I drop constraint %I', r.tbl, r.conname);
    end loop;

    alter table fragments_semaines
      add constraint fragments_semaines_semestre_id_fkey
      foreign key (semestre_id) references semesters(id) on delete set null;

    alter table fragments_themes
      add constraint fragments_themes_semestre_id_fkey
      foreign key (semestre_id) references semesters(id) on delete cascade;

    alter table fragments_syntheses
      add constraint fragments_syntheses_semestre_id_fkey
      foreign key (semestre_id) references semesters(id) on delete cascade;

    -- 3. Dropper l'ancienne table.
    drop table fragments_semestres;
  end if;
end $$;

commit;
