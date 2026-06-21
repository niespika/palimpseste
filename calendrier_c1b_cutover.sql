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

    -- 2. Retarguer TOUTES les FK qui référencent fragments_semestres (quelle que
    --    soit la table : fragments_semaines/themes/syntheses/essais_epreuves…),
    --    en conservant nom, colonne et action ON DELETE d'origine.
    for r in
      select con.conname,
             rel.relname  as tbl,
             att.attname  as col,
             con.confdeltype as deltype
        from pg_constraint con
        join pg_class rel  on rel.oid  = con.conrelid
        join pg_class fref on fref.oid = con.confrelid
        join pg_attribute att on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
       where con.contype = 'f'
         and fref.relname = 'fragments_semestres'
    loop
      execute format('alter table %I drop constraint %I', r.tbl, r.conname);
      execute format(
        'alter table %I add constraint %I foreign key (%I) references semesters(id) on delete %s',
        r.tbl, r.conname, r.col,
        case r.deltype
          when 'c' then 'cascade'
          when 'n' then 'set null'
          when 'd' then 'set default'
          when 'r' then 'restrict'
          else 'no action'
        end
      );
    end loop;

    -- 3. Dropper l'ancienne table (plus aucune dépendance après le retarguage).
    drop table fragments_semestres;
  end if;
end $$;

commit;
