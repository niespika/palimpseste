-- ============================================================================
-- Calendrier — correctifs de la revue adversariale
-- ----------------------------------------------------------------------------
-- Garantit en base l'invariant « au plus un semestre actif » : la bascule
-- definirSemestreActif se fait en deux UPDATE ; cet index empêche tout état à
-- deux actifs (qui casserait les .maybeSingle() sur is_active).
-- Sûr : il y a actuellement exactement un semestre actif.
-- ============================================================================

begin;

create unique index if not exists uniq_semesters_un_seul_actif
  on semesters (is_active)
  where is_active;

commit;
