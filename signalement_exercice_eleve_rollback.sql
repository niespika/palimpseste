-- ============================================================================
-- RETOUR ARRIÈRE de `signalement_exercice_eleve.sql`.
-- ----------------------------------------------------------------------------
-- ⛔⛔ IL DÉTRUIT DE LA PAROLE D'ÉLÈVE. La table porte des textes écrits à la
--    main par des élèves — « explique le problème dans tes mots » —, et rien
--    ailleurs n'en garde copie. Un `drop table` les perd DÉFINITIVEMENT.
--    ⭐ LE RELEVÉ D'ABORD (bloc 0), toujours, et on le garde hors de la base.
--
-- ⚠️ L'ordre compte : la colonne d'interrupteur se retire AVANT la table, sinon
--    un écran encore déployé lirait un `signalement_exercice_actif` à `true`
--    contre une table qui n'existe plus.
--
-- ⚠️ CE ROLLBACK NE REMET AUCUN DÉPÔT EN PLACE. Les arbitrages « confirmé » ont
--    posé `exercices_depots.statut = 'retire'` : ces dépôts RESTENT retirés, et
--    c'est voulu — le retrait est une décision du professeur, pas une trace de
--    cette table. Pour les remettre, il faut le geste inverse, un par un.
-- ============================================================================

-- ── 0. LE RELEVÉ — à copier hors base AVANT toute destruction ──────────────
-- select s.signale_at, s.arbitrage, s.arbitre_at, p.display_name, s.exercice_id, s.texte
--   from public.exercices_signalements_eleve s
--   join public.profiles p on p.id = s.eleve_id
--  order by s.signale_at;

begin;

-- ── 1. L'interrupteur d'abord ──────────────────────────────────────────────
alter table public.scriptorium_params
  drop column if exists signalement_exercice_actif;

-- ── 2. La table ensuite ────────────────────────────────────────────────────
drop policy if exists exercices_signalements_eleve_prof_all
  on public.exercices_signalements_eleve;
drop table if exists public.exercices_signalements_eleve;

commit;

-- ============================================================================
-- VÉRIFICATION — les deux drapeaux doivent être à `t`.
-- ============================================================================
-- select
--   (select count(*) from information_schema.tables
--     where table_schema = 'public' and table_name = 'exercices_signalements_eleve') = 0
--       as table_partie,
--   (select count(*) from information_schema.columns
--     where table_schema = 'public' and table_name = 'scriptorium_params'
--       and column_name = 'signalement_exercice_actif') = 0
--       as interrupteur_parti;
