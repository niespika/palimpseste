-- ============================================================================
-- ROLLBACK — le statut de recette revient à l'état par élève.
-- ----------------------------------------------------------------------------
-- ⚠️ N'EXÉCUTER QU'EN CAS DE PROBLÈME, et **revenir au CODE d'abord** : les six
--    sites de chargement lisent `competences_statut_recette`. Retirer la table
--    sous ce code ferait échouer leurs requêtes (`42P01`), et l'écran des
--    compétences comme le routeur tomberaient — sans autre symptôme qu'un vide.
--
-- ⭐ CE QU'IL REND, ET C'EST L'ESSENTIEL : il RECOPIE le statut global dans les
--    lignes par élève AVANT de retirer la table. Sans cette recopie, l'ancien
--    état reprendrait sa dernière valeur d'avant le déménagement — c'est-à-dire
--    une valeur périmée, et la colonne mentirait par omission.
--
-- ⛔ CE QU'IL NE REND PAS : le défaut lui-même. Après ce rollback, tout élève
--    inscrit ensuite repart au défaut `mesuree_silencieusement`, en silence —
--    c'est très exactement le défaut que la migration fermait.
-- ============================================================================

begin;

-- ── 1. La recopie, AVANT tout retrait ───────────────────────────────────────
-- Les six : on écrit sur les lignes des inscrits actifs, et on crée celles qui
-- manquent — le geste qu'était `poser_statut_recette` avant le déménagement.
insert into competences_niveaux (eleve_id, competence, statut_recette, statut_recette_pose_le)
select distinct i.eleve_id, s.competence, s.statut_recette, s.statut_recette_pose_le
  from inscriptions i
 cross join competences_statut_recette s
 where i.statut = 'active'
   and s.competence <> 'monitoring'
    on conflict (eleve_id, competence) do update
   set statut_recette = excluded.statut_recette,
       statut_recette_pose_le = excluded.statut_recette_pose_le,
       updated_at = now();

-- Le Monitoring : sa ligne globale se redistribue sur les deux sous-dimensions.
insert into monitoring_niveaux (eleve_id, sous_dimension, statut_recette)
select distinct i.eleve_id, sd, s.statut_recette
  from inscriptions i
 cross join (values ('calibration_confiance'), ('lucidite_incompris')) as x(sd)
 cross join competences_statut_recette s
 where i.statut = 'active' and s.competence = 'monitoring'
    on conflict (eleve_id, sous_dimension) do update
   set statut_recette = excluded.statut_recette, updated_at = now();

-- ── 2. Les deux RPC reprennent leur forme d'avant ───────────────────────────
create or replace function public.poser_statut_recette(
  p_competence text, p_statut text, p_pose_le timestamptz default now())
returns int language plpgsql security definer set search_path = public as $fn$
declare n int;
begin
  if p_competence not in ('expression','argumentation','structure','connaissance',
                          'synthese','questionnement') then
    raise exception 'Compétence inconnue : % (07- §1.2 — les six identifiants nus).', p_competence
      using errcode = 'check_violation';
  end if;
  if p_statut not in ('evaluee','mesuree_silencieusement','differee') then
    raise exception 'Statut inconnu : % (01- §3).', p_statut using errcode = 'check_violation';
  end if;
  if p_statut <> 'differee'
     and not exists (select 1 from competences_fiches f where f.competence = p_competence) then
    raise exception 'Plancher 03- §9 : la fiche de % n''est pas déposée — elle est differee et ne peut pas être autre chose.',
      p_competence using errcode = 'check_violation';
  end if;
  if p_statut = 'evaluee'
     and not exists (select 1 from competences_correspondance c where c.competence = p_competence) then
    raise exception 'Plancher competences/monitoring.md §4 : la correspondance de % n''est pas en base — non déclarable evaluee.',
      p_competence using errcode = 'check_violation';
  end if;
  insert into competences_niveaux (eleve_id, competence, statut_recette, statut_recette_pose_le)
  select distinct i.eleve_id, p_competence, p_statut, p_pose_le
    from inscriptions i
   where i.statut = 'active'
      on conflict (eleve_id, competence) do update
     set statut_recette = excluded.statut_recette,
         statut_recette_pose_le = excluded.statut_recette_pose_le,
         updated_at = now();
  get diagnostics n = row_count;
  if p_statut = 'evaluee' then
    insert into competences_actives_par_classe (classe_id, competence, active)
    select c.id, p_competence, true from classes c
        on conflict (classe_id, competence) do nothing;
  end if;
  return n;
end $fn$;

create or replace function public.poser_statut_recette_monitoring(
  p_statut text, p_pose_le timestamptz default now())
returns int language plpgsql security definer set search_path = public as $fn$
declare n int;
begin
  if p_statut not in ('evaluee','mesuree_silencieusement','differee') then
    raise exception 'Statut inconnu : % (01- §3).', p_statut using errcode = 'check_violation';
  end if;
  if p_statut <> 'differee'
     and not exists (select 1 from competences_fiches f where f.competence = 'monitoring') then
    raise exception 'Plancher 03- §9 : la fiche du Monitoring n''est pas déposée.'
      using errcode = 'check_violation';
  end if;
  insert into monitoring_niveaux (eleve_id, sous_dimension, statut_recette)
  select distinct i.eleve_id, sd, p_statut
    from inscriptions i
   cross join (values ('calibration_confiance'),('lucidite_incompris')) as s(sd)
   where i.statut = 'active'
      on conflict (eleve_id, sous_dimension) do update
     set statut_recette = excluded.statut_recette, updated_at = now();
  get diagnostics n = row_count;
  return n;
end $fn$;

-- ── 3. Les deux colonnes reprennent leur commentaire d'avant ────────────────
comment on column competences_niveaux.statut_recette is null;
comment on column monitoring_niveaux.statut_recette is null;

-- ── 4. Le retrait, en dernier ───────────────────────────────────────────────
drop policy if exists competences_statut_recette_prof_all on competences_statut_recette;
drop table if exists competences_statut_recette;

-- ── 5. Le constat ───────────────────────────────────────────────────────────
select
  (select count(*) from pg_tables
    where schemaname = 'public' and tablename = 'competences_statut_recette') as table_partie,
  (select count(*) from competences_niveaux where statut_recette = 'evaluee') as lignes_evaluee_rendues,
  (select count(*) from monitoring_niveaux where statut_recette = 'evaluee')  as monitoring_rendu;

commit;
