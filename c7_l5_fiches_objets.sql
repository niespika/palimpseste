-- ============================================================================
-- C7 · L5 — LES FICHES DES OBJETS (`09-`, la tête de chaque fiche), dérivées :
-- ce que c'est, les constituants et leurs questions, le joint, le test, ce que
-- la fiche dit à l'élève, l'exemplaire, le contre-exemple. C'est ce que la
-- SEMAINE DE MÉTHODE présente (`10-` §7 ; `01-` v5.8 §3). Une ligne par objet,
-- ou par (objet, genre) quand la fiche se décline par genre.
-- Patron : `c7_l2_gabarit_base.sql`. La table est REMPLACÉE EN BLOC par
-- `scripts/derive-doctrine.py --sql` (delete + insert), jamais éditée à la main.
-- Rejouable. Rollback : `c7_l5_fiches_objets_rollback.sql`.
-- ============================================================================
begin;

create table if not exists exercices_fiches_objets (
  cle                  text primary key,                        -- objet · objet.genre
  type_id              uuid not null references exercices_types(id) on delete cascade,
  objet_code           text not null,
  genre                text,
  libelle              text not null,                           -- « L'argument »
  definition           text,                                    -- « Ce que c'est. »
  constituants         jsonb not null default '[]'::jsonb,      -- [{n, nom, facultatif, question}]
  joint                text,
  test                 text,
  dit_a_leleve         text,
  exemplaire           text,
  exemplaire_brouillon boolean not null default false,
  contre_exemple       text,                                    -- null tant que le 09- n'en porte pas
  derive_at            timestamptz not null default now()
);
alter table exercices_fiches_objets drop constraint if exists fiches_constituants_forme_chk;
alter table exercices_fiches_objets add constraint fiches_constituants_forme_chk
  check (jsonb_typeof(constituants) = 'array');

do $rls$
declare t text;
begin
  foreach t in array array['exercices_fiches_objets'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_prof_all', t);
    execute format($p$create policy %I on %I for all
        using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
        with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))$p$,
      t || '_prof_all', t);
  end loop;
end $rls$;

commit;

select
  (select count(*) from information_schema.tables where table_name = 'exercices_fiches_objets') = 1 as table_posee,
  (select count(*) from pg_policies where tablename = 'exercices_fiches_objets') = 1 as policy_posee;
