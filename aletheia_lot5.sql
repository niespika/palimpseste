-- ============================================================================
-- Aletheia — Lot 5 : capstone (carte d'architecture finale)
-- ----------------------------------------------------------------------------
-- - Prompt éditable du capstone dans aletheia_params (prompt_capstone).
-- - Statut de génération sur aletheia_capstone (async after() + polling, comme
--   les retours) : PENDING (génération en cours) / READY / ERROR.
-- La table aletheia_capstone (id, scriptorium_livre_id, eleve_id, contenu jsonb,
-- created_at, unique(eleve_id, scriptorium_livre_id)) + sa RLS existent (Lot 2).
--
-- ⚠️ COUPLAGE CODE ↔ MIGRATION : à exécuter avec/avant le déploiement du code.
-- ============================================================================

begin;

alter table aletheia_params
  add column if not exists prompt_capstone text;

alter table aletheia_capstone
  add column if not exists statut text not null default 'PENDING';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'aletheia_capstone_statut_chk') then
    alter table aletheia_capstone
      add constraint aletheia_capstone_statut_chk check (statut in ('PENDING', 'READY', 'ERROR'));
  end if;
end $$;

alter table aletheia_capstone
  add column if not exists erreur_at timestamptz;

commit;
