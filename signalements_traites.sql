-- ============================================================================
-- SIGNALEMENTS — « CAS TRAITÉ », la seule mécanique de sortie de la file.
-- (Louis, 11/09/2026 : « plutôt qu'une mécanique bizarre qui peut planter, il
--  faut que ce qui fait qu'un cas reste à trancher, c'est que je n'ai pas
--  cliqué sur "traité" ».)
-- ----------------------------------------------------------------------------
-- ⭐ MESURÉ EN PROD AVANT D'ÉCRIRE : 8 signalements en attente, 6 sur des dépôts
--    `clos`. L'arbitrage « l'exercice a un problème » RETIRE le dépôt du comptage
--    et REFUSE un dépôt clos — donc ces six-là ne pouvaient pas sortir de la
--    liste. La sortie de la liste était couplée à l'assiduité ; elle ne l'est
--    plus : elle est un GESTE du professeur, daté, par exercice.
--
-- ⭐ La règle (utils/signalements/regles.ts:estATraiter) : un exercice est à
--    traiter s'il porte un signalement plus récent (signale_at ou maj_at) que
--    son `traite_at`, ou s'il n'a pas de ligne ici. Un nouveau signalement
--    ramène donc l'exercice dans la file sans effacer le geste précédent.
--
-- Additive : une table neuve, aucune colonne touchée, aucun interrupteur.
-- Retour arrière : signalements_traites_rollback.sql.
-- ============================================================================

create table if not exists public.exercices_signalements_traites (
  exercice_id uuid primary key references public.exercices(id) on delete cascade,
  traite_at   timestamptz not null default now(),
  traite_par  uuid references public.profiles(id) on delete set null
);

comment on table public.exercices_signalements_traites is
  'Le professeur a coché « cas traité » sur cet exercice signalé, à cette date. '
  'La file /prof/signalements ne montre que les exercices dont un signalement est plus '
  'récent que traite_at (ou sans ligne ici). Ne touche ni l''assiduité ni les dépôts.';

alter table public.exercices_signalements_traites enable row level security;
drop policy if exists exercices_signalements_traites_prof_all
  on public.exercices_signalements_traites;
create policy exercices_signalements_traites_prof_all
  on public.exercices_signalements_traites
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'prof'));

-- Vérification
select count(*) as lignes_traites from public.exercices_signalements_traites;
