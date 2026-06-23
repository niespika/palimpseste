-- ============================================================================
-- Lot R (R.1) — Renommage profond « Épreuve → Essai » (copie élève → « Dépôt »)
-- ----------------------------------------------------------------------------
-- Stratégie 1 « sans swap » (choix utilisateur) : la table d'ÉVALUATION garde
-- son nom physique interne `fragments_essais_epreuves` (invisible des
-- utilisateurs, présentée comme « Essai » dans l'app). La famille « copie » est
-- renommée en « dépôt ». Colonnes : epreuve_id → essai_id, date_epreuve →
-- date_essai ; les enfants de la copie passent de essai_id → depot_id.
--
-- Modèle après migration :
--   fragments_essais_epreuves   = l'ÉVALUATION (« Essai »)            [nom inchangé]
--   fragments_essais_classes    = liaison évaluation × classe         [ex fragments_epreuves_classes]
--   fragments_essai_depots      = la COPIE d'un élève (« Dépôt »)     [ex fragments_essais]
--   fragments_essai_depot_photos    = photos du dépôt                 [ex fragments_essais_photos]
--   fragments_essai_depot_analyses  = analyse IA du dépôt             [ex essais_analyses]
--
-- ⚠️ À exécuter EN UNE FOIS sur la base de preview, PUIS recharger le cache
--    PostgREST (dernière ligne) — sinon les embeds renvoient 404/null jusqu'à
--    expiration du cache. Le bucket de stockage `essais` n'est PAS renommé
--    (les chemins {eleve_id}/{depot.id}/… restent valides).
-- ============================================================================

begin;

-- ── 1. Copie d'élève : fragments_essais → fragments_essai_depots ─────────────
alter table fragments_essais rename to fragments_essai_depots;
-- FK vers l'évaluation : epreuve_id → essai_id
alter table fragments_essai_depots rename column epreuve_id to essai_id;
-- contrainte unique (hygiène de nom ; défensif si le nom diffère)
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'fragments_essais_inscription_epreuve_key') then
    alter table fragments_essai_depots
      rename constraint fragments_essais_inscription_epreuve_key
      to fragments_essai_depots_inscription_essai_key;
  end if;
end $$;

-- ── 2. Photos de la copie : fragments_essais_photos → fragments_essai_depot_photos
alter table fragments_essais_photos rename to fragments_essai_depot_photos;
alter table fragments_essai_depot_photos rename column essai_id to depot_id;

-- ── 3. Analyse IA de la copie : essais_analyses → fragments_essai_depot_analyses
alter table essais_analyses rename to fragments_essai_depot_analyses;
alter table fragments_essai_depot_analyses rename column essai_id to depot_id;

-- ── 4. Liaison évaluation × classe : fragments_epreuves_classes → fragments_essais_classes
alter table fragments_epreuves_classes rename to fragments_essais_classes;
alter table fragments_essais_classes rename column epreuve_id to essai_id;
alter table fragments_essais_classes rename column date_epreuve to date_essai;
alter index if exists idx_fragments_epreuves_classes_epreuve rename to idx_fragments_essais_classes_essai;
alter index if exists idx_fragments_epreuves_classes_classe  rename to idx_fragments_essais_classes_classe;
-- politiques RLS (renommage propre — corps réécrit sur le nouveau nom de table)
drop policy if exists fragments_epreuves_classes_prof_all on fragments_essais_classes;
create policy fragments_essais_classes_prof_all on fragments_essais_classes
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));
drop policy if exists fragments_epreuves_classes_eleve_read on fragments_essais_classes;
create policy fragments_essais_classes_eleve_read on fragments_essais_classes
  for select
  using (exists (
    select 1 from inscriptions i
    where i.classe_id = fragments_essais_classes.classe_id
      and i.eleve_id = auth.uid()
      and i.statut = 'active'
  ));

-- ── 5. Évaluation (nom physique conservé) : colonne date_epreuve → date_essai ─
alter table fragments_essais_epreuves rename column date_epreuve to date_essai;

commit;

-- ── 6. Recharger le schéma PostgREST (hors transaction) ──────────────────────
notify pgrst, 'reload schema';
