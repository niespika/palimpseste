-- ============================================================================
-- Calendrier — Lot C1c : ancrage Quazian au semestre global
-- ----------------------------------------------------------------------------
-- Les « notes de semestre » Quazian (quazian_semester) agrégeaient TOUS les
-- quizz fermés, sans période. On les ancre au semestre global (comme Fragments) :
--   - quazian_quizzes.semester_id : à quel semestre appartient le quizz.
--   - quazian_semester.semester_id : la note est calculée PAR semestre.
--
-- Prérequis : calendrier_c1a.sql + calendrier_c1b_cutover.sql (semesters peuplé,
-- un semestre actif). Additif (rien droppé hormis l'ancienne contrainte d'unicité).
-- Idempotent.
-- ============================================================================

begin;

-- ── 1. Colonnes semester_id ─────────────────────────────────────────────────
alter table quazian_quizzes
  add column if not exists semester_id uuid references semesters(id) on delete set null;

alter table quazian_semester
  add column if not exists semester_id uuid references semesters(id) on delete cascade;

create index if not exists idx_quazian_quizzes_semester on quazian_quizzes(semester_id);

-- ── 2. Backfill ──────────────────────────────────────────────────────────────
-- Quizz : par fenêtre de dates (lance_at, sinon created_at), sinon semestre actif.
update quazian_quizzes q
   set semester_id = s.id
  from semesters s
 where q.semester_id is null
   and coalesce(q.lance_at::date, q.created_at::date) between s.start_date and s.end_date;

update quazian_quizzes q
   set semester_id = (select id from semesters where is_active limit 1)
 where q.semester_id is null
   and exists (select 1 from semesters where is_active);

-- Notes de semestre existantes → rattachées au semestre actif.
update quazian_semester
   set semester_id = (select id from semesters where is_active limit 1)
 where semester_id is null
   and exists (select 1 from semesters where is_active);

-- ── 3. Unicité : (classe_id, eleve_id) → (semester_id, classe_id, eleve_id) ──
-- L'ancienne unicité empêcherait une même paire (classe, élève) dans deux
-- semestres. On la retire (contrainte ET/OU index, noms inconnus en live-DB)
-- puis on pose la nouvelle.
do $$
declare r record;
begin
  -- Contraintes uniques sur exactement {classe_id, eleve_id}.
  for r in
    select con.conname
      from pg_constraint con
     where con.conrelid = 'quazian_semester'::regclass
       and con.contype = 'u'
       and (select array_agg(a.attname::text order by a.attname::text)
              from pg_attribute a
             where a.attrelid = con.conrelid and a.attnum = any(con.conkey)
           ) = array['classe_id', 'eleve_id']
  loop
    execute format('alter table quazian_semester drop constraint %I', r.conname);
  end loop;

  -- Index uniques (autonomes) sur exactement {classe_id, eleve_id}.
  for r in
    select c.relname as idxname
      from pg_index x
      join pg_class c on c.oid = x.indexrelid
      join pg_class t on t.oid = x.indrelid
     where t.relname = 'quazian_semester'
       and x.indisunique and not x.indisprimary
       and (select array_agg(a.attname::text order by a.attname::text)
              from pg_attribute a
             where a.attrelid = x.indrelid and a.attnum = any(x.indkey)
           ) = array['classe_id', 'eleve_id']
  loop
    execute format('drop index if exists %I', r.idxname);
  end loop;
end $$;

alter table quazian_semester
  drop constraint if exists quazian_semester_sem_classe_eleve_key;
alter table quazian_semester
  add constraint quazian_semester_sem_classe_eleve_key
  unique (semester_id, classe_id, eleve_id);

commit;
