-- ============================================================================
-- MIGRATION L7 — PHASE A (soft-delete RÉVERSIBLE) — refonte Scriptorium → Parcours
-- ----------------------------------------------------------------------------
-- Rend les unités pilote (type='unite') INVISIBLES côté prof ET élève, SANS rien
-- détruire. À jouer APRÈS `parcours_purge_l7_audit.sql` (audit validé, garde-fou
-- Aletheia = 0) et APRÈS confirmation de la base cible (prod vs bac-à-sable).
--
-- Aligné sur l'infra existante : `scriptorium_unites.supprime_at` est déjà écrit
-- par l'action `supprimerUnite` (per-unité) ; ici on le pose EN MASSE, scopé.
--   * les 5 pickers prof filtrent .is('supprime_at', null) → sélecteurs VIDES,
--     zéro crash (aucun .single() sur liste, défaut ?? []).
--   * la dépublication coupe EN PLUS la visibilité ÉLÈVE Quazian
--     (l'élève lit quazian_publications.flashcards_visibles = true).
--
-- Réversibilité SCOPÉE via `_mig.phase_a_flip` : ne ressuscite QUE les ids
-- réellement flippés (jamais les unités déjà soft-deletées / publications déjà
-- dépubliées AVANT la migration). Schéma `_mig` = NON exposé par PostgREST
-- (contrairement à `public`) → bookkeeping non lisible via l'API/clé anon.
--
-- Idempotence : rejouable (filtres supprime_at is null / flashcards_visibles=true
-- + unique(kind,id) + on conflict do nothing).
-- ============================================================================

begin;

  create schema if not exists _mig;
  create table if not exists _mig.phase_a_flip (
    kind      text        not null,          -- 'unite' | 'publication'
    id        uuid        not null,
    flippe_le timestamptz not null default now(),
    unique (kind, id)                         -- revert → re-flip : pas de doublon
  );
  -- RLS deny-all : satisfait l'advisor Supabase + défense en profondeur. Le schéma `_mig`
  -- n'est de toute façon PAS exposé par PostgREST et anon/authenticated n'ont aucun droit
  -- dessus ; sans policy, la table est deny-all. Le SQL Editor (rôle postgres) et le
  -- service_role BYPASSENT la RLS → les insert/update/réversion ci-dessous fonctionnent.
  alter table _mig.phase_a_flip enable row level security;

  -- 1) Unités : soft-delete des SEULES unités vivantes -----------------------
  insert into _mig.phase_a_flip (kind, id)
    select 'unite', id from scriptorium_unites
    where type = 'unite' and supprime_at is null
    on conflict (kind, id) do nothing;

  update scriptorium_unites set supprime_at = now()
    where id in (select id from _mig.phase_a_flip where kind = 'unite');

  -- 2) Publications Quazian : dépublier les SEULES réellement publiées --------
  insert into _mig.phase_a_flip (kind, id)
    select 'publication', id from quazian_publications
    where scriptorium_unite_id in (select id from scriptorium_unites where type = 'unite')
      and flashcards_visibles = true
    on conflict (kind, id) do nothing;

  update quazian_publications set flashcards_visibles = false
    where id in (select id from _mig.phase_a_flip where kind = 'publication');

commit;

-- ============================================================================
-- RÉVERSION SCOPÉE (décommenter pour annuler la Phase A) — ne ressuscite QUE
-- ce qui a été flippé ci-dessus.
-- ----------------------------------------------------------------------------
-- begin;
--   update scriptorium_unites   set supprime_at = null
--     where id in (select id from _mig.phase_a_flip where kind = 'unite');
--   update quazian_publications set flashcards_visibles = true
--     where id in (select id from _mig.phase_a_flip where kind = 'publication');
-- commit;
-- ============================================================================
-- Recette : pickers Quazian/Codex vides sans erreur ; cartes Quazian d'unité
-- disparues côté élève ; livres/Aletheia intacts. Observer quelques jours,
-- PUIS L8 (purge dure) après backup + confirmation de la perte Quazian/Codex.
-- ============================================================================
