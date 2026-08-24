-- ============================================================================
-- ROLLBACK — les colonnes dormantes du statut de recette renaissent.
-- ----------------------------------------------------------------------------
-- ⚠️ N'EXÉCUTER QU'EN CAS DE PROBLÈME. Il ne défait PAS le déménagement du
--    statut (`c4_statut_recette_global.sql`) : il rend seulement les colonnes
--    par élève, telles qu'elles étaient — c'est-à-dire DORMANTES, et remplies
--    depuis la valeur globale, qui est la bonne.
--
-- ⭐ CE QU'IL REND VRAIMENT. Les colonnes renaissent **avec leur contenu**, pas
--    vides : les remettre vides ferait mentir la base par omission — une ligne
--    d'élève sans statut n'existait jamais avant. Chaque élève inscrit reçoit
--    donc le statut GLOBAL de chaque compétence, et sa date.
--
-- ⛔ CE QU'IL NE REND PAS : aucune divergence par élève. Il n'y en avait aucune
--    — `c4_statut_recette_global.sql` refusait de partir s'il en avait trouvé.
--
-- ⚠️ ET LA GARDE REVIENT AUSSI. `trg_statut_porte_sa_date` est recréée sur
--    `competences_niveaux` ; celle de la table globale RESTE, parce que la règle
--    du `07-` §1.3 vaut pour la table qui porte le statut, et que c'est
--    désormais celle-là. Les deux peuvent coexister sans se gêner.
-- ============================================================================

begin;

-- ── 1. Les colonnes renaissent ──────────────────────────────────────────────
alter table competences_niveaux
  add column if not exists statut_recette text not null default 'mesuree_silencieusement';
alter table competences_niveaux
  add column if not exists statut_recette_pose_le timestamptz;
alter table monitoring_niveaux
  add column if not exists statut_recette text not null default 'mesuree_silencieusement';

-- ── 2. Leur domaine, tel qu'il était ────────────────────────────────────────
do $dom$
begin
  if not exists (select 1 from pg_constraint
                  where conname = 'competences_niveaux_statut_recette_check'
                    and conrelid = 'public.competences_niveaux'::regclass) then
    alter table competences_niveaux add constraint competences_niveaux_statut_recette_check
      check (statut_recette in ('evaluee', 'mesuree_silencieusement', 'differee'));
  end if;
  if not exists (select 1 from pg_constraint
                  where conname = 'monitoring_niveaux_statut_recette_check'
                    and conrelid = 'public.monitoring_niveaux'::regclass) then
    alter table monitoring_niveaux add constraint monitoring_niveaux_statut_recette_check
      check (statut_recette in ('evaluee', 'mesuree_silencieusement', 'differee'));
  end if;
end $dom$;

-- ── 3. LE CONTENU, depuis la valeur globale — jamais des colonnes vides ─────
update competences_niveaux n
   set statut_recette = s.statut_recette,
       statut_recette_pose_le = s.statut_recette_pose_le
  from competences_statut_recette s
 where s.competence = n.competence;

update monitoring_niveaux m
   set statut_recette = s.statut_recette
  from competences_statut_recette s
 where s.competence = 'monitoring';

-- ── 4. La garde d'origine revient sur competences_niveaux ───────────────────
create or replace function public.garde_statut_porte_sa_date()
returns trigger language plpgsql as $fn$
begin
  if tg_op = 'INSERT' then
    if new.statut_recette_pose_le is null then
      new.statut_recette_pose_le := now();
    end if;
    return new;
  end if;
  if new.statut_recette is distinct from old.statut_recette
     and new.statut_recette_pose_le is not distinct from old.statut_recette_pose_le then
    raise exception 'Garde 07- §1.3 : poser un statut en écrit la date DANS LE MÊME GESTE (élève %, compétence %).',
      old.eleve_id, old.competence using errcode = 'check_violation';
  end if;
  return new;
end $fn$;

drop trigger if exists trg_statut_porte_sa_date on competences_niveaux;
create trigger trg_statut_porte_sa_date
  before insert or update on competences_niveaux
  for each row execute function public.garde_statut_porte_sa_date();

-- ── 5. Le constat ───────────────────────────────────────────────────────────
select
  (select count(*) from information_schema.columns
    where table_name = 'competences_niveaux'
      and column_name in ('statut_recette', 'statut_recette_pose_le'))          as colonnes_rendues,
  (select count(*) from competences_niveaux where statut_recette = 'evaluee')   as lignes_evaluee,
  (select count(*) from competences_niveaux where statut_recette_pose_le is null) as sans_date,
  (select count(*) from monitoring_niveaux where statut_recette = 'evaluee')    as moni_evaluee,
  (select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid
    where c.relname = 'competences_niveaux' and t.tgname = 'trg_statut_porte_sa_date') as garde_rendue;

commit;
