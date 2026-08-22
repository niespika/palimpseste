-- ============================================================================
-- C4 · L5 — ROLLBACK. N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- ----------------------------------------------------------------------------
-- ⚠️ DESTRUCTIF DE CE QUE LES COLONNES PORTENT :
--   · les RETOURS déjà engendrés perdent leur segmentation (retour au `text`,
--     donc à un bloc que l'écran devrait découper) — la conversion inverse
--     n'existe pas : le fichier REFUSE de partir si `exercices_retours` porte
--     des lignes ;
--   · les mesures de Monitoring déjà écrites refuseraient la liste fermée
--     d'avant (`spontane` / `sollicite`) — même refus ;
--   · les BAILS en cours sont perdus : un job réclamé au moment du rollback
--     reste `en_cours` sans expiration, et il faudra le remettre à la main.
--
-- ⚠️ Le retrait de `chaine_actif` NE RALLUME RIEN : il était à OFF. Les trois
--    interrupteurs du `07-` §1.5 et `fabrique_actif` ne sont pas touchés.
--
-- LIRE D'ABORD le bloc de constat ci-dessous : il compte ce qui va partir.
-- ============================================================================

-- ── Constat, AVANT toute chose ─────────────────────────────────────────────
select
  (select count(*) from public.exercices_retours)      as retours_qui_redeviennent_un_bloc,
  (select count(*) from public.monitoring_mesures)     as mesures_monitoring_en_base,
  (select count(*) from public.competences_mesures
     where depot_id is not null)                       as mesures_sous_l_index_d_idempotence,
  (select count(*) from public.exercices_jobs
     where statut = 'en_cours')                        as jobs_dont_le_bail_sera_perdu,
  (select chaine_actif from public.scriptorium_params limit 1) as interrupteur_avant_retrait;

begin;

-- ⚠️ CE FICHIER CONVERTIT, IL NE REFUSE PLUS. Un rollback qui ne part qu'à
--    base vide n'est pas un rollback : il devient inutilisable dès le premier
--    dépôt traité, c'est-à-dire exactement au moment où l'on découvrirait le
--    problème qui le motive. Les deux conversions sont mécaniques et ont été
--    éprouvées sans perte (aller-retour jsonb → text → jsonb, accents,
--    guillemets échappés et antislash compris).
do $$
declare n bigint;
begin
  select count(*) into n from public.monitoring_mesures
   where source not in ('spontanee', 'sollicitee');
  if n > 0 then
    raise exception 'REFUS : % mesure(s) de Monitoring portent une `source` hors des deux '
      'valeurs connues — la conversion ne sait pas quoi en faire.', n;
  end if;
end $$;

-- Le Monitoring revient à l'orthographe d'avant. La donnée est conservée.
update public.monitoring_mesures
   set source = case source when 'spontanee' then 'spontane' else 'sollicite' end
 where source in ('spontanee', 'sollicitee');

alter table public.exercices_retours drop constraint if exists retours_texte_segmente_chk;
-- `jsonb::text` rend le JSON sérialisé : la segmentation n'est pas PERDUE, elle
-- redevient un bloc que l'écran devrait découper. C'est le sens du retour arrière.
alter table public.exercices_retours
  alter column texte type text using texte::text,
  alter column texte_edite_par_prof type text using texte_edite_par_prof::text;
drop index if exists public.uk_monitoring_depot_sous_dimension;
drop function if exists public.retour_segmente_bien_forme(jsonb, boolean);
drop function if exists public.retour_segmente_bien_forme(jsonb);
drop function if exists public.chaine_depense_du_mois(timestamptz);

drop index if exists public.uk_mesures_depot_competence;

alter table public.monitoring_mesures drop constraint if exists monitoring_mesures_source_check;
alter table public.monitoring_mesures
  add constraint monitoring_mesures_source_check
  check (source in ('spontane', 'sollicite'));

alter table public.exercices_jobs drop constraint if exists exercices_jobs_statut_chk;
drop index if exists public.idx_jobs_reclamables;
alter table public.exercices_jobs drop column if exists bail_expire_at;

alter table public.scriptorium_params drop column if exists chaine_actif;

commit;

-- ── Vérification du retour arrière ─────────────────────────────────────────
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'scriptorium_params'
      and column_name = 'chaine_actif') = 0                                as interrupteur_retire,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_jobs'
      and column_name = 'bail_expire_at') = 0                              as bail_retire,
  (select count(*) from pg_indexes
    where schemaname = 'public' and indexname = 'uk_mesures_depot_competence') = 0
                                                                           as index_retire,
  (select data_type from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_retours'
      and column_name = 'texte') = 'text'                                  as retour_en_text,
  (select exercices_actif or routeur_actif or competences_affichage_actif or fabrique_actif
     from public.scriptorium_params limit 1) = false                       as les_quatre_toujours_a_off;
