-- ============================================================================
-- C4 — LE STATUT DE RECETTE DÉMÉNAGE LÀ OÙ LA DOCTRINE LE MET.
-- ----------------------------------------------------------------------------
-- ⛔ LE DÉFAUT QUE CE FICHIER FERME, et il est silencieux.
--
-- Le `07-` §1.3 pose que « une compétence déclarée `evaluee` l'est POUR TOUTES
-- LES CLASSES » : le statut de recette est une propriété DE LA COMPÉTENCE.
-- Il était pourtant stocké PAR ÉLÈVE — `competences_niveaux(eleve_id,
-- competence)` et `monitoring_niveaux(eleve_id, sous_dimension)`. Un fait global
-- rangé par élève doit être re-propagé à CHAQUE inscription, et rien ne le
-- faisait :
--
--   1. `poser_statut_recette` est un INSTANTANÉ — `select … from inscriptions
--      where statut = 'active'` au moment de l'appel. Un élève inscrit APRÈS
--      n'a jamais de ligne.
--   2. Aucun trigger sur `inscriptions`, et AUCUNE écriture applicative :
--      vérifié par balayage du dépôt, la RPC est le seul écrivain.
--   3. `lireLesNiveaux` (`utils/routeur/donnees.ts`) rend LES LIGNES QUI
--      EXISTENT. Pour un élève sans ligne il rend un tableau VIDE : ses
--      compétences ne sont pas `mesuree_silencieusement`, elles sont ABSENTES,
--      et le routeur n'a rien à cibler. `utils/deroule/mesure.ts`, lui, retombe
--      sur `mesuree_silencieusement` — donc ni « se juger », ni palier au retour.
--   4. Le Monitoring porte le MÊME défaut, deux fois : sa RPC est le même
--      instantané, et `utils/chaine/monitoring.ts` fait un `upsert` SANS
--      `statut_recette`, donc un élève neuf naît au défaut de la colonne.
--
-- ⚠️ Conséquence pratique : LES ÉLÈVES INSCRITS À LA RENTRÉE seraient hors du
--    routeur, sans « se juger » et sans palier — EN SILENCE, sans une alerte.
--    Une recette jouée sur les élèves d'aujourd'hui ne peut pas le voir : eux
--    ont leurs lignes.
--
-- ⭐ CE QUE FAIT CE FICHIER. Le statut sort de l'état par élève et prend sa
--    propre table, à UNE ligne par compétence. Il n'y a alors plus rien à
--    propager : un élève inscrit en septembre hérite parce qu'il n'y a qu'une
--    vérité, et le défaut ne peut pas revenir.
--
-- ⛔ CE QU'IL NE FAIT PAS. Il ne DROPPE aucune colonne. `competences_niveaux.
--    statut_recette` et `monitoring_niveaux.statut_recette` deviennent DORMANTES
--    et sont commentées comme telles — leur retrait est un geste destructif, il
--    demande sa propre décision et son propre fichier.
--
-- ⚠️ PROTOCOLE : migration ADDITIVE ET GATÉE (C4, les six interrupteurs à OFF,
--    aucun flux existant — ni Aletheia, ni Fragments, ni Quazian, ni Codex, ni
--    auth). Règle 5 du `SUIVI_SQL.md` : protocole NORMAL. Répétition à blanc
--    CORPS SEUL (règle 6 — ne pas inclure le `begin;`/`commit;` de ce fichier).
--    Rollback : `c4_statut_recette_global_rollback.sql`.
-- ============================================================================

begin;

-- ── 1. La table : une ligne par compétence, et c'est tout ────────────────────
create table if not exists competences_statut_recette (
  competence text primary key
    check (competence in ('expression', 'argumentation', 'structure',
                          'connaissance', 'synthese', 'questionnement',
                          'monitoring')),
  statut_recette text not null default 'mesuree_silencieusement'
    check (statut_recette in ('evaluee', 'mesuree_silencieusement', 'differee')),
  -- « Poser un statut en écrit la date dans le même geste » (`07-` §1.3). Son
  -- seul lecteur est le recalcul de la lettre, « depuis les seules mesures
  -- postérieures à la recette ».
  statut_recette_pose_le timestamptz,
  updated_at timestamptz not null default now()
);

comment on table competences_statut_recette is
  'LE statut de recette, à UNE ligne par compétence (07- §1.3 : « une compétence declarée evaluee '
  'l''est POUR TOUTES LES CLASSES »). Il vivait par élève, ce qui obligeait à le re-propager à '
  'chaque inscription — et rien ne le faisait : tout élève inscrit après la pose repartait au '
  'défaut, en silence. Le monitoring y tient UNE ligne pour ses DEUX sous-dimensions (07- §1.4).';

-- ── 2. La reprise de l'existant — ET ELLE REFUSE DE DEVINER ─────────────────
-- ⚠️ Si deux élèves portent des statuts DIFFÉRENTS pour la même compétence,
--    aucune ligne ne fait autorité : choisir en silence figerait un arbitraire.
--    On s'arrête, et le professeur tranche.
do $reprise$
declare
  d_comp int;
  d_moni int;
begin
  select count(*) into d_comp from (
    select competence from competences_niveaux
     group by competence having count(distinct statut_recette) > 1) x;
  if d_comp > 0 then
    raise exception
      'ARRÊT : % compétence(s) portent des statuts DIFFÉRENTS selon l''élève. Aucune ligne ne fait '
      'autorité — trancher à l''écran des compétences, puis rejouer.', d_comp
      using errcode = 'check_violation';
  end if;

  select count(*) into d_moni from (
    select 1 from monitoring_niveaux
     having count(distinct statut_recette) > 1) y;
  if d_moni > 0 then
    raise exception
      'ARRÊT : le Monitoring porte des statuts DIFFÉRENTS selon l''élève ou la sous-dimension. '
      'Trancher à l''écran, puis rejouer.'
      using errcode = 'check_violation';
  end if;
end $reprise$;

-- Les six, depuis l'état par élève quand il existe.
insert into competences_statut_recette (competence, statut_recette, statut_recette_pose_le)
select competence, min(statut_recette), max(statut_recette_pose_le)
  from competences_niveaux
 group by competence
    on conflict (competence) do nothing;

-- Le Monitoring — UNE ligne pour ses deux sous-dimensions (`07-` §1.4).
insert into competences_statut_recette (competence, statut_recette)
select 'monitoring', min(statut_recette)
  from monitoring_niveaux
 having count(*) > 0
    on conflict (competence) do nothing;

-- Et celles dont aucun élève ne portait de ligne : elles naissent au défaut,
-- explicitement, plutôt que d'être absentes.
insert into competences_statut_recette (competence)
select c from unnest(array['expression', 'argumentation', 'structure', 'connaissance',
                           'synthese', 'questionnement', 'monitoring']) as c
    on conflict (competence) do nothing;

-- ── 3. La RPC des six — même contrat, même planchers, UNE ligne écrite ──────
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

  -- Plancher 1 — fiche non déposée → `differee`, « et ne peut pas être autre
  -- chose » (`01-` §3 ; `03-` §9). INCHANGÉ.
  if p_statut <> 'differee'
     and not exists (select 1 from competences_fiches f where f.competence = p_competence) then
    raise exception 'Plancher 03- §9 : la fiche de % n''est pas déposée — elle est differee et ne peut pas être autre chose.',
      p_competence using errcode = 'check_violation';
  end if;

  -- Plancher 2 — correspondance absente → non déclarable `evaluee`
  -- (`competences/monitoring.md` §4). INCHANGÉ.
  if p_statut = 'evaluee'
     and not exists (select 1 from competences_correspondance c where c.competence = p_competence) then
    raise exception 'Plancher competences/monitoring.md §4 : la correspondance de % n''est pas en base — non déclarable evaluee.',
      p_competence using errcode = 'check_violation';
  end if;

  -- ⭐ UNE SEULE LIGNE, ET ELLE VAUT POUR TOUS — y compris pour les élèves qui
  --    ne sont pas encore inscrits. C'est tout le geste de ce fichier.
  insert into competences_statut_recette (competence, statut_recette, statut_recette_pose_le, updated_at)
  values (p_competence, p_statut, p_pose_le, now())
      on conflict (competence) do update
     set statut_recette = excluded.statut_recette,
         statut_recette_pose_le = excluded.statut_recette_pose_le,
         updated_at = now();

  -- L'activation par classe EN DÉCOULE, SANS SECOND GESTE (§1.3 ; piège 7).
  -- Le défaut est ACTIF ; un opt-out déjà posé n'est jamais réécrit ici.
  if p_statut = 'evaluee' then
    insert into competences_actives_par_classe (classe_id, competence, active)
    select c.id, p_competence, true from classes c
        on conflict (classe_id, competence) do nothing;
  end if;

  -- ⚠️ LE RETOUR A CHANGÉ DE SENS, et l'écran le dit autrement : ce n'est plus
  --    « combien de lignes d'élève ont été écrites » — il n'y en a plus qu'une —
  --    mais À COMBIEN D'ÉLÈVES INSCRITS ce statut s'applique aujourd'hui. Il
  --    s'appliquera aux suivants sans qu'on rejoue quoi que ce soit.
  select count(distinct i.eleve_id) into n from inscriptions i where i.statut = 'active';
  return n;
end $fn$;

comment on function public.poser_statut_recette(text, text, timestamptz) is
  'Le seul chemin par lequel un statut de recette se pose (07- §1.3, §2 C4-L8). '
  'Vérifie les DEUX planchers mécaniques, jamais les trois conditions de banc (03- §9). '
  'Écrit UNE ligne dans competences_statut_recette — le statut vaut pour tous les élèves, '
  'y compris ceux qui ne sont pas encore inscrits. Rend le nombre d''élèves actifs couverts.';

-- ── 4. La RPC du Monitoring — même déménagement ─────────────────────────────
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
  -- Aucun plancher de correspondance : « elle n'a pas de correspondance »
  -- (competences/monitoring.md §4). Le statut vaut pour LES DEUX sous-dimensions,
  -- et c'est précisément pourquoi UNE ligne suffit.
  insert into competences_statut_recette (competence, statut_recette, statut_recette_pose_le, updated_at)
  values ('monitoring', p_statut, p_pose_le, now())
      on conflict (competence) do update
     set statut_recette = excluded.statut_recette,
         statut_recette_pose_le = excluded.statut_recette_pose_le,
         updated_at = now();
  select count(distinct i.eleve_id) into n from inscriptions i where i.statut = 'active';
  return n;
end $fn$;

comment on function public.poser_statut_recette_monitoring(text, timestamptz) is
  'Le statut du Monitoring, UNE LIGNE À L''ÉCRAN pour ses deux sous-dimensions (07- §1.4, piège 4). '
  'L''AVERTISSEMENT et la CONFIRMATION avant `evaluee` sont un geste d''écran ; rien d''autre ne le pose. '
  'Écrit dans competences_statut_recette, ligne `monitoring`. Rend le nombre d''élèves actifs couverts.';

-- ── 5. Les deux colonnes par élève deviennent DORMANTES ─────────────────────
-- ⛔ On ne les droppe PAS ici : un `drop column` est destructif et demande sa
--    propre décision. On les MARQUE, pour qu'aucun lecteur neuf ne les reprenne.
comment on column competences_niveaux.statut_recette is
  '⛔ DORMANTE depuis le déménagement du statut : LA VÉRITÉ EST DANS competences_statut_recette. '
  'Cette colonne n''est plus écrite ni lue ; elle garde sa dernière valeur et DÉRIVERA. '
  'Ne pas la relire. Son retrait demande son propre fichier.';
comment on column monitoring_niveaux.statut_recette is
  '⛔ DORMANTE depuis le déménagement du statut : la vérité est dans competences_statut_recette, '
  'ligne `monitoring`, UNE pour les deux sous-dimensions. Ne pas la relire.';

-- ── 6. RLS — le même patron que les vingt tables du socle ───────────────────
-- « Une seule policy par table et par rôle : les policies sont OR'ées, un
--   doublon rouvrirait ce qu'on ferme. »
alter table competences_statut_recette enable row level security;
drop policy if exists competences_statut_recette_prof_all on competences_statut_recette;
create policy competences_statut_recette_prof_all on competences_statut_recette for all
  using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

-- ── 7. Le constat — par requête, jamais supposé ─────────────────────────────
select
  (select count(*) from competences_statut_recette)                                  as lignes_de_statut,
  (select count(*) from competences_statut_recette where statut_recette = 'evaluee') as evaluees,
  (select count(*) from competences_statut_recette
    where competence = 'monitoring')                                                 as ligne_monitoring,
  (select count(*) from pg_policies
    where tablename = 'competences_statut_recette')                                   as policies,
  (select relrowsecurity from pg_class
    where oid = 'public.competences_statut_recette'::regclass)                        as rls_active,
  (select count(distinct eleve_id) from competences_niveaux)                          as eleves_avec_ancien_etat;

commit;
